/** Bounded, deterministic, opt-in diagram routing in screen pixels.
 * The semantic edge and its endpoint references are never changed. If no
 * obstacle-free two-turn corridor exists, keep a visibly warned direct path
 * rather than silently claiming the route was corrected.
 */
import {edgeBetweenBoxes} from './diagram_layout.mjs';
const CLEARANCE=10;
function finitePoint(p){return Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);}
export function boxRect(center,box,margin=0){
 const [x,y]=center;
 return {left:x-box.width/2-margin,right:x+box.width/2+margin,top:y-box.height/2-margin,bottom:y+box.height/2+margin};
}
/** Liang–Barsky line-vs-closed-rectangle intersection, including a tangent. */
export function segmentHitsBox(a,b,r){
 if(!finitePoint(a)||!finitePoint(b)||!r)return false;
 let lower=0,upper=1;const dx=b[0]-a[0],dy=b[1]-a[1];
 for(const [p,q] of [[-dx,a[0]-r.left],[dx,r.right-a[0]],[-dy,a[1]-r.top],[dy,r.bottom-a[1]]]){
  if(Math.abs(p)<1e-12){if(q<0)return false;continue;}
  const ratio=q/p;
  if(p<0)lower=Math.max(lower,ratio);else upper=Math.min(upper,ratio);
  if(lower>upper)return false;
 }
 return true;
}
function hitPath(points,obstacles){
 for(let i=1;i<points.length;i++)for(const obstacle of obstacles)if(segmentHitsBox(points[i-1],points[i],obstacle))return true;
 return false;
}
function cost(points){let n=0;for(let i=1;i<points.length;i++)n+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);return n;}
function samePoint(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])<1e-6;}
// Proper INTERIOR intersections only: a common arrow endpoint is not a crossing.
// Conservative bounding-box pruning precedes the orientation checks. This is
// screen-space geometry and does not establish mathematical graph-planarity.
function strictIntersection(a,b,c,d){
 const gap=1e-7;
 if(Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))>Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))+gap||
    Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))>Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]))+gap)return false;
 const cross=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);
 const scale=Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])*Math.hypot(d[0]-c[0],d[1]-c[1]));
 const eps=1e-10*scale;
 const q1=cross(a,b,c),q2=cross(a,b,d),q3=cross(c,d,a),q4=cross(c,d,b);
 return (q1>eps&&q2< -eps||q1< -eps&&q2>eps)&&
        (q3>eps&&q4< -eps||q3< -eps&&q4>eps);
}
/** Count genuine interior crossings against already drawn arrow polylines.
 * Supports stable, document-order, best-effort routing without moving semantics.
 * Bounds comparisons to prevent a dense diagram from freezing the editor.
 */
export function properPolylineCrossings(candidate,priorPaths,limit=8192){
 if(!Array.isArray(candidate)||!candidate.every(finitePoint)||!Array.isArray(priorPaths))return Infinity;
 let count=0,comparisons=0;
 for(const prior of priorPaths){
  if(!Array.isArray(prior)||!prior.every(finitePoint))return Infinity;
  for(let i=1;i<candidate.length;i++)for(let j=1;j<prior.length;j++){
   if(++comparisons>limit)return Infinity;
   if(strictIntersection(candidate[i-1],candidate[i],prior[j-1],prior[j]))count++;
  }
 }
 return count;
}
/** Visual conflicts for the new scene-aware option. Unlike proper crossings,
 * also count nontrivial collinear overlaps and T-junction contact. Mere shared
 * endpoints are not crossings. All comparisons are capped; zero-length pieces
 * and non-finite coordinates never masquerade as precise intersections.
 */
