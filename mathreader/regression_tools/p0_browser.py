#!/usr/bin/env python3
"""P0 Chromium acceptance runner for the genuine MathReader UI and PDF.js.

Requires local pinned PDF.js assets for PDF acceptance. If unavailable,
record an explicit BLOCKED/UNVERIFIED stage; NEVER replace PDF.js/Texify with
PyMuPDF/Tesseract and claim real browser acceptance.
"""
from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
import functools
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import re
from pathlib import Path
import shutil
import tempfile
from threading import Thread
import time
from urllib.parse import urlparse

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None

PDFJS_VERSION = '4.10.38'
EXTERNAL_PDFJS = f'https://cdn.jsdelivr.net/npm/pdfjs-dist@{PDFJS_VERSION}/build/'
MATHJAX_URL = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'


def filehash(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(1048576),b''): h.update(b)
    return h.hexdigest()


def prepare_test_tree(source: Path, temp_root: Path):
    dest = temp_root / 'mathreader'
    # The test probe is not shipped as a production runtime file. It is injected
    # into an isolated test-only copy of the last source part.
    shutil.copytree(source, dest, ignore=shutil.ignore_patterns('__pycache__','.mathreader-regression-cache','*.pyc'))
    probe = source/'regression_tools/p0_browser_probe.js'
    path = dest/'js/70-command-ui-runtime.js'
    with path.open('a',encoding='utf8') as f:
        f.write('\n// P0 TEMPORARY TEST-ONLY HOOK: NEVER DEPLOY\n')
        f.write(probe.read_text(encoding='utf8'))
    return dest


def serve(folder: Path):
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, fmt, *args):
            return
        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            super().end_headers()
    factory = functools.partial(Quiet, directory=str(folder))
    httpd = ThreadingHTTPServer(('127.0.0.1',0),factory)
    thread=Thread(target=httpd.serve_forever,daemon=True)
    thread.start()
    return httpd


def route_dependencies(context, pdf_build: Path | None, mathjax_js: Path | None, allow_texify_network: bool):
    trace=[]
    def handler(route):
        url=route.request.url
        if url.startswith(EXTERNAL_PDFJS):
            name=urlparse(url).path.rsplit('/',1)[-1]
            if name not in ('pdf.min.mjs','pdf.worker.min.mjs') or not pdf_build or not (pdf_build/name).is_file():
                trace.append({'url':url,'status':'BLOCKED_MISSING_PINNED_PDFJS'})
                return route.abort()
            trace.append({'url':url,'status':'LOCAL_PINNED_PDFJS'})
            return route.fulfill(path=str(pdf_build/name),content_type='text/javascript',headers={'Access-Control-Allow-Origin':'*'})
        if url.startswith(MATHJAX_URL):
            if not mathjax_js or not mathjax_js.is_file():
                trace.append({'url':url,'status':'BLOCKED_NO_LOCAL_MATHJAX'})
                return route.abort()
            trace.append({'url':url,'status':'LOCAL_MATHJAX'})
            return route.fulfill(path=str(mathjax_js),content_type='text/javascript',headers={'Access-Control-Allow-Origin':'*'})
        # MathReader has no reason to contact the network during a shell or
        # ordinary PDF indexing test. Texify's *real* model/runtime network can
        # be explicitly opted in for a formula recognition campaign.
        if allow_texify_network and ('huggingface.co' in url or 'cdn.jsdelivr.net' in url or 'hf.co' in url):
            trace.append({'url':url,'status':'NETWORK_TEXIFY_EXPLICIT'})
            return route.continue_()
        trace.append({'url':url,'status':'BLOCKED_NONLOCAL_DEPENDENCY'})
        return route.abort()
    context.route('https://**/*',handler)
    return trace


