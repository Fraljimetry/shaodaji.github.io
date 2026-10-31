// MathReader v306 · PDF rendering, continuous mode, zoom, and navigation.
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
    layer.removeAttribute('data-document-ocr');
    if (!documentTextFeaturesAvailable()) return;
    if (sourceDocumentUsesOcr(pageNum)) {
      renderDocumentOcrTextLayer(layer, viewport, pageNum);
    } else {
      const textContent = await page.getTextContent({ includeMarkedContent: true });
      const textLayer = new pdfjsLib.TextLayer({ textContentSource: textContent, container: layer, viewport });
      await textLayer.render();
    }
    decorateReferenceLinks(layer, surface, pageNum);
  } catch (error) {
    console.warn('MathReader text layer unavailable for page', pageNum, error);
  }
}

function applySinglePageHorizontalOverflow(surface, wrap, pageWidth) {
  if (!surface || !wrap) return;
  const overflow = Number(pageWidth) > Math.max(1, wrap.clientWidth);
  if (overflow) {
    // A centered flex item wider than its scroll container can create negative
    // left overflow that scrollLeft cannot reach. Anchor the oversized page at
    // the scroll origin instead; horizontal scrolling can then reach both edges.
    wrap.style.justifyContent = 'flex-start';
    surface.style.marginLeft = '0';
    surface.style.marginRight = '0';
    surface.style.alignSelf = 'flex-start';
  } else {
    wrap.style.removeProperty('justify-content');
    surface.style.removeProperty('margin-left');
    surface.style.removeProperty('margin-right');
    surface.style.removeProperty('align-self');
  }
}

function applyContinuousHorizontalOverflow(pageMetrics) {
  if (!continuousStack || !primaryCanvasWrap) return;
  const available = Math.max(1, primaryCanvasWrap.clientWidth);
  const maxPageWidth = Math.max(0, ...(pageMetrics || []).map((item) => Number(item?.width) || 0));
  const overflow = maxPageWidth > available;
  if (!overflow) {
    continuousStack.style.removeProperty('width');
    continuousStack.style.removeProperty('min-width');
    continuousStack.style.removeProperty('align-items');
    for (const record of continuousPageNodes.values()) {
      record.frame?.style.removeProperty('width');
      record.frame?.style.removeProperty('min-width');
    }
    return;
  }
  // Give the scrolling document a real non-negative width equal to its widest
  // page. Frames share that width, while individual page surfaces may remain
  // centered inside it. This avoids an unreachable negative-left overflow.
  const documentWidth = Math.ceil(maxPageWidth);
  continuousStack.style.width = `${documentWidth}px`;
  continuousStack.style.minWidth = `${documentWidth}px`;
  continuousStack.style.alignItems = 'flex-start';
  for (const record of continuousPageNodes.values()) {
    record.frame?.style.setProperty('width', `${documentWidth}px`);
    record.frame?.style.setProperty('min-width', `${documentWidth}px`);
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
  applySinglePageHorizontalOverflow(targetSurface, wrap, viewport.width);
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
    if (viewport.width > Math.max(1, primaryCanvasWrap?.clientWidth || 0)) {
      surface.style.marginLeft = '0';
      surface.style.marginRight = '0';
    } else {
      surface.style.removeProperty('margin-left');
      surface.style.removeProperty('margin-right');
    }
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
  applyContinuousHorizontalOverflow(pageMetrics);

  const restoreAnchor = anchor || continuousSavedAnchor;
  const activePage = Math.min(Math.max(1, Number(restoreAnchor?.page) || currentPage), pdfDoc.numPages);
  if (restoreAnchor?.page && continuousPageNodes.has(Number(restoreAnchor.page))) {
    const target = continuousPageNodes.get(Number(restoreAnchor.page))?.frame;
    const ratio = Math.min(1, Math.max(0, Number(restoreAnchor.ratio) || 0));
    if (target) primaryCanvasWrap.scrollTop = Math.max(0, target.offsetTop + target.offsetHeight * ratio);
  } else if (activePage === 1) {
    // A genuinely fresh continuous-reading open has no saved anchor. Start at
    // the scroll origin itself rather than treating page 1 as a generic jump
    // target; frame offsets include layout gap/labels and can otherwise leave
    // the first page visibly scrolled on its first open.
    primaryCanvasWrap.scrollTop = 0;
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
  applyContinuousHorizontalOverflow(pageMetrics);
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

