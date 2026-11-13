"""Round 15: pointer/keyboard panel resizing, local preference and rollback.

Offline Chromium page.set_content with deterministic localStorage shim. This
cannot verify hosted-origin storage, physical touch, or other browser engines.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download

KEY='mathillustrator-layout-v1'

def create_page(context, seed=None, errors=None):
    page=context.new_page()
    page.on('dialog',lambda d:d.accept())
    if errors is not None:page.on('pageerror',lambda e:errors.append(str(e)))
    payload=json.dumps(seed or {})
    shim='''<script>(()=>{const data=SEED;Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:key=>Object.hasOwn(data,key)?data[key]:null,
      setItem:(key,value)=>{data[key]=String(value)},
      removeItem:key=>{delete data[key]},clear:()=>{for(const k of Object.keys(data))delete data[k]}
    }});window.__stored=data;})();</script>'''.replace('SEED',payload)
    html=inline_html(legacy_search_expanded=False).replace('<head>','<head>'+shim,1)
    page.set_content(html,wait_until='load');page.wait_for_function('document.querySelector("#left-resizer").getAttribute("aria-valuenow") !== null')
    return page

def dims(page):
    return page.evaluate('''() => {
      const w=document.querySelector('.workspace').getBoundingClientRect(),
        l=document.querySelector('.leftpanel').getBoundingClientRect(),
        r=document.querySelector('.rightpanel').getBoundingClientRect(),
        s=document.querySelector('.stage').getBoundingClientRect();
      return {w:w.width,left:l.width,right:r.width,stage:s.width};
    }''')

def prefs(page):
    value=page.evaluate('(key)=>localStorage.getItem(key)',KEY)
    return json.loads(value) if value else {}

def drag_handle(page, selector, dx, finish='up'):
    box=page.locator(selector).bounding_box()
    assert box is not None,selector
    x=box['x']+box['width']/2;y=box['y']+max(30,min(120,box['height']*.35))
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y,steps=8)
    if finish=='escape':page.keyboard.press('Escape')
    page.mouse.up()

def run():
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
        page=create_page(context,errors=errors)
        d=dims(page)
        assert abs(d['left']-310)<2 and abs(d['right']-305)<2 and d['stage']>=240,d
        assert page.get_by_role('separator',name='Resize Objects panel').count()==1
        assert page.get_by_role('separator',name='Resize Tools panel').count()==1
        cmd(page,'A=(0,0)')
        page.locator('#export-open').click()
        original=json.loads(download(page,'JSON project').read_text())
        drag_handle(page,'#left-resizer',103)
        d=dims(page);assert 405<=d['left']<=418 and d['stage']>=240,d
        assert 405<=prefs(page)['sidebarWidths']['left']<=418
        assert abs(d['right']-305)<2
        drag_handle(page,'#right-resizer',-96)
        d=dims(page);assert 395<=d['right']<=410 and d['stage']>=240,d
        before=prefs(page)
        drag_handle(page,'#left-resizer',-100,finish='escape')
        assert abs(dims(page)['left']-d['left'])<2
        assert prefs(page)==before,'Escape must roll back visual change and storage'
        # Keyboard focus + arrow / Shift + arrow / Home / End.
        left=page.locator('#left-resizer');left.focus();baseline=dims(page)['left']
        left.press('ArrowRight');assert abs(dims(page)['left']-baseline-8)<2
        left.press('Shift+ArrowLeft');assert abs(dims(page)['left']-baseline+16)<2
        left.press('Home');assert abs(dims(page)['left']-190)<2
        left.press('End');assert dims(page)['stage']>=240
        assert int(left.get_attribute('aria-valuenow'))==round(dims(page)['left'])
        assert int(left.get_attribute('aria-valuemax'))>=round(dims(page)['left'])
        left.dblclick(force=True);assert abs(dims(page)['left']-310)<2
        saved=prefs(page)
        assert 'sidebarWidths' in saved
        # Panel changes must not become scene-history changes or alter exports.
        page.locator('#export-open').click()
        assert json.loads(download(page,'JSON project').read_text())==original
        assert page.locator('#undo').is_enabled() # object creation remains undoable
        # Persisted sizes in a new offline document instance; no project data in prefs.
        restored=create_page(context,{KEY:json.dumps(saved)},errors)
        assert abs(dims(restored)['left']-dims(page)['left'])<2
        assert abs(dims(restored)['right']-dims(page)['right'])<2
        assert 'objects' not in saved and 'settings' not in saved
        restored.close()
        # Collapsing one side keeps its width in preferences.
        old=prefs(page)['sidebarWidths'].copy()
        page.locator('#left-collapse').click()
        assert abs(dims(page)['left']-52)<2 and page.locator('#left-resizer').is_hidden()
        assert abs(dims(page)['right']-old['right'])<2
        page.locator('#left-collapse').click()
        assert abs(dims(page)['left']-old['left'])<2
        assert prefs(page)['sidebarWidths']==old
        # Desktop at minimum supported width must preserve >= 240px canvas,
        # without overwriting the user's larger preferred widths.
        page.set_viewport_size({'width':701,'height':800})
        page.wait_for_timeout(100)
        d=dims(page);assert d['stage']>=239 and d['left']>=190 and d['right']>=190,d
        assert prefs(page)['sidebarWidths']==old
        # Mobile has 42px rails and resizers are hidden (no accidental drag).
        page.set_viewport_size({'width':390,'height':830});page.wait_for_timeout(100)
        assert page.locator('#left-resizer').is_hidden()
        assert page.locator('#right-resizer').is_hidden()
        page.locator('#left-collapse').click()
        assert page.locator('#objects').is_visible()
        page.locator('#left-collapse').click()
        page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(100)
        d=dims(page);assert abs(d['left']-old['left'])<2 and abs(d['right']-old['right'])<2,d
        # Locale change labels update back and forth without changing widths.
        page.locator('#ui-language').select_option('zh')
        assert page.get_by_role('separator',name='调整对象面板宽度').count()==1
        assert '像素' in page.locator('#left-resizer').get_attribute('aria-valuetext')
        page.locator('#ui-language').select_option('en')
        assert page.get_by_role('separator',name='Resize Tools panel').count()==1
        assert 'pixels' in page.locator('#right-resizer').get_attribute('aria-valuetext')
        assert prefs(page)['sidebarWidths']==old
        # Corrupt and legacy storage must fail closed and remain visually usable.
        for data in ({'sidebarWidths':{'left':'500','right':float('inf')}},{'sidebarWidths':{'left':120000,'right':-1}},
                     {'sidebarWidths':[], 'sections':['geometry']}):
            malformed=create_page(context,{KEY:json.dumps(data)},errors)
            d=dims(malformed)
            assert 190<=d['left']<=620 and 190<=d['right']<=620 and d['stage']>=240,d
            malformed.close()
        assert not errors,errors
        print('CHROMIUM_PANEL_RESIZE_PASS: pointer, Escape, keyboard, reset, preference, collapse, responsive, localization, malformed, JSON/undo')
        browser.close()

if __name__=='__main__':run()
