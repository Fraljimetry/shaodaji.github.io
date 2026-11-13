# MathIllustrator Cut 04 — v0.5.0 adversarial audit and incremental verification

**Date:** 2026-11-12. **Source authority:** exact `mathillustrator_cut03_overlay.zip` compared byte-for-byte to the extracted Cut03 tree before editing; site root `index.html` and `tools.html` unchanged from the prior Cut03 integration. **Delivery:** cumulative root-relative ZIP overlay; no `mathreader/` files.

## Changed focus (not a repeat of Cut03)

The user requires every iteration to search for **different subtle bugs**. This cut emphasizes semantic interchange roundtrips, document-instance identity, pen/pointer finalization, same-content cross-tab states, transparency/hit-test consistency, and independently editable point radius. Existing Cut03 coverage (export guides, page crop, degenerate geometry, corrupted local storage, background pan cancellation, and basic tex escaping) remains a baseline, not the sole acceptance criterion.

## Red → green evidence: new confirmed defects

| ID / severity | Baseline failure and mechanism | Corrective action | Regressions / provenance |
| --- | --- | --- | --- |
| MI-TEX-040 **HIGH** | `tikz-cd` importer split `A \& B` at `&`, making two nodes from one semantic label. Reproduced in standalone Node script, Cut04 Node test initially red. | Ampersands escaped by an odd number of backslashes are literal text; only unescaped top-level `&` divides cells. | `cut04.test.mjs` escaped-ampersand test GREEN. |
| MI-TEX-041 **HIGH** | Exporter accepted node text `A & B` or `A \arrow[r]` as if safe; reimport created extra cells/arrows. Reproduced with a roundtrip and red Node tests. | Export is permitted only if reimported source has exactly the same grid cells, labels, directed incidence and edge labels. Unsupported/ambiguous sources are rejected, making the export option disabled before clicking. | Three `cut04.test.mjs` semantics assertions GREEN; existing `tikz_compile.py` still compiles legitimate subset. This is not a general TikZ parser or pixel-fidelity proof. |
| MI-DRAW-042 **MEDIUM** | During freehand pointer drag no stroke was drawn until release; final `pointerup` point was ignored when no preceding pointermove arrived. New isolated browser test was RED on Cut03. | Live draft uses selected correction mode; final pointer release position is appended when distinct, then same correction commits; cancel/lost capture retains rollback behavior. | `browser_cut04.py`: preview, endpoint, canceled stroke, JSON shape count GREEN. |
| MI-UI-043 **HIGH** | A detached property field from a removed project could edit an unrelated new project's object with the same `o1` ID. Old delete and list controls had analogous hazards. Browser test was RED. | Verify **object instance identity**, not ID alone, for property edits, delete/focus, object-row selection, visibility and lock controls. Stale callbacks become inert or report an explicit error. | `browser_cut04_stale.py`: replacement document with reused ID, old name input, delete button, and hidden toggle GREEN. |
| MI-PTR-044 **HIGH** | Final-point drag handling could snap an off-grid point even when user only clicked to select. Hardware may deliver `pointerup` without a final `pointermove`. | Drag threshold 3 screen pixels; simple selection preserves original numeric coordinates, while true drag honors final event position and creates one undo state. Nonprimary hover events are ignored. | `browser_cut04_pointer.py`: click at `(0.13,0.26)` stays exact, pointerup-only drag updates position and undo restores GREEN. |
| MI-STOR-045 **MEDIUM** | A fresh tab received a storage event containing exactly its current document, but its `lastStored` token stayed stale; next save raised a false conflict. | Adopt identical persisted bytes, cancel redundant timer and acknowledge synchronized state. Divergent content still pauses autosave. | `browser_cut04.py` with explicit **isolated localStorage double**, not a real two-tab atomicity proof, GREEN. |
| MI-EXP-046 **MEDIUM** | A point styled with opacity zero retained an opaque point label and a transparent-but-active point hit disk; TikZ point label did not carry opacity. | Propagate alpha to point/node/morphism labels and point TikZ primitive, eliminate zero-alpha point hit disks and SVG hit strokes. | `browser_cut04_opacity.py`: editor DOM, downloaded SVG and TikZ inspected, GREEN. Cross-browser pixels unverified. |
| MI-EDIT-047 feature | Existing points had no independent radius control; changing document defaults changed historical point sizes. | New points store optional individual `style.pointSize` (1–100), editable on left panel and used by SVG/TikZ and hit sizes; older v1 objects lacking property continue to read document global radius. | Added `cut04.test.mjs` validator compatibility/invalid-values assertion; 4 example JSON fixtures still valid. |

