"""Round 13 isolated Chromium regression: accessible disclosure/reorder and old-project safety.

Uses the offline source-inlined fixture plus a deterministic localStorage shim.
Browser navigation to a real origin is administrator-blocked here; genuine
same-origin persistence and the deployed site remain unverified.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download

def fixture(seed=None):
    payload=json.dumps(seed or {})
    shim="""<script>
    (() => {const data = SEED;Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:key=>Object.hasOwn(data,key)?data[key]:null,
      setItem:(key,value)=>{data[key]=String(value);},
      removeItem:key=>{delete data[key];},clear:()=>{for(const key of Object.keys(data))delete data[key];}
    }});})();</script>""".replace('SEED',payload)
    return inline_html(legacy_search_expanded=False).replace('<script>window.MathJax=',shim+'<script>window.MathJax=')


def snapshot(page):
    return json.loads(download(page,'Save').read_text())


def sequence(page,selector):
    return page.locator(selector).evaluate_all('(nodes)=>nodes.map(n=>n.dataset.sectionId)')


def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
        page=context.new_page();page.set_default_timeout(8000)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:d.accept())
        page.set_content(fixture(),wait_until='load')
        page.wait_for_selector('[data-section-id="settings"] .section-toggle')
        assert not errors,errors
        assert page.locator('.module-controls').count()==0
        assert page.locator('[id^="module-"]').count()==0
        assert sequence(page,'#panel-sections > .toolgroup')==['basic','diagrams','geometry']
        assert sequence(page,'#settings-sections > .controls')==['plotting','geometry-options','new-object-style','page-appearance','interface']
        assert page.locator('.toolgroup > h3 > .section-toggle').count()==3
        assert page.locator('#settings-sections > .controls > h3 > .section-toggle').count()==5
        assert page.locator('.settings-collection > h3 > .section-toggle').count()==1
        assert page.locator('.section-drag-handle').count()==12
        assert page.locator('#construction-tools [data-tool-choice="point"]').is_visible()
        assert page.locator('#default-stroke').is_visible()
        assert page.locator('#ui-font').is_visible()
        assert page.locator('#settings-panel').count()==0
        assert page.locator('#preset').is_hidden()
        cmd(page,'A=(0,1)')
        baseline=snapshot(page)
        section=page.locator('[data-section-id="geometry"]')
        toggle=section.locator('h3 .section-toggle')
        toggle.click();assert toggle.get_attribute('aria-expanded')=='false'
        assert page.locator('#construction-tools').is_hidden()
        assert not page.locator('#basic-tools').is_hidden()
        assert page.locator('#drawing').get_attribute('data-tool')=='select'
        assert snapshot(page)==baseline,'Disclosure changed saved project'
        toggle.click();assert page.locator('#construction-tools').is_visible()
        page.locator('#construction-tools [data-tool-choice="point"]').click()
        assert page.locator('#drawing').get_attribute('data-tool')=='point'
        toggle.click()
        assert page.locator('#drawing').get_attribute('data-tool')=='point','Collapsing UI changed active tool'
        toggle.click()
        # Alt+ArrowDown reorders accessible headings; no selection or project changes.
        handle=section.locator(':scope > h3 > .section-drag-handle');handle.focus();handle.press('Alt+ArrowUp')
        assert sequence(page,'#panel-sections > .toolgroup')==['basic','geometry','diagrams']
        assert page.locator('[data-section-id="settings"]').evaluate('(e)=>e.parentElement.lastElementChild===e')
        panel=page.locator('[data-section-id="plotting"]')
        panel.locator('.section-drag-handle').focus()
        panel.locator('.section-drag-handle').press('Alt+ArrowDown')
        assert sequence(page,'#settings-sections > .controls')==['geometry-options','plotting','new-object-style','page-appearance','interface']
        assert snapshot(page)==baseline,'Order changed project'
        # Parent Settings and child disclosure work independently.
        page.locator('[data-section-id="geometry-options"] .section-toggle').click()
        assert page.locator('#freehand-close').is_hidden()
        parent=page.locator('[data-section-id="settings"] .section-toggle').first
        parent.click();assert parent.get_attribute('aria-expanded')=='false'
        assert page.locator('#theme').is_hidden()
        parent.click();assert page.locator('#theme').is_visible()
        assert page.locator('#freehand-close').is_hidden()
        # Re-open in a fresh fixture with serialized preferences. The storage
        # shim verifies restoration logic, NOT real-origin persistence.
        prefs=json.loads(page.evaluate('localStorage.getItem("mathillustrator-layout-v1")'))
        assert prefs['collapsed']['geometry-options'] is True
        assert prefs['sections'].index('geometry')<prefs['sections'].index('diagrams')
        project=snapshot(page)
        next_page=context.new_page();next_page.set_default_timeout(8000)
        next_page.on('pageerror',lambda e:errors.append(str(e)))
        next_page.on('dialog',lambda d:d.accept())
        next_page.set_content(fixture({'mathillustrator-layout-v1':json.dumps(prefs),
                                      'mathillustrator-project-v1':json.dumps(project)}),wait_until='load')
        page.close();page=next_page
        assert sequence(page,'#panel-sections > .toolgroup')==['basic','geometry','diagrams']
        assert sequence(page,'#settings-sections > .controls')==['geometry-options','plotting','new-object-style','page-appearance','interface']
        assert page.locator('#freehand-close').is_hidden()
        assert page.locator('[data-section-id="settings"] .section-toggle').first.get_attribute('aria-expanded')=='true'
        assert snapshot(page)==baseline,'Layout preferences changed project after reload'
        # Real HTML5 drag with a dedicated grip. A handle dropped on a heading
        # moves exactly one section and cannot escape its tool/settings group.
        page.locator('[data-section-id="geometry"] > h3 > .section-drag-handle').drag_to(
            page.locator('[data-section-id="basic"] .section-toggle'),target_position={'x':16,'y':2})
        assert sequence(page,'#panel-sections > .toolgroup')==['geometry','basic','diagrams']
        page.locator('[data-section-id="plotting"] .section-drag-handle').drag_to(
            page.locator('[data-section-id="geometry-options"] .section-toggle'),target_position={'x':16,'y':2})
        assert sequence(page,'#settings-sections > .controls')==['plotting','geometry-options','new-object-style','page-appearance','interface']
        assert snapshot(page)==baseline,'Drag changed project'
        # Interface preferences live with other settings; these are also
        # independent of saved drawing JSON and use the same layout key.
        page.locator('#ui-font').select_option('serif')
        assert 'Georgia' in page.evaluate('document.documentElement.style.getPropertyValue("--ui-font")')
        page.locator('#auto-pan').uncheck()
        assert json.loads(page.evaluate('localStorage.getItem("mathillustrator-layout-v1")'))['autoPan'] is False
        assert snapshot(page)==baseline,'Interface preferences changed project'
        # Import legacy modules=false without disabling the editor's geometry tools.
        legacy=snapshot(page);legacy['settings']['modules']['construction']=False
        page.locator('#open-file').set_input_files({'name':'old.json','mimeType':'application/json','buffer':json.dumps(legacy).encode()})
        assert snapshot(page)['settings']['modules']['construction'] is False
        assert page.locator('#construction-tools [data-tool-choice="point"]').is_visible()
        page.locator('#construction-tools [data-tool-choice="point"]').click()
        assert page.locator('#drawing').get_attribute('data-tool')=='point'
        before=snapshot(page)
        invalid=json.loads(json.dumps(before));invalid['settings']['modules']['construction']='invalid'
        page.locator('#open-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
        assert snapshot(page)==before,'Malformed import changed project'
        page.locator('#undo').click();page.locator('#redo').click()
        # Locale roundtrip and keyboard focus metadata for disclosure/drag.
        page.locator('#ui-language').select_option('zh')
        assert page.locator('[data-section-id="settings"] .section-toggle').first.inner_text().endswith('设置')
        assert '收起分区' in page.locator('[data-section-id="settings"] .section-toggle').first.get_attribute('aria-label')
        assert '调整分区' in page.locator('[data-section-id="geometry"] > h3 > .section-drag-handle').get_attribute('aria-label')
        page.locator('#ui-language').select_option('en')
        assert 'Collapse section' in page.locator('[data-section-id="settings"] .section-toggle').first.get_attribute('aria-label')
        # Settings is already in the Tools sidebar: there is no redundant
        # header cog; opening its disclosure exposes the font control.
        assert page.locator('#settings-open').count()==0
        page.locator('[data-section-id="interface"] .section-toggle').click()
        assert page.locator('#ui-font').is_hidden()
        page.locator('[data-section-id="interface"] .section-toggle').click()
        assert page.locator('#ui-font').is_visible()
        page.locator('#ui-font').focus()
        assert page.locator('#ui-font').evaluate('(e)=>document.activeElement===e')
        # Viewports / mobile drawers. Collapsed sections preserve their height.
        for width in (1440,700,390,320):
            page.set_viewport_size({'width':width,'height':850})
            page.wait_for_timeout(110)
            if width<=700:page.evaluate('document.body.classList.add("mobile-right-open")')
            geom=page.locator('[data-section-id="geometry"] > h3 > .section-toggle')
            assert geom.is_visible(),width
            assert geom.evaluate('(el)=>{const r=el.getBoundingClientRect(),p=el.closest("aside").getBoundingClientRect();return r.width>50&&r.left>=p.left-1&&r.right<=p.right+1;}'),width
        # The mobile drawer's original rail trigger is the sole entry point.
        page.evaluate('document.body.classList.remove("mobile-right-open")')
        page.locator('#right-collapse').click()
        assert page.evaluate('document.body.classList.contains("mobile-right-open")')
        assert page.locator('#ui-font').is_visible()
        # Old layout records used `plotting-`; accept its position without
        # carrying the malformed key forward in new preference writes.
        old_page=context.new_page();old_page.set_default_timeout(8000)
        old_page.on('pageerror',lambda e:errors.append(str(e)))
        old_page.set_content(fixture({'mathillustrator-layout-v1':json.dumps({
            'language':'en','sections':['page-appearance','plotting-','geometry-options','basic','diagrams','geometry']})}),wait_until='load')
        assert sequence(old_page,'#settings-sections > .controls')==[
            'page-appearance','plotting','geometry-options','new-object-style','interface']
        assert sequence(old_page,'#panel-sections > .toolgroup')==[
            'basic','diagrams','geometry']
        old_page.close()
        assert not errors,errors
        browser.close()
    print('PALETTE_SECTIONS_PASS: disclosure, keyboard reorder, preference serialization fixture, legacy flags, import rollback, locale, 320-1440px')


if __name__=='__main__':run()
