# MathReader v450 — Structure bookmark alignment

## Root cause

PDF producers often serialize multiple PDF bookmarks to the same upper-margin XYZ position (for example, 36 pt below the top). v449 treated any positive `positionKnown` value as precise except at ~0, so clicks landed near the top of each page instead of the corresponding title. Additional matching failures occurred because the PDF outline omitted the printed numeric heading prefix.

## Correction

- For bookmarks near the upper margin (normalized ratio <= 0.12), attempt unique exact heading recovery from page-native text and its measured Y before navigating.
- Recognize that identical stored page/ratio destinations shared by multiple outline entries are coarse—even when farther down the page; recover only when a unique heading match is found.
- Match title text with or without a leading printed hierarchical number, but reject arbitrary body text, table-of-contents page-number suffixes, missing coordinates, and ambiguous repeated titles.
- Keep manually reselected positions and genuine individual non-top destinations. Preserve navigation cancellation/document identity checks.

## Evidence

Provided original 19-page Calderon–Zygmund course-note PDF: all 28 bookmarks use a 36pt top-margin coordinate; 27 corresponding titles on their indicated pages were localized in independently extracted original text-line/span geometry and verified through the production matching function. In real Chromium, four bookmarks on page 3 land on distinct measured title positions using production scroll alignment. One PDF-supplied bookmark points to the contents page with different title text; this is not silently guessed or certified.

Node: 96/96 root-level JS tests exited 0. Targeted structure/navigation Chromium/Python: 6/6 exited 0. A full sequential V5 run was interrupted before completion, and an attempted concurrent all-Python run timed out. Neither is claimed PASS. Historical export evidence, scanned PDF OCR and genuine Texify inference remain unverified.
