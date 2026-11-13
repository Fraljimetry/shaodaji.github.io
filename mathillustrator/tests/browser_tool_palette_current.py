"""Round 12: palette taxonomy and glyph semantics, isolated Chromium source fixture.

No production site, network, or physical touch device is involved.
"""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download


def snapshot(page):
    return json.loads(download(page, 'Save').read_text())


def run():
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        page.set_default_timeout(8000)
        failures=[]
        page.on('pageerror',lambda error: failures.append(str(error)))
        page.on('dialog',lambda dialog: dialog.accept())
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.wait_for_selector('[data-tool-choice="point"]')
        # Point belongs to Geometry; navigation stays usable when Basic legacy
        # settings are disabled. Existing serialized module IDs are not renamed.
        assert page.locator('#basic-tools [data-tool-choice="point"]').count()==0
        assert page.locator('#construction-tools [data-tool-choice="point"]').count()==1
        assert page.locator('#basic-tools [data-tool-choice="select"]').count()==1
        assert page.locator('#basic-tools [data-tool-choice="pan"]').count()==1
        assert page.locator('#module-basic').count()==0
        assert page.locator('.module-controls').count()==0
        assert page.locator('#panel-sections > .toolgroup').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.toolModule)')==['basic','construction','diagram','illustration']
        assert page.locator('[data-tool-module="illustration"] .section-toggle span').last.inner_text()=='Others'
        assert page.locator('[data-tool-module="illustration"]').get_attribute('data-section-id')=='illustration'
        assert page.locator('#construction-tools > .geometry-subgroup > h4 .section-toggle > span:last-child').all_inner_texts()==['Points & lines','Circles & conics','Polygons','Curves']
        assert page.locator('[data-tool-choice]').evaluate_all('(nodes)=>new Set(nodes.map(n=>n.dataset.toolChoice)).size===nodes.length')
        assert page.locator('button[data-tool-choice]').count()==18
        # Source SVG icons must use filled rather than outline marker circles.
        for name,min_markers in [('point',1),('segment',2),('circle',1),('polygon',4),('polyline',4),('angle',3),('regularPolygon',6),('bezier',2)]:
            marks=page.locator(f'[data-tool-choice="{name}"] svg circle[fill]')
            assert marks.count()>=min_markers, (name,marks.count())
            assert all(marks.nth(k).get_attribute('fill')=='currentColor' for k in range(marks.count())),name
            for position in marks.evaluate_all('(nodes)=>nodes.map(n=>[Number(n.getAttribute("cx")),Number(n.getAttribute("cy")),Number(n.getAttribute("r"))])'):
                x,y,r=position
                assert 0<=x-r and x+r<=24 and 0<=y-r and y+r<=24,(name,position)
        # Point placement via the moved button uses the original semantic type.
        page.locator('#construction-tools [data-tool-choice="point"]').click()
        assert page.locator('#drawing').get_attribute('data-tool')=='point'
        page.locator('#drawing').click(position={'x':220,'y':220})
        created=snapshot(page)
        assert any(o['type']=='point' for o in created['objects']),created['objects']
        # Disclosure hides only tool UI; it does not alter settings, objects,
        # current tool, or undo/redo history.
        before=snapshot(page)
        page.locator('[data-tool-module="construction"] > h3 > .section-toggle').click()
        assert page.locator('#construction-tools').is_hidden()
        assert page.locator('[data-tool-module="basic"]').is_visible()
        assert page.locator('#basic-tools [data-tool-choice="pan"]').is_visible()
        assert snapshot(page)==before
        page.locator('[data-tool-module="construction"] > h3 > .section-toggle').click()
        assert page.locator('#construction-tools').is_visible()
        # Legacy flag is read/retained but does not hide always-available Move/Pan.
        old=snapshot(page);old['settings']['modules']['basic']=False
        page.locator('#open-file').set_input_files({'name':'legacy.json','mimeType':'application/json','buffer':json.dumps(old).encode()})
        assert snapshot(page)['settings']['modules']['basic'] is False
        assert page.locator('#basic-tools [data-tool-choice="select"]').is_visible()
        assert page.locator('#basic-tools [data-tool-choice="pan"]').is_visible()
        assert page.locator('#construction-tools [data-tool-choice="point"]').is_visible()
        untouched=snapshot(page)
        invalid=json.loads(json.dumps(untouched));invalid['settings']['modules']['construction']='broken'
        page.locator('#open-file').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
        assert snapshot(page)==untouched,'Malformed import mutated project'
        # Chinese translation round-trips both new section/subgroup labels.
        page.locator('#ui-language').select_option('zh')
        assert page.locator('[data-tool-module="illustration"] .section-toggle span').last.inner_text()=='其他'
        assert page.locator('#construction-tools > .geometry-subgroup > h4 .section-toggle > span:last-child').all_inner_texts()==['点与直线','圆与圆锥曲线','多边形','曲线']
        assert page.locator('#construction-tools [data-tool-choice="point"]').get_attribute('aria-label')=='点'
        page.locator('#ui-language').select_option('en')
        assert page.locator('[data-tool-module="illustration"] .section-toggle span').last.inner_text()=='Others'
        # Sections remain scrollable and tool targets are not clipped at narrow widths.
        for width in (1440,700,390,320):
            page.set_viewport_size({'width':width,'height':860})
            page.wait_for_timeout(90)
            page.evaluate('w=>document.body.classList.toggle("mobile-right-open",w<=700)',width)
            target=page.locator('#construction-tools [data-tool-choice="point"]')
            assert target.is_visible(),width
            assert target.evaluate('el=>{const r=el.getBoundingClientRect(),p=el.closest(".rightpanel").getBoundingClientRect();return r.width>30 && r.left>=p.left-1 && r.right<=p.right+1;}'),width
        # The section retains its legacy drag-order key. This opaque-origin
        # fixture cannot exercise real localStorage persistence; verify the
        # stored key in the static DOM without claiming an origin-level test.
        assert page.locator('[data-tool-module="illustration"]').get_attribute('data-section-id')=='illustration'
        assert not failures,failures
        browser.close()
    print('TOOL_PALETTE_PASS: taxonomy, moved Point, filled markers, undo/redo, import rollback, EN/ZH, legacy flags, 320–1440px')


if __name__=='__main__':run()
