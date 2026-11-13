/** MathIllustrator document model, v1: deterministic, browser-independent, no eval. */
export const VERSION = 1;
export const TOOLS = ['select','pan','point','segment','arrow','line','circle','ellipse','rectangle','polygon','polyline','bezier','angle','regularPolygon','freehand','text','node','morphism'];
export const PRESETS = {
  General: {grid:true,snap:true,snapStep:0.5,correction:'medium',plotQuality:'balanced',showAxes:true,stroke:'#3657ad',fill:'#b6c9f9',opacity:1,width:2,pointSize:5},
  'Olympiad geometry': {grid:false,snap:true,snapStep:0.25,correction:'strong',plotQuality:'balanced',showAxes:false,stroke:'#172b4d',fill:'#e6eef9',opacity:1,width:2,pointSize:5},
  'Research diagram': {grid:false,snap:true,snapStep:0.5,correction:'medium',plotQuality:'balanced',showAxes:false,stroke:'#263342',fill:'#d9e8f4',opacity:1,width:2,pointSize:5},
  'Analysis / plots': {grid:true,snap:true,snapStep:0.5,correction:'gentle',plotQuality:'detailed',showAxes:true,stroke:'#3761b8',fill:'#b6c9f9',opacity:1,width:2,pointSize:4},
  'Free illustration': {grid:false,snap:false,snapStep:0.5,correction:'off',plotQuality:'balanced',showAxes:false,stroke:'#353e50',fill:'#d7e2f4',opacity:1,width:2,pointSize:5},
  'Commutative diagrams': {grid:false,snap:true,snapStep:1,correction:'off',plotQuality:'balanced',showAxes:false,stroke:'#1d3557',fill:'#ffffff',opacity:1,width:1.6,pointSize:5},
};
export const PRESET_MODULES = {
 General:{basic:true,construction:true,illustration:true,diagram:true},
 'Olympiad geometry':{basic:true,construction:true,illustration:true,diagram:false},
 'Research diagram':{basic:true,construction:false,illustration:true,diagram:true},
 'Analysis / plots':{basic:true,construction:true,illustration:false,diagram:false},
 'Free illustration':{basic:true,construction:true,illustration:true,diagram:false},
 'Commutative diagrams':{basic:true,construction:false,illustration:false,diagram:true},
};
export const SUPPORTED = ['point','midpoint','segment','arrow','line','circle','ellipse','rectangle','polygon','polyline','bezier','angle','regularPolygon','freehand','text','function','node','morphism'];
const POINT_LIKE = new Set(['point','midpoint']);
const REF_LENGTHS = {midpoint:2,segment:2,arrow:2,line:2,circle:2,ellipse:2,rectangle:2,bezier:4,angle:3,regularPolygon:2,morphism:2};
const HEX = /^#[0-9a-fA-F]{6}$/;
/** Unicode scalar values admitted by XML 1.0; SVG exports are XML, not HTML.
 * Reject rather than silently replace NUL, C0 controls or lone UTF-16 surrogates.
 */
