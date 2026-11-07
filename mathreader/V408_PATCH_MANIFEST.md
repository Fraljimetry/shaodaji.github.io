# MathReader v408 — Results declaration vs. reference precision

**Apply onto:** the verified v407 source tree (v405 full ZIP + v406 ZIP patch + v407 ZIP patch). This archive includes only changed files below `mathreader/`. It is **not** a complete replacement source archive.

## Reproduction and fix

The user-provided 9-page original MathReader JSON export carries all PDF.js detection input lines and shows that v407 indexes `Theorem 4.1` at its abstract reference on p.1 and `Lemma 4.4` at another p.1 reference. These false entries suppress actual declarations under the sequence/dedup guard: the true Theorem 4.1 on p.4, and Lemma 2.1 on p.3. The new general-case grammar rejects unpunctuated narrative reference tails without stripping theorem labels or moving coordinates. It also blocks fallback misparses of appendix references such as `Theorem B.3 from ...` as `Theorem B`.

The detector cache version is 51 and the asset cache key is 408. Existing local caches are eligible for automatic rebuilding on reopening the original PDF; imported historical snapshots may require **Rebuild index**. The change does not modify source PDF pages, actual visual PDF navigation geometry, formula/OCR models, equation indexes, annotations, or accepted reload-persistence behavior.

## Changed files

- `mathreader/js/41-equations-bibliography.js` — reference-continuation filter and partial-appendix-label guard.
- `mathreader/js/00-core.js` — Results/Structure/Bibliography detector-version bump 50 → 51.
- `mathreader/mathreader.js` — runtime asset version 408.
- `mathreader/index.html` — HTML asset cache keys 408.
- `mathreader/tests/results_declaration_reference_v408_regression.js` — 23 source-level checks; 45 assertions when supplied exported input lines are replayed.
- `mathreader/tests/results_toc_regression.js` — update expectations for newly rejected TOC-style prose reference lines.
- `mathreader/tests/real_export_index_precision_v392_regression.js` — version assertion updated.
- `mathreader/tests/maintenance_integrity_regression.js` — cache/index version assertions updated.
- `mathreader/tests/equation_progress_regression.js` — inherited HTML asset-version assertion updated.
- `mathreader/tests/export_preferences_v397_regression.js` — inherited HTML asset-version assertion updated.
- `mathreader/tests/formula_ocr_lazy_regression.js` — inherited HTML asset-version assertion updated.
- `mathreader/REGRESSION.md` — evidence, reproduction, limitations and tests.
- `mathreader/regression/v408_release_gate.json` — completed release gate and corpus evidence counts.
- `mathreader/V408_PATCH_MANIFEST.md` — this manifest.

## Verification and constraints

- Pristine v407 standalone reproduction: **failed** first new assertion on false abstract `Theorem 4.1`.
- Corrected v408: **52/52 JavaScript suites passed**, **22/22 Python/Chromium suites passed**.
- New source-level Results test: **23/23**; full original nine-page exported PDF.js detector lines: **45/45**.
- All 67 `.js` files `node --check` passed; 22 Python tests parse; ten-part assembled runtime `node --check` passed.
- Five other full export input corpora replayed in addition to the user's nine pages; 475 pages overall. This replay does not certify perfect Results precision, all citations, formula OCR correctness or true production-browser operation.
- ZIP CRC and exact clean overlay replay onto pristine v407 are checked by release packaging.

**Visual/live acceptance:** after installing the patch, reopen the original PDF and let Results rebuild (or click **Rebuild index**). Verify Theorem 4.1 navigates to p.4, Lemma 2.1 to p.3, and no Lemma 4.4 appears as a declaration in this paper. Also inspect a longer mathematical textbook for any unexpectedly missing real declaration.
