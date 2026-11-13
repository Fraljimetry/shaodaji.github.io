"""Exact baseline-scan oracle for the indexed multi-anchor batch path.
Tests 2,400 requests with exact, nearly snapped, barely unsnapped and tie positions.
"""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
PROBE='''
window.__cut12Batch=()=>{
 doc=newDoc();doc.settings.snapAnchors=true;anchorCache=null;anchorCacheKey='';documentRevision++;documentGeneration++;
 for(let i=0;i<800;i++)addPoint(doc,[(i%40)*.5,Math.floor(i/40)*.5],'P'+i);
 let seed=314159;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const pts=[];for(let i=0;i<2400;i++){
  const j=Math.floor(rand()*800),a=[(j%40)*.5,Math.floor(j/40)*.5],choice=i%6;
  pts.push(choice===0?a:choice===1?[a[0]+.01,a[1]+.01]:choice===2?[a[0]+.249,a[1]]:
           choice===3?[a[0]+.251,a[1]]:choice===4?[a[0]+.25,a[1]]:[a[0]+.2,a[1]-.1]);
 }
 const resolver=createResolver(doc),initial=doc.objects.map(o=>[o.id,resolver.at(o.id)]),tolerance=12/view.scale;
 let number=doc.nextId;
 const oracle=pts.map(pt=>{
  let best=null,d=tolerance;
  for(const [id,p] of initial){const v=Math.hypot(pt[0]-p[0],pt[1]-p[1]);if(v<d){best=id;d=v;}}
  return best||('o'+number++);
 });
 const got=makeRefs(pts);
 return {equal:JSON.stringify(got)===JSON.stringify(oracle),
         firstMismatch:got.findIndex((v,i)=>v!==oracle[i]),added:doc.objects.length-800,requests:got.length};
};
'''
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1300,'height':800})
 page.set_content(inline_html().replace('initialise();\n</script>','initialise();\n'+PROBE+'\n</script>'),wait_until='load')
 page.wait_for_function('typeof window.__cut12Batch==="function"')
 result=page.evaluate('window.__cut12Batch()')
 assert result['equal'],result
 print('CUT12_BATCH_PASS',result,'matches strict legacy world-distance scan oracle')
 b.close()
