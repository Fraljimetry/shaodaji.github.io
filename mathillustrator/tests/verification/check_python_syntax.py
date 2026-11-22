#!/usr/bin/env python3
"""Parse every repository Python test/helper without writing bytecode files."""
import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
paths = sorted((ROOT / 'tests').rglob('*.py'))
if not paths:
    raise SystemExit('FAIL: no Python verification files found')
errors = []
for path in paths:
    try:
        ast.parse(path.read_text(encoding='utf8'), filename=str(path))
    except (SyntaxError, UnicodeError, OSError) as exc:
        errors.append(f'{path.relative_to(ROOT)}: {exc}')
if errors:
    raise SystemExit('FAIL: Python syntax errors\n' + '\n'.join(errors))
print(f'PYTHON_SOURCE_SYNTAX_PASS {len(paths)}/{len(paths)}')
