// MathReader · Core state, persistence, document OCR, preferences, and base UI.
const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm';
const TRANSFORMERS_RUNTIME = 'Transformers.js 4.3.1';
const MATH_OCR_MODEL = 'Xenova/texify';
const DOCUMENT_OCR_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js';
const DOCUMENT_OCR_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
const DOCUMENT_OCR_CACHE_VERSION = 2;
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
const documentOcrGate = el('document-ocr-gate');
const documentOcrTitle = el('document-ocr-title');
const documentOcrCopy = el('document-ocr-copy');
const documentOcrProgressWrap = el('document-ocr-progress-wrap');
const documentOcrProgress = el('document-ocr-progress');
const documentOcrProgressText = el('document-ocr-progress-text');
const documentOcrPrimary = el('document-ocr-primary');
const documentOcrSecondary = el('document-ocr-secondary');
const documentTextUnavailable = el('document-text-unavailable');
const contentsRunDocumentOcr = el('contents-run-document-ocr');
const outlinePanel = el('outline-panel');
const errorBanner = el('error-banner');
const dropOverlay = el('drop-overlay');
const languageButton = el('language-button');
const languageLabel = el('language-label');
const themeButton = el('theme-button');
const themeIcon = el('theme-icon');
const themeLabel = el('theme-label');
const referencePreview = el('reference-preview');
const rightSidebar = el('right-sidebar');
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
const floatingStructure = el('floating-structure');
const floatingGlossary = el('floating-glossary');
const floatingHighlight = el('floating-highlight');
const floatingMarginNote = el('floating-margin-note');
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
let documentOcrPages = new Map();
let documentOcrActive = false;
let documentOcrModulePromise = null;
let documentTextMode = 'native'; // native | ocr | unavailable
let imageDocumentDetected = false;
let documentTextPreference = 'ask'; // native | ocr | skip | ask
let documentOcrRunController = null;
let documentOcrGateChoiceResolve = null;
let documentOcrBusy = false;
let referencePageRenderCache = new Map();
let bibliographyExpanded = new Set();
let pdfModulePromise = null;
let noteTimer = null;
let documentMetaTimer = null;
let annotationSaveTimer = null;
let resizeTimer = null;
let selectionTimer = null;
let currentSelection = null;
let pendingOutlineReselectKey = null;
let pendingEquationReselectKey = null;
let pendingEquationAddKey = null;
let equationEdits = [];
let equationManualOrder = [];
let embeddedOutlineEdits = [];
let embeddedOutlineEntries = [];
let equationIndexBuildPromise = null;
// Keep a tiny persisted equation summary so the collapsed Equations
// badge can restore immediately without serializing or eagerly rebuilding the
// full label index. null means the count is not known yet.
let equationIndexKnownCount = null;
let equationConfidenceFilter = 'all';
let draggedEquationKey = null;
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
let equationNumberingSide = 'right';
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
mathOcrEngineMode = safeGet('mathreader-ocr-engine-v8', 'official');
formulaExtractionMode = safeGet('mathreader-formula-method-v1', 'image') === 'vector' ? 'vector' : 'image';

const DISPLAY_PREFS_KEY = 'mathreader-display-v3';
const LEGACY_DISPLAY_PREFS_KEYS = ['mathreader-display-v2','mathreader-display-v1'];
const SEARCH_PREFS_KEY = 'mathreader-search-options-v1';
const WORKSPACE_COLLAPSE_KEY = 'mathreader-workspace-collapse-v3';
const PANEL_ORDER_KEY = 'mathreader-panel-order-v1';
const STRUCTURE_INDEX_VERSION = 24;
const EQUATION_INDEX_SUMMARY_VERSION = 2;
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

