"""Adversarial provenance tests; do not claim live PDF/Texify execution."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from browser_campaign import verify, validate_manifest, normalized_latex, edit_distance
class BrowserCampaignTests(unittest.TestCase):
    def setUp(self):
        self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup)
        self.root=Path(self.t.name)
        self.pdf=self.root/'original.pdf';self.pdf.write_bytes(b'%PDF-1.4 original-test-sentinel')
        self.doc={'pdf':'original.pdf','sha256':hashlib.sha256(self.pdf.read_bytes()).hexdigest(),
                  'navigation':[{'kind':'structure','label':'Introduction','page':1,'ratio':.25}]}
        self.manifest=self.root/'campaign.json'
        self.save()
    def save(self):
        self.manifest.write_text(json.dumps({'schemaVersion':1,'documents':[self.doc]}))
    def test_parses_reviewed_evidence(self):self.assertEqual(len(validate_manifest(self.manifest)),1)
    def test_rejects_empty_navigation(self):
        self.doc['navigation']=[];self.save()
        self.assertEqual(verify(self.manifest,self.root)['status'],'FAIL')
    def test_rejects_hash_mismatch(self):
        self.doc['sha256']='0'*64;self.save()
        self.assertEqual(verify(self.manifest,self.root)['status'],'FAIL')
    def test_rejects_traversal(self):
        self.doc['pdf']='../other.pdf';self.save()
        self.assertEqual(verify(self.manifest,self.root)['status'],'FAIL')
    def test_rejects_untrusted_selector(self):
        self.doc['navigation'][0]['selector']='html';self.save()
        self.assertEqual(verify(self.manifest,self.root)['status'],'FAIL')
    def test_no_pdfjs_cannot_certify(self):
        self.assertEqual(verify(self.manifest,self.root)['status'],'INCOMPLETE')
    def test_missing_pdf_incomplete(self):
        self.pdf.unlink()
        self.assertEqual(verify(self.manifest,self.root)['status'],'INCOMPLETE')
    def test_invalid_page_rejected(self):
        self.doc['navigation'][0]['page']=True;self.save()
        self.assertEqual(verify(self.manifest,self.root)['status'],'FAIL')
    def test_unreviewed_ocr_does_not_certify(self):
        self.assertEqual(verify(self.manifest,self.root,require_ocr=True)['ocrCertified'],False)
    def test_invalid_ocr_case_rejected(self):
        self.doc['ocr']=[{'page':1,'latex':'x','rectPdfPt':[3,4,1,2]}];self.save()
        self.assertEqual(verify(self.manifest,self.root)['status'],'FAIL')
    def test_latex_distance(self):
        self.assertEqual(normalized_latex('a + b'), 'a+b')
        self.assertEqual(edit_distance('abc','adc'),1)
        self.assertEqual(edit_distance('','abc'),3)
if __name__=='__main__':unittest.main()
