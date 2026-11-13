"""Cut07 property/control sweep, including invalid fields and transitive effects."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download
import os,json,re
PASSED=[]
def state(p):
    """Read Save JSON without a real download for *internal assertions*.

    Repeated >10 actual downloads in a single isolated Chromium test were
    intermittently throttled by the browser, creating a false Save failure.
    Browser_smoke/inventory still verify actual downloadable JSON separately.
    """
    return p.evaluate("""async () => {
      const original = HTMLAnchorElement.prototype.click;
      let captured = null;
      HTMLAnchorElement.prototype.click = function() {
        if(this.download === 'mathillustrator.json') { captured = this.href; return; }
        return original.call(this);
      };
      try {
        document.getElementById('save').click();
        if(!captured) throw new Error('Save did not create a JSON object URL');
        const response = await fetch(captured);
        if(!response.ok) throw new Error('Cannot read generated JSON blob');
        return JSON.parse(await response.text());
      } finally { HTMLAnchorElement.prototype.click = original; }
    }""")
def go(p,name):
 p.locator('#object-search').fill(name)
 p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text=re.compile('^'+re.escape(name)+'(?: |$)'))).first.click()
def field(p,name):return p.locator('#properties .field').filter(has_text=name).locator('input,textarea').first
def change(p,name,value):
 e=field(p,name);e.fill(str(value));e.dispatch_event('change')
def check(name,fn):fn();PASSED.append(name)

def run():
 with sync_playwright() as x:
  b=x.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  p=b.new_page(viewport={'width':1540,'height':920},accept_downloads=True)
  errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
  p.on('dialog',lambda d:d.accept('Hello' if d.type=='prompt' else None))
  p.set_content(inline_html(),wait_until='load');p.wait_for_timeout(100)
  for c in ['A=(0,0)','B=(2,0)','C=(1,3)','Segment(A,B)','Circle(A,C)','Midpoint(A,B)','RegularPolygon(A,B,6)','f(x)=sin(x)','N=Node(1,2,"N")','Q=Node(3,2,"Q")','Morphism(N,Q,"f")']:
   cmd(p,c)
  def point():
   go(p,'A');change(p,'Point radius',9);change(p,'Line width',3);change(p,'Opacity',.45)
   o=next(o for o in state(p)['objects'] if o['name']=='A')
   assert o['style']['pointSize']==9 and o['style']['width']==3 and o['style']['opacity']==.45
   change(p,'Point radius',101);assert field(p,'Point radius').input_value()=='9';assert next(o for o in state(p)['objects'] if o['name']=='A')['style']['pointSize']==9
   go(p,'A');coords=p.locator('#properties .twocol input');coords.first.fill('4');coords.first.dispatch_event('change')
   assert next(o for o in state(p)['objects'] if o['name']=='A')['xy'][0]==4
  check('point radius/style/invalid rollback/coordinates',point)
  def polygon():
   go(p,'regularPolygon');change(p,'Number of sides',9)
   assert state(p)['objects'][6]['sides']==9
   change(p,'Number of sides',101);assert field(p,'Number of sides').input_value()=='9';assert state(p)['objects'][6]['sides']==9
   change(p,'Fill','#ff33aa');assert state(p)['objects'][6]['style']['fill']=='#ff33aa'
  check('regular polygon sides/fill/invalid rollback',polygon)
  def expression():
   go(p,'f');change(p,'y(x) =','cos(x)^2');assert next(o for o in state(p)['objects'] if o['type']=='function')['expr']=='cos(x)^2'
   change(p,'y(x) =','Math.random()');assert next(o for o in state(p)['objects'] if o['type']=='function')['expr']=='cos(x)^2'
  check('function expression edit and parser rejection',expression)
  def diagram():
   go(p,'N');change(p,'Text / label','Alpha');change(p,'Font size',20)
   n=next(o for o in state(p)['objects'] if o['type']=='node' and o['name']=='N')
   assert n['fontSize']==20 and n['text']=='Alpha'
   go(p,'morphism');change(p,'Curve / bend',1.5);change(p,'Arrow label','h')
   c=p.get_by_label('Swap label side');c.check()
   m=next(o for o in state(p)['objects'] if o['type']=='morphism')
   assert m['bend']==1.5 and m['text']=='h' and m['swap'] is True
   assert p.locator('#drawing [data-id="'+m['id']+'"] path').count()>=1
  check('node label/font and morphism bend/side/label',diagram)
  def vislock():
   p.locator('#object-search').fill('B')
   row=p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text='B')).first
   row.locator('button').first.click();assert next(o for o in state(p)['objects'] if o['name']=='B')['hidden'] is True
   p.locator('#show-hidden').uncheck();assert p.locator('#objects .object').count()==0 or not p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text='B')).count()
   p.locator('#show-hidden').check();row=p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text='B')).first
   row.locator('button').first.click();row.locator('button').nth(1).click()
   assert next(o for o in state(p)['objects'] if o['name']=='B')['locked'] is True
   row.click();assert p.locator('#properties input').count()==0
   assert p.locator('#delete').is_disabled();assert any(o['name']=='B' for o in state(p)['objects'])
   p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text='B')).first.locator('button').nth(1).click()
  check('hide/filter/show/lock/delete refusal/unlock',vislock)
  def order():
   p.locator('#object-search').fill('');go(p,'A')
   before=[o['id'] for o in state(p)['objects']]
   p.get_by_role('button',name='Bring forward').click()
   after=[o['id'] for o in state(p)['objects']]
   assert before!=after
   p.get_by_role('button',name='Send backward').click()
   assert [o['id'] for o in state(p)['objects']]==before
   p.get_by_role('button',name='Center view').click()
  check('layer order and center-view actions',order)
  def delete():
   go(p,'B');n=len(state(p)['objects']);p.get_by_role('button',name='Delete + dependents').click()
   after=state(p);assert len(after['objects'])<n
   assert all('B' not in o.get('name','') for o in after['objects'])
   p.locator('#undo').click();assert len(state(p)['objects'])==n
   p.locator('#redo').click();assert len(state(p)['objects'])<n
  check('transitive delete/undo/redo',delete)
  def viewport():
   p.locator('#fit').click();assert 'objects' in p.locator('#render-info').inner_text()
   for k in ['zoom-in','zoom-out','zoom-reset']:p.locator('#'+k).click()
   p.locator('#basic-tools [data-tool-choice="pan"]').click()
   r=p.locator('#drawing').bounding_box();sx=r['x']+r['width']/2;sy=r['y']+r['height']/2
   p.mouse.move(sx,sy);p.mouse.down();p.mouse.move(sx+75,sy+15);p.mouse.up()
  check('zoom controls, fit and cursor pan',viewport)
  def reset():
   n=len(state(p)['objects']);p.locator('#new').click();assert not state(p)['objects']
   p.locator('#undo').click();assert len(state(p)['objects'])==n
  check('new and undo recovery',reset)
  assert not errs,errs
  p.close();b.close()
  print('CHROMIUM_CUT07_PROPERTIES_PASS',len(PASSED),'categories:',', '.join(PASSED))
if __name__=='__main__':run()