async function sha256Hex(data) {
  try {
    if (!globalThis.crypto?.subtle || !data) return '';
    const view = data instanceof Uint8Array ? data : new Uint8Array(data);
    const start = view.byteOffset;
    const end = start + view.byteLength;
    const buffer = view.buffer.slice(start, end);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch (_) {
    return '';
  }
}

async function exactDocumentKey(data, name, size, lastModified) {
  const hash = await sha256Hex(data);
  return hash ? `sha256:${hash}` : makeFileKey(name, size, lastModified);
}

function clearDocumentMapForIncomingPdf() {
  // Never leave one document's indexes visible while another document is opening/OCRing.
  inferredOutline = [];
  inferredOutlineDetectionDone = false;
  inferredOutlineBuildPromise = null;
  structureIndexBuildToken += 1;
  outlineMode = 'none';
  structureEntries = [];
  bibliographyEntries = [];
  equationLabelIndex = null;
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  equationEdits = [];
  equationManualOrder = [];
  draggedEquationKey = null;
  try { dragDepth = 0; dropOverlay?.classList.add('is-hidden'); } catch (_) {}
  pendingEquationReselectKey = null;
  pendingEquationAddKey = null;
  embeddedOutlineEntries = [];
  embeddedOutlineEdits = [];
  structureIndexVersion = 0;
  nativePdfCommentLoadToken += 1;
  backlinkContext = null;
  backlinkEntries = [];
  tocOutlineTargets = null;
  // Clear visible map rows synchronously. Do not start any renderer here: the new
  // PDF may still be in its OCR/preparation gate and old rows must become inert now.
  try { outlineList?.replaceChildren(); } catch (_) {}
  try { structureIndex?.replaceChildren(); } catch (_) {}
  try { bibliographyIndex?.replaceChildren(); } catch (_) {}
  try { equationIndex?.replaceChildren(); } catch (_) {}
  try { backlinksList?.replaceChildren(); } catch (_) {}
  if (structureCount) structureCount.textContent = '0';
  if (bibliographyCount) bibliographyCount.textContent = '0';
  if (equationIndexCount) equationIndexCount.textContent = '0';
  if (backlinksCount) backlinksCount.textContent = '0';
}

function activePanelId() {
  return document.querySelector('.sidebar-tab.is-active')?.dataset.panel || 'outline-panel';
}

function snapshotSession() {
  const anchor = readingFlow === 'continuous' ? (captureContinuousAnchor() || continuousSavedAnchor) : continuousSavedAnchor;
  return {
    version: 22,
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
    documentTextPreference,
    inferredOutline,
    structureEntries,
    bibliographyEntries,
    equationEdits,
    equationManualOrder,
    equationIndexSummary: Number.isInteger(equationIndexKnownCount) && equationIndexKnownCount >= 0
      ? { version: EQUATION_INDEX_SUMMARY_VERSION, count: equationIndexKnownCount }
      : null,
    embeddedOutlineEdits,
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
    const entry = document.createElement('div'); entry.className = 'history-entry';
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
    let importedPdfRequired = null;
    if (!record.localAvailable) {
      if (record.importedReadingData) {
        // Keep recovery guidance outside the compact History item so a
        // long PDF-required sentence does not enlarge the document card.
        importedPdfRequired = document.createElement('div');
        importedPdfRequired.className = 'history-unavailable history-unavailable-below';
        importedPdfRequired.textContent = t('PDF required · Select the matching PDF to restore this reading session.', '需要 PDF · 请选择匹配的 PDF 以恢复此阅读现场。');
      } else {
        const missing = document.createElement('span'); missing.className = 'history-unavailable';
        missing.textContent = t('Local PDF copy unavailable', '本地 PDF 副本不可用');
        meta.append(missing);
      }
    }
    open.append(title, meta);
    open.disabled = !record.localAvailable;
    if (record.localAvailable) open.addEventListener('click', () => openCachedDocument(record.id));
    const recover = document.createElement('button'); recover.type = 'button'; recover.className = 'history-recover'; recover.textContent = record.importedReadingData ? t('Select PDF', '选择 PDF') : t('Reopen', '重新选择');
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
    row.append(open, recover, remove);
    entry.append(row);
    if (importedPdfRequired) entry.append(importedPdfRequired);
    historyList.append(entry);
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
  errorBanner.classList.remove('is-info', 'is-hidden');
  clearTimeout(showError.timer); clearTimeout(showNotice.timer);
  showError.timer = setTimeout(() => errorBanner.classList.add('is-hidden'), 6500);
}
function showNotice(message) {
  errorBanner.textContent = message;
  errorBanner.classList.add('is-info');
  errorBanner.classList.remove('is-hidden');
  clearTimeout(showError.timer); clearTimeout(showNotice.timer);
  showNotice.timer = setTimeout(() => errorBanner.classList.add('is-hidden'), 6500);
}

function setLoading(active, message = null) {
  if (message) loadingText.textContent = message;
  loadingOverlay.classList.toggle('is-hidden', !active);
}

function documentTextFeaturesAvailable() {
  return documentTextMode === 'native' || documentTextMode === 'ocr';
}

function hideDocumentOcrGate() {
  if (documentOcrGateChoiceResolve) {
    documentOcrGateChoiceResolve = null;
  }
  if (documentOcrPrimary) documentOcrPrimary.onclick = null;
  if (documentOcrSecondary) documentOcrSecondary.onclick = null;
  documentOcrGate?.classList.add('is-hidden');
  if (!documentOcrBusy) {
    if (openButton) openButton.disabled = false;
    if (welcomeOpen) welcomeOpen.disabled = false;
    if (fileInput) fileInput.disabled = false;
  }
}

function documentOcrInteractionLocked() {
  return documentOcrBusy || Boolean(documentOcrGate && !documentOcrGate.classList.contains('is-hidden'));
}

function configureDocumentOcrGate(mode, detail = '') {
  if (!documentOcrGate) return;
  documentOcrGate.classList.remove('is-hidden');
  if (openButton) openButton.disabled = true;
  if (welcomeOpen) welcomeOpen.disabled = true;
  if (fileInput) fileInput.disabled = true;
  documentOcrProgressWrap?.classList.toggle('is-hidden', mode !== 'progress');
  if (documentOcrSecondary) documentOcrSecondary.classList.remove('is-hidden');
  if (documentOcrPrimary) documentOcrPrimary.disabled = false;

  if (mode === 'decision') {
    documentOcrTitle.textContent = t('No usable text layer', '没有可用文本层');
    documentOcrCopy.textContent = t(
      'This document appears to contain scanned pages. Full-document OCR is required for Contents, Search, Results, Equations, Bibliography, and text backlinks.',
      '此文档似乎由扫描页面组成。目录、搜索、结果、公式、参考文献和文本反向链接需要先运行全文 OCR。'
    );
    documentOcrPrimary.textContent = t('Run OCR', '运行 OCR');
    documentOcrSecondary.textContent = t('Open without OCR', '不运行 OCR 打开');
  } else if (mode === 'progress') {
    documentOcrTitle.textContent = t('Preparing document text', '正在准备文档文本');
    documentOcrCopy.textContent = t('Full-document OCR is running locally in this browser.', '全文 OCR 正在此浏览器中本地运行。');
    documentOcrPrimary.textContent = t('Stop OCR', '停止 OCR');
    documentOcrSecondary.classList.add('is-hidden');
    if (documentOcrProgressText && detail) documentOcrProgressText.textContent = detail;
  } else if (mode === 'stopped') {
    documentOcrTitle.textContent = t('OCR stopped', 'OCR 已停止');
    documentOcrCopy.textContent = t('The document can be opened without text features, or OCR can be restarted from the beginning.', '可在不启用文本功能的情况下打开文档，也可以从头重新运行 OCR。');
    documentOcrPrimary.textContent = t('Restart OCR', '重新运行 OCR');
    documentOcrSecondary.textContent = t('Open without OCR', '不运行 OCR 打开');
  } else if (mode === 'error') {
    documentOcrTitle.textContent = t('Document OCR unavailable', '全文 OCR 不可用');
    documentOcrCopy.textContent = detail || t('OCR could not complete. You can retry or open the document without text features.', 'OCR 未能完成。你可以重试，或在不启用文本功能的情况下打开文档。');
    documentOcrPrimary.textContent = t('Retry OCR', '重试 OCR');
    documentOcrSecondary.textContent = t('Open without OCR', '不运行 OCR 打开');
  }
}

function waitForDocumentOcrChoice(mode, detail = '') {
  configureDocumentOcrGate(mode, detail);
  return new Promise((resolve) => {
    documentOcrGateChoiceResolve = resolve;
    if (documentOcrPrimary) documentOcrPrimary.onclick = () => {
      const action = mode === 'decision' ? 'run' : mode === 'stopped' ? 'restart' : 'retry';
      documentOcrGateChoiceResolve = null;
      resolve(action);
    };
    if (documentOcrSecondary) documentOcrSecondary.onclick = () => {
      documentOcrGateChoiceResolve = null;
      resolve('skip');
    };
  });
}

function setDocumentOcrProgress(page, pageCount, progress = null, message = '') {
  configureDocumentOcrGate('progress', message);
  if (!documentOcrProgress) return;
  if (Number.isFinite(Number(progress)) && Number(pageCount) > 0) {
    const value = Math.max(0, Math.min(100, ((Math.max(1, Number(page)) - 1) + Math.max(0, Math.min(1, Number(progress)))) / Number(pageCount) * 100));
    documentOcrProgress.value = value;
  } else {
    documentOcrProgress.removeAttribute('value');
  }
}

function makeDocumentOcrStoppedError() {
  const error = new Error('Document OCR stopped');
  error.code = 'DOCUMENT_OCR_STOPPED';
  return error;
}

function isDocumentOcrStoppedError(error) {
  return error?.code === 'DOCUMENT_OCR_STOPPED';
}

function requestStopFullDocumentOcr() {
  const controller = documentOcrRunController;
  if (!controller || controller.cancelled) return;
  controller.cancelled = true;
  if (documentOcrPrimary) documentOcrPrimary.disabled = true;
  if (documentOcrProgressText) documentOcrProgressText.textContent = t('Stopping OCR…', '正在停止 OCR……');
  try {
    const result = controller.worker?.terminate?.();
    if (result?.catch) result.catch(() => {});
  } catch (_) {}
}

function updateDocumentTextAvailabilityUI() {
  const unavailable = Boolean(pdfDoc && imageDocumentDetected && !documentTextFeaturesAvailable());
  documentTextUnavailable?.classList.toggle('is-hidden', !unavailable);
  outlinePanel?.classList.toggle('text-unavailable', unavailable);
  if (contentsRunDocumentOcr) contentsRunDocumentOcr.disabled = !unavailable || documentOcrBusy;

  if (searchForm) {
    searchForm.classList.toggle('text-unavailable', unavailable);
    for (const node of searchForm.querySelectorAll('input,button')) node.disabled = unavailable;
  }
  if (unavailable) {
    searchResults?.replaceChildren();
    if (searchStatus) searchStatus.textContent = t('Document text is unavailable. Run full-document OCR from Contents to enable Search.', '文档文本不可用。请在“目录”中运行全文 OCR 后再使用搜索。');
  } else if (searchStatus && !searchInput?.value?.trim()) {
    searchStatus.textContent = '';
  }
}

function clearTextDerivedIndexesForUnavailableDocument() {
  inferredOutline = [];
  inferredOutlineDetectionDone = false;
  inferredOutlineBuildPromise = null;
  outlineMode = 'none';
  embeddedOutlineEntries = [];
  structureEntries = [];
  bibliographyEntries = [];
  structureIndexVersion = 0;
  structureIndexBuildToken += 1;
  structureIndexBuilding = false;
  equationLabelIndex = null;
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  tocOutlineTargets = null;
  backlinkContext = null;
  backlinkEntries = [];
  try { outlineList?.replaceChildren(); } catch (_) {}
  try { structureIndex?.replaceChildren(); } catch (_) {}
  try { bibliographyIndex?.replaceChildren(); } catch (_) {}
  try { equationIndex?.replaceChildren(); } catch (_) {}
  try { backlinksList?.replaceChildren(); } catch (_) {}
  if (outlineCount) outlineCount.textContent = '0';
  if (structureCount) structureCount.textContent = '0';
  if (bibliographyCount) bibliographyCount.textContent = '0';
  if (equationIndexCount) equationIndexCount.textContent = '0';
  if (backlinksCount) backlinksCount.textContent = '0';
}

function invalidateTextDerivedIndexesForOcrActivation() {
  inferredOutline = [];
  inferredOutlineDetectionDone = false;
  inferredOutlineBuildPromise = null;
  outlineMode = 'none';
  embeddedOutlineEntries = [];
  structureEntries = [];
  bibliographyEntries = [];
  structureIndexVersion = 0;
  structureIndexBuildToken += 1;
  structureIndexBuilding = false;
  equationLabelIndex = null;
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  tocOutlineTargets = null;
  backlinkContext = null;
  backlinkEntries = [];
  textCache = new Map();
  lineCache = new Map();
}

async function runFullDocumentOcrWithRecovery() {
  while (pdfDoc && imageDocumentDetected) {
    try {
      await runFullDocumentOcr();
      hideDocumentOcrGate();
      return 'complete';
    } catch (error) {
      if (isDocumentOcrStoppedError(error)) {
        const action = await waitForDocumentOcrChoice('stopped');
        if (action === 'restart') continue;
        hideDocumentOcrGate();
        return 'skip';
      }
      console.warn('MathReader full-document OCR failed.', error);
      const message = String(error?.message || '').trim();
      const action = await waitForDocumentOcrChoice('error', message || t('OCR could not complete. You can retry or open without text features.', 'OCR 未能完成。你可以重试，或在不启用文本功能的情况下打开。'));
      if (action === 'retry') continue;
      hideDocumentOcrGate();
      return 'skip';
    }
  }
  hideDocumentOcrGate();
  return 'skip';
}

async function enableDocumentOcrFromReader() {
  if (!pdfDoc || !imageDocumentDetected || documentTextFeaturesAvailable() || documentOcrBusy) return;
  const result = await runFullDocumentOcrWithRecovery();
  if (result !== 'complete') {
    documentTextMode = 'unavailable';
    documentTextPreference = 'skip';
    updateDocumentTextAvailabilityUI();
    persistDocumentState();
    return;
  }
  documentTextMode = 'ocr';
  documentTextPreference = 'ocr';
  invalidateTextDerivedIndexesForOcrActivation();
  updateDocumentTextAvailabilityUI();
  setLoading(true, t('Full-document OCR complete · rebuilding document text features…', '全文 OCR 完成 · 正在重新生成文档文本功能……'));
  try {
    await renderCurrentPage();
    await renderReferencePage();
    await renderOutline();
    renderStructureIndex();
    renderBibliographyIndex();
    ensureEquationIndexRendered().catch(() => {});
    scheduleAutomaticStructureIndex();
    persistDocumentState();
  } finally {
    setLoading(false);
  }
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


function documentOcrCacheKey(fileKey = currentFileKey) {
  return fileKey ? `document-ocr-v${DOCUMENT_OCR_CACHE_VERSION}:${fileKey}` : null;
}

function parseHocrBbox(title) {
  const match = String(title || '').match(/\bbbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
  if (!match) return null;
  const values = match.slice(1).map(Number);
  if (values.some((value) => !Number.isFinite(value))) return null;
  return { x0: values[0], y0: values[1], x1: values[2], y1: values[3] };
}

function parseHocrConfidence(title) {
  const match = String(title || '').match(/\bx_wconf\s+(\d+(?:\.\d+)?)/i);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

function pageRecordFromHocr(hocr, fallbackText, width, height, pageNum) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const lines = [];
  const words = [];
  if (hocr) {
    try {
      const doc = new DOMParser().parseFromString(String(hocr), 'text/html');
      for (const lineNode of doc.querySelectorAll('.ocr_line, .ocrx_line')) {
        const lineBox = parseHocrBbox(lineNode.getAttribute('title'));
        const lineWords = [];
        for (const wordNode of lineNode.querySelectorAll('.ocrx_word')) {
          const text = String(wordNode.textContent || '').replace(/\s+/g, ' ').trim();
          const box = parseHocrBbox(wordNode.getAttribute('title'));
          if (!text || !box) continue;
          const confidence = parseHocrConfidence(wordNode.getAttribute('title'));
          lineWords.push({ text, box, confidence });
          words.push({
            text,
            confidence,
            xStartRatio: Math.min(1, Math.max(0, box.x0 / safeWidth)),
            xEndRatio: Math.min(1, Math.max(0, box.x1 / safeWidth)),
            yStartRatio: Math.min(1, Math.max(0, box.y0 / safeHeight)),
            yEndRatio: Math.min(1, Math.max(0, box.y1 / safeHeight))
          });
        }
        if (!lineWords.length) continue;
        const box = lineBox || {
          x0: Math.min(...lineWords.map((item) => item.box.x0)),
          y0: Math.min(...lineWords.map((item) => item.box.y0)),
          x1: Math.max(...lineWords.map((item) => item.box.x1)),
          y1: Math.max(...lineWords.map((item) => item.box.y1))
        };
        let text = '';
        const parts = [];
        for (const item of lineWords) {
          if (text) text += ' ';
          const start = text.length;
          text += item.text;
          parts.push({
            start,
            end: text.length,
            xStartRatio: Math.min(1, Math.max(0, item.box.x0 / safeWidth)),
            xEndRatio: Math.min(1, Math.max(0, item.box.x1 / safeWidth))
          });
        }
        const confidenceValues = lineWords.map((item) => item.confidence).filter(Number.isFinite);
        const confidence = confidenceValues.length ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : null;
        lines.push({
          text,
          parts,
          confidence,
          ratio: Math.min(1, Math.max(0, box.y0 / safeHeight)),
          xStartRatio: Math.min(1, Math.max(0, box.x0 / safeWidth)),
          xEndRatio: Math.min(1, Math.max(0, box.x1 / safeWidth)),
          heightRatio: Math.min(1, Math.max(0.001, (box.y1 - box.y0) / safeHeight))
        });
      }
    } catch (error) {
      console.warn('MathReader could not parse document OCR geometry for page', pageNum, error);
    }
  }
  if (!lines.length) {
    const rawLines = String(fallbackText || '').split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
    rawLines.forEach((text, index) => {
      const ratio = Math.min(0.98, 0.04 + index * (0.92 / Math.max(1, rawLines.length)));
      lines.push({ text, parts: [{ start: 0, end: text.length, xStartRatio: 0.06, xEndRatio: 0.94 }], confidence: null, ratio, xStartRatio: 0.06, xEndRatio: 0.94, heightRatio: 0.018 });
    });
  }
  const text = lines.map((line) => line.text).join(' ').replace(/\s+/g, ' ').trim();
  return { page: pageNum, width: safeWidth, height: safeHeight, text, lines, words };
}

function documentNativeTextSamplePages(pageCount) {
  const count = Math.max(1, Number(pageCount) || 1);
  // Old scanned books frequently have clean catalog/front-matter text but a bad
  // hidden OCR layer in the mathematical body. Sample both the front and the
  // interior instead of accepting the document after the first 80 characters.
  const candidates = [
    1, 2, 3,
    Math.round(1 + (count - 1) * 0.25),
    Math.round(1 + (count - 1) * 0.50),
    Math.round(1 + (count - 1) * 0.75),
    count,
  ];
  return [...new Set(candidates.map((value) => Math.min(count, Math.max(1, value))))].sort((a, b) => a - b);
}

function documentNativeTextQualityStats(rawText) {
  const raw = String(rawText || '');
  const nonSpace = raw.replace(/\s+/g, '');
  const controlChars = (raw.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g) || []).length;
  const replacementChars = (raw.match(/\uFFFD/g) || []).length;
  return {
    rawChars: raw.length,
    nonSpaceChars: nonSpace.length,
    controlChars,
    replacementChars,
  };
}

async function pdfNeedsDocumentOcr(doc = pdfDoc) {
  if (!doc?.numPages) return false;
  let totalChars = 0;
  let rawChars = 0;
  let controlChars = 0;
  let replacementChars = 0;
  let pagesWithText = 0;
  const samplePages = documentNativeTextSamplePages(doc.numPages);

  for (const pageNum of samplePages) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const raw = (content.items || []).map((item) => String(item.str || '')).join(' ');
    const stats = documentNativeTextQualityStats(raw);
    if (stats.nonSpaceChars >= 12) pagesWithText += 1;
    totalChars += stats.nonSpaceChars;
    rawChars += stats.rawChars;
    controlChars += stats.controlChars;
    replacementChars += stats.replacementChars;
  }

  // A scan can contain a nominal OCR/text layer that is much worse than having
  // no text at all.  In particular, broken custom-font maps may decode a large
  // fraction of the page into C0/C1 control bytes.  Such a layer must not bypass
  // the user's Full-document OCR decision merely because it contains many bytes.
  const controlRatio = controlChars / Math.max(1, rawChars);
  const replacementRatio = replacementChars / Math.max(1, rawChars);
  if (rawChars >= 200 && (controlRatio >= 0.16 || replacementRatio >= 0.08)) return true;

  // Old scans sometimes contain page numbers, catalog text, or a few stray hidden
  // glyphs.  Distributed sampling keeps those fragments from suppressing OCR.
  const minimumUsefulPages = Math.min(2, samplePages.length);
  return totalChars < Math.max(24, samplePages.length * 4) || pagesWithText < minimumUsefulPages;
}

async function loadCachedDocumentOcr() {
  const key = documentOcrCacheKey();
  if (!key) return false;
  try {
    const cached = await dbMetaGet(key);
    if (!cached || Number(cached.version) !== DOCUMENT_OCR_CACHE_VERSION || Number(cached.pageCount) !== Number(pdfDoc?.numPages) || !Array.isArray(cached.pages)) return false;
    const map = new Map();
    for (const record of cached.pages) if (record && Number(record.page) >= 1 && Array.isArray(record.lines)) map.set(Number(record.page), record);
    if (map.size !== pdfDoc.numPages) return false;
    documentOcrPages = map;
    documentOcrActive = true;
    return true;
  } catch (error) {
    console.warn('MathReader could not restore cached document OCR.', error);
    return false;
  }
}

async function persistDocumentOcr() {
  const key = documentOcrCacheKey();
  if (!key || !documentOcrActive || documentOcrPages.size !== pdfDoc?.numPages) return;
  try {
    await dbMetaSet(key, {
      version: DOCUMENT_OCR_CACHE_VERSION,
      pageCount: pdfDoc.numPages,
      pages: [...documentOcrPages.values()].sort((a, b) => Number(a.page) - Number(b.page))
    });
  } catch (error) {
    console.warn('MathReader could not cache document OCR.', error);
  }
}

function documentOcrCreateWorker(module) {
  const candidates = [
    module,
    module?.default,
    window.Tesseract,
  ];
  for (const candidate of candidates) {
    if (candidate && typeof candidate.createWorker === 'function') return candidate.createWorker.bind(candidate);
  }
  return null;
}

async function loadDocumentOcrModule() {
  if (documentOcrModulePromise) return documentOcrModulePromise;
  documentOcrModulePromise = (async () => {
    try {
      const module = await import(DOCUMENT_OCR_URL);
      if (documentOcrCreateWorker(module)) return module;
    } catch (error) {
      console.warn('MathReader document OCR ESM loader failed; trying browser build.', error);
    }
    if (documentOcrCreateWorker(null)) return window.Tesseract;
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-mathreader-document-ocr]');
      if (existing) {
        if (documentOcrCreateWorker(null)) { resolve(); return; }
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('Document OCR browser build failed to load.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = DOCUMENT_OCR_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.mathreaderDocumentOcr = 'true';
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error('Document OCR browser build failed to load.')), { once: true });
      document.head.appendChild(script);
    });
    return window.Tesseract || null;
  })();
  try {
    return await documentOcrModulePromise;
  } catch (error) {
    documentOcrModulePromise = null;
    throw error;
  }
}

