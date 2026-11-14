/** Bounded CPU/SVG 3D plotting. No GPU claims, no arbitrary JavaScript execution.
 * Isolated from the 2D constraint graph; existing 2D objects are retained verbatim.
 */
import {parseCurveExpression,parseComplexExpression,domainColor} from './plot_modes.mjs?cut=round39';
const ok=x=>typeof x==='number'&&Number.isFinite(x);
export const PLOT3D_MODES=['surface3d','parametric3d','implicit3d','vector3d','domain3d'];
export const DEFAULT_3D_OPTIONS={yaw:-38,pitch:26,projection:'perspective',cube:true,lighting:true,opacity:.86,detail:22,zoom:1};
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
 const o=scene.options;if(!o||!ok(o.yaw)||Math.abs(o.yaw)>180||!ok(o.pitch)||Math.abs(o.pitch)>89||!['perspective','orthographic'].includes(o.projection)||typeof o.cube!=='boolean'||typeof o.lighting!=='boolean'||!ok(o.opacity)||o.opacity<.05||o.opacity>1||!Number.isInteger(o.detail)||o.detail<8||o.detail>44||!ok(o.zoom)||o.zoom<.25||o.zoom>5)throw Error('Invalid 3D camera or rendering options.');
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
 parse3D(plot);scene.plots.push(plot);validate3D(scene);return plot;
}
function finitePoint(p){return Array.isArray(p)&&p.length===3&&p.every(v=>ok(v)&&Math.abs(v)<1e6);}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
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
/** Generate bounded planar triangles, world-space curve segments, and vector strokes.
 * Candidate counts are capped and nonfinite cells never bridge discontinuities. */
export function sample3DPlot(plot,detail){
 const fn=parse3D(plot),b=plot.bounds;const faces=[],lines=[],cap=18000;let evaluations=0,limited=false;
 const safeEval=(...args)=>{evaluations++;let value;try{value=fn(...args);}catch{return null;}return finitePoint(value)?value:null;};
 const pushTriangle=(a,c,d)=>{if(faces.length>=cap){limited=true;return;}if([a,c,d].every(finitePoint)&&[a,c,d].every(p=>inBounds(p,b))){
  const face=[a,c,d];if(plot.kind==='domain3d'){
   // The visible color follows the function phase, independent of the height mode.
   const rgb=a.domainRGB;if(rgb)face.color='#'+rgb.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
  }faces.push(face);
 }};
 if(['surface3d','parametric3d','domain3d'].includes(plot.kind)){
  const n=Math.max(8,Math.min(44,detail)),vertices=[];
  for(let j=0;j<=n;j++){const row=[];for(let i=0;i<=n;i++){
   const x=plot.kind!=='parametric3d'?b.xMin+(b.xMax-b.xMin)*i/n:plot.uMin+(plot.uMax-plot.uMin)*i/n;
   const y=plot.kind!=='parametric3d'?b.yMin+(b.yMax-b.yMin)*j/n:plot.vMin+(plot.vMax-plot.vMin)*j/n;
   row.push(safeEval(x,y));
  }vertices.push(row);}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const [a,c,d,e]=[vertices[j][i],vertices[j][i+1],vertices[j+1][i+1],vertices[j+1][i]];if(!a||!c||!d||!e)continue;
   // Skip excessive triangle jumps around poles rather than bridge invalid geometry.
   const maxEdge=Math.max(...[[a,c],[c,d],[d,e],[e,a]].map(([p,q])=>Math.hypot(...minus(p,q))));
   if(maxEdge>Math.max(b.xMax-b.xMin,b.yMax-b.yMin,b.zMax-b.zMin)*1.5)continue;
   // A phase-height branch cut jumps by nearly 2π across neighboring vertices.
   // Do not draw artificial vertical cliffs connecting unrelated sheets.
   if(plot.kind==='domain3d'&&plot.heightMode==='argument'&&Math.max(...[a,c,d,e].map(p=>p[2]))-Math.min(...[a,c,d,e].map(p=>p[2]))>Math.PI)continue;
   pushTriangle(a,c,d);pushTriangle(a,d,e);
  }
 }else if(plot.kind==='implicit3d'){
  // Six tetrahedra per cube, sharing all grid samples; bounded marching tetrahedra.
  const n=Math.min(22,Math.max(8,Math.round(detail*.65))),cube=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
  const stride=n+1,values=new Float64Array(stride**3),index=(i,j,k)=>k*stride*stride+j*stride+i;
  const at=(i,j,k)=>[b.xMin+(b.xMax-b.xMin)*i/n,b.yMin+(b.yMax-b.yMin)*j/n,b.zMin+(b.zMax-b.zMin)*k/n];
  for(let k=0;k<=n;k++)for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
   let value;try{value=fn(...at(i,j,k));}catch{value=NaN;}evaluations++;values[index(i,j,k)]=ok(value)?value:NaN;
  }
  const pairs=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
  for(let k=0;k<n;k++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const pts=cube.map(([dx,dy,dz])=>at(i+dx,j+dy,k+dz)),v=cube.map(([dx,dy,dz])=>values[index(i+dx,j+dy,k+dz)]);
   for(const ids of tets){const z=ids.map(q=>v[q]);if(z.some(x=>!ok(x)))continue;const changes=[];
    for(const [a,c] of pairs){if((z[a]<0)!==(z[c]<0)){const x=ids[a],y=ids[c],f=z[a]/(z[a]-z[c]);changes.push(pts[x].map((v,d)=>v+(pts[y][d]-v)*f));}}
    if(changes.length===3)pushTriangle(...changes);else if(changes.length===4){pushTriangle(changes[0],changes[1],changes[2]);pushTriangle(changes[0],changes[2],changes[3]);}
   }
  }
 }else if(plot.kind==='vector3d'){
  const n=plot.density;for(let k=0;k<n;k++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const center=['x','y','z'].map((axis,index)=>b[axis+'Min']+(b[axis+'Max']-b[axis+'Min'])*( [i,j,k][index]+.5)/n);
   let vec;try{vec=fn(...center);}catch{}evaluations++;
   if(!finitePoint(vec))continue;const mag=Math.hypot(...vec);if(mag<1e-10||!ok(mag))continue;
   const unit=vec.map(v=>v/mag),length=Math.min(...['x','y','z'].map(axis=>(b[axis+'Max']-b[axis+'Min'])/n))*.35*(plot.normalized?1:Math.min(1.8,mag));
   lines.push([center.map((v,q)=>v-unit[q]*length*.5),center.map((v,q)=>v+unit[q]*length*.5)]);
  }
 }
 return {faces,lines,evaluations,limited};
}
/* Reuse world meshes during camera orbit. This avoids costly resampling on every
 * pointermove; cache size is bounded even in documents with many plot objects. */
