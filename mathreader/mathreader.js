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
const leftSidebarResizer = el('left-sidebar-resizer');
const rightSidebarResizer = el('right-sidebar-resizer');
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
const pdfComments = el('pdf-comments');
const pdfCommentsList = el('pdf-comments-list');
const pdfCommentsCount = el('pdf-comments-count');
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
const bibliographyIndex = el('bibliography-index');
const bibliographyEmpty = el('bibliography-empty');
const bibliographyCount = el('bibliography-count');
const mapAnnotationsList = el('map-annotations-list');
const mapAnnotationsEmpty = el('map-annotations-empty');
const mapAnnotationsCount = el('map-annotations-count');
const equationIndex = el('equation-index');
const equationIndexEmpty = el('equation-index-empty');
const equationIndexCount = el('equation-index-count');
const exportReadingDataButton = el('export-reading-data');
const importReadingDataButton = el('import-reading-data');
const importReadingInput = el('import-reading-input');
const readingBackButton = el('reading-back');
const readingTrailList = el('reading-trail-list');
const readingTrailEmpty = el('reading-trail-empty');
const readingTrailCount = el('reading-trail-count');
const readingTrailClear = el('reading-trail-clear');
const readingTrailToggle = el('reading-trail-toggle');
const backlinksList = el('backlinks-list');
const backlinksEmpty = el('backlinks-empty');
const backlinksCount = el('backlinks-count');
const backlinksContext = el('backlinks-context');
const undoList = el('undo-list');
const undoEmpty = el('undo-empty');
const undoCount = el('undo-count');
const undoClear = el('undo-clear');
const recoveryList = el('recovery-list');
const recoveryEmpty = el('recovery-empty');
const recoveryCount = el('recovery-count');
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
const searchFuzzy = el('search-fuzzy');
const searchEquations = el('search-equations');
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
const referencePreview = el('reference-preview');
const rightSidebar = el('right-sidebar');
const selectionCard = el('selection-card');
const selectionHelp = el('selection-help');
const selectionPageChip = el('selection-page-chip');
const selectionTextPreview = el('selection-text-preview');
const selectionLatexPreview = el('selection-latex-preview');
const copySelectionText = el('copy-selection-text');
const copySelectionLatex = el('copy-selection-latex');
const selectionToNote = el('selection-to-note');
const selectionFindAll = el('selection-find-all');
const selectionToGlossary = el('selection-to-glossary');
const glossarySymbolInput = el('glossary-symbol');
const glossaryMeaningInput = el('glossary-meaning');
const glossaryAddButton = el('glossary-add');
const symbolGlossaryList = el('symbol-glossary-list');
const symbolGlossaryEmpty = el('symbol-glossary-empty');
const symbolGlossaryCount = el('symbol-glossary-count');
const selectionToolbar = el('selection-toolbar');
const selectionToolbarLabel = el('selection-toolbar-label');
const floatingCopyText = el('floating-copy-text');
const floatingFindAll = el('floating-find-all');
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
const ocrFormatMode = el('ocr-format-mode');
const ocrFormatUndo = el('ocr-format-undo');
const ocrRenderedPreview = el('ocr-rendered-preview');
const copyOcrLatex = el('copy-ocr-latex');
const ocrToNote = el('ocr-to-note');
const clearOcrResultButton = el('clear-ocr-result');
const ocrHistoryList = el('ocr-history-list');
const ocrHistoryEmpty = el('ocr-history-empty');
const ocrHistoryCount = el('ocr-history-count');
const ocrHistoryToggle = el('ocr-history-toggle');
const ocrEngineSelect = el('ocr-engine-mode');
const ocrSourceSwitchButton = el('ocr-source-switch');
const ocrRetryButton = el('ocr-retry');
const ocrCapability = el('ocr-capability');
const ocrTimingDiagnostics = el('ocr-timing-diagnostics');
const formulaExtractionSelect = el('formula-extraction-mode');
const ocrProcessing = el('ocr-processing');
const ocrProcessingText = el('ocr-processing-text');
const documentReadingStatus = el('document-reading-status');
const documentTagsInput = el('document-tags');
const documentPersonalNoteInput = el('document-personal-note');
const documentMetaSummary = el('document-meta-summary');
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
let nativePdfCommentsByPage = new Map();
let nativePdfCommentLoadToken = 0;
let annotations = [];
let symbolGlossary = [];
let documentTags = [];
let documentReadingState = 'unread';
let documentPersonalNote = '';
let textCache = new Map();
let lineCache = new Map();
let referencePageRenderCache = new Map();
let bibliographyExpanded = new Set();
let pdfModulePromise = null;
let noteTimer = null;
let documentMetaTimer = null;
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
let mathOcrEngineMode = 'webgpu';
let formulaExtractionMode = 'image';
let readerWidthObserver = null;
let readerWidthTimer = null;
let lastObservedReaderWidth = 0;
let fitWidthStabilizing = false;
let currentOcrResult = null;
let ocrHistory = [];
let ocrHistoryExpanded = false;
let ocrRenderedPreviewTimer = null;
let ocrRenderedPreviewToken = 0;
let lastOcrEngineTiming = null;
let lastOcrRunTiming = null;
let mathOcrReadyAt = null;
let mathOcrInferenceRuns = 0;
let notePreviewTimer = null;
let continuousScrollTop = 0;
let continuousSavedAnchor = null;
let continuousLayoutWidth = 0;
let continuousLayoutHeight = 0;
let continuousObserver = null;
let continuousGeneration = 0;
let continuousRebuilding = false;
let displayTransitionActive = false;
let displayTransitionSerial = 0;
let initialContinuousReady = false;
let continuousPageNodes = new Map();
let continuousScrollTimer = null;
let readingFlow = 'continuous';
let pageTone = 'auto';
let displayBrightness = 100;
let displayContrast = 100;
let displayGap = 20;
let displayShadow = true;
let inferredOutline = [];
let inferredOutlineDetectionDone = false;
let inferredOutlineBuildPromise = null;
let outlineMode = 'none';
let editingBookmarkId = null;
let pendingRecoveryRecordId = null;
let structureEntries = [];
let bibliographyEntries = [];
let structureIndexVersion = 0;
let structureIndexBuilding = false;
let structureIndexBuildToken = 0;
let referencePages = [];
let readingBackStack = [];
let readingTrailExpanded = false;
let suppressReadingHistory = false;
let equationLabelIndex = null;
let tocOutlineTargets = null;
let tocDecorationSerial = 0;
let backlinkContext = null;
let backlinkEntries = [];
let undoHistory = [];
let recoverySnapshots = [];
let recoverySnapshotTimer = null;
let lastRecoveryFingerprint = '';
let recoveryRestoreActive = false;
let referencePreviewTimer = null;
let referencePreviewSerial = 0;
const referenceSnapshotCache = new Map();

const t = (en, zh) => root.dataset.lang === 'zh' ? zh : en;
const safeGet = (key, fallback = null) => { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
mathOcrEngineMode = safeGet('mathreader-ocr-engine-v4', 'webgpu');
formulaExtractionMode = safeGet('mathreader-formula-method-v1', 'image') === 'vector' ? 'vector' : 'image';

const DISPLAY_PREFS_KEY = 'mathreader-display-v3';
const LEGACY_DISPLAY_PREFS_KEYS = ['mathreader-display-v2','mathreader-display-v1'];
const SEARCH_PREFS_KEY = 'mathreader-search-options-v1';
const WORKSPACE_COLLAPSE_KEY = 'mathreader-workspace-collapse-v3';
const PANEL_ORDER_KEY = 'mathreader-panel-order-v1';
const STRUCTURE_INDEX_VERSION = 5;
const COMMAND_RECENT_KEY = 'mathreader-command-recent-v1';
const generalPrefs = {
  recordReadingTrail: true,
  rememberReadingPosition: true,
  rememberSidebarWidths: true,
  rememberPanelOrder: true,
  rememberSectionCollapse: true,
  rememberSidebarVisibility: true,
  rememberActivePanel: true
};

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};


function jsonClone(value, fallback = null) {
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return fallback; }
}

function workspaceSectionState() {
  const result = {};
  document.querySelectorAll('.workspace-section[id]').forEach((section) => { result[section.id] = section.classList.contains('is-collapsed'); });
  return result;
}

function normalizeUndoHistory(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item && item.type && item.payload !== undefined).map((item, index) => ({
    id: String(item.id || `undo-${Number(item.created) || Date.now()}-${index}`),
    type: String(item.type),
    label: String(item.label || item.type),
    created: Number(item.created) || Date.now(),
    payload: item.payload
  })).slice(0, 12);
}

function recoveryStorageKey() { return currentFileKey ? `mathreader:${currentFileKey}:recovery-v1` : null; }

function loadRecoverySnapshots() {
  const key = recoveryStorageKey();
  if (!key) return [];
  try {
    const raw = JSON.parse(safeGet(key, '[]'));
    return (Array.isArray(raw) ? raw : []).filter((item) => item && item.data).slice(0, 5);
  } catch (_) { return []; }
}

function durableRecoveryData() {
  return {
    version: 1,
    page: currentPage,
    pinnedPage,
    zoomMode,
    zoomScale,
    readingFlow,
    continuousAnchor: readingFlow === 'continuous' ? (captureContinuousAnchor() || continuousSavedAnchor) : continuousSavedAnchor,
    bookmarks: jsonClone(bookmarks, []),
    notes: jsonClone(notes, {}),
    annotations: jsonClone(annotations, []),
    symbolGlossary: jsonClone(symbolGlossary, []),
    documentTags: jsonClone(documentTags, []),
    documentReadingState,
    documentPersonalNote,
    referencePages: [...referencePages],
    readingBackStack: jsonClone(readingBackStack, [])
  };
}

function recoveryFingerprint(data) {
  try { return JSON.stringify({ bookmarks: data.bookmarks, notes: data.notes, annotations: data.annotations, symbolGlossary: data.symbolGlossary, documentTags: data.documentTags, documentReadingState: data.documentReadingState, documentPersonalNote: data.documentPersonalNote }); }
  catch (_) { return String(Date.now()); }
}

function scheduleRecoverySnapshot() {
  if (!currentFileKey || restoringSession || recoveryRestoreActive) return;
  clearTimeout(recoverySnapshotTimer);
  recoverySnapshotTimer = setTimeout(() => {
    const key = recoveryStorageKey();
    if (!key) return;
    const data = durableRecoveryData();
    const fingerprint = recoveryFingerprint(data);
    if (fingerprint === lastRecoveryFingerprint && recoverySnapshots.length) return;
    lastRecoveryFingerprint = fingerprint;
    recoverySnapshots = [{ id: `recovery-${Date.now()}`, created: Date.now(), data }, ...recoverySnapshots].slice(0, 5);
    safeSet(key, JSON.stringify(recoverySnapshots));
    renderRecoverySnapshots();
  }, 900);
}

function pushUndo(type, label, payload) {
  undoHistory = [{ id: `undo-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, type, label, created: Date.now(), payload: jsonClone(payload, payload) }, ...undoHistory].slice(0, 12);
  renderUndoHistory();
  persistDocumentState();
}

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
  if (!changed) {
    // Even when the logical flow value is unchanged, the DOM may still be in
    // its initial single-page visibility state (notably after restoring a saved
    // continuous session). Always synchronize the reading surfaces.
    primaryCanvasWrap?.classList.toggle('continuous-mode', next === 'continuous');
    primaryPageSurface?.classList.toggle('is-hidden', next === 'continuous');
    continuousStack?.classList.toggle('is-hidden', next !== 'continuous');
    if (next === 'single') clearContinuousObserver();
    applyOcrModeToSurfaces();
    updateDisplayControls();
    if (persist) persistDisplayPreferences();
    if (pdfDoc && render && next === 'continuous') await renderCurrentPage();
    if (pdfDoc) persistDocumentState();
    return;
  }

  const departureAnchor = readingFlow === 'continuous'
    ? (captureContinuousAnchor() || continuousSavedAnchor || { page: currentPage, ratio: 0 })
    : { page: currentPage, ratio: 0 };
  if (departureAnchor?.page) currentPage = Math.max(1, Math.min(pdfDoc?.numPages || currentPage, Number(departureAnchor.page) || currentPage));
  if (readingFlow === 'continuous') {
    continuousScrollTop = primaryCanvasWrap?.scrollTop || continuousScrollTop;
    continuousSavedAnchor = departureAnchor ? { ...departureAnchor } : continuousSavedAnchor;
  }

  // Prepare the destination surface while the current one remains visible.
  // Only swap visibility after the destination geometry/render is ready, so a
  // mode change can never expose a stale/default page-1 surface.
  displayTransitionActive = true;
  try {
    readingFlow = next;
    if (pdfDoc && render) {
      if (next === 'continuous') {
        await buildContinuousDocument({ restore: true, anchor: departureAnchor });
      } else {
        await renderPage(currentPage, canvas, primaryCanvasWrap, 'primary');
      }
    }
    primaryCanvasWrap?.classList.toggle('continuous-mode', next === 'continuous');
    primaryPageSurface?.classList.toggle('is-hidden', next === 'continuous');
    continuousStack?.classList.toggle('is-hidden', next !== 'continuous');
    if (next === 'single') clearContinuousObserver();
    applyOcrModeToSurfaces();
    updateDisplayControls();
    if (persist) persistDisplayPreferences();
    if (pdfDoc) persistDocumentState();
  } finally {
    requestAnimationFrame(() => { displayTransitionActive = false; });
  }
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
    version: 17,
    page: currentPage,
    pinnedPage,
    zoomMode,
    zoomScale,
    bookmarks,
    notes,
    annotations,
    symbolGlossary,
    documentTags,
    documentReadingState,
    documentPersonalNote,
    undoHistory,
    searchFuzzy: Boolean(searchFuzzy?.checked),
    scrollByPage,
    referenceScrollByPage,
    continuousScrollTop,
    continuousAnchor: anchor,
    selection: currentSelection,
    ocrResult: currentOcrResult,
    ocrHistory,
    inferredOutline,
    structureEntries,
    bibliographyEntries,
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
    const statusValue=record.session?.documentReadingState;
    if (['unread','reading','finished'].includes(statusValue)) { const status=document.createElement('span'); status.textContent={unread:t('Unread','未读'),reading:t('Reading','阅读中'),finished:t('Finished','已完成')}[statusValue]; meta.append(status); }
    const tags=normalizeDocumentTags(record.session?.documentTags); if(tags.length){ const tag=document.createElement('span'); tag.textContent=tags.slice(0,3).join(' · '); meta.append(tag); }
    if (record.session?.documentPersonalNote) open.title=String(record.session.documentPersonalNote).slice(0,240);
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
  // The document title is live application state, not static translatable copy.
  // The generic [data-en]/[data-zh] pass above temporarily replaces it with the
  // placeholder, so always restore the active filename when a PDF is open.
  documentTitle.textContent = pdfDoc && currentFileName
    ? currentFileName
    : t('No PDF open', '尚未打开 PDF');
  updateReferenceStatus();
  updateZoomLabel();
  updateDisplayControls();
  updateOcrCapability();
  updateOutlineSource();
  renderBookmarks();
  renderLocalLibrary();
  renderSymbolGlossary();
  renderDocumentMetadata();
  renderDocumentMapAnnotations();
  renderStructureIndex();
  renderEquationIndex();
  renderBibliographyIndex();
  renderBacklinks();
  renderReadingTrail();
  refreshSelectionUI();
  refreshOcrUI();
  renderOcrTimingDiagnostics();
  renderAnnotationList();
  renderNativePdfComments(currentPage);
  renderUndoHistory();
  renderRecoverySnapshots();
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
  if (searchFuzzy) searchFuzzy.checked = Boolean(saved?.fuzzy);
  if (searchEquations) searchEquations.checked = Boolean(saved?.equations);
}

function persistSearchPreferences() {
  safeSet(SEARCH_PREFS_KEY, JSON.stringify({
    matchCase: Boolean(searchMatchCase?.checked),
    wholeWord: Boolean(searchWholeWord?.checked),
    fuzzy: Boolean(searchFuzzy?.checked),
    equations: Boolean(searchEquations?.checked),
  }));
}

function loadWorkspaceCollapseState() {
  let saved = null;
  try { saved = generalPrefs.rememberSectionCollapse === false ? null : JSON.parse(safeGet(WORKSPACE_COLLAPSE_KEY, 'null')); } catch (_) { saved = null; }
  const defaults = new Set(['settings-section','ocr-section','selection-section','note-section','annotations-section','symbol-glossary-section','backlinks-section','undo-section','recovery-section','reading-trail-section','reference-section','shortcuts-section','document-info-section','contents-theorems-section','contents-equations-section','contents-bibliography-section','contents-annotations-section']);
  document.querySelectorAll('.workspace-section[id]').forEach((section) => {
    const collapsed = saved && Object.prototype.hasOwnProperty.call(saved, section.id) ? Boolean(saved[section.id]) : defaults.has(section.id);
    section.classList.toggle('is-collapsed', collapsed);
  });
}

function persistWorkspaceCollapseState() {
  if (generalPrefs.rememberSectionCollapse === false) return;
  const state = {};
  document.querySelectorAll('.workspace-section[id]').forEach((section) => { if (section.id) state[section.id] = section.classList.contains('is-collapsed'); });
  safeSet(WORKSPACE_COLLAPSE_KEY, JSON.stringify(state));
}

function updateWorkspaceCollapseButtons() {
  document.querySelectorAll('.workspace-section[id]').forEach((section) => {
    const button = section.querySelector(':scope > .panel-heading .section-collapse-button');
    if (!button) return;
    const collapsed = section.classList.contains('is-collapsed');
    button.textContent = collapsed ? '▸' : '▾';
    const label = collapsed ? t('Expand section', '展开模块') : t('Collapse section', '收起模块');
    button.title = label; button.setAttribute('aria-label', label); button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    const handle = section.querySelector(':scope > .panel-heading .section-drag-handle');
    if (handle) {
      const dragLabel = t('Drag to reorder · double-click to reset panel order', '拖动重新排序 · 双击恢复默认顺序');
      handle.title = dragLabel; handle.setAttribute('aria-label', dragLabel);
    }
  });
}

const panelOrderDefaults = new Map();
let draggedWorkspaceSection = null;

function reorderablePanelContainers() {
  return [
    document.getElementById('outline-panel'),
    document.getElementById('right-sidebar'),
  ].filter(Boolean);
}

function directWorkspaceSections(container) {
  return [...container.children].filter((child) => child.classList?.contains('workspace-section') && child.id);
}

function panelOrderKeyFor(container) {
  return container?.id === 'outline-panel' ? 'left' : container?.id === 'right-sidebar' ? 'right' : '';
}

function captureDefaultPanelOrders() {
  for (const container of reorderablePanelContainers()) {
    const key = panelOrderKeyFor(container);
    if (key && !panelOrderDefaults.has(key)) panelOrderDefaults.set(key, directWorkspaceSections(container).map((section) => section.id));
  }
}

function loadPanelOrder() {
  captureDefaultPanelOrders();
  let saved = null;
  if (generalPrefs.rememberPanelOrder === false) return;
  try { saved = JSON.parse(safeGet(PANEL_ORDER_KEY, 'null')); } catch (_) { saved = null; }
  for (const container of reorderablePanelContainers()) {
    const key = panelOrderKeyFor(container);
    const allowed = new Map(directWorkspaceSections(container).map((section) => [section.id, section]));
    const order = Array.isArray(saved?.[key]) ? saved[key] : [];
    for (const id of order) { const section = allowed.get(id); if (section) { container.append(section); allowed.delete(id); } }
    // Any newly introduced sections remain available and follow the saved ones
    // in their shipped/default order rather than disappearing from the panel.
    for (const id of panelOrderDefaults.get(key) || []) { const section = allowed.get(id); if (section) { container.append(section); allowed.delete(id); } }
    for (const section of allowed.values()) container.append(section);
  }
}

function persistPanelOrder() {
  if (generalPrefs.rememberPanelOrder === false) return;
  const state = {};
  for (const container of reorderablePanelContainers()) {
    const key = panelOrderKeyFor(container);
    if (key) state[key] = directWorkspaceSections(container).map((section) => section.id);
  }
  safeSet(PANEL_ORDER_KEY, JSON.stringify(state));
}

function resetPanelOrder(container) {
  const key = panelOrderKeyFor(container);
  const byId = new Map(directWorkspaceSections(container).map((section) => [section.id, section]));
  for (const id of panelOrderDefaults.get(key) || []) { const section = byId.get(id); if (section) { container.append(section); byId.delete(id); } }
  for (const section of byId.values()) container.append(section);
  persistPanelOrder();
}

function setupPanelReordering() {
  loadPanelOrder();
  for (const container of reorderablePanelContainers()) {
    for (const section of directWorkspaceSections(container)) {
      const heading = section.querySelector(':scope > .panel-heading');
      if (!heading || heading.querySelector('.section-drag-handle')) continue;
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'section-drag-handle';
      handle.draggable = true;
      handle.textContent = '⠿';
      const dragLabel = t('Drag to reorder · double-click to reset panel order', '拖动重新排序 · 双击恢复默认顺序');
      handle.title = dragLabel; handle.setAttribute('aria-label', dragLabel);
      handle.addEventListener('click', (event) => event.preventDefault());
      handle.addEventListener('dblclick', (event) => { event.preventDefault(); event.stopPropagation(); resetPanelOrder(container); });
      handle.addEventListener('dragstart', (event) => {
        draggedWorkspaceSection = section;
        section.classList.add('is-dragging-section');
        event.stopPropagation();
        try { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', section.id); } catch (_) {}
      });
      handle.addEventListener('dragend', (event) => {
        event.stopPropagation();
        section.classList.remove('is-dragging-section');
        draggedWorkspaceSection = null;
        document.querySelectorAll('.workspace-section.drag-target-before,.workspace-section.drag-target-after').forEach((item) => item.classList.remove('drag-target-before','drag-target-after'));
      });
      const collapse = heading.querySelector('.section-collapse-button');
      heading.insertBefore(handle, collapse || null);

      section.addEventListener('dragover', (event) => {
        if (!draggedWorkspaceSection || draggedWorkspaceSection === section || draggedWorkspaceSection.parentElement !== container) return;
        event.preventDefault(); event.stopPropagation();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        const rect = section.getBoundingClientRect();
        const before = event.clientY < rect.top + rect.height / 2;
        section.classList.toggle('drag-target-before', before);
        section.classList.toggle('drag-target-after', !before);
      });
      section.addEventListener('dragleave', (event) => {
        event.stopPropagation();
        section.classList.remove('drag-target-before','drag-target-after');
      });
      section.addEventListener('drop', (event) => {
        if (!draggedWorkspaceSection || draggedWorkspaceSection === section || draggedWorkspaceSection.parentElement !== container) return;
        event.preventDefault(); event.stopPropagation();
        const rect = section.getBoundingClientRect();
        const before = event.clientY < rect.top + rect.height / 2;
        container.insertBefore(draggedWorkspaceSection, before ? section : section.nextSibling);
        section.classList.remove('drag-target-before','drag-target-after');
        persistPanelOrder();
      });
    }
  }
}

function setupWorkspaceCollapsibles() {
  loadWorkspaceCollapseState();
  document.querySelectorAll('.workspace-section[id]').forEach((section) => {
    if (!section.id) return;
    const heading = section.querySelector(':scope > .panel-heading');
    if (!heading || heading.querySelector('.section-collapse-button')) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'section-collapse-button';
    button.addEventListener('click', () => { const willExpand = section.classList.contains('is-collapsed'); section.classList.toggle('is-collapsed'); persistWorkspaceCollapseState(); updateWorkspaceCollapseButtons(); if (willExpand && section.id === 'contents-equations-section') ensureEquationIndexRendered(); });
    heading.append(button);
  });
  setupPanelReordering();
  updateWorkspaceCollapseButtons();
}

function expandWorkspaceSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.classList.remove('is-collapsed'); persistWorkspaceCollapseState(); updateWorkspaceCollapseButtons();
}

function openSettingsGroup(groupId) {
  expandWorkspaceSection('settings-section');
  const group = document.getElementById(groupId);
  if (group instanceof HTMLDetailsElement) group.open = true;
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
    ratio: Math.min(1, Math.max(0, Number(item.ratio) || 0)),
    latex: typeof item.latex === 'string' ? item.latex : '',
    preview: typeof item.preview === 'string' ? item.preview : ''
  }));
}


function normalizeDocumentTags(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(/[,;\n]/);
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const clean = String(item || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const key = clean.toLocaleLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key); out.push(clean);
    if (out.length >= 20) break;
  }
  return out;
}

function renderDocumentMetadata() {
  if (documentReadingStatus) documentReadingStatus.value = documentReadingState;
  if (documentTagsInput) documentTagsInput.value = documentTags.join(', ');
  if (documentPersonalNoteInput && documentPersonalNoteInput.value !== documentPersonalNote) documentPersonalNoteInput.value = documentPersonalNote;
  if (documentMetaSummary) {
    const labels = { unread: t('Unread','未读'), reading: t('Reading','阅读中'), finished: t('Finished','已完成') };
    documentMetaSummary.textContent = `${labels[documentReadingState] || labels.unread} · ${t(`${documentTags.length} tags`, `${documentTags.length} 个标签`)} · ${t(`${bookmarks.length} bookmarks`, `${bookmarks.length} 个书签`)} · ${t(`${annotations.length} annotations`, `${annotations.length} 个批注`)}`;
  }
}

function documentMapItemMatches(node, query) {
  if (!query) return true;
  return normalizeSearchValue(node?.textContent || '', false).includes(normalizeSearchValue(query, false));
}

function applyDocumentMapFilter(input) {
  const target = input?.dataset?.mapTarget ? el(input.dataset.mapTarget) : null;
  if (!target) return;
  const query = input.value.trim();
  for (const child of target.children) child.classList.toggle('map-filter-hidden', !documentMapItemMatches(child, query));
}

function applyAllDocumentMapFilters() {
  document.querySelectorAll('.map-filter[data-map-target]').forEach(applyDocumentMapFilter);
}

function setDocumentMapSelectedNode(node) {
  document.querySelectorAll('#outline-panel .is-selected-location').forEach((item) => item.classList.remove('is-selected-location'));
  if (node?.isConnected) node.classList.add('is-selected-location');
}

function updateDocumentMapCurrentLocation() {
  const selector = [
    '.outline-item[data-page]',
    '.structure-item[data-page]',
    '.equation-index-item[data-page]',
    '.document-map-item[data-page]',
    '.bibliography-smart-item[data-page]'
  ].join(',');
  document.querySelectorAll(`#outline-panel ${selector}`).forEach((node) => {
    node.classList.toggle('is-current-location', Number(node.dataset.page) === Number(currentPage));
  });
}

function renderDocumentMapAnnotations() {
  if (!mapAnnotationsList || !mapAnnotationsEmpty || !mapAnnotationsCount) return;
  mapAnnotationsList.replaceChildren();
  const ordered=[...annotations].sort((a,b)=>a.page-b.page||a.ratio-b.ratio||a.created-b.created);
  mapAnnotationsCount.textContent=String(ordered.length); mapAnnotationsEmpty.classList.toggle('is-hidden',ordered.length>0);
  for (const item of ordered) {
    const button=document.createElement('button'); button.type='button'; button.className='document-map-item'; button.dataset.page=String(item.page);
    const title=document.createElement('strong'); title.textContent=item.type==='highlight'?t('Highlight','高亮'):t('Margin note','页边注');
    const meta=document.createElement('span'); meta.textContent=`${t(`Page ${item.page}`,`第 ${item.page} 页`)} · ${(item.note||item.text||item.latex||'').trim().slice(0,90)}`;
    button.append(title,meta); button.addEventListener('click',()=>goToMatchedLocation(item.page,Number(item.ratio)||0,item.text||'')); mapAnnotationsList.append(button);
  }
  applyDocumentMapFilter(el('map-filter-annotations')); updateDocumentMapCurrentLocation();
}

function bibliographyCitationSummary(entry) {
  const citations=Array.isArray(entry?.citations)?entry.citations:[];
  if (!citations.length) return t('No citations detected','未检测到引用');
  const first=citations[0];
  return t(`${citations.length} citations · first p. ${first.page}`,`${citations.length} 处引用 · 首次第 ${first.page} 页`);
}

