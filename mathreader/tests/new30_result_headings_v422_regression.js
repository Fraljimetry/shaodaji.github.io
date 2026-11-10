'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'regression/fixtures/new30_result_headings_v422.json'),'utf8'));
const ctx=vm.createContext({console,document:{addEventListener(){}},Map,Set});
vm.runInContext(src,ctx,{filename:'41-equations-bibliography.js',timeout:15000});
vm.runInContext('globalThis.detect=detectedStructureResult',ctx);
for(const c of fixture.cases){
 const result=ctx.detect(c.lines,c.target_index,c.page);
 assert.equal(result?.label||'',c.expected,`${c.name} p${c.page}: ${c.lines[c.target_index].text}`);
 if(result){assert.equal(result.page,c.page);assert.ok(result.ratio>=0&&result.ratio<=1)}
}
// Non-document adversarial controls. Don't relax short subpart prose references.
const plain=(t)=>[{text:t,ratio:0.4,xStartRatio:0.14,xEndRatio:0.85,parts:[]}];
for(const t of ['Theorem 4.2(a) shows why this works.','Theorem 2.1 (a) shows that this fails.',
 'Lemma 3.1 (See above) is used later.','Theorem 5.3 (Remark on (a)) follows from the claim.']){
 assert.equal(ctx.detect(plain(t),0,5),null,`prose cannot become a result: ${t}`);
}
console.log('PASS: 6 original-PDF mathematical result headings, 4 original-PDF prose references, 4 synthetic guards');
