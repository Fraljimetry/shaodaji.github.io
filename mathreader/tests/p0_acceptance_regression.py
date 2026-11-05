#!/usr/bin/env python3
"""Synthetic *comparator* unit tests; not original-PDF accuracy evidence."""
from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'regression_tools'))
import p0_ground_truth as p0


class P0ComparisonTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        import fitz
        doc=fitz.open()
        for i in range(2):
            page=doc.new_page()
            page.insert_text((50,60), f'Theorem 1.{i+1}: a=b')
        self.pdf=self.root/'synthetic_comparator_control.pdf'
        doc.save(self.pdf);doc.close()
        self.sha=p0.sha256(self.pdf)
        self.crop_dir=self.root/'browser_formula_crops'
        self.crop_dir.mkdir()
        self.crop_path=self.crop_dir/'original-formula.png'
        from PIL import Image
        Image.new('RGB',(4,4),'white').save(self.crop_path,format='PNG')
        self.crop_sha=p0.sha256(self.crop_path)
        self.entry={
            'id':'synthetic','path':str(self.pdf),'sha256':self.sha,'pages':2,
            'ground_truth':{
                'reviewer':'synthetic test (NOT human-reviewed real PDF)',
                'reviewed_at':'2026-11-04','reviewed_pages':[1,2],
                'complete_categories':list(p0.ALL_COVERAGE),
                'formula_reviewed_pages':[1,2],
                'original_page_evidence':'synthetic_test_data_not_real_ground_truth',
                'indexes':{
                    'structure':[{'title':'Introduction','page':1,'ratio':.1}],
                    'results':[{'label':'Theorem 1.1','title':'a=b','page':1,'ratio':.1}],
                    'equations':[{'label':'(1.1)','page':1,'ratio':.35}],
                    'bibliography':[{'label':'[1]','title':'An example','page':2,'ratio':.83}],
                },
                'formulas':[{'id':'formula-1','page':1,'latex':'a=b','crop_sha256':self.crop_sha}]
            }
        }
        self.capture={
            'schema':1,'capture_source':'mathreader_actual_browser_pdfjs','pdf_sha256':self.sha,
            'engine':{'pdfjs':'4.10.38'},'pages':2,'stages':{x:'COMPLETE' for x in p0.ALL_COVERAGE},
            'errors':[], 'navigation':{'status':'PASS'},'persistence':{'status':'PASS'},
            'indexes':copy.deepcopy(self.entry['ground_truth']['indexes']),
            'formula_cases':[{'id':'formula-1','page':1,'latex':'a=b','compiled':True,
                               'origin':'actual_texify_browser','crop_sha256':self.crop_sha,
                               'crop_evidence_filename':'original-formula.png','backend':'synthetic-model-label'}]
        }
        self.store()

    def store(self):
        (self.root/f'{self.sha}.json').write_text(json.dumps(self.capture),encoding='utf8')

    def check(self,entry=None):
        return p0.evaluate_document(entry or self.entry,self.root)

    def test_complete_synthetic_comparator_accepts_exact(self):
        self.assertEqual(self.check()['classification'],'PASS')

    def test_absent_ground_truth_never_passes(self):
        item=copy.deepcopy(self.entry);item.pop('ground_truth')
        value=self.check(item)
        self.assertEqual(value['classification'],'UNVERIFIED')

    def test_missing_ground_truth_location_ratios_never_pass(self):
        item=copy.deepcopy(self.entry)
        for rows in item['ground_truth']['indexes'].values():
            for row in rows: row.pop('ratio',None)
        for rows in self.capture['indexes'].values():
            for row in rows: row.pop('ratio',None)
        self.store()
        self.assertEqual(self.check(item)['classification'],'UNVERIFIED')

    def test_invalid_ground_truth_location_ratio_never_pass(self):
        item=copy.deepcopy(self.entry)
        item['ground_truth']['indexes']['results'][0]['ratio']=float('nan')
        self.assertEqual(self.check(item)['classification'],'UNVERIFIED')

    def test_capture_root_nonobject_is_unverified_not_crash(self):
        (self.root/f'{self.sha}.json').write_text('[]')
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_malformed_evidence_stress_never_raises(self):
        original_entry=copy.deepcopy(self.entry)
        original_capture=copy.deepcopy(self.capture)
        values=[None,False,True,0,19,'bad',[],[1],{},float('nan')]
        fields=[('capture','engine'),('capture','stages'),('capture','indexes'),
                ('capture','errors'),('capture','navigation'),('capture','persistence'),
                ('capture','formula_cases'),('entry','complete_categories'),
                ('entry','known_open_defects'),('entry','reviewed_pages')]
        for which,key in fields:
            for value in values:
                self.entry=copy.deepcopy(original_entry)
                self.capture=copy.deepcopy(original_capture)
                if which=='entry':self.entry['ground_truth'][key]=value
                else:self.capture[key]=value
                self.store()
                with self.subTest(section=which,key=key,value=repr(value)):
                    self.assertIn(self.check()['classification'],('PASS','FAIL','UNVERIFIED','EXCEPTION'))

    def test_null_engine_is_unverified_not_crash(self):
        self.capture['engine']=None;self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_null_stages_are_unverified_not_crash(self):
        self.capture['stages']=None;self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_null_indexes_are_unverified_not_crash(self):
        self.capture['indexes']=None;self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_null_navigation_is_unverified_not_crash(self):
        self.capture['navigation']=None;self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_malformed_formula_identifier_does_not_crash(self):
        self.capture['formula_cases'].append({'id':[],'page':1});self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_nonfinite_performance_measurement_never_passes(self):
        self.entry['performance_thresholds']={'max_open_ms':100}
        for measurement in [float('nan'), float('inf'), -1, True, '10']:
            with self.subTest(measurement=repr(measurement)):
                self.capture['metrics']={'open_ms':measurement}
                self.store()
                self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_invalid_performance_threshold_never_passes(self):
        self.capture['metrics']={'open_ms':10}
        self.store()
        for threshold in [float('nan'), float('inf'), -10, True, '10']:
            with self.subTest(threshold=repr(threshold)):
                self.entry['performance_thresholds']={'max_open_ms':threshold}
                self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_null_performance_metrics_with_threshold_is_unverified(self):
        self.entry['performance_thresholds']={'max_open_ms':100}
        self.capture['metrics']=None;self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_null_complete_categories_is_unverified_not_crash(self):
        self.entry['ground_truth']['complete_categories']=None
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_scalar_known_open_defects_is_unverified_not_crash(self):
        self.entry['ground_truth']['known_open_defects']=7
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_malformed_error_list_is_unverified(self):
        self.capture['errors']=None;self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_missing_reviewed_page_never_passes(self):
        item=copy.deepcopy(self.entry);item['ground_truth']['reviewed_pages']=[1]
        self.assertEqual(self.check(item)['classification'],'UNVERIFIED')

    def test_incomplete_formula_review_never_passes(self):
        item=copy.deepcopy(self.entry);item['ground_truth']['formula_reviewed_pages']=[1]
        self.assertEqual(self.check(item)['classification'],'UNVERIFIED')

    def test_page_count_disagrees_with_pdf(self):
        item=copy.deepcopy(self.entry);item['pages']=3
        self.assertEqual(self.check(item)['classification'],'UNVERIFIED')

    def test_wrong_source_sha_never_passes(self):
        item=copy.deepcopy(self.entry);item['sha256']='0'*64
        self.assertEqual(self.check(item)['classification'],'UNVERIFIED')

    def test_missing_browser_capture_never_passes(self):
        (self.root/f'{self.sha}.json').unlink()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_proxy_capture_never_passes(self):
        self.capture['capture_source']='source_level_tesseract_proxy';self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_wrong_engine_never_passes(self):
        self.capture['engine']['pdfjs']='test_stub';self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_failed_index_stage_never_passes(self):
        self.capture['stages']['equations']='INCOMPLETE';self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_actual_browser_error_is_a_failure(self):
        self.capture['errors']=['real PDF.js failure'];self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_missing_result_is_failure(self):
        self.capture['indexes']['results']=[];self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_extra_result_is_failure(self):
        self.capture['indexes']['results'].append({'label':'Remark I','title':'','page':2,'ratio':.5});self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_duplicate_equation_is_failure(self):
        self.capture['indexes']['equations']*=2;self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_mislocated_result_is_failure(self):
        self.capture['indexes']['results'][0]['ratio']=.8;self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_latex_compile_error_is_failure(self):
        self.capture['formula_cases'][0]['compiled']=False;self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_correctly_compiled_but_wrong_math_is_failure(self):
        self.capture['formula_cases'][0]['latex']='a=-b';self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_fully_reviewed_formula_free_document_does_not_require_texify(self):
        self.entry['ground_truth']['formulas']=[]
        self.capture['formula_cases']=[]
        self.capture['stages']['formulas']='UNVERIFIED'
        self.store()
        self.assertEqual(self.check()['classification'],'PASS')

    def test_formula_free_document_with_missing_formula_page_review_is_unverified(self):
        self.entry['ground_truth']['formulas']=[]
        self.entry['ground_truth']['formula_reviewed_pages']=[1]
        self.capture['formula_cases']=[]
        self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')


    def test_malformed_nan_ratio_cannot_pass(self):
        self.capture['indexes']['results'][0]['ratio']=float('nan')
        self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_out_of_range_index_page_cannot_pass_even_if_truth_matches(self):
        self.entry['ground_truth']['indexes']['equations'][0]['page']=40
        self.capture['indexes']['equations'][0]['page']=40
        self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_fractional_page_number_cannot_be_truncated_to_valid(self):
        self.capture['indexes']['equations'][0]['page']=1.5
        self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_index_order_mismatch_is_failure(self):
        original=self.entry['ground_truth']['indexes']['structure'][0]
        other={'title':'Second section','page':2,'ratio':.9}
        self.entry['ground_truth']['indexes']['structure']=[original,other]
        self.capture['indexes']['structure']=[other,original]
        self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_missing_formula_backend_is_unverified(self):
        self.capture['formula_cases'][0].pop('backend')
        self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_missing_formula_source_png_is_unverified(self):
        self.crop_path.unlink()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_tampered_formula_source_png_is_unverified(self):
        self.crop_path.write_bytes(b'wrong crop')
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_formula_crop_path_escape_is_unverified(self):
        self.capture['formula_cases'][0]['crop_evidence_filename']='../source.png'
        self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_missing_actual_formula_ocr_is_unverified(self):
        self.capture['formula_cases']=[];self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_crop_identity_mismatch_is_unverified(self):
        self.capture['formula_cases'][0]['crop_sha256']='b'*64;self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_navigation_missing_is_unverified(self):
        self.capture['navigation']['status']='UNVERIFIED';self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_persistence_missing_is_unverified(self):
        self.capture['persistence']['status']='UNVERIFIED';self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_explicit_performance_budget_detects_regression(self):
        self.entry['performance_thresholds']={'max_index_ms':100}
        self.capture['metrics']={'index_ms':250}
        self.store()
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_missing_requested_performance_measurement_unverified(self):
        self.entry['performance_thresholds']={'max_open_ms':500}
        self.capture['metrics']={}
        self.store()
        self.assertEqual(self.check()['classification'],'UNVERIFIED')

    def test_whole_source_illegibility_requires_human_evidence(self):
        item=copy.deepcopy(self.entry)
        item['ground_truth']={'exception':{'human_illegible_pages':[1,2],
            'reviewer':'synthetic test','reviewed_at':'2026-11-05','reason':'source unreadable',
            'original_page_evidence':'synthetic fixture; never actual real-source assessment'}}
        self.assertEqual(self.check(item)['classification'],'EXCEPTION')

    def test_partial_illegibility_is_not_whole_document_exception(self):
        item=copy.deepcopy(self.entry)
        item['ground_truth']={'exception':{'human_illegible_pages':[1],
            'reviewer':'synthetic test','reviewed_at':'2026-11-05','reason':'page unreadable',
            'original_page_evidence':'synthetic fixture'}}
        self.assertEqual(self.check(item)['classification'],'UNVERIFIED')

    def test_known_open_defect_remains_fail(self):
        self.entry['ground_truth']['known_open_defects']=['false equation at page 1']
        self.assertEqual(self.check()['classification'],'FAIL')

    def test_confirmed_browser_error_sets_aggregate_fail_not_incomplete(self):
        self.capture['errors']=['PDF.js reported a real error']
        self.store()
        manifest=self.root/'manifest-confirmed-fail.json'
        manifest.write_text(json.dumps({'schema':1,'documents':[self.entry]}),encoding='utf8')
        audit=p0.run(manifest,self.root)
        self.assertEqual(audit['documents'][0]['classification'],'FAIL')
        self.assertEqual(audit['acceptance'],'FAIL')

    def test_manifest_duplicate_bytes_rejected(self):
        data={'schema':1,'documents':[self.entry,self.entry]}
        path=self.root/'manifest.json';path.write_text(json.dumps(data),encoding='utf8')
        with self.assertRaises(ValueError):p0.run(path,self.root)

    def test_generated_report_is_unverified_with_missing_evidence(self):
        data={'schema':1,'documents':[{'path':str(self.pdf),'sha256':self.sha,'pages':2}]}
        path=self.root/'manifest.json';path.write_text(json.dumps(data),encoding='utf8')
        result=p0.run(path,self.root)
        self.assertEqual(result['counts'].get('UNVERIFIED'),1)
        self.assertEqual(result['acceptance'],'INCOMPLETE')

if __name__=='__main__':
    unittest.main(verbosity=2)
