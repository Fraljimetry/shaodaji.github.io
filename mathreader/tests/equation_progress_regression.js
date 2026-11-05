// v347 compact one-line progress + diagnostics contract; run from project root.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const start = src.indexOf('// The equation pipeline is progressive:');
const end = src.indexOf('\nfunction equationExpectedNumericOcrRecord',start);
assert(start > 0 && end > start);
let ticks = 100;
let lang = 'en';
let canvases=[];
const status={textContent:'',title:'',dataset:{}};
const ctx=vm.createContext({
  console,performance:{now:()=>ticks}, t:(en,zh)=>lang==='zh'?zh:en,
  equationDetectionStatus:status,equationDetectionGeneration:0,
  equationDetectionProgress:{phase:'idle'},equationDetectionLastPaint:0,
  document:{createElement:()=>{
    const c={width:1,height:1, getContext:()=>({fillRect(){},drawImage(){},set fillStyle(v){}})};
    canvases.push(c);return c;
  }},
  pageRecordFromHocr:()=>({lines:[]}),remapEquationMarginOcrLine:(line)=>line,
});
vm.runInContext(src.slice(start,end),ctx,{timeout:5000});
let tests=0;
const check=(condition,description)=>{assert(condition,description);tests++;};
const run=(code)=>vm.runInContext(code,ctx);
check(run('equationDetectionGeneration')===0,'initial generation');
run('resetEquationDetectionProgress()');
check(run('equationDetectionGeneration')===1,'reset changes generation');
check(status.textContent==='','reset clears status');
check(run("updateEquationDetectionProgress({phase:'native',nativeDone:4,nativeTotal:12}, 0, true)")===false,'old-generation updates blocked');
check(run("updateEquationDetectionProgress({phase:'native',nativeDone:4,nativeTotal:12}, 1, true)")===true,'live generation accepts progress');
check(status.textContent.includes('Text 4/12'),'native progress visible');
run("updateEquationDetectionProgress({phase:'ocr',ocrDone:3,ocrTotal:8,documentPages:100,labels:16,recovered:2},1,true)");
check(status.textContent.includes('OCR 3/8'),'OCR denominator is actual plan');
check(!status.textContent.includes('planned pages') && status.title.includes('image OCR 3/8 planned pages'),'detailed OCR schedule moved to tooltip');
check(status.textContent.includes('selected') && status.title.includes('selected coverage only'),'partial automatic coverage explicitly labeled in short and full status');
check(status.textContent.includes('+2 recovered') && status.title.includes('+2 recovered'),'recovered labels reported, with expanded details on hover');
check(status.textContent.length < 40,'representative OCR status is compact');
check(!status.textContent.includes('16 labels') && status.title.includes('16 labels'),'total labels remain available in tooltip and adjacent count badge');
run("updateEquationDetectionProgress({phase:'partial',failedPages:1,nativeMs:1040,renderMs:4200,recognizeMs:8300,validationMs:100,elapsedMs:15000},1,true)");
check(status.textContent.includes('1 failed') && status.title.includes('1 failed pages'),'failed pages never shown as complete success');
check(status.title.includes('PDF rendering 4.20s') && status.title.includes('OCR recognition 8.30s'),'timing breakdown independently visible');
run('resetEquationDetectionProgress()');
check(status.textContent==='','switch resets stale progress');
check(run("updateEquationDetectionProgress({phase:'complete'},1,true)")===false,'late old-document completion blocked');
run("updateEquationDetectionProgress({phase:'saved'},2,true)");
check(status.textContent.includes('Saved') && status.textContent.includes('not rescanned'),'restored data never claims fresh scan');
run("updateEquationDetectionProgress({phase:'unavailable'},2,true)");
check(status.textContent.includes('full OCR needed') && status.title.includes('OCR required'),'unavailable text has accurate status');
run("updateEquationDetectionProgress({phase:'complete',ocrTotal:0,nativeDone:12,nativeTotal:12,labels:9},2,true)");
check(!status.textContent.includes('OCR 0/') && status.textContent.includes('Auto done') && status.textContent.includes('Text 12/12'),'no scheduled OCR distinguished from completed image OCR');
check(status.title.includes('Automatic check finished'),'finished means scheduled work done, not full correctness');
lang = 'zh';
run("updateEquationDetectionProgress({phase:'ocr',ocrDone:3,ocrTotal:8,documentPages:100,labels:16,recovered:2},2,true)");
check(status.textContent.includes('选页') && status.textContent.includes('补 2') && status.title.includes('仅覆盖选定页面'),'Chinese status retains coverage/recovery semantics');
lang = 'en';
run("updateEquationDetectionProgress({phase:'failed'},2,true)");
check(status.textContent.includes('Index failed') && status.title.includes('Equation indexing failed'),'explicit failed state retains detail');
const css=fs.readFileSync(path.join(__dirname,'../mathreader.css'),'utf8');
check(/\.equation-detection-status\{[^}]*white-space:nowrap[^}]*text-overflow:ellipsis/.test(css),'one-line CSS with narrow-pane ellipsis');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
check(html.includes('mathreader.js?v=349') && html.includes('mathreader.css?v=349'),'cache busters updated to v349');
check(html.includes('Expand to index equations.') && html.includes('Numbered references appear here.'),'sidebar empty hints shortened');

const doc={getPage:async()=>({getViewport:()=>({width:250,height:100}),render:()=>({promise:Promise.resolve()})})};
(async()=>{
  let observed=null;let calls=0;
  const worker={recognize:async()=>{calls++;ticks+=31;return {data:{hocr:'',text:''}};}};
  const rows=await ctx.equationMarginOcrLines(doc,1,'right',worker,{onTiming:m=>observed=m});
  check(rows.length===0,'empty mock OCR does not invent labels');
  check(calls===1,'recognize invoked exactly once');
  check(observed&&observed.renderMs>=0&&observed.recognizeMs===31,'recognition timing captured');
  check(canvases.every(c=>c.width===1&&c.height===1),'canvas resources released after success');
  canvases=[];
  await assert.rejects(ctx.equationMarginOcrLines(doc,1,'right',{recognize:async()=>{throw new Error('OCR fail')}},{onTiming:()=>{}}),/OCR fail/);
  check(canvases.every(c=>c.width===1&&c.height===1),'canvas resources released after recognition failure');
  // Source-level gates: actual per-page progress signals and final results not cached.
  check(src.includes("onProgress({ phase: 'ocr', ocrDone: donePages, failedPages, changed: pageAdded })"),'per-page completion event emitted even without new labels');
  check(src.includes('if (generation !== equationDetectionGeneration || pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return;'),'late OCR callbacks document-scoped');
  check(src.includes("const finish = { phase: (current.failedPages || 0) ? 'partial' : 'complete'"),'reported completion handles failed pages');
  console.log(`OK: ${tests} equation progress / timing regression assertions`);
})().catch(e=>{console.error(e);process.exitCode=1});
