# MathReader v410 — root-level differential patch manifest

Apply over the **exact v409 source** (v405 complete ZIP followed by v406, v407, v408, and v409 patches). This archive contains only changes from v409.

## User-visible correction

- On initial opening in Continuous reading, a transient failed or apparently blank page automatically gets one fresh-canvas repaint after two layout frames, without changing zoom or moving the reading position.
- A successful PDF.js paint on a legitimately white or sparse page is not rejected merely because its 48×48 pixel thumbnail is uniform.
- If continuous rendering really fails, attempt the existing independent primary renderer as the final recovery route; retain the error if all approaches fail.
- Bound attempts, invalidate on document/page generation change, preserve OCR/Results/Bibliography/indexing behavior.
- Update asset version to v410; do not change persistent index/schema versions.

## Changed or added files

- `mathreader/REGRESSION.md`
- `mathreader/V410_PATCH_MANIFEST.md`
- `mathreader/index.html`
- `mathreader/js/30-rendering-navigation.js`
- `mathreader/mathreader.js`
- `mathreader/regression/v410_release_gate.json`
- `mathreader/tests/continuous_initial_repaint_v410.py`
- `mathreader/tests/equation_progress_regression.js`
- `mathreader/tests/export_preferences_v397_regression.js`
- `mathreader/tests/formula_ocr_lazy_regression.js`
- `mathreader/tests/maintenance_integrity_regression.js`

## Verification

55/55 JavaScript suites and 23/23 Python/Chromium suites passed (two historical slow harness tests individually). The new isolated Chromium test executes production rendering functions but controls PDF.js painting to reproduce the timing; it is not original-PDF/live-browser production acceptance. All source syntax checks, archive CRC, and byte-exact clean replay against the original v409 baseline must pass for release.
