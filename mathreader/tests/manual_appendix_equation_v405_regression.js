'use strict';
// v405: manual additions/reselections accept *observed* appendix labels; automatic detector unchanged.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const equationSource = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const editSource = fs.readFileSync(path.join(root, 'js/20-selection-annotations.js'), 'utf8');
function extract(source, name) {
  const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(match, `found ${name}`);
  return match[0];
}
let assertions = 0;
function check(value, note) { assert.ok(value, note); assertions++; }
const names = ['normalizeEquationTagCommands','normalizedEquationLabel','isSymbolicEquationTagInner',
 'isLikelyCalendarYearEquationLabel','compactNumericEquationTagInner','isPlausibleNumericEquationTagInner',
 'isPlausibleAppendixEquationTagInner','isPlausibleEquationTagInner'];
const context = vm.createContext({
  EQUATION_TAG_SYMBOL_CLASS:'*†‡',
  equationEdits:[], equationManualOrder:['label:(17.1)'],
  pendingEquationAddKey:'(17.1)', pendingEquationReselectKey:null,
  pendingOutlineReselectKey:null,
  window:{prompt:()=>'(A.1)'},
  t: en => en,
  showError: message => {context.lastError=message},
  persistDocumentState: () => {context.persistCount++},
  refreshEquationIndexAfterManualEdit: async () => {context.refreshCount++},
  refreshSelectionUI: () => {},
  equationLabelNearPagePoint: async () => null,
  pageTextLines:async()=>[],
  equationNumberingSide:'left',
  persistCount:0,refreshCount:0,lastError:null,
});
vm.runInContext([...names.map(name=>extract(equationSource,name)),
 ...['equationLabelFromSelectionText','equationSourceLabelForDisplayed','equationEditTargetFromPending',
 'equationOrderKeyFromRef','insertEquationManualOrderAfter','pendingEquationDisplayedLabel',
 'applyEquationPointCorrection','applyEquationLinkCorrection','applyEquationEdits'].map(name=>extract(editSource,name))].join('\n'),context);
const run = script => vm.runInContext(script,context);
for (const label of ['(A.1)','(A.10)','(A.1.2)','(B-3)','(A1)','(AA.5)','(C.2a)','(a.4)',
 '(17.11)','(7)','(*)','(†)','(\\dagger)']) {
  context.label=label;
  check(run('equationLabelFromSelectionText(label)') === run('normalizedEquationLabel(label)'),`manual label ${label}`);
}
for (const bad of ['(A)','(ABCD.2)','(A.)','(A-)', '(B.2.3.4.5)','(2023)','(Axyz)',
 '(n-1)','(x+1)','(x)','A.1','(Theorem A.1)','(1 2)','()']) {
  context.label=bad;
  check(run('equationLabelFromSelectionText(label)') === null,`reject non-tag ${bad}`);
}
check(run("equationLabelFromSelectionText('（Ａ．１）')")==='(A.1)','Unicode full-width tag normalized');
(async()=>{
  // Simulate the real Equation row > Add > click page > manually type (A.1) path.
  check(await run('applyEquationPointCorrection(231,0.43)')===true,'point correction handled');
  check(context.equationEdits.length===1,'one manual add created');
  check(context.equationEdits[0].label==='(A.1)' && context.equationEdits[0].page===231
    && context.equationEdits[0].ratio===.43,'appendix label and clicked coordinate recorded');
  check(context.equationManualOrder.join('|')==='label:(17.1)|edit:'+context.equationEdits[0].id,
    'manual placement after chosen equation preserved');
  check(context.persistCount===1 && context.refreshCount===1,'manual edit persisted and sidebar refreshed');
  context.baseIndex=new Map([['(17.1)',[{page:220,ratio:.2}]]]);
  const displayed=run('applyEquationEdits(baseIndex)');
  check(displayed.get('(A.1)')[0].page===231 && displayed.get('(A.1)')[0].manualAdd,
    'appendix manual add survives index rebuilding');
  // Subsequent user reselect must preserve the added entry's appendix label.
  context.pendingEquationReselectKey=`edit:${context.equationEdits[0].id}`;
  context.text='(A.1)';
  check(run('applyEquationLinkCorrection(text,231,0.45)')===true,'select-text correction accepts appendix tag');
  check(context.equationEdits[0].label==='(A.1)'&&context.equationEdits[0].ratio===.45,
    'manual appendix navigation position can be corrected');
  // Invalid manual input must not publish or discard the pending Add selection.
  context.pendingEquationAddKey='(17.1)';context.window.prompt=()=>'(n-1)';
  check(await run('applyEquationPointCorrection(235,.5)')===true,'invalid prompt is handled');
  check(context.equationEdits.length===1 && context.pendingEquationAddKey==='(17.1)' && !!context.lastError,
    'invalid formula variable not added as equation label');
  console.log(`PASS: ${assertions} manual appendix equation add/reselect/guard assertions`);
})().catch(error=>{console.error(error);process.exitCode=1});
