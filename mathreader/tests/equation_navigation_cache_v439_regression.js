'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../js/41-equations-bibliography.js'), 'utf8');
function sourceOf(name, nextName) {
  const start = code.indexOf(`function ${name}(`) >= 0 ? code.indexOf(`function ${name}(`) : code.indexOf(`async function ${name}(`);
  const end = code.indexOf(`\n${nextName}`,start);
  assert(start >= 0 && end > start, `${name} source boundaries found`);
  return code.slice(code.slice(Math.max(0,start-6),start)==='async ' ? start-6 : start,end);
}
// Multiple verified observations for the same equation number are common in
// repeated numbering families and after manual page re-OCR.
{
  const fn = sourceOf('verifiedEquationNavigationTarget','function renderEquationIndex');
  const manual = new Map();
  function put(page,ratio,v386) {
    manual.set(page,{equationMarginEvidence:[{label:'(2.3)',ratio,
      marginLocationVerifiedV385:true,marginLocationVerifiedV386:v386,
      ocrGeometryMeasured:true,candidateXStartRatio:.93}]});
  }
  const context={Map,manualIndexOcrPages:manual,equationNumberingSide:'right',
    normalizedEquationLabel:s=>s,equationSourceLabelForDisplayed:s=>s};
  const locate=vm.runInNewContext(`(${fn})`,context);
  put(9,.43,false);put(90,.71,true);
  assert.equal(locate({label:'(2.3)',page:9,ratio:.45}).page,9,
    'same-page v385 occurrence outranks different-page v386 occurrence');
  put(9,.48,true);
  assert.equal(locate({label:'(2.3)',page:9,ratio:.45}).ratio,.48,
    'prefer modern page-corrected geometry on the same page');
  assert.equal(locate({label:'(2.3)',page:10,ratio:.3}).page,10,
    'ambiguous cross-page labels must not silently redirect');
  assert.equal(locate({label:'(2.3)',page:10,ratio:.3,repeatedPrintedEquation:true}).page,10);
  assert.equal(locate({label:'(2.3)',page:9,ratio:.3,manualAdd:true}).ratio,.3,
    'manual edits remain authoritative');
}
// An OCR overlay restored from persistence must override cached native rows;
// a native-only request must not be satisfied by OCR overlay rows.
(async()=>{
  const fn = sourceOf('pageTextLines','function bibliographyHeadingText');
  const lineCache = new Map();const textCache=new Map();
  const doc={};let nativeCalls=0;
  const context={pdfDoc:doc,lineCache,textCache,
    manualIndexOcrPages:new Map(),documentOcrPages:new Map(),
    sourceDocumentUsesOcr:()=>false,
    nativePageTextData:async()=>{nativeCalls++;return {page:{view:[0,0,600,800]},
      content:{items:[{str:'native',transform:[1,0,0,1,55,650],width:25,height:10}]}};},
    findFirstRowInYBuckets:()=>null, addRowToYBuckets:()=>{}};
  vm.createContext(context);
  vm.runInContext(fn,context);
  const lines=(...args)=>vm.runInContext('pageTextLines',context)(...args);
  assert.equal((await lines(1))[0].text,'native');
  context.manualIndexOcrPages.set(1,{text:'manual',lines:[{text:'manual',ratio:.2}]});
  assert.equal((await lines(1))[0].text,'manual','restored overlay wins over old cache');
  assert.equal((await lines(1,doc,lineCache,textCache,{ignoreManual:true}))[0].text,'native',
    'ignoreManual must return real native lines, not cached OCR');
  assert.equal((await lines(1))[0].text,'manual','native-only probe must not overwrite OCR cache');
  context.documentOcrPages.set(2,{text:'document OCR',lines:[{text:'document OCR',ratio:.2}]});
  context.sourceDocumentUsesOcr=page=>page===2;
  lineCache.set(2,[{text:'stale PDF native'}]);
  assert.equal((await lines(2))[0].text,'document OCR',
    'activated document OCR must override native lines cached before OCR activation');
  assert.equal((await lines(2,doc,lineCache,textCache,{ignoreManual:true}))[0].text,'native',
    'native-only indexing must bypass active full-document OCR too');
  assert.equal((await lines(2))[0].text,'document OCR',
    'native-only indexing must not overwrite current OCR evidence');
  assert.equal(nativeCalls,3);
  console.log('PASS: v439 same-page equation evidence, source-specific cache and native OCR boundaries');
})().catch(e=>{console.error(e);process.exitCode=1});
