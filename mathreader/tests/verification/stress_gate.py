#!/usr/bin/env python3
"""Repeated real-test reliability and performance gate; deterministic case inventory.

PASS only if every attempt exits zero without skipped evidence and stays under
per-run time budget. Never equate a mocked-browser test with real PDF/OCR.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import shutil
import statistics
import sys

CASES = (
    ('reader-navigation', 'tests/reading_navigation_races_v424.py', 'python-browser'),
    ('settings', 'tests/settings_full_sweep_v434.py', 'python-browser'),
    ('search', 'tests/search_multicolumn_fuzzy_v431_regression.js', 'node'),
    ('equation-index', 'tests/equation_notation_families_v418_regression.js', 'node'),
    ('ocr-lifecycle', 'tests/ocr_reliability_deep_regression.js', 'node'),
)

def verify(root, attempts=2, timeout=180, budget=180, cases=CASES):
    # Import from sibling, where subprocess process tree and skip detection are centralized.
    from release_gate import run_command
    root=Path(root).resolve()
    report={'schemaVersion':1,'evidence':'repeated-production-source-regressions-some-browser-mocked',
            'status':'INCOMPLETE','cases':[],'counts':{}}
    if type(attempts) is not int or attempts<2 or attempts>20:
        report['reason']='At least two and at most twenty independent attempts required';return report
    if not cases:
        report['reason']='No reliability/performance cases selected';return report
    for name,rel,kind in cases:
        path=root/rel
        if not path.is_file():
            report['cases'].append({'name':name,'status':'INCOMPLETE','reason':'Required regression script absent','path':rel})
            continue
        results=[]
        for i in range(attempts):
            command=([shutil.which('node') or 'node',str(path)] if kind=='node' else [sys.executable,str(path)])
            result=run_command(f'{name}:{i+1}',command,root,timeout,'repeated-regression-performance',kind if kind=='node' else 'chromium')
            results.append(result)
            if result['status'] != 'PASS': break
        measured=[r.get('seconds',0) for r in results if r['status']=='PASS']
        status='FAIL' if any(r['status']=='FAIL' for r in results) or any(s>budget for s in measured) else ('INCOMPLETE' if len(results)!=attempts or any(r['status']=='INCOMPLETE' for r in results) else 'PASS')
        report['cases'].append({'name':name,'status':status,'attemptsCompleted':len(results),
            'attemptsRequired':attempts,'maxSeconds':max(measured,default=None),
            'meanSeconds':round(statistics.mean(measured),3) if measured else None,
            'budgetSeconds':budget,'runs':results})
    counts={s:sum(c['status']==s for c in report['cases']) for s in ('PASS','FAIL','INCOMPLETE')}
    report['counts']=counts
    report['status']='FAIL' if counts['FAIL'] else 'INCOMPLETE' if counts['INCOMPLETE'] else 'PASS'
    return report

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
    ap.add_argument('--attempts',type=int,default=2)
    ap.add_argument('--timeout',type=int,default=180)
    ap.add_argument('--budget',type=float,default=180)
    ap.add_argument('--output',type=Path)
    args=ap.parse_args()
    r=verify(args.root,args.attempts,args.timeout,args.budget)
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps({'status':r['status'],'counts':r['counts']}))
    return {'PASS':0,'FAIL':1,'INCOMPLETE':2}[r['status']]
if __name__=='__main__': sys.exit(main())
