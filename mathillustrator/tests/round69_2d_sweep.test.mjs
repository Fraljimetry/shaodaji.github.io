import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {plotArtifactKey} from '../src/plot_cache.mjs';
import {parseImplicit, sampleImplicitPlot, sampleParametricPlot, parseParametric, sampleVectorField} from '../src/plot_modes.mjs';
import {sampleExplicitPlot, plotPath} from '../src/plot.mjs';
import {polygonArea} from '../src/geometry_measurements.mjs';

const implicit = (expression) => sampleImplicitPlot(parseImplicit(expression),
  px => (px - 100.71) / 100, py => (100.59 - py) / 100,
  200, 200, {quality:'balanced',cellPx:12,maxEvaluations:80000});

test('Round69: implicit 1/x and displaced reciprocal poles never masquerade as zero contours', () => {
  assert.equal(implicit('1/x').segments.length,0, '1/x has no zero set');
  assert.equal(implicit('1/(x-0.14)').segments.length,0, 'Shifted pole is not a root');
  assert.ok(implicit('x').segments.length>4, 'Genuine line remains visible');
  assert.ok(implicit('x^2+y^2=1').segments.length>10, 'Real circle is retained');
  assert.ok(implicit('x*y=0').segments.length>4, 'Crossing axes remain visible');
});

test('Round69: 2D sampling retains budgets, finite SVG, and a real crossing near a pole',()=>{
  const fn=parseImplicit('1/x=2');
  const result=sampleImplicitPlot(fn,x=>(x-100.71)/100,y=>(100.59-y)/100,200,200,{cellPx:12,maxEvaluations:80000});
  assert.ok(result.segments.length>3,'True reciprocal level set x=1/2 must survive pole rejection');
  assert.ok(result.segments.every(seg=>seg.every(p=>p.every(Number.isFinite))));
  assert.equal(result.limited,false);
  const limited=sampleImplicitPlot(parseImplicit('x'),x=>x,y=>y,600,600,{cellPx:6,maxEvaluations:500});
  assert.equal(limited.limited,true);assert.deepEqual(limited.segments,[]);
  const explicit=sampleExplicitPlot(x=>1/x,x=>(x-99)/30,y=>100-y*30,200,200);
  assert.ok(!plotPath(explicit.segments).includes('Infinity'));
  const param=sampleParametricPlot(parseParametric('cos(t)','sin(t)','t'),0,Math.PI*2,p=>p.map(x=>x*100));
  assert.ok(param.segments.length>0);
  assert.ok(sampleVectorField(()=>[1,1],{xMin:-1,xMax:1,yMin:-1,yMax:1}).arrows.length>0);
});

test('Round69: renderer groups hit-target visibility/export guards for transformed lines',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  assert.match(app,/if\(!exporting&&sty\.opacity>0&&\(\[[^\n]+\.includes\(o\.type\)\|\|o\.type==='transformCopy'&&geometricLine\(o,resolver\)\)\)/);
  const plot={type:'parametric',xExpr:'cos(t)',yExpr:'sin(t)',parameter:'t',tMin:0,tMax:6};
  const key=o=>plotArtifactKey(o,{}, {},{cx:0,cy:0,scale:48},{w:800,h:600},10000);
  assert.notEqual(key(plot),key({...plot,parameter:'u'}),'Parametric plot cache must include the selected parameter');
});

test('Round69: polygon area rejects self-touching polygons but preserves concave outlines',()=>{
  assert.equal(polygonArea([[0,0],[4,0],[2,2],[4,4],[0,4]]),12);
  assert.equal(polygonArea([[0,0],[2,2],[0,2],[2,0]]),null);
});

test('Implicit refinement rejects undefined interior samples even after bracket contraction',()=>{
 const result=sampleImplicitPlot(x=>x===0.375?NaN:x-0.3,p=>p/12,p=>p/12,12,12);
 assert.equal(result.segments.length,0);
 const good=sampleImplicitPlot(x=>x-0.3,p=>p/12,p=>p/12,12,12);
 assert.equal(good.segments.length,1);
});
test('Parametric quality rejects inherited property names',()=>{
 for(const quality of ['constructor','__proto__','toString'])
  assert.throws(()=>sampleParametricPlot(t=>[t,t],0,1,p=>p,{quality}),/Invalid plotting detail/);
});
