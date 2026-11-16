import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append} from '../src/model.mjs';
import {importTikzCd,exportTikzCd,canExportTikzCd} from '../src/diagram.mjs';

function screenshotDiagram(){
 const doc=newDoc();
 const a=append(doc,{type:'node',xy:[0,2.4],text:'A'});
 const b=append(doc,{type:'node',xy:[0,0],text:'B'});
 const c=append(doc,{type:'node',xy:[3.5,0],text:'C'});
 const d=append(doc,{type:'node',xy:[3.5,2.4],text:'D'});
 append(doc,{type:'morphism',refs:[a.id,b.id],text:'\\alpha',morphismLine:'dashed',morphismHeads:'hook'});
 append(doc,{type:'morphism',refs:[b.id,c.id],text:'\\beta'});
 append(doc,{type:'morphism',refs:[b.id,d.id],text:'\\gamma'});
 append(doc,{type:'morphism',refs:[a.id,c.id],text:'\\theta',bend:-2.5});
 return doc;
}
test('Round 187: pictured commutative diagram exports with preserved curved arrow and hook',()=>{
 const doc=screenshotDiagram();assert.equal(canExportTikzCd(doc),true);
 const tex=exportTikzCd(doc);assert.match(tex,/hook, dashed/);assert.match(tex,/bend left=37\.50000000/);
 const recovered=importTikzCd(tex);assert.equal(recovered.objects.filter(x=>x.type==='node').length,4);
 const edges=recovered.objects.filter(x=>x.type==='morphism');assert.equal(edges.length,4);
 assert.equal(edges.find(x=>x.text==='\\theta').bend,-2.5);
 assert.equal(edges.find(x=>x.text==='\\alpha').morphismHeads,'hook');
});
test('Round 187: every visible morphism head and shaft combination has a safe tikz-cd mapping',()=>{
 for(const line of ['solid','dashed','dotted','double','wavy'])for(const head of ['none','end','start','both','double-end','hook','tail','harpoon']){
  const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[3.5,0],text:'B'});
  const m=append(d,{type:'morphism',refs:[a.id,b.id],text:'f',morphismLine:line,morphismHeads:head});
  for(const bend of [-5,-0.125,0,0.125,5]){
   m.bend=bend;const tex=exportTikzCd(d);const back=importTikzCd(tex).objects.find(x=>x.type==='morphism');
   assert.equal(back.morphismLine,line,`${line}/${head}/${bend}`);
   assert.equal(back.morphismHeads,['double','wavy'].includes(line)&&['double-end','hook','tail','harpoon'].includes(head)?'none':head,`${line}/${head}/${bend}`);
   assert.ok(Math.abs(back.bend-bend)<1e-7,`${line}/${head}/${bend}`);
   if(line==='double' && head==='none')assert.match(tex,/equal/);
  }
 }
});
test('Round 187: bend grammar rejects duplicates, excessive angles, and arbitrary TikZ commands',()=>{
 for(const option of ['bend left=90','bend right=-5','bend left, bend right','bend left=NaN','out=30','bend right=0']){
  assert.throws(()=>importTikzCd(`\\begin{tikzcd} A \\arrow[r, ${option}] & B \\end{tikzcd}`),undefined,option);
 }
});
