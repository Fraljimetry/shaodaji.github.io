import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,clone,validateDoc,addPoint,append,focalEllipse} from '../src/model.mjs';
import {pageRect} from '../src/geometry.mjs';

const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

test('Round24 oblique focal ellipses pass the third point after screen-space y inversion',()=>{
 const cases=[ [[-5.5,-3],[-3,-2.5],[-4.5,-1.5]],[[1.3,-2],[4.3,1],[2.5,.2]], [[0,3],[4,-2],[-1,-1]], [[0,-2],[0,2],[3,0]], [[-2,0],[2,0],[0,3]] ];
 for(const ps of cases){
  const ellipse=focalEllipse(ps);assert.ok(ellipse);
  // Canvas project(x,y) = [x,-y]; SVG rotation angle must be -atan2(dy,dx).
  const dx=ps[2][0]-ellipse.cx,dy=-(ps[2][1]-ellipse.cy);
  const angle=-ellipse.angle;
  const x=dx*Math.cos(angle)+dy*Math.sin(angle);
  const y=-dx*Math.sin(angle)+dy*Math.cos(angle);
  close((x/ellipse.rx)**2+(y/ellipse.ry)**2,1,1e-10);
  const sum=Math.hypot(ps[2][0]-ps[0][0],ps[2][1]-ps[0][1])+Math.hypot(ps[2][0]-ps[1][0],ps[2][1]-ps[1][1]);
  close(sum,2*ellipse.rx,1e-10);
 }
});

test('Round24 new projects allow off-grid anchors, with guides on and transparency off',()=>{
 const d=newDoc();assert.equal(d.settings.snap,false);assert.equal(d.settings.grid,true);
 assert.equal(d.settings.exportGuides,true);assert.equal(d.settings.exportTransparent,false);
 const old=clone(d);old.settings.snap=true;old.settings.exportGuides=false;
 assert.equal(validateDoc(old).settings.snap,true);
 assert.equal(validateDoc(old).settings.exportGuides,false);
});

test('Round24 paper formats are finite and have exact expected ratios',()=>{
 const sizes={a3:420/297,a4:297/210,a5:210/148,letter:11/8.5,legal:14/8.5,tabloid:17/11,square:1,widescreen:16/9};
 const d=newDoc();for(const [key,aspect] of Object.entries(sizes)){
  const frame=pageRect({w:1200,h:800},key);assert.ok(frame);
  close(frame.width/frame.height,aspect,1e-9);
  d.settings.page=key;validateDoc(d);
 }
 d.settings.page='fake';assert.throws(()=>validateDoc(d),/Invalid document settings/);
 assert.equal(pageRect({w:1200,h:800},'fake'),null);
});

test('Round24 geometric display labels are strictly validated, independent of names and refs',()=>{
 const d=newDoc();const ids=[addPoint(d,[0,0]),addPoint(d,[1,1]),addPoint(d,[0,2])].map(o=>o.id);
 const ellipse=append(d,{type:'ellipse',refs:ids,displayLabel:'\\alpha',displayLabelMode:'latex'});
 assert.equal(validateDoc(clone(d)).objects.at(-1).displayLabel,'\\alpha');
 const tamper=v=>{const copy=clone(d);copy.objects.at(-1).displayLabel=v;return copy;};
 for(const value of [27,'a\u0000b','x'.repeat(1001)])assert.throws(()=>validateDoc(tamper(value)),/display label/);
 const bad=clone(d);bad.objects.at(-1).displayLabelMode='javascript';assert.throws(()=>validateDoc(bad),/display label format/);
 const custom=clone(d);custom.objects.at(-1).displayLabel='';validateDoc(custom);
 assert.deepEqual(ids,d.objects.at(-1).refs);
});

test('Round24 expanded plain-text fonts preserve strict import validation',()=>{
 const d=newDoc(),a=append(d,{type:'text',xy:[0,0],text:'Hello'});
 for(const fontFamily of ['Verdana, sans-serif','Trebuchet MS, sans-serif','Palatino Linotype, serif','Times New Roman, serif']){
  a.fontFamily=fontFamily;validateDoc(d);
 }
 a.fontFamily='url(https://invalid)';assert.throws(()=>validateDoc(d),/Invalid label font/);
});
