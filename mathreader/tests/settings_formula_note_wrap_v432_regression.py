#!/usr/bin/env python3
"""Check Formula OCR Settings note wraps evenly in narrow sidebars (v432 copy fix)."""
from pathlib import Path
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright
import shutil

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
CSS=(ROOT/'mathreader.css').read_text(encoding='utf-8')

class NoteParser(HTMLParser):
    def __init__(self): super().__init__(); self.matches=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=='p' and 'Wider crops may include nearby text.' in d.get('data-en',''):
            self.matches.append(d)

parser=NoteParser();parser.feed(HTML)
assert len(parser.matches)==1
assert 'quality warnings' in parser.matches[0]['data-en']
assert '质量警告' in parser.matches[0]['data-zh']

start=HTML.index('<section class="workspace-section settings-section"')
stop=HTML.index('<section class="workspace-section shortcuts"',start)
markup=f'<html><head><style>{CSS}</style></head><body><aside class="sidebar-right" style="width:270px;padding:12px">{HTML[start:stop]}</aside></body></html>'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':540,'height':900})
    page.set_content(markup)
    page.locator('#settings-ocr-group').evaluate('(e)=>e.open=true')
    note=page.locator('#settings-ocr-group .display-note')
    for width in (204,240,270,330):
        page.locator('.sidebar-right').evaluate('(e,w)=>e.style.width=w+"px"',width)
        rows=note.evaluate('''e=>{const t=e.firstChild,r=document.createRange(),str=t.textContent,re=/\\S+\\s*/g;let m,rows=new Map();while((m=re.exec(str))){r.setStart(t,m.index);r.setEnd(t,m.index+m[0].length);let box=r.getBoundingClientRect(),k=Math.round(box.top);rows.set(k,[...(rows.get(k)||[]),m[0].trim()]);}return [...rows.values()].map(v=>v.join(' '))}''')
        assert len(rows) <= (3 if width <= 240 else 2),(width,rows)
        assert 'warnings.' not in rows[-1].strip().lower(),(width,rows)
        assert page.locator('.sidebar-right').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),width
    browser.close()
print('PASS | bilingual Formula OCR note | two balanced lines at regular sidebar widths; no overflow')
