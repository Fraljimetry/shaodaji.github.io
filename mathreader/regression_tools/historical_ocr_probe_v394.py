#!/usr/bin/env python3
"""Offline Tesseract diagnostic, NOT MathReader browser Texify or OCR certification.

Repro: python regression_tools/historical_ocr_probe_v394.py --pdf-dir corpus --out probe.json
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import datetime
import hashlib
import os
import json
from pathlib import Path
import subprocess
import time
import fitz


def sample_pages(n, name):
    values = {1, n, *[max(1, min(n, round(n * f))) for f in (.08, .25, .50, .75, .92)]}
    label = name.lower()
    if 'giusti' in label: values.update((8, 16, 87, 98, 125, 148, 231, 237, 239, 248))
    if 'yau' in label: values.update((2, 5, 8, 25, 65, 69, 73))
    return sorted(p for p in values if 1 <= p <= n)


def probe_one(task):
    name, file_path, number = task
    begin = time.monotonic()
    try:
        with fitz.open(file_path) as pdf:
            page = pdf[number - 1]
            native = page.get_text()
            pix = page.get_pixmap(matrix=fitz.Matrix(1.75, 1.75), alpha=False, colorspace=fitz.csGRAY)
            png = pix.tobytes('png')
        process = subprocess.run(['tesseract', 'stdin', 'stdout', '-l', 'eng', '--psm', '3'],
            input=png, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=35, env={**os.environ, 'OMP_THREAD_LIMIT':'1'})
        ocr = process.stdout.decode('utf-8', 'replace')
        return {'document': name, 'page': number, 'nativeCharacters': len(native),
            'offlineOcrCharacters': len(ocr), 'offlineOcr': ocr,
            'offlineOcrSha256': hashlib.sha256(ocr.encode()).hexdigest(),
            'elapsedSeconds': round(time.monotonic()-begin, 3),
            'exitCode': process.returncode, 'error': (process.stderr.decode('utf-8','replace')[:350] if process.returncode else None)}
    except Exception as e:
        return {'document':name, 'page':number, 'elapsedSeconds':round(time.monotonic()-begin,3),'error':f'{type(e).__name__}: {e}'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf-dir', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--workers', type=int, default=3)
    parser.add_argument('--include', action='append', help='Optional filename substring; may repeat')
    parser.add_argument('--all-pages', action='store_true', help='Process every page of selected PDF(s)')
    args = parser.parse_args()
    pdfs = sorted(args.pdf_dir.glob('*.pdf'))
    if args.include: pdfs = [p for p in pdfs if any(x.lower() in p.name.lower() for x in args.include)]
    docs=[]; jobs=[]
    for f in pdfs:
        with fitz.open(f) as pdf: n=len(pdf)
        sha=hashlib.sha256(f.read_bytes()).hexdigest()
        pages=list(range(1,n+1)) if args.all_pages else sample_pages(n,f.name)
        docs.append({'file':f.name,'sha256':sha,'pages':n,'sampledPages':pages})
        jobs.extend((f.name,str(f),p) for p in pages)
    rows=[]
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures=[ex.submit(probe_one,task) for task in jobs]
        for i, f in enumerate(as_completed(futures),1):
            row=f.result(); rows.append(row)
            print(f"{i:3}/{len(jobs)} {row['document'][:30]:30} p{row['page']:3} OCR {row.get('offlineOcrCharacters',0):5} chars {row['elapsedSeconds']:5}s {'ERR' if row.get('error') else ''}",flush=True)
    rows.sort(key=lambda x:(x['document'],x['page']))
    result={'schema':'mathreader.offline-ocr-diagnostic@1',
        'createdUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'engine':'Tesseract CLI 5.5, eng, PSM 3, approximately 126-dpi grayscale',
        'scope':'Diagnostic sample only; NOT the production MathReader Texify or browser OCR pipeline; not accuracy certification',
        'documents':docs,'records':rows,
        'summary':{'documents':len(docs),'sampledPages':len(rows),
            'successfulPages':sum(1 for r in rows if r.get('exitCode')==0),
            'nonemptyOcrPages':sum(1 for r in rows if r.get('offlineOcrCharacters',0)>0),
            'errors':sum(1 for r in rows if r.get('error')),
            'totalWorkerWallSeconds':round(sum(r['elapsedSeconds'] for r in rows),3)}}
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print('SUMMARY:',json.dumps(result['summary'],indent=2),flush=True)

if __name__=='__main__':main()
