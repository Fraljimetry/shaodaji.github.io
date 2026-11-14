import {newScene3D,validate3D} from './plot3d.mjs?cut=round42';
import {parseCurveExpression,parseParametric,parseImplicit,parseVectorField,parseComplexExpression,validatePlotRegion} from './plot_modes.mjs?cut=round39';
/** MathIllustrator document model, v1: deterministic, browser-independent, no eval. */
/** Pure derived polygon vertices. Shared by the model's dynamic side segments
 * and the renderer/snapping module; never materialize virtual corners as points. */
export function regularPolygonVertices(center,vertex,sides){
 if(!safeCoord(center)||!safeCoord(vertex)||!Number.isInteger(sides)||sides<3||sides>100)return [];
 const dx=vertex[0]-center[0],dy=vertex[1]-center[1],r=Math.hypot(dx,dy);
 if(!Number.isFinite(r)||r<1e-10)return [];
 const phase=Math.atan2(dy,dx);
 return Array.from({length:sides},(_,i)=>[center[0]+r*Math.cos(phase+i*2*Math.PI/sides),center[1]+r*Math.sin(phase+i*2*Math.PI/sides)]);
}
/** The single authoritative vertex construction for rendering, snapping,
 * derived segments and exports. Old two-point rectangles are kept compatible.
 * New rectangles take first edge AB and a height guide C: the latter is
 * projected perpendicular to AB, so the drawn figure is always rectangular.
 * Parallelograms take three consecutive vertices A-B-C. */
export function shapeVerticesFromPoints(type,p){
 if(!Array.isArray(p)||!p.every(safeCoord))return [];
 if(type==='parallelogram'&&p.length===3){
  const [a,b,c]=p,d=[a[0]+c[0]-b[0],a[1]+c[1]-b[1]];
  const cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
  return safeCoord(d)&&Math.abs(cross)>1e-9*Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1])*Math.hypot(c[0]-b[0],c[1]-b[1]))?[a,b,c,d]:[];
 }
 if(type!=='rectangle')return [];
 if(p.length===2){
  const [a,b]=p,minX=Math.min(a[0],b[0]),maxX=Math.max(a[0],b[0]),minY=Math.min(a[1],b[1]),maxY=Math.max(a[1],b[1]);
  return maxX-minX>=1e-9&&maxY-minY>=1e-9?[[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]]:[];
 }
 if(p.length!==3)return [];
 const [a,b,c]=p,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 if(length<1e-9)return [];
 const nx=-dy/length,ny=dx/length,height=(c[0]-b[0])*nx+(c[1]-b[1])*ny;
 if(!Number.isFinite(height)||Math.abs(height)<1e-9)return [];
 const third=[b[0]+height*nx,b[1]+height*ny],fourth=[a[0]+height*nx,a[1]+height*ny];
 return safeCoord(third)&&safeCoord(fourth)?[a,b,third,fourth]:[];
}
export function derivedShapeVertices(owner,at){
 if(!owner||!['rectangle','regularPolygon','parallelogram'].includes(owner.type)||!Array.isArray(owner.refs))return [];
 const p=owner.refs.map(at);if(!p.every(safeCoord))return [];
 return owner.type==='regularPolygon'?regularPolygonVertices(p[0],p[1],owner.sides):shapeVerticesFromPoints(owner.type,p);
}
export function derivedSidePoints(edge,owner,at){
 if(!edge||!Number.isInteger(edge.edgeIndex)||edge.edgeIndex<0)return null;
 const vertices=derivedShapeVertices(owner,at),i=edge.edgeIndex;
 return i<vertices.length?[vertices[i],vertices[(i+1)%vertices.length]]:null;
}
export const VERSION = 1;
export const TOOLS = ['select','pan','point','midpoint','segment','arrow','line','ray','perpBisector','parallelThrough','perpendicularThrough','intersection','circleIntersection','circleCircleIntersection','circle','circleThrough3','circleDiameter','triangle','quadrilateral','ellipse','rectangle','parallelogram','polygon','polyline','bezier','angle','regularPolygon','spline','closedSpline','freehand','text','node','morphism'];
export const PRESETS = {
  General: {grid:true,snap:false,snapStep:0.5,correction:'ultra',plotQuality:'balanced',plotBudget:1000000,implicitGrid:12,showAxes:true,stroke:'#000000',fill:'#000000',opacity:1,width:2,pointSize:5},
  'Olympiad geometry': {grid:false,snap:true,snapStep:0.25,correction:'strong',plotQuality:'balanced',plotBudget:80000,implicitGrid:12,showAxes:false,stroke:'#000000',fill:'#000000',opacity:1,width:2,pointSize:5},
  'Research diagram': {grid:false,snap:true,snapStep:0.5,correction:'medium',plotQuality:'balanced',plotBudget:80000,implicitGrid:12,showAxes:false,stroke:'#000000',fill:'#000000',opacity:1,width:2,pointSize:5},
  'Analysis / plots': {grid:true,snap:true,snapStep:0.5,correction:'gentle',plotQuality:'detailed',plotBudget:1000000,implicitGrid:12,showAxes:true,stroke:'#000000',fill:'#000000',opacity:1,width:2,pointSize:4},
  'Free illustration': {grid:false,snap:false,snapStep:0.5,correction:'off',plotQuality:'balanced',plotBudget:80000,implicitGrid:12,showAxes:false,stroke:'#000000',fill:'#000000',opacity:1,width:2,pointSize:5},
  'Commutative diagrams': {grid:false,snap:true,snapStep:1,correction:'off',plotQuality:'balanced',plotBudget:80000,implicitGrid:12,showAxes:false,stroke:'#000000',fill:'#000000',opacity:1,width:1.6,pointSize:5},
};
export const PRESET_MODULES = {
 General:{basic:true,construction:true,illustration:true,diagram:true},
 'Olympiad geometry':{basic:true,construction:true,illustration:true,diagram:false},
 'Research diagram':{basic:true,construction:false,illustration:true,diagram:true},
 'Analysis / plots':{basic:true,construction:true,illustration:false,diagram:false},
 'Free illustration':{basic:true,construction:true,illustration:true,diagram:false},
 'Commutative diagrams':{basic:true,construction:false,illustration:false,diagram:true},
};
export const SUPPORTED = ['point','midpoint','segment','arrow','line','ray','perpBisector','parallelThrough','perpendicularThrough','intersection','circleIntersection','circleCircleIntersection','circle','circleThrough3','ellipse','rectangle','parallelogram','polygon','polyline','bezier','angle','regularPolygon','spline','freehand','text','function','parametric','implicit','vectorField','domainColoring','node','morphism'];
const POINT_LIKE = new Set(['point','midpoint','intersection','circleIntersection','circleCircleIntersection']);
export const STRAIGHT_TYPES = new Set(['segment','arrow','line','ray','perpBisector','parallelThrough','perpendicularThrough']);
const REF_LENGTHS = {midpoint:2,segment:2,arrow:2,line:2,ray:2,perpBisector:2,parallelThrough:2,perpendicularThrough:2,intersection:2,circleIntersection:2,circleCircleIntersection:2,circle:2,circleThrough3:3,ellipse:2,rectangle:3,parallelogram:3,bezier:4,angle:3,regularPolygon:2,morphism:2};
/** Three-point ellipse: focus, focus, any point on the curve.
 * The old two-reference rectangle-bounds ellipse is intentionally retained.
 * Return null rather than producing NaN/Infinity on collapsed input. */
