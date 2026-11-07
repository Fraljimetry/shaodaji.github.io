# MathReader v387 — Meticulous OCR position-preserving index update

## Reported behavior

After manually running **Meticulous OCR** on a historical textbook page, additions to **Equations** can coincide with an unintended move in the PDF reading position or the Equations sidebar's own scroll position. Previous versions v383–v386 addressed equation *destination* coordinates, but did not preserve the user's *current viewport* across the index-rebuild transaction. These are different defects.

## Confirmed source defect

In v386, `runMeticulousPageIndexOcr()` saves OCR evidence, invalidates caches, then asynchronously rebuilds Structure, Results, Bibliography and Equations, reconstructing the scrollable equation-list DOM. It did not capture/restores reading position or Contents list positions around that process. Scroll events during a rebuild may also be persisted as the new session location. Even with correct equation `page/ratio` fields, a replacement index can move the sidebar because nodes above its viewport were inserted.

## v387 implementation

1. On the explicit right-click **Meticulous OCR** action, capture the active PDF object and file key, current reading mode, current page, PDF scroll top/left, continuous reading page+fraction anchor (where applicable), navigation generation, left-sidebar scroll and the scroll of the Contents lists.
2. For Equations specifically, record the first visible stable `equationOrderKey` and its pixel offset inside the list. New rows inserted *above* this item must not push the visible list to an unrelated label.
3. Restore after all derived indexes finish rebuilding, then check again after layout settles, before persisting the session. Use direct anchor/scroll restoration, **not** `goToLocation()`; no fake reading-trail entry, PDF-text search, or equation selection is triggered.
4. Do not override an explicit user scroll (wheel/touch/pointer), keyboard page navigation, toolbar page/zoom control, or a newer `goToLocation()` event. A different PDF or reader mode cannot receive a stale snapshot.
5. Apply the same restoration on OCR failure, when the document is unchanged. Drop the temporary event listeners on completion. Avoid waiting indefinitely on animation frames in hidden tabs.
6. Index-merging rules, existing equations, stored/manual equation destinations, OCR inference, and non-destructive recovery remain unchanged.

## Tested

- `node --check mathreader/js/00-core.js`, all other `js/*.js`, and bootstrap.
- Assembled runtime syntax.
- `node mathreader/tests/meticulous_position_preservation_v387_regression.js`: 25 executable checks covering PDF and Contents scroll snapshots, sidebar row anchor after 2 insertions, user action precedence, newer navigation, cross-document safety, continuous reading and event-listener disposal.
- `python mathreader/tests/meticulous_viewport_browser_v387.py`: real headless Chromium DOM/scroll geometry; two inserted equation rows retained the same visible `(17.27)` row at the same pixel offset, and PDF scroll stayed at 700px; newer navigation was not undone.
- All existing Node regression files in the reconstructed v386 baseline plus v387.

## Still unverified / known limitations

- **Deployed original-PDF browser end-to-end OCR remains unverified.** The available browser test recreates actual sidebar overflow with Chromium, but simulates the index update and does not run Tesseract.js/Texify or a live GitHub Pages deployment.
- A click on an equation *after* OCR remains a deliberate navigation command governed by its own OCR label geometry. The snapshot mechanism does **not** fix a truly incorrect stored equation target; those still require separate validation.
- If the user intentionally scrolls during a long OCR job, the user location is deliberately retained rather than forcibly returning to where OCR started.
- If the previously visible equation row is deleted by a manual operation, the sidebar falls back to its prior numeric scroll offset. Meticulous OCR itself does not delete rows.
- Pages with asynchronous layout shifts originating from unrelated code or fonts after the restoration frame may still require deployment-specific investigation.

## Browser acceptance checklist

1. Open Giusti 1984 PDF, locate `(17.11)` near the bottom of PDF page 222 and remember the PDF point and sidebar row.
2. Right-click that page → **Meticulous OCR**; do not interact during processing. Verify the PDF remains on the same text/equation and the same Equations row remains in view, even after new rows appear above it.
3. Click the newly added `(17.11)` in Equations. Verify it lands on the printed label on the intended page (separate **navigation target** acceptance).
4. Repeat in single-page mode, continuous mode, after scrolling to the very bottom, and after reopening the PDF.
5. Run OCR and deliberately change to another page while it works. Verify it does not pull the reader back. Switch PDFs while it runs; verify no cross-document restoration.
6. Run OCR on a page that yields no readable text; verify existing indexes and reading position remain intact.
