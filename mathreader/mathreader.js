const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const root = document.documentElement;
const el = (id) => document.getElementById(id);
const shell = el('reader-shell');
const fileInput = el('file-input');
const openButton = el('open-button');
const welcomeOpen = el('welcome-open');
const welcome = el('welcome');
const pdfWorkspace = el('pdf-workspace');
const primaryPane = el('primary-pane');
const referencePane = el('reference-pane');
const canvas = el('pdf-canvas');
const referenceCanvas = el('reference-canvas');
const primaryPageSurface = el('primary-page-surface');
const referencePageSurface = el('reference-page-surface');
const primaryTextLayer = el('primary-text-layer');
const referenceTextLayer = el('reference-text-layer');
const primaryCanvasWrap = el('primary-canvas-wrap');
const referenceCanvasWrap = el('reference-canvas-wrap');
const pageNumberInput = el('page-number');
const pageCount = el('page-count');
const prevPage = el('prev-page');
const nextPage = el('next-page');
const zoomIn = el('zoom-in');
const zoomOut = el('zoom-out');
const zoomLabel = el('zoom-label');
const fitPage = el('fit-page');
const pinPageButton = el('pin-page');
const pinFromSidebar = el('pin-from-sidebar');
const referenceStatus = el('reference-status');
const referencePageLabel = el('reference-page-label');
const primaryPageLabel = el('primary-page-label');
const referencePrev = el('reference-prev');
const referenceNext = el('reference-next');
const unpinPage = el('unpin-page');
const pageNote = el('page-note');
const notePageChip = el('note-page-chip');
const noteSaveState = el('note-save-state');
const addBookmark = el('add-bookmark');
const bookmarkList = el('bookmark-list');
const bookmarkEmpty = el('bookmark-empty');
const outlineList = el('outline-list');
const outlineEmpty = el('outline-empty');
const outlineCount = el('outline-count');
const searchForm = el('search-form');
const searchInput = el('search-input');
const searchStatus = el('search-status');
const searchResults = el('search-results');
const documentTitle = el('document-title');
const loadingOverlay = el('loading-overlay');
const loadingText = el('loading-text');
const errorBanner = el('error-banner');
const dropOverlay = el('drop-overlay');
const languageButton = el('language-button');
const themeButton = el('theme-button');
const leftToggle = el('left-toggle');
const rightToggle = el('right-toggle');
const selectionCard = el('selection-card');
const selectionHelp = el('selection-help');
const selectionPageChip = el('selection-page-chip');
const selectionTextPreview = el('selection-text-preview');
const selectionLatexPreview = el('selection-latex-preview');
const copySelectionText = el('copy-selection-text');
const copySelectionLatex = el('copy-selection-latex');
const selectionToNote = el('selection-to-note');
const selectionToolbar = el('selection-toolbar');
const selectionToolbarLabel = el('selection-toolbar-label');
const floatingCopyText = el('floating-copy-text');
const floatingCopyLatex = el('floating-copy-latex');
const floatingAddNote = el('floating-add-note');
const floatingPinPage = el('floating-pin-page');

let pdfjsLib = null;
let pdfDoc = null;
let currentPage = 1;
let pinnedPage = null;
let zoomMode = 'fit-width';
let zoomScale = 1.2;
let primaryRenderTask = null;
let referenceRenderTask = null;
let currentFileKey = null;
let currentFileName = null;
let bookmarks = [];
let notes = {};
let textCache = new Map();
let pdfModulePromise = null;
let noteTimer = null;
let resizeTimer = null;
let selectionTimer = null;
let currentSelection = null;

const t = (en, zh) => root.dataset.lang === 'zh' ? zh : en;
const safeGet = (key, fallback = null) => { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove('is-hidden');
  clearTimeout(showError.timer);
  showError.timer = setTimeout(() => errorBanner.classList.add('is-hidden'), 6500);
}

function setLoading(active, message = null) {
  if (message) loadingText.textContent = message;
  loadingOverlay.classList.toggle('is-hidden', !active);
}

async function ensurePdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (!pdfModulePromise) {
    pdfModulePromise = import(PDFJS_URL).then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      pdfjsLib = mod;
      return mod;
    });
  }
  try {
    return await pdfModulePromise;
  } catch (error) {
    pdfModulePromise = null;
    throw new Error(t('MathReader could not load its PDF engine. Check your internet connection and reload the page.', 'MathReader 无法加载 PDF 引擎。请检查网络连接并重新载入页面。'));
  }
}

