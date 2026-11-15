# Round 167 — Geometry hit-selection overlap

## Reproduction
Build point P=(0,0), a later vertical line through P, and an inversion circle. Select Circle Inversion, then click directly on P. Before the patch the source was the line rather than P (real Chromium, source ID o4); after the patch it is point o1. The inversion circle remains selected as the second operand.

## Fix
For first operands of point-compatible transformations, use the existing geometric point hit index before considering the DOM's z-ordered SVG hit. Do not apply this point preference to curve-only tasks and later typed operands. Drawing order and glyphs are unchanged. The existing keyboard shortcuts V (Move) and H (Pan) are verified, not newly introduced.

## Tests
- Red/green Chromium regression: old source fails at refs o4/o7; fixed source passes at refs o1/o7.
- Interactive Chromium: viewport 1440 and 1024, click actual geometry, verify saved transform references and shortcut switching.
- Node: 568/568 pass; JavaScript syntax pass.

## Not certified
Other construction tool families and all mobile touch picking were not exhaustively tested. The hosted deployment was not accessed. No claim of full geometric certification.
