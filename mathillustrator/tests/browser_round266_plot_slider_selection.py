"""Round 266: single selected item, all five 2D slider-driven construction modes."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('light','dark'):
   page=browser.new_page(viewport={'width':1280,'height':800})
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=60000)
   page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
   entry=page.locator('#unified-algebra-input')
   entry.fill('b = Slider(0, 20, 0.1, 2)');entry.press('Enter')
   entry.fill('Amp = Slider(0, 20, 0.1, 3)');entry.press('Enter')
   for mode,first,second in [
    ('function','sin(b*x)',''),
    ('parametric','Amp*cos(b*t)','b*sin(t)'),
    ('implicit','x^2+y^2=b^2',''),
    ('vectorField','-b*y','Amp*x'),
    ('domainColoring','b*z+Amp',''),
   ]:
    page.locator('#plot-mode').select_option(mode)
    page.locator('#command').fill(first)
    if second:page.locator('#command-y').fill(second)
    page.locator('#command').press('Enter')
    assert page.locator('#command').input_value()=='', (mode,page.locator('#toast').inner_text(),errors)
   snap=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   kinds=['function','parametric','implicit','vectorField','domainColoring']
   assert all(sum(o['type']==kind for o in snap['objects'])==1 for kind in kinds), [(o['type'],o.get('name')) for o in snap['objects']]
   # Capture rendered geometry before a parameter change; all five must update.
   initial=page.evaluate('''() => Object.fromEntries(JSON.parse(window.__round36Snapshot()).objects.filter(o=>['function','parametric','implicit','vectorField','domainColoring'].includes(o.type)).map(o=>[o.type,document.querySelector('#drawing [data-id=\"'+o.id+'\"]')?.outerHTML||'']))''')
   # Selecting a slider while geometry is selected must clear the geometry selection.
   page.locator('#objects [data-slider="b"] .algebra-entry-label').first.click()
   assert page.locator('#objects [data-slider].selected').count()==1
   assert page.locator('#objects [data-id].selected').count()==0
   # Selecting a geometric row must clear the slider selection, including after creation.
   page.locator('#objects [data-id]').last.click()
   assert page.locator('#objects [data-slider].selected').count()==0, 'Slider remains selected alongside geometry'
   assert page.locator('#objects [data-id].selected').count()==1, 'Geometry row not singly selected'
   # Changing b must not destroy any of the constructed plots.
   page.locator('#objects [data-slider="b"] .algebra-entry-label').first.click()
   val=page.locator('#properties input[data-numeric-expression="true"]').nth(3)
   val.fill('4');val.press('Tab')
   updated=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   assert next(s for s in updated['algebra']['sliders'] if s['name']=='b')['value']==4
   assert all(sum(o['type']==kind for o in updated['objects'])==1 for kind in kinds)
   page.wait_for_timeout(250)
   final=page.evaluate('''() => Object.fromEntries(JSON.parse(window.__round36Snapshot()).objects.filter(o=>['function','parametric','implicit','vectorField','domainColoring'].includes(o.type)).map(o=>[o.type,document.querySelector('#drawing [data-id=\"'+o.id+'\"]')?.outerHTML||'']))''')
   print('rendered:',{k:(len(initial[k]),len(final[k]), initial[k]!=final[k]) for k in kinds})
   assert all(initial[k] and final[k] and initial[k]!=final[k] for k in kinds), 'All five modes must redraw when the slider changes'
   # Rename a slider: every bound plotting expression must be retargeted atomically.
   name_field=page.locator('#properties label.field').filter(has_text='Name').first.locator('input')
   name_field.fill('frequency');name_field.press('Tab')
   renamed=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   assert any(x['name']=='frequency' for x in renamed['algebra']['sliders'])
   for obj in renamed['objects']:
    if obj['type'] in kinds:
     expr=' '.join(str(obj.get(key,'')) for key in ('expr','xExpr','yExpr'))
     assert 'frequency' in expr and not any(token in expr for token in ['(b*','-b*','=b^','b*z']), (obj['type'],expr)
   page.locator('#undo').click()
   undo_doc=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   assert any(x['name']=='b' for x in undo_doc['algebra']['sliders'])
   assert all('frequency' not in str(o.get('expr','')) for o in undo_doc['objects'])
   page.locator('#redo').click()
   redo_doc=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   assert any(x['name']=='frequency' for x in redo_doc['algebra']['sliders'])
   # Constructing a new object while a slider is selected also clears the slider highlight.
   page.locator('#plot-mode').select_option('function')
   page.locator('#command').fill('frequency*x');page.locator('#command').press('Enter')
   assert page.locator('#objects [data-slider].selected').count()==0
   assert not errors,errors
   page.close()
  print('ROUND266_CHROMIUM_PASS')
 finally:browser.close()
