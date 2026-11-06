import re
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
src=(Path(__file__).resolve().parents[1] / 'js' / '00-core.js').read_text()
def extract(name):
 m=re.search(r'(?:async )?function '+name+r'\([\s\S]*?\n\}(?=\n)',src)
 assert m,name
 return m.group(0)
functions='\n'.join(extract(x) for x in ('captureMeticulousOcrReadingPosition','restoreMeticulousOcrReadingPosition'))
html='''<!DOCTYPE html><html><head><style>
#primary-canvas-wrap {overflow:auto;height:280px;width:450px;border:1px solid grey} #pdf-surface{height:1150px;width:420px;background:linear-gradient(white,#ddd)}
#left-sidebar{overflow:auto;height:500px;width:250px;border:1px solid grey}#equation-index{height:180px;overflow:auto;border:1px solid grey}
.equation-edit-row {height:27px;box-sizing:border-box;border-bottom:1px solid #bbb}
</style></head><body><div id="left-sidebar"><div style="height:40px">Contents</div><div id="outline-list"></div><div id="structure-index"></div><div id="equation-index"></div><div id="bibliography-index"></div><div style="height:800px"></div></div><div id="primary-canvas-wrap"><div id="pdf-surface"></div></div></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1300,'height':900})
 page.set_content(html)
 page.evaluate('''() => {const e=document.getElementById('equation-index');for(let i=1;i<=70;i++){const row=document.createElement('div');row.className='equation-edit-row';row.dataset.equationOrderKey='(17.'+i+')';row.textContent='(17.'+i+')';e.appendChild(row)} }''')
 page.evaluate('''code => { window.pdfDoc={name:'original'}; window.currentFileKey='original';window.readingFlow='single';window.currentPage=222;window.readerNavigationSerial=0;
 window.primaryCanvasWrap=document.getElementById('primary-canvas-wrap');window.equationIndex=document.getElementById('equation-index');window.structureIndex=document.getElementById('structure-index');window.bibliographyIndex=document.getElementById('bibliography-index');window.scrollByPage={};window.continuousSavedAnchor=null;window.continuousScrollTop=0;
 window.el=id=>document.getElementById(id);window.captureContinuousAnchor=()=>({page:222,ratio:.87});window.restoreContinuousAnchor=a=>{window.primaryCanvasWrap.scrollTop=400+a.ratio*200;return true};
 (0,eval)(code);
 }''',functions)
 page.evaluate('''() => {primaryCanvasWrap.scrollTop=700;primaryCanvasWrap.scrollLeft=0;equationIndex.scrollTop=702;document.getElementById('left-sidebar').scrollTop=50;window.snapshot=captureMeticulousOcrReadingPosition();}''')
 before=page.evaluate('''() => ({reader:primaryCanvasWrap.scrollTop,side:document.getElementById('left-sidebar').scrollTop,eq:equationIndex.scrollTop,key:snapshot.scrollers.find(x=>x.element===equationIndex).rowKey,offset:snapshot.scrollers.find(x=>x.element===equationIndex).rowOffset})''')
 page.evaluate('''() => {primaryCanvasWrap.scrollTop=400;equationIndex.scrollTop=0;document.getElementById('left-sidebar').scrollTop=0;const rows=[...equationIndex.children];equationIndex.replaceChildren(); for(let i=0;i<2;i++){const e=document.createElement('div');e.className='equation-edit-row';e.dataset.equationOrderKey='(17.fake'+i+')';e.textContent='new entry';equationIndex.append(e)} for(const r of rows)equationIndex.append(r);restoreMeticulousOcrReadingPosition(snapshot);}''')
 after=page.evaluate('''() => {const state=snapshot.scrollers.find(x=>x.element===equationIndex);const row=[...equationIndex.children].find(r=>r.dataset.equationOrderKey===state.rowKey);return {reader:primaryCanvasWrap.scrollTop,side:document.getElementById('left-sidebar').scrollTop,eq:equationIndex.scrollTop,key:state.rowKey,offset:row.getBoundingClientRect().top-equationIndex.getBoundingClientRect().top}}''')
 print('before',before,'after',after)
 assert before['reader']==after['reader']
 assert before['side']==after['side']
 assert abs(before['offset']-after['offset'])<1.1
 page.evaluate('''() => {readerNavigationSerial=1;primaryCanvasWrap.scrollTop=777;restoreMeticulousOcrReadingPosition(snapshot)}''')
 assert page.evaluate('primaryCanvasWrap.scrollTop')==777
 print('PASS: real Chromium scroll anchor survives 2 inserted equation rows; newer navigation is not undone')
 browser.close()
