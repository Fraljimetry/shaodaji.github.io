# MathReader verification engine — initial implementation

This engine is a local **test runner and evidence gate**, not an OCR accuracy certificate. It is designed to be installed under `mathreader/tests/verification/` and run against the **complete, latest MathReader source tree**. It does not change application behavior.

## Run

From the parent directory of `mathreader/`:

```powershell
python mathreader/tests/verification/release_gate.py --profile quick
python mathreader/tests/verification/release_gate.py --profile full
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
