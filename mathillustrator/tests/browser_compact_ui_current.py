"""Compact-toolbar and geometry glyph contract. Isolated Chromium, not hosted-site proof."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download


def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'),
            headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('dialog', lambda dialog: dialog.accept())
        page.set_content(inline_html(), wait_until='load')
        page.wait_for_function("!!document.querySelector('[data-tool-choice=\"arrow\"]')")
        assert page.locator('[data-tool-choice="arrow"]').inner_text() == 'Vector'
        for name in ('undo', 'redo', 'new', 'open', 'save', 'tikzcd-open', 'export-open'):
            button = page.locator('#' + name)
            assert button.get_attribute('aria-label'), name
            assert button.get_attribute('title'), name
            assert button.bounding_box()['width'] <= 42, name
            assert button.locator('svg.action-icon').count() == 1, name
        assert page.locator('#object-search-toggle').bounding_box()['width'] <= 42
        assert page.locator('#object-search').is_visible()  # legacy test fixture deliberately expands search
        # Viewbox metrics catch the previously cropped Bézier endpoint circles
        # and prevent regression to the crossed-line/triangle-like glyphs.
        for name in ('bezier', 'line', 'angle', 'point', 'segment', 'regularPolygon'):
            ext = page.locator(f'[data-tool-choice="{name}"] svg').evaluate(
                '(svg) => {const b=svg.getBBox();return [b.x,b.y,b.x+b.width,b.y+b.height]}')
            assert ext[0] >= 0.85 and ext[1] >= 0.85 and ext[2] <= 23.15 and ext[3] <= 23.15, (name,ext)
        assert page.locator('[data-tool-choice="bezier"] circle[fill="currentColor"]').count() == 2
        assert page.locator('[data-tool-choice="point"] circle[fill="currentColor"]').count() == 1
        assert page.locator('[data-tool-choice="segment"] circle[fill="currentColor"]').count() == 2
        assert page.locator('[data-tool-choice="regularPolygon"] circle[fill="currentColor"]').count() == 1
        # Keep serialized legacy Arrow geometry despite the user-facing Vector label.
        for source in ('A=(0,0)', 'B=(2,1)', 'Arrow(A,B)'):
            cmd(page, source)
        assert page.locator('#object-count').inner_text() == '3'
        page.locator('#object-search').fill('arrow')
        assert page.locator('#objects .object').count() == 1
        page.locator('#object-search').fill('')
        page.locator('#undo').click()
        assert page.locator('#object-count').inner_text() == '2'
        page.locator('#redo').click()
        assert page.locator('#object-count').inner_text() == '3'
        page.locator('#export-open').click()
        assert '<svg' in download(page, 'SVG').read_text()
        for locale,expected in [('zh','向量'),('en','Vector'),('zh','向量'),('en','Vector')]:
            page.locator('#ui-language').select_option(locale)
            assert page.locator('[data-tool-choice="arrow"]').inner_text() == expected
        for width in (700,390,320):
            page.set_viewport_size({'width':width,'height':800})
            assert page.locator('#export-open').is_visible(), width
            assert page.locator('#export-open').bounding_box()['width'] <= 42, width
            assert page.locator('#drawing').is_visible(), width
        assert not errors, errors
        browser.close()
        print('COMPACT_UI_BROWSER_PASS: toolbar, glyph bounds, vector locale, filter, undo/redo, export, responsive controls')


if __name__ == '__main__':
    run()
