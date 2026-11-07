# v404 — Ahlfors import / reload loss and OCR cache ordering (UTC+08, 2026-11-07)

## Real user-observed acceptance failure

The three complete Ahlfors full-text exports all identify the same 172-page source PDF by SHA-256 `970cda290270daa397d0bd5a06da4e423bb548d1556e71c1135f54fd637ac949`.

| Export | Timestamp UTC | Records / pages with equation-margin evidence | OCR lines | Annotations | Reported persistence |
| --- | --- | ---: | ---: | ---: | --- |
| `(3).json`, backup before import | 2026-11-07T03:06:05.830Z | 49 | 1,053 | 2 | `verified` |
| `(4).json`, after importing earlier 172-page evidence | 2026-11-07T03:07:00.685Z | 172 | 4,054 | 0 | `verified` |
| `(5).json`, after webpage reload | 2026-11-07T03:07:33.139Z | **0** | **0** | 0 | `no-evidence` |

All 49 page records in `(3).json` exactly match those same page records in the earlier first export. All 172 `(4).json` OCR records, including every line's original geometry, exactly match the first export. The `(4)` -> `(5)` loss is real, despite `(4)` reporting same-session write verification. The two annotations in `(3)` were overwritten by the previous Import command's standard whole-session import behavior; this is a separate, confirmed issue, not OCR loss.

## Proven source bug and bounded fix

v403's `openPdfSource` calls `loadEquationMarginOcrEvidence` **before** `loadDocumentState` and `clearTextDerivedIndexesForUnavailableDocument`. Both reset `equationSupplementalOcrCache` to an empty Map. Thus the in-memory records retrieved at PDF open are immediately discarded, and the equation-index preparation cannot reuse them. The open-document Import path also restores OCR evidence **before** `loadDocumentState`, producing the same overwrite. This is directly reproduced by the v404 ordering regression, which fails against v403.

v404 performs the durable OCR load **after** session/text-availability resets and **before** equation-index construction, in both open and import paths. A post-import restore failure now reports an error rather than claiming recovered evidence. Document hashes, per-page journal v2, commit verification, OCR generation, equation classifiers, page navigation, reading export options, and normal standard-session Import semantics remain unchanged.

**Limit:** this order-of-operations defect is definite and fixed at source level. The three exports alone cannot establish whether the underlying IndexedDB records also disappeared after the actual reload. The `readingDataRawDetectionSnapshot()` export route attempts to re-read IndexedDB, so the observed `(5)` zero record count **could also indicate a separate storage/restore failure**. Do not claim that v404 has solved the production P0 until the same PDF survives a new verified live export→reload→export. This runtime cannot certify a persistent browser origin.

## Local regression and recovery

- `tests/equation_margin_restore_order_v404_regression.js`: fails against exact v403 source; passes after v404 fix. Verifies open/import ordering around the session reset, text availability, document-index startup and a minimal cache-state sequence.
- Retain the existing v401/v402/v403 journal, snapshot, corrupted-record, cross-document, partial-scan and browser-function suites. Their simulated IndexedDB acceptance is not a real reload test.
- The original user `(3).json` is the authority for the newer two annotations and reading state, while `(4).json` provides the 172 OCR records. The independently provided recovery copy `Ahlfors_recovery_172pages_plus_annotations.json` starts from `(3)` and fills OCR page observations from `(4)` only under exact document ID/page agreement; it contains **2 annotations and all 172 observations / 4,054 lines**. This auxiliary recovery copy is NOT a MathReader-produced live export. Its `persistence` marker is intentionally `recovery-not-yet-verified`. Retain the user's originals.

## Live browser acceptance gate still pending

1. Deploy only the v404 root patch over v403, and confirm the new asset version loaded.
2. Open the exact Ahlfors PDF; import the independently merged recovery JSON (it includes both original annotations and OCR evidence), then export both full text and detection data. Inspect `pagesWithEvidence` and `persistence`.
3. Close/reopen the PDF and export again **without OCR**; then reload the webpage and reopen the same PDF and export once more.
4. Compare exact observations (page/side/text/coordinate arrays), PDF SHA, and the two annotations against the recovery JSON. Expect 172 records, 4,054 lines, and 2 annotations at all stages.
5. If loss recurs, collect same-origin IndexedDB state and console errors before making another speculative persistence change. Also test rescan, Stop, Forget, quota, corruption, multiple tabs and timing before broader certification.

No claim of live production IndexedDB durability, original math-formula transcription accuracy, or complete Ahlfors equation-label accuracy is made by this release.
