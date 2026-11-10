#!/usr/bin/env python3
"""Replay real mathematical PDFs against MathReader's native-text detectors.

USAGE (from mathreader/):
  python regression_tools/native_span_corpus_v422.py --pdf-dir /path/to/original/pdfs --out-dir /path/to/evidence

Requires PyMuPDF and Node. Extracts PyMuPDF spans with coordinates compatible
with PDF.js-inspired indexing and executes the PRODUCTION JS detector functions
through corpus_detector_vm_v422.js. This is a native-span proxy, NOT genuine
PDF.js rendering/OCR, and reports candidates, NOT document-level accuracy.
Original PDFs are never embedded in the generated evidence or patch.
"""
import argparse
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path


def page_items(doc, page):
    for block in page.get_text('dict', flags=doc.TEXT_PRESERVE_WHITESPACE)['blocks']:
        for line in block.get('lines', []):
            for span in line.get('spans', []):
                source = span.get('text', '')
                if not source.strip():
                    continue
                start_x, start_y, end_x, end_y = span['bbox']
                ox, oy = span.get('origin', (start_x, end_y))
                size = float(span.get('size', 10.0))
                yield {'str': source, 'width': max(0, end_x-start_x),
                       'height': max(0, end_y-start_y),
                       'transform': [size, 0, 0, size, ox, page.rect.height-oy],
                       'fontName': span.get('font', '')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf-dir', required=True, type=Path)
    parser.add_argument('--out-dir', required=True, type=Path)
    parser.add_argument('--timeout', type=int, default=90)
    args = parser.parse_args()
    try:
        import fitz
    except ImportError as exc:
        parser.error(f'PyMuPDF is required (pip install pymupdf): {exc}')
    args.out_dir.mkdir(parents=True, exist_ok=True)
    extracted = args.out_dir/'extracted'; extracted.mkdir(exist_ok=True)
    detailed = args.out_dir/'results'; detailed.mkdir(exist_ok=True)
    runner = Path(__file__).resolve().with_name('corpus_detector_vm_v422.js')
    if not runner.is_file():
        raise FileNotFoundError(runner)
    records = []
    for i, pdf in enumerate(sorted(args.pdf_dir.glob('*.pdf')), 1):
        t = time.monotonic()
        row = {'id': f'new{i:02d}', 'name': pdf.name,
               'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(),
               'extraction': 'pymupdf_native_spans', 'detector': 'production_js_vm_proxy'}
        try:
            with fitz.open(pdf) as doc:
                pages = []
                for n, page in enumerate(doc):
                    pages.append({'page': n+1,
                                  'view': [0, 0, page.rect.width, page.rect.height],
                                  'items': list(page_items(fitz, page))})
            fixture = {'filename': pdf.name, 'sha256': row['sha256'], 'pages': pages}
            source_file = extracted/f'{i:02d}.json'
            source_file.write_text(json.dumps(fixture, ensure_ascii=False), encoding='utf8')
            run = subprocess.run(['node', str(runner), str(source_file)],
                                 capture_output=True, text=True, timeout=args.timeout)
            if run.returncode:
                raise RuntimeError(run.stderr.strip() or f'Node exit {run.returncode}')
            result = json.loads(run.stdout)
            (detailed/f'{i:02d}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
            row.update({'pages': len(pages), 'native_chars': result['native_chars'],
                        **result['summary'],
                        'stages': {k: v['status'] for k, v in result['stages'].items()}})
            if not all(s == 'PASS' for s in row['stages'].values()):
                row['error'] = result['stages']
        except Exception as exc:
            row['error'] = str(exc)
        row['elapsed_seconds'] = round(time.monotonic()-t, 3)
        records.append(row)
        print(f'{i:02d} {"FAIL" if row.get("error") else "PASS"} {pdf.name}', flush=True)
    (args.out_dir/'corpus_summary.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf8')
    print(f'PDF files: {len(records)}, passing: {sum(not r.get("error") for r in records)}')
    return 1 if any(r.get('error') for r in records) else 0


if __name__ == '__main__':
    sys.exit(main())
