import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleImplicitColors,rangeColorRGB,scalarColorRGB,parseImplicit} from '../src/plot_modes.mjs';
import {rampColor} from '../src/plot3d.mjs';
import {compileRegionCondition,inRegion} from '../src/region_condition.mjs';
import {newDoc,append,validateDoc,createResolver,geometricLine} from '../src/model.mjs';
import {captureObjectSelection,pasteObjectSelection} from '../src/object_clipboard.mjs';
import {applyConstructionExpression} from '../src/construction_expression.mjs';
import {geometryPickRank,rankGeometryHits} from '../src/geometry_pick.mjs';
import {compatibleObjects} from '../src/selection.mjs';
import {recognizedPlotGeometry} from '../src/plot_geometry.mjs';
const region={xMin:-2,xMax:2,yMin:-1,yMax:1};
const pixel=(r,x,y)=>Array.from(r.rgba.slice((y*r.width+x)*4,(y*r.width+x+1)*4));
const hex=rgba=>'#'+rgba.slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');
test('implicit range colors match the shared 3D ramp, including axis orientation and constant values',()=>{
 const r=sampleImplicitColors(parseImplicit('x=1'),region,{quality:'fast'});
 assert.equal(r.width,128);assert.equal(r.height,64);assert.equal(r.evaluations,8192);assert.equal(r.limited,false);
 assert.equal(hex(pixel(r,0,0)),rampColor(r.min,r.min,r.max));assert.equal(hex(pixel(r,127,63)),rampColor(r.max,r.min,r.max));
 assert.deepEqual(pixel(r,0,0),[239,68,68,255]);assert.deepEqual(pixel(r,127,63),[59,130,246,255]);
 const y=sampleImplicitColors(parseImplicit('y'),region,{quality:'fast'});
 assert.equal(hex(pixel(y,0,0)),'#3b82f6');assert.equal(hex(pixel(y,0,63)),'#ef4444');
 const c=sampleImplicitColors(parseImplicit('3'),region,{quality:'fast'});
 assert.deepEqual(pixel(c,10,10),[168,85,247,255]);assert.equal(c.min,3);assert.equal(c.max,3);
});
test('strict inequality masks samples and excludes them from scalar extrema; undefined values remain transparent',()=>{
 const cond=compileRegionCondition('x>0',2);
 const r=sampleImplicitColors(parseImplicit('x'),region,{quality:'fast',includes:(x,y)=>inRegion(cond,x,y)});
 assert.equal(r.evaluations,4096);assert.ok(r.min>0);assert.equal(pixel(r,0,0)[3],0);assert.deepEqual(pixel(r,64,0),[239,68,68,255]);
 const invalid=sampleImplicitColors(parseImplicit('sqrt(x)'),region,{quality:'fast'});
 assert.equal(pixel(invalid,0,0)[3],0);assert.equal(pixel(invalid,127,0)[3],255);
 const none=sampleImplicitColors(()=>Infinity,region,{quality:'fast'});assert.equal(none.min,null);assert.equal(none.max,null);assert.ok(none.rgba.every(v=>v===0));
 const empty=sampleImplicitColors(()=>1,region,{quality:'fast',includes:()=>false});assert.equal(empty.evaluations,0);assert.ok(empty.rgba.every(v=>v===0));
});
test('color range stays finite for extreme signed values and obeys bounded sampling on narrow regions',()=>{
 assert.deepEqual(rangeColorRGB(-1e308,-1e308,1e308),[239,68,68]);assert.equal(rampColor(0,-1e308,1e308),'#a855f7');assert.equal(rampColor(1e308,-1e308,1e308),'#3b82f6');
 const r=sampleImplicitColors((x)=>x<0?-1e308:1e308,region,{quality:'fast'});assert.deepEqual(pixel(r,0,0),[239,68,68,255]);assert.deepEqual(pixel(r,127,0),[59,130,246,255]);
 for(const bounds of [region,{xMin:0,xMax:1e-300,yMin:-1e6,yMax:1e6},{xMin:-1e6,xMax:1e6,yMin:0,yMax:1e-300}]){
  const b=sampleImplicitColors(()=>0,bounds,{quality:'detailed',maxEvaluations:100});assert.ok(b.limited);assert.ok(b.width>=1&&b.height>=1&&b.width*b.height<=100);assert.equal(b.evaluations,b.width*b.height);
 }
 assert.throws(()=>sampleImplicitColors(()=>1,{...region,xMax:region.xMin}));assert.throws(()=>sampleImplicitColors(()=>1,region,{maxEvaluations:0}));
});
test('legacy and new implicit plots validate, survive JSON and retain range through algebra edits',()=>{
 const doc=newDoc(),o=append(doc,{type:'implicit',expr:'x=1'});
 validateDoc(doc);assert.equal(o.region,undefined);assert.equal(o.colorRange,undefined);
 o.colorRange=true;o.region={...region};o.regionCondition='x^2+y^2<4';validateDoc(doc);
 const restored=validateDoc(JSON.parse(JSON.stringify(doc)));assert.deepEqual(restored.objects[0],o);
 applyConstructionExpression(restored,o.id,'Implicit("x=2")');const updated=restored.objects[0];assert.equal(updated.expr,'x=2');assert.deepEqual(updated.region,region);assert.equal(updated.colorRange,true);assert.equal(updated.regionCondition,o.regionCondition);
 assert.equal(geometricLine(updated,createResolver(restored)),true);
 const [copyId]=pasteObjectSelection(restored,captureObjectSelection(restored,[updated.id]));const copy=restored.objects.find(q=>q.id===copyId);assert.deepEqual(copy.region,region);assert.equal(copy.regionCondition,updated.regionCondition);assert.equal(copy.colorRange,true);validateDoc(restored);
 for(const mutate of [q=>delete q.region,q=>q.region.xMin=3,q=>q.region.yMax=Infinity,q=>q.regionCondition='x<=1',q=>q.colorRange='true']){
  const copy=structuredClone(doc);mutate(copy.objects[0]);assert.throws(()=>validateDoc(copy));
 }
 updated.colorRange=false;validateDoc(restored);assert.deepEqual(updated.region,region);assert.equal(updated.regionCondition,o.regionCondition);
});

