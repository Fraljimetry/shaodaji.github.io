"""v390: real Chromium geometry and event regression for Meticulous OCR context UI.
No network, models, or synthetic claims about recognition accuracy.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
css = (root / 'mathreader.css').read_text(encoding='utf-8')
core = (root / 'js' / '00-core.js').read_text(encoding='utf-8')
start = core.index('let manualPageIndexOcrMenu = null;')
end = core.index('\nasync function ensurePdfJs()', start)
menu_source = core[start:end]
assert 'function installManualPageIndexOcrMenu()' in menu_source

def check_menu(page, x, y, expected_page):
    page.locator(f'[data-page="{expected_page}"] .page-surface').evaluate('(e,xy) => e.dispatchEvent(new MouseEvent("contextmenu", {bubbles:true,cancelable:true,button:2,clientX:xy.x,clientY:xy.y}))', {'x':x, 'y':y})
    menu = page.locator('.page-ocr-context-menu')
    assert menu.count() == 1, 'a single menu appears'
    assert menu.get_attribute('role') == 'menu'
    assert menu.locator('[role="menuitem"]').count() == 1
    assert menu.inner_text().strip() == f'Meticulous OCR · page {expected_page}'
    geometry = menu.evaluate('''e => {const b=e.getBoundingClientRect(), s=getComputedStyle(e); return {left:b.left,top:b.top,right:b.right,bottom:b.bottom,position:s.position,zIndex:Number(s.zIndex),background:s.backgroundColor}}''')
    assert geometry['position'] == 'fixed', geometry
    assert geometry['zIndex'] >= 100, geometry
    viewport = page.viewport_size
    assert 7 <= geometry['left'] <= viewport['width']-16, geometry
    assert 7 <= geometry['top'] <= viewport['height']-16, geometry
    assert geometry['right'] <= viewport['width']-7, geometry
    assert geometry['bottom'] <= viewport['height']-7, geometry
    assert abs(geometry['left'] - min(x, viewport['width'] - (geometry['right']-geometry['left'])-8)) < 1.2, geometry
    return geometry

html = '''<!DOCTYPE html><html data-theme="light"><head><style>__CSS__</style></head>
<body><div class="pdf-pane" style="height:560px;width:650px;margin:40px auto">
<div class="pane-label">Reading</div>
<div class="canvas-wrap" id="primary-canvas-wrap"><div class="continuous-page-frame" data-page="231"><div class="page-surface" style="width:520px;height:1100px;background:white;color:black">Appendix A</div></div></div>
</div></body></html>'''.replace('__CSS__', css)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':960,'height':720})
    page.set_content(html)
    page.evaluate('''source => {
       window.pdfDoc={numPages:253}; window.currentPage=231; window.manualPageOcrBusy=false;
       window.documentOcrBusy=false; window.structureIndexBuilding=false;
       window.equationIndexBuildPromise=null; window.equationImageAssistPromise=null;
       window.documentTextFeaturesAvailable=()=>true;
       window.primaryCanvasWrap=document.getElementById('primary-canvas-wrap');
       window.t=(en, zh)=>document.documentElement.dataset.lang==='zh'?zh:en;
       window.runs=[];
       window.runMeticulousPageIndexOcr=async n=>window.runs.push(n);
       (0,eval)(source + '\\nwindow.v390ocr={installManualPageIndexOcrMenu,closeManualPageIndexOcrMenu,getStatus:()=>manualPageIndexOcrStatus,getMenu:()=>manualPageIndexOcrMenu};');
       window.v390ocr.installManualPageIndexOcrMenu();
    }''',menu_source)
    pane = page.locator('.pdf-pane')
    initial_grid = pane.evaluate('e=>getComputedStyle(e).gridTemplateRows')
    reader = page.locator('#primary-canvas-wrap')
    reader.evaluate('e=>e.scrollTop=220')
    initial_scroll = reader.evaluate('e=>e.scrollTop')
    initial_bounds = reader.bounding_box()
    geometry = check_menu(page, 445, 260, 231)
    assert abs(geometry['left']-445)<1
    assert abs(geometry['top']-260)<1
    assert reader.evaluate('e=>e.scrollTop') == initial_scroll
    assert pane.evaluate('e=>getComputedStyle(e).gridTemplateRows') == initial_grid
    page.keyboard.press('Escape')
    assert page.locator('.page-ocr-context-menu').count()==0
    check_menu(page, 952, 712, 231)
    page.locator('.page-ocr-context-menu button').click()
    assert page.locator('.page-ocr-context-menu').count()==0
    assert page.evaluate('window.runs')==[231]
    page.evaluate('window.manualPageOcrBusy=true')
    check_menu(page, 340, 260, 231)
    assert page.locator('.page-ocr-context-menu button').is_disabled()
    page.mouse.click(750,40)
    assert page.locator('.page-ocr-context-menu').count()==0
    page.evaluate('window.manualPageOcrBusy=false; document.documentElement.dataset.theme="dark"')
    dark = check_menu(page, 445, 260, 231)
    assert dark['background'] != geometry['background'], 'dark and light use theme variables'
    # Status is an overlay, not a third grid track; no shift in page geometry.
    page.evaluate('''() => { const status=window.v390ocr.getStatus();status.textContent='Page 231 · 2 entries added · 0 removed';status.classList.remove('is-hidden') }''')
    status = page.locator('.page-ocr-status')
    assert status.is_visible()
    assert status.evaluate('e=>getComputedStyle(e).position')=='absolute'
    assert status.evaluate('e=>getComputedStyle(e).pointerEvents')=='none'
    assert reader.evaluate('e=>e.scrollTop')==initial_scroll
    assert pane.evaluate('e=>getComputedStyle(e).gridTemplateRows')==initial_grid
    after_bounds = reader.bounding_box()
    assert after_bounds == initial_bounds, (initial_bounds,after_bounds)
    assert status.bounding_box()['x']>=pane.bounding_box()['x']
    assert status.bounding_box()['y']>=pane.bounding_box()['y']
    print('PASS: Meticulous OCR menu position, edge clamp, real click, Escape, disabled, light/dark, absolute status, scroll/layout conservation (20+ assertions)')
    browser.close()