function applyLanguage(lang, persist = true) {
  const next = lang === 'zh' ? 'zh' : 'en';
  root.dataset.lang = next;
  root.lang = next === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach((node) => {
    node.textContent = next === 'zh' ? node.dataset.zh : node.dataset.en;
  });
  document.querySelectorAll('[data-en-placeholder][data-zh-placeholder]').forEach((node) => {
    node.placeholder = next === 'zh' ? node.dataset.zhPlaceholder : node.dataset.enPlaceholder;
  });
  document.querySelectorAll('[data-en-title][data-zh-title]').forEach((node) => {
    const value = next === 'zh' ? node.dataset.zhTitle : node.dataset.enTitle;
    node.title = value;
    node.setAttribute('aria-label', value);
  });
  languageButton.textContent = next === 'zh' ? 'EN' : '🌐';
  languageButton.title = next === 'zh' ? 'Switch to English' : '切换到简体中文';
  languageButton.setAttribute('aria-label', languageButton.title);
  document.title = next === 'zh' ? 'MathReader｜汲绍达' : 'MathReader | Shaoda Ji';
  if (!pdfDoc) documentTitle.textContent = t('No PDF open', '尚未打开 PDF');
  updateReferenceStatus();
  updateZoomLabel();
  renderBookmarks();
  refreshSelectionUI();
  if (persist) safeSet('shaoda-language', next);
}

function applyTheme(theme, persist = true) {
  const next = theme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = next;
  themeButton.textContent = next === 'dark' ? '☀' : '◐';
  themeButton.title = next === 'dark' ? t('Switch to light mode', '切换到浅色模式') : t('Switch to dark mode', '切换到深色模式');
  themeButton.setAttribute('aria-label', themeButton.title);
  if (persist) safeSet('shaoda-theme', next);
}

function stateKey(kind) {
  return currentFileKey ? `mathreader:${currentFileKey}:${kind}` : null;
}

function loadDocumentState() {
  bookmarks = [];
  notes = {};
  const rawBookmarks = safeGet(stateKey('bookmarks'));
  const rawNotes = safeGet(stateKey('notes'));
  try { if (rawBookmarks) bookmarks = JSON.parse(rawBookmarks); } catch (_) {}
  try { if (rawNotes) notes = JSON.parse(rawNotes); } catch (_) {}
  const savedPage = Number(safeGet(stateKey('page'), '1'));
  currentPage = Number.isFinite(savedPage) ? Math.min(Math.max(1, savedPage), pdfDoc.numPages) : 1;
  const savedPinned = Number(safeGet(stateKey('pinned'), '0'));
  pinnedPage = savedPinned >= 1 && savedPinned <= pdfDoc.numPages ? savedPinned : null;
}

function persistDocumentState() {
  if (!currentFileKey) return;
  safeSet(stateKey('page'), String(currentPage));
  safeSet(stateKey('bookmarks'), JSON.stringify(bookmarks));
  safeSet(stateKey('notes'), JSON.stringify(notes));
  safeSet(stateKey('pinned'), pinnedPage ? String(pinnedPage) : '0');
}

function enableReaderControls(enabled) {
  [prevPage,nextPage,pageNumberInput,zoomIn,zoomOut,zoomLabel,fitPage,pinPageButton,pinFromSidebar,addBookmark].forEach((node) => node.disabled = !enabled);
}

function updateNavigationState() {
  if (!pdfDoc) return;
  pageNumberInput.value = currentPage;
  pageNumberInput.max = pdfDoc.numPages;
  pageCount.textContent = pdfDoc.numPages;
  prevPage.disabled = currentPage <= 1;
  nextPage.disabled = currentPage >= pdfDoc.numPages;
  primaryPageLabel.textContent = t(`Page ${currentPage}`, `第 ${currentPage} 页`);
  notePageChip.textContent = String(currentPage);
  pageNote.disabled = false;
  pageNote.value = notes[String(currentPage)] || '';
  noteSaveState.textContent = t('Saved locally', '已保存到本地');
  safeSet(stateKey('page'), String(currentPage));
}

