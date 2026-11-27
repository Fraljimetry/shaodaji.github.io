"""Prevent deleted constructions from silently attaching to another project's IDs."""
import json, os
from playwright.sync_api import sync_playwright
from browser_round45_3d_trash_storage import html, STORAGE, TRASH

def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            page = browser.new_page(viewport={'width':1440,'height':900})
            page.on('dialog', lambda d:d.accept())
            page.route("https://**/*", lambda route: route.abort())
            page.set_default_timeout(8000)
            page.set_content(html({}), wait_until='load')
            snapshot = lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
            for cmd in ['A=(0,0)','B=(4,0)','s=Segment(A,B)']:
                field=page.locator('#unified-algebra-input');field.fill(cmd);field.press('Enter')
            segment=snapshot()['objects'][-1]
            row=page.locator('#objects .object[data-id="'+segment['id']+'"]');row.click();row.focus();page.keyboard.press('Delete')
            original=snapshot()
            assert len(original['objects'])==2
            other=json.loads(json.dumps(original));other['meta']['title']='Other project';other['objects'][0]['xy']=[10,10];other['objects'][1]['xy']=[20,20]
            for obj in other["objects"]: obj.pop("xyExpr",None)
            page.locator('#open-file').set_input_files({'name':'other.json','mimeType':'application/json','buffer':json.dumps(other).encode()})
            page.wait_for_function("JSON.parse(window.__round36Snapshot()).meta.title==='Other project'")
            page.locator('#trash-items button').first.evaluate('e=>e.click()')
            assert len(snapshot()['objects'])==2, 'Deleted segment silently attached to unrelated points'
            assert page.locator('#trash-count').text_content()=='1'
            stored=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',TRASH))
            assert stored[0]['detachedDependencies'] is True
            reload=browser.new_page(viewport={'width':1440,'height':900})
            reload.route('https://**/*', lambda route: route.abort())
            reload.set_content(html({STORAGE:json.dumps(other),TRASH:json.dumps(stored)}),wait_until='load')
            reload.locator('#trash-items button').first.evaluate('e=>e.click()')
            assert len(json.loads(reload.evaluate('window.__round36Snapshot()'))['objects'])==2
            assert reload.locator('#trash-count').text_content()=='1'
            reload.close()
            page.locator('#undo').click()
            assert snapshot()['meta']==original['meta']
            page.locator('#trash-items button').first.evaluate('e=>e.click()')
            assert snapshot()['objects'][-1]==segment
            assert page.locator('#trash-count').text_content()=='0'
            page.locator('#undo').click()
            assert len(snapshot()['objects'])==2 and page.locator('#trash-count').text_content()=='1'
            page.locator('#redo').click()
            assert snapshot()['objects'][-1]==segment and page.locator('#trash-count').text_content()=='0'
            print('ROUND335_CHROMIUM_PASS: cross-project dependency guard and restore undo/redo')
        finally: browser.close()
if __name__=='__main__':run()
