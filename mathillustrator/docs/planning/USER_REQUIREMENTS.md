# MathIllustrator — single living user-requirements register

This is the **only growing user-requirements Markdown file** for this project. Update this file in place after every implementation/debug round. Do not create separate per-round requirement files. Historical acceptance evidence belongs in the existing `docs/quality/TEST_REPORT_CURRENT.md`, and old release artifacts remain in the verified history archive.

The items below preserve **all 45 requirements in `temp1.txt` and all 16 semantic requirements in `temp2.txt`**, including repeated or overlapping requests. Wording is reproduced rather than silently narrowing broad goals (e.g. mathematical fields). The historical Round 1/2 requirements are summarized separately below.

**Status vocabulary:** Done = the stated narrow deliverable is implemented and regression-tested; Partial = only a subset works; Design = intended technical approach recorded, not shipped; Pending = not implemented; Process rule = mandatory way of working. A feature is **not** considered implemented because it appears in this register.

## Earlier submitted requests (45)

| ID | Requirement (user wording) | Status |
|---:|---|---|
| R01 | Don's show my software in the main page of my homepage. | Done — homepage hero software links and full showcase section removed, while global Tools navigation is preserved. |
| R02 | The cover image in the tool page for math illustrator should have similar style with that for math reader, being a tilted pencil. | Done (corrected after Round 16) — revised the already-linked cover asset to match MathReader’s dark navy, pale-blue-and-white, flat mathematical illustration style, while preserving the same URL and a tilted pencil. |
| R03 | Find objects input should not be so big outshining the main input above it. | Done — this pass |
| R04 | Items drawn should support multiple selection and dragging for reordering. | Pending |
| R05 | Support parametric and implicit curves as well like in Desmos. | Pending |
| R06 | Refer to https://q.uiver.app/ for commutative diagram functionalities. | Design |
| R07 | Magnetic selection is needed. For example, choose a point on a circle, etc. like in GeoGebra. | Design |
| R08 | And choosing a point that is the intersection of two curves or lines is also widely used. | Design |
| R09 | The above two problems point to architectural issues on how items are created. There needs to be a hierarchy. | Design |
| R10 | Support currently unsupported export options. | Pending |
| R11 | The icon for Angle is indeed ugly. Redesign to actually look like a normal angle representation. | Done — this pass |
| R12 | Free hand objects should also support moving. | Partial |
| R13 | Don't need visual toolkit checkboxes anymore. Instead, each section is collapsible like in math reader and order alterable by dragging. | Done for top-level tool and settings sections — Round 13 removes remaining visible toolkit checkboxes; each section has a disclosure button and a dedicated drag handle with Alt+↑/↓ keyboard reordering. Collapse/order are independent local interface preferences, not scene mutations. Geometry's internal visual subheadings remain a separate R14 follow-up. |
| R14 | If there is too much in Geometry section, partition it like GeoGebra. | Done — Round 14 divides Geometry into four bilingual groups (Points & lines, Circles & conics, Polygons, Curves) with separate disclosure, drag handles, Alt+↑/↓ ordering and independent browser-local preferences. All original tool IDs and exported projects remain unchanged. |
| R15 | All sections after Diagram belongs to setting, so they should fall under the same section Setting. | Done — Plotting, Geometry options, New object style, Page & appearance, and Interface are inside one collapsible Settings section. The header gear opens this section; the old floating font/auto-Move panel is removed. Others remains a drawing-tool group directly after Diagrams per R26. |
| R16 | Switching between 2D and 3D drawing, or function parametric implicit should be done on the left panel right below the main input. | Pending |
| R17 | More intelligent auto switching between Move and Pan. Pan is the default unless you are above a movable object. | Partial |
| R18 | Point should belong to Geometry section not Basic. | Done — Round 12 moves the only Point button into Geometry without changing object type, keyboard handling, commands, history or project JSON. |
| R19 | Many textboxes only have small inputs like an integer, so no need to be so long. | Partial — Round 11 bounds short numeric inputs in geometry settings, appearance grids and object Properties without shortening coordinates or text fields. |
| R20 | Hence we can have more compact arrangement of these textboxes or combo boxes or other controls that fit their sizes to save space. | Partial — Round 11 also narrows simple Theme and Raster resolution selectors; broader responsive control reflow remains pending. |
| R21 | Stroke Fill Line width Opacity etc. hence could have two-column layout. | Done — Round 10: shared two-column layout for new-object defaults and selected-object appearance, with optional Fill/Point radius and responsive controls. |
| R22 | Regular polygon size should not appear on the right panel. | Pending |
| R23 | It should appear as a window for user input after drawing and adjustable in properties. | Pending |
| R24 | More intelligent input hinting is needed in the main input textbox. Like typing si should indicate sin in faded colors etc. | Pending |
| R25 | Refer to wolfram alpha for more input capabilities, like parenthesis pairing etc. | Pending |
| R26 | If there is too few options in Illustration, rename it to Others and put it after Diagrams. | Done — Round 12 relabels the two-tool section Others and places it after Diagrams by default; legacy internal `illustration` module and saved panel-order key remain valid. |
| R27 | The icon for infinite lines contains one line not two lines. | Done — this pass |
| R28 | All points in the icons should be filled circles, including Point Segment Regular polygon etc. | Done for current 2D tool glyphs — Round 12 renders indicated points as solid markers (Point, Segment, Bézier, Regular polygon, Polygon, Polyline, Angle and circle center). Non-point outlines remain unfilled. |
| R29 | Like GeoGebra we need functions like x(A) y(A) to extra coordinates of points. | Design |
| R30 | And more overrides like Circle(point, radius) etc. | Design |
| R31 | In short the current programmatical inputs is too lacking but don't make it as redundant as GeoGebra. | Design |
| R32 | User should be able to create a slider on the left panel (as an object that could be hidden) by typing a new letter. | Design |
| R33 | For slider details, refer to GeoGebra and Desmos for more details. | Design |
| R34 | For 3D objects, we also need a bunch of stuff in setting that alters density of parametric lines, opacity, color, position or number of light sources (for 3D visual display). | Design |
| R35 | Start with implicit 3D surface as well, so now 2D and 3D both supports function, parametric, and implicit. | Design |
| R36 | For implicit 3D, take performance into consideration as it is hard to draw. | Design |
| R37 | But it is ok to wait as long as there is notification somewhere telling the user that it is processing. | Design |
| R38 | https://c3d.libretexts.org/CalcPlot3D/index.html is a good source to refer to 3D drawing. | Design |
| R39 | But I really like to have https://www.desmos.com/3d style surfaces. | Design |
| R40 | Canvas should be customizable. Square, more ratio options etc. | Pending |
| R41 | Labels for objects could be made invisible and change positions by either dragging or by pixels like that for diagrams. | Partial |
| R42 | The current message box should not take up space in the canvas but should be displayed above the canvas. | Pending |
| R43 | There should be another Select item in Basic that allows us to select all items in a rectangle and change properties at the same time. | Pending |
| R44 | This may have many bugs so only allow supported simultaneously alterable properties in a floating window. | Pending |
| R45 | Left and right panels should support dragging to change size like math reader. | Partial — Round 15: draggable desktop splitters, keyboard adjustment, per-panel double-click reset, bounded center canvas, widths stored in browser-local layout preferences. Mobile retains rails/drawers. Round 16 additionally delivers adjustable docked Properties height and a detachable/movable/resizable Properties inspector with keyboard controls and browser-local position persistence. Moving/docking full Objects and Tools panels remains pending. |

