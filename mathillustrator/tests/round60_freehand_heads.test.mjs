import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('Round 60: free curve selector offers four basic modes while morphisms retain all choices',()=>{
 assert.match(app,/FREE_CURVE_HEAD_CHOICES=HEAD_CHOICES\.slice\(0,4\)/);
 assert.match(app,/buildChoice\('Arrowheads',[^\n]+FREE_CURVE_HEAD_CHOICES/);
 assert.match(app,/morphChoice\('Arrowheads',visibleArrowheads\(appearance\.line,appearance\.heads\)/);
});
test('Round 60: end cap compensated and double-line heads enlarged; morphism kept unchanged',()=>{
 assert.match(app,/const advance=!latex&&vlen>1e-5/);
 assert.match(app,/lineStyle==='double'\?Math\.max\(width,3\.5\):width/);
 assert.match(app,/decoratedHeads\(item,path,visibleArrowheads\(pattern,heads\),o\.style\.stroke,o\.style\.width,false,pattern\)/);
});
test('Round 60: imported historical curve arrowheads remain schema-compatible',()=>{
 for(const choice of ['double-end','hook','tail','harpoon']){
  const d=newDoc();const obj=append(d,{type:'freehand',path:[[0,0],[1,1]]});obj.curveHeads=choice;
  assert.equal(validateDoc(JSON.parse(JSON.stringify(d))).objects.find(x=>x.type==='freehand').curveHeads,choice);
 }
});
