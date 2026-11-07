'use strict';
// v411: Add/Reselect is a point hit-test, never a vertical nearest-label search.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/20-selection-annotations.js'), 'utf8');
const geometry = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
function extract(src, name) {
  const match = src.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(match, `${name} exists`);
  return match[0];
}
let assertions = 0;
const check = (value, message) => { assert.ok(value, message); assertions++; };
const calls = { prompts: 0, saved: 0, refreshed: 0, errors: [] };
const page20 = [
  // Grounded by original Giusti page 20: (1.2) is an inline reference above
  // the printed (1.4), near x=.435; (1.4) is absent from native PDF text.
  { text:'Now using (1.3) we may write (1.2) as', ratio:.229, heightRatio:.022,
    xStartRatio:.10, xEndRatio:.49,
    parts:[
      {start:0,end:10,xStartRatio:.10,xEndRatio:.22},
      {start:10,end:15,xStartRatio:.23,xEndRatio:.275},
      {start:15,end:30,xStartRatio:.28,xEndRatio:.425},
      {start:30,end:35,xStartRatio:.43,xEndRatio:.475},
      {start:35,end:38,xStartRatio:.48,xEndRatio:.49}
    ] },
];
const ctx = vm.createContext({
  console, page20, equations: new Map([['(1.2)', [{page:20,ratio:.229,text:'original (1.2)'}]]]),
  equationNumberingSide:'left', pendingEquationAddKey:'(1.3)', pendingEquationReselectKey:null,
  equationEdits:[], equationManualOrder:['label:(1.3)','label:(1.2)'],
  equationLabelIndex: new Map([['(1.2)', [{page:20,ratio:.229,text:'original (1.2)'}]]]),
  equationAutomaticLabelIndex: new Map([['(1.2)', [{page:20,ratio:.229,text:'original (1.2)'}]]]),
  pendingOutlineReselectKey:null,
  normalizedEquationLabel: s => String(s||'').trim(),
  normalizeEquationTagCommands: s => s,
  equationLabelCandidatesInLine: text => [...String(text).matchAll(/\(\d+(?:\.\d+)+\)/g)].map(m=>({label:m[0],index:m.index,end:m.index+m[0].length})),
  equationLabelFromSelectionText: s => /^\(\d+(?:\.\d+)+\)$/.test(s) ? s : null,
  pageTextLines: async page => page===20 ? page20 : [],
  t: s => s,
  showError: message => calls.errors.push(message),
  persistDocumentState:()=>{calls.saved++},
  refreshEquationIndexAfterManualEdit:async()=>{calls.refreshed++},
  refreshSelectionUI:()=>{},
  window:{prompt:()=>{calls.prompts++;return '(1.4)'}},
  pdfDoc:{id:'original'},
});
const helpers = [
  extract(geometry,'equationCandidateTokenGeometry'),
  ...['equationLabelNearPagePoint','equationPointFromClick','equationEditTargetFromPending',
  'equationSourceLabelForDisplayed','pendingEquationDisplayedLabel',
  'manualEquationLabelAlreadyIndexed','showDuplicateManualEquationLabel',
  'equationOrderKeyFromRef','insertEquationManualOrderAfter','equationLabelsInTextLine',
  'applyEquationEdits','applyEquationPointCorrection','applyEquationLinkCorrection'].map(x=>extract(source,x))
];
vm.runInContext(helpers.join('\n\n'),ctx);
const run = expression => vm.runInContext(expression,ctx);
(async()=>{
  // Exact 2D location: the printed (1.4) is to the left and below (1.2).
  let result = await run('equationLabelNearPagePoint(20,.265,.085)');
  check(result===null, 'Giusti 1.4 click must not capture 1.2 located above and right');
  result = await run('equationLabelNearPagePoint(20,.229,.085)');
  check(result===null, 'a click horizontally beside 1.2 is not a hit');
  result = await run('equationLabelNearPagePoint(20,.265,.45)');
  check(result===null, 'a click vertically below 1.2 is not a hit');
  result = await run('equationLabelNearPagePoint(20,.229,.452)');
  check(result?.label==='(1.2)', 'directly clicking visible 1.2 does match it');
  const surface={getBoundingClientRect:()=>({left:280,top:226,width:952,height:1200})};
  ctx.surface=surface;
  ctx.event={clientX:280+.085*952,clientY:226+.265*1200};
  const p=run('equationPointFromClick(event,surface,20)');
  check(Math.abs(p.xRatio-.085)<.0001 && Math.abs(p.ratio-.265)<.0001, 'click carries both coordinates');

  // A missing OCR/native label is requested explicitly; neighbors aren't borrowed.
  check(await run('applyEquationPointCorrection(20,{ratio:.265,xRatio:.085})')===true,'point Add handled');
  check(calls.prompts===1,'unrecognized printed 1.4 prompts once');
  check(ctx.equationEdits.length===1 && ctx.equationEdits[0].label==='(1.4)', 'manually entered 1.4 added');
  check(ctx.equationEdits[0].ratio===.265 && ctx.equationEdits[0].page===20, 'clicked page/ratio retained');
  let displayed=run('applyEquationEdits(equationAutomaticLabelIndex)');
  check(displayed.get('(1.2)')[0].ratio===.229, 'original 1.2 is never relocated');
  check(displayed.get('(1.4)')[0].ratio===.265, 'new 1.4 points to clicked position');

  // Direct clicks on an existing number must never turn Add into implicit Reselect.
  ctx.pendingEquationAddKey='(1.3)';
  const saved=calls.saved;
  check(await run('applyEquationPointCorrection(20,{ratio:.229,xRatio:.452})')===true,'direct 1.2 click consumed');
  check(ctx.equationEdits.length===1 && calls.saved===saved && ctx.pendingEquationAddKey==='(1.3)',
    'duplicate auto-detected 1.2 is rejected without persistence or losing pending Add');
  check(calls.errors.length>0,'duplicate produces a visible error');

  ctx.window.prompt=()=>{calls.prompts++;return '(1.2)'};
  check(await run('applyEquationPointCorrection(20,{ratio:.27,xRatio:.09})')===true, 'typed duplicate handled');
  check(ctx.equationEdits.length===1 && calls.saved===saved,'typed duplicate cannot overwrite original');
  check(run("applyEquationLinkCorrection('(1.2)',20,.265)")===true, 'selected-text duplicate handled');
  check(ctx.equationEdits.length===1 && calls.saved===saved,'selected-text duplicate cannot overwrite original');

  ctx.pendingEquationAddKey=null;
  ctx.pendingEquationReselectKey='label:(1.4)';
  check(run("applyEquationLinkCorrection('(1.2)',20,.265)")===true,
    'selected-text Reselect collision handled');
  check(ctx.pendingEquationReselectKey==='label:(1.4)' && calls.saved===saved,
    'Reselect cannot rename a different equation to the existing 1.2');
  ctx.pendingEquationReselectKey=null;

  // Prior corrupted saved Add data must not shadow the automatic index on replay.
  ctx.equationEdits.push({action:'add',id:'old-duplicate',label:'(1.2)',page:20,ratio:.265});
  displayed=run('applyEquationEdits(equationAutomaticLabelIndex)');
  check(displayed.get('(1.2)')[0].ratio===.229,'historical duplicate manual Add cannot mask genuine 1.2');
  ctx.equationEdits.pop();

  // No fine-grained token geometry means no silent adjacency guesses.
  ctx.pageTextLines=async()=>[{text:'(1.2)',ratio:.229,xStartRatio:.1,xEndRatio:.9,parts:[]}];
  check(await run('equationLabelNearPagePoint(20,.229,.45)')===null,'untrustworthy line-only geometry cannot auto select');
  ctx.pageTextLines=async()=>[{text:'Now using (1.3) we may write (1.2) as',ratio:.229,
    xStartRatio:.1,xEndRatio:.8,parts:[{start:0,end:37,xStartRatio:.1,xEndRatio:.8}]}];
  check(await run('equationLabelNearPagePoint(20,.229,.68)')===null,
    'single coarse full-line part cannot claim an approximate subword hit');
  console.log(`PASS: ${assertions} precise manual equation click/add assertions`);
})().catch(error=>{console.error(error);process.exitCode=1});
