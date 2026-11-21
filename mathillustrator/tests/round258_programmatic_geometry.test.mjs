import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,clone,validateDoc,append} from '../src/model.mjs';
import {createSemanticConstruction,constructionExpression,applyConstructionExpression,PROGRAMMATIC_SEMANTIC_CONSTRUCTORS} from '../src/construction_expression.mjs';
function fixture(){const d=newDoc();for(const s of ['A = (0, 0)','B = (5, 0)','C = (0, 5)','D = (8, 6)','L = Line(A, B)','K = Circle(A, C)','J = Circle(B, C)'])command(d,s);return d;}
test('semantic constructors create actual geometric objects and round-trip through Properties',()=>{
 const variants=[
  ['PointOnObject(L, parameter=0.5)','pointOnObject'],
  ['TangentCircle(D, K, branch=1)','tangentCircle'],
  ['Parabola(C, L)','parabola'],
  ['TriangleCenter(A, B, C, centerKind="centroid")','triangleCenter'],
  ['CircleIntersection(L, K, branch=1)','circleIntersection'],
  ['CircleCircleIntersection(K, J, branch=-1)','circleCircleIntersection'],
  ['Reflect(C, L)','transformCopy'],
  ['Rotate(C, A, amount=0.4)','transformCopy'],
  ['Dilate(C, A, amount=2)','transformCopy'],
  ['Translate(C, A, B)','transformCopy'],
  ['Invert(C, K)','transformCopy'],
  ['GeneralIntersection(L, K, rootIndex=0)','generalIntersection'],
 ];
 for(const [rhs,type] of variants){const d=fixture();const before=d.objects.length;
  const created=createSemanticConstruction(d,rhs);assert.equal(created.type,type,rhs);
  assert.equal(d.objects.length,before+1,rhs);validateDoc(d);
  const expression=constructionExpression(d,created);assert.ok(expression,rhs);
  applyConstructionExpression(d,created.id,expression);validateDoc(d);
  const restored=validateDoc(clone(d));assert.equal(constructionExpression(restored,restored.objects.at(-1)),expression,rhs);
 }
});
test('named semantic construction and live reference renames',()=>{
 const d=fixture(),o=createSemanticConstruction(d,'F = TriangleCenter(A, B, C, centerKind="incenter")');
 assert.equal(o.name,'F');assert.equal(o.centerKind,'incenter');
 d.objects.find(x=>x.name==='C').name='Third';assert.match(constructionExpression(d,o),/Third/);
});
test('bad programmatic geometric constructions are atomic',()=>{
 for(const rhs of ['L = TangentCircle(A, Line)','Parabola(Line, A)','TriangleCenter(A, B, Line)','Rotate(C, Line)','Translate(C,A,Line)','CircleIntersection(A,B)','Z = Rotate(C, A, amount=NaN)','Z = Rotate(C,A, branch=1)','Z = Rotate(C, A, amount=1, amount=2)','Z = Translate(C,A)','NotAConstructor(A,B)','Locus(A, B)']){
  const d=fixture(),before=clone(d);assert.throws(()=>createSemanticConstruction(d,rhs),rhs);assert.deepEqual(d,before,rhs);
 }
});
test('programmatic inventory provides semantic counterparts for extended tool geometries',()=>{
 for(const kind of ['PointOnObject','TangentCircle','Parabola','GeneralIntersection','Locus','TriangleCenter','CircleIntersection','CircleCircleIntersection','Reflect','Rotate','Translate','Dilate','Invert'])assert.ok(PROGRAMMATIC_SEMANTIC_CONSTRUCTORS.includes(kind),kind);
});
test('coordinate, text and diameter constructions are programmable',()=>{
 const d=fixture();
 const p=createSemanticConstruction(d,'P = Point(1+2, 4)');assert.equal(p.type,'point');assert.deepEqual(p.xy,[3,4]);
 const t=createSemanticConstruction(d,'T = Text(2, 3, "comma, quote \\" inside")');assert.equal(t.type,'text');assert.equal(t.text,'comma, quote " inside');
 const n=createSemanticConstruction(d,'N = Node(4, 5, "label")');assert.equal(n.type,'node');
 const c=createSemanticConstruction(d,'DiameterCircle = CircleDiameter(A, B)');assert.equal(c.type,'circle');
 assert.equal(d.objects.find(o=>o.id===c.refs[0]).type,'midpoint');validateDoc(d);
 for(const o of [p,t,n,c])assert.ok(constructionExpression(d,o));
});
test('every non-freehand canvas geometry tool has a documented programmatic path',async()=>{
 const {TOOLS}=await import('../src/model.mjs');
 const commandTools=new Set(['point','midpoint','segment','arrow','line','ray','perpBisector','angleBisector','parallelThrough','perpendicularThrough','perpendicularFoot','intersection','circle','circleThrough3','triangle','ellipse','rectangle','parallelogram','polygon','polyline','bezier','angle','regularPolygon','spline','closedSpline','circularArc','hyperbola','fixedLength','fixedAngle','node','morphism','text']);
 const aliasTools=new Set(['quadrilateral','circleDiameter','reflection','rotation','translation','dilation','circleInversion']);
 const semanticTools=new Set(['pointOnObject','tangentCircle','parabola','generalIntersection','locus','triangleCenter','circleIntersection','circleCircleIntersection','transformCopy']);
 const controls=new Set(['select','pan','slider','freehand']);
 const missing=TOOLS.filter(type=>![...commandTools,...aliasTools,...semanticTools,...controls].includes(type));
 assert.deepEqual(missing,[],'Unmapped geometric toolbar construction');
 // Enforce that the added command aliases are actually exposed.
 for(const kind of ['CircleDiameter','PointOnObject','TangentCircle','Parabola','GeneralIntersection','Locus','TriangleCenter','CircleIntersection','CircleCircleIntersection','Point','Text','Node','Rotate','Dilate','Translate','Reflect','Invert'])assert.ok(PROGRAMMATIC_SEMANTIC_CONSTRUCTORS.includes(kind),kind);
});
test('locus can be constructed from a true dependent point and driver',()=>{
 const d=fixture();const driver=createSemanticConstruction(d,'Driver = PointOnObject(L, parameter=0.35)');
 const target=command(d,'Midpoint(Driver, C)');target.name='Target';
 const locus=createSemanticConstruction(d,'Trace = Locus(Target, Driver)');
 assert.equal(locus.type,'locus');assert.deepEqual(locus.refs,[target.id,driver.id]);
 const before=clone(d);assert.throws(()=>createSemanticConstruction(d,'Bad = Locus(A, Driver)'));
 assert.deepEqual(d,before);validateDoc(d);
});
