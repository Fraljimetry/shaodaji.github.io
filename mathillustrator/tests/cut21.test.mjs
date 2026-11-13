import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {boxRect,segmentHitsBox,routeDiagramEdge,labelOnPolyline,labelOnQuadratic,pathData} from '../src/diagram_routing.mjs';
const box={width:70,height:40};
const obstacle=boxRect([300,200],{width:100,height:100});
test('Cut21 route directly only if no intervening visible node',()=>{
 const a=[100,200],b=[500,200];
 assert.equal(routeDiagramEdge(a,b,box,box,[], 'avoid').status,'clear');
 const direct=routeDiagramEdge(a,b,box,box,[obstacle],'direct');
 assert.equal(direct.status,'direct');
 assert.ok(segmentHitsBox(...direct.points,obstacle));
 const route=routeDiagramEdge(a,b,box,box,[obstacle],'avoid');
 assert.equal(route.status,'routed');assert.ok(route.points.length>=3);
 for(let i=1;i<route.points.length;i++)assert.equal(segmentHitsBox(route.points[i-1],route.points[i],obstacle),false);
 assert.match(pathData(route.points),/^M.* L/);
});
test('Cut21 segment-box intersection handles tangencies, point and axis alignment',()=>{
 const b={left:10,right:20,top:10,bottom:20};
 assert.equal(segmentHitsBox([0,15],[30,15],b),true);
 assert.equal(segmentHitsBox([0,10],[30,10],b),true);
 assert.equal(segmentHitsBox([0,9.9],[30,9.9],b),false);
 assert.equal(segmentHitsBox([15,5],[15,25],b),true);
 assert.equal(segmentHitsBox([0,5],[0,25],b),false);
 assert.equal(segmentHitsBox([11,11],[11,11],b),true);
});
test('Cut21 route respects endpoint clearance and multiple blockers',()=>{
 const nodes=[boxRect([200,200],{width:30,height:50}),boxRect([300,200],{width:40,height:60}),boxRect([400,200],{width:30,height:40})];
 const route=routeDiagramEdge([100,200],[500,200],box,box,nodes,'avoid');
 assert.equal(route.status,'routed');
 for(let i=1;i<route.points.length;i++)for(const n of nodes)assert.equal(segmentHitsBox(route.points[i-1],route.points[i],{left:n.left-10,right:n.right+10,top:n.top-10,bottom:n.bottom+10}),false);
});
test('Cut21 overlapping source/target nodes stay semantic and do not fabricate a route',()=>{
 const route=routeDiagramEdge([100,100],[110,100],box,box,[], 'avoid');
 assert.equal(route.status,'overlap');assert.deepEqual(route.points,[]);
});
test('Cut21 label position follows tangent with author offsets',()=>{
 assert.deepEqual(labelOnQuadratic([0,0],[50,0],[100,0],.5,17,false,4,-2),[54,15]);
 assert.deepEqual(labelOnQuadratic([0,0],[50,0],[100,0],.5,17,true),[50,-17]);
 const p=labelOnPolyline([[0,0],[0,40],[100,40]],.5,17,false,4,0);
 assert.ok(Math.abs(p[0]-34)<1e-5&&Math.abs(p[1]-57)<1e-5,p);
});
test('Cut21 morphism fields validate strictly without changing v1 compatibility',()=>{
 const d=newDoc(),a=append(d,{type:'node',xy:[0,0],text:'A',fontSize:17}),b=append(d,{type:'node',xy:[3,0],text:'B',fontSize:17});
 const m=append(d,{type:'morphism',refs:[a.id,b.id],text:'f',bend:0});
 assert.equal(validateDoc(d).version,1);
 Object.assign(m,{routing:'avoid',labelT:.25,labelDistance:38,labelDx:10,labelDy:-12});
 assert.equal(validateDoc(d).objects.at(-1).labelDx,10);
 for(const [key,value] of [['routing','some-other-mode'],['labelT',0],['labelT',1],['labelDistance',201],['labelDx',301],['labelDy',Number.NaN]]){
  const trial=structuredClone(d);trial.objects.at(-1)[key]=value;
  assert.throws(()=>validateDoc(trial),/Invalid morphism/);
 }
 const illegal=structuredClone(d);illegal.objects[0].routing='avoid';assert.throws(()=>validateDoc(illegal),/Invalid morphism/);
});

test('Cut21 unsolved obstacle maze signals blockage without falsely claiming a clear route',()=>{
 const surrounding=[[300,200,100,100],[100,100,80,100],[100,300,80,100],[40,200,70,70],[180,200,70,70]]
   .map(([x,y,width,height])=>boxRect([x,y],{width,height}));
 const route=routeDiagramEdge([100,200],[500,200],box,box,surrounding,'avoid');
 assert.equal(route.status,'blocked');
 assert.equal(route.points.length,2,'keep a clearly marked dashed direct path, not an invented safe detour');
});
