"""MathIllustrator Cut13 release gate. Run on a freshly extracted ZIP root.
No deployed HTTP/cross-browser claim. No external MathReader files included.
"""
from pathlib import Path
import hashlib,json,sys
site=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
quality=site/'mathillustrator/docs/quality'
meta=json.loads((quality/'cut13-package.json').read_text(encoding='utf8'))
listing=json.loads((quality/'package-files.json').read_text(encoding='utf8'))
paths=set(meta['archive_paths']);assert paths==set(listing['archive_paths'])
assert meta['release']==listing['release']=='0.14.0'
assert meta['cut']==listing['cut']=='13'
assert len(paths)==meta['paths_total']==listing['paths_total']
assert {'index.html','tools.html'}<=paths
assert all(path in {'index.html','tools.html'} or path.startswith('mathillustrator/') for path in paths)
assert all((site/path).is_file() for path in paths)
actual={p.relative_to(site).as_posix() for p in (site/'mathillustrator').rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
assert actual=={path for path in paths if path.startswith('mathillustrator/')},('extra',actual-paths,'missing',paths-actual)
for cut in [f'{i:02d}' for i in range(2,13)]:
 previous=json.loads((quality/f'cut{cut}-package.json').read_text(encoding='utf8'))
 assert set(previous['archive_paths'])<=paths, ('historical-coverage',cut,set(previous['archive_paths'])-paths)
required={'mathillustrator/tests/model.test.mjs','mathillustrator/tests/cut13.test.mjs','mathillustrator/tests/browser_cut13.py','mathillustrator/docs/quality/cut13-control-state-matrix.json','mathillustrator/docs/quality/TEST_REPORT_20261112_CUT13.md','mathillustrator/examples/geometry-demo.json','mathillustrator/docs/schemas/project-v1.schema.json'}
assert required<=paths,required-paths
assert not any('mathreader/' in x or '__pycache__' in x or x.endswith('.pyc') for x in paths)
assert 'Two independent mathematical tools:' in (site/'tools.html').read_text(encoding='utf8')
assert 'href="mathillustrator/"' in (site/'index.html').read_text(encoding='utf8')
assert 'href="mathreader/"' in (site/'tools.html').read_text(encoding='utf8')
checks=meta['sha256'];assert checks==listing['sha256']
ignored={'mathillustrator/docs/quality/cut13-package.json','mathillustrator/docs/quality/package-files.json'}
assert set(checks)==paths-ignored
for rel,h in checks.items():assert hashlib.sha256((site/rel).read_bytes()).hexdigest()==h,rel
print(f'CUT13_PACKAGE_INTEGRITY_PASS: {len(paths)} cumulative paths, {len(checks)} checked SHA256 digests, all Cut02–12 files present')
