// v372: source + actual isolated tab state transitions (zero network).
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const css = read('mathreader.css');
const notes = read('js/60-notes-bookmarks-data.js');
const runtime = read('js/70-command-ui-runtime.js');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
check(/id="file-input"[^>]*\bmultiple\b/.test(html), 'native picker accepts multiple PDF files');
check(html.includes('id="document-tabs"'), 'reader has a document tabs strip');
check(css.includes('.document-tabs') && css.includes('grid-template-rows:48px auto minmax(0,1fr)'), 'tab row integrates into reader grid without covering canvas');
check(notes.includes('rememberOpenedPdf(meta, cacheBlob)'), 'every successful PDF source is registered');
check(notes.includes('await flushCurrentDocumentSession()'), 'switch/close persists reading sessions');
check(notes.includes('new File([blob], meta.name'), 'non-picker PDF sources receive named File for reopen');
check(notes.includes('if (pdfTabSwitchBusy || documentOcrInteractionLocked()) return;'), 'close guarded during OCR/switch');
check(runtime.includes('queueOpenedPdfFiles(files)'), 'multi-drop routed into tabs');
check(notes.includes('queueOpenedPdfFiles(files, recoveryId)'), 'multi-selection routed into tabs');
const start = notes.indexOf('// Tabs are only a document switcher');
const end = notes.indexOf('async function changeZoom(delta)', start);
check(start >= 0 && end > start, 'tab state machine located');
const listeners = [];
function makeNode() {
  return {
    children: [], className: '', dataset: {},
    classList: { toggle() {} },
    setAttribute() {}, addEventListener(event, cb) { listeners.push([event, cb]); },
    append(...items) { this.children.push(...items); },
    appendChild(item) { this.children.push(item); },
    replaceChildren(...items) { this.children = [...items]; }
  };
}
const tabStrip = makeNode();
const opens = [];
const context = vm.createContext({
  document: { getElementById: () => tabStrip, createElement: () => makeNode() },
  t: (en) => en, console, File: class FakeFile { constructor(parts, name, opts) { this.name=name; this.type=opts.type; this.parts=parts; this.lastModified=opts.lastModified; } },
  pdfDoc: { destroy: async () => {} }, currentFileKey: null, currentFileName: '',
  documentOcrInteractionLocked: () => false,
  async openPdfFile(file) { opens.push(file.name); context.currentFileKey=file.name; vm.runInContext(`rememberOpenedPdf({id:${JSON.stringify(file.name)},name:${JSON.stringify(file.name)}}, null)`, context); },
  async openCachedDocument(key) { opens.push('cached:' + key); return true; },
  async flushCurrentDocumentSession() {},
  documentTitle: {textContent:''}, pdfWorkspace: {classList:{add(){}}}, welcome:{classList:{remove(){}}},
  enableReaderControls() {}, renderLocalLibrary() {}, showError(msg) { throw new Error(msg); }
});
vm.runInContext(notes.slice(start, end), context);
const run = (code) => vm.runInContext(code, context);
(async () => {
  context.files = [
    {name:'A.pdf', type:'application/pdf'},
    {name:'B.pdf', type:'application/pdf'},
    {name:'C.pdf', type:'application/pdf'}
  ];
  run('queueOpenedPdfFiles(files)');
  await new Promise((resolve) => setImmediate(resolve));
  check(run('openedPdfTabs.length') === 3, 'three PDFs staged as separate tabs');
  check(opens.join(',') === 'A.pdf', 'only first PDF parsed, other PDFs remain lazy');
  await run('activateOpenPdfTab(openedPdfTabs[2].id)');
  check(opens.join(',') === 'A.pdf,C.pdf', 'switch opens selected third PDF');
  check(run('openedPdfTabs.filter(x => x.id === activePdfTabId).length') === 1, 'exactly one tab active');
  await run('closeOpenPdfTab(openedPdfTabs[1].id)');
  check(run('openedPdfTabs.length') === 2, 'close inactive tab without affecting active document');
  await run('closeOpenPdfTab(activePdfTabId)');
  check(opens.at(-1) === 'A.pdf', 'closing active tab activates neighbor');
  await run('closeOpenPdfTab(activePdfTabId)');
  check(run('openedPdfTabs.length') === 0 && run('activePdfTabId') === null, 'closing final tab empties tab strip');
  console.log(`OK: ${checks} multi-PDF tab regression assertions`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
