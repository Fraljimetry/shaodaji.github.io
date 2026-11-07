#!/usr/bin/env python3
"""v401 user-export cross-generation regression. Requires source JSONs for full replay.
No embedded copyrighted PDF text; never silently count skipped replay as certified.
"""
from pathlib import Path
import os,json,hashlib
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'regression/v401_seven_export_evidence.json').read_text())
assert manifest['documentCount']==7 and manifest['pages']==595
assert manifest['nativeTextPages']==585
assert manifest['priorMarginEvidencePages']==291 and manifest['newMarginEvidencePages']==0
for spec in manifest['documents']:
    assert spec['newMarginEvidencePages']==0
    assert spec['previousDetection']['results']==spec['detection']['results']
    assert spec['previousDetection']['equations']==spec['detection']['equations']
    assert spec['previousDetection']['bibliography']==spec['detection']['bibliography']
folder=os.environ.get('MATHREADER_EXPORT_CORPUS_DIR')
if not folder:
    print('PASS manifest integrity; FULL original seven-export source replay SKIPPED (set MATHREADER_EXPORT_CORPUS_DIR)')
else:
    checked=0
    for spec in manifest['documents']:
        old=Path(folder)/spec['oldFile'];new=Path(folder)/spec['newFile']
        assert old.is_file() and new.is_file(),(old,new)
        assert hashlib.sha256(old.read_bytes()).hexdigest()==spec['oldFileSha256']
        assert hashlib.sha256(new.read_bytes()).hexdigest()==spec['newFileSha256']
        prev=json.loads(old.read_text());curr=json.loads(new.read_text());pages=curr['fullDocumentText']['pages'];pp=prev['fullDocumentText']['pages']
        assert curr['document']['id']==spec['documentId']
        assert len(pages)==len(pp)==spec['documentPages']
        assert len([p for p in pages if str((p.get('nativePdf') or {}).get('rawText') or '').strip()])==spec['nativeTextPages']
        assert curr['exportLayers']['fullDocumentOcr']=='not-stored'
        assert curr.get('documentOcr') is None
        assert sum(bool(p.get('equationMarginOcr')) for p in pages)==spec['newMarginEvidencePages']
        assert sum(bool(p.get('equationMarginOcr')) for p in pp)==spec['previousMarginEvidencePages']
        for group in ('results','bibliography'):
            before=prev['contentDetection'][group];after=curr['contentDetection'][group]
            assert [(r.get('label'),r.get('page'),r.get('ratio')) for r in before] == [(r.get('label'),r.get('page'),r.get('ratio')) for r in after], group
        old_eq=prev['contentDetection']['equations']['rows'];new_eq=curr['contentDetection']['equations']['rows']
        assert [(r['label'],r['page'],r.get('ratio')) for r in old_eq]==[(r['label'],r['page'],r.get('ratio')) for r in new_eq]
        if 'correctedBibliographyPage' in spec:
            assert spec['correctedBibliographyPage']==163
        checked+=1
    print(f'PASS | {checked} original export pairs, 595 pages, detection geometry preserved; 291 historical margin-evidence pages missing from new exports')
