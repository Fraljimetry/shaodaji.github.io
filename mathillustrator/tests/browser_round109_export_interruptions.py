"""Round 109: sabotage delayed raster encoding and prove cancelled exports never download."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
    with sync_playwright() as pw:
        exe=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
        try:
            page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
            errors=[]; downloads=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('download',lambda d:downloads.append(d.suggested_filename))
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            page.evaluate('''() => { const original=HTMLCanvasElement.prototype.toBlob;
                window.__round109Started=0;window.__round109Release=null;
                HTMLCanvasElement.prototype.toBlob=function(callback,...args){
                    window.__round109Started++;
                    window.__round109Release=()=>original.call(this,callback,...args);
                };
            }''')
            # Ensure a nonempty scene. Export must reach the asynchronous raster stage.
            page.locator('#command').fill('x^2')
            page.locator('#command-form button').click()
            page.locator('#export-open').click()
            page.locator('#export-options button',has_text='PNG').click()
            page.wait_for_function('window.__round109Started === 1',timeout=15000)
            page.locator('#export-close').click()
            page.evaluate('window.__round109Release()')
            page.wait_for_timeout(850)
            assert not downloads, f'download after cancel: {downloads}'
            assert page.locator('#export-menu').is_hidden(), 'dialog reopened after cancellation'
            # Reopen after cancellation and ensure the next export really works.
            page.locator('#export-open').click()
            # Old delayed export should have ended; a fresh PNG must download.
            page.locator('#export-options button',has_text='PNG').click()
            page.wait_for_function('window.__round109Started === 2',timeout=15000)
            with page.expect_download(timeout=15000) as pending:
                page.evaluate('window.__round109Release()')
            assert pending.value.suggested_filename.endswith('.png')
            assert len(downloads)==1,downloads
            assert not errors,errors
            print(json.dumps({'round':109,'passed':True,'cancelled_downloads':0,'fresh_downloads':len(downloads),'errors':errors}))
        finally:browser.close()

if __name__=='__main__':main()