function visualSegmentConflict(a,b,c,d){
 const rx=b[0]-a[0],ry=b[1]-a[1],sx=d[0]-c[0],sy=d[1]-c[1];
 const lenR=Math.hypot(rx,ry),lenS=Math.hypot(sx,sy);
 if(lenR<1e-7||lenS<1e-7)return false;
 const cross=(x,y,u,v)=>x*v-y*u;
 const denominator=cross(rx,ry,sx,sy),wx=c[0]-a[0],wy=c[1]-a[1];
 const tolerance=1e-7;
 if(Math.abs(denominator)<=tolerance*lenR*lenS){
  // Parallel, but only geometric overlap on the SAME line counts.
  if(Math.abs(cross(wx,wy,rx,ry))>1e-6*lenR)return false;
  const start=(wx*rx+wy*ry)/lenR,finish=start+(sx*rx+sy*ry)/lenR;
  return Math.min(lenR,Math.max(start,finish))-Math.max(0,Math.min(start,finish))>1e-6;
 }
 const alongR=cross(wx,wy,sx,sy)/denominator,alongS=cross(wx,wy,rx,ry)/denominator;
 if(alongR< -tolerance||alongR>1+tolerance||alongS< -tolerance||alongS>1+tolerance)return false;
 const innerR=alongR>tolerance&&alongR<1-tolerance,innerS=alongS>tolerance&&alongS<1-tolerance;
 // Shared endpoints are allowed, but a T intersection is not.
 return innerR||innerS;
}
export function polylineVisualConflicts(candidate,priorPaths,limit=8192){
 if(!Array.isArray(candidate)||!candidate.every(finitePoint)||!Array.isArray(priorPaths))return Infinity;
 let count=0,comparisons=0;
 for(const prior of priorPaths){
  if(!Array.isArray(prior)||!prior.every(finitePoint))return Infinity;
  for(let i=1;i<candidate.length;i++)for(let j=1;j<prior.length;j++){
   if(++comparisons>limit)return Infinity;
   if(visualSegmentConflict(candidate[i-1],candidate[i],prior[j-1],prior[j]))count++;
  }
 }
 return count;
}
const MAX_PRIORS=128;
export function routeDiagramEdge(a,b,fromBox,toBox,nodeObstacles=[],mode='direct',priorPaths=[]){
 if(!finitePoint(a)||!finitePoint(b))return {status:'invalid',points:[]};
 const ends=edgeBetweenBoxes(a,b,fromBox,toBox);
 if(!ends)return {status:'overlap',points:[]};
 const direct=[ends.start,ends.end];
 if(!['avoid','avoid-crossings'].includes(mode))return {status:'direct',points:direct};
 const crossingAware=mode==='avoid-crossings';
 if(crossingAware&&(!Array.isArray(priorPaths)||priorPaths.length>MAX_PRIORS||priorPaths.some(path=>!Array.isArray(path)||!path.every(finitePoint))))return {status:'capacity',points:direct};
 // Visible node rectangles are supplied by the caller without the two endpoints.
 const obstacles=nodeObstacles.filter(r=>r&&[r.left,r.top,r.right,r.bottom].every(Number.isFinite))
   .map(r=>({left:r.left-CLEARANCE,right:r.right+CLEARANCE,top:r.top-CLEARANCE,bottom:r.bottom+CLEARANCE}));
 const directBlocked=hitPath(direct,obstacles);
 const baselineCrossings=crossingAware?properPolylineCrossings(direct,priorPaths):0;
 if(crossingAware&&!Number.isFinite(baselineCrossings))return {status:'capacity',points:direct};
 if(!directBlocked&&baselineCrossings===0)return {status:'clear',points:direct};
 const source=boxRect(a,fromBox),target=boxRect(b,toBox);
 const xs=[source.left,target.left,...obstacles.map(r=>r.left)],xr=[source.right,target.right,...obstacles.map(r=>r.right)];
 const ys=[source.top,target.top,...obstacles.map(r=>r.top)],yr=[source.bottom,target.bottom,...obstacles.map(r=>r.bottom)];
 const lanes=[['y',Math.min(...ys)-CLEARANCE],['y',Math.max(...yr)+CLEARANCE],['x',Math.min(...xs)-CLEARANCE],['x',Math.max(...xr)+CLEARANCE]];
 let chosen=null,lowest=Infinity,bestCrossings=Infinity;
 // A crossing-free straight arrow is preferable to every detour. When the
 // straight path is node-clear but crosses earlier arrows, consider corridors.
 if(!directBlocked){chosen=direct;lowest=cost(direct);bestCrossings=baselineCrossings;}
 for(const [axis,lane] of lanes){
  const alongY=axis==='y';const av=alongY?a[1]:a[0],bv=alongY?b[1]:b[0];
  const sa=Math.sign(lane-av),sb=Math.sign(lane-bv);if(!sa||!sb)continue;
  const trimA=alongY?fromBox.height/2:fromBox.width/2;
  const trimB=alongY?toBox.height/2:toBox.width/2;
  const ptA=alongY?[a[0],av+sa*(trimA+2)]:[av+sa*(trimA+2),a[1]];
  const ptB=alongY?[b[0],bv+sb*(trimB+2)]:[bv+sb*(trimB+2),b[1]];
  const cornerA=alongY?[a[0],lane]:[lane,a[1]],cornerB=alongY?[b[0],lane]:[lane,b[1]];
  const path=[ptA,cornerA,cornerB,ptB].filter((p,i,arr)=>!i||!samePoint(p,arr[i-1]));
  if(hitPath(path,obstacles))continue;
  // Do not allow the middle corridor to run through the source/target boxes.
  if(hitPath(path.slice(1,-1),[boxRect(a,fromBox,1),boxRect(b,toBox,1)]))continue;
  const distance=cost(path);
  // Never route a simple arrow far outside its local scene just to avoid a
  // crossing: that would be a worse illustration and costly to export.
  if(crossingAware&&distance>cost(direct)*4+250)continue;
  const crossings=crossingAware?properPolylineCrossings(path,priorPaths):0;
  if(!Number.isFinite(crossings))return {status:'capacity',points:direct};
  if(crossings<bestCrossings||(crossings===bestCrossings&&distance<lowest)){
   bestCrossings=crossings;lowest=distance;chosen=path;
  }
 }
 if(!chosen)return {status:'blocked',points:direct};
 if(crossingAware&&bestCrossings>0)return {status:'crossing',points:chosen,crossings:bestCrossings};
 return {status:'routed',points:chosen};
}
export function pathData(points){
 return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
}
/** Follow arc length for routed paths; the tangent supplies label-side normal. */
export function labelOnPolyline(points,t=.5,distance=17,swap=false,dx=0,dy=0){
 if(!Array.isArray(points)||points.length<2||!points.every(finitePoint))return null;
 const lengths=[],total=points.slice(1).reduce((n,p,i)=>{const len=Math.hypot(p[0]-points[i][0],p[1]-points[i][1]);lengths.push(len);return n+len;},0);
 if(total<1e-8)return null;
 let remaining=Math.min(1,Math.max(0,t))*total,idx=0;
 while(idx<lengths.length-1&&remaining>lengths[idx]){remaining-=lengths[idx];idx++;}
 const a=points[idx],b=points[idx+1],len=lengths[idx],f=len?remaining/len:0;
 const tangent=[(b[0]-a[0])/len,(b[1]-a[1])/len],side=swap?-1:1;
 return [a[0]+(b[0]-a[0])*f-tangent[1]*distance*side+dx,a[1]+(b[1]-a[1])*f+tangent[0]*distance*side+dy];
}
export function labelOnQuadratic(a,c,b,t=.5,distance=17,swap=false,dx=0,dy=0){
 const u=1-t,point=[u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]];
 const tx=2*u*(c[0]-a[0])+2*t*(b[0]-c[0]),ty=2*u*(c[1]-a[1])+2*t*(b[1]-c[1]),len=Math.hypot(tx,ty);
 if(len<1e-8)return null;
 const side=swap?-1:1;
 return [point[0]-ty/len*distance*side+dx,point[1]+tx/len*distance*side+dy];
}


/** Bounded screen-space label offset gesture. No semantic reference is modified.
 * Reject nonfinite pointer data; quantize only the new offset, not a project's
 * original stored value, to avoid incremental rounding drift during previews.
 */
export function labelDragOffset(baseX,baseY,start,end){
 if(!Number.isFinite(baseX)||!Number.isFinite(baseY)||!finitePoint(start)||!finitePoint(end))return null;
 // A click or subpixel pointer jitter must never silently round a legacy offset
 // or introduce a spurious Undo step.
 if(Math.hypot(end[0]-start[0],end[1]-start[1])<2)return [baseX,baseY];
 const clamp=v=>Math.max(-300,Math.min(300,Math.round(v*10)/10));
 return [clamp(baseX+end[0]-start[0]),clamp(baseY+end[1]-start[1])];
}
