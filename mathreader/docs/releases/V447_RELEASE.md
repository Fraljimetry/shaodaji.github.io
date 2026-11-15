# MathReader v447 — repeated Results and reference chronology

- Deduplicate same-page high-confidence Result observations using the earliest measured printed location, independent of OCR/text-layer arrival order, while preserving strong declarations on separate pages.
- Reject forward-only proof dependencies and derived corollary links, even when the target label appears exactly once. Resolve repeated labels by nearest preceding page and printed position rather than unsorted detector array position.
- Preserve unknown-position fallback where necessary; never interpret a null ratio as an actual PDF page-top measurement.
- Update the bilingual Tutorial; rebuild the Structure cache and browser module version.
- Add a red/green synthetic regression for shuffled OCR declarations, repeated chapter labels, invalid geometry, and forward-only references.

Verification results are supplied separately. Synthetic JavaScript regressions do not certify accuracy on original source PDFs or genuine Texify inference.
