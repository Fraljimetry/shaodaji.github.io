import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutMorphismLabels} from '../src/morphism_label_layout.mjs';

const solve=(entry,rectangles=[])=>layoutMorphismLabels([{
 id:'m',text:'f',x:180,y:100,distance:10,auto:true,...entry
}],rectangles,400,250).get('m');

test('Round193: horizontal downward label gains real glyph clearance',()=>{
 const p=solve({sideNormal:[0,1]});
 assert.ok(p.dy>=12 && p.dy<=20,JSON.stringify(p));
 assert.equal(p.status,'clear');
});
test('Round193: horizontal upward label gains only required clearance',()=>{
 const p=solve({sideNormal:[0,-1]});
 assert.ok(p.dy<=-3 && p.dy>=-15,JSON.stringify(p));
});
test('Round193: vertical normal accommodates actual text width',()=>{
 const p=solve({sideNormal:[1,0],text:'\\alpha'});
 assert.ok(p.dx>=25 && p.dx<=65,JSON.stringify(p));
});
test('Round193: manual positions are preserved precisely',()=>{
 const p=solve({auto:false,sideNormal:[0,1]});
 assert.deepEqual([p.dx,p.dy,p.status],[0,0,'manual']);
});
test('Round193: collision avoidance never pushes label back into own arrow',()=>{
 const p=solve({sideNormal:[0,1]},[{left:165,right:195,top:115,bottom:140}]);
 assert.ok(p.dy>=12,JSON.stringify(p));
});
test('Round193: short default distance maintains a visible difference when automatic placement enabled',()=>{
 const p=solve({sideNormal:[0,1],distance:10});
 assert.ok(Math.hypot(p.dx,p.dy)>=10,JSON.stringify(p));
});
