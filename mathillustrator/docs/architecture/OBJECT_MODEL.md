# MathIllustrator · current v1 semantic object model and rendering contract

**Observed implementation: v0.7.0 Cut 06, native data schema v1.** Full multidomain 3D mathematical visualization is a future direction, not a released feature.

## Native scene contract

`format: "mathillustrator-project"`, `version: 1`, `meta`, `settings`, `objects[]`, and `nextId` define an editable project. Versions are schema versions, not application releases. Stable IDs (`o1`, `o2`, …) remain independent of names; names are unique and user-editable. Each object contains type, style, flags, and type-dependent geometry. `validateDoc` rejects unknown versions, unsafe paint values, nonfinite coordinates, malformed references, missing parents, cycles and duplicate names/IDs. It adds defaults to older v1 documents when newer optional settings are missing. Do not rename the version to 2 without an actual migration.

**Supported objects:**

- `point`: free `(x,y)` anchor. `midpoint`: live average of two point-like anchors. These are the only currently computed Cartesian point types.
- `segment`, `arrow`, `line`, `circle`, `ellipse`: each stores two references. Circle: center + radius point. Ellipse: opposite corners of axis-aligned bounding rectangle. A “line” extends visually beyond the pair and is not a symbolic `ax+by+c=0` object.
- `polygon`, `polyline`: ordered sets of point-like references. Rectangle tool creates a normal polygon. `bezier` uses four references (cubic handles). `angle` uses three references, vertex second; its arc is primarily an annotation with a screen-space radius.
- `freehand`: sampled 2D polyline; optional smoothing is applied **once at stroke completion**. `text`: plain SVG text at explicit position. `function`: a safe explicit arithmetic `y=f(x)` grammar sampled in the current view; no symbolic algebra.
- `node`: mathematical diagram node with explicit world position and raw label text. `morphism`: directed semantic edge referencing two `node` IDs, storing label, optional bend and label side. Node labels may contain TeX source strings, but the browser only displays the characters; TikZ/`tikz-cd` compilation happens outside the application.

All parent references use stable IDs, validated as a directed acyclic graph. A point edit updates dependent geometry; a node move updates morphism geometry; deletion cascades to dependents unless **any affected item is locked**. A lock prevents direct edit, not an indirectly changing mathematical position. Iterative graph resolution prevents stack overflow for very deep midpoint chains; selection and rendering still have practical performance limits.

## Document state, viewport and artboard

The 2D world is right-handed with y up. SVG is x right/y down. For viewport width `W`, height `H`, world view center `(cx,cy)` and positive scale `s` CSS pixels per world unit:

```
screenX = (worldX - cx)*s + W/2
screenY = (cy - worldY)*s + H/2
```

Zoom/pan only update the viewport (not saved in the document as a mathematical object). `page='a4'|'letter'` gives a centered, viewport-relative aspect-ratio guide. `exportRegion='page'` crops to that guide; **it does not guarantee physical paper units or the precise clipping of every publication rendering**. For `infinite`, export region is forced to viewport.

## Rendering, selection and edit transactions

The current renderer builds a fresh SVG DOM on each paint. `requestAnimationFrame` coalesces paint requests and a per-paint resolver indexes/caches reference results. Point hit-testing is geometric (no extra per-point SVG disk), including when a later polygon overlaps an anchor; wide invisible paths still make thin lines easier to select. Export derives an SVG from semantic world geometry, not from the live selection markup. Canvas rasterization uses selectable 1×–4× pixel dimensions and rejects outputs beyond the 36-megapixel limit or unavailable encoders.

`update()` validates mutations synchronously and either commits one whole-document undo state or restores the prior serialized state. A completed point/node/text drag is one history step; a canceled drag rolls back. Properties panel reconstruction is deferred to a subsequent animation frame after input `change` so it does not invalidate the active DOM event. Undo history is bounded to 80 steps and evicts older entries above roughly 30 MiB of serialized snapshots. Imported JSON and semantic `tikz-cd` replace the document only after validation and user confirmation; ordinary undo can restore the previous document.

