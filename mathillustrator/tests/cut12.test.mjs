import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,createResolver,validateDoc,clone} from '../src/model.mjs';
import {worldBounds,fitSceneView} from '../src/geometry.mjs';

function fixture(){
 const d=newDoc();
 addPoint(d,[0,0],'A');addPoint(d,[3,2],'B');
 const out=addPoint(d,[800000,900000],'Invisible');out.style.opacity=0;
 return d;
}

test('Cut12: fully transparent outlier cannot expand visible scene Fit bounds',()=>{
 const d=fixture(),r=createResolver(d),bounds=worldBounds(d,r);
 assert.deepEqual(bounds,{minX:0,maxX:3,minY:0,maxY:2});
 const fit=fitSceneView(d,r,{w:900,h:600});
 assert.ok(fit.scale>30 && Math.abs(fit.cx)<10 && Math.abs(fit.cy)<10,JSON.stringify(fit));
});

test('Cut12: invisible-only scene has a safe default Fit',()=>{
 const d=fixture();d.objects[0].hidden=true;d.objects[1].hidden=true;
 assert.equal(worldBounds(d,createResolver(d)),null);
 const fit=fitSceneView(d,createResolver(d),{w:850,h:510});
 assert.deepEqual(fit,{cx:0,cy:0,scale:48,clipped:false});
});

test('Cut12: hide/opacity toggles do not modify serialized geometry',()=>{
 const d=fixture(),before=d.objects.map(o=>[o.id,clone(o.xy)]);
 d.objects[0].style.opacity=0;d.objects[2].style.opacity=1;
 validateDoc(d);assert.deepEqual(d.objects.map(o=>[o.id,o.xy]),before);
 const b=worldBounds(d,createResolver(d));assert.equal(b.maxX,800000);
});

test('Cut12: morphism whose endpoint is hidden cannot pull Fit offscreen',()=>{
 const d=newDoc();const a=append(d,{type:'node',name:'A',xy:[0,0],text:'A',fontSize:17});
 const b=append(d,{type:'node',name:'B',xy:[500000,500000],text:'B',fontSize:17});
 append(d,{type:'morphism',name:'f',refs:[a.id,b.id],text:'f',bend:0});
 b.hidden=true;
 assert.deepEqual(worldBounds(d,createResolver(d)),{minX:0,maxX:0,minY:0,maxY:0});
 b.hidden=false;b.style.opacity=0;
 assert.deepEqual(worldBounds(d,createResolver(d)),{minX:0,maxX:0,minY:0,maxY:0});
 b.style.opacity=1;
 assert.equal(worldBounds(d,createResolver(d)).maxX,500000);
});
