const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm';
const TRANSFORMERS_RUNTIME = 'Transformers.js 4.3.1';
const MATH_OCR_MODEL = 'Xenova/texify';
const LOCAL_DB_NAME = 'mathreader-local-v1';
const LOCAL_DB_VERSION = 1;

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
const continuousStack = el('continuous-stack');
const pageNumberInput = el('page-number');
const pageCount = el('page-count');
const prevPage = el('prev-page');
const nextPage = el('next-page');
const zoomIn = el('zoom-in');
const zoomOut = el('zoom-out');
const zoomLabel = el('zoom-label');
const fitPage = el('fit-page');
const flowButton = el('flow-button');
const pinPageButton = el('pin-page');
const pinFromSidebar = el('pin-from-sidebar');
const referenceStatus = el('reference-status');
const referencePageLabel = el('reference-page-label');
const primaryPageLabel = el('primary-page-label');
const referencePrev = el('reference-prev');
const referenceNext = el('reference-next');
const unpinPage = el('unpin-page');
const pageNote = el('page-note');
const notePreview = el('note-preview');
const notePageChip = el('note-page-chip');
const noteSaveState = el('note-save-state');
const addBookmark = el('add-bookmark');
const bookmarkList = el('bookmark-list');
const bookmarkEmpty = el('bookmark-empty');
const historyList = el('history-list');
const historyEmpty = el('history-empty');
const historyCount = el('history-count');
const welcomeRecent = el('welcome-recent');
const welcomeRecentList = el('welcome-recent-list');
const outlineList = el('outline-list');
const outlineEmpty = el('outline-empty');
const outlineCount = el('outline-count');
const outlineSource = el('outline-source');
const structureIndex = el('structure-index');
const structureEmpty = el('structure-empty');
const structureCount = el('structure-count');
const buildStructureIndexButton = el('build-structure-index');
const exportReadingDataButton = el('export-reading-data');
const importReadingDataButton = el('import-reading-data');
const importReadingInput = el('import-reading-input');
const readingBackButton = el('reading-back');
const readingTrailList = el('reading-trail-list');
const readingTrailEmpty = el('reading-trail-empty');
const readingTrailCount = el('reading-trail-count');
const readingTrailClear = el('reading-trail-clear');
const saveOcrEquation = el('save-ocr-equation');
const selectionGoReference = el('selection-go-reference');
const selectionHighlight = el('selection-highlight');
const selectionMarginNote = el('selection-margin-note');
const annotationList = el('annotation-list');
const annotationEmpty = el('annotation-empty');
const annotationCount = el('annotation-count');
const primaryAnnotationLayer = el('primary-annotation-layer');
const referenceAnnotationLayer = el('reference-annotation-layer');
const referenceStack = el('reference-stack');
const commandPalette = el('command-palette');
const commandInput = el('command-input');
const commandList = el('command-list');
const searchForm = el('search-form');
const searchInput = el('search-input');
const searchStatus = el('search-status');
const searchResults = el('search-results');
const searchMatchCase = el('search-match-case');
const searchWholeWord = el('search-whole-word');
const documentTitle = el('document-title');
const loadingOverlay = el('loading-overlay');
const loadingText = el('loading-text');
const errorBanner = el('error-banner');
const dropOverlay = el('drop-overlay');
const languageButton = el('language-button');
const languageLabel = el('language-label');
const themeButton = el('theme-button');
const themeIcon = el('theme-icon');
const themeLabel = el('theme-label');
const leftToggle = el('left-toggle');
const bothPanelsToggle = el('both-panels-toggle');
const rightToggle = el('right-toggle');
const rightSidebar = el('right-sidebar');
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
const floatingHighlight = el('floating-highlight');
const floatingMarginNote = el('floating-margin-note');
const floatingPinPage = el('floating-pin-page');
const mathOcrButton = el('math-ocr-button');
const primaryOcrLayer = el('primary-ocr-layer');
const referenceOcrLayer = el('reference-ocr-layer');
const ocrPageChip = el('ocr-page-chip');
const ocrSourceBadge = el('ocr-source-badge');
const ocrStatus = el('ocr-status');
const ocrResult = el('ocr-result');
const ocrPreview = el('ocr-preview');
const ocrLatexPreview = el('ocr-latex-preview');
const copyOcrLatex = el('copy-ocr-latex');
const ocrToNote = el('ocr-to-note');
const tryImageOcrButton = el('try-image-ocr');
const tryPdfVectorButton = el('try-pdf-vector');
const clearOcrResultButton = el('clear-ocr-result');
const ocrHistoryList = el('ocr-history-list');
const ocrHistoryEmpty = el('ocr-history-empty');
const ocrHistoryCount = el('ocr-history-count');
const ocrHistoryToggle = el('ocr-history-toggle');
const ocrEngineSelect = el('ocr-engine-mode');
const ocrRetryButton = el('ocr-retry');
const ocrCapability = el('ocr-capability');
const formulaExtractionSelect = el('formula-extraction-mode');
const ocrProcessing = el('ocr-processing');
const ocrProcessingText = el('ocr-processing-text');
const resetDisplay = el('reset-display');
const flowSingle = el('flow-single');
const flowContinuous = el('flow-continuous');
const pageToneSelect = el('page-tone');
const brightnessRange = el('brightness-range');
const brightnessValue = el('brightness-value');
const contrastRange = el('contrast-range');
const contrastValue = el('contrast-value');
const gapRange = el('gap-range');
const gapValue = el('gap-value');
const pageShadow = el('page-shadow');

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
let annotations = [];
let textCache = new Map();
let pdfModulePromise = null;
let noteTimer = null;
let annotationSaveTimer = null;
let resizeTimer = null;
let selectionTimer = null;
let currentSelection = null;
let scrollByPage = {};
let referenceScrollByPage = {};
let localLibrary = [];
let dbPromise = null;
let sessionSaveTimer = null;
let cacheEnabledForCurrent = false;
let restoringSession = false;
let ocrMode = false;
let ocrDrag = null;
let mathOcrPipeline = null;
let mathOcrModulePromise = null;
let mathOcrLoading = false;
let mathOcrBackend = null;
let mathOcrEngineMode = 'official';
let formulaExtractionMode = 'image';
let readerWidthObserver = null;
let readerWidthTimer = null;
let lastObservedReaderWidth = 0;
let fitWidthStabilizing = false;
let currentOcrResult = null;
let ocrHistory = [];
let ocrHistoryExpanded = false;
let notePreviewTimer = null;
let continuousScrollTop = 0;
let continuousSavedAnchor = null;
let continuousLayoutWidth = 0;
let continuousLayoutHeight = 0;
let continuousObserver = null;
let continuousGeneration = 0;
let continuousPageNodes = new Map();
let continuousScrollTimer = null;
let readingFlow = 'continuous';
let pageTone = 'auto';
let displayBrightness = 100;
let displayContrast = 100;
let displayGap = 20;
let displayShadow = true;
let inferredOutline = [];
let outlineMode = 'none';
let editingBookmarkId = null;
let pendingRecoveryRecordId = null;
let structureEntries = [];
let structureIndexVersion = 0;
let structureIndexBuilding = false;
let structureIndexBuildToken = 0;
let referencePages = [];
let readingBackStack = [];
let suppressReadingHistory = false;

const t = (en, zh) => root.dataset.lang === 'zh' ? zh : en;
const safeGet = (key, fallback = null) => { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
mathOcrEngineMode = safeGet('mathreader-ocr-engine-v4', 'official');
formulaExtractionMode = safeGet('mathreader-formula-method-v1', 'image') === 'vector' ? 'vector' : 'image';

const DISPLAY_PREFS_KEY = 'mathreader-display-v3';
const LEGACY_DISPLAY_PREFS_KEYS = ['mathreader-display-v2','mathreader-display-v1'];
const SEARCH_PREFS_KEY = 'mathreader-search-options-v1';
const WORKSPACE_COLLAPSE_KEY = 'mathreader-workspace-collapse-v1';
const STRUCTURE_INDEX_VERSION = 1;
const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

function loadDisplayPreferences() {
  let saved = null;
  let migratedFrom = null;
  try { saved = JSON.parse(safeGet(DISPLAY_PREFS_KEY, 'null')); } catch (_) { saved = null; }
  if (!saved || typeof saved !== 'object') {
    for (const key of LEGACY_DISPLAY_PREFS_KEYS) {
      try { saved = JSON.parse(safeGet(key, 'null')); } catch (_) { saved = null; }
      if (saved && typeof saved === 'object') { migratedFrom = key; break; }
    }
  }
  if (saved && typeof saved === 'object') {
    readingFlow = saved.flow === 'single' ? 'single' : 'continuous';
    pageTone = ['auto','original','soft-dark','warm'].includes(saved.tone) ? saved.tone : 'auto';
    const oldDefault = migratedFrom && Number(saved.brightness) === 96;
    const oldContrastDefault = migratedFrom && Number(saved.contrast) === 96;
    displayBrightness = oldDefault ? 100 : clamp(saved.brightness, 70, 115, 100);
    displayContrast = oldContrastDefault ? 100 : clamp(saved.contrast, 80, 120, 100);
    displayGap = clamp(saved.gap, 8, 44, 20);
    displayShadow = saved.shadow !== false;
  } else {
    readingFlow = 'continuous';
    displayBrightness = 100;
    displayContrast = 100;
  }
  if (migratedFrom) persistDisplayPreferences();
}
function persistDisplayPreferences() {
  safeSet(DISPLAY_PREFS_KEY, JSON.stringify({
    flow: readingFlow,
    tone: pageTone,
    brightness: displayBrightness,
    contrast: displayContrast,
    gap: displayGap,
    shadow: displayShadow
  }));
}

function resolvedPageTone() {
  if (pageTone === 'auto') return root.dataset.theme === 'dark' ? 'soft-dark' : 'original';
  return pageTone;
}

function updateDisplayControls() {
  flowSingle?.classList.toggle('is-active', readingFlow === 'single');
  flowContinuous?.classList.toggle('is-active', readingFlow === 'continuous');
  if (pageToneSelect) pageToneSelect.value = pageTone;
  if (brightnessRange) brightnessRange.value = String(displayBrightness);
  if (contrastRange) contrastRange.value = String(displayContrast);
  if (gapRange) gapRange.value = String(displayGap);
  if (pageShadow) pageShadow.checked = displayShadow;
  if (brightnessValue) brightnessValue.textContent = `${displayBrightness}%`;
  if (contrastValue) contrastValue.textContent = `${displayContrast}%`;
  if (gapValue) gapValue.textContent = `${displayGap} px`;
  if (flowButton) {
    flowButton.textContent = readingFlow === 'continuous' ? t('Continuous', '连续阅读') : t('Single page', '单页阅读');
    const action = readingFlow === 'continuous' ? t('Switch to single-page reading', '切换到单页阅读') : t('Switch to continuous reading', '切换到连续阅读');
    flowButton.title = action;
    flowButton.setAttribute('aria-label', action);
    flowButton.setAttribute('aria-pressed', readingFlow === 'continuous' ? 'true' : 'false');
  }
}

function applyPageDisplay({ persist = true } = {}) {
  root.dataset.pageTone = resolvedPageTone();
  root.dataset.pageShadow = displayShadow ? 'on' : 'off';
  root.style.setProperty('--pdf-brightness', String(displayBrightness / 100));
  root.style.setProperty('--pdf-contrast', String(displayContrast / 100));
  root.style.setProperty('--continuous-gap', `${displayGap}px`);
  updateDisplayControls();
  if (persist) persistDisplayPreferences();
}

async function setReadingFlow(flow, { persist = true, render = true } = {}) {
  const next = flow === 'continuous' ? 'continuous' : 'single';
  const changed = readingFlow !== next;
  if (readingFlow === 'continuous') continuousScrollTop = primaryCanvasWrap?.scrollTop || continuousScrollTop;
  readingFlow = next;
  primaryCanvasWrap?.classList.toggle('continuous-mode', next === 'continuous');
  primaryPageSurface?.classList.toggle('is-hidden', next === 'continuous');
  continuousStack?.classList.toggle('is-hidden', next !== 'continuous');
  if (next === 'single') clearContinuousObserver();
  applyOcrModeToSurfaces();
  updateDisplayControls();
  if (persist) persistDisplayPreferences();
  if (pdfDoc && render && (changed || next === 'continuous')) await renderCurrentPage();
  if (pdfDoc) persistDocumentState();
}

function resetDisplayPreferences() {
  readingFlow = 'continuous';
  pageTone = 'auto';
  displayBrightness = 100;
  displayContrast = 100;
  displayGap = 20;
  displayShadow = true;
  applyPageDisplay();
  setReadingFlow('continuous', { persist: true, render: true });
}


function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function openLocalDb() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          store.createIndex('openedAt', 'openedAt');
        }
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { dbPromise = null; reject(request.error || new Error('Could not open local database')); };
      request.onblocked = () => console.warn('MathReader local database upgrade is blocked by another tab.');
    });
  }
  return dbPromise;
}

async function dbGet(storeName, key) {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readonly');
  return idbRequest(tx.objectStore(storeName).get(key));
}

async function dbPut(storeName, value) {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readwrite');
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB write aborted'));
  });
  const request = tx.objectStore(storeName).put(value);
  await idbRequest(request);
  return done;
}

async function dbDelete(storeName, key) {
  const db = await openLocalDb();
  const tx = db.transaction(storeName, 'readwrite');
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('IndexedDB delete failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB delete aborted'));
  });
  const request = tx.objectStore(storeName).delete(key);
  await idbRequest(request);
  return done;
}

async function dbGetAllDocuments() {
  const db = await openLocalDb();
  const tx = db.transaction('documents', 'readonly');
  return idbRequest(tx.objectStore('documents').getAll());
}

async function dbGetAllFiles() {
  const db = await openLocalDb();
  const tx = db.transaction('files', 'readonly');
  return idbRequest(tx.objectStore('files').getAll());
}

async function dbMetaGet(key) {
  const record = await dbGet('meta', key);
  return record?.value ?? null;
}

async function dbMetaSet(key, value) {
  return dbPut('meta', { key, value });
}

async function requestPersistentLocalStorage() {
  try {
    if (navigator.storage?.persisted && navigator.storage?.persist) {
      const already = await navigator.storage.persisted();
      if (!already) await navigator.storage.persist();
    }
  } catch (_) {}
}

function makeFileKey(name, size, lastModified) {
  return `${name}:${Number(size) || 0}:${Number(lastModified) || 0}`;
}

function activePanelId() {
  return document.querySelector('.sidebar-tab.is-active')?.dataset.panel || 'outline-panel';
}

function snapshotSession() {
  const anchor = readingFlow === 'continuous' ? (captureContinuousAnchor() || continuousSavedAnchor) : continuousSavedAnchor;
  return {
    version: 12,
    page: currentPage,
    pinnedPage,
    zoomMode,
    zoomScale,
    bookmarks,
    notes,
    annotations,
    scrollByPage,
    referenceScrollByPage,
    continuousScrollTop,
    continuousAnchor: anchor,
    selection: currentSelection,
    ocrResult: currentOcrResult,
    ocrHistory,
    inferredOutline,
    structureEntries,
    structureIndexVersion,
    referencePages,
    readingBackStack,
    searchQuery: searchInput?.value || '',
    ui: {
      activePanel: activePanelId(),
      leftCollapsed: shell.classList.contains('left-collapsed'),
      rightCollapsed: shell.classList.contains('right-collapsed')
    }
  };
}

function clearLegacyDocumentState(id) {
  if (!id) return;
  for (const suffix of ['page','bookmarks','notes','pinned','session-v2']) {
    try { localStorage.removeItem(`mathreader:${id}:${suffix}`); } catch (_) {}
  }
}

function scheduleDbSessionSave() {
  if (!cacheEnabledForCurrent || !currentFileKey) return;
  clearTimeout(sessionSaveTimer);
  sessionSaveTimer = setTimeout(async () => {
    try {
      const record = await dbGet('documents', currentFileKey);
      if (!record) return;
      record.session = snapshotSession();
      record.lastPage = currentPage;
      record.updatedAt = Date.now();
      await dbPut('documents', record);
      await refreshLocalLibrary();
    } catch (error) {
      console.warn('MathReader could not update its local session cache.', error);
    }
  }, 300);
}

function formatHistoryTime(timestamp) {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat(root.dataset.lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(timestamp));
  } catch (_) { return ''; }
}

function renderLocalLibrary() {
  historyList?.replaceChildren();
  welcomeRecentList?.replaceChildren();
  historyCount.textContent = String(localLibrary.length);
  historyEmpty.classList.toggle('is-hidden', localLibrary.length > 0);
  welcomeRecent.classList.toggle('is-hidden', localLibrary.length === 0 || Boolean(pdfDoc));

  for (const record of localLibrary) {
    const row = document.createElement('div'); row.className = 'history-item';
    if (!record.localAvailable) row.classList.add('is-unavailable');
    const open = document.createElement('button'); open.type = 'button'; open.className = 'history-open';
    const title = document.createElement('strong'); title.textContent = record.name || t('Untitled PDF', '未命名 PDF');
    const meta = document.createElement('span'); meta.className = 'history-meta';
    const page = document.createElement('span'); page.textContent = t(`Page ${record.lastPage || record.session?.page || 1}`, `第 ${record.lastPage || record.session?.page || 1} 页`);
    const time = document.createElement('span'); time.textContent = formatHistoryTime(record.openedAt);
    meta.append(page); if (time.textContent) meta.append(time);
    if (!record.localAvailable) {
      const missing = document.createElement('span'); missing.className = 'history-unavailable'; missing.textContent = t('Local PDF copy unavailable', '本地 PDF 副本不可用'); meta.append(missing);
    }
    open.append(title, meta);
    open.disabled = !record.localAvailable;
    if (record.localAvailable) open.addEventListener('click', () => openCachedDocument(record.id));
    const recover = document.createElement('button'); recover.type = 'button'; recover.className = 'history-recover'; recover.textContent = t('Reopen', '重新选择');
    recover.classList.toggle('is-hidden', record.localAvailable);
    recover.addEventListener('click', () => { pendingRecoveryRecordId = record.id; fileInput.click(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'history-remove'; remove.textContent = '×';
    remove.setAttribute('aria-label', t('Forget local copy', '忘记本地副本'));
    remove.title = t('Forget local copy', '忘记本地副本');
    remove.addEventListener('click', async () => {
      try {
        await Promise.all([dbDelete('documents', record.id), dbDelete('files', record.id)]);
        clearLegacyDocumentState(record.id);
        const last = await dbMetaGet('lastDocumentId');
        if (last === record.id) await dbMetaSet('lastDocumentId', null);
        if (currentFileKey === record.id) cacheEnabledForCurrent = false;
        await refreshLocalLibrary();
      } catch (error) { console.warn(error); }
    });
    row.append(open, recover, remove); historyList.append(row);
  }

  for (const record of localLibrary.filter((item) => item.localAvailable).slice(0, 4)) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'welcome-recent-item';
    const title = document.createElement('strong'); title.textContent = record.name || t('Untitled PDF', '未命名 PDF');
    const meta = document.createElement('span');
    const time = formatHistoryTime(record.openedAt);
    meta.textContent = t(`Page ${record.lastPage || record.session?.page || 1}${time ? ` · ${time}` : ''}`, `第 ${record.lastPage || record.session?.page || 1} 页${time ? ` · ${time}` : ''}`);
    button.append(title, meta); button.addEventListener('click', () => openCachedDocument(record.id));
    welcomeRecentList.append(button);
  }
}
async function refreshLocalLibrary() {
  try {
    const [records, files] = await Promise.all([dbGetAllDocuments(), dbGetAllFiles()]);
    const fileIds = new Set(files.filter((item) => item?.blob).map((item) => item.id));
    localLibrary = records.map((record) => ({ ...record, localAvailable: fileIds.has(record.id) && !record.cacheError }))
      .sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0));
  } catch (_) {
    localLibrary = [];
  }
  renderLocalLibrary();
}
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

function updateHeaderControls() {
  const lang = root.dataset.lang === 'zh' ? 'zh' : 'en';
  const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
  if (languageLabel) languageLabel.textContent = lang === 'zh' ? 'EN' : '中文';
  if (languageButton) {
    const text = lang === 'zh' ? 'Switch to English' : '切换到简体中文';
    languageButton.title = text;
    languageButton.setAttribute('aria-label', text);
  }
  if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
  if (themeLabel) themeLabel.textContent = theme === 'dark' ? t('Light', '浅色') : t('Dark', '深色');
  if (themeButton) {
    const text = theme === 'dark' ? t('Switch to light mode', '切换到浅色模式') : t('Switch to dark mode', '切换到深色模式');
    themeButton.title = text;
    themeButton.setAttribute('aria-label', text);
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
  updateHeaderControls();
  document.title = next === 'zh' ? 'MathReader｜汲绍达' : 'MathReader | Shaoda Ji';
  if (!pdfDoc) documentTitle.textContent = t('No PDF open', '尚未打开 PDF');
  updateReferenceStatus();
  updateZoomLabel();
  updateDisplayControls();
  updateOcrCapability();
  updateOutlineSource();
  renderBookmarks();
  renderLocalLibrary();
  refreshSelectionUI();
  refreshOcrUI();
  renderAnnotationList();
  updateWorkspaceCollapseButtons();
  if (persist) safeSet('shaoda-language', next);
}

function applyTheme(theme, persist = true) {
  const next = theme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = next;
  updateHeaderControls();
  applyPageDisplay({ persist: false });
  if (persist) safeSet('shaoda-theme', next);
}

function loadSearchPreferences() {
  let saved = null;
  try { saved = JSON.parse(safeGet(SEARCH_PREFS_KEY, 'null')); } catch (_) { saved = null; }
  if (searchMatchCase) searchMatchCase.checked = Boolean(saved?.matchCase);
  if (searchWholeWord) searchWholeWord.checked = Boolean(saved?.wholeWord);
}

function persistSearchPreferences() {
  safeSet(SEARCH_PREFS_KEY, JSON.stringify({ matchCase: Boolean(searchMatchCase?.checked), wholeWord: Boolean(searchWholeWord?.checked) }));
}

function loadWorkspaceCollapseState() {
  let saved = null;
  try { saved = JSON.parse(safeGet(WORKSPACE_COLLAPSE_KEY, 'null')); } catch (_) { saved = null; }
  const defaults = new Set(['selection-section','note-section','annotations-section','reading-trail-section','reference-section','shortcuts-section']);
  document.querySelectorAll('#right-sidebar > .workspace-section').forEach((section) => {
    const collapsed = saved && Object.prototype.hasOwnProperty.call(saved, section.id) ? Boolean(saved[section.id]) : defaults.has(section.id);
    section.classList.toggle('is-collapsed', collapsed);
  });
}

function persistWorkspaceCollapseState() {
  const state = {};
  document.querySelectorAll('#right-sidebar > .workspace-section').forEach((section) => { if (section.id) state[section.id] = section.classList.contains('is-collapsed'); });
  safeSet(WORKSPACE_COLLAPSE_KEY, JSON.stringify(state));
}

function updateWorkspaceCollapseButtons() {
  document.querySelectorAll('#right-sidebar > .workspace-section').forEach((section) => {
    const button = section.querySelector(':scope > .panel-heading .section-collapse-button');
    if (!button) return;
    const collapsed = section.classList.contains('is-collapsed');
    button.textContent = collapsed ? '▸' : '▾';
    const label = collapsed ? t('Expand section', '展开模块') : t('Collapse section', '收起模块');
    button.title = label; button.setAttribute('aria-label', label); button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });
}

function setupWorkspaceCollapsibles() {
  loadWorkspaceCollapseState();
  document.querySelectorAll('#right-sidebar > .workspace-section').forEach((section) => {
    if (!section.id) return;
    const heading = section.querySelector(':scope > .panel-heading');
    if (!heading || heading.querySelector('.section-collapse-button')) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'section-collapse-button';
    button.addEventListener('click', () => { section.classList.toggle('is-collapsed'); persistWorkspaceCollapseState(); updateWorkspaceCollapseButtons(); });
    heading.append(button);
  });
  updateWorkspaceCollapseButtons();
}

function expandWorkspaceSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.classList.remove('is-collapsed'); persistWorkspaceCollapseState(); updateWorkspaceCollapseButtons();
}

