# MathReader v446 — Results proof ordering and indexing robustness

- Explicit proof targets now choose the nearest **preceding printed instance** by page and position, rather than trusting OCR/text-layer arrival order.
- Implicit proof ownership uses same-column geometry to avoid assigning an unrelated declaration; legacy missing-geometry fallback is maintained.
- Reject invalid page indices and malformed index-header geometry.
- Remove argument-spread overflow when deduplicating exceptionally large Results observation groups.
- Add red/green regression assertions for scrambled OCR ordering, cross-column ownership, invalid coordinates, and 140,000 duplicate detections.
- Bilingual tutorial note added.

Verification: synthetic JS logic tests do not certify original-PDF accuracy or real Texify inference. Full V5 gate status is reported separately.
