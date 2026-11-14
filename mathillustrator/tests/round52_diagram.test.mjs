import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {smoothRoutePath} from '../src/diagram_routing.mjs';

test('Round 52 defaults for new morphisms; original styles of loaded documents remain untouched',()=>{
 const d=newDoc();const a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[3,0],text:'B'});
 const m=append(d,{type:'morphism',refs:[a.id,b.id],text:'f'});
 assert.equal(m.routing,'scene-crossings');assert.equal(m.style.width,1);assert.equal(m.labelDistance,10);assert.equal(m.labelAvoid,true);
 m.routing='avoid';m.labelDistance=17;m.style.width=2;
 assert.equal(validateDoc(d).objects.at(-1).routing,'avoid');
 assert.equal(validateDoc(d).objects.at(-1).style.width,2);
});
test('Round 52 automatic paths have curved corners, not sharp rectangular joints',()=>{
 assert.equal(smoothRoutePath([[0,0],[30,0],[30,30]]).includes('Q30.00 0.00'),true);
 assert.equal(smoothRoutePath([[0,0],[30,30]]),'M0.00 0.00L30.00 30.00');
 assert.equal(smoothRoutePath([[0,0],[0,0],[4,0]]).includes('NaN'),false);
 assert.equal(smoothRoutePath([[0,0],[Infinity,3]]),'');
});
