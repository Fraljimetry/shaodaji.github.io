/** Deterministic, browser-independent mathematical property probes.
 * No dependencies, no random state from Math.random, no production fallback.
 * Never change the seed to make failures disappear: archive the seed + case.
 */
import {transformPoint,circum,projectToCurve,alongCurve,r50SourceShape} from '../../src/geometry_round50.mjs';
import {regularPolygonVertices,shapeVerticesFromPoints} from '../../src/model.mjs';
import {distinctPoints,independentEdges,perpendicularHeightNonzero} from '../../src/numeric_geometry.mjs';

export const FRAMEWORK_VERSION=1;
export const SCALES=Object.freeze([1e-9,1e-6,1e-3,1,1e3,1e6]);
export const DEFAULT_SEED=0x5a17c0de;
export const FAMILY_CASES=Object.freeze({
 'rotation.isometry':1200,
 'reflection.involution':1200,
 'translation.isometry':1200,
 'dilation.composition':1200,
 'inversion.involution':1200,
 'circumcircle.incidence':1200,
 'segment.projection_roundtrip':1200,
 'numeric.degeneracy_scale':1200,
 'shape.polygon_scale':1200,
});
export function rng(seed){
 let state=seed>>>0;
 return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;
  t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const mul=(a,k)=>[a[0]*k,a[1]*k];
const norm=p=>Math.hypot(...p);
const randomPoint=(rand,scale)=>[(rand()*2-1)*scale,(rand()*2-1)*scale];
const unitAngle=rand=>{const a=2*Math.PI*rand();return [Math.cos(a),Math.sin(a)];};
export function closePoint(actual,expected,scale=1,relative=2e-10){
 if(!Array.isArray(actual)||actual.length!==2||!actual.every(Number.isFinite))return false;
 const dist=norm(sub(actual,expected));
 // Relative to input world scale (not an arbitrary absolute 1-unit floor).
 return dist<=relative*Math.max(Number.MIN_VALUE,scale,norm(expected));
}
export function propertyCase(family,caseIndex,rand){
 const scale=SCALES[caseIndex%SCALES.length], center=randomPoint(rand,scale),p=add(center,randomPoint(rand,scale));
 const q=add(center,randomPoint(rand,scale)),angle=(rand()*2-1)*Math.PI;
 const failure=(detail)=>({family,caseIndex,scale,detail});
 if(family==='numeric.degeneracy_scale'){
  const a=center,b=add(a,[scale,0]),c=add(b,[scale*.3,scale*.6]);
  const collinear=add(b,[scale*.3,0]);
  const accepted=distinctPoints(a,b)&&independentEdges(a,b,c)&&perpendicularHeightNonzero(a,b,c);
  const rejected=!distinctPoints(a,a)&&!independentEdges(a,b,collinear)&&!perpendicularHeightNonzero(a,b,collinear);
  return accepted&&rejected?null:failure({a,b,c,collinear,accepted,rejected});
 }
 if(family==='shape.polygon_scale'){
  const a=center,b=add(a,[scale,0]),c=add(b,[scale*.1,scale*.5]);
  const rectangle=shapeVerticesFromPoints('rectangle',[a,b,c]);
  const parallelogram=shapeVerticesFromPoints('parallelogram',[a,b,c]);
  const regular=regularPolygonVertices(a,b,5);
  const resolver={line:()=>null,circle:()=>null,at:()=>null,points:o=>o._pts};
  const source=type=>r50SourceShape({type,_pts:type==='regularPolygon'?[a,b]:[a,b,c],sides:5},resolver);
  const r=source('rectangle'),p=source('parallelogram'),g=source('regularPolygon');
  const valid=(pts,n)=>pts.length===n&&pts.every(pt=>pt.every(Number.isFinite));
  const determinant=(v)=>{const u=sub(v[1],v[0]),w=sub(v[2],v[1]);return u[0]*w[1]-u[1]*w[0];};
  const ok=valid(rectangle,4)&&valid(parallelogram,4)&&valid(regular,5)&&valid(r,5)&&valid(p,5)&&valid(g,6)&&determinant(rectangle)>0&&determinant(parallelogram)>0;
  return ok?null:failure({a,b,c,rectangle,parallelogram,regular,r,p,g});
 }
 if(family==='rotation.isometry'){
  const a=transformPoint(p,'rotate',center,angle),b=transformPoint(q,'rotate',center,angle);
  return a&&b&&Math.abs(norm(sub(a,b))-norm(sub(p,q)))<=2e-10*scale?null:failure({p,q,center,angle,a,b});
 }
 if(family==='reflection.involution'){
  const d=unitAngle(rand),other=add(center,mul(d,scale)),a=transformPoint(p,'reflect',center,0,other);
  const b=a&&transformPoint(a,'reflect',center,0,other);
  return closePoint(b,p,scale)?null:failure({p,center,other,a,b});
 }
 if(family==='translation.isometry'){
  const other=add(center,randomPoint(rand,scale)),a=transformPoint(p,'translate',center,0,other),b=transformPoint(q,'translate',center,0,other);
  return a&&b&&Math.abs(norm(sub(a,b))-norm(sub(p,q)))<=2e-10*scale?null:failure({p,q,center,other,a,b});
 }
 if(family==='dilation.composition'){
  const k=.25+rand()*2,h=.25+rand()*2;
  const a=transformPoint(p,'dilate',center,k),b=a&&transformPoint(a,'dilate',center,h),expected=transformPoint(p,'dilate',center,k*h);
  return expected&&closePoint(b,expected,scale)?null:failure({p,center,k,h,a,b,expected});
 }
 if(family==='inversion.involution'){
  const radius=scale*(.5+rand()),d=unitAngle(rand),distance=scale*(.3+rand()*2),point=add(center,mul(d,distance));
  const a=transformPoint(point,'invert',center,radius),b=a&&transformPoint(a,'invert',center,radius);
  return closePoint(b,point,scale)?null:failure({point,center,radius,a,b});
 }
 if(family==='circumcircle.incidence'){
  // Nondegenerate, independent of world scale; use right triangle.
  const d=unitAngle(rand),perp=[-d[1],d[0]],u=scale*(.4+rand()),v=scale*(.4+rand());
  const points=[center,add(center,mul(d,u)),add(center,mul(perp,v))];const c=circum(points);
  return c&&points.every(pt=>Math.abs(norm(sub(pt,c.center))-c.radius)<=2e-10*scale)?null:failure({points,c});
 }
 if(family==='segment.projection_roundtrip'){
  const a=center,d=unitAngle(rand),b=add(a,mul(d,scale)),t=rand();
  const on=alongCurve([a,b],t),proj=on&&projectToCurve(on,[a,b]);
  const again=proj&&alongCurve([a,b],proj.parameter);
  return closePoint(again,on,scale)&&closePoint(proj?.position,on,scale)?null:failure({a,b,t,on,proj,again});
 }
 throw new RangeError(`Unknown family: ${family}`);
}
export function runProperties({seed=DEFAULT_SEED,cases=FAMILY_CASES,maxFailures=8}={}){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('seed must be uint32');
 if(!Number.isInteger(maxFailures)||maxFailures<1)throw new RangeError('maxFailures must be positive');
 const results=[];
 for(const [family,count] of Object.entries(cases)){
  if(!Object.hasOwn(FAMILY_CASES,family)||!Number.isSafeInteger(count)||count<1||count>1000000)throw new RangeError(`Invalid family/count: ${family}`);
  const rand=rng(seed ^ hashFamily(family)),failures=[];let failedCount=0;
  for(let i=0;i<count;i++){
   const failure=propertyCase(family,i,rand);
   if(failure){failedCount++;if(failures.length<maxFailures)failures.push(failure);}
  }
  results.push({family,count,passed:count-failedCount,failed:failedCount,failures});
 }
 return {frameworkVersion:FRAMEWORK_VERSION,seed,results};
}
function hashFamily(str){let h=2166136261;for(const ch of str){h=Math.imul(h^ch.codePointAt(0),16777619);}return h>>>0;}
