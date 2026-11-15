"""Adversarial tests for saved MathReader detection-export acceptance (synthetic data)."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from index_oracle import verify


class IndexOracleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.detection = {
            'version': 1,
            'structure': [{'label': 'Chapter 1', 'page': 1, 'ratio': .2}],
            'results': [{'label': 'Theorem 1.2', 'page': 1, 'ratio': .3}],
            'equations': {'version': 29, 'rows': [{'label': '(1.1)', 'page': 2, 'ratio': .5}]},
            'bibliography': [{'number': '[11]', 'page': 3, 'ratio': .7}],
        }
        self.export = {'schema': 'mathreader.reading-data@1',
                       'document': {'id': 'pdf-id', 'name': 'Book.pdf', 'pages': 3},
                       'exportLayers': {'detection': 'included'}, 'contentDetection': self.detection}
        self.spec = {'export': 'book-mathreader.json', 'sha256': '', 'documentId': 'pdf-id', 'pageCount': 3,
                     'targets': [
                         {'kind': 'structure', 'label': 'Chapter 1', 'page': 1, 'ratio': .2},
                         {'kind': 'results', 'label': 'Theorem 1.2', 'page': 1, 'ratio': .3},
                         {'kind': 'equations', 'label': '(1.1)', 'page': 2, 'ratio': .5},
                         {'kind': 'bibliography', 'label': '[11]', 'page': 3, 'ratio': .7},
                     ], 'exhaustiveKinds': ['structure', 'results', 'equations', 'bibliography']}
        self.path = self.directory / 'manifest.json'

    def run_oracle(self):
        export_file = self.directory / self.spec['export']
        if not export_file.parent.exists():
            export_file.parent.mkdir(parents=True, exist_ok=True)
        export_file.write_text(json.dumps(self.export), encoding='utf8')
        self.spec['sha256'] = hashlib.sha256(export_file.read_bytes()).hexdigest()
        self.path.write_text(json.dumps({'schemaVersion': 1, 'documents': [self.spec]}), encoding='utf8')
        return verify(self.path)

    def test_four_indexes_pass(self):
        output = self.run_oracle()
        self.assertEqual(output['status'], 'PASS', output['cases'])
        self.assertEqual(output['counts']['PASS'], 4)
        self.assertEqual(output['metrics']['document:0:results']['precision'], 1)
        self.assertFalse(output['navigationCertified'])
        self.assertFalse(output['freshDetectionCertified'])

    def test_wrong_page(self):
        self.spec['targets'][1]['page'] = 3
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_wrong_position(self):
        self.spec['targets'][1]['ratio'] = .8
        result = self.run_oracle()
        self.assertEqual(result['status'], 'FAIL')
        self.assertTrue(any('wrong reading position' in c['reason'] for c in result['cases']))

    def test_missing_export_layer(self):
        del self.export['contentDetection']
        self.assertEqual(self.run_oracle()['status'], 'INCOMPLETE')

    def test_malformed_equation_rows(self):
        self.detection['equations'] = {'rows': 'not a list'}
        self.assertEqual(self.run_oracle()['status'], 'INCOMPLETE')

    def test_duplicate_targets_not_reused(self):
        self.spec['targets'].append(dict(self.spec['targets'][1]))
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_unreviewed_entry_does_not_pass_exhaustive_precision(self):
        self.detection['results'].append({'label': 'Lemma 2.5', 'page': 2, 'ratio': .6})
        result = self.run_oracle()
        self.assertEqual(result['status'], 'FAIL')
        self.assertEqual(result['metrics']['document:0:results']['precision'], .5)

    def test_nonexhaustive_precision_is_unknown(self):
        self.spec['exhaustiveKinds'] = []
        self.detection['results'].append({'label': 'Lemma 2.5', 'page': 2, 'ratio': .6})
        result = self.run_oracle()
        self.assertEqual(result['status'], 'PASS')
        self.assertIsNone(result['metrics']['document:0:results']['precision'])

    def test_wrong_document_identity(self):
        self.spec['documentId'] = 'another-book'
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_invalid_observed_ratio(self):
        self.detection['results'][0]['ratio'] = 99
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_path_traversal(self):
        self.spec['export'] = '../other-export.json'
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_missing_export(self):
        result = self.run_oracle()
        (self.directory / self.spec['export']).unlink()
        self.assertEqual(verify(self.path)['status'], 'INCOMPLETE')

    def test_mismatched_checksum(self):
        self.run_oracle()
        data = json.loads(self.path.read_text())
        data['documents'][0]['sha256'] = '0' * 64
        self.path.write_text(json.dumps(data))
        self.assertEqual(verify(self.path)['status'], 'FAIL')

    def test_empty_ground_truth(self):
        self.spec['targets'] = []
        self.assertEqual(self.run_oracle()['status'], 'FAIL')

    def test_malformed_observed_page_boolean(self):
        self.detection['results'][0]['page'] = True
        self.assertEqual(self.run_oracle()['status'], 'FAIL')


if __name__ == '__main__':
    unittest.main()
