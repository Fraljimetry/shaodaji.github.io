/** Live regular polygon, with a center and an explicit first vertex. */
export function regularPolygonVertices(center,vertex,sides){
 if(!Array.isArray(center)||!Array.isArray(vertex)||!Number.isInteger(sides)||sides<3||sides>100)return [];
 const dx=vertex[0]-center[0],dy=vertex[1]-center[1],radius=Math.hypot(dx,dy);
 if(!Number.isFinite(radius)||radius<1e-10)return [];
 const start=Math.atan2(dy,dx);
 return Array.from({length:sides},(_,i)=>[center[0]+radius*Math.cos(start+i*2*Math.PI/sides),center[1]+radius*Math.sin(start+i*2*Math.PI/sides)]);
}
/** Pure geometry helpers for canvas rendering and regression tests. */
export function smoothPath(raw,mode,scale=50){
 if(!Array.isArray(raw)||raw.length<3||mode==='off')return raw;
 if(mode==='ultra')return ultraSmoothPath(raw,scale);
 const tolerance={gentle:0.65,medium:1.6,strong:3,ultra:4.5}[mode]||0;
 if(!tolerance)return raw;
 const gap=tolerance/Math.max(scale,1),kept=[raw[0]];
 for(let i=1;i<raw.length-1;i++){const p=raw[i],q=kept.at(-1);if(Math.hypot(p[0]-q[0],p[1]-q[1])>=gap)kept.push(p);}
 kept.push(raw.at(-1));
 let pts=kept;
 const rounds=mode==='ultra'?3:mode==='strong'?2:1;
 for(let r=0;r<rounds;r++){
  if(pts.length*2+2>20000)break;
  const next=[pts[0]];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];next.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]);}
  next.push(pts.at(-1));pts=next;
 }
 if(pts.length>20000){const stride=Math.ceil(pts.length/19999);pts=pts.filter((_,i)=>i%stride===0||i===pts.length-1);}
 return pts;
}
/** Ultra-smooth is a geometric low-pass filter, not more Chaikin subdivision.
 * Chaikin alone makes a polyline look round but preserves the original high-frequency
 * hand jitter. Uniform arc-length sampling + symmetric Gaussian filtering removes it,
 * independently of pointer sampling rate. All distances below are SCREEN pixels.
 * Preserve the exact pen-down and pen-up positions for reliable closure, undo,
 * export and round trips. Work is bounded for long/stale imported strokes.
 */
function ultraSmoothPath(raw,scale){
 if(raw.length<3||!raw.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))return raw;
 const zoom=Number.isFinite(scale)&&scale>0?Math.max(1,scale):50;
 const cumulative=[0];
 for(let i=1;i<raw.length;i++){
  const distance=Math.hypot(raw[i][0]-raw[i-1][0],raw[i][1]-raw[i-1][1])*zoom;
  if(!Number.isFinite(distance))return raw;
  cumulative.push(cumulative.at(-1)+distance);
 }
 const length=cumulative.at(-1);
 if(!Number.isFinite(length)||length<3)return raw;
 // Never amplify tiny paths or accumulate more than 4096 output points.
 const count=Math.min(4096,Math.max(3,Math.ceil(length/3.8)+1));
 const step=length/(count-1),sampled=[];
 let segment=1;
 for(let i=0;i<count;i++){
  const distance=i===count-1?length:i*step;
  while(segment<cumulative.length-1&&cumulative[segment]<distance)segment++;
  const span=cumulative[segment]-cumulative[segment-1];
  const ratio=span>0?Math.max(0,Math.min(1,(distance-cumulative[segment-1])/span)):0;
  const a=raw[segment-1],b=raw[segment];
  sampled.push([a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio]);
 }
 // A wide, zero-phase filter suppresses hand tremor instead of merely rounding
 // the corners of each tremor. Adapt to short strokes to avoid shrinking them away.
 const sigma=Math.min(14,Math.max(2.5,length/10));
 const radius=Math.min(count-1,Math.ceil(3*sigma/step));
 const weights=Array.from({length:radius+1},(_,k)=>Math.exp(-.5*(k*step/sigma)**2));
 const result=sampled.map((p,i)=>{
  if(i===0)return [...raw[0]];
  if(i===count-1)return [...raw.at(-1)];
  let x=0,y=0,total=0;
  for(let k=-radius;k<=radius;k++){
   const j=Math.max(0,Math.min(count-1,i+k));
   const w=weights[Math.abs(k)];
   x+=sampled[j][0]*w;y+=sampled[j][1]*w;total+=w;
  }
  return [x/total,y/total];
 });
 return result;
}

