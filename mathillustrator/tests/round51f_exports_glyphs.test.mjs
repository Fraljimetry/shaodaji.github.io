import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');

test('R51F: all downloadable formats include a valid, local wall-clock timestamp',()=>{
 const def=app.match(/function datedExportName\([\s\S]*?\n}\nfunction datedProjectName\(\)\{[^\n]+\}/)?.[0];
 assert.ok(def,'download name helper must remain testable');
 const context={Date:class{getFullYear(){return 2026;}getMonth(){return 10;}getDate(){return 14;}getHours(){return 7;}getMinutes(){return 8;}getSeconds(){return 9;}}};
 vm.createContext(context);
 const result=vm.runInContext(`${def}\n({save:datedProjectName(),svg:datedExportName('svg'),png:datedExportName('png'),jpg:datedExportName('jpg'),webp:datedExportName('webp'),tex:datedExportName('tex'),tikzcd:datedExportName('tex','tikzcd')})`,context);
 assert.equal(JSON.stringify(result),JSON.stringify({
  save:'mathillustrator_20261114_070809.json',svg:'mathillustrator_20261114_070809.svg',
  png:'mathillustrator_20261114_070809.png',jpg:'mathillustrator_20261114_070809.jpg',
  webp:'mathillustrator_20261114_070809.webp',tex:'mathillustrator_20261114_070809.tex',
  tikzcd:'mathillustrator-tikzcd_20261114_070809.tex'
 }));
 for(const source of ["datedExportName('svg')","datedExportName(type==='jpeg'?'jpg':type)","datedExportName('tex')","datedExportName('tex','tikzcd')",'datedProjectName()'])assert.ok(app.includes(source),source);
 assert.doesNotMatch(app,/download\([^\n]*['"]mathillustrator(?:-tikzcd)?\.(?:svg|png|jpg|jpeg|webp|tex|json)['"]/);
});

test('R51F: each 2D plotting mode has a unique semantic SVG with the same preview and list factory',()=>{
 for(const type of ['function','parametric','implicit','vectorField','domainColoring'])assert.match(app,new RegExp(`\\b${type}:'<`));
 assert.match(app,/function plotGlyphSvg\(type\)/);
 assert.match(app,/objectIcon\.innerHTML=plotGlyphSvg\(o\.type\)/);
 assert.match(app,/preview\.innerHTML=plotGlyphSvg\(mode\)/);
 assert.match(html,/<span id="plot-mode-preview" aria-hidden="true"><\/span>/);
 assert.match(css,/#plot-mode-preview svg/);
 assert.match(html,/src\/app\.mjs\?cut=round61/);
});

test('R51I: Geometry markers have uniform 2.8-unit rendered size and related diagonal tools use 45 degrees',()=>{
 const base=app.match(/const glyph=\{([\s\S]*?)\};/)[1];
 const map=Object.fromEntries([...base.matchAll(/(\w+):'([^']+)'/g)].map(m=>[m[1],m[2]]));
 for(const m of app.matchAll(/glyph\.(\w+)='([^']+)'/g))map[m[1]]=m[2];
 for(const [type,svg] of Object.entries(map)){
  if(['select','pan','node','morphism','text','quadrilateral'].includes(type))continue;
  for(const match of svg.matchAll(/<circle\b[^>]*fill="currentColor"[^>]*>/g))assert.match(match[0],/r="2"/,type);
 }
 assert.match(app,/const GLYPH_POINT_RADIUS=2\.8/);
 assert.match(app,/glyph\.tangentCircle=glyphCrossSectionCircle/);
 assert.match(app,/for\(const type of Object\.keys\(glyph\)\)/);
 assert.match(map.segment,/M4 20L20 4/);assert.match(map.midpoint,/M4 20L20 4/);assert.match(map.line,/M2 22L22 2/);
 assert.match(map.ray,/M4 20L22 2/);assert.match(map.arrow,/M4 20L20 4/);
 assert.match(app,/fixedLength:r50Glyph\('<path d="M4 20L20 4/);
});
