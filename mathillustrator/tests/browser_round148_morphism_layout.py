"""Actual Chromium morphism compact selector layout and enabled/disabled transitions."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]
style={'stroke':'#000000','fill':'#ffffff','width':1,'opacity':1}
doc=json.loads((ROOT/'examples/geometry-demo.json').read_text())
doc['objects']=[dict(id='o1',name='N1',type='node',xy=[-4,0],text='A',textMode='plain',style=style,hidden=False,locked=False),dict(id='o2',name='N2',type='node',xy=[4,0],text='B',textMode='plain',style=style,hidden=False,locked=False),dict(id='o3',name='Arrow3',type='morphism',refs=['o1','o2'],text='',textMode='plain',bend=0,routing='direct',style=style,hidden=False,locked=False)]
doc['nextId']=4
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,390,320):
   page=browser.new_page(viewport={'width':width,'height':850})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=45000)
   box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   if width<700:page.locator('#right-collapse').click()
   page.locator('[data-tool-choice="node"]').click()
   if width<700:page.locator('#right-collapse').click()
   page.once('dialog',lambda d:d.accept('A'));page.mouse.click(cx-50,cy)
   if width<700:page.locator('#right-collapse').click()
   page.locator('[data-tool-choice="node"]').click()
   if width<700:page.locator('#right-collapse').click()
   page.once('dialog',lambda d:d.accept('B'));page.mouse.click(cx+50,cy)
   if width<700:page.locator('#right-collapse').click()
   page.locator('[data-tool-choice="morphism"]').click()
   if width<700:page.locator('#right-collapse').click()
   page.mouse.click(cx-50,cy);page.once('dialog',lambda d:d.accept('f'));page.mouse.click(cx+50,cy)
   if width<700:page.locator('#left-collapse').click()
   state=json.loads(page.evaluate('window.__round36Snapshot()'))
   morph=next(x for x in state['objects'] if x['type']=='morphism')
   page.locator(f'#objects .object[data-id="{morph["id"]}"]').click()
   g=page.locator('#properties .compact-properties-grid')
   assert g.count()==1,(width,g.count())
   a=g.locator('select[aria-label="Line style"]');b=g.locator('select[aria-label="Arrowheads"]')
   assert a.count()==1 and b.count()==1
   assert a.evaluate('(e)=>e.getBoundingClientRect().width>=65') and b.evaluate('(e)=>e.getBoundingClientRect().width>=65')
   assert g.evaluate('(e)=>getComputedStyle(e).gridTemplateColumns.split(" ").length===2'),width
   a.select_option('double');assert b.is_disabled()
   a.select_option('solid');assert not b.is_disabled()
   b.select_option('none')
   assert not errors,(width,errors)
   print('PASS Chromium morphism style layout and interactions',width,flush=True)
   page.close()
 finally:browser.close()
