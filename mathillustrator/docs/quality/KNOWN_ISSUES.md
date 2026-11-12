# Known issues and limitations — v0.1 (2026-11-12)

**Do not close an item based solely on code inspection.** Test browser behavior and outputs using a real deployment or locally served site on Windows.

| ID | Severity | Behavior / limitation | Next verification or remedy |
| --- | --- | --- | --- |
| MI-001 | High | Headless browser smoke test blocked by runtime administrator policy. Real GUI viewport, property editing, live snapping and full export chain remain unverified in this environment. | Run manual / Playwright smoke on Windows or a permitted browser host. |
| MI-002 | High | TikZ exports static coordinates and cannot re-import; dependency round-trip is absent. | Build semantic TikZ parser and serializer with fidelity suite. |
| MI-003 | Medium | SVG/PNG/JPEG/WebP raster fidelity, stroke clipping and font fallback not yet independently inspected. | Golden render/compare on Chromium, Firefox, Safari. |
| MI-004 | Medium | A4/Letter are guides, not physical sizes; crop-to-frame/PDF export absent. | Separate viewport, artboard and export box with physical units. |
| MI-005 | Medium | Auto-correction does not identify an intended circle/line or handle align/tangency constraints. | Add shape recognition, posterior undo and tunable tolerance. |
| MI-006 | Medium | Scene uses complete SVG reconstruction on each frame; no performance benchmarks on 1k/10k objects yet. | Profile and optimize with viewport culling, spatial index and cached render nodes. |
| MI-007 | Medium | Function plot sampling misses some asymptotes and cannot guarantee faithful branches; no robust implicit plotting. | Adaptive discontinuity-aware sampling and math engine tests. |
| MI-008 | Medium | Dragging a segment, circle or group directly does not translate anchors; users must drag free points. | Add safe group/transform operations preserving dependencies. |
| MI-009 | Medium | Polygon tool must be completed with Enter or double-click. Rapid double-click may create an undesired extra vertex near the last point. | Define unambiguous end gesture and interaction tests. |
| MI-010 | Medium | Zoom Fit considers points/freehand/text, not circle radii and full analytic function extents. | Implement correct world bounds per geometry type. |
| MI-011 | Medium | Programmatic points are numeric literals only; no symbolic values or linked algebraic expression. | Extend typed expression and named parameter graph. |
| MI-012 | Medium | Browser local storage may fail; Save downloads are essential. Undo history is memory-only. | Explicit persistence dashboard and quota tests. |
| MI-013 | Low | Arrowheads use document-level default stroke instead of the arrow's exact edited stroke. | Give each arrow a color-specific marker or draw arrow geometry. |
| MI-014 | Low | Text in canvas is plain SVG text, not LaTeX typeset. | Add safe MathJax/KaTeX math label pipeline and TeX export parity. |
| MI-015 | Medium | Toolbar/shortcut/touch accessibility has not been comprehensively audited. | Keyboard and touchscreen/browser matrix. |

There are no claimed solved high-order geometry, 3D, or topology issues, because those features do not yet exist. Do not mark an item resolved without a test and evidence reference.
