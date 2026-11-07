# MathReader v407 — Reference preview dismissal patch

**Apply on:** complete v405 source ZIP plus the earlier v406 patch (or an identical v406 source tree). **Archive type:** changed-files-only overlay ZIP with a single `mathreader/` root.

## Reproduced failure

In v406, leave-event dismissal only hid the popup and cancelled `referencePreviewTimer`, but an already-running `referencePreviewData()` Promise could still return and reopen the popup. This is reproduced by the new isolated Chromium test; the untouched v406 baseline failed the `late Promise cannot reopen after leave` assertion.

## Behavior

- Preview disappears synchronously on leaving its reference link.
- Late PDF resolution cannot reopen a dismissed or superseded preview.
- Pointer movement, outside clicks, page scroll and window blur dismiss orphaned or stale previews; safe when PDF page overlays are detached and rebuilt.
- Keyboard focus and blur behavior remains supported. Popup retains `pointer-events:none`.
- No change to OCR, PDF navigation destinations, page-render caching, mathematical indexing, settings, display CSS or persistence.

## Changed files

- `mathreader/index.html` — v407 stylesheet/runtime cache keys.
- `mathreader/mathreader.js` — v407 part-fetch cache key.
- `mathreader/js/00-core.js` — owner and global listener state.
- `mathreader/js/70-command-ui-runtime.js` — preview lifecycle fix.
- `mathreader/REGRESSION.md` — permanent defect, fix, test and limitations.
- `mathreader/tests/reference_hover_lifecycle_v407.py` — 13 Chromium checks; failed on v406 and passed on v407.
- `mathreader/tests/maintenance_integrity_regression.js` — inherited cache-key assertion.
- `mathreader/tests/equation_progress_regression.js` — inherited cache-key assertion.
- `mathreader/tests/formula_ocr_lazy_regression.js` — inherited cache-key assertion.
- `mathreader/tests/export_preferences_v397_regression.js` — inherited cache-key assertion.
- `mathreader/regression/v407_release_gate.json` — gate inventory and limits.
- `mathreader/V407_PATCH_MANIFEST.md` — this file.

## Verification

- 51/51 JavaScript suites passed.
- 22/22 Python/Chromium suites passed across bounded batches; the one new Chromium test checks 13 event and pending-Promise cases.
- 62 JavaScript source/test checks and assembled 10-part source `node --check` passed; 22 Python test files parsed.
- Real Chromium pointer/focus interactions used. PDF lookups were mocked to force slow resolution; this is not a deployed production-browser or original-PDF accuracy test.
- The accepted browser-reload OCR evidence limitation is unchanged.

## Manual acceptance after deployment

Open a PDF containing equation or theorem reference links. Hover to show a snapshot, then move the mouse away while it loads and after it appears. The card should close immediately and stay closed. Repeat when moving quickly between links, scrolling, switching documents and navigating by keyboard focus.
