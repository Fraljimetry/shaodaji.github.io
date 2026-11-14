"""Round 33: two consented icons, style fidelity, property size, semicircle and polygon dependency edits."""
import json, os, re
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download
from browser_round29_diagram import project as diagram_project

def stored(page): return json.loads(download(page,'Save').read_text())
def import_project(page,data):
 page.locator('#open-file').set_input_files({'name':'scene.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
 page.wait_for_timeout(100)

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':850},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   page.locator('[data-tool-choice="regularPolygon"]').wait_for(state='attached')
   sections=page.locator('#panel-sections > .toolgroup').evaluate_all('es=>es.map(e=>e.dataset.toolModule)')
   assert sections.index('diagram')<sections.index('construction'),sections
   polygon_svg=page.locator('[data-tool-choice="regularPolygon"] svg').inner_html()
   assert 'stroke-dasharray' not in polygon_svg,polygon_svg
   spline_svg=page.locator('[data-tool-choice="closedSpline"] svg').inner_html()
   assert spline_svg.count('C')>=2,spline_svg
   assert page.locator('#default-stroke').input_value()=='#000000'
   assert page.locator('#default-fill').input_value()=='#000000'
   cmd(page,'A=(0,0)');cmd(page,'B=(3,0)');cmd(page,'RegularPolygon(A,B,5)')
   first=stored(page);polygon=next(o for o in first['objects'] if o['type']=='regularPolygon')
   sides=lambda d:[o for o in d['objects'] if o.get('edgeOf')==polygon['id']]
   assert len(sides(first))==5 and all(o['style']['stroke']=='#000000' for o in first['objects'])
   # No purple recoloring: selection relies on outside shadow, not replacing stroke/fill.
   page.locator(f'#objects [data-id="{polygon["id"]}"]').click()
   selected=page.locator(f'#drawing [data-id="{polygon["id"]}"].selected-shape').first
   assert selected.get_attribute('stroke')=='#000000',selected.evaluate('e=>e.outerHTML.slice(0,240)')
   size=page.get_by_label('Number of sides')
   size.fill('7');size.press('Tab');page.wait_for_timeout(120)
   larger=stored(page);assert len(sides(larger))==7
   assert [o['id'] for o in sides(larger)[:5]]==[o['id'] for o in sides(first)]
   # Undo restores the exact old hierarchy, redo reconstructs the same derived IDs.
   page.locator('#undo').click();assert len(sides(stored(page)))==5
   page.locator('#redo').click();assert [o['id'] for o in sides(stored(page))]==[o['id'] for o in sides(larger)]
   page.locator(f'#objects [data-id="{polygon["id"]}"]').click()
   size=page.get_by_label('Number of sides');size.fill('4');size.press('Tab');page.wait_for_timeout(120)
   assert len(sides(stored(page)))==4
   # Hiding the owner must hide all owned side strokes without deleting them;
   # un-hiding must recover identical side identities and style.
   snapshot=stored(page);idlist=[e['id'] for e in sides(snapshot)]
   hidden=json.loads(json.dumps(snapshot));next(x for x in hidden['objects'] if x['id']==polygon['id'])['hidden']=True
   import_project(page,hidden)
   assert all(page.locator(f'#drawing [data-id="{sid}"]').count()==0 for sid in idlist)
   assert [e['id'] for e in sides(stored(page))]==idlist
   page.locator('#show-hidden').uncheck()
   assert all(page.locator(f'#objects .object[data-id="{sid}"]').count()==0 for sid in idlist)
   page.locator('#show-hidden').check()
   import_project(page,snapshot)
   assert all(page.locator(f'#drawing [data-id="{sid}"]').count()>0 for sid in idlist)
   # Morphism: true semicircle, both sides, persistent authored color and compact Node border.
   data=diagram_project();data['objects'][2].update(arrowStyle='hook',swap=False)
   import_project(page,data)
   page.locator('[data-tool-choice="select"]').click()
   page.locator('#objects [data-id="o1"]').click()
   check=page.locator('#properties label.compact-property-check')
   assert check.count()==1,(page.locator('#properties').inner_text())
   measure=check.evaluate('e=>{const a=e.getBoundingClientRect(),c=e.querySelector("input").getBoundingClientRect();return {size:parseFloat(getComputedStyle(e).fontSize),check:c.width,height:c.height}}')
   assert measure['size']<=12.1 and measure['check']<=13 and measure['height']<=13,measure
   page.locator('#objects [data-id="o3"]').click()
   path=page.locator('#drawing g[data-id="o3"] path').first
   assert path.get_attribute('stroke')=='#3657ad','selection must preserve existing blue'
   hook=page.locator('#drawing .morphism-tail-hook');top=hook.get_attribute('d')
   assert top.count(' A')==1 and ' 0 0 0 ' in top,top
   swap=page.get_by_label('Swap label side');swap.check()
   bottom=page.locator('#drawing .morphism-tail-hook').get_attribute('d')
   assert bottom.count(' A')==1 and ' 0 0 1 ' in bottom and top!=bottom,(top,bottom)
   assert path.get_attribute('stroke')=='#3657ad'
   # Legacy object colors must survive JSON export/import; new defaults do not migrate saves.
   old=stored(page);import_project(page,old)
   assert stored(page)['objects']==old['objects']
   page.locator('#undo').click();page.locator('#redo').click() # history controls remain safe after import
   page.locator('#ui-language').select_option('zh')
   page.locator('#objects [data-id="o1"]').click()
   assert '节点边框' in page.locator('#properties label.compact-property-check').inner_text()
   page.set_viewport_size({'width':390,'height':780});assert page.locator('#drawing').is_visible()
   assert not errors,errors
   print('ROUND33_CHROMIUM_PASS: selected original colors, 2 consented icons, default diagram order/black, compact Node border, semicircular hook mirroring, polygon resizing+undo/redo, JSON/EN-ZH/mobile')
  finally:browser.close()

if __name__=='__main__':run()
