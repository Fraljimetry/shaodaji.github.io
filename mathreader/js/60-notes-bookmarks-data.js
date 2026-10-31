// MathReader v306 · PDF comments, notes, bookmarks, open/import/export, undo, and recovery.
function nativeAnnotationString(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  if (typeof value.str === 'string') return value.str.trim();
  if (typeof value.value === 'string') return value.value.trim();
  if (typeof value.text === 'string') return value.text.trim();
  if (typeof value.html === 'string') {
    const temp = document.createElement('div');
    temp.innerHTML = value.html;
    return String(temp.textContent || '').trim();
  }
  return '';
}

function nativeCommentBody(annotation) {
  const candidates = [
    annotation?.contentsObj,
    annotation?.contents,
    annotation?.richText,
    annotation?.popup?.contentsObj,
    annotation?.popup?.contents
  ];
  for (const candidate of candidates) {
    const value = nativeAnnotationString(candidate);
    if (value) return value;
  }
  return '';
}

function nativeCommentAuthor(annotation) {
  for (const candidate of [annotation?.titleObj, annotation?.title, annotation?.author]) {
    const value = nativeAnnotationString(candidate);
    if (value) return value;
  }
  return '';
}

function nativeCommentKind(annotation) {
  const subtype = String(annotation?.subtype || annotation?.annotationTypeName || '').trim();
  if (subtype) return subtype;
  const type = Number(annotation?.annotationType);
  const labels = { 1: 'Text', 2: 'Link', 3: 'FreeText', 4: 'Line', 5: 'Square', 6: 'Circle', 7: 'Polygon', 8: 'PolyLine', 9: 'Highlight', 10: 'Underline', 11: 'Squiggly', 12: 'StrikeOut', 13: 'Stamp', 14: 'Caret', 15: 'Ink', 16: 'Popup', 17: 'FileAttachment', 20: 'Widget' };
  return labels[type] || 'Comment';
}

function nativeAnnotationId(annotation) {
  return String(annotation?.id || annotation?.annotationId || annotation?.ref || '').trim();
}