function stateKey(kind) {
  return currentFileKey ? `mathreader:${currentFileKey}:${kind}` : null;
}

const BOOKMARK_COLORS = ['red','blue','green','yellow','purple'];
function normalizedBookmarkColor(value) { return BOOKMARK_COLORS.includes(value) ? value : 'blue'; }
function normalizeBookmarks(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item && Number(item.page) >= 1).map((item, index) => ({
    id: item.id || `bm-${Number(item.created) || Date.now()}-${index}`,
    page: Number(item.page),
    title: typeof item.title === 'string' ? item.title : '',
    note: typeof item.note === 'string' ? item.note : '',
    color: normalizedBookmarkColor(item.color),
    created: Number(item.created) || Date.now(),
    type: item.type === 'equation' ? 'equation' : 'page',
    latex: typeof item.latex === 'string' ? item.latex : '',
    preview: typeof item.preview === 'string' ? item.preview : ''
  }));
}

function loadDocumentState(cachedSession = null) {
  bookmarks = [];
  notes = {};
  annotations = [];
  scrollByPage = {};
  referenceScrollByPage = {};
  continuousScrollTop = 0;
  continuousSavedAnchor = null;
  currentSelection = null;
  currentOcrResult = null;
  ocrHistory = [];
  ocrHistoryExpanded = false;
  inferredOutline = [];
  outlineMode = 'none';
  structureEntries = [];
  structureIndexVersion = 0;
  referencePages = [];
  readingBackStack = [];
  zoomMode = 'fit-width';
  zoomScale = 1.2;
  searchInput.value = '';
  shell.classList.remove('mobile-left-open', 'mobile-right-open');
  shell.classList.add('left-collapsed', 'right-collapsed');
  activatePanel('outline-panel', false);

  let session = cachedSession;
  if (!session) {
    try { session = JSON.parse(safeGet(stateKey('session-v2'), 'null')); } catch (_) { session = null; }
  }

  if (session && typeof session === 'object') {
    bookmarks = normalizeBookmarks(session.bookmarks);
    notes = session.notes && typeof session.notes === 'object' ? session.notes : {};
    annotations = normalizeAnnotations(session.annotations);
    const savedPage = Number(session.page || 1);
    currentPage = Number.isFinite(savedPage) ? Math.min(Math.max(1, savedPage), pdfDoc.numPages) : 1;
    const savedPinned = Number(session.pinnedPage || 0);
    pinnedPage = savedPinned >= 1 && savedPinned <= pdfDoc.numPages ? savedPinned : null;
    zoomMode = ['fit-width','fit-page','custom'].includes(session.zoomMode) ? session.zoomMode : 'fit-width';
    const savedScale = Number(session.zoomScale || 1.2);
    zoomScale = Number.isFinite(savedScale) ? Math.min(Math.max(.35, savedScale), 4) : 1.2;
    scrollByPage = session.scrollByPage && typeof session.scrollByPage === 'object' ? session.scrollByPage : {};
    referenceScrollByPage = session.referenceScrollByPage && typeof session.referenceScrollByPage === 'object' ? session.referenceScrollByPage : {};
    continuousScrollTop = Number.isFinite(Number(session.continuousScrollTop)) ? Math.max(0, Number(session.continuousScrollTop)) : 0;
    const savedAnchor = session.continuousAnchor;
    if (savedAnchor && Number.isFinite(Number(savedAnchor.page))) {
      continuousSavedAnchor = {
        page: Math.min(Math.max(1, Number(savedAnchor.page)), pdfDoc.numPages),
        ratio: Math.min(1, Math.max(0, Number(savedAnchor.ratio) || 0))
      };
    }
    currentSelection = session.selection?.text ? session.selection : null;
    currentOcrResult = session.ocrResult?.latex ? session.ocrResult : null;
    ocrHistory = Array.isArray(session.ocrHistory) ? session.ocrHistory.slice(0, 10) : [];
    inferredOutline = Array.isArray(session.inferredOutline) ? session.inferredOutline.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.title === 'string').slice(0, 240) : [];
    structureEntries = Array.isArray(session.structureEntries) ? session.structureEntries.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.title === 'string').slice(0, 500) : [];
    structureIndexVersion = Number(session.structureIndexVersion || 0);
    if (structureIndexVersion !== STRUCTURE_INDEX_VERSION) {
      structureEntries = [];
      structureIndexVersion = 0;
    }
    referencePages = Array.isArray(session.referencePages) ? session.referencePages.map(Number).filter((page, index, values) => page >= 1 && page <= pdfDoc.numPages && values.indexOf(page) === index).slice(0, 4) : [];
    readingBackStack = normalizeReadingTrail(session.readingBackStack);
    if (pinnedPage && !referencePages.includes(pinnedPage)) referencePages.unshift(pinnedPage);
    // v59 tightens inferred-outline filtering so formula lines are not mistaken
    // for section headings. Rebuild any pre-v7 inferred outline once, and also
    // discard older entries that lack an in-page ratio.
    if (Number(session.version || 0) < 7 || (inferredOutline.length && inferredOutline.some((entry) => !Number.isFinite(Number(entry.ratio))))) inferredOutline = [];
    searchInput.value = typeof session.searchQuery === 'string' ? session.searchQuery : '';
    if (Number(session.version || 0) >= 4) {
      shell.classList.toggle('left-collapsed', Boolean(session.ui?.leftCollapsed));
      shell.classList.toggle('right-collapsed', Boolean(session.ui?.rightCollapsed));
    } else {
      // One-time v46 layout migration: older sessions were created when both
      // sidebars opened by default. Start them collapsed once; future choices
      // are saved normally in session v4.
      shell.classList.add('left-collapsed', 'right-collapsed');
    }
    if (session.ui?.activePanel) activatePanel(session.ui.activePanel, false);
  } else {
    const rawBookmarks = safeGet(stateKey('bookmarks'));
    const rawNotes = safeGet(stateKey('notes'));
    try { if (rawBookmarks) bookmarks = normalizeBookmarks(JSON.parse(rawBookmarks)); } catch (_) {}
    try { if (rawNotes) notes = JSON.parse(rawNotes); } catch (_) {}
    const savedPage = Number(safeGet(stateKey('page'), '1'));
    currentPage = Number.isFinite(savedPage) ? Math.min(Math.max(1, savedPage), pdfDoc.numPages) : 1;
    const savedPinned = Number(safeGet(stateKey('pinned'), '0'));
    pinnedPage = savedPinned >= 1 && savedPinned <= pdfDoc.numPages ? savedPinned : null;
  }
  refreshSelectionUI();
  refreshOcrUI();
  renderAnnotationList();
  updateZoomLabel();
  updateReadingBackButton();
  renderReadingTrail();
}

function persistDocumentState() {
  if (!currentFileKey) return;
  const session = snapshotSession();
  safeSet(stateKey('page'), String(currentPage));
  safeSet(stateKey('bookmarks'), JSON.stringify(bookmarks));
  safeSet(stateKey('notes'), JSON.stringify(notes));
  safeSet(stateKey('pinned'), pinnedPage ? String(pinnedPage) : '0');
  safeSet(stateKey('session-v2'), JSON.stringify(session));
  scheduleDbSessionSave();
}

async function cacheOpenedPdf(meta, blob) {
  try {
    await requestPersistentLocalStorage();
    await dbPut('files', { id: meta.id, blob });
    const existing = await dbGet('documents', meta.id);
    const now = Date.now();
    await dbPut('documents', {
      id: meta.id,
      name: meta.name,
      size: meta.size,
      lastModified: meta.lastModified,
      createdAt: existing?.createdAt || now,
      openedAt: now,
      updatedAt: now,
      lastPage: currentPage,
      session: snapshotSession()
    });
    await dbMetaSet('lastDocumentId', meta.id);
    cacheEnabledForCurrent = true;
    await refreshLocalLibrary();
  } catch (error) {
    cacheEnabledForCurrent = false;
    console.warn('MathReader could not cache this PDF locally.', error);
    showError(t('The PDF opened, but the browser could not cache a local copy. Notes and reading position will still use fallback local storage.', 'PDF 已打开，但浏览器无法缓存本地副本。页注与阅读位置仍会使用备用本地存储。'));
  }
}

async function touchCachedPdf(record) {
  try {
    delete record.cacheError;
    record.openedAt = Date.now();
    record.updatedAt = Date.now();
    record.lastPage = currentPage;
    record.session = snapshotSession();
    await dbPut('documents', record);
    await dbMetaSet('lastDocumentId', record.id);
    cacheEnabledForCurrent = true;
    await refreshLocalLibrary();
  } catch (error) { console.warn(error); }
}

function enableReaderControls(enabled) {
  [prevPage,nextPage,pageNumberInput,zoomIn,zoomOut,zoomLabel,fitPage,flowButton,mathOcrButton,pinPageButton,pinFromSidebar,addBookmark,buildStructureIndexButton,exportReadingDataButton,importReadingDataButton].forEach((node) => { if (node) node.disabled = !enabled; });
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
  pageNote.value = notes[String(currentPage)] || ''; scheduleNotePreview();
  noteSaveState.textContent = t('Saved locally', '已保存到本地');
  persistDocumentState();
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



function setOcrStatus(message, working = false) {
  if (!ocrStatus) return;
  ocrStatus.textContent = message;
  ocrStatus.classList.toggle('is-working', working);
}

function setOcrProcessing(active) {
  if (!ocrProcessing) return;
  if (active) {
    // Formula extraction has one authoritative busy indicator: the right
    // workspace. Reopen it for every OCR invocation so returning to the tab,
    // a previously collapsed sidebar, or a collapsed section cannot hide the
    // next processing state.
    openRightSectionShortcut('ocr-section');
    ocrProcessing.classList.remove('is-hidden');
    if (ocrProcessingText) ocrProcessingText.textContent = t('Processing…', '处理中…');
  } else {
    ocrProcessing.classList.add('is-hidden');
  }
}

function latexLineSeparator() { return ' ' + String.fromCharCode(92, 92, 10); }

function normalizeOcrLatex(value) {
  let text = String(value || '').trim();
  if (!text) return '';
  text = text
    .replace(/<\/?s>/gi, '')
    .replace(/<pad>/gi, '')
    .replace(/```(?:latex|tex|math|markdown)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  // Texify may emit several explicit math blocks for a multi-line aligned
  // selection. Preserve all blocks in source order instead of discarding all
  // but the longest one (the old behavior that lost later lines).
  const matches = [];
  const patterns = [
    { re: /\\\[([\s\S]*?)\\\]/g, inner: 1 },
    { re: /\$\$([\s\S]*?)\$\$/g, inner: 1 },
    { re: /\\\(([\s\S]*?)\\\)/g, inner: 1 },
    { re: /(?<!\$)\$([^$\n]+?)\$(?!\$)/g, inner: 1 }
  ];
  for (const { re, inner } of patterns) {
    for (const m of text.matchAll(re)) matches.push({ index: m.index ?? 0, value: String(m[inner] || '').trim() });
  }
  matches.sort((a, b) => a.index - b.index);
  const blocks = matches.map((m) => m.value).filter(Boolean);
  if (blocks.length === 1) text = blocks[0];
  else if (blocks.length > 1) {
    let clean = blocks.filter((block, index) => index === 0 || block !== blocks[index - 1]);

    // Texify occasionally emits a good main formula surrounded by tiny stray
    // math blocks (for example a lone \blacksquare or an index fragment).
    // When there are at least three explicit blocks and one block clearly
    // dominates the others, keep that dominant block instead of fabricating
    // an aligned environment from unrelated fragments. Two-block output is
    // intentionally left untouched because it can be a genuine two-line
    // formula.
    if (clean.length >= 3) {
      const ranked = clean
        .map((block, index) => ({ block, index, length: block.replace(/\s+/g, '').length }))
        .sort((a, b) => b.length - a.length);
      const first = ranked[0];
      const second = ranked[1];
      if (first.length >= 72 && first.length >= Math.max(2.6 * second.length, second.length + 48)) {
        clean = [first.block];
      }
    }

    if (clean.length === 1) text = clean[0];
    else if (clean.some((block) => /\\begin\{(?:aligned|array|cases|matrix|pmatrix|bmatrix)\}/.test(block))) {
      text = clean.join(' \\\\ ');
    } else {
      text = `\\begin{aligned}\n${clean.map(markAlignmentRelation).join(latexLineSeparator())}\n\\end{aligned}`;
    }
  }

  if (text.startsWith('$$') && text.endsWith('$$') && text.length > 4) text = text.slice(2, -2).trim();
  if (text.startsWith('\\[') && text.endsWith('\\]') && text.length > 4) text = text.slice(2, -2).trim();
  if (text.startsWith('$') && text.endsWith('$') && !text.startsWith('$$') && text.length > 2) text = text.slice(1, -1).trim();
  return text;
}

function markAlignmentRelation(line) {
  const value = String(line || '').trim();
  if (!value || /&(?:=|\\le|\\ge|\\approx|\\sim|\\to|\\Rightarrow)/.test(value)) return value;
  const patterns = ['\\\\leq?', '\\\\geq?', '\\\\approx', '\\\\sim', '\\\\equiv', '\\\\to', '='];
  for (const pattern of patterns) {
    const re = new RegExp(`(${pattern})`);
    if (re.test(value)) return value.replace(re, '&$1');
  }
  return value;
}
function refreshOcrUI() {
  if (!ocrResult || !ocrHistoryList) return;
  const has = Boolean(currentOcrResult?.latex);
  ocrResult.classList.toggle('is-hidden', !has);
  ocrPageChip.textContent = has ? String(currentOcrResult.page || '—') : '—';
  ocrLatexPreview.value = has ? currentOcrResult.latex : '';
  if (ocrSourceBadge) {
    const source = has ? (currentOcrResult.source || 'image') : '';
    ocrSourceBadge.textContent = !has ? '—' : source === 'vector' ? t('PDF vector', 'PDF 矢量') : t('Image OCR', '图像 OCR');
    ocrSourceBadge.dataset.source = source;
  }
  if (tryImageOcrButton) {
    const source = has ? (currentOcrResult.source || 'image') : '';
    tryImageOcrButton.classList.toggle('is-hidden', !has || source !== 'vector' || !currentOcrResult?.preview);
  }
  if (tryPdfVectorButton) {
    const source = has ? (currentOcrResult.source || 'image') : '';
    tryPdfVectorButton.classList.toggle('is-hidden', !has || source !== 'image' || !currentOcrResult?.vectorAlternative);
  }
  if (has && currentOcrResult.preview) {
    ocrPreview.src = currentOcrResult.preview;
    ocrPreview.classList.remove('is-hidden');
  } else {
    ocrPreview.removeAttribute('src');
    ocrPreview.classList.add('is-hidden');
  }
  ocrHistoryList.replaceChildren();
  ocrHistoryCount.textContent = String(ocrHistory.length);
  ocrHistoryEmpty.classList.toggle('is-hidden', ocrHistory.length > 0);
  const visibleHistory = ocrHistory.slice(0, ocrHistoryExpanded ? 10 : 3);
  for (const item of visibleHistory) {
    if (!item?.latex) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ocr-history-item';
    button.title = t('Click to reopen · double-click to copy LaTeX', '单击重新打开 · 双击复制 LaTeX');
    const label = document.createElement('strong');
    label.textContent = t(`Page ${item.page || '?'}`, `第 ${item.page || '?'} 页`);
    const code = document.createElement('code');
    code.textContent = item.latex.replace(/\s+/g, ' ').trim();
    button.append(label, code);
    button.addEventListener('click', () => {
      currentOcrResult = item;
      refreshOcrUI();
      persistDocumentState();
    });
    button.addEventListener('dblclick', async (event) => {
      event.preventDefault();
      await copyPlainText(item.latex);
      button.classList.add('is-copied');
      setOcrStatus(t('LaTeX copied from recent extraction.', '已从最近公式提取中复制 LaTeX。'));
      setTimeout(() => button.classList.remove('is-copied'), 700);
    });
    ocrHistoryList.append(button);
  }
  if (ocrHistoryToggle) {
    const canToggle = ocrHistory.length > 3;
    ocrHistoryToggle.classList.toggle('is-hidden', !canToggle);
    ocrHistoryToggle.textContent = ocrHistoryExpanded ? t('Less', '收起') : t(`More (${Math.min(7, Math.max(0, ocrHistory.length - 3))})`, `更多 (${Math.min(7, Math.max(0, ocrHistory.length - 3))})`);
    ocrHistoryToggle.setAttribute('aria-expanded', ocrHistoryExpanded ? 'true' : 'false');
  }
}

function allOcrLayers() {
  return [...document.querySelectorAll('.ocr-select-layer')];
}

function resetOcrBoxes() {
  for (const layer of allOcrLayers()) {
    layer.classList.remove('is-selecting');
    const box = layer.querySelector('.ocr-selection-box');
    if (box) box.removeAttribute('style');
  }
}

function applyOcrModeToSurfaces() {
  primaryPageSurface?.classList.toggle('ocr-mode', ocrMode && readingFlow === 'single');
  referencePageSurface?.classList.toggle('ocr-mode', ocrMode && Boolean(pinnedPage));
  continuousStack?.querySelectorAll('.continuous-page-surface').forEach((surface) => surface.classList.toggle('ocr-mode', ocrMode && readingFlow === 'continuous'));
}

function setOcrMode(active) {
  ocrMode = Boolean(active && pdfDoc);
  mathOcrButton?.classList.toggle('is-active', ocrMode);
  mathOcrButton?.setAttribute('aria-pressed', ocrMode ? 'true' : 'false');
  applyOcrModeToSurfaces();
  resetOcrBoxes();
  ocrDrag = null;
  if (ocrMode) {
    hideSelectionToolbar();
    window.getSelection()?.removeAllRanges();
    setOcrStatus(formulaExtractionMode === 'image' ? t('Drag around one formula. Image OCR is the default; press Esc to cancel.', '请框选一个公式。默认使用图像 OCR；按 Esc 取消。') : t('Drag around one formula. PDF vector extraction is selected; press Esc to cancel.', '请框选一个公式。当前选择 PDF 矢量提取；按 Esc 取消。')); 
    if (matchMedia('(max-width: 860px)').matches) shell.classList.add('mobile-right-open');
    else shell.classList.remove('right-collapsed');
  } else if (!mathOcrLoading) {
    setOcrStatus(mathOcrBackend ? t(`Image OCR default · ${mathOcrBackend.label} ready · PDF vector fallback available`, `默认图像 OCR · ${mathOcrBackend.label} 已就绪 · PDF 矢量备用可用`) : t('Ready. Image OCR is the default formula extractor.', '就绪。默认使用图像 OCR 提取公式。')); 
  }
}

function normalizedOcrEngineMode(value) {
  return ['official','webgpu','wasm'].includes(value) ? value : 'official';
}

function currentOcrPlan() {
  const mode = normalizedOcrEngineMode(mathOcrEngineMode);
  if (mode === 'webgpu') {
    // Xenova/texify ships Transformers.js-ready merged q4f16 weights.
    return [{ device: 'webgpu', dtype: 'q4f16', label: 'Texify · WebGPU q4f16', official: false }];
  }
  if (mode === 'wasm') {
    return [{ device: 'wasm', dtype: 'q8', label: 'Texify · CPU/WASM q8', official: false }];
  }
  // The model-card browser path is the default. Xenova/texify is packaged
  // specifically for Transformers.js and includes merged decoder weights.
  return [{ device: null, dtype: null, label: 'Texify · recommended CPU', official: true }];
}

function updateOcrCapability(extra = '') {
  if (!ocrCapability) return;
  const gpu = Boolean(navigator.gpu);
  const engine = mathOcrBackend ? mathOcrBackend.label : t('not loaded', '尚未加载');
  const method = formulaExtractionMode === 'image' ? t('Image OCR default', '默认图像 OCR') : t('PDF vector default', '默认 PDF 矢量');
  const base = t(`${method} · ${TRANSFORMERS_RUNTIME} · GPU: ${gpu ? 'available' : 'unavailable'} · Active image engine: ${engine}`, `${method} · ${TRANSFORMERS_RUNTIME} · GPU：${gpu ? '可用' : '不可用'} · 当前图像引擎：${engine}`);
  ocrCapability.textContent = extra ? `${base} · ${extra}` : base;
}

async function disposeMathOcrPipeline() {
  const pipe = mathOcrPipeline;
  mathOcrPipeline = null;
  mathOcrBackend = null;
  mathOcrModulePromise = null;
  updateOcrCapability();
  try { await pipe?.dispose?.(); } catch (_) {}
}

function releaseMathOcrPipelineAfterExtraction() {
  // Transformers.js 4.3.1 can leave a browser inference session unusable
  // after a completed/failed generation. A fresh pipeline for each user
  // selection avoids carrying that session state into the next rectangle,
  // while keeping the imported runtime and browser-cached model files.
  // Detach synchronously so cleanup itself can never keep the UI locked.
  const pipe = mathOcrPipeline;
  mathOcrPipeline = null;
  if (!pipe?.dispose) return;
  Promise.resolve()
    .then(() => pipe.dispose())
    .catch((error) => console.warn('MathReader OCR pipeline cleanup failed', error));
}

function friendlyOcrError(error, backend = null) {
  const raw = String(error?.message || error || '').trim();
  const lower = raw.toLowerCase();
  if (/out of memory|allocation|memory/.test(lower)) return t('The OCR model ran out of browser memory. Close other heavy tabs or switch OCR Engine to Compatibility · CPU.', '公式 OCR 模型的浏览器内存不足。请关闭其他占用较大的标签页，或将识别引擎切换到“兼容模式 · CPU”。');
  if (/webgpu|gpu|adapter|device lost/.test(lower)) return t('WebGPU could not initialize on this browser. Switch OCR Engine to Compatibility · CPU and retry.', '此浏览器无法初始化 WebGPU。请将识别引擎切换到“兼容模式 · CPU”后重试。');
  if (/could not locate file|model_file_not_found|404/.test(lower)) return t('The formula-image model repository is missing a file required by this runtime. MathReader uses Xenova/texify, which is packaged specifically for Transformers.js with merged decoder weights.', '公式图像模型仓库缺少当前运行时所需文件。MathReader 使用专为 Transformers.js 打包并提供 merged decoder 权重的 Xenova/texify。');
  if (/fetch|network|failed to load|404|403|cors/.test(lower)) return t('The OCR engine could not download its model files. Check access to Hugging Face/jsDelivr, then press Reload engine. MathReader uses the browser-compatible Texify formula model.', '公式 OCR 无法下载模型文件。请检查是否可以访问 Hugging Face/jsDelivr，然后点击“重新加载引擎”。MathReader 使用兼容浏览器的 Texify 公式识别模型。');
  if (/image_mean|image_std|number of channels|channels in the image|channel mismatch/.test(lower)) return t('The image-OCR preprocessor rejected the selected region. Reload the page; if this persists, report the exact message.', '图像 OCR 预处理拒绝了框选区域。请重新载入页面；若仍出现此问题，请报告完整错误信息。');
  if (/scale|dequant|onnx|session|can't create a session|cannot create.*session/.test(lower)) return t(`The ${backend?.label || 'ONNX'} engine failed to initialize under ${TRANSFORMERS_RUNTIME}. Recommended mode follows the model card's browser path; reload the engine or try WebGPU as a diagnostic alternative.`, `${backend?.label || 'ONNX'} 引擎在 ${TRANSFORMERS_RUNTIME} 下初始化失败。推荐模式遵循模型卡的浏览器路径；请重新加载引擎，或尝试 WebGPU 作为诊断性备选。`);
  return raw || t('Image OCR fallback failed to initialize.', '图像 OCR 备用引擎初始化失败。');
}

function detailedOcrError(error, backend = null) {
  const friendly = friendlyOcrError(error, backend);
  const technical = String(error?.message || error || '').replace(/\s+/g, ' ').trim();
  if (!technical || technical === friendly) return friendly;
  return `${friendly} · ${t('Technical', '技术信息')}: ${technical.slice(0, 520)}`;
}

async function ensureMathOcrPipeline() {
  if (mathOcrPipeline) return mathOcrPipeline;
  mathOcrLoading = true;
  setOcrStatus(t(`Loading the local formula-image fallback (Texify · ${TRANSFORMERS_RUNTIME})…`, `正在加载本地公式图像备用引擎（Texify · ${TRANSFORMERS_RUNTIME}）……`), true);
  try {
    if (!mathOcrModulePromise) mathOcrModulePromise = import(TRANSFORMERS_URL);
    const { pipeline } = await mathOcrModulePromise;
    const plan = currentOcrPlan();
    let lastError = null;
    for (let index = 0; index < plan.length; index += 1) {
      const backend = plan[index];
      try {
        setOcrStatus(t(`Initializing ${backend.label}…`, `正在初始化 ${backend.label}……`), true);
        const progress_callback = (info) => {
          if (!info) return;
          if (info.status === 'progress' && Number.isFinite(Number(info.progress))) {
            const raw = Number(info.progress);
            const percent = Math.max(0, Math.min(100, raw <= 1 ? raw * 100 : raw));
            setOcrStatus(t(`Downloading image-OCR fallback (${backend.label})… ${Math.round(percent)}%`, `正在下载图像 OCR 备用模型（${backend.label}）…… ${Math.round(percent)}%`), true);
          } else if (info.status === 'initiate' || info.status === 'download') {
            setOcrStatus(t(`First image-only use: downloading Texify for ${backend.label}…`, `首次图像识别：正在下载 ${backend.label} 的 Texify 公式识别模型……`), true);
          }
        };
        const options = { progress_callback };
        if (!backend.official) {
          options.device = backend.device;
          options.dtype = backend.dtype;
        }
        const pipe = await pipeline('image-to-text', MATH_OCR_MODEL, options);
        mathOcrPipeline = pipe;
        mathOcrBackend = backend;
        updateOcrCapability();
        setOcrStatus(t(`Formula-image engine ready · ${backend.label}`, `公式图像引擎就绪 · ${backend.label}`));
        return pipe;
      } catch (error) {
        console.warn('MathReader OCR backend failed', backend, error);
        lastError = error;
        if (index + 1 < plan.length) {
          setOcrStatus(t(`${backend.label} failed. Trying ${plan[index + 1].label}…`, `${backend.label} 失败。正在尝试 ${plan[index + 1].label}……`), true);
        }
      }
    }
    throw lastError || new Error('Image OCR fallback unavailable');
  } catch (error) {
    mathOcrPipeline = null;
    mathOcrBackend = null;
    mathOcrModulePromise = null;
    updateOcrCapability(t('load failed', '加载失败'));
    throw error;
  } finally {
    mathOcrLoading = false;
  }
}


async function prepareMathOcrInput(canvas) {
  if (!mathOcrModulePromise) mathOcrModulePromise = import(TRANSFORMERS_URL);
  const { RawImage } = await mathOcrModulePromise;
  if (!RawImage?.fromCanvas) throw new Error('Formula image utilities are unavailable.');
  const image = RawImage.fromCanvas(canvas).rgb();
  if (image.channels !== 3) image.convert(3);
  return image;
}

function formulaInkBounds(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) return null;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  // Ignore near-white antialiasing/noise while retaining light mathematical strokes.
  const threshold = 242;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX >= minX && maxY >= minY ? { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null;
}

function normalizeFormulaCropForOcr(crop, variant = 'tight') {
  const bounds = formulaInkBounds(crop) || { left: 0, top: 0, width: crop.width, height: crop.height };
  const padRatio = variant === 'relaxed' ? 0.115 : 0.055;
  const sourcePad = Math.max(5, Math.round(Math.max(bounds.width, bounds.height) * padRatio));
  const sx = Math.max(0, bounds.left - sourcePad);
  const sy = Math.max(0, bounds.top - sourcePad);
  const sw = Math.min(crop.width - sx, bounds.width + sourcePad * 2);
  const sh = Math.min(crop.height - sy, bounds.height + sourcePad * 2);
  // Texify's processor accepts variable-size formula images. Preserve the
  // formula aspect ratio, remove irrelevant whitespace, and upscale small
  // selections so fine scripts/radicals do not disappear before encoding.
  const longSide = Math.max(1, sw, sh);
  const minLongSide = variant === 'relaxed' ? 760 : 900;
  const maxLongSide = 1440;
  const scale = Math.min(maxLongSide / longSide, Math.max(1, minLongSide / longSide));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const out = document.createElement('canvas');
  out.width = dw;
  out.height = dh;
  const ctx = out.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, dw, dh);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(crop, sx, sy, sw, sh, 0, 0, dw, dh);
  return out;
}

function latexStructuralPenalty(value) {
  const text = String(value || '');
  if (!text.trim()) return 10000;
  let depth = 0;
  let unmatchedClose = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\\' && text[i + 1]) { i += 1; continue; }
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') { if (depth > 0) depth -= 1; else unmatchedClose += 1; }
  }
  let penalty = (depth + unmatchedClose) * 12;
  penalty += (text.match(/\}{3,}/g) || []).length * 15;
  penalty += (text.match(/(\\mathrm\{div\}\s*){2,}/g) || []).length * 18;
  penalty += (text.match(/(\\(?:frac|sqrt|mathrm|text)\b[^\n]{0,28})\1/g) || []).length * 10;
  if (/\\sqrt\{[^\n]{0,80}\\frac\{1\}\{1\}/.test(text)) penalty += 8;
  if (/\\cdot\s*\)/.test(text)) penalty += 8;
  return penalty;
}

