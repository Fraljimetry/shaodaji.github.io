#!/usr/bin/env python3
"""v433: real Chromium prose wrapping, no balanced lines or tiny default-width orphans."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
CSS = (ROOT / 'mathreader.css').read_text(encoding='utf-8')
TUTORIAL = (ROOT / 'tutorial.html').read_text(encoding='utf-8')
TUTORIAL_CSS = (ROOT / 'tutorial.css').read_text(encoding='utf-8')
assert 'text-wrap: balance' not in CSS, 'balanced lines prematurely leave empty space'
assert 'text-wrap: pretty' in CSS and 'text-wrap: pretty' in TUTORIAL_CSS
assert 'tutorial.css?v=433' in TUTORIAL
start = HTML.index('<section class="workspace-section settings-section"')
stop = HTML.index('<section class="workspace-section shortcuts"', start)
markup = f'<html><head><style>{CSS}</style></head><body><aside class="sidebar sidebar-right" style="width:260px;padding:12px">{HTML[start:stop]}</aside></body></html>'

measure = '''e => {
  const node=e.firstChild, str=node?.textContent||'', r=document.createRange(), rows=[];
  for(const m of str.matchAll(/\\S+/g)) {
    r.setStart(node,m.index);r.setEnd(node,m.index+m[0].length);
    const rect=r.getBoundingClientRect(),key=Math.round(rect.top);
    let row=rows.find(x=>x.y===key);
    if(!row){row={y:key,words:[],end:0};rows.push(row);}
    row.words.push(m[0]);row.end=Math.max(row.end,rect.right);
  }
  const bound=e.getBoundingClientRect();
  return rows.map(row=>({words:row.words.length,fill:(row.end-bound.left)/bound.width,text:row.words.join(' ')}));
}'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':900,'height':900})
    page.set_content(markup)
    page.add_style_tag(content='.sidebar{transition:none!important}')
    for group in ('#settings-display-group','#settings-ocr-group','#settings-content-detection-group','#settings-export-group'):
        page.locator(group).evaluate('(e)=>e.open=true')
    sel = {
        'ocr': '#settings-ocr-group .display-note',
        'filter': '#settings-content-detection-group .display-note:first-of-type',
        'actions': '#settings-content-detection-group .display-note:last-of-type',
    }
    # Real line rectangles, not string-length guesses; verify all four Settings groups.
    for width in (204,220,240,260,270,300,330,360):
        page.locator('.sidebar-right').evaluate('(e,w)=>e.style.width=w+"px"',width)
        for key,css in sel.items():
            e=page.locator(css)
            assert e.count()==1,(key,width)
            assert e.evaluate('(e)=>getComputedStyle(e).textWrap')=='pretty',(key,width)
            assert e.evaluate('(e)=>getComputedStyle(e).wordBreak')=='normal',(key,width)
            assert e.evaluate('(e)=>getComputedStyle(e).textAlign')!='justify',(key,width)
            lines=e.evaluate(measure)
            assert all(row['words'] for row in lines),(key,width,lines)
            if width in (240,260,270):
                # Balanced text violated full-line use, e.g. 60%-wide first lines.
                assert all(row['fill']>.68 for row in lines[:-1]),(key,width,lines)
            if width==260:
                # Supported standard sidebar: no stray 1-2 word last line.
                assert lines[-1]['words']>=3 or len(lines)==1,(key,width,lines)
        for description in page.locator('.export-setting-description').all():
            assert description.evaluate('(e)=>getComputedStyle(e).textWrap')=='pretty'
        side=page.locator('.sidebar-right')
        assert side.evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),('horizontal overflow',width)
        assert all(e.evaluate('(n)=>n.scrollWidth<=n.clientWidth+3') for e in page.locator('.settings-group-body').all()),('group overflow',width)
    # All translatable explanatory prose keeps ordinary wrapping and remains on-canvas.
    for description in page.locator('.display-note, .export-setting-description').all():
        zh=description.get_attribute('data-zh')
        if zh:description.evaluate('(e,v)=>e.textContent=v',zh)
    for width in (204,260,330):
        page.locator('.sidebar-right').evaluate('(e,w)=>e.style.width=w+"px"',width)
        assert page.locator('.sidebar-right').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),('zh overflow',width)
    # The tutorial has its own stylesheet; paragraphs use the same policy.
    page.set_content(f'<html><head><style>{TUTORIAL_CSS}</style></head><body><main class="guide-content"><p class="lead">Mathematical documents may contain intricate equations, two-column page geometry, and references. Text should use the available width before wrapping.</p><p>复杂数学论文包含多栏排版和公式识别说明。段落应利用可用宽度后再自然换行。</p><p><code>\\begin{{aligned}}</code> remains a code token.</p></main></body></html>')
    for width in (320,540,790):
        page.locator('.guide-content').evaluate('(e,w)=>e.style.width=w+"px"',width)
        assert page.locator('.guide-content p').first.evaluate('(e)=>getComputedStyle(e).textWrap')=='pretty'
        assert page.locator('.guide-content').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2')
    browser.close()
print('PASS | v433 prose wrapping | Settings EN/ZH 204-360px; Tutorial; no artificial balancing/overflow')