def inline_shell_browser(page, source: Path, mathjax_js: Path | None):
    """Isolated DOM-only browser mode: full real lexical UI, no PDF.js/browser I/O.

    Runs without localhost/remote network access. Must never count as a
    PDF-loading, IndexedDB persistence, PDF.js, or Texify acceptance check.
    """
    html=(source/'index.html').read_text(encoding='utf8')
    html=re.sub(r'<script defer src="https://cdn\.jsdelivr\.net/npm/mathjax@3/es5/tex-chtml\.js"></script>', '', html)
    html=re.sub(r'<script type="module" src="mathreader\.js\?v=\d+"></script>', '', html)
    html=re.sub(r'<link rel="stylesheet" href="mathreader\.css\?v=\d+">', '', html)
    page.set_content(html)
    page.add_style_tag(content=(source/'mathreader.css').read_text(encoding='utf8'))
    if mathjax_js and mathjax_js.is_file():
        page.add_script_tag(content=mathjax_js.read_text(encoding='utf8'))
    bootstrap=(source/'mathreader.js').read_text(encoding='utf8')
    parts=re.findall(r"'((?:js/)[^']+\.js)'",bootstrap)
    if len(parts)!=10: raise ValueError('Expected exact ten-part source manifest')
    assembled='\n'.join((source/part).read_text(encoding='utf8') for part in parts)
    assembled+='\n'+(source/'regression_tools/p0_browser_probe.js').read_text(encoding='utf8')
    page.evaluate("""async (src) => {
        const url = URL.createObjectURL(new Blob([src], {type:'text/javascript'}));
        try { await import(url); }
        finally { URL.revokeObjectURL(url); }
    }""", assembled)


def shell_checks(page):
    page.wait_for_function('Boolean(window.__mathreaderP0)',timeout=15000)
    before=page.evaluate('window.__mathreaderP0.snapshot()')
    outcomes={}
    outcomes['startup_without_pdf'] = 'PASS' if not before['documentLoaded'] else 'FAIL'
    outcomes['no_eager_texify'] = 'PASS' if not before['model']['initialized'] and not before['model']['loading'] and not before['model']['modal'] else 'FAIL'
    page.locator('#language-button').click()
    outcomes['language_control'] = 'PASS' if page.locator('html').get_attribute('data-lang') == 'zh' else 'FAIL'
    page.locator('#theme-button').click()
    outcomes['theme_control'] = 'PASS' if page.locator('html').get_attribute('data-theme') == 'dark' else 'FAIL'
    data=page.evaluate('window.__mathreaderP0.testInitializationFailure()')
    outcomes['modal_appears_during_failed_init'] = 'PASS' if data['during']['modal'] and data['during']['loading'] and data['during']['underlyingOpenInert'] and data['during']['overlayVisible'] and data['during']['focusedOverlay'] else 'FAIL'
    outcomes['failure_releases_reader'] = 'PASS' if (data['outcome']=='EXPECTED_FAILURE' and not data['after']['modal'] and not data['after']['loading'] and data['after']['failed'] and data['noPermanentInteractionLock']) else 'FAIL'
    page.locator('#theme-button').click()
    outcomes['control_works_after_failure'] = 'PASS' if page.locator('html').get_attribute('data-theme') == 'light' else 'FAIL'
    return dict(outcomes=outcomes, status='PASS' if all(v=='PASS' for v in outcomes.values()) else 'FAIL',
                failure_probe=data)


def maybe_read_manifest(manifest: Path | None, paths: list[str]):
    items=[]
    if manifest:
        data=json.loads(manifest.read_text(encoding='utf8'))
        if not isinstance(data.get('documents'),list):
            raise ValueError('Manifest must have documents array')
        for item in data['documents']:
            path=Path(item['path'])
            if not path.is_absolute(): path=manifest.parent/path
            items.append((path.resolve(),item.get('sha256')))
    else:
        items=[(Path(x).resolve(),None) for x in paths]
    seen=set()
    result=[]
    for path,expected in items:
        if not path.is_file() or path.suffix.lower()!='.pdf': raise FileNotFoundError(path)
        sha=filehash(path)
        if expected and expected!=sha: raise ValueError(f'PDF SHA mismatch: {path}')
        if sha in seen: raise ValueError(f'Duplicate original PDF bytes: {path}')
        seen.add(sha)
        result.append((path,sha))
    return result


