/** Round 55 deployment contract: generalCrossings is a required named export.
 * Round 50 geometry primitives. Pure world-coordinate mathematics; no canvas/DOM.
 * Finite and singularity guards are deliberate: undefined geometry must never
 * silently become a point at the origin or a malformed SVG path.
 */
const tau=2*Math.PI, finite=n=>Number.isFinite(n)&&Math.abs(n)<1e9;
const coord=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],mul=(p,s)=>[p[0]*s,p[1]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const norm=a=>Math.hypot(...a),left=a=>[-a[1],a[0]];
const unit=a=>{const n=norm(a);return n>1e-10?mul(a,1/n):null};
export const R50_TYPES=['pointOnObject','tangentCircle','circularArc','parabola','hyperbola','generalIntersection','transformCopy','locus','fixedLength','fixedAngle','triangleCenter'];
export const R50_POINT_TYPES=['pointOnObject','generalIntersection','triangleCenter'];
export const R50_CURVE_TYPES=['circularArc','parabola','hyperbola','transformCopy','locus','fixedAngle'];
export const TRANSFORM_MODES=['reflect','rotate','translate','dilate','invert'];
export const CENTER_KINDS=['centroid','circumcenter','incenter','orthocenter','excenterA','excenterB','excenterC'];
export function circum(p){if(!p||p.length!==3||!p.every(coord))return null;
 const [a,b,c]=p,u=sub(b,a),v=sub(c,a),det=2*cross(u,v);
 if(Math.abs(det)<1e-10*Math.max(1,norm(u)*norm(v)))return null;
 const x=(dot(u,u)*v[1]-dot(v,v)*u[1])/det,y=(dot(v,v)*u[0]-dot(u,u)*v[0])/det,center=add(a,[x,y]);
 return coord(center)?{center,radius:norm([x,y])}:null;
}
export function triangleCenter(p,kind){if(!p||p.length!==3||!p.every(coord))return null;
 const [a,b,c]=p,C=circum(p),sa=norm(sub(b,c)),sb=norm(sub(a,c)),sc=norm(sub(a,b)),per=sa+sb+sc;
 if(kind==='centroid')return mul(add(add(a,b),c),1/3);
 if(kind==='circumcenter')return C?.center||null;
 if(kind==='orthocenter')return C?sub(add(add(a,b),c),mul(C.center,2)):null;
 if(kind==='incenter'&&C&&per>1e-10)return mul(add(add(mul(a,sa),mul(b,sb)),mul(c,sc)),1/per);
 if(['excenterA','excenterB','excenterC'].includes(kind)&&C){
  const i={excenterA:0,excenterB:1,excenterC:2}[kind],w=[sa,sb,sc].map((v,j)=>j===i?-v:v),den=w[0]+w[1]+w[2];
  // Negative barycentric weight at the chosen opposite vertex.
  // Flipping the numerator and denominator gives the usual excenter.
  if(Math.abs(den)>1e-10)return mul(add(add(mul(a,w[0]),mul(b,w[1])),mul(c,w[2])),1/den);
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
 if(distance<1e-9)return [];
 const axis=unit(sep),side=left(axis),vertex=mul(add(focus,foot),.5),p=distance/2;
 const span=Math.min(30,Math.max(3,5*distance));
 return Array.from({length:count+1},(_,i)=>{const s=(2*i/count-1)*span;return add(add(vertex,mul(side,s)),mul(axis,s*s/(4*p)));}).filter(coord);
}
export function hyperbolaPoints(points,count=128){if(!points?.every(coord)||points.length!==3)return [];
 const [f,g,on]=points,mid=mul(add(f,g),.5),c=norm(sub(g,f))/2;if(c<=1e-9)return [];
 const a=Math.abs(norm(sub(on,f))-norm(sub(on,g)))/2;if(a<=1e-9||a>=c-1e-9)return [];
 const b=Math.sqrt(c*c-a*a),axis=unit(sub(g,f)),perp=left(axis);
 // The selected third point determines the displayed branch.
 const sgn=dot(sub(on,mid),axis)>=0?1:-1;
 return Array.from({length:count+1},(_,i)=>{const t=10*(i/count-.5);return add(add(mid,mul(axis,sgn*a*Math.cosh(t))),mul(perp,b*Math.sinh(t)));}).filter(coord);
}
export function projectToCurve(world,path,closed=false){if(!coord(world)||!Array.isArray(path)||path.length<2)return null;
 let best=null,position=0,total=0;const segments=[];
 for(let i=1;i<path.length+(closed?1:0);i++){
  const a=path[i-1],b=path[i%path.length];if(!coord(a)||!coord(b))continue;
  const d=sub(b,a),length=norm(d);if(length<1e-9)continue;
  const t=Math.max(0,Math.min(1,dot(sub(world,a),d)/(length*length))),p=add(a,mul(d,t)),dist=norm(sub(world,p));
  segments.push({a,b,length,offset:total});if(!best||dist<best.dist)best={p,dist,length,t,offset:total};total+=length;
 }
 return best&&total>0?{parameter:(best.offset+best.length*best.t)/total,position:best.p}:null;
}
export function alongCurve(path,parameter,closed=false){if(!Array.isArray(path)||path.length<2||!finite(parameter))return null;
 const seg=[],limit=path.length+(closed?1:0);let total=0;
 for(let i=1;i<limit;i++){const a=path[i-1],b=path[i%path.length];if(!coord(a)||!coord(b))continue;const length=norm(sub(b,a));if(length>1e-10){seg.push({a,b,length});total+=length;}}
 if(total<1e-10)return null;let remaining=Math.max(0,Math.min(1,parameter))*total;
 for(const s of seg){if(remaining<=s.length)return add(s.a,mul(sub(s.b,s.a),remaining/s.length));remaining-=s.length;}
 return seg.at(-1).b;
}
export function pointOnObject(owner,parameter,resolver,shapeSamples,constraintMode=null){if(!owner||!finite(parameter))return null;
 if(owner.type==='fixedAngle'&&constraintMode==='angleRay'){
  const [guide,vertex]=resolver.points(owner);if(!coord(guide)||!coord(vertex)||!finite(owner.angle))return null;
  const direction=unit(sub(guide,vertex));if(!direction)return null;
  const c=Math.cos(owner.angle),s=Math.sin(owner.angle);
  return add(vertex,mul([direction[0]*c-direction[1]*s,direction[0]*s+direction[1]*c],30*parameter));
 }
 const line=resolver.line(owner);if(line){const length=line.domain==='segment'?line.length:line.domain==='ray'?15:30;
  return add(line.a,mul(line.d,line.domain==='infinite'?(parameter-.5)*length:parameter*length));}
 const circle=resolver.circle(owner);
 if(circle)return add(circle.center,mul([Math.cos(parameter*tau),Math.sin(parameter*tau)],circle.radius));
 return alongCurve(shapeSamples(owner,resolver),parameter,owner.type==='ellipse');
}
export function circleTangents(point,circle){if(!coord(point)||!circle)return [];
 const w=sub(point,circle.center),d2=dot(w,w),r2=circle.radius**2;
 if(!finite(d2)||d2<=r2+1e-9)return [];
 const factor=r2/d2,offset=Math.sqrt(Math.max(0,r2*(d2-r2)))/d2;
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
 if(mode==='invert'&&finite(amount)&&amount>1e-9){
  const v=sub(p,source),d2=dot(v,v);
  if(d2>1e-18)result=add(source,mul(v,amount*amount/d2));
 }
 return coord(result)?result:null;
}
export function polylineCrossings(a,b){if(a?.length<2||b?.length<2)return [];
 const result=[];
 for(let i=1;i<a.length;i++)for(let j=1;j<b.length;j++){
  const p=a[i-1],q=b[j-1];if(!coord(p)||!coord(a[i])||!coord(q)||!coord(b[j]))continue;const u=sub(a[i],p),v=sub(b[j],q),det=cross(u,v);if(Math.abs(det)<1e-10)continue;
  const w=sub(q,p),t=cross(w,v)/det,s=cross(w,u)/det;
  if(t>=-1e-9&&t<=1+1e-9&&s>=-1e-9&&s<=1+1e-9){const root=add(p,mul(u,t));
   if(coord(root)&&!result.some(x=>norm(sub(x,root))<1e-4))result.push(root);}
 }
 return result.sort((p,q)=>p[0]-q[0]||p[1]-q[1]).slice(0,32);
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
  if(distance>1e-7*Math.max(1,norm(sub(p,line.a))))return false;
  const t=dot(sub(p,line.a),line.d);
  return line.domain==='infinite'||t>=-1e-8&&(line.domain==='ray'||t<=line.length+1e-8);
 };
 const pointOnCircle=(p,circle)=>coord(p)&&circle&&coord(circle.center)&&finite(circle.radius)
  &&Math.abs(norm(sub(p,circle.center))-circle.radius)<=1e-7*Math.max(1,circle.radius);
 if(pa&&lb)return pointOnLine(pa,lb)?[pa]:[];
 if(pb&&la)return pointOnLine(pb,la)?[pb]:[];
 if(pa&&cb)return pointOnCircle(pa,cb)?[pa]:[];
 if(pb&&ca)return pointOnCircle(pb,ca)?[pb]:[];
 if(pa&&pb)return norm(sub(pa,pb))<1e-7?[pa]:[];
 const inside=(line,t)=>line.domain==='infinite'||t>=-1e-8&&(line.domain==='ray'||t<=line.length+1e-8);
 const sorted=points=>points.filter(coord).filter((p,i,all)=>all.findIndex(q=>coord(q)&&norm(sub(q,p))<1e-7)===i).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).slice(0,32);
 if(la&&lb){
  const w=sub(lb.a,la.a),det=cross(la.d,lb.d);
  if(Math.abs(det)<1e-12)return [];
  const t=cross(w,lb.d)/det,u=cross(w,la.d)/det;
  return inside(la,t)&&inside(lb,u)?sorted([add(la.a,mul(la.d,t))]):[];
 }
 const lineCircle=(line,circle)=>{
  const w=sub(line.a,circle.center),offset=-dot(w,line.d),discriminant=offset*offset+circle.radius**2-dot(w,w);
  if(discriminant < -1e-9)return [];
  const delta=Math.sqrt(Math.max(0,discriminant));
  return sorted([offset-delta,offset+delta].filter(t=>inside(line,t)).map(t=>add(line.a,mul(line.d,t))));
 };
 if(la&&cb)return lineCircle(la,cb);
 if(lb&&ca)return lineCircle(lb,ca);
 if(ca&&cb){
  const v=sub(cb.center,ca.center),d=norm(v),r=ca.radius,R=cb.radius;
  if(d<1e-10||d>r+R+1e-9||d<Math.abs(r-R)-1e-9)return [];
  const u=mul(v,1/d),x=(r*r-R*R+d*d)/(2*d),height=Math.sqrt(Math.max(0,r*r-x*x));
  const foot=add(ca.center,mul(u,x));return sorted([add(foot,mul(left(u),height)),sub(foot,mul(left(u),height))]);
 }
 const a=r50SourceShape(first,resolver,count),b=r50SourceShape(second,resolver,count);
 const pointOn=(point,path)=>{
  for(let i=1;i<path.length;i++){
   const u=sub(path[i],path[i-1]),len=dot(u,u);
   if(!(len>1e-20))continue;
   const t=Math.max(0,Math.min(1,dot(sub(point,path[i-1]),u)/len));
   if(norm(sub(point,add(path[i-1],mul(u,t))))<1e-6)return true;
  }
  return false;
 };
 if(a.length===1&&b.length===1)return norm(sub(a[0],b[0]))<1e-7?[a[0]]:[];
 if(a.length===1)return pointOn(a[0],b)?[a[0]]:[];
 if(b.length===1)return pointOn(b[0],a)?[b[0]]:[];
 return polylineCrossings(a,b);
}
export function r50Shape(o,resolver,samples=120){if(!o)return [];
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
  const src=resolver.object(o.refs[0]);if(!src||src.id===o.id)return [];
  const anchor=resolver.at(o.refs[1]);let other=null;
  if(o.transform==='reflect'){const line=resolver.line(o.refs[1]);if(!line)return [];return r50SourceShape(src,resolver,samples).map(p=>transformPoint(p,'reflect',line.a,0,add(line.a,line.d))).filter(coord);}
  if(o.transform==='invert'){
   const circle=resolver.circle(o.refs[1]);if(!circle||!coord(circle.center)||!(circle.radius>1e-9))return [];
   const isPoint=!!resolver.at(src.id);
   const sourcePath=r50SourceShape(src,resolver,Math.max(96,samples));
   if(!sourcePath.length)return [];
   // Straight edges become circular arcs after inversion. Subdivide BEFORE
   // inversion; simply joining transformed polygon vertices is incorrect.
   const sampled=[];const line=resolver.line(src);
   const needsSubdivision=!!line||['polygon','rectangle','parallelogram','regularPolygon','polyline'].includes(src.type);
   for(let i=0;i<sourcePath.length;i++){
    const current=sourcePath[i];if(!coord(current)){sampled.push(null);continue;}
    if(i&&needsSubdivision&&coord(sourcePath[i-1])){
     const previous=sourcePath[i-1],length=norm(sub(current,previous));
     const pieces=Math.min(96,Math.max(1,Math.ceil(length/Math.max(circle.radius*.12,.1))));
     for(let j=1;j<pieces;j++)sampled.push(add(previous,mul(sub(current,previous),j/pieces)));
    }
    sampled.push(current);
   }
   const result=[];const radius=circle.radius,limit=1e6;
   for(let i=0;i<sampled.length;i++){
    const p=sampled[i];
    const transformed=coord(p)?transformPoint(p,'invert',circle.center,radius):null;
    // Keep separators: dropping a singular sample and joining its neighbors
    // creates a false line passing through infinity.
    result.push(transformed&&norm(sub(transformed,circle.center))<limit?transformed:null);
    if(i&&coord(sampled[i-1])&&coord(p)&&result.at(-2)&&result.at(-1)){
     const ab=sub(p,sampled[i-1]),d2=dot(ab,ab);
     const t=d2>1e-18?Math.max(0,Math.min(1,dot(sub(circle.center,sampled[i-1]),ab)/d2)):0;
     const closest=add(sampled[i-1],mul(ab,t));
     if(norm(sub(closest,circle.center))<Math.max(1e-8,radius*1e-5))result.splice(result.length-1,0,null);
    }
   }
   // A singularity is not a valid isolated point; regular samples survive.
   return isPoint?result.filter(coord):result;
  }
  if(o.transform==='translate')other=resolver.at(o.refs[2]);
  return r50SourceShape(src,resolver,samples).map(p=>transformPoint(p,o.transform,anchor,o.amount,other)).filter(coord);
 }
 return [];
}
export function r50SourceShape(o,resolver,count=120){if(!o)return [];
 if(['point','midpoint','perpendicularFoot','pointOnObject','triangleCenter','intersection','circleIntersection','circleCircleIntersection','generalIntersection'].includes(o.type)){const p=resolver.at(o.id);return p?[p]:[];}
 const line=resolver.line(o);if(line){const span=line.domain==='segment'?line.length:line.domain==='ray'?15:30;return line.domain==='infinite'?[add(line.a,mul(line.d,-span/2)),add(line.a,mul(line.d,span/2))]:[line.a,add(line.a,mul(line.d,span))];}
 if(o.type==='circle'||o.type==='circleThrough3'){
  const c=resolver.circle(o);return c?Array.from({length:count+1},(_,i)=>add(c.center,mul([Math.cos(tau*i/count),Math.sin(tau*i/count)],c.radius))):[];
 }
 if(o.type==='ellipse'){
  const p=resolver.points(o);
  // Legacy v1 stored ellipse corners instead of two foci and a curve point.
  // The renderer still draws these: geometry consumers must see the same path.
  if(p.length===2&&p.every(coord)){
   const [a,b]=p,c=mul(add(a,b),.5),rx=Math.abs(a[0]-b[0])/2,ry=Math.abs(a[1]-b[1])/2;
   if(rx<1e-7||ry<1e-7)return [a,b]; // Matches the rendered limiting line.
   return Array.from({length:count+1},(_,i)=>[c[0]+rx*Math.cos(tau*i/count),c[1]+ry*Math.sin(tau*i/count)]);
  }
  if(p.length!==3)return [];
  const [f,g,q]=p;if(![f,g,q].every(coord))return [];const mid=mul(add(f,g),.5),axis=unit(sub(g,f))||[1,0];
  const c=norm(sub(g,f))/2,a=(norm(sub(q,f))+norm(sub(q,g)))/2,b=Math.sqrt(Math.max(0,a*a-c*c));if(b<1e-9)return [];
  const perp=left(axis);return Array.from({length:count+1},(_,i)=>add(add(mid,mul(axis,a*Math.cos(tau*i/count))),mul(perp,b*Math.sin(tau*i/count))));
 }
 if(o.type==='polygon'){const pts=resolver.points(o).filter(coord);return pts.length>2?[...pts,pts[0]]:[];}
 if(o.type==='regularPolygon'){
  const [center,vertex]=resolver.points(o),n=o.sides;if(!coord(center)||!coord(vertex)||!Number.isInteger(n)||n<3||n>100)return [];
  const r=norm(sub(vertex,center)),t=Math.atan2(vertex[1]-center[1],vertex[0]-center[0]);
  return Array.from({length:n+1},(_,i)=>add(center,mul([Math.cos(t+tau*i/n),Math.sin(t+tau*i/n)],r)));
 }
 if(['rectangle','parallelogram'].includes(o.type)){
  const p=resolver.points(o);if(!p.every(coord))return [];
  if(o.type==='rectangle'&&p.length===2){
   const [a,b]=p,minX=Math.min(a[0],b[0]),maxX=Math.max(a[0],b[0]),minY=Math.min(a[1],b[1]),maxY=Math.max(a[1],b[1]);
   if(maxX-minX<1e-9||maxY-minY<1e-9)return [];
   return [[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY],[minX,minY]];
  }
  if(p.length!==3)return [];
  const [a,b,c]=p;if(o.type==='parallelogram'){const d=add(a,sub(c,b));return [a,b,c,d,a];}
  const d=sub(b,a),side=unit(left(d));if(!side)return [];
  const h=dot(sub(c,b),side),v=mul(side,h);return [a,b,add(b,v),add(a,v),a];
 }
 if(o.type==='bezier'){
  const p=resolver.points(o);if(p.length!==4||!p.every(coord))return [];
  return Array.from({length:count+1},(_,i)=>{const t=i/count,s=1-t;return add(add(mul(p[0],s*s*s),mul(p[1],3*s*s*t)),add(mul(p[2],3*s*t*t),mul(p[3],t*t*t)));});
 }
 if(o.type==='polyline'||o.type==='spline')return resolver.points(o).filter(coord);

 if(['circularArc','parabola','hyperbola','fixedAngle','transformCopy'].includes(o.type))return r50Shape(o,resolver,count);
 return [];
}
