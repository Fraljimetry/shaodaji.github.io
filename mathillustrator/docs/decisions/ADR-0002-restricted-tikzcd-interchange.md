# ADR-0002 — Restricted but explicit semantic `tikz-cd` interchange

**Date:** 2026-11-12  
**Status:** Accepted for v0.2.0; further syntax intentionally disabled

## Decision

Store a commutative diagram as position-bearing semantic `node` objects and reference-bearing `morphism` objects. Use the same live-edit dependency and JSON schema as ordinary geometry, but **do not** silently interpret unrecognized TeX syntax or render TeX macros in the browser. Allow a small, deterministic `tikz-cd` subset, parse it as data, and generate complete `tikz-cd` output for representable node-only/morphism-only visible scenes. Check representability before enabling the export control.

## Implemented grammar and limitations

- Single `\\begin{tikzcd} ... \\end{tikzcd}` environment, `&` cell separators, `\\\\` row breaks and `\\arrow[direction, "label"]` commands, optional `'` to swap label side.
- Direction is one or more letters from `r,l,u,d`, representing a destination cell. Maximum 40 rows and 40 columns; every target must exist.
- Plain node labels and TeX-source strings are stored verbatim, but **canvas text is not TeX-typeset**. Compiling exported TeX remains the user's responsibility.
- No arbitrary TikZ/PGF macros, node styles, bend options, labels with quoted syntax, named anchors, self-loops, matrices or complex arrow routing. Reject these with an explicit error.
- Export rejects unsupported types, bent arrows, hidden endpoints, colliding grid coordinates or non-grid-aligned node placements. It preserves incidence and labels but not all visual styling.
- JSON remains the only lossless format for full project editability and live mathematical dependencies.

## Safety / compatibility

No `eval()`, TeX execution or remote rendering. Treat imported TeX as untrusted source text; labels are inserted into SVG with DOM text nodes, not HTML. Import replaces the current project only after parsing, validating and user confirmation, and is undoable. The data schema remains v1 and loads earlier Cut00 JSON through explicit defaults.

## Future requirements

Syntax coverage should increase only with round-trip fixture tests for every supported arrow option, edge case, malformed input, and style/semantic fidelity limitation. A true LaTeX math label renderer or general TikZ importer requires a separate, versioned and security-audited module.
