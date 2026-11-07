#!/usr/bin/env python3
"""Regression for the read-only original-PDF/export integrity audit (synthetic data)."""
import importlib.util,json,pathlib,tempfile,sys
import fitz
source=pathlib.Path(__file__).resolve().parent.parent/'regression_tools/corpus_integrity_v405.py'
spec=importlib.util.spec_from_file_location('corpus_integrity_v405',source);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as d:
 p=pathlib.Path(d)/'original.pdf';doc=fitz.open();page=doc.new_page();page.insert_text((30,80),'Theorem 1.1');doc.save(p);doc.close()
 import hashlib
 sha=hashlib.sha256(p.read_bytes()).hexdigest()
 exp={'document':{'id':'sha256:'+sha,'pages':1},'fullDocumentText':{'complete':True,'pages':[{'page':1}]},
      'session':{'annotations':[]},'contentDetection':{'structure':[{'page':1,'ratio':0.2}],
      'results':[{'label':'Theorem 1.1','page':1,'ratio':0.4,'proofUses':[],'usedByProofs':[]}],
      'equations':{'rows':[{'label':'(1.1)','page':1,'ratio':0.5}]},
      'bibliography':[{'page':1,'ratio':0.9,'citations':[{'page':1,'ratio':0.3}]}]}}
 e=pathlib.Path(d)/'exp.json';e.write_text(json.dumps(exp))
 def run():return m.validate({'documents':[{'name':'sample','pdf':str(p),'export':str(e)}]})
 r=run();assert r['summary']['fatalIssues']==0 and r['summary']['blockedIdentityPairs']==0
 exp['document']['id']='sha256:'+'0'*64;e.write_text(json.dumps(exp));r=run();assert r['summary']['fatalIssues']==0 and r['summary']['blockedIdentityPairs']==1
 exp['document']['id']='sha256:'+sha;exp['contentDetection']['equations']['rows'][0]['ratio']=1.2;e.write_text(json.dumps(exp));r=run();assert r['summary']['fatalIssues']==1
 exp['contentDetection']['equations']['rows'][0]['ratio']=0.5;exp['contentDetection']['results'][0]['proofUses']=[{'label':'Theorem 9.9','page':1,'ratio':0.2}];e.write_text(json.dumps(exp));r=run();assert any(x['code']=='dangling_proof_link' for x in r['issues'])
 print('PASS | corpus integrity: valid source, mismatched SHA fail-closed, navigation bounds, dangling proof links')
