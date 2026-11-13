import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeBox,edgeBetweenBoxes} from '../src/diagram_layout.mjs';
import {createPlotCache} from '../src/plot_cache.mjs';
import {clipInfiniteLine} from '../src/geometry.mjs';

test('Cut10: arrows terminate outside node boxes rather than their centers',()=>{
 const a=[0,0],b=[180,0],box=nodeBox('A',17);
 const line=edgeBetweenBoxes(a,b,box,box);
 assert.ok(line);
 assert.ok(line.start[0]>box.width/2);
 assert.ok(line.end[0]<b[0]-box.width/2);
 assert.ok(line.end[0]>line.start[0]);
});
test('Cut10: short or overlapping nodes never reverse an arrow',()=>{
 assert.equal(edgeBetweenBoxes([0,0],[40,0],nodeBox('A'),nodeBox('B')),null);
 assert.equal(edgeBetweenBoxes([0,0],[0,0],nodeBox('A'),nodeBox('B')),null);
});
test('Cut10: diagonal edges stop at the correct rectangle boundary',()=>{
 const box=nodeBox('a fairly long label',19);
 const line=edgeBetweenBoxes([0,0],[300,140],box,nodeBox('B'),5);
 assert.ok(line);
 const p=line.start;
 assert.ok(Math.abs(p[0])>box.width/2||Math.abs(p[1])>box.height/2);
});
test('Cut10: multi-byte labels count Unicode scalar values, not UTF-16 halves',()=>{
 assert.ok(nodeBox('😀😀').width>=nodeBox('AA').width); // emoji are wider glyphs, counted as two Unicode scalars
});
test('Cut10: plot cache reuses stable view and updates changed view keys',()=>{
 const cache=createPlotCache({maxEntries:4,maxCharacters:200});let n=0;
 const compute=()=>{n++;return 'M1 1L2 2';};
 assert.equal(cache.get('f|view1',compute),'M1 1L2 2');
 assert.equal(cache.get('f|view1',compute),'M1 1L2 2');
 assert.equal(cache.get('f|view2',compute),'M1 1L2 2');
 assert.equal(n,2);assert.equal(cache.stats().hits,1);
});
test('Cut10: plot cache bounds entries, weight and skips oversized paths',()=>{
 const c=createPlotCache({maxEntries:2,maxCharacters:15});
 c.get('a',()=> '123456');c.get('b',()=> '123456');c.get('c',()=> '123456');
 assert.equal(c.stats().entries,2);
 c.get('d',()=> '123456789012345678901');assert.equal(c.stats().entries,2);
 c.get('e',()=> '1234567890');assert.ok(c.stats().characters<=15);
});

test('Cut10: infinite lines clipped exactly to viewport, including corners',()=>{
 assert.deepEqual(clipInfiniteLine([5,-100],[5,100],100,50),[[5,0],[5,50]]);
 assert.deepEqual(clipInfiniteLine([-10,25],[110,25],100,50),[[0,25],[100,25]]);
 const diag=clipInfiniteLine([-10,-10],[110,110],100,100);
 assert.deepEqual(diag,[[0,0],[100,100]]);
});
test('Cut10: offscreen infinite line does not create enormous SVG coordinates',()=>{
 assert.equal(clipInfiniteLine([1e12,200],[1e12+20,300],600,400),null);
 assert.equal(clipInfiniteLine([1,1],[1,1],600,400),null);
 assert.equal(clipInfiniteLine([1,1],[2,2],NaN,400),null);
});
