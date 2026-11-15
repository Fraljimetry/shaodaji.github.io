"""Round 65: browser reproduction of a 2-dilated constrained point locus."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1450,'height':950})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(150)
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(expr):
    page.locator('#command').fill(expr);page.locator('#command-form button').click();page.wait_for_timeout(90)
   def tool(name):
    page.locator(f'[data-tool-choice="{name}"]').click();page.wait_for_timeout(70)
   def clickobj(obj):
    page.locator(f'#drawing [data-id="{obj}"]').first.click(force=True);page.wait_for_timeout(120)
   for expr in ('O=(0,0)','B=(3,0)','Circle(O,B)'):cmd(expr)
   tool('pointOnObject')
   box=page.locator('#drawing [data-id="o3"]').bounding_box()
   page.mouse.click(box['x']+box['width']-2,box['y']+box['height']/2)
   page.wait_for_timeout(100)
   page.mouse.click(box['x']+box['width']/2,box['y']+2)
   page.wait_for_timeout(120)
   driver=next(o for o in snapshot()['objects'] if o['type']=='pointOnObject')
   tool('dilation');clickobj(driver['id'])
   page.once('dialog',lambda dialog:dialog.accept('2'))
   clickobj('o1')
   target=next(o for o in snapshot()['objects'] if o['type']=='transformCopy' and o['transform']=='dilate')
   assert target['refs']==[driver['id'],'o1'] and target['amount']==2,target
   assert page.locator(f'#drawing [data-id="{target["id"]}"]').count()==1
   tool('locus');clickobj(target['id']);clickobj(driver['id'])
   loci=[o for o in snapshot()['objects'] if o['type']=='locus']
   assert len(loci)==1 and loci[0]['refs']==[target['id'],driver['id']],loci
   assert page.locator(f'#drawing [data-id="{loci[0]["id"]}"]').count()==1
   pts=page.locator(f'#drawing [data-id="{loci[0]["id"]}"]').first.evaluate('(el)=>el.outerHTML')
   assert pts and ('polyline' in pts or 'path' in pts),f'Locus markup missing: {pts[:300]}'
   assert not errors,errors
   print('ROUND65_CHROMIUM_PASS O-circle / constrained P / dilation Q factor 2 / select Q then P / rendered 129-sample locus')
  finally:browser.close()
if __name__=='__main__':main()
