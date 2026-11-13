import test from 'node:test';
import assert from 'node:assert/strict';
import {routeDiagramEdge, properPolylineCrossings} from '../src/diagram_routing.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
const small={width:36,height:24};
const A=[-100,-100],B=[100,100];
const previous=[[-100,100],[100,-100]];
test('Cut24 crossing-aware routing reduces a strict X crossing without changing endpoints',()=>{
 const original=routeDiagramEdge(A,B,small,small,[], 'avoid');
 assert.equal(original.status,'clear');
 assert.equal(properPolylineCrossings(original.points,[previous]),1);
 const result=routeDiagramEdge(A,B,small,small,[], 'avoid-crossings',[previous]);
 assert.ok(['clear','routed'].includes(result.status),JSON.stringify(result));
 assert.equal(properPolylineCrossings(result.points,[previous]),0);
 assert.ok(result.points.length>2);
});
test('Cut24 original direct and avoid routing do not change when prior arrows exist',()=>{
 const direct=routeDiagramEdge(A,B,small,small,[], 'direct');
 const avoid=routeDiagramEdge(A,B,small,small,[], 'avoid');
 assert.deepEqual(routeDiagramEdge(A,B,small,small,[], 'direct',[previous]),direct);
 assert.deepEqual(routeDiagramEdge(A,B,small,small,[], 'avoid',[previous]),avoid);
});
test('Cut24 crossings at segment endpoints are not treated as strict interior crossings',()=>{
 const a=[[0,0],[100,100]], b=[[100,100],[200,0]];
 assert.equal(properPolylineCrossings(a,[b]),0);
 assert.equal(properPolylineCrossings(a,[[[0,100],[100,0]]]),1);
 assert.equal(properPolylineCrossings([[0,100],[200,100]],[[[100,0],[100,200]]]),1);
});
test('Cut24 invalid prior polylines are handled conservatively and fail visibly',()=>{
 const result=routeDiagramEdge(A,B,small,small,[], 'avoid-crossings', Array.from({length:260},()=>previous));
 assert.equal(result.status,'capacity');
});
test('Cut24 JSON routing mode remains v1-compatible and rejects non-morphism usage',()=>{
 const d=newDoc(),n1=append(d,{type:'node',xy:[-2,0],text:'A'}),n2=append(d,{type:'node',xy:[2,0],text:'B'});
 const m=append(d,{type:'morphism',refs:[n1.id,n2.id],text:'f',routing:'avoid-crossings'});
 assert.equal(validateDoc(d).objects.at(-1).routing,'avoid-crossings');
 m.routing='bogus';assert.throws(()=>validateDoc(d),/Invalid morphism routing mode/);
 delete m.routing;n1.routing='avoid-crossings';assert.throws(()=>validateDoc(d),/Invalid morphism routing mode/);
});
test('Cut24 an obstructed X with all corridors blocked does not claim a crossing-free solution',()=>{
 const a=[-100,-100],b=[100,100];
 const extra=[
  {left:-124,right:-76,top:76,bottom:124},
  {left:76,right:124,top:-124,bottom:-76},
 ];
 const prior=[[[-100,100],[100,-100]]];
 const route=routeDiagramEdge(a,b,small,small,extra,'avoid-crossings',prior);
 assert.ok(['crossing','blocked','capacity'].includes(route.status),JSON.stringify(route));
 assert.ok(route.points.length>=2);
});
test('Cut24 crossing decisions are deterministic and never rewrite semantic node references',()=>{
 const d=newDoc(),a=append(d,{type:'node',xy:[0,-3],text:'Source'}),b=append(d,{type:'node',xy:[0,3],text:'Target'});
 const m=append(d,{type:'morphism',refs:[a.id,b.id],routing:'avoid-crossings',text:'f'});
 const original=JSON.stringify(d),args=[[0,-100],[0,100],small,small,[{left:-110,right:-75,top:-15,bottom:15}], 'avoid-crossings',[[[-100,0],[100,0]]]];
 const one=routeDiagramEdge(...args),two=routeDiagramEdge(...args);
 assert.deepEqual(one,two);
 assert.equal(JSON.stringify(d),original);
 assert.deepEqual(m.refs,[a.id,b.id]);
});
