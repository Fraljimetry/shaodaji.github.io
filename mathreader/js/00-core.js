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
const libraryOpenPdf = el('library-open-pdf');
const welcomeOpen = el('welcome-open');
const welcome = el('welcome');
const pdfWorkspace = el('pdf-workspace');
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
const equationDetectionStatus = el('equation-detection-status');
const equationForceOcrButton = el('equation-force-ocr');
const exportReadingDataButton = el('export-reading-data');
const exportDetectionOption = el('export-include-detection');
const exportFullTextOption = el('export-include-full-text');
const importReadingDataButton = el('import-reading-data');
const importReadingInput = el('import-reading-input');
const readingBackButton = el('reading-back');
const crossDocumentReturnButton = el('crossdoc-return');
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
// Explicit page-level OCR evidence for Contents only; native PDF text stays untouched.
let manualIndexOcrPages = new Map();
let manualPageOcrBusy = false;

let documentOcrActive = false;
let documentOcrModulePromise = null;
let documentTextMode = 'native'; // native | ocr | unavailable
let imageDocumentDetected = false;
let documentTextPreference = 'ask'; // native | ocr | skip | ask
let portableContentDetectionActive = false;
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
let equationOrderCustomized = false;
let embeddedOutlineEdits = [];
let embeddedOutlineEntries = [];
let equationIndexBuildPromise = null;
let equationImageAssistPromise = null;
// Automatic detector output is kept separate from user edits so Add/Remove/Reselect
// can be reapplied instantly without rescanning the document or rerunning image OCR.
let equationAutomaticLabelIndex = null;
// Per-document posterior equation OCR evidence. Successful page reads are cached
// independently so one failing page cannot discard already confirmed labels.
let equationSupplementalOcrCache = new Map();
// Only in-memory acknowledgements; the durable authority is the per-page IDB journal.
let equationMarginPersistedPageRefs = new Map();
let equationMarginStorageWarningKey = null;
let equationMarginStorageBlockedKey = null;

// Keep a tiny persisted equation summary so the collapsed Equations
// badge can restore immediately without serializing or eagerly rebuilding the
// full label index. null means the count is not known yet.
let equationIndexKnownCount = null;
// Transient per-document diagnostics: never stored as content-detection evidence.
let equationDetectionGeneration = 0;
let equationDetectionProgress = { phase: 'idle' };
let equationDetectionLastPaint = 0;
let equationConfidenceFilter = 'all';
let draggedEquationKey = null;
let scrollByPage = {};
let referenceScrollByPage = {};
let localLibrary = [];
let dbPromise = null;
let sessionSaveTimer = null;
let sessionSaveInFlight = null;
let sessionWriteGeneration = 0;
// P1 links are user-confirmed and keyed by the source PDF's exact local identity.
// Stored separately from reading-data exports, annotations and automatic indexes.
let confirmedBibliographyLinks = new Map();
let confirmedBibliographyWriteInFlight = false;
let crossDocumentReturnStack = [];
let crossDocumentBusy = false;
let cacheEnabledForCurrent = false;
let restoringSession = false;
let ocrMode = false;
let ocrDrag = null;
let mathOcrPipeline = null;
let mathOcrModulePromise = null;
let mathOcrInitPromise = null;
let mathOcrInitializationFailed = false;
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
// Persisted per document: run bounded image-backed equation recovery once, then require user action.
let equationInitialRecoveryDone = false;
let equationInitialRecoveryAttempted = false;
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
let referencePreviewActiveLink = null;
let referencePreviewDismissalInstalled = false;
const referenceSnapshotCache = new Map();

