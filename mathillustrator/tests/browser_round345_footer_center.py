"""Save feedback stays at the canvas midpoint as coordinate/render text changes."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
# Exercise the actual footer markup and stylesheet without unrelated app startup.
html = (ROOT / 'index.html').read_text(encoding='utf8')
footer = html[html.index('<div class="canvas-footer">'):].split('</div>', 1)[0] + '</div>'
css = (ROOT / 'style.css').read_text(encoding='utf8')
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page()
        page.set_content(f'<style>{css}</style><div class="stage" style="height:200px">{footer}</div>')
        for viewport, width in [(1440, 800), (950, 460), (768, 300), (390, 300)]:
            page.set_viewport_size({'width': viewport, 'height': 500})
            page.locator('.stage').evaluate('(el,w)=>el.style.width=w+"px"', width)
            for saved in ['Saved locally', '已保存到本地']:
                page.locator('#autosave-info').evaluate('(el,s)=>el.textContent=s', saved)
                for message in ['Ready', '1 3D plots · rendering…', '3D rendering failed · previous view preserved', '正在渲染三维图形…']:
                    page.locator('#render-info').evaluate('(el,s)=>el.textContent=s', message)
                    page.locator('#coords').evaluate('(el)=>el.textContent="x -123456.78 · y 123456.78"')
                    f = page.locator('.canvas-footer').bounding_box()
                    s = page.locator('#autosave-info').bounding_box()
                    r = page.locator('#render-info').bounding_box()
                    assert abs(s['x'] + s['width']/2 - f['x'] - f['width']/2) < 1, (viewport, saved, message, f, s)
                    assert s['x'] + s['width'] <= r['x'] + 1, (s,r)
        print('32 footer center and non-overlap checks passed')
    finally:
        browser.close()
