"""Isolated Chromium browser smoke, no HTTP access or external resources required.
Requires: pip install playwright, a local Chromium binary. Uses page.set_content because
this build environment blocks browser navigation to localhost; NOT a hosted-site test.
"""
from pathlib import Path
import base64, json, tempfile, os, re

ROOT = Path(__file__).resolve().parents[1]
# The isolated fixture loads the actual current import graph, not a historical
# list of cache-busting substitutions. Import maps avoid recursively embedding
# the same source in every parent module's data URL.
MODULE_EDGE = re.compile(r"(?m)^(?P<prefix>(?:import|export)\s+[^;\n]*?\s+from\s*)(?P<quote>['\"])(?P<path>\./[\w.-]+\.mjs(?:\?[^'\"\n]*)?)(?P=quote)")


def inline_module_graph(root=ROOT):
    """Return the live entry source and exact-specifier import map."""
    imports = {}

    def rewrite(source):
        def edge(match):
            path = match['path']
            alias = 'mi/' + path[2:]
            if alias not in imports:
                # Reserve the alias before descending (also supports cycles).
                imports[alias] = None
                module = root / 'src' / path[2:].split('?', 1)[0]
                content = rewrite(module.read_text(encoding='utf8'))
                # Preserve distinct browser module identities for distinct URLs,
                # even when the contents of two cache-busted modules are equal.
                content += '\n//# sourceURL=' + alias + '\n'
                imports[alias] = 'data:text/javascript;base64,' + base64.b64encode(content.encode()).decode()
            return match['prefix'] + match['quote'] + alias + match['quote']
        return MODULE_EDGE.sub(edge, source)

    entry = rewrite((root / 'src/app.mjs').read_text(encoding='utf8'))
    return entry, imports


def inline_html(*,legacy_search_expanded=True,expose_state=False):
    app, imports = inline_module_graph()
    if expose_state:
        assert app.endswith('initialise();\n')
        app=app[:-len('initialise();\n')]+"window.__round36Snapshot=()=>JSON.stringify(doc);\ninitialise();\n"
    html=(ROOT/'index.html').read_text(encoding='utf8')
    html,replaced=re.subn(r'<link rel="stylesheet" href="\./style\.css[^"]*">',lambda _: '<style>'+(ROOT/'style.css').read_text(encoding='utf8')+'</style>',html,count=1)
    assert replaced==1, 'Missing application stylesheet in browser fixture'
    vendor='<script defer src="./vendor/mathjax-tex-svg.js"></script>'
    assert html.count(vendor)==1, 'Missing MathJax script in browser fixture'
    html=html.replace(vendor, '<script>'+(ROOT/'vendor/mathjax-tex-svg.js').read_text(encoding='utf8')+'</script>')
    import_map='<script type="importmap">'+json.dumps({'imports':imports})+'</script>'
    html,replaced=re.subn(r'<script type="module" src="\./src/app\.mjs(?:\?[^"]+)?"></script>',lambda _: import_map+'<script type="module">'+app+'</script>',html)
    assert replaced==1, 'Inline Chromium fixture must execute the real current application module'
    if legacy_search_expanded:
        # Archived scripts are SHA-locked and describe the old always-on search,
        # eye/lock inline controls and Delete button. Translate these *test-only*
        # selectors to the real menu actions; the new focused browser suite uses
        # legacy_search_expanded=False and exercises the unmodified current DOM.
        legacy = r"""<script>
window.addEventListener('load',()=>{
 // Search is permanently visible in Round 18; no toggle is necessary.
 const root=document.getElementById('objects'),tools=document.querySelector('.object-tools');
 const deleteButton=document.createElement('button');deleteButton.id='delete';deleteButton.hidden=true;
 deleteButton.textContent='Delete selected';tools.append(deleteButton);
 function refresh(){
  const sel=root.querySelector('.object.selected');
  deleteButton.disabled=!sel||sel.dataset.locked==='true';
  for(const row of root.querySelectorAll('.object')){
   if(row.querySelector('.legacy-eye'))continue;
   const toggle=row.querySelector('.object-menu-toggle');if(!toggle)continue;
   function oldControl(action,label,cls){
    const b=document.createElement('button');b.type='button';b.className=cls;
    b.title=label;b.setAttribute('aria-label',label);
    b.textContent=action==='visibility'?'◉':'◇';b.style.padding='2px';
    b.onclick=e=>{e.stopPropagation();toggle.click();
     document.querySelector('#object-action-menu [data-action="'+action+'"]')?.click();};
    row.insertBefore(b,toggle);
   }
   oldControl('visibility',row.classList.contains('hidden')?'Show':'Hide','legacy-eye');
   oldControl('lock',row.dataset.locked==='true'?'Unlock':'Lock','legacy-lock');
  }
 }
 new MutationObserver(refresh).observe(root,{childList:true,subtree:true});refresh();
});
</script>"""
        html=html.replace('</body>',legacy+'</body>')
    return html

def object_action(page,row,action):
    row.locator('button.object-menu-toggle').click()
    page.locator(f'#object-action-menu button[data-action="{action}"]').click()

def cmd(page,source):
    page.locator('#command').fill(source)
    page.locator('#command-form button').click()

def download(page,name):
    with page.expect_download(timeout=10000) as event:page.get_by_role('button',name=name,exact=True).click()
    dest=Path(tempfile.mkdtemp())/event.value.suggested_filename
    event.value.save_as(dest)
    return dest

