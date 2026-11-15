"""Real Chromium glyph rendering and visual geometry checks, Round 131."""
import os, math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1500,'height':950}); errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(), wait_until='load')
   for name in ['regularPolygon','polygon','circleInversion','ellipse','rotation','bezier','circle','circleDiameter','circleThrough3','tangentCircle']:
    assert page.locator(f'[data-tool-choice="{name}"] svg').count()==1, name
   details=page.evaluate('''() => Object.fromEntries(['regularPolygon','polygon','circleInversion','ellipse','rotation','bezier','circle','circleDiameter','circleThrough3','tangentCircle'].map(name=>{
    const svg=document.querySelector(`[data-tool-choice="${name}"] svg`);
    return [name,{markup:svg.innerHTML,box:({width:svg.querySelector('path,ellipse,circle').getBBox().width}),dotCount:svg.querySelectorAll('circle[fill="currentColor"]').length}]
   }))''')
   assert details['bezier']['markup'].count('stroke-dasharray')==0
   assert details['bezier']['dotCount']==4
   assert details['regularPolygon']['box']['width']>=19 and details['polygon']['box']['width']>=19
   assert details['circle']['markup'].find('r="8"')>=0
   assert details['circleThrough3']['markup'].find('r="8"')>=0
   assert details['circleDiameter']['markup'].find('r="8"')>=0
   assert details['circleInversion']['markup'].find('r="8"')>=0
   assert details['ellipse']['markup'].find('ry="7.2"')>=0
   assert details['rotation']['dotCount']==3
   assert not errors, errors
   print('PASS real Chromium Round131: glyph sizing, geometry, control-point counts, circle consistency, no page errors')
  finally:browser.close()
if __name__=='__main__':run()
