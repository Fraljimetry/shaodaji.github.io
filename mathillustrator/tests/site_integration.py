"""Static deployment contract: links are in actual root pages, not only app folder.

Usage from mathillustrator/: python tests/site_integration.py ..
Requires the original site root and mathillustrator/ installed together.
No network or browser needed. This does NOT certify hosted navigation.
"""
from pathlib import Path
from html.parser import HTMLParser
import sys

class Links(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.links.append(dict(attrs))

def main():
    root=(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[2]).resolve()
    editor=root/'mathillustrator/index.html'
    assert editor.is_file(),f'Editor missing at {editor}'
    for page in ['index.html','tools.html']:
        p=root/page;assert p.exists(),f'Site page missing: {p}'
        text=p.read_text(encoding='utf8');parser=Links();parser.feed(text)
        links=[a for a in parser.links if a.get('href')=='mathillustrator/']
        assert links,f'MathIllustrator launch link absent from site-root {page}'
        for anchor in links:
            assert 'MathIllustrator' in anchor.get('data-en',''),f'{page}: English link missing'
            assert 'MathIllustrator' in anchor.get('data-zh',''),f'{page}: Chinese link missing'
        assert 'mathreader/' in text,f'{page}: MathReader link unexpectedly lost'
    # Release-specific homepage discovery contract: distinct, immediately visible paths
    # and balanced placement, not merely a buried plain-text link.
    home=(root/'index.html').read_text(encoding='utf-8')
    assert home.count('id="mathematical-software"')==1, 'Missing unique tools showcase anchor'
    assert home.index('id="mathematical-software"')<home.index('data-en="About"'), 'Software showcase too low on homepage'
    assert home.count('class="card software-card"')==2, 'Reader and Illustrator need two symmetric cards'
    assert 'class="software-grid"' in home and '.software-grid { display:grid; grid-template-columns:repeat(2' in home, 'Two-tool responsive layout missing'
    assert 'class="hero-tool-links"' in home and 'href="mathreader/"' in home and 'href="mathillustrator/"' in home, 'Direct hero tool discovery missing'
    assert home.count('href="mathillustrator/tutorial.html"')==1, 'Direct Illustrator tutorial link missing'
    assert 'href="tools.html#mathreader"' in home, 'Reader detail link missing'
    assert 'id="mathreader"' in (root/'tools.html').read_text(encoding='utf-8')
    assert 'id="mathillustrator"' in (root/'tools.html').read_text(encoding='utf-8')
    assert (root/'assets/img/tool-mathreader-file-search.svg').is_file(), 'MathReader preview asset missing'
    tools=Links();tools.feed((root/'tools.html').read_text())
    assert any(a.get('href')=='mathillustrator/tutorial.html' for a in tools.links),'Tools tutorial link missing'
    text=editor.read_text()
    assert '<script type="module" src="./src/app.mjs"></script>' in text
    assert '<link rel="stylesheet" href="./style.css">' in text
    for path in ['style.css','src/app.mjs','src/model.mjs','src/geometry.mjs','src/diagram.mjs','src/storage.mjs','src/export_fidelity.mjs','src/diagram_layout.mjs','src/plot_cache.mjs','src/anchor_index.mjs','src/label_layout.mjs','src/diagram_routing.mjs','src/diagram_global_routing.mjs','src/morphism_label_layout.mjs','tutorial.html','docs/manifest.json']:
        assert (root/'mathillustrator'/path).is_file(),f'Missing module: {path}'
    assert (root/'assets/js/main-v15.js').is_file(), 'Original site locale/nav script missing'
    print('SITE_STATIC_INTEGRATION_PASS: balanced bilingual homepage tools showcase, hero direct paths, details/tutorial routes, responsive two-tool structure, intact MathReader navigation, editor CSS/module paths')

if __name__=='__main__':main()
