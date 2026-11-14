import test from 'node:test';
import assert from 'node:assert/strict';
import {closeFreehandStroke,smoothCurveSvg} from '../src/geometry.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';

const near = [[0,0],[2,0],[3,2],[0.05,0.05]];
const circle = [[0,0],[2,0],[3,2],[2,4],[0,4],[-1,2],[-.1,-.1]];

test('regression: imported freehand closure helper is callable and never changes pen samples',()=>{
 const original=structuredClone(near);
 const result=closeFreehandStroke(near,'near',48);
 assert.equal(result.closed,true);assert.equal(result.joinStyle,'corner');assert.equal(result.path,near);
 assert.deepEqual(near,original);
 assert.equal(closeFreehandStroke(near,'open',48).closed,false);
 assert.equal(closeFreehandStroke(near,'near',400).closed,false);
 assert.equal(closeFreehandStroke(near,'always',400).closed,true);
});

test('near-endpoint tangent versus corner control the actual SVG seam',()=>{
 // A loop is smooth when entering and leaving tangents agree.
 const tangential=[[0,0],[1,0],[1,1],[0,1],[-1,0.1],[-.1,0]];
 const smooth=closeFreehandStroke(tangential,'near',48);
 assert.equal(smooth.closed,true);
 assert.equal(smooth.joinStyle,'smooth');
 const cusp=closeFreehandStroke(near,'near',48);
 const smoothedD=smoothCurveSvg(tangential,true,smooth.joinStyle);
 const cornerD=smoothCurveSvg(near,true,cusp.joinStyle);
 assert.match(smoothedD,/ Z$/);assert.match(cornerD,/ C[\d.\s-]+ 0 0 Z$/);assert.match(cornerD, / C[^C]+ 0 0 Z$/);
 assert.ok(!cornerD.includes('NaN'));
});

test('degenerate, malformed, and legacy closure data are fail-closed',()=>{
 for(const path of [null,[],[[0,0]],[[0,0],[1,1]],[[0,0],[Infinity,1],[1,0]],[[0,0],[NaN,0],[0,0]]])
  assert.equal(closeFreehandStroke(path,'near',50).closed,false);
 assert.equal(closeFreehandStroke(near,'near',NaN).closed,false);
 assert.equal(closeFreehandStroke(near,'near',0).closed,false);
 assert.equal(closeFreehandStroke(near,'invalid',50).closed,false);
 const d=newDoc();const c=append(d,{type:'freehand',path:near,closed:true,joinStyle:'corner'});
 assert.deepEqual(validateDoc(d),d);assert.equal(c.joinStyle,'corner');
});
