#!/usr/bin/env python3
"""Real Chromium: two identical hits, pick the clicked column and row, not ordinal."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
source=(root/'js/50-references-search.js').read_text()
def extract(begin,end):
    i=source.index(begin);j=source.index(end,i+len(begin));return source[i:j]
code=(extract('function textLayerAggregate(', '\nfunction ensureReferenceLinkLayer(')
      +extract('function searchMatchRangeInLayer(', '\nfunction clearSearchMatchEmphasis('))
html='''<!doctype html><html><style>
#surface{position:relative;width:600px;height:1000px;background:#eee}
#layer{position:absolute;inset:0;font:18px Arial}
#layer span{position:absolute;white-space:nowrap;}
#left{top:100px;left:25px}#right{top:600px;left:335px}
</style><div id="surface"><div id="layer"><span id="left">eigenvalue perturbation</span><span id="right">eigenvalue perturbation</span></div></div></html>'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':900,'height':1100})
    page.set_content(html)
    page.evaluate('''() => {window.searchMatchCase={checked:false};}''')
    page.add_script_tag(content=code)
    result=page.evaluate('''() => {
      const layer=document.getElementById('layer');
      function identify(range){if(!range)return null;const rect=range.getBoundingClientRect();return Math.round(rect.top)}
      const nearRight=searchMatchRangeInLayer(layer,'eigenvalue perturbation',0,{ratio:.61,xStartRatio:.56});
      const nearLeft=searchMatchRangeInLayer(layer,'eigenvalue perturbation',1,{ratio:.11,xStartRatio:.04});
      const measuredRight=identify(nearRight), measuredLeft=identify(nearLeft);
      layer.style.display='none';
      const hidden=searchMatchRangeInLayer(layer,'eigenvalue perturbation',1,{ratio:.61,xStartRatio:.56});
      return {nearRight:measuredRight,nearLeft:measuredLeft,hiddenAvailable:Boolean(hidden)};
    }''')
    assert result['hiddenAvailable'], result
    assert 590 <= result['nearRight'] <= 630, result
    assert 90 <= result['nearLeft'] <= 130, result
    print('PASS: real Chromium repeated search hits use page/column geometry, not ordinal')
    browser.close()
