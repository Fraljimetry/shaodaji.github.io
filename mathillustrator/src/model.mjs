/** MathIllustrator model v1. Pure functions: no DOM, no dynamic code execution. */
export const VERSION = 1;
export const TOOLS = ['select','pan','point','segment','arrow','circle','polygon','polyline','freehand','text'];
export const PRESETS = {
  'General': {grid:true,snap:true,snapStep:0.5,correction:'medium',showAxes:true,stroke:'#3657ad',fill:'#b6c9f9',opacity:1,width:2,pointSize:5},
  'Olympiad geometry': {grid:false,snap:true,snapStep:0.25,correction:'strong',showAxes:false,stroke:'#172b4d',fill:'#e6eef9',opacity:1,width:2,pointSize:5},
  'Research diagram': {grid:false,snap:true,snapStep:0.5,correction:'medium',showAxes:false,stroke:'#263342',fill:'#d9e8f4',opacity:1,width:2,pointSize:5},
  'Analysis / plots': {grid:true,snap:true,snapStep:0.5,correction:'gentle',showAxes:true,stroke:'#3761b8',fill:'#b6c9f9',opacity:1,width:2,pointSize:4},
  'Free illustration': {grid:false,snap:false,snapStep:0.5,correction:'off',showAxes:false,stroke:'#353e50',fill:'#d7e2f4',opacity:1,width:2,pointSize:5},
};
export const SUPPORTED = ['point','segment','arrow','line','circle','polygon','polyline','freehand','text','function','midpoint'];
export function clone(x){return JSON.parse(JSON.stringify(x));}
export function newDoc(){return {format:'mathillustrator-project',version:VERSION,meta:{title:'Untitled illustration'},settings:{...PRESETS.General,page:'infinite',background:'#ffffff'},objects:[],nextId:1};}
export function finite(v){return typeof v === 'number' && Number.isFinite(v) && Math.abs(v)<1e9;}
export function safeCoord(p){return Array.isArray(p)&&p.length===2&&p.every(finite);}
export function nextId(doc){return 'o'+doc.nextId++;}
export function append(doc,obj){const o={id:nextId(doc),hidden:false,locked:false,style:{stroke:doc.settings.stroke,fill:doc.settings.fill,width:doc.settings.width,opacity:doc.settings.opacity},...obj,name:obj.name||`${obj.type} ${doc.nextId-1}`};doc.objects.push(o);return o;}
export function get(doc,id){return doc.objects.find(o=>o.id===id);}
export function byName(doc,name){return doc.objects.find(o=>o.name===name);}
export function position(doc,id,seen=new Set()){
 const o=get(doc,id);if(!o||seen.has(id))return null;
 if(o.type==='point')return safeCoord(o.xy)?o.xy:null;
 if(o.type==='midpoint'){
  seen.add(id);const a=position(doc,o.refs?.[0],new Set(seen)),b=position(doc,o.refs?.[1],new Set(seen));
  return a&&b?[(a[0]+b[0])/2,(a[1]+b[1])/2]:null;
 }
 return null;
}
export function points(doc,o){return (o.refs||[]).map(id=>position(doc,id));}
export function affected(doc,id){let ids=new Set([id]),again=true;while(again){again=false;for(const o of doc.objects){if(!ids.has(o.id)&&o.refs?.some(r=>ids.has(r))){ids.add(o.id);again=true;}}}return ids;}
export function remove(doc,id){const ids=affected(doc,id);doc.objects=doc.objects.filter(o=>!ids.has(o.id));return ids.size;}
export function roundSnap(value,settings){const s=Number(settings.snapStep);return settings.snap&&finite(s)&&s>0?Math.round(value/s)*s:value;}
export function snapPoint(pt,settings){return pt.map(x=>roundSnap(x,settings));}
export function addPoint(doc,p,name){if(!safeCoord(p))throw Error('Point coordinates must be finite.');return append(doc,{type:'point',name,xy:clone(p)});}
export function createAnchored(doc,type,pts,style){const refs=pts.map(p=>addPoint(doc,p).id);return append(doc,{type,refs,...style});}
export function layerOrder(doc){return doc.objects.map(o=>o.id);}
export function validateDoc(raw){
 if(!raw||typeof raw!=='object'||raw.format!=='mathillustrator-project'||raw.version!==VERSION||!Array.isArray(raw.objects)||raw.objects.length>10000)throw Error('Not a supported MathIllustrator v1 project.');
 const d=clone(raw),names=new Set(),ids=new Set();
 if(!d.settings||typeof d.settings!=='object'||!d.meta||typeof d.meta.title!=='string'||!Number.isSafeInteger(d.nextId)||d.nextId<1)throw Error('Project structure is invalid.');
 for(const o of d.objects){
  if(!o||!/^o[1-9]\d*$/.test(o.id)||ids.has(o.id)||!SUPPORTED.includes(o.type)||typeof o.name!=='string'||o.name.length>180)throw Error('Invalid or repeated object ID/type/name.');
  if(o.name&&names.has(o.name))throw Error('Duplicate object name: '+o.name);
  if(o.name)names.add(o.name);ids.add(o.id);
  if(o.type==='point'&&!safeCoord(o.xy))throw Error('Invalid point coordinates.');
  if(['point','midpoint','function','text'].includes(o.type)===false&&(!Array.isArray(o.refs)&&!Array.isArray(o.path)))throw Error('Missing geometry references.');
  if(o.refs&&(!Array.isArray(o.refs)||o.refs.some(r=>typeof r!=='string')))throw Error('Invalid references.');
  if(o.path&&(!Array.isArray(o.path)||o.path.length>20000||o.path.some(p=>!safeCoord(p))))throw Error('Invalid drawing path.');
  if(o.type==='text'&&(!safeCoord(o.xy)||typeof o.text!=='string'||o.text.length>2000))throw Error('Invalid text object.');
  if(o.type==='function'&&(typeof o.expr!=='string'||o.expr.length>400))throw Error('Invalid function expression.');
  if(o.type==='freehand'&&(!Array.isArray(o.path)||o.path.length<2))throw Error('Freehand path needs at least two points.');
  if(o.type==='text'&&o.fontSize!==undefined&&(!finite(o.fontSize)||o.fontSize<5||o.fontSize>200))throw Error('Invalid font size.');
  if(o.refs){const required={segment:2,arrow:2,line:2,circle:2,midpoint:2,polygon:3,polyline:2};if(required[o.type]&&(o.refs.length<(required[o.type])||(!['polygon','polyline'].includes(o.type)&&o.refs.length!==required[o.type])))throw Error('Invalid reference count for '+o.type);}
  if(!/^#[0-9a-fA-F]{6}$/.test(o.style?.stroke||'')||!/^#[0-9a-fA-F]{6}$/.test(o.style?.fill||''))throw Error('Unsupported object color.');
  if(!o.style||typeof o.style!=='object'||!finite(o.style.width)||o.style.width<0||o.style.width>100||!finite(o.style.opacity)||o.style.opacity<0||o.style.opacity>1)throw Error('Invalid object style.');
 }
 if(d.objects.some(o=>o.refs?.some(id=>!ids.has(id))))throw Error('Dangling object reference.');
 if(!/^#[0-9a-fA-F]{6}$/.test(d.settings.background||'')||!/^#[0-9a-fA-F]{6}$/.test(d.settings.stroke||'')||!/^#[0-9a-fA-F]{6}$/.test(d.settings.fill||''))throw Error('Invalid scene color.');
 if(!finite(d.settings.snapStep)||d.settings.snapStep<=0||d.settings.snapStep>1000)throw Error('Invalid snap interval.');
 if(!['infinite','a4','letter'].includes(d.settings.page)||!['off','gentle','medium','strong'].includes(d.settings.correction)||typeof d.settings.grid!=='boolean'||typeof d.settings.snap!=='boolean'||typeof d.settings.showAxes!=='boolean')throw Error('Invalid document settings.');
 if(!finite(d.settings.width)||d.settings.width<=0||d.settings.width>100||!finite(d.settings.opacity)||d.settings.opacity<0||d.settings.opacity>1||!finite(d.settings.pointSize)||d.settings.pointSize<1||d.settings.pointSize>100)throw Error('Invalid drawing defaults.');
 const visiting=new Set(),visited=new Set(),map=new Map(d.objects.map(o=>[o.id,o]));
 function check(id){if(visiting.size>10000)throw Error('Dependency depth limit exceeded.');if(visiting.has(id))throw Error('Cyclic object dependency.');if(visited.has(id))return;visiting.add(id);for(const ref of map.get(id).refs||[])check(ref);visiting.delete(id);visited.add(id);}
 for(const id of ids)check(id);
 for(const o of d.objects)if(o.refs?.some(ref=>!['point','midpoint'].includes(map.get(ref)?.type)))throw Error('Geometry references must point to point-like objects.');
 const max=Math.max(0,...[...ids].map(id=>Number(id.slice(1))));if(d.nextId<=max)throw Error('Invalid nextId counter.');
 for(const o of d.objects)if(o.type==='function')parseExpression(o.expr);
 return d;
}
/* Small deterministic arithmetic parser (NOT JavaScript eval). */
const functions={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sqrt:Math.sqrt,abs:Math.abs,log:Math.log,ln:Math.log,exp:Math.exp,floor:Math.floor,ceil:Math.ceil};
export function parseExpression(source){
 if(typeof source!=='string'||source.length>400)throw Error('Expression must contain at most 400 characters.');
 const tokens=source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z]+|[()+\-*/^]/g)||[];
 if(tokens.join('').length!==source.replace(/\s/g,'').length)throw Error('Unsupported character in expression.');
 let i=0;const peek=()=>tokens[i],take=()=>tokens[i++];
 function primary(){const t=take();if(!t)throw Error('Incomplete expression.');
  if(t==='+'||t==='-'){const n=expression(3);return x=>(t==='-'?-1:1)*n(x);}
  if(t==='('){const n=expression(0);if(take()!==')')throw Error('Missing closing parenthesis.');return n;}
  if(/^\d|^\./.test(t)){const v=Number(t);if(!finite(v))throw Error('Numeric literal is out of range.');return ()=>v;}
  if(t==='x')return x=>x;if(t==='pi')return ()=>Math.PI;if(t==='e')return ()=>Math.E;
  if(functions[t]){if(take()!=='(')throw Error('Function '+t+' requires parentheses.');const n=expression(0);if(take()!==')')throw Error('Missing closing parenthesis.');return x=>functions[t](n(x));}
  throw Error('Unknown symbol: '+t);
 }
 const precedence={'+':1,'-':1,'*':2,'/':2,'^':4};
 function expression(min){let left=primary();while(precedence[peek()]>=min){const op=take(),p=precedence[op];const right=expression(op==='^'?p:p+1),prev=left;left=x=>{const a=prev(x),b=right(x);return op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:a**b;};}return left;}
 const fn=expression(0);if(i!==tokens.length)throw Error('Unexpected token: '+peek());return fn;
}
function resolveName(doc,name){const o=byName(doc,name.trim());if(!o||!['point','midpoint'].includes(o.type))throw Error('Unknown point: '+name.trim());return o.id;}
export function command(doc,source){
 const s=source.trim();if(!s)throw Error('Enter a construction command.');
 let m=s.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\)$/);
 if(m){if(byName(doc,m[1]))throw Error('Name already in use.');return addPoint(doc,[Number(m[2]),Number(m[3])],m[1]);}
 m=s.match(/^([A-Za-z][A-Za-z0-9_]*)\s*\(x\)\s*=\s*(.+)$/);
 if(m){if(byName(doc,m[1]))throw Error('Name already in use.');parseExpression(m[2]);return append(doc,{type:'function',name:m[1],expr:m[2]});}
 m=s.match(/^(Segment|Arrow|Line|Circle|Polygon|Polyline|Midpoint)\s*\(([^()]*)\)$/i);
 if(m){const type=m[1].toLowerCase(),a=m[2].split(',').map(x=>x.trim()).filter(Boolean);
  const expected={segment:2,arrow:2,line:2,circle:2,polygon:3,polyline:2,midpoint:2};if(a.length<expected[type]||(!['polygon','polyline'].includes(type)&&a.length!==expected[type]))throw Error('Incorrect number of point arguments.');
  const refs=a.map(name=>resolveName(doc,name));if(type==='midpoint')return append(doc,{type:'midpoint',refs});return append(doc,{type,refs});
 }
 throw Error('Unsupported command. See Tutorial for exact syntax.');
}