## Additional submitted requests (16)

| ID | Requirement (user wording) | Status |
|---:|---|---|
| R46 | Each time, remember to summarize my requirements in detail in a single MD file that should be constantly expanding instead of having more and more files in the overlay. | Process rule — adopted |
| R47 | Development, debugging, performance, compatibility, stability should always be balanced. | Process rule — adopted |
| R48 | Either move - 100% + fit away from canvas or make it invisible when not hovering above it. | Pending |
| R49 | The Bezier icon is not displayed full. The two points are partially cropped away. | Done — this pass |
| R50 | Objects should by default be named like RegularPolygon and Point instead of regularPolygon. And this convention is customizable in setting. | Done — Round 8: default PascalCase for new projects, configurable camelCase or snake_case under New object style; existing names unchanged and legacy imports retain camelCase. |
| R51 | Delete selected button can be removed. | Done — object-menu delete and keyboard/Properties deletion retained |
| R52 | There can be three dots for each object by clicking which we can have multiple options like lock or delete etc. | Done — Hide/Show, Lock/Unlock, Delete via accessible object menu |
| R53 | Arrow should be renamed Vector. | Partial |
| R54 | Again I request general LaTeX input capability for whatever is to be displayed on the canvas aside from regular text input. | Partial |
| R55 | From Undo to Export, the buttons on the upper right corner is takes too much space. Use icon if necessary and words appearing by hover. | Done — this pass |
| R56 | The icon for Math Illustrator on the upper left corner should be the same abstract pencil not sigma. | Done — editor brand uses local pencil SVG |
| R57 | The find object input could collapse to a magnifier icon conveniently placed and displays upon clicking, disappearing after reclicking the same icon. | Done — magnifier toggles search; closing clears its filter |
| R58 | Parallelograms etc. should be supported. You can classify by type, like points, triangles, quadrilaterals, circles, others as subsections. | Pending |
| R59 | Think of a more revealing name for Freehand and Text than "Others". | Pending |
| R60 | There should be some common colors provided not letting user select RGB every time which is too demanding and not stable. | Done — Round 9: 11 keyboard-accessible common colors for new stroke/fill defaults and eligible selected-object properties, with the native custom picker retained. |
| R61 | Gradually add vector fields, contours, domain coloring, and 3D complex plotting capabilities. | Design |
| R62 | The MathIllustrator website must initialize completely; do not ship when the tools appear blank because an ES-module dependency fails. | Done — restored the missing geometry export and added a boot-sensitive Chromium regression. The current archive’s startup failure was reproduced before the fix and the repaired module graph passed the isolated browser smoke test; real hosted deployment is not verified. |
| R63 | The pencil cover must genuinely share MathReader's visual design language, not merely depict a pencil. | Done for the already-linked Tools-page asset — dark navy field, white/pale-blue flat pencil, subtle geometric construction. Header pencil recolored to the same palette. Live-site cache propagation remains unverified. |

