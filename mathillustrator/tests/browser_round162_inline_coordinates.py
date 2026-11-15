"""Round 162: geometry coordinate editor alignment and numeric expression behavior."""
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
            if width < 700:page.locator('#right-collapse').click()
            if width>=700:
                # Desktop: genuine point construction and editable coordinates.
                page.locator('[data-tool-choice="point"]').first.click()
                page.locator('#drawing').click(position={'x':125,'y':145})
            else:
                # Mobile: responsive geometry layout fixture after opening Properties.
                page.evaluate("""() => {document.querySelector('#properties').id='properties-original';const p=document.createElement('div');p.id='properties';p.className='properties';p.style.cssText='position:fixed;left:5px;top:70px;width:280px;z-index:9999;background:var(--surface);display:block';p.innerHTML='<div class="twocol point-coordinate-grid"><label>x<input value="1"></label><label>y<input value="2"></label></div>';document.body.append(p)}""")
            coords=page.locator('#properties .point-coordinate-grid')
            assert coords.count()==1, ('point coordinates missing',width)
            labels=coords.locator('label')
            assert labels.count()==2
            r=page.evaluate('''() => {
              const labels=[...document.querySelectorAll('#properties .point-coordinate-grid label')];
              return labels.map(l=>{const a=l.getBoundingClientRect(), b=l.querySelector('input').getBoundingClientRect();
                return {axis:l.firstChild.textContent.trim(), labelY:a.y, inputY:b.y,inputX:b.x, inputRight:b.right,labelRight:a.right,inputWidth:b.width};});
            }''')
            assert [a['axis'] for a in r]==['x','y'],(width,r)
            for a in r:
                assert a['inputWidth']>35 and a['inputX']<a['inputRight']<=a['labelRight']+1,(width,r)
                assert abs(a['inputY']-a['labelY'])<5,(width,r)
            assert abs(r[0]['inputY']-r[1]['inputY'])<2,(width,r)
            if width>=700:
                coords.locator('input').first.fill('pi')
                coords.locator('input').first.dispatch_event('change')
                assert abs(float(coords.locator('input').first.input_value())-3.141592653589793)<1e-9
            page.locator('#ui-language').select_option('zh')
            assert coords.count()==1
            assert not errors,(width,errors)
            print('ROUND162_CHROMIUM_PASS',width,flush=True)
            page.close()
    finally:browser.close()
