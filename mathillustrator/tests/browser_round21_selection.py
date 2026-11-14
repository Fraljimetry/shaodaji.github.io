"""Round 21 real Chromium interactions: transient multi-select, marquee, atomic styles, undo, locale, mobile."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download


def get_doc(page):
 with page.expect_download(timeout=10000) as event:page.locator('#save').click()
 return json.loads(Path(event.value.path()).read_text())

def object_style(page,id,property):
 return next(o for o in get_doc(page)['objects'] if o['id']==id)['style'][property]

def selected(page):
 return set(page.locator('#objects .object.selected').evaluate_all('(els)=>els.map(x=>x.dataset.id)'))

def rect_for(page,id):
 return page.locator(f'#drawing .clickable[data-id="{id}"]').first.evaluate('e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}}')

def run():
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   p=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];p.on('pageerror',lambda e: errors.append(str(e)))
   p.set_default_timeout(8000)
   p.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   for expression in ('A=(0,0)','B=(2,1)','C=(3,2)','Rectangle(A,B)'):
    cmd(p,expression)
   initial=get_doc(p)
   assert len(initial['objects'])==4
   assert selected(p)=={'o4'},selected(p)
   # Explicit list Shift/Ctrl adds and toggles, including keyboard activation.
   p.locator('#objects .object[data-id="o1"]').click()
   p.locator('#objects .object[data-id="o2"]').click(modifiers=['Shift'])
   assert selected(p)=={'o1','o2'},selected(p)
   assert p.locator('#properties .bulk-heading').inner_text()=='2 selected'
   p.locator('#objects .object[data-id="o2"]').click(modifiers=['Control'])
   assert selected(p)=={'o1'}
   p.locator('#objects .object[data-id="o2"]').focus()
   p.keyboard.press('Control+Enter')
   assert selected(p)=={'o1','o2'}
   # Color/width changes share one undo entry each; JSON never has editor selection.
   before=get_doc(p)
   assert 'selection' not in before and 'selectedIds' not in before
   p.locator('#properties .style-stroke .color-swatch[data-color="#ef4444"]').click()
   after=get_doc(p)
   assert all(o['style']['stroke']=='#ef4444' for o in after['objects'][:2]);assert after['objects'][2:]==before['objects'][2:]
   p.locator('#undo').click();assert get_doc(p)==before
   p.locator('#redo').click();assert get_doc(p)==after
   assert selected(p)=={'o1','o2'}
   p.locator('#properties .style-width input').fill('4.5')
   p.locator('#properties .style-width input').press('Tab')
   assert all(o['style']['width']==4.5 for o in get_doc(p)['objects'][:2])
   # Mixed values must not collapse into the first object's value.
   p.locator('#objects .object[data-id="o2"]').click()
   p.locator('#properties .style-width input').fill('7')
   p.locator('#properties .style-width input').press('Tab')
   p.locator('#objects .object[data-id="o1"]').click(modifiers=['Shift'])
   assert p.locator('#properties .style-width input').get_attribute('placeholder')=='Mixed'
   mixed=get_doc(p)
   p.locator('#properties .style-width input').fill('6')
   p.locator('#properties .style-width input').press('Tab')
   assert all(o['style']['width']==6 for o in get_doc(p)['objects'][:2])
   p.locator('#undo').click();assert get_doc(p)==mixed
   # Unsupported fill does not create junk fields on points; only rectangle changes.
   p.locator('#objects .object[data-id="o4"]').click(modifiers=['Shift'])
   assert p.locator('#properties .style-fill input[type=color]').count()==1
   p.locator('#properties .style-fill .color-swatch[data-color="#22c55e"]').click()
   contents=get_doc(p)
   assert contents['objects'][3]['style']['fill']=='#22c55e'
   assert contents['objects'][0]['style']==mixed['objects'][0]['style']
   # Locked selection is visible but excludes locked shapes from atomic updates.
   p.locator('#objects .object[data-id="o2"] .object-menu-toggle').click()
   p.locator('#object-action-menu button[data-action="lock"]').click()
   p.locator('#objects .object[data-id="o1"]').click()
   p.locator('#objects .object[data-id="o2"]').click(modifiers=['Shift'])
   assert '1 locked' in p.locator('#properties .bulk-heading').inner_text()
   locked_before=get_doc(p)
   p.locator('#properties .style-stroke .color-swatch[data-color="#3b82f6"]').click()
   locked_after=get_doc(p)
   assert locked_after['objects'][0]['style']['stroke']=='#3b82f6'
   assert locked_after['objects'][1]==locked_before['objects'][1]
   # Marquee: left-right window enclosure, Shift marquee additive, Escape rollback.
   p.locator('#objects .object[data-id="o2"] .object-menu-toggle').click();p.locator('#object-action-menu button[data-action="lock"]').click()
   p.locator('[data-tool-choice="select"]').click()
   p.locator('#drawing').scroll_into_view_if_needed()
   a=rect_for(p,'o1');b=rect_for(p,'o2')
   # Use a full enclosure rectangle beginning away from selectable geometry.
   x1=min(a['x'],b['x'])-24;y1=min(a['y'],b['y'])-24
   x2=max(a['x']+a['width'],b['x']+b['width'])+24;y2=max(a['y']+a['height'],b['y']+b['height'])+24
   p.mouse.move(x1,y1);p.mouse.down();p.mouse.move(x2,y2,steps=5)
   assert p.locator('#drawing .selection-marquee').count()==1
   p.keyboard.press('Escape')
   assert p.locator('#drawing .selection-marquee').count()==0
   assert selected(p)==set(),selected(p)
   p.mouse.up()
   p.mouse.move(x1,y1);p.mouse.down();p.mouse.move(x2,y2,steps=5);p.mouse.up()
   assert {'o1','o2'}.issubset(selected(p)),(selected(p),x1,y1,x2,y2)
   assert 'o3' not in selected(p)
   # Add a disjoint object using Shift+marquee (not a replacement selection).
   c=rect_for(p,'o3');assert c
   u1=c['x']-22;v1=c['y']-22;u2=c['x']+c['width']+22;v2=c['y']+c['height']+22
   p.keyboard.down('Shift');p.mouse.move(u1,v1);p.mouse.down();p.mouse.move(u2,v2,steps=5);p.mouse.up();p.keyboard.up('Shift')
   assert {'o1','o2','o3'}.issubset(selected(p)),selected(p)
   # Shift-click canvas toggles without editing geometry or dragging points.
   c=rect_for(p,'o1')
   assert c
   p.keyboard.down('Shift');p.mouse.click(c['x']+c['width']/2,c['y']+c['height']/2);p.keyboard.up('Shift')
   assert 'o1' not in selected(p)
   p.keyboard.down('Shift');p.mouse.click(c['x']+c['width']/2,c['y']+c['height']/2);p.keyboard.up('Shift')
   assert 'o1' in selected(p)
   p.keyboard.press('Escape');assert selected(p)==set()
   # Chinese and mobile drawers continue to show bulk Properties.
   p.locator('#ui-language').select_option('zh')
   p.locator('#objects .object[data-id="o1"]').click()
   p.locator('#objects .object[data-id="o2"]').click(modifiers=['Shift'])
   assert p.locator('#properties .bulk-heading').inner_text()=='已选 2 个'
   assert p.locator('#properties .style-width input').count()==1
   assert p.locator('html').get_attribute('lang')=='zh'
   invalid_before=get_doc(p)
   p.locator('#properties .style-width input').fill('500')
   p.locator('#properties .style-width input').press('Tab')
   assert get_doc(p)==invalid_before,'Rejected bulk width mutated project'
   assert selected(p)=={'o1','o2'}
   # Replacing the document with reused IDs must clear stale transient selections.
   replacement=initial.copy()
   replacement['objects']=[initial['objects'][0]]
   p.on('dialog',lambda d:d.accept())
   p.locator('#open-file').set_input_files({'name':'replacement.json','mimeType':'application/json','buffer':json.dumps(replacement).encode()})
   p.wait_for_function("document.querySelector('#object-count').textContent==='1'")
   assert selected(p)==set() and get_doc(p)['objects']==replacement['objects']
   p.locator('#undo').click()
   assert len(get_doc(p)['objects'])==4 and selected(p)==set()
   assert not errors,errors
   p.close()
   phone=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
   phone_errors=[];phone.on('pageerror',lambda e:phone_errors.append(str(e)))
   phone.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   phone.locator('#left-collapse').click()
   cmd(phone,'P=(0,0)');cmd(phone,'Q=(2,1)')
   phone.locator('#objects .object[data-id="o1"]').click()
   phone.locator('#objects .object[data-id="o2"]').click(modifiers=['Shift'])
   assert phone.locator('#properties .bulk-heading').inner_text()=='2 selected'
   assert phone.locator('#properties .style-width input').count()==1
   assert not phone_errors,phone_errors
   phone.close()
   print('ROUND21_SELECTION_PASS: Chromium startup, Ctrl/Shift list, keyboard, marquee/cancel, atomic style+undo/redo, mixed fields, fill/lock safety, JSON, EN/ZH, mobile')
  finally:browser.close()

if __name__=='__main__':run()