function updateReferenceStatus() {
  if (pinnedPage) {
    referenceStatus.textContent = t(`Page ${pinnedPage} is pinned beside your reading view.`, `第 ${pinnedPage} 页已固定在阅读视图旁。`);
    referencePageLabel.textContent = t(`Page ${pinnedPage}`, `第 ${pinnedPage} 页`);
    pinFromSidebar.textContent = t('Replace with current page', '改为固定当前页');
  } else {
    referenceStatus.textContent = t('No page pinned', '尚未固定页面');
    referencePageLabel.textContent = '';
    pinFromSidebar.textContent = t('Pin current page', '固定当前页');
  }
}

function updateZoomLabel() {
  if (!pdfDoc) {
    zoomLabel.textContent = t('Fit width', '适合宽度');
    return;
  }
  if (zoomMode === 'fit-width') zoomLabel.textContent = t('Fit width', '适合宽度');
  else if (zoomMode === 'fit-page') zoomLabel.textContent = t('Fit page', '适合页面');
  else zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
}


function nodeElement(node) {
  if (!node) return null;
  return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
}

function selectionLayerForNode(node) {
  return nodeElement(node)?.closest?.('.textLayer') || null;
}

const latexSymbolMap = new Map(Object.entries({
  'α':'\\alpha ','β':'\\beta ','γ':'\\gamma ','δ':'\\delta ','ε':'\\varepsilon ','ϵ':'\\epsilon ','ζ':'\\zeta ','η':'\\eta ','θ':'\\theta ','ϑ':'\\vartheta ','ι':'\\iota ','κ':'\\kappa ','λ':'\\lambda ','μ':'\\mu ','ν':'\\nu ','ξ':'\\xi ','π':'\\pi ','ϖ':'\\varpi ','ρ':'\\rho ','ϱ':'\\varrho ','σ':'\\sigma ','ς':'\\varsigma ','τ':'\\tau ','υ':'\\upsilon ','φ':'\\phi ','ϕ':'\\varphi ','χ':'\\chi ','ψ':'\\psi ','ω':'\\omega ',
  'Γ':'\\Gamma ','Δ':'\\Delta ','Θ':'\\Theta ','Λ':'\\Lambda ','Ξ':'\\Xi ','Π':'\\Pi ','Σ':'\\Sigma ','Υ':'\\Upsilon ','Φ':'\\Phi ','Ψ':'\\Psi ','Ω':'\\Omega ',
  'ℝ':'\\mathbb{R}','ℤ':'\\mathbb{Z}','ℕ':'\\mathbb{N}','ℚ':'\\mathbb{Q}','ℂ':'\\mathbb{C}','ℙ':'\\mathbb{P}',
  '∂':'\\partial ','∇':'\\nabla ','∞':'\\infty ','∫':'\\int ','∬':'\\iint ','∭':'\\iiint ','∮':'\\oint ','∑':'\\sum ','∏':'\\prod ','√':'\\sqrt{}',
  '≤':' \\le ','≥':' \\ge ','≠':' \\ne ','≈':' \\approx ','≅':' \\cong ','∼':' \\sim ','≡':' \\equiv ','∝':' \\propto ',
  '∈':' \\in ','∉':' \\notin ','∋':' \\ni ','⊂':' \\subset ','⊆':' \\subseteq ','⊊':' \\subsetneq ','⊃':' \\supset ','⊇':' \\supseteq ','∪':' \\cup ','∩':' \\cap ',
  '→':' \\to ','←':' \\leftarrow ','↔':' \\leftrightarrow ','⇒':' \\Rightarrow ','⇐':' \\Leftarrow ','⇔':' \\Leftrightarrow ','↦':' \\mapsto ',
  '±':' \\pm ','∓':' \\mp ','×':' \\times ','·':' \\cdot ','∘':' \\circ ','⊗':' \\otimes ','⊕':' \\oplus ','∧':' \\wedge ','∨':' \\vee ','¬':'\\neg ',
  '∀':'\\forall ','∃':'\\exists ','∅':'\\varnothing ','∥':'\\parallel ','⊥':'\\perp ','∠':'\\angle ','ℓ':'\\ell ','′':"'",'″':"''",'°':'^{\\circ}','…':'\\ldots '
}));

const superscriptMap = new Map(Object.entries({'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i'}));
const subscriptMap = new Map(Object.entries({'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-','₌':'=','₍':'(','₎':')','ₐ':'a','ₑ':'e','ₕ':'h','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p','ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x'}));

