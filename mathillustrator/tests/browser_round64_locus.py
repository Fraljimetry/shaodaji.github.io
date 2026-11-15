"""Round 64: actual Chromium locus selection and dependent construction smoke."""
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
   page.wait_for_timeout(120)
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(expr):
    page.locator('#command').fill(expr);page.locator('#command-form button').click();page.wait_for_timeout(80)
   def tool(name):
    page.locator(f'[data-tool-choice="{name}"]').click();page.wait_for_timeout(70)
   def clickobj(obj):
    page.locator(f'#drawing [data-id="{obj}"]').first.click(force=True);page.wait_for_timeout(100)
   for expr in ('A=(0,0)','B=(3,0)','Circle(A,B)'):cmd(expr)
   # An existing point must be accepted as the first locus input.
   tool('locus');clickobj('o1')
   assert 'Click the center of an existing point' not in page.locator('body').inner_text()
   # Create a point constrained to a circle, then a dependent midpoint.
   tool('pointOnObject')
   box=page.locator('#drawing [data-id="o3"]').bounding_box()
   page.mouse.click(box['x']+box['width']-2,box['y']+box['height']/2)
   page.wait_for_timeout(90)
   page.mouse.click(box['x']+box['width']/2,box['y']+2)
   page.wait_for_timeout(110)
   driver=next(o for o in snapshot()['objects'] if o['type']=='pointOnObject')
   tool('midpoint');clickobj('o1');clickobj(driver['id'])
   midpoint=next(o for o in snapshot()['objects'] if o['type']=='midpoint')
   tool('locus');clickobj(midpoint['id']);clickobj(driver['id'])
   loci=[o for o in snapshot()['objects'] if o['type']=='locus']
   assert len(loci)==1 and loci[0]['refs']==[midpoint['id'],driver['id']],loci
   assert page.locator(f'#drawing [data-id="{loci[0]["id"]}"]').count()==1
   assert not errors,errors
   print('ROUND64_CHROMIUM_PASS point selection, constrained driver, dependent midpoint, rendered locus, startup')
  finally:browser.close()
if __name__=='__main__':main()
