#!/usr/bin/env python3
"""Real P1 gate must fail closed when exact pinned PDF.js is absent."""
import sys
import tempfile
from pathlib import Path
import unittest
import json
import fitz

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'regression_tools'))
import p1_browser_e2e

class P1RealGate(unittest.TestCase):
    def test_missing_pinned_browser_assets_cannot_pass(self):
        with tempfile.TemporaryDirectory() as base:
            root=Path(base)
            paths=[]
            for i in range(2):
                path=root/f'{i}.pdf'
                doc=fitz.open();doc.new_page().insert_text((40,40),f'PDF {i}');doc.save(path);doc.close()
                paths.append(path)
            audit=p1_browser_e2e.run(ROOT,paths[0],paths[1],None,root/'output')
            self.assertEqual(audit['status'],'BLOCKED')
            self.assertEqual(len(audit['assertions']),0)
            self.assertTrue(any('pdfjs-dist' in s for s in audit['errors']))
            stored=json.loads((root/'output/p1_browser_e2e.json').read_text())
            self.assertEqual(stored['status'],'BLOCKED')

    def test_exact_duplicate_pdf_never_counts_as_two_papers(self):
        with tempfile.TemporaryDirectory() as base:
            root=Path(base);path=root/'one.pdf'
            doc=fitz.open();doc.new_page();doc.save(path);doc.close()
            audit=p1_browser_e2e.run(ROOT,path,path,None,root/'output')
            self.assertNotEqual(audit['status'],'PASS')
            self.assertTrue(any('distinct' in msg for msg in audit['errors']))

if __name__=='__main__':unittest.main(verbosity=2)
