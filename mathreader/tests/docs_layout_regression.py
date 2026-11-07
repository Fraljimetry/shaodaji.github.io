#!/usr/bin/env python3
"""MathReader documentation-only layout and lossless history gate (no network)."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
layout = json.loads((ROOT / 'docs/layout.json').read_text(encoding='utf8'))


def sha(b):
    return hashlib.sha256(b).hexdigest()


def verify():
    assert layout['schema'] == 1 and layout['source_version'] == 'v414'
    seen = set()
    for m in layout['moved_root_docs']:
        src, dst = ROOT / m['source'], ROOT / m['target']
        assert m['target'] not in seen
        seen.add(m['target'])
        assert dst.is_file(), dst
        assert sha(dst.read_bytes()) == m['sha256'], dst
        # A fully migrated tree must have no original root duplicates.
        assert not src.exists(), src
    current = (ROOT / 'REGRESSION.md').read_bytes()
    marker = layout['regression_prefix_marker'].encode('utf8')
    assert marker in current
    current_record = current.split(marker,1)[1]
    parts = layout['regression_parts']
    assert parts[0]['path'] == 'REGRESSION.md'
    original = bytearray()
    previous_end = 0
    for p in parts:
        assert p['start_line'] == previous_end + 1
        previous_end = p['end_line']
        data = current_record if p['path'] == 'REGRESSION.md' else (ROOT / p['path']).read_bytes()
        assert sha(data) == p['sha256'], p['path']
        assert len(data.splitlines()) == p['end_line'] - p['start_line'] + 1
        original.extend(data)
    assert sha(original) == layout['source_regression_sha256'], 'Regression history not losslessly preserved'
    assert len(list(ROOT.glob('*.md'))) == 1, 'Root should contain only REGRESSION.md'
    assert (ROOT / 'docs/README.md').is_file()
    print(f'OK: docs layout; {len(seen)} moved docs; {len(parts)} regression partitions; original SHA-256 intact')


if __name__ == '__main__':
    verify()
