// MathReader v352: MathJax CHTML syntax errors are represented by DOM nodes,
// not necessarily by rejected promises. Exercise the actual preview function.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/10-formula-ocr.js'),'utf8');
const start=source.indexOf('function showOcrUnrenderablePreview()');
const end=source.indexOf('\nfunction refreshOcrUI()',start);
assert.ok(start>=0&&end>start);
const classes=new Set();
const statuses=[];
let errored=false, scroll=0, compilation=0, persist=0;
const preview={
 textContent:'',classList:{toggle(name,value){if(value)classes.add(name);else classes.delete(name)},add(name){classes.add(name)},remove(name){classes.delete(name)}},
 replaceChildren(){this.textContent=''},
 querySelector(selector){assert.equal(selector,'mjx-merror, merror, .mjx-merror');return errored?{}:null}
};
const ctx=vm.createContext({
 ocrRenderedPreview:preview, ocrLatexPreview:{value:'x^2'},currentOcrResult:{latex:'x^2',quality:'clean'},
 ocrRenderedPreviewToken:0,
 window:{MathJax:{typesetClear(){},async typesetPromise(){compilation++}}},
 ocrPreviewMathSource:x=>x, resetRenderedMathScroll(){scroll++},
 setOcrStatus:x=>statuses.push(x),t:en=>en,persistDocumentState(){persist++},
 scheduleOcrRenderedPreview(){throw Error('unexpected token change')},console
});
vm.runInContext(source.slice(start,end),ctx);
(async()=>{
  await vm.runInContext('renderOcrRenderedPreview()',ctx);
  assert(!classes.has('has-error'));assert.equal(scroll,1);assert.equal(compilation,1);
  errored=true;
  await vm.runInContext('renderOcrRenderedPreview()',ctx);
  assert(classes.has('has-error'));assert.equal(scroll,1);
  assert(statuses.at(-1).includes('preview could not compile'));
  assert(preview.textContent.includes('Unable to render this OCR LaTeX'), 'MathJax merror replaced with explanatory text');
  assert.equal(compilation,2);
  assert.equal(ctx.currentOcrResult.quality,'review');assert.equal(persist,1);
  errored=false;
  await vm.runInContext('renderOcrRenderedPreview()',ctx);
  assert(!classes.has('has-error'));assert.equal(scroll,2);
  ctx.ocrLatexPreview.value='';ctx.currentOcrResult=null;
  await vm.runInContext('renderOcrRenderedPreview()',ctx);
  assert(classes.has('is-hidden'));assert.equal(compilation,3);
  console.log('OK: 12 formula MathJax preview lifecycle assertions');
})().catch(e=>{console.error(e);process.exitCode=1});
