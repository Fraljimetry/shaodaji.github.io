#!/usr/bin/env python3
"""Score reviewed mathematical index targets against an actual MathReader reading-data export.

The export is an observation of saved MathReader indexes, *not* evidence of a browser
click, actual PDF coordinates, fresh detection, or real OCR inference.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path

KINDS = ('structure', 'results', 'equations', 'bibliography')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def finite_number(value):
    return type(value) in (float, int) and math.isfinite(value)


def canonical_label(value):
    return ' '.join(str(value).strip().casefold().split())


def observations(detection, kind):
    if kind == 'equations':
        source = detection.get(kind)
        return source.get('rows') if isinstance(source, dict) else None
    return detection.get(kind)


def verify(manifest_path):
    path = Path(manifest_path).resolve()
    report = {'schemaVersion': 1, 'evidence': 'mathreader-saved-export-index-comparison',
              'status': 'INCOMPLETE', 'navigationCertified': False, 'freshDetectionCertified': False,
              'cases': [], 'metrics': {}, 'counts': {'PASS': 0, 'FAIL': 0, 'INCOMPLETE': 0}}
    def add(name, status, reason, **extra):
        report['cases'].append({'name': name, 'status': status, 'reason': reason, **extra})
    try:
        manifest = json.loads(path.read_text(encoding='utf8'))
    except (ValueError, OSError) as exc:
        report['reason'] = f'cannot load manifest: {type(exc).__name__}: {exc}'
        return report
    if not isinstance(manifest, dict) or manifest.get('schemaVersion') != 1 or not isinstance(manifest.get('documents'), list) or not manifest['documents']:
        report['reason'] = 'manifest requires schemaVersion 1 and nonempty documents'
        return report
    for i, spec in enumerate(manifest['documents']):
        name = f'document:{i}'
        if not isinstance(spec, dict) or not isinstance(spec.get('export'), str) or not spec['export'] or not isinstance(spec.get('sha256'), str) or not isinstance(spec.get('targets'), list) or not spec['targets']:
            add(name, 'FAIL', 'requires export, sha256 and nonempty reviewed targets')
            continue
        export_path = (path.parent / spec['export']).resolve()
        if not export_path.is_relative_to(path.parent):
            add(name, 'FAIL', 'export path escapes manifest directory')
            continue
        if not export_path.is_file():
            add(name, 'INCOMPLETE', 'export is missing')
            continue
        if not isinstance(spec['sha256'], str) or len(spec['sha256']) != 64 or not all(c in '0123456789abcdef' for c in spec['sha256'].lower()) or digest(export_path) != spec['sha256'].lower():
            add(name, 'FAIL', 'export checksum invalid or mismatched')
            continue
        try:
            exported = json.loads(export_path.read_text(encoding='utf8'))
        except (OSError, ValueError):
            add(name, 'FAIL', 'invalid export JSON')
            continue
        if not isinstance(exported, dict) or exported.get('schema') != 'mathreader.reading-data@1':
            add(name, 'FAIL', 'not a MathReader reading-data export')
            continue
        info = exported.get('document')
        if not isinstance(info, dict) or not isinstance(info.get('id'), str) or not info['id'].strip() or type(info.get('pages')) is not int or info['pages'] < 1:
            add(name, 'FAIL', 'export lacks valid document identity/page count')
            continue
        if spec.get('documentId') != info['id']:
            add(name, 'FAIL', 'document identity mismatch or missing reviewed documentId')
            continue
        if spec.get('pageCount') != info['pages']:
            add(name, 'FAIL', 'document page count mismatch or missing reviewed pageCount')
            continue
        detection = exported.get('contentDetection')
        layers = exported.get('exportLayers')
        if not isinstance(layers, dict) or layers.get('detection') != 'included' or not isinstance(detection, dict) or detection.get('version') != 1:
            add(name, 'INCOMPLETE', 'export does not include portable content-detection snapshot')
            continue
        actual_by_kind = {}
        bad_kind = False
        for kind in KINDS:
            rows = observations(detection, kind)
            if not isinstance(rows, list):
                add(name + ':' + kind, 'INCOMPLETE', 'index missing or malformed; not an empty index')
                bad_kind = True
                continue
            clean = []
            for j, row in enumerate(rows):
                label = row.get('label') if isinstance(row, dict) else None
                if kind == 'bibliography' and isinstance(row, dict):
                    label = row.get('number', label)
                if not isinstance(row, dict) or not isinstance(label, str) or not label.strip() or type(row.get('page')) is not int or not 1 <= row['page'] <= info['pages'] or not finite_number(row.get('ratio')) or not 0 <= row['ratio'] <= 1:
                    add(f'{name}:{kind}:row:{j}', 'FAIL', 'invalid observed index location or label')
                    bad_kind = True
                    continue
                clean.append({'kind': kind, 'label': canonical_label(label), 'page': row['page'], 'ratio': row['ratio']})
            actual_by_kind[kind] = clean
        targets = spec['targets']
        used = {k: set() for k in KINDS}
        selected = {k: 0 for k in KINDS}
        matched = {k: 0 for k in KINDS}
        expected_count = {k: 0 for k in KINDS}
        for t, target in enumerate(targets):
            case_name = f'{name}:target:{t}'
            if not isinstance(target, dict):
                add(case_name, 'FAIL', 'target must be an object')
                continue
            kind, label, page, ratio = (target.get(k) for k in ('kind', 'label', 'page', 'ratio'))
            tolerance = target.get('toleranceRatio', .025)
            if kind not in KINDS or not isinstance(label, str) or not label.strip() or type(page) is not int or not 1 <= page <= info['pages'] or not finite_number(ratio) or not 0 <= ratio <= 1 or not finite_number(tolerance) or not 0 <= tolerance <= .1:
                add(case_name, 'FAIL', 'invalid reviewed target fields')
                continue
            expected_count[kind] += 1
            if kind not in actual_by_kind:
                add(case_name, 'INCOMPLETE', 'index observations unavailable')
                continue
            entries = actual_by_kind[kind]
            compatible = [(j, abs(row['ratio'] - ratio)) for j, row in enumerate(entries) if j not in used[kind] and row['label'] == canonical_label(label) and row['page'] == page]
            if compatible:
                j, diff = min(compatible, key=lambda item: item[1])
                used[kind].add(j)
                if diff <= tolerance:
                    matched[kind] += 1
                    add(case_name, 'PASS', 'label/page/position matched exported detector index', distanceRatio=diff)
                else:
                    add(case_name, 'FAIL', 'matching label/page exists at wrong reading position', distanceRatio=diff)
            else:
                add(case_name, 'FAIL', 'expected entry absent or on wrong page')
        # Precision only has a defined denominator if human reviewers explicitly
        # attest the index has exhaustive ground truth for this document/kind.
        exhaustive = spec.get('exhaustiveKinds', [])
        if not isinstance(exhaustive, list) or any(k not in KINDS for k in exhaustive) or len(set(exhaustive)) != len(exhaustive):
            add(name, 'FAIL', 'exhaustiveKinds must be a unique list of supported kinds')
            exhaustive = []
        for kind in KINDS:
            if kind not in actual_by_kind:
                continue
            observed = len(actual_by_kind[kind])
            exp = expected_count[kind]
            hit = matched[kind]
            report['metrics'][name + ':' + kind] = {
                'reviewedTargets': exp, 'matchedTargets': hit, 'exportedEntries': observed,
                'reviewedRecall': (hit / exp if exp else None),
                'precision': (hit / observed if kind in exhaustive and observed else None),
                'exhaustiveReview': kind in exhaustive,
                'evidence': 'saved-index-export-not-fresh-detection',
            }
            if kind in exhaustive and observed > hit:
                add(name + ':' + kind + ':exhaustiveness', 'FAIL', f'{observed - hit} exported entries not corroborated by exhaustive reviewed targets')
        if bad_kind:
            continue
    for case in report['cases']:
        report['counts'][case['status']] += 1
    report['status'] = 'FAIL' if report['counts']['FAIL'] else ('INCOMPLETE' if report['counts']['INCOMPLETE'] or not report['cases'] else 'PASS')
    report['documentsChecked'] = len(manifest['documents'])
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args(argv)
    result = verify(args.manifest)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
    print(json.dumps({'status': result['status'], 'counts': result['counts'], 'navigationCertified': False}))
    return {'PASS': 0, 'FAIL': 1, 'INCOMPLETE': 2}[result['status']]


if __name__ == '__main__':
    raise SystemExit(main())
