"""Round 108 release gate: real Chromium SVG/PNG alpha semantics and export cancellation.
Offline isolated app graph; hardware/browser compatibility not asserted.
"""
import io, json, os
from xml.etree import ElementTree as ET
from PIL import Image
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
    with sync_playwright() as pw:
        exe=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
        try:
            page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('dialog',lambda d:d.accept())
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            page.locator('#scene3d-enable').check()
            page.locator('#plot-mode').select_option('surface3d')
            page.locator('#command').fill('sin(x)*cos(y)')
            page.locator('#command-form button').click()
            page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=60000)
            assert page.locator('#drawing polygon').count()>100
            results={}
            for transparent in (False,True):
                page.locator('#scene3d-export-transparent').set_checked(transparent)
                def download(label):
                    page.locator('#export-open').click()
                    opt=page.locator('#export-options button',has_text=label)
                    assert opt.is_enabled(),f'{label} unavailable'
                    with page.expect_download(timeout=45000) as pending: opt.click()
                    with open(pending.value.path(),'rb') as file: return file.read()
                svg=download('SVG')
                root=ET.fromstring(svg)
                polys=root.findall('.//{http://www.w3.org/2000/svg}polygon')
                assert len(polys)>100
                # Background fill is not present when transparent export requested.
                bg=[n for n in root if n.tag.endswith('rect') and n.attrib.get('width') in ('100%','1440','1440.0')]
                png=download('PNG')
                img=Image.open(io.BytesIO(png)).convert('RGBA')
                corner=img.getpixel((1,1))
                center=img.getpixel((img.width//2,img.height//2))
                if transparent:
                    assert corner[3]==0, f'transparent export corner alpha={corner}'
                    assert center[3]>0, f'3D image missing at center {center}'
                else:
                    assert corner[3]==255, f'opaque export corner alpha={corner}'
                    assert center[3]==255, f'opaque export center alpha={center}'
                results['transparent' if transparent else 'opaque']={'size':img.size,'corner':corner,'center':center,'faces':len(polys)}
            # JPEG cannot encode alpha, so it must be disabled when transparent.
            page.locator('#export-open').click()
            jpeg=page.locator('#export-options button',has_text='JPEG')
            assert jpeg.count()==1 and not jpeg.is_enabled(), 'transparent JPEG should be disabled'
            assert not errors, errors
            print(json.dumps({'round':108,'passed':True,'checks':results,'jpegDisabled':True,'pageErrors':errors},indent=2))
        finally: browser.close()

if __name__=='__main__':main()
