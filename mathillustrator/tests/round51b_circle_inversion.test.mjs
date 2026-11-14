import test from 'node:test';
import assert from 'node:assert/strict';
import {TOOLS,newDoc,addPoint,append,clone,createResolver,validateDoc,guardAnchorMove,affected} from '../src/model.mjs';
import {TRANSFORM_MODES,transformPoint,r50Shape,r50SourceShape,polylineCrossings} from '../src/geometry_round50.mjs';
const close=(a,b,eps=1e-5)=>assert.ok(a&&a.length===2&&Math.hypot(a[0]-b[0],a[1]-b[1])<eps,`${JSON.stringify(a)} differs from ${JSON.stringify(b)}`);
const point=(doc,x,y)=>addPoint(doc,[x,y]);
function setup(){
 const doc=newDoc(),center=point(doc,0,0),edge=point(doc,2,0),ring=append(doc,{type:'circle',refs:[center.id,edge.id]});
 return {doc,center,edge,ring};
}
test('Round51B: circle inversion is a separate two-click tool and a supported persisted mode',()=>{
 assert.ok(TOOLS.includes('circleInversion'));assert.ok(!TOOLS.includes('quadrilateral'));
 assert.ok(TRANSFORM_MODES.includes('invert'));assert.ok(validateDoc(newDoc()));
});
test('Round51B: inversion is a mathematically correct involution, with center excluded',()=>{
 for(const p of [[4,0],[1,2],[-3,5],[0,3]]){
  const image=transformPoint(p,'invert',[0,0],2);close(transformPoint(image,'invert',[0,0],2),p);
  const ratio=Math.hypot(...p)*Math.hypot(...image);assert.ok(Math.abs(ratio-4)<1e-9);
 }
 assert.equal(transformPoint([0,0],'invert',[0,0],2),null);
 assert.equal(transformPoint([4,0],'invert',[0,0],0),null);
 assert.equal(transformPoint([4,0],'invert',[0,0],Infinity),null);
 assert.equal(transformPoint([4,0],'invert',[0,0],-1),null);
});
test('Round51B: source point inversion follows both source and inversion circle, survives JSON',()=>{
 const {doc,edge,ring}=setup(),source=point(doc,4,0);
 const copy=append(doc,{type:'transformCopy',refs:[source.id,ring.id],transform:'invert',amount:0});
 close(r50Shape(copy,createResolver(doc))[0],[1,0]);assert.ok(validateDoc(doc));
 const parsed=JSON.parse(JSON.stringify(doc));assert.ok(validateDoc(parsed));
 close(r50Shape(parsed.objects.find(o=>o.id===copy.id),createResolver(parsed))[0],[1,0]);
 source.xy=[8,0];close(r50Shape(copy,createResolver(doc))[0],[.5,0]);
 edge.xy=[4,0];close(r50Shape(copy,createResolver(doc))[0],[2,0]);
 assert.ok(affected(doc,edge.id).has(copy.id));
});
test('Round51B: inversion maps an offset line segment to a sampled circular arc, not a chord',()=>{
 const {doc,ring}=setup(),a=point(doc,-4,2),b=point(doc,4,2),seg=append(doc,{type:'segment',refs:[a.id,b.id]});
 const inv=append(doc,{type:'transformCopy',refs:[seg.id,ring.id],transform:'invert',amount:0});
 const path=r50Shape(inv,createResolver(doc),128);
 assert.ok(path.length>15,path.length);
 close(path[0],[-.8,.4]);close(path.at(-1),[.8,.4]);
 assert.ok(path.some(p=>p&&Math.hypot(p[0],p[1]-2)<.04),'must arc through (0,2), not a straight chord');
 for(const p of path.filter(Boolean))assert.ok(Math.abs(p[0]*p[0]+(p[1]-1)**2-1)<1e-6,'line y=2 maps to circle centered at (0,1), radius 1');
});
test('Round51B: inversion of a noncentral circle agrees with analytic center and radius',()=>{
 const {doc,ring}=setup(),c=point(doc,6,0),r=point(doc,8,0),circle=append(doc,{type:'circle',refs:[c.id,r.id]});
 const copy=append(doc,{type:'transformCopy',refs:[circle.id,ring.id],transform:'invert',amount:0});
 const shape=r50Shape(copy,createResolver(doc),120);
 assert.ok(shape.length>=120);
 // R² C/(|C|²-r²) = (0.75,0), R² r/(|C|²-r²) = 0.25.
 for(const p of shape)assert.ok(Math.abs(Math.hypot(p[0]-.75,p[1])-.25)<1e-8,JSON.stringify(p));
 assert.ok(validateDoc(doc));
});
test('Round51B: singular arcs remain separate instead of connecting through infinity',()=>{
 const {doc,ring}=setup(),a=point(doc,-2,0),b=point(doc,2,0),segment=append(doc,{type:'segment',refs:[a.id,b.id]});
 const inv=append(doc,{type:'transformCopy',refs:[segment.id,ring.id],transform:'invert',amount:0});
 const shape=r50Shape(inv,createResolver(doc),120);
 assert.ok(shape.some(p=>p===null), 'the missing center must separate image branches');
 assert.ok(shape.some(p=>p&&p[0]<0)&&shape.some(p=>p&&p[0]>0));
 assert.ok(!polylineCrossings(shape,[[0,-2],[0,2]]).some(p=>p.some(Number.isNaN)));
 assert.ok(validateDoc(doc));
});
test('Round51B: invalid circle targets and sources at the inversion center fail closed',()=>{
 const {doc,center,edge,ring}=setup(),source=point(doc,0,0);
 const invalid=append(doc,{type:'transformCopy',refs:[source.id,ring.id],transform:'invert',amount:0});
 assert.throws(()=>validateDoc(doc),/no finite image/i);
 doc.objects=doc.objects.filter(o=>o.id!==invalid.id);
 const bad=append(doc,{type:'transformCopy',refs:[edge.id,center.id],transform:'invert',amount:0});
 assert.throws(()=>validateDoc(doc),/Invalid reference target/);
 doc.objects=doc.objects.filter(o=>o.id!==bad.id);
 assert.ok(validateDoc(doc));
});
test('Round51B: moving a source into the inversion center is rejected, undo snapshot remains intact',()=>{
 const {doc,ring}=setup(),source=point(doc,4,0);
 const copy=append(doc,{type:'transformCopy',refs:[source.id,ring.id],transform:'invert',amount:0});
 const old=clone(doc),next=clone(doc);
 next.objects.find(o=>o.id===source.id).xy=[0,0];
 assert.throws(()=>guardAnchorMove(old,next,source.id),/circle inversion has no finite image/);
 close(r50Shape(copy,createResolver(old))[0],[1,0]);
 assert.ok(validateDoc(old));
});
