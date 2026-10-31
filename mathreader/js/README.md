# MathReader JavaScript layout

`mathreader.js` is the small bootstrap. The application source remains one logical ES module: the bootstrap fetches the files in this directory in order, concatenates them, and imports the assembled module once. This preserves the lexical scope and hoisting behavior of the former monolithic file while keeping maintenance boundaries explicit.

Do not load these files as independent `<script>` or `<script type="module">` tags. They intentionally share module-local state. Keep their order synchronized with the `PARTS` manifest in `../mathreader.js`.

Subsystems:

- `00-core.js` — state, persistence, document OCR, preferences, base UI
- `10-formula-ocr.js` — formula OCR engine, LaTeX repair, diagnostics
- `11-formula-vector.js` — vector extraction, image preprocessing, OCR/vector fusion
- `20-selection-annotations.js` — selection, annotations, manual edits
- `30-rendering-navigation.js` — rendering, continuous mode, zoom, navigation
- `40-outline-structure.js` — outline inference and Structure UI
- `41-equations-bibliography.js` — equation/results/bibliography indexing and UI
- `50-references-search.js` — references, TOC, backlinks, glossary, search
- `60-notes-bookmarks-data.js` — comments, notes, bookmarks, document I/O, recovery
- `70-command-ui-runtime.js` — command palette, event wiring, sidebars, shortcuts, startup