def dependency_preflight(pdfs: list, pdfbuild: Path | None,
                         formula_cases: list, allow_texify_network: bool):
    # A missing Texify model must not prevent independent PDF.js indexing.
    pdf_blockers = []
    if pdfs and (not pdfbuild or not (pdfbuild/'pdf.min.mjs').is_file()
                 or not (pdfbuild/'pdf.worker.min.mjs').is_file()):
        pdf_blockers.append('Pinned pdfjs-dist@4.10.38 browser and worker assets unavailable')
    formula_limitations = []
    if formula_cases and not allow_texify_network:
        formula_limitations.append(
            'Actual Texify not enabled; original-PDF formula crops may be captured '
            'but no formula OCR recognition/accuracy is verified.')
    return pdf_blockers, formula_limitations


def classify_document_capture(record: dict, formula_cases_requested: bool = False) -> str:
    """Classify browser *execution*, not independent mathematical accuracy.

    In particular an actual formula OCR failure must never be silently
    excluded from an otherwise COMPLETE document capture.
    """
    if record.get('capture_source') != 'mathreader_actual_browser_pdfjs':
        return 'UNVERIFIED'
    if record.get('errors') or any(record.get(stage, {}).get('status') == 'FAIL'
                                   for stage in ('navigation', 'persistence')):
        return 'FAIL'
    stages = record.get('stages')
    if not isinstance(stages, dict) or any(stages.get(k) != 'COMPLETE'
        for k in ('structure', 'results', 'equations', 'bibliography')):
        return 'UNVERIFIED'
    if formula_cases_requested:
        cases = record.get('formula_cases')
        if isinstance(cases, list) and any(
            case.get('origin') == 'actual_texify_browser' and case.get('compiled') is False
            for case in cases if isinstance(case, dict)):
            return 'FAIL'
        if stages.get('formulas') != 'COMPLETE':
            return 'UNVERIFIED'
    if any(record.get(stage, {}).get('status') != 'PASS'
           for stage in ('navigation', 'persistence')):
        return 'UNVERIFIED'
    return 'COMPLETE'


