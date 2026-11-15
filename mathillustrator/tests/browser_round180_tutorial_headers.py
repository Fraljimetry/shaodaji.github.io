from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
updated=root/'tutorial.html'
assert updated.read_text().count('.guide table th{text-align:left}')==1
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [1440,768,390]:
  page=browser.new_page(viewport={'width':width,'height':900})
  page.set_content(updated.read_text().replace('<link rel="stylesheet" href="./style.css?cut=round51">', '<style>'+(root/'style.css').read_text()+'</style>'),wait_until='domcontentloaded')
  for sec in ['#en-guide','#zh-guide']:
   headers=page.locator(sec+' table th')
   assert headers.count()>=2, (width,sec)
   for i in range(headers.count()):
    actual=headers.nth(i).evaluate('(e)=>getComputedStyle(e).textAlign')
    assert actual=='left',(width,sec,i,actual)
  print(f'PASS {width}px EN/CN table headers')
  page.close()
 browser.close()
