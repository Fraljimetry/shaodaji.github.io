"""Attempt actual WebGL2 shader readback; report INCOMPLETE (not PASS) if unavailable."""
import base64, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
def url(source):return 'data:text/javascript;base64,'+base64.b64encode(source.encode()).decode()
def run():
    parser=url((ROOT/'src/plot_modes.mjs').read_text())
    expression=url((ROOT/'src/gpu_expression3d.mjs').read_text().replace("./plot_modes.mjs?cut=round54",parser))
    probe=url((ROOT/'src/gpu_sampling_probe3d.mjs').read_text().replace('./gpu_expression3d.mjs?cut=round119',expression))
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
        try:
            page=b.new_page();page.set_content('<!doctype html><html><body></body></html>')
            result=page.evaluate('''async (moduleURL)=>{
                const m=await import(moduleURL);
                const canvas=document.createElement('canvas');
                const points=[];
                for(let i=0;i<64;i++)points.push([(i%13-6)/7,(i%11-5)/8,(i%7-3)/5]);
                const expressions=['x^2+y^2+z^2=1','2x(y+z)=0','(x-y)^3+z=0','Pi+E*z=0'];
                const reports=[];
                for(const expression of expressions){
                    const gpu=m.evaluateRestrictedGPUProbe(canvas,expression,points);
                    if(gpu.status!=='PASS')return {status:gpu.status,reason:gpu.reason,expressionsTested:reports.length};
                    const comparison=m.compareGPUProbeWithCPU(expression,points,gpu);
                    reports.push({expression,...comparison});
                    if(comparison.status!=='PASS')return {status:'FAIL',reports};
                }
                // A separate >256-point probe exercises chunking rather than a single draw.
                const batchPoints=Array.from({length:513},(_,i)=>[(i%17-8)/6,(i%19-9)/7,(i%23-11)/8]);
                const batch=m.evaluateRestrictedGPUBatch(canvas,'x^2+y^2+z^2=1',batchPoints);
                if(batch.status!=='PASS')return {status:batch.status,reason:batch.reason,reports};
                const batchComparison=m.compareGPUBatchWithCPU('x^2+y^2+z^2=1',batchPoints,batch);
                if(batchComparison.status!=='PASS')return {status:'FAIL',reason:'Batched numerical mismatch',batchComparison,reports};
                return {status:'PASS',backend:'WebGL2',reports,batchComparison,chunks:batch.chunks};
            }''',probe)
            print(json.dumps(result,indent=2))
            if result['status']=='PASS':return 0
            if result['status']=='UNAVAILABLE':return 2
            return 1
        finally:b.close()
if __name__=='__main__':raise SystemExit(run())
