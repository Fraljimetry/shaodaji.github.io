"""Real Chromium regression for automatic morphism label proximity."""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
src=(ROOT/'src/morphism_label_layout.mjs').read_bytes()
url='data:text/javascript;base64,'+base64.b64encode(src).decode()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page()
  page.goto('about:blank')
  result=page.evaluate('''async u=>{
   const {layoutMorphismLabels,strokeObstacleRectangles}=await import(u);
   const own=strokeObstacleRectangles([[30,110],[350,110]],5).map(r=>({...r,owner:'f'}));
   const a=layoutMorphismLabels([{id:'f',text:'f',x:190,y:100,auto:true,sideNormal:[0,-1]}],own,400,250).get('f');
   const b=layoutMorphismLabels([{id:'f',text:'f',x:190,y:100,auto:true,sideNormal:[0,-1]}],own.map(r=>({...r,owner:'g'})),400,250).get('f');
   const c=layoutMorphismLabels([{id:'f',text:'f',x:190,y:100,auto:true,sideNormal:[0,-1]}],[{left:115,right:285,top:90,bottom:115}],400,250).get('f');
   return {a,b,c};
  }''',url)
  assert abs(result['a']['dx'])<1e-9 and abs(result['a']['dy'])<1e-9,result
  assert result['b']['dy']!=0,result
  assert (result['c']['dx']**2+result['c']['dy']**2)**.5<=25,result
  print('PASS Chromium Round192 own-stroke, unrelated obstacles, compact placement')
 finally:browser.close()
