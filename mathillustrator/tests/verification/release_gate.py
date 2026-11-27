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
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / 'tests' / 'verification' / 'release_gate_result.json'


def validate_baseline_inventory(root=ROOT):
    """Fail closed if previously accepted source or regression modules vanish."""
    manifest = root / 'tests' / 'verification' / 'baseline_inventory.json'
    try:
        data = json.loads(manifest.read_text(encoding='utf8'))
        if data.get('schemaVersion') != 1:
            raise ValueError('Unsupported inventory manifest version')
        for field in ('sourceModules', 'nodeTestModules', 'pythonTestModules'):
            names = data[field]
            if not isinstance(names, list) or not names or len(names) != len(set(names)):
                raise ValueError('Invalid inventory ' + field)
            expected_prefix = 'src/' if field == 'sourceModules' else 'tests/'
            suffix = '.py' if field == 'pythonTestModules' else '.mjs'
            if any(not name.startswith(expected_prefix) or
                   any(part in ('', '.', '..') for part in Path(name).parts) or
                   (field != 'pythonTestModules' and '/' in name[len(expected_prefix):]) or
                   not name.endswith(suffix) for name in names):
                raise ValueError('Unsafe inventory path in ' + field)
        present_source = {'src/' + p.name for p in (root / 'src').glob('*.mjs')}
        present_nodes = {'tests/' + p.name for p in (root / 'tests').glob('*.test.mjs')}
        present_python = {p.relative_to(root).as_posix() for p in (root / 'tests').rglob('*.py')}
        missing = sorted((set(data['sourceModules']) - present_source) |
                         (set(data['nodeTestModules']) - present_nodes) |
                         (set(data['pythonTestModules']) - present_python))
        if missing:
            return dict(name='baseline-inventory', status='FAIL', reason='Missing baseline files: ' + ', '.join(missing))
        return dict(name='baseline-inventory', status='PASS',
                    sourceModules=len(present_source), nodeTestModules=len(present_nodes),
                    pythonTestModules=len(present_python),
                    baselineSourceModules=len(data['sourceModules']),
                    baselineNodeTestModules=len(data['nodeTestModules']),
                    baselinePythonTestModules=len(data['pythonTestModules']))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return dict(name='baseline-inventory', status='FAIL', reason=str(exc))


