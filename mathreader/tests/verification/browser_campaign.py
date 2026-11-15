#!/usr/bin/env python3
"""Fail-closed original-PDF MathReader Chromium campaign: real PDF.js, real index clicks, real Texify.

A PASS is only possible after production MathReader has opened an independently
reviewed original PDF, followed actual DOM link clicks, and (when requested)
performed actual browser image OCR. No stubbed PDF.js, saved-index shortcuts, or
mocked model outputs are permitted.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import sys
import tempfile
import time

KINDS = ('structure', 'results', 'equations', 'bibliography')
SELECTORS = {'structure': '#outline-list', 'results': '#structure-index',
             'equations': '#equation-index', 'bibliography': '#bibliography-index'}

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def safe(base, name):
    if not isinstance(name, str) or not name or Path(name).is_absolute():
        raise ValueError('relative evidence path required')
    p = (base / name).resolve()
    if not p.is_relative_to(base.resolve()):
        raise ValueError('evidence path escapes manifest directory')
    return p

def validate_manifest(path):
    try:
        manifest = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as e:
        raise ValueError(f'invalid campaign manifest: {e}') from e
    if not isinstance(manifest, dict) or manifest.get('schemaVersion') != 1:
        raise ValueError('schemaVersion 1 required')
    docs = manifest.get('documents')
    if not isinstance(docs, list) or not docs:
        raise ValueError('at least one original document required')
    out = []
    for idx, d in enumerate(docs):
        if not isinstance(d, dict): raise ValueError(f'document {idx} not object')
        p = safe(path.parent, d.get('pdf'))
        if p.suffix.lower() != '.pdf' or not p.is_file():
            raise FileNotFoundError(f'original PDF missing: {p}')
        digest = d.get('sha256')
        if not isinstance(digest, str) or len(digest) != 64 or any(x not in '0123456789abcdef' for x in digest.lower()) or sha(p) != digest.lower():
            raise ValueError(f'original PDF checksum mismatch: {p.name}')
        nav = d.get('navigation')
        if not isinstance(nav, list) or not nav: raise ValueError('nonempty reviewed navigation required')
        for n in nav:
            if not isinstance(n, dict) or n.get('kind') not in KINDS:
                raise ValueError('invalid navigation kind')
            if not isinstance(n.get('label'), str) or not n['label'].strip():
                raise ValueError('reviewed navigation label required')
            page, ratio = n.get('page'), n.get('ratio')
            tol = n.get('toleranceRatio', .06)
            if type(page) is not int or page <= 0 or not isinstance(ratio, (int, float)) or isinstance(ratio, bool) or not math.isfinite(ratio) or not 0 <= ratio <= 1:
                raise ValueError('invalid reviewed page/ratio')
            if not isinstance(tol, (int, float)) or isinstance(tol, bool) or not math.isfinite(tol) or not 0 <= tol <= .2:
                raise ValueError('invalid reviewed tolerance')
            if 'selector' in n: raise ValueError('arbitrary selectors are forbidden; select by reviewed label within kind')
        ocr = d.get('ocr', [])
        if not isinstance(ocr, list): raise ValueError('ocr must be a list')
        for entry in ocr:
            if not isinstance(entry, dict) or not isinstance(entry.get('latex'), str) or not entry['latex'].strip() or not isinstance(entry.get('rectPdfPt'), list) or len(entry['rectPdfPt']) != 4 or not all(type(x) in (float, int) and math.isfinite(x) for x in entry['rectPdfPt']):
                raise ValueError('OCR case requires reviewed LaTeX and four PDF coordinates')
            if type(entry.get('page')) is not int or entry['page'] <= 0: raise ValueError('OCR page invalid')
            if entry['rectPdfPt'][2] <= entry['rectPdfPt'][0] or entry['rectPdfPt'][3] <= entry['rectPdfPt'][1]:
                raise ValueError('OCR crop geometry invalid')
        out.append((p, nav, ocr))
    return out

def normalized_latex(s):
    return ''.join(s.split())

def edit_distance(a, b):
    # Bound time and memory for adversarial or truncated model output.
    if max(len(a), len(b)) > 10000: raise ValueError('OCR output exceeds 10k characters')
    if len(a) < len(b): a, b = b, a
    previous = list(range(len(b) + 1))
    for i, char in enumerate(a, 1):
        curr = [i] + [0] * len(b)
        for j, other in enumerate(b, 1):
            curr[j] = min(curr[j-1] + 1, previous[j] + 1, previous[j-1] + (char != other))
        previous = curr
    return previous[-1]

def verify(manifest_path, root, pdfjs_build=None, mathjax_js=None, timeout_ms=90000, require_ocr=False):
    report = {'schemaVersion': 1, 'evidence': 'actual-mathreader-original-pdf-browser',
              'status': 'INCOMPLETE', 'navigationCertified': False, 'ocrCertified': False,
              'cases': [], 'counts': {'PASS': 0, 'FAIL': 0, 'INCOMPLETE': 0}}
    def add(name, status, reason='', **extra):
        report['cases'].append(dict(name=name, status=status, reason=reason, **extra))
    try:
        documents = validate_manifest(Path(manifest_path).resolve())
    except FileNotFoundError as e:
        add('manifest', 'INCOMPLETE', str(e))
        return _finish(report)
    except (OSError, ValueError) as e:
        add('manifest', 'FAIL', str(e))
        return _finish(report)
    if require_ocr and not any(c for _, _, cases in documents for c in cases):
        add('real-texify-inference', 'INCOMPLETE', 'No independently reviewed OCR cases')
    if not pdfjs_build or any(not (Path(pdfjs_build) / name).is_file() for name in ('pdf.min.mjs', 'pdf.worker.min.mjs')):
        add('pinned-pdfjs', 'INCOMPLETE', 'Genuine pinned pdfjs-dist@4.10.38 build required')
        return _finish(report)
    root = Path(root).resolve()
    if not (root / 'mathreader.js').is_file():
        add('production-source', 'INCOMPLETE', 'MathReader runtime missing')
        return _finish(report)
    sys.path.insert(0, str(root / 'regression_tools'))
    try:
        from p0_browser import prepare_test_tree, route_dependencies, serve, sync_playwright, PDFJS_VERSION
        if sync_playwright is None: raise ImportError('Playwright unavailable')
        with tempfile.TemporaryDirectory(prefix='mathreader-verify-real-') as dirname:
            base = Path(dirname)
            site = prepare_test_tree(root, base)
            # Browser observation only; never shipped into production source.
            probe = root / 'regression_tools/p1_browser_probe.js'
            with (site / 'js/70-command-ui-runtime.js').open('a', encoding='utf8') as stream:
                stream.write('\n' + probe.read_text(encoding='utf8'))
            server = serve(base)
            try:
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True,
                        executable_path=shutil.which('chromium') or shutil.which('chromium-browser') or None,
                        args=['--no-sandbox'])
                    try:
                        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
                        trace = route_dependencies(ctx, Path(pdfjs_build), Path(mathjax_js) if mathjax_js else None, bool(require_ocr))
                        page = ctx.new_page()
                        page.set_default_timeout(timeout_ms)
                        page.goto(f'http://127.0.0.1:{server.server_port}/mathreader/index.html', wait_until='domcontentloaded')
                        page.wait_for_function('Boolean(window.__mathreaderP0 && window.__mathreaderP1E2E)', timeout=15000)
                        for pdf, navigation, ocr in documents:
                            prefix = pdf.name + ':'
                            page.locator('#file-input').set_input_files(str(pdf))
                            expected = 'sha256:' + sha(pdf)
                            page.wait_for_function('(id)=>window.__mathreaderP0.snapshot().fileKey===id && window.__mathreaderP0.snapshot().documentLoaded', arg=expected, timeout=timeout_ms)
                            state = page.evaluate('window.__mathreaderP0.snapshot()')
                            if state['pdfjsVersion'] != PDFJS_VERSION:
                                add(prefix+'pdfjs-version', 'FAIL', 'Wrong PDF.js backend')
                                continue
                            try:
                                state = page.evaluate('window.__mathreaderP0.finishIndexes()')
                                if not all(v == 'COMPLETE' for v in state['stages'].values()):
                                    add(prefix+'index-build', 'INCOMPLETE', 'One or more production detector stages unfinished', stages=state['stages'])
                            except Exception as e:
                                add(prefix+'index-build', 'FAIL', str(e)[:600])
                                continue
                            for n in navigation:
                                kind = n['kind']
                                label = ' '.join(n['label'].split())
                                # Require an unambiguous matching production DOM row.
                                container = page.locator(SELECTORS[kind])
                                targets = container.locator('button, a').filter(has_text=label)
                                count = targets.count()
                                if count != 1:
                                    add(prefix + kind + ':' + label, 'FAIL', f'Expected one clickable production index entry; found {count}')
                                    continue
                                try:
                                    began = time.monotonic()
                                    targets.first.click(force=True, timeout=timeout_ms)
                                    page.wait_for_function('({p,r,t})=>{const a=window.__mathreaderP1E2E.snapshot().anchor;return a&&a.page===p&&Math.abs(a.ratio-r)<=t}',
                                        arg={'p':n['page'], 'r':n['ratio'], 't':n.get('toleranceRatio', .06)}, timeout=timeout_ms)
                                    anchor = page.evaluate('window.__mathreaderP1E2E.snapshot().anchor')
                                    add(prefix + kind + ':' + label, 'PASS', 'Clicked real index link and verified displayed PDF anchor', anchor=anchor, seconds=round(time.monotonic()-began, 3))
                                except Exception as e:
                                    add(prefix + kind + ':' + label, 'FAIL', str(e)[:600])
                            for index, item in enumerate(ocr):
                                name = prefix + 'ocr:' + str(index)
                                if not require_ocr:
                                    add(name, 'INCOMPLETE', 'Actual OCR not requested; no model execution')
                                    continue
                                try:
                                    began = time.monotonic()
                                    observed = page.evaluate('window.__mathreaderP0.imageFormulaCase', {
                                        'id': name, 'page': item['page'], 'rectPdfPt': item['rectPdfPt'], 'scale': item.get('scale', 2)})
                                    if observed.get('origin') != 'actual_texify_browser' or not observed.get('backend'):
                                        add(name, 'INCOMPLETE', 'Texify model did not produce an attested browser result', origin=observed.get('origin'))
                                        continue
                                    actual, expected_tex = normalized_latex(observed.get('latex','')), normalized_latex(item['latex'])
                                    if not actual: raise ValueError('Empty genuine Texify result')
                                    distance = edit_distance(actual, expected_tex)
                                    normalized_error = distance / max(1, len(expected_tex))
                                    limit = item.get('maxNormalizedError', 0.0)
                                    if type(limit) not in (float, int) or not math.isfinite(limit) or not 0 <= limit <= 1: raise ValueError('Invalid reviewed error budget')
                                    ok = normalized_error <= limit and observed.get('compiled') is True
                                    add(name, 'PASS' if ok else 'FAIL', 'Real browser inference compared to reviewed LaTeX',
                                        backend=observed['backend'], normalizedError=normalized_error,
                                        exactMatch=distance==0, compiled=observed.get('compiled'), seconds=round(time.monotonic()-began, 3), cropSha256=observed.get('crop_sha256'))
                                except Exception as e:
                                    add(name, 'FAIL', str(e)[:600])
                        report['dependencyTrace'] = trace[:50]
                    finally:
                        browser.close()
            finally:
                server.shutdown(); server.server_close()
    except (ImportError, OSError) as e:
        add('browser-environment', 'INCOMPLETE', str(e)[:600])
    except Exception as e:
        add('browser-runtime', 'FAIL', f'{type(e).__name__}: {e}'[:600])
    report = _finish(report)
    navigation_cases = [r for r in report['cases'] if ':ocr:' not in r['name']]
    ocr_cases = [r for r in report['cases'] if ':ocr:' in r['name']]
    report['navigationCertified'] = bool(navigation_cases) and all(c['status']=='PASS' for c in navigation_cases)
    report['ocrCertified'] = require_ocr and bool(ocr_cases) and all(c['status']=='PASS' for c in ocr_cases)
    return report

def _finish(report):
    report['counts'] = {s: sum(c['status'] == s for c in report['cases']) for s in ('PASS','FAIL','INCOMPLETE')}
    report['status'] = 'FAIL' if report['counts']['FAIL'] else 'INCOMPLETE' if report['counts']['INCOMPLETE'] else 'PASS'
    return report

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('manifest', type=Path)
    ap.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    ap.add_argument('--pdfjs-build', type=Path)
    ap.add_argument('--mathjax-js', type=Path)
    ap.add_argument('--real-ocr', action='store_true')
    ap.add_argument('--output', type=Path)
    args=ap.parse_args()
    r=verify(args.manifest,args.root,args.pdfjs_build,args.mathjax_js,require_ocr=args.real_ocr)
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(r,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'status':r['status'],'counts':r['counts'],'navigationCertified':r['navigationCertified'],'ocrCertified':r['ocrCertified']}))
    return {'PASS':0,'FAIL':1,'INCOMPLETE':2}[r['status']]
if __name__=='__main__': sys.exit(main())
