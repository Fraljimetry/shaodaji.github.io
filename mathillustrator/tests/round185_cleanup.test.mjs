import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('retired floating controls are absent, while docking and resizing remain',()=>{
 const html=file('index.html'),js=file('src/app.mjs');
 for(const id of ['objects-undock','tools-undock','properties-undock','properties-corner']){
  assert.doesNotMatch(html,new RegExp(`id="${id}"`));
  assert.doesNotMatch(js,new RegExp(`\\$\\('${id}'\\)`));
 }
 for(const id of ['left-collapse','right-collapse','properties-toggle','properties-splitter'])
  assert.match(html,new RegExp(`id="${id}"`));
});
test('morphism routing remains direct without unreachable refinement',()=>{
 const js=file('src/app.mjs');
 assert.doesNotMatch(js,/optimizeGlobalArrowRoutes|Global rerouting is disabled|routeEntries/);
 assert.match(js,/routeDiagramEdge\(a,b,fb,tb,\[\],'direct',\[\]\)/);
 assert.match(js,/curveEndpointRoute\(a,b,fb,tb,route,o\.bend\|\|0\)/);
});