## New request — drawing polish (Round 5)

| ID | Requirement (user wording) | Status |
|---:|---|---|
| R62 | Ultra smooth is not smooth enough. | Done — arc-length resampling and symmetric Gaussian filtering replace the Ultra-only Chaikin treatment; committed freehand preview now uses the same cubic rendering | 

**Round 7 status:** R01 and R02 are complete in source: the homepage no longer advertises MathReader/MathIllustrator, but preserves the global Tools navigation. The Tools page now displays the prepared tilted-pencil image. Only the supplied current root pages were modified; no MathReader files changed. Hosted deployment and the rest of the website assets were not supplied for full integration testing.

## New request — near-end freehand joining (Round 6)

| ID | Requirement (user wording) | Status |
|---:|---|---|
| R63 | When free hand curve start and end with too close locations they should be joined. But not joined smoothly but with a corner unless they are almost tangent, then smoothly joined. This extra joining can be invalidated in setting. | Done — new projects auto-join endpoints within 12 screen px after a meaningful stroke; corners retain a sharp path seam, near-tangent directions (≤20° apart) use a continuous periodic spline, and **Geometry options → Free curves → Keep open · disable joining** turns joining off. Saved objects store `joinStyle` so future settings/view changes do not alter their geometry. Existing files explicitly saved with Open retain Open; missing legacy setting migrates to Open. |

**Round 6 acceptance:** new/old v1 JSON compatibility, no mutation of original samples, 24px minimum path length for automatic joining, short/canceled strokes, 12px zoom-scaled proximity, same preview and final seam, corner geometry vs tangent geometry, undo/redo, SVG and JSON export, old closed drawings and corrupt `joinStyle` import rejection. Tested on isolated Chromium/Node; true physical pen input and live site remain unverified. Always close at distant endpoints retains its legacy spline (the new corner/tangent choice only applies when endpoints are near). The homepage edits are delivered separately in Round 7, not bundled with the Round 6 freehand cut.

## Deferred root integration from Round 5 — completed in independent Round 7

**Scope:** remove both the homepage hero software links and the dedicated homepage software showcase (including now-unused scoped CSS); retain the normal Tools site navigation and all research/academic content. Replace only the MathIllustrator preview formula on `tools.html` with the existing local `mathillustrator/assets/pencil-cover.svg` tilted-pencil artwork; remove the now-unused external MathJax CDN script from that Tools page. Keep MathReader's Tools-page preview, wording, and paths unchanged. Both supplied root HTML files are treated as authoritative; no older root file was used.

**Acceptance:** no software promo in homepage markup in either language; homepage Tools navigation remains; both Tools cards and their existing links remain; pencil asset path exists, SVG parses, no external imagery; other homepage sections and bilingual text unchanged. Verify independent HTML parsing plus isolated Chromium DOM checks (full stylesheet and deployment layout are not available). Full website assets and live deployment remain unverified.

## Round 8 — object naming conventions (2026-11-13)

**R50 delivered (focused scope):** Newly created projects use PascalCase auto-generated names such as `Point 1`, `RegularPolygon 3`, and `Vector 4`. The existing `arrow` JSON object type, reference IDs, command parser and manually entered object names are unchanged. Right panel → **New object style → Object naming** offers PascalCase, legacy camelCase (`point 1`, `regularPolygon 3`, `arrow 4`) and snake_case (`point 1`, `regular_polygon 3`, `vector 4`). Choice is saved with the JSON project and participates in undo/redo; it affects **future** automatically named objects only. Opening a legacy v1 JSON document lacking `namingConvention` defaults to camelCase to preserve its historical behavior; no stored object names, IDs or dependencies are rewritten. New projects default to PascalCase. Unsupported setting values are rejected transactionally rather than silently substituted. Automatic-name collisions, including case-only ambiguity across conventions, fail before changing the object list/ID counter; users may rename the existing conflicting object manually. Explicit names still obey the original case-sensitive uniqueness rule.

