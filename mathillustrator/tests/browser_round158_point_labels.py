"""Round 158: point-only Size and reversibly localized shortened labels."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for width in (1440,768,390,320):
            page=browser.new_page(viewport={'width':width,'height':900})
            page.set_default_timeout(12000)
            exceptions=[]
            page.on('pageerror',lambda error:exceptions.append(str(error)))
            page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
            if width<700:page.locator('#left-collapse').click()
            cmd(page,'P=(1,2)')
            page.locator('#objects .object').first.click()
            point=page.evaluate('''() => {
                const p=document.querySelector('#properties');
                const size=p.querySelector('.style-pointsize input'),op=p.querySelector('.style-opacity input');
                return {widthCount:p.querySelectorAll('.style-width').length,sizeCount:!!size,
                  sizeLabel:size?.closest('label')?.textContent?.trim(),
                  sizeX:size?.getBoundingClientRect().x,opacityX:op?.getBoundingClientRect().x};
            }''')
            assert point['widthCount']==0 and point['sizeCount'] and point['sizeLabel']=='Size',(width,point)
            assert abs(point['sizeX']-point['opacityX'])<3,(width,point)
            page.locator('#ui-language').select_option('zh')
            assert page.locator('#properties .short-label-field').first.inner_text().strip().startswith('标签'),width
            page.locator('#ui-language').select_option('en')
            assert page.locator('#properties .short-label-field').first.inner_text().strip().startswith('Label'),width
            # The right Settings panel keeps descriptive budget/grid labels but shortens smoothing and resolution.
            # Hidden mobile Settings drawer remains in the DOM; check its source labels.
            assert page.locator('#correction').locator('xpath=..').inner_text().strip().startswith('Smoothing'),width
            assert page.locator('#plot-budget').locator('xpath=..').inner_text().strip().startswith('Evaluation budget'),width
            assert page.locator('#implicit-grid').locator('xpath=..').inner_text().strip().startswith('Implicit grid (px)'),width
            # Existing line/curve Width remains independently editable.
            cmd(page,'A=(0,0)')
            cmd(page,'B=(2,0)')
            # Rather than depending on tool naming differences, directly inspect line creation through Segment command.
            cmd(page,'Segment(A,B)')
            page.locator('#objects .object').first.click()
            assert page.locator('#properties .style-width input').count()==1,width
            assert not exceptions,(width,exceptions)
            print('ROUND158_CHROMIUM_PASS',width,point,flush=True)
            page.close()
    finally:browser.close()
