// MathReader v306 · Command palette, event bindings, sidebars, shortcuts, and startup.
function normalizeEquationLatexForSearch(value) {
  return String(value || '')
    .replace(/\\left|\\right/g, '')
    .replace(/\\,/g, '')
    .replace(/\\!/g, '')
    .replace(/\\;/g, '')
    .replace(/\\:/g, '')
    .replace(/\s+/g, '')
    .replace(/[{}]/g, '')
    .toLocaleLowerCase();
}

function equationSearchEntries() {
  const items = [];
  const seen = new Set();
  const add = (latex, page, source, created = 0, ratio = null) => {
    const clean = String(latex || '').trim();
    if (!clean) return;
    const key = `${Number(page)||0}:${normalizeEquationLatexForSearch(clean)}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ latex: clean, page: Number(page) || 1, ratio: Number.isFinite(Number(ratio)) ? Math.min(1, Math.max(0, Number(ratio))) : null, source, created: Number(created)||0 });
  };
  for (const item of ocrHistory || []) add(item?.latex, item?.page, t('OCR history','OCR 历史'), item?.created, item?.ratio);
  for (const item of bookmarks || []) if (item?.type === 'equation') add(item?.latex, item?.page, t('Bookmarked equation','已加书签公式'), item?.created, item?.ratio);
  if (currentOcrResult?.latex) add(currentOcrResult.latex, currentOcrResult.page, t('Current extraction','当前提取'), currentOcrResult.created, currentOcrResult.ratio);
  return items.sort((a,b) => a.page - b.page || a.created - b.created);
}

function equationSearchMatches(query) {
  const wanted = normalizeEquationLatexForSearch(query);
  if (!wanted) return [];
  return equationSearchEntries().map((item) => {
    const hay = normalizeEquationLatexForSearch(item.latex);
    const idx = hay.indexOf(wanted);
    let score = idx >= 0 ? 1 : 0;
    if (!score && searchFuzzy?.checked) {
      const compactNeedle = wanted.slice(0, 80);
      const tokenHits = compactNeedle.split(/(?=[\\=+\-])/).filter(Boolean).filter((token) => hay.includes(token)).length;
      const tokenCount = Math.max(1, compactNeedle.split(/(?=[\\=+\-])/).filter(Boolean).length);
      score = tokenHits / tokenCount;
    }
    return { ...item, score };
  }).filter((item) => item.score >= (searchFuzzy?.checked ? .55 : 1)).sort((a,b) => b.score - a.score || a.page - b.page);
}

function commandPaletteEntities() {
  if (!pdfDoc) return [];
  const out = [];
  const push = (kind, title, subtitle, run, searchText = '', kindKey='entity') => out.push({ kind, kindKey, title, subtitle, run, searchText: `${title} ${subtitle||''} ${searchText||''}` });
  for (const entry of inferredOutline || []) push(t('Section','章节'), entry.title || t('Untitled section','未命名章节'), t(`Page ${entry.page}`,`第 ${entry.page} 页`), () => goToMatchedLocation(entry.page, Number(entry.ratio)||0, entry.title || ''), entry.title,'section');
  for (const entry of structureEntries || []) {
    const relations=[...(entry.proofUses||[]),...(entry.usedByProofs||[]),...(entry.corollaries||[]),...(entry.derivedFrom||[])].map((x)=>x.label).join(' ');
    push(t('Structure','结构'), entry.label || entry.title, entry.title || t(`Page ${entry.page}`,`第 ${entry.page} 页`), () => goToMatchedLocation(entry.page, Number(entry.ratio)||0, entry.label || entry.title), `${entry.title||''} ${relations}`,'structure');
    if (entry.proofPage) push(t('Proof','证明'), t(`Proof of ${entry.label}`,`${entry.label} 的证明`), t(`Page ${entry.proofPage}`,`第 ${entry.proofPage} 页`), ()=>goToMatchedLocation(entry.proofPage,Number(entry.proofRatio)||0,entry.proofTitle||'Proof'), `${entry.label} ${(entry.proofUses||[]).map((x)=>x.label).join(' ')}`,'proof');
  }
  if (equationLabelIndex instanceof Map) {
    for (const [label, candidates] of equationLabelIndex.entries()) {
      const target = (candidates || []).slice().sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0];
      if (target) push(t('Equation','公式'), label, t(`Page ${target.page}`,`第 ${target.page} 页`), () => goToMatchedLocation(target.page, Number(target.ratio)||0, label), label,'equation');
    }
  }
  for (const entry of bibliographyEntries || []) push(t('Reference','文献'), entry.label, entry.title || '', () => goToMatchedLocation(entry.page, Number(entry.ratio)||0, entry.label), `${entry.title} ${bibliographyCitationSummary(entry)}`,'reference');
  for (const item of symbolGlossary || []) push(t('Symbol','符号'), item.symbol, item.meaning || '', () => runFindAllOccurrences(item.symbol), item.meaning,'symbol');
  for (const item of bookmarks || []) push(t('Bookmark','书签'), item.title || (item.type==='equation'?t('Bookmarked equation','已加书签公式'):t(`Page ${item.page}`,`第 ${item.page} 页`)), item.note || t(`Page ${item.page}`,`第 ${item.page} 页`), () => item.type === 'equation' ? goToEquationBookmark(item) : goToLocation(item.page, 0, { contextLead: false }), `${item.note||''} ${item.latex||''}`,'bookmark');
  for (const item of annotations || []) push(t('Annotation','批注'), item.text || (item.type==='highlight'?t('Highlight','高亮'):t('Margin note','页边注')), item.note || t(`Page ${item.page}`,`第 ${item.page} 页`), () => goToMatchedLocation(item.page, Number(item.ratio)||0, item.text || ''), item.note,'annotation');
  return out;
}

function commandRecentUseMap() {
  try { const value=JSON.parse(safeGet(COMMAND_RECENT_KEY,'{}')); return value&&typeof value==='object'?value:{}; } catch (_) { return {}; }
}
function commandPaletteUseKey(item) { return `${item.kindKey||'command'}:${normalizeSearchValue(item.title||'',false)}`; }
function recordCommandPaletteUse(item) { const map=commandRecentUseMap(); map[commandPaletteUseKey(item)]=Date.now(); const sorted=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,80); safeSet(COMMAND_RECENT_KEY,JSON.stringify(Object.fromEntries(sorted))); }
function commandPaletteMatchScore(item,qRaw) {
  const q=normalizeSearchValue(qRaw,false); if(!q) return item.isCommand?100:0;
  const title=normalizeSearchValue(item.title||'',false); const search=normalizeSearchValue(item.searchText||`${item.title||''} ${item.subtitle||''}`,false);
  let match=0;
  if(title===q) match=1000; else if(title.startsWith(q)) match=820; else if(title.includes(q)) match=680; else if(search.includes(q)) match=560; else {
    const tokens=q.split(/\s+/).filter(Boolean); const hits=tokens.filter((token)=>search.includes(token)).length; if(tokens.length&&hits===tokens.length) match=360+hits*8; else if(tokens.length&&hits/tokens.length>=.65) match=220+Math.round(80*hits/tokens.length);
  }
  if(!match) return 0;
  const entityPriority={equation:90,structure:85,proof:82,reference:80,section:75,symbol:55,bookmark:50,annotation:48,session:45,entity:40};
  const typeBoost=item.isCommand?10:(entityPriority[item.kindKey]||40);
  const recent=commandRecentUseMap()[commandPaletteUseKey(item)]||0; const age=Date.now()-recent; const recentBoost=recent?Math.max(0,30-Math.floor(age/(1000*60*60*24))):0;
  return match+typeBoost+recentBoost;
}

function hideReferencePreview() {
  clearTimeout(referencePreviewTimer);
  if (referencePreview) referencePreview.classList.add('is-hidden');
}

function snapshotKindForQuery(query) {
  const q=String(query||'').trim();
  if (isEquationLabelQuery(q)) return 'equation';
  if (/^\[[^\]\n]+\]$/.test(q) && bibliographyEntries.some((entry) => normalizedBibliographyKey(entry.number) === normalizedBibliographyKey(q))) return 'bibliography';
  if (/^(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis|Section)\b/i.test(q)) return 'structure';
  return 'generic';
}

async function referenceRenderedPage(pageNumber) {
  if (!pdfDoc || !pageNumber) return null;
  const key=`${currentFileKey||'pdf'}:${pageNumber}`;
  if (referencePageRenderCache.has(key)) return referencePageRenderCache.get(key);
  const promise=(async()=>{
    const page=await pdfDoc.getPage(pageNumber);
    const base=page.getViewport({scale:1});
    const renderWidth=760; const scale=renderWidth/Math.max(1,base.width); const viewport=page.getViewport({scale});
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(viewport.width)); canvas.height=Math.max(1,Math.round(viewport.height));
    const ctx=canvas.getContext('2d',{alpha:false}); await page.render({canvasContext:ctx,viewport,background:'#ffffff'}).promise;
    return canvas;
  })();
  referencePageRenderCache.set(key,promise);
  if (referencePageRenderCache.size>6) referencePageRenderCache.delete(referencePageRenderCache.keys().next().value);
  try { return await promise; } catch (error) { referencePageRenderCache.delete(key); throw error; }
}

async function referenceSnapshotData(target, kind='generic') {
  if (!pdfDoc || !target?.page) return null;
  const ratio = Math.max(0, Math.min(1, Number(target.ratio) || 0));
  const normalizedKind=['equation','bibliography','structure'].includes(kind)?kind:'generic';
  const key = `${currentFileKey || 'pdf'}:${target.page}:${Math.round(ratio * 180)}:${normalizedKind}`;
  if (referenceSnapshotCache.has(key)) return referenceSnapshotCache.get(key);
  const full=await referenceRenderedPage(target.page); if (!full) return null;
  const config={equation:{height:150,lead:.50},structure:{height:310,lead:.28},bibliography:{height:210,lead:.34},generic:{height:240,lead:.40}}[normalizedKind];
  const cropHeight=Math.min(full.height,config.height); const targetY=Math.round(ratio*full.height);
  const cropY=Math.max(0,Math.min(full.height-cropHeight,Math.round(targetY-cropHeight*config.lead)));
  const crop=document.createElement('canvas'); crop.width=full.width; crop.height=cropHeight;
  crop.getContext('2d',{alpha:false}).drawImage(full,0,cropY,full.width,cropHeight,0,0,full.width,cropHeight);
  const data={url:crop.toDataURL('image/jpeg',.9),targetOffset:Math.max(0,Math.min(1,(targetY-cropY)/Math.max(1,cropHeight))),kind:normalizedKind};
  referenceSnapshotCache.set(key,data); if(referenceSnapshotCache.size>32) referenceSnapshotCache.delete(referenceSnapshotCache.keys().next().value);
  return data;
}

async function referencePreviewData(query, originPage, originRatio) {
  const target = await resolveReferenceTarget(query, originPage, originRatio);
  if (!target) return null;
  const kind=snapshotKindForQuery(query);
  const snapshot = await referenceSnapshotData(target,kind);
  return { target, snapshot, kind };
}

function attachReferencePreview(link, query, originPage, originRatio = null) {
  if (!link || !referencePreview) return;
  const show = () => {
    clearTimeout(referencePreviewTimer);
    const serial = ++referencePreviewSerial;
    referencePreviewTimer = setTimeout(async () => {
      try {
        const data = await referencePreviewData(query, originPage, originRatio);
        if (!data || serial !== referencePreviewSerial || !link.isConnected) return;
        referencePreview.replaceChildren();
        const header = document.createElement('div'); header.className='reference-preview-header';
        const strong = document.createElement('strong'); strong.textContent = query;
        const meta = document.createElement('div'); meta.className='reference-preview-meta'; meta.textContent=t(`Page ${data.target.page}`,`第 ${data.target.page} 页`);
        header.append(strong, meta); referencePreview.append(header);
        if (data.snapshot?.url) {
          const wrap = document.createElement('div'); wrap.className='reference-preview-image-wrap';
          const image = document.createElement('img'); image.className='reference-preview-image'; image.alt=t(`Preview of ${query}`,`${query} 的预览`); image.src=data.snapshot.url;
          const marker = document.createElement('span'); marker.className='reference-preview-target'; marker.style.top=`${Math.round((data.snapshot.targetOffset || .42) * 100)}%`;
          wrap.append(image, marker); referencePreview.append(wrap);
        } else {
          const fallback = document.createElement('span'); fallback.className='reference-preview-fallback'; fallback.textContent=t('Visual preview unavailable.','无法显示可视预览。'); referencePreview.append(fallback);
        }
        const r = link.getBoundingClientRect();
        const width = Math.min(480, window.innerWidth - 16);
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, r.left));
        referencePreview.style.left=`${left}px`;
        referencePreview.classList.remove('is-hidden');
        const cardHeight = Math.min(referencePreview.getBoundingClientRect().height || 260, window.innerHeight - 16);
        let top = r.bottom + 8;
        if (top + cardHeight > window.innerHeight - 8) top = Math.max(8, r.top - cardHeight - 8);
        referencePreview.style.top=`${top}px`;
      } catch (_) {}
    }, 260);
  };
  link.addEventListener('pointerenter', show);
  link.addEventListener('focus', show);
  link.addEventListener('pointerleave', hideReferencePreview);
  link.addEventListener('blur', hideReferencePreview);
}

function commandActions() {
  return [
    { isCommand:true, kind:t('Command','命令'), label: t('Open PDF', '打开 PDF'), run: () => fileInput.click() },
    { isCommand:true, kind:t('Command','命令'), label: t('Search this PDF', '搜索此 PDF'), run: () => openLeftPanelShortcut('search-panel', searchInput) },
    { isCommand:true, kind:t('Command','命令'), label: t('Document contents', '文档目录'), run: () => openLeftPanelShortcut('outline-panel') },
    { isCommand:true, kind:t('Command','命令'), label: t('Go to selected reference', '跳转到所选引用'), needsPdf: true, run: () => goToSelectedReference() },
    { isCommand:true, kind:t('Command','命令'), label: t('Rebuild mathematical structure index', '重新生成数学结构索引'), needsPdf: true, run: () => buildStructureIndex({ force: true }) },
    { isCommand:true, kind:t('Command','命令'), label: t('Bibliography', '参考文献'), needsPdf: true, run: () => { openLeftPanelShortcut('outline-panel'); bibliographyIndex?.scrollIntoView({ block: 'nearest' }); } },
    { isCommand:true, kind:t('Command','命令'), label: t('Bookmark current page', '收藏当前页'), needsPdf: true, run: () => addCurrentBookmark() },
    { isCommand:true, kind:t('Command','命令'), label: t('Page note', '页注'), needsPdf: true, run: () => openRightSectionShortcut('note-section', pageNote) },
    { isCommand:true, kind:t('Command','命令'), label: t('Extract formula', '提取公式'), needsPdf: true, run: () => setOcrMode(true) },
    { isCommand:true, kind:t('Command','命令'), label: t('Export reading data', '导出阅读数据'), needsPdf: true, run: () => exportReadingData() },
    { isCommand:true, kind:t('Command','命令'), label: t('Back in reading trail', '返回阅读轨迹上一位置'), needsPdf: true, run: () => goBackReadingLocation() }
  ].filter((item) => !item.needsPdf || pdfDoc);
}

let commandPaletteSelectionIndex = -1;

function commandPaletteButtons() {
  return commandList ? Array.from(commandList.querySelectorAll('.command-item')) : [];
}

function setCommandPaletteSelection(index) {
  const buttons = commandPaletteButtons();
  for (const button of buttons) button.classList.remove('is-current');
  if (!buttons.length || index < 0) {
    commandPaletteSelectionIndex = -1;
    return;
  }
  commandPaletteSelectionIndex = ((index % buttons.length) + buttons.length) % buttons.length;
  buttons[commandPaletteSelectionIndex].classList.add('is-current');
}

function renderCommandPalette() {
  if (!commandList) return;
  const qRaw = String(commandInput?.value || '').trim();
  commandList.replaceChildren();
  const items = [];
  for (const action of commandActions()) items.push({ isCommand:true, kind:action.kind, kindKey:'command', title:action.label, subtitle:'', run:action.run, searchText:action.label });
  if (qRaw) items.push(...commandPaletteEntities());
  const filtered = items.map((item)=>({item,score:commandPaletteMatchScore(item,qRaw)})).filter((row)=>row.score>0).sort((a,b)=>b.score-a.score || String(a.item.title).localeCompare(String(b.item.title))).slice(0,80).map((row)=>row.item);
  commandPaletteSelectionIndex = qRaw && filtered.length ? 0 : -1;
  for (const [index, item] of filtered.entries()) {
    const button=document.createElement('button'); button.type='button'; button.className='command-item'; if(index===commandPaletteSelectionIndex) button.classList.add('is-current');
    const main=document.createElement('span'); main.className='command-main';
    const title=document.createElement('span'); title.className='command-title'; title.textContent=item.title; main.append(title);
    if(item.subtitle){ const sub=document.createElement('span'); sub.className='command-subtitle'; sub.textContent=item.subtitle; main.append(sub); }
    if (item.isCommand) { button.classList.add('is-command-action'); button.append(main); }
    else { const kind=document.createElement('span'); kind.className='command-kind'; kind.textContent=item.kind || ''; button.append(kind,main); }
    button.addEventListener('click',()=>{ recordCommandPaletteUse(item); closeCommandPalette(); item.run(); }); commandList.append(button);
  }
  if (!filtered.length) { const empty=document.createElement('div'); empty.className='command-hint'; empty.textContent=t('No matching commands or document items.','没有匹配的命令或文档项目。'); commandList.append(empty); }
}

function openCommandPalette() {
  if (!commandPalette) return;
  commandPaletteSelectionIndex = -1;
  commandPalette.classList.remove('is-hidden'); commandInput.value = ''; renderCommandPalette(); setTimeout(() => commandInput.focus(), 0);
  if (pdfDoc && !equationLabelIndex) {
    buildEquationLabelIndex().then(() => { if (!commandPalette.classList.contains('is-hidden') && commandInput.value.trim()) renderCommandPalette(); }).catch(() => {});
  }
}
function closeCommandPalette() {
  const active = document.activeElement;
  commandPalette?.classList.add('is-hidden');
  commandPaletteSelectionIndex = -1;
  if (active && commandPalette?.contains(active) && typeof active.blur === 'function') active.blur();
}

formulaExtractionSelect?.addEventListener('change', () => {
  formulaExtractionMode = formulaExtractionSelect.value === 'vector' ? 'vector' : 'image';
  safeSet('mathreader-formula-method-v1', formulaExtractionMode);
  updateOcrCapability();
  setOcrStatus(formulaExtractionMode === 'image'
    ? t('Image OCR is now the default formula extractor.', '现在默认使用图像 OCR 提取公式。')
    : t('PDF vector is now the default formula extractor.', '现在默认使用 PDF 矢量提取公式。'));
});
ocrEngineSelect?.addEventListener('change', async () => { mathOcrEngineMode = normalizedOcrEngineMode(ocrEngineSelect.value); safeSet('mathreader-ocr-engine-v8', mathOcrEngineMode); setOcrMode(false); await disposeMathOcrPipeline(); updateOcrInteractionAvailability(); setOcrStatus(t('Image OCR engine preference changed. Preloading the selected engine…', '图像 OCR 引擎偏好已更改。正在预加载所选引擎……'), true); scheduleMathOcrPreload(); });
ocrRetryButton?.addEventListener('click', async () => { setOcrMode(false); await disposeMathOcrPipeline(); updateOcrInteractionAvailability(); setOcrStatus(t('OCR engine reset. Preloading a fresh engine…', '公式 OCR 引擎已重置。正在预加载新的引擎……'), true); scheduleMathOcrPreload(); });
mathOcrButton?.addEventListener('click', () => setOcrMode(!ocrMode));
contentsRunDocumentOcr?.addEventListener('click', () => { enableDocumentOcrFromReader().catch((error) => { console.warn('Document OCR could not be started from Contents.', error); }); });
pinPageButton?.addEventListener('click', () => setPinnedPage(currentPage));
pinFromSidebar.addEventListener('click', () => setPinnedPage(currentPage));
unpinPage.addEventListener('click', clearPinnedPage);
referencePrev.addEventListener('click', () => { if (pinnedPage && pinnedPage > 1) setPinnedPage(pinnedPage - 1); });
referenceNext.addEventListener('click', () => { if (pinnedPage && pdfDoc && pinnedPage < pdfDoc.numPages) setPinnedPage(pinnedPage + 1); });
addBookmark.addEventListener('click', addCurrentBookmark);
readingBackButton?.addEventListener('click', goBackReadingLocation);
readingTrailClear?.addEventListener('click', () => { if (readingBackStack.length) pushUndo('reading-trail', t('Reading trail', '阅读轨迹'), readingBackStack); readingBackStack = []; readingTrailExpanded = false; updateReadingBackButton(); renderReadingTrail(); persistDocumentState(); });
readingTrailToggle?.addEventListener('click', () => { readingTrailExpanded = !readingTrailExpanded; renderReadingTrail(); });
buildStructureIndexButton?.remove();
exportReadingDataButton?.addEventListener('click', exportReadingData);
importReadingDataButton?.addEventListener('click', () => importReadingInput?.click());
importReadingInput?.addEventListener('change', async () => { const file = importReadingInput.files?.[0]; importReadingInput.value = ''; if (file) await importReadingDataFile(file); });
saveOcrEquation?.addEventListener('click', saveCurrentOcrAsEquation);
commandInput?.addEventListener('input', renderCommandPalette);
commandInput?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const buttons = commandPaletteButtons();
    if (buttons.length) {
      event.preventDefault();
      const next = commandPaletteSelectionIndex < 0
        ? (event.key === 'ArrowDown' ? 0 : buttons.length - 1)
        : commandPaletteSelectionIndex + (event.key === 'ArrowDown' ? 1 : -1);
      setCommandPaletteSelection(next);
    }
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    const selected = commandPaletteSelectionIndex >= 0 ? commandPaletteButtons()[commandPaletteSelectionIndex] : null;
    selected?.click();
    return;
  }
  if (event.key === 'Escape') { event.preventDefault(); closeCommandPalette(); }
});
commandPalette?.addEventListener('pointerdown', (event) => { if (event.target === commandPalette) closeCommandPalette(); });
renderSymbolGlossary();
searchForm.addEventListener('submit', (event) => { event.preventDefault(); persistDocumentState(); searchPdf(searchInput.value); });
searchFuzzy?.addEventListener('change', () => { persistSearchPreferences(); persistDocumentState(); if (searchInput.value.trim()) searchPdf(searchInput.value); });
searchEquations?.addEventListener('change', () => { persistSearchPreferences(); if (searchInput.value.trim()) searchPdf(searchInput.value); });
glossaryAddButton?.addEventListener('click', () => addGlossaryEntry());
glossaryMeaningInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addGlossaryEntry(); } });
undoClear?.addEventListener('click', () => { undoHistory = []; renderUndoHistory(); persistDocumentState(); });
searchInput.addEventListener('input', () => { if (pdfDoc) persistDocumentState(); });
[searchMatchCase, searchWholeWord].forEach((node) => node?.addEventListener('change', () => { persistSearchPreferences(); if (pdfDoc && searchInput.value.trim()) searchPdf(searchInput.value); }));

pageNote.addEventListener('input', () => {
  if (!pdfDoc) return;
  notes[String(currentPage)] = pageNote.value;
  scheduleNotePreview();
  noteSaveState.textContent = t('Saving…', '正在保存……');
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    persistDocumentState();
    noteSaveState.textContent = t('Saved locally', '已保存到本地');
  }, 250);
});


copyOcrLatex.addEventListener('click', () => copyPlainText(ocrLatexPreview?.value || currentOcrResult?.latex, copyOcrLatex));
ocrFormatMode?.addEventListener('change', () => {
  const mode = ocrFormatMode.value;
  if (!mode) return;
  applyOcrFormat(mode);
  ocrFormatMode.value = '';
});
ocrFormatUndo?.addEventListener('click', undoOcrFormat);
ocrLatexPreview?.addEventListener('input', () => {
  if (!currentOcrResult) return;
  ensureCurrentOcrFormatState();
  syncCurrentOcrLatexValue(ocrLatexPreview.value);
});
ocrToNote.addEventListener('click', addOcrToPageNote);
ocrSourceSwitchButton?.addEventListener('click', async () => {
  if (!currentOcrResult) return;
  if (ocrSourceSwitchButton.dataset.targetSource === 'image') {
    await tryImageOcrForCurrentResult();
    return;
  }
  if (ocrSourceSwitchButton.dataset.targetSource !== 'vector') return;
  if (!currentOcrResult.vectorAlternative) {
    setOcrStatus(t('No usable PDF vector reconstruction was found for this selection.', '此选区未找到可用的 PDF 矢量重建结果。'));
    return;
  }
  const item = {
    page: currentOcrResult.page,
    kind: currentOcrResult.kind,
    latex: stabilizeOcrLatexSyntax(repairOcrLatex(currentOcrResult.vectorAlternative)),
    preview: currentOcrResult.preview,
    created: Date.now(),
    quality: 'vector-comparison',
    source: 'vector',
    extractedText: currentOcrResult.vectorAlternativeText || null,
    vectorAlternative: currentOcrResult.vectorAlternative,
    vectorAlternativeText: currentOcrResult.vectorAlternativeText || null
  };
  commitFormulaResult(item, t('PDF vector comparison loaded.', '已载入 PDF 矢量对照结果。'));
});
clearOcrResultButton.addEventListener('click', clearOcrResultState);
bindOcrLayer(primaryOcrLayer);
bindOcrLayer(referenceOcrLayer);

[selectionToolbar, floatingCopyText, floatingCopyLatex, floatingFindAll, floatingHighlight, floatingMarginNote, floatingAddNote, floatingStructure, floatingGlossary].forEach((node) => node?.addEventListener('pointerdown', (event) => event.preventDefault()));
floatingCopyText.addEventListener('click', () => copyPlainText(currentSelection?.text, floatingCopyText));
floatingCopyLatex.addEventListener('click', () => copyPlainText(currentSelection?.latex, floatingCopyLatex));
floatingFindAll?.addEventListener('click', () => { runFindAllOccurrences(currentSelection?.text); hideSelectionToolbar(); });
floatingAddNote.addEventListener('click', () => { addSelectionToPageNote(); hideSelectionToolbar(); });
floatingHighlight?.addEventListener('click', () => { addSelectionAnnotation('highlight'); hideSelectionToolbar(); });
floatingMarginNote?.addEventListener('click', () => { addSelectionAnnotation('margin'); hideSelectionToolbar(); });
floatingStructure?.addEventListener('click', () => { addOrReplaceSelectionStructureItem(); hideSelectionToolbar(); });
floatingGlossary?.addEventListener('click', () => { addSelectionToGlossary(); hideSelectionToolbar(); });
document.addEventListener('selectionchange', capturePdfSelection);
primaryCanvasWrap.addEventListener('scroll', () => {
  hideSelectionToolbar();
  if (!pdfDoc || continuousRebuilding) return;
  if (readingFlow === 'continuous') {
    continuousScrollTop = primaryCanvasWrap.scrollTop;
    clearTimeout(continuousScrollTimer);
    continuousScrollTimer = setTimeout(() => {
      updateCurrentPageFromContinuousScroll();
      continuousSavedAnchor = captureContinuousAnchor();
          persistDocumentState();
    }, 80);
  } else {
    scrollByPage[String(currentPage)] = { top: primaryCanvasWrap.scrollTop, left: primaryCanvasWrap.scrollLeft };
    persistDocumentState();
  }
}, { passive: true });
referenceCanvasWrap.addEventListener('scroll', () => {
  hideSelectionToolbar();
  if (!pdfDoc || !pinnedPage) return;
  referenceScrollByPage[String(pinnedPage)] = { top: referenceCanvasWrap.scrollTop, left: referenceCanvasWrap.scrollLeft };
  persistDocumentState();
}, { passive: true });

document.querySelectorAll('.map-filter[data-map-target]').forEach((input) => input.addEventListener('input', () => applyDocumentMapFilter(input)));
documentReadingStatus?.addEventListener('change',()=>{ documentReadingState=['unread','reading','finished'].includes(documentReadingStatus.value)?documentReadingStatus.value:'unread'; renderDocumentMetadata(); persistDocumentState(); });
documentTagsInput?.addEventListener('change',()=>{ documentTags=normalizeDocumentTags(documentTagsInput.value); renderDocumentMetadata(); persistDocumentState(); });
documentTagsInput?.addEventListener('blur',()=>{ documentTags=normalizeDocumentTags(documentTagsInput.value); renderDocumentMetadata(); persistDocumentState(); });
documentPersonalNoteInput?.addEventListener('input',()=>{ documentPersonalNote=documentPersonalNoteInput.value; clearTimeout(documentMetaTimer); documentMetaTimer=setTimeout(()=>{ renderDocumentMetadata(); persistDocumentState(); },280); });

function rightPanelNavigationTop(section) {
  if (!rightSidebar || !section) return 0;
  const stickyHeight = 0;
  const breathingRoom = 18;
  return Math.max(0, section.offsetTop - stickyHeight - breathingRoom);
}

function scrollRightPanelToSection(section, behavior = 'smooth') {
  if (!rightSidebar || !section) return;
  rightSidebar.scrollTo({ top: rightPanelNavigationTop(section), behavior });
}


languageButton.addEventListener('click', () => applyLanguage(root.dataset.lang === 'zh' ? 'en' : 'zh'));
themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

function toggleLeftSidePanel() {
  runDisplayTransition(() => {
    if (matchMedia('(max-width: 860px)').matches) {
      shell.classList.toggle('mobile-left-open'); shell.classList.remove('mobile-right-open');
    } else shell.classList.toggle('left-collapsed');
    if (pdfDoc) persistDocumentState();
  }, { delay: 220 });
}

function toggleRightSidePanel() {
  runDisplayTransition(() => {
    if (matchMedia('(max-width: 860px)').matches) {
      shell.classList.toggle('mobile-right-open'); shell.classList.remove('mobile-left-open');
    } else shell.classList.toggle('right-collapsed');
    if (pdfDoc) persistDocumentState();
  }, { delay: 220 });
}


const SIDEBAR_WIDTHS_KEY = 'mathreader-sidebar-widths-v1';
const SIDEBAR_COLLAPSE_THRESHOLD = 92;
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 460;
const LEFT_SIDEBAR_DEFAULT_WIDTH = 250;
const RIGHT_SIDEBAR_DEFAULT_WIDTH = 260;

function loadSidebarWidths() {
  if (generalPrefs.rememberSidebarWidths === false) {
    shell?.style.setProperty('--left-sidebar-width', `${LEFT_SIDEBAR_DEFAULT_WIDTH}px`);
    shell?.style.setProperty('--right-sidebar-width', `${RIGHT_SIDEBAR_DEFAULT_WIDTH}px`);
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SIDEBAR_WIDTHS_KEY) || '{}');
    const left = clamp(saved.left, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, LEFT_SIDEBAR_DEFAULT_WIDTH);
    const right = clamp(saved.right, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, RIGHT_SIDEBAR_DEFAULT_WIDTH);
    shell?.style.setProperty('--left-sidebar-width', `${left}px`);
    shell?.style.setProperty('--right-sidebar-width', `${right}px`);
  } catch (_) {}
}

function saveSidebarWidths() {
  if (!shell || generalPrefs.rememberSidebarWidths === false) return;
  try {
    const styles = getComputedStyle(shell);
    const left = clamp(parseFloat(styles.getPropertyValue('--left-sidebar-width')), SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, LEFT_SIDEBAR_DEFAULT_WIDTH);
    const right = clamp(parseFloat(styles.getPropertyValue('--right-sidebar-width')), SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, RIGHT_SIDEBAR_DEFAULT_WIDTH);
    localStorage.setItem(SIDEBAR_WIDTHS_KEY, JSON.stringify({ left, right }));
  } catch (_) {}
}

function resetSidebarWidthsToDefault() {
  if (!shell || matchMedia('(max-width: 860px)').matches) return;
  runDisplayTransition(() => {
    shell.style.setProperty('--left-sidebar-width', `${LEFT_SIDEBAR_DEFAULT_WIDTH}px`);
    shell.style.setProperty('--right-sidebar-width', `${RIGHT_SIDEBAR_DEFAULT_WIDTH}px`);
    shell.classList.remove('left-collapsed', 'right-collapsed');
    saveSidebarWidths();
    if (pdfDoc) persistDocumentState();
  }, { delay: 220 });
}

function bindSidebarResizer(handle, side) {
  if (!handle || !shell) return;
  handle.addEventListener('dblclick', (event) => {
    if (matchMedia('(max-width: 860px)').matches) return;
    event.preventDefault();
    event.stopPropagation();
    resetSidebarWidthsToDefault();
  });
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || matchMedia('(max-width: 860px)').matches) return;
    event.preventDefault();
    handle.setPointerCapture?.(event.pointerId);
    shell.classList.add('is-resizing-sidebar');

    const move = (moveEvent) => {
      const rect = shell.getBoundingClientRect();
      const raw = side === 'left' ? moveEvent.clientX - rect.left : rect.right - moveEvent.clientX;
      const collapsedClass = side === 'left' ? 'left-collapsed' : 'right-collapsed';
      const variable = side === 'left' ? '--left-sidebar-width' : '--right-sidebar-width';
      if (raw < SIDEBAR_COLLAPSE_THRESHOLD) {
        shell.classList.add(collapsedClass);
      } else {
        shell.classList.remove(collapsedClass);
        const width = clamp(raw, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, side === 'left' ? LEFT_SIDEBAR_DEFAULT_WIDTH : RIGHT_SIDEBAR_DEFAULT_WIDTH);
        shell.style.setProperty(variable, `${width}px`);
      }
    };

    const finish = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', finish);
      handle.removeEventListener('pointercancel', finish);
      shell.classList.remove('is-resizing-sidebar');
      saveSidebarWidths();
      if (pdfDoc) persistDocumentState();
    };

    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
  });
}

loadSidebarWidths();
bindSidebarResizer(leftSidebarResizer, 'left');
bindSidebarResizer(rightSidebarResizer, 'right');

function collapseWorkspaceSections(container) {
  if (!container) return;
  for (const section of directWorkspaceSections(container)) section.classList.add('is-collapsed');
  persistWorkspaceCollapseState();
  updateWorkspaceCollapseButtons();
}

function collapseRightWorkspaceSections() {
  collapseWorkspaceSections(rightSidebar);
}

function collapseLeftContentsSections() {
  collapseWorkspaceSections(document.getElementById('outline-panel'));
}

function toggleBothSidePanels() {
  if (matchMedia('(max-width: 860px)').matches) return;
  runDisplayTransition(() => {
    const bothClosed = shell.classList.contains('left-collapsed') && shell.classList.contains('right-collapsed');
    shell.classList.toggle('left-collapsed', !bothClosed);
    shell.classList.toggle('right-collapsed', !bothClosed);
    if (pdfDoc) persistDocumentState();
  }, { delay: 220 });
}


// Automatic panel reactions may reveal content, but must never navigate the PDF,
// switch left-side views, scroll a panel to the item, or steal focus. Actual
// navigation is reserved for explicit user actions such as Jump, bookmarks,
// search/index results, backlinks, the reading trail, and page controls.
function autoOpenRightSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  expandWorkspaceSection(sectionId);
  if (matchMedia('(max-width: 860px)').matches) {
    shell.classList.add('mobile-right-open');
    shell.classList.remove('mobile-left-open');
  } else {
    shell.classList.remove('right-collapsed');
  }
  if (pdfDoc) persistDocumentState();
}

function openLeftPanelShortcut(panelId, focusTarget = null) {
  activatePanel(panelId);
  if (matchMedia('(max-width: 860px)').matches) {
    shell.classList.add('mobile-left-open');
    shell.classList.remove('mobile-right-open');
  } else {
    shell.classList.remove('left-collapsed');
  }
  if (focusTarget) setTimeout(() => focusTarget.focus?.(), 40);
  if (pdfDoc) persistDocumentState();
}

function openRightSectionShortcut(sectionId, focusTarget = null) {
  expandWorkspaceSection(sectionId);
  if (matchMedia('(max-width: 860px)').matches) {
    shell.classList.add('mobile-right-open');
    shell.classList.remove('mobile-left-open');
  } else {
    shell.classList.remove('right-collapsed');
  }
  const section = document.getElementById(sectionId);
  setTimeout(() => {
    if (rightSidebar && section) scrollRightPanelToSection(section);
    focusTarget?.focus?.();
  }, 40);
  if (pdfDoc) persistDocumentState();
}

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === 'k') { event.preventDefault(); openCommandPalette(); return; }
  if (!typing && pdfDoc && (event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey && undoHistory.length) { event.preventDefault(); restoreUndoEntry(); return; }
  if (!typing && event.altKey && event.key === 'ArrowLeft') { event.preventDefault(); goBackReadingLocation(); return; }
  if ((event.ctrlKey || event.metaKey) && key === 'o') { event.preventDefault(); fileInput.click(); return; }
  if ((event.ctrlKey || event.metaKey) && key === 'f') { event.preventDefault(); openLeftPanelShortcut('search-panel', searchInput); return; }
  if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && key === 'o') { event.preventDefault(); fileInput.click(); return; }
  if (!typing && pdfDoc && !event.ctrlKey && !event.metaKey && !event.altKey && key === 'f') {
    event.preventDefault();
    if (ocrMode) {
      setOcrMode(false);
    } else {
      setOcrMode(true);
      // F is an explicit navigation shortcut: bring Formula OCR into view now,
      // before the rectangle drag and before WASM inference can block the UI.
      openRightSectionShortcut('ocr-section');
    }
    return;
  }
  if (!typing && key === 'l' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) { event.preventDefault(); toggleLeftSidePanel(); return; }
  if (!typing && key === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) { event.preventDefault(); toggleRightSidePanel(); return; }
  if (!typing && key === 'b' && !event.ctrlKey && !event.metaKey && !event.altKey && !matchMedia('(max-width: 860px)').matches) { event.preventDefault(); toggleBothSidePanels(); return; }
  if (!typing && key === 'r' && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); collapseRightWorkspaceSections(); return; }
  if (!typing && key === 'l' && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); collapseLeftContentsSections(); return; }
  if (!typing && key === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openLeftPanelShortcut('outline-panel'); return; }
  if (!typing && key === 'h' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openLeftPanelShortcut('history-panel'); return; }
  if (!typing && key === 's' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openLeftPanelShortcut('bookmarks-panel'); return; }
  if (!typing && key === 'd' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openRightSectionShortcut('settings-section'); openSettingsGroup('settings-display-group'); return; }
  if (!typing && key === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openRightSectionShortcut('note-section', pageNote); return; }
  if (!typing && pdfDoc && key === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); setPinnedPage(currentPage); return; }
  if (!typing && pdfDoc && event.key === 'ArrowUp') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: -Math.max(70, primaryCanvasWrap.clientHeight * 0.11), behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'ArrowDown') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: Math.max(70, primaryCanvasWrap.clientHeight * 0.11), behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'PageUp') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: -primaryCanvasWrap.clientHeight * 0.85, behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'PageDown') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: primaryCanvasWrap.clientHeight * 0.85, behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'ArrowLeft') { event.preventDefault(); goToPage(currentPage - 1); return; }
  if (!typing && pdfDoc && event.key === 'ArrowRight') { event.preventDefault(); goToPage(currentPage + 1); return; }
  if (event.key === 'Escape') { closeCommandPalette(); setOcrMode(false); shell.classList.remove('mobile-left-open','mobile-right-open'); hideSelectionToolbar(); window.getSelection()?.removeAllRanges(); }
});

let dragDepth = 0;
function isInternalUiDrag() {
  return Boolean(draggedWorkspaceSection || draggedEquationKey);
}
function isExternalFileDrag(event) {
  const types = Array.from(event?.dataTransfer?.types || []);
  return types.includes('Files');
}
window.addEventListener('dragenter', (event) => {
  if (documentOcrInteractionLocked() || isInternalUiDrag() || !isExternalFileDrag(event)) return;
  event.preventDefault();
  dragDepth += 1;
  dropOverlay.classList.remove('is-hidden');
});
window.addEventListener('dragover', (event) => {
  if (documentOcrInteractionLocked() || isInternalUiDrag() || !isExternalFileDrag(event)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', (event) => {
  if (isInternalUiDrag() || !isExternalFileDrag(event)) return;
  event.preventDefault();
  dragDepth -= 1;
  if (dragDepth <= 0) {
    dragDepth = 0;
    dropOverlay.classList.add('is-hidden');
  }
});
window.addEventListener('drop', (event) => {
  if (documentOcrInteractionLocked()) {
    if (isExternalFileDrag(event)) event.preventDefault();
    return;
  }
  if (isInternalUiDrag()) {
    event.preventDefault();
    dragDepth = 0;
    dropOverlay.classList.add('is-hidden');
    return;
  }
  if (!isExternalFileDrag(event)) return;
  event.preventDefault();
  dragDepth = 0;
  dropOverlay.classList.add('is-hidden');
  const file = [...(event.dataTransfer?.files || [])].find((item) => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf'));
  if (file) openPdfFile(file); else showError(t('Drop a PDF file to open it.', '请拖入 PDF 文件。'));
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (pdfDoc && zoomMode !== 'custom' && !displayTransitionActive) runDisplayTransition(() => {}, { renderReference: true }); }, 180);
});

if ('ResizeObserver' in window && primaryCanvasWrap) {
  readerWidthObserver = new ResizeObserver(() => scheduleReaderWidthReflow());
  readerWidthObserver.observe(primaryCanvasWrap);
}

window.addEventListener('pageshow', () => {
  if (pdfDoc && zoomMode === 'fit-width') {
    const anchor = readingFlow === 'continuous' && continuousSavedAnchor ? { ...continuousSavedAnchor } : null;
    lastObservedReaderWidth = 0;
    setTimeout(() => stabilizeFitWidthLayout(anchor), 40);
    setTimeout(() => stabilizeFitWidthLayout(anchor), 320);
  }
});
document.addEventListener('visibilitychange', () => {
  if (!pdfDoc) return;
  if (document.hidden) {
    if (readingFlow === 'continuous') continuousSavedAnchor = captureContinuousAnchor() || continuousSavedAnchor;
    persistDocumentState();
    return;
  }
  if (zoomMode === 'fit-width') {
    const anchor = readingFlow === 'continuous' && continuousSavedAnchor ? { ...continuousSavedAnchor } : null;
    lastObservedReaderWidth = 0;
    setTimeout(() => stabilizeFitWidthLayout(anchor), 60);
    setTimeout(() => stabilizeFitWidthLayout(anchor), 360);
  }
});

loadDisplayPreferences();
loadSearchPreferences();
setupWorkspaceCollapsibles();
scheduleNotePreview();
mathOcrEngineMode = normalizedOcrEngineMode(mathOcrEngineMode);
if (ocrEngineSelect) ocrEngineSelect.value = mathOcrEngineMode;
if (formulaExtractionSelect) formulaExtractionSelect.value = formulaExtractionMode;
applyTheme(root.dataset.theme, false);
applyLanguage(root.dataset.lang, false);
applyPageDisplay({ persist: false });
setReadingFlow(readingFlow, { persist: false, render: false });
updateOcrCapability();
updateReferenceStatus();
refreshSelectionUI();
refreshOcrUI();
renderBookmarks();
renderDocumentMetadata();
renderDocumentMapAnnotations();
renderStructureIndex();
renderBibliographyIndex();
renderReferenceStack();
renderAnnotationList();
updateReadingBackButton();

async function initializeLocalLibrary() {
  await refreshLocalLibrary();
  try {
    const lastId = await dbMetaGet('lastDocumentId');
    if (lastId) {
      const restored = await openCachedDocument(lastId, { silent: true });
      if (!restored) renderLocalLibrary();
    }
  } catch (error) {
    console.warn('MathReader local library is unavailable.', error);
  }
}

window.addEventListener('pagehide', () => persistDocumentState());
initializeLocalLibrary();
schedulePdfCorePreload();