function loadDocumentState(cachedSession = null) {
  bookmarks = [];
  notes = {};
  nativePdfCommentsByPage = new Map();
  nativePdfCommentLoadToken += 1;
  annotations = [];
  symbolGlossary = [];
  documentTags = [];
  documentReadingState = 'unread';
  documentPersonalNote = '';
  undoHistory = [];
  recoverySnapshots = loadRecoverySnapshots();
  if (searchFuzzy) searchFuzzy.checked = false;
  scrollByPage = {};
  referenceScrollByPage = {};
  continuousScrollTop = 0;
  continuousSavedAnchor = null;
  currentSelection = null;
  currentOcrResult = null;
  ocrHistory = [];
  ocrHistoryExpanded = false;
  inferredOutline = [];
  inferredOutlineDetectionDone = false;
  inferredOutlineBuildPromise = null;
  outlineMode = 'none';
  structureEntries = [];
  bibliographyEntries = [];
  structureIndexVersion = 0;
  equationLabelIndex = null;
  renderEquationIndex();
  backlinkContext = null; backlinkEntries = []; renderBacklinks();
  tocOutlineTargets = null;
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
    symbolGlossary = normalizeSymbolGlossary(session.symbolGlossary);
    documentTags = Array.isArray(session.documentTags) ? session.documentTags.map((item)=>String(item).trim()).filter(Boolean).slice(0,20) : [];
    documentReadingState = ['unread','reading','finished'].includes(session.documentReadingState) ? session.documentReadingState : 'unread';
    documentPersonalNote = typeof session.documentPersonalNote === 'string' ? session.documentPersonalNote : '';
    undoHistory = normalizeUndoHistory(session.undoHistory);
    if (searchFuzzy) searchFuzzy.checked = Boolean(session.searchFuzzy);
    const savedPage = Number(session.page || 1);
    currentPage = generalPrefs.rememberReadingPosition !== false && Number.isFinite(savedPage) ? Math.min(Math.max(1, savedPage), pdfDoc.numPages) : 1;
    const savedPinned = Number(session.pinnedPage || 0);
    pinnedPage = savedPinned >= 1 && savedPinned <= pdfDoc.numPages ? savedPinned : null;
    zoomMode = ['fit-width','fit-page','custom'].includes(session.zoomMode) ? session.zoomMode : 'fit-width';
    const savedScale = Number(session.zoomScale || 1.2);
    zoomScale = Number.isFinite(savedScale) ? Math.min(Math.max(.35, savedScale), 4) : 1.2;
    scrollByPage = generalPrefs.rememberReadingPosition !== false && session.scrollByPage && typeof session.scrollByPage === 'object' ? session.scrollByPage : {};
    referenceScrollByPage = session.referenceScrollByPage && typeof session.referenceScrollByPage === 'object' ? session.referenceScrollByPage : {};
    continuousScrollTop = generalPrefs.rememberReadingPosition !== false && Number.isFinite(Number(session.continuousScrollTop)) ? Math.max(0, Number(session.continuousScrollTop)) : 0;
    const savedAnchor = session.continuousAnchor;
    if (generalPrefs.rememberReadingPosition !== false && savedAnchor && Number.isFinite(Number(savedAnchor.page))) {
      continuousSavedAnchor = {
        page: Math.min(Math.max(1, Number(savedAnchor.page)), pdfDoc.numPages),
        ratio: Math.min(1, Math.max(0, Number(savedAnchor.ratio) || 0))
      };
    }
    currentSelection = session.selection?.text ? session.selection : null;
    currentOcrResult = session.ocrResult?.latex ? session.ocrResult : null;
    ocrHistory = Array.isArray(session.ocrHistory) ? session.ocrHistory.slice(0, 10) : [];
    inferredOutline = Array.isArray(session.inferredOutline) ? session.inferredOutline.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.title === 'string').slice(0, 240) : [];
    if (inferredOutline.length) inferredOutlineDetectionDone = true;
    structureEntries = Array.isArray(session.structureEntries) ? session.structureEntries.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.title === 'string').slice(0, 500) : [];
    bibliographyEntries = Array.isArray(session.bibliographyEntries) ? session.bibliographyEntries.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.label === 'string').slice(0, 400) : [];
    structureIndexVersion = Number(session.structureIndexVersion || 0);
    if (structureIndexVersion !== STRUCTURE_INDEX_VERSION) {
      structureEntries = [];
      bibliographyEntries = [];
      structureIndexVersion = 0;
    }
    referencePages = Array.isArray(session.referencePages) ? session.referencePages.map(Number).filter((page, index, values) => page >= 1 && page <= pdfDoc.numPages && values.indexOf(page) === index).slice(0, 4) : [];
    readingBackStack = normalizeReadingTrail(session.readingBackStack);
    if (pinnedPage && !referencePages.includes(pinnedPage)) referencePages.unshift(pinnedPage);
    // v59 tightens inferred-outline filtering so formula lines are not mistaken
    // for section headings. Rebuild any pre-v7 inferred outline once, and also
    // discard older entries that lack an in-page ratio.
    if (Number(session.version || 0) < 15 || (inferredOutline.length && inferredOutline.some((entry) => !Number.isFinite(Number(entry.ratio))))) inferredOutline = [];
    searchInput.value = typeof session.searchQuery === 'string' ? session.searchQuery : '';
    renderSymbolGlossary();
    if (generalPrefs.rememberSidebarVisibility !== false && Number(session.version || 0) >= 4) {
      shell.classList.toggle('left-collapsed', Boolean(session.ui?.leftCollapsed));
      shell.classList.toggle('right-collapsed', Boolean(session.ui?.rightCollapsed));
    } else {
      // Start from the clean default when sidebar visibility is not remembered,
      // and for legacy sessions created before sidebar visibility was saved.
      shell.classList.add('left-collapsed', 'right-collapsed');
    }
    if (generalPrefs.rememberActivePanel !== false && session.ui?.activePanel) activatePanel(session.ui.activePanel, false);
    else activatePanel('outline-panel', false);
  } else {
    const rawBookmarks = safeGet(stateKey('bookmarks'));
    const rawNotes = safeGet(stateKey('notes'));
    try { if (rawBookmarks) bookmarks = normalizeBookmarks(JSON.parse(rawBookmarks)); } catch (_) {}
    try { if (rawNotes) notes = JSON.parse(rawNotes); } catch (_) {}
    const savedPage = Number(safeGet(stateKey('page'), '1'));
    currentPage = generalPrefs.rememberReadingPosition !== false && Number.isFinite(savedPage) ? Math.min(Math.max(1, savedPage), pdfDoc.numPages) : 1;
    const savedPinned = Number(safeGet(stateKey('pinned'), '0'));
    pinnedPage = savedPinned >= 1 && savedPinned <= pdfDoc.numPages ? savedPinned : null;
  }
  renderSymbolGlossary();
  refreshSelectionUI();
  refreshOcrUI();
  renderAnnotationList();
  updateZoomLabel();
  updateReadingBackButton();
  renderReadingTrail();
  renderUndoHistory();
  renderRecoverySnapshots();
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
  scheduleRecoverySnapshot();
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
  [prevPage,nextPage,pageNumberInput,zoomIn,zoomOut,zoomLabel,flowButton,mathOcrButton,pinPageButton,pinFromSidebar,addBookmark,buildStructureIndexButton,exportReadingDataButton,importReadingDataButton].forEach((node) => { if (node) node.disabled = !enabled; });
  updateOcrInteractionAvailability();
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
  renderNativePdfComments(currentPage);
  updateDocumentMapCurrentLocation();
  void refreshNativePdfComments(currentPage);
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
  if (!pdfDoc || zoomMode === 'fit-width') {
    zoomLabel.textContent = t('Fit width', '适合宽度');
    zoomLabel.title = t('Switch to Fit page', '切换到适合页面');
    return;
  }
  if (zoomMode === 'fit-page') {
    zoomLabel.textContent = t('Fit page', '适合页面');
    zoomLabel.title = t('Switch to Fit width', '切换到适合宽度');
    return;
  }
  zoomLabel.textContent = `${Math.round(zoomScale * 100)}%`;
  zoomLabel.title = t('Return to Fit width', '返回适合宽度');
}




function ocrNow() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

function ocrMs(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)} ms` : '—';
}


function ocrApproxTokenCount(text) {
  const value = String(text || '');
  if (!value) return 0;
  // Diagnostic fallback only. Transformers.js image-to-text does not expose
  // generated token ids in this pipeline result, so keep this explicitly approximate.
  return Math.max(1, Math.round(value.length / 2.7));
}

function ocrRate(value, ms) {
  const n = Number(value);
  const tms = Number(ms);
  return Number.isFinite(n) && Number.isFinite(tms) && tms > 0 ? n / (tms / 1000) : null;
}

function ocrLikelyBottleneck(report) {
  const passes = Array.isArray(report?.passes) ? report.passes : [];
  const totalInference = passes.reduce((sum, pass) => sum + (Number(pass.inferenceMs) || 0), 0);
  const total = Number(report?.totalMs) || Number(report?.recognitionMs) || 0;
  const share = total > 0 ? totalInference / total : 0;
  if (share >= 0.95 && passes.length) {
    const slowest = passes.slice().sort((a, b) => (Number(b.inferenceMs) || 0) - (Number(a.inferenceMs) || 0))[0];
    const tokRate = Number(slowest?.approxTokensPerSecond);
    const charRate = Number(slowest?.charsPerSecond);
    if (Number.isFinite(tokRate)) return `${t('model inference dominates', '模型推理占主导')} (${(share * 100).toFixed(1)}%) · ${t('slowest pass', '最慢一轮')} ~${tokRate.toFixed(2)} ${t('estimated tok/s', '估算 token/秒')}`;
    if (Number.isFinite(charRate)) return `${t('model inference dominates', '模型推理占主导')} (${(share * 100).toFixed(1)}%) · ${t('slowest pass', '最慢一轮')} ~${charRate.toFixed(2)} ${t('chars/s', '字符/秒')}`;
    return `${t('model inference dominates', '模型推理占主导')} (${(share * 100).toFixed(1)}%)`;
  }
  if (Number(report?.engineWarmMs) < 2000 && totalInference > 10000) return t('inference is slow immediately after engine load', '引擎加载后立即推理较慢');
  return t('no single non-inference stage dominates', '没有单一非推理阶段占主导');
}

function renderOcrTimingDiagnostics() {
  if (!ocrTimingDiagnostics) return;
  const lines = [];
  if (lastOcrRunTiming) {
    const r = lastOcrRunTiming;
    lines.push(`${t('Last run', '最近一次')} · ${r.backend || '—'} · ${r.inferenceCount || 0} ${t('pass(es)', '次推理')}`);
    if (r.cropSize) lines.push(`  ${t('Crop size', '裁图尺寸')}: ${r.cropSize}${Number.isFinite(r.cropAspect) ? ` · ${t('aspect', '宽高比')} ${r.cropAspect.toFixed(2)}:1` : ''}`);
    if (Number.isFinite(r.outputChars)) lines.push(`  ${t('Final LaTeX', '最终 LaTeX')}: ${r.outputChars} ${t('chars', '字符')} · ~${r.outputApproxTokens || 0} ${t('tokens estimated', '估算 token')}`);
    if (r.backendDetail) lines.push(`  ${t('Backend', '后端')}: ${r.backendDetail}`);
    if (Number.isFinite(r.engineWarmMs)) lines.push(`  ${t('Engine warm time before run', '本次运行前引擎已就绪')}: ${ocrMs(r.engineWarmMs)}`);
    if (Number.isFinite(r.engineRunNumber)) lines.push(`  ${t('Inference run since load', '本次加载后的推理序号')}: #${r.engineRunNumber}`);
    lines.push(`  ${t('Page visibility', '页面可见性')}: ${r.visibilityState || '—'}`);
    if (Number.isFinite(r.hardwareConcurrency)) lines.push(`  ${t('Logical CPU threads', '逻辑 CPU 线程')}: ${r.hardwareConcurrency}`);
    if (Number.isFinite(r.deviceMemoryGb)) lines.push(`  ${t('Reported device memory', '报告的设备内存')}: ${r.deviceMemoryGb} GB`);
    if (Number.isFinite(r.cropMs)) lines.push(`  ${t('Crop', '裁图')}: ${ocrMs(r.cropMs)}`);
    if (Number.isFinite(r.analysisMs)) lines.push(`  ${t('Analysis', '分析')}: ${ocrMs(r.analysisMs)}`);
    if (Number.isFinite(r.firstPassPenalty)) lines.push(`  ${t('First-pass structural penalty', '首轮结构惩罚')}: ${Number(r.firstPassPenalty).toFixed(1)}`);
    if (r.retryReason) lines.push(`  ${t('Retry reason', '重试原因')}: ${r.retryReason}`);
    if (r.retryProfile) lines.push(`  ${t('Retry profile', '重试方案')}: ${r.retryProfile}`);
    if (r.retryFailed) lines.push(`  ${t('Retry outcome', '重试结果')}: ${t('failed quality gate', '未通过质量门槛')}`);
    if (r.candidateDecision) lines.push(`  ${t('Candidate choice', '候选选择')}: ${r.candidateDecision}`);
    (r.passes || []).forEach((pass, index) => {
      lines.push(`  ${t('Pass', '第')} ${index + 1}${t('', ' 次')} · ${pass.variant}/${pass.preprocess}${pass.careful ? ' · beam 2' : ' · beam 1'}`);
      if (Number.isFinite(pass.inputWidth) && Number.isFinite(pass.inputHeight)) lines.push(`    ${t('Model input', '模型输入')}: ${pass.inputWidth}×${pass.inputHeight}${Number.isFinite(pass.inputAspect) ? ` · ${t('aspect', '宽高比')} ${pass.inputAspect.toFixed(2)}:1` : ''}`);
      lines.push(`    ${t('Generation config', '生成配置')}: max_new_tokens=512 · num_beams=${pass.careful ? 2 : 1} · early_stopping=${pass.careful ? 'true' : 'false'}`);
      lines.push(`    ${t('Normalize crop', '裁图归一化')}: ${ocrMs(pass.normalizeMs)}`);
      lines.push(`    ${t('Preprocess', '预处理')}: ${ocrMs(pass.preprocessMs)}`);
      lines.push(`    ${t('Canvas → image', '画布 → 图像')}: ${ocrMs(pass.inputMs)}`);
      lines.push(`    ${t('Inference', '推理')}: ${ocrMs(pass.inferenceMs)}`);
      if (Number.isFinite(pass.rawChars)) lines.push(`    ${t('Raw output', '原始输出')}: ${pass.rawChars} ${t('chars', '字符')} · ~${pass.approxTokens || 0} ${t('tokens estimated', '估算 token')}`);
      if (Number.isFinite(pass.approxTokensPerSecond)) lines.push(`    ${t('Estimated throughput', '估算吞吐')}: ${pass.approxTokensPerSecond.toFixed(2)} tok/s · ${pass.charsPerSecond.toFixed(2)} chars/s`);
      lines.push(`    ${t('First-token latency', '首 token 延迟')}: ${t('not exposed by runtime', '运行时未提供')}`);
      lines.push(`    ${t('Generated token count', '实际生成 token 数')}: ${t('not exposed by runtime', '运行时未提供')}`);
      lines.push(`    ${t('Hit 512-token cap', '是否达到 512-token 上限')}: ${t('unknown (token ids not exposed)', '未知（运行时未提供 token id）')}`);
      if (Number.isFinite(pass.penalty)) lines.push(`    ${t('Structural penalty', '结构惩罚')}: ${pass.penalty.toFixed(1)}`);
      if (pass.hardReject) lines.push(`    ${t('Hard reject', '硬拒绝')}: ${t('yes', '是')}${pass.rejectReasons ? ` · ${pass.rejectReasons}` : ''}`);
      else lines.push(`    ${t('Hard reject', '硬拒绝')}: ${t('no', '否')}`);
      if (pass.runawaySequence) {
        if (pass.runawayKind === 'tensor/index') {
          lines.push(`    ${t('Tensor/index repetition', '张量/指标重复')}: ${t('allowed', '允许')} · “${String(pass.runawaySequence).slice(0, 180)}”${pass.runawayOccurrences ? ` ×${pass.runawayOccurrences}` : ''}`);
        } else {
          lines.push(`    ${t('Runaway sequence', '失控序列')}: ${pass.runawayKind || 'generic'} · “${String(pass.runawaySequence).slice(0, 180)}”${pass.runawayOccurrences ? ` ×${pass.runawayOccurrences}` : ''}`);
        }
      }
      if (Number.isFinite(pass.corruptionScore)) lines.push(`    ${t('Corruption score', '损坏评分')}: ${pass.corruptionScore.toFixed(1)} ${t('(lower is better)', '（越低越好）')}`);
      lines.push(`    ${t('LaTeX cleanup/check', 'LaTeX 清理/检查')}: ${ocrMs(pass.postprocessMs)}`);
      lines.push(`    ${t('Pass total', '本次合计')}: ${ocrMs(pass.totalMs)}`);
    });
    if (Number.isFinite(r.commitMs)) lines.push(`  ${t('UI commit', '界面更新')}: ${ocrMs(r.commitMs)}`);
    lines.push(`  ${t('Recognition total', '识别合计')}: ${ocrMs(r.recognitionMs)}`);
    const inferenceTotal = (r.passes || []).reduce((sum, pass) => sum + (Number(pass.inferenceMs) || 0), 0);
    if (Number.isFinite(r.totalMs) && r.totalMs > 0) lines.push(`  ${t('Inference share', '推理占比')}: ${(inferenceTotal / r.totalMs * 100).toFixed(1)}%`);
    lines.push(`  ${t('End-to-end', '端到端')}: ${ocrMs(r.totalMs)}`);
    lines.push(`  ${t('Likely bottleneck', '可能瓶颈')}: ${ocrLikelyBottleneck(r)}`);
  }
  if (lastOcrEngineTiming) {
    const e = lastOcrEngineTiming;
    if (lines.length) lines.push('');
    lines.push(`${t('Engine load', '引擎加载')} · ${e.backend || '—'}`);
    if (e.backendDetail) lines.push(`  ${t('Backend', '后端')}: ${e.backendDetail}`);
    lines.push(`  ${t('Runtime import', '运行时导入')}: ${ocrMs(e.importMs)}`);
    lines.push(`  ${t('Pipeline/model init', '模型初始化')}: ${ocrMs(e.pipelineMs)}`);
    lines.push(`  ${t('Load total', '加载合计')}: ${ocrMs(e.totalMs)}`);
  }
  if (!lines.length) lines.push(ocrTimingDiagnostics.dataset[root.dataset.lang === 'zh' ? 'zhEmpty' : 'enEmpty'] || t('No OCR run yet.', '尚无 OCR 运行记录。'));
  ocrTimingDiagnostics.textContent = lines.join('\n');
}

function logOcrTiming(report) {
  try { console.info('MathReader OCR timing', report); } catch (_) {}
  renderOcrTimingDiagnostics();
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
    autoOpenRightSection('ocr-section');
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
      const looksSubstantive = (block) => {
        const compact = String(block || '').replace(/\s+/g, '');
        if (!compact) return false;
        if (/[=<>_^]/.test(compact)) return true;
        if (/\\(?:frac|int|iint|iiint|oint|sum|prod|sqrt|left|right|nabla|partial|operatorname|mathbb|mathrm|mathbf|mathcal)\b/.test(compact)) return true;
        if (/\\(?:leq?|geq?|lesssim|gtrsim|sim|simeq|approx|equiv|neq?|to|rightarrow|leftarrow|leftrightarrow|longrightarrow|longleftarrow|longleftrightarrow|Rightarrow|Leftarrow|Leftrightarrow)\b/.test(compact)) return true;
        return compact.length > 10;
      };
      const remainderIsTinyNoise = ranked.slice(1).every((item) => item.length <= 10 && !looksSubstantive(item.block));
      if (first.length >= 72 && first.length >= Math.max(2.6 * second.length, second.length + 48) && remainderIsTinyNoise) {
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
  return alignLineByPattern(line, 'relation');
}
function unwrapOcrFormattingEnvelope(value) {
  let text = String(value || '').trim();
  if (!text) return '';
  const envMatch = text.match(/^\\begin\{(aligned|split|gathered|gather|array)\}([\s\S]*?)\\end\{\1\}$/);
  if (!envMatch) return text;
  const env = envMatch[1];
  let inner = String(envMatch[2] || '').trim();
  if (env === 'array') inner = inner.replace(/^\{[^}]*\}/, '').trim();
  return inner;
}

function splitOcrLatexRows(value) {
  const body = unwrapOcrFormattingEnvelope(value);
  if (!body) return [];
  const rows = [];
  let current = '';
  let braceDepth = 0;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === '{') braceDepth += 1;
    else if (ch === '}' && braceDepth > 0) braceDepth -= 1;
    if (ch === '\\' && body[i + 1] === '\\' && braceDepth === 0) {
      rows.push(current.trim());
      current = '';
      i += 1;
      continue;
    }
    current += ch;
  }
  if (current.trim()) rows.push(current.trim());
  return rows.filter(Boolean);
}

