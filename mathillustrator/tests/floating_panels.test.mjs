import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFloatingPanel,fitFloatingPanel,FLOAT_PANEL_MIN_W,FLOAT_PANEL_MAX_W} from '../src/floating_panels.mjs';
test('R45 independent new and legacy panel defaults',()=>{
 const left=normalizeFloatingPanel(null,'left'),right=normalizeFloatingPanel(undefined,'right');
 assert.equal(left.mode,'docked');assert.equal(right.mode,'docked');assert.notEqual(left.x,right.x);
 assert.deepEqual(normalizeFloatingPanel({mode:'floating',x:310,y:180,width:440,height:540},'left'),{mode:'floating',x:310,y:180,width:440,height:540});
});
test('R45 rejects corrupt, out-of-range, nonfinite and foreign properties',()=>{
 for(const value of [null,[],false,'oops',1,{mode:'invalid',x:-1,y:null,width:'600',height:NaN},{mode:'floating',width:Infinity,height:1e40}]){
  const result=normalizeFloatingPanel(value);
  assert.ok(Number.isFinite(result.x)&&Number.isFinite(result.y));
  assert.ok(result.width>=FLOAT_PANEL_MIN_W&&result.width<=FLOAT_PANEL_MAX_W);
 }
 assert.equal(normalizeFloatingPanel({mode:'FLOATING'}).mode,'docked');
 assert.equal(normalizeFloatingPanel(Object.create({mode:'floating'})).mode,'docked');
});
test('R45 viewport clamping keeps header accessible, safe geometry and preferred values intact',()=>{
 const preferred=normalizeFloatingPanel({mode:'floating',x:9200,y:9500,width:700,height:800});
 const before={...preferred};
 for(const [vw,vh,toolbar]of [[1440,900,58],[701,470,100],[320,400,125],[200,150,70]]){
  const g=fitFloatingPanel(preferred,vw,vh,toolbar);
  assert.ok(g.x>=0&&g.y>=0&&g.x+g.width<=vw+2&&g.y+g.height<=vh+2,JSON.stringify([vw,vh,g]));
 }
 assert.deepEqual(preferred,before);
});
test('R45 separately normalized Objects/Tools never cross-mutate',()=>{
 const a={mode:'floating',x:420,y:200,width:400,height:470};
 const b={mode:'floating',x:850,y:140,width:360,height:590};
 const aCopy={...a},bCopy={...b};
 const left=fitFloatingPanel(a,1000,700,58,'left');const right=fitFloatingPanel(b,1000,700,58,'right');
 assert.notDeepEqual(left,right);assert.deepEqual(a,aCopy);assert.deepEqual(b,bCopy);
});
