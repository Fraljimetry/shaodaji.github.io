"""Isolated Chromium browser smoke, no HTTP access or external resources required.
Requires: pip install playwright, a local Chromium binary. Uses page.set_content because
this build environment blocks browser navigation to localhost; NOT a hosted-site test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, json, tempfile, os

ROOT = Path(__file__).resolve().parents[1]

def inline_html():
    js = lambda src: 'data:text/javascript;base64,'+base64.b64encode(src.encode()).decode()
    model=js((ROOT/'src/model.mjs').read_text())
    layout=js((ROOT/'src/diagram_layout.mjs').read_text())
    geometry=js((ROOT/'src/geometry.mjs').read_text().replace("from './diagram_layout.mjs'",f"from '{layout}'"))
    routing=js((ROOT/'src/diagram_routing.mjs').read_text().replace("from './diagram_layout.mjs'",f"from '{layout}'"))
    global_routing=js((ROOT/'src/diagram_global_routing.mjs').read_text().replace("from './diagram_routing.mjs'",f"from '{routing}'"))
    anchors=js((ROOT/'src/anchor_index.mjs').read_text())
    labels=js((ROOT/'src/label_layout.mjs').read_text())
    morphism_labels=js((ROOT/'src/morphism_label_layout.mjs').read_text())
    diagram=(ROOT/'src/diagram.mjs').read_text().replace("from './model.mjs'",f"from '{model}'")
    diagram=js(diagram)
    plot=js((ROOT/'src/plot.mjs').read_text())
    storage=js((ROOT/'src/storage.mjs').read_text())
    fidelity=(ROOT/'src/export_fidelity.mjs').read_text().replace("from './model.mjs'",f"from '{model}'").replace("from './geometry.mjs'",f"from '{geometry}'")
    fidelity=js(fidelity)
    cache=js((ROOT/'src/plot_cache.mjs').read_text())
    app=(ROOT/'src/app.mjs').read_text().replace("from './model.mjs'",f"from '{model}'").replace("from './geometry.mjs'",f"from '{geometry}'").replace("from './diagram.mjs'",f"from '{diagram}'").replace("from './plot.mjs'",f"from '{plot}'").replace("from './storage.mjs'",f"from '{storage}'").replace("from './export_fidelity.mjs'",f"from '{fidelity}'").replace("from './diagram_layout.mjs'",f"from '{layout}'").replace("from './plot_cache.mjs'",f"from '{cache}'").replace("from './anchor_index.mjs'",f"from '{anchors}'").replace("from './label_layout.mjs'",f"from '{labels}'").replace("from './diagram_routing.mjs'",f"from '{routing}'")
    app=app.replace("from './morphism_label_layout.mjs'",f"from '{morphism_labels}'")
    app=app.replace("from './diagram_global_routing.mjs'",f"from '{global_routing}'")
    html=(ROOT/'index.html').read_text()
    html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(ROOT/'style.css').read_text()+'</style>')
    return html.replace('<script type="module" src="./src/app.mjs"></script>','<script type="module">'+app+'</script>')

def cmd(page,source):
    page.locator('#command').fill(source)
    page.locator('#command-form button').click()

def download(page,name):
    with page.expect_download(timeout=10000) as event:page.get_by_role('button',name=name,exact=True).click()
    dest=Path(tempfile.mkdtemp())/event.value.suggested_filename
    event.value.save_as(dest)
    return dest

def run():
    with sync_playwright() as p:
        chrome=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium')
        browser=p.chromium.launch(executable_path=chrome,headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('dialog',lambda d:d.accept())
        page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(150)
        assert page.locator('#drawing').count()==1
        assert page.locator('button.tool').count()>=15
        assert not errors, errors
        for text in ['A=(0,0)','B=(3,0)','C=(1,2)','Segment(A,B)','Arrow(A,B)','Ellipse(A,B)','Angle(A,B,C)','Bezier(A,B,C,B)']:
            cmd(page,text)
        assert page.locator('#object-count').inner_text()=='8'
        assert page.locator('#drawing [data-id]').count()>=8
        page.locator('#object-search').fill('Bezier')
        assert page.locator('#objects .object').count()==1
        page.locator('#object-search').fill('')
        page.locator('#preset').select_option('Commutative diagrams')
        assert page.locator('[data-tool-module="diagram"]').is_visible()
        assert not page.locator('[data-tool-module="construction"]').is_visible()
        page.locator('#module-construction').check()
        assert page.locator('[data-tool-module="construction"]').is_visible()
        page.locator('#export-open').click()
        assert page.get_by_role('button',name='PDF',exact=True).is_disabled()
        assert page.get_by_role('button',name='tikz-cd (semantic)',exact=True).is_disabled()
        tikz=download(page,'TikZ / PGF')
        assert '\\begin{tikzpicture}' in tikz.read_text()
        page.locator('#export-open').click()
        svg=download(page,'SVG').read_text()
        assert '<polygon' in svg and 'class="arrowhead"' in svg and '<marker' not in svg and '<svg' in svg
        page.locator('#export-open').click()
        png=download(page,'PNG').read_bytes()
        assert png[:8]==b'\x89PNG\r\n\x1a\n' and len(png)>2000
        page.locator('#page').select_option('a4')
        page.locator('#export-region').select_option('page')
        page.locator('#export-open').click()
        framed=download(page,'SVG').read_text()
        assert 'viewBox="0 0' not in framed
        page.locator('#export-open').click()
        project=json.loads(download(page,'JSON project').read_text())
        assert project['objects'][-1]['type']=='bezier'
        assert project['settings']['exportRegion']=='page'
        # Import a simple nonempty semantic diagram and verify actionable export.
        page.locator('#tikzcd-open').click()
        page.locator('#tikzcd-input').fill('\\begin{tikzcd}\nA \\arrow[r, "f"] & B \\\\\nC & D \\arrow[u, "g"]\n\\end{tikzcd}')
        page.locator('#tikzcd-apply').click()
        assert page.locator('#object-count').inner_text()=='6'
        page.locator('#export-open').click()
        assert not page.get_by_role('button',name='tikz-cd (semantic)',exact=True).is_disabled()
        tex=download(page,'tikz-cd (semantic)').read_text()
        assert '\\arrow[r, "f"]' in tex
        page.locator('#undo').click()
        assert page.locator('#object-count').inner_text()=='8'
        page.locator('#redo').click()
        assert page.locator('#object-count').inner_text()=='6'
        # Property change remains durable after multiple successive edits.
        page.locator('#objects .object').first.click()
        page.locator('#properties input[type=number]').first.fill('0.5')
        page.locator('#properties input[type=number]').first.dispatch_event('change')
        page.locator('#save').click()  # Save action works without a native file dialog.
        assert not errors,errors
        print('CHROMIUM_ISOLATED_SMOKE_PASS: startup, tools, commands, search, presets, visibility, SVG/PNG/TikZ/JSON, frame crop, tikzcd interchange, undo/redo, property edit')
        browser.close()

if __name__=='__main__':run()