Local autosave uses debounced `localStorage` and attempts a `pagehide` flush. Another tab changing the storage key triggers conflict state and pauses overwrites until the user explicitly chooses which state should win. This is not a fully transactional store and must be stress tested against races, quotas and abrupt crashes. Users should download JSON for durable backups.

## Export / import semantics

| Format | Current status | Fidelity contract |
| --- | --- | --- |
| JSON v1 | Supported both directions | Only lossless editable native format; preserves references, names and settings |
| SVG | Supported outbound | Rasterizable vector depiction of current view/page crop; no graph semantics |
| PNG/JPEG/WebP | Browser-dependent outbound | 2x rasterization; disabled if unsupported encoder; fonts and precise pixel output may differ by browser |
| TikZ/PGF | Restricted outbound | Static geometric depiction including diagrams; disabled if scene contains unsupported function or too-long freehand path; reference identity not preserved |
| `tikz-cd` | Restricted both directions | Node-and-morphism grid subset, incidence + labels; full TeX styling/bent arrows and arbitrary macros not supported |
| PDF, Asymptote, animation | Not implemented | Export controls disabled |

The rendering and export paths need visual cross-browser reference fixtures, TeX compiler checks, and large-scene stress tests before publication-grade fidelity can be promised.

## Future engine boundary

Mathematical domains will be modular extensions to the typed scene, not hidden raster approximations. Geometric constraints/robust intersections, free curve handles, diagram routing, parameter sliders, complex transformations and native 3D meshes each require a versioned semantic data shape, reliable editing and undo, import/export capability matrix, tutorial updates, error and degeneracy policy, and red/green tests. Numerical ODE/PDE solving is not a core requirement; do not invent a general solver for illustration purposes.

## Cut 02: live regular polygon extension

`regularPolygon` is a non-recursive two-parent geometry object. `refs = [centerPointId, firstVertexPointId]` refer to `point` or `midpoint` objects, and `sides` is an integer in the range 3–100. Vertex coordinates use `center + R(cos(theta + 2*pi*i/sides), sin(theta + 2*pi*i/sides))`, where `R` and `theta` come from the first vertex. The shape remains geometrically dependent on both anchors; `sides` changes after creation are undoable. Zero-radius constructions are rejected at command, pointer and project validation boundaries. SVG and restricted TikZ exporters preserve the resulting polygon shape; only native JSON preserves the mathematical dependency and editable side count. The optional setting `polygonSides` defaults to six during legacy version-1 JSON migration.

Object deletion now indexes reverse references once and traverses a queue. Property handlers must resolve objects by stable ID within the transaction, rather than mutate closures captured before a rejected update/undo/import. This is a persistent editing invariant for every new object type.


## Cut 03 · explicit plot and export safety

- The new `src/plot.mjs` sampler never evaluates arbitrary JS strings; it receives the strict `parseExpression` closure. Subdivision depth 6, bounded screen intervals, and explicit gaps on nonfinite/steep spans prevent many false lines across poles. **This is an approximation**, not certified discontinuity detection. The SVG renderer still rebuilds the scene.
- `exportGuides` (boolean, default false) controls only image grid/axes export. The editor page outline is an editing affordance and never part of exported images. `exportScale` is an integer 1–4 (default 2) for raster output. These optional v1 settings are migrated on import; existing JSON is not silently upgraded until it is saved.
- Image export snapshots SVG, raster scale and background before asynchronous SVG decoding. Canvas dimensions are checked against 36 MP and 16,384 pixels per side **before allocation**. Failures display a user-visible error and release temporary SVG blob URLs.
- Invalid persistent local JSON is quarantined: the editor can recover its empty canvas but pauses autosave until explicit user overwrite. A concurrent tab still cannot be made atomic using `localStorage`; native JSON remains the durable backup.
- New degenerate straight geometry is rejected at creation, but backward-compatible v1 project import is not reinterpreted. Flat ellipses render as their limiting straight segment.


## Cut 05 rendering and pointer contract (no JSON schema change)

