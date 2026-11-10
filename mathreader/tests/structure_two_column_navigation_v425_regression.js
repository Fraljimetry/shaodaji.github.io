'use strict';
// Regression for Structure bookmarks in genuine two-column mathematical PDFs.
// A PDF.js baseline row can contain fragments from both columns at the same y.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = fs.readFileSync(path.join(__dirname, '../js/40-outline-structure.js'), 'utf8');
const start = file.indexOf('function comparableStructureNavigationText(value) {');
const end = file.indexOf('\nfunction renderActiveOutline() {', start);
assert(start >= 0 && end > start, 'Production heading navigation functions unavailable');
const context = {
  console,
  pdfDoc: {numPages: 12},
  currentFileKey: 'paper-1',
  readerNavigationSerial: 0,
  pageTextLines: async (page) => context.linesByPage[page] || [],
  goToMatchedLocation: async (page, ratio, _query, options) => { context.target = { page, ratio, options }; },
  target: null,
  linesByPage: {},
};
vm.createContext(context);
vm.runInContext(file.slice(start, end), context);
function row(yRatio, fragments) {
  let text = '';
  const parts = fragments.map(([value, left, right]) => {
    if (text) text += ' ';
    const start = text.length;
    text += value;
    return { start, end: text.length, xStartRatio: left, xEndRatio: right };
  });
  return {text, ratio: yRatio, parts, xStartRatio: parts[0].xStartRatio,
    xEndRatio: parts[parts.length - 1].xEndRatio};
}
async function run() {
  // Actual native text shape on page 4, anonymized after the genuine title.
  context.linesByPage[4] = [
    row(.3207, [
      ['2.1', .088, .111], ['Principal Minor Equivalence', .128, .360],
      ['continuation of an unrelated statement in the next column', .520, .910],
    ]),
    row(.5682, [['2.4', .520, .542], ['Diagonal Similarity', .560, .718]]),
  ];
  context.linesByPage[5] = [
    row(.2247, [
      ['2.5', .088, .111], ['Cut-Transpose Operation', .128, .333], ['k', .845, .852],
    ]),
  ];
  async function jump(entry) {context.target = null; await vm.runInContext('navigateToStructureEntry', context)(entry); return context.target;}
  let target = await jump({page:4,ratio:0,positionKnown:false,title:'2.1 Principal Minor Equivalence'});
  assert(target && target.page === 4 && Math.abs(target.ratio-.3207)<.0001, `2.1 wrong: ${JSON.stringify(target)}`);
  target = await jump({page:5,ratio:0,positionKnown:false,title:'2.5 Cut-Transpose Operation'});
  assert(target && target.page === 5 && Math.abs(target.ratio-.2247)<.0001, `2.5 wrong: ${JSON.stringify(target)}`);
  target = await jump({page:4,ratio:0,positionKnown:false,title:'2.4 Diagonal Similarity'});
  assert(target && Math.abs(target.ratio-.5682)<.0001, `Right column wrong: ${JSON.stringify(target)}`);
  // Page-top XYZ/ FitH coordinates, though explicit, can be less precise
  // than a unique, exact printed heading. Non-top author destinations win.
  target = await jump({page:4,ratio:0,positionKnown:true,title:'2.1 Principal Minor Equivalence'});
  assert(target && Math.abs(target.ratio-.3207)<.0001, 'Page-top explicit destination should recover exact heading');
  target = await jump({page:4,ratio:.41,positionKnown:true,title:'2.1 Principal Minor Equivalence'});
  assert(target && Math.abs(target.ratio-.41)<.0001, 'Valid non-top PDF coordinate was overwritten');
  target = await jump({page:4,ratio:.71,positionKnown:true,userEdited:true,title:'2.1 Principal Minor Equivalence'});
  assert(target && Math.abs(target.ratio-.71)<.0001, 'Manual Reselect was overwritten');
  // Never concatenate section number from the left column to title in the right.
  context.linesByPage[6] = [row(.47,[['2.6', .09,.12], ['Cut-Transpose Operation', .53,.74]])];
  target = await jump({page:6,ratio:0,positionKnown:false,title:'2.6 Cut-Transpose Operation'});
  assert(target && target.ratio === 0, 'Cross-column false heading matched');
  context.linesByPage[6] = [row(.4,[['2.6', .09,.12], ['Actual Heading', .13,.30]]),
    row(.64,[['2.6', .09,.12], ['Actual Heading', .13,.30]])];
  target = await jump({page:6,ratio:0,positionKnown:false,title:'2.6 Actual Heading'});
  assert(target && target.ratio === 0, 'Ambiguous repeated headings must not guess');
  console.log('Structure two-column navigation regression PASS');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
