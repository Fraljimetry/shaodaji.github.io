"""Cut19 cumulative-root overlay coverage, reproducible checksums and history.
Use against an extracted ZIP site root. Does not alter files.
"""
from pathlib import Path
import hashlib,json,sys
site=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
q=site/'mathillustrator/docs/quality'
meta=json.loads((q/'cut19-package.json').read_text(encoding='utf8'))
assert meta==json.loads((q/'package-files.json').read_text(encoding='utf8'))
assert meta['cut']=='19' and meta['release']=='0.20.0'
paths=set(meta['archive_paths'])
assert len(paths)==meta['paths_total']
assert {'index.html','tools.html'}<=paths
assert all(p in {'index.html','tools.html'} or p.startswith('mathillustrator/') for p in paths)
assert all((site/p).is_file() for p in paths)
actual={p.relative_to(site).as_posix() for p in (site/'mathillustrator').rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
assert actual==paths-{'index.html','tools.html'},('missing',paths-actual-{'index.html','tools.html'},'extra',actual-paths)
for n in range(2,19):
 old=json.loads((q/f'cut{n:02d}-package.json').read_text(encoding='utf8'))
 assert set(old['archive_paths'])<=paths,('prior coverage',n,set(old['archive_paths'])-paths)
required={
 'mathillustrator/tests/cut19.test.mjs','mathillustrator/tests/browser_cut19.py',
 'mathillustrator/tests/browser_cut19_performance.py','mathillustrator/tests/package_integrity_cut19.py',
 'mathillustrator/docs/quality/cut19-regressions.json','mathillustrator/docs/quality/cut19-performance.json',
 'mathillustrator/docs/quality/cut19-browser-results.json',
 'mathillustrator/docs/quality/TEST_REPORT_20261112_CUT19.md'}
assert required<=paths
assert all('mathreader/' not in p and '__pycache__' not in p for p in paths)
assert 'Two independent mathematical tools:' in (site/'tools.html').read_text(encoding='utf8')
assert 'href="mathillustrator/"' in (site/'index.html').read_text(encoding='utf8')
ignored={'mathillustrator/docs/quality/cut19-package.json','mathillustrator/docs/quality/package-files.json'}
assert set(meta['sha256'])==paths-ignored
for n,h in meta['sha256'].items():
 assert hashlib.sha256((site/n).read_bytes()).hexdigest()==h,n
print(f'CUT19_PACKAGE_INTEGRITY_PASS: {len(paths)} files, {len(meta["sha256"])} SHA256 checks; Cut02-18 coverage')
