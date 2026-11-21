import {compileRegionCondition,inRegion,clipConditionTriangle} from './region_condition.mjs?cut=round130';
/** Bounded CPU/SVG 3D plotting. No GPU claims, no arbitrary JavaScript execution.
 * Isolated from the 2D constraint graph; existing 2D objects are retained verbatim.
 */
import {parseCurveExpression,parseComplexExpression,domainColor} from './plot_modes.mjs?cut=round54';
const ok=x=>typeof x==='number'&&Number.isFinite(x);
export const PLOT3D_MODES=['surface3d','parametric3d','implicit3d','vector3d','domain3d'];
export const DEFAULT_3D_OPTIONS={yaw:-38,pitch:26,projection:'perspective',cube:true,lighting:true,opacity:.86,detail:22,zoom:1,grid:false,axes:false};
export const MAX_VISIBLE_3D_PLOTS=3;
/** One stable warm-to-cool magnitude/height ramp, independent of camera angle.
 * A constant scalar field maps to purple; invalid input never yields malformed SVG. */
export function rampColor(value,min,max){
 const stops=[[239,68,68],[168,85,247],[59,130,246]];
 const t=Number.isFinite(value)&&Number.isFinite(min)&&Number.isFinite(max)&&max>min
  ?Math.max(0,Math.min(1,(value-min)/(max-min))):.5;
 const scaled=t*2,segment=Math.min(1,Math.floor(scaled)),mix=scaled-segment;
 return '#'+stops[segment].map((start,index)=>Math.round(start+(stops[segment+1][index]-start)*mix).toString(16).padStart(2,'0')).join('');
}
/** Safe, strict math-only bounds: π/e and arithmetic, no eval or variables. */
export function parse3DRangeExpression(source){
 const value=typeof source==='number'?source:parseCurveExpression(String(source),[])({});
 if(!ok(value)||Math.abs(value)>10000)throw Error('3D region value must be finite and within ±10,000.');
 return value;
}

/** Old projects may contain many visible plots: retain all entries but show at most three.
 * When activating a plot, hide the oldest visible instead of deleting data. */
export function enforce3DVisibility(scene,preferredId=null){
 const visible=scene.plots.filter(plot=>!plot.hidden);
 const keep=new Set(visible.slice(-MAX_VISIBLE_3D_PLOTS).map(plot=>plot.id));
 if(preferredId!==null&&visible.some(plot=>plot.id===preferredId)){
  keep.add(preferredId);
  for(const plot of visible)if(keep.size>MAX_VISIBLE_3D_PLOTS&&plot.id!==preferredId)keep.delete(plot.id);
 }
 const hidden=[];for(const plot of visible)if(!keep.has(plot.id)){plot.hidden=true;hidden.push(plot.id);}
 return hidden;
}
export const defaultBounds3D=()=>({xMin:-4,xMax:4,yMin:-4,yMax:4,zMin:-4,zMax:4});
export const newScene3D=()=>({plots:[],nextId:1,options:{...DEFAULT_3D_OPTIONS}});
/** The camera's shared plotting region; individual plots retain independent sampling bounds. */
export function scene3DBounds(scene){
 const plots=scene.plots.filter(p=>!p.hidden).slice(-MAX_VISIBLE_3D_PLOTS);
 return plots.length?Object.fromEntries(['x','y','z'].flatMap(axis=>[
  [axis+'Min',Math.min(...plots.map(p=>p.bounds[axis+'Min']))],
  [axis+'Max',Math.max(...plots.map(p=>p.bounds[axis+'Max']))]
 ])):defaultBounds3D();
}
export function set3DFixRegion(scene,enabled){
 if(enabled){scene.options.fixedBounds=scene3DBounds(scene);scene.options.fixRegion=true;}
 else{scene.options.fixRegion=false;delete scene.options.fixedBounds;}
}

