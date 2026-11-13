"""Cut14 exact extracted-cumulative-overlay gate. Use on site-root extraction.

Historical per-cut manifests remain immutable. package_integrity.py points to this
current version, not a frozen older release file. Does not certify hosting.
"""
from pathlib import Path
import hashlib,json,sys
site=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
quality=site/'mathillustrator/docs/quality'
meta=json.loads((quality/'cut14-package.json').read_text(encoding='utf8'))
listing=json.loads((quality/'package-files.json').read_text(encoding='utf8'))
paths=set(meta['archive_paths'])
assert paths==set(listing['archive_paths'])
assert meta['release']==listing['release']=='0.15.0'
assert meta['cut']==listing['cut']=='14'
assert len(paths)==meta['paths_total']==listing['paths_total']
assert {'index.html','tools.html'}<=paths
assert all(path in {'index.html','tools.html'} or path.startswith('mathillustrator/') for path in paths)
assert all((site/path).is_file() for path in paths)
actual={p.relative_to(site).as_posix() for p in (site/'mathillustrator').rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
assert actual=={path for path in paths if path.startswith('mathillustrator/')},('extra',actual-paths,'missing',paths-actual)
for cut in [f'{i:02d}' for i in range(2,14)]:
 previous=json.loads((quality/f'cut{cut}-package.json').read_text(encoding='utf8'))
 assert set(previous['archive_paths'])<=paths,('historical-coverage',cut,set(previous['archive_paths'])-paths)
required={'mathillustrator/tests/model.test.mjs','mathillustrator/tests/cut13.test.mjs','mathillustrator/tests/browser_cut14.py','mathillustrator/docs/quality/cut14-regressions.json','mathillustrator/docs/quality/TEST_REPORT_20261112_CUT14.md','mathillustrator/examples/geometry-demo.json','mathillustrator/docs/schemas/project-v1.schema.json'}
assert required<=paths,required-paths
assert not any('mathreader/' in x or '__pycache__' in x or x.endswith('.pyc') for x in paths)
assert 'Two independent mathematical tools:' in (site/'tools.html').read_text(encoding='utf8')
assert 'href="mathillustrator/"' in (site/'index.html').read_text(encoding='utf8')
assert 'href="mathreader/"' in (site/'tools.html').read_text(encoding='utf8')
checks=meta['sha256']
assert checks==listing['sha256']
ignored={'mathillustrator/docs/quality/cut14-package.json','mathillustrator/docs/quality/package-files.json'}
assert set(checks)==paths-ignored
for rel,h in checks.items():assert hashlib.sha256((site/rel).read_bytes()).hexdigest()==h,rel
print(f'CUT14_PACKAGE_INTEGRITY_PASS: {len(paths)} paths, {len(checks)} SHA-256 checks, all Cut02–13 files preserved')
