#!/usr/bin/env node
// Executes selected source-level parser functions, NOT assembled browser indexes.
'use strict';
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const vm = require('node:vm');
const args = process.argv.slice(2);
const arg = key => args[args.indexOf(key)+1];
if (!args.includes('--source') || !args.includes('--input')) {
  console.error('Usage: node detector_proxy.js --source js/41-equations-bibliography.js --input instructions.json');
  process.exit(2);
}
const source = fs.readFileSync(arg('--source'),'utf8');
const manifest = JSON.parse(fs.readFileSync(arg('--input'),'utf8'));
const ctx = vm.createContext({document:{addEventListener(){}},console});
vm.runInContext("let equationNumberingSide='right'; const EQUATION_TAG_SYMBOL_CLASS='*∗⋆★☆†‡※◇◆○●◦•△▲▽▼□■♢♦⊙⊗⊕⊖⊥∥';", ctx);
vm.runInContext(source,ctx,{timeout:30000});
let cacheHits=0;
let executed=0;
for(const spec of manifest.instructions){
  if(fs.existsSync(spec.cache)) {
    const old = JSON.parse(fs.readFileSync(spec.cache,'utf8'));
    if(old.schema===1 && old.sha256===spec.sha256 && old.completed===true) {
      // A cache hit is measured here; don't overwrite persistent record.
      cacheHits++;
      continue;
    }
  }
  const lines = zlib.gunzipSync(fs.readFileSync(spec.geometry)).toString('utf8').trim().split('\n');
  const report = {schema:1,sha256:spec.sha256,completed:true,source_level_only:true,
    pages_scanned:0,lines_scanned:0,result_count:0,equation_raw_line_count:0,
    bibliography_heading_count:0,error_count:0, examples:{results:[],equations:[],bibliography:[],errors:[]}};
  const push = (key,item) => {if(report.examples[key].length<20)report.examples[key].push(item)};
  for(const raw of lines){
    const page=JSON.parse(raw);const ls=page.lines || [];
    report.pages_scanned++;report.lines_scanned+=ls.length;
    let isIndexPage=false;
    try{isIndexPage=ctx.structureResultsIndexNavigationPage(ls)}catch(e){
      report.error_count++;push('errors',{page:page.page,reason:'index: '+e.message})}
    for(let i=0;i<ls.length;i++){
      const row=ls[i];
      try{
        if(!isIndexPage){const r=ctx.detectedStructureResult(ls,i,page.page);
          if(r){report.result_count++;push('results',{page:page.page,label:r.label,line:row.text.slice(0,120)})}}
      }catch(e){report.error_count++;push('errors',{page:page.page,reason:'result: '+e.message})}
      try{const matches=ctx.equationLabelCandidatesInLine(row.text);
        if(matches?.length){report.equation_raw_line_count++;
          push('equations',{page:page.page,candidates:matches.slice(0,4).map(m=>m.label),line:row.text.slice(0,120)})}}
      catch(e){report.error_count++;push('errors',{page:page.page,reason:'equation: '+e.message})}
      try{if(ctx.bibliographyHeadingText(row.text)){
        report.bibliography_heading_count++;push('bibliography',{page:page.page,line:row.text.slice(0,120)})}}
      catch(e){report.error_count++;push('errors',{page:page.page,reason:'bibliography: '+e.message})}
    }
  }
  fs.mkdirSync(require('node:path').dirname(spec.cache),{recursive:true});
  fs.writeFileSync(spec.cache,JSON.stringify(report));
  executed++;
}
console.log(`executed=${executed} cached=${cacheHits}`);
