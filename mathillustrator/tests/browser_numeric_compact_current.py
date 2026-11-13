"""Round 11: bounded numeric controls fit content without altering transactions.

Isolated Chromium source fixture (not a live hosted-site test).
"""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download


def project(page):
    return json.loads(download(page, 'Save').read_text())


def check_compact(page, selector, max_width, viewport):
    rect = page.locator(selector).first.evaluate('''el => {
      const e=el.getBoundingClientRect();const host=el.closest('.style-slot')||el.closest('.field')||el.parentElement;
      const h=host.getBoundingClientRect();const panel=el.closest('.rightpanel,.properties').getBoundingClientRect();
      return {width:e.width,x:e.x,right:e.right, hostRight:h.right,panelRight:panel.right,
        font:getComputedStyle(el).fontSize,visible:getComputedStyle(el).display!=='none'};
    }''')
    assert rect['visible'] and 67 <= rect['width'] <= max_width, (viewport,selector,rect)
    assert rect['right'] <= rect['hostRight'] + 1 and rect['right'] <= rect['panelRight'] + 1, (viewport,selector,rect)
    return rect


def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        page.set_default_timeout(7500)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:d.accept())
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.wait_for_function("!!document.querySelector('[data-tool-choice=point]')")
        defaults=['#polygon-sides','#snap-step','#default-width','#default-opacity','#point-size','#theme','#export-scale']
        widths={'#polygon-sides':96,'#snap-step':126,'#default-width':100,'#default-opacity':100,'#point-size':100,'#theme':98,'#export-scale':126}
        for selector in defaults: check_compact(page,selector,widths[selector],1440)
        cmd(page,'P=(1,2)')
        page.locator('#objects .object').first.click()
        for selector in ('#properties .style-width input','#properties .style-opacity input','#properties .style-pointsize input'):
            check_compact(page,selector,100,1440)
        # The change is CSS-only, including native number stepping, input mode and label bindings.
        assert page.locator('#polygon-sides').get_attribute('min')=='3'
        assert page.locator('#polygon-sides').get_attribute('max')=='100'
        assert page.locator('#polygon-sides').get_attribute('type')=='number'
        assert page.locator('#snap-step').get_attribute('step')=='any'
        page.locator('#polygon-sides').fill('100');page.locator('#polygon-sides').dispatch_event('change')
        page.locator('#snap-step').fill('0.000001');page.locator('#snap-step').dispatch_event('change')
        page.locator('#default-opacity').fill('0.05');page.locator('#default-opacity').dispatch_event('change')
        snap=project(page)
        assert snap['settings']['polygonSides']==100 and snap['settings']['snapStep']==.000001, snap['settings']
        assert snap['settings']['opacity']==.05
        page.locator('#undo').click();assert project(page)['settings']['opacity']!=.05
        page.locator('#redo').click();assert project(page)['settings']['opacity']==.05
        # Bad value must not persist, even when a compact field is used.
        page.locator('#polygon-sides').fill('2');page.locator('#polygon-sides').dispatch_event('change')
        assert project(page)==snap
        # Undo/redo intentionally clears selection; reselect the live object.
        page.locator('#objects .object').first.click()
        # Properties remain numeric and undoable.
        page.locator('#properties .style-width input').fill('4.5')
        page.locator('#properties .style-width input').dispatch_event('change')
        assert project(page)['objects'][-1]['style']['width']==4.5
        page.locator('#undo').click(); assert project(page)['objects'][-1]['style']['width']!=4.5
        page.locator('#redo').click(); assert project(page)['objects'][-1]['style']['width']==4.5
        # Undo/redo intentionally clears selection; restore it for the next probe.
        page.locator('#objects .object').first.click()
        # Legacy long text fields and coordinate inputs are deliberately not constrained.
        coord=page.locator('#properties .twocol input[type=number]').first
        assert coord.evaluate('(el)=>getComputedStyle(el).width')
        assert coord.evaluate('(el)=>el.getBoundingClientRect().width')>=105
        # Larger/negative numeric values fit their compact box for morphism controls.
        cmd(page,'N=Node(0,0,"N")');cmd(page,'M=Node(3,0,"M")');cmd(page,'Morphism(N,M,"f")')
        page.locator('#objects .object').first.click()
        shift=page.locator('#properties label.field').filter(has_text='Label shift X (px)').locator('input')
        assert shift.count()==1
        check_compact(page,'#properties > .field input[type=number]',118,1440)  # pending validate count
        shift.fill('-300');shift.dispatch_event('change')
        assert project(page)['objects'][-1]['labelDx']==-300
        before=project(page)
        bad=json.loads(json.dumps(before));bad['settings']['opacity']=-1
        page.locator('#open-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
        assert project(page)==before
        # Localization and viewport changes must not stretch short fields.
        for locale in ('zh','en'):
            page.locator('#ui-language').select_option(locale)
            for viewport in (1440,700,390,320):
                page.set_viewport_size({'width':viewport,'height':860})
                page.wait_for_timeout(85)  # matchMedia transition closes drawers asynchronously
                page.evaluate('w=>{document.body.classList.toggle("mobile-right-open",w<=700);document.body.classList.toggle("mobile-left-open",w<=700);}',viewport)
                for selector in defaults:
                    check_compact(page,selector,widths[selector],viewport)
                for selector in ('#properties .style-width input','#properties .style-opacity input'):
                    check_compact(page,selector,100,viewport)
        assert not errors, errors
        browser.close()
    print('NUMERIC_COMPACT_PASS: 320–1440px, EN/ZH, defaults, properties, values, undo/redo, bad input/import')


if __name__=='__main__':run()