const t = (en, zh) => root.dataset.lang === 'zh' ? zh : en;
const safeGet = (key, fallback = null) => { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (_) { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
mathOcrEngineMode = safeGet('mathreader-ocr-engine-v8', 'official');
formulaExtractionMode = safeGet('mathreader-formula-method-v1', 'image') === 'vector' ? 'vector' : 'image';

const EXPORT_PREFS_KEY = 'mathreader-export-v1';
let exportPreferences = { includeDetection: true, includeFullDocumentText: false };
const DISPLAY_PREFS_KEY = 'mathreader-display-v3';
const LEGACY_DISPLAY_PREFS_KEYS = ['mathreader-display-v2','mathreader-display-v1'];
const SEARCH_PREFS_KEY = 'mathreader-search-options-v1';
const WORKSPACE_COLLAPSE_KEY = 'mathreader-workspace-collapse-v3';
const PANEL_ORDER_KEY = 'mathreader-panel-order-v1';
const STRUCTURE_INDEX_VERSION = 55;
const EQUATION_INDEX_SUMMARY_VERSION = 28;
// Bounded, shared limit: detection, restoration, manual edits and Undo agree.
const MAX_INFERRED_OUTLINE_ENTRIES = 1200;
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
  const documentId = currentFileKey;
  recoverySnapshotTimer = setTimeout(() => {
    // A deferred recovery snapshot must never land in a different document.
    if (documentId !== currentFileKey || restoringSession) return;
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

// Global, local-only export preferences. Never attach these to a PDF session:
// importing another reader's data must not silently change this user's choices.
function loadExportPreferences() {
  let saved = null;
  try { saved = JSON.parse(safeGet(EXPORT_PREFS_KEY, 'null')); } catch (_) { saved = null; }
  exportPreferences = {
    includeDetection: saved?.includeDetection !== false,
    includeFullDocumentText: saved?.includeFullDocumentText === true,
  };
  if (exportDetectionOption) exportDetectionOption.checked = exportPreferences.includeDetection;
  if (exportFullTextOption) exportFullTextOption.checked = exportPreferences.includeFullDocumentText;
}
function persistExportPreferences() {
  exportPreferences = {
    includeDetection: exportDetectionOption ? Boolean(exportDetectionOption.checked) : exportPreferences.includeDetection,
    includeFullDocumentText: exportFullTextOption ? Boolean(exportFullTextOption.checked) : exportPreferences.includeFullDocumentText,
  };
  safeSet(EXPORT_PREFS_KEY, JSON.stringify(exportPreferences));
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

// Page-journal OCR evidence is queried by a bounded key range; unlike a single
// multi-megabyte snapshot, a completed page can survive an interrupted scan.
async function dbMetaEntriesByPrefix(prefix) {
  const db = await openLocalDb();
  const tx = db.transaction('meta', 'readonly');
  const cursor = tx.objectStore('meta').openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  return new Promise((resolve, reject) => {
    const records = [];
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (!entry) { resolve(records); return; }
      if (records.length >= 1024) { reject(new Error('Too many stored OCR page records')); return; }
      records.push(entry.value);
      entry.continue();
    };
    cursor.onerror = () => reject(cursor.error || new Error('Could not list OCR page records'));
    tx.onabort = () => reject(tx.error || new Error('OCR page record transaction aborted'));
  });
}

async function dbMetaDeleteByPrefix(prefix) {
  const db = await openLocalDb();
  const tx = db.transaction('meta', 'readwrite');
  const cursor = tx.objectStore('meta').openCursor(IDBKeyRange.bound(prefix, `${prefix}\uffff`));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Could not delete OCR page records'));
    tx.onerror = () => reject(tx.error || new Error('OCR page deletion failed'));
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (entry) { entry.delete(); entry.continue(); }
    };
    cursor.onerror = () => reject(cursor.error || new Error('Could not enumerate OCR page records'));
  });
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
  equationInitialRecoveryDone = false;
  equationInitialRecoveryAttempted = false;
  // Never leave one document's indexes visible while another document is opening/OCRing.
  inferredOutline = [];
  inferredOutlineDetectionDone = false;
  inferredOutlineBuildPromise = null;
  structureIndexBuildToken += 1;
  outlineMode = 'none';
  structureEntries = [];
  bibliographyEntries = [];
  equationLabelIndex = null;
  equationImageAssistPromise = null;
  equationAutomaticLabelIndex = null;
  equationSupplementalOcrCache = new Map();
  equationMarginPersistedPageRefs = new Map();
  equationMarginStorageBlockedKey = null;
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  resetEquationDetectionProgress();
  equationEdits = [];
  equationManualOrder = [];
  equationOrderCustomized = false;
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
    version: 23,
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
    // Imported detection snapshots must survive later persistence/reopen even if
    // the OCR text cache is unavailable.
    portableContentDetection: portableContentDetectionActive,
    equationEdits,
    equationManualOrder,
    equationOrderCustomized,
    equationInitialRecoveryDone,
    // Keep the automatic equation detections themselves, not only their count.
    // This makes reading-data exports portable: a re-import can render the
    // detected equation rows immediately instead of depending on a fresh text
    // extraction / OCR pass. The detector version gates stale snapshots.
    equationIndexSnapshot: snapshotEquationIndexForPersistence(equationAutomaticLabelIndex || equationLabelIndex),
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

function storedEquationOrderMatchesOldAutomaticSnapshot(order, snapshot) {
  // Legacy equationManualOrder was filled even when the user had never dragged
  // a row. Detector upgrades must not preserve an obsolete *automatic* order
  // forever, but must preserve actual user reordering and equation edits.
  if (!Array.isArray(order) || !order.length || !Array.isArray(snapshot?.rows) || !snapshot.rows.length) return false;
  const best = new Map();
  for (const row of snapshot.rows) {
    const label = normalizedEquationLabel(row?.label || '');
    if (!label || !Number.isFinite(Number(row?.page))) continue;
    const score = Number(row?.confidence);
    const previous = best.get(label);
    if (!previous || (Number.isFinite(score) && score > Number(previous.confidence || 0))) best.set(label, row);
  }
  const rows = [...best.entries()].map(([label, row]) => ({ ...row, label }));
  rows.sort((a, b) => {
    const delta = Number(a.page) - Number(b.page);
    if (delta) return delta;
    if (a.equationTwoColumn && b.equationTwoColumn
        && Number.isInteger(a.equationColumnIndex) && Number.isInteger(b.equationColumnIndex)
        && a.equationColumnIndex !== b.equationColumnIndex) return a.equationColumnIndex - b.equationColumnIndex;
    return (Number(a.ratio) || 0) - (Number(b.ratio) || 0) || a.label.localeCompare(b.label);
  });
  const oldAutomatic = rows.map((row) => `label:${normalizedEquationLabel(row.label)}`);
  return oldAutomatic.length === order.length && oldAutomatic.every((key, index) => key === order[index]);
}

function snapshotEquationIndexForPersistence(index) {
  if (!(index instanceof Map) || !index.size) return null;
  const rows = [];
  for (const [rawLabel, candidates] of index.entries()) {
    const label = normalizedEquationLabel(rawLabel);
    if (!label || label === '()') continue;
    for (const candidate of Array.isArray(candidates) ? candidates : []) {
      if (!candidate) continue;
      const page = Number(candidate.page);
      if (!Number.isFinite(page) || page < 1) continue;
      const row = {
        label,
        page: Math.floor(page),
        ratio: Math.min(1, Math.max(0, Number(candidate.ratio) || 0)),
        text: String(candidate.text || label).slice(0, 500),
        confidence: Number.isFinite(Number(candidate.confidence)) ? Number(candidate.confidence) : 20,
      };
      for (const key of ['xStartRatio','xEndRatio','candidateXStartRatio','candidateXEndRatio']) {
        if (Number.isFinite(Number(candidate[key]))) row[key] = Math.min(1, Math.max(0, Number(candidate[key])));
      }
      for (const key of ['ocrSource','equationTwoColumn','manualReselect','manualAdd','meticulousPageVerified','ocrGeometryMeasured','marginLocationVerifiedV385','marginLocationVerifiedV386']) {
        if (candidate[key] === true) row[key] = true;
      }
      if (Number.isInteger(Number(candidate.equationColumnIndex))) row.equationColumnIndex = Number(candidate.equationColumnIndex);
      if (candidate.manualEditId) row.manualEditId = String(candidate.manualEditId).slice(0, 120);
      rows.push(row);
      if (rows.length >= 5000) break;
    }
    if (rows.length >= 5000) break;
  }
  return rows.length ? { version: EQUATION_INDEX_SUMMARY_VERSION, rows } : null;
}

function restoreEquationIndexFromPersistence(snapshot, { portable = false } = {}) {
  if (!snapshot || !Array.isArray(snapshot.rows)) return null;
  // Ordinary local caches remain detector-version gated. Reading-data imports are
  // portable user data: their normalized row schema stays usable even after a
  // future detector-version bump.
  if (!portable && Number(snapshot.version) !== EQUATION_INDEX_SUMMARY_VERSION) return null;
  const index = new Map();
  for (const raw of snapshot.rows.slice(0, 5000)) {
    const label = normalizedEquationLabel(raw?.label || '');
    const page = Number(raw?.page);
    if (!label || label === '()' || !Number.isFinite(page) || page < 1) continue;
    const candidate = {
      page: Math.floor(page),
      ratio: Math.min(1, Math.max(0, Number(raw?.ratio) || 0)),
      text: String(raw?.text || label).slice(0, 500),
      confidence: Number.isFinite(Number(raw?.confidence)) ? Number(raw.confidence) : 20,
    };
    for (const key of ['xStartRatio','xEndRatio','candidateXStartRatio','candidateXEndRatio']) {
      if (Number.isFinite(Number(raw?.[key]))) candidate[key] = Math.min(1, Math.max(0, Number(raw[key])));
    }
    for (const key of ['ocrSource','equationTwoColumn','manualReselect','manualAdd','meticulousPageVerified','ocrGeometryMeasured','marginLocationVerifiedV385','marginLocationVerifiedV386']) {
      if (raw?.[key] === true) candidate[key] = true;
    }
    if (Number.isInteger(Number(raw?.equationColumnIndex))) candidate.equationColumnIndex = Number(raw.equationColumnIndex);
    if (raw?.manualEditId) candidate.manualEditId = String(raw.manualEditId).slice(0, 120);
    const candidates = index.get(label) || [];
    candidates.push(candidate);
    index.set(label, candidates);
  }
  return index.size ? index : null;
}

function exportedDocumentOcrSnapshot() {
  if (!documentOcrActive || !(documentOcrPages instanceof Map) || !pdfDoc?.numPages || documentOcrPages.size !== pdfDoc.numPages) return null;
  return {
    version: DOCUMENT_OCR_CACHE_VERSION,
    pageCount: pdfDoc.numPages,
    pages: jsonClone([...documentOcrPages.values()].sort((a, b) => Number(a.page) - Number(b.page)), []),
  };
}

function normalizedImportedDocumentOcrSnapshot(snapshot, expectedPageCount = null) {
  if (!snapshot || Number(snapshot.version) !== DOCUMENT_OCR_CACHE_VERSION || !Array.isArray(snapshot.pages)) return null;
  const pageCount = Number(snapshot.pageCount);
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 10000) return null;
  if (Number.isInteger(Number(expectedPageCount)) && Number(expectedPageCount) > 0 && pageCount !== Number(expectedPageCount)) return null;
  const seen = new Set();
  const pages = [];
  for (const raw of snapshot.pages) {
    const page = Number(raw?.page);
    if (!Number.isInteger(page) || page < 1 || page > pageCount || seen.has(page) || !Array.isArray(raw?.lines)) return null;
    seen.add(page);
    pages.push(raw);
  }
  if (seen.size !== pageCount) return null;
  pages.sort((a, b) => Number(a.page) - Number(b.page));
  return { version: DOCUMENT_OCR_CACHE_VERSION, pageCount, pages: jsonClone(pages, []) };
}

async function persistImportedDocumentOcr(snapshot, fileKey, expectedPageCount = null) {
  const normalized = normalizedImportedDocumentOcrSnapshot(snapshot, expectedPageCount);
  const key = documentOcrCacheKey(fileKey);
  if (!normalized || !key) return false;
  await dbMetaSet(key, normalized);
  return true;
}

function readingDataContentDetectionSnapshot(session) {
  return {
    version: 1,
    structureIndexVersion: Number(structureIndexVersion) || 0,
    equationIndexVersion: EQUATION_INDEX_SUMMARY_VERSION,
    structure: jsonClone(inferredOutline, []),
    results: jsonClone(structureEntries, []),
    equations: jsonClone(session?.equationIndexSnapshot, null),
    bibliography: jsonClone(bibliographyEntries, []),
  };
}

function importedSessionHasPortableDetectionSnapshot(session) {
  if (!session || typeof session !== 'object') return false;
  if (Array.isArray(session.inferredOutline) && session.inferredOutline.length) return true;
  if (Array.isArray(session.structureEntries) && session.structureEntries.length) return true;
  if (Array.isArray(session.bibliographyEntries) && session.bibliographyEntries.length) return true;
  return Boolean(restoreEquationIndexFromPersistence(session.equationIndexSnapshot, { portable: true }));
}

function mergePortableContentDetectionIntoSession(rawSession, detection) {
  const session = jsonClone(rawSession, {}) || {};
  const explicitDetection = Boolean(detection && Number(detection.version) === 1);
  if (explicitDetection) {
    const detectedStructureVersion = Number(detection.structureIndexVersion || 0);
    if (Array.isArray(detection.structure)) session.inferredOutline = jsonClone(detection.structure, []);
    if (Array.isArray(detection.results)) session.structureEntries = jsonClone(detection.results, []);
    if (Array.isArray(detection.bibliography)) session.bibliographyEntries = jsonClone(detection.bibliography, []);
    if (detectedStructureVersion > 0) session.structureIndexVersion = detectedStructureVersion;
    if (detection.equations && Array.isArray(detection.equations.rows)) {
      session.equationIndexSnapshot = jsonClone(detection.equations, null);
      const restored = restoreEquationIndexFromPersistence(session.equationIndexSnapshot, { portable: true });
      if (restored) session.equationIndexSummary = { version: EQUATION_INDEX_SUMMARY_VERSION, count: restored.size };
    }
  }
  // v334-and-earlier exports already carried Results/Bibliography/Structure in
  // session fields even though they did not yet have an explicit contentDetection
  // block. Import is the portability boundary: preserve those saved detections
  // instead of treating them like an ordinary stale local detector cache.
  if (explicitDetection || importedSessionHasPortableDetectionSnapshot(session)) session.portableContentDetection = true;
  return session;
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
  const generation = ++sessionWriteGeneration;
  const id = currentFileKey;
  const snapshot = snapshotSession();
  const page = currentPage;
  sessionSaveTimer = setTimeout(() => {
    sessionSaveTimer = null;
    if (id !== currentFileKey || generation !== sessionWriteGeneration) return;
    const write = (async () => {
      try {
        const record = await dbGet('documents', id);
        if (!record || id !== currentFileKey || generation !== sessionWriteGeneration) return;
        record.session = snapshot;
        record.lastPage = page;
        record.updatedAt = Date.now();
        await dbPut('documents', record);
        if (id === currentFileKey) await refreshLocalLibrary();
      } catch (error) {
        console.warn('MathReader could not update its local session cache.', error);
      }
    })();
    sessionSaveInFlight = write;
    void write.finally(() => { if (sessionSaveInFlight === write) sessionSaveInFlight = null; });
  }, 300);
}

async function flushCurrentDocumentSession() {
  if (!pdfDoc || !currentFileKey) return;
  // Save localStorage and capture the *current* page anchor before switching PDFs.
  persistDocumentState();
  clearTimeout(sessionSaveTimer);
  sessionSaveTimer = null;
  ++sessionWriteGeneration;
  if (sessionSaveInFlight) await sessionSaveInFlight;
  if (!cacheEnabledForCurrent) return;
  const id = currentFileKey;
  const snapshot = snapshotSession();
  const page = currentPage;
  const record = await dbGet('documents', id);
  if (!record) return;
  record.session = snapshot;
  record.lastPage = page;
  record.updatedAt = Date.now();
  await dbPut('documents', record);
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
  historyCount.textContent = String(localLibrary.length + pendingPdfFiles.length);
  historyEmpty.classList.toggle('is-hidden', localLibrary.length + pendingPdfFiles.length > 0);
  welcomeRecent.classList.toggle('is-hidden', (localLibrary.length + pendingPdfFiles.length) === 0 || Boolean(pdfDoc));

  // New multi-selections appear one by one in History immediately. Only the
  // first opens automatically; remaining files have no IndexedDB/OCR work.
  for (const entry of pendingPdfFiles) {
    const wrapper = document.createElement('div'); wrapper.className = 'history-entry';
    const row = document.createElement('div'); row.className = 'history-item';
    const open = document.createElement('button'); open.type = 'button'; open.className = 'history-open';
    const title = document.createElement('strong'); title.textContent = entry.file.name;
    const meta = document.createElement('span'); meta.className = 'history-meta';
    meta.textContent = entry.id === openingPendingPdfId ? t('Opening…', '正在打开…') : t('Not loaded', '尚未加载');
    open.append(title, meta);
    open.disabled = pendingPdfBusy || documentOcrInteractionLocked();
    open.addEventListener('click', () => activatePendingPdf(entry.id));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'history-remove';
    remove.textContent = '×'; remove.title = t('Remove from list', '从列表移除');
    remove.setAttribute('aria-label', t('Remove from list', '从列表移除'));
    remove.disabled = pendingPdfBusy;
    remove.addEventListener('click', () => removePendingPdf(entry.id));
    row.append(open, remove); wrapper.append(row); historyList.append(wrapper);
  }

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
        // Forgetting a source PDF must also forget its private, user-confirmed
        // bibliography mappings. Inbound links in other papers are simply
        // unavailable until explicitly relinked; never guess a replacement.
        try { await dbDelete('meta', bibliographyLinkStorageKey(record.id)); }
        catch (error) { console.warn('Could not forget local PDF link metadata.', error); }
        try {
          await dbMetaDeleteByPrefix(equationMarginPagePrefix(record.id));
          await dbDelete('meta', equationMarginEvidenceCacheKey(record.id));
          if (currentFileKey === record.id) {
            equationSupplementalOcrCache = new Map();
            equationMarginPersistedPageRefs = new Map();
          }
        } catch (error) { console.warn('Could not forget cached equation-margin OCR evidence.', error); }
        if (currentFileKey === record.id) confirmedBibliographyLinks = new Map();
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
    if (welcomeOpen) welcomeOpen.disabled = false;
    if (fileInput) fileInput.disabled = false;
  }
}