def full_document(page, source_path: Path, sha: str, timeout_ms: int,
                  formula_cases: list, crop_dir: Path, run_formula_ocr: bool = True):
    errors=[]
    loaded=False
    started=time.perf_counter()
    page.locator('#file-input').set_input_files(str(source_path))
    try:
        page.wait_for_function('window.__mathreaderP0?.snapshot().documentLoaded === true',timeout=timeout_ms)
        loaded=True
    except Exception as error:
        errors.append(f'PDF open never completed: {str(error)[:250]}')
    if not loaded:
        return dict(schema=1,capture_source='blocked_pdf_runtime',pdf_sha256=sha,pages=None,
                    stages={},engine={},indexes={},formula_cases=[],errors=errors,
                    navigation={'status':'UNVERIFIED'},persistence={'status':'UNVERIFIED'})
    open_elapsed_ms=round((time.perf_counter()-started)*1000)
    first=page.evaluate('window.__mathreaderP0.snapshot()')
    result=dict(schema=1,capture_source='mathreader_actual_browser_pdfjs',pdf_sha256=sha,pages=first['pages'],
                engine={'pdfjs':first['pdfjsVersion']},stages={},indexes={},formula_cases=[],errors=[],limitations=[],
                navigation={'status':'UNVERIFIED'},persistence={'status':'UNVERIFIED'})
    result['metrics']={'open_ms':open_elapsed_ms,'index_ms':None,'js_heap_bytes':None}
    if first['pdfjsVersion']!=PDFJS_VERSION:
        result['errors'].append(f'Pinned PDF.js {PDFJS_VERSION} not loaded ({first["pdfjsVersion"]})')
    if first['model']['initialized'] or first['model']['loading'] or first['model']['modal']:
        result['errors'].append('Texify initialized before first formula extraction')
    try:
        mode_state=page.evaluate('window.__mathreaderP0.chooseFormulaMode()')
        if mode_state['initialized'] or mode_state['loading'] or mode_state['modal']:
            result['errors'].append('Selecting a formula mode eagerly initialized Texify')
    except Exception as error:
        result['errors'].append(f'Formula selection mode failed: {str(error)[:220]}')
    try:
        # PDF.js has completed first render; actual MathReader final indexers
        # are requested and awaited, not replaced with a native-text proxy.
        index_started=time.perf_counter()
        snap=page.evaluate('window.__mathreaderP0.finishIndexes()')
        result['metrics']['index_ms']=round((time.perf_counter()-index_started)*1000)
        result['metrics']['js_heap_bytes']=page.evaluate('performance.memory?.usedJSHeapSize || null')
        result['indexes']=snap['indexes'];result['stages']=snap['stages']
    except Exception as error:
        message = str(error)
        if 'P0_REQUIRES_DOCUMENT_OCR' in message:
            # The PDF opened, but image-only pages need an explicit actual
            # document-OCR workflow before indexes can be verified. Absence of
            # that separate stage is UNVERIFIED, not a false application FAIL.
            result['limitations'].append('Image-only PDF: document OCR was not executed; final indexes UNVERIFIED')
        else:
            result['errors'].append(f'Final index build error/timeout: {message[:240]}')
    try:
        if first['pages']>=2:
            reached=page.evaluate('window.__mathreaderP0.navigate(2)')
            returned=page.evaluate('window.__mathreaderP0.navigate(1)')
            result['navigation']={'status':'PASS' if reached==2 and returned==1 else 'FAIL',
                                  'forward':reached,'back':returned}
        else: result['navigation']={'status':'PASS','reason':'single page PDF'}
    except Exception as error:
        result['navigation']={'status':'FAIL','error':str(error)[:250]}
    for case in formula_cases:
        if not case.get('page') or not isinstance(case['page'],int) or case['page']>first['pages']:
            result['errors'].append(f'Formula case page out of bounds: {case["id"]}')
            continue
        try:
            rec=page.evaluate('arg => window.__mathreaderP0.imageFormulaCase(arg)',
                              dict(id=case['id'],page=case['page'],
                                   rectPdfPt=case['rect_pdf_pt'],scale=case.get('scale',2),
                                   cropOnly=not run_formula_ocr))
            png_data_url=rec.pop('crop_png_data_url',None)
            if png_data_url:
                crop_bytes=base64.b64decode(png_data_url.split(',',1)[1],validate=True)
                local_sha=hashlib.sha256(crop_bytes).hexdigest()
                if local_sha != rec.get('crop_sha256'):
                    rec['origin']='unavailable';rec['compiled']=False
                    rec['error']='Browser and Python PDF-crop SHA-256 calculations disagree'
                else:
                    crop_dir.mkdir(parents=True,exist_ok=True)
                    relative=f'{sha[:12]}-{local_sha[:16]}.png'
                    (crop_dir/relative).write_bytes(crop_bytes)
                    rec['crop_evidence_filename']=relative
            else:
                rec['origin']='unavailable';rec['compiled']=False
                rec['error']='Missing actual rendered source crop evidence'
            if case.get('expected_crop_sha256') and rec.get('crop_sha256') != case['expected_crop_sha256']:
                rec['origin']='unavailable';rec['compiled']=False
                rec['error']='Original PDF formula crop changed since independent review'
            result['formula_cases'].append(rec)
        except Exception as error:
            result['formula_cases'].append(dict(id=case['id'],page=case['page'],origin='unavailable',
                                                compiled=False,error=str(error)[:240]))
    result['stages']['formulas']='COMPLETE' if formula_cases and all(c.get('origin')=='actual_texify_browser' and c.get('compiled') for c in result['formula_cases']) else 'UNVERIFIED'
    # Persistence requires a true browser reload and exact reopening; never
    # mark it PASS from merely calling persistDocumentState() in one runtime.
    try:
        if first['pages']>=2:
            page.evaluate('window.__mathreaderP0.navigate(2)')
            page.reload(wait_until='domcontentloaded',timeout=timeout_ms)
            page.wait_for_function('Boolean(window.__mathreaderP0)',timeout=timeout_ms)
            # The local-library restore can happen asynchronously. If it does
            # not, reopen the identical original PDF explicitly.
            try:
                page.wait_for_function('window.__mathreaderP0.snapshot().documentLoaded',timeout=5000)
            except Exception:
                page.locator('#file-input').set_input_files(str(source_path))
                page.wait_for_function('window.__mathreaderP0.snapshot().documentLoaded',timeout=timeout_ms)
            restored=page.evaluate('window.__mathreaderP0.snapshot().currentPage')
            result['persistence']={'status':'PASS' if restored==2 else 'FAIL','restored_page':restored,'expected':2}
        else:
            result['persistence']={'status':'UNVERIFIED','reason':'requires a multi-page document'}
    except Exception as error:
        result['persistence']={'status':'FAIL','error':str(error)[:240]}
    result['elapsed_ms']=round((time.perf_counter()-started)*1000)
    return result


