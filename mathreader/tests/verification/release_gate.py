#!/usr/bin/env python3
"""MathReader verification engine v1. Stdlib-only, fail-closed, evidence-labelled.

This file can be run from any cwd; never modifies application source.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
import re
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time

DEFAULT_ROOT = Path(__file__).resolve().parents[2]
PROFILES = ('quick', 'full', 'release')
CATEGORIES = {
    'settings': ('settings', 'preferences', 'export_preferences'),
    'pdf-reading': ('render', 'navigation', 'pdf', 'selection', 'continuous', 'search', 'hover'),
    'detection': ('structure', 'result', 'equation', 'bibliograph', 'detect', 'index', 'toc'),
    'formula-ocr': ('ocr', 'texify', 'latex', 'formula'),
    'storage-import-export': ('storage', 'persist', 'import', 'export', 'history', 'data'),
    'ui-tutorial': ('responsive', 'layout', 'ui', 'tutorial', 'language', 'prose', 'theme'),
}
CRITICAL_QUICK = ('settings', 'render', 'navigation', 'equation', 'ocr', 'export', 'responsive', 'tutorial')


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def result(name, status, **kw):
    return {'name': name, 'status': status, **kw}


def discover(root, profile):
    tests = root / 'tests'
    js = sorted(p for p in tests.glob('*.js') if p.is_file() and ('test' in p.stem or 'regression' in p.stem))
    py = sorted(p for p in tests.glob('*.py') if p.is_file() and not p.name.startswith('_'))
    if profile == 'quick':
        def select(paths):
            found = [p for p in paths if any(k in p.stem.lower() for k in CRITICAL_QUICK)]
            return found or paths[:min(3, len(paths))]
        return select(js), select(py)
    return js, py


def missing_dependency(kind):
    if kind == 'node' and not shutil.which('node'):
        return 'Node.js executable is unavailable'
    if kind == 'chromium':
        try:
            import playwright.sync_api
        except ImportError:
            return 'Python Playwright is not installed'
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                executable = Path(p.chromium.executable_path)
                if not executable.exists() and not os.environ.get('MATHREADER_CHROMIUM'):
                    return 'Playwright Chromium executable is unavailable'
        except Exception as e:
            return f'Playwright Chromium preflight failed: {type(e).__name__}: {e}'
    return None


def terminate_tree(proc):
    if proc.poll() is not None:
        return
    if os.name == 'nt':
        subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)], capture_output=True, check=False)
    else:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    try:
        proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()


def run_command(name, cmd, root, timeout, evidence, kind=None):
    missing = missing_dependency(kind) if kind else None
    if missing:
        return result(name, 'INCOMPLETE', reason=missing, evidence=evidence, command=cmd)
    started = time.monotonic()
    try:
        # New session/process group ensures stalled test subprocesses are also terminated.
        opts = {'start_new_session': True} if os.name != 'nt' else {'creationflags': subprocess.CREATE_NEW_PROCESS_GROUP}
        proc = subprocess.Popen(cmd, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True, encoding='utf-8', errors='replace', **opts)
        try:
            out, err = proc.communicate(timeout=timeout)
            rc = proc.returncode
        except subprocess.TimeoutExpired:
            terminate_tree(proc)
            return result(name, 'FAIL', reason=f'timeout after {timeout}s', evidence=evidence,
                          command=cmd, seconds=round(time.monotonic()-started, 3))
        skipped = bool(re.search(r'(?im)^.*\b(?:SKIPPED|SKIP:|NOT RUN)\b', out + '\n' + err))
        status = 'FAIL' if rc != 0 else ('INCOMPLETE' if skipped else 'PASS')
        return result(name, status, reason='test output reports skipped work' if skipped and rc == 0 else None, evidence=evidence, command=cmd,
                      returnCode=rc, seconds=round(time.monotonic()-started, 3),
                      stdoutTail=out[-2500:], stderrTail=err[-2500:])
    except OSError as e:
        return result(name, 'INCOMPLETE', reason=f'failed to launch: {e}', evidence=evidence, command=cmd)


def syntax_checks(root, timeout):
    node = shutil.which('node') or 'node'
    parts = sorted((root / 'js').glob('*.js')) if (root / 'js').is_dir() else []
    names = [root / 'mathreader.js', *parts]
    if not parts:
        yield result('source-module-inventory', 'INCOMPLETE', reason='js/ modules unavailable; assembled JS only')
    else:
        yield result('source-module-inventory', 'PASS', moduleCount=len(parts), evidence='source-inventory')
    for path in names:
        if not path.is_file():
            yield result('syntax:' + path.relative_to(root).as_posix(), 'INCOMPLETE', reason='required file missing', evidence='source-syntax')
            continue
        yield run_command('syntax:' + path.relative_to(root).as_posix(), [node, '--check', str(path)], root, timeout, 'source-syntax', 'node')


def coverage(js, py, all_js, all_py):
    categories = {}
    for label, keywords in CATEGORIES.items():
        declared = [p.name for p in (*all_js, *all_py) if any(k in p.name.lower() for k in keywords)]
        selected = [p.name for p in (*js, *py) if p.name in declared]
        categories[label] = {'declaredTests': declared, 'selectedTests': selected,
                             'declaredCount': len(declared), 'selectedCount': len(selected),
                             'verified': False}
    return categories


def hosted_smoke(url, timeout):
    if not url:
        return result('hosted-browser-smoke', 'INCOMPLETE', reason='--hosted-url is required for release', evidence='live-hosted-browser')
    if not url.startswith('https://'):
        return result('hosted-browser-smoke', 'FAIL', reason='Hosted origin must use HTTPS', evidence='live-hosted-browser')
    missing = missing_dependency('chromium')
    if missing:
        return result('hosted-browser-smoke', 'INCOMPLETE', reason=missing, evidence='live-hosted-browser')
    start = time.monotonic()
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
            try:
                page = browser.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                response = page.goto(url, timeout=timeout*1000, wait_until='domcontentloaded')
                page.wait_for_timeout(1200)
                title = page.title()
                has_reader = bool(page.locator('input[type="file"], canvas, #pdfContainer, #fileInput').count())
                ok = response is not None and response.status < 400 and has_reader and not errors
                return result('hosted-browser-smoke', 'PASS' if ok else 'FAIL',
                              evidence='live-hosted-browser', statusCode=response.status if response else None,
                              pageTitle=title, hasReaderElement=has_reader, pageErrors=errors[:10],
                              seconds=round(time.monotonic()-start, 3))
            finally:
                browser.close()
    except Exception as e:
        return result('hosted-browser-smoke', 'FAIL', evidence='live-hosted-browser',
                      reason=f'{type(e).__name__}: {e}', seconds=round(time.monotonic()-start, 3))


def write_atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)


def execute(args):
    root = args.root.resolve()
    records = []
    all_js, all_py = discover(root, 'full')
    js, py = discover(root, args.profile)
    if not (root / 'index.html').is_file():
        records.append(result('application-root', 'INCOMPLETE', reason='index.html is missing'))
    else:
        records.append(result('application-root', 'PASS', evidence='source-inventory'))
    records += list(syntax_checks(root, args.timeout))
    if args.profile in ('full', 'release'):
        manifest_path = Path(__file__).with_name('v436_inventory.json')
        if manifest_path.exists():
            inventory = json.loads(manifest_path.read_text(encoding='utf-8'))
            missing = sorted(set(inventory['expectedJavaScript'] + inventory['expectedPython']) -
                             {p.relative_to(root).as_posix() for p in (*all_js, *all_py)})
            records.append(result('v436-regression-inventory', 'INCOMPLETE' if missing else 'PASS',
                                  reason=f'{len(missing)} historical regression files absent' if missing else None,
                                  missingFiles=missing, evidence='source-inventory'))
        else:
            records.append(result('v436-regression-inventory', 'INCOMPLETE', reason='historical manifest unavailable'))
    if not all_js:
        records.append(result('javascript-discovery', 'INCOMPLETE', reason='No root-level JavaScript regression files discovered'))
    if not all_py:
        records.append(result('python-discovery', 'INCOMPLETE', reason='No root-level Python regression files discovered'))
    node = shutil.which('node') or 'node'
    for path in js:
        records.append(run_command('node:' + path.name, [node, str(path)], root, args.test_timeout,
                                   'node-regression', 'node'))
    for path in py:
        needs_browser = 'playwright' in path.read_text(encoding='utf-8', errors='replace').lower()
        records.append(run_command('python:' + path.name, [sys.executable, str(path)], root,
                                   args.browser_timeout, 'python-browser' if needs_browser else 'python-regression',
                                   'chromium' if needs_browser else None))
    if args.profile == 'release':
        records.append(hosted_smoke(args.hosted_url, args.browser_timeout))
        records.append(result('original-pdf-geometry-certification', 'INCOMPLETE',
                              evidence='real-pdf-original', reason='Requires checked-in oracle and real PDF.js navigation adapter; corpus presence alone does not certify accuracy'))
        records.append(result('real-texify-inference-certification', 'INCOMPLETE',
                              evidence='real-model-inference', reason='Requires measured genuine Texify inference and human-reviewed ground truth'))
    cov = coverage(js, py, all_js, all_py)
    for label, d in cov.items():
        relevant = ['node:' + x for x in d['selectedTests'] if x.endswith('.js')]
        relevant += ['python:' + x for x in d['selectedTests'] if x.endswith('.py')]
        d['verified'] = bool(relevant) and all(any(r['name'] == n and r['status'] == 'PASS' for r in records) for n in relevant)
    counts = {s: sum(r['status'] == s for r in records) for s in ('PASS', 'FAIL', 'INCOMPLETE')}
    status = 'FAIL' if counts['FAIL'] else ('INCOMPLETE' if counts['INCOMPLETE'] else 'PASS')
    result_obj = {
        'schemaVersion': 1, 'engine': 'MathReader verification v1',
        'generatedAt': datetime.now(timezone.utc).isoformat(), 'profile': args.profile,
        'status': status, 'releaseCertified': status == 'PASS' and args.profile == 'release',
        'root': str(root), 'sourceFingerprint': sha(root / 'mathreader.js') if (root / 'mathreader.js').is_file() else None,
        'testsDiscovered': {'javascript': len(all_js), 'python': len(all_py)},
        'testsSelected': {'javascript': len(js), 'python': len(py)},
        'counts': counts, 'coverage': cov, 'checks': records,
        'evidenceCaveats': ['Python Chromium tests may use mocked PDF/model paths; their individual source must be inspected for claims.',
                            'Declared or keyword-mapped coverage is not independent evidence of accuracy.',
                            'Real PDF and OCR certification are not implied by offline green tests.'],
    }
    write_atomic(args.output, result_obj)
    print(json.dumps({'status': status, 'counts': counts, 'selected': result_obj['testsSelected'], 'report': str(args.output)}, ensure_ascii=False))
    return {'PASS': 0, 'FAIL': 1, 'INCOMPLETE': 2}[status]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--profile', choices=PROFILES, default='quick')
    ap.add_argument('--root', type=Path, default=DEFAULT_ROOT)
    ap.add_argument('--output', type=Path, default=None)
    ap.add_argument('--timeout', type=int, default=45, help='seconds per syntax check')
    ap.add_argument('--test-timeout', type=int, default=120, help='seconds per Node test')
    ap.add_argument('--browser-timeout', type=int, default=180, help='seconds per Chromium/Python test')
    ap.add_argument('--hosted-url', default='')
    args = ap.parse_args(argv)
    args.output = args.output or args.root / 'tests' / 'verification' / 'release_gate_result.json'
    return execute(args)


if __name__ == '__main__':
    sys.exit(main())
