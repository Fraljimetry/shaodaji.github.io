# v422 — Real 30-PDF native-content proxy audit and Results declaration recovery

## Scope and evidence

The prior v421 journal-paper selection was not executed. v422 instead obtained **30 actual mathematical PDF bytes** from the user's file library. The corpus spans **708 pages** and **1,335,713 native text characters**. It includes published research papers and mathematical lecture/research notes, with some related editions; it is **not 30 distinct journal papers**. Source SHA-256 values, titles, candidate counts, and stage statuses appear in [`../../regression/new30_corpus_v422.json`](../../regression/new30_corpus_v422.json).

The independent extraction script [`../../regression_tools/native_span_corpus_v422.py`](../../regression_tools/native_span_corpus_v422.py) reconstructs PDF.js-like page spans from actual PDFs using PyMuPDF; the Node runner [`../../regression_tools/corpus_detector_vm_v422.js`](../../regression_tools/corpus_detector_vm_v422.js) executes MathReader's production JS Structure, Results/Bibliography, and Equations detectors in an isolated VM. **This is not the browser's actual PDF.js text layer or real Math OCR**. A PASS means an execution completed, not that its index is correct.

## Demonstrated fix

The detector incorrectly rejected declaration labels immediately followed by the first subpart `(a)` or `(i)` (e.g., **Theorem 2.12. (a)**), as well as substantive parenthetical names containing nested mathematics (e.g., **Theorem 6.1 (Weak (1,1) plus strong (2,2))**). It also rejected named theorem statements starting **As distributions, ...** because of an overly broad prose-reference guard.

The conservative fix accepts a balanced, bounded mathematical heading name and an explicitly punctuated first `(a)` or `(i)` item with a substantive uppercase statement; bare prose references like “Theorem 4.2(a) shows ...” remain rejected. The fixture [`../../regression/fixtures/new30_result_headings_v422.json`](../../regression/fixtures/new30_result_headings_v422.json) contains ten original-PDF line-geometry cases (six genuine declarations and four negative prose references); four additional synthetic adversarial controls are included in [`../../tests/new30_result_headings_v422_regression.js`](../../tests/new30_result_headings_v422_regression.js). The unchanged v421 classifier failed this targeted test; v422 passes.

The 30-file replay recovers **14 extra genuine Results entries** (535 → 549 candidates): eleven in `0810.5645v6.pdf`, one in the positive-mass note, and two in the Calderón–Zygmund note. These specific additions were checked against the original text, and selected original pages were rendered for visual confirmation; this does not independently validate all 549 candidates. **Equations and Bibliography detectors were not changed**; their candidate counts remain 1,879 occurrences and 413 entries respectively. They should not be interpreted as accuracy rates.

## Validation

- **70/70 JavaScript tests PASS**, including real-PDF line-geometry fixtures and previous Leon Simon/STOC/manual Structure safeguards.
- **29/29 Python/Chromium test files PASS in separate runs** (the lengthy combined process exceeded its execution window). The responsive browser-shell test separately passed **176/176 layout assertions**.
- **30/30 original PDF files, 708 pages, 90/90 detector stages executed without exceptions** using the reproducible PyMuPDF span proxy.
- The Structure detection cache advances **56 → 57**, so stale local Results indexes are invalidated. Equation cache stays at 29 because its classification was not modified.
- Historical Ahlfors OCR evidence refresh limitation is unchanged and accepted. Scanned PDF recognition, full PDF.js parity, inference responsiveness, and complete page-by-page precision/recall are **not certified**.

## Distribution

Overlay-only ZIP: changed files under a top-level `mathreader/` path; extract into the site repository parent. No original PDFs or generated caches are included. No deletion script or full-folder replacement is required.
