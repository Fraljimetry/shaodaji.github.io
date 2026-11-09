#!/usr/bin/env python3
"""Actual Chromium DOM regression for manually added Structure + embedded PDF bookmarks.

Uses production selection/outline functions with mocked document destinations.
This is not an end-to-end PDF.js/native-PDF acceptance test.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
selection = (root / 'js/20-selection-annotations.js').read_text('utf8')
outline = (root / 'js/40-outline-structure.js').read_text('utf8')

def extract(src, start, end):
    begin = src.index(start)
    finish = src.index(end, begin + len(start))
    return src[begin:finish]

bootstrap = """
const root = document.documentElement;
const el = id => document.getElementById(id);
const t = (en,zh) => root.dataset.lang === 'zh' ? zh : en;
const MAX_INFERRED_OUTLINE_ENTRIES = 1200;
let inferredOutline=[], inferredOutlineDetectionDone=false, embeddedOutlineEdits=[],
    embeddedOutlineEntries=[
      {sourceKey:'1',title:'Section A',page:1,ratio:0.1,depth:0},
      {sourceKey:'2',title:'Section B',page:7,ratio:0.1,depth:0}
    ];
let pdfDoc={numPages:12}, currentSelection={page:4,ratio:0.2,text:'Selected ordinary prose'},
    pendingOutlineReselectKey=null,pendingEquationReselectKey=null,pendingEquationAddKey=null,
    outlineMode='embedded',tocOutlineTargets=null,saveCount=0,
    lastNavigation=null,history=[];
const outlineList = el('outline-list'),outlineCount = el('outline-count'),
      outlineEmpty = el('outline-empty'),outlineSource = el('outline-source');
function showError(msg){throw new Error(msg)}
function persistDocumentState(){saveCount++}
function rerenderReferenceLinksAfterStructureEdit(){}
function refreshSelectionUI(){}
function applyDocumentMapFilter(){}
function updateDocumentMapCurrentLocation(){}
function setDocumentMapSelectedNode(){}
async function goToMatchedLocation(page,ratio){lastNavigation={page,ratio}}
function pushUndo(type,label,payload){history.push({type,label,payload})}
function positionOutlineEditActions(){}
function normalizeText(value){return String(value || '').toLowerCase()}
"""
functions = '\n'.join([
    extract(selection,'function outlineEntryFromSelection(', '\nfunction equationLabelFromSelectionText('),
    extract(outline,'function updateOutlineSource(', '\nfunction normalizedHeadingText('),
    extract(outline,'function embeddedOutlineSourceKey(', "\ndocument.addEventListener('click'"),
    extract(selection,'function addOrReplaceSelectionStructureItem() {','\n\nfunction addSelectionToPageNote()'),
])
html = '''<!doctype html><html lang="en"><body>
<span id="outline-source"></span><span id="outline-count"></span>
<div id="outline-empty"></div><div id="outline-list"></div></body></html>'''
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page()
        page.set_content(html)
        page.add_script_tag(content=bootstrap + '\n' + functions)
        page.evaluate('renderEmbeddedOutline(embeddedOutlineEntries)')
        assert page.locator('.outline-item').all_text_contents() == ['Section A','Section B']
        page.evaluate('addOrReplaceSelectionStructureItem()')
        assert page.locator('.outline-item').all_text_contents() == ['Section A','Selected ordinary prose','Section B']
        assert page.locator('#outline-count').inner_text() == '3'
        assert 'manual additions' in page.locator('#outline-source').inner_text()
        manual = page.locator('.outline-edit-row').filter(has=page.locator('button.outline-item',has_text='Selected ordinary prose'))
        assert manual.count()==1
        manual.locator('.outline-edit-button',has_text='→').click()
        assert manual.get_attribute('data-depth') == '1'
        manual.locator('.outline-edit-button',has_text='Reselect').click()
        page.evaluate("currentSelection={page:5,ratio:0.3,text:'Replacement heading'};addOrReplaceSelectionStructureItem()")
        assert page.locator('.outline-item').all_text_contents()==['Section A','Replacement heading','Section B']
        assert page.locator('.outline-edit-row').nth(1).get_attribute('data-depth')=='1'
        page.locator('.outline-item',has_text='Replacement heading').click()
        assert page.evaluate('lastNavigation')=={'page':5,'ratio':0.3}
        page.evaluate("pendingOutlineReselectKey='embedded:1';currentSelection={page:2,ratio:0.3,text:'Altered embedded bookmark'};addOrReplaceSelectionStructureItem()")
        assert page.locator('.outline-item').all_text_contents()==['Altered embedded bookmark','Replacement heading','Section B']
        manual=page.locator('.outline-edit-row').filter(has=page.locator('button.outline-item',has_text='Replacement heading'))
        manual.locator('.outline-edit-button',has_text='Remove').click()
        assert page.locator('.outline-item').all_text_contents()==['Altered embedded bookmark','Section B']
        state=page.evaluate('({undo:history,edits:embeddedOutlineEdits,manual:inferredOutline,saved:saveCount})')
        assert state['saved'] >= 4
        assert len(state['edits']) == 1 and state['edits'][0]['action']=='reselect'
        assert len(state['undo'])==1 and state['undo'][0]['payload']['userEdited'] is True
        assert state['manual']==[]
        print('PASS: actual Chromium DOM manual Structure Add/Indent/Reselect/Navigation/Remove and embedded bookmark isolation')
    finally:
        browser.close()
