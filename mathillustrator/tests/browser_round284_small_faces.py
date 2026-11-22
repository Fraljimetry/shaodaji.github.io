"""R284: real Chromium renders formerly cracked near-level and shifted implicit fields."""
import base64, hashlib, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

CASES = [
    ('near-zero-offset', 'cos(x)+cos(y)+cos(z)=0.000001', 24),
    ('shifted-cosine', 'cos(x+0.3)+cos(y-0.2)+cos(z+0.4)=0', 80),
    ('oscillatory-envelope', 'sin(5*x)*cos(7*y)*sin(3*z)+0.2*(x*x+y*y+z*z)=0.3', 48),
]

def run():
    fixture=json.loads((Path(__file__).parent/'fixtures'/'round280_implicit_surface3.json').read_text())
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
        try:
            signatures=[]
            for name,expression,detail in CASES:
                page=browser.new_page(viewport={'width':1500,'height':900},accept_downloads=True)
                errors=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('dialog',lambda d:d.accept())
                page.set_content(inline_html(expose_state=True),wait_until='domcontentloaded')
                scene=json.loads(json.dumps(fixture))
                plot=scene['scene3d']['plots'][2]
                plot['a']=expression
                if name=='oscillatory-envelope':
                    plot['bounds']={k:v for axis in 'xyz' for k,v in ((axis+'Min',-2),(axis+'Max',2))}
                scene['scene3d']['options']['detail']=detail
                page.locator('#open-file').set_input_files({'name':'round284.json','mimeType':'application/json','buffer':json.dumps(scene).encode()})
                page.wait_for_function(f"JSON.parse(window.__round36Snapshot()).scene3d.options.detail==={detail}",timeout=30000)
                page.wait_for_function("() => !!document.querySelector('#drawing image[data-3d-raster]') || document.querySelectorAll('#drawing polygon').length > 1000",timeout=90000)
                page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=90000)
                info=page.locator('#render-info').inner_text()
                raster=page.locator('#drawing image[data-3d-raster]')
                if raster.count():
                    raw=base64.b64decode(raster.get_attribute('href').split(',',1)[1]);assert raw.startswith(b'\x89PNG\r\n\x1a\n') and len(raw)>10000
                    sig=hashlib.sha256(raw).hexdigest()
                else:
                    count=page.locator('#drawing polygon').count();assert count>1000,(name,count)
                    sig=page.locator('#drawing polygon').first.get_attribute('points')
                assert 'PLOT LIMIT' not in info,(name,info)
                assert not errors,(name,errors)
                signatures.append(sig)
                print('ROUND284 CHROMIUM PASS',name,detail,info,flush=True)
                page.close()
            assert len(set(signatures))==len(signatures)
        finally:
            browser.close()
if __name__=='__main__':run()
