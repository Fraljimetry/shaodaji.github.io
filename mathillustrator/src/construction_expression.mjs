import {clone,command,parseExpression,validateDoc} from './model.mjs?cut=round227';
import {splitAlgebraArguments,evaluateAlgebra,bindMeasurement} from './algebra.mjs?cut=round254';
import {parseParametric,parseImplicit,parseVectorField,parseComplexExpression} from './plot_modes.mjs?cut=round69';

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
export function constructionExpression(doc,o){
 if(o.type==='freehand')return null;
 if(o.edgeOf){const owner=doc.objects.find(item=>item.id===o.edgeOf);
  if(!owner)return null;
  const i=Number.isInteger(o.edgeIndex)?o.edgeIndex:(owner.refs||[]).findIndex((id,j)=>o.refs?.[0]===id&&o.refs?.[1]===owner.refs[(j+1)%owner.refs.length]);
  return i<0?null:`Side(${owner.name}, ${i+1})`;
 }
 if(o.type==='point')return `(${(o.xyExpr||o.xy||[]).join(', ')})`;
 if(o.type==='function')return `${o.expr}`;
 if(o.type==='implicit')return `Implicit(${quote(o.expr)})`;
 if(o.type==='domainColoring')return `DomainColoring(${quote(o.expr)})`;
 if(o.type==='parametric')return `Parametric(${quote(o.xExpr)}, ${quote(o.yExpr)}, ${quote(o.parameter??'legacy')}${o.polar?`, polar=${quote(o.rExpr)}`:''})`;
 if(o.type==='vectorField')return `VectorField(${quote(o.xExpr)}, ${quote(o.yExpr)})`;
 if(o.type==='text'||o.type==='node')return `${CONSTRUCTORS[o.type]}(${(o.xy||[]).join(', ')}, ${quote(o.text)})`;
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
   try{options[match[1]]=JSON.parse(match[2]);}catch{throw Error('Options must be JSON numbers or strings.');}
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
  parseExpression(expression);commit(doc,objectId,{expr:expression});return;
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
  if(current.type==='implicit'){if(args.length!==1)throw Error('Expected one equation.');patch={expr:stringArg(0)};parseImplicit(patch.expr);}
  if(current.type==='domainColoring'){if(args.length!==1)throw Error('Expected one complex expression.');patch={expr:stringArg(0)};parseComplexExpression(patch.expr);}
  if(current.type==='vectorField'){if(args.length!==2)throw Error('Expected two vector components.');patch={xExpr:stringArg(0),yExpr:stringArg(1)};parseVectorField(patch.xExpr,patch.yExpr);}
  if(current.type==='parametric'){
   if(args.length!==3)throw Error('Expected x, y and parameter.');
   patch={xExpr:stringArg(0),yExpr:stringArg(1),parameter:stringArg(2)};
   if(patch.parameter==='legacy')delete patch.parameter;
   parseParametric(patch.xExpr,patch.yExpr,patch.parameter);
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