const color=/^#[0-9a-fA-F]{6}$/;
export function parse3D(plot){
 if(plot.kind==='domain3d'){
  const fn=parseComplexExpression(plot.a);
  return (x,y)=>{const [re,im]=fn(x,y);if(!ok(re)||!ok(im))return [x,y,NaN];
   const z=plot.heightMode==='argument'?Math.atan2(im,re):Math.hypot(re,im);
   const result=[x,y,z];result.domainRGB=plot.colorMode==='solid'?null:domainColor(re,im,plot.colorMode);return result;};
 }
 if(plot.kind==='surface3d'){
  const f=parseCurveExpression(plot.a,['x','y']),vars={x:0,y:0};
  return (x,y)=>{vars.x=x;vars.y=y;return [x,y,f(vars)];};
 }
 if(plot.kind==='parametric3d'){
  const fx=parseCurveExpression(plot.a,['u','v']),fy=parseCurveExpression(plot.b,['u','v']),fz=parseCurveExpression(plot.c,['u','v']);
  const vars={u:0,v:0};
  return (u,v)=>{vars.u=u;vars.v=v;return [fx(vars),fy(vars),fz(vars)];};
 }
 if(plot.kind==='implicit3d'){
  const parts=plot.a.split('=');if(parts.length>2)throw Error('3D implicit expression has too many equal signs.');
  const left=parseCurveExpression(parts[0],['x','y','z']);const right=parts.length===2?parseCurveExpression(parts[1],['x','y','z']):()=>0;
  // The sampler calls this synchronously millions of times. Reuse the
  // variable record instead of allocating two temporary objects per call.
  // Expression closures only read their argument during evaluation.
  const vars={x:0,y:0,z:0};
  return (x,y,z)=>{vars.x=x;vars.y=y;vars.z=z;return left(vars)-right(vars);};
 }
 if(plot.kind==='vector3d'){
  const f=[plot.a,plot.b,plot.c].map(s=>parseCurveExpression(s,['x','y','z']));
  const vars={x:0,y:0,z:0};
  return (x,y,z)=>{vars.x=x;vars.y=y;vars.z=z;return [f[0](vars),f[1](vars),f[2](vars)];};
 }
 throw Error('Unsupported 3D mode.');
}
export function validate3D(scene){
 if(!scene||typeof scene!=='object'||Array.isArray(scene)||!Array.isArray(scene.plots)||scene.plots.length>80||!Number.isSafeInteger(scene.nextId)||scene.nextId<1)throw Error('Invalid 3D scene.');
 const o=scene.options;if(!o||!ok(o.yaw)||Math.abs(o.yaw)>180||!ok(o.pitch)||Math.abs(o.pitch)>89||!['perspective','orthographic'].includes(o.projection)||typeof o.cube!=='boolean'||typeof o.lighting!=='boolean'||!ok(o.opacity)||o.opacity<.05||o.opacity>1||!Number.isInteger(o.detail)||o.detail<8||o.detail>128||!ok(o.zoom)||o.zoom<.25||o.zoom>5||['grid','axes'].some(key=>o[key]!==undefined&&typeof o[key]!=='boolean'))throw Error('Invalid 3D camera or rendering options.');
 if(o.fixRegion!==undefined&&typeof o.fixRegion!=='boolean')throw Error('Invalid 3D fixed-region flag.');
 if(o.fixedBounds!==undefined){
  const r=o.fixedBounds;
  if(!r||typeof r!=='object'||!['x','y','z'].every(axis=>ok(r[axis+'Min'])&&ok(r[axis+'Max'])&&Math.abs(r[axis+'Min'])<=1e4&&Math.abs(r[axis+'Max'])<=1e4&&r[axis+'Min']<r[axis+'Max']))throw Error('Invalid fixed 3D region.');
 }
 if(o.fixRegion===true&&!o.fixedBounds)throw Error('Fixed 3D region requires valid bounds.');
 const ids=new Set();let highest=0;
 for(const plot of scene.plots){
  if(!plot||!PLOT3D_MODES.includes(plot.kind)||!Number.isInteger(plot.id)||plot.id<1||ids.has(plot.id)||typeof plot.name!=='string'||!plot.name.trim()||plot.name.length>100||!color.test(plot.color)||!ok(plot.opacity)||plot.opacity<.05||plot.opacity>1||typeof plot.hidden!=='boolean')throw Error('Invalid 3D plot.');
  ids.add(plot.id);highest=Math.max(highest,plot.id);
  for(const key of ['a','b','c'])if(typeof plot[key]!=='string'||(key==='a'||['parametric3d','vector3d'].includes(plot.kind))&&!plot[key].trim()||plot[key].length>400)throw Error('Invalid 3D expression.');
  const r=plot.bounds;if(!r||!['x','y','z'].every(axis=>ok(r[axis+'Min'])&&ok(r[axis+'Max'])&&Math.abs(r[axis+'Min'])<=1e4&&Math.abs(r[axis+'Max'])<=1e4&&r[axis+'Min']<r[axis+'Max']))throw Error('3D bounds must be ascending and within ±10,000.');
  if(plot.kind==='parametric3d'&&(!ok(plot.uMin)||!ok(plot.uMax)||!ok(plot.vMin)||!ok(plot.vMax)||plot.uMin>=plot.uMax||plot.vMin>=plot.vMax||[plot.uMin,plot.uMax,plot.vMin,plot.vMax].some(v=>Math.abs(v)>1e4)))throw Error('Invalid surface parameter ranges.');
  if(plot.locked!==undefined&&typeof plot.locked!=='boolean')throw Error('Invalid 3D lock state.');
  if(plot.colorRange!==undefined&&typeof plot.colorRange!=='boolean')throw Error('Invalid 3D color range flag.');
  if(plot.kind==='domain3d'&&(!['modulus','argument'].includes(plot.heightMode)||!['phase-modulus','phase','contours','solid'].includes(plot.colorMode)))throw Error('Invalid 3D complex coloring options.');
  if(plot.kind==='vector3d'&&(!Number.isInteger(plot.density)||plot.density<3||plot.density>12||typeof plot.normalized!=='boolean'||(plot.lineWidth!==undefined&&(!ok(plot.lineWidth)||plot.lineWidth<.1||plot.lineWidth>12))))throw Error('3D vector density must be 3–12 and line width 0.1–12.');
  compileRegionCondition(plot.regionCondition,3);
  parse3D(plot);
 }
 if(scene.nextId<=highest)throw Error('Invalid next 3D ID.');
 return scene;
}
export function add3DPlot(scene,kind,inputs,bounds=scene.options.fixRegion===true?scene.options.fixedBounds:defaultBounds3D()){
 if(scene.plots.length>=80)throw Error('3D plot limit (80) reached.');
 const id=scene.nextId,[a='',b='',c='']=inputs;
 const plot={id,kind,name:`${{surface3d:'Surface',parametric3d:'Parametric surface',implicit3d:'Implicit surface',vector3d:'Vector field',domain3d:'Domain coloring'}[kind]} ${id}`,a,b,c,bounds:{...bounds},color:'#000000',opacity:1,hidden:false,locked:false,colorRange:false};
 if(kind==='parametric3d')Object.assign(plot,{uMin:0,uMax:2*Math.PI,vMin:0,vMax:2*Math.PI});
 if(kind==='vector3d')Object.assign(plot,{density:5,normalized:true,lineWidth:1.5});
 if(kind==='domain3d'){
  Object.assign(plot,{heightMode:'modulus',colorMode:'phase-modulus'});
  // Choose a finite initial z range from the complex function, rather than
  // clipping a typical |z²+1| surface to the old generic [-4,4] cube.
  const f=parseComplexExpression(a);let maxHeight=0;
  for(let j=0;j<=6;j++)for(let i=0;i<=6;i++){
   const x=bounds.xMin+(bounds.xMax-bounds.xMin)*i/6,y=bounds.yMin+(bounds.yMax-bounds.yMin)*j/6;
   try{const value=f(x,y),height=Math.hypot(...value);if(ok(height)&&height<=1e4)maxHeight=Math.max(maxHeight,height);}catch{}
  }
  if(scene.options.fixRegion!==true){plot.bounds.zMin=0;plot.bounds.zMax=Math.max(4,Math.min(10000,Math.ceil(maxHeight*1.05)));}
 }
 // Validate a prospective scene *before* touching the caller's object.
 // A malformed expression or region must not burn an ID, leave a half-added
 // plot, or hide an older visible surface as a side effect of a rejected edit.
 validate3D({...scene,nextId:id+1,plots:[...scene.plots,plot]});
 scene.nextId=id+1;scene.plots.push(plot);enforce3DVisibility(scene,id);
 return plot;
}
function finitePoint(p){return Array.isArray(p)&&p.length===3&&p.every(v=>ok(v)&&Math.abs(v)<1e6);}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
export const MAX_3D_EVALUATIONS=1900000;
export const MAX_3D_FACES=240000;
// Keep multi-surface scenes responsive: each visible face-producing plot shares
// a smaller combined DOM budget; a single detailed surface retains full quality.
export const MAX_3D_MULTI_FACES=150000;
export const MAX_3D_LINES=4800;
const MAX_MESH_FACES=MAX_3D_FACES;
const MAX_MESH_CACHE_BYTES=224*1024*1024;
function makeCamera(bounds,options,width,height){
 const yaw=options.yaw*Math.PI/180,pitch=options.pitch*Math.PI/180,cos=Math.cos(yaw),sin=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const center=['x','y','z'].map(axis=>(bounds[axis+'Min']+bounds[axis+'Max'])/2),span=['x','y','z'].map(axis=>(bounds[axis+'Max']-bounds[axis+'Min'])/2);
 // Adjacent world triangles reuse their vertex arrays. Cache only during this
 // projection frame: the next orbit gets its own camera and its own cache.
 const projectedVertices=new WeakMap();
 function turn(point){
  const px=(point[0]-center[0])/span[0],py=(point[1]-center[1])/span[1],pz=(point[2]-center[2])/span[2];
  const x=px*cos-py*sin,depth=px*sin+py*cos;
  return [x,depth*sp-pz*cp,depth*cp+pz*sp];
 }
 function project(point){
  const cached=projectedVertices.get(point);if(cached)return cached;
  const [x,y,depth]=turn(point),perspective=options.projection==='perspective'?3.5/(3.5-depth):1,scale=Math.min(width,height)*.32*options.zoom;
  const value=[width/2+x*scale*perspective,height/2+y*scale*perspective,depth];
  projectedVertices.set(point,value);return value;
 }
 return {project,turn};
}
function inBounds(p,b){return p.every((value,i)=>value>=b[['xMin','yMin','zMin'][i]]&&value<=b[['xMax','yMax','zMax'][i]]);}
// Clipping instead of dropping entire cells at a finite plot region boundary.
// Operates on world-space geometry before camera projection, so exports and
// interactive drawing agree and never invent geometry beyond the stated bounds.
function clipTriangle(points,b){
 if(points.every(p=>inBounds(p,b)))return [points];
 let polygon=points;
 for(const axis of ['x','y','z'])for(const min of [true,false]){
  const dimension={x:0,y:1,z:2}[axis],edge=b[axis+(min?'Min':'Max')],sign=min?1:-1,next=[];
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],c=polygon[(i+1)%polygon.length],da=(a[dimension]-edge)*sign,dc=(c[dimension]-edge)*sign,insideA=da>=0,insideC=dc>=0;
   if(insideA!==insideC){const t=da/(da-dc);next.push(a.map((v,j)=>v+(c[j]-v)*t));}
   if(insideC)next.push(c);
  }
  polygon=next;if(polygon.length<3)return [];
 }
 const triangles=[];for(let i=1;i+1<polygon.length;i++)triangles.push([polygon[0],polygon[i],polygon[i+1]]);
 return triangles;
}
function validTriangle(a,b,c){
 const n=cross(minus(b,a),minus(c,a));return Number.isFinite(n[0])&&Math.hypot(...n)>1e-11;
}
// Count only nondegenerate free edges wholly inside the sample box, never
// the legitimate open contour where a level surface meets a plotting bound.
// Quantized keys absorb last-bit arithmetic differences between adjacent tets.
function countInteriorSeams(faces,bounds){
 const edges=new Map();
 const resolution=1e-7;
 const key=p=>p.map(x=>Math.round(x/resolution)).join(',');
 for(const triangle of faces)for(let i=0;i<3;i++){
  const a=key(triangle[i]),c=key(triangle[(i+1)%3]);
  const edge=a<c?`${a}|${c}`:`${c}|${a}`;
  edges.set(edge,(edges.get(edge)||0)+1);
 }
 let total=0;
 for(const [edge,count] of edges){
  if(count!==1)continue;
  const points=edge.split('|').map(k=>k.split(',').map(Number).map(x=>x*resolution));
  if(points.every(p=>p.every((x,axis)=>{
   const name=['x','y','z'][axis],min=bounds[name+'Min'],max=bounds[name+'Max'];
   return x>min+resolution*100&&x<max-resolution*100;
  })))total++;
 }
 return total;
}
/** Cooperative CPU sampler. Every iteration yields after bounded rows / layers.
 * Consumers may abandon the generator at any point; partial meshes never enter
 * the cache or exports. The synchronous public sampler drains the same work. */
