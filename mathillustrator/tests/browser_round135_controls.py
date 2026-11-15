"""Responsive control geometry and interaction audit against the actual application in Chromium."""
import os, json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width,height in [(1600,950),(1100,800),(768,900)]:
   page=b.new_page(viewport={'width':width,'height':height});errors=[]
   page.on('pageerror',lambda e: errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   page.wait_for_selector('#plot-mode')
   results=page.evaluate('''() => {
    const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&!e.closest('[hidden]')};
    const issues=[];
    for(const e of document.querySelectorAll('input,select,button,textarea')){
     if(!visible(e))continue;
     const r=e.getBoundingClientRect();
     if(r.width<15||r.height<18)issues.push({kind:'tiny',id:e.id||e.outerHTML.slice(0,100),w:r.width,h:r.height});
     if(r.x < -1 || r.right>innerWidth+1)issues.push({kind:'viewport',id:e.id||e.outerHTML.slice(0,100),x:r.x,right:r.right});
     if(e.scrollWidth>e.clientWidth+6 && (e.tagName==='BUTTON'||e.tagName==='SELECT'))issues.push({kind:'text-overflow',id:e.id||e.outerHTML.slice(0,100),sw:e.scrollWidth,cw:e.clientWidth});
    }
    const sections=[...document.querySelectorAll('#left-panel,#right-panel,#properties,.appbar,.plot-region-editor')].map(e=>({id:e.id||e.className,scroll:e.scrollWidth,client:e.clientWidth}));
    return {issues:issues.slice(0,60),sections,visibleControls:[...document.querySelectorAll('input,select,button,textarea')].filter(visible).length};
   }''')
   assert results['visibleControls']>=100, results
   assert not [v for v in results['issues'] if v['kind'] in ('viewport','text-overflow')],results['issues']
   assert not errors,errors
   print(json.dumps({'viewport':width,'controls':results['visibleControls'],'alignment':'PASS','errors':errors},ensure_ascii=False),flush=True)
   page.close()
 finally:b.close()
