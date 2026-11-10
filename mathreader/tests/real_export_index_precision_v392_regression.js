// Source-derived, executable class regressions from two user-provided
// mathreader.reading-data@1 exports (2026-11-06). The exports are NOT raw
// document OCR or independently annotated original PDF page images.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const outlineSrc = read('js/40-outline-structure.js');
const eqSrc = read('js/41-equations-bibliography.js');
const outline = vm.createContext({ document: {addEventListener() {}}, console });
vm.runInContext(outlineSrc, outline, {timeout: 5000});
const equation = vm.createContext({document:{addEventListener(){}},console});
vm.runInContext("let equationNumberingSide='left'; const EQUATION_TAG_SYMBOL_CLASS='*∗⋆★☆†‡※◇◆○●◦•△▲▽▼□■♢♦⊙⊗⊕⊖⊥∥';", equation);
vm.runInContext(eqSrc, equation, {timeout: 5000});
let checks = 0;
function check(value,message) {assert.ok(value,message);checks++;}

// The 1984 Giusti export contained 68 numbered result declarations inside
// Structure (as well as its correct Results index). This specific lexical
// form must belong only in Results, regardless of font-size fluctuations.
for(const [page,title] of [
  [16, '1.1 Definition: Let Q s IRn be an open set and let jE L 1 (Q). Define'],
  [16, '1.2 Example: IfjEC 1 (Q), then integration by parts gives'],
  [20, '1.9 Theorem (Semicontinuity): Let n s IR" be an open set and {Jj} a sequence'],
  [22, '1.13 Proposition: Suppose {jj} is a sequence in B V(Q)'],
  [43, "2.1 Theorem (Lebesgue's Theorem): IjjEL 1"],
  [43, '2.2 Lemma: Let As rpn and p:A ->(0, 1)'],
  [54, '2.17 Remark: It is easily seen from the construction'],
  [188, '15.6 Definition: Let n be a Caccioppoli set']
]) check(outline.numberedResultDeclarationInOutline(title), `Giusti p.${page}: ${title}`);
for(const title of ['1. Notations and Local Formulae', '2. Estimates up to Second Order',
  '9. The General Case', '15. Trace and Extension Theorems',
  '2.1 Theorem of Stokes', '2.2 Lemma on Characteristic Classes',
  'Appendix A', 'Theorem of Stokes', 'Remarkable Functions and Their Properties']) {
  check(!outline.numberedResultDeclarationInOutline(title),`real section/title preserved: ${title}`);
}

// Giusti's Contents p.6 and its appendix links are not actual p.231+ body
// headings. Yau's actual Appendix A/B p.65/69 must remain eligible.
check(/\(\?:table\\s\+of\\s\+\)\?contents/.test(outlineSrc), 'Table of Contents is recognized as a TOC head');
check(/preliminaryContentsPage\s*&&\s*line\.page\s*<\s*preliminaryContentsPage/.test(outlineSrc), 'book cover/series pre-TOC style text is filtered only when TOC evidence exists');
check(outline.isKnownHeading('Appendix A') && outline.isKnownHeading('Appendix B'), 'actual appendix body headings remain known headings');

// Representative accidental Structure candidates in the Giusti/Yau exports.
for(const title of [
  "Roughly speaking, Fleming's idea was the following. Let u be an entire",
  'If in addition E is bounded, then we obtain the result',
  'Obviously this sequence is bounded below by 0 and hence converges',
  'provided we leave the value off at x 0 unchanged, the approximate continuity'
]) check(outline.obviousProseFragmentInOutline(title),`long body prose rejected: ${title}`);
for(const title of [
  'Traces of B V Functions', 'Minimal Surfaces and Functions of Bounded Variation',
  'The General Case', 'Functions of Bounded Variation and Caccioppoli Sets',
  'On Existence and Regularity of Minimal Surfaces'
]) check(!outline.obviousProseFragmentInOutline(title),`genuine title unaffected: ${title}`);
check(outline.numberedFormulaFragmentInOutline("2 C (giy+d2cp/dzi 132') d z i @ d f i defines a Kahler metric and"), 'Yau p.25 OCR math fragment is not a section');
check(!outline.numberedFormulaFragmentInOutline('2 C (The General Case)'), 'ordinary parenthesized section title is not rejected');