async function runFullDocumentOcr() {
  if (!pdfDoc?.numPages) return;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const pageCount = sourceDoc.numPages;
  const controller = { cancelled: false, worker: null };
  documentOcrRunController = controller;
  documentOcrBusy = true;
  if (openButton) openButton.disabled = true;
  if (welcomeOpen) welcomeOpen.disabled = true;
  if (fileInput) fileInput.disabled = true;
  updateDocumentTextAvailabilityUI();
  setDocumentOcrProgress(1, pageCount, null, t('Preparing OCR engine…', '正在准备 OCR 引擎……'));
  if (documentOcrPrimary) documentOcrPrimary.onclick = requestStopFullDocumentOcr;

  const ensureCurrent = () => {
    if (controller.cancelled || pdfDoc !== sourceDoc || currentFileKey !== sourceKey) throw makeDocumentOcrStoppedError();
  };

  let worker = null;
  try {
    const module = await loadDocumentOcrModule();
    ensureCurrent();
    const createWorker = documentOcrCreateWorker(module);
    if (typeof createWorker !== 'function') throw new Error(t('The document OCR engine could not be initialized.', '无法初始化全文 OCR 引擎。'));
    worker = await createWorker('eng', 1, {
      logger: (message) => {
        if (!message || message.status !== 'recognizing text' || !Number.isFinite(Number(message.progress))) return;
        const page = Number(controller.currentPage || 1);
        const pct = Math.round(Number(message.progress) * 100);
        setDocumentOcrProgress(page, pageCount, Number(message.progress), t(`Full-document OCR · page ${page}/${pageCount} · ${pct}%`, `全文 OCR · 第 ${page}/${pageCount} 页 · ${pct}%`));
        if (documentOcrPrimary) documentOcrPrimary.onclick = requestStopFullDocumentOcr;
      }
    });
    controller.worker = worker;
    ensureCurrent();
    if (typeof worker.setParameters === 'function') {
      try {
        await worker.setParameters({
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          tessedit_pageseg_mode: '3'
        });
      } catch (error) {
        console.warn('MathReader could not apply document OCR quality parameters.', error);
      }
    }
    const map = new Map();
    for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
      ensureCurrent();
      controller.currentPage = pageNum;
      setDocumentOcrProgress(pageNum, pageCount, 0, t(`Full-document OCR · page ${pageNum}/${pageCount}`, `全文 OCR · 第 ${pageNum}/${pageCount} 页`));
      if (documentOcrPrimary) documentOcrPrimary.onclick = requestStopFullDocumentOcr;
      const page = await sourceDoc.getPage(pageNum);
      ensureCurrent();
      const base = page.getViewport({ scale: 1 });
      const scale = Math.max(2.20, Math.min(3.60, 3200 / Math.max(1, base.width, base.height)));
      const viewport = page.getViewport({ scale });
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = Math.max(1, Math.ceil(viewport.width));
      pageCanvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = pageCanvas.getContext('2d', { alpha: false });
      context.fillStyle = '#fff';
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      ensureCurrent();
      let result;
      try {
        result = await worker.recognize(pageCanvas, {}, { hocr: true });
      } catch (error) {
        if (controller.cancelled) throw makeDocumentOcrStoppedError();
        throw error;
      }
      ensureCurrent();
      const record = pageRecordFromHocr(result?.data?.hocr || '', result?.data?.text || '', pageCanvas.width, pageCanvas.height, pageNum);
      map.set(pageNum, record);
      pageCanvas.width = 1;
      pageCanvas.height = 1;
      await nextFrame();
    }
    ensureCurrent();
    if (map.size !== pageCount) throw new Error(t('Full-document OCR did not complete for every page.', '全文 OCR 未能完成所有页面。'));
    documentOcrPages = map;
    documentOcrActive = true;
    documentTextMode = 'ocr';
    documentTextPreference = 'ocr';
    await persistDocumentOcr();
    setDocumentOcrProgress(pageCount, pageCount, 1, t('Full-document OCR complete · building MathReader indexes…', '全文 OCR 完成 · 正在生成 MathReader 索引……'));
  } catch (error) {
    if (controller.cancelled && !isDocumentOcrStoppedError(error)) throw makeDocumentOcrStoppedError();
    throw error;
  } finally {
    controller.currentPage = 0;
    try { await worker?.terminate?.(); } catch (_) {}
    if (documentOcrRunController === controller) documentOcrRunController = null;
    documentOcrBusy = false;
    if (openButton) openButton.disabled = false;
    if (welcomeOpen) welcomeOpen.disabled = false;
    if (fileInput) fileInput.disabled = false;
    updateDocumentTextAvailabilityUI();
  }
}

