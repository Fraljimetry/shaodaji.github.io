'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/41-equations-bibliography.js'), 'utf8');
const core = fs.readFileSync(path.join(__dirname, '../js/00-core.js'), 'utf8');
function extract(name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`function ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `find ${name}`);
  return source.slice(start, end);
}
const context = vm.createContext({
  equationManualOrder: ['label:(17.23)', 'label:(17.25)', 'label:(17.26)'],
  equationOrderCustomized: false,
  persistDocumentState() {},
  normalizedEquationLabel: x => String(x).trim(),
  equationSourceLabelForDisplayed: x => x,
  isPlausibleNumericEquationTagInner: inner => /^\d+(?:[.-]\d+)*$/.test(inner),
});
vm.runInContext(extract('parsedEquationNumber', 'equationDocumentPosition') + '\n' + extract('equationRowOrderKey','saveEquationDragOrder') + '\n' + extract('saveEquationDragOrder','renderEquationIndex'), context);
// Numeric labels on the same page must not inherit imperfect OCR y coordinates.
const input = [
 {label:'(17.26)',page:228,ratio:.1},
 {label:'(17.23)',page:228,ratio:.9},
 {label:'(17.25)',page:228,ratio:.2},
 {label:'(17.24)',page:228,ratio:.8},
 {label:'(17.27)',page:229,ratio:.4}
];
const rows = input.sort((a,b)=>vm.runInContext('compareEquationIndexRows',context)(a,b));
assert.deepEqual(rows.map(x=>x.label),['(17.23)','(17.24)','(17.25)','(17.26)','(17.27)']);
const output = vm.runInContext('reconcileEquationManualOrder',context)(rows);
assert.deepEqual(output.map(x=>x.label),rows.map(x=>x.label),'stale persisted order cannot append recovered rows');
assert.equal(vm.runInContext('equationManualOrder.length',context),5);
// Preserve deliberate user reordering; this must be an explicit action.
vm.runInContext('equationOrderCustomized = true; equationManualOrder = ["label:(17.25)","label:(17.23)","label:(17.26)"]',context);
const userRows = vm.runInContext('reconcileEquationManualOrder',context)(rows);
assert.ok(userRows.findIndex(x=>x.label==='(17.25)') < userRows.findIndex(x=>x.label==='(17.23)'));
assert.match(core,/equationOrderCustomized:?.*true|equationOrderCustomized === true/);
assert.match(source,/equationOrderCustomized = true;/);
assert.match(core,/equationOrderCustomized,\s*equationInitialRecoveryDone/);
console.log('PASS: additive OCR numerical ordering, stale-order bypass, explicit manual drag persistence');
