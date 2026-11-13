"""Cut24 cumulative overlay integrity, SHA256 and older-cut file coverage.
Run from clean ZIP extraction: python mathillustrator/tests/package_integrity.py SITE_ROOT
Original site assets are deliberately NOT shipped in the root overlay.
"""
from pathlib import Path
import hashlib,json,sys
site=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
q=site/'mathillustrator/docs/quality'
meta=json.loads((q/'cut24-package.json').read_text(encoding='utf8'))
assert meta==json.loads((q/'package-files.json').read_text(encoding='utf8'))
assert meta['cut']=='24' and meta['release']=='0.25.0'
paths=set(meta['archive_paths']);assert len(paths)==meta['paths_total']
assert {'index.html','tools.html'}<=paths
assert all(p in {'index.html','tools.html'} or p.startswith('mathillustrator/') for p in paths)
assert all((site/p).is_file() for p in paths)
actual={p.relative_to(site).as_posix() for p in (site/'mathillustrator').rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
assert actual==paths-{'index.html','tools.html'},('missing',paths-actual-{'index.html','tools.html'},'extra',actual-paths)
for n in range(2,24):
 old=json.loads((q/f'cut{n:02d}-package.json').read_text(encoding='utf8'))
 assert set(old['archive_paths'])<=paths,('history',n,set(old['archive_paths'])-paths)
required={
 'mathillustrator/tests/cut24.test.mjs','mathillustrator/tests/browser_cut24.py',
 'mathillustrator/tests/browser_cut24_performance.py','mathillustrator/tests/browser_cut24_sweep.py',
 'mathillustrator/tests/package_integrity_cut24.py',
 'mathillustrator/docs/quality/cut24-regressions.json',
 'mathillustrator/docs/quality/cut24-browser-results.json',
 'mathillustrator/docs/quality/cut24-performance.json',
 'mathillustrator/docs/quality/TEST_REPORT_20261112_CUT24.md',
 'mathillustrator/src/diagram_routing.mjs'
}
assert required<=paths
assert 'Two independent mathematical tools:' in (site/'tools.html').read_text(encoding='utf8')
assert 'href="mathillustrator/"' in (site/'index.html').read_text(encoding='utf8')
assert all('mathreader/' not in p and '__pycache__' not in p for p in paths)
ignored={'mathillustrator/docs/quality/cut24-package.json','mathillustrator/docs/quality/package-files.json'}
assert set(meta['sha256'])==paths-ignored
for path,digest in meta['sha256'].items():
 assert hashlib.sha256((site/path).read_bytes()).hexdigest()==digest,path
print(f'CUT24_PACKAGE_INTEGRITY_PASS: {len(paths)} paths, {len(meta["sha256"])} SHA256 checks; Cut02–23 coverage')
