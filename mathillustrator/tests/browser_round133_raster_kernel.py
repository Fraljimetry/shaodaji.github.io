"""Chromium-backed pixel output and memory boundary check for production plotting kernel."""
import base64,os
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path(__file__).resolve().parents[1].joinpath('src/plot_modes.mjs').read_text()
url='data:text/javascript;base64,'+base64.b64encode(src.encode()).decode()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page();page.goto('about:blank')
  result=page.evaluate('''async url=>{
   const {sampleDomainColors,MAX_DOMAIN_PIXELS}=await import(url);
   const region={xMin:-1,xMax:1,yMin:-1,yMax:1};
   const r=sampleDomainColors((x,y)=>[x,y],region,{resolution:1024,maxEvaluations:MAX_DOMAIN_PIXELS});
   const canvas=document.createElement('canvas');canvas.width=r.width;canvas.height=r.height;
   const ctx=canvas.getContext('2d');const image=ctx.createImageData(r.width,r.height);image.data.set(r.rgba);ctx.putImageData(image,0,0);
   const png=canvas.toDataURL('image/png');
   return {width:r.width,height:r.height,limited:r.limited,evaluations:r.evaluations,firstAlpha:ctx.getImageData(0,0,1,1).data[3],pngSize:png.length};
  }''',url)
  assert result['width']==1024 and result['height']==1024 and not result['limited'] and result['firstAlpha']==255 and result['pngSize']>1000,result
  print('PASS Chromium 1024x1024 real Canvas PNG:',result)
 finally:browser.close()