function hasBalancedOuterBraces(value) {
  const text = String(value || '').trim();
  if (text.length < 2 || text[0] !== '{' || text[text.length - 1] !== '}') return false;
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\\') { i += 1; continue; }
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') depth -= 1;
    if (depth === 0 && i < text.length - 1) return false;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function stripRedundantOuterBraces(value) {
  let text = String(value || '').trim();
  let guard = 0;
  while (guard < 4 && hasBalancedOuterBraces(text)) {
    text = text.slice(1, -1).trim();
    guard += 1;
  }
  return text;
}

function cleanOcrFormattingRow(value) {
  let row = String(value || '').trim();
  if (!row) return '';
  // Common Texify array artifact: an empty first cell followed by a doubly
  // braced mathematical cell, e.g. {{}}&{{=...}}.
  row = row.replace(/^\{\{\}\}\s*&\s*\{\{([\s\S]*)\}\}\s*$/, '&$1');
  row = row.replace(/^\{\}\s*&\s*\{([\s\S]*)\}\s*$/, '&$1');
  row = stripRedundantOuterBraces(row);
  // After unwrapping, repeat once because OCR often emits two brace layers.
  row = row.replace(/^\{\{\}\}\s*&\s*\{\{([\s\S]*)\}\}\s*$/, '&$1');
  row = stripRedundantOuterBraces(row);
  return row.replace(/\s+/g, ' ').trim();
}

function cleanOcrFormattingRows(rows) {
  const cleaned = [];
  let previousKey = '';
  for (const raw of Array.isArray(rows) ? rows : []) {
    const row = cleanOcrFormattingRow(raw);
    if (!row) continue;
    // Preserve alignment markers for later formatting, but ignore harmless
    // whitespace/bracing differences when detecting accidental duplicate rows.
    const key = row.replace(/&/g, '').replace(/\s+/g, '').trim();
    if (key && key === previousKey) continue;
    cleaned.push(row);
    previousKey = key;
  }
  return cleaned;
}

function cleanOcrFormattingArtifacts(value) {
  const rows = cleanOcrFormattingRows(splitOcrLatexRows(value));
  if (!rows.length) return String(value || '').trim();
  return rows.length === 1 ? rows[0] : rows.join(latexLineSeparator());
}

function normalizeOcrAlignmentLine(value) {
  return String(value || '').replace(/(^|[^\\])&/g, '$1').replace(/\s+/g, ' ').trim();
}

function alignLineByPattern(value, mode = 'relation') {
  const line = normalizeOcrAlignmentLine(value);
  if (!line) return '';
  const pattern = mode === 'equals'
    ? /(=)/
    : /(\\(?:Longleftrightarrow|Leftrightarrow|longleftrightarrow|leftrightarrow|Longrightarrow|Rightarrow|longrightarrow|rightarrow|longleftarrow|leftarrow|mapsto|lesssim|gtrsim|simeq|cong|neq|ne|leq|le|geq|ge|subseteq|supseteq|subset|supset|approx|sim|equiv|to|iff)(?![A-Za-z])|<=|>=|=|<|>)/;
  const match = line.match(pattern);
  if (!match || typeof match.index !== 'number') return line;
  return `${line.slice(0, match.index)}&${line.slice(match.index)}`.replace(/\s+&/g, ' &').trim();
}

function ocrSignedContinuationBody(value) {
  let line = normalizeOcrAlignmentLine(value)
    .replace(/^(?:\\(?:qquad|quad)\s*)+/, '')
    .trim();
  // OCR often carries delimiter-continuation helpers from a split formula,
  // e.g. `\left.+...` / `\right.-...`. These are visual delimiter
  // continuations, not the mathematical start of the row. Strip only the
  // invisible-dot form so the leading sign can be detected and indented.
  line = line.replace(/^\\(?:left|right)\.\s*/, '').trim();
  return /^(?:[+\-]|\\(?:pm|mp)(?![A-Za-z]))/.test(line) ? line : '';
}

function formatOcrRowsSemanticAlign(rows) {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  const formatted = cleaned.map((row) => {
    const aligned = alignLineByPattern(row, 'relation');
    if (aligned !== row) return aligned;
    const continuation = ocrSignedContinuationBody(row);
    if (continuation) return `&\\qquad ${continuation}`;
    return row;
  });
  return `\\begin{aligned}\n${formatted.join(latexLineSeparator())}\n\\end{aligned}`;
}

function formatOcrRowsAligned(rows, mode = 'relation') {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  return `\\begin{aligned}\n${cleaned.map((row) => alignLineByPattern(row, mode)).join(latexLineSeparator())}\n\\end{aligned}`;
}

function formatOcrRowsContinuation(rows) {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  const formatted = cleaned.map((row, index) => {
    const aligned = alignLineByPattern(row, 'relation');
    if (index === 0) return aligned !== row ? aligned : row;
    if (aligned !== row) return aligned;
    return `&\\quad ${row}`;
  });
  return `\\begin{aligned}\n${formatted.join(latexLineSeparator())}\n\\end{aligned}`;
}

function formatOcrRowsGathered(rows) {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  if (cleaned.length === 1) return cleaned[0];
  return `\\begin{gathered}\n${cleaned.join(latexLineSeparator())}\n\\end{gathered}`;
}

function formatOcrRowsSingleLine(rows) {
  return cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function autoFormatOcrLatex(value) {
  const rows = cleanOcrFormattingRows(splitOcrLatexRows(value));
  if (!rows.length) return String(value || '').trim();
  if (rows.length === 1) return formatOcrRowsSingleLine(rows);
  const relationPattern = /(=|<=|>=|<|>|\\(?:Longleftrightarrow|Leftrightarrow|longleftrightarrow|leftrightarrow|Longrightarrow|Rightarrow|longrightarrow|rightarrow|longleftarrow|leftarrow|mapsto|lesssim|gtrsim|simeq|cong|neq|ne|leq|le|geq|ge|subseteq|supseteq|subset|supset|approx|sim|equiv|to|iff)(?![A-Za-z]))/;
  const relationRows = rows.filter((row) => relationPattern.test(normalizeOcrAlignmentLine(row))).length;
  const signedContinuations = rows.slice(1).filter((row) => Boolean(ocrSignedContinuationBody(row))).length;
  if (relationRows || signedContinuations) return formatOcrRowsSemanticAlign(rows);
  return formatOcrRowsGathered(rows);
}

function ensureCurrentOcrFormatState() {
  if (!currentOcrResult) return;
  if (typeof currentOcrResult.originalLatex !== 'string' || !currentOcrResult.originalLatex.trim()) currentOcrResult.originalLatex = String(currentOcrResult.latex || '').trim();
  if (!Array.isArray(currentOcrResult.formatUndoStack)) currentOcrResult.formatUndoStack = [];
}

function updateOcrFormattingControls() {
  const has = Boolean(currentOcrResult?.latex);
  if (ocrFormatMode) {
    ocrFormatMode.disabled = !has;
    ocrFormatMode.value = '';
  }
  if (ocrFormatUndo) {
    const undoCount = has && Array.isArray(currentOcrResult?.formatUndoStack) ? currentOcrResult.formatUndoStack.length : 0;
    ocrFormatUndo.disabled = !undoCount;
    ocrFormatUndo.classList.toggle('is-disabled', !undoCount);
  }
}

function syncCurrentOcrLatexValue(value, options = {}) {
  if (!currentOcrResult) return;
  currentOcrResult.latex = String(value || '').trim();
  const match = ocrHistory.find((item) => item.created === currentOcrResult.created);
  if (match) {
    match.latex = currentOcrResult.latex;
    if (typeof currentOcrResult.originalLatex === 'string') match.originalLatex = currentOcrResult.originalLatex;
    if (Array.isArray(currentOcrResult.formatUndoStack)) match.formatUndoStack = [...currentOcrResult.formatUndoStack];
  }
  if (ocrLatexPreview && ocrLatexPreview.value !== currentOcrResult.latex) ocrLatexPreview.value = currentOcrResult.latex;
  scheduleOcrRenderedPreview();
  updateOcrFormattingControls();
  if (options.status) setOcrStatus(options.status);
  persistDocumentState();
}

function applyOcrFormat(mode) {
  if (!currentOcrResult || !ocrLatexPreview) return;
  ensureCurrentOcrFormatState();
  const source = String(ocrLatexPreview.value || currentOcrResult.latex || '').trim();
  if (!source && mode !== 'original') return;
  let next = source;
  const rows = cleanOcrFormattingRows(splitOcrLatexRows(source));
  if (mode === 'original') next = String(currentOcrResult.originalLatex || source).trim();
  else if (mode === 'auto') next = autoFormatOcrLatex(source);
  else if (mode === 'align') next = formatOcrRowsSemanticAlign(rows.length ? rows : [source]);
  else if (mode === 'gathered') next = formatOcrRowsGathered(rows.length ? rows : [source]);
  else if (mode === 'single-line') next = formatOcrRowsSingleLine(rows.length ? rows : [source]);
  next = stabilizeOcrLatexSyntax(repairOcrLatex(next)).trim();
  if (!next || next === source) {
    updateOcrFormattingControls();
    return;
  }
  currentOcrResult.formatUndoStack.push(source);
  syncCurrentOcrLatexValue(next, { status: t('Applied one-click LaTeX cleanup.', '已应用一键 LaTeX 整理。') });
}

function undoOcrFormat() {
  if (!currentOcrResult || !Array.isArray(currentOcrResult.formatUndoStack) || !currentOcrResult.formatUndoStack.length) return;
  const previous = currentOcrResult.formatUndoStack.pop();
  syncCurrentOcrLatexValue(previous, { status: t('Reverted the last LaTeX formatting change.', '已撤销上一条 LaTeX 整理。') });
}

function ocrPreviewMathSource(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if ((text.startsWith('\\[') && text.endsWith('\\]')) || (text.startsWith('$$') && text.endsWith('$$'))) return text;
  return `\\[${text}\\]`;
}

function resetRenderedMathScroll(rootNode) {
  if (!rootNode) return;
  const reset = () => {
    rootNode.scrollLeft = 0;
    rootNode.scrollTop = 0;
    rootNode.querySelectorAll('mjx-container').forEach((node) => {
      node.scrollLeft = 0;
      node.scrollTop = 0;
    });
  };
  reset();
  requestAnimationFrame(() => {
    reset();
    requestAnimationFrame(reset);
  });
}

function scheduleOcrRenderedPreview() {
  clearTimeout(ocrRenderedPreviewTimer);
  ocrRenderedPreviewTimer = setTimeout(renderOcrRenderedPreview, 120);
}

async function renderOcrRenderedPreview() {
  if (!ocrRenderedPreview) return;
  const value = String(ocrLatexPreview?.value || currentOcrResult?.latex || '').trim();
  const token = ++ocrRenderedPreviewToken;
  ocrRenderedPreview.classList.toggle('is-hidden', !value);
  if (!value) {
    try { window.MathJax?.typesetClear?.([ocrRenderedPreview]); } catch (_) {}
    ocrRenderedPreview.replaceChildren();
    return;
  }
  try { window.MathJax?.typesetClear?.([ocrRenderedPreview]); } catch (_) {}
  ocrRenderedPreview.textContent = ocrPreviewMathSource(value);
  if (window.MathJax?.typesetPromise) {
    try {
      await window.MathJax.typesetPromise([ocrRenderedPreview]);
      if (token !== ocrRenderedPreviewToken) scheduleOcrRenderedPreview();
    } catch (error) {
      if (token !== ocrRenderedPreviewToken) return;
      console.warn('MathReader OCR LaTeX preview failed', error);
      ocrRenderedPreview.textContent = t('Preview unavailable for the current LaTeX. Edit the source and it will retry automatically.', '当前 LaTeX 无法渲染预览。编辑源码后将自动重试。');
      ocrRenderedPreview.classList.add('has-error');
      return;
    }
  }
  if (token === ocrRenderedPreviewToken) {
    ocrRenderedPreview.classList.remove('has-error');
    resetRenderedMathScroll(ocrRenderedPreview);
  }
}

function refreshOcrUI() {
  if (!ocrResult || !ocrHistoryList) return;
  const has = Boolean(currentOcrResult?.latex);
  if (has) ensureCurrentOcrFormatState();
  ocrResult.classList.toggle('is-hidden', !has);
  ocrPageChip.textContent = has ? String(currentOcrResult.page || '—') : '—';
  ocrLatexPreview.value = has ? currentOcrResult.latex : '';
  scheduleOcrRenderedPreview();
  updateOcrFormattingControls();
  if (ocrSourceBadge) {
    const source = has ? (currentOcrResult.source || 'image') : '';
    ocrSourceBadge.textContent = !has ? '—' : source === 'vector' ? t('PDF vector', 'PDF 矢量') : t('Image OCR', '图像 OCR');
    ocrSourceBadge.dataset.source = source;
  }
  if (ocrSourceSwitchButton) {
    const source = has ? (currentOcrResult.source || 'image') : '';
    const canSwitchToImage = has && source === 'vector' && Boolean(currentOcrResult?.preview);
    const canSwitchToVector = has && source === 'image' && Boolean(currentOcrResult?.vectorAlternative);
    ocrSourceSwitchButton.classList.toggle('is-hidden', !canSwitchToImage && !canSwitchToVector);
    if (canSwitchToImage) {
      ocrSourceSwitchButton.textContent = t('Image OCR', '图像 OCR');
      ocrSourceSwitchButton.dataset.targetSource = 'image';
    } else if (canSwitchToVector) {
      ocrSourceSwitchButton.textContent = t('PDF vector', 'PDF 矢量');
      ocrSourceSwitchButton.dataset.targetSource = 'vector';
    } else {
      ocrSourceSwitchButton.removeAttribute('data-target-source');
    }
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

function mathOcrEngineReady() {
  return Boolean(mathOcrPipeline && mathOcrBackend && !mathOcrLoading);
}

function updateOcrInteractionAvailability() {
  const ready = mathOcrEngineReady();
  if (mathOcrButton) {
    mathOcrButton.disabled = !pdfDoc || !ready;
    mathOcrButton.setAttribute('aria-disabled', mathOcrButton.disabled ? 'true' : 'false');
  }
  if (!ready && ocrMode) {
    ocrMode = false;
    mathOcrButton?.classList.remove('is-active');
    mathOcrButton?.setAttribute('aria-pressed', 'false');
    applyOcrModeToSurfaces();
    resetOcrBoxes();
    ocrDrag = null;
  }
}

function setOcrMode(active) {
  if (active && !mathOcrEngineReady()) {
    ocrMode = false;
    updateOcrInteractionAvailability();
    setOcrStatus(mathOcrLoading
      ? t('OCR engine is initializing. Formula selection will activate when it is ready.', '公式 OCR 引擎正在初始化。引擎就绪后才会启用公式框选。')
      : t('OCR engine is not ready. Preloading it now…', '公式 OCR 引擎尚未就绪。正在预加载……'), true);
    if (!mathOcrLoading) scheduleMathOcrPreload();
    return;
  }
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
    setOcrStatus(mathOcrBackend ? t(`Image OCR default · ${mathOcrBackend.label} ready · PDF vector available for manual comparison`, `默认图像 OCR · ${mathOcrBackend.label} 已就绪 · PDF 矢量可手动对照`) : t('Ready. Image OCR is the default formula extractor.', '就绪。默认使用图像 OCR 提取公式。')); 
  }
}

function normalizedOcrEngineMode(value) {
  return ['official','webgpu','wasm'].includes(value) ? value : 'official';
}

function currentOcrPlan() {
  const mode = normalizedOcrEngineMode(mathOcrEngineMode);
  if (mode === 'webgpu') {
    // WebGPU is the default accelerator. If it cannot initialize, fall back
    // automatically to the model-card CPU path instead of failing OCR.
    return [
      { device: 'webgpu', dtype: 'q4f16', label: 'Texify · WebGPU q4f16', official: false },
      { device: null, dtype: null, label: 'Texify · CPU fallback', official: true }
    ];
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
  mathOcrReadyAt = null;
  mathOcrInferenceRuns = 0;
  mathOcrModulePromise = null;
  updateOcrCapability();
  try { await pipe?.dispose?.(); } catch (_) {}
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
  return raw || t('Image OCR engine failed to initialize.', '图像 OCR 引擎初始化失败。');
}

function detailedOcrError(error, backend = null) {
  const friendly = friendlyOcrError(error, backend);
  const technical = String(error?.message || error || '').replace(/\s+/g, ' ').trim();
  if (!technical || technical === friendly) return friendly;
  return `${friendly} · ${t('Technical', '技术信息')}: ${technical.slice(0, 520)}`;
}

async function ensureMathOcrPipeline() {
  if (mathOcrPipeline) return mathOcrPipeline;
  const engineLoadStart = ocrNow();
  let runtimeImportMs = 0;
  mathOcrLoading = true;
  setOcrMode(false);
  updateOcrInteractionAvailability();
  setOcrStatus(t(`Loading the local formula-image fallback (Texify · ${TRANSFORMERS_RUNTIME})…`, `正在加载本地公式图像备用引擎（Texify · ${TRANSFORMERS_RUNTIME}）……`), true);
  try {
    if (!mathOcrModulePromise) {
      const importStart = ocrNow();
      mathOcrModulePromise = import(TRANSFORMERS_URL);
      const imported = await mathOcrModulePromise;
      runtimeImportMs = ocrNow() - importStart;
      var pipeline = imported.pipeline;
    } else {
      const imported = await mathOcrModulePromise;
      var pipeline = imported.pipeline;
    }
    const plan = currentOcrPlan();
    let lastError = null;
    for (let index = 0; index < plan.length; index += 1) {
      const backend = plan[index];
      try {
        setOcrStatus(t('Initializing OCR…', '正在初始化 OCR……'), true);
        // Transformers.js reports progress per individual model asset rather
        // than one meaningful total. Do not display a fabricated percentage.
        // Show only truthful loading stages until pipeline() is actually ready.
        let downloadStageShown = false;
        const progress_callback = (info) => {
          if (!info) return;
          if (info.status === 'initiate' || info.status === 'download' || info.status === 'progress') {
            if (!downloadStageShown) {
              downloadStageShown = true;
              setOcrStatus(t(`Loading local image-OCR model (${backend.label})…`, `正在加载本地图像 OCR 模型（${backend.label}）……`), true);
            }
          }
        };
        const options = { progress_callback };
        if (!backend.official) {
          options.device = backend.device;
          options.dtype = backend.dtype;
        }
        const pipelineStart = ocrNow();
        const pipe = await pipeline('image-to-text', MATH_OCR_MODEL, options);
        const pipelineMs = ocrNow() - pipelineStart;
        mathOcrPipeline = pipe;
        mathOcrBackend = backend;
        mathOcrReadyAt = ocrNow();
        mathOcrInferenceRuns = 0;
        lastOcrEngineTiming = {
          backend: backend.label,
          backendDetail: `${backend.label}${backend.device ? ` · device=${backend.device}` : ''}${backend.dtype ? ` · dtype=${backend.dtype}` : ''}`,
          importMs: runtimeImportMs,
          pipelineMs,
          totalMs: ocrNow() - engineLoadStart
        };
        updateOcrCapability();
        setOcrStatus(t(`OCR ready · ${backend.label}`, `OCR 就绪 · ${backend.label}`));
        logOcrTiming({ type: 'engine-load', ...lastOcrEngineTiming });
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
    updateOcrInteractionAvailability();
  }
}


function scheduleMathOcrPreload() {
  const preload = async () => {
    if (mathOcrPipeline || mathOcrLoading) return;
    try {
      await ensureMathOcrPipeline();
    } catch (error) {
      console.warn('MathReader OCR background preload failed', error);
      setOcrStatus(t('OCR will retry when you extract a formula.', '公式 OCR 将在你提取公式时重试。'));
    }
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => preload(), { timeout: 1800 });
  } else {
    setTimeout(preload, 600);
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
  const normalizedCrop = normalizeFormulaPolarity(crop);
  const bounds = formulaInkBounds(normalizedCrop) || { left: 0, top: 0, width: normalizedCrop.width, height: normalizedCrop.height };
  const padRatio = variant === 'relaxed' ? 0.115 : 0.055;
  const sourcePad = Math.max(5, Math.round(Math.max(bounds.width, bounds.height) * padRatio));
  const sx = Math.max(0, bounds.left - sourcePad);
  const sy = Math.max(0, bounds.top - sourcePad);
  const sw = Math.min(normalizedCrop.width - sx, bounds.width + sourcePad * 2);
  const sh = Math.min(normalizedCrop.height - sy, bounds.height + sourcePad * 2);
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
  ctx.drawImage(normalizedCrop, sx, sy, sw, sh, 0, 0, dw, dh);
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

  // Tensor multi-index repair: Texify can close a subscript too early around
  // an ellipsis, e.g. `y_{i_{1}}...i_{k}` although the image shows one
  // multi-index `y_{i_{1}\ldots i_{k}}`. Keep this intentionally narrow:
  // require the same index letter on both sides of the ellipsis.
  out = out
    .replace(/([A-Za-z]|\\[A-Za-z]+)_\{([A-Za-z])_\{([^{}]+)\}\}\s*(?:\.{3}|\\(?:ldots|cdots)(?![A-Za-z]))\s*\2_\{([^{}]+)\}/g, '$1_{$2_{$3}\\ldots $2_{$4}}')
    .replace(/([A-Za-z]|\\[A-Za-z]+)_\{([A-Za-z])_([^{}\s]+)\}\s*(?:\.{3}|\\(?:ldots|cdots)(?![A-Za-z]))\s*\2_([^{}\s]+)/g, '$1_{$2_$3\\ldots $2_$4}');

  // Remove only mechanically duplicated arrow commands. This does not infer
  // mathematical content; it fixes decoder artifacts such as `\mapsto \to`.
  out = out
    .replace(/\\mapsto\s*(?:\\to|\\rightarrow)\b/g, '\\mapsto')
    .replace(/(?:\\to|\\rightarrow)\s*\\mapsto\b/g, '\\mapsto');
  return out.replace(/[ \t]+/g, ' ').trim();
}


function stabilizeOcrLatexSyntax(value) {
  let text = String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (!text) return '';

  // normalizeOcrLatex already removes ordinary display wrappers. Guard
  // against partial wrappers that a decoder can leave behind after truncation.
  text = text
    .replace(/^\s*\\\[\s*/, '')
    .replace(/\s*\\\]\s*$/, '')
    .replace(/^\s*\$\$\s*/, '')
    .replace(/\s*\$\$\s*$/, '')
    .replace(/\\begin\{(?:equation|equation\*|displaymath)\}/g, '')
    .replace(/\\end\{(?:equation|equation\*|displaymath)\}/g, '')
    .replace(/\\begin\{align\*?\}/g, '\\begin{aligned}')
    .replace(/\\end\{align\*?\}/g, '\\end{aligned}')
    .trim();

  // A lone sizing command is a common decoder truncation and causes MathJax
  // failures. If the counts disagree, remove only the sizing commands; the
  // actual delimiters remain visible and mathematically readable.
  text = text.replace(/\\(?:left|right)\b\s*$/g, '');
  const leftCount = (text.match(/\\left\b/g) || []).length;
  const rightCount = (text.match(/\\right\b/g) || []).length;
  if (leftCount !== rightCount) text = text.replace(/\\(?:left|right)\b\s*/g, '');

  // Keep only well-nested math environments. Orphan/mismatched \end tokens
  // are discarded, and unclosed environments are closed at the end. This is
  // syntax stabilization only; it does not invent mathematical symbols.
  const safeEnvs = new Set(['aligned','alignedat','array','cases','matrix','pmatrix','bmatrix','Bmatrix','vmatrix','Vmatrix','gathered','split']);
  const stack = [];
  text = text.replace(/\\(begin|end)\{([A-Za-z*]+)\}/g, (full, kind, env) => {
    if (!safeEnvs.has(env)) return full;
    if (kind === 'begin') {
      stack.push(env);
      return full;
    }
    if (stack.at(-1) === env) {
      stack.pop();
      return full;
    }
    return '';
  });
  while (stack.length) text += `\\end{${stack.pop()}}`;

  // repairOcrLatex balances ordinary braces. Re-run a lightweight balance in
  // case environment cleanup exposed a truncated group.
  let depth = 0;
  let balanced = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      balanced += ch + text[i + 1];
      i += 1;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      balanced += ch;
    } else if (ch === '}') {
      if (depth > 0) {
        depth -= 1;
        balanced += ch;
      }
    } else {
      balanced += ch;
    }
  }
  if (depth > 0) balanced += '}'.repeat(depth);

  // A decoder can terminate immediately after a script marker. Make that
  // syntactically harmless while keeping the uncertainty visible in source.
  balanced = balanced
    .replace(/([_^])\s*(?=[_^])/g, '$1{}')
    .replace(/([_^])\s*$/, '$1{}');
  return balanced.replace(/[ \t]+/g, ' ').trim();
}


function findRepeatedLatexSequence(latexValue) {
  const latex = String(latexValue || '').trim();
  const compact = latex.replace(/\s+/g, ' ');
  const tokens = compact.match(/\\[A-Za-z]+|[A-Za-z]+|\d+|[^\s]/g) || [];
  let best = null;

  for (const width of [6, 8, 10, 12]) {
    if (tokens.length < Math.max(140, width * 4)) continue;
    const positions = new Map();
    for (let i = 0; i <= tokens.length - width; i += 1) {
      const key = tokens.slice(i, i + width).join(' ');
      const list = positions.get(key) || [];
      list.push(i);
      positions.set(key, list);
    }
    for (const [key, list] of positions.entries()) {
      if (list.length < 3) continue;
      const chosen = [];
      for (const at of list) {
        if (!chosen.length || at - chosen[chosen.length - 1] >= width) chosen.push(at);
      }
      if (chosen.length < 3) continue;
      const locallyRepeated = chosen.some((at, idx) => idx > 0 && at - chosen[idx - 1] <= width * 12);
      if (!locallyRepeated) continue;
      const sequenceTokens = key.split(' ');
      const tensorSignals = sequenceTokens.filter((token) =>
        token === '_' || token === '^' || token === '{' || token === '}' ||
        /^(?:i|j|k|l|m|n|a|b|p|q|r|s)$/.test(token) ||
        /^\\(?:ell|Gamma|delta|nabla|partial)$/.test(token)
      ).length;
      const tensorIndexLike = tensorSignals >= Math.max(2, Math.floor(width / 3));
      const candidate = { width, sequence: key, occurrences: chosen.length, tensorIndexLike };
      if (!best || candidate.occurrences > best.occurrences || (candidate.occurrences === best.occurrences && candidate.width > best.width)) best = candidate;
    }
  }
  return best;
}

function assessImageOcrResult(rawValue, latexValue) {
  const raw = String(rawValue || '').trim();
  const latex = String(latexValue || '').trim();
  const hardReasons = [];
  const warnings = [];
  const corruption = { commandLoop: null, repeatedFragment: null, repeatedSequence: null, runawayFraction: false };

  if (!latex) hardReasons.push(t('no LaTeX was produced', '没有生成 LaTeX'));
  if (/\\includegraphics\b/i.test(raw) || /\\includegraphics\b/i.test(latex)) hardReasons.push(t('document-layout placeholders were produced', '生成了文档版面占位符'));
  if (/\\(?:begin|end)\{(?:document|figure|table)\}/i.test(raw)) hardReasons.push(t('document markup was produced instead of a formula', '生成了文档标记而不是公式'));
  if (/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u.test(raw + latex)) hardReasons.push(t('private-use font glyphs leaked into the OCR output', 'OCR 输出中混入了私用区字体字形'));
  if (/\uFFFD/.test(raw + latex)) hardReasons.push(t('unrecoverable replacement glyphs were produced', '生成了无法恢复的替代字形'));

  const commandLoop = raw.match(/(\\[A-Za-z]+(?:\{[^{}]{0,30}\})?)(?:\s*\1){4,}/);
  if (commandLoop) {
    corruption.commandLoop = { sequence: commandLoop[1], occurrences: 5 };
    hardReasons.push(`${t('decoder runaway: repeated command', '解码器失控：重复命令')} “${commandLoop[1]}”`);
  }
  const compact = latex.replace(/\s+/g, ' ');
  const fragmentLoop = compact.match(/(.{18,90})(?:\s*\1){3,}/);
  if (fragmentLoop) {
    const fragment = String(fragmentLoop[1] || '').trim().slice(0, 120);
    corruption.repeatedFragment = { sequence: fragment, occurrences: 4 };
    hardReasons.push(`${t('decoder runaway: repeated fragment', '解码器失控：重复片段')} “${fragment}”`);
  }

  const fracCount = (latex.match(/\\(?:c?frac)\b/g) || []).length;
  let braceDepth = 0;
  let maxBraceDepth = 0;
  for (let i = 0; i < latex.length; i += 1) {
    if (latex[i] === '\\' && i + 1 < latex.length) { i += 1; continue; }
    if (latex[i] === '{') { braceDepth += 1; maxBraceDepth = Math.max(maxBraceDepth, braceDepth); }
    else if (latex[i] === '}' && braceDepth > 0) braceDepth -= 1;
  }
  if ((fracCount >= 20 && latex.length >= 700) || maxBraceDepth >= 30) {
    corruption.runawayFraction = true;
    hardReasons.push(t('decoder runaway: implausible fraction nesting', '解码器失控：异常分式嵌套'));
  }

  const repeatedSequence = findRepeatedLatexSequence(latex);
  if (repeatedSequence) {
    corruption.repeatedSequence = repeatedSequence;
    const sequence = repeatedSequence.sequence.slice(0, 160);
    if (repeatedSequence.tensorIndexLike) {
      // Tensor/index notation is naturally repetitive. Keep the evidence for
      // diagnostics, but it must not hard-reject the result or trigger a retry.
      warnings.push(`${t('repeated tensor/index notation detected (allowed)', '检测到重复张量/指标记号（允许）')} “${sequence}” ×${repeatedSequence.occurrences}`);
    } else {
      hardReasons.push(`${t('decoder runaway: repeated LaTeX token sequence', '解码器失控：重复 LaTeX token 序列')} “${sequence}” ×${repeatedSequence.occurrences}`);
    }
  }

  if (latex.length > 1800) warnings.push(t('the output is unusually long', '输出长度异常偏长'));
  if (braceDepth !== 0) warnings.push(t('brace balance needed repair or review', '花括号平衡需要检查'));
  const mathSignal = /\\[A-Za-z]+|[=<>_^{}]|[+\-*\/]|\d/.test(latex);
  const words = latex.match(/[A-Za-z]{3,}/g) || [];
  if (!mathSignal && words.length > 3) warnings.push(t('the output may contain prose rather than mathematics', '输出可能包含普通文本而非数学公式'));
  if (fracCount >= 12 || maxBraceDepth >= 18) warnings.push(t('complex nesting should be reviewed', '复杂嵌套结构建议人工核对'));

  return { ok: hardReasons.length === 0, hardReject: hardReasons.length > 0, reasons: hardReasons, warnings, corruption };
}

function imageOcrCorruptionScore(candidate) {
  if (!candidate?.latex) return 100000;
  const assessment = candidate.assessment || {};
  const corruption = assessment.corruption || {};
  let score = Number(candidate.penalty) || 0;
  if (assessment.hardReject) score += 100;
  score += (Array.isArray(assessment.reasons) ? assessment.reasons.length : 0) * 18;
  if (corruption.commandLoop) score += 70 + Math.min(40, Number(corruption.commandLoop.occurrences || 0) * 4);
  if (corruption.repeatedFragment) score += 65 + Math.min(40, Number(corruption.repeatedFragment.occurrences || 0) * 4);
  if (corruption.repeatedSequence && !corruption.repeatedSequence.tensorIndexLike) {
    score += 70;
    score += Math.min(50, Number(corruption.repeatedSequence.occurrences || 0) * 5);
  }
  if (corruption.runawayFraction) score += 90;
  score += Math.max(0, String(candidate.latex || '').length - 250) / 120;
  return score;
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


function formulaBackgroundIsDark(canvas) {
  const ctx = canvas?.getContext?.('2d', { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) return false;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const samples = [];
  const stepX = Math.max(1, Math.floor(width / 24));
  const stepY = Math.max(1, Math.floor(height / 12));
  const pushLum = (x, y) => {
    const i = (y * width + x) * 4;
    samples.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
  };
  for (let x = 0; x < width; x += stepX) { pushLum(x, 0); pushLum(x, height - 1); }
  for (let y = 0; y < height; y += stepY) { pushLum(0, y); pushLum(width - 1, y); }
  return median(samples) < 128;
}

function normalizeFormulaPolarity(canvas) {
  if (!canvas || !formulaBackgroundIsDark(canvas)) return canvas;
  const out = document.createElement('canvas');
  out.width = Math.max(1, canvas.width);
  out.height = Math.max(1, canvas.height);
  const src = canvas.getContext('2d', { willReadFrequently: true });
  const dst = out.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!src || !dst) return canvas;
  const image = src.getImageData(0, 0, out.width, out.height);
  const border = [];
  const stepX = Math.max(1, Math.floor(out.width / 24));
  const stepY = Math.max(1, Math.floor(out.height / 12));
  const lumAt = (x, y) => {
    const i = (y * out.width + x) * 4;
    return 0.2126 * image.data[i] + 0.7152 * image.data[i + 1] + 0.0722 * image.data[i + 2];
  };
  for (let x = 0; x < out.width; x += stepX) { border.push(lumAt(x, 0), lumAt(x, out.height - 1)); }
  for (let y = 0; y < out.height; y += stepY) { border.push(lumAt(0, y), lumAt(out.width - 1, y)); }
  const background = Math.max(0, Math.min(180, median(border)));
  const span = Math.max(48, 255 - background);
  for (let i = 0; i < image.data.length; i += 4) {
    const lum = 0.2126 * image.data[i] + 0.7152 * image.data[i + 1] + 0.0722 * image.data[i + 2];
    const signal = Math.max(0, Math.min(1, (lum - background) / span));
    const value = Math.round(255 * (1 - Math.pow(signal, 0.78)));
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  dst.putImageData(image, 0, 0);
  return out;
}

function formulaInkProfiles(canvas) {
  const normalized = normalizeFormulaPolarity(canvas);
  const ctx = normalized?.getContext?.('2d', { willReadFrequently: true });
  if (!ctx || !normalized.width || !normalized.height) return null;
  const { data, width, height } = ctx.getImageData(0, 0, normalized.width, normalized.height);
  const rowInk = new Array(height).fill(0);
  const colInk = new Array(width).fill(0);
  const rowLongestRun = new Array(height).fill(0);
  for (let y = 0; y < height; y += 1) {
    let run = 0;
    let longest = 0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum < 225) {
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
  return { canvas: normalized, width, height, rowInk, colInk, rowLongestRun };
}

function formulaHasDominantFractionRule(canvas) {
  const profile = formulaInkProfiles(canvas);
  if (!profile) return false;
  const { width, height, rowInk, rowLongestRun } = profile;
  const strongRuleRows = rowLongestRun
    .map((run, y) => ({ run, y }))
    .filter((item) => item.run >= width * 0.48);
  if (!strongRuleRows.length) return false;
  const ruleY = strongRuleRows[Math.floor(strongRuleRows.length / 2)].y;
  const aboveInk = rowInk.slice(0, Math.max(0, ruleY - 2)).reduce((a, b) => a + b, 0);
  const belowInk = rowInk.slice(Math.min(height, ruleY + 3)).reduce((a, b) => a + b, 0);
  return aboveInk > width * 0.35 && belowInk > width * 0.18;
}

function formulaRowBands(canvas) {
  const profile = formulaInkProfiles(canvas);
  if (!profile || profile.width / Math.max(1, profile.height) < 1.15) return [];
  const { width, height, rowInk, colInk, rowLongestRun } = profile;
  // One dominant long fraction bar with substantial ink both above and below
  // is a single structured quotient, not a multi-row aligned environment.
  // Keeping it intact is critical for Yamabe/Rayleigh quotients.
  if (formulaHasDominantFractionRule(canvas)) return [];

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
  // A very wide one-line tensor identity with large \sum/\int limits often
  // appears as three horizontal bands: upper limits, the main baseline, and
  // lower limits. Do not mistake those script bands for separate equation rows.
  const aspect = width / Math.max(1, height);
  if (aspect >= 6.0 && merged.length === 3) {
    const heights = merged.map((band) => band.bottom - band.top + 1);
    const middleDominates = heights[1] >= Math.max(18, heights[0] * 1.8, heights[2] * 1.8);
    if (middleDominates) return [];
  }
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

function latexHasAlignmentRelation(value) {
  return /(?:&\s*)?(?:=|\\leq?\b|\\geq?\b|\\approx\b|\\sim\b|\\equiv\b|\\to\b|\\Rightarrow\b)/.test(String(value || ''));
}

function latexHasLargeMathOperator(value) {
  return /\\(?:int|iint|iiint|oint|sum|prod|lim|sup|inf|bigcup|bigcap)\b/.test(String(value || ''));
}

function alignedRowsAssessment(lines) {
  const clean = (Array.isArray(lines) ? lines : []).map((line) => String(line || '').trim()).filter(Boolean);
  const reasons = [];
  if (clean.length < 2) reasons.push('too-few-rows');
  const relationCount = clean.filter(latexHasAlignmentRelation).length;
  if (clean.length >= 2 && relationCount < Math.max(2, clean.length - 1)) reasons.push('weak-shared-alignment');
  for (let i = 0; i < clean.length; i += 1) {
    const compact = clean[i].replace(/\s+/g, '');
    // A very short, relation-free fragment between equation rows is usually a
    // decoder artifact (for example `J\\mathbb{R}^{n}` detached from an
    // integral). Reject the rowwise candidate rather than silently deleting
    // mathematics or presenting a fabricated aligned block.
    if (clean.length >= 3 && compact.length <= 22 && !latexHasAlignmentRelation(clean[i]) && !latexHasLargeMathOperator(clean[i])) {
      reasons.push(`orphan-row-${i + 1}`);
    }
  }
  return { ok: reasons.length === 0, reasons, relationCount };
}

function alignedCandidateScore(item, expectedRows = 0) {
  if (!item?.latex) return 10000;
  const assessmentPenalty = (item.assessment?.reasons?.length || 0) * 50;
  const structural = Number(item.penalty || 0);
  const rows = latexVisualRowCount(item.latex);
  let score = structural + assessmentPenalty;
  if (expectedRows >= 2) score += Math.abs(rows - expectedRows) * 10;
  if (/\\begin\{aligned\}/.test(item.latex)) score -= 4;
  const relationCount = (String(item.latex).match(/&\s*(?:=|\\leq?|\\geq?|\\approx|\\sim|\\equiv|\\to|\\Rightarrow)/g) || []).length;
  if (expectedRows >= 2) score -= Math.min(expectedRows, relationCount) * 2;
  return score;
}

function preprocessFormulaCanvas(sourceCanvas, mode = 'normal') {
  if (!sourceCanvas || mode === 'normal') return sourceCanvas;
  const out = document.createElement('canvas');
  out.width = Math.max(1, sourceCanvas.width || 1);
  out.height = Math.max(1, sourceCanvas.height || 1);
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const dstCtx = out.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!srcCtx || !dstCtx) return sourceCanvas;
  dstCtx.fillStyle = '#fff';
  dstCtx.fillRect(0, 0, out.width, out.height);
  const imageData = srcCtx.getImageData(0, 0, out.width, out.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    let value = lum;
    if (mode === 'contrast') {
      if (lum <= 190) value = 0;
      else if (lum >= 248) value = 255;
      else value = Math.max(0, Math.min(255, Math.round(((lum - 190) / 58) * 255)));
    } else if (mode === 'boost') {
      value = lum < 228 ? 0 : 255;
    }
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  dstCtx.putImageData(imageData, 0, 0);
  return out;
}

function latexMathSignature(value) {
  const text = String(value || '');
  const count = (pattern) => (text.match(pattern) || []).length;
  return {
    superscripts: count(/\^/g),
    subscripts: count(/_/g),
    fractions: count(/\\(?:c?frac)\b/g),
    radicals: count(/\\sqrt\b/g),
    integrals: count(/\\(?:int|iint|iiint|oint)\b/g),
    sums: count(/\\(?:sum|prod|bigcup|bigcap)\b/g),
    relations: count(/(?:=|\\leq?\b|\\geq?\b|\\approx\b|\\sim\b|\\equiv\b|\\to\b|\\Rightarrow\b)/g)
  };
}

function latexSignatureDistance(a, b) {
  const left = latexMathSignature(a);
  const right = latexMathSignature(b);
  return Math.abs(left.superscripts - right.superscripts)
    + Math.abs(left.subscripts - right.subscripts)
    + Math.abs(left.fractions - right.fractions) * 2
    + Math.abs(left.radicals - right.radicals) * 2
    + Math.abs(left.integrals - right.integrals) * 3
    + Math.abs(left.sums - right.sums) * 3
    + Math.abs(left.relations - right.relations) * 2;
}

function analyzeFormulaSelection(crop, vectorCandidate = null) {
  const bands = formulaRowBands(crop);
  const aspect = crop?.width && crop?.height ? crop.width / Math.max(1, crop.height) : 1;
  const vectorLatex = String(vectorCandidate?.latex || '');
  const vectorSignature = latexMathSignature(vectorLatex);
  const scriptLoad = vectorSignature.superscripts + vectorSignature.subscripts;
  const operatorLoad = vectorSignature.integrals + vectorSignature.sums + vectorSignature.fractions + vectorSignature.radicals;
  const tensorLike = scriptLoad >= 4 || (aspect >= 4.8 && bands.length <= 1) || (scriptLoad >= 2 && operatorLoad >= 1);
  const fractionLike = formulaHasDominantFractionRule(crop);
  return {
    bands,
    aspect,
    tensorLike,
    fractionLike,
    expectedRows: bands.length >= 2 ? bands.length : 0,
    scriptLoad,
    operatorLoad
  };
}

function imageOcrCandidateScore(candidate, context = {}) {
  if (!candidate?.latex) return 10000;
  let score = alignedCandidateScore(candidate, context.expectedRows || 0);
  const signature = latexMathSignature(candidate.latex);
  if (context.tensorLike) {
    if (signature.superscripts + signature.subscripts < Math.max(2, context.scriptLoad || 0)) score += 12;
  }
  if (context.fractionLike) {
    if (signature.fractions < 1) score += 14;
    else score -= 2;
  }
  if (context.vectorLatex) score += Math.min(24, latexSignatureDistance(candidate.latex, context.vectorLatex) * 1.4);
  if (candidate.preprocess === 'contrast') score -= 0.6;
  if (candidate.variant === 'aligned-rows') score -= 1.2;
  if (candidate.variant === 'wide-tiles') score -= 1.5;
  return score;
}

function vectorCandidateScore(vectorCandidate, context = {}) {
  if (!vectorCandidate?.latex) return 10000;
  const latex = stabilizeOcrLatexSyntax(repairOcrLatex(vectorCandidate.latex));
  const pseudo = {
    latex,
    penalty: latexStructuralPenalty(latex),
    assessment: assessImageOcrResult(latex, latex)
  };
  let score = alignedCandidateScore(pseudo, context.expectedRows || 0);
  if ((vectorCandidate.tokenCount || 0) > 120) score += Math.min(10, ((vectorCandidate.tokenCount || 0) - 120) * 0.08);
  if (context.imageLatex) score += Math.min(18, latexSignatureDistance(latex, context.imageLatex));
  if (context.tensorLike) {
    const signature = latexMathSignature(latex);
    if (signature.superscripts + signature.subscripts >= Math.max(3, context.scriptLoad || 0)) score -= 4;
  }
  return score;
}

async function runImageFormulaRecognition(crop, options = {}) {
  const recognitionStart = ocrNow();
  const pipe = await ensureMathOcrPipeline();
  const engineWarmMs = Number.isFinite(Number(mathOcrReadyAt)) ? Math.max(0, ocrNow() - Number(mathOcrReadyAt)) : null;
  mathOcrInferenceRuns += 1;
  const engineRunNumber = mathOcrInferenceRuns;
  const runtimeEnvironment = {
    visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
    hardwareConcurrency: Number.isFinite(Number(navigator?.hardwareConcurrency)) ? Number(navigator.hardwareConcurrency) : null,
    deviceMemoryGb: Number.isFinite(Number(navigator?.deviceMemory)) ? Number(navigator.deviceMemory) : null
  };
  mathOcrLoading = true;
  const passTimings = [];
  let profile;
  const analysisStart = ocrNow();
  try {
    profile = analyzeFormulaSelection(crop, options.vectorCandidate || null);
  } catch (error) {
    console.warn('MathReader OCR layout analysis failed; using safe single-pass defaults.', error);
    profile = {
      bands: [],
      aspect: crop?.width && crop?.height ? crop.width / Math.max(1, crop.height) : 1,
      tensorLike: false,
      fractionLike: false,
      expectedRows: 0,
      scriptLoad: 0,
      operatorLoad: 0
    };
  }
  const analysisMs = ocrNow() - analysisStart;

  async function onePass(sourceCanvas, variant = 'tight', preprocess = 'normal', careful = false) {
    const passStart = ocrNow();
    const timing = { variant, preprocess, careful };
    let stageStart = ocrNow();
    const prepared = normalizeFormulaCropForOcr(sourceCanvas, variant);
    timing.normalizeMs = ocrNow() - stageStart;
    stageStart = ocrNow();
    const processed = preprocessFormulaCanvas(prepared, preprocess);
    timing.preprocessMs = ocrNow() - stageStart;
    stageStart = ocrNow();
    const inputImage = await prepareMathOcrInput(processed);
    timing.inputMs = ocrNow() - stageStart;
    // Stable decoder budget: preserve the v153-era 512-token cap for every
    // formula. Longer caps increased latency without reliably fixing truncation.
    const generation = {
      max_new_tokens: 512,
      num_beams: careful ? 2 : 1,
      early_stopping: Boolean(careful),
      do_sample: false,
      repetition_penalty: 1.04
    };
    stageStart = ocrNow();
    const output = await pipe(inputImage, generation);
    timing.inferenceMs = ocrNow() - stageStart;
    stageStart = ocrNow();
    const raw = Array.isArray(output) ? output[0]?.generated_text : output?.generated_text;
    const rawLatex = normalizeOcrLatex(raw);
    const latex = stabilizeOcrLatexSyntax(repairOcrLatex(rawLatex));
    const penalty = latexStructuralPenalty(rawLatex);
    const assessment = assessImageOcrResult(raw, latex);
    timing.inputWidth = Number(processed?.width || prepared?.width || sourceCanvas?.width || 0);
    timing.inputHeight = Number(processed?.height || prepared?.height || sourceCanvas?.height || 0);
    timing.inputAspect = timing.inputHeight ? timing.inputWidth / timing.inputHeight : null;
    timing.rawChars = String(raw || '').length;
    timing.approxTokens = ocrApproxTokenCount(raw);
    timing.approxTokensPerSecond = ocrRate(timing.approxTokens, timing.inferenceMs);
    timing.charsPerSecond = ocrRate(timing.rawChars, timing.inferenceMs);
    timing.penalty = Number(penalty) || 0;
    timing.hardReject = Boolean(assessment?.hardReject);
    timing.rejectReasons = Array.isArray(assessment?.reasons) ? assessment.reasons.filter(Boolean).join('; ') : '';
    timing.runawaySequence = assessment?.corruption?.repeatedSequence?.sequence || assessment?.corruption?.repeatedFragment?.sequence || assessment?.corruption?.commandLoop?.sequence || '';
    timing.runawayKind = assessment?.corruption?.repeatedSequence?.tensorIndexLike ? 'tensor/index' : (timing.runawaySequence ? 'generic' : '');
    timing.runawayOccurrences = Number(assessment?.corruption?.repeatedSequence?.occurrences || assessment?.corruption?.repeatedFragment?.occurrences || assessment?.corruption?.commandLoop?.occurrences || 0) || 0;
    timing.corruptionScore = imageOcrCorruptionScore({ latex, penalty, assessment });
    timing.postprocessMs = ocrNow() - stageStart;
    timing.totalMs = ocrNow() - passStart;
    passTimings.push(timing);
    return { raw, rawLatex, latex, penalty, assessment, variant, preprocess };
  }

  setOcrStatus(t('Recognizing formula locally with Texify…', '正在使用 Texify 本地识别公式……'), true);
  const first = await onePass(crop, 'tight', 'normal', false);

  // Fast-first policy: if the first result passes the quality gate, return it
  // immediately. Complex-looking geometry by itself must never trigger a
  // cascade of extra model calls. v126 did that and could take minutes.
  if (first.assessment.ok && first.penalty < 20) {
    return { ...first, profile, inferenceCount: 1, timing: { analysisMs, firstPassPenalty: first.penalty, retryReason: '', retryProfile: '', passes: passTimings, recognitionMs: ocrNow() - recognitionStart, engineWarmMs, engineRunNumber, ...runtimeEnvironment } };
  }

  const retryReasons = [];
  if (first.assessment?.hardReject) {
    const hardReasons = Array.isArray(first.assessment.reasons) ? first.assessment.reasons.filter(Boolean) : [];
    retryReasons.push(hardReasons.length
      ? `${t('hard reject', '硬拒绝')}: ${hardReasons.join('; ')}`
      : t('hard reject', '硬拒绝'));
  }
  if (Number(first.penalty) >= 20) {
    retryReasons.push(`${t('structural penalty', '结构惩罚')} ${Number(first.penalty).toFixed(1)} ≥ 20`);
  }
  const retryReason = retryReasons.join(' · ') || t('first pass did not clear the quality gate', '首轮未通过质量门槛');

  // At most one targeted retry. Decoder-runaway is a special case: beam 2
  // has repeatedly reproduced the same failure while adding very large latency.
  // Keep that retry conservative (beam 1). Other failure classes retain the
  // existing careful beam-2 retry until real diagnostics justify changing them.
  const firstRejectReasons = Array.isArray(first.assessment?.reasons) ? first.assessment.reasons : [];
  const decoderRunaway = firstRejectReasons.some((reason) => /decoder runaway|解码器失控|解码器发生失控循环/i.test(String(reason || '')));
  let retryVariant = 'relaxed';
  let retryPreprocess = 'normal';
  let retryCareful = !decoderRunaway;
  let retryProfile = retryCareful
    ? t('careful · relaxed/normal · beam 2', '精细 · relaxed/normal · beam 2')
    : t('decoder-runaway recovery · relaxed/normal · beam 1', '解码失控恢复 · relaxed/normal · beam 1');
  let retryMessage = retryCareful
    ? t('OCR was uncertain · trying one careful retry…', 'OCR 结果不够稳定 · 正在进行一次精细重试……')
    : t('Decoder repetition detected · trying one conservative retry…', '检测到解码重复 · 正在进行一次保守重试……');
  if (profile.tensorLike || (profile.aspect >= 6 && profile.expectedRows === 0)) {
    retryVariant = 'tight';
    retryPreprocess = 'contrast';
    retryProfile = profile.tensorLike
      ? t(`tensor-like geometry · tight/contrast · beam ${retryCareful ? 2 : 1}`, `张量型结构 · tight/contrast · beam ${retryCareful ? 2 : 1}`)
      : t(`very wide single line · tight/contrast · beam ${retryCareful ? 2 : 1}`, `超宽单行 · tight/contrast · beam ${retryCareful ? 2 : 1}`);
    retryMessage = decoderRunaway
      ? t('Decoder repetition detected · trying one conservative contrast retry…', '检测到解码重复 · 正在进行一次保守的高对比度重试……')
      : t('OCR was uncertain · trying one tensor-friendly contrast pass…', 'OCR 结果不够稳定 · 正在进行一次适合复杂上下标的高对比度重试……');
  } else if (profile.fractionLike) {
    retryVariant = 'relaxed';
    retryPreprocess = 'normal';
    retryProfile = t(`fraction-like geometry · relaxed/normal · beam ${retryCareful ? 2 : 1}`, `分式型结构 · relaxed/normal · beam ${retryCareful ? 2 : 1}`);
    retryMessage = decoderRunaway
      ? t('Decoder repetition detected · trying one conservative full-fraction retry…', '检测到解码重复 · 正在对完整分式进行一次保守重试……')
      : t('OCR was uncertain · trying one full-fraction retry…', 'OCR 结果不够稳定 · 正在对完整分式进行一次重试……');
  }

  setOcrStatus(retryMessage, true);
  let retry = null;
  try {
    retry = await onePass(crop, retryVariant, retryPreprocess, retryCareful);
  } catch (_) {
    retry = null;
  }

  let best = first;
  let retryFailed = false;
  let candidateDecision = t('first pass retained', '保留首轮结果');
  const context = {
    expectedRows: profile.expectedRows,
    tensorLike: profile.tensorLike,
    scriptLoad: profile.scriptLoad,
    fractionLike: profile.fractionLike,
    vectorLatex: options.vectorCandidate?.latex || ''
  };

  if (retry?.latex) {
    if (!retry.assessment.hardReject) {
      if (first.assessment?.hardReject || imageOcrCandidateScore(retry, context) < imageOcrCandidateScore(first, context)) {
        best = retry;
        candidateDecision = t('retry passed quality gate and was selected', '重试通过质量门槛并被选中');
      }
    } else if (first.assessment?.hardReject) {
      retryFailed = true;
      const firstCorruption = imageOcrCorruptionScore(first);
      const retryCorruption = imageOcrCorruptionScore(retry);
      if (retryCorruption < firstCorruption ||
          (retryCorruption === firstCorruption && imageOcrCandidateScore(retry, context) < imageOcrCandidateScore(first, context))) {
        best = retry;
        candidateDecision = `${t('both passes failed; retry was less corrupted', '两轮均失败；重试结果损坏较轻')} (${retryCorruption.toFixed(1)} < ${firstCorruption.toFixed(1)})`;
      } else {
        candidateDecision = `${t('both passes failed; first pass was less corrupted', '两轮均失败；首轮结果损坏较轻')} (${firstCorruption.toFixed(1)} ≤ ${retryCorruption.toFixed(1)})`;
      }
    }
  }

  if (!best.latex) throw new Error(t('The image model returned no LaTeX for this region.', '图像模型没有为该区域返回 LaTeX。'));

  if (best.assessment?.hardReject) {
    const failureWarning = retryFailed
      ? t('OCR retry failed; showing the less-corrupted candidate for review', 'OCR 重试失败；显示损坏较轻的候选结果供检查')
      : t('OCR result failed the quality gate; review carefully', 'OCR 结果未通过质量门槛；请仔细检查');
    best = {
      ...best,
      assessment: {
        ...best.assessment,
        ok: true,
        retainedForReview: true,
        retryFailed,
        warnings: [failureWarning, ...(best.assessment.warnings || []), ...(best.assessment.reasons || [])]
      }
    };
  }
  return { ...best, profile, inferenceCount: retry ? 2 : 1, timing: { analysisMs, firstPassPenalty: first.penalty, retryReason, retryProfile, retryFailed, candidateDecision, passes: passTimings, recognitionMs: ocrNow() - recognitionStart, engineWarmMs, engineRunNumber, ...runtimeEnvironment } };
}

function commitFormulaResult(item, statusMessage = '') {
  currentOcrResult = item;
  ocrHistory = [item, ...ocrHistory.filter((entry) => !(entry.page === item.page && entry.latex === item.latex && entry.source === item.source))].slice(0, 10);
  refreshOcrUI();
  persistDocumentState();
  if (statusMessage) setOcrStatus(statusMessage);
}

async function recognizeMathCrop(crop, page, kind, ocrLayer = null, selectionRect = null, diagnosticsMeta = {}) {
  if (!crop || !page) return;
  const endToEndStart = Number.isFinite(Number(diagnosticsMeta.startedAt)) ? Number(diagnosticsMeta.startedAt) : ocrNow();
  setOcrMode(false);
  const preview = crop.toDataURL('image/png');
  const vector = ocrLayer && selectionRect ? extractVectorFormulaFromLayer(ocrLayer, selectionRect) : null;
  const selectionRatio = selectionRect && ocrLayer
    ? Math.min(1, Math.max(0, (Number(selectionRect.top || 0) + Number(selectionRect.height || 0) / 2) / Math.max(1, Number(ocrLayer.offsetHeight || ocrLayer.getBoundingClientRect?.().height || 1))))
    : null;

  if (formulaExtractionMode === 'vector' && vector?.latex) {
    commitFormulaResult(
      { page, kind, ratio: selectionRatio, latex: stabilizeOcrLatexSyntax(repairOcrLatex(vector.latex)), preview, created: Date.now(), quality: 'vector', source: 'vector', extractedText: vector.text },
      t('Formula extracted from embedded PDF text and glyph geometry.', '已依据 PDF 原生文本与字形几何提取公式。')
    );
    return;
  }

  mathOcrLoading = true;
  let recognitionFailed = false;
  setOcrProcessing(true);
  try {
    const result = await runImageFormulaRecognition(crop, { vectorCandidate: vector });
    const item = {
      page,
      kind,
      ratio: selectionRatio,
      latex: result.latex,
      preview,
      created: Date.now(),
      quality: result.penalty === 0 && !(result.assessment?.warnings?.length) ? 'clean' : 'review',
      source: 'image',
      vectorAlternative: vector?.latex || null,
      vectorAlternativeText: vector?.text || null
    };
    const commitStart = ocrNow();
    commitFormulaResult(item, result.assessment?.retainedForReview
      ? t('Image OCR returned uncertain LaTeX · kept for review instead of replacing it with PDF vector.', '图像 OCR 返回不确定的 LaTeX · 已保留供核对，不再自动替换为 PDF 矢量结果。')
      : (result.penalty === 0 && !(result.assessment?.warnings?.length)
        ? t('Local image OCR complete · structure check passed.', '本地图像 OCR 完成 · 结构检查通过。')
        : t('Local image OCR complete · review the editable LaTeX before reuse.', '本地图像 OCR 完成 · 复用前请核对可编辑 LaTeX。')));
    const commitMs = ocrNow() - commitStart;
    lastOcrRunTiming = {
      backend: mathOcrBackend?.label || '—',
      inferenceCount: result.inferenceCount || result.timing?.passes?.length || 1,
      cropSize: `${crop.width || 0}×${crop.height || 0}`,
      outputChars: String(result.latex || '').length,
      outputApproxTokens: ocrApproxTokenCount(result.latex),
      cropAspect: crop?.height ? (Number(crop.width || 0) / Number(crop.height || 1)) : null,
      backendDetail: `${mathOcrBackend?.label || '—'}${mathOcrBackend?.device ? ` · device=${mathOcrBackend.device}` : ''}${mathOcrBackend?.dtype ? ` · dtype=${mathOcrBackend.dtype}` : ''}`,
      cropMs: Number.isFinite(Number(diagnosticsMeta.cropMs)) ? Number(diagnosticsMeta.cropMs) : null,
      analysisMs: result.timing?.analysisMs,
      firstPassPenalty: result.timing?.firstPassPenalty,
      retryReason: result.timing?.retryReason || '',
      retryProfile: result.timing?.retryProfile || '',
      engineWarmMs: result.timing?.engineWarmMs,
      engineRunNumber: result.timing?.engineRunNumber,
      visibilityState: result.timing?.visibilityState || 'unknown',
      hardwareConcurrency: result.timing?.hardwareConcurrency,
      deviceMemoryGb: result.timing?.deviceMemoryGb,
      passes: result.timing?.passes || [],
      commitMs,
      recognitionMs: result.timing?.recognitionMs,
      totalMs: ocrNow() - endToEndStart
    };
    logOcrTiming({ type: 'recognition', ...lastOcrRunTiming });
  } catch (error) {
    recognitionFailed = true;
    console.error(error);
    // Do not silently replace Image OCR with PDF vector. Vector reconstruction
    // can be badly corrupted by PDF font encodings even for simple formulas.
    // Keep it available only through the explicit "Try PDF Vector" action.
    const detail = detailedOcrError(error, mathOcrBackend);
    setOcrStatus(vector?.latex
      ? `${detail} · ${t('PDF vector is available manually.', '可手动尝试 PDF 矢量结果。')}`
      : detail);
    showError(detail);
  } finally {
    mathOcrLoading = false;
    setOcrProcessing(false);
    if (recognitionFailed) {
      await disposeMathOcrPipeline();
      updateOcrInteractionAvailability();
      scheduleMathOcrPreload();
    } else {
      updateOcrInteractionAvailability();
    }
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

async function recognizeImageFallbackCrop(crop, page, kind, preview = null, vectorAlternative = null, vectorAlternativeText = null, ratio = null, diagnosticsMeta = {}) {
  if (!crop || !page) return;
  const endToEndStart = Number.isFinite(Number(diagnosticsMeta.startedAt)) ? Number(diagnosticsMeta.startedAt) : ocrNow();
  mathOcrLoading = true;
  let recognitionFailed = false;
  const imagePreview = preview || crop.toDataURL('image/png');
  setOcrProcessing(true);
  try {
    const result = await runImageFormulaRecognition(crop);
    const item = {
      page,
      kind,
      ratio: Number.isFinite(Number(ratio)) ? Math.min(1, Math.max(0, Number(ratio))) : null,
      latex: result.latex,
      preview: imagePreview,
      created: Date.now(),
      quality: result.penalty === 0 ? 'clean' : 'review',
      source: 'image',
      vectorAlternative,
      vectorAlternativeText
    };
    const commitStart = ocrNow();
    commitFormulaResult(item, result.penalty === 0
      ? t('Image OCR comparison complete.', '图像 OCR 对照完成。')
      : t('Image OCR comparison complete · review the editable LaTeX.', '图像 OCR 对照完成 · 请核对可编辑 LaTeX。'));
    const commitMs = ocrNow() - commitStart;
    lastOcrRunTiming = {
      backend: mathOcrBackend?.label || '—',
      inferenceCount: result.inferenceCount || result.timing?.passes?.length || 1,
      cropSize: `${crop.width || 0}×${crop.height || 0}`,
      outputChars: String(result.latex || '').length,
      outputApproxTokens: ocrApproxTokenCount(result.latex),
      cropAspect: crop?.height ? (Number(crop.width || 0) / Number(crop.height || 1)) : null,
      backendDetail: `${mathOcrBackend?.label || '—'}${mathOcrBackend?.device ? ` · device=${mathOcrBackend.device}` : ''}${mathOcrBackend?.dtype ? ` · dtype=${mathOcrBackend.dtype}` : ''}`,
      cropMs: Number.isFinite(Number(diagnosticsMeta.cropMs)) ? Number(diagnosticsMeta.cropMs) : null,
      analysisMs: result.timing?.analysisMs,
      firstPassPenalty: result.timing?.firstPassPenalty,
      retryReason: result.timing?.retryReason || '',
      retryProfile: result.timing?.retryProfile || '',
      engineWarmMs: result.timing?.engineWarmMs,
      engineRunNumber: result.timing?.engineRunNumber,
      visibilityState: result.timing?.visibilityState || 'unknown',
      hardwareConcurrency: result.timing?.hardwareConcurrency,
      deviceMemoryGb: result.timing?.deviceMemoryGb,
      passes: result.timing?.passes || [],
      commitMs,
      recognitionMs: result.timing?.recognitionMs,
      totalMs: ocrNow() - endToEndStart
    };
    logOcrTiming({ type: 'recognition', comparison: true, ...lastOcrRunTiming });
  } catch (error) {
    recognitionFailed = true;
    console.error(error);
    const detail = detailedOcrError(error, mathOcrBackend);
    setOcrStatus(detail);
    showError(detail);
  } finally {
    mathOcrLoading = false;
    setOcrProcessing(false);
    if (recognitionFailed) {
      await disposeMathOcrPipeline();
      updateOcrInteractionAvailability();
      scheduleMathOcrPreload();
    } else {
      updateOcrInteractionAvailability();
    }
  }
}

async function tryImageOcrForCurrentResult() {
  if (!currentOcrResult?.preview || mathOcrLoading) return;
  try {
    const prepStart = ocrNow();
    const crop = await canvasFromDataUrl(currentOcrResult.preview);
    const cropMs = ocrNow() - prepStart;
    await recognizeImageFallbackCrop(
      crop,
      Number(currentOcrResult.page) || currentPage,
      currentOcrResult.kind || 'primary',
      currentOcrResult.preview,
      currentOcrResult.vectorAlternative || null,
      currentOcrResult.vectorAlternativeText || null,
      currentOcrResult.ratio,
      { startedAt: prepStart, cropMs }
    );
  } catch (error) {
    console.error(error);
    showError(t('The selected formula image could not be prepared for image OCR.', '无法为图像 OCR 准备当前框选公式。'));
  }
}

function addOcrToPageNote() {
  if (!pdfDoc || !currentOcrResult?.latex) return;
  // Save to the OCR result's own page. Do not move the reader just because a
  // note was added from a result that originated on another page.
  const targetPage = Math.min(Math.max(1, Number(currentOcrResult.page) || Number(currentPage) || 1), pdfDoc.numPages);
  const block = `${t('Math OCR', '公式 OCR')} · ${t(`Page ${targetPage}`, `第 ${targetPage} 页`)}\n\[\n${currentOcrResult.latex}\n\]`;
  const existing = notes[String(targetPage)] || '';
  notes[String(targetPage)] = `${existing}${existing.trim() ? '\n\n' : ''}${block}`;
  refreshVisiblePageNote(targetPage);
  persistDocumentState();
  autoOpenRightSection('note-section');
  setOcrStatus(t(`Added to page ${targetPage} note.`, `已添加到第 ${targetPage} 页注。`));
}

function clearOcrResultState() {
  if (currentOcrResult) pushUndo('ocr-result', t('Formula OCR result', '公式 OCR 结果'), currentOcrResult);
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
    const startedAt = ocrNow();
    const crop = cropSelectedFormula(sourceCanvas, layer, drag.rect);
    const cropMs = ocrNow() - startedAt;
    resetOcrBoxes();
    recognizeMathCrop(crop, page, kind, layer, drag.rect, { startedAt, cropMs });
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
      marker.addEventListener('click', () => { openRightSectionShortcut('annotations-section'); });
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
  if (type === 'margin') autoOpenRightSection('annotations-section');
}

async function appendAnnotationToPageNote(item) {
  if (!item || !pdfDoc) return;
  const page = Math.min(Math.max(1, Number(item.page) || currentPage || 1), pdfDoc.numPages);
  const position = `${Math.round((Number(item.ratio) || 0) * 100)}%`;
  const quoted = String(item.text || item.latex || '').split('\n').map((line) => `> ${line}`).join('\n');
  const meta = t(`Page ${page} · position ${position}`, `第 ${page} 页 · 位置 ${position}`);
  const block = `${meta}\n${quoted}${item.note?.trim() ? `\n\n${item.note.trim()}` : ''}`;
  const existing = notes[String(page)] || '';
  notes[String(page)] = `${existing}${existing.trim() ? '\n\n' : ''}${block}`;
  refreshVisiblePageNote(page);
  persistDocumentState();
  autoOpenRightSection('note-section');
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
    const jump = document.createElement('button'); jump.type='button'; jump.textContent=t('Jump','跳转'); jump.addEventListener('click',()=>goToMatchedLocation(item.page,item.ratio,item.text || item.latex || ''));
    const promote = document.createElement('button'); promote.type='button'; promote.textContent=t('Add to page note','加入页注'); promote.addEventListener('click',()=>appendAnnotationToPageNote(item));
    const remove = document.createElement('button'); remove.type='button'; remove.textContent=t('Delete','删除'); remove.addEventListener('click',()=>{ pushUndo('annotation', item.type === 'highlight' ? t('Highlight','高亮') : t('Margin note','页边注'), item); annotations=annotations.filter((ann)=>ann.id!==item.id); persistDocumentState(); renderAnnotationList(); rerenderVisibleAnnotations(); });
    actions.append(jump,promote,remove); row.append(actions); annotationList.append(row);
  }
  renderDocumentMapAnnotations();
  renderDocumentMetadata();
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
    autoOpenRightSection('selection-section');
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
  refreshVisiblePageNote(page);
  persistDocumentState();
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
    decorateReferenceLinks(layer, surface, pageNum);
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

function canvasHasVisibleContent(sourceCanvas) {
  if (!sourceCanvas?.width || !sourceCanvas?.height) return false;
  try {
    const sample = document.createElement('canvas');
    const size = 48;
    sample.width = size;
    sample.height = size;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    sampleCtx.drawImage(sourceCanvas, 0, 0, size, size);
    const data = sampleCtx.getImageData(0, 0, size, size).data;
    let minLum = 255;
    let maxLum = 0;
    let varied = 0;
    let firstLum = null;
    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.round((data[i] * 0.2126) + (data[i + 1] * 0.7152) + (data[i + 2] * 0.0722));
      minLum = Math.min(minLum, lum);
      maxLum = Math.max(maxLum, lum);
      if (firstLum === null) firstLum = lum;
      else if (Math.abs(lum - firstLum) > 8) varied += 1;
    }
    return (maxLum - minLum) > 18 && varied >= 3;
  } catch (error) {
    console.warn('MathReader canvas content check unavailable', error);
    return true;
  }
}

async function recoverInitialContinuousCanvasFromPrimary(pageNum, activeRecord) {
  if (!activeRecord?.canvas || !canvas || !primaryPageSurface) return false;
  const previousTop = primaryCanvasWrap?.scrollTop || 0;
  const previousLeft = primaryCanvasWrap?.scrollLeft || 0;
  try {
    await renderPage(pageNum, canvas, primaryCanvasWrap, 'primary');
    if (!canvasHasVisibleContent(canvas)) return false;
    const target = activeRecord.canvas;
    target.width = canvas.width;
    target.height = canvas.height;
    target.style.width = canvas.style.width;
    target.style.height = canvas.style.height;
    activeRecord.surface.style.width = canvas.style.width;
    activeRecord.surface.style.height = canvas.style.height;
    const ctx = target.getContext('2d', { alpha: false });
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(canvas, 0, 0);
    activeRecord.surface.classList.remove('is-placeholder', 'is-render-error');
    activeRecord.surface.removeAttribute('data-placeholder-label');
    activeRecord.rendered = true;
    activeRecord.failed = false;
    return canvasHasVisibleContent(target);
  } catch (error) {
    console.warn('MathReader initial continuous primary-render fallback failed', error);
    return false;
  } finally {
    if (primaryCanvasWrap) {
      primaryCanvasWrap.scrollTop = previousTop;
      primaryCanvasWrap.scrollLeft = previousLeft;
    }
  }
}

async function renderContinuousPage(pageNum, generation, { retry = true } = {}) {
  if (!pdfDoc || generation !== continuousGeneration) return false;
  const record = continuousPageNodes.get(pageNum);
  if (!record || record.rendering || record.rendered) return Boolean(record?.rendered);
  record.rendering = true;
  try {
    const page = await pdfDoc.getPage(pageNum);
    if (generation !== continuousGeneration) return false;
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
    if (generation !== continuousGeneration) return false;

    // The PDF canvas is the authoritative visible page. Make it visible as soon
    // as canvas painting succeeds; selectable text, links and annotations are
    // secondary overlays and must never be able to strand a successfully
    // rendered page behind the placeholder state.
    surface.classList.remove('is-placeholder', 'is-render-error');
    surface.removeAttribute('data-placeholder-label');
    surface.classList.toggle('ocr-mode', ocrMode);
    record.rendered = true;
    record.failed = false;

    try {
      await renderSelectableText(page, viewport, textLayer, surface, pageNum, 'continuous');
      renderAnnotationsForPage(pageNum, surface, 'continuous');
      ocrLayer.dataset.page = String(pageNum);
      ocrLayer.dataset.kind = 'continuous';
    } catch (overlayError) {
      // Keep the already-painted PDF visible even if a secondary overlay fails.
      console.warn('Continuous page overlay render failed', pageNum, overlayError);
    }
    return true;
  } catch (error) {
    console.warn('Continuous page render failed', pageNum, error);
    record.failed = true;
    if (!retry || generation !== continuousGeneration) {
      record.surface?.classList.add('is-render-error');
      if (record.surface) record.surface.dataset.placeholderLabel = t(`Page ${pageNum} could not be rendered`, `第 ${pageNum} 页无法渲染`);
      return false;
    }
  } finally {
    record.rendering = false;
  }
  // A cancelled/temporary first attempt should not strand the visible page as a
  // permanent placeholder. Retry once after yielding so the active page can
  // recover independently from neighboring lazy renders.
  await new Promise((resolve) => setTimeout(resolve, 0));
  return renderContinuousPage(pageNum, generation, { retry: false });
}

function continuousViewportAnchorOffset() {
  if (!primaryCanvasWrap) return 0;
  // Anchor display transitions to a stable reading point inside the viewport,
  // rather than to the scroll container's top edge. Keeping the same PDF point
  // under this screen position removes the small down/up "settling" motion that
  // otherwise appears when page geometry changes during zoom or fit operations.
  return Math.max(0, Math.min(140, primaryCanvasWrap.clientHeight * 0.22));
}

function captureContinuousAnchor() {
  if (readingFlow !== 'continuous' || !pdfDoc || !continuousPageNodes.size || !primaryCanvasWrap) return null;
  if (continuousRebuilding || displayTransitionActive) return continuousSavedAnchor ? { ...continuousSavedAnchor } : null;
  updateCurrentPageFromContinuousScroll();
  const record = continuousPageNodes.get(currentPage);
  if (!record?.frame) return null;
  const height = Math.max(1, record.frame.offsetHeight || record.surface?.offsetHeight || 1);
  const focusY = continuousViewportAnchorOffset();
  const documentY = primaryCanvasWrap.scrollTop + focusY;
  const local = documentY - record.frame.offsetTop;
  return { page: currentPage, ratio: Math.min(1, Math.max(0, local / height)) };
}

function restoreContinuousAnchor(anchor) {
  if (!primaryCanvasWrap || !anchor?.page) return false;
  const target = continuousPageNodes.get(Number(anchor.page))?.frame;
  if (!target) return false;
  const ratio = Math.min(1, Math.max(0, Number(anchor.ratio) || 0));
  const focusY = continuousViewportAnchorOffset();
  primaryCanvasWrap.scrollTop = Math.max(0, target.offsetTop + target.offsetHeight * ratio - focusY);
  return true;
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

async function buildInitialContinuousDocument({ anchor = null } = {}) {
  if (!pdfDoc || !continuousStack || !primaryCanvasWrap) return;
  const generation = ++continuousGeneration;

  // First load is deliberately deterministic. The workspace may have only just
  // become visible, so let layout settle before measuring the reader region.
  await nextFrame();
  await nextFrame();
  if (generation !== continuousGeneration || !pdfDoc) return;

  continuousLayoutWidth = Math.max(220, primaryCanvasWrap.clientWidth - 46);
  continuousLayoutHeight = Math.max(220, primaryCanvasWrap.clientHeight - 46);

  const pageMetrics = await Promise.all(Array.from({ length: pdfDoc.numPages }, async (_, index) => {
    const page = await pdfDoc.getPage(index + 1);
    const base = page.getViewport({ scale: 1 });
    const scale = continuousScale(base);
    return { width: base.width * scale, height: base.height * scale };
  }));
  if (generation !== continuousGeneration) return;

  const replacement = document.createDocumentFragment();
  const replacementNodes = new Map();
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum += 1) {
    const metric = pageMetrics[pageNum - 1];
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
    surface.style.width = `${metric.width}px`;
    surface.style.height = `${metric.height}px`;
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
    replacement.append(frame);
    replacementNodes.set(pageNum, { frame, surface, canvas: pageCanvas, textLayer, annotationLayer, ocrLayer, rendered: false, rendering: false });
  }

  // No lazy observer exists yet. Install the final geometry, restore the saved
  // location, and render the active page through one uncontested code path.
  clearContinuousObserver();
  continuousRebuilding = true;
  continuousStack.replaceChildren(replacement);
  continuousPageNodes = replacementNodes;

  const restoreAnchor = anchor || continuousSavedAnchor;
  const activePage = Math.min(Math.max(1, Number(restoreAnchor?.page) || currentPage), pdfDoc.numPages);
  if (restoreAnchor?.page && continuousPageNodes.has(Number(restoreAnchor.page))) {
    const target = continuousPageNodes.get(Number(restoreAnchor.page))?.frame;
    const ratio = Math.min(1, Math.max(0, Number(restoreAnchor.ratio) || 0));
    if (target) primaryCanvasWrap.scrollTop = Math.max(0, target.offsetTop + target.offsetHeight * ratio);
  } else {
    const target = continuousPageNodes.get(activePage)?.frame;
    if (target) primaryCanvasWrap.scrollTop = Math.max(0, target.offsetTop - 8);
  }

  // Allow anchor capture again, but keep observer/prefetch disabled until the
  // active page is visibly painted and the placeholder state is actually gone.
  continuousRebuilding = false;
  const ok = await renderContinuousPage(activePage, generation);
  if (generation !== continuousGeneration) return;
  const activeRecord = continuousPageNodes.get(activePage);
  let placeholderGone = Boolean(activeRecord?.surface && !activeRecord.surface.classList.contains('is-placeholder'));
  let canvasReady = Boolean(activeRecord?.canvas?.width && activeRecord?.canvas?.height);
  let canvasContent = canvasReady && canvasHasVisibleContent(activeRecord?.canvas);

  // A resolved PDF.js render task can still leave an effectively blank canvas
  // in the first continuous view on some PDFs/browser states. Single-page
  // rendering is an independent, proven path in MathReader, so use it as a
  // narrowly-scoped first-load recovery source rather than leaving a gray page.
  if (ok && activeRecord?.rendered && placeholderGone && canvasReady && !canvasContent) {
    console.warn('[MathReader] initial continuous: blank canvas detected; trying primary-render fallback', { generation, activePage });
    const recovered = await recoverInitialContinuousCanvasFromPrimary(activePage, activeRecord);
    if (generation !== continuousGeneration) return;
    placeholderGone = Boolean(activeRecord?.surface && !activeRecord.surface.classList.contains('is-placeholder'));
    canvasReady = Boolean(activeRecord?.canvas?.width && activeRecord?.canvas?.height);
    canvasContent = recovered && canvasHasVisibleContent(activeRecord?.canvas);
    console.info('[MathReader] initial continuous: fallback result', { generation, activePage, recovered, canvasContent });
  }

  if (!ok || !activeRecord?.rendered || !placeholderGone || !canvasReady || !canvasContent) {
    initialContinuousReady = false;
    activeRecord?.surface?.classList.add('is-render-error');
    if (activeRecord?.surface) activeRecord.surface.dataset.placeholderLabel = t(
      `Page ${activePage} could not be rendered`,
      `第 ${activePage} 页无法渲染`,
    );
    showError(t('Continuous reading could not render the current page.', '连续阅读无法渲染当前页面。'));
    console.error('[MathReader] initial continuous: active page verification failed', { generation, activePage });
    return;
  }

  // Only after the active page is definitely visible may lazy rendering begin.
  continuousObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const pageNum = Number(entry.target.dataset.page);
      if (pageNum && pageNum !== activePage) renderContinuousPage(pageNum, generation);
    }
  }, { root: primaryCanvasWrap, rootMargin: '1200px 0px', threshold: 0.01 });
  for (const [pageNum, record] of continuousPageNodes) {
    if (pageNum !== activePage) continuousObserver.observe(record.frame);
  }

  // Warm immediate neighbors after the active page is already on screen.
  const neighborPages = [];
  for (let n = Math.max(1, activePage - 2); n <= Math.min(pdfDoc.numPages, activePage + 2); n += 1) {
    if (n !== activePage) neighborPages.push(n);
  }
  Promise.all(neighborPages.map((n) => renderContinuousPage(n, generation))).catch((error) => {
    console.warn('[MathReader] initial continuous: neighbor warmup failed', error);
  });

  updateCurrentPageFromContinuousScroll();
  continuousSavedAnchor = captureContinuousAnchor() || restoreAnchor || continuousSavedAnchor;
  initialContinuousReady = true;
}

async function buildContinuousDocument({ restore = false, anchor = null } = {}) {
  if (!pdfDoc || !continuousStack) return;
  const generation = ++continuousGeneration;
  // Keep the old continuous document on screen while asynchronous PDF metadata
  // is fetched. Clearing it before this await lets the scroll container collapse
  // to zero height for a frame, which visibly flashes page 1 during +/- zoom.
  continuousLayoutWidth = Math.max(220, primaryCanvasWrap.clientWidth - 46);
  continuousLayoutHeight = Math.max(220, primaryCanvasWrap.clientHeight - 46);
  // Build exact page metrics while the old document stays visible. Using one
  // current-page estimate for every placeholder makes mixed-size pages change
  // height as they render, which then forces a second anchor correction and
  // produces the visible down-then-back nudge during +/- zoom.
  const pageMetrics = await Promise.all(Array.from({ length: pdfDoc.numPages }, async (_, index) => {
    const page = await pdfDoc.getPage(index + 1);
    const base = page.getViewport({ scale: 1 });
    const scale = continuousScale(base);
    return { width: base.width * scale, height: base.height * scale };
  }));
  if (generation !== continuousGeneration) return;
  const replacement = document.createDocumentFragment();
  const replacementNodes = new Map();
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum += 1) {
    const metric = pageMetrics[pageNum - 1];
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
    surface.style.width = `${metric.width}px`;
    surface.style.height = `${metric.height}px`;
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
    replacement.append(frame);
    replacementNodes.set(pageNum, { frame, surface, canvas: pageCanvas, textLayer, annotationLayer, ocrLayer, rendered: false, rendering: false });
  }
  // Swap the complete placeholder skeleton and restore its anchor as one visual
  // operation. Suppress the scroll-history listener during this swap so a
  // transient scrollTop=0 can never be interpreted or persisted as page 1.
  clearContinuousObserver();
  continuousRebuilding = true;
  continuousStack.replaceChildren(replacement);
  continuousPageNodes = replacementNodes;
  // Restore against the freshly-created placeholders immediately, before any
  // asynchronous page rendering. Without this, replacing the continuous stack
  // temporarily exposes scrollTop=0 and the user sees page 1 flash during zoom
  // or layout rebuilds even though the correct reading anchor is restored later.
  const restoreAnchor = anchor || continuousSavedAnchor;
  if (!restoreContinuousAnchor(restoreAnchor)) {
    const target = continuousPageNodes.get(currentPage)?.frame;
    if (target) primaryCanvasWrap.scrollTop = Math.max(0, target.offsetTop - 8);
  }

  // Render the restored/current page BEFORE installing IntersectionObserver.
  // Previously the observer could start rendering this same page first, set its
  // `rendering` flag, and make the explicit active-page call return immediately.
  // The result was a permanent-looking placeholder on initial continuous load.
  const anchorPage = Math.min(Math.max(1, Number(restoreAnchor?.page) || Number(anchor?.page) || currentPage), pdfDoc.numPages);
  await renderContinuousPage(anchorPage, generation);
  if (generation !== continuousGeneration) return;

  continuousObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const pageNum = Number(entry.target.dataset.page);
      if (pageNum) renderContinuousPage(pageNum, generation);
    }
  }, { root: primaryCanvasWrap, rootMargin: '1200px 0px', threshold: 0.01 });
  for (const { frame } of continuousPageNodes.values()) continuousObserver.observe(frame);

  requestAnimationFrame(() => { if (generation === continuousGeneration) continuousRebuilding = false; });
  // Do not perform a second anchor correction after rendering. Exact placeholder
  // metrics mean the first restore is already authoritative; a second restore is
  // precisely the visible nudge users reported during +/- zoom.
  continuousSavedAnchor = restoreAnchor ? { ...restoreAnchor } : (captureContinuousAnchor() || continuousSavedAnchor);

  const neighbors = [];
  for (let n = Math.max(1, anchorPage - 2); n <= Math.min(pdfDoc.numPages, anchorPage + 2); n += 1) {
    if (n !== anchorPage) neighbors.push(n);
  }
  Promise.all(neighbors.map((n) => renderContinuousPage(n, generation))).catch((error) => {
    console.warn('Continuous neighbor render failed', error);
  });
}

async function renderCurrentPage() {
  if (!pdfDoc) return;
  updateNavigationState();
  if (readingFlow === 'continuous') {
    try {
      const anchor = restoringSession ? continuousSavedAnchor : captureContinuousAnchor();
      if (restoringSession && !initialContinuousReady) await buildInitialContinuousDocument({ anchor });
      else await buildContinuousDocument({ restore: restoringSession || continuousScrollTop > 0, anchor });
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
        // Initial/open rendering already builds to the current measured width.
        // Avoid immediately rebuilding it again unless the browser actually
        // reports a width mismatch; that redundant second build can itself look
        // like a display jump even when the final anchor is correct.
        if (!continuousFitWidthMismatch()) break;
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
  // Initial PDF restoration and an in-progress continuous rebuild already own
  // the page geometry. ResizeObserver callbacks fired while the workspace is
  // being unhidden must not start a competing build and invalidate the active
  // page's generation token, otherwise the first page can remain a placeholder.
  if (!pdfDoc || zoomMode === 'custom' || fitWidthStabilizing || displayTransitionActive || restoringSession || continuousRebuilding) return;
  clearTimeout(readerWidthTimer);
  readerWidthTimer = setTimeout(async () => {
    if (!pdfDoc || zoomMode === 'custom' || fitWidthStabilizing || displayTransitionActive || restoringSession || continuousRebuilding) return;
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

function snapshotDisplayAnchor() {
  if (readingFlow !== 'continuous') return null;
  const live = captureContinuousAnchor();
  return live ? { ...live } : (continuousSavedAnchor ? { ...continuousSavedAnchor } : { page: currentPage, ratio: 0 });
}

async function runDisplayTransition(mutator, { delay = 0, renderReference = true } = {}) {
  if (!pdfDoc) { mutator?.(); return; }
  const serial = ++displayTransitionSerial;
  const anchor = snapshotDisplayAnchor();
  displayTransitionActive = true;
  continuousRebuilding = readingFlow === 'continuous';
  if (anchor) continuousSavedAnchor = { ...anchor };
  try {
    mutator?.();
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    if (serial !== displayTransitionSerial || !pdfDoc) return;
    if (readingFlow === 'continuous') await buildContinuousDocument({ restore: true, anchor });
    else await renderCurrentPage();
    if (renderReference) await renderReferencePage();
  } finally {
    if (serial === displayTransitionSerial) {
      requestAnimationFrame(() => {
        if (serial !== displayTransitionSerial) return;
        displayTransitionActive = false;
        continuousRebuilding = false;
        if (readingFlow === 'continuous') {
          continuousSavedAnchor = captureContinuousAnchor() || anchor || continuousSavedAnchor;
          continuousScrollTop = primaryCanvasWrap?.scrollTop || continuousScrollTop;
        }
      });
    }
  }
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
  const allEntries = readingBackStack.map((entry, index) => ({ entry, index })).reverse();
  const visibleLimit = readingTrailExpanded ? 10 : 3;
  const entries = allEntries.slice(0, visibleLimit);
  if (readingTrailToggle) {
    const hiddenCount = Math.max(0, Math.min(10, allEntries.length) - 3);
    readingTrailToggle.classList.toggle('is-hidden', allEntries.length <= 3);
    readingTrailToggle.textContent = readingTrailExpanded ? t('Less', '收起') : t(`More (${hiddenCount})`, `更多 (${hiddenCount})`);
    readingTrailToggle.setAttribute('aria-expanded', readingTrailExpanded ? 'true' : 'false');
  }
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
      try {
        await goToLocation(target.page, target.ratio, { contextLead: false });
        showNavigationLandingCue(target.page, target.ratio);
      } finally { suppressReadingHistory = false; }
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

function navigationTargetLeadPx() {
  // Text-derived targets are stored at the PDF text baseline. Leave a modest
  // amount of reading context above semantic jump targets so the referenced
  // line itself is fully visible rather than clipped just above the viewport.
  // Keep this pixel-based: the desired visual context should remain stable
  // across zoom levels, while the target ratio continues to identify the PDF
  // location.
  const height = Number(primaryCanvasWrap?.clientHeight) || 0;
  return Math.round(Math.min(96, Math.max(72, height ? height * 0.085 : 80)));
}

async function goToLocation(page, ratio = 0, { contextLead = true } = {}) {
  if (!pdfDoc) return;
  if (!suppressReadingHistory && generalPrefs.recordReadingTrail !== false) {
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
  const targetLead = contextLead ? navigationTargetLeadPx() : 0;
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
      primaryCanvasWrap.scrollTop = Math.max(0, surfaceTop + surfaceHeight * localRatio - targetLead);
      currentPage = next;
      updateNavigationState();
      continuousSavedAnchor = { page: next, ratio: localRatio };
    }
    persistDocumentState();
    return;
  }
  if (changed) await renderCurrentPage(); else updateNavigationState();
  const pageHeight = Math.max(1, primaryPageSurface?.offsetHeight || canvas?.getBoundingClientRect().height || 1);
  primaryCanvasWrap.scrollTop = Math.max(0, pageHeight * localRatio - targetLead);
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
  try {
    await goToLocation(target.page, target.ratio, { contextLead: false });
    showNavigationLandingCue(target.page, target.ratio);
  } finally { suppressReadingHistory = false; }
}

async function goToPage(page) {
  return goToLocation(page, 0, { contextLead: false });
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
      const acronymHeading = /^(?:[A-Z][A-Z0-9&/+\-]{1,9})(?:\s+[A-Z][A-Z0-9&/+\-]{1,9}){0,3}$/.test(text) && ratio >= 1.08;
      const styleHeading = ratio >= 1.18 && words.length <= 14 && !/[.;,]$/.test(text);
      if (!known && numberedDepth === null && !styleHeading && !acronymHeading) continue;
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
    button.dataset.page = String(entry.page);
    button.textContent = entry.title;
    button.title = t(`Detected heading · page ${entry.page}`, `自动检测标题 · 第 ${entry.page} 页`);
    button.addEventListener('click', () => { setDocumentMapSelectedNode(button); goToMatchedLocation(entry.page, Number.isFinite(Number(entry.ratio)) ? Number(entry.ratio) : 0, entry.title); });
    outlineList.append(button);
  }
  applyDocumentMapFilter(el('map-filter-structure')); updateDocumentMapCurrentLocation();
}

const STRUCTURE_LABEL_RE = /^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|conjecture|assumption|hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])(?:[.:)]|\s)/i;
const STRUCTURE_REFERENCE_RE = /\b(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Assumption|Hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])\b/gi;
const EQUATION_TAG_SYMBOL_CLASS = '*∗⋆★☆†‡※◇◆○●◦•△▲▽▼□■♢♦⊙⊗⊕⊖⊥∥';
const EQUATION_TAG_SYMBOL_PATTERN = `[${EQUATION_TAG_SYMBOL_CLASS.replace(/[\]\-^]/g, '\\$&')}]`;
const CLICKABLE_REFERENCE_RE = new RegExp(
  `\\b(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Section)\\s+[A-Z]?\\d+(?:\\.\\d+)*\\b|` +
  `\\(\\s*(?:\\d+(?:\\.\\d+)*|${EQUATION_TAG_SYMBOL_PATTERN}(?:\\s*${EQUATION_TAG_SYMBOL_PATTERN}){0,7})\\s*\\)|` +
  `\\[\\s*\\d{1,3}\\s*\\]`,
  'gi',
);
const GROUPED_BIBLIOGRAPHY_RE = /\[\s*\d{1,3}(?:\s*(?:,|;|[-–—])\s*\d{1,3})+\s*\]/g;

function normalizedReferenceLabel(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').replace(/\s*([()[\].,:])\s*/g, '$1').trim().toLocaleLowerCase();
}

function normalizeEquationTagCommands(value) {
  const commandMap = new Map([
    ['dagger', '†'], ['Dagger', '†'], ['ddagger', '‡'], ['Ddagger', '‡'],
    ['ast', '*'], ['star', '⋆'], ['bigstar', '★'], ['circ', '○'], ['bullet', '•'],
    ['triangle', '△'], ['blacktriangle', '▲'], ['triangledown', '▽'], ['blacktriangledown', '▼'],
    ['square', '□'], ['blacksquare', '■'], ['diamond', '◇'], ['blackdiamond', '◆'],
    ['odot', '⊙'], ['otimes', '⊗'], ['oplus', '⊕'], ['ominus', '⊖'], ['perp', '⊥'], ['parallel', '∥'],
  ]);
  return String(value || '').replace(/\\([A-Za-z]+)\b/g, (match, name) => commandMap.get(name) || match);
}

function normalizedEquationLabel(value) {
  let inner = normalizeEquationTagCommands(String(value || '').normalize('NFKC').trim());
  inner = inner.replace(/^\(\s*|\s*\)$/g, '').replace(/\s+/g, '');
  return `(${inner})`;
}

function isSymbolicEquationTagInner(inner) {
  const compact = String(inner || '').replace(/\s+/g, '');
  if (!compact || Array.from(compact).length > 8) return false;
  return Array.from(compact).every((char) => EQUATION_TAG_SYMBOL_CLASS.includes(char));
}

function isLikelyCalendarYearEquationLabel(value) {
  const label = normalizedEquationLabel(value);
  const inner = label.slice(1, -1);
  if (!/^\d{4}$/.test(inner)) return false;
  const year = Number(inner);
  return year >= 1800 && year <= 2099;
}

function isEquationLabelQuery(value) {
  const label = normalizedEquationLabel(value);
  const inner = label.slice(1, -1);
  if (isLikelyCalendarYearEquationLabel(label)) return false;
  return /^\d+(?:\.\d+)*$/.test(inner) || isSymbolicEquationTagInner(inner);
}

function equationLabelCandidatesInLine(text) {
  const value = normalizeEquationTagCommands(String(text || '').normalize('NFKC'));
  const out = [];
  const re = /\(\s*([^()]{1,32}?)\s*\)/g;
  let match;
  while ((match = re.exec(value))) {
    const rawInner = match[1];
    const compactInner = rawInner.replace(/\s+/g, '');
    if (!/^\d+(?:\.\d+)*$/.test(compactInner) && !isSymbolicEquationTagInner(rawInner)) continue;
    const label = normalizedEquationLabel(match[0]);
    if (isLikelyCalendarYearEquationLabel(label)) continue;
    out.push({ label, index: match.index, end: match.index + match[0].length });
  }
  return out;
}

function equationTargetScore(lineText, label, originPage, page, originRatio = null, candidateRatio = null) {
  const text = String(lineText || '').trim();
  const compact = text.replace(/\s+/g, '').normalize('NFKC');
  const pos = compact.lastIndexOf(label);
  let score = 0;
  if (pos >= 0 && pos + label.length >= compact.length - 1) score += 12;
  if (compact === label) score += 10;
  score += Math.min(10, (text.match(/[=≤≥≠≈∫∑∏√∂∇∞^_+−-]/g) || []).length * 1.5);
  if (/^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|section)\b/i.test(text)) score -= 20;
  if (/\b(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|section)\s+\d/i.test(text)) score -= 10;
  // Parenthesized equation numbers inside prose are references, not targets.
  // Prefer display-math/right-margin style lines and strongly demote prose
  // phrases that merely cite an equation.
  if (/\b(?:equation|eq\.?|see|from|by|using|satisfies|implies|according\s+to|as\s+in)\b/i.test(text)) score -= 18;
  if (page === originPage) score += 0.5;
  if (page === originPage && Number.isFinite(originRatio) && Number.isFinite(candidateRatio)) {
    const delta = Math.abs(candidateRatio - originRatio);
    if (delta < 0.018) score -= 1000;
    else if (delta < 0.05) score -= 12;
  }
  score -= Math.min(4, text.length / 160);
  return score;
}

function equationCandidateConfidence(line, label) {
  const text = String(line?.text || '').trim();
  if (!text || isLikelyCalendarYearEquationLabel(label)) return -Infinity;
  const compact = text.replace(/\s+/g, '').normalize('NFKC');
  const normalized = normalizedEquationLabel(label);
  const isOnlyTag = compact === normalized;
  const mathSignals = (text.match(/[=≤≥≠≈≡∈∉⊂⊆⊇→↔∫∑∏√∂∇∞^_+−×·/\-]/g) || []).length;
  const xStart = Number(line?.xStartRatio);
  const xEnd = Number(line?.xEndRatio);
  const nearRight = (Number.isFinite(xStart) && xStart >= 0.62) || (Number.isFinite(xEnd) && xEnd >= 0.78);
  const nearBottom = Number(line?.ratio) >= 0.90;
  const proseHeavy = text.length > 55 && mathSignals === 0;
  const isolatedRightTag = isOnlyTag && Number.isFinite(xStart) && xStart >= 0.62;
  if (isOnlyTag && nearBottom && !isolatedRightTag) return -Infinity;
  // A numeric parenthesis embedded in prose is a reference/date/section-like
  // token, not an equation target. Pure tag lines are accepted only when the
  // glyph geometry places them at the display-math right margin.
  if (mathSignals === 0 && !isolatedRightTag) return -Infinity;
  if (proseHeavy && !isolatedRightTag) return -Infinity;
  let confidence = equationTargetScore(text, normalized, null, 0, null, Number(line?.ratio));
  if (mathSignals >= 2) confidence += 5;
  else if (mathSignals === 1) confidence += 2;
  if (nearRight) confidence += 6;
  if (isOnlyTag && nearRight) confidence += 5;
  if (Number.isFinite(xStart) && xStart < 0.18 && mathSignals === 0) confidence -= 6;
  return confidence;
}

function isReliableEquationTargetLine(line, label) {
  return equationCandidateConfidence(line, label) >= 8;
}

async function buildEquationLabelIndex() {
  if (!pdfDoc) return new Map();
  if (equationLabelIndex) return equationLabelIndex;
  const index = new Map();
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    const lines = await pageTextLines(page);
    for (const line of lines) {
      for (const candidate of equationLabelCandidatesInLine(line.text)) {
        if (!isReliableEquationTargetLine(line, candidate.label)) continue;
        const list = index.get(candidate.label) || [];
        list.push({ page, ratio: line.ratio, text: line.text, xStartRatio: line.xStartRatio, xEndRatio: line.xEndRatio, confidence: equationCandidateConfidence(line, candidate.label) });
        index.set(candidate.label, list);
      }
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  equationLabelIndex = index;
  renderEquationIndex();
  return index;
}

function equationConfidenceTier(score) {
  if (score >= 20) return t('high confidence','高置信度');
  if (score >= 12) return t('medium confidence','中等置信度');
  return t('review','需核对');
}

let equationThumbObserver = null;
function observeEquationThumbnail(img, entry) {
  const load = async () => {
    if (img.dataset.loaded === '1' || !pdfDoc) return;
    img.dataset.loaded = '1';
    try {
      const snap = await referenceSnapshotData({ page: entry.page, ratio: entry.ratio }, 'equation');
      if (snap?.url && img.isConnected) img.src = snap.url;
    } catch (_) {}
  };
  if (!('IntersectionObserver' in window)) { void load(); return; }
  if (!equationThumbObserver) equationThumbObserver = new IntersectionObserver((items) => {
    for (const item of items) if (item.isIntersecting) { const fn = item.target._loadEquationThumb; if (fn) void fn(); equationThumbObserver.unobserve(item.target); }
  }, { root: equationIndex, rootMargin: '80px' });
  img._loadEquationThumb = load; equationThumbObserver.observe(img);
}

function renderEquationIndex() {
  if (!equationIndex || !equationIndexEmpty || !equationIndexCount) return;
  equationIndex.replaceChildren();
  if (!equationLabelIndex) {
    equationIndexCount.textContent = '0';
    equationIndexEmpty.classList.remove('is-hidden');
    equationIndexEmpty.textContent = t('Expand this section to prepare the equation-label index.', '展开此模块以生成公式编号索引。');
    return;
  }
  const rows = [];
  for (const [label, candidates] of equationLabelIndex.entries()) {
    let best = null;
    for (const candidate of candidates || []) {
      const score = Number.isFinite(candidate.confidence) ? candidate.confidence : equationCandidateConfidence(candidate, label);
      if (score < 8) continue;
      if (!best || score > best.score) best = { ...candidate, score };
    }
    if (best) rows.push({ label, ...best });
  }
  rows.sort((a,b) => a.page - b.page || a.ratio - b.ratio || a.label.localeCompare(b.label));
  equationIndexCount.textContent = String(rows.length);
  equationIndexEmpty.classList.toggle('is-hidden', rows.length > 0);
  if (!rows.length) equationIndexEmpty.textContent = t('No reliable equation labels detected.', '未检测到可靠的公式编号。');
  for (const entry of rows.slice(0, 500)) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'equation-index-item'; button.dataset.page=String(entry.page); button.dataset.confidence=entry.score >= 20 ? 'high' : entry.score >= 12 ? 'medium' : 'review';
    const img=document.createElement('img'); img.className='equation-index-thumb'; img.alt=''; img.loading='lazy'; observeEquationThumbnail(img,entry);
    const copy=document.createElement('span'); copy.className='equation-index-copy';
    const label = document.createElement('strong'); label.textContent = entry.label;
    const meta = document.createElement('span'); meta.textContent = `${t(`Page ${entry.page}`, `第 ${entry.page} 页`)} · ${equationConfidenceTier(entry.score)}`;
    copy.append(label,meta); button.append(img,copy);
    button.title = entry.text || entry.label;
    button.addEventListener('click', async () => { const target = { page: entry.page, ratio: Number(entry.ratio) || 0 }; await goToMatchedLocation(target.page, target.ratio, entry.label); updateBacklinksForTarget(entry.label, target); });
    equationIndex.append(button);
  }
  applyDocumentMapFilter(el('map-filter-equations')); updateDocumentMapCurrentLocation();
}

async function ensureEquationIndexRendered() {
  if (!pdfDoc) { renderEquationIndex(); return; }
  if (equationLabelIndex) { renderEquationIndex(); return; }
  if (equationIndexEmpty) { equationIndexEmpty.classList.remove('is-hidden'); equationIndexEmpty.textContent = t('Building equation-label index…', '正在生成公式编号索引……'); }
  try { await buildEquationLabelIndex(); }
  catch (error) { console.warn('Equation-label index build failed', error); if (equationIndexEmpty) equationIndexEmpty.textContent = t('The equation-label index could not be built.', '无法生成公式编号索引。'); }
}

async function findEquationLabelLocation(query, originPage = null, originRatio = null) {
  const label = normalizedEquationLabel(query);
  const index = await buildEquationLabelIndex();
  const candidates = index.get(label) || [];
  let best = null;
  for (const candidate of candidates) {
    // Never resolve an inline equation reference back to the exact glyphs
    // that were clicked. This is the key distinction between a reference
    // occurrence in prose and the actual equation tag.
    if (candidate.page === originPage && Number.isFinite(originRatio) && Number.isFinite(candidate.ratio)
        && Math.abs(candidate.ratio - originRatio) < 0.018) continue;
    const confidence = Number.isFinite(candidate.confidence) ? candidate.confidence : equationCandidateConfidence(candidate, label);
    if (confidence < 8) continue;
    const score = equationTargetScore(candidate.text, label, originPage, candidate.page, originRatio, candidate.ratio) + confidence * 0.2;
    if (!best || score > best.score) best = { ...candidate, score };
  }
  return best ? { page: best.page, ratio: best.ratio } : null;
}

async function pageTextLines(pageNum, sourceDoc = pdfDoc, cache = lineCache, flatCache = textCache) {
  if (cache.has(pageNum)) return cache.get(pageNum);
  const page = await sourceDoc.getPage(pageNum);
  const content = await page.getTextContent();
  const view = Array.isArray(page.view) ? page.view : [0, 0, 1, 1];
  const yMin = Number(view[1]) || 0;
  const yMax = Number(view[3]) || 1;
  const pageHeight = Math.max(1, yMax - yMin);
  const rows = [];
  for (const item of content.items || []) {
    const text = String(item.str || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const x = Number(item.transform?.[4]) || 0;
    const width = Math.max(0, Number(item.width) || 0);
    const y = Number(item.transform?.[5]) || 0;
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2.2);
    if (!row) { row = { y, items: [] }; rows.push(row); }
    row.items.push({ x, width, text });
  }
  rows.sort((a, b) => b.y - a.y);
  const pageWidth = Math.max(1, (Number(view[2]) || 1) - (Number(view[0]) || 0));
  const lines = rows.map((row) => {
    const items = row.items.sort((a, b) => a.x - b.x);
    const xMin = Math.min(...items.map((item) => item.x));
    const xMax = Math.max(...items.map((item) => item.x + (item.width || 0)));
    return {
      text: items.map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim(),
      ratio: Math.min(1, Math.max(0, (yMax - row.y) / pageHeight)),
      xStartRatio: Math.min(1, Math.max(0, (xMin - (Number(view[0]) || 0)) / pageWidth)),
      xEndRatio: Math.min(1, Math.max(0, (xMax - (Number(view[0]) || 0)) / pageWidth))
    };
  }).filter((line) => line.text);
  cache.set(pageNum, lines);
  if (flatCache && !flatCache.has(pageNum)) flatCache.set(pageNum, lines.map((line) => line.text).join(' ').replace(/\s+/g, ' ').trim());
  return lines;
}

function bibliographyMetadata(text) {
  const value = String(text || '');
  const doi = value.match(/\b10\.\d{4,9}\/[\-._;()/:A-Z0-9]+/i)?.[0]?.replace(/[.,;)]$/, '') || '';
  const arxiv = value.match(/\barXiv\s*:\s*([a-z.-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?/i)?.[1] || '';
  return { doi, arxiv };
}

async function buildStructureIndex({ force = false } = {}) {
  if (!pdfDoc || !structureIndex || structureIndexBuilding) return;
  if (!force && structureIndexVersion === STRUCTURE_INDEX_VERSION) {
    renderStructureIndex(); renderBibliographyIndex();
    return;
  }

  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const sourceTextCache = textCache;
  const sourceLineCache = lineCache;
  const token = ++structureIndexBuildToken;
  structureIndexBuilding = true;
  buildStructureIndexButton.disabled = true;
  structureEmpty.classList.remove('is-hidden');
  structureEmpty.textContent = t('Building mathematical structure in the background…', '正在后台生成数学结构索引……');
  if (bibliographyEmpty) { bibliographyEmpty.classList.remove('is-hidden'); bibliographyEmpty.textContent = t('Detecting bibliography entries…', '正在检测参考文献条目……'); }

  const nextEntries = [];
  const nextBibliography = [];
  const bibliographyCitationOccurrences = new Map();
  let bibliographyMode = false;
  let activeProofEntry = null;
  try {
    const maxPages = Math.min(sourceDoc.numPages, 800);
    for (let page = 1; page <= maxPages; page += 1) {
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== structureIndexBuildToken) return;
      const lines = await pageTextLines(page, sourceDoc, sourceLineCache, sourceTextCache);
      for (const line of lines) {
        const cleaned = String(line.text || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) continue;
        if (/^(?:references|bibliography)\s*$/i.test(cleaned)) { bibliographyMode = true; activeProofEntry = null; continue; }

        if (!bibliographyMode) {
          const bracketRe = /\[[^\]]{1,60}\]/g;
          let bracketMatch;
          while ((bracketMatch = bracketRe.exec(cleaned))) {
            const raw = bracketMatch[0];
            for (const number of groupedBibliographyMembers(raw)) {
              const list = bibliographyCitationOccurrences.get(number) || [];
              list.push({ page, ratio: line.ratio, raw, snippet: backlinkSnippet(cleaned, raw, bracketMatch.index), matchIndex: bracketMatch.index });
              bibliographyCitationOccurrences.set(number, list);
            }
          }
        }

        const structureMatch = cleaned.match(/(?:^|[.;:]\s*)((?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Assumption|Hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])(?:[.:)]|\s)[^.!?]{0,150})/i);
        if (structureMatch) {
          const title = structureMatch[1].replace(/\s+/g, ' ').trim().replace(/\s+([.:,)])/g, '$1');
          if (STRUCTURE_LABEL_RE.test(title)) {
            const label = title.match(STRUCTURE_REFERENCE_RE)?.[0] || title.slice(0, 80);
            const key = `${page}:${normalizedReferenceLabel(label)}`;
            if (!nextEntries.some((entry) => entry.key === key)) {
              const entry = { key, label, page, ratio: line.ratio, title: title.slice(0, 180), proofReferences: [], usedByProofs: [] };
              nextEntries.push(entry); activeProofEntry = entry;
            }
          }
        }

        const proofMatch = cleaned.match(/^Proof(?:\s+of\s+((?:Theorem|Lemma|Proposition|Corollary)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])))?\b[.:]?/i);
        if (proofMatch) {
          let target = null;
          if (proofMatch[1]) {
            const wanted = normalizedReferenceLabel(proofMatch[1]);
            target = [...nextEntries].reverse().find((entry) => normalizedReferenceLabel(entry.label) === wanted) || null;
          }
          if (!target) target = [...nextEntries].reverse().find((entry) => page - entry.page <= 1 && /^(?:theorem|lemma|proposition|corollary|claim)\b/i.test(entry.label || '')) || null;
          if (target && !target.proofPage) {
            target.proofPage = page; target.proofRatio = line.ratio; target.proofTitle = proofMatch[1] ? `Proof of ${proofMatch[1]}` : 'Proof';
            activeProofEntry = target;
          }
        }
        if (activeProofEntry && activeProofEntry.proofPage) {
          const references = cleaned.match(STRUCTURE_REFERENCE_RE) || [];
          for (const reference of references) {
            const normalizedRef = normalizedReferenceLabel(reference);
            if (!normalizedRef || normalizedRef === normalizedReferenceLabel(activeProofEntry.label)) continue;
            if (!activeProofEntry.proofReferences.includes(reference)) activeProofEntry.proofReferences.push(reference);
          }
        }

        if (activeProofEntry && /(?:\bQ\.?\s*E\.?\s*D\.?\b|[□∎])/.test(cleaned)) {
          activeProofEntry.proofEndPage = page; activeProofEntry.proofEndRatio = line.ratio; activeProofEntry = null;
        }

        if (bibliographyMode) {
          let bib = cleaned.match(/^\[(\d{1,3})\]\s+(.{3,})$/);
          if (!bib) bib = cleaned.match(/^(\d{1,3})[.)]\s+([A-Z][^=]{8,})$/);
          if (bib) {
            const number = Number(bib[1]);
            const body = bib[2].trim();
            const label = `[${number}]`;
            if (!nextBibliography.some((entry) => entry.number === number)) {
              const meta = bibliographyMetadata(body);
              nextBibliography.push({ number, label, page, ratio: line.ratio, title: body.slice(0, 240), citations: (bibliographyCitationOccurrences.get(number) || []).slice(0, 500), ...meta });
            }
          }
        }
      }
      if (page % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== structureIndexBuildToken) return;

    // Resolve proof dependencies into a directed graph and derive the reverse
    // relation from the same detected structure index.
    const structureByLabel = new Map(nextEntries.map((entry) => [normalizedReferenceLabel(entry.label), entry]));
    for (const owner of nextEntries) {
      const resolved = [];
      for (const reference of owner.proofReferences || []) {
        const target = structureByLabel.get(normalizedReferenceLabel(reference));
        if (!target || target === owner) continue;
        if (!resolved.some((item) => item.label === target.label)) resolved.push({ label: target.label, page: target.page, ratio: target.ratio });
        target.usedByProofs = target.usedByProofs || [];
        if (!target.usedByProofs.some((item) => item.label === owner.label)) target.usedByProofs.push({ label: owner.label, page: owner.proofPage || owner.page, ratio: owner.proofRatio || owner.ratio });
      }
      owner.proofUses = resolved.slice(0, 12);
    }

    // Corollary edges are intentionally conservative: only create them when
    // the corollary statement itself explicitly names an earlier structure.
    for (const entry of nextEntries) {
      if (!/^corollary\b/i.test(entry.label || '')) continue;
      const refs = String(entry.title || '').match(STRUCTURE_REFERENCE_RE) || [];
      for (const ref of refs) {
        const parent = structureByLabel.get(normalizedReferenceLabel(ref));
        if (!parent || parent === entry) continue;
        parent.corollaries = parent.corollaries || [];
        if (!parent.corollaries.some((item) => item.label === entry.label)) parent.corollaries.push({ label: entry.label, page: entry.page, ratio: entry.ratio });
        entry.derivedFrom = entry.derivedFrom || [];
        if (!entry.derivedFrom.some((item) => item.label === parent.label)) entry.derivedFrom.push({ label: parent.label, page: parent.page, ratio: parent.ratio });
      }
    }

    structureEntries = nextEntries.slice(0, 500);
    bibliographyEntries = nextBibliography.slice(0, 400);
    structureIndexVersion = STRUCTURE_INDEX_VERSION;
    renderStructureIndex(); renderBibliographyIndex(); rerenderReferenceLinks();
    persistDocumentState();
  } catch (error) {
    console.warn('Mathematical structure index build failed', error);
    if (pdfDoc === sourceDoc && currentFileKey === sourceKey && token === structureIndexBuildToken) {
      structureEmpty.classList.remove('is-hidden');
      structureEmpty.textContent = t('The mathematical structure index could not be built. Use Rebuild index to try again.', '无法生成数学结构索引。可使用“重新生成索引”再次尝试。');
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
      ? t('Building mathematical structure in the background…', '正在后台生成数学结构索引……')
      : t('The theorem, definition, and proof index is prepared automatically for this document.', '此文档的定理、定义与证明索引会自动生成。');
    return;
  }
  for (const entry of structureEntries) {
    const row = document.createElement('div'); row.className = 'structure-entry proof-graph-card'; row.dataset.page=String(entry.page);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'structure-item proof-graph-root'; button.dataset.page=String(entry.page);
    const strong = document.createElement('strong'); strong.textContent = entry.label || entry.title.replace(/([.:)].*)$/, '$1').slice(0, 80);
    const meta = document.createElement('span'); meta.textContent = t(`Page ${entry.page}`, `第 ${entry.page} 页`);
    button.append(strong, meta); button.title = entry.title;
    button.addEventListener('click', async () => { setDocumentMapSelectedNode(button); const q = entry.label || entry.title; const target = { page: entry.page, ratio: Number(entry.ratio) || 0 }; await goToMatchedLocation(target.page, target.ratio, q); updateBacklinksForTarget(q, target); });
    row.append(button);
    if (entry.proofPage) {
      const proof = document.createElement('button'); proof.type = 'button'; proof.className = 'structure-proof proof-graph-proof'; proof.dataset.page=String(entry.proofPage);
      proof.textContent = `${entry.proofTitle || t('Proof', '证明')} → ${t(`p. ${entry.proofPage}`, `第 ${entry.proofPage} 页`)}`;
      proof.title = entry.proofEndPage ? t(`Proof ends on page ${entry.proofEndPage}`, `证明结束于第 ${entry.proofEndPage} 页`) : '';
      proof.addEventListener('click', async () => { const q = entry.proofTitle || 'Proof'; const target = { page: entry.proofPage, ratio: Number(entry.proofRatio) || 0 }; await goToMatchedLocation(target.page, target.ratio, q); });
      row.append(proof);
    }
    const relations = [];
    if (Array.isArray(entry.proofUses) && entry.proofUses.length) relations.push({ prefix: t('Proof uses', '证明使用'), type:'uses', items: entry.proofUses });
    if (Array.isArray(entry.usedByProofs) && entry.usedByProofs.length) relations.push({ prefix: t('Used in proofs', '用于证明'), type:'used-in', items: entry.usedByProofs });
    if (Array.isArray(entry.corollaries) && entry.corollaries.length) relations.push({ prefix: t('Corollaries', '推论'), type:'corollary', items: entry.corollaries });
    if (Array.isArray(entry.derivedFrom) && entry.derivedFrom.length) relations.push({ prefix: t('Derived from', '源自'), type:'derived', items: entry.derivedFrom });
    if (relations.length) {
      const graphWrap=document.createElement('div'); graphWrap.className='proof-graph-relations';
      for (const relation of relations) {
        const graph = document.createElement('div'); graph.className = `structure-relations relation-${relation.type}`;
        const prefix = document.createElement('span'); prefix.className = 'structure-relations-label'; prefix.textContent = `${relation.prefix}:`; graph.append(prefix);
        for (const related of relation.items.slice(0, 8)) {
          const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'structure-relation-chip'; chip.textContent = related.label; chip.dataset.page=String(related.page);
          chip.addEventListener('click', async () => { await goToMatchedLocation(related.page, Number(related.ratio) || 0, related.label); updateBacklinksForTarget(related.label, { page: related.page, ratio: Number(related.ratio) || 0 }); });
          graph.append(chip);
        }
        graphWrap.append(graph);
      }
      row.append(graphWrap);
    }
    structureIndex.append(row);
  }
  applyDocumentMapFilter(el('map-filter-theorems')); updateDocumentMapCurrentLocation();
}

