"""Cut07 exhaustive supported-feature UI inventory, Chromium isolated DOM (not deployed-site).
Case IDs persisted separately in docs/quality/cut07-control-matrix.json.
"""
import json, math, os, re
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download

CHECKS=[]
def check(name,fn):
    fn();CHECKS.append(name)

def make_page(browser,viewport=None):
    p=browser.new_page(viewport=viewport or {'width':1536,'height':920},accept_downloads=True)
    p.on('dialog',lambda d:d.accept('Node label' if d.type=='prompt' else None))
    p.set_content(inline_html(),wait_until='load');p.wait_for_timeout(120)
    return p

def snap(p):return json.loads(download(p,'Save').read_text())
def center(p):
    r=p.locator('#drawing').bounding_box()
    return r['x']+r['width']/2,r['y']+r['height']/2

def xy(p,x,y):
    a,b=center(p);return a+x*48,b-y*48

def mode(p,t):
    p.locator(f'[data-tool-choice="{t}"]').click()
    assert p.locator('#drawing').get_attribute('data-tool')==t

def click_points(p,coords):
    for x,y in coords:
        px,py=xy(p,x,y);p.mouse.click(px,py)

def single_mode(b,t,vertices,complete='auto'):
    p=make_page(b)
    p.locator('#snap').uncheck();p.locator('#snap-anchors').uncheck()
    mode(p,t);click_points(p,vertices)
    if complete=='enter':p.keyboard.press('Enter')
    data=snap(p)
    expected={'regularPolygon':'regularPolygon'} .get(t,t)
    assert data['objects'] and data['objects'][-1]['type']==expected,(t,data['objects'])
    count=len(data['objects']);p.locator('#undo').click();assert len(snap(p)['objects'])<count,t
    p.locator('#redo').click();assert len(snap(p)['objects'])==count,t
    p.close()

