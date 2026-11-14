/** Bounded CPU/SVG 3D plotting. No GPU claims, no arbitrary JavaScript execution.
 * Isolated from the 2D constraint graph; existing 2D objects are retained verbatim.
 */
import {parseCurveExpression,parseComplexExpression,domainColor} from './plot_modes.mjs?cut=round39';
const ok=x=>typeof x==='number'&&Number.isFinite(x);
export const PLOT3D_MODES=['surface3d','parametric3d','implicit3d','vector3d','domain3d'];
export const DEFAULT_3D_OPTIONS={yaw:-38,pitch:26,projection:'perspective',cube:true,lighting:true,opacity:.86,detail:22,zoom:1};
export const MAX_VISIBLE_3D_PLOTS=3;
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
const color=/^#[0-9a-fA-F]{6}$/;
export function parse3D(plot){
 if(plot.kind==='domain3d'){
  const fn=parseComplexExpression(plot.a);
  return (x,y)=>{const [re,im]=fn(x,y);if(!ok(re)||!ok(im))return [x,y,NaN];
   const z=plot.heightMode==='argument'?Math.atan2(im,re):Math.hypot(re,im);
   const result=[x,y,z];result.domainRGB=domainColor(re,im,plot.colorMode);return result;};
 }
 if(plot.kind==='surface3d'){
  const f=parseCurveExpression(plot.a,['x','y']);return (x,y)=>[x,y,f({x,y})];
 }
 if(plot.kind==='parametric3d'){
  const fx=parseCurveExpression(plot.a,['u','v']),fy=parseCurveExpression(plot.b,['u','v']),fz=parseCurveExpression(plot.c,['u','v']);
  return (u,v)=>{const vars={u,v};return [fx(vars),fy(vars),fz(vars)];};
 }
 if(plot.kind==='implicit3d'){
  const parts=plot.a.split('=');if(parts.length>2)throw Error('3D implicit expression has too many equal signs.');
  const left=parseCurveExpression(parts[0],['x','y','z']);const right=parts.length===2?parseCurveExpression(parts[1],['x','y','z']):()=>0;
  return (x,y,z)=>left({x,y,z})-right({x,y,z});
 }
 if(plot.kind==='vector3d'){
  const f=[plot.a,plot.b,plot.c].map(s=>parseCurveExpression(s,['x','y','z']));
  return (x,y,z)=>{const vars={x,y,z};return f.map(fn=>fn(vars));};
 }
 throw Error('Unsupported 3D mode.');
}
export function validate3D(scene){
 if(!scene||typeof scene!=='object'||Array.isArray(scene)||!Array.isArray(scene.plots)||scene.plots.length>80||!Number.isSafeInteger(scene.nextId)||scene.nextId<1)throw Error('Invalid 3D scene.');
 const o=scene.options;if(!o||!ok(o.yaw)||Math.abs(o.yaw)>180||!ok(o.pitch)||Math.abs(o.pitch)>89||!['perspective','orthographic'].includes(o.projection)||typeof o.cube!=='boolean'||typeof o.lighting!=='boolean'||!ok(o.opacity)||o.opacity<.05||o.opacity>1||!Number.isInteger(o.detail)||o.detail<8||o.detail>96||!ok(o.zoom)||o.zoom<.25||o.zoom>5)throw Error('Invalid 3D camera or rendering options.');
 const ids=new Set();let highest=0;
 for(const plot of scene.plots){
  if(!plot||!PLOT3D_MODES.includes(plot.kind)||!Number.isInteger(plot.id)||plot.id<1||ids.has(plot.id)||typeof plot.name!=='string'||!plot.name.trim()||plot.name.length>100||!color.test(plot.color)||!ok(plot.opacity)||plot.opacity<.05||plot.opacity>1||typeof plot.hidden!=='boolean')throw Error('Invalid 3D plot.');
  ids.add(plot.id);highest=Math.max(highest,plot.id);
  for(const key of ['a','b','c'])if(typeof plot[key]!=='string'||(key==='a'||['parametric3d','vector3d'].includes(plot.kind))&&!plot[key].trim()||plot[key].length>400)throw Error('Invalid 3D expression.');
  const r=plot.bounds;if(!r||!['x','y','z'].every(axis=>ok(r[axis+'Min'])&&ok(r[axis+'Max'])&&Math.abs(r[axis+'Min'])<=1e4&&Math.abs(r[axis+'Max'])<=1e4&&r[axis+'Min']<r[axis+'Max']))throw Error('3D bounds must be ascending and within ±10,000.');
  if(plot.kind==='parametric3d'&&(!ok(plot.uMin)||!ok(plot.uMax)||!ok(plot.vMin)||!ok(plot.vMax)||plot.uMin>=plot.uMax||plot.vMin>=plot.vMax||[plot.uMin,plot.uMax,plot.vMin,plot.vMax].some(v=>Math.abs(v)>1e4)))throw Error('Invalid surface parameter ranges.');
  if(plot.kind==='domain3d'&&(!['modulus','argument'].includes(plot.heightMode)||!['phase-modulus','phase','contours'].includes(plot.colorMode)))throw Error('Invalid 3D complex coloring options.');
  if(plot.kind==='vector3d'&&(!Number.isInteger(plot.density)||plot.density<3||plot.density>12||typeof plot.normalized!=='boolean'))throw Error('3D vector density must be 3–12.');
  parse3D(plot);
 }
 if(scene.nextId<=highest)throw Error('Invalid next 3D ID.');
 return scene;
}
export function add3DPlot(scene,kind,inputs,bounds=defaultBounds3D()){
 if(scene.plots.length>=80)throw Error('3D plot limit (80) reached.');
 const id=scene.nextId++,[a='',b='',c='']=inputs;
 const plot={id,kind,name:`${{surface3d:'Surface',parametric3d:'Parametric surface',implicit3d:'Implicit surface',vector3d:'Vector field',domain3d:'Domain coloring'}[kind]} ${id}`,a,b,c,bounds:{...bounds},color:'#000000',opacity:1,hidden:false};
 if(kind==='parametric3d')Object.assign(plot,{uMin:0,uMax:2*Math.PI,vMin:0,vMax:2*Math.PI});
 if(kind==='vector3d')Object.assign(plot,{density:5,normalized:true});
 if(kind==='domain3d'){
  Object.assign(plot,{heightMode:'modulus',colorMode:'phase-modulus'});
  // Choose a finite initial z range from the complex function, rather than
  // clipping a typical |z²+1| surface to the old generic [-4,4] cube.
  const f=parseComplexExpression(a);let maxHeight=0;
  for(let j=0;j<=6;j++)for(let i=0;i<=6;i++){
   const x=bounds.xMin+(bounds.xMax-bounds.xMin)*i/6,y=bounds.yMin+(bounds.yMax-bounds.yMin)*j/6;
   try{const value=f(x,y),height=Math.hypot(...value);if(ok(height)&&height<=1e4)maxHeight=Math.max(maxHeight,height);}catch{}
  }
  plot.bounds.zMin=0;plot.bounds.zMax=Math.max(4,Math.min(10000,Math.ceil(maxHeight*1.05)));
 }
 parse3D(plot);scene.plots.push(plot);enforce3DVisibility(scene,id);validate3D(scene);return plot;
}
function finitePoint(p){return Array.isArray(p)&&p.length===3&&p.every(v=>ok(v)&&Math.abs(v)<1e6);}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
export const MAX_3D_EVALUATIONS=230000;
export const MAX_3D_FACES=66000;
export const MAX_3D_LINES=4800;
const MAX_MESH_FACES=24000;
const MAX_MESH_CACHE_BYTES=128*1024*1024;
function makeCamera(bounds,options,width,height){
 const yaw=options.yaw*Math.PI/180,pitch=options.pitch*Math.PI/180,cos=Math.cos(yaw),sin=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const center=['x','y','z'].map(axis=>(bounds[axis+'Min']+bounds[axis+'Max'])/2),span=['x','y','z'].map(axis=>(bounds[axis+'Max']-bounds[axis+'Min'])/2);
 function turn(point){
  const p=point.map((v,i)=>(v-center[i])/span[i]);
  const x=p[0]*cos-p[1]*sin,depth=p[0]*sin+p[1]*cos;
  return [x,depth*sp-p[2]*cp,depth*cp+p[2]*sp];
 }
 function project(point){const [x,y,depth]=turn(point),perspective=options.projection==='perspective'?3.5/(3.5-depth):1,scale=Math.min(width,height)*.32*options.zoom;
  return [width/2+x*scale*perspective,height/2+y*scale*perspective,depth];}
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
/** Cooperative CPU sampler. Every iteration yields after bounded rows / layers.
 * Consumers may abandon the generator at any point; partial meshes never enter
 * the cache or exports. The synchronous public sampler drains the same work. */
export function* sample3DPlotSteps(plot,detail){
 const fn=parse3D(plot),b=plot.bounds,faces=[],lines=[],cap=MAX_MESH_FACES;let evaluations=0,limited=false;
 const safeEval=(...args)=>{evaluations++;let value;try{value=fn(...args);}catch{return null;}return finitePoint(value)?value:null;};
 const pushTriangle=(a,c,d)=>{
  if(![a,c,d].every(finitePoint))return;
  // Preserve per-face phase colors across any region-clipped subtriangles.
  const rgb=plot.kind==='domain3d'?a.domainRGB:null;
  const faceColor=rgb?'#'+rgb.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join(''):null;
  for(const vertices of clipTriangle([a,c,d],b)){
   if(!validTriangle(...vertices))continue;
   if(faces.length>=cap){limited=true;return;}
   if(faceColor)vertices.color=faceColor;
   faces.push(vertices);
  }
 };
 if(['surface3d','parametric3d','domain3d'].includes(plot.kind)){
  const n=Math.max(8,Math.min(96,detail)),vertices=[];
  for(let j=0;j<=n;j++){
   const row=[];for(let i=0;i<=n;i++){
    const x=plot.kind!=='parametric3d'?b.xMin+(b.xMax-b.xMin)*i/n:plot.uMin+(plot.uMax-plot.uMin)*i/n;
    const y=plot.kind!=='parametric3d'?b.yMin+(b.yMax-b.yMin)*j/n:plot.vMin+(plot.vMax-plot.vMin)*j/n;
    row.push(safeEval(x,y));
   }vertices.push(row);yield;
  }
  for(let j=0;j<n&&!limited;j++){
   for(let i=0;i<n;i++){
    const [a,c,d,e]=[vertices[j][i],vertices[j][i+1],vertices[j+1][i+1],vertices[j+1][i]];
    if(!a||!c||!d||!e)continue;
    const maxEdge=Math.max(...[[a,c],[c,d],[d,e],[e,a]].map(([p,q])=>Math.hypot(...minus(p,q))));
    if(maxEdge>Math.max(b.xMax-b.xMin,b.yMax-b.yMin,b.zMax-b.zMin)*1.5)continue;
    if(plot.kind==='domain3d'&&plot.heightMode==='argument'&&Math.max(...[a,c,d,e].map(p=>p[2]))-Math.min(...[a,c,d,e].map(p=>p[2]))>Math.PI)continue;
    pushTriangle(a,c,d);pushTriangle(a,d,e);
   }yield;
  }
 }else if(plot.kind==='implicit3d'){
  // A consistent body diagonal partitions adjacent cubes into conforming tetrahedra.
  // The 2-versus-2 case must connect its four crossings cyclically; an arbitrary
  // edge-pair order creates crossing / inverted triangles and visible mesh holes.
  const n=Math.min(30,Math.max(8,Math.round(detail*.65))),cube=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const stride=n+1,values=new Float64Array(stride**3),index=(i,j,k)=>k*stride*stride+j*stride+i;
  const at=(i,j,k)=>[b.xMin+(b.xMax-b.xMin)*i/n,b.yMin+(b.yMax-b.yMin)*j/n,b.zMin+(b.zMax-b.zMin)*k/n];
  for(let k=0;k<=n;k++){
   for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
    let value;try{value=fn(...at(i,j,k));}catch{value=NaN;}evaluations++;values[index(i,j,k)]=ok(value)?value:NaN;
   }yield;
  }
  for(let k=0;k<n&&!limited;k++)for(let j=0;j<n&&!limited;j++){
   for(let i=0;i<n&&!limited;i++){
    const pts=cube.map(([dx,dy,dz])=>at(i+dx,j+dy,k+dz)),v=cube.map(([dx,dy,dz])=>values[index(i+dx,j+dy,k+dz)]);
    for(const ids of tets){const z=ids.map(q=>v[q]);if(z.some(x=>!ok(x)))continue;
     const inside=[],outside=[];for(let m=0;m<4;m++)(z[m]<0?inside:outside).push(m);
     if(inside.length===0||outside.length===0)continue;
     const edge=(u,w)=>{const from=ids[u],to=ids[w],t=z[u]/(z[u]-z[w]);return pts[from].map((a,d)=>a+(pts[to][d]-a)*t);};
     if(inside.length===1){const a=inside[0];pushTriangle(edge(a,outside[0]),edge(a,outside[1]),edge(a,outside[2]));}
     else if(outside.length===1){const a=outside[0];pushTriangle(edge(a,inside[0]),edge(a,inside[2]),edge(a,inside[1]));}
     else{
      const [a,c]=inside,[d,e]=outside;
      const p=edge(a,d),q=edge(a,e),r=edge(c,e),s=edge(c,d);
      pushTriangle(p,q,r);pushTriangle(p,r,s);
     }
    }
   }yield;
  }
 }else if(plot.kind==='vector3d'){
  const n=plot.density;for(let k=0;k<n;k++){
   for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const center=['x','y','z'].map((axis,index)=>b[axis+'Min']+(b[axis+'Max']-b[axis+'Min'])*([i,j,k][index]+.5)/n);
    let vec;try{vec=fn(...center);}catch{}evaluations++;
    if(!finitePoint(vec))continue;const mag=Math.hypot(...vec);if(mag<1e-10||!ok(mag))continue;
    const unit=vec.map(v=>v/mag),length=Math.min(...['x','y','z'].map(axis=>(b[axis+'Max']-b[axis+'Min'])/n))*.35*(plot.normalized?1:Math.min(1.8,mag));
    const endpoints=[center.map((v,q)=>v-unit[q]*length*.5),center.map((v,q)=>v+unit[q]*length*.5)];
    if(endpoints.every(p=>inBounds(p,b)))lines.push(endpoints);
   }yield;
  }
 }
 return {faces,lines,evaluations,limited};
}
export function sample3DPlot(plot,detail){const generator=sample3DPlotSteps(plot,detail);let next;do{next=generator.next();}while(!next.done);return next.value;}

