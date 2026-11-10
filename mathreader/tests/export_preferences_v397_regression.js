'use strict';
// Real export callback and serializer tested for each checkbox combination.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/60-notes-bookmarks-data.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js/70-command-ui-runtime.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let checks = 0;
function check(test, why) {assert.ok(test,why); checks++;}
function extract(source,name) {
  const m=source.match(new RegExp('(?:async )?function '+name+'\\([^]*?\\n\\}(?=\\n)','m'));
  assert.ok(m,'missing '+name);return m[0];
}
const clone=(value,fb={})=>{try{return JSON.parse(JSON.stringify(value));}catch{return fb;}};
const f=(name,ctx,source=src)=>vm.runInNewContext('('+extract(source,name)+')',ctx);
const doc={numPages:30};
function originalSession(){return {
  page:17, bookmarks:[{page:8}],notes:{17:'proof idea'},annotations:[{page:2}],
  equationEdits:[{label:'(5.1)',page:5}],embeddedOutlineEdits:[{title:'Corrected chapter'}],
  ocrHistory:[{latex:'x^2'}],inferredOutline:[{title:'AUTO SECRET HEADING'}],
  structureEntries:[{title:'AUTO SECRET THEOREM'}],bibliographyEntries:[{title:'AUTO SECRET REF'}],
  equationIndexSnapshot:{rows:[{label:'(1.1)',text:'AUTO SECRET FORMULA'}]},
  equationManualOrder:['label:(1.1)','label:(1.2)'],equationOrderCustomized:false,
  equationIndexSummary:{version:26,count:1},structureIndexVersion:49,portableContentDetection:true,
  undoHistory:[{type:'annotation',payload:'my note'},{type:'structure-outline',payload:'AUTO SECRET'}]
};}
function fixture(det,full) {
  const downloads=[],counts={settle:0,full:0,ocr:0};
  const ctx={
    pdfDoc:doc,currentFileKey:'sha256:test-v397',currentFileName:'Yau 1978.pdf',
    exportPreferences:{includeDetection:det,includeFullDocumentText:full},
    documentOcrActive:true,
    exportReadingDataButton:{disabled:false},
    jsonClone:clone,
    snapshotSession:originalSession,
    readingDataSessionForExport:null,
    readingDataContentDetectionSnapshot:()=>({version:1,structure:[{title:'AUTO SECRET'}],results:[],equations:null,bibliography:[]}),
    exportedDocumentOcrSnapshot:()=>{counts.ocr++;return {version:2,pageCount:30,pages:[{page:1,lines:[{text:'OCR FULL'}]}]};},
    settleContentDetectionForExport:async()=>{counts.settle++;return true;},
    readingDataRawDetectionSnapshot:async()=>{counts.full++;return {version:1,pageCount:30,complete:true,pages:Array.from({length:30},(_,i)=>({page:i+1,nativePdf:{items:[{str:'RAW FULL TEXT '+(i+1)}]},detectorInputLines:[]}))};},
    downloadReadingDataJsonFile:async(name,value)=>downloads.push({name,value}),
    showError:(value)=>{throw Error('unexpected error: '+value);}, t:(en)=>en,
    Date,Number,Map,JSON,String,console,setTimeout
  };
  ctx.readingDataSessionForExport=f('readingDataSessionForExport',ctx);
  return {ctx,downloads,counts,run:f('exportReadingData',ctx)};
}
async function run(){
  for(const det of [false,true])for(const full of [false,true]){
    const h=fixture(det,full);
    await h.run();
    check(h.downloads.length===1,`exactly one export det=${det} full=${full}`);
    const {name,value}=h.downloads[0];
    check(name==='Yau-1978-mathreader.json','stable filename');
    check(value.schema==='mathreader.reading-data@1'&&value.document.id==='sha256:test-v397','schema and sha256 identity');
    check(value.session.page===17&&value.session.bookmarks.length===1&&value.session.notes[17]==='proof idea','reading data always included');
    check(value.session.equationEdits.length===1&&value.session.embeddedOutlineEdits.length===1,'manual equation/outline corrections preserved');
    check(value.session.equationOrderCustomized===false&&!('equationManualOrder' in value.session),'unmodified automatic equation order excluded from every export layer');
    check(('contentDetection' in value)===det,'detection top-level switch');
    check(('inferredOutline' in value.session)===det,'no hidden automatic Structure when off');
    check(('structureEntries' in value.session)===det,'no hidden automatic Results when off');
    check(('bibliographyEntries' in value.session)===det,'no hidden automatic Bibliography when off');
    check(('equationIndexSnapshot' in value.session)===det,'no hidden automatic Equations when off');
    check(('equationIndexSummary' in value.session)===det,'no hidden automatic Equation summary when off');
    check(('portableContentDetection' in value.session)===det,'no accidental detector restoration flag when off');
    check((value.session.undoHistory.length===2)===det,'user undo retained, raw auto-heading undo excluded');
    check(('fullDocumentText' in value)===full,'full text is independently optional');
    check(('documentOcr' in value)===full,'full OCR cache independently optional');
    check(h.counts.settle===Number(det),'no forced detector rebuild for reading-only export');
    check(h.counts.full===Number(full),'no all-page native reads unless full text requested');
    check(h.counts.ocr===Number(full),'no full OCR snapshot unless opted in');
    check(value.exportLayers.detection===(det?'included':'excluded')&&value.exportLayers.fullDocumentText===(full?'complete':'excluded'),'manifest represents chosen layers');
    if(full)check(value.fullDocumentText.pages.length===30&&value.fullDocumentText.pages[29].nativePdf.items[0].str==='RAW FULL TEXT 30','all pages included');
    check(h.ctx.exportReadingDataButton.disabled===false,'Export control unlocked');
  }
  {
    const h=fixture(false,false);
    h.ctx.snapshotSession=()=>({...originalSession(),inferredOutline:[{title:'AUTO',page:1},{title:'MY HEADING',page:2,userEdited:true}],
      undoHistory:[{type:'structure-outline',payload:{title:'MY HEADING',page:2,userEdited:true}},{type:'structure-outline',payload:{title:'AUTO',page:1}}]});
    await h.run();
    check(h.downloads[0].value.session.inferredOutline.length===1&&h.downloads[0].value.session.inferredOutline[0].title==='MY HEADING', 'manually selected Structure entry survives reading-only backup');
    check(h.downloads[0].value.session.undoHistory.length===1, 'manual Structure undo retained, automatic deleted Structure excluded');
  }
  {
    const h=fixture(false,false);
    h.ctx.snapshotSession=()=>({...originalSession(),equationOrderCustomized:true,
      equationManualOrder:['label:(2.2)','label:(1.1)']});
    await h.run();
    check(h.downloads[0].value.session.equationManualOrder.join('|')==='label:(2.2)|label:(1.1)',
      'genuine drag-and-drop equation ordering remains part of reading-only backups');
  }
  // Broken or inaccessible preferences must resolve to secure documented defaults.
  for(const stored of [null,'{broken}',JSON.stringify({includeDetection:false,includeFullDocumentText:true})]){
    const storage={'mathreader-export-v1':stored};
    const c={EXPORT_PREFS_KEY:'mathreader-export-v1',exportPreferences:{},
      exportDetectionOption:{checked:false},exportFullTextOption:{checked:false},
      safeGet:(key,fallback)=>storage[key]??fallback,safeSet:(key,value)=>{storage[key]=value;},JSON};
    f('loadExportPreferences',c,core)();
    const p=vm.runInNewContext('exportPreferences',c); // reflects assignment in the realm
    check(p.includeDetection===(stored===null||stored==='{broken}'),'default detection or saved setting');
    check(p.includeFullDocumentText===(stored!==null&&stored!=='{broken}'),'default no full text or saved setting');
    c.exportDetectionOption.checked=true;c.exportFullTextOption.checked=false;
    f('persistExportPreferences',c,core)();
    check(JSON.parse(storage['mathreader-export-v1']).includeDetection===true&&JSON.parse(storage['mathreader-export-v1']).includeFullDocumentText===false,'preferences saved across sessions');
  }
  {
    const h=fixture(false,true);h.ctx.readingDataRawDetectionSnapshot=async()=>null;
    await h.run();check(h.downloads.length===0,'document switch during full-text snapshot cancels export');
    check(h.ctx.exportReadingDataButton.disabled===false,'cancelled export unlocks button');
  }
  {
    const h=fixture(false,true);
    h.ctx.documentOcrActive=false;
    h.ctx.exportedDocumentOcrSnapshot=()=>null;
    h.ctx.readingDataRawDetectionSnapshot=async()=>({version:1,pageCount:30,complete:true,
      pages:[{page:1,documentOcrPageRef:1,nativePdf:{items:[]}}]});
    await h.run();
    check(h.downloads[0].value.exportLayers.fullDocumentOcr==='not-stored','missing OCR cache explicitly marked unavailable');
    check(h.downloads[0].value.fullDocumentText.pages[0].documentOcrEvidenceStatus==='not-stored'&&
      !('documentOcrPageRef' in h.downloads[0].value.fullDocumentText.pages[0]),'dangling OCR page reference removed');
  }
  {
    const h=fixture(true,true); h.ctx.readingDataRawDetectionSnapshot=async()=>({version:1,pageCount:30,complete:false,errors:[{page:3,stage:'native-pdf'}],pages:[]});
    await h.run();check(h.downloads[0].value.exportLayers.fullDocumentText==='partial','partial page read disclosed rather than claimed complete');
  }
  {
    const h=fixture(false,false);h.ctx.settleContentDetectionForExport=async()=>{throw Error('MUST NOT REBUILD');};
    await h.run();check(h.downloads.length===1,'no detector dependency in reading-only mode');
  }
  {
    let opened='',revoked='';const blobHolder=[],anchors=[];
    const c={Blob,URL:{createObjectURL:b=>{blobHolder.push(b);return 'blob:test';},revokeObjectURL:u=>revoked=u},document:{body:{append:()=>{}},createElement:()=>{const a={click(){anchors.push(a);},remove(){}};return a;}},setTimeout:(fn)=>fn(),downloadJsonFile:()=>{throw Error('should stream')},JSON,Object,Promise};
    const stream=f('downloadReadingDataJsonFile',c);
    const h=fixture(true,true);await h.run();
    await stream('test.json',h.downloads[0].value);
    const streamed=JSON.parse(await blobHolder[0].text());
    check(streamed.fullDocumentText.pages.length===30&&streamed.documentOcr.pages[0].lines[0].text==='OCR FULL','incremental Blob serialization preserves all original fields and OCR geometry');
    check(streamed.exportLayers.fullDocumentText==='complete'&&streamed.contentDetection.version===1,'serializer preserves small metadata and all selected layers');
    check(anchors.length===1&&anchors[0].download==='test.json'&&revoked==='blob:test','download and URL cleanup');
  }
  {
    let exports=0;const c={Blob,URL:{createObjectURL:()=>{exports++;return 'blob:none';},revokeObjectURL:()=>{}},document:{body:{append:()=>{}},createElement:()=>({click:()=>{},remove:()=>{}})},setTimeout:(fn)=>fn(),downloadJsonFile:()=>{exports++;},JSON,Object,Promise};
    const stream=f('downloadReadingDataJsonFile',c);
    await stream('test', {session:{page:1}});check(exports===1,'small reading-only export retains existing downloader');
  }
  {
    const htmlStart=html.indexOf('<section class="workspace-section settings-section"');
    const htmlStop=html.indexOf('<section class="workspace-section shortcuts"',htmlStart);
    const fragment=html.slice(htmlStart,htmlStop);
    check(fragment.includes('id="settings-export-group"')&&fragment.includes('id="export-include-detection"')&&fragment.includes('id="export-include-full-text"'),'both checkboxes inside Settings');
    check(ui.includes("exportDetectionOption?.addEventListener('change', persistExportPreferences)")&&ui.includes("loadExportPreferences();"),'checkbox events and startup restoration wired');
    check(html.includes('mathreader.js?v=424')&&html.includes('mathreader.css?v=424'),'v420 browser caches invalidated');
    check(!extract(src,'importReadingDataFile').includes('payload.fullDocumentText'),'diagnostic full text does not alter reading state during import');
  }
  console.log(`PASS | v397 independent export options | assertions=${checks}`);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