export function xmlTextSafe(value){
 if(typeof value!=='string')return false;
 for(const ch of value){const c=ch.codePointAt(0);
  if(!(c===9||c===10||c===13||(c>=32&&c<=0xd7ff)||(c>=0xe000&&c<=0xfffd)||(c>=0x10000&&c<=0x10ffff)))return false;
 }
 return true;
}
export function clone(x){return JSON.parse(JSON.stringify(x));}
export function newDoc(){return {format:'mathillustrator-project',version:VERSION,meta:{title:'Untitled illustration'},settings:{...PRESETS.General,page:'infinite',background:'#ffffff',exportRegion:'viewport',exportGuides:false,exportScale:2,exportTransparent:false,showLabels:true,labelPlacement:'standard',snapAnchors:true,polygonSides:6,modules:{...PRESET_MODULES.General}},objects:[],nextId:1};}
export function finite(v){return typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e9;}
export function safeCoord(p){return Array.isArray(p)&&p.length===2&&p.every(finite);}
export function get(doc,id){return doc.objects.find(o=>o.id===id);}
export function byName(doc,name){return doc.objects.find(o=>o.name===name);}
export function nextId(doc){if(!Number.isSafeInteger(doc.nextId)||doc.nextId>Number.MAX_SAFE_INTEGER-1)throw Error('Object ID capacity exceeded.');return 'o'+doc.nextId++;}
export function append(doc,obj){
 if(!SUPPORTED.includes(obj.type))throw Error('Unsupported object type: '+obj.type);
 if(!Number.isSafeInteger(doc.nextId)||doc.nextId<1||doc.nextId>Number.MAX_SAFE_INTEGER-1)throw Error('Object ID capacity exceeded.');
 const id='o'+doc.nextId,name=obj.name||`${obj.type} ${doc.nextId}`;
 if(byName(doc,name))throw Error('Name already in use: '+name);
 doc.nextId++;
 const style={stroke:doc.settings.stroke,fill:doc.settings.fill,width:doc.settings.width,opacity:doc.settings.opacity};
 if(POINT_LIKE.has(obj.type))style.pointSize=doc.settings.pointSize;
 const o={id,hidden:false,locked:false,style,...obj,name};
 doc.objects.push(o);return o;
}
export function addPoint(doc,p,name){if(!safeCoord(p))throw Error('Point coordinates must be finite.');return append(doc,{type:'point',name,xy:clone(p)});}
/** Freeze the displayed radii of legacy v1 point/midpoint objects which were
 * allowed to omit per-object pointSize. A change in *new object style* must
 * never retroactively resize already drawn geometry. This is an explicit
 * non-destructive migration only when the user changes that drawing default.
 */
export function preserveInheritedPointSizes(doc){
 let pinned=0;
 for(const o of doc.objects){
  if(POINT_LIKE.has(o.type)&&o.style?.pointSize===undefined){o.style.pointSize=doc.settings.pointSize;pinned++;}
 }
 return pinned;
}

export function createAnchored(doc,type,pts,opts={}){if(!Array.isArray(pts)||!pts.every(safeCoord))throw Error('Invalid construction points.');const refs=pts.map(p=>addPoint(doc,p).id);return append(doc,{type,refs,...opts});}
/** Returns a resolver which indexes the scene once, caches positions, and detects cycles. */
export function createResolver(doc){
 const objects=new Map(doc.objects.map(o=>[o.id,o])),cache=new Map();
 function at(id){
  if(cache.has(id))return cache.get(id);
  const stack=[[id,false]],active=new Set();
  while(stack.length){
   const [current,ready]=stack.pop();
   if(cache.has(current))continue;
   const obj=objects.get(current);
   if(!obj){cache.set(current,null);continue;}
   if(ready){
    let p=null;
    if((obj.type==='point'||obj.type==='node')&&safeCoord(obj.xy))p=obj.xy;
    if(obj.type==='midpoint'&&obj.refs?.length===2){const a=cache.get(obj.refs[0]),b=cache.get(obj.refs[1]);if(a&&b)p=[(a[0]+b[0])/2,(a[1]+b[1])/2];}
    cache.set(current,p);active.delete(current);continue;
   }
   if(active.has(current)){cache.set(current,null);continue;}
   active.add(current);stack.push([current,true]);
   if(obj.type==='midpoint')for(const ref of obj.refs||[])if(!cache.has(ref))stack.push([ref,false]);
  }
  return cache.get(id)||null;
 }
 return {at,points:o=>(o.refs||[]).map(at),object:id=>objects.get(id)};
}
export function position(doc,id){return createResolver(doc).at(id);}
export function points(doc,o){return createResolver(doc).points(o);}
export function affected(doc,id){
 // Build a reverse adjacency index once. Repeated full-scene passes become quadratic
 // for deep midpoint chains and can stall deletion of a single root vertex.
 const reverse=new Map();for(const o of doc.objects)for(const ref of o.refs||[]){if(!reverse.has(ref))reverse.set(ref,[]);reverse.get(ref).push(o.id);}
 const ids=new Set([id]),queue=[id];for(let i=0;i<queue.length;i++)for(const child of reverse.get(queue[i])||[])if(!ids.has(child)){ids.add(child);queue.push(child);}
 return ids;
}
export function remove(doc,id){const ids=affected(doc,id);doc.objects=doc.objects.filter(o=>!ids.has(o.id));return ids.size;}
/** Prevent a previously valid live construction from silently collapsing when
 * an anchor moves. Legacy degenerate v1 objects remain importable, and an
 * unrelated edit is never rejected because some historical shape was invalid.
 * This is a move guard, not a general constraint solver or tolerance repair.
 */
