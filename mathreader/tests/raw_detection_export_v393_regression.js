'use strict';
// Raw evidence must be genuinely pre-classification, page-complete, isolated
// by PDF identity, export-only and independent of starting a new OCR run.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '../js/60-notes-bookmarks-data.js'), 'utf8');
const core = fs.readFileSync(path.join(__dirname, '../js/00-core.js'), 'utf8');
function extract(source, name, isAsync = true) {
  const re = new RegExp(`${isAsync ? 'async ' : ''}function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm');
  const result = source.match(re);
  assert.ok(result, `missing ${name}`);
  return result[0];
}
function deferred() { let resolve; const promise = new Promise((r) => {resolve = r;}); return {promise, resolve}; }
function clone(value, fallback = null) { try {return JSON.parse(JSON.stringify(value));} catch (_) {return fallback;} }
function pdf(pages = 2) {return {numPages: pages};}
let checks = 0;
function verify(cond, note) {assert.ok(cond, note); checks += 1;}
function fixture() {
  const doc = pdf();
  const ctx = {
    pdfDoc: doc, currentFileKey: 'sha256:document-a',
    documentOcrActive: true,
    documentOcrPages: new Map([[1, {page: 1, text: 'ocr text', lines: [{text: 'ocr text', ratio: 0.3}], words: [{text: 'ocr'}], ocrRawText: 'ocr  text\n'}]]),
    manualIndexOcrPages: new Map([[2, {page: 2, text: 'meticulous', lines: [{text: 'meticulous', ratio: 0.5}], words: [{text:'meticulous'}]}]]),
    loadEquationMarginOcrEvidence: async () => false,
    equationMarginEvidenceRecords:()=>[],persistEquationMarginOcrEvidence:async()=>true,
    equationSupplementalOcrCache: new Map([
      ['sha256:document-a|left|1', [{text:'(1.2)', ratio:0.2}]],
      ['sha256:document-a|right|2', [{text:'(1.3)', ratio:0.5}]],
      ['sha256:document-b|left|1', [{text:'FOREIGN', ratio:0.9}]],
      ['sha256:document-a|left|999', [{text:'OUT OF RANGE', ratio:0.9}]],
      ['sha256:document-a|left|3', Promise.resolve([])]
    ]),
    jsonClone: clone, Map,
    console, setTimeout,
    nativePageTextData: async (d, n) => ({
      page: {view: [0, 0, 612, 792]},
      content: {items:[
        {str: `Heading ${n}`, transform: [1,0,0,1,22,740], width:32, fontName:'F1', hasEOL:true},
        {str:`Equation (${n}.1)`, transform:[1,0,0,1,25,700], width:50, fontName:'F2'}
      ], styles: {F1:{fontFamily:'serif'}}}
    }),
    pageTextLines: async (n) => [{text: `input (${n}.1)`, ratio: 0.3, parts:[{start:0,end:13,xStartRatio:0.2,xEndRatio:0.9}]}]
  };
  return {ctx, doc, build: vm.runInNewContext(`(${extract(src, 'readingDataRawDetectionSnapshot')})`, ctx)};
}
async function run() {
  {
    const {ctx, doc, build} = fixture();
    const result = await build(doc, ctx.currentFileKey);
    verify(result.version === 1 && result.complete === true, 'versioned complete evidence');
    verify(result.pages.length === 2 && result.pageCount === 2, 'all pages exported');
    verify(result.pages[0].nativePdf.items[0].str === 'Heading 1', 'unclassified PDF.js text preserved');
    verify(result.pages[0].nativePdf.items[0].transform[5] === 740, 'raw geometry preserved');
    verify(result.pages[0].nativePdf.styles.F1.fontFamily === 'serif', 'font metadata preserved');
    verify(result.pages[0].nativePdf.rawText.includes('Heading 1\n'), 'raw item order and EOL preserved');
    verify(result.pages[0].detectorInputLines[0].text === 'input (1.1)', 'detector input separately preserved');
    verify(result.pages[0].documentOcrPageRef === 1, 'full OCR uses nonduplicating top-level reference');
    verify(result.pages[1].textSource === 'meticulous-ocr', 'meticulous provenance wins');
    verify(result.pages[1].meticulousOcr.words[0].text === 'meticulous', 'meticulous OCR words retained');
    verify(result.pages[0].equationMarginOcr[0].lines[0].text === '(1.2)', 'margin OCR observations preserved');
    verify(result.equationMarginOcrCoverage.pagesWithEvidence === 2, 'explicit actual margin evidence coverage, not full OCR');
    verify(result.pages[1].equationMarginOcr[0].side === 'right', 'margin side preserved');
    verify(!JSON.stringify(result).includes('FOREIGN'), 'foreign cached margin OCR rejected');
    verify(!JSON.stringify(result).includes('OUT OF RANGE'), 'out of range cache rejected');
    verify(result.rawHocrAvailable === false, 'original hOCR availability clearly reported');
    verify(ctx.documentOcrPages.get(1).text === 'ocr text', 'original OCR data not mutated');
    verify(ctx.manualIndexOcrPages.get(2).text === 'meticulous', 'manual evidence not mutated');
  }
  {
    const {ctx, doc, build} = fixture();
    const future = deferred();
    ctx.nativePageTextData = () => future.promise;
    const pending = build(doc, ctx.currentFileKey);
    ctx.pdfDoc = pdf(); ctx.currentFileKey = 'sha256:document-b';
    future.resolve({page:{view:[0,0,1,1]}, content:{items:[],styles:{}}});
    verify(await pending === null, 'stale async export cannot publish other-PDF evidence');
  }
  {
    const {ctx, doc, build} = fixture();
    const original = ctx.nativePageTextData;
    ctx.nativePageTextData = (d,n) => n === 2 ? Promise.reject(Error('page extraction failed')) : original(d,n);
    const result = await build(doc, ctx.currentFileKey);
    verify(result.complete === false, 'failed native read explicitly marks incomplete');
    verify(result.pages.length === 2 && result.errors.length === 1, 'incomplete evidence still records all pages');
    verify(result.errors[0].stage === 'native-pdf' && result.errors[0].page === 2, 'failure provenance present');
  }
  {
    // No retained original hOCR; the plain OCR answer must survive hOCR
    // normalization for *future* full-document and meticulous scans.
    const parserStub = class { parseFromString() {return {querySelector:() => null, querySelectorAll:() => []};} };
    const ctx = {DOMParser:parserStub, parseHocrBbox:()=>null, console};
    const ocrRecord = vm.runInNewContext(`(${extract(core,'pageRecordFromHocr',false)})`, ctx);
    const record = ocrRecord('', 'raw   (1.1)\nraw (1.2)', 600, 800, 12);
    verify(record.ocrRawText === 'raw   (1.1)\nraw (1.2)', 'Tesseract direct text untouched');
    verify(record.text !== record.ocrRawText, 'normalized and original OCR are distinguishable');
    verify(record.page === 12 && record.lines.length === 2, 'old page record semantics preserved');
  }
  {
    // Exercise the actual export function; a mere string search would not
    // catch a stale schema, omitted payload, disabled button, or wrong file.
    const {ctx, doc, build} = fixture();
    const downloads = [];
    const control = {disabled:false};
    Object.assign(ctx, {
      exportReadingDataButton: control,
      exportPreferences: {includeDetection:true,includeFullDocumentText:true},
      readingDataSessionForExport: (session) => session,
      currentFileName: 'Yau 1978.pdf',
      settleContentDetectionForExport: async () => true,
      readingDataRawDetectionSnapshot: build,
      snapshotSession: () => ({page:2, bookmarks:[]}),
      readingDataContentDetectionSnapshot: () => ({version:1, structure:[],results:[],equations:{rows:[]},bibliography:[]}),
      exportedDocumentOcrSnapshot: () => ({version:2,pageCount:2,pages:[]}),
      downloadReadingDataJsonFile: async (name, value) => {downloads.push({name,value});},
      showError: () => {throw Error('unexpected error dialog');},
      t: (en) => en,
    });
    const exportFn = vm.runInNewContext(`(${extract(src,'exportReadingData')})`,ctx);
    await exportFn();
    verify(downloads.length === 1, 'the real Export function emits exactly one file');
    verify(downloads[0].name === 'Yau-1978-mathreader.json', 'existing safe filename convention remains');
    verify(downloads[0].value.schema === 'mathreader.reading-data@1', 'same importable reading-data schema');
    verify(downloads[0].value.document.id === 'sha256:document-a', 'document identity is included');
    verify(downloads[0].value.contentDetection.version === 1 && downloads[0].value.session.page === 2,
      'index and reading session fields remain present');
    verify(downloads[0].value.fullDocumentText.pages[0].nativePdf.items.length === 2,
      'original text items are included in the actual exported payload');
    verify(downloads[0].value.documentOcr.version === 2, 'full OCR cache remains in top-level compatible field');
    verify(control.disabled === false, 'export control is restored after download');
  }
  {
    // Verify the export wire format and its import-only direction rather than
    // relying exclusively on a helper that might never be called.
    const fn = extract(src, 'exportReadingData');
    verify(fn.includes('await readingDataRawDetectionSnapshot(sourceDoc, sourceKey)'), 'Export waits for raw evidence');
    verify(fn.includes('payload.fullDocumentText = fullDocumentText'), 'opt-in export includes full-document evidence');
    const importer = extract(src, 'importReadingDataFile');
    verify(!importer.includes('payload.fullDocumentText'), 'diagnostics do not silently change user data on import');
    verify(src.includes('schema: \'mathreader.reading-data@1\''), 'existing reading-data schema retained');
    verify(!extract(src, 'readingDataRawDetectionSnapshot').includes('recognize('), 'export never triggers OCR');
  }
  console.log(`PASS: ${checks} v393 original export evidence assertions`);
}
run().catch((err) => { console.error(err); process.exitCode = 1; });
