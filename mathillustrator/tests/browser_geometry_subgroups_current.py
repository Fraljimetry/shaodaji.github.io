"""Round 14: source-inlined Chromium, geometry subgroups and interface-state safety.

Opaque-origin storage is represented with a deterministic shim; this is not a
live-domain persistence test. Real HTML drag and keyboard controls are covered.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_palette_sections_current import fixture, snapshot
from browser_smoke import cmd

LABELS=['Points & lines','Circles & conics','Polygons','Curves']
IDS=['points-lines','circles-conics','polygons','curves']
TOOLS=[['point','segment','arrow','line','angle'],['circle','ellipse'],['rectangle','polygon','regularPolygon'],['polyline','bezier']]

def order(page):
    return page.locator('#construction-tools > .geometry-subgroup').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.geometryGroup)')

def new_page(context,seed=None,errors=None):
    page=context.new_page();page.set_default_timeout(9000)
    if errors is not None:page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.set_content(fixture(seed),wait_until='load')
    page.wait_for_selector('#construction-tools [data-tool-choice="point"]')
    return page

def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
        errors=[];page=new_page(context,errors=errors)
        assert order(page)==IDS
        assert page.locator('#construction-tools > .geometry-subgroup > h4 .section-toggle > span:last-child').all_inner_texts()==LABELS
        assert page.locator('#construction-tools > .geometry-subgroup > h4 .section-toggle').count()==4
        assert page.locator('#construction-tools > .geometry-subgroup > h4 .section-drag-handle').count()==4
        assert page.locator('#construction-tools button[data-tool-choice]').count()==12
        assert page.locator('[data-tool-choice]').evaluate_all('(nodes)=>new Set(nodes.map(n=>n.dataset.toolChoice)).size===nodes.length')
        for category,tools in zip(IDS,TOOLS):
            assert page.locator(f'[data-geometry-group="{category}"] button[data-tool-choice]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.toolChoice)')==tools
        cmd(page,'A=(1,2)');original=snapshot(page)
        # Changes to one category do not change another or the parent.
        circles=page.locator('[data-geometry-group="circles-conics"]')
        toggle=circles.locator('> h4 > .section-toggle')
        toggle.click()
        assert toggle.get_attribute('aria-expanded')=='false'
        assert circles.locator('[data-tool-choice="circle"]').is_hidden()
        assert page.locator('[data-tool-choice="point"]').is_visible()
        assert page.locator('[data-section-id="geometry"] > h3 > .section-toggle').get_attribute('aria-expanded')=='true'
        assert snapshot(page)==original
        parent=page.locator('[data-section-id="geometry"] > h3 > .section-toggle')
        parent.click();assert page.locator('[data-tool-choice="point"]').is_hidden()
        parent.click();assert page.locator('[data-tool-choice="point"]').is_visible()
        assert circles.locator('[data-tool-choice="circle"]').is_hidden(), 'Nested collapse state lost'
        toggle.click()
        # Select an object then reorder a subgroup without altering active tool.
        page.locator('[data-tool-choice="point"]').click()
        assert page.locator('#drawing').get_attribute('data-tool')=='point'
        handle=circles.locator('> h4 > .section-drag-handle')
        handle.focus();handle.press('Alt+ArrowDown')
        assert order(page)==['points-lines','polygons','circles-conics','curves']
        assert page.locator('#drawing').get_attribute('data-tool')=='point'
        # Real HTML5 drag drops inside Geometry and cannot move a parent group.
        circles.locator('> h4 > .section-drag-handle').drag_to(
            page.locator('[data-geometry-group="points-lines"] > h4 > .section-toggle'),target_position={'x':15,'y':2})
        assert order(page)==['circles-conics','points-lines','polygons','curves']
        assert page.locator('#panel-sections > .toolgroup').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.sectionId)')==['basic','geometry','diagrams','illustration']
        assert snapshot(page)==original
        # Hide a category again and save UI preferences. Project JSON is unchanged.
        circles.locator('> h4 > .section-toggle').click()
        prefs=json.loads(page.evaluate('localStorage.getItem("mathillustrator-layout-v1")'))
        assert prefs['geometryGroups']==['circles-conics','points-lines','polygons','curves']
        assert prefs['collapsed']['geometry-circles-conics'] is True
        assert 'geometry-circles-conics' not in prefs['sections']
        assert snapshot(page)==original
        next_page=new_page(context,{'mathillustrator-layout-v1':json.dumps(prefs),
                                      'mathillustrator-project-v1':json.dumps(original)},errors)
        assert order(next_page)==['circles-conics','points-lines','polygons','curves']
        assert next_page.locator('[data-geometry-group="circles-conics"] [data-tool-choice="circle"]').is_hidden()
        assert next_page.locator('[data-geometry-group="points-lines"] [data-tool-choice="point"]').is_visible()
        assert snapshot(next_page)==original
        page.close();page=next_page
        # A malformed or old preference list is bounded and cannot remove any category.
        damaged={'geometryGroups':['curves','curves','bad',{},'points-lines'],'collapsed':{'geometry-curves':True}}
        legacy=new_page(context,{'mathillustrator-layout-v1':json.dumps(damaged)},errors)
        assert order(legacy)==['curves','points-lines','circles-conics','polygons']
        assert legacy.locator('[data-geometry-group="curves"] [data-tool-choice="bezier"]').is_hidden()
        assert legacy.locator('#construction-tools button[data-tool-choice]').count()==12
        legacy.close()
        # EN/ZH transitions and preference-first Chinese startup.
        page.locator('#ui-language').select_option('zh')
        assert page.locator('#construction-tools > .geometry-subgroup > h4 .section-toggle > span:last-child').all_inner_texts()==['圆与圆锥曲线','点与直线','多边形','曲线']
        assert '收起分区' in page.locator('[data-geometry-group="points-lines"] > h4 .section-toggle').get_attribute('aria-label')
        assert '调整分区' in page.locator('[data-geometry-group="points-lines"] > h4 .section-drag-handle').get_attribute('aria-label')
        pref2=json.loads(page.evaluate('localStorage.getItem("mathillustrator-layout-v1")'))
        chinese=new_page(context,{'mathillustrator-layout-v1':json.dumps(pref2)},errors)
        assert chinese.locator('[data-geometry-group="points-lines"] > h4 .section-toggle > span:last-child').inner_text()=='点与直线'
        chinese.locator('#ui-language').select_option('en')
        assert chinese.locator('[data-geometry-group="points-lines"] > h4 .section-toggle > span:last-child').inner_text()=='Points & lines'
        chinese.close()
        page.locator('#ui-language').select_option('en')
        for width in (1440,700,390,320):
            page.set_viewport_size({'width':width,'height':850})
            page.wait_for_timeout(120)
            if width<=700:page.evaluate('document.body.classList.add("mobile-right-open")')
            title=page.locator('[data-geometry-group="points-lines"] > h4 .section-toggle')
            assert title.is_visible(),width
            assert title.evaluate('el=>{const a=el.getBoundingClientRect(),b=el.closest(".rightpanel").getBoundingClientRect();return a.width>50&&a.left>=b.left-1&&a.right<=b.right+1;}'),width
            assert page.locator('[data-geometry-group="points-lines"] [data-tool-choice="point"]').is_visible(),width
        # Reject malformed imported JSON without touching scene or palette.
        before=snapshot(page)
        invalid=json.loads(json.dumps(before));invalid['settings']['modules']['construction']='bogus'
        page.locator('#open-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
        assert snapshot(page)==before
        assert order(page)==['circles-conics','points-lines','polygons','curves']
        assert not errors,errors
        browser.close()
    print('GEOMETRY_SUBGROUPS_PASS: four categories, keyboard/HTML drag, nested disclosure, prefs migration, EN/ZH, project invariants, import, 320–1440px')

if __name__=='__main__':run()
