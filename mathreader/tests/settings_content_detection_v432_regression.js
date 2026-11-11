'use strict';
// v432 settings contract: control wiring, persistence, mathematical safeguards.
const assert = require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),core=read('js/00-core.js'),events=read('js/60-notes-bookmarks-data.js');
const runtime=read('js/70-command-ui-runtime.js'),detector=read('js/41-equations-bibliography.js'),ocr=read('js/11-formula-vector.js');
for(const id of ['settings-content-detection-group','detection-results-filter','detection-equation-confidence','detection-proof-relations', 'detection-rebuild-index', 'detection-scan-margins', 'reset-detection-display','display-zoom-step','ocr-severe-retry','ocr-crop-padding']){
 assert(html.includes(`id="${id}"`), `missing setting: ${id}`);
}
assert(core.includes('const DETECTION_VIEW_PREFS_KEY'), 'local detection display prefs');
assert(core.includes('function loadDetectionViewPreferences()'), 'load prefs');
assert(core.includes('function persistDetectionViewPreferences()'), 'persist prefs');
assert(core.includes('function loadFormulaOcrPreferences()'), 'load OCR prefs');
assert(core.includes('function persistFormulaOcrPreferences()'), 'persist OCR prefs');
assert(events.includes('changeZoom(zoomStep)'), 'zoom step truly functional');
assert(detector.includes('const shownStructureEntries ='), 'Result filter active');
assert(detector.includes('showProofRelations'), 'proof graph visibility controllable');
assert(detector.includes('detectionEquationConfidenceSelect'), 'equation confidence synced to setting');
assert(runtime.includes('void forceEquationImageOcr()'), 'margin scan remains user-initiated');
assert(runtime.includes('buildStructureIndex({ force: true })'), 'rebuild indexes actually invoked');
assert(ocr.includes('allowSevereRetry && result.assessment?.hardReject'), 'severe OCR retry toggle effective');
assert(ocr.includes('formulaOcrCropPadding'), 'first pass crop preference effective');
assert(read('tutorial.html').includes('Settings → Content Detection'), 'tutorial explains controls');
assert(read('tutorial.html').includes('设置 → 内容检测'), 'Chinese tutorial explains controls');
console.log('Settings v432 regression PASS');
