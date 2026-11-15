"""Round 160: compact export toggles, actual browser and reversible state."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for width in (1440,768,390,320):
            page=browser.new_page(viewport={'width':width,'height':900})
            errors=[]
            page.on('pageerror',lambda err: errors.append(str(err)))
            page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
            if width<700: page.locator('#right-collapse').click()
            def measure():
                return page.evaluate('''() => {
                  const row=document.querySelector('.export-check-row');
                  const a=document.querySelector('#export-guides').closest('label').getBoundingClientRect();
                  const b=document.querySelector('#export-transparent').closest('label').getBoundingClientRect();
                  const r=row.getBoundingClientRect();
                  return {display:getComputedStyle(row).display,ay:a.y,by:b.y,
                     overlap:a.right>b.left,within:b.right<=r.right+1,
                     label1:document.querySelector('#export-guides').closest('label').innerText,
                     label2:document.querySelector('#export-transparent').closest('label').innerText, exportX:document.querySelector('#export-transparent').getBoundingClientRect().left, interfaceX:document.querySelector('#auto-pan').getBoundingClientRect().left, themeX:document.querySelector('#theme').getBoundingClientRect().left, canvasX:document.querySelector('#page').getBoundingClientRect().left};
                }''')
            m=measure()
            assert abs(m['exportX']-m['interfaceX'])<2,('column alignment',width,m)
            assert m['display']=='grid' and abs(m['ay']-m['by'])<2 and not m['overlap'] and m['within'],(width,m)
            page.locator('#export-guides').check()
            page.locator('#export-transparent').check()
            assert page.locator('#export-guides').is_checked() and page.locator('#export-transparent').is_checked()
            page.locator('#export-guides').uncheck()
            page.locator('#export-transparent').uncheck()
            assert not page.locator('#export-guides').is_checked() and not page.locator('#export-transparent').is_checked()
            page.locator('#ui-language').select_option('zh')
            m=measure()
            assert abs(m['exportX']-m['interfaceX'])<2,('column alignment',width,m)
            assert abs(m['exportX']-m['interfaceX'])<2 and abs(m['ay']-m['by'])<2 and not m['overlap'] and m['within'],('zh',width,m)
            page.locator('#ui-language').select_option('en')
            assert not errors,(width,errors)
            print('ROUND160_CHROMIUM_PASS',width,flush=True)
            page.close()
    finally:browser.close()