// Performance-only helpers. These preserve the original detector ordering and
// acceptance rules while avoiding repeated linear scans / serial I/O waits.
function findFirstRowInYBuckets(rowBuckets, y, tolerance, bucketSize = 4) {
  const safeBucketSize = Math.max(0.5, Number(bucketSize) || 4);
  const targetY = Number(y) || 0;
  const maxDelta = Math.max(0, Number(tolerance) || 0);
  const center = Math.floor(targetY / safeBucketSize);
  const radius = Math.max(1, Math.ceil(maxDelta / safeBucketSize) + 1);
  let best = null;
  let bestOrder = Infinity;
  for (let bucket = center - radius; bucket <= center + radius; bucket += 1) {
    for (const row of rowBuckets.get(bucket) || []) {
      if (Math.abs((Number(row.y) || 0) - targetY) > maxDelta) continue;
      const order = Number(row._rowOrder);
      if (order < bestOrder) { best = row; bestOrder = order; }
    }
  }
  return best;
}

function addRowToYBuckets(rowBuckets, row, bucketSize = 4) {
  const safeBucketSize = Math.max(0.5, Number(bucketSize) || 4);
  const bucket = Math.floor((Number(row?.y) || 0) / safeBucketSize);
  const list = rowBuckets.get(bucket) || [];
  list.push(row);
  rowBuckets.set(bucket, list);
}

const nativePageTextCacheByDocument = new WeakMap();
const NATIVE_PAGE_TEXT_CACHE_LIMIT = 24;

