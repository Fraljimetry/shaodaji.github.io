"""Round 17 UI refinements: actual Chromium DOM + synthetic cancel/drop boundary events.
Isolated source-inlined fixture; never represents live deployment verification.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download


def snapshot(page):
    return json.loads(download(page,'Save').read_text())


def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.wait_for_function('document.querySelectorAll(".section-drag-handle").length >= 10')
        assert page.locator('#settings-open').count()==0
        for text in ['A=(0,0)','B=(3,1)','Segment(A,B)']:cmd(page,text)
        first=snapshot(page)
        page.locator('#objects .object[data-id="o3"]').click()
        assert page.locator('#properties .mini-help').count()==0
        assert page.locator('#properties .style-stroke').is_visible()
        toggle=page.locator('#objects .object[data-id="o1"] .object-menu-toggle')
        toggle.click()
        actions=page.locator('#object-action-menu button')
        assert actions.count()==3
        assert page.locator('#object-action-menu svg').count()==3
        assert all(not actions.nth(i).inner_text().strip() for i in range(3))
        assert [actions.nth(i).get_attribute('aria-label') for i in range(3)]==['Hide','Lock','Delete']
        actions.first.hover()
        assert actions.first.evaluate('el=>getComputedStyle(el,"::after").content')=='"Hide"'
        actions.nth(1).focus()
        page.keyboard.press('ArrowRight')
        assert actions.nth(2).evaluate('(el)=>document.activeElement===el')
        page.keyboard.press('Escape')
        assert page.locator('#object-action-menu').is_hidden()
        page.locator('#ui-language').click()
        toggle=page.locator('#objects .object[data-id="o1"] .object-menu-toggle')
        toggle.click()
        assert [page.locator('#object-action-menu button').nth(i).get_attribute('aria-label') for i in range(3)]==['隐藏','锁定','删除']
        page.keyboard.press('Escape')
        page.locator('#ui-language').click()
        # Drag cancellation cleans both highlighted border and insertion marker.
        grip=page.locator('[data-section-id="geometry"] > h3 > .section-drag-handle')
        target=page.locator('[data-section-id="basic"]')
        page.evaluate('''() => {
          const grip=document.querySelector('[data-section-id="geometry"] .section-drag-handle');
          const target=document.querySelector('[data-section-id="basic"]');
          const transfer=new DataTransfer();window.__dragTransfer=transfer;
          grip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:transfer}));
          const rect=target.getBoundingClientRect();
          target.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:transfer,clientY:rect.top+3}));
        }''')
        assert target.evaluate('(el)=>el.classList.contains("section-drop-target")&&el.classList.contains("section-drop-before")')
        assert target.evaluate('(el)=>getComputedStyle(el).outlineStyle')=='solid'
        grip.dispatch_event('dragend')
        assert not target.evaluate('(el)=>el.classList.contains("section-drop-target")')
        # Valid drop visibly marks the intended edge, reorders, and clears the marker.
        page.evaluate('''() => {
          const grip=document.querySelector('[data-section-id="geometry"] .section-drag-handle');
          const target=document.querySelector('[data-section-id="basic"]');
          const dt=new DataTransfer();
          grip.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:dt}));
          const rect=target.getBoundingClientRect();
          target.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt,clientY:rect.top+3}));
          target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientY:rect.top+3}));
          grip.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:dt}));
        }''')
        assert page.locator('#panel-sections > .toolgroup').first.get_attribute('data-section-id')=='geometry'
        assert not target.evaluate('(el)=>el.classList.contains("section-drop-target")')
        assert snapshot(page)==first,'Layout/locale-only actions changed the scene'
        assert not errs,errs
        page.set_viewport_size({'width':390,'height':780})
        page.locator('#left-collapse').click()
        page.locator('#objects .object[data-id="o1"] .object-menu-toggle').click()
        assert page.locator('#object-action-menu button[data-action="delete"]').is_visible()
        page.keyboard.press('Escape')
        assert not errs,errs
        browser.close()
    print('ROUND17_UI_REFINEMENT_PASS: no inline help, icon hover/focus English+Chinese, drop highlight/cancel/drop, header cleanup, unchanged project, mobile')

if __name__=='__main__':run()
