// v437: source-level OCR normalization regression; synthetic strings, not model inference.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname,'../js/10-formula-ocr.js'),'utf8');
const begin = src.indexOf('function normalizeOcrLatex(');
const end = src.indexOf('\nfunction markAlignmentRelation(', begin);
assert(begin >= 0 && end > begin);
const ctx = vm.createContext({ markAlignmentRelation: x=>x });
vm.runInContext('function latexLineSeparator() { return " "+String.fromCharCode(92,92,10); }\n'+src.slice(begin,end),ctx);
const norm = raw => {ctx.raw=raw; return vm.runInContext('normalizeOcrLatex(raw)',ctx)};
const cases = [
  [String.raw`$$a $b$ c$$`, 'a $b$ c'],
  [String.raw`\[ x=1 \] and $y=2$`, String.raw`\begin{aligned}`],
  [String.raw`$$a=1$$ $$a=1$$`, String.raw`a=1`],
  [String.raw`\(x=1\) \(x=1\)`, String.raw`\begin{aligned}`],
];
for (const [raw, expected] of cases) assert(norm(raw).includes(expected), raw);
assert.equal((norm('$$a=1$$ $$a=1$$').match(/a=1/g)||[]).length,2,'repeated math lines are not discarded');
assert.equal((norm(String.raw`\(x=1\) \(x=1\)`).match(/x=1/g)||[]).length,2,'repeated inline math lines retained');
assert.equal((norm(String.raw`$$a $b$ c$$`).match(/b/g)||[]).length,1,'nested match does not duplicate contents');
assert.equal(norm('plain formula x+y'),'plain formula x+y','unwrapped LaTeX unchanged');
const cleanStart = src.indexOf('function hasBalancedOuterBraces(');
const cleanEnd = src.indexOf('\nfunction normalizeOcrAlignmentLine(', cleanStart);
assert(cleanStart >= 0 && cleanEnd > cleanStart);
vm.runInContext(src.slice(cleanStart,cleanEnd),ctx);
ctx.rows = ['a=1','a=1','b=2'];
assert.equal(vm.runInContext('cleanOcrFormattingRows(rows).length',ctx),3,'formatting retains genuine identical rows');
ctx.rows = ['   ', 'a=1'];
assert.equal(vm.runInContext('cleanOcrFormattingRows(rows).length',ctx),1,'blank rows still removed');
console.log('PASS: 10 OCR envelope/row preservation assertions (synthetic strings)');
