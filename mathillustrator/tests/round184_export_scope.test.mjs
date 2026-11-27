import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('export menu offers exactly the six maintained formats, no legacy placeholders',()=>{
 const block=app.match(/function setupExport\(\)\{[\s\S]*?const opts=(\[[^;]+);/);
 assert.ok(block,'export options are defined inside setupExport');
 const formats=[...block[1].matchAll(/\['([^']+)','([^']+)',/g)].map(m=>m[2]);
 assert.deepEqual(formats,['svg','png','jpeg','webp','tikzcd','json']);
 for(const old of ['TikZ / PGF','PDF','Asymptote','GIF / video']) assert.ok(!block[1].includes(`['${old}'`),old);
});

import {imageExportState,isolatedRenderStatus,projectedArrow} from '../src/export_fidelity.mjs';
test('image export captures immutable settings and detects camera, viewport and dialog changes',()=>{
 const doc={settings:{background:'#ffffff',exportScale:2,exportTransparent:false,exportRegion:'viewport',page:'infinite'},scene3d:{options:{yaw:1,pitch:2,zoom:1}}},view={cx:0,cy:0,scale:48},size={w:800,h:600};
 const state=()=>imageExportState(doc,view,size,1,2,3),initial=state();
 doc.settings.exportTransparent=true;assert.equal(initial.transparent,false);assert.notEqual(state().signature,initial.signature);
 doc.settings.exportTransparent=false;assert.equal(state().signature,initial.signature);
 doc.scene3d.options.yaw=10;assert.notEqual(state().signature,initial.signature);doc.scene3d.options.yaw=1;
 size.w++;assert.notEqual(state().signature,initial.signature);size.w--;
 assert.notEqual(imageExportState(doc,view,size,1,2,4).signature,initial.signature);
});
test('export budget status is isolated from editor state even on failure',()=>{
 let limited=true;const run=fn=>isolatedRenderStatus(()=>limited,v=>limited=v,fn);
 assert.deepEqual(run(()=>42),{value:42,limited:false});assert.equal(limited,true);
 assert.throws(()=>run(()=>{throw Error('render failed');}),/render failed/);assert.equal(limited,true);
 limited=false;assert.deepEqual(run(()=>{limited=true;}),{value:undefined,limited:true});assert.equal(limited,false);
});
test('projected vector arrow geometry is shared and preserves width and cutoff',()=>{
 assert.equal(projectedArrow({start:[0,0],end:[.49,0]}),null);
 assert.deepEqual(projectedArrow({start:[0,0],end:[10,0]}),{a:[0,0],b:[10,0],width:1.5,left:[4,-2.4000000000000004],right:[4,2.4000000000000004]});
 const arrow=projectedArrow({start:[0,0],end:[0,10],width:6});assert.equal(arrow.width,6);assert.equal(arrow.left[1],-2);assert.equal(arrow.right[1],-2);
});

test('3D projected arrow vertices exclude painter depth from SVG polygon coordinates',()=>{
 const arrow=projectedArrow({start:[400,300,-.8],end:[410,300,.9]});
 assert.deepEqual(arrow.a,[400,300]);
 assert.deepEqual(arrow.b,[410,300]);
 const vertices=[arrow.b,arrow.left,arrow.right];
 assert.ok(vertices.every(p=>p.length===2&&p.every(Number.isFinite)));
 assert.equal(vertices.map(p=>p.join(',')).join(' ').split(/[ ,]+/).length,6);
 assert.deepEqual(arrow,projectedArrow({start:[400,300],end:[410,300]}));
});
