'use strict';
// Independently printed v414 source: Lean Quintessential Examples (original PDF,
// SHA-256 273708..., pages 57–58). Check both missing labels and negative prose.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(process.env.RESULT_SOURCE_OVERRIDE||path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const ctx=vm.createContext({document:{addEventListener(){}},console});vm.runInContext(src,ctx,{timeout:20000});
let checks=0;const yes=(text,label,page)=>{const result=ctx.detectedStructureResult([{text,ratio:.4,xStartRatio:.11,xEndRatio:.85}],0,page);assert.equal(result?.label,label,text);assert.equal(result?.page,page);checks+=2};
const no=(text)=>{assert.equal(ctx.detectedStructureResult([{text,ratio:.4,xStartRatio:.11,xEndRatio:.85}],0,50),null,text);checks++};
yes('Example 191. Prove equality by two inequalities','Example 191',57);
yes('Example 192. Prove a set inclusion elementwise','Example 192',58);
yes('Example 193. Prove function equality pointwise','Example 193',58);
yes('Example 42. Show that these two functions agree','Example 42',8);
yes('Example 190. Use library_search during exploration','Example 190',57);
yes('Example 194. Extract data before automating','Example 194',58);
for(const text of [
 'Example 191 proves equality by two inequalities.',
 'Example 192 shows the required inclusion.',
 'Example 193. Proves equality from the induction hypothesis.',
 'Theorem 4.1 proves the desired implication.',
 'Lemma 4.4 shows the condition is necessary.',
 'Example 191 of the preceding chapter is incorrect.',
 'Example 191 from page 57 is required.',
 'Example 191 (see above) gives the proof.'
]) no(text);
console.log('PASS v414 imperative examples: '+checks+' assertions');
