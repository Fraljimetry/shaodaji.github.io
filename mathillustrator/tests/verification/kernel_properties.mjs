/** Deterministic, browser-independent mathematical property probes.
 * No dependencies, no random state from Math.random, no production fallback.
 * Never change the seed to make failures disappear: archive the seed + case.
 */
import {transformPoint,circum,projectToCurve,alongCurve,r50SourceShape} from '../../src/geometry_round50.mjs';
import {regularPolygonVertices,shapeVerticesFromPoints,intersectStraightLines,intersectLineCircle,intersectCircles,newDoc,append,createResolver,affected,remove,validateDoc,clone} from '../../src/model.mjs';
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
 'line.intersection_symmetry':1200,
 'circle.line_incidence':1200,
 'circle.circle_incidence':1200,
 'line.domain_boundary':1200,
 'circle.domain_boundary':1200,
 'circle.tangency_branches':1200,
 'dependency.branch_identity':1200,
 'dependency.recompute':1200,
 'dependency.cycles_and_deletion':1200,
 'integration.json_roundtrip':1200,
 'integration.history_snapshots':1200,
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
 if(family==='integration.history_snapshots'){
  // Pure serialization state contract; real Chromium tests exercise app undo/redo.
  const doc=newDoc(),anchor=append(doc,{type:'point',xy:center});
  const first=JSON.stringify(doc),history=[first],future=[];
  doc.objects.find(o=>o.id===anchor.id).xy=add(center,mul(unitAngle(rand),scale));
  const second=JSON.stringify(doc);
  future.push(second);
  const restored=validateDoc(JSON.parse(history.pop()));
  const beforeDivergence=JSON.stringify(restored);
  const redoState=JSON.parse(future[0]);
  const diverged=clone(restored);
  diverged.objects[0].xy=add(center,mul(unitAngle(rand),scale*2));
  future.length=0;
  const valid=JSON.stringify(restored)===first&&JSON.stringify(redoState)===second&&
    beforeDivergence===JSON.stringify(restored)&&JSON.stringify(diverged)!==first&&future.length===0;
  return valid?null:failure({first,second,restored,diverged});
 }
 if(family==='integration.json_roundtrip'){
  // Validate actual persisted v1 JSON, not only JSON.parse/stringify.
  const doc=newDoc(),a=append(doc,{type:'point',xy:center});
  const b=append(doc,{type:'point',xy:add(center,mul(unitAngle(rand),scale))});
  const midpoint=append(doc,{type:'midpoint',refs:[a.id,b.id]});
  const edge=append(doc,{type:'segment',refs:[a.id,b.id]});
  doc.meta.title=`Roundtrip ${caseIndex}`;
  const snapshot=JSON.stringify(doc),reloaded=validateDoc(JSON.parse(snapshot));
  const positionBefore=createResolver(doc).at(midpoint.id),positionAfter=createResolver(reloaded).at(midpoint.id);
  const isolated=clone(reloaded);isolated.objects.find(o=>o.id===a.id).xy=[scale*4,scale*5];
  const valid=JSON.stringify(reloaded)===snapshot&&JSON.stringify(doc)===snapshot&&
    reloaded.objects.length===4&&reloaded.objects.some(o=>o.id===edge.id)&&
    closePoint(positionBefore,positionAfter,scale)&&
    JSON.stringify(doc)===snapshot&&JSON.stringify(isolated)!==snapshot;
  return valid?null:failure({snapshot,reloaded,positionBefore,positionAfter});
 }
 if(family==='line.domain_boundary'){
  const u=unitAngle(rand),v=[-u[1],u[0]],len=(1+rand())*scale;
  const a={a:center,d:u,domain:'segment',length:len};
  const b={a:add(center,mul(u,len*.4)),d:v,domain:'infinite'};
  const inside=intersectStraightLines(a,b),reverse=intersectStraightLines(b,a);
  const outStart={...b,a:sub(center,mul(u,.2*scale))};
  const outEnd={...b,a:add(center,mul(u,len+.2*scale))};
  const ray={...a,domain:'ray'};
  return closePoint(inside,b.a,scale)&&closePoint(reverse,b.a,scale)&&
    intersectStraightLines(a,outStart)===null&&intersectStraightLines(a,outEnd)===null&&
    intersectStraightLines(ray,outStart)===null&&closePoint(intersectStraightLines(ray,outEnd),outEnd.a,scale)
    ?null:failure({a,b,inside,reverse,outStart:intersectStraightLines(a,outStart),outEnd:intersectStraightLines(a,outEnd)});
 }
 if(family==='circle.domain_boundary'){
  const u=unitAngle(rand),radius=(.6+rand())*scale;
  const circle={center,radius},base=sub(center,mul(u,radius*2));
  const short={a:base,d:u,domain:'segment',length:radius*.75};
  const long={a:base,d:u,domain:'segment',length:radius*4.5};
  const ray={a:add(center,mul(u,radius*2)),d:u,domain:'ray'};
  const s=intersectLineCircle(short,circle),l=intersectLineCircle(long,circle),r=intersectLineCircle(ray,circle);
  return !s.minus&&!s.plus&&!r.minus&&!r.plus&&l.minus&&l.plus&&
    closePoint(l.minus,sub(center,mul(u,radius)),scale)&&closePoint(l.plus,add(center,mul(u,radius)),scale)
    ?null:failure({circle,short:s,long:l,ray:r});
 }
 if(family==='circle.tangency_branches'){
  const radius=(.6+rand())*scale,origin=[0,0],u=[1,0];
  const line={a:[0,radius],d:u,domain:'infinite'};
  const crossing=intersectLineCircle(line,{center:origin,radius});
  const c1={center:origin,radius},c2={center:[2*radius,0],radius};
  const cc=intersectCircles(c1,c2);
  return crossing.tangent&&closePoint(crossing.minus,line.a,scale)&&
    closePoint(crossing.plus,line.a,scale)&&cc.tangent&&cc.plus===null&&
    closePoint(cc.minus,[radius,0],scale)
    ?null:failure({line,crossing,c1,c2,cc});
 }
 if(family==='dependency.branch_identity'){
  // New resolver on each input edit models a user dragging the second circle.
  const doc=newDoc(),radius=(1+rand())*scale,atOrigin=[0,0];
  const origin=append(doc,{type:'point',xy:atOrigin});
  const up=append(doc,{type:'point',xy:[0,radius]});
  const moving=append(doc,{type:'point',xy:[radius,0]});
  const movingUp=append(doc,{type:'point',xy:add(moving.xy,[0,radius])});
  const c1=append(doc,{type:'circle',refs:[origin.id,up.id]});
  const c2=append(doc,{type:'circle',refs:[moving.id,movingUp.id]});
  const minus=append(doc,{type:'circleCircleIntersection',refs:[c1.id,c2.id],branch:-1});
  const plus=append(doc,{type:'circleCircleIntersection',refs:[c1.id,c2.id],branch:1});
  const before=createResolver(doc),p1=before.at(minus.id),p2=before.at(plus.id);
  moving.xy=[2*radius,0];movingUp.xy=[2*radius,radius];
  const tangent=createResolver(doc),t1=tangent.at(minus.id),t2=tangent.at(plus.id);
  moving.xy=[radius,0];movingUp.xy=[radius,radius];
  const after=createResolver(doc),a1=after.at(minus.id),a2=after.at(plus.id);
  return p1&&p2&&p1[1]<p2[1]&&t1&&t2&&closePoint(t1,t2,scale)&&
    closePoint(a1,p1,scale)&&closePoint(a2,p2,scale)
    ?null:failure({p1,p2,t1,t2,a1,a2,radius});
 }
 if(family==='dependency.recompute'){
  // Each resolver must reflect the current document, not stale cached values.
  const doc=newDoc(),a=append(doc,{type:'point',xy:center}),b=append(doc,{type:'point',xy:add(center,mul(unitAngle(rand),scale))});
  const middle=append(doc,{type:'midpoint',refs:[a.id,b.id]});
  const nested=append(doc,{type:'midpoint',refs:[middle.id,b.id]});
  const before=createResolver(doc),old=before.at(nested.id);
  const delta=randomPoint(rand,scale);a.xy=add(a.xy,delta);
  const after=createResolver(doc),next=after.at(nested.id);
  const expected=add(old,mul(delta,.25));
  // Fresh resolver updates; earlier resolver is an immutable evaluation snapshot.
  return closePoint(next,expected,scale)&&closePoint(before.at(nested.id),old,scale)
   ?null:failure({center,delta,old,next,expected});
 }
 if(family==='dependency.cycles_and_deletion'){
  const doc=newDoc(),a=append(doc,{type:'point',xy:center}),b=append(doc,{type:'point',xy:add(center,[scale,0])});
  const m=append(doc,{type:'midpoint',refs:[a.id,b.id]});
  const downstream=append(doc,{type:'midpoint',refs:[m.id,b.id]});
  const independent=append(doc,{type:'point',xy:add(center,[0,scale])});
  const expected=new Set([a.id,m.id,downstream.id]);
  const descendants=affected(doc,a.id);
  const count=remove(doc,a.id);
  const cascade=count===3&&expected.size===descendants.size&&[...expected].every(id=>descendants.has(id))&&
   doc.objects.length===2&&doc.objects.every(o=>[b.id,independent.id].includes(o.id))&&closePoint(createResolver(doc).at(b.id),b.xy,scale);
  // Directly constructed invalid graph: validator must explicitly recognize cycles.
  const cyclic=newDoc();append(cyclic,{type:'midpoint',refs:['o2','o2']});append(cyclic,{type:'midpoint',refs:['o1','o1']});
  let error='';try{validateDoc(cyclic);}catch(e){error=String(e.message);}
  const safelyUnresolved=createResolver(cyclic).at('o1')===null;
  return cascade&&/Cyclic object dependency/.test(error)&&safelyUnresolved?null:
   failure({cascade,error,safelyUnresolved,remaining:doc.objects.map(o=>o.id)});
 }
 if(family==='line.intersection_symmetry'){
  const u=unitAngle(rand),angle=(.2+rand()*2.5)*(rand()<.5?-1:1);
  const v=[u[0]*Math.cos(angle)-u[1]*Math.sin(angle),u[0]*Math.sin(angle)+u[1]*Math.cos(angle)];
  const a={a:sub(center,mul(u,(.3+rand())*scale)),d:u,domain:'infinite'};
  const b={a:add(center,mul(v,(.3+rand())*scale)),d:v,domain:'infinite'};
  const ab=intersectStraightLines(a,b),ba=intersectStraightLines(b,a);
  return closePoint(ab,center,scale)&&closePoint(ba,center,scale)&&closePoint(ab,ba,scale)?null:failure({a,b,ab,ba,center});
 }
 if(family==='circle.line_incidence'){
  const u=unitAngle(rand),v=[-u[1],u[0]],radius=scale*(.6+rand());
  const offset=(rand()-.5)*radius;
  const line={a:add(center,mul(v,offset)),d:u,domain:'infinite'};
  const c={center,radius},root=intersectLineCircle(line,c);
  const valid=pt=>pt&&Math.abs(norm(sub(pt,center))-radius)<=2e-10*scale&&
    Math.abs((pt[0]-line.a[0])*u[1]-(pt[1]-line.a[1])*u[0])<=2e-10*scale;
  return !root.tangent&&valid(root.minus)&&valid(root.plus)&&
   norm(sub(root.minus,root.plus))>0?null:failure({line,c,root});
 }
 if(family==='circle.circle_incidence'){
  const u=unitAngle(rand),v=[-u[1],u[0]],radius=scale*(.6+rand());
  const distance=radius*(.3+rand()*.9);
  const a={center,radius},b={center:add(center,mul(u,distance)),radius};
  const ab=intersectCircles(a,b),ba=intersectCircles(b,a);
  const valid=pt=>pt&&Math.abs(norm(sub(pt,a.center))-a.radius)<=2e-10*scale&&
    Math.abs(norm(sub(pt,b.center))-b.radius)<=2e-10*scale;
  const roots=[ab.minus,ab.plus],reverse=[ba.minus,ba.plus];
  const matches=roots.every(pt=>reverse.some(other=>closePoint(pt,other,scale)));
  return !ab.tangent&&!ba.tangent&&roots.every(valid)&&reverse.every(valid)&&matches?null:failure({a,b,ab,ba});
 }
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
