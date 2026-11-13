"""Round 20 focused Chromium gate: compact unobstructed bilingual settings and tutorial-only explanations."""
import os, json, re
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download


def run():
 with sync_playwright() as playwright:
  browser=playwright.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   for width in (1440,900,700,390,320):
    print('WIDTH',width,flush=True)
    p=browser.new_page(viewport={'width':width,'height':850},accept_downloads=True)
    errors=[];p.on('pageerror',lambda error:errors.append(str(error)))
    p.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
    p.wait_for_selector('[data-tool-choice="point"]',state="attached")
    if width<=700: p.locator('#right-collapse').click()
    assert p.locator('#help svg').count()==1
    assert p.locator('#help').get_attribute('aria-label')=='Tutorial'
    assert p.locator('.mini-help').count()==0
    assert p.locator('.compact-help').count()==0
    assert '?' not in p.locator('#mode-label').inner_text()
    assert p.locator('p.hint').count()==0
    print('STARTUP',width,flush=True)
    for lang in ('en','zh'):
     print('LANG',width,lang,flush=True)
     p.locator('#ui-language').select_option(lang)
     assert p.locator('html').get_attribute('lang')==lang
     if lang=='zh':assert p.locator('#help').get_attribute('aria-label')=='教程'
     assert p.locator('#freehand-close').input_value()=='near'
     for selector in ('#plot-quality','#freehand-close','#correction','#label-placement','#naming-convention','#page','#export-region','#theme','#ui-font'):
      # Every option is short enough to fit in its normal selector when rendered in a drawer.
      p.locator(selector).evaluate('e=>{e.closest(".section-body").hidden=false;document.querySelector("#settings-sections").hidden=false;}')
      result=p.locator(selector).evaluate('''e=>{const ctx=document.createElement('canvas').getContext('2d');ctx.font=getComputedStyle(e).font;return {width:e.clientWidth, options:[...e.options].filter(o=>!o.hidden).map(o=>({text:o.textContent,width:ctx.measureText(o.textContent).width}))}}''')
      assert all(o['width'] + 28 < result['width']+0.1 for o in result['options']), (width,lang,selector,result)
    print('AFTER SELECT',width,flush=True)
    # Keep all settings inside the right panel, not in the exported document.
    p.locator('#ui-language').select_option('en')
    assert p.locator('.geometry-options .settings-subsection h4').all_inner_texts()==['Snap','Show']
    assert p.locator('#snap-objects').is_checked()
    # Color pickers must share the label row, on its right.
    p.locator('#default-stroke').evaluate('e=>e.closest(".section-body").hidden=false')
    for selector in ('#default-stroke','#default-fill'):
     result=p.locator(selector).evaluate('''e=>{const l=e.closest('label');const a=l.getBoundingClientRect(),b=e.getBoundingClientRect();return {topDelta:Math.abs((a.top+a.bottom-b.top-b.bottom)/2), rightDelta:Math.abs(a.right-b.right)}}''')
     assert result['topDelta']<6 and result['rightDelta']<5,(width,selector,result)
    if width>=900:
     for inp in ('A=(0,0)','B=(3,0)','Segment(A,B)'):cmd(p,inp)
     p.locator('#objects .object[data-id="o3"]').click()
     assert p.locator('#properties .mini-help').count()==0
     assert p.locator('#properties .style-stroke input[type=color]').count()==1
     assert p.locator('#properties .style-stroke .color-swatch').count()==10
     assert p.locator('#properties .style-stroke .color-swatches').evaluate('e=>getComputedStyle(e).flexWrap')=='nowrap'
     original=json.loads(download(p,'Save').read_text())
     p.locator('#plot-quality').select_option('fast')
     p.locator('#undo').click()
     assert json.loads(download(p,'Save').read_text())==original
    assert not errors,(width,errors)
    p.close()
   # Tutorial stores detailed EN/ZH guidance without language toggles.
   from pathlib import Path
   root=Path(__file__).resolve().parents[1]
   tutorial=(root/'tutorial.html').read_text()
   assert 'Controls and settings' in tutorial and '控制与设置说明' in tutorial
   assert 'All arrows' in tutorial and '48' in tutorial
   assert 'transparent' in tutorial.lower() and 'JPEG' in tutorial
   assert 'id="chinese"' not in tutorial and 'id="english"' not in tutorial
   print('ROUND20_COMPACT_PASS: full option captions at 1440/900/700/390/320 EN+ZH, note-free UI, inline color picker, project undo/export, tutorial')
  finally: browser.close()
if __name__=='__main__':run()