- SVG arrows and morphisms use an ordinary `path` and a filled triangular `polygon` arrowhead, computed from the actual screen-space terminal tangent (`arrowHeadPoints`). No globally scoped SVG marker IDs are introduced. This avoids collisions when two exported SVG documents are inlined in one page. Export preserves the current selected crop and per-object style; arrowhead size is a screen-space approximation and not a length measured in world units.
- Visible points receive just one visual SVG circle; on pointer-down in Move mode, `hitTestPoint(sx,sy)` finds the nearest unhidden, nontransparent point/midpoint within its displayed hit radius. Thus point priority is independent of SVG paint order, even beneath later polygons. Midpoint remains read-only derived geometry. This hit scan is O(number of points), and a future spatial index is still needed for dense interactive scenes.
- The renderer omits point primitives outside the current viewport when their marker or text label cannot overlap it. Culling never changes `doc.objects`, native export, IDs, undo/redo, dependency resolution or `worldBounds`. Other object types are **not** yet culled; rendering still rebuilds SVG each redraw.
- Left object list is a bounded DOM window: fixed 45px rows, +/- 10 overscan rows, top/bottom spacers preserving scroll height. Full object order/filtering is computed from the model; items outside the mounted window are not lost and remain searchable. Rows include `aria-posinset` / `aria-setsize` but full accessibility still needs independent evaluation.
- `meta`, `settings`, `objects`, `style`, refs and project version are untouched by this cut. Cut04 version-1 projects retain exact native data compatibility. Old tests must be adapted only when they depend on now-removed implementation details (e.g. `.anchor-hit`) while retaining behavior assertions.

## Cut 06 design invariants

- Cursor constructions are multi-anchor transactions: capture the existing snap candidate set once, resolve every intended vertex against that original set, and only then insert nonmatching new points. Prevent the first new point snapping away the second short-segment endpoint. For freshly created semantic edges, confirm valid resolved geometry after references are assigned and roll back on failure. Native v1 import remains backward-compatible with previously saved degeneracies.
- Fully hidden or opacity-zero anchors remain in the dependency DAG and JSON, but cannot be chosen by automatic cursor anchor snapping. Locked visible anchors remain eligible: locking forbids edit, not mathematical reference.
- For TikZ, 1 CSS pixel of stroke/point radius corresponds to 0.75pt; the cut freezes the default angle annotation radius at its original 48 px/unit baseline. The absolute physical layout remains illustrative and does not copy the current zoom. TikZ capability checks examine only visible shapes; unknown visible types disable output.
- The `storage.mjs` writer may run an exclusive Web Locks task on HTTPS-supported browsers. The entire revision check and `localStorage.setItem` execute synchronously in that critical section. Pending tasks inspect *current* dirty/conflict state when granted, preventing queued stale saves after Load Other. Unsupported browsers and synchronous `pagehide` last-chance writes retain a documented non-atomic race window.

## Cut 07 additions

New `rectangle` objects have precisely two point-like references, opposite corners of an axis-aligned rectangle. Cursor drawing and `Rectangle(A,B)` create the same semantic type. Both SVG and TikZ calculate their rectangle from current resolved endpoints, so parent edits preserve right angles. Legacy `polygon` objects, including four-corner rectangles saved in Cut00–06, are **not** auto-converted. Project schema version remains 1; the new type is an additive extension. The runtime validator and the JSON Schema both require exactly two point-like refs for rectangles.

Editor document mutation increments an internal revision counter. An asynchronously opened JSON file is discarded if a newer document edit/undo/redo/loaded version occurs while it is being read; view-only operations do not count. Property-panel post-mutation rendering defers to an idle frame and skips replacing the currently focused property control for successful edits, preventing back-to-back onchange loss; invalid edits force a refreshed field after rollback. Mutation during an active gesture first cancels that gesture. This is in-memory document-instance protection, not a solution to cross-tab atomicity.

## Cut 09 — derived publication capability (no schema mutation)

