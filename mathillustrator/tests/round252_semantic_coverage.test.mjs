import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,append,clone,validateDoc} from '../src/model.mjs';
import {constructionExpression,applyConstructionExpression} from '../src/construction_expression.mjs';
function document(){const d=newDoc();for(const expr of ['A = (0, 0)','B = (3, 1)','C = (1, 4)','D = (4, 5)','Segment(A, B)','Line(B, C)','Circle(A, B)','Circle(B, C)'])command(d,expr);return d;}
const refs=(d,names)=>names.map(n=>(d.objects.find(o=>o.name===n)||d.objects.find(o=>o.type.toLowerCase()===n.toLowerCase()))?.id);
const samples=[
 ['pointOnObject',['Line'],{parameter:.3}],
 ['circleIntersection',['Line','Circle'],{branch:1}],
 ['circleCircleIntersection',['Circle 7','Circle 8'],{branch:-1}],
 ['tangentCircle',['D','Circle'],{branch:1}],
 ['parabola',['A','Line'],{}],
 ['generalIntersection',['Line','Circle'],{rootIndex:0}],
 ['locus',['A','B'],{}],
 ['triangleCenter',['A','B','C'],{centerKind:'centroid'}],
 ['transformCopy',['A','B'],{transform:'rotate',amount:0.3}],
 ['transformCopy',['A','B','C'],{transform:'translate',amount:0}],
 ['regularPolygon',['A','B'],{sides:6}],
 ['morphism',['A','B'],{text:'a'}],
 ['fixedLength',['A','B'],{length:4}],
 ['fixedAngle',['A','B'],{angle:1}],
];
test('semantic round trip for all extended constructors, including renaming',()=>{
 for(const [type,names,options] of samples){
  const d=document();if(type==='morphism'){append(d,{type:'node',name:'N1',xy:[0,0],text:'x'});append(d,{type:'node',name:'N2',xy:[1,1],text:'y'});names.splice(0,names.length,'N1','N2');}
  const o=append(d,{type,refs:refs(d,names),...options});
  const expression=constructionExpression(d,o);
  assert.ok(expression,`missing ${type}`);
  const original=clone(o);
  try{applyConstructionExpression(d,o.id,expression);}catch(e){throw Error(`${type}: ${e.message}`);}
  assert.deepEqual(o,original,`${type} changed on roundtrip`);
  d.objects.find(x=>x.id===refs(d,[names[0]])[0]).name='Renamed';
  assert.match(constructionExpression(d,o),/Renamed/);
  assert.equal(constructionExpression(validateDoc(clone(d)),o),constructionExpression(d,o));
 }
});
test('specialized property editing and invalid-option rollback',()=>{
 const d=document(),o=append(d,{type:'pointOnObject',refs:refs(d,['Line']),parameter:.25});
 const expression=constructionExpression(d,o);
 applyConstructionExpression(d,o.id,expression.replace('parameter=0.25','parameter=0.75'));
 assert.equal(o.parameter,.75);
 const before=clone(o);
 assert.throws(()=>applyConstructionExpression(d,o.id,expression.replace('parameter=0.25','parameter=20')));
 assert.deepEqual(o,before);
});
test('cycle prevention and failure atomicity',()=>{
 const d=document(),a=d.objects.find(x=>x.name==='A'),m=append(d,{type:'midpoint',refs:refs(d,['A','B'])});
 assert.throws(()=>applyConstructionExpression(d,m.id,`${m.name} = Midpoint(${m.name}, B)`),/Circular/);
 assert.deepEqual(m.refs,refs(d,['A','B']));
});
test('editing expressions across plotting, text, point and named function',()=>{
 const d=document();
 const list=[
  {type:'implicit',expr:'x^2+y^2-1'},
  {type:'vectorField',xExpr:'x',yExpr:'y',density:5,normalized:false,region:{xMin:-5,xMax:5,yMin:-5,yMax:5}},
  {type:'parametric',xExpr:'cos(t)',yExpr:'sin(t)',parameter:'t',tMin:0,tMax:6.28},
  {type:'domainColoring',expr:'z',region:{xMin:-5,xMax:5,yMin:-5,yMax:5}},
  {type:'text',xy:[2,3],text:'Note'},
  {type:'node',xy:[2,3],text:'Vertex'},
 ];
 for(const obj of list){const o=append(d,obj);const e=constructionExpression(d,o);assert.ok(e,obj.type);applyConstructionExpression(d,o.id,e);}
 const p=d.objects.find(o=>o.name==='A');applyConstructionExpression(d,p.id,'A = (2, 3)');assert.deepEqual(p.xy,[2,3]);
 const f=command(d,'f(x) = x^2');applyConstructionExpression(d,f.id,'f(x) = x^3');assert.equal(f.expr,'x^3');
});
test('freehand and generated edges have no expression editor',()=>{
 const d=document(),f=append(d,{type:'freehand',path:[[0,0],[1,1]]});assert.equal(constructionExpression(d,f),null);
 const p=command(d,'Polygon(A,B,C)');const edges=d.objects.filter(x=>x.edgeOf===p.id);
 assert.equal(edges.length,3);assert.match(constructionExpression(d,edges[0]),/Side\(Polygon.*1\)/);
 assert.throws(()=>applyConstructionExpression(d,edges[0].id,constructionExpression(d,edges[0])));
});
test('polygon edits keep generated edge IDs and rewrite their live endpoint references',()=>{
 const d=document(),p=command(d,'Polygon(A,B,C)'),edges=d.objects.filter(o=>o.edgeOf===p.id);
 const ids=edges.map(o=>o.id),before=clone(p);
 applyConstructionExpression(d,p.id,`${p.name} = Polygon(A,C,B)`);
 assert.deepEqual(edges.map(o=>o.id),ids);
 assert.deepEqual(edges.map(o=>o.refs),[[p.refs[0],p.refs[1]],[p.refs[1],p.refs[2]],[p.refs[2],p.refs[0]]]);
 validateDoc(d);
 assert.throws(()=>applyConstructionExpression(d,p.id,`${p.name} = Polygon(A,B,C,D)`));
 assert.deepEqual(p.refs,[...p.refs]);
});
