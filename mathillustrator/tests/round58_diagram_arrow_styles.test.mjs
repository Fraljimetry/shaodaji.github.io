import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {exportTikzCd} from '../src/diagram.mjs';
import {readFileSync} from 'node:fs';
const line=['solid','dashed','dotted','double','wavy'];
const head=['none','end','start','both','double-end','hook','tail','harpoon'];
function sample(){const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[3,0],text:'B'});return {d,m:append(d,{type:'morphism',refs:[a.id,b.id],text:'f'})};}
test('Round 58: independent line patterns and eight arrowheads on morphisms and free curves',()=>{
 for(const l of line)for(const h of head){
  const {d,m}=sample();m.morphismLine=l;m.morphismHeads=h;
  const free=append(d,{type:'freehand',path:[[0,0],[1,2],[3,1]],closed:false});free.curveLine=l;free.curveHeads=h;
  const restored=validateDoc(JSON.parse(JSON.stringify(d)));
  assert.equal(restored.objects.find(o=>o.type==='morphism').morphismHeads,h);
  assert.equal(restored.objects.find(o=>o.type==='freehand').curveLine,l);
 }
});
test('Round 58: invalid style and cross-object leakage rejected',()=>{
 for(const [key,value] of [['morphismLine','nonsense'],['morphismHeads','crossed']]){
  const {d,m}=sample();m[key]=value;assert.throws(()=>validateDoc(d));
 }
 for(const [key,value] of [['curveHeads','crossed'],['curveLine','nonsense']]){
  const {d}=sample();append(d,{type:'freehand',path:[[0,0],[1,1]]})[key]=value;assert.throws(()=>validateDoc(d));
 }
 const {d}=sample();d.objects[0].morphismHeads='none';assert.throws(()=>validateDoc(d));
});
test('Round 58: TikZ-cd must not silently discard nonstandard arrows',()=>{
 const {d,m}=sample();m.morphismHeads='none';assert.match(exportTikzCd(d),/no head/);
 m.morphismHeads='end';m.morphismLine='double';assert.match(exportTikzCd(d),/Rightarrow/);
 m.morphismHeads='hook';assert.throws(()=>exportTikzCd(d),/not round-trip safe/i);
 m.morphismLine='solid';assert.match(exportTikzCd(d),/\\begin\{tikzcd\}/);
});
test('Round 58: morphism is arrowless-capable with no forced polygon tips',()=>{
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(app,/if\(mode==='none'\)return/);
 assert.match(app,/decoratedHeads\(item,path,appearance.heads/);
 assert.match(app,/o\.curveHeads\|\|\(o\.curveArrows\|\|'none'\)/);
});
