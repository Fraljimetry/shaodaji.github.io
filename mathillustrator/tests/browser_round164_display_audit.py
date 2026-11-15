"""Broad runtime display inventory: responsive geometry, text clipping, language toggle, panels."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
 try:
  for width in (1440, 1024, 768, 390, 320):
   p=b.new_page(viewport={'width':width,'height':900}); errs=[]
   p.on('pageerror',lambda e:errs.append(str(e)))
   p.set_content(inline_html(legacy_search_expanded=False),wait_until='load',timeout=60000)
   if width<700:p.locator('#right-collapse').click()
   for lang in ('en','zh','en'):
    p.locator('#ui-language').select_option(lang)
    x=p.evaluate('''() => {
      const panel=document.querySelector('.rightpanel');
      let clipped=[],bad=[],counts={};
      for(const el of panel.querySelectorAll('label,button,input,select,.check,.field,.twocol')){
       const s=getComputedStyle(el),r=el.getBoundingClientRect();
       if(r.width<1||r.height<1||s.display==='none'||s.visibility==='hidden')continue;
       const ident=el.id||el.className||el.tagName;counts[el.tagName]=(counts[el.tagName]||0)+1;
       if((el.tagName==='LABEL'||el.tagName==='BUTTON')&&el.scrollWidth>el.clientWidth+3)
         clipped.push([String(ident).slice(0,55),el.textContent.trim().slice(0,60),el.scrollWidth,el.clientWidth]);
       if(['INPUT','SELECT'].includes(el.tagName)&& (r.right>panel.getBoundingClientRect().right+2 || r.left<panel.getBoundingClientRect().left-2))
         bad.push([ident,Math.round(r.left),Math.round(r.right)]);
      }
      const ids=['export-guides','export-transparent','auto-pan','tooltips','theme','page','ui-language'];
      return {clipped:clipped.slice(0,25),bad:bad.slice(0,25),counts,positions:Object.fromEntries(ids.map(id=>[id,Math.round(document.getElementById(id).getBoundingClientRect().left)]))};
    }''')
    print('AUDIT',width,lang,json.dumps(x,ensure_ascii=False),flush=True)
    assert not x['clipped'], ('clipped visible settings labels',width,lang,x['clipped'])
    assert not x['bad'], ('control outside settings panel',width,lang,x['bad'])
    assert abs(x['positions']['export-transparent']-x['positions']['auto-pan'])<=2, ('checkbox track misaligned',width,lang,x['positions'])
   assert not errs,(width,errs)
   p.close()
 finally:b.close()
