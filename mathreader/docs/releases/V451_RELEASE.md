# MathReader v451 — Structure viewport scroll-range correction

## Reproduced defect

v450 recovered correct text-layer heading ratios, but the reader sometimes
could not scroll to those ratios. In single-page mode, a PDF page can be shorter
than the reader viewport (especially after zoom-out), leaving `scrollTop`
clamped to zero even though the heading ratio is correct. At the final page of
continuous reading, insufficient content below the heading causes the same
clamping. The earlier stubbed-navigation tests checked ratios but did not cover
this browser scroll-range constraint. Thus a real user could still see the
page top after clicking Structure.

## Fix

Reserve temporary trailing scroll extent for non-top page-local navigation:
- Single-page mode: apply bottom margin to the primary page surface, without
  changing PDF/canvas/text-layer coordinate space.
- Continuous mode: apply bottom padding only when navigating within the final
  page; earlier pages already have following content.
- Clear reserve on page-top navigation or when it is not needed.
- Preserve existing heading matching, reader scroll alignment, history and
  async cancellation safeguards. Advance JavaScript cache key to v451.

## Verification and scope

The v451 Playwright test uses production `goToLocation` and measured Chromium
scroll offsets, with a page shorter than its viewport, and checks that target
headings reach the reader's context-leading position. It also covers the final
continuous page and clearing of the reserve. Existing real-PDF text-heading
localization regression uses independently extracted geometry from the user
supplied Calderón–Zygmund PDF; it is not a live PDF.js integration test.

Actual deployed-browser/live PDF.js acceptance and native inference remain
separate from geometry/harness verification. No claim of complete real-world
certification is made here.