function repairOcrLatex(value) {
  let text = normalizeOcrLatex(value);
  if (!text) return '';
  // Drop only closing braces that are provably unmatched at top level. This
  // repairs degeneration such as `\\mathrm{div}}}}` without guessing content.
  let depth = 0;
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) { out += ch + text[i + 1]; i += 1; continue; }
    if (ch === '{') { depth += 1; out += ch; continue; }
    if (ch === '}') { if (depth > 0) { depth -= 1; out += ch; } continue; }
    out += ch;
  }
  if (depth > 0) out += '}'.repeat(depth);
  out = out.replace(/(\\mathrm\{div\})(?:\s*\1)+/g, '$1');

  // Remove only mechanically duplicated arrow commands. This does not infer
  // mathematical content; it fixes decoder artifacts such as `\mapsto \to`.
  out = out
    .replace(/\\mapsto\s*(?:\\to|\\rightarrow)\b/g, '\\mapsto')
    .replace(/(?:\\to|\\rightarrow)\s*\\mapsto\b/g, '\\mapsto');
  return out.replace(/[ \t]+/g, ' ').trim();
}


function assessImageOcrResult(rawValue, latexValue) {
  const raw = String(rawValue || '').trim();
  const latex = String(latexValue || '').trim();
  const reasons = [];
  if (!latex) reasons.push(t('no LaTeX was produced', '没有生成 LaTeX'));
  if (/\\includegraphics\b/i.test(raw) || /\\includegraphics\b/i.test(latex)) {
    reasons.push(t('document-layout placeholders were produced', '生成了文档版面占位符'));
  }
  if (/\\(?:begin|end)\{(?:document|figure|table)\}/i.test(raw)) {
    reasons.push(t('document markup was produced instead of a formula', '生成了文档标记而不是公式'));
  }
  if (latex.length > 1800) reasons.push(t('the output is implausibly long for one selected formula', '单个框选公式的输出异常过长'));
  const includeCount = (raw.match(/\\includegraphics\b/gi) || []).length;
  if (includeCount >= 2) reasons.push(t('the output contains repeated image placeholders', '输出包含重复图像占位符'));
  const commandLoop = raw.match(/(\\[A-Za-z]+(?:\{[^{}]{0,30}\})?)(?:\s*\1){4,}/);
  if (commandLoop) reasons.push(t('the model entered a repeated-token loop', '模型进入了重复 token 循环'));
  const compact = latex.replace(/\s+/g, ' ');
  if (/(.{18,90})(?:\s*\1){3,}/.test(compact)) reasons.push(t('large repeated fragments were detected', '检测到大段重复片段'));

  // Texify can occasionally run away on continued fractions: the visual crop
  // contains only a few levels, but generation keeps nesting \\frac/\\cfrac and
  // repeats coefficient sequences for hundreds of tokens. Reject that failure
  // mode rather than presenting fabricated mathematics as a usable result.
  const fracCount = (latex.match(/\\(?:c?frac)\b/g) || []).length;
  let braceDepth = 0;
  let maxBraceDepth = 0;
  for (let i = 0; i < latex.length; i += 1) {
    if (latex[i] === '\\' && i + 1 < latex.length) { i += 1; continue; }
    if (latex[i] === '{') { braceDepth += 1; maxBraceDepth = Math.max(maxBraceDepth, braceDepth); }
    else if (latex[i] === '}' && braceDepth > 0) braceDepth -= 1;
  }
  if ((fracCount >= 16 && latex.length >= 520) || maxBraceDepth >= 24) {
    reasons.push(t('the formula contains implausible runaway fraction nesting', '公式包含异常的失控分式嵌套'));
  }

  // Token n-grams catch loops whose digits change slightly, which a literal
  // substring test misses (for example a_10,...,a_19 repeated several times).
  const tokens = compact.match(/\\[A-Za-z]+|[A-Za-z]+|\d+|[^\s]/g) || [];
  let repeatedTokenRun = false;
  for (const width of [6, 8, 10, 12]) {
    if (repeatedTokenRun || tokens.length < Math.max(120, width * 4)) break;
    const seen = new Map();
    for (let i = 0; i <= tokens.length - width; i += 1) {
      const key = tokens.slice(i, i + width).join(' ');
      const previous = seen.get(key) || [];
      if (previous.some((at) => i - at >= width && i - at <= width * 12)) {
        for (let j = i + width; j <= tokens.length - width; j += 1) {
          if (tokens.slice(j, j + width).join(' ') === key) { repeatedTokenRun = true; break; }
        }
      }
      if (repeatedTokenRun) break;
      previous.push(i);
      seen.set(key, previous.slice(-4));
    }
  }
  if (repeatedTokenRun) reasons.push(t('a repeated LaTeX token sequence indicates decoder runaway', '重复的 LaTeX token 序列表明解码器发生失控循环'));

  const mathSignal = /\\[A-Za-z]+|[=<>_^{}]|[+\-*\/]|\d/.test(latex);
  const words = latex.match(/[A-Za-z]{3,}/g) || [];
  if (!mathSignal && words.length > 3) reasons.push(t('the output looks like prose rather than mathematics', '输出看起来像普通文本而不是数学公式'));
  return { ok: reasons.length === 0, reasons };
}

function requireUsableImageOcr(rawValue, latexValue) {
  const assessment = assessImageOcrResult(rawValue, latexValue);
  if (assessment.ok) return;
  const reason = assessment.reasons[0] || t('the output failed formula-quality checks', '输出未通过公式质量检查');
  throw new Error(t(`Image OCR result rejected: ${reason}. The previous PDF-vector result was kept.`, `图像 OCR 结果已拒绝：${reason}。已保留之前的 PDF 矢量结果。`));
}


function rectIntersectionRatio(a, b) {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right <= left || bottom <= top) return 0;
  const intersection = (right - left) * (bottom - top);
  const area = Math.max(1, (a.right - a.left) * (a.bottom - a.top));
  return intersection / area;
}

function median(values) {
  const nums = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return 0;
  const middle = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[middle] : (nums[middle - 1] + nums[middle]) / 2;
}

function vectorTextLayerForOcrLayer(layer) {
  const kind = layer?.dataset?.kind || 'primary';
  if (kind === 'reference') return referenceTextLayer;
  if (kind === 'continuous') return layer.closest('.continuous-page-surface')?.querySelector('.textLayer') || null;
  return primaryTextLayer;
}

function latexifyVectorText(text) {
  let out = pdfTextToLatex(text);
  const operators = ['Area','Vol','div','grad','curl','det','tr','rank','Ric','Scal','Hess','supp','dist','diam','Ricci'];
  for (const name of operators) {
    const pattern = new RegExp(`(^|[^A-Za-z\\\\])${name}(?=\\s*\\(|\\s*\\{|\\s*[A-Z_a-z\\\\])`, 'g');
    out = out.replace(pattern, (_, prefix) => `${prefix}\\operatorname{${name}}`);
  }
  return out
    .replace(/\s+([,.;:)\]])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\\(?:cap|cup)\s+/, '')
    .trim();
}

function vectorOperatorName(text) {
  const value = String(text || '').trim();
  return ['sup','inf','lim','limsup','liminf','max','min'].includes(value) ? value : null;
}

function vectorLimitOperatorInfo(token) {
  const raw = String(token?.text || '').trim();
  const named = vectorOperatorName(raw);
  if (named) return { latex: `\\${named}`, raw, lower: true, upper: true };
  const map = {
    '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
    '∑': '\\sum', '∏': '\\prod', '⋃': '\\bigcup', '⋂': '\\bigcap',
    '∪': '\\cup', '∩': '\\cap'
  };
  if (!map[raw]) return null;
  return { latex: map[raw], raw, lower: true, upper: true };
}

function vectorRows(tokens, tolerance) {
  const rows = [];
  for (const token of [...tokens].sort((a, b) => (a.centerY - b.centerY) || (a.left - b.left))) {
    let row = rows.find((candidate) => Math.abs(candidate.centerY - token.centerY) <= tolerance);
    if (!row) {
      row = { tokens: [], centerY: token.centerY };
      rows.push(row);
    }
    row.tokens.push(token);
    row.centerY = median(row.tokens.map((item) => item.centerY));
  }
  for (const row of rows) {
    row.tokens.sort((a, b) => a.left - b.left);
    row.left = Math.min(...row.tokens.map((item) => item.left));
    row.right = Math.max(...row.tokens.map((item) => item.right));
    row.top = Math.min(...row.tokens.map((item) => item.top));
    row.bottom = Math.max(...row.tokens.map((item) => item.bottom));
    row.width = row.right - row.left;
    row.height = row.bottom - row.top;
    row.centerX = (row.left + row.right) / 2;
  }
  return rows.sort((a, b) => a.centerY - b.centerY);
}

function vectorRowSegments(row, baseHeight) {
  const groups = [];
  let group = [];
  let previous = null;
  const flush = () => {
    if (!group.length) return;
    const segment = {
      tokens: group,
      left: Math.min(...group.map((item) => item.left)),
      right: Math.max(...group.map((item) => item.right)),
      top: Math.min(...group.map((item) => item.top)),
      bottom: Math.max(...group.map((item) => item.bottom))
    };
    segment.width = segment.right - segment.left;
    segment.centerX = (segment.left + segment.right) / 2;
    segment.centerY = median(group.map((item) => item.centerY));
    groups.push(segment);
    group = [];
  };
  for (const token of row.tokens) {
    const gap = previous ? token.left - previous.right : 0;
    if (previous && gap > Math.max(baseHeight * 0.72, previous.height * 0.9)) flush();
    group.push(token);
    previous = token;
  }
  flush();
  return groups;
}

function vectorTokenFromRect(text, r, layerRect) {
  return {
    text: cleanPdfGlyphText(text),
    left: r.left - layerRect.left,
    right: r.right - layerRect.left,
    top: r.top - layerRect.top,
    bottom: r.bottom - layerRect.top,
    width: r.width,
    height: r.height,
    centerX: (r.left + r.right) / 2 - layerRect.left,
    centerY: (r.top + r.bottom) / 2 - layerRect.top
  };
}

function vectorGlyphTokensFromTextLayer(textLayer, layerRect, selected) {
  const glyphs = [];
  for (const span of textLayer.querySelectorAll('span')) {
    let emittedForSpan = 0;
    for (const node of span.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue) continue;
      const value = node.nodeValue;
      // DOM Range offsets are UTF-16 code-unit offsets, while mathematical
      // alphanumeric symbols (e.g. 𝑢, 𝛼, 𝐾) are supplementary-plane Unicode
      // code points represented by surrogate pairs. Iterate by code point but
      // advance Range offsets by ch.length so a glyph is never split into two
      // invalid surrogate halves (which previously surfaced as U+FFFD / �).
      let utf16Offset = 0;
      for (const ch of value) {
        const startOffset = utf16Offset;
        utf16Offset += ch.length;
        if (!ch || ch === '\u00ad' || /[\uFE00-\uFE0F]/u.test(ch) || /\s/u.test(ch)) continue;
        let r = null;
        try {
          const range = document.createRange();
          range.setStart(node, startOffset);
          range.setEnd(node, utf16Offset);
          r = range.getBoundingClientRect();
          range.detach?.();
        } catch (_) { r = null; }
        if (!r || !r.width || !r.height) continue;
        const box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        if (rectIntersectionRatio(box, selected) < 0.08) continue;
        glyphs.push(vectorTokenFromRect(ch, r, layerRect));
        emittedForSpan += 1;
      }
    }
    if (emittedForSpan) continue;
    const value = String(span.textContent || '').replace(/\u00ad/g, '').trim();
    if (!value) continue;
    const r = span.getBoundingClientRect();
    const box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    if (rectIntersectionRatio(box, selected) < 0.12) continue;
    glyphs.push(vectorTokenFromRect(value, r, layerRect));
  }
  return glyphs;
}

function dominantVectorHeight(tokens) {
  const heights = tokens.map((token) => token.height).filter((height) => Number.isFinite(height) && height > 0).sort((a, b) => a - b);
  if (!heights.length) return 0;
  const clusters = [];
  for (const height of heights) {
    let cluster = clusters.find((candidate) => Math.abs(candidate.center - height) <= Math.max(1.2, candidate.center * 0.16));
    if (!cluster) {
      cluster = { values: [], center: height };
      clusters.push(cluster);
    }
    cluster.values.push(height);
    cluster.center = median(cluster.values);
  }
  clusters.sort((a, b) => (b.values.length - a.values.length) || (b.center - a.center));
  return clusters[0]?.center || median(heights);
}

function mergeVectorGlyphWords(tokens, baseHeight) {
  if (!tokens.length) return [];
  tokens = tokens.map((token) => ({ ...token, text: cleanPdfGlyphText(token.text) }));
  const rows = vectorRows(tokens, Math.max(1.5, baseHeight * 0.22));
  const merged = [];
  const canMergeChar = (text) => /^[A-Za-z0-9]$/.test(text);
  for (const row of rows) {
    let group = [];
    const flush = () => {
      if (!group.length) return;
      if (group.length === 1) merged.push(group[0]);
      else {
        const text = group.map((token) => token.text).join('');
        merged.push({
          text,
          left: group[0].left,
          right: group[group.length - 1].right,
          top: Math.min(...group.map((token) => token.top)),
          bottom: Math.max(...group.map((token) => token.bottom)),
          width: group[group.length - 1].right - group[0].left,
          height: median(group.map((token) => token.height)),
          centerX: (group[0].left + group[group.length - 1].right) / 2,
          centerY: median(group.map((token) => token.centerY)),
          glyphs: group
        });
      }
      group = [];
    };
    for (const token of row.tokens) {
      if (!canMergeChar(token.text)) { flush(); merged.push(token); continue; }
      if (!group.length) { group.push(token); continue; }
      const previous = group[group.length - 1];
      const gap = token.left - previous.right;
      const similarHeight = Math.abs(token.height - previous.height) <= Math.max(1.2, baseHeight * 0.18);
      const sameKind = /^[A-Za-z]$/.test(previous.text) === /^[A-Za-z]$/.test(token.text);
      if (similarHeight && sameKind && gap <= Math.max(1.5, baseHeight * 0.16)) group.push(token);
      else { flush(); group.push(token); }
    }
    flush();
  }
  return merged;
}

function vectorSegmentWithScripts(segment, pool, baseHeight, excluded = new Set()) {
  const result = [...segment.tokens];
  for (const token of pool) {
    if (result.includes(token) || excluded.has(token) || token.height >= baseHeight * 0.84) continue;
    if (token.left < segment.left - baseHeight * 0.18 || token.left > segment.right + baseHeight * 0.95) continue;
    if (token.centerY < segment.top - baseHeight * 0.62 || token.centerY > segment.bottom + baseHeight * 0.62) continue;
    const nearBase = segment.tokens.some((base) => token.left >= base.left - baseHeight * 0.10 && token.left <= base.right + baseHeight * 1.0);
    if (nearBase) result.push(token);
  }
  return [...new Set(result)];
}

function vectorTokenLatex(token) {
  if (token.syntheticLatex) return token.syntheticLatex;
  const raw = cleanPdfGlyphText(String(token.text || '')).trim();
  const operator = vectorOperatorName(raw);
  if (operator) return `\\${operator}`;
  const namedOperators = new Set(['Area','Vol','div','grad','curl','det','tr','rank','Ric','Ricci','Scal','Hess','supp','dist','diam','Rot','Res','Cov','Pf','Log','arg']);
  if (namedOperators.has(raw)) return `\\operatorname{${raw}}`;
  const standardFunctions = new Set(['sin','cos','tan','cot','sec','csc','sinh','cosh','tanh','log','ln','exp']);
  if (standardFunctions.has(raw)) return `\\${raw}`;
  if (raw === 'd') return '\\,\\mathrm{d}';
  if (/^d[A-Za-z]$/.test(raw)) return `\\,\\mathrm{d}${raw.slice(1)}`;
  return latexifyVectorText(raw);
}

