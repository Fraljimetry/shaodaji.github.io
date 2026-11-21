"""R262: lock edits should not interrupt independent slider animations; live Properties stay aligned."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import json

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  try:
   for theme in ('light','dark'):
    page=browser.new_page(viewport={'width':1280,'height':840})
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.set_content(inline_html(expose_state=True),wait_until='load')
    page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
    snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
    def enter(expression):
     box=page.locator('#unified-algebra-input');box.fill(expression);box.press('Enter')
    enter('a = Slider(0, 10, 0.1, 1, 0.5, periodic)')
    enter('b = Slider(0, 10, 0.1, 2, 0.7, oscillatory)')
    enter('P = (a, b)')
    point=next(o for o in snap()['objects'] if o['name']=='P')
    play=lambda name:page.locator(f'#objects [data-slider="{name}"] .slider-play-toggle')
    page.locator('#objects [data-slider="a"]').click()
    assert page.locator('#properties .slider-expression-editor').count()==1
    play('a').click();play('b').click()
    page.wait_for_timeout(220)
    synchronized=page.evaluate('''() => { const value=JSON.parse(window.__round36Snapshot()).algebra.sliders.find(s=>s.name==='a').value; const input=[...document.querySelectorAll('#properties label.field')].find(x=>x.firstChild?.textContent.trim()==='Value')?.querySelector('input'); return {value, field: input?.value}; }''')
    assert abs(float(synchronized['field'])-synchronized['value'])<1e-8,('stale slider Value',theme,synchronized)
    expression=page.locator('#properties .slider-expression-editor').input_value()
    assert expression.startswith('Slider(') and len(expression.split(','))==6,expression
    # Lock the point while both sliders are active. Lock means read-only, not a frozen mathematical position.
    page.locator(f'#objects [data-id="{point["id"]}"] .object-menu-toggle').click()
    page.locator('#object-action-menu [data-action="lock"]').click()
    assert play('a').get_attribute('aria-label')=='Pause slider a',('playback stopped on point lock',theme)
    assert play('b').get_attribute('aria-label')=='Pause slider b',('playback stopped on point lock',theme)
    before=snap();page.wait_for_timeout(170);after=snap()
    pbefore=next(o for o in before['objects'] if o['id']==point['id'])
    pafter=next(o for o in after['objects'] if o['id']==point['id'])
    assert pbefore['xy']!=pafter['xy'],('locked point frozen',theme,pbefore['xy'],pafter['xy'])
    assert pafter['locked']
    assert not errors,(theme,errors)
    play('a').click();play('b').click()
    locked_values={x['name']:x['value'] for x in snap()['algebra']['sliders']}
    page.locator('#undo').click()
    assert next(o for o in snap()['objects'] if o['id']==point['id'])['locked'], 'undo of playback must preserve point lock'
    page.locator('#undo').click()
    assert not next(o for o in snap()['objects'] if o['id']==point['id'])['locked'], 'undo of lock must unlock point'
    page.locator('#redo').click()
    assert next(o for o in snap()['objects'] if o['id']==point['id'])['locked'], 'redo of lock must restore lock'
    # Locking one playing slider must not stop the independent second slider.
    play('a').click();play('b').click()
    page.wait_for_timeout(100)
    page.locator('#objects [data-slider="a"] .object-menu-toggle').click()
    page.locator('#object-action-menu [data-action="lock"]').click()
    page.wait_for_timeout(80)
    assert play('b').get_attribute('aria-label')=='Pause slider b',('other slider paused by lock',theme)
    a_value=next(sl for sl in snap()['algebra']['sliders'] if sl['name']=='a')['value']
    b_value=next(sl for sl in snap()['algebra']['sliders'] if sl['name']=='b')['value']
    page.wait_for_timeout(150)
    now={sl['name']:sl['value'] for sl in snap()['algebra']['sliders']}
    assert now['a']==a_value and now['b']!=b_value,('slider lock semantics',theme,now,a_value,b_value)
    play('b').click()
    page.close()
   print('Round 262 lock/sync Chromium PASS (both themes)')
  finally:browser.close()

if __name__=='__main__':run()
