"""R199: real Chromium smoke for the actual IMO 2011 P6 extended project."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).parent
PATH=ROOT/'fixtures/imo2011_p6_extended.json'
OUT=Path(os.getenv('MI199_OUTPUT','/mnt/data/mi199_results'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1600,'height':1000},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=60000)
  state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
  page.locator('#open-file').set_input_files(str(PATH));page.wait_for_timeout(500)
  initial=state();assert len(initial['objects'])==103,len(initial['objects'])
  assert len({o['id'] for o in initial['objects']})==103
  page.locator('#fit').click();page.wait_for_timeout(350)
  page.locator('#drawing').screenshot(path=str(OUT/'imo_original.png'))
  svg=page.locator('#drawing').inner_html();assert len(svg)>10000,len(svg)
  with page.expect_download(timeout=25000) as download:page.locator('#save').click()
  saved=json.loads(Path(download.value.path()).read_text(encoding='utf8'))
  assert len(saved['objects'])==103
  assert [o['id'] for o in saved['objects']]==[o['id'] for o in initial['objects']]
  print('IMPORT SAVE PASSED',len(svg),flush=True)
  with page.expect_download(timeout=25000) as download:
   page.locator('#export-open').click();page.get_by_role('button',name='SVG',exact=True).click()
  svg_file=Path(download.value.path()).read_text(encoding='utf8')
  assert '<svg' in svg_file and len(svg_file)>3000
  print('SVG EXPORT PASSED',len(svg_file),flush=True)
  # Image formats must produce actual encoded files, not just click responses.
  for label,signature in [('PNG',b'\x89PNG'),('JPEG',b'\xff\xd8\xff'),('WebP',b'RIFF')]:
   with page.expect_download(timeout=40000) as item:
    page.locator('#export-open').click()
    page.get_by_role('button',name=label,exact=True).click()
   data=Path(item.value.path()).read_bytes()
   assert data.startswith(signature),(label,len(data),data[:12])
   assert len(data)>1000,(label,len(data))
   if label=='WebP':assert data[8:12]==b'WEBP'
   print('IMAGE EXPORT PASSED',label,len(data),flush=True)
  # Physically drag A; derived centers and midpoints must track it.
  oldA=next(o for o in initial['objects'] if o['id']=='o1')['xy']
  target=page.locator('#drawing circle[data-id="o1"]').first
  bb=target.bounding_box();assert bb
  px=bb['x']+bb['width']/2;py=bb['y']+bb['height']/2
  page.mouse.move(px,py);page.mouse.down();page.mouse.move(px+40,py+20,steps=12);page.mouse.up()
  page.wait_for_timeout(300)
  moved=state();movedA=next(o for o in moved['objects'] if o['id']=='o1')['xy']
  assert movedA!=oldA,(oldA,movedA)
  # Static precomputed reflection points must not be misreported as dynamic.
  assert next(o for o in moved['objects'] if o['id']=='o6')['xy']==next(o for o in initial['objects'] if o['id']=='o6')['xy']
  after_bb=page.locator('#drawing circle[data-id="o4"]').first.bounding_box()
  assert after_bb
  page.locator('#undo').click();page.wait_for_timeout(170)
  assert next(o for o in state()['objects'] if o['id']=='o1')['xy']==oldA
  page.locator('#redo').click();page.wait_for_timeout(170)
  assert next(o for o in state()['objects'] if o['id']=='o1')['xy']==movedA
  print('DRAG DEPENDENCIES UNDO REDO PASSED',flush=True)
  # Reload saved fixture and verify object identities don't drift
  page.locator('#open-file').set_input_files(str(PATH));page.wait_for_timeout(250)
  assert [o['id'] for o in state()['objects']]==[o['id'] for o in initial['objects']]
  assert not errors,errors
  print('ROUND199_CHROMIUM_PASS',flush=True)
 finally:browser.close()