export function* sample3DPlotSteps(plot,detail,zeroTieBreak=false){
 const condition=compileRegionCondition(plot.regionCondition,3);
 const fn=parse3D(plot),b=plot.kind==='domain3d'&&plot.heightMode==='argument'&&plot.bounds.zMin===0?{...plot.bounds,zMin:-Math.PI,zMax:Math.PI}:plot.bounds,faces=[],lines=[],cap=MAX_MESH_FACES;let evaluations=0,limited=false,allFiniteSamples=false,roundoffVertices=0;
 const safeEval=(...args)=>{evaluations++;let value;try{value=fn(...args);}catch{return null;}return finitePoint(value)?value:null;};
 const pushTriangle=(a,c,d)=>{
  if(![a,c,d].every(finitePoint))return;
  // Preserve per-face phase colors across any region-clipped subtriangles.
  const rgb=plot.kind==='domain3d'?a.domainRGB:null;
  const faceColor=rgb?'#'+rgb.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join(''):null;
  // Implicit roots interpolate between lattice vertices already inside the
  // rectangular bounds. Their triangles need no six-plane clipping pass.
  const clipped=plot.kind==='implicit3d'?[[a,c,d]]:clipTriangle([a,c,d],b);
  for(const vertices of (condition?clipped.flatMap(t=>clipConditionTriangle(t,condition)):clipped)){
   if(!validTriangle(...vertices))continue;
   if(faces.length>=cap){limited=true;return;}
   if(faceColor)vertices.color=faceColor;
   faces.push(vertices);
  }
 };
 if(['surface3d','parametric3d','domain3d'].includes(plot.kind)){
  const n=Math.max(8,Math.min(128,detail));
  // Only adjacent rows are needed to triangulate a structured surface.
  // Keep a two-row sliding window instead of retaining the full (n+1)^2
  // lattice, reducing live references to O(n) without changing triangle order.
  const sampleRow=j=>{
   const row=[];
   for(let i=0;i<=n;i++){
    const x=plot.kind!=='parametric3d'?b.xMin+(b.xMax-b.xMin)*i/n:plot.uMin+(plot.uMax-plot.uMin)*i/n;
    const y=plot.kind!=='parametric3d'?b.yMin+(b.yMax-b.yMin)*j/n:plot.vMin+(plot.vMax-plot.vMin)*j/n;
    row.push(safeEval(x,y));
   }
   return row;
  };
  let upper=sampleRow(0);yield;
  for(let j=0;j<n&&!limited;j++){
   const lower=sampleRow(j+1);yield;
   for(let i=0;i<n;i++){
    const [a,c,d,e]=[upper[i],upper[i+1],lower[i+1],lower[i]];
    // A single undefined corner must not erase the triangle determined by
    // the other three valid samples. Keep full-cell winding unchanged;
    // partial cells are drawn only when their three vertices are finite.
    const available=[a,c,d,e].filter(Boolean);
    if(available.length<3)continue;
    // Scan the existing ring directly: no temporary edge-pair arrays per cell.
    let maxEdge=0;
    for(let k=0;k<available.length;k++)maxEdge=Math.max(maxEdge,Math.hypot(...minus(available[k],available[(k+1)%available.length])));
    if(maxEdge>Math.max(b.xMax-b.xMin,b.yMax-b.yMin,b.zMax-b.zMin)*1.5)continue;
    if(plot.kind==='domain3d'&&plot.heightMode==='argument'&&Math.max(...available.map(p=>p[2]))-Math.min(...available.map(p=>p[2]))>Math.PI)continue;
    if(available.length===4){pushTriangle(a,c,d);pushTriangle(a,d,e);}
    else if(!a)pushTriangle(c,d,e);
    else if(!c)pushTriangle(a,d,e);
    else if(!d)pushTriangle(a,c,e);
    else pushTriangle(a,c,d);
   }
   upper=lower;
   yield;
  }
 }else if(plot.kind==='implicit3d'){
  // A consistent body diagonal partitions adjacent cubes into conforming tetrahedra.
  // The 2-versus-2 case must connect its four crossings cyclically; an arbitrary
  // edge-pair order creates crossing / inverted triangles and visible mesh holes.
  const n=implicitGridCells(detail),cube=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const stride=n+1,values=new Float64Array(stride**3),index=(i,j,k)=>k*stride*stride+j*stride+i;
  // Every tetrahedron in adjacent cubes must agree on whether a crossing
  // is genuine. Cache validated edge roots by shared lattice-vertex pair.
  const verifiedEdges=new Map(),latticeSize=stride**3;
  const at=(i,j,k)=>[b.xMin+(b.xMax-b.xMin)*i/n,b.yMin+(b.yMax-b.yMin)*j/n,b.zMin+(b.zMax-b.zMin)*k/n];
  // Work directly in scalar coordinates; allocate no temporary 3-vector per
  // sample. Yield for each row, not each plane, to keep heavy meshes cancelable.
  const dx=(b.xMax-b.xMin)/n,dy=(b.yMax-b.yMin)/n,dz=(b.zMax-b.zMin)/n;
  for(let k=0;k<=n;k++){
   const z=b.zMin+k*dz;
   for(let j=0;j<=n;j++){
    const y=b.yMin+j*dy,offset=index(0,j,k);
    for(let i=0;i<=n;i++){
     let value;try{value=fn(b.xMin+i*dx,y,z);}catch{value=NaN;}
     evaluations++;values[offset+i]=ok(value)?value:NaN;
    }
    yield;
   }
  }
  // Alternate lattice sign resolution is only considered after the regular
  // mesh has been checked for genuine interior cracks. Never impose it on
  // discontinuous fields or on a normal watertight mesh.
  let maxSample=0;allFiniteSamples=true;
  for(const v of values){if(!ok(v)){allFiniteSamples=false;continue;}
   maxSample=Math.max(maxSample,Math.abs(v));
  }
  if(maxSample>0){
   const tolerance=maxSample*1e-13;
   for(let vi=0;vi<values.length;vi++)if(Math.abs(values[vi])<=tolerance){
    roundoffVertices++;
    if(zeroTieBreak)values[vi]=tolerance;
   }
  }
  for(let k=0;k<n&&!limited;k++)for(let j=0;j<n&&!limited;j++){
   for(let i=0;i<n&&!limited;i++){
    // Expensive root refinement can dominate a voxel row. Yield within the
    // row so a new camera pose can cancel before another full scan completes.
    if(i && (i&15)===0)yield;
    // Most cells of a localized implicit surface cannot cross the zero level.
    // Read their eight scalar values first, and avoid constructing world-space
    // vertices and tetrahedra for all-strict-positive/all-strict-negative cells.
    // Never prune zero or nonfinite samples: the existing edge validation and
    // partial-tetrahedron handling must still decide those boundary cases.
    // Inspect the eight lattice samples without allocating index/value arrays.
    // In typical smooth level sets the overwhelming majority of cells are
    // one-sided; materialize corners only for actual crossing candidates.
    const base=index(i,j,k),row=stride,plane=stride*stride;
    const a=values[base],c=values[base+1],d=values[base+row+1],e=values[base+row];
    const f=values[base+plane],g=values[base+plane+1],h=values[base+plane+row+1],l=values[base+plane+row];
    if((a>0&&c>0&&d>0&&e>0&&f>0&&g>0&&h>0&&l>0)||
       (a<0&&c<0&&d<0&&e<0&&f<0&&g<0&&h<0&&l<0))continue;
    const lattice=[base,base+1,base+row+1,base+row,base+plane,base+plane+1,base+plane+row+1,base+plane+row];
    const v=[a,c,d,e,f,g,h,l];
    const pts=cube.map(([cx,cy,cz])=>at(i+cx,j+cy,k+cz));
    for(const ids of tets){
     const z=[v[ids[0]],v[ids[1]],v[ids[2]],v[ids[3]]];
     if(!ok(z[0])||!ok(z[1])||!ok(z[2])||!ok(z[3]))continue;
     const inside=[],outside=[];for(let m=0;m<4;m++)(z[m]<0?inside:outside).push(m);
     if(inside.length===0||outside.length===0)continue;
     const edge=(u,w)=>{
      const from=ids[u],to=ids[w],a=lattice[from],c=lattice[to],key=a<c?a*latticeSize+c:c*latticeSize+a;
      if(verifiedEdges.has(key))return verifiedEdges.get(key);
      let result=null,fl=z[u],fh=z[w],lo=pts[from],hi=pts[to];
      if(fl===0)result=lo;
      else if(fh===0)result=hi;
      else if((fl<0)!==(fh<0)){
       const initialJump=Math.abs(fl-fh);
       // A sign change at a pole (e.g. 1/x) is NOT a level set. Refine
       // the bracket in world coordinates: a continuous zero contracts
       // its residual, whereas a pole/jump does not. Nonfinite probes fail
       // closed. This is a numerical safeguard, not a topology guarantee.
       // Three probes suffice for ordinary smooth crossings. If the
       // bracket has not contracted enough, refine up to three more times:
       // rejecting it early can punch real holes into an otherwise smooth
       // implicit surface. A pole retains its large jump and is still rejected.
       let lx=lo[0],ly=lo[1],lz=lo[2],hx=hi[0],hy=hi[1],hz=hi[2];
       for(let probe=0;probe<6&&!limited;probe++){
        if(probe>=3&&Math.abs(fl-fh)<initialJump*.72)break;
        // The bracket lives in scalar registers: only accepted roots
        // allocate a position vector, never the intermediate probes.
        const mx=(lx+hx)/2,my=(ly+hy)/2,mz=(lz+hz)/2;let fm;
        try{fm=fn(mx,my,mz);}catch{fm=NaN;}evaluations++;
        if(evaluations>MAX_3D_EVALUATIONS){limited=true;break;}
        if(!ok(fm))break;
        if(fm===0){result=[mx,my,mz];break;}
        if((fl<0)===(fm<0)){lx=mx;ly=my;lz=mz;fl=fm;}else{hx=mx;hy=my;hz=mz;fh=fm;}
       }
       if(!result&&!limited&&Math.abs(fl-fh)<initialJump*.72){
        const t=Math.max(0,Math.min(1,fl/(fl-fh)));
        result=[lx+(hx-lx)*t,ly+(hy-ly)*t,lz+(hz-lz)*t];
       }
      }
      verifiedEdges.set(key,result);return result;
     };
     // Construct crossings in the same order as before, but avoid the
     // temporary edge-pair list and repeated linear lookups for each face.
     // An invalid crossing rejects the entire tetrahedron (no hanging faces).
     if(inside.length===1){
      const u=inside[0],p=edge(u,outside[0]),q=edge(u,outside[1]),r=edge(u,outside[2]);
      if(p&&q&&r)pushTriangle(p,q,r);
     }else if(outside.length===1){
      const w=outside[0],p=edge(inside[0],w),q=edge(inside[1],w),r=edge(inside[2],w);
      if(p&&q&&r)pushTriangle(p,r,q);
     }else{
      const [u,v]=inside,[w,x]=outside;
      const p=edge(u,w),q=edge(u,x),s=edge(v,w),r=edge(v,x);
      if(p&&q&&r&&s){pushTriangle(p,q,r);pushTriangle(p,r,s);}
     }
    }
   }yield;
  }
 }else if(plot.kind==='vector3d'){
  const n=plot.density;for(let k=0;k<n;k++){
   for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    if(i && (i&15)===0)yield;
    const center=[b.xMin+(b.xMax-b.xMin)*(i+.5)/n,
     b.yMin+(b.yMax-b.yMin)*(j+.5)/n,
     b.zMin+(b.zMax-b.zMin)*(k+.5)/n];
    let vec;try{vec=fn(...center);}catch{}evaluations++;
    if(!finitePoint(vec))continue;const mag=Math.hypot(...vec);if(mag<1e-10||!ok(mag))continue;
    const length=Math.min((b.xMax-b.xMin)/n,(b.yMax-b.yMin)/n,(b.zMax-b.zMin)/n)*.35*(plot.normalized?1:Math.min(1.8,mag));
    const unit=vec.map(v=>v/mag);
    const endpoints=[center.map((v,q)=>v-unit[q]*length*.5),center.map((v,q)=>v+unit[q]*length*.5)];
    if(endpoints.every(p=>inBounds(p,b)&&inRegion(condition,...p)))lines.push({endpoints,magnitude:mag});
   }yield;
  }
 }
 // For coarse, continuous implicit samples, zero-valued lattice vertices can
 // leave nondegenerate triangular cracks. Compare the original mesh with a
 // consistently signed near-zero lattice, and keep the candidate ONLY if its
 // interior seam count improves. The unchanged mesh wins ties; intentional
 // region clipping and poles never enter this topology-repair path.
 if(plot.kind==='implicit3d'&&!zeroTieBreak&&!limited&&!condition&&allFiniteSamples&&
    roundoffVertices>0&&implicitGridCells(detail)<=21){
  const initialSeams=countInteriorSeams(faces,b);
  if(initialSeams>0){
   const alternative=sample3DPlotSteps(plot,detail,true);
   let next;
   do{next=alternative.next();if(!next.done)yield;}while(!next.done);
   const result=next.value;
   evaluations+=result.evaluations;
   if(!result.limited&&countInteriorSeams(result.faces,b)<initialSeams)
    return {...result,evaluations};
  }
 }
 return {faces,lines,evaluations,limited};
}
export function sample3DPlot(plot,detail){const generator=sample3DPlotSteps(plot,detail);let next;do{next=generator.next();}while(!next.done);return next.value;}

