'use strict';
// v415 detector-version boundary: stale local equations rebuild; imported
// reading data remains available when the original PDF has no text layer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const match = source.match(/function restoreEquationIndexFromPersistence\([\s\S]*?\n\}\n\nfunction exportedDocumentOcrSnapshot\(/);
assert.ok(match, 'restore implementation must remain auditable');
const functionSource = match[0].slice(0, -'\n\nfunction exportedDocumentOcrSnapshot('.length);
const context = vm.createContext({Map, Number, Math, String, Array, EQUATION_INDEX_SUMMARY_VERSION: 29,
  normalizedEquationLabel: s => /^\(\d+(?:\.\d+)*\)$/.test(s) ? s : ''});
vm.runInContext(`${functionSource}\n globalThis.restore = restoreEquationIndexFromPersistence;`, context);
const old = {version:27,rows:[
  {label:'(1.1)',page:6,ratio:.35,confidence:18},
  {label:'(1.1)',page:47,ratio:.45,confidence:18},
  {label:'(3.6)',page:112,ratio:.55,confidence:18}
]};
assert.equal(context.restore(old),null,'ordinary v417 cached equation index invalidates on v418');
const portability = context.restore(old,{portable:true});
assert.equal(portability.size,2,'portable old export retains known equation labels');
assert.deepEqual(Array.from(portability.get('(1.1)'),item=>item.page),[6,47],
  'portable snapshot retains distinct chapter-local occurrences when text is unavailable');
assert.equal(context.restore({...old,version:29}).get('(1.1)').length,2,
  'v420 detector version restores multiple occurrences');
assert.equal(context.restore({version:29,rows:[]}),null,'empty snapshot remains empty');
assert.equal(context.restore({...old,version:28}),null,'stale v419 native equation index is rebuilt for two-column correction');
console.log('PASS v420 local equation cache invalidation, portable import and repeated locations');
