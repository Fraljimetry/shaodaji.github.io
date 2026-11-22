# MathReader v452 — rendered-heading Structure navigation

## Finding

The older regressions proved only that a bookmark could be mapped to a
nonzero PDF page ratio. They did not validate the actual title after the
production text layer finished painting. v451 repaired insufficient scroll
range, but still relied on its pre-render target; delayed PDF.js layout can
leave the final viewport at a different position.

## Change

- For approximate, automatic Structure destinations, inspect the rendered
  native/OCR text-layer spans after the page finishes painting.
- Uniquely identify the visible title on the selected page, then align its
  measured DOM position to the reader viewport and save the actual scroll.
- Verify serial/document identity across each awaited frame so older clicks
  cannot override a newer request. Never override manually reselected or
  precise, noncoarse author destinations.
- Keep the previous extraction-based destination when the rendered heading
  cannot be verified. No silent invented coordinates.
- Update the bilingual tutorial and versioned JS loading.

## Verified

- New real Chromium DOM click-to-scroll regression: four different headings
  with identical initial near-top bookmark destinations land at four distinct
  viewport offsets; manual selection preserved.
- All JavaScript regression scripts completed successfully.
- Targeted Chromium geometry/scroll tests completed successfully.

## Not certified

The test places actual browser DOM spans and runs production navigation and
heading-matching functions, but it does not load the PDF through the CDN-hosted
PDF.js runtime. The supplied original PDF proves headings have distinct source
positions; live deployed-browser PDF.js behavior and incorrect-page bookmarks
remain unverified. Do not claim production acceptance from these results.