test('implicit scalar schemes and fixed resolution validate, persist and preserve existing defaults',()=>{
 const fixed=sampleImplicitColors(parseImplicit('x'),region,{resolution:64,mode:'bands',maxEvaluations:1000000});
 assert.equal(fixed.width,64);assert.equal(fixed.height,32);assert.equal(fixed.limited,false);
 assert.deepEqual(pixel(fixed,0,0),[239,68,68,255]);assert.deepEqual(pixel(fixed,63,0),[59,130,246,255]);
 const sign=sampleImplicitColors(parseImplicit('x'),region,{resolution:64,mode:'sign',maxEvaluations:1000000});
 assert.deepEqual(pixel(sign,0,0),[59,130,246,255]);assert.deepEqual(pixel(sign,63,0),[239,68,68,255]);
 const center=scalarColorRGB(0,-1,1,'diverging');assert.deepEqual(center,[255,255,255]);
 const doc=newDoc(),o=append(doc,{type:'implicit',expr:'x+y=0',colorRange:true,region:{...region},colorMode:'viridis',resolution:640});
 validateDoc(doc);
 const restored=validateDoc(JSON.parse(JSON.stringify(doc))).objects[0];
 assert.equal(restored.colorMode,'viridis');assert.equal(restored.resolution,640);
 for(const mutate of [q=>q.objects[0].colorMode='phase',q=>q.objects[0].resolution=31,q=>q.objects[0].resolution=2048]){const copy=JSON.parse(JSON.stringify(doc));mutate(copy);assert.throws(()=>validateDoc(copy));}
});

test('raster fills remain below strokes in selection and never expose inapplicable bulk style controls',()=>{
 const objects=[{id:'implicit',type:'implicit',colorRange:true},{id:'complex',type:'domainColoring'},{id:'vector',type:'vectorField',colorRange:true},{id:'circle',type:'circle'},{id:'curve',type:'implicit'}];
 const lookup=id=>objects.find(o=>o.id===id);
 assert.ok(geometryPickRank(objects[0])>geometryPickRank(objects[3]));assert.ok(geometryPickRank(objects[1])>geometryPickRank(objects[3]));
 assert.deepEqual(rankGeometryHits({elements:['implicit','complex','circle'],getObject:lookup}),['circle','implicit','complex']);
 assert.deepEqual(compatibleObjects(objects,'stroke').map(o=>o.id),['circle','curve']);
 assert.deepEqual(compatibleObjects(objects,'width').map(o=>o.id),['vector','circle','curve']);
 assert.equal(compatibleObjects(objects,'opacity').length,5);
});
test('scheduled finding: implicit line coefficients preserve finite anchors and directions at tiny and huge scales',()=>{
 // 1e200 is rejected as a literal by the plot parser; repeated allowed factors
 // make a genuinely admissible large-coefficient equation.
 const huge=Array(25).fill('1e8').join('*');
 for(const factor of ['1e-200',huge,'1e-300',Array(38).fill('1e8').join('*')]){
  const expression=`(${factor})*x=(${factor})`;const doc=newDoc();const obj=append(doc,{type:'implicit',expr:expression});validateDoc(doc);
  assert.equal(parseImplicit(expression)(1,0),0);const line=recognizedPlotGeometry(obj);assert.equal(line.kind,'line');assert.equal(line.a[0],1);assert.equal(line.a[1],0);assert.equal(Math.abs(line.d[0]),0);assert.equal(line.d[1],1);
  const resolver=createResolver(doc);assert.equal(resolver.line(obj).a[0],1);
 }
 const diagonal=recognizedPlotGeometry({type:'implicit',expr:'1e-200*x+1e-200*y=2e-200'});assert.ok(diagonal.a.every(v=>Math.abs(v-1)<1e-14));
 assert.equal(recognizedPlotGeometry({type:'implicit',expr:'1e-300*x=1e308'}),null,'reject an unrepresentable anchor');
});

