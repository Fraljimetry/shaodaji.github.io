#!/usr/bin/env python3
"""Regression for v359 browser acceptance gaps, not real PDF.js/Texify results."""
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'regression_tools'))
import p0_browser
import p1_browser_e2e


class BrowserGapRegression(unittest.TestCase):
    def setUp(self):
        self.complete={
            'capture_source':'mathreader_actual_browser_pdfjs',
            'errors':[],
            'stages':{k:'COMPLETE' for k in ('structure','results','equations','bibliography','formulas')},
            'navigation':{'status':'PASS'}, 'persistence':{'status':'PASS'},
            'formula_cases':[{'id':'F1','origin':'actual_texify_browser','compiled':True}]
        }

    def test_complete_browser_execution_only(self):
        self.assertEqual(p0_browser.classify_document_capture(self.complete,True),'COMPLETE')

    def test_actual_texify_compilation_failure_cannot_be_complete(self):
        self.complete['formula_cases'][0]['compiled']=False
        self.assertEqual(p0_browser.classify_document_capture(self.complete,True),'FAIL')

    def test_actual_pdf_browser_error_is_failure(self):
        self.complete['errors']=['PDF render exception']
        self.assertEqual(p0_browser.classify_document_capture(self.complete),'FAIL')

    def test_navigation_or_persistence_failure_is_not_complete(self):
        for name in ('navigation','persistence'):
            self.complete[name]['status']='FAIL'
            self.assertEqual(p0_browser.classify_document_capture(self.complete),'FAIL')
            self.complete[name]['status']='PASS'

    def test_no_navigation_or_reopen_is_unverified(self):
        for name in ('navigation','persistence'):
            self.complete[name]['status']='UNVERIFIED'
            self.assertEqual(p0_browser.classify_document_capture(self.complete),'UNVERIFIED')
            self.complete[name]['status']='PASS'

    def test_selected_formula_missing_is_unverified(self):
        self.complete['stages']['formulas']='UNVERIFIED'
        self.complete['formula_cases'][0]['origin']='original_pdf_browser_crop'
        self.assertEqual(p0_browser.classify_document_capture(self.complete,True),'UNVERIFIED')
        self.assertEqual(p0_browser.classify_document_capture(self.complete,False),'COMPLETE')

    def test_image_only_pdf_without_real_document_ocr_is_unverified(self):
        self.complete['stages']['structure']='INCOMPLETE'
        self.complete['limitations']=['Image-only PDF: document OCR was not executed']
        self.assertEqual(p0_browser.classify_document_capture(self.complete,False),'UNVERIFIED')

    def test_pdfjs_capture_missing_remains_unverified(self):
        self.complete['capture_source']='blocked_pdf_runtime'
        self.assertEqual(p0_browser.classify_document_capture(self.complete,True),'UNVERIFIED')

    def test_pdfjs_can_index_without_texify(self):
        with tempfile.TemporaryDirectory() as temp:
            build=Path(temp)
            (build/'pdf.min.mjs').write_text('test fixture')
            (build/'pdf.worker.min.mjs').write_text('test fixture')
            pdf_blockers,formula_limits=p0_browser.dependency_preflight(
                [('test.pdf','hash')],build,[{'id':'F1'}],False)
            self.assertEqual(pdf_blockers,[])
            self.assertTrue(any('Texify' in x for x in formula_limits))
            missing,_=p0_browser.dependency_preflight([('test.pdf','hash')],None,[{'id':'F1'}],False)
            self.assertTrue(missing)

    def test_p1_first_assertion_is_fail_not_blocked(self):
        self.assertEqual(p1_browser_e2e.classify_browser_failure(AssertionError('engine mismatch'),False),'FAIL')

    def test_p1_runtime_exception_is_fail(self):
        self.assertEqual(p1_browser_e2e.classify_browser_failure(Exception('browser crashed'),True),'FAIL')

    def test_p1_unstarted_browser_dependency_is_blocked(self):
        self.assertEqual(p1_browser_e2e.classify_browser_failure(Exception('no chromium'),False),'BLOCKED')

    def test_p1_unusable_bibliography_is_unverified(self):
        self.assertEqual(p1_browser_e2e.classify_browser_failure(p1_browser_e2e.UnsuitableSourcePDF('no references'),True),'UNVERIFIED')

    def test_p1_real_runtime_error_is_failure_not_unverified(self):
        self.assertEqual(p1_browser_e2e.classify_browser_failure(RuntimeError('renderer failed'),True),'FAIL')

    def test_p1_invalid_original_is_fail(self):
        self.assertEqual(p1_browser_e2e.classify_browser_failure(ValueError('bad PDF'),False),'FAIL')

if __name__=='__main__':unittest.main()
