# v400 root patch manifest

Apply this ZIP over an existing **v399** MathReader directory. This is not a full replacement.

## Changed/new source and documentation

- `mathreader/mathreader.css`: Settings typography hierarchy, 12px parent / 11px group / 10px sublabel.
- `mathreader/index.html`: explicit "PDF text and stored OCR, if available" setting description; v400 asset cache keys.
- `mathreader/js/60-notes-bookmarks-data.js`: nativeTextCoverage statistics, extraction-completion semantics unchanged.
- `mathreader/mathreader.js`: v400 bootstrap cache key.
- `mathreader/REGRESSION.md`, `mathreader/EXPORT_COVERAGE_v400.md` (source/coverage, limitations, release evidence).
- `mathreader/regression/v400_export_coverage_manifest.json`: SHA-256 and native-text page counts from the seven actual source exports.
- Tests: `full_text_coverage_v400_regression.js`, `full_text_exports_v400.py`, `settings_heading_hierarchy_v400.py`, and version-sensitive existing Node regression fixtures.

## Gates

- 45/45 JavaScript regression suites pass. JavaScript syntax passes (bootstrap, ten source parts, assembled runtime).
- 19 distinct Python/Chromium suites passed on at least one run; `p1_browser_smoke.py` failed once in the first sequential run at "open enabled after confirmation" and passed its standalone rerun. Do not misreport the first aggregate run as all-green.
- Actual original seven-export digest replay passed: 595 page records, 585 with native text, 10 native-textless; full-document OCR not stored in all seven.
- New Settings test uses real Chromium, 12 width/theme pairs, all three group headings and nested labels; v399 wrapping test and Stop OCR test pass.
- No live Tesseract.js/Texify image-to-text accuracy or whole-document recognition completeness certification.
- ZIP root/path integrity and a clean v399-to-v400 replay gate required before release.
