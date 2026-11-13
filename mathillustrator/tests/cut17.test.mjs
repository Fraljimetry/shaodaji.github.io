import test from 'node:test';
import assert from 'node:assert/strict';
import {bboxOutsideViewport,circleOutsideViewport} from '../src/geometry.mjs';

test('Cut17: bounded offscreen segment can be rejected',()=>{
 assert.equal(bboxOutsideViewport([[-200,30],[-100,65]],800,600,20),true);
 assert.equal(bboxOutsideViewport([[1000,12],[1010,15]],800,600,20),true);
});
test('Cut17: crossing segments must not be culled despite both endpoints outside',()=>{
 assert.equal(bboxOutsideViewport([[-200,300],[1000,300]],800,600,20),false);
});
test('Cut17: conservative Bézier hull and large stroke margin',()=>{
 assert.equal(bboxOutsideViewport([[-200,0],[-140,30],[-120,10],[-180,40]],800,600,20),true);
 assert.equal(bboxOutsideViewport([[-40,100],[-35,100]],800,600,60),false);
});
test('Cut17: circle radius is included, not only center and radius anchor bbox',()=>{
 assert.equal(circleOutsideViewport([-120,300],140,800,600,0),false);
 assert.equal(circleOutsideViewport([-200,300],50,800,600,0),true);
});
test('Cut17: nonfinite/invalid visibility data must conservatively avoid disappearance',()=>{
 assert.equal(bboxOutsideViewport([[Infinity,0],[900,0]],800,600,12),false);
 assert.equal(bboxOutsideViewport([],800,600,12),false);
 assert.equal(circleOutsideViewport([NaN,5],20,800,600,10),false);
});
