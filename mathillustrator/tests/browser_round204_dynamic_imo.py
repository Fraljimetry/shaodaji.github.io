"""R204 exact revised dynamic IMO project: sustained pointer, history, persistence, graphics."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
from pathlib import Path
import json,os
PATH=Path(__file__).parent/'fixtures/MathIllustrator_IMO2011_P6_Dynamic_Geometry.json'
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1600,'height':1000},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=60000)
  state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
  page.locator('#open-file').set_input_files(str(PATH));page.wait_for_timeout(350)
  original=state();assert len(original['objects'])==67
  page.locator('#fit').click();page.wait_for_timeout(220)
  for id in ['o1','o2','o3']:
   before=next(o['xy'] for o in state()['objects'] if o['id']==id)
   for iteration in range(8):
    target=page.locator(f'#drawing circle[data-id="{id}"]').first
    bb=target.bounding_box();assert bb,(id,iteration)
    x,y=bb['x']+bb['width']/2,bb['y']+bb['height']/2
    dx=12 if iteration%2==0 else -7;dy=7 if iteration%3 else -4
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=7);page.mouse.up()
   after=next(o['xy'] for o in state()['objects'] if o['id']==id)
   assert after!=before,(id,before,after)
   assert len(state()['objects'])==67
  moved=state()
  page.locator('#undo').click();page.wait_for_timeout(90)
  page.locator('#redo').click();page.wait_for_timeout(90)
  assert state()==moved, 'Drag undo/redo lost geometry or metadata'
  with page.expect_download(timeout=15000) as download:page.locator('#save').click()
  saved=json.loads(Path(download.value.path()).read_text(encoding='utf8'))
  assert saved==moved
  for label,signature in [('SVG',b'<svg'),('PNG',b'\x89PNG'),('JPEG',b'\xff\xd8\xff'),('WebP',b'RIFF')]:
   with page.expect_download(timeout=45000) as download:
    page.locator('#export-open').click();page.get_by_role('button',name=label,exact=True).click()
   data=Path(download.value.path()).read_bytes()
   assert (signature in data[:350] if label=='SVG' else data.startswith(signature)),(label,len(data))
   assert len(data)>1500,(label,len(data))
   if label=='WebP':assert data[8:12]==b'WEBP'
  # Reopen saved JSON, preserve all object identity and dependent definitions.
  import tempfile
  with tempfile.NamedTemporaryFile(suffix='.json',delete=False) as f: f.write(json.dumps(moved).encode());reopen=f.name
  try:
   page.locator('#open-file').set_input_files(reopen);page.wait_for_timeout(240)
   assert state()==moved, 'JSON reopening changed project'
  finally:os.unlink(reopen)
  assert not errors,errors
  print('R204_DYNAMIC_IMO_CHROMIUM_PASS: 24 drags, 67 objects, undo/redo, JSON roundtrip, SVG/PNG/JPEG/WebP')
 finally:browser.close()
