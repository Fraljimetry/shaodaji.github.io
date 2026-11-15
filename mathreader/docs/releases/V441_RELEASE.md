# MathReader v441 — multi-column references and verified equation coordinates

## Confirmed defects (red/green)

- Splitting a PDF text-layer bibliography line collapsed whitespace but retained offsets from the uncollapsed source. This displaced key/body glyph positions and could corrupt column-aware reference recognition. Fragment text now retains original interior whitespace and faithfully rebases glyph offsets.
- Large PDF text-layer rows passed every part into `Math.min(...parts)`/`Math.max(...parts)`, risking an argument-limit error. Geometry bounds now use linear scans.
- Malformed glyph ranges could silently become a plausible fragment. Invalid source offsets are rejected before parsing.
- Deduplication of independently printed equation labels on the same page used raw confidence after the canonical scorer had selected fresh v386 page-frame geometry. Same-page deduplication now uses the established canonical evidence hierarchy, retaining distinct verified labels on different pages.

## Verification

- Red/green targeted regressions include whitespace and glyph offsets, dense 140,000-glyph fragments, malformed ranges, stale versus v386 coordinate priority, and repeated equation numbers on distinct pages.
- Bilingual tutorial updated. No model or V5 framework changes.
- Real scanned-PDF indexing and Texify model accuracy require separate reviewed evidence, not synthetic unit tests.