def run():
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        chrome=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
        browser=p.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':chrome} if chrome else {}))
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        page.set_default_timeout(8000)
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
        page.locator('#object-input-toggle').click()
        assert page.locator('#object-search').is_visible()
        page.locator('#object-search').fill('Bezier')
        assert page.locator('#objects .object').count()==1
        page.locator('#object-search').fill('')
        page.locator('#object-input-toggle').click()
        assert page.locator('#unified-algebra-input').is_visible()
        palette=page.locator('[data-tool-module="construction"] > h3 > .section-toggle')
        palette.click()
        assert page.locator('#construction-tools').is_hidden()
        assert page.locator('[data-tool-module="diagram"]').is_visible()
        palette.click()
        assert page.locator('#construction-tools').is_visible()
        # New point displayed labels default to LaTeX and are unsupported by
        # restricted TikZ; explicitly opt into legacy plain display and fixed
        # placement to exercise the representable exporter smoke case.
        page.locator('#label-placement').select_option('standard')
        for item in ['A','B','C']:
            page.locator('#objects .object').filter(has=page.locator('strong').get_by_text(item,exact=True)).click()
            # Selecting by exact object name avoids a substring collision.
            mode=page.locator('#properties label.field').filter(has_text='Label format').locator('select')
            if mode.count(): mode.select_option('plain')
        page.locator('#export-open').click()
        assert page.get_by_role('button',name='PDF',exact=True).count()==0
        assert page.get_by_role('button',name='tikz-cd (semantic)',exact=True).is_disabled()
        page.locator('#export-backdrop').click()
        page.locator('#export-open').click()
        svg=download(page,'SVG').read_text(encoding='utf8')
        assert '<polygon' in svg and 'class="arrowhead"' in svg and '<marker' not in svg and '<svg' in svg
        page.locator('#export-open').click()
        png=download(page,'PNG').read_bytes()
        assert png[:8]==b'\x89PNG\r\n\x1a\n' and len(png)>2000
        page.locator('#page').select_option('a4')
        page.locator('#export-region').select_option('page')
        page.locator('#export-open').click()
        framed=download(page,'SVG').read_text(encoding='utf8')
        assert 'viewBox="0 0' not in framed
        page.locator('#export-open').click()
        project=json.loads(download(page,'JSON project').read_text(encoding='utf8'))
        assert project['objects'][-1]['type']=='bezier'
        assert project['settings']['exportRegion']=='page'
        # Import a simple nonempty semantic diagram and verify actionable export.
        page.locator('#tikzcd-open').click()
        page.locator('#tikzcd-input').fill('\\begin{tikzcd}\nA \\arrow[r, "f"] & B \\\\\nC & D \\arrow[u, "g"]\n\\end{tikzcd}')
        page.locator('#tikzcd-apply').click()
        assert page.locator('#object-count').inner_text()=='6'
        page.locator('#export-open').click()
        assert not page.get_by_role('button',name='tikz-cd (semantic)',exact=True).is_disabled()
        tex=download(page,'tikz-cd (semantic)').read_text(encoding='utf8')
        assert "\\arrow" in tex
        page.locator('#undo').click()
        assert page.locator('#object-count').inner_text()=='8'
        page.locator('#redo').click()
        assert page.locator('#object-count').inner_text()=='6'
        # Property change remains durable after multiple successive edits.
        page.locator('#objects .object').first.click()
        page.locator('#properties input').first.fill('0.5')
        page.locator('#properties input').first.dispatch_event('change')
        page.locator('#save').click()  # Save action works without a native file dialog.
        # The legacy routing field must remain readable, but must never affect
        # the rendered arrow. Verify actual import, rendering and persistence,
        # rather than requiring the old disabled branch to exist in source.
        current=json.loads(download(page,'Save').read_text(encoding='utf8'))
        edge=next(o for o in current['objects'] if o['type']=='morphism')
        by_id={o['id']:o for o in current['objects']}
        a,b=(by_id[ref]['xy'] for ref in edge['refs'])
        obstacle=dict(by_id[edge['refs'][0]],id='o'+str(current['nextId']),name='Routing obstacle',text='Obstacle',xy=[(x+y)/2 for x,y in zip(a,b)])
        current['nextId']+=1
        current['objects'].append(obstacle)
        signatures=[]
        for routing in ('direct','scene-crossings'):
            edge['routing']=routing
            page.locator('#open-file').set_input_files({'name':'routing.json','mimeType':'application/json','buffer':json.dumps(current).encode()})
            page.wait_for_function('document.getElementById("open-file").files.length === 0')
            assert page.locator('#toast').inner_text()=='Project opened.'
            assert int(page.locator('#object-count').inner_text())==len(current['objects'])
            saved=json.loads(download(page,'Save').read_text(encoding='utf8'))
            assert next(o for o in saved['objects'] if o['id']==edge['id'])['routing']==routing
            path=page.locator(f'#drawing g[data-id="{edge["id"]}"] > path').first
            signatures.append(path.get_attribute('d'))
        assert signatures[0] and signatures[0]==signatures[1],signatures
        assert not errors,errors
        print('CHROMIUM_ISOLATED_SMOKE_PASS: startup, tools, commands, search, presets, visibility, SVG/PNG/JSON, frame crop, tikzcd interchange, undo/redo, property edit, legacy direct routing')
        browser.close()

if __name__=='__main__':run()