function pdfTextToLatex(source) {
  const text = String(source || '').normalize('NFC').replace(/\u00ad/g, '').replace(/\r\n?/g, '\n');
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (superscriptMap.has(ch)) {
      let group = '';
      while (i < text.length && superscriptMap.has(text[i])) { group += superscriptMap.get(text[i]); i += 1; }
      i -= 1; out += `^{${group}}`; continue;
    }
    if (subscriptMap.has(ch)) {
      let group = '';
      while (i < text.length && subscriptMap.has(text[i])) { group += subscriptMap.get(text[i]); i += 1; }
      i -= 1; out += `_{${group}}`; continue;
    }
    if (latexSymbolMap.has(ch)) { out += latexSymbolMap.get(ch); continue; }
    if (ch === '−' || ch === '–') { out += '-'; continue; }
    if (ch === ' ') { out += ' '; continue; }
    if (ch === '%') { out += '\\%'; continue; }
    if (ch === '#') { out += '\\#'; continue; }
    if (ch === '&') { out += '\\&'; continue; }
    if (ch === '$') { out += '\\$'; continue; }
    out += ch;
  }
  return out
    .replace(/[ \t]+/g, ' ')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\\([A-Za-z]+) +(?=[,.;:!?)}\]])/g, '\\$1')
    .trim();
}

function refreshSelectionUI() {
  if (!selectionCard || !selectionHelp) return;
  const has = Boolean(currentSelection?.text);
  selectionCard.classList.toggle('is-hidden', !has);
  selectionHelp.classList.toggle('is-hidden', has);
  selectionPageChip.textContent = has ? String(currentSelection.page) : '—';
  if (!has) return;
  selectionTextPreview.textContent = currentSelection.text;
  selectionLatexPreview.textContent = currentSelection.latex;
  selectionToolbarLabel.textContent = t(`Page ${currentSelection.page}`, `第 ${currentSelection.page} 页`);
}

function hideSelectionToolbar() {
  selectionToolbar.classList.add('is-hidden');
}

function positionSelectionToolbar(rect) {
  selectionToolbar.classList.remove('is-hidden');
  const margin = 8;
  const toolbarRect = selectionToolbar.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - toolbarRect.width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - toolbarRect.width - margin));
  let top = rect.top - toolbarRect.height - margin;
  if (top < 64) top = Math.min(window.innerHeight - toolbarRect.height - margin, rect.bottom + margin);
  selectionToolbar.style.left = `${Math.round(left)}px`;
  selectionToolbar.style.top = `${Math.round(top)}px`;
}

function capturePdfSelection() {
  clearTimeout(selectionTimer);
  selectionTimer = setTimeout(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { hideSelectionToolbar(); return; }
    const range = sel.getRangeAt(0);
    const startLayer = selectionLayerForNode(range.startContainer);
    const endLayer = selectionLayerForNode(range.endContainer);
    if (!startLayer || startLayer !== endLayer) { hideSelectionToolbar(); return; }
    const text = sel.toString().replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim();
    if (!text) { hideSelectionToolbar(); return; }
    const page = Number(startLayer.dataset.page || 0);
    if (!page) { hideSelectionToolbar(); return; }
    currentSelection = { text, latex: pdfTextToLatex(text), page, kind: startLayer === referenceTextLayer ? 'reference' : 'primary' };
    refreshSelectionUI();
    const rect = range.getBoundingClientRect();
    if (rect.width || rect.height) positionSelectionToolbar(rect);
  }, 20);
}

async function copyPlainText(text, button = null) {
  const value = String(text || '');
  if (!value) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else throw new Error('clipboard unavailable');
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = value; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
  }
  if (button) {
    const old = button.textContent;
    button.textContent = t('Copied', '已复制');
    setTimeout(() => { button.textContent = old; }, 900);
  }
}

function addSelectionToPageNote() {
  if (!pdfDoc || !currentSelection?.text) return;
  const page = currentSelection.page;
  const quoted = currentSelection.text.split('\n').map((line) => `> ${line}`).join('\n');
  const existing = notes[String(page)] || '';
  notes[String(page)] = `${existing}${existing.trim() ? '\n\n' : ''}${quoted}`;
  safeSet(stateKey('notes'), JSON.stringify(notes));
  if (page === currentPage) pageNote.value = notes[String(page)];
  noteSaveState.textContent = t('Saved locally', '已保存到本地');
}

