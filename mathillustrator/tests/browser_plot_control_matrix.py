"""Current plot Properties matrix: all ten modes, both locales, range, palette, lock and persistence."""
import json
import os
from playwright.sync_api import sync_playwright, expect
from browser_smoke import inline_html

MODES_2D = [('function', ('x',), ('f(x)',)), ('parametric', ('cos(t)', 'sin(t)'), ('x(t)', 'y(t)')), ('implicit', ('x=1',), ('F(x, y)',)), ('vectorField', ('x', 'y'), ('X(x, y)', 'Y(x, y)')), ('domainColoring', ('z',), ('F(z)',))]
MODES_3D = [('surface3d', ('x+y',), ('f(x, y)',)), ('parametric3d', ('u', 'v', 'u+v'), ('x(u, v)', 'y(u, v)', 'z(u, v)')), ('implicit3d', ('x*x+y*y+z*z-1',), ('F(x, y, z)',)), ('vector3d', ('x', 'y', 'z'), ('X(x, y, z)', 'Y(x, y, z)', 'Z(x, y, z)')), ('domain3d', ('z',), ('F(z)',))]
SCALAR = ['range', 'diverging', 'viridis', 'inferno', 'grayscale', 'rainbow', 'sign', 'bands']
COMPLEX = ['phase-modulus', 'phase', 'contours', 'phase-contours', 'phase-checker', 'phase-sectors']


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            p = browser.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
            p.set_default_timeout(15000)
            errors = []
            p.on('pageerror', lambda e: errors.append(str(e)))
            p.on('dialog', lambda d: d.accept())
            p.set_content(inline_html(legacy_search_expanded=False, expose_state=True), wait_until='load')
            state = lambda: json.loads(p.evaluate('window.__round36Snapshot()'))
            props = p.locator('#properties')
            field = lambda name: props.locator('label[data-property-label="'+name+'"] input, label[data-property-label="'+name+'"] select')
            checks = 0
            ids = {}
            def select(mode):
                three = mode.endswith('3d')
                row = p.locator(('#objects-3d [data-plot3d="' if three else '#objects [data-id="')+str(ids[mode])+'"]')
                row.locator('.object-label').click() if three else row.click()
                return row
            def obj(mode):
                return next(o for o in (state()['scene3d']['plots'] if mode.endswith('3d') else state()['objects']) if o['id']==ids[mode])
            def add(mode, values):
                p.locator('#plot-mode').select_option(mode)
                for selector, value in zip(('#command', '#command-y', '#command-z'), values):
                    p.locator(selector).fill(value)
                p.locator('#command').press('Enter')
                items = state()['scene3d']['plots'] if mode.endswith('3d') else state()['objects']
                ids[mode] = items[-1]['id']
                select(mode)
            def set_num(name, value):
                field(name).fill(str(value)); field(name).press('Tab')
            def opts():
                return field('Color scheme').locator('option').evaluate_all('(els)=>els.map(e=>e.value)')
            def assert_state(name, status):
                if status == 'absent': expect(field(name)).to_have_count(0)
                elif status == 'enabled': expect(field(name)).to_be_enabled()
                else: expect(field(name)).to_be_disabled()
            def assert_swatches(disabled):
                buttons = props.locator('.style-controls-grid button[data-color-value], .plot-color-grid button[data-color-value]')
                if not buttons.count(): buttons = props.locator('.style-controls-grid .color-swatches button, .plot-color-grid .color-swatches button')
                assert buttons.count() > 0, 'No swatches found'
                assert all(b.is_disabled()==disabled for b in buttons.all())
            def order(names):
                labels = props.locator('[data-property-label]').evaluate_all('(els)=>els.map(e=>e.dataset.propertyLabel)')
                assert [labels.index(n) for n in names] == sorted(labels.index(n) for n in names), labels
            def lock(mode, locked, lang):
                row = select(mode)
                if mode.endswith('3d'):
                    row.get_by_role('button', name=('锁定' if locked else '解锁') if lang=='zh' else ('Lock' if locked else 'Unlock'), exact=True).click()
                else:
                    row.locator('.object-menu-toggle').click()
                    p.locator('#object-action-menu [data-action="lock"]').click()
                assert obj(mode)['locked'] == locked
                select(mode)
                if locked:
                    assert_state('Name','disabled')
                    assert props.locator('input:not(:disabled),select:not(:disabled),textarea:not(:disabled)').count()==0
                else: assert_state('Name','enabled')
            def matrix(mode, formulas, lang):
                nonlocal checks
                select(mode)
                for formula in formulas: assert_state(formula,'enabled')
                assert_state('Name','enabled');assert_state('Opacity','enabled')
                assert props.locator('label[data-property-label="Name"]').inner_text().strip()==('名称' if lang=='zh' else 'Name')
                three=mode.endswith('3d');vector=mode in ('vectorField','vector3d');implicit=mode=='implicit';complex2=mode=='domainColoring';complex3=mode=='domain3d'
                has_range=three or vector or implicit
                has_scheme=implicit or complex2 or complex3
                has_region=three or vector or implicit or complex2
                if has_region:
                    assert props.locator('.plot-region-editor').get_attribute('aria-label')==('绘制区域' if lang=='zh' else 'Drawing region')
                    expect(props.locator('.plot-region-editor :is(h1,h2,h3,h4,h5,h6)')).to_have_count(0)
                    layout = props.locator('.plot-region-editor').evaluate('''e=>{const a=e.parentElement.querySelector(':scope > .style-controls-grid, :scope > .plot-color-grid');return {regionMargin:parseFloat(getComputedStyle(e).marginTop),appearanceMargin:parseFloat(getComputedStyle(a).marginTop),columns:getComputedStyle(e).gridTemplateColumns.split(' ').length,overflow:e.scrollWidth>e.clientWidth+1}}''')
                    assert layout=={'regionMargin':12,'appearanceMargin':12,'columns':2,'overflow':False}, (mode,lang,layout)
                    if vector: order(['Normalize lengths','Density','x min','x max'])
                for range_on in ([False,True] if has_range else [False]):
                    if has_range:
                        field('Color range').set_checked(range_on)
                        assert obj(mode).get('colorRange',False)==range_on
                    else: assert_state('Color range','absent')
                    color='Fill' if complex2 or (three and not vector) or (implicit and range_on) else 'Stroke'
                    assert_state('Fill' if color=='Stroke' else 'Stroke','absent')
                    auto=complex2 or range_on or (complex3 and obj(mode)['colorMode']!='solid')
                    assert_state(color,'disabled' if auto else 'enabled'); assert_swatches(auto)
                    assert_state('Width','enabled' if vector or (not three and not complex2 and not (implicit and range_on)) else 'absent')
                    assert_state('Density','enabled' if vector else 'absent')
                    assert_state('Normalize lengths','enabled' if vector else 'absent')
                    assert_state('Color scheme',('disabled' if (implicit and not range_on) or (complex3 and range_on) else 'enabled') if has_scheme else 'absent')
                    assert_state('Resolution',('disabled' if implicit and not range_on else 'enabled') if (implicit or complex2) else 'absent')
                    for bound in ['x min','x max','y min','y max','Centered half-range','Region inequality']:
                        assert_state(bound,('disabled' if implicit and not range_on else 'enabled') if has_region else 'absent')
                    for bound in ['z min','z max']:assert_state(bound,'enabled' if three else 'absent')
                    if has_scheme: order(['Color scheme']+(['Resolution'] if implicit or complex2 else [])+['x min','x max'])
                    if complex3: assert_state('Height represents','enabled')
                    checks+=1
                if has_range: field('Color range').uncheck()
                lock(mode,True,lang);lock(mode,False,lang)
            for mode, values, formulas in MODES_2D:
                add(mode, values)
                if mode=='parametric':
                    old=obj(mode).copy();field('t min').fill('3*pi');field('t max').fill('4*pi');assert obj(mode)==old
                    field('t max').press('Enter');assert obj(mode)['tMin']==3*3.141592653589793 and obj(mode)['tMax']==4*3.141592653589793
                    field('t max').fill('0');field('t max').press('Enter');assert obj(mode)['tMax']==4*3.141592653589793
                if mode=='domainColoring': set_num('Resolution',32)
                if mode=='implicit':
                    field('Color range').check();set_num('Resolution',32);field('Color range').uncheck()
                matrix(mode,formulas,'en')
            p.locator('#ui-language').select_option('zh')
            for mode,_,formulas in MODES_2D: matrix(mode,formulas,'zh')
            p.locator('#ui-language').select_option('en')
            select('implicit');field('Color range').check();assert opts()==SCALAR
            for scheme in SCALAR:
                field('Color scheme').select_option(scheme);assert obj('implicit')['colorMode']==scheme
            # Full raster resolution must be renderable even under a small curve budget.
            field('Centered half-range').fill('1');field('Centered half-range').press('Enter')
            p.locator('#plot-budget').select_option('80000')
            set_num('Resolution',1536)
            image=p.locator('#drawing image[data-id="'+ids['implicit']+'"]')
            assert image.evaluate('''async el=>{const image=new Image();image.src=el.getAttribute('href');await image.decode();return [image.width,image.height];}''')==[1536,1536]
            set_num('Resolution',32);field('Color range').uncheck()
            assert obj('implicit')['colorMode']=='bands' and obj('implicit')['resolution']==32
            select('domainColoring');assert opts()==COMPLEX
            for scheme in COMPLEX: field('Color scheme').select_option(scheme);assert obj('domainColoring')['colorMode']==scheme
            # Existing objects retain names; the convention governs subsequent objects in either scene.
            p.locator('#naming-convention').select_option('snake')
            p.locator('#scene3d-enable').check()
            for mode,values,formulas in MODES_3D:
                add(mode,values)
                if mode=='parametric3d':
                    old=obj(mode).copy();field('u min').fill('3*pi');field('u max').fill('4*pi');field('v min').fill('-pi');field('v max').fill('pi');assert obj(mode)==old
                    field('v max').press('Enter');assert obj(mode)['uMin']==3*3.141592653589793 and obj(mode)['vMin']==-3.141592653589793
                    field('u max').fill('0');field('u max').press('Enter');assert obj(mode)['uMax']==4*3.141592653589793
                if mode=='domain3d': assert obj(mode)['name']=='domain_coloring '+str(ids[mode])
                matrix(mode,formulas,'en')
            p.locator('#ui-language').select_option('zh')
            # Hidden earlier 3D plots are listed when requested, or unhide them as needed.
            for mode,_,formulas in MODES_3D: matrix(mode,formulas,'zh')
            p.locator('#ui-language').select_option('en')
            select('domain3d');assert opts()==COMPLEX+['solid']
            for scheme in COMPLEX+['solid']:
                field('Color scheme').select_option(scheme);assert obj('domain3d')['colorMode']==scheme
                assert_state('Fill','enabled' if scheme=='solid' else 'disabled')
                field('Color range').check();assert_state('Color scheme','disabled');assert_state('Fill','disabled');assert_swatches(True)
                field('Color range').uncheck();assert_state('Color scheme','enabled');assert obj('domain3d')['colorMode']==scheme
            set_num('Opacity',0);assert obj('domain3d')['opacity']==0
            set_num('Opacity',-1);assert obj('domain3d')['opacity']==0
            set_num('Opacity',1);assert obj('domain3d')['opacity']==1
            old_name=obj('domain3d')['name'];field('Name').fill(obj('surface3d')['name']);field('Name').press('Tab');assert obj('domain3d')['name']==old_name
            field('Color range').check();p.locator('#undo').click();select('domain3d');assert_state('Color scheme','enabled');p.locator('#redo').click();select('domain3d');assert_state('Color scheme','disabled')
            saved=state()
            p.locator('#open-file').set_input_files({'name':'matrix.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
            p.wait_for_function("JSON.parse(window.__round36Snapshot()).scene3d.plots.length===5")
            assert state()['scene3d']==saved['scene3d'] and state()['objects']==saved['objects']
            select('domain3d');assert_state('Color scheme','disabled');field('Color range').uncheck();assert_state('Fill','enabled')
            p.locator('#scene3d-enable').uncheck();select('implicit');assert_state('Color scheme','disabled');field('Color range').check();assert field('Color scheme').input_value()=='bands'
            assert not errors,errors
            print(f'PASS plot control matrix: {checks} mode/range/locale cases; 8 scalar and 6 complex palettes, solid 3D, locks, bounds, resolution, opacity, names, history and JSON')
        finally:
            browser.close()

if __name__=='__main__':run()
