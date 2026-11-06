# MathReader v384 — OCR reliability patch

This is a **root ZIP patch**, not a standalone site. Extract at the repository root, preserving `mathreader/...` paths, over the authoritative v383 source. It contains only changed/new files. See `OCR_AUDIT_v384.md` for the detailed defect analysis and unverified limitations.

## Changes

- Cached full-document OCR now restores independently saved meticulous-page OCR evidence.
- Additive OCR records are idempotent for per-word observations, and old invalid bottom-clipped line coordinates are upgraded only when newly measured geometry matches the original text and horizontal placement.
- Same-label equation targets can be corrected by genuine image-margin OCR, which takes precedence over stale native text/cached targets.
- Text-only OCR fallbacks without hOCR coordinates no longer masquerade as geometrically verified equation-margin positions. Actual measured hOCR geometry is marked and preferred on later rescans.
- Late Texify/image OCR completions cannot overwrite another PDF's formula history or notifications after a file switch.
- Full-document OCR frees both active and prefetched page canvases on recognition failure/stop.
- Two new executable test files: Node lifecycle/data-race regression and real-Chromium DOM/canvas geometry regression.

## Gate

For a fresh current-source checkout from the repository root:

```bash
node --check mathreader/mathreader.js
node mathreader/tests/ocr_reliability_deep_regression.js
python mathreader/tests/ocr_browser_geometry_regression.py
python mathreader/regression_tools/p0_gate.py --source-root mathreader --out-dir ./mathreader-audit-v384
```

The source/browser-shell gate can pass while **full original-PDF + Texify OCR acceptance remains incomplete**. The attached audit does not claim all OCR recognition errors are fixed, nor claim 50 real historical books were successfully processed.
