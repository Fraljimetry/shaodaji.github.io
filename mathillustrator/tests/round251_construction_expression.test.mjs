import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,validateDoc,clone} from '../src/model.mjs';
import {constructionExpression,applyConstructionExpression} from '../src/construction_expression.mjs';
function fixture(){const d=newDoc();for(const expression of ['A = (0, 0)','B = (3, 1)','C = (1, 4)','Segment(A, B)'])command(d,expression);return d;}
test('referenced name updates without corrupting object ID or geometry',()=>{
 const d=fixture(),segment=d.objects.find(o=>o.type==='segment'),id=segment.id,oldRefs=[...segment.refs];
 assert.match(constructionExpression(d,segment),/Segment\(A, B\)$/);
 d.objects.find(o=>o.name==='B').name='Beta';
 assert.match(constructionExpression(d,segment),/Segment\(A, Beta\)$/);
 assert.deepEqual(segment.refs,oldRefs);
 applyConstructionExpression(d,id,`${segment.name} = Segment(A, C)`);
 assert.equal(segment.id,id);assert.equal(d.objects.find(o=>o.id===segment.refs[1]).name,'C');validateDoc(d);
});
test('point coordinates are editable without breaking identity',()=>{
 const d=fixture(),point=d.objects.find(o=>o.name==='A'),id=point.id;
 applyConstructionExpression(d,id,'A = (1+2, 4)');
 assert.deepEqual(point.xy,[3,4]);assert.equal(point.id,id);validateDoc(d);
});
test('invalid command and type changes fail without mutation',()=>{
 const d=fixture(),segment=d.objects.find(o=>o.type==='segment'),before=clone(segment);
 assert.throws(()=>applyConstructionExpression(d,segment.id,`${segment.name} = Circle(A, B)`),/not segment/);
 assert.deepEqual(segment,before);
 assert.throws(()=>applyConstructionExpression(d,segment.id,`${segment.name} = Segment(A, Z)`));
 assert.deepEqual(segment,before);
});
test('formula representation remains stable across serialization',()=>{
 const d=fixture(),o=d.objects.find(x=>x.type==='segment');
 const expression=constructionExpression(d,o);const restored=validateDoc(clone(d));
 assert.equal(constructionExpression(restored,restored.objects.find(x=>x.id===o.id)),expression);
});
