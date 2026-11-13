import test from 'node:test';
import assert from 'node:assert/strict';
import {labelDragOffset,routeDiagramEdge} from '../src/diagram_routing.mjs';

test('Cut22 label drag is bounded and quantized without modifying the source offset',()=>{
 assert.deepEqual(labelDragOffset(10,-20,[100,200],[135,155]),[45,-65]);
 assert.deepEqual(labelDragOffset(295,-298,[100,100],[130,0]),[300,-300]);
 assert.deepEqual(labelDragOffset(2.25,5.25,[4,5],[4,5]),[2.25,5.25]);
 assert.deepEqual(labelDragOffset(2.25,5.25,[4,5],[5,5]),[2.25,5.25]);
 assert.equal(labelDragOffset(NaN,0,[0,0],[1,2]),null);
 assert.equal(labelDragOffset(0,0,[0,0],[Infinity,2]),null);
});
test('Cut22 dragging a label never changes the routed arrow itself',()=>{
 const box={width:60,height:40},block={left:180,right:220,top:85,bottom:145};
 const before=routeDiagramEdge([80,110],[320,110],box,box,[block],'avoid');
 const offsets=labelDragOffset(0,0,[30,35],[140,55]);
 const after=routeDiagramEdge([80,110],[320,110],box,box,[block],'avoid');
 assert.deepEqual(before,after);assert.deepEqual(offsets,[110,20]);
});
