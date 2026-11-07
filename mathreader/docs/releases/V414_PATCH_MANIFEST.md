# MathReader v414 — changed-files-only root ZIP patch

Apply over the fully installed **v413**. This is a differential archive, **not** a complete replacement source tree.

## Corrections

- Detect genuine imperative numbered Example headings (including printed Examples 191–193) without accepting prose references.
- Conservatively recognize explicitly numbered Chinese mathematical declaration headings (the printed Egorov 定理 4.1).
- Simplify English/Chinese welcome copy, make the Results filter accurately say “Filter results,” and clarify unopened-PDF/empty index messages.
- Make the welcome view scroll when necessary on narrow phones while preserving centered layouts elsewhere.
- Increment Results cache index 54→55; browser CSS/JS asset version 413→414.
- No changes to actual OCR engine, bibliography parser, equation click geometry, zoom, storage or accepted hard-reload persistence limitation.

## Every included file

Each entry is relative to the root-level `mathreader/` directory in the ZIP. New files are labeled.

- `REGRESSION.md`
- `index.html`
- `js/00-core.js`
- `js/41-equations-bibliography.js`
- `mathreader.css`
- `mathreader.js`
- `regression/v414_extra_pdf_wording_aesthetic_audit.json` **(new)**
- `regression/v414_release_gate.json` **(new)**
- `tests/equation_progress_regression.js`
- `tests/export_preferences_v397_regression.js`
- `tests/formula_ocr_lazy_regression.js`
- `tests/maintenance_integrity_regression.js`
- `tests/real_export_index_precision_v392_regression.js`
- `tests/results_chinese_numbered_v414_regression.js` **(new)**
- `tests/results_declaration_reference_v408_regression.js`
- `tests/results_example_imperative_v414_regression.js` **(new)**
- `tests/ui_copy_layout_v414.py` **(new)**
- `V414_PATCH_MANIFEST.md` **(new; this file)**

## Evidence and gates

- `regression/v414_extra_pdf_wording_aesthetic_audit.json`: eight new original-PDF SHA-256 identifiers, 145 pages, four independently confirmed Results additions and zero removals/bibliography changes.
- `regression/v414_release_gate.json`: completed 61/61 JavaScript and 27/27 bounded Python/Chromium suites, 80 bilingual layout/copy assertions and 176 responsive assertions.
- Six older complete MathReader detector-input exports reproduced byte-identical Results and bibliography rows (including navigation coordinates).
- Changed-files-only ZIP CRC and clean application over a pristine v413 source tree verified byte-for-byte.

**Limitations:** Native-line PDF proxy and isolated Chromium DOM tests are not a real deployed PDF.js + Texify/OCR session. No universal zero-error Results, Bibliography, Structure, or formula-recognition certificate is claimed. Unnumbered Chinese declarations and handwritten source pages remain outside this conservative change.

