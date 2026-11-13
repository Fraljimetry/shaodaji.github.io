import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestFreehandAttachment,closeFreehandStroke} from '../src/geometry.mjs';
const resolver={
 at:id=>({a:[0,0],b:[2,0],p:[1,1]})[id],
 points:o=>o.refs?.map(id=>resolver.at(id))??[]
};
const style={opacity:1};
const segment={id:'s',type:'segment',refs:['a','b'],style};
const circle={id:'c',type:'circle',refs:['a','p'],style};
const pt={id:'p',type:'point',style};
const snap=(point,objects,scale=50)=>nearestFreehandAttachment(point,objects,resolver,scale);

test('Round18: magnetic endpoints project to nearby segments without mutating the inputs',()=>{
 const objects=[segment],point=[1,.2],before=structuredClone(objects);
 const found=snap(point,objects);
 assert.equal(found?.id,'s');assert.deepEqual(found?.world,[1,0]);assert.ok(found.distancePx<16);
 assert.deepEqual(objects,before);assert.deepEqual(point,[1,.2]);
 assert.equal(snap([1,.34],objects),null);
 assert.ok(snap([1,.25],objects));
 assert.equal(snap([1,.25],objects,200),null);
});
test('Round18: point priority, hidden/transparent objects and malformed inputs',()=>{
 assert.deepEqual(snap([1.01,1.02],[pt])?.world,[1,1]);
 assert.equal(snap([1,0],[{...segment,hidden:true}]),null);
 assert.equal(snap([1,0],[{...segment,style:{opacity:0}}]),null);
 assert.equal(snap([NaN,0],[segment]),null);
 assert.equal(snap([1,0],[segment],-1),null);
 assert.equal(snap([1,0],[{id:'broken',type:'segment',refs:['none','b']}]),null);
});
test('Round18: circle, curved Bézier, ellipse, polygon and old freehand geometry',()=>{
 const c=snap([1.04,1.05],[circle]);assert.equal(c?.id,'c');
 assert.ok(Math.abs(Math.hypot(...c.world)-Math.sqrt(2))<1e-9);
 const curve={id:'b',type:'bezier',refs:['a','p','p','b'],style};
 assert.equal(snap([1,.75],[curve])?.id,'b');
 const ellipse={id:'e',type:'ellipse',refs:['a','b'],style};
 assert.equal(snap([1,0],[ellipse])?.id,'e');
 const polygon={id:'g',type:'polygon',refs:['a','b','p'],style};
 assert.equal(snap([1.04,.01],[polygon])?.id,'g');
 const free={id:'f',type:'freehand',path:[[0,0],[0,2]],style};
 assert.deepEqual(snap([.12,1],[free])?.world,[0,1]);
});
test('Round18: original closed-stroke tangent/corner logic and old always values remain readable',()=>{
 const p=[[0,0],[1,0],[1,1],[.05,.05]];
 assert.equal(closeFreehandStroke(p,'near',48).closed,true);
 assert.equal(closeFreehandStroke(p,'always',48).closed,true);
 assert.equal(closeFreehandStroke(p,'open',48).closed,false);
});