export function worldBounds(doc,resolver){
 const bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
 function put(p){if(!p||!p.every(Number.isFinite))return;bounds.minX=Math.min(bounds.minX,p[0]);bounds.maxX=Math.max(bounds.maxX,p[0]);bounds.minY=Math.min(bounds.minY,p[1]);bounds.maxY=Math.max(bounds.maxY,p[1]);}
 for(const o of doc.objects){
  // Bounds must represent what users can actually see. Fully transparent
  // outliers and morphisms whose endpoint node is hidden cannot affect Fit.
  if(o.hidden||o.style?.opacity===0)continue;
  if(o.type==='morphism'&&o.refs?.some(id=>{
   const node=resolver.object(id);
   return !node||node.hidden||node.style?.opacity===0;
  }))continue;
  if(['point','midpoint','intersection','node'].includes(o.type))put(resolver.at(o.id));
  else if(o.type==='text')put(o.xy);
  else if(o.type==='freehand')for(const p of o.path)put(p);
  else if(o.refs){const p=resolver.points(o);for(const x of p)put(x);
   if(o.type==='regularPolygon'&&p.length===2&&p.every(Boolean))for(const vertex of regularPolygonVertices(p[0],p[1],o.sides))put(vertex);
   if(o.type==='circleThrough3'&&p.length===3&&p.every(Boolean)){const circle=circumcircle(p);if(circle){const [cx,cy]=circle.center,r=circle.radius;put([cx-r,cy-r]);put([cx+r,cy+r]);}}
   if(o.type==='circle'&&p.every(Boolean)){const r=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);put([p[0][0]-r,p[0][1]-r]);put([p[0][0]+r,p[0][1]+r]);}
   if(o.type==='ellipse'&&p.every(Boolean)){
    if(p.length===3){const e=focalEllipse(p);if(e){const x=Math.hypot(e.rx*Math.cos(e.angle),e.ry*Math.sin(e.angle)),y=Math.hypot(e.rx*Math.sin(e.angle),e.ry*Math.cos(e.angle));put([e.cx-x,e.cy-y]);put([e.cx+x,e.cy+y]);}}
    else{put([p[0][0],p[1][1]]);put([p[1][0],p[0][1]]);}
   }
  }
 }
 return bounds.minX===Infinity?null:bounds;
}
export function pageRect(size,page){
 if(page==='infinite')return null;
 const aspect=({a3:420/297,a4:297/210,a5:210/148,letter:11/8.5,legal:14/8.5,tabloid:17/11,square:1,widescreen:16/9})[page];
 if(!Number.isFinite(aspect))return null;
 let w=Math.min(size.w*0.84,size.h*0.84*aspect),h=w/aspect;
 return {x:(size.w-w)/2,y:(size.h-h)/2,width:w,height:h,aspect};
}
export function arrowCurve(a,b,bend){
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 if(length<1e-7)return null;
 const offset=bend*length*0.24;
 return {control:[(a[0]+b[0])/2-dy/length*offset,(a[1]+b[1])/2+dx/length*offset],length};
}

/** Marker-free SVG arrowhead in screen coordinates.
 * Avoids <marker id> collisions when different SVG illustrations are inlined
 * into the same HTML publication. Length is bounded for short edges.
 */
export function arrowHeadPoints(tip,from,strokeWidth=2){
 if(!Array.isArray(tip)||!Array.isArray(from)||![...tip,...from,strokeWidth].every(Number.isFinite))return [];
 const dx=tip[0]-from[0],dy=tip[1]-from[1],len=Math.hypot(dx,dy);
 if(len<1e-7)return [];
 const width=Math.max(.1,Math.min(100,strokeWidth));
 const headLength=Math.min(Math.max(7,width*4),len*.7);
 const halfWidth=Math.min(Math.max(3,width*2),headLength*.67);
 const ux=dx/len,uy=dy/len,base=[tip[0]-headLength*ux,tip[1]-headLength*uy];
 return [tip,[base[0]-uy*halfWidth,base[1]+ux*halfWidth],[base[0]+uy*halfWidth,base[1]-ux*halfWidth]];
}

/** Clip a mathematically infinite line to the visible SVG rectangle.
 * Avoid trillion-pixel SVG endpoints after extreme pan/zoom; never mutate anchors.
 * Null means the infinite line misses the viewport (or is degenerate).
 */