function normalizeVectorDelimiters(latex) {
  let barOpen = true;
  let out = '';
  for (let i = 0; i < latex.length; i += 1) {
    const ch = latex[i];
    if (ch !== '|') { out += ch; continue; }
    out += barOpen ? '\\lvert ' : '\\rvert ';
    barOpen = !barOpen;
  }
  return out
    .replace(/\\parallel\s+/g, '\\Vert ')
    .replace(/\\lvert\s+/g, '\\lvert ')
    .replace(/\\rvert\s+/g, '\\rvert ')
    .replace(/\s+(?=[,.;:)\]])/g, '')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s+(?=[_^]\{)/g, '')
    .replace(/}\s+\(/g, '}(')
    .replace(/\s*\\(subsetneq|subseteq|supseteq|notin|approx|cong|equiv|mapsto|subset|supset|cap|cup|le|ge|ne|sim|ni|in|to)(?![A-Za-z])\s*/g, ' \\$1 ')
    .replace(/\\cdot\s+\\cdot\s+\\cdot/g, '\\cdots')
    .replace(/\\sim\s*=|\\sim\s*\\equiv/g, '\\cong')
    .replace(/\\not\s*=/g, '\\ne')
    .replace(/^\\(?:cap|cup)\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseVectorInline(tokens, baseHeight, overrides = new Map()) {
  if (!tokens.length) return '';
  const usable = [...tokens].sort((a, b) => (a.left - b.left) || (a.centerY - b.centerY));
  const localMaxHeight = Math.max(...usable.map((token) => token.syntheticLatex ? baseHeight : token.height));
  const localLargeHeights = usable
    .filter((token) => token.syntheticLatex || token.height >= localMaxHeight * 0.82)
    .map((token) => token.syntheticLatex ? baseHeight : token.height);
  const referenceHeight = median(localLargeHeights) || baseHeight || localMaxHeight;
  const large = usable.filter((token) => token.syntheticLatex || token.height >= referenceHeight * 0.80);
  const localCenter = median((large.length ? large : usable).map((token) => token.centerY));

  const bases = usable.filter((token) => {
    if (token.syntheticLatex) return true;
    const verticalOffset = Math.abs(token.centerY - localCenter);
    if (token.height < referenceHeight * 0.82 && verticalOffset >= referenceHeight * 0.09) return false;
    if (verticalOffset <= referenceHeight * 0.20) return true;
    return token.height >= referenceHeight * 0.88 && verticalOffset <= referenceHeight * 0.42;
  });
  const scripts = usable.filter((token) => !bases.includes(token));
  const attachments = new Map();
  // TeX often emits an entire exponent/subscript phrase as a raised/lowered
  // run (for example e^{-is\rho\cdot\omega}), not as one tiny glyph. Group
  // those script glyphs geometrically first, then attach the whole run to the
  // closest base immediately to its left.
  const scriptRows = vectorRows(scripts, Math.max(1.2, referenceHeight * 0.20));
  const scriptSegments = scriptRows.flatMap((row) => vectorRowSegments(row, referenceHeight * 0.82));
  for (const segment of scriptSegments) {
    const candidates = bases.filter((base) => {
      if (base.syntheticLatex) return false;
      const startNearBase = segment.left >= base.left - referenceHeight * 0.12 && segment.left <= base.right + referenceHeight * 0.95;
      const vertical = Math.abs(segment.centerY - base.centerY) >= referenceHeight * 0.09;
      return startNearBase && vertical;
    }).sort((a, b) => {
      const aRightPenalty = a.right <= segment.left + referenceHeight * 0.20 ? 0 : referenceHeight * 0.9;
      const bRightPenalty = b.right <= segment.left + referenceHeight * 0.20 ? 0 : referenceHeight * 0.9;
      const da = Math.abs(segment.left - a.right) + Math.abs(segment.centerY - a.centerY) * 0.18 + aRightPenalty;
      const db = Math.abs(segment.left - b.right) + Math.abs(segment.centerY - b.centerY) * 0.18 + bRightPenalty;
      return da - db;
    });
    const target = candidates[0];
    if (!target) continue;
    const kind = segment.centerY < target.centerY ? 'super' : 'sub';
    if (!attachments.has(target)) attachments.set(target, { sub: [], super: [] });
    attachments.get(target)[kind].push(...segment.tokens);
  }

  const orderedBases = bases.sort((a, b) => a.left - b.left);
  const renderBase = (base) => {
    let value = overrides.get(base) || vectorTokenLatex(base);
    const attached = attachments.get(base);
    if (attached?.sub?.length) value += `_{${parseVectorInline(attached.sub, referenceHeight * 0.78)}}`;
    if (attached?.super?.length) value += `^{${parseVectorInline(attached.super, referenceHeight * 0.78)}}`;
    return value;
  };

  let latex = '';
  let previousRight = null;
  for (let index = 0; index < orderedBases.length; index += 1) {
    const base = orderedBases[index];
    const raw = String(base.text || '').trim();
    let value = renderBase(base);
    if (!value) continue;

    if (raw === '√' || value === '\\sqrt{}') {
      const radicand = [];
      let lastRight = base.right;
      let cursor = index + 1;
      for (; cursor < orderedBases.length; cursor += 1) {
        const next = orderedBases[cursor];
        const nextRaw = String(next.text || '').trim();
        const gap = next.left - lastRight;
        if (/^(?:=|≤|≥|<|>|≈|≠|,|;)$/.test(nextRaw)) break;
        if (gap > referenceHeight * 0.82 && radicand.length) break;
        radicand.push(next);
        lastRight = next.right;
      }
      if (radicand.length) {
        const first = radicand[0];
        const last = radicand[radicand.length - 1];
        const radicandTokens = usable.filter((token) => token !== base
          && token.left >= first.left - referenceHeight * 0.12
          && token.right <= last.right + referenceHeight * 0.42
          && token.centerY >= localCenter - referenceHeight * 0.88
          && token.centerY <= localCenter + referenceHeight * 0.88);
        value = `\\sqrt{${parseVectorInline(radicandTokens, referenceHeight, overrides)}}`;
        index = cursor - 1;
      }
    }

    if (previousRight !== null) {
      const gap = base.left - previousRight;
      const valueStartsLetter = /^[A-Za-z]/.test(value);
      const wordLike = valueStartsLetter && /[A-Za-z]$/.test(latex);
      const controlWordBoundary = valueStartsLetter && /\\[A-Za-z]+$/.test(latex);
      if (controlWordBoundary || gap > referenceHeight * 0.48 || (wordLike && gap > referenceHeight * 0.16)) latex += ' ';
    }
    latex += value;
    previousRight = Math.max(previousRight ?? base.right, base.right);
  }
  return normalizeVectorDelimiters(latex);
}

function vectorFindLimitSegment(rows, op, direction, baseHeight, usedSegments = new Set()) {
  let best = null;
  for (const row of rows) {
    const delta = row.centerY - op.centerY;
    if (direction === 'lower' && (delta <= baseHeight * 0.10 || delta > baseHeight * 2.6)) continue;
    if (direction === 'upper' && (delta >= -baseHeight * 0.10 || delta < -baseHeight * 2.6)) continue;
    for (const segment of vectorRowSegments(row, baseHeight)) {
      if (usedSegments.has(segment) || segment.tokens.includes(op)) continue;
      const horizontalNear = segment.left <= op.right + baseHeight * 2.0 && segment.right >= op.left - baseHeight * 0.65;
      if (!horizontalNear) continue;
      const centerDistance = Math.abs(segment.centerX - op.centerX);
      if (centerDistance > Math.max(baseHeight * 1.75, segment.width * 0.55)) continue;
      const verticalDistance = Math.abs(delta);
      const score = verticalDistance + centerDistance * 0.28 + Math.max(0, segment.width - baseHeight * 6) * 0.15;
      if (!best || score < best.score) best = { segment, score };
    }
  }
  return best?.segment || null;
}

function vectorRelationRow(row) {
  const joined = row.tokens.map((token) => token.text).join('');
  return /[=<>≤≥≈≅≠]/.test(joined);
}

function vectorAlignedLine(latex, first = false) {
  const value = String(latex || '').trim();
  if (!value) return '';
  const leading = value.match(/^(=|\\le|\\ge|\\approx|\\cong|\\ne)(.*)$/);
  if (leading) return `&${leading[1]} ${leading[2].trim()}`;
  const match = value.match(/^(.*?)(=|\\le|\\ge|\\approx|\\cong|\\ne)(.*)$/);
  if (!match) return first ? value : `&${value}`;
  return `${match[1].trim()} &${match[2]} ${match[3].trim()}`;
}

function vectorAccentCommand(text) {
  const raw = String(text || '').trim();
  if (['ˆ','̂','^'].includes(raw)) return '\\widehat';
  if (['˜','̃','~'].includes(raw)) return '\\widetilde';
  if (['¯','‾','̄'].includes(raw)) return '\\overline';
  if (['˙','̇'].includes(raw)) return '\\dot';
  return null;
}

function vectorBuildAccentTokens(tokens, mainRow, baseHeight, consumed) {
  const synthetic = [];
  const accents = tokens.filter((token) => !consumed.has(token)
    && vectorAccentCommand(token.text)
    && Math.abs(token.centerY - mainRow.centerY) <= baseHeight * 1.05);
  for (const accent of accents) {
    const command = vectorAccentCommand(accent.text);
    const pad = accent.width <= baseHeight * 0.8 ? baseHeight * 0.10 : baseHeight * 0.18;
    let targets = tokens.filter((token) => token !== accent
      && !vectorAccentCommand(token.text)
      && !consumed.has(token)
      && token.centerX >= accent.left - pad
      && token.centerX <= accent.right + pad
      && Math.abs(token.centerY - mainRow.centerY) <= baseHeight * 0.72);
    if (!targets.length) continue;
    if (accent.width <= baseHeight * 0.8 && targets.length > 1) {
      targets = [targets.reduce((best, token) => Math.abs(token.centerX - accent.centerX) < Math.abs(best.centerX - accent.centerX) ? token : best, targets[0])];
    }
    targets.sort((a, b) => a.left - b.left);
    const latex = parseVectorInline(targets, baseHeight);
    if (!latex) continue;
    targets.forEach((token) => consumed.add(token));
    consumed.add(accent);
    synthetic.push({
      syntheticLatex: `${command}{${latex}}`,
      text: `${accent.text}${targets.map((token) => token.text).join('')}`,
      left: Math.min(...targets.map((token) => token.left)),
      right: Math.max(...targets.map((token) => token.right)),
      top: Math.min(accent.top, ...targets.map((token) => token.top)),
      bottom: Math.max(...targets.map((token) => token.bottom)),
      width: Math.max(...targets.map((token) => token.right)) - Math.min(...targets.map((token) => token.left)),
      height: baseHeight,
      centerX: (Math.min(...targets.map((token) => token.left)) + Math.max(...targets.map((token) => token.right))) / 2,
      centerY: mainRow.centerY
    });
  }
  return synthetic;
}

function extractVectorFormulaFromTokens(tokens, allowMultiline = true, baseHeightHint = 0) {
  if (!tokens?.length) return null;
  const baseHeight = baseHeightHint || dominantVectorHeight(tokens) || median(tokens.map((token) => token.height));
  if (!baseHeight) return null;
  const baseRows = vectorRows(tokens.filter((token) => token.height >= baseHeight * 0.68), Math.max(1.8, baseHeight * 0.28));

  if (allowMultiline) {
    const relationRows = baseRows.filter((row) => vectorRelationRow(row) && median(row.tokens.map((token) => token.height)) >= baseHeight * 0.82).sort((a, b) => a.centerY - b.centerY);
    const distinct = relationRows.filter((row, index) => index === 0 || Math.abs(row.centerY - relationRows[index - 1].centerY) > baseHeight * 0.62);
    if (distinct.length >= 2) {
      const parsed = [];
      for (let index = 0; index < distinct.length; index += 1) {
        const row = distinct[index];
        const topBoundary = index === 0 ? -Infinity : (distinct[index - 1].centerY + row.centerY) / 2;
        const bottomBoundary = index === distinct.length - 1 ? Infinity : (row.centerY + distinct[index + 1].centerY) / 2;
        const slice = tokens.filter((token) => token.centerY > topBoundary && token.centerY <= bottomBoundary);
        const result = extractVectorFormulaFromTokens(slice, false, baseHeight);
        if (result?.latex) parsed.push(result);
      }
      if (parsed.length >= 2) {
        const lines = parsed.map((item, index) => vectorAlignedLine(item.latex, index === 0));
        return {
          latex: `\\begin{aligned} ${lines.join(' \\\\ ')} \\end{aligned}`,
          text: parsed.map((item) => item.text).join(' / '),
          tokenCount: tokens.length,
          multiline: true
        };
      }
    }
  }

  const baseCandidates = tokens.filter((token) => token.height >= baseHeight * 0.68);
  const largeRows = vectorRows(baseCandidates, Math.max(1.8, baseHeight * 0.30));
  const rowScore = (row) => {
    const joined = row.tokens.map((token) => token.text).join(' ');
    const relationBoost = /[=<>≤≥≈≅≠]/.test(joined) ? baseHeight * 6 : 0;
    const operatorBoost = row.tokens.some((token) => vectorLimitOperatorInfo(token)) ? baseHeight * 3.5 : 0;
    const sizeBoost = median(row.tokens.map((token) => token.height)) * row.tokens.length * 0.25;
    return row.width + row.tokens.length * baseHeight * 0.18 + relationBoost + operatorBoost + sizeBoost;
  };
  const mainRow = largeRows.sort((a, b) => rowScore(b) - rowScore(a))[0];
  if (!mainRow) return null;
  const mainCenter = mainRow.centerY;
  const consumed = new Set();
  const overrides = new Map();
  const syntheticAccents = vectorBuildAccentTokens(tokens, mainRow, baseHeight, consumed);

  const allRows = vectorRows(tokens.filter((token) => !mainRow.tokens.includes(token) && !consumed.has(token)), Math.max(1.8, baseHeight * 0.30));
  const usedLimitSegments = new Set();
  const syntheticOperators = [];
  const operatorTokens = tokens.filter((token) => vectorLimitOperatorInfo(token)
    && Math.abs(token.centerY - mainCenter) <= baseHeight * 1.55);
  for (const op of operatorTokens) {
    const info = vectorLimitOperatorInfo(op);
    const lowerSegment = vectorFindLimitSegment(allRows, op, 'lower', baseHeight, usedLimitSegments);
    const upperSegment = vectorFindLimitSegment(allRows, op, 'upper', baseHeight, usedLimitSegments);
    let lowerLatex = '';
    let upperLatex = '';
    if (lowerSegment) {
      usedLimitSegments.add(lowerSegment);
      const lowerTokens = vectorSegmentWithScripts(lowerSegment, tokens, baseHeight, consumed);
      lowerTokens.forEach((token) => consumed.add(token));
      lowerLatex = parseVectorInline(lowerTokens, baseHeight * 0.78);
    }
    if (upperSegment) {
      usedLimitSegments.add(upperSegment);
      const upperTokens = vectorSegmentWithScripts(upperSegment, tokens, baseHeight, consumed);
      upperTokens.forEach((token) => consumed.add(token));
      upperLatex = parseVectorInline(upperTokens, baseHeight * 0.78);
    }
    if (['∫','∬','∭','∮'].includes(info.raw)) {
      const compactLower = lowerLatex.replace(/\s+/g, '');
      if (/^Rn$/.test(compactLower) || /^R\^\{?n\}?$/.test(compactLower)) lowerLatex = '\\mathbb{R}^{n}';
      else if (compactLower === 'R') lowerLatex = '\\mathbb{R}';
    }
    let command = info.latex;
    if ((info.raw === '∪' || info.raw === '∩') && (lowerLatex || upperLatex)) command = info.raw === '∪' ? '\\bigcup' : '\\bigcap';
    if (lowerLatex) command += `_{${lowerLatex}}`;
    if (upperLatex) command += `^{${upperLatex}}`;
    if (mainRow.tokens.includes(op)) {
      if (lowerLatex || upperLatex || vectorOperatorName(info.raw) || ['∫','∬','∭','∮','∑','∏','⋃','⋂'].includes(info.raw)) overrides.set(op, command);
    } else {
      consumed.add(op);
      syntheticOperators.push({
        syntheticLatex: command,
        text: op.text,
        left: op.left,
        right: op.right,
        top: mainCenter - baseHeight / 2,
        bottom: mainCenter + baseHeight / 2,
        width: op.width,
        height: baseHeight,
        centerX: op.centerX,
        centerY: mainCenter
      });
    }
  }

  const reservedMainScripts = tokens.filter((token) => {
    if (mainRow.tokens.includes(token) || consumed.has(token) || token.height >= baseHeight * 0.84) return false;
    return mainRow.tokens.some((base) => token.left >= base.left - baseHeight * 0.10 && token.left <= base.right + baseHeight * 1.0 && Math.abs(token.centerY - base.centerY) <= baseHeight * 1.20);
  });

  const residualRows = vectorRows(tokens.filter((token) => !mainRow.tokens.includes(token) && !consumed.has(token) && !reservedMainScripts.includes(token)), Math.max(1.8, baseHeight * 0.28));
  const upper = [];
  const lower = [];
  for (const row of residualRows) {
    for (const segment of vectorRowSegments(row, baseHeight)) {
      if (segment.centerY < mainCenter - baseHeight * 0.16) upper.push(segment);
      else if (segment.centerY > mainCenter + baseHeight * 0.16) lower.push(segment);
    }
  }
  const usedLower = new Set();
  const syntheticFractions = [];
  for (const numerator of upper) {
    let best = null;
    for (const denominator of lower) {
      if (usedLower.has(denominator)) continue;
      const overlap = Math.max(0, Math.min(numerator.right, denominator.right) - Math.max(numerator.left, denominator.left));
      const minWidth = Math.max(1, Math.min(numerator.width, denominator.width));
      const centerDistance = Math.abs(numerator.centerX - denominator.centerX);
      const aligned = overlap / minWidth >= 0.22 || centerDistance <= Math.max(baseHeight * 0.68, Math.max(numerator.width, denominator.width) * 0.30);
      if (!aligned) continue;
      const verticalDistance = denominator.centerY - numerator.centerY;
      if (verticalDistance <= baseHeight * 0.32 || verticalDistance > baseHeight * 2.45) continue;
      const score = centerDistance + Math.abs(numerator.width - denominator.width) * 0.15 + verticalDistance * 0.08;
      if (!best || score < best.score) best = { denominator, score };
    }
    if (!best) continue;
    usedLower.add(best.denominator);
    const numeratorTokens = vectorSegmentWithScripts(numerator, tokens, baseHeight, consumed);
    const denominatorTokens = vectorSegmentWithScripts(best.denominator, tokens, baseHeight, consumed);
    numeratorTokens.forEach((token) => consumed.add(token));
    denominatorTokens.forEach((token) => consumed.add(token));
    const topLatex = parseVectorInline(numeratorTokens, baseHeight * 0.84);
    const bottomLatex = parseVectorInline(denominatorTokens, baseHeight * 0.84);
    if (!topLatex || !bottomLatex) continue;
    syntheticFractions.push({
      syntheticLatex: `\\frac{${topLatex}}{${bottomLatex}}`,
      text: `${numerator.tokens.map((token) => token.text).join('')}/${best.denominator.tokens.map((token) => token.text).join('')}`,
      left: Math.min(numerator.left, best.denominator.left),
      right: Math.max(numerator.right, best.denominator.right),
      top: numerator.top,
      bottom: best.denominator.bottom,
      width: Math.max(numerator.right, best.denominator.right) - Math.min(numerator.left, best.denominator.left),
      height: baseHeight,
      centerX: (numerator.centerX + best.denominator.centerX) / 2,
      centerY: mainCenter
    });
  }

  const mainTokens = [...mainRow.tokens.filter((token) => !consumed.has(token)), ...syntheticOperators, ...syntheticAccents, ...syntheticFractions];
  const remainingScripts = tokens.filter((token) => !mainRow.tokens.includes(token) && !consumed.has(token));
  let latex = parseVectorInline([...mainTokens, ...remainingScripts], baseHeight, overrides).replace(/\s+/g, ' ').trim();
  latex = latex
    .replace(/\\operatorname\{Ricci\}/g, '\\operatorname{Ric}')
    .replace(/\\operatorname\{Ric\}\s*([_^]\{)/g, '\\operatorname{Ric}$1')
    .replace(/^\\(?:cap|cup)\s+/, '')
    .replace(/\\cdot\s*\\cdot\s*\\cdot/g, '\\cdots')
    .replace(/\\bigcup\s+/g, '\\bigcup ')
    .replace(/\\bigcap\s+/g, '\\bigcap ')
    .replace(/\\(cong|sim)(?=[A-Z])/g, '\\$1 ')
    .replace(/(^|[\s,;)\]}])d(?=[xyztsruvw](?:\b|[),.;]))/g, '$1\\,\\mathrm{d}')
    .replace(/(^|[\s,;)\]}])d(?=\\(?:xi|rho|sigma|mu|nu|omega|theta|phi)\b)/g, '$1\\,\\mathrm{d}');
  const plain = tokens.sort((a, b) => (a.top - b.top) || (a.left - b.left)).map((token) => token.text).join(' ').replace(/\s+/g, ' ').trim();
  if (!latex || !plain) return null;
  const mathSignal = /[=<>≤≥∫∑√∂∇∩∪⋃⋂∞_^]|\\(?:le|ge|cap|cup|bigcup|bigcap|partial|nabla|sqrt|frac|sup|inf|lim|sum|prod|int|iint|iiint|oint|operatorname|lvert|rvert)/.test(latex);
  const compactEnough = tokens.length <= 160 && plain.length <= 520;
  if (!mathSignal && !compactEnough) return null;
  return { latex, text: plain, tokenCount: tokens.length };
}

function extractVectorFormulaFromLayer(ocrLayer, selectionRect) {
  const textLayer = vectorTextLayerForOcrLayer(ocrLayer);
  if (!textLayer) return null;
  const layerRect = ocrLayer.getBoundingClientRect();
  const selected = {
    left: layerRect.left + selectionRect.left,
    top: layerRect.top + selectionRect.top,
    right: layerRect.left + selectionRect.left + selectionRect.width,
    bottom: layerRect.top + selectionRect.top + selectionRect.height
  };
  let tokens = vectorGlyphTokensFromTextLayer(textLayer, layerRect, selected);
  if (!tokens.length) return null;
  // If PDF.js itself reports an unmapped replacement glyph, vector extraction
  // no longer has enough symbolic information to be trustworthy. Do not turn
  // U+FFFD into plausible-looking LaTeX; let the image fallback handle it.
  if (tokens.some((token) => String(token.text || '').includes('\uFFFD'))) return null;
  const glyphBaseHeight = dominantVectorHeight(tokens) || median(tokens.map((token) => token.height));
  tokens = mergeVectorGlyphWords(tokens, glyphBaseHeight || 12);
  return extractVectorFormulaFromTokens(tokens, true, glyphBaseHeight || 0);
}

