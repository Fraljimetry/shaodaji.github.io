#!/usr/bin/env python3
"""Revalidate actual v399 user full-text exports, if the original JSONs exist.
The compact manifest is shipped. Point MATHREADER_EXPORT_CORPUS_DIR at the
original exported JSON files for the full 595-page integrity test.
"""
from pathlib import Path
import os, json, hashlib
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'regression/v400_export_coverage_manifest.json').read_text())
assert manifest['totalPages']==595 and manifest['pagesWithNativeText']==585 and manifest['pagesWithoutNativeText']==10
folder=os.environ.get('MATHREADER_EXPORT_CORPUS_DIR')
if not folder:
    print('PASS | v400 fixed source manifest; original seven-export replay SKIPPED (set MATHREADER_EXPORT_CORPUS_DIR)')
else:
    corpus=Path(folder)
    for spec in manifest['documents']:
        f=corpus/spec['sourceFile']
        assert f.is_file(), f
        assert hashlib.sha256(f.read_bytes()).hexdigest()==spec['sha256'],f'source hash changed: {f}'
        data=json.loads(f.read_text())
        assert data['document']['pages']==spec['documentPages']
        assert data['exportLayers']['fullDocumentText']=='complete'
        assert data['exportLayers']['fullDocumentOcr']=='not-stored'
        assert data.get('documentOcr') is None
        pages=data['fullDocumentText']['pages']
        assert len(pages)==spec['exportedPages']
        absent=[p['page'] for p in pages if not str((p.get('nativePdf') or {}).get('rawText') or '').strip()]
        assert absent==spec['noNativeTextPages'],(spec['name'],absent)
        assert len(pages)-len(absent)==spec['nativeTextPages']
        assert all(p.get('nativePdf') is not None for p in pages)
    print('PASS | v400 seven real full-text exports | 595 page records, 585 native-text pages, 10 textless pages, OCR not stored')