/** World mesh LRU is reusable during orbit and bounded independently of scene size. */
const meshCache=new Map();let meshCacheBytes=0;
// World-space face lighting is invariant under camera orbit, pan, zoom, theme,
// opacity and export size. Weak keys follow the existing bounded mesh LRU and
// do not retain evicted meshes. Do not mutate face arrays: native JSON and
// exact mesh-parity fixtures must remain byte-for-byte unchanged.
const faceLightingCache=new WeakMap();
// Shading is also invariant during orbit; compute the nonlinear light curve once.
const faceShadeCache=new WeakMap();
function worldFaceLight(triangle){
 let light=faceLightingCache.get(triangle);
 if(light!==undefined)return light;
 const normal=cross(minus(triangle[1],triangle[0]),minus(triangle[2],triangle[0]));
 const length=Math.hypot(...normal);
 light=length?Math.abs((.38*normal[0]+.44*normal[1]+.81*normal[2])/length):0;
 faceLightingCache.set(triangle,light);
 return light;
}
function worldFaceShade(triangle){
 let shade=faceShadeCache.get(triangle);
 if(shade!==undefined)return shade;
 shade=.26+.74*Math.pow(worldFaceLight(triangle),.82);
 faceShadeCache.set(triangle,shade);
 return shade;
}
export function meshCacheStats(){return {entries:meshCache.size,estimatedBytes:meshCacheBytes,limitBytes:MAX_MESH_CACHE_BYTES};}
function meshBytes(mesh){return mesh.faces.length*3*3*8+mesh.lines.length*2*3*8+mesh.faces.length*48+mesh.lines.length*32;}
// Cache only the inputs that affect sampled geometry (and phase colors).
// Name, opacity, visibility, solid color and the edit Lock must NOT trigger
// an expensive new implicit solve when their controls change.
export const meshKey=(plot,detail)=>JSON.stringify([
 plot.kind,plot.a,plot.b,plot.c,plot.bounds,plot.regionCondition||'',
 plot.kind==='parametric3d'?[plot.uMin,plot.uMax,plot.vMin,plot.vMax]:null,
 plot.kind==='vector3d'?[plot.density,plot.normalized]:null,
 plot.kind==='domain3d'?[plot.heightMode,plot.colorMode]:null,detail
]);
function getCachedMesh(key){
 if(!meshCache.has(key))return null;
 const mesh=meshCache.get(key);meshCache.delete(key);meshCache.set(key,mesh);return mesh;
}
function storeMesh(key,mesh){const bytes=meshBytes(mesh);if(bytes>MAX_MESH_CACHE_BYTES)return;
 if(meshCache.has(key))meshCacheBytes-=meshBytes(meshCache.get(key));
 meshCache.set(key,mesh);meshCacheBytes+=bytes;
 while(meshCacheBytes>MAX_MESH_CACHE_BYTES){const oldest=meshCache.keys().next().value;meshCacheBytes-=meshBytes(meshCache.get(oldest));meshCache.delete(oldest);}
}
/** Increasing Mesh detail must increase actual implicit sampling density.
 * Earlier rounds capped the grid at 52 and then pre-clamped it by an
 * estimated triangle count, making high settings visually identical.
 * Scene-level budgets can still reduce density *explicitly* for 3 plots.
 */
