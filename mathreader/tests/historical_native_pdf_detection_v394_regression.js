// Real original-PDF.js text-item replay from Giusti (1984) and Yau (1978).
// This test checks native-layer classification, NOT Tesseract/Texify accuracy.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(process.env.OUTLINE_SOURCE_OVERRIDE || path.join(root,'js/40-outline-structure.js'),'utf8');
const fixture = JSON.parse(fs.readFileSync(path.join(root,'regression/historical_native_pages_v394.json'),'utf8'));
const expected = {
 giusti: [
  [14,'Part 1 Parametric Minimal Surfaces'],
  [16,'1. Functions of Bounded Variation and Caccioppoli Sets'],
  [43,'2. Traces of B V Functions'],
  [55,'3. The Reduced Boundary'],
  [65,'4. Regularity of the Reduced Boundary'],
  [76,'5. Some Inequalities'],
  [87,'6. Approximation of Minimal Sets (I)'],
  [98,'7. Approximation of Minimal Sets (II)'],
  [110,'8. Regularity of Minimal Surfaces'],
  [117,'9. Minimal Cones'],
  [128,'10. The First and Second Variation of the Area'],
  [141,'11. The Dimension of the Singular Set'],
  [148,'Part 2 Non-Parametric Minimal Surfaces'],
  [150,'12. Classical Solutions of the Minimal Surface Equation'],
  [164,'13. The a priori Estimate for the Gradient'],
  [173,'14. Direct Methods'],
  [185,'15. Boundary Regularity'],
  [195,'16. A Further Extension of the Notion of Non-Parametric Minimal Surface'],
  [214,'17. The Bernstein Problem'],
  [231,'Appendix A'],
  [237,'Appendix B. The Distance Function'],
  [239,'Appendix C. Elliptic Equations of the Second Order'],
  [248,'Bibliography'],
  [252,'Subject Index']
 ],
 yau: [
  [1,'0. Introduction'],[4,'1. Notations and Local Formulae'],
  [8,'2. Estimates up to Second Order'],[22,'3. Third-Order Estimates'],
  [23,'4. Solution of the Equation'],
  [26,'5. Complex Monge-Ampere Equation with Degenerate Right-Hand Side'],
  [38,'6. Complex Monge-Amphe Equation with More General Right-Hand Side'],
  [47,'7. Degenerate Complex Monge-Ampere Equation w i t h General Right-Hand Side'],
  [51,'8. Complex Monge-Ampere Equations with Meromorphic Right-Hand Side'],
  [64,'9. The General Case'],[65,'Appendix A'],[69,'Appendix B'],[73,'Bibliography']
 ]
};
const forbiddenGiusti = [
 'J If.- fldx ~ 2-koc','sup{ J fdivgdx:gEC6{1Rn; IRn), lgl ~ 1}',
 '(1.13) JIIJ,,*(fq>;)- fq>;ldx < eri','off',
 'If in addition we have','n such that','A. Borel',
 'Cexp lxlz- 1','The most important step in the regularity theory for minimal sets'
];
let assertions = 0;
function equal(actual, expected, message) {assert.deepEqual(actual,expected,message); assertions++;}
async function detect(doc) {
 const records = new Map(doc.pages.map(p=>[p.page,p]));
 const sandbox = {
  console,document:{addEventListener(){}},pdfDoc:{numPages:doc.document.pages},
  documentOcrActive:false,sourceDocumentUsesOcr(){return false},
  async nativePageTextData(_,pageNo) {
    const page = records.get(pageNo) || {view:[0,0,612,792],items:[]};
    return {page:{getViewport(){return {width:page.view[2]-page.view[0],height:page.view[3]-page.view[1]}}},content:{items:page.items}};
  },
  async *orderedPrefetch(items,fn){for(const item of items) yield {item,value:await fn(item)};},
  findFirstRowInYBuckets(bucket,y,tol){for(const rows of bucket.values())for(const row of rows)if(Math.abs(y-row.y)<=tol)return row;return null;},
  addRowToYBuckets(bucket,row,spacing){const key=Math.round(row.y/spacing), group=bucket.get(key)||[];group.push(row);bucket.set(key,group);},
  MAX_INFERRED_OUTLINE_ENTRIES:1200
 };
 const context = vm.createContext(sandbox);
 vm.runInContext(src,context,{timeout:15000});
 return await context.detectOutlineFromTypography();
}
(async()=>{
 for(const [name,doc] of Object.entries(fixture.documents)) {
  const rows=await detect(doc);
  const normalized=JSON.parse(JSON.stringify(rows)).map(r=>[r.page,r.title]);
  equal(normalized,expected[name],`${name}: real PDF.js heading classification + chapter numbering + source positions; got ${JSON.stringify(normalized)}`);
  for(const [,title] of normalized) {
    equal(!/^[A-Za-z]{0,2}\s*\d*\s*(?:[=<>∑∫])/u.test(title),true,`${name}: no displayed formula promoted`);
  }
  if(name==='giusti') {
    const titles=normalized.map(([,title])=>title);
    for(const text of forbiddenGiusti) equal(titles.includes(text),false,`Giusti: reject real false Structure item ${text}`);
    equal(normalized.filter(([p,t])=>p===231&&t==='Appendix A').length,1,'Appendix A must not duplicate running header');
    equal(normalized.filter(([p,t])=>p===239&&t.startsWith('Appendix C')).length,1,'Appendix C heading reconstructed once');
    equal(normalized.filter(([p,t])=>/^\d{1,2}\.\s/.test(t)).length,17,'all 17 genuine printed Giusti chapter numbers survive');
  }
  for (const r of rows) {
    equal(Number.isFinite(r.ratio)&&r.ratio>=0&&r.ratio<=1,true,`${name}: valid page-relative navigation for ${r.title}`);
  }
  console.log(`PASS ${name}: ${rows.length} printed headings, ${doc.pages.length} sampled real PDF pages`);
 }
 console.log(`PASS ${assertions} original native-PDF-layer regression assertions; no live OCR claim`);
})().catch(e=>{console.error(e);process.exitCode=1});
