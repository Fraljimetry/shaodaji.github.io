#!/usr/bin/env python3
"""Self-tests of the gate, using a disposable minimal app, not MathReader runtime."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ENGINE = Path(__file__).with_name('release_gate.py')


@unittest.skipUnless(shutil.which('node'), 'Node needed for runner integration tests')
class GateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'mathreader'
        (self.root / 'tests').mkdir(parents=True)
        (self.root / 'js').mkdir()
        (self.root / 'tests' / 'verification').mkdir()
        for name in ('test_release_gate.py', 'test_pdf_oracle.py', 'test_index_oracle.py'):
            (self.root / 'tests' / 'verification' / name).write_text("print('engine-selftest passed')")
        (self.root / 'index.html').write_text('<title>fixture</title>')
        (self.root / 'mathreader.js').write_text('const ok=1;')
        (self.root / 'js' / '00-core.js').write_text('const ok=1;')
        (self.root / 'tests' / 'settings_regression.js').write_text("console.log('pass')")
        (self.root / 'tests' / 'render_regression.py').write_text("print('pass')")

    def run_gate(self, *extra):
        report = self.root / 'result.json'
        p = subprocess.run([sys.executable, str(ENGINE), '--root', str(self.root),
                            '--output', str(report), '--test-timeout', '1', '--browser-timeout', '2',
                            *extra], text=True, capture_output=True, timeout=30)
        self.assertTrue(report.is_file(), p.stderr)
        return p.returncode, json.loads(report.read_text())

    def test_quick_pass_and_evidence(self):
        code, report = self.run_gate()
        self.assertEqual(code, 0)
        self.assertEqual(report['status'], 'PASS')
        self.assertTrue(report['sourceFingerprint'])
        self.assertEqual(report['testsSelected'], {'javascript': 1, 'python': 1})
        self.assertTrue(all(x['status'] == 'PASS' for x in report['checks']))

    def test_failure_is_not_silenced(self):
        (self.root / 'tests' / 'settings_regression.js').write_text('process.exit(3)')
        code, report = self.run_gate()
        self.assertEqual(code, 1)
        self.assertEqual(report['status'], 'FAIL')
        self.assertEqual(next(x for x in report['checks'] if x['name'].startswith('node:'))['returnCode'], 3)

    def test_missing_source_is_incomplete(self):
        (self.root / 'mathreader.js').unlink()
        code, report = self.run_gate()
        self.assertEqual(code, 2)
        self.assertEqual(report['status'], 'INCOMPLETE')

    def test_timeout_fails_and_returns_report(self):
        (self.root / 'tests' / 'settings_regression.js').write_text('setTimeout(()=>{}, 6000)')
        code, report = self.run_gate()
        self.assertEqual(code, 1)
        self.assertTrue(any('timeout' in (x.get('reason') or '') for x in report['checks']))

    def test_release_cannot_fake_ocr_or_pdf_certification(self):
        code, report = self.run_gate('--profile', 'release')
        self.assertEqual(code, 2)
        self.assertFalse(report['releaseCertified'])
        self.assertEqual(report['status'], 'INCOMPLETE')
        self.assertEqual(sum(x['name'].endswith('certification') for x in report['checks']), 2)

    def test_missing_engine_selftest_is_incomplete(self):
        (self.root / 'tests' / 'verification' / 'test_release_gate.py').unlink()
        code, report = self.run_gate()
        self.assertEqual(code, 2)
        self.assertTrue(any(x['name'] == 'verification-engine-selftest' and x['status'] == 'INCOMPLETE'
                            for x in report['checks']))

    def test_missing_index_oracle_selftests_is_incomplete(self):
        (self.root / 'tests' / 'verification' / 'test_index_oracle.py').unlink()
        code, report = self.run_gate()
        self.assertEqual(code, 2)
        self.assertTrue(any(x['name'] == 'math-index-oracle-selftest' and x['status'] == 'INCOMPLETE' for x in report['checks']))

    def test_failed_pdf_oracle_selftest_fails(self):
        (self.root / 'tests' / 'verification' / 'test_pdf_oracle.py').write_text('raise Exception("bad oracle")')
        code, report = self.run_gate()
        self.assertEqual(code, 1)
        self.assertTrue(any(x['name'] == 'pdf-geometry-oracle-selftest' and x['status'] == 'FAIL' for x in report['checks']))

    def test_release_requires_index_oracle_evidence(self):
        code, report = self.run_gate('--profile', 'release')
        self.assertEqual(code, 2)
        self.assertTrue(any(x['name'] == 'mathreader-export-index-oracle' and x['status'] == 'INCOMPLETE' for x in report['checks']))

    def test_zero_skipped_is_not_a_skip(self):
        (self.root / 'tests' / 'render_regression.py').write_text("print('7 passed, 0 skipped')")
        code, report = self.run_gate()
        self.assertEqual(code, 0)
        self.assertEqual(report['status'], 'PASS')

    def test_actual_skipped_corpus_is_incomplete(self):
        (self.root / 'tests' / 'render_regression.py').write_text("print('PASS fixture; original PDF corpus SKIPPED')")
        code, report = self.run_gate()
        self.assertEqual(code, 2)
        self.assertEqual(report['status'], 'INCOMPLETE')

    def test_engine_selftest_failure_blocks_gate(self):
        (self.root / 'tests' / 'verification' / 'test_release_gate.py').write_text('raise RuntimeError("broken gate")')
        code, report = self.run_gate()
        self.assertEqual(code, 1)
        self.assertTrue(any(x['name'] == 'verification-engine-selftest' and x['status'] == 'FAIL'
                            for x in report['checks']))

    def test_filtered_run_is_incomplete_even_when_every_selected_test_passes(self):
        code, report = self.run_gate('--only', 'settings')
        self.assertEqual(code, 2)
        self.assertEqual(report['status'], 'INCOMPLETE')
        self.assertEqual(report['testsSelected']['python'], 0)
        self.assertTrue(any(x['name'] == 'partial-selection' for x in report['checks']))
        self.assertFalse((self.root / 'result.json.partial').exists())

    def test_empty_filter_reports_incomplete_explicitly(self):
        code, report = self.run_gate('--only', 'nonexistent-verification-test-xyz')
        self.assertEqual(code, 2)
        self.assertEqual(report['testsSelected']['javascript'], 0)
        self.assertEqual(report['testsSelected']['python'], 0)
        self.assertTrue(any(x['name'] == 'empty-test-selection' and x['status'] == 'INCOMPLETE'
                            for x in report['checks']))

    def test_syntax_failure(self):
        (self.root / 'mathreader.js').write_text('function (')
        code, report = self.run_gate()
        self.assertEqual(code, 1)
        self.assertEqual(report['status'], 'FAIL')


if __name__ == '__main__':
    unittest.main()
