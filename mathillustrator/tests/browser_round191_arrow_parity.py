"""Round 191: Free Curve and morphism share arrow-tip shape and styling."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]
STYLE={'stroke':'#2459ac','fill':'#ffffff','width':2,'opacity':1}
base=json.loads((ROOT/'examples/geometry-demo.json').read_text())
def fixture(line,heads):
 d=json.loads(json.dumps(base));d['objects']=[
  dict(id='o1',name='A',type='node',xy=[-4,1.8],text='A',textMode='plain',style=STYLE,hidden=False,locked=False),
  dict(id='o2',name='B',type='node',xy=[4,1.8],text='B',textMode='plain',style=STYLE,hidden=False,locked=False),
  dict(id='o3',name='Morphism',type='morphism',refs=['o1','o2'],bend=0,morphismLine=line,morphismHeads=heads,text='',textMode='plain',style=STYLE,hidden=False,locked=False),
  dict(id='o4',name='Free curve',type='freehand',path=[[-4,-1.8],[-2,-1.8],[0,-1.8],[2,-1.8],[4,-1.8]],curveLine=line,curveHeads=heads,closed=False,style=STYLE,hidden=False,locked=False)]
 d['nextId']=5;return d
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1450,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
  for line in ['solid','dashed','dotted','double','wavy']:
   for heads in ['none','end','start','both']:
    data=fixture(line,heads)
    page.locator('#open-file').set_input_files({'name':'parity.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    sample=page.evaluate('''() => {
      const one = id => {const g=document.querySelector(`#drawing [data-id="${id}"]`);
       if(!g)throw Error('Missing rendered object '+id);
       const tips=[...g.querySelectorAll(':scope > path.latex-morphism-tip')];
       return {tips:tips.length, filled:g.querySelectorAll('polygon.freehand-arrowhead').length,
        lengths:tips.map(p=>p.getTotalLength()),
        widths:tips.map(p=>p.getAttribute('stroke-width')),
        strokes:tips.map(p=>p.getAttribute('stroke'))};};
      return {m:one('o3'),f:one('o4')};}''')
    m,f=sample['m'],sample['f'];expected={'none':0,'end':2,'start':2,'both':4}[heads]
    assert m['tips']==f['tips']==expected,(line,heads,sample)
    assert m['filled']==f['filled']==0,(line,heads,sample)
    assert m['widths']==f['widths'] and m['strokes']==f['strokes'],(line,heads,sample)
    assert all(abs(a-b)<.01 for a,b in zip(m['lengths'],f['lengths'])),(line,heads,sample)
  assert not errors,errors
  print('ROUND191_CHROMIUM_PASS: 20 style/head combinations, Free Curve and morphism tip count, geometry, stroke, width parity')
 finally:browser.close()
