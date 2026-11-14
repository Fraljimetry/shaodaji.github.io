import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');

test('inversion glyph contains two mathematically inverse points and no center marker',()=>{
  assert.match(source,/const inversionGlyphInsideX=13\.1;/);
  assert.match(source,/const inversionGlyphOutsideX=8\.5\+7\.5\*\*2\/4\.6;/);
  assert.match(source,/glyph\.circleInversion=glyphCrossSectionCircle\(8\.5,12,7\.5\)/);
  assert.match(source,/glyphDots\(\[\[inversionGlyphInsideX,12\],\[inversionGlyphOutsideX,12\]\]\)/);
  const center=8.5, r=7.5, near=13.1, far=center+r*r/(near-center), marker=2.8;
  assert.ok(Math.abs((near-center)*(far-center)-r*r)<1e-9);
  assert.ok(near-center<r && far-center>r);
  assert.ok(far-near>2*marker);
  assert.ok(far+marker<=24 && center-r>=0);
  assert.doesNotMatch(source,/glyph\.circleInversion=glyphCrossSectionCircle[^;]+glyphDots\(\[\[8\.5,12\]/);
});