`src/export_fidelity.mjs` performs a read-only preflight on world points resolved from existing objects. TikZ v1 currently prints 5-digit fractional centimeter coordinates. Geometry whose visible edges collapse after that quantization, whose thin rectangle/ellipse axes collapse, or whose coordinates are above ±300 cm is **not representable safely** by the current basic TikZ exporter. Rejecting that export does not reject the project or alter JSON/SVG. Zero-opacity and hidden objects are exempt from the visibility capability check. `src/app.mjs` stores transient export attempts as revision/view/menu epochs rather than persistent fields; canceled asynchronous results never mutate the document. Window blur and hidden visibility cancel speculative gesture coordinates before saving.

## Cut 10 view-only rendering utilities (v0.11.0)

The v1 JSON document is unchanged. `src/diagram_layout.mjs` derives a screen-space rectangular label box from semantic node content, then trims morphism paths to box boundaries. These rectangles are approximate glyph widths; they are *not* a mathematical constraint solver or a TikZ layout model. Too-close boxes may temporarily suppress an arrow on the SVG canvas without removing its semantic `refs`. `src/geometry.mjs::clipInfiniteLine` intersects unbounded line geometry with the current drawing viewport, without replacing the actual two-anchor line. `src/plot_cache.mjs` caches rendered path strings (not mutable doc objects) under the expression and full camera key; eviction is bounded. Undo, project JSON, live dependencies and zoom-independent TikZ semantics remain unchanged.


## Cut11 transient view/layout optimizations

`settings.plotQuality` is an **optional version-1** field (default `balanced`, values `fast`, `balanced`, `detailed`); the Analysis / plots preset defaults to `detailed`. Canvas sampling remains an approximation and may be bounded by an explicit evaluation budget. The setting changes the path cache key and is included in ordinary JSON undo/redo/autosave. Runtime rejects unknown values.

`src/diagram_layout.mjs::layoutNodeLabel` calculates a deterministic approximate width/height and visual lines from full node label text without truncation. SVG `tspan`s, rectangle outline, and attached arrow clipping share this result. It is not stored in native project JSON and should not be treated as mathematical or TeX semantics. `src/geometry.mjs::fitSceneView` preserves room for pixel-sized annotations when calculating a world viewport. Geometric TikZ is disabled if a visible node requires SVG-only auto-wrapping.

`src/anchor_index.mjs` holds a lazily built 32-pixel screen grid of current visible anchors, not a persistent data structure. Keys include document revision/generation, camera center/zoom, canvas size and object count. Snap ties use prior earliest-anchor semantics, point hit ties prefer upper layers, and hidden/transparent objects are excluded. Dragging a point may temporarily mutate its coordinate but no index query occurs until commit/cancel. New multi-anchor construction still uses the separate pre-gesture candidates snapshot. Both performance/memory and tie semantics have dedicated tests.


## Cut 16 persistence safety refinement

`src/storage.mjs` compares the last observed serialized project with the actual current storage payload. If current bytes already equal the proposed payload, the write is idempotent and `setItem` is skipped even when the expected token is stale. If bytes differ from both expected and desired, the writer reports a conflict without overwriting. Normal asynchronous save requests execute inside a browser Web Locks exclusive section where available; the callback always reads the latest document rather than closing over an older draft.

`storage` events are asynchronous notifications; the handler reads `localStorage.getItem()` at receipt time to handle obsolete queued event payloads. A storage clear (`key === null`) also invalidates the saved version and pauses the writer. A failure to read or write localStorage is explicit; a UI Retry local save reuses the same guarded save, while manual JSON download remains independent. Real multi-tab atomicity and pagehide crash safety remain **not proven**.

## Cut 17: model visibility versus render artifact

An object remains in JSON, name resolution and dependency graph when `hidden=true` or `style.opacity=0`. The renderer skips producing DOM for either state. A morphism whose endpoint node is invisible is still a semantic edge in JSON but produces no visible SVG edge. Publication TikZ refuses such a **visible** morphism, rather than inventing an arrow. Fully transparent nodes, arrows and other objects are omitted from TikZ. A bounded screen-space culling decision changes only the present SVG scene, not the model, save, undo, or future viewport; shapes crossing the view must be conservatively retained. Do not use culling to optimize full-document geometry or persisted state.