async function renderSelectableText(page, viewport, layer, surface, pageNum) {
  surface.style.width = `${viewport.width}px`;
  surface.style.height = `${viewport.height}px`;
  layer.style.width = `${viewport.width}px`;
  layer.style.height = `${viewport.height}px`;
  layer.style.setProperty('--scale-factor', String(viewport.scale));
  layer.style.setProperty('--total-scale-factor', String(viewport.scale));
  layer.dataset.page = String(pageNum);
  layer.replaceChildren();
  try {
    const textContent = await page.getTextContent({ includeMarkedContent: true });
    const textLayer = new pdfjsLib.TextLayer({ textContentSource: textContent, container: layer, viewport });
    await textLayer.render();
  } catch (error) {
    console.warn('MathReader text layer unavailable for page', pageNum, error);
  }
}

async function renderPage(pageNum, targetCanvas, wrap, kind = 'primary') {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  const baseViewport = page.getViewport({ scale: 1 });
  let scale;
  if (kind === 'reference') {
    const maxWidth = Math.max(180, wrap.clientWidth - 38);
    scale = maxWidth / baseViewport.width;
  } else if (zoomMode === 'fit-width') {
    const maxWidth = Math.max(220, wrap.clientWidth - 46);
    scale = maxWidth / baseViewport.width;
  } else if (zoomMode === 'fit-page') {
    const maxWidth = Math.max(220, wrap.clientWidth - 46);
    const maxHeight = Math.max(220, wrap.clientHeight - 46);
    scale = Math.min(maxWidth / baseViewport.width, maxHeight / baseViewport.height);
  } else {
    scale = zoomScale;
  }
  scale = Math.max(.35, Math.min(scale, 4));
  const viewport = page.getViewport({ scale });
  const targetTextLayer = kind === 'reference' ? referenceTextLayer : primaryTextLayer;
  const targetSurface = kind === 'reference' ? referencePageSurface : primaryPageSurface;
  targetSurface.style.width = `${viewport.width}px`;
  targetSurface.style.height = `${viewport.height}px`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const context = targetCanvas.getContext('2d', { alpha: false });
  targetCanvas.width = Math.floor(viewport.width * dpr);
  targetCanvas.height = Math.floor(viewport.height * dpr);
  targetCanvas.style.width = `${viewport.width}px`;
  targetCanvas.style.height = `${viewport.height}px`;
  const renderContext = { canvasContext: context, viewport, transform: dpr === 1 ? null : [dpr,0,0,dpr,0,0] };
  if (kind === 'primary' && primaryRenderTask) primaryRenderTask.cancel();
  if (kind === 'reference' && referenceRenderTask) referenceRenderTask.cancel();
  const task = page.render(renderContext);
  if (kind === 'primary') primaryRenderTask = task; else referenceRenderTask = task;
  try {
    await task.promise;
    await renderSelectableText(page, viewport, targetTextLayer, targetSurface, pageNum);
  } catch (error) { if (error?.name !== 'RenderingCancelledException') throw error; }
}

async function renderCurrentPage() {
  if (!pdfDoc) return;
  updateNavigationState();
  try { await renderPage(currentPage, canvas, primaryCanvasWrap, 'primary'); }
  catch (error) { showError(t('This page could not be rendered.', '此页面无法渲染。')); console.error(error); }
}

async function renderReferencePage() {
  updateReferenceStatus();
  const hasReference = Boolean(pdfDoc && pinnedPage);
  pdfWorkspace.classList.toggle('has-reference', hasReference);
  referencePane.classList.toggle('is-hidden', !hasReference);
  if (!hasReference) return;
  try { await renderPage(pinnedPage, referenceCanvas, referenceCanvasWrap, 'reference'); }
  catch (error) { console.error(error); }
}

async function goToPage(page) {
  if (!pdfDoc) return;
  const next = Math.min(Math.max(1, Math.round(Number(page) || 1)), pdfDoc.numPages);
  if (next === currentPage) return;
  currentPage = next;
  hideSelectionToolbar();
  window.getSelection()?.removeAllRanges();
  await renderCurrentPage();
}

function setPinnedPage(page) {
  if (!pdfDoc) return;
  pinnedPage = Math.min(Math.max(1, Number(page) || currentPage), pdfDoc.numPages);
  safeSet(stateKey('pinned'), String(pinnedPage));
  renderReferencePage();
}

function clearPinnedPage() {
  pinnedPage = null;
  safeSet(stateKey('pinned'), '0');
  renderReferencePage();
}

function flattenOutline(items, depth = 0, output = []) {
  for (const item of items || []) {
    output.push({ item, depth: Math.min(depth, 3) });
    if (item.items?.length) flattenOutline(item.items, depth + 1, output);
  }
  return output;
}

