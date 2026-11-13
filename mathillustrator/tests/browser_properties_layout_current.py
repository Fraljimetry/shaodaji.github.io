"""Round 16 real pointer/keyboard Properties layout in isolated Chromium fixture."""
import json,os
from playwright.sync_api import sync_playwright
from browser_panel_resize_current import create_page,prefs,dims,KEY
from browser_smoke import cmd,download

def rect(page,selector):
    b=page.locator(selector).bounding_box()
    assert b is not None,selector
    return b

def drag(page, selector,dx,dy, finish='up'):
    r=rect(page,selector)
    x=r['x']+r['width']/2;y=r['y']+r['height']/2
    if selector=='#properties-head':x=r['x']+40
    if selector=='#properties-corner':x=r['x']+10;y=r['y']+10
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=7)
    if finish=='escape':page.keyboard.press('Escape')
    page.mouse.up()

def near(a,b,tol=3):assert abs(a-b)<=tol,(a,b)

def run():
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
        page=create_page(context,errors=errors)
        props=page.locator('#properties-dock')
        assert props.is_visible() and props.evaluate('(n)=>n.parentElement.className')=='leftpanel'
        assert page.locator('#properties-splitter').is_visible()
        first=rect(page,'#properties-dock')['height']
        drag(page,'#properties-splitter',0,-62)
        grown=rect(page,'#properties-dock')['height']
        assert grown>first+45,(first,grown)
        assert prefs(page)['propertiesPanel']['dockHeight']>270
        # Escape: visual and saved state must roll back exactly.
        snapshot=prefs(page)['propertiesPanel'].copy()
        drag(page,'#properties-splitter',0,80,'escape')
        near(rect(page,'#properties-dock')['height'],grown)
        assert prefs(page)['propertiesPanel']==snapshot
        split=page.locator('#properties-splitter');split.focus()
        split.press('ArrowDown');assert rect(page,'#properties-dock')['height']<grown
        split.press('Shift+ArrowUp');assert rect(page,'#properties-dock')['height']>grown
        split.dblclick(force=True);near(rect(page,'#properties-dock')['height'],230)
        # Zero scene changes; JSON download before/after panel operations.
        cmd(page,'A=(0,0)')
        page.locator('#export-open').click()
        original=json.loads(download(page,'JSON project').read_text())
        page.locator('#properties-undock').click()
        assert page.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
        assert props.evaluate('(n)=>n.parentElement.tagName')=='BODY'
        assert page.locator('#properties-corner').is_visible()
        assert page.locator('#properties-head').get_attribute('tabindex')=='0'
        fl=rect(page,'#properties-dock');drag(page,'#properties-head',75,64)
        moved=rect(page,'#properties-dock')
        assert moved['x']>fl['x']+55 and moved['y']>fl['y']+45,(fl,moved)
        before=prefs(page)['propertiesPanel'].copy()
        drag(page,'#properties-head',100,50,'escape')
        near(rect(page,'#properties-dock')['x'],moved['x'])
        assert prefs(page)['propertiesPanel']==before
        drag(page,'#properties-corner',92,74)
        bigger=rect(page,'#properties-dock')
        assert bigger['width']>moved['width']+70 and bigger['height']>moved['height']+55,(bigger,moved)
        corner=page.locator('#properties-corner');corner.focus();corner.press('ArrowLeft')
        assert rect(page,'#properties-dock')['width']<bigger['width']
        corner.press('Shift+ArrowDown');assert rect(page,'#properties-dock')['height']>bigger['height']
        head=page.locator('#properties-head');head.focus();box=rect(page,'#properties-dock');head.press('Alt+ArrowLeft');assert rect(page,'#properties-dock')['x']<box['x']
        # Floating inspector must survive left panel collapse and still select/edit.
        page.locator('#left-collapse').click()
        assert props.is_visible() and page.locator('#properties-undock').is_visible()
        page.locator('#left-collapse').click()
        page.locator('#objects .object').first.click()
        assert page.locator('#properties input').count()>0
        # Fold and unfold without deleting the selection or losing preferred size.
        size=prefs(page)['propertiesPanel'].copy()
        page.locator('#properties-toggle').click()
        assert prefs(page)['propertiesPanel']['collapsed'] is True
        assert page.locator('#properties').is_hidden() and page.locator('#properties-corner').is_hidden()
        page.locator('#properties-toggle').click()
        assert page.locator('#properties').is_visible() and page.locator('#properties-corner').is_visible()
        assert prefs(page)['propertiesPanel']['collapsed'] is False
        assert {k:v for k,v in prefs(page)['propertiesPanel'].items() if k!='collapsed'}=={k:v for k,v in size.items() if k!='collapsed'}
        # Responsive: no floating overlay on a mobile drawer.
        page.set_viewport_size({'width':390,'height':830});page.wait_for_timeout(120)
        assert not page.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
        assert props.evaluate('(n)=>n.parentElement.className')=='leftpanel'
        page.locator('#left-collapse').click()
        assert props.is_visible() and page.locator('#properties-undock').is_hidden()
        assert page.locator('#properties-splitter').is_hidden()
        page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(120)
        assert props.evaluate('(n)=>n.parentElement.tagName')=='BODY'
        page.locator('#ui-language').select_option('zh')
        assert page.get_by_role('button',name='停靠属性面板').count()==1
        page.locator('#ui-language').select_option('en')
        assert page.get_by_role('button',name='Dock Properties panel').count()==1
        # Model untouched by the UI workflow; import/export remain stable.
        page.locator('#export-open').click()
        assert json.loads(download(page,'JSON project').read_text())==original
        saved=prefs(page)
        assert 'propertiesPanel' in saved and 'objects' not in saved and 'settings' not in saved
        restored=create_page(context,{KEY:json.dumps(saved)},errors)
        assert restored.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
        r=rect(restored,'#properties-dock')
        near(r['x'],rect(page,'#properties-dock')['x'])
        restored.locator('#properties-undock').click()
        assert restored.locator('#properties-dock').evaluate('(n)=>n.parentElement.className')=='leftpanel'
        restored.close()
        # Corrupt layout input may not break construction or leave an off-screen pane.
        for payload in ({'propertiesPanel':[]},{'propertiesPanel':{'mode':'floating','x':-100,'y':None,'width':'800','height':float('inf')}},
                        {'propertiesPanel':{'mode':'alien','dockHeight':1e15}}):
            bad=create_page(context,{KEY:json.dumps(payload)},errors)
            assert bad.locator('#properties-dock').is_visible()
            assert 0<=rect(bad,'#properties-dock')['x']<=1440
            bad.close()
        assert not errors,errors
        browser.close()
        print('CHROMIUM_PROPERTIES_LAYOUT_PASS: dock split, float, drag, resize, Escape, keyboard, persistence, responsive, localization, export, corrupt')
if __name__=='__main__':run()