export function implicitGridCells(detail){return Math.min(114,Math.max(10,Math.round(detail*.83+8)));}
function estimatedEvaluations(plot,detail,pilot=null){
 if(plot.kind==='vector3d')return plot.density**3;
 if(plot.kind==='implicit3d'){
  const cells=implicitGridCells(detail),vertices=(cells+1)**3;
  if(!pilot)return vertices;
  const pilotCells=implicitGridCells(22),pilotVertices=(pilotCells+1)**3;
  // Root validation costs real evaluations in proportion to the surface area.
  // Estimate that cost from the same expression's low-resolution pilot, or a
  // high-detail request can consume the budget and silently show no surface.
  const rootCost=Math.max(0,pilot.evaluations-pilotVertices);
  return vertices+Math.ceil(rootCost*(cells/pilotCells)**2*1.08);
 }
 return (Math.max(8,Math.min(128,detail))+1)**2;
}
/** Synchronous exports and cooperative screen rendering share EXACT geometry,
 * clipping, sorting, and work limits. SVG is not a Z-buffer; crossing translucent
 * surfaces still have painter-order artifacts. */
function* project3DSceneSteps(scene,width,height,{interactive=false}={}){
 validate3D(scene);
 if(!ok(width)||!ok(height)||width<100||height<100)return {faces:[],lines:[],primitives:[],cube:[],evaluations:0,limited:false};
 const opt=scene.options,faces=[],lines=[],cube=[],gridLines=[],axesLines=[];
 // A bounded, transient complete mesh during orbit: never spend high-detail
 // sampling or full SVG construction on each pointer movement. Export and
 // the settled view retain the user-selected resolution.
 const renderDetail=interactive?Math.min(opt.detail,12):opt.detail;
 const active=scene.plots.filter(p=>!p.hidden),plots=active.slice(-MAX_VISIBLE_3D_PLOTS);
 // Mixed plots previously projected using the FIRST plot's bounds; this could
 // put later plots behind the camera, creating giant/inverted polygons or blanks.
 const bounds=opt.fixRegion===true?opt.fixedBounds:scene3DBounds(scene);
 const camera=makeCamera(bounds,opt,width,height);let evaluations=0,limited=active.length>MAX_VISIBLE_3D_PLOTS;
 const facePlotCount=plots.filter(plot=>plot.kind!=='vector3d').length;
 const totalFaceBudget=facePlotCount>1?MAX_3D_MULTI_FACES:MAX_3D_FACES;
 const perPlotFaces=Math.floor(totalFaceBudget/Math.max(1,facePlotCount));
 if(opt.cube){const v=[];for(let k=0;k<8;k++)v.push(camera.project([k&1?bounds.xMax:bounds.xMin,k&2?bounds.yMax:bounds.yMin,k&4?bounds.zMax:bounds.zMin]));
  for(let i=0;i<8;i++)for(const bit of [1,2,4])if(!(i&bit))cube.push([v[i],v[i|bit]]);
 }
 // Optional guides: a z=0 grid and three color-distinguished coordinate axes.
 // Plot and camera bounds are shared by every visible surface; guides never affect sampling.
 const hasZero=axis=>bounds[axis+'Min']<=0&&bounds[axis+'Max']>=0;
 if(opt.grid&&hasZero('z')){
  for(let i=0;i<=8;i++){
   const x=bounds.xMin+(bounds.xMax-bounds.xMin)*i/8;
   const y=bounds.yMin+(bounds.yMax-bounds.yMin)*i/8;
   gridLines.push([camera.project([x,bounds.yMin,0]),camera.project([x,bounds.yMax,0])]);
   gridLines.push([camera.project([bounds.xMin,y,0]),camera.project([bounds.xMax,y,0])]);
  }
 }
 if(opt.axes){for(const [axis,color] of [['x','#d76d6d'],['y','#4aa682'],['z','#638fde']]){
  const dimensions=['x','y','z'].filter(other=>other!==axis);
  if(!dimensions.every(hasZero))continue;
  const from=[0,0,0],to=[0,0,0],index={x:0,y:1,z:2}[axis];from[index]=bounds[axis+'Min'];to[index]=bounds[axis+'Max'];
  axesLines.push({from:camera.project(from),to:camera.project(to),color});
 }}
 let count=0;
 for(const [plotIndex,plot] of plots.entries()){
  // Use a FAIR face and sampling budget before the first expensive evaluation.
  // A dense first implicit mesh must never starve all later surfaces or render
  // only a broken first slice. Implicit complexity varies by formula, so a
  // bounded refinement retry still handles unexpectedly intricate level sets.
  let effectiveDetail=Math.min(renderDetail,Math.floor(Math.sqrt(perPlotFaces/2))-1);
  if(plot.kind==='vector3d')effectiveDetail=renderDetail;
  // A small conforming pilot mesh estimates the actual geometry complexity.
  // A fixed cube-to-face ratio previously stopped high Mesh detail from
  // changing anything; blind high-res retries instead consumed the global
  // evaluation budget, paradoxically making Detail 96 *worse* than 80.
  // The pilot is cached by formula/bounds and done only above its resolution.
  let pilot=null;
  if(plot.kind==='implicit3d'&&implicitGridCells(effectiveDetail)>implicitGridCells(22)){
   const pilotDetail=22,key=meshKey(plot,pilotDetail);
   pilot=getCachedMesh(key);
   if(!pilot){const sampler=sample3DPlotSteps(plot,pilotDetail);let next;
    do{next=sampler.next();if(!next.done)yield;}while(!next.done);
    pilot=next.value;
    // Cached pilot meshes consume no new mathematical evaluations.
    evaluations+=pilot.evaluations;
    if(!pilot.limited)storeMesh(key,pilot);
   }
   if(pilot.faces.length){
    const affordableCells=Math.floor(implicitGridCells(pilotDetail)*Math.sqrt(perPlotFaces/pilot.faces.length)*.98);
    effectiveDetail=Math.min(effectiveDetail,Math.max(8,Math.floor((affordableCells-8)/.83)));
   }
  }
  effectiveDetail=Math.max(8,effectiveDetail);
  let mesh;
  for(let attempt=0;attempt<12;attempt++){
   // A complete cached world mesh costs zero evaluations. Check it BEFORE
   // applying the new-work budget, or orbiting a dense cached scene silently
   // lowers quality and can reject valid exports after another plot changes.
   const key=meshKey(plot,effectiveDetail);
   const cached=getCachedMesh(key);
   const predicted=cached?0:estimatedEvaluations(plot,effectiveDetail,pilot);
   const remaining=MAX_3D_EVALUATIONS-evaluations;
   const share=Math.floor(remaining/Math.max(1,plots.length-plotIndex));
   if(predicted>share&&effectiveDetail>8){
    // Reduce just enough to meet the predicted cost. Coarse 0.82 steps
    // made detail 96 render *less* geometry than detail 80.
    const ratio=Math.sqrt(Math.max(0,share)/predicted);
    effectiveDetail=Math.max(8,Math.min(effectiveDetail-1,Math.floor(effectiveDetail*Math.max(.7,Math.min(.97,ratio)))));
    yield;continue;
   }
   if(predicted>remaining){limited=true;break;}
   mesh=cached;
   if(!mesh){const sampler=sample3DPlotSteps(plot,effectiveDetail);let next;
    do{next=sampler.next();if(!next.done)yield;}while(!next.done);
    mesh=next.value;
    // Only freshly sampled geometry counts toward the per-frame work cap.
    evaluations+=mesh.evaluations;
    if(!mesh.limited)storeMesh(key,mesh);
   }
   if(!mesh.limited&&mesh.faces.length<=perPlotFaces)break;
   if(effectiveDetail<=8||attempt===11){limited=true;break;}
   const faceRatio=Math.sqrt(perPlotFaces/Math.max(1,mesh.faces.length));
   effectiveDetail=Math.max(8,Math.min(effectiveDetail-1,Math.floor(effectiveDetail*Math.min(.96,.96*faceRatio))));mesh=null;
   yield;
  }
  if(!mesh||mesh.limited||mesh.faces.length>perPlotFaces){limited=true;continue;}
  let plotFaceCount=0;
  for(const triangle of mesh.faces){
   if(plotFaceCount>=perPlotFaces){limited=true;break;}
   plotFaceCount++;
   // Explicit vertex projection avoids short-lived callback/reduction arrays for
   // each triangle, while preserving the original sum order and output shape.
   const p0=camera.project(triangle[0]),p1=camera.project(triangle[1]),p2=camera.project(triangle[2]);
   const projected=[p0,p1,p2];
   // Stable world-anchored illumination: orbit changes view, NOT surface luminance.
   // No order-, orientation- or camera-dependent brightness jumps on two-sided faces.
   faces.push({points:projected,depth:((0+p0[2])+p1[2]+p2[2])/3,shade:opt.lighting?worldFaceShade(triangle):1,color:plot.colorRange?rampColor((triangle[0][2]+triangle[1][2]+triangle[2][2])/3,plot.bounds.zMin,plot.bounds.zMax):(plot.kind==='domain3d'&&plot.colorMode==='solid'?plot.color:(triangle.color||plot.color)),rangeColor:plot.colorRange===true,domainColoring:plot.kind==='domain3d'&&!plot.colorRange&&plot.colorMode!=='solid',opacity:opt.opacity*plot.opacity});
   if((++count&63)===0)yield;
  }
  const magnitudes=plot.colorRange?mesh.lines.map(entry=>entry.magnitude).filter(Number.isFinite):[];
  const minimum=magnitudes.length?Math.min(...magnitudes):0,maximum=magnitudes.length?Math.max(...magnitudes):1;
  for(const segment of mesh.lines){
   if(lines.length>=MAX_3D_LINES){limited=true;break;}
   const endpoints=segment.endpoints||segment, p=endpoints.map(camera.project);
   const fieldColor=plot.colorRange?rampColor(segment.magnitude,minimum,maximum):plot.color;
   lines.push({start:p[0],end:p[1],depth:(p[0][2]+p[1][2])/2,color:fieldColor,opacity:opt.opacity*plot.opacity,width:plot.lineWidth??1.5});
   if((++count&63)===0)yield;
  }
  if(lines.length>=MAX_3D_LINES)limited=true;
  yield;
 }
 for(const values of [faces,lines]){
  const sorting=stableDepthSortSteps(values);let state;
  do{state=sorting.next();if(!state.done)yield;}while(!state.done);
 }
 // Vector strokes are no longer all drawn on top of every surface: mix them
 // into the same far-to-near painter order. Transparent crossings remain approximate.
 // Faces and strokes have already been sorted by exactly the same depth
 // comparator. Merge their ordered runs in linear time instead of sorting
 // every primitive again. At equal depths, the old stable sort put faces
 // before lines because the input was [all faces, all lines].
 const primitives=new Array(faces.length+lines.length);
 let fi=0,li=0,pi=0;
 while(fi<faces.length&&li<lines.length){
  const face=faces[fi],line=lines[li];
  if(face.depth<=line.depth){primitives[pi++]={kind:'face',value:face,depth:face.depth};fi++;}
  else {primitives[pi++]={kind:'line',value:line,depth:line.depth};li++;}
 }
 while(fi<faces.length){const face=faces[fi++];primitives[pi++]={kind:'face',value:face,depth:face.depth};}
 while(li<lines.length){const line=lines[li++];primitives[pi++]={kind:'line',value:line,depth:line.depth};}
 return {faces,lines,primitives,cube,gridLines,axesLines,evaluations,limited};
}
/** Stable, cancellable depth ordering. Sort short runs natively, then merge
 * cooperatively so a dense mesh does not block the UI for one long sort.
 * The comparator and tie order match the previous stable Array#sort path.
 */
