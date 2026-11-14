"""Round 51E: verify that left Objects glyphs reuse right Tools SVGs exactly.
Plotting symbols are intentionally not affected. Offline Chromium fixture.
"""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        try:
            page = browser.new_page(viewport={'width':1500,'height':980},accept_downloads=True)
            page.set_default_timeout(12000)
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            html=inline_html(legacy_search_expanded=False,expose_state=True)
            needle='window.__round36Snapshot=()=>JSON.stringify(doc);\ninitialise();'
            assert needle in html,'test fixture state hook moved'
            html=html.replace(needle, '''window.__round51eShow=(id)=>{listedObjects=doc.objects.filter(o=>o.id===id);$("objects").scrollTop=0;renderListWindow();};
            window.__round51eAdd=(spec)=>{const added=append(doc,spec);renderList();return added.id;};
            window.__round51eIcon=(o)=>{
              const type=objectGlyphTool(o);
              return {type, svg:type?toolGlyphSvg(type):null};
            };
            '''+needle)
            page.set_content(html,wait_until='load')
            page.wait_for_selector('[data-tool-choice="point"] svg')
            def snapshot():return json.loads(page.evaluate('window.__round36Snapshot()'))
            def command(expr):
                before=len(snapshot()['objects'])
                page.locator('#command').fill(expr)
                page.locator('#command-form button').click()
                page.wait_for_timeout(80)
                assert len(snapshot()['objects'])>before,('command rejected',expr)
                return snapshot()['objects'][-1]
            # Use real app commands: left panel icons must be identical markup to
            # the corresponding right tool for both old and new Geometry types.
            for c in ['A=(0,0)','B=(4,0)','C=(1,3)','D=(4,3)']:
                command(c)
            for c in [
                'Segment(A,B)','Line(A,C)','Circle(A,B)',
                'Midpoint(A,B)','Ellipse(A,B,C)', 'Rectangle(A,B,C)',
                'Parallelogram(A,B,C)', 'Polygon(A,B,C)',
                'Polyline(A,B,C)', 'Bezier(A,B,C,D)', 'Angle(A,B,C)',
                'RegularPolygon(A,B,5)',
            ]:
                command(c)
            sample=[o for o in snapshot()['objects'] if o['type'] in {
                'point','segment','line','circle','midpoint','ellipse','rectangle',
                'parallelogram','polygon','polyline','bezier','angle','regularPolygon'}]
            for o in sample:
                # Test real row rendering even when the full list is virtualized.
                page.evaluate('(id)=>window.__round51eShow(id)',o['id'])
                row=page.locator(f'#objects .object[data-id="{o["id"]}"]')
                row.wait_for(state='attached')
                icon=row.locator('.glyph svg')
                tool=page.locator(f'[data-tool-choice="{o["type"]}"] svg')
                assert icon.count()==1 and tool.count()==1, (o['type'],o['id'],icon.count(),tool.count())
                assert icon.inner_html()==tool.inner_html(),o['type']
                assert icon.get_attribute('viewBox')==tool.get_attribute('viewBox')
                assert icon.evaluate('(e)=>getComputedStyle(e).strokeWidth')==tool.evaluate('(e)=>getComputedStyle(e).strokeWidth')
                assert icon.evaluate('(e)=>getComputedStyle(e).width')==tool.evaluate('(e)=>getComputedStyle(e).width')
                assert icon.evaluate('(e)=>getComputedStyle(e).color')==tool.evaluate('(e)=>getComputedStyle(e).color')
            page.locator('#object-search').fill('')
            print(f'Objects/Tools pixel-size, viewBox and exact SVG markup parity for {len(sample)} constructed objects PASS',flush=True)

            # Every supported non-plot object type is required to have a right
            # tool glyph. Transformed images map to their specific transform.
            all_types='point midpoint segment arrow line ray perpBisector angleBisector parallelThrough perpendicularThrough perpendicularFoot pointOnObject tangentCircle circularArc parabola hyperbola generalIntersection locus fixedLength fixedAngle triangleCenter intersection circleIntersection circleCircleIntersection circle circleThrough3 ellipse rectangle parallelogram polygon polyline bezier angle regularPolygon spline freehand text node morphism'.split()
            for typ in all_types:
                icon=page.evaluate('t=>window.__round51eIcon({type:t})',typ)
                assert icon['type'] is not None and icon['svg'],typ
                right=page.locator(f'[data-tool-choice="{icon["type"]}"] svg')
                assert right.count()==1,typ
                assert page.evaluate('args=>{const el=document.createElement("div");el.innerHTML=args.svg;return el.firstElementChild.outerHTML===document.querySelector(`[data-tool-choice="${args.type}"] svg`).outerHTML}',icon),typ
            assert page.evaluate('window.__round51eIcon({type:"spline",closed:true}).type')=='closedSpline'
            for transform,expected in [('reflect','reflection'),('rotate','rotation'),('translate','translation'),('dilate','dilation'),('invert','circleInversion')]:
                result=page.evaluate('t=>window.__round51eIcon({type:"transformCopy",transform:t})',transform)
                assert result['type']==expected,transform
                assert page.evaluate('args=>{const el=document.createElement("div");el.innerHTML=args.svg;return el.firstElementChild.outerHTML===document.querySelector(`[data-tool-choice="${args.type}"] svg`).outerHTML}',result)
            # Construct five different transform-copy objects in the actual app
            # document and compare their Objects rows to the five Tools icons.
            objects=snapshot()['objects']
            names={o['name']:o['id'] for o in objects}
            line=next(o['id'] for o in objects if o['type']=='line')
            circle=next(o['id'] for o in objects if o['type']=='circle')
            specs=[
                ('reflection', {'type':'transformCopy','refs':[names['C'],line],'transform':'reflect','amount':0}),
                ('rotation', {'type':'transformCopy','refs':[names['C'],names['A']],'transform':'rotate','amount':0.65}),
                ('translation', {'type':'transformCopy','refs':[names['C'],names['A'],names['B']],'transform':'translate','amount':0}),
                ('dilation', {'type':'transformCopy','refs':[names['C'],names['A']],'transform':'dilate','amount':1.4}),
                ('circleInversion', {'type':'transformCopy','refs':[names['C'],circle],'transform':'invert','amount':0}),
            ]
            for tool,spec in specs:
                oid=page.evaluate('spec=>window.__round51eAdd(spec)',spec)
                page.evaluate('id=>window.__round51eShow(id)',oid)
                left=page.locator(f'#objects .object[data-id="{oid}"] .glyph svg')
                right=page.locator(f'[data-tool-choice="{tool}"] svg')
                assert left.inner_html()==right.inner_html(),tool
                assert left.get_attribute('viewBox')==right.get_attribute('viewBox'),tool
            print('Five real transform-copy Objects rows match the five right-panel transformation glyphs PASS',flush=True)
            for mode in ['function','parametric','implicit','vectorField','domainColoring']:
                assert page.evaluate('t=>window.__round51eIcon({type:t})',mode)=={'type':None,'svg':None},mode
            assert not errors,errors
            print('All non-plot object glyph mappings, five transformation variants, spline closure and plotting exemption PASS',flush=True)
        finally:browser.close()

if __name__=='__main__':main()