async function ensureDocumentTextReady(savedPreference = 'ask') {
  documentOcrPages = new Map();
  documentOcrActive = false;
  documentTextMode = 'native';
  imageDocumentDetected = false;
  documentTextPreference = ['skip', 'ocr', 'native'].includes(savedPreference) ? savedPreference : 'ask';

  if (await loadCachedDocumentOcr()) {
    imageDocumentDetected = true;
    documentTextMode = 'ocr';
    documentTextPreference = 'ocr';
    setLoading(true, t('Restoring scanned-document OCR…', '正在恢复扫描文档 OCR……'));
    return true;
  }

  setLoading(true, t('Checking PDF text layer…', '正在检查 PDF 文本层……'));
  const needsOcr = await pdfNeedsDocumentOcr(pdfDoc);
  if (!needsOcr) {
    documentTextMode = 'native';
    documentTextPreference = 'native';
    return true;
  }

  imageDocumentDetected = true;
  if (savedPreference === 'skip') {
    documentTextMode = 'unavailable';
    documentTextPreference = 'skip';
    return false;
  }

  setLoading(false);
  const action = await waitForDocumentOcrChoice('decision');
  if (action === 'skip') {
    hideDocumentOcrGate();
    documentTextMode = 'unavailable';
    documentTextPreference = 'skip';
    return false;
  }

  const result = await runFullDocumentOcrWithRecovery();
  if (result === 'complete') {
    documentTextMode = 'ocr';
    documentTextPreference = 'ocr';
    setLoading(true, t('Full-document OCR complete · opening document…', '全文 OCR 完成 · 正在打开文档……'));
    return true;
  }
  documentTextMode = 'unavailable';
  documentTextPreference = 'skip';
  return false;
}

