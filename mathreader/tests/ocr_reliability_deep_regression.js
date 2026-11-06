'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const equation = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const formula = fs.readFileSync(path.join(root, 'js/11-formula-vector.js'), 'utf8');
let assertions = 0;
function check(value, label) { assertions += 1; assert.ok(value, label); }
function fn(text, name) {
  const pattern = new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm');
  const match = text.match(pattern);
  check(match, `extract ${name}`);
  return match[0];
}
const context = {};
const merge = vm.runInNewContext(`(${fn(core, 'mergePageIndexOcrEvidence')})`, context);
const word = (text, x, y) => ({text,xStartRatio:x,xEndRatio:x+0.1,yStartRatio:y,yEndRatio:y+0.015,confidence:80});
const line = (text, ratio, x=.83) => ({text,ratio,xStartRatio:x,xEndRatio:x+.12,confidence:90});
const old = {lines:[line('(17.24)',1)], words:[word('17.24',.85,.4),word('A',.1,.5)], equationMarginEvidence:[{page:10,label:'(17.24)',ratio:1}]};
const next = {lines:[line('(17.24)',.4)], words:[word('17.24',.85,.4),word('A',.1,.5)], equationMarginEvidence:[{page:10,label:'(17.24)',ratio:.4}]};
const out = merge(old,next);
check(out.lines.length===1 && out.lines[0].ratio===.4,'repair stale full-page line geometry without duplicate');
check(out.equationMarginEvidence.length===1 && out.equationMarginEvidence[0].ratio===.4,'repair old margin geometry');
check(out.words.length===2,'repeat OCR words deduplicated');
for (let i=0, cur=out;i<8;i++) { const nextRun=merge(cur,next); check(nextRun.words.length===2,'word count bounded on repeated run '+i); cur=nextRun; }
const repeated=merge(out,{lines:[line('(17.24)',.4)],words:[word('17.24',.85,.72)]});
check(repeated.words.length===3,'same word in a different position is preserved');
const distinct=merge({lines:[line('Lemma',.2,.1)],words:[]},{lines:[line('Lemma',.8,.1)],words:[]});
check(distinct.lines.length===2,'identical text far away remains distinct');

// The historical initial-restore branch returned early after cached OCR,
// dropping explicitly saved meticulous-page overlays on every reopen.
const readyContext = {
 documentOcrPages:new Map(),manualIndexOcrPages:new Map(),documentOcrActive:false,
 documentTextMode:'native',imageDocumentDetected:false,documentTextPreference:'ask',
 loadCachedDocumentOcr:async()=>true,loadManualIndexOcrPages:async()=>{readyContext.loadedOverlay=true},
 setLoading:()=>{},t:(x)=>x,
};
const ensureText = vm.runInNewContext(`(${fn(core,'ensureDocumentTextReady')})`, readyContext);

// Image-margin evidence must override a stale but numerically identical native
// equation target. It must not fabricate a new equation number.
const canonicalContext = {
 equationCandidateAlignedToNumberingSide:()=>true,
 equationDocumentPosition:(item)=>Number(item.page)*10 + Number(item.ratio),
 equationNumberingSide:'right'
};
const choose = vm.runInNewContext(`(${fn(equation,'chooseCanonicalEquationCandidate')})`, canonicalContext);
const native = {label:'(17.24)',page:229,ratio:.95,candidateXStartRatio:.8,candidateXEndRatio:.98,confidence:25};
const verified = {label:'(17.24)',page:229,ratio:.40,candidateXStartRatio:.8,candidateXEndRatio:.92,confidence:12,meticulousPageVerified:true};
check(choose([native,verified]).ratio===.4,'image-verifiable coordinate preferred over stale native label');
check(choose([native,{...verified,ratio:1}]).ratio===.95,'invalid bottom-clipped verification is not preferred');
check(choose([{...verified,ratio:.92},{...verified,ratio:.40,ocrGeometryMeasured:true}]).ratio===.40,
  'measured hOCR margin corrects older unmeasured same-number evidence');
check(equation.includes('filter((line) => line.geometryEstimated !== true)'),
  'synthetic OCR fallback locations forbidden from equation-margin indexing');
check(equation.includes('marginLocationVerifiedV385: evidence.marginLocationVerifiedV385 === true'),'verified coordinates merged for preexisting same-number label');

