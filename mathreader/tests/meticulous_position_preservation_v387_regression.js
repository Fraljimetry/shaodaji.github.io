'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const get = (name) => {
  const hit = core.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(hit, `real implementation of ${name} exists`);
  return hit[0];
};
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
const makeScroller = (name, top, left = 0) => ({
  name, scrollTop: top, scrollLeft: left, isConnected: true,
  getBoundingClientRect() { return {top: 50, bottom: 350, height: 300}; },
  querySelectorAll() { return []; }
});
const pdf = makeScroller('reader', 600, 23);
const sidebar = makeScroller('sidebar', 170);
const outline = makeScroller('outline', 11);
const structure = makeScroller('structure', 19);
const bibliography = makeScroller('bibliography', 30);
const equations = makeScroller('equations', 200);
let rowY = 248;
const row = {
  dataset: { equationOrderKey: 'label:(17.11)' },
  getBoundingClientRect() { return { top: 50 + rowY - equations.scrollTop, bottom: 82 + rowY - equations.scrollTop }; }
};
equations.querySelectorAll = () => [row];
const elements = {
  'left-sidebar': sidebar, 'outline-list': outline,
  'reader-toolbar': makeScroller('toolbar', 0)
};
for (const element of Object.values(elements)) element.addEventListener = () => {};
const doc = { identity: 'pdf-v386' };
const ctx = vm.createContext({
  pdfDoc: doc, primaryCanvasWrap: pdf, readingFlow: 'single',
  currentFileKey: 'giusti', currentPage: 222,
  readerNavigationSerial: 12, structureIndex: structure, equationIndex: equations,
  bibliographyIndex: bibliography, el: name => elements[name] || null,
  scrollByPage: {}, continuousScrollTop: 0, continuousSavedAnchor: null,
  captureContinuousAnchor: () => ({ page: 222, ratio: 0.87 }),
  restoreContinuousAnchor: (anchor) => { pdf.scrollTop = anchor.page * 10 + anchor.ratio * 500; return true; }
});
vm.runInContext([get('captureMeticulousOcrReadingPosition'), get('restoreMeticulousOcrReadingPosition')].join('\n'), ctx);
let saved = vm.runInContext('captureMeticulousOcrReadingPosition()', ctx);
check(saved.page === 222 && saved.top === 600 && saved.left === 23, 'snapshot captures exact single-page scroll');
check(saved.scrollers.length === 5 && saved.navigationSerial === 12, 'snapshot captures all Contents lists and navigation generation');
// Force a failed index rebuild to move the viewer, reset list scrolling and
// insert two recovered equations above the visible old equation.
pdf.scrollTop = 10; pdf.scrollLeft = 0; equations.scrollTop = 0;
sidebar.scrollTop = 0; outline.scrollTop = 0; structure.scrollTop = 0; bibliography.scrollTop = 0;
rowY = 302;
ctx.saved = saved;
check(vm.runInContext('restoreMeticulousOcrReadingPosition(saved)', ctx), 'restore succeeds with same PDF');
check(pdf.scrollTop === 600 && pdf.scrollLeft === 23, 'reader restored without re-navigation');
check(equations.scrollTop === 254, 'old equation retains same screen position after insertion above');
check(sidebar.scrollTop === 170 && bibliography.scrollTop === 30 && structure.scrollTop === 19, 'other Contents locations restored');
check(ctx.scrollByPage['222'].top === 600, 'single-page persistence uses restored position');
// Preserve the user's deliberate scroll while still allowing Contents restoration.
pdf.scrollTop = 720; equations.scrollTop = 0;
check(vm.runInContext('restoreMeticulousOcrReadingPosition(saved, {reader:false, contents:true})', ctx), 'selective restoration succeeds');
check(pdf.scrollTop === 720 && equations.scrollTop === 254, 'user scroll takes precedence over old snapshot');
// An intentional equation click increments the serial; do not move the PDF back.
ctx.readerNavigationSerial = 13; pdf.scrollTop = 900;
vm.runInContext('restoreMeticulousOcrReadingPosition(saved)', ctx);
check(pdf.scrollTop === 900, 'newer equation navigation cannot be overridden');
ctx.readerNavigationSerial = 12;
ctx.currentFileKey = 'other-book'; pdf.scrollTop = 800;
check(vm.runInContext('restoreMeticulousOcrReadingPosition(saved)', ctx) === false, 'different PDF never restored');
check(pdf.scrollTop === 800, 'old PDF snapshot cannot move new PDF');
ctx.currentFileKey = 'giusti';
ctx.readingFlow = 'continuous';
ctx.currentPage = 222;
pdf.scrollTop = 4300;
saved = vm.runInContext('captureMeticulousOcrReadingPosition()', ctx);
check(saved.anchor.page === 222 && saved.anchor.ratio === .87, 'continuous snapshot stores page + relative reading point');
pdf.scrollTop = 100;
ctx.saved = saved;
vm.runInContext('restoreMeticulousOcrReadingPosition(saved)', ctx);
check(pdf.scrollTop === 222 * 10 + .87 * 500, 'continuous restoration uses page-relative anchor');
check(ctx.continuousSavedAnchor.page === 222, 'continuous restored anchor survives persistence');
const fn = get('monitorMeticulousOcrUserNavigation');
check(fn.includes('wheel') && fn.includes('keydown') && fn.includes('pointerdown'), 'user interactions tracked');
const run = get('runMeticulousPageIndexOcr');
check(run.includes('captureMeticulousOcrReadingPosition()'), 'snapshot taken before OCR starts');
check(run.includes('restoreMeticulousOcrReadingPosition(originalPosition'), 'restore wired into OCR completion');
check(run.includes('navigationActivity.stop()'), 'listeners released after OCR');
check(!run.includes('await goToLocation('), 'OCR never actively navigates the reader');
// Exercise the real event tracker with native EventTargets. Merely rebuilding
// indexes does not count as deliberate user scrolling, but wheel/keyboard does.
const readerEvents = new EventTarget();
const contentsEvents = new EventTarget();
const toolbarEvents = new EventTarget();
const documentEvents = new EventTarget();
const inputContext = vm.createContext({
  AbortController, primaryCanvasWrap: readerEvents, document: documentEvents,
  el: name => name === 'left-sidebar' ? contentsEvents : name === 'reader-toolbar' ? toolbarEvents : null
});
vm.runInContext(get('monitorMeticulousOcrUserNavigation'), inputContext);
const tracker = vm.runInContext('monitorMeticulousOcrUserNavigation()', inputContext);
check(tracker.readerTouched === false && tracker.contentsTouched === false, 'initially no user intervention');
readerEvents.dispatchEvent(new Event('wheel'));
check(tracker.readerTouched, 'mouse wheel intentionally changes reader position');
contentsEvents.dispatchEvent(new Event('touchstart'));
check(tracker.contentsTouched, 'touch on Contents prevents sidebar snapback');
tracker.readerTouched = false;
const keyEvent = new Event('keydown');
Object.defineProperties(keyEvent, { key: {value: 'PageDown'}, target: {value: { matches: () => false}} });
documentEvents.dispatchEvent(keyEvent);
check(tracker.readerTouched, 'keyboard page scroll prevents overriding the user');
tracker.stop();
tracker.readerTouched = false;
readerEvents.dispatchEvent(new Event('pointerdown'));
check(tracker.readerTouched === false, 'listeners are released after scan');
console.log(`PASS: ${checks} v387 meticulous OCR reading-position regression checks`);
