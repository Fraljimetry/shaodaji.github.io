#!/usr/bin/env python3
"""Grounded PDF text-location oracle, NOT MathReader navigation certification.

JSON schema documented in README. Stdlib plus PyMuPDF (fitz).
No guessed locations: every case requires a reviewed PDF checksum and rectangle.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path


def _digest(path):
    h = hashlib.sha256()
    with path.open('rb') as file:
        for part in iter(lambda: file.read(1024 * 1024), b''):
            h.update(part)
    return h.hexdigest()


def verify(manifest_path):
    manifest_path = Path(manifest_path).resolve()
    output = {'schemaVersion': 1, 'evidence': 'pdf-native-text-geometry', 'status': 'INCOMPLETE',
              'navigationCertified': False, 'cases': [], 'counts': {'PASS': 0, 'FAIL': 0, 'INCOMPLETE': 0}}
    try:
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        output['reason'] = f'manifest cannot be loaded: {type(exc).__name__}: {exc}'
        return output
    if not isinstance(manifest, dict) or manifest.get('schemaVersion') != 1 or not isinstance(manifest.get('documents'), list) or not manifest['documents']:
        output['reason'] = 'manifest requires schemaVersion=1 and nonempty documents'
        return output
    try:
        import fitz
    except ImportError:
        output['reason'] = 'PyMuPDF (fitz) is unavailable'
        return output
    for index, docspec in enumerate(manifest['documents']):
        docname = f'document:{index}'
        def append(name, status, reason, **extra):
            output['cases'].append({'name': name, 'status': status, 'reason': reason, **extra})
        if not isinstance(docspec, dict):
            append(docname, 'FAIL', 'document entry must be an object')
            continue
        pdf_rel = docspec.get('pdf')
        checksum = docspec.get('sha256')
        targets = docspec.get('targets')
        if not isinstance(pdf_rel, str) or not pdf_rel or not isinstance(checksum, str) or len(checksum) != 64 or not all(c in '0123456789abcdef' for c in checksum.lower()) or not isinstance(targets, list) or not targets:
            append(docname, 'FAIL', 'document requires PDF path, 64-character SHA256, and nonempty targets')
            continue
        source = (manifest_path.parent / pdf_rel).resolve()
        if not source.is_relative_to(manifest_path.parent):
            append(docname, 'FAIL', 'PDF path escapes manifest directory')
            continue
        if not source.is_file():
            append(docname, 'INCOMPLETE', 'PDF file missing')
            continue
        if _digest(source) != checksum.lower():
            append(docname, 'FAIL', 'PDF SHA256 differs from oracle manifest')
            continue
        try:
            pdf = fitz.open(source)
        except Exception as exc:
            append(docname, 'FAIL', f'PDF cannot be opened: {type(exc).__name__}: {exc}')
            continue
        try:
            if pdf.needs_pass:
                append(docname, 'INCOMPLETE', 'encrypted PDF requires credentials')
                continue
            for n, case in enumerate(targets):
                name = f'{pdf_rel}:target:{n}'
                if not isinstance(case, dict):
                    append(name, 'FAIL', 'target must be an object')
                    continue
                text = case.get('text')
                page = case.get('page')
                rect = case.get('rect')
                kind = case.get('kind')
                if kind not in {'structure', 'results', 'equations', 'bibliography', 'navigation'} or not isinstance(text, str) or not text.strip() or type(page) is not int or not isinstance(rect, list) or len(rect) != 4 or not all(type(v) in (float, int) and math.isfinite(v) for v in rect):
                    append(name, 'FAIL', 'target requires kind, nonempty text, integer 1-based page, and finite four-value rect')
                    continue
                if page < 1 or page > len(pdf):
                    append(name, 'FAIL', 'page out of bounds')
                    continue
                p = pdf[page - 1]
                expected = fitz.Rect(rect)
                if expected.is_empty or expected.is_infinite or not p.rect.contains(expected):
                    append(name, 'FAIL', 'target rectangle is invalid or outside page')
                    continue
                hits = p.search_for(text.strip())
                if not hits:
                    append(name, 'FAIL', 'text absent from this page text layer; raster/scanned pages need separate ground truth')
                    continue
                # Compare the overlap, not nearest-character geometry: prevent incorrect navigation target matches.
                tolerance = case.get('tolerancePt', 5)
                if type(tolerance) not in (int, float) or not math.isfinite(tolerance) or not 0 <= tolerance <= 30:
                    append(name, 'FAIL', 'tolerancePt must be between 0 and 30')
                    continue
                expanded = expected + (-tolerance, -tolerance, tolerance, tolerance)
                overlaps = [h for h in hits if (h & expanded).get_area() / max(h.get_area(), 1e-6) >= 0.5]
                if not overlaps:
                    append(name, 'FAIL', 'text occurs, but not within expected target rectangle', foundRects=[list(h) for h in hits[:5]])
                else:
                    append(name, 'PASS', 'text and geometry matched original PDF text layer', page=page, kind=kind,
                           matchedRect=list(overlaps[0]))
        finally:
            pdf.close()
    for case in output['cases']:
        output['counts'][case['status']] += 1
    output['status'] = 'FAIL' if output['counts']['FAIL'] else ('INCOMPLETE' if output['counts']['INCOMPLETE'] or not output['cases'] else 'PASS')
    output['documentsChecked'] = len(manifest['documents'])
    return output


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args(argv)
    report = verify(args.manifest)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'status': report['status'], 'counts': report['counts'], 'navigationCertified': False}, ensure_ascii=False))
    return {'PASS': 0, 'FAIL': 1, 'INCOMPLETE': 2}[report['status']]


if __name__ == '__main__':
    raise SystemExit(main())
