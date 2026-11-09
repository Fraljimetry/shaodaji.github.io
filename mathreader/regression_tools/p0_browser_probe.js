// TEST-ONLY probe appended to a temporary copy of the final v355 lexical module.
// Never add to the live MathReader application or a production ZIP runtime.
// It inspects the *actual* browser structures after the normal app indexers run.
window.__mathreaderP0 = Object.freeze({
  snapshot() {
    const fromIndex = equationLabelIndex instanceof Map
      ? Array.from(equationLabelIndex.entries()).flatMap(([label, candidates]) =>
          (candidates || []).map((candidate) => ({ label: String(label), page: Number(candidate.page), ratio: Number.isFinite(candidate?.ratio) ? candidate.ratio : null })))
      : [];
    const take = (items, attributes) => (items || []).map((item) => {
      const result = {};
      for (const attr of attributes) if (item[attr] !== undefined) result[attr] = item[attr];
      return result;
    });
    return {
      documentLoaded: Boolean(pdfDoc),
      fileKey: currentFileKey,
      fileName: currentFileName,
      pages: pdfDoc?.numPages || 0,
      currentPage,
      pdfjsVersion: pdfjsLib?.version || null,
      flow: readingFlow,
      indexes: {
        structure: take(inferredOutline, ['title', 'page', 'ratio']),
        results: take(structureEntries, ['label', 'title', 'page', 'ratio']),
        equations: fromIndex,
        bibliography: take(bibliographyEntries, ['label', 'title', 'page', 'ratio'])
      },
      stages: {
        structure: inferredOutlineDetectionDone && !inferredOutlineBuildPromise ? 'COMPLETE' : 'INCOMPLETE',
        results: structureIndexVersion === STRUCTURE_INDEX_VERSION && !structureIndexBuilding ? 'COMPLETE' : 'INCOMPLETE',
        equations: equationLabelIndex instanceof Map && !equationIndexBuildPromise ? 'COMPLETE' : 'INCOMPLETE',
        bibliography: structureIndexVersion === STRUCTURE_INDEX_VERSION && !structureIndexBuilding ? 'COMPLETE' : 'INCOMPLETE'
      },
      model: { initialized: Boolean(mathOcrPipeline), loading: mathOcrLoading,
               failed: mathOcrInitializationFailed, backend: mathOcrBackend?.label || null,
               initializing: Boolean(mathOcrInitPromise) },
      currentFormula: currentOcrResult?.source === 'image'
        ? { latex: currentOcrResult.latex, source: currentOcrResult.source,
            quality: currentOcrResult.quality } : null
    };
  },
  async finishIndexes() {
    if (!pdfDoc) throw new Error('No PDF is loaded');
    if (!documentTextFeaturesAvailable()) throw new Error('P0_REQUIRES_DOCUMENT_OCR: PDF text unavailable; explicit document OCR needed');
    await renderOutline();
    const start = Date.now();
    while (structureIndexBuilding && Date.now() - start < 120000) await new Promise(r => setTimeout(r, 50));
    if (structureIndexBuilding) throw new Error('Structure build did not settle');
    await buildStructureIndex();
    await ensureEquationIndexRendered();
    // Explicit postcondition: do not invent a COMPLETE state if a builder failed.
    return this.snapshot();
  },
  async navigate(page) {
    if (!pdfDoc) throw new Error('No PDF is loaded');
    await goToPage(page);
    return this.snapshot().currentPage;
  },
  async chooseFormulaMode() {
    if (!pdfDoc) throw new Error('No PDF loaded');
    setOcrMode(true);
    const state = this.snapshot().model;
    setOcrMode(false);
    return state;
  },
  async imageFormulaCase({ id, page, rectPdfPt, scale = 2, cropOnly = false }) {
    if (!pdfDoc || !Number.isInteger(page) || page < 1 || page > pdfDoc.numPages) throw new Error('Invalid PDF formula page');
    if (!Array.isArray(rectPdfPt) || rectPdfPt.length !== 4 || rectPdfPt.some((v) => !Number.isFinite(v))) throw new Error('Formula rectangle must be four finite PDF points');
    if (!(scale >= 1 && scale <= 4)) throw new Error('Formula crop resolution outside 1–4 scale range');
    const pdfPage = await pdfDoc.getPage(page);
    const unit = pdfPage.getViewport({scale:1});
    const [x0,y0,x1,y1] = rectPdfPt;
    if (!(x0 >= 0 && y0 >= 0 && x1 > x0 && y1 > y0 && x1 <= unit.width && y1 <= unit.height)) {
      throw new Error('Formula region out of original PDF page bounds');
    }
    const viewport = pdfPage.getViewport({scale});
    const width = Math.ceil(viewport.width), height = Math.ceil(viewport.height);
    if (width * height > 25000000) throw new Error('Formula source page raster exceeds the declared memory safety limit');
    const original = document.createElement('canvas');
    original.width = width; original.height = height;
    const context = original.getContext('2d',{alpha:false});
    context.fillStyle='#ffffff';context.fillRect(0,0,width,height);
    await pdfPage.render({canvasContext:context,viewport}).promise;
    const crop = document.createElement('canvas');
    crop.width = Math.max(1,Math.ceil((x1-x0)*scale));
    crop.height = Math.max(1,Math.ceil((y1-y0)*scale));
    crop.getContext('2d',{alpha:false}).drawImage(original,x0*scale,y0*scale,
        (x1-x0)*scale,(y1-y0)*scale,0,0,crop.width,crop.height);
    original.width=1;original.height=1;
    const cropPngDataUrl = crop.toDataURL('image/png');
    if (!crypto.subtle) throw new Error('Secure-origin SHA-256 unavailable; source crop cannot be attested');
    const encoded = atob(cropPngDataUrl.split(',')[1]);
    const bytes = new Uint8Array(encoded.length);
    for (let i=0;i<encoded.length;i++) bytes[i] = encoded.charCodeAt(i);
    const digest = await crypto.subtle.digest('SHA-256',bytes);
    const cropSha256 = Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
    // Browser-side source crop capture does not require Texify. This lets
    // reviewers prepare independently verified ground truth even when the
    // model cannot be loaded. It must never count as OCR acceptance.
    if (cropOnly) return { id, page, crop_sha256:cropSha256,
      rect_pdf_pt:rectPdfPt, pdf_render_scale:scale,
      crop_png_data_url:cropPngDataUrl,
      origin:'original_pdf_browser_crop', compiled:false,
      error:'Actual formula OCR was not run' };
    const before = currentOcrResult?.created || 0;
    await recognizeImageFallbackCrop(crop, page, 'formula', cropPngDataUrl);
    const after = currentOcrResult;
    const common = { id, page, crop_sha256:cropSha256, rect_pdf_pt:rectPdfPt,
                     pdf_render_scale:scale, crop_png_data_url:cropPngDataUrl };
    if (!after || after.created === before || after.source !== 'image' || !mathOcrBackend) {
      return { ...common, origin:'unavailable',compiled:false,
               error:'Actual Texify formula recognition did not yield a new image result' };
    }
    let compiled = false;
    let compilationError = '';
    try {
      if (typeof window.MathJax?.tex2chtml !== 'function') throw new Error('MathJax compiler not ready');
      const rendered = window.MathJax.tex2chtml(after.latex, {display:true});
      compiled = !rendered.querySelector('mjx-merror, merror, [data-mjx-error]');
      if (!compiled) compilationError = 'MathJax rendered an error node';
    } catch (error) { compilationError = String(error?.message || error); }
    return { ...common, origin:'actual_texify_browser',latex:after.latex,
             original_latex_available:false,compiled,compilation_error:compilationError,
             backend:mathOcrBackend.label,recognition_quality:after.quality };
  },
  async testInitializationFailure() {
    // Fault injection affects this isolated test copy only, not user source.
    if (pdfDoc || mathOcrPipeline) throw new Error('Failure probe requires clean shell');
    const original = importFormulaOcrRuntime;
    importFormulaOcrRuntime = async () => {
      await new Promise((resolve) => setTimeout(resolve, 160));
      throw new Error('P0 deliberate offline initialization failure');
    };
    let observedWhileLoading;
    const pending = ensureMathOcrPipeline().then(() => 'UNEXPECTED_SUCCESS', () => 'EXPECTED_FAILURE');
    await new Promise((resolve) => setTimeout(resolve, 35));
    const themeButton = document.getElementById('theme-button');
    const initialTheme = document.documentElement.dataset.theme;
    themeButton?.click();
    const changedTheme = document.documentElement.dataset.theme;
    themeButton?.click();
    observedWhileLoading = {
      ...this.snapshot().model,
      themeChangeWorked: Boolean(themeButton && changedTheme !== initialTheme
        && document.documentElement.dataset.theme === initialTheme),
      readerControlsAvailable: document.querySelector('.app-header')?.inert !== true,
      readerKeyboardAvailable: document.querySelector('.reader-shell')?.inert !== true,
      noModal: !document.querySelector('.formula-ocr-init-overlay')
    };
    const outcome = await pending;
    const after = this.snapshot().model;
    importFormulaOcrRuntime = original;
    return { outcome, during: observedWhileLoading, after,
             noPermanentInteractionLock: !document.querySelector('.formula-ocr-init-overlay')
               && !document.getElementById('file-input').disabled };
  }
});
