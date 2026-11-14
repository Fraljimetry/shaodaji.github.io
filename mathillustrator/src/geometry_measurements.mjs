/** Read-only, document-independent measurements derived from live geometry.
 * Invalid / non-simple outlines intentionally do not advertise a misleading area.
 * No rounded result is ever written back into the project model.
 */
import {derivedShapeVertices, focalEllipse} from './model.mjs?cut=round54';
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function intersects(a,b,c,d){
 const ab=cross(a,b,c),ab2=cross(a,b,d),cd=cross(c,d,a),cd2=cross(c,d,b);
 // Reject both strict crossings and collinear/non-neighbor touching edges.
 const eps=1e-12*Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])*Math.hypot(d[0]-c[0],d[1]-c[1]));
 if(Math.abs(ab)<=eps&&Math.min(a[0],b[0])-eps<=c[0]&&c[0]<=Math.max(a[0],b[0])+eps&&Math.min(a[1],b[1])-eps<=c[1]&&c[1]<=Math.max(a[1],b[1])+eps)return true;
 if(Math.abs(ab2)<=eps&&Math.min(a[0],b[0])-eps<=d[0]&&d[0]<=Math.max(a[0],b[0])+eps&&Math.min(a[1],b[1])-eps<=d[1]&&d[1]<=Math.max(a[1],b[1])+eps)return true;
 if(Math.abs(cd)<=eps&&Math.min(c[0],d[0])-eps<=a[0]&&a[0]<=Math.max(c[0],d[0])+eps&&Math.min(c[1],d[1])-eps<=a[1]&&a[1]<=Math.max(c[1],d[1])+eps)return true;
 if(Math.abs(cd2)<=eps&&Math.min(c[0],d[0])-eps<=b[0]&&b[0]<=Math.max(c[0],d[0])+eps&&Math.min(c[1],d[1])-eps<=b[1]&&b[1]<=Math.max(c[1],d[1])+eps)return true;
 return ab*ab2<-eps*eps&&cd*cd2<-eps*eps;
}
export function polygonArea(vertices){
 if(!Array.isArray(vertices)||vertices.length<3||vertices.length>10000||!vertices.every(valid))return null;
 const n=vertices.length,anchor=vertices[0];
 for(let i=0;i<n;i++){
  const a=vertices[i],b=vertices[(i+1)%n];
  if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-10)return null;
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
 return Number.isFinite(area)&&area>1e-12?area:null;
}
export function measureGeometry(o,resolver){
 if(!o||!resolver)return null;
 const p=resolver.points(o);
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