function nativePageTextData(sourceDoc, pageNum) {
  if (!sourceDoc || !Number.isFinite(Number(pageNum))) return Promise.reject(new Error('PDF page is unavailable.'));
  let cache = nativePageTextCacheByDocument.get(sourceDoc);
  if (!cache) {
    cache = new Map();
    nativePageTextCacheByDocument.set(sourceDoc, cache);
  }
  const key = Number(pageNum);
  const existing = cache.get(key);
  if (existing) {
    // Map insertion order doubles as a tiny LRU. Touch on reuse so concurrently
    // advancing detectors share nearby pages without retaining an entire book.
    cache.delete(key);
    cache.set(key, existing);
    return existing;
  }
  const pending = (async () => {
    const page = await sourceDoc.getPage(key);
    const content = await page.getTextContent();
    return { page, content };
  })();
  cache.set(key, pending);
  pending.catch(() => {
    if (cache.get(key) === pending) cache.delete(key);
  });
  while (cache.size > NATIVE_PAGE_TEXT_CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
  return pending;
}

async function* orderedPrefetch(values, loader, depth = 3) {
  const items = Array.from(values || []);
  const pending = new Map();
  const lookahead = Math.max(1, Math.floor(Number(depth) || 1));
  let nextToSchedule = 0;
  const schedule = () => {
    while (nextToSchedule < items.length && pending.size < lookahead) {
      const index = nextToSchedule++;
      const item = items[index];
      const outcome = Promise.resolve()
        .then(() => loader(item, index))
        .then((value) => ({ ok: true, value }), (error) => ({ ok: false, error }));
      pending.set(index, outcome);
    }
  };
  schedule();
  for (let index = 0; index < items.length; index += 1) {
    const outcome = await pending.get(index);
    pending.delete(index);
    schedule();
    if (!outcome?.ok) throw outcome?.error || new Error('Prefetch failed');
    yield { item: items[index], index, value: outcome.value };
  }
}

function documentOcrInteractionLocked() {
  return documentOcrBusy || Boolean(documentOcrGate && !documentOcrGate.classList.contains('is-hidden'));
}

function configureDocumentOcrGate(mode, detail = '') {
  if (!documentOcrGate) return;
  documentOcrGate.classList.remove('is-hidden');
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
  if (documentOcrRunController?.cancelled) return;
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

function releaseDocumentOcrCanvas(controller, canvas) {
  if (!canvas) return;
  try { canvas.width = 1; canvas.height = 1; } catch (_) {}
  controller?.canvases?.delete(canvas);
}

function terminateDocumentOcrWorker(controller, worker) {
  if (!worker) return;
  // Tesseract termination is asynchronous, and may itself never settle after
  // its worker has crashed. Never block the reader's Stop/Retry UI on it.
  if (controller?.terminatedWorkers?.has(worker)) return;
  controller?.terminatedWorkers?.add(worker);
  Promise.resolve().then(() => worker.terminate?.()).catch(() => {});
}

async function awaitDocumentOcrCancelable(controller, pending, onLateValue = null) {
  // A terminated Tesseract worker does not always settle its recognize()
  // promise; similarly a PDF.js render or an engine download can remain
  // pending. The stop signal must independently unblock every awaited stage.
  const outcome = Promise.resolve(pending).then(
    (value) => {
      if (controller.cancelled && typeof onLateValue === 'function') {
        try { onLateValue(value); } catch (_) {}
      }
      return { ok: true, value };
    },
    (error) => ({ ok: false, error })
  );
  const winner = await Promise.race([outcome, controller.stopSignal]);
  if (controller.cancelled || winner?.stopped) throw makeDocumentOcrStoppedError();
  if (!winner?.ok) throw winner?.error || new Error('Document OCR operation failed.');
  return winner.value;
}

function requestStopFullDocumentOcr() {
  const controller = documentOcrRunController;
  if (!controller || controller.cancelled || controller.completedRecognition) return;
  controller.cancelled = true;
  if (documentOcrPrimary) documentOcrPrimary.disabled = true;
  if (documentOcrProgressText) documentOcrProgressText.textContent = t('Stopping OCR…', '正在停止 OCR……');
  // Resolve first so the UI can leave progress mode even when teardown stalls.
  controller.resolveStop?.({ stopped: true });
  for (const task of controller.renderTasks || []) {
    try { task.cancel?.(); } catch (_) {}
  }
  for (const canvas of [...(controller.canvases || [])]) releaseDocumentOcrCanvas(controller, canvas);
  terminateDocumentOcrWorker(controller, controller.worker);
}

function updateDocumentTextAvailabilityUI() {
  const unavailable = Boolean(pdfDoc && imageDocumentDetected && !documentTextFeaturesAvailable());
  const importedDetectionFallback = unavailable && portableContentDetectionActive;
  documentTextUnavailable?.classList.toggle('is-hidden', !unavailable);
  outlinePanel?.classList.toggle('text-unavailable', unavailable && !importedDetectionFallback);
  if (unavailable && documentTextUnavailable) {
    const heading = documentTextUnavailable.querySelector('strong');
    const copy = documentTextUnavailable.querySelector('p');
    if (importedDetectionFallback) {
      if (heading) heading.textContent = t('Imported detections restored', '已恢复导入的检测结果');
      if (copy) copy.textContent = t(
        'Saved Structure, Results, Equations, and Bibliography remain available. Run document OCR only to restore Search and document text features.',
        '已保留结构、结果、公式和参考文献。仅需运行全文 OCR 即可恢复搜索和文档文本功能。'
      );
    } else {
      if (heading) heading.textContent = t('Text unavailable', '文本不可用');
      if (copy) copy.textContent = t(
        'This scanned document is open without full-document OCR. Run OCR to enable Contents and document text features.',
        '此扫描文档当前未运行全文 OCR。运行 OCR 后才能启用目录和文档文本功能。'
      );
    }
  }
  if (contentsRunDocumentOcr) contentsRunDocumentOcr.disabled = !unavailable || documentOcrBusy;

  if (searchForm) {
    const equationOnly = unavailable && Boolean(searchEquations?.checked);
    searchForm.classList.toggle('text-unavailable', unavailable && !equationOnly);
    const submit = searchForm.querySelector('button[type="submit"]');
    if (searchEquations) searchEquations.disabled = false;
    if (searchInput) searchInput.disabled = unavailable && !equationOnly;
    if (submit) submit.disabled = unavailable && !equationOnly;
    for (const node of [searchMatchCase, searchWholeWord, searchFuzzy]) { if (node) node.disabled = unavailable; }
  }
  if (unavailable) {
    const equationOnly = Boolean(searchEquations?.checked);
    if (!equationOnly) searchResults?.replaceChildren();
    if (searchStatus && !searchInput?.value?.trim()) searchStatus.textContent = equationOnly
      ? t('Document text is unavailable. Saved/extracted equation search remains available.', '文档文本不可用。仍可搜索已保存/已提取的公式。')
      : t('Document text is unavailable. Run full-document OCR from Contents to enable text search.', '文档文本不可用。请在“目录”中运行全文 OCR 后再使用文本搜索。');
  } else if (searchStatus && !searchInput?.value?.trim()) {
    searchStatus.textContent = '';
  }
}

function clearTextDerivedIndexesForUnavailableDocument() {
  // Portable reading-data imports may already contain a verified document map.
  // Preserve that snapshot even when OCR page text is unavailable; page/ratio
  // navigation remains valid and the user must not lose imported detections.
  if (portableContentDetectionActive) {
    backlinkContext = null;
    backlinkEntries = [];
    try { backlinksList?.replaceChildren(); } catch (_) {}
    if (backlinksCount) backlinksCount.textContent = '0';
    renderStructureIndex();
    renderBibliographyIndex();
    renderEquationIndex();
    return;
  }
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
  equationImageAssistPromise = null;
  equationAutomaticLabelIndex = null;
  equationSupplementalOcrCache = new Map();
  equationMarginPersistedPageRefs = new Map();
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  resetEquationDetectionProgress();
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
  portableContentDetectionActive = false;
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
  equationImageAssistPromise = null;
  equationAutomaticLabelIndex = null;
  equationSupplementalOcrCache = new Map();
  equationMarginPersistedPageRefs = new Map();
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  resetEquationDetectionProgress();
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


// A right-click page scan is deliberately independent of full-document OCR.
// It augments Contents indexing without changing selectable PDF text or the
// document-wide OCR preference. Never publish partial/failed OCR evidence.
function manualIndexOcrCacheKey(fileKey = currentFileKey) {
  return fileKey ? `page-index-ocr-v1:${fileKey}` : null;
}
async function loadManualIndexOcrPages() {
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  manualIndexOcrPages = new Map();
  const key = manualIndexOcrCacheKey(sourceKey);
  if (!key || !sourceDoc?.numPages) return;
  try {
    const saved = await dbMetaGet(key);
    // IndexedDB resolution can arrive after another PDF has become active.
    // Stage the restored pages locally; publish only for their original PDF.
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return;
    if (Number(saved?.pageCount) !== sourceDoc.numPages || !Array.isArray(saved?.pages)) return;
    const restored = new Map();
    for (const record of saved.pages) {
      const page = Number(record?.page);
      if (Number.isInteger(page) && page >= 1 && page <= sourceDoc.numPages && Array.isArray(record?.lines)) {
        restored.set(page, record);
      }
    }
    manualIndexOcrPages = restored;
  } catch (error) { console.warn('MathReader page OCR cache unavailable.', error); }
}
let manualPageIndexOcrStatusTimer = null;
function manualPageIndexOcrMessage(message, dismissAfterMs = 0) {
  if (manualPageIndexOcrStatusTimer !== null) {
    clearTimeout(manualPageIndexOcrStatusTimer);
    manualPageIndexOcrStatusTimer = null;
  }
  if (!manualPageIndexOcrStatus) return;
  manualPageIndexOcrStatus.textContent = message;
  manualPageIndexOcrStatus.classList.remove('is-hidden');
  if (dismissAfterMs > 0) {
    manualPageIndexOcrStatusTimer = setTimeout(() => {
      manualPageIndexOcrStatusTimer = null;
      manualPageIndexOcrStatus.classList.add('is-hidden');
    }, dismissAfterMs);
  }
}
// Monotonic page evidence: an OCR pass may add observations, never erase
// earlier manual scans or native PDF text. Keep distinct conflicting reads
// for later verification rather than guessing which one is correct.
function mergePageIndexOcrEvidence(existing, incoming, nativeLines = []) {
  const merged = [];
  const identity = (line) => String(line?.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  for (const line of [...(existing?.lines || []), ...nativeLines, ...(incoming?.lines || [])]) {
    if (!identity(line)) continue;
    const duplicate = merged.some((old) => identity(old) === identity(line) &&
      Math.abs(Number(old.ratio || 0) - Number(line.ratio || 0)) < 0.025 &&
      Math.abs(Number(old.xStartRatio || 0) - Number(line.xStartRatio || 0)) < 0.075);
    if (!duplicate) merged.push({ ...line });
  }
  // v381-v382 could cache line coordinates at ratio=1 after a canvas was
  // reset. Correct an exact text observation using newly measured geometry,
  // without discarding the recognized text or a distinct legitimate repeat.
  for (const fresh of incoming?.lines || []) {
    if (!identity(fresh) || !Number.isFinite(fresh?.ratio) || fresh.ratio >= 0.999) continue;
    for (let i = merged.length - 1; i >= 0; i -= 1) {
      const old = merged[i];
      if (old === fresh || identity(old) !== identity(fresh) || Number(old.ratio) < 0.999) continue;
      if (Math.abs(Number(old.xStartRatio || 0) - Number(fresh.xStartRatio || 0)) > 0.075) continue;
      merged[i] = { ...old, ...fresh };
    }
  }
  const uniqueLines = [];
  for (const line of merged) {
    const duplicate = uniqueLines.some((old) => identity(old) === identity(line) &&
      Math.abs(Number(old.ratio || 0) - Number(line.ratio || 0)) < 0.025 &&
      Math.abs(Number(old.xStartRatio || 0) - Number(line.xStartRatio || 0)) < 0.075);
    if (!duplicate) uniqueLines.push(line);
  }
  uniqueLines.sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0) || Number(a.xStartRatio || 0) - Number(b.xStartRatio || 0));
  const vettedReplacements = new Set((incoming?.equationMarginEvidence || [])
    .filter((item) => item?.marginLocationVerifiedV385 === true)
    .map((item) => `${item.page}:${item.label}`));
  const correctedFrameReplacements = new Set((incoming?.equationMarginEvidence || [])
    .filter((item) => item?.marginLocationVerifiedV386 === true)
    .map((item) => `${item.page}:${item.label}`));
  const margins = new Map();
  // A new individually verified v386 location is the replacement observation
  // for that SAME page/label, even if the earlier observation also carried a
  // v386 marker. This keeps repeated rescans idempotent while retaining all
  // other page labels and all text observations.
  const preservedMargins = (existing?.equationMarginEvidence || []).filter((item) =>
    !correctedFrameReplacements.has(`${item?.page}:${item?.label}`));
  for (const item of [...preservedMargins, ...(incoming?.equationMarginEvidence || [])]) {
    // Re-scanning an existing *label* can repair its stale target without
    // breaking the non-destructive guarantee for the index and other labels.
    if (correctedFrameReplacements.has(`${item?.page}:${item?.label}`)
        && item?.marginLocationVerifiedV386 !== true) continue;
    if (vettedReplacements.has(`${item?.page}:${item?.label}`)
        && item?.marginLocationVerifiedV385 !== true) continue;
    const key = `${item?.page}:${item?.label}:${Math.round(Number(item?.ratio || 0) * 500)}`;
    if (!margins.has(key)) margins.set(key, item);
  }
  // Older equation-margin scans normalized against a canvas already reset to
  // height=1, producing ratio=1 for unrelated labels. Once a fresh scan
  // supplies genuine geometry for the same page/label, retire only that
  // unusable position; preserve the label and all valid observations.
  const marginItems = [...margins.values()];
  const repairedMargins = marginItems.filter((item) =>
    Number(item?.ratio) < 0.999 || !marginItems.some((other) =>
      other !== item && Number(other?.page) === Number(item?.page) &&
      String(other?.label) === String(item?.label) &&
      Number.isFinite(Number(other?.ratio)) && Number(other?.ratio) < 0.999
    )
  );
  const words = [];
  const seenWords = new Set();
  for (const word of [...(existing?.words || []), ...(incoming?.words || [])]) {
    const text = String(word?.text || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    // The same Tesseract word observation must not be saved indefinitely on
    // every manual rescan. Geometry is part of identity, so repeated words in
    // different parts of a mathematical page are still independent evidence.
    const coord = (value) => Number.isFinite(Number(value)) ? Math.round(Number(value) * 200) : '?';
    const key = `${text.toLowerCase()}|${coord(word.xStartRatio)}|${coord(word.yStartRatio)}|${coord(word.xEndRatio)}|${coord(word.yEndRatio)}`;
    if (seenWords.has(key)) continue;
    seenWords.add(key);
    words.push({ ...word });
  }
  return {
    ...incoming,
    lines: uniqueLines,
    text: uniqueLines.map((line) => line.text).join(' ').replace(/\s+/g, ' ').trim(),
    words,
    equationMarginEvidence: repairedMargins
  };
}

// A meticulous scan updates Contents; it is not a navigation command. Capture
// both the PDF reading point and the independently scrolling Contents lists so
// replacement of their DOM rows cannot move the reader or lose the user's
// place in Equations. Deliberate navigation while OCR is running wins.
function captureMeticulousOcrReadingPosition() {
  if (!pdfDoc || !primaryCanvasWrap) return null;
  const flow = readingFlow;
  const scrollers = [
    el('left-sidebar'), el('outline-list'), structureIndex,
    equationIndex, bibliographyIndex
  ].filter(Boolean).map((element) => {
    const state = { element, top: element.scrollTop, left: element.scrollLeft };
    if (element === equationIndex) {
      const bounds = element.getBoundingClientRect();
      const first = [...element.querySelectorAll('.equation-edit-row')].find((row) => {
        const box = row.getBoundingClientRect();
        return box.bottom > bounds.top + 1 && box.top < bounds.bottom - 1;
      });
      if (first?.dataset?.equationOrderKey) {
        state.rowKey = first.dataset.equationOrderKey;
        state.rowOffset = first.getBoundingClientRect().top - bounds.top;
      }
    }
    return state;
  });
  const anchor = flow === 'continuous' ? captureContinuousAnchor() : null;
  return {
    doc: pdfDoc, key: currentFileKey, flow,
    page: currentPage, anchor: anchor ? { ...anchor } : null,
    top: primaryCanvasWrap.scrollTop, left: primaryCanvasWrap.scrollLeft,
    navigationSerial: readerNavigationSerial,
    scrollers
  };
}

function restoreMeticulousOcrReadingPosition(snapshot, { reader = true, contents = true } = {}) {
  if (!snapshot || pdfDoc !== snapshot.doc || currentFileKey !== snapshot.key) return false;
  if (reader && readingFlow === snapshot.flow && readerNavigationSerial === snapshot.navigationSerial) {
    // Never call goToLocation here: that would create a history entry, change
    // the current page, and potentially race a fresh user navigation.
    if (snapshot.flow === 'continuous' && snapshot.anchor) {
      if (!restoreContinuousAnchor(snapshot.anchor)) primaryCanvasWrap.scrollTop = snapshot.top;
      continuousSavedAnchor = { ...snapshot.anchor };
      continuousScrollTop = primaryCanvasWrap.scrollTop;
    } else if (snapshot.flow === 'single' && Number(currentPage) === Number(snapshot.page)) {
      primaryCanvasWrap.scrollTop = snapshot.top;
      scrollByPage[String(snapshot.page)] = { top: snapshot.top, left: snapshot.left };
    }
    primaryCanvasWrap.scrollLeft = snapshot.left;
  }
  if (contents) {
    for (const state of snapshot.scrollers || []) {
      if (!state.element?.isConnected) continue;
      state.element.scrollTop = state.top;
      state.element.scrollLeft = state.left;
      // Insertion before the visible equation row changes its scroll offset.
      // Keep the SAME entry at the SAME viewport position, not just the old
      // numeric scrollTop (which can move the visible labels after a merge).
      if (state.element === equationIndex && state.rowKey) {
        const row = [...equationIndex.querySelectorAll('.equation-edit-row')]
          .find((item) => item.dataset.equationOrderKey === state.rowKey);
        if (row) {
          const offset = row.getBoundingClientRect().top - equationIndex.getBoundingClientRect().top;
          equationIndex.scrollTop += offset - state.rowOffset;
        }
      }
    }
  }
  return true;
}

function monitorMeticulousOcrUserNavigation() {
  const controller = new AbortController();
  const result = { readerTouched: false, contentsTouched: false, stop: () => controller.abort() };
  const options = { passive: true, signal: controller.signal };
  for (const type of ['wheel', 'touchstart', 'pointerdown']) {
    primaryCanvasWrap?.addEventListener(type, () => { result.readerTouched = true; }, options);
    el('left-sidebar')?.addEventListener(type, () => { result.contentsTouched = true; }, options);
  }
  // Keyboard scrolling and page/zoom controls are intentional reading actions.
  document.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)
        && !event.target?.matches?.('input, textarea, [contenteditable="true"]')) result.readerTouched = true;
  }, options);
  el('reader-toolbar')?.addEventListener('pointerdown', () => { result.readerTouched = true; }, options);
  return result;
}

