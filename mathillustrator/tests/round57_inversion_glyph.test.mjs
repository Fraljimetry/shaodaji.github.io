import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('inversion glyph has two widely spaced mathematically inverse points and no center marker',()=>{
 assert.match(source,/const inversionGlyphCenter=\[8,9\], inversionGlyphFar=\[21\.2,9\]/);
 assert.match(source,/glyph\.circleInversion=glyphCrossSectionCircle\(\.\.\.inversionGlyphCenter,8\)/);
 const c=[8,9], far=[21.2,9],R=8,d2=(far[0]-c[0])**2+(far[1]-c[1])**2;
 const near=c.map((v,i)=>v+R**2/d2*(far[i]-v));
 const nd=Math.hypot(near[0]-c[0],near[1]-c[1]),fd=Math.sqrt(d2);
 assert.ok(Math.abs(nd*fd-R*R)<1e-9);
 assert.ok(nd<R && fd>R);
 assert.ok(Math.hypot(near[0]-far[0],near[1]-far[1])>8);
 assert.ok(far.every(v=>v+2.8<=24));
 assert.ok(c.every(v=>v-R>=0));
 assert.doesNotMatch(source,/glyph\.circleInversion=[^;]+glyphDots\(\[\[8,9\]/);
});
