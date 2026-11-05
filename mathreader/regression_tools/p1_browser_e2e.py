#!/usr/bin/env python3
"""Two-ORIGINAL-PDF browser test of confirmed MathReader P1 links.

Only pinned genuine PDF.js, not a simulated PDF backend, can earn PASS.
A source paper with at least one detected numbered bibliography entry is required.
This test uses an isolated browser profile and temporary test-only observation hooks.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import sys
import tempfile
import time

from p0_browser import (
    PDFJS_VERSION, filehash, prepare_test_tree, serve, route_dependencies,
    sync_playwright,
)


class UnsuitableSourcePDF(RuntimeError):
    """Original PDF lacks the required numbered bibliography control."""


def classify_browser_failure(error: Exception, runtime_started: bool) -> str:
    """Classify only explicitly unsuitable source PDFs as UNVERIFIED.

    A runtime failure or first failed assertion after browser startup is FAIL.
    Environment failures before browser startup remain BLOCKED.
    """
    if isinstance(error, UnsuitableSourcePDF):
        return 'UNVERIFIED'
    if isinstance(error, (AssertionError, ValueError)):
        return 'FAIL'
    return 'FAIL' if runtime_started else 'BLOCKED'


def run(source_root: Path, source_pdf: Path, target_pdf: Path, pdfjs_build: Path | None,
        out_dir: Path, mathjax_js: Path | None = None, timeout_ms: int = 120000):
    out_dir.mkdir(parents=True, exist_ok=True)
    report = dict(schema=1, version='359', generated_at=datetime.now(timezone.utc).isoformat(),
                  scope='original PDFs / browser PDF.js / actual P1 DOM and IndexedDB',
                  status='BLOCKED', assertions=[], errors=[], limitations=[
                      'No actual Texify inference; this is P1 PDF/navigation/persistence acceptance only.',
                      'Does not establish human-reviewed whole-document mathematical accuracy.',
                  ])
    runtime_started = False
    def check(name, condition):
        if not condition: raise AssertionError(name)
        report['assertions'].append(name)
    def save():
        (out_dir/'p1_browser_e2e.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n', encoding='utf8')
    try:
        for pdf in (source_pdf, target_pdf):
            if not pdf.is_file() or pdf.suffix.lower() != '.pdf':
                raise ValueError(f'Original PDF unavailable: {pdf}')
        source_hash, target_hash=filehash(source_pdf),filehash(target_pdf)
        if source_hash==target_hash: raise ValueError('P1 browser test requires two distinct original PDFs')
        report['pdfs']=[{'name':source_pdf.name,'sha256':source_hash},
                        {'name':target_pdf.name,'sha256':target_hash}]
        if (not pdfjs_build or not (pdfjs_build/'pdf.min.mjs').is_file()
            or not (pdfjs_build/'pdf.worker.min.mjs').is_file()):
            report['errors'].append('BLOCKED: pinned genuine pdfjs-dist@4.10.38 PDF.js and worker assets are missing')
            return report
        if sync_playwright is None:
            report['errors'].append('BLOCKED: Python Playwright/Chromium unavailable')
            return report
        with tempfile.TemporaryDirectory(prefix='mathreader-p1-real-') as temp:
            root=Path(temp)
            site=prepare_test_tree(source_root,root)
            # This is appended after the full original assembled runtime, only
            # in the disposable browser test tree.
            with (site/'js/70-command-ui-runtime.js').open('a',encoding='utf8') as output:
                output.write('\n'+(source_root/'regression_tools/p1_browser_probe.js').read_text())
            server=serve(root)
            try:
                with sync_playwright() as p:
                    browser=p.chromium.launch(headless=True,
                        executable_path=shutil.which('chromium') or shutil.which('chromium-browser'),
                        args=['--no-sandbox'])
                    try:
                        ctx=browser.new_context(viewport={'width':1240,'height':900},accept_downloads=False)
                        routes=route_dependencies(ctx,pdfjs_build,mathjax_js,False)
                        page=ctx.new_page()
                        page.set_default_timeout(timeout_ms)
                        page.goto(f'http://127.0.0.1:{server.server_port}/mathreader/index.html', wait_until='domcontentloaded')
                        page.wait_for_function('Boolean(window.__mathreaderP1E2E)',timeout=15000)
                        runtime_started = True
                        def state(): return page.evaluate('window.__mathreaderP1E2E.snapshot()')
                        def upload(pdf):
                            expected = 'sha256:' + filehash(pdf)
                            page.locator('#file-input').set_input_files(str(pdf))
                            # Do not mistake the previously open PDF for the
                            # newly selected one while the new bytes are read.
                            page.wait_for_function('(id)=>window.__mathreaderP1E2E?.snapshot().fileKey===id && window.__mathreaderP1E2E.snapshot().documentLoaded',arg=expected,timeout=timeout_ms)
                            # File input selection can finish rendering after pdfDoc is non-null.
                            page.wait_for_function('!document.getElementById("pdf-workspace").classList.contains("is-hidden")',timeout=timeout_ms)
                            page.wait_for_function('window.__mathreaderP1E2E.snapshot().cached',timeout=timeout_ms)
                        upload(target_pdf)
                        target=state()
                        check('exact pinned PDF.js is active in target',target['pdfjsVersion']==PDFJS_VERSION)
                        check('target stored locally',target['cached'] and target['fileKey'])
                        upload(source_pdf)
                        first=state()
                        check('source and target have different PDF identities',first['fileKey']!=target['fileKey'])
                        check('both originals appear in the local library',target['fileKey'] in first['localIds'] and first['fileKey'] in first['localIds'])
                        check('formula OCR stays unloaded while opening documents',not first['formulaLoading'])
                        # Force the production index builder, not a proxy parser.
                        page.evaluate('window.__mathreaderP0.finishIndexes()')
                        first=state()
                        if first['bibliographyCount']<1:
                            raise UnsuitableSourcePDF('Source PDF produced no numbered bibliography entry in real browser; select a source with a verified reference')
                        last_page=min(2,first['pages'])
                        page.evaluate('(n)=>window.__mathreaderP1E2E.goto(n,0.40)',last_page)
                        before=state()
                        check('source navigation anchor available',before['anchor'] is not None)
                        first_link=page.locator('#bibliography-index .bibliography-item').filter(has=page.locator('.bibliography-local-button')).first
                        first_link.locator('.bibliography-local-button').filter(has_text='Link PDF').click(force=True)
                        picker=first_link.locator('.bibliography-link-picker')
                        check('actual local PDF picker appeared',picker.count()==1)
                        picker.locator('select').select_option(target['fileKey'])
                        picker.locator('button').filter(has_text='Link').click(force=True)
                        page.wait_for_function('(id)=>window.__mathreaderP1E2E.snapshot().confirmedTargets.includes(id)',arg=target['fileKey'])
                        check('exact link saved in IndexedDB',target['fileKey'] in page.evaluate('window.__mathreaderP1E2E.persistedLinkIds()'))
                        first_link=page.locator('#bibliography-index .bibliography-item').first
                        first_link.locator('.bibliography-local-button').filter(has_text='Open PDF').click(force=True)
                        page.wait_for_function('(id)=>window.__mathreaderP1E2E.snapshot().fileKey===id',arg=target['fileKey'])
                        switched=state()
                        check('P1 opens real target PDF',switched['documentLoaded'] and switched['fileKey']==target['fileKey'] and switched['pages']==target['pages'])
                        check('temporary return button visible',switched['returnButtonVisible'] and switched['returnDepth']==1)
                        page.locator('#crossdoc-return').click(force=True)
                        page.wait_for_function('(id)=>window.__mathreaderP1E2E.snapshot().fileKey===id',arg=first['fileKey'])
                        returned=state()
                        check('return restores source document',returned['fileKey']==first['fileKey'] and returned['documentLoaded'])
                        check('return consumes temporary history',returned['returnDepth']==0 and not returned['returnButtonVisible'])
                        check('return restores source page and ratio',bool(returned['anchor']) and
                            returned['anchor']['page']==before['anchor']['page'] and
                            abs(returned['anchor']['ratio']-before['anchor']['ratio'])<=.04)
                        # A real page reload tests durable IndexedDB persistence.
                        page.reload(wait_until='domcontentloaded')
                        page.wait_for_function('Boolean(window.__mathreaderP1E2E)',timeout=timeout_ms)
                        if not state()['documentLoaded']:
                            upload(source_pdf)
                        page.evaluate('window.__mathreaderP0.finishIndexes()')
                        check('confirmed link survives browser reload',target['fileKey'] in page.evaluate('window.__mathreaderP1E2E.persistedLinkIds()'))
                        check('link remains visible after reopening',page.locator('#bibliography-index .bibliography-local-button').filter(has_text='Open PDF').count()>=1)
                        check('OCR still not eagerly initialized by P1',not state()['formulaLoading'])
                        report['dependency_routes']=routes
                        report['status']='PASS'
                    finally: browser.close()
            finally:server.shutdown();server.server_close()
    except Exception as error:
        report['status'] = classify_browser_failure(error, runtime_started)
        report['errors'].append(f'{type(error).__name__}: {error}')
    finally:save()
    return report


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parent.parent)
    ap.add_argument('--source-pdf',type=Path,required=True)
    ap.add_argument('--target-pdf',type=Path,required=True)
    ap.add_argument('--pdfjs-build',type=Path)
    ap.add_argument('--mathjax-js',type=Path)
    ap.add_argument('--out-dir',type=Path,required=True)
    ap.add_argument('--timeout-ms',type=int,default=120000)
    args=ap.parse_args()
    result=run(args.source_root.resolve(),args.source_pdf.resolve(),args.target_pdf.resolve(),
               args.pdfjs_build.resolve() if args.pdfjs_build else None,args.out_dir.resolve(),
               args.mathjax_js.resolve() if args.mathjax_js else None,args.timeout_ms)
    print(json.dumps({'status':result['status'],'checks':len(result['assertions']),
                      'errors':result['errors'],'report':str(args.out_dir/'p1_browser_e2e.json')},indent=2))
    return {'PASS':0,'BLOCKED':2,'UNVERIFIED':2,'FAIL':1}[result['status']]

if __name__=='__main__':sys.exit(main())
