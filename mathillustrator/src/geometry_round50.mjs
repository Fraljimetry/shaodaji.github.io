import {distinctPoints,independentEdges,perpendicularHeightNonzero} from './numeric_geometry.mjs?cut=round87';
/** Round 55 deployment contract: generalCrossings is a required named export.
 * Round 50 geometry primitives. Pure world-coordinate mathematics; no canvas/DOM.
 * Finite and singularity guards are deliberate: undefined geometry must never
 * silently become a point at the origin or a malformed SVG path.
 */
const tau=2*Math.PI, finite=n=>Number.isFinite(n)&&Math.abs(n)<1e9;
export const PARALLEL_SINE_EPS=1e-12;
// A limit is for responsible failure reporting, never silent loss of roots.
export const MAX_GENERAL_ROOTS=10000;
const coord=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],mul=(p,s)=>[p[0]*s,p[1]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const norm=a=>Math.hypot(...a),left=a=>[-a[1],a[0]];
// A world-distance tolerance must reflect floating-point representational
// precision near the actual geometry, not the distance of a point along a line
// or a fixed allowance in squared-world units. Never grow tolerance simply
// because the intersection is far from a line's chosen origin.
const distanceEpsilon=(...values)=>64*Number.EPSILON*Math.max(Number.MIN_VALUE,...values.map(Math.abs));
// Endpoint slack is for floating-point arithmetic only, never an arbitrary
// world-coordinate or dimensionless extension of a finite support.
const endpointEpsilon=(...values)=>32*Number.EPSILON*Math.max(1e-12,...values.map(Math.abs));
const segmentParameterInside=(t,a,b)=>{
 const len=norm(sub(b,a));
 if(!(len>0)||!Number.isFinite(t))return false;
 const slack=endpointEpsilon(...a,...b,len)/len;
 return t>=-slack&&t<=1+slack;
};
const finiteLineInside=(line,t)=>{
 if(line.domain==='infinite')return true;
 const slack=endpointEpsilon(...line.a,line.length,t);
 return t>=-slack&&(line.domain==='ray'||t<=line.length+slack);
};
const unit=a=>{const n=norm(a);return n>0&&Number.isFinite(n)?mul(a,1/n):null};
export const R50_TYPES=['pointOnObject','tangentCircle','circularArc','parabola','hyperbola','generalIntersection','transformCopy','locus','fixedLength','fixedAngle','triangleCenter'];
export const R50_POINT_TYPES=['pointOnObject','generalIntersection','triangleCenter'];
export const R50_CURVE_TYPES=['circularArc','parabola','hyperbola','transformCopy','locus','fixedAngle'];
export const TRANSFORM_MODES=['reflect','rotate','translate','dilate','invert'];
export const CENTER_KINDS=['centroid','circumcenter','incenter','orthocenter','excenterA','excenterB','excenterC'];
/** Shared relative-angle degeneracy policy for 3-point circles and arcs.
 * Reject nearly collinear anchors independently of world scale. No absolute
 * minimum radius: a small, well-conditioned triangle is still a circle.
 */
export function circum(p){if(!Array.isArray(p)||p.length!==3||!p.every(coord))return null;
 const [a,b,c]=p,u=sub(b,a),v=sub(c,a),lu=norm(u),lv=norm(v),det=2*cross(u,v);
 if(!(lu>0&&lv>0)||!Number.isFinite(det)||Math.abs(det)<=2e-9*lu*lv)return null;
 const u2=dot(u,u),v2=dot(v,v);
 const x=(u2*v[1]-v2*u[1])/det,y=(v2*u[0]-u2*v[0])/det,center=add(a,[x,y]),radius=Math.hypot(x,y);
 return coord(center)&&finite(radius)&&radius>0?{center,radius}:null;
}
export function triangleCenter(p,kind){if(!p||p.length!==3||!p.every(coord))return null;
 const [a,b,c]=p,C=circum(p),sa=norm(sub(b,c)),sb=norm(sub(a,c)),sc=norm(sub(a,b)),per=sa+sb+sc;
 if(kind==='centroid')return mul(add(add(a,b),c),1/3);
 if(kind==='circumcenter')return C?.center||null;
 if(kind==='orthocenter')return C?sub(add(add(a,b),c),mul(C.center,2)):null;
 if(kind==='incenter'&&C&&per>0)return mul(add(add(mul(a,sa),mul(b,sb)),mul(c,sc)),1/per);
 if(['excenterA','excenterB','excenterC'].includes(kind)&&C){
  const i={excenterA:0,excenterB:1,excenterC:2}[kind],w=[sa,sb,sc].map((v,j)=>j===i?-v:v),den=w[0]+w[1]+w[2];
  // Negative barycentric weight at the chosen opposite vertex.
  // Flipping the numerator and denominator gives the usual excenter.
  if(Math.abs(den)>1e-12*per)return mul(add(add(mul(a,w[0]),mul(b,w[1])),mul(c,w[2])),1/den);
 }
 return null;
}
export function circleArcPoints(points,count=96){const c=circum(points);if(!c)return [];
 const angles=points.map(p=>Math.atan2(p[1]-c.center[1],p[0]-c.center[0]));
 const ccw=t=>(t%tau+tau)%tau;
 const sweep=ccw(angles[2]-angles[0]);const through=ccw(angles[1]-angles[0]);
 const delta=through<=sweep?sweep:sweep-tau;
 return Array.from({length:count+1},(_,i)=>add(c.center,mul([Math.cos(angles[0]+delta*i/count),Math.sin(angles[0]+delta*i/count)],c.radius)));
}
export function parabolaPoints(focus,line,count=120){if(!coord(focus)||!line||!coord(line.a)||!coord(line.d))return [];
 const t=dot(sub(focus,line.a),line.d),foot=add(line.a,mul(line.d,t)),sep=sub(focus,foot),distance=norm(sep);
 if(!(distance>0))return [];
 const axis=unit(sep),side=left(axis),vertex=mul(add(focus,foot),.5),p=distance/2;
 const span=Math.min(30,Math.max(3,5*distance));
 return Array.from({length:count+1},(_,i)=>{const s=(2*i/count-1)*span;return add(add(vertex,mul(side,s)),mul(axis,s*s/(4*p)));}).filter(coord);
}
export function hyperbolaPoints(points,count=128){if(!points?.every(coord)||points.length!==3)return [];
 const [f,g,on]=points,mid=mul(add(f,g),.5),c=norm(sub(g,f))/2;if(!(c>0))return [];
 const a=Math.abs(norm(sub(on,f))-norm(sub(on,g)))/2;if(!(a>0&&a<c)||!(c-a>64*Number.EPSILON*c))return [];
 const b=Math.sqrt(c*c-a*a),axis=unit(sub(g,f)),perp=left(axis);
 // The selected third point determines the displayed branch.
 const sgn=dot(sub(on,mid),axis)>=0?1:-1;
 return Array.from({length:count+1},(_,i)=>{const t=10*(i/count-.5);return add(add(mid,mul(axis,sgn*a*Math.cosh(t))),mul(perp,b*Math.sinh(t)));}).filter(coord);
}
export function projectToCurve(world,path,closed=false){if(!coord(world)||!Array.isArray(path)||path.length<2)return null;
 // Ray/line supports are unbounded even though rendered samples are finite.
 if(path.domain==='ray'||path.domain==='infinite'){
  const a=path[0],b=path[1],v=sub(b,a),length=norm(v);if(!(length>0))return null;
  const t=dot(sub(world,a),v)/(length*length),parameter=path.domain==='ray'?Math.max(0,t):t;
  return {parameter,position:add(a,mul(v,parameter))};
 }
 let best=null,position=0,total=0;const segments=[];
 for(let i=1;i<path.length+(closed?1:0);i++){
  const a=path[i-1],b=path[i%path.length];if(!coord(a)||!coord(b))continue;
  const d=sub(b,a),length=norm(d);if(!(length>0))continue;
  const t=Math.max(0,Math.min(1,dot(sub(world,a),d)/(length*length))),p=add(a,mul(d,t)),dist=norm(sub(world,p));
  segments.push({a,b,length,offset:total});if(!best||dist<best.dist)best={p,dist,length,t,offset:total};total+=length;
 }
 return best&&total>0?{parameter:(best.offset+best.length*best.t)/total,position:best.p}:null;
}
export function alongCurve(path,parameter,closed=false){if(!Array.isArray(path)||path.length<2||!finite(parameter))return null;
 if(path.domain==='ray'||path.domain==='infinite')return add(path[0],mul(sub(path[1],path[0]),path.domain==='ray'?Math.max(0,parameter):parameter));
 const seg=[],limit=path.length+(closed?1:0);let total=0;
 for(let i=1;i<limit;i++){const a=path[i-1],b=path[i%path.length];if(!coord(a)||!coord(b))continue;const length=norm(sub(b,a));if(length>0){seg.push({a,b,length});total+=length;}}
 if(!(total>0))return null;let remaining=Math.max(0,Math.min(1,parameter))*total;
 for(const s of seg){if(remaining<=s.length)return add(s.a,mul(sub(s.b,s.a),remaining/s.length));remaining-=s.length;}
 return seg.at(-1).b;
}
export function pointOnObject(owner,parameter,resolver,shapeSamples,constraintMode=null,distance=null){if(!owner||!finite(parameter))return null;
 if(owner.type==='fixedAngle'&&constraintMode==='angleRay'){
  const [guide,vertex]=resolver.points(owner);if(!coord(guide)||!coord(vertex)||!finite(owner.angle))return null;
  const direction=unit(sub(guide,vertex));if(!direction)return null;
  const c=Math.cos(owner.angle),s=Math.sin(owner.angle);
  // Direct helper parameters describe a 100-world-unit sample of the ray;
  // saved v1 objects retain their old 30-unit positions via resolver fallback.
  const extent=finite(distance)?Math.max(0,distance):Math.max(0,parameter)*100;
  return add(vertex,mul([direction[0]*c-direction[1]*s,direction[0]*s+direction[1]*c],extent));
 }
 const line=resolver.line(owner);if(line){const length=line.domain==='segment'?line.length:line.domain==='ray'?15:30;
  // New unbounded-line points use a signed world-distance; old projects
  // with only parameter retain their exact legacy positions.
  const t=finite(distance)&&line.domain!=='segment'
   ?(line.domain==='ray'?Math.max(0,distance):distance)
   :line.domain==='infinite'?(parameter-.5)*length:parameter*length;
  return add(line.a,mul(line.d,t));}
 const circle=resolver.circle(owner);
 if(circle)return add(circle.center,mul([Math.cos(parameter*tau),Math.sin(parameter*tau)],circle.radius));
 return alongCurve(shapeSamples(owner,resolver),parameter,owner.type==='ellipse');
}
export function circleTangents(point,circle){
 if(!coord(point)||!coord(circle?.center)||!finite(circle.radius)||!(circle.radius>0))return [];
 const w=sub(point,circle.center),d=norm(w),r=circle.radius;
 if(!(d>0)||!finite(d))return [];
 const radialTolerance=32*Number.EPSILON*Math.max(d,r,1e-12);
 if(d<r-radialTolerance)return [];
 // On-circle tangency is a *single* line, with its foot at the source point.
 if(Math.abs(d-r)<=radialTolerance)return [add(circle.center,mul(w,r/d))];
 const d2=d*d,r2=r*r,factor=r2/d2;
 // Factor the near-tangency discriminant to avoid catastrophic cancellation.
 const offset=r*Math.sqrt(Math.max(0,(d-r)*(d+r)))/d2;
 return [-1,1].map(sign=>add(circle.center,add(mul(w,factor),mul(left(w),sign*offset))));
}
export function transformPoint(p,mode,source,amount,other){if(!coord(p)||!coord(source))return null;
 let result=null;
 if(mode==='reflect'&&coord(other)){const d=unit(sub(other,source));if(d)result=add(source,sub(mul(d,2*dot(sub(p,source),d)),sub(p,source)));}
 if(mode==='rotate'&&finite(amount)){const v=sub(p,source),c=Math.cos(amount),s=Math.sin(amount);result=add(source,[c*v[0]-s*v[1],s*v[0]+c*v[1]]);}
 if(mode==='translate'&&coord(other))result=add(p,sub(other,source));
 if(mode==='dilate'&&finite(amount))result=add(source,mul(sub(p,source),amount));
 // Inversion in a circle centered at `source` with radius `amount`:
 // I(P) = C + R²(P-C)/|P-C|². The center has no finite image.
 if(mode==='invert'&&finite(amount)&&amount>0){
  const v=sub(p,source),distance=norm(v);
  // Normalize before scaling to avoid squaring a tiny radius or distance.
  if(distance>0){const imageRadius=(amount/distance)*amount;
   if(Number.isFinite(imageRadius))result=add(source,mul(v,imageRadius/distance));
  }
 }
 return coord(result)?result:null;
}
export function polylineCrossings(a,b){if(a?.length<2||b?.length<2)return [];
 const result=[];
 for(let i=1;i<a.length;i++)for(let j=1;j<b.length;j++){
  const p=a[i-1],q=b[j-1];if(!coord(p)||!coord(a[i])||!coord(q)||!coord(b[j]))continue;const u=sub(a[i],p),v=sub(b[j],q),lenU=norm(u),lenV=norm(v),det=cross(u,v);
  if(!(lenU>0&&lenV>0)||Math.abs(det)<PARALLEL_SINE_EPS*lenU*lenV)continue;
  const w=sub(q,p),t=cross(w,v)/det,s=cross(w,u)/det;
  if(segmentParameterInside(t,p,a[i])&&segmentParameterInside(s,q,b[j])){const root=add(p,mul(u,t));
   if(coord(root)&&!result.some(x=>norm(sub(x,root))<=distanceEpsilon(...x,...root)))result.push(root);
   if(result.length>MAX_GENERAL_ROOTS)throw new RangeError('More than 10000 intersection roots; reduce the curve complexity.');}
 }
 return result.sort((p,q)=>p[0]-q[0]||p[1]-q[1]); // Legacy sampled-root ordering preserved.
}
/** Exact cubic-Bezier/line crossings, including close root pairs between
 * rendering samples. A derivative partition makes each bracket monotone.
 * All roots are refined in the Bernstein basis to avoid cancellation.
 */
export function bezierLineCrossings(control,line){
 if(!Array.isArray(control)||control.length!==4||!control.every(coord)||!line||!coord(line.a)||!coord(line.d))return [];
 const f=control.map(p=>cross(sub(p,line.a),line.d));
 const scale=Math.max(...f.map(Math.abs));if(scale===0)return []; // Coincident curve: no discrete branches.
 const value=t=>{const u=1-t;return f[0]*u*u*u+3*f[1]*t*u*u+3*f[2]*t*t*u+f[3]*t*t*t;};
 const a=3*(-f[0]+3*f[1]-3*f[2]+f[3]);
 const b=6*(f[0]-2*f[1]+f[2]);
 const c=3*(f[1]-f[0]);
 const breaks=[0,1],coeff=Math.max(Math.abs(a),Math.abs(b),Math.abs(c));
 if(Math.abs(a)<=32*Number.EPSILON*coeff){if(Math.abs(b)>32*Number.EPSILON*coeff){const t=-c/b;if(t>0&&t<1)breaks.push(t);}}
 else{
  const disc=b*b-4*a*c;
  if(disc>=0){const sq=Math.sqrt(disc),q=-(b+Math.sign(b||1)*sq)/2;
   const roots=q!==0?[q/a,c/q]:[-b/(2*a)];
   for(const t of roots)if(t>0&&t<1&&Number.isFinite(t))breaks.push(t);
  }
 }
 breaks.sort((a,b)=>a-b);
 const tol=32*Number.EPSILON*scale,ts=[];
 const push=t=>{if(t>=0&&t<=1&&!ts.some(x=>Math.abs(x-t)<1e-11))ts.push(t);};
 for(const t of breaks)if(Math.abs(value(t))<=tol)push(t);
 for(let i=1;i<breaks.length;i++){
  let lo=breaks[i-1],hi=breaks[i],fl=value(lo),fh=value(hi);
  if(!((fl<0&&fh>0)||(fl>0&&fh<0)))continue;
  // Always refine even when |f| is small: nearby roots may have tiny ordinates.
  for(let k=0;k<90;k++){
   const mid=(lo+hi)/2;if(mid===lo||mid===hi)break;
   const fm=value(mid);if((fl<0&&fm<0)||(fl>0&&fm>0)){lo=mid;fl=fm;}else{hi=mid;fh=fm;}
  }
  push((lo+hi)/2);
 }
 const inside=t=>finiteLineInside(line,t);
 return ts.map(t=>{
  const u=1-t;
  return [0,1].map(k=>control[0][k]*u*u*u+3*control[1][k]*t*u*u+3*control[2][k]*t*t*u+control[3][k]*t*t*t);
 }).filter(coord).filter(p=>inside(dot(sub(p,line.a),line.d)))
  .sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
}
/** Exact circle against finite straight segments (not a polygonal circle).
 * Discrete path vertices remain resolved by the model; this does not attempt
 * to reinterpret sampled splines/freehand or inverted curves as straight.
 */
export function circlePolylineCrossings(circle,path){
 if(!circle||!coord(circle.center)||!finite(circle.radius)||!(circle.radius>0)||!Array.isArray(path))return [];
 const roots=[],r=circle.radius;
 for(let i=1;i<path.length;i++){
  const p=path[i-1],q=path[i];if(!coord(p)||!coord(q))continue;
  const u=sub(q,p),length=norm(u);if(!(length>0))continue;
  const w=sub(p,circle.center),projection=-dot(w,u)/(length*length),distance=Math.abs(cross(w,u))/length;
  const tol=distanceEpsilon(...circle.center,...p,...q,r);
  if(distance>r+tol)continue;
  const dt=Math.sqrt(Math.max(0,(r-distance)*(r+distance)))/length;
  for(const t of [projection-dt,projection+dt]){
   if(!segmentParameterInside(t,p,q))continue;
   const root=add(p,mul(u,Math.max(0,Math.min(1,t))));
   if(coord(root)&&!roots.some(q=>norm(sub(q,root))<=distanceEpsilon(...q,...root)))roots.push(root);
   if(roots.length>MAX_GENERAL_ROOTS)throw new RangeError('More than 10000 intersection roots; reduce the curve complexity.');
  }
 }
 return roots.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
}
/** Exact analytic intersections where possible; sampled curves otherwise.
 * Shared by construction and dependency resolution so saved branches agree. */
export function generalCrossings(first,second,resolver,count=160){
 if(!first||!second||first.id===second.id)return [];
 const la=resolver.line(first),lb=resolver.line(second);
 const ca=resolver.circle(first),cb=resolver.circle(second);
 // Points (including transformed single-point copies) must be tested against
 // analytic line/circle supports. The old sampled ±15-unit line and polygonal
 // circle approximation missed perfectly valid incidences.
 const isolated=o=>{
  const shape=r50SourceShape(o,resolver,3);
  return shape.length===1&&coord(shape[0])?shape[0]:null;
 };
 const pa=(!la&&!ca)?isolated(first):null,pb=(!lb&&!cb)?isolated(second):null;
 const pointOnLine=(p,line)=>{
  if(!coord(p)||!line||!coord(line.a)||!coord(line.d))return false;
  const distance=Math.abs(cross(sub(p,line.a),line.d));
  const precision=distanceEpsilon(p[0],p[1],line.a[0],line.a[1],line.length);
  if(distance>precision)return false;
  const t=dot(sub(p,line.a),line.d);
  const boundaryEps=distanceEpsilon(...p,...line.a,line.length);
  return line.domain==='infinite'||t>=-boundaryEps&&(line.domain==='ray'||t<=line.length+boundaryEps);
 };
 const pointOnCircle=(p,circle)=>coord(p)&&circle&&coord(circle.center)&&finite(circle.radius)
  &&Math.abs(norm(sub(p,circle.center))-circle.radius)<=Math.max(
   0,
   distanceEpsilon(...p,...circle.center,circle.radius));
 if(pa&&lb)return pointOnLine(pa,lb)?[pa]:[];
 if(pb&&la)return pointOnLine(pb,la)?[pb]:[];
 if(pa&&cb)return pointOnCircle(pa,cb)?[pa]:[];
 if(pb&&ca)return pointOnCircle(pb,ca)?[pb]:[];
 // Distinct isolated points do not intersect merely because they are close.
 // Use only representational roundoff of the stored coordinates, never a
 // drawing-pixel/world-size hit-test tolerance.
 if(pa&&pb)return (first.type==='point'&&second.type==='point'
   ?pa[0]===pb[0]&&pa[1]===pb[1]
   :pa[0]===pb[0]&&pa[1]===pb[1])?[pa]:[];
 const inside=finiteLineInside;
 const unique=points=>points.filter(coord).filter((p,i,all)=>all.findIndex(q=>
  coord(q)&&norm(sub(q,p))<=distanceEpsilon(...q,...p))===i);
 const sorted=points=>unique(points).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 if(la&&lb){
  const w=sub(lb.a,la.a),det=cross(la.d,lb.d);
  if(Math.abs(det)<PARALLEL_SINE_EPS)return [];
  const t=cross(w,lb.d)/det,u=cross(w,la.d)/det;
  return inside(la,t)&&inside(lb,u)?sorted([add(la.a,mul(la.d,t))]):[];
 }
 const lineCircle=(line,circle)=>{
  const w=sub(line.a,circle.center),offset=-dot(w,line.d);
  // Use perpendicular *distance*, not a squared-distance tolerance: a fixed
  // discriminant allowance turns genuine small-circle near misses into roots.
  const perpendicular=Math.abs(cross(w,line.d));
  const tolerance=distanceEpsilon(...line.a,...circle.center,circle.radius);
  if(perpendicular>circle.radius+tolerance)return [];
  const delta=Math.sqrt(Math.max(0,(circle.radius-perpendicular)*(circle.radius+perpendicular)));
  return unique([offset-delta,offset+delta].filter(t=>inside(line,t)).map(t=>add(line.a,mul(line.d,t))));
 };
 if(la&&cb)return lineCircle(la,cb);
 if(lb&&ca)return lineCircle(lb,ca);
 if(ca&&cb){
  const v=sub(cb.center,ca.center),d=norm(v),r=ca.radius,R=cb.radius;
  const tolerance=distanceEpsilon(...ca.center,...cb.center,r,R,d);
  if(d<=tolerance||d>r+R+tolerance||d<Math.abs(r-R)-tolerance)return [];
  const u=mul(v,1/d),x=(d+(r-R)*(r+R)/d)/2;
  // Factored height² avoids cancellation in the difference of similar squares.
  const height=Math.sqrt(Math.max(0,(r-x)*(r+x)));
  // Signed left/right branches remain stable when centers move across an
  // axis. Lexicographic sorting flipped the persisted rootIndex at dy=0.
  const foot=add(ca.center,mul(u,x));return unique([sub(foot,mul(left(u),height)),add(foot,mul(left(u),height))]);
 }
 // An unbounded straight support cannot be intersected through a ±15-unit
 // display polyline: it misses finite crossings farther along the line.
 const curveAgainstLine=(curve,line)=>{
  const path=r50SourceShape(curve,resolver,count),roots=[];
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i];if(!coord(a)||!coord(b))continue;
   const v=sub(b,a),len=norm(v),det=cross(line.d,v);
   if(!(len>0)||Math.abs(det)<PARALLEL_SINE_EPS*len)continue;
   const w=sub(a,line.a),t=cross(w,v)/det,u=cross(w,line.d)/det;
   if(inside(line,t)&&segmentParameterInside(u,a,b)){
    const root=add(line.a,mul(line.d,t));
    if(coord(root)&&!roots.some(q=>norm(sub(q,root))<=distanceEpsilon(...q,...root)))roots.push(root);
    if(roots.length>MAX_GENERAL_ROOTS)throw new RangeError('More than 10000 intersection roots; reduce the curve complexity.');
   }
  }
  // Match the historical spatial ordering of sampled intersections. Unlike
  // analytic signed branches, arbitrary sampled curve roots cannot yet be
  // tracked continuously; this remains an explicit follow-up audit item.
  return roots.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
 };
 if(la&&second.type==='bezier')return bezierLineCrossings(resolver.points(second),la);
 if(lb&&first.type==='bezier')return bezierLineCrossings(resolver.points(first),lb);
 if(la)return curveAgainstLine(second,la);
 if(lb)return curveAgainstLine(first,lb);
 const edgeTypes=new Set(['polyline','polygon','regularPolygon','rectangle','parallelogram']);
 if(ca&&edgeTypes.has(second.type))return circlePolylineCrossings(ca,r50SourceShape(second,resolver,count));
 if(cb&&edgeTypes.has(first.type))return circlePolylineCrossings(cb,r50SourceShape(first,resolver,count));
 const a=r50SourceShape(first,resolver,count),b=r50SourceShape(second,resolver,count);
 const pointOn=(point,path)=>{
  for(let i=1;i<path.length;i++){
   const u=sub(path[i],path[i-1]),len=dot(u,u);
   if(!(len>0))continue;
   const t=Math.max(0,Math.min(1,dot(sub(point,path[i-1]),u)/len));
   if(norm(sub(point,add(path[i-1],mul(u,t))))<=distanceEpsilon(...point,...path[i-1],...path[i]))return true;
  }
  return false;
 };
 if(a.length===1&&b.length===1)return (first.type==='point'&&second.type==='point'
  ?a[0][0]===b[0][0]&&a[0][1]===b[0][1]
  :a[0][0]===b[0][0]&&a[0][1]===b[0][1])?[a[0]]:[];
 if(a.length===1)return pointOn(a[0],b)?[a[0]]:[];
 if(b.length===1)return pointOn(b[0],a)?[b[0]]:[];
 return polylineCrossings(a,b);
}
export function r50Shape(o,resolver,samples=120,pathCache=null){if(!o)return [];
 const pts=()=>resolver.points(o),p=pts();
 if(o.type==='circularArc')return circleArcPoints(p,samples);
 if(o.type==='parabola')return parabolaPoints(resolver.at(o.refs[0]),resolver.line(o.refs[1]),samples);
 if(o.type==='hyperbola')return hyperbolaPoints(p,samples);
 if(o.type==='fixedAngle'&&p.every(coord)){
  const [a,b]=p,angle=o.angle,unitVec=unit(sub(a,b));if(!unitVec||!finite(angle))return [];
  const theta=Math.atan2(unitVec[1],unitVec[0]);const radius=Math.min(4,Math.max(.4,norm(sub(a,b))*.25));
  return Array.from({length:65},(_,i)=>add(b,mul([Math.cos(theta+angle*i/64),Math.sin(theta+angle*i/64)],radius)));
 }
 if(o.type==='transformCopy'){
  // Follow the source chain iteratively. Recursive expansion overflowed the JS
  // stack for long affine *curve* chains even though point chains already used
  // an iterative resolver. Preserve the historical order and inversion rules.
  const chain=[],seen=new Set();let src=o;
  while(src?.type==='transformCopy'&&!pathCache?.has(src.id)){
   if(seen.has(src.id))return [];seen.add(src.id);chain.push(src);
   src=resolver.object(src.refs?.[0]);
  }
  if(!src)return [];
  // Inversion used >=96 samples at every level below it. The maximum base
  // sample rate is sufficient without repeatedly resampling transformed paths.
  const baseCount=chain.some(x=>x.transform==='invert')?Math.max(96,samples):samples;
  let path=pathCache?.get(src.id)||r50SourceShape(src,resolver,baseCount,pathCache);
  for(let i=chain.length-1;i>=0;i--){
   const transform=chain[i],source=i===chain.length-1?src:chain[i+1];
   if(!path.length)return [];
   if(transform.transform==='reflect'){
    const line=resolver.line(transform.refs[1]);if(!line)return [];
    path=path.map(p=>transformPoint(p,'reflect',line.a,0,add(line.a,line.d))).filter(coord);
   }else if(transform.transform==='invert'){
    const circle=resolver.circle(transform.refs[1]);if(!circle||!coord(circle.center)||!(circle.radius>0))return [];
    const isPoint=!!resolver.at(source.id),sampled=[];
    const needsSubdivision=!!resolver.line(source)||['polygon','rectangle','parallelogram','regularPolygon','polyline'].includes(source.type);
    for(let j=0;j<path.length;j++){
     const current=path[j];if(!coord(current)){sampled.push(null);continue;}
     if(j&&needsSubdivision&&coord(path[j-1])){
      const previous=path[j-1],length=norm(sub(current,previous));
      const pieces=Math.min(96,Math.max(1,Math.ceil(length/Math.max(circle.radius*.12,.1))));
      for(let k=1;k<pieces;k++)sampled.push(add(previous,mul(sub(current,previous),k/pieces)));
     }
     sampled.push(current);
    }
    const result=[],radius=circle.radius,limit=1e6;
    for(let j=0;j<sampled.length;j++){
     const point=sampled[j];const transformed=coord(point)?transformPoint(point,'invert',circle.center,radius):null;
     result.push(transformed&&norm(sub(transformed,circle.center))<limit?transformed:null);
     if(j&&coord(sampled[j-1])&&coord(point)&&result.at(-2)&&result.at(-1)){
      const ab=sub(point,sampled[j-1]),d2=dot(ab,ab);
      const t=d2>1e-18?Math.max(0,Math.min(1,dot(sub(circle.center,sampled[j-1]),ab)/d2)):0;
      const closest=add(sampled[j-1],mul(ab,t));
      if(norm(sub(closest,circle.center))<Math.max(1e-8,radius*1e-5))result.splice(result.length-1,0,null);
     }
    }
    path=isPoint?result.filter(coord):result;
   }else{
    const anchor=resolver.at(transform.refs[1]),other=transform.transform==='translate'?resolver.at(transform.refs[2]):null;
    path=path.map(p=>transformPoint(p,transform.transform,anchor,transform.amount,other)).filter(coord);
   }
   pathCache?.set(transform.id,path);
  }
  return path;
 }
 return [];
}
export function r50SourceShape(o,resolver,count=120,pathCache=null){if(!o)return [];
 if(o.type==='transformCopy'&&pathCache?.has(o.id))return pathCache.get(o.id);
 if(['point','midpoint','perpendicularFoot','pointOnObject','triangleCenter','intersection','circleIntersection','circleCircleIntersection','generalIntersection'].includes(o.type)){const p=resolver.at(o.id);return p?[p]:[];}
 const line=resolver.line(o);if(line){const span=line.domain==='segment'?line.length:line.domain==='ray'?15:30;
  const path=line.domain==='infinite'?[add(line.a,mul(line.d,-span/2)),add(line.a,mul(line.d,span/2))]:[line.a,add(line.a,mul(line.d,span))];
  if(line.domain!=='segment')path.domain=line.domain;return path;}
 if(o.type==='circle'||o.type==='circleThrough3'){
  const c=resolver.circle(o);return c?Array.from({length:count+1},(_,i)=>add(c.center,mul([Math.cos(tau*i/count),Math.sin(tau*i/count)],c.radius))):[];
 }
 if(o.type==='ellipse'){
  const p=resolver.points(o);
  // Legacy v1 stored ellipse corners instead of two foci and a curve point.
  // The renderer still draws these: geometry consumers must see the same path.
  if(p.length===2&&p.every(coord)){
   const [a,b]=p,c=mul(add(a,b),.5),rx=Math.abs(a[0]-b[0])/2,ry=Math.abs(a[1]-b[1])/2;
   if(!(rx>0&&ry>0))return [a,b]; // Matches the rendered limiting line.
   return Array.from({length:count+1},(_,i)=>[c[0]+rx*Math.cos(tau*i/count),c[1]+ry*Math.sin(tau*i/count)]);
  }
  if(p.length!==3)return [];
  const [f,g,q]=p;if(![f,g,q].every(coord))return [];const mid=mul(add(f,g),.5),axis=unit(sub(g,f))||[1,0];
  const c=norm(sub(g,f))/2,a=(norm(sub(q,f))+norm(sub(q,g)))/2,b=Math.sqrt(Math.max(0,a*a-c*c));if(!(b>0))return [];
  const perp=left(axis);return Array.from({length:count+1},(_,i)=>add(add(mid,mul(axis,a*Math.cos(tau*i/count))),mul(perp,b*Math.sin(tau*i/count))));
 }
 if(o.type==='polygon'){const pts=resolver.points(o).filter(coord);return pts.length>2?[...pts,pts[0]]:[];}
 if(o.type==='regularPolygon'){
  const [center,vertex]=resolver.points(o),n=o.sides;if(!coord(center)||!coord(vertex)||!Number.isInteger(n)||n<3||n>100)return [];
  if(!distinctPoints(center,vertex))return [];
  const r=norm(sub(vertex,center)),t=Math.atan2(vertex[1]-center[1],vertex[0]-center[0]);
  return Array.from({length:n+1},(_,i)=>add(center,mul([Math.cos(t+tau*i/n),Math.sin(t+tau*i/n)],r)));
 }
 if(['rectangle','parallelogram'].includes(o.type)){
  const p=resolver.points(o);if(!p.every(coord))return [];
  if(o.type==='rectangle'&&p.length===2){
   const [a,b]=p,minX=Math.min(a[0],b[0]),maxX=Math.max(a[0],b[0]),minY=Math.min(a[1],b[1]),maxY=Math.max(a[1],b[1]);
   if(!(maxX>minX&&maxY>minY))return [];
   return [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY],[minX,minY]];
  }
  if(p.length!==3)return [];
  const [a,b,c]=p;if(o.type==='parallelogram'){if(!independentEdges(a,b,c))return [];const d=add(a,sub(c,b));return [a,b,c,d,a];}
  if(!perpendicularHeightNonzero(a,b,c))return [];
  const d=sub(b,a),side=unit(left(d));if(!side)return [];
  const h=dot(sub(c,b),side),v=mul(side,h);return [a,b,add(b,v),add(a,v),a];
 }
 if(o.type==='bezier'){
  const p=resolver.points(o);if(p.length!==4||!p.every(coord))return [];
  return Array.from({length:count+1},(_,i)=>{const t=i/count,s=1-t;return add(add(mul(p[0],s*s*s),mul(p[1],3*s*s*t)),add(mul(p[2],3*s*t*t),mul(p[3],t*t*t)));});
 }
 if(o.type==='polyline'||o.type==='spline')return resolver.points(o).filter(coord);

 if(o.type==='transformCopy'){
  // Point-image chains have already been resolved iteratively. Never recurse
  // through thousands of parents just to obtain a one-element shape.
  const resolved=resolver.at(o.id);if(coord(resolved))return [resolved];
 }
 if(['circularArc','parabola','hyperbola','fixedAngle','transformCopy'].includes(o.type))return r50Shape(o,resolver,count,pathCache);
 return [];
}
