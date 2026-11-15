# MathReader verification engine — V2 — integrated runner

This engine is a local **test runner and evidence gate**, not an OCR accuracy certificate. It is designed to be installed under `mathreader/tests/verification/` and run against the **complete, latest MathReader source tree**. It does not change application behavior.

## Run

From the parent directory of `mathreader/`:

```powershell
python mathreader/tests/verification/release_gate.py --profile quick
python mathreader/tests/verification/release_gate.py --profile full
python mathreader/tests/verification/release_gate.py --profile quick --only "settings|ocr"
python mathreader/tests/verification/release_gate.py --profile release --hosted-url https://shaodaji.cc/mathreader/
python -m unittest discover -s mathreader/tests/verification -p "test_*.py" -v
```

A JSON report is written to `mathreader/tests/verification/release_gate_result.json` (override with `--output`). Exit codes: **0 PASS, 1 FAIL, 2 INCOMPLETE**. A timeout is a failure, not a pass; a missing dependency or missing historical test is incomplete, not a pass. The full profile invokes each discovered root-level `tests/*regression*.js`, `tests/*test*.js`, and `tests/*.py` directly, with per-test process timeouts. `quick` selects high-priority tests by filename. The runner is intentionally sequential to avoid browser/model contention. It reports discovered and selected file counts, source fingerprint, per-check duration, exit status and output tails.

## Evidence levels (do not conflate)

1. Source syntax and module inventory.
2. Node.js regression logic (may involve fixtures/replays).
3. Python browser/Chromium tests (may mock PDFs/models).
4. Hosted page smoke: checks that the deployed page loads without uncaught page errors, **not** that a real PDF was read.
5. Original-PDF navigation/geometry acceptance: requires a coordinate-grounded original-PDF oracle and runtime adapter.
6. Real Texify OCR inference: requires actual inference and manually reviewed mathematical ground truth.

The last two are **explicit INCOMPLETE release checks** until real adapters and evidence are available. Thus the initial release profile cannot be marked certified by syntax tests, mocked Chromium, or empty fixture folders. The manifest `v436_inventory.json` is a historical inventory only and does not claim current test execution. `coverage` categories are lexical discovery aids, **not** precision, recall, or functional correctness proof.

## Mandatory subtle-bug protocol

Every bug fix must include a red/green case where practical and evaluate second-order interactions: async cancellation; repeated clicks; stale PDF or model state; cross-tab updates; invalid persisted data; failed writes; rollback; cache invalidation; multilingual layout; import/export compatibility; silent fallback; and false-success UI. Run `quick` during development and `full` for candidate delivery. Release claims require external evidence in addition to `full`.

## Known limitations of v1

- No live original-PDF/PDF.js oracle adapter or real Texify scoring adapter yet.
- The runner does not itself verify mathematical detection precision/recall or PDF coordinate targets.
- Test classification by filename/Playwright import is heuristic. Per-test evidence provenance must be inspected before making accuracy claims.
- Browser testing requires installed Playwright and Chromium. Some Python tests may require extra dependencies.
- Original 41-PDF corpus availability and the latest complete source must be verified separately.
- Do not commit generated `release_gate_result.json` as historical proof of another version.

## V2 improvements and limitations

- Detects a system Chromium executable as well as the bundled Playwright browser, without claiming that every browser script supports both. Browser launch failures still block the gate.
- Runs the engine's self-test file as a required check. A missing or broken self-test prevents PASS.
- Saves `<output>.partial` atomically **after each completed check**, retaining an explicit `INCOMPLETE` status if an outer watchdog interrupts the run. A fully completed run writes the final JSON and removes the partial file.
- `--only REGEX` is for bounded diagnosis; **it always makes the profile INCOMPLETE**, even if all selected checks pass. Run the unfiltered profile to assess full coverage.
- `SKIPPED` corpus evidence is INCOMPLETE and cannot certify original-PDF accuracy. `0 skipped` alone is not an actual skip.
- The full profile enumerates all root-level `tests/*.js` and `tests/*.py` matching existing naming conventions; it does not certify undiscovered nested tests or real mathematical model accuracy.
- The HTML/PDF corpus and genuine Texify accuracy release gates remain INCOMPLETE until a source-grounded measurement adapter and evidence exist. The hosted browser gate is only a smoke test.
- Exit codes: 0 PASS, 1 FAIL, 2 INCOMPLETE. If an external process kills the runner, inspect the `.partial` file and **do not** treat its completed checks as full gate success.

