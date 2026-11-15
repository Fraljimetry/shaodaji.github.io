import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=browser.new_page(viewport={'width':1440,'height':900})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            page.wait_for_timeout(150)
            result=page.evaluate('''() => {
                const svg=document.querySelector('[data-tool-choice="tangentCircle"] svg');
                const ring=svg.querySelector('circle:not([fill])');
                const tangency=[...svg.querySelectorAll('circle[fill="currentColor"]')].slice(1).map(e=>[+e.getAttribute('cx'),+e.getAttribute('cy')]);
                const box=svg.getBBox();
                return {
                  cx:+ring.getAttribute('cx'),
                  cy:+ring.getAttribute('cy'),
                  r:+ring.getAttribute('r'),
                  tangencyCount:tangency.length,
                  bbox:{x:box.x,y:box.y,width:box.width,height:box.height}
                };
            }''')
            assert result['r']==8, result
            assert result['tangencyCount']==2, result
            assert result['bbox']['x'] >= 0 and result['bbox']['y'] >= 0, result
            assert result['bbox']['x'] + result['bbox']['width'] <= 24.5, result
            assert result['bbox']['y'] + result['bbox']['height'] <= 24.5, result
            assert not errors, errors
            print('ROUND124_CHROMIUM_PASS: tangent-circle glyph uses radius 8 and stays within the 24x24 icon box')
        finally:
            browser.close()

if __name__=='__main__':
    run()
