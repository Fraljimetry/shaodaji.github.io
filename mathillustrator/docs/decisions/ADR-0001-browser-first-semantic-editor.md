# ADR-0001 — Independent, semantic, browser-first MathIllustrator

- **Decision date:** 2026-11-12
- **Status:** Accepted as the initial architectural direction
- **Context:** The site is static GitHub Pages. MathReader is a separate PDF reader. MathIllustrator must combine precise mathematical constructions with unrestricted illustration and workflows varying by mathematical field.
- **Decision:** Implement a separate `mathillustrator/` application and project format. Maintain explicit live object references, a strict import validation boundary, browser-local persistence, and differentiated drawing modes. Deliver root overlay ZIPs only, every implementation cut. Do not silently attempt MathReader integration.
- **Technical direction:** Start with a dependency-free SVG 2D editor, then modularize scene, renderer, semantic engines, and format adapters. Evaluate WebGL/WebGPU for genuine 3D and heavier workloads only with measured fallback and capability detection. External browser-downloaded libraries are optional; local computation is preferred. No hidden remote work on user drawings.
- **UX direction:** Desmos/GeoGebra-inspired left object/command panel, central drawing area, right icon-and-caption grouped tool palette; purpose presets configure the workspace and correction *before* drawing; manual correction can be disabled. Infinite canvas plus page-design guide. Both GUI and script-generated objects share one object model.
- **Export direction:** Native JSON holds editable dependencies. Every format adapter advertises exact object support. Unsupported formats are disabled. Import and export of semantic LaTeX (especially TikZ/`tikz-cd`) are mandatory long-term goals, not silently claimed in v0.1.
- **Alternatives deferred:** Single monolithic canvas application; coupling to MathReader; a server-dependent architecture; exposing user-supplied formulas to JavaScript `eval`; defaulting to raster-only exports.
- **Risks:** Rich math domains require distinct semantic models; 3D and diagram tools must not be approximated by dishonest 2D placeholders. Strict schema evolution and truthful user documentation are required.
