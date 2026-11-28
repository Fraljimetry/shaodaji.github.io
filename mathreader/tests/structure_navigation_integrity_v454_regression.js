'use strict';
// Regression for v453 cleanup: indexed geometry must avoid redundant extraction;
// missing/invalid bookmark coordinates must not masquerade as exact page-top targets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/40-outline-structure.js'), 'utf8');
const start = source.indexOf('function comparableStructureNavigationText(value) {');
const end = source.indexOf('\nfunction renderActiveOutline() {', start);
assert(start >= 0 && end > start, 'production Structure functions must be present');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'regression/fixtures/structure_cz_exported_headings_v453.json'), 'utf8'));
const heading = fixture.headings.find(x => x.page === 3 && x.title.startsWith('2.2 '));
assert(heading && heading.ratio > 0.7);
let calls = 0;
const context = {
  console,
  pdfDoc: { numPages: 19 }, currentFileKey: 'CZ', readerNavigationSerial: 0,
  readingFlow: 'single', currentPage: 0, nextFrame: async () => {},
  inferredOutline: fixture.headings,
  pageTextLines: async () => { calls++; return []; },
  goToMatchedLocation: async (page, ratio) => { context.landing = { page, ratio }; context.readerNavigationSerial++; },
  landing: null,
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const navigate = vm.runInContext('navigateToStructureEntry', context);
(async () => {
  // A missing/invalid position must be recoverable even if imported metadata
  // incorrectly asserts positionKnown. Indexed destinations bypass extraction.
  for (const ratio of [null, undefined, '', NaN, -1, 3]) {
    context.landing = null;
    const prior = calls;
    await navigate({ title: 'Foundational facts we use', page: 3, ratio, positionKnown: true });
    assert(context.landing, `landing missing for ${String(ratio)}`);
    assert.equal(context.landing.page, 3);
    assert(Math.abs(context.landing.ratio - heading.ratio) < 0.0001);
    assert.equal(calls, prior, 'indexed detection must avoid page-text extraction');
  }
  // Full, explicitly precise author destinations remain untouched.
  await navigate({ title: 'Foundational facts we use', page: 3, ratio: 0.42, positionKnown: true });
  assert.equal(context.landing.ratio, 0.42);
  // A manual destination is never rewritten by automatic recovery.
  await navigate({ title: 'Foundational facts we use', page: 3, ratio: 0.43, positionKnown: false, userEdited: true });
  assert.equal(context.landing.ratio, 0.43);
  // Without indexed geometry, extraction is attempted exactly once, preserving fallback behavior.
  const old = context.inferredOutline;
  context.inferredOutline = [];
  const prior = calls;
  await navigate({ title: 'No such heading', page: 2, ratio: null, positionKnown: true });
  assert.equal(calls, prior + 1);
  assert.equal(context.landing.page, 2);
  assert.equal(context.landing.ratio, 0);
  context.inferredOutline = old;
  // Invalid page numbers are bounded to actual PDF pages, not sent unchecked downstream.
  await navigate({ title: 'Missing', page: 999, ratio: 0.4, positionKnown: true });
  assert.equal(context.landing.page, 19);
  console.log('PASS: Structure navigation geometry integrity (6 malformed, manual/precise, fallback, page bounds)');
})().catch(error => { console.error(error); process.exitCode = 1; });
