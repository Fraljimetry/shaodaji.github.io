import {clone,command,parseExpression,validateDoc,append,byName,createResolver,geometricPoint,geometricLine,geometricCircle,affected,addPoint,functionSliderParameters} from './model.mjs?cut=round302';
import {splitAlgebraArguments,evaluateAlgebra,bindMeasurement,createSlider,algebraPoint,SLIDER_PLAY_MODES} from './algebra.mjs?cut=round254';
import {r50SourceShape,generalCrossings,circleTangents} from './geometry_round50.mjs?cut=round147';
import {parseParametric,parseImplicit,parseVectorField,parseComplexExpression} from './plot_modes.mjs?cut=round302';

// Every reference is printed from its persistent ID, never a stored name.
// Syntax for non-command tools is an editable semantic constructor; it does
// not create an independent geometric object or change the project's format.
const CONSTRUCTORS={segment:'Segment',arrow:'Vector',line:'Line',ray:'Ray',perpBisector:'PerpBisector',circle:'Circle',circleThrough3:'CircleThrough3',ellipse:'Ellipse',rectangle:'Rectangle',parallelogram:'Parallelogram',polygon:'Polygon',polyline:'Polyline',bezier:'Bezier',angle:'Angle',angleBisector:'AngleBisector',midpoint:'Midpoint',spline:'Spline',circularArc:'CircularArc',hyperbola:'Hyperbola',parallelThrough:'Parallel',perpendicularThrough:'Perpendicular',perpendicularFoot:'Foot',intersection:'Intersect',regularPolygon:'RegularPolygon',fixedLength:'FixedLength',fixedAngle:'FixedAngle',circleIntersection:'CircleIntersection',circleCircleIntersection:'CircleCircleIntersection',pointOnObject:'PointOnObject',tangentCircle:'TangentCircle',parabola:'Parabola',generalIntersection:'GeneralIntersection',locus:'Locus',triangleCenter:'TriangleCenter',transformCopy:'Transform',node:'Node',morphism:'Morphism',text:'Text'};
const REFERENCE_OPTIONS={
 circleIntersection:['branch'],circleCircleIntersection:['branch'],tangentCircle:['branch'],
 generalIntersection:['rootIndex'],pointOnObject:['parameter','distance','constraintMode'],
 triangleCenter:['centerKind'],transformCopy:['transform','amount'],
 fixedLength:['length'],fixedAngle:['angle'],regularPolygon:['sides'],
 node:['text'],morphism:['text'],text:['text']
};
const NON_COMMAND=new Set(['circleIntersection','circleCircleIntersection','pointOnObject','tangentCircle','parabola','generalIntersection','locus','triangleCenter','transformCopy','morphism']);
const NUMERIC=new Set(['branch','rootIndex','parameter','distance','amount','length','angle','sides']);
const ENUMS={branch:[-1,1],centerKind:['centroid','circumcenter','incenter','orthocenter','excenterA','excenterB','excenterC'],transform:['reflect','rotate','translate','dilate','invert'],constraintMode:['angleRay']};
const quote=value=>JSON.stringify(value);
function namesFor(doc,o){return (o.refs||[]).map(id=>doc.objects.find(item=>item.id===id)?.name);}
function optionTokens(o){
 const keys=REFERENCE_OPTIONS[o.type]||[];
 return keys.filter(k=>Object.hasOwn(o,k)).map(k=>`${k}=${quote(o.measureExpr?.[k]??o[k])}`);
}
// Only the Properties display is rounded; the model and JSON keep full precision.
export function displayCoordinate(value){
 if(typeof value==='string'){
  if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))return value;
  value=Number(value);
 }
 if(typeof value!=='number'||!Number.isFinite(value))return String(value);
 return String(Number(value.toPrecision(7)));
}
export function constructionExpression(doc,o,{fullPrecision=false}={}){
 const show=value=>fullPrecision?String(value):displayCoordinate(value);
 if(o.type==='freehand')return null;
 if(o.edgeOf){const owner=doc.objects.find(item=>item.id===o.edgeOf);
  if(!owner)return null;
  const i=Number.isInteger(o.edgeIndex)?o.edgeIndex:(owner.refs||[]).findIndex((id,j)=>o.refs?.[0]===id&&o.refs?.[1]===owner.refs[(j+1)%owner.refs.length]);
  return i<0?null:`Side(${owner.name}, ${i+1})`;
 }
 if(o.type==='point')return `(${(o.xyExpr||o.xy||[]).map(show).join(', ')})`;
 if(o.type==='function')return `${o.expr}`;
 if(o.type==='implicit')return `Implicit(${quote(o.expr)})`;
 if(o.type==='domainColoring')return `DomainColoring(${quote(o.expr)})`;
 if(o.type==='parametric')return `Parametric(${quote(o.xExpr)}, ${quote(o.yExpr)}, ${quote(o.parameter??'legacy')}${o.polar?`, polar=${quote(o.rExpr)}`:''})`;
 if(o.type==='vectorField')return `VectorField(${quote(o.xExpr)}, ${quote(o.yExpr)})`;
 if(o.type==='text'||o.type==='node')return `${CONSTRUCTORS[o.type]}(${(o.xy||[]).map(show).join(', ')}, ${quote(o.text)})`;
 const names=namesFor(doc,o);if(!names.every(Boolean))return null;
 const kind=o.type==='transformCopy'?({rotate:'Rotate',dilate:'Dilate',translate:'Translate',reflect:'Reflect',invert:'Invert'}[o.transform]||'Transform'):o.type==='spline'&&o.closed?'ClosedSpline':CONSTRUCTORS[o.type];
 if(!kind)return null;
 let options=optionTokens(o);
 if(o.type==='transformCopy')options=options.filter(x=>!x.startsWith('transform='));
 if(o.type==='spline'&&o.closed===false)options=[];
 return `${kind}(${[...names,...options].join(', ')})`;
}
function parseConstructor(rhs){
 const m=rhs.match(/^([A-Za-z][A-Za-z0-9_]*)\s*\(([\s\S]*)\)$/);
 if(!m)throw Error('Use a supported semantic constructor.');
 const parts=splitAlgebraArguments(m[2]);
 const args=[],options={};let inOptions=false;
 for(const part of parts){
  const match=part.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/s);
  if(match){inOptions=true;if(Object.hasOwn(options,match[1]))throw Error('Duplicate option.');
   try{options[match[1]]=JSON.parse(match[2]);}catch{
    // Only quantity formulas backed by the document's measurement dependency
    // engine accept unquoted arithmetic. Structural options remain literals.
    if(match[1]!=='amount'||!match[2].trim())throw Error('Options must be JSON numbers or strings.');
    options[match[1]]=match[2].trim();
   }
  }else{if(inOptions)throw Error('Positional references must precede options.');args.push(part.trim());}
 }
 return {kind:m[1],args,options};
}
function parseNamed(value,name){
 // Name is edited independently. Accept legacy "Name = Constructor(...)"
 // input for compatibility, but never include it in displayed expressions.
 const match=value.match(/^(.+?)\s*=\s*([\s\S]+)$/);
 if(match&&match[1].trim()===name)return match[2].trim();
 return value.trim();
}
function acyclic(doc){
 const objects=new Map(doc.objects.map(o=>[o.id,o])),seen=new Set(),active=new Set();
 function visit(id){if(active.has(id))throw Error('Circular construction reference.');if(seen.has(id))return;active.add(id);
  const o=objects.get(id);if(o)for(const ref of o.refs||[])if(objects.has(ref))visit(ref);
  active.delete(id);seen.add(id);
 }
 for(const id of objects.keys())visit(id);
}
function validateCandidate(doc){acyclic(doc);validateDoc(doc);}
function commit(doc,id,candidate){
 const sandbox=clone(doc),original=sandbox.objects.find(o=>o.id===id);
 if(!original)throw Error('Object no longer exists.');
 const previousRefs=original.refs?[...original.refs]:null;
 Object.assign(original,candidate);
 // Owned edge segments are a materialized view of their parent. Keep their
 // stable IDs and order while updating their endpoints atomically with it.
 if(previousRefs&&candidate.refs&&['polygon','rectangle','parallelogram','regularPolygon'].includes(original.type)){
  for(const edge of sandbox.objects.filter(o=>o.edgeOf===id)){
   if(original.type==='polygon'){
    const i=previousRefs.findIndex((ref,j)=>edge.refs?.[0]===ref&&edge.refs?.[1]===previousRefs[(j+1)%previousRefs.length]);
    if(i<0||previousRefs.length!==candidate.refs.length)throw Error('Changing polygon vertices structurally is unsupported.');
    edge.refs=[candidate.refs[i],candidate.refs[(i+1)%candidate.refs.length]];
   } else edge.refs=[...candidate.refs];
  }
 }
 validateCandidate(sandbox);
 const target=doc.objects.find(o=>o.id===id);
 for(const key of Object.keys(target))if(!Object.hasOwn(original,key))delete target[key];
 Object.assign(target,original);
 if(previousRefs&&candidate.refs&&['polygon','rectangle','parallelogram','regularPolygon'].includes(original.type))
  for(const nextEdge of sandbox.objects.filter(o=>o.edgeOf===id)){
   const live=doc.objects.find(o=>o.id===nextEdge.id);if(live)live.refs=[...nextEdge.refs];
  }
}
export function applyConstructionExpression(doc,objectId,source){
 const current=doc.objects.find(o=>o.id===objectId);
 if(!current)throw Error('Object no longer exists.');
 if(current.edgeOf||current.type==='freehand')throw Error('This geometry is not an editable algebraic construction.');
 const value=String(source).trim();if(!value||value.length>2000)throw Error('Invalid Algebra expression.');
 if(current.type==='function'){
  const m=value.match(/^([^()]+)\(x\)\s*=\s*([\s\S]+)$/);
  const expression=m&&m[1].trim()===current.name?m[2]:value;
  parseExpression(expression,functionSliderParameters(doc));commit(doc,objectId,{expr:expression});return;
 }
 const rhs=parseNamed(value,current.name);
 if(current.type==='point'){
  const sandbox=clone(doc);const created=command(sandbox,`ExpressionProbe252 = ${rhs}`);
  const patch={xy:clone(created.xy)};
  // Constant coordinates replace (rather than retain) an old slider formula.
  const sandboxCandidate=clone(doc),point=sandboxCandidate.objects.find(o=>o.id===objectId);
  Object.assign(point,patch);if(created.xyExpr)point.xyExpr=clone(created.xyExpr);else delete point.xyExpr;
  validateCandidate(sandboxCandidate);
  const live=doc.objects.find(o=>o.id===objectId);live.xy=point.xy;
  if(point.xyExpr)live.xyExpr=point.xyExpr;else delete live.xyExpr;
  return;
 }
 const {kind,args,options}=parseConstructor(rhs);
 if(['implicit','domainColoring','parametric','vectorField'].includes(current.type)){
  const allowed={implicit:'Implicit',domainColoring:'DomainColoring',parametric:'Parametric',vectorField:'VectorField'}[current.type];
  if(kind!==allowed||Object.keys(options).some(k=>k!=='polar'))throw Error('Incorrect plot expression syntax.');
  let patch;
  const stringArg=(index)=>{const text=JSON.parse(args[index]);if(typeof text!=='string')throw Error('Expected an expression string.');return text;};
  if(current.type==='implicit'){if(args.length!==1)throw Error('Expected one equation.');patch={expr:stringArg(0)};parseImplicit(patch.expr,functionSliderParameters(doc));}
  if(current.type==='domainColoring'){if(args.length!==1)throw Error('Expected one complex expression.');patch={expr:stringArg(0)};parseComplexExpression(patch.expr,functionSliderParameters(doc));}
  if(current.type==='vectorField'){if(args.length!==2)throw Error('Expected two vector components.');patch={xExpr:stringArg(0),yExpr:stringArg(1)};parseVectorField(patch.xExpr,patch.yExpr,functionSliderParameters(doc));}
  if(current.type==='parametric'){
   if(args.length!==3)throw Error('Expected x, y and parameter.');
   patch={xExpr:stringArg(0),yExpr:stringArg(1),parameter:stringArg(2)};
   if(patch.parameter==='legacy')delete patch.parameter;
   parseParametric(patch.xExpr,patch.yExpr,patch.parameter,functionSliderParameters(doc));
   if(Object.hasOwn(options,'polar')){if(typeof options.polar!=='string')throw Error('Polar radius must be a string.');patch.rExpr=options.polar;patch.polar=true;}
   else patch.polar=false;
  }
  commit(doc,objectId,patch);return;
 }
 if(current.type==='text'||current.type==='node'){
  if(kind!==CONSTRUCTORS[current.type]||args.length!==3||Object.keys(options).length)throw Error('Expected Text(x, y, "label") or Node(x, y, "label").');
  const xy=args.slice(0,2).map(x=>evaluateAlgebra(x));const label=JSON.parse(args[2]);
  if(typeof label!=='string')throw Error('Text must be quoted.');commit(doc,objectId,{xy,text:label});return;
 }
 const expected=constructionExpression(doc,current);
 if(!expected)throw Error('This construction has no supported semantic expression.');
 const expectedKind=parseConstructor(parseNamed(expected,current.name)).kind;
 if(kind!==expectedKind)throw Error(`Expression must use ${expectedKind} for this object, not ${current.type} replacement.`);
 // Plain constructors use the authoritative command implementation, including
 // its geometric existence and argument-count checks.
 if(!NON_COMMAND.has(current.type)&&!Object.keys(options).length&&current.type!=='regularPolygon'&&current.type!=='fixedLength'&&current.type!=='fixedAngle'){
  const sandbox=clone(doc),created=command(sandbox,rhs);
  if(created.type!==current.type)throw Error(`Expression produces ${created.type}, not ${current.type}.`);
  if(current.type==='polygon'&&created.refs.length!==current.refs.length)throw Error('Changing polygon vertex count would invalidate its derived edges.');
  if(['rectangle','parallelogram'].includes(current.type)&&created.refs.length!==current.refs.length)throw Error('Changing derived geometry structure is unsupported.');
  commit(doc,objectId,{refs:clone(created.refs),...(current.type==='spline'?{closed:!!created.closed}:{})});return;
 }
 const keys=REFERENCE_OPTIONS[current.type]||[];
 if(Object.keys(options).some(k=>!keys.includes(k)))throw Error('Unsupported constructor option.');
 const existing=namesFor(doc,current);
 if(args.length!==existing.length)throw Error('Reference count cannot change.');
 const refs=args.map(name=>doc.objects.find(o=>o.name===name)?.id);
 if(refs.some(id=>!id))throw Error('Unknown construction reference.');
 const patch={refs};
 for(const [k,v] of Object.entries(options)){
  if(NUMERIC.has(k)){if(typeof v!=='number'||!Number.isFinite(v)){if(!['length','angle','amount'].includes(k)||typeof v!=='string')throw Error(`${k} must be finite.`);}}
  else if(typeof v!=='string')throw Error(`${k} must be a string.`);
  if(ENUMS[k]&&!ENUMS[k].includes(v))throw Error(`Unsupported ${k}.`);
  patch[k]=v;
 }
 if(current.type==='transformCopy')patch.transform={Rotate:'rotate',Dilate:'dilate',Translate:'translate',Reflect:'reflect',Invert:'invert',Transform:current.transform}[kind];
 if(current.type==='fixedLength'||current.type==='fixedAngle'){
  const key=current.type==='fixedLength'?'length':'angle';
  if(!Object.hasOwn(options,key))throw Error(`Missing ${key}.`);
 }
 if(['fixedLength','fixedAngle','transformCopy'].includes(current.type)){
  const measured=current.type==='fixedLength'?'length':current.type==='fixedAngle'?'angle':'amount';
  if(Object.hasOwn(options,measured)){
   const sandbox=clone(doc),obj=sandbox.objects.find(o=>o.id===objectId);
   Object.assign(obj,patch);
   const value=options[measured];
   if(typeof value==='string')bindMeasurement(sandbox,obj,measured,value);
   else {obj[measured]=value;if(obj.measureExpr)delete obj.measureExpr[measured];}
   validateCandidate(sandbox);
   const semantic=sandbox.objects.find(o=>o.id===objectId);
   const live=doc.objects.find(o=>o.id===objectId);
   live.refs=semantic.refs;if(current.type==='transformCopy')live.transform=semantic.transform;
   if(semantic.measureExpr)live.measureExpr=semantic.measureExpr;
   live[measured]=semantic[measured];
   if(!semantic.measureExpr)delete live.measureExpr;
   return;
  }
 }
 commit(doc,objectId,patch);
}

