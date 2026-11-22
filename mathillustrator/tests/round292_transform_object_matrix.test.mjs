import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,createResolver,clone,validateDoc,affected,geometricLine,geometricCircle,geometricPoint} from '../src/model.mjs';
import {r50SourceShape} from '../src/geometry_round50.mjs';
import {submit2DAlgebra,constructionExpression} from '../src/construction_expression.mjs';

function fixture(){
 const d=newDoc();
 const pts={};for(const [name,xy] of Object.entries({A:[-3,-1],B:[2,-1],C:[3,2],D:[-2,3],O:[5,5],V:[7,5],W:[5,7]}))pts[name]=addPoint(d,xy,name);
 const ref=(...names)=>names.map(n=>pts[n].id);
 const sources={
  point:pts.A,
  segment:append(d,{type:'segment',name:'Seg',refs:ref('A','B')}),
  arrow:append(d,{type:'arrow',name:'Arr',refs:ref('A','B')}),
  line:append(d,{type:'line',name:'Ln',refs:ref('A','B')}),
  ray:append(d,{type:'ray',name:'Ry',refs:ref('A','B')}),
  circle:append(d,{type:'circle',name:'Cir',refs:ref('A','B')}),
  polygon:append(d,{type:'polygon',name:'Poly',refs:ref('A','B','C','D')}),
  ellipse:append(d,{type:'ellipse',name:'Ell',refs:ref('A','B','C')}),
  bezier:append(d,{type:'bezier',name:'Bez',refs:ref('A','B','C','D')}),
  spline:append(d,{type:'spline',name:'Spl',refs:ref('A','B','C','D'),closed:false}),
  closedSpline:append(d,{type:'spline',name:'CSpl',refs:ref('A','B','C','D'),closed:true}),
  freehand:append(d,{type:'freehand',name:'Stroke',path:[[0,0],[1,2],[2,1],[3,3]],closed:false}),
  rectangle:append(d,{type:'rectangle',name:'Rect',refs:ref('A','B','C')}),
  regularPolygon:append(d,{type:'regularPolygon',name:'Reg',refs:ref('A','B'),sides:5}),
 };
 return {d,pts,sources};
}
const close=(a,b,eps=1e-7)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<eps,`${a} != ${b}`);
const affine=(mode,p,pts,amount)=>{
 const o=pts.O.xy,v=pts.V.xy,w=pts.W.xy;
 if(mode==='translate')return [p[0]+v[0]-o[0],p[1]+v[1]-o[1]];
 if(mode==='rotate'){const dx=p[0]-o[0],dy=p[1]-o[1];return [o[0]+Math.cos(amount)*dx-Math.sin(amount)*dy,o[1]+Math.sin(amount)*dx+Math.cos(amount)*dy];}
 if(mode==='dilate')return [o[0]+amount*(p[0]-o[0]),o[1]+amount*(p[1]-o[1])];
 throw Error(mode);
};

test('all visual 2D geometry families support named and unnamed affine images, persistent dependencies, and exact sampled coordinates',()=>{
 const {d,pts,sources}=fixture();const operations=['translate','rotate','dilate'];
 for(const [kind,source] of Object.entries(sources))for(const mode of operations){
  const src=r50SourceShape(source,createResolver(d),120);
  assert.ok(src.length>0,`${kind} has no source shape`);
  const amount=mode==='rotate'?.52:mode==='dilate'?1.35:0;
  const spec=mode==='translate'?`Translate(${source.name},O,V)`:`${mode==='rotate'?'Rotate':'Dilate'}(${source.name},O,amount=${amount})`;
  const transformed=submit2DAlgebra(d,spec);
  assert.equal(transformed.type,'transformCopy');assert.equal(transformed.refs[0],source.id);
  const actual=r50SourceShape(transformed,createResolver(d),120);
  assert.equal(actual.length,src.length,`${kind} ${mode}: sampling parity`);
  if(['line','ray'].includes(kind)){
    assert.ok(geometricLine(transformed,createResolver(d)),kind+' analytic role');
    close(createResolver(d).line(transformed).a,affine(mode,createResolver(d).line(source).a,pts,amount));
  }else if(kind==='circle'){
    const circle=createResolver(d).circle(source),image=createResolver(d).circle(transformed);
    assert.ok(image);close(image.center,affine(mode,circle.center,pts,amount));
    assert.ok(Math.abs(image.radius-circle.radius*(mode==='dilate'?amount:1))<1e-7);
  }else src.forEach((p,i)=>{try{close(actual[i],affine(mode,p,pts,amount),2e-6);}catch(e){throw Error(`${kind} ${mode} ${i}: ${e.message}`);}});
  assert.ok(affected(d,source.id).has(transformed.id));
  assert.match(constructionExpression(d,transformed),new RegExp('^(Translate|Rotate|Dilate)\\('));
 }
 validateDoc(d);validateDoc(JSON.parse(JSON.stringify(d)));
 const all=clone(d);pts.B.xy=[2.5,-1.3];
 const changed=r50SourceShape(d.objects.find(x=>x.name==='Spl'),createResolver(d),120);
 assert.notDeepEqual(changed,r50SourceShape(all.objects.find(x=>x.name==='Spl'),createResolver(all),120));
});

test('reflections and inversions accept non-point sources while retaining analytic point/line/circle roles',()=>{
 const {d,sources,pts}=fixture();
 const inv=append(d,{type:'circle',name:'InvCircle',refs:[pts.O.id,pts.V.id]});
 for(const source of Object.values(sources)){
  const reflection=submit2DAlgebra(d,`Reflect(${source.name},${source.id===sources.line.id?"Ry":"Ln"})`);
  assert.ok(r50SourceShape(reflection,createResolver(d),120).length,source.name+' reflection');
  const inversion=submit2DAlgebra(d,`Invert(${source.name},InvCircle)`);
  assert.ok(r50SourceShape(inversion,createResolver(d),120).some(x=>Array.isArray(x)),source.name+' inversion');
 }
 const lineImg=d.objects.find(x=>x.type==='transformCopy'&&x.refs[0]===sources.line.id&&x.transform==='reflect');
 const circleImg=d.objects.find(x=>x.type==='transformCopy'&&x.refs[0]===sources.circle.id&&x.transform==='reflect');
 const pointImg=d.objects.find(x=>x.type==='transformCopy'&&x.refs[0]===sources.point.id&&x.transform==='reflect');
 const r=createResolver(d);
 assert.ok(geometricLine(lineImg,r));assert.ok(geometricCircle(circleImg,r));assert.ok(geometricPoint(pointImg,r));
 validateDoc(d);
});
