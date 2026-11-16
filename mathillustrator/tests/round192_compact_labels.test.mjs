import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutMorphismLabels,strokeObstacleRectangles} from '../src/morphism_label_layout.mjs';

test('Round192: own morphism stroke does not push its label away',()=>{
 const stroke=strokeObstacleRectangles([[30,110],[350,110]],5).map(b=>({...b,owner:'arrowA'}));
 const entry={id:'arrowA',text:'f',x:190,y:100,auto:true,sideNormal:[0,-1]};
 const placed=layoutMorphismLabels([entry],stroke,400,250).get('arrowA');
 assert.equal(Math.hypot(placed.dx,placed.dy),0);
 assert.equal(placed.status,'clear');
});

test('Round192: unrelated arrows and nodes remain obstacles',()=>{
 const stroke=strokeObstacleRectangles([[30,100],[350,100]],5).map(b=>({...b,owner:'differentArrow'}));
 const entry={id:'arrowA',text:'f',x:190,y:100,auto:true,sideNormal:[0,-1]};
 const placed=layoutMorphismLabels([entry],stroke,400,250).get('arrowA');
 assert.ok(placed.dy!==0||placed.status==='crowded');
});

test('Round192: crowded label stays close to its morphism rather than escaping 72px',()=>{
 const blocker={left:115,right:285,top:90,bottom:115};
 const placed=layoutMorphismLabels([{id:'a',text:'f',x:200,y:100,auto:true,sideNormal:[0,-1]}],[blocker],400,250).get('a');
 assert.ok(Math.hypot(placed.dx,placed.dy)<=25,JSON.stringify(placed));
});