## V3: original-PDF geometry oracle (strictly separate from live navigation)

`pdf_oracle.py` validates manually specified **page/text/rectangle** targets directly against the **original PDF text layer** using PyMuPDF (`pip install pymupdf`). It does *not* exercise MathReader's detection algorithms, PDF.js rendering, scroll/click handlers, or Texify. It never sets `navigationCertified=true`.

Create a manifest alongside the actual PDFs, using this schema (replace placeholders with independently reviewed values):

```json
{
  "schemaVersion": 1,
  "documents": [
    {
      "pdf": "original-book.pdf",
      "sha256": "<actual 64-character SHA256 of the original PDF>",
      "targets": [
        {
          "kind": "structure",
          "page": 3,
          "text": "1 Introduction",
          "rect": [60, 110, 240, 134],
          "tolerancePt": 5
        }
      ]
    }
  ]
}
```

Page numbers are 1-based; rectangles are PDF-space points `[left, top, right, bottom]` as reported by PyMuPDF (top-left origin). Supported kinds: `structure`, `results`, `equations`, `bibliography`, `navigation`. Use actual PDF text-layer strings and reviewed rectangles; a scanned PDF without selectable text requires a separate image-backed oracle and must not be forced through this checker. The checksum prevents silently testing a different PDF revision. Relative paths cannot escape the manifest directory. There is no bundled corpus or invented ground truth.

```powershell
python mathreader/tests/verification/pdf_oracle.py D:\\path\\to\\oracle.json --output D:\\path\\to\\geometry_report.json
python mathreader/tests/verification/release_gate.py --profile full --pdf-oracle D:\\path\\to\\oracle.json
python mathreader/tests/verification/release_gate.py --profile release --hosted-url https://shaodaji.cc/mathreader/ --pdf-oracle D:\\path\\to\\oracle.json
python -m unittest discover -s mathreader/tests/verification -p "test_*.py" -v
```

`PASS` for native PDF text coordinates only proves that the *given* gold text/coordinates exist in that original PDF; it does **not** establish that MathReader found them, navigated to them, or that an OCR model inferred LaTeX correctly. The `release` gate intentionally remains `INCOMPLETE` without a real MathReader navigation adapter and real Texify evidence. A missing original PDF is `INCOMPLETE`; a checksum mismatch, bad page, wrong geometry, malformed target, or manifest-directory traversal is `FAIL`. The engine includes adversarial synthetic-PDF self-tests, clearly labeled as synthetic.

## V4: MathReader exported-index oracle (reviewed targets, no invented truth)

`index_oracle.py` compares the **actual MathReader reading-data export** with
reviewer-entered Structure, Results, Equations, and Bibliography targets.
It checks export SHA-256, MathReader schema, document identity, page count,
explicit detection inclusion, normalized labels, pages and vertical page ratios.
It compares repeated labels as separate occurrences, preventing one indexed
entry from satisfying multiple reviewed targets.

Manifest example (store next to the actual export JSON):

```json
{
  "schemaVersion": 1,
  "documents": [{
    "export": "original-book-mathreader.json",
    "sha256": "<64-character SHA256 of the exported JSON>",
    "documentId": "<document.id from the exported JSON>",
    "pageCount": 250,
    "targets": [
      {"kind": "structure", "label": "1 Introduction", "page": 3, "ratio": 0.25, "toleranceRatio": 0.025},
      {"kind": "results", "label": "Theorem 1.2", "page": 9, "ratio": 0.6},
      {"kind": "equations", "label": "(2.1)", "page": 13, "ratio": 0.72},
      {"kind": "bibliography", "label": "[11]", "page": 247, "ratio": 0.3}
    ],
    "exhaustiveKinds": []
  }]
}
```

`exhaustiveKinds` is a list of index kinds for which the reviewer manually
verified **all** instances in the document, including absence of extras.
Only these kinds receive a precision estimate, and unreviewed exported entries
then count against the gate. For all others, only *reviewed-target recall* is
reported; `precision: null` is intentional. The denominator for recall is the
number of valid reviewed targets, not every formula in the PDF.

Run the standalone command with the reviewed manifest or pass
`--index-oracle PATH` to `release_gate.py`. A missing export is INCOMPLETE;
invalid or mismatched evidence is FAIL. The release gate also requires the new
oracle self-tests and never accepts a missing oracle manifest as certification.

