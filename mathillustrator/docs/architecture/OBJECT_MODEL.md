# Semantic object model, coordinate space and drawing pipeline

**Status: implemented minimal v1 model, target architecture under development.**

## Data rules

- A project document has `format: "mathillustrator-project"`, `version: 1`, metadata, settings, `objects[]` and monotonically increasing `nextId`.
- Object IDs (`o1`, `o2`, …) are stable and never based on labels. Names are editable and unique. Reference fields point to IDs, not names.
- Implemented object types: point, midpoint, segment, arrow, line, circle, polygon, polyline, freehand, text, function. Rectangle tool creates an ordinary four-vertex polygon, not a constrained rectangle type.
- Point has `[x,y]` coordinates; midpoint is computed from two point-like references. Segment/arrow/line/circle/polygon/polyline hold references. Freehand holds `[x,y]` path samples. Text has a coordinate and string. Function has a safe expression string in one variable.
- The dependency graph is directed and acyclic, checked on JSON import and after every committed edit. A moved point changes dependent geometry immediately. A deleted object deletes transitively dependent objects, rather than leaving invalid pointers.
- Rendering and publication outputs are *derived views*. The JSON file is currently the only lossless editable native interchange format.

## Geometry and coordinates

World coordinates use an ordinary right-handed 2D mathematical plane. SVG has top-left origin and down-pointing screen y; the renderer converts with

```
screenX = (worldX - centerX) * scale + viewportWidth/2
screenY = (centerY - worldY) * scale + viewportHeight/2
```

The inverse is used for pointer positions and zooming about the cursor. Zoom/pan state remains UI state, not mathematical object state. `scale` is CSS pixels per mathematical unit.

## Render / interaction flow

1. A tool choice and user click/command creates a proposed construction.
2. `src/model.mjs` allocates stable IDs and checks basic geometric validity.
3. The editor validates and commits changes transactionally, records a bounded undo snapshot, and debounces local persistence.
4. The SVG renderer projects world geometry; drafts are previewed without entering the document; `requestAnimationFrame` reduces redundant draw work.
5. SVG is a scene-derived output; raster export uses an in-browser canvas; TikZ uses a separate export backend that currently handles only simple types, without semantic dependency round-trip.

The current renderer is intentionally simple and complete-document SVG rebuilds occur on edits. Long-term rendering should use an indexed scene graph, spatial hit-testing, caching, GPU paths where justified, and precise size/memory performance profiles. Do not assume WebGPU is universally available.

## Scope boundaries and future object contracts

Phase 1 extends geometric constraints, custom curve types, user-defined freeform anchor controls, vector labels and advanced snapping. Phase 2 adds semantic diagrams with `node`, `edge`, `morphism`, endpoint ports, commutative cells, and a LaTeX parser/serializer. Phase 3 adds scalar/vector/complex plots, transformations, symbolic formulas and parameters, with explicit math engine dependencies. Phase 4 adds real 3D surfaces, cameras, surface meshes, custom projections, and animation timelines. A highly implicit PDE/ODE solver is **not** a core requirement; sampling external solutions may be an optional future adapter.

Every major new semantic object requires: versioned JSON representation, migration strategy, dependent updates, selection/hit-testing, editable properties, undo/redo, export capability matrix, disabled unsupported formats, tutorials and red/green regressions.
