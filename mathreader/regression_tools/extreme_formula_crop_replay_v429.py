"""Optional real-image formula crop replay (no OCR inference or network).

Run from mathreader/: python regression_tools/extreme_formula_crop_replay_v429.py /path/to/Formula_OCR_Extreme_Cases.docx
The original DOCX/images are intentionally not bundled in the application.
"""
from __future__ import annotations
import base64,json,re,sys,zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
engine=(root/'js/10-formula-ocr.js').read_text()
vector=(root/'js/11-formula-vector.js').read_text()
def get(source, name):
 pat=f'function {name}('
 start=source.index(pat)
 next_func=source.find('\nfunction ',start+1)
 return source[start:next_func if next_func>=0 else len(source)]
snips='\n'.join([get(vector,n) for n in ('median','formulaBackgroundIsDark','normalizeFormulaPolarity','formulaInkProfiles','formulaVisualInkRowEstimate')]+[get(engine,n) for n in ('formulaInkBounds','normalizeFormulaCropForOcr')])

if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('Usage: python .../extreme_formula_crop_replay_v429.py /path/to/extreme.docx')
 docx=Path(sys.argv[1]); records=[]
 with zipfile.ZipFile(docx) as archive, sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox"])
  page=browser.new_page()
  page.goto('about:blank')
  page.add_script_tag(content=snips)
  for i in range(1,21):
   filename=f'word/media/image{i}.png'
   b64=base64.b64encode(archive.read(filename)).decode('ascii')
   result=page.evaluate('''async (data) => {
     const image=new Image();image.src=`data:image/png;base64,${data}`;
     await image.decode();const source=document.createElement('canvas');
     source.width=image.naturalWidth;source.height=image.naturalHeight;
     const ctx=source.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,source.width,source.height);ctx.drawImage(image,0,0);
     const before=formulaInkBounds(normalizeFormulaPolarity(source));
     const visualInkRows=formulaVisualInkRowEstimate(source);
     const output=normalizeFormulaCropForOcr(source,'tight');
     const after=formulaInkBounds(output);
     const sourceRatio=before?.width / Math.max(1,before?.height) || 0;
     const outputRatio=output.width / Math.max(1,output.height);
     return { width:source.width,height:source.height,before,
       normalizedWidth:output.width,normalizedHeight:output.height,visualInkRows,after,
       aspectDrift:Math.abs(sourceRatio-outputRatio)/Math.max(0.01,sourceRatio),
       preserved:!!after && after.width>0 && after.height>0 };
   }''',b64)
   result['image']=filename;records.append(result)
  browser.close()
 print(json.dumps({'source':docx.name,'count':len(records),'passed':sum(r['preserved'] for r in records),
                   'largestNormalizedSide':max(max(r['normalizedWidth'],r['normalizedHeight']) for r in records),
                   'records':records},ensure_ascii=False,indent=2))
