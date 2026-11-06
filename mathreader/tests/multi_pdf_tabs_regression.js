// v373: History-only, lazy multi-PDF selection (zero network).
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const css = read('mathreader.css');
const core = read('js/00-core.js');
const notes = read('js/60-notes-bookmarks-data.js');
const runtime = read('js/70-command-ui-runtime.js');
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };
check(/id="file-input"[^>]*\bmultiple\b/.test(html), 'picker allows multiple PDFs');
check(!html.includes('id="document-tabs"'), 'no horizontal PDF tab strip');
check(!css.includes('.document-tabs'), 'no tab styling or extra grid row');
check(notes.includes('rememberOpenedPdf(meta, cacheBlob)'), 'successful open removes staged item');
check(runtime.includes('queueOpenedPdfFiles(files)'), 'multi-drop stages files');
check(notes.includes('queueOpenedPdfFiles(files, recoveryId)'), 'multi-picker stages files');
check(core.includes('for (const entry of pendingPdfFiles)'), 'pending files shown in History');
check(core.includes('activatePendingPdf(entry.id)'), 'pending file clicked from History');
check(core.includes("t('Not loaded', '尚未加载')"), 'unopened state labelled');
check(!notes.includes('activateOpenPdfTab'), 'tab switcher removed');
const start = notes.indexOf('// The History list is the only multi-document switcher.');
const end = notes.indexOf('async function changeZoom(delta)', start);
check(start >= 0 && end > start, 'pending-file state machine present');
const opened = [];
const context = vm.createContext({
  console, t: (en) => en,
  async openPdfFile(file) {
    opened.push(file.name);
    if (file.name === 'bad.pdf') throw new Error('simulated open failure');
    vm.runInContext(`rememberOpenedPdf({id:${JSON.stringify(file.name)}, name:${JSON.stringify(file.name)}})`, context);
  },
  documentOcrInteractionLocked: () => false,
  renderLocalLibrary() {},
});
vm.runInContext(notes.slice(start, end), context);
const run = (code) => vm.runInContext(code, context);
(async () => {
  const files = [
    {name:'A.pdf', type:'application/pdf'},
    {name:'B.pdf', type:'application/pdf'},
    {name:'C.pdf', type:'application/pdf'}
  ];
  context.files = files;
  run('queueOpenedPdfFiles(files)');
  await new Promise((resolve) => setImmediate(resolve));
  check(opened.join(',') === 'A.pdf', 'only first selected PDF loads');
  check(run('pendingPdfFiles.length') === 2, 'other two remain pending');
  check(run('pendingPdfFiles[0].file.name') === 'B.pdf', 'selection order preserved');
  await run('activatePendingPdf(pendingPdfFiles[1].id)');
  check(opened.join(',') === 'A.pdf,C.pdf', 'click loads only selected pending file');
  check(run('pendingPdfFiles.length') === 1, 'successful open removed from pending list');
  run('removePendingPdf(pendingPdfFiles[0].id)');
  check(run('pendingPdfFiles.length') === 0, 'explicit removal does not auto-open other files');
  context.files = [{name:'bad.pdf', type:'application/pdf'}, {name:'D.pdf', type:'application/pdf'}];
  run('queueOpenedPdfFiles(files)');
  await new Promise((resolve) => setImmediate(resolve));
  check(opened.at(-1) === 'bad.pdf', 'first failed PDF attempted');
  check(run('pendingPdfFiles.length') === 2, 'failed PDF stays for retry, next PDF untouched');
  await run('activatePendingPdf(pendingPdfFiles[1].id)');
  check(opened.at(-1) === 'D.pdf', 'user can load next PDF after failed first');
  console.log(`OK: ${checks} History-only multi-PDF regression assertions`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