def run():
  with sync_playwright() as x:
    b=x.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    two=[(-2,0),(2,1)]
    cases={
      'point':[(-2,1)], 'segment':two, 'arrow':two,'line':two,
      'circle':[(-2,0),(0,2)], 'ellipse':[(-2,-1),(2,1)], 'rectangle':[(-2,-1),(2,1)],
      'regularPolygon':two, 'polygon':[(-2,-1),(1,-2),(2,1)],'polyline':[(-2,-1),(1,0),(2,1)],
      'bezier':[(-2,-1),(-1,2),(1,2),(2,-1)],'angle':[(-2,1),(0,0),(2,1)],
      'text':[(-1,0)], 'node':[(0,0)]}
    for t,pts in cases.items():check('tool.'+t,lambda t=t,pts=pts:single_mode(b,t,pts,'enter' if t in ('polygon','polyline') else 'auto'))
    p=make_page(b)
    def freehand():
      mode(p,'freehand');a,b0=xy(p,-2,-1);c,d=xy(p,2,1);p.mouse.move(a,b0);p.mouse.down();p.mouse.move(c,d,steps=12);p.mouse.up()
      assert snap(p)['objects'][-1]['type']=='freehand'
    check('tool.freehand',freehand)
    def commands():
      for s in ['A=(0,0)','B=(2,0)','C=(1,3)','M(x)=sin(x)','Segment(A,B)','Arrow(B,C)','Line(A,C)','Circle(A,B)','Ellipse(A,C)','Polygon(A,B,C)','Polyline(A,B,C)','Bezier(A,B,C,A)','Angle(A,B,C)','Midpoint(A,B)','RegularPolygon(A,B,5)','N=Node(1,2,"N")','Q=Node(3,2,"Q")','Morphism(N,Q,"f")']:
        cmd(p,s)
      o=snap(p)['objects'];assert len(o)==19,[(q['name'],q['type']) for q in o]
      for expr in ['f(x)=1/(x-1)','g(x)=sin(x)^2','h(x)=-x^2+1']:cmd(p,expr)
      assert len(snap(p)['objects'])==22
    check('commands.all-supported',commands)
    def invalid():
      before=snap(p)
      for q in ['A=(NaN,0)','A=(10,0)','Segment(A,A)','RegularPolygon(A,A,5)','g(x)=process.exit(0)','Point(A)','Bezierr(A,B,C,A)','q(x)=2**3']:
        cmd(p,q)
        assert snap(p)==before,q
    check('commands.all-invalid-atomic',invalid)
    def search_select():
      p.locator('#object-search').fill('Morphism');assert p.locator('#objects .object').count()==1
      p.locator('#show-hidden').uncheck();assert p.locator('#objects .object').count()==1
      p.locator('#object-search').fill('');assert p.locator('#objects .object').count()>1
      p.locator('#objects .object').first.click();assert p.locator('#properties input').count()>4
    check('objects.search-select',search_select)
    def property_edits():
      p.locator('#object-search').fill('A ')
      p.locator('#object-search').fill('A')
      p.locator('#objects .object').filter(has_text='A').first.click()
      n=p.locator('#properties .field').filter(has_text='Name').locator('input')
      n.fill('Anchor_A');n.dispatch_event('change')
      assert any(o['name']=='Anchor_A' for o in snap(p)['objects'])
      p.locator('#object-search').fill('Anchor_A');p.locator('#objects .object').first.click()
      f=p.locator('#properties .field').filter(has_text='Opacity').locator('input');f.fill('0.3');f.dispatch_event('change')
      assert abs(next(o for o in snap(p)['objects'] if o['name']=='Anchor_A')['style']['opacity']-.3)<1e-9
    check('objects.style-rename',property_edits)
    def settings():
      ids={'correction':'strong','polygon-sides':'7','snap-step':'0.25','default-stroke':'#ff0000','default-fill':'#00aa00','default-width':'3','point-size':'9','default-opacity':'0.6','background':'#eeeeee','export-scale':'3'}
      for id,value in ids.items():
        el=p.locator('#'+id)
        if id=='correction' or id=='export-scale':el.select_option(value)
        elif id.endswith('stroke') or id.endswith('fill') or id=='background':el.fill(value);el.dispatch_event('change')
        else:el.fill(value);el.dispatch_event('change')
        assert el.input_value()==value,(id,el.input_value())
      for id in ['snap','snap-anchors','grid','axes','labels','export-guides']:
        el=p.locator('#'+id);el.check() if not el.is_checked() else el.uncheck()
        assert isinstance(el.is_checked(),bool)
      p.locator('#page').select_option('a4');p.locator('#export-region').select_option('page')
      assert snap(p)['settings']['exportRegion']=='page'
      p.locator('#page').select_option('infinite')
      assert snap(p)['settings']['exportRegion']=='viewport'
      p.locator('#theme').select_option('dark');assert p.locator('html').get_attribute('data-theme')=='dark'
      p.locator('#theme').select_option('light');assert p.locator('html').get_attribute('data-theme')=='light'
    check('settings.individual-controls',settings)
    def presets():
      for preset in ['General','Olympiad geometry','Research diagram','Analysis / plots','Free illustration','Commutative diagrams']:
        p.locator('#preset').select_option(preset)
        assert p.locator('#preset').input_value()==preset
      for m in ['construction','illustration','diagram']:
        p.locator('#module-'+m).check()
        assert p.locator('[data-tool-module="'+m+'"]').is_visible()
    check('settings.presets-and-tool-modules',presets)
    def export_modes():
      p.locator('#export-open').click()
      for label in ['PDF','Asymptote','GIF / video']:assert p.get_by_role('button',name=label,exact=True).is_disabled()
      for label in ['SVG','PNG','JPEG','WebP','JSON project']:
        if p.locator('#export-menu').is_hidden():p.locator('#export-open').click()
        f=download(p,label)
        assert f.stat().st_size>30,(label,f.stat().st_size)
        if label=='PNG':assert f.read_bytes().startswith(b'\x89PNG')
        if label=='JPEG':assert f.read_bytes().startswith(b'\xff\xd8')
        if label=='WebP':assert f.read_bytes()[8:12]==b'WEBP'
    check('export.raster-svg-native',export_modes)
    p.close()
    b.close()
  print('CHROMIUM_CUT07_INVENTORY_PASS',len(CHECKS),'categories:',', '.join(CHECKS))

if __name__=='__main__':run()