def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parent.parent)
    ap.add_argument('--pdf',action='append',default=[],help='Original PDF to test; may repeat')
    ap.add_argument('--manifest',type=Path,help='Optional original-PDF + SHA manifest')
    ap.add_argument('--pdfjs-build',type=Path,help='Local pdfjs-dist@4.10.38/build containing pdf.min.mjs and worker')
    ap.add_argument('--mathjax-js',type=Path,help='Local pinned MathJax v3 tex-chtml.js')
    ap.add_argument('--formula-cases',type=Path,help='Original PDF page rectangles for explicit real Texify crops')
    ap.add_argument('--allow-texify-network',action='store_true')
    ap.add_argument('--out-dir',type=Path,required=True)
    ap.add_argument('--timeout-ms',type=int,default=120000)
    ap.add_argument('--chromium-exe',help='Path to existing Chromium binary (optional)')
    ap.add_argument('--shell-only',action='store_true',help='Test startup, theme, lazy OCR and failure release without PDF.js')
    args=ap.parse_args(argv)
    if sync_playwright is None: raise SystemExit('BLOCKED: install Python Playwright and a Chromium browser')
    source=args.source_root.resolve()
    if not (source/'js/70-command-ui-runtime.js').is_file(): raise ValueError('Wrong MathReader source root')
    pdfs=maybe_read_manifest(args.manifest.resolve() if args.manifest else None,args.pdf)
    if args.shell_only and pdfs: raise ValueError('Use a separate run for --shell-only and actual PDFs')
    if not args.shell_only and not pdfs: raise ValueError('Supply --pdf or --manifest, or use --shell-only')
    pdfbuild=args.pdfjs_build.resolve() if args.pdfjs_build else None
    mathjax=args.mathjax_js.resolve() if args.mathjax_js else None
    formula_cases=[]
    if args.formula_cases:
        manifest=json.loads(args.formula_cases.read_text(encoding='utf8'))
        formula_cases=manifest.get('cases',[])
        if not isinstance(formula_cases,list): raise ValueError('Formula cases must be an array')
        seen_cases=set()
        allowed_shas={sha for _path,sha in pdfs}
        for case in formula_cases:
            if not isinstance(case,dict) or not case.get('id') or case.get('pdf_sha256') not in allowed_shas:
                raise ValueError('Formula case must have an id and refer to an original PDF in the manifest')
            key=(case['pdf_sha256'],case['id'])
            if key in seen_cases:raise ValueError('Duplicate formula case id within a PDF')
            seen_cases.add(key)
            rect=case.get('rect_pdf_pt')
            if not isinstance(rect,list) or len(rect)!=4 or not all(isinstance(x,(int,float)) for x in rect):
                raise ValueError('Formula case requires PDF-rendered top-left rect_pdf_pt [x0,y0,x1,y1]')
    preflight, formula_limitations = dependency_preflight(
        pdfs, pdfbuild, formula_cases, args.allow_texify_network)
    args.out_dir.mkdir(parents=True,exist_ok=True)
    app_version=re.search(r"const VERSION = '(\d+)'",(source/'mathreader.js').read_text(encoding='utf8')).group(1)
    output=dict(schema=1,run_at=datetime.now(timezone.utc).isoformat(),version=app_version,
                browser='Chromium/Playwright',preflight=preflight,formula_limitations=formula_limitations,shell=None,documents=[],
                limitations=['No human-reviewed whole-document ground truth is supplied by browser execution alone.',
                             'Formula OCR checks are unverified unless actual Texify inference is explicitly run.'])
    if args.shell_only:
        # Some CI/container browsers block even loopback HTTP. This mode loads
        # the unmodified ten-part runtime directly into an isolated DOM while
        # explicitly NOT exercising the PDF engine or persistence origin.
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,executable_path=args.chromium_exe or shutil.which('chromium') or shutil.which('chromium-browser'),args=['--no-sandbox'])
            try:
                page=browser.new_page(viewport={'width':1240,'height':900})
                inline_shell_browser(page,source,mathjax)
                output['shell']=shell_checks(page)
                output['shell']['scope']='isolated_dom_real_application_js_no_pdfjs_or_persistence'
            finally: browser.close()
    elif preflight:
        for path,hash_ in pdfs:
            data=dict(schema=1,capture_source='blocked_pdf_runtime',pdf_sha256=hash_,pages=None,stages={},indexes={},
                      engine={},formula_cases=[],errors=preflight,navigation={'status':'UNVERIFIED'},persistence={'status':'UNVERIFIED'})
            (args.out_dir/f'{hash_}.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
            output['documents'].append({'pdf':path.name,'sha256':hash_,'status':'UNVERIFIED','reasons':preflight})
    else:
        with tempfile.TemporaryDirectory(prefix='mathreader-p0-browser-') as workspace:
            root=Path(workspace)
            prepare_test_tree(source,root)
            server=serve(root)
            try:
                with sync_playwright() as p:
                    browser=p.chromium.launch(headless=True,executable_path=args.chromium_exe or shutil.which('chromium') or shutil.which('chromium-browser'),args=['--no-sandbox'])
                    try:
                        context=browser.new_context(viewport={'width':1240,'height':900},accept_downloads=False)
                        routes=route_dependencies(context,pdfbuild,mathjax,args.allow_texify_network)
                        page=context.new_page()
                        page.set_default_timeout(args.timeout_ms)
                        page.goto(f'http://127.0.0.1:{server.server_port}/mathreader/index.html',wait_until='domcontentloaded')
                        output['shell']=shell_checks(page)
                        if pdfs:
                            # Fresh context per original PDF; source is loaded from disk,
                            # never a cloud copy or approximate text layer.
                            for path,hash_ in pdfs:
                                page.close()
                                page=context.new_page()
                                page.set_default_timeout(args.timeout_ms)
                                page.goto(f'http://127.0.0.1:{server.server_port}/mathreader/index.html',wait_until='domcontentloaded')
                                page.wait_for_function('Boolean(window.__mathreaderP0)',timeout=15000)
                                cases=[c for c in formula_cases if c.get('pdf_sha256')==hash_]
                                item=full_document(page,path,hash_,args.timeout_ms,cases,
                                                   args.out_dir/'browser_formula_crops',args.allow_texify_network)
                                (args.out_dir/f'{hash_}.json').write_text(json.dumps(item,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
                                output['documents'].append({'pdf':path.name,'sha256':hash_,
                                                            'status':classify_document_capture(item,bool(cases)),
                                                            'errors':item['errors'],'stages':item['stages'],
                                                            'navigation':item['navigation'],
                                                            'persistence':item['persistence'],
                                                            'limitations':item.get('limitations',[])})
                        output['dependency_routes']=routes
                    finally: browser.close()
            finally:server.shutdown();server.server_close()
    (args.out_dir/'browser_p0_summary.json').write_text(json.dumps(output,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print(json.dumps({'shell_status':output['shell']['status'] if output['shell'] else 'NOT_RUN',
                      'document_statuses': [x['status'] for x in output['documents']],
                      'preflight':preflight,'summary':str(args.out_dir/'browser_p0_summary.json')},indent=2))
    if (output['shell'] and output['shell']['status']=='FAIL'
        or any(x['status']=='FAIL' for x in output['documents'])):
        return 1
    return 2 if preflight or any(x['status']!='COMPLETE' for x in output['documents']) else 0

if __name__=='__main__':
    raise SystemExit(main())
