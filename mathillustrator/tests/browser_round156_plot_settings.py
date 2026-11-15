"""Round156 actual Chromium: plotting rows and 2D/3D density controls."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for width in (1440, 768, 390, 320):
            page = browser.new_page(viewport={'width': width, 'height': 900})
            page.set_default_timeout(10000)
            errors=[]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.set_content(inline_html(expose_state=True), wait_until='load', timeout=45000)
            if width < 700:
                page.locator('#right-collapse').click()
            result=page.evaluate('''() => {
                const ids=['plot-quality','plot-budget','implicit-grid'];
                const rect= id=>{let r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,right:r.right,bottom:r.bottom}};
                const [detail,budget,grid]=ids.map(rect);
                return {detail,budget,grid};
            }''')
            d,b,g=result['detail'],result['budget'],result['grid']
            assert d['bottom']<b['y'] and abs(b['y']-g['y'])<2, (width,result)
            assert d['w']<page.locator('.settings-2d-only').first.evaluate('(el)=>el.getBoundingClientRect().width')*.65,(width,result)
            assert b['right']<=g['x']+1,(width,result)
            page.locator('#plot-quality').select_option('detailed')
            page.locator('#plot-budget').select_option('500000')
            page.locator('#implicit-grid').fill('18')
            page.locator('#implicit-grid').press('Tab')
            if width < 700:
                page.locator('#right-collapse').click()
                page.locator('#left-collapse').click()
            page.locator('#plot-mode').select_option('vectorField')
            page.locator('#command').fill('x')
            page.locator('#command-y').fill('y')
            page.locator('#command').press('Enter')
            r=page.evaluate('''() => {
                const pair=document.querySelector('#properties .property-check-number-pair');
                const input=pair.querySelector('input[type=number]');
                const check=pair.querySelector('input[type=checkbox]');
                const a=pair.getBoundingClientRect(), b=input.getBoundingClientRect();
                return {label:pair.textContent.replace(/\\s+/g,' ').trim(),width:b.width,right:b.right,outer:a.right,check:check.checked};
            }''')
            assert 'Normalize lengths' in r['label'] and 'Density' in r['label'] and abs(r['width']-56)<1 and r['right']<=r['outer']+1,(width,r)
            assert not errors,(width,errors)
            print('PASS round156 Plot detail / budget / grid and 2D Density',width,flush=True)
            page.close()
    finally:
        browser.close()
