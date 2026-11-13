"""Focused root-site showcase test: browser DOM and offline asset provenance.

Full CSS/layout and deployed external assets cannot be certified because the
user supplied only the two current root HTML pages, not website CSS/MathReader.
"""
import base64, re
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree
from playwright.sync_api import sync_playwright

SITE=Path(__file__).resolve().parents[2]

class Tags(HTMLParser):
 def __init__(self):
  super().__init__();self.tags=[];self.stack=[]
 def handle_starttag(self,tag,attrs):
  self.tags.append((tag,dict(attrs)))

def run():
 home=(SITE/'index.html').read_text(encoding='utf-8')
 tools=(SITE/'tools.html').read_text(encoding='utf-8')
 for filename,html in [('index.html',home),('tools.html',tools)]:
  parser=Tags();parser.feed(html);parser.close()
  assert len([1 for tag,_ in parser.tags if tag=='main'])==1,filename
  assert len([1 for tag,_ in parser.tags if tag=='footer'])==1,filename
  assert any(tag=='a' and a.get('href')=='tools.html' for tag,a in parser.tags if filename=='index.html') or filename!='index.html',filename
 # Homepage no longer promotes either application (including alt/localized content).
 assert not re.search('mathreader|mathillustrator|hero-tool-links|software-grid|mathematical-software',home,re.I)
 assert 'data-en="About"' in home and 'data-zh="关于我"' in home
 assert 'data-en="View research"' in home and 'data-zh="查看研究"' in home
 assert re.search(r'<section class="section">',home),'About still follows retained math equation strip'
 # Tools page must still list both applications and their links, but only the
 # illustrator card changes its preview to the locally bundled pencil asset.
 parser=Tags();parser.feed(tools)
 images=[a for tag,a in parser.tags if tag=='img']
 reader=[a for a in images if a.get('src')=='assets/img/tool-mathreader-file-search.svg']
 illustrator=[a for a in images if a.get('src')=='mathillustrator/assets/pencil-cover.svg']
 assert len(reader)==1 and len(illustrator)==1
 assert illustrator[0].get('alt')=='' and illustrator[0].get('loading')=='lazy'
 assert {a.get('id') for tag,a in parser.tags if tag=='section'} >= {'mathreader','mathillustrator'}
 assert {a.get('href') for tag,a in parser.tags if tag=='a'} >= {'mathreader/','mathillustrator/','mathillustrator/tutorial.html'}
 assert 'P_k=O+' not in tools,'old formula preview must be replaced'
 assert 'MathJax' not in tools and 'cdn.jsdelivr.net/npm/mathjax' not in tools,'unused external MathJax should not load'
 assert tools.count('data-zh="了解 MathIllustrator"')==1
 asset=SITE/'mathillustrator/assets/pencil-cover.svg'
 assert asset.is_file()
 root=ElementTree.parse(asset).getroot()
 assert root.tag.endswith('svg') and root.get('viewBox')=='0 0 1200 720'
 assert '<script' not in asset.read_text() and 'http:' not in asset.read_text().replace('http://www.w3.org/2000/svg','')
 # Offline headless Chromium DOM-only checks (external CSS/JS deliberately
 # omitted to avoid inaccurate claims about the whole deployed site).
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for width in (320,390,1440):
   page=browser.new_page(viewport={'width':width,'height':900})
   for name,html in [('index',home),('tools',tools)]:
    isolated=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.I|re.S)
    isolated=re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>','',isolated,flags=re.I)
    isolated=isolated.replace('src="mathillustrator/assets/pencil-cover.svg"', 'src="data:image/svg+xml;base64,'+base64.b64encode(asset.read_bytes()).decode()+'"')
    page.set_content(isolated,wait_until='domcontentloaded')
    assert page.locator('main#main').count()==1 and page.locator('footer.site-footer').count()==1
    if name=='tools':
     assert page.locator('#mathillustrator img').count()==1
     assert page.locator('#mathillustrator img').evaluate('(img)=>img.complete && img.naturalWidth>0')
     assert page.locator('#mathreader a[href="mathreader/"]').count()==1
    else:
     assert page.locator('#mathematical-software').count()==0
     assert page.locator('a[href="tools.html"]').count()>=1
   page.close()
  browser.close()
 print('ROOT_SHOWCASE_PASS: homepage no promo, Tools card pencil, preserved nav/bilingual markup, SVG asset, offline Chromium DOM at 320/390/1440px')

if __name__=='__main__':run()
