"""Round281 real Chromium complex implicit mesh, high detail, JSON import, and renderer fidelity."""
import json, os, hashlib, base64
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

CASES = [
    ('Schwarz-D', 'sin(x)*sin(y)*sin(z)+sin(x)*cos(y)*cos(z)+cos(x)*sin(y)*cos(z)+cos(x)*cos(y)*sin(z)', 20000),
    ('Neovius', '3*(cos(x)+cos(y)+cos(z))+4*cos(x)*cos(y)*cos(z)', 20000),
    ('oscillatory', 'sin(7*x)*sin(7*y)+sin(7*z)', 35000),
]
def run():
    original = json.loads((Path(__file__).parent/'fixtures'/'round280_implicit_surface3.json').read_text())
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            for name,expression,min_faces in CASES:
                page=browser.new_page(viewport={'width':1500,'height':900},accept_downloads=True)
                errors=[]
                page.on('pageerror',lambda error: errors.append(str(error)))
                page.on('dialog',lambda dialog:dialog.accept())
                page.set_content(inline_html(expose_state=True), wait_until='domcontentloaded')
                scene=json.loads(json.dumps(original))
                scene['scene3d']['plots'][2]['a']=expression
                scene['scene3d']['options']['detail']=24
                page.locator('#open-file').set_input_files({'name':'round281-'+name+'.json','mimeType':'application/json','buffer':json.dumps(scene).encode()})
                page.wait_for_function("JSON.parse(window.__round36Snapshot()).scene3d.options.detail===24",timeout=30000)
                page.wait_for_function("() => !!document.querySelector('#drawing image[data-3d-raster]') || document.querySelectorAll('#drawing polygon').length > 10000",timeout=90000)
                page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=90000)
                polygons=page.locator('#drawing polygon').count()
                info=page.locator('#render-info').inner_text()
                raster=page.locator('#drawing image[data-3d-raster]')
                if raster.count():
                    raw=base64.b64decode(raster.get_attribute('href').split(',',1)[1])
                    assert raw.startswith(b'\x89PNG\r\n\x1a\n') and len(raw)>10000
                    digest=hashlib.sha256(raw).hexdigest()
                else:
                    assert polygons>=min_faces,(name,polygons,info)
                    digest='vector'
                assert 'PLOT LIMIT' not in info,(name,info)
                assert not errors,errors
                print('PASS ROUND281 CHROMIUM',json.dumps({'case':name,'polygons':polygons,'raster_sha256':digest,'info':info}),flush=True)
                page.close()
        finally: browser.close()
if __name__=='__main__':run()