**Evidence limitation:** A saved export may contain old cached detection or
manual edits. Passing this oracle proves only that the saved **indexed data**
match the supplied reviewed targets. It does *not* prove fresh auto-detection,
correct PDF.js click/scroll coordinates, or actual Texify recognition.
The original-PDF native-text oracle and the saved-index oracle remain distinct.
A fully certified release still requires independently witnessed real-PDF
browser navigation and real Texify inference.

## V5: complete verification-framework integration (evidence-gated)

V5 integrates the remaining operational framework components; it **does not** assert
that unavailable original-PDF or Texify accuracy evidence has been measured.

- `browser_campaign.py` runs the **actual MathReader assembled runtime** in
  Chromium using the existing isolated P0/P1 browser probes and pinned genuine
  `pdfjs-dist@4.10.38`. Each reviewed target names a category, a precise
  index label, page and vertical ratio. The test clicks a real index entry in
  production DOM, waits for the real PDF navigation anchor, and rejects wrong
  pages, mismatched positions, duplicates, missing results, or unfinished
  detection. Original-PDF SHA-256 is required. No fake PDF.js adapters.
- The same browser campaign can execute **actual browser Texify inference**
  on reviewer-specified PDF crop coordinates with `--real-ocr`. It requires an
  actual model backend and compares observed LaTeX against independently
  reviewed expressions (whitespace-insensitive edit distance, default exact
  match, configurable explicit maximum normalized error). Actual MathJax
  compilation is checked. No model, image crop, or reviewed answer means
  INCOMPLETE, not PASS. The runner never substitutes vector text or Tesseract.
- `stress_gate.py` repeats real regression scripts (reader navigation,
  Settings, search, equation indexing, OCR lifecycle), enforces per-attempt
  performance ceilings, records repeat variability and fails on flaky tests,
  skipped tests, or timeouts. Some underlying browser tests use mocked PDF or
  model operations; stress evidence **is not live-PDF/OCR certification**.
- `release_gate.py` integrates both, running expensive external campaigns in
  supervised subprocesses with hard limits. It requires all historical tests,
  syntax, self-tests, original-PDF text geometry, reviewed saved-index export,
  hosted smoke, real-PDF browser navigation, actual Texify comparisons and
  repeated performance tests to certify `release`. Empty, partial, fake,
  contradictory or absent evidence fails closed.

A reviewed browser campaign manifest, stored beside the original PDF, looks like:

```json
{
  "schemaVersion": 1,
  "documents": [
    {
      "pdf": "original-book.pdf",
      "sha256": "<SHA-256 of original PDF>",
      "navigation": [
        { "kind": "structure", "label": "1 Introduction", "page": 3, "ratio": 0.25, "toleranceRatio": 0.06 }
      ],
      "ocr": [
        { "page": 3, "rectPdfPt": [100, 150, 350, 215], "latex": "x^2+y^2=z^2", "maxNormalizedError": 0.0 }
      ]
    }
  ]
}
```

`navigation` entries must be independently checked in the original PDF.
Unreviewed or ambiguous labels are not acceptable as authoritative ground
truth. OCR crops are measured in PDF points from the page's top left. For
release certification, additionally supply the V3 `--pdf-oracle` and V4
`--index-oracle` evidence files and `--hosted-url`.

Example (from the website root; local pinned PDF.js assets and a real Texify
model installation are prerequisites):

```powershell
python mathreader/tests/verification/release_gate.py --profile release `
  --hosted-url https://shaodaji.cc/mathreader/ `
  --pdf-oracle D:\Reviewed\geometry.json `
  --index-oracle D:\Reviewed\indexes.json `
  --browser-campaign D:\Reviewed\browser.json `
  --pdfjs-build D:\Dependencies\pdfjs-dist-4.10.38\build `
  --mathjax-js D:\Dependencies\mathjax\es5\tex-chtml.js
```

**Current evidence boundary:** The provided v436 source tree does not bundle
pinned PDF.js assets, original 41-PDF corpus, reviewed formula targets, or
Texify model weights. This engine is executable and adversarially self-tested,
but release certification remains INCOMPLETE without that independent
material. Never treat generated synthetic PDFs or previous exports as a
replacement for original-PDF MathReader acceptance. The engine must not be
expanded indefinitely: future work should focus on genuine bug reproduction
and improving substantive regression coverage.
