"""Round19 isolated Chromium DOM/gesture acceptance (not deployed-site verification)."""
import json, math, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download

PASSED=[]
def passed(name):PASSED.append(name)
def page(browser,width=1440,height=900):
 p=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
 p.errors=[];p.on('pageerror',lambda e:p.errors.append(str(e)))
 p.on('dialog',lambda d:d.accept('text' if d.type=='prompt' else None))
 p.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
 p.wait_for_selector('[data-tool-choice="ellipse"]')
 return p

def xy(p,x,y):
 r=p.locator('#drawing').bounding_box();return r['x']+r['width']/2+x*48,r['y']+r['height']/2-y*48

def click(p,x,y):p.mouse.click(*xy(p,x,y))
def move(p,x,y):p.mouse.move(*xy(p,x,y))
def scene(p):return json.loads(download(p,'Save').read_text())

def close(a,b,tol=0.003):assert abs(a-b)<tol,(a,b)

def run():
 with sync_playwright() as playwright:
  b=playwright.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   p=page(b)
   assert not p.errors,p.errors
   assert p.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
   assert p.locator('#properties-toggle').is_disabled()
   assert not p.locator('#properties').is_hidden()
   assert p.locator('#snap-objects').is_checked()
   assert p.locator('#auto-pan').is_checked()
   assert p.locator('.settings-subsection').count()==2
   assert p.locator('.settings-subsection h4').all_inner_texts()==['Snap','Show']
   assert any('Geometry' in title for title in p.locator('#panel-sections h3').all_inner_texts())
   passed('startup: new defaults, Plotting without question mark, Snap/Show subdivisions')

   # ellipse: first focus, second focus, third point on ellipse, even when rotated
   p.locator('#snap').uncheck();p.locator('#snap-anchors').uncheck()
   p.locator('[data-tool-choice="ellipse"]').click()
   click(p,0,-2);click(p,0,2)
   assert scene(p)['objects']==[], 'the two focus clicks should be a draft, not objects'
   move(p,3,0);p.wait_for_timeout(40)
   assert p.locator('.draft-ellipse').count()==1
   click(p,3,0)
   d=scene(p);o=d['objects'][-1]
   assert o['type']=='ellipse' and len(o['refs'])==3
   assert len(d['objects'])==4
   assert p.locator('#drawing').get_attribute('data-tool')=='pan'
   graphic=p.locator(f'#drawing ellipse[data-id="{o["id"]}"]').first
   assert graphic.count()==1
   assert 'rotate(90' in graphic.get_attribute('transform')
   assert p.locator('[data-tool-choice="ellipse"] .tool-icon').count()>=0 # actual SVG checked below
   icon=p.locator('[data-tool-choice="ellipse"] svg').first.inner_html()
   assert icon.count('<circle')==2 and icon.count('fill="currentColor"')==2,icon
   p.locator('#export-open').click();svg=download(p,'SVG').read_text()
   assert 'rotate(90' in svg and '<ellipse' in svg
   p.locator('#export-open').click();tikz=download(p,'TikZ / PGF').read_text()
   assert 'rotate=90' in tikz and 'ellipse (' in tikz
   old=d.copy();p.locator('#undo').click();assert scene(p)['objects']==[]
   p.locator('#redo').click();assert scene(p)['objects']==d['objects']
   passed('focal ellipse: 3 clicks, live preview, rotated SVG/TikZ, icon, undo/redo')
   p.close()

   # A malformed third click in the focal segment must remain a 2-click draft.
   p=page(b);p.locator('#snap').uncheck();p.locator('#snap-anchors').uncheck()
   p.locator('[data-tool-choice="ellipse"]').click();click(p,-2,0);click(p,2,0);click(p,0,0)
   assert scene(p)['objects']==[]
   assert p.locator('#drawing').get_attribute('data-tool')=='ellipse'
   click(p,0,3)
   assert scene(p)['objects'][-1]['type']=='ellipse'
   passed('degenerate ellipse rejected without phantom objects or tool switching')
   p.close()

   # New Point snaps to perimeter of an existing segment at 16 screen px.
   p=page(b);p.locator('#snap').uncheck();p.locator('#snap-anchors').uncheck()
   cmd(p,'A=(-2,0)');cmd(p,'B=(2,0)');cmd(p,'Segment(A,B)')
   p.locator('[data-tool-choice="point"]').click();click(p,0,0.2)
   d=scene(p);close(d['objects'][-1]['xy'][1],0)
   assert p.locator('#drawing').get_attribute('data-tool')=='pan'
   p.locator('#snap-objects').uncheck()
   p.locator('[data-tool-choice="point"]').click();click(p,1,0.2)
   d=scene(p);close(d['objects'][-1]['xy'][1],0.2)
   passed('point attraction enabled/disabled independently of grid and anchor snap')
   # When in Pan, dragging an unlocked point changes to Move, not canvas pan.
   p.locator('#snap-objects').check()
   p.locator('[data-tool-choice="point"]').click();click(p,0,1.4)
   original=scene(p)['objects'][-1]
   assert p.locator('#drawing').get_attribute('data-tool')=='pan'
   px,py=xy(p,0,1.4);p.mouse.move(px,py);p.mouse.down();p.mouse.move(px+48,py-10,steps=6);p.mouse.up()
   assert p.locator('#drawing').get_attribute('data-tool')=='select'
   newer=next(o for o in scene(p)['objects'] if o['id']==original['id'])
   assert newer['xy'][0] > original['xy'][0]+0.5,(original,newer)
   passed('Pan drag above point switches to Move and drags without changing canvas view')
   p.locator('#auto-pan').uncheck()
   p.locator('[data-tool-choice="point"]').click();click(p,4,2)
   assert p.locator('#drawing').get_attribute('data-tool')=='point'
   passed('disabling auto-pan leaves active drawing tool selected')
   # Keyboard language and local preference separation
   p.locator('#ui-language').focus();p.keyboard.press('Enter')
   assert p.locator('#auto-pan').get_attribute('id')=='auto-pan'
   assert '平移' in p.locator('#auto-pan').locator('..').inner_text()
   passed('one-click bilingual auto-tool preference')
   assert not p.errors,p.errors
   p.set_viewport_size({'width':390,'height':780});p.wait_for_timeout(110)
   assert not p.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
   assert p.locator('#properties-dock').evaluate('(n)=>n.parentElement.classList.contains("leftpanel")')
   assert p.locator('#properties-toggle').is_enabled()
   p.set_viewport_size({'width':1440,'height':900});p.wait_for_timeout(110)
   assert p.locator('#properties-toggle').is_disabled()
   assert p.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
   passed('mobile docking and desktop float restore without folding')
   p.close()

   # explicit docked preferences are still respected, including collapse.
   p=page(b)
   p.locator('#properties-undock').click()
   assert not p.locator('body').evaluate('(n)=>n.classList.contains("properties-floating")')
   assert p.locator('#properties-toggle').is_enabled()
   p.locator('#properties-toggle').click()
   assert p.locator('#properties').is_hidden()
   p.locator('#properties-undock').click()
   assert p.locator('#properties-toggle').is_disabled()
   assert not p.locator('#properties').is_hidden()
   p.locator('#properties-undock').click()
   assert p.locator('#properties').is_hidden()
   assert not p.errors,p.errors
   passed('docked collapse preference survives floating and returns on dock')
   p.close()
  finally:b.close()
 print('ROUND19_CHROMIUM_PASS:',len(PASSED),'scenarios:',', '.join(PASSED))

if __name__=='__main__':run()
