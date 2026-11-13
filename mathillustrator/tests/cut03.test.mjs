import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,command,clone,validateDoc,checkNewGeometry} from '../src/model.mjs';
import {sampleExplicitPlot,plotPath} from '../src/plot.mjs';

test('v1 export options migrate without changing older JSON projects',()=>{
 const old=newDoc();delete old.settings.exportGuides;delete old.settings.exportScale;
 const recovered=validateDoc(old);
 assert.equal(recovered.settings.exportGuides,false);
 assert.equal(recovered.settings.exportScale,2);
 assert.equal(old.settings.exportGuides,undefined);
 assert.equal(old.settings.exportScale,undefined);
});
test('export settings reject malformed null, noninteger, excessively large values',()=>{
 for(const value of [null,'2',0,2.5,5,Infinity]){
  const d=newDoc();d.settings.exportScale=value;assert.throws(()=>validateDoc(d),/export guides or raster scale/);
 }
 for(const value of [null,'false',0]){const d=newDoc();d.settings.exportGuides=value;assert.throws(()=>validateDoc(d),/export guides or raster scale/);}
});
test('new geometry rejects collapsed construction without advancing IDs or mutating scene',()=>{
 const d=newDoc();command(d,'A=(0,0)');command(d,'B=(3,0)');const before=JSON.stringify(d);
 for(const src of ['Segment(A,A)','Line(A,A)','Circle(A,A)','Arrow(A,A)']){assert.throws(()=>command(d,src),/distinct/);assert.equal(JSON.stringify(d),before);}
 assert.throws(()=>checkNewGeometry('rectangle',[[0,0],[0,3]]),/width/);
 assert.throws(()=>checkNewGeometry('angle',[[0,0],[0,0],[1,2]]),/rays/);
 assert.ok(command(d,'Ellipse(A,B)')); // Legacy flattened ellipses remain constructible in v1.
});
test('import still accepts historical degenerate ellipse; too-large IDs fail safely',()=>{
 const d=newDoc(),a=addPoint(d,[0,0]),b=addPoint(d,[3,0]);append(d,{type:'ellipse',refs:[a.id,b.id]});
 assert.equal(validateDoc(d).objects.length,3);
 const invalid=clone(d);invalid.objects[0].id='o99999999999999999999999';invalid.objects[2].refs[0]=invalid.objects[0].id;
 assert.throws(()=>validateDoc(invalid),/safe integer/);
});
test('adaptive plot smooth, bounded and represents a linear function exactly',()=>{
 const out=sampleExplicitPlot(x=>2*x+1,px=>px/10,y=>y,1000,400);
 assert.ok(out.segments.length>=1);
 assert.ok(out.evaluations<10000);
 assert.ok(out.segments.every(s=>s.every(p=>p.every(Number.isFinite))));
 assert.match(plotPath(out.segments),/^M0\.00 1\.00 L/);
});
test('explicit pole at x=0 is represented as separated segments, never joined across gap',()=>{
 const out=sampleExplicitPlot(x=>1/x,px=>(px-500)/75,y=>200-y*75,1000,600);
 assert.ok(out.breaks>0);
 assert.ok(out.segments.length>=2);
 const crossing=out.segments.some(s=>s.some((p,i)=>i>0&&s[i-1][0]<500&&p[0]>500));
 assert.equal(crossing,false);
 assert.ok(out.evaluations<100000);
});
test('unsafe function sampling is bounded on exception or overflow',()=>{
 const a=sampleExplicitPlot(()=>{throw Error('domain');},px=>px,y=>y,1200,500);
 assert.equal(a.segments.length,0);assert.ok(a.evaluations<100000);
 const b=sampleExplicitPlot(x=>Math.exp(x*100),px=>px/20,y=>y,400,300);
 assert.ok(b.evaluations<100000);
 assert.ok(b.segments.every(seg=>seg.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y))));
});

test('tikz-cd refuses duplicate arrow labels instead of silently discarding first',async()=>{
 const {importTikzCd}=await import('../src/diagram.mjs');
 assert.throws(()=>importTikzCd(String.raw`\begin{tikzcd} A \arrow[r, "first", "second"] & B \end{tikzcd}`),/multiple labels/);
});