async function renderOutline() {
  outlineList.replaceChildren();
  if (!pdfDoc) return;
  try {
    const outline = await pdfDoc.getOutline();
    const flat = flattenOutline(outline);
    outlineCount.textContent = flat.length;
    outlineEmpty.classList.toggle('is-hidden', flat.length > 0);
    if (!flat.length) {
      outlineEmpty.textContent = t('This PDF does not contain an embedded outline.', '此 PDF 没有嵌入式目录。');
      return;
    }
    for (const { item, depth } of flat) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'outline-item';
      button.dataset.depth = String(depth);
      button.textContent = item.title || t('Untitled', '未命名');
      button.addEventListener('click', async () => {
        try {
          let dest = item.dest;
          if (typeof dest === 'string') dest = await pdfDoc.getDestination(dest);
          if (!Array.isArray(dest)) return;
          const pageIndex = await pdfDoc.getPageIndex(dest[0]);
          await goToPage(pageIndex + 1);
        } catch (error) { console.error(error); }
      });
      outlineList.append(button);
    }
  } catch (error) {
    outlineEmpty.textContent = t('The document outline could not be read.', '无法读取文档目录。');
    console.error(error);
  }
}

async function pageText(pageNum) {
  if (textCache.has(pageNum)) return textCache.get(pageNum);
  const page = await pdfDoc.getPage(pageNum);
  const content = await page.getTextContent();
  const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
  textCache.set(pageNum, text);
  return text;
}

function highlightedSnippet(text, query) {
  const low = text.toLocaleLowerCase();
  const q = query.toLocaleLowerCase();
  const index = low.indexOf(q);
  const start = Math.max(0, index - 65);
  const end = Math.min(text.length, index + query.length + 95);
  const before = text.slice(start, index);
  const hit = text.slice(index, index + query.length);
  const after = text.slice(index + query.length, end);
  const frag = document.createDocumentFragment();
  if (start > 0) frag.append('…');
  frag.append(before);
  const mark = document.createElement('span'); mark.className = 'search-hit'; mark.textContent = hit; frag.append(mark);
  frag.append(after);
  if (end < text.length) frag.append('…');
  return frag;
}