function renderDocumentOcrTextLayer(layer, viewport, pageNum) {
  const record = documentOcrPages.get(Number(pageNum));
  if (!record) return false;
  layer.dataset.documentOcr = 'true';
  const fragment = document.createDocumentFragment();
  for (const word of record.words || []) {
    if (!word?.text) continue;
    const span = document.createElement('span');
    // Keep a literal trailing space so browser text selection/search does not
    // concatenate separately positioned OCR words (e.g. "OnTheRicci...").
    span.textContent = `${word.text} `;
    span.style.position = 'absolute';
    span.style.left = `${Math.max(0, Number(word.xStartRatio) || 0) * viewport.width}px`;
    span.style.top = `${Math.max(0, Number(word.yStartRatio) || 0) * viewport.height}px`;
    const wordHeight = Math.max(6, ((Number(word.yEndRatio) || 0) - (Number(word.yStartRatio) || 0)) * viewport.height);
    span.style.fontSize = `${wordHeight}px`;
    span.style.lineHeight = '1';
    span.style.whiteSpace = 'pre';
    span.style.color = 'transparent';
    span.style.transformOrigin = '0 0';
    fragment.append(span);
  }
  layer.append(fragment);
  return true;
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
  updateDocumentTextAvailabilityUI();
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
  const defaults = new Set(['settings-section','ocr-section','note-section','annotations-section','symbol-glossary-section','backlinks-section','undo-section','recovery-section','reading-trail-section','reference-section','shortcuts-section','document-info-section','contents-theorems-section','contents-equations-section','contents-bibliography-section','contents-annotations-section']);
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
  const filterText = node?.dataset?.mapFilterText || node?.textContent || '';
  return normalizeSearchValue(filterText, false).includes(normalizeSearchValue(query, false));
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
  // Current-page dot markers add visual noise without useful navigation value.
  // Keep the selected-location state separate, but remove any legacy current-page marker.
  document.querySelectorAll('#outline-panel .is-current-location').forEach((node) => {
    node.classList.remove('is-current-location');
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
  equationEdits = [];
  equationManualOrder = [];
  draggedEquationKey = null;
  pendingEquationReselectKey = null;
  pendingEquationAddKey = null;
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
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
    equationEdits = Array.isArray(session.equationEdits) ? session.equationEdits.filter((item) => item && typeof item.sourceLabel === 'string' && ['remove','reselect','add'].includes(item.action)).slice(0, 500) : [];
    equationManualOrder = Array.isArray(session.equationManualOrder) ? session.equationManualOrder.map((item) => String(item || '')).filter(Boolean).slice(0, 1000) : [];
    const equationSummary = session.equationIndexSummary;
    if (equationSummary && Number(equationSummary.version) === EQUATION_INDEX_SUMMARY_VERSION
      && Number.isInteger(Number(equationSummary.count)) && Number(equationSummary.count) >= 0) {
      equationIndexKnownCount = Math.min(1000, Number(equationSummary.count));
    } else if (Number(session.version || 0) <= 21 && equationManualOrder.length) {
      // Legacy exports already persisted the canonical equation row order.
      // Reuse its length as a safe legacy count so old exports also avoid the
      // post-import ellipsis; the background index rebuild still verifies it.
      equationIndexKnownCount = equationManualOrder.length;
    }
    embeddedOutlineEdits = Array.isArray(session.embeddedOutlineEdits) ? session.embeddedOutlineEdits.filter((item) => item && typeof item.sourceKey === 'string' && ['remove','reselect'].includes(item.action)).slice(0, 300) : [];
    embeddedOutlineEntries = [];
    structureIndexVersion = Number(session.structureIndexVersion || 0);
    if (structureIndexVersion !== STRUCTURE_INDEX_VERSION) {
      structureEntries = [];
      bibliographyEntries = [];
      structureIndexVersion = 0;
    }
    referencePages = Array.isArray(session.referencePages) ? session.referencePages.map(Number).filter((page, index, values) => page >= 1 && page <= pdfDoc.numPages && values.indexOf(page) === index).slice(0, 4) : [];
    readingBackStack = normalizeReadingTrail(session.readingBackStack);
    if (pinnedPage && !referencePages.includes(pinnedPage)) referencePages.unshift(pinnedPage);
    // Keep inferred-outline filtering strict so formula lines are not mistaken
    // for section headings. Rebuild any pre-v7 inferred outline once, and also
    // discard older entries that lack an in-page ratio.
    if (Number(session.version || 0) < 20 || (inferredOutline.length && inferredOutline.some((entry) => !Number.isFinite(Number(entry.ratio))))) inferredOutline = [];
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
    // First open must always begin on page 1. Legacy per-document page keys can
    // outlive a real session and must not masquerade as a saved reading position.
    // Only a valid session above is authoritative for restoring a later page.
    currentPage = 1;
    const savedPinned = Number(safeGet(stateKey('pinned'), '0'));
    pinnedPage = savedPinned >= 1 && savedPinned <= pdfDoc.numPages ? savedPinned : null;
  }
  renderSymbolGlossary();
  // Refresh the collapsed badge after the session (and its lightweight
  // equation summary) has been restored. This does not build the full index.
  renderEquationIndex();
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
  [prevPage,nextPage,pageNumberInput,zoomIn,zoomOut,zoomLabel,flowButton,mathOcrButton,pinPageButton,pinFromSidebar,addBookmark,buildStructureIndexButton,exportReadingDataButton].forEach((node) => { if (node) node.disabled = !enabled; });
  // Import belongs to the local library, not to the currently open PDF. Keep it
  // available on the empty first screen so a reading-data export can restore a
  // library/session record before the matching PDF is reopened.
  if (importReadingDataButton) importReadingDataButton.disabled = false;
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




