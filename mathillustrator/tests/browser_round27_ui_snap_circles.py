"""Round27 isolated real Chromium checks; no hosted HTTP-origin claim."""
import json,math,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   assert page.locator('#drawing').count()==1
   assert page.locator('#label-placement').input_value()=='avoid'
   dims=page.evaluate('''() => {
    const group=document.querySelector('#default-color-swatches-stroke .color-swatches');
    const tiles=[...group.children].map(n=>n.getBoundingClientRect());
    const g=group.getBoundingClientRect();
    const field=document.querySelector('#background').getBoundingClientRect();
    const theme=document.querySelector('#theme').getBoundingClientRect();
    return {tiles:tiles.map(r=>[r.width,r.height,r.x,r.right]),group:[g.x,g.right],background:[field.width,field.x],theme:[theme.width,theme.x]};
   }''')
   assert len(dims['tiles'])==10,dims
   assert all(abs(t[0]-20)<.05 and abs(t[1]-20)<.05 for t in dims['tiles']),dims
   assert abs(dims['tiles'][4][3]-dims['group'][1])<1.2,dims
   assert abs(dims['background'][0]-dims['theme'][0])<1.2,dims
   assert abs(dims['background'][1]-dims['theme'][1])<1.2,dims
   # Real clicks on two circles in advanced mode; one transaction creates both.
   page.locator('#auto-pan').uncheck();page.locator('#geometry-essential').uncheck()
   assert page.get_by_role('button',name='Circle–circle intersections').is_visible()
   for text in ['A=(-1,0)','B=(-1,3)','C=(2,0)','D=(2,3)','Circle(A,B)','Circle(C,D)']:
    cmd(page,text)
   before=json.loads(download(page,'Save').read_text())
   circles=[o for o in before['objects'] if o['type']=='circle']
   assert len(circles)==2
   box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   page.locator('[data-tool-choice="circleCircleIntersection"]').click()
   page.mouse.click(cx-4*48,cy)
   page.mouse.click(cx+5*48,cy)
   data=json.loads(download(page,'Save').read_text())
   roots=[o for o in data['objects'] if o['type']=='circleCircleIntersection']
   assert len(roots)==2,roots
   assert {r['branch'] for r in roots}=={-1,1}
   assert all(r['refs']==[circles[0]['id'],circles[1]['id']] for r in roots)
   for o in roots:
    pos=page.locator(f'#drawing circle[data-id="{o["id"]}"]')
    assert pos.count()==1
    x=float(pos.get_attribute('cx'));y=float(pos.get_attribute('cy'))
    assert abs(x-(box['width']/2+.5*48))<1,(x,y)
    assert abs(y-(box['height']/2-o['branch']*48*math.sqrt(9-1.5**2)))<1,(x,y)
   page.locator('#undo').click()
   assert not [o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='circleCircleIntersection']
   page.locator('#redo').click()
   assert len([o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='circleCircleIntersection'])==2
   page.locator('[data-tool-choice="circleCircleIntersection"]').click()
   page.mouse.click(cx-4*48,cy);page.keyboard.press('Escape')
   assert len([o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='circleCircleIntersection'])==2
   page.locator('#ui-language').select_option('zh')
   assert page.get_by_role('button',name='两圆交点').count()==1
   page.locator('#ui-language').select_option('en')
   page.locator('#export-open').click()
   assert page.get_by_role('button',name='TikZ / PGF').is_disabled()
   svg=download(page,'SVG').read_text();assert all(o['id'] in svg for o in roots)
   # Two overlapping shape-label anchors share the point-label collision
   # layout and avoid text-to-text intersection by default.
   for item in ['E=(0,0)','F=(0,2)','G=(0,0)','H=(0,3)','Circle(E,F)','Circle(G,H)']:
    cmd(page,item)
   latest=json.loads(download(page,'Save').read_text())
   extra=[o for o in latest['objects'] if o['type']=='circle'][-2:]
   for o,label in zip(extra,['alpha','beta']):
    page.locator(f'#objects .object[data-id="{o["id"]}"]').click()
    # The default is LaTeX in Round 28; explicitly choose plain rendering
    # for this older SVG-text collision measurement fixture.
    page.locator('#properties label.field').filter(has_text='Label format').locator('select').select_option('plain')
    label_input=page.locator('#properties label.field').filter(has_text='Displayed label').locator('input')
    label_input.fill(label);label_input.press('Tab')
   labels=page.locator('#drawing text.geometry-display-label')
   assert labels.count()>=2
   rects=labels.evaluate_all('''(nodes)=>nodes.filter(n=>['alpha','beta'].includes(n.textContent)).map(n=>{const r=n.getBBox();return {text:n.textContent,x:r.x,y:r.y,w:r.width,h:r.height}})''')
   assert len(rects)==2,rects
   a,b=rects
   overlap=max(0,min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x']))*max(0,min(a['y']+a['h'],b['y']+b['h'])-max(a['y'],b['y']))
   assert overlap < .1,rects
   page.set_viewport_size({'width':390,'height':780})
   assert page.locator('#drawing').is_visible()
   assert not errors,errors
   print('ROUND27_CHROMIUM_PASS: square evenly distributed swatches, aligned background picker, avoid-label default, circle-circle canvas hits and roots, JSON, undo/redo, Escape, Chinese, SVG, mobile')
  finally:browser.close()
if __name__=='__main__':run()
