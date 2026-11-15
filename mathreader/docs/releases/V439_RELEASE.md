# MathReader v439 — equation identity, OCR/native cache isolation, PDF line robustness

Baseline: supplied v436 source plus v437 and v438 overlays. Changed-files-only website-root overlay; no Git commits.

## Defects reproduced and fixed

1. **Equation location wrong PDF page:** In a repeated-number family, a new v386 measurement on another page globally excluded an older but valid v385 same-page observation. Navigation now first restricts to the intended page, then prefers v386 geometry within that page. Cross-page recovery remains guarded when multiple pages are possible. Manual edits still win.
2. **Stale text-index evidence after manual OCR:** `pageTextLines()` returned its cache before checking for an active/restored manual-page OCR overlay. Restored OCR now takes precedence even when the native page was previously cached.
3. **Native evidence accidentally using OCR content:** Native-only probes could return previously cached manual OCR, and active full-document OCR could silently replace a native-only query. The native-only route now bypasses both OCR sources with a disposable cache, preserving OCR index lines afterward.
4. **Full-document OCR activation with old native cache:** OCR evidence now takes priority when the source switches to OCR-backed pages; native cache entries can no longer mask that activation.
5. **Very dense PDF rows:** Removed unbounded `Math.min/Math.max(...array)` argument spread in line assembly, avoiding argument-limit errors on pathological glyph-heavy rows; computes x bounds and height in one pass.

Regression: `tests/equation_navigation_cache_v439_regression.js`, executed with the same production functions via VM, covers repeated labels, modern/legacy OCR coordinates, manual edits, cached native/manual text, full-document OCR activation and native-only retrieval. These are deterministic synthetic production-function tests, **not** original-PDF or actual Texify certification.

The bilingual Tutorial explains the updated navigation behavior and the remaining uncertainty of repeated OCR labels. Version and cache keys are updated to v439.

## Evidence

Full V5 post-change verification: **142 checks = 140 PASS, 0 FAIL, 2 INCOMPLETE** (83 JavaScript and 39 Python/Chromium tests selected), plus syntax/inventory and engine self-tests. The two incomplete historical export corpus tests are `full_text_exports_v400.py` and `seven_export_evidence_v401.py`; required external original evidence was not available. Original-PDF navigation certification and real Texify model inference remain unavailable without independently reviewed assets and model evidence. Historical export corpus checks are incomplete when corpus resources are absent; never report them as passed.
