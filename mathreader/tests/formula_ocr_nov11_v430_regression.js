// v430: actual Nov-11 user OCR outputs. Test honest quality, no invented math.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'js/10-formula-ocr.js'),'utf8');
const vector=fs.readFileSync(path.join(root,'js/11-formula-vector.js'),'utf8');
const fx=require(path.join(root,'regression/fixtures/formula_ocr_feedback_20261111_v430.json'));
function extract(src,name){const a=src.indexOf(`function ${name}(`);assert(a>=0,name);let b=src.indexOf('\nfunction ',a+1);if(b<0)b=src.length;return src.slice(a,b)}
const names=['normalizeOcrLatex','splitTopLevelOcrAlignmentCells','formulaOcrLayoutAnomalies',
 'repairOcrLatex','repairOcrMisplacedAlignmentTabs','repairLatexInnerTags','repairLatexSpecialCharacters',
 'stabilizeOcrLatexSyntax','findRepeatedLatexSequence','formulaOcrEnvironmentScopeWarnings',
 'assessImageOcrResult','imageOcrResultLooksClean'];
const ctx=vm.createContext({t:en=>en});vm.runInContext(names.map(n=>extract(engine,n)).join('\n'),ctx);
function evaluate(raw){ctx.raw=raw;return vm.runInContext('assessImageOcrResult(raw,stabilizeOcrLatexSyntax(repairOcrLatex(normalizeOcrLatex(raw))))',ctx)}
const cases=new Map(fx.cases.map(c=>[c.id,c]));
assert.equal(cases.size,10);
for(const c of fx.cases){const a=evaluate(c.raw);assert(Array.isArray(a.warnings) && Array.isArray(a.reasons));}
let a=evaluate(cases.get('nov11-01').raw);
assert(a.warnings.some(w=>w.includes('matrix column structure')), 'flattens matrix columns into spacing: review');
a=evaluate(cases.get('nov11-07').raw);
assert(a.warnings.some(w=>w.includes('misnested')), 'unclosed LaTeX argument before end-aligned caught');
a=evaluate(cases.get('nov11-06').raw);
assert(!a.hardReject,'legitimate repeated multiple integrals should not trigger a futile severe-error retry');
assert(a.warnings.some(w=>w.includes('repeated integral limits')),'long chain of integral limits remains visible for review');
const preserve=vm.runInContext('stabilizeOcrLatexSyntax(repairOcrLatex(normalizeOcrLatex(raw)))',Object.assign(ctx,{raw:cases.get('nov11-09').raw}));
assert(preserve.includes('s_{13}'), 'potential z/s glyph disagreement never silently guessed');
assert(!evaluate(String.raw`\begin{aligned}x&=1\\y&=2\end{aligned}`).warnings.some(w=>w.includes('misnested')),'healthy aligned formula stays valid');
assert(!vm.runInContext("imageOcrResultLooksClean({latex:'a+b',penalty:0,assessment:{hardReject:true,warnings:[]}})",ctx),'hard reject not clean despite penalty zero');
assert(!vm.runInContext("imageOcrResultLooksClean({latex:'a+b',penalty:0,assessment:{warnings:['incomplete']}})",ctx),'warning prevents clean label');
assert(vm.runInContext("imageOcrResultLooksClean({latex:'a+b',penalty:0,assessment:{warnings:[]}})",ctx),'genuinely clean ordinary crop allowed');
// MathJax parser (optional installed offline) checks the user's exact failing sample.
let compiled=0;try{
 const {mathjax}=require('mathjax-full/js/mathjax.js'),{TeX}=require('mathjax-full/js/input/tex.js'),
 {SVG}=require('mathjax-full/js/output/svg.js'),{liteAdaptor}=require('mathjax-full/js/adaptors/liteAdaptor.js'),
 {RegisterHTMLHandler}=require('mathjax-full/js/handlers/html.js'),{AllPackages}=require('mathjax-full/js/input/tex/AllPackages.js');
 const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
 const doc=mathjax.document('',{InputJax:new TeX({packages:AllPackages}),OutputJax:new SVG({fontCache:'none'})});
 const bad=adaptor.outerHTML(doc.convert(cases.get('nov11-07').raw,{display:true}));
 assert(/(?:data-mjx-error|merror)/.test(bad),'original actually fails MathJax compilation');
 const good=adaptor.outerHTML(doc.convert(String.raw`\begin{aligned}a&=b\\c&=d\end{aligned}`,{display:true}));
 assert(!/(?:data-mjx-error|merror)/.test(good),'healthy formula compiles');
 compiled=2;
}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;console.warn('UNVERIFIED: mathjax-full not installed')}
// Production quality evaluator is used by BOTH initial and comparison entry paths.
assert(vector.includes("quality: imageOcrResultLooksClean(result) ? 'clean' : 'review'"));
assert.equal(vector.split("quality: imageOcrResultLooksClean(result) ? 'clean' : 'review'").length-1,2);
console.log(`PASS: 10 verbatim November-11 OCR outputs, quality consistency, ${compiled} real MathJax checks`);