export function clipInfiniteLine(a,b,width,height){
 if(![...a,...b,width,height].every(Number.isFinite)||width<=0||height<=0)return null;
 const dx=b[0]-a[0],dy=b[1]-a[1];if(Math.hypot(dx,dy)<1e-9)return null;
 const candidates=[];
 const add=(x,y)=>{
  if(!Number.isFinite(x)||!Number.isFinite(y)||x < -1e-5||x > width+1e-5||y < -1e-5||y > height+1e-5)return;
  const p=[Math.max(0,Math.min(width,x)),Math.max(0,Math.min(height,y))];
  if(!candidates.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<1e-5))candidates.push(p);
 };
 if(Math.abs(dx)>1e-12){for(const x of [0,width]){const t=(x-a[0])/dx;add(x,a[1]+t*dy);}}
 if(Math.abs(dy)>1e-12){for(const y of [0,height]){const t=(y-a[1])/dy;add(a[0]+t*dx,y);}}
 if(candidates.length<2)return null;
 let winner=null,distance=-1;for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
  const d=Math.hypot(candidates[i][0]-candidates[j][0],candidates[i][1]-candidates[j][1]);
  if(d>distance){distance=d;winner=[candidates[i],candidates[j]];}
 }
 return distance>=1e-8?winner:null;
}

/** Never display a valid nonzero coordinate as apparent zero in the object list. */
export function formatCoordinate(n){
 if(!Number.isFinite(n))return 'undefined';
 if(Object.is(n,-0)||n===0)return '0';
 const magnitude=Math.abs(n);
 return magnitude<1e-4||magnitude>=1e7?n.toExponential(4):String(Number(n.toPrecision(7)));
}

/** Fit world geometry *and* fixed-pixel labels and node boxes. The latter do
 * not become smaller on zoom-out, unlike mathematical coordinates. Return a
 * warning flag if a narrow viewport cannot accommodate an unbreakable label.
 * Infinite straight lines / unbounded function graphs have no finite bbox.
 */
export function fitSceneView(doc,resolver,size){
 const bounds=worldBounds(doc,resolver);
 if(!bounds)return {cx:0,cy:0,scale:48,clipped:false};
 let left=5,right=5,top=5,bottom=5;
 for(const o of doc.objects){if(o.hidden||o.style?.opacity===0)continue;
  if(o.type==='node'){
   // Same measuring helper used by SVG drawing and semantic arrow clipping.
   const b=nodeBoxForFit(o.text,o.fontSize||17);
   left=Math.max(left,b.width/2);right=Math.max(right,b.width/2);
   top=Math.max(top,b.height/2);bottom=Math.max(bottom,b.height/2);
  }else if(['point','midpoint','intersection'].includes(o.type)){
   const r=o.style.pointSize??doc.settings.pointSize;
   left=Math.max(left,r);right=Math.max(right,r);top=Math.max(top,r);bottom=Math.max(bottom,r);
   if(doc.settings.showLabels){right=Math.max(right,10+String(o.name).length*7);top=Math.max(top,22);}
  }else if(o.type==='text'){
   const s=o.fontSize||18;
   right=Math.max(right,[...o.text].length*s*.65);
   top=Math.max(top,s*1.1);bottom=Math.max(bottom,s*.3);
  }
 }
 const pxW=size.w-36-left-right,pxH=size.h-36-top-bottom;
 const xSpan=Math.max(2,(bounds.maxX-bounds.minX)*1.3);
 const ySpan=Math.max(2,(bounds.maxY-bounds.minY)*1.3);
 const possible=pxW>0&&pxH>0;
 const scale=possible?Math.max(5,Math.min(1000,pxW/xSpan,pxH/ySpan)):5;
 return {cx:(bounds.minX+bounds.maxX)/2+(right-left)/(2*scale),
  cy:(bounds.minY+bounds.maxY)/2+(top-bottom)/(2*scale),scale,
  clipped:!possible||pxW/xSpan<5||pxH/ySpan<5};
}

// Do not duplicate font metrics or create a render/geometry import cycle.
import {focalEllipse,circumcircle} from './model.mjs?cut=round25';
import {nodeBox as nodeBoxForFit} from './diagram_layout.mjs';

