"""Real Chromium clicks and user guide bilingual rendering for Round 137."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,ROOT
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  p=b.new_page(viewport={'width':1400,'height':850});p.set_default_timeout(15000)
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=60000)
  snap=lambda:json.loads(p.evaluate('window.__round36Snapshot()'))
  p.locator('#plot-mode').select_option('function')
  p.locator('#command').fill('max(0,sin(x))+min(x,2)')
  p.locator('#command').press('Enter')
  assert snap()['objects'][-1]['expr']=='max(0,sin(x))+min(x,2)'
  p.locator('#plot-mode').select_option('implicit')
  p.locator('#command').fill('hypot(x,y)=2')
  p.locator('#command').press('Enter')
  assert snap()['objects'][-1]['expr']=='hypot(x,y)=2'
  p.locator('#plot-mode').select_option('domainColoring')
  p.locator('#command').fill('asin(z)+log10(z)')
  p.locator('#command').press('Enter')
  assert snap()['objects'][-1]['expr']=='asin(z)+log10(z)'
  assert not errors,errors
  print('PASS full application Chromium: Enter-create real and complex plot expressions',flush=True)
  p.close()
  for language,width in [('en',1200),('zh',390)]:
   page=b.new_page(viewport={'width':width,'height':760})
   page.set_content((ROOT/'tutorial.html').read_text(),wait_until='load')
   page.evaluate('(lang)=>{document.getElementById("en-guide").hidden=lang==="zh";document.getElementById("zh-guide").hidden=lang!=="zh"}',language)
   section='#en-guide' if language=='en' else '#zh-guide'
   assert page.locator(section).is_visible()
   assert page.locator(section+' table').count()==2
   assert page.locator(section).get_by_text('max',exact=False).count()>0
   assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'),('overflow',language,width)
   print('PASS guide Chromium',language,width,flush=True)
   page.close()
 finally:b.close()