async function runMeticulousPageIndexOcr(pageNum) {
  if (!pdfDoc || manualPageOcrBusy || documentOcrBusy || !documentTextFeaturesAvailable() ||
      structureIndexBuilding || equationIndexBuildPromise || equationImageAssistPromise) return;
  if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > pdfDoc.numPages) return;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const originalPosition = captureMeticulousOcrReadingPosition();
  const navigationActivity = monitorMeticulousOcrUserNavigation();
  manualPageOcrBusy = true;
  let worker = null;
  let imageCanvas = null;
  const valid = () => sourceDoc === pdfDoc && sourceKey === currentFileKey;
  try {
    manualPageIndexOcrMessage(t(`OCR page ${pageNum}…`, `正在识别第 ${pageNum} 页……`));
    const module = await loadDocumentOcrModule();
    if (!valid()) return;
    const createWorker = documentOcrCreateWorker(module);
    if (typeof createWorker !== 'function') throw new Error('OCR worker unavailable');
    worker = await createWorker('eng', 1);
    if (!valid()) return;
    if (typeof worker.setParameters === 'function') await worker.setParameters({
      preserve_interword_spaces: '1', user_defined_dpi: '300', tessedit_pageseg_mode: '3'
    });
    const page = await sourceDoc.getPage(pageNum);
    if (!valid()) return;
    const base = page.getViewport({ scale: 1 });
    const scale = Math.max(2.20, Math.min(3.60, 3200 / Math.max(1, base.width, base.height)));
    const viewport = page.getViewport({ scale });
    imageCanvas = document.createElement('canvas');
    imageCanvas.width = Math.max(1, Math.ceil(viewport.width));
    imageCanvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = imageCanvas.getContext('2d', {alpha: false});
    context.fillStyle = '#fff';
    context.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
    await page.render({canvasContext: context, viewport}).promise;
    if (!valid()) return;
    const result = await worker.recognize(imageCanvas, {}, {hocr: true});
    if (!valid()) return;
    const record = pageRecordFromHocr(result?.data?.hocr || '', result?.data?.text || '', imageCanvas.width, imageCanvas.height, pageNum);
    if (!Array.isArray(record?.lines) || !record.lines.some((line) => String(line.text || '').trim())) {
      throw new Error('No readable text detected; existing Contents retained');
    }
    // Uncropped Tesseract AND native-PDF lines are evidence about prose
    // citations near the margin; neither text layer alone is always reliable.
    // Read the native layer before promoting any cropped equation tag.
    let nativeLines = [];
    try { nativeLines = await pageTextLines(pageNum, sourceDoc, new Map(), null, { ignoreManual: true }); }
    catch (nativeError) { console.warn('MathReader native text merge unavailable.', nativeError); }
    if (!valid()) return;
    // General text OCR often omits small equation numbers. A second, narrow
    // margin recognition uses the already-rendered page, only for this click.
    // Failure leaves the general page OCR usable and is not treated as evidence.
    try {
      if (typeof worker.setParameters === 'function') await worker.setParameters({
        tessedit_pageseg_mode: '11', tessedit_char_whitelist: '',
      });
      record.equationMarginEvidence = await meticulousEquationMarginEvidence(
        sourceDoc, pageNum, worker, imageCanvas, [...record.lines, ...nativeLines]
      );
      if (!valid()) return;
    } catch (marginError) {
      console.warn('MathReader page equation-margin OCR unavailable.', marginError);
    }
    // Preserve previous detections even when this scan misses them. Read native
    // text independently of the manual overlay, using a disposable cache.
    const previousStructure = structureEntries.slice();
    const previousBibliography = bibliographyEntries.slice();
    const previousEquations = new Map(equationAutomaticLabelIndex || equationLabelIndex || []);
    const mergedRecord = mergePageIndexOcrEvidence(manualIndexOcrPages.get(pageNum), record, nativeLines);
    manualIndexOcrPages.set(pageNum, mergedRecord);
    lineCache.delete(pageNum);
    textCache.delete(pageNum);
    const key = manualIndexOcrCacheKey(sourceKey);
    if (key) {
      try { await dbMetaSet(key, {pageCount: sourceDoc.numPages, pages: [...manualIndexOcrPages.values()]}); }
      catch (error) { console.warn('MathReader page index OCR could not be saved.', error); }
    }
    if (!valid()) return;
    manualPageIndexOcrMessage(t(`Page ${pageNum} OCR complete · refreshing Contents…`, `第 ${pageNum} 页识别完成 · 正在更新目录……`));
    // Explicitly rebuilt derived indexes; never clear saved/manual edits.
    structureIndexVersion = 0;
    inferredOutlineDetectionDone = false;
    await buildStructureIndex({force: true});
    if (!valid()) return;
    // A rebuilt classifier can be more conservative than an earlier one.
    // This explicit recovery operation may only append to the saved indexes.
    const resultKeys = new Set(structureEntries.map((entry) => entry.key));
    for (const entry of previousStructure) {
      if (!resultKeys.has(entry.key)) { structureEntries.push(entry); resultKeys.add(entry.key); }
    }
    structureEntries.sort((a, b) => a.page - b.page || (a.ratio || 0) - (b.ratio || 0));
    const bibKeys = new Set(bibliographyEntries.map((entry) => normalizedBibliographyKey(entry.number)));
    for (const entry of previousBibliography) {
      const key = normalizedBibliographyKey(entry.number);
      if (!bibKeys.has(key)) { bibliographyEntries.push(entry); bibKeys.add(key); }
    }
    bibliographyEntries.sort((a, b) => a.page - b.page || (a.ratio || 0) - (b.ratio || 0));
    renderStructureIndex(); renderBibliographyIndex();
    equationLabelIndex = null;
    equationAutomaticLabelIndex = null;
    equationIndexKnownCount = null;
    resetEquationDetectionProgress();
    await ensureEquationIndexRendered();
    if (!valid()) return;
    if (previousEquations.size) {
      if (!(equationAutomaticLabelIndex instanceof Map)) equationAutomaticLabelIndex = new Map();
      for (const [label, candidates] of previousEquations) {
        if (!equationAutomaticLabelIndex.has(label)) equationAutomaticLabelIndex.set(label, candidates);
      }
      equationLabelIndex = applyEquationEdits(equationAutomaticLabelIndex);
      renderEquationIndex();
    }
    const added = Math.max(0, structureEntries.length - previousStructure.length) +
      Math.max(0, bibliographyEntries.length - previousBibliography.length) +
      Math.max(0, (equationAutomaticLabelIndex?.size || 0) - previousEquations.size);
    manualPageIndexOcrMessage(t(`Page ${pageNum} · ${added} entries added · 0 removed`, `第 ${pageNum} 页 · 新增 ${added} 项 · 删除 0 项`), 3500);
  } catch (error) {
    if (valid()) {
      console.warn('MathReader meticulous page OCR failed.', error);
      manualPageIndexOcrMessage(t(`Page OCR failed: ${error.message || error}`, `单页 OCR 失败：${error.message || error}`), 6500);
    }
  } finally {
    if (imageCanvas) { imageCanvas.width = 1; imageCanvas.height = 1; }
    try { await worker?.terminate?.(); } catch (_) {}
    // Index updates, including failure/cancellation, must not silently replace
    // the reading position. Restore after the DOM has finished updating, but
    // never undo a user-initiated scroll, page change, or document switch.
    if (valid() && originalPosition) {
      const restore = () => restoreMeticulousOcrReadingPosition(originalPosition, {
        reader: !navigationActivity.readerTouched,
        contents: !navigationActivity.contentsTouched
      });
      restore();
      // requestAnimationFrame is suspended in background tabs; do not leave
      // meticulous OCR permanently busy when the user changes tabs.
      if (document.visibilityState !== 'hidden') {
        await Promise.race([nextFrame(), new Promise((resolve) => setTimeout(resolve, 160))]);
      }
      if (valid()) restore();
      if (valid()) persistDocumentState();
    }
    navigationActivity.stop();
    manualPageOcrBusy = false;
  }
}

