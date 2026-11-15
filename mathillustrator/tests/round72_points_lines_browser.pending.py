"""Round 72 deliberately RED Chromium check; no runtime fixes in this release.
Run explicitly: PYTHONPATH=tests python tests/round72_points_lines_browser.pending.py
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
    with sync_playwright() as p:
        exe=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser=p.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
        try:
            page=browser.new_page(viewport={'width':1440,'height':900})
            page.set_default_timeout(20000)
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            for line in ('A=(0,0)','B=(1000,0)'):
                page.locator('#command').fill(line)
                page.locator('#command-form button').click()
            objects=json.loads(page.evaluate('window.__round36Snapshot()'))['objects']
            assert len(objects)==2,objects
            page.locator('#fit').click()
            warning=page.locator('#toast').inner_text()
            print(f'R72-12 Chromium Fit warning: {warning}',flush=True)
            drawing=page.locator('#drawing')
            width=drawing.evaluate('e=>e.clientWidth')
            B=page.locator(f'#drawing circle[data-id="{objects[1]["id"]}"]')
            print(f'R72-01 Chromium observed after Fit: viewport width={width}, B marker count={B.count()}, still in document={len(objects)==2}',flush=True)
            assert B.count()==1,'R72-01 RED: Fit leaves B outside the viewport so rendering culls its marker'
            x=float(B.get_attribute('cx'))
            assert not errors,errors
            assert 0<=x<=width,'R72-01 RED: Fit leaves B off the displayed viewport'
        finally:
            browser.close()

if __name__=='__main__':run()
