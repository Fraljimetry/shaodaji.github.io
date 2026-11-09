# MathReader v415 — Equation numbering recovery and independent regression

**Release scope:** equation-indexing only (with version/cache bump), safe duplicate-label navigation, numbered-condition false positives, and the existing broken test extraction. The documentation folder structure from v414 is preserved. Deliverable is the **complete `mathreader/` folder**; it must replace the old folder, not be overlaid onto it.

## Confirmed defects and general-purpose corrections

- Leon Simon's 267-page *Introduction to Geometric Measure Theory* has genuine PDF.js text-layer equation-marker candidates with `:` instead of the printed decimal separator. The old detector omitted many leading markers such as `3:6` and `3:7`. The new detector recognizes these as *candidates* and promotes only repeated, left-margin, math-like families with independently corroborated geometry. The original line's offsets remain intact for click and navigation precision.
- Section-local numbering restarts in separate chapters. The previous one-candidate-per-label canonicalization dropped repeated printed labels. Verified colon-family instances are now independently displayed and ordered by their source PDF page and ratio; navigation is page-local. Existing global-label Remove/Reselect cannot safely distinguish duplicates, so those commands are intentionally hidden for repeated printed labels. Per-location manual edit identity is a future design task, not silently approximated.
- Numbered conditions `(1)`–`(3)` below a Definition in the book were mistaken for equations. The definition/list introducer now excludes this narrow class of enumerations.
- Old local equation-cache schema 26 is invalidated by schema 27; asset key v414→v415. Portable reading-data imports remain accessible even if the original PDF text layer is unavailable. To replace an imported v414 detection snapshot, open its PDF and explicitly **Rebuild index**.
- Existing `tests/equation_margin_navigation_regression.js` used a greedy function-extraction pattern and failed on unmodified v414 with a VM syntax error; test extraction was repaired. No corresponding application behavior was changed.

## Evidence and measured validation

Source: user's exported `Introduction to Geometric Measure Theory_Leon Simon.pdf` reading data, document SHA-256 `8a261ff912d78cf839d102e99f317a391949d69c017e109dd2629796d4c3b999`, 267 PDF.js native-text pages. The export originally contained **48** equation-label index entries. The actual v415 equation builder replay over these exact exported page lines and geometry yields **145 distinct label identifiers** and **223 candidate occurrences**. Repeated `(1.1)` locations survive and page 7's false `(1)`–`(3)` labels are excluded. Counts describe detected candidates, **not a complete printed-equation ground truth**.

A new native-line fixture test was first executed on unmodified v414 and failed at its first missing colon candidate, then passed on v415. A second regression checks old local snapshots are rejected, portable snapshots retained, and duplicate page locations preserved. The available JavaScript and isolated Python/Chromium suite results are recorded in `../../regression/v415_release_gate.json`. No production live-browser verification, original-PDF image inspection, real OCR inference, or independently adjudicated full equation/formula recognition accuracy is claimed. Existing hard-reload OCR margin-evidence loss is unchanged by design.

## Main changed files

- `mathreader.js`, `index.html` — v415 browser source/cache keys.
- `js/00-core.js` — v27 local Equation cache schema.
- `js/41-equations-bibliography.js` — colon-family recognition, safe repeated-label handling, numbering-context exclusion.
- `tests/simon_colon_font_v415_regression.js` — baseline-failing Leon Simon native-text regression.
- `tests/equation_cache_v415_regression.js` — snapshot version and portable import regression.
- `tests/equation_margin_navigation_regression.js` — pre-existing test harness extraction fix.
- Existing version-assertion test scripts — updated to v415.
- `REGRESSION.md`, `docs/README.md`, this manifest, `regression/v415_release_gate.json` — evidence and documentation.

Application recognition changes are not document-name-specific. The user may swap in the complete folder after backing up the previous `mathreader/` directory, without a separate cleanup script.
