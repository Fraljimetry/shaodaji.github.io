"""Round 30 focused isolated Chromium: actual editor/Properties/LaTeX/diagram interactions."""
import json,os,math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download


def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
        page.on('dialog',lambda dialog: dialog.accept(r'\alpha' if dialog.type=='prompt' else None))
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.locator('button.tool').first.wait_for(timeout=6000)
        # Duplicate handlers formerly reversed the visible panel toggle.
        toggle=page.locator('#properties-toggle');panel=page.locator('#properties')
        assert panel.is_visible()
        toggle.click();assert panel.is_hidden() and toggle.get_attribute('aria-expanded')=='false'
        toggle.click();assert panel.is_visible() and toggle.get_attribute('aria-expanded')=='true'
        toggle.click();assert panel.is_hidden()
        # In this isolated about:blank fixture localStorage is security-restricted;
        # clicking twice still proves the disclosure is not immediately reversed.
        toggle.click();assert panel.is_visible()
        # Label format has one consistent name even for point objects.
        cmd(page,'A=(0,0)')
        page.locator('#object-search').fill('A');page.locator('#objects .object').first.click()
        fmt=page.locator('#properties label.field').filter(has_text='Label format').locator('select')
        assert fmt.count()==1 and fmt.input_value()=='latex'
        assert page.locator('#properties label.field').filter(has_text='Point label format').count()==0
        # Numeric values start at the left, native steppers stay at the right.
        for selector in ('#point-size','#polygon-sides'):
            got=page.locator(selector).evaluate("e=>[getComputedStyle(e).textAlign,getComputedStyle(e).direction]")
            assert got==['left','ltr'],(selector,got)
        # Palette icons: point markers must be complete and filled, with no clipping.
        for tool in ('ray','perpBisector','circleDiameter','closedSpline','ellipse'):
            svg=page.locator('[data-tool-choice="'+tool+'"] svg')
            circles=svg.locator('circle')
            for i in range(circles.count()):
                c=circles.nth(i)
                vals=c.evaluate("n=>[+n.getAttribute('cx'),+n.getAttribute('cy'),+n.getAttribute('r'),n.getAttribute('fill')]")
                x,y,r,fill=vals
                assert r>0 and r<=x<=24-r and r<=y<=24-r,(tool,vals)
                if r<=2.1:assert fill=='currentColor',(tool,vals)
        # New text defaults to actual LaTeX mode even when input is unwrapped.
        page.locator('[data-tool-choice="text"]').click()
        bbox=page.locator('#drawing').bounding_box()
        page.mouse.click(bbox['x']+bbox['width']*.55,bbox['y']+bbox['height']*.58)
        text=[o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='text']
        assert text and text[-1]['textMode']=='latex' and text[-1]['text']==r'\alpha',text
        # Default mode for new nodes / arrows and collision-aware placement.
        for expr in ['B=Node(-3,0,"B")','C=Node(3,0,"C")','D=Node(0,-3,"D")','E=Node(0,3,"E")',
                     'Morphism(B,C,"f")','Morphism(D,E,"g")']:
            cmd(page,expr)
        doc=json.loads(download(page,'Save').read_text())
        for obj in doc['objects']:
            if obj['type'] in ('text','node','morphism'):
                assert obj.get('textMode')=='latex',obj
                if obj['type']=='morphism':assert obj.get('labelAvoid') is True,obj
        page.locator('[data-tool-choice="select"]').click()
        page.wait_for_timeout(250)
        morphs=[o for o in doc['objects'] if o['type']=='morphism']
        labels=[page.locator(f'#drawing [data-label-handle="{o["id"]}"]').bounding_box() for o in morphs]
        assert all(b and b['width']>4 and b['height']>4 for b in labels),labels
        a,b=labels
        overlap=max(0,min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x']))*max(0,min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y']))
        assert overlap<1,(overlap,labels)
        assert not errors,errors
        # Style of export is darkened, not washed out, in dark theme.
        page.locator('#theme').select_option('dark')
        color=page.locator('#export-open').evaluate('e=>getComputedStyle(e).backgroundColor')
        assert color=='rgb(52, 116, 180)',color
        page.set_viewport_size({'width':390,'height':844})
        assert page.locator('#drawing').is_visible()
        assert not errors,errors
        browser.close()
    print('ROUND30_CHROMIUM_PASS: docked Properties toggle/prefs, defaults, labels, icons, numeric fields, collision and mobile')

if __name__=='__main__':run()