test('sign and diverging colors retain the mathematical zero at every scale',()=>{
 for(const scale of [Number.MIN_VALUE,1e-300,1e-20,1,1e308]){
  for(const mode of ['sign','diverging']){
   assert.deepEqual(scalarColorRGB(-scale,-scale,scale,mode),[59,130,246]);
   assert.deepEqual(scalarColorRGB(0,0,scale,mode),[255,255,255]);
   assert.deepEqual(scalarColorRGB(-0,-scale,0,mode),[255,255,255]);
   assert.deepEqual(scalarColorRGB(scale,0,scale,mode),[239,68,68]);
   assert.deepEqual(scalarColorRGB(-scale,-scale,0,mode),[59,130,246]);
  }
 }
 assert.deepEqual(scalarColorRGB(1.5,0,3,'diverging'),[247,162,162]);
 assert.deepEqual(scalarColorRGB(3,3,3,'diverging'),[239,68,68]);
});
test('all approved palettes and legacy Heat map persist; scalar and complex raster maxima agree',()=>{
 const doc=newDoc();
 for(const mode of ['range','diverging','grayscale','inferno','rainbow','viridis','sign','bands','heat']){
  const o=append(doc,{type:'implicit',expr:'x+y',region,colorRange:true,colorMode:mode,resolution:32});
  const out=sampleImplicitColors(parseImplicit(o.expr),region,{mode,resolution:32});
  assert.equal(out.rgba.length,32*16*4);assert.ok(out.rgba.every(Number.isFinite));
 }
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(doc))),doc);
 assert.deepEqual(scalarColorRGB(0,0,1,'inferno'),[0,0,4]);assert.deepEqual(scalarColorRGB(1,0,1,'inferno'),[252,255,164]);
 assert.deepEqual(scalarColorRGB(0,0,1,'rainbow'),[91,33,182]);assert.deepEqual(scalarColorRGB(1,0,1,'rainbow'),[239,68,68]);
 const square={xMin:-1,xMax:1,yMin:-1,yMax:1};
 const full=sampleImplicitColors(x=>x,square,{resolution:1536,maxEvaluations:1536**2});
 assert.equal(full.limited,false);assert.equal(full.width,1536);assert.equal(full.height,1536);assert.equal(full.evaluations,1536**2);assert.equal(full.rgba.length,4*1536**2);
});

test('UI palette catalogs and saved-project schema admit the same modes',async()=>{
 const {IMPLICIT_COLOR_SCHEMES,IMPLICIT_COLOR_MODES,DOMAIN_COLOR_SCHEMES,DOMAIN_COLOR_MODES}=await import('../src/plot_modes.mjs');
 const {readFileSync}=await import('node:fs');
 const schema=JSON.parse(readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
 const defs=schema.$defs.object;
 const sorted=xs=>[...xs].sort();
 const implicit=defs.allOf.find(a=>a.if?.properties?.type?.const==='implicit'&&a.then?.properties?.colorMode).then.properties.colorMode.enum;
 const complex=defs.allOf.find(a=>a.if?.properties?.type?.const==='domainColoring'&&a.then?.properties?.colorMode).then.properties.colorMode.enum;
 assert.deepEqual(sorted(implicit),sorted(IMPLICIT_COLOR_MODES));assert.deepEqual(sorted(complex),sorted(DOMAIN_COLOR_MODES));
 assert.deepEqual(sorted(schema.$defs.scene3d.properties.plots.items.properties.colorMode.enum),sorted([...DOMAIN_COLOR_MODES,'solid']));
 assert.equal(IMPLICIT_COLOR_SCHEMES.length,8);assert.equal(DOMAIN_COLOR_SCHEMES.length,6);
});