**Acceptance:** check Point/RegularPolygon/Vector forms; all three modes; name/ID preservation after setting change; existing commands with explicit user names and references; legacy migration; collision failure with no partial object; invalid import rollback; JSON round-trip, SVG/export, undo/redo, locale switches, responsive settings, existing object menus/storage/touch and freehand regression. Verification evidence belongs in the existing `docs/quality/TEST_REPORT_CURRENT.md`. No multi-object rename, custom formatting template or graph changes are claimed.

## Round 10 — compact two-column appearance controls (2026-11-13)

**R21 delivered (one focused layout slice):** New object style and selected-object Properties now arrange Stroke and eligible Fill side by side, with Line width and Opacity side by side below; Point size (defaults) / Point radius (supported selected points) remain a compact separate cell. Both color columns retain the native picker and the 11 accessible color swatches from Round 9. Objects without editable Fill do not display an empty Fill control, and locked / unselected objects continue to suppress editable appearance controls. At narrow widths controls remain two columns without horizontal clipping. Geometry, drawing objects, model version, project JSON, import/export, undo/redo semantics and the actual underlying editing callbacks are unchanged.

**Acceptance:** correct grid placement at 1440/700/390/320 CSS pixels including mobile drawers; no clipped inputs or swatches; both color pickers and palettes still work; independent default and selected-object width/opacity, numeric validation and rollback; point radius; Fill available only where supported; undo/redo; JSON re-import/invalid-import rollback; EN/ZH accessibility labels, focus order, locked states and no additional browser/storage persistence keys. Existing verification evidence is appended to `docs/quality/TEST_REPORT_CURRENT.md`.

## Round 9 — common color swatches (2026-11-13)

**R60 delivered (one focused color-selection slice):** A compact fixed palette of 11 recognizable colors now appears for both **New object style → Stroke / Fill** and the matching editable color properties of the selected object. These are plain color values, not a second object style model: a click uses the existing undoable style/settings transaction, and the original native picker remains available for any custom RGB hex color. Objects without editable fill (e.g., points), locked objects, and absent selections do not display inappropriate property palettes. Buttons expose meaningful color names, group labels, keyboard focus, `aria-pressed` selection status, and reversible English/Chinese text. A native-picked custom color leaves no common swatch falsely selected. No palette preferences, project schema changes, recoloring of older objects when defaults change, or asynchronous color history are introduced.

**Acceptance:** default-vs-per-object isolation; direct swatch and custom picker consistency; new-object inheritance; no-op color selection; repeated swatch clicks with property focus; redo/undo; SVG/JSON; corrupt import rollback; locked/unselected object protection; existing presets; locale round-trips; 320/390px wrapping; keyboard/screen-reader metadata; unchanged 3,000-object behavior; no MathReader or site-root edits. Testing evidence is recorded in the existing `docs/quality/TEST_REPORT_CURRENT.md`.


## Round 11 — content-sized short numeric controls (2026-11-13)

**R19–R20 partially delivered (one limited CSS-only slice):** Geometric settings (Regular polygon sides and Snap interval), new-object Line width / Opacity / Point size, selected-object Line width / Opacity / Point radius and other bounded numeric Properties now have explicit compact maximum widths. Short enum selectors for Theme and Raster resolution are similarly narrowed. Existing two-column appearance grid, native number steppers, accessible label associations, validation, localization, keyboard focus and all project data/transaction handlers remain unchanged. Editable coordinates and free-form text stay wider for negative, decimal and long values. Input widths clamp to actual parent width to avoid mobile overflow; this is **not** a full adaptive control layout redesign.

**Acceptance:** show enough space for `100`, `0.000001`, `0.05`, `-300`, two-column width/opacity and both enum labels; no controls overflow at 320/390/700/1440 CSS pixels, in EN/ZH and mobile drawers; coordinates remain unconstrained; native min/max/step and keyboard editing retained; invalid values and malformed imports do not mutate projects; undo/redo and JSON export remain compatible. Evidence is tracked in `docs/quality/TEST_REPORT_CURRENT.md`.

## Preserved earlier product-level requirements

The user also requested, in prior rounds: a short nontechnical bilingual public interface with `?` explanations; no visible version; a Geometry category rather than duplicated Construction naming; customizable/reorderable sections; MathReader-style resizable/dockable panel behavior; label fonts and broad local LaTeX support; borderless diagram nodes by default; numerous algebraic diagram arrows (hook, dashed, curved, etc.); more intelligent Point/Move/Pan selection; freehand paths that are smooth, movable and optionally open/closed; Recently Deleted with reliable restore; a compact 2×2 Properties action area and independently closable Properties panel; longer-term general-purpose mathematical 3D, parameter sliders, implicit/parametric curves, non-lossy exports, and substantial regression/performance/cross-browser testing. These are retained as acceptance goals, even if previously partially shipped. Do **not** mistake a proof-of-concept for complete coverage.

## Current incremental delivery: compact editor chrome and geometry icons

