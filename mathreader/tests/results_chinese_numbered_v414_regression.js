'use strict';
// v414 original 22-page Chinese real-analysis PDF: printed theorem on page 8.
// This is tightly bounded numbered-heading recognition, not general Chinese OCR.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const src=fs.readFileSync(process.env.RESULT_SOURCE_OVERRIDE||path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const ctx=vm.createContext({console,document:{addEventListener(){}}});vm.runInContext(src,ctx,{timeout:15000});
let checks=0;
function get(text,page=8){return ctx.detectedStructureResult([{text,ratio:.347,xStartRatio:.1,xEndRatio:.88}],0,page)}
function yes(text,label,page=8){const r=get(text,page);assert.equal(r?.label,label,text);assert.equal(r?.page,page);checks+=2}
function no(text){assert.equal(get(text),null,text);checks++}
yes('定理4.1 (Egorov). 设µ(E) < ∞，且fn →f 在E 上几乎处处成立。则对任意δ > 0，存在可测集','定理 4.1');
yes('引理 2.3. 若函数 f 可积，则积分存在','引理 2.3',3);
yes('命题 1.2：设 x 为实数，若 x > 0，则有 x² > 0','命题 1.2',2);
yes('定义 5.1。称满足条件的集合为可测集','定义 5.1',6);
for(const t of [
 '定理4.1说明了逐点收敛和一致收敛的关系',
 '定理4.1 (Egorov). 参见前文证明',
 '定理4.1 (见上文). 设 x 为实数',
 '定理 4.1 在第八页已经证明',
 '定理 4.1',
 '例：L1 积分的绝对连续性',
 '定理 1.2. 这说明上文的结论',
 'Theorem 4.1 of the cited preprint claims that...',
]) no(t);
console.log(`PASS v414 conservative Chinese numbered Results: ${checks} assertions`);
