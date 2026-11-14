"""Round 37: actual Chromium palette geometry and recovered legacy default colors.
HTTP hosting, cloud caching and physical touch remain untested.
"""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd

ROOT=Path(__file__).resolve().parents[1]


def seed_document():
    d=json.loads((ROOT/'examples/geometry-demo.json').read_text())
    d['settings']['stroke']='#3657ad';d['settings']['fill']='#b6c9f9'
    # Preserve one deliberately existing blue object to test non-destructive recovery.
    existing=d['objects'][0]
    existing['style']['stroke']='#3657ad';existing['style']['fill']='#b6c9f9'
    return d


def fixture(seed=None):
    storage={'mathillustrator-project-v1':json.dumps(seed)} if seed else {}
    shim='''<script>(()=>{const data=SEED;Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:key=>Object.hasOwn(data,key)?data[key]:null,setItem:(key,value)=>data[key]=String(value),
      removeItem:key=>delete data[key],clear:()=>{for(const key of Object.keys(data))delete data[key]}
    }});})();</script>'''.replace('SEED',json.dumps(storage))
    return inline_html(legacy_search_expanded=False,expose_state=True).replace('<head>','<head>'+shim,1)


def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=browser.new_page(viewport={'width':1440,'height':850})
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('dialog',lambda d:d.accept())
            legacy=seed_document();old_obj=legacy['objects'][0]
            page.set_content(fixture(legacy),wait_until='load')
            page.locator('[data-tool-choice="polygon"]').wait_for(state='attached')
            assert page.locator('#default-stroke').input_value()=='#000000'
            assert page.locator('#default-fill').input_value()=='#000000'
            state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
            assert state()['objects'][0]['style']==old_obj['style'],'must not recolor an existing object'
            assert state()['objects'][0]['id']==old_obj['id']
            # Local storage isn't rewritten until a genuine edit, preserving conflict guarantees.
            raw=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
            assert json.loads(raw)['settings']['stroke']=='#3657ad'
            cmd(page,'Z=(12,15)')
            latest=state()['objects'][-1]
            assert latest['style']['stroke']==latest['style']['fill']=='#000000',latest
            assert state()['settings']['stroke']==state()['settings']['fill']=='#000000'
            # Exactly the requested construction glyphs changed; tool sizing is uniform.
            counts={'quadrilateral':4,'polygon':6,'ray':2,'line':2,'arrow':2}
            for name,num in counts.items():
                icon=page.locator(f'[data-tool-choice="{name}"] svg')
                assert icon.locator('circle').count()==num,(name,icon.inner_html())
                assert icon.get_attribute('viewBox')=='-1.5 -1.5 27 27'
            # All tool icons, including paths and circles close to the right edge,
            # must lie in the expanded viewBox at every panel width.
            def check_tiles():
                return page.locator('.tool svg').evaluate_all('''items=>items.map(svg=>{
                  const b=svg.getBBox(),box=svg.viewBox.baseVal;
                  return {tool:svg.closest('.tool')?.dataset.toolChoice,
                    bad:b.x-1<box.x||b.y-1<box.y||b.x+b.width+1>box.x+box.width||b.y+b.height+1>box.y+box.height,
                    bounds:[b.x,b.y,b.width,b.height],v:[box.x,box.y,box.width,box.height]};
                })''')
            for width in (1440,980,390):
                page.set_viewport_size({'width':width,'height':850})
                if width==390:
                    page.locator('#right-collapse').click()
                bad=[d for d in check_tiles() if d['bad']]
                assert not bad,(width,bad)
            assert not errors,errors
            print('PASS: Round37 Chromium icons, clipping across 1440/980/390px, legacy color migration, preserved styles')
        finally:
            browser.close()

if __name__=='__main__':run()