function renderBibliographyIndex() {
  if (!bibliographyIndex || !bibliographyEmpty || !bibliographyCount) return;
  bibliographyIndex.replaceChildren(); bibliographyCount.textContent = String(bibliographyEntries.length);
  bibliographyEmpty.classList.toggle('is-hidden', bibliographyEntries.length > 0);
  if (!bibliographyEntries.length) {
    bibliographyEmpty.textContent = structureIndexBuilding ? t('Detecting bibliography entries…', '正在检测参考文献条目……') : t('No numbered bibliography entries detected.', '未检测到编号参考文献条目。');
    return;
  }
  for (const entry of bibliographyEntries) {
    const row = document.createElement('div'); row.className = 'bibliography-item bibliography-smart-item'; row.dataset.page=String(entry.page);
    const main = document.createElement('button'); main.type='button'; main.className='bibliography-jump bibliography-expand'; main.setAttribute('aria-expanded', bibliographyExpanded.has(entry.number)?'true':'false');
    const label = document.createElement('strong'); label.textContent = entry.label;
    const copy=document.createElement('span'); copy.className='bibliography-copy';
    const text = document.createElement('span'); text.className='bibliography-title'; text.textContent = entry.title;
    const stats=document.createElement('span'); stats.className='bibliography-stats'; stats.textContent=bibliographyCitationSummary(entry);
    copy.append(text,stats); main.append(label,copy);
    main.addEventListener('click',()=>{ if (bibliographyExpanded.has(entry.number)) bibliographyExpanded.delete(entry.number); else bibliographyExpanded.add(entry.number); renderBibliographyIndex(); });
    const actions=document.createElement('div'); actions.className='bibliography-actions';
    const go=document.createElement('button'); go.type='button'; go.className='bibliography-go'; go.textContent=t('Go','跳转'); go.addEventListener('click',async()=>{ const target={page:entry.page,ratio:Number(entry.ratio)||0}; await goToMatchedLocation(target.page,target.ratio,entry.label); updateBacklinksForTarget(entry.label,target); }); actions.append(go);
    if (entry.doi || entry.arxiv) {
      const external = document.createElement('a'); external.className = 'bibliography-external'; external.target = '_blank'; external.rel = 'noopener noreferrer';
      if (entry.doi) { external.href = `https://doi.org/${entry.doi}`; external.textContent = 'DOI ↗'; }
      else { external.href = `https://arxiv.org/abs/${entry.arxiv}`; external.textContent = 'arXiv ↗'; }
      actions.append(external);
    }
    row.append(main,actions);
    if (bibliographyExpanded.has(entry.number)) {
      const cites=document.createElement('div'); cites.className='bibliography-citations';
      const citations=Array.isArray(entry.citations)?entry.citations:[];
      if (!citations.length) { const empty=document.createElement('div'); empty.className='bibliography-citations-empty'; empty.textContent=t('No in-text citations detected.','未检测到正文引用。'); cites.append(empty); }
      for (const [index,citation] of citations.entries()) {
        const button=document.createElement('button'); button.type='button'; button.className='bibliography-citation-item'; button.dataset.page=String(citation.page);
        const meta=document.createElement('strong'); meta.textContent=index===0?t(`First citation · p. ${citation.page}`,`首次引用 · 第 ${citation.page} 页`):t(`Citation ${index+1} · p. ${citation.page}`,`第 ${index+1} 处引用 · 第 ${citation.page} 页`);
        const snippet=document.createElement('span'); snippet.textContent=citation.snippet||citation.raw||''; button.append(meta,snippet);
        button.addEventListener('click',()=>goToMatchedLocation(citation.page,Number(citation.ratio)||0,citation.raw||entry.label)); cites.append(button);
      }
      row.append(cites);
    }
    bibliographyIndex.append(row);
  }
  applyDocumentMapFilter(el('map-filter-bibliography')); updateDocumentMapCurrentLocation();
}