export function focalEllipse(p){
 if(!Array.isArray(p)||p.length!==3||!p.every(safeCoord))return null;
 const [f1,f2,q]=p,dx=f2[0]-f1[0],dy=f2[1]-f1[1];
 const c=Math.hypot(dx,dy)/2,a=(Math.hypot(q[0]-f1[0],q[1]-f1[1])+Math.hypot(q[0]-f2[0],q[1]-f2[1]))/2;
 if(!Number.isFinite(a)||!Number.isFinite(c)||a-c<=Math.max(1e-9,a*1e-10))return null;
 const b=Math.sqrt((a-c)*(a+c)),cx=(f1[0]+f2[0])/2,cy=(f1[1]+f2[1])/2;
 if(!Number.isFinite(b)||b<=0||![cx,cy].every(finite))return null;
 return {cx,cy,rx:a,ry:b,angle:Math.atan2(dy,dx)};
}
/** Unique circle through three noncollinear world points. Translated coordinates
 * avoid cancellation of large absolute positions, and near-collinear clicks
 * are rejected rather than creating an invisible huge radius. */
export function circumcircle(points){
 if(!Array.isArray(points)||points.length!==3||!points.every(safeCoord))return null;
 const [a,b,c]=points,ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-a[0],vy=c[1]-a[1];
 const u2=ux*ux+uy*uy,v2=vx*vx+vy*vy,cross=ux*vy-uy*vx;
 if(!Number.isFinite(cross)||Math.abs(cross)<=1e-9*Math.sqrt(u2*v2)||u2<1e-18||v2<1e-18)return null;
 const x=(u2*vy-v2*uy)/(2*cross),y=(v2*ux-u2*vx)/(2*cross);
 const center=[a[0]+x,a[1]+y],radius=Math.hypot(x,y);
 if(!center.every(finite)||!finite(radius)||radius<1e-9)return null;
 return {center,radius};
}
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
/** A one-time compatibility correction for browser-autorecovered old projects.
 * The original default presets shipped blue-tinted stroke/fill pairs. Since
 * they are indistinguishable from manual settings, only migrate exact known
 * historical pairs; never recolor existing objects or alter imported JSON.
 * Choosing a new color in Settings continues to override the default. */
const LEGACY_PRESET_COLORS=[
 ['#3657ad','#b6c9f9'],['#172b4d','#e6eef9'],
 ['#263342','#d9e8f4'],['#3761b8','#b6c9f9'],
 ['#353e50','#d7e2f4'],['#1d3557','#ffffff']
];
export function upgradeRecoveredLegacyPalette(project){
 const defaults=project?.settings;
 if(defaults&&LEGACY_PRESET_COLORS.some(([stroke,fill])=>
    defaults.stroke.toLowerCase()===stroke&&defaults.fill.toLowerCase()===fill)){
  defaults.stroke='#000000';defaults.fill='#000000';
 }
 return project;
}
export function clone(x){return JSON.parse(JSON.stringify(x));}
export function newDoc(){return {format:'mathillustrator-project',version:VERSION,meta:{title:'Untitled illustration'},settings:{...PRESETS.General,namingConvention:'pascal',page:'infinite',background:'#ffffff',exportRegion:'viewport',exportGuides:true,exportScale:2,exportTransparent:false,showLabels:true,freehandClose:'near',labelPlacement:'avoid',snapAnchors:true,snapObjects:true,polygonSides:6,plot3dEnabled:false,modules:{...PRESET_MODULES.General}},scene3d:newScene3D(),objects:[],nextId:1};}
export function finite(v){return typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e9;}
export function safeCoord(p){return Array.isArray(p)&&p.length===2&&p.every(finite);}
export function get(doc,id){return doc.objects.find(o=>o.id===id);}
/** Owned polygon/rectangle sides inherit their owner's canvas visibility.
 * Other dependent constructions remain individually visible when the user
 * hides an anchor or source. No ownership/visibility fields are rewritten. */
