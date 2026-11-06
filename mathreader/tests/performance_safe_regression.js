// MathReader v354: no-Network continuous-page optimization parity and CSS cleanup.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const newSource = fs.readFileSync(path.join(root, 'js/30-rendering-navigation.js'), 'utf8');
const oldSource = "function applyContinuousHorizontalOverflow(pageMetrics) {\n  if (!continuousStack || !primaryCanvasWrap) return;\n  const available = Math.max(1, primaryCanvasWrap.clientWidth);\n  const maxPageWidth = Math.max(0, ...(pageMetrics || []).map((item) => Number(item?.width) || 0));\n  const overflow = maxPageWidth > available;\n  if (!overflow) {\n    continuousStack.style.removeProperty('width');\n    continuousStack.style.removeProperty('min-width');\n    continuousStack.style.removeProperty('align-items');\n    for (const record of continuousPageNodes.values()) {\n      record.frame?.style.removeProperty('width');\n      record.frame?.style.removeProperty('min-width');\n    }\n    return;\n  }\n  // Give the scrolling document a real non-negative width equal to its widest\n  // page. Frames share that width, while individual page surfaces may remain\n  // centered inside it. This avoids an unreachable negative-left overflow.\n  const documentWidth = Math.ceil(maxPageWidth);\n  continuousStack.style.width = `${documentWidth}px`;\n  continuousStack.style.minWidth = `${documentWidth}px`;\n  continuousStack.style.alignItems = 'flex-start';\n  for (const record of continuousPageNodes.values()) {\n    record.frame?.style.setProperty('width', `${documentWidth}px`);\n    record.frame?.style.setProperty('min-width', `${documentWidth}px`);\n  }\n}\n\nfunction updateCurrentPageFromContinuousScroll() {\n  if (readingFlow !== 'continuous' || !pdfDoc || !continuousPageNodes.size) return;\n  const wrapRect = primaryCanvasWrap.getBoundingClientRect();\n  const anchor = wrapRect.top + Math.min(140, wrapRect.height * .24);\n  let bestPage = currentPage;\n  let bestDistance = Infinity;\n  for (const [pageNum, record] of continuousPageNodes) {\n    const rect = record.frame.getBoundingClientRect();\n    if (rect.bottom < wrapRect.top || rect.top > wrapRect.bottom) continue;\n    const distance = Math.abs(rect.top - anchor);\n    if (distance < bestDistance) { bestDistance = distance; bestPage = pageNum; }\n  }\n  if (bestPage !== currentPage) {\n    currentPage = bestPage;\n    updateNavigationState();\n  }\n}"; // copied verbatim from v353 as an independent parity oracle
// Extract only the two original functions. All other source remains untouched.
const extract = (s, name, next) => { const start = s.indexOf(`function ${name}(`); const end = s.indexOf(`\nfunction ${next}(`, start); return s.slice(start, end < 0 ? s.length : end); };
const pageOld = oldSource.slice(oldSource.indexOf('function updateCurrentPageFromContinuousScroll('));
const pageNew = newSource.slice(newSource.indexOf('function updateCurrentPageFromContinuousScroll('), newSource.indexOf('\nasync function buildInitialContinuousDocument('));
const widthOld = oldSource.slice(0,oldSource.indexOf('function updateCurrentPageFromContinuousScroll('));
const widthNew = extract(newSource, 'applyContinuousHorizontalOverflow', 'pageScale');
assert(pageOld.includes('getBoundingClientRect') && pageNew.includes('getBoundingClientRect'));
let assertions = 0;
function check(ok, message) { assert.ok(ok, message); ++assertions; }
function runPageFunction(source, metrics, scrollTop, initial, wrapHeight = 610, layoutGap = 12, scale = 1) {
  const counters = { rectCalls: 0, navUpdates: 0 };
  const nodes = new Map();
  let top = 25;
  const rootTop = 33;
  for (let i = 0; i < metrics.length; i++) {
    const h = metrics[i];
    const offsetTop = top;
    const record = {frame:{offsetTop,offsetHeight:h,getBoundingClientRect(){
      counters.rectCalls++;
      return {top: rootTop + offsetTop*scale - scrollTop,bottom:rootTop+(offsetTop+h)*scale-scrollTop};
    }}};
    nodes.set(i+1,record);
    top += h + layoutGap;
  }
  const wrap = {getBoundingClientRect() {return {top:33,bottom:33+wrapHeight,height:wrapHeight};}};
  const make = new Function('state', `let currentPage=state.currentPage;const {pdfDoc,readingFlow,continuousPageNodes,primaryCanvasWrap}=state;const updateNavigationState=()=>state.navUpdates++;${source};return()=>{updateCurrentPageFromContinuousScroll();state.currentPage=currentPage;};`);
  const state={currentPage:initial,pdfDoc:{numPages:metrics.length},readingFlow:'continuous',continuousPageNodes:nodes,primaryCanvasWrap:wrap,navUpdates:0};
  make(state)();
  counters.navUpdates=state.navUpdates;
  return {...counters,page:state.currentPage};
}
let seed=1907;
function rnd() {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;}
for(const count of [1,2,8,63,64,65,100,800,2000]) {
  const metrics = Array.from({length:count},()=>100+Math.floor(rnd()*720));
  const fullHeight=metrics.reduce((x,y)=>x+y+12,0);
  const positions=[0,22,100,fullHeight-620,fullHeight+5];
  for(let i=0;i<17;i++) positions.push(Math.floor(rnd()*fullHeight));
  for(const pos of positions) {
    for(const initial of [1,Math.max(1,Math.floor(count/2)),count]) {
      const a=runPageFunction(pageOld,metrics,pos,initial);
      const b=runPageFunction(pageNew,metrics,pos,initial);
      check(a.page===b.page,`page mismatch n=${count},scroll=${pos},initial=${initial}: ${a.page} != ${b.page}`);
      check(a.navUpdates===b.navUpdates,`nav callback mismatch n=${count},scroll=${pos}`);
    }
  }
}
// Large-scroll stress must avoid full-document layout-read scanning.
const big = Array.from({length:30000},(_,i)=>210+(i%9)*17);
const old = runPageFunction(pageOld,big,5400000,1);
const improved = runPageFunction(pageNew,big,5400000,1);
check(improved.page===old.page,'30k-page scroll picks the same page');
check(improved.rectCalls<60,`new code still queried ${improved.rectCalls} rectangles`);
check(old.rectCalls>=30000,'baseline tested all page rectangles');
// Non-unit CSS transforms invalidate the offset-coordinate shortcut. Fall back
// to the unchanged rectangle scan rather than guessing a different anchor.
for(const scale of [0.78, 1.2]) {
  const original = runPageFunction(pageOld,big.slice(0,600),50000,300,610,12,scale);
  const optimized = runPageFunction(pageNew,big.slice(0,600),50000,300,610,12,scale);
  check(original.page === optimized.page,'transformed geometry chose a different page');
  check(optimized.rectCalls >= 600,'transformed geometry did not preserve full-scan fallback');
}

