import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');

test('inversion glyph contains two mathematically inverse points and no center marker',()=>{
  assert.match(source,/const inversionGlyphInsideX=13\.2;/);
  assert.match(source,/const inversionGlyphOutsideX=8\.2\+8\*\*2\/5;/);
  assert.match(source,/glyph\.circleInversion=glyphCrossSectionCircle\(8\.2,12,8\)/);
  assert.match(source,/glyphDots\(\[\[inversionGlyphInsideX,12\],\[inversionGlyphOutsideX,12\]\]\)/);
  const center=8.2, r=8, near=13.2, far=center+r*r/(near-center), marker=2.8;
  assert.ok(Math.abs((near-center)*(far-center)-r*r)<1e-9);
  assert.ok(near-center<r && far-center>r);
  assert.ok(far-near>2*marker);
  assert.ok(far+marker<=24 && center-r>=0);
  assert.doesNotMatch(source,/glyph\.circleInversion=glyphCrossSectionCircle[^;]+glyphDots\(\[\[8\.2,12\]/);
});