export function isObjectVisible(doc,object,ownerLookup=null){
 if(!object||object.hidden||object.style?.opacity===0)return false;
 if(!object.edgeOf)return true;
 // Resolver/index lookups are O(1); avoid quadratic passes over dense scenes.
 const owner=ownerLookup?ownerLookup(object.edgeOf):get(doc,object.edgeOf);
 return !!owner&&!owner.hidden&&owner.style?.opacity!==0;
}
export function byName(doc,name){return doc.objects.find(o=>o.name===name);}
export function nextId(doc){if(!Number.isSafeInteger(doc.nextId)||doc.nextId>Number.MAX_SAFE_INTEGER-1)throw Error('Object ID capacity exceeded.');return 'o'+doc.nextId++;}
/** Naming affects future automatic names only. Never rename references or existing objects. */
export function automaticName(doc,type){
 const convention=doc.settings?.namingConvention??'camel'; // Older v1 documents kept their original scheme.
 if(!['pascal','camel','snake'].includes(convention))throw Error('Invalid object naming convention.');
 const label=convention==='camel'?type:(type==='arrow'?'vector':type);
 const base=convention==='pascal'?label[0].toUpperCase()+label.slice(1):
  convention==='snake'?label.replace(/[A-Z]/g,letter=>'_'+letter.toLowerCase()):label;
 return `${base} ${doc.nextId}`;
}
export function append(doc,obj){
 if(!SUPPORTED.includes(obj.type))throw Error('Unsupported object type: '+obj.type);
 if(!Number.isSafeInteger(doc.nextId)||doc.nextId<1||doc.nextId>Number.MAX_SAFE_INTEGER-1)throw Error('Object ID capacity exceeded.');
 const id='o'+doc.nextId,name=obj.name||automaticName(doc,obj.type);
 // Preserve fail-closed collision handling. Automatic names also avoid case-
 // only ambiguity when crossing conventions, with a single scene scan.
 if(doc.objects.some(o=>o.name===name||(!obj.name&&o.name.toLowerCase()===name.toLowerCase())))throw Error('Name already in use: '+name);
 doc.nextId++;
 const style={stroke:doc.settings.stroke,fill:doc.settings.fill,width:doc.settings.width,opacity:doc.settings.opacity};
 if(POINT_LIKE.has(obj.type))style.pointSize=doc.settings.pointSize;
 const o={id,hidden:false,locked:false,style,...obj,name};
 if(POINT_LIKE.has(obj.type)&&o.pointLabelMode===undefined)o.pointLabelMode='latex';
 else if(!POINT_LIKE.has(obj.type)&&!['text','node','morphism'].includes(obj.type)&&o.displayLabelMode===undefined)o.displayLabelMode='latex';
 if(['text','node','morphism'].includes(obj.type)&&o.textMode===undefined)o.textMode='latex';
 if(obj.type==='morphism'&&o.labelAvoid===undefined)o.labelAvoid=true;
 doc.objects.push(o);return o;
}
/** Actual editable segment objects for every side of a new free-vertex polygon.
 * Side references share its vertices, so moving an anchor updates both the
 * polygon and its individual sides. edgeOf records parent ownership for
 * cascading deletion, while sides remain independently editable objects.
 * Existing projects are intentionally not retroactively altered. */
export function appendPolygonEdges(doc,polygonId){
 const polygon=get(doc,polygonId);
 if(!polygon||polygon.type!=='polygon'||!Array.isArray(polygon.refs)||polygon.refs.length<3)throw Error('Polygon edges require a valid polygon.');
 if(doc.objects.length+polygon.refs.length>10000||doc.nextId+polygon.refs.length>Number.MAX_SAFE_INTEGER-1)throw Error('Polygon exceeds object capacity.');
 const edges=[];
 for(let i=0;i<polygon.refs.length;i++)
  edges.push(append(doc,{type:'segment',refs:[polygon.refs[i],polygon.refs[(i+1)%polygon.refs.length]],edgeOf:polygonId}).id);
 return edges;
}
/** First-class, independently styled segments tied to *virtual* corners.
 * Existing rectangles/regular polygons without edges are left unchanged; no
 * migration changes their IDs or object counts on import. The refs preserve
 * the original two point dependencies; edgeIndex chooses derived endpoints. */
export function appendDerivedShapeEdges(doc,ownerId){
 const owner=get(doc,ownerId);
 if(!owner||!['rectangle','regularPolygon','parallelogram'].includes(owner.type))throw Error('Derived sides require a rectangle, parallelogram or regular polygon.');
 const count=owner.type==='regularPolygon'?owner.sides:4;
 if(doc.objects.length+count>10000||doc.nextId+count>Number.MAX_SAFE_INTEGER-1)throw Error('Derived sides exceed object capacity.');
 return Array.from({length:count},(_,i)=>append(doc,{type:'segment',refs:[...owner.refs],edgeOf:ownerId,edgeIndex:i}).id);
}
/** Resize new regular polygons without leaving stale derived sides or severing
 * independent downstream constructions. Legacy polygon objects (no sides) stay
 * legacy. User-deleted side slots remain deleted when the polygon is enlarged.
 * Call inside the editor's one-transaction update/rollback boundary. */
