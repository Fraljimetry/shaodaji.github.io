"""Round 245: hollow slider glyph and bilingual guide readability."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':800})
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content(inline_html(expose_state=True),wait_until='load')
   icon=page.locator('#basic-tools').locator('svg').all() if page.locator('#basic-tools').count() else []
   slider=page.locator('[data-tool-choice="slider"]')
   assert slider.count()>0,'slider tool missing'
   assert slider.locator('circle[fill="none"]').count()>0,'toolbar slider glyph must have a hollow circle'
   assert slider.locator('circle[fill="currentColor"]').count()==0,'toolbar must not use a point glyph'
   page.locator('#unified-algebra-input').fill('a = Slider(0, 10, 0.1, 2)')
   page.locator('#unified-algebra-input').press('Enter')
   row=page.locator('#objects [data-slider="a"]')
   assert row.count()==1
   assert row.locator('circle[fill="none"]').count()>0,'Objects slider glyph must also be hollow'
   assert not errors,errors
   page.close()
   guide=(ROOT/'tutorial.html').read_text()
   for lang in ('en','zh'):
    p=browser.new_page(viewport={'width':390,'height':780})
    p.set_content(guide,wait_until='load')
    p.evaluate("lang=>{document.documentElement.dataset.lang=lang}",lang)
    tables=p.locator('.constructor-table:visible')
    assert tables.count()==1,(lang,tables.count())
    assert tables.locator('tbody tr').count()==21
    widths=tables.evaluate('e=>({table:e.getBoundingClientRect().width,parent:e.parentElement.getBoundingClientRect().width,scroll:e.parentElement.scrollWidth})')
    assert widths['parent']<=p.evaluate('document.querySelector(".article").getBoundingClientRect().width')+1,widths
    assert widths['scroll']>=widths['parent'],widths
    assert not p.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'),'page overflowed horizontally'
    p.close()
   print('ROUND245_SLIDER_GLYPH_GUIDE_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
