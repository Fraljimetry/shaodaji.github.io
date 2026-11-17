import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clone,createResolver,validateDoc,affected,remove} from '../src/model.mjs';
const source=JSON.parse(readFileSync(new URL('./fixtures/MathIllustrator_IMO2011_P6_Dynamic_Geometry.json',import.meta.url)));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function invariant(doc,label){
 const r=createResolver(doc),a=id=>r.at(id),O=a('o10'),O1=a('o20'),A=a('o1'),P=a('o18'),T=a('o12');
 for(const o of doc.objects){if(['point','pointOnObject','midpoint','perpendicularFoot','triangleCenter','intersection','circleIntersection'].includes(o.type))assert.ok(a(o.id)?.every(Number.isFinite),`${label}: ${o.id} ${o.name} unresolved`)}
 const R=dist(O,A),S=dist(O1,P),d=dist(O,O1);
 const err=Math.min(Math.abs(d-(R+S)),Math.abs(d-Math.abs(R-S)));
 assert.ok(err<1e-5,`${label}: circles not tangent ${err}`);
 assert.ok(Math.abs(dist(O,T)-R)<1e-7,`${label}: T not on circle`);
 // Independent reflection of tangent-line sample points across BC, CA, AB.
 const rline=r.line('o13');assert.ok(rline,`${label}: tangent missing`);
 const dot=(u,v)=>u[0]*v[0]+u[1]*v[1];
 assert.ok(Math.abs(dot(rline.d,[T[0]-O[0],T[1]-O[1]]))<1e-7,`${label}: tangent not perpendicular to radius`);
 const reflect=(p,u,v)=>{const d=[v[0]-u[0],v[1]-u[1]],t=dot([p[0]-u[0],p[1]-u[1]],d)/dot(d,d);return [2*(u[0]+t*d[0])-p[0],2*(u[1]+t*d[1])-p[1]];};
 const onLine=(p,line)=>Math.abs((p[0]-line.a[0])*line.d[1]-(p[1]-line.a[1])*line.d[0]);
 for(const [reflected,side] of [['o14',['o2','o3']],['o15',['o3','o1']],['o16',['o1','o2']]]){
   const line=r.line(reflected);assert.ok(line,`${label}: missing ${reflected}`);
   for(const p of [rline.a,[rline.a[0]+rline.d[0],rline.a[1]+rline.d[1]]])assert.ok(onLine(reflect(p,a(side[0]),a(side[1])),line)<1e-7,`${label}: ${reflected} reflection incorrect`);
 }
 for(const [target,first,second] of [['o17','o14','o15'],['o18','o15','o16'],['o19','o16','o14']]){
   for(const id of [first,second])assert.ok(onLine(a(target),r.line(id))<1e-7,`${label}: ${target} not on ${id}`);
 }

 return {O,O1,T,R,S,err};
}
test('R204 exact 67-object IMO fixture has valid dynamic circle tangency',()=>{
 assert.equal(source.objects.length,67);
 assert.equal(source.objects.filter(o=>o.type==='point').length,3);
 validateDoc(clone(source));invariant(source,'base');
});
test('R204 exact IMO geometry survives seeded moves and tangent parameter edits',()=>{
 let seed=78223;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
 for(let i=0;i<120;i++){
  const doc=clone(source);
  for(const [id,scale] of [['o1',0.3],['o2',0.3],['o3',0.3]]){
   const o=doc.objects.find(o=>o.id===id);o.xy=o.xy.map(v=>v+(rand()-.5)*scale);
  }
  doc.objects.find(o=>o.id==='o12').parameter=rand();
  invariant(doc,`seed=${i}`);
 }
});
test('R204 deletion closure and undo-style snapshot restoration',()=>{
 const before=JSON.stringify(source),doc=clone(source);
 const affectedA=affected(doc,'o1');assert.ok(affectedA.size>20,`too few dependents ${affectedA.size}`);
 assert.equal(remove(doc,'o1'),affectedA.size);
 for(const o of doc.objects)for(const id of o.refs||[])assert.ok(doc.objects.some(candidate=>candidate.id===id),`${o.id} has dangling parent ${id}`);
 assert.deepEqual(validateDoc(JSON.parse(before)),source);
});
