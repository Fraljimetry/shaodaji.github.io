"""Round 104: real Chromium repeated import/render churn and DOM/heap bounds."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

COUNT=120
ROUNDS=int(os.environ.get('MI_BROWSER_CHURN_ROUNDS','12'))
assert 4<=ROUNDS<=50
with sync_playwright() as pw:
    exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
    try:
        page=browser.new_page(viewport={'width':1440,'height':900})
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:d.accept())
        page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
        base=json.loads(page.evaluate('window.__round36Snapshot()'))
        client=page.context.new_cdp_session(page)
        samples=[]
        for n in range(ROUNDS):
            doc=json.loads(json.dumps(base));doc['objects']=[]
            for i in range(COUNT):
                doc['objects'].append({'id':f'o{i+1}','name':f'P{i+1}','type':'point','xy':[(i%20-10)*.33+n*.0001,(i//20-3)*.33],'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}})
            doc['nextId']=COUNT+1
            page.locator('#open-file').set_input_files({'name':f'r104_{n}.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
            page.wait_for_function('(c)=>JSON.parse(window.__round36Snapshot()).objects.length===c',arg=COUNT)
            page.wait_for_function('(c)=>document.querySelectorAll("#drawing circle[data-id]").length===c',arg=COUNT)
            assert len(page.locator('#drawing circle[data-id]').all())==COUNT
            client.send('HeapProfiler.collectGarbage')
            metrics=client.send('Performance.getMetrics') if False else page.evaluate('({heap:performance.memory?.usedJSHeapSize??null,nodes:document.querySelectorAll("*").length})')
            samples.append(metrics)
        assert not errors,errors
        nodes=[s['nodes'] for s in samples]
        assert max(nodes)-min(nodes)<300, f'DOM node growth: {nodes}'
        heaps=[s['heap'] for s in samples if s['heap'] is not None]
        heapGrowth=heaps[-1]-heaps[0] if heaps else None
        if heapGrowth is not None:
            assert heapGrowth<=64*1024*1024, f'Chromium JS heap growth >64 MiB: {heapGrowth}'
        print(json.dumps({'round':104,'browser':'Chromium','importCycles':ROUNDS,'objectsPerCycle':COUNT,'domNodeRange':[min(nodes),max(nodes)],'heapGrowthMiB':None if heapGrowth is None else round(heapGrowth/1048576,2),'pageErrors':errors,'passed':True},indent=2))
    finally:
        browser.close()
