#!/usr/bin/env python3
"""Compare two MathReader full-text exports without generating OCR.
Return status 0 for exact margin-evidence preservation, 1 for loss/mutation,
2 for invalid/incompatible source documents. JSON results do not include raw OCR.
Usage: python mathreader/regression_tools/compare_margin_exports_v403.py BEFORE.json AFTER.json
"""
import json,hashlib,sys
from collections import Counter
from pathlib import Path

def summarize(path):
    raw=Path(path).read_bytes()
    payload=json.loads(raw)
    doc=payload.get('document') or {}
    full=payload.get('fullDocumentText') or {}
    pages=full.get('pages') or []
    if not isinstance(pages,list) or len(pages)!=doc.get('pages') or not str(doc.get('id','')).startswith('sha256:'):
        raise ValueError('File is not an exact-ID, page-complete MathReader full-text export')
    observations={}
    for page in pages:
        n=page.get('page')
        if not isinstance(n,int) or n<1 or n>doc['pages']:raise ValueError('Bad PDF page')
        for side in page.get('equationMarginOcr',[]):
            key=(n,side.get('side'))
            if key in observations or key[1] not in ('left','right'):raise ValueError('Bad duplicate or side')
            lines=side.get('lines')
            if not isinstance(lines,list):raise ValueError('Bad OCR lines')
            observations[key]=lines
    return {'documentId':doc['id'],'pageCount':doc['pages'],
        'fileSha256':hashlib.sha256(raw).hexdigest(),
        'observations':observations,'coverage':full.get('equationMarginOcrCoverage') or {}}

def compare(a,b):
    x=summarize(a);y=summarize(b)
    if x['documentId']!=y['documentId'] or x['pageCount']!=y['pageCount']:
        raise ValueError('The two exports belong to different PDF identities or page counts')
    before=x['observations'];after=y['observations'];keys=set(before)|set(after)
    same=sum(k in before and k in after and before[k]==after[k] for k in keys)
    removed=sum(k not in after for k in before)
    added=sum(k not in before for k in after)
    changed=sum(k in before and k in after and before[k]!=after[k] for k in keys)
    result={'status':'PASS' if not removed and not changed else 'FAIL',
        'pdfId':x['documentId'],'pdfPages':x['pageCount'],
        'beforeExportSha256':x['fileSha256'],'afterExportSha256':y['fileSha256'],
        'before':{'pageSideRecords':len(before),'pagesWithEvidence':len(set(p for p,_ in before)),
            'ocrLines':sum(len(v) for v in before.values()),'coverage':x['coverage']},
        'after':{'pageSideRecords':len(after),'pagesWithEvidence':len(set(p for p,_ in after)),
            'ocrLines':sum(len(v) for v in after.values()),'coverage':y['coverage']},
        'unchangedPageSideRecords':same,'missingPageSideRecords':removed,
        'changedPageSideRecords':changed,'addedPageSideRecords':added,
        'missingExamples':[[p,s] for p,s in sorted(set(before)-set(after))[:12]],
        'changedExamples':[[p,s] for p,s in sorted(set(before)&set(after)) if before[(p,s)]!=after[(p,s)]][:12]}
    return result

if __name__=='__main__':
    if len(sys.argv)!=3:
        print('Usage: compare_margin_exports_v403.py BEFORE.json AFTER.json',file=sys.stderr);sys.exit(2)
    try: result=compare(*sys.argv[1:])
    except (ValueError,KeyError,TypeError,UnicodeError,json.JSONDecodeError) as e:
        print(json.dumps({'status':'INVALID','reason':str(e)},ensure_ascii=False));sys.exit(2)
    print(json.dumps(result,indent=2,ensure_ascii=False))
    sys.exit(0 if result['status']=='PASS' else 1)
