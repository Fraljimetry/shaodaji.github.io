"""Round 17: real Chromium DOM interactions, isolated offline bundle (not deployed-site verification)."""
import json,os,sys
from playwright.sync_api import sync_playwright
from browser_panel_resize_current import create_page,prefs,dims,KEY
from browser_smoke import cmd,download

def rect(page,selector):
    box=page.locator(selector).bounding_box();assert box is not None,selector
    return box

def gesture(page,selector,dx,dy,escape=False):
    box=rect(page,selector)
    x=box['x']+(25 if selector.endswith('>.panelhead') else box['width']/2)
    y=box['y']+(19 if selector.endswith('>.panelhead') else box['height']/2)
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=6)
    if escape:page.keyboard.press('Escape')
    page.mouse.up()

def near(a,b,tol=3):assert abs(a-b)<=tol,(a,b)

def run():
    errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
        page=create_page(context,errors=errors)
        # The existing Round 17 scenarios require a docked Properties baseline.
        # New documents float Properties by default in Round 19.
        assert page.locator('#properties-toggle').is_disabled()
        page.locator('#properties-undock').click()
        assert page.locator('html').get_attribute('data-theme')=='dark'
        assert page.locator('#objects-undock').get_attribute('aria-label')=='Float Objects panel'
        assert page.locator('#tools-undock').get_attribute('aria-label')=='Float Tools panel'
        cmd(page,'A=(1,2)');page.locator('#export-open').click()
        original=json.loads(download(page,'JSON project').read_text())
        canvas_before=dims(page)['stage']
        page.locator('#objects-undock').click()
        assert page.locator('.leftpanel').evaluate('(n)=>n.parentElement.tagName')=='BODY'
        assert page.locator('.dock-placeholder-left').is_visible()
        assert dims(page)['stage']>canvas_before+200
        assert page.locator('#properties-dock').evaluate('(n)=>n.parentElement.className').startswith('leftpanel')
        first=rect(page,'.leftpanel')
        gesture(page,'.floating-objects>.panelhead',60,40)
        moved=rect(page,'.leftpanel');assert moved['x']>first['x']+45 and moved['y']>first['y']+30,(first,moved)
        saved=prefs(page)['floatingPanels']['left'].copy()
        gesture(page,'.floating-objects>.panelhead',120,70,escape=True)
        near(rect(page,'.leftpanel')['x'],moved['x']);assert prefs(page)['floatingPanels']['left']==saved
        left_corner=page.locator('.floating-objects>.floating-panel-corner')
        left_corner.focus();before=rect(page,'.leftpanel');left_corner.press('ArrowRight')
        assert rect(page,'.leftpanel')['width']>before['width']
        head=page.locator('.floating-objects>.panelhead');head.focus()
        before=rect(page,'.leftpanel');head.press('Alt+ArrowLeft')
        assert rect(page,'.leftpanel')['x']<before['x']
        page.locator('#tools-undock').click()
        assert page.locator('.rightpanel').evaluate('(n)=>n.parentElement.tagName')=='BODY'
        assert page.locator('.dock-placeholder-right').is_visible()
        assert dims(page)['stage']>1150
        gesture(page,'.floating-tools>.panelhead',-30,50)
        tool_before=prefs(page)['floatingPanels']['right'].copy()
        left_before=prefs(page)['floatingPanels']['left'].copy()
        page.locator('.floating-tools>.floating-panel-corner').focus()
        page.keyboard.press('Shift+ArrowDown')
        assert prefs(page)['floatingPanels']['right']['height']>tool_before['height']
        assert prefs(page)['floatingPanels']['left']==left_before
        # Detached Properties is separate even when both parent sidebars float.
        page.locator('#properties-undock').click()
        assert page.locator('#properties-dock').evaluate('(n)=>n.parentElement.tagName')=='BODY'
        assert page.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
        page.locator('#properties-undock').click()
        assert page.locator('#properties-dock').evaluate('(n)=>n.parentElement.className').startswith('leftpanel')
        # Selection, object edits, translations and JSON unchanged by layout alone.
        page.locator('#objects .object').first.click()
        assert page.locator('#properties input').count()>0
        page.locator('#ui-language').click()
        assert page.locator('#ui-language').input_value()=='zh'
        assert page.locator('#objects-undock').get_attribute('aria-label')=='停靠对象面板'
        assert page.locator('#tools-undock').get_attribute('aria-label')=='停靠工具面板'
        page.locator('#ui-language').click()
        assert page.locator('#ui-language').input_value()=='en'
        # Ten palette swatches: default 5x2; object single line.
        default=page.locator('[data-color-swatches="default"][data-color-property="stroke"] .color-swatch')
        assert default.count()==10
        coords=[b['y'] for b in [default.nth(i).bounding_box() for i in range(10)]]
        assert max(coords[:5])-min(coords[:5])<2 and max(coords[5:])-min(coords[5:])<2 and coords[5]>coords[0]+10,coords
        obj=page.locator('#properties [data-color-swatches="object"][data-color-property="stroke"] .color-swatch')
        assert obj.count()==10
        ys=[obj.nth(i).bounding_box()['y'] for i in range(10)]
        assert max(ys)-min(ys)<2,ys
        page.locator('#export-open').click()
        assert json.loads(download(page,'JSON project').read_text())==original
        saved=prefs(page)
        restored=create_page(context,{KEY:json.dumps(saved)},errors)
        assert restored.locator('.leftpanel').evaluate('(n)=>n.parentElement.tagName')=='BODY'
        assert restored.locator('.rightpanel').evaluate('(n)=>n.parentElement.tagName')=='BODY'
        near(rect(restored,'.leftpanel')['x'],rect(page,'.leftpanel')['x'])
        # Mobile uses the original drawers, with no offscreen overlay; desktop restores preferred.
        restored.set_viewport_size({'width':390,'height':830});restored.wait_for_timeout(100)
        assert not restored.locator('.dock-placeholder-left').is_visible()
        assert restored.locator('.leftpanel').evaluate('(n)=>n.parentElement.className')=='workspace'
        assert restored.locator('.rightpanel').evaluate('(n)=>n.parentElement.className')=='workspace'
        assert not restored.locator('#objects-undock').is_visible()
        restored.locator('#left-collapse').click()
        assert restored.locator('#objects').is_visible()
        restored.set_viewport_size({'width':720,'height':450});restored.wait_for_timeout(100)
        for selector in ['.leftpanel','.rightpanel']:
            b=rect(restored,selector);assert b['x']>=0 and b['y']>=0 and b['x']+b['width']<=721 and b['y']+b['height']<=451,b
        assert prefs(restored)['floatingPanels']==saved['floatingPanels']
        restored.set_viewport_size({'width':1440,'height':900});restored.wait_for_timeout(100)
        assert restored.locator('.leftpanel').evaluate('(n)=>n.parentElement.tagName')=='BODY'
        restored.locator('.dock-placeholder-left .dock-restore').click()
        assert restored.locator('.leftpanel').evaluate('(n)=>n.parentElement.className')=='workspace'
        assert restored.locator('.rightpanel').evaluate('(n)=>n.parentElement.tagName')=='BODY'
        restored.locator('#tools-undock').click()
        assert restored.locator('.rightpanel').evaluate('(n)=>n.parentElement.className')=='workspace'
        # Corrupt persisted preferences never hide UI or poison their sibling panel.
        restored.close()
        for invalid in ({'floatingPanels':[]},{'floatingPanels':{'left':{'mode':'floating','width':'bad','x':-9},'right':{'mode':'floating','y':None,'height':float('inf')}}}):
            bad=create_page(context,{KEY:json.dumps(invalid)},errors)
            assert bad.locator('#objects-undock').is_visible()
            assert bad.locator('#tools-undock').is_visible()
            bad.close()
        assert not errors,errors
        browser.close()
    print('ROUND17_FLOATING_CHROMIUM_PASS: independent float/dock, drag, keyboard, Escape, viewport, mobile, Properties, theme, language, palette, persistence, JSON, invalid preferences')
if __name__=='__main__':run()
