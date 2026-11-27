"""Round 51F: actual 2D plot glyphs in selector/Objects rows, unified geometry
marker and diagonal contracts, timestamped export names, matching 2D/3D preview glyphs.
Only local inlined source fixture, not hosted HTTP proof.
"""
import json, os, re
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

TYPES={'function':('sin(x)',None),'parametric':('cos(t)','sin(t)'),
       'implicit':('x^2+y^2=1',None),'vectorField':('-y','x'),
       'domainColoring':('z',None)}
STAMP=re.compile(r'^mathillustrator(?:-tikzcd)?_([0-9]{8})_([0-9]{6})\.(svg|png|jpg|webp|json|tex)$')

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1480,'height':940},accept_downloads=True)
   page.set_default_timeout(20000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load')
   page.wait_for_selector('#plot-mode-preview svg')
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   old_count=len(snapshot()['objects'])
   page.locator('#object-input-toggle').click()
   assert page.locator('#object-search').is_visible()
   glyphs={}
   for mode,(expression,second) in TYPES.items():
    page.locator('#plot-mode').select_option(mode)
    preview=page.locator('#plot-mode-preview svg')
    assert preview.count()==1,(mode,'missing mode preview')
    glyphs[mode]=preview.inner_html()
    assert preview.get_attribute('viewBox')=='-1.5 -1.5 27 27'
    assert preview.locator('path,circle').count()>=1
    if mode=='domainColoring':
     assert preview.locator('path[fill]').count()>=5,'domain coloring must convey phase color'
    page.locator('#command').fill(expression)
    if second:page.locator('#command-y').fill(second)
    page.locator('#command-form button').click()
    page.wait_for_function('(old)=>JSON.parse(window.__round36Snapshot()).objects.length>old',arg=old_count)
    objects=snapshot()['objects'];obj=objects[-1];old_count=len(objects)
    assert obj['type']==mode,(mode,obj)
    page.locator('#object-search').fill(obj['name'])
    icon=page.locator(f'#objects .object[data-id="{obj["id"]}"] .glyph svg')
    icon.wait_for(state='attached')
    assert icon.inner_html()==preview.inner_html(),mode
    assert icon.get_attribute('viewBox')==preview.get_attribute('viewBox'),mode
    assert icon.evaluate('(e)=>getComputedStyle(e).strokeWidth')==preview.evaluate('(e)=>getComputedStyle(e).strokeWidth'),mode
    page.locator('#object-search').fill('')
   print('5 live plot-mode SVG previews and matching Objects-list glyphs PASS',flush=True)
   # Ensure the uniform size contract is true of rendered geometry icons.
   geometry=page.locator('[data-geometry-group] .tool svg')
   wrong=geometry.evaluate_all('''items=>items.flatMap(svg=>[...svg.querySelectorAll('circle[fill="currentColor"]')].filter(c=>+c.getAttribute('r')!==2.8).map(c=>svg.closest('[data-tool-choice]')?.dataset.toolChoice))''')
   assert not wrong,wrong
   for tool,d in [('segment','M4 20L20 4'),('midpoint','M4 20L20 4'),('line','M2 22L22 2'),('ray','M4 20L22 2'),('arrow','M4 20L20 4'),('fixedLength','M4 20L20 4')]:
    assert d in page.locator(f'[data-tool-choice="{tool}"] svg').inner_html(),tool
   print('All displayed Geometry filled point radii are uniform and related diagonals aligned PASS',flush=True)
   # 3D intentionally shares the corresponding semantic glyphs with 2D.
   page.locator('#scene3d-enable').check(force=True)
   assert page.locator('#plot-mode').input_value()=='surface3d'
   for mode,source in zip(('surface3d','parametric3d','implicit3d','vector3d','domain3d'),TYPES):
    page.locator('#plot-mode').select_option(mode)
    assert page.locator('#plot-mode-preview').is_visible()
    assert page.locator('#plot-mode-preview svg').inner_html()==glyphs[source],mode
   page.locator('#scene3d-enable').uncheck(force=True)
   assert page.locator('#plot-mode-preview svg').count()==1
   print('All five 3D preview glyphs match their 2D counterparts PASS',flush=True)
   assert not errors,errors
   # A fresh empty document allows image and JSON exports.
   fresh=browser.new_page(viewport={'width':1300,'height':830},accept_downloads=True)
   fresh.set_default_timeout(30000)
   failures=[];fresh.on('pageerror',lambda e:failures.append(str(e)))
   fresh.on('dialog',lambda d:d.accept())
   fresh.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load')
   for label,extension in [('SVG','svg'),('PNG','png'),('JPEG','jpg'),('WebP','webp'),('JSON project','json')]:
    fresh.locator('#export-open').click()
    assert set(fresh.locator('#export-options button').all_text_contents())=={'SVG','PNG','JPEG','WebP','JSON project','tikz-cd (semantic)'}
    btn=fresh.locator('#export-options button').get_by_text(label,exact=True)
    assert btn.count()==1 and btn.is_enabled(),(label,'unexpectedly disabled')
    with fresh.expect_download(timeout=30000) as ev:btn.click()
    dl=ev.value
    name=dl.suggested_filename
    match=STAMP.fullmatch(name)
    assert match and name.endswith('.'+extension),(label,name)
    assert match.group(1)[4:6] in [f'{i:02d}' for i in range(1,13)]
    assert 0<=int(match.group(2)[:2])<=23 and 0<=int(match.group(2)[2:4])<=59 and 0<=int(match.group(2)[4:])<=59
    path=dl.path();assert path
    data=open(path,'rb').read()
    assert data,(label,'empty payload')
    if extension=='json':assert json.loads(data)['objects']==[]
    if extension=='png':assert data.startswith(b'\x89PNG\r\n\x1a\n')
    if extension=='jpg':assert data.startswith(b'\xff\xd8')
    if extension=='webp':assert data[:4]==b'RIFF' and data[8:12]==b'WEBP'
    if extension=='svg':assert b'<svg' in data
   with fresh.expect_download(timeout=15000) as save_ev:fresh.locator('#save').click()
   assert STAMP.fullmatch(save_ev.value.suggested_filename) and save_ev.value.suggested_filename.endswith('.json')
   assert not failures,failures
   # Semantic tikz-cd has a separate source/validator; check its real button too.
   fresh.locator('#tikzcd-open').click()
   fresh.locator('#tikzcd-input').fill('\\begin{tikzcd}\nA \\arrow[r, "f"] & B\n\\end{tikzcd}')
   fresh.locator('#tikzcd-apply').click()
   fresh.wait_for_function('() => JSON.parse(window.__round36Snapshot()).objects.some(o=>o.type==="morphism")')
   fresh.locator('#export-open').click()
   tikzcd=fresh.locator('#export-options button').get_by_text('tikz-cd (semantic)',exact=True)
   assert tikzcd.count()==1 and tikzcd.is_enabled(),'semantic exporter unavailable for imported 2-node diagram'
   with fresh.expect_download(timeout=15000) as cd_ev:tikzcd.click()
   cd_name=cd_ev.value.suggested_filename
   assert STAMP.fullmatch(cd_name) and cd_name.startswith('mathillustrator-tikzcd_') and cd_name.endswith('.tex'),cd_name
   assert b'\\begin{tikzcd}' in open(cd_ev.value.path(),'rb').read()
   assert not failures,failures
   print('Timestamped real SVG/PNG/JPEG/WebP/tikz-cd/JSON exports and Save, valid payloads PASS',flush=True)
   print('ROUND51F_CHROMIUM_PASS',flush=True)
  finally:browser.close()
if __name__=='__main__':main()
