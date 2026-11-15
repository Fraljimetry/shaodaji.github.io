"""Round 92: real Chromium transactional history/state-machine browser checks."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
    with sync_playwright() as pw:
        exe = os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser = pw.chromium.launch(headless=True, args=['--no-sandbox'], **({'executable_path':exe} if exe else {}))
        try:
            page = browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
            errors=[]
            page.on('pageerror',lambda err:errors.append(str(err)))
            page.on('dialog',lambda dialog:dialog.accept())
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            page.set_default_timeout(20000)
            snap=lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
            original=snap()
            assert not page.locator('#undo').is_enabled() and not page.locator('#redo').is_enabled()

            def document(n):
                d=json.loads(json.dumps(original))
                d['meta']['title']=f'R92 state {n}'
                d['objects']=[]
                for i in range(n):
                    d['objects'].append({'id':f'o{i+1}', 'name':f'Point {i}', 'type':'point', 'xy':[i+1,i+2], 'hidden':False,'locked':False,
                                         'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}})
                d['nextId']=n+1
                return d

            def load(d):
                page.locator('#open-file').set_input_files({'name':'r92.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
                page.wait_for_function('(count)=>JSON.parse(window.__round36Snapshot()).objects.length===count',arg=len(d['objects']))
                assert snap()['objects']==d['objects']

            def go(btn,want):
                assert page.locator('#'+btn).is_enabled(),btn
                page.locator('#'+btn).click()
                page.wait_for_function('(count)=>JSON.parse(window.__round36Snapshot()).objects.length===count',arg=want)
                assert len(snap()['objects'])==want

            # Multi-step states, traversals, redo and branch invalidation.
            load(document(1));load(document(2));load(document(3))
            for n in (2,1,0):go('undo',n)
            assert not page.locator('#undo').is_enabled()
            for n in (1,2,3):go('redo',n)
            assert not page.locator('#redo').is_enabled()
            go('undo',2);go('undo',1)
            load(document(4))
            assert not page.locator('#redo').is_enabled(), 'New successful edit must invalidate redo'
            go('undo',1);go('redo',4)

            # Rejected import must preserve state *and* its undo/redo stacks.
            before=snap()
            page.locator('#open-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{ invalid JSON !!!'})
            page.wait_for_timeout(150)
            assert snap()==before,'Rejected edit corrupted document'
            assert page.locator('#undo').is_enabled() and not page.locator('#redo').is_enabled()
            go('undo',1)
            assert page.locator('#redo').is_enabled()
            before=snap()
            page.locator('#open-file').set_input_files({'name':'invalid2.json','mimeType':'application/json','buffer':b'{"objects":"bad"}'})
            page.wait_for_timeout(150)
            assert snap()==before,'Rejected validation corrupted document'
            assert page.locator('#redo').is_enabled(),'Rejected edit cleared redo'
            go('redo',4)
            with page.expect_download() as dl:page.locator('#save').click()
            assert json.loads(dl.value.path().read_text())['objects']==document(4)['objects']
            assert not errors, errors
            print('ROUND92_CHROMIUM_PASS multi-step undo/redo, divergent edit, invalid imports, state preservation, export')
        finally:
            browser.close()

if __name__=='__main__': main()
