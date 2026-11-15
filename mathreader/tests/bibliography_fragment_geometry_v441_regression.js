'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/41-equations-bibliography.js'), 'utf8');
const ctx = vm.createContext({console, document: {addEventListener(){}}});
vm.runInContext(source, ctx, {timeout: 10000});
const rowText = '[11]   A. Author       [12]   B. Author';
const at = (start, text, xs, xe) => ({start, end:start+text.length, xStartRatio:xs,xEndRatio:xe});
const left=[at(0,'[11]',.08,.12),at(7,'A. Author',.14,.41)];
const rStart=rowText.indexOf('[12]');
const right=[at(rStart,'[12]',.58,.62),at(rStart+7,'B. Author',.65,.90)];
const row={text:rowText,parts:[...left,...right],ratio:.45,xStartRatio:.08,xEndRatio:.90};
for(const [parts,col] of [[left,0],[right,1]]) {
  const fragment=ctx.bibliographyLineFragment(row,parts,col);
  assert.ok(fragment);
  assert.equal(fragment.columnIndex,col);
  for(const [i,part] of parts.entries()) {
    const token=rowText.slice(part.start,part.end);
    assert.equal(fragment.text.slice(fragment.parts[i].start,fragment.parts[i].end),token,'source token coordinates must survive splitting');
  }
  assert.equal(fragment.xStartRatio,parts[0].xStartRatio);
  assert.equal(fragment.xEndRatio,parts[parts.length-1].xEndRatio);
}
// Extraction may insert repeated whitespace; retaining exact spans matters for bracket offsets.
const sparse={text:'    [21]\t\tSmith     (2020)   ',ratio:.25};
const p=[at(4,'[21]',.1,.16),at(10,'Smith',.2,.3),at(20,'(2020)',.33,.4)];
const got=ctx.bibliographyLineFragment(sparse,p,0);
for(let i=0;i<p.length;i++) assert.equal(got.text.slice(got.parts[i].start,got.parts[i].end),sparse.text.slice(p[i].start,p[i].end));
// A page may contain extremely many glyph fragments. Never spread these into Math.min/Math.max.
const many=Array.from({length:140000},(_,i)=>({start:i,end:i+1,xStartRatio:i/140000,xEndRatio:(i+1)/140000}));
const large=ctx.bibliographyLineFragment({text:'a'.repeat(140000),ratio:.2},many,0);
assert.equal(large.text.length,140000);
assert.equal(large.parts.length,140000);
// Bad extraction geometry must not silently manufacture a bibliography reference.
assert.equal(ctx.bibliographyLineFragment({text:'abc'},[at(7,'x',.1,.2)],0),null);
assert.equal(ctx.bibliographyLineFragment({text:'abc'},[{start:-2,end:2,xStartRatio:.1,xEndRatio:.2}],0),null);
console.log('PASS bibliography fragment geometry and dense-text regression');