export function guardAnchorMove(before,after,anchorId){
 const watched=affected(after,anchorId),oldResolver=createResolver(before),newResolver=createResolver(after);
 function defect(o,resolver){
  if(!o.refs)return null;
  const p=resolver.points(o);if(!p.every(Boolean))return null;
  if(o.type==='morphism')return Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9?'coincident diagram nodes':null;
  try{checkNewGeometry(o.type,p);}catch(e){return e.message;}
  if(['polygon','polyline'].includes(o.type)){
   for(let i=1;i<p.length;i++)if(Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])<1e-9)return 'consecutive vertices coincide';
   if(o.type==='polygon'&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-9)return 'closing vertices coincide';
  }
  return null;
 }
 const oldObjects=new Map(before.objects.map(o=>[o.id,o]));
 for(const o of after.objects){if(!watched.has(o.id)||!o.refs)continue;
  const prior=oldObjects.get(o.id);if(!prior)continue;
  const oldProblem=defect(prior,oldResolver),newProblem=defect(o,newResolver);
  if(!oldProblem&&newProblem)throw Error(`Moving this anchor would collapse ${o.name}: ${newProblem}.`);
 }
}
export function layerOrder(doc){return doc.objects.map(o=>o.id);}
export function roundSnap(v,s){
 if(!s.snap)return v;
 const step=Number(s.snapStep);
 if(!finite(step)||step<1e-6||step>1000)throw Error('Snap interval must be between 0.000001 and 1000.');
 const snapped=Math.round(v/step)*step;
 if(!finite(snapped))throw Error('Snapped coordinate exceeds the supported range.');
 return snapped;
}
export function snapPoint(p,s){return p.map(v=>roundSnap(v,s));}
const FUNCS={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sqrt:Math.sqrt,abs:Math.abs,log:Math.log,ln:Math.log,exp:Math.exp,floor:Math.floor,ceil:Math.ceil};
/** Strict arithmetic parser; no JavaScript evaluation, member access, or implicit multiplication. */
export function parseExpression(source){
 if(typeof source!=='string'||!source.trim()||source.length>400)throw Error('Expression must contain 1–400 characters.');
 const tokens=source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z]+|[()+\-*/^]/g)||[];
 if(tokens.join('').length!==source.replace(/\s/g,'').length)throw Error('Unsupported character in expression.');
 let i=0;const peek=()=>tokens[i],take=()=>tokens[i++];
 function primary(){
  const t=take();if(!t)throw Error('Incomplete expression.');
  if(t==='+'||t==='-'){const n=expression(3);return x=>(t==='-'?-1:1)*n(x);}
  if(t==='('){const n=expression(0);if(take()!==')')throw Error('Missing closing parenthesis.');return n;}
  if(/^(?:\d|\.)/.test(t)){const v=Number(t);if(!finite(v))throw Error('Numeric literal out of range.');return ()=>v;}
  if(t==='x')return x=>x;
  if(t==='pi')return ()=>Math.PI;
  if(t==='e')return ()=>Math.E;
  if(Object.hasOwn(FUNCS,t)){
   if(take()!=='(')throw Error(`Function ${t} requires parentheses.`);
   const n=expression(0);if(take()!==')')throw Error('Missing closing parenthesis.');return x=>FUNCS[t](n(x));
  }
  throw Error('Unknown symbol: '+t);
 }
 const prec={'+':1,'-':1,'*':2,'/':2,'^':4};
 function expression(min){let left=primary();while(prec[peek()]>=min){const op=take(),p=prec[op],right=expression(op==='^'?p:p+1),prev=left;left=x=>{const a=prev(x),b=right(x);return op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:a**b;};}return left;}
 const fn=expression(0);if(i!==tokens.length)throw Error('Unexpected token: '+peek());return fn;
}
/** Reject invisible *new* geometry without invalidating legacy v1 projects on import. */
export function checkNewGeometry(type,p){
 if(['segment','arrow','line','circle','regularPolygon'].includes(type)&&Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9)throw Error('Construction requires distinct points.');
 if(type==='rectangle'&&(Math.abs(p[0][0]-p[1][0])<1e-9||Math.abs(p[0][1]-p[1][1])<1e-9))throw Error('Rectangle requires nonzero width and height.');
 if(type==='angle'&&(Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9||Math.hypot(p[2][0]-p[1][0],p[2][1]-p[1][1])<1e-9))throw Error('Angle requires distinct rays.');
}
function pointName(doc,name){const o=byName(doc,name.trim());if(!o||!POINT_LIKE.has(o.type))throw Error('Unknown point: '+name.trim());return o.id;}
export function command(doc,source){
 const s=String(source).trim();if(!s)throw Error('Enter a construction command.');
 const num='([+-]?(?:(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?))';
 let m=s.match(new RegExp('^([A-Za-z][A-Za-z0-9_]*)\\s*=\\s*\\(\\s*'+num+'\\s*,\\s*'+num+'\\s*\\)$'));
 if(m){if(byName(doc,m[1]))throw Error('Name already in use.');return addPoint(doc,[Number(m[2]),Number(m[3])],m[1]);}
 m=s.match(/^([A-Za-z][A-Za-z0-9_]*)\s*\(x\)\s*=\s*(.+)$/);
 if(m){if(byName(doc,m[1]))throw Error('Name already in use.');parseExpression(m[2]);return append(doc,{type:'function',name:m[1],expr:m[2]});}
 m=s.match(/^(Segment|Arrow|Line|Circle|Ellipse|Rectangle|Polygon|Polyline|Bezier|Angle|Midpoint)\s*\(([^()]*)\)$/i);
 if(m){const type=m[1].toLowerCase(),parts=m[2].split(',').map(s=>s.trim());const min={segment:2,arrow:2,line:2,circle:2,ellipse:2,rectangle:2,polygon:3,polyline:2,bezier:4,angle:3,midpoint:2}[type];
  if(parts.some(x=>!x)||parts.length<min||(!['polygon','polyline'].includes(type)&&parts.length!==min))throw Error('Incorrect number of point arguments.');
  const refs=parts.map(name=>pointName(doc,name));checkNewGeometry(type,refs.map(id=>position(doc,id)));return append(doc,{type,refs});
 }
 m=s.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*Node\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*"([^"\\]{1,180})"\s*\)$/i);
 if(m){if(byName(doc,m[1]))throw Error('Name already in use.');return append(doc,{type:'node',name:m[1],xy:[Number(m[2]),Number(m[3])],text:m[4],fontSize:17});}
 m=s.match(/^RegularPolygon\(\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*(\d+)\s*\)$/i);
 if(m){const sides=Number(m[3]);if(!Number.isInteger(sides)||sides<3||sides>100)throw Error('Regular polygon sides must be 3–100.');const a=pointName(doc,m[1]),b=pointName(doc,m[2]),u=position(doc,a),v=position(doc,b);if(!u||!v||Math.hypot(u[0]-v[0],u[1]-v[1])<1e-9)throw Error('Regular polygon needs distinct center and vertex.');return append(doc,{type:'regularPolygon',refs:[a,b],sides});}
 m=s.match(/^Morphism\(\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*"([^"\\]{0,180})"\s*\)$/i);
 if(m){const refs=m.slice(1,3).map(name=>{const o=byName(doc,name);if(o?.type!=='node')throw Error('Unknown diagram node: '+name);return o.id;});if(refs[0]===refs[1])throw Error('Self-morphism is not yet supported.');return append(doc,{type:'morphism',refs,text:m[3],bend:0});}
 throw Error('Unsupported command. See Tutorial for exact syntax.');
}
export function validateDoc(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.format!=='mathillustrator-project'||raw.version!==VERSION||!Array.isArray(raw.objects)||raw.objects.length>10000)throw Error('Not a supported MathIllustrator v1 project.');
 const d=clone(raw);if(!d.settings||typeof d.settings!=='object'||!d.meta||typeof d.meta.title!=='string'||d.meta.title.length>240||!Number.isSafeInteger(d.nextId)||d.nextId<1)throw Error('Project structure is invalid.');
 const ids=new Set(),names=new Set();let max=0;
 for(const o of d.objects){
  if(!o||typeof o!=='object'||!/^o[1-9]\d*$/.test(o.id)||ids.has(o.id)||!SUPPORTED.includes(o.type)||typeof o.name!=='string'||!o.name.trim()||o.name.length>180)throw Error('Invalid or repeated object ID/type/name.');
  if(!xmlTextSafe(o.name))throw Error('Object name contains characters illegal in SVG XML.');
  if(names.has(o.name))throw Error('Duplicate object name: '+o.name);
  if(typeof o.hidden!=='boolean'||typeof o.locked!=='boolean')throw Error('Invalid visibility or lock flag.');
  const numericId=Number(o.id.slice(1));if(!Number.isSafeInteger(numericId))throw Error('Object ID outside safe integer range.');
  ids.add(o.id);names.add(o.name);max=Math.max(max,numericId);
  if(!o.style||!HEX.test(o.style.stroke)||!HEX.test(o.style.fill)||!finite(o.style.width)||o.style.width<0.1||o.style.width>100||!finite(o.style.opacity)||o.style.opacity<0||o.style.opacity>1)throw Error('Invalid object style or color.');
  if(o.style.pointSize!==undefined&&(!POINT_LIKE.has(o.type)||!finite(o.style.pointSize)||o.style.pointSize<1||o.style.pointSize>100))throw Error('Object point size must be 1–100 on points or midpoints.');
  const len=REF_LENGTHS[o.type];
  if(len!==undefined){if(!Array.isArray(o.refs)||o.refs.length!==len||o.refs.some(x=>typeof x!=='string'))throw Error('Invalid reference count for '+o.type);}
  else if(o.type==='polygon'||o.type==='polyline'){if(!Array.isArray(o.refs)||o.refs.length<(o.type==='polygon'?3:2)||o.refs.length>2000||o.refs.some(x=>typeof x!=='string'))throw Error('Invalid vertex references.');}
  else if(o.refs!==undefined)throw Error('Unexpected object references.');
  if(o.type==='point'||o.type==='node'||o.type==='text'){if(!safeCoord(o.xy))throw Error('Invalid object coordinates.');}
  if(o.type==='freehand'&&(!Array.isArray(o.path)||o.path.length<2||o.path.length>20000||!o.path.every(safeCoord)))throw Error('Invalid freehand path.');
  if(o.path!==undefined&&o.type!=='freehand')throw Error('Unexpected drawing path.');
  if(['text','node'].includes(o.type)){if(!xmlTextSafe(o.text))throw Error('Text contains characters illegal in SVG XML.');if(o.text.length>(o.type==='text'?2000:1000)||!finite(o.fontSize??18)||o.fontSize<5||o.fontSize>200)throw Error('Invalid text label.');}
  if(o.type==='regularPolygon'&&(!Number.isInteger(o.sides)||o.sides<3||o.sides>100))throw Error('Regular polygon sides must be 3–100.');
  if(o.type==='function'){if(typeof o.expr!=='string')throw Error('Invalid function expression.');parseExpression(o.expr);}
  if(o.type==='morphism'&&!xmlTextSafe(o.text))throw Error('Morphism label contains characters illegal in SVG XML.');
  if(o.type==='morphism'&&(o.text.length>1000||!finite(o.bend??0)||Math.abs(o.bend)>5||o.refs[0]===o.refs[1]))throw Error('Invalid morphism label or bend.');
  if(o.swap!==undefined&&(o.type!=='morphism'||typeof o.swap!=='boolean'))throw Error('Invalid morphism label-side flag.');
  if(o.routing!==undefined&&(o.type!=='morphism'||!['direct','avoid','avoid-crossings','scene-crossings'].includes(o.routing)))throw Error('Invalid morphism routing mode.');
  if(o.labelAvoid!==undefined&&(o.type!=='morphism'||typeof o.labelAvoid!=='boolean'))throw Error('Invalid morphism label avoidance flag.');
  for(const [key,min,max] of [['labelT',.05,.95],['labelDistance',0,200],['labelDx',-300,300],['labelDy',-300,300]]){
   if(o[key]!==undefined&&(o.type!=='morphism'||!finite(o[key])||o[key]<min||o[key]>max))throw Error('Invalid morphism '+key+' setting.');
  }

 }
 if(!Number.isFinite(max)||d.nextId<=max)throw Error('Invalid nextId counter.');
 if(!HEX.test(d.settings.background)||!HEX.test(d.settings.stroke)||!HEX.test(d.settings.fill))throw Error('Invalid scene color.');
 if(!finite(d.settings.snapStep)||d.settings.snapStep<1e-6||d.settings.snapStep>1000)throw Error('Snap interval must be between 0.000001 and 1000.');
 if(!['infinite','a4','letter'].includes(d.settings.page)||!['off','gentle','medium','strong'].includes(d.settings.correction)||typeof d.settings.grid!=='boolean'||typeof d.settings.snap!=='boolean'||typeof d.settings.showAxes!=='boolean')throw Error('Invalid document settings.');
 if(!finite(d.settings.width)||d.settings.width<0.1||d.settings.width>100||!finite(d.settings.opacity)||d.settings.opacity<0||d.settings.opacity>1||!finite(d.settings.pointSize)||d.settings.pointSize<1||d.settings.pointSize>100)throw Error('Invalid drawing defaults.');
 // Optional v1 extensions are given defaults when opening older v1 projects.
 if(d.settings.plotQuality===undefined)d.settings.plotQuality='balanced';
 if(!['fast','balanced','detailed'].includes(d.settings.plotQuality))throw Error('Plot detail must be Fast, Balanced or Detailed.');
 if(d.settings.polygonSides===undefined)d.settings.polygonSides=6;
 if(!Number.isInteger(d.settings.polygonSides)||d.settings.polygonSides<3||d.settings.polygonSides>100)throw Error('Default regular polygon sides must be 3–100.');
 if(d.settings.exportRegion===undefined)d.settings.exportRegion='viewport';
 if(d.settings.exportGuides===undefined)d.settings.exportGuides=false;
 if(d.settings.exportScale===undefined)d.settings.exportScale=2;
 if(d.settings.exportTransparent===undefined)d.settings.exportTransparent=false;
 if(typeof d.settings.exportTransparent!=='boolean')throw Error('Export transparency must be on or off.');
 if(typeof d.settings.exportGuides!=='boolean'||!Number.isInteger(d.settings.exportScale)||d.settings.exportScale<1||d.settings.exportScale>4)throw Error('Invalid export guides or raster scale.');
 if(d.settings.showLabels===undefined)d.settings.showLabels=true;
 if(d.settings.labelPlacement===undefined)d.settings.labelPlacement='standard';
 if(!['standard','avoid'].includes(d.settings.labelPlacement))throw Error('Invalid point label placement setting.');
 if(d.settings.snapAnchors===undefined)d.settings.snapAnchors=true;
 if(d.settings.modules===undefined)d.settings.modules={...PRESET_MODULES.General};
 if(!d.settings.modules||typeof d.settings.modules!=='object'||Object.keys(PRESET_MODULES.General).some(k=>typeof d.settings.modules[k]!=='boolean'))throw Error('Invalid tool visibility settings.');
 if(d.settings.page==='infinite'&&d.settings.exportRegion==='page')throw Error('Page-only export requires a finite page frame.');
 if(!['viewport','page'].includes(d.settings.exportRegion)||typeof d.settings.showLabels!=='boolean'||typeof d.settings.snapAnchors!=='boolean')throw Error('Invalid extended settings.');
 const objects=new Map(d.objects.map(o=>[o.id,o]));
 for(const o of d.objects)for(const ref of o.refs||[]){const parent=objects.get(ref);if(!parent)throw Error('Dangling object reference.');
  if(o.type==='morphism'?parent.type!=='node':!POINT_LIKE.has(parent.type))throw Error('Invalid reference target for '+o.type);}
 // Iterative graph walk avoids stack exhaustion with deeply nested midpoint chains.
 const resolver=d.objects.some(o=>o.type==='regularPolygon')?createResolver(d):null;
 for(const o of d.objects)if(o.type==='regularPolygon'){const p=resolver.points(o);if(!p.every(Boolean)||Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9)throw Error('Regular polygon needs distinct center and vertex.');}
 const state=new Map();for(const id of ids){if(state.get(id)===2)continue;const stack=[[id,false]];while(stack.length){const [current,done]=stack.pop();if(done){state.set(current,2);continue;}const old=state.get(current);if(old===2)continue;if(old===1)throw Error('Cyclic object dependency.');state.set(current,1);stack.push([current,true]);for(const ref of objects.get(current).refs||[])if(state.get(ref)!==2)stack.push([ref,false]);}}
 return d;
}
