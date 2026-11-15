# MathReader v444 — proof ownership and mathematical cross-references

- Fixed explicit `Proof of Lemma/Theorem/Proposition/Corollary N` headings attaching to an unrelated recent declaration when the printed target is missing.
- Restricted inferred unnumbered proof ownership to recent declarations and, when coordinates exist, the same physical column.
- Reset active proof-reference collection when a new proof heading has no eligible target, preventing citations in that proof from leaking into an earlier result.
- Bumped local Structure/Results index version to 59 to rebuild stale indexes; imported reading-data records retain compatibility.
- Added `tests/results_proof_ownership_v444_regression.js`, updated integrity assertion and bilingual tutorial.

## Evidence boundary

The focused test exercises production proof-target resolution with controlled entries and geometry; it is not independent precision/recall on original PDFs. Existing external original-PDF and Texify evidence requirements remain unchanged.