function textLayerAggregate(layer) {
  let text = ''; const parts = [];
  for (const span of layer.querySelectorAll('span')) {
    const node = [...span.childNodes].find((child) => child.nodeType === Node.TEXT_NODE);
    if (!node || !node.nodeValue) continue;
    const start = text.length; text += node.nodeValue; const end = text.length;
    parts.push({ node, start, end }); text += ' ';
  }
  return { text, parts };
}

function rangeForAggregateMatch(parts, start, end) {
  const first = parts.find((part) => start >= part.start && start < part.end);
  const last = [...parts].reverse().find((part) => end > part.start && end <= part.end + 1);
  if (!first || !last) return null;
  const range = document.createRange();
  try {
    range.setStart(first.node, Math.max(0, Math.min(first.node.length, start - first.start)));
    range.setEnd(last.node, Math.max(0, Math.min(last.node.length, Math.min(end, last.end) - last.start)));
    return range;
  } catch (_) { return null; }
}

function ensureReferenceLinkLayer(surface) {
  let layer = surface.querySelector(':scope > .reference-link-layer');
  if (!layer) { layer = document.createElement('div'); layer.className = 'reference-link-layer'; surface.append(layer); }
  layer.replaceChildren(); return layer;
}

async function equationTargetAtLocation(query, pageNum, ratio) {
  if (!isEquationLabelQuery(query) || !Number.isFinite(Number(ratio))) return null;
  const label = normalizedEquationLabel(query);
  const index = await buildEquationLabelIndex();
  const candidates = index.get(label) || [];
  let best = null;
  for (const candidate of candidates) {
    if (Number(candidate.page) !== Number(pageNum)) continue;
    const delta = Math.abs((Number(candidate.ratio) || 0) - Number(ratio));
    if (delta > 0.035) continue;
    const confidence = Number.isFinite(candidate.confidence) ? candidate.confidence : equationCandidateConfidence(candidate, label);
    if (confidence < 8) continue;
    if (!best || delta < best.delta) best = { page: candidate.page, ratio: Number(candidate.ratio) || 0, delta };
  }
  return best ? { page: best.page, ratio: best.ratio } : null;
}

