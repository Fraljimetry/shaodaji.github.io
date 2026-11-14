"""Round 23 actual browser interaction gate; launched in isolated Chromium (no localhost HTTP)."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download,ROOT


def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':850},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   html=inline_html(legacy_search_expanded=False)
   shim="""<script>(function(){const storage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()}})})();</script>"""
   page.set_content(html.replace('<head>', '<head>'+shim,1),wait_until='load')
   assert page.locator('#geometry-essential').count()==0
   assert page.locator('[data-tool-choice="midpoint"]').is_visible()
   assert page.locator('[data-tool-choice="freehand"]').locator('xpath=ancestor::section[@data-geometry-group]').get_attribute('data-geometry-group')=='curves'
   assert page.locator('[data-tool-choice="text"]').locator('xpath=ancestor::div[@id="diagram-tools"]').count()==1
   assert page.locator('#illustration-tools').count()==0
   original=json.loads(download(page,'Save').read_text())
   assert page.locator('[data-tool-choice="midpoint"]').is_visible()
   assert page.locator('[data-tool-choice="closedSpline"]').is_visible()
   assert original==json.loads(download(page,'Save').read_text())
   page.locator('#auto-pan').uncheck()
   box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   P=[(cx-160,cy+80),(cx-20,cy+80),(cx-90,cy-70),(cx+110,cy-80)]
   def construct(tool,ids):
    page.locator(f'[data-tool-choice="{tool}"]').click()
    for i in ids:page.mouse.click(*P[i])
   construct('midpoint',[0,1]);construct('ray',[0,3]);construct('perpBisector',[0,1]);construct('circleDiameter',[0,1]);construct('circleThrough3',[0,1,2]);construct('triangle',[0,1,2]);construct('quadrilateral',[0,1,3,2])
   construct('spline',[0,1,2,3]);page.keyboard.press('Enter')
   construct('closedSpline',[0,2,1,3]);page.keyboard.press('Enter')
   saved=json.loads(download(page,'Save').read_text())
   by_type=lambda t:[o for o in saved['objects'] if o['type']==t]
   assert len(by_type('midpoint'))==2,saved['objects']
   assert len(by_type('ray'))==1 and len(by_type('perpBisector'))==1,saved['objects']
   assert len(by_type('circle'))==1 and len(by_type('circleThrough3'))==1,saved['objects']
   assert len(by_type('polygon'))==2,saved['objects']
   assert sorted(len(o['refs']) for o in by_type('polygon'))==[3,4]
   assert len(by_type('spline'))==2 and sorted(o.get('closed',False) for o in by_type('spline'))==[False,True]
   assert page.locator('#drawing [data-id="'+by_type('ray')[0]['id']+'"] path').count()==0 # ray renders a line
   assert page.locator('#drawing [data-id="'+by_type('ray')[0]['id']+'"] ').count()>0
   assert page.locator('#drawing [data-id="'+by_type('circleThrough3')[0]['id']+'"] ').count()>0
   assert page.locator('#drawing path[data-id="'+by_type('spline')[0]['id']+'"]').count()>=1
   assert page.locator('#drawing path[data-id="'+by_type('spline')[1]['id']+'"]').first.get_attribute('d').endswith(' Z')
   # One-step undo/redo of an entire closed spline, including any new anchors.
   page.locator('#undo').click()
   before=json.loads(download(page,'Save').read_text())
   assert len([o for o in before['objects'] if o['type']=='spline'])==1
   page.locator('#redo').click()
   assert json.loads(download(page,'Save').read_text())==saved
   assert page.locator('[data-tool-choice="perpBisector"]').is_visible()
   assert page.locator('#drawing [data-id="'+by_type('perpBisector')[0]['id']+'"] ').count()>0
   assert json.loads(download(page,'Save').read_text())==saved
   page.locator('#export-open').click()
   assert page.get_by_role('button',name='TikZ / PGF').is_disabled()
   svg=download(page,'SVG').read_text()
   assert 'data-id="'+by_type('circleThrough3')[0]['id']+'"' in svg
   assert 'data-id="'+by_type('spline')[0]['id']+'"' in svg
   assert 'data-id="'+by_type('ray')[0]['id']+'"' in svg
   # A failed 3-point circle never appends phantom anchors or adds history.
   construct('circleThrough3',[0,1,0]);assert page.locator('#toast').is_visible()
   assert json.loads(download(page,'Save').read_text())==saved
   for lang in ('zh','en'):
    page.locator('#ui-language').select_option(lang)
    assert page.locator('[data-tool-choice="midpoint"]').is_visible()
   page.set_viewport_size({'width':390,'height':780});page.locator('#right-collapse').click()
   assert page.locator('#geometry-essential').count()==0
   assert page.locator('[data-tool-choice="closedSpline"]').count()==1
   assert not errors,errors
   guide=browser.new_page(viewport={'width':430,'height':850});guide.set_content((ROOT/'tutorial.html').read_text(),wait_until='load')
   css=guide.locator('#en-guide p').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
   assert css>=16,css
   assert guide.locator('#en-guide .guide-points li').count()>=40
   guide.evaluate('language("zh")')
   assert guide.locator('#zh-guide .guide-points li').count()>=20
   assert not guide.locator('#zh-guide').is_hidden()
   guide.close();page.close()
   print('ROUND23_GEOMETRY_CHROMIUM_PASS: 9 tool additions, 2 splines, always-full Geometry, persisted JSON, undo/redo, failed constructions, export, EN/ZH, 390px, tutorial font/bullets')
  finally:browser.close()

if __name__=='__main__':run()
