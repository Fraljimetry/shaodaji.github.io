"""Round 286: real Chromium stress of imported Round 285 geometry atlas.
Tests real UI actions and state/export checks. Independent of hosted service.
"""
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

FIXTURE=Path(__file__).parent/'fixtures/mathillustrator_advanced_geometry_atlas.json'

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--enable-precise-memory-info'])
  try:
   page=browser.new_page(viewport={'width':1600,'height':960},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_default_timeout(12000)
   t0=time.perf_counter()
   page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   atlas=json.loads(FIXTURE.read_text())
   def load(obj):
    page.locator('#open-file').set_input_files({'name':'atlas286.json','mimeType':'application/json','buffer':json.dumps(obj).encode()})
    page.wait_for_function('(n)=>JSON.parse(window.__round36Snapshot()).objects.length === n',arg=len(obj['objects']))
   load(atlas);page.locator('#fit').click()
   assert len(state()['objects'])==136
   print('IMPORT_SECONDS',round(time.perf_counter()-t0,2))
   # Find an unobstructed editable marker in the full atlas. Some points
   # intentionally coincide with circle-intersection points, so do not assume
   # clicking the center of A always selects A.
   candidates=page.evaluate("""() => {
     const doc=JSON.parse(window.__round36Snapshot());
     const objects=new Map(doc.objects.map(o=>[o.id,o]));
     return [...document.querySelectorAll('#drawing circle[data-id]')].flatMap(node=>{
       const obj=objects.get(node.dataset.id);
       if(!obj || obj.type!=='point' || obj.locked || obj.xyExpr)return [];
       const r=node.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
       const hit=document.elementFromPoint(x,y)?.closest?.('[data-id]')?.dataset?.id;
       return hit===obj.id ? [{id:obj.id,x,y}] : [];
     });
   }""")
   print('UNOBSTRUCTED_POINTS',len(candidates))
   assert candidates, 'No unobstructed draggable atlas point available'
   pick=candidates[0];anchor=next(o for o in state()['objects'] if o['id']==pick['id']);baseline_xy=anchor['xy'][:]
   page.mouse.move(pick['x'],pick['y']);page.mouse.down()
   page.mouse.move(pick['x']+35,pick['y']-18,steps=6);page.mouse.up()
   dragged=next(o for o in state()['objects'] if o['id']==pick['id'])['xy']
   assert dragged!=baseline_xy,('unobstructed marker was not draggable',pick,baseline_xy)
   page.locator('#undo').click()
   assert next(o for o in state()['objects'] if o['id']==pick['id'])['xy']==baseline_xy
   page.locator('#object-input-toggle').click()
   def find_row(ident):
    # Current list is virtualized; search first, then jump to the relevant end.
    name=next(o['name'] for o in state()['objects'] if o['id']==ident)
    page.locator('#object-search').fill(name)
    page.evaluate("() => {const e=document.querySelector('#objects');e.scrollTop=e.scrollHeight;e.dispatchEvent(new Event('scroll'));}")
    page.wait_for_timeout(120)
    row=page.locator(f'#objects .object[data-id="{ident}"]')
    assert row.count()==1,(ident,name,page.locator('#objects .object').evaluate_all('(es)=>es.map(e=>e.dataset.id)'))
    return row
   find_row('o1').click()
   assert page.locator('#properties .field input').first.input_value()=='A'
   # Moving a defining point through its Properties numeric editors must
   # update all dependent geometry even where the point overlaps other anchors.
   before=page.locator('#drawing [data-id="o4"]').first.get_attribute('points')
   original=state()['objects'][0]['xy'][:]
   fields=page.locator('#properties .field').evaluate_all('(els)=>els.map(e=>[e.dataset.propertyLabel,e.querySelector("input")?.value])')
   assert any(label=='Expression' for label,_ in fields)
   xyfield=page.locator('#properties .field[data-property-label="Expression"] input').first
   assert xyfield.count()==1
   xyfield.fill(f'({original[0]+0.65}, {original[1]})');xyfield.dispatch_event('change')
   moved=state()['objects'][0]['xy'];print('PROPERTY_MOVE',original,moved)
   assert moved!=original
   after=page.locator('#drawing [data-id="o4"]').first.get_attribute('points')
   assert before!=after,('dependent polygon was not re-rendered',before,after)
   page.locator('#undo').click();assert state()['objects'][0]['xy']==original
   page.locator('#redo').click();assert state()['objects'][0]['xy']==moved
   # Lock prevents modifying point and protects dependent deletion.
   def menu(action,ident='o1'):
    objrow=find_row(ident)
    objrow.locator('.object-menu-toggle').click()
    target=page.locator(f'#object-action-menu [data-action="{action}"]')
    assert target.count()==1
    return target
   menu('lock').click();assert state()['objects'][0]['locked'] is True
   assert menu('delete').is_disabled();page.keyboard.press('Escape')
   # Lock remains effective against edits through Properties.
   find_row('o1').click()
   assert page.locator('#properties .field input').first.input_value()=='A'
   assert page.locator('#properties .field[data-property-label="Expression"] input').count()==0 or page.locator('#properties .field[data-property-label="Expression"] input').first.is_disabled()
   menu('lock').click();assert state()['objects'][0]['locked'] is False
   # Deletion of dependent-free text, undo and restore via Recently Deleted.
   end=next(o for o in state()['objects'] if o['id']=='o132')
   menu('delete','o132').click()
   assert not any(o['id']=='o132' for o in state()['objects'])
   page.locator('#undo').click();assert any(o['id']=='o132' for o in state()['objects'])
   page.locator('#redo').click();assert not any(o['id']=='o132' for o in state()['objects'])
   page.locator('#recently-deleted summary').click()
   page.locator('#trash-items button').filter(has_text='Restore').first.click()
   assert next(o for o in state()['objects'] if o['id']=='o132')==end
   # Zoom / pan interaction, no mutating document.
   ids=[o['id'] for o in state()['objects']]
   page.locator('#zoom-in').click();page.locator('#zoom-out').click()
   svg=page.locator('#drawing');rect=svg.bounding_box()
   page.mouse.move(rect['x']+rect['width']*.55,rect['y']+rect['height']*.55)
   page.mouse.wheel(0,-130);page.mouse.wheel(0,130)
   page.locator('#fit').click()
   assert [o['id'] for o in state()['objects']]==ids
   # Rename and save/reopen preserving IDs and references.
   page.locator('#object-search').fill('A');find_row('o1').click()
   name=page.locator('#properties .field input').first
   name.fill('A286');name.dispatch_event('change')
   assert state()['objects'][0]['name']=='A286'
   with page.expect_download(timeout=45000) as d:page.locator('#save').click()
   saved=json.loads(d.value.path().read_text())
   assert [o['id'] for o in saved['objects']]==ids
   assert all(a.get('refs')==b.get('refs') for a,b in zip(saved['objects'],state()['objects']))
   load(saved);assert state()['objects'][0]['name']=='A286'
   # Bounded high-frequency slider and theme redraw stress; layout and DOM remain finite.
   page.locator('#object-search').fill('')
   toggle=page.locator('#objects [data-slider="t"] .slider-play-toggle');toggle.click()
   samples=[]
   heap_initial=page.evaluate('()=>performance.memory?.usedJSHeapSize ?? null')
   for i in range(120):
    page.evaluate('(theme)=>document.documentElement.dataset.theme=theme','dark' if i%2 else 'light')
    if i%5==0:page.locator('#fit').click()
    page.wait_for_timeout(25)
    samples.append((state()['algebra']['sliders'][0]['value'],page.locator('#drawing [data-id]').count()))
   toggle.click()
   heap_final=page.evaluate('()=>performance.memory?.usedJSHeapSize ?? null')
   assert len(set(round(s[0],3) for s in samples))>1
   assert all(120<=n<=500 for _,n in samples),samples
   # SVG semantic presence and raster decode (not claimed pixel-perfect).
   for fmt in ('SVG','PNG'):
    page.locator('#export-open').click()
    with page.expect_download(timeout=45000) as d:page.locator('#export-options button').filter(has_text=fmt).click()
    blob=d.value.path().read_bytes()
    if fmt=='SVG':
     assert all(f'data-id="{ident}"'.encode() in blob for ident in ids)
    else:
     from PIL import Image
     from io import BytesIO
     picture=Image.open(BytesIO(blob));picture.load();assert picture.width>500 and picture.height>300
   assert not errors,errors
   print('ROUND286_ATLAS_INTERACTIONS_PASS',{'samples':len(samples),'max_svg_nodes':max(n for _,n in samples),'seconds':round(time.perf_counter()-t0,2),'errors':len(errors),'heap_before_bytes':heap_initial,'heap_after_bytes':heap_final})
  finally:browser.close()
if __name__=='__main__':main()