// Delayed Texify inference may finish after moving to another PDF. Use an
// actual Promise and exercise the recognizer instead of only source matching.
function mkFormulaContext() {
  let resolve;
  const deferred=new Promise((r)=>{resolve=r;});
  const a={id:'a'},b={id:'b'};
  const c={
    pdfDoc:a,currentFileKey:'file-a',formulaExtractionMode:'image',mathOcrInitializationFailed:false,
    mathOcrBackend:{label:'CPU'}, mathOcrLoading:false,
    ocrNow:()=>3,setOcrMode:()=>{},setOcrProcessing:()=>{},setOcrStatus:()=>{},
    extractVectorFormulaFromLayer:()=>null,yieldForOcrProgressPaint:async()=>{},
    runImageFormulaRecognition:()=>deferred,updateOcrInteractionAvailability:()=>{},
    disposeMathOcrPipeline:async()=>{},showError:()=>{},console,
    t:(en)=>en,ocrApproxTokenCount:()=>3,ocrRate:()=>1,logOcrTiming:()=>{},
    commitFormulaResult:(item)=>{c.commits.push(item)}, commits:[],
    lastOcrRunTiming:null,
  };
  return {c,a,b,resolve};
}
const crop = {width:50,height:40,toDataURL:()=> 'data:image/png;base64,AAA'};
const result = {latex:'x+y',penalty:0,assessment:{warnings:[]},timing:{passes:[],analysisMs:0}};
(async()=>{
  await ensureText('ocr');
  check(readyContext.loadedOverlay===true,'meticulous evidence restored with cached full-document OCR');
  const ctx=mkFormulaContext();
  const recognize=vm.runInNewContext(`(${fn(formula,'recognizeMathCrop')})`, ctx.c);
  const running=recognize(crop,7,'primary');
  ctx.c.pdfDoc=ctx.b;ctx.c.currentFileKey='file-b';
  ctx.resolve(result);
  await running;
  check(ctx.c.commits.length===0,'old formula OCR cannot write result to newly opened PDF');
  const live=mkFormulaContext();
  const recognizeLive=vm.runInNewContext(`(${fn(formula,'recognizeMathCrop')})`, live.c);
  const inFlight=recognizeLive(crop,7,'primary');
  live.resolve(result);await inFlight;
  check(live.c.commits.length===1,'valid same-document formula OCR still commits');
  const fallback=mkFormulaContext();
  const fallbackFn=vm.runInNewContext(`(${fn(formula,'recognizeImageFallbackCrop')})`, fallback.c);
  const second=fallbackFn(crop,7,'primary');
  fallback.c.pdfDoc=fallback.b; fallback.c.currentFileKey='file-b';
  fallback.resolve(result);await second;
  check(fallback.c.commits.length===0,'old comparison OCR cannot write to newly opened PDF');
  check(formula.includes('sourceResult !== currentOcrResult'),'async image decode also checks prior OCR result identity');
  // Reproduce a full-document OCR failure while page N+1 has been prefetched.
  // In particular, the current and speculative canvases must not remain live.
  const canvasList = [];
  const documentCtx = {
    pdfDoc:null,currentFileKey:'doc-1',documentOcrRunController:null,documentOcrBusy:false,
    documentOcrActive:false,documentTextMode:'native',documentTextPreference:'ask',documentOcrPages:new Map(),
    welcomeOpen:{disabled:false},fileInput:{disabled:false},documentOcrPrimary:{onclick:null},
    updateDocumentTextAvailabilityUI:()=>{},setDocumentOcrProgress:()=>{},
    requestStopFullDocumentOcr:()=>{},nextFrame:async()=>{},
    loadDocumentOcrModule:async()=>({}),
    documentOcrCreateWorker:()=>async()=>({
      setParameters:async()=>{},recognize:async()=>{throw Error('simulated recognition failure')},terminate:async()=>{},
    }),
    makeDocumentOcrStoppedError:()=>new Error('stopped'),isDocumentOcrStoppedError:()=>false,
    t:(en)=>en,
    document:{createElement:(tag)=>{
      if(tag!=='canvas')throw Error('unexpected element');
      const canvas={width:0,height:0,getContext:()=>({fillRect:()=>{},set fillStyle(value){}})};
      canvasList.push(canvas);return canvas;
    }},
    pageRecordFromHocr:()=>({page:1,lines:[{text:'example'}],words:[]}),
    persistDocumentOcr:async()=>{},
  };
  documentCtx.pdfDoc={numPages:2,getPage:async()=>({
    getViewport:({scale})=>({width:100*scale,height:200*scale}),
    render:()=>({promise:Promise.resolve()}),
  })};
  const fullOcr=vm.runInNewContext(`(${fn(core,'runFullDocumentOcr')})`,documentCtx);
  await assert.rejects(fullOcr(),/simulated recognition failure/);assertions+=1;
  check(canvasList.length===2,'current and prefetched pages both rendered before failure');
  check(canvasList.every(canvas=>canvas.width===1 && canvas.height===1),'both canvases released after OCR failure');
  check(documentCtx.documentOcrBusy===false && documentCtx.welcomeOpen.disabled===false,'UI lock restored after OCR failure');
  console.log(`PASS: ${assertions} executable OCR reliability assertions`);
})().catch((err)=>{console.error(err);process.exitCode=1});
