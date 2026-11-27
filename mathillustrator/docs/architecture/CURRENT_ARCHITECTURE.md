# MathIllustrator — Current architecture

This map records the shared responsibilities established by A1–A8. It does not replace the v1 project schema, mathematical implementations or user tutorial. New changes should reuse the owning module instead of recreating its rules in consumers.

## Ownership and dependency direction

| Responsibility | Owner | Contract |
| --- | --- | --- |
| Application orchestration | `app.mjs` | Own current document, selection, viewport, gestures, paint scheduling, notifications and persistence coordination. Consumers do not mutate application state implicitly. |
| Semantic document and commands | `model.mjs`, `plot3d.mjs` | Validate semantic objects and references; preserve stable identifiers, v1 format and compatibility defaults. Dimension-specific mathematics and scene validation stay specialized. |
| Plot applicability and shared limits | `plot_capabilities.mjs` | Distinguish stored applicability from active control state; shared palette, density and raster limits consumed by validators, UI and samplers. Schema remains an independently checked structural contract, not a replacement for semantic validation. |
| Properties controls | `property_controls.mjs`, `properties_layout.mjs` | DOM construction and numeric input contracts, with explicit UI services. Application supplies edit callbacks; invalid edits restore accepted values. Related ranges are committed together. |
| Naming and terminology | `object_naming.mjs`, `i18n.mjs` | Shared object-name rules and one canonical translation dictionary. Authored text is not a translated UI label. |
| History | `document_history.mjs` | Paired serialized document/trash entries, validate before moving stacks, clear redo on divergent edits, one estimated byte budget for both stacks; keep one nearest entry even if oversized. |
| Structural dependencies | `dependency_graph.mjs` | Iterative ancestor/descendant walks, dependency-first ordering, ownership edges, identifier-based slider references and inherited locks. Geometry resolution remains separate. |
| Sampling and numerical geometry | `plot.mjs`, `plot_modes.mjs`, `plot3d.mjs`, `geometry*.mjs`, `numeric_geometry.mjs` | Specialized evaluation, domain masks, sampling, shape computations and finite-coordinate handling. Do not merge differing numerical algorithms merely for symmetry. |
| Rendering cache | `plot_cache.mjs` | Shared weighted LRU, explicit sampling keys, artifact and budget metadata share lifetime. Appearance-only edits should not force irrelevant resampling. |
| Export | `export_fidelity.mjs`, `diagram.mjs`, application exporter | Capture asynchronous image settings and freshness state, isolate editor rendering status, share projected arrow geometry. Only native JSON is the full editable representation. |
| Persistence | `storage.mjs`, application storage coordination | Browser-local persistence; retain conflict and quota handling. Document and trash storage are not one atomic durable transaction. |

## Editing and rendering boundaries

- Validate proposed edits before accepting them. Use stable object identifiers, not captured stale document objects. Preserve existing gesture-specific mathematical validation and rollback.
- Record accepted semantic edits through the shared history mechanism; keep document and Recently Deleted snapshots paired. The default 80-entry and estimated 30 MiB history budget covers both undo and redo stacks, including serialized trash. This is an estimate of UTF-16 content, not a measured heap bound. An individually oversized nearest snapshot is retained so one undo/redo step remains possible. Large trash histories may now evict old entries earlier.
- Use structural traversal for dependency decisions, but do not turn ownership links into geometric inputs. Slider reference matching is structural/lexical rather than symbolic simplification.
- Cache keys describe sampling inputs. Keep cached rendering output and diagnostic state together. Screen paths, world rasters and 3D world meshes have different viewport dependencies. The 3D mesh cache retains an estimated 224 MiB budget and a 256-entry cap.
- Export the captured scene/view and settings; invalidate asynchronous export work when relevant state changes. Dense interactive 3D raster previews are intentionally different from full-detail vector export. Supported output formats: SVG, PNG, JPEG, WebP, native JSON and restricted semantic tikz-cd. No raw TikZ/PGF or PDF export.
- In a given release, every local module path must have one canonical versioned import URL. When a module changes, update the version on its import edges and on affected transitive importers, including the HTML entry point as needed. Different query strings are different browser module identities, even for the same path.

## Verification policy

The authoritative evidence is the actual execution of the current verification gate, not historical report totals. `tests/verification/release_gate.py` selects Quick, Local and Release workflows; `baseline_inventory.json` protects existing source/test files. Node tests cover module contracts, schema agreement and numerical invariants. Real Chromium covers end-to-end UI workflows. Local/Release additionally select trash history, inherited locking, dense 3D preview/export and orbit-detail regressions. The gate rejects incomplete/cancelled Node summaries and preserves captured output on timeout. No archived-browser coverage or hosted certification is implied by a selected local run.

## Boundaries intentionally retained

The application controller still contains substantial domain-specific UI and drawing orchestration. A new module is justified by a cohesive responsibility and testable interface, not by line count alone. Structural graph traversal is not a unified symbolic solver. JSON schema does not encode all semantic constraints. Browser storage is not a database. GPU/other browser engines and hosted deployment need their own acceptance evidence. Avoid introducing a new framework merely to conceal these boundaries.
