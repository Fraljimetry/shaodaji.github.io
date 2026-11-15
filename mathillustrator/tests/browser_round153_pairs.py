"""Round153: paired short controls must save and remain aligned at narrow widths."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd
import json

def inspect(page):
    return page.evaluate('''() => {
      const p=document.querySelector('#properties'),pair=p.querySelector('.property-check-number-pair');
      if(!pair)return null;
      const c=pair.querySelector('label.check'),f=pair.querySelector('label.field'),i=f.querySelector('input');
      const a=c.getBoundingClientRect(),b=f.getBoundingClientRect(),n=i.getBoundingClientRect(),outer=pair.getBoundingClientRect();
      return {caption:c.textContent.trim(),field:f.textContent.trim(),rows:getComputedStyle(pair).gridTemplateColumns.split(' ').length,ok:a.right<=b.left+1&&n.right<=outer.right+1&&a.left>=outer.left-1,visible:Math.abs(n.width-([ ...p.querySelectorAll('input[type=number]') ].find(q=>q.closest('label.field')?.textContent.trim()==='Opacity')?.getBoundingClientRect().width??0))<2&&a.height>=13};
    }''')

with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
      for width in (1440,390,320):
        p=b.new_page(viewport={'width':width,'height':850});p.set_default_timeout(10000)
        err=[];p.on('pageerror',lambda e:err.append(str(e)))
        p.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
        if width<700:p.locator('#left-collapse').click()
        p.locator('#plot-mode').select_option('vectorField')
        p.locator('#command').fill('x');p.locator('#command-y').fill('y');p.locator('#command').press('Enter')
        r=inspect(p);assert r and r['caption']=='Normalize lengths' and r['field']=='Density' and r['ok'] and r['rows']==2 and r['visible'],(width,r)
        p.locator('.property-check-number-pair input[type=checkbox]').check()
        p.locator('.property-check-number-pair input[type=number]').fill('10')
        p.locator('.property-check-number-pair input[type=number]').press('Tab')
        state=json.loads(p.evaluate('window.__round36Snapshot()'))
        o=state['objects'][-1];assert o['density']==10 and o['normalized']==True,(width,o)
        if width<700:
          assert not err,(width,err)
          print('PASS round153 paired 2D vector layout',width,flush=True)
          p.close()
          continue
        toggle=p.locator('#scene3d-enable')
        if not toggle.is_visible():p.locator('.controls:has(#scene3d-enable) .section-toggle').click()
        toggle.check()
        if width<700 and not p.locator('#plot-mode').is_visible():p.locator('#right-collapse').click()
        p.locator('#plot-mode').select_option('vector3d')
        p.locator('#command').fill('x');p.locator('#command-y').fill('y');p.locator('#command-z').fill('z');p.locator('#command').press('Enter')
        if width<700:
          if p.locator('#right-collapse').get_attribute('aria-expanded')=='true':p.locator('#right-collapse').click()
          if p.locator('#left-collapse').get_attribute('aria-expanded')!='true':p.locator('#left-collapse').click()
        if p.locator('#objects-3d .object').count():p.locator('#objects-3d .object').first.click()
        r=inspect(p);assert r and r['caption']=='Normalize lengths' and r['field']=='Density' and r['ok'] and r['visible'],(width,r)
        assert not err,(width,err)
        print('PASS round153 paired vector layouts',width,flush=True)
        p.close()
    finally:b.close()
