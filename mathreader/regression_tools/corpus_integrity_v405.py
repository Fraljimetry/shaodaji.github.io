#!/usr/bin/env python3
"""Read-only MathReader original PDF + export integrity audit.

Usage: python mathreader/regression_tools/corpus_integrity_v405.py \
  --manifest /path/to/manifest.json --out /path/to/audit.json

Manifest schema:
{"documents":[{"name":"case","pdf":"/path/original.pdf",
               "export":"/path/reading-data.json"}, ...]}

Checks source identity, navigation bounds and link integrity, not mathematical OCR
accuracy. Never starts OCR, writes to browser storage, or modifies source PDFs.
"""
import argparse,collections,hashlib,json,pathlib,sys
import fitz

def validate(manifest):
    rows=[];issues=[]
    root=pathlib.Path(manifest.get('_manifest_dir','.') )
    for spec in manifest.get('documents',[]):
        name=spec.get('name') or spec['pdf'];pdfpath=pathlib.Path(spec['pdf']);
        if not pdfpath.is_absolute():pdfpath=root/pdfpath
        record={'name':name,'pdf':str(pdfpath),'export':None}
        try:
            with fitz.open(pdfpath) as pdf:
                n=len(pdf);native=sum(len(p.get_text('text').strip())>=20 for p in pdf)
            sha=hashlib.sha256(pdfpath.read_bytes()).hexdigest()
            record.update(pages=n,sha256=sha,nativeTextPages=native)
        except Exception as e:
            issues.append({'document':name,'severity':'ERROR','code':'pdf_read','message':str(e)});rows.append(record);continue
        if spec.get('export'):
            expath=pathlib.Path(spec['export']);expath=expath if expath.is_absolute() else root/expath
            try:exp=json.loads(expath.read_text(encoding='utf-8'))
            except Exception as e:
                issues.append({'document':name,'severity':'ERROR','code':'export_read','message':str(e)});rows.append(record);continue
            expdoc=exp.get('document') or {};full=exp.get('fullDocumentText') or {};pages=full.get('pages') or [];det=exp.get('contentDetection') or {};results=det.get('results') or [];eq=(det.get('equations') or {}).get('rows') or []
            er={'name':expath.name,'pdfShaMatch':expdoc.get('id')=='sha256:'+sha,'pageCountMatch':expdoc.get('pages')==n,
                'fullTextPageRecords':len(pages),'fullTextComplete':full.get('complete'),
                'structureEntries':len(det.get('structure') or []),'resultEntries':len(results),
                'equationEntries':len(eq),'bibliographyEntries':len(det.get('bibliography') or []),
                'annotations':len((exp.get('session') or {}).get('annotations') or []),
                'marginOcrRecords':sum(bool(p.get('equationMarginOcr')) for p in pages),
                'nativeCoverage':full.get('nativeTextCoverage'),
                'fullDocumentOcr':(exp.get('exportLayers') or {}).get('fullDocumentOcr')}
            record['export']=er
            if not er['pdfShaMatch'] or not er['pageCountMatch']:
                issues.append({'document':name,'severity':'BLOCKED_PAIR','code':'identity_mismatch','message':'Export/PDF identity or page count differs; do not use pair as OCR ground truth'})
            if full.get('complete') and len(pages)!=n:
                issues.append({'document':name,'severity':'ERROR','code':'page_record_count','message':f'complete export has {len(pages)}/{n} pages'})
            for i,pg in enumerate(pages,1):
                if pg.get('page')!=i:
                    issues.append({'document':name,'severity':'ERROR','code':'page_sequence','message':f'page row {i} claims {pg.get("page")}'})
            labels=collections.Counter(e.get('label') for e in results)
            for category,entries in [('structure',det.get('structure') or []),('results',results),('equations',eq),('bibliography',det.get('bibliography') or [])]:
                for i,e in enumerate(entries):
                    if not _point_ok(e,n):
                        issues.append({'document':name,'severity':'ERROR','code':'invalid_index_position','message':f'{category}[{i}] out of bounds'})
                    if category=='bibliography':
                        for j,c in enumerate(e.get('citations') or []):
                            if not _point_ok(c,n):issues.append({'document':name,'severity':'ERROR','code':'invalid_citation_position','message':f'bibliography[{i}].citations[{j}] out of bounds'})
                    if category=='results':
                        for k in ('proofUses','usedByProofs'):
                            for j,c in enumerate(e.get(k) or []):
                                if c.get('label') not in labels:issues.append({'document':name,'severity':'ERROR','code':'dangling_proof_link','message':f'{category}[{i}].{k}[{j}]: {c.get("label")}'})
                                if not _point_ok(c,n):issues.append({'document':name,'severity':'ERROR','code':'invalid_proof_link_position','message':f'{category}[{i}].{k}[{j}] out of bounds'})
        rows.append(record)
    return {'schema':'mathreader.original-corpus-integrity@1',
            'scope':'original PDF bytes plus saved export consistency; no new OCR / no mathematical correctness certification',
            'summary':{'documents':len(rows),'pdfPages':sum(r.get('pages',0) for r in rows),
                       'exportPairs':sum(r.get('export') is not None for r in rows),
                       'fatalIssues':sum(x['severity']=='ERROR' for x in issues),
                       'blockedIdentityPairs':sum(x['severity']=='BLOCKED_PAIR' for x in issues)},
            'documents':rows,'issues':issues}

def _point_ok(v,n):
    p=v.get('page');r=v.get('ratio')
    return type(p) is int and 1<=p<=n and isinstance(r,(int,float)) and not isinstance(r,bool) and 0<=r<=1

def main():
    a=argparse.ArgumentParser();a.add_argument('--manifest',type=pathlib.Path,required=True);a.add_argument('--out',type=pathlib.Path,required=True);args=a.parse_args()
    manifest=json.loads(args.manifest.read_text(encoding='utf-8'))
    manifest['_manifest_dir']=str(args.manifest.parent)
    result=validate(manifest);args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf-8')
    print(json.dumps(result['summary'],ensure_ascii=False));return 1 if result['summary']['fatalIssues'] else 0
if __name__=='__main__':sys.exit(main())
