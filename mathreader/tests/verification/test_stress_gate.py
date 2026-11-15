import sys
from pathlib import Path
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parent))
from stress_gate import verify
class StressTests(unittest.TestCase):
    def setUp(self):
        self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup)
        self.root=Path(self.t.name)
        self.path=self.root/'test_case.js'
        self.spec=[('case','test_case.js','node')]
    def test_clean_repeated_test(self):
        self.path.write_text('console.log("PASS")')
        self.assertEqual(verify(self.root,cases=self.spec)['status'],'PASS')
    def test_one_run_not_certified(self):
        self.path.write_text('console.log("PASS")')
        self.assertEqual(verify(self.root,attempts=1,cases=self.spec)['status'],'INCOMPLETE')
    def test_missing_test_not_certified(self):
        self.assertEqual(verify(self.root,cases=self.spec)['status'],'INCOMPLETE')
    def test_failing_second_run_fails(self):
        self.path.write_text('process.exit(1)')
        self.assertEqual(verify(self.root,cases=self.spec)['status'],'FAIL')
    def test_skipped_cannot_pass(self):
        self.path.write_text('console.log("SKIPPED: no source")')
        self.assertEqual(verify(self.root,cases=self.spec)['status'],'INCOMPLETE')
    def test_empty_selection_cannot_pass(self):
        self.assertEqual(verify(self.root,cases=[])['status'],'INCOMPLETE')
if __name__=='__main__':unittest.main()
