import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {smoothCurveSvg,smoothPath} from '../src/geometry.mjs';
import {canExportTikzCd} from '../src/diagram.mjs';

test('default project enables general toolkit and nearby-endpoint joining',()=>{
 const doc=newDoc();assert.deepEqual(doc.settings.modules,{basic:true,construction:true,illustration:true,diagram:true});
 assert.equal(doc.settings.freehandClose,'near');assert.deepEqual(validateDoc(doc),doc);
});
test('freehand cubic representation is deterministic and preserves boundaries',()=>{
 const input=[[0,0],[1,2],[2,1],[3,0]];
 const open=smoothCurveSvg(input),closed=smoothCurveSvg(input,true);
 assert.ok(open.startsWith('M0 0 C'));assert.ok(open.endsWith('3 0'));assert.ok(!open.includes('NaN'));
 assert.ok(closed.endsWith(' Z'));assert.equal(smoothCurveSvg(input),open);
 assert.equal(smoothCurveSvg([[0,0],[2,2]]),'M0 0 L2 2');
 assert.equal(smoothCurveSvg([[0,0],[Number.NaN,2],[2,2]]),'M0 0 L2 2');
 assert.ok(smoothPath(input,'ultra').length>input.length);
});
test('node borders, morphism arrow styles and freehand closure validate exactly',()=>{
 const doc=newDoc(),a=append(doc,{type:'node',xy:[0,0],text:'A'}),b=append(doc,{type:'node',xy:[2,0],text:'B'});
 const morph=append(doc,{type:'morphism',refs:[a.id,b.id],text:'f',arrowStyle:'hook-dashed'});
 const curve=append(doc,{type:'freehand',path:[[0,0],[1,1]],closed:true});a.nodeBorder=true;
 assert.deepEqual(validateDoc(doc),doc);
 assert.equal(canExportTikzCd(doc),false,'styled arrows cannot be silently flattened by the exporter');
 morph.arrowStyle='not-a-style';assert.throws(()=>validateDoc(doc),/arrow style/);morph.arrowStyle='hook-dashed';
 curve.closed='yes';assert.throws(()=>validateDoc(doc),/closure flag/);curve.closed=true;
 a.nodeBorder='true';assert.throws(()=>validateDoc(doc),/node border/);
});
test('legacy project loads with validated freehand default without modifying object identity',()=>{
 const doc=newDoc();delete doc.settings.freehandClose;
 const a=append(doc,{type:'node',xy:[0,0],text:'A'});
 assert.equal(validateDoc(doc).settings.freehandClose,'open');assert.equal(a.nodeBorder,undefined);
 doc.settings.freehandClose='invalid';assert.throws(()=>validateDoc(doc),/free curve closure/);
});


test('Ultra-smooth suppresses pointer jitter in screen space without moving endpoints',()=>{
 const raw=Array.from({length:301},(_,i)=>[i*.025,Math.sin(i*Math.PI*.72)*.09]);
 const original=structuredClone(raw),ultra=smoothPath(raw,'ultra',48);
 const rms=pts=>Math.sqrt(pts.reduce((sum,p)=>sum+p[1]**2,0)/pts.length);
 assert.ok(rms(ultra)<rms(raw)*.22,'Gaussian smoothing must actually remove tremor, not merely round it');
 assert.deepEqual(ultra[0],raw[0]);assert.deepEqual(ultra.at(-1),raw.at(-1));
 assert.deepEqual(raw,original,'never mutate raw capture or stored history');
 assert.ok(ultra.every(p=>p.length===2&&p.every(Number.isFinite)));
 assert.ok(!/NaN|Infinity/.test(smoothCurveSvg(ultra)));
 assert.equal(smoothPath(raw,'off',48),raw,'exact-pointer mode remains unmodified');
});

test('Ultra-smooth bounded resampling, degenerate inputs and zoom consistency',()=>{
 const same=[[1,2],[1,2],[1,2]];
 assert.deepEqual(smoothPath(same,'ultra',48),same);
 const bad=[[0,0],[1,2],[Infinity,0]];
 assert.equal(smoothPath(bad,'ultra',48),bad,'fail closed on invalid paths');
 const raw=Array.from({length:300},(_,i)=>[i*.03,Math.sin(i*.45)*.08]);
 const first=smoothPath(raw,'ultra',25).map(p=>p.map(c=>c*2));
 const doubled=smoothPath(raw.map(p=>p.map(c=>c*2)),'ultra',12.5).map(p=>p.map(c=>c*1));
 assert.equal(first.length,doubled.length,'same screen-space arc length gives same sample count');
 const long=Array.from({length:10000},(_,i)=>[i/12,Math.sin(i*.82)]);
 const result=smoothPath(long,'ultra',1000);
 assert.ok(result.length<=4096&&result.length>=3);
 assert.deepEqual(result[0],long[0]);assert.deepEqual(result.at(-1),long.at(-1));
 assert.ok(result.every(p=>p.every(Number.isFinite)));
 assert.equal(smoothPath([[0,0],[1,1]],'ultra',50).length,2);
});