## Verification matrix — actual execution, not inferred

| Gate | Result | Exact environment / scope |
| --- | --- | --- |
| `node --test tests/*.test.mjs` | **42/42 PASS** | Node v22.16.0; model grammar, graph, compatibility, and the four new Node cases |
| `node --check src/*.mjs` | **PASS** | Syntax for five ES modules (app, model, geometry, diagram, plot) |
| Ten Chromium suites | **10/10 PASS** | `/usr/bin/chromium` via Python Playwright, isolated page `set_content` with inlined imports: `browser_smoke`, `browser_edges`, `browser_storage`, `browser_cut02`, `browser_cut03`, `browser_cut03_storage`, `browser_cut04`, `browser_cut04_stale`, `browser_cut04_pointer`, `browser_cut04_opacity`. These are real browser interactions/downloads but **not HTTP**. |
| JSON Schema validation | **4/4 PASS** | `jsonschema` Draft 2020-12 on 4 version-1 example projects, including legacy no-point-radius records |
| LaTeX | **2/2 PASS** | Two test outputs compiled with actual `pdflatex`: one mixed TikZ figure, one restricted tikz-cd scene; compiler success alone is not vector visual/semantic certification |
| Static website integration | **PASS** | Existing root bilingual home+Tools links, MathReader presence, relative module/CSS/tutorial paths checked from extracted site root. Not a deployed-site test. |
| Standalone HTML parser | **PASS** | Python HTMLParser parsed tutorial and confirmed v0.5 features present; not a complete accessibility audit. |
| Packaging | **PASS after final archive check** | ZIP integrity, paths, file contents and upgrade simulations over previous installed Cut ZIPs; see `cut04-package.json`. |

## Performance probe (honest negative finding)

`tests/browser_performance.py` in isolated headless Chromium, point-only scene and one measured rebuild per size:

| Objects | SVG DOM descendants | Frontend import-to-object-count | Last full SVG rebuild |
| ---: | ---: | ---: | ---: |
| 100 | 202 | 165.0 ms | 5.3 ms |
| 1,000 | 2,002 | 279.6 ms | 23.1 ms |
| 3,000 | 6,002 | 625.9 ms | **69.8 ms** |

This is **not an improvement claim** over Cut03's 43.4 ms one-off result. Single-run variability and environment effects prevent a trustworthy cross-release comparison. 3,000 points exceed a 16.7 ms frame budget. Full SVG rebuild, anchor scans and freehand preview remain performance targets. Neither 60 FPS nor smooth interaction on ordinary laptops is certified.

## Compatibility and known limitations

- `project.version` remains **1**, not app release 0.5; old documents without optional style radius are still valid. Existing object IDs, their math references, user settings and schema format remain unchanged.
- `tikz-cd` exporter is intentionally **more restrictive**: documents formerly (incorrectly) considered exportable may now show a disabled choice if they cannot be round-tripped without semantic corruption. TeX source labels render literally on SVG; full math typesetting and general `tikzpicture` import remain unsupported.
- `Save` native JSON remains the only lossless editable format. SVG and TikZ are visual depictions, and the exact 2D style/scale equivalence is not guaranteed.
- True simultaneous cross-tab writes remain nontransactional; browser storage/quota/crash and pagehide races remain concerns. Correct same-value handling does **not** implement merge or locking.
- Production GitHub Pages navigation and HTTP MIME handling, real Windows Edge, Firefox, Safari, touch hardware, PDF vector measurements, font fidelity and screen-reader operation are **UNVERIFIED** in this environment.
- Export page guide is viewport-relative, not publication-exact A4/Letter. No native PDF, Asymptote, animation, Möbius transforms, 3D surfaces or Ricci flow solver is claimed.

## Next novel subtle issues to pursue

1. Native SVG marker ID collisions when multiple exported illustrations share one HTML document; repeated objects/overlaid SVG.
2. Cross-tab real two-origin concurrency and tab suspension; storage failure/quota fault-injection beyond doubles.
3. Very large path buffers, view zoom/resize while pen active, browser pointer coalescing and high-frequency events.
4. Exact print/page units, SVG/PNG glyph parity and text metrics under non-Latin/TeX labels.
5. Mathematically invalid but finite shape configurations (coincident node centers, circumcircle constraints, extreme zoom) and direct handling of Bézier handles.
6. Large-scene DOM/heap profile and batched geometry/hit-testing; no performance guarantees from one run.

**Release policy:** Preserve this record and historical Cut00–03 evidence separately. Future cuts should add fresh red tests from new risk classes, not merely repeat this list.
