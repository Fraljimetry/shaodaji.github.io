"""Round 31: contrast a literal object name with an explicit LaTeX label, hook shape and bulk layout."""
import os,re,json,math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1536,'height':864},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
  page.locator('button.tool').first.wait_for(timeout=6000)
  # Cyan replaces Sky in the new palette, but existing custom-colour JSON is not rewritten.
  swatches=page.locator('#default-color-swatches-stroke .color-swatch')
  assert swatches.count()==10,swatches.count()
  cyan=swatches.filter(has=page.locator('[data-color="#48b6c8"]'))
  assert page.locator('#default-color-swatches-stroke [data-color="#48b6c8"]').count()==1
  assert page.locator('#default-color-swatches-stroke [data-color="#0ea5e9"]').count()==0
  # Point's automatically generated name remains literal text even with latex as default label format.
  cmd(page,'A_1=(0,0)')
  name_text=page.locator('#drawing text').all_text_contents()
  assert 'A_1' in name_text,name_text
  page.locator('#object-search').fill('A_1')
  page.locator('#objects .object').first.click()
  assert page.locator('#properties label.field').filter(has_text='Label format').locator('select').input_value()=='latex'
  label=page.locator('#properties label.field').filter(has_text='Displayed label').locator('input')
  label.fill(r'\alpha_1');label.press('Tab')
  assert 'A_1' not in page.locator('#drawing text').all_text_contents(),page.locator('#drawing text').all_text_contents()
  project=json.loads(download(page,'Save').read_text())
  assert project['objects'][0]['name']=='A_1' and project['objects'][0]['pointLabel']==r'\alpha_1'
  label=page.locator('#properties label.field').filter(has_text='Displayed label').locator('input')
  label.fill('');label.press('Tab')
  assert 'A_1' in page.locator('#drawing text').all_text_contents()
  # Bulk selected points: Point size must be aligned on SAME horizontal row.
  page.locator('#object-search').fill('')
  cmd(page,'B=(2,1)')
  page.locator('#objects .object').filter(has=page.locator('strong').get_by_text('B',exact=True)).click()
  page.locator('#objects .object').filter(has=page.locator('strong').get_by_text('A_1',exact=True)).click(modifiers=['Control'])
  assert '2 selected' in page.locator('#properties').inner_text()
  field=page.locator('#properties .style-pointsize .field')
  dims=field.evaluate('e=>{const i=e.querySelector("input"),a=e.getBoundingClientRect(),b=i.getBoundingClientRect();return {display:getComputedStyle(e).display,y:b.y,boxY:a.y,h:b.height,boxH:a.height,right:a.right-b.right}}')
  assert dims['display']=='grid' and abs(dims['y']-dims['boxY'])<5 and abs(dims['right'])<2,dims
  # New morphism: the hooked tail is one open parenthesis connected at its endpoint.
  for line in ['N=Node(-3,-1,"N")','M=Node(3,-1,"M")','Morphism(N,M,"f")']:cmd(page,line)
  morph_id=json.loads(download(page,'Save').read_text())['objects'][-1]['id']
  page.locator(f'#objects .object[data-id="{morph_id}"]').click()
  style=page.locator('#properties label.field').filter(has_text='Arrow style').locator('select')
  style.select_option('hook')
  hook=page.locator('#drawing .morphism-tail-hook')
  assert hook.count()==1
  d=hook.get_attribute('d')
  assert d.count(' C')==2 and d.startswith('M'),d
  hook_box=hook.bounding_box();assert hook_box and hook_box['height']>5 and hook_box['width']>4,hook_box
  style.select_option('hook-dashed')
  assert page.locator('#drawing .morphism-tail-hook').count()==1
  assert page.locator(f'#drawing g[data-id="{morph_id}"] path').first.get_attribute('stroke-dasharray')=='7 5'
  style.select_option('solid');assert page.locator('#drawing .morphism-tail-hook').count()==0
  assert not errors,errors
  page.set_viewport_size({'width':390,'height':844});assert page.locator('#drawing').is_visible()
  browser.close()
 print('ROUND31_CHROMIUM_PASS: cyan palette, literal names, user LaTeX labels, inline bulk Point size, parenthesis hook and mobile')
if __name__=='__main__':run()
