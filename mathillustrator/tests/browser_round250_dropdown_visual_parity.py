"""The autocomplete popup must look like the mathematical expression input it assists."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for viewport in ({'width':1280,'height':800},{'width':760,'height':720},{'width':390,'height':780}):
            page = browser.new_page(viewport=viewport)
            page.set_content(inline_html(expose_state=True), wait_until='load')
            if viewport['width'] < 700:
                page.evaluate("document.body.classList.add('mobile-left-open')")
            for input_id, value in [('unified-algebra-input', 'sin'), ('command', 'sin'), ('command-y', 'sin')]:
                if input_id == 'command-y':
                    page.locator('#plot-mode').select_option('parametric')
                input_el=page.locator('#'+input_id)
                input_el.fill(value)
                popup=page.locator('#'+input_id+'-suggestions')
                assert popup.is_visible(), (viewport,input_id)
                option=popup.get_by_role('option').first
                stats=page.evaluate('''([id]) => {
                    const field=document.getElementById(id), popup=document.getElementById(id+'-suggestions');
                    const row=popup.querySelector('[role=option]'), f=getComputedStyle(field), r=getComputedStyle(row);
                    const fr=field.getBoundingClientRect(),pr=popup.getBoundingClientRect();
                    return {fieldFamily:f.fontFamily,rowFamily:r.fontFamily,fieldSize:f.fontSize,rowSize:r.fontSize,
                       fieldHeight:fr.height,rowHeight:row.getBoundingClientRect().height,
                       fieldWidth:fr.width,popupWidth:pr.width,deltaLeft:pr.left-fr.left,
                       overflow:pr.right>window.innerWidth+1};
                }''', [input_id])
                assert stats['fieldFamily']==stats['rowFamily'],(viewport,input_id,stats)
                assert stats['fieldSize']==stats['rowSize'],(viewport,input_id,stats)
                assert abs(stats['fieldHeight']-stats['rowHeight'])<4,(viewport,input_id,stats)
                assert abs(stats['popupWidth']-stats['fieldWidth'])<2,(viewport,input_id,stats)
                assert abs(stats['deltaLeft'])<2,(viewport,input_id,stats)
                assert not stats['overflow'],(viewport,input_id,stats)
                if input_id == 'command':
                    # An open popup must follow live splitter/input width changes.
                    page.evaluate("document.getElementById('command').style.cssText+=';flex:0 0 106px;width:106px'")
                    page.wait_for_timeout(110)
                    widths=page.evaluate("""() => ({field:document.getElementById('command').getBoundingClientRect().width,
                       popup:document.getElementById('command-suggestions').getBoundingClientRect().width})""")
                    assert abs(widths['field']-widths['popup'])<2,(viewport,widths)
                    page.evaluate("document.getElementById('command').removeAttribute('style')")
            page.close()
        print('ROUND250_DROPDOWN_VISUAL_PARITY_CHROMIUM_PASS')
    finally:
        browser.close()
