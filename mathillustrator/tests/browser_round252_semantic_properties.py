"""Round 252: actual Chromium Properties-level semantic edits and generated edges."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1180,'height':820})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            algebra=page.locator('#unified-algebra-input')
            for expression in ['A = (0, 0)','B = (4, 0)','C = (0, 3)','Polygon(A,B,C)']:
                algebra.fill(expression);algebra.press('Enter')
            polygon=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='Polygon'))
            polygon.first.click()
            definition=page.get_by_label('Expression',exact=True)
            assert 'Polygon(A, B, C)' in definition.input_value()
            polygon_id=page.evaluate('''()=>JSON.parse(window.__round36Snapshot()).objects.find(x=>x.type==='polygon').id''')
            edge=page.evaluate('''()=>JSON.parse(window.__round36Snapshot()).objects.find(x=>x.edgeOf)''')
            assert edge, 'Polygon must generate owned edge objects'
            # Constructed edges are defined semantically but are not independently rewired.
            page.locator(f'#objects .object[data-id="{edge["id"]}"]').click()
            side=page.get_by_label('Expression',exact=True)
            assert 'Side(' in side.input_value()
            assert side.get_attribute('readonly') is not None
            page.locator(f'#objects .object[data-id="{polygon_id}"]').click()
            definition=page.get_by_label('Expression',exact=True)
            definition.fill(definition.input_value().replace('Polygon(A, B, C)','Polygon(A, C, B)'))
            definition.press('Tab')
            assert 'Polygon(A, C, B)' in page.get_by_label('Expression',exact=True).input_value()
            assert not errors,(theme,errors)
            page.close()
        print('ROUND252_BROWSER_SEMANTIC_PROPERTIES_PASS')
    finally: browser.close()
