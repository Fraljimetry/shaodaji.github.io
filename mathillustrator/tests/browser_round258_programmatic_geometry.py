"""Real Chromium verification for Algebra construction parity and Properties round trip."""
from playwright.sync_api import sync_playwright
import re
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1250,'height':820})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
            entry=page.locator('#unified-algebra-input')
            def enter(text):
                entry.fill(text);entry.press('Enter')
                assert not entry.input_value(),(text,entry.input_value())
            for cmd in ('A = (0, 0)','B = (4, 0)','C = (0, 5)','L = Line(A, B)','K = Circle(A, C)',
                        'T = TriangleCenter(A, B, C, centerKind="centroid")',
                        'S = PointOnObject(L, parameter=0.25)',
                        'R = Rotate(C, A, amount=0.5)',
                        'M = CircleDiameter(A, B)',
                        'N = Node(1, 2, "a, b")',
                        'X = Text(1, 3, "x")'):
                enter(cmd)
            row=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text=re.compile(r'^T$')))
            assert row.count()==1
            row.click()
            exp=page.get_by_label('Expression',exact=True)
            assert exp.input_value()=='TriangleCenter(A, B, C, centerKind="centroid")',exp.input_value()
            page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text=re.compile(r'^A$'))).click()
            name=page.get_by_label('Name',exact=True)
            name.fill('Alpha');name.press('Enter')
            page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text=re.compile(r'^T$'))).click()
            exp=page.get_by_label('Expression',exact=True)
            assert 'Alpha' in exp.input_value(),exp.input_value()
            before=page.locator('#objects .object').count()
            entry.fill('BAD = TriangleCenter(Alpha, L, C)');entry.press('Enter')
            assert page.locator('#objects .object').count()==before
            assert errors==[],errors
            page.close()
        print('ROUND258_PROGRAMMATIC_GEOMETRY_BROWSER_PASS')
    finally:browser.close()
