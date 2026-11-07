# MathReader v390 — Meticulous OCR context-menu layout regression

## Incident and exact root cause

A deployed-browser screenshot of Giusti's *Minimal Surfaces and Functions of Bounded Variation*, Appendix A (PDF page 231), showed the text `Meticulous OCR · page 231` displaced to the bottom-left of the browser instead of appearing as a compact context action near the right-click position.

The runtime already created `.page-ocr-context-menu` in `document.body` and assigned `left/top` from the pointer's `clientX/clientY`, **but the CSS contained no declaration for `.page-ocr-context-menu`**. Since the default element position is `static`, assigning `left/top` did nothing. The menu consequently entered normal document flow. Separately, the status element `.page-ocr-status` is appended as an extra child of the two-row `.pdf-pane` grid, also without CSS. This could change the pane's grid layout/reading viewport when status was displayed.

## Minimal correction

- Add a viewport-fixed, bounded, themed `.page-ocr-context-menu` style and compact menuitem button style, with keyboard focus/hover/disabled states. Keep original pointer-positioning and event logic unchanged.
- Give `.pdf-pane` a positioning context and render `.page-ocr-status` as an absolutely positioned, pointer-transparent toast, never as a third grid track. Retain original completion/error auto-dismiss logic.
- Update `mathreader.js` and HTML resource cache keys from 389 to 390. Do not change OCR engines, preprocessing, page selection, OCR triggers, recognition heuristics, equation numbering, source coordinates, merge behavior, caching, or navigation.

**This is a location/layout bug, not evidence that mathematical OCR has been certified.**

## Regression evidence

- `python mathreader/tests/meticulous_ocr_menu_browser_v390.py`: real Chromium CSS/DOM checks for correct pointer placement, bottom-right clamp, light and dark themes, click action, disabled action, Escape/outside dismissal, preserved scrolling, unchanged two-row grid geometry and nonblocking OCR status. OCR inference is mocked.
- All 32 existing JavaScript regression files pass on v390, including additive OCR, equation-order and navigation, appendix numbering, OCR cache/idempotence, and reading-position safeguards.
- Chromium: 176/176 responsive/UI assertions; 13 OCR DOM geometry; 19 equation landing / hOCR frame geometry; v387 scroll anchoring; v388 long appendix indexing; other P0/P1 offline comparator/isolation tests pass.
- `node --check` for the bootstrap and every JS subsystem; assembled ten-part runtime parse; ZIP integrity and clean-apply verification required before release.

## Invariants for all later releases

1. Right-click **Meticulous OCR** stays near the pointer, clamped within viewport edges. It may never appear as an unpositioned body-flow element.
2. The OCR status must not change the PDF pane's grid rows, page position, zoom, sidebar scroll or active document. Neither menu nor status may intercept ongoing PDF scroll after dismissal.
3. Status and menu must honor both themes without white-only hardcoded surfaces. Existing Equations sidebar `OCR` remains a separate manual equation recheck button; the right-click action is the full meticulous current-page OCR.
4. Always run the actual DOM/CSS browser context-menu regression alongside equation navigation, additive OCR/appendix indexing, and viewport preservation. CSS syntax/string checks alone are insufficient.
5. The current regression does **not** establish full original-PDF MathReader Tesseract.js or Texify OCR mathematical recognition accuracy; keep that acceptance status OPEN until paired original-image mathematical ground truth and browser OCR are available.
