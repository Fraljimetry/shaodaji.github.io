import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,geometricLine,geometricPoint,validateDoc,intersectCircles,command} from '../src/model.mjs';
import {generalCrossings,r50SourceShape} from '../src/geometry_round50.mjs';
import {compatibleObjects} from '../src/selection.mjs';
const p=(d,xy)=>append(d,{type:'point',xy});
const close=(a,b,e=1e-7)=>{assert.ok(a&&b,`Missing point ${a} or ${b}`);a.forEach((x,i)=>assert.ok(Math.abs(x-b[i])<e,`${a} should be ${b}`));};

test('Round 68: rotated and translated straight lines retain infinite supporting-line semantics',()=>{
 const d=newDoc(),a=p(d,[0,0]),b=p(d,[1,0]),center=p(d,[0,0]),shift=p(d,[0,10]),through=p(d,[6,8]);
 const original=append(d,{type:'line',refs:[a.id,b.id]});
 const rotated=append(d,{type:'transformCopy',refs:[original.id,center.id],transform:'rotate',amount:Math.PI/2});
 const translated=append(d,{type:'transformCopy',refs:[rotated.id,center.id,shift.id],transform:'translate',amount:0});
 const parallel=append(d,{type:'parallelThrough',refs:[through.id,translated.id]});
 const resolver=createResolver(d);
 assert.equal(geometricLine(translated,resolver),true);assert.equal(resolver.line(translated)?.domain,'infinite');
 assert.ok(Math.abs(resolver.line(translated).a[1]-10)<1e-7);
 assert.ok(Math.abs(resolver.line(parallel).d[0])<1e-7);
 close(generalCrossings(p(d,[0,10000]),rotated,createResolver(d))[0],[0,10000],1e-6);
 const constructed=command(d,'Parallel('+through.name+','+translated.name+')');
 assert.ok(constructed&&geometricLine(constructed,createResolver(d)));
 assert.doesNotThrow(()=>validateDoc(d));
});
test('Round 68: dilated transformed circles remain exact circles for constrained points, tangents and intersections',()=>{
 const d=newDoc(),o=p(d,[1,2]),rim=p(d,[3,2]),other=p(d,[8,2]),rim2=p(d,[6,2]);
 const circle=append(d,{type:'circle',refs:[o.id,rim.id]});
 const transformed=append(d,{type:'transformCopy',refs:[circle.id,o.id],transform:'dilate',amount:2});
 const constrained=append(d,{type:'pointOnObject',refs:[transformed.id],parameter:.125});
 const tangent=append(d,{type:'tangentCircle',refs:[other.id,transformed.id],branch:1});
 const second=append(d,{type:'circle',refs:[rim2.id,other.id]});
 const intersect=append(d,{type:'circleCircleIntersection',refs:[transformed.id,second.id],branch:1});
 const resolver=createResolver(d);
 assert.deepEqual(resolver.circle(transformed),{center:[1,2],radius:4});
 close(resolver.at(constrained.id),[1+4*Math.SQRT1_2,2+4*Math.SQRT1_2]);
 assert.ok(resolver.line(tangent));assert.ok(resolver.at(intersect.id));
 assert.equal(generalCrossings(constrained,transformed,resolver).length,1);
 assert.doesNotThrow(()=>validateDoc(d));
});
test('Round 68: point style compatibility includes derived and transformed points but not curves',()=>{
 const d=newDoc(),a=p(d,[0,0]),b=p(d,[1,0]);
 const center=append(d,{type:'midpoint',refs:[a.id,b.id]});
 const image=append(d,{type:'transformCopy',refs:[center.id,a.id],transform:'dilate',amount:2});
 const line=append(d,{type:'line',refs:[a.id,b.id]});
 const transformedLine=append(d,{type:'transformCopy',refs:[line.id,a.id],transform:'rotate',amount:.7});
 const resolver=createResolver(d);
 assert.equal(geometricPoint(image,resolver),true);
 assert.deepEqual(compatibleObjects([center,image,transformedLine],'pointSize',id=>resolver.object(id)).map(o=>o.id),[center.id,image.id]);
 const foot=command(d,'Foot('+image.name+','+line.name+')');
 assert.ok(foot&&geometricPoint(foot,createResolver(d)));
 image.pointLabel='Q';image.pointLabelMode='latex';image.style.pointSize=9;
 assert.doesNotThrow(()=>validateDoc(d));
 assert.equal(r50SourceShape(transformedLine,resolver,6).length,2);
});
test('Round 68: circles stay circles after rotation/reflection; degenerate scaling is not a circle',()=>{
 const d=newDoc(),o=p(d,[0,0]),rim=p(d,[4,0]),axisPoint=p(d,[2,0]),axis=append(d,{type:'line',refs:[o.id,axisPoint.id]});
 const circle=append(d,{type:'circle',refs:[o.id,rim.id]});
 const mirror=append(d,{type:'transformCopy',refs:[circle.id,axis.id],transform:'reflect',amount:0});
 const rotated=append(d,{type:'transformCopy',refs:[mirror.id,axisPoint.id],transform:'rotate',amount:Math.PI/2});
 const collapsed=append(d,{type:'transformCopy',refs:[circle.id,o.id],transform:'dilate',amount:0});
 const resolver=createResolver(d);close(resolver.circle(rotated).center,[2,-2]);assert.equal(resolver.circle(rotated).radius,4);
 assert.equal(resolver.circle(collapsed),null);
 assert.throws(()=>validateDoc(d),/Invalid transformation parameters/); // existing zero-dilation guard
 d.objects=d.objects.filter(x=>x.id!==collapsed.id);
 assert.doesNotThrow(()=>validateDoc(d));
});
