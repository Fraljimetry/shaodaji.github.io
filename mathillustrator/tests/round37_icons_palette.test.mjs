import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc, append, clone, validateDoc, upgradeRecoveredLegacyPalette} from '../src/model.mjs';

const oldPresets=[
 ['#3657ad','#b6c9f9'],['#172b4d','#e6eef9'],
 ['#263342','#d9e8f4'],['#3761b8','#b6c9f9'],
 ['#353e50','#d7e2f4'],['#1d3557','#ffffff']
];
test('Round37: recovered historical preset default pairs migrate to black without recoloring objects',()=>{
 for(const [stroke,fill] of oldPresets){
  const d=newDoc();d.settings.stroke=stroke;d.settings.fill=fill;
  const existing=append(d,{type:'point',xy:[0,0]});
  const before=clone(existing);
  assert.equal(upgradeRecoveredLegacyPalette(d),d);
  assert.equal(d.settings.stroke,'#000000');assert.equal(d.settings.fill,'#000000');
  assert.deepEqual(existing,before,'legacy drawn object keeps own color and identity');
  const next=append(d,{type:'segment',refs:[existing.id,existing.id]});
  assert.equal(next.style.stroke,'#000000');assert.equal(next.style.fill,'#000000');
  // Use a distinct pair of points for validated persistence rather than a degenerate segment.
  const valid=newDoc();valid.settings.stroke=stroke;valid.settings.fill=fill;
  append(valid,{type:'point',xy:[0,0]});upgradeRecoveredLegacyPalette(valid);
  assert.doesNotThrow(()=>validateDoc(clone(valid)));
 }
});
test('Round37: custom color settings and imported snapshots are not forcibly recolored',()=>{
 const d=newDoc();d.settings.stroke='#3b82f6';d.settings.fill='#ffffff';
 upgradeRecoveredLegacyPalette(d);assert.equal(d.settings.stroke,'#3b82f6');
 const p=append(d,{type:'point',xy:[1,2]});assert.equal(p.style.stroke,'#3b82f6');
 const recovered=clone(d);const imported=validateDoc(recovered);
 assert.deepEqual(imported.objects,recovered.objects);assert.equal(imported.settings.stroke,'#3b82f6');
});
test('Round37: authorized glyphs reflect construction semantics and preserve all other glyph snapshots',()=>{
 const source=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 const map=Object.fromEntries([...source.match(/const glyph=\{([\s\S]*?)\};/)[1].matchAll(/(\w+):'([^']+)'/g)].map(m=>[m[1],m[2]]));
 for(const m of source.matchAll(/glyph\.(\w+)='([^']+)'/g))map[m[1]]=m[2];
 const circleCount=key=>(map[key].match(/<circle/g)||[]).length;
 assert.equal(circleCount('polygon'),6,'Polygon glyph uses a six-sided example');
 assert.equal(circleCount('quadrilateral'),4,'Concave quadrilateral has four selection vertices');
 assert.equal(circleCount('ray'),2);assert.equal(circleCount('line'),2);assert.equal(circleCount('arrow'),2);
 assert.match(map.ray,/cx="12\.5" cy="11"/,'the second ray point is interior');
 assert.match(map.line,/cx="7\.5" cy="16\.5"/);assert.match(map.line,/cx="16\.5" cy="7\.5"/);
 assert.match(source,/viewBox="-1\.5 -1\.5 27 27"/,'all palette glyphs receive extra stroke clearance');
 // Signed cross product at four successive vertices must change sign (nonconvex).
 const q=[[3,4],[21,5],[12,11],[5,21]];
 const signs=q.map((b,i)=>{const a=q[(i+3)%4],c=q[(i+1)%4];return Math.sign((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]));});
 assert.ok(signs.includes(-1)&&signs.includes(1),'quadrilateral is visibly concave');
});