// Programmatic creation uses the SAME persisted construction types as canvas
// tools. Work on a copy and publish only after every reference/geometry check.
// This keeps failed Algebra submissions from leaving orphan objects or IDs.
const CREATE_SEMANTIC={
 PointOnObject:'pointOnObject',TangentCircle:'tangentCircle',Parabola:'parabola',
 GeneralIntersection:'generalIntersection',Locus:'locus',TriangleCenter:'triangleCenter',
 CircleIntersection:'circleIntersection',CircleCircleIntersection:'circleCircleIntersection',
 Reflect:'transformCopy',Rotate:'transformCopy',Translate:'transformCopy',
 Dilate:'transformCopy',Invert:'transformCopy',Transform:'transformCopy',
 Text:'text',Node:'node',Morphism:'morphism',Point:'point',CircleDiameter:'circleDiameter',
};
const CREATE_TRANSFORM={Reflect:'reflect',Rotate:'rotate',Translate:'translate',Dilate:'dilate',Invert:'invert'};
const CREATE_DEFAULTS={
 pointOnObject:{parameter:0.5},tangentCircle:{branch:1},generalIntersection:{rootIndex:0},
 triangleCenter:{centerKind:'centroid'},circleIntersection:{branch:1},circleCircleIntersection:{branch:1},
 transformCopy:{amount:0},
};
export const PROGRAMMATIC_SEMANTIC_CONSTRUCTORS=Object.freeze(Object.keys(CREATE_SEMANTIC));
export function createSemanticConstruction(doc,source){
 const raw=String(source).trim();
 const assignment=raw.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*([A-Za-z][A-Za-z0-9_]*\s*\([\s\S]*\))$/);
 const name=assignment?.[1],rhs=assignment?assignment[2]:raw;
 const {kind,args,options}=parseConstructor(rhs),type=CREATE_SEMANTIC[kind];
 if(!type)throw Error('Unsupported semantic constructor.');
 if(name&&(byName(doc,name)||doc.algebra?.sliders?.some(s=>s.name===name)))throw Error('Name already in use.');
 const temp=clone(doc),resolver=createResolver(temp);
 if(kind==='Morphism'){
  // Reuse the original strict diagram constructor for both named and unnamed
  // submissions. It validates node roles, distinct endpoints, and label syntax.
  const created=command(temp,rhs);if(name)created.name=name;
  validateCandidate(temp);doc.objects.push(...temp.objects.slice(doc.objects.length));doc.nextId=temp.nextId;
  return doc.objects.find(o=>o.id===created.id);
 }
 if(['Point','Text','Node'].includes(kind)){
  if(Object.keys(options).length)throw Error('Coordinate constructors do not accept options.');
  const needsLabel=kind!=='Point';
  if(args.length!==(needsLabel?3:2))throw Error(`${kind} needs ${needsLabel?'two coordinates and quoted text':'two coordinates'}.`);
  const sliderValues=Object.fromEntries((temp.algebra?.sliders??[]).map(s=>[s.name,s.value]));
  const xy=args.slice(0,2).map(v=>evaluateAlgebra(v,sliderValues));
  if(!xy.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6))throw Error('Invalid geometric coordinates.');
  let created;
  if(needsLabel){let label;try{label=JSON.parse(args[2]);}catch{throw Error('Text must be a JSON quoted string.');}
   if(typeof label!=='string')throw Error('Text must be a string.');
   created=append(temp,{type:kind.toLowerCase(),xy,text:label,...(name?{name}:{})});
  }else {
   created=addPoint(temp,xy,name);
   const sliderNames=Object.keys(sliderValues);
   if(args.slice(0,2).some(expr=>sliderNames.some(slider=>new RegExp('\\b'+slider+'\\b').test(expr))))created.xyExpr=args.slice(0,2).map(expr=>expr.trim());
  }
  validateCandidate(temp);doc.objects.push(...temp.objects.slice(doc.objects.length));doc.nextId=temp.nextId;
  return doc.objects.find(o=>o.id===created.id);
 }
 const refs=args.map(arg=>{
  const found=byName(temp,arg);
  if(!found)throw Error('Unknown construction reference: '+arg);
  return found.id;
 });
 if(kind==='CircleDiameter'){
  if(Object.keys(options).length||refs.length!==2)throw Error('CircleDiameter requires two endpoints.');
  const a=temp.objects.find(o=>o.id===refs[0]),b=temp.objects.find(o=>o.id===refs[1]);
  if(!geometricPoint(a,resolver)||!geometricPoint(b,resolver)||refs[0]===refs[1])throw Error('CircleDiameter requires distinct points.');
  const center=append(temp,{type:'midpoint',refs});
  const circle=append(temp,{type:'circle',refs:[center.id,refs[0]],...(name?{name}:{})});
  validateCandidate(temp);doc.objects.push(...temp.objects.slice(doc.objects.length));doc.nextId=temp.nextId;
  return doc.objects.find(o=>o.id===circle.id);
 }
 const expectedCount=type==='transformCopy'&&kind==='Translate'?3:2;
 const count=({pointOnObject:1,triangleCenter:3,locus:2,parabola:2}[type]??expectedCount);
 if(refs.length!==count)throw Error(`${kind} requires ${count} references.`);
 const objects=refs.map(id=>temp.objects.find(o=>o.id===id));
 const point=i=>geometricPoint(objects[i],resolver);
 const line=i=>geometricLine(objects[i],resolver);
 const circle=i=>geometricCircle(objects[i],resolver);
 if(type==='triangleCenter'&&!objects.every((_,i)=>point(i)))throw Error('TriangleCenter requires three geometric points.');
 if(type==='parabola'&&!(point(0)&&line(1)))throw Error('Parabola requires a point and directrix line.');
 if(type==='tangentCircle'&&!(point(0)&&circle(1)))throw Error('TangentCircle requires a point and circle.');
 if(type==='circleIntersection'&&!((line(0)&&circle(1))||(circle(0)&&line(1))))throw Error('CircleIntersection requires a line and a circle.');
 if(type==='circleCircleIntersection'&&!(circle(0)&&circle(1)))throw Error('CircleCircleIntersection requires two circles.');
 if(type==='locus'&&!(point(0)&&objects[1].type==='pointOnObject'&&affected(temp,refs[1]).has(refs[0])))throw Error('Locus requires a dependent point and its constrained driver.');
 if(type==='transformCopy'){
  const transform=CREATE_TRANSFORM[kind]||'rotate';
  if(kind==='Transform'&&!Object.hasOwn(options,'transform'))throw Error('Transform requires transform= option.');
  const actual=kind==='Transform'?options.transform:transform;
  if(!['reflect','rotate','translate','dilate','invert'].includes(actual))throw Error('Invalid transformation.');
  if(actual==='translate'?!(point(1)&&point(2)):actual==='reflect'?!line(1):actual==='invert'?!circle(1):!point(1))throw Error('Invalid transformation reference roles.');
  if(actual!=='translate'&&refs[0]===refs[1])throw Error('Source and transformation reference must differ.');
 }
 if(type==='pointOnObject'&&r50SourceShape(objects[0],resolver,70).length<2)throw Error('Invalid constrained-point source.');
 if(type==='generalIntersection'){
  if(refs[0]===refs[1])throw Error('Intersection objects must differ.');
  const roots=generalCrossings(objects[0],objects[1],resolver,160);
  if(!roots.length)throw Error('No intersection found for these objects.');
  if((options.rootIndex??0)>=roots.length)throw Error('Intersection branch does not exist.');
 }
 if(type==='tangentCircle'&&!circleTangents(resolver.at(refs[0]),resolver.circle(objects[1])).length)throw Error('No tangent exists.');
 const validKeys=REFERENCE_OPTIONS[type]||[];
 if(Object.keys(options).some(k=>!validKeys.includes(k)))throw Error('Unsupported constructor option.');
 const base={type,refs,...CREATE_DEFAULTS[type]};
 if(type==='transformCopy')base.transform=CREATE_TRANSFORM[kind]||options.transform||'rotate';
 Object.assign(base,options);
 for(const [key,val] of Object.entries(options)){
  if(NUMERIC.has(key)&&(!Number.isFinite(val)||typeof val!=='number')){
   if(!['amount','length','angle'].includes(key)||typeof val!=='string')throw Error(`Invalid ${key}.`);
  }
  if(ENUMS[key]&&!ENUMS[key].includes(val))throw Error(`Invalid ${key}.`);
 }
 if(type==='transformCopy'&&base.transform==='translate'&&refs.length!==3)throw Error('Translate requires three references.');
 const created=append(temp,{...base,...(name?{name}:{})});
 if(type==='transformCopy'&&typeof options.amount==='string')bindMeasurement(temp,created,'amount',options.amount);
 validateCandidate(temp);
 // Assignment is atomic: no failed submission can alter the live scene.
 doc.objects.push(...temp.objects.slice(doc.objects.length));doc.nextId=temp.nextId;
 return doc.objects.find(o=>o.id===created.id);
}

