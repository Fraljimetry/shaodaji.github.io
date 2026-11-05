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
        explicitly_incomplete = result.returncode == 2 and any(str(x).endswith(('p0_browser.py','p0_ground_truth.py','p1_browser_e2e.py')) for x in command)
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
    for test in ('regression_runner_smoke.py','p0_acceptance_regression.py',
                 'p0_gate_isolation_regression.py','p1_browser_smoke.py',
                 'p1_real_gate_regression.py','p0_p1_gap_closure_regression.py',
                 'ui_responsive_regression.py','help_tutorial_regression.py'):
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
    ap.add_argument('--p1-source-pdf',type=Path,help='Original source PDF containing a numbered bibliography')
    ap.add_argument('--p1-target-pdf',type=Path,help='Distinct original PDF linked by P1')
    ap.add_argument('--require-p1-real',action='store_true',help='Nonzero exit unless genuine two-PDF P1 Chromium check passes')
    ap.add_argument('--require-p0-full',action='store_true',help='Nonzero exit if browser+independent truth incomplete')
    args=ap.parse_args(argv)
    if bool(args.p1_source_pdf) != bool(args.p1_target_pdf):
        ap.error('Specify both --p1-source-pdf and --p1-target-pdf')
    if args.require_p1_real and not args.p1_source_pdf:
        ap.error('Real P1 is required, but no two-PDF source/target pair was provided')
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
        capture_dir=output/'browser-documents'
        # Never accept old captures after a newer browser run is blocked/failed.
        if capture_dir.exists(): shutil.rmtree(capture_dir)
        capture_dir.mkdir(parents=True,exist_ok=True)
        truth_dir=output/'ground-truth'
        if truth_dir.exists(): shutil.rmtree(truth_dir)
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
        # The output directory was cleared before this run. Evaluate genuine
        # *fresh* captures even if the browser process reported incomplete:
        # errors in actual PDF.js captures are FAIL, not merely UNVERIFIED.
        fresh_captures=any(re.fullmatch(r'[a-f0-9]{64}\.json', path.name) for path in capture_dir.glob('*.json'))
        if fresh_captures:
            comparison=run_process(compare_cmd,root,180)
            report=truth_dir/'p0_audit.json'
            observed=json.loads(report.read_text(encoding='utf8')).get('acceptance','INCOMPLETE') if comparison['status'] in ('PASS','INCOMPLETE') and report.is_file() else 'INCOMPLETE'
            # Never promote incomplete/failed browser execution to full PASS.
            acceptance='INCOMPLETE' if observed=='PASS' and browser_docs['status']!='PASS' else observed
        else:
            comparison={'status':'BLOCKED','command':compare_cmd,
                        'output':'No fresh browser captures; previous results were removed.'}
            acceptance='INCOMPLETE'
    else:
        browser_docs=None;comparison=None;acceptance='INCOMPLETE'
    p1_real=None
    if args.p1_source_pdf:
        p1_dir=output/'p1-real-browser'
        if p1_dir.exists(): shutil.rmtree(p1_dir)
        command=[sys.executable,str(root/'regression_tools/p1_browser_e2e.py'),
                 '--source-root',str(root),
                 '--source-pdf',str(args.p1_source_pdf.resolve()),
                 '--target-pdf',str(args.p1_target_pdf.resolve()),
                 '--out-dir',str(p1_dir)]
        if args.pdfjs_build:command+=['--pdfjs-build',str(args.pdfjs_build)]
        if args.mathjax_js:command+=['--mathjax-js',str(args.mathjax_js)]
        p1_real=run_process(command,root,900)
        # Preserve the real harness's explicit BLOCKED/UNVERIFIED/FAIL
        # classification rather than collapsing its nonzero exit to INCOMPLETE.
        # This is test evidence, not an authorization to mark P1 as PASS.
        detail_path=p1_dir/'p1_browser_e2e.json'
        if detail_path.is_file():
            try:
                detail=json.loads(detail_path.read_text(encoding='utf8'))
                if detail.get('status') in ('PASS','FAIL','BLOCKED','UNVERIFIED'):
                    p1_real['detail_status']=detail['status']
            except (ValueError, OSError):
                p1_real['detail_status']='UNVERIFIED'
    payload={
        'schema':1,'timestamp_utc':datetime.now(timezone.utc).isoformat(),
        'version':re.search(r"const VERSION = '(\d+)'",(root/'mathreader.js').read_text()).group(1),
        'application_source_changed_by_p0':False,
        'source_gates':{'status':code,'checks':len(source),'failed':[x for x in source if x['status']!='PASS']},
        'browser_shell':browser,
        'browser_documents':browser_docs,
        'ground_truth_comparison':comparison,
        'p0_full_document_acceptance':acceptance,
        'p1_real_document_navigation':p1_real,
        'limitations':[
            'Passing unit/syntax/proxy tests cannot certify mathematical recognition accuracy.',
            'Real PDF.js/Texify browser acceptance requires the original PDF bytes and pinned browser dependencies.',
            'PASS requires independent exhaustive original-page ground truth plus matching real browser evidence.'
        ]
    }
    (output/'p0_gate.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    summary={'source_gates':code,'count':len(source), 'browser_shell':browser['status'],
             'p0_full_document_acceptance':acceptance,
             'p1_real_document_navigation':(p1_real.get('detail_status',p1_real['status']) if p1_real else 'NOT_REQUESTED'),
             'report':str(output/'p0_gate.json')}
    print(json.dumps(summary,indent=2))
    if code!='PASS' or browser['status']!='PASS' or acceptance=='FAIL' or (p1_real and p1_real['status']=='FAIL'):return 1
    if args.require_p0_full and acceptance!='PASS':return 2
    if args.require_p1_real and (not p1_real or p1_real['status']!='PASS'):return 2
    return 0

if __name__=='__main__':raise SystemExit(main())
