import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,append,clone,validateDoc} from '../src/model.mjs';
import {sampleDomainColors,MAX_DOMAIN_RESOLUTION,MAX_DOMAIN_PIXELS,sampleImplicitPlot,sampleVectorField,sampleParametricPlot} from '../src/plot_modes.mjs';
import {createPlotCache} from '../src/plot_cache.mjs';
const square={xMin:-2,xMax:2,yMin:-2,yMax:2};
const fn=(x,y)=>[x,y];
test('R133 domain-coloring 1000/1001/1024 boundary has full data, no blank',()=>{
 for(const resolution of [1000,1001,1024]){
  const result=sampleDomainColors(fn,square,{resolution,maxEvaluations:MAX_DOMAIN_PIXELS});
  assert.equal(result.limited,false);assert.equal(result.width,resolution);assert.equal(result.height,resolution);
  assert.equal(result.evaluations,resolution*resolution);assert.equal(result.rgba.length,4*resolution*resolution);
  assert.equal(result.rgba[3],255);
 }
});
test('R133 domain bounds, rectangular aspect, budget failure and no clipped implicit raster',()=>{
 assert.equal(MAX_DOMAIN_RESOLUTION,1536);
 const skinny=sampleDomainColors(fn,{...square,yMax:0},{resolution:1200,maxEvaluations:MAX_DOMAIN_PIXELS});
 assert.equal(skinny.width,1200);assert.equal(skinny.height,600);assert.equal(skinny.limited,false);
 const tall=sampleDomainColors(fn,{...square,yMax:6},{resolution:1200,maxEvaluations:MAX_DOMAIN_PIXELS});
 assert.equal(tall.height,1536);assert.equal(tall.limited,false);
 assert.equal(sampleDomainColors(fn,square,{resolution:1001,maxEvaluations:1000000}).limited,true);
 assert.throws(()=>sampleDomainColors(fn,square,{resolution:1537,maxEvaluations:MAX_DOMAIN_PIXELS}));
});
test('R133 schema and import match UI ceiling and old projects',()=>{
 const schema=JSON.parse(readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
 assert.equal(schema.$defs.object.properties.resolution.maximum,MAX_DOMAIN_RESOLUTION);
 for(const resolution of [32,768,1024,1200,1536]){
  const doc=newDoc();append(doc,{type:'domainColoring',expr:'z',region:square,resolution,colorMode:'phase'});
  assert.equal(validateDoc(clone(doc)).objects.at(-1).resolution,resolution);
 }
 const doc=newDoc();append(doc,{type:'domainColoring',expr:'z',region:square,resolution:1537});assert.throws(()=>validateDoc(doc));
});
test('R133 large raster cache retained and LRU still bounded',()=>{
 const cache=createPlotCache({maxCharacters:12_000_000});const big='x'.repeat(2_000_000);
 assert.equal(cache.get('a',()=>big).length,big.length);
 assert.equal(cache.get('a',()=>{throw Error('recomputed raster');}),big);
 for(let i=0;i<8;i++)cache.get('k'+i,()=>big);
 assert.ok(cache.stats().characters<=12_000_000);
});
test('R133 other graphing budget thresholds are explicit, not false success',()=>{
 const field=sampleVectorField(()=>[1,0],square,{density:40,maxEvaluations:100});assert.equal(field.limited,true);
 const implicit=sampleImplicitPlot(()=>1,x=>x,y=>y,3000,2000,{cellPx:8,maxEvaluations:20000});assert.equal(implicit.limited,true);
 assert.throws(()=>sampleParametricPlot(()=>[0,0],0,1,p=>p,{maxEvaluations:99}));
});
