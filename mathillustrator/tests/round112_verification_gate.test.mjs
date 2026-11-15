import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const cwd=new URL('..',import.meta.url);

test('reporter fails closed when browser/performance evidence was not executed',()=>{
 const d=mkdtempSync(join(tmpdir(),'mi-verification-'));
 try{
  const p=join(d,'evidence.json');
  writeFileSync(p,JSON.stringify({schemaVersion:1,checks:[{name:'math-properties',status:'PASS',command:['node','tests/verification/run_kernel_properties.mjs']}]}));
  const r=spawnSync(process.execPath,['tests/verification/report_coverage.mjs',`--evidence-file=${p}`],{cwd,encoding:'utf8'});
  assert.equal(r.status,2,r.stderr);
  const report=JSON.parse(r.stdout);
  assert.equal(report.complete,false);
  assert.ok(report.executedVerified<report.catalogued);
  assert.ok(report.operations.find(o=>o.id==='integration.browser-interaction').missing.some(x=>x.includes('not executed')));
  assert.ok(report.operations.find(o=>o.id==='integration.performance').missing.some(x=>x.includes('not executed')));
 }finally{rmSync(d,{recursive:true,force:true});}
});

test('reporter rejects evidence from a failed browser suite',()=>{
 const d=mkdtempSync(join(tmpdir(),'mi-verification-'));
 try{
  const p=join(d,'evidence.json');
  writeFileSync(p,JSON.stringify({schemaVersion:1,checks:[
    {name:'math-properties',status:'PASS',command:['node','tests/verification/run_kernel_properties.mjs']},
    {name:'browser-seeded',status:'FAIL',command:['python','tests/browser_round102_seeded_interactions.py']},
    {name:'node-performance',status:'PASS',command:['node','tests/verification/benchmark_performance.mjs']},
    {name:'browser-performance',status:'PASS',command:['python','tests/browser_round103_performance.py']}
  ]}));
  const r=spawnSync(process.execPath,['tests/verification/report_coverage.mjs',`--evidence-file=${p}`],{cwd,encoding:'utf8'});
  assert.equal(r.status,2,r.stderr);
  assert.equal(JSON.parse(r.stdout).operations.find(o=>o.id==='integration.browser-interaction').verified,false);
 }finally{rmSync(d,{recursive:true,force:true});}
});
