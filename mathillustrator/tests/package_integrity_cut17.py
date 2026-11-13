"""Cut17 cumulative overlay gate: existing previous cuts preserved, no MathReader changes."""
from pathlib import Path
import hashlib,json,sys
site=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[2]
quality=site/'mathillustrator/docs/quality'
meta=json.loads((quality/'cut17-package.json').read_text(encoding='utf8'))
assert meta==json.loads((quality/'package-files.json').read_text(encoding='utf8'))
assert meta['cut']=='17' and meta['release']=='0.18.0'
paths=set(meta['archive_paths'])
assert len(paths)==meta['paths_total'] and {'index.html','tools.html'}<=paths
assert all(p in {'index.html','tools.html'} or p.startswith('mathillustrator/') for p in paths)
assert all((site/p).is_file() for p in paths)
actual={p.relative_to(site).as_posix() for p in (site/'mathillustrator').rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc'}
assert actual==paths-{'index.html','tools.html'},('missing',paths-actual-{'index.html','tools.html'},'extra',actual-paths)
for n in range(2,17):
 old=json.loads((quality/f'cut{n:02d}-package.json').read_text(encoding='utf8'))
 assert set(old['archive_paths'])<=paths,('prior-cut coverage',n,set(old['archive_paths'])-paths)
required={'mathillustrator/tests/cut17.test.mjs','mathillustrator/tests/browser_cut17.py','mathillustrator/tests/browser_cut17_performance.py','mathillustrator/tests/package_integrity_cut17.py','mathillustrator/docs/quality/cut17-regressions.json','mathillustrator/docs/quality/cut17-coverage-matrix.json','mathillustrator/docs/quality/cut17-performance.json','mathillustrator/docs/quality/TEST_REPORT_20261112_CUT17.md'}
assert required<=paths
assert 'Two independent mathematical tools:' in (site/'tools.html').read_text(encoding='utf8')
assert 'href="mathillustrator/"' in (site/'index.html').read_text(encoding='utf8')
assert all('mathreader/' not in p and '__pycache__' not in p and not p.endswith('.pyc') for p in paths)
ignored={'mathillustrator/docs/quality/cut17-package.json','mathillustrator/docs/quality/package-files.json'}
assert set(meta['sha256'])==paths-ignored
for name,expected in meta['sha256'].items():assert hashlib.sha256((site/name).read_bytes()).hexdigest()==expected,name
print(f'CUT17_PACKAGE_INTEGRITY_PASS: {len(paths)} root-relative files; {len(meta["sha256"])} SHA-256 checks; historical Cut02–16 paths retained')
