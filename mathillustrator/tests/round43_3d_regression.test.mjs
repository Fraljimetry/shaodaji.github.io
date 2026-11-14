import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,parse3DRangeExpression,project3DScene,sample3DPlot,validate3D,meshCacheStats,MAX_3D_FACES,create3DProjectionTask} from '../src/plot3d.mjs';

const copy = value=>structuredClone(value);
const litScene=()=>{const s=newScene3D();add3DPlot(s,'surface3d',['sin(x)*cos(y)']);s.options.detail=24;return s;};
test('Round43 strict pi/e 3D fields reject hostile input, infinities and out-of-range',()=>{
 assert.ok(Math.abs(parse3DRangeExpression('2pi')-2*Math.PI)<1e-10);
 assert.ok(Math.abs(parse3DRangeExpression('e/2')-Math.E/2)<1e-10);
 assert.equal(parse3DRangeExpression('1.5e2'),150);
 for(const input of ['','2/0','sqrt(-1)','alert(1)','x+1','2**3','10001','1e9','0/0'])assert.throws(()=>parse3DRangeExpression(input),undefined,input);
});
test('Round43 world-fixed lighting is invariant under camera yaw/pitch, not object placement',()=>{
 const s=litScene();s.options.cube=false;
 const original=project3DScene(s,700,500).faces.map(face=>face.shade).sort((a,b)=>a-b);
 assert.ok(original.length>600);
 s.options.yaw=180;s.options.pitch=-80;
 const moved=project3DScene(s,700,500).faces.map(face=>face.shade).sort((a,b)=>a-b);
 assert.deepEqual(original,moved);
 s.options.lighting=false;assert.ok(project3DScene(s,700,500).faces.every(face=>face.shade===1));
});
test('Round43 3D axes and floor grid can be independently enabled without changing geometry',()=>{
 const s=litScene();const plain=project3DScene(s,640,480);
 assert.equal(plain.axesLines.length,0);assert.equal(plain.gridLines.length,0);
 s.options.grid=true;s.options.axes=true;const withGuides=project3DScene(s,640,480);
 assert.equal(withGuides.gridLines.length,18);assert.equal(withGuides.axesLines.length,3);
 assert.equal(withGuides.faces.length,plain.faces.length);
 for(const key of ['grid','axes']){const bad=copy(s);bad.options[key]='true';assert.throws(()=>validate3D(bad));}
});
test('Round43 locks preserve legacy projects and survive JSON/schema roundtrips',()=>{
 const s=newScene3D();const a=add3DPlot(s,'surface3d',['x*y']);assert.equal(a.locked,false);
 a.locked=true;validate3D(s);assert.equal(JSON.parse(JSON.stringify(s)).plots[0].locked,true);
 delete a.locked;validate3D(s); // legacy: optional lock state
 a.locked=1;assert.throws(()=>validate3D(s));
});
test('Round43 diverse mixed scenes stay within global 3D budgets and never share malformed primitives',()=>{
 const s=newScene3D();add3DPlot(s,'surface3d',['sin(x)*cos(y)']);add3DPlot(s,'parametric3d',['cos(u)*sin(v)','sin(u)*sin(v)','cos(v)']);add3DPlot(s,'implicit3d',['x^2+y^2+z^2=3']);s.options.detail=65;
 const render=project3DScene(s,880,620);
 assert.ok(render.faces.length>1000&&render.faces.length<=MAX_3D_FACES);
 assert.ok(render.faces.every(face=>face.points.every(point=>point.every(Number.isFinite))&&Number.isFinite(face.shade)));
 assert.equal(render.primitives.filter(p=>p.kind==='face').length,render.faces.length);
 const job=create3DProjectionTask(copy(s),880,620);job.step(.1);job.cancel();assert.equal(job.result,null);assert.equal(job.step().cancelled,true);
 assert.ok(meshCacheStats().estimatedBytes<=meshCacheStats().limitBytes);
});

test('Round43 oscillatory implicit surface is not silently cut halfway at high detail',()=>{
 const s=newScene3D(),complex='cos(x+y+z)=cos(x)+cos(y)+cos(z)';
 add3DPlot(s,'implicit3d',[complex]);s.options.detail=96;
 const result=project3DScene(s,900,650);
 assert.ok(!result.limited, 'Single oscillatory implicit surface should be fully sampled');
 assert.ok(result.faces.length>40000,'High detail must exceed the old 24k triangle cap');
 assert.ok(result.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))));
});
test('Round43 three intricate implicit surfaces receive fair sampling and all remain visible',()=>{
 const s=newScene3D(),expr='cos(x+y+z)=cos(x)+cos(y)+cos(z)';s.options.detail=96;
 for(const color of ['#ff0000','#00ff00','#0000ff'])add3DPlot(s,'implicit3d',[expr]).color=color;
 const r=project3DScene(s,900,650);
 assert.equal(r.limited,false,'All complete surfaces fit at adaptive resolution');
 assert.ok(r.faces.length>50000&&r.faces.length<=MAX_3D_FACES);
 assert.deepEqual(new Set(r.faces.map(face=>face.color)),new Set(['#ff0000','#00ff00','#0000ff']));
 assert.ok(r.evaluations<=230000);
});
