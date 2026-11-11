'use strict';
// Source-measured PMESTOC25 PDF.js text items, not fabricated paper-specific
// heading exceptions: audit the same column projection used by Search.
const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const fx=JSON.parse(read('regression/fixtures/structure_navigation_native_rows_v426.json'));
const core=read('js/00-core.js'),equations=read('js/41-equations-bibliography.js'),outline=read('js/40-outline-structure.js'),refs=read('js/50-references-search.js');
function slice(source,a,b){const start=source.indexOf(a);assert(start>=0,a);const end=source.indexOf(b,start+a.length);assert(end>start,b);return source.slice(start,end)}
const ctx=vm.createContext({console,Map,Set,Promise,Date,pdfDoc:{numPages:12},currentFileKey:'stoc',
  lineCache:new Map(),textCache:new Map(),manualIndexOcrPages:new Map(),documentOcrPages:new Map(),
  sourceDocumentUsesOcr:()=>false,
  nativePageTextData:async(_,p)=>({page:{view:fx.pages[p]?.view||[0,0,612,792]},content:{items:fx.pages[p]?.items||[]}}),t:x=>x});
vm.runInContext(slice(core,'function findFirstRowInYBuckets(', 'const nativePageTextCacheByDocument'),ctx);
vm.runInContext(slice(equations,'async function pageTextLines(', '\n\nfunction bibliographyHeadingText('),ctx);
vm.runInContext(slice(outline,'function comparableStructureNavigationText(value) {', '\nfunction renderActiveOutline() {'),ctx);
vm.runInContext(slice(refs,'function columnLocalReadingLines(', 'async function findSectionNumberLocation('),ctx);
vm.runInContext(slice(refs,'async function searchPageRuns(', 'function normalizeSearchValue('),ctx);
(async()=>{
 for(const [page,title] of [[4,'2.1 Principal Minor Equivalence'],[5,'2.5 Cut-Transpose Operation']]){
  const runs=await vm.runInContext('searchPageRuns',ctx)(page);
  assert(runs.some(x=>x.column==='left')&&runs.some(x=>x.column==='right'),`two-column page ${page} not recognized`);
  const hits=runs.flatMap(r=>{const i=r.text.indexOf(title);return i<0?[]:[{column:r.column,ratio:vm.runInContext('searchHitGeometry',ctx)(r,i).ratio}];});
  assert.equal(hits.length,1,`real ${title} must appear once, not as a stitched phantom`);
  assert(hits[0].ratio>0&&hits[0].ratio<1);
 }
 console.log('PASS: exact PMESTOC25 original PDF.js source spans split into searchable columns');
})().catch(e=>{console.error(e);process.exitCode=1});
