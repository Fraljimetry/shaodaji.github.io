'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'js/70-command-ui-runtime.js'), 'utf8');
const style = fs.readFileSync(path.join(root, 'mathreader.css'), 'utf8');
let count = 0;
const check = (test, name) => { assert.ok(test, name); count++; };
const get = (name) => {
  const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(match, `find implementation: ${name}`);
  return match[0];
};
const names = [
  'normalizeEquationTagCommands', 'normalizedEquationLabel','isSymbolicEquationTagInner',
  'isLikelyCalendarYearEquationLabel','compactNumericEquationTagInner','isPlausibleNumericEquationTagInner',
  'isPlausibleAppendixEquationTagInner','isPlausibleEquationTagInner','isEquationLabelQuery',
  'parsedEquationNumber','equationCandidateAttachedToFunctionCall','equationLabelCandidatesInLine',
  'equationReferenceProseContext','compareEquationIndexRows'
];
const ctx = vm.createContext({
  EQUATION_TAG_SYMBOL_CLASS: '*†‡',
  equationNumberingSide: 'left',
  equationSourceLabelForDisplayed: (s) => s,
  t: (en) => en,
});
vm.runInContext(names.map(get).join('\n'), ctx);
const f = (name) => vm.runInContext(name, ctx);
const candidates = f('equationLabelCandidatesInLine');
const parsed = f('parsedEquationNumber');
const query = f('isEquationLabelQuery');
const ref = f('equationReferenceProseContext');
const compare = f('compareEquationIndexRows');
// Real appendix numbering styles in mathematics: both delimited and compact.
for (const [tag, prefix, last, separator, suffix] of [
  ['(A.1)', 'A', 1, '.', ''],
  ['(A.10)', 'A', 10, '.', ''],
  ['(B-3)', 'B', 3, '-', ''],
  ['(A1)', 'A', 1, '', ''],
  ['(AA.5)', 'AA', 5, '.', ''],
  ['(A.1.2)', 'A.1', 2, '.', ''],
  ['(C.2a)', 'C', 2, '.', 'a'],
  ['(a.4)', 'a', 4, '.', ''],
  ['(17.11)', '17', 11, '.', ''],
]) {
  const value = parsed(tag);
  check(value && value.prefix === prefix && value.last === last && value.separator === separator && value.suffix === suffix, `parse ${tag}`);
  check(query(tag), `query routes ${tag} to equation navigation`);
  check(candidates(`  ${tag}   f(x) = 0`).some((candidate) => candidate.label === tag), `scan ${tag} from mathematical display`);
}
// Paired negative controls: arbitrary letters, headings, years, function calls.
for (const invalid of ['(Appendix A)','(Figure A.1)','(A)','(ABCD.2)','(A.)','(A-)', '(B.2.3.4.5)','(2023)','(Axyz)']) {
  check(!query(invalid), `ignore non-equation label ${invalid}`);
  check(candidates(`${invalid} is discussed here`).length === 0, `no inferred equation from ${invalid}`);
}
check(candidates('g(A.1)').some(x=>x.attachedFunctionCall),'formula function call remains marked as attached, not a target');
check(candidates('equation (A.1) and (B.4)').map(x=>x.label).join('|') === '(A.1)|(B.4)','references visible as query candidates but not indexed blindly');
for (const phrase of ['From (A.1) we get...', 'see (B-3)', 'equation (A1) describes...', '(A.2) implies convergence']) {
  check(ref(phrase), `appendix prose citation demoted: ${phrase}`);
}
check(!ref('(A.1)    f(x) = g(x) + h(x)'), 'display equation is not prose citation');
check(candidates('(A.1) 𝑓(x) = 0')[0].index === 0,'UTF-16 source offsets survive mathematical alphabets');
check(candidates('AA.3 f(x) = 0').some(x=>x.bare && x.label === '(AA.3)'),'bare appendix label considered only as conservative candidate');
check(candidates('A1').some(x=>x.bare && x.label === '(A1)'),'standalone compact appendix label is considered');
check(!candidates('A1 is a matrix').some(x=>x.bare),'compact appendix identifier in prose not a bare tag');
const samePage = [
  {page:22,ratio:.90,label:'(A.10)'},{page:22,ratio:.12,label:'(A.2)'},
  {page:21,ratio:.60,label:'(17.11)'},{page:23,ratio:.10,label:'(B.1)'},
  {page:22,ratio:.44,label:'(A.1)'},{page:22,ratio:.20,label:'(A.2a)'},
  {page:22,ratio:.50,label:'(A.2b)'}
].sort(compare);
check(samePage.map(x=>x.label).join(',') === '(17.11),(A.1),(A.2),(A.2a),(A.2b),(A.10),(B.1)',
      `appendix family numerical sorting despite imperfect OCR ratios: ${samePage.map(x=>x.label)}`);
