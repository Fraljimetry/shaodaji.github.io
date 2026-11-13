# MathIllustrator — single living user-requirements register

This is the **only growing user-requirements Markdown file** for this project. Update this file in place after every implementation/debug round. Do not create separate per-round requirement files. Historical acceptance evidence belongs in the existing `docs/quality/TEST_REPORT_CURRENT.md`, and old release artifacts remain in the verified history archive.

The items below preserve **all 45 requirements in `temp1.txt` and all 16 semantic requirements in `temp2.txt`**, including repeated or overlapping requests. Wording is reproduced rather than silently narrowing broad goals (e.g. mathematical fields). The historical Round 1/2 requirements are summarized separately below.

**Status vocabulary:** Done = the stated narrow deliverable is implemented and regression-tested; Partial = only a subset works; Design = intended technical approach recorded, not shipped; Pending = not implemented; Process rule = mandatory way of working. A feature is **not** considered implemented because it appears in this register.

## Earlier submitted requests (45)

| ID | Requirement (user wording) | Status |
|---:|---|---|
| R01 | Don's show my software in the main page of my homepage. | Pending |
| R02 | The cover image in the tool page for math illustrator should have similar style with that for math reader, being a tilted pencil. | Pending |
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
| R13 | Don't need visual toolkit checkboxes anymore. Instead, each section is collapsible like in math reader and order alterable by dragging. | Partial |
| R14 | If there is too much in Geometry section, partition it like GeoGebra. | Pending |
| R15 | All sections after Diagram belongs to setting, so they should fall under the same section Setting. | Pending |
| R16 | Switching between 2D and 3D drawing, or function parametric implicit should be done on the left panel right below the main input. | Pending |
| R17 | More intelligent auto switching between Move and Pan. Pan is the default unless you are above a movable object. | Partial |
| R18 | Point should belong to Geometry section not Basic. | Pending |
| R19 | Many textboxes only have small inputs like an integer, so no need to be so long. | Partial |
| R20 | Hence we can have more compact arrangement of these textboxes or combo boxes or other controls that fit their sizes to save space. | Partial |
| R21 | Stroke Fill Line width Opacity etc. hence could have two-column layout. | Pending |
| R22 | Regular polygon size should not appear on the right panel. | Pending |
| R23 | It should appear as a window for user input after drawing and adjustable in properties. | Pending |
| R24 | More intelligent input hinting is needed in the main input textbox. Like typing si should indicate sin in faded colors etc. | Pending |
| R25 | Refer to wolfram alpha for more input capabilities, like parenthesis pairing etc. | Pending |
| R26 | If there is too few options in Illustration, rename it to Others and put it after Diagrams. | Pending |
| R27 | The icon for infinite lines contains one line not two lines. | Done — this pass |
| R28 | All points in the icons should be filled circles, including Point Segment Regular polygon etc. | Partial |
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
| R45 | Left and right panels should support dragging to change size like math reader. | Pending |

## Additional submitted requests (16)

| ID | Requirement (user wording) | Status |
|---:|---|---|
| R46 | Each time, remember to summarize my requirements in detail in a single MD file that should be constantly expanding instead of having more and more files in the overlay. | Process rule — adopted |
| R47 | Development, debugging, performance, compatibility, stability should always be balanced. | Process rule — adopted |
| R48 | Either move - 100% + fit away from canvas or make it invisible when not hovering above it. | Pending |
| R49 | The Bezier icon is not displayed full. The two points are partially cropped away. | Done — this pass |
| R50 | Objects should by default be named like RegularPolygon and Point instead of regularPolygon. And this convention is customizable in setting. | Pending |
| R51 | Delete selected button can be removed. | Pending |
| R52 | There can be three dots for each object by clicking which we can have multiple options like lock or delete etc. | Pending |
| R53 | Arrow should be renamed Vector. | Partial |
| R54 | Again I request general LaTeX input capability for whatever is to be displayed on the canvas aside from regular text input. | Partial |
| R55 | From Undo to Export, the buttons on the upper right corner is takes too much space. Use icon if necessary and words appearing by hover. | Done — this pass |
| R56 | The icon for Math Illustrator on the upper left corner should be the same abstract pencil not sigma. | Pending |
| R57 | The find object input could collapse to a magnifier icon conveniently placed and displays upon clicking, disappearing after reclicking the same icon. | Partial |
| R58 | Parallelograms etc. should be supported. You can classify by type, like points, triangles, quadrilaterals, circles, others as subsections. | Pending |
| R59 | Think of a more revealing name for Freehand and Text than "Others". | Pending |
| R60 | There should be some common colors provided not letting user select RGB every time which is too demanding and not stable. | Pending |
| R61 | Gradually add vector fields, contours, domain coloring, and 3D complex plotting capabilities. | Design |

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

## Architectural design gates for the next rounds (NOT implemented)

1. **Editable object graph:** distinct semantic IDs, stable directed dependencies, well-defined object types, recomputation order, cycle rejection, transaction rollback, import and undo compatibility. A "point on circle" stores a parent reference and a parameter; an intersection stores both parents plus explicit branch choice. Keep geometric tolerances bounded and prevent false snapping. Test tangency, multiple intersections, degeneracies and source deletion.
2. **Object-list controls:** `…` for Lock / Hide / Delete and later hierarchy; keyboard-accessible actions and no accidental delete. Add multi-select with a constrained batch-property intersection and atomic changes; drag reorder preserves IDs and dependency semantics. Only then remove the global Delete-selected action.
3. **UI / interaction:** collapsible search, consistent pencil emblem, compact colors, popup polygon sides, genuinely movable freehand objects, proper labeling/drag offsets, variable panel widths, ordered collapsible tool groups, pan-vs-move hit discrimination, no action chrome obscuring the SVG; preserve touch, keyboard and screen-reader access.
4. **2D mathematical input:** searchable suggestions and paired parentheses without editing math source unexpectedly; supported `x(A)`, `y(A)`, overloaded `Circle` signatures, slider variables and dependency graph. Bounded explicit, parametric and implicit curves with discontinuity splitting and cancellation.
5. **3D mathematical engine:** generalized explicit/parametric/implicit surfaces rather than domain-specific demos. Bounded adaptive samples/triangles, worker cancellation, progress feedback, numerical limits, camera controls, lights, mesh density, position/opacity and a performance ceiling. Add vector fields, contours, domain coloring and 3D complex-function plots progressively, not as fake menu entries.
6. **Diagrams and export fidelity:** q.uiver-inspired arrow configurations, multi-edges, hooks, curves and label avoidance; SVG/raster/TikZ/tikz-cd/PDF/Asymptote exported only when representation is faithful or explicitly marked unsupported. Real LaTeX source and rendering for canvas-bound math, not silent text substitution.

## Fixed development policy for each subsequent round

- Choose **one small cohesive feature slice**, or a few closely related UI fixes; development, debugging, performance, compatibility and stability get equal attention.
- Maintain this **single register** by updating status and a small current-scope section, not creating per-cut requirements reports. Preserve old decisions/history using the existing archive.
- Establish test baseline first, add targeted regressions for new behavior and subtle second-order failure modes: races, cancellation, stale inputs, cross-document state, errors/rollback, cache invalidation, import/export, large datasets and accessibility.
- Deliver a changed-files-only ZIP with original website-root-relative paths (including root pages only if changed). Never overwrite MathReader application files. Validate manifest/hashes, Node, browser where available, schema, TeX and overlay installation. State test provenance and unverified limitations honestly.
