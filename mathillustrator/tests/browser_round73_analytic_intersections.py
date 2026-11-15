"""Round 73 real Chromium: imported legacy false roots stay saved but do not render;
true analytic intersections continue to render and survive save/reimport.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
  try:
   page=browser.new_page(viewport={'width':1450,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.on('dialog',lambda dialog: dialog.accept())
   project=json.loads(page.evaluate('window.__round36Snapshot()'))
   def add(name,kind,**fields):
    identifier=f'o{project["nextId"]}';project['nextId']+=1
    obj={'id':identifier,'name':name,'type':kind,'hidden':False,'locked':False,
     'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1}}
    if kind in ('point','generalIntersection'):obj['style']['pointSize']=5
    obj.update(fields);project['objects'].append(obj)
    return identifier
   O=add('O','point',xy=[0,0]);P=add('P','point',xy=[1,0])
   C=add('C','point',xy=[2+2e-10,0]);D=add('D','point',xy=[3+2e-10,0])
   unit=add('Unit','circle',refs=[O,P]);disjoint=add('Disjoint','circle',refs=[C,D]);overlap=add('Overlap','circle',refs=[P,O])
   y=1+2e-10;U=add('U','point',xy=[-2,y]);V=add('V','point',xy=[2,y]);near_line=add('NearLine','line',refs=[U,V])
   beyond=add('Beyond','point',xy=[0,1+5e-8]);on=add('On','point',xy=[0,1])
   bad_cc=add('OldNearCircle','generalIntersection',refs=[unit,disjoint],rootIndex=0)
   bad_lc=add('OldNearLine','generalIntersection',refs=[near_line,unit],rootIndex=0)
   bad_pc=add('OldNearPoint','generalIntersection',refs=[beyond,unit],rootIndex=0)
   good_cc0=add('TrueUpper','generalIntersection',refs=[unit,overlap],rootIndex=0)
   good_cc1=add('TrueLower','generalIntersection',refs=[unit,overlap],rootIndex=1)
   good_pc=add('TrueOnCircle','generalIntersection',refs=[on,unit],rootIndex=0)
   def load(data):
    page.locator('#open-file').set_input_files({'name':'old-project.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function('(expected)=>JSON.parse(window.__round36Snapshot()).objects.length===expected',arg=len(data['objects']),timeout=6000)
   load(project)
   for ident in (bad_cc,bad_lc,bad_pc):
    assert page.locator(f'#drawing circle[data-id="{ident}"]').count()==0,f'{ident} is an invented intersection marker'
   for ident in (good_cc0,good_cc1,good_pc):
    marker=page.locator(f'#drawing circle[data-id="{ident}"]')
    assert marker.count()==1,f'{ident} genuine intersection marker is missing'
    assert marker.is_visible(),f'{ident} is hidden'
   # A repaired solver must never silently delete a previously stored
   # construction, or turn an unrelated edit into a project-validation failure.
   page.locator('#command').fill('Fresh=(0,2)')
   page.locator('#command-form button').click()
   page.wait_for_function('(expected)=>JSON.parse(window.__round36Snapshot()).objects.length===expected',arg=len(project['objects'])+1)
   with page.expect_download() as download:page.locator('#save').click()
   saved=json.loads(download.value.path().read_text())
   assert all(any(o['id']==ident for o in saved['objects']) for ident in (bad_cc,bad_lc,bad_pc,good_cc0,good_cc1))
   load(saved)
   assert page.locator(f'#drawing circle[data-id="{bad_cc}"]').count()==0
   assert page.locator(f'#drawing circle[data-id="{good_cc0}"]').count()==1
   assert not errors,errors
   print('ROUND73_CHROMIUM_PASS: legacy near misses hidden but retained, true roots shown, unrelated edit, save and reimport')
  finally:
   browser.close()

if __name__=='__main__':main()
