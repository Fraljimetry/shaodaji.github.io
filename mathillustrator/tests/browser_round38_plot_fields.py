"""Chromium Round38: five modes, parameter integrity, regions, vector/complex render and JSON/SVG/mobile."""
import json,os,time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def state(p):return json.loads(p.evaluate('window.__round36Snapshot()'))
def add(p,mode,x,y=None):
    p.locator('#plot-mode').select_option(mode)
    p.locator('#command').fill(x)
    if y is not None:p.locator('#command-y').fill(y)
    p.locator('#command-form button').click()
    return state(p)['objects'][-1]

def run():
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        try:
            p=browser.new_page(viewport={'width':1450,'height':850},accept_downloads=True)
            errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
            p.on('dialog',lambda d:d.accept())
            p.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            p.locator('#plot-mode option').first.wait_for(state='attached')
            assert p.locator('#plot-mode option').count()==5
            assert p.locator('#parameter-symbol').is_hidden()
            add(p,'function','2PI + 3e + xsin(x)')
            p.locator('#plot-mode').select_option('parametric')
            assert p.locator('#parameter-symbol').is_visible()
            assert p.locator('#parameter-symbol').input_value()=='t'
            p.locator('#parameter-symbol').select_option('u')
            p.locator('#command').fill('2u*cos(u)')
            p.locator('#command-y').fill('2u*sin(u)')
            p.locator('#command-form button').click()
            param=state(p)['objects'][-1]
            assert param['type']=='parametric' and param['parameter']=='u'
            assert p.locator('#properties').get_by_text('Parameter symbol').count()==1
            p.locator('#properties select[aria-label="Parameter symbol"]').select_option('v')
            param=state(p)['objects'][-1]
            assert param['parameter']=='v' and param['xExpr']=='2v*cos(v)' and param['yExpr']=='2v*sin(v)',param
            assert p.locator('#drawing path[data-id="'+param['id']+'"]').count()>0
            add(p,'implicit','x^2+y^2=4')
            assert p.locator('#properties').get_by_text('F(x, y) =',exact=True).count()==1
            field=add(p,'vectorField','-y','x')
            assert field['type']=='vectorField' and field['density']==12 and field['normalized'] is False
            assert field['region']['xMin']<field['region']['xMax']
            assert p.locator('#drawing path[data-id="'+field['id']+'"]').count()>=1
            # Draft changes must not alter the plotted region until Redraw is clicked.
            before=field['region'].copy()
            group=p.locator('.plot-region-editor')
            inputs=group.locator('input')
            inputs.nth(0).fill('-2');inputs.nth(1).fill('2');inputs.nth(2).fill('-3');inputs.nth(3).fill('3')
            assert state(p)['objects'][-1]['region']==before
            group.get_by_role('button',name='Redraw region').click()
            field=state(p)['objects'][-1]
            assert field['region']=={'xMin':-2,'xMax':2,'yMin':-3,'yMax':3},field
            p.locator('#properties input[type=checkbox]').last.check()
            assert state(p)['objects'][-1]['normalized'] is True
            add(p,'domainColoring','z^2+I')
            color=state(p)['objects'][-1]
            assert color['type']=='domainColoring' and color['region']['xMin']<0
            picture=p.locator('#drawing image[data-id="'+color['id']+'"]')
            assert picture.count()==1
            assert picture.get_attribute('href').startswith('data:image/png;base64,')
            p.locator('#properties select').last.select_option('contours')
            assert state(p)['objects'][-1]['colorMode']=='contours'
            # Undo / redo, native saved bytes and re-import.
            p.locator('#undo').click();assert state(p)['objects'][-1]['colorMode']=='phase-modulus'
            p.locator('#redo').click();assert state(p)['objects'][-1]['colorMode']=='contours'
            d=state(p)
            with p.expect_download() as dl:p.locator('#save').click()
            assert json.loads(dl.value.path().read_text())['objects']==d['objects']
            p.locator('#export-open').click()
            with p.expect_download() as dl:p.locator('#export-options button').filter(has_text='SVG').click()
            svg=dl.value.path().read_text()
            assert 'data:image/png;base64,' in svg and 'svg' in svg
            p.locator('#new').click()
            assert len(state(p)['objects'])==0
            p.locator('#open-file').set_input_files({'name':'fields.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
            # File input reads asynchronously; allow the actual replacement transaction to finish.
            for _ in range(20):
                if state(p)['objects']==d['objects']:break
                p.wait_for_timeout(100)
            assert state(p)['objects']==d['objects']
            p.locator('#ui-language').select_option('zh')
            assert '向量场' in p.locator('#plot-mode option').all_text_contents()
            assert '定义域着色' in p.locator('#plot-mode option').all_text_contents()
            p.set_viewport_size({'width':390,'height':820})
            assert p.locator('#plot-mode').count()==1
            assert not errors,errors
            print('PASS Round38 Chromium: 5 modes, parameter rename, 2D region apply, arrows, domain PNG image, style, JSON/SVG, undo/redo, ZH/mobile')
        finally:browser.close()
if __name__=='__main__':run()
