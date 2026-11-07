#!/usr/bin/env python3
"""v407 isolated Chromium real-pointer lifecycle for PDF cross-reference previews.

Executes the actual production attach/hide functions, with only reference lookup
and PDF snapshot resolution mocked. Does NOT validate PDF.js or OCR accuracy.
"""
from pathlib import Path
import re
import shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / 'js/70-command-ui-runtime.js').read_text('utf-8')


def function(name):
    match = re.search(rf'^function {name}\([^\n]*\) \{{[\s\S]*?^\}}', SOURCE, re.M)
    assert match, f'missing production {name}'
    return match.group()


functions = '\n'.join(function(name) for name in (
    'hideReferencePreview',
    'dismissReferencePreviewIfPointerOutside',
    'ensureReferencePreviewDismissal',
    'attachReferencePreview',
))

# The two functions are production functions. The Promise-based data source is
# deliberately controllable so we can expose a delayed result AFTER pointerleave.
probe = '''
let referencePreviewTimer = null;
let referencePreviewSerial = 0;
let referencePreviewActiveLink = null;
let referencePreviewDismissalInstalled = false;
const referencePreview = document.getElementById('reference-preview');
const pending = [];
const t = en => en;
function referencePreviewData(query) {
  return new Promise(resolve => pending.push({query, resolve}));
}
''' + functions + '''
window.__previewProbe = {
  attach: () => {
    attachReferencePreview(document.getElementById('a'), '(A.1)', 4);
    attachReferencePreview(document.getElementById('b'), 'Theorem 2.1', 5);
  },
  pending: () => pending.length,
  resolve: i => pending[i].resolve({target:{page:i + 5}, snapshot:{url:null}}),
  visible: () => !referencePreview.classList.contains('is-hidden'),
  owner: () => typeof referencePreviewActiveLink === 'undefined' ? null : referencePreviewActiveLink?.id || null,
};
'''

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 900, 'height': 650})
        page.set_content('''<!doctype html><html><head><style>
            html,body{margin:0;height:1800px;background:white}
            button{position:fixed;top:75px;height:32px;width:125px;cursor:pointer}
            #a{left:60px} #b{left:280px}
            .reference-preview{position:fixed;width:420px;left:50px;top:120px;
                height:140px;pointer-events:none;background:#fefefe;border:1px solid #888}
            .is-hidden{display:none}
        </style></head><body>
        <button id="a">(A.1)</button><button id="b">Theorem 2.1</button>
        <div id="reference-preview" class="reference-preview is-hidden"></div>
        </body></html>''')
        page.add_script_tag(content=probe)
        page.evaluate('window.__previewProbe.attach()')
        checks = []
        def check(label, condition):
            assert condition, label
            checks.append(label)
        def hover_a():
            page.mouse.move(80, 90)
            page.wait_for_function('window.__previewProbe.pending() >= 1')
        def away():
            page.mouse.move(800, 550)

        # Deferred PDF snapshot must NEVER reopen the preview after pointerleave.
        hover_a()
        check('pending lookup launched', page.evaluate('window.__previewProbe.pending()') == 1)
        away()
        check('hidden synchronously on leave', not page.evaluate('window.__previewProbe.visible()'))
        page.evaluate('window.__previewProbe.resolve(0)')
        page.wait_for_timeout(60)
        check('late Promise cannot reopen after leave', not page.evaluate('window.__previewProbe.visible()'))

        # A second hover may display; leave must hide immediately even with a focused button.
        page.mouse.move(80, 90)
        page.wait_for_function('window.__previewProbe.pending() >= 2')
        page.evaluate('window.__previewProbe.resolve(1)')
        page.wait_for_function('window.__previewProbe.visible()')
        check('active hover shows preview', page.evaluate('window.__previewProbe.visible()'))
        away()
        check('visible preview hides on leave', not page.evaluate('window.__previewProbe.visible()'))

        # Switching quickly must not resurrect a stale preview from the old link.
        page.mouse.move(80, 90)
        page.wait_for_function('window.__previewProbe.pending() >= 3')
        page.mouse.move(300, 90)
        page.wait_for_function('window.__previewProbe.pending() >= 4')
        page.evaluate('window.__previewProbe.resolve(2)')
        page.wait_for_timeout(30)
        check('old link cannot override second hover', not page.evaluate('window.__previewProbe.visible()'))
        page.evaluate('window.__previewProbe.resolve(3)')
        page.wait_for_function('window.__previewProbe.visible()')
        check('new hover shows its own preview', page.evaluate('window.__previewProbe.visible()'))
        away()
        check('leaving new hover hides', not page.evaluate('window.__previewProbe.visible()'))

        # Detached links do not retain a floating card on the next move.
        page.mouse.move(80, 90)
        page.wait_for_function('window.__previewProbe.pending() >= 5')
        page.evaluate('window.__previewProbe.resolve(4)')
        page.wait_for_function('window.__previewProbe.visible()')
        page.evaluate("document.getElementById('a').remove()")
        away()
        check('detached link cannot strand visible popup', not page.evaluate('window.__previewProbe.visible()'))

        # Keyboard focus remains supported, with blur dismissal.
        page.evaluate("document.getElementById('b').focus()")
        page.wait_for_function('window.__previewProbe.pending() >= 6')
        page.evaluate('window.__previewProbe.resolve(5)')
        page.wait_for_function('window.__previewProbe.visible()')
        check('keyboard focus reveals preview', page.evaluate('window.__previewProbe.visible()'))
        page.evaluate("document.getElementById('b').blur()")
        check('keyboard blur immediately dismisses', not page.evaluate('window.__previewProbe.visible()'))

        # Scrolling dismisses both a visible card and a pending delayed lookup.
        page.evaluate("document.getElementById('b').focus()")
        page.wait_for_function('window.__previewProbe.pending() >= 7')
        page.evaluate('window.__previewProbe.resolve(6)')
        page.wait_for_function('window.__previewProbe.visible()')
        page.evaluate('window.dispatchEvent(new Event("scroll"))')
        # The browser scrolls the real document; dispatch on document here to
        # cover the DOM scroll event in its capture phase as well.
        page.evaluate('document.dispatchEvent(new Event("scroll"))')
        check('scroll closes open preview', not page.evaluate('window.__previewProbe.visible()'))
        page.evaluate("document.getElementById('b').blur()")

        # Clicking away without pointer motion is also a direct dismissal path.
        page.evaluate("document.getElementById('b').focus()")
        page.wait_for_function('window.__previewProbe.pending() >= 8')
        page.evaluate('window.__previewProbe.resolve(7)')
        page.wait_for_function('window.__previewProbe.visible()')
        page.evaluate('document.body.dispatchEvent(new PointerEvent("pointerdown", {bubbles:true}))')
        check('outside pointerdown closes preview', not page.evaluate('window.__previewProbe.visible()'))
        page.evaluate("document.getElementById('b').blur()")

        print(f'PASS: {len(checks)} production hover-preview lifecycle checks in Chromium (mock PDF lookup)')
    finally:
        browser.close()
