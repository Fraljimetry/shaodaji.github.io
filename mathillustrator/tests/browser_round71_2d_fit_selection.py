"""Round 71 current-browser 2D regression: derived point picking, Fit, history, JSON, export."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  exe=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_default_timeout(20000)
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   for instruction in ('A=(0,0)','B=(2,1)'):
    page.locator('#command').fill(instruction)
    page.locator('#command-form button').click()
   baseline=state();assert len(baseline['objects'])==2,baseline['objects']
   a,b=baseline['objects']
   def copy(name,kind,refs,**more):
    obj={'id':f"o{baseline['nextId']}",'type':kind,'name':name,'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1},'refs':refs}
    obj.update(more)
    baseline['nextId']+=1;baseline['objects'].append(obj)
    return obj
   q=copy('Q','transformCopy',[b['id'],a['id']],transform='dilate',amount=5,pointLabelMode='latex')
   q['style']['pointSize']=5
   c=copy('C','circle',[a['id'],b['id']])
   image=copy('C image','transformCopy',[c['id'],a['id']],transform='dilate',amount=3)
   page.locator('#open-file').set_input_files({'name':'round71_fixture.json','mimeType':'application/json','buffer':json.dumps(baseline).encode()})
   page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length === 5')
   page.locator('#fit').click()
   marker=page.locator(f'#drawing circle[data-id="{q["id"]}"]')
   marker.wait_for(state='visible')
   cx,cy=marker.evaluate('(e)=>[Number(e.getAttribute("cx")),Number(e.getAttribute("cy"))]')
   svg=page.locator('#drawing')
   drawing_size=svg.evaluate('(e)=>({w:e.clientWidth,h:e.clientHeight})')
   assert 0 <= cx <= drawing_size['w'] and 0 <= cy <= drawing_size['h'],(cx,cy,drawing_size)
   circle=page.locator(f'#drawing circle[data-id="{image["id"]}"]')
   circle.wait_for(state='visible')
   rad=float(circle.get_attribute('r'))
   center_x=float(circle.get_attribute('cx'));center_y=float(circle.get_attribute('cy'))
   assert center_x-rad>=-2 and center_x+rad<=drawing_size['w']+2,(center_x,rad,drawing_size)
   assert center_y-rad>=-2 and center_y+rad<=drawing_size['h']+2,(center_y,rad,drawing_size)
   # Click on a sampled marker, not an Objects row. The spatial index must
   # recognize its semantic point role after the saved document was imported.
   svg.click(position={'x':cx,'y':cy},force=True)
   name=page.locator('#properties .field input').first
   assert name.input_value()=='Q',name.input_value()
   size_field=page.locator('#properties .field').filter(has_text='Point size').locator('input')
   assert size_field.count()==1
   size_field.fill('12');size_field.dispatch_event('change')
   assert state()['objects'][2]['style']['pointSize']==12
   page.locator('#undo').click()
   assert state()['objects'][2]['style']['pointSize']==5
   page.locator('#redo').click()
   assert state()['objects'][2]['style']['pointSize']==12
   # Both SVG and JSON downloads retain point type, geometry and user styling.
   page.locator('#export-open').click()
   with page.expect_download() as event:page.locator('#export-options button').filter(has_text='SVG').click()
   svg_text=event.value.path().read_text()
   assert f'data-id="{q["id"]}"' in svg_text
   with page.expect_download() as event:page.locator('#save').click()
   saved=json.loads(event.value.path().read_text())
   assert saved['objects'][2]['style']['pointSize']==12
   assert saved['objects'][4]['refs']==image['refs']
   assert not errors,errors
   print('PASS ROUND71_CHROMIUM: 2D transformed point picking, Fit transformed circle, undo/redo, SVG, JSON')
  finally:browser.close()

if __name__=='__main__':run()
