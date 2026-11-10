#!/usr/bin/env python3
"""Evidence-honest cross-journal MathReader P0 corpus preparation and capture.

Selection != execution. A publisher URL never substitutes for original PDF bytes.
Optional --run-browser calls the pre-existing real Chromium/PDF.js capture gate.
No claim of mathematical accuracy is possible without independent page truth.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys


def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parent.parent)
    p.add_argument('--pdf-dir',type=Path,help='Directory containing PDFs named as local_pdf basenames in the selection')
    p.add_argument('--out-dir',type=Path,required=True)
    p.add_argument('--run-browser',action='store_true',help='Only capture papers with original PDF bytes; needs pinned PDF.js asset')
    p.add_argument('--pdfjs-build',type=Path)
    args=p.parse_args(argv)
    root=args.source_root.resolve()
    selection=json.loads((root/'regression/journal_corpus_v421.json').read_text(encoding='utf8'))
    out=args.out_dir.resolve();out.mkdir(parents=True,exist_ok=True)
    records=[];documents=[]
    for paper in selection['papers']:
        name=Path(paper['local_pdf']).name
        pdf=(args.pdf_dir.resolve()/name) if args.pdf_dir else (root/'regression'/paper['local_pdf'])
        record={'id':paper['id'],'journal':paper['journal'],'title':paper['title'],'path':str(pdf),
                'source_url':paper['publisher_url'],'capture_status':'BLOCKED_NO_PDF',
                'independent_truth':'NOT_REVIEWED'}
        if pdf.is_file():
            if pdf.suffix.lower() != '.pdf' or pdf.open('rb').read(5) != b'%PDF-':
                record['capture_status']='INVALID_PDF'
            else:
                sha=digest(pdf)
                expected=paper.get('pdf_sha256')
                record['sha256']=sha
                if expected and sha!=expected:
                    record['capture_status']='PDF_SHA_MISMATCH'
                else:
                    record['capture_status']='READY_TO_CAPTURE'
                    documents.append({'path':str(pdf),'sha256':sha})
        records.append(record)
    manifest=out/'available_pdf_manifest.json'
    manifest.write_text(json.dumps({'schema':1,'documents':documents},indent=2)+'\n',encoding='utf8')
    summary={'schema':'mathreader.journal_corpus_gate@1','selected_journals':selection['total_journals'],
             'selected_papers':len(records),'ready_pdfs':len(documents),'capture_status':'NOT_RUN',
             'independent_mathematical_accuracy':'NOT_CERTIFIED','papers':records}
    if args.run_browser:
        if documents:
            cmd=[sys.executable,str(root/'regression_tools/p0_browser.py'),'--source-root',str(root),
                 '--manifest',str(manifest),'--out-dir',str(out/'browser')]
            if args.pdfjs_build: cmd += ['--pdfjs-build',str(args.pdfjs_build.resolve())]
            try:
                proc=subprocess.run(cmd,check=False,text=True,capture_output=True,timeout=900)
                summary['capture_status']='COMPLETED' if proc.returncode==0 else 'FAILED_OR_INCOMPLETE'
                summary['browser_exit_code']=proc.returncode
                summary['browser_output_tail']=(proc.stdout+'\n'+proc.stderr)[-3000:]
            except subprocess.TimeoutExpired:
                summary['capture_status']='TIMED_OUT'
        else:
            summary['capture_status']='BLOCKED_NO_PDF'
    else:
        summary['capture_status']='NOT_REQUESTED'
    (out/'journal_corpus_status.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf8')
    print(json.dumps({k:v for k,v in summary.items() if k!='papers'},indent=2))
    if args.run_browser and (not documents or summary['capture_status']!='COMPLETED'):
        return 2
    return 0

if __name__=='__main__': raise SystemExit(main())