// A 253-page book previously hit 240 at p.191; the limiter appeared in
// detection, restoring, manual addition and Undo. All now use one value.
const core=read('js/00-core.js');
check(core.includes('const MAX_INFERRED_OUTLINE_ENTRIES = 1200;'), 'shared bounded Structure limit');
for(const file of ['js/00-core.js']) {
  check(read(file).includes('.slice(0, MAX_INFERRED_OUTLINE_ENTRIES)'), `${file}: no 240-record silent truncation`);
}
// v419 preserves manually curated entries ahead of automatic ones when
// the shared 1200-entry bound is reached; it deliberately no longer slices
// blindly in manual-add and render helpers.
for(const file of ['js/20-selection-annotations.js','js/40-outline-structure.js','js/60-notes-bookmarks-data.js']) {
  check(read(file).includes('boundedOutlineWithManualPriority('), `${file}: bounded Structure entries preserve user edits`);
}
check(core.includes('const STRUCTURE_INDEX_VERSION = 56;'), 'old local Structure cache is rebuilt after classifier upgrade');
check(core.includes('const EQUATION_INDEX_SUMMARY_VERSION = 29;'), 'v414 local Equation cache invalidates after colon-label correction');

// The actual export includes spurious OCR/math variables read as compact
// or hyphenated appendix equation IDs: n-1, p-0, j-00, Wn8 and k1. Keep
// genuine delimited and compact appendix numbering (and symbolic tags).
for(const label of ['(rn-1)','(n-1)','(p-0)','(j-00)','(Wn8)','(Wn-1)','(bn-1)','(j-2)','(j-4)','(l2)','(k1)','(c-1)']) {
  check(equation.parsedEquationNumber(label)===null, `formula variable cannot become appendix tag: ${label}`);
}
for(const label of ['(A.1)','(B.3)','(C.12)','(A-1)','(AA.3)','(A1)','(B12)','(A.1a)','(a.3)']) {
  check(Boolean(equation.parsedEquationNumber(label)),`genuine appendix-family grammar preserved: ${label}`);
}
// A single bare 'J-00' or 'Q0' OCR token has no parentheses and no other
// family evidence; paired genuine A1/A2 and explicit parenthesized A1 survive.
const bare=(text)=>({page:3,ratio:.4,text,bareSource:true,explicitParenthesized:false});
const explicit=(text)=>({page:3,ratio:.4,text,bareSource:false,explicitParenthesized:true});
let index=new Map([['(J-00)',[bare('J-00')]],['(Q0)',[bare('Q 0')]],['(A1)',[explicit('(A1)')]],['(C.1)',[bare('C.1')]]]);
equation.suppressIsolatedBareAppendixTokens(index);
check(!index.has('(J-00)') && !index.has('(Q0)'), 'isolated bare symbols rejected without inventing a new appendix family');
check(index.has('(A1)') && index.has('(C.1)'), 'explicit compact / dotted genuine tags remain');
index=new Map([['(A1)',[bare('A1')]],['(A2)',[bare('A2')]],['(B-3)',[explicit('(B-3)')]]]);
equation.suppressIsolatedBareAppendixTokens(index);
check(index.size===3, 'corroborated compact family and explicit hyphen appendix survive');
check(eqSrc.includes('suppressIsolatedBareAppendixTokens(index);') && eqSrc.includes('suppressIsolatedBareAppendixTokens(assistIndex);'), 'base index and post-image OCR both validate appendix token families');

console.log(`PASS: ${checks} real-export-derived outline/equation precision and persistence assertions (not original-PDF OCR accuracy)`);
