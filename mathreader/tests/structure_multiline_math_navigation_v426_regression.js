'use strict';
// v426: regression from real PMESTOC25 native PDF.js text fragments.
// Must run against the production pageTextLines and Structure locator, not a
// separate sample text parser. The original export identifies the source PDF.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const fixture=JSON.parse(source('regression/fixtures/structure_navigation_native_rows_v426.json'));
const core=source('js/00-core.js'),detect=source('js/41-equations-bibliography.js'),outline=source('js/40-outline-structure.js');
const pdfDoc={numPages:12};
const context={console,pdfDoc,currentFileKey:'paper',readerNavigationSerial:0,lineCache:new Map(),textCache:new Map(),
manualIndexOcrPages:new Map(),documentOcrPages:new Map(),sourceDocumentUsesOcr:()=>false,
nativePageTextData:async (_doc,page)=>({page:{view:fixture.pages[page].view},content:{items:fixture.pages[page].items}}),
goToMatchedLocation:async(page,ratio,_query,options)=>{context.navigation={page,ratio,options}},navigation:null};
vm.createContext(context);
function extract(source,start,end){const a=source.indexOf(start);assert(a>=0,start);const b=source.indexOf(end,a+start.length);assert(b>a,end);return source.slice(a,b)}
vm.runInContext(extract(core,'function findFirstRowInYBuckets(', 'const nativePageTextCacheByDocument'),context);
vm.runInContext(extract(detect,'async function pageTextLines(', '\n\nfunction bibliographyHeadingText('),context);
vm.runInContext(extract(outline,'function comparableStructureNavigationText(value) {','\nfunction renderActiveOutline() {'),context);
const pageTextLines=vm.runInContext('pageTextLines',context);
const headingRatio=vm.runInContext('uniqueStructureHeadingRatio',context);
const navigate=vm.runInContext('navigateToStructureEntry',context);
async function target(title,page){context.navigation=null;await navigate({page,ratio:0,positionKnown:false,title});return context.navigation?.ratio}
async function main(){
  assert.equal(fixture.document_sha256,'sha256:c1e71f0441ecb6401b085a653028921b38fa35aca5bd27726f370eb5d8153d20');
  const cases=[
    [4,'2.1 Principal Minor Equivalence',.32061237],
    [4,'2.2 Reducible and Irreducible Matrix',.5295707],
    [5,'2.5 Cut-Transpose Operation',.22442929],
    // Actual two-line right-column heading, with mathematical text in left column at both baselines.
    [5,'3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices',.40659722],
    [10,'5 PIT for Sum of Two DET1',.82047095],
    // The embedded bookmark is plain ASCII while the printed heading uses mathematical bold and split indices.
    [11,'5.1 A0=B0=0',.4963],
    [11,'5.1 A_0 = B_0 = 0_n',.4963],
  ];
  for(const [page,title,wanted] of cases){
    const rows=await pageTextLines(page);
    const actual=headingRatio(rows,title);
    assert(actual!==null&&Math.abs(actual-wanted)<.004,`${title} page ${page}: ${actual}, wanted ${wanted}`);
    const jumped=await target(title,page);
    assert(Math.abs(jumped-wanted)<.004,`${title} click ${jumped}`);
  }
  // Cover every printed Structure heading in the original reading-data export,
  // including both columns and headings at page bottoms. The expected
  // positions come from native PDF text geometry, not hand-picked title logic.
  const allStructure=[
    [1,'Abstract',.317871],[1,'CCS Concepts',.555684],[1,'Keywords',.613615],
    [1,'1 Introduction',.737659],[3,'2 Notation and Preliminaries',.819777],
    [4,'2.3 Cut of a Matrix',.289064],[4,'2.1 Principal Minor Equivalence',.320612],
    [4,'2.2 Reducible and Irreducible Matrix',.529571],[4,'2.4 Diagonal Similarity',.568573],
    [5,'2.5 Cut-Transpose Operation',.224429],
    [5,'3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices',.406597],
    [9,'4 Algorithm for Principal Minor Equivalence Testing',.334527],
    [10,'5 PIT for Sum of Two DET1',.820471],[11,'5.1 A0=B0=0',.4963],
    [12,'References',.200071],
  ];
  for (const [page,title,expected] of allStructure) {
    const located=headingRatio(await pageTextLines(page),title);
    assert(located!==null && Math.abs(located-expected)<.004,`complete outline ${title}: ${located} vs ${expected}`);
  }
  // Mathematical tokens alone, prose references, and foreign-column fragments
  // must never be spliced into a matching title.
  context.lineCache.set(8,[
    {ratio:.3,text:'See Section 3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices',xStartRatio:.09,xEndRatio:.48},
    {ratio:.5,text:'3 Characterization of Prinicipal Minor',xStartRatio:.09,xEndRatio:.46},
    {ratio:.517,text:'Equivalence for Irreducible Matrices',xStartRatio:.53,xEndRatio:.85},
    {ratio:.7,text:'5.1 A0=B0=0 occurs in our example',xStartRatio:.09,xEndRatio:.46},
  ]);
  assert.equal(headingRatio(await pageTextLines(8),'3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices'),null,'cross-column title was spliced');
  assert.equal(headingRatio(await pageTextLines(8),'5.1 A0=B0=0'),null,'math heading confused with explanatory prose');
  context.lineCache.set(7,[
    {ratio:.20,text:'Chapter 3',xStartRatio:.09,xEndRatio:.40},
    {ratio:.50,text:'3 Characterization of Prinicipal Minor',xStartRatio:.52,xEndRatio:.86},
    {ratio:.52,text:'Equivalence for Irreducible Matrices',xStartRatio:.56,xEndRatio:.85},
    {ratio:.72,text:'3 Characterization of Prinicipal Minor',xStartRatio:.52,xEndRatio:.86},
    {ratio:.74,text:'Equivalence for Irreducible Matrices',xStartRatio:.56,xEndRatio:.85}
  ]);
  assert.equal(headingRatio(await pageTextLines(7),'3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices'),null,'ambiguous duplicate title guessed');
  // If PDF.js cannot provide text lines, an exact (page,title)-matched
  // typography entry supplies a reliable measured y without guessing.
  const oldReader=context.pageTextLines;
  context.inferredOutline=[{page:8,title:'Recovered Heading From Detector',ratio:.59,userEdited:false}];
  context.pageTextLines=async()=>[];
  context.navigation=null;
  await navigate({page:8,ratio:.11,positionKnown:false,title:'Recovered Heading From Detector'});
  assert.equal(context.navigation?.ratio,.59,'exact measured detector fallback missed');
  context.inferredOutline=[{page:8,title:'Different Text',ratio:.59,userEdited:false}];
  context.navigation=null;
  await navigate({page:8,ratio:0,positionKnown:false,title:'Recovered Heading From Detector'});
  assert.equal(context.navigation?.ratio,0,'nearby but unrelated detector heading was guessed');
  context.pageTextLines=oldReader;
  context.inferredOutline=[];
  context.navigation=null;
  await navigate({page:11,ratio:.63,userEdited:true,title:'5.1 A0=B0=0'});
  assert.equal(context.navigation?.ratio,.63,'manual Reselect coordinate overwritten');
  context.navigation=null;
  await navigate({page:11,ratio:.42,userEdited:false,positionKnown:true,title:'5.1 A0=B0=0'});
  assert.equal(context.navigation?.ratio,.42,'genuine non-top PDF coordinate overwritten');
  console.log('Structure multiline/math navigation v426 regression PASS');
}
main().catch(e=>{console.error(e);process.exitCode=1});
