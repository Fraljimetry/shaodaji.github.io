"""Round 276: cross-panel control alignment in real Chromium (2D/3D, both themes)."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('light','dark'):
   for width in (768,980,1440):
    page=browser.new_page(viewport={'width':width,'height':980})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load',timeout=60000)
    page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
    # Computed layout is tested even when scrolling below the fold.
    result=page.evaluate('''() => {
      const box=id=>{let e=document.getElementById(id);if(!e)return null;let r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
      const f=box('new-fill-enabled'),tr=box('export-transparent'),ps=box('point-size');
      const n=['default-opacity','default-width','point-size'].map(box);
      const settings=document.querySelector('#settings-sections');
      const all=[...settings.querySelectorAll('input[type=checkbox]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}));
      return {f,tr,ps,n,all};
    }''')
    assert result['f'] and result['tr'] and result['ps'],result
    assert result['f']['w']==result['tr']['w']==13 and result['f']['h']==result['tr']['h']==13,(theme,width,result)
    assert result['f']['x']>result['ps']['x']+result['ps']['w'],(theme,width,result)
    assert abs((result['f']['y']+result['f']['h']/2)-(result['ps']['y']+result['ps']['h']/2))<=1,(theme,width,result)
    assert all(abs(n['h']-30)<0.1 for n in result['n']),result
    assert all(x['w']==13 and x['h']==13 for x in result['all']),[(theme,width,x) for x in result['all'] if x['w']!=13 or x['h']!=13]
    page.evaluate('document.documentElement.classList.add("three-d")')
    result3=page.evaluate('''() => {
      const el=document.querySelector('#settings-3d');
      return [...el.querySelectorAll('input[type=checkbox]')]
        .filter(e=>e.getBoundingClientRect().width>0)
        .map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}));
    }''')
    assert result3 and all(x['w']==13 and x['h']==13 for x in result3),(theme,width,result3)
    assert not errors,(theme,width,errors)
    page.close()
 finally: browser.close()
print('Round 276: 2D/3D Settings sizing and alignment PASS (2 themes x 3 widths)')
