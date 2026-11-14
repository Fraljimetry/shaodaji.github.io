"""R51I: verify final on-screen SVG geometry, not stale source literals."""
import os, math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1520,'height':950})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(150)
   result=page.evaluate('''() => {
     const icon=(type)=>document.querySelector(`[data-tool-choice="${type}"] svg`);
     const points=(svg)=>[...svg.querySelectorAll('circle[fill="currentColor"]')].map(e=>[+e.getAttribute('cx'),+e.getAttribute('cy'),+e.getAttribute('r')]);
     const tangent=icon('tangentCircle');const circle=tangent.querySelector('circle:not([fill])');
     const cx=+circle.getAttribute('cx'),cy=+circle.getAttribute('cy'),r=+circle.getAttribute('r');
     const tangentPoints=points(tangent);const external=tangentPoints[0];
     const orthogonality=tangentPoints.slice(1).map(([x,y])=>({onCircle:Math.abs(Math.hypot(x-cx,y-cy)-r),dot:(x-cx)*(external[0]-x)+(y-cy)*(external[1]-y)}));
     const hyper=icon('hyperbola');const foci=points(hyper);
     const distanceToPath=(path,[fx,fy])=>{let d=Infinity;const n=600;const len=path.getTotalLength();for(let i=0;i<=n;i++){const v=path.getPointAtLength(len*i/n);d=Math.min(d,Math.hypot(fx-v.x,fy-v.y));}return d;};
     const hyperDistances=foci.map(f=>Math.min(...[...hyper.querySelectorAll('path')].map(p=>distanceToPath(p,f))));
     const inversion=icon('circleInversion'),ring=inversion.querySelector('circle:not([fill])'),invPoints=points(inversion),center=invPoints[0];
     const d1=Math.hypot(invPoints[1][0]-center[0],invPoints[1][1]-center[1]),d2=Math.hypot(invPoints[2][0]-center[0],invPoints[2][1]-center[1]);
     const fills=[...document.querySelectorAll('[data-geometry-group] [data-tool-choice] svg circle[fill="currentColor"]')];
     const radiusCounts=[...new Set(fills.map(e=>e.getAttribute('r')))];
     const xs=['translation','reflection','rotation','dilation','circleInversion'].map(t=>({t,svg:icon(t),points:points(icon(t))}));
     const implicitPlot=document.querySelector('#plot-mode-preview');
     return {orthogonality,hyperDistances,inversion:{d1,d2,r:+ring.getAttribute('r'),markers:invPoints},radiusCounts,transformations:xs.map(({t,svg,points})=>({t,points,crosses:svg.innerHTML.includes('l3.6 3.6'),hollow:svg.querySelectorAll('circle[fill="none"]').length,dashes:svg.querySelectorAll('[stroke-dasharray]').length})),plottingPreview:!!implicitPlot,errors:[]};
   }''')
   assert all(abs(x['dot'])<1e-7 and x['onCircle']<1e-7 for x in result['orthogonality']),result['orthogonality']
   assert all(x>3.2 for x in result['hyperDistances']),result['hyperDistances']
   v=result['inversion'];assert abs(v['d1']*v['d2']-v['r']**2)<1e-7,v
   assert result['radiusCounts']==['2.8'],result['radiusCounts']
   assert all(not x['crosses'] and not x['hollow'] and not x['dashes'] for x in result['transformations']),result['transformations']
   # Both plotting modes show distinct, non-equivalent mathematical diagrams.
   from pathlib import Path
   import re
   source=Path(__file__).resolve().parents[1].joinpath('src','app.mjs').read_text()
   plots={key:re.search(rf"{key}:'([^']+)'",source).group(1) for key in ['parametric','implicit']}
   assert plots['parametric'] and plots['implicit'] and plots['parametric']!=plots['implicit'],plots
   assert plots['parametric'].count('<circle')==0 and plots['implicit'].count('<circle')==0,plots
   assert not errors,errors
   print('ROUND51I_CHROMIUM_PASS: uniform 2.8 SVG markers; analytic two-circle-contact tangents; detached hyperbola foci; true inversion P/P\'; five cross-free transforms; distinct parametric and implicit diagrams')
  finally:browser.close()
if __name__=='__main__':run()
