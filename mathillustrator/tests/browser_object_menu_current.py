"""Focused object-menu cut: isolated Chromium (not deployed-site evidence)."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download


def objects(page):
    return json.loads(download(page,'Save').read_text())['objects']


def menu(page,obj):
    toggle=page.locator(f'#objects .object[data-id="{obj}"] .object-menu-toggle')
    toggle.click()
    assert toggle.get_attribute('aria-expanded')=='true'
    assert page.locator('#object-action-menu').is_visible()
    return page.locator('#object-action-menu')


def action(page,obj,verb):
    menu(page,obj).locator(f'[data-action="{verb}"]').click()
    assert page.locator('#object-action-menu').is_hidden()


def run():
 with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
    page.evaluate('''() => {const data=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}});}''')
    page.wait_for_function('document.querySelector("[data-tool-choice=point]") !== null')
    assert page.locator('#object-search').is_visible()
    assert page.locator('#object-search-icon').count()==1
    assert page.locator('#delete').count()==0
    for source in ('A=(0,0)','B=(2,0)','Segment(A,B)'):
        cmd(page,source)
    assert len(objects(page))==3
    # Search is always visible; Escape clears the active filter without hiding it.
    assert page.locator('#object-search-icon').get_attribute('aria-hidden')=='true'
    page.locator('#object-search').fill('not-here')
    assert page.locator('#objects .object').count()==0
    page.locator('#object-search').press('Escape')
    assert page.locator('#object-search').is_visible()
    assert page.locator('#object-search').input_value()==''
    assert page.locator('#objects .object').count()==3
    page.locator('#object-search').fill('not-here')
    assert page.locator('#objects .object').count()==0
    page.locator('#object-search').fill('')
    # Keyboard and focus: menu consumes Escape; opening does not select an object.
    toggle=page.locator('#objects .object[data-id="o1"] .object-menu-toggle')
    toggle.focus();toggle.press('Enter')
    assert page.locator('#object-action-menu').is_visible()
    assert page.locator('#object-action-menu [data-action="visibility"]').evaluate('(el)=>document.activeElement===el')
    page.keyboard.press('ArrowDown')
    assert page.locator('#object-action-menu [data-action="lock"]').evaluate('(el)=>document.activeElement===el')
    page.keyboard.press('Escape')
    assert page.locator('#object-action-menu').is_hidden() and toggle.evaluate('(el)=>document.activeElement===el')
    menu(page,'o1')
    page.keyboard.press('Tab');page.keyboard.press('Tab');page.keyboard.press('Tab')
    assert page.locator('#object-action-menu').is_hidden()  # focus left the menu
    menu(page,'o1')
    page.locator('#command').click()
    assert page.locator('#object-action-menu').is_hidden()
    # Hide and lock are each single undoable model mutations; exports retain state.
    action(page,'o1','visibility')
    assert next(o for o in objects(page) if o['id']=='o1')['hidden']
    action(page,'o1','visibility')
    assert not next(o for o in objects(page) if o['id']=='o1')['hidden']
    page.locator('#ui-language').select_option('zh')
    assert menu(page,'o1').locator('[data-action="visibility"]').get_attribute('aria-label')=='隐藏'
    assert page.locator('#objects .object[data-id="o1"] .object-menu-toggle').get_attribute('title')=='对象操作'
    page.keyboard.press('Escape')
    assert page.locator('#object-search').get_attribute('aria-label')=='搜索对象'
    page.locator('#ui-language').select_option('en')
    # Locked dependent disables deletion of an otherwise unlocked parent.
    action(page,'o3','lock')
    assert next(o for o in objects(page) if o['id']=='o3')['locked']
    m=menu(page,'o1');assert m.locator('[data-action="delete"]').is_disabled()
    page.keyboard.press('Escape')
    assert len(objects(page))==3
    action(page,'o3','lock')
    # Delete the unselected A: cascading Segment is removed, B remains selected.
    page.locator('#objects .object[data-id="o2"]').click()
    assert page.locator('#objects .object[data-id="o2"]').get_attribute('class').find('selected')>=0
    action(page,'o1','delete')
    assert [o['id'] for o in objects(page)]==['o2']
    assert 'selected' in page.locator('#objects .object[data-id="o2"]').get_attribute('class')
    assert page.locator('#trash-count').inner_text()=='1'
    assert 'A' in page.locator('#trash-items .trash-names').first.text_content()
    assert 'Segment' in page.locator('#trash-items .trash-names').first.text_content()
    page.locator('#undo').click();assert len(objects(page))==3
    page.locator('#redo').click();assert [o['id'] for o in objects(page)]==['o2']
    # Restore retains both IDs and dependency edges, then remains undoable.
    page.locator('#recently-deleted').evaluate('(el)=>el.open=true')
    page.locator('#trash-items button').first.click()
    recovered=objects(page)
    assert len(recovered)==3 and next(o for o in recovered if o['id']=='o3')['refs']==['o1','o2']
    assert page.locator('#trash-count').inner_text()=='0'
    page.locator('#undo').click();assert len(objects(page))==1
    page.locator('#redo').click();assert len(objects(page))==3
    # Malformed legacy import is rejected without mutating the live project.
    original=json.loads(download(page,'Save').read_text())
    invalid=json.loads(json.dumps(original));invalid['objects'][-1]['refs']=['absent','o2']
    page.locator('#open-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
    page.wait_for_timeout(70);assert json.loads(download(page,'Save').read_text())==original
    # Stale detached row cannot open a menu against a new project that reused o1.
    page.evaluate("window.__orphan=document.querySelector('#objects .object[data-id=\"o1\"] .object-menu-toggle')")
    page.locator('#new').click();cmd(page,'C=(9,9)')
    page.evaluate('window.__orphan.click()')
    assert page.locator('#object-action-menu').is_hidden()
    assert [o['name'] for o in objects(page)]==['C']
    # Persisted JSON and autosave are not altered by opening/closing a menu.
    action(page,'o1','lock')
    page.wait_for_timeout(650)
    stored=page.evaluate('JSON.parse(localStorage.getItem("mathillustrator-project-v1"))')
    assert stored['objects'][0]['locked'] is True
    assert next(o for o in objects(page) if o['id']=='o1')['locked']
    # Mobile drawer: object controls, menu and disclosure remain tappable/on-screen.
    for width in (390,320):
        page.set_viewport_size({'width':width,'height':780})
        if width==390:page.locator('#left-collapse').click()
        m=menu(page,'o1');bounds=m.bounding_box()
        assert bounds['x']>=0 and bounds['x']+bounds['width']<=width
        assert bounds['y']>=0 and bounds['y']+bounds['height']<=780
        page.keyboard.press('Escape')
        assert page.locator('#object-search').is_visible()
    assert not errors,errors
    browser.close()
    print('OBJECT_MENU_BROWSER_PASS: disclosure, keyboard, focus, hide/lock, dependent refusal, nonselected cascade, trash restore, undo/redo, import rollback, stale row, autosave, mobile')


if __name__=='__main__':run()
