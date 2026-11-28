'use strict';
// Production navigation functions, deterministic delayed reading-trail lookups.
// These are state-machine tests, not browser/PDF certification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '../js/30-rendering-navigation.js'), 'utf8');
const begin = src.indexOf('function navigationTargetLeadPx() {');
const end = src.indexOf('\nfunction renderReferenceStack() {', begin);
assert(begin >= 0 && end > begin, 'production navigation slice');
const cues = [], historyUpdates = [];
let resolveEntry;
const c = vm.createContext({
  console,
  pdfDoc: {numPages: 20}, currentFileKey:'A', currentPage:2, readingFlow:'single',
  primaryCanvasWrap:{clientHeight:700,scrollTop:0,scrollLeft:0,getBoundingClientRect:()=>({top:0,height:700})},
  primaryPageSurface:{offsetHeight:1000,getBoundingClientRect:()=>({top:0,height:1000})},
  canvas:null,continuousPageNodes:new Map(),continuousSavedAnchor:null,continuousGeneration:0,
  readingBackStack:[{page:1,ratio:.2}],suppressReadingHistory:false,
  generalPrefs:{recordReadingTrail:true},scrollByPage:{},
  readingBackButton:{},readingTrailCount:{},window:{getSelection:()=>null},
  hideSelectionToolbar:()=>{},updateNavigationState:()=>{},renderCurrentPage:async()=>{},
  buildContinuousDocument:async()=>{},renderContinuousPage:async()=>{},
  nextFrame:async()=>{},persistDocumentState:()=>{},captureContinuousAnchor:()=>null,
  readingTrailEntry:async(here)=>{
    if (here.page===1) return await new Promise(resolve=>{resolveEntry=()=>resolve({...here,created:1})});
    return {...here,created:1};
  },
  renderReadingTrail:()=>historyUpdates.push('render'),
  showNavigationLandingCue:(p,r)=>cues.push([p,r]),
});
const helpersBegin = src.indexOf('let activeReaderLanding = null;');
const helpersEnd = src.indexOf('async function renderPage(', helpersBegin);
assert(helpersBegin >= 0 && helpersEnd > helpersBegin, 'landing helper source');
vm.runInContext(src.slice(helpersBegin, helpersEnd) + '\n' + src.slice(begin,end),c);
const call = name => vm.runInContext(name,c);
(async()=>{
  const back = call('goBackReadingLocation()');
  // A newer unrelated navigation must record its origin while Back is awaiting.
  const newer = call('goToLocation(8,.5)');
  assert.equal(c.suppressReadingHistory,false,'Back must not set global history suppression');
  assert.equal(typeof resolveEntry,'function','newer navigation is delayed saving history');
  resolveEntry(); await Promise.all([back,newer]);
  assert.equal(c.currentPage,8,'newer click wins');
  assert.equal(c.readingBackStack.length,1,'newer click records its reading origin');
  assert.equal(c.readingBackStack[0].page,1,'history origin is previous page');
  assert.deepEqual(cues,[],'stale Back must not display a landing cue');
  // Stale history return after a PDF change must likewise remain silent.
  c.readingBackStack=[{page:4,ratio:.4}];c.currentPage=5;c.pdfDoc={numPages:20};
  let done; c.nextFrame=()=>new Promise(resolve=>{done=resolve});
  const pending=call('goBackReadingLocation()');
  for(let i=0;i<12 && !done;i++) await Promise.resolve();
  assert.equal(typeof done,'function');
  c.pdfDoc={numPages:20};c.currentFileKey='B';done();await pending;
  assert.deepEqual(cues,[],'old PDF return cannot mark a new PDF');
  // Record-history=false belongs to the request, not a process-global flag.
  assert.equal(c.suppressReadingHistory,false);
  assert(historyUpdates.length>0);
  console.log('PASS: newer navigation records history despite pending Back');
  console.log('PASS: stale Back cannot cue another navigation or another document');
})().catch(e=>{console.error(e);process.exitCode=1});