**Scope deliberately limited to a few reversible UI changes.** This round adds compact icon-only Undo/Redo/New/Open/Save/Import/Export actions with accessible names and hover tooltips; visually reduces the object filter size without changing its semantics; renames the visible drawing tool `Arrow` to `Vector` (legacy JSON type and `Arrow(A,B)` syntax intentionally remain unchanged); fixes visually clipped Bézier endpoint circles; replaces the incorrect crossed-line and triangle-like angle icons with line/angle constructions; and fills point glyphs in relevant tools. English/Chinese tool naming remains reversible. Existing saved documents, export rendering, interaction state machine, properties and mathematical code should be unchanged.

**Explicit non-claims:** the compact search is *not yet* a collapsible magnifier; no per-object `…` menu, configurable PascalCase names, 3D engine or new object hierarchy is delivered here. Do not remove global deletion before a tested replacement exists. Full `Vector(A,B)` syntax and naming convention are deferred to a separately tested model change, retaining backward compatibility for `Arrow(A,B)`.

### Acceptance / regression expectations for this slice

- Icon geometry stays inside the 24×24 viewBox including its stroke, and appears at 320/390/700/1440px editor widths.
- All top-bar controls remain keyboard-focusable and discoverable by screen readers (`aria-label`) and mouse hover (`title`); no hidden action loses click support.
- `Vector` is localized to `向量`, but old `arrow` objects still load/save/export without type migration or data loss.
- Object search stays usable, supports clearing and the prior large-list filter; only *visual proportions* change.
- Test malformed/legacy import, editor undo/redo, SVG and raster export, old touch/mobile scripts and repeat locale changes; do not claim browsers/devices not executed.

## Current incremental delivery: per-object actions and collapsible search

- Object rows expose one keyboard-operable `⋯` control. Its floating menu offers Hide/Show, Lock/Unlock, Delete; only one menu can be open, and Escape, Tab-away, outside pointer events, row virtualization, locale changes, resizing and project mutations invalidate it. Menu actions verify the live object identity and document generation before editing.
- Delete uses the existing dependency-aware transactional pathway. Locked targets or dependents cannot be deleted; successful removal enters Recently Deleted, remains undoable/redoable, and saves with the existing project schema. Removing an unselected object preserves an unrelated selection.
- The global Delete selected toolbar button is removed. The existing explicit Properties delete and guarded Delete/Backspace keyboard shortcut remain; neither is a substitute for the object menu.
- Search begins collapsed behind a labeled magnifier. Opening focuses the search box; closing (including Escape) clears the filter to avoid a secretly filtered list; search contents are UI state, not project schema.
- Acceptance: test menu keyboard and focus dismissal, locked dependents, cascade removal, Recently Deleted restoration, stale callbacks, undo/redo, local persistence and JSON export, filtering and hidden rows, locale changes, virtual scrolling, mobile widths and maliciously malformed imports. These are regression targets, not automatic pass claims.

## Current incremental delivery: stronger Ultra Smooth and pencil artwork (Round 5)

- Ultra Smooth now stabilizes stroke geometry in arc length with a bounded Gaussian low-pass filter in screen units. This suppresses short alternating pointer tremor; it is substantially more than extra cubic subdivisions. Only newly drawn Ultra strokes change; existing saved paths and Gentle/Medium/Strong/Off behavior are unchanged. Raw capture is never modified. Open-stroke endpoints are fixed and output is capped at 4,096 points.
- Freehand preview now uses the same cubic SVG path renderer as a committed stroke; a released mouse position can still add a final sample and legitimately alter the endpoint. No freehand-to-circle/line recognition is claimed.
- The editor title bar uses an abstract tilted pencil asset, and a matching landscape pencil-cover.svg is staged for the Tools-page card. **Homepage removal and the actual Tools-page tile edit were NOT performed**, because neither current root page exists in the uploaded source. Applying the asset alone does not change those pages.
- Acceptance: screen-space tremor attenuation, exact endpoints, finite bounded output with degenerate/malformed data, unchanged legacy modes, undo/redo and SVG/JSON export/import, storage, browser input, mobile/pointer, asset parsing, no external image dependencies. Non-Chromium/hosted screenshots and root website integration remain unverified.

## Architectural design gates for the next rounds (NOT implemented)

