#!/usr/bin/env python3
"""v410 Chromium paint lifecycle test with production continuous-page functions.

Mock PDF.js page painting is controllable to reproduce first-render blankness,
legitimate blank pages, transient render rejection, and total failures. Browser
canvas, layout, observer, DOM replacement, and requestAnimationFrame are real.
This is NOT a deployed-site test with the actual PDF.js worker or original PDF.
"""
from pathlib import Path
import shutil
import os
from playwright.sync_api import sync_playwright

ROOT = Path(os.environ.get('MATHREADER_ROOT', Path(__file__).resolve().parents[1]))
SOURCE = (ROOT / 'js/30-rendering-navigation.js').read_text('utf-8')
BOOT = r'''
const primaryCanvasWrap = document.getElementById('wrap');
const continuousStack = document.getElementById('stack');
const primaryPageSurface = document.getElementById('surface');
const canvas = document.getElementById('primaryCanvas');
let pdfDoc = null;
let continuousGeneration = 0;
let continuousPageNodes = new Map();
let continuousObserver = null;
let continuousRebuilding = false;
let continuousSavedAnchor = null;
let continuousScrollTop = 0;
let continuousLayoutWidth = 0;
let continuousLayoutHeight = 0;
let initialContinuousReady = false;
let readingFlow = 'continuous';
let currentPage = 1;
let ocrMode = false;
let zoomMode = 'fit-width';
let zoomScale = 1;
let displayTransitionActive = false;
let restoringSession = false;
let testError = null;
let primaryFallbacks = 0;
let paintAttempts = 0;
let activeCanvasAttempts = 0;
let testScenario = 'first_blank_then_good';
const t = s => s;
const showError = s => {testError = s;};
const bindOcrLayer = () => {};
const renderAnnotationsForPage = () => {};
const updateNavigationState = () => {};
// Primary is deliberately an independent empty-canvas renderer in these tests:
// it mimics the scenario where PDF.js resolves but its first paint is blank.
async function mockedRenderPage(pageNum,targetCanvas) {
  primaryFallbacks++;
  targetCanvas.width = 480;
  targetCanvas.height = 640;
  targetCanvas.style.width = '480px';
  targetCanvas.style.height = '640px';
  const context = targetCanvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0,0,480,640);
  if (testScenario === 'continuous_reject_primary_ok') {
    context.fillStyle = '#111';
    context.fillRect(25,45,240,70);
  }
}
function setup(scenario) {
  testScenario = scenario;
  testError = null;
  primaryFallbacks = 0;
  paintAttempts = 0;
  activeCanvasAttempts = 0;
  initialContinuousReady = false;
  currentPage = 1;
  continuousGeneration = 0;
  continuousSavedAnchor = null;
  continuousPageNodes.clear();
  continuousObserver?.disconnect();
  continuousObserver = null;
  pdfDoc = {
    numPages: 3,
    async getPage(n) {
      return {
        getViewport({scale}) { return {width:480*scale,height:640*scale,scale}; },
        render({canvasContext,viewport}) {
          const active = n === 1;
          paintAttempts++;
          if (active) activeCanvasAttempts++;
          const attempt = activeCanvasAttempts;
          return {promise: (async () => {
            if (active && ((testScenario === 'always_reject' || testScenario === 'continuous_reject_primary_ok') ||
                (testScenario === 'initial_reject' && attempt < 3)))
              throw new Error('mock page render rejection');
            const c = canvasContext;
            c.fillStyle = '#fff';
            c.fillRect(0,0,viewport.width,viewport.height);
            if (active && testScenario === 'always_white') return;
            if (active && testScenario === 'first_blank_then_good' && attempt === 1) return;
            c.fillStyle = '#111';
            c.fillRect(25,45,240,70);
          })()};
        }
      };
    }
  };
}
'''
PROBE = r'''
renderPage = mockedRenderPage;
renderSelectableText = async () => {};
window.__renderProbe = {
  stale: async () => {
    setup('normal');
    await buildInitialContinuousDocument();
    const generation = continuousGeneration;
    const record = continuousPageNodes.get(1);
    const oldCanvas = record.canvas;
    const retry = repaintInitialContinuousPage(1, generation, record);
    continuousGeneration++; // simulate document/reflow invalidation before next frame
    const accepted = await retry;
    return {accepted, sameCanvas: record.canvas === oldCanvas, connected: oldCanvas.isConnected};
  },
  run: async scenario => {
    setup(scenario);
    await buildInitialContinuousDocument();
    return {
      ready: initialContinuousReady,
      error: testError,
      firstRendered: continuousPageNodes.get(1)?.rendered,
      firstCanvasConnected: continuousPageNodes.get(1)?.canvas?.isConnected,
      content: canvasHasVisibleContent(continuousPageNodes.get(1)?.canvas),
      tries: activeCanvasAttempts,
      fallback: primaryFallbacks,
      observed: Boolean(continuousObserver),
      zoomMode,
      currentPage,
      scrollTop: primaryCanvasWrap.scrollTop
    };
  }
};
'''

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    try:
        checks = 0
        for scenario in ('first_blank_then_good','always_white','initial_reject','continuous_reject_primary_ok','always_reject','normal'):
            page = browser.new_page(viewport={'width':1000,'height':720})
            page.set_content('''<!doctype html><html><head><style>
                body{margin:0} #wrap{height:480px;width:650px;overflow:auto;position:relative}
                #stack{display:flex;flex-direction:column;gap:12px}
                .continuous-page-frame{display:flex;flex-direction:column;align-items:center;flex:none}
                .page-surface{position:relative} .page-surface canvas{display:block}
                #surface,#primaryCanvas{position:absolute;left:-9999px}
            </style></head><body><div id="wrap"><div id="stack"></div></div>
            <div id="surface"><canvas id="primaryCanvas"></canvas></div></body></html>''')
            page.add_script_tag(content=BOOT + '\n' + SOURCE + '\n' + PROBE)
            result = page.evaluate('(scenario) => window.__renderProbe.run(scenario)',scenario)
            if scenario == 'always_reject':
                assert result['ready'] is False and result['error'] is not None, (scenario,result)
                assert result['observed'] is False, (scenario,result)
                checks += 2
            else:
                assert result['ready'] is True and result['error'] is None, (scenario,result)
                assert result['firstRendered'] and result['firstCanvasConnected'] and result['observed'], (scenario,result)
                assert result['currentPage'] == 1 and result['zoomMode'] == 'fit-width', (scenario,result)
                checks += 3
            if scenario == 'first_blank_then_good':
                assert result['content'] and result['tries'] == 2, result
                assert result['fallback'] == 1, result
                checks += 2
            if scenario == 'always_white':
                assert not result['content'] and result['tries'] == 2, result
                assert result['fallback'] == 1, result
                checks += 2
            if scenario == 'initial_reject':
                assert result['content'] and result['tries'] == 3, result
                checks += 1
            if scenario == 'continuous_reject_primary_ok':
                assert result['content'] and result['tries'] == 4 and result['fallback'] == 1, result
                checks += 1
            if scenario == 'normal':
                assert result['tries'] == 1 and result['fallback'] == 0, result
                checks += 1
            print(f'{scenario}: {result}')
            page.close()
        page = browser.new_page(viewport={'width':1000,'height':720})
        page.set_content('<div id="wrap"><div id="stack"></div></div><div id="surface"><canvas id="primaryCanvas"></canvas></div>')
        page.add_script_tag(content=BOOT + '\n' + SOURCE + '\n' + PROBE)
        stale = page.evaluate('window.__renderProbe.stale()')
        assert stale == {'accepted': False, 'sameCanvas': True, 'connected': True}, stale
        checks += 1
        print(f'stale-generation: {stale}')
        page.close()
    finally:
        browser.close()
print(f'PASS | v410 initial continuous paint lifecycle | {checks} Chromium assertions')
