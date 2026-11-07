# MathReader v401 — Export copy cleanup and OCR evidence durability

**Baseline v400.** User asked to remove two redundant English/Chinese lines under Settings → Export data. The entire note, its decorative separator, and unused CSS are gone. The two checkbox labels and descriptions remain and no new settings or buttons are introduced.

## Seven actual user exports: what changed

Seven newly supplied exports represent 595 PDF pages (585 with native PDF text). All include the requested `contentDetection` and `fullDocumentText` payloads, **not** a stored full-document image OCR cache. Detection counts are stable against the preceding seven exports: Results, Equations and Bibliography are unchanged; Ahlfors Structure has the intended 61→60 correction. Existing Result and equation navigation coordinates match in both generations.

**New defect exposed:** The preceding exports had **291 pages with targeted `equationMarginOcr` observations**, allocated among Yamabe 56, Giusti 72, Ahlfors 49, SPS/Bakry 18, Banach 10, L. Simon 13, and Yau 73. All seven new exports have **zero** such records, although the checkbox remained enabled and published equation labels still exist. The code held these OCR observations only in `equationSupplementalOcrCache`, reset when a document was reopened. A final equation label is not a replacement for the native OCR evidence that produced it.

## v401 bounded fix

- Persist **completed** targeted equation-margin OCR observations under the exact SHA-based document key in the existing local IndexedDB `meta` store, once per OCR pass. **Do not** persist unresolved Promises, OCR workers, PDF binaries, or the entire full-document OCR pipeline.
- When a full-text export is explicitly enabled, restore stored observations and report `fullDocumentText.equationMarginOcrCoverage.pagesWithEvidence`. This requires **no new OCR run** and never changes published equation labels.
- Reject caches with mismatched versions, page counts, invalid pages/sides, duplicate identities, or malformed records before mutating the live map. A delayed IndexedDB read must not publish into another PDF. Current-run OCR evidence wins over cached evidence. A partial later run merges prior persisted page records instead of wiping them.
- When a PDF is forgotten from the local library, delete this extra cache key. Persist errors or storage limits must not interrupt recognition. Cache payloads above 6 MB are deliberately not stored; this is an explicit known limitation, not a silent fallback to image OCR.
- Existing old exports **cannot retroactively recreate** observations already evicted from memory. For future runs, the equation-margin scan must finish at least once under v401 for persistence to begin.

## Limitations and regression evidence

Do not confuse 291 retained margin-*page observations* with 291 fully transcribed pages. None of the seven documents has a complete stored full-document image OCR transcript. New exports with `fullDocumentText.equationMarginOcrCoverage.pagesWithEvidence=0` remain fully valid native-text exports but lack margin OCR diagnostic evidence. Original seven-export bytes are not bundled; manifest `regression/v401_seven_export_evidence.json` pins their SHA-256 digests and counts. To replay the actual source pairs, set `MATHREADER_EXPORT_CORPUS_DIR` and run `tests/seven_export_evidence_v401.py`.

The source tests cover persistence, schema validation, cross-document races, partial-record retention, forgetting, export-only restoration, UI positioning, and all existing OCR/math navigation regressions. No Texify, Tesseract recognition rules, equation heuristics, or UI engine defaults were altered. Full live production-browser OCR verification and independently judged formula accuracy remain outside this patch.
