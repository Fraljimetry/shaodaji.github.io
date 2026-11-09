// v419: manual Structure entries survive detector refresh, no-text PDF bookmarks,
// native cache invalidation, bounded indexes and reading-only export.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../js');
const src=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const part=(text,from,to)=>{const i=text.indexOf(from),j=text.indexOf(to,i+from.length);assert(i>=0&&j>i,from);return text.slice(i,j)};
const outline=src('40-outline-structure.js'), selection=src('20-selection-annotations.js'),refs=src('50-references-search.js'),notes=src('60-notes-bookmarks-data.js');
const manual={title:'A manual sentence',matchText:'A manual sentence',page:5,ratio:.35,depth:2,userEdited:true};
let checks=0;
const eq=(value,want,msg)=>{assert.deepStrictEqual(value,want,msg);checks++};
const context=vm.createContext({console,MAX_INFERRED_OUTLINE_ENTRIES:1200,inferredOutline:[],
 inferredOutlineDetectionDone:false,inferredOutlineBuildPromise:null,
 pdfDoc:{getOutline:async()=>[{title:'Bookmark',dest:2}]},currentFileKey:'doc-A',
 embeddedOutlineEntries:[],outlineMode:'none',outlineList:{replaceChildren(){}},outlineCount:{textContent:''},
 outlineEmpty:{textContent:'',classList:{remove(){}}},tocOutlineTargets:null,
 documentTextFeaturesAvailable:()=>true,
 flattenOutline:items=>items.map(item=>({item,depth:0})),
 resolveOutlineDestination:async(id)=>({page:id,ratio:.1}),cleanEmbeddedOutlineTitle:s=>s,
 renderEmbeddedOutline:items=>{context.rendered=items},renderInferredOutline:items=>{context.rendered=items},
 updateOutlineSource(){},scheduleCount:0,
 rerenderReferenceLinks(){},persistDocumentState(){context.saved++},saved:0,
 t:en=>en,portableContentDetectionActive:false,
});
vm.runInContext([
 part(selection,'function outlineEntryFromSelection(', '\nfunction equationLabelFromSelectionText('),
 part(outline,'function boundedOutlineWithManualPriority(', '\nfunction renderActiveOutline()'),
 part(refs,'function scheduleDetectedOutlineAugmentation() {', '\nasync function renderOutline()'),
 part(refs,'async function renderOutline() {', '\nasync function pageText('),
 part(notes,'function readingDataSessionForExport(', '\nasync function exportReadingData()'),
].join('\n'),context,{timeout:10000});
const run=(script)=>vm.runInContext(script,context,{timeout:10000});
(async()=>{
  // More automatic headings than the reader limit: user-authored items win.
  context.inferredOutline=[manual];
  const incoming=Array.from({length:1300},(_,i)=>({title:`Auto ${i}`,page:i+1,ratio:.1,depth:0}));
  context.incoming=incoming;
  run('inferredOutline=mergeDetectedAndManualOutline(incoming)');
  eq(context.inferredOutline.length,1200,'shared 1200-item bound');
  eq(context.inferredOutline.some(e=>e.userEdited&&e.title===manual.title),true,'never discard user-authored entry');
  // Automatic exact duplicate of a manual heading must not supersede the edit.
  context.inferredOutline=[manual];
  context.incoming=[{...manual,userEdited:false},{title:'Auto',page:4,ratio:.2}];
  run('inferredOutline=mergeDetectedAndManualOutline(incoming)');
  eq(context.inferredOutline.length,2,'duplicate auto heading suppressed');
  eq(context.inferredOutline.find(e=>e.title===manual.title).userEdited,true,'manual wins duplicate');
  // In-flight background detection must merge with manual additions committed
  // AFTER the detector started, rather than retaining its stale starting list.
  let resolveDetection;
  context.inferredOutline=[];
  context.detectOutlineFromTypography=()=>new Promise(resolve=>resolveDetection=resolve);
  run('scheduleDetectedOutlineAugmentation()');
  context.inferredOutline=[manual];
  resolveDetection([{title:'A detected heading',page:3,ratio:.2}]);
  await context.inferredOutlineBuildPromise;
  eq(context.inferredOutline.length,2,'background detection merges live user state');
  eq(context.inferredOutline.some(e=>e.userEdited),true,'manual entry survives in-flight detection');
  eq(context.inferredOutlineDetectionDone,true,'completed detector flag set');
  // Image-only PDF with a real embedded outline: still render its bookmarks.
  context.documentTextFeaturesAvailable=()=>false;
  context.inferredOutline=[manual];
  context.inferredOutlineDetectionDone=false;
  await run('renderOutline()');
  eq(context.rendered[0].title,'Bookmark','PDF embedded outline visible with unavailable page text');
  eq(context.rendered.length,1,'embedded bookmarks are not replaced by inferred list');
  eq(context.inferredOutlineDetectionDone,false,'manual entries alone do not imply typography detection complete');
  // Image-only PDF without an outline: manual content still shown.
  context.pdfDoc={getOutline:async()=>[]};
  await run('renderOutline()');
  eq(context.rendered.length,1,'manual item visible on text-unavailable PDF');
  eq(context.rendered[0].title,manual.title,'manual title remains unchanged');
  // A reading-only export retains manual Structure edits and embedded metadata,
  // but strips all automatic Structure, Results, and bibliography detections.
  context.jsonClone=(value, fallback)=>{try{return JSON.parse(JSON.stringify(value))}catch{return fallback}};
  const original={inferredOutline:[manual,{title:'Detected',page:1,userEdited:false}],
    embeddedOutlineEdits:[{sourceKey:'1',action:'reselect',title:'Edited bookmark'}],
    structureEntries:[{title:'Automatic theorem'}],bibliographyEntries:[{label:'[1]'}],
    equationIndexSummary:{version:28,count:1}};
  context.record=original;
  const exported=run('readingDataSessionForExport(record,false)');
  eq(exported.inferredOutline.length,1,'manual Structure in reading-only export');
  eq(exported.inferredOutline[0].title,manual.title,'manual Structure text retained');
  eq(exported.embeddedOutlineEdits.length,1,'PDF embedded reselect persisted');
  eq('structureEntries' in exported,false,'automatic Results excluded from reading-only export');
  eq('bibliographyEntries' in exported,false,'automatic Bibliography excluded from reading-only export');
  eq('equationIndexSummary' in exported,false,'automatic Equation index excluded from reading-only export');
  console.log(`OK: ${checks} Structure augmentation, no-text bookmarks, and export assertions`);
})().catch(e=>{console.error(e);process.exitCode=1});