def command_specs(profile, cases):
    node = shutil.which('node')
    py = sys.executable
    if not node:
        node = 'node'
    checks = [
        ('module-syntax', [node, 'tests/verification/check_syntax.mjs'], 60, 'node'),
        ('python-test-syntax', [py, 'tests/verification/check_python_syntax.py'], 60, 'python'),
        ('verification-self-tests', [py, '-m', 'unittest', 'tests/verification/test_release_gate.py', '-q'], 90, 'python'),
        ('node-regressions', [node, '--test', '--test-concurrency=2', 'tests/*.test.mjs'], 900, 'node'),
        ('math-properties', [node, 'tests/verification/run_kernel_properties.mjs', '--seed=1511506142', f'--cases={cases}'], 240, 'node'),
        ('browser-startup', [py, 'tests/browser_smoke.py'], 90, 'browser'),
        ('browser-point-lines', [py, 'tests/browser_round76_remaining_points_lines.py'], 120, 'browser'),
        ('browser-seeded', [py, 'tests/browser_round102_seeded_interactions.py'], 120, 'browser'),
        # Regression of quoted-label bracket typing, closing-skip and Backspace fixes.
        ('browser-recent-input-assist', [py, 'tests/browser_round246_input_assist.py'], 120, 'browser'),
    ]
    if profile in ('local', 'release'):
        checks += [
            # Recent production bugs: freehand conversion and responsive panel resizing.
            # Browser scripts cover interactive workflows; precise numerical boundaries
            # remain in automatically discovered Node regressions.
            ('browser-recent-freehand', [py, 'tests/browser_round146_freehand_shapes.py'], 120, 'browser'),
            ('browser-recent-panel-resize', [py, 'tests/browser_panel_resize_current.py'], 120, 'browser'),
            ('browser-history', [py, 'tests/browser_round92_history.py'], 120, 'browser'),
            ('browser-export-three-formats', [py, 'tests/browser_round107_3d_export.py'], 150, 'browser'),
            ('browser-export-fidelity', [py, 'tests/browser_round108_export_fidelity.py'], 150, 'browser'),
            ('browser-export-cancellation', [py, 'tests/browser_round109_export_interruptions.py'], 120, 'browser'),
            ('browser-scene-lifecycle', [py, 'tests/browser_round106_3d_lifecycle.py'], 150, 'browser'),
            ('browser-3d-gpu-fallback', [py, 'tests/browser_gpu3d_acceleration.py'], 150, 'browser'),
            ('node-performance', [node, 'tests/verification/benchmark_performance.mjs'], 100, 'node'),
            ('browser-performance', [py, 'tests/browser_round103_performance.py'], 150, 'browser'),
            ('cache-stress', [node, '--expose-gc', 'tests/verification/benchmark_cache_stability.mjs'], 120, 'node'),
            ('cache-eviction', [node, 'tests/verification/benchmark_cache_eviction.mjs'], 120, 'node'),
            # Core current-generation acceptance paths; the historical Chromium archive
            # is inventoried separately and is NOT silently certified by this selection.
            ('browser-unnamed-algebra', [py, 'tests/browser_round290_algebra_unnamed_matrix.py'], 120, 'browser'),
            ('browser-transform-objects', [py, 'tests/browser_round292_transform_object_matrix.py'], 120, 'browser'),
            ('browser-shortcuts', [py, 'tests/browser_round293_object_clipboard.py'], 120, 'browser'),
            ('browser-paste', [py, 'tests/browser_round294_clipboard_polish.py'], 120, 'browser'),
            ('browser-editing-history', [py, 'tests/browser_round295_editing_consistency.py'], 120, 'browser'),
            ('browser-atlas', [py, 'tests/browser_round286_atlas_interactions.py'], 120, 'browser'),
            ('browser-atlas-fidelity', [py, 'tests/browser_round287_atlas_export_fidelity.py'], 120, 'browser'),
            ('browser-implicit-topology', [py, 'tests/browser_round284_small_faces.py'], 120, 'browser'),
            # Cross-feature follow-on coverage: constructions, animations, locale,
            # recent 3D topology, field sync and the extended atlas soak.
            ('browser-programmatic-geometry', [py, 'tests/browser_round258_programmatic_geometry.py'], 120, 'browser'),
            ('browser-field-sync', [py, 'tests/browser_round259_field_synchronization.py'], 120, 'browser'),
            ('browser-concurrent-sliders', [py, 'tests/browser_round261_concurrent_sliders.py'], 120, 'browser'),
            ('browser-translation', [py, 'tests/browser_round263_translation.py'], 120, 'browser'),
            ('browser-recent-field-sync', [py, 'tests/browser_round279_field_sync.py'], 120, 'browser'),
            ('browser-implicit-lattice', [py, 'tests/browser_round280_implicit_lattice_zero.py'], 120, 'browser'),
            ('browser-complex-implicit', [py, 'tests/browser_round281_complex_implicit.py'], 120, 'browser'),
            ('browser-atlas-extended-soak', [py, 'tests/browser_round288_atlas_extended_soak.py'], 120, 'browser'),
            ('browser-unnamed-point-compat', [py, 'tests/browser_round289_unnamed_2d_constructor.py'], 120, 'browser'),
            # Representative archived suites absent from the previous local profile:
            # broad 2D intersection/picking, inversion invariant, dependent constructions,
            # and restricted TikZ-cd fidelity.
            ('browser-legacy-2d-sweep', [py, 'tests/browser_round69_2d_sweep.py'], 150, 'browser'),
            ('browser-inversion-glyph', [py, 'tests/browser_round57_inversion_glyph.py'], 120, 'browser'),
            ('browser-derived-geometry', [py, 'tests/browser_round51h_derived_geometry.py'], 150, 'browser'),
            ('browser-tikzcd-export', [py, 'tests/browser_round187_tikzcd_export.py'], 120, 'browser'),
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
    if kind == 'browser' and (sys.flags.optimize or env.get('PYTHONOPTIMIZE', '').strip() not in ('', '0')):
        return dict(name=name, status='INCOMPLETE', reason='Python assertions may be disabled by optimization', command=argv, elapsedSeconds=0)
    if missing:
        return dict(name=name, status='INCOMPLETE', reason=missing, command=argv, elapsedSeconds=0)
    begin = time.monotonic()
    try:
        # Do not launch a shell: filenames cannot inject shell syntax.
        p = subprocess.run(argv, cwd=cwd, env=env, text=True, capture_output=True,
                           timeout=timeout, check=False)
        elapsed = round(time.monotonic() - begin, 3)
        status = 'PASS' if p.returncode == 0 else 'FAIL'
        # A verification gate must certify its own fail-closed self-tests on every run.
        # unittest's success summary is written to stderr, not stdout. Exit zero
        # alone also results from an empty/misconfigured unittest discovery.
        if status == 'PASS' and name == 'verification-self-tests':
            transcript = p.stdout + '\n' + p.stderr
            match = re.search(r'(?m)^Ran (\d+) tests? in ', transcript)
            if not match or int(match.group(1)) == 0 or not re.search(r'(?m)^OK\s*$', transcript) or re.search(r'(?m)^FAILED\b', transcript):
                status = 'INCOMPLETE'
        # Node's exit zero alone is not evidence of executed, non-skipped tests.
        if status == 'PASS' and name == 'node-regressions':
            counts = {key: re.findall(rf'^# {key} (\d+)\s*$', p.stdout, re.M) for key in ('tests', 'pass', 'fail', 'skipped', 'todo')}
            if not counts['tests'] or not counts['pass'] or int(counts['tests'][-1]) == 0:
                status = 'INCOMPLETE'
            elif any(counts[key] and int(counts[key][-1]) != 0 for key in ('fail', 'skipped', 'todo')) or int(counts['tests'][-1]) != int(counts['pass'][-1]):
                status = 'INCOMPLETE'
        # An exit-zero browser subprocess with no affirmative execution report must
        # never certify coverage. Selected scripts print PASS or structured JSON
        # confirming checks; the export-fidelity script reports pageErrors plus
        # detailed comparison results instead of a generic PASS token.
        if status == 'PASS' and kind == 'browser':
            output = p.stdout
            affirmative = (bool(re.search(r'\bPASS\b|_PASS\b|\"passed\"\s*:\s*true', output))
                           or (name == 'browser-export-fidelity'
                               and '"pageErrors"' in output and '"center"' in output))
            if not affirmative:
                status = 'INCOMPLETE'
        # A missing browser executable or backend dependency means verification did not execute.
        combined = (p.stdout + '\n' + p.stderr).lower()
        if status == 'FAIL' and kind == 'browser' and any(x in combined for x in (
            'executable doesn\'t exist', 'browser executable not found',
            'no module named \'playwright\'')):
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
    results = [validate_baseline_inventory()]
    print(f"[{args.profile}] baseline-inventory: {results[0]['status']}", flush=True)
    for name, argv, timeout, kind in command_specs(args.profile, cases):
        if name == 'node-regressions':
            # Glob expansion without a shell, portable on Windows and Unix.
            files = sorted((ROOT/'tests').glob('*.test.mjs'))
            argv = [argv[0], '--test', '--test-concurrency=2'] + [str(p.relative_to(ROOT)) for p in files]
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
    catalog_only = args.profile == 'quick'
    mode_arg = '--catalog-only' if catalog_only else f'--evidence-file={evidence_path}'
    coverage = run_check('coverage-catalog' if catalog_only else 'coverage-evidence', [node, 'tests/verification/report_coverage.mjs', mode_arg], 60, 'node', env)
    # Reporter exits 2 when evidence is missing, unlike a property/assertion failure.
    if coverage.get('returnCode') == 2:
        coverage['status'] = 'INCOMPLETE'
    results.append(coverage)
    print(f"[verify] {coverage['name']}: {coverage['status']}", flush=True)
    status = ('FAIL' if any(r['status']=='FAIL' for r in results) else
              'INCOMPLETE' if any(r['status']=='INCOMPLETE' for r in results) else 'PASS')
    data = {
        'schemaVersion': 1, 'profile': args.profile,
        'generatedUtc': dt.datetime.now(dt.timezone.utc).isoformat(),
        'status': status, 'releaseCertified': status == 'PASS' and args.profile == 'release',
        'scope': 'scoped 28-operation catalog; not exhaustive application feature coverage',
        'coverageEvidenceExecuted': not catalog_only,
        'testInventory': {
            'nodeModules': len(list((ROOT/'tests').glob('*.test.mjs'))),
            'pythonModules': len(list((ROOT/'tests').rglob('*.py'))),
            'browserScripts': len(list((ROOT/'tests').glob('browser_*.py'))),
            'pendingFixtures': len(list((ROOT/'tests').glob('*.pending.*'))),
            'selectedBrowserChecks': sum(kind == 'browser' for _, _, _, kind in command_specs(args.profile, cases)),
        },
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
