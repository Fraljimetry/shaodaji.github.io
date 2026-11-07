# MathReader v408 — Previous-file Results Detection Audit

**Scope:** audit-only. No source files modified and no deployment patch in this archive.

## Verdict

**NOT yet mathematically accurate.** The v408 reference-continuation correction is effective in the originally reported nine-page case and in Ahlfors TOC examples, but at least two real regression classes remain in the previous mathematics corpus.

## Corpus and checks

Six original mathematical PDFs (539 pages) were recovered and independently SHA-256 paired with their MathReader exports: Giusti (253), Ahlfors (172), Yau (73), Simon (13), SPS (18), Banach (10). A seventh 56-page Yamabe export was replayed, but the original PDF was not available with matching SHA for visual accuracy certification. This yields 595 total PDF/export pages.

The actual v408 Results detector, including page-to-page Index state and bounded appendix-number disambiguation, was replayed on every available `detectorInputLines` array. Result counts reproduced the saved exports exactly:

| Work | Pages | Saved Results | Full v408 replay | Original PDF match | Independent accuracy |
|---|---:|---:|---:|---|---|
| Giusti | 253 | 196 | 196 | Yes | **FAIL**: mislocated Theorem 14.5 and 11 other true theorem labels suppressed |
| Ahlfors | 172 | 95 | 95 | Yes | Reviewed TOC definitions align with body, not fully certified |
| Yau 1978 | 73 | 13 | Not possible (no saved detector inputs) | Yes | **FAIL**: duplicate/reference Lemma 1 on p.39 |
| Yamabe Problem | 56 | 51 | 51 | No matching original PDF | Export replay only; unverified accuracy |
| Simon | 13 | 4 | 4 | Yes | Four printed labels checked via PDF text |
| SPS 1988 | 18 | 7 | 7 | Yes | Seven printed labels checked via PDF text |
| Banach | 10 | 14 | 14 | Yes | Fourteen printed labels checked via PDF text |
| **Total** | **595** | **380** | **367 re-playable** | **539 verified pages** | No defensible global precision/recall rate |

## Confirmed failure #1: Giusti, reference overshadows true theorem sequence

The original PDF p.150 contains prose discussing later chapters: "(see theorem 13.6) and L1 (see Theorem 14.5) boundary data." Its PDF.js visual lines start one segment as `Theorem 14.5) boundary data.`, which the v408 classifier wrongly treats as a theorem declaration.

Because `normalizeSequentialStructureEntries` enforces global monotonic numbering *per type*, the early false Theorem 14.5 rejects genuine later entries: `Theorem 12.9` (p.154), `12.10` (p.157), `12.11`/`12.12` (p.158), `13.2` (p.165), `13.4` (p.166), `13.5` (p.168), `13.6` (p.169), `13.7` (p.170), `13.8` (p.172), `14.2` (p.173), and the real `14.5` (p.175). This is **11 absent labels plus one label navigated to the wrong page** (12 real declarations affected).

The original PDF pages 150, 154, and 175 were rendered and independently inspected. This is a genuine positive/negative detection failure, not merely a coordinate-offset problem.

## Confirmed failure #2: Yau, prose reference counted twice

The PDF p.38 contains the actual unnumbered `LEMMA.` statement. On p.39, the author writes `Proof of Lemma 1` and then later references `Lemma 1.` in running prose. The saved index contains both `Lemma · p.38` and `Lemma 1` at p.39. The latter is **not a second lemma declaration**, and navigating to it lands at a reference. These two original PDF pages were also rendered and checked.

Yau's export has no `detectorInputLines` pages, so this defect was independently checked against its saved Results entries and original PDF; it was not reproduced by a full raw-line replay.

## Positive control: Ahlfors

TOC entry `4-1. Definition of extremal length` on PDF p.4 is not a Definition declaration, while `Definition 4-1` on PDF p.62 is the actual statement; visually checked. The v408 replay locates the result on p.62. The same distinction holds for `Definition 9-1` (PDF p.136) in text. This demonstrates a meaningful improvement, not complete certification.

## Correction to an intermediate naive test

The raw isolated per-page parser flagged `Theorem 125` on Giusti PDF p.253 (Subject Index continuation). The **complete v408 builder** tracks Index mode across pages and correctly rejects that entry. It is *not* a remaining confirmed production defect.

## Regression gate and limits

All **52/52 JavaScript regression suites** passed in this audit, including targeted Results tests. This illustrates missing test coverage, not detector accuracy. All six available full detection-input exports reproduce their saved Results counts (196, 95, 51, 14, 7, 4), confirming the replay methodology. No real deployed-browser test was performed; no independently annotated ground truth for all 380 Results entries exists. Do not quote these tests as complete mathematical recognition certification.

## Suggested next correction (not implemented here)

1. Use neighboring visual-line evidence to classify wrapped references such as `(see Theorem 14.5) boundary data`, rather than relying only on the text **after** a label.
2. Assign declaration confidence before deduplication; a likely prose reference must never suppress an explicit number-first printed declaration later in the document. Avoid unconditional acceptance of global monotonic sequence heuristics.
3. Avoid double-indexing an unnumbered theorem/lemma statement and later `Proof of Lemma N`/`Lemma N.` prose references.
4. Add failing tests using the exact Giusti p.150/154/175 and Yau p.38/39 observed material. Run the same signed PDF/export and appendix controls again.