function mockWidths(source, metrics) {
  const stack={style:{values:{},set width(v){this.values.width=v},set minWidth(v){this.values.minWidth=v},set alignItems(v){this.values.alignItems=v},removeProperty(key){delete this.values[key]}}};
  const records=new Map();for(let i=0;i<3;i++) {
    const style={values:{},setProperty(k,v){this.values[k]=v},removeProperty(k){delete this.values[k]}};
    records.set(i+1,{frame:{style}});
  }
  const wrap={clientWidth:900};
  const func=new Function('state',`const {continuousStack,primaryCanvasWrap,continuousPageNodes}=state;${source};return applyContinuousHorizontalOverflow;`);
  func({continuousStack:stack,primaryCanvasWrap:wrap,continuousPageNodes:records})(metrics);
  return {stack:stack.style.values,frames:[...records.values()].map(x=>x.frame.style.values)};
}
for(const metrics of [[{width:650},{width:750}],[{width:920},{width:1100}],[{width:0},{width:-40}],[{width:NaN},{width:'1200'}],[]]) {
  check(JSON.stringify(mockWidths(widthOld,metrics))===JSON.stringify(mockWidths(widthNew,metrics)),'overflow styles changed');
}
const huge=Array.from({length:155000},(_,i)=>({width:800+(i%150)}));
check(mockWidths(widthNew,huge).stack.width==='949px','overflow max on large corpus');
// The accidental second modal block at the end of the 860px rule is removed;
// the original responsive padding and header rule remain scoped to 860px.
const css=fs.readFileSync(path.join(root,'mathreader.css'),'utf8');
check((css.match(/\.formula-ocr-init-overlay\{position:fixed/g)||[]).length===1,'modal CSS duplicated');
check(!css.includes('.reference-pane/* Formula model startup'),'orphaned selector still present');
check(css.includes('@media(max-width:860px)') && css.includes('.canvas-wrap{padding:14px}') && css.includes('.header-actions .header-help{min-width:34px') && !css.includes('.header-actions .icon-button:first-child{display:none}'), 'v362 mobile reader/help rules lost');
console.log(`OK: ${assertions} scroll/layout/CSS parity assertions; rect reads 30k pages: ${old.rectCalls} -> ${improved.rectCalls}`);
