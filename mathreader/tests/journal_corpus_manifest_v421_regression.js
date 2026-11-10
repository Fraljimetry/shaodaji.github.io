'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const spec=JSON.parse(fs.readFileSync(path.join(root,'regression/journal_corpus_v421.json'),'utf8'));
assert.equal(spec.schema,'mathreader.journal_corpus_selection@1');
assert.equal(spec.total_journals,10);
assert.equal(spec.total_papers,30);
assert.equal(spec.papers.length,30);
assert.equal(new Set(spec.papers.map(p=>p.journal)).size,10);
assert.equal(new Set(spec.papers.map(p=>p.id)).size,30);
assert.equal(new Set(spec.papers.map(p=>p.local_pdf)).size,30);
for(const p of spec.papers){
 assert.match(p.publisher_url,/^https:\/\//);
 assert.match(p.local_pdf,/^journal_pdfs\/j\d{2}p[123]_[a-z0-9_]+\.pdf$/);
 assert.equal(p.pdf_bytes_available,false,'a publisher link is not evidence of downloaded PDF bytes');
 assert.equal(p.source_level_detection_executed,false,'do not misrepresent paper selection as executed');
 assert.equal(p.independent_ground_truth_complete,false);
}
const counts=Object.groupBy(spec.papers,p=>p.journal);
assert.ok(Object.values(counts).every(xs=>xs.length===3),'three distinct paper candidates per journal');
console.log('PASS v421 journal corpus: 10 journals, 30 real publisher-selected papers, all correctly marked not executed');