function appendReferenceLinkForRange(overlay, surface, range, query, pageNum) {
  if (!range) return;
  const surfaceRect = surface.getBoundingClientRect();
  for (const rect of range.getClientRects()) {
    if (rect.width < 2 || rect.height < 2) continue;
    const link = document.createElement('button'); link.type = 'button'; link.className = 'pdf-reference-link';
    link.style.left = `${rect.left - surfaceRect.left}px`; link.style.top = `${rect.top - surfaceRect.top}px`; link.style.width = `${rect.width}px`; link.style.height = `${rect.height}px`;
    link.title = t(`Follow ${query}`, `跳转到 ${query}`); link.setAttribute('aria-label', link.title);
    const sourceRatio = surfaceRect.height > 0
      ? Math.min(1, Math.max(0, ((rect.top - surfaceRect.top) + rect.height / 2) / surfaceRect.height))
      : null;
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideReferencePreview();
      // A right-margin equation tag is the destination itself, not a reference
      // that should resolve to another copy of the same label. Clicking it should
      // reveal backlinks for that equation without producing "No target found".
      const equationTarget = await equationTargetAtLocation(query, pageNum, sourceRatio);
      if (equationTarget) {
        await updateBacklinksForTarget(query, equationTarget);
        return;
      }
      await goToReferenceQuery(query, pageNum, sourceRatio);
    });
    attachReferencePreview(link, query, pageNum, sourceRatio);
    overlay.append(link);
  }
}

function groupedBibliographyMembers(raw) {
  const inner = String(raw || '').replace(/^\[|\]$/g, '');
  const members = [];
  const tokenRe = /\d{1,3}(?:\s*[-–—]\s*\d{1,3})?/g;
  let token;
  while ((token = tokenRe.exec(inner))) {
    const value = token[0];
    const rangeMatch = value.match(/^(\d{1,3})\s*[-–—]\s*(\d{1,3})$/);
    if (!rangeMatch) {
      const number = Number(value);
      if (number >= 1) members.push(number);
      continue;
    }
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (start < 1 || end < 1 || Math.abs(end - start) > 50) continue;
    const step = start <= end ? 1 : -1;
    for (let number = start; number !== end + step; number += step) members.push(number);
  }
  return [...new Set(members)].slice(0, 60);
}

function tocTitlePattern(title) {
  const clean = String(title || '').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 3) return null;
  const escape = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const numbered = clean.match(/^([A-Z]?\d+(?:\.\d+)*)(?:[.)])?\s+(.+)$/i);
  const source = numbered
    ? `${escape(numbered[1])}\\s*[.)]?\\s+${escape(numbered[2])}`
    : escape(clean);
  try { return new RegExp(source, 'ig'); } catch (_) { return null; }
}

function tocSectionNumber(title) {
  const clean = String(title || '').replace(/\s+/g, ' ').trim();
  return clean.match(/^(?:§\s*)?([A-Z]?\d+(?:\.\d+){1,4})(?:[.)])?(?:\s|$)/i)?.[1] || '';
}