function cropSelectedFormula(sourceCanvas, layer, rect) {
  const layerRect = layer.getBoundingClientRect();
  const canvasRect = sourceCanvas.getBoundingClientRect();
  if (!layerRect.width || !layerRect.height || !canvasRect.width || !canvasRect.height) return null;
  const pad = 7;
  const left = Math.max(0, rect.left - pad);
  const top = Math.max(0, rect.top - pad);
  const right = Math.min(layerRect.width, rect.left + rect.width + pad);
  const bottom = Math.min(layerRect.height, rect.top + rect.height + pad);
  const scaleX = sourceCanvas.width / canvasRect.width;
  const scaleY = sourceCanvas.height / canvasRect.height;
  const sx = Math.max(0, Math.round(left * scaleX));
  const sy = Math.max(0, Math.round(top * scaleY));
  const sw = Math.min(sourceCanvas.width - sx, Math.max(1, Math.round((right - left) * scaleX)));
  const sh = Math.min(sourceCanvas.height - sy, Math.max(1, Math.round((bottom - top) * scaleY)));
  const crop = document.createElement('canvas');
  crop.width = sw;
  crop.height = sh;
  const ctx = crop.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, sw, sh);
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return crop;
}


function formulaRowBands(canvas) {
  const ctx = canvas?.getContext?.('2d', { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height || canvas.width / Math.max(1, canvas.height) < 1.15) return [];
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const rowInk = new Array(height).fill(0);
  const colInk = new Array(width).fill(0);
  const rowLongestRun = new Array(height).fill(0);
  for (let y = 0; y < height; y += 1) {
    let run = 0;
    let longest = 0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum < 235) {
        rowInk[y] += 1;
        colInk[x] += 1;
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
    rowLongestRun[y] = longest;
  }
  // Several long, thin horizontal rules at distinct heights are a strong sign
  // of a structured fraction/continued fraction. Treating those rules as row
  // separators caused the fallback OCR to split one formula into nonsense
  // fragments and wrap them in `aligned`. Keep such crops intact.
  const longRuleThreshold = width * 0.28;
  let longRuleGroups = 0;
  let inLongRule = false;
  for (let y = 0; y < height; y += 1) {
    const isLongRule = rowLongestRun[y] >= longRuleThreshold;
    if (isLongRule && !inLongRule) longRuleGroups += 1;
    inLongRule = isLongRule;
  }
  if (longRuleGroups >= 2) return [];

  // Tall braces/matrix delimiters are a strong sign that row-by-row OCR would
  // destroy a single structured object, so keep those crops intact.
  if (colInk.some((count) => count > height * 0.52)) return [];
  const threshold = Math.max(3, Math.round(width * 0.008));
  const raw = [];
  let start = null;
  for (let y = 0; y < height; y += 1) {
    if (rowInk[y] >= threshold && start === null) start = y;
    if ((rowInk[y] < threshold || y === height - 1) && start !== null) {
      const end = rowInk[y] < threshold ? y - 1 : y;
      if (end - start + 1 >= 5) raw.push({ top: start, bottom: end });
      start = null;
    }
  }
  if (raw.length < 2 || raw.length > 6) return [];
  const merged = [];
  for (const band of raw) {
    const prev = merged.at(-1);
    if (prev && band.top - prev.bottom <= Math.max(5, Math.round(height * 0.018))) prev.bottom = band.bottom;
    else merged.push({ ...band });
  }
  if (merged.length < 2 || merged.length > 5) return [];
  return merged.map((band) => ({ top: Math.max(0, band.top - 5), bottom: Math.min(height - 1, band.bottom + 5) }));
}

function cropCanvasRows(canvas, band) {
  const out = document.createElement('canvas');
  const height = Math.max(1, band.bottom - band.top + 1);
  out.width = canvas.width;
  out.height = height;
  const ctx = out.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, band.top, canvas.width, height, 0, 0, out.width, out.height);
  return out;
}

function looksMultilineLatex(value) {
  return /\\begin\{(?:aligned|array|cases|matrix|pmatrix|bmatrix)\}|\\\\/.test(String(value || ''));
}
function latexVisualRowCount(value) {
  const text = String(value || '');
  const rowBreaks = (text.match(/\\\\/g) || []).length;
  if (/\\begin\{(?:aligned|array|cases|matrix|pmatrix|bmatrix)\}/.test(text)) return Math.max(1, rowBreaks + 1);
  return rowBreaks ? rowBreaks + 1 : 1;
}

async function runImageFormulaRecognition(crop) {
  const pipe = await ensureMathOcrPipeline();
  mathOcrLoading = true;
  const generation = {
    max_new_tokens: 512,
    num_beams: 2,
    early_stopping: true,
    do_sample: false,
    repetition_penalty: 1.04
  };

  async function onePass(sourceCanvas, variant = 'tight') {
    const prepared = normalizeFormulaCropForOcr(sourceCanvas, variant);
    const inputImage = await prepareMathOcrInput(prepared);
    const output = await pipe(inputImage, generation);
    const raw = Array.isArray(output) ? output[0]?.generated_text : output?.generated_text;
    const rawLatex = normalizeOcrLatex(raw);
    const latex = repairOcrLatex(rawLatex);
    const penalty = latexStructuralPenalty(rawLatex);
    const assessment = assessImageOcrResult(raw, latex);
    return { raw, rawLatex, latex, penalty, assessment, variant };
  }

  setOcrStatus(t('Recognizing formula locally with Texify…', '正在使用 Texify 本地识别公式……'), true);
  let best = await onePass(crop, 'tight');

  // For visibly separated aligned rows, a whole-block decoder can return only
  // the first line. When the crop has clean horizontal row bands and no tall
  // matrix/cases delimiter, recognize each row and rebuild an aligned block.
  const bands = formulaRowBands(crop);
  if (bands.length >= 2 && latexVisualRowCount(best.latex) < bands.length) {
    const lines = [];
    let rowFailure = false;
    for (let i = 0; i < bands.length; i += 1) {
      setOcrStatus(t(`Detected ${bands.length} formula rows · recognizing row ${i + 1}…`, `检测到 ${bands.length} 行公式 · 正在识别第 ${i + 1} 行……`), true);
      try {
        const row = await onePass(cropCanvasRows(crop, bands[i]), 'tight');
        if (!row.assessment.ok || !row.latex) { rowFailure = true; break; }
        lines.push(markAlignmentRelation(row.latex));
      } catch (_) { rowFailure = true; break; }
    }
    if (!rowFailure && lines.length === bands.length) {
      const latex = `\\begin{aligned}\n${lines.join(latexLineSeparator())}\n\\end{aligned}`;
      const candidate = { raw: latex, rawLatex: latex, latex, penalty: latexStructuralPenalty(latex), assessment: assessImageOcrResult(latex, latex), variant: 'rows' };
      if (candidate.assessment.ok) best = candidate;
    }
  }

  if (!best.assessment.ok || best.penalty >= 8) {
    setOcrStatus(t('First pass was uncertain · refining with a wider crop…', '第一次识别不够稳定 · 正在使用更宽裁图精修……'), true);
    const alternate = await onePass(crop, 'relaxed');
    const score = (item) => item.penalty + item.assessment.reasons.length * 40 + (item.latex ? 0 : 1000) - (looksMultilineLatex(item.latex) ? 3 : 0);
    if (score(alternate) < score(best)) best = alternate;
  }
  if (!best.latex) throw new Error(t('The image model returned no LaTeX for this region.', '图像模型没有为该区域返回 LaTeX。'));
  requireUsableImageOcr(best.raw, best.latex);
  return best;
}
function commitFormulaResult(item, statusMessage = '') {
  currentOcrResult = item;
  ocrHistory = [item, ...ocrHistory.filter((entry) => !(entry.page === item.page && entry.latex === item.latex && entry.source === item.source))].slice(0, 10);
  refreshOcrUI();
  persistDocumentState();
  if (statusMessage) setOcrStatus(statusMessage);
}

async function recognizeMathCrop(crop, page, kind, ocrLayer = null, selectionRect = null) {
  if (!crop || !page) return;
  setOcrMode(false);
  const preview = crop.toDataURL('image/png');
  const vector = ocrLayer && selectionRect ? extractVectorFormulaFromLayer(ocrLayer, selectionRect) : null;

  if (formulaExtractionMode === 'vector' && vector?.latex) {
    commitFormulaResult(
      { page, kind, latex: vector.latex, preview, created: Date.now(), quality: 'vector', source: 'vector', extractedText: vector.text },
      t('Formula extracted from embedded PDF text and glyph geometry.', '已依据 PDF 原生文本与字形几何提取公式。')
    );
    return;
  }

  mathOcrLoading = true;
  setOcrProcessing(true);
  try {
    const result = await runImageFormulaRecognition(crop);
    const item = { page, kind, latex: result.latex, preview, created: Date.now(), quality: result.penalty === 0 ? 'clean' : 'review', source: 'image', vectorAlternative: vector?.latex || null, vectorAlternativeText: vector?.text || null };
    commitFormulaResult(item, result.penalty === 0
      ? t('Image OCR complete · structure check passed.', '图像 OCR 完成 · 结构检查通过。')
      : t('Image OCR complete · review the editable LaTeX before reuse.', '图像 OCR 完成 · 复用前请核对可编辑 LaTeX。'));
  } catch (error) {
    console.error(error);
    if (vector?.latex) {
      commitFormulaResult(
        { page, kind, latex: vector.latex, preview, created: Date.now(), quality: 'vector-fallback', source: 'vector', extractedText: vector.text },
        t('Image OCR failed or was rejected · PDF vector fallback was used instead.', '图像 OCR 失败或未通过质量检查 · 已改用 PDF 矢量备用结果。')
      );
    } else {
      const detail = detailedOcrError(error, mathOcrBackend);
      setOcrStatus(detail);
      showError(detail);
    }
  } finally {
    mathOcrLoading = false;
    setOcrProcessing(false);
    releaseMathOcrPipelineAfterExtraction();
  }
}

async function canvasFromDataUrl(dataUrl) {
  if (!dataUrl) return null;
  const image = new Image();
  image.decoding = 'async';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, image.naturalWidth || image.width || 1);
  canvas.height = Math.max(1, image.naturalHeight || image.height || 1);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  return canvas;
}

async function recognizeImageFallbackCrop(crop, page, kind, preview = null) {
  if (!crop || !page) return;
  mathOcrLoading = true;
  const imagePreview = preview || crop.toDataURL('image/png');
  setOcrProcessing(true);
  try {
    const result = await runImageFormulaRecognition(crop);
    const item = { page, kind, latex: result.latex, preview: imagePreview, created: Date.now(), quality: result.penalty === 0 ? 'clean' : 'review', source: 'image' };
    commitFormulaResult(item, result.penalty === 0
      ? t('Image OCR comparison complete.', '图像 OCR 对照完成。')
      : t('Image OCR comparison complete · review the editable LaTeX.', '图像 OCR 对照完成 · 请核对可编辑 LaTeX。'));
  } catch (error) {
    console.error(error);
    const detail = detailedOcrError(error, mathOcrBackend);
    setOcrStatus(detail);
    showError(detail);
  } finally {
    mathOcrLoading = false;
    setOcrProcessing(false);
    releaseMathOcrPipelineAfterExtraction();
  }
}

async function tryImageOcrForCurrentResult() {
  if (!currentOcrResult?.preview || mathOcrLoading) return;
  try {
    const crop = await canvasFromDataUrl(currentOcrResult.preview);
    await recognizeImageFallbackCrop(crop, Number(currentOcrResult.page) || currentPage, currentOcrResult.kind || 'primary', currentOcrResult.preview);
  } catch (error) {
    console.error(error);
    showError(t('The selected formula image could not be prepared for image OCR.', '无法为图像 OCR 准备当前框选公式。'));
  }
}

function addOcrToPageNote() {
  if (!pdfDoc || !currentOcrResult?.latex) return;
  const page = Number(currentOcrResult.page) || currentPage;
  const block = `${t('Math OCR', '公式 OCR')} · ${t(`Page ${page}`, `第 ${page} 页`)}\n\\[\n${currentOcrResult.latex}\n\\]`;
  const existing = notes[String(page)] || '';
  notes[String(page)] = `${existing}${existing.trim() ? '\n\n' : ''}${block}`;
  persistDocumentState();
  if (page === currentPage) { pageNote.value = notes[String(page)]; scheduleNotePreview(); }
  noteSaveState.textContent = t('Saved locally', '已保存到本地');
}

function clearOcrResultState() {
  currentOcrResult = null;
  refreshOcrUI();
  persistDocumentState();
}

function ocrPoint(event, layer) {
  const rect = layer.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
  };
}

function updateOcrSelectionBox(layer, start, current) {
  const box = layer.querySelector('.ocr-selection-box');
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
  return { left, top, width, height };
}

function bindOcrLayer(layer) {
  if (!layer || layer.dataset.boundOcr === '1') return;
  layer.dataset.boundOcr = '1';
  layer.addEventListener('pointerdown', (event) => {
    if (!ocrMode || mathOcrLoading) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const start = ocrPoint(event, layer);
    ocrDrag = { layer, start, rect: { left: start.x, top: start.y, width: 0, height: 0 }, pointerId: event.pointerId };
    layer.classList.add('is-selecting');
    try { layer.setPointerCapture(event.pointerId); } catch (_) {}
  });
  layer.addEventListener('pointermove', (event) => {
    if (!ocrDrag || ocrDrag.layer !== layer || event.pointerId !== ocrDrag.pointerId) return;
    event.preventDefault();
    ocrDrag.rect = updateOcrSelectionBox(layer, ocrDrag.start, ocrPoint(event, layer));
  });
  const finish = (event, cancelled = false) => {
    if (!ocrDrag || ocrDrag.layer !== layer || event.pointerId !== ocrDrag.pointerId) return;
    event.preventDefault();
    const drag = ocrDrag;
    ocrDrag = null;
    try { layer.releasePointerCapture(event.pointerId); } catch (_) {}
    layer.classList.remove('is-selecting');
    if (cancelled || drag.rect.width < 12 || drag.rect.height < 8) {
      resetOcrBoxes();
      setOcrStatus(t('Selection cancelled. Drag a larger rectangle around a formula.', '已取消框选。请在公式周围拖出更大的矩形框。'));
      return;
    }
    const kind = layer.dataset.kind || 'primary';
    const page = Number(layer.dataset.page || (kind === 'reference' ? pinnedPage : currentPage));
    const sourceCanvas = kind === 'reference' ? referenceCanvas : kind === 'continuous' ? layer.closest('.continuous-page-surface')?.querySelector('canvas') : canvas;
    const crop = cropSelectedFormula(sourceCanvas, layer, drag.rect);
    resetOcrBoxes();
    recognizeMathCrop(crop, page, kind, layer, drag.rect);
  };
  layer.addEventListener('pointerup', (event) => finish(event, false));
  layer.addEventListener('pointercancel', (event) => finish(event, true));
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
  '∂':'\\partial ','∇':'\\nabla ','∞':'\\infty ','∫':'\\int ','∬':'\\iint ','∭':'\\iiint ','∮':'\\oint ','∑':'\\sum ','∏':'\\prod ','⋃':'\\bigcup ','⋂':'\\bigcap ','√':'\\sqrt{}',
  '≤':' \\le ','≥':' \\ge ','≠':' \\ne ','≈':' \\approx ','≅':' \\cong ','∼':' \\sim ','≡':' \\equiv ','∝':' \\propto ',
  '∈':' \\in ','∉':' \\notin ','∋':' \\ni ','⊂':' \\subset ','⊆':' \\subseteq ','⊊':' \\subsetneq ','⊃':' \\supset ','⊇':' \\supseteq ','∪':' \\cup ','∩':' \\cap ',
  '→':' \\to ','←':' \\leftarrow ','↔':' \\leftrightarrow ','⇒':' \\Rightarrow ','⇐':' \\Leftarrow ','⇔':' \\Leftrightarrow ','↦':' \\mapsto ',
  '±':' \\pm ','∓':' \\mp ','×':' \\times ','·':' \\cdot ','∘':' \\circ ','⊗':' \\otimes ','⊕':' \\oplus ','∧':' \\wedge ','∨':' \\vee ','¬':'\\neg ',
  '∀':'\\forall ','∃':'\\exists ','∅':'\\varnothing ','∥':'\\Vert ','‖':'\\Vert ','⟨':'\\langle ','⟩':'\\rangle ','⊥':'\\perp ','∠':'\\angle ','ℓ':'\\ell ','′':"'",'″':"''",'°':'^{\\circ}','…':'\\ldots ','⋯':'\\cdots ','⋮':'\\vdots '
}));

const superscriptMap = new Map(Object.entries({'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i'}));
const subscriptMap = new Map(Object.entries({'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-','₌':'=','₍':'(','₎':')','ₐ':'a','ₑ':'e','ₕ':'h','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p','ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x'}));

function vectorUnicodeStyleLatex(ch) {
  const special = {
    'ℱ':'\\mathcal{F}','ℰ':'\\mathcal{E}','ℋ':'\\mathcal{H}','ℐ':'\\mathcal{I}','ℒ':'\\mathcal{L}','ℳ':'\\mathcal{M}','ℛ':'\\mathcal{R}',
    '𝒩':'\\mathcal{N}','𝒳':'\\mathcal{X}','𝒫':'\\mathcal{P}','𝒬':'\\mathcal{Q}','𝒮':'\\mathcal{S}',
    'ℙ':'\\mathbb{P}','ℝ':'\\mathbb{R}','ℤ':'\\mathbb{Z}','ℕ':'\\mathbb{N}','ℚ':'\\mathbb{Q}','ℂ':'\\mathbb{C}'
  };
  if (special[ch]) return special[ch];
  const cp = ch.codePointAt(0);
  const compatibility = ch.normalize('NFKD');
  if (compatibility !== ch && latexSymbolMap.has(compatibility)) return compatibility;
  if (compatibility !== ch && /^[A-Za-z0-9α-ωΑ-Ωφϕϑϖϱς]+$/u.test(compatibility)) {
    // Mathematical alphanumeric Unicode (italic/bold/etc.) carries font style,
    // not a different mathematical symbol. Preserve calligraphic letters when
    // they are clearly encoded as script; otherwise return the base character.
    if ((cp >= 0x1D49C && cp <= 0x1D4CF) && /^[A-Za-z]$/.test(compatibility)) return `\\mathcal{${compatibility}}`;
    return compatibility;
  }
  return null;
}

