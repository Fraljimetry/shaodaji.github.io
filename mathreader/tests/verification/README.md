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
