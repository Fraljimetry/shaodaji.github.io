"""Cut18: exported transparency/typography actual raster pixels and safe UI choice.
Uses isolated Chromium; does not certify Firefox/Safari or hosted deployment.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
from PIL import Image
from io import BytesIO
import json,os,re

ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1200,'height':830},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda dialog: dialog.accept())
  page.set_content(inline_html(),wait_until='load')
  page.wait_for_timeout(150)
  assert page.locator('#export-transparent').count()==1,'Transparent export setting missing'
  page.locator('#grid').uncheck();page.locator('#axes').uncheck()
  page.locator('#export-scale').select_option('1')
  # On-screen background must stay opaque while only the exported bitmap is transparent.
  page.locator('#background').fill('#f1c232')
  page.locator('#export-transparent').check()
  assert page.locator('#drawing > rect').first.get_attribute('fill')=='#f1c232'
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='JPEG',exact=True).is_disabled(),'JPEG has no alpha and must be disabled'
  assert page.get_by_role('button',name='PNG',exact=True).is_enabled()
  svg=download(page,'SVG').read_text()
  assert 'fill="#f1c232"' not in svg,'Opaque background leaked into transparent SVG'
  page.locator('#export-open').click()
  png=Image.open(download(page,'PNG')).convert('RGBA')
  assert png.getpixel((3,3))[3]==0,('PNG should contain alpha at empty pixel',png.getpixel((3,3)))
  page.locator('#export-open').click()
  if page.get_by_role('button',name='WebP',exact=True).is_enabled():
   webp=Image.open(download(page,'WebP')).convert('RGBA')
   assert webp.getpixel((3,3))[3]==0,'WebP should preserve alpha'
  else:page.locator('#export-close').click()
  # Transparent export option survives Undo/Redo and JSON Save.
  page.locator('#undo').click()
  assert not page.locator('#export-transparent').is_checked()
  page.locator('#redo').click()
  assert page.locator('#export-transparent').is_checked()
  # Historical documents without the extension keep opaque export defaults.
  source=json.loads((ROOT/'examples/geometry-demo.json').read_text())
  source['settings'].pop('exportTransparent',None)
  page.locator('#open-file').set_input_files({'name':'old.json','mimeType':'application/json','buffer':json.dumps(source).encode()})
  page.wait_for_timeout(200)
  assert not page.locator('#export-transparent').is_checked(),'Legacy documents should use opaque background'
  page.locator('#export-open').click()
  png=Image.open(download(page,'PNG')).convert('RGBA')
  assert png.getpixel((2,2))[3]==255,'Legacy PNG must be opaque'
  # White-space in user text remains accessible in the exported SVG source.
  source['objects']=[{'id':'o1','name':'T','type':'text','xy':[0,0],'text':'  A   B  ','fontSize':20,'hidden':False,'locked':False,'style':{'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}}]
  source['nextId']=2
  page.locator('#open-file').set_input_files({'name':'spaces.json','mimeType':'application/json','buffer':json.dumps(source).encode()})
  page.wait_for_timeout(150)
  page.locator('#export-open').click()
  svg=download(page,'SVG').read_text()
  assert 'A   B' in svg
  assert 'xml:space="preserve"' in svg or 'white-space:pre' in svg,'SVG text whitespace handling missing'
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled(),'Do not silently collapse user whitespace in TikZ'
  page.locator('#export-close').click()
  # Transparent diagram arrows must not carry opaque canvas-color text halos.
  diagram=json.loads((ROOT/'examples/diagram-demo.json').read_text())
  diagram['settings']['exportTransparent']=True
  diagram['settings']['background']='#f1c232'
  page.locator('#open-file').set_input_files({'name':'diagram.json','mimeType':'application/json','buffer':json.dumps(diagram).encode()})
  page.wait_for_timeout(150)
  page.locator('#export-open').click()
  svg=download(page,'SVG').read_text()
  from xml.etree import ElementTree as ET
  tree=ET.fromstring(svg)
  morphism_labels=[e for e in tree.iter() if e.tag.endswith('text') and e.attrib.get('stroke-width')=='4']
  assert morphism_labels, 'No diagram arrow labels checked'
  assert all(e.get('stroke')=='none' for e in morphism_labels),'Opaque arrow label halo leaked into transparent export'
  assert not errors,errors
  print('CUT18_BROWSER_PASS alpha PNG, transparent SVG, JPEG-disabled, legacy opaque, SVG whitespace, editor background unchanged')
  browser.close()
if __name__=='__main__':run()
