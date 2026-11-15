/** Read-only, document-independent measurements derived from live geometry.
 * Invalid / non-simple outlines intentionally do not advertise a misleading area.
 * No rounded result is ever written back into the project model.
 */
import {derivedShapeVertices, focalEllipse} from './model.mjs?cut=round147';
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function intersects(a,b,c,d){
 const ab=cross(a,b,c),ab2=cross(a,b,d),cd=cross(c,d,a),cd2=cross(c,d,b);
 // Orientation error scales with the products used in the determinant, not
 // with a fixed world-unit floor (which invalidated microscopic polygons).
 const err=(p,q,r)=>{
  const ux=q[0]-p[0],uy=q[1]-p[1],vx=r[0]-p[0],vy=r[1]-p[1];
  return 16*Number.EPSILON*(Math.abs(ux*vy)+Math.abs(uy*vx));
 };
 const on=(p,q,r,cr)=>Math.abs(cr)<=err(p,q,r)&&
  r[0]>=Math.min(p[0],q[0])&&r[0]<=Math.max(p[0],q[0])&&
  r[1]>=Math.min(p[1],q[1])&&r[1]<=Math.max(p[1],q[1]);
 if(on(a,b,c,ab)||on(a,b,d,ab2)||on(c,d,a,cd)||on(c,d,b,cd2))return true;
 return ((ab>err(a,b,c)&&ab2< -err(a,b,d))||(ab< -err(a,b,c)&&ab2>err(a,b,d)))&&
        ((cd>err(c,d,a)&&cd2< -err(c,d,b))||(cd< -err(c,d,a)&&cd2>err(c,d,b)));
}
export function polygonArea(vertices){
 if(!Array.isArray(vertices)||vertices.length<3||vertices.length>10000||!vertices.every(valid))return null;
 const n=vertices.length,anchor=vertices[0];
 for(let i=0;i<n;i++){
  const a=vertices[i],b=vertices[(i+1)%n];
  if(a[0]===b[0]&&a[1]===b[1])return null;
  for(let j=i+1;j<n;j++){
   if(j===i+1||(i===0&&j===n-1))continue;
   if(intersects(a,b,vertices[j],vertices[(j+1)%n]))return null;
  }
 }
 let twice=0;
 for(let i=0;i<n;i++){
  const a=vertices[i],b=vertices[(i+1)%n];
  twice+=(a[0]-anchor[0])*(b[1]-anchor[1])-(a[1]-anchor[1])*(b[0]-anchor[0]);
 }
 const area=Math.abs(twice)/2;
 return Number.isFinite(area)&&area>0?area:null;
}
export function measureGeometry(o,resolver){
 if(!o||!resolver)return null;
 const p=resolver.points(o);
 if(o.type==='transformCopy'&&resolver.line(o)?.domain==='segment'){
  const length=resolver.line(o).length;
  return {kind:'length',value:Number.isFinite(length)&&length>=0?length:null};
 }
 if(o.type==='segment'||o.type==='fixedLength'){
  if(p.length!==2||!p.every(valid))return {kind:'length',value:null};
  const length=o.type==='fixedLength'?resolver.line(o)?.length:Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1]);
  return {kind:'length',value:Number.isFinite(length)&&length>=0?length:null};
 }
 if(o.type==='angle'){
  if(p.length!==3||!p.every(valid))return {kind:'angle',value:null};
  const a=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]),b=Math.hypot(p[2][0]-p[1][0],p[2][1]-p[1][1]);
  if(a<1e-10||b<1e-10)return {kind:'angle',value:null};
  const one=Math.atan2(p[0][1]-p[1][1],p[0][0]-p[1][0]),two=Math.atan2(p[2][1]-p[1][1],p[2][0]-p[1][0]);
  let sweep=(two-one+2*Math.PI)%(2*Math.PI);if(sweep>Math.PI)sweep-=2*Math.PI;
  return {kind:'angle',value:Math.abs(sweep*180/Math.PI)};
 }
 if(['polygon','rectangle','parallelogram','regularPolygon'].includes(o.type)){
  const vertices=o.type==='polygon'?p:derivedShapeVertices(o,resolver.at);
  return {kind:'area',value:polygonArea(vertices)};
 }
 if(['circle','circleThrough3'].includes(o.type)){
  const c=resolver.circle(o),area=c?Math.PI*c.radius*c.radius:null;
  return {kind:'area',value:Number.isFinite(area)&&area>0?area:null};
 }
 if(o.type==='ellipse'){
  let area=null;
  if(p.length===3){const ellipse=focalEllipse(p);if(ellipse)area=Math.PI*ellipse.rx*ellipse.ry;}
  else if(p.length===2&&p.every(valid))area=Math.PI*Math.abs((p[1][0]-p[0][0])*(p[1][1]-p[0][1]))/4;
  return {kind:'area',value:Number.isFinite(area)&&area>1e-12?area:null};
 }
 return null;
}
