'use strict';
// Real production search code: two-column page-y flattening must not create
// phantom matches, and fuzzy results need the matched text for navigation.
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/50-references-search.js'),'utf8');
function row(i,left,right){
  const x=left.length+1;
  return {text:left+' '+right,ratio:.10+i*.07,
    xStartRatio:.075,xEndRatio:.94,
    parts:[{start:0,end:left.length,xStartRatio:.075,xEndRatio:.44},
      {start:x,end:x+right.length,xStartRatio:.54,xEndRatio:.94}]};
}
const lines=[];
for(let i=0;i<9;i++){
  const left=i===3?'Boundary':i===4?'important invariant':'A paragraph of independent mathematical reasoning on left side';
  const right=i===3?'Cross':i===4?'repeated text of another independent passage':'Another unrelated paragraph about topological concepts on right side';
  lines.push(row(i,left,right));
}
const searchResults={items:[],replaceChildren(){this.items=[]},append(v){this.items.push(v)}};
const ctx={console,Map,Set,Promise,Date,window:{},pdfDoc:{numPages:1},currentFileKey:'sample',
  lineCache:new Map([[1,lines]]),pageTextLines:async()=>lines,textCache:new Map(),manualIndexOcrPages:new Map(),
  sourceDocumentUsesOcr:()=>false,documentOcrPages:new Map(),
  searchResults,searchStatus:{textContent:''},searchFuzzy:{checked:false},
  searchMatchCase:{checked:false},searchWholeWord:{checked:false},searchEquations:{checked:false},
  t:en=>en,documentTextFeaturesAvailable:()=>true,
  structureHeadingRowSegments:line=>line.parts.map(p=>({text:line.text.slice(p.start,p.end),ratio:line.ratio,
    xStartRatio:p.xStartRatio,xEndRatio:p.xEndRatio})),
  document:{createElement:tag=>({tag,children:[],append(...c){this.children.push(...c)},addEventListener(){},textContent:''}),
    createDocumentFragment:()=>({children:[],append(...c){this.children.push(...c)}})}
};
vm.createContext(ctx);vm.runInContext(source,ctx);
async function search(query){await vm.runInContext('searchPdf',ctx)(query);return ctx.searchResults.items;}
(async()=>{
  // Before the patch the flattened baseline falsely reads "Boundary Cross".
  assert.equal((await search('Boundary Cross')).length,0,'opposite-column words are NOT one search occurrence');
  assert.equal((await search('Boundary important invariant')).length,1,'same-column phrases span adjacent lines');
  const fuzzy=vm.runInContext('fuzzySearchMatches',ctx)('The familiar eigenvalue perturbation lemma','eigenvalue pertubation');
  assert(fuzzy.length,'fuzzy matching must accept a single typo');
  assert.equal(fuzzy[0].matchText,'eigenvalue perturbation','use the real matched text, not the misspelled query');
  // The baseline silently presented an incomplete scan as a complete count.
  const originalLines=ctx.pageTextLines;
  ctx.pdfDoc={numPages:2};
  ctx.pageTextLines=async p=>{if(p===2)throw new Error('broken text layer');return lines;};
  const beforeError=ctx.console;
  ctx.console={...console,error() {}};
  await search('Boundary important invariant');
  assert.match(ctx.searchStatus.textContent,/1 page\(s\) unavailable/,
    'a text-layer failure must not be reported as an exhaustive search');
  ctx.console=beforeError;ctx.pageTextLines=originalLines;

  console.log('PASS: cross-column phantom suppressed, same-column phrase retained, fuzzy match target preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
