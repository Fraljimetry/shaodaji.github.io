'use strict';
// v391: executable cache validation and delayed-read isolation. The same-page-
// count case is important: page-count equality must not validate wrong PDF data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/00-core.js'), 'utf8');
function extract(name) {
  const found = source.match(new RegExp(`async function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(found, `missing ${name}`);
  return found[0];
}
function deferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return {promise, resolve};
}
function record(page, text) { return {page, lines: [{text, ratio: 0.3}], words: []}; }
let checks = 0;
function check(value, reason) { assert.ok(value, reason); checks += 1; }
function contextFor(name) {
  const ctx = {
    pdfDoc: {numPages: 2}, currentFileKey: 'doc-a', documentOcrPages: new Map(),
    documentOcrActive: false, manualIndexOcrPages: new Map(),
    DOCUMENT_OCR_CACHE_VERSION: 2, console,
    documentOcrCacheKey: (key) => `full:${key ?? ctx.currentFileKey}`,
    manualIndexOcrCacheKey: (key) => `page:${key ?? ctx.currentFileKey}`,
    dbMetaGet: async () => null,
  };
  const loader = vm.runInNewContext(`(${extract(name)})`, ctx);
  return {ctx, loader};
}
async function run() {
  // An incorrect two-page cache (pages 1 and 3) used to count as COMPLETE.
  {
    const {ctx, loader} = contextFor('loadCachedDocumentOcr');
    ctx.dbMetaGet = async () => ({version: 2, pageCount: 2, pages: [record(1, 'one'), record(3, 'foreign')]});
    check(await loader() === false, 'out-of-range page rejected');
    check(ctx.documentOcrActive === false && ctx.documentOcrPages.size === 0,
      'invalid cache must not turn on OCR mode or publish a partial map');
    ctx.dbMetaGet = async () => ({version: 2, pageCount: 2, pages: [record(1, 'one'), record(1, 'duplicate')]});
    check(await loader() === false, 'duplicate page with missing page rejected');
    ctx.dbMetaGet = async () => ({version: 2, pageCount: 2, pages: [record(1, 'one'), record(2, 'two')]});
    check(await loader() === true, 'valid complete two-page cache restores');
    check(ctx.documentOcrPages.size === 2 && ctx.documentOcrActive, 'valid cache is active');
  }
  // Document A and B have identical page counts. A may finish only after B
  // replaces the active document; no stale A OCR data may become active in B.
  {
    const {ctx, loader} = contextFor('loadCachedDocumentOcr');
    const pending = deferred();
    ctx.dbMetaGet = () => pending.promise;
    const waiting = loader();
    ctx.pdfDoc = {numPages: 2}; ctx.currentFileKey = 'doc-b';
    ctx.documentOcrPages = new Map([[2, record(2, 'fresh-b')]]);
    pending.resolve({version: 2, pageCount: 2, pages: [record(1, 'old-a'), record(2, 'old-a')]});
    check(await waiting === false, 'stale full-document OCR cache read cancelled');
    check(ctx.documentOcrPages.get(2)?.lines[0].text === 'fresh-b' && !ctx.documentOcrActive,
      'stale full-document read does not clobber newer PDF state');
  }
  // Same *file key*, but replaced PDF object: the object identity is also
  // required, because file switching/destroy can occur before an async read.
  {
    const {ctx, loader} = contextFor('loadCachedDocumentOcr');
    const pending = deferred();
    ctx.dbMetaGet = () => pending.promise;
    const waiting = loader();
    ctx.pdfDoc = {numPages: 2};
    pending.resolve({version: 2, pageCount: 2, pages: [record(1, 'old-a'), record(2, 'old-a')]});
    check(await waiting === false, 'stale PDF object is rejected despite matching file key');
  }
  // Meticulous OCR restoration must preserve B's overlay when A's delayed
  // IndexedDB read returns later. A fresh same-document restore remains valid.
  {
    const {ctx, loader} = contextFor('loadManualIndexOcrPages');
    const pending = deferred();
    ctx.dbMetaGet = () => pending.promise;
    const waiting = loader();
    ctx.pdfDoc = {numPages: 2}; ctx.currentFileKey = 'doc-b';
    ctx.manualIndexOcrPages = new Map([[2, record(2, 'fresh-b')]]);
    pending.resolve({pageCount: 2, pages: [record(1, 'old-a')]});
    await waiting;
    check(ctx.manualIndexOcrPages.size === 1 && ctx.manualIndexOcrPages.get(2)?.lines[0].text === 'fresh-b',
      'stale meticulous OCR overlay does not overwrite B');
  }
  {
    const {ctx, loader} = contextFor('loadManualIndexOcrPages');
    ctx.dbMetaGet = async () => ({pageCount: 2, pages: [record(1, 'first'), record(8, 'bad-page')]});
    await loader();
    check(ctx.manualIndexOcrPages.size === 1 && ctx.manualIndexOcrPages.has(1),
      'same-document overlay restores valid pages only');
  }
  console.log(`PASS: ${checks} full-document and meticulous OCR cache-integrity assertions`);
}
run().catch(error => {console.error(error);process.exitCode=1;});
