"""Round 232 contract, maintained for the unified Objects/Algebra interface.

The separate Algebra tab was intentionally retired in Round 237. Exercise the
same shared dock, named geometry, slider properties, and splitter via Objects.
"""
import os, json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            page = browser.new_page(viewport={'width': 1280, 'height': 850})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.set_content(inline_html(legacy_search_expanded=False, expose_state=True), wait_until='load')
            snapshot = lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
            def enter(value):
                field = page.locator('#unified-algebra-input')
                field.fill(value)
                field.press('Enter')
            for expression in ('a = Slider(0,10,0.5,3)', 'A = (0,0)', 'B = (a,0)', 's = Segment(A,B)'):
                enter(expression)
            assert any(o['name'] == 's' and o['type'] == 'segment' for o in snapshot()['objects'])
            assert page.locator('#objects [data-id]').count() == 3
            assert page.locator('#objects [data-slider="a"]').count() == 1
            def sizes():
                return page.evaluate('''() => {
                  const a=document.querySelector('#objects').getBoundingClientRect(),
                        p=document.querySelector('#properties-dock').getBoundingClientRect();
                  return {aBottom:a.bottom,pTop:p.top,pBottom:p.bottom,pHeight:p.height,viewport:innerHeight};
                }''')
            box = sizes()
            assert abs(box['aBottom'] - box['pTop']) < 45, box
            assert box['pHeight'] >= 100 and box['pBottom'] <= box['viewport'] + 3, box
            page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
            border = page.locator('#properties .slider-border-control')
            assert border.count() == 1
            assert page.locator('#properties .style-opacity').evaluate('(x) => x.contains(document.querySelector(".slider-border-control"))')
            assert border.bounding_box()['y'] > page.locator('#properties .style-opacity input[type=text]').bounding_box()['y']
            before = sizes()['pHeight']
            page.locator('#properties-toggle').click()
            assert page.locator('#properties').is_hidden()
            collapsed = sizes()
            assert collapsed['pHeight'] < before/2, collapsed
            page.locator('#properties-toggle').click()
            assert page.locator('#properties').is_visible()
            assert abs(sizes()['pHeight'] - before) < 5, (before, sizes())
            split = page.locator('#properties-splitter')
            old = sizes()['pHeight']
            split.focus()
            page.keyboard.press('ArrowUp')
            assert sizes()['pHeight'] > old, (old, sizes())
            previous = sizes()['pHeight']
            rect = split.bounding_box()
            page.mouse.move(rect['x']+rect['width']/2, rect['y']+rect['height']/2)
            page.mouse.down()
            page.mouse.move(rect['x']+rect['width']/2, rect['y']-35, steps=5)
            page.mouse.up()
            assert sizes()['pHeight'] > previous + 15, (previous, sizes())
            sid = next(o['id'] for o in snapshot()['objects'] if o['name'] == 's')
            page.locator('#objects [data-id="'+sid+'"] .object-label').click()
            assert page.locator('#properties').get_by_label('Name').input_value() == 's'
            # Find should not modify the shared geometry or panel sizing.
            prior = snapshot()
            page.locator('#object-input-toggle').click()
            page.locator('#object-search').fill('s')
            assert page.locator('#objects [data-id]').count() == 1
            page.locator('#object-input-toggle').click()
            assert page.locator('#objects [data-id]').count() == 3
            assert snapshot() == prior
            assert not errors, errors
            print('ROUND232_UNIFIED_OBJECTS_PARITY_CHROMIUM_PASS')
        finally:
            browser.close()

if __name__ == '__main__':
    run()
