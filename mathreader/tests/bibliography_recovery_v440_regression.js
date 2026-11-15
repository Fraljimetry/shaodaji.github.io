'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const ctx=vm.createContext({console,document:{addEventListener(){}}});
vm.runInContext(source,ctx,{timeout:10000});
const body='J. F. Adams, Vector fields on spheres, Ann. of Math. (2) 75 (1962), 603-632.';
const anchor=(n,r)=>({number:n,label:`[${n}]`,page:9,ratio:r,title:body,citations:[]});
const specimen=(options={})=>({token:'[|]',digitText:'',bracketedSingleGlyph:true,body,page:9,ratio:.5,xStartRatio:.07,ocrSource:true,used:false,continuations:[],...options});
function check(candidate,shouldRecover,reason){
 const entries=[anchor(10,.4),anchor(12,.6)];
 const got=ctx.recoverSingleGapBibliographyCandidates(entries,[candidate]);
 assert.equal(got,shouldRecover?1:0,reason);
 assert.equal(entries.some(e=>e.label==='[11]'),Boolean(shouldRecover),reason+' (index)');
}
check(specimen(),true,'strong observed OCR key between exact neighbors');
check(specimen({ocrSource:false}),false,'native-text unknown bracket must not create bibliography key');
check(specimen({xStartRatio:.55}),false,'center-page bracket must not create bibliography key');
check(specimen({token:'[B]'}),false,'author key must not become a numeric bibliography key');
check(specimen({token:'[|]',page:8,ratio:.99}),false,'orphaned candidate on prior page must not be promoted');
check(specimen({digitText:'11',bracketedSingleGlyph:false,token:'{lj'}),true,'damaged OCR numeric key remains recoverable');
check(specimen({digitText:'11',bracketedSingleGlyph:false,token:'{lj',ocrSource:false}),false,'native damaged numeric key is not guessed');
check(specimen({digitText:'11',bracketedSingleGlyph:false,token:'{lj',xStartRatio:.44}),false,'interior OCR numeric key is not guessed');
check(specimen({digitText:'12',bracketedSingleGlyph:false}),false,'mismatched digits never create missing 11');
console.log('PASS 18 bibliography recovery assertions');
