"""The editor and tutorial follow the site's default theme; manual choice overrides it."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_panel_resize_current import create_page,KEY
ROOT=Path(__file__).resolve().parents[1]

def guide(context,seed):
    page=context.new_page();payload=json.dumps(seed)
    html=(ROOT/'tutorial.html').read_text().replace('<head>','<head><script>(()=>{const data=SEED;Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:key=>Object.hasOwn(data,key)?data[key]:null,setItem:(key,value)=>data[key]=String(value)}})})();</script>'.replace('SEED',payload),1)
    html=html.replace('<link rel="stylesheet" href="./style.css?cut=round20">','<style>'+(ROOT/'style.css').read_text()+'</style>')
    page.set_content(html,wait_until='load');return page

def run():
 with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1000,'height':750})
    for site,own,expected in [('light',None,'light'),('dark',None,'dark'),('dark','light','light'),('light','dark','dark')]:
        values={'theme':site}
        if own:values['mathillustrator-ui-v1']=json.dumps({'theme':own})
        page=create_page(context,values)
        assert page.locator('html').get_attribute('data-theme')==expected,(site,own,expected)
        tour=guide(context,values)
        assert tour.locator('html').get_attribute('data-theme')==expected,(site,own,expected)
        assert tour.locator('#en-guide').is_visible()
        assert tour.locator('#chinese').count()==0
        assert tour.locator('#english').count()==0
        tour.evaluate('''() => {const state=JSON.parse(localStorage.getItem('mathillustrator-layout-v1')||'{}');state.language='zh';localStorage.setItem('mathillustrator-layout-v1',JSON.stringify(state));dispatchEvent(new StorageEvent('storage',{key:'mathillustrator-layout-v1'}));}''')
        assert tour.locator('#zh-guide').is_visible()
        tour.evaluate('''() => {localStorage.setItem('mathillustrator-layout-v1',JSON.stringify({language:'en'}));dispatchEvent(new StorageEvent('storage',{key:'mathillustrator-layout-v1'}));}''')
        assert tour.locator('#en-guide').is_visible()
        assert tour.locator('html').get_attribute('data-theme')==expected
        page.close();tour.close()
    browser.close()
 print('ROUND17_THEME_TUTORIAL_PASS: homepage light/dark inheritance, user override, guide parity, automatic tutorial language')
if __name__=='__main__':run()
