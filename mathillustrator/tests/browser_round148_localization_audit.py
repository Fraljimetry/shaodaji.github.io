"""Round148: actual Chromium localization of generated Geometry Properties and Settings."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   for width in (1440,):
    page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(13000)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=45000)
    def command(value):
     if width<700 and not page.locator('#command').is_visible():page.locator('#left-collapse').click()
     page.locator('#command').fill(value)
     page.locator('#command-form button').click()
    for c in ['A=(0,0)','B=(4,0)','C=(0,3)']:command(c)
    if width<700 and not page.locator('[data-tool-choice="triangleCenter"]').is_visible():
     page.keyboard.press('Escape')
     page.locator('#right-collapse').click()
    for section in ('construction','polygons-centers'):
     group=page.locator(f'[data-section-id="{section}"]')
     if group.count() and group.locator(':scope > .section-body').count() and group.locator(':scope > .section-body').get_attribute('hidden') is not None:
      group.locator(':scope > h3 button, :scope > h4 button').first.click()
    page.locator('[data-tool-choice="triangleCenter"]').click()
    for n in (1,2,3):page.locator(f'#drawing [data-id="o{n}"]').first.click(force=True)
    snapshot=json.loads(page.evaluate('window.__round36Snapshot()'))
    assert any(o['type']=='triangleCenter' for o in snapshot['objects']), snapshot['objects']
    if width<700 and not page.locator('#properties select').first.is_visible():page.locator('#right-collapse').click()
    center=page.locator('#properties label.field').filter(has=page.locator('option[value="excenterA"]')).locator('select')
    assert center.count()==1,(width,page.locator('#properties').inner_text())
    for language,expected in [('zh',['A 顶点旁心','B 顶点旁心','C 顶点旁心']),('en',['Excenter A','Excenter B','Excenter C']),('zh',['A 顶点旁心','B 顶点旁心','C 顶点旁心']),('en',['Excenter A','Excenter B','Excenter C'])]:
     page.locator('#ui-language').select_option(language)
     labels=center.locator('option').all_text_contents()
     for label in expected:assert label in labels,(width,language,labels)
     center.select_option('excenterB')
     assert json.loads(page.evaluate('window.__round36Snapshot()'))['objects'][-1]['centerKind']=='excenterB'
     assert center.locator('option:checked').inner_text()==expected[1]
    assert not errors,errors
    print('PASS center locale switch + select',width,flush=True)
    page.close()
  finally:browser.close()
if __name__=='__main__':main()
