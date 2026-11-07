// v409: printed reference [16]Anneaux ... has no extracted whitespace.
// Never infer bibliographic entries that were not actually observed.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const outline=fs.readFileSync(path.join(root,'js/40-outline-structure.js'),'utf8');
const ref=outline.match(/const STRUCTURE_REFERENCE_RE = ([^;]+);/);
let checks=0;const check=(okay,why)=>{assert.ok(okay,why);checks++;};
const row=(text,ratio=.3)=>({text,ratio,xStartRatio:.185,xEndRatio:.85,parts:[{start:0,end:text.length,xStartRatio:.185,xEndRatio:.85}]});
async function build(includeHeading=true, customPages=null){
 const pages=new Map([
   [1,[row('Introduction',.15),row('[16]Anneaux de Chow et applications, Seminaire C. Chevalley',.8)]],
   [2,[...includeHeading ? [row('References',.06)] : [],
     row('[15] S. Bradlow, Stable augmented bundles over Riemann surfaces, 1995.',.24),
     row('[16]Anneaux de Chow et applications, Seminaire C. Chevalley, Paris, 1958.',.34),
     row('[17] H. Derksen, J. Weyman and A. Zelevinsky, Quivers with potentials, 2008.',.44),
     row('[AB]Smith, A. Mathematical paper in geometry, 2009.',.54)]],
 ]);
 if (customPages) {pages.clear(); for(const [page,rows] of customPages) pages.set(page,rows);}
 const ctx=vm.createContext({console,setTimeout,document:{addEventListener(){}},pdfDoc:{numPages:2},currentFileKey:'reference-spacing-control',documentTextFeaturesAvailable:()=>true,structureIndex:{},structureIndexBuilding:false,buildStructureIndexButton:{disabled:false},structureEmpty:{classList:{remove(){}},textContent:''},bibliographyEmpty:{classList:{remove(){}},textContent:''},textCache:new Map(),lineCache:new Map(),structureIndexBuildToken:0,structureEntries:[],bibliographyEntries:[],structureIndexVersion:0,pendingOutlineReselectKey:null,STRUCTURE_INDEX_VERSION:52,STRUCTURE_REFERENCE_RE:vm.runInNewContext(ref[1]),async suppliedTextLines(n){return pages.get(n)||[];},async *orderedPrefetch(items,fn){for(const item of items)yield{item,value:await fn(item)}},backlinkSnippet(t){return t.slice(0,20)},persistDocumentState(){},rerenderReferenceLinks(){},t(x){return x;}});
 vm.runInContext(source,ctx,{timeout:12000});vm.runInContext('pageTextLines=suppliedTextLines;renderStructureIndex=()=>{};renderBibliographyIndex=()=>{};rerenderReferenceLinks=()=>{};',ctx);await ctx.buildStructureIndex({force:true});return JSON.parse(JSON.stringify(ctx.bibliographyEntries));
}
(async()=>{
 const rows=await build();
 check(rows.length===4,`four observed entries, no made-up filler: ${rows.map(x=>x.label)}`);
 for(const [key,body] of [['[15]','S. Bradlow'],['[16]','Anneaux'],['[17]','H. Derksen'],['[AB]','Smith']]){
  const e=rows.find(e=>e.label===key);check(e,`observed reference ${key} is retained`);check(e.title.includes(body),`${key} retains title text`);check(e.page===2,`${key} remains on physical reference page`);
 }
 const heritage=await build(true,[[1,[row('BIBLIOGRAPHY',.08),
    row('[6] Ε. Β. Dynkin and A. L. Oniscik, Compact global Lie groups, 1955.',.25),
    row('[ADM2] , Energy and the criteria for radiation in general relativity, 1960.',.34),
    row('[ADM3] , Coordinate invariance and energy expressions, 1961.',.44)]]]);
 check(heritage.length===3, 'legacy Unicode-author and comma-prefixed author-repetition keys retained: '+heritage.map(x=>x.label));
 for (const name of ['[6]','[ADM2]','[ADM3]'])check(heritage.some(e=>e.label===name), 'legacy bibliography reference preserved: '+name);
 const noReferences=await build(false);check(noReferences.length===0,'no bibliography heading means bracketed body citations are not a bibliography');
 console.log(`PASS ${checks} no-whitespace bibliography key and false-positive controls`);
})().catch(e=>{console.error(e);process.exitCode=1});
