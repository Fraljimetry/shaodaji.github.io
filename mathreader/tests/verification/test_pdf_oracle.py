"""Negative and positive oracle acceptance tests using a generated PDF (not real-corpus evidence)."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from pdf_oracle import verify


class PdfOracleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = Path(self.tmp.name)
        import fitz
        pdf = fitz.open()
        p = pdf.new_page(width=400, height=300)
        p.insert_text((40, 50), 'Theorem 1.2')
        p.insert_text((40, 150), 'Equation 3.4')
        self.pdf = self.folder / 'fixture.pdf'
        pdf.save(self.pdf)
        pdf.close()
        self.target = {'kind': 'results', 'page': 1, 'text': 'Theorem 1.2', 'rect': [39, 35, 120, 55]}
        self.doc = {'pdf': 'fixture.pdf', 'sha256': hashlib.sha256(self.pdf.read_bytes()).hexdigest(), 'targets': [self.target]}

    def run_oracle(self, docs=None):
        manifest = self.folder / 'oracle.json'
        manifest.write_text(json.dumps({'schemaVersion': 1, 'documents': docs if docs is not None else [self.doc]}), encoding='utf-8')
        return verify(manifest)

    def test_valid_pdf_coordinates(self):
        result = self.run_oracle()
        self.assertEqual(result['status'], 'PASS')
        self.assertFalse(result['navigationCertified'])

    def test_wrong_page(self):
        self.target['page'] = 2
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_wrong_target_rectangle(self):
        self.target['rect'] = [250, 200, 300, 230]
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_wrong_pdf_checksum(self):
        self.doc['sha256'] = '0' * 64
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_missing_pdf(self):
        self.doc['pdf'] = 'missing.pdf'
        self.assertEqual(self.run_oracle()['status'], 'INCOMPLETE')

    def test_path_traversal(self):
        self.doc['pdf'] = '../fixture.pdf'
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_empty_evidence(self):
        self.assertEqual(self.run_oracle([])['status'], 'INCOMPLETE')

    def test_mixed_pass_failure(self):
        self.doc['targets'].append({'kind': 'navigation', 'page': 1, 'text': 'not present', 'rect': [30, 30, 100, 55]})
        result = self.run_oracle()
        self.assertEqual(result['counts']['PASS'], 1)
        self.assertEqual(result['counts']['FAIL'], 1)
        self.assertEqual(result['status'], 'FAIL')

    def test_unsupported_raster_not_fake_pass(self):
        self.target['text'] = 'not present'
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_malformed_geometry(self):
        self.target['rect'] = [0, 0, float('nan'), 20]
        self.assertEqual(self.run_oracle()['status'], 'FAIL')


if __name__ == '__main__':
    unittest.main(verbosity=2)
