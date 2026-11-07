'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const ctx = vm.createContext({console, document:{addEventListener() {}}});
vm.runInContext(src, ctx, {timeout:10000});
function detect(text, page=22) {
  const line={text, page, ratio:.31, xStartRatio:.1, xEndRatio:.85};
  return vm.runInContext('detectedStructureResult('+JSON.stringify([line])+',0,'+page+')', ctx, {timeout:3000});
}
let checks=0;
function isResult(text,label,page=22) {
  const x=detect(text,page);
  assert.equal(x?.label,label,`${text} should recognize ${label}; received ${x?.label}`);
  assert.equal(x.page,page); ++checks;
}
function notResult(text){ assert.equal(detect(text),null,`false declaration from ${text}`); ++checks; }
// Real native PDF text-layer strings, independently inspected against the
// printed theorem/lemma headings in Lee & Parker, Yamabe Problem.
isResult('THEOREM2.3(AUBIN[Al]).Let M be a compact Riemannian manifold with','Theorem 2.3',9);
isResult('LEMMA3.5.Supposek> —n. Then asa-» 0,','Lemma 3.5',15);
isResult('THEOREM5.1(CONFORMAI, NORMAL COORDINATES).Let M be a Riemannian','Theorem 5.1');
isResult('THEOREM5.2.Let PeM,k^0,andletThea symmetric(k+2)-tensoron','Theorem 5.2',23);
isResult('LEMMA5.3.Theeigenvaluesofr2k0on@mare','Lemma 5.3',23);
isResult('DEFINITION6.2.Suppose (M, g) is a compact Riemannian manifold with','Definition 6.2',28);
isResult('THEOREM9.2(WEIGHTED ELLIPTIC REGULARITY).Let (N9g) be asymptoti-','Theorem 9.2',40);
isResult('THEOREM10.1(POSITIVE MASS THEOREM).Let (N,g)','Theorem 10.1',44);
isResult('LEMMA10.6.UnderthehypothesesofTheorem10.1,m(g)> 0.','Lemma 10.6',46);
// Ordinary compact prose references must not become Results, even when a
// line starts at a result keyword and has a period or no intervening space.
notResult('Lemma 3.5 therefore shows that');
notResult('Theorem 5.1 then implies the desired result.');
notResult('THEOREM5.1 shows the assertion.');
notResult('LEMMA3.5 therefore shows that');
notResult('Theorem5.1 gives another proof of the claim.');
notResult('THEOREM5.1 from the previous chapter.');
notResult('Theorem 5.1(a) follows by induction.');
notResult('THEOREM5.1(a) follows by induction.');
// A mathematical superscript fragment may intervene between a prose reference
// and its final wrapped lemma label. This is an actual false Lemma 9.1 on
// Yamabe PDF p40; the printed declaration is on p39.
const wrappedWithSuperscript = [
  {text:"approach fails. Instead, note that ... for any q > 1, e > 0 by",ratio:.8513,xStartRatio:.134,xEndRatio:.885},
  {text:'T 1+e',ratio:.8588,xStartRatio:.561,xEndRatio:.607},
  {text:'Lemma 9.1. If we set ft = ...',ratio:.8680,xStartRatio:.134,xEndRatio:.886}
];
ctx.superscriptRows = wrappedWithSuperscript;
assert.equal(vm.runInContext('detectedStructureResult(superscriptRows,2,40)',ctx),null,'superscript may not mask prose reference');
++checks;
// An actual numbered declaration with no reference lead remains accepted.
const realLemmaRows = wrappedWithSuperscript.map(x=>({...x}));
realLemmaRows[0].text='The following statement is useful.';
ctx.realLemmaRows=realLemmaRows;
assert.equal(vm.runInContext('detectedStructureResult(realLemmaRows,2,39)',ctx)?.label,'Lemma 9.1');
++checks;
console.log(`Results joined-heading v412: ${checks} assertions passed`);
