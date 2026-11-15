"""Round 171: paired background/transparency layout and retired export guides."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    try:
        for width in (1440,768,390,320):
            page=browser.new_page(viewport={'width':width,'height':900})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(inline_html(expose_state=True),wait_until='load',timeout=60000)
            if width<700:
                page.add_style_tag(content='''@media(max-width:700px){.rightpanel{position:fixed!important;top:60px;right:0;width:305px;height:760px;display:flex!important;z-index:99}.rightpanel>:not(.panelhead){display:block!important}.rightpanel .settings-2d-only,.rightpanel .settings-3d{display:block!important}}''')
            assert page.locator('#export-guides').count()==0
            for mode in (False,True):
                page.locator('#scene3d-enable').evaluate('(n,v)=>{n.checked=v;n.dispatchEvent(new Event("change",{bubbles:true}));}',mode)
                picker='#scene3d-background' if mode else '#background'
                checker='#scene3d-export-transparent' if mode else '#export-transparent'
                result=page.evaluate('''([picker,checker])=>{
                    const p=document.querySelector(picker),c=document.querySelector(checker),row=p.closest('.background-transparent-row');
                    const pr=p.getBoundingClientRect(),cr=c.closest('label').getBoundingClientRect(),rr=row.getBoundingClientRect();
                    return {pickerX:pr.x,pickerRight:pr.right,checkX:cr.x,rowX:rr.x,rowRight:rr.right,rowW:rr.width,
                      checkerLabel:c.closest('label').innerText,pickerWidth:pr.width,
                      style:getComputedStyle(row).gridTemplateColumns};
                }''',[picker,checker])
                assert result['pickerWidth']>=35 and result['pickerWidth']<=42,result
                assert result['pickerX']<result['checkX'],result
                assert result['pickerRight']<result['checkX'],result
                assert result['checkX']<result['rowRight'],result
                if not mode:
                    stroke=page.locator('#default-stroke').bounding_box()
                    if stroke and stroke['width']>0:
                        assert abs(result['pickerRight']-(stroke['x']+stroke['width']))<6,(result,stroke)
                page.locator(checker).evaluate('(n)=>{n.checked=true;n.dispatchEvent(new Event("change",{bubbles:true}));}')
                assert page.locator(checker).is_checked()
                page.locator('#ui-language').evaluate('(n)=>{n.value="zh";n.dispatchEvent(new Event("change",{bubbles:true}));}')
                assert page.locator(checker).is_checked()
                page.locator('#ui-language').evaluate('(n)=>{n.value="en";n.dispatchEvent(new Event("change",{bubbles:true}));}')
                page.locator(checker).evaluate('(n)=>{n.checked=false;n.dispatchEvent(new Event("change",{bubbles:true}));}')
            assert not errors, errors
            print('ROUND171_LAYOUT_PASS',width,flush=True)
            page.close()
    finally: browser.close()
