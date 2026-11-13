#!/usr/bin/env python3
"""Safe, reversible consolidation and regression runner for MathIllustrator.

Invoke from anywhere: python mathillustrator/tests/manage_history.py verify
Only prune/restore --apply mutate files. No source module or MathReader file is touched.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
from zipfile import ZipFile

APP = Path(__file__).resolve().parents[1]
SITE = APP.parent
HISTORY = APP / 'docs/history'
CONTENT_INDEX = HISTORY / 'contents.json'
PACKAGE = APP / 'docs/quality/package-files.json'


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verified_archive() -> tuple[dict, dict[str, bytes]]:
    index = json.loads(CONTENT_INDEX.read_text(encoding='utf-8'))
    filename = HISTORY / index['archive']
    raw = filename.read_bytes()
    if digest(raw) != index['archive_sha256']:
        raise ValueError('Historical ZIP checksum differs from the immutable index')
    archive = {}
    with ZipFile(filename) as z:
        if len(z.namelist()) != len(set(z.namelist())):
            raise ValueError('Ambiguous duplicate ZIP entries')
        expected = set(index['historical_sha256']) | set(index['snapshot_paths'])
        if set(z.namelist()) != expected:
            raise ValueError('Historical ZIP path inventory differs')
        for name in z.namelist():
            path = Path(name)
            if path.is_absolute() or '..' in path.parts or '\\' in name:
                raise ValueError('Unsafe path inside historical archive: ' + name)
            data = z.read(name)
            if name in index['historical_sha256'] and digest(data) != index['historical_sha256'][name]:
                raise ValueError('Corrupt historical archive member: ' + name)
            archive[name] = data
    if len(index['historical_sha256']) != index['historical_count']:
        raise ValueError('Historical file count differs')
    return index, archive


def verify_installed() -> tuple[dict, dict[str, bytes]]:
    index, archive = verified_archive()
    package = json.loads(PACKAGE.read_text(encoding='utf-8'))
    if package['schema_version'] != 2:
        raise ValueError('Unsupported live package inventory')
    actual = {p.relative_to(APP).as_posix() for p in APP.rglob('*')
              if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc'
              and p.name != '_audit_browser_results.json'}
    expected = set(package['active_paths']) | {'docs/quality/package-files.json'}
    extras = actual - expected
    if extras - set(index['historical_sha256']):
        raise ValueError('Unaccounted installed files: ' + repr(sorted(extras - set(index['historical_sha256']))[:15]))
    if expected - actual:
        raise ValueError('Missing active files: ' + repr(sorted(expected - actual)))
    if len(package['active_paths']) != package['active_count']:
        raise ValueError('Live package count mismatch')
    if set(package['sha256']) != set(package['active_paths']):
        raise ValueError('Missing live SHA256 entries')
    for name, checksum in package['sha256'].items():
        if digest((APP / name).read_bytes()) != checksum:
            raise ValueError('Active file changed: ' + name)
    if package['historical_archive_sha256'] != index['archive_sha256']:
        raise ValueError('Live package and historical archive index disagree')
    for name in extras:
        if digest((APP / name).read_bytes()) != index['historical_sha256'][name]:
            raise ValueError('An existing historical file was edited; refusing unsafe cleanup: ' + name)
    if not (SITE/'index.html').is_file() or not (SITE/'tools.html').is_file():
        raise ValueError('Root website pages missing (MathIllustrator is deployed alongside them)')
    print(f'VERIFY PASS: {len(expected)} active files, {len(index["historical_sha256"])} historical files verified in archive, {len(extras)} historical originals still installed')
    return index, archive


def modify_history(mode: str, apply: bool) -> None:
    index, archive = verify_installed()
    originals = index['historical_sha256']
    to_change = [name for name in sorted(originals)
                 if ((APP/name).exists() if mode == 'prune' else not (APP/name).exists())]
    print(f'{mode.upper()}: {len(to_change)} historical files. {"APPLYING" if apply else "DRY RUN (add --apply to change files)"}')
    if not apply:
        return
    # Verified all candidate hashes, paths and archive bytes before first mutation.
    for name in to_change:
        p = APP / name
        if mode == 'prune':
            if digest(p.read_bytes()) != originals[name]:
                raise ValueError('Historical file changed during cleanup: '+name)
            p.unlink()
        else:
            p.parent.mkdir(parents=True, exist_ok=True)
            try:
                with p.open('xb') as f:
                    f.write(archive[name])
            except FileExistsError as exc:
                raise ValueError('Refusing to overwrite file created during restoration: '+name) from exc
    verify_installed()
    print(mode.upper() + ' PASS; current runtime and root website files were preserved')


def stage_site(root: Path, archive: dict[str, bytes]) -> Path:
    target = root/'mathillustrator'
    def ignore(directory, names):
        return {'__pycache__','_audit_browser_results.json'} & set(names)
    shutil.copytree(APP, target, ignore=ignore)
    for name, contents in archive.items():
        if name.startswith('snapshots/'):
            continue
        p = target/name
        if p.exists():
            if digest(p.read_bytes()) != digest(contents):
                raise ValueError('Staged historical regression collided with modified file: '+name)
        else:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(contents)
    for name in ('index.html','tools.html','assets/css/style-v15.css','assets/js/main-v15.js','assets/img/tool-mathreader-file-search.svg'):
        path = SITE/name
        if not path.is_file():
            raise FileNotFoundError('Required website integration fixture missing: '+name)
        out = root/name
        out.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,out)
    return target


def run_regression(browser: bool, test_timeout: int) -> None:
    index, archive = verify_installed()
    with tempfile.TemporaryDirectory(prefix='mathillustrator-regression-') as temp:
        target = stage_site(Path(temp), archive)
        try:
            from jsonschema import Draft202012Validator
        except ImportError:
            print('SCHEMA CHECK NOT RUN: install jsonschema to enable fixture validation')
        else:
            schema=json.loads((target/'docs/schemas/project-v1.schema.json').read_text(encoding='utf-8'))
            Draft202012Validator.check_schema(schema)
            validator=Draft202012Validator(schema)
            fixtures=sorted((target/'examples').glob('*.json'))
            for fixture in fixtures:
                validator.validate(json.loads(fixture.read_text(encoding='utf-8')))
            print(f'SCHEMA EXAMPLES PASS: {len(fixtures)}/{len(fixtures)}')
        def command(cmd: list[str], timeout=180):
            result = subprocess.run(cmd,cwd=target,text=True,stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT,timeout=timeout,
                                    env={**os.environ,'MATHILLUSTRATOR_CHROMIUM':os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium')})
            print('\n'.join(result.stdout.splitlines()[-12:]))
            if result.returncode:raise RuntimeError(f'Regression failed: {cmd} (exit {result.returncode})')
        for script in sorted((target/'src').glob('*.mjs')):
            command(['node','--check',str(script)],timeout=30)
        print('ES MODULE SYNTAX PASS')
        command(['node','--test',*[str(p) for p in sorted((target/'tests').glob('*.test.mjs'))]],timeout=180)
        command([sys.executable,str(target/'tests/site_integration.py'),str(target.parent)])
        command([sys.executable,str(target/'tests/tikz_compile.py')],timeout=90)
        if browser:
            chrome=os.environ.get('MATHILLUSTRATOR_CHROMIUM')
            if not chrome:
                if os.name == 'nt':
                    from playwright.sync_api import sync_playwright
                    with sync_playwright() as playwright:
                        chrome=playwright.chromium.executable_path
                else:
                    chrome='/usr/bin/chromium'
            scripts = [p for p in sorted((target/'tests').glob('browser_*.py'))
                       if p.name not in ('browser_cut12_batch.py','browser_cut24_sweep.py')]
            for i, script in enumerate(scripts,1):
                start=time.monotonic()
                try:
                    result=subprocess.run([sys.executable,str(script)],cwd=target,text=True,
                        stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=test_timeout,
                        env={**os.environ,'MATHILLUSTRATOR_CHROMIUM':chrome})
                except subprocess.TimeoutExpired as exc:
                    raise RuntimeError(f'Browser TIMEOUT at {i}/{len(scripts)}: {script.name}') from exc
                if result.returncode:
                    raise RuntimeError(f'Browser FAIL at {i}/{len(scripts)}: {script.name}\n{result.stdout[-3000:]}')
                print(f'BROWSER PASS {i}/{len(scripts)} {script.name} ({time.monotonic()-start:.1f}s)',flush=True)
            print(f'BROWSER REGRESSION PASS: {len(scripts)}/{len(scripts)} isolated Chromium scripts')
        print('STAGED REGRESSION PASS: tested in a temporary copy, original site unmodified')


def self_test() -> None:
    """Destructive-path checks in a disposable copy; user's site stays unchanged."""
    global APP, SITE, HISTORY, CONTENT_INDEX, PACKAGE
    original=(APP,SITE,HISTORY,CONTENT_INDEX,PACKAGE)
    verify_installed()
    try:
        with tempfile.TemporaryDirectory(prefix='mathillustrator-history-selftest-') as t:
            site=Path(t);app=site/'mathillustrator'
            shutil.copytree(APP,app,ignore=lambda _d,n: {'__pycache__'} & set(n))
            for name in ('index.html','tools.html'):
                shutil.copy2(SITE/name,site/name)
            APP=app;SITE=site;HISTORY=app/'docs/history'
            CONTENT_INDEX=HISTORY/'contents.json';PACKAGE=app/'docs/quality/package-files.json'
            idx,archive=verify_installed()
            modify_history('prune',True)
            modify_history('restore',True)
            # Fault injection: modified historical source must block entire cleanup.
            key=sorted(idx['historical_sha256'])[-1]
            victim=app/key;before=victim.read_bytes()
            victim.write_bytes(before+b'\nALTERED USER COPY\n')
            try:
                modify_history('prune',True)
            except ValueError:
                assert (app/sorted(idx['historical_sha256'])[0]).is_file(), 'Cleanup was not atomic at preflight'
            else:
                raise AssertionError('Changed historical source was deleted without a hard failure')
            victim.write_bytes(before)
            modify_history('prune',True)
            assert all(not (app/name).exists() for name in idx['historical_sha256'])
            modify_history('restore',True)
            assert all((app/name).read_bytes()==archive[name] for name in idx['historical_sha256'])
        print('SELF-TEST PASS: restore/prune round-trip, byte integrity and changed-file hard rejection in disposable site')
    finally:
        APP,SITE,HISTORY,CONTENT_INDEX,PACKAGE=original


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='action',required=True)
    sub.add_parser('verify')
    sub.add_parser('self-test')
    for action in ('prune','restore'):
        sub.add_parser(action).add_argument('--apply',action='store_true',help='Actually remove/restore verified archived paths (default is dry run)')
    t=sub.add_parser('test');t.add_argument('--browser',action='store_true',help='Run all archived and current isolated Chromium regressions (slower)')
    t.add_argument('--test-timeout',type=int,default=110)
    a=parser.parse_args()
    if a.action=='verify':verify_installed()
    elif a.action=='self-test':self_test()
    elif a.action in ('prune','restore'):modify_history(a.action,a.apply)
    elif a.action=='test':run_regression(a.browser,a.test_timeout)

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('MATHILLUSTRATOR MAINTENANCE ERROR:',exc,file=sys.stderr)
        sys.exit(1)