### Cut 18 optional project setting

`settings.exportTransparent?: boolean` (canonical default `false`) controls image export compositing **only**. It does not alter the on-screen `settings.background` color. When true, exported SVG omits the full-scene background rectangle and PNG/WebP retain transparent alpha; JPEG is disabled, not silently flattened. A semantic morphism label must not carry its old opaque canvas-background halo into an alpha export. v1 runtime normalization and JSON Schema accept omitted legacy fields but reject nonboolean inputs. TikZ remains separately static and unaffected by export background transparency.

### Cut 19: mathematical text and view-only culling

The version-1 source string is authoritative. A node's auto-wrap may divide that string into visual SVG `tspan` lines but may **not trim or normalize author spaces**. Text, node and morphism labels can be edited with multiline Properties. Ordinary text/morphism labels emit separate SVG tspans for explicit newlines. SVG text layout is presentation-only and does not alter dependency references, labels stored in JSON, autosave or undo. Unrepresentable multiline PDFLaTeX text is not silently flattened. Text-node viewport culling uses deliberately conservative font-size bounds and never changes document semantics. Morphism drawing is evaluated separately from endpoint-node paint visibility, so arrows crossing the viewport remain visible even if both node boxes are culled.

### Cut 20 — label layout is a view, not a semantic mutation

`src/anchor_index.mjs` supplies a multi-hit point stack for explicit selection cycling. `src/label_layout.mjs` computes candidate screen coordinates for visible point names only when `settings.labelPlacement='avoid'`. It receives current viewport coordinates and returns ephemeral pixel positions keyed by object IDs; `src/app.mjs` applies them to both editor and SVG/raster rendering without modifying project geometry or names. Native JSON remains the authority. The bounded bucket search is approximate; restricted TikZ cannot encode this screen-space label position and is explicitly disabled for affected scenes. In v1 JSON the field is optional, defaults to Standard for legacy files, and is restored to Standard by named presets.

A four-entry LRU caches settled label placement keyed on document revision/generation and viewport dimensions/transform. Active point/node drag bypasses the cache to avoid stale preview labels when coordinates change before a commit. This small cache does not store or modify author data.


### Cut 21: opt-in screen-space morphism route and label representation

A morphism retains exactly two node refs. Its optional v1 `routing` is `direct` (implicit legacy default) or `avoid`; optional `labelT` (0.05–0.95), `labelDistance` (0–200 CSS px), `labelDx`/`labelDy` (±300 CSS px) override the legacy 0.5/17/0/0 values. `src/diagram_routing.mjs` computes a display path from current screen-projected node rectangles, not stored world-coordinate vertices. Each redraw uses current visible node boxes; no geometry is cached across a node drag. The route status is explicit: direct/clear/routed/blocked/overlap. Blocked renders amber dashed rather than claiming a detour. Standard direct mode skips obstacle construction for performance. SVG/raster reflect on-screen output; restricted TikZ denies nondefault visual geometry; native JSON retains the full semantic graph.

### Cut 22: interactive label-handle gesture

The morphism's semantic `refs`, curve and routing are never changed when moving its label. The visible position remains computed from the current rendered path and existing model fields `labelT`, `labelDistance`, `labelDx`, `labelDy`. The selected morphism receives one temporary, nonexported SVG handle. Transparent path hit targets are layered **below** the handle so the handle receives pointerdown. During a pointer move the original JSON snapshot is retained; only the two shift fields preview. The release pointer event computes the final offset, validates the project and records one undo snapshot if and only if the data changed. Blur, pointercancel, capture loss and secondary contact restore the prior snapshot. Thus model version 1 and all exports remain compatible.

The helper `labelDragOffset` clamps at ±300 CSS pixels, rounds a real movement to 0.1px, and leaves sub-2px movements unchanged—including historical fractional label shifts. A keyboard author can continue using exact shift fields in Properties. The handle is absent in exporting mode, from locked arrows and from unlabeled morphisms.