// Runtime integration: the comparison button must not publish a false CLEAN
// quality badge just because a sanitized result has zero structural penalty.
(async()=>{
  const extractHandler=(name)=>{
    const a=vector.indexOf(`async function ${name}(`);
    assert(a>=0,name);let b=vector.indexOf('\nasync function ',a+1);
    if(b<0)b=vector.indexOf('\nfunction ',a+1);
    return vector.slice(a,b<0?vector.length:b);
  };
  async function handle(name,assessment){
    let outcome=null, status='';
    const fakeResult={latex:String.raw`\begin{aligned}x&=y\\z&=w\end{aligned}`,
      penalty:0,assessment,timing:{passes:[],recognitionMs:1},inferenceCount:1};
    const c=vm.createContext({
      pdfDoc:{},currentFileKey:'nov11-test',formulaExtractionMode:'image',mathOcrCropPending:false,
      mathOcrLoading:false,mathOcrInitPromise:null,mathOcrBackend:{label:'wasm',device:'wasm'},
      ocrNow:()=>1000,setOcrMode(){},setOcrProcessing(){},setOcrStatus(x){status=x},
      extractVectorFormulaFromLayer:()=>null,yieldForOcrProgressPaint:async()=>{},
      runImageFormulaRecognition:async()=>fakeResult,
      imageOcrResultLooksClean:result=>vm.runInContext('imageOcrResultLooksClean(res)',Object.assign(ctx,{res:result})),
      commitFormulaResult:item=>{outcome=item},ocrApproxTokenCount:()=>5,logOcrTiming(){},
      updateOcrInteractionAvailability(){},disposeMathOcrPipeline:async()=>{},showError(e){throw Error(e)},t:en=>en,console,
    });
    vm.runInContext(extractHandler(name),c);
    const crop={width:300,height:300,toDataURL:()=> 'data:image/png;base64,AA'};
    c.crop=crop;
    if(name==='recognizeMathCrop') await vm.runInContext("recognizeMathCrop(crop,1,'primary')",c);
    else await vm.runInContext("recognizeImageFallbackCrop(crop,1,'primary')",c);
    return {outcome,status};
  }
  for(const handler of ['recognizeMathCrop','recognizeImageFallbackCrop']){
    const bad=await handle(handler,{hardReject:true,retainedForReview:true,warnings:['misnested'],reasons:['misnested']});
    assert.equal(bad.outcome.quality,'review',`${handler} must not promote hard-rejected to clean`);
    const incomplete=await handle(handler,{hardReject:false,warnings:['missing lines']});
    assert.equal(incomplete.outcome.quality,'review',`${handler} must not promote missing rows`);
    const clean=await handle(handler,{hardReject:false,warnings:[]});
    assert.equal(clean.outcome.quality,'clean',`${handler} still accepts truly structural-clean output`);
  }
  console.log('PASS: both real OCR completion handlers preserve uncertainty and accept clean controls');
})().catch(e=>{console.error(e);process.exitCode=1});