export function resizeRegularPolygon(doc,ownerId,nextSides){
 const owner=get(doc,ownerId);
 if(owner?.type!=='regularPolygon'||!Number.isInteger(nextSides)||nextSides<3||nextSides>100)throw Error('Regular polygon sides must be 3–100.');
 const previous=owner.sides;
 if(previous===nextSides)return;
 const edges=doc.objects.filter(o=>o.type==='segment'&&o.edgeOf===ownerId&&o.edgeIndex!==undefined);
 const removed=edges.filter(o=>o.edgeIndex>=nextSides);
 for(const edge of removed){
  const deps=affected(doc,edge.id);
  if(deps.size!==1||edge.locked)throw Error('Unlock/delete dependent objects before removing a polygon side.');
 }
 const count=nextSides>previous&&edges.length?nextSides-previous:0;
 if(doc.objects.length-removed.length+count>10000||doc.nextId+count>Number.MAX_SAFE_INTEGER-1)throw Error('Polygon side capacity exceeded.');
 owner.sides=nextSides;
 const deleteIds=new Set(removed.map(o=>o.id));
 if(deleteIds.size)doc.objects=doc.objects.filter(o=>!deleteIds.has(o.id));
 if(edges.length&&nextSides>previous)for(let i=previous;i<nextSides;i++)
  append(doc,{type:'segment',refs:[...owner.refs],edgeOf:ownerId,edgeIndex:i});
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

export function createAnchored(doc,type,pts,opts={}){if(!Array.isArray(pts)||!pts.every(safeCoord))throw Error('Invalid construction points.');const refs=pts.map(p=>addPoint(doc,p).id);const obj=append(doc,{type,refs,...opts});if(type==='polygon')appendPolygonEdges(doc,obj.id);if(['rectangle','regularPolygon','parallelogram'].includes(type))appendDerivedShapeEdges(doc,obj.id);return obj;}
/** Stable line descriptor. Supporting-line calculation is shared by rendering,
 * snapping, intersections, and validation; half-line/segment bounds are kept.
 * Input coordinates are world-space; no screen-space geometry leaks into JSON.
 */
function computedStraight(o,at,line){
 if(!o||!STRAIGHT_TYPES.has(o.type))return null;
 let a,b,domain='infinite';
 if(o.type==='segment'&&o.edgeIndex!==undefined){
  const endpoints=at.side?.(o);
  if(!endpoints)return null;
  [a,b]=endpoints;
  const delta=[b[0]-a[0],b[1]-a[1]],len=Math.hypot(...delta);
  if(!Number.isFinite(len)||len<1e-9)return null;
  return {a:[...a],d:[delta[0]/len,delta[1]/len],domain:'segment',length:len};
 }
 if(o.type==='parallelThrough'||o.type==='perpendicularThrough'){
  const anchor=at(o.refs?.[0]),source=line(o.refs?.[1]);
  if(!anchor||!source)return null;
  a=anchor;
  const d=o.type==='parallelThrough'?source.d:[-source.d[1],source.d[0]];
  b=[a[0]+d[0],a[1]+d[1]];
 }else{
  a=at(o.refs?.[0]);b=at(o.refs?.[1]);
  if(!a||!b)return null;
  if(o.type==='perpBisector'){
   const dx=b[0]-a[0],dy=b[1]-a[1];
   a=[(a[0]+b[0])/2,(a[1]+b[1])/2];b=[a[0]-dy,a[1]+dx];
  }else if(o.type==='ray')domain='ray';
  else if(['segment','arrow'].includes(o.type))domain='segment';
 }
 const d=[b[0]-a[0],b[1]-a[1]];
 if(!safeCoord(a)||!d.every(finite)||Math.hypot(...d)<1e-9)return null;
 // Normalized direction prevents huge products in cross calculations and
 // makes source-line scale irrelevant when generating a parallel line.
 const len=Math.hypot(...d),unit=[d[0]/len,d[1]/len];
 return {a:[...a],d:unit,domain,length:len};
}
export function intersectStraightLines(a,b){
 if(!a||!b||!safeCoord(a.a)||!safeCoord(b.a)||!safeCoord(a.d)||!safeCoord(b.d))return null;
 const det=a.d[0]*b.d[1]-a.d[1]*b.d[0];
 // Sine of the acute angle between normalized direction vectors.
 if(!Number.isFinite(det)||Math.abs(det)<=1e-10)return null;
 const d=[b.a[0]-a.a[0],b.a[1]-a.a[1]];
 const t=(d[0]*b.d[1]-d[1]*b.d[0])/det;
 const u=(d[0]*a.d[1]-d[1]*a.d[0])/det;
 if(!Number.isFinite(t)||!Number.isFinite(u))return null;
 const inside=(line,distance)=>line.domain==='infinite'||(distance>=-1e-9&&
  (line.domain==='ray'||distance<=line.length+1e-9));
 if(!inside(a,t)||!inside(b,u))return null;
 const point=[a.a[0]+t*a.d[0],a.a[1]+t*a.d[1]];
 return safeCoord(point)?point:null;
}
/** Circle geometry for reference-based circle/three-point circle objects. */
export function circleGeometry(o,at){
 if(!o||!['circle','circleThrough3'].includes(o.type)||!Array.isArray(o.refs))return null;
 const pts=o.refs.map(at);
 if(!pts.every(safeCoord))return null;
 if(o.type==='circleThrough3')return circumcircle(pts);
 if(pts.length!==2)return null;
 const radius=Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1]);
 return radius>1e-9&&finite(radius)?{center:pts[0],radius}:null;
}
/** Stable two-root solver: the branch sign is defined along the source line's
 * orientation, not by screen x or proximity to the previous frame. Domain
 * clipping happens AFTER solving the infinite supporting line. Tangency has
 * one geometric root; both branches may coincide if a live secant becomes a
 * tangent. The move guard rejects changes that eliminate an existing branch.
 */
export function intersectLineCircle(line,circle){
 const empty={minus:null,plus:null,tangent:false};
 if(!line||!circle||!safeCoord(line.a)||!safeCoord(line.d)||!safeCoord(circle.center)||
    !finite(circle.radius)||circle.radius<=1e-9)return empty;
 const [dx,dy]=line.d,unit=Math.hypot(dx,dy);
 if(Math.abs(unit-1)>1e-8)return empty;
 const qx=line.a[0]-circle.center[0],qy=line.a[1]-circle.center[1];
 const t=-(qx*dx+qy*dy),perp2=(qx+t*dx)**2+(qy+t*dy)**2;
 const h2=circle.radius**2-perp2,tol=Math.max(1e-13,circle.radius**2*1e-10);
 if(!Number.isFinite(h2)||h2 < -tol)return empty;
 const tangent=h2<=tol,h=Math.sqrt(Math.max(0,h2));
 const inside=u=>line.domain==='infinite'||(u>=-1e-9&&
  (line.domain==='ray'||u<=line.length+1e-9));
 const point=u=>{
  if(!inside(u))return null;
  const p=[line.a[0]+u*dx,line.a[1]+u*dy];
  return safeCoord(p)?p:null;
 };
 return {minus:point(t-h),plus:point(t+h),tangent};
}

/** Two circle crossings, signed relative to the oriented center baseline.
 * Negative is the right-hand branch from first center to second center;
 * positive is the left-hand branch. Tangency has only the minus branch.
 * Coincident circles have infinitely many roots and must be rejected. */
export function intersectCircles(a,b){
 const none={minus:null,plus:null,tangent:false};
 if(!a||!b||!safeCoord(a.center)||!safeCoord(b.center)||!finite(a.radius)||!finite(b.radius)||a.radius<=1e-9||b.radius<=1e-9)return none;
 const dx=b.center[0]-a.center[0],dy=b.center[1]-a.center[1],distance=Math.hypot(dx,dy),r=a.radius,R=b.radius;
 const tolerance=Math.max(1e-11,Math.max(r,R,distance)*1e-10);
 if(!Number.isFinite(distance)||distance<=tolerance||distance>r+R+tolerance||distance<Math.abs(r-R)-tolerance)return none;
 const ux=dx/distance,uy=dy/distance;
 const along=(r*r-R*R+distance*distance)/(2*distance),height2=r*r-along*along;
 const hTol=Math.max(1e-12,r*r*1e-10);
 if(!Number.isFinite(height2)||height2 < -hTol)return none;
 const height=height2<=hTol?0:Math.sqrt(height2),middle=[a.center[0]+along*ux,a.center[1]+along*uy];
 const root=sign=>{const pt=[middle[0]-sign*height*uy,middle[1]+sign*height*ux];return safeCoord(pt)?pt:null;};
 return {minus:root(-1),plus:root(1),tangent:height2<=hTol};
}

/** Iterative dependency resolution, including mixed point/line references.
 * No recursion on user-created point graphs: 10,000-deep chains stay bounded.
 */
