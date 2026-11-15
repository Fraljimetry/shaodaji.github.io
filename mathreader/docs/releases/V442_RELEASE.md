# MathReader v442 — Structure geometry reliability

## Confirmed red/green defects

- The native two-column Structure classifier used `Math.max(...leftYs)` and similar unbounded argument spreads. A synthetic page with 320,000 text fragments reproducibly threw `RangeError: Maximum call stack size exceeded`. Replace with bounded-memory linear extrema scans.
- A typography-detected Structure title with `ratio: null` or `ratio: ''` was coerced to `0`, falsely certifying a missing position as a measured page-top bookmark. Reject missing ratios while preserving genuine numeric zero.
- Native heading location similarly coerced missing row `ratio` to page top; ignore lines lacking a numeric coordinate.

## Scope and evidence

- Targeted regressions verify the three failures as red on v441 and green on v442, plus real-text-layer replay fixture from v426. Dense-layout test is synthetic, not PDF certification.
- Existing manual positions and PDF-native authored non-top destinations remain authoritative.
- No extension to V5 itself. Real original-PDF navigation and model OCR remain uncertified without the reviewed inputs.
