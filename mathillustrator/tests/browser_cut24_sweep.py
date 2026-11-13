"""Run isolated Chromium editor regressions in separate processes.
Avoid a long aggregate browser call masking which script finished. The real
multi-tab HTTPS test is excluded because this sandbox blocks that navigation.
"""
from pathlib import Path
import subprocess,sys,json,time
HERE=Path(__file__).parent
scripts=sorted(p for p in HERE.glob('browser_*.py')
 if not any(skip in p.stem for skip in ('performance','multitab','site_home','sweep')))
results=[]
for p in scripts:
 t=time.monotonic()
 try:
  run=subprocess.run([sys.executable,str(p)],cwd=str(HERE.parent),capture_output=True,text=True,timeout=90)
  result={'script':p.name,'exit':run.returncode,'seconds':round(time.monotonic()-t,2),'stdout_tail':run.stdout[-350:],'stderr_tail':run.stderr[-400:]}
 except subprocess.TimeoutExpired:
  result={'script':p.name,'exit':'TIMEOUT','seconds':round(time.monotonic()-t,2),'stdout_tail':'','stderr_tail':'90s per-script limit'}
 results.append(result)
 print(p.name, 'PASS' if result['exit']==0 else 'FAIL',result['seconds'],flush=True)
(Path(sys.argv[1]) if len(sys.argv)>1 else HERE/'cut24_browser_results.local.json').write_text(json.dumps({'scope':'isolated Chromium page.set_content only','results':results,'count':len(results),'passing':sum(x['exit']==0 for x in results)},indent=2))
if any(x['exit']!=0 for x in results):sys.exit(1)
print('CUT24_ISOLATED_CHROMIUM_SWEEP_PASS',len(results))
