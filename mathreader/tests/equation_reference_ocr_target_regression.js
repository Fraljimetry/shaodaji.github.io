'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const eq = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const navigation = fs.readFileSync(path.join(root, 'js/50-references-search.js'), 'utf8');
const palette = fs.readFileSync(path.join(root, 'js/70-command-ui-runtime.js'), 'utf8');
function extract(source, name) {
  const match = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(match, `implementation found: ${name}`);
  return match[0];
}
// Independently measured coordinates from the ORIGINAL Giusti PDF page 28.
// Native text knows a prose reference at x=96.99, y=282.65 (402x614.64),
// but omits the true equation (1.12). A 3x raster/Tesseract margin crop
// detects the real tag at x=102..168, y=440..467 (1206x1844).
const truth = {
  trueTag:{label:'(1.12)',page:28,ratio:453/1844,candidateXStartRatio:102/1206,candidateXEndRatio:168/1206},
  proseRef:{label:'(1.12)',page:28,ratio:289/614.64,candidateXStartRatio:96.99/402,candidateXEndRatio:119.03/402},
};
let checks = 0;
function check(condition, message) { checks += 1; assert.ok(condition, message); }
const parser = (s) => [...String(s||'').matchAll(/\(\d+(?:\.\d+)+\)/g)].map(m => ({label:m[0],index:m.index,end:m.index+m[0].length}));
const context = {
  equationReferenceProseContext: vm.runInNewContext(`(${extract(eq,'equationReferenceProseContext')})`),
  equationLabelCandidatesInLine: parser,
  equationLineMathSignalCount: s => (String(s||'').match(/[=≤≥∫∑+\-]/g)||[]).length,
};
const geom = vm.runInNewContext(`(${extract(eq,'meticulousMarginTargetGeometry')})`, context);
const reference = [{text:'It follows from (1.12) that the sum is locally finite.',ratio:truth.proseRef.ratio,xStartRatio:.08,xEndRatio:.93}];
check(geom(truth.trueTag,'left',reference),'printed left-margin equation is accepted');
check(!geom(truth.proseRef,'left',reference),'prose reference inside 28% left OCR crop is rejected');
check(!geom({...truth.trueTag,candidateXEndRatio:NaN},'left',reference),'missing measured glyph geometry is rejected');
check(!geom({...truth.trueTag,ratio:1},'left',reference),'broken bottom-of-page coordinate is rejected');
check(geom({label:'(6.2)',ratio:.4,candidateXStartRatio:.81,candidateXEndRatio:.89},'right',[]),'right-numbered equation remains valid');
check(!geom({label:'(6.2)',ratio:.4,candidateXStartRatio:.7,candidateXEndRatio:.8},'left',[]),'wrong-side reference is rejected');
// A label beyond the strongest outer margin needs corroborating display math.
const broad = {label:'(1.12)',ratio:.27,candidateXStartRatio:.19,candidateXEndRatio:.245};
check(!geom(broad,'left',[]),'inner 28% crop is not alone sufficient');
check(geom(broad,'left',[{text:'(1.12) f(x) = y + z',ratio:.27,xStartRatio:.13,xEndRatio:.8}]),'unusually inset label can survive with independent math line');
check(!geom(broad,'left',[{text:'It follows from (1.12)',ratio:.27,xStartRatio:.13,xEndRatio:.8}]),'reference prose vetoes candidate even with matching y');
check(geom(truth.trueTag,'left',[{text:'It follows from (1.12)',ratio:truth.trueTag.ratio,xStartRatio:.55,xEndRatio:.88}]),'different-column citation does not veto margin tag');
const chooseContext = {equationCandidateAlignedToNumberingSide:() => true,equationNumberingSide:'left',equationDocumentPosition:x=>x.page*10+x.ratio};
const choose = vm.runInNewContext(`(${extract(eq,'chooseCanonicalEquationCandidate')})`,chooseContext);
const old = {...truth.proseRef,confidence:28,meticulousPageVerified:true,ocrGeometryMeasured:true};
const vetted = {...truth.trueTag,confidence:12,meticulousPageVerified:true,ocrGeometryMeasured:true,marginLocationVerifiedV385:true};
check(choose([old,vetted]).ratio === vetted.ratio,'newly vetted equation position outranks cached reference with higher OCR confidence');
const persistenceContext=vm.createContext({
  normalizedEquationLabel:(label)=>String(label),
  EQUATION_INDEX_SUMMARY_VERSION:23,
  vetted,
});
vm.runInContext(`${extract(core,'snapshotEquationIndexForPersistence')}\n${extract(core,'restoreEquationIndexFromPersistence')}`, persistenceContext);
const persisted=vm.runInContext(`snapshotEquationIndexForPersistence(new Map([['(1.12)',[vetted]]]))`,persistenceContext);
check(persisted.rows[0].marginLocationVerifiedV385===true,'vetted coordinate survives persistence write');
persistenceContext.persisted=persisted;
check(vm.runInContext(`restoreEquationIndexFromPersistence(persisted).get('(1.12)')[0].marginLocationVerifiedV385===true`,persistenceContext),
  'vetted coordinate survives cache reopen');
