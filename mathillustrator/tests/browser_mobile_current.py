"""Current mobile UI & touch regressions; auto-Move on tap is intentional."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  for width in (320,390,700):
   context=browser.new_context(has_touch=True,is_mobile=True,viewport={'width':width,'height':780},device_scale_factor=2)
   page=context.new_page();errs=[];page.on('pageerror',lambda err:errs.append(str(err)))
   page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(110)
   heading=page.locator('.appbar').bounding_box();export=page.locator('#export-open').bounding_box();stage=page.locator('#drawing').bounding_box()
   assert export['x']>=0 and export['x']+export['width']<=width+1,(width,'export beyond viewport',export)
   assert export['y']+export['height']<=heading['y']+heading['height']+1,(width,'export outside toolbar')
   assert stage['y']>=heading['y']+heading['height']-1,(width,'canvas overlaid by header')
   size=page.evaluate('[document.documentElement.scrollWidth,document.documentElement.clientWidth]')
   assert size[0]<=size[1]+1,(width,'horizontal overflow',size)
   page.evaluate("document.querySelector('[data-tool-choice=point]').click()")
   x=stage['x']+stage['width']/2;y=stage['y']+stage['height']/2
   page.touchscreen.tap(x,y)
   assert page.locator('#object-count').inner_text()=='1',(width,'touchscreen.tap failed')
   assert page.locator('#drawing').get_attribute('data-tool')=='pan', 'Point should auto-return to Pan when enabled'
   if width==390:
    import struct
    page.locator('#export-open').click()
    with page.expect_download(timeout=10000) as download:
     page.get_by_role('button',name='PNG',exact=True).click()
    path=download.value.path();data=path.read_bytes()
    assert data[:8]==b'\x89PNG\r\n\x1a\n' and len(data)>1000,'Malformed mobile PNG'
    w,h=struct.unpack('>II',data[16:24])
    assert w>100 and h>100,(w,h)
    print('CURRENT_MOBILE_PASS PNG export after emulated touch',w,h)
   assert not errs,errs
   print('CURRENT_MOBILE_PASS',width,'px: wrapped toolbar, visible Export, no overflow, canvas below header, native emulated tap')
   context.close()
  browser.close()
if __name__=='__main__':run()
