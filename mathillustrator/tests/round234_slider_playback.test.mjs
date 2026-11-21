import test from 'node:test';
import assert from 'node:assert/strict';
import {createSlider,sliderPlaybackValue,validateAlgebra} from '../src/algebra.mjs';
import {newDoc,validateDoc} from '../src/model.mjs';

test('legacy slider documents and optional playback settings survive JSON',()=>{
 const doc=newDoc();const slider=createSlider(doc,'a',{min:0,max:10,step:.5,value:2});
 assert.equal(slider.playMode,'periodic');assert.equal(slider.playSpeed,1);
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(doc))),doc);
 delete slider.playMode;delete slider.playSpeed;
 assert.equal(validateDoc(doc).algebra.sliders[0].playMode,undefined);
 assert.equal(sliderPlaybackValue(slider,.2).value,4);
});
test('periodic, oscillatory, once modes match exact time-domain equations',()=>{
 const doc=newDoc();const s=createSlider(doc,'a',{min:0,max:10,step:.5,value:2});
 assert.equal(sliderPlaybackValue(s,0).value,2);
 assert.equal(sliderPlaybackValue(s,.25).value,4.5);
 assert.equal(sliderPlaybackValue(s,.8).value,0);
 s.playMode='oscillatory';
 assert.equal(sliderPlaybackValue(s,.8).value,10);
 assert.equal(sliderPlaybackValue(s,1).value,8);
 assert.equal(sliderPlaybackValue(s,1.8).value,0);
 s.playMode='once';
 assert.deepEqual(sliderPlaybackValue(s,1),{value:10,finished:true});
 assert.deepEqual(sliderPlaybackValue(s,0),{value:2,finished:false});
 s.playSpeed=2;
 assert.equal(sliderPlaybackValue(s,.2).value,6);
});
test('animation validation refuses corrupt modes or speeds, including imports',()=>{
 const doc=newDoc();createSlider(doc,'a');
 for(const invalid of [{playMode:'bounce'},{playSpeed:0},{playSpeed:-2},{playSpeed:11},{playSpeed:Infinity},{playSpeed:'fast'}]){
  const damaged=JSON.parse(JSON.stringify(doc));Object.assign(damaged.algebra.sliders[0],invalid);
  assert.throws(()=>validateAlgebra(damaged),/Invalid slider definition/);
 }
});
