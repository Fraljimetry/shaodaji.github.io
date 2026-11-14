import test from 'node:test';
import assert from 'node:assert/strict';
import {append,newDoc,validateDoc,clone,addPoint} from '../src/model.mjs';
import {layoutMorphismLabels,strokeObstacleRectangles} from '../src/morphism_label_layout.mjs';

test('Round 30: all new on-canvas text formats default to LaTeX, legacy explicit and absent modes survive',()=>{
 const d=newDoc();const a=append(d,{type:'node',xy:[0,0],text:'A'}),b=append(d,{type:'node',xy:[4,0],text:'B'});
 const label=append(d,{type:'text',xy:[1,1],text:String.raw`\alpha`});
 const edge=append(d,{type:'morphism',refs:[a.id,b.id],text:'f'});
 const plain=append(d,{type:'text',xy:[3,3],text:'Old label',textMode:'plain'});
 const point=addPoint(d,[0,2]),geo=append(d,{type:'circle',refs:[point.id,addPoint(d,[2,2]).id]});
 for(const e of [a,b,label,edge])assert.equal(e.textMode,'latex');
 assert.equal(edge.labelAvoid,true);assert.equal(plain.textMode,'plain');
 assert.equal(point.pointLabelMode,'latex');assert.equal(geo.displayLabelMode,'latex');
 const legacy=clone(d);delete legacy.objects[0].textMode;delete legacy.objects[3].labelAvoid;
 const imported=validateDoc(legacy);assert.equal(imported.objects[0].textMode,undefined);
 assert.equal(imported.objects[3].labelAvoid,undefined); // old JSON is not silently migrated
 assert.deepEqual(validateDoc(d),d);
});

test('Round 30: rendered stroke obstacles are thin local boxes, not diagonal full bounding boxes',()=>{
 const boxes=strokeObstacleRectangles([[0,0],[220,220]],4);
 assert.ok(boxes.length>=10);
 assert.ok(boxes.every(b=>b.right-b.left<36&&b.bottom-b.top<36));
 assert.ok(boxes.some(b=>b.left<110&&b.right>100));
 assert.deepEqual(strokeObstacleRectangles([[0,0],[Infinity,10]]),[]);
 assert.ok(strokeObstacleRectangles([[0,0],[100000,0]],4,32).length<=32);
});

test('Round 30: auto labels avoid crossing arrow strokes and occupied node text without mutating inputs',()=>{
 const stroke=strokeObstacleRectangles([[0,110],[300,110]],5);
 const node={left:88,right:130,top:78,bottom:104};
 const entries=[{id:'one',text:'f',x:110,y:105,auto:true},{id:'two',text:'g',x:110,y:105,auto:true}];
 const original=structuredClone(entries);
 const result=layoutMorphismLabels(entries,[node,...stroke],300,220);
 const one=result.get('one'),two=result.get('two');
 assert.equal(one.status,'clear');assert.equal(two.status,'clear');
 assert.notEqual(one.y,two.y);
 assert.notDeepEqual([one.x,one.y],[110,105]);
 assert.deepEqual(entries,original);
});

test('Round 30: impossible dense collision remains explicit rather than false-clear',()=>{
 const occupied=[{left:0,right:300,top:0,bottom:200}];
 const found=layoutMorphismLabels([{id:'crowded',text:'x',x:120,y:120,auto:true}],occupied,300,200);
 assert.equal(found.get('crowded').status,'crowded');
});