async function searchPdf(query) {
  searchResults.replaceChildren();
  const q = query.trim();
  if (!pdfDoc || !q) { searchStatus.textContent = ''; return; }
  searchStatus.textContent = t('Searching…', '正在搜索……');
  const matches = [];
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    searchStatus.textContent = t(`Searching page ${page} of ${pdfDoc.numPages}…`, `正在搜索第 ${page} / ${pdfDoc.numPages} 页……`);
    try {
      const text = await pageText(page);
      if (text.toLocaleLowerCase().includes(q.toLocaleLowerCase())) matches.push({ page, text });
    } catch (error) { console.error(error); }
    if (page % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  searchStatus.textContent = t(`${matches.length} matching page${matches.length === 1 ? '' : 's'}`, `${matches.length} 个匹配页面`);
  for (const match of matches.slice(0, 100)) {
    const item = document.createElement('button');
    item.type = 'button'; item.className = 'search-result';
    const label = document.createElement('strong'); label.textContent = t(`Page ${match.page}`, `第 ${match.page} 页`);
    const snippet = document.createElement('p'); snippet.append(highlightedSnippet(match.text, q));
    item.append(label, snippet);
    item.addEventListener('click', () => goToPage(match.page));
    searchResults.append(item);
  }
}

function renderBookmarks() {
  bookmarkList.replaceChildren();
  bookmarkEmpty.classList.toggle('is-hidden', bookmarks.length > 0);
  bookmarks.sort((a,b) => a.page - b.page);
  for (const bookmark of bookmarks) {
    const row = document.createElement('div'); row.className = 'bookmark-item';
    const jump = document.createElement('button'); jump.type = 'button'; jump.className = 'bookmark-jump';
    const strong = document.createElement('strong'); strong.textContent = t(`Page ${bookmark.page}`, `第 ${bookmark.page} 页`);
    const detail = document.createElement('span'); detail.textContent = bookmark.created ? new Date(bookmark.created).toLocaleDateString(root.dataset.lang === 'zh' ? 'zh-CN' : 'en-US') : '';
    jump.append(strong, detail); jump.addEventListener('click', () => goToPage(bookmark.page));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'bookmark-remove'; remove.textContent = '×'; remove.setAttribute('aria-label', t('Remove bookmark', '删除书签'));
    remove.addEventListener('click', () => {
      bookmarks = bookmarks.filter((item) => item.page !== bookmark.page);
      safeSet(stateKey('bookmarks'), JSON.stringify(bookmarks));
      renderBookmarks();
    });
    row.append(jump, remove); bookmarkList.append(row);
  }
}

function addCurrentBookmark() {
  if (!pdfDoc || bookmarks.some((item) => item.page === currentPage)) return;
  bookmarks.push({ page: currentPage, created: Date.now() });
  safeSet(stateKey('bookmarks'), JSON.stringify(bookmarks));
  renderBookmarks();
}

async function openPdfFile(file) {
  if (!file || (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
    showError(t('Please choose a PDF file.', '请选择 PDF 文件。'));
    return;
  }
  setLoading(true, t('Opening PDF…', '正在打开 PDF……'));
  try {
    const lib = await ensurePdfJs();
    const data = new Uint8Array(await file.arrayBuffer());
    if (pdfDoc) { try { await pdfDoc.destroy(); } catch (_) {} }
    const task = lib.getDocument({ data });
    pdfDoc = await task.promise;
    currentFileName = file.name;
    currentFileKey = `${file.name}:${file.size}:${file.lastModified || 0}`;
    textCache = new Map();
    currentSelection = null;
    refreshSelectionUI();
    hideSelectionToolbar();
    loadDocumentState();
    documentTitle.textContent = file.name;
    pageCount.textContent = pdfDoc.numPages;
    enableReaderControls(true);
    welcome.classList.add('is-hidden');
    pdfWorkspace.classList.remove('is-hidden');
    renderBookmarks();
    await Promise.all([renderOutline(), renderCurrentPage()]);
    await renderReferencePage();
    updateReferenceStatus();
  } catch (error) {
    console.error(error);
    pdfDoc = null;
    showError(error?.message || t('This PDF could not be opened.', '无法打开此 PDF。'));
  } finally {
    setLoading(false);
    fileInput.value = '';
  }
}

async function changeZoom(delta) {
  if (!pdfDoc) return;
  if (zoomMode !== 'custom') {
    const page = await pdfDoc.getPage(currentPage);
    const baseViewport = page.getViewport({ scale: 1 });
    const renderedWidth = canvas.getBoundingClientRect().width;
    zoomScale = renderedWidth > 0 ? renderedWidth / baseViewport.width : 1.2;
  }
  zoomMode = 'custom';
  zoomScale = Math.max(.4, Math.min(3.5, zoomScale + delta));
  updateZoomLabel();
  renderCurrentPage();
}

function setFitMode(mode) {
  if (!pdfDoc) return;
  zoomMode = mode;
  updateZoomLabel();
  renderCurrentPage();
}

function activatePanel(panelId) {
  document.querySelectorAll('.sidebar-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.panel === panelId));
  document.querySelectorAll('.sidebar-panel').forEach((panel) => panel.classList.toggle('is-active', panel.id === panelId));
}

document.querySelectorAll('.sidebar-tab').forEach((tab) => tab.addEventListener('click', () => activatePanel(tab.dataset.panel)));

openButton.addEventListener('click', () => fileInput.click());
welcomeOpen.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => openPdfFile(fileInput.files?.[0]));
prevPage.addEventListener('click', () => goToPage(currentPage - 1));
nextPage.addEventListener('click', () => goToPage(currentPage + 1));
pageNumberInput.addEventListener('change', () => goToPage(pageNumberInput.value));
zoomIn.addEventListener('click', () => changeZoom(.15));
zoomOut.addEventListener('click', () => changeZoom(-.15));
zoomLabel.addEventListener('click', () => setFitMode('fit-width'));
fitPage.addEventListener('click', () => setFitMode('fit-page'));
pinPageButton.addEventListener('click', () => setPinnedPage(currentPage));
pinFromSidebar.addEventListener('click', () => setPinnedPage(currentPage));
unpinPage.addEventListener('click', clearPinnedPage);
referencePrev.addEventListener('click', () => { if (pinnedPage && pinnedPage > 1) setPinnedPage(pinnedPage - 1); });
referenceNext.addEventListener('click', () => { if (pinnedPage && pdfDoc && pinnedPage < pdfDoc.numPages) setPinnedPage(pinnedPage + 1); });
addBookmark.addEventListener('click', addCurrentBookmark);
searchForm.addEventListener('submit', (event) => { event.preventDefault(); searchPdf(searchInput.value); });

pageNote.addEventListener('input', () => {
  if (!pdfDoc) return;
  notes[String(currentPage)] = pageNote.value;
  noteSaveState.textContent = t('Saving…', '正在保存……');
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    safeSet(stateKey('notes'), JSON.stringify(notes));
    noteSaveState.textContent = t('Saved locally', '已保存到本地');
  }, 250);
});


