"""Concurrent slider playback, shared dependencies, independent modes and undo."""
import json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  try:
   for theme in ('light','dark'):
    page=browser.new_page(viewport={'width':1280,'height':850})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline_html(expose_state=True),wait_until='load')
    page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
    snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
    def sliders():return {s['name']:s for s in snap()['algebra']['sliders']}
    def enter(expr):
     box=page.locator('#unified-algebra-input');box.fill(expr);box.press('Enter')
    enter('a = Slider(0, 10, 0.1, 1, 0.5, periodic)')
    enter('b = Slider(0, 10, 0.1, 2, 0.75, oscillatory)')
    enter('P = (a, b)')
    assert set(sliders())=={'a','b'},sliders()
    play=lambda name:page.locator(f'#objects [data-slider="{name}"] .slider-play-toggle')
    play('a').click();page.wait_for_timeout(160)
    a_before=sliders()['a']['value']
    play('b').click();page.wait_for_timeout(230)
    mid=sliders();assert mid['a']['value']!=a_before,mid
    assert mid['b']['value']!=2,mid
    assert play('a').get_attribute('aria-label')=='Pause slider a'
    assert play('b').get_attribute('aria-label')=='Pause slider b'
    frame=snap();point=next(o for o in frame['objects'] if o['name']=='P');values={x['name']:x['value'] for x in frame['algebra']['sliders']}
    assert abs(point['xy'][0]-values['a'])<1e-7 and abs(point['xy'][1]-values['b'])<1e-7,(point,values)
    play('a').click();a_stopped=sliders()['a']['value']
    page.wait_for_timeout(230)
    assert sliders()['a']['value']==a_stopped
    assert sliders()['b']['value']!=mid['b']['value']
    assert play('b').get_attribute('aria-label')=='Pause slider b'
    play('b').click();end=sliders()
    page.wait_for_timeout(140)
    assert sliders()==end
    page.locator('#undo').click()
    assert sliders()['a']['value']==1 and sliders()['b']['value']==2,sliders()
    page.locator('#redo').click()
    assert sliders()==end,(sliders(),end)
    # A new session with different start times must still allow both to run.
    play('b').click();page.wait_for_timeout(100);play('a').click();page.wait_for_timeout(120)
    assert play('a').get_attribute('aria-label')=='Pause slider a'
    assert play('b').get_attribute('aria-label')=='Pause slider b'
    play('b').click();play('a').click()
    assert not errors,(theme,errors)
    page.close()
   print('ROUND261_CONCURRENT_SLIDERS_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
