import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOOL_SHORTCUTS,shortcutForTool,canvasShortcut} from '../src/keyboard_shortcuts.mjs';
import {nodeBox,plainNodeInkBox,boxEdgeToward,edgeBetweenBoxes} from '../src/diagram_layout.mjs';
import {routeDiagramEdge,boxRect} from '../src/diagram_routing.mjs';
import {TOOLS,clone,validateDoc,get,resizeRegularPolygon,createResolver,affected,remove,isObjectVisible} from '../src/model.mjs';
const dense=()=>JSON.parse(readFileSync(new URL('./fixtures/round34_dense_scene.json',import.meta.url),'utf8'));
const approx=(a,b,t=0.03)=>assert.ok(Math.abs(a-b)<=t,`${a} is not close to ${b}`);

test('Round34: only common, unambiguous single-key shortcuts; never capture editing, browser or IME',()=>{
 assert.equal(new Set(Object.values(TOOL_SHORTCUTS)).size,Object.keys(TOOL_SHORTCUTS).length);
 for(const [key,tool] of Object.entries(TOOL_SHORTCUTS)){
  assert.ok(/^[a-z]$/.test(key));assert.ok(TOOLS.includes(tool),tool);
  assert.equal(shortcutForTool[tool],key.toUpperCase());
 }
 const toolButton={classList:{contains:name=>name==='tool'}},input={tagName:'INPUT',classList:{contains:()=>false}},svg={};
 const ev={key:'p',ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,isComposing:false,repeat:false};
 assert.equal(canvasShortcut(ev,toolButton,svg),'point');
 assert.equal(canvasShortcut({...ev,key:'V'},svg,svg),'select');
 assert.equal(canvasShortcut(ev,input,svg),null);
 for(const field of ['ctrlKey','metaKey','altKey','shiftKey','isComposing','repeat'])assert.equal(canvasShortcut({...ev,[field]:true},toolButton,svg),null,field);
 assert.equal(canvasShortcut(ev,toolButton,svg,true),null);
 assert.equal(canvasShortcut({...ev,key:'/'},toolButton,svg),null);
});

test('Round34: arrow clips to visible ink or border with 4-pixel exterior spacing',()=>{
 const full=nodeBox('A',17),ink=plainNodeInkBox('A',17);
 assert.ok(ink.width<full.width&&ink.height<full.height);
 const src=[0,0],dst=[100,0],sp=plainNodeInkBox('x',17),target=plainNodeInkBox('log x',17);
 const route=routeDiagramEdge(src,dst,sp,target,[],'direct');
 assert.equal(route.status,'direct');
 approx(route.points[0][0],sp.width/2+4);
 approx(route.points[1][0],100-target.width/2-4);
 const bordered=routeDiagramEdge(src,dst,nodeBox('x',17),nodeBox('log x',17),[],'direct');
 assert.ok(bordered.points[0][0]>route.points[0][0]);
 assert.ok(bordered.points[1][0]<route.points[1][0]);
 for(const direction of [[30,0],[30,40],[-20,50],[0,20]]){
  const point=boxEdgeToward(src,direction,sp,4);assert.ok(point?.every(Number.isFinite));
  // The hit must be on the four-pixel expanded rectangle, not inside it.
  const rx=sp.width/2+4,ry=sp.height/2+4;
  approx(Math.max(Math.abs(point[0])/rx,Math.abs(point[1])/ry),1);
 }
 assert.equal(boxEdgeToward([0,0],[0,0],sp),null);
 assert.equal(boxEdgeToward([0,0],[NaN,3],sp),null);
 assert.equal(boxEdgeToward([0,0],[4,0],{width:-3,height:9}),null);
 assert.equal(edgeBetweenBoxes([0,0],[1,0],{width:30,height:20},{width:30,height:20}),null);
});

test('Round34: dense mixed diagrams/geometry produce stable routes and strict import',()=>{
 const d=validateDoc(dense()),r=createResolver(d),nodes=d.objects.filter(o=>o.type==='node');
 assert.equal(nodes.length,20);assert.ok(d.objects.length>120);
 const arrows=d.objects.filter(o=>o.type==='morphism');assert.ok(arrows.length>40);
 const rectangles=d.objects.filter(o=>o.type==='rectangle'),polygons=d.objects.filter(o=>o.type==='regularPolygon');
 assert.equal(rectangles.length,3);assert.equal(polygons.length,3);
 for(const edge of arrows){
  const pts=r.points(edge);assert.ok(pts.length===2&&pts.every(p=>p?.every(Number.isFinite)));
  const a=pts[0].map(v=>v*35),b=pts[1].map(v=>v*35);
  const from=get(d,edge.refs[0]),to=get(d,edge.refs[1]);
  const f=plainNodeInkBox(from.text,17),t=plainNodeInkBox(to.text,17);
  const obstacles=nodes.filter(n=>n.id!==from.id&&n.id!==to.id).map(n=>boxRect(n.xy.map(x=>x*35),plainNodeInkBox(n.text,17)));
  const route=routeDiagramEdge(a,b,f,t,obstacles,edge.routing);
  assert.ok(['direct','clear','routed','blocked','overlap'].includes(route.status),route);
  assert.ok(route.points.every(point=>point.every(Number.isFinite)));
 }
 for(const polygon of polygons){const sides=d.objects.filter(o=>o.edgeOf===polygon.id);assert.equal(sides.length,polygon.sides);for(const side of sides)assert.ok(r.points(side).every(Boolean));}
 for(const rectangle of rectangles){const sides=d.objects.filter(o=>o.edgeOf===rectangle.id);assert.equal(sides.length,4);}
 const saved=clone(d);assert.deepEqual(validateDoc(saved),d);
 const bad=clone(d);const edge=bad.objects.find(o=>o.edgeOf);edge.refs[0]='o999999';assert.throws(()=>validateDoc(bad));
});

test('Round34: dense owner visibility, side resize, cascade, persistence and rollback remain consistent',()=>{
 const d=validateDoc(dense()),polygon=d.objects.find(o=>o.type==='regularPolygon');
 const ids=d.objects.filter(o=>o.edgeOf===polygon.id).map(o=>o.id);
 const before=clone(d);
 polygon.hidden=true;for(const id of ids)assert.equal(isObjectVisible(d,get(d,id)),false);
 polygon.hidden=false;for(const id of ids)assert.equal(isObjectVisible(d,get(d,id)),true);
 resizeRegularPolygon(d,polygon.id,polygon.sides+1);assert.deepEqual(d.objects.filter(o=>o.edgeOf===polygon.id).slice(0,ids.length).map(o=>o.id),ids);
 assert.doesNotThrow(()=>validateDoc(d));
 const dependents=affected(d,polygon.id);assert.ok(dependents.size>=ids.length+2);
 const count=d.objects.length;remove(d,polygon.id);assert.equal(d.objects.length,count-dependents.size);
 assert.doesNotThrow(()=>validateDoc(d));
 assert.deepEqual(validateDoc(before),before,'history snapshot remains unaffected by dense dependent mutation');
});