### Cut 23 presentation-only morphism label packing

A morphism may optionally store `labelAvoid: true` in JSON v1; absence/false is exactly the historic manual position. `src/morphism_label_layout.mjs` runs after semantic endpoint resolution and before SVG rendering, reserving visible node rectangles and manual morphism labels first, then selecting among bounded candidate screen-space displacements for opted-in labels. It does **not** mutate `refs`, `xy`, `text`, `labelDx`, `labelDy`, or dependency topology. Render/export use the same positions for the requested viewport. A failed packing attempt is an explicit visually warned state, not a silent fallback. The first actual drag freezes the computed visual shift into bounded numeric X/Y offsets, disables `labelAvoid`, and records one undo snapshot on release. No auto positions are persisted: recomputation on viewport change is intentional and may differ with CSS fonts.

## Cut 24: deterministic best-effort crossing minimization

Routing is a **view derivation**, not a model mutation. The `routing` enum for a morphism adds `avoid-crossings`, with old missing/default `direct` and `avoid` unchanged. At paint time, `app.mjs` visits visible morphisms in document order, computes a single route map, and records the geometry of earlier visible arrows; curved predecessors are approximated by 12 straight pieces. New crossing-aware arrows try a bounded set of node-clear two-turn corridors and prefer lower strict interior crossing counts, breaking ties by length. The same map feeds render/export and label layout. Endpoints touching do not count as crossings; collinear overlaps, shared-node ambiguity and arrowheads are NOT exhaustively analyzed. Safety ceilings return a visibly warned `capacity` path, not an implicit claim of correctness. `blocked` and `crossing` likewise stay visible in amber/dashed form. This is intentionally *not* a global optimizer.

`draw(..., exporting:true)` no longer mutates the editing-only `currentMorphismLabels` map: export may run during UI state transitions, but it must not overwrite a live label-handle offset with a publication-only layout.

### Cut 25: bounded scene-aware crossing refinement

The morphism's optional v1 `routing` may now be `scene-crossings`. During a redraw, `app.mjs` computes its usual routes and calls `optimizeGlobalArrowRoutes` only if at least one *visible* opt-in edge exists. Direct, Avoid nodes and earlier-only crossing routes remain frozen. The refinement is deterministic, uses at most 48 drawable arrows and two passes, and checks the *final* route against all other visible paths before showing a success status. Earlier direct curves use the existing bounded polygonal approximation. The new `polylineVisualConflicts` counts T-junction and collinear overlaps for this opt-in mode; precise curve/arrowhead intersections remain approximate. The chosen map drives displayed SVG path, label placement and exports. No references or mathematical object fields are mutated. An undrawable historical overlap is retained as a semantic edge, not a route obstacle.


## Round 32 — derived rectangle and regular-polygon segments; morphism paint order

Newly created axis-aligned `rectangle` or `regularPolygon` objects create **one persisted `segment` per visible side**. A side uses `edgeOf: ownerId` plus integer `edgeIndex` (zero based), and exactly the parent's two `refs`. Unlike free-vertex polygon edges, these two references are *defining anchors*, not its drawn side endpoints. `createResolver(doc).points(side)` and `.line(side)` compute the actual endpoints from current rectangle min/max corners or `regularPolygonVertices`. Rendering, object snapping, fit bounds and SVG/TikZ serialization therefore refer to the same live mathematical geometry. Object names, IDs, style, visibility and deletion of a side remain independently editable; deleting its owner cascades, without forcing ownership on historical shapes. The order of the rectangle's four virtual corners is bottom-left, bottom-right, top-right, top-left **in mathematical world coordinates** (screen Y is inverted). The regular polygon's side order follows the first explicit radial vertex and increasing mathematical angle. If two defining rectangle corners swap coordinate order, edge indices stay tied to these canonical geometric sides rather than the original click corners.

