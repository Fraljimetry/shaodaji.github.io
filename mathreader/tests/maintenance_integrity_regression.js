// MathReader v358: maintenance / assembly guard (no external Node packages).
// Run: node mathreader/tests/maintenance_integrity_regression.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
let count = 0;
function check(condition, message) { assert.ok(condition, message); count += 1; }

const bootstrap = read('mathreader.js');
const html = read('index.html');
const css = read('mathreader.css');
const manifest = bootstrap.match(/const PARTS\s*=\s*\[([\s\S]*?)\];/);
check(Boolean(manifest), 'bootstrap has a declared ordered module manifest');
const parts = [...manifest[1].matchAll(/'([^']+\.js)'/g)].map((match) => match[1]);
check(parts.length === 10, 'exactly ten original subsystem parts');
check(new Set(parts).size === parts.length, 'no duplicate subsystem parts');
check(parts[0] === 'js/00-core.js' && parts.at(-1) === 'js/70-command-ui-runtime.js', 'core and event wiring remain the boundaries');
check(parts.every((part) => fs.existsSync(path.join(root, part))), 'all declared module parts exist');
check(bootstrap.includes("const VERSION = '427';"), 'bootstrap advanced to v420');
check(html.includes('mathreader.js?v=427') && html.includes('mathreader.css?v=427'), 'HTML cache keys follow bootstrap');
check(bootstrap.includes('Promise.all(PARTS.map(fetchPart))'), 'fetching retains parallel acquisition with ordered assembly');
check(bootstrap.includes("sources.join('\\n')"), 'parts remain one assembled lexical module');
check(!parts.some((part) => html.includes(`src="${part}"`)), 'subsystems not individually injected as scripts');
check(!html.includes('formula-ocr-init-overlay') && !css.includes('.formula-ocr-init-overlay'), 'formula OCR initialization never inserts a blocking modal');

const sources = Object.fromEntries(parts.map((part) => [part, read(part)]));
const joined = parts.map((part) => sources[part]).join('\n');
check(sources['js/00-core.js'].includes('const STRUCTURE_INDEX_VERSION = 57;'), 'Structure index rebuilt under v46');
check(sources['js/00-core.js'].includes('const EQUATION_INDEX_SUMMARY_VERSION = 29;'), 'Equation summary schema v29 invalidates v419 deduplicated equation detections');
check(sources['js/10-formula-ocr.js'].includes('async function ensureMathOcrPipeline()'), 'lazy model loader retained');
check(sources['js/11-formula-vector.js'].includes('const pipe = await ensureMathOcrPipeline();'), 'first image extraction still acquires model');
check(!joined.includes('scheduleMathOcrPreload'), 'eager Formula OCR preload not restored');
check(!sources['js/10-formula-ocr.js'].includes('setFormulaOcrInitializationModal') && !joined.includes('formulaOcrInitModalVisible'), 'OCR initialization never makes other controls inert');
check(sources['js/41-equations-bibliography.js'].includes('function structureResultsIndexNavigationPage('), 'subject-index precision guard retained');
check(sources['js/41-equations-bibliography.js'].includes('function bareEquationInVerticalNumericTicks('), 'chart-axis precision guard retained');
check(sources['js/41-equations-bibliography.js'].includes('function bareEquationHasSameRowHeadingContext('), 'section-heading precision guard retained');
check(bootstrap.includes("window.dispatchEvent(new CustomEvent('mathreader:ready'))"), 'startup ready notification preserved');
check(bootstrap.includes("banner.classList.remove('is-hidden')"), 'startup failure banner preserved');
check(css.length > 10000, 'existing reader layout stylesheet preserved');
check(css.includes('.page-ocr-context-menu{') && css.includes('position:fixed;z-index:420'), 'manual page OCR context menu remains viewport positioned');
check(css.includes('.page-ocr-status{') && css.includes('position:absolute;bottom:12px;left:12px'), 'manual page OCR status remains an overlay, not a grid child');

// Parse only: no DOM, network, or model initialization is performed here.
check(Boolean(new vm.Script(joined, { filename: 'mathreader-runtime-v358.js' })), 'assembled runtime parses as one script');
console.log(`OK: ${count} MathReader v397 maintenance integrity assertions`);
