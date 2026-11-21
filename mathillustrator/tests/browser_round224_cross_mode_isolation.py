"""Round 224: cross-mode regression for implicit-3D classes of failures.

Checks current application in headless Chromium, without a hosted server.
No wall-clock speed threshold is imposed; reported timings are diagnostics.
"""
import base64
import hashlib
import json
import os
import time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

CASES_2D = [
    ('function', 'sin(15*x)/(1+x*x)', None),
    ('parametric', 'cos(5*t)', 'sin(7*t)'),
    ('implicit', 'x^2-y^2=1', None),
    ('vectorField', '-y', 'x'),
    ('domainColoring', 'z^2+1', None),
]
CASES_3D = [
    ('surface3d', 'sin(x)*cos(y)', None, None),
    ('parametric3d', 'cos(u)*sin(v)', 'sin(u)*sin(v)', 'cos(v)'),
    ('vector3d', '-y', 'x', 'z'),
    ('domain3d', 'z^2+1', None, None),
    ('implicit3d', 'x^2+y^2+z^2=4', None, None),
]

def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            page=browser.new_page(viewport={'width':1280,'height':800}, accept_downloads=True)
            page.set_default_timeout(20000)
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('dialog',lambda d:d.accept())
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=60000)
            state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
            def finish():page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=60000)
            def add(mode,a,b=None,c=None):
                page.locator('#plot-mode').select_option(mode)
                page.locator('#command').fill(a)
                if b is not None:page.locator('#command-y').fill(b)
                if c is not None:page.locator('#command-z').fill(c)
                t=time.monotonic()
                page.locator('#command-form button').click()
                finish()
                return round((time.monotonic()-t)*1000)
            report={}
            for mode,a,b in CASES_2D:
                before=len(state()['objects'])
                ms=add(mode,a,b)
                assert len(state()['objects'])==before+1,(mode,before,len(state()['objects']))
                assert not errors,(mode,errors)
                report[mode]={'render_ms':ms,'objects':len(state()['objects'])}
            # Singular 2D fields must not fabricate zero sets; malformed input must roll back.
            before=len(state()['objects'])
            add('implicit','x^2+y^2+1')
            absent=state()['objects'][-1]['id']
            assert page.locator(f'#drawing path[data-id="{absent}"]').first.get_attribute('d')=='', 'Nonzero 2D field drew a false contour'
            snapshot=state()['objects']
            page.locator('#plot-mode').select_option('function')
            page.locator('#command').fill('unknown(x)')
            page.locator('#command-form button').click()
            assert state()['objects']==snapshot, 'Invalid formula changed existing plots'
            assert len(snapshot)==before+1
            doc2d=state()['objects']
            assert page.locator('#drawing path').count()>2
            assert page.locator('#drawing image').count()>=1
            # These remain independently editable when switching to 3D.
            page.locator('#scene3d-enable').check()
            for mode,a,b,c in CASES_3D:
                before=len(state()['scene3d']['plots'])
                ms=add(mode,a,b,c)
                assert len(state()['scene3d']['plots'])==before+1,(mode,len(state()['scene3d']['plots']),errors)
                assert not errors,(mode,errors)
                report[mode]={'render_ms':ms,'plots':len(state()['scene3d']['plots'])}
            assert state()['objects']==doc2d,'3D editing mutated 2D objects'
            assert sum(not p['hidden'] for p in state()['scene3d']['plots'])<=3
            # Turn all but the surface off, and test high-density camera cancellation.
            page.locator('#new').click()
            page.locator('#scene3d-enable').check() if not page.locator('#scene3d-enable').is_checked() else None
            add('surface3d','sin(x)*cos(y)')
            page.locator('#scene3d-detail').fill('80')
            page.locator('#scene3d-detail').dispatch_event('change')
            finish()
            raster=page.locator('#drawing image[data-3d-raster]')
            assert raster.count()==1, 'Dense explicit surface must rasterize'
            def digest():
                href=raster.get_attribute('href')
                assert href and href.startswith('data:image/png;base64,')
                return hashlib.sha256(base64.b64decode(href.split(',',1)[1])).hexdigest()
            original=digest()
            for yaw in (-80,22,90,-40,65):
                page.locator('#scene3d-yaw').fill(str(yaw))
                page.locator('#scene3d-yaw').dispatch_event('change')
            finish()
            assert state()['scene3d']['options']['yaw']==65
            current=digest()
            assert current!=original,'Explicit surface camera image remained stale'
            # Settled rerender must be deterministic.
            page.locator('#scene3d-yaw').fill('10')
            page.locator('#scene3d-yaw').dispatch_event('change')
            finish()
            page.locator('#scene3d-yaw').fill('65')
            page.locator('#scene3d-yaw').dispatch_event('change')
            finish()
            assert digest()==current,'Explicit surface image differs for the same camera and scene'
            page.locator('#scene3d-yaw').fill('110')
            page.locator('#scene3d-yaw').dispatch_event('change')
            page.locator('#scene3d-enable').uncheck()
            assert raster.count()==0,'Obsolete 3D image appeared in 2D mode'
            page.wait_for_timeout(150)
            assert raster.count()==0
            page.locator('#scene3d-enable').check()
            finish()
            assert raster.count()==1
            assert not errors,errors
            print('ROUND224_CROSS_MODE_PASS '+json.dumps(report,sort_keys=True),flush=True)
        finally:browser.close()

if __name__=='__main__':run()