export function* stableDepthSortSteps(values,runSize=4096){
 const n=values.length;
 if(n<2)return values;
 const run=Math.max(2,Math.min(8192,Math.floor(runSize)||4096));
 for(let start=0;start<n;start+=run){
  const end=Math.min(start+run,n);
  // Array#sort is stable in supported browsers; sorting a run bounds each
  // uninterrupted native call and preserves equal-depth order within runs.
  const section=values.slice(start,end);
  section.sort((a,b)=>a.depth-b.depth);
  for(let k=0;k<section.length;k++)values[start+k]=section[k];
  yield;
 }
 let source=values,target=new Array(n);
 for(let width=run;width<n;width*=2){
  let work=0;
  for(let start=0;start<n;start+=2*width){
   let left=start,right=Math.min(start+width,n);
   const mid=right,end=Math.min(start+2*width,n);
   for(let k=start;k<end;k++){
    if(left>=mid)target[k]=source[right++];
    else if(right>=end)target[k]=source[left++];
    else if(!(source[right].depth<source[left].depth))target[k]=source[left++];
    else target[k]=source[right++];
    if(++work>=4096){work=0;yield;}
   }
  }
  [source,target]=[target,source];
  yield;
 }
 if(source!==values){
  for(let k=0;k<n;k++){
   values[k]=source[k];
   if((k&4095)===4095)yield;
  }
 }
 return values;
}
export function project3DScene(scene,width,height){
 const generator=project3DSceneSteps(scene,width,height);let next;do{next=generator.next();}while(!next.done);return next.value;
}
/** Asynchronous caller owns the lifecycle. One step performs at most its frame
 * allowance of small generator units; cancel() discards all partial work. */
export function create3DProjectionTask(scene,width,height,{interactive=false}={}){
 const generator=project3DSceneSteps(scene,width,height,{interactive});let cancelled=false,done=false,result=null,units=0;
 return {
  get done(){return done;},get cancelled(){return cancelled;},get result(){return result;},
  get units(){return units;},
  cancel(){
   if(cancelled||done)return;
   cancelled=true;result=null;generator.return();
  },
  step(milliseconds=7){
   if(cancelled)return {done:true,cancelled:true,result:null};
   if(done)return {done:true,cancelled:false,result};
   // A bounded unit count protects against coarse/frozen clocks, while the
   // deadline limits work on fast machines. Even a zero-ms budget advances
   // one cooperative unit, preventing task starvation.
   const budget=Number.isFinite(milliseconds)?Math.max(0,Math.min(20,milliseconds)):7;
   const deadline=performance.now()+budget;let next,spent=0;
   do{
    next=generator.next();units++;spent++;
    if(next.done){done=true;result=next.value;break;}
   }while(spent<128&&performance.now()<deadline);
   return {done,cancelled:false,result};
  }
 };
}