const meshCache=new Map();
function cachedMesh(plot,detail){
 const key=JSON.stringify([plot,detail]);if(meshCache.has(key)){const entry=meshCache.get(key);meshCache.delete(key);meshCache.set(key,entry);return entry;}
 const result=sample3DPlot(plot,detail);meshCache.set(key,result);
 while(meshCache.size>12)meshCache.delete(meshCache.keys().next().value);
 return result;
}
/** Project and depth-sort for an SVG painter's algorithm; no false GPU claims. */
export function project3DScene(scene,width,height){
 validate3D(scene);if(!ok(width)||!ok(height)||width<100||height<100)return {faces:[],lines:[],cube:[],evaluations:0,limited:false};
 const opt=scene.options,faces=[],lines=[],cube=[],bounds=scene.plots.find(p=>!p.hidden)?.bounds||defaultBounds3D();
 const camera=makeCamera(bounds,opt,width,height);let evaluations=0,limited=false;
 if(opt.cube){const v=[];for(let k=0;k<8;k++)v.push(camera.project([k&1?bounds.xMax:bounds.xMin,k&2?bounds.yMax:bounds.yMin,k&4?bounds.zMax:bounds.zMin]));
  for(let i=0;i<8;i++)for(const bit of [1,2,4])if(!(i&bit))cube.push([v[i],v[i|bit]]);
 }
 for(const plot of scene.plots){if(plot.hidden)continue;const result=cachedMesh(plot,opt.detail);evaluations+=result.evaluations;limited||=result.limited;
  for(const tri of result.faces){if(faces.length>=12000){limited=true;break;}const projected=tri.map(camera.project),normal=cross(minus(tri[1],tri[0]),minus(tri[2],tri[0]));const length=Math.hypot(...normal),shade=length?Math.abs(normal[0]*.35+normal[1]*.4+normal[2]*.85)/length:0;
   faces.push({points:projected,depth:projected.reduce((s,p)=>s+p[2],0)/3,shade:opt.lighting?.4+.6*shade:1,color:tri.color||plot.color,domainColoring:plot.kind==='domain3d',opacity:opt.opacity*plot.opacity});
  }
  for(const line of result.lines){if(lines.length>=2400){limited=true;break;}const p=line.map(camera.project);lines.push({start:p[0],end:p[1],depth:(p[0][2]+p[1][2])/2,color:plot.color,opacity:plot.opacity});}
  if(limited&&faces.length>=12000)break;
 }
 faces.sort((a,b)=>a.depth-b.depth);lines.sort((a,b)=>a.depth-b.depth);
 return {faces,lines,cube,evaluations,limited};
}
