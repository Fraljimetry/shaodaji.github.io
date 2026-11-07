# MathReader v386 — Equation navigation vertical drift

## Reported failure

After manual **Meticulous OCR**, a newly inserted equation such as `(17.11)` can navigate noticeably above its printed label. The apparent error becomes more pronounced toward the bottom of a page. An affected, previously saved entry may even have an earlier page/section target.

## Original-PDF evidence

- Original file examined: *Enrico Giusti, Minimal Surfaces and Functions of Bounded Variation* (1984), 253-page copy, PDF page **222** (printed p. 209).
- The genuine **(17.11)** appears in the **left margin** at native PDF text geometry y≈531.3 on page height≈614.64: normalized top coordinate ≈**0.864**.
- Independently rasterized at 3× and cropped to the outer left margin, local Tesseract 5.5 recovered `(17.11)` at raster y=1605 on a 1844-pixel-high page: normalized y≈**0.870**. This corroborates the PDF position to within about 0.006 page heights.
- The exact Tesseract-generated hOCR file was also parsed with the **actual v386 `pageRecordFromHocr()`** in Chromium; its `(17.11)` ratio was **0.8703904555**, corroborating the native PDF geometry. This remains a local Tesseract CLI sample, **not** the deployed browser's Tesseract.js output.

## Confirmed source defect and mechanism

`pageRecordFromHocr` normalized line and word boxes by the **caller canvas** width/height, without reading the hOCR page bbox. If Tesseract internally supplies hOCR in a different image frame, an OCR y value that belongs to the hOCR frame is divided by the wrong denominator. The resulting error is *affine*, increasing with y. For example, a glyph at `1280/1600 = 0.80` is incorrectly stored as `1280/2000 = 0.64` if the canvas is 2000 pixels tall. A browser DOMParser regression executes this exact case.

This explains a plausible progressive drift; whether Tesseract.js actually resized a particular user's page during the failed scan is **not established** without inspecting that browser's raw hOCR payload.

## Changes

1. Parse the actual `.ocr_page` hOCR bbox; normalize every hOCR line, word, part and height within that coordinate frame. Use canvas dimensions only when the hOCR page frame is missing/invalid. Keep rendered-page width/height unchanged for normal display.
2. Newly measured margin positions receive a v386 provenance marker. Prefer v386 over v385 candidates; serialize the marker into the equation-index snapshot.
3. When an explicit rescan measures the same label, replace the **position observation** for that same page/label. Retain the label itself, unrelated equations, and existing non-destructive OCR text observations. This is idempotent across rescans.
4. The Equations sidebar consults saved, measured, individually verified margin evidence first. If exactly one vetted page exists for a label, it can supersede a stale page number; ambiguous different verified pages and intentional manual edits are not silently overridden.
5. `goToLocation` aligns the target against the actual onscreen PDF surface rectangle and then checks again after a frame. This avoids relying exclusively on cumulative placeholder offsets, gaps, or obsolete page metrics. A navigation request is guarded against a newer click, document switch or reading-mode switch.
6. Keep manual invocation of Meticulous OCR, manual equation ordering, document history, Texify inference configuration and existing indexes intact. No automatic rescanning or new UI controls.

## Validation completed

- All **29** Node regression `.js` files pass, including **17** targeted v386 navigation assertions and existing v385 reference/navigation tests.
- **19** Chromium checks pass against the real DOM layout and original `pageRecordFromHocr` helper: ten long-document position checks, three executions of the actual asynchronous `goToLocation()` body, and two single-page checks across different page heights and reflow/zoom, plus four checks of hOCR frame normalization. The PDF pages are simulated in the Chromium test; these are **not full PDF.js OCR tests**.
- JavaScript syntax / assembled 10-module runtime syntax and ZIP integrity check pass.

## Unverified / limitations

- Live Tesseract.js image recognition and exact navigation against the uploaded Giusti file in the user's deployed browser have **not** been run here.
- Old v381–v385 stored ratio values cannot always be corrected purely from the number. **After installing v386, run Meticulous OCR once on the affected page** to generate a v386 measurement, then click the label again. Already correct labels need no rescan.
- If the user's Tesseract hOCR page bbox matches the canvas exactly, the hOCR-frame fix is not the cause of that particular drift; the viewport-geometry alignment and vetted-target lookup still provide independent safeguards. Capture page + ratio / hOCR metadata if a discrepancy persists.
- No claim of 100% OCR precision or complete P0 recognition accuracy; broad printed/scanned/handwritten OCR regressions remain separately required.
