import test from 'node:test';
import assert from 'node:assert/strict';
import {freehandCurveSvg,closeFreehandStroke,smoothPath} from '../src/geometry.mjs';
import {newDoc,addPoint,append,createResolver,intersectLineCircle,circleGeometry,validateDoc,guardAnchorMove,remove,circumcircle} from '../src/model.mjs';

function make(){
 const doc=newDoc();
 const a=addPoint(doc,[-4,0]),b=addPoint(doc,[4,0]),o=addPoint(doc,[0,0]),r=addPoint(doc,[0,2]);
 const line=append(doc,{type:'line',refs:[a.id,b.id]});
 const circle=append(doc,{type:'circle',refs:[o.id,r.id]});
 return {doc,a,b,o,r,line,circle};
}
function vec(p,q){return [q[0]-p[0],q[1]-p[1]];}
function norm(a){return Math.hypot(...a);}
function cubicSegments(svg){
 const nums=[...svg.matchAll(/-?(?:\d+(?:\.\d+)?|\.\d+)/g)].map(m=>Number(m[0]));
 assert.ok(svg.startsWith('M')&&svg.endsWith(' Z')&&!nums.some(n=>!Number.isFinite(n)));
 assert.equal((nums.length-2)%6,0);
 const result=[];let p=nums.slice(0,2);
 for(let i=2;i<nums.length;i+=6){const q=[nums[i],nums[i+1]],r=[nums[i+2],nums[i+3]],t=[nums[i+4],nums[i+5]];result.push([p,q,r,t]);p=t;}
 return result;
}
test('Round26 aggressive freehand join: both sides continuously blended at closure',()=>{
 const raw=[];
 // Hand-drawn loop approaching the first anchor from an awkward direction,
 // with an acute pen-up hook and near but distinct endpoints.
 for(let k=0;k<=150;k++){
  const theta=2*Math.PI*.92*k/150;
  raw.push([260+165*Math.cos(theta)+2*Math.sin(k*.9),260+130*Math.sin(theta)+Math.sin(k*.7)]);
 }
 raw.push([raw[0][0]+5,raw[0][1]+9]);
 const before=structuredClone(raw);
 const joined=closeFreehandStroke(raw,'near',1);
 assert.equal(joined.closed,true);assert.ok(['corner','smooth'].includes(joined.joinStyle));
 const path=freehandCurveSvg(raw,true);
 const cubics=cubicSegments(path);
 assert.ok(cubics.length>50&&cubics.length<4097);
 const first=cubics[0],last=cubics.at(-1);
 assert.deepEqual(first[0],last[3]);
 const startT=vec(first[0],first[1]),endT=vec(last[2],last[3]);
 assert.ok(norm(startT)>1e-5&&norm(endT)>1e-5);
 assert.ok((startT[0]*endT[0]+startT[1]*endT[1])/(norm(startT)*norm(endT))>.995);
 assert.ok(Math.hypot(first[0][0]-raw[0][0],first[0][1]-raw[0][1])>1,'blend must move raw seam, not preserve its cusp');
 assert.deepEqual(raw,before);
 assert.equal(freehandCurveSvg(raw,false).endsWith(' Z'),false,'open curve stays open');
 assert.match(freehandCurveSvg(smoothPath(raw,'ultra',1),true),/^M.* Z$/);
});
test('Round26 closure stays finite/bounded on duplicate points, tiny shapes and zoomed paths',()=>{
 for(const raw of [ [[0,0],[20,0],[20,20],[0,20],[0,0]], [[0,0],[.1,0],[.1,.1],[0,.1]], Array.from({length:2500},(_,i)=>[200*Math.cos(2*Math.PI*i/2499),200*Math.sin(2*Math.PI*i/2499)]) ]){
  const path=freehandCurveSvg(raw,true);
  assert.ok(path.length<260000,'bounded path data');assert.ok(!/NaN|Infinity/.test(path));assert.ok(path.endsWith(' Z'));
 }
});
test('Round26 line-circle roots are signed, stable, dynamic, and JSON compatible',()=>{
 const {doc,a,b,r,line,circle}=make();
 const resolver=createResolver(doc),roots=intersectLineCircle(resolver.line(line),circleGeometry(circle,id=>resolver.at(id)));
 assert.deepEqual(roots.minus,[-2,0]);assert.deepEqual(roots.plus,[2,0]);assert.equal(roots.tangent,false);
 const minus=append(doc,{type:'circleIntersection',refs:[line.id,circle.id],branch:-1});
 const plus=append(doc,{type:'circleIntersection',refs:[line.id,circle.id],branch:1});
 assert.deepEqual(createResolver(validateDoc(doc)).at(minus.id),[-2,0]);
 assert.deepEqual(createResolver(doc).at(plus.id),[2,0]);
 const before=structuredClone(doc);
 r.xy=[0,3];
 assert.deepEqual(createResolver(doc).at(plus.id),[3,0]);
 assert.doesNotThrow(()=>guardAnchorMove(before,doc,r.id));
 assert.equal(remove(doc,circle.id),3,'circle and two dependent branches deleted');
});
test('Round26 tangencies and segment/ray-domain clipping never synthesize stray roots',()=>{
 const {doc,a,b,line,circle}=make();
 const resolver=createResolver(doc);
 const tangent={a:[-3,2],d:[1,0],domain:'infinite',length:6};
 const roots=intersectLineCircle(tangent,circleGeometry(circle,id=>resolver.at(id)));
 assert.equal(roots.tangent,true);assert.deepEqual(roots.minus,[0,2]);assert.deepEqual(roots.plus,[0,2]);
 const one=intersectLineCircle({...resolver.line(line),a:[-3,0],domain:'segment',length:2},circleGeometry(circle,id=>resolver.at(id)));
 assert.deepEqual(one.minus,[-2,0]);assert.equal(one.plus,null);
 const zero=intersectLineCircle({...resolver.line(line),a:[3,3],domain:'ray'},circleGeometry(circle,id=>resolver.at(id)));
 assert.equal(zero.minus,null);assert.equal(zero.plus,null);
 assert.equal(intersectLineCircle({...resolver.line(line),a:[-3,3]},circleGeometry(circle,id=>resolver.at(id))).minus,null);
 assert.equal(intersectLineCircle(null,null).plus,null);
 assert.equal(intersectLineCircle({...resolver.line(line),d:[0,0]},circleGeometry(circle,id=>resolver.at(id))).plus,null);
});
test('Round26 branch validation, invalid anchor move and cyclic refs fail closed',()=>{
 const {doc,a,b,line,circle,o}=make();
 const hit=append(doc,{type:'circleIntersection',refs:[line.id,circle.id],branch:1});
 for(const branch of [0,2,'+',undefined]){const invalid=structuredClone(doc);invalid.objects.at(-1).branch=branch;assert.throws(()=>validateDoc(invalid),/branch/i);}
 const invalid=structuredClone(doc);invalid.objects.at(-1).refs=[circle.id,line.id];assert.throws(()=>validateDoc(invalid),/reference target/i);
 const cyclic=structuredClone(doc);cyclic.objects.at(-1).refs=[hit.id,circle.id];assert.throws(()=>validateDoc(cyclic),/reference target|cyclic/i);
 const before=structuredClone(doc);o.xy=[0,1];assert.doesNotThrow(()=>guardAnchorMove(before,doc,o.id));
 // Far center removes every root; must reject the move.
 o.xy=[0,100];assert.throws(()=>guardAnchorMove(before,doc,o.id),/collapse/i);
});
test('Round26 circle-through-three-points is supported',()=>{
 const {doc,line}=make();
 const c0=addPoint(doc,[0,2]),c1=addPoint(doc,[2,0]),c2=addPoint(doc,[0,-2]);
 const circle=append(doc,{type:'circleThrough3',refs:[c0.id,c1.id,c2.id]});
 const resolver=createResolver(doc);
 const geometry=circleGeometry(circle,id=>resolver.at(id));
 assert.ok(geometry&&Math.abs(geometry.radius-2)<1e-9);
 const point=append(doc,{type:'circleIntersection',refs:[line.id,circle.id],branch:1});
 assert.ok(Math.abs(createResolver(validateDoc(doc)).at(point.id)[0]-2)<1e-8);
});