The v1 schema adds optional `edgeIndex` for owned segments (max 99); the runtime validator checks owner type, exact defining refs, side ordinal and duplicate `(edgeOf, edgeIndex)` ownership. A missing/indexless `edgeOf` is legal **only** for the original free-vertex `polygon` side format. Missing sides are legal after user deletion. No migration, implicit vertex objects or project format bump is introduced. Imports with invalid metadata reject as a whole; UI creation is one undo transaction. Direct model callers should use the `command(...)`, `createAnchored(...)` or explicit `appendDerivedShapeEdges(...)` constructor, rather than plain `append`, if they want automatic sides.

Morphism labels are painted in a final label-only overlay above all base nodes and arrows; the transparent drag hit targets are placed above all visible labels, and excluded from SVG/raster export. Original label text, routing, collision-warning metadata and computed screen coordinates are unchanged. This handles obstruction by *later* drawn objects and allows direct drag after selection changes. The earlier occasional Playwright `bounding_box=null` failure was not reproducible deterministically before this cut, so this is a verified obstruction fix and stress mitigation, not a claim that every intermittent case is eliminated.


### Round 33 — visibility and dependent-side mutations

The drawing keeps two separate concepts: **reference dependency** (`refs`) and **owned derived geometry** (`edgeOf`). A hidden anchor is still a mathematically valid source for a visible construction, but hiding or zeroing the opacity of an **owner polygon/rectangle/regular polygon** hides its owned Segment sides on canvas, in object snapping, in fit bounds, and in the object list's hidden filter; this does *not* erase side objects or their independently stored appearance. `isObjectVisible` centralizes this ownership check. Unhiding the owner restores side identities. Deleting an owner still cascades through `affected(...)`; deleting a side is independent unless other objects reference it.

`resizeRegularPolygon(doc, ownerId, nextSides)` is the only direct helper for changing an already-built regular polygon's side count. It retains all still-valid side IDs and styling, removes only now-out-of-range indexed Segments, and appends new indexed segments only when expanding a polygon that already owns indexed sides. Previously deleted valid side slots remain absent, and historical side-less polygons remain side-less. The helper refuses a shrink if an outgoing side is locked or has any dependent construction. The editor invokes it within a single `update()` validation/rollback and Undo/Redo transaction; callers must do likewise. No new JSON fields or schema version are required.

The inspector's Bring forward/Send backward only alters paint order. Derived geometry and labels resolve IDs against a global object map, not display order. Morphism label top-layer hits retain their data IDs while editor-only hover/drag targets stay out of exports. Hooked morphism display is an inset semicircle without modifying stored routes, labels or references; it follows the existing swapped label-side flag. Complex shared-source hook collisions are not yet globally optimized.


## Round 35 — oriented quadrilateral dependencies and measurements

The Round 32 description of `rectangle` as always a two-ref axis-aligned rectangle describes **legacy documents only**. From Round 35, newly constructed `rectangle` has **three** point refs: A and B are its first edge; C controls the signed perpendicular height. `shapeVerticesFromPoints` projects C off that edge to form vertices `[A,B,B+height*n,A+height*n]` where `n` is the normalized left normal of B−A; C is a control guide, not necessarily itself a polygon corner. Legacy two-ref rectangles retain min/max-corner semantics and are never auto-migrated.

New `parallelogram` has three consecutive corner refs `[A,B,C]` and virtual corner `D=A+C−B`. Both types produce exactly four **owned derived** `segment` records with `edgeOf`, `edgeIndex∈{0,1,2,3}` and the same **three refs** as the owner (two for legacy rectangles). Ordinary user-authored segments always have precisely two refs. Validation checks matching owner and ref array, unique edge index and valid noncollinear shape. Dynamic Segment length resolves *actual drawn endpoints* from the derived owner; Angle size resolves its three live points. Measurements are ephemeral read-only Properties values (units/degrees), not serialized into project JSON. Geometry uses the same shape vertex function for canvas, snap and export. Existing schema version stays v1.

In Move, empty canvas pointer drag temporarily pans; Shift/Ctrl/Cmd+drag retains the marquee and pointer cancellation rolls back view change as applicable. The user-approved control-point glyphs reflect the 1/2/3/4-click construction interactions; all other glyphs remain snapshot-protected.