async function findSectionNumberLocation(number, originPage = null) {
  if (!pdfDoc || !number) return null;
  const escaped = String(number).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingRe = new RegExp(`^(?:§\\s*)?${escaped}(?:[.)])?\\s+\\S`, 'i');
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    if (page === originPage) continue;
    const lines = await pageTextLines(page);
    for (const line of lines) {
      if (headingRe.test(String(line.text || '').trim())) return { page, ratio: Number(line.ratio) || 0 };
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return null;
}

async function resolveTocSectionNumber(number, targets, originPage = null) {
  const direct = (targets || []).find((target) => tocSectionNumber(target.title) === number && Number(target.page) !== Number(originPage));
  if (direct) return { page: direct.page, ratio: Number(direct.ratio) || 0 };
  const inferred = inferredOutline.find((entry) => tocSectionNumber(entry?.title) === number && Number(entry?.page) !== Number(originPage));
  if (inferred) return { page: inferred.page, ratio: Number(inferred.ratio) || 0 };
  return findSectionNumberLocation(number, originPage);
}

async function findTocTitleLocation(title, originPage = null) {
  if (!pdfDoc || !title) return null;
  const wanted = tocComparableTitle(title);
  if (!wanted) return null;
  let best = null;
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    if (Number(page) === Number(originPage)) continue;
    const lines = await pageTextLines(page);
    for (const line of lines) {
      const text = String(line.text || '').trim();
      if (!text || text.length > 240) continue;
      const score = tocTitleSimilarity(text, title);
      if (score < 0.86) continue;
      // Prefer heading-like lines over prose mentions of the same words.
      const number = tocSectionNumber(title);
      const exactNumber = number && tocSectionNumber(text) === number;
      const headingBonus = exactNumber ? 0.12 : (text.length <= String(title).length + 24 ? 0.04 : 0);
      const finalScore = score + headingBonus;
      if (!best || finalScore > best.score) best = { page, ratio: Number(line.ratio) || 0, score: finalScore };
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return best ? { page: best.page, ratio: best.ratio } : null;
}

async function resolveTocContentDestination(target, originPage) {
  if (!target) return null;
  const targetPage = Number(target.page) || 0;
  if (targetPage && targetPage !== Number(originPage)) {
    return { page: targetPage, ratio: Number(target.ratio) || 0 };
  }
  const number = tocSectionNumber(target.title);
  if (number) {
    const byNumber = await resolveTocSectionNumber(number, [], originPage);
    if (byNumber) return byNumber;
  }
  return findTocTitleLocation(target.title, originPage);
}


function tocLineCore(value) {
  let clean = String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  // Drop the visual dot leader and printed page number commonly found in TOCs.
  clean = clean.replace(/\s*(?:\.{2,}|…+|·{3,})\s*\d{1,4}\s*$/u, '').trim();
  // Some text layers lose the dot leader but retain the terminal page number.
  if (/^(?:§\s*)?[A-Z]?\d+(?:\.\d+){0,4}[.)]?\s+\S/i.test(clean) && /\s\d{1,4}$/.test(clean)) {
    clean = clean.replace(/\s+\d{1,4}\s*$/, '').trim();
  }
  return clean;
}

function tocComparableTitle(value) {
  return normalizeSearchValue(tocLineCore(value), false)
    .replace(/^(?:§\s*)?[a-z]?\d+(?:\.\d+){0,4}[.)]?\s*/i, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tocTitleSimilarity(a, b) {
  const aa = tocComparableTitle(a);
  const bb = tocComparableTitle(b);
  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if ((aa.includes(bb) || bb.includes(aa)) && Math.min(aa.length, bb.length) >= 8) {
    return Math.min(0.97, Math.min(aa.length, bb.length) / Math.max(aa.length, bb.length) + 0.12);
  }
  const aTokens = new Set(aa.split(/\s+/).filter((token) => token.length > 1));
  const bTokens = new Set(bb.split(/\s+/).filter((token) => token.length > 1));
  let overlap = 0;
  for (const token of aTokens) if (bTokens.has(token)) overlap += 1;
  const union = new Set([...aTokens, ...bTokens]).size || 1;
  const jaccard = overlap / union;
  const maxLen = Math.max(aa.length, bb.length, 1);
  const maxDistance = Math.ceil(maxLen * 0.35);
  const distance = levenshteinDistance(aa, bb, maxDistance);
  const edit = distance > maxDistance ? 0 : Math.max(0, 1 - distance / maxLen);
  return Math.max(jaccard, edit * 0.9 + jaccard * 0.1);
}

function tocStructureMatchScore(lineText, targetTitle) {
  const line = tocLineCore(lineText);
  const lineNumber = tocSectionNumber(line);
  const targetNumber = tocSectionNumber(targetTitle);
  if (lineNumber && targetNumber && lineNumber !== targetNumber) return 0;
  const titleScore = tocTitleSimilarity(line, targetTitle);
  if (lineNumber && targetNumber && lineNumber === targetNumber) {
    // Exact section numbering is authoritative; title similarity distinguishes
    // a real TOC entry from incidental mentions of the same section number.
    return Math.max(0.82, 0.78 + titleScore * 0.22);
  }
  return titleScore;
}

async function compareTocPageWithStructure(pageNum, targets) {
  const lines = await pageTextLines(pageNum);
  const matches = [];
  const usedTargets = new Set();
  for (const line of lines) {
    const core = tocLineCore(line.text);
    if (!core || core.length < 3) continue;
    let best = null;
    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i];
      if (!target || Number(target.page) === Number(pageNum) || usedTargets.has(i)) continue;
      const score = tocStructureMatchScore(core, target.title);
      const hasExactNumber = Boolean(tocSectionNumber(core) && tocSectionNumber(core) === tocSectionNumber(target.title));
      const threshold = hasExactNumber ? 0.80 : 0.84;
      if (score < threshold) continue;
      if (!best || score > best.score) best = { line, target, targetIndex: i, score, hasExactNumber };
    }
    if (best) {
      matches.push(best);
      usedTargets.add(best.targetIndex);
    }
  }
  // Three distinct structural matches are enough to classify a page as a TOC.
  // Requiring distinct nodes prevents a body page from qualifying because one
  // heading is repeated in prose.
  const average = matches.length ? matches.reduce((sum, item) => sum + item.score, 0) / matches.length : 0;
  return { matches, isToc: matches.length >= 3 && average >= 0.82, average };
}

function tocLinePattern(lineText) {
  const core = tocLineCore(lineText);
  if (!core) return null;
  const escape = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokens = core.split(/\s+/).filter(Boolean).slice(0, 24);
  if (!tokens.length) return null;
  const source = tokens.map(escape).join('\\s+');
  try { return new RegExp(source, 'ig'); } catch (_) { return null; }
}

const HEADING_ALIAS_STOPWORDS = new Set(['a','an','the','of','and','or','in','on','for','to','with','by','from','as','at']);

function headingAliasForTitle(title) {
  const clean = tocLineCore(title).replace(/^(?:§\s*)?[A-Z]?\d+(?:\.\d+){0,4}[.)]?\s*/i, '').trim();
  if (!clean) return '';
  if (/^[A-Z][A-Z0-9]{1,7}$/.test(clean)) return clean;
  const words = (clean.match(/[A-Za-z][A-Za-z'-]*/g) || []).filter((word) => !HEADING_ALIAS_STOPWORDS.has(word.toLowerCase()));
  if (words.length < 2 || words.length > 7) return '';
  const alias = words.map((word) => word[0].toUpperCase()).join('');
  return /^[A-Z]{2,7}$/.test(alias) ? alias : '';
}

function unambiguousHeadingAliases(targets) {
  const buckets = new Map();
  for (const target of targets || []) {
    const alias = headingAliasForTitle(target?.title);
    if (!alias) continue;
    const list = buckets.get(alias) || [];
    list.push(target);
    buckets.set(alias, list);
  }
  const result = new Map();
  for (const [alias, list] of buckets) {
    const unique = list.filter((item, index, arr) => arr.findIndex((other) => Number(other.page) === Number(item.page) && String(other.title) === String(item.title)) === index);
    if (unique.length === 1) result.set(alias, unique[0]);
  }
  return result;
}

function appendHeadingAliasLinks(mapped, overlay, surface, pageNum, targets) {
  const aliases = unambiguousHeadingAliases(targets);
  for (const [alias, target] of aliases) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    let match;
    while ((match = re.exec(mapped.text))) {
      if (Number(target.page) === Number(pageNum) && normalizeSearchValue(target.title, false) === normalizeSearchValue(alias, false)) continue;
      const range = rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
      appendReferenceLinkForRange(overlay, surface, range, alias, pageNum);
    }
  }
}

async function getTocOutlineTargets() {
  if (!pdfDoc) return [];
  if (Array.isArray(tocOutlineTargets)) return tocOutlineTargets;
  const targets = [];
  const seen = new Set();
  const addTarget = (title, page, ratio) => {
    const clean = String(title || '').replace(/\s+/g, ' ').trim();
    if (!clean || !Number(page)) return;
    const number = tocSectionNumber(clean);
    const key = number ? `n:${number}` : `t:${normalizeSearchValue(clean, false)}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ title: clean, page: Number(page), ratio: Number(ratio) || 0 });
  };
  try {
    const outline = await pdfDoc.getOutline();
    const flat = flattenOutline(outline);
    for (const { item } of flat) {
      const title = String(item?.title || '').replace(/\s+/g, ' ').trim();
      if (!title) continue;
      const location = await resolveOutlineDestination(item.dest);
      if (location) addTarget(title, location.page, location.ratio);
    }
  } catch (_) {}
  // Merge any detected structure instead of letting a partial embedded outline
  // suppress valid subsection targets.
  for (const entry of inferredOutline || []) addTarget(entry?.title, entry?.page, entry?.ratio);
  if (targets.length) tocOutlineTargets = targets;
  return targets;
}

async function decorateTocLinks(mapped, overlay, surface, pageNum, serial) {
  if (!mapped?.text || !pdfDoc) return;
  const targets = await getTocOutlineTargets();
  if (!targets.length || overlay.dataset.tocSerial !== String(serial) || !overlay.isConnected) return;

  const comparison = await compareTocPageWithStructure(pageNum, targets);
  if (overlay.dataset.tocSerial !== String(serial) || !overlay.isConnected) return;
  const head = mapped.text.slice(0, 700).replace(/\s+/g, ' ');
  const hasTocHeading = /(?:table\s+of\s+contents|\bcontents\b|目录)/i.test(head);
  if (!hasTocHeading && !comparison.isToc) return;

  const seen = new Set();
  let linked = 0;
  const surfaceRect = surface.getBoundingClientRect();

  const addLinkForRange = (range, target, label) => {
    if (!range) return false;
    let added = false;
    for (const rect of range.getClientRects()) {
      if (rect.width < 6 || rect.height < 2) continue;
      const key = `${Math.round(rect.left)}:${Math.round(rect.top)}:${Math.round(rect.width)}:${target.page}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'pdf-reference-link pdf-toc-link';
      link.style.left = `${rect.left - surfaceRect.left}px`;
      link.style.top = `${rect.top - surfaceRect.top}px`;
      link.style.width = `${rect.width}px`;
      link.style.height = `${rect.height}px`;
      link.title = t(`Go to ${label || target.title}`, `跳转到 ${label || target.title}`);
      link.setAttribute('aria-label', link.title);
      attachReferencePreview(link, target.title || label || '', pageNum, null);
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        hideReferencePreview();
        const destination = await resolveTocContentDestination(target, pageNum);
        if (!destination) return;
        await goToMatchedLocation(destination.page, Number(destination.ratio) || 0, target.title || label || '');
      });
      overlay.append(link);
      added = true;
    }
    return added;
  };

  // Primary path: compare each visual TOC line against the already-detected
  // document structure. This makes TOC recognition a structure-alignment
  // problem rather than another independent heading parser.
  for (const match of comparison.matches) {
    const patterns = [tocLinePattern(match.line.text), tocTitlePattern(match.target.title)].filter(Boolean);
    let added = false;
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let found;
      while ((found = pattern.exec(mapped.text))) {
        const range = rangeForAggregateMatch(mapped.parts, found.index, found.index + found[0].length);
        if (addLinkForRange(range, match.target, match.line.text)) { added = true; break; }
      }
      if (added) break;
    }
    // PDF.js may split the title beyond recoverable text matching. In that
    // case, the section number remains a stable visual anchor for the line.
    if (!added) {
      const number = tocSectionNumber(match.line.text) || tocSectionNumber(match.target.title);
      if (number) {
        const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const numberRe = new RegExp(`\\b${escaped}\\b`, 'g');
        let found;
        while ((found = numberRe.exec(mapped.text))) {
          const range = rangeForAggregateMatch(mapped.parts, found.index, found.index + found[0].length);
          if (!range) continue;
          const rect = [...range.getClientRects()].find((candidate) => (candidate.left - surfaceRect.left) < surfaceRect.width * 0.42);
          if (!rect) continue;
          if (addLinkForRange(range, match.target, match.line.text)) { added = true; break; }
        }
      }
    }
    if (added) linked += 1;
  }

  // Secondary exact-title pass fills entries that were not part of the fuzzy
  // structure comparison but still match an authoritative outline node.
  for (const target of targets) {
    const pattern = tocTitlePattern(target.title);
    if (!pattern) continue;
    let found;
    while ((found = pattern.exec(mapped.text))) {
      const range = rangeForAggregateMatch(mapped.parts, found.index, found.index + found[0].length);
      if (addLinkForRange(range, target, target.title)) { linked += 1; break; }
    }
  }

  // Last-resort section-number links remain useful when PDF text segmentation
  // destroys the title entirely. Destination resolution still consults the
  // merged structure before searching the document.
  const numberedSeen = new Set();
  const subsectionRe = /\b([A-Z]?\d+(?:\.\d+){1,4})\b/gi;
  let numberMatch;
  while ((numberMatch = subsectionRe.exec(mapped.text))) {
    const number = numberMatch[1];
    if (numberedSeen.has(number)) continue;
    const range = rangeForAggregateMatch(mapped.parts, numberMatch.index, numberMatch.index + numberMatch[0].length);
    if (!range) continue;
    const rect = [...range.getClientRects()].find((candidate) => candidate.width >= 6 && candidate.height >= 2 && (candidate.left - surfaceRect.left) < surfaceRect.width * 0.42);
    if (!rect) continue;
    numberedSeen.add(number);
    const target = await resolveTocSectionNumber(number, targets, pageNum);
    if (!target) continue;
    const synthetic = { title: number, page: target.page, ratio: target.ratio };
    if (addLinkForRange(range, synthetic, number)) linked += 1;
  }

  if (linked) overlay.dataset.tocLinked = String(linked);
  overlay.dataset.tocStructureMatches = String(comparison.matches.length);
}

function decorateReferenceLinks(textLayer, surface, pageNum) {
  if (!textLayer || !surface) return;
  const overlay = ensureReferenceLinkLayer(surface);
  const mapped = textLayerAggregate(textLayer); if (!mapped.text) return;
  const tocSerial = ++tocDecorationSerial;
  overlay.dataset.tocSerial = String(tocSerial);

  // Grouped citations such as [1, 7] or [1-3, 8] need one target per
  // bibliography member. Prefer the number's own glyph range when it is
  // explicitly present; generated range members share the group's range.
  GROUPED_BIBLIOGRAPHY_RE.lastIndex = 0;
  let grouped;
  while ((grouped = GROUPED_BIBLIOGRAPHY_RE.exec(mapped.text))) {
    const raw = grouped[0];
    const explicitNumbers = [];
    const numberRe = /\d{1,3}/g;
    let numberMatch;
    while ((numberMatch = numberRe.exec(raw))) {
      explicitNumbers.push({ number: Number(numberMatch[0]), start: grouped.index + numberMatch.index, end: grouped.index + numberMatch.index + numberMatch[0].length });
    }
    const members = groupedBibliographyMembers(raw);
    const explicitSet = new Set(explicitNumbers.map((item) => item.number));
    for (const item of explicitNumbers) {
      const range = rangeForAggregateMatch(mapped.parts, item.start, item.end);
      appendReferenceLinkForRange(overlay, surface, range, `[${item.number}]`, pageNum);
    }
    const generated = members.filter((number) => !explicitSet.has(number));
    if (generated.length) {
      const groupRange = rangeForAggregateMatch(mapped.parts, grouped.index, grouped.index + raw.length);
      for (const number of generated) appendReferenceLinkForRange(overlay, surface, groupRange, `[${number}]`, pageNum);
    }
  }

  CLICKABLE_REFERENCE_RE.lastIndex = 0;
  let match;
  while ((match = CLICKABLE_REFERENCE_RE.exec(mapped.text))) {
    const query = match[0].replace(/\s+/g, ' ').trim();
    if (/^\(/.test(query) && isLikelyCalendarYearEquationLabel(query)) continue;
    const range = rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
    appendReferenceLinkForRange(overlay, surface, range, query, pageNum);
  }
  getTocOutlineTargets().then((targets) => appendHeadingAliasLinks(mapped, overlay, surface, pageNum, targets)).catch(() => {});
  decorateTocLinks(mapped, overlay, surface, pageNum, tocSerial).catch((error) => console.warn('MathReader TOC links unavailable for page', pageNum, error));
}

function rerenderReferenceLinks() {
  if (primaryTextLayer && primaryPageSurface && currentPage) decorateReferenceLinks(primaryTextLayer, primaryPageSurface, currentPage);
  if (referenceTextLayer && referencePageSurface && pinnedPage) decorateReferenceLinks(referenceTextLayer, referencePageSurface, pinnedPage);
  for (const [page, record] of continuousPageNodes) if (record?.rendered) decorateReferenceLinks(record.textLayer, record.surface, page);
}

async function findReferenceTextLocation(query, originPage = null) {
  const wanted = normalizeSearchValue(query, false);
  let best = null;
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    const lines = await pageTextLines(page);
    for (const line of lines) {
      if (!normalizeSearchValue(line.text, false).includes(wanted)) continue;
      let score = page === originPage ? -2 : 0;
      score += Math.max(0, 3 - line.text.length / 100);
      if (!best || score > best.score) best = { page, ratio: line.ratio, score };
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return best;
}


function backlinkSnippet(text, query, explicitIndex = null) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  const q = String(query || '').replace(/\s+/g, ' ').trim();
  const lower = value.toLocaleLowerCase();
  let idx = Number.isFinite(Number(explicitIndex)) ? Number(explicitIndex) : (q ? lower.indexOf(q.toLocaleLowerCase()) : -1);
  if (idx < 0) idx = 0;
  const qEnd = Math.min(value.length, idx + Math.max(1, q.length));
  const leftSlice = value.slice(Math.max(0, idx - 240), idx);
  const leftBoundary = Math.max(leftSlice.lastIndexOf('. '), leftSlice.lastIndexOf('? '), leftSlice.lastIndexOf('! '), leftSlice.lastIndexOf('; '));
  const start = leftBoundary >= 0 ? Math.max(0, idx - 240 + leftBoundary + 2) : Math.max(0, idx - 105);
  const rightSlice = value.slice(qEnd, Math.min(value.length, qEnd + 280));
  const boundaries = ['. ', '? ', '! ', '; '].map((token) => rightSlice.indexOf(token)).filter((v) => v >= 0);
  const rightBoundary = boundaries.length ? Math.min(...boundaries) + 1 : -1;
  const finish = rightBoundary >= 0 ? Math.min(value.length, qEnd + rightBoundary) : Math.min(value.length, start + 250);
  const snippet = value.slice(start, finish).trim();
  return `${start > 0 ? '…' : ''}${snippet}${finish < value.length ? '…' : ''}`;
}

function proofContextForLocation(page, ratio) {
  const p = Number(page);
  const r = Number(ratio) || 0;
  for (const entry of structureEntries || []) {
    if (!entry?.proofPage) continue;
    const startPage = Number(entry.proofPage);
    const endPage = Number(entry.proofEndPage || entry.proofPage);
    if (p < startPage || p > endPage) continue;
    if (p === startPage && r + 0.01 < (Number(entry.proofRatio) || 0)) continue;
    if (p === endPage && entry.proofEndRatio != null && r - 0.01 > Number(entry.proofEndRatio)) continue;
    return entry.label || entry.title || '';
  }
  return '';
}

function renderBacklinks() {
  if (!backlinksList || !backlinksEmpty || !backlinksCount || !backlinksContext) return;
  backlinksList.replaceChildren();
  const visible=backlinkEntries;
  backlinksCount.textContent = String(backlinkEntries.length);
  backlinksContext.textContent = backlinkContext?.label ? t(`References to ${backlinkContext.label}`, `引用 ${backlinkContext.label} 的位置`) : '';
  backlinksEmpty.classList.toggle('is-hidden', visible.length > 0);
  backlinksEmpty.textContent=t('Follow a reference to see backlinks.','跟随引用后可在这里查看反向引用。');
  for (const entry of visible.slice(0, 120)) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'backlink-item';
    const meta = document.createElement('span'); meta.className = 'backlink-meta';
    const proofOwner = entry.proofOwner || proofContextForLocation(entry.page, entry.ratio);
    meta.textContent = proofOwner ? t(`Page ${entry.page} · proof of ${proofOwner}`, `第 ${entry.page} 页 · ${proofOwner} 的证明`) : t(`Page ${entry.page}`, `第 ${entry.page} 页`);
    const snippet = document.createElement('span'); snippet.className = 'backlink-snippet'; snippet.textContent = entry.snippet || entry.text || '';
    button.append(meta, snippet);
    button.addEventListener('click', () => {
      if (entry.searchMatch && entry.matchText) goToSearchMatch(entry.searchMatch, entry.matchText);
      else goToMatchedLocation(entry.page, Number(entry.ratio) || 0, entry.matchText || backlinkContext?.label || '');
    });
    backlinksList.append(button);
  }
}

async function collectBacklinks(query, target) {
  if (!pdfDoc || !query || !target) return [];
  const results = [];
  const seen = new Set();
  const add = (page, ratio, text, matchText = query, extra = {}) => {
    if (Number(page) === Number(target.page) && Math.abs((Number(ratio)||0) - (Number(target.ratio)||0)) < 0.025) return;
    const occurrenceKey = Number.isFinite(Number(extra.matchIndex)) ? `:${Number(extra.matchIndex)}` : '';
    const key = `${page}:${Math.round((Number(ratio)||0)*10000)}:${String(text).slice(0,80)}${occurrenceKey}`;
    if (seen.has(key)) return; seen.add(key);
    const owner=proofContextForLocation(page, ratio);
    results.push({ page, ratio:Number(ratio)||0, text, snippet:extra.snippet || backlinkSnippet(text, matchText || query, extra.matchIndex), matchText, proofOwner: owner, kind: extra.kind || (owner ? 'proof' : 'prose'), ...extra });
  };
  const normalized = normalizedReferenceLabel(query);
  const eq = isEquationLabelQuery(query) ? normalizedEquationLabel(query) : null;
  const bibNumber = /^\[/.test(query) ? Number(String(query).replace(/\D/g,'')) : null;
  const structureLike = /^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim)\b/i.test(query);
  const acronym = /^[A-Z][A-Z0-9]{1,7}$/.test(String(query).trim()) ? String(query).trim() : null;
  const structureTarget = structureEntries.find((entry) => Number(entry.page) === Number(target.page) && Math.abs((Number(entry.ratio)||0) - (Number(target.ratio)||0)) < 0.04) || null;
  const structureAlias = structureTarget ? headingAliasForTitle(structureTarget.title || structureTarget.label || '') : '';
  const structureLabel = structureTarget?.label || '';
  // Bibliography citations already have an authoritative occurrence list built
  // while scanning body text before the References/Bibliography section. Reuse
  // it here instead of rescanning every page, which could mistakenly count the
  // bibliography definition itself as a backlink to its own entry.
  if (bibNumber) {
    const bib = bibliographyEntries.find((entry) => Number(entry.number) === Number(bibNumber));
    for (const citation of bib?.citations || []) {
      add(citation.page, citation.ratio, citation.raw || query, citation.raw || query, {
        matchIndex: citation.matchIndex,
        snippet: citation.snippet,
        kind: 'bibliography'
      });
    }
    return results.sort((a,b)=>a.page-b.page || a.ratio-b.ratio || (Number(a.matchIndex)||0)-(Number(b.matchIndex)||0));
  }

  for (let page=1; page<=pdfDoc.numPages; page+=1) {
    const lines = await pageTextLines(page);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const text = String(line.text || '');
      const contextText = lines.slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 2)).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim();
      if (eq) {
        for (const c of equationLabelCandidatesInLine(text)) if (c.label === eq) {
          const contextIndex = Math.max(0, contextText.indexOf(text)) + c.index;
          add(page, line.ratio, text, eq, { matchIndex: c.index, snippet: backlinkSnippet(contextText, eq, contextIndex), kind: 'equation' });
        }
        continue;
      }
      if (structureLike || structureTarget) {
        const normalizedText = normalizedReferenceLabel(text);
        const literalHit = structureLike && normalizedText.includes(normalized);
        const labelHit = structureLabel && normalizedText.includes(normalizedReferenceLabel(structureLabel));
        const aliasHit = structureAlias && new RegExp(`(?:^|\\W)${structureAlias}(?:$|\\W)`).test(text);
        if (literalHit || labelHit || aliasHit) {
          const hitText = literalHit ? query : (aliasHit ? structureAlias : structureLabel || query);
          add(page, line.ratio, text, hitText, { snippet: backlinkSnippet(contextText, hitText) });
        }
        continue;
      }
      if (acronym && new RegExp(`(?:^|\\W)${acronym}(?:$|\\W)`).test(text)) add(page, line.ratio, text, acronym, { snippet: backlinkSnippet(contextText, acronym) });
    }
    if (page % 20 === 0) await new Promise((resolve)=>setTimeout(resolve,0));
  }
  return results.sort((a,b)=>a.page-b.page || a.ratio-b.ratio || (Number(a.matchIndex)||0)-(Number(b.matchIndex)||0));
}

async function updateBacklinksForTarget(query, target) {
  backlinkContext = { label:String(query || '').replace(/\s+/g,' ').trim(), page:target.page, ratio:Number(target.ratio)||0 };
  backlinkEntries = [];
  renderBacklinks();
  try { backlinkEntries = await collectBacklinks(query, target); } catch (error) { console.warn('Backlink indexing unavailable', error); backlinkEntries = []; }
  renderBacklinks();
  autoOpenRightSection('backlinks-section');
}

async function resolveReferenceTarget(query, originPage = null, originRatio = null) {
  const normalized = normalizedReferenceLabel(query);
  if (isEquationLabelQuery(query)) {
    const equationTarget = await findEquationLabelLocation(query, originPage, originRatio);
    if (equationTarget) return equationTarget;
    return null;
  }
  if (/^\[/.test(query)) {
    const number = Number(query.replace(/\D/g, ''));
    const bib = bibliographyEntries.find((entry) => entry.number === number);
    if (bib) return { page: bib.page, ratio: bib.ratio };
  }
  if (/^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim)\b/i.test(query)) {
    const entry = structureEntries.find((item) => normalizedReferenceLabel(item.label) === normalized);
    if (entry) return { page: entry.page, ratio: entry.ratio };
  }
  if (/^section\b/i.test(query)) {
    const number = query.match(/[A-Z]?\d+(?:\.\d+)*/i)?.[0] || '';
    const outline = inferredOutline.find((entry) => new RegExp(`^(?:§\\s*)?${number.replace(/\./g, '\\.')}(?:[.)\\s]|$)`, 'i').test(entry.title || ''));
    if (outline) return { page: outline.page, ratio: Number(outline.ratio) || 0 };
  }
  if (/^[A-Z][A-Z0-9]{1,7}$/.test(String(query || '').trim())) {
    const targets = await getTocOutlineTargets();
    const aliasTarget = unambiguousHeadingAliases(targets).get(String(query).trim());
    if (aliasTarget && Number(aliasTarget.page) !== Number(originPage)) return { page: aliasTarget.page, ratio: Number(aliasTarget.ratio) || 0, matchText: aliasTarget.title };
  }
  return findReferenceTextLocation(query, originPage);
}

