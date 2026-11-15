# Round 168 — Hover candidate, Free Curve movement and Node controls

## Confirmed defects and fixes

1. Selection affordance was only visible after clicking. A live hover candidate now previews the semantic target for Move/Pan and supported geometry constructions. Points outrank overlapping paths when point-compatible; a supporting circle/line retains the correct type restriction on the following construction step. The preview is visual only; it never changes selected IDs or document state.
2. Free Curve objects could be selected but Move/Pan-auto-object could not translate them. Added a transactional whole-curve drag, translating both displayed `path` and optional original `rawPath`; preserves curve type, regularity, stroke, and all other properties. Undo/redo uses the existing history path. Cancel restores the original document.
3. Node Font size and Node border were rendered on separate rows. A dedicated responsive two-column row now aligns the controls without affecting Text properties.

## Executed verification

- `node --check src/app.mjs`: exit 0.
- `node --test tests/*.test.mjs`: 568/568 passed, zero failures/skips, exit 0.
- `tests/browser_round168_hover_drag.py`: real headless Chromium at 1440 and 1024 px passed. Checks Free Curve preview, whole-curve drag, undo, Node row, and point-over-line preview for circle inversion.
- `tests/browser_round167_point_over_line.py`: 1440 and 1024 px passed, including point-first actual inversion source picking and V/H shortcuts.

## Explicit limits

Not executed: exhaustive mobile/touch dragging, every geometry tool and step combination, full historical browser suite, hosted site, extended GPU/memory stress. These results do not constitute exhaustive certification. No glyph changes, no Git commit.
