// MathReader class-level regression: TOC section titles must not become Results.
// Run from repository root: node mathreader/tests/results_toc_regression.js
// No PDF or npm dependency required. Full PDF corpus gates are documented in REGRESSION.md.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', '41-equations-bibliography.js'), 'utf8');
const context = vm.createContext({ document: { addEventListener() {} }, console });
vm.runInContext(source, context, { timeout: 5000 });
const detect = (lines, i = 0, page = 1) => context.detectedStructureResult(lines, i, page);
const toc = (lines, page = 4, total = 170) => context.tocResultLineIndices(lines, page, total);
let checks = 0;
const check = (condition, description) => { assert.ok(condition, description); checks += 1; };
const nav = (title, folio, lineRatio = 0.2) => {
  const text = `${title} ${folio}`;
  const firstEnd = title.length;
  return {
    text, ratio: lineRatio, xStartRatio: 0.12, xEndRatio: 0.93,
    parts: [
      { start: 0, end: firstEnd, xStartRatio: 0.12, xEndRatio: 0.55 },
      { start: firstEnd + 1, end: text.length, xStartRatio: 0.88, xEndRatio: 0.93 },
    ],
  };
};
const body = (text, ratio = 0.75) => ({
  text, ratio, xStartRatio: 0.12, xEndRatio: 0.85,
  parts: [{ start: 0, end: text.length, xStartRatio: 0.12, xEndRatio: 0.85 }],
});

// Two reported Ahlfors classes on separate TOC pages, never filename-tuned.
const contentsA = [body('Contents', 0.05), nav('4-1. Definition of extremal length', '50'), nav('4-2. Examples', '52'), nav('4-3. The comparison principle', '53')];
check(toc(contentsA, 4).has(1), 'number-first Definition TOC row is excluded');
check(!toc(contentsA, 4).has(0), 'Contents label is not an indexed Result row');
check(detect(contentsA, 1, 4) === null, 'unnumbered narrative-style TOC Definition of ... is rejected before section indexing');
const continuation = [
  nav('9-1. Definition and examples', '125'), nav('9-2. Covering surfaces', '127'),
  nav('9-3. The fundamental group', '128'), nav('9-4. Subgroups and covering surfaces', '130'),
  nav('9-5. Cover transformations', '132'), nav('10-1. Existence of the Green function', '136'),
];
check(toc(continuation, 6).has(0), 'continuation TOC without readable Contents header is recognized');
check(detect(continuation, 0, 6) === null, 'continuation TOC Definition of ... does not become a Result');

// Essential recall: real content immediately below TOC must survive.
const pageWithBody = [...contentsA, body('Definition 4-1 Let a family of curves be given.', 0.81)];
check(!toc(pageWithBody, 4).has(4), 'genuine declaration on the same page survives');
check(detect([pageWithBody[4]], 0, 4)?.label === 'Definition 4-1', 'genuine label-first declaration is parsed');
check(toc([body('Definition 4-1 The extremal length is defined as')], 62).size === 0, 'body-only page never looks like TOC');
check(detect([body('Definition 9-1 A Riemann surface is ...')], 0, 136)?.label === 'Definition 9-1', 'late genuine definition remains');

// A numbered, all-caps subsection named "DEFINITION OF ..." is navigational,
// not the actual later Definition declaration.
check(detect([body('4-1 DEFINITION OF EXTREMAL LENGTH')], 0, 61) === null, 'all-caps section title is not a Result');
check(detect([body('9-1 DEFINITION AND EXAMPLES')], 0, 136) === null, 'all-caps section title containing Definition is not a Result');
check(detect([body('4-1. Definition. Let x be a compact set')], 0, 61)?.label === 'Definition 4-1', 'genuine number-first declaration is retained');
check(detect([body('THEOREM 2.1 Let f be smooth')], 0, 20)?.label === 'Theorem 2.1', 'genuine uppercase theorem declaration is retained');

// Negative controls: neither an isolated TOC-looking line, nor numerical
// tables/measurement rows, nor a Contents header without navigation creates
// a TOC classification.
check(toc([nav('4-1. Definition of extremal length', '50')], 4).size === 0, 'isolated entry is not enough');
check(toc([body('Contents', 0.05), nav('4-1. Definition of extremal length', '50')], 4).size === 0, 'one entry under Contents is not enough');
const dataRows = Array.from({length: 6}, (_, i) => nav(`${i+1}. Measurements`, String((i+1)*10), 0.15 + i * 0.06));
check(toc(dataRows, 5).size === 0, 'ordinary tabular number-first rows are not TOC');
const unitRows = Array.from({length: 6}, (_, i) => nav(`${i+1}-1. Time ${i+1} ms`, String((i+1)*10), 0.15 + i * 0.06));
check(toc(unitRows, 5).size === 0, 'measurement units do not trigger Definition false positives');
check(toc([body('Contents', 0.05), body('Definition 1 Let A be a set', 0.22)], 1).size === 0, 'Contents plus genuine result alone is safe');

// OCR/no-span variants: rely on repeated navigation evidence, never arbitrary
// one-off OCR fragments or an entire TOC page blanket ban.
const ocrRows = continuation.map((item) => ({...item, parts: [], ocrSource: true}));
check(toc(ocrRows, 6).has(0), 'OCR navigation rows with folio geometry are covered');
check(toc([ocrRows[0]], 6).size === 0, 'isolated OCR row remains unclassified');
check(toc(ocrRows.map((x) => ({...x, xEndRatio: 0.45})), 6).size === 0, 'no right-hand folio alignment means no TOC');

// Sequence normalization must process real body declarations only, and can
// therefore retain earlier labels previously shadowed by TOC entries.
const entries = [
  { label: 'Definition 4-1', page: 4, key: 'toc:4-1' },
  { label: 'Definition 9-1', page: 6, key: 'toc:9-1' },
  { label: 'Definition 1-1', page: 24, key: 'body:1-1' },
  { label: 'Definition 2-1', page: 36, key: 'body:2-1' },
  { label: 'Definition 4-1', page: 62, key: 'body:4-1' },
  { label: 'Definition 9-1', page: 136, key: 'body:9-1' },
];
const normalized = context.normalizeSequentialStructureEntries(entries.slice(2));
check(normalized.length === 4, 'four genuine sequential declarations survive after prefilter');
check(normalized[2].page === 62 && normalized[3].page === 136, 'genuine body locations are preserved');

console.log(`OK: ${checks} MathReader TOC/Results class-level assertions`);
