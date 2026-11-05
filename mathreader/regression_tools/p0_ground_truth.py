#!/usr/bin/env python3
"""Strict P0 comparison of *actual browser* captures to human-reviewed PDF truth.

Never promotes source-level probes, fake browsers, syntax-only formula tests or
partially reviewed documents to fully verified PASS.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import unicodedata

SCHEMA = 1
CATEGORIES = ('structure', 'results', 'equations', 'bibliography')
ALL_COVERAGE = (*CATEGORIES, 'formulas')
HEX64 = re.compile(r'^[a-f0-9]{64}$')


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def norm(value: object) -> str:
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', str(value or ''))).strip()


def latex_norm(value: object) -> str:
    # Strict literal comparison: even spaces within \text{...} can matter.
    return unicodedata.normalize('NFC', str(value or '')).strip()


def fingerprint(entry: dict, category: str):
    if category == 'structure':
        return (norm(entry.get('title')), int(entry['page']))
    if category == 'results':
        return (norm(entry.get('label')), norm(entry.get('title')), int(entry['page']))
    if category == 'equations':
        return (norm(entry.get('label')), int(entry['page']))
    return (norm(entry.get('label')), norm(entry.get('title')), int(entry['page']))


def compare_items(expected: list, actual: list, category: str) -> list[str]:
    if not isinstance(expected, list) or not isinstance(actual, list):
        return [f'{category}: expected and captured values must be arrays']
    issues = []
    try:
        wanted = Counter(fingerprint(e, category) for e in expected)
        observed = Counter(fingerprint(e, category) for e in actual)
    except (KeyError, TypeError, ValueError, OverflowError) as error:
        return [f'{category}: malformed index entry ({error})']
    for key, count in sorted((wanted - observed).items(), key=lambda v: str(v[0])):
        issues.append(f'{category}: missing {count} × {key}')
    for key, count in sorted((observed - wanted).items(), key=lambda v: str(v[0])):
        issues.append(f'{category}: extra {count} × {key}')
    # Within a matched label/page family, verify distinct per-page locations,
    # including duplicates, rather than assuming that matching counts suffice.
    if wanted == observed:
        for key in sorted(wanted, key=str):
            target = sorted(float(e['ratio']) for e in expected if fingerprint(e, category) == key and e.get('ratio') is not None)
            if not target:
                continue
            found = sorted(float(e['ratio']) for e in actual if fingerprint(e, category) == key and e.get('ratio') is not None)
            if len(found) != len(target) or any(abs(a-b) > .025 for a,b in zip(target, found)):
                issues.append(f'{category}: location mismatch {key}: expected {target}, observed {found}')
    return issues


def is_complete_review(truth: dict, pages: int) -> tuple[bool, list[str]]:
    gaps = []
    if not isinstance(truth, dict):
        return False, ['no independent ground truth']
    if not isinstance(truth.get('indexes'), dict):
        return False, ['complete independent index inventories are absent']
    reviewer = norm(truth.get('reviewer'))
    reviewed_at = truth.get('reviewed_at')
    if not reviewer or not isinstance(reviewed_at, str) or not re.match(r'^\d{4}-\d\d-\d\d', reviewed_at):
        gaps.append('human reviewer and reviewed_at required')
    try:
        checked_pages = set(int(p) for p in truth.get('reviewed_pages', []))
        if checked_pages != set(range(1, pages + 1)):
            gaps.append(f'reviewed pages incomplete ({len(checked_pages)}/{pages})')
    except (TypeError, ValueError):
        gaps.append('invalid reviewed_pages')
    if set(truth.get('complete_categories', [])) != set(ALL_COVERAGE):
        gaps.append('Structure/Results/Equations/Bibliography/formula inventory not all reviewed')
    for category in CATEGORIES:
        if not isinstance(truth.get('indexes', {}).get(category), list):
            gaps.append(f'{category} expected entries missing (use [] for verified absence)')
    if not isinstance(truth.get('formulas'), list):
        gaps.append('reviewed formula inventory absent')
    else:
        ids = set()
        for formula in truth['formulas']:
            if not isinstance(formula, dict):
                gaps.append('formula inventory contains non-object'); continue
            case_id = norm(formula.get('id'))
            if (not case_id or case_id in ids or not norm(formula.get('latex'))
                or not isinstance(formula.get('page'), int) or not 1 <= formula['page'] <= pages
                or not HEX64.fullmatch(str(formula.get('crop_sha256', '')))):
                gaps.append(f'formula {case_id or "(missing id)"}: missing/duplicate/invalid original crop or approved LaTeX')
            ids.add(case_id)
    try:
        if set(int(p) for p in truth.get('formula_reviewed_pages', [])) != set(range(1, pages+1)):
            gaps.append('formula coverage not independently reviewed on all pages')
    except (TypeError, ValueError):
        gaps.append('invalid formula_reviewed_pages')
    if not truth.get('original_page_evidence'):
        gaps.append('no reference to independent original-page evidence')
    return not gaps, gaps


def check_capture_record(path: Path, expected_sha: str, pages: int):
    if not path.exists():
        return None, ['actual browser capture missing']
    try:
        data = json.loads(path.read_text(encoding='utf8'))
    except (ValueError, OSError) as error:
        return None, [f'browser capture not readable: {error}']
    gaps = []
    if data.get('schema') != SCHEMA:
        gaps.append('browser capture schema mismatch')
    if data.get('pdf_sha256') != expected_sha:
        gaps.append('browser capture PDF SHA-256 mismatch')
    if data.get('pages') != pages:
        gaps.append('browser capture page count mismatch')
    if data.get('capture_source') != 'mathreader_actual_browser_pdfjs':
        gaps.append('not an actual browser/PDF.js capture')
    if data.get('engine', {}).get('pdfjs') != '4.10.38':
        gaps.append('expected pinned PDF.js 4.10.38 engine not confirmed')
    if data.get('errors'):
        gaps.append('browser capture has processing errors')
    if any(data.get('stages', {}).get(k) != 'COMPLETE' for k in CATEGORIES):
        gaps.append('browser mathematical index stages incomplete')
    return data, gaps


def evaluate_document(entry: dict, capture_dir: Path):
    file = Path(entry['path']).expanduser().resolve()
    docid = entry.get('id', file.name)
    output = dict(id=docid, filename=file.name, classification='UNVERIFIED',
                  issues=[], unverified=[], checks={})
    if not file.is_file() or file.suffix.lower() != '.pdf':
        output['unverified'].append('PDF source missing or not a PDF'); return output
    actual_sha = sha256(file)
    output['sha256'] = actual_sha
    if entry.get('sha256') != actual_sha or not HEX64.fullmatch(actual_sha):
        output['unverified'].append('PDF identity mismatch; never compare stale golden'); return output
    pages = entry.get('pages')
    if not isinstance(pages, int) or pages < 1:
        output['unverified'].append('reviewed source page count missing'); return output
    try:
        import fitz
        with fitz.open(file) as original:
            if len(original) != pages:
                output['unverified'].append(f'ground truth pages {pages} differ from original PDF pages {len(original)}')
                return output
    except Exception as error:
        output['unverified'].append(f'original PDF page count cannot be verified: {error}')
        return output
    truth_record = entry.get('ground_truth') if isinstance(entry.get('ground_truth'), dict) else {}
    exception = truth_record.get('exception') if isinstance(truth_record.get('exception'), dict) else None
    if exception:
        try:
            illegible_pages = set(int(n) for n in exception.get('human_illegible_pages', []))
        except (TypeError, ValueError):
            illegible_pages = set()
        if (illegible_pages == set(range(1, pages+1)) and norm(exception.get('reason'))
            and norm(exception.get('reviewer')) and norm(exception.get('original_page_evidence'))
            and re.match(r'^\d{4}-\d\d-\d\d',str(exception.get('reviewed_at','')))):
            output['classification'] = 'EXCEPTION'
            output['unverified'].append('entire source independently reviewed and judged human-illegible; not a PASS')
            return output
        output['unverified'].append('partial/unsupported human-illegibility exception cannot be a whole-document PASS')
        return output
    complete, review_gaps = is_complete_review(entry.get('ground_truth'), pages)
    output['unverified'].extend(review_gaps)
    truth = entry.get('ground_truth') if isinstance(entry.get('ground_truth'), dict) else {}
    capture_file = capture_dir / f'{actual_sha}.json'
    cap, cap_gaps = check_capture_record(capture_file, actual_sha, pages)
    output['unverified'].extend(cap_gaps)
    if cap and cap.get('capture_source') == 'mathreader_actual_browser_pdfjs' and cap.get('errors'):
        output['issues'].extend(f'actual browser error: {norm(error)}' for error in cap['errors'])
    if cap and not cap_gaps and complete:
        for kind in CATEGORIES:
            errors = compare_items(truth['indexes'][kind], cap.get('indexes', {}).get(kind), kind)
            output['checks'][kind] = 'FAIL' if errors else 'PASS'
            output['issues'].extend(errors)
        # Each curated OCR crop must have actual Texify provenance, a completed
        # real MathJax compile result, a matching source crop and exact content.
        # An empty formula inventory can PASS only if every page was reviewed.
        actual_formulas = cap.get('formula_cases', [])
        if not isinstance(actual_formulas, list):
            output['unverified'].append('browser formula cases malformed')
            actual_formulas = []
        by_id = {f.get('id'): f for f in actual_formulas if isinstance(f, dict)}
        if len(by_id) != len(actual_formulas):
            output['issues'].append('duplicate or malformed actual-browser formula cases')
        expected_formula_ids = {f.get('id') for f in truth['formulas']}
        for extra in by_id.keys() - expected_formula_ids:
            output['issues'].append(f'unexpected browser formula crop {extra}')
        for formula in truth['formulas']:
            case = by_id.get(formula.get('id'))
            if not case:
                output['unverified'].append(f'formula {formula.get("id")}: actual OCR not run')
                continue
            if (case.get('origin') != 'actual_texify_browser'
                or case.get('crop_sha256') != formula.get('crop_sha256')
                or case.get('page') != formula.get('page')):
                output['unverified'].append(f'formula {formula.get("id")}: source/engine provenance not confirmed')
                continue
            if case.get('compiled') is not True:
                output['issues'].append(f'formula {formula.get("id")}: MathJax compilation failed')
            elif latex_norm(case.get('latex')) != latex_norm(formula.get('latex')):
                output['issues'].append(f'formula {formula.get("id")}: OCR differs from approved literal LaTeX')
        # A genuinely formula-free document needs no Texify inference. Its
        # absence can only be accepted when an independent reviewer checked
        # every source page and explicitly supplied an empty inventory.
        if truth['formulas'] and cap.get('stages', {}).get('formulas') != 'COMPLETE':
            output['unverified'].append('formula OCR/coverage stage not complete')
        if cap.get('navigation', {}).get('status') == 'FAIL':
            output['issues'].append('actual browser page navigation failed')
        elif cap.get('navigation', {}).get('status') != 'PASS':
            output['unverified'].append('page navigation not verified in browser')
        # Performance thresholds are optional and MUST be explicitly set for
        # the tested hardware/profile; no universal time budget is invented.
        metrics = cap.get('metrics', {})
        thresholds = entry.get('performance_thresholds', {})
        for metric, bound in [('open_ms','max_open_ms'),('index_ms','max_index_ms'),('js_heap_bytes','max_js_heap_bytes')]:
            if bound not in thresholds:
                continue
            measured = metrics.get(metric)
            if not isinstance(measured, (int,float)):
                output['unverified'].append(f'performance metric {metric} not measured')
            elif measured > thresholds[bound]:
                output['issues'].append(f'performance regression: {metric}={measured} exceeds {thresholds[bound]}')
        if cap.get('persistence', {}).get('status') == 'FAIL':
            output['issues'].append('actual browser reopen/position restoration failed')
        elif cap.get('persistence', {}).get('status') != 'PASS':
            output['unverified'].append('reopening and position restoration not verified in browser')
    # Known documented failures cannot disappear merely because a new capture
    # or reference inventory is absent.
    known = truth.get('known_open_defects', [])
    if known:
        output['issues'].extend(f'open defect: {norm(x)}' for x in known)
    if output['issues']:
        output['classification'] = 'FAIL'
    elif not output['unverified'] and all(output['checks'].get(k) == 'PASS' for k in CATEGORIES):
        output['classification'] = 'PASS'
    return output


def run(manifest: Path, captures: Path) -> dict:
    data = json.loads(manifest.read_text(encoding='utf8'))
    if data.get('schema') != SCHEMA or not isinstance(data.get('documents'), list):
        raise ValueError('P0 manifest must have schema 1 and a documents array')
    if not data['documents']:
        raise ValueError('P0 manifest has no documents')
    results = []
    seen = set()
    for record in data['documents']:
        if not isinstance(record, dict) or 'path' not in record:
            raise ValueError('Each document needs a source PDF path')
        item = dict(record)
        pdfpath = Path(item['path'])
        if not pdfpath.is_absolute(): item['path'] = str((manifest.parent / pdfpath).resolve())
        doc = evaluate_document(item, captures)
        if doc.get('sha256') in seen:
            raise ValueError('Duplicate PDF SHA-256 in P0 manifest')
        seen.add(doc.get('sha256'))
        results.append(doc)
    counts = dict(Counter(row['classification'] for row in results))
    return dict(schema=1, generated_at=datetime.now(timezone.utc).isoformat(),
                source_manifest=str(manifest), total=len(results), counts=counts, documents=results,
                acceptance='PASS' if counts.get('PASS', 0) == len(results) else 'INCOMPLETE',
                note='Only actual browser/PDF.js + complete human-reviewed truth may be fully verified.')


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--manifest', type=Path, required=True)
    ap.add_argument('--capture-dir', type=Path, required=True)
    ap.add_argument('--out-dir', type=Path, required=True)
    args = ap.parse_args(argv)
    audit = run(args.manifest.resolve(), args.capture_dir.resolve())
    args.out_dir.mkdir(parents=True, exist_ok=True)
    (args.out_dir/'p0_audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    lines=['# MathReader P0 acceptance', '', f"Documents: {audit['total']} · {audit['counts']}", '',
           '| Document | Classification | Evidence / gaps |', '|---|---|---|']
    for doc in audit['documents']:
        facts = (doc['issues'] + doc['unverified'])[:4]
        lines.append(f"| {doc['filename'].replace('|','/')} | {doc['classification']} | {'; '.join(facts).replace('|','/')} |")
    lines += ['', 'A source-level parser pass, cached proxy or compilable synthetic LaTeX is not full mathematical verification.', '']
    (args.out_dir/'p0_report.md').write_text('\n'.join(lines), encoding='utf8')
    print(json.dumps({'total':audit['total'], 'counts':audit['counts'], 'acceptance':audit['acceptance'],
                      'report':str(args.out_dir/'p0_report.md')}, indent=2))
    return 0 if audit['acceptance'] == 'PASS' else 2

if __name__ == '__main__':
    raise SystemExit(main())
