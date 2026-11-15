"""Round 106: repeat 3D scene edits, camera orbit, 2D switches and heap/DOM sampling.

Runs actual application modules in offline Chromium. Bounded stress evidence,
not cross-device FPS or proof of memory-leak freedom.
"""
import json, os, statistics, time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

CYCLES = int(os.environ.get('MI_3D_BROWSER_CYCLES', '8'))
assert 4 <= CYCLES <= 40
HEAP_BUDGET_MIB = float(os.environ.get('MI_3D_BROWSER_HEAP_GROWTH_MIB', '96'))
DOM_BUDGET = int(os.environ.get('MI_3D_BROWSER_DOM_DRIFT', '1500'))


def run():
    with sync_playwright() as pw:
        exe = os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser = pw.chromium.launch(headless=True, args=['--no-sandbox'], **({'executable_path':exe} if exe else {}))
        try:
            page = browser.new_page(viewport={'width':1440,'height':900})
            page.set_default_timeout(30000)
            errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            page.on('dialog',lambda dialog: dialog.accept())
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
            finish=lambda:page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')", timeout=60000)
            page.locator('#scene3d-enable').check()
            page.locator('#plot-mode').select_option('surface3d')
            page.locator('#command').fill('sin(x)*cos(y)')
            page.locator('#command-form button').click();finish()
            assert len(state()['scene3d']['plots'])==1
            assert page.locator('#drawing polygon').count()>200
            base=state()
            cdp=page.context.new_cdp_session(page)
            cdp.send('Performance.enable')
            samples=[]; render_ms=[]
            for i in range(CYCLES):
                start=time.perf_counter()
                # Scene edits: change detail as well as yaw/pitch; avoid making new plots.
                detail=20+(i%4)*4
                page.locator('#scene3d-detail').fill(str(detail))
                page.locator('#scene3d-detail').dispatch_event('change')
                page.locator('#scene3d-yaw').fill(str(-115+(i*31)%220))
                page.locator('#scene3d-yaw').dispatch_event('change')
                page.locator('#scene3d-pitch').fill(str(-28+(i*13)%55))
                page.locator('#scene3d-pitch').dispatch_event('change')
                finish()
                # Mouse orbit, not merely changing setting fields.
                rect=page.locator('#drawing').bounding_box()
                cx=rect['x']+rect['width']*.50;cy=rect['y']+rect['height']*.50
                page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx+22,cy-12,steps=2);page.mouse.up()
                finish()
                assert page.locator('#drawing polygon').count()>50, f'missing 3D surface after orbit cycle {i}'
                assert len(state()['scene3d']['plots'])==1
                # 2D must clear stale 3D faces; returning must repopulate current scene.
                page.locator('#scene3d-enable').uncheck()
                page.wait_for_function('document.querySelectorAll("#drawing polygon").length===0')
                page.locator('#scene3d-enable').check();finish()
                assert page.locator('#drawing polygon').count()>50, f'3D surface not restored cycle {i}'
                assert len(state()['scene3d']['plots'])==1
                render_ms.append((time.perf_counter()-start)*1000)
                cdp.send('HeapProfiler.collectGarbage')
                metrics=cdp.send('Performance.getMetrics')['metrics']
                used=next((m['value'] for m in metrics if m['name']=='JSHeapUsedSize'),None)
                samples.append({'cycle':i,'heap':used,'nodes':page.evaluate('document.querySelectorAll("*").length'),'faces':page.locator('#drawing polygon').count()})
            assert not errors, errors
            nodes=[x['nodes'] for x in samples]
            assert max(nodes)-min(nodes) <= DOM_BUDGET, f'DOM growth {nodes}'
            heaps=[x['heap'] for x in samples if x['heap'] is not None]
            growth=(heaps[-1]-heaps[0])/1048576 if len(heaps)==CYCLES else None
            if growth is not None:
                assert growth <= HEAP_BUDGET_MIB, f'3D JS heap growth {growth:.2f} MiB > {HEAP_BUDGET_MIB}'
            assert state()['objects']==base['objects'], '3D interactions damaged 2D model'
            print(json.dumps({'round':106,'browser':'Chromium','cycles':CYCLES,'cameraOrbits':CYCLES,'modeSwitches':2*CYCLES,'faceRange':[min(x['faces'] for x in samples),max(x['faces'] for x in samples)],'domNodeRange':[min(nodes),max(nodes)],'postGCGrowthMiB':round(growth,2) if growth is not None else None,'medianCycleMs':round(statistics.median(render_ms),1),'pageErrors':errors,'passed':True},indent=2))
        finally: browser.close()

if __name__=='__main__':run()
