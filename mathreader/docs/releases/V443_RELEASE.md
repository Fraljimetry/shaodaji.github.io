# MathReader v443 — Two-column Content Detection boundaries

## Confirmed issues
- Results wrapped-reference suppression linked a declaration to adjacent prose from the opposite column when it appeared on the left; fix symmetric column isolation.
- Results mistook an opposite-column “PROOF OF” heading for the continuation of an unnumbered parenthetical theorem heading; limit suppression to the same column.
- Structure reconstructed a split heading from overlapping, unordered, or missing-coordinate text fragment geometry; reject malformed fragments and retain unsplit source text.

## Verification provenance
- New regression suite reproduces these failures before the patch and tests positive same-column and legitimate split-heading controls.
- Existing historical Results reference and PDF text-layer navigation replays provide independent compatibility coverage.
- Original-PDF live navigation and true Texify OCR remain uncertified without reviewed evidence.
