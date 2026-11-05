#!/usr/bin/env node
// Compile supplied postprocessed/formula OCR output; no OCR model is inferred or run.
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const args=process.argv.slice(2);
const arg=key=>args[args.indexOf(key)+1];
if(!args.includes('--source')||!args.includes('--input')){console.error('Missing --source or --input');process.exit(2)}
const src=fs.readFileSync(arg('--source'),'utf8');
const fixture=JSON.parse(fs.readFileSync(arg('--input'),'utf8'));
const names=['normalizeOcrLatex','repairOcrLatex','repairLatexInnerTags','repairLatexSpecialCharacters','repairOcrMisplacedAlignmentTabs','stabilizeOcrLatexSyntax'];
const pieces=names.map(name=>{
 const start=src.indexOf(`function ${name}(`);
 if(start<0)throw Error('Runtime normalizer not found: '+name);
 const end=src.indexOf('\nfunction ',start+1);
 return src.slice(start,end<0?src.length:end);
});
const context=vm.createContext({});
vm.runInContext(pieces.join('\n'),context,{timeout:10000});
// No fallback to fake compilation. Missing MathJax is a surfaced dependency.
const {mathjax}=require('mathjax-full/js/mathjax.js');
const {TeX}=require('mathjax-full/js/input/tex.js');
const {SVG}=require('mathjax-full/js/output/svg.js');
const {liteAdaptor}=require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler}=require('mathjax-full/js/handlers/html.js');
const {AllPackages}=require('mathjax-full/js/input/tex/AllPackages.js');
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const document=mathjax.document('',{InputJax:new TeX({packages:AllPackages}),OutputJax:new SVG({fontCache:'none'})});
const out={schema:1,cases:[]};
for(const item of fixture.cases||[]){
 const normalized=vm.runInContext(`stabilizeOcrLatexSyntax(repairOcrLatex(${JSON.stringify(item.latex)}))`,context);
 let compiled=false,error='';
 try{const html=adaptor.outerHTML(document.convert(normalized,{display:true}));
   compiled=!/(?:mjx-merror|<merror|data-mjx-error)/.test(html);
   if(!compiled)error='MathJax returned an merror element';
 }catch(e){error=String(e.message)}
 out.cases.push({id:item.id||'',sha256:item.sha256,page:item.page,provenance:item.provenance,
   raw_latex:item.latex,processed_latex:normalized,changed:normalized!==item.latex,
   mathjax_compiled:compiled,compilation_error:error,semantic_accuracy:'UNVERIFIED unless independently source-checked'});
}
console.log(JSON.stringify(out));
