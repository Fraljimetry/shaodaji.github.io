import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,position,get,command,remove,validateDoc,parseExpression,snapPoint,clone} from '../src/model.mjs';

test('creates and roundtrips a valid empty document',()=>{const d=newDoc();assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(d))),d);});
test('names/commands and live midpoint dependencies',()=>{const d=newDoc();command(d,'A = (0, 0)');command(d,'B = (4, 2)');const m=command(d,'Midpoint(A,B)');assert.deepEqual(position(d,m.id),[2,1]);get(d,'o1').xy=[8,6];assert.deepEqual(position(d,m.id),[6,4]);validateDoc(d);});
test('live segment and circle refs stay linked to moved points',()=>{const d=newDoc();const a=command(d,'A=(1,2)'),b=command(d,'B=(3,4)');const segment=command(d,'Segment(A,B)'),circle=command(d,'Circle(A,B)');assert.deepEqual(segment.refs,[a.id,b.id]);assert.deepEqual(circle.refs,[a.id,b.id]);a.xy=[5,6];assert.deepEqual(segment.refs.map(id=>position(d,id)),[[5,6],[3,4]]);validateDoc(d);});
test('invalid command does not create a partial object',()=>{const d=newDoc();assert.throws(()=>command(d,'Segment(Missing,A)'),/Unknown point/);assert.equal(d.objects.length,0);});
test('parser supports standard math and right associativity',()=>{assert.ok(Math.abs(parseExpression('sin(pi/2) + x^2')(3)-10)<1e-10);assert.equal(parseExpression('2^3^2')(0),512);assert.equal(parseExpression('-2^2')(0),-4);});
test('parser refuses scripts/unknown syntax',()=>{for(const s of ['Math.sin(x)','x;alert(1)','x || 1','unknown(x)','x**2','x)'])assert.throws(()=>parseExpression(s));});
test('snap is tunable / off preserves precision',()=>{const d=newDoc();assert.deepEqual(snapPoint([.27,1.24],d.settings),[.27,1.24]);d.settings.snap=true;assert.deepEqual(snapPoint([.27,1.24],d.settings),[.5,1]);d.settings.snap=false;assert.deepEqual(snapPoint([.27,1.24],d.settings),[.27,1.24]);});
test('deletion removes transitive dependents without dangling refs',()=>{const d=newDoc();const a=command(d,'A=(0,0)'),b=command(d,'B=(1,0)');const m=command(d,'Midpoint(A,B)');const s=command(d,'Segment(A,B)');command(d,`Arrow(${m.name},B)`);assert.equal(remove(d,a.id),4);assert.deepEqual(d.objects.map(x=>x.name),['B']);validateDoc(d);});
test('import rejects cycles and dangling refs',()=>{const d=newDoc();command(d,'A=(0,0)');command(d,'B=(1,0)');const a=command(d,'Midpoint(A,B)');const cyc=clone(d);cyc.objects[0].type='midpoint';cyc.objects[0].refs=[a.id,cyc.objects[1].id];delete cyc.objects[0].xy;assert.throws(()=>validateDoc(cyc),/Cyclic/);const dangling=clone(d);dangling.objects[2].refs=['unknown','o2'];assert.throws(()=>validateDoc(dangling),/Dangling/);});
test('import rejects injected colors, malformed file and duplicate object names',()=>{const d=newDoc();command(d,'A=(0,0)');const evil=clone(d);evil.objects[0].style.stroke='url(https://example.invalid/evil.svg)';assert.throws(()=>validateDoc(evil),/color/);const duplicate=clone(d);duplicate.objects.push({...duplicate.objects[0],id:'o2'});duplicate.nextId=3;assert.throws(()=>validateDoc(duplicate),/Duplicate/);assert.throws(()=>validateDoc({version:1,objects:[]}),/supported/);});
test('function grammar and invalid coordinate protections',()=>{const d=newDoc();command(d,'f(x)=cos(x/2)+sqrt(abs(x))');assert.ok(Number.isFinite(parseExpression('cos(x/2)+sqrt(abs(x))')(1)));assert.throws(()=>command(d,'Q=(Infinity,3)'),/Unsupported/);const evil=clone(d);evil.objects[0].expr='while(true){}';assert.throws(()=>validateDoc(evil));});
test('object count/ids stay stable after explicit cloning',()=>{const d=newDoc();const a=addPoint(d,[1,2]);const b=append(d,{type:'text',xy:[3,4],text:'A_{1}',fontSize:18});assert.deepEqual([a.id,b.id],['o1','o2']);assert.equal(validateDoc(clone(d)).objects.length,2);});

test('import requires canonical string object IDs without coercion',()=>{const d=newDoc();addPoint(d,[1,2]);for(const id of [['o1'],[['o1']],{},1,null,true,'o01','o9007199254740992']){const bad=clone(d);bad.objects[0].id=id;assert.throws(()=>validateDoc(bad),/object ID|Object ID/);}assert.equal(validateDoc(d).objects[0].id,'o1');});

import {createSlider} from '../src/algebra.mjs';
import {add3DPlot} from '../src/plot3d.mjs';
test('project colors require canonical string values across 2D, 3D and sliders',()=>{
 const d=newDoc();addPoint(d,[1,2]);add3DPlot(d.scene3d,'surface3d',['x+y']);createSlider(d,'a');
 const fields=[x=>x.objects[0].style,x=>x.objects[0].style,x=>x.settings,x=>x.settings,x=>x.settings,x=>x.scene3d.plots[0],x=>x.algebra.sliders[0]];
 const keys=['stroke','fill','background','stroke','fill','color','color'];
 for(let i=0;i<fields.length;i++){
  for(const value of [['#123456'],[['#123456']],{},123456,null,true,'#12345','red']){
   const bad=clone(d);fields[i](bad)[keys[i]]=value;
   assert.throws(()=>validateDoc(bad),/color|Invalid 3D plot|Invalid slider definition/,`${i}: ${JSON.stringify(value)}`);
  }
  const good=clone(d);fields[i](good)[keys[i]]='#aBcD12';
  assert.equal(fields[i](validateDoc(JSON.parse(JSON.stringify(good))))[keys[i]],'#aBcD12');
 }
});

// An optional algebra section may be absent, but when present it must be usable.
test('project import rejects malformed algebra containers before subsequent slider edits',async()=>{
 const {createSlider,validSliderName}=await import('../src/algebra.mjs');
 for(const algebra of [null,{},[],5,'bad',{sliders:null},{sliders:{}}]){
  const d={...newDoc(),algebra};assert.throws(()=>validateDoc(d),/Invalid algebra section/);
 }
 for(const name of [null,[],['a'],{},1,true])assert.equal(validSliderName(name),false);
 for(const d of [newDoc(),{...newDoc(),algebra:{sliders:[]}}]){
  const imported=validateDoc(JSON.parse(JSON.stringify(d)));createSlider(imported,'a');
  assert.equal(validateDoc(imported).algebra.sliders[0].name,'a');
 }
});
