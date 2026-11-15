"""Round 107: real Chromium 3D SVG/PNG/JSON exports after edits.

Offline isolated application module graph. This checks exported bytes, not just
button enablement or DOM state. It is not a hosted-site or GPU-device test.
"""
import io, json, os, struct, hashlib
from xml.etree import ElementTree as ET
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

CYCLES = int(os.environ.get('MI_3D_EXPORT_CYCLES','3'))
assert 2 <= CYCLES <= 12

def main():
    with sync_playwright() as pw:
        exe=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
        try:
            context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('dialog',lambda d:d.accept())
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
            finish=lambda:page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=60000)
            page.locator('#scene3d-enable').check()
            page.locator('#plot-mode').select_option('surface3d')
            page.locator('#command').fill('sin(x)*cos(y)')
            page.locator('#command-form button').click();finish()
            assert len(state()['scene3d']['plots'])==1
            results=[]; svg_digests=set()
            def export(label):
                page.locator('#export-open').click()
                option=page.locator('#export-options button',has_text=label)
                assert option.count()==1 and option.is_enabled(), f'{label} disabled unexpectedly'
                with page.expect_download(timeout=45000) as pending:
                    option.click()
                dl=pending.value
                with open(dl.path(),'rb') as f:data=f.read()
                assert data, f'{label} produced empty download'
                return dl.suggested_filename,data
            for i in range(CYCLES):
                detail=18+i*4
                yaw=-65+i*31
                page.locator('#scene3d-detail').fill(str(detail))
                page.locator('#scene3d-detail').dispatch_event('change')
                page.locator('#scene3d-yaw').fill(str(yaw))
                page.locator('#scene3d-yaw').dispatch_event('change')
                finish()
                assert page.locator('#drawing polygon').count()>50
                before=state()
                svg_name,svg=export('SVG')
                assert svg_name.endswith('.svg')
                root=ET.fromstring(svg)
                polys=root.findall('.//{http://www.w3.org/2000/svg}polygon')
                assert len(polys)>50, f'SVG export is missing 3D faces: {len(polys)}'
                digest=hashlib.sha256(svg).hexdigest()
                assert digest not in svg_digests, '3D export remained stale after camera/detail edit'
                svg_digests.add(digest)
                png_name,png=export('PNG')
                assert png_name.endswith('.png') and png[:8]==b'\x89PNG\r\n\x1a\n', 'invalid PNG output'
                width,height=struct.unpack('>II',png[16:24])
                assert width>300 and height>200 and width*height<36_000_001
                json_name,raw=export('JSON project')
                saved=json.loads(raw)
                assert json_name.endswith('.json')
                assert saved['scene3d']==before['scene3d'] and saved['settings']==before['settings'], 'JSON export lost 3D scene or settings'
                assert state()==before, 'export unexpectedly mutated document state'
                results.append({'cycle':i,'svgFaces':len(polys),'png':[width,height],'svgBytes':len(svg),'pngBytes':len(png)})
            assert not errors,errors
            print(json.dumps({'round':107,'chromium':'isolated','cycles':CYCLES,'exports':3*CYCLES,'results':results,'pageErrors':errors,'passed':True},indent=2))
        finally: browser.close()

if __name__=='__main__':main()
