// MathReader v395: validate Results classification against actual Giusti (1984)
// PDF.js detector lines, checked against original PDF page images.
// This is not a Texify/Tesseract accuracy certification.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'regression/giusti_appendix_results_v395.json'), 'utf8'));
const source = fs.readFileSync(process.env.RESULT_SOURCE_OVERRIDE || path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const outline = fs.readFileSync(path.join(root, 'js/40-outline-structure.js'), 'utf8');
const referenceMatch = outline.match(/const STRUCTURE_REFERENCE_RE = ([^;]+);/);
assert.ok(referenceMatch, 'use the production proof-reference regex, not an invented test regex');
const referenceRe = vm.runInNewContext(referenceMatch[1]);
const linesByPage = new Map(fixture.pages.map(p => [p.page, p.detectorInputLines]));
let checks = 0;
const check = (ok, why) => { assert.ok(ok, why); checks++; };
const equal = (a, b, why) => { assert.deepEqual(a, b, why); checks++; };
const sandbox = {
  console, setTimeout, document: { addEventListener() {} },
  pdfDoc: { numPages: fixture.document.pages }, currentFileKey: 'giusti-verified-original',
  documentTextFeaturesAvailable() { return true; },
  structureIndex: {}, structureIndexBuilding: false,
  buildStructureIndexButton: { disabled: false },
  structureEmpty: { classList: { remove() {} }, textContent: '' },
  bibliographyEmpty: { classList: { remove() {} }, textContent: '' },
  textCache: new Map(), lineCache: new Map(), structureIndexBuildToken: 0,
  structureEntries: [], bibliographyEntries: [], structureIndexVersion: 0,
  pendingOutlineReselectKey: null,
  STRUCTURE_INDEX_VERSION: 50, STRUCTURE_REFERENCE_RE: referenceRe,
  async suppliedTextLines(page) { return linesByPage.get(page) || []; },
  async *orderedPrefetch(items, fn) {
    for (const item of items) yield { item, value: await fn(item) };
  },
  backlinkSnippet(line, fragment, index) {
    return String(line).slice(Math.max(0, index-20), index+50);
  },
  persistDocumentState() {}, rerenderReferenceLinks() {},
  t(x) { return x; }
};
const context = vm.createContext(sandbox);
vm.runInContext(source, context, { timeout: 20000 });
vm.runInContext('pageTextLines=suppliedTextLines;renderStructureIndex=()=>{};renderBibliographyIndex=()=>{};rerenderReferenceLinks=()=>{};',context);
function pageLine(page, regex) {
  const row = (linesByPage.get(page) || []).find(l => regex.test(l.text));
  check(row, `original PDF detector line found at PDF page ${page}: ${regex}`);
  return row;
}
function parseLine(page, regex) {
  const row = pageLine(page, regex);
  return context.detectedStructureResult([row], 0, page);
}
(async () => {
  const positives = [
    [231, /^A\.l De La Vallee Poussin Theorem:/, 'Theorem A.1'],
    [240, /^C\.l\. Theorem:/, 'Theorem C.1'],
    [242, /^C\.2 Theorem/, 'Theorem C.2'],
    [242, /^C\.3 Theorem:/, 'Theorem C.3'],
    [243, /^C\.4 Theorem:/, 'Theorem C.4'],
    [244, /^C\.5 Lemma/, 'Lemma C.5'],
    [244, /^C\.6 Lemma:/, 'Lemma C.6'],
    [245, /^C\.7 Theorem/, 'Theorem C.7'],
    [246, /^C\.9 Theorem:/, 'Theorem C.9'],
    [246, /^C\.lO Theorem:/, 'Theorem C.10'],
    [247, /^C\.ll Theorem:/, 'Theorem C.11'],
  ];
  for (const [page, regex, label] of positives) {
    const candidate = parseLine(page, regex);
    equal(candidate?.label, label, `printed appendix declaration ${label} on page ${page}`);
    check(Math.abs(candidate.ratio - pageLine(page, regex).ratio) < 1e-8, `${label} retains actual navigation coordinate`);
  }
  const biblioHeading = pageLine(246, /^[·•]\s*C\.S Theorem/);
  check(context.detectedStructureResult([biblioHeading], 0, 246) === null
    || Boolean(context.detectedStructureResult([biblioHeading], 0, 246)?.ambiguousAppendixOCR),
    'single ambiguous C.S must not unconditionally invent result C.8');
  for (const [page, regex] of [[233,/^A\.2 Theorem A\.l for/],[235,/^A\.3 Theorem A\.l for/],
    [246,/^Proof: If m = 1/],[247,/^Proof: By Theorem C\.l/],[247,/^Now let m = 1/]]) {
    equal(parseLine(page, regex), null, `appendix heading or proof reference is not a Result, PDF page ${page}`);
  }
  equal(context.detectedStructureResult([{text:'(C.10) Theorem (as in (C.3))',ratio:0.5}],0,12),null,'equation-like parenthesized number is not a result');
  equal(context.detectedStructureResult([{text:'C.10 Theorem of Elliptic Regularity',ratio:0.4}],0,12),null,'section-style title without declaration evidence is excluded');
  equal(context.detectedStructureResult([{text:'C.S Theorem: Let u be a solution',ratio:0.4}],0,12)?.label, undefined,
    'ambiguous S is not automatically turned into a digit without neighboring evidence');
  for (const [text,label] of [
    ['C.10 Theorem: Let u be smooth', 'Theorem C.10'],
    ['C.11 Lemma. For every x', 'Lemma C.11'],
    ['A.1 Theorem', 'Theorem A.1'],
    ['B-3 Corollary: If A is compact', 'Corollary B-3'],
    ['AA.2 Proposition (Key): Let x be fixed', 'Proposition AA.2'],
    ['12.4 Theorem: Let x=1', 'Theorem 12.4'],
    ['Theorem 12.4 Let u be smooth', 'Theorem 12.4'],
  ]) {
    equal(context.detectedStructureResult([{text,ratio:0.4}],0,1)?.label,label,`generic grammar positive: ${text}`);
  }
  const outlineSandbox = vm.createContext({document:{addEventListener(){}},console});
  vm.runInContext(outline,outlineSandbox,{timeout:20000});
  check(outlineSandbox.numberedResultDeclarationInOutline('C.lO Theorem: Let u be a solution'),
    'OCR-confusable appendix declaration excluded from Structure');
  check(outlineSandbox.numberedResultDeclarationInOutline('C.10 Theorem: Let u be a solution'),
    'printed appendix declaration excluded from Structure');
  check(!outlineSandbox.numberedResultDeclarationInOutline('C.10 Theorem of elliptic regularity'),
    'genuine lexical section title remains eligible for Structure');
  equal(context.normalizedStructureResultReference('Theorem C.lO'),
    context.normalizedStructureResultReference('Theorem C.10'), 'OCR confusables in proof references match canonical Results');
  equal(context.normalizedStructureResultReference('Theorem C.l'),
    context.normalizedStructureResultReference('Theorem C.1'), 'C.l reference resolves to C.1');
  equal(context.detectedStructureResult([{text:'n.1 theorem: Let u be smooth',ratio:0.4}],0,1),null,
    'lowercase mathematical variable is not an appendix number');
  equal(context.detectedStructureResult([{text:'Theorem c.10: Let u be smooth',ratio:0.4}],0,1),null,
    'lowercase mathematical variable in type-first form is not a labeled appendix Result');
  const ambiguousOnly=[];
  context.recoverBoundedAppendixResultConfusables(ambiguousOnly,[{
    ambiguousAppendixOCR:true,appendixType:'Theorem',appendixPrefix:'C',page:10,ratio:.4,rawText:'C.S Theorem: Let...',titleTail:': Let...'
  }]);
  equal(ambiguousOnly.length,0,'unbracketed ambiguous glyph cannot invent any Result');
  // A complete detector build from original page lines tests index continuation,
  // deduplication, preservation of original PDF coordinates, and type families.
  await context.buildStructureIndex({ force: true });
  const actual = JSON.parse(JSON.stringify(context.structureEntries));
  const byLabel = new Map(actual.map(r => [r.label,r]));
  for (const [page,regex,label] of positives) {
    const entry=byLabel.get(label);
    check(entry,`${label} is present in the actual built Results index`);
    equal(entry.page,page,`${label} points to the original PDF page`);
    check(Math.abs(entry.ratio - pageLine(page,regex).ratio) < 1e-8,`${label} preserves PDF-relative y`);
    equal(actual.filter(r=>r.label===label).length,1,`${label} occurs exactly once`);
  }
  check(byLabel.has('Theorem C.8'), 'C.8 is recovered only with original C.S evidence bracketed by C.7 and C.9');
  equal(byLabel.get('Theorem C.8')?.page, 246, 'C.8 original printed page is preserved');
  check(!actual.some(r=>/C\.S\b/i.test(r.label)), 'ambiguous raw glyph is never published as a verified theorem number');
  check(!actual.some(r=>r.page===253), 'Subject Index continuation must not invent Theorem 125');
  check(byLabel.get('Theorem C.1').usedByProofs.some(r=>r.label==='Theorem C.9'),
    'OCR-confusable proof reference to Theorem C.l resolves to Theorem C.1');
  check(actual.some(r=>r.label==='Theorem 17.10'), 'main-text theorem remains indexed');
  for(const item of actual) check(item.page>=1&&item.page<=253&&Number.isFinite(item.ratio),`valid location ${item.label}`);
  check(referenceRe.test('Theorem C.10'), 'proof-reference recognizer matches decimal appendix number');
  referenceRe.lastIndex=0;
  check(referenceRe.test('Theorem C.lO'), 'proof-reference recognizer matches PDF text confusable');
  // Independent historical-paper control: the new appendix parser cannot
  // remove or rewrite Yau's existing 13 numbered/unnumbered Results.
  const yauFixture = JSON.parse(fs.readFileSync(path.join(root, 'regression/yau_results_control_v395.json'), 'utf8'));
  const yauLines = new Map(yauFixture.pages.map(p => [p.page, p.detectorInputLines]));
  const yauSandbox = {
    ...sandbox,
    pdfDoc: { numPages: yauFixture.document.pages }, currentFileKey: 'yau-verified-original',
    structureEntries: [], bibliographyEntries: [], structureIndexBuilding: false,
    structureIndexVersion: 0, structureIndexBuildToken: 0,
    textCache: new Map(), lineCache: new Map(),
    async suppliedTextLines(page) { return yauLines.get(page) || []; },
    STRUCTURE_REFERENCE_RE: vm.runInNewContext(referenceMatch[1]),
  };
  const yauContext = vm.createContext(yauSandbox);
  vm.runInContext(source, yauContext, { timeout: 20000 });
  vm.runInContext('pageTextLines=suppliedTextLines;renderStructureIndex=()=>{};renderBibliographyIndex=()=>{};rerenderReferenceLinks=()=>{};',yauContext);
  await yauContext.buildStructureIndex({ force: true });
  const yauResults = JSON.parse(JSON.stringify(yauContext.structureEntries));
  // v409 independent PDF review: p39 "Lemma 1" is the continuation of
  // "we can deduce" and must NOT be treated as a second lemma declaration.
  equal(yauResults.map(x => x.label),yauFixture.expectedLabels.filter(label => label !== 'Lemma 1'),
    `original Yau results nonregression: ${JSON.stringify(yauResults.map(x=>x.label))}`);
  for(const entry of yauResults) check(entry.page>=1&&entry.page<=73&&Number.isFinite(entry.ratio),
    `Yau retains valid original page location for ${entry.label}`);
  console.log(`PASS ${checks} Giusti appendix + Yau historical Results assertions; Giusti ${actual.length}, Yau ${yauResults.length}`);
})().catch(err => { console.error(err); process.exitCode=1; });
