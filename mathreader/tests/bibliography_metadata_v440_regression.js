'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const ctx=vm.createContext({console,document:{addEventListener(){}}});vm.runInContext(source,ctx,{timeout:8000});
const cases=[
 ['Reference doi:10.1000/xyz(abc)', '10.1000/xyz(abc)'],
 ['Reference doi:10.1000/xyz(abc).', '10.1000/xyz(abc)'],
 ['Reference (doi:10.1000/xyz(abc))', '10.1000/xyz(abc)'],
 ['Reference DOI: 10.1000/abc.', '10.1000/abc'],
 ['Reference DOI: 10.1000/a(b(c)d)e', '10.1000/a(b(c)d)e'],
];
for (const [input,wanted] of cases) assert.equal(ctx.bibliographyMetadata(input).doi,wanted,`DOI from ${input}`);
console.log(`PASS ${cases.length} DOI normalization assertions`);
