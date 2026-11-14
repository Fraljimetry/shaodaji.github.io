import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,POINT_LIKE,STRAIGHT_TYPES,geometricPoint,geometricLine,createResolver,command,validateDoc,clone,affected} from '../src/model.mjs';
import {createAnchorIndex} from '../src/anchor_index.mjs';
import {r50Shape} from '../src/geometry_round50.mjs';

function scene(){
 const d=newDoc();d.settings.snapAnchors=true;
 const left=addPoint(d,[-2,0],'A'),right=addPoint(d,[2,0],'B');
 const leftTop=addPoint(d,[-2,3],'C'),rightTop=addPoint(d,[2,3],'D');
 const c1=append(d,{type:'circle',refs:[left.id,leftTop.id],name:'LeftCircle'});
 const c2=append(d,{type:'circle',refs:[right.id,rightTop.id],name:'RightCircle'});
 const i=append(d,{type:'circleCircleIntersection',refs:[c1.id,c2.id],branch:-1,name:'I'});
 const j=append(d,{type:'circleCircleIntersection',refs:[c1.id,c2.id],branch:1,name:'J'});
 const origin=addPoint(d,[0,0],'O'),rad=addPoint(d,[1,0],'R');
 const inner=append(d,{type:'circle',refs:[origin.id,rad.id],name:'InnerCircle'});
 return {d,i,j,inner,origin};
}
const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);

test('R51H: all derived points have one shared geometry role and remain live',()=>{
 const {d,i,j,inner,origin}=scene(),res=createResolver(d);
 assert.ok(geometricPoint(i,res)&&geometricPoint(j,res));
 const segment=command(d,'Segment(I,J)');
 assert.deepEqual(segment.refs,[i.id,j.id]);
 const axis=append(d,{type:'line',refs:[origin.id,i.id]});
 assert.ok(geometricLine(axis,createResolver(d)));
 const foot=append(d,{type:'perpendicularFoot',refs:[i.id,axis.id]});
 assert.ok(geometricPoint(foot,createResolver(d)));
 const tangent=append(d,{type:'tangentCircle',refs:[i.id,inner.id],branch:-1});
 const r=createResolver(d);assert.ok(geometricLine(tangent,r));
 const rot=append(d,{type:'transformCopy',refs:[segment.id,j.id],transform:'rotate',amount:Math.PI/2});
 const shift=append(d,{type:'transformCopy',refs:[segment.id,i.id,j.id],transform:'translate',amount:0});
 const horizontal=append(d,{type:'line',refs:[origin.id,d.objects.find(o=>o.name==='R').id]});
 const parabola=append(d,{type:'parabola',refs:[i.id,horizontal.id]});
 assert.ok(r50Shape(rot,createResolver(d)).length===2);
 assert.ok(r50Shape(shift,createResolver(d)).length===2);
 assert.ok(r50Shape(parabola,createResolver(d)).length>20);
 assert.doesNotThrow(()=>validateDoc(clone(d)));
 assert.ok(affected(d,i.id).has(shift.id));
 const before=createResolver(d).at(i.id);
 d.objects.find(o=>o.name==='B').xy=[2.5,0];
 const after=createResolver(d).at(i.id);
 assert.ok(dist(before,after)>.05,'intersection changes dynamically when source circle moves');
 assert.ok(dist(createResolver(d).at(foot.id),after)<1e-8,'dependent perpendicular foot remains live');
});

test('R51H: all computed points appear in the spatial index for snapping and picking',()=>{
 const {d,i,j,inner,origin}=scene();
 const on=append(d,{type:'pointOnObject',refs:[inner.id],parameter:.25,name:'OnCircle'});
 const c=append(d,{type:'triangleCenter',refs:[i.id,j.id,origin.id],centerKind:'centroid'});
 const axis=append(d,{type:'line',refs:[i.id,j.id]});
 const mid=append(d,{type:'midpoint',refs:[i.id,j.id]});
 const foot=append(d,{type:'perpendicularFoot',refs:[origin.id,axis.id]});
 const points=[i,j,on,c,mid,foot];
 const resolver=createResolver(d),view={cx:0,cy:0,scale:48},size={w:1000,h:800};
 const index=createAnchorIndex(d,resolver,view,size);
 assert.equal(index.stats().anchors,[...d.objects].filter(o=>POINT_LIKE.has(o.type)&&resolver.at(o.id)).length);
 for(const ob of points){
  const p=resolver.at(ob.id);assert.ok(p,ob.type);
  const x=500+48*p[0],y=400-48*p[1];
  assert.ok(index.hits(x,y).includes(ob.id),`${ob.type} absent from hit index`);
  assert.ok(index.nearest(x,y,12),`${ob.type} not usable as snapping target`);
 }
 assert.ok(!POINT_LIKE.has('node')&&!POINT_LIKE.has('circle')&&!STRAIGHT_TYPES.has('circle'));
 assert.ok(!geometricPoint(inner,resolver));
 assert.ok(!geometricLine(inner,resolver));
});

test('R51H: generated line kinds can act as line references without accidental circle promotion',()=>{
 const {d,i,j,origin}=scene(),base=append(d,{type:'line',refs:[origin.id,i.id]});
 const fixed=append(d,{type:'fixedLength',refs:[origin.id,j.id],length:3});
 const parallel=append(d,{type:'parallelThrough',refs:[i.id,base.id]});
 const perpendicular=append(d,{type:'perpendicularThrough',refs:[j.id,base.id]});
 for(const line of [base,fixed,parallel,perpendicular]){
  assert.ok(geometricLine(line,createResolver(d)),line.type);
  const cloneLine=append(d,{type:'parallelThrough',refs:[origin.id,line.id]});
  assert.ok(geometricLine(cloneLine,createResolver(d)),`${line.type} could not be referenced as line`);
 }
 const invalid=append(d,{type:'node',xy:[3,4],text:'diagram'});
 assert.equal(geometricPoint(invalid,createResolver(d)),false);
 assert.throws(()=>validateDoc({...clone(d),nextId:d.nextId+1,objects:[...clone(d).objects,{...d.objects.find(o=>o.type==='parallelThrough'),id:'o'+d.nextId,name:'InvalidTest',refs:[invalid.id,base.id]}]}),/Invalid reference target/);
});
