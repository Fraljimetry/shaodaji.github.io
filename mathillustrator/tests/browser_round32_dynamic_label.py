"""Round32: real Chromium side creation and overlapping morphism label interactions."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download, cmd
from browser_round29_diagram import project as diagram_project
ROOT=Path(__file__).resolve().parents[1]

def stored(page):return json.loads(download(page,'Save').read_text())
def import_project(page,data):
 page.locator('#open-file').set_input_files({'name':'scene.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
 page.wait_for_timeout(110)

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':860},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   # Commands are actual editor mutations. One Undo must remove parent AND owned sides.
   for v in ('A=(0,0)','B=(4,3)','Rectangle(A,B)'):cmd(page,v)
   d=stored(page);parent=next(o for o in d['objects'] if o['type']=='rectangle')
   ed=[o for o in d['objects'] if o.get('edgeOf')==parent['id']]
   assert len(ed)==4 and [o['edgeIndex'] for o in ed]==list(range(4)),ed
   assert page.locator(f'#drawing g[data-id="{parent["id"]}"]').count()==0 # rectangle paints a rect
   assert page.locator('#drawing line.clickable').count()>=4
   page.locator('#undo').click();assert len(stored(page)['objects'])==2
   page.locator('#redo').click();assert len(stored(page)['objects'])==7
   # Stable derived edges under anchor movement; SVG exports contain separate strokes.
   d=stored(page);d['objects'][1]['xy']=[-2,5]
   import_project(page,d)
   saved=stored(page);assert [o['id'] for o in saved['objects'] if o.get('edgeOf')==parent['id']]==[o['id'] for o in ed]
   page.locator('#export-open').click();svg=download(page,'SVG').read_text()
   assert svg.count('<line')>=4
   page.locator('#label-placement').select_option('standard')  # Screen-space auto labels cannot be represented by restricted TikZ.
   page.locator('#export-open').click()
   assert not page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled(), 'derived sides should be representable with standard point labels'
   tikz=download(page,'TikZ / PGF').read_text()
   assert tikz.count('\\draw[')>=5, 'TikZ must include shape and four separately drawn sides'
   # Rejected import MUST retain the existing project, not partially accept invalid sides.
   broken=stored(page);next(o for o in broken['objects'] if o.get('edgeOf')==parent['id'])['edgeIndex']=101
   import_project(page,broken)
   assert stored(page)['objects']==saved['objects'],'invalid import must roll back'
   # Canvas creation: Regular polygon creates N side segments, not virtual-only lines.
   blank=diagram_project();blank['objects']=[];blank['nextId']=1
   import_project(page,blank)
   page.locator('#auto-pan').uncheck()
   page.locator('#geometry-essential').uncheck()
   page.locator('[data-tool-choice="regularPolygon"]').click()
   stage=page.locator('#drawing').bounding_box();cx=stage['x']+stage['width']/2;cy=stage['y']+stage['height']/2
   page.mouse.click(cx-36,cy+25);page.mouse.click(cx+90,cy+25)
   d=stored(page);poly=next(o for o in d['objects'] if o['type']=='regularPolygon')
   count=poly['sides'];assert len([o for o in d['objects'] if o.get('edgeOf')==poly['id']])==count
   page.locator('#undo').click();assert len(stored(page)['objects'])==0
   page.locator('#redo').click();assert len(stored(page)['objects'])==count+3
   # Later-painted node overlaps an earlier labelled morphism. Label glyph and
   # hit surface MUST BOTH be at top of scene, including after undo+deselect.
   d=diagram_project();d['objects'][2].update(labelAvoid=False,labelDx=0,labelDy=0)
   d['objects'].append(dict(id='o4',name='Cover',type='node',xy=[0,.34],text='C',textMode='latex',fontSize=17,hidden=False,locked=False,
                            style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}))
   d['nextId']=5
   import_project(page,d)
   page.locator('[data-tool-choice="select"]').click()
   def label_box():
    hit=page.locator('#drawing [data-label-handle="o3"]')
    hit.wait_for(state='visible',timeout=5000)
    b=hit.bounding_box();assert b and b['width']>7 and b['height']>7,b
    # This transparent editing surface is last, above later nodes and arrows.
    assert hit.evaluate('e=>e.parentNode===document.querySelector("#drawing") && e===e.parentNode.lastElementChild')
    return b
   b=label_box()
   assert page.locator('#drawing .morphism-label').count()==1
   assert page.locator('#drawing .morphism-label').first.evaluate('e=>e.parentNode===document.querySelector("#drawing")')
   for i in range(4):
    b=label_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2
    # The actual topmost DOM hit at the label midpoint is the arrow, not Cover.
    assert page.evaluate('([x,y])=>document.elementFromPoint(x,y).getAttribute("data-label-handle")',[x,y])=='o3'
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+14,y+6,steps=4);page.mouse.up()
    moved=stored(page)['objects'][2];assert abs(moved.get('labelDx',0)-14*(i+1))<2,moved
    page.locator('#undo').click();assert abs(stored(page)['objects'][2].get('labelDx',0)-14*i)<2
    page.locator('#redo').click();assert abs(stored(page)['objects'][2].get('labelDx',0)-14*(i+1))<2
    page.mouse.dblclick(stage['x']+25,stage['y']+120)
    assert page.locator('#drawing [data-label-handle="o3"]').count()==1
   # An interrupted drag cannot commit and must preserve history/JSON.
   b=label_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2
   before=stored(page);page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+20,y+18,steps=3)
   page.keyboard.press('Escape');page.mouse.up()
   assert stored(page)['objects']==before['objects'],'Escape did not cancel label drag'
   page.locator('#export-open').click();svg=download(page,'SVG').read_text()
   assert 'data-label-handle' not in svg and 'morphism-label-hit' not in svg
   assert 'morphism-label' in svg
   page.locator('#ui-language').select_option('zh')
   assert page.locator('#drawing [data-label-handle="o3"]').count()==1
   page.set_viewport_size({'width':390,'height':780})
   assert page.locator('#drawing').is_visible()
   assert not errors,errors
   print('ROUND32_CHROMIUM_PASS: rectangle+regular polygon derived sides, one-step history, JSON rollback, SVG, morphism label overlay under obstruction, repeated drag/deselect/undo/redo, Escape, ZH, 390px')
  finally:browser.close()

if __name__=='__main__':run()
