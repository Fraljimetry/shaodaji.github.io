#!/usr/bin/env python3
"""Offline, content-addressed, paired PDF and formula regression runner.

Requirements: Python >=3.10, PyMuPDF. Optional: Node.js (source-level
parser probe), Tesseract (plain-text OCR PROXY, never Texify).
No downloads or hidden engine fallback. All substantial caches are opt-in local
artifacts; outputs disclose every skipped or unverified stage.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

EXTRACT_SCHEMA = 1
SELECTOR_SCHEMA = 1
OCR_SCHEMA = 1
MATH = re.compile(r"[=∫∮∑∏∂√∞≤≥≠≈∈∉∇⊂⊆⊕⊗≡⇒↔→←×±∝∣∥∼∧∨∪∩∅ℝℂαβγδϕφλμσθπΓΔΣΛΩ]")
PROSE = re.compile(r"\b(?:Theorem|Lemma|Chapter|References|Bibliography|Definition|Figure|Table|Index|Proof)\b", re.I)


def digest_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for part in iter(lambda: f.read(1024 * 1024), b''):
            h.update(part)
    return h.hexdigest()


def stable_json(data) -> str:
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def atomic_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + f'.{os.getpid()}.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    os.replace(temp, path)


def choose_region(candidates, page_count: int, dimensions):
    if candidates:
        c = max(candidates, key=lambda item: (item['score'], -item['page']))
        w, h = dimensions[c['page'] - 1]
        x0, y0, x1, y1 = c['bbox']
        px = min(110, max(28, (x1 - x0) * 0.3))
        py = min(30, max(10, (y1 - y0) * 1.1))
        rect = [round(max(0, x0 - px), 2), round(max(0, y0 - py), 2),
                round(min(w, x1 + px), 2), round(min(h, y1 + py), 2)]
        return dict(page=c['page'], clip=rect, kind='automatic_native_formula_candidate_UNVERIFIED',
                    extracted_line=c['text'][:180], score=c['score'], ground_truth_verified=False)
    page = max(1, (page_count + 1) // 2)
    w, h = dimensions[page - 1]
    return dict(page=page, clip=[0, 0, w, h], kind='page_fallback_no_verified_formula',
                extracted_line='', score=0, ground_truth_verified=False)


def extract_pdf(task):
    """A separate process owns each PDF; avoids unsafe PyMuPDF threading."""
    path, sha, data_dir = task
    import fitz
    fitz_version = fitz.VersionBind
    started = time.perf_counter()
    cache = Path(data_dir) / 'extract' / sha[:2] / f'{sha}-e{EXTRACT_SCHEMA}-s{SELECTOR_SCHEMA}.jsonl.gz'
    meta_path = cache.with_suffix('.meta.json')
    if cache.exists() and meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text(encoding='utf8'))
            if (meta['sha256'] == sha and meta['schema'] == EXTRACT_SCHEMA
                    and meta['selector_schema'] == SELECTOR_SCHEMA
                    and meta['fitz_version'] == fitz_version):
                return dict(meta=meta, geometry=str(cache), extraction_cache_hit=True,
                            elapsed_ms=round((time.perf_counter() - started)*1000))
        except (ValueError, KeyError, OSError):
            pass
    cache.parent.mkdir(parents=True, exist_ok=True)
    temp = cache.with_name(cache.name + f'.{os.getpid()}.tmp')
    page_count = 0
    line_total = 0
    native_chars = 0
    low_text = []
    candidates = []
    dimensions = []
    errors = []
    try:
        with fitz.open(path) as doc:
            page_count = len(doc)
            with gzip.open(temp, 'wt', encoding='utf8', compresslevel=3) as dst:
                for i in range(page_count):
                    page = doc.load_page(i)
                    w, h = float(page.rect.width), float(page.rect.height)
                    dimensions.append([round(w, 2), round(h, 2)])
                    lines = []
                    page_chars = 0
                    try:
                        blocks = page.get_text('dict', sort=True).get('blocks', [])
                        for block in blocks:
                            if block.get('type') != 0:
                                continue
                            for line in block.get('lines', []):
                                spans = line.get('spans', [])
                                value = ''.join(span.get('text', '') for span in spans).strip()
                                if not value:
                                    continue
                                box = line.get('bbox', [])
                                if len(box) != 4 or not all(isinstance(x, (int,float)) for x in box):
                                    continue
                                x0,y0,x1,y1 = (float(x) for x in box)
                                if not (x0 < x1 and y0 < y1):
                                    continue
                                page_chars += len(value)
                                glyphs = len(MATH.findall(value))
                                lines.append(dict(text=value[:1000], ratio=round(y0 / max(1,h), 6),
                                                  xStartRatio=round(x0 / max(1,w), 6),
                                                  xEndRatio=round(x1 / max(1,w), 6), ocrSource=False))
                                score = glyphs * 3 + (5 if '=' in value and len(value) < 120 else 0)
                                score += (2 if ('(' in value and ')' in value) else 0)
                                if PROSE.search(value):
                                    score -= 7
                                if len(value) > 150:
                                    score -= 8
                                if score > 2 and .06 < y0 / max(1, h) < .94:
                                    candidates.append(dict(page=i+1, bbox=[x0,y0,x1,y1],
                                                           text=value[:180], score=score))
                    except Exception as exc:
                        errors.append({'page':i+1,'error':str(exc)[:250]})
                    line_total += len(lines)
                    native_chars += page_chars
                    if page_chars < 30:
                        low_text.append(i+1)
                    dst.write(stable_json({'page':i+1, 'size':[w,h], 'native_chars':page_chars,
                                           'lines':lines}) + '\n')
        region = choose_region(candidates, page_count, dimensions) if page_count else None
        # Provenance, page counts and crop selection are never inferred from OCR.
        meta = dict(schema=EXTRACT_SCHEMA, selector_schema=SELECTOR_SCHEMA, fitz_version=fitz_version, sha256=sha,
                    pages=page_count, lines=line_total, native_text_chars=native_chars,
                    low_native_pages=low_text, extraction_errors=errors,
                    formula_region=region, extraction_elapsed_ms=round((time.perf_counter()-started)*1000))
        os.replace(temp, cache)
        atomic_json(meta_path, meta)
    finally:
        if temp.exists():
            temp.unlink()
    return dict(meta=meta, geometry=str(cache), extraction_cache_hit=False,
                elapsed_ms=round((time.perf_counter() - started)*1000))


def file_inputs(args):
    if bool(args.manifest) == bool(args.corpus_dir):
        raise ValueError('Specify exactly one of --manifest or --corpus-dir')
    if args.manifest:
        manifest = Path(args.manifest).resolve()
        data = json.loads(manifest.read_text(encoding='utf8'))
        if not isinstance(data, dict) or not isinstance(data.get('documents'), list):
            raise ValueError('Manifest requires {"documents":[{"path":"...", "sha256":"optional"}]}')
        records = data['documents']
        parent = manifest.parent
    else:
        parent = Path(args.corpus_dir).resolve()
        records = [{'path':str(p)} for p in sorted(parent.rglob('*.pdf'))]
    if not records:
        raise ValueError('No PDFs in corpus')
    docs = []
    seen = {}
    for rec in records:
        p = Path(rec['path'])
        if not p.is_absolute():
            p = parent / p
        p = p.resolve()
        if not p.is_file() or p.suffix.lower() != '.pdf':
            raise FileNotFoundError(f'PDF not available: {p}')
        sha = digest_file(p)
        if rec.get('sha256') and rec['sha256'].lower() != sha:
            raise ValueError(f'Manifest SHA-256 mismatch: {p}')
        if sha in seen:
            raise ValueError(f'Duplicate PDF bytes: {seen[sha]} and {p}; a filename change is not a new document')
        seen[sha] = str(p)
        docs.append({'path':str(p),'filename':p.name,'sha256':sha,
                     'size_bytes':p.stat().st_size, 'discipline':rec.get('discipline','unclassified'),
                     'source_era':rec.get('source_era','unknown')})
    if args.max_files is not None and len(docs) != args.max_files:
        raise ValueError(f'Expected {args.max_files} unique files; found {len(docs)}')
    return docs


def proxy_ocr(task):
    """Tesseract plain text only. Formula recognition remains UNVERIFIED."""
    pdf, sha, page, clip, cache_dir, dpi, lang, psm, timeout, exe, version = task
    started = time.perf_counter()
    config = {'schema':OCR_SCHEMA,'sha256':sha,'page':page,'clip':clip,'dpi':dpi,
              'language':lang,'psm':psm,'tesseract_version':version,'engine':'tesseract_plain_text_proxy'}
    key = hashlib.sha256(stable_json(config).encode()).hexdigest()
    target = Path(cache_dir)/'ocr'/key[:2]/f'{key}.json'
    if target.exists():
        try:
            r = json.loads(target.read_text(encoding='utf8'))
            if r['config'] == config and r['status'] == 'ok':
                return dict(result=r, hit=True, elapsed_ms=round((time.perf_counter()-started)*1000))
        except (ValueError, KeyError, OSError):
            pass
    import fitz
    with fitz.open(pdf) as doc:
        pg = doc.load_page(page - 1)
        bbox = fitz.Rect(clip) & pg.rect
        if bbox.is_empty:
            return {'result':{'status':'invalid_crop','config':config},'hit':False,'elapsed_ms':0}
        pix = pg.get_pixmap(matrix=fitz.Matrix(dpi/72,dpi/72),clip=bbox,
                            colorspace=fitz.csGRAY,alpha=False)
        png = pix.tobytes('png')
    env = os.environ.copy()
    env['OMP_THREAD_LIMIT'] = '1'
    try:
        proc = subprocess.run([exe,'stdin','stdout','-l',lang,'--psm',str(psm)],
                              input=png,capture_output=True,timeout=timeout,env=env)
        status = 'ok' if proc.returncode == 0 else 'execution_failed'
        value = proc.stdout.decode('utf8','replace') if status=='ok' else ''
        result = {'config':config,'status':status,'returncode':proc.returncode,
                  'transcript':value[:5000], 'character_count':len(value),
                  'stderr_excerpt':proc.stderr.decode('utf8','replace')[:300],
                  'ocr_elapsed_ms':round((time.perf_counter()-started)*1000)}
    except subprocess.TimeoutExpired:
        result = {'config':config,'status':'timeout','transcript':'',
                  'character_count':0,'ocr_elapsed_ms':round((time.perf_counter()-started)*1000)}
    if result['status']=='ok':
        atomic_json(target, result)  # no cached failures; next run may retry
    return {'result':result,'hit':False,'elapsed_ms':round((time.perf_counter()-started)*1000)}


def tesseract_version(exe):
    result = subprocess.run([exe,'--version'],capture_output=True,text=True,timeout=5)
    if result.returncode:
        raise RuntimeError('Tesseract executable failed version check; no OCR fallback')
    return result.stdout.splitlines()[0].strip() or 'unknown'


def run_detector(docs, extracted, cache_dir, project_root, node_exe):
    src = project_root/'js'/'41-equations-bibliography.js'
    runner = project_root/'regression_tools'/'detector_proxy.js'
    fingerprint = hashlib.sha256((digest_file(src)+digest_file(runner)).encode()).hexdigest()[:18]
    instructions = []
    cached_before = 0
    for doc in docs:
        sha = doc['sha256']
        entry = extracted[sha]
        cache = cache_dir/'detectors'/sha[:2]/f'{sha}-{fingerprint}-e{EXTRACT_SCHEMA}.json'
        cached_before += int(cache.exists())
        instructions.append({'sha256':sha,'geometry':entry['geometry'],'cache':str(cache)})
    input_path = cache_dir/'detector_instructions.json'
    atomic_json(input_path, {'instructions':instructions})
    proc = subprocess.run([node_exe,str(runner),'--source',str(src),'--input',str(input_path)],
                          capture_output=True,text=True,timeout=900)
    if proc.returncode:
        raise RuntimeError(f'Detector proxy failed (fail-closed): {proc.stderr[:1600]}')
    answer = {}
    for spec in instructions:
        answer[spec['sha256']] = json.loads(Path(spec['cache']).read_text(encoding='utf8'))
    return answer, proc.stdout.strip(), cached_before


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument('--corpus-dir',help='recursive directory of original PDFs')
    group.add_argument('--manifest',help='JSON list of original PDFs with optional known hashes')
    ap.add_argument('--project-root',default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument('--cache-dir',default='.mathreader-regression-cache')
    ap.add_argument('--out-dir',required=True)
    ap.add_argument('--max-files',type=int,help='require this exact number of unique PDFs')
    ap.add_argument('--workers',type=int,default=2,help='independent PDF processes (default: 2)')
    ap.add_argument('--ocr-workers',type=int,default=3)
    ap.add_argument('--ocr',choices=['none','selected','low-text','all'],default='selected',
                    help='Tesseract plain-text proxy only; selected=one candidate per PDF')
    ap.add_argument('--max-ocr-pages',type=int,default=100,help='budget; unprocessed pages reported')
    ap.add_argument('--ocr-dpi',type=int,default=160)
    ap.add_argument('--ocr-timeout',type=int,default=20)
    ap.add_argument('--ocr-language',default='eng')
    ap.add_argument('--ocr-psm',type=int,default=6)
    ap.add_argument('--tesseract',default='tesseract')
    ap.add_argument('--no-detector',action='store_true',help='skip Node source-level parser probe, report unverified')
    ap.add_argument('--node',default='node')
    ap.add_argument('--formula-candidates',help='optional actual OCR or manual LaTeX JSON sidecar (never generated by Tesseract)')
    args = ap.parse_args(argv)
    if not 1<=args.workers<=16 or not 1<=args.ocr_workers<=16 or args.max_ocr_pages<0:
        ap.error('worker counts must be 1..16; OCR page budget must be nonnegative')
    started=time.perf_counter()
    cache=Path(args.cache_dir).resolve();cache.mkdir(parents=True,exist_ok=True)
    out=Path(args.out_dir).resolve();out.mkdir(parents=True,exist_ok=True)
    docs=file_inputs(args)
    print(f'Corpus: {len(docs)} original PDFs, unique SHA-256 verified', flush=True)
    extracted = {}
    tasks=[(d['path'],d['sha256'],str(cache)) for d in docs]
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for res in pool.map(extract_pdf,tasks):
            extracted[res['meta']['sha256']]=res
    cache_extract=sum(v['extraction_cache_hit'] for v in extracted.values())
    print(f'Text/geometry: {len(docs)} processed, {cache_extract} cache hits',flush=True)
    detector={}
    detector_hits=0
    if not args.no_detector:
        detector,report,detector_hits=run_detector(docs,extracted,cache,Path(args.project_root).resolve(),args.node)
        print(f'Actual-source parser proxy: {len(detector)} PDFs; {report}',flush=True)
    ocr_tasks=[]
    for d in docs:
        m=extracted[d['sha256']]['meta']
        region=m.get('formula_region')
        if args.ocr == 'none' or not region:
            continue
        pages = []
        if args.ocr in ('selected','low-text','all'):
            pages.append((region['page'],region['clip'],'formula_candidate_or_fallback'))
        if args.ocr in ('low-text','all'):
            import fitz
            with fitz.open(d['path']) as doc:
                pg_numbers=m['low_native_pages'] if args.ocr=='low-text' else range(1,len(doc)+1)
                for pgno in pg_numbers:
                    if pgno!=region['page']:
                        sz=doc.load_page(pgno-1).rect
                        pages.append((pgno,[0,0,round(sz.width,2),round(sz.height,2)],'full_page'))
        for pgno,rect,kind in pages:
            ocr_tasks.append((d['sha256'],d['path'],pgno,rect,kind))
    # Deterministic order, explicit truncation. Never claim skipped pages were checked.
    ocr_tasks.sort(key=lambda t:(t[0], t[2], t[4]))
    scheduled=ocr_tasks[:args.max_ocr_pages]
    deferred=ocr_tasks[args.max_ocr_pages:]
    ocr_results={}
    ocr_stats={'scheduled':len(scheduled),'deferred_due_to_budget':len(deferred),'cache_hits':0,
               'execution_failures':0,'timeouts':0,'empty_transcripts':0}
    if scheduled:
        version=tesseract_version(args.tesseract) # fail loudly if engine absent
        with ThreadPoolExecutor(max_workers=args.ocr_workers) as pool:
            promises={pool.submit(proxy_ocr,(p,sha,page,rect,str(cache),args.ocr_dpi,args.ocr_language,
                                            args.ocr_psm,args.ocr_timeout,args.tesseract,version)):(sha,page,kind)
                      for sha,p,page,rect,kind in scheduled}
            for fut in as_completed(promises):
                sha,page,kind=promises[fut]
                result=fut.result()
                ocr_results[(sha,page,kind)]=result
                if result['hit']:ocr_stats['cache_hits']+=1
                if result['result']['status']=='timeout':ocr_stats['timeouts']+=1
                if result['result']['status']!='ok':ocr_stats['execution_failures']+=1
                if result['result']['status']=='ok' and not result['result']['transcript'].strip():
                    ocr_stats['empty_transcripts']+=1
    print(f'Plain-text OCR proxy: {len(scheduled)} attempted, {ocr_stats["cache_hits"]} cache hits, '
          f'{len(deferred)} deferred by budget',flush=True)
    selected_by_sha={}
    for sha,p,page,rect,kind in scheduled:
        res=ocr_results.get((sha,page,kind))
        selected_by_sha.setdefault(sha,[]).append({'page':page,'region_kind':kind,'status':res['result']['status'],
            'cached':res['hit'],'ocr_elapsed_ms':res['result'].get('ocr_elapsed_ms'),
            'character_count':res['result'].get('character_count',0),
            'plain_text_excerpt':res['result'].get('transcript','')[:400],
            'engine':'Tesseract plain-text proxy; not formula LaTeX'})
    defer_by_sha={}
    for sha,p,page,rect,kind in deferred:
        defer_by_sha.setdefault(sha,[]).append(page)
    formula_records={}
    if args.formula_candidates:
        candidate_json=Path(args.formula_candidates).resolve()
        candidates=json.loads(candidate_json.read_text(encoding='utf8'))
        if not isinstance(candidates,dict) or not isinstance(candidates.get('cases'),list):
            raise ValueError('Formula candidates file requires {"cases":[{"sha256":"...","page":1,"latex":"...","provenance":"..."}]}')
        corpus_hashes={d['sha256'] for d in docs}
        for item in candidates['cases']:
            if item.get('sha256') not in corpus_hashes or not isinstance(item.get('latex'),str) or not item.get('provenance'):
                raise ValueError('Each formula case requires a known PDF SHA-256, LaTeX and provenance')
            if not 1 <= int(item.get('page',0)) <= extracted[item['sha256']]['meta']['pages']:
                raise ValueError('Formula candidate page outside corresponding PDF')
        checker=Path(args.project_root).resolve()/'regression_tools'/'latex_check.js'
        proc=subprocess.run([args.node,str(checker),'--source',str(Path(args.project_root).resolve()/'js'/'10-formula-ocr.js'),
                             '--input',str(candidate_json)],capture_output=True,text=True,timeout=180)
        if proc.returncode:
            raise RuntimeError(f'Formula syntax check unavailable or failed: {proc.stderr[:1000]}')
        checked=json.loads(proc.stdout)
        for item in checked['cases']:
            formula_records.setdefault(item['sha256'],[]).append(item)
        print(f'Formula candidates: {len(checked["cases"])} syntax compilation attempts; not semantic recognition verification',flush=True)
    records=[]
    for d in docs:
        sha=d['sha256']; ext=extracted[sha]; meta=ext['meta']; det=detector.get(sha)
        record={**d, 'pages':meta['pages'], 'native_text_chars':meta['native_text_chars'],
                'native_lines':meta['lines'], 'low_native_page_count':len(meta['low_native_pages']),
                'low_native_pages':meta['low_native_pages'], 'native_extraction_errors':meta['extraction_errors'],
                'extraction_cached':ext['extraction_cache_hit'],
                'extraction_elapsed_ms_this_run':ext['elapsed_ms'],
                'formula_region':meta['formula_region'], 'ocr_proxy':selected_by_sha.get(sha,[]),
                'ocr_deferred_pages':defer_by_sha.get(sha,[]),
                'detector_proxy':det, 'browser_final_indexes':'UNVERIFIED: not executed',
                'actual_texify_formula_ocr':'UNVERIFIED: not executed',
                'formula_candidates':formula_records.get(sha,[]),
                'formula_compilation':'UNVERIFIED: no actual formula LaTeX provided' if not formula_records.get(sha) else 'per-candidate MathJax results; semantic correctness still UNVERIFIED',
                'source_accurate_formula_transcription':'UNVERIFIED: independent ground truth needed',
                'full_document_accuracy':'UNVERIFIED'}
        records.append(record)
    summary={'schema':1,'method':'offline cached source-level PDF regression, NOT browser final indexes',
             'version':'v353 test infrastructure (site runtime otherwise unchanged)',
             'pdf_count':len(records),'total_pages':sum(r['pages'] for r in records),
             'low_native_pages':sum(r['low_native_page_count'] for r in records),
             'extraction_cache_hits':cache_extract,'detector_cache_hits':detector_hits,
             'ocr':ocr_stats,'fully_verified_pass':0,'newly_verified_fail':0,'unverified':len(records),
             'elapsed_ms':round((time.perf_counter()-started)*1000),
             'notes':['All source PDFs were SHA-256 verified; no network access or hidden fallback.',
                     'Each formula region is a heuristic crop, NOT a verified formula.',
                     'Tesseract is plain-text OCR, NOT Texify image-to-LaTeX.',
                     'No automated classification as PASS from parser execution or compilation.',
                     'Ground truth, final PDF.js browser indexes, actual Texify and symbol-level accuracy remain unverified.']}
    # audit files are reusable; no raw PDF bytes or credentials embedded.
    atomic_json(out/'audit.json',{'summary':summary,'documents':records})
    atomic_json(out/'manifest.json',{'documents':[
        {'path':d['path'],'sha256':d['sha256'],'discipline':d['discipline'],'source_era':d['source_era']} for d in docs]})
    print(json.dumps({k:summary[k] for k in ['pdf_count','total_pages','extraction_cache_hits','detector_cache_hits','ocr','elapsed_ms']},indent=2),flush=True)
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError, FileNotFoundError, subprocess.SubprocessError) as exc:
        print(f'ERROR: {exc}',file=sys.stderr)
        raise SystemExit(2)
