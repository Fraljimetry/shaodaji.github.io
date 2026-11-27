import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,append} from '../src/model.mjs';
import {exportTikzCd,importTikzCd,canExportTikzCd} from '../src/diagram.mjs';
const fixture=new URL('./fixtures/round196_complex_diagram.json',import.meta.url);
test('Round 196: dense 33-object canvas exports spacious grid and imports without losing arrows',()=>{
 const doc=JSON.parse(readFileSync(fixture,'utf8'));
 const tex=exportTikzCd(doc);
 assert.match(tex,/\\begin\{tikzcd\}\[column sep=100\.8pt, row sep=69\.12pt\]/);
 assert.match(tex,/"f"\{pos=0\.5, inner sep=2pt\}/);
 const roundtrip=importTikzCd(tex);
 assert.equal(roundtrip.objects.length,doc.objects.length);
 assert.equal(roundtrip.objects.filter(o=>o.type==='morphism').length,21);
});
test('Round 196: label placement follows saved T and manual X/Y offsets',()=>{
 const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[3.5,0],text:'B'});
 append(d,{type:'morphism',refs:[a.id,b.id],text:'f',labelT:.35,labelDx:12,labelDy:-6,swap:true});
 const tex=exportTikzCd(d);
 assert.match(tex,/"f"'\{pos=0\.35, inner sep=2pt, xshift=7\.2pt, yshift=3\.6pt\}/);
 const recovered=importTikzCd(tex).objects.find(x=>x.type==='morphism');
 assert.equal(recovered.labelT,.35);assert.ok(Math.abs(recovered.labelDx-12)<1e-9);assert.ok(Math.abs(recovered.labelDy+6)<1e-9);
});
test('Round 196: restricted importer rejects arbitrary TeX options',()=>{
 for(const raw of [
  '\\begin{tikzcd}[execute at begin picture=\\evil] A & B \\end{tikzcd}',
  '\\begin{tikzcd}[column sep=10pt, column sep=40pt] A & B \\end{tikzcd}',
  '\\begin{tikzcd} A \\arrow[r, "f"{pos=2}] & B \\end{tikzcd}',
  '\\begin{tikzcd} A \\arrow[r, "f"{execute=\\evil}] & B \\end{tikzcd}'
 ])assert.throws(()=>importTikzCd(raw));
});
test('Round 196: irregular intervals use median and remain semantic round-trip safe',()=>{
 const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[2,0],text:'B'}),c=append(d,{type:'node',xy:[6,0],text:'C'});
 append(d,{type:'morphism',refs:[a.id,c.id],text:'h'});
 const tex=exportTikzCd(d);assert.match(tex,/column sep=115\.2pt/);assert.equal(canExportTikzCd(d),true);
});

test('semantic round-trip uses exported grid spacing rather than default cell dimensions',()=>{
 for(const [dx,dy] of [[.5,.5],[1,1],[8,6],[20,20]]){
  const d=newDoc(),a=append(d,{type:'node',xy:[0,dy],text:'A'}),b=append(d,{type:'node',xy:[dx,dy],text:'B'}),c=append(d,{type:'node',xy:[dx,0],text:'C'});
  append(d,{type:'morphism',refs:[a.id,b.id],text:'f'});
  append(d,{type:'morphism',refs:[b.id,c.id],text:'g'});
  const tex=exportTikzCd(d),back=importTikzCd(tex);
  const nodes=back.objects.filter(o=>o.type==='node');
  assert.equal(nodes.length,3);assert.equal(back.objects.filter(o=>o.type==='morphism').length,2);
  assert.equal(canExportTikzCd(d),true);
  assert.ok(Math.abs(nodes[1].xy[0]-Math.max(12,Math.min(360,dx*28.8))/28.8)<1e-10);
 }
});
