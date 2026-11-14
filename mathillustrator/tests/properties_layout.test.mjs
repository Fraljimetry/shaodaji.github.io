import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePropertiesLayout,fitFloatingProperties,fitDockPropertiesHeight} from '../src/properties_layout.mjs';

test('R92 layouts are docked by default and prior Float preferences are ignored',()=>{
 const d=normalizePropertiesLayout(null);
 assert.deepEqual(d,{mode:'docked',collapsed:false,dockHeight:230,x:320,y:100,width:300,height:320});
 assert.deepEqual(normalizePropertiesLayout({mode:'docked',dockHeight:250}),{...d,mode:'docked',dockHeight:250});
 assert.deepEqual(normalizePropertiesLayout({mode:'docked',collapsed:false,dockHeight:320,x:140,y:190,width:450,height:510}),{mode:'docked',collapsed:false,dockHeight:320,x:140,y:190,width:450,height:510});
});
test('R45 collapsed state is explicitly boolean and does not leak into scene files',()=>{
 const a=normalizePropertiesLayout({mode:'floating',collapsed:true});assert.equal(a.collapsed,true);
 assert.equal(normalizePropertiesLayout({collapsed:'true'}).collapsed,false);
});
test('R45 reject malformed inherited / foreign preference geometry without NaN or prototype leakage',()=>{
 const data=[undefined,null,[],true,5,'bad',{mode:'foreign',dockHeight:'900',width:-400,height:Infinity,x:null,y:NaN},Object.create({mode:'floating',width:480})];
 for(const input of data){const p=normalizePropertiesLayout(input);for(const key of ['width','height','x','y','dockHeight'])assert.ok(Number.isFinite(p[key]));}
 assert.equal(normalizePropertiesLayout({mode:'floating',width:'450'}).width,300);
 assert.equal(normalizePropertiesLayout({mode:'floating',x:-1}).x,320);
});
test('R45 float visual clamping never mutates preferred saved layout',()=>{
 const src=normalizePropertiesLayout({mode:'floating',x:9000,y:9000,width:580,height:700});
 const copy={...src};
 const small=fitFloatingProperties(src,701,480,88);
 assert.ok(small.x>=8&&small.x+small.width<=701-7,JSON.stringify(small));
 assert.ok(small.y>=93&&small.y+small.height<=480-7,JSON.stringify(small));
 const large=fitFloatingProperties(src,2000,1200,58);
 assert.equal(large.width,580);assert.equal(large.height,700);
 assert.deepEqual(src,copy);
});
test('R45 dock split protects minimum object list space, even on tiny viewport',()=>{
 const a=fitDockPropertiesHeight(1000,850,220);assert.equal(a.height,a.max);assert.ok(a.max<=560);
 const b=fitDockPropertiesHeight(230,250,215);assert.equal(b.height,38);assert.equal(b.max,38);
 const c=fitDockPropertiesHeight(200,620,240);assert.equal(c.height,200);
});
