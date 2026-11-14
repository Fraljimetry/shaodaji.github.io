"""Round 24 real headless Chromium: SVG-true ellipse, labels, defaults, layout and export.
Isolated inlined module fixture; does not simulate deployed-site HTTP/cache loading.
"""
import json, os, math
from playwright.sync_api import sync_playwright
from browser_smoke import ROOT, inline_html, download

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
   shim="""<script>(function(){const store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()}})})();</script>"""
   page.set_content(inline_html(legacy_search_expanded=False).replace('<head>','<head>'+shim,1),wait_until='load')
   page.wait_for_selector('[data-tool-choice="ellipse"]')
   assert not page.locator('#snap').is_checked(),'Grid snapping should be opt-in in new projects'
   assert page.locator('#export-guides').is_checked()
   assert not page.locator('#export-transparent').is_checked()
   assert not errors,errors
   for color in ('stroke','fill'):
    palette=page.locator('#default-color-swatches-'+color+' button')
    assert palette.count()==10
    assert palette.last.get_attribute('aria-label')=='Purple'
    assert 'Teal' not in palette.all_text_contents()
    rect1=palette.first.bounding_box();rect5=palette.nth(4).bounding_box()
    root=page.locator('#default-color-swatches-'+color).bounding_box()
    assert abs((rect5['x']+rect5['width'])-(root['x']+root['width']))<2.1,(root,rect5)
   # Direct mouse ellipse: oblique foci and off-grid third click.
   page.locator('#auto-pan').uncheck()
   canvas=page.locator('#drawing').bounding_box();cx=canvas['x']+canvas['width']/2;cy=canvas['y']+canvas['height']/2
   coords=[(cx-133.4,cy+112.7),(cx+48.6,cy-41.5),(cx-19.7,cy-98.2)]
   page.locator('[data-tool-choice="ellipse"]').click()
   for pt in coords:page.mouse.click(*pt)
   project=json.loads(download(page,'Save').read_text())
   ellipse=[o for o in project['objects'] if o['type']=='ellipse'];assert len(ellipse)==1
   obj=ellipse[0];assert len(obj['refs'])==3
   anchors=[next(o['xy'] for o in project['objects'] if o['id']==ref) for ref in obj['refs']]
   assert any(abs(q-round(q*2)/2)>.02 for a in anchors for q in a),anchors
   # Inspect actual rendered SVG transform rather than merely the model math.
   result=page.evaluate('''id=>{
     const node=document.querySelector('#drawing ellipse[data-id="'+id+'"]');
     const svg=document.querySelector('#drawing');if(!node)throw Error('No focal ellipse SVG');
     const pts=id=>document.querySelector('#drawing circle[data-id="'+id+'"]');
     const [a,b,c]=[...document.querySelectorAll('#drawing circle[data-id]')].filter(n=>n.getAttribute('r')==='5');
     const e=node, cx=e.cx.baseVal.value,cy=e.cy.baseVal.value,rx=e.rx.baseVal.value,ry=e.ry.baseVal.value;
     const transform=e.transform.baseVal.consolidate().matrix;
     const anchors=[...document.querySelectorAll('#drawing circle[data-id]')].filter(n=>n.getAttribute('r')==='5');
     const x=anchors[2].cx.baseVal.value,y=anchors[2].cy.baseVal.value;
     const p=svg.createSVGPoint();p.x=x;p.y=y;
     const local=p.matrixTransform(transform.inverse());
     return {onEllipse:((local.x-cx)/rx)**2+((local.y-cy)/ry)**2,angle:e.getAttribute('transform'),count:anchors.length};
   }''',obj['id'])
   assert result['count']==3,result
   assert abs(result['onEllipse']-1)<1e-7,result
   # A shape label is persisted separately from its stable name and refs.
   page.locator('#objects .object[data-id="'+obj['id']+'"]').click()
   display=page.locator('#properties label.field').filter(has_text='Displayed label').locator('input')
   assert display.count()==1
   display.fill('E_1');display.press('Tab')
   assert page.locator('#drawing .geometry-display-label').count()==1
   after=json.loads(download(page,'Save').read_text());saved=next(o for o in after['objects'] if o['id']==obj['id'])
   assert saved['displayLabel']=='E_1' and saved['refs']==obj['refs']
   page.locator('#undo').click();assert page.locator('#drawing .geometry-display-label').count()==0
   page.locator('#redo').click();assert page.locator('#drawing .geometry-display-label').count()==1
   page.locator('#export-open').click()
   assert page.get_by_role('button',name='TikZ / PGF').is_disabled()
   svg=download(page,'SVG').read_text();assert 'E_1' in svg
   # Additional page frames and fonts, no change to object identifiers.
   for paper in ['a3','a5','legal','tabloid','square','widescreen']:
    page.locator('#page').select_option(paper)
    assert page.locator('#page').input_value()==paper
   for font in ['verdana','trebuchet','palatino','times']:
    page.locator('#ui-font').select_option(font)
    assert page.locator('#ui-font').input_value()==font
   for lang in ['zh','en']:
    page.locator('#ui-language').select_option(lang)
    assert page.locator('#properties label.field').filter(has_text=('显示标签' if lang=='zh' else 'Displayed label')).count()==1
   # Layout at desktop and mobile widths; Number spinners use RTL native input mode.
   assert page.locator('#default-width').evaluate('e=>getComputedStyle(e).direction')=='rtl'
   page.set_viewport_size({'width':390,'height':780});page.locator('#right-collapse').click()
   assert page.locator('#default-color-swatches-fill button').count()==10
   for color in ('stroke','fill'):
    swatches=page.locator('#default-color-swatches-'+color)
    assert swatches.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
   assert not errors,errors
   print('ROUND24_CHROMIUM_PASS: SVG focal-ellipse invariant, off-grid defaults, displayed labels, JSON/undo/redo/SVG/TikZ fail closed, paper/font controls, purple palette, EN/ZH, 390px')
  finally:browser.close()
if __name__=='__main__':run()
