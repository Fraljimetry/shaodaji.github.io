// v399: evidence-linked proof-reference precision regression.
// Tests six false matches extracted from seven real user PDF.js exports. Optional
// full corpus: MATHREADER_EXPORT_CORPUS_DIR=/path/to/jsons node <this file>
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(process.env.MATHREADER_RESULT_SOURCE || path.join(root,'js/41-equations-bibliography.js'),'utf8');
const outline = fs.readFileSync(path.join(root,'js/40-outline-structure.js'),'utf8');
const found = outline.match(/const STRUCTURE_REFERENCE_RE = ([^;]+);/);
assert(found, 'use production Results reference grammar');
const refRe = vm.runInNewContext(found[1]);
const ctx = vm.createContext({console, document:{addEventListener(){}}, setTimeout});
vm.runInContext(source,ctx,{timeout:15000});
let checks=0;
function check(ok,reason){assert.ok(ok,reason);checks++;}
function equal(a,b,reason){assert.deepEqual(a,b,reason);checks++;}
const normalize = (text) => ctx.normalizedStructureResultReference(text);
const mapOf = (labels) => new Map(labels.map(label=>[normalize(label),{label}]));
const credible = (owner, labels) => Array.from(ctx.credibleStructureProofReferences(owner,mapOf(labels)));
const summary=JSON.parse(fs.readFileSync(path.join(root,'regression/v399_seven_full_exports.json'),'utf8'));
check(summary.exports.length===7,'seven distinct user-supplied real reading-data exports');
check(summary.exports.reduce((n,x)=>n+x.pdfPages,0)===595,'595 original PDF pages in seven exports');
check(summary.exports.every(x=>x.exportedPages===x.pdfPages),'all PDF pages represented in export evidence');
check(summary.exports.every(x=>x.fullDocumentOcr==='not-stored'),'no saved full-document OCR output: do not misreport native text as recognition accuracy');
const samples = [
 ['Note that the example u = r on Euclidean space shows that the hy-', 'example u'],
 ['Now suppose X(M) > 0; by the above remark X s > 0 for 2 < 5 < p.', 'remark X'],
 ['Existence on the sphere. It is important to note that the hypothesis X(M) <', 'hypothesis X'],
 ['By assumption f maps .1 into n O •l • By Theorem 1-7 we therefore', 'assumption f'],
 ['From the De theorem e. or we have', 'theorem e'],
 ['Arzela theorem a subsequence, that we shall again denote by Uj, will converge', 'theorem a'],
];
for (const [text, bogus] of samples) {
  refRe.lastIndex=0;
  check((text.match(refRe)||[]).some(x=>x.toLowerCase()===bogus.toLowerCase()),`actual extracted PDF text triggers original overbroad grammar: ${bogus}`);
  equal(credible({label:'Theorem 7',proofReferences:[bogus]}, []),[],`reject unresolved variable/prose ${bogus}`);
}
for (const entry of summary.exports) {
  for (const suspect of entry.suspectUnresolvedLetterReferences) {
    equal(credible({label:suspect.owner,proofReferences:[suspect.ref]}, []),[],
      `real ${entry.document}: remove nonresult ${suspect.ref}`);
  }
}
equal(credible({label:'Proposition 3',proofReferences:['theorem A','Theorem A','Theorem 4.1']},['Theorem A','Theorem 4.1']),
  ['Theorem A','Theorem 4.1'],'declared lettered theorem stays; case duplicates collapse; numeric target retained');
equal(credible({label:'Theorem C.11',proofReferences:['Theorem C.lO','Theorem C.10','Theorem C.l']},['Theorem C.10','Theorem C.1']),
  ['Theorem C.10','Theorem C.1'],'Giusti original OCR glyph l/O resolved only against genuine appendix Results');
equal(credible({label:'Theorem 10',proofReferences:['Lemma 12.5','THEOREM 137','Theorem 11']},[]),
  ['Lemma 12.5','THEOREM 137','Theorem 11'],'unresolved numeric references retained for audit; no gap filling');
equal(credible({label:'Lemma 2.4',proofReferences:['Lemma 2.4','lemma 2.4']},['Lemma 2.4']),[], 'no self-dependency or duplicates');
check(source.includes('owner.proofReferences = credibleStructureProofReferences(owner, structureByLabel)'),
  'production builder applies filter before linking proof graph');
let replayed=0,eliminated=0,kept=0,resolvedBefore=0,resolvedAfter=0;
const dir=process.env.MATHREADER_EXPORT_CORPUS_DIR;
if(dir){
  for(const data of summary.exports){
    const p=path.join(dir,data.exportFilename);
    check(fs.existsSync(p), `missing requested original export ${p}`);
    const bytes=fs.readFileSync(p);
    equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),data.sha256_json,
      `${data.document} identical to original captured source; do not use edited/generic files`);
    const document=JSON.parse(bytes.toString('utf8'));
    const rows=document.contentDetection.results;
    const byLabel=mapOf(rows.map(x=>x.label));
    equal(rows.length,data.results,`${data.document} number of recorded Results unchanged`);
    for(const row of rows){
      const refs=row.proofReferences||[];
      const filtered=Array.from(ctx.credibleStructureProofReferences(row,byLabel));
      eliminated += refs.length-filtered.length;
      kept += filtered.length;
      for(const ref of refs)if(byLabel.has(normalize(ref))) resolvedBefore++;
      for(const ref of filtered)if(byLabel.has(normalize(ref)))resolvedAfter++;
      // All positively resolved relationships must survive, including targets
      // written with PDF text-layer O/1/l confusables.
      const before=new Set(refs.map(normalize).filter(key=>byLabel.has(key) && key!==normalize(row.label)));
      const after=new Set(filtered.map(normalize).filter(key=>byLabel.has(key) && key!==normalize(row.label)));
      equal([...after].sort(),[...before].sort(),`${data.document}: preserve all resolved proof links of ${row.label}`);
      replayed++;
    }
  }
  check(eliminated>=6,'all six known false reference matches are removed by actual seven-export replay');
  console.log(`PASS | seven real full exports ${replayed} Results replayed; ${eliminated} unconfirmed/self/duplicate proof matches removed; ${resolvedBefore}/${resolvedAfter} resolved link occurrences before/after`);
}else console.log('INFO | original large JSONs not bundled; pass MATHREADER_EXPORT_CORPUS_DIR to replay them');
console.log(`PASS | ${checks} proof-reference precision assertions; full-document OCR accuracy not claimed`);