1. **Editable object graph:** distinct semantic IDs, stable directed dependencies, well-defined object types, recomputation order, cycle rejection, transaction rollback, import and undo compatibility. A "point on circle" stores a parent reference and a parameter; an intersection stores both parents plus explicit branch choice. Keep geometric tolerances bounded and prevent false snapping. Test tangency, multiple intersections, degeneracies and source deletion.
2. **Object-list controls:** `…` for Lock / Hide / Delete and safe global-button removal are implemented; later hierarchy, multi-select with a constrained batch-property intersection and atomic changes, and drag reorder preserving IDs/dependency semantics remain pending.
3. **UI / interaction:** collapsible search, consistent pencil emblem, compact colors, popup polygon sides, genuinely movable freehand objects, proper labeling/drag offsets, **resizable side panel widths now supported on desktop**, future movable/dockable panels, ordered collapsible tool groups, pan-vs-move hit discrimination, no action chrome obscuring the SVG; preserve touch, keyboard and screen-reader access.
4. **2D mathematical input:** searchable suggestions and paired parentheses without editing math source unexpectedly; supported `x(A)`, `y(A)`, overloaded `Circle` signatures, slider variables and dependency graph. Bounded explicit, parametric and implicit curves with discontinuity splitting and cancellation.
5. **3D mathematical engine:** generalized explicit/parametric/implicit surfaces rather than domain-specific demos. Bounded adaptive samples/triangles, worker cancellation, progress feedback, numerical limits, camera controls, lights, mesh density, position/opacity and a performance ceiling. Add vector fields, contours, domain coloring and 3D complex-function plots progressively, not as fake menu entries.
6. **Diagrams and export fidelity:** q.uiver-inspired arrow configurations, multi-edges, hooks, curves and label avoidance; SVG/raster/TikZ/tikz-cd/PDF/Asymptote exported only when representation is faithful or explicitly marked unsupported. Real LaTeX source and rendering for canvas-bound math, not silent text substitution.

## Fixed development policy for each subsequent round

- Choose **one bounded cohesive development cut** (larger connected changes are allowed, but each cut must finish within 30 minutes of implementation and verification); development, debugging, performance, compatibility and stability get equal attention.
- Maintain this **single register** by updating status and a small current-scope section, not creating per-cut requirements reports. Preserve old decisions/history using the existing archive.
- Establish test baseline first, add targeted regressions for new behavior and subtle second-order failure modes: races, cancellation, stale inputs, cross-document state, errors/rollback, cache invalidation, import/export, large datasets and accessibility.
- Deliver a changed-files-only ZIP with original website-root-relative paths (including root pages only if changed). Never overwrite MathReader application files. Validate manifest/hashes, Node, browser where available, schema, TeX and overlay installation. State test provenance and unverified limitations honestly.

## Round 12 — Geometry-first palette and clearer tool grouping (2026-11-13)

**Scope (R18, R26, partial R14/R13, current-glyph R28):** Move the unique Point action from Basic into Geometry; keep Basic as always-available Move/Pan navigation. Split the visual Geometry grid with simple, bilingual heading rows for Points & lines and Shapes & curves, without introducing false independent subtool modules. Rename the two-tool Illustration section **Others** and place it after Diagrams in the default order. Preserve its persisted `illustration` module ID and `illustration` drag-order key. Remove the redundant Basic checkbox; keep the other module visibility checkboxes until a separately tested, accessible section-disclosure redesign. Fill existing glyph vertex/anchor markers where represented while keeping shape outlines unfilled.

**Acceptance:** Point exists exactly once, inside Geometry; geometry-disabled / undo / redo returns active Point to Move while the Basic navigation tools remain reachable. Other tools, command syntax, object IDs, saved module flags, existing user-customized drag order and exported scene data remain unchanged. Keep JSON v1 schemas and old projects importable, including `modules.basic=false` (inert legacy navigation visibility flag). Rejected malformed import leaves the complete project intact. Locale flips correctly translate the new headings and tool accessible names; SVG 24×24 marker bounds stay inside icon viewBoxes. Test narrow screen/scroll, keyboard, mobile, exports, accessibility, local storage, browser regressions and performance as applicable. Do not claim actual same-origin panel-preference persistence testing from an opaque-origin browser fixture.

**Not implemented:** fully collapsible/reorderable tool subsections, a fully collapsible Settings hierarchy, removal of all remaining module checkboxes, new geometry tools, dependency-aware geometric snapping, floating Properties, parametric or 3D plotting. This is a tool-palette reorganization, not a data-model migration.

## Round 13 — Collapsible/reorderable sections and Settings consolidation (2026-11-13)

**Delivered (R13, R15; R14 remains Partial):** Four drawing tool sections — Basic, Geometry, Diagrams and Others — and five settings subsections — Plotting, Geometry options, New object style, Page & appearance and Interface — have independent keyboard-accessible disclosure buttons. Settings itself has a parent disclosure; font and Auto-Move preferences move into the Interface subsection. The header gear opens Settings, including its Interface subsection, and focuses Font (also opens the right drawer on narrow screens). Dedicated drag handles reorder tools among tools and settings subsections among settings, with Alt+Up/Down keyboard support. Settings stays after the tool groups; the old Toolkits checkboxes are removed. All this is presentation state, recorded under the existing `mathillustrator-layout-v1` local preference key, **not** added to project JSON or undo history. Old `sections` preferences remain readable; the historic `plotting-` identifier is migrated to `plotting`. All existing `settings.modules` values, including false legacy values, remain validated and serialized but become inert visibility flags; imported scenes are no longer kept inaccessible by an obsolete checkbox. No version bump, change to IDs, geometry commands, model, math exports or legacy examples.

