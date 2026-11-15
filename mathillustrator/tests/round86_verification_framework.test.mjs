import test from 'node:test';
import assert from 'node:assert/strict';
import {rng,runProperties,FAMILY_CASES,DEFAULT_SEED,SCALES} from './verification/kernel_properties.mjs';

test('framework RNG is reproducible, and independently seeded',()=>{
 const a=rng(123),b=rng(123),c=rng(124);
 const seq=Array.from({length:30},()=>a());
 assert.deepEqual(seq,Array.from({length:30},()=>b()));
 assert.notDeepEqual(seq,Array.from({length:30},()=>c()));
 assert.ok(seq.every(v=>v>=0&&v<1));
});
test('framework refuses invalid suites and seeds',()=>{
 assert.throws(()=>runProperties({seed:-1}),/seed/);
 assert.throws(()=>runProperties({cases:{'nonexistent.property':12}}),/Invalid/);
 assert.throws(()=>runProperties({cases:{'rotation.isometry':0}}),/Invalid/);
});
test('geometry invariants — deterministic multi-scale suite',()=>{
 const result=runProperties();
 assert.equal(result.seed,DEFAULT_SEED);
 assert.equal(result.results.length,Object.keys(FAMILY_CASES).length);
 assert.equal(SCALES.length,6);
 const failures=result.results.filter(r=>r.failed);
 assert.deepEqual(failures,[],`seed=${DEFAULT_SEED} failures=${JSON.stringify(failures.slice(0,3))}`);
 assert.equal(result.results.reduce((s,r)=>s+r.passed,0),Object.values(FAMILY_CASES).reduce((s,n)=>s+n,0));
});

test('coverage inventory distinguishes declaration from executed release checks',async()=>{
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync(process.execPath,['tests/verification/report_coverage.mjs','--catalog-only'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 const report=JSON.parse(result.stdout);
 assert.equal(report.propertyFamilies,Object.keys(FAMILY_CASES).length);
 assert.equal(report.catalogued,28);
 assert.equal(report.declaredCovered,28);
 assert.equal(report.executedVerified,0);
 assert.equal(report.complete,false);
});
