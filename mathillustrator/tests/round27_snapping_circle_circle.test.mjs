import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,createResolver,intersectCircles,circleGeometry,validateDoc,guardAnchorMove,clone} from '../src/model.mjs';
import {nearestFreehandAttachment,freehandCurveSvg} from '../src/geometry.mjs';
import {layoutPointLabels} from '../src/label_layout.mjs';
function at(a,b,eps=1e-8){assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<eps,`${a} != ${b}`);}
function sampleCircle(doc,c1,c2){const r=createResolver(doc);return intersectCircles(circleGeometry(c1,id=>r.at(id)),circleGeometry(c2,id=>r.at(id)));}
test('Round27 new labels use collision-avoidance default; legacy explicit layout remains',()=>{
 const d=newDoc();assert.equal(d.settings.labelPlacement,'avoid');
 d.settings.labelPlacement='standard';assert.equal(validateDoc(d).settings.labelPlacement,'standard');
 const layout=layoutPointLabels([{id:'p',x:120,y:120,text:'A'},{id:'g',x:120,y:120,text:'Geometry label'}],400,300);
 const a=layout.get('p'),b=layout.get('g');assert.ok(a&&b);assert.notDeepEqual([a.x,a.y],[b.x,b.y]);
});
test('Round27 circle-circle crossings are rigorous, oriented and dynamically resolved',()=>{
 const d=newDoc(),a=addPoint(d,[0,0]),b=addPoint(d,[0,5]),c=addPoint(d,[6,0]),e=addPoint(d,[6,5]);
 const first=append(d,{type:'circle',refs:[a.id,b.id]}),second=append(d,{type:'circle',refs:[c.id,e.id]});
 const roots=sampleCircle(d,first,second);
 at(roots.minus,[3,-4]);at(roots.plus,[3,4]);
 const minus=append(d,{type:'circleCircleIntersection',refs:[first.id,second.id],branch:-1});
 const plus=append(d,{type:'circleCircleIntersection',refs:[first.id,second.id],branch:1});
 const rr=createResolver(d);at(rr.at(minus.id),[3,-4]);at(rr.at(plus.id),[3,4]);
 assert.equal(validateDoc(d).objects.length,8);
 c.xy=[10,0];e.xy=[10,5];at(createResolver(d).at(minus.id),[5,0]);at(createResolver(d).at(plus.id),[5,0]);
 c.xy=[8,0];e.xy=[8,5];at(createResolver(d).at(minus.id),[4,-3]);at(createResolver(d).at(plus.id),[4,3]);
});
test('Round27 tangent and disjoint circles have no duplicate or invented intersections',()=>{
 const a={center:[0,0],radius:3},b={center:[6,0],radius:3};
 const tangent=intersectCircles(a,b);assert.equal(tangent.tangent,true);at(tangent.minus,[3,0]);at(tangent.plus,[3,0]);
 assert.equal(intersectCircles(a,{center:[8,0],radius:3}).minus,null);
 assert.equal(intersectCircles(a,{center:[0,0],radius:3}).minus,null);
 assert.equal(intersectCircles(a,{center:[.2,0],radius:1}).minus,null);
 assert.equal(intersectCircles(a,{center:[2,0],radius:-1}).minus,null);
});
test('Round27 circle-circle malformed refs, wrong branches, cycles and invalid anchor moves reject',()=>{
 const d=newDoc(),a=addPoint(d,[0,0]),b=addPoint(d,[0,2]),c=addPoint(d,[3,0]),e=addPoint(d,[3,2]);
 const first=append(d,{type:'circle',refs:[a.id,b.id]}),second=append(d,{type:'circle',refs:[c.id,e.id]});
 const point=append(d,{type:'circleCircleIntersection',refs:[first.id,second.id],branch:-1});
 assert.doesNotThrow(()=>validateDoc(d));
 const bad=clone(d);bad.objects.at(-1).refs=[first.id,a.id];assert.throws(()=>validateDoc(bad),/reference target/);
 const branch=clone(d);branch.objects.at(-1).branch=0;assert.throws(()=>validateDoc(branch),/branch/);
 const cycle=clone(d);cycle.objects.find(o=>o.id===first.id).refs=[point.id,b.id];assert.throws(()=>validateDoc(cycle));
 const moved=clone(d);moved.objects.find(o=>o.id===c.id).xy=[20,0];assert.throws(()=>guardAnchorMove(d,moved,c.id),/intersection/);
});
test('Round27 freehand attaches to displayed smooth curve rather than raw closure chord',()=>{
 const o={id:'free1',type:'freehand',hidden:false,style:{opacity:1},closed:true,
  path:[[0,0],[3,0],[5,2],[5,6],[2,8],[-1,6],[-1,2],[0,0.6],[1.1,0.4]]};
 const resolver={points:()=>[],at:()=>null};
 const rawEnd=o.path.at(-1),scale=30;
 const d=freehandCurveSvg(o.path.map(p=>[p[0]*scale,-p[1]*scale]),true);
 assert.ok(d.startsWith('M')&&d.endsWith(' Z'));
 // Snap result must be within 0.75px of the visibly rendered SVG,
 // checked independently using a dense cubic sampling of the d attribute.
 function visibleDistance(pt){
  const tokens=d.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)||[];
  let i=0,last,first,min=Infinity;
  const numeric=()=>Number(tokens[i++]);
  const offer=(x,y)=>{min=Math.min(min,Math.hypot(pt[0]*scale-x,-pt[1]*scale-y));};
  while(i<tokens.length){const op=tokens[i++];
   if(op==='M'||op==='L'){last=[numeric(),numeric()];if(op==='M')first=last;offer(...last);}
   else if(op==='C'){const b=[numeric(),numeric()],c=[numeric(),numeric()],e=[numeric(),numeric()];for(let k=0;k<=40;k++){const t=k/40,u=1-t;offer(u*u*u*last[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*e[0],u*u*u*last[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*e[1]);}last=e;}
   else if(op==='Z'){if(first)offer(...first);}else break;
  }return min;
 }
 const query=[rawEnd[0]+.04,rawEnd[1]-.03];
 const result=nearestFreehandAttachment(query,[o],resolver,scale,200);
 assert.ok(result,`Expected visible-path projection for ${query}`);
 assert.ok(visibleDistance(result.world)<.75,`Snapped to invisible samples: ${result.world}, distance ${visibleDistance(result.world)}`);
 const again=nearestFreehandAttachment(query,[o],resolver,scale,200);
 at(again.world,result.world,1e-9);
 assert.deepEqual(o.path.at(-1),rawEnd);
});