**Acceptance:** expand/collapse every tool and settings section without editing the project; parent/child nested disclosure state remains independent; drag handles do not start drags from inputs/buttons; keyboard reorder and real HTML5 drag cannot move settings out of Settings; existing custom section orders restore with legacy keys, locale changes retranslate dynamic aria labels; original font and Auto-Move choices still work; cog focus works in narrow drawer; no clipping of numeric inputs, swatches, color pickers, or geometry tool icons at 320–1440px. Existing object, selection, lock, Recently Deleted, undo/redo, history, export/import/invalid-import rollback, local storage conflict protection and 3,000-object behavior must remain valid. The new preference key object is local UI-only: it must not alter `settings.modules`, scene serialization, or trigger autosave. An offline localStorage shim tests preference serialization/restoration but is **not** real-origin browser persistence; live-site and assistive device checks remain unverified.

**Intentionally deferred:** independently collapsible/reorderable internal Geometry subgroups (R14), movable/resizable top-level panels (R45), multi-select/reorder of scene objects (R04), and other substantial mathematics features.

## Round 14 — Independent Geometry subgroups (2026-11-13)

**Delivered (R14):** Split the Geometry palette into four semantically labeled, independently collapsible and reorderable tool categories: Points & lines (Point, Segment, Vector, Infinite line, Angle); Circles & conics (Circle, Ellipse); Polygons (Rectangle, Polygon, Regular polygon); Curves (Polyline, Bézier). Preserve the top-level Geometry disclosure and its independent ordering with Basic, Diagrams and Others. The categories are purely presentation: tool IDs, object types, canvas hit-testing, command syntax, exported SVG/TikZ/JSON, semantic graph and undo/redo remain unchanged. Each category has an accessible disclosure button and separate drag handle; Alt+Up/Down reorders within Geometry only. Collapse/ordering is stored in the existing `mathillustrator-layout-v1` preference record as `collapsed[geometry-…]` and `geometryGroups`, and never enters project JSON or autosave. Earlier `sections` orders and records with no `geometryGroups` retain their old top-level order and receive default subcategory order. Duplicate, foreign or malformed group IDs are ignored; missing IDs are appended.

**Acceptance and evidence:** Verify 12 unique Geometry tools under their intended groups, four proper semantic headings, independent nested/parent disclosure, keyboard and actual HTML5 drag reordering constrained to siblings, no mutation to current drawing/selected tool/undo state, preference serialization/hydration, corrupted/legacy preference normalization, English/Chinese locale changes (including Chinese-first startup), 320/390/700/1440px, malformed project import rollback, color/appearance controls, object menu, freehand, touch, storage, and large-scene performance. Preserve active test selectors rather than allowing nested toggles to be mistaken for top-level controls. **Unverified:** real-origin cross-reload storage, browser/OS accessibility devices, physical stylus and hosted-site integration. These acceptance targets are not claims of tests not yet run.

**Deferred:** Moving/resizing principal panels (R45), multi-selection and object-layer drag ordering (R04), magnetic dependency snapping/intersections (R07–R09), and parametric/implicit/3D plotting.


## Round 15 — Desktop sidebar width resizing (2026-11-13)

**Delivered (R45 sizing complete):** Add unobtrusive vertical drag handles at the inner edges of the Objects and Tools panels for viewports above 700 CSS pixels. Drag with pointer, use Left/Right arrow keys (Shift for a larger step), Home/End for safe minimum/maximum, or double-click the separator to reset that panel's default width. Both handles have keyboard-focusable vertical separator roles and bilingual labels. Constrain open panels to 190–620 CSS px and retain at least 240 CSS px for the canvas; collapsed desktop rails use the existing 52 px width. Resizing only affects panel and SVG viewport pixels, not the mathematical model, zoom scale, user-created objects or history. Widths are stored under `sidebarWidths` inside existing `mathillustrator-layout-v1` browser-local preferences, not serialized in project JSON. Reopening a collapsed panel restores its preferred width; narrowing the desktop viewport clamps its display without overwriting the preference; restoring a wide viewport recovers its desired size. Mobile (700px or less) retains 42px rails and fixed-size drawer overlays with hidden resize handles. Older preferences without widths receive responsive defaults, and malformed/foreign values are ignored. Explicit drag cancellation (Escape, pointercancel, lost capture, blur) rolls back visually without writing a preference. No change to root-site pages, MathReader files or scene schema.

