import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {labelOnPolyline,labelOnQuadratic} from '../src/diagram_routing.mjs';
import {layoutMorphismLabels} from '../src/morphism_label_layout.mjs';
const curves=()=>{const doc=newDoc();append(doc,{type:'freehand',path:[[-2,-1],[-1,1],[0,0],[2,1]],closed:false});return doc;};
test('Round44 nine independent freehand combinations survive JSON and schema validation',()=>{
 for(const line of ['solid','dashed','dotted'])for(const arrows of ['none','end','both']){
  const doc=curves(),stroke=doc.objects[0];stroke.curveLine=line;stroke.curveArrows=arrows;
  const clone=validateDoc(JSON.parse(JSON.stringify(doc)));
  assert.equal(clone.objects[0].curveLine,line);assert.equal(clone.objects[0].curveArrows,arrows);
 }
 const legacy=validateDoc(curves());assert.equal(legacy.objects[0].curveLine,undefined);assert.equal(legacy.objects[0].curveArrows,undefined);
});
test('Round44 invalid freehand attributes are rejected without weakening other object types',()=>{
 for(const [key,bad] of [['curveLine','stripes'],['curveLine',null],['curveArrows','start'],['curveArrows',false]]){
  const project=curves();project.objects[0][key]=bad;assert.throws(()=>validateDoc(project),/free curve/i);
 }
 const doc=newDoc();append(doc,{type:'point',xy:[0,0]});doc.objects[0].curveArrows='end';assert.throws(()=>validateDoc(doc));
});
test('Round44 auto-placement respects swapped side even when arrow/diagram obstacles crowd original anchor',()=>{
 for(const direction of [[1,0],[0,1],[.6,.8]]){
  const normal=[-direction[1],direction[0]],anchor=[200,200];
  for(const swap of [false,true]){
   const side=swap?normal.map(v=>-v):normal;
   const base=[anchor[0]+side[0]*17,anchor[1]+side[1]*17];
   const obstacles=[{left:base[0]-18,right:base[0]+18,top:base[1]-10,bottom:base[1]+10}];
   const result=layoutMorphismLabels([{id:'m',text:'\\varphi',x:base[0],y:base[1],auto:true,sideNormal:side}],obstacles,500,500).get('m');
   assert.ok(result);
   const outward=(result.x-anchor[0])*side[0]+(result.y-anchor[1])*side[1];
   assert.ok(outward>=16.99,`Label crossed chosen side: ${outward}`);
  }
 }
});
test('Round44 routing labels are directly mirrored without moving their positions along edge',()=>{
 const path=[[10,10],[100,10],[100,100]],t=.65;
 const first=labelOnPolyline(path,t,20,false),swapped=labelOnPolyline(path,t,20,true),on=labelOnPolyline(path,t,0,false);
 assert.deepEqual(first.map((v,i)=>+(v+swapped[i]-2*on[i]).toFixed(9)),[0,0]);
 const a=[10,30],c=[70,90],b=[130,30];
 const f=labelOnQuadratic(a,c,b,.3,25,false),s=labelOnQuadratic(a,c,b,.3,25,true),mid=labelOnQuadratic(a,c,b,.3,0,false);
 assert.ok(Math.hypot(...f.map((v,i)=>v+s[i]-2*mid[i]))<1e-9);
});
