"""Round 287: Chromium pixel equivalence between native SVG export and PNG export.
Do not compare different scene states: import must finish and slider stays paused.
"""
import base64
import io
import os
from pathlib import Path
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

FIXTURE = Path(__file__).parent / 'fixtures/mathillustrator_advanced_geometry_atlas.json'

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            page = browser.new_page(viewport={'width':1600,'height':960},accept_downloads=True)
            page.set_default_timeout(20000)
            errors=[]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('dialog', lambda d: d.accept())
            page.set_content(inline_html(expose_state=True,legacy_search_expanded=False))
            page.locator('#open-file').set_input_files(str(FIXTURE))
            page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length === 136')
            for theme in ('light','dark'):
                page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
                page.locator('#fit').click()
                exports={}
                for fmt in ('SVG','PNG'):
                    page.locator('#export-open').click()
                    with page.expect_download(timeout=45000) as dl:
                        page.locator('#export-options button').filter(has_text=fmt).click()
                    exports[fmt]=Path(dl.value.path()).read_bytes()
                assert exports['SVG'].count(b'data-id="')>=136, (theme,'incomplete SVG')
                png=Image.open(io.BytesIO(exports['PNG'])).convert('RGBA')
                # Re-rasterize exactly the user-visible SVG bytes using the same
                # Chromium engine as the application's PNG-export path.
                encoded=page.evaluate('''async ({src,w,h}) => {
                    const img = new Image(); img.src = src; await img.decode();
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'white'; ctx.fillRect(0,0,w,h);
                    ctx.drawImage(img,0,0,w,h);
                    return canvas.toDataURL('image/png').split(',')[1];
                }''', {'src':'data:image/svg+xml;base64,'+base64.b64encode(exports['SVG']).decode(),'w':png.width,'h':png.height})
                rasterized=Image.open(io.BytesIO(base64.b64decode(encoded))).convert('RGBA')
                diff=ImageChops.difference(png,rasterized)
                assert diff.getbbox() is None, (theme, 'PNG differs from SVG rasterization',diff.getbbox())
                print('ROUND287_EXPORT_PIXEL_PASS',theme,png.size,len(exports['SVG']),len(exports['PNG']),flush=True)
            assert not errors,errors
        finally:
            browser.close()

if __name__=='__main__':main()
