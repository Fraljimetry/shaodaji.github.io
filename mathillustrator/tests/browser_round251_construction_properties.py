"""Round 251 regression: visual parity, editable expressions and name propagation."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1180,'height':820})
            failures=[];page.on('pageerror',lambda e:failures.append(str(e)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
            field=page.locator('#unified-algebra-input')
            field.fill('sin')
            css=page.evaluate('''()=>{const inp=getComputedStyle(document.querySelector('#unified-algebra-input'));
              const option=getComputedStyle(document.querySelector('#unified-algebra-input-suggestions .input-assist-option'));
              const selected=getComputedStyle(document.querySelector('#unified-algebra-input-suggestions [data-selected=true]'));
              return {field:inp.color,option:option.color,selected:selected.color,background:selected.backgroundColor};}''')
            assert css['field']==css['option']==css['selected'],(theme,css)
            for command in ['A = (0, 0)','B = (3, 1)','C = (1, 4)','Segment(A, B)']:
                field.fill(command);field.press('Enter')
            assert page.locator('#objects .object-label small').count()==0
            assert page.locator('#objects [data-id]').count()==4
            segment=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='Segment'))
            segment.click()
            definition=page.get_by_label('Expression',exact=True)
            assert 'Segment(A, B)' in definition.input_value(),definition.input_value()
            definition.fill(definition.input_value().replace('Segment(A, B)','Segment(A, C)'))
            definition.press('Tab')
            assert 'Segment(A, C)' in page.get_by_label('Expression',exact=True).input_value()
            b=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='B'))
            b.click()
            name=page.get_by_label('Name',exact=True)
            name.fill('Beta');name.press('Tab')
            segment=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='Segment'))
            segment.click()
            # Re-point the construction at the renamed point.
            definition=page.get_by_label('Expression',exact=True)
            definition.fill(definition.input_value().replace('Segment(A, C)','Segment(A, Beta)'))
            definition.press('Tab')
            assert 'Segment(A, Beta)' in page.get_by_label('Expression',exact=True).input_value()
            assert not failures,(theme,failures)
            page.close()
        print('ROUND251_BROWSER_CONSTRUCTION_PROPERTIES_PASS')
    finally: browser.close()
