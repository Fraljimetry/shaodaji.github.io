# MathIllustrator Cut 06 — v0.7.0, novel-risk audit (2026-11-12)

## Scope, baseline, and provenance

Cut06 begins from the exact uploaded Cut05 cumulative overlay (`mathillustrator_cut05_overlay.zip`), retaining the site-root `index.html`/`tools.html` integration and leaving MathReader completely untouched. This cut addresses an internal ordering bug in multi-vertex cursor construction, interaction visibility, Tk export reproducibility, UI toolkit reachability, and browser-save coordination. JSON project format stays **v1**; no migration or new mandatory field is added.

### Confirmed RED → GREEN

| Case | Cut05 failure / risk | Cut06 correction | Evidence |
|---|---|---|---|
| MI-SNAP-061 | A short 7-pixel segment with two new anchors silently imports both endpoints as `o1`, producing `segment.refs=['o1','o1']`; first new anchor was eligible for snapping the second within the same transaction | Snapshot all pre-existing candidates once, then append new anchors together; check resolved construction geometry and rollback invalid cases | **Actual RED** on Cut05 and **GREEN** isolated Chromium `tests/browser_cut06.py` |
| MI-SNAP-062 | A fully transparent anchor cannot be selected but is still a snap target, accidentally creating invisible mathematical attachments | Exclude opacity-zero/hidden anchors from automatic cursor snapping; preserve them as existing semantic dependencies in native JSON | Chromium Cut06, plus prior zero-opacity hit-target tests |
| MI-TEX-063 | A hidden function disables TikZ for unrelated visible supported geometry | Export capability validation skips hidden objects, while still refusing visible unsupported types | Chromium Cut06, actual TikZ compilation |
| MI-TEX-064 | Changing canvas zoom changes TikZ line widths and angle sizes despite identical scene geometry | TikZ CSS-pixel stroke/point radii map to stable 0.75pt/px, angle world radius is fixed; TikZ remains a static depiction, not exact SVG visual parity | Export same project at two zoom levels and assert exact byte equality in Chromium Cut06 |
| MI-UI-065 | Disabling Basic toolkit can hide both Move and Pan, leaving mode controls unreachable | Keep essential Move/Pan visible; hide only the Point tile if the Basic module is disabled; explicitly respect CSS `[hidden]` | Chromium Cut06, toggle/undo/mode switching |
| MI-SET-066 | Forged JSON can request page-only export while using an infinite canvas | Reject contradictory setting explicitly in runtime and version-1 JSON Schema; old files omitting the optional export settings retain defaults | `tests/cut06.test.mjs`, schema fixtures |
| MI-SAVE-067 | Normal background saves can interleave read/write operations across independent tabs | On browsers with origin-wide Web Locks, use an exclusive named lock around *both* storage comparison and synchronous write; an awaited task reads the latest document and dirty state only under the lock; no silent merge | Deterministic Node fake-lock contention, stale queued task and quota denial; real browser tab concurrency **NOT VERIFIED** |

| MI-REL-068 | Cut05 cumulative ZIP omits four original Cut00 files (two examples, ADR-0001, initial release report), breaking completeness of fresh installs | Restore original exact bytes; new permanent inventory check against all earlier cuts | ZIP archive path union and `tests/package_integrity.py`; 4/4 example fixtures schema and runtime validations |

### Test results and limitations

- Node unit/model tests: **52/52 PASS** (`node --test tests/*.test.mjs`), including 7 new cases in Cut06.
- Isolated Chromium: **13/13 interaction/storage scripts PASS**, including the Cut06 script and all prior regressions. `browser_performance.py` ran separately; illustrative 3,000-point renderer-only `render-info` ≈20.4 ms in one run (not a frame-time guarantee).
- Actual `pdflatex` compilation: **2/2 PASS** for representative browser-exported TikZ and `tikz-cd` examples.
- Four historical JSON example fixtures: **4/4 PASS** against the updated v1 schema during package-level checks; the two originally omitted Cut00 examples have been restored to this cumulative ZIP; no schema-version increment.
- Static website integration: requires original root assets; test after merging overlay into supplied original website ZIP, **not** against an overlay-only folder.
- Direct hosted HTTP navigation, Firefox/Safari, physical touchscreen, simultaneous multi-tab writer contention with real Web Locks, screenreader traversal and cross-engine TikZ visual parity: **UNVERIFIED**.

### Residual failure paths / bounded behavior

1. `localStorage` provides no atomic compare-and-swap. The Web Locks mitigation only applies where the API is available (normally secure HTTPS origins). Non-supporting browsers use the original compare-before-write best effort and visibly report the missing cross-tab lock. Last-chance `pagehide` flush is also synchronous, *outside* the lock, because browsers may terminate asynchronous tasks; it remains a documented race window. Always download native JSON when conflicts appear.
2. TikZ layout remains approximate: output does not preserve editable graph dependencies, arbitrary math labels, global CSS-font fidelity, or physical paper size. Zoom invariant in Cut06 means the *generated scene code* is stable, not that it is visually identical to a zoomed SVG viewport.
3. Geometrically degenerate **existing** v1 objects are preserved for backward compatibility. New cursor constructions reject collapsed edges; further mathematical checking of collinear polygons/near-collisions remains future work.
4. Dense visible scenes may exceed 16.7ms redraw budget; 60 FPS and cross-device responsiveness are not claimed.

### Release gates

Run model, Chromium, `pdflatex`, JSON schema, static bilingual site-link integrity and extracted-package tests. Preserve all earlier cut reports and the exact machine-readable Cut06 case catalog. If a run was not performed, do not report PASS. Packaged contents must exactly match `cut06-package.json`/`package-files.json` inventory, with no `mathreader/` path or transient Python caches.