function cleanPdfGlyphText(text) {
  return String(text || '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/⎛|⎜|⎝/g, '(')
    .replace(/⎞|⎟|⎠/g, ')')
    .replace(/⃒/g, '|')
    .replace(/⃦/g, '∥')
    .replace(/⋯|\.\.\./g, '…');
}

function pdfTextToLatex(source) {
  const text = cleanPdfGlyphText(String(source || '').normalize('NFC').replace(/\u00ad/g, '').replace(/\r\n?/g, '\n'));
  const chars = Array.from(text);
  let out = '';
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const accentCommands = { '̂':'\\widehat', '̃':'\\widetilde', '̄':'\\overline', '̇':'\\dot' };
    if (i + 1 < chars.length && accentCommands[chars[i + 1]]) {
      const base = pdfTextToLatex(ch);
      out += `${accentCommands[chars[i + 1]]}{${base}}`;
      i += 1;
      continue;
    }
    if (superscriptMap.has(ch)) {
      let group = '';
      while (i < chars.length && superscriptMap.has(chars[i])) { group += superscriptMap.get(chars[i]); i += 1; }
      i -= 1; out += `^{${group}}`; continue;
    }
    if (subscriptMap.has(ch)) {
      let group = '';
      while (i < chars.length && subscriptMap.has(chars[i])) { group += subscriptMap.get(chars[i]); i += 1; }
      i -= 1; out += `_{${group}}`; continue;
    }
    if (latexSymbolMap.has(ch)) { out += latexSymbolMap.get(ch); continue; }
    const styled = vectorUnicodeStyleLatex(ch);
    if (styled) {
      if (styled.length === 1 && latexSymbolMap.has(styled)) out += latexSymbolMap.get(styled);
      else if (/^[α-ωΑ-Ωφϕϑϖϱς]$/u.test(styled) && latexSymbolMap.has(styled)) out += latexSymbolMap.get(styled);
      else out += styled;
      continue;
    }
    if (ch === '−' || ch === '–') { out += '-'; continue; }
    if (ch === ' ') { out += ' '; continue; }
    if (ch === '̸') { out += '\\not '; continue; }
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
    .replace(/\\not\s*=/g, '\\ne ')
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


function normalizedSelectionRects(range, layer) {
  if (!range || !layer) return [];
  const layerRect = layer.getBoundingClientRect();
  if (!layerRect.width || !layerRect.height) return [];
  const out = [];
  for (const rect of Array.from(range.getClientRects())) {
    const left = Math.max(rect.left, layerRect.left);
    const top = Math.max(rect.top, layerRect.top);
    const right = Math.min(rect.right, layerRect.right);
    const bottom = Math.min(rect.bottom, layerRect.bottom);
    if (right - left < 1 || bottom - top < 1) continue;
    out.push({
      x: (left - layerRect.left) / layerRect.width,
      y: (top - layerRect.top) / layerRect.height,
      w: (right - left) / layerRect.width,
      h: (bottom - top) / layerRect.height
    });
  }
  return out.slice(0, 80);
}

function normalizeAnnotations(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item && Number(item.page) >= 1 && ['highlight','margin'].includes(item.type)).map((item, index) => ({
    id: item.id || `ann-${Number(item.created) || Date.now()}-${index}`,
    type: item.type,
    page: Number(item.page),
    text: typeof item.text === 'string' ? item.text : '',
    latex: typeof item.latex === 'string' ? item.latex : '',
    note: typeof item.note === 'string' ? item.note : '',
    rects: Array.isArray(item.rects) ? item.rects.map((r) => ({ x:Number(r.x)||0, y:Number(r.y)||0, w:Number(r.w)||0, h:Number(r.h)||0 })).filter((r) => r.w > 0 && r.h > 0).slice(0,80) : [],
    ratio: Math.min(1, Math.max(0, Number(item.ratio) || Number(item.rects?.[0]?.y) || 0)),
    created: Number(item.created) || Date.now()
  })).filter((item) => item.rects.length || Number.isFinite(item.ratio));
}

function annotationLayerForSurface(surface, kind = 'primary') {
  if (!surface) return null;
  if (surface === primaryPageSurface) return primaryAnnotationLayer;
  if (surface === referencePageSurface) return referenceAnnotationLayer;
  return surface.querySelector('.annotation-layer');
}

function renderAnnotationsForPage(page, surface, kind = 'primary') {
  const layer = annotationLayerForSurface(surface, kind);
  if (!layer) return;
  layer.replaceChildren();
  layer.dataset.page = String(page);
  for (const item of annotations.filter((ann) => Number(ann.page) === Number(page))) {
    if (item.type === 'highlight') {
      for (const r of item.rects) {
        const mark = document.createElement('div');
        mark.className = 'annotation-highlight';
        mark.style.left = `${r.x * 100}%`; mark.style.top = `${r.y * 100}%`;
        mark.style.width = `${r.w * 100}%`; mark.style.height = `${r.h * 100}%`;
        mark.title = item.note || item.text;
        layer.append(mark);
      }
    } else if (item.type === 'margin') {
      const marker = document.createElement('button');
      marker.type = 'button'; marker.className = 'annotation-margin-marker';
      marker.style.top = `${Math.min(.97, Math.max(0, item.ratio)) * 100}%`;
      marker.title = item.note || item.text || t('Margin note', '页边注');
      marker.setAttribute('aria-label', t(`Margin note on page ${item.page}`, `第 ${item.page} 页页边注`));
      marker.addEventListener('click', () => { openRightSectionShortcut('annotations-section'); focusAnnotationEditor(item.id); });
      layer.append(marker);
    }
  }
}

function rerenderVisibleAnnotations() {
  if (!pdfDoc) return;
  if (readingFlow === 'continuous') {
    for (const [page, record] of continuousPageNodes) if (record.rendered) renderAnnotationsForPage(page, record.surface, 'continuous');
  } else renderAnnotationsForPage(currentPage, primaryPageSurface, 'primary');
  if (pinnedPage) renderAnnotationsForPage(pinnedPage, referencePageSurface, 'reference');
}

function focusAnnotationEditor(id) {
  const node = annotationList?.querySelector(`[data-annotation-id="${CSS.escape(String(id))}"] textarea`);
  if (node) { node.focus(); node.scrollIntoView({ block: 'nearest' }); }
}

function addSelectionAnnotation(type) {
  if (!pdfDoc || !currentSelection?.text || !currentSelection.rects?.length || !['highlight','margin'].includes(type)) return;
  const item = {
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    type, page: Number(currentSelection.page), text: currentSelection.text, latex: currentSelection.latex || '', note: '',
    rects: currentSelection.rects.map((r) => ({...r})), ratio: Number(currentSelection.ratio) || Number(currentSelection.rects[0]?.y) || 0,
    created: Date.now()
  };
  annotations.push(item);
  persistDocumentState(); renderAnnotationList(); rerenderVisibleAnnotations();
  if (type === 'margin') { openRightSectionShortcut('annotations-section'); setTimeout(() => focusAnnotationEditor(item.id), 0); }
}

function appendAnnotationToPageNote(item) {
  if (!item) return;
  const page = Number(item.page) || currentPage;
  const position = `${Math.round((Number(item.ratio) || 0) * 100)}%`;
  const quoted = String(item.text || '').split('\n').map((line) => `> ${line}`).join('\n');
  const meta = t(`Page ${page} · position ${position}`, `第 ${page} 页 · 位置 ${position}`);
  const block = `${meta}\n${quoted}${item.note?.trim() ? `\n\n${item.note.trim()}` : ''}`;
  const existing = notes[String(page)] || '';
  notes[String(page)] = `${existing}${existing.trim() ? '\n\n' : ''}${block}`;
  persistDocumentState();
  if (page === currentPage) { pageNote.value = notes[String(page)]; scheduleNotePreview(); }
  noteSaveState.textContent = t('Saved locally', '已保存到本地');
}

function renderAnnotationList() {
  if (!annotationList || !annotationEmpty || !annotationCount) return;
  annotationList.replaceChildren();
  annotationCount.textContent = String(annotations.length);
  annotationEmpty.classList.toggle('is-hidden', annotations.length > 0);
  const ordered = [...annotations].sort((a,b) => a.page - b.page || a.ratio - b.ratio || a.created - b.created);
  for (const item of ordered) {
    const row = document.createElement('div'); row.className = 'annotation-item'; row.dataset.annotationId = item.id;
    const head = document.createElement('div'); head.className = 'annotation-item-head';
    const kind = document.createElement('span'); kind.className = 'annotation-kind'; kind.textContent = item.type === 'highlight' ? t('Highlight','高亮') : t('Margin note','页边注');
    const page = document.createElement('span'); page.className = 'annotation-page'; page.textContent = t(`Page ${item.page}`, `第 ${item.page} 页`);
    head.append(kind,page);
    const quote = document.createElement('p'); quote.className = 'annotation-quote'; quote.textContent = item.text || item.latex || '';
    row.append(head, quote);
    if (item.type === 'margin') {
      const input = document.createElement('textarea'); input.className = 'annotation-note-input'; input.placeholder = t('Write a margin note…','写页边注……'); input.value = item.note || '';
      input.addEventListener('input', () => { item.note = input.value; clearTimeout(annotationSaveTimer); annotationSaveTimer = setTimeout(() => { persistDocumentState(); rerenderVisibleAnnotations(); }, 250); });
      row.append(input);
    }
    const actions = document.createElement('div'); actions.className = 'annotation-actions';
    const jump = document.createElement('button'); jump.type='button'; jump.textContent=t('Jump','跳转'); jump.addEventListener('click',()=>goToLocation(item.page,item.ratio));
    const promote = document.createElement('button'); promote.type='button'; promote.textContent=t('Add to page note','加入页注'); promote.addEventListener('click',()=>appendAnnotationToPageNote(item));
    const remove = document.createElement('button'); remove.type='button'; remove.textContent=t('Delete','删除'); remove.addEventListener('click',()=>{ annotations=annotations.filter((ann)=>ann.id!==item.id); persistDocumentState(); renderAnnotationList(); rerenderVisibleAnnotations(); });
    actions.append(jump,promote,remove); row.append(actions); annotationList.append(row);
  }
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
    const rects = normalizedSelectionRects(range, startLayer);
    currentSelection = { text, latex: pdfTextToLatex(text), page, kind: startLayer.dataset.kind || (startLayer === referenceTextLayer ? 'reference' : 'primary'), rects, ratio: Number(rects[0]?.y) || 0 };
    refreshSelectionUI();
    persistDocumentState();
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
  const position = `${Math.round((Number(currentSelection.ratio) || 0) * 100)}%`;
  const quoted = currentSelection.text.split('\n').map((line) => `> ${line}`).join('\n');
  const meta = t(`Page ${page} · position ${position}`, `第 ${page} 页 · 位置 ${position}`);
  const existing = notes[String(page)] || '';
  notes[String(page)] = `${existing}${existing.trim() ? '\n\n' : ''}${meta}\n${quoted}`;
  persistDocumentState();
  if (page === currentPage) { pageNote.value = notes[String(page)]; scheduleNotePreview(); }
  noteSaveState.textContent = t('Saved locally', '已保存到本地');
}

async function renderSelectableText(page, viewport, layer, surface, pageNum, kind = 'primary') {
  surface.style.width = `${viewport.width}px`;
  surface.style.height = `${viewport.height}px`;
  layer.style.width = `${viewport.width}px`;
  layer.style.height = `${viewport.height}px`;
  layer.style.setProperty('--scale-factor', String(viewport.scale));
  layer.style.setProperty('--total-scale-factor', String(viewport.scale));
  layer.dataset.page = String(pageNum);
  layer.dataset.kind = kind;
  layer.replaceChildren();
  try {
    const textContent = await page.getTextContent({ includeMarkedContent: true });
    const textLayer = new pdfjsLib.TextLayer({ textContentSource: textContent, container: layer, viewport });
    await textLayer.render();
  } catch (error) {
    console.warn('MathReader text layer unavailable for page', pageNum, error);
  }
}

function pageScale(baseViewport, wrap, kind = 'primary') {
  let scale;
  if (kind === 'reference') {
    scale = Math.max(180, wrap.clientWidth - 38) / baseViewport.width;
  } else if (zoomMode === 'fit-width') {
    scale = Math.max(220, wrap.clientWidth - 46) / baseViewport.width;
  } else if (zoomMode === 'fit-page') {
    const maxWidth = Math.max(220, wrap.clientWidth - 46);
    const maxHeight = Math.max(220, wrap.clientHeight - 46);
    scale = Math.min(maxWidth / baseViewport.width, maxHeight / baseViewport.height);
  } else scale = zoomScale;
  return Math.max(.35, Math.min(scale, 4));
}

async function renderPage(pageNum, targetCanvas, wrap, kind = 'primary') {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = pageScale(baseViewport, wrap, kind);
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
    await renderSelectableText(page, viewport, targetTextLayer, targetSurface, pageNum, kind);
    renderAnnotationsForPage(pageNum, targetSurface, kind);
    const ocrLayer = kind === 'reference' ? referenceOcrLayer : primaryOcrLayer;
    ocrLayer.dataset.page = String(pageNum);
    ocrLayer.dataset.kind = kind;
    const saved = (kind === 'reference' ? referenceScrollByPage : scrollByPage)[String(pageNum)];
    if (saved) {
      wrap.scrollTop = Number(saved.top) || 0;
      wrap.scrollLeft = Number(saved.left) || 0;
    } else {
      wrap.scrollTop = 0;
      wrap.scrollLeft = 0;
    }
  } catch (error) { if (error?.name !== 'RenderingCancelledException') throw error; }
}

function clearContinuousObserver() {
  continuousObserver?.disconnect();
  continuousObserver = null;
  continuousPageNodes.clear();
}

async function renderContinuousPage(pageNum, generation) {
  if (!pdfDoc || generation !== continuousGeneration) return;
  const record = continuousPageNodes.get(pageNum);
  if (!record || record.rendering || record.rendered) return;
  record.rendering = true;
  try {
    const page = await pdfDoc.getPage(pageNum);
    if (generation !== continuousGeneration) return;
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = continuousScale(baseViewport);
    const viewport = page.getViewport({ scale });
    const { surface, canvas: pageCanvas, textLayer, ocrLayer } = record;
    surface.style.width = `${viewport.width}px`;
    surface.style.height = `${viewport.height}px`;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = pageCanvas.getContext('2d', { alpha: false });
    pageCanvas.width = Math.floor(viewport.width * dpr);
    pageCanvas.height = Math.floor(viewport.height * dpr);
    pageCanvas.style.width = `${viewport.width}px`;
    pageCanvas.style.height = `${viewport.height}px`;
    await page.render({ canvasContext: ctx, viewport, transform: dpr === 1 ? null : [dpr,0,0,dpr,0,0] }).promise;
    if (generation !== continuousGeneration) return;
    await renderSelectableText(page, viewport, textLayer, surface, pageNum, 'continuous');
    renderAnnotationsForPage(pageNum, surface, 'continuous');
    ocrLayer.dataset.page = String(pageNum);
    ocrLayer.dataset.kind = 'continuous';
    surface.classList.remove('is-placeholder');
    surface.removeAttribute('data-placeholder-label');
    surface.classList.toggle('ocr-mode', ocrMode);
    record.rendered = true;
  } catch (error) {
    console.warn('Continuous page render failed', pageNum, error);
  } finally {
    record.rendering = false;
  }
}

function captureContinuousAnchor() {
  if (readingFlow !== 'continuous' || !pdfDoc || !continuousPageNodes.size || !primaryCanvasWrap) return null;
  updateCurrentPageFromContinuousScroll();
  const record = continuousPageNodes.get(currentPage);
  if (!record?.frame) return null;
  const height = Math.max(1, record.frame.offsetHeight || record.surface?.offsetHeight || 1);
  const local = primaryCanvasWrap.scrollTop - record.frame.offsetTop;
  return { page: currentPage, ratio: Math.min(1, Math.max(0, local / height)) };
}

function continuousScale(baseViewport) {
  if (zoomMode === 'custom') return Math.max(.35, Math.min(zoomScale, 4));
  const width = Math.max(220, continuousLayoutWidth || (primaryCanvasWrap.clientWidth - 46));
  if (zoomMode === 'fit-page') {
    const height = Math.max(220, continuousLayoutHeight || (primaryCanvasWrap.clientHeight - 46));
    return Math.max(.35, Math.min(Math.min(width / baseViewport.width, height / baseViewport.height), 4));
  }
  return Math.max(.35, Math.min(width / baseViewport.width, 4));
}

function updateCurrentPageFromContinuousScroll() {
  if (readingFlow !== 'continuous' || !pdfDoc || !continuousPageNodes.size) return;
  const wrapRect = primaryCanvasWrap.getBoundingClientRect();
  const anchor = wrapRect.top + Math.min(140, wrapRect.height * .24);
  let bestPage = currentPage;
  let bestDistance = Infinity;
  for (const [pageNum, record] of continuousPageNodes) {
    const rect = record.frame.getBoundingClientRect();
    if (rect.bottom < wrapRect.top || rect.top > wrapRect.bottom) continue;
    const distance = Math.abs(rect.top - anchor);
    if (distance < bestDistance) { bestDistance = distance; bestPage = pageNum; }
  }
  if (bestPage !== currentPage) {
    currentPage = bestPage;
    updateNavigationState();
  }
}

async function buildContinuousDocument({ restore = false, anchor = null } = {}) {
  if (!pdfDoc || !continuousStack) return;
  const generation = ++continuousGeneration;
  clearContinuousObserver();
  continuousStack.replaceChildren();
  // Freeze one layout width/height for this generation. Lazy pages must never
  // compute fit-width from a later sidebar/scrollbar state than early pages.
  continuousLayoutWidth = Math.max(220, primaryCanvasWrap.clientWidth - 46);
  continuousLayoutHeight = Math.max(220, primaryCanvasWrap.clientHeight - 46);
  const first = await pdfDoc.getPage(Math.min(currentPage, pdfDoc.numPages));
  if (generation !== continuousGeneration) return;
  const base = first.getViewport({ scale: 1 });
  const scale = continuousScale(base);
  const estimateWidth = base.width * scale;
  const estimateHeight = base.height * scale;
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum += 1) {
    const frame = document.createElement('section');
    frame.className = 'continuous-page-frame';
    frame.dataset.page = String(pageNum);
    const label = document.createElement('div');
    label.className = 'continuous-page-number';
    label.dataset.en = `Page ${pageNum}`;
    label.dataset.zh = `第 ${pageNum} 页`;
    label.textContent = t(label.dataset.en, label.dataset.zh);
    const surface = document.createElement('div');
    surface.className = 'page-surface continuous-page-surface is-placeholder';
    surface.dataset.placeholderLabel = t(`Page ${pageNum}`, `第 ${pageNum} 页`);
    surface.style.width = `${estimateWidth}px`;
    surface.style.height = `${estimateHeight}px`;
    const pageCanvas = document.createElement('canvas');
    pageCanvas.setAttribute('aria-label', t(`PDF page ${pageNum}`, `PDF 第 ${pageNum} 页`));
    const textLayer = document.createElement('div');
    textLayer.className = 'textLayer';
    textLayer.dataset.page = String(pageNum);
    textLayer.dataset.kind = 'continuous';
    const annotationLayer = document.createElement('div');
    annotationLayer.className = 'annotation-layer';
    annotationLayer.dataset.page = String(pageNum);
    const ocrLayer = document.createElement('div');
    ocrLayer.className = 'ocr-select-layer';
    ocrLayer.dataset.kind = 'continuous';
    ocrLayer.dataset.page = String(pageNum);
    const box = document.createElement('div');
    box.className = 'ocr-selection-box';
    ocrLayer.append(box);
    bindOcrLayer(ocrLayer);
    surface.append(pageCanvas, textLayer, annotationLayer, ocrLayer);
    frame.append(label, surface);
    continuousStack.append(frame);
    continuousPageNodes.set(pageNum, { frame, surface, canvas: pageCanvas, textLayer, annotationLayer, ocrLayer, rendered: false, rendering: false });
  }
  continuousObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const pageNum = Number(entry.target.dataset.page);
      if (pageNum) renderContinuousPage(pageNum, generation);
    }
  }, { root: primaryCanvasWrap, rootMargin: '1200px 0px', threshold: 0.01 });
  for (const { frame } of continuousPageNodes.values()) continuousObserver.observe(frame);

  // Render the restored/current neighborhood before positioning the scroll
  // anchor. This prevents giant stale placeholders near the resume point.
  const anchorPage = Math.min(Math.max(1, Number(anchor?.page) || currentPage), pdfDoc.numPages);
  const eagerPages = [];
  for (let n = Math.max(1, anchorPage - 2); n <= Math.min(pdfDoc.numPages, anchorPage + 2); n += 1) eagerPages.push(n);
  await Promise.all(eagerPages.map((n) => renderContinuousPage(n, generation)));
  if (generation !== continuousGeneration) return;

  requestAnimationFrame(() => {
    if (generation !== continuousGeneration) return;
    const restoreAnchor = anchor || continuousSavedAnchor;
    if (restoreAnchor?.page && continuousPageNodes.has(Number(restoreAnchor.page))) {
      const target = continuousPageNodes.get(Number(restoreAnchor.page))?.frame;
      const ratio = Math.min(1, Math.max(0, Number(restoreAnchor.ratio) || 0));
      if (target) primaryCanvasWrap.scrollTop = Math.max(0, target.offsetTop + target.offsetHeight * ratio);
    } else {
      // Legacy sessions stored only absolute pixels. Those values depend on the
      // old viewport width and can land inside oversized placeholders after a
      // reload, so migrate them to the saved page rather than replaying pixels.
      const target = continuousPageNodes.get(currentPage)?.frame;
      if (target) primaryCanvasWrap.scrollTop = Math.max(0, target.offsetTop - 8);
    }
    updateCurrentPageFromContinuousScroll();
    continuousSavedAnchor = captureContinuousAnchor();
  });
}

async function renderCurrentPage() {
  if (!pdfDoc) return;
  updateNavigationState();
  if (readingFlow === 'continuous') {
    try {
      const anchor = restoringSession ? continuousSavedAnchor : captureContinuousAnchor();
      await buildContinuousDocument({ restore: restoringSession || continuousScrollTop > 0, anchor });
    }
    catch (error) { showError(t('Continuous reading could not be rendered.', '无法渲染连续阅读模式。')); console.error(error); }
    return;
  }
  try { await renderPage(currentPage, canvas, primaryCanvasWrap, 'primary'); }
  catch (error) { showError(t('This page could not be rendered.', '此页面无法渲染。')); console.error(error); }
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function continuousFitWidthMismatch() {
  if (readingFlow !== 'continuous' || zoomMode !== 'fit-width' || !primaryCanvasWrap) return false;
  const expected = Math.max(220, primaryCanvasWrap.clientWidth - 46);
  if (Math.abs(expected - continuousLayoutWidth) > 2) return true;
  for (const record of continuousPageNodes.values()) {
    if (!record.rendered) continue;
    const width = record.surface?.getBoundingClientRect?.().width || 0;
    if (width && Math.abs(width - expected) > 3) return true;
  }
  return false;
}

async function stabilizeFitWidthLayout(anchorOverride = null) {
  if (!pdfDoc || zoomMode !== 'fit-width' || fitWidthStabilizing) return;
  fitWidthStabilizing = true;
  try {
    clearTimeout(readerWidthTimer);
    // On tab/history return the browser may expose scrollTop=0 for the first
    // frame. When a caller supplies the last stable anchor, never replace it
    // with that transient page-1 position before fit-width rebuilding.
    const suppliedAnchor = anchorOverride && Number.isFinite(Number(anchorOverride.page))
      ? { page: Number(anchorOverride.page), ratio: Math.min(1, Math.max(0, Number(anchorOverride.ratio) || 0)) }
      : null;
    const anchor = readingFlow === 'continuous'
      ? (suppliedAnchor || captureContinuousAnchor() || continuousSavedAnchor || { page: currentPage, ratio: 0 })
      : null;
    // Browser-history restores can report an intermediate grid width for one or
    // more frames. Sample it repeatedly and rebuild until rendered page widths
    // agree with the final reading-region width.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await nextFrame(); await nextFrame();
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 90 * attempt));
      if (!pdfDoc || zoomMode !== 'fit-width') return;
      lastObservedReaderWidth = Math.round(primaryCanvasWrap?.clientWidth || 0);
      if (readingFlow === 'continuous') {
        await buildContinuousDocument({ restore: true, anchor });
        await nextFrame();
        if (!continuousFitWidthMismatch()) break;
      } else {
        await renderCurrentPage();
        break;
      }
    }
  } finally {
    fitWidthStabilizing = false;
  }
}
function scheduleReaderWidthReflow() {
  if (!pdfDoc || zoomMode === 'custom' || fitWidthStabilizing) return;
  clearTimeout(readerWidthTimer);
  readerWidthTimer = setTimeout(async () => {
    if (!pdfDoc || zoomMode === 'custom') return;
    const width = Math.round(primaryCanvasWrap?.clientWidth || 0);
    if (width < 180) return;
    if (lastObservedReaderWidth && Math.abs(width - lastObservedReaderWidth) < 2) return;
    lastObservedReaderWidth = width;
    const anchor = readingFlow === 'continuous' ? (captureContinuousAnchor() || continuousSavedAnchor) : null;
    if (readingFlow === 'continuous') await buildContinuousDocument({ restore: true, anchor });
    else await renderCurrentPage();
    await renderReferencePage();
  }, 140);
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

function normalizeReadingTrail(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item && Number(item.page) >= 1).slice(-40).map((item) => ({
    page: Number(item.page),
    ratio: Math.min(1, Math.max(0, Number(item.ratio) || 0)),
    snippet: typeof item.snippet === 'string' ? item.snippet.slice(0, 180) : '',
    created: Number(item.created) || Date.now()
  }));
}

async function readingTrailEntry(anchor) {
  const page = Math.min(Math.max(1, Number(anchor?.page) || currentPage), pdfDoc?.numPages || 1);
  const ratio = Math.min(1, Math.max(0, Number(anchor?.ratio) || 0));
  let snippet = '';
  try {
    const text = (await pageText(page)).replace(/\s+/g, ' ').trim();
    if (text) {
      const center = Math.min(text.length - 1, Math.max(0, Math.round(ratio * text.length)));
      const from = Math.max(0, center - 55);
      const to = Math.min(text.length, center + 95);
      snippet = `${from > 0 ? '…' : ''}${text.slice(from, to).trim()}${to < text.length ? '…' : ''}`;
    }
  } catch (_) {}
  return { page, ratio, snippet, created: Date.now() };
}

