import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {importTikzCd,exportTikzCd,canExportTikzCd} from '../src/diagram.mjs';

function diagram(labels,arrows=[]){
 const d=newDoc();const nodes=labels.map(([text,x,y])=>append(d,{type:'node',xy:[x,y],text,fontSize:17}));
 for(const [a,b,text,swap] of arrows)append(d,{type:'morphism',refs:[nodes[a].id,nodes[b].id],text,bend:0,swap:!!swap});
 return d;
}

test('literal TeX escaped ampersand does not create extra tikz-cd cells',()=>{
 const src=String.raw`\begin{tikzcd} A \& B \arrow[r,"f"] & C \end{tikzcd}`;
 const d=importTikzCd(src);
 assert.deepEqual(d.objects.filter(o=>o.type==='node').map(o=>o.text),[String.raw`A \& B`,'C']);
 assert.equal(d.objects.filter(o=>o.type==='morphism').length,1);
});

test('tikz-cd refuses semantic corruption on export and supports escaped literal ampersands',()=>{
 const good=diagram([[String.raw`A \& B`,0,0],['C',3,0]],[[0,1,'f',false]]);
 const out=exportTikzCd(good);const imported=importTikzCd(out);
 assert.equal(imported.objects.filter(o=>o.type==='node').length,2);
 assert.equal(imported.objects.find(o=>o.type==='node').text,String.raw`A \& B`);
 assert.equal(imported.objects.filter(o=>o.type==='morphism').length,1);
 for(const label of ['A & B',String.raw`A \arrow[r]`,String.raw`\begin{matrix} A & B \end{matrix}`]){
  const bad=diagram([[label,0,0],['B',3,0]]);
  assert.equal(canExportTikzCd(bad),false,`Unexpected enabled export for ${label}`);
  assert.throws(()=>exportTikzCd(bad),/not round-trip safe|not supported|semantic|malformed|invalid|ambiguous/i);
 }
});

test('escaped TeX characters and multiple arrows remain stable in supported round trip',()=>{
 const d=diagram([[String.raw`X_{\alpha}`,0,0],[String.raw`Y \& Z`,3,0],['W',3,-2]],[[0,1,String.raw`f_{\beta}`,false],[1,2,'g',true]]);
 const output=exportTikzCd(d);const imported=validateDoc(importTikzCd(output));
 assert.deepEqual(imported.objects.filter(o=>o.type==='node').map(o=>o.text),[String.raw`X_{\alpha}`,String.raw`Y \& Z`,'W']);
 assert.deepEqual(imported.objects.filter(o=>o.type==='morphism').map(o=>[o.text,o.swap]),[[String.raw`f_{\beta}`,false],['g',true]]);
});

test('point-radius per-object customization remains compatible with old v1 documents',()=>{
 const d=newDoc();d.settings.pointSize=7;
 const a=append(d,{type:'point',name:'A',xy:[0,0]});
 const b=append(d,{type:'point',name:'B',xy:[1,1]});
 assert.equal(a.style.pointSize,7);
 b.style.pointSize=12;validateDoc(d);assert.equal(a.style.pointSize,7);
 const legacy=structuredClone(d);delete legacy.objects[0].style.pointSize;
 assert.equal(validateDoc(legacy).objects[0].style.pointSize,undefined);
 const broken=structuredClone(d);broken.objects[0].style.pointSize=0;
 assert.throws(()=>validateDoc(broken),/point size/);
 const other=structuredClone(d);other.objects[0].style.pointSize=101;
 assert.throws(()=>validateDoc(other),/point size/);
});
