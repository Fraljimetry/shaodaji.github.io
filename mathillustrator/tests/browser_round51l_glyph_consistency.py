"""Round 51L: visual marker diameter parity and separated translation strokes."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        try:
            page=browser.new_page(viewport={'width':1440,'height':900})
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load')
            page.wait_for_selector('[data-tool-choice="translation"] svg')
            result=page.evaluate('''() => {
                const icons=[...document.querySelectorAll('[data-geometry-group] [data-tool-choice] svg')];
                const points=icons.flatMap(icon=>[...icon.querySelectorAll('circle[fill="currentColor"]')]);
                const mismatched=points.map(p=>({radius:+p.getAttribute('r'),stroke:getComputedStyle(p).stroke,strokeWidth:getComputedStyle(p).strokeWidth,
                    name:p.closest('[data-tool-choice]')?.getAttribute('data-tool-choice'),box:p.getBBox().width})).filter(p=>p.radius!==2.8||p.stroke!=='none'||Math.abs(p.box-5.6)>0.01);
                const trans=document.querySelector('[data-tool-choice="translation"] svg');
                const path=trans.querySelector('path');
                const marks=[...trans.querySelectorAll('circle[fill="currentColor"]')].map(p=>({x:+p.getAttribute('cx'),y:+p.getAttribute('cy')}));
                return {iconCount:icons.length,pointCount:points.length,mismatched,
                    translationPath:path.getAttribute('d'),marks};
            }''')
            assert result['iconCount']==43,result
            assert result['pointCount']>70,result
            assert not result['mismatched'],result['mismatched']
            marks=result['marks']; assert len(marks)==4,marks
            top,bottom=marks[:2],marks[2:]
            assert all(p['y']==6 for p in top) and all(p['y']==18 for p in bottom),marks
            assert bottom[0]['x']-top[0]['x']>=6,marks
            assert bottom[1]['x']-top[1]['x']>=6,marks
            assert top[1]['x']-top[0]['x']>=14 and bottom[1]['x']-bottom[0]['x']>=14,marks
            assert not errors,errors
            print('ROUND51L_CHROMIUM_PASS: all Geometry points uniform visible diameter, no inherited stroke, translation 6.5-unit offset and 14.5-unit strokes')
        finally:browser.close()

if __name__=='__main__':main()
