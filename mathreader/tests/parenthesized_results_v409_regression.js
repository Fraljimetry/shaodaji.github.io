// v409 print/text-layer regression: an immediately following parenthetical
// theorem name is a real label separator, but a part reference is not.
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const c=vm.createContext({console,document:{addEventListener(){}}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8'),c);
let checks=0;const eq=(a,b,n)=>{assert.equal(a,b,n);checks++};
const detect=text=>c.detectedStructureResult([{text,ratio:.3,xStartRatio:.12,xEndRatio:.85}],0,5);
for(const [text,label] of [
 ['Theorem 2.1(Theorem 3.1 in [2]).Let f be a polynomial','Theorem 2.1'],
 ['Lemma 2.2(Proposition 2.2 in [2]).If f has degree one','Lemma 2.2'],
 ['Theorem 1(Positive mass).Let ds2 be a metric','Theorem 1'],
 ['Theorem 5(Cohn-Vossen inequality).For a complete surface','Theorem 5'],
 ['Definition 1(Radon transform).For f in Cc infinity','Definition 1'],
 ['Proposition 1(Intertwining property).For f smooth','Proposition 1'],
 ['Theorem 1(Even-dimensional Radon inversion).For n=2k','Theorem 1'],
 ])eq(detect(text)?.label,label,'actual no-space title should be recognized: '+text);
for(const text of ['Theorem 2.1(a). Then the argument applies','Lemma 3.2(b) follows immediately','Theorem 7(see above) implies the result'])
 eq(detect(text),null,'part/citation cannot be confused with named declaration: '+text);
// Independent explicit named declarations can legitimately restart numbering
// in a new lecture/chapter. Never silently overwrite distinct actual printed
// entries with a document-global uniqueness assumption.
const repeated=[
 {...detect('Definition 1(Radon transform).For f smooth'),page:1,ratio:.78},
 {...detect('Definition 1(Distribution).A distribution on X'),page:8,ratio:.35},
 {...detect('Definition 1(Distribution).A distribution on X'),page:8,ratio:.38},
 {...detect('Definition 1(Distribution).A distribution is a continuous functional'),page:14,ratio:.40},
];
const normalized=Array.from(c.normalizeSequentialStructureEntries(repeated));
eq(normalized.length,3,'three actual chapter-local Definition 1 declarations preserved, duplicate same-page label removed');
eq(normalized.map(x=>x.page).join(','),'1,8,14','chapter-local repeated labels retain their own page coordinates');
console.log(`PASS ${checks} named heading and repeated chapter-local Results assertions`);
