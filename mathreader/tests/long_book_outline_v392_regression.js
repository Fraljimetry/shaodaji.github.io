// Native-page mock integration of the genuine detectOutlineFromTypography
// classifier and its TOC/structure cap. No production PDF or OCR engine.
'use strict';
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../js/40-outline-structure.js'),'utf8');
const data=new Map();
const row=(text,y,size=10,x=65)=>({str:text,transform:[size,0,0,size,x,y],width:Math.min(480,text.length*size*.46),fontName:'F1'});
for(let p=1;p<=25;p++) data.set(p,[row('Ordinary body text should not be a structural heading',500,10),row('The proof uses elliptic estimates and classical methods.',460,10)]);
data.set(1,[row('Monographs in Mathematics',740,12),row('Enrico Giusti',670,25),row('Minimal Surfaces',600,34)]);
data.set(2,[row('Table of Contents',770,24),row('Appendix A',700,12),row('Appendix B',660,12),row('Bibliography',620,12)]);
data.set(3,[row('1.1 Definition: Let Q be an open set',700,15),row('1.9 Theorem (Semicontinuity): Let Q be a set',640,15),row('Roughly speaking, Fleming\'s idea was the following.',570,15),row('Traces of BV Functions',490,23)]);
data.set(18,[row('The General Case',690,23),row('2.1 Theorem of Stokes',610,16),row('Some ordinary body text',550,10)]);
data.set(20,[row('Appendix A',720,23),row('1.13 Proposition: Suppose u is harmonic',650,15)]);
const c=vm.createContext({
 document:{addEventListener(){}},console,
 pdfDoc:{numPages:25},documentOcrActive:false,
 sourceDocumentUsesOcr(){return false},
 async nativePageTextData(_,n){return {page:{getViewport:()=>({width:600,height:850})},content:{items:data.get(n)}};},
 async *orderedPrefetch(items,reader){for(const item of items)yield {item,value:await reader(item)};},
 findFirstRowInYBuckets(){return null}, addRowToYBuckets(){},
 MAX_INFERRED_OUTLINE_ENTRIES:1200
});
vm.runInContext(src,c,{timeout:5000});
(async()=>{
 const result=await c.detectOutlineFromTypography();
 const titles=result.map(x=>x.title);
 function missing(title){assert.ok(!titles.includes(title),`must reject ${title}: ${JSON.stringify(titles)}`);}
 function exists(title){assert.ok(titles.includes(title),`must preserve ${title}: ${JSON.stringify(titles)}`);}
 missing('Monographs in Mathematics');missing('Enrico Giusti');missing('Minimal Surfaces');
 missing('Table of Contents');missing('Appendix B');missing('Bibliography');
 missing('1.1 Definition: Let Q be an open set');missing('1.9 Theorem (Semicontinuity): Let Q be a set');
 missing("Roughly speaking, Fleming's idea was the following.");
 exists('Traces of BV Functions');exists('The General Case');exists('2.1 Theorem of Stokes');exists('Appendix A');
 assert.equal(result.filter(x=>x.title==='Appendix A').length,1);
 assert.equal(result.find(x=>x.title==='Appendix A')?.page,20);
 console.log('PASS: 15 integrated long-book Structure/Contents/Results class assertions (synthetic native pages)');
})().catch(e=>{console.error(e);process.exitCode=1});
