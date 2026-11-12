# Implementation roadmap — broad scope, honest release gates

This is a long-term plan, not a claim that every entry exists today. Feature status is tracked in `features.json` and should be changed only with source/test evidence.

## Cut 00 — first usable baseline (this overlay)

Three panels, icon/caption toolset, 2D SVG canvas and coordinate conversion, points/segments/arrows/circles/rectangles-as-polygons/polygons/polylines/freehand/text, safe explicit function graphing, basic programmatic constructions, midpoint and live point references, visual styling, presets, tunable grid/snap/smoothing, page guides, undo/redo, JSON persistence, SVG and browser raster exports, limited coordinate-only TikZ. Structured JSON contracts and regression suite. **Not a mature geometry or math diagram engine.**

## Cut 01 — harden the editor core

Fix remaining manual/browser-verified issues. Consolidate geometry creation with visible constraint feedback, explicit hover previews, vertex tools, multi-selection, hierarchy/layers, duplicate/group/transform actions, meaningful pan/zoom undo semantics where requested, mobile interaction, 1,000/10,000-object measured benchmarks, and rendering hotspot profilers. Add stronger error UI and export unit tests.

## Cut 02 — mathematical geometry engine

Semantic lines/rays/circles/conics, robust intersections, circumcircle/incenter, perpendiculars, angle/arcs, equal-length/equal-angle markers, rigid transformations, nested dependencies, draggable intersection branches, degeneracy policies, geometric snapping, custom shape auto-recognition. Tolerance/precision settings and exact vs numerical certificates.

## Cut 03 — diagrams and LaTeX-native workflows

Arbitrary nodes, morphisms and arrow routing, path diagrams, commutative squares/cubes, TikZ and `tikz-cd` import/export with round-trip tests, provenance/unsupported syntax warnings, automatic labels and alignment, scalable diagram templates.

## Cut 04 — analysis and complex plane

Möbius map visualizations, Riemann sphere stereographic representations, polar/complex grids, vector fields, parameters and sliders, numerical curves and surface sampling. No mandatory numerical solving of implicit differential equations.

## Cut 05 — differential geometry and 3D

Camera, 3D mesh/surface generation, parametrized surfaces, 2D projections, curvature overlays, manifold charts, Ricci-flow-inspired visualization from specified data and model families (never claim to solve Ricci flow from hand-drawn contours).

## Cut 06 — animation and publication pipeline

Timeline/keyframes, real-time sliders, GIF/video, vector PDF, Asymptote, self-contained high-DPI export, accessibility, full import compatibility matrix, collaborative/reusable templates only if desired.

Every cut must update the user-facing tutorial, docs manifest, machine-readable feature record, test evidence, and known issues. Never silently enable a visually present but nonfunctional tool.
