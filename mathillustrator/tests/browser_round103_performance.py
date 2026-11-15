"""Measured Chromium 2D document import/render benchmark; local isolated app, not hosted site."""
import json, os, statistics, time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

COUNTS=(40,120,240)
BUDGET_MS=float(os.environ.get('MI_BROWSER_IMPORT_P95_MS','10000'))
SEED=1032026

def main():
    with sync_playwright() as pw:
        exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
        try:
            page=browser.new_page(viewport={'width':1440,'height':900})
            errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
            page.on('dialog',lambda d:d.accept())
            page.set_default_timeout(20000)
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            base=json.loads(page.evaluate('window.__round36Snapshot()'))
            results=[]
            for count in COUNTS:
                doc=json.loads(json.dumps(base));doc['objects']=[]
                for i in range(count):
                    x=(i%20-10)*.33;y=(i//20-6)*.33
                    doc['objects'].append({'id':f'o{i+1}','name':f'P{i+1}','type':'point','xy':[x,y],'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}})
                doc['nextId']=count+1
                payload=json.dumps(doc).encode();samples=[]
                for repeat in range(3):
                    start=time.perf_counter()
                    page.locator('#open-file').set_input_files({'name':f'r103_{count}_{repeat}.json','mimeType':'application/json','buffer':payload})
                    page.wait_for_function('(n) => JSON.parse(window.__round36Snapshot()).objects.length===n', arg=count)
                    page.wait_for_function('(n) => document.querySelectorAll("#drawing circle[data-id]").length===n',arg=count)
                    samples.append((time.perf_counter()-start)*1000)
                samples.sort();results.append({'points':count,'medianMs':round(statistics.median(samples),2),'p95SampleMs':round(max(samples),2),'samplesMs':[round(v,2) for v in samples]})
            assert not errors,errors
            assert all(x['p95SampleMs']<=BUDGET_MS for x in results),f'Import exceeds {BUDGET_MS} ms: {results}'
            print(json.dumps({'round':103,'seed':SEED,'browser':'Chromium','budgetMs':BUDGET_MS,'results':results,'passed':True},indent=2))
        finally:browser.close()

if __name__=='__main__':main()
