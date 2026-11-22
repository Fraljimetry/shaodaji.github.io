"""Round295 real Chromium: clipboard isolation and transactional Recently Deleted."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1400,'height':950});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_default_timeout(8000);page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   def enter(value):
    field=page.locator('#unified-algebra-input');field.fill(value);field.press('Enter')
   def objects():return json.loads(page.evaluate('window.__round36Snapshot()'))['objects']
   def obj(name):return next(o for o in objects() if o['name']==name)
   def select(name):
    row=page.locator('#objects .object[data-id="'+obj(name)['id']+'"]');row.click();row.focus()
   def press(key):page.keyboard.press(key)
   def trash_count():return int(page.locator('#trash-count').inner_text())
   def open_trash():
    # The inspector's trash list is populated regardless of disclosure state.
    return page.locator('#trash-items .trash-row')
   for cmd in ('A=(0,0)','B=(4,0)','C=(8,0)','s=Segment(A,B)'):enter(cmd)
   select('s');press('Control+c');press('Control+v')
   assert len(objects())==7
   first=objects()[-1];assert [next(o['xy'] for o in objects() if o['id']==ref) for ref in first['refs']]==[[.5,.5],[4.5,.5]]
   select('C');press('Control+d')
   assert len(objects())==8
   press('Control+v')
   pasted=objects()[-1]
   assert pasted['type']=='segment', 'Duplicate must not overwrite previously copied segment'
   assert [next(o['xy'] for o in objects() if o['id']==ref) for ref in pasted['refs']]==[[1,1],[5,1]],'Duplicate must not advance repeated-paste count'
   # Delete and Undo/Redo must move the same entry in/out of Recently Deleted.
   start=trash_count();select('C');press('Delete')
   assert trash_count()==start+1
   press('Control+z');assert trash_count()==start and any(o['name']=='C' for o in objects())
   press('Control+y');assert trash_count()==start+1 and all(o['name']!='C' for o in objects())
   # Restore through trash, then undo/redo that restoration.
   row=open_trash().first
   assert row.count()==1
   row.locator('button').evaluate('(element) => element.click()')
   assert trash_count()==start and any(o['name']=='C' for o in objects())
   press('Control+z');assert trash_count()==start+1 and all(o['name']!='C' for o in objects())
   press('Control+y');assert trash_count()==start and any(o['name']=='C' for o in objects())
   # Cut must track trash without altering prior redo safety.
   select('C');press('Control+x');assert trash_count()==start+1
   press('Control+z');assert trash_count()==start
   press('Control+y');assert trash_count()==start+1
   assert not errors,errors
   print('ROUND295_EDITING_CONSISTENCY_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
