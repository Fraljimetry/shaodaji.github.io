import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('R51E: Objects and Tools reuse one SVG factory with identical viewBox and paint rules',()=>{
 assert.match(app,/function toolGlyphSvg\(type\)/);
 assert.match(app,/if\(toolGlyph\)objectIcon\.innerHTML=toolGlyphSvg\(toolGlyph\);/);
 assert.match(app,/button\.innerHTML=`\$\{toolGlyphSvg\(type\)\}<span>\$\{label\}<\/span>`/);
 assert.match(css,/\.tool svg,\.objects \.object \.glyph svg\{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1\.7/);
 assert.match(css,/\.objects \.object \.glyph\{width:29px;height:29px;flex:0 0 29px;color:var\(--ink\)\}/);
 assert.match(html,/style\.css\?cut=round51f/);
 assert.match(html,/src\/app\.mjs\?cut=round55-geometry-contract/);
});

test('R51E: transformation variants and closed splines choose the actual corresponding tool',()=>{
 for(const pair of ['reflect:\'reflection\'','rotate:\'rotation\'','translate:\'translation\'','dilate:\'dilation\'','invert:\'circleInversion\''])
  assert.ok(app.includes(pair),pair);
 assert.match(app,/if\(o\.type==='spline'&&o\.closed===true\)return 'closedSpline'/);
 assert.match(app,/PLOTTING_GLYPHS=Object\.freeze/);
 assert.doesNotMatch(app,/const SECTION_OBJECT_GLYPHS=/);
});
