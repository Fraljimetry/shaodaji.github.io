import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutNodeLabel,nodeBox,edgeBetweenBoxes} from '../src/diagram_layout.mjs';
import {fitSceneView,formatCoordinate} from '../src/geometry.mjs';
import {createAnchorIndex} from '../src/anchor_index.mjs';
import {newDoc,addPoint,append,createResolver} from '../src/model.mjs';

test('Cut11: long and explicit-multiline semantic labels wrap without truncation',()=>{
 const text='A very long mathematical node description that cannot possibly fit into a single diagram node rectangle while preserving its text';
 const layout=layoutNodeLabel(text,17);
 assert.ok(layout.lines.length>=3,layout.lines);
 assert.equal(layout.lines.join('').replace(/\s/g,''),text.replace(/\s/g,''));
 assert.ok(layout.width<=340);
 assert.ok(nodeBox(text,17).height>nodeBox('A',17).height);
 const paragraphs=layoutNodeLabel('first\n\nlast',17);
 assert.deepEqual(paragraphs.lines,['first','','last']);
});
test('Cut11: multi-line node box defines correct semantic arrow clearance',()=>{
 const a=nodeBox('First\nSecond\nThird',20),b=nodeBox('B',20);
 assert.ok(a.height>b.height);
 const ends=edgeBetweenBoxes([0,0],[180,0],a,b);
 assert.ok(ends&&ends.start[0]>=a.width/2&&ends.end[0]<=180-b.width/2);
});
test('Cut11: coordinate summaries retain sub-millimetric/nonzero values and sign',()=>{
 assert.notEqual(formatCoordinate(1e-9),'0');
 assert.notEqual(formatCoordinate(-1e-9),'0');
 assert.equal(formatCoordinate(-0),'0');
 assert.equal(formatCoordinate(0),'0');
 assert.ok(formatCoordinate(1e8).includes('e'));
});
test('Cut11: fit includes pixel-sized diagram labels and restores finite viewport',()=>{
 const doc=newDoc();doc.settings.showLabels=false;
 append(doc,{type:'node',xy:[-5,0],text:'A long left-hand diagram object description',fontSize:20});
 append(doc,{type:'node',xy:[5,0],text:'A long right-hand diagram object description',fontSize:20});
 const size={w:640,h:420};const view=fitSceneView(doc,createResolver(doc),size);
 assert.ok(Number.isFinite(view.scale)&&Number.isFinite(view.cx)&&Number.isFinite(view.cy));
 for(const o of doc.objects){const b=nodeBox(o.text,o.fontSize),x=(o.xy[0]-view.cx)*view.scale+size.w/2;
  assert.ok(x-b.width/2>=8&&x+b.width/2<=size.w-8,{x,b,view});}
});
test('Cut11: spatial index rejects hidden and transparent anchors while selecting nearest visible point',()=>{
 const doc=newDoc(),visible=addPoint(doc,[0,0]),hidden=addPoint(doc,[0.03,0]);hidden.hidden=true;
 const transparent=addPoint(doc,[0.01,0]);transparent.style.opacity=0;
 const idx=createAnchorIndex(doc,createResolver(doc),{cx:0,cy:0,scale:100},{w:500,h:400});
 assert.equal(idx.nearest(250,200,12)?.id,visible.id);
 assert.equal(idx.hit(250,200)?.id,visible.id);
 assert.equal(idx.nearest(400,350,12),null);
});
test('Cut11: spatial index respects point radius, overlap order, and middle dependency',()=>{
 const doc=newDoc();const a=addPoint(doc,[0,0]),b=addPoint(doc,[0,0]);
 b.style.pointSize=50;
 append(doc,{type:'midpoint',refs:[a.id,b.id]});
 const idx=createAnchorIndex(doc,createResolver(doc),{cx:0,cy:0,scale:100},{w:500,h:400});
 assert.equal(idx.hit(280,200)?.id,b.id); // point radius 50 reaches beyond ordinary hit distance
 assert.equal(idx.hit(250,200)?.id,'o3'); // later midpoint is topmost when exactly overlapping
});

test('Cut11: plot detail gives a deterministic explicit resolution/performance choice',async()=>{
 const {sampleExplicitPlot}=await import('../src/plot.mjs');
 const evals=[];
 for(const quality of ['fast','balanced','detailed']){
  const result=sampleExplicitPlot(x=>x,px=>px/100,y=>y,800,600,{quality});
  evals.push(result.evaluations);
  assert.equal(result.limited,false);
  assert.ok(result.segments.length>0);
 }
 assert.ok(evals[0]<evals[1]&&evals[1]<evals[2],evals);
});
test('Cut11: pathological function sampling respects an explicit evaluation budget',async()=>{
 const {sampleExplicitPlot}=await import('../src/plot.mjs');
 const r=sampleExplicitPlot(x=>Math.tan(x*10000),px=>(px-500)/50,y=>300-y*50,1000,600,{quality:'detailed',maxEvaluations:100});
 assert.ok(r.limited);assert.equal(r.evaluations,100);
 assert.throws(()=>sampleExplicitPlot(x=>x,px=>px,y=>y,800,600,{quality:'guess'}),/quality/);
});
test('Cut11: backward compatible plot setting and invalid detail rejected',async()=>{
 const {validateDoc,PRESETS}=await import('../src/model.mjs');
 const d=newDoc();assert.equal(d.settings.plotQuality,'balanced');
 assert.equal(PRESETS['Analysis / plots'].plotQuality,'detailed');
 delete d.settings.plotQuality;
 const recovered=validateDoc(d);assert.equal(recovered.settings.plotQuality,'balanced');
 recovered.settings.plotQuality='superfast';assert.throws(()=>validateDoc(recovered),/Plot detail/);
});
