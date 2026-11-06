'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const eq=fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const nav=fs.readFileSync(path.join(root,'js/30-rendering-navigation.js'),'utf8');
function extract(source,name) {
 const match=source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`,'m'));
 assert.ok(match,`found ${name}`);return match[0];
}
let n=0;const check=(x,m)=>{assert.ok(x,m);n++;};
// Giusti's ORIGINAL 1984 PDF, page 222 (printed p.209), includes a genuine
// (17.11) in the left margin near y=531 px on a 615px PDF page. At 3x
// rasterization Tesseract 5.5 recognized '(17.11)' at y=1605 / 1844.
const ratio=1605/1844;
check(ratio>.86&&ratio<.88,'true 17.11 OCR y is near bottom, not page midline');
const c=vm.createContext({
 normalizedEquationLabel:v=>'('+String(v||'').replace(/^\(|\)$/g,'')+')',
 equationSourceLabelForDisplayed:v=>v,
 equationNumberingSide:'left'
});
vm.runInContext(`${extract(eq,'verifiedEquationNavigationTarget')}
var manualIndexOcrPages=new Map([
 [222,{equationMarginEvidence:[{label:'(17.11)',ratio:${ratio},candidateXEndRatio:0.15,marginLocationVerifiedV385:true,ocrGeometryMeasured:true}]}]
]);`,c);
const resolve=e=>{c.item=e;return vm.runInContext('verifiedEquationNavigationTarget(item)',c);};
const at=(e)=>{const a=resolve(e);return [a.page,a.ratio];};
check(at({label:'(17.11)',page:222,ratio:.48})[1]===ratio,'new measured ratio supersedes stale earlier same-page target');
check(at({label:'(17.11)',page:209,ratio:.37})[0]===222,'unique vetted source page supersedes stale earlier page');
check(at({label:'(17.11)',page:222,ratio:.87,manualEditId:'manual-1'})[1]===.87,'explicit user correction remains authoritative');
check(at({label:'(17.12)',page:223,ratio:.3})[0]===223,'unrelated labels do not change');
vm.runInContext(`manualIndexOcrPages.get(222).equationMarginEvidence.push({label:'(17.11)',ratio:.91,candidateXEndRatio:.25,marginLocationVerifiedV385:true,ocrGeometryMeasured:true})`,c);
check(at({label:'(17.11)',page:222,ratio:.48})[1]===ratio,'outermost measured margin target wins same-page conflict');
vm.runInContext(`manualIndexOcrPages.set(224,{equationMarginEvidence:[{label:'(17.11)',ratio:.45,marginLocationVerifiedV385:true,ocrGeometryMeasured:true}]})`,c);
check(at({label:'(17.11)',page:210,ratio:.6})[0]===210,'ambiguous different verified pages never cause guessed cross-page jump');
check(at({label:'(17.11)',page:224,ratio:.6})[0]===224,'same-page verified evidence wins even with other verified pages');
vm.runInContext('manualIndexOcrPages.clear()',c);
check(at({label:'(17.11)',page:222,ratio:.57})[1]===.57,'no OCR evidence leaves existing index untouched');
check(nav.includes('alignReaderNavigationToSurface(next, localRatio, targetLead);'),'viewport correction is called on target navigation');
check(nav.includes('if (!stillCurrent()) return;'),'old asynchronous navigation cannot overtake new click');
check(eq.includes('verifiedEquationNavigationTarget(entry); await goToMatchedLocation'),'Equations sidebar uses verified target, not stale row coordinate');
// Rescanning the same physical label replaces its obsolete measured target
// while keeping unrelated equations and page text. Run actual merge code.
const mergeContext=vm.createContext({});
vm.runInContext(extract(fs.readFileSync(path.join(root,'js/00-core.js'),'utf8'),'mergePageIndexOcrEvidence'),mergeContext);
mergeContext.existing={page:222,lines:[],words:[],equationMarginEvidence:[
 {page:222,label:'(17.11)',ratio:.57,marginLocationVerifiedV385:true},
 {page:222,label:'(17.12)',ratio:.35,marginLocationVerifiedV385:true}
]};
mergeContext.incoming={page:222,lines:[],words:[],equationMarginEvidence:[
 {page:222,label:'(17.11)',ratio,marginLocationVerifiedV385:true,marginLocationVerifiedV386:true}
]};
const merged=vm.runInContext('mergePageIndexOcrEvidence(existing,incoming)',mergeContext);
check(merged.equationMarginEvidence.length===2,'new v386 geometry replaces only the old same-label position');
check(merged.equationMarginEvidence.some(x=>x.label==='(17.11)'&&x.ratio===ratio),'corrected v386 y-ratio survives evidence merge');
check(merged.equationMarginEvidence.some(x=>x.label==='(17.12)'),'other equation labels retained');
mergeContext.existing=merged;
mergeContext.incoming={...mergeContext.incoming,equationMarginEvidence:[{...mergeContext.incoming.equationMarginEvidence[0],ratio:ratio+.002}]};
const rescanned=vm.runInContext('mergePageIndexOcrEvidence(existing,incoming)',mergeContext);
check(rescanned.equationMarginEvidence.length===2,'repeated v386 scan is idempotent');
check(rescanned.equationMarginEvidence.find(x=>x.label==='(17.11)').ratio===ratio+.002,'freshest same-label measurement replaces older v386 ratio');
console.log(`PASS: ${n} v386 meticulous OCR equation-navigation regression assertions`);
