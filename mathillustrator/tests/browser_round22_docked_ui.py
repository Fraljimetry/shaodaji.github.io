"""Round 22 isolated Chromium gate: permanent docks, responsive appearance, ellipse and LaTeX."""
import os, json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download


def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   for width in (1440,900,390):
    page=browser.new_page(viewport={'width':width,'height':860},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
    page.wait_for_selector('[data-tool-choice="ellipse"]',state='attached')
    assert page.locator('#correction').input_value()=='ultra'
    assert all(page.locator('#'+x).is_hidden() for x in ('properties-undock','objects-undock','tools-undock'))
    assert page.locator('#properties-dock').evaluate('e=>e.parentElement.classList.contains("leftpanel")')
    assert not page.locator('body').evaluate('e=>[...e.classList].some(c=>c.includes("floating"))')
    if width<=700:page.locator('#right-collapse').click()
    for lang in ('en','zh'):
     page.locator('#ui-language').select_option(lang)
     assert page.locator('#correction').input_value()=='ultra'
     for control in ('#polygon-sides','#export-scale','#theme','#background'):
      page.locator(control).evaluate('e=>{e.closest(".section-body").hidden=false;document.querySelector("#settings-sections").hidden=false;}')
     geometry=page.evaluate('''() => {
      const bounds=id=>{const e=document.querySelector(id).getBoundingClientRect();return {left:e.left,right:e.right,top:e.top,width:e.width,height:e.height};};
      return {polygon:bounds('#polygon-sides'),raster:bounds('#export-scale'),theme:bounds('#theme'),background:bounds('#background')};
     }''')
     assert abs(geometry['raster']['left']-geometry['theme']['left'])<2,(width,lang,geometry)
     assert abs(geometry['raster']['right']-geometry['theme']['right'])<2,(width,lang,geometry)
     assert abs(geometry['raster']['left']-geometry['polygon']['left'])<2,(width,lang,geometry)
     assert abs(geometry['raster']['left']-geometry['background']['left'])<2,(width,lang,geometry)
     for id in ('raster','theme','polygon','background'):assert geometry[id]['width']>25,(id,geometry)
    assert page.locator('#theme').evaluate('e=>e.closest("label").compareDocumentPosition(document.getElementById("background")) & Node.DOCUMENT_POSITION_FOLLOWING')
    # Properties are in the left column and duplicate the two-column palette.
    if width>700:
     page.locator('#ui-language').select_option('en')
     cmd(page,'A=(-2,0)');cmd(page,'B=(2,0)');cmd(page,'C=(0,0)')
     page.locator('#objects .object[data-id="o1"]').click()
     grid=page.locator('#properties .style-controls-grid')
     assert grid.locator('.style-stroke').count()==1
     # Inspect a fill-capable ellipse below, rather than assuming points have Fill.
     # The number fields must share rows with their captions (not stack vertically).
     for label in ('.style-width','.style-opacity','.style-pointsize'):
      pair=grid.locator(label+' .field').evaluate('''e=>{const a=e.getBoundingClientRect(),b=e.querySelector('input').getBoundingClientRect();return {dy:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),right:Math.abs(a.right-b.right)};}''')
      assert pair['dy']<8 and pair['right']<7,(width,label,pair)
     page.locator('[data-tool-choice="ellipse"]').click()
     bb=page.locator('#drawing').bounding_box(); cx=bb['x']+bb['width']/2;cy=bb['y']+bb['height']/2
     # Existing midpoint anchor at C would formerly swallow a nearby third click.
     for x,y in ((cx-96,cy),(cx+96,cy),(cx,cy-8)):
      page.mouse.click(x,y)
     saved=json.loads(download(page,'Save').read_text())
     ellipses=[o for o in saved['objects'] if o['type']=='ellipse']
     assert len(ellipses)==1,saved['objects']
     ellipse=ellipses[0];assert len(ellipse['refs'])==3
     q=next(o['xy'] for o in saved['objects'] if o['id']==ellipse['refs'][2]);assert abs(q[1])>0.05,ellipse
     assert page.locator('#drawing ellipse').count()>=1
     page.locator('#objects .object[data-id="'+ellipse['id']+'"] ').click()
     grid=page.locator('#properties .style-controls-grid')
     assert grid.locator('.style-fill').count()==1
     for selector in ('.style-stroke .color-swatches','.style-fill .color-swatches'):
      sw=grid.locator(selector)
      assert sw.locator('.color-swatch').count()==10
      css=sw.evaluate('e=>({display:getComputedStyle(e).display,cols:getComputedStyle(e).gridTemplateColumns.split(" ").length})')
      assert css['display']=='grid' and css['cols']==5,(selector,css)
     # A failed ellipse construction never changes JSON or the undo stack.
     page.locator('#undo').click();assert not [o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='ellipse']
     page.locator('#redo').click();assert len([o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='ellipse'])==1
     # Distinct foci within 12 screen pixels must remain distinct when tapped.
     page.locator('[data-tool-choice="ellipse"]').click()
     for x,y in ((cx,cy),(cx+8,cy),(cx+44,cy-76)):page.mouse.click(x,y)
     again=json.loads(download(page,'Save').read_text())
     ellipses=[o for o in again['objects'] if o['type']=='ellipse'];assert len(ellipses)==2,ellipses
     ids=ellipses[-1]['refs'][:2]
     foc=[next(o['xy'] for o in again['objects'] if o['id']==id) for id in ids]
     assert abs(foc[0][0]-foc[1][0])>0.1,(foc,ellipses[-1])
     page.locator('[data-tool-choice="text"]').click()
     page.once('dialog',lambda dlg:dlg.accept(r'$\alpha+\beta$'))
     page.mouse.click(cx+115,cy-110)
     doc=json.loads(download(page,'Save').read_text())
     texts=[o for o in doc['objects'] if o['type']=='text'];assert texts and texts[-1]['textMode']=='latex',texts
     assert texts[-1]['text']==r'\alpha+\beta',texts[-1]
    assert not errors,(width,errors)
    page.close()
   # A prior-release browser preference must not recreate any floating mode.
   stale=browser.new_page(viewport={'width':1440,'height':860})
   legacy={'propertiesPanel':{'mode':'floating','collapsed':True,'width':440,'height':470},
           'floatingPanels':{'left':{'mode':'floating'},'right':{'mode':'floating'}}}
   seed='''<script>(function(){const store=new Map([['mathillustrator-layout-v1',%s]]);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}})})()</script>''' % json.dumps(json.dumps(legacy))
   html=inline_html(legacy_search_expanded=False).replace('<script type="module">',seed+'<script type="module">',1)
   errors=[];stale.on('pageerror',lambda e:errors.append(str(e)))
   stale.set_content(html,wait_until='load');stale.wait_for_selector('[data-tool-choice="ellipse"]')
   assert stale.locator('#properties-dock').evaluate('e=>e.parentElement.classList.contains("leftpanel")')
   assert stale.locator('.leftpanel').evaluate('e=>e.parentElement.classList.contains("workspace")')
   assert stale.locator('.rightpanel').evaluate('e=>e.parentElement.classList.contains("workspace")')
   assert not stale.locator('body').evaluate('e=>[...e.classList].some(c=>c.includes("floating"))')
   assert all(stale.locator('#'+x).is_hidden() for x in ('properties-undock','objects-undock','tools-undock'))
   assert not errors,errors
   stale.close()
   print('ROUND22_CHROMIUM_PASS: 1440/900/390 EN+ZH docks, stale floating preferences, alignment, ellipse snaps, two-column appearance, undo/redo, text LaTeX')
  finally:browser.close()

if __name__=='__main__':run()
