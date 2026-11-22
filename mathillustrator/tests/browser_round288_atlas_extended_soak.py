"""Round 288: bounded real Chromium atlas redraw and memory soak, no release-wide claim."""
import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

FIXTURE=Path(__file__).parent/'fixtures/mathillustrator_advanced_geometry_atlas.json'

def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--enable-precise-memory-info','--js-flags=--expose-gc'])
        try:
            page=browser.new_page(viewport={'width':1600,'height':960})
            errors=[];page.on('pageerror', lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
            t0=time.perf_counter()
            page.set_content(inline_html(expose_state=True,legacy_search_expanded=False))
            page.locator('#open-file').set_input_files(str(FIXTURE))
            page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length === 136')
            page.locator('#fit').click()
            source=json.loads(FIXTURE.read_text())
            assert len({o['type'] for o in source['objects']})==39
            ids={o['id'] for o in source['objects']}
            assert sum(len(o.get('refs',[])) for o in source['objects'])==212
            assert all(ref in ids for o in source['objects'] for ref in o.get('refs',[]))
            rendered=set(page.locator('#drawing [data-id]').evaluate_all('(els)=>els.map(e=>e.dataset.id)'))
            assert ids.issubset(rendered),('missing rendered IDs',sorted(ids-rendered))
            page.locator('#objects [data-slider="t"] .slider-play-toggle').click()
            snapshots=[];values=set();max_nodes=0
            for i in range(400):
                page.evaluate('(v)=>document.documentElement.dataset.theme=v','dark' if i%2 else 'light')
                if i%10==0:page.locator('#fit').click()
                if i%20==0:
                    snap=page.evaluate('''() => {
                      if(typeof gc==='function')gc();
                      const d=JSON.parse(window.__round36Snapshot());
                      return {objects:d.objects.length, refs:d.objects.map(o=>o.refs||[]),
                        heap:performance.memory?.usedJSHeapSize??null,slider:d.algebra.sliders[0].value,
                        nodes:document.querySelectorAll('#drawing [data-id]').length};
                    }''')
                    assert snap['objects']==136,(i,snap['objects'])
                    assert 136<=snap['nodes']<=500,(i,snap['nodes'])
                    snapshots.append(snap)
                    values.add(round(snap['slider'],3));max_nodes=max(max_nodes,snap['nodes'])
                page.wait_for_timeout(15)
            page.locator('#objects [data-slider="t"] .slider-play-toggle').click()
            assert len(values)>=3,values
            assert not errors,errors
            heaps=[x['heap'] for x in snapshots]
            if all(h is not None for h in heaps):
                # Report samples, not a universal leak-free guarantee.
                print('HEAP_MB', [round(h/1048576,2) for h in heaps[::4]],flush=True)
            print('ROUND288_ATLAS_SOAK_PASS',{'iterations':400,'snapshots':len(snapshots),'slider_values':len(values),'max_nodes':max_nodes,'elapsed_seconds':round(time.perf_counter()-t0,2),'page_errors':len(errors)},flush=True)
        finally:browser.close()

if __name__=='__main__':main()