/** Conservative screen-space rejection for bounded SVG primitives.
 * Return false on malformed/nonfinite data: culling must never make an object
 * disappear merely because coordinates are surprising. A Bézier curve is
 * contained by its control-point convex hull; this also bounds a polyline.
 */
export function bboxOutsideViewport(points,width,height,margin=0){
 if(!Array.isArray(points)||!points.length||![width,height,margin].every(Number.isFinite)||width<=0||height<=0||margin<0)return false;
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const p of points){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))return false;
  minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);
 }
 return maxX < -margin || minX > width+margin || maxY < -margin || minY > height+margin;
}
/** A forward half-line clipped to the current viewport; never extends backward
 * past its defining start, even when the origin is off screen. */
export function clipRay(a,b,width,height){
 if(!Array.isArray(a)||!Array.isArray(b)||![...a,...b,width,height].every(Number.isFinite)||width<=0||height<=0)return null;
 const dx=b[0]-a[0],dy=b[1]-a[1];if(Math.hypot(dx,dy)<1e-12)return null;
 let lo=0,hi=Infinity;
 for(const [v,d,min,max] of [[a[0],dx,0,width],[a[1],dy,0,height]]){
  if(Math.abs(d)<1e-12){if(v<min||v>max)return null;continue;}
  const t1=(min-v)/d,t2=(max-v)/d;
  lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));
 }
 if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<lo)return null;
 return [[a[0]+dx*lo,a[1]+dy*lo],[a[0]+dx*hi,a[1]+dy*hi]];
}
export function circleOutsideViewport(center,radius,width,height,margin=0){
 if(!Array.isArray(center)||center.length!==2||![...center,radius,width,height,margin].every(Number.isFinite)||radius<0||margin<0||width<=0||height<=0)return false;
 return center[0]+radius < -margin || center[0]-radius > width+margin || center[1]+radius < -margin || center[1]-radius > height+margin;
}

/** Decide free-stroke closure in screen pixels without mutating pen samples.
 * A near-endpoint loop becomes a corner unless its entering/leaving tangents
 * are almost parallel.  Invalid / abbreviated strokes always remain open.
 * Rendering and export must honor the same joinStyle.
 */
export function closeFreehandStroke(path,mode='near',scale=50){
 const open={path,closed:false};
 if(!Array.isArray(path)||path.length<3||!path.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))return open;
 if(mode!=='near'&&mode!=='always')return open;
 if(!Number.isFinite(scale)||scale<=0)return open;
 const a=path[0],b=path.at(-1),gap=Math.hypot(a[0]-b[0],a[1]-b[1])*scale;
 if(mode==='near'&&gap>18)return open;
 // Estimate tangents over a meaningful screen distance rather than a single
 // noisy sample.  Each tangent uses points in the original stroke direction.
 const direction=(fromStart)=>{
  const base=fromStart?path[0]:path.at(-1);let chosen=null;
  for(let k=1;k<path.length;k++){
   const p=fromStart?path[k]:path[path.length-1-k];
   const dx=fromStart?p[0]-base[0]:base[0]-p[0];
   const dy=fromStart?p[1]-base[1]:base[1]-p[1];
   const length=Math.hypot(dx,dy);
   if(length*scale>=8){chosen=[dx/length,dy/length];break;}
   if(length>1e-9)chosen=[dx/length,dy/length];
  }
  return chosen;
 };
 const start=direction(true),end=direction(false);
 const tangent=gap<=18&&start&&end&&start[0]*end[0]+start[1]*end[1]>=Math.cos(Math.PI/9);
 return {path,closed:true,joinStyle:tangent?'smooth':'corner'};
}

/** Magnetic free-curve endpoint attraction (screen-space tolerance).
 * Snap to the visible perimeter/stroke, not a bounding box. Geometry is a
 * coordinate snap, NOT a persistent dependency on the target object.
 * Never mutate a source object, resolver, or input point.
 */