const merge = vm.runInNewContext(`(${extract(core,'mergePageIndexOcrEvidence')})`);
const oldPage = {page:28,lines:[],words:[],equationMarginEvidence:[old,{page:28,label:'(1.13)',ratio:.6}]};
const rescanned = {page:28,lines:[],words:[],equationMarginEvidence:[vetted]};
const merged = merge(oldPage,rescanned);
check(merged.equationMarginEvidence.length===2,'repaired target replaces only stale same-label positions, retaining other labels');
check(merged.equationMarginEvidence.some(x=>x.label==='(1.12)'&&x.ratio===vetted.ratio),'verified position survives merge');
check(merge(oldPage,{page:28,lines:[],words:[],equationMarginEvidence:[]}).equationMarginEvidence.length===2,'failed-to-recover label never deletes prior evidence');
check(merge(merged,rescanned).equationMarginEvidence.length===2,'repeated scans do not accumulate same-label targets');
const navCtx = {pdfDoc:{numPages:30},currentFileKey:'test-giusti',readingFlow:'single',readerNavigationSerial:0,goToLocation:async (...x)=>{navCtx.locations.push(x);navCtx.readerNavigationSerial+=1;},emphasizeSemanticDestination:async()=>{navCtx.semantic+=1;return true;},showNavigationLandingCue:(...x)=>navCtx.cues.push(x),locations:[],cues:[],semantic:0};
const go = vm.runInNewContext(`(${extract(navigation,'goToMatchedLocation')})`,navCtx);
(async()=>{
  await go(28,vetted.ratio,'(1.12)',{positionOnly:true});
  check(navCtx.locations.length===1&&navCtx.locations[0][1]===vetted.ratio,'exact page position is used');
  check(navCtx.semantic===0,'equation jump must not search for the later prose reference');
  check(navCtx.cues.length===1,'exact equation geometry still receives location cue');
  await go(28,vetted.ratio,'Theorem 1.2');
  check(navCtx.semantic===1,'normal semantic navigation remains unchanged');
  check(eq.includes('entry.label, { positionOnly: true }'),'Equations sidebar uses exact page geometry');
  check(palette.includes("label, { positionOnly: true }), label,'equation'"),'equation command palette also uses exact geometry');
  check(navigation.includes('positionOnly: isEquationLabelQuery(query)'),'inline equation references also use exact geometry');
  check(core.includes('sourceDoc, pageNum, worker, imageCanvas, [...record.lines, ...nativeLines]'),'full-page OCR and native PDF text both used to disambiguate cropped reference');
  console.log(`PASS: ${checks} equation-reference OCR / navigation assertions (Giusti PDF p28 geometry)`);
})().catch(err=>{console.error(err);process.exitCode=1});
