import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createResolver,validateDoc,clone} from '../src/model.mjs';
const project=JSON.parse(readFileSync(new URL('./fixtures/imo2011_p6_extended.json',import.meta.url),'utf8'));
const get=(doc,id)=>doc.objects.find(o=>o.id===id);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const lineDistance=(p,a,b)=>Math.abs(cross([b[0]-a[0],b[1]-a[1]],[p[0]-a[0],p[1]-a[1]]))/distance(a,b);
test('R199 complete IMO project validates with no dangling or cyclic references',()=>{
 assert.doesNotThrow(()=>validateDoc(clone(project)));
 assert.equal(project.objects.length,103);
 const ids=new Set(project.objects.map(o=>o.id));assert.equal(ids.size,103);
 for(const o of project.objects)for(const ref of o.refs||[])assert.ok(ids.has(ref),`${o.id} -> ${ref}`);
 const r=createResolver(project);for(const o of project.objects){
  if(['point','midpoint','perpendicularFoot','triangleCenter'].includes(o.type)){
   const p=r.at(o.id);assert.ok(p&&p.every(Number.isFinite),`${o.id} ${o.name} unresolved`);
  }
 }
});
test('R199 original IMO reflected lines, reflected triangle, circles and tangency are geometrically consistent',()=>{
 const r=createResolver(project);const at=id=>r.at(id);
 const O=at('o4'),Onew=at('o9'),A=at('o1'),Ap=at('o6'),Bp=at('o7'),Cp=at('o8');
 const R=distance(O,A),S=distance(Onew,Ap),d=distance(O,Onew);
 const tangentError=Math.min(Math.abs(d-(R+S)),Math.abs(d-Math.abs(R-S)));
 assert.ok(tangentError<1e-4,`tangency defect: ${tangentError}`);
 for(const [ids,ends] of [ [['o7','o8'],['o46','o47']], [['o8','o6'],['o49','o50']], [['o6','o7'],['o52','o53']] ]){
  for(const p of ids)assert.ok(lineDistance(at(p),at(ends[0]),at(ends[1]))<1e-5,`${p} not on reflected line ${ends.join(',')}`);
 }
 // A reflected tangent must agree with reflection across the opposite triangle side.
 const reflectPoint=(p,u,v)=>{
  const dx=v[0]-u[0],dy=v[1]-u[1],den=dx*dx+dy*dy;
  const t=((p[0]-u[0])*dx+(p[1]-u[1])*dy)/den;
  return [2*(u[0]+t*dx)-p[0],2*(u[1]+t*dy)-p[1]];
 };
 for(const [side,refLine] of [ [['o2','o3'],['o46','o47']], [['o3','o1'],['o49','o50']], [['o1','o2'],['o52','o53']] ]){
  const reflectedA=reflectPoint(at('o42'),at(side[0]),at(side[1]));
  const reflectedB=reflectPoint(at('o43'),at(side[0]),at(side[1]));
  assert.ok(lineDistance(reflectedA,at(refLine[0]),at(refLine[1]))<1e-5,`reflected tangent A ${side}`);
  assert.ok(lineDistance(reflectedB,at(refLine[0]),at(refLine[1]))<1e-5,`reflected tangent B ${side}`);
 }
 const T=at('o5'),a=at('o42'),b=at('o43');
 assert.ok(Math.abs(distance(O,T)-R)<1e-5,'tangent point off original circle');
 assert.ok(Math.abs((T[0]-O[0])*(b[0]-a[0])+(T[1]-O[1])*(b[1]-a[1]))<1e-5,'tangent is not orthogonal to OT');
});
test('R199 derived point dependency follows moving A while static auxiliaries are explicitly non-dynamic',()=>{
 const doc=clone(project);const r0=createResolver(doc);const beforeO=r0.at('o4'),beforeMid=r0.at('o15'),staticAp=r0.at('o6');
 get(doc,'o1').xy=[0.5,2.5];const r1=createResolver(doc);
 assert.ok(distance(beforeO,r1.at('o4'))>0.01,'circumcenter not updated');
 assert.ok(distance(beforeMid,r1.at('o15'))>0.01,'midpoint not updated');
 assert.deepEqual(r1.at('o6'),staticAp,'precomputed reflected vertex is not linked to ABC');
 // This fixture is a *snapshot* of a valid olympiad construction, not a dynamic invariant under arbitrary vertex edits.
});
