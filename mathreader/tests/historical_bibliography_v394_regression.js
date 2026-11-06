// Execute the real production bibliography builder with actual PDF.js-derived
// detector lines from Giusti pp.248-251 and Yau p.73. NOT OCR model testing.
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(process.env.BIB_SOURCE_OVERRIDE||path.join(root,'js/41-equations-bibliography.js'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'regression/historical_native_pages_v394.json'),'utf8'));
let checks=0;
function check(v,msg){assert.ok(v,msg);checks++}
async function replay(data){
 const pageLines=new Map(data.pages.map(p=>[p.page,p.detectorInputLines||[]]));
 const c=vm.createContext({console,document:{addEventListener(){}},setTimeout,
  pdfDoc:{numPages:data.document.pages},currentFileKey:'doc-sha256',documentTextFeaturesAvailable(){return true},
  structureIndex:{},structureIndexBuilding:false,buildStructureIndexButton:{disabled:false},
  structureEmpty:{classList:{remove(){}},textContent:''},bibliographyEmpty:{classList:{remove(){}},textContent:''},
  textCache:new Map(),lineCache:new Map(),structureIndexBuildToken:0,
  structureEntries:[],bibliographyEntries:[],structureIndexVersion:0,pendingOutlineReselectKey:null,
  STRUCTURE_INDEX_VERSION:49,STRUCTURE_REFERENCE_RE:/(?:Theorem|Lemma|Proposition|Corollary)\s+\d+(?:\.\d+)*/gi,
  async injectedPageTextLines(n){return pageLines.get(n)||[]},
  async *orderedPrefetch(items,fn){for(const item of items)yield {item,value:await fn(item)}},
  backlinkSnippet(line,fragment,i){return String(line).slice(Math.max(0,i-20),i+50)},
  rerenderReferenceLinks(){},persistDocumentState(){},t(a){return a;}
 });
 vm.runInContext(src,c,{timeout:15000});
 vm.runInContext('pageTextLines=injectedPageTextLines;tocResultLineIndices=()=>new Set();structureResultsIndexNavigationPage=()=>false;detectedStructureResult=()=>null;renderStructureIndex=()=>{};renderBibliographyIndex=()=>{};rerenderReferenceLinks=()=>{};',c);
 await c.buildStructureIndex({force:true});
 check(Number(c.structureIndexVersion)===49,'real builder completed without caught exception');
 return JSON.parse(JSON.stringify(c.bibliographyEntries));
}
(async()=>{
 const giusti=await replay(fixture.documents.giusti);
 const yau=await replay(fixture.documents.yau);
 check(giusti.length===75,`Giusti original refs should be 75 after recovering damaged [BDGM}, got ${giusti.length}`);
 const keyed=new Map(giusti.map(x=>[String(x.number).replace(/\s+/g,''),x]));
 for(const [key,prefix] of [['AR','ADAMS, R.A.'],['AW','ALLARD, W.'],['AF1','ALMGREN, F.J., Jr.'],
  ['AF2','ALMGREN, F.J., Jr.'],['AN','ANZELLOTTI, G.'],['BS2','BERNSTEIN, S.'],
  ['BDGG','BOMBIERI, E. - DE GiORGI, E. - GIUSTI, E.'],['BDGM','BOMBIERI, E. - DE GIORGI, E. - MIRANDA, M.'],['CH','COURANT, R. - HILBERT, D.']]) {
  const entry=keyed.get(key);
  check(Boolean(entry),`Giusti: bibliography key ${key} recovered from printed page`);
  check(entry.title.startsWith(prefix),`Giusti: ${key} retains its actual author, got ${entry.title.slice(0,100)}`);
 }
 const ar=keyed.get('AR');
 check(!ar.title.includes('ALLARD'),'Giusti: next author cannot be appended to [AR]');
 check(!keyed.get('BDGG').title.includes('MIRANDA'),'Giusti: author-key [BDGM] cannot be merged into [BDGG]');
 check(keyed.get('BDGM').title.includes('Una maggiorazione'),'Giusti: damaged right brace repaired only with verified author heading');
 check(yau.length===15,'Yau: all 15 numbered bibliography entries retained');
 check(yau[0]?.number===1 && yau[14]?.number===15,'Yau: numeric bibliography sequence unaffected');
 check(yau.find(x=>x.number===11)?.title?.startsWith('Federer, H.'),'Yau: printed reference 11 preserved');
 console.log(`PASS ${checks} real original-PDF bibliography assertions; Giusti ${giusti.length} keyed references, Yau ${yau.length} numeric references`);
})().catch(e=>{console.error(e);process.exitCode=1});
