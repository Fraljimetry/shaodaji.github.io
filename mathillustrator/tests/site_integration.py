"""Current site-root integration: homepage omits product promotion by request.

Validates supplied root HTML and MathIllustrator project paths. Site-wide CSS,
JavaScript, preview images, CDN and live hosting require the full website tree;
they are never silently reported as verified when absent in a partial upload.
Run: python mathillustrator/tests/site_integration.py WEBSITE_ROOT [--strict-assets]
"""
from pathlib import Path
from html.parser import HTMLParser
import re,sys

class Tags(HTMLParser):
    def __init__(self):super().__init__();self.tags=[]
    def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))

def main():
    root=(Path(sys.argv[1]) if len(sys.argv)>1 and not sys.argv[1].startswith('--') else Path(__file__).resolve().parents[2]).resolve()
    strict='--strict-assets' in sys.argv[1:]
    editor=root/'mathillustrator/index.html'
    assert editor.is_file(),f'Editor missing at {editor}'
    home=(root/'index.html').read_text(encoding='utf8')
    tools=(root/'tools.html').read_text(encoding='utf8')
    h,t=Tags(),Tags();h.feed(home);t.feed(tools)
    def hrefs(tagset):return {a.get('href') for tag,a in tagset.tags if tag=='a'}
    assert {'tools.html','index.html'}<=hrefs(h), 'Homepage Tools/Home navigation must remain available'
    assert not re.search(r'mathreader|mathillustrator|mathematical-software|hero-tool-links|software-grid',home,re.I), 'Homepage software promotion was intentionally removed in Round 7'
    assert {'mathreader/','mathillustrator/','mathillustrator/tutorial.html'}<=hrefs(t), 'Tools page lacks launch/tutorial links'
    assert {a.get('id') for tag,a in t.tags if tag=='section'} >= {'mathreader','mathillustrator'}
    for text in (home,tools):
        assert 'data-en=' in text and 'data-zh=' in text, 'Root bilingual structure missing'
    images={a.get('src') for tag,a in t.tags if tag=='img'}
    assert {'mathillustrator/assets/pencil-cover.svg','assets/img/tool-mathreader-file-search.svg'}<=images, 'Tools page previews changed unexpectedly'
    paths=['mathillustrator/index.html','mathillustrator/style.css','mathillustrator/src/app.mjs',
           'mathillustrator/src/model.mjs','mathillustrator/src/geometry.mjs','mathillustrator/src/properties_layout.mjs',
           'mathillustrator/assets/pencil-cover.svg','mathillustrator/tutorial.html','mathillustrator/docs/manifest.json']
    assert all((root/name).is_file() for name in paths), 'MathIllustrator runtime/cover file missing'
    assert '<script type="module" src="./src/app.mjs"></script>' in editor.read_text(encoding='utf8')
    # Deployment-wide dependencies may not be provided in editor-only ZIPs.
    external=['assets/css/style-v15.css','assets/js/main-v15.js','assets/img/tool-mathreader-file-search.svg']
    missing=[name for name in external if not (root/name).is_file()]
    if missing:
        if strict:raise AssertionError('Full-site asset verification unavailable; missing: '+', '.join(missing))
        print('SITE_PARTIAL_STATIC_PASS: homepage has no software promo; Tools retains both bilingual launch cards, pencil cover and local editor paths')
        print('SITE_ASSETS_NOT_VERIFIED: site-root upload omits '+', '.join(missing))
    else:
        print('SITE_STATIC_INTEGRATION_PASS: correct homepage/Tools separation, bilingual card links, editor modules and external site assets exist')
if __name__=='__main__':main()
