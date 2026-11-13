"""Round 10 / R21 compact appearance controls; isolated Chromium fixture, not hosted-site verification."""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download, cmd


def snapshot(page):
    return json.loads(download(page,'Save').read_text())


def assert_grid(page, selector, has_fill, has_pointsize, width):
    metrics=page.locator(selector).evaluate('''grid => {
      const names=['stroke','fill','width','opacity','pointsize'];
      const box=grid.getBoundingClientRect(), out={outer:[box.x,box.y,box.width,box.height],columns:getComputedStyle(grid).gridTemplateColumns};
      for(const n of names){const node=grid.querySelector('.style-'+n);if(!node)continue;
        const r=node.getBoundingClientRect();out[n]={x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width};}
      out.overflow=[...grid.querySelectorAll('input,.color-swatch')].some(input => input.getBoundingClientRect().right>box.right+1 || input.getBoundingClientRect().left<box.left-1);
      return out;
    }''')
    assert 'stroke' in metrics and 'width' in metrics and 'opacity' in metrics, metrics
    assert ('fill' in metrics)==has_fill and ('pointsize' in metrics)==has_pointsize, metrics
    assert len(metrics['columns'].split())==2,(width, metrics)
    assert not metrics['overflow'],(width, metrics)
    assert metrics['stroke']['width']>=65,(width, metrics)
    assert metrics['width']['width']>=65,(width, metrics)
    assert abs(metrics['width']['y']-metrics['opacity']['y'])<=1,(width, metrics)
    assert metrics['width']['x']<metrics['opacity']['x'],(width, metrics)
    if has_fill:
        if selector.startswith('#properties'):
            assert metrics['fill']['y']>metrics['stroke']['y'],(width, metrics)
        else:
            assert abs(metrics['stroke']['y']-metrics['fill']['y'])<=1,(width, metrics)
            assert metrics['stroke']['x']<metrics['fill']['x'],(width, metrics)
    if has_pointsize:
        assert metrics['pointsize']['y']>metrics['opacity']['y'],(width,metrics)


def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        page.set_default_timeout(8000)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:d.accept())
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.wait_for_function("!!document.querySelector('[data-tool-choice=point]')")
        default='.rightpanel .style-controls-grid'
        object_grid='#properties .style-controls-grid'
        assert page.locator(default).count()==1
        assert_grid(page,default,True,True,1440)
        # Native controls keep the same IDs, value bounds and undoable transactions.
        page.locator('#default-width').fill('4.5');page.locator('#default-width').dispatch_event('change')
        page.locator('#default-opacity').fill('0.6');page.locator('#default-opacity').dispatch_event('change')
        page.locator('#default-stroke').fill('#13579b');page.locator('#default-stroke').dispatch_event('change')
        assert snapshot(page)['settings']['width']==4.5
        assert snapshot(page)['settings']['opacity']==.6
        assert snapshot(page)['settings']['stroke']=='#13579b'
        page.locator('#undo').click()
        assert snapshot(page)['settings']['stroke']!='#13579b'
        page.locator('#redo').click()
        assert snapshot(page)['settings']['stroke']=='#13579b'
        # Newly created points deliberately have no Fill property.
        cmd(page,'P=(1,2)')
        page.locator('#objects .object').first.click()
        assert_grid(page,object_grid,False,True,1440)
        assert page.locator('#properties [data-color-swatches="object"] button').count()==10
        assert page.locator(object_grid+' input').evaluate_all('nodes => nodes.map(n => n.closest(".style-slot")?.className)') == ['style-slot style-stroke','style-slot style-width','style-slot style-opacity','style-slot style-pointsize'], 'Tab order must follow visible row order'
        # Width, opacity and point size remain in the same input pipeline.
        node=page.locator(object_grid)
        node.locator('.style-width input').fill('3');node.locator('.style-width input').dispatch_event('change')
        node=page.locator(object_grid)
        node.locator('.style-opacity input').fill('0.3');node.locator('.style-opacity input').dispatch_event('change')
        node=page.locator(object_grid)
        node.locator('.style-pointsize input').fill('8');node.locator('.style-pointsize input').dispatch_event('change')
        changed=snapshot(page)
        assert changed['objects'][-1]['style']['width']==3
        assert changed['objects'][-1]['style']['opacity']==.3
        assert changed['objects'][-1]['style']['pointSize']==8
        page.locator('#undo').click();assert snapshot(page)['objects'][-1]['style']['pointSize']!=8
        page.locator('#redo').click();assert snapshot(page)['objects'][-1]['style']['pointSize']==8
        # A filled shape exposes both palette columns; references and type stay unchanged.
        cmd(page,'Q=(3,3)')
        cmd(page,'Rectangle(P,Q)')
        page.locator('#objects .object').first.click()
        assert_grid(page,object_grid,True,False,1440)
        assert page.locator('#properties [data-color-swatches="object"] button').count()==20
        swatch=page.locator('#properties [data-color-swatches="object"][data-color-property="fill"] button[data-color="#ef4444"]')
        swatch.click()
        assert snapshot(page)['objects'][-1]['style']['fill']=='#ef4444'
        # Failed numeric edit and invalid import do not affect saved project state.
        good=snapshot(page)
        page.locator(object_grid+' .style-width input').fill('101')
        page.locator(object_grid+' .style-width input').dispatch_event('change')
        assert snapshot(page)==good
        bad=json.loads(json.dumps(good));bad['settings']['opacity']=-2
        page.locator('#open-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
        assert snapshot(page)==good
        page.locator('#open-file').set_input_files({'name':'good.json','mimeType':'application/json','buffer':json.dumps(good).encode()})
        assert snapshot(page)==good
        page.locator('#objects .object').first.click() # JSON import intentionally clears selection
        for locale,label in [('zh','新对象外观'),('en','New object appearance'),('zh','新对象外观'),('en','New object appearance')]:
            page.locator('#ui-language').select_option(locale)
            assert page.locator(default).get_attribute('aria-label')==label
            assert page.locator(object_grid).get_attribute('aria-label')==('对象外观' if locale=='zh' else 'Object appearance')
        for width in (1440,700,390,320):
            page.set_viewport_size({'width':width,'height':860})
            page.wait_for_timeout(110)  # Responsive breakpoint handler closes drawers asynchronously.
            if width<=700:
                page.evaluate('document.body.classList.add("mobile-right-open","mobile-left-open")')
            else:
                page.evaluate('document.body.classList.remove("mobile-right-open","mobile-left-open")')
            assert_grid(page,default,True,True,width)
            assert_grid(page,object_grid,True,False,width)
            assert not page.evaluate('''() => [...document.querySelectorAll('.style-controls-grid input')].some(e => e.getBoundingClientRect().width>180)''')
        # Locked objects do not expose edit controls in the compact layout.
        page.set_viewport_size({'width':1440,'height':900})
        page.evaluate('document.body.classList.remove("mobile-right-open","mobile-left-open")')
        page.locator('#objects .object').first.locator('.object-menu-toggle').click()
        page.locator('#object-action-menu button[data-action="lock"]').click()
        page.locator('#objects .object').first.click()
        assert page.locator(object_grid).count()==0
        assert not errors, errors
        browser.close()
    print('STYLE_GRID_PASS: layout, color/width/opacity/point radius, JSON/undo/rollback, locale, 320px mobile, locking')


if __name__=='__main__':run()