function renderReadingTrail() {
  if (!readingTrailList) return;
  readingTrailList.replaceChildren();
  if (readingTrailCount) readingTrailCount.textContent = String(readingBackStack.length);
  if (readingTrailEmpty) readingTrailEmpty.classList.toggle('is-hidden', readingBackStack.length > 0);
  if (readingTrailClear) readingTrailClear.disabled = readingBackStack.length === 0;
  const entries = readingBackStack.map((entry, index) => ({ entry, index })).reverse();
  for (const { entry, index } of entries) {
    const row = document.createElement('div'); row.className = 'reading-trail-item';
    const jump = document.createElement('button'); jump.type = 'button'; jump.className = 'reading-trail-jump';
    const title = document.createElement('strong');
    title.textContent = t(`Page ${entry.page} · ${Math.round(entry.ratio * 100)}%`, `第 ${entry.page} 页 · ${Math.round(entry.ratio * 100)}%`);
    const preview = document.createElement('span'); preview.textContent = entry.snippet || t('Saved reading position', '已保存的阅读位置');
    jump.append(title, preview);
    jump.addEventListener('click', async () => {
      const target = readingBackStack[index];
      readingBackStack = readingBackStack.slice(0, index);
      updateReadingBackButton(); renderReadingTrail(); persistDocumentState();
      suppressReadingHistory = true;
      try { await goToLocation(target.page, target.ratio); } finally { suppressReadingHistory = false; }
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'reading-trail-remove';
    remove.textContent = '×'; remove.title = t('Remove from reading trail', '从阅读轨迹中移除');
    remove.addEventListener('click', () => {
      readingBackStack.splice(index, 1);
      updateReadingBackButton(); renderReadingTrail(); persistDocumentState();
    });
    row.append(jump, remove); readingTrailList.append(row);
  }
}

async function goToLocation(page, ratio = 0) {
  if (!pdfDoc) return;
  if (!suppressReadingHistory) {
    const here = readingFlow === 'continuous' ? (captureContinuousAnchor() || { page: currentPage, ratio: 0 }) : { page: currentPage, ratio: Math.min(1, Math.max(0, primaryCanvasWrap.scrollTop / Math.max(1, primaryPageSurface?.offsetHeight || 1))) };
    const targetPage = Math.min(Math.max(1, Number(page) || 1), pdfDoc.numPages);
    if (here && (Number(here.page) !== targetPage || Math.abs(Number(here.ratio || 0) - Number(ratio || 0)) > 0.02)) {
      const entry = await readingTrailEntry(here);
      const last = readingBackStack.at(-1);
      if (!last || last.page !== entry.page || Math.abs(last.ratio - entry.ratio) > 0.015) readingBackStack.push(entry);
      if (readingBackStack.length > 40) readingBackStack.shift();
      updateReadingBackButton(); renderReadingTrail();
    }
  }
  const next = Math.min(Math.max(1, Math.round(Number(page) || 1)), pdfDoc.numPages);
  const localRatio = Math.min(1, Math.max(0, Number(ratio) || 0));
  const changed = next !== currentPage;
  currentPage = next;
  hideSelectionToolbar();
  window.getSelection()?.removeAllRanges();
  if (readingFlow === 'continuous') {
    updateNavigationState();
    let record = continuousPageNodes.get(next);
    if (!record) {
      await buildContinuousDocument({ anchor: { page: next, ratio: localRatio } });
      record = continuousPageNodes.get(next);
    }
    if (record) {
      await renderContinuousPage(next, continuousGeneration);
      const surfaceTop = record.frame.offsetTop + (record.surface?.offsetTop || 0);
      const surfaceHeight = Math.max(1, record.surface?.offsetHeight || record.frame.offsetHeight || 1);
      primaryCanvasWrap.scrollTop = Math.max(0, surfaceTop + surfaceHeight * localRatio - 10);
      currentPage = next;
      updateNavigationState();
      continuousSavedAnchor = { page: next, ratio: localRatio };
    }
    persistDocumentState();
    return;
  }
  if (changed) await renderCurrentPage(); else updateNavigationState();
  const pageHeight = Math.max(1, primaryPageSurface?.offsetHeight || canvas?.getBoundingClientRect().height || 1);
  primaryCanvasWrap.scrollTop = Math.max(0, pageHeight * localRatio - 10);
  scrollByPage[String(next)] = { top: primaryCanvasWrap.scrollTop, left: primaryCanvasWrap.scrollLeft };
  persistDocumentState();
}

function updateReadingBackButton() {
  if (readingBackButton) readingBackButton.disabled = !pdfDoc || readingBackStack.length === 0;
  if (readingTrailCount) readingTrailCount.textContent = String(readingBackStack.length);
}

async function goBackReadingLocation() {
  const target = readingBackStack.pop();
  updateReadingBackButton(); renderReadingTrail(); persistDocumentState();
  if (!target || !pdfDoc) return;
  suppressReadingHistory = true;
  try { await goToLocation(target.page, target.ratio); } finally { suppressReadingHistory = false; }
}

async function goToPage(page) {
  return goToLocation(page, 0);
}

function renderReferenceStack() {
  if (!referenceStack) return;
  referenceStack.replaceChildren();
  for (const page of referencePages) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'reference-stack-chip';
    chip.classList.toggle('is-active', page === pinnedPage);
    chip.textContent = t(`Page ${page}`, `第 ${page} 页`);
    chip.addEventListener('click', () => setPinnedPage(page));
    referenceStack.append(chip);
  }
}

function setPinnedPage(page) {
  if (!pdfDoc) return;
  setOcrMode(false);
  pinnedPage = Math.min(Math.max(1, Number(page) || currentPage), pdfDoc.numPages);
  referencePages = [pinnedPage, ...referencePages.filter((item) => item !== pinnedPage)].slice(0, 4);
  renderReferenceStack();
  persistDocumentState();
  renderReferencePage();
}

function clearPinnedPage() {
  setOcrMode(false);
  pinnedPage = null;
  renderReferenceStack();
  persistDocumentState();
  renderReferencePage();
}

function flattenOutline(items, depth = 0, output = []) {
  for (const item of items || []) {
    output.push({ item, depth: Math.min(depth, 3) });
    if (item.items?.length) flattenOutline(item.items, depth + 1, output);
  }
  return output;
}

function updateOutlineSource() {
  if (!outlineSource) return;
  outlineSource.classList.toggle('is-hidden', outlineMode === 'none');
  if (outlineMode === 'embedded') {
    outlineSource.textContent = t('Embedded PDF outline', 'PDF 嵌入式目录');
  } else if (outlineMode === 'inferred') {
    outlineSource.textContent = t('Detected outline · inferred from page typography and numbering', '自动检测目录 · 根据页面字号与编号推断');
  } else {
    outlineSource.textContent = '';
  }
}

function normalizedHeadingText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function weightedMedianFont(samples) {
  const values = samples
    .filter((sample) => Number.isFinite(sample.size) && sample.size > 3 && sample.size < 80 && sample.weight > 0)
    .sort((a, b) => a.size - b.size);
  if (!values.length) return 10;
  const total = values.reduce((sum, sample) => sum + sample.weight, 0);
  let acc = 0;
  for (const sample of values) {
    acc += sample.weight;
    if (acc >= total / 2) return sample.size;
  }
  return values[values.length - 1].size;
}

function headingNumberDepth(text) {
  const match = text.match(/^\s*(?:§\s*)?(\d+(?:\.\d+){0,4})[.)]?\s+\S/);
  if (!match) return null;
  return Math.min(3, match[1].split('.').length - 1);
}

function isKnownHeading(text) {
  return /^(?:abstract|introduction|background|preliminaries|notation|setup|main results?|results?|discussion|conclusions?|references|bibliography|acknowledg(?:e)?ments?|purpose|appendix(?:\s+[A-Z0-9]+)?|contents)$/i.test(text.trim());
}

function isMathEnvironmentLabel(text) {
  return /^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|proof)\b/i.test(text.trim());
}


function isLikelyFormulaHeading(text) {
  const value = String(text || '').trim();
  if (!value || isKnownHeading(value)) return false;
  // Strong equation/operator signals are far more likely to be display math
  // than document structure.
  if (/[=≤≥≠≈∫∑∏√∂∇⋃⋂∞±×·^_]|(?:\b(?:lim|sup|inf)\b.*[→∞])/u.test(value)) return true;
  const remainder = value
    .replace(/^\s*(?:§\s*)?\d+(?:\.\d+){0,4}[.)]?\s*/, '')
    .replace(/^\s*[A-Z][.)]\s*/, '')
    .trim();
  const asciiWords = remainder.match(/[A-Za-z]{3,}/g) || [];
  const hanChars = remainder.match(/\p{Script=Han}/gu) || [];
  const tokens = remainder.split(/\s+/).filter(Boolean);
  const shortVariableTokens = tokens.filter((token) => /^[\p{L}\p{N}πρσφθμνξωαβγδκηλ]+$/u.test(token) && [...token].length <= 2).length;
  const symbolCount = (remainder.match(/[+\-*\/(){}[\],:;|]/g) || []).length;
  const digitCount = (remainder.match(/\d/g) || []).length;
  const letterCount = (remainder.match(/\p{L}/gu) || []).length;
  if (headingNumberDepth(value) !== null && asciiWords.length < 2 && hanChars.length < 2) return true;
  if (tokens.length >= 1 && shortVariableTokens / tokens.length >= 0.6 && asciiWords.length < 2 && hanChars.length < 2) return true;
  if (symbolCount >= 2 && asciiWords.length < 2 && hanChars.length < 2) return true;
  if (digitCount > 0 && digitCount >= Math.max(2, letterCount) && asciiWords.length < 2) return true;
  return false;
}
function headingDepthFromStyle(line, bodySize) {
  const numbered = headingNumberDepth(line.text);
  if (numbered !== null) return numbered;
  if (/^appendix\b/i.test(line.text)) return 0;
  const ratio = line.size / Math.max(1, bodySize);
  if (ratio >= 1.55) return 0;
  if (ratio >= 1.30) return 1;
  return 2;
}

async function detectOutlineFromTypography() {
  const pages = [];
  const fontSamples = [];
  const repeatMap = new Map();
  const maxPages = Math.min(pdfDoc.numPages, 600);

  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = [];
    for (const item of content.items || []) {
      const text = normalizedHeadingText(item.str);
      if (!text) continue;
      const tr = item.transform || [1, 0, 0, 1, 0, 0];
      const size = Math.max(1, Math.hypot(Number(tr[0]) || 0, Number(tr[1]) || 0) || Number(item.height) || 1);
      const x = Number(tr[4]) || 0;
      const y = Number(tr[5]) || 0;
      items.push({ text, size, x, y, width: Number(item.width) || 0, fontName: item.fontName || '' });
      fontSamples.push({ size, weight: Math.max(1, text.replace(/\s/g, '').length) });
    }
    items.sort((a, b) => Math.abs(b.y - a.y) > 1.5 ? b.y - a.y : a.x - b.x);
    const lines = [];
    for (const item of items) {
      let line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= Math.max(1.8, item.size * 0.22));
      if (!line) {
        line = { page: pageNum, y: item.y, x: item.x, items: [], size: item.size, pageHeight: viewport.height };
        lines.push(line);
      }
      line.items.push(item);
      line.size = Math.max(line.size, item.size);
      line.x = Math.min(line.x, item.x);
    }
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
      line.text = normalizedHeadingText(line.items.map((item) => item.text).join(' '));
      line.normalized = line.text.toLocaleLowerCase().replace(/\d+/g, '#').replace(/[^\p{L}#]+/gu, ' ').trim();
      if (line.normalized) {
        const key = line.normalized;
        const record = repeatMap.get(key) || { pages: new Set(), top: 0, bottom: 0 };
        record.pages.add(pageNum);
        if (line.y > viewport.height * 0.88) record.top += 1;
        if (line.y < viewport.height * 0.10) record.bottom += 1;
        repeatMap.set(key, record);
      }
    }
    pages.push(lines);
  }

  const bodySize = weightedMedianFont(fontSamples);
  const candidates = [];
  for (const lines of pages) {
    for (const line of lines) {
      const text = line.text;
      if (!text || text.length < 2 || text.length > 125) continue;
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length > 18) continue;
      const numberedDepth = headingNumberDepth(text);
      const known = isKnownHeading(text);
      const ratio = line.size / Math.max(1, bodySize);
      const styleHeading = ratio >= 1.18 && words.length <= 14 && !/[.;,]$/.test(text);
      if (!known && numberedDepth === null && !styleHeading) continue;
      if (isMathEnvironmentLabel(text) && ratio < 1.35) continue;
      if (isLikelyFormulaHeading(text)) continue;
      if (/^[\d\s()[\]{}.,:+\-–—=<>≤≥∑∫∞]+$/.test(text)) continue;

      const repetition = repeatMap.get(line.normalized);
      const repeatedOn = repetition?.pages?.size || 0;
      const likelyRunningHeader = repeatedOn >= 3 && repeatedOn >= Math.max(3, Math.ceil(maxPages * 0.25)) && ((repetition?.top || 0) + (repetition?.bottom || 0) >= repeatedOn * 0.7);
      if (likelyRunningHeader) continue;

      candidates.push({
        title: text,
        page: line.page,
        depth: headingDepthFromStyle(line, bodySize),
        size: Number(line.size.toFixed(2)),
        y: line.y,
        ratio: Math.min(1, Math.max(0, (line.pageHeight - line.y) / Math.max(1, line.pageHeight)))
      });
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const candidate of candidates.sort((a, b) => a.page - b.page || b.y - a.y)) {
    const key = `${candidate.page}:${candidate.title.toLocaleLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
  }
  return deduped.slice(0, 240);
}

function renderInferredOutline(entries) {
  outlineList.replaceChildren();
  outlineCount.textContent = String(entries.length);
  outlineEmpty.classList.toggle('is-hidden', entries.length > 0);
  if (!entries.length) {
    outlineMode = 'none';
    updateOutlineSource();
    outlineEmpty.textContent = t('No reliable document headings were detected.', '未检测到足够可靠的文档标题。');
    return;
  }
  outlineMode = 'inferred';
  updateOutlineSource();
  for (const entry of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outline-item';
    button.dataset.depth = String(Math.min(3, Math.max(0, Number(entry.depth) || 0)));
    button.textContent = entry.title;
    button.title = t(`Detected heading · page ${entry.page}`, `自动检测标题 · 第 ${entry.page} 页`);
    button.addEventListener('click', () => goToLocation(entry.page, Number.isFinite(Number(entry.ratio)) ? Number(entry.ratio) : 0));
    outlineList.append(button);
  }
}

const STRUCTURE_LABEL_RE = /^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|conjecture|assumption|hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])(?:[.:)]|\s)/i;

async function buildStructureIndex({ force = false } = {}) {
  if (!pdfDoc || !structureIndex || structureIndexBuilding) return;
  if (!force && structureIndexVersion === STRUCTURE_INDEX_VERSION) {
    renderStructureIndex();
    return;
  }

  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const sourceTextCache = textCache;
  const token = ++structureIndexBuildToken;
  structureIndexBuilding = true;
  buildStructureIndexButton.disabled = true;
  structureEmpty.classList.remove('is-hidden');
  structureEmpty.textContent = t('Building theorem and definition index in the background…', '正在后台生成定理与定义索引……');

  const nextEntries = [];
  try {
    const maxPages = Math.min(sourceDoc.numPages, 800);
    for (let page = 1; page <= maxPages; page += 1) {
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== structureIndexBuildToken) return;
      const text = await pageText(page, sourceDoc, sourceTextCache);
      const parts = text.split(/(?<=[.!?])\s+|(?=(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Assumption|Hypothesis)\s+)/i);
      for (const part of parts) {
        const cleaned = String(part || '').replace(/\s+/g, ' ').trim();
        const match = cleaned.match(/(?:^|[.;:]\s*)((?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Assumption|Hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])(?:[.:)]|\s)[^.!?]{0,150})/i);
        if (!match) continue;
        const title = match[1].replace(/\s+/g, ' ').trim().replace(/\s+([.:,)])/g, '$1');
        if (!STRUCTURE_LABEL_RE.test(title)) continue;
        const label = title.match(/^(.*?)(?=[.:)]\s|\s{2,}|$)/)?.[1] || title.slice(0, 80);
        const key = `${page}:${label.toLowerCase()}`;
        if (nextEntries.some((entry) => entry.key === key)) continue;
        nextEntries.push({ key, page, title: title.slice(0, 180) });
      }
      // Keep long books responsive while the index is prepared in the background.
      if (page % 12 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== structureIndexBuildToken) return;
    structureEntries = nextEntries.slice(0, 500);
    structureIndexVersion = STRUCTURE_INDEX_VERSION;
    renderStructureIndex();
    persistDocumentState();
  } catch (error) {
    console.warn('Theorem/definition index build failed', error);
    if (pdfDoc === sourceDoc && currentFileKey === sourceKey && token === structureIndexBuildToken) {
      structureEmpty.classList.remove('is-hidden');
      structureEmpty.textContent = t('The theorem and definition index could not be built. Use Rebuild index to try again.', '无法生成定理与定义索引。可使用“重新生成索引”再次尝试。');
    }
  } finally {
    if (token === structureIndexBuildToken) {
      structureIndexBuilding = false;
      buildStructureIndexButton.disabled = !pdfDoc;
    }
  }
}

function scheduleAutomaticStructureIndex() {
  if (!pdfDoc || structureIndexVersion === STRUCTURE_INDEX_VERSION || structureIndexBuilding) return;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const run = () => {
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || structureIndexVersion === STRUCTURE_INDEX_VERSION) return;
    buildStructureIndex();
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 700 });
  else setTimeout(run, 120);
}

function renderStructureIndex() {
  if (!structureIndex || !structureEmpty || !structureCount) return;
  structureIndex.replaceChildren();
  structureCount.textContent = String(structureEntries.length);
  structureEmpty.classList.toggle('is-hidden', structureEntries.length > 0);
  if (!structureEntries.length) {
    structureEmpty.textContent = structureIndexBuilding
      ? t('Building theorem and definition index in the background…', '正在后台生成定理与定义索引……')
      : t('The theorem and definition index is prepared automatically for this document.', '此文档的定理与定义索引会自动生成。');
    return;
  }
  for (const entry of structureEntries) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'structure-item';
    const strong = document.createElement('strong'); strong.textContent = entry.title.replace(/([.:)].*)$/, '$1').slice(0, 80);
    const meta = document.createElement('span'); meta.textContent = t(`Page ${entry.page}`, `第 ${entry.page} 页`);
    button.append(strong, meta);
    button.title = entry.title;
    button.addEventListener('click', () => goToPage(entry.page));
    structureIndex.append(button);
  }
}

async function resolveOutlineDestination(rawDest) {
  if (!pdfDoc) return null;
  let dest = rawDest;
  if (typeof dest === 'string') dest = await pdfDoc.getDestination(dest);
  if (!Array.isArray(dest) || !dest[0]) return null;
  const pageIndex = await pdfDoc.getPageIndex(dest[0]);
  const pageNum = pageIndex + 1;
  let ratio = 0;
  const mode = dest[1]?.name || '';
  let top = null;
  if (mode === 'XYZ') top = Number(dest[3]);
  else if (mode === 'FitH' || mode === 'FitBH') top = Number(dest[2]);
  else if (mode === 'FitR') top = Number(dest[5]);
  if (Number.isFinite(top)) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const view = Array.isArray(page.view) ? page.view : [0, 0, 1, 1];
      const yMin = Number(view[1]) || 0;
      const yMax = Number(view[3]) || 1;
      ratio = Math.min(1, Math.max(0, (yMax - top) / Math.max(1, yMax - yMin)));
    } catch (_) {}
  }
  return { page: pageNum, ratio };
}

async function renderOutline() {
  outlineList.replaceChildren();
  outlineMode = 'none';
  updateOutlineSource();
  if (!pdfDoc) return;
  try {
    const outline = await pdfDoc.getOutline();
    const flat = flattenOutline(outline);
    if (flat.length) {
      outlineMode = 'embedded';
      updateOutlineSource();
      outlineCount.textContent = flat.length;
      outlineEmpty.classList.add('is-hidden');
      for (const { item, depth } of flat) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'outline-item';
        button.dataset.depth = String(depth);
        button.textContent = item.title || t('Untitled', '未命名');
        button.addEventListener('click', async () => {
          try {
            const location = await resolveOutlineDestination(item.dest);
            if (!location) return;
            await goToLocation(location.page, location.ratio);
          } catch (error) { console.error(error); }
        });
        outlineList.append(button);
      }
      return;
    }

    outlineEmpty.classList.remove('is-hidden');
    outlineEmpty.textContent = t('No embedded outline. Detecting document structure…', '没有嵌入式目录，正在自动检测文档结构……');
    if (!inferredOutline.length) {
      inferredOutline = await detectOutlineFromTypography();
      persistDocumentState();
    }
    renderInferredOutline(inferredOutline);
  } catch (error) {
    outlineMode = 'none';
    updateOutlineSource();
    outlineEmpty.classList.remove('is-hidden');
    outlineEmpty.textContent = t('The document outline could not be read or detected.', '无法读取或自动检测文档目录。');
    console.error(error);
  }
}

async function pageText(pageNum, sourceDoc = pdfDoc, cache = textCache) {
  if (cache.has(pageNum)) return cache.get(pageNum);
  const page = await sourceDoc.getPage(pageNum);
  const content = await page.getTextContent();
  const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
  cache.set(pageNum, text);
  return text;
}

function normalizeSearchValue(value, matchCase = false) {
  let text = String(value || '').normalize('NFKC')
    .replace(/\u00ad/g, '')
    .replace(/[ﬀﬁﬂﬃﬄ]/g, (ch) => ({ 'ﬀ':'ff','ﬁ':'fi','ﬂ':'fl','ﬃ':'ffi','ﬄ':'ffl' }[ch] || ch))
    .replace(/-\s*\n\s*(?=\p{L})/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return matchCase ? text : text.toLocaleLowerCase();
}

function searchTextMatch(text, query) {
  const matchCase = Boolean(searchMatchCase?.checked);
  const wholeWord = Boolean(searchWholeWord?.checked);
  const haystack = normalizeSearchValue(text, matchCase);
  const needle = normalizeSearchValue(query, matchCase);
  if (!needle) return { matched: false, index: -1 };
  let index = haystack.indexOf(needle);
  if (index < 0) return { matched: false, index: -1 };
  if (wholeWord && /^[\p{L}\p{N}_]+$/u.test(needle)) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})(?=$|[^\\p{L}\\p{N}_])`, matchCase ? 'u' : 'iu');
    const m = normalizeSearchValue(text, true).match(re);
    if (!m) return { matched: false, index: -1 };
  }
  const direct = matchCase ? text.indexOf(query) : text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  return { matched: true, index: direct >= 0 ? direct : Math.max(0, text.toLocaleLowerCase().indexOf(query.split(/\s+/)[0].toLocaleLowerCase())) };
}

function highlightedSnippet(text, query, index = -1) {
  const safeIndex = index >= 0 ? index : 0;
  const start = Math.max(0, safeIndex - 65);
  const hitLength = Math.max(1, query.length);
  const end = Math.min(text.length, safeIndex + hitLength + 95);
  const before = text.slice(start, safeIndex);
  const hit = text.slice(safeIndex, Math.min(text.length, safeIndex + hitLength));
  const after = text.slice(Math.min(text.length, safeIndex + hitLength), end);
  const frag = document.createDocumentFragment();
  if (start > 0) frag.append('…');
  frag.append(before);
  if (hit) { const mark = document.createElement('span'); mark.className = 'search-hit'; mark.textContent = hit; frag.append(mark); }
  frag.append(after);
  if (end < text.length) frag.append('…');
  return frag;
}

function selectedReferenceQuery() {
  const text = String(currentSelection?.text || '').replace(/\s+/g, ' ').trim();
  const match = text.match(/\b(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Section)\s+[A-Z]?\d+(?:\.\d+)*\b/i)
    || text.match(/\(\s*\d+(?:\.\d+)*\s*\)/);
  return match?.[0] || '';
}

