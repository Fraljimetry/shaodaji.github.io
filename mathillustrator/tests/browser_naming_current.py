"""Round 8: naming settings, compatibility and rollback in isolated Chromium."""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download


def saved(page):
    return json.loads(download(page,'Save').read_text())


def draw_point(page, x=0.5, y=0.5):
    box=page.locator('#drawing').bounding_box()
    page.locator('[data-tool-choice="point"]').click()
    page.mouse.click(box['x']+box['width']*x, box['y']+box['height']*y)


def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('dialog',lambda dialog:dialog.accept())
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.wait_for_function("document.querySelector('[data-tool-choice=point]') !== null")
        naming=page.locator('#naming-convention')
        assert naming.input_value()=='pascal'
        draw_point(page,.42,.5)
        assert saved(page)['objects'][0]['name']=='Point 1'
        naming.select_option('snake')
        draw_point(page,.57,.52)
        doc=saved(page)
        assert doc['objects'][1]['name']=='point 2' and doc['settings']['namingConvention']=='snake'
        naming.select_option('camel')
        draw_point(page,.65,.45)
        doc=saved(page)
        assert [o['name'] for o in doc['objects']]==['Point 1','point 2','point 3']
        assert [o['id'] for o in doc['objects']]==['o1','o2','o3']
        page.locator('#undo').click()
        assert len(saved(page)['objects'])==2
        page.locator('#redo').click()
        assert saved(page)['objects'][2]['name']=='point 3'
        # A setting itself participates in history without renaming existing objects.
        naming.select_option('pascal')
        page.locator('#undo').click()
        assert naming.input_value()=='camel' and saved(page)['objects'][0]['name']=='Point 1'
        page.locator('#redo').click()
        assert naming.input_value()=='pascal'
        for locale, visible in [('zh','对象命名'),('en','Object naming'),('zh','对象命名'),('en','Object naming')]:
            page.locator('#ui-language').select_option(locale)
            assert visible in page.locator('label:has(#naming-convention)').inner_text()
        page.locator('#ui-language').select_option('en')
        # Export/reopen should preserve both the convention and existing mixed names.
        original=saved(page)
        page.locator('#open-file').set_input_files({'name':'saved.json','mimeType':'application/json','buffer':json.dumps(original).encode()})
        page.wait_for_timeout(70)
        assert saved(page)==original and naming.input_value()=='pascal'
        invalid=json.loads(json.dumps(original));invalid['settings']['namingConvention']='__invalid__'
        page.locator('#open-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
        page.wait_for_timeout(70)
        assert saved(page)==original,'invalid setting import must not replace live project'
        # Legacy projects must preserve old naming even as new editor defaults change.
        legacy=json.loads(json.dumps(original));legacy['settings'].pop('namingConvention')
        page.locator('#open-file').set_input_files({'name':'legacy.json','mimeType':'application/json','buffer':json.dumps(legacy).encode()})
        page.wait_for_timeout(70)
        assert naming.input_value()=='camel'
        assert saved(page)['objects']==original['objects']
        draw_point(page,.76,.6)
        assert saved(page)['objects'][-1]['name']=='point 4'
        assert not errors,errors
        browser.close()
    print('NAMING_BROWSER_PASS: controls, modes, no retroactive rename, undo/redo, locale, import/export, malformed rollback')

if __name__=='__main__':run()
