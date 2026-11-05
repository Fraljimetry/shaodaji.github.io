#!/usr/bin/env python3
"""P0 fail-closed regression: stale browser captures must never establish PASS."""
from pathlib import Path
import json
import sys
import tempfile
import unittest
from unittest.mock import patch

TOOLS=Path(__file__).resolve().parents[1]/'regression_tools'
sys.path.insert(0,str(TOOLS))
import p0_gate

class P0GateIsolation(unittest.TestCase):
    def test_blocked_new_browser_run_never_uses_old_success(self):
        with tempfile.TemporaryDirectory() as root:
            folder=Path(root)
            source=folder/'app'
            source.mkdir()
            (source/'mathreader.js').write_text("const VERSION = '356';\n",encoding='utf8')
            manifest=folder/'manifest.json'
            manifest.write_text(json.dumps({'documents':[]}),encoding='utf8')
            output=folder/'report'
            (output/'browser-documents').mkdir(parents=True)
            (output/'ground-truth').mkdir(parents=True)
            (output/'browser-documents'/'stale.json').write_text('{"stale":"PASS"}')
            (output/'ground-truth'/'p0_audit.json').write_text('{"acceptance":"PASS"}')
            events=[]
            def fake_run(cmd,cwd,seconds=180):
                events.append(cmd)
                if '--shell-only' in cmd:return {'status':'PASS','command':cmd,'output':''}
                if '--manifest' in cmd:return {'status':'INCOMPLETE','command':cmd,'output':'No pinned PDF.js'}
                self.fail('Ground truth comparator must not run after missing browser assets')
            with patch.object(p0_gate,'all_source_gates',return_value=[{'status':'PASS'}]),patch.object(p0_gate,'run_process',side_effect=fake_run):
                status=p0_gate.main(['--source-root',str(source),'--out-dir',str(output),'--manifest',str(manifest),'--require-p0-full'])
            audit=json.loads((output/'p0_gate.json').read_text())
            self.assertEqual(status,2)
            self.assertEqual(audit['p0_full_document_acceptance'],'INCOMPLETE')
            self.assertEqual(audit['ground_truth_comparison']['status'],'BLOCKED')
            self.assertEqual(len(events),2)
            self.assertFalse((output/'browser-documents'/'stale.json').exists())
            self.assertFalse((output/'ground-truth'/'p0_audit.json').exists())

    def test_successful_browser_still_requires_actual_comparator(self):
        with tempfile.TemporaryDirectory() as root:
            folder=Path(root)
            source=folder/'app';source.mkdir()
            (source/'mathreader.js').write_text("const VERSION = '356';\n")
            manifest=folder/'manifest.json';manifest.write_text('{"documents":[]}')
            output=folder/'report'
            calls=[]
            def fake_run(cmd,cwd,seconds=180):
                calls.append(cmd)
                if 'p0_browser.py' in str(cmd) and '--manifest' in cmd:
                    (output/'browser-documents'/('0'*64+'.json')).write_text('{}')
                return {'status':'PASS' if '--shell-only' in cmd or 'p0_browser.py' in str(cmd) else 'FAIL','command':cmd,'output':''}
            with patch.object(p0_gate,'all_source_gates',return_value=[{'status':'PASS'}]),patch.object(p0_gate,'run_process',side_effect=fake_run):
                code=p0_gate.main(['--source-root',str(source),'--out-dir',str(output),'--manifest',str(manifest),'--require-p0-full'])
            audit=json.loads((output/'p0_gate.json').read_text())
            self.assertEqual(code,2)
            self.assertEqual(audit['p0_full_document_acceptance'],'INCOMPLETE')
            self.assertEqual(audit['ground_truth_comparison']['status'],'FAIL')
            self.assertEqual(len(calls),3)

    def test_fresh_partial_browser_errors_are_reported_as_fail(self):
        import fitz
        with tempfile.TemporaryDirectory() as root:
            folder=Path(root)
            source=folder/'app';source.mkdir()
            (source/'mathreader.js').write_text("const VERSION = '356';\n")
            (source/'regression_tools').mkdir()
            (source/'regression_tools/p0_ground_truth.py').write_bytes((TOOLS/'p0_ground_truth.py').read_bytes())
            pdf=folder/'actual.pdf'
            doc=fitz.open();doc.new_page();doc.save(pdf);doc.close()
            import hashlib
            sha=hashlib.sha256(pdf.read_bytes()).hexdigest()
            manifest=folder/'manifest.json'
            manifest.write_text(json.dumps({'schema':1,'documents':[{'path':str(pdf),'sha256':sha,'pages':1}]}))
            output=folder/'report'
            genuine=p0_gate.run_process
            def fake_run(cmd,cwd,seconds=180):
                if '--shell-only' in cmd:return {'status':'PASS','command':cmd,'output':''}
                if 'p0_browser.py' in str(cmd):
                    (output/'browser-documents'/f'{sha}.json').write_text(json.dumps({
                        'schema':1,'capture_source':'mathreader_actual_browser_pdfjs','pdf_sha256':sha,
                        'pages':1,'engine':{'pdfjs':'4.10.38'},'stages':{},
                        'errors':['Actual PDF.js document failed to render'],'indexes':{}
                    }))
                    return {'status':'INCOMPLETE','command':cmd,'output':'Document-level browser error'}
                return genuine(cmd,cwd,seconds)
            with patch.object(p0_gate,'all_source_gates',return_value=[{'status':'PASS'}]),patch.object(p0_gate,'run_process',side_effect=fake_run):
                status=p0_gate.main(['--source-root',str(source),'--out-dir',str(output),'--manifest',str(manifest)])
            audit=json.loads((output/'p0_gate.json').read_text())
            self.assertEqual(status,1)
            self.assertEqual(audit['p0_full_document_acceptance'],'FAIL')
            self.assertEqual(audit['ground_truth_comparison']['status'],'INCOMPLETE')
            detail=json.loads((output/'ground-truth/p0_audit.json').read_text())
            self.assertEqual(detail['documents'][0]['classification'],'FAIL')

    def test_real_p1_blocked_detail_is_not_hidden_by_generic_exit_status(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);source=root/'app';source.mkdir()
            (source/'mathreader.js').write_text("const VERSION = '358';\n")
            output=root/'report'
            def fake_run(cmd,cwd,seconds=180):
                if '--shell-only' in cmd:
                    return {'status':'PASS','command':cmd,'output':''}
                if 'p1_browser_e2e.py' in str(cmd):
                    dest=output/'p1-real-browser';dest.mkdir(parents=True)
                    (dest/'p1_browser_e2e.json').write_text('{"status":"BLOCKED","errors":["missing pinned PDF.js"]}')
                    return {'status':'INCOMPLETE','command':cmd,'output':'No pinned PDF.js'}
                self.fail(f'Unexpected subprocess: {cmd}')
            with patch.object(p0_gate,'all_source_gates',return_value=[{'status':'PASS'}]), patch.object(p0_gate,'run_process',side_effect=fake_run):
                code=p0_gate.main(['--source-root',str(source),'--out-dir',str(output),
                    '--p1-source-pdf',str(root/'a.pdf'),'--p1-target-pdf',str(root/'b.pdf'),'--require-p1-real'])
            self.assertEqual(code,2)
            audit=json.loads((output/'p0_gate.json').read_text())
            self.assertEqual(audit['p1_real_document_navigation']['detail_status'],'BLOCKED')

    def test_required_real_p1_cannot_pass_with_missing_pinned_pdfjs(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            source=root/'app';source.mkdir()
            (source/'mathreader.js').write_text("const VERSION = '357';\n")
            output=root/'report'
            prior=output/'p1-real-browser';prior.mkdir(parents=True)
            (prior/'p1_browser_e2e.json').write_text('{"status":"PASS"}')
            calls=[]
            def fake_run(cmd,cwd,seconds=180):
                calls.append(cmd)
                if '--shell-only' in cmd:
                    return {'status':'PASS','command':cmd,'output':''}
                if 'p1_browser_e2e.py' in str(cmd):
                    return {'status':'INCOMPLETE','command':cmd,'output':'BLOCKED: exact PDF.js missing'}
                self.fail(f'Unexpected call: {cmd}')
            with patch.object(p0_gate,'all_source_gates',return_value=[{'status':'PASS'}]), patch.object(p0_gate,'run_process',side_effect=fake_run):
                code=p0_gate.main(['--source-root',str(source),'--out-dir',str(output),
                    '--p1-source-pdf',str(root/'a.pdf'),'--p1-target-pdf',str(root/'b.pdf'),
                    '--require-p1-real'])
            self.assertEqual(code,2)
            report=json.loads((output/'p0_gate.json').read_text())
            self.assertEqual(report['p1_real_document_navigation']['status'],'INCOMPLETE')
            self.assertFalse((prior/'p1_browser_e2e.json').exists(), 'Old P1 PASS evidence must not survive')
            self.assertEqual(len(calls),2)

if __name__=='__main__':unittest.main(verbosity=2)