/** World mesh LRU is reusable during orbit and bounded independently of scene size. */
const meshCache=new Map();let meshCacheBytes=0;
export function meshCacheStats(){return {entries:meshCache.size,estimatedBytes:meshCacheBytes,limitBytes:MAX_MESH_CACHE_BYTES};}
function meshBytes(mesh){return mesh.faces.length*3*3*8+mesh.lines.length*2*3*8+mesh.faces.length*48+mesh.lines.length*32;}
const meshKey=(plot,detail)=>JSON.stringify([plot,detail]);
function getCachedMesh(key){
 if(!meshCache.has(key))return null;
 const mesh=meshCache.get(key);meshCache.delete(key);meshCache.set(key,mesh);return mesh;
}
function storeMesh(key,mesh){const bytes=meshBytes(mesh);if(bytes>MAX_MESH_CACHE_BYTES)return;
 if(meshCache.has(key))meshCacheBytes-=meshBytes(meshCache.get(key));
 meshCache.set(key,mesh);meshCacheBytes+=bytes;
 while(meshCacheBytes>MAX_MESH_CACHE_BYTES){const oldest=meshCache.keys().next().value;meshCacheBytes-=meshBytes(meshCache.get(oldest));meshCache.delete(oldest);}
}
function estimatedEvaluations(plot,detail){
 if(plot.kind==='vector3d')return plot.density**3;
 if(plot.kind==='implicit3d')return (Math.min(30,Math.max(8,Math.round(detail*.65)))+1)**3;
 return (Math.max(8,Math.min(96,detail))+1)**2;
}
/** Synchronous exports and cooperative screen rendering share EXACT geometry,
 * clipping, sorting, and work limits. SVG is not a Z-buffer; crossing translucent
 * surfaces still have painter-order artifacts. */
