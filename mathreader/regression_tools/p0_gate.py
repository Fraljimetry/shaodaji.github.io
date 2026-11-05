#!/usr/bin/env python3
"""One-command local P0 gate: static regressions + browser + optional truth audit.

Never infers whole-document accuracy from successful source-level tests.
"""
from __future__ import annotations

import argparse
from datetime import datetime,timezone
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile


def run_process(command, cwd, seconds=180):
    try:
        result=subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE,
                              stderr=subprocess.STDOUT, timeout=seconds, check=False)
        explicitly_incomplete = result.returncode == 2 and any(str(x).endswith(('p0_browser.py','p0_ground_truth.py')) for x in command)
        return {'command':command, 'exit_code':result.returncode,
                'status':'PASS' if result.returncode==0 else ('INCOMPLETE' if explicitly_incomplete else 'FAIL'),
                'output':result.stdout[-5000:]}
    except (OSError,subprocess.TimeoutExpired) as error:
        return {'command':command,'exit_code':None,'status':'BLOCKED','output':str(error)}


def all_source_gates(root: Path):
    report=[]
    js_files=[root/'mathreader.js',*sorted((root/'js').glob('*.js')),
              *sorted((root/'tests').glob('*.js')),*sorted((root/'regression_tools').glob('*.js'))]
    for path in js_files:
        report.append(run_process(['node','--check',str(path)], root,15))
    bootstrap=(root/'mathreader.js').read_text(encoding='utf8')
    parts=re.findall(r"'((?:js/)[^']+\.js)'",bootstrap)
    if len(parts)!=10:
        report.append({'command':['assemble runtime'], 'status':'FAIL','output':'not exactly ten source modules'})
    else:
        with tempfile.TemporaryDirectory() as tmp:
            output=Path(tmp)/'assembled-runtime.mjs'
            output.write_text('\n'.join((root/part).read_text(encoding='utf8') for part in parts),encoding='utf8')
            report.append(run_process(['node','--check',str(output)],root,20))
    for path in sorted((root/'tests').glob('*.js')):
        report.append(run_process(['node',str(path)],root,120))
    for test in ('regression_runner_smoke.py','p0_acceptance_regression.py'):
        report.append(run_process([sys.executable,str(root/'tests'/test)],root,150))
    return report


def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parent.parent)
    ap.add_argument('--out-dir',type=Path,required=True)
    ap.add_argument('--manifest',type=Path,help='Optional original-PDF manifest with independently reviewed truth')
    ap.add_argument('--pdfjs-build',type=Path)
    ap.add_argument('--mathjax-js',type=Path)
    ap.add_argument('--formula-cases',type=Path)
    ap.add_argument('--allow-texify-network',action='store_true')
    ap.add_argument('--skip-browser-shell',action='store_true',help='Explicitly mark browser shell not run')
    ap.add_argument('--require-p0-full',action='store_true',help='Nonzero exit if browser+independent truth incomplete')
    args=ap.parse_args(argv)
    root=args.source_root.resolve()
    output=args.out_dir.resolve();output.mkdir(parents=True,exist_ok=True)
    source=all_source_gates(root)
    code='PASS' if source and all(v['status']=='PASS' for v in source) else 'FAIL'
    browser=None
    acceptance=None
    if not args.skip_browser_shell:
        shell_cmd=[sys.executable,str(root/'regression_tools/p0_browser.py'),'--source-root',str(root),
                   '--shell-only','--out-dir',str(output/'browser-shell')]
        if args.mathjax_js:shell_cmd+=['--mathjax-js',str(args.mathjax_js)]
        browser=run_process(shell_cmd,root,90)
    else:
        browser={'status':'BLOCKED','command':['browser shell explicitly skipped'],'output':'Not tested'}
    if args.manifest:
        cmd=[sys.executable,str(root/'regression_tools/p0_browser.py'),'--source-root',str(root),
             '--manifest',str(args.manifest),'--out-dir',str(output/'browser-documents')]
        if args.pdfjs_build:cmd+=['--pdfjs-build',str(args.pdfjs_build)]
        if args.mathjax_js:cmd+=['--mathjax-js',str(args.mathjax_js)]
        if args.formula_cases:cmd+=['--formula-cases',str(args.formula_cases)]
        if args.allow_texify_network:cmd+=['--allow-texify-network']
        browser_docs=run_process(cmd,root,900)
        compare_cmd=[sys.executable,str(root/'regression_tools/p0_ground_truth.py'),
                     '--manifest',str(args.manifest),'--capture-dir',str(output/'browser-documents'),
                     '--out-dir',str(output/'ground-truth')]
        comparison=run_process(compare_cmd,root,180)
        report=output/'ground-truth/p0_audit.json'
        if report.is_file():
            data=json.loads(report.read_text(encoding='utf8'))
            acceptance=data['acceptance']
        else: acceptance='INCOMPLETE'
    else:
        browser_docs=None;comparison=None;acceptance='INCOMPLETE'
    payload={
        'schema':1,'timestamp_utc':datetime.now(timezone.utc).isoformat(),
        'version':re.search(r"const VERSION = '(\d+)'",(root/'mathreader.js').read_text()).group(1),
        'application_source_changed_by_p0':False,
        'source_gates':{'status':code,'checks':len(source),'failed':[x for x in source if x['status']!='PASS']},
        'browser_shell':browser,
        'browser_documents':browser_docs,
        'ground_truth_comparison':comparison,
        'p0_full_document_acceptance':acceptance,
        'limitations':[
            'Passing unit/syntax/proxy tests cannot certify mathematical recognition accuracy.',
            'Real PDF.js/Texify browser acceptance requires the original PDF bytes and pinned browser dependencies.',
            'PASS requires independent exhaustive original-page ground truth plus matching real browser evidence.'
        ]
    }
    (output/'p0_gate.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    summary={'source_gates':code,'count':len(source), 'browser_shell':browser['status'],
             'p0_full_document_acceptance':acceptance, 'report':str(output/'p0_gate.json')}
    print(json.dumps(summary,indent=2))
    if code!='PASS' or browser['status']!='PASS':return 1
    if args.require_p0_full and acceptance!='PASS':return 2
    return 0

if __name__=='__main__':raise SystemExit(main())
