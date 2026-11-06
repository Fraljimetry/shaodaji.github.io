// v380: one-time first-open image recovery and explicit subsequent rescans.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const eq = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const test = (re, text, label) => assert.match(text, re, label);
test(/equationInitialRecoveryDone,/, core, 'persist initial OCR completion');
test(/equationInitialRecoveryDone = session\.equationInitialRecoveryDone === true/, core, 'restore prior completion');
test(/if \(restoredEquationIndex && equationInitialRecoveryDone\)/, core, 'old text-only snapshots are rescanned');
test(/!equationInitialRecoveryDone && !equationInitialRecoveryAttempted/, eq, 'first-open auto recovery only once per opening');
test(/if \(initialImageOcr && !current.failedPages\) \{[\s\S]*?persistDocumentState\(\)/, eq, 'only persist successful scan');
test(/if \(!forceImageOcr && !initialImageOcr\)/, eq, 'no premature text-only completion');
test(/\.finally\(\(\) => \{ equationIndexBuildPromise = null; refreshEquationForceOcrButton\(\); \}\)/, eq, 'button enabled after promise settles');
test(/if \(forceImageOcr\) comprehensivePages = Array\.from/, eq, 'manual OCR still covers every page');
test(/else comprehensivePages = equationSupplementalOcrPagePlan\(sourceDoc, index\)\.slice\(0, 72\)/, eq, 'initial scan uses bounded existing plan');
console.log('OK: 9 initial equation OCR / button checks');
