// v399: actual Ahlfors (172 pages) TOC-vs-body Bibliography recovery plus
// optional full seven-document PDF.js text-item regression replay.
// Large exported raw text is NOT bundled; run optional gate with:
// MATHREADER_EXPORT_CORPUS_DIR=/path/to/jsons node mathreader/tests/full_exports_outline_v399_regression.js
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.MATHREADER_OUTLINE_SOURCE||path.join(root,'js/40-outline-structure.js'),'utf8');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'regression/ahlfors_toc_source_pages_v399.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'regression/v399_seven_full_exports.json'),'utf8'));
let checks=0;const check=(ok,reason)=>{assert.ok(ok,reason);checks++};
const equal=(actual,expected,reason)=>{assert.deepEqual(actual,expected,reason);checks++};
function viewOf(p){return p?.nativePdf?.view||p?.view||[0,0,612,792]}
function itemsOf(p){return p?.nativePdf?.items||p?.items||[]}
async function replay(doc){
  const records=new Map(doc.pages.map(p=>[p.page,p]));
  const context=vm.createContext({console,document:{addEventListener(){}},pdfDoc:{numPages:doc.document.pages},
    documentOcrActive:false,sourceDocumentUsesOcr(){return false},
    async nativePageTextData(_,pageNo){const p=records.get(pageNo)||{};const view=viewOf(p);return {page:{getViewport(){return {width:view[2]-view[0],height:view[3]-view[1]}}},content:{items:itemsOf(p)}}},
    async *orderedPrefetch(items,fn){for(const item of items)yield {item,value:await fn(item)}},
    findFirstRowInYBuckets(bucket,y,tol){for(const rows of bucket.values())for(const row of rows)if(Math.abs(y-row.y)<=tol)return row;return null},
    addRowToYBuckets(bucket,row,spacing){const k=Math.round(row.y/spacing),g=bucket.get(k)||[];g.push(row);bucket.set(k,g)},
    MAX_INFERRED_OUTLINE_ENTRIES:1200});
  vm.runInContext(source,context,{timeout:20000});
  return JSON.parse(JSON.stringify(await context.detectOutlineFromTypography()));
}
(async()=>{
  const two=await replay(fixture);
  equal(two.filter(r=>/bibliography/i.test(r.title)).map(r=>r.page),[163],
    'actual source PDF.js items: front Contents folio is not Bibliography; genuine title is on page 163');
  const lastTitle=two.find(x=>x.page===163);
  check(lastTitle&&lastTitle.ratio>=0&&lastTitle.ratio<=1,'genuine heading retains measured navigation position');
  equal(two.filter(x=>/^foreword$/i.test(x.title)).map(x=>x.page),[8],
    'front-matter section on page 8 retained; page 9 smaller running head excluded');
  // Seven full exports: use original item geometry, not final filtered headings.
  const dir=process.env.MATHREADER_EXPORT_CORPUS_DIR;
  if(dir){
    let unchanged=0;
    for(const meta of manifest.exports){
      const p=path.join(dir,meta.exportFilename);
      check(fs.existsSync(p),`requested actual export found: ${meta.exportFilename}`);
      const data=fs.readFileSync(p);
      equal(require('node:crypto').createHash('sha256').update(data).digest('hex'),meta.sha256_json,
        'exact source export bytes verified before replay');
      const doc=JSON.parse(data.toString('utf8'));
      const detected=await replay({document:doc.document,pages:doc.fullDocumentText.pages});
      const expected=doc.contentDetection.structure;
      if(doc.document.pages!==172 || !/Ahlfors/.test(doc.document.name))
        equal(detected.length,expected.length,`structure count preserved: ${doc.document.name}`);
      if(doc.document.pages===172 && /Ahlfors/.test(doc.document.name)){
        equal(detected.length,expected.length-1,'one repeated running Foreword header excluded');
        const old=expected.find(x=>/bibliography/i.test(x.title));
        const now=detected.find(x=>/bibliography/i.test(x.title));
        check(old&&old.page===6&&now&&now.page===163,'Ahlfors false front-TOC bibliography moved to printed page 163');
        equal(detected.filter(x=>!/^bibliography$/i.test(x.title)).map(x=>[x.page,x.title,x.ratio]),
          expected.filter(x=>!/^bibliography$/i.test(x.title) && !(x.page===9&&/^foreword$/i.test(x.title))).map(x=>[x.page,x.title,x.ratio]),
          'all 59 other Ahlfors headings and coordinates unchanged');
        equal(detected.filter(x=>/^foreword$/i.test(x.title)).map(x=>x.page),[8],
          'page 9 running Foreword suppressed, page 8 printed Foreword kept');
      }else {
        equal(detected.map(x=>[x.page,x.title,x.ratio]),expected.map(x=>[x.page,x.title,x.ratio]),
          `no document-specific regression in ${doc.document.name}`);unchanged++;
      }
      console.log(`PASS | ${doc.document.name}: ${detected.length} Structure entries, ${doc.document.pages} exported PDF.js pages`);
    }
    equal(unchanged,6,'all six other full-document Structure indexes preserved');
  }else console.log('INFO | pass MATHREADER_EXPORT_CORPUS_DIR to replay all 595 pages');
  console.log(`PASS | ${checks} Ahlfors TOC and multi-export Structure assertions`);
})().catch(e=>{console.error(e);process.exitCode=1});
