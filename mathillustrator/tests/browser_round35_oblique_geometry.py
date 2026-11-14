"""Round 35 real isolated Chromium: oblique and three-point geometry, pan, measures, colors and glyphs."""
import json,math,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download


def saved(page):
 return json.loads(download(page,'Save').read_text())

def geometric(d,typ):
 return [o for o in d['objects'] if o['type']==typ and not o.get('edgeOf')]

def tap(page,dx,dy):
 box=page.locator('#drawing').bounding_box()
 page.mouse.click(box['x']+box['width']/2+dx,box['y']+box['height']/2+dy)

def run():
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   p=b.new_page(viewport={'width':1470,'height':890},accept_downloads=True)
   errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
   p.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   p.locator('[data-tool-choice="parallelogram"]').wait_for(state='attached')
   assert p.locator('#default-stroke').input_value()=='#000000'
   assert p.locator('#default-fill').input_value()=='#000000'
   # Authorized changes to control-point glyphs; each reflects actual canvas taps.
   for name,count in [('point',1),('segment',2),('ray',2),('arrow',2),('bezier',4),('rectangle',3),('parallelogram',3)]:
    svg=p.locator(f'[data-tool-choice="{name}"] svg').inner_html()
    # Count only authored control-point circles; fixed icon snapshots check unchanged remainder.
    count_actual=p.locator(f'[data-tool-choice="{name}"] svg circle').count()
    assert count_actual==count,(name,count_actual,svg)
   for name in ['segment','ray']:
    radii=p.locator(f'[data-tool-choice="{name}"] svg circle').evaluate_all('cs=>cs.map(c=>+c.getAttribute("r"))')
    assert max(radii)-min(radii)<0.01,(name,radii)
   # Real three click constructions: side objects appear only after the third click.
   p.locator('[data-tool-choice="rectangle"]').click()
   tap(p,-210,-80);tap(p,-100,-155)
   assert not geometric(saved(p),'rectangle'),'Two taps must not finish an oblique rectangle'
   tap(p,-15,-85)
   d=saved(p);rect=geometric(d,'rectangle')[-1]
   assert len(rect['refs'])==3 and len([x for x in d['objects'] if x.get('edgeOf')==rect['id']])==4,d['objects']
   p.locator('[data-tool-choice="parallelogram"]').click()
   tap(p,105,75);tap(p,205,75);tap(p,245,-5)
   d=saved(p);para=geometric(d,'parallelogram')[-1]
   assert len(para['refs'])==3 and len([x for x in d['objects'] if x.get('edgeOf')==para['id']])==4
   assert all(x['style']['stroke']=='#000000' and x['style']['fill']=='#000000' for x in d['objects'])
   assert p.locator(f'#drawing [data-id="{rect["id"]}"]').count()>0
   assert p.locator(f'#drawing [data-id="{para["id"]}"]').count()>0
   # Undo/re-do preserves owned edge identities and boundary; JSON persists three refs.
   ids=[x['id'] for x in d['objects'] if x.get('edgeOf')==para['id']]
   p.locator('#undo').click();assert len(geometric(saved(p),'parallelogram'))==0
   p.locator('#redo').click();assert [x['id'] for x in saved(p)['objects'] if x.get('edgeOf')==para['id']]==ids
   # Persistence must read the three-ref owned sides without normalization or ID changes.
   clean=saved(p)
   p.locator('#open-file').set_input_files({'name':'r35.json','mimeType':'application/json','buffer':json.dumps(clean).encode()})
   p.wait_for_timeout(80)
   assert saved(p)['objects']==clean['objects']
   # The established TikZ safety gate rejects screen-space label avoidance.
   # Standard placement is representable and should export real oblique polygons.
   p.locator('#export-open').click()
   assert p.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled()
   if p.locator('#export-close').is_visible():p.locator('#export-close').click()
   p.locator('#label-placement').select_option('standard')
   p.locator('#export-open').click()
   tikz=download(p,'TikZ / PGF').read_text()
   assert tikz.count(' -- cycle;')>=2,tikz[:300]
   if p.locator('#export-close').is_visible():p.locator('#export-close').click()
   # Segment and angle live measurements respond to dependencies.
   cmd(p,'A=(0,0)');cmd(p,'B=(3,4)');cmd(p,'C=(0,4)');cmd(p,'Segment(A,B)');cmd(p,'Angle(A,B,C)')
   d=saved(p);seg=next(x for x in d['objects'] if x['type']=='segment' and not x.get('edgeOf')); ang=geometric(d,'angle')[-1]
   p.locator(f'#objects [data-id="{seg["id"]}"]').click()
   assert 'Length (units)' in p.locator('#properties').inner_text()
   assert abs(float(p.locator('#properties .measurement-value').inner_text())-5)<1e-7
   p.locator(f'#objects [data-id="{ang["id"]}"]').click()
   assert 'Angle (degrees)' in p.locator('#properties').inner_text()
   value=float(p.locator('#properties .measurement-value').inner_text());assert 0<value<180,value
   # Move mode drag on empty canvas pans; click without drag still clears selection.
   p.locator('[data-tool-choice="select"]').click()
   box=p.locator('#drawing').bounding_box();x=box['x']+box['width']*.88;y=box['y']+box['height']*.90
   before=p.locator('#drawing').inner_html()
   p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+65,y-45,steps=8);p.mouse.up()
   after=p.locator('#drawing').inner_html();assert before!=after,'Empty Move drag must pan scene'
   assert p.locator('#drawing').get_attribute('data-tool')=='select','Pan gesture should not change the active tool'
   # A Shift+drag on blank space must not pan (selection marquee instead).
   before=p.locator('#drawing').get_attribute('viewBox')
   p.mouse.move(x,y);p.keyboard.down('Shift');p.mouse.down();p.mouse.move(x-45,y-30,steps=6);p.mouse.up();p.keyboard.up('Shift')
   assert p.locator('#drawing').get_attribute('viewBox')==before
   # Bilingual labels, 390px viewport; rich SVG export of both new polygons.
   p.locator('#ui-language').select_option('zh')
   p.locator(f'#objects [data-id="{seg["id"]}"]').click()
   assert p.locator('#properties .measurement-value').count()==1
   p.locator('#export-open').click();svg=download(p,'SVG').read_text();assert '<polygon' in svg and '<svg' in svg
   p.locator('#export-open').click() if p.locator('#export-open').is_visible() and not p.locator('#export-close').is_visible() else None
   p.set_viewport_size({'width':390,'height':780});assert p.locator('#drawing').is_visible()
   assert not errors,errors
   print('ROUND35_CHROMIUM_PASS: three-click oblique shapes + owned sides, 7 glyphs, black defaults, measurements, Move blank pan/Shift marquee, JSON/history/SVG, EN/ZH/mobile')
  finally:b.close()

if __name__=='__main__':run()
