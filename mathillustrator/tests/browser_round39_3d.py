"""Round39: 3D isolation + 4 plot modes + view controls + persistence/export + 2D regression."""
import json,os,time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def saved(p):
    with p.expect_download() as d:p.locator('#save').click()
    import re
    assert re.fullmatch(r'mathillustrator_\d{8}_\d{6}\.json',d.value.suggested_filename),d.value.suggested_filename
    return json.loads(d.value.path().read_text())

def run():
    with sync_playwright() as pw:
        b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
        try:
            p=b.new_page(viewport={'width':1510,'height':900},accept_downloads=True)
            errors=[];p.on('pageerror',lambda err:errors.append(str(err)));p.on('dialog',lambda d:d.accept())
            p.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            p.wait_for_timeout(80)
            assert p.locator('#plot-mode option').count()==5
            # preserve 2D drawing through dimension switches
            p.locator('#command').fill('A=(2,pi)');p.locator('#command-form button').click()
            print('3D toggle visible?',p.locator('#scene3d-enable').is_visible(),flush=True)
            if not p.locator('#scene3d-enable').is_visible():
                s=p.locator('.controls:has(#scene3d-enable) .section-toggle');s.click()
            p.locator('#scene3d-enable').check()
            assert p.locator('html').get_attribute('class') and 'three-d' in p.locator('html').get_attribute('class')
            assert p.locator('.toolgroup:visible').count()==0
            assert p.locator('#plot-mode option').count()==5
            assert p.locator('#objects-3d').is_visible()
            def add(mode,a,b=None,c=None):
                p.locator('#plot-mode').select_option(mode)
                p.locator('#command').fill(a)
                if b is not None:p.locator('#command-y').fill(b)
                if c is not None:p.locator('#command-z').fill(c)
                p.locator('#command-form button').click()
                return saved(p)['scene3d']['plots'][-1]
            a=add('surface3d','sin(x)*cos(y)');assert a['kind']=='surface3d'
            bplot=add('parametric3d','cos(u)*sin(v)','sin(u)*sin(v)','cos(v)');assert bplot['kind']=='parametric3d'
            c=add('implicit3d','x^2+y^2+z^2=4');assert c['kind']=='implicit3d'
            d=add('vector3d','-y','x','z');assert d['kind']=='vector3d'
            assert p.locator('#objects-3d .object').count()==4
            assert p.locator('#drawing polygon').count()>50
            baseline=saved(p)
            p.locator('#objects-3d .object').first.click();assert p.locator('#properties').get_by_text('Arrow density').count()==1
            p.locator('#properties input[type=number]').last.fill('0.72')
            p.locator('#properties input[type=number]').last.dispatch_event('change')
            p.locator('#scene3d-projection').select_option('orthographic')
            assert saved(p)['scene3d']['options']['projection']=='orthographic'
            p.locator('#undo').click();assert saved(p)['scene3d']['options']['projection']=='perspective'
            p.locator('#redo').click();assert saved(p)['scene3d']['options']['projection']=='orthographic'
            with p.expect_download() as dl:p.locator('#export-open').click();p.locator('#export-options button').filter(has_text='SVG').click()
            assert '<polygon' in dl.value.path().read_text()
            with p.expect_download(timeout=35000) as bitmap:
                p.locator('#export-open').click()
                p.locator('#export-options button').filter(has_text='PNG').click()
            assert bitmap.value.path().read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
            p.locator('#scene3d-enable').uncheck()
            assert p.locator('#plot-mode option').count()==5
            assert len(saved(p)['objects'])==1
            p.locator('#scene3d-enable').check()
            project=saved(p)
            p.locator('#new').click();assert len(saved(p)['scene3d']['plots'])==0
            p.locator('#open-file').set_input_files({'name':'restored.json','mimeType':'application/json','buffer':json.dumps(project).encode()})
            assert len(saved(p)['scene3d']['plots'])==4
            assert p.locator('#plot-mode option').count()==5
            p.locator('#ui-language').select_option('zh')
            p.set_viewport_size({'width':390,'height':810})
            assert p.locator('#drawing').count()==1
            assert not errors, errors
            print('PASS ROUND39_CHROMIUM_3D: 4 modes, model, bounds, SVG/JSON, history, isolation, mobile ZH',flush=True)
        finally:b.close()
if __name__=='__main__':run()
