"""Round 102: deterministic real-Chromium editing transitions (seeded; no mock model)."""
import json, os, random
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

SEED=1022026
CASES=12

def main():
    rng=random.Random(SEED)
    with sync_playwright() as pw:
        exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
        try:
            page=browser.new_page(viewport={'width':1440,'height':900})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('dialog',lambda d:d.accept())
            page.set_default_timeout(15000)
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
            template=state()
            for i in range(CASES):
                # Rebuild a fresh valid document so every seeded trial is independent.
                coords=[rng.uniform(-2,2),rng.uniform(-1.6,1.6)]
                d=json.loads(json.dumps(template));d['objects']=[{'id':'o1','name':'Seed','type':'point','xy':coords,'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}}];d['nextId']=2
                page.locator('#open-file').set_input_files({'name':f'r102_{i}.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
                page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length===1')
                marker=page.locator('#drawing circle[data-id="o1"]');marker.wait_for(state='visible')
                b=marker.bounding_box();assert b is not None
                x=b['x']+b['width']/2;y=b['y']+b['height']/2
                before=state()['objects'][0]['xy']
                dx=rng.choice([-1,1])*rng.randint(24,55);dy=rng.choice([-1,1])*rng.randint(24,45)
                page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=6)
                if i%3==0:
                    page.keyboard.press('Escape');page.mouse.up()
                    assert state()['objects'][0]['xy']==before,f'seed={SEED} case={i} cancel did not restore point'
                else:
                    page.mouse.up()
                    changed=state()['objects'][0]['xy']
                    assert changed!=before,f'seed={SEED} case={i} drag did not commit'
                    page.locator('#undo').click()
                    assert state()['objects'][0]['xy']==before,f'seed={SEED} case={i} undo mismatch'
                    page.locator('#redo').click()
                    assert state()['objects'][0]['xy']==changed,f'seed={SEED} case={i} redo mismatch'
                assert not errors,f'seed={SEED} case={i} errors={errors}'
            print(f'ROUND102_CHROMIUM_PASS seed={SEED} cases={CASES} drag/cancel/undo/redo')
        finally:browser.close()

if __name__=='__main__':main()