// Preservation and safety gates against the concrete omission in v387.
check(/isPlausibleEquationTagInner\(normalizedEquationLabel\(evidence\.label\)\.slice\(1, -1\)\)/.test(source),
      'manual meticulous-page evidence can contribute alpha-numbered equations');
check(/if \(numeric\?\.appendix\) return null;/.test(source),'digit-only OCR retry must not invent A.1 from a 1.1 observation');
check(/const displayRows = equationTextFilter/.test(source),'text filter includes appendix entries beyond first batch');
check(/renderedRows \+ \(renderedRows === 0 \? initialBatchSize : 500\)/.test(source),'unbounded index is paged rather than truncated');
check(/equationIndex\.onscroll = \(\) =>/.test(source) && /moreButton\.addEventListener\('click', appendEquationRows\)/.test(source),
      'scroll or explicit action loads all remaining equations, not first 500 only');
check(ui.includes("input.id === 'map-filter-equations') renderEquationIndex()"), 'filter triggers full search across indexed but unrendered rows');
check(core.includes('const EQUATION_INDEX_SUMMARY_VERSION = 24;'),'old numeric-only equation summary is invalidated once');
check(style.includes('.equation-force-ocr:disabled'), 'OCR control has compact disabled styling');
// Reopening the PDF must retain exact appendix identities and navigation geometry.
const getCore = (name) => {
  const match = core.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(match, `find core function: ${name}`);
  return match[0];
};
const cacheCtx = vm.createContext({
  normalizedEquationLabel: (s) => String(s),
  EQUATION_INDEX_SUMMARY_VERSION: 24,
});
vm.runInContext(getCore('snapshotEquationIndexForPersistence')+'\n'+getCore('restoreEquationIndexFromPersistence')+'\n'+getCore('mergePageIndexOcrEvidence'), cacheCtx);
const original = {label:'(A.3)',page:240,ratio:.43,confidence:26,meticulousPageVerified:true,ocrGeometryMeasured:true,marginLocationVerifiedV385:true,marginLocationVerifiedV386:true};
cacheCtx.original = original;
const snapshot = vm.runInContext("snapshotEquationIndexForPersistence(new Map([['(A.3)',[original]]]))",cacheCtx);
check(snapshot?.rows?.length===1 && snapshot.rows[0].label==='(A.3)', 'appendix equation is saved by label');
cacheCtx.snapshot=snapshot;
const restored=vm.runInContext('restoreEquationIndexFromPersistence(snapshot)',cacheCtx);
check(restored.get('(A.3)')?.[0].ratio===.43, 'reopening restores appendix equation navigation ratio');
check(restored.get('(A.3)')?.[0].marginLocationVerifiedV386===true,'reopening restores vetted navigation provenance');
const merge=vm.runInContext('mergePageIndexOcrEvidence', cacheCtx);
const older={page:240,lines:[],words:[],equationMarginEvidence:[original,{label:'(A.2)',page:240,ratio:.25}]};
const newScan={page:240,lines:[],words:[],equationMarginEvidence:[{...original,ratio:.45}]};
const twice=merge(merge(older,newScan),newScan);
check(twice.equationMarginEvidence.filter(x=>x.label==='(A.3)').length===1, 'repeated meticulous OCR does not duplicate (A.3)');
check(twice.equationMarginEvidence.some(x=>x.label==='(A.2)'), 'repeat scan never erases an earlier appendix label');
check(merge(older,{page:240,lines:[],words:[],equationMarginEvidence:[]}).equationMarginEvidence.length===2,'missing appendix tag on next OCR pass does not delete the old one');
console.log(`PASS: ${count} appendix equation OCR / numbering / navigation / pagination assertions`);