async function goToReferenceQuery(query, originPage = currentPage, originRatio = null) {
  if (!pdfDoc || !query) return;
  const target = await resolveReferenceTarget(query, originPage, originRatio);
  if (!target) { showError(t(`No target found for ${query}.`, `未找到 ${query} 的目标位置。`)); return; }
  await goToMatchedLocation(target.page, Number(target.ratio) || 0, target.matchText || query);
  updateBacklinksForTarget(target.matchText || query, target);
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


function scheduleDetectedOutlineAugmentation() {
  if (!pdfDoc || inferredOutlineDetectionDone || inferredOutlineBuildPromise) return;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  inferredOutlineBuildPromise = (async () => {
    try {
      const detected = await detectOutlineFromTypography();
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return;
      inferredOutline = Array.isArray(detected) ? detected : [];
      inferredOutlineDetectionDone = true;
      tocOutlineTargets = null;
      persistDocumentState();
      // TOC pages may already be rendered. Refresh overlays now that the
      // detected structure can fill gaps in the embedded PDF outline.
      rerenderReferenceLinks();
    } catch (error) {
      if (pdfDoc === sourceDoc && currentFileKey === sourceKey) {
        inferredOutlineDetectionDone = true;
        console.warn('Detected outline augmentation unavailable', error);
      }
    } finally {
      inferredOutlineBuildPromise = null;
    }
  })();
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
        void resolveOutlineDestination(item.dest).then((location)=>{ if (location && button.isConnected) { button.dataset.page=String(location.page); updateDocumentMapCurrentLocation(); } }).catch(()=>{});
        button.addEventListener('click', async () => {
          setDocumentMapSelectedNode(button);
          try {
            const location = await resolveOutlineDestination(item.dest);
            if (!location) return;
            await goToMatchedLocation(location.page, location.ratio, item.title || '');
          } catch (error) { console.error(error); }
        });
        outlineList.append(button);
      }
      applyDocumentMapFilter(el('map-filter-structure')); updateDocumentMapCurrentLocation();
      scheduleDetectedOutlineAugmentation();
      return;
    }

    outlineEmpty.classList.remove('is-hidden');
    outlineEmpty.textContent = t('No embedded outline. Detecting document structure…', '没有嵌入式目录，正在自动检测文档结构……');
    if (!inferredOutline.length) {
      inferredOutline = await detectOutlineFromTypography();
      inferredOutlineDetectionDone = true;
      tocOutlineTargets = null;
      persistDocumentState();
    } else {
      inferredOutlineDetectionDone = true;
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
  if (sourceDoc === pdfDoc && lineCache.has(pageNum)) {
    const text = lineCache.get(pageNum).map((line) => line.text).join(' ').replace(/\s+/g, ' ').trim();
    cache.set(pageNum, text); return text;
  }
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


function exactSearchMatches(text, query) {
  const matchCase = Boolean(searchMatchCase?.checked);
  const wholeWord = Boolean(searchWholeWord?.checked);
  const source = normalizeSearchValue(text, matchCase);
  const needle = normalizeSearchValue(query, matchCase);
  if (!needle) return [];
  const out = [];
  let from = 0;
  while (from <= source.length) {
    const index = source.indexOf(needle, from);
    if (index < 0) break;
    let ok = true;
    if (wholeWord) {
      const before = index > 0 ? source[index - 1] : '';
      const after = index + needle.length < source.length ? source[index + needle.length] : '';
      const isWord = (ch) => /[\p{L}\p{N}_]/u.test(ch || '');
      ok = !isWord(before) && !isWord(after);
    }
    if (ok) out.push({ index, score: 1 });
    from = index + Math.max(1, needle.length);
  }
  return out;
}

function levenshteinDistance(a, b, maxDistance = Infinity) {
  const aa = String(a || ''), bb = String(b || '');
  if (Math.abs(aa.length - bb.length) > maxDistance) return maxDistance + 1;
  let prev = Array.from({ length: bb.length + 1 }, (_, i) => i);
  for (let i = 1; i <= aa.length; i += 1) {
    const curr = [i];
    let rowMin = curr[0];
    for (let j = 1; j <= bb.length; j += 1) {
      const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr[j] = v; rowMin = Math.min(rowMin, v);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    prev = curr;
  }
  return prev[bb.length];
}

function fuzzySearchMatches(text, query) {
  const matchCase = Boolean(searchMatchCase?.checked);
  const normalizedText = normalizeSearchValue(text, matchCase);
  const normalizedQuery = normalizeSearchValue(query, matchCase).trim();
  if (!normalizedQuery) return [];
  const direct = exactSearchMatches(text, query);
  if (direct.length) return direct;
  const qWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const words = [];
  const re = /[\p{L}\p{N}_]+/gu;
  let m;
  while ((m = re.exec(normalizedText))) words.push({ word: m[0], index: m.index });
  if (!qWords.length || !words.length) return [];
  const maxEditsFor = (w) => w.length <= 4 ? 1 : w.length <= 8 ? 2 : 3;
  const out = [];
  const span = qWords.length;
  for (let i = 0; i < words.length; i += 1) {
    if (i + span > words.length) break;
    let total = 0, possible = 0, ok = true;
    for (let j = 0; j < span; j += 1) {
      const q = qWords[j], w = words[i + j].word;
      const maxD = maxEditsFor(q);
      const d = levenshteinDistance(q, w, maxD);
      if (d > maxD) { ok = false; break; }
      total += d; possible += Math.max(q.length, w.length, 1);
    }
    if (!ok) continue;
    const score = Math.max(0, 1 - total / possible);
    if (score >= 0.72) out.push({ index: words[i].index, score });
  }
  return out.slice(0, 80);
}

async function runFindAllOccurrences(query) {
  const q = String(query || '').replace(/\s+/g, ' ').trim();
  if (!pdfDoc || !q) return;
  openLeftPanelShortcut('search-panel', searchInput);
  searchInput.value = q;
  if (searchFuzzy) searchFuzzy.checked = false;
  persistDocumentState();
  await searchPdf(q);
}

function normalizeSymbolGlossary(items) {
  const seen = new Set();
  const out = [];
  for (const [index, item] of (Array.isArray(items) ? items : []).entries()) {
    if (!item) continue;
    const symbol = String(item.symbol || '').replace(/\s+/g, ' ').trim();
    if (!symbol) continue;
    const key = normalizeSearchValue(symbol, false);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: item.id || `sym-${Number(item.created) || Date.now()}-${index}`,
      symbol,
      meaning: String(item.meaning || '').trim(),
      created: Number(item.created) || Date.now(),
      firstPage: Number(item.firstPage) >= 1 ? Number(item.firstPage) : null,
      firstRatio: Number.isFinite(Number(item.firstRatio)) ? Math.min(1, Math.max(0, Number(item.firstRatio))) : null
    });
  }
  return out;
}

async function locateFirstOccurrence(symbol) {
  if (!pdfDoc || !symbol) return null;
  const needle = normalizeSearchValue(symbol, false);
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    try {
      const text = await pageText(page);
      const hay = normalizeSearchValue(text, false);
      const index = hay.indexOf(needle);
      if (index >= 0) return { page, ratio: Math.min(1, Math.max(0, index / Math.max(1, hay.length))) };
    } catch (_) {}
  }
  return null;
}


function currentReadingAnchorForContext() {
  if (!pdfDoc) return { page: 1, ratio: 0 };
  if (readingFlow === 'continuous') return captureContinuousAnchor() || continuousSavedAnchor || { page: currentPage, ratio: 0 };
  const height = Math.max(1, primaryPageSurface?.offsetHeight || 1);
  const ratio = Math.max(0, Math.min(1, (primaryCanvasWrap?.scrollTop || 0) / height));
  return { page: currentPage, ratio };
}

function proofEntryAtAnchor(anchor = currentReadingAnchorForContext()) {
  const page = Number(anchor?.page) || currentPage;
  const ratio = Number(anchor?.ratio) || 0;
  const entries = structureEntries || [];
  const candidates = entries.filter((entry, index) => {
    if (!entry.proofPage) return false;
    const next = entries.slice(index + 1).find((item) => Number(item.page) >= Number(entry.proofPage));
    const explicitEndPage = Number(entry.proofEndPage) || 0;
    const inferredEndPage = next ? Number(next.page) : Number(entry.proofPage);
    const endPage = explicitEndPage || inferredEndPage;
    if (page < Number(entry.proofPage) || page > endPage) return false;
    if (page === Number(entry.proofPage) && Number.isFinite(Number(entry.proofRatio)) && ratio + 0.03 < Number(entry.proofRatio)) return false;
    if (explicitEndPage && page === explicitEndPage && Number.isFinite(Number(entry.proofEndRatio)) && ratio - 0.03 > Number(entry.proofEndRatio)) return false;
    if (!explicitEndPage && next && page === Number(next.page) && Number.isFinite(Number(next.ratio)) && ratio >= Number(next.ratio) - 0.02) return false;
    return true;
  });
  return candidates.sort((a,b) => (Number(b.proofPage)||0) - (Number(a.proofPage)||0))[0] || null;
}

function renderSymbolGlossary() {
  if (!symbolGlossaryList || !symbolGlossaryEmpty || !symbolGlossaryCount) return;
  symbolGlossary = normalizeSymbolGlossary(symbolGlossary);
  symbolGlossaryCount.textContent = String(symbolGlossary.length);
  symbolGlossaryList.replaceChildren();
  symbolGlossaryEmpty.classList.toggle('is-hidden', symbolGlossary.length > 0);
  for (const item of symbolGlossary) {
    const card = document.createElement('div'); card.className = 'symbol-glossary-item';
    const head = document.createElement('div'); head.className = 'symbol-glossary-head';
    const symbol = document.createElement('strong'); symbol.textContent = item.symbol;
    const meaning = document.createElement('span'); meaning.textContent = item.meaning || t('No meaning yet', '尚未填写含义');
    head.append(symbol, meaning);
    const actions = document.createElement('div'); actions.className = 'symbol-glossary-actions';
    const all = document.createElement('button'); all.type = 'button'; all.className = 'text-button'; all.textContent = t('Find all', '查找全部');
    all.addEventListener('click', () => runFindAllOccurrences(item.symbol));
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'text-button'; edit.textContent = t('Edit', '编辑');
    edit.addEventListener('click', () => {
      const next = window.prompt(t(`Meaning of ${item.symbol}`, `${item.symbol} 的含义`), item.meaning || '');
      if (next === null) return;
      item.meaning = String(next).trim(); persistDocumentState(); renderSymbolGlossary();
    });
    const del = document.createElement('button'); del.type = 'button'; del.className = 'text-button'; del.textContent = t('Delete', '删除');
    del.addEventListener('click', () => { pushUndo('glossary', item.symbol, item); symbolGlossary = symbolGlossary.filter((x) => x.id !== item.id); persistDocumentState(); renderSymbolGlossary(); });
    actions.append(all, edit, del);
    card.append(head, actions);
    symbolGlossaryList.append(card);
  }
}

async function addGlossaryEntry(symbolValue = null, meaningValue = null) {
  if (!pdfDoc) return;
  const symbol = String(symbolValue ?? glossarySymbolInput?.value ?? '').replace(/\s+/g, ' ').trim();
  const meaning = String(meaningValue ?? glossaryMeaningInput?.value ?? '').trim();
  if (!symbol) { glossarySymbolInput?.focus(); return; }
  const key = normalizeSearchValue(symbol, false);
  let item = symbolGlossary.find((entry) => normalizeSearchValue(entry.symbol, false) === key);
  if (item) {
    if (meaning) item.meaning = meaning;
  } else {
    item = { id: `sym-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, symbol, meaning, created: Date.now(), firstPage: null, firstRatio: null };
    symbolGlossary.push(item);
  }
  if (glossarySymbolInput) glossarySymbolInput.value = '';
  if (glossaryMeaningInput) glossaryMeaningInput.value = '';
  persistDocumentState(); renderSymbolGlossary(); autoOpenRightSection('symbol-glossary-section');
}

function addSelectionToGlossary() {
  const selected = String(currentSelection?.latex || currentSelection?.text || '').replace(/\s+/g, ' ').trim();
  if (!selected) return;
  if (glossarySymbolInput) glossarySymbolInput.value = selected;
  autoOpenRightSection('symbol-glossary-section');
}

function selectedReferenceQuery() {
  const text = String(currentSelection?.text || '').replace(/\s+/g, ' ').trim();
  const match = text.match(/\b(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Section)\s+[A-Z]?\d+(?:\.\d+)*\b/i)
    || text.match(/\(\s*\d+(?:\.\d+)*\s*\)/)
    || text.match(/\[\s*\d{1,3}\s*\]/);
  return match?.[0] || '';
}

async function goToSelectedReference() {
  if (!pdfDoc) return;
  const query = selectedReferenceQuery();
  if (!query) { showError(t('Select a reference such as “Theorem 2.4”, “Section 3”, “(4.7)”, or “[17]”.', '请选择类似“Theorem 2.4”、“Section 3”、“(4.7)”或“[17]”的引用。')); return; }
  await goToReferenceQuery(query, currentSelection?.page || currentPage);
}



function semanticMatchRangeInLayer(layer, surface, query, targetRatio = null) {
  if (!layer || !surface || !query) return null;
  const mapped = textLayerAggregate(layer);
  if (!mapped.text) return null;
  const pieces = String(query || '').trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return null;
  const escaped = pieces.map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  let pattern;
  try { pattern = new RegExp(escaped.join('\\s+'), 'giu'); } catch (_) { return null; }
  const surfaceRect = surface.getBoundingClientRect();
  const candidates = [];
  let match;
  while ((match = pattern.exec(mapped.text))) {
    const range = rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
    if (!range) continue;
    const rects = [...range.getClientRects()].filter((rect) => rect.width >= 1 && rect.height >= 1);
    if (!rects.length) continue;
    const first = rects[0];
    const centerY = first.top - surfaceRect.top + first.height / 2;
    const ratio = surfaceRect.height > 0 ? Math.min(1, Math.max(0, centerY / surfaceRect.height)) : 0;
    candidates.push({ range, ratio });
    if (!match[0].length) pattern.lastIndex += 1;
  }
  if (!candidates.length) return null;
  if (!Number.isFinite(Number(targetRatio))) return candidates[0].range;
  const wanted = Math.min(1, Math.max(0, Number(targetRatio)));
  candidates.sort((a, b) => Math.abs(a.ratio - wanted) - Math.abs(b.ratio - wanted));
  return candidates[0].range;
}

async function emphasizeSemanticDestination(page, ratio, query) {
  if (!pdfDoc || !query) return;
  let layer = null;
  let surface = null;
  if (readingFlow === 'continuous') {
    const record = continuousPageNodes.get(Number(page));
    if (record) {
      if (!record.rendered) await renderContinuousPage(Number(page), continuousGeneration);
      layer = record.textLayer;
      surface = record.surface;
    }
  } else {
    layer = primaryTextLayer;
    surface = primaryPageSurface;
  }
  if (!layer || !surface) return;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const range = semanticMatchRangeInLayer(layer, surface, query, ratio);
  if (!range) return;
  const rect = [...range.getClientRects()].find((item) => item.width >= 1 && item.height >= 1);
  if (!rect) return;
  const wrapRect = primaryCanvasWrap.getBoundingClientRect();
  const desiredOffset = Math.min(280, Math.max(150, wrapRect.height * 0.34));
  const delta = rect.top - (wrapRect.top + desiredOffset);
  primaryCanvasWrap.scrollTop = Math.max(0, primaryCanvasWrap.scrollTop + delta);
  if (readingFlow === 'continuous') continuousSavedAnchor = captureContinuousAnchor() || continuousSavedAnchor;
  emphasizeSearchRange(surface, range);
  persistDocumentState();
}

async function goToMatchedLocation(page, ratio = 0, query = '', options = {}) {
  await goToLocation(page, ratio, options);
  if (query) await emphasizeSemanticDestination(page, ratio, query);
  else showNavigationLandingCue(page, ratio);
}

function searchMatchRangeInLayer(layer, query, ordinal = 0) {
  if (!layer || !query) return null;
  const mapped = textLayerAggregate(layer);
  if (!mapped.text) return null;
  const pieces = String(query || '').trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return null;
  const escaped = pieces.map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  let pattern;
  try { pattern = new RegExp(escaped.join('\\s+'), searchMatchCase?.checked ? 'gu' : 'giu'); } catch (_) { return null; }
  let match = null;
  let index = 0;
  while ((match = pattern.exec(mapped.text))) {
    if (index === Math.max(0, Number(ordinal) || 0)) {
      return rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
    }
    index += 1;
    if (!match[0].length) pattern.lastIndex += 1;
  }
  return null;
}

function clearSearchMatchEmphasis() {
  document.querySelectorAll('.search-match-emphasis-layer').forEach((node) => node.remove());
}

function emphasizeSearchRange(surface, range) {
  if (!surface || !range) return null;
  clearSearchMatchEmphasis();
  const surfaceRect = surface.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'search-match-emphasis-layer';
  let firstRect = null;
  for (const rect of range.getClientRects()) {
    if (rect.width < 1 || rect.height < 1) continue;
    if (!firstRect) firstRect = rect;
    const mark = document.createElement('div');
    mark.className = 'search-match-emphasis';
    mark.style.left = `${rect.left - surfaceRect.left}px`;
    mark.style.top = `${rect.top - surfaceRect.top}px`;
    mark.style.width = `${rect.width}px`;
    mark.style.height = `${rect.height}px`;
    layer.append(mark);
  }
  if (!layer.childElementCount) return null;
  if (firstRect) {
    const cue = document.createElement('div');
    cue.className = 'target-landing-cue';
    cue.textContent = '→';
    cue.setAttribute('aria-hidden', 'true');
    cue.style.top = `${firstRect.top - surfaceRect.top + firstRect.height / 2}px`;
    layer.append(cue);
  }
  surface.append(layer);
  window.setTimeout(() => layer.classList.add('is-fading'), 1700);
  window.setTimeout(() => layer.remove(), 2600);
  return layer;
}

async function goToSearchMatch(match, query) {
  if (!pdfDoc || !match) return;
  // First get the correct page rendered without relying on the generic semantic
  // lead. The exact text-layer range below becomes the authoritative position.
  await goToLocation(match.page, Math.min(1, Math.max(0, match.index / Math.max(1, match.text.length))), { contextLead: false });
  let layer = null;
  let surface = null;
  if (readingFlow === 'continuous') {
    const record = continuousPageNodes.get(match.page);
    if (record) {
      if (!record.rendered) await renderContinuousPage(match.page, continuousGeneration);
      layer = record.textLayer;
      surface = record.surface;
    }
  } else {
    layer = primaryTextLayer;
    surface = primaryPageSurface;
  }
  if (!layer || !surface) return;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const range = searchMatchRangeInLayer(layer, query, match.ordinal || 0);
  if (!range) return;
  const rect = [...range.getClientRects()].find((item) => item.width >= 1 && item.height >= 1);
  if (!rect) return;
  const wrapRect = primaryCanvasWrap.getBoundingClientRect();
  // Keep the chosen occurrence at a predictable, comfortable position instead
  // of pinning it close to the top edge. Clamp for short reader windows.
  const desiredOffset = Math.min(280, Math.max(150, wrapRect.height * 0.34));
  const delta = rect.top - (wrapRect.top + desiredOffset);
  primaryCanvasWrap.scrollTop = Math.max(0, primaryCanvasWrap.scrollTop + delta);
  if (readingFlow === 'continuous') continuousSavedAnchor = captureContinuousAnchor() || continuousSavedAnchor;
  emphasizeSearchRange(surface, range);
  persistDocumentState();
}

async function searchPdf(query) {
  searchResults.replaceChildren();
  const q = query.trim();
  if (!pdfDoc || !q) { searchStatus.textContent = ''; return; }
  if (searchEquations?.checked) {
    const matches = equationSearchMatches(q);
    searchStatus.textContent = t(`${matches.length} saved/extracted equation${matches.length===1?'':'s'}`, `${matches.length} 个已保存/提取公式`);
    for (const match of matches.slice(0,200)) {
      const item=document.createElement('button'); item.type='button'; item.className='search-result search-result-equation';
      const label=document.createElement('strong'); label.textContent=t(`Page ${match.page} · ${match.source}`,`第 ${match.page} 页 · ${match.source}`);
      const code=document.createElement('code'); code.textContent=match.latex.length>280?`${match.latex.slice(0,280)}…`:match.latex; item.append(label,code);
      item.addEventListener('click', async () => {
        const ratio = Number.isFinite(Number(match.ratio)) ? Number(match.ratio) : 0;
        await goToLocation(match.page, ratio, { contextLead: false });
        if (Number.isFinite(Number(match.ratio))) {
          await positionTargetAtReadingLead(match.page, ratio);
          showEquationBookmarkCue(match.page, ratio);
        }
      }); searchResults.append(item);
    }
    return;
  }
  const fuzzy = Boolean(searchFuzzy?.checked);
  searchStatus.textContent = fuzzy ? t('Fuzzy searching…', '正在模糊搜索……') : t('Searching…', '正在搜索……');
  const matches = [];
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    searchStatus.textContent = t(`Searching page ${page} of ${pdfDoc.numPages}…`, `正在搜索第 ${page} / ${pdfDoc.numPages} 页……`);
    try {
      const text = await pageText(page);
      const hits = fuzzy ? fuzzySearchMatches(text, q) : exactSearchMatches(text, q);
      for (const [ordinal, hit] of hits.entries()) matches.push({ page, text, index: hit.index, score: hit.score, ordinal });
    } catch (error) { console.error(error); }
    if (page % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  matches.sort((a,b) => fuzzy ? (b.score - a.score || a.page - b.page || a.index - b.index) : (a.page - b.page || a.index - b.index));
  searchStatus.textContent = t(`${matches.length} occurrence${matches.length === 1 ? '' : 's'}${fuzzy ? ' · fuzzy ranked' : ''}`, `${matches.length} 个出现位置${fuzzy ? ' · 按模糊匹配排序' : ''}`);
  for (const match of matches.slice(0, 200)) {
    const item = document.createElement('button');
    item.type = 'button'; item.className = 'search-result';
    const label = document.createElement('strong');
    label.textContent = fuzzy && match.score < 0.999 ? t(`Page ${match.page} · ${Math.round(match.score*100)}%`, `第 ${match.page} 页 · ${Math.round(match.score*100)}%`) : t(`Page ${match.page}`, `第 ${match.page} 页`);
    const snippet = document.createElement('p'); snippet.append(highlightedSnippet(match.text, q, match.index));
    item.append(label, snippet);
    item.addEventListener('click', () => goToSearchMatch(match, q));
    searchResults.append(item);
  }
}

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
  notePreview.textContent = value;
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
  try {
    const lib = await ensurePdfJs();
    if (pdfDoc) { try { await pdfDoc.destroy(); } catch (_) {} }
    const task = lib.getDocument({ data });
    pdfDoc = await task.promise;
    currentFileName = meta.name;
    currentFileKey = meta.id;
    cacheEnabledForCurrent = Boolean(cachedRecord);
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
    renderReferenceStack();
    updateReadingBackButton();
    // The initial continuous path already uses the final visible reader width.
    // Do not immediately rebuild it through the post-load stabilizer; that was
    // the regression source introduced after v78. Later display changes still
    // use the universal transition path.
    if (!(readingFlow === 'continuous' && initialContinuousReady)) await stabilizeFitWidthLayout();
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

openButton.addEventListener('click', () => fileInput.click());
welcomeOpen.addEventListener('click', () => fileInput.click());
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
  renderBookmarks(); renderStructureIndex(); renderBibliographyIndex(); renderReferenceStack(); renderAnnotationList(); rerenderVisibleAnnotations(); updateReadingBackButton(); persistDocumentState(); scheduleAutomaticStructureIndex();
}


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
  if (/^\[\s*\d+\s*\]$/.test(q)) return 'bibliography';
  if (/^(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Section)\b/i.test(q)) return 'structure';
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

function renderCommandPalette() {
  if (!commandList) return;
  const qRaw = String(commandInput?.value || '').trim();
  commandList.replaceChildren();
  const items = [];
  for (const action of commandActions()) items.push({ isCommand:true, kind:action.kind, kindKey:'command', title:action.label, subtitle:'', run:action.run, searchText:action.label });
  if (qRaw) items.push(...commandPaletteEntities());
  const filtered = items.map((item)=>({item,score:commandPaletteMatchScore(item,qRaw)})).filter((row)=>row.score>0).sort((a,b)=>b.score-a.score || String(a.item.title).localeCompare(String(b.item.title))).slice(0,80).map((row)=>row.item);
  for (const [index, item] of filtered.entries()) {
    const button=document.createElement('button'); button.type='button'; button.className='command-item'; if(index===0) button.classList.add('is-current');
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
  commandPalette.classList.remove('is-hidden'); commandInput.value = ''; renderCommandPalette(); setTimeout(() => commandInput.focus(), 0);
  if (pdfDoc && !equationLabelIndex) {
    buildEquationLabelIndex().then(() => { if (!commandPalette.classList.contains('is-hidden') && commandInput.value.trim()) renderCommandPalette(); }).catch(() => {});
  }
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
ocrEngineSelect?.addEventListener('change', async () => { mathOcrEngineMode = normalizedOcrEngineMode(ocrEngineSelect.value); safeSet('mathreader-ocr-engine-v4', mathOcrEngineMode); setOcrMode(false); await disposeMathOcrPipeline(); updateOcrInteractionAvailability(); setOcrStatus(t('Image OCR engine preference changed. Preloading the selected engine…', '图像 OCR 引擎偏好已更改。正在预加载所选引擎……'), true); scheduleMathOcrPreload(); });
ocrRetryButton?.addEventListener('click', async () => { setOcrMode(false); await disposeMathOcrPipeline(); updateOcrInteractionAvailability(); setOcrStatus(t('OCR engine reset. Preloading a fresh engine…', '公式 OCR 引擎已重置。正在预加载新的引擎……'), true); scheduleMathOcrPreload(); });
mathOcrButton?.addEventListener('click', () => setOcrMode(!ocrMode));
pinPageButton?.addEventListener('click', () => setPinnedPage(currentPage));
pinFromSidebar.addEventListener('click', () => setPinnedPage(currentPage));
unpinPage.addEventListener('click', clearPinnedPage);
referencePrev.addEventListener('click', () => { if (pinnedPage && pinnedPage > 1) setPinnedPage(pinnedPage - 1); });
referenceNext.addEventListener('click', () => { if (pinnedPage && pdfDoc && pinnedPage < pdfDoc.numPages) setPinnedPage(pinnedPage + 1); });
addBookmark.addEventListener('click', addCurrentBookmark);
readingBackButton?.addEventListener('click', goBackReadingLocation);
readingTrailClear?.addEventListener('click', () => { if (readingBackStack.length) pushUndo('reading-trail', t('Reading trail', '阅读轨迹'), readingBackStack); readingBackStack = []; readingTrailExpanded = false; updateReadingBackButton(); renderReadingTrail(); persistDocumentState(); });
readingTrailToggle?.addEventListener('click', () => { readingTrailExpanded = !readingTrailExpanded; renderReadingTrail(); });
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
  if (ocrSourceSwitchButton.dataset.targetSource !== 'vector' || !currentOcrResult.vectorAlternative) return;
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

[selectionToolbar, copySelectionText, copySelectionLatex, selectionToNote, selectionHighlight, selectionMarginNote, selectionFindAll, selectionToGlossary, floatingHighlight, floatingMarginNote, floatingFindAll].forEach((node) => node?.addEventListener('pointerdown', (event) => event.preventDefault()));
selectionToolbar.addEventListener('pointerdown', (event) => event.preventDefault());
copySelectionText.addEventListener('click', () => copyPlainText(currentSelection?.text, copySelectionText));
copySelectionLatex.addEventListener('click', () => copyPlainText(currentSelection?.latex, copySelectionLatex));
selectionToNote.addEventListener('click', addSelectionToPageNote);
selectionFindAll?.addEventListener('click', () => runFindAllOccurrences(currentSelection?.text));
selectionToGlossary?.addEventListener('click', addSelectionToGlossary);
floatingCopyText.addEventListener('click', () => copyPlainText(currentSelection?.text, floatingCopyText));
floatingCopyLatex.addEventListener('click', () => copyPlainText(currentSelection?.latex, floatingCopyLatex));
floatingFindAll?.addEventListener('click', () => { runFindAllOccurrences(currentSelection?.text); hideSelectionToolbar(); });
floatingAddNote.addEventListener('click', () => { addSelectionToPageNote(); hideSelectionToolbar(); });
floatingHighlight?.addEventListener('click', () => { addSelectionAnnotation('highlight'); hideSelectionToolbar(); });
floatingMarginNote?.addEventListener('click', () => { addSelectionAnnotation('margin'); hideSelectionToolbar(); });
floatingPinPage.addEventListener('click', () => { if (currentSelection?.page) setPinnedPage(currentSelection.page); hideSelectionToolbar(); });
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

function loadSidebarWidths() {
  if (generalPrefs.rememberSidebarWidths === false) {
    shell?.style.setProperty('--left-sidebar-width', '250px');
    shell?.style.setProperty('--right-sidebar-width', '260px');
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SIDEBAR_WIDTHS_KEY) || '{}');
    const left = clamp(saved.left, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, 250);
    const right = clamp(saved.right, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, 260);
    shell?.style.setProperty('--left-sidebar-width', `${left}px`);
    shell?.style.setProperty('--right-sidebar-width', `${right}px`);
  } catch (_) {}
}

function saveSidebarWidths() {
  if (!shell || generalPrefs.rememberSidebarWidths === false) return;
  try {
    const styles = getComputedStyle(shell);
    const left = clamp(parseFloat(styles.getPropertyValue('--left-sidebar-width')), SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, 250);
    const right = clamp(parseFloat(styles.getPropertyValue('--right-sidebar-width')), SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, 260);
    localStorage.setItem(SIDEBAR_WIDTHS_KEY, JSON.stringify({ left, right }));
  } catch (_) {}
}

function bindSidebarResizer(handle, side) {
  if (!handle || !shell) return;
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
        const width = clamp(raw, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, side === 'left' ? 250 : 260);
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
  if (!typing && pdfDoc && !event.ctrlKey && !event.metaKey && !event.altKey && key === 'f') { event.preventDefault(); setOcrMode(!ocrMode); return; }
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
window.addEventListener('dragenter', (event) => {
  if (draggedWorkspaceSection) return;
  event.preventDefault(); dragDepth += 1; dropOverlay.classList.remove('is-hidden');
});
window.addEventListener('dragover', (event) => { if (!draggedWorkspaceSection) event.preventDefault(); });
window.addEventListener('dragleave', (event) => {
  if (draggedWorkspaceSection) return;
  event.preventDefault(); dragDepth -= 1; if (dragDepth <= 0) { dragDepth = 0; dropOverlay.classList.add('is-hidden'); }
});
window.addEventListener('drop', (event) => {
  if (draggedWorkspaceSection) return;
  event.preventDefault(); dragDepth = 0; dropOverlay.classList.add('is-hidden');
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
scheduleMathOcrPreload();