async function goToSelectedReference() {
  if (!pdfDoc) return;
  const query = selectedReferenceQuery();
  if (!query) { showError(t('Select a reference such as “Theorem 2.4”, “Section 3”, or “(4.7)”.', '请选择类似“Theorem 2.4”、“Section 3”或“(4.7)”的引用。')); return; }
  const normalized = normalizeSearchValue(query, false);
  let fallback = null;
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    const text = await pageText(page);
    if (!normalizeSearchValue(text, false).includes(normalized)) continue;
    if (page !== currentPage) { await goToPage(page); return; }
    fallback = page;
  }
  if (fallback) showError(t('The selected reference appears only on the current page.', '所选引用仅出现在当前页。'));
  else showError(t('No matching reference label was found in this PDF.', '未在此 PDF 中找到匹配的引用标签。'));
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
      const result = searchTextMatch(text, q);
      if (result.matched) matches.push({ page, text, index: result.index });
    } catch (error) { console.error(error); }
    if (page % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  searchStatus.textContent = t(`${matches.length} matching page${matches.length === 1 ? '' : 's'}`, `${matches.length} 个匹配页面`);
  for (const match of matches.slice(0, 100)) {
    const item = document.createElement('button');
    item.type = 'button'; item.className = 'search-result';
    const label = document.createElement('strong'); label.textContent = t(`Page ${match.page}`, `第 ${match.page} 页`);
    const snippet = document.createElement('p'); snippet.append(highlightedSnippet(match.text, q, match.index));
    item.append(label, snippet);
    item.addEventListener('click', () => goToPage(match.page));
    searchResults.append(item);
  }
}

function scheduleNotePreview() {
  clearTimeout(notePreviewTimer);
  notePreviewTimer = setTimeout(renderNotePreview, 180);
}
async function renderNotePreview() {
  if (!notePreview) return;
  const value = String(pageNote?.value || '').trim();
  notePreview.classList.toggle('is-hidden', !value);
  if (!value) { notePreview.replaceChildren(); return; }
  try { window.MathJax?.typesetClear?.([notePreview]); } catch (_) {}
  notePreview.textContent = value;
  if (window.MathJax?.typesetPromise) {
    try { await window.MathJax.typesetPromise([notePreview]); } catch (error) { console.warn('MathReader note MathJax preview failed', error); }
  }
}

function formatBookmarkTime(timestamp) {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat(root.dataset.lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(timestamp));
  } catch (_) { return new Date(timestamp).toLocaleString(); }
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
    jump.append(strong, detail); jump.addEventListener('click', () => goToPage(bookmark.page));
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'bookmark-edit'; edit.textContent = '✎'; edit.title = t('Edit bookmark', '编辑书签');
    edit.addEventListener('click', () => { editingBookmarkId = editingBookmarkId === bookmark.id ? null : bookmark.id; renderBookmarks(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'bookmark-remove'; remove.textContent = '×'; remove.setAttribute('aria-label', t('Remove bookmark', '删除书签'));
    remove.addEventListener('click', () => {
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
}

function addCurrentBookmark() {
  if (!pdfDoc) return;
  const existing = bookmarks.find((item) => item.page === currentPage);
  if (existing) { editingBookmarkId = existing.id; renderBookmarks(); return; }
  const item = { id: `bm-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, page: currentPage, title: '', note: '', color: 'blue', created: Date.now() };
  bookmarks.push(item); editingBookmarkId = item.id;
  persistDocumentState(); renderBookmarks();
}

function saveCurrentOcrAsEquation() {
  if (!pdfDoc || !currentOcrResult?.latex) return;
  const page = Number(currentOcrResult.page) || currentPage;
  const item = {
    id: `eq-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    page, title: '', note: '', color: 'purple', created: Date.now(), type: 'equation',
    latex: String(ocrLatexPreview?.value || currentOcrResult.latex).trim(), preview: currentOcrResult.preview || ''
  };
  bookmarks.push(item); editingBookmarkId = item.id;
  persistDocumentState(); renderBookmarks();
  openLeftPanelShortcut('bookmarks-panel');
}

async function openPdfSource({ data, meta, cachedRecord = null, cacheBlob = null }) {
  setLoading(true, cachedRecord ? t('Restoring local reading session…', '正在恢复本地阅读现场……') : t('Opening PDF…', '正在打开 PDF……'));
  restoringSession = true;
  try {
    const lib = await ensurePdfJs();
    if (pdfDoc) { try { await pdfDoc.destroy(); } catch (_) {} }
    const task = lib.getDocument({ data });
    pdfDoc = await task.promise;
    currentFileName = meta.name;
    currentFileKey = meta.id;
    cacheEnabledForCurrent = Boolean(cachedRecord);
    textCache = new Map();
    currentSelection = null;
    setOcrMode(false);
    hideSelectionToolbar();
    loadDocumentState(cachedRecord?.session || null);
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
    renderReferenceStack();
    updateReadingBackButton();
    await stabilizeFitWidthLayout();
    await renderReferencePage();
    updateReferenceStatus();
    if (cacheBlob) await cacheOpenedPdf(meta, cacheBlob);
    else if (cachedRecord) await touchCachedPdf(cachedRecord);
    persistDocumentState();
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
    if (pdfDoc) scheduleAutomaticStructureIndex();
    fileInput.value = '';
  }
}

async function openPdfFile(file, recoveryId = null) {
  if (!file || (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
    showError(t('Please choose a PDF file.', '请选择 PDF 文件。'));
    return;
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    let id = makeFileKey(file.name, file.size, file.lastModified || 0);
    let cachedRecord = null;
    if (recoveryId) {
      try {
        const recovery = await dbGet('documents', recoveryId);
        if (recovery && recovery.name === file.name && Number(recovery.size) === Number(file.size)) {
          id = recovery.id;
          cachedRecord = recovery;
          delete cachedRecord.cacheError;
        } else if (recovery) {
          showError(t('The selected PDF does not match the missing cached file. It will be opened as a new document.', '所选 PDF 与缺失的缓存文件不匹配，将作为新文档打开。'));
        }
      } catch (_) {}
    }
    if (!cachedRecord) { try { cachedRecord = await dbGet('documents', id); } catch (_) {} }
    const blob = file.slice(0, file.size, 'application/pdf');
    await openPdfSource({
      data: new Uint8Array(arrayBuffer),
      meta: { id, name: file.name, size: file.size, lastModified: file.lastModified || 0 },
      cachedRecord,
      cacheBlob: blob
    });
  } catch (_) {}
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
  if (zoomMode !== 'custom') {
    const page = await pdfDoc.getPage(currentPage);
    const baseViewport = page.getViewport({ scale: 1 });
    const visibleCanvas = readingFlow === 'continuous' ? continuousPageNodes.get(currentPage)?.canvas : canvas;
    const renderedWidth = visibleCanvas?.getBoundingClientRect().width || canvas.getBoundingClientRect().width;
    zoomScale = renderedWidth > 0 ? renderedWidth / baseViewport.width : 1.2;
  }
  zoomMode = 'custom';
  zoomScale = Math.max(.4, Math.min(3.5, zoomScale + delta));
  updateZoomLabel();
  persistDocumentState();
  renderCurrentPage();
}

function setFitMode(mode) {
  if (!pdfDoc) return;
  zoomMode = mode;
  updateZoomLabel();
  persistDocumentState();
  renderCurrentPage();
}

function activatePanel(panelId, persist = true) {
  const exists = document.getElementById(panelId);
  if (!exists) panelId = 'outline-panel';
  document.querySelectorAll('.sidebar-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.panel === panelId));
  document.querySelectorAll('.sidebar-panel').forEach((panel) => panel.classList.toggle('is-active', panel.id === panelId));
  if (persist && pdfDoc) persistDocumentState();
}

document.querySelectorAll('.sidebar-tab').forEach((tab) => tab.addEventListener('click', () => activatePanel(tab.dataset.panel)));

openButton.addEventListener('click', () => fileInput.click());
welcomeOpen.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { const recoveryId = pendingRecoveryRecordId; pendingRecoveryRecordId = null; openPdfFile(fileInput.files?.[0], recoveryId); });
prevPage.addEventListener('click', () => goToPage(currentPage - 1));
nextPage.addEventListener('click', () => goToPage(currentPage + 1));
pageNumberInput.addEventListener('change', () => goToPage(pageNumberInput.value));
zoomIn.addEventListener('click', () => changeZoom(.15));
zoomOut.addEventListener('click', () => changeZoom(-.15));
zoomLabel.addEventListener('click', () => setFitMode('fit-width'));
fitPage.addEventListener('click', () => setFitMode('fit-page'));
ocrHistoryToggle?.addEventListener('click', () => { ocrHistoryExpanded = !ocrHistoryExpanded; refreshOcrUI(); });
flowButton.addEventListener('click', () => setReadingFlow(readingFlow === 'continuous' ? 'single' : 'continuous'));
flowSingle?.addEventListener('click', () => setReadingFlow('single'));
flowContinuous?.addEventListener('click', () => setReadingFlow('continuous'));
resetDisplay?.addEventListener('click', resetDisplayPreferences);
pageToneSelect?.addEventListener('change', () => { pageTone = pageToneSelect.value; applyPageDisplay(); });
brightnessRange?.addEventListener('input', () => { displayBrightness = clamp(brightnessRange.value, 70, 115, 100); applyPageDisplay(); });
contrastRange?.addEventListener('input', () => { displayContrast = clamp(contrastRange.value, 80, 120, 100); applyPageDisplay(); });
gapRange?.addEventListener('input', () => { displayGap = clamp(gapRange.value, 8, 44, 20); applyPageDisplay(); });
pageShadow?.addEventListener('change', () => { displayShadow = pageShadow.checked; applyPageDisplay(); });
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
  if (!pdfDoc || !currentFileKey || !file) return;
  let payload;
  try { payload = JSON.parse(await file.text()); } catch (_) { showError(t('The selected reading-data file is not valid JSON.', '所选阅读数据文件不是有效的 JSON。')); return; }
  if (payload?.schema !== 'mathreader.reading-data@1' || !payload.session) { showError(t('This is not a MathReader reading-data export.', '这不是 MathReader 阅读数据导出文件。')); return; }
  if (payload.document?.id && payload.document.id !== currentFileKey) {
    const sameName = String(payload.document?.name || '') === String(currentFileName || '');
    const samePages = Number(payload.document?.pages || 0) === Number(pdfDoc.numPages || 0);
    if (!sameName || !samePages) { showError(t('This reading-data export belongs to a different PDF. Open the matching PDF before importing.', '此阅读数据属于另一份 PDF。请先打开匹配的 PDF 再导入。')); return; }
  }
  safeSet(stateKey('session-v2'), JSON.stringify(payload.session));
  loadDocumentState(payload.session);
  await Promise.all([renderOutline(), renderCurrentPage(), renderReferencePage()]);
  renderBookmarks(); renderStructureIndex(); renderReferenceStack(); renderAnnotationList(); rerenderVisibleAnnotations(); updateReadingBackButton(); persistDocumentState(); scheduleAutomaticStructureIndex();
}

function commandActions() {
  return [
    { label: t('Open PDF', '打开 PDF'), run: () => fileInput.click() },
    { label: t('Search this PDF', '搜索此 PDF'), run: () => openLeftPanelShortcut('search-panel', searchInput) },
    { label: t('Document contents', '文档目录'), run: () => openLeftPanelShortcut('outline-panel') },
    { label: t('Go to selected reference', '跳转到所选引用'), needsPdf: true, run: () => goToSelectedReference() },
    { label: t('Rebuild theorem & definition index', '重新生成定理与定义索引'), needsPdf: true, run: () => buildStructureIndex({ force: true }) },
    { label: t('Bookmark current page', '收藏当前页'), needsPdf: true, run: () => addCurrentBookmark() },
    { label: t('Page note', '页注'), needsPdf: true, run: () => openRightSectionShortcut('note-section', pageNote) },
    { label: t('Highlight selected text', '高亮所选文字'), needsPdf: true, run: () => addSelectionAnnotation('highlight') },
    { label: t('Add margin note to selection', '为所选文字添加页边注'), needsPdf: true, run: () => addSelectionAnnotation('margin') },
    { label: t('Annotations', '批注'), needsPdf: true, run: () => openRightSectionShortcut('annotations-section') },
    { label: t('Extract formula', '提取公式'), needsPdf: true, run: () => setOcrMode(true) },
    { label: t('Pin current page as reference', '固定当前页作为参考'), needsPdf: true, run: () => setPinnedPage(currentPage) },
    { label: t('Export reading data', '导出阅读数据'), needsPdf: true, run: () => exportReadingData() },
    { label: t('Back in reading trail', '返回阅读轨迹上一位置'), needsPdf: true, run: () => goBackReadingLocation() },
    { label: t('Reading trail', '阅读轨迹'), needsPdf: true, run: () => openRightSectionShortcut('reading-trail-section') }
  ].filter((item) => !item.needsPdf || pdfDoc);
}

function renderCommandPalette() {
  if (!commandList) return;
  const q = String(commandInput?.value || '').trim().toLocaleLowerCase();
  commandList.replaceChildren();
  const actions = commandActions().filter((item) => !q || item.label.toLocaleLowerCase().includes(q));
  for (const [index, action] of actions.entries()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'command-item'; button.textContent = action.label;
    if (index === 0) button.classList.add('is-current');
    button.addEventListener('click', () => { closeCommandPalette(); action.run(); });
    commandList.append(button);
  }
}

function openCommandPalette() {
  if (!commandPalette) return; commandPalette.classList.remove('is-hidden'); commandInput.value = ''; renderCommandPalette(); setTimeout(() => commandInput.focus(), 0);
}
function closeCommandPalette() { commandPalette?.classList.add('is-hidden'); }

formulaExtractionSelect?.addEventListener('change', () => {
  formulaExtractionMode = formulaExtractionSelect.value === 'vector' ? 'vector' : 'image';
  safeSet('mathreader-formula-method-v1', formulaExtractionMode);
  updateOcrCapability();
  setOcrStatus(formulaExtractionMode === 'image'
    ? t('Image OCR is now the default formula extractor.', '现在默认使用图像 OCR 提取公式。')
    : t('PDF vector is now the default formula extractor.', '现在默认使用 PDF 矢量提取公式。'));
});
ocrEngineSelect?.addEventListener('change', async () => { mathOcrEngineMode = normalizedOcrEngineMode(ocrEngineSelect.value); safeSet('mathreader-ocr-engine-v4', mathOcrEngineMode); await disposeMathOcrPipeline(); setOcrStatus(t('Image OCR engine preference changed. It will load on the next image extraction.', '图像 OCR 引擎偏好已更改，将在下一次图像提取时加载。')); });
ocrRetryButton?.addEventListener('click', async () => { await disposeMathOcrPipeline(); setOcrStatus(t('OCR engine reset. Select a formula region to load it again.', '公式 OCR 引擎已重置。重新框选公式即可再次加载。')); });
mathOcrButton.addEventListener('click', () => setOcrMode(!ocrMode));
pinPageButton.addEventListener('click', () => setPinnedPage(currentPage));
pinFromSidebar.addEventListener('click', () => setPinnedPage(currentPage));
unpinPage.addEventListener('click', clearPinnedPage);
referencePrev.addEventListener('click', () => { if (pinnedPage && pinnedPage > 1) setPinnedPage(pinnedPage - 1); });
referenceNext.addEventListener('click', () => { if (pinnedPage && pdfDoc && pinnedPage < pdfDoc.numPages) setPinnedPage(pinnedPage + 1); });
addBookmark.addEventListener('click', addCurrentBookmark);
readingBackButton?.addEventListener('click', goBackReadingLocation);
readingTrailClear?.addEventListener('click', () => { readingBackStack = []; updateReadingBackButton(); renderReadingTrail(); persistDocumentState(); });
buildStructureIndexButton?.addEventListener('click', () => buildStructureIndex({ force: true }));
exportReadingDataButton?.addEventListener('click', exportReadingData);
importReadingDataButton?.addEventListener('click', () => importReadingInput?.click());
importReadingInput?.addEventListener('change', async () => { const file = importReadingInput.files?.[0]; importReadingInput.value = ''; if (file) await importReadingDataFile(file); });
selectionGoReference?.addEventListener('click', goToSelectedReference);
selectionHighlight?.addEventListener('click', () => addSelectionAnnotation('highlight'));
selectionMarginNote?.addEventListener('click', () => addSelectionAnnotation('margin'));
saveOcrEquation?.addEventListener('click', saveCurrentOcrAsEquation);
commandInput?.addEventListener('input', renderCommandPalette);
commandInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { const first = commandList?.querySelector('.command-item'); if (first) { event.preventDefault(); first.click(); } }
  if (event.key === 'Escape') { event.preventDefault(); closeCommandPalette(); }
});
commandPalette?.addEventListener('pointerdown', (event) => { if (event.target === commandPalette) closeCommandPalette(); });
searchForm.addEventListener('submit', (event) => { event.preventDefault(); persistDocumentState(); searchPdf(searchInput.value); });
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
ocrLatexPreview?.addEventListener('input', () => {
  if (!currentOcrResult) return;
  currentOcrResult.latex = ocrLatexPreview.value;
  const match = ocrHistory.find((item) => item.created === currentOcrResult.created);
  if (match) match.latex = currentOcrResult.latex;
  persistDocumentState();
});
ocrToNote.addEventListener('click', addOcrToPageNote);
tryImageOcrButton?.addEventListener('click', tryImageOcrForCurrentResult);
tryPdfVectorButton?.addEventListener('click', () => {
  if (!currentOcrResult?.vectorAlternative) return;
  const item = {
    page: currentOcrResult.page,
    kind: currentOcrResult.kind,
    latex: currentOcrResult.vectorAlternative,
    preview: currentOcrResult.preview,
    created: Date.now(),
    quality: 'vector-comparison',
    source: 'vector',
    extractedText: currentOcrResult.vectorAlternativeText || null
  };
  commitFormulaResult(item, t('PDF vector comparison loaded.', '已载入 PDF 矢量对照结果。'));
});
clearOcrResultButton.addEventListener('click', clearOcrResultState);
bindOcrLayer(primaryOcrLayer);
bindOcrLayer(referenceOcrLayer);

[selectionToolbar, copySelectionText, copySelectionLatex, selectionToNote, selectionHighlight, selectionMarginNote, floatingHighlight, floatingMarginNote].forEach((node) => node?.addEventListener('pointerdown', (event) => event.preventDefault()));
selectionToolbar.addEventListener('pointerdown', (event) => event.preventDefault());
copySelectionText.addEventListener('click', () => copyPlainText(currentSelection?.text, copySelectionText));
copySelectionLatex.addEventListener('click', () => copyPlainText(currentSelection?.latex, copySelectionLatex));
selectionToNote.addEventListener('click', addSelectionToPageNote);
floatingCopyText.addEventListener('click', () => copyPlainText(currentSelection?.text, floatingCopyText));
floatingCopyLatex.addEventListener('click', () => copyPlainText(currentSelection?.latex, floatingCopyLatex));
floatingAddNote.addEventListener('click', () => { addSelectionToPageNote(); hideSelectionToolbar(); });
floatingHighlight?.addEventListener('click', () => { addSelectionAnnotation('highlight'); hideSelectionToolbar(); });
floatingMarginNote?.addEventListener('click', () => { addSelectionAnnotation('margin'); hideSelectionToolbar(); });
floatingPinPage.addEventListener('click', () => { if (currentSelection?.page) setPinnedPage(currentSelection.page); hideSelectionToolbar(); });
document.addEventListener('selectionchange', capturePdfSelection);
primaryCanvasWrap.addEventListener('scroll', () => {
  hideSelectionToolbar();
  if (!pdfDoc) return;
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

languageButton.addEventListener('click', () => applyLanguage(root.dataset.lang === 'zh' ? 'en' : 'zh'));
themeButton.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

leftToggle.addEventListener('click', () => {
  if (matchMedia('(max-width: 860px)').matches) {
    shell.classList.toggle('mobile-left-open'); shell.classList.remove('mobile-right-open');
  } else shell.classList.toggle('left-collapsed');
  if (pdfDoc) persistDocumentState();
  setTimeout(() => { if (pdfDoc) { renderCurrentPage(); renderReferencePage(); } }, 200);
});
rightToggle.addEventListener('click', () => {
  if (matchMedia('(max-width: 860px)').matches) {
    shell.classList.toggle('mobile-right-open'); shell.classList.remove('mobile-left-open');
  } else shell.classList.toggle('right-collapsed');
  if (pdfDoc) persistDocumentState();
  setTimeout(() => { if (pdfDoc) { renderCurrentPage(); renderReferencePage(); } }, 200);
});

function toggleBothSidePanels() {
  if (matchMedia('(max-width: 860px)').matches) return;
  const bothClosed = shell.classList.contains('left-collapsed') && shell.classList.contains('right-collapsed');
  shell.classList.toggle('left-collapsed', !bothClosed);
  shell.classList.toggle('right-collapsed', !bothClosed);
  if (pdfDoc) persistDocumentState();
  setTimeout(() => { if (pdfDoc) { renderCurrentPage(); renderReferencePage(); } }, 200);
}

bothPanelsToggle?.addEventListener('click', toggleBothSidePanels);

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
    if (rightSidebar && section) rightSidebar.scrollTo({ top: Math.max(0, section.offsetTop - 8), behavior: 'smooth' });
    focusTarget?.focus?.();
  }, 40);
  if (pdfDoc) persistDocumentState();
}

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === 'k') { event.preventDefault(); openCommandPalette(); return; }
  if (!typing && event.altKey && event.key === 'ArrowLeft') { event.preventDefault(); goBackReadingLocation(); return; }
  if ((event.ctrlKey || event.metaKey) && key === 'o') { event.preventDefault(); fileInput.click(); return; }
  if ((event.ctrlKey || event.metaKey) && key === 'f') { event.preventDefault(); openLeftPanelShortcut('search-panel', searchInput); return; }
  if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && key === 'o') { event.preventDefault(); fileInput.click(); return; }
  if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && key === 'f') { event.preventDefault(); openLeftPanelShortcut('search-panel', searchInput); return; }
  if (!typing && key === 'b' && !event.ctrlKey && !event.metaKey && !event.altKey && !matchMedia('(max-width: 860px)').matches) { event.preventDefault(); toggleBothSidePanels(); return; }
  if (!typing && key === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openLeftPanelShortcut('outline-panel'); return; }
  if (!typing && key === 'h' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openLeftPanelShortcut('history-panel'); return; }
  if (!typing && key === 's' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openLeftPanelShortcut('bookmarks-panel'); return; }
  if (!typing && key === 'd' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openRightSectionShortcut('display-section'); return; }
  if (!typing && key === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openRightSectionShortcut('note-section', pageNote); return; }
  if (!typing && pdfDoc && key === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); setPinnedPage(currentPage); return; }
  if (!typing && pdfDoc && key === 'm' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); setOcrMode(!ocrMode); return; }
  if (!typing && pdfDoc && event.key === 'ArrowUp') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: -Math.max(70, primaryCanvasWrap.clientHeight * 0.11), behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'ArrowDown') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: Math.max(70, primaryCanvasWrap.clientHeight * 0.11), behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'PageUp') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: -primaryCanvasWrap.clientHeight * 0.85, behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'PageDown') { event.preventDefault(); primaryCanvasWrap.scrollBy({ top: primaryCanvasWrap.clientHeight * 0.85, behavior: 'auto' }); return; }
  if (!typing && pdfDoc && event.key === 'ArrowLeft') { event.preventDefault(); goToPage(currentPage - 1); return; }
  if (!typing && pdfDoc && event.key === 'ArrowRight') { event.preventDefault(); goToPage(currentPage + 1); return; }
  if (event.key === 'Escape') { closeCommandPalette(); setOcrMode(false); shell.classList.remove('mobile-left-open','mobile-right-open'); hideSelectionToolbar(); window.getSelection()?.removeAllRanges(); }
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
renderStructureIndex();
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
