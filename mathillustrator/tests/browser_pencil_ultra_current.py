"""Current isolated Chromium regression for stabilized Ultra Smooth and pencil mark."""
from pathlib import Path
import json
import tempfile
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download

ROOT=Path(__file__).resolve().parents[1]

def run():
    for asset in ('pencil-mark.svg','pencil-cover.svg'):
        root=ET.parse(ROOT/'assets'/asset).getroot()
        assert root.attrib['viewBox']
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:d.accept())
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.wait_for_timeout(150)
        brand=page.locator('.brand .brandmark')
        assert brand.get_attribute('src')=='./assets/pencil-mark.svg'
        assert page.locator('.brand').inner_text().endswith('MathIllustrator')
        assert page.locator('#correction option[value="ultra"]').inner_text()=='Ultra-smooth'
        page.locator('#correction').select_option('ultra')
        page.locator('[data-tool-choice="freehand"]').click()
        stage=page.locator('#drawing').bounding_box()
        x=stage['x']+80;y=stage['y']+stage['height']*.53
        page.mouse.move(x,y)
        page.mouse.down()
        for i in range(1,115):
            page.mouse.move(x+i*2.5,y+(4 if i%2 else -4))
        draft=page.locator('.draft-freehand')
        assert draft.count()==1
        assert draft.get_attribute('d').startswith('M')
        assert 'C' in draft.get_attribute('d'), 'preview should use committed cubic representation'
        page.mouse.up()
        assert page.locator('#object-count').inner_text()=='1'
        assert page.locator('#drawing path[data-id]').count()>=1
        page.locator('#export-open').click()
        exported=json.loads(download(page,'JSON project').read_text())
        assert exported['settings']['correction']=='ultra'
        obj=exported['objects'][0]
        assert obj['type']=='freehand' and 2<len(obj['path'])<=4096
        assert all(len(pt)==2 for pt in obj['path'])
        # Undo / redo is a full path transaction; not a hidden second copy.
        page.locator('#undo').click()
        assert page.locator('#object-count').inner_text()=='0'
        page.locator('#redo').click()
        assert page.locator('#object-count').inner_text()=='1'
        page.locator('#export-open').click()
        svg=download(page,'SVG').read_text()
        assert '<path' in svg and 'NaN' not in svg and 'Infinity' not in svg
        assert not errors,errors
        browser.close()
    print('PENCIL_ULTRA_BROWSER_PASS: pencil markup, ultra draw/preview, export, undo/redo')

if __name__=='__main__':
    run()