export function nearestFreehandAttachment(point,objects,resolver,scale,maxPixels=16){
 if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||
    !Array.isArray(objects)||!resolver||typeof resolver.points!=='function'||
    !Number.isFinite(scale)||scale<=0||!Number.isFinite(maxPixels)||maxPixels<=0)return null;
 const maxDistance=maxPixels/scale;let best=null;
 const offer=(p,o,priority=0)=>{
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))return;
  const distance=Math.hypot(point[0]-p[0],point[1]-p[1]);
  if(distance>maxDistance)return;
  const score=distance*scale-priority;
  if(!best||score<best.score-1e-8)best={world:[...p],id:o.id,type:o.type,distancePx:distance*scale,score};
 };
 const segment=(a,b,o,infinite=false)=>{
  if(!a||!b||!a.every(Number.isFinite)||!b.every(Number.isFinite))return;
  const dx=b[0]-a[0],dy=b[1]-a[1],norm=dx*dx+dy*dy;
  if(norm<1e-20){offer(a,o);return;}
  const t=((point[0]-a[0])*dx+(point[1]-a[1])*dy)/norm;
  const u=infinite?t:Math.max(0,Math.min(1,t));
  offer([a[0]+u*dx,a[1]+u*dy],o);
 };
 for(const o of objects){
  if(!o||o.hidden||o.style?.opacity===0)continue;
  if(['point','midpoint','intersection'].includes(o.type)){
   offer(resolver.at?.(o.id),o,2);continue;
  }
  if(['text','node'].includes(o.type)){offer(o.xy,o,1);continue;}
  if(o.type==='freehand'){
   const path=o.path;
   if(!Array.isArray(path)||path.length<2)continue;
   // Bound work for very long strokes while retaining both endpoints.
   const stride=Math.max(1,Math.ceil((path.length-1)/750));
   for(let i=0;i<path.length-1;i+=stride)segment(path[i],path[Math.min(path.length-1,i+stride)],o);
   if(o.closed)segment(path.at(-1),path[0],o);
   continue;
  }
  const pts=resolver.points(o);
  if(!Array.isArray(pts))continue;
  if(['parallelThrough','perpendicularThrough'].includes(o.type)){
   const line=resolver.line?.(o);
   if(line)segment(line.a,[line.a[0]+line.d[0],line.a[1]+line.d[1]],o,true);
   continue;
  }
  if(!pts.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))continue;
  if(['segment','arrow','line','ray','perpBisector'].includes(o.type)&&pts.length===2){
   if(o.type==='perpBisector'){
    const [a,b]=pts,dx=b[0]-a[0],dy=b[1]-a[1];
    segment([(a[0]+b[0])/2,(a[1]+b[1])/2],[(a[0]+b[0])/2-dy,(a[1]+b[1])/2+dx],o,true);
   }else if(o.type==='ray'){
    // Projection t>=0: a ray is not limited to its second anchor.
    const [a,b]=pts,dx=b[0]-a[0],dy=b[1]-a[1],dd=dx*dx+dy*dy;
    if(dd>1e-20){const t=Math.max(0,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/dd);offer([a[0]+t*dx,a[1]+t*dy],o);}
   }else segment(pts[0],pts[1],o,o.type==='line');
   continue;
  }
  if(o.type==='circleThrough3'&&pts.length===3){
   const circ=circumcircle(pts);if(circ){const [a,b]=[circ.center,circ.radius],d=Math.hypot(point[0]-a[0],point[1]-a[1]);if(d>1e-10)offer([a[0]+b*(point[0]-a[0])/d,a[1]+b*(point[1]-a[1])/d],o);}
   continue;
  }
  if(o.type==='circle'&&pts.length===2){
   const [a,b]=pts,r=Math.hypot(a[0]-b[0],a[1]-b[1]),d=Math.hypot(point[0]-a[0],point[1]-a[1]);
   if(r>1e-10&&d>1e-10)offer([a[0]+r*(point[0]-a[0])/d,a[1]+r*(point[1]-a[1])/d],o);
   continue;
  }
  let path=pts,closed=o.type==='polygon'||o.type==='rectangle'||o.type==='regularPolygon'||(o.type==='spline'&&o.closed===true);
  if(o.type==='regularPolygon'){path=regularPolygonVertices(pts[0],pts[1],o.sides);}
  if(o.type==='ellipse'&&pts.length===3){
   const e=focalEllipse(pts);if(!e)continue;
   const co=Math.cos(e.angle),si=Math.sin(e.angle);
   path=Array.from({length:129},(_,i)=>{const t=i*Math.PI/64,x=e.rx*Math.cos(t),y=e.ry*Math.sin(t);return [e.cx+x*co-y*si,e.cy+x*si+y*co];});
   closed=false;
  }
  if(o.type==='rectangle'||(o.type==='ellipse'&&pts.length===2)){
   const [a,b]=pts;if(!a||!b)continue;
   const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,rx=Math.abs(a[0]-b[0])/2,ry=Math.abs(a[1]-b[1])/2;
   if(o.type==='rectangle')path=[[cx-rx,cy-ry],[cx+rx,cy-ry],[cx+rx,cy+ry],[cx-rx,cy+ry]];
   else if(rx<1e-10||ry<1e-10){path=[a,b];closed=false;}
   else {path=Array.from({length:73},(_,i)=>[cx+rx*Math.cos(i*Math.PI/36),cy+ry*Math.sin(i*Math.PI/36)]);closed=false;}
  }
  if(o.type==='bezier'&&pts.length===4){
   const [a,b,c,d]=pts;
   path=Array.from({length:65},(_,i)=>{const t=i/64,u=1-t;return [0,1].map(j=>u*u*u*a[j]+3*u*u*t*b[j]+3*u*t*t*c[j]+t*t*t*d[j]);});closed=false;
  }
  if(!['polyline','polygon','spline','angle','regularPolygon','rectangle','ellipse','bezier'].includes(o.type))continue;
  for(let i=1;i<path.length;i++)segment(path[i-1],path[i],o);
  if(closed&&path.length>2)segment(path.at(-1),path[0],o);
 }
 return best&&{world:best.world,id:best.id,type:best.type,distancePx:best.distancePx};
}

