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

Maintenance baseline (v351): only the ten manifest-listed subsystem files form
MathReader's runtime. Top-level private declarations may be referenced across
subsystems despite appearing unused within one file. Before pruning one, check
references across the complete assembled source, including UI event bindings;
leave any detection or OCR behavior uncertain rather than deleting it. The v351
maintenance pass removed only declarations with no lexical references across all
ten source files; it did not rearrange the assembly, OCR pipeline, or indexers.
Run every `tests/*.js` file independently, and syntax-check both the bootstrap
and the assembled runtime after any structural maintenance. In particular,
`tests/maintenance_integrity_regression.js` protects manifest/cache and lazy-OCR
wiring but is not production-browser acceptance.


v352 Formula OCR rule: the rendered OCR LaTeX is sanitized for *syntactic* safety
using actual TeX environment/brace scope. Preserve legitimate aligned/matrix/
cases/array alignment separators; remove only illegal stray math-level `&` and
escape intended text ampersands. MathJax's rendered error nodes must be
recognized as failures even when its async API resolves. Keep the original
recognition available for editing, do not invent missing mathematical content,
and never represent syntax compilation as mathematical transcription accuracy.
For the authoritative old/new example corpus and its provenance, see
`../regression/formula_syntax_v352.json` and the v352 section of `../REGRESSION.md`.
