#!/usr/bin/env python3
"""Fail-closed, evidence-producing MathIllustrator verification runner.

Profiles: quick (development), local (pre-deployment), release (deployed certification).
Missing prerequisites => INCOMPLETE; failed executed check => FAIL. Always writes JSON.
"""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / 'tests' / 'verification' / 'release_gate_result.json'


def command_specs(profile, cases):
    node = shutil.which('node')
    py = sys.executable
    if not node:
        node = 'node'
    checks = [
        ('module-syntax', [node, 'tests/verification/check_syntax.mjs'], 60, 'node'),
        ('node-regressions', [node, '--test', 'tests/*.test.mjs'], 180, 'node'),
        ('math-properties', [node, 'tests/verification/run_kernel_properties.mjs', '--seed=1511506142', f'--cases={cases}'], 240, 'node'),
        ('browser-startup', [py, 'tests/browser_smoke.py'], 90, 'browser'),
        ('browser-point-lines', [py, 'tests/browser_round76_remaining_points_lines.py'], 120, 'browser'),
        ('browser-seeded', [py, 'tests/browser_round102_seeded_interactions.py'], 120, 'browser'),
    ]
    if profile in ('local', 'release'):
        checks += [
            ('browser-history', [py, 'tests/browser_round92_history.py'], 120, 'browser'),
            ('browser-export-three-formats', [py, 'tests/browser_round107_3d_export.py'], 150, 'browser'),
            ('browser-export-fidelity', [py, 'tests/browser_round108_export_fidelity.py'], 150, 'browser'),
            ('browser-export-cancellation', [py, 'tests/browser_round109_export_interruptions.py'], 120, 'browser'),
            ('browser-scene-lifecycle', [py, 'tests/browser_round106_3d_lifecycle.py'], 150, 'browser'),
            ('node-performance', [node, 'tests/verification/benchmark_performance.mjs'], 100, 'node'),
            ('browser-performance', [py, 'tests/browser_round103_performance.py'], 150, 'browser'),
            ('cache-stress', [node, '--expose-gc', 'tests/verification/benchmark_cache_stability.mjs'], 120, 'node'),
            ('cache-eviction', [node, 'tests/verification/benchmark_cache_eviction.mjs'], 120, 'node'),
        ]
    return checks


def check_prerequisites(kind):
    if kind == 'node' and not shutil.which('node'):
        return 'Node.js not available'
    if kind == 'browser':
        try:
            import playwright.sync_api  # noqa: F401
        except ImportError:
            return 'Python Playwright module not available'
    return None


def run_check(name, argv, timeout, kind, env, *, cwd=ROOT):
    missing = check_prerequisites(kind)
    if missing:
        return dict(name=name, status='INCOMPLETE', reason=missing, command=argv, elapsedSeconds=0)
    begin = time.monotonic()
    try:
        # Do not launch a shell: filenames cannot inject shell syntax.
        p = subprocess.run(argv, cwd=cwd, env=env, text=True, capture_output=True,
                           timeout=timeout, check=False)
        elapsed = round(time.monotonic() - begin, 3)
        status = 'PASS' if p.returncode == 0 else 'FAIL'
        # A missing browser executable or backend dependency means verification did not execute.
        combined = (p.stdout + '\n' + p.stderr).lower()
        if status == 'FAIL' and any(x in combined for x in (
            'executable doesn\'t exist', 'browser executable not found',
            'no module named \'playwright\'', 'cannot find module',
            'modulenotfounderror', 'enoent', 'filenotfounderror')):
            status = 'INCOMPLETE'
        return dict(name=name, status=status, command=argv, returnCode=p.returncode,
                    elapsedSeconds=elapsed, stdoutTail=p.stdout[-5000:], stderrTail=p.stderr[-3000:])
    except subprocess.TimeoutExpired as exc:
        return dict(name=name, status='FAIL', command=argv, reason=f'timeout after {timeout}s',
                    elapsedSeconds=round(time.monotonic()-begin,3))
    except OSError as exc:
        return dict(name=name, status='INCOMPLETE', command=argv, reason=str(exc),
                    elapsedSeconds=round(time.monotonic()-begin,3))


