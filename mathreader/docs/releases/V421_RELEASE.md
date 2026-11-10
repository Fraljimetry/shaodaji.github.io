# MathReader v421 — column-aware Structure, Results, Bibliography

## Scope and evidence status

MathReader v421 is a focused P0 detector correction on top of the **v420 overlay**.
This archive is an **overlay only**: extract its `mathreader/` paths over the
installed project. There is no need to delete any files.

**Important boundary:** The cross-journal research identified **30 real 2024
research papers from 10 representative major journals, three each**. See
`regression/journal_corpus_v421.json`. Their publisher records were found, but
**none of those 30 original PDF files was acquired into the local test runner**, so
**none of those 30 papers was executed or independently page-audited**. This is a
sampling *plan*, not a completed 30-paper empirical accuracy benchmark. The
phrase "every major journal" has no fixed exhaustive boundary; this selection
should not be advertised as such.

The **actual execution evidence** is a replay of the user's 12-page PDF.js-native
export of *Characterizing and Testing Principal Minor Equivalence of Matrices*
(STOC 2025), original document SHA-256:
`c1e71f0441ecb6401b085a653028921b38fa35aca5bd27726f370eb5d8153d20`.

## Reproduced defects

1. **Structure order:** Native PDF.js heading discovery sometimes sorted by
   vertical coordinate across the page, interleaving left and right columns.
   Page 4 incorrectly listed 2.3 before 2.1 and 2.2.
2. **Results omission/corruption:** Same-height text from an adjacent column
   merged with declaration text, causing missing results and erroneous titles.
   A later alphabetical/vertical sort also destroyed column-major ordering.
3. **Bibliography truncation:** The first two reference entries in the right
   column lay *above* the left-column "References" heading, and a university
   affiliation inside reference [26] was falsely classified as end matter.
   As a consequence [21], [22], [27]–[41] were missing.
4. **False cross-references:** Mathematical matrix indices such as `A[1,2]`
   and symbolic index sets had been counted as numbered bibliography citations.
   Genuine phrases such as `[1, Lemma 4.5]` must still be linked.

## Fixes

- Add a conservative native-text two-column classifier to Structure discovery,
  using substantial evidence from both sides of a detected gutter; sort
  headings column first only on qualifying pages.
- Use conservative column separation when building Results from ordinary
  native text, not just on bibliography pages. Preserve natural column order
  when reinserting OCR-recovered results.
- Extend bibliography scanning to a right-column continuation above the
  left-column heading; defer end-matter closure when an immediately following
  sequential reference is observed.
- Reject mathematical matrix/index bracket expressions while preserving
  legitimate numbered bibliography references and ranges.
- Bump `STRUCTURE_INDEX_VERSION` from 55 to 56 to rebuild old Structure/
  Results/Bibliography caches. Equation schema remains 29 and its detector is
  deliberately untouched. Update browser asset cache keys to v421.

## Replayed ground-truth fixture (genuine exported PDF.js text)

| Index | v420 exported baseline | v421 native-text replay | Interpretation |
| --- | ---: | ---: | --- |
| Structure | 14, column-misordered | 14, column-ordered | Page 4: 2.1, 2.2, 2.3, 2.4 |
| Results | 23 | 29 candidates | Restores e.g. Lemma 2.4, Claim 2.7, Lemma 3.9; **not exhaustive human truth** |
| Bibliography | 24 `[1]`–`[20]`, `[23]`–`[26]` | 41 `[1]`–`[41]` | Correct uninterrupted numbering in supplied document |
| Equations | 21/21 previously printed labels | 21/21 previous regression | Unchanged equation detector |
| `[1]` citation links | 46 (many matrix index FPs) | 6 | More conservative references |
| `[2]` citation links | 49 (many matrix index FPs) | 1 | More conservative references |

The MathReader JSON provides native PDF text and geometry, **not raw PDF page
images**. This replay is not live end-to-end PDF loading, real Texify OCR,
or universal mathematical correctness certification.

## Automated gates

- 69/69 JavaScript test files pass; includes new source-level integration
  `tests/cross_journal_native_content_v421_regression.js` and the
  `tests/journal_corpus_manifest_v421_regression.js` honesty check.
- 29/29 Python test files pass individually, including the manual Structure
  Chromium interaction and the 176-assertion responsive-layout regression.
- Chromium reader shell gate reports PASS. This checks the actual browser
  shell only, not loading the 30 unacquired external journal PDFs.
- `tests/two_column_native_equations_v420_regression.js` retains 21/21 printed
  STOC labels with zero spurious entries in its native-text fixture.
- The existing Leon Simon equation-numbering and historical appendix/Results/
  Bibliography suites pass; they are not new independent original-page reviews.

### Journal sampling and reproduction

Publisher-verified titles, topics, and URLs are recorded in
`regression/journal_corpus_v421.json` (10 journals × 3 papers = 30 papers).
It is explicitly **not an executed-corpus report**.

After independently acquiring each lawful original PDF, place it using the
manifest `local_pdf` filename, for example under
`mathreader/regression/journal_pdfs/`. Then run:

```bash
python regression_tools/journal_corpus_gate_v421.py --out-dir /tmp/mathreader-journals
python regression_tools/journal_corpus_gate_v421.py --run-browser --pdfjs-build /path/to/pinned/pdfjs/build --out-dir /tmp/mathreader-journals
```

The journal gate will refuse to claim browser success when no real PDFs are
available, and it cannot certify independent printed-index accuracy. For
full verified P0 accuracy, use original PDFs plus independently reviewed
per-page Structure/Results/Equation/Bibliography and paired formula truth under
`regression_tools/p0_gate.py --manifest ...`.

## Known limitations

- No execution of the selected external journal PDFs in this environment;
  dynamic source/PDF byte retrieval is unavailable.
- A candidate count is not equivalent to validated false-positive/false-
  negative rates against every printed page.
- Two-column layout classification is conservative; complex three-column or
  rotated layout and graphical OCR remain to be independently verified.
- Accepted Ahlfors hard-refresh margin-OCR evidence persistence limitation
  remains unchanged.
