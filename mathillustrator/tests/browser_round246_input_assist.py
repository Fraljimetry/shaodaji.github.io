"""Round 246: input completion keyboard/click paths and guide theme-language sync."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  try:
   p=browser.new_page(viewport={'width':1280,'height':800})
   errors=[]
   p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(inline_html(expose_state=True),wait_until='load')
   algebra=p.locator('#unified-algebra-input');algebra.fill('sqr')
   popup=p.locator('#unified-algebra-input-suggestions')
   assert popup.is_visible(), 'algebra suggestions missing'
   assert popup.get_by_text('sqrt(…)').count()==1
   algebra.press('Tab')
   assert algebra.input_value()=='sqrt()',algebra.input_value()
   assert algebra.evaluate('e=>e.selectionStart')==5
   algebra.fill('a = Slider(0, 10, 0.1, 2)')
   algebra.press('Enter')
   assert p.locator('[data-slider="a"]').count()==1
   cmd=p.locator('#command');cmd.fill('si')
   assert p.locator('#command-suggestions').is_visible()
   cmd.press('Tab')
   assert cmd.input_value().startswith('sin(')
   p.locator('#plot-mode').select_option('implicit')
   # 3D mode requested through the application's real switch.
   enable=p.locator('#scene3d-enable')
   if enable.count():
    enable.check(force=True)
    p.locator('#plot-mode').select_option('implicit3d')
    cmd.fill('')
    cmd.press('Control+Space')  # explicit completion after mode change
    assert p.locator('#command-suggestions').is_visible()
    assert p.locator('#command-suggestions').get_by_text('x^2+y^2+z^2=4').count()==1
   assert not errors,errors
   p.close()
   g=browser.new_page(viewport={'width':390,'height':780})
   g.set_content((ROOT/'tutorial.html').read_text(),wait_until='load')
   btn=g.locator('#theme-switch');label=g.locator('#theme-switch-label')
   assert label.inner_text()=='Light',label.inner_text()
   btn.click();assert label.inner_text()=='Dark';assert g.locator('html').get_attribute('data-theme')=='light'
   g.locator('#lang-switch').click();assert label.inner_text()=='深色'
   btn.click();assert label.inner_text()=='浅色'
   print('ROUND246_COMPLETION_THEME_CHROMIUM_PASS')
  finally: browser.close()
if __name__=='__main__':run()
