import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,clone,validateDoc,createResolver} from '../src/model.mjs';
import {submit2DAlgebra,constructionExpression} from '../src/construction_expression.mjs';
import {recalculateAlgebra} from '../src/algebra.mjs';

function fixture(){
 const doc=newDoc();
 for(const input of ['A=(0,0)','B=(4,0)','C=(1,3)','D=(4,4)','E=(-2,1)','F=(1,-3)',
  's=Segment(A,B)','t=Line(C,F)','cc=Circle(A,B)','cc2=Circle(C,B)',
  'p=Node(0,0,"P")','q=Node(4,2,"Q")','Slider(0,8,1,3)'])submit2DAlgebra(doc,input);
 return doc;
}

const structural=[
 'Segment(A,B)','Vector(A,B)','Arrow(A,B)','Line(A,B)','Ray(A,B)','PerpBisector(A,B)',
 'PerpendicularBisector(A,B)','Circle(A,B)','CircleThrough3(A,B,C)',
 'Ellipse(A,B,C)','Rectangle(A,B,C)','Parallelogram(A,B,C)',
 'Polygon(A,B,C,D)','Triangle(A,B,C)','Quadrilateral(A,B,C,D)',
 'Polyline(A,B,C,D)','Bezier(A,B,C,D)','Angle(A,B,C)','AngleBisector(A,B,C)',
 'Midpoint(A,B)','Spline(A,B,C,D)','ClosedSpline(A,B,C,D)',
 'CircularArc(A,B,C)','Hyperbola(A,B,C)',
 'Parallel(C,s)','Perpendicular(C,s)','Foot(C,s)','Intersect(s,t)',
 'FixedLength(A,B,2)','FixedAngle(A,B,rad(50))','Rotate(B,A,rad(30))',
 'Dilate(B,A,2)','RegularPolygon(A,B,5)',
 'Node(1,2,"Node")','Text(1,2,"text")','Morphism(p,q,"f")',
 'Point(2,5)','CircleDiameter(A,B)',
 'TriangleCenter(A,B,C,centerKind="incenter")',
 'PointOnObject(s,parameter=0.3)',
 'Parabola(B,t)',
 'CircleIntersection(t,cc)',
 'CircleCircleIntersection(cc,cc2)',
 'Translate(s,A,B)','Reflect(s,t)',
 'Rotate(s,A,amount=1.2)','Dilate(s,A,amount=2)',
 'Invert(B,cc)',
];

for(const source of structural){
 test(`named/unnamed parity: ${source}`,()=>{
  const original=fixture(), a=clone(original), b=clone(original);
  let x,y,ex,ey;
  try{x=submit2DAlgebra(a,source);}catch(e){ex=e;}
  try{y=submit2DAlgebra(b,`fresh290 = ${source}`);}catch(e){ey=e;}
  assert.equal(!!ex,!!ey,`named/unnamed mismatch: unnamed ${ex?.message}; named ${ey?.message}`);
  if(ex){return;}
  assert.equal(x.type,y.type);
  assert.ok(x.name&&x.name!=='fresh290');assert.equal(y.name,'fresh290');
  assert.deepEqual(x.refs,y.refs);
  assert.equal(x.id,y.id);
  validateDoc(a);validateDoc(b);
  assert.equal(JSON.parse(JSON.stringify(a)).objects.find(o=>o.id===x.id)?.id,x.id);
 });
}

test('unnamed points and sliders preserve automatic identity, parameters and reference updates',()=>{
 const d=fixture();const first=submit2DAlgebra(d,'Slider(0,10,0.5,4)');
 assert.equal(first.name,'Slider2');
 const second=submit2DAlgebra(d,'Slider(0,10,0.5,5)');assert.equal(second.name,'Slider3');
 const a=submit2DAlgebra(d,'(Slider2 + 1, sin(Slider3))');
 assert.equal(a.type,'point');assert.ok(a.name);assert.deepEqual(a.xyExpr,['Slider2 + 1','sin(Slider3)']);
 const b=submit2DAlgebra(d,'Point(3,2)');
 const seg=submit2DAlgebra(d,`Segment(${a.name},${b.name})`);
 assert.deepEqual(seg.refs,[a.id,b.id]);
 first.value=6;recalculateAlgebra(d);
 assert.deepEqual(createResolver(d).at(a.id),[7,Math.sin(5)]);
 validateDoc(d);validateDoc(JSON.parse(JSON.stringify(d)));
 const snap=JSON.stringify(d);
 for(const bad of ['(1,missing)','Slider(2,2)','Slider(0,1,0)','Segment(A,Missing)']){
  const copy=clone(d);assert.throws(()=>submit2DAlgebra(copy,bad));
  assert.equal(JSON.stringify(copy),snap,`partial mutation on ${bad}`);
 }
});

test('explicitly named legacy syntax stays unchanged',()=>{
 const d=fixture();
 const p=submit2DAlgebra(d,'Z=(2,8)');assert.equal(p.name,'Z');
 const q=submit2DAlgebra(d,'V=Point(2,9)');assert.equal(q.name,'V');
 const f=submit2DAlgebra(d,'f(x)=x^2');assert.equal(f.name,'f');
 const sl=submit2DAlgebra(d,'speed=Slider(0,10,0.25,2)');assert.equal(sl.name,'speed');
 const edge=submit2DAlgebra(d,'myline=Line(A,B)');assert.equal(edge.name,'myline');
 validateDoc(d);
});