[selectionToolbar, copySelectionText, copySelectionLatex, selectionToNote].forEach((node) => node?.addEventListener('pointerdown', (event) => event.preventDefault()));
selectionToolbar.addEventListener('pointerdown', (event) => event.preventDefault());
copySelectionText.addEventListener('click', () => copyPlainText(currentSelection?.text, copySelectionText));
copySelectionLatex.addEventListener('click', () => copyPlainText(currentSelection?.latex, copySelectionLatex));
selectionToNote.addEventListener('click', addSelectionToPageNote);
floatingCopyText.addEventListener('click', () => copyPlainText(currentSelection?.text, floatingCopyText));
floatingCopyLatex.addEventListener('click', () => copyPlainText(currentSelection?.latex, floatingCopyLatex));
floatingAddNote.addEventListener('click', () => { addSelectionToPageNote(); hideSelectionToolbar(); });
floatingPinPage.addEventListener('click', () => { if (currentSelection?.page) setPinnedPage(currentSelection.page); hideSelectionToolbar(); });
document.addEventListener('selectionchange', capturePdfSelection);
primaryCanvasWrap.addEventListener('scroll', hideSelectionToolbar, { passive: true });
referenceCanvasWrap.addEventListener('scroll', hideSelectionToolbar, { passive: true });

languageButton.addEventListener('click', () => applyLanguage(root.dataset.lang === 'zh' ? 'en' : 'zh'));
themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

leftToggle.addEventListener('click', () => {
  if (matchMedia('(max-width: 860px)').matches) {
    shell.classList.toggle('mobile-left-open'); shell.classList.remove('mobile-right-open');
  } else shell.classList.toggle('left-collapsed');
  setTimeout(() => { if (pdfDoc) { renderCurrentPage(); renderReferencePage(); } }, 200);
});
rightToggle.addEventListener('click', () => {
  if (matchMedia('(max-width: 860px)').matches) {
    shell.classList.toggle('mobile-right-open'); shell.classList.remove('mobile-left-open');
  } else shell.classList.toggle('right-collapsed');
  setTimeout(() => { if (pdfDoc) { renderCurrentPage(); renderReferencePage(); } }, 200);
});

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); fileInput.click(); return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault(); activatePanel('search-panel');
    if (matchMedia('(max-width: 860px)').matches) shell.classList.add('mobile-left-open');
    else shell.classList.remove('left-collapsed');
    searchInput.focus(); return;
  }
  if (!typing && pdfDoc && event.key === 'ArrowLeft') goToPage(currentPage - 1);
  if (!typing && pdfDoc && event.key === 'ArrowRight') goToPage(currentPage + 1);
  if (event.key === 'Escape') { shell.classList.remove('mobile-left-open','mobile-right-open'); hideSelectionToolbar(); window.getSelection()?.removeAllRanges(); }
});

let dragDepth = 0;
window.addEventListener('dragenter', (event) => { event.preventDefault(); dragDepth += 1; dropOverlay.classList.remove('is-hidden'); });
window.addEventListener('dragover', (event) => { event.preventDefault(); });
window.addEventListener('dragleave', (event) => { event.preventDefault(); dragDepth -= 1; if (dragDepth <= 0) { dragDepth = 0; dropOverlay.classList.add('is-hidden'); } });
window.addEventListener('drop', (event) => {
  event.preventDefault(); dragDepth = 0; dropOverlay.classList.add('is-hidden');
  const file = [...(event.dataTransfer?.files || [])].find((item) => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf'));
  if (file) openPdfFile(file); else showError(t('Drop a PDF file to open it.', '请拖入 PDF 文件。'));
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (pdfDoc && zoomMode !== 'custom') { renderCurrentPage(); renderReferencePage(); } }, 180);
});

applyTheme(root.dataset.theme, false);
applyLanguage(root.dataset.lang, false);
updateReferenceStatus();
refreshSelectionUI();
renderBookmarks();
