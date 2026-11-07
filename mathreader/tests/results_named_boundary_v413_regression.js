'use strict';
// v413 source-level regression: genuine mathematical headings with a joined
// parenthetical title and statement text. Based on exact observed text from
// additional original PDFs, and negative controls for prose references.
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const src=fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const ctx=vm.createContext({console,document:{addEventListener(){}}});vm.runInContext(src,ctx,{timeout:10000});
let checks=0;
function detect(text,page=1){const line={text,ratio:.4,xStartRatio:.1,xEndRatio:.89};return ctx.detectedStructureResult([line],0,page)}
function yes(text,label,page=1){const x=detect(text,page);assert.equal(x?.label,label,`expected ${label}, got ${x?.label} for ${text}`);assert.equal(x?.page,page);checks+=2;return x;}
function no(text){assert.equal(detect(text),null,`not a new declaration: ${text}`);checks++;}
// Exact printable statements and measured positions audited in the additional corpus.
const namedLemma3=yes('Lemma 3. (Sobolev embedding theorem.)Ifk2{1; 2; : : : ;}and ifN>', 'Lemma 3', 52);
const namedLemma4=yes('Lemma 4 (Rellich’s Theorem.)Suppose\u007fis bounded, andm\u00151. Then the','Lemma 4',53);
yes('Theorem 2 (Weyl.)For\u00152R, letN\u0015denote the number of eigenvalues','Theorem 2',122);
yes('Theorem 1 (Weak maximum principle.)Suppose\u007fis bounded and letu2','Theorem 1',152);
yes('Proposition 5.3(Asymptotic flatness of the Green blow-up).In the Green-function regimes of','Proposition 5.3',13);
yes('Corollary 6.3(Green constant equals one half the mass).Under the normalization','Corollary 6.3',14);
// Missing extraction spaces after statement openers are not citation evidence.
const repeated=yes('Theorem 1.SupposeFsatisﬁes(i), (ii), and suppose also that there are no non-zero','Theorem 1',165);
assert.equal(repeated.declarationEvidence,'explicit-statement');checks++;
yes('Corollary 1.IfTWB!Bis continuous and compact, and ifT(@B)\u001aB','Corollary 1',176);
assert.equal(namedLemma3.declarationEvidence,'named');checks++;
assert.equal(namedLemma4.declarationEvidence,'named');checks++;
// Previously supported named styles must remain intact.
yes('Theorem 1(Positive mass).Let (N,g) be a complete asymptotically flat manifold','Theorem 1');
yes('Theorem 3-6 (Beurling) The function is holomorphic','Theorem 3-6');
yes('Theorem 6.2 (Corrected single-class fiber criterion). Let F be any field','Theorem 6.2');
for(const s of [
 'Theorem 2.1(a) follows by induction.',
 'Theorem 2.1 (a) follows by induction.',
 'Theorem 2.1 (part a) follows by induction.',
 'Theorem 4.1 of the cited preprint claims that the result is false',
 'Lemma 4.4 from the main obstruction.',
 'Theorem B.3 from the appendix supplies the bound',
 'Theorem 2.1 (Known result) from an earlier argument.',
 'Lemma 4.3 (Previous case) in the proof above.',
 'Lemma 4.3 (Auxiliary). therefore implies the claim',
 'Lemma 1 (named) and the next assertion',
 'Theorem 2.1(see earlier proof) implies the result',
]) no(s);
// Explicit independent headings with repeated numeric labels survive a chapter
// reset; a weak mention cannot displace a stronger printed declaration.
const accepted=Array.from(ctx.normalizeSequentialStructureEntries([
 {label:'Theorem 1',page:93,ratio:.73,declarationEvidence:'explicit-statement'},
 {label:'Theorem 1',page:152,ratio:.75,declarationEvidence:'named'},
 {label:'Theorem 1',page:165,ratio:.77,declarationEvidence:'explicit-statement'},
 {label:'Theorem 1',page:168,ratio:.50,title:'Theorem 1 above has no non-trivial solutions.'},
]));
assert.deepEqual(accepted.map(x=>x.page),[93,152,165]);checks++;
console.log(`PASS results named-heading v413: ${checks} assertions`);
