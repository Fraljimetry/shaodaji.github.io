// v429: real user-provided complex OCR strings, plus negative controls.
// This checks output validation, not live image-model transcription accuracy.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/10-formula-ocr.js'),'utf8');
const fx=require(path.join(root,'regression/fixtures/extreme_formula_ocr_v429.json'));
const names=['normalizeOcrLatex','splitTopLevelOcrAlignmentCells','formulaOcrLayoutAnomalies','repairOcrLatex','repairOcrMisplacedAlignmentTabs','repairLatexInnerTags','repairLatexSpecialCharacters','stabilizeOcrLatexSyntax','findRepeatedLatexSequence','formulaOcrEnvironmentScopeWarnings','assessImageOcrResult','imageOcrCorruptionScore'];
const chunks=names.map(n=>{
 const a=src.indexOf(`function ${n}(`);assert(a>=0,n);
 let b=src.indexOf('\nfunction ',a+1); if(b<0)b=src.length;
 return src.slice(a,b);
});
const c=vm.createContext({t:(en)=>en});vm.runInContext(chunks.join('\n'),c);
function evaluate(raw){
 c.raw=raw;
 return vm.runInContext('assessImageOcrResult(raw,stabilizeOcrLatexSyntax(repairOcrLatex(normalizeOcrLatex(raw))))',c);
}
let checks=0;
const cases=fx.cases;
assert.equal(cases.length,20);
const byId=new Map(cases.map(item=>[item.id,item]));
for(const item of cases){
 const out=evaluate(item.raw);
 assert(Array.isArray(out.reasons)&&Array.isArray(out.warnings),`${item.id}: output assessed`);
 assert.equal(out.ok,!out.hardReject,`${item.id}: no contradictory severity`);
 checks+=2;
}
const severeCases=['extreme-02','extreme-03','extreme-04','extreme-08','extreme-09'];
for(const id of severeCases){
 assert(evaluate(byId.get(id).raw).hardReject,`${id}: visibly catastrophic OCR not accepted as clean`);
 checks++;
}
// Long, dense *valid* mathematics must not be confused with decoder runaway.
for (const id of ['extreme-05','extreme-06','extreme-12','extreme-13','extreme-14','extreme-16','extreme-17','extreme-20']) {
 assert(!evaluate(byId.get(id).raw).hardReject,`${id}: long mathematics not discarded on length alone`);
 checks++;
}
const literal=String.raw;
const valid=[
 literal`\begin{array}{ccc}a&b&c\\ d&e&f\\ g&h&i\end{array}`,
 literal`\begin{array}{cccc}a&&&b\\ &c&d&\\ e&&&f\\ &g&&h\\i&&&j\\&&k&\end{array}`,
 literal`\begin{aligned}a_1&=b_1\\a_2&=b_2\\a_3&=b_3\\a_4&=b_4\\a_5&=b_5\\a_6&=b_6\\a_7&=b_7\end{aligned}`,
 literal`\begin{aligned}\nabla_m T_{j_1\ldots j_s}^{i_1\ldots i_r}&=\partial_m T_{j_1\ldots j_s}^{i_1\ldots i_r}\\ &+\sum_{n=1}^{r}\Gamma_{mk}^{i_n}T^{i_1\ldots k\ldots i_r}_{j_1\ldots j_s}\\ &-\sum_{b=1}^{s}\Gamma_{mj_b}^{k}T^{i_1\ldots i_r}_{j_1\ldots k\ldots j_s}\end{aligned}`,
];
for(const formula of valid){const q=evaluate(formula);assert(!q.hardReject,`valid dense / sparse / repeated formula remains allowed: ${formula}`);checks++;}
assert(evaluate(literal`\begin{array}{cc}a&b&c\\d&e&f\\g&h&i\end{array}`).hardReject,
 'invalid array arity is a severe output-quality error');checks++;
console.log(`PASS: ${checks} extreme formula output-quality assertions over ${cases.length} user examples + negative controls`);
