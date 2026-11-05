#!/usr/bin/env python3
"""Deterministic integration smoke for the offline cached PDF regression runner.

Requires PyMuPDF and Node.js; optional actual Tesseract/MathJax checked by the
full 50-PDF external benchmark. This test does not need network or real OCR.
"""
from __future__ import annotations
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RUN=ROOT/'regression_tools'/'run.py'


def invoke(dir, cache, output, *args, success=True):
    cmd=[sys.executable,str(RUN),'--corpus-dir',str(dir),'--cache-dir',str(cache),
         '--out-dir',str(output),'--workers','2','--ocr','none',*args]
    r=subprocess.run(cmd,capture_output=True,text=True,timeout=90)
    assert (r.returncode==0)==success,(r.stdout,r.stderr)
    return json.loads((output/'audit.json').read_text()) if success else r.stderr


def write_pdf(path,text):
    import fitz
    doc=fitz.open();page=doc.new_page();page.insert_text((70,140),text,fontsize=15)
    doc.save(path);doc.close()


def test():
    checks=0
    with tempfile.TemporaryDirectory() as tmp:
        d=Path(tmp);corpus=d/'source';corpus.mkdir();cache=d/'cache'
        write_pdf(corpus/'a.pdf','Theorem 1.2: x+y=3')
        write_pdf(corpus/'b.pdf','3.14 References')
        first=invoke(corpus,cache,d/'out1','--max-files','2')
        assert first['summary']['pdf_count']==2 and first['summary']['total_pages']==2;checks+=1
        assert first['summary']['extraction_cache_hits']==0;checks+=1
        assert first['summary']['detector_cache_hits']==0;checks+=1
        assert all('formula_region' in r and r['full_document_accuracy']=='UNVERIFIED'
                   for r in first['documents']);checks+=1
        second=invoke(corpus,cache,d/'out2','--max-files','2')
        assert second['summary']['extraction_cache_hits']==2;checks+=1
        assert second['summary']['detector_cache_hits']==2;checks+=1
        assert [x['detector_proxy'] for x in first['documents']]==[x['detector_proxy'] for x in second['documents']];checks+=1
        # Content mutation invalidates exactly one document, not unrelated data.
        write_pdf(corpus/'b.pdf','A new source document with a different digest')
        third=invoke(corpus,cache,d/'out3','--max-files','2')
        assert third['summary']['extraction_cache_hits']==1;checks+=1
        assert third['summary']['detector_cache_hits']==1;checks+=1
        # An actual detector-source change must invalidate detector outputs,
        # without requiring a repeat of PDF text extraction.
        project=d/'project';(project/'js').mkdir(parents=True)
        (project/'regression_tools').mkdir()
        import shutil
        shutil.copy2(ROOT/'js/41-equations-bibliography.js',project/'js/41-equations-bibliography.js')
        shutil.copy2(ROOT/'regression_tools/detector_proxy.js',project/'regression_tools/detector_proxy.js')
        fourth=invoke(corpus,cache,d/'out4','--project-root',str(project),'--max-files','2')
        assert fourth['summary']['extraction_cache_hits']==2 and fourth['summary']['detector_cache_hits']==2;checks+=1
        with (project/'js/41-equations-bibliography.js').open('a',encoding='utf8') as f:
            f.write('\n// smoke cache-fingerprint change\n')
        fifth=invoke(corpus,cache,d/'out5','--project-root',str(project),'--max-files','2')
        assert fifth['summary']['extraction_cache_hits']==2 and fifth['summary']['detector_cache_hits']==0;checks+=1
        # Explicit OCR budget limits must report unprocessed work, not PASS.
        skipped=invoke(corpus,cache,d/'out_ocr_deferred','--ocr','selected',
                       '--max-ocr-pages','0','--max-files','2')
        assert skipped['summary']['ocr']['deferred_due_to_budget']==2;checks+=1
        assert sum(len(x['ocr_deferred_pages']) for x in skipped['documents'])==2;checks+=1
        # The SHA-256 guard rejects rebadged copies before detector execution.
        (corpus/'b.pdf').write_bytes((corpus/'a.pdf').read_bytes())
        error=invoke(corpus,cache,d/'rejected','--max-files','2',success=False)
        assert 'Duplicate PDF bytes' in error;checks+=1
        (corpus/'b.pdf').unlink()
        # A known hash mismatch must fail closed rather than accept a newer file.
        man=d/'manifest.json'
        man.write_text(json.dumps({'documents':[{'path':str(corpus/'a.pdf'),'sha256':'0'*64}]}))
        cmd=[sys.executable,str(RUN),'--manifest',str(man),'--out-dir',str(d/'bad')]
        r=subprocess.run(cmd,capture_output=True,text=True,timeout=10)
        assert r.returncode!=0 and 'SHA-256 mismatch' in r.stderr;checks+=1
        # Real formula syntax checker evaluates source postprocessing; synthetic
        # manually supplied LaTeX is not misrepresented as Texify inference.
        sha=next(x['sha256'] for x in first['documents'] if x['filename']=='a.pdf')
        sidecar=d/'candidates.json'
        sidecar.write_text(json.dumps({'cases':[{'id':'alignment-regression','sha256':sha,
                    'page':1,'provenance':'manual-fixture',
                    'latex':r'\begin{aligned}x_{i&=j}&=1\\ y&=2\end{aligned}'}]}))
        formula_out=invoke(corpus,cache,d/'formula','--max-files','1','--formula-candidates',str(sidecar))
        case=formula_out['documents'][0]['formula_candidates'][0]
        assert case['mathjax_compiled'] and case['changed'] and 'i=j' in case['processed_latex'];checks+=1
        assert case['semantic_accuracy'].startswith('UNVERIFIED');checks+=1
    print(f'OK: {checks} cached regression runner smoke assertions')


if __name__=='__main__':
    test()