// One compact context action on actual reader page surfaces. Pages in the
// continuous stack carry their own page number, unlike the single page view.
let manualPageIndexOcrMenu = null;
let manualPageIndexOcrStatus = null;
function closeManualPageIndexOcrMenu() {
  manualPageIndexOcrMenu?.remove();
  manualPageIndexOcrMenu = null;
}
function installManualPageIndexOcrMenu() {
  if (!primaryCanvasWrap) return;
  manualPageIndexOcrStatus = document.createElement('div');
  manualPageIndexOcrStatus.className = 'page-ocr-status is-hidden';
  manualPageIndexOcrStatus.setAttribute('role', 'status');
  primaryCanvasWrap.parentElement?.append(manualPageIndexOcrStatus);
  primaryCanvasWrap.addEventListener('contextmenu', (event) => {
    const surface = event.target?.closest?.('.page-surface');
    if (!surface || !primaryCanvasWrap.contains(surface) || !pdfDoc) return;
    const pageNum = Number(surface.closest('.continuous-page-frame')?.dataset.page || currentPage);
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > pdfDoc.numPages) return;
    event.preventDefault();
    closeManualPageIndexOcrMenu();
    const menu = document.createElement('div');
    menu.className = 'page-ocr-context-menu';
    menu.setAttribute('role', 'menu');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.textContent = t(`Meticulous OCR · page ${pageNum}`, `精细 OCR · 第 ${pageNum} 页`);
    button.disabled = manualPageOcrBusy || documentOcrBusy || !documentTextFeaturesAvailable() || structureIndexBuilding || !!equationIndexBuildPromise || !!equationImageAssistPromise;
    button.addEventListener('click', () => {
      closeManualPageIndexOcrMenu();
      void runMeticulousPageIndexOcr(pageNum);
    });
    menu.append(button);
    document.body.append(menu);
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - rect.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - rect.height - 8))}px`;
    manualPageIndexOcrMenu = menu;
    button.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (manualPageIndexOcrMenu && !manualPageIndexOcrMenu.contains(event.target)) closeManualPageIndexOcrMenu();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeManualPageIndexOcrMenu(); });
  primaryCanvasWrap.addEventListener('scroll', closeManualPageIndexOcrMenu, {passive:true});
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

// Targeted equation-margin OCR is separate from full-document OCR.
// v403 writes each completed (document, side, page) directly to IndexedDB.
// Legacy v401/v402 snapshot records remain readable but are never rewritten.
const EQUATION_MARGIN_EVIDENCE_CACHE_VERSION = 1;
const EQUATION_MARGIN_PAGE_CACHE_VERSION = 2;
function equationMarginEvidenceCacheKey(fileKey = currentFileKey) {
  return fileKey ? `equation-margin-v${EQUATION_MARGIN_EVIDENCE_CACHE_VERSION}:${fileKey}` : null;
}
function equationMarginPagePrefix(fileKey) {
  return fileKey ? `equation-margin-page-v${EQUATION_MARGIN_PAGE_CACHE_VERSION}:${fileKey}|` : null;
}
function equationMarginPageKey(fileKey, side, page) {
  return `${equationMarginPagePrefix(fileKey)}${side}|${page}`;
}
function validEquationMarginLines(lines) {
  return Array.isArray(lines) && lines.length <= 2000 && lines.every((line) =>
    line && typeof line === 'object' && !Array.isArray(line) && typeof line.text === 'string');
}
function equationMarginEvidenceRecords(sourceKey, pageCount) {
  const records = [];
  if (!(equationSupplementalOcrCache instanceof Map) || !sourceKey) return records;
  const prefix = `${sourceKey}|`;
  for (const [key, lines] of equationSupplementalOcrCache) {
    if (typeof key !== 'string' || !key.startsWith(prefix) || !validEquationMarginLines(lines)) continue;
    const match = key.slice(prefix.length).match(/^(left|right)\|(\d+)$/);
    if (!match) continue;
    const page = Number(match[2]);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) continue;
    records.push({ page, side: match[1], lines });
  }
  records.sort((a, b) => a.page - b.page || a.side.localeCompare(b.side));
  return records;
}
function validEquationMarginPageRecord(item, sourceKey, pageCount) {
  const page = Number(item?.page);
  return item?.version === EQUATION_MARGIN_PAGE_CACHE_VERSION && item?.documentId === sourceKey &&
    Number(item?.pageCount) === Number(pageCount) &&
    Number.isInteger(page) && page >= 1 && page <= pageCount &&
    ['left', 'right'].includes(item?.side) && validEquationMarginLines(item?.lines);
}
async function boundedEquationMarginDbOperation(operation, timeoutMs = 5000) {
  let timeout;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('OCR evidence storage timed out')), timeoutMs); })
    ]);
  } finally { clearTimeout(timeout); }
}
function warnEquationMarginStorageFailure(sourceKey, error) {
  console.warn('MathReader could not verify saved equation-margin OCR evidence.', error);
  equationMarginStorageBlockedKey = sourceKey;
  // Surface storage/quota/security failures once, without blocking or restarting OCR.
  if (pdfDoc && currentFileKey === sourceKey && equationMarginStorageWarningKey !== sourceKey) {
    equationMarginStorageWarningKey = sourceKey;
    try { showNotice(t('OCR evidence was not saved locally. Export reading data to keep a backup.',
      'OCR 证据未保存到本地。请导出阅读数据备份。')); } catch (_) {}
  }
}
async function writeEquationMarginPageRecord(sourceKey, pageCount, record, { preserveExisting = false } = {}) {
  const page = Number(record?.page);
  const item = { version: EQUATION_MARGIN_PAGE_CACHE_VERSION, documentId: sourceKey,
    pageCount, page, side: record?.side, lines: record?.lines };
  if (!validEquationMarginPageRecord(item, sourceKey, pageCount) ||
      JSON.stringify(item).length > 500_000) {
    warnEquationMarginStorageFailure(sourceKey, new Error('Invalid or oversized OCR page evidence'));
    return false;
  }
  const key = equationMarginPageKey(sourceKey, item.side, item.page);
  if (equationMarginStorageBlockedKey === sourceKey) return false;
  try {
    // A database upgrade blocked by another tab must not freeze the OCR loop.
    return await boundedEquationMarginDbOperation((async () => {
      if (preserveExisting) {
        const existing = await dbMetaGet(key);
        if (validEquationMarginPageRecord(existing, sourceKey, pageCount)) return true;
      }
      await dbMetaSet(key, item);
      const stored = await dbMetaGet(key);
      if (!validEquationMarginPageRecord(stored, sourceKey, pageCount) ||
          JSON.stringify(stored) !== JSON.stringify(item)) {
        throw new Error('IndexedDB OCR page write did not round-trip');
      }
      return true;
    })());
  } catch (error) {
    warnEquationMarginStorageFailure(sourceKey, error);
    return false;
  }
}
async function persistEquationMarginOcrPage(sourceDoc, sourceKey, page, side, lines) {
  if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || !sourceDoc?.numPages) return false;
  const count = Number(sourceDoc.numPages);
  const key = `${sourceKey}|${side}|${page}`;
  if (equationMarginPersistedPageRefs.get(key) === lines) return true;
  const saved = await writeEquationMarginPageRecord(sourceKey, count, { page, side, lines });
  if (saved && pdfDoc === sourceDoc && currentFileKey === sourceKey) {
    equationMarginPersistedPageRefs.set(key, lines);
  }
  return saved;
}
async function persistEquationMarginOcrEvidence(sourceDoc, sourceKey) {
  if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || !sourceDoc?.numPages) return false;
  const records = equationMarginEvidenceRecords(sourceKey, Number(sourceDoc.numPages));
  if (!records.length || records.length > 1024) return false;
  // Explicit export/final-pass verification permits a retry after a transient
  // blocked or quota failure; an ordinary scan does not retry every page.
  equationMarginStorageBlockedKey = null;
  let allSaved = true;
  for (const record of records) {
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return false;
    if (!await persistEquationMarginOcrPage(sourceDoc, sourceKey, record.page, record.side, record.lines)) allSaved = false;
  }
  return allSaved;
}
async function loadEquationMarginOcrEvidence(sourceDoc, sourceKey) {
  if (!sourceDoc?.numPages || !sourceKey) return false;
  const pageCount = Number(sourceDoc.numPages);
  let pageEntries = [];
  let legacy = null;
  try {
    // An IndexedDB upgrade blocked by another tab must not stall PDF opening.
    pageEntries = await boundedEquationMarginDbOperation(dbMetaEntriesByPrefix(equationMarginPagePrefix(sourceKey)));
  } catch (error) { console.warn('MathReader could not restore equation-margin OCR page records.', error); }
  try {
    // v401/v402 records can fill gaps in a partially migrated page journal.
    legacy = await boundedEquationMarginDbOperation(dbMetaGet(equationMarginEvidenceCacheKey(sourceKey)));
  } catch (error) { console.warn('MathReader could not restore legacy equation-margin OCR evidence.', error); }
  if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return false;
  const validated = new Map();
  const journalKeys = new Set();
  for (const entry of pageEntries) {
    const key = entry?.key;
    const item = entry?.value;
    if (typeof key !== 'string' || !validEquationMarginPageRecord(item, sourceKey, pageCount) ||
        key !== equationMarginPageKey(sourceKey, item.side, item.page)) continue;
    const cacheKey = `${sourceKey}|${item.side}|${item.page}`;
    validated.set(cacheKey, item.lines);
    journalKeys.add(cacheKey);
  }
  if (Number(legacy?.version) === EQUATION_MARGIN_EVIDENCE_CACHE_VERSION &&
      Number(legacy?.pageCount) === pageCount && Array.isArray(legacy?.records) &&
      legacy.records.length <= 1024) {
    // A malformed legacy snapshot must not partially contaminate the cache.
    const old = new Map();
    let valid = true;
    for (const record of legacy.records) {
      const page = Number(record?.page);
      if (!Number.isInteger(page) || page < 1 || page > pageCount ||
          !['left', 'right'].includes(record?.side) || !validEquationMarginLines(record.lines)) { valid = false; break; }
      const key = `${sourceKey}|${record.side}|${page}`;
      if (old.has(key)) { valid = false; break; }
      old.set(key, record.lines);
    }
    if (valid) for (const [key, lines] of old) if (!validated.has(key)) validated.set(key, lines);
  }
  if (!validated.size) return false;
  for (const [key, lines] of validated) {
    if (!equationSupplementalOcrCache.has(key)) {
      equationSupplementalOcrCache.set(key, lines);
      if (journalKeys.has(key)) equationMarginPersistedPageRefs.set(key, lines);
    }
  }
  return true;
}
// A user-provided full-text export is a recovery source, never an OCR or
// detection instruction. Only original observations from an exact PDF match
// may be restored; existing verified per-page records take precedence.
function importedEquationMarginRecords(payload, sourceKey, pageCount) {
  const full = payload?.fullDocumentText;
  if (!full || !Array.isArray(full.pages)) return [];
  // Old exports may contain full-text records without margin OCR and without
  // a modern SHA. They must remain importable as ordinary reading data.
  if (full.pages.some((page) => page?.equationMarginOcr != null && !Array.isArray(page.equationMarginOcr))) return null;
  if (!full.pages.some((page) => Array.isArray(page?.equationMarginOcr) && page.equationMarginOcr.length)) return [];
  if (payload.document?.id !== sourceKey || !sourceKey.startsWith('sha256:') ||
      Number(payload.document?.pages) !== pageCount || Number(full.pageCount) !== pageCount ||
      full.pages.length !== pageCount) return null;
  const records = [];
  const seen = new Set();
  const seenPages = new Set();
  for (const pageRecord of full.pages) {
    const page = Number(pageRecord?.page);
    if (!Number.isInteger(page) || page < 1 || page > pageCount || seenPages.has(page)) return null;
    seenPages.add(page);
    if (pageRecord.equationMarginOcr == null) continue;
    if (!Array.isArray(pageRecord.equationMarginOcr)) return null;
    for (const item of pageRecord.equationMarginOcr) {
      const key = `${item?.side}|${page}`;
      if (!['left', 'right'].includes(item?.side) || !validEquationMarginLines(item?.lines) || seen.has(key)) return null;
      seen.add(key); records.push({ page, side: item.side, lines: item.lines });
      if (records.length > 1024) return null;
    }
  }
  return records;
}
async function restoreImportedEquationMarginEvidence(payload, sourceKey, pageCount) {
  const records = importedEquationMarginRecords(payload, sourceKey, pageCount);
  if (records === null) return { ok: false, count: 0 };
  if (!records.length) return { ok: true, count: 0 };
  // An explicit user import is a retry opportunity after a transient quota or
  // database-access failure; ordinary OCR does not retry on every page.
  equationMarginStorageBlockedKey = null;
  let count = 0;
  for (const record of records) {
    if (!await writeEquationMarginPageRecord(sourceKey, pageCount, record, { preserveExisting: true })) {
      return { ok: false, count };
    }
    count++;
  }
  return { ok: true, count };
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
      // Tesseract's hOCR boxes are expressed in its own image coordinate
      // space. Tesseract.js can resize the supplied canvas internally; using
      // the caller's canvas height then makes every lower label land too high,
      // with error proportional to its distance from the top of the page.
      // The hOCR page bbox is the authority for ALL its word/line boxes.
      const pageBox = parseHocrBbox(doc.querySelector('.ocr_page')?.getAttribute('title'));
      const hasOcrPageFrame = Boolean(pageBox && pageBox.x1 > pageBox.x0 && pageBox.y1 > pageBox.y0);
      const originX = hasOcrPageFrame ? pageBox.x0 : 0;
      const originY = hasOcrPageFrame ? pageBox.y0 : 0;
      const ocrWidth = hasOcrPageFrame ? pageBox.x1 - pageBox.x0 : safeWidth;
      const ocrHeight = hasOcrPageFrame ? pageBox.y1 - pageBox.y0 : safeHeight;
      const normX = (value) => Math.min(1, Math.max(0, (value - originX) / ocrWidth));
      const normY = (value) => Math.min(1, Math.max(0, (value - originY) / ocrHeight));
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
            xStartRatio: Math.min(1, Math.max(0, normX(box.x0))),
            xEndRatio: Math.min(1, Math.max(0, normX(box.x1))),
            yStartRatio: Math.min(1, Math.max(0, normY(box.y0))),
            yEndRatio: Math.min(1, Math.max(0, normY(box.y1)))
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
            xStartRatio: Math.min(1, Math.max(0, normX(item.box.x0))),
            xEndRatio: Math.min(1, Math.max(0, normX(item.box.x1)))
          });
        }
        const confidenceValues = lineWords.map((item) => item.confidence).filter(Number.isFinite);
        const confidence = confidenceValues.length ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : null;
        lines.push({
          text,
          parts,
          confidence,
          ratio: Math.min(1, Math.max(0, normY(box.y0))),
          xStartRatio: Math.min(1, Math.max(0, normX(box.x0))),
          xEndRatio: Math.min(1, Math.max(0, normX(box.x1))),
          heightRatio: Math.min(1, Math.max(0.001, (box.y1 - box.y0) / ocrHeight))
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
      // These are only reading-order placeholders. No image bbox was measured:
      // equation-margin recovery must never promote this ratio as a target.
      lines.push({ text, parts: [{ start: 0, end: text.length, xStartRatio: 0.06, xEndRatio: 0.94 }], confidence: null, ratio, xStartRatio: 0.06, xEndRatio: 0.94, heightRatio: 0.018, geometryEstimated: true });
    });
  }
  const text = lines.map((line) => line.text).join(' ').replace(/\s+/g, ' ').trim();
  // Keep the unmodified Tesseract plain-text answer as well as the normalized
  // line/word geometry. Earlier versions retained only normalized lines, so
  // their original engine text cannot be reconstructed retroactively.
  return { page: pageNum, width: safeWidth, height: safeHeight, text, lines, words,
    ocrRawText: String(fallbackText || '') };
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
    const { content } = await nativePageTextData(doc, pageNum);
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
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const key = documentOcrCacheKey(sourceKey);
  if (!key || !sourceDoc?.numPages) return false;
  try {
    const cached = await dbMetaGet(key);
    // Page counts are not document identities: another same-length PDF can
    // replace the original before an asynchronous IndexedDB read returns.
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return false;
    if (!cached || Number(cached.version) !== DOCUMENT_OCR_CACHE_VERSION ||
        Number(cached.pageCount) !== sourceDoc.numPages || !Array.isArray(cached.pages)) return false;
    const map = new Map();
    for (const record of cached.pages) {
      const page = Number(record?.page);
      // A purported full-document cache with pages 1 and 3 for a two-page
      // document is incomplete, even if its Map happens to contain two rows.
      if (!Number.isInteger(page) || page < 1 || page > sourceDoc.numPages ||
          !Array.isArray(record?.lines) || map.has(page)) return false;
      map.set(page, record);
    }
    if (map.size !== sourceDoc.numPages) return false;
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
  const controller = {
    cancelled: false, completedRecognition: false, worker: null,
    renderTasks: new Set(), canvases: new Set(), terminatedWorkers: new WeakSet(),
    stopSignal: null, resolveStop: null
  };
  controller.stopSignal = new Promise((resolve) => { controller.resolveStop = resolve; });
  documentOcrRunController = controller;
  documentOcrBusy = true;
  if (welcomeOpen) welcomeOpen.disabled = true;
  if (fileInput) fileInput.disabled = true;
  updateDocumentTextAvailabilityUI();
  setDocumentOcrProgress(1, pageCount, null, t('Preparing OCR engine…', '正在准备 OCR 引擎……'));
  if (documentOcrPrimary) documentOcrPrimary.onclick = requestStopFullDocumentOcr;

  const ensureCurrent = () => {
    if (controller.cancelled || pdfDoc !== sourceDoc || currentFileKey !== sourceKey) throw makeDocumentOcrStoppedError();
  };

  const renderOcrPage = async (pageNum) => {
    ensureCurrent();
    const page = await sourceDoc.getPage(pageNum);
    ensureCurrent();
    const base = page.getViewport({ scale: 1 });
    const scale = Math.max(2.20, Math.min(3.60, 3200 / Math.max(1, base.width, base.height)));
    const viewport = page.getViewport({ scale });
    const pageCanvas = document.createElement('canvas');
    controller.canvases.add(pageCanvas);
    try {
      pageCanvas.width = Math.max(1, Math.ceil(viewport.width));
      pageCanvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = pageCanvas.getContext('2d', { alpha: false });
      context.fillStyle = '#fff';
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      const renderTask = page.render({ canvasContext: context, viewport });
      controller.renderTasks.add(renderTask);
      try { await renderTask.promise; } finally { controller.renderTasks.delete(renderTask); }
      ensureCurrent();
      return pageCanvas;
    } catch (error) {
      releaseDocumentOcrCanvas(controller, pageCanvas);
      throw error;
    }
  };

  let worker = null;
  let prefetchedCanvasOutcome = null;
  let pageCanvasInFlight = null;
  let lastProgressPage = 0;
  let lastProgressPct = -1;
  let lastProgressAt = 0;
  try {
    const module = await awaitDocumentOcrCancelable(controller, loadDocumentOcrModule());
    ensureCurrent();
    const createWorker = documentOcrCreateWorker(module);
    if (typeof createWorker !== 'function') throw new Error(t('The document OCR engine could not be initialized.', '无法初始化全文 OCR 引擎。'));
    worker = await awaitDocumentOcrCancelable(controller, createWorker('eng', 1, {
      logger: (message) => {
        // A late progress event must never reopen the locked Stop button.
        if (controller.cancelled || controller.completedRecognition || documentOcrRunController !== controller) return;
        if (!message || message.status !== 'recognizing text' || !Number.isFinite(Number(message.progress))) return;
        const page = Number(controller.currentPage || 1);
        const progress = Number(message.progress);
        const pct = Math.round(progress * 100);
        const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        if (page === lastProgressPage && pct === lastProgressPct && now - lastProgressAt < 120) return;
        if (page === lastProgressPage && pct < 100 && pct - lastProgressPct < 2 && now - lastProgressAt < 90) return;
        lastProgressPage = page;
        lastProgressPct = pct;
        lastProgressAt = now;
        setDocumentOcrProgress(page, pageCount, progress, t(`Full-document OCR · page ${page}/${pageCount} · ${pct}%`, `全文 OCR · 第 ${page}/${pageCount} 页 · ${pct}%`));
        if (documentOcrPrimary) documentOcrPrimary.onclick = requestStopFullDocumentOcr;
      }
    }), (lateWorker) => terminateDocumentOcrWorker(controller, lateWorker));
    controller.worker = worker;
    ensureCurrent();
    if (typeof worker.setParameters === 'function') {
      try {
        await awaitDocumentOcrCancelable(controller, worker.setParameters({
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          tessedit_pageseg_mode: '3'
        }));
      } catch (error) {
        ensureCurrent();
        console.warn('MathReader could not apply document OCR quality parameters.', error);
      }
    }
    const map = new Map();
    // Retain page n+1 rendering in parallel with recognition of page n.
    // Cancellation must not await either task after Stop was clicked.
    prefetchedCanvasOutcome = renderOcrPage(1).then(
      (canvas) => ({ ok: true, canvas }), (error) => ({ ok: false, error })
    );
    for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
      ensureCurrent();
      controller.currentPage = pageNum;
      setDocumentOcrProgress(pageNum, pageCount, 0, t(`Full-document OCR · page ${pageNum}/${pageCount}`, `全文 OCR · 第 ${pageNum}/${pageCount} 页`));
      if (documentOcrPrimary) documentOcrPrimary.onclick = requestStopFullDocumentOcr;
      const currentOutcome = await awaitDocumentOcrCancelable(controller, prefetchedCanvasOutcome,
        (lateOutcome) => { if (lateOutcome?.ok) releaseDocumentOcrCanvas(controller, lateOutcome.canvas); });
      if (!currentOutcome?.ok) throw currentOutcome?.error || new Error('Document OCR page render failed.');
      const pageCanvas = currentOutcome.canvas;
      pageCanvasInFlight = pageCanvas;
      const recognizePromise = worker.recognize(pageCanvas, {}, { hocr: true });
      prefetchedCanvasOutcome = pageNum < pageCount
        ? renderOcrPage(pageNum + 1).then(
          (canvas) => ({ ok: true, canvas }), (error) => ({ ok: false, error })
        )
        : null;
      const result = await awaitDocumentOcrCancelable(controller, recognizePromise);
      ensureCurrent();
      const record = pageRecordFromHocr(result?.data?.hocr || '', result?.data?.text || '', pageCanvas.width, pageCanvas.height, pageNum);
      map.set(pageNum, record);
      releaseDocumentOcrCanvas(controller, pageCanvas);
      pageCanvasInFlight = null;
      await awaitDocumentOcrCancelable(controller, nextFrame());
    }
    ensureCurrent();
    if (map.size !== pageCount) throw new Error(t('Full-document OCR did not complete for every page.', '全文 OCR 未能完成所有页面。'));
    // All OCR pages are complete. From this point persistence is a commit,
    // not an interruptible scan. Do not label already committed evidence as
    // "stopped" if the user clicks during the brief final save.
    controller.completedRecognition = true;
    if (documentOcrPrimary) documentOcrPrimary.disabled = true;
    documentOcrPages = map;
    documentOcrActive = true;
    documentTextMode = 'ocr';
    documentTextPreference = 'ocr';
    await persistDocumentOcr();
    setDocumentOcrProgress(pageCount, pageCount, 1, t('Full-document OCR complete · building MathReader indexes…', '全文 OCR 完成 · 正在生成 MathReader 索引……'));
    if (documentOcrPrimary) documentOcrPrimary.disabled = true;
  } catch (error) {
    if (controller.cancelled && !isDocumentOcrStoppedError(error)) throw makeDocumentOcrStoppedError();
    throw error;
  } finally {
    controller.currentPage = 0;
    if (pageCanvasInFlight) releaseDocumentOcrCanvas(controller, pageCanvasInFlight);
    if (prefetchedCanvasOutcome) {
      // Do not await a canceled or wedged PDF.js render. If it later resolves,
      // release its canvas without touching the active document.
      prefetchedCanvasOutcome.then((outcome) => {
        if (outcome?.ok) releaseDocumentOcrCanvas(controller, outcome.canvas);
      }).catch(() => {});
    }
    for (const canvas of [...controller.canvases]) releaseDocumentOcrCanvas(controller, canvas);
    if (controller.cancelled) for (const task of controller.renderTasks) {
      try { task.cancel?.(); } catch (_) {}
    }
    terminateDocumentOcrWorker(controller, worker);
    if (documentOcrRunController === controller) documentOcrRunController = null;
    documentOcrBusy = false;
    if (welcomeOpen) welcomeOpen.disabled = false;
    if (fileInput) fileInput.disabled = false;
    updateDocumentTextAvailabilityUI();
  }
}

async function ensureDocumentTextReady(savedPreference = 'ask') {
  documentOcrPages = new Map();
  manualIndexOcrPages = new Map();
  documentOcrActive = false;
  documentTextMode = 'native';
  imageDocumentDetected = false;
  documentTextPreference = ['skip', 'ocr', 'native'].includes(savedPreference) ? savedPreference : 'ask';

  if (await loadCachedDocumentOcr()) {
    // Cached full-document OCR and explicit page-level meticulous OCR are
    // independent evidence stores. Restore both before any index is built.
    await loadManualIndexOcrPages();
    imageDocumentDetected = true;
    documentTextMode = 'ocr';
    documentTextPreference = 'ocr';
    setLoading(true, t('Restoring scanned-document OCR…', '正在恢复扫描文档 OCR……'));
    return true;
  }

  setLoading(true, t('Checking PDF text layer…', '正在检查 PDF 文本层……'));
  const needsOcr = await pdfNeedsDocumentOcr(pdfDoc);
  if (!needsOcr) {
    await loadManualIndexOcrPages();
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
  updateEquationDetectionStatus(true);
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
  const defaults = new Set(['settings-section','ocr-section','note-section','annotations-section','symbol-glossary-section','backlinks-section','undo-section','recovery-section','reading-trail-section','reference-section','shortcuts-section','document-info-section','contents-annotations-section']);
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
  portableContentDetectionActive = false;
  equationInitialRecoveryDone = false;
  equationInitialRecoveryAttempted = false;
  equationEdits = [];
  equationManualOrder = [];
  equationOrderCustomized = false;
  draggedEquationKey = null;
  pendingEquationReselectKey = null;
  pendingEquationAddKey = null;
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  resetEquationDetectionProgress();
  structureIndexVersion = 0;
  equationLabelIndex = null;
  equationImageAssistPromise = null;
  equationAutomaticLabelIndex = null;
  equationSupplementalOcrCache = new Map();
  equationMarginPersistedPageRefs = new Map();
  renderEquationIndex();
  backlinkContext = null; backlinkEntries = []; renderBacklinks();
  tocOutlineTargets = null;
  referencePages = [];
  readingBackStack = [];
  zoomMode = 'fit-width';
  zoomScale = 1.2;
  searchInput.value = '';
  shell.classList.remove('mobile-left-open', 'mobile-right-open');
  shell.classList.remove('left-collapsed', 'right-collapsed');
  activatePanel('outline-panel', false);

  let session = cachedSession;
  if (!session) {
    try { session = JSON.parse(safeGet(stateKey('session-v2'), 'null')); } catch (_) { session = null; }
  }

  if (session && typeof session === 'object') {
    equationInitialRecoveryDone = session.equationInitialRecoveryDone === true;
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
    inferredOutline = Array.isArray(session.inferredOutline) ? session.inferredOutline.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.title === 'string').slice(0, MAX_INFERRED_OUTLINE_ENTRIES) : [];
    if (inferredOutline.length) inferredOutlineDetectionDone = true;
    structureEntries = Array.isArray(session.structureEntries) ? session.structureEntries.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.title === 'string').slice(0, 500) : [];
    bibliographyEntries = Array.isArray(session.bibliographyEntries) ? session.bibliographyEntries.filter((entry) => entry && Number(entry.page) >= 1 && typeof entry.label === 'string').slice(0, 400) : [];
    equationEdits = Array.isArray(session.equationEdits) ? session.equationEdits.filter((item) => item && typeof item.sourceLabel === 'string' && ['remove','reselect','add'].includes(item.action)).slice(0, 500) : [];
    equationOrderCustomized = session.equationOrderCustomized === true;
    // Older builds saved automatic order as though it were a manual drag order.
    // Only explicit drag-and-drop from this version onward can override detection order.
    equationManualOrder = equationOrderCustomized && Array.isArray(session.equationManualOrder) ? session.equationManualOrder.map((item) => String(item || '')).filter(Boolean).slice(0, 1000) : [];
    const equationSummary = session.equationIndexSummary;
    // Invalidate only a v340/earlier *automatic* order when its snapshot
    // belongs to an older detector. An edited/dragged order will differ from
    // the snapshot-derived default and is retained. Imported portable reading
    // data stays untouched, including its user's chosen ordering.
    if (!session.portableContentDetection
        && Number(equationSummary?.version || 0) !== EQUATION_INDEX_SUMMARY_VERSION
        && storedEquationOrderMatchesOldAutomaticSnapshot(equationManualOrder, session.equationIndexSnapshot)) {
      equationManualOrder = [];
      equationOrderCustomized = false;
    }
    if (equationSummary && Number(equationSummary.version) === EQUATION_INDEX_SUMMARY_VERSION
      && Number.isInteger(Number(equationSummary.count)) && Number(equationSummary.count) >= 0) {
      equationIndexKnownCount = Math.min(1000, Number(equationSummary.count));
    } else if (Number(session.version || 0) <= 21 && equationManualOrder.length) {
      // Legacy exports already persisted the canonical equation row order.
      // Reuse its length as a safe legacy count so old exports also avoid the
      // post-import ellipsis; the background index rebuild still verifies it.
      equationIndexKnownCount = equationManualOrder.length;
    }
    const portableDetectionRequested = Boolean(session.portableContentDetection);
    const restoredEquationIndex = restoreEquationIndexFromPersistence(session.equationIndexSnapshot, { portable: portableDetectionRequested });
    if (restoredEquationIndex && equationInitialRecoveryDone) {
      equationAutomaticLabelIndex = restoredEquationIndex;
      equationLabelIndex = applyEquationEdits(equationAutomaticLabelIndex);
      equationIndexKnownCount = equationLabelIndex.size;
    }
    embeddedOutlineEdits = Array.isArray(session.embeddedOutlineEdits) ? session.embeddedOutlineEdits.filter((item) => item && typeof item.sourceKey === 'string' && ['remove','reselect'].includes(item.action)).slice(0, 300) : [];
    embeddedOutlineEntries = [];
    structureIndexVersion = Number(session.structureIndexVersion || 0);
    // Inferred Structure has a separate completion flag. Merely bumping the
    // Results/Bibliography version would leave an old, nonempty outline marked
    // complete and hide newly detected sections forever. Preserve portable
    // user-imported detections, but invalidate ordinary local inferred outlines
    // together with their source detector version.
    if (structureIndexVersion !== STRUCTURE_INDEX_VERSION && !portableDetectionRequested) {
      inferredOutline = [];
      inferredOutlineDetectionDone = false;
    }
    // Detector-version invalidation is correct for ordinary local caches, but an
    // imported reading-data snapshot is user data. Preserve its saved Results and
    // Bibliography when document text is unavailable; a future OCR/rebuild can
    // replace them explicitly rather than silently deleting them on import.
    if (structureIndexVersion !== STRUCTURE_INDEX_VERSION
        && !(portableDetectionRequested && (structureEntries.length || bibliographyEntries.length))) {
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
    if (!portableDetectionRequested
        && (Number(session.version || 0) < 20 || (inferredOutline.length && inferredOutline.some((entry) => !Number.isFinite(Number(entry.ratio)))))) inferredOutline = [];
    portableContentDetectionActive = portableDetectionRequested && Boolean(
      inferredOutline.length || structureEntries.length || bibliographyEntries.length || restoredEquationIndex
    );
    searchInput.value = typeof session.searchQuery === 'string' ? session.searchQuery : '';
    renderSymbolGlossary();
    if (generalPrefs.rememberSidebarVisibility !== false && Number(session.version || 0) >= 4) {
      shell.classList.toggle('left-collapsed', Boolean(session.ui?.leftCollapsed));
      shell.classList.toggle('right-collapsed', Boolean(session.ui?.rightCollapsed));
    } else {
      // Start from the clean default when sidebar visibility is not remembered,
      // and for legacy sessions created before sidebar visibility was saved.
      shell.classList.remove('left-collapsed', 'right-collapsed');
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
    referenceStatus.textContent = t(`Pinned · p. ${pinnedPage}`, `已固定 · 第 ${pinnedPage} 页`);
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




