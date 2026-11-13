"""Cut 08 isolated Chromium regressions: anchor collapse rollback, snap bounds,
XML-invalid labels, undo, and large-scene search. Not a deployed-site test.
"""
import json, os, re, time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd
from browser_cut07_properties import state

def byname(p,name):
    return next(o for o in state(p)['objects'] if o['name']==name)

def prop(p,name):
    p.locator('#object-search').fill(name)
    row=p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text=re.compile('^'+re.escape(name)+'$')))
    row.first.click()
    return p.locator('#properties')

def run():
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  p=b.new_page(viewport={'width':1460,'height':900},accept_downloads=True)
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
  p.set_content(inline_html(),wait_until='load');p.wait_for_timeout(100)
  for c in ('A=(0,0)','B=(2,0)','Segment(A,B)','Circle(A,B)'): cmd(p,c)
  # Reject an anchor coordinate that collapses BOTH segment and circle; preserve
  # property field, object reference, dependent objects and undo history.
  prop(p,'B');coord=p.locator('#properties .twocol input').first
  coord.fill('0');coord.dispatch_event('change')
  assert byname(p,'B')['xy']==[2,0],byname(p,'B')
  assert coord.input_value()=='2',coord.input_value()
  assert 'collapse' in p.locator('#toast').inner_text().lower()
  assert p.locator('#drawing line[data-id="o3"]').count()>=1
  coord.fill('3');coord.dispatch_event('change')
  assert byname(p,'B')['xy']==[3,0]
  p.locator('#undo').click();assert byname(p,'B')['xy']==[2,0]
  p.locator('#redo').click();assert byname(p,'B')['xy']==[3,0]
  print('BROWSER_CUT08_PASS property collapse rejection, valid edit, undo/redo')
  # A real pointer gesture must not bypass the model's geometry guard.
  p.locator('#object-search').fill('')
  point=p.locator('circle[data-id="o2"]')
  box=point.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
  center=p.locator('#drawing').bounding_box();ax=center['x']+center['width']/2;ay=center['y']+center['height']/2
  p.mouse.move(x,y);p.mouse.down();p.mouse.move(ax,ay,steps=8);p.mouse.up()
  assert byname(p,'B')['xy']==[3,0],byname(p,'B')
  print('BROWSER_CUT08_PASS pointer drag collapse rollback')
  prop(p,'A');name=p.locator('#properties .field').filter(has_text='Name').locator('input').first
  name.evaluate('(e)=>{e.value="NUL\\u0000name";e.dispatchEvent(new Event("change",{bubbles:true}));}')
  assert byname(p,'A')['name']=='A'
  assert 'SVG XML' in p.locator('#toast').inner_text()
  snap=p.locator('#snap-step');snap.fill('1e-320');snap.dispatch_event('change')
  assert state(p)['settings']['snapStep']==0.5
  print('BROWSER_CUT08_PASS XML-invalid name and extreme snap bounds')
  assert not errors,errors
  p.close()
  # 4,000 object graph: indexed name lookups remain bounded during search.
  p=b.new_page(viewport={'width':1480,'height':920},accept_downloads=True)
  p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
  p.set_content(inline_html(),wait_until='load');p.wait_for_timeout(100)
  template=state(p)
  objects=[];style=template['objects'][0]['style'] if template['objects'] else {'stroke':'#3657ad','fill':'#b6c9f9','width':2,'opacity':1,'pointSize':5}
  for i in range(1600):
   objects.append({'id':f'o{i+1}','name':f'P{i+1}','type':'point','xy':[i%160-80,i//160],'style':style,'hidden':False,'locked':False})
  for i in range(2400):
   objects.append({'id':f'o{i+1601}','name':f'S{i+1}','type':'segment','refs':[f'o{i%1600+1}',f'o{(i+17)%1600+1}'],'style':{k:v for k,v in style.items() if k!='pointSize'},'hidden':False,'locked':False})
  template.update(objects=objects,nextId=4001)
  p.evaluate('''async data=>{
   const f=new File([JSON.stringify(data)],'large.json',{type:'application/json'});
   const input=document.getElementById('open-file');const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;
   input.dispatchEvent(new Event('change',{bubbles:true}));
   await new Promise(resolve=>setTimeout(resolve,300));
  }''',template)
  assert p.locator('#object-count').inner_text()=='4000','large import failed'
  times=[]
  for q in ('segment(','P','S','segment('):
   elapsed=p.evaluate('''q=>{const el=document.getElementById('object-search'),start=performance.now();el.value=q;el.dispatchEvent(new Event('input',{bubbles:true}));return performance.now()-start;}''',q)
   times.append(round(elapsed,1))
  assert p.locator('#objects .object').count()<100
  assert max(times)<550,f'scene filtering stalled: {times}'
  assert not errors,errors
  print('BROWSER_CUT08_PASS 4000-object indexed search',times,'ms; max 550ms threshold in this isolated run')
  b.close()

if __name__=='__main__':run()
