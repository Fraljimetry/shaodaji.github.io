"""Round 247 — caret-aware completions in real Chromium (2D and 3D)."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        page=browser.new_page(viewport={'width':1280,'height':800})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(inline_html(expose_state=True),wait_until='load')
        algebra=page.locator('#unified-algebra-input')
        algebra.fill('A = (sqr(9), 1)')
        algebra.evaluate('(el) => { el.focus(); el.setSelectionRange(8, 8); el.dispatchEvent(new Event("input",{bubbles:true})); }')
        popup=page.locator('#unified-algebra-input-suggestions')
        assert popup.is_visible(), 'No caret-aware Algebra suggestions'
        assert popup.get_by_text('sqrt(…)').count()==1
        algebra.press('Tab')
        assert algebra.input_value()=='A = (sqrt(9), 1)',algebra.input_value()
        assert algebra.evaluate('(e)=>e.selectionStart')==9
        algebra.fill('sin')
        algebra.press('(')
        assert algebra.input_value()=='sin()'
        algebra.press(')')
        assert algebra.input_value()=='sin()'
        assert algebra.evaluate('(e)=>e.selectionStart')==5
        algebra.fill('min')
        popup.get_by_text('min(…)').click()
        assert algebra.input_value()=='min()'
        # Input assistance must never submit an incomplete expression.
        assert page.locator('[data-slider]').count()==0
        cmd=page.locator('#command')
        cmd.fill('sin(0)+co(2)')
        cmd.evaluate('(e)=>{e.focus();e.setSelectionRange(9,9);e.dispatchEvent(new Event("input",{bubbles:true}))}')
        ppopup=page.locator('#command-suggestions')
        assert ppopup.get_by_text('cos(…)').count()==1
        cmd.press('Tab')
        assert cmd.input_value()=='sin(0)+cos(2)',cmd.input_value()
        assert not errors, errors
        print('ROUND247_SMART_INPUT_PARITY_CHROMIUM_PASS')
    finally:
        browser.close()
