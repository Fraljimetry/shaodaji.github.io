"""Cut04: orphaned property callbacks must not mutate another document's reused IDs."""
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright
import os,json

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1360,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(90)
  cmd(page,'A=(1,1)')
  page.locator('#objects .object[data-id="o1"]').click()
  page.evaluate("""() => {
   window.__staleName=document.querySelector('#properties input[type=text]');
   window.__staleDelete=[...document.querySelectorAll('#properties button')].find(b=>b.textContent.startsWith('Delete'));
   window.__staleRow=document.querySelector('#objects .object[data-id=o1]');
  }""")
  page.locator('#new').click();cmd(page,'B=(9,9)')
  page.locator('#objects .object[data-id="o1"]').click()
  page.evaluate("""() => {
   window.__staleName.value='STALE_EDIT';
   window.__staleName.dispatchEvent(new Event('change',{bubbles:true}));
  }""")
  data=json.loads(download(page,'Save').read_text())
  assert data['objects'][0]['name']=='B', 'Orphaned property input modified a replacement project via reused object ID'
  page.evaluate('window.__staleDelete.click()')
  data=json.loads(download(page,'Save').read_text())
  assert len(data['objects'])==1,'Orphaned Delete button removed replacement object via reused ID'
  page.evaluate("window.__staleRow.querySelectorAll('button')[0].click()")
  data=json.loads(download(page,'Save').read_text())
  assert not data['objects'][0]['hidden'],'Orphaned object-list control modified replacement object'
  assert not errors,errors
  print('CHROMIUM_CUT04_STALE_PASS: reused-ID orphan input/delete/object-row blocked without corrupting current document')
  b.close()
if __name__=='__main__':run()
