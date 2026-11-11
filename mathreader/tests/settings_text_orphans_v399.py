#!/usr/bin/env python3
"""Real Chromium CSS/HTML layout guard: no lone trailing word in Settings
at supported narrow/default widths. Does not pretend to run live PDF/OCR.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'mathreader.css').read_text(encoding='utf-8')
settings = html[html.index('<section class="workspace-section settings-section"'):html.index('<section class="workspace-section shortcuts"')]
markup = '<!doctype html><html data-theme="dark" data-lang="en"><head><meta charset="utf-8"><style>' + css + '</style></head><body><aside class="sidebar sidebar-right" style="width:250px;max-width:100%;padding:12px 14px;background:var(--surface)">' + settings + '</aside></body></html>'
# Each text run is measured through DOM Ranges rather than line-height guesses:
# this detects the original screenshot's second line containing only 'export.'.
measure = '''()=>{
  const all=[];
  for(const el of document.querySelectorAll('.sidebar-right p, .export-setting-description, .export-setting-title, .settings-group summary span')){
    const words=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      const re=/\\S+/g;let match;
      while((match=re.exec(node.textContent))){
        const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
        const r=range.getBoundingClientRect();if(r.width>0)words.push({text:match[0],top:Math.round(r.top*2)/2});
      }
    }
    const lines=new Map();for(const word of words){const parts=lines.get(word.top)||[];parts.push(word.text);lines.set(word.top,parts);}
    const rendered=[...lines.values()];
    if(rendered.length>=2&&rendered[rendered.length-1].length===1)all.push({selector:el.className,text:el.textContent?.trim(),lines:rendered});
  }
  return all;
}'''

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':650,'height':900},device_scale_factor=1)
    page.set_content(markup)
    page.add_style_tag(content=".sidebar{transition:none!important}")
    for group in page.locator('.settings-group').all():
        group.evaluate('(e)=>e.open=true')
    assert page.locator('.export-settings-note').count()==0, 'redundant export note must be absent'
    assert 'Reading data is always included.' not in page.locator('#settings-export-group').inner_text()
    assert 'Export never starts OCR.' not in page.locator('#settings-export-group').inner_text()
    checks=0
    for theme in ['dark','light']:
        page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
        for width in [204,220,244,250,270,330]:
            page.locator('.sidebar-right').evaluate('(e,width)=>e.style.width=width+"px"',width)
            assert page.evaluate(measure)==[],f'orphan last word at {width}px {theme}: {page.evaluate(measure)}'
            side=page.locator('.sidebar-right')
            assert side.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),f'horizontal sidebar overflow at {width}px {theme}'
            for i in range(2):
                cb=page.locator('.export-setting-option input[type=checkbox]').nth(i)
                cb.check();assert cb.is_checked()
                cb.uncheck();assert not cb.is_checked()
            checks+=1
    page.evaluate('''()=>{document.documentElement.dataset.lang="zh";document.querySelectorAll('[data-zh]').forEach(el=>el.textContent=el.dataset.zh)}''')
    assert '始终包含阅读数据。' not in page.locator('#settings-export-group').inner_text()
    assert '导出不会启动 OCR。' not in page.locator('#settings-export-group').inner_text()
    assert page.locator('.sidebar-right').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
    browser.close()
print(f'PASS | {checks} widths/themes, no orphan line, redundant note absent, clickability and Chinese fallback')
