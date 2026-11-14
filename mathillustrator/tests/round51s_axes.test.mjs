import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,get,addPoint,append,createResolver,geometricLine,validateDoc,clone,affected} from '../src/model.mjs';
const close=(p,q)=>assert.ok(p&&p.length===2&&Math.hypot(p[0]-q[0],p[1]-q[1])<1e-8,`${p} ≠ ${q}`);
test('R51S axes: fixed reusable lines with no document objects',()=>{
 const d=newDoc(),r=createResolver(d);
 assert.equal(d.objects.length,0);assert.equal(get(d,'axis-x').locked,true);
 assert.ok(geometricLine(get(d,'axis-y'),r));
 assert.equal(r.line('axis-x').domain,'infinite');close(r.line('axis-x').a,[0,0]);
 assert.deepEqual(r.line('axis-y').d,[0,1]);assert.equal(d.objects.length,0);
});
test('R51S axes: point on axis, intersections, foot, save and live updates',()=>{
 const d=newDoc();const a=addPoint(d,[2,-4]);const b=addPoint(d,[2,4]);
 const vertical=append(d,{type:'line',refs:[a.id,b.id]});
 const on=append(d,{type:'pointOnObject',refs:['axis-x'],parameter:.7});
 const xinter=append(d,{type:'intersection',refs:[vertical.id,'axis-x']});
 const origin=append(d,{type:'intersection',refs:['axis-x','axis-y']});
 const foot=append(d,{type:'perpendicularFoot',refs:[a.id,'axis-x']});
 const r=createResolver(d);close(r.at(on.id),[6,0]);close(r.at(xinter.id),[2,0]);close(r.at(origin.id),[0,0]);close(r.at(foot.id),[2,0]);
 assert.ok(affected(d,a.id).has(xinter.id));assert.equal(d.objects.length,7);
 assert.doesNotThrow(()=>validateDoc(clone(d)));
 const loaded=validateDoc(JSON.parse(JSON.stringify(d)));
 loaded.objects.find(o=>o.id===a.id).xy=[3,-4];loaded.objects.find(o=>o.id===b.id).xy=[3,4];
 close(createResolver(loaded).at(xinter.id),[3,0]);close(createResolver(loaded).at(origin.id),[0,0]);
 loaded.settings.showAxes=false;assert.doesNotThrow(()=>validateDoc(loaded));
});
test('R51S axes: reject axis IDs as point refs or editable imported objects',()=>{
 const d=newDoc();append(d,{type:'segment',refs:['axis-x','axis-y']});assert.throws(()=>validateDoc(d),/Invalid reference target/);
 const x=newDoc();x.objects.push({id:'axis-x',type:'line',name:'fake axis',hidden:false,locked:false,style:{stroke:'#000000',fill:'#000000',width:2,opacity:1},refs:[]});
 assert.throws(()=>validateDoc(x),/Invalid or repeated object/);
});