/** Convert vertices to smooth, bounded cubic Béziers (Catmull–Rom interpolation).
 * Endpoints are preserved, including for closed paths, and no external libraries are used. */
export function smoothCurveSvg(points,closed=false,joinStyle='smooth'){
 if(!Array.isArray(points)||points.length<2)return '';
 const p=points.filter(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite));
 if(p.length<2)return '';
 const fmt=v=>Number(v.toFixed(3));
 const xy=v=>`${fmt(v[0])} ${fmt(v[1])}`;
 if(p.length===2)return `M${xy(p[0])} L${xy(p[1])}${closed?' Z':''}`;
 // For a non-tangent near-closure, preserve the intentional corner at the
 // pen-down position, but round the *gap* instead of returning along a rigid
 // straight segment (which created a visible jerk at the pen-up position).
 // Work entirely in rendered coordinates; never change the saved samples.
 if(closed&&joinStyle==='corner'){
  const first=p[0],end=p.at(-1),before=p.at(-2),gap=Math.hypot(end[0]-first[0],end[1]-first[1]);
  if(gap<1e-6)return smoothCurveSvg(p,false)+' Z';
  const tangent=[end[0]-before[0],end[1]-before[1]],norm=Math.hypot(...tangent);
  const dist=Math.min(16,gap*.9),unit=norm>1e-9?tangent.map(v=>v/norm):[(first[0]-end[0])/gap,(first[1]-end[1])/gap];
  const control1=[end[0]+unit[0]*dist,end[1]+unit[1]*dist];
  // The incoming handle remains biased toward the seam, preserving a cusp
  // when the start/end tangents are not nearly tangent.
  const start=[p[1][0]-first[0],p[1][1]-first[1]],startLength=Math.hypot(...start);
  const finish=startLength>1e-9?[start[0]/startLength,start[1]/startLength]:[(first[0]-end[0])/gap,(first[1]-end[1])/gap];
  const toward=[(first[0]-end[0])/gap,(first[1]-end[1])/gap];
  const arrival=[toward[0]*.65+finish[0]*.35,toward[1]*.65+finish[1]*.35];
  const control2=[first[0]-arrival[0]*dist*.55,first[1]-arrival[1]*dist*.55];
  return smoothCurveSvg(p,false)+` C${xy(control1)} ${xy(control2)} ${xy(first)} Z`;
 }
 // A duplicated final vertex is common in natural closed pen strokes. Its
 // zero-length final segment otherwise forms an artificial flat spot.
 if(closed&&p.length>3&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-8)p.pop();
 const n=p.length,steps=closed?n:n-1;let d=`M${xy(p[0])}`;
 for(let i=0;i<steps;i++){
  const a=p[(i+n-1)%n],b=p[i],c=p[(i+1)%n],e=p[(i+2)%n];
  const prev=!closed&&i===0?b:a,next=!closed&&i===n-2?c:e;
  const c1=[b[0]+(c[0]-prev[0])/6,b[1]+(c[1]-prev[1])/6];
  const c2=[c[0]-(next[0]-b[0])/6,c[1]-(next[1]-b[1])/6];
  d+=` C${xy(c1)} ${xy(c2)} ${xy(c)}`;
 }
 return d+(closed?' Z':'');
}