function* project3DSceneSteps(scene,width,height){
 validate3D(scene);
 if(!ok(width)||!ok(height)||width<100||height<100)return {faces:[],lines:[],primitives:[],cube:[],evaluations:0,limited:false};
 const opt=scene.options,faces=[],lines=[],cube=[];
 const active=scene.plots.filter(p=>!p.hidden),plots=active.slice(-MAX_VISIBLE_3D_PLOTS);
 // Mixed plots previously projected using the FIRST plot's bounds; this could
 // put later plots behind the camera, creating giant/inverted polygons or blanks.
 const bounds=plots.length?Object.fromEntries(['x','y','z'].flatMap(axis=>[
  [axis+'Min',Math.min(...plots.map(p=>p.bounds[axis+'Min']))],
  [axis+'Max',Math.max(...plots.map(p=>p.bounds[axis+'Max']))]
 ])):defaultBounds3D();
 const camera=makeCamera(bounds,opt,width,height);let evaluations=0,limited=active.length>MAX_VISIBLE_3D_PLOTS;
 const perPlotFaces=Math.floor(MAX_3D_FACES/Math.max(1,plots.length));
 if(opt.cube){const v=[];for(let k=0;k<8;k++)v.push(camera.project([k&1?bounds.xMax:bounds.xMin,k&2?bounds.yMax:bounds.yMin,k&4?bounds.zMax:bounds.zMin]));
  for(let i=0;i<8;i++)for(const bit of [1,2,4])if(!(i&bit))cube.push([v[i],v[i|bit]]);
 }
 let count=0;
 for(const plot of plots){
  // Fair allocation: adaptive refinement/retry avoids truncating an implicit
  // surface half-way through the lattice, and prevents plot-order starvation.
  let effectiveDetail=Math.min(opt.detail,Math.floor(Math.sqrt(perPlotFaces/2))-1);
  if(plot.kind==='implicit3d'||plot.kind==='vector3d')effectiveDetail=opt.detail;
  let mesh;
  for(let attempt=0;attempt<9;attempt++){
   const predicted=estimatedEvaluations(plot,effectiveDetail);
   if(evaluations+predicted>MAX_3D_EVALUATIONS){limited=true;break;}
   const key=meshKey(plot,effectiveDetail);mesh=getCachedMesh(key);
   if(!mesh){const sampler=sample3DPlotSteps(plot,effectiveDetail);let next;
    do{next=sampler.next();if(!next.done)yield;}while(!next.done);
    mesh=next.value;if(!mesh.limited)storeMesh(key,mesh);
   }
   evaluations+=mesh.evaluations;
   if(!mesh.limited&&mesh.faces.length<=perPlotFaces)break;
   if(effectiveDetail<=8||attempt===8){limited=true;break;}
   effectiveDetail=Math.max(8,Math.floor(effectiveDetail*.8));mesh=null;
   yield;
  }
  if(!mesh){limited=true;continue;}
  limited||=mesh.limited||mesh.faces.length>perPlotFaces;
  let plotFaceCount=0;
  for(const triangle of mesh.faces){
   if(plotFaceCount>=perPlotFaces){limited=true;break;}
   plotFaceCount++;
   const projected=triangle.map(camera.project),v=triangle.map(camera.turn),normal=cross(minus(v[1],v[0]),minus(v[2],v[0]));
   const length=Math.hypot(...normal),light=length?Math.abs((-.3*normal[0]+.45*normal[1]+.84*normal[2])/length):0;
   // View-normalized Lambert intensity accounts for nonuniform axis ranges.
   faces.push({points:projected,depth:projected.reduce((s,p)=>s+p[2],0)/3,shade:opt.lighting?.32+.68*light:1,color:triangle.color||plot.color,domainColoring:plot.kind==='domain3d',opacity:opt.opacity*plot.opacity});
   if((++count&63)===0)yield;
  }
  for(const segment of mesh.lines){
   if(lines.length>=MAX_3D_LINES){limited=true;break;}
   const p=segment.map(camera.project);lines.push({start:p[0],end:p[1],depth:(p[0][2]+p[1][2])/2,color:plot.color,opacity:plot.opacity});
   if((++count&63)===0)yield;
  }
  if(lines.length>=MAX_3D_LINES)limited=true;
  yield;
 }
 faces.sort((a,b)=>a.depth-b.depth);lines.sort((a,b)=>a.depth-b.depth);
 // Vector strokes are no longer all drawn on top of every surface: mix them
 // into the same far-to-near painter order. Transparent crossings remain approximate.
 const primitives=[...faces.map(face=>({kind:'face',value:face,depth:face.depth})),...lines.map(line=>({kind:'line',value:line,depth:line.depth}))];
 primitives.sort((a,b)=>a.depth-b.depth);
 return {faces,lines,primitives,cube,evaluations,limited};
}
export function project3DScene(scene,width,height){
 const generator=project3DSceneSteps(scene,width,height);let next;do{next=generator.next();}while(!next.done);return next.value;
}
/** Asynchronous caller owns the lifecycle. One step performs at most its frame
 * allowance of small generator units; cancel() discards all partial work. */
export function create3DProjectionTask(scene,width,height){
 const generator=project3DSceneSteps(scene,width,height);let cancelled=false,done=false,result=null;
 return {
  get done(){return done;},get cancelled(){return cancelled;},get result(){return result;},
  cancel(){cancelled=true;result=null;generator.return();},
  step(milliseconds=7){
   if(cancelled)return {done:true,cancelled:true,result:null};
   if(done)return {done:true,cancelled:false,result};
   const deadline=performance.now()+Math.max(0,Math.min(20,milliseconds));let next;
   do{next=generator.next();if(next.done){done=true;result=next.value;break;}}while(performance.now()<deadline);
   return {done,cancelled:false,result};
  }
 };
}
