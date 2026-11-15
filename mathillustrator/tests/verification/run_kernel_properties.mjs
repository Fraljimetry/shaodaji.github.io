#!/usr/bin/env node
/** Machine-readable seeded property runner; exit 1 if any invariant fails. */
import {runProperties,DEFAULT_SEED,FAMILY_CASES,SCALES} from './kernel_properties.mjs';
const arg=process.argv.find(a=>a.startsWith('--seed='));
const seed=arg?Number(arg.slice(7)):DEFAULT_SEED;
const n=process.argv.find(a=>a.startsWith('--cases='));
const perFamily=n?Number(n.slice(8)):null;
try {
 const cases=perFamily===null?FAMILY_CASES:Object.fromEntries(Object.keys(FAMILY_CASES).map(k=>[k,perFamily]));
 const result=runProperties({seed,cases});
 const report={...result,scales:SCALES,total:Object.values(cases).reduce((a,b)=>a+b,0),failed:result.results.reduce((a,r)=>a+r.failed,0)};
 process.stdout.write(JSON.stringify(report,null,2)+'\n');
 if(report.failed)process.exitCode=1;
} catch(err) {process.stderr.write(String(err)+'\n');process.exitCode=2;}
