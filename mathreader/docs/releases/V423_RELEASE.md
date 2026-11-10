# MathReader v423 — Structure navigation respects the heading position

## Issue and reproduced baseline

In v422, clicking an embedded Structure bookmark with a page-only destination (`Fit`, `FitB`, or `XYZ` with unspecified top) called `goToMatchedLocation(page, 0, '')`. Because the title argument was empty, semantic matching was not attempted; the reader always scrolled to the top of that page, even when the heading was lower. An `XYZ` destination whose top coordinate was explicitly `null` was additionally converted through `Number(null) === 0`, falsely treating a missing position as the **bottom** of the PDF page.

`tests/structure_jump_position_v423.py` uses the **production** bookmark resolver and row-click handlers in real headless Chromium. With the unchanged v422 code, its first case—page-only `Fit` to a unique heading at page ratio 0.625—failed: it produced `{page: 2, ratio: 0}`. After the v423 change, the target ratio is 0.625. The test also calls the production `goToLocation()` against a scrollable Chromium page-surface stack; the heading lands at its requested viewport coordinate, rather than simply switching to its page.

This is a deterministic PDF.js-destination/DOM simulation, **not an end-to-end user-PDF and deployed-site test**. It proves the reproduced general failure class and the actual scroll math. Without the affected user's PDF, it does not establish that every observed top-of-page jump has this same cause.

## Corrective behavior

- Keep explicit `XYZ`, `FitH`, `FitBH`, and `FitR` vertical targets authoritative; support viewport transforms for rotated/cropped pages.
- Distinguish author-provided vertical coordinates from page-only bookmarks. A null top is **unspecified**, not zero.
- For a page-only embedded bookmark, look up its own heading text on that page using existing page text/OCR evidence. Recover only a **unique, sufficiently exact** heading-line match; ignore unrelated prose references and do not invent positions from missing/ambiguous text.
- Preserve manual Reselect positions and correctly measured inferred Structure positions. No reinterpretation of stored manual edits.
- Reject asynchronous heading-position lookups that outlive a document switch, a different Structure click or another navigation request. Do not trigger an OCR job or network fetch to satisfy a navigation click.
- No changes to automatic Structure, Results, Equation or Bibliography detection or their cache schema (Structure schema remains 57). The browser asset version alone advances to 423 for module cache invalidation.

## Regression scope

New browser cases include page-only `Fit`, explicit `XYZ`, `XYZ` null top, nonexistent headings, ambiguous same-page matches, manually reselected bookmarks, inferred headings, rotated viewport positioning, document-switch cancellation, and real scroll alignment. The earlier v419 Chromium manual Structure test was updated only to provide the navigation serial and document key in its synthetic environment. Four source-identity assertions were updated to the v423 cache keys.

The test suite is source-backed and uses real Chromium for these interactions. **It does not certify every actual PDF bookmark mode, embedded outline quality, original-PDF rendering, or OCR accuracy.** Reading in `fit-page` mode may display the entire page, leaving no within-page vertical scroll range; this is expected.

## Delivery

Overlay-only ZIP, exactly one top-level `mathreader/` path with **changed/new files only**, applied over existing v422. It is not a complete folder and does not remove unchanged files. Previous index data and manually authored Structure edits are preserved.