def hosted_check(url):
    """Verify deployed app actually initializes; never claim hosted validation without URL."""
    if not url:
        return dict(name='hosted-smoke', status='INCOMPLETE', reason='--hosted-url required for release certification')
    if not url.startswith('https://'):
        return dict(name='hosted-smoke', status='FAIL', reason='Hosted URL must use HTTPS')
    try:
        from playwright.sync_api import sync_playwright
        begin = time.monotonic()
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=['--no-sandbox'])
            try:
                page = browser.new_page()
                errors = []
                page.on('pageerror', lambda exc: errors.append(str(exc)))
                response = page.goto(url, wait_until='domcontentloaded', timeout=30000)
                page.locator('#drawing').wait_for(state='attached', timeout=20000)
                page.locator('#command').wait_for(state='visible', timeout=20000)
                page.wait_for_timeout(1000)
                if not response or response.status >= 400 or errors:
                    raise AssertionError(f'HTTP {response.status if response else "none"}; JS errors {errors}')
                return dict(name='hosted-smoke', status='PASS', url=url,
                            elapsedSeconds=round(time.monotonic()-begin,3))
            finally:
                browser.close()
    except ImportError:
        return dict(name='hosted-smoke', status='INCOMPLETE', reason='Playwright unavailable')
    except Exception as exc:
        return dict(name='hosted-smoke', status='FAIL', reason=str(exc))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile', choices=('quick', 'local', 'release'), default='quick')
    parser.add_argument('--cases', type=int, default=None, help='Trials per mathematical family; local/release default 10000')
    parser.add_argument('--hosted-url', default=None, help='Required with --profile release')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    cases = args.cases if args.cases is not None else (1200 if args.profile == 'quick' else 10000)
    if not 1 <= cases <= 100000:
        parser.error('--cases must be 1..100000')
    if args.profile in ('local', 'release') and cases < 10000:
        parser.error('local/release profiles require at least 10000 cases per family; use quick for smaller debugging runs')
    env = os.environ.copy()
    # Explicit, configurable responsiveness limits rather than the old 10-second defaults.
    env.setdefault('MI_PERF_P95_MS', '1500')
    env.setdefault('MI_BROWSER_IMPORT_P95_MS', '2000')
    results = []
    for name, argv, timeout, kind in command_specs(args.profile, cases):
        if name == 'node-regressions':
            # Glob expansion without a shell, portable on Windows and Unix.
            argv = [argv[0], '--test'] + [str(p.relative_to(ROOT)) for p in sorted((ROOT/'tests').glob('*.test.mjs'))]
        print(f'[{args.profile}] {name} ...', flush=True)
        res = run_check(name, argv, timeout, kind, env)
        results.append(res)
        print(f"  {res['status']} ({res.get('elapsedSeconds',0)}s)", flush=True)
    if args.profile == 'release':
        res = hosted_check(args.hosted_url)
        results.append(res)
        print(f"[release] hosted-smoke: {res['status']}", flush=True)
    # Validate the catalog against tests executed *this run*. File presence alone
    # is never accepted as browser or performance evidence.
    evidence_path = args.output.with_name(args.output.stem + '_evidence.json')
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    evidence_path.write_text(json.dumps({'schemaVersion': 1, 'checks': results}), encoding='utf8')
    node = shutil.which('node') or 'node'
    mode_arg = '--catalog-only' if args.profile == 'quick' else f'--evidence-file={evidence_path}'
    coverage = run_check('coverage-evidence', [node, 'tests/verification/report_coverage.mjs', mode_arg], 60, 'node', env)
    # Reporter exits 2 when evidence is missing, unlike a property/assertion failure.
    if coverage.get('returnCode') == 2:
        coverage['status'] = 'INCOMPLETE'
    results.append(coverage)
    print(f"[verify] coverage-evidence: {coverage['status']}", flush=True)
    status = ('FAIL' if any(r['status']=='FAIL' for r in results) else
              'INCOMPLETE' if any(r['status']=='INCOMPLETE' for r in results) else 'PASS')
    data = {
        'schemaVersion': 1, 'profile': args.profile,
        'generatedUtc': dt.datetime.now(dt.timezone.utc).isoformat(),
        'status': status, 'releaseCertified': status == 'PASS' and args.profile == 'release',
        'scope': 'scoped 28-operation catalog; not exhaustive application feature coverage',
        'seed': 1511506142, 'casesPerFamily': cases,
        'performanceBudgetsMs': {'nodeP95': float(env['MI_PERF_P95_MS']),
                                 'browserImportMaxOfThree': float(env['MI_BROWSER_IMPORT_P95_MS'])},
        'checks': results,
        'counts': {s:sum(r['status']==s for r in results) for s in ('PASS','FAIL','INCOMPLETE')}
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2)+'\n', encoding='utf8')
    print(f"RESULT {status}; report: {args.output}", flush=True)
    return {'PASS':0, 'FAIL':1, 'INCOMPLETE':2}[status]


if __name__ == '__main__':
    sys.exit(main())
