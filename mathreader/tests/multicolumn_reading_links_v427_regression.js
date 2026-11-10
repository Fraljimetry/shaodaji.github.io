'use strict';
// Reproduce a defect of reference / TOC / backlink consumers: a PDF.js row
// contains both columns and its concatenated text is not a readable sentence.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const fixture=JSON.parse(read('regression/fixtures/structure_navigation_native_rows_v426.json'));
const core=read('js/00-core.js'),detection=read('js/41-equations-bibliography.js'),outline=read('js/40-outline-structure.js');
const reference=read('js/50-references-search.js');
function chunk(src,begin,end){const a=src.indexOf(begin);assert(a>=0,begin);const b=src.indexOf(end,a+begin.length);assert(b>a,end);return src.slice(a,b)}
const ctx={console,Map,Set,Date,Promise,pdfDoc:{numPages:12},currentFileKey:'stoc',lineCache:new Map(),textCache:new Map(),manualIndexOcrPages:new Map(),documentOcrPages:new Map(),sourceDocumentUsesOcr:()=>false,structureEntries:[],bibliographyEntries:[],inferredOutline:[],t:x=>x,
  nativePageTextData:async(_,p)=>({page:{view:fixture.pages[p]?.view||[0,0,612,792]},content:{items:fixture.pages[p]?.items||[]}}),
  normalizedReferenceLabel:v=>String(v).toLowerCase().replace(/\s+/g,' ').trim(),normalizedEquationLabel:v=>v,isEquationLabelQuery:()=>false,documentTextFeaturesAvailable:()=>true};
vm.createContext(ctx);
vm.runInContext(chunk(core,'function findFirstRowInYBuckets(', 'const nativePageTextCacheByDocument'),ctx);
vm.runInContext(chunk(detection,'async function pageTextLines(', '\n\nfunction bibliographyHeadingText('),ctx);
vm.runInContext(chunk(outline,'function comparableStructureNavigationText(value) {', '\nfunction renderActiveOutline() {'),ctx);
vm.runInContext(reference,ctx);
function call(name,...args){return vm.runInContext(name,ctx)(...args)}
function joinedRow(r,left,right){
  const lt=left[0],rt=right[0],txt=lt+' '+rt;
  return {text:txt,ratio:r,parts:[{start:0,end:lt.length,xStartRatio:left[1],xEndRatio:left[2]},
    {start:lt.length+1,end:txt.length,xStartRatio:right[1],xEndRatio:right[2]}],
    xStartRatio:left[1],xEndRatio:right[2]};
}
async function run(){
  assert.equal(fixture.document_sha256,'sha256:c1e71f0441ecb6401b085a653028921b38fa35aca5bd27726f370eb5d8153d20');
  // Right-column section 3 wraps into multiple baselines; ordinary page-y rows
  // have unrelated simultaneous left-column content. This is real PDF.js data.
  const section=await call('findTocTitleLocation','3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices',1);
  assert(section&&section.page===5&&Math.abs(section.ratio-.4066)<.005,`wrapped TOC destination missed: ${JSON.stringify(section)}`);
  const rowLines=await call('pageTextLines',4);
  const local=call('columnLocalReadingLines',rowLines);
  assert(local.some(x=>x.text==='2.1 Principal Minor Equivalence'&&Math.abs(x.ratio-.320612)<.005),'true left-column heading absent');
  assert(local.every(x=>!x.text.includes('2.1 Principal Minor Equivalence continuation of a different') ),'opposite-column sentence spliced');
  // Deliberately construct a page whose flattened baseline reads "Lemma 5",
  // even though "Lemma" and "5" occupy different columns. Both columns
  // contain enough substantive body text to prove a real two-column layout.
  const lines=[];
  for(let i=0;i<10;i++){
    const left=i===4?'The proof refers to Lemma':'The proof on the left describes separate matrix properties';
    const right=i===4?'5 is a fixed number and is not a lemma reference':'A complete paragraph in the independent right column appears here';
    lines.push(joinedRow(.12+i*.065,[left,.07,.43],[right,.54,.94]));
  }
  ctx.pdfDoc={numPages:1};ctx.lineCache=new Map([[1,lines]]);
  const fragments=call('columnLocalReadingLines',lines);
  assert.equal(fragments.length,20,'confirmed two-column page not split');
  const fake=await call('findReferenceTextLocation','Lemma 5');
  assert(!fake,`cross-column phantom reference: ${JSON.stringify(fake)}`);
  const backlinks=await call('collectBacklinks','Lemma 5',{page:2,ratio:.30});
  assert.equal(backlinks.length,0,'cross-column phantom backlink');
  // A two-column table of contents consists of independent complete lines.
  // Flattening them into one row misses otherwise-authoritative Structure links.
  const tocLines=[];
  const titles=[
    ['2.1 Linear Algebraic Preliminaries','3.1 The Maximum Principle'],
    ['2.2 Geometric Matrix Identities','3.2 Elliptic Boundary Conditions'],
    ['2.3 Principal Minor Equivalence','3.3 Solvability Conditions'],
    ['2.4 Diagonal Similarity Relations','3.4 Spectral Analysis Results'],
  ];
  for (let k=0;k<titles.length;k++) tocLines.push(joinedRow(.24+k*.055,[titles[k][0],.08,.44],[titles[k][1],.54,.95]));
  ctx.lineCache.set(1,tocLines);
  const targets=titles.flatMap(pair=>pair.map(title=>({title,page:3,ratio:.5})));
  const toc=await call('compareTocPageWithStructure',1,targets);
  assert(toc.isToc&&toc.matches.length>=3,`two-column TOC not recognized: ${JSON.stringify(toc)}`);
  assert(toc.matches.every(item=>item.line.text===item.target.title),'TOC links spliced adjacent column text');
  // Full-width prose with one right-aligned formula label is NOT a two-column
  // page; preserve the original row intact to avoid damaging mono-column PDFs.
  const mono=[joinedRow(.2,['Theorem 1 begins here and reaches across the page',.08,.77],['(1.1)',.85,.9])];
  assert.equal(call('columnLocalReadingLines',mono).length,1,'single column formula tag was split');
  console.log('Multicolumn reading-links v427 regression PASS');
}
run().catch(err=>{console.error(err);process.exitCode=1});
