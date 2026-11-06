// Manually checked four ORIGINAL printed PDF pages, paired with actual v393
// saved equation rows and production comparator. This is NOT formula OCR accuracy.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'regression/historical_native_pages_v394.json'),'utf8'));
const truth=JSON.parse(fs.readFileSync(path.join(root,'regression/historical_visual_equation_truth_v394.json'),'utf8'));
const src=fs.readFileSync(process.env.EQUATION_SOURCE_OVERRIDE||path.join(root,'js/41-equations-bibliography.js'),'utf8');
const context=vm.createContext({document:{addEventListener(){}},console});
vm.runInContext("let equationNumberingSide='left'; const EQUATION_TAG_SYMBOL_CLASS='*†‡';",context);
vm.runInContext(src,context,{timeout:15000});
const cmp=context.compareEquationIndexRows;
let total=0,correct=0,nonmatch=[],checks=0;
for (const page of truth.pages) {
 const exportRows=fixture.documents[page.document].observedEquationRows.filter(r=>r.page===page.page);
 const byLabel=new Map(exportRows.map(r=>[r.label,r]));
 for (const entry of page.printedTargets) {
  total++;
  const found=byLabel.get(entry.label);
  if (!found) {nonmatch.push(`${page.document} p.${page.page} ${entry.label}`);continue;}
  assert.ok(Math.abs(found.ratio-entry.approxTopRatio)<0.04,`printed location incorrect: ${page.document} p.${page.page} ${entry.label} at ${found.ratio}`);
  checks++;correct++;
 }
 const printedLabels=page.printedTargets.map(x=>x.label);
 assert.ok(exportRows.every(r=>printedLabels.includes(r.label)),`${page.document} p.${page.page}: false-positive labels against original page`);
 checks++;
 const sorted=[...exportRows].sort(cmp).map(r=>r.label);
 const printed=printedLabels.filter(x=>byLabel.has(x));
 assert.deepEqual(sorted,printed,`${page.document} p.${page.page}: printed order differs from equation index order`);
 checks++;
}
assert.ok(correct>=22 && total===23,`at least 22 of 23 independently read printed equation numbers must remain detected; got ${correct}/${total}`);checks++;
assert.deepEqual(nonmatch,['giusti p.231 (A.1)'],'Known unresolved Giusti A.1 is absent from PDF.js and has no saved OCR on p231; do not synthesize');checks++;
// Preserve old numeric fallback when OCR ratios lack directly measured x bounds.
const approximate=[{page:8,label:'(1.33)',ratio:.1},{page:8,label:'(1.21)',ratio:.9}].sort(cmp);
assert.deepEqual(approximate.map(x=>x.label),['(1.21)','(1.33)']);checks++;
console.log(`PASS ${checks} source-page equation assertions: ${correct}/${total} independently visually inspected printed labels recorded; no false positives on these four pages; missing ${nonmatch.join(', ')}`);
