import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,append,createResolver,validateDoc} from '../src/model.mjs';
import {generalCrossings} from '../src/geometry_round50.mjs';
function p(d,xy){return append(d,{type:'point',xy});}
test('Round 59: point versus infinite line does not depend on sampling span or argument order',()=>{
 const d=newDoc(),a=p(d,[0,0]),b=p(d,[1,0]),far=p(d,[10000,0]),off=p(d,[10000,1]);
 const line=append(d,{type:'line',refs:[a.id,b.id]});const r=createResolver(d);
 assert.deepEqual(generalCrossings(far,line,r),[[10000,0]]);
 assert.deepEqual(generalCrossings(line,far,r),[[10000,0]]);
 assert.deepEqual(generalCrossings(off,line,r),[]);
 const root=append(d,{type:'generalIntersection',refs:[line.id,far.id],rootIndex:0});
 assert.deepEqual(createResolver(d).at(root.id),[10000,0]);
 assert.doesNotThrow(()=>validateDoc(d));
});
test('Round 59: analytic point-circle incidence is independent of polygon sampling',()=>{
 const d=newDoc(),origin=p(d,[0,0]),rim=p(d,[5,0]),on=p(d,[3,4]),off=p(d,[3,4.001]);
 const circle=append(d,{type:'circle',refs:[origin.id,rim.id]});const r=createResolver(d);
 for(const samples of [3,7,160]){
  assert.deepEqual(generalCrossings(on,circle,r,samples),[[3,4]]);
  assert.deepEqual(generalCrossings(circle,on,r,samples),[[3,4]]);
  assert.deepEqual(generalCrossings(off,circle,r,samples),[]);
 }
});
test('Round 59: finite segment and ray endpoints are respected, regardless of point order',()=>{
 const d=newDoc(),a=p(d,[0,0]),b=p(d,[1,0]),past=p(d,[3,0]),behind=p(d,[-2,0]);
 const segment=append(d,{type:'segment',refs:[a.id,b.id]});
 const ray=append(d,{type:'ray',refs:[a.id,b.id]});const r=createResolver(d);
 assert.deepEqual(generalCrossings(past,segment,r),[]);
 assert.deepEqual(generalCrossings(past,ray,r),[[3,0]]);
 assert.deepEqual(generalCrossings(behind,ray,r),[]);
});
test('Round 59: morphism double arrowhead has a concise, non-semantic label',()=>{
 const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(app,/\['double-end','Double end'\]/);
 assert.doesNotMatch(app,/Double end \(epi\)/);
});
