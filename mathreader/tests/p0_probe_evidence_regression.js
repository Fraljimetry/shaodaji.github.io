// v359: test-only P0 browser probe geometry/crop checks with mocked canvas.
// These are unit tests: never pass off the mocked PDF as a genuine PDF.js test.
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {join}=require('node:path');
const script = fs.readFileSync(join(__dirname,'../regression_tools/p0_browser_probe.js'),'utf8');
const canvas = () => ({width:0,height:0,getContext(){return {fillRect(){},drawImage(){},fillStyle:''}},toDataURL(){return 'data:image/png;base64,'+Buffer.from('fake png crop').toString('base64')}});
const mockPage={getViewport:({scale})=>({width:100*scale,height:100*scale}),render:()=>({promise:Promise.resolve()})};
const document={createElement:()=>canvas()};
const c={window:{},document,crypto:crypto.webcrypto,atob:(s)=>Buffer.from(s,'base64').toString('binary'),
  pdfDoc:{numPages:1, getPage:async()=>mockPage}, currentFileKey:'source', currentFileName:'source.pdf',
  currentPage:1,pdfjsLib:{version:'4.10.38'},readingFlow:'single',
  inferredOutline:[],structureEntries:[],bibliographyEntries:[],
  equationLabelIndex:new Map([['(1)',[{page:1,ratio:NaN},{page:1},{page:1,ratio:0},{page:1,ratio:.37}]]]),
  inferredOutlineDetectionDone:true,inferredOutlineBuildPromise:null,
  structureIndexVersion:5,STRUCTURE_INDEX_VERSION:5,structureIndexBuilding:false,
  equationIndexBuildPromise:null,mathOcrPipeline:null,mathOcrLoading:false,
  mathOcrInitializationFailed:false,mathOcrBackend:null,formulaOcrInitModalVisible:false,
  currentOcrResult:null, recognizeImageFallbackCrop(){throw new Error('Crop-only must not launch model');}};
vm.createContext(c);
vm.runInContext(script,c);
vm.runInContext(`equationLabelIndex = new Map([['(1)', [{page:1,ratio:NaN},{page:1},{page:1,ratio:0},{page:1,ratio:.37}]]])`, c);
const ratios=Array.from(c.window.__mathreaderP0.snapshot().indexes.equations, r=>r.ratio);
assert.deepEqual(ratios,[null,null,0,.37]);
c.window.__mathreaderP0.imageFormulaCase({id:'F1',page:1,rectPdfPt:[10,10,40,40],cropOnly:true}).then(rec=>{
  assert.equal(rec.origin,'original_pdf_browser_crop');
  assert.equal(rec.compiled,false);
  assert.equal(rec.crop_sha256,crypto.createHash('sha256').update('fake png crop').digest('hex'));
  assert.ok(rec.crop_png_data_url.startsWith('data:image/png;base64,'));
  console.log('OK: 5 test-only P0 probe evidence checks');
}).catch(e=>{console.error(e);process.exitCode=1});
