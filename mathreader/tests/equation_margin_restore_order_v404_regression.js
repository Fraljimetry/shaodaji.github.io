'use strict';
// v404: real 172-page Ahlfors export had 172 observations immediately after
// import, then 0 after reload. v403 restored from IndexedDB *before* calling
// loadDocumentState(), which always clears the supplemental OCR map.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../js/60-notes-bookmarks-data.js'),'utf8');
const core=fs.readFileSync(path.join(__dirname,'../js/00-core.js'),'utf8');
let checks=0;
function check(x,message){assert.ok(x,message);checks++;}
function scopeBetween(start,end){const at=source.indexOf(start);assert.ok(at>=0,`start missing: ${start}`);const stop=source.indexOf(end,at+start.length);assert.ok(stop>at,`end missing: ${end}`);return source.slice(at,stop);}
const open=scopeBetween('async function openPdfSource(', '\nlet documentOpenBusy');
const importFull=source.slice(source.indexOf('async function importReadingDataFile('));
const load='await loadEquationMarginOcrEvidence(pdfDoc, currentFileKey)';
const state='loadDocumentState(cachedRecord?.session || null)';
const gate='if (!documentTextFeaturesAvailable()) clearTextDerivedIndexesForUnavailableDocument()';
check(open.includes(load) && open.includes(state),'open includes durable restore and session restore');
check(open.indexOf(state)<open.indexOf(load),'open restores session before OCR evidence');
check(open.indexOf(gate)<open.indexOf(load),'open restores evidence after text-availability invalidation');
check(open.indexOf(load)<open.indexOf('ensureEquationIndexRendered().catch'),'open loads evidence before equation index work');
check((open.match(/await loadEquationMarginOcrEvidence\(/g)||[]).length===1,'open loads once after reset');
const currentImport=importFull.slice(importFull.indexOf('const sourceDoc = pdfDoc, sourceKey = currentFileKey;'));
const impState=currentImport.indexOf('loadDocumentState(importedSession)');
const impEvidence=currentImport.indexOf('await loadEquationMarginOcrEvidence(sourceDoc, sourceKey)');
check(impState>=0 && impEvidence>impState,'open-document import restores evidence after session reset');
check(currentImport.indexOf('await restoreImportedEquationMarginEvidence(payload, sourceKey, sourceDoc.numPages)')<impState,'import validates and stores evidence before changing session');
check(currentImport.indexOf('await loadEquationMarginOcrEvidence(sourceDoc, sourceKey)')<currentImport.indexOf('await Promise.all([renderOutline()'),'import evidence present before rendering');
check(core.includes('  equationSupplementalOcrCache = new Map();'),'session reset still clears stale evidence from previous documents');
// Reproduction: v403's sequence left the just-restored page evidence empty.
const cache=new Map(),key='sha256:ahlfors|right|81',db=new Map([[key,[{text:'(4-12)',ratio:.43}]]]);
function sessionRestore(){cache.clear();}function restore(){for (const [k,v] of db) cache.set(k,v);}
restore();sessionRestore();check(cache.size===0,'old restore-before-session sequence loses observations');
sessionRestore();restore();check(cache.get(key)?.[0].text==='(4-12)','fixed session-before-restore sequence retains coordinates');
console.log(`PASS | v404 OCR restore ordering | ${checks} assertions`);
