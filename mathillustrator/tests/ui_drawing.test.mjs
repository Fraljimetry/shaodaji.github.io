import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {smoothCurveSvg,smoothPath} from '../src/geometry.mjs';
import {canExportTikzCd} from '../src/diagram.mjs';

test('default project enables general toolkit and open free curves',()=>{
 const doc=newDoc();assert.deepEqual(doc.settings.modules,{basic:true,construction:true,illustration:true,diagram:true});
 assert.equal(doc.settings.freehandClose,'open');assert.deepEqual(validateDoc(doc),doc);
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