/** The 2D Algebra input's single creation route. All existing named syntax is
 * retained; unnamed coordinate tuples and sliders follow the same object and
 * slider creation paths rather than maintaining a second model. The caller
 * owns the usual undo transaction. */
export function submit2DAlgebra(doc,source){
 const text=String(source).trim();
 if(!text)throw Error('Enter an Algebra construction.');
 let match=text.match(/^(?:([A-Za-z][A-Za-z0-9_]*)\s*=\s*)?Slider\((.*)\)$/i);
 if(match){
  const raw=splitAlgebraArguments(match[2]);
  if(raw.length<2||raw.length>6)throw Error('Use Slider(min, max[, step, value, speed, mode]).');
  const last=raw.at(-1)?.trim().replace(/^['"]|['"]$/g,'').toLowerCase();
  const hasMode=raw.length>=5&&SLIDER_PLAY_MODES.includes(last);
  const mode=hasMode?last:'periodic';
  if(raw.length===6&&!hasMode)throw Error('Slider mode must be periodic, oscillatory, or once.');
  const args=(hasMode?raw.slice(0,-1):raw).map(x=>evaluateAlgebra(x));
  let name=match[1];
  if(!name){
   // Slider names are valid Algebra identifiers, unlike display names such as
   // "Segment 3"; never collide with existing object or slider names.
   const occupied=new Set([...doc.objects.map(o=>o.name),...(doc.algebra?.sliders??[]).map(s=>s.name)]);
   for(let i=1;i<=100000;i++){const candidate=`Slider${i}`;if(!occupied.has(candidate)){name=candidate;break;}}
   if(!name)throw Error('Automatic slider names exhausted.');
  }
  return createSlider(doc,name,{min:args[0],max:args[1],step:args[2]??0.1,value:args[3]??args[0],playSpeed:args[4]??1,playMode:mode});
 }
 match=text.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*\((.*)\)$/);
 if(match){
  const xy=splitAlgebraArguments(match[2]);
  if(xy.length!==2)throw Error('A point needs two coordinate expressions.');
  return algebraPoint(doc,match[1],xy[0].trim(),xy[1].trim(),(d,p,name)=>append(d,{type:'point',xy:p,name}));
 }
 if(/^\([\s\S]*\)$/.test(text)){
  // Name-free coordinate entry: identical semantics to Point(x,y), including
  // slider-driven formulas and the ordinary automatic point name.
  return createSemanticConstruction(doc,`Point${text}`);
 }
 if(/\b(?:Rotate|Dilate)\s*\([^)]*\bamount\s*=/.test(text))return createSemanticConstruction(doc,text);
 try{return command(doc,text);}catch(error){
  if(!/Unsupported command/.test(error.message))throw error;
  return createSemanticConstruction(doc,text);
 }
}
