"""Round 75: real Chromium check of saved-point incidence and transformed-curve Fit."""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
 with sync_playwright() as pw:
  executable=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':executable} if executable else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(20000)
   errors=[]
   page.on('pageerror', lambda error: errors.append(str(error)))
   page.on('dialog', lambda dialog: dialog.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   assert page.locator('#command').count()==1,'Actual application failed to start'
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   doc=snap();doc['objects']=[];doc['nextId']=1
   def add(name,kind,**kwargs):
    identity=f'o{doc["nextId"]}';doc['nextId']+=1
    obj={'id':identity,'name':name,'type':kind,'hidden':False,'locked':False,
      'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1},**kwargs}
    if kind in ('point','generalIntersection'):obj['style']['pointSize']=5
    doc['objects'].append(obj)
    return identity
   O=add('O','point',xy=[0,0]);P=add('Near','point',xy=[1e-8,0]);Q=add('Coincident','point',xy=[0,0])
   false=add('False crossing','generalIntersection',refs=[O,P],rootIndex=0)
   real=add('Real crossing','generalIntersection',refs=[O,Q],rootIndex=0)
   A=add('A','point',xy=[0,0]);B=add('B','point',xy=[100,0]);C=add('C','point',xy=[100,100])
   poly=add('Polyline','polyline',refs=[A,B,C])
   expanded=add('Dilated image','transformCopy',refs=[poly,A],transform='dilate',amount=3)
   moved=add('Translated image','transformCopy',refs=[expanded,A,B],transform='translate')
   def open_doc(data):
    page.locator('#open-file').set_input_files({'name':'round75-scene.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function('(expected)=>JSON.parse(window.__round36Snapshot()).objects.length===expected',arg=len(data['objects']))
   open_doc(doc)
   assert page.locator(f'#drawing circle[data-id="{false}"]').count()==0,'False near-point root drawn'
   assert page.locator(f'#drawing circle[data-id="{real}"]').count()==1,'Real coincident-point root missing'
   page.locator('#fit').click()
   stage=page.locator('#drawing');size=stage.evaluate('(e)=>({w:e.clientWidth,h:e.clientHeight})')
   for identity in (expanded,moved):
    path=page.locator(f'#drawing polyline[data-id="{identity}"]')
    assert path.count()==1,f'Transformed polyline {identity} missing'
    coords=[tuple(map(float,p.split(','))) for p in path.get_attribute('points').split()]
    assert len(coords)>=3,coords
    for x,y in coords:
     assert -1e-6<=x<=size['w']+1e-6 and -1e-6<=y<=size['h']+1e-6,('Fit clipped',identity,x,y,size)
   with page.expect_download() as download: page.locator('#save').click()
   saved=json.loads(download.value.path().read_text())
   assert len(saved['objects'])==len(doc['objects'])
   open_doc(saved)
   assert page.locator(f'#drawing circle[data-id="{false}"]').count()==0
   page.locator('#fit').click()
   assert page.locator(f'#drawing polyline[data-id="{moved}"]').count()==1
   assert not errors,errors
   print('ROUND75_CHROMIUM_PASS: no invented near-point root, exact root present, transformed polyline Fit, v1 save/reimport, zero page errors')
  finally:
   browser.close()

if __name__=='__main__':main()
