'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const fnSource = index.match(/async function equationMarginOcrLines\([\s\S]*?\n\}\n/);
assert.ok(fnSource, 'margin OCR helper found');
const canvases = [];
function canvas() {
  const c = {width:300,height:150,getContext(){return {fillRect(){},drawImage(){},set fillStyle(x){}}}};
  canvases.push(c);
  return c;
}
const context = {
  equationDetectionNowMs: () => 0,
  document: {createElement: () => canvas()},
  pageRecordFromHocr: (hocr,text,width,height,page) => ({lines:[{text:'(17.24)',ratio:500/height,xStartRatio:.9,xEndRatio:1,parts:[]}]}),
  remapEquationMarginOcrLine: (line) => line,
};
const margin = vm.runInNewContext(`(${fnSource[0]})`, context);
const worker = {recognize: async () => ({data:{hocr:'ok'}})};
(async () => {
  const owned = canvas(); owned.width = 1000; owned.height = 1000;
  const first = await margin({},229,'right',worker,{existingCanvas: owned});
  assert.equal(first[0].ratio,0.5,'keeps true page-relative vertical coordinate');
  assert.equal(owned.height,1000,'must not clear caller-owned rendered page');
  assert.equal(owned.width,1000);
  const sourceDoc = {getPage:async()=>({getViewport:({scale})=>({width:600*scale,height:1000*scale}),render:()=>({promise:Promise.resolve()})})};
  const second = await margin(sourceDoc,229,'left',worker);
  assert.ok(second[0].ratio > 0 && second[0].ratio < 1,'newly rendered page has correct normalized geometry');
  assert.equal(canvases.at(-2).height,1,'private source canvas released');
  const mergeSource = core.match(/function mergePageIndexOcrEvidence\([\s\S]*?\n\}\n/);
  assert.ok(mergeSource);
  const merge = vm.runInNewContext(`(${mergeSource[0]})`);
  const old = {lines:[{text:'(17.24)',ratio:.5}],words:[],equationMarginEvidence:[{page:229,label:'(17.24)',ratio:1}]};
  const next = {lines:[{text:'(17.24)',ratio:.5}],words:[],equationMarginEvidence:[{page:229,label:'(17.24)',ratio:.5}]};
  const out = merge(old,next);
  assert.equal(out.equationMarginEvidence.length,1,'retire obsolete broken navigation geometry when verified replacement exists');
  assert.equal(out.equationMarginEvidence[0].ratio,.5);
  assert.equal(merge(old,{lines:[],words:[]}).equationMarginEvidence.length,1,'never drop label without replacement');
  console.log('PASS: equation-margin OCR geometry and cached-navigation repair');
})().catch(e => {console.error(e);process.exitCode=1});
