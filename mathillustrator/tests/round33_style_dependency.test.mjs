import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PRESETS,newDoc,addPoint,append,command,createResolver,validateDoc,clone,remove,resizeRegularPolygon,affected,isObjectVisible} from '../src/model.mjs';
import {hookTailGeometry} from '../src/diagram_routing.mjs';
import {worldBounds,nearestFreehandAttachment} from '../src/geometry.mjs';

const nearly=(a,b)=>assert.ok(Math.abs(a-b)<0.02,`${a} != ${b}`);
const docWithPolygon=()=>{const d=newDoc();addPoint(d,[0,0],'A');addPoint(d,[4,0],'B');const p=command(d,'RegularPolygon(A,B,5)');return {d,p};};
const owned=(d,p)=>d.objects.filter(o=>o.edgeOf===p.id);

test('Round33: every preset initializes *new* object colors to black without rewriting existing documents',()=>{
 for(const [name,preset] of Object.entries(PRESETS)){
  assert.equal(preset.stroke,'#000000',name);
  assert.equal(preset.fill,'#000000',name);
 }
 const d=newDoc();assert.equal(d.settings.stroke,'#000000');assert.equal(d.settings.fill,'#000000');
 const pt=addPoint(d,[0,0]);assert.equal(pt.style.stroke,'#000000');assert.equal(pt.style.fill,'#000000');
 const r=append(d,{type:'node',xy:[2,2],text:'N'});assert.equal(r.style.stroke,'#000000');assert.equal(r.style.fill,'#000000');
 d.objects[0].style.stroke='#ef4444';const saved=validateDoc(clone(d));assert.equal(saved.objects[0].style.stroke,'#ef4444');
});
test('Round33: true semicircle is inside the route, mirrored by label side, and tangent to shaft',()=>{
 for(const [end,swap] of [[100, false],[100,true],[24,false],[24,true]]){
  const h=hookTailGeometry([0,0],[end,0],swap);
  assert.ok(h?.d.includes(' A'),h);assert.ok(h.radius>=2&&h.radius<=8);
  const nums=h.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  // M startX startY A radius radius rotation large-arc sweep endX endY
  nearly(nums[0],h.shaftStart[0]);nearly(nums[1],(swap?1:-1)*h.radius*2);
  assert.equal(nums[6],swap?1:0);nearly(nums[7],h.shaftStart[0]);nearly(nums[8],0);
  // Semicircle spans x >= 0 on the axis, never penetrates the source node.
  assert.ok(h.shaftStart[0]-h.radius>=-0.001);
 }
 assert.equal(hookTailGeometry([0,0],[0,0]),null);
 assert.equal(hookTailGeometry([0,0],[1,0]),null);
 assert.equal(hookTailGeometry([0,0],[Infinity,0]),null);
 const vertical=hookTailGeometry([20,30],[20,-70],true);
 assert.ok(vertical&&vertical.d.includes(' A')&&vertical.shaftStart[1]<30);
});
test('Round33: resizing regular polygon sides preserves IDs/style and explicit deleted slots',()=>{
 const {d,p}=docWithPolygon(),first=owned(d,p);
 first[0].style.stroke='#ff0000';const ids=first.map(o=>o.id);
 resizeRegularPolygon(d,p.id,7);
 assert.deepEqual(owned(d,p).map(o=>o.edgeIndex),[0,1,2,3,4,5,6]);
 assert.deepEqual(owned(d,p).slice(0,5).map(o=>o.id),ids);
 assert.equal(owned(d,p)[0].style.stroke,'#ff0000');assert.doesNotThrow(()=>validateDoc(d));
 const resolver=createResolver(d);for(const edge of owned(d,p))assert.ok(resolver.line(edge));
 remove(d,ids[1]);assert.equal(owned(d,p).length,6);
 resizeRegularPolygon(d,p.id,4);assert.deepEqual(owned(d,p).map(o=>o.edgeIndex),[0,2,3]);
 resizeRegularPolygon(d,p.id,6);assert.deepEqual(owned(d,p).map(o=>o.edgeIndex),[0,2,3,4,5]);
 assert.equal(owned(d,p)[0].id,ids[0]);assert.doesNotThrow(()=>validateDoc(d));
 const old=append(d,{type:'regularPolygon',refs:p.refs,sides:5});resizeRegularPolygon(d,old.id,6);
 assert.equal(owned(d,old).length,0,'legacy side-less geometry stays side-less');
});
test('Round33: shrinking polygon refuses silently deleting linked or locked derived sides',()=>{
 const {d,p}=docWithPolygon(),edges=owned(d,p),dependent=append(d,{type:'parallelThrough',refs:[d.objects[0].id,edges[4].id]});
 assert.ok(affected(d,edges[4].id).has(dependent.id));
 const before=JSON.stringify(d);
 assert.throws(()=>resizeRegularPolygon(d,p.id,4),/dependent/i);
 assert.equal(JSON.stringify(d),before);
 remove(d,dependent.id);
 edges[4].locked=true;
 assert.throws(()=>resizeRegularPolygon(d,p.id,4),/Unlock/i);
 assert.equal(p.sides,5);edges[4].locked=false;
 resizeRegularPolygon(d,p.id,4);assert.doesNotThrow(()=>validateDoc(d));
});
test('Round33/35: icon snapshot protects all unchanged glyphs and approves six requested changes',()=>{
 const source=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 const match=source.match(/const glyph=\{([\s\S]*?)\};/);assert.ok(match);
 const map=Object.fromEntries([...match[1].matchAll(/(\w+):'([^']+)'/g)].map(m=>[m[1],m[2]]));
 for(const m of source.matchAll(/glyph\.(\w+)='([^']+)'/g))map[m[1]]=m[2];
 const expected=JSON.parse(readFileSync(new URL('./fixtures/round33_tool_icons.json',import.meta.url)));
 assert.deepEqual(Object.keys(map).filter(key=>Object.hasOwn(expected,key)).sort(),Object.keys(expected).sort());
 for(const [key,markup] of Object.entries(map))if(Object.hasOwn(expected,key))assert.equal(createHash('sha256').update(markup).digest('hex'),expected[key],`Unapproved icon change: ${key}`);
 assert.ok(!map.regularPolygon.includes('stroke-dasharray'),'center and vertex must not be joined in icon');
});

test('Round33: hidden polygon owner suppresses its derived sides in canvas, fit, and snapping without erasing them',()=>{
 const {d,p}=docWithPolygon(),edge=owned(d,p)[2],resolver=createResolver(d);
 assert.equal(isObjectVisible(d,edge),true);
 const q=resolver.points(edge),mid=[(q[0][0]+q[1][0])/2,(q[0][1]+q[1][1])/2];
 assert.ok([p.id,edge.id].includes(nearestFreehandAttachment(mid,d.objects,resolver,48,5)?.id));
 const boundsBefore=worldBounds(d,resolver);assert.ok(boundsBefore.minX< -1);
 p.hidden=true;assert.equal(isObjectVisible(d,edge),false);
 assert.equal(nearestFreehandAttachment(mid,d.objects,resolver,48,5),null);
 const boundsAfter=worldBounds(d,resolver);assert.ok(boundsAfter.minX>=0);
 assert.equal(owned(d,p).length,5);assert.doesNotThrow(()=>validateDoc(d));
 p.hidden=false;assert.equal(isObjectVisible(d,edge),true);
 p.style.opacity=0;assert.equal(isObjectVisible(d,edge),false);
});
