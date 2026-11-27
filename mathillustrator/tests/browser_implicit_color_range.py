"""Real Chromium: implicit scalar fill, strict region, shared appearance, history and export."""
import json, os, math
from playwright.sync_api import sync_playwright, expect
from browser_smoke import inline_html


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            p = browser.new_page(viewport={'width': 1450, 'height': 900}, accept_downloads=True)
            p.set_default_timeout(20000)
            errors = []
            p.on('pageerror', lambda e: errors.append(str(e)))
            p.set_content(inline_html(expose_state=True), wait_until='load')
            state = lambda: json.loads(p.evaluate('window.__round36Snapshot()'))
            props = p.locator('#properties')
            def add(mode, expression, second=None):
                p.locator('#plot-mode').select_option(mode)
                p.locator('#command').fill(expression)
                if second is not None: p.locator('#command-y').fill(second)
                p.locator('#command').press('Enter')
                return state()['objects'][-1]
            def select(obj):
                p.locator('#objects [data-id="'+obj+'"]').first.click()
            def item(): return next(o for o in state()['objects'] if o['id']==oid)
            def field(name): return props.locator('label[data-property-label="'+name+'"] input')
            def select_field(name): return props.locator('label[data-property-label="'+name+'"] select')
            def check(): return props.locator('.style-color-range input')
            def picture(): return p.locator('#drawing image[data-id="'+oid+'"]')
            def pixels():
                return picture().evaluate('''async e=>{const im=new Image();im.src=e.getAttribute('href');await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);return [Array.from(x.getImageData(0,0,1,1).data),Array.from(x.getImageData(im.width-1,0,1,1).data)];}''')
            add('vectorField','-y','x')
            assert field('Stroke').count()==1 and field('Vector color').count()==0
            assert props.locator('.plot-region-editor input').count()==6
            obj=add('implicit','x=1');oid=obj['id']
            assert field('Stroke').is_enabled() and field('Width').is_enabled()
            assert select_field('Color scheme').is_disabled() and field('Resolution').is_disabled()
            bounds=props.locator('.plot-region-editor input')
            assert bounds.count()==6 and all(node.is_disabled() for node in bounds.all())
            assert p.locator('#drawing path[data-id="'+oid+'"]').count()>0
            check().check()
            assert item()['colorRange'] is True and picture().count()==1
            assert select_field('Color scheme').is_enabled() and field('Resolution').is_enabled()
            order=p.evaluate("""() => Array.from(document.querySelectorAll('#properties label.field')).map(el => el.dataset.propertyLabel || '').filter(Boolean)""")
            assert order.index('Color scheme') < order.index('Resolution') < order.index('x min')
            assert p.locator('#drawing [data-id="'+oid+'"]').count()==1, 'raster must not acquire a stroke hit target'
            assert field('Fill').is_disabled() and field('Stroke').count()==0 and field('Width').count()==0
            assert all(node.is_enabled() for node in bounds.all())
            assert pixels()==[[239,68,68,255],[59,130,246,255]],pixels()
            select_field('Color scheme').select_option('sign');assert item()['colorMode']=='sign' and pixels()==[[59,130,246,255],[239,68,68,255]]
            field('Resolution').fill('64');field('Resolution').press('Tab');assert item()['resolution']==64
            select_field('Color scheme').select_option('range');assert item()['colorMode']=='range' and pixels()==[[239,68,68,255],[59,130,246,255]]
            assert props.locator('[data-color-property="fill"] button:disabled').count()==10
            radius=props.get_by_label('Centered half-range');radius.fill('2pi');radius.press('Enter')
            assert all(math.isclose(v,(-1 if k.endswith('Min') else 1)*2*math.pi) for k,v in item()['region'].items())
            bounds=props.locator('.plot-region-editor input');before=item()['region'].copy()
            bounds.nth(0).fill('10');bounds.nth(0).press('Enter');assert item()['region']==before
            p.wait_for_function("document.querySelector('#properties .plot-region-editor input').value !== '10'")
            for i,v in enumerate(('-2','2','-1','1')): bounds.nth(i).fill(v)
            bounds.nth(3).press('Enter');assert item()['region']=={'xMin':-2,'xMax':2,'yMin':-1,'yMax':1}
            region=props.get_by_label('Region inequality');region.fill('x>0');region.press('Enter')
            assert item()['regionCondition']=='x>0';assert pixels()[0][3]==0 and pixels()[1]==[59,130,246,255]
            region.fill('x<=0');region.press('Enter');assert item()['regionCondition']=='x>0'
            region.fill('');region.press('Enter');assert item()['regionCondition']=='';assert pixels()[0]==[239,68,68,255]
            # The region image is fixed in world space; zoom reprojects, not resamples.
            uri=picture().get_attribute('href');width=float(picture().get_attribute('width'))
            p.locator('#zoom-in').click();assert picture().get_attribute('href')==uri and float(picture().get_attribute('width'))>width
            p.locator('#zoom-reset').click()
            # Slider-dependent fields invalidate the cached raster when the slider changes.
            entry=p.locator('#unified-algebra-input');entry.fill('b = Slider(-2, 2, 1, 1)');entry.press('Enter');select(oid)
            field('F(x, y)').fill('b*x+y');field('F(x, y)').press('Tab');initial=picture().get_attribute('href')
            p.locator('#objects [data-slider="b"] .algebra-entry-label').first.click()
            value=props.locator('input[data-numeric-expression="true"]').nth(3);value.fill('-1');value.press('Tab')
            assert state()['algebra']['sliders'][0]['value']==-1 and picture().get_attribute('href')!=initial
            select(oid)
            first=picture().get_attribute('href');field('F(x, y)').fill('y');field('F(x, y)').press('Tab')
            assert item()['expr']=='y' and picture().get_attribute('href')!=first
            assert pixels()==[[59,130,246,255],[59,130,246,255]]
            field('Opacity').fill('0.5');field('Opacity').press('Tab');assert picture().get_attribute('opacity')=='0.5'
            saved_region=item()['region'].copy();check().uncheck()
            assert item()['colorRange'] is False and item()['region']==saved_region and picture().count()==0 and field('Stroke').is_enabled()
            check().check();assert item()['region']==saved_region and picture().count()==1
            d=state();p.locator('#undo').click();assert item()['colorRange'] is False
            p.locator('#redo').click();assert item()['colorRange'] is True
            select(oid)
            p.locator('#export-open').click()
            with p.expect_download() as dl: p.locator('#export-options button').filter(has_text='SVG').click()
            assert 'data:image/png;base64,' in dl.value.path().read_text()
            p.locator('#export-open').click()
            with p.expect_download() as dl: p.locator('#export-options button').filter(has_text='PNG').click()
            assert dl.value.path().read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
            with p.expect_download() as dl: p.locator('#save').click()
            assert json.loads(dl.value.path().read_text())['objects']==d['objects']
            p.locator('#open-file').set_input_files({'name':'range.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
            p.wait_for_function("document.querySelector('#drawing image[data-id=\""+oid+"\"]') !== null")
            assert state()['objects']==d['objects'];select(oid);assert check().is_checked()
            p.locator('#ui-language').select_option('zh');assert '填充颜色' in props.locator('label[data-property-label="Fill"]').inner_text()
            p.locator('#ui-language').select_option('en')
            obj=add('domainColoring','z');oid=obj['id'];assert field('Fill').is_disabled() and field('Width').count()==0
            field('Resolution').fill('64');field('Resolution').press('Tab')
            uris=set()
            for mode in ('phase-modulus','phase-contours','phase-checker','phase-sectors'):
                select_field('Color scheme').select_option(mode)
                assert item()['colorMode']==mode
                p.wait_for_function("document.querySelector('#drawing image[data-id=\""+oid+"\"]') !== null")
                uris.add(picture().get_attribute('href'))
            assert len(uris)==4
            p.locator('#undo').click();assert item()['colorMode']=='phase-checker'
            p.locator('#redo').click();assert item()['colorMode']=='phase-sectors'
            p.locator('#scene3d-enable').check();p.locator('#plot-mode').select_option('surface3d');p.locator('#command').fill('x+y');p.locator('#command').press('Enter')
            expect(field('Fill')).to_have_count(1)
            expect(props.locator('.plot-color-options').get_by_text('Color range')).to_have_count(1)
            p.locator('#plot-mode').select_option('vector3d');p.locator('#command').fill('x');p.locator('#command-y').fill('y');p.locator('#command-z').fill('z');p.locator('#command').press('Enter')
            expect(field('Stroke')).to_have_count(1)
            expect(props.locator('.plot-color-options').get_by_text('Color range')).to_have_count(1)
            assert not errors,errors
            print('PASS implicit scalar color range: six region controls, strict masking, ramp pixels, opacity, toggle, undo/redo, JSON, SVG, PNG, bilingual styles, 3D names')
        finally:
            browser.close()

if __name__=='__main__': run()
