#!/usr/bin/env python3
"""Remove only byte-identical root docs after the v414 docs ZIP has been overlaid.

All source and destination hashes are verified before the first deletion.
A modified old file triggers a fail-closed error and is never removed.
"""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
LAYOUT = json.loads((Path(__file__).parent / 'layout.json').read_text(encoding='utf8'))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    pending = []
    for item in LAYOUT['moved_root_docs']:
        old = ROOT / item['source']
        new = ROOT / item['target']
        expected = item['sha256']
        if not new.is_file() or digest(new) != expected:
            raise ValueError(f'Missing/mismatched relocated file; nothing removed: {new}')
        if old.exists():
            if not old.is_file() or digest(old) != expected:
                raise ValueError(f'Original file was modified; nothing removed: {old}')
            pending.append(old)
    # Only execute removals after the COMPLETE preflight passes.
    for old in pending:
        old.unlink()
    print(f'MathReader documentation: verified {len(LAYOUT["moved_root_docs"])} destinations; '
          f'removed {len(pending)} old duplicates')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
