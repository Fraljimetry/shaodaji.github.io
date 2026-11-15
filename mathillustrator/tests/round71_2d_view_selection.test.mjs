import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,validateDoc} from '../src/model.mjs';
import {createAnchorIndex} from '../src/anchor_index.mjs';
import {worldBounds,fitSceneView} from '../src/geometry.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≠ ${b}`);
function scene(){
 const d=newDoc(),O=append(d,{type:'point',xy:[0,0]}),P=append(d,{type:'point',xy:[2,1]});
 const Q=append(d,{type:'transformCopy',refs:[P.id,O.id],transform:'dilate',amount:5});
 return {d,O,P,Q};
}
test('Round71: 2D hit index includes visible transformed points, supports snapping, and excludes hidden points',()=>{
 const {d,Q}=scene(),r=createResolver(d),view={cx:0,cy:0,scale:40},size={w:1200,h:700};
 const x=1000,y=150;
 const idx=createAnchorIndex(d,r,view,size);
 assert.equal(idx.hit(x,y)?.id,Q.id);
 assert.equal(idx.nearest(x+5,y+3,12)?.id,Q.id);
 Q.hidden=true;
 assert.notEqual(createAnchorIndex(d,createResolver(d),view,size).hit(x,y)?.id,Q.id);
});
test('Round71: Fit bounds represent the derived transformed point, not its source reference',()=>{
 const {d,Q}=scene();const r=createResolver(d);
 const b=worldBounds(d,r);near(b.maxX,10);near(b.maxY,5);
 const view=fitSceneView(d,r,{w:900,h:600});
 const px=(10-view.cx)*view.scale+450,py=(view.cy-5)*view.scale+300;
 assert.ok(px>=0&&px<=900&&py>=0&&py<=600,`${px},${py}`);
 Q.hidden=true;const invisible=worldBounds(d,createResolver(d));near(invisible.maxX,2);
});
test('Round71: Fit includes full transformed-circle extent rather than only its defining points',()=>{
 const {d,O,P}=scene();const C=append(d,{type:'circle',refs:[O.id,P.id]});
 const copy=append(d,{type:'transformCopy',refs:[C.id,O.id],transform:'dilate',amount:3});
 const r=createResolver(d),c=r.circle(copy);
 assert.ok(c&&c.radius>1);
 const b=worldBounds(d,r);assert.ok(b.minX<=c.center[0]-c.radius+1e-7,b);
 assert.ok(b.maxY>=c.center[1]+c.radius-1e-7,b);
 assert.doesNotThrow(()=>validateDoc(d));
});
test('Round71: 2D index rejects invisible ownership-dependent point anchors',()=>{
 const d=newDoc(),O=append(d,{type:'point',xy:[1,2]});
 O.hidden=true;
 const idx=createAnchorIndex(d,createResolver(d),{cx:0,cy:0,scale:50},{w:500,h:400});
 assert.equal(idx.stats().anchors,0);
});

test('Round71: offscreen anchors do not consume spatial-index buckets but near-edge anchors stay snappable',()=>{
 const d=newDoc();
 for(let i=0;i<500;i++)append(d,{type:'point',xy:[100000+i,100000+i]});
 const edge=append(d,{type:'point',xy:[-0.18,0]});
 const v={cx:0,cy:0,scale:50},size={w:500,h:400};
 // Place the visible origin at center x=250; the edge point is near this anchor.
 const index=createAnchorIndex(d,createResolver(d),v,size);
 assert.equal(index.stats().anchors,1,index.stats());
 assert.equal(index.nearest(250-9,200,12)?.id,edge.id);
});
