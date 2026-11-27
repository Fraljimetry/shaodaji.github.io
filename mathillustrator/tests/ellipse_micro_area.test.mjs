import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc, addPoint, append, createResolver, validateDoc} from '../src/model.mjs';
import {measureGeometry} from '../src/geometry_measurements.mjs';

test('small nondegenerate ellipse has positive measured area and updates with its reference points',()=>{
 const d=newDoc();
 const p=addPoint(d,[0,0]),q=addPoint(d,[1e-7,1e-7]);
 const ellipse=append(d,{type:'ellipse',refs:[p.id,q.id]});
 validateDoc(d);
 let area=measureGeometry(ellipse,createResolver(d));
 assert.equal(area.kind,'area');
 assert.ok(area.value!==null && Math.abs(area.value-Math.PI*1e-14/4)<1e-26,JSON.stringify(area));
 q.xy=[1e-7,0];
 assert.equal(measureGeometry(ellipse,createResolver(d)).value,null);
 q.xy=[2e-7,1e-7];
 area=measureGeometry(ellipse,createResolver(d));
 assert.ok(area.value!==null && Math.abs(area.value-Math.PI*2e-14/4)<1e-26,JSON.stringify(area));
});
