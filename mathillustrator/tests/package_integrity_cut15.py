"""Cut15 site-root cumulative package gate; hash checks exclude two self-referential manifests.
Usage: python tests/package_integrity_cut15.py [EXTRACTED_ROOT]
"""
from pathlib import Path
import hashlib,json,sys
site=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
q=site/'mathillustrator/docs/quality'
meta=json.loads((q/'cut15-package.json').read_text(encoding='utf8'))
other=json.loads((q/'package-files.json').read_text(encoding='utf8'))
assert meta==other,'Current package manifests disagree'
assert meta['cut']=='15' and meta['release']=='0.16.0'
paths=set(meta['archive_paths'])
assert len(paths)==meta['paths_total']
assert {'index.html','tools.html'}<=paths
assert all(x in {'index.html','tools.html'} or x.startswith('mathillustrator/') for x in paths)
assert all((site/x).is_file() for x in paths),[x for x in paths if not (site/x).is_file()]
actual={p.relative_to(site).as_posix() for p in (site/'mathillustrator').rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
assert actual=={x for x in paths if x.startswith('mathillustrator/')},('extra',actual-paths,'missing',paths-actual)
for n in range(2,15):
 old=json.loads((q/f'cut{n:02d}-package.json').read_text(encoding='utf8'))
 assert set(old['archive_paths'])<=paths,('historical coverage',n,set(old['archive_paths'])-paths)
required={'mathillustrator/tests/cut15.test.mjs','mathillustrator/tests/browser_cut15.py','mathillustrator/tests/browser_cut15_mobile.py','mathillustrator/docs/quality/cut15-regressions.json','mathillustrator/docs/quality/cut15-coverage-matrix.json','mathillustrator/docs/quality/TEST_REPORT_20261112_CUT15.md'}
assert required<=paths
assert 'Two independent mathematical tools:' in (site/'tools.html').read_text(encoding='utf8')
assert 'href="mathillustrator/"' in (site/'index.html').read_text(encoding='utf8')
assert not any('mathreader/' in x or '__pycache__' in x or x.endswith('.pyc') for x in paths)
ignored={'mathillustrator/docs/quality/cut15-package.json','mathillustrator/docs/quality/package-files.json'}
assert set(meta['sha256'])==paths-ignored
for x,h in meta['sha256'].items():assert hashlib.sha256((site/x).read_bytes()).hexdigest()==h,x
print(f'CUT15_PACKAGE_INTEGRITY_PASS: {len(paths)} root-relative files, {len(meta["sha256"])} SHA-256 checks, all Cut02–14 paths retained')
