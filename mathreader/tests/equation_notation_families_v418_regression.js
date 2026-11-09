'use strict';
// Numbering conventions independently documented in mathematical books/notes.
// These are grammar/geometry unit tests, not claims of full-book accuracy.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const ctx = vm.createContext({EQUATION_TAG_SYMBOL_CLASS:'*†‡',equationNumberingSide:'right',document:{addEventListener:()=>{}}});
vm.runInContext(source, ctx);
const scan = text => Array.from(vm.runInContext(`equationLabelCandidatesInLine(${JSON.stringify(text)})`,ctx), r => r.label);
const parse = label => vm.runInContext(`parsedEquationNumber(${JSON.stringify(label)})`, ctx);
const good = [
  // R. K. Livesley, Cambridge textbook excerpt: three displayed (1.2a-c) equations.
  ['(1.2a)', '1', 2, 'a'], ['(1.2b)', '1', 2, 'b'], ['(1.2c)', '1', 2, 'c'],
  // Atkinson/Han: chapter.section.equation (documented in the preface).
  ['(1.2.3)', '1.2', 3, ''],
  // King, The Theory of Linear Antennas: cross-chapter references (II.7.14).
  ['(III.6)', 'III', 6, ''], ['(IV.3)', 'IV', 3, ''], ['(II.7.14)', 'II.7', 14, ''],
  // Appendix, including its own suffix variants.
  ['(A.1)', 'A', 1, ''], ['(C.2a)', 'C', 2, 'a'], ['(A1)', 'A', 1, ''],
  // Short compound labels found in aligned displays.
  ['(1a)', '', 1, 'a'], ['(2.4b)', '2', 4, 'b']
];
for (const [label,prefix,last,suffix] of good) {
  const parsed = parse(label);
  assert.ok(parsed, `parse ${label}`);
  assert.equal(parsed.prefix,prefix,`${label} prefix`);
  assert.equal(parsed.last,last,`${label} number`);
  assert.equal(parsed.suffix,suffix,`${label} suffix`);
  assert.ok(scan(`${label}  u(x) = v(x)`).includes(label),`${label} display scanner`);
}
for (const bad of ['(III)','(IV.3.2.1.5)','(2026)','(ABCD.2)','(x-2)','(II.a)','(9abc)']) {
  assert.ok(!vm.runInContext(`isEquationLabelQuery(${JSON.stringify(bad)})`,ctx),`reject ${bad}`);
}
for (const text of ['Equation (1.2a) is the PDE', 'The condition (III.6) follows', 'see (2.4b)', 'refer to (II.7.14)']) {
  assert.ok(vm.runInContext(`equationReferenceProseContext(${JSON.stringify(text)})`,ctx),`reference guard: ${text}`);
}
assert.deepEqual(scan('g(1.2a)'),['(1.2a)'],'candidate remains available for lexical filtering, not an equation by itself');
console.log('PASS: nonstandard numbering grammar, suffix family, roman chapter and prose-reference controls');
