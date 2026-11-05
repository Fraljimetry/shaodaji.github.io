// TEST-ONLY: injected into a temporary browser copy, never production source.
// Observe the actual PDF.js document and MathReader bibliography/link state.
window.__mathreaderP1E2E = Object.freeze({
  snapshot() {
    const anchor = snapshotDisplayAnchor();
    return {
      documentLoaded: Boolean(pdfDoc),
      pdfjsVersion: pdfjsLib?.version || null,
      fileKey: currentFileKey,
      fileName: currentFileName,
      pages: pdfDoc?.numPages || 0,
      anchor: anchor ? {page: anchor.page, ratio: anchor.ratio} : null,
      cached: Boolean(cacheEnabledForCurrent),
      localIds: localLibrary.filter(r => r.localAvailable).map(r => r.id),
      bibliographyCount: bibliographyEntries.length,
      confirmedTargets: [...confirmedBibliographyLinks.values()],
      returnDepth: crossDocumentReturnStack.length,
      returnButtonVisible: Boolean(crossDocumentReturnButton && !crossDocumentReturnButton.classList.contains('is-hidden')),
      busy: crossDocumentBusy,
      formulaLoading: Boolean(mathOcrLoading || mathOcrPipeline || formulaOcrInitModalVisible),
    };
  },
  async goto(page, ratio) {
    if (!pdfDoc || page < 1 || page > pdfDoc.numPages) throw new Error('Invalid page');
    await goToLocation(page, ratio, {contextLead:false});
    return this.snapshot();
  },
  async persistedLinkIds() {
    if (!currentFileKey) return [];
    const item = await dbMetaGet(bibliographyLinkStorageKey(currentFileKey));
    return [...normalizeConfirmedBibliographyLinks(item).values()];
  }
});
