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
  if(['point','midpoint','node'].includes(o.type))put(resolver.at(o.id));
  else if(o.type==='text')put(o.xy);
  else if(o.type==='freehand')for(const p of o.path)put(p);
  else if(o.refs){const p=resolver.points(o);for(const x of p)put(x);
   if(o.type==='regularPolygon'&&p.length===2&&p.every(Boolean))for(const vertex of regularPolygonVertices(p[0],p[1],o.sides))put(vertex);
   if(o.type==='circle'&&p.every(Boolean)){const r=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);put([p[0][0]-r,p[0][1]-r]);put([p[0][0]+r,p[0][1]+r]);}
   if(o.type==='ellipse'&&p.every(Boolean)){put([p[0][0],p[1][1]]);put([p[1][0],p[0][1]]);}
  }
 }
 return bounds.minX===Infinity?null:bounds;
}
export function pageRect(size,page){
 if(page==='infinite')return null;
 const aspect=page==='a4'?297/210:11/8.5;
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
  }else if(['point','midpoint'].includes(o.type)){
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
export function circleOutsideViewport(center,radius,width,height,margin=0){
 if(!Array.isArray(center)||center.length!==2||![...center,radius,width,height,margin].every(Number.isFinite)||radius<0||margin<0||width<=0||height<=0)return false;
 return center[0]+radius < -margin || center[0]-radius > width+margin || center[1]+radius < -margin || center[1]-radius > height+margin;
}

/** Convert vertices to smooth, bounded cubic Béziers (Catmull–Rom interpolation).
 * Endpoints are preserved, including for closed paths, and no external libraries are used. */
export function smoothCurveSvg(points,closed=false){
 if(!Array.isArray(points)||points.length<2)return '';
 const p=points.filter(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite));
 if(p.length<2)return '';
 const fmt=v=>Number(v.toFixed(3));
 const xy=v=>`${fmt(v[0])} ${fmt(v[1])}`;
 if(p.length===2)return `M${xy(p[0])} L${xy(p[1])}${closed?' Z':''}`;
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
