import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,validateDoc,focalEllipse} from '../src/model.mjs';
import {normalizePropertiesLayout} from '../src/properties_layout.mjs';
import {smoothPath,closeFreehandStroke,smoothCurveSvg} from '../src/geometry.mjs';

test('Round22 new General defaults Ultra while saved older choices and object IDs are preserved',()=>{
 const doc=newDoc();assert.equal(doc.settings.correction,'ultra');
 doc.settings.correction='medium';assert.equal(validateDoc(structuredClone(doc)).settings.correction,'medium');
});
test('Round22 legacy floating preferences cannot resurrect detachable Properties',()=>{
 for(const mode of ['floating','docked','unknown',null]){
  const result=normalizePropertiesLayout({mode,collapsed:true,dockHeight:270});
  assert.equal(result.mode,'docked');assert.equal(result.collapsed,true);assert.equal(result.dockHeight,270);
 }
 assert.equal(normalizePropertiesLayout(null).mode,'docked');
});
test('Round22 closed freehand gap is curved and bounded; ultra is low-pass, finite, and retains endpoints',()=>{
 const raw=[[0,0],[2,0],[3,2],[0.05,0.05]],copy=structuredClone(raw);
 const joined=closeFreehandStroke(raw,'near',48);assert.equal(joined.joinStyle,'corner');
 const d=smoothCurveSvg(raw,joined.closed,joined.joinStyle);
 assert.match(d,/ C[^C]+ 0 0 Z$/);assert.ok(!d.includes(' L0 0 Z'));
 assert.deepEqual(raw,copy);
 const dense=Array.from({length:400},(_,i)=>[i/30,Math.sin(i/4)/20]);
 const fine=smoothPath(dense,'ultra',50);
 assert.ok(fine.length<400);assert.deepEqual(fine[0],dense[0]);assert.deepEqual(fine.at(-1),dense.at(-1));
 assert.ok(fine.every(p=>p.length===2&&p.every(Number.isFinite)));
 assert.deepEqual(smoothPath([[0,0],[0,0],[0,0]],'ultra',50),[[0,0],[0,0],[0,0]]);
});
test('Round22 focal ellipse remains valid with near but genuinely distinct foci; rejects collinear third',()=>{
 assert.ok(focalEllipse([[0,0],[0.15,0],[0.2,1]]));
 assert.equal(focalEllipse([[0,0],[2,0],[1,0]]),null);
});
