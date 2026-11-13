import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutMorphismLabels} from '../src/morphism_label_layout.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
const place=(entries,rectangles=[],w=800,h=500)=>layoutMorphismLabels(entries,rectangles,w,h);
test('Cut23 manual morphism labels are reserved and never changed by automatic neighbors',()=>{
 const entries=[{id:'auto',x:240,y:180,text:'f',auto:true},{id:'manual',x:240,y:180,text:'g',auto:false}];
 const result=place(entries);
 assert.deepEqual([result.get('manual').x,result.get('manual').y],[240,180]);
 assert.equal(result.get('manual').status,'manual');
 assert.notDeepEqual([result.get('auto').x,result.get('auto').y],[240,180]);
 assert.equal(result.get('auto').status,'clear');
 assert.deepEqual([...place(entries).entries()],[...result.entries()]);
});
test('Cut23 visible diagram nodes are avoided without altering semantic source positions',()=>{
 const out=place([{id:'m1',x:300,y:200,text:'long label',auto:true}],
  [{left:250,right:350,top:160,bottom:225}],800,500).get('m1');
 assert.equal(out.status,'clear');assert.ok(out.dx!==0||out.dy!==0);
});
test('Cut23 no safe candidate is explicitly crowded and labels are NEVER hidden',()=>{
 const placed=place([{id:'m',x:200,y:200,text:'f',auto:true}],
  [{left:-500,right:900,top:-500,bottom:900}],400,400).get('m');
 assert.equal(placed.status,'crowded');assert.ok(Number.isFinite(placed.x)&&Number.isFinite(placed.y));
});
test('Cut23 label avoidance remains strict, optional, backward-compatible and morphism-only',()=>{
 const d=newDoc();const a=append(d,{type:'node',xy:[-2,0],text:'A',fontSize:17});
 const b=append(d,{type:'node',xy:[2,0],text:'B',fontSize:17});
 const m=append(d,{type:'morphism',refs:[a.id,b.id],text:'f',labelAvoid:true});
 assert.equal(validateDoc(d).objects.at(-1).labelAvoid,true);
 delete m.labelAvoid;assert.equal(validateDoc(d).objects.at(-1).labelAvoid,undefined);
 m.labelAvoid='auto';assert.throws(()=>validateDoc(d),/Invalid morphism label avoidance/);
 delete m.labelAvoid;a.labelAvoid=true;assert.throws(()=>validateDoc(d),/Invalid morphism label avoidance/);
});
