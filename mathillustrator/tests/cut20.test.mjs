import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutPointLabels,createLabelLayoutCache} from '../src/label_layout.mjs';
import {newDoc,validateDoc} from '../src/model.mjs';

test('Crowded on-screen labels are retained, deterministic and separated where space permits',()=>{
 const entries=Array.from({length:12},(_,i)=>({id:'o'+i,x:200+i%4*3,y:140+Math.floor(i/4)*3,text:'P'+i}));
 const a=layoutPointLabels(entries,800,400),b=layoutPointLabels(entries,800,400);
 assert.equal(a.size,12);assert.deepEqual([...a],[...b]);
 assert.ok(new Set([...a.values()].map(x=>`${x.x}:${x.y}`)).size>=4,'should not put every label at the same coordinate');
});
test('Avoid-overlap placement repositions text from a clipped right edge',()=>{
 const m=layoutPointLabels([{id:'a',x:298,y:100,text:'LongLabel'}],300,200);
 assert.equal(m.get('a').anchor,'end');
});
test('Layout work is bounded for thousands of coincident labels',()=>{
 const entries=Array.from({length:3000},(_,i)=>({id:'o'+i,x:200,y:200,text:'X'}));
 const t=performance.now(),m=layoutPointLabels(entries,500,500);
 assert.equal(m.size,3000);
 assert.ok(performance.now()-t<2500,'dense collision handling must not be quadratic');
});
test('Legacy JSON with no labelPlacement keeps original rendering preference',()=>{
 const legacy=newDoc();delete legacy.settings.labelPlacement;
 assert.equal(validateDoc(legacy).settings.labelPlacement,'standard');
});
test('Invalid labelPlacement is rejected rather than applying a fallback',()=>{
 const d=newDoc();d.settings.labelPlacement='invisible';assert.throws(()=>validateDoc(d),/label placement/i);
});

test('Settled-scene label layout cache is bounded and invalidated by caller keys',()=>{
 const c=createLabelLayoutCache(2);let runs=0;
 const make=()=>{runs++;return {runs};};
 assert.equal(c.get('rev1',make).runs,1);
 assert.equal(c.get('rev1',make).runs,1);
 assert.equal(c.get('rev2',make).runs,2);
 assert.equal(c.get('rev3',make).runs,3);
 assert.equal(c.stats().entries,2);
 assert.equal(c.get('rev1',make).runs,4,'evicted revision must be recalculated');
});