**Acceptance:** independent drag of both panels, accessible focus and keyboard controls, pointer capture outside a panel, cancel/rollback, double-click reset, collapse and reopen, responsive resizing 701–1440px, mobile drawer and touch guard, saved preference hydration and corrupt preference fallback, English/Chinese labels, preserved object export and undo/redo, no surprise scene auto-save or history entry, no canvas under 240px on supported desktop widths, no dependence on external services. Actual browser-origin preference persistence, physical touch/stylus, Firefox/Safari and assistive technology hardware remain unverified by the isolated fixture.

**Deferred:** floating/dockable/free-position panels, independent vertical Properties split, responsive custom drawer widths and tablet-specific gestures. These are not implied by resizing support.


## Round 16 — Resizable and floating Properties inspector (2026-11-13)

**Delivered (R45 further partial):** The left Properties inspector now has an independent horizontal splitter for its docked height, with pointer dragging, Up/Down keys (Shift for larger steps), Home/End and double-click reset. A **Float** control detaches just the Properties inspector into a freely movable desktop window; drag the header to move, drag its lower-right corner to resize, use Alt+arrow keys on the focused header to move, or use arrow keys on the corner to resize. **Dock** returns it to the Objects panel without changing the current selection or project contents. Each resize/move/collapse/docking preference uses the existing browser-local `mathillustrator-layout-v1` key under a validated `propertiesPanel` object; it is not scene/project JSON and does not add undo history. Last saved sidebar widths, Geometry section order and object-list scroll remain separate. Folded inspectors keep a visible header, and the floating inspector remains available when Objects is collapsed. At 700px and below, the panel automatically renders inside the left drawer and hides drag handles; returning to desktop restores the preferred floating layout. Invalid stored dimensions/modes fail back to safe defaults, and viewport shrink clamps display without overwriting the larger saved preference. Escape/pointercancel/capture loss/window blur abort in-flight pointer changes. English/Chinese keyboard labels are provided.

**Acceptance and evidence:** Test dock splitter, floating movement/sizing, keyboard adjustment, reset, hidden/collapsed Properties, opening Objects rail while floating, viewport resize crossing the mobile threshold, browser preference mock-reload, malformed stored values, undo and saved project JSON invariance; test a focused Chromium scenario plus Node geometry unit tests and existing current interaction regressions. Any unrun browser tests or actual hosted-site/origin preference persistence must be explicitly marked **not verified**.

**Still pending:** R04/R43 multi-selection and group bulk Properties (R44), docking/rearranging the entire Objects or Tools sidebars, multiple simultaneous independent inspectors, window-to-window transfer, and complete assistive-technology/device/browser matrix. A floating single-object inspector does not imply that bulk editing or all-purpose MathReader-style docking is complete.


## Post-Round-16 urgent repair — startup and cohesive cover (2026-11-13)

**Reproduced failure:** The uploaded `src/app.mjs` imports `closeFreehandStroke` from `src/geometry.mjs`, which did not export it. Chromium rejected module linking before initializing the tool palette, leaving the entire drawing UI apparently loaded but nonfunctional. This is more severe than a collapsed section preference. The prior 173/173 claim cannot be treated as proof of this ZIP: our first independent run gave 169/170 Node and browser startup failed.

**Repair scope:** Implemented the missing validated helper with open / near / always closure modes, preservation of original samples, pixel-bounded endpoint proximity and corner-versus-tangent classification. Rendering now respects `joinStyle` instead of smoothing corners away; exported SVG and the drawing preview use the same geometry. Corrected the contradictory old default-setting assertion to the current `near` default. The app entry and direct geometry import receive a one-time URL cache discriminator so a mixed cached/stale JavaScript pair does not silently persist. The already-referenced cover `assets/pencil-cover.svg` now contains a self-contained image illustration in MathReader's navy/blue/white palette (no external network request), and the small editor pencil uses corresponding colors. No site-root homepage or Tools HTML, MathReader files, scene storage key, object IDs or project schema changed.

**Verification (actual, extracted ZIP working copy):** `node --test tests/*.test.mjs` PASS **173/173**, including three new red/green geometry checks; `node --check` on `src/geometry.mjs` and `src/app.mjs` PASS. 16 applicable isolated Chromium scripts PASS: smoke, edges, mobile, object menu, naming, pencil/ultra smoothing, style grid, tool palette, numeric compact, palette sections, Geometry subgroups, LaTeX/localization, sidebars, floating Properties, touch and storage. XML-parsed SVGs and a Chromium data-URL image preview show the cover renders. The only two root-site scripts were not run because this ZIP does not include the authoritative root pages and shared site assets; localhost origin navigation is administrator-blocked here. Live deployment, CDN cache, Safari, Firefox, Edge and physical input remain unverified.

**Regression prevention:** A release that imports an unavailable named module export must fail the browser-startup gate; checking `node --check` or clicking visually in static HTML is insufficient. Do not continue R45 full Objects/Tools floating until the repaired overlay is deployed and the working tool palette confirmed.