function nativeAnnotationParentId(annotation) {
  const values = [
    annotation?.parentId,
    annotation?.parentAnnotationId,
    annotation?.popupParentId,
    annotation?.parent?.id,
    annotation?.popupRef?.id,
    annotation?.parentRef?.id
  ];
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function nativeAnnotationRect(annotation) {
  const quad = annotation?.quadPoints;
  const nums = [];
  const collect = (value) => {
    if (Number.isFinite(Number(value))) nums.push(Number(value));
    else if (value && typeof value === 'object') {
      if (Number.isFinite(Number(value.x))) nums.push(Number(value.x));
      if (Number.isFinite(Number(value.y))) nums.push(Number(value.y));
    }
  };
  if (Array.isArray(quad) || ArrayBuffer.isView(quad)) {
    for (const value of quad) {
      if (Array.isArray(value) || ArrayBuffer.isView(value)) {
        for (const part of value) collect(part);
      } else collect(value);
    }
  }
  if (nums.length >= 4) {
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  const rect = Array.isArray(annotation?.rect) || ArrayBuffer.isView(annotation?.rect) ? Array.from(annotation.rect).map(Number) : [];
  if (rect.length >= 4 && rect.slice(0, 4).every(Number.isFinite)) {
    return [Math.min(rect[0], rect[2]), Math.min(rect[1], rect[3]), Math.max(rect[0], rect[2]), Math.max(rect[1], rect[3])];
  }
  return null;
}

function annotationTextFromContent(annotation, textContent) {
  const rect = nativeAnnotationRect(annotation);
  if (!rect || !textContent?.items?.length) return '';
  const [ax1, ay1, ax2, ay2] = rect;
  const hits = [];
  for (const item of textContent.items) {
    const text = String(item?.str || '').trim();
    if (!text) continue;
    const tr = item?.transform || [1, 0, 0, 1, 0, 0];
    const x = Number(tr[4]) || 0;
    const y = Number(tr[5]) || 0;
    const w = Math.max(0.5, Number(item?.width) || 0.5);
    const h = Math.max(1, Number(item?.height) || Math.hypot(Number(tr[2]) || 0, Number(tr[3]) || 0) || Math.hypot(Number(tr[0]) || 0, Number(tr[1]) || 0) || 8);
    // PDF text y is normally a baseline. Give it a small descender allowance so
    // native highlight rectangles overlap reliably across fonts.
    const ix1 = x;
    const ix2 = x + w;
    const iy1 = y - Math.max(2, h * 0.28);
    const iy2 = y + Math.max(2, h * 0.95);
    const overlapX = Math.min(ax2, ix2) - Math.max(ax1, ix1);
    const overlapY = Math.min(ay2, iy2) - Math.max(ay1, iy1);
    if (overlapX <= 0 || overlapY <= 0) continue;
    const itemArea = Math.max(1, (ix2 - ix1) * (iy2 - iy1));
    const overlapArea = overlapX * overlapY;
    if (overlapArea / itemArea < 0.08 && overlapX < Math.min(5, w * 0.25)) continue;
    hits.push({ text, x, y });
  }
  if (!hits.length) return '';
  hits.sort((a, b) => Math.abs(b.y - a.y) > 2.2 ? b.y - a.y : a.x - b.x);
  const rows = [];
  for (const hit of hits) {
    let row = rows.find((candidate) => Math.abs(candidate.y - hit.y) <= 2.2);
    if (!row) { row = { y: hit.y, items: [] }; rows.push(row); }
    row.items.push(hit);
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNativePdfComments(raw, textContent = null) {
  const annotations = Array.isArray(raw) ? raw : [];
  const byId = new Map();
  for (const annotation of annotations) {
    const id = nativeAnnotationId(annotation);
    if (id) byId.set(id, annotation);
  }

  const popupByParent = new Map();
  const unpairedPopups = [];
  for (const annotation of annotations) {
    if (nativeCommentKind(annotation).toLowerCase() !== 'popup') continue;
    const parentId = nativeAnnotationParentId(annotation);
    if (parentId) popupByParent.set(parentId, annotation);
    else unpairedPopups.push(annotation);
  }

  const result = [];
  const usedPopups = new Set();
  const isMarkupKind = (kind) => /^(highlight|underline|squiggly|strikeout)$/i.test(kind);

  for (let index = 0; index < annotations.length; index += 1) {
    const annotation = annotations[index];
    const kind = nativeCommentKind(annotation);
    if (kind.toLowerCase() === 'popup') continue;
    const id = nativeAnnotationId(annotation) || `pdf-comment-${index}`;
    let popup = popupByParent.get(id) || null;
    const annotationBody = nativeCommentBody(annotation);

    // Some PDFs expose the parent linkage incompletely but duplicate the same
    // comment body on the markup and Popup objects. Pair those conservatively.
    if (!popup && annotationBody) {
      popup = unpairedPopups.find((candidate) => !usedPopups.has(candidate) && nativeCommentBody(candidate) === annotationBody) || null;
    }
    if (popup) usedPopups.add(popup);

    const popupBody = popup ? nativeCommentBody(popup) : '';
    const body = popupBody || annotationBody;
    const sourceText = isMarkupKind(kind) ? annotationTextFromContent(annotation, textContent) : '';
    if (!body && !sourceText) continue;
    result.push({
      id,
      kind,
      sourceText,
      body,
      author: (popup && nativeCommentAuthor(popup)) || nativeCommentAuthor(annotation),
      paired: Boolean(popup),
      ratio: (() => {
        const rect = nativeAnnotationRect(annotation);
        return rect ? Number(rect[3]) : null;
      })()
    });
  }

  // Preserve genuine standalone popup/text comments that have no markup parent.
  for (let index = 0; index < unpairedPopups.length; index += 1) {
    const popup = unpairedPopups[index];
    if (usedPopups.has(popup)) continue;
    const body = nativeCommentBody(popup);
    if (!body) continue;
    result.push({
      id: nativeAnnotationId(popup) || `pdf-popup-${index}`,
      kind: 'Popup',
      sourceText: '',
      body,
      author: nativeCommentAuthor(popup),
      paired: false,
      ratio: null
    });
  }
  return result;
}

function renderNativePdfComments(page = currentPage) {
  if (!pdfComments || !pdfCommentsList || !pdfCommentsCount) return;
  const items = nativePdfCommentsByPage.get(Number(page)) || [];
  pdfCommentsList.replaceChildren();
  pdfCommentsCount.textContent = String(items.length);
  pdfComments.classList.toggle('is-hidden', items.length === 0);
  for (const item of items) {
    const row = document.createElement('article');
    row.className = `pdf-comment-item${item.sourceText ? ' has-source' : ''}${item.paired ? ' is-paired' : ''}`;

    const meta = document.createElement('div');
    meta.className = 'pdf-comment-meta';
    const kind = document.createElement('span');
    kind.textContent = t(`PDF ${item.kind || 'comment'}`, `PDF ${item.kind || '批注'}`);
    meta.append(kind);
    if (item.author) {
      const author = document.createElement('span');
      author.textContent = t(`By ${item.author}`, `作者：${item.author}`);
      meta.append(author);
    }
    row.append(meta);

    if (item.sourceText) {
      const source = document.createElement('div');
      source.className = 'pdf-comment-source';
      const label = document.createElement('div');
      label.className = 'pdf-comment-source-label';
      label.textContent = t('Highlighted text', '高亮原文');
      const text = document.createElement('blockquote');
      text.className = 'pdf-comment-source-text';
      text.textContent = item.sourceText;
      source.append(label, text);
      row.append(source);
    }

    if (item.body) {
      const reply = document.createElement('div');
      reply.className = 'pdf-comment-reply';
      const label = document.createElement('div');
      label.className = 'pdf-comment-reply-label';
      label.textContent = item.sourceText ? t('Comment', '批注内容') : t('PDF comment', 'PDF 批注');
      const body = document.createElement('p');
      body.className = 'pdf-comment-body';
      body.textContent = item.body;
      reply.append(label, body);
      row.append(reply);
    }
    pdfCommentsList.append(row);
  }
}

async function refreshNativePdfComments(pageNum) {
  if (!pdfDoc || !Number.isFinite(Number(pageNum))) return;
  const page = Number(pageNum);
  if (nativePdfCommentsByPage.has(page)) {
    if (page === currentPage) renderNativePdfComments(page);
    return;
  }
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const token = nativePdfCommentLoadToken;
  try {
    const pdfPage = await sourceDoc.getPage(page);
    const [raw, textContent] = await Promise.all([
      pdfPage.getAnnotations({ intent: 'any' }),
      pdfPage.getTextContent().catch(() => null)
    ]);
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== nativePdfCommentLoadToken) return;
    nativePdfCommentsByPage.set(page, normalizeNativePdfComments(raw, textContent));
    if (page === currentPage) renderNativePdfComments(page);
  } catch (error) {
    console.warn('MathReader PDF comment extraction failed', error);
    if (pdfDoc === sourceDoc && currentFileKey === sourceKey && token === nativePdfCommentLoadToken) {
      nativePdfCommentsByPage.set(page, []);
      if (page === currentPage) renderNativePdfComments(page);
    }
  }
}

function scheduleNotePreview() {
  clearTimeout(notePreviewTimer);
  notePreviewTimer = setTimeout(renderNotePreview, 180);
}

function refreshVisiblePageNote(page) {
  if (Number(page) !== Number(currentPage)) return;
  pageNote.value = notes[String(page)] || '';
  noteSaveState.textContent = t('Saved locally', '已保存到本地');
  clearTimeout(notePreviewTimer);
  void renderNotePreview();
}

async function renderNotePreview() {
  if (!notePreview) return;
  const value = String(pageNote?.value || '').trim();
  notePreview.classList.toggle('is-hidden', !value);
  if (!value) { notePreview.replaceChildren(); return; }
  try { window.MathJax?.typesetClear?.([notePreview]); } catch (_) {}
  // Keep the saved note exactly as typed, but avoid rendering redundant blank
  // lines immediately after display math blocks in the preview.
  const previewValue = value.replace(/(\\\])[ \t]*(?:\r?\n[ \t]*){2,}/g, '$1\n');
  notePreview.textContent = previewValue;
  if (window.MathJax?.typesetPromise) {
    try { await window.MathJax.typesetPromise([notePreview]); } catch (error) { console.warn('MathReader note MathJax preview failed', error); }
  }
  resetRenderedMathScroll(notePreview);
}

function formatBookmarkTime(timestamp) {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat(root.dataset.lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(timestamp));
  } catch (_) { return new Date(timestamp).toLocaleString(); }
}

async function positionTargetAtReadingLead(page, ratio) {
  let surface = null;
  if (readingFlow === 'continuous') surface = continuousPageNodes.get(Number(page))?.surface || null;
  else if (Number(page) === Number(currentPage)) surface = primaryPageSurface;
  if (!surface) return;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const wrapRect = primaryCanvasWrap.getBoundingClientRect();
  const surfaceRect = surface.getBoundingClientRect();
  const targetY = surfaceRect.top + surfaceRect.height * Math.min(1, Math.max(0, Number(ratio) || 0));
  const desiredOffset = Math.min(300, Math.max(150, wrapRect.height * 0.34));
  primaryCanvasWrap.scrollTop = Math.max(0, primaryCanvasWrap.scrollTop + targetY - (wrapRect.top + desiredOffset));
  if (readingFlow === 'continuous') continuousSavedAnchor = captureContinuousAnchor() || continuousSavedAnchor;
  persistDocumentState();
}

function showNavigationLandingCue(page, ratio) {
  let surface = null;
  if (readingFlow === 'continuous') surface = continuousPageNodes.get(Number(page))?.surface || null;
  else if (Number(page) === Number(currentPage)) surface = primaryPageSurface;
  if (!surface) return;
  surface.querySelectorAll('.equation-bookmark-cue').forEach((node) => node.remove());
  const cue = document.createElement('div');
  cue.className = 'equation-bookmark-cue';
  cue.setAttribute('aria-hidden', 'true');
  cue.style.top = `${Math.min(98, Math.max(2, Number(ratio || 0) * 100))}%`;
  surface.append(cue);
  requestAnimationFrame(() => cue.classList.add('is-visible'));
  window.setTimeout(() => cue.classList.add('is-fading'), 1200);
  window.setTimeout(() => cue.remove(), 2100);
}

function showEquationBookmarkCue(page, ratio) {
  showNavigationLandingCue(page, ratio);
}

function equationBookmarkRatio(bookmark) {
  if (Number.isFinite(Number(bookmark?.ratio))) return Math.min(1, Math.max(0, Number(bookmark.ratio)));
  const page = Number(bookmark?.page) || 0;
  const wanted = normalizeEquationLatexForSearch(bookmark?.latex || '');
  if (!wanted) return null;
  const candidates = [currentOcrResult, ...(ocrHistory || [])];
  for (const item of candidates) {
    if (Number(item?.page) !== page || !Number.isFinite(Number(item?.ratio))) continue;
    if (normalizeEquationLatexForSearch(item?.latex || '') === wanted) return Math.min(1, Math.max(0, Number(item.ratio)));
  }
  return null;
}

async function goToEquationBookmark(bookmark) {
  const page = Math.min(Math.max(1, Number(bookmark?.page) || 1), pdfDoc?.numPages || 1);
  const resolvedRatio = equationBookmarkRatio(bookmark);
  const ratio = resolvedRatio === null ? 0 : resolvedRatio;
  await goToLocation(page, ratio, { contextLead: false });
  if (resolvedRatio !== null) {
    await positionTargetAtReadingLead(page, ratio);
    showEquationBookmarkCue(page, ratio);
  }
}

function renderBookmarks() {
  bookmarkList.replaceChildren();
  bookmarkEmpty.classList.toggle('is-hidden', bookmarks.length > 0);
  bookmarks.sort((a,b) => a.page - b.page || a.created - b.created);
  for (const bookmark of bookmarks) {
    const row = document.createElement('div'); row.className = 'bookmark-item'; row.dataset.color = normalizedBookmarkColor(bookmark.color);
    const main = document.createElement('div'); main.className = 'bookmark-main';
    const jump = document.createElement('button'); jump.type = 'button'; jump.className = 'bookmark-jump';
    const strong = document.createElement('strong'); strong.textContent = bookmark.title?.trim() || (bookmark.type === 'equation' ? t(`Equation · page ${bookmark.page}`, `公式 · 第 ${bookmark.page} 页`) : t(`Page ${bookmark.page}`, `第 ${bookmark.page} 页`));
    const kindLabel = bookmark.type === 'equation' ? t('Equation', '公式') : t('Page', '页面');
    const detail = document.createElement('span'); detail.className = 'bookmark-meta'; detail.textContent = `${kindLabel} · ${t(`Page ${bookmark.page}`, `第 ${bookmark.page} 页`)} · ${formatBookmarkTime(bookmark.created)}`;
    jump.append(strong, detail); jump.addEventListener('click', () => bookmark.type === 'equation' ? goToEquationBookmark(bookmark) : goToLocation(bookmark.page, 0, { contextLead: false }));
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'bookmark-edit'; edit.textContent = '✎'; edit.title = t('Edit bookmark', '编辑书签');
    edit.addEventListener('click', () => { editingBookmarkId = editingBookmarkId === bookmark.id ? null : bookmark.id; renderBookmarks(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'bookmark-remove'; remove.textContent = '×'; remove.setAttribute('aria-label', t('Remove bookmark', '删除书签'));
    remove.addEventListener('click', () => {
      pushUndo('bookmark', bookmark.title?.trim() || t(`Bookmark · page ${bookmark.page}`, `书签 · 第 ${bookmark.page} 页`), bookmark);
      bookmarks = bookmarks.filter((item) => item.id !== bookmark.id);
      if (editingBookmarkId === bookmark.id) editingBookmarkId = null;
      persistDocumentState(); renderBookmarks();
    });
    main.append(jump, edit, remove); row.append(main);
    if (bookmark.latex?.trim()) { const formula = document.createElement('code'); formula.className = 'bookmark-equation-preview'; formula.textContent = bookmark.latex.length > 220 ? `${bookmark.latex.slice(0, 220)}…` : bookmark.latex; row.append(formula); }
    if (bookmark.note?.trim()) { const preview = document.createElement('div'); preview.className = 'bookmark-note-preview'; preview.textContent = bookmark.note; row.append(preview); }
    if (editingBookmarkId === bookmark.id) {
      const editor = document.createElement('div'); editor.className = 'bookmark-editor';
      const titleInput = document.createElement('input'); titleInput.value = bookmark.title || ''; titleInput.placeholder = t('Bookmark title', '书签标题');
      const noteInput = document.createElement('textarea'); noteInput.value = bookmark.note || ''; noteInput.placeholder = t('What is this bookmark for?', '这个书签用于记录什么？');
      let draftColor = normalizedBookmarkColor(bookmark.color);
      const colorWrap = document.createElement('div'); colorWrap.className = 'bookmark-color-picker';
      const colorLabel = document.createElement('span'); colorLabel.textContent = t('Color', '颜色'); colorWrap.append(colorLabel);
      const swatches = document.createElement('div'); swatches.className = 'bookmark-color-swatches';
      for (const color of BOOKMARK_COLORS) {
        const swatch = document.createElement('button'); swatch.type = 'button'; swatch.className = 'bookmark-color-swatch'; swatch.dataset.color = color;
        swatch.classList.toggle('is-active', color === draftColor); swatch.title = color; swatch.setAttribute('aria-label', t(`${color} bookmark`, `${color} 书签`));
        swatch.addEventListener('click', () => { draftColor = color; swatches.querySelectorAll('.bookmark-color-swatch').forEach((node) => node.classList.toggle('is-active', node.dataset.color === color)); });
        swatches.append(swatch);
      }
      colorWrap.append(swatches);
      const actions = document.createElement('div'); actions.className = 'bookmark-editor-actions';
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = t('Cancel', '取消'); cancel.addEventListener('click', () => { editingBookmarkId = null; renderBookmarks(); });
      const save = document.createElement('button'); save.type = 'button'; save.className = 'save'; save.textContent = t('Save', '保存'); save.addEventListener('click', () => {
        bookmark.title = titleInput.value.trim(); bookmark.note = noteInput.value.trim(); bookmark.color = draftColor; editingBookmarkId = null; persistDocumentState(); renderBookmarks();
      });
      actions.append(cancel, save); editor.append(titleInput, noteInput, colorWrap, actions); row.append(editor);
      setTimeout(() => titleInput.focus(), 0);
    }
    bookmarkList.append(row);
  }
  renderDocumentMetadata();
}

function currentBookmarkLocation() {
  if (readingFlow === 'continuous') {
    const anchor = captureContinuousAnchor() || continuousSavedAnchor;
    if (anchor && Number(anchor.page) >= 1) return { page: Number(anchor.page), ratio: Math.min(1, Math.max(0, Number(anchor.ratio) || 0)) };
  }
  const page = Number(currentPage) || 1;
  const height = Math.max(1, primaryPageSurface?.offsetHeight || primaryCanvasWrap?.scrollHeight || 1);
  const ratio = Math.min(1, Math.max(0, Number(primaryCanvasWrap?.scrollTop || 0) / height));
  return { page, ratio };
}

function addCurrentBookmark() {
  if (!pdfDoc) return;
  // Page bookmarks are independent records. Equation bookmarks on the same
  // page never block them, and users may keep several page bookmarks at
  // different reading positions on one page.
  const location = currentBookmarkLocation();
  const item = {
    id: `bm-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    page: location.page,
    ratio: location.ratio,
    title: '',
    note: '',
    color: 'blue',
    created: Date.now(),
    type: 'page'
  };
  bookmarks.push(item); editingBookmarkId = null;
  persistDocumentState(); renderBookmarks();
}

function saveCurrentOcrAsEquation() {
  if (!pdfDoc || !currentOcrResult?.latex) return;
  const page = Number(currentOcrResult.page) || currentPage;
  const item = {
    id: `eq-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    page, ratio: Number.isFinite(Number(currentOcrResult.ratio)) ? Math.min(1, Math.max(0, Number(currentOcrResult.ratio))) : 0,
    title: '', note: '', color: 'purple', created: Date.now(), type: 'equation',
    latex: String(ocrLatexPreview?.value || currentOcrResult.latex).trim(), preview: currentOcrResult.preview || ''
  };
  bookmarks.push(item); editingBookmarkId = null;
  persistDocumentState(); renderBookmarks();
}


async function openPdfSource({ data, meta, cachedRecord = null, cacheBlob = null }) {
  setLoading(true, cachedRecord ? t('Restoring local reading state…', '正在恢复本地阅读状态……') : t('Opening PDF…', '正在打开 PDF……'));
  restoringSession = true;
  let freshReadingSession = false;
  try {
    const lib = await ensurePdfJs();
    if (pdfDoc) { try { await pdfDoc.destroy(); } catch (_) {} }
    const task = lib.getDocument({ data });
    pdfDoc = await task.promise;
    currentFileName = meta.name;
    currentFileKey = meta.id;
    cacheEnabledForCurrent = Boolean(cachedRecord);
    // Clear the previous document's map before any potentially long OCR/index preparation.
    // This prevents stale Structure/Results/Equations/Bibliography rows from remaining
    // clickable against the newly opened PDF.
    clearDocumentMapForIncomingPdf();
    let savedTextPreference = cachedRecord?.session?.documentTextPreference;
    if (!['skip', 'ocr', 'native'].includes(savedTextPreference)) {
      try { savedTextPreference = JSON.parse(safeGet(stateKey('session-v2'), 'null'))?.documentTextPreference; } catch (_) { savedTextPreference = 'ask'; }
    }
    await ensureDocumentTextReady(savedTextPreference);
    // Determine freshness from the same two session sources used by
    // loadDocumentState(): IndexedDB first, then the legacy localStorage copy.
    // This flag is captured before opening persists a new session of its own.
    let legacySession = null;
    if (!cachedRecord?.session) {
      try { legacySession = JSON.parse(safeGet(stateKey('session-v2'), 'null')); } catch (_) { legacySession = null; }
    }
    freshReadingSession = !(cachedRecord?.session && typeof cachedRecord.session === 'object')
      && !(legacySession && typeof legacySession === 'object');
    initialContinuousReady = false;
    textCache = new Map();
    lineCache = new Map();
    referencePageRenderCache = new Map();
    referenceSnapshotCache.clear();
    bibliographyExpanded = new Set();
    currentSelection = null;
    setOcrMode(false);
    hideSelectionToolbar();
    loadDocumentState(cachedRecord?.session || null);
    if (!documentTextFeaturesAvailable()) clearTextDerivedIndexesForUnavailableDocument();
    updateDocumentTextAvailabilityUI();
    documentTitle.textContent = meta.name;
    pageCount.textContent = pdfDoc.numPages;
    enableReaderControls(true);
    applyPageDisplay({ persist: false });
    await setReadingFlow(readingFlow, { persist: false, render: false });
    welcome.classList.add('is-hidden');
    welcomeRecent.classList.add('is-hidden');
    pdfWorkspace.classList.remove('is-hidden');
    renderBookmarks();
    await Promise.all([renderOutline(), renderCurrentPage()]);
    renderStructureIndex();
    renderBibliographyIndex();
    ensureEquationIndexRendered().catch(() => {});
    renderReferenceStack();
    updateReadingBackButton();
    // The initial continuous path already uses the final visible reader width.
    // Do not immediately rebuild it through the post-load stabilizer; that was
    // the regression source introduced after v78. Later display changes still
    // use the universal transition path.
    if (!(readingFlow === 'continuous' && initialContinuousReady)) await stabilizeFitWidthLayout();
    await renderReferencePage();
    updateReferenceStatus();

    // A genuinely new document must finish its *entire* initial layout at the
    // beginning of page 1. Earlier resets inside the continuous builder happen
    // before text/outline/reference/layout work has completely settled, so a
    // later browser/layout adjustment can still leave the viewport lower down.
    // Clamp only after all initial rendering work is complete, and only when no
    // saved session existed before this open. Saved reading positions are never
    // affected by this path.
    if (freshReadingSession) {
      currentPage = 1;
      continuousScrollTop = 0;
      continuousSavedAnchor = null;
      if (primaryCanvasWrap) {
        primaryCanvasWrap.scrollTop = 0;
        primaryCanvasWrap.scrollLeft = 0;
      }
      if (readingFlow === 'continuous') {
        await nextFrame();
        await nextFrame();
        if (primaryCanvasWrap) {
          primaryCanvasWrap.scrollTop = 0;
          primaryCanvasWrap.scrollLeft = 0;
        }
      }
      updateNavigationState();
    }

    if (cacheBlob) await cacheOpenedPdf(meta, cacheBlob);
    else if (cachedRecord) await touchCachedPdf(cachedRecord);
    persistDocumentState();
    // Formula OCR warming belongs after the reader is usable, not before
    // the first Open action.  Idle scheduling keeps it off the critical render
    // path and Formula OCR can still initialize on demand if the user presses F
    // before this callback runs.
    scheduleMathOcrPreload();
  } catch (error) {
    console.error(error);
    pdfDoc = null;
    cacheEnabledForCurrent = false;
    welcome.classList.remove('is-hidden');
    renderLocalLibrary();
    showError(error?.message || t('This PDF could not be opened.', '无法打开此 PDF。'));
    throw error;
  } finally {
    restoringSession = false;
    setLoading(false);
    updateDocumentTextAvailabilityUI();
    if (pdfDoc) scheduleAutomaticStructureIndex();
    fileInput.value = '';
  }
}

async function openPdfFile(file, recoveryId = null) {
  if (!file || (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
    showError(t('Please choose a PDF file.', '请选择 PDF 文件。'));
    return;
  }
  let sourceStarted = false;
  let pdfEngineError = null;
  // Acknowledge the selection immediately. Previously the browser could
  // spend seconds reading/hashing a large PDF and probing IndexedDB before any
  // loading UI appeared, which made the first Open action feel unresponsive.
  setLoading(true, recoveryId ? t('Preparing matching PDF…', '正在准备匹配的 PDF……') : t('Preparing PDF…', '正在准备 PDF……'));
  // Warm the core renderer in parallel with file I/O + exact SHA-256 identity.
  // openPdfSource() reuses the same promise through ensurePdfJs().
  const pdfEngineReady = ensurePdfJs().catch((error) => {
    pdfEngineError = error;
    return null;
  });
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const legacyId = makeFileKey(file.name, file.size, file.lastModified || 0);
    let id = await exactDocumentKey(bytes, file.name, file.size, file.lastModified || 0);
    let cachedRecord = null;
    if (recoveryId) {
      try {
        const recovery = await dbGet('documents', recoveryId);
        if (recovery) {
          // Imported first-screen reading data may not know the original file
          // size, but its SHA-256 document id is exact. Identity wins over
          // metadata; metadata is used only for the legacy cached-file fallback.
          let exactMatch = recovery.id === id;
          if (!exactMatch && recovery.name === file.name && Number(recovery.size) === Number(file.size)) {
            try {
              const oldFile = await dbGet('files', recovery.id);
              if (oldFile?.blob) {
                const oldBytes = new Uint8Array(await oldFile.blob.arrayBuffer());
                exactMatch = (await exactDocumentKey(oldBytes, recovery.name, recovery.size, recovery.lastModified || 0)) === id;
              }
            } catch (_) {}
          }
          if (exactMatch) {
            cachedRecord = recovery;
            delete cachedRecord.cacheError;
          } else {
            showError(t('The selected PDF does not exactly match the cached document. It will be opened as a new document.', '所选 PDF 与缓存文档并非完全相同，将作为新文档打开。'));
          }
        }
      } catch (_) {}
    }
    if (!cachedRecord) { try { cachedRecord = await dbGet('documents', id); } catch (_) {} }
    // One-time safe migration from the old metadata key: reuse a legacy session only
    // when the cached PDF bytes hash to this exact document. Never trust metadata alone.
    if (!cachedRecord && legacyId !== id) {
      try {
        const [legacyRecord, legacyFile] = await Promise.all([dbGet('documents', legacyId), dbGet('files', legacyId)]);
        if (legacyRecord && legacyFile?.blob) {
          const legacyBytes = new Uint8Array(await legacyFile.blob.arrayBuffer());
          const legacyExactId = await exactDocumentKey(legacyBytes, legacyRecord.name, legacyRecord.size, legacyRecord.lastModified || 0);
          if (legacyExactId === id) cachedRecord = { ...legacyRecord, id };
        }
      } catch (_) {}
    }
    await pdfEngineReady;
    if (pdfEngineError) throw pdfEngineError;
    const blob = file.slice(0, file.size, 'application/pdf');
    sourceStarted = true;
    await openPdfSource({
      data: bytes,
      meta: { id, name: file.name, size: file.size, lastModified: file.lastModified || 0 },
      cachedRecord,
      cacheBlob: blob
    });
  } catch (error) {
    // openPdfSource owns its own error/loading cleanup once control reaches it.
    // Failures before that point (file read/hash/PDF-engine warm-up) need the same
    // user-visible handling instead of disappearing behind the file picker.
    if (!sourceStarted) {
      console.error(error);
      showError(error?.message || t('This PDF could not be opened.', '无法打开此 PDF。'));
    }
  } finally {
    if (!sourceStarted) {
      setLoading(false);
      fileInput.value = '';
    }
  }
}
async function openCachedDocument(id, options = {}) {
  try {
    const [record, fileRecord] = await Promise.all([dbGet('documents', id), dbGet('files', id)]);
    if (!record || !fileRecord?.blob) throw new Error(t('The cached PDF is unavailable. Open the original file once to cache it again.', '本地缓存的 PDF 已不可用。请重新打开原文件以再次缓存。'));
    const arrayBuffer = await fileRecord.blob.arrayBuffer();
    await openPdfSource({
      data: new Uint8Array(arrayBuffer),
      meta: { id: record.id, name: record.name, size: record.size, lastModified: record.lastModified || 0 },
      cachedRecord: record
    });
    return true;
  } catch (error) {
    console.error(error);
    try {
      const record = await dbGet('documents', id);
      if (record) { record.cacheError = 'unavailable'; await dbPut('documents', record); await refreshLocalLibrary(); }
    } catch (_) {}
    if (!options.silent) showError(error?.message || t('The cached PDF could not be reopened. Reopen the original file from History to recover the session.', '无法重新打开本地缓存的 PDF。请从历史中重新选择原文件以恢复阅读现场。'));
    return false;
  }
}

async function changeZoom(delta) {
  if (!pdfDoc) return;
  // Capture before any await. A browser/layout frame may transiently report
  // scrollTop=0 while the continuous document is being rebuilt; that must never
  // replace the real reading location with page 1.
  const stableAnchor = snapshotDisplayAnchor();
  if (stableAnchor) continuousSavedAnchor = { ...stableAnchor };
  if (zoomMode !== 'custom') {
    const page = await pdfDoc.getPage(currentPage);
    const baseViewport = page.getViewport({ scale: 1 });
    const visibleCanvas = readingFlow === 'continuous' ? continuousPageNodes.get(currentPage)?.canvas : canvas;
    const renderedWidth = visibleCanvas?.getBoundingClientRect().width || canvas.getBoundingClientRect().width;
    zoomScale = renderedWidth > 0 ? renderedWidth / baseViewport.width : 1.2;
  }
  const nextScale = Math.max(.4, Math.min(3.5, zoomScale + delta));
  await runDisplayTransition(() => {
    zoomMode = 'custom';
    zoomScale = nextScale;
    updateZoomLabel();
    persistDocumentState();
  });
}

async function setFitMode(mode) {
  if (!pdfDoc) return;
  await runDisplayTransition(() => {
    zoomMode = mode;
    updateZoomLabel();
    persistDocumentState();
  });
}

function activatePanel(panelId, persist = true) {
  const exists = document.getElementById(panelId);
  if (!exists) panelId = 'outline-panel';
  document.querySelectorAll('.sidebar-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.panel === panelId));
  document.querySelectorAll('.sidebar-panel').forEach((panel) => panel.classList.toggle('is-active', panel.id === panelId));
  if (persist && pdfDoc) persistDocumentState();
}

document.querySelectorAll('.sidebar-tab').forEach((tab) => tab.addEventListener('click', () => activatePanel(tab.dataset.panel)));

openButton.addEventListener('click', () => { if (!documentOcrInteractionLocked()) fileInput.click(); });
welcomeOpen.addEventListener('click', () => { if (!documentOcrInteractionLocked()) fileInput.click(); });
fileInput.addEventListener('change', () => { const recoveryId = pendingRecoveryRecordId; pendingRecoveryRecordId = null; openPdfFile(fileInput.files?.[0], recoveryId); });
prevPage.addEventListener('click', () => goToPage(currentPage - 1));
nextPage.addEventListener('click', () => goToPage(currentPage + 1));
pageNumberInput.addEventListener('change', () => goToPage(pageNumberInput.value));
zoomIn.addEventListener('click', () => changeZoom(.15));
zoomOut.addEventListener('click', () => changeZoom(-.15));
zoomLabel.addEventListener('click', () => setFitMode(zoomMode === 'fit-width' ? 'fit-page' : 'fit-width'));
ocrHistoryToggle?.addEventListener('click', () => { ocrHistoryExpanded = !ocrHistoryExpanded; refreshOcrUI(); });
flowButton?.addEventListener('click', () => setReadingFlow(readingFlow === 'continuous' ? 'single' : 'continuous'));
flowSingle?.addEventListener('click', () => setReadingFlow('single'));
flowContinuous?.addEventListener('click', () => setReadingFlow('continuous'));
resetDisplay?.addEventListener('click', resetDisplayPreferences);
pageToneSelect?.addEventListener('change', () => { pageTone = pageToneSelect.value; applyPageDisplay(); });
brightnessRange?.addEventListener('input', () => { displayBrightness = clamp(brightnessRange.value, 70, 115, 100); applyPageDisplay(); });
contrastRange?.addEventListener('input', () => { displayContrast = clamp(contrastRange.value, 80, 120, 100); applyPageDisplay(); });
gapRange?.addEventListener('input', () => { displayGap = clamp(gapRange.value, 8, 44, 20); applyPageDisplay(); });
gapRange?.addEventListener('change', () => { runDisplayTransition(() => { displayGap = clamp(gapRange.value, 8, 44, 20); applyPageDisplay(); persistDisplayPreferences(); }, { renderReference: false }); });
pageShadow?.addEventListener('change', () => { displayShadow = pageShadow.checked; applyPageDisplay(); });

function formatCompactDate(timestamp) {
  try {
    return new Intl.DateTimeFormat(root.dataset.lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(timestamp));
  } catch (_) { return ''; }
}

function renderUndoHistory() {
  if (!undoList || !undoCount || !undoEmpty) return;
  undoList.replaceChildren();
  undoCount.textContent = String(undoHistory.length);
  undoEmpty.classList.toggle('is-hidden', undoHistory.length > 0);
  if (undoClear) undoClear.disabled = undoHistory.length === 0;

  const compactText = (value, fallback = '') => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return fallback;
    return text.length > 140 ? `${text.slice(0, 137).trimEnd()}…` : text;
  };

  for (const item of undoHistory.slice(0,10)) {
    const payload = item?.payload || {};
    const row=document.createElement('div'); row.className='undo-item';
    const kind=document.createElement('div'); kind.className='undo-item-kind';
    const title=document.createElement('div'); title.className='undo-item-title';

    if (item.type === 'annotation') {
      const isMargin = payload.type === 'margin';
      kind.textContent = isMargin ? t('Deleted margin note','已删除页边注') : t('Deleted highlight','已删除高亮');
      title.textContent = compactText(
        isMargin ? (payload.note || payload.text || payload.latex) : (payload.text || payload.latex || payload.note),
        isMargin ? t('Margin note','页边注') : t('Highlight','高亮')
      );
    } else if (item.type === 'glossary') {
      kind.textContent = t('Deleted symbol','已删除符号');
      title.textContent = compactText(payload.symbol || item.label, t('Symbol','符号')).replace(/^(?:Symbol|符号)\s*(?:[|·:\-]\s*)?/i, '').trim();
    } else if (item.type === 'bookmark') {
      kind.textContent = t('Deleted bookmark','已删除书签');
      title.textContent = compactText(payload.title || item.label, t(`Page ${payload.page || ''}`.trim(), `第 ${payload.page || ''} 页`.trim()));
    } else if (item.type === 'ocr-result') {
      kind.textContent = t('Deleted OCR result','已删除 OCR 结果');
      title.textContent = compactText(payload.latex || payload.text || item.label, t('Formula OCR result','公式 OCR 结果'));
    } else if (item.type === 'reading-trail') {
      kind.textContent = t('Deleted reading trail','已删除阅读轨迹');
      const count = Array.isArray(payload) ? payload.length : 0;
      title.textContent = count ? t(`${count} navigation ${count === 1 ? 'step' : 'steps'}`, `${count} 个导航步骤`) : t('Reading trail','阅读轨迹');
    } else if (item.type === 'structure-outline' || item.type === 'structure-embedded') {
      kind.textContent = t('Deleted structure item','已删除结构条目');
      title.textContent = compactText(payload.title || item.label, t('Structure item','结构条目'));
    } else if (item.type === 'equation') {
      kind.textContent = t('Deleted equation','已删除公式');
      const equationPayload = payload.mode === 'added' ? payload.edit : payload;
      title.textContent = compactText(equationPayload?.label || item.label, t('Equation','公式'));
    } else if (item.type === 'structure-result') {
      kind.textContent = t('Deleted result','已删除结果');
      title.textContent = compactText(payload.label || payload.title || item.label, t('Result','结果'));
    } else {
      kind.textContent = t('Deleted item','已删除项目');
      title.textContent = compactText(item.label, t('Deleted item','已删除项目'));
    }

    const head=document.createElement('div'); head.className='undo-item-head';
    head.append(title);
    const meta=document.createElement('div'); meta.className='undo-item-meta'; meta.textContent=formatCompactDate(item.created);
    const actions=document.createElement('div'); actions.className='undo-item-actions';
    const restore=document.createElement('button'); restore.type='button'; restore.className='secondary-action'; restore.textContent=t('Restore','恢复'); restore.addEventListener('click',()=>restoreUndoEntry(item.id));
    actions.append(restore); row.append(kind,head,meta,actions); undoList.append(row);
  }
}

async function restoreUndoEntry(id = null) {
  const item = id ? undoHistory.find((x)=>x.id===id) : undoHistory[0];
  if (!item) return false;
  const payload = jsonClone(item.payload, item.payload);
  if (item.type === 'bookmark') { if (payload && !bookmarks.some((x)=>x.id===payload.id)) bookmarks.push(payload); renderBookmarks(); }
  else if (item.type === 'annotation') { if (payload && !annotations.some((x)=>x.id===payload.id)) annotations.push(payload); renderAnnotationList(); rerenderVisibleAnnotations(); }
  else if (item.type === 'glossary') { if (payload && !symbolGlossary.some((x)=>x.id===payload.id)) symbolGlossary.push(payload); renderSymbolGlossary(); }
  else if (item.type === 'reading-trail') { readingBackStack=normalizeReadingTrail(payload); updateReadingBackButton(); renderReadingTrail(); }
  else if (item.type === 'ocr-result') { currentOcrResult=payload; refreshOcrUI(); }
  else if (item.type === 'structure-outline') {
    if (payload) {
      const restored = jsonClone(payload, payload);
      const key = outlineEntryKey(restored);
      if (!inferredOutline.some((entry) => outlineEntryKey(entry) === key)) inferredOutline.push(restored);
      inferredOutline.sort((a, b) => Number(a.page) - Number(b.page) || Number(a.ratio) - Number(b.ratio));
      inferredOutline = inferredOutline.slice(0, 240);
      inferredOutlineDetectionDone = true;
      tocOutlineTargets = null;
      renderInferredOutline(inferredOutline);
      rerenderReferenceLinksAfterStructureEdit();
      refreshSelectionUI();
    }
  }
  else if (item.type === 'structure-embedded') {
    if (payload?.sourceKey) {
      embeddedOutlineEdits = embeddedOutlineEdits.filter((edit) => String(edit.sourceKey) !== String(payload.sourceKey));
      if (embeddedOutlineEntries?.length) renderEmbeddedOutline(embeddedOutlineEntries);
      rerenderReferenceLinks();
      refreshSelectionUI();
    }
  }
  else if (item.type === 'equation') {
    if (payload?.mode === 'added' && payload.edit) {
      const restoredEdit = jsonClone(payload.edit, payload.edit);
      if (!equationEdits.some((edit) => edit.action === 'add' && String(edit.id) === String(restoredEdit.id))) equationEdits.push(restoredEdit);
    } else if (payload?.mode === 'source' && payload.sourceLabel) {
      const sourceKey = normalizedEquationLabel(payload.sourceLabel);
      equationEdits = equationEdits.filter((edit) => !(edit.action !== 'add' && normalizedEquationLabel(edit.sourceLabel) === sourceKey));
      if (payload.previousEdit) equationEdits.push(jsonClone(payload.previousEdit, payload.previousEdit));
    }
    equationLabelIndex = null;
    equationIndexBuildPromise = null;
    equationIndexKnownCount = null;
    await ensureEquationIndexRendered();
    refreshSelectionUI();
  }
  else if (item.type === 'structure-result') {
    if (payload) {
      const restored = jsonClone(payload, payload);
      const key = structureResultRelationLabel(restored);
      if (!structureEntries.some((entry) => structureResultRelationLabel(entry) === key)) structureEntries.push(restored);
      structureEntries.sort((a, b) => Number(a.page) - Number(b.page) || Number(a.ratio) - Number(b.ratio));
      structureEntries = structureEntries.slice(0, 500);
      restoreStructureResultRelations(restored);
      renderStructureIndex();
      rerenderReferenceLinks();
    }
  }
  else return false;
  undoHistory = undoHistory.filter((x)=>x.id!==item.id);
  renderUndoHistory(); persistDocumentState(); return true;
}

function renderRecoverySnapshots() {
  if (!recoveryList || !recoveryCount || !recoveryEmpty) return;
  recoveryList.replaceChildren();
  recoveryCount.textContent=String(recoverySnapshots.length);
  recoveryEmpty.classList.toggle('is-hidden', recoverySnapshots.length>0);
  for (const item of recoverySnapshots.slice(0,5)) {
    const row=document.createElement('div'); row.className='recovery-item';
    const head=document.createElement('div'); head.className='recovery-item-head';
    const title=document.createElement('div'); title.className='recovery-item-title'; title.textContent=t(`Snapshot · page ${item.data?.page || 1}`, `快照 · 第 ${item.data?.page || 1} 页`);
    head.append(title);
    const meta=document.createElement('div'); meta.className='recovery-item-meta'; meta.textContent=formatCompactDate(item.created);
    const actions=document.createElement('div'); actions.className='recovery-item-actions';
    const restore=document.createElement('button'); restore.type='button'; restore.className='secondary-action'; restore.textContent=t('Restore','恢复'); restore.addEventListener('click',()=>restoreRecoverySnapshot(item));
    actions.append(restore); row.append(head,meta,actions); recoveryList.append(row);
  }
}

async function restoreRecoverySnapshot(item) {
  if (!pdfDoc || !item?.data) return;
  const data=item.data;
  const currentSafety = durableRecoveryData();
  const currentFingerprint = recoveryFingerprint(currentSafety);
  const targetFingerprint = recoveryFingerprint(data);
  if (currentFingerprint !== targetFingerprint) {
    recoverySnapshots = [{ id:`recovery-${Date.now()}-safety`, created:Date.now(), data:currentSafety }, ...recoverySnapshots].slice(0,5);
    const key = recoveryStorageKey(); if (key) safeSet(key, JSON.stringify(recoverySnapshots));
    renderRecoverySnapshots();
  }
  recoveryRestoreActive=true;
  try {
    bookmarks=normalizeBookmarks(data.bookmarks);
    notes=data.notes && typeof data.notes==='object' ? jsonClone(data.notes,{}) : {};
    annotations=normalizeAnnotations(data.annotations);
    symbolGlossary=normalizeSymbolGlossary(data.symbolGlossary);
    documentTags=normalizeDocumentTags(data.documentTags);
    documentReadingState=['unread','reading','finished'].includes(data.documentReadingState)?data.documentReadingState:'unread';
    documentPersonalNote=typeof data.documentPersonalNote==='string'?data.documentPersonalNote:'';
    currentPage=Math.min(Math.max(1,Number(data.page)||1),pdfDoc.numPages);
    pinnedPage=Number(data.pinnedPage)>=1&&Number(data.pinnedPage)<=pdfDoc.numPages?Number(data.pinnedPage):null;
    referencePages=Array.isArray(data.referencePages)?data.referencePages.map(Number).filter((n,i,a)=>n>=1&&n<=pdfDoc.numPages&&a.indexOf(n)===i).slice(0,4):[];
    readingBackStack=normalizeReadingTrail(data.readingBackStack);
    if (['fit-width','fit-page','custom'].includes(data.zoomMode)) zoomMode=data.zoomMode;
    zoomScale=clamp(data.zoomScale,.35,4,zoomScale);
    if (data.continuousAnchor) continuousSavedAnchor={page:Math.min(Math.max(1,Number(data.continuousAnchor.page)||currentPage),pdfDoc.numPages),ratio:Math.min(1,Math.max(0,Number(data.continuousAnchor.ratio)||0))};
    const flow=data.readingFlow==='single'?'single':'continuous';
    restoringSession=true;
    await setReadingFlow(flow,{persist:false,render:false});
    await Promise.all([renderCurrentPage(),renderReferencePage()]);
    restoringSession=false;
    renderBookmarks(); renderAnnotationList(); rerenderVisibleAnnotations(); renderSymbolGlossary(); renderDocumentMetadata(); renderDocumentMapAnnotations(); renderReferenceStack(); updateReadingBackButton(); renderReadingTrail(); updateNavigationState();
  } catch (error) { console.error(error); showError(t('Recovery snapshot could not be restored.', '无法恢复该快照。')); }
  finally { restoringSession=false; recoveryRestoreActive=false; }
  persistDocumentState();
}

function downloadJsonFile(name, value) {
  const blob = new Blob([JSON.stringify(value, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportReadingData() {
  if (!pdfDoc || !currentFileKey) return;
  const safeName = String(currentFileName || 'document').replace(/\.pdf$/i, '').replace(/[^a-z0-9._-]+/gi, '-');
  downloadJsonFile(`${safeName}-mathreader.json`, {
    schema: 'mathreader.reading-data@1', exportedAt: new Date().toISOString(),
    document: { id: currentFileKey, name: currentFileName, pages: pdfDoc.numPages },
    session: snapshotSession()
  });
}

async function importReadingDataFile(file) {
  if (!file) return;
  let payload;
  try { payload = JSON.parse(await file.text()); } catch (_) { showError(t('The selected reading-data file is not valid JSON.', '所选阅读数据文件不是有效的 JSON。')); return; }
  if (payload?.schema !== 'mathreader.reading-data@1' || !payload.session) { showError(t('This is not a MathReader reading-data export.', '这不是 MathReader 阅读数据导出文件。')); return; }

  // Import is also a first-screen local-library operation. If no PDF is open,
  // retain the exact document identity and its session in IndexedDB; the History
  // row will offer Reopen so the user can select the matching PDF later. The PDF
  // bytes are never guessed or substituted.
  if (!pdfDoc || !currentFileKey) {
    const importedId = String(payload.document?.id || '').trim();
    const importedName = String(payload.document?.name || '').trim();
    if (!importedId || !importedName) {
      showError(t('This reading-data export does not contain a document identity.', '此阅读数据导出文件缺少文档标识。'));
      return;
    }
    try {
      await requestPersistentLocalStorage();
      const existing = await dbGet('documents', importedId);
      const now = Date.now();
      await dbPut('documents', {
        ...(existing || {}),
        id: importedId,
        name: importedName,
        size: Number(existing?.size || payload.document?.size || 0),
        lastModified: Number(existing?.lastModified || payload.document?.lastModified || 0),
        createdAt: existing?.createdAt || now,
        openedAt: existing?.openedAt || now,
        updatedAt: now,
        lastPage: Math.max(1, Number(payload.session?.page || 1)),
        session: payload.session,
        importedReadingData: true
      });
      await refreshLocalLibrary();
      activatePanel('history-panel', false);
      if (matchMedia('(max-width: 860px)').matches) shell.classList.add('mobile-left-open');
      else shell.classList.remove('left-collapsed');
      showNotice(t('PDF required · Reading data was imported successfully. Select the matching PDF to restore this reading session.', '需要 PDF · 阅读数据已成功导入。请选择匹配的 PDF 以恢复此阅读现场。'));
    } catch (error) {
      console.warn('MathReader could not import local reading data.', error);
      showError(t('The reading data could not be imported into the local library.', '无法将阅读数据导入本地资料库。'));
    }
    return;
  }

  if (payload.document?.id && payload.document.id !== currentFileKey) {
    const sameName = String(payload.document?.name || '') === String(currentFileName || '');
    const samePages = Number(payload.document?.pages || 0) === Number(pdfDoc.numPages || 0);
    if (!sameName || !samePages) { showError(t('This reading-data export belongs to a different PDF. Open the matching PDF before importing.', '此阅读数据属于另一份 PDF。请先打开匹配的 PDF 再导入。')); return; }
  }
  safeSet(stateKey('session-v2'), JSON.stringify(payload.session));
  loadDocumentState(payload.session);
  await Promise.all([renderOutline(), renderCurrentPage(), renderReferencePage()]);
  renderBookmarks(); renderStructureIndex(); renderBibliographyIndex(); renderReferenceStack(); renderAnnotationList(); rerenderVisibleAnnotations(); updateReadingBackButton(); persistDocumentState(); scheduleAutomaticStructureIndex();
}