export function createResolver(doc){
 const objects=new Map(doc.objects.map(o=>[o.id,o])),cache=new Map(),lines=new Map();
 const side=o=>derivedSidePoints(o,objects.get(o.edgeOf),ref=>cache.get(ref)||null);
 const pointForLine=ref=>cache.get(ref)||null;
 pointForLine.side=side;
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
    if(obj.type==='midpoint'&&obj.refs?.length===2){
     const a=cache.get(obj.refs[0]),b=cache.get(obj.refs[1]);
     if(a&&b)p=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    }
    if(obj.type==='intersection'&&obj.refs?.length===2)
     p=intersectStraightLines(lines.get(obj.refs[0]),lines.get(obj.refs[1]));
    if(obj.type==='circleCircleIntersection'&&obj.refs?.length===2){
     const first=circleGeometry(objects.get(obj.refs[0]),ref=>cache.get(ref)||null);
     const second=circleGeometry(objects.get(obj.refs[1]),ref=>cache.get(ref)||null);
     const roots=intersectCircles(first,second);
     p=obj.branch===-1?roots.minus:obj.branch===1?roots.plus:null;
    }
    if(obj.type==='circleIntersection'&&obj.refs?.length===2){
     const circle=circleGeometry(objects.get(obj.refs[1]),ref=>cache.get(ref)||null);
     const roots=intersectLineCircle(lines.get(obj.refs[0]),circle);
     p=obj.branch===-1?roots.minus:obj.branch===1?roots.plus:null;
    }
    if(STRAIGHT_TYPES.has(obj.type)){
     lines.set(current,computedStraight(obj,pointForLine,ref=>lines.get(ref)||null));
    }
    cache.set(current,p);active.delete(current);continue;
   }
   if(active.has(current)){cache.set(current,null);lines.set(current,null);continue;}
   active.add(current);stack.push([current,true]);
   // All refs may contain nested intersection points or line dependencies.
   // Preexisting geometry validation rejects malformed references/cycles.
   for(const ref of [...(obj.refs||[])].reverse())if(!cache.has(ref))stack.push([ref,false]);
  }
  return cache.get(id)||null;
 }
 function line(o){
  const id=typeof o==='string'?o:o?.id;
  if(!id)return null;
  at(id);return lines.get(id)||null;
 }
 return {at,line,points:o=>o.type==='segment'&&o.edgeIndex!==undefined
   ?derivedSidePoints(o,objects.get(o.edgeOf),at)||[]:(o.refs||[]).map(at),object:id=>objects.get(id)};
}
export function position(doc,id){return createResolver(doc).at(id);}
export function points(doc,o){return createResolver(doc).points(o);}
export function affected(doc,id){
 // Build a reverse adjacency index once. Repeated full-scene passes become quadratic
 // for deep midpoint chains and can stall deletion of a single root vertex.
 const reverse=new Map();for(const o of doc.objects)for(const ref of o.refs||[]){if(!reverse.has(ref))reverse.set(ref,[]);reverse.get(ref).push(o.id);}
 // Owned edges also depend on their polygon for deletion, not for position.
 for(const o of doc.objects)if(o.edgeOf){if(!reverse.has(o.edgeOf))reverse.set(o.edgeOf,[]);reverse.get(o.edgeOf).push(o.id);}
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
  if(STRAIGHT_TYPES.has(o.type))return resolver.line(o)?null:'degenerate source line';
  if(['intersection','circleIntersection','circleCircleIntersection'].includes(o.type))return resolver.at(o.id)?null:'intersection no longer lies on both source objects';
  const p=resolver.points(o);if(!p.every(Boolean))return null;
  if(o.type==='morphism')return Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9?'coincident diagram nodes':null;
  try{checkNewGeometry(o.type,p);}catch(e){return e.message;}
  if(['polygon','polyline','spline'].includes(o.type)){
   for(let i=1;i<p.length;i++)if(Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])<1e-9)return 'consecutive vertices coincide';
   if((o.type==='polygon'||(o.type==='spline'&&o.closed))&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-9)return 'closing vertices coincide';
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
/** Explicit functions share the same strict implicit-multiplication parser. */
export function parseExpression(source){const fn=parseCurveExpression(source,['x']);return x=>fn({x});}
/** Reject invisible *new* geometry without invalidating legacy v1 projects on import. */
export function checkNewGeometry(type,p){
 if(['segment','arrow','line','ray','perpBisector','midpoint','circle','regularPolygon'].includes(type)&&Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9)throw Error('Construction requires distinct points.');
 if(type==='circleThrough3'&&!circumcircle(p))throw Error('Choose three noncollinear points for a circle.');
 if(type==='ellipse'&&p.length===3&&!focalEllipse(p))throw Error('Ellipse needs two foci and a third point outside the focal segment.');
 if(['rectangle','parallelogram'].includes(type)&&!shapeVerticesFromPoints(type,p).length)throw Error(type==='rectangle'?(p.length===2?'Rectangle requires nonzero width and height.':'Rectangle needs a nonzero first edge and perpendicular height.'):'Parallelogram needs three noncollinear consecutive vertices.');
 if(type==='angle'&&(Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9||Math.hypot(p[2][0]-p[1][0],p[2][1]-p[1][1])<1e-9))throw Error('Angle requires distinct rays.');
}
function pointName(doc,name){const o=byName(doc,name.trim());if(!o||!POINT_LIKE.has(o.type))throw Error('Unknown point: '+name.trim());return o.id;}
export function command(doc,source){
 const s=String(source).trim();if(!s)throw Error('Enter a construction command.');
 let m=s.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*\((.+)\)$/);
 if(m){
  const parts=m[2].split(',');if(parts.length!==2)throw Error('A point needs exactly two coordinate expressions.');
  const xy=parts.map(expr=>{
   if(/^[+\-]?(?:Infinity|NaN)$/i.test(expr.trim()))throw Error('Unsupported coordinate literal.');
   try{return parseCurveExpression(expr,[])({});}
   catch(error){if(/Numeric literal out of range/.test(error.message))throw Error('Point coordinates must be finite.');throw error;}
  });
  if(!safeCoord(xy)||xy.some(v=>Math.abs(v)>1e6))throw Error('Point coordinates must be finite and within ±1,000,000.');
  if(byName(doc,m[1]))throw Error('Name already in use.');return addPoint(doc,xy,m[1]);
 }
 m=s.match(/^([A-Za-z][A-Za-z0-9_]*)\s*\(x\)\s*=\s*(.+)$/);
 if(m){if(byName(doc,m[1]))throw Error('Name already in use.');parseExpression(m[2]);return append(doc,{type:'function',name:m[1],expr:m[2]});}
 m=s.match(/^(Segment|Arrow|Line|Circle|Ellipse|Rectangle|Parallelogram|Polygon|Polyline|Bezier|Angle|Midpoint)\s*\(([^()]*)\)$/i);
 if(m){const type=m[1].toLowerCase(),parts=m[2].split(',').map(s=>s.trim());const min={segment:2,arrow:2,line:2,circle:2,ellipse:2,rectangle:3,parallelogram:3,polygon:3,polyline:2,bezier:4,angle:3,midpoint:2}[type];
  if(parts.some(x=>!x)||parts.length<(type==='rectangle'?2:min)||(!['polygon','polyline'].includes(type)&&(['ellipse','rectangle'].includes(type)?[2,3].includes(parts.length):parts.length===min)===false))throw Error('Incorrect number of point arguments.');
  const refs=parts.map(name=>pointName(doc,name));checkNewGeometry(type,refs.map(id=>position(doc,id)));const result=append(doc,{type,refs});if(type==='polygon')appendPolygonEdges(doc,result.id);if(['rectangle','parallelogram'].includes(type))appendDerivedShapeEdges(doc,result.id);return result;
 }
 m=s.match(/^(Parallel|Perpendicular|Intersect)\s*\(\s*([A-Za-z][A-Za-z0-9_ ]*)\s*,\s*([A-Za-z][A-Za-z0-9_ ]*)\s*\)$/i);
 if(m){
  const type={parallel:'parallelThrough',perpendicular:'perpendicularThrough',intersect:'intersection'}[m[1].toLowerCase()];
  const first=byName(doc,m[2].trim()),second=byName(doc,m[3].trim());
  if(!first||!second)throw Error('Unknown construction reference.');
  const refs=[first.id,second.id];
  if(type==='intersection'){
   if(!STRAIGHT_TYPES.has(first.type)||!STRAIGHT_TYPES.has(second.type)||!intersectStraightLines(createResolver(doc).line(first),createResolver(doc).line(second)))throw Error('Choose two crossing straight objects.');
  }else if(!POINT_LIKE.has(first.type)||!STRAIGHT_TYPES.has(second.type)||!createResolver(doc).line(second))throw Error('Choose a point and a valid straight object.');
  return append(doc,{type,refs});
 }
 m=s.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*Node\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*"([^"\\]{1,180})"\s*\)$/i);
 if(m){if(byName(doc,m[1]))throw Error('Name already in use.');return append(doc,{type:'node',name:m[1],xy:[Number(m[2]),Number(m[3])],text:m[4],fontSize:17});}
 m=s.match(/^RegularPolygon\(\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*(\d+)\s*\)$/i);
 if(m){const sides=Number(m[3]);if(!Number.isInteger(sides)||sides<3||sides>100)throw Error('Regular polygon sides must be 3–100.');const a=pointName(doc,m[1]),b=pointName(doc,m[2]),u=position(doc,a),v=position(doc,b);if(!u||!v||Math.hypot(u[0]-v[0],u[1]-v[1])<1e-9)throw Error('Regular polygon needs distinct center and vertex.');const polygon=append(doc,{type:'regularPolygon',refs:[a,b],sides});appendDerivedShapeEdges(doc,polygon.id);return polygon;}
 m=s.match(/^Morphism\(\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*([A-Za-z][A-Za-z0-9_]*)\s*,\s*"([^"\\]{0,180})"\s*\)$/i);
 if(m){const refs=m.slice(1,3).map(name=>{const o=byName(doc,name);if(o?.type!=='node')throw Error('Unknown diagram node: '+name);return o.id;});if(refs[0]===refs[1])throw Error('Self-morphism is not yet supported.');return append(doc,{type:'morphism',refs,text:m[3],bend:0});}
 throw Error('Unsupported command. See Tutorial for exact syntax.');
}
export function validateDoc(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.format!=='mathillustrator-project'||raw.version!==VERSION||!Array.isArray(raw.objects)||raw.objects.length>10000)throw Error('Not a supported MathIllustrator v1 project.');
 const d=clone(raw);if(d.settings?.plot3dEnabled!==undefined&&typeof d.settings.plot3dEnabled!=='boolean')throw Error('3D toggle must be boolean.');if(d.settings?.plot3dEnabled&&!d.scene3d)throw Error('3D scene is missing.');if(d.scene3d!==undefined)validate3D(d.scene3d);if(!d.settings||typeof d.settings!=='object'||!d.meta||typeof d.meta.title!=='string'||d.meta.title.length>240||!Number.isSafeInteger(d.nextId)||d.nextId<1)throw Error('Project structure is invalid.');
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
  const len=o.type==='segment'&&o.edgeIndex!==undefined&&o.refs?.length===3?3:(o.type==='ellipse'||o.type==='rectangle')&&o.refs?.length===2?2:o.type==='ellipse'&&o.refs?.length===3?3:REF_LENGTHS[o.type];
  if(len!==undefined){if(!Array.isArray(o.refs)||o.refs.length!==len||o.refs.some(x=>typeof x!=='string'))throw Error('Invalid reference count for '+o.type);}
  else if(o.type==='polygon'||o.type==='polyline'||o.type==='spline'){if(!Array.isArray(o.refs)||o.refs.length<(o.type==='polyline'?2:3)||o.refs.length>2000||o.refs.some(x=>typeof x!=='string'))throw Error('Invalid vertex references.');}
  else if(o.refs!==undefined)throw Error('Unexpected object references.');
  if(o.type==='point'||o.type==='node'||o.type==='text'){if(!safeCoord(o.xy))throw Error('Invalid object coordinates.');}
  if(o.type==='freehand'&&(!Array.isArray(o.path)||o.path.length<2||o.path.length>20000||!o.path.every(safeCoord)))throw Error('Invalid freehand path.');
  if(o.path!==undefined&&o.type!=='freehand')throw Error('Unexpected drawing path.');
  if(['text','node'].includes(o.type)){if(!xmlTextSafe(o.text))throw Error('Text contains characters illegal in SVG XML.');if(o.text.length>(o.type==='text'?2000:1000)||!finite(o.fontSize??18)||o.fontSize<5||o.fontSize>200)throw Error('Invalid text label.');}
  if(o.pointLabel!==undefined&&(!POINT_LIKE.has(o.type)||typeof o.pointLabel!=='string'||o.pointLabel.length>1000||!xmlTextSafe(o.pointLabel)))throw Error('Invalid point label text.');
  if(o.pointLabelMode!==undefined&&(!POINT_LIKE.has(o.type)||!['plain','latex'].includes(o.pointLabelMode)))throw Error('Invalid point label mode.');
  if(o.displayLabel!==undefined&&(['point','midpoint','circleIntersection','circleCircleIntersection','text','node','morphism'].includes(o.type)||typeof o.displayLabel!=='string'||o.displayLabel.length>1000||!xmlTextSafe(o.displayLabel)))throw Error('Invalid object display label.');
  if(o.displayLabelMode!==undefined&&(['point','midpoint','circleIntersection','circleCircleIntersection','text','node','morphism'].includes(o.type)||!['plain','latex'].includes(o.displayLabelMode)))throw Error('Invalid object display label format.');
  if(o.fontFamily!==undefined&&(!['text','node','morphism'].includes(o.type)||!['Georgia, serif','Arial, sans-serif','Consolas, monospace','Verdana, sans-serif','Trebuchet MS, sans-serif','Palatino Linotype, serif','Times New Roman, serif'].includes(o.fontFamily)))throw Error('Invalid label font.');
  if(o.textMode!==undefined&&(!['text','node','morphism'].includes(o.type)||!['plain','latex'].includes(o.textMode)))throw Error('Invalid mathematical label mode.');
  if(o.branch!==undefined&&(!['circleIntersection','circleCircleIntersection'].includes(o.type)||![-1,1].includes(o.branch)))throw Error('Invalid circle intersection branch.');
  if(['circleIntersection','circleCircleIntersection'].includes(o.type)&&![-1,1].includes(o.branch))throw Error('Circle intersection branch is required.');
  if(o.edgeOf!==undefined&&(o.type!=='segment'||typeof o.edgeOf!=='string'||!/^o[1-9]\d*$/.test(o.edgeOf)))throw Error('Invalid polygon edge owner.');
  if(o.edgeIndex!==undefined&&(o.type!=='segment'||!o.edgeOf||!Number.isInteger(o.edgeIndex)||o.edgeIndex<0||o.edgeIndex>99))throw Error('Invalid derived edge index.');
  if(o.type==='regularPolygon'&&(!Number.isInteger(o.sides)||o.sides<3||o.sides>100))throw Error('Regular polygon sides must be 3–100.');
  if(o.type==='function'){if(typeof o.expr!=='string')throw Error('Invalid function expression.');parseExpression(o.expr);}
 if(o.type==='parametric'){
  if(typeof o.xExpr!=='string'||typeof o.yExpr!=='string')throw Error('Parametric curve requires x(u) and y(v).');
  parseParametric(o.xExpr,o.yExpr,o.parameter);
  if(o.parameter!==undefined&&!['t','u','v'].includes(o.parameter))throw Error('Invalid parametric symbol.');
  if(!finite(o.tMin)||!finite(o.tMax)||o.tMin>=o.tMax||Math.abs(o.tMin)>1e6||Math.abs(o.tMax)>1e6)throw Error('Parameter range must be finite, ascending and within ±1,000,000.');
 }
 if(o.type==='implicit'){if(typeof o.expr!=='string')throw Error('Invalid implicit equation.');parseImplicit(o.expr);}
 if(['vectorField','domainColoring'].includes(o.type)){
  validatePlotRegion(o.region);
  if(o.type==='vectorField'){
   if(typeof o.xExpr!=='string'||typeof o.yExpr!=='string')throw Error('Vector field requires two components.');
   parseVectorField(o.xExpr,o.yExpr);
   if(!Number.isInteger(o.density)||o.density<3||o.density>40||typeof o.normalized!=='boolean')throw Error('Invalid vector field settings.');
  }else{
   if(typeof o.expr!=='string'||!['phase-modulus','phase','contours'].includes(o.colorMode??'phase-modulus'))throw Error('Invalid domain coloring definition.');
   parseComplexExpression(o.expr);
   if(!Number.isInteger(o.resolution??128)||(o.resolution??768)<32||(o.resolution??768)>1024)throw Error('Invalid domain resolution.');
  }
 }
 if(o.type!=='vectorField'&&o.density!==undefined||o.type!=='vectorField'&&o.normalized!==undefined||o.type!=='domainColoring'&&(o.resolution!==undefined||o.colorMode!==undefined)||!['vectorField','domainColoring'].includes(o.type)&&o.region!==undefined)throw Error('Unexpected plot properties.');
 if(o.type!=='parametric'&&o.parameter!==undefined)throw Error('Unexpected parametric symbol.');
 if(!['parametric','vectorField'].includes(o.type)&&(o.xExpr!==undefined||o.yExpr!==undefined)||o.type!=='parametric'&&(o.tMin!==undefined||o.tMax!==undefined))throw Error('Unexpected parametric properties.');

  if(o.type==='morphism'&&!xmlTextSafe(o.text))throw Error('Morphism label contains characters illegal in SVG XML.');
  if(o.type==='morphism'&&(o.text.length>1000||!finite(o.bend??0)||Math.abs(o.bend)>5||o.refs[0]===o.refs[1]))throw Error('Invalid morphism label or bend.');
  if(o.arrowStyle!==undefined&&(o.type!=='morphism'||!['solid','dashed','dotted','hook','hook-dashed','twohead','tail'].includes(o.arrowStyle)))throw Error('Invalid diagram arrow style.');
  if(o.nodeBorder!==undefined&&(o.type!=='node'||typeof o.nodeBorder!=='boolean'))throw Error('Invalid node border.');
  if(o.closed!==undefined&&(!['freehand','spline'].includes(o.type)||typeof o.closed!=='boolean'))throw Error('Invalid free curve closure flag.');
  if(o.joinStyle!==undefined&&(o.type!=='freehand'||o.closed!==true||!['smooth','corner'].includes(o.joinStyle)))throw Error('Invalid free curve join style.');
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
 if(!['infinite','a3','a4','a5','letter','legal','tabloid','square','widescreen'].includes(d.settings.page)||!['off','gentle','medium','strong','ultra'].includes(d.settings.correction)||typeof d.settings.grid!=='boolean'||typeof d.settings.snap!=='boolean'||typeof d.settings.showAxes!=='boolean')throw Error('Invalid document settings.');
 if(!finite(d.settings.width)||d.settings.width<0.1||d.settings.width>100||!finite(d.settings.opacity)||d.settings.opacity<0||d.settings.opacity>1||!finite(d.settings.pointSize)||d.settings.pointSize<1||d.settings.pointSize>100)throw Error('Invalid drawing defaults.');
 // Optional v1 extensions are given defaults when opening older v1 projects.
 // Legacy naming defaults to camelCase; no existing object names are rewritten.
 if(d.settings.namingConvention===undefined)d.settings.namingConvention='camel';
 if(!['pascal','camel','snake'].includes(d.settings.namingConvention))throw Error('Invalid object naming convention.');
 if(d.settings.freehandClose===undefined)d.settings.freehandClose='open';
 if(!['open','near','always'].includes(d.settings.freehandClose))throw Error('Invalid free curve closure.');
 if(d.settings.plotQuality===undefined)d.settings.plotQuality='balanced';
 if(d.settings.plotBudget===undefined)d.settings.plotBudget=80000;
 if(![20000,40000,80000,250000,500000,1000000].includes(d.settings.plotBudget))throw Error('Invalid plot evaluation budget; choose a listed preset.');
 if(d.settings.implicitGrid===undefined)d.settings.implicitGrid=12;
 if(!Number.isInteger(d.settings.implicitGrid)||d.settings.implicitGrid<6||d.settings.implicitGrid>24)throw Error('Implicit plot grid must be 6–24 px.');
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
 if(d.settings.snapObjects===undefined)d.settings.snapObjects=true;
 if(typeof d.settings.snapObjects!=='boolean')throw Error('Invalid object snapping setting.');
 if(d.settings.modules===undefined)d.settings.modules={...PRESET_MODULES.General};
 if(!d.settings.modules||typeof d.settings.modules!=='object'||Object.keys(PRESET_MODULES.General).some(k=>typeof d.settings.modules[k]!=='boolean'))throw Error('Invalid tool visibility settings.');
 if(d.settings.page==='infinite'&&d.settings.exportRegion==='page')throw Error('Page-only export requires a finite page frame.');
 if(!['viewport','page'].includes(d.settings.exportRegion)||typeof d.settings.showLabels!=='boolean'||typeof d.settings.snapAnchors!=='boolean')throw Error('Invalid extended settings.');
 const objects=new Map(d.objects.map(o=>[o.id,o]));
 for(const o of d.objects)if(o.edgeOf!==undefined){
  const owner=objects.get(o.edgeOf);
  if(!owner||!['polygon','rectangle','parallelogram','regularPolygon'].includes(owner.type))throw Error('Segment edge has no supported owner.');
  if(owner.type==='polygon'){
   if(o.edgeIndex!==undefined)throw Error('Free-vertex polygon edges cannot have derived side indices.');
   const refs=owner.refs||[];
   if(!refs.some((id,i)=>o.refs[0]===id&&o.refs[1]===refs[(i+1)%refs.length]))throw Error('Polygon edge does not match its owner.');
  }else{
   if(!Number.isInteger(o.edgeIndex)||o.edgeIndex>=(owner.type==='regularPolygon'?owner.sides:4)||
      o.refs.length!==owner.refs.length||o.refs.some((id,i)=>id!==owner.refs[i]))throw Error('Derived side does not match its owner.');
  }
 }

 const derivedSides=new Set();
 for(const o of d.objects)if(o.edgeIndex!==undefined){
  const key=o.edgeOf+'/'+o.edgeIndex;
  if(derivedSides.has(key))throw Error('Duplicate derived edge index.');
  derivedSides.add(key);
 }
 for(const o of d.objects)for(let i=0;i<(o.refs||[]).length;i++){const ref=o.refs[i],parent=objects.get(ref);if(!parent)throw Error('Dangling object reference.');
  const wantLine=o.type==='intersection'||(o.type==='circleIntersection'&&i===0)||(['parallelThrough','perpendicularThrough'].includes(o.type)&&i===1);
  const wantCircle=o.type==='circleCircleIntersection'||(o.type==='circleIntersection'&&i===1);
  const valid=o.type==='morphism'?parent.type==='node':wantLine?STRAIGHT_TYPES.has(parent.type):wantCircle?['circle','circleThrough3'].includes(parent.type):POINT_LIKE.has(parent.type);
  if(!valid)throw Error('Invalid reference target for '+o.type);}
 // Iterative graph walk avoids stack exhaustion with deeply nested midpoint chains.
 const constrained=new Set(['rectangle','parallelogram','regularPolygon','ray','perpBisector','circleThrough3','spline','parallelThrough','perpendicularThrough','intersection','circleIntersection','circleCircleIntersection']);
 const resolver=d.objects.some(o=>constrained.has(o.type)||o.edgeIndex!==undefined)?createResolver(d):null;
 for(const o of d.objects)if(constrained.has(o.type)||o.edgeIndex!==undefined){
  if(STRAIGHT_TYPES.has(o.type)){if(!resolver.line(o))throw Error('Invalid line dependencies for '+o.type+'.');continue;}
  if(['intersection','circleIntersection','circleCircleIntersection'].includes(o.type)){if(!resolver.at(o.id))throw Error('Intersection is undefined on the selected source domains.');continue;}
  const p=resolver.points(o);if(!p.every(Boolean))throw Error('Invalid construction anchors for '+o.type+'.');
  if(o.type==='regularPolygon'&&Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])<1e-9)throw Error('Regular polygon needs distinct center and vertex.');
  if(o.type==='spline'){
   for(let i=1;i<p.length;i++)if(Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])<1e-9)throw Error('Spline needs distinct consecutive vertices.');
   if(o.closed&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-9)throw Error('Closed spline must not repeat its first vertex.');
  }
  if(o.type!=='regularPolygon')checkNewGeometry(o.type,p);
 }
 const state=new Map();for(const id of ids){if(state.get(id)===2)continue;const stack=[[id,false]];while(stack.length){const [current,done]=stack.pop();if(done){state.set(current,2);continue;}const old=state.get(current);if(old===2)continue;if(old===1)throw Error('Cyclic object dependency.');state.set(current,1);stack.push([current,true]);for(const ref of objects.get(current).refs||[])if(state.get(ref)!==2)stack.push([ref,false]);}}
 return d;
}
