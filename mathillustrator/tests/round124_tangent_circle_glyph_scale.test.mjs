import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');

test('R124: tangent-to-circle glyph uses the same radius as the Circle glyph',()=>{
  assert.match(app,/glyph\.circleIntersection='<circle cx="12" cy="12" r="8"/);
  assert.match(app,/const tangentCenter=\[15,14\], tangentRadius=8, tangentSource=\[2\.8,3\.2\];/);
  assert.match(app,/glyph\.tangentCircle=glyphCrossSectionCircle\(\.\.\.tangentCenter,tangentRadius\)/);
});
