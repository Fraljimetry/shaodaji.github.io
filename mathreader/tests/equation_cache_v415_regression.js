'use strict';
// v415 detector-version boundary: stale local equations rebuild; imported
// reading data remains available when the original PDF has no text layer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8').replace(/\r\n/g, '\n');
const match = source.match(/function restoreEquationIndexFromPersistence\([\s\S]*?\n\}\n\nfunction exportedDocumentOcrSnapshot\(/);
assert.ok(match, 'restore implementation must remain auditable');
const functionSource = match[0].slice(0, -'\n\nfunction exportedDocumentOcrSnapshot('.length);
const context = vm.createContext({Map, Number, Math, String, Array, EQUATION_INDEX_SUMMARY_VERSION: 30,
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
assert.equal(context.restore({...old,version:30}).get('(1.1)').length,2,
  'v455 detector version restores multiple occurrences');
assert.equal(context.restore({version:30,rows:[]}),null,'empty snapshot remains empty');
assert.equal(context.restore({...old,version:28}),null,'stale v419 native equation index is rebuilt for two-column correction');
assert.equal(context.restore({...old,version:29}),null,'v454 stale native index rebuilds');
const migrationStart = source.indexOf('function shouldRebuildPortableNativeEquationSnapshot(');
const migrationEnd = source.indexOf('function restoreEquationIndexFromPersistence(',migrationStart);
assert.ok(migrationStart>=0 && migrationEnd>migrationStart,'native import migration is present');
vm.runInContext(source.slice(migrationStart,migrationEnd),context);
const stale = {...old,version:29};
assert.equal(context.shouldRebuildPortableNativeEquationSnapshot(stale,'native'),true,'old portable automatic native index rebuilds');
assert.equal(context.shouldRebuildPortableNativeEquationSnapshot(stale,'unavailable'),false,'portable map without text remains');
assert.equal(context.shouldRebuildPortableNativeEquationSnapshot(stale,'ocr'),false,'portable OCR map remains');
assert.equal(context.shouldRebuildPortableNativeEquationSnapshot({...stale,version:30},'native'),false,'current map remains');
for (const flag of ['ocrSource','meticulousPageVerified','ocrGeometryMeasured','manualAdd','manualReselect','manualEditId','marginLocationVerifiedV385','marginLocationVerifiedV386']) {
  assert.equal(context.shouldRebuildPortableNativeEquationSnapshot({...stale,rows:[{...stale.rows[0],[flag]:true}]},'native'),false,`preserve ${flag} geometry`);
}
assert.ok(source.includes('portable: portableDetectionRequested && !rebuildPortableNative'),'session restoration uses migration decision');
console.log('PASS v455 local cache invalidation, native import repair, OCR/manual geometry preservation and repeated locations');
