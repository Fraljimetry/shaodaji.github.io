"""Real Chromium keyboard clipboard and deletion/undo compatibility."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1400,'height':950});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   def enter(value):
    field=page.locator('#unified-algebra-input');field.fill(value);field.press('Enter')
   def objects():return json.loads(page.evaluate('window.__round36Snapshot()'))['objects']
   for cmd in ['A=(0,0)','B=(4,0)','C=(1,3)','s=Segment(A,B)'] : enter(cmd)
   old=objects();assert len(old)==4,old
   seg=next(o for o in old if o['name']=='s')
   row=page.locator('#objects .object[data-id="'+seg['id']+'"]');row.click();row.focus();page.keyboard.press('Control+c');page.keyboard.press('Control+v')
   after=objects();assert len(after)==7,(len(after),after)
   dup=after[-1];assert dup['type']=='segment' and dup['refs']!=seg['refs'],dup
   assert all(any(o['id']==r for o in after) for r in dup['refs'])
   assert [o['name'] for o in after[:4]]==[o['name'] for o in old]
   page.keyboard.press('Control+z');assert len(objects())==4,'paste undo failed'
   page.keyboard.press('Control+y');assert len(objects())==7,'paste redo failed'
   # Delete current pasted construction by selecting its object-list row.
   new_id=objects()[-1]['id'];page.locator('#objects .object[data-id="'+new_id+'"]').click()
   page.locator('#objects .object[data-id="'+new_id+'"]').focus();page.keyboard.press('Delete')
   assert len(objects())==6,'delete selected segment failed'
   page.keyboard.press('Control+z');assert len(objects())==7,'delete undo failed'
   # Typing in a focused editable field must not trigger geometry clipboard.
   inp=page.locator('#unified-algebra-input');inp.fill('abc');inp.press('Control+a');inp.press('Control+c');inp.press('Control+v');assert len(objects())==7
   # Ctrl+D duplicates the selected constructed object with its ancestors.
   current=objects();existing=len(current)
   row=page.locator('#objects .object[data-id="'+seg['id']+'"]');row.click();row.focus();page.keyboard.press('Control+d')
   assert len(objects())==existing+3,'duplicate shortcut failed'
   page.keyboard.press('Control+z');assert len(objects())==existing
   # Ctrl+X cuts the segment and its descendants, Ctrl+V restores an independent copy.
   row=page.locator('#objects .object[data-id="'+seg['id']+'"]');row.click();row.focus();page.keyboard.press('Control+x')
   assert len(objects())==existing-1,'cut failed'
   page.locator('#drawing').focus();page.keyboard.press('Control+v')
   assert len(objects())==existing+2,'paste after cut failed'
   # Select all is only applied while the drawing/list has keyboard focus.
   page.locator('#drawing').focus();page.keyboard.press('Control+a')
   assert page.locator('#objects .object.selected').count()==len(objects()),'select all failed'
   assert not errors,errors
   print('ROUND293_CLIPBOARD_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
