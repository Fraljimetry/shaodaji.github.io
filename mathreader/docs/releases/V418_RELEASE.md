# MathReader v418 — General equation numbering and repeated printed occurrences

## Problem and evidence

The user-supplied **224-page** full-native-text MathReader JSON for Leon Simon, *Lectures on PDE*, is keyed to PDF SHA-256 `f206d5853a9eee03af37156311475d08bda51875b29dc740826c60240d4b38dd` (the original PDF bytes were not provided this cycle). Its v417 snapshot contained **19 equation occurrences**, although physically distinct numbered formulas were present on many other pages. On page 125 the v417 export kept `(7)`, `(8)` but missed `(2)`–`(6)`; the independent production-builder replay with the recorded native PDF.js source geometry recovers `(2)`–`(8)`. On page 129 it recovers `(9)`–`(12)`; on page 172 it recovers `(10)`–`(15)` while excluding an in-text duplicate reference to `(12)`. Original page 61's wrapped prose ending `(2))` must **not** be added.

Reproduction tests written and executed before changing the v417 detector:
- `tests/equation_numbering_scope_v418_regression.js` — fails because page 125's `(2)` is missing.
- `tests/equation_notation_families_v418_regression.js` — fails because `(1.2a)` is not parsed.
- A further test exposes a lexical-reference gap for `refer to (II.7.14)` and passes after the targeted correction.

These are **source-native geometric replays**, not a physical scan or verified true-label inventory. Preserve this separation when reporting detection accuracy.

## Independent numbering conventions researched

| Source | Source-established convention | v418 coverage |
|---|---|---|
| Atkinson & Han, *Theoretical Numerical Analysis: A Functional Analysis Framework* | `(1.2.3)` = Chapter 1, Section 2, third mathematical relation | Chapter–section–equation parser/scan/sequence family |
| Ronold W. P. King, *The Theory of Linear Antennas* (1956), note on numbering | Each section restarts `(1)`, `(2)`, ...; cross-section `(7.14)`; cross-chapter `(II.7.14)` | Local repeated occurrence identity, Roman-prefix parser, prose reference rejection |
| R. K. Livesley, *An Introduction to Automatic Digital Computers*, Cambridge excerpt p.2 | Three aligned equations `(1.2a)`, `(1.2b)`, `(1.2c)` | Letter suffix parser, scanner, and reference context |
| IEEE, *Editing Mathematics* (2018), p.5 | `(1a)` subnumbering, `(A1)` appendix, `(1.2.1)` section-local hierarchical tags | Compact suffix, appendix, hierarchical grammar; no automatic label inference |

Sources:
- Atkinson–Han PDF: https://cdn-cms.f-static.com/uploads/1460418/normal_5b98f67e0543c.pdf
- King PDF: https://chchhamradio.org.nz/wp-content/uploads/2021/11/the-theory-of-linear-anntenna-ronold-w-p-king-harvard-university-press-1956.pdf
- Livesley Cambridge PDF: https://assets.cambridge.org/97813166/33304/excerpt/9781316633304_excerpt.pdf
- IEEE PDF: https://ieeeauthorcenter.ieee.org/wp-content/uploads/Editing-Mathematics.pdf

**Important scope:** these external PDFs were inspected to establish **numbering conventions**. They were **not downloaded into this regression workspace** or processed as actual PDF.js source files. The synthetic parser scenarios must not be misreported as full-book detection accuracy.

## General source correction

**Changed runtime files:** `js/41-equations-bibliography.js`, `js/00-core.js`, `mathreader.js`, `index.html`.

- Keep individually justified **native printed locations** for repeated labels across distinct pages, rather than collapsing an entire book to one target per displayed string. False in-text citations, enumerated definitions, OCR-only uncorroborated candidates and same-page ambiguous repeats retain conservative exclusions. UI occurrence-specific page locations and stable navigation keys remain unchanged.
- Remove an overly broad trailing-semicolon pseudo-code heuristic and stop treating short mathematical index variables as prose words. Explicit programming structures remain excluded by syntax checks.
- Distinguish printed labels from references, including broken `(2))` tokens and direct `refer to (II.7.14)` prose.
- Support `(1a)`, `(1.2a)`, `(2.4b)`, Roman prefixes, existing `(A.1)`, `(A1)`, `(C.2a)` and hierarchical `(1.2.3)` in the shared parser/validator without paper-specific normalization.
- Advance browser assets to **v418** and *local* equation-index snapshot `EQUATION_INDEX_SUMMARY_VERSION` from 27 to **28**, forcing stale detector-generated local equation indexes to rebuild. Portable exported indexes still follow the existing non-destructive import semantics.

## Regression results

| Verification | Actual outcome |
|---|---|
| v418 JavaScript suites, including two new source-backed tests | **64/64 PASS** |
| v418 Python/Chromium suites | **28/28 PASS** |
| Responsive-layout checks | **176/176 PASS** |
| JavaScript syntax checks (bootstrap/modules/tests/utilities) | **80/80 PASS** |
| Assembled 10-module runtime syntax | **PASS** |
| Standalone P0 Chromium reader shell | **PASS** |
| 224-page *Lectures on PDE* native PDF.js replay | **20 distinct displayed labels / 171 candidate occurrences**, vs. original v417 snapshot **19 occurrences** |
| Frozen 12-page Simon PDE fixture | **19 labels / 32 candidate occurrences; scoped assertions PASS** |
| Simon GMT colon-font / repeated locations / false definition-list numerals | **PASS** |
| Original document page-image ground truth / real formula recognition | **NOT VERIFIED** |

A monolithic `p0_gate.py` invocation exceeded the execution deadline and did **not** yield a full-gate report; the complete source/tests/shell gates above were therefore executed and verified individually. Full-document P0 acceptance remains **INCOMPLETE** because no source-matched original PDF plus independent ground-truth manifest was supplied. Evidence: `regression/v418_js_results.json`, `regression/v418_python_results.json`, `regression/v418_release_gate.json`.

No global 100% mathematical accuracy is claimed. This cycle did not re-run live Texify WASM inference or measure true browser main-thread responsiveness under the real model.

## Known limitations and shipping

A second section may begin on the **same PDF page** and reuse a number. Existing same-page de-duplication remains deliberately conservative because two source-native detections of `(1)` on one page do not independently prove that two separate displayed equations exist; no speculative second target is created. Per-occurrence Remove/Reselect for ambiguous repeated labels remains disabled as before. Formula OCR evidence lost on hard refresh in Ahlfors remains an explicitly accepted limitation. A native PDF.js re-export after deployment is the next reliable validation step; **Rebuild index** is appropriate for older imported snapshots.

The ZIP has exactly one top-level `mathreader/` directory and includes all production code, tests, documentation and bounded native fixture. Replace the complete existing folder; do not overlay loose individual files.
