// MathReader · Equation indexing, Results/Structure indexing, and Bibliography rendering.
function normalizedReferenceLabel(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').replace(/\s*([()[\].,:])\s*/g, '$1').trim().toLocaleLowerCase();
}

function normalizeEquationTagCommands(value) {
  const commandMap = new Map([
    ['dagger', '†'], ['Dagger', '†'], ['ddagger', '‡'], ['Ddagger', '‡'],
    ['ast', '*'], ['star', '⋆'], ['bigstar', '★'], ['circ', '○'], ['bullet', '•'],
    ['triangle', '△'], ['blacktriangle', '▲'], ['triangledown', '▽'], ['blacktriangledown', '▼'],
    ['square', '□'], ['blacksquare', '■'], ['diamond', '◇'], ['blackdiamond', '◆'],
    ['odot', '⊙'], ['otimes', '⊗'], ['oplus', '⊕'], ['ominus', '⊖'], ['perp', '⊥'], ['parallel', '∥'],
  ]);
  return String(value || '').replace(/\\([A-Za-z]+)\b/g, (match, name) => commandMap.get(name) || match);
}

function normalizedEquationLabel(value) {
  let inner = normalizeEquationTagCommands(String(value || '').normalize('NFKC').trim());
  inner = inner.replace(/^\(\s*|\s*\)$/g, '').replace(/\s+/g, '');
  return `(${inner})`;
}

function isSymbolicEquationTagInner(inner) {
  const compact = String(inner || '').replace(/\s+/g, '');
  if (!compact || Array.from(compact).length > 8) return false;
  return Array.from(compact).every((char) => EQUATION_TAG_SYMBOL_CLASS.includes(char));
}

function isLikelyCalendarYearEquationLabel(value) {
  const label = normalizedEquationLabel(value);
  const inner = label.slice(1, -1);
  if (/^\d{4}$/.test(inner)) {
    const year = Number(inner);
    return year >= 1800 && year <= 2099;
  }
  const range = inner.match(/^(\d{4})-(\d{4})$/);
  if (!range) return false;
  const start = Number(range[1]);
  const end = Number(range[2]);
  return start >= 1000 && start <= 2199 && end >= 1000 && end <= 2199;
}

function compactNumericEquationTagInner(raw) {
  const value = String(raw || '').trim();
  if (/\d\s+\d/.test(value)) return '';
  return value.replace(/\s+/g, '');
}

function isPlausibleNumericEquationTagInner(inner) {
  const value = String(inner || '');
  if (/^\d+$/.test(value)) return /^(?:0|[1-9]\d{0,3})$/.test(value);
  return /^\d+(?:(?:\.\d+)+|(?:-\d+)+)$/.test(value);
}

function isEquationLabelQuery(value) {
  const label = normalizedEquationLabel(value);
  const inner = label.slice(1, -1);
  if (isLikelyCalendarYearEquationLabel(label)) return false;
  return isPlausibleNumericEquationTagInner(inner) || isSymbolicEquationTagInner(inner);
}

function parsedSequentialLabel(value) {
  const normalized = normalizedReferenceLabel(value);
  const match = normalized.match(/^(theorem|lemma|proposition|corollary|definition|remark|example|claim|conjecture|question|assumption|hypothesis)\s+([a-z]?)(\d+(?:\.\d+)*)$/i);
  if (!match) return null;
  return {
    type: match[1].toLocaleLowerCase(),
    prefix: match[2].toLocaleLowerCase(),
    parts: match[3].split('.').map((part) => Number(part)),
  };
}

function compareNumberParts(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const av = Number.isFinite(left[i]) ? left[i] : -1;
    const bv = Number.isFinite(right[i]) ? right[i] : -1;
    if (av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}

function normalizeSequentialStructureEntries(entries) {
  const accepted = [];
  const seen = new Set();
  const lastNumericByType = new Map();
  for (const entry of entries || []) {
    const labelKey = normalizedReferenceLabel(entry?.label);
    if (!labelKey || seen.has(labelKey)) continue;
    const parsed = parsedSequentialLabel(entry?.label);
    if (parsed && !parsed.prefix) {
      // Numbering is monotone within each result family, not across families:
      // Theorem 5 may legitimately be followed by Lemma 1.
      const lastNumeric = lastNumericByType.get(parsed.type) || null;
      if (lastNumeric && compareNumberParts(parsed.parts, lastNumeric.parts) < 0) continue;
      lastNumericByType.set(parsed.type, parsed);
    }
    seen.add(labelKey);
    accepted.push(entry);
  }
  return accepted;
}

function parsedEquationNumber(label) {
  const inner = normalizedEquationLabel(label).slice(1, -1);
  if (!isPlausibleNumericEquationTagInner(inner)) return null;
  const separator = inner.includes('-') ? '-' : '.';
  const parts = inner.split(separator).map((part) => Number(part));
  return { parts, prefix: parts.slice(0, -1).join(separator), last: parts[parts.length - 1], separator };
}

function equationDocumentPosition(item) {
  return Number(item?.page || 0) * 10 + (Number(item?.ratio) || 0);
}


function equationLineFragmentForColumns(line, parts, columnIndex, columnStartRatio, columnEndRatio) {
  if (!Array.isArray(parts) || !parts.length) return null;
  const ordered = [...parts].sort((a, b) => Number(a.start || 0) - Number(b.start || 0));
  const source = String(line?.text || '');
  const start = Math.min(...ordered.map((part) => Number(part.start || 0)));
  const end = Math.max(...ordered.map((part) => Number(part.end || 0)));
  const raw = source.slice(start, end).replace(/\s+/g, ' ').trim();
  if (!raw) return null;
  const leading = source.slice(start, end).search(/\S/);
  const adjustedStart = start + Math.max(0, leading);
  const fragmentParts = ordered.map((part) => ({
    ...part,
    start: Math.max(0, Number(part.start || 0) - adjustedStart),
    end: Math.max(0, Number(part.end || 0) - adjustedStart),
  }));
  return {
    ...line,
    text: raw,
    parts: fragmentParts,
    xStartRatio: Math.min(...ordered.map((part) => Number(part.xStartRatio || 0))),
    xEndRatio: Math.max(...ordered.map((part) => Number(part.xEndRatio || 0))),
    equationTwoColumn: true,
    equationColumnIndex: columnIndex,
    equationColumnStartRatio: columnStartRatio,
    equationColumnEndRatio: columnEndRatio,
  };
}

function equationColumnAwareSupplementLines(rawLines) {
  const lines = Array.isArray(rawLines) ? rawLines : [];
  if (!lines.length) return lines;
  const evidence = [];
  for (const line of lines) {
    const parts = Array.isArray(line.parts) ? [...line.parts].sort((a, b) => Number(a.xStartRatio || 0) - Number(b.xStartRatio || 0)) : [];
    let best = null;
    for (let index = 0; index + 1 < parts.length; index += 1) {
      const leftEnd = Number(parts[index].xEndRatio || 0);
      const rightStart = Number(parts[index + 1].xStartRatio || 0);
      const gap = rightStart - leftEnd;
      if (leftEnd < 0.38 || leftEnd > 0.58 || rightStart < 0.42 || rightStart > 0.64 || gap < 0.035) continue;
      const midpointDistance = Math.abs(((leftEnd + rightStart) / 2) - 0.5);
      if (midpointDistance > 0.09) continue;
      if (!best || midpointDistance < best.midpointDistance - 0.005
          || (Math.abs(midpointDistance - best.midpointDistance) <= 0.005 && gap > best.gap)) {
        best = { index, gap, midpointDistance };
      }
    }
    if (!best) continue;
    const lp = parts.slice(0, best.index + 1);
    const rp = parts.slice(best.index + 1);
    const leftStart = Math.min(...lp.map((part) => Number(part.xStartRatio || 0)));
    const leftEnd = Math.max(...lp.map((part) => Number(part.xEndRatio || 0)));
    const rightStart = Math.min(...rp.map((part) => Number(part.xStartRatio || 0)));
    const rightEnd = Math.max(...rp.map((part) => Number(part.xEndRatio || 0)));
    if (leftStart <= 0.20 && leftEnd >= 0.28 && rightStart >= 0.44 && rightEnd >= 0.70) {
      evidence.push({ leftStart, leftEnd, rightStart, rightEnd });
    }
  }
  // This is a supplement to the mature single-page detector, not a replacement.
  // Require repeated page-level evidence before treating an inner gutter as a
  // real column boundary; isolated formula/table gaps remain on the old path.
  if (evidence.length < 4) return lines;
  const median = (values) => {
    const a = values.filter(Number.isFinite).sort((x, y) => x - y);
    return a.length ? a[Math.floor(a.length / 2)] : NaN;
  };
  const leftStart = median(evidence.map((e) => e.leftStart));
  const leftEnd = median(evidence.map((e) => e.leftEnd));
  const rightStart = median(evidence.map((e) => e.rightStart));
  const rightEnd = median(evidence.map((e) => e.rightEnd));
  if (![leftStart, leftEnd, rightStart, rightEnd].every(Number.isFinite)) return lines;
  if (!(leftStart < leftEnd && leftEnd < rightStart && rightStart < rightEnd)) return lines;

  const out = [];
  for (const line of lines) {
    const parts = Array.isArray(line.parts) ? [...line.parts].sort((a, b) => Number(a.xStartRatio || 0) - Number(b.xStartRatio || 0)) : [];
    let best = null;
    for (let index = 0; index + 1 < parts.length; index += 1) {
      const a = Number(parts[index].xEndRatio || 0);
      const b = Number(parts[index + 1].xStartRatio || 0);
      const gap = b - a;
      if (a < 0.38 || a > 0.58 || b < 0.42 || b > 0.64 || gap < 0.035) continue;
      const midpointDistance = Math.abs(((a + b) / 2) - 0.5);
      if (midpointDistance > 0.09) continue;
      if (!best || midpointDistance < best.midpointDistance - 0.005
          || (Math.abs(midpointDistance - best.midpointDistance) <= 0.005 && gap > best.gap)) {
        best = { index, gap, midpointDistance };
      }
    }
    if (!best) { out.push(line); continue; }
    const left = equationLineFragmentForColumns(line, parts.slice(0, best.index + 1), 0, leftStart, leftEnd);
    const right = equationLineFragmentForColumns(line, parts.slice(best.index + 1), 1, rightStart, rightEnd);
    if (left && right) out.push(left, right); else out.push(line);
  }
  return out;
}

function equationCandidateAlignedToLocalColumnRight(item) {
  if (!item?.equationTwoColumn || item.equationColumnIndex !== 0) return false;
  const start = Number(item?.candidateXStartRatio);
  const end = Number(item?.candidateXEndRatio);
  const columnStart = Number(item?.equationColumnStartRatio);
  const columnEnd = Number(item?.equationColumnEndRatio);
  if (![start, end, columnStart, columnEnd].every(Number.isFinite) || columnEnd <= columnStart) return false;
  const width = columnEnd - columnStart;
  const tolerance = Math.min(0.10, Math.max(0.055, width * 0.25));
  return start >= columnEnd - tolerance || end >= columnEnd - tolerance * 0.65;
}

function twoColumnEquationSupplementCandidates(lines, page) {
  const out = [];
  const referenceProse = /\b(?:equation|eq\.?|see|from|by|using|satisfies|implies|according\s+to|as\s+in|in\s+view\s+of|contradicts?|rewrit(?:e|ten)|follows?\s+from|inequality\s+(?:like|in)|as\s+required|cf\.?|recall|apply(?:ing)?|combin(?:e|ing)|substitut(?:e|ing)|insert|notice)\b/i;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line?.equationTwoColumn || line.equationColumnIndex !== 0) continue;
    const candidates = equationLabelCandidatesInLine(line.text);
    for (const candidate of candidates) {
      const parsed = parsedEquationNumber(candidate.label);
      if (!parsed || isLikelyCalendarYearEquationLabel(candidate.label)) continue;
      const tokenGeometry = equationCandidateTokenGeometry(line, candidate);
      const record = {
        label: candidate.label,
        page,
        ratio: line.ratio,
        text: line.text,
        xStartRatio: line.xStartRatio,
        xEndRatio: line.xEndRatio,
        candidateXStartRatio: tokenGeometry.xStartRatio,
        candidateXEndRatio: tokenGeometry.xEndRatio,
        numeric: parsed,
        explicitParenthesized: true,
        candidateAtLineStart: !String(line.text || '').slice(0, Math.max(0, Number(candidate.index) || 0)).trim(),
        candidateAtLineEnd: !String(line.text || '').slice(Math.max(0, Number(candidate.end) || 0)).trim(),
        standaloneTag: isStandaloneEquationTagLine(line, candidate.label),
        nearbyDisplayMath: hasNearbyDisplayMath(lines, lineIndex),
        mathSignals: equationLineMathSignalCount(line.text),
        equationTwoColumn: true,
        equationColumnIndex: 0,
        equationColumnStartRatio: line.equationColumnStartRatio,
        equationColumnEndRatio: line.equationColumnEndRatio,
      };
      if (!record.candidateAtLineEnd || !equationCandidateAlignedToLocalColumnRight(record)) continue;
      if (referenceProse.test(String(record.text || ''))) continue;
      if (!record.standaloneTag && !record.nearbyDisplayMath && record.mathSignals < 2) continue;
      if ((String(record.text || '').match(/[A-Za-z]{3,}/g) || []).length >= 8 && record.mathSignals < 2) continue;
      record.confidence = Math.max(12, equationTargetScore(record.text, record.label, null, 0, null, Number(record.ratio)) + 7);
      out.push(record);
    }
  }
  return out;
}

function supplementRightNumberedTwoColumnEquations(index, rawPageLines) {
  // Most modern AI/ML/CS/engineering proceedings number equations on the right
  // edge of each text column. The mature detector already sees the outer/right
  // column; this supplement only recovers the inner right edge of the left
  // column and never changes the document's established numbering side.
  if (equationNumberingSide !== 'right') return false;
  const all = [];
  const pageProfiles = new Map();
  for (const [page, rawLines] of rawPageLines.entries()) {
    const split = equationColumnAwareSupplementLines(rawLines);
    const leftProfile = split.find((line) => line?.equationTwoColumn && line.equationColumnIndex === 0);
    const rightProfile = split.find((line) => line?.equationTwoColumn && line.equationColumnIndex === 1);
    if (!leftProfile || !rightProfile) continue;
    pageProfiles.set(page, {
      leftStart: Number(leftProfile.equationColumnStartRatio),
      leftEnd: Number(leftProfile.equationColumnEndRatio),
      rightStart: Number(rightProfile.equationColumnStartRatio),
      rightEnd: Number(rightProfile.equationColumnEndRatio),
    });
    all.push(...twoColumnEquationSupplementCandidates(split, page));
  }
  const unique = [];
  const seen = new Set();
  for (const item of all) {
    const key = `${item.page}:${item.label}`;
    if (seen.has(key) || index.has(item.label)) continue;
    seen.add(key);
    unique.push(item);
  }
  if (unique.length < 2) return false;

  const trustedNumeric = [];
  for (const [label, candidates] of index.entries()) {
    const parsed = parsedEquationNumber(label);
    if (parsed && candidates?.length) trustedNumeric.push(parsed);
  }
  const compatible = unique.filter((item) => {
    if (!trustedNumeric.length) return true;
    const p = item.numeric;
    return trustedNumeric.some((q) => p.prefix === q.prefix || (!p.prefix && !q.prefix));
  });
  if (compatible.length < 2) return false;
  for (const item of compatible) index.set(item.label, [item]);

  // Tag already-trusted outer/right-column candidates with the same page
  // profile. This metadata is used only for initial display order; it does not
  // alter candidate confidence or acceptance. Without it, horizontally aligned
  // rows could render as 1,5,2,6 even though the document reads the left column
  // top-to-bottom before the right column.
  for (const candidates of index.values()) {
    for (const candidate of candidates || []) {
      const profile = pageProfiles.get(Number(candidate?.page));
      if (!profile) continue;
      const start = Number(candidate?.candidateXStartRatio ?? candidate?.xStartRatio);
      const end = Number(candidate?.candidateXEndRatio ?? candidate?.xEndRatio);
      if (![start, end, profile.rightStart].every(Number.isFinite)) continue;
      const tolerance = 0.035;
      if (end < profile.rightStart - tolerance) continue;
      candidate.equationTwoColumn = true;
      candidate.equationColumnIndex = 1;
      candidate.equationColumnStartRatio = profile.rightStart;
      candidate.equationColumnEndRatio = profile.rightEnd;
    }
  }
  return true;
}
function equationCandidateAlignedToNumberingSide(item, side = equationNumberingSide) {
  const start = Number(item?.candidateXStartRatio ?? item?.xStartRatio);
  const end = Number(item?.candidateXEndRatio ?? item?.xEndRatio);
  if (side === 'left') return (Number.isFinite(end) && end <= 0.34) || (Number.isFinite(start) && start <= 0.28);
  return (Number.isFinite(start) && start >= 0.62) || (Number.isFinite(end) && end >= 0.74);
}

function chooseCanonicalEquationCandidate(candidates) {
  const usable = (candidates || []).filter(Boolean);
  if (!usable.length) return null;
  return [...usable].sort((a, b) => {
    // Compare the equation-label token itself, not the whole line, and prefer
    // the document's inferred numbering margin. This handles both modern
    // right-numbered papers and older left-numbered papers.
    const aAligned = equationCandidateAlignedToNumberingSide(a);
    const bAligned = equationCandidateAlignedToNumberingSide(b);
    if (aAligned !== bAligned) return bAligned ? 1 : -1;
    const aEnd = Number(a.candidateXEndRatio ?? a.xEndRatio);
    const bEnd = Number(b.candidateXEndRatio ?? b.xEndRatio);
    const aStart = Number(a.candidateXStartRatio ?? a.xStartRatio);
    const bStart = Number(b.candidateXStartRatio ?? b.xStartRatio);
    if (equationNumberingSide === 'left') {
      const aGeom = Number.isFinite(aStart) ? aStart : (Number.isFinite(aEnd) ? aEnd : 2);
      const bGeom = Number.isFinite(bStart) ? bStart : (Number.isFinite(bEnd) ? bEnd : 2);
      if (Math.abs(aGeom - bGeom) > 0.02) return aGeom - bGeom;
    } else {
      const aGeom = Number.isFinite(aEnd) ? aEnd : (Number.isFinite(aStart) ? aStart : -1);
      const bGeom = Number.isFinite(bEnd) ? bEnd : (Number.isFinite(bStart) ? bStart : -1);
      if (Math.abs(aGeom - bGeom) > 0.02) return bGeom - aGeom;
    }
    const aPos = equationDocumentPosition(a);
    const bPos = equationDocumentPosition(b);
    if (Math.abs(aPos - bPos) > 1e-6) return aPos - bPos;
    return (Number(b.confidence) || 0) - (Number(a.confidence) || 0);
  })[0];
}

function canonicalizeEquationIndex(index) {
  const out = new Map();
  for (const [label, candidates] of index.entries()) {
    const canonical = chooseCanonicalEquationCandidate(candidates);
    if (canonical) out.set(label, [canonical]);
  }
  return out;
}

function recoverSequentialEquationGaps(index, candidatePool) {
  const best = [];
  for (const [label, candidates] of index.entries()) {
    const parsed = parsedEquationNumber(label);
    if (!parsed || !candidates?.length) continue;
    const candidate = chooseCanonicalEquationCandidate(candidates);
    if (!candidate) continue;
    best.push({ label, parsed, candidate });
  }
  best.sort((a, b) => equationDocumentPosition(a.candidate) - equationDocumentPosition(b.candidate));
  for (let i = 0; i + 1 < best.length; i += 1) {
    const left = best[i];
    const right = best[i + 1];
    if (left.parsed.prefix !== right.parsed.prefix) continue;
    const gap = right.parsed.last - left.parsed.last;
    if (gap < 2 || gap > 4) continue;
    const leftPos = equationDocumentPosition(left.candidate);
    const rightPos = equationDocumentPosition(right.candidate);
    for (let missing = left.parsed.last + 1; missing < right.parsed.last; missing += 1) {
      const separator = left.parsed.separator || '.';
      const expected = left.parsed.prefix ? `(${left.parsed.prefix}${separator}${missing})` : `(${missing})`;
      if (index.has(expected)) continue;
      const matches = (candidatePool.get(expected) || []).filter((item) => {
        const pos = equationDocumentPosition(item);
        return pos > leftPos && pos < rightPos;
      });
      if (!matches.length) continue;
      const ordinaryMatches = matches.filter((item) => !item?.recoveredMarginGapCandidate);
      const usableMatches = ordinaryMatches.length ? ordinaryMatches : matches;
      // The prose-like margin fallback is intentionally weaker than the normal
      // candidate pool. It may fill a gap only when the evidence is unique;
      // never choose arbitrarily between two low-confidence margin rows.
      if (!ordinaryMatches.length && usableMatches.length !== 1) continue;
      const canonicalMatch = chooseCanonicalEquationCandidate(usableMatches);
      if (!canonicalMatch) continue;
      const recovered = { ...canonicalMatch, confidence: Math.max(10, Number(canonicalMatch.confidence) || 0), recoveredBySequence: true };
      index.set(expected, [recovered]);
    }
  }
}

function equationLabelCandidatesInLine(text) {
  const source = String(text || '');
  const out = [];
  // Keep candidate offsets in the original PDF.js line. Whole-line NFKC
  // changes UTF-16 length for mathematical alphanumerics (for example 𝜌 -> ρ
  // or 𝑓 -> f), so an index measured after normalization can point into the
  // formula rather than the visible right-margin label. Normalize only the tag
  // payload; match offsets must stay in the string used by line.parts.
  const re = /[（(]\s*([^()（）]{1,32}?)\s*[)）]/g;
  let match;
  while ((match = re.exec(source))) {
    const rawInner = normalizeEquationTagCommands(String(match[1] || '').normalize('NFKC'));
    const numericInner = compactNumericEquationTagInner(rawInner);
    const symbolicInner = String(rawInner || '').replace(/\s+/g, '');
    // Keep one shared parenthesized-tag grammar for the Equation index: numeric
    // dotted/hyphen labels and the deliberately small symbolic tag alphabet.
    // Numeric extraction rejects digit-whitespace-digit so a broken text layer
    // cannot silently turn "2 2" into equation (22).
    const numeric = isPlausibleNumericEquationTagInner(numericInner);
    const symbolic = isSymbolicEquationTagInner(symbolicInner);
    if (!numeric && !symbolic) continue;
    const label = normalizedEquationLabel(`(${numeric ? numericInner : symbolicInner})`);
    if (numeric && isLikelyCalendarYearEquationLabel(label)) continue;
    out.push({ label, index: match.index, end: match.index + match[0].length });
  }

  // Digitized old journals occasionally expose a visibly parenthesized margin
  // tag with one corrupted closing glyph in the text layer, e.g. "(2.6J".
  // Normalize only the candidate itself; never normalize preceding formula text
  // when deriving geometry offsets.
  const damagedLeadingParen = source.match(/^\s*[（(]\s*([0-9０-９]+\s*(?:(?:[.．]\s*[0-9０-９]+)+|(?:[-－]\s*[0-9０-９]+)+))\s*[J\]\}](?=\s|$)/u);
  if (damagedLeadingParen) {
    const raw = damagedLeadingParen[0];
    const inner = String(damagedLeadingParen[1] || '').normalize('NFKC');
    const label = normalizedEquationLabel(inner);
    if (!isLikelyCalendarYearEquationLabel(label) && !out.some((item) => item.label === label)) {
      const index = source.indexOf(raw);
      out.push({ label, index: Math.max(0, index), end: Math.max(0, index) + raw.length, extractionRepaired: true });
    }
  }
  // Older journals often print a bare hierarchical number at the left margin
  // on the same visual line as the display formula, e.g. "1.2   <formula>" or
  // with extraction spacing such as "1 . 14   <formula>". Admit only a dotted
  // leading token here; geometry and mathematical context below still decide
  // whether it is a real equation target. This deliberately does not admit a
  // bare integer prefix, which would collide heavily with section numbering.
  const leadingBare = source.match(/^\s*([0-9０-９]+\s*(?:[.．]\s*[0-9０-９]+)+)(?=\s|$)/u);
  if (leadingBare) {
    const raw = leadingBare[1];
    const compact = raw.normalize('NFKC').replace(/\s+/g, '');
    const label = normalizedEquationLabel(compact);
    if (!isLikelyCalendarYearEquationLabel(label) && !out.some((item) => item.label === label)) {
      const index = source.indexOf(raw);
      out.push({ label, index: Math.max(0, index), end: Math.max(0, index) + raw.length, bare: true });
    }
  }

  // PDF.js sometimes drops the visible parentheses around a margin equation
  // number and exposes only a standalone token such as "13.30".
  // Record that narrow form as a candidate; geometry / neighboring display
  // math still decides whether it is reliable below.
  const trimmedSource = source.trim();
  const trimmed = trimmedSource.normalize('NFKC');
  const compactBare = /\s/.test(trimmed) ? '' : trimmed;
  if (isPlausibleNumericEquationTagInner(compactBare) && /[.\-]/.test(compactBare)) {
    const label = normalizedEquationLabel(compactBare);
    if (!isLikelyCalendarYearEquationLabel(label) && !out.some((item) => item.label === label)) {
      const index = source.indexOf(trimmedSource);
      out.push({ label, index: Math.max(0, index), end: Math.max(0, index) + trimmedSource.length, bare: true });
    }
  }
  return out;
}

function equationTargetScore(lineText, label, originPage, page, originRatio = null, candidateRatio = null) {
  const text = String(lineText || '').trim();
  const compact = text.replace(/\s+/g, '').normalize('NFKC');
  const pos = compact.lastIndexOf(label);
  let score = 0;
  if (pos >= 0 && pos + label.length >= compact.length - 1) score += 12;
  if (compact === label) score += 10;
  score += Math.min(10, (text.match(/[=≤≥≠≈∫∑∏√∂∇∞^_+−-]/g) || []).length * 1.5);
  if (/^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|proof|section)\b/i.test(text)) score -= 20;
  if (/\b(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|section)\s+\d/i.test(text)) score -= 10;
  // Parenthesized equation numbers inside prose are references, not targets.
  // Prefer display-math/right-margin style lines and strongly demote prose
  // phrases that merely cite an equation.
  if (/\b(?:equation|eq\.?|see|from|by|using|satisfies|implies|according\s+to|as\s+in|in\s+view\s+of|contradicts?|rewrit(?:e|ten)|follows?\s+from|inequality\s+(?:like|in)|as\s+required)\b/i.test(text)) score -= 18;
  if (page === originPage) score += 0.5;
  if (page === originPage && Number.isFinite(originRatio) && Number.isFinite(candidateRatio)) {
    const delta = Math.abs(candidateRatio - originRatio);
    if (delta < 0.018) score -= 1000;
    else if (delta < 0.05) score -= 12;
  }
  score -= Math.min(4, text.length / 160);
  return score;
}

function equationCandidateConfidence(line, label) {
  const text = String(line?.text || '').trim();
  if (!text || isLikelyCalendarYearEquationLabel(label)) return -Infinity;
  const compact = text.replace(/\s+/g, '').normalize('NFKC');
  const normalized = normalizedEquationLabel(label);
  const isOnlyTag = compact === normalized || compact === normalized.slice(1, -1);
  const mathSignals = (text.match(/[=≤≥≠≈≡∈∉⊂⊆⊇→↔∫∑∏√∂∇∞^_+−×·/\-]/g) || []).length;
  const xStart = Number(line?.xStartRatio);
  const xEnd = Number(line?.xEndRatio);
  const nearRight = (Number.isFinite(xStart) && xStart >= 0.62) || (Number.isFinite(xEnd) && xEnd >= 0.78);
  const nearBottom = Number(line?.ratio) >= 0.90;
  const proseHeavy = text.length > 55 && mathSignals === 0;
  const isolatedRightTag = isOnlyTag && Number.isFinite(xStart) && xStart >= 0.62;
  if (isOnlyTag && nearBottom && !isolatedRightTag) return -Infinity;
  // A numeric parenthesis embedded in prose is a reference/date/section-like
  // token, not an equation target. Pure tag lines are accepted only when the
  // glyph geometry places them at the display-math right margin.
  if (mathSignals === 0 && !isolatedRightTag) return -Infinity;
  if (proseHeavy && !isolatedRightTag) return -Infinity;
  let confidence = equationTargetScore(text, normalized, null, 0, null, Number(line?.ratio));
  if (mathSignals >= 2) confidence += 5;
  else if (mathSignals === 1) confidence += 2;
  if (nearRight) confidence += 6;
  if (isOnlyTag && nearRight) confidence += 5;
  if (Number.isFinite(xStart) && xStart < 0.18 && mathSignals === 0) confidence -= 6;
  return confidence;
}

function isReliableEquationTargetLine(line, label) {
  return equationCandidateConfidence(line, label) >= 8;
}

function equationLineMathSignalCount(text) {
  return (String(text || '').match(/[=≤≥≠≈≡∈∉⊂⊆⊇→↔∫∑∏√∂∇∞^_+−×·/\-]/g) || []).length;
}

function hasNearbyDisplayMath(lines, lineIndex) {
  const line = lines[lineIndex];
  if (!line) return false;
  const ratio = Number(line.ratio);
  for (const neighborIndex of [lineIndex - 1, lineIndex + 1]) {
    const neighbor = lines[neighborIndex];
    if (!neighbor) continue;
    const neighborRatio = Number(neighbor.ratio);
    if (Number.isFinite(ratio) && Number.isFinite(neighborRatio) && Math.abs(neighborRatio - ratio) > 0.045) continue;
    if (equationLineMathSignalCount(neighbor.text) >= 2) return true;
  }
  return false;
}

function bareEquationHasNearbyHeadingContext(lines, lineIndex) {
  const line = lines[lineIndex];
  if (!line) return false;
  const ratio = Number(line.ratio);
  for (const neighborIndex of [lineIndex - 2, lineIndex - 1, lineIndex + 1, lineIndex + 2]) {
    const neighbor = lines[neighborIndex];
    if (!neighbor) continue;
    const neighborRatio = Number(neighbor.ratio);
    if (Number.isFinite(ratio) && Number.isFinite(neighborRatio) && Math.abs(neighborRatio - ratio) > 0.014) continue;
    const text = String(neighbor.text || '').trim();
    if (!text || equationLineMathSignalCount(text) >= 2 || /[.!?。！？]$/.test(text)) continue;
    const asciiWords = text.match(/\b[A-Za-z]{3,}\b/g) || [];
    const titleCaseWords = text.match(/\b[A-Z][A-Za-z]{2,}\b/g) || [];
    const hanChars = text.match(/\p{Script=Han}/gu) || [];
    if (hanChars.length >= 3) return true;
    if (/^[A-Z]/.test(text) && asciiWords.length >= 2 && titleCaseWords.length >= 1) return true;
  }
  return false;
}

function isStandaloneEquationTagLine(line, label) {
  const text = String(line?.text || '').trim().replace(/\s+/g, '').normalize('NFKC');
  const normalized = normalizedEquationLabel(label);
  return text === normalized || text === normalized.slice(1, -1);
}

function bareEquationInHorizontalNumericCluster(lines, lineIndex) {
  const line = lines[lineIndex];
  if (!line) return false;
  const text = String(line.text || '').trim().replace(/\s+/g, '');
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text)) return false;
  const ratio = Number(line.ratio);
  const centers = [];
  for (const other of lines) {
    const otherRatio = Number(other?.ratio);
    if (Number.isFinite(ratio) && Number.isFinite(otherRatio) && Math.abs(otherRatio - ratio) > 0.0045) continue;
    const otherText = String(other?.text || '').trim().replace(/\s+/g, '');
    if (!/^[+-]?\d+(?:\.\d+)?$/.test(otherText)) continue;
    const start = Number(other?.xStartRatio); const end = Number(other?.xEndRatio);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    centers.push((start + end) / 2);
  }
  if (centers.length < 3) return false;
  return Math.max(...centers) - Math.min(...centers) >= 0.16;
}

function equationCandidateTokenGeometry(line, candidate) {
  const start = Number(candidate?.index || 0);
  const end = Number(candidate?.end || start);
  const overlaps = (line?.parts || []).filter((part) => Number(part.end) > start && Number(part.start) < end);
  if (overlaps.length) {
    const first = overlaps[0];
    const last = overlaps[overlaps.length - 1];
    const startSpan = Math.max(1, Number(first.end) - Number(first.start));
    const endSpan = Math.max(1, Number(last.end) - Number(last.start));
    const startFraction = Math.min(1, Math.max(0, (start - Number(first.start)) / startSpan));
    const endFraction = Math.min(1, Math.max(0, (end - Number(last.start)) / endSpan));
    const xStart = Number(first.xStartRatio) + (Number(first.xEndRatio) - Number(first.xStartRatio)) * startFraction;
    const xEnd = Number(last.xStartRatio) + (Number(last.xEndRatio) - Number(last.xStartRatio)) * endFraction;
    return { xStartRatio: xStart, xEndRatio: xEnd };
  }
  const lineText = String(line?.text || '');
  const lineSpan = Math.max(0, Number(line?.xEndRatio) - Number(line?.xStartRatio));
  const textLength = Math.max(1, lineText.length);
  const startFraction = Math.min(1, Math.max(0, start / textLength));
  const endFraction = Math.min(1, Math.max(startFraction, end / textLength));
  return {
    xStartRatio: Number(line?.xStartRatio) + lineSpan * startFraction,
    xEndRatio: Number(line?.xStartRatio) + lineSpan * endFraction
  };
}

function inferEquationNumberingSide(records) {
  let leftScore = 0;
  let rightScore = 0;
  for (const item of records || []) {
    const start = Number(item.candidateXStartRatio);
    const end = Number(item.candidateXEndRatio);
    const contextStrong = Boolean(item.standaloneTag || item.nearbyDisplayMath || item.mathSignals >= 2);
    if (!contextStrong) continue;
    if (item.ocrSource && !item.standaloneTag && !item.candidateAtLineStart && !item.candidateAtLineEnd) continue;
    const weight = item.numeric && item.numeric.prefix ? 2 : 1.5;
    if ((Number.isFinite(end) && end <= 0.34) || (Number.isFinite(start) && start <= 0.28)) leftScore += weight;
    if ((Number.isFinite(start) && start >= 0.62) || (Number.isFinite(end) && end >= 0.74)) rightScore += weight;
  }
  if (leftScore >= 4 && leftScore > rightScore * 1.35) return 'left';
  return 'right';
}

function equationCandidateConfidenceForSide(item) {
  const text = String(item?.text || '').trim();
  const label = normalizedEquationLabel(item?.label || '');
  if (!text || !label || isLikelyCalendarYearEquationLabel(label)) return -Infinity;
  const compact = text.replace(/\s+/g, '').normalize('NFKC');
  const isOnlyTag = compact === label || compact === label.slice(1, -1);
  const mathSignals = Number(item.mathSignals) || 0;
  const aligned = equationCandidateAlignedToNumberingSide(item);
  const nearBottom = Number(item.ratio) >= 0.90;
  const proseHeavy = text.length > 55 && mathSignals === 0;
  const explicitMarginTag = Boolean(item?.explicitParenthesized && aligned);
  const referenceProse = /\b(?:equation|eq\.?|see|from|by|using|satisfies|implies|according\s+to|as\s+in|in\s+view\s+of|contradicts?|rewrit(?:e|ten)|follows?\s+from|inequality\s+(?:like|in)|as\s+required)\b/i.test(text);
  const bibliographyLike = /\b(?:Ann\.?|Journal|Math\.?|Proc\.?|Trans\.?|Springer|Press)\b/i.test(text);
  const bareHeadingLike = Boolean(item?.bareSource) && /^\s*\d+(?:\.\d+)+\s+[A-Za-z][A-Za-z]/.test(text);
  const bareRemainder = Boolean(item?.bareSource)
    ? text.replace(/^\s*\d+(?:\.\d+)+\s*/, '')
    : '';
  const bareWords = bareRemainder.match(/\b[A-Za-z]{3,}\b/g) || [];
  const bareHanChars = bareRemainder.match(/\p{Script=Han}/gu) || [];
  const bareStructuredProse = Boolean(item?.bareSource) && (
    /^(?:\([ivxlcdm]+\)\s*)?(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|exercise|problem|suppose|let|if|give|prove|show|using)\b/i.test(bareRemainder) ||
    bareWords.length >= 3 ||
    bareHanChars.length >= 4
  );
  const parsed = parsedEquationNumber(label);
  const integerTag = Boolean(parsed && !parsed.prefix);
  const alphaWords = text.match(/[A-Za-z]{2,}|\p{Script=Han}{2,}/gu) || [];
  const codeLike = (/(?:=>|;\s*$|\b(?:if|else|while|return|var|new|class|public|private|static|int|string)\b)/i.test(text)
    || (/\bfor\b/i.test(text) && /[{};]/.test(text)))
    && (text.match(/[(){}\[\]]/g) || []).length >= 4;
  const onNumberingEdge = equationNumberingSide === 'left' ? Boolean(item?.candidateAtLineStart) : Boolean(item?.candidateAtLineEnd);
  const strongMarginGeometry = equationNumberingSide === 'left'
    ? Number(item?.candidateXEndRatio) <= 0.22
    : Number(item?.candidateXStartRatio) >= 0.75;
  const parenthesizedNumericCount = (text.match(/\(\s*\d+(?:(?:\.\d+)+|(?:-\d+)+)?\s*\)/g) || []).length;
  const leadingIntegerRemainder = integerTag && item?.explicitParenthesized && item?.candidateAtLineStart
    ? text.replace(/^\s*\(\s*\d+\s*\)\s*/, '')
    : '';
  const leadingIntegerWords = leadingIntegerRemainder.match(/\b[A-Za-z]{3,}\b/g) || [];
  const leadingIntegerHanChars = leadingIntegerRemainder.match(/\p{Script=Han}/gu) || [];
  if (integerTag && item?.explicitParenthesized && item?.candidateAtLineStart && !item?.candidateAtLineEnd
    && (leadingIntegerWords.length >= 4 || leadingIntegerHanChars.length >= 6)) return -Infinity;
  if (integerTag && item?.explicitParenthesized && !item?.standaloneTag && !onNumberingEdge && !strongMarginGeometry && !item?.nearbyDisplayMath) return -Infinity;
  if (parenthesizedNumericCount >= 2 && !item?.standaloneTag && !onNumberingEdge) return -Infinity;
  if (item?.ocrSource && item?.explicitParenthesized && !item?.standaloneTag && !onNumberingEdge) return -Infinity;
  if (parsed && item?.explicitParenthesized && !item?.standaloneTag && !onNumberingEdge && !item?.nearbyDisplayMath && mathSignals < 2) return -Infinity;
  if (integerTag && item?.ocrSource && !item?.standaloneTag && !onNumberingEdge) return -Infinity;
  if (integerTag && !item?.standaloneTag && codeLike) return -Infinity;
  if (integerTag && !item?.standaloneTag && mathSignals === 0 && alphaWords.length >= 2) return -Infinity;
  if (integerTag && !item?.standaloneTag && item?.candidateAtLineStart && mathSignals < 2 && !item?.nearbyDisplayMath && alphaWords.length >= 2) return -Infinity;
  if (isOnlyTag && nearBottom && !aligned) return -Infinity;
  // A visible parenthesized tag already placed on the inferred equation-number
  // margin is strong target evidence by itself. Older/scanned PDF text layers
  // often lose the formula operators, so requiring extracted math glyphs here
  // made the Equation index disagree with MathReader's clickable label layer.
  if (mathSignals === 0 && !(isOnlyTag && aligned) && !explicitMarginTag) return -Infinity;
  if (proseHeavy && !(isOnlyTag && aligned) && !explicitMarginTag) return -Infinity;
  if (referenceProse && !isOnlyTag && mathSignals < 2) return -Infinity;
  if (bibliographyLike && mathSignals < 2) return -Infinity;
  if (bareStructuredProse) return -Infinity;
  if (bareHeadingLike && mathSignals < 2) return -Infinity;
  let confidence = equationTargetScore(text, label, null, 0, null, Number(item.ratio));
  if (mathSignals >= 2) confidence += 5;
  else if (mathSignals === 1) confidence += 2;
  if (aligned) confidence += 7;
  if (isOnlyTag && aligned) confidence += 5;
  if (explicitMarginTag) confidence += 6;
  return confidence;
}

function reconcileEquationNumberingFamilies(index) {
  const numericEntries = [];
  let hierarchical = 0;
  let integers = 0;
  let ocrHierarchical = 0;
  let ocrIntegers = 0;
  for (const label of index.keys()) {
    const parsed = parsedEquationNumber(label);
    if (!parsed) continue;
    const candidates = index.get(label) || [];
    const ocrSourced = candidates.some((item) => Boolean(item?.ocrSource));
    numericEntries.push({ label, parsed, ocrSourced });
    if (parsed.prefix) {
      hierarchical += 1;
      if (ocrSourced) ocrHierarchical += 1;
    } else {
      integers += 1;
      if (ocrSourced) ocrIntegers += 1;
    }
  }
  const numericTotal = hierarchical + integers;
  // OCR frequently drops the separator in labels such as (1.3) -> (13). If an
  // OCR document already contains a substantial, clearly dominant hierarchical
  // family, isolated pure-integer OCR labels are more safely treated as damaged
  // tags than as a second numbering system. Integer-only OCR documents are not
  // affected because they have no hierarchical family at all.
  if (ocrHierarchical >= 8 && ocrHierarchical >= Math.max(8, Math.ceil(ocrIntegers * 1.5))) {
    for (const { label, parsed, ocrSourced } of numericEntries) if (!parsed.prefix && ocrSourced) index.delete(label);
    integers = [...index.keys()].filter((label) => {
      const parsed = parsedEquationNumber(label);
      return parsed && !parsed.prefix;
    }).length;
  }
  // A long, overwhelmingly hierarchical sequence is a document-level numbering
  // profile. In that profile, a handful of isolated integer tags are usually
  // page numbers / damaged text-layer artifacts rather than a second equation
  // numbering system. Integer-only and genuinely mixed documents stay intact.
  if (hierarchical < 10 || numericTotal < 12 || hierarchical / numericTotal < 0.88 || integers > Math.max(12, Math.ceil(hierarchical * 0.08))) return index;
  for (const { label, parsed } of numericEntries) if (!parsed.prefix) index.delete(label);
  return index;
}

function reconcileOcrEquationSequenceOrder(index) {
  const byPrefix = new Map();
  for (const [label, candidates] of index.entries()) {
    const parsed = parsedEquationNumber(label);
    if (!parsed?.prefix || !(candidates || []).some((item) => Boolean(item?.ocrSource))) continue;
    const candidate = chooseCanonicalEquationCandidate(candidates);
    if (!candidate) continue;
    const list = byPrefix.get(parsed.prefix) || [];
    list.push({ label, parsed, candidate });
    byPrefix.set(parsed.prefix, list);
  }
  for (const entries of byPrefix.values()) {
    if (entries.length < 4) continue;
    entries.sort((a, b) => equationDocumentPosition(a.candidate) - equationDocumentPosition(b.candidate));
    let last = -1;
    for (const entry of entries) {
      if (last >= 0 && entry.parsed.last < last) {
        index.delete(entry.label);
        continue;
      }
      last = Math.max(last, entry.parsed.last);
    }
  }
  return index;
}


function equationIndexHasSuspiciousLeadingGap(index) {
  const byPrefix = new Map();
  for (const label of index.keys()) {
    const parsed = parsedEquationNumber(label);
    if (!parsed?.prefix || !Number.isInteger(parsed.last) || parsed.last < 1) continue;
    const values = byPrefix.get(parsed.prefix) || [];
    values.push(parsed.last);
    byPrefix.set(parsed.prefix, values);
  }
  for (const values of byPrefix.values()) {
    const unique = [...new Set(values)].sort((a, b) => a - b);
    if (unique.length < 2) continue;
    const first = unique[0];
    // A family that first appears very late but contains only a few consecutive
    // labels is a strong sign of an incomplete hidden OCR layer. Do not infer
    // any missing labels here; this predicate only decides whether a scan-image
    // margin should be consulted as a second source of evidence.
    if (first >= 5 && first > unique.length + 3) return true;
  }
  return false;
}

async function equationPageContainsRasterImage(sourceDoc, pageNum) {
  try {
    const page = await sourceDoc.getPage(pageNum);
    const opList = await page.getOperatorList();
    const ops = pdfjsLib?.OPS || {};
    const imageOps = new Set([
      ops.paintImageMaskXObject,
      ops.paintImageMaskXObjectGroup,
      ops.paintImageXObject,
      ops.paintInlineImageXObject,
      ops.paintInlineImageXObjectGroup,
      ops.paintImageXObjectRepeat,
    ].filter(Number.isFinite));
    return imageOps.size > 0 && (opList?.fnArray || []).some((fn) => imageOps.has(fn));
  } catch (_) {
    return false;
  }
}

async function equationDocumentLooksImageBacked(sourceDoc, index) {
  if (!sourceDoc?.numPages || documentTextMode !== 'native' || documentOcrActive) return false;
  const anchorPages = [];
  for (const candidates of index.values()) {
    const candidate = chooseCanonicalEquationCandidate(candidates);
    const page = Number(candidate?.page);
    if (Number.isInteger(page) && page >= 1 && page <= sourceDoc.numPages) anchorPages.push(page);
  }
  if (!anchorPages.length) return false;
  anchorPages.sort((a, b) => a - b);
  const anchor = anchorPages[Math.floor(anchorPages.length / 2)];
  const sample = [...new Set([anchor - 1, anchor, anchor + 1]
    .map((page) => Math.min(sourceDoc.numPages, Math.max(1, page))))];
  if (sample.length < 2) return false;
  let imagePages = 0;
  for (const pageNum of sample) if (await equationPageContainsRasterImage(sourceDoc, pageNum)) imagePages += 1;
  // Requiring every adjacent sample page to contain raster content keeps this
  // path away from ordinary born-digital papers that merely contain a figure.
  return imagePages === sample.length;
}

function equationSupplementalOcrPagePlan(sourceDoc, index) {
  const pageCount = Math.max(0, Number(sourceDoc?.numPages) || 0);
  if (!pageCount) return [];
  if (pageCount <= 60) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const anchors = [];
  for (const candidates of index.values()) {
    const candidate = chooseCanonicalEquationCandidate(candidates);
    const page = Number(candidate?.page);
    if (Number.isInteger(page) && page >= 1 && page <= pageCount) anchors.push(page);
  }
  const pages = new Set();
  for (const anchor of anchors) {
    for (let delta = -12; delta <= 12; delta += 1) {
      const page = anchor + delta;
      if (page >= 1 && page <= pageCount) pages.add(page);
    }
  }
  // Keep automatic image assistance bounded on long scanned books. Full
  // document OCR remains the explicit path when a much larger scan needs it.
  return [...pages].sort((a, b) => a - b).slice(0, 48);
}

function remapEquationMarginOcrLine(line, side, marginFraction) {
  const fraction = Math.min(0.48, Math.max(0.28, Number(marginFraction) || 0.38));
  const offset = side === 'right' ? 1 - fraction : 0;
  const mapX = (value) => Math.min(1, Math.max(0, offset + (Number(value) || 0) * fraction));
  return {
    ...line,
    ocrSource: true,
    supplementalEquationOcr: true,
    xStartRatio: mapX(line.xStartRatio),
    xEndRatio: mapX(line.xEndRatio),
    parts: (line.parts || []).map((part) => ({
      ...part,
      xStartRatio: mapX(part.xStartRatio),
      xEndRatio: mapX(part.xEndRatio),
    })),
  };
}

async function equationMarginOcrLines(sourceDoc, pageNum, side, worker) {
  const page = await sourceDoc.getPage(pageNum);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.max(2.4, Math.min(3.6, 3200 / Math.max(1, base.width, base.height)));
  const viewport = page.getViewport({ scale });
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = Math.max(1, Math.ceil(viewport.width));
  fullCanvas.height = Math.max(1, Math.ceil(viewport.height));
  const fullContext = fullCanvas.getContext('2d', { alpha: false });
  fullContext.fillStyle = '#fff';
  fullContext.fillRect(0, 0, fullCanvas.width, fullCanvas.height);
  await page.render({ canvasContext: fullContext, viewport }).promise;

  const marginFraction = 0.38;
  const cropWidth = Math.max(1, Math.ceil(fullCanvas.width * marginFraction));
  const cropX = side === 'right' ? Math.max(0, fullCanvas.width - cropWidth) : 0;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropWidth;
  cropCanvas.height = fullCanvas.height;
  const cropContext = cropCanvas.getContext('2d', { alpha: false });
  cropContext.fillStyle = '#fff';
  cropContext.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
  cropContext.drawImage(fullCanvas, cropX, 0, cropWidth, fullCanvas.height, 0, 0, cropWidth, fullCanvas.height);

  let result;
  try {
    result = await worker.recognize(cropCanvas, {}, { hocr: true });
  } finally {
    fullCanvas.width = 1;
    fullCanvas.height = 1;
    cropCanvas.width = 1;
    cropCanvas.height = 1;
  }
  const record = pageRecordFromHocr(result?.data?.hocr || '', result?.data?.text || '', cropWidth, Math.max(1, Math.ceil(viewport.height)), pageNum);
  return (record.lines || []).map((line) => remapEquationMarginOcrLine(line, side, marginFraction));
}

function equationSupplementalRecord(line, page, lineIndex, lines, candidate) {
  const numeric = parsedEquationNumber(candidate.label);
  if (!numeric?.prefix) return null;
  const tokenGeometry = equationCandidateTokenGeometry(line, candidate);
  const atStart = !String(line.text || '').slice(0, Math.max(0, Number(candidate.index) || 0)).trim();
  const atEnd = !String(line.text || '').slice(Math.max(0, Number(candidate.end) || 0)).trim();
  const standaloneTag = isStandaloneEquationTagLine(line, candidate.label);
  if (!standaloneTag && equationNumberingSide === 'left' && !atStart) return null;
  if (!standaloneTag && equationNumberingSide === 'right' && !atEnd) return null;
  const record = {
    label: candidate.label,
    page,
    ratio: line.ratio,
    text: line.text,
    xStartRatio: line.xStartRatio,
    xEndRatio: line.xEndRatio,
    candidateXStartRatio: tokenGeometry.xStartRatio,
    candidateXEndRatio: tokenGeometry.xEndRatio,
    numeric,
    bareSource: Boolean(candidate.bare),
    sequenceOnly: false,
    explicitParenthesized: !candidate.bare,
    candidateAtLineStart: atStart,
    candidateAtLineEnd: atEnd,
    standaloneTag,
    nearbyDisplayMath: hasNearbyDisplayMath(lines, lineIndex),
    nearbyHeadingContext: Boolean(candidate.bare) && bareEquationHasNearbyHeadingContext(lines, lineIndex),
    axisNumericCluster: false,
    mathSignals: equationLineMathSignalCount(line.text),
    ocrSource: true,
    supplementalEquationOcr: true,
  };
  let confidence = equationCandidateConfidenceForSide(record);
  if (record.axisNumericCluster) confidence = -Infinity;
  if (!Number.isFinite(confidence) || confidence < 8) {
    if (!(standaloneTag && equationCandidateAlignedToNumberingSide(record))) return null;
    confidence = 12;
  }
  record.confidence = Math.max(12, confidence);
  return record;
}

function denseSupplementalEquationFamilies(records) {
  const byPrefix = new Map();
  for (const record of records || []) {
    const parsed = record?.numeric || parsedEquationNumber(record?.label);
    if (!parsed?.prefix) continue;
    const list = byPrefix.get(parsed.prefix) || [];
    list.push(record);
    byPrefix.set(parsed.prefix, list);
  }
  const accepted = [];
  for (const recordsForPrefix of byPrefix.values()) {
    const byLabel = new Map();
    for (const record of recordsForPrefix) {
      const list = byLabel.get(record.label) || [];
      list.push(record);
      byLabel.set(record.label, list);
    }
    const canonical = [...byLabel.entries()].map(([label, candidates]) => ({
      label,
      parsed: parsedEquationNumber(label),
      candidate: chooseCanonicalEquationCandidate(candidates),
    })).filter((item) => item.parsed && item.candidate);
    canonical.sort((a, b) => equationDocumentPosition(a.candidate) - equationDocumentPosition(b.candidate));
    const monotone = [];
    let last = -1;
    for (const item of canonical) {
      if (item.parsed.last < last) continue;
      if (item.parsed.last === last) continue;
      last = item.parsed.last;
      monotone.push(item);
    }
    if (monotone.length < 3) continue;
    const numbers = monotone.map((item) => item.parsed.last);
    const span = Math.max(...numbers) - Math.min(...numbers) + 1;
    // Image-derived labels are allowed to fill a small number of OCR holes, but
    // a sparse collection of isolated numbers is not enough to define a family.
    if (span > monotone.length + 2) continue;
    accepted.push(...monotone.map((item) => item.candidate));
  }
  return accepted;
}

async function supplementEquationIndexFromPageImages(sourceDoc, sourceKey, index) {
  if (!equationIndexHasSuspiciousLeadingGap(index)) return false;
  if (!await equationDocumentLooksImageBacked(sourceDoc, index)) return false;
  const pages = equationSupplementalOcrPagePlan(sourceDoc, index);
  if (!pages.length || documentOcrBusy) return false;

  let worker = null;
  try {
    const module = await loadDocumentOcrModule();
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return false;
    const createWorker = documentOcrCreateWorker(module);
    if (typeof createWorker !== 'function') return false;
    worker = await createWorker('eng', 1, { logger: () => {} });
    if (typeof worker.setParameters === 'function') {
      try {
        await worker.setParameters({
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          tessedit_pageseg_mode: '11',
        });
      } catch (_) {}
    }

    const records = [];
    for (const pageNum of pages) {
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return false;
      const lines = await equationMarginOcrLines(sourceDoc, pageNum, equationNumberingSide, worker);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        for (const candidate of equationLabelCandidatesInLine(line.text)) {
          const record = equationSupplementalRecord(line, pageNum, lineIndex, lines, candidate);
          if (record) records.push(record);
        }
      }
      await nextFrame();
    }

    let added = false;
    for (const record of denseSupplementalEquationFamilies(records)) {
      if (index.has(record.label)) continue;
      index.set(record.label, [record]);
      added = true;
    }
    return added;
  } catch (error) {
    // Image assistance is deliberately optional. A network/model failure must
    // never make a native-text Equation index unavailable.
    console.warn('MathReader equation image-assistance was unavailable.', error);
    return false;
  } finally {
    try { await worker?.terminate?.(); } catch (_) {}
  }
}

async function buildEquationLabelIndex() {
  if (!pdfDoc || !documentTextFeaturesAvailable()) return new Map();
  if (equationLabelIndex) return equationLabelIndex;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const index = new Map();
  const candidatePool = new Map();
  const rawCandidates = [];
  const rawPageLines = new Map();
  const dottedSectionHeadingEvidence = [];
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    const lines = await pageTextLines(page, sourceDoc);
    rawPageLines.set(page, lines);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const rawLineText = String(line.text || '').normalize('NFKC');
      const sectionHeadingMatch = rawLineText.trim().match(/^(\d+(?:\.\d+){1,4})\s+(.{2,120})$/);
      if (sectionHeadingMatch) {
        const sectionTitle = String(sectionHeadingMatch[2] || '').trim();
        const sectionWords = sectionTitle.match(/\b[A-Za-z]{3,}\b/g) || [];
        const sectionHan = sectionTitle.match(/\p{Script=Han}/gu) || [];
        if (equationLineMathSignalCount(sectionTitle) <= 1 && (sectionWords.length >= 2 || sectionHan.length >= 3)) {
          dottedSectionHeadingEvidence.push({ page, label: normalizedEquationLabel(sectionHeadingMatch[1]) });
        }
      }
      const explicit = equationLabelCandidatesInLine(line.text);
      const weakBare = [];
      const rawText = String(line.text || '').normalize('NFKC');
      // OCR can drop parentheses around hierarchical equation tags. Keep both
      // dotted and hyphenated bare forms sequence-only so they can fill a local
      // numbering gap, but never enter the index directly.
      const bareRe = line.ocrSource
        ? /\b\d+(?:(?:\.\d+)+|(?:-\d+)+)\b/g
        : /\b\d+(?:\.\d+)+\b/g;
      let bareMatch;
      while ((bareMatch = bareRe.exec(rawText))) {
        const label = normalizedEquationLabel(bareMatch[0]);
        if (isLikelyCalendarYearEquationLabel(label) || explicit.some((item) => item.label === label)) continue;
        weakBare.push({ label, index: bareMatch.index, end: bareMatch.index + bareMatch[0].length, bare: true, sequenceOnly: true });
      }
      for (const candidate of [...explicit, ...weakBare]) {
        const tokenGeometry = equationCandidateTokenGeometry(line, candidate);
        const numeric = parsedEquationNumber(candidate.label);
        // OCR of old books can turn a running section header such as
        // "6.2  <title>  · 239 ·" into a bare dotted equation candidate.  A
        // genuine display tag may occur near the top of a page, but it should
        // not also look like a short running header with a trailing page number.
        // Keep this rejection OCR-only and top-band-only so born-digital and
        // ordinary display equations retain the mature detector behavior.
        const ocrTopRunningHeader = Boolean(
          line.ocrSource
          && candidate.bare
          && (Number(candidate.index) || 0) <= 4
          && Number(line.ratio) <= 0.075
          && /^\s*\d{1,3}\s*(?:[.．]\s*\d{1,3}){1,3}\s+\S/u.test(rawLineText)
          && /[A-Za-z\u00C0-\u024F]{2,}/u.test(rawLineText)
          && /\b\d{1,4}\b\s*[-+·•.]?\s*$/u.test(rawLineText)
          && rawLineText.length <= 90
        );
        rawCandidates.push({
          label: candidate.label,
          page,
          ratio: line.ratio,
          text: line.text,
          xStartRatio: line.xStartRatio,
          xEndRatio: line.xEndRatio,
          candidateXStartRatio: tokenGeometry.xStartRatio,
          candidateXEndRatio: tokenGeometry.xEndRatio,
          numeric,
          bareSource: Boolean(candidate.bare),
          sequenceOnly: Boolean(candidate.sequenceOnly),
          explicitParenthesized: !candidate.bare && !candidate.sequenceOnly,
          candidateAtLineStart: !String(line.text || '').slice(0, Math.max(0, Number(candidate.index) || 0)).trim(),
          candidateAtLineEnd: !String(line.text || '').slice(Math.max(0, Number(candidate.end) || 0)).trim(),
          standaloneTag: isStandaloneEquationTagLine(line, candidate.label),
          nearbyDisplayMath: hasNearbyDisplayMath(lines, lineIndex),
          nearbyHeadingContext: Boolean(candidate.bare) && bareEquationHasNearbyHeadingContext(lines, lineIndex),
          axisNumericCluster: Boolean(candidate.bare) && bareEquationInHorizontalNumericCluster(lines, lineIndex),
          mathSignals: equationLineMathSignalCount(line.text),
          ocrSource: Boolean(line.ocrSource),
          ocrTopRunningHeader,
        });
      }
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const dottedSectionHeadingPages = new Set(dottedSectionHeadingEvidence.map((item) => item.page));
  const dottedSectionHeadingLabels = new Set(dottedSectionHeadingEvidence.map((item) => item.label));
  const dottedSectionNumberingProfile = dottedSectionHeadingEvidence.length >= 6 && dottedSectionHeadingPages.size >= 3;

  equationNumberingSide = inferEquationNumberingSide(rawCandidates);

  for (const record0 of rawCandidates) {
    const record = { ...record0 };
    let confidence = equationCandidateConfidenceForSide(record);
    if (record.axisNumericCluster || record.ocrTopRunningHeader) confidence = -Infinity;
    if (dottedSectionNumberingProfile && record.bareSource && record.numeric?.prefix) {
      const strongOuterMargin = equationNumberingSide === 'left'
        ? Number(record.candidateXEndRatio) <= (record.ocrSource ? 0.24 : 0.13)
        : Number(record.candidateXStartRatio) >= (record.ocrSource ? 0.76 : 0.87);
      const bareRemainder = String(record.text || '').replace(/^\s*\d+(?:\s*\.\s*\d+)+\s*/, '').trim();
      const sameLineWords = bareRemainder.match(/\b[A-Za-z]{3,}\b/g) || [];
      const sameLineHan = bareRemainder.match(/\p{Script=Han}/gu) || [];
      const sameLineMathSignals = Number(record.mathSignals) || 0;
      const sameLineSectionContext = Boolean(bareRemainder) && (
        (sameLineMathSignals === 0 && (sameLineWords.length >= 2 || sameLineHan.length >= 2)) ||
        (sameLineMathSignals === 1 && sameLineHan.length >= 1 && (/^[-–—]?[A-Za-z]{2,}/.test(bareRemainder) || sameLineHan.length >= 2))
      );
      const sectionLikeBare = sameLineSectionContext
        || Boolean(record.nearbyHeadingContext)
        || (!strongOuterMargin && !record.nearbyDisplayMath && (Number(record.mathSignals) || 0) === 0);
      if (sectionLikeBare) confidence = -Infinity;
    }
    let reliable = confidence >= 8;
    if (!reliable && record.standaloneTag && record.nearbyDisplayMath && equationCandidateAlignedToNumberingSide(record)) {
      confidence = Math.max(confidence, 12);
      reliable = true;
    }
    // Integer numbering is valid on either margin, but only when the token is
    // aligned with the inferred numbering side and has display-math context.
    const integerTag = Boolean(record.numeric && !record.numeric.prefix);
    if (integerTag && !(equationCandidateAlignedToNumberingSide(record) && (record.explicitParenthesized || record.nearbyDisplayMath || record.mathSignals >= 2))) {
      reliable = false;
    }
    if (integerTag && record.bareSource && !(record.nearbyDisplayMath || record.mathSignals >= 2)) reliable = false;
    record.confidence = confidence;
    // Sequence recovery must never resurrect a candidate that the direct
    // classifier already rejected as implausible (for example "1.7 Lemma"
    // or "3.10 Corollary").  Keep a deliberately narrower recovery pool:
    // direct candidates need to clear the normal confidence floor, while weak
    // bare/sequence-only candidates additionally need local display-math
    // evidence.  This keeps recovery as a gap-filler, not a second detector.
    const alignedForPool = equationCandidateAlignedToNumberingSide(record);
    const strongLineStartTag = Boolean(
      record.explicitParenthesized &&
      record.candidateAtLineStart &&
      (alignedForPool || record.nearbyDisplayMath || record.mathSignals >= 1)
    );
    const poolEligible = Number.isFinite(confidence) && (
      (confidence >= 8 && (
        record.standaloneTag ||
        alignedForPool ||
        record.nearbyDisplayMath ||
        record.mathSignals >= 2
      )) ||
      strongLineStartTag
    ) && (!record.sequenceOnly || record.nearbyDisplayMath || record.mathSignals >= 2);
    // Some PDFs expose a true displayed equation as a short alphabetic or
    // badly decoded formula line plus its explicit margin tag. The normal direct
    // classifier deliberately rejects prose-like integer tags. Keep such a tag
    // only as sequence evidence: it can fill one bounded numeric gap, but it
    // cannot enter the index on its own. This preserves the anti-reference
    // guard while allowing complete equation families.
    const marginGapCandidate = Boolean(
      !record.ocrTopRunningHeader
      && record.explicitParenthesized
      && alignedForPool
      && (Number(record.mathSignals) || 0) === 0
      && (equationNumberingSide === 'left' ? record.candidateAtLineStart : record.candidateAtLineEnd)
      && (equationNumberingSide === 'left' || Number(record.xStartRatio) >= 0.22)
      && !/\b(?:equation|eq\.?|see|from|by|using|satisfies|implies|according\s+to|as\s+in|in\s+view\s+of|contradicts?|rewrit(?:e|ten)|follows?\s+from|inequality\s+(?:like|in)|as\s+required|cf\.?|recall|apply(?:ing)?|combin(?:e|ing)|substitut(?:e|ing)|insert|notice)\b/i.test(String(record.text || ''))
    );
    if (poolEligible || marginGapCandidate) {
      const pool = candidatePool.get(record.label) || [];
      pool.push(marginGapCandidate && !poolEligible
        ? { ...record, confidence: 0, sequenceOnly: true, recoveredMarginGapCandidate: true }
        : record);
      candidatePool.set(record.label, pool);
    }
    if (!reliable || record.sequenceOnly) continue;
    const list = index.get(record.label) || [];
    list.push(record);
    index.set(record.label, list);
  }

  supplementRightNumberedTwoColumnEquations(index, rawPageLines);
  await supplementEquationIndexFromPageImages(sourceDoc, sourceKey, index);
  reconcileEquationNumberingFamilies(index);
  recoverSequentialEquationGaps(index, candidatePool);
  reconcileEquationNumberingFamilies(index);
  reconcileOcrEquationSequenceOrder(index);
  if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return new Map();
  equationLabelIndex = applyEquationEdits(canonicalizeEquationIndex(index));
  const previousKnownEquationCount = equationIndexKnownCount;
  renderEquationIndex();
  if (equationIndexKnownCount !== previousKnownEquationCount) persistDocumentState();
  return equationLabelIndex;
}

function equationConfidenceTier(score) {
  if (score >= 20) return t('high confidence','高置信度');
  if (score >= 12) return t('medium confidence','中等置信度');
  return t('review','需核对');
}

function equationRowOrderKey(entry) {
  if (entry?.manualEditId) return `edit:${String(entry.manualEditId)}`;
  const source = equationSourceLabelForDisplayed(entry?.label || '');
  return `label:${normalizedEquationLabel(source || entry?.label || '')}`;
}

function reconcileEquationManualOrder(rows) {
  if (!Array.isArray(rows) || !rows.length) { equationManualOrder = []; return rows || []; }
  const currentKeys = rows.map(equationRowOrderKey);
  const valid = new Set(currentKeys);
  const seen = new Set();
  const order = [];
  for (const rawKey of equationManualOrder || []) {
    const key = String(rawKey || '');
    if (!key || !valid.has(key) || seen.has(key)) continue;
    seen.add(key);
    order.push(key);
  }
  if (!order.length) order.push(...currentKeys);
  for (let i = 0; i < currentKeys.length; i += 1) {
    const key = currentKeys[i];
    if (order.includes(key)) continue;
    let inserted = false;
    for (let j = i - 1; j >= 0; j -= 1) {
      const prev = currentKeys[j];
      const at = order.indexOf(prev);
      if (at >= 0) { order.splice(at + 1, 0, key); inserted = true; break; }
    }
    if (!inserted) {
      for (let j = i + 1; j < currentKeys.length; j += 1) {
        const next = currentKeys[j];
        const at = order.indexOf(next);
        if (at >= 0) { order.splice(at, 0, key); inserted = true; break; }
      }
    }
    if (!inserted) order.push(key);
  }
  const changed = order.length !== equationManualOrder.length || order.some((key, index) => key !== equationManualOrder[index]);
  equationManualOrder = order;
  if (changed) persistDocumentState();
  const byKey = new Map(rows.map((row) => [equationRowOrderKey(row), row]));
  return equationManualOrder.map((key) => byKey.get(key)).filter(Boolean);
}

function saveEquationDragOrder(rows, visibleRows, draggedKey, targetKey, before) {
  const fullKeys = rows.map(equationRowOrderKey);
  const visibleKeys = visibleRows.map(equationRowOrderKey);
  const from = visibleKeys.indexOf(draggedKey);
  const target = visibleKeys.indexOf(targetKey);
  if (from < 0 || target < 0 || draggedKey === targetKey) return false;
  visibleKeys.splice(from, 1);
  let insertAt = visibleKeys.indexOf(targetKey);
  if (insertAt < 0) insertAt = visibleKeys.length;
  if (!before) insertAt += 1;
  visibleKeys.splice(Math.min(insertAt, visibleKeys.length), 0, draggedKey);
  const visibleSet = new Set(visibleKeys);
  let cursor = 0;
  equationManualOrder = fullKeys.map((key) => visibleSet.has(key) ? visibleKeys[cursor++] : key);
  persistDocumentState();
  return true;
}

function renderEquationIndex() {
  if (!equationIndex || !equationIndexEmpty || !equationIndexCount) return;
  equationIndex.replaceChildren();
  if (!equationLabelIndex) {
    equationIndexCount.textContent = Number.isInteger(equationIndexKnownCount) ? String(equationIndexKnownCount) : '…';
    equationIndexEmpty.classList.remove('is-hidden');
    equationIndexEmpty.textContent = t('Preparing equation-label index…', '正在准备公式编号索引……');
    return;
  }
  let rows = [];
  for (const [label, candidates] of equationLabelIndex.entries()) {
    let best = null;
    for (const candidate of candidates || []) {
      const score = Number.isFinite(candidate.confidence) ? candidate.confidence : equationCandidateConfidence(candidate, label);
      if (score < 8) continue;
      if (!best || score > best.score) best = { ...candidate, score };
    }
    if (best) rows.push({ label, ...best });
  }
  rows.sort((a,b) => {
    const pageDelta = a.page - b.page;
    if (pageDelta) return pageDelta;
    if (a.equationTwoColumn && b.equationTwoColumn
        && Number.isInteger(a.equationColumnIndex) && Number.isInteger(b.equationColumnIndex)
        && a.equationColumnIndex !== b.equationColumnIndex) return a.equationColumnIndex - b.equationColumnIndex;
    return a.ratio - b.ratio || a.label.localeCompare(b.label);
  });
  for (const edit of equationEdits.filter((item) => item.action === 'add')) {
    const addedIndex = rows.findIndex((row) => row.manualEditId && String(row.manualEditId) === String(edit.id));
    if (addedIndex < 0) continue;
    const [added] = rows.splice(addedIndex, 1);
    let anchorIndex = -1;
    const anchorRef = String(edit.beforeRef || edit.afterRef || edit.sourceLabel || '');
    if (anchorRef.startsWith('edit:')) anchorIndex = rows.findIndex((row) => String(row.manualEditId || '') === anchorRef.slice(5));
    else anchorIndex = rows.findIndex((row) => normalizedEquationLabel(row.label) === normalizedEquationLabel(anchorRef));
    const insertAt = anchorIndex >= 0
      ? (edit.beforeRef || edit.placement === 'above' ? anchorIndex : anchorIndex + 1)
      : rows.length;
    rows.splice(insertAt, 0, added);
  }
  rows = reconcileEquationManualOrder(rows);
  equationIndexKnownCount = rows.length;
  equationIndexCount.textContent = String(rows.length);
  const filterBar = document.createElement('div'); filterBar.className = 'equation-confidence-filter';
  const filterLabel = document.createElement('label'); filterLabel.textContent = t('Confidence', '置信度');
  const filterSelect = document.createElement('select'); filterSelect.setAttribute('aria-label', t('Filter equations by confidence', '按置信度筛选公式'));
  const filterOptions = [
    ['all', t('All', '全部')],
    ['high', t('High', '高')],
    ['medium', t('Medium', '中')],
    ['review', t('Review', '需核对')],
  ];
  for (const [value, text] of filterOptions) { const option = document.createElement('option'); option.value = value; option.textContent = text; filterSelect.append(option); }
  filterSelect.value = equationConfidenceFilter;
  filterSelect.addEventListener('change', () => { equationConfidenceFilter = filterSelect.value || 'all'; renderEquationIndex(); });
  filterLabel.append(filterSelect); filterBar.append(filterLabel); equationIndex.append(filterBar);
  const visibleRows = equationConfidenceFilter === 'all' ? rows : rows.filter((row) => (row.score >= 20 ? 'high' : row.score >= 12 ? 'medium' : 'review') === equationConfidenceFilter);
  equationIndexEmpty.classList.toggle('is-hidden', visibleRows.length > 0);
  if (!rows.length) equationIndexEmpty.textContent = t('No reliable equation labels detected.', '未检测到可靠的公式编号。');
  else if (!visibleRows.length) equationIndexEmpty.textContent = t('No equations match this confidence filter.', '没有符合当前置信度筛选的公式。');
  for (const entry of visibleRows.slice(0, 500)) {
    const row = document.createElement('div'); row.className = 'outline-edit-row equation-edit-row';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'equation-index-item'; button.dataset.page=String(entry.page); button.dataset.confidence=entry.score >= 20 ? 'high' : entry.score >= 12 ? 'medium' : 'review';
    const copy=document.createElement('span'); copy.className='equation-index-copy';
    const label = document.createElement('strong'); label.textContent = entry.label;
    const meta = document.createElement('span'); meta.textContent = `${t(`Page ${entry.page}`, `第 ${entry.page} 页`)} · ${equationConfidenceTier(entry.score)}`;
    copy.append(label,meta); button.append(copy);
    button.title = entry.text || entry.label;
    button.addEventListener('click', async () => { equationIndex.querySelectorAll('.equation-edit-row.has-edit-menu').forEach((node) => node.classList.remove('has-edit-menu')); const target = { page: entry.page, ratio: Number(entry.ratio) || 0 }; await goToMatchedLocation(target.page, target.ratio, entry.label); updateBacklinksForTarget(entry.label, target); });
    const menu = document.createElement('button'); menu.type='button'; menu.className='outline-overflow-button'; menu.textContent='⋯'; menu.title=t('Edit equation','编辑公式'); menu.setAttribute('aria-label',menu.title); menu.setAttribute('aria-expanded','false');
    menu.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); const willOpen = !row.classList.contains('has-edit-menu'); equationIndex.querySelectorAll('.equation-edit-row.has-edit-menu').forEach((node) => { node.classList.remove('has-edit-menu'); node.querySelector('.outline-overflow-button')?.setAttribute('aria-expanded','false'); }); row.classList.toggle('has-edit-menu', willOpen); menu.setAttribute('aria-expanded', willOpen ? 'true' : 'false'); if (willOpen) requestAnimationFrame(() => positionOutlineEditActions(menu, actions)); });
    const actions = document.createElement('div'); actions.className = 'outline-edit-actions';
    const reselect = document.createElement('button'); reselect.type='button'; reselect.className='outline-edit-button'; reselect.textContent=t('Reselect','重新选择');
    reselect.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); row.classList.remove('has-edit-menu'); pendingEquationReselectKey = entry.manualEditId ? `edit:${entry.manualEditId}` : `label:${equationSourceLabelForDisplayed(entry.label)}`; pendingEquationAddKey = null; pendingOutlineReselectKey = null; refreshSelectionUI(); });
    const remove = document.createElement('button'); remove.type='button'; remove.className='outline-edit-button'; remove.textContent=t('Remove','移除');
    remove.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation(); row.classList.remove('has-edit-menu');
      if (entry.manualEditId) {
        const removedEdit = equationEdits.find((item) => item.action === 'add' && String(item.id) === String(entry.manualEditId));
        if (removedEdit) pushUndo('equation', entry.label || t('Equation','公式'), { mode:'added', edit: removedEdit });
        equationEdits = equationEdits.filter((item) => !(item.action === 'add' && String(item.id) === String(entry.manualEditId)));
      } else {
        const sourceLabel = equationSourceLabelForDisplayed(entry.label);
        const previousEdit = equationEdits.find((item) => item.action !== 'add' && normalizedEquationLabel(item.sourceLabel) === normalizedEquationLabel(sourceLabel)) || null;
        pushUndo('equation', entry.label || t('Equation','公式'), {
          mode:'source', sourceLabel, previousEdit,
          label:String(entry.label || sourceLabel), page:Number(entry.page)||1,
          ratio:Number(entry.ratio)||0, text:String(entry.text || entry.label || sourceLabel)
        });
        equationEdits = equationEdits.filter((item) => !(item.action !== 'add' && normalizedEquationLabel(item.sourceLabel) === normalizedEquationLabel(sourceLabel)));
        equationEdits.push({ action:'remove', sourceLabel });
      }
      pendingEquationReselectKey = null; pendingEquationAddKey = null; equationLabelIndex = null; equationNumberingSide = 'right'; equationIndexBuildPromise = null; equationIndexKnownCount = null;
      persistDocumentState(); ensureEquationIndexRendered(); refreshSelectionUI();
    });
    const add = document.createElement('button'); add.type='button'; add.className='outline-edit-button'; add.textContent=t('Add','添加');
    add.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation(); row.classList.remove('has-edit-menu');
      const sourceOrderKey = equationRowOrderKey(entry);
      if (!equationManualOrder.includes(sourceOrderKey)) {
        equationManualOrder = rows.map(equationRowOrderKey);
        persistDocumentState();
      }
      pendingEquationAddKey = entry.manualEditId ? `edit:${entry.manualEditId}` : entry.label;
      pendingEquationReselectKey = null; pendingOutlineReselectKey = null; refreshSelectionUI();
    });
    actions.append(reselect, remove, add);

    const orderKey = equationRowOrderKey(entry);
    row.draggable = true;
    row.dataset.equationOrderKey = orderKey;
    row.title = row.title || t('Drag to reorder equation', '拖动调整公式顺序');
    row.addEventListener('dragstart', (event) => {
      if (event.target?.closest?.('.outline-overflow-button,.outline-edit-actions')) { event.preventDefault(); return; }
      event.stopPropagation();
      draggedEquationKey = orderKey;
      row.classList.add('is-dragging-equation');
      try {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-mathreader-equation-row', orderKey);
        event.dataTransfer.setData('text/plain', orderKey);
      } catch (_) {}
    });
    row.addEventListener('dragend', (event) => {
      event.stopPropagation();
      draggedEquationKey = null;
      dragDepth = 0;
      dropOverlay?.classList.add('is-hidden');
      row.classList.remove('is-dragging-equation');
      equationIndex.querySelectorAll('.equation-edit-row.drag-target-before,.equation-edit-row.drag-target-after').forEach((node) => node.classList.remove('drag-target-before','drag-target-after'));
    });
    row.addEventListener('dragover', (event) => {
      if (!draggedEquationKey || draggedEquationKey === orderKey) return;
      event.preventDefault(); event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      const rect = row.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      row.classList.toggle('drag-target-before', before);
      row.classList.toggle('drag-target-after', !before);
    });
    row.addEventListener('dragleave', (event) => { event.stopPropagation(); row.classList.remove('drag-target-before','drag-target-after'); });
    row.addEventListener('drop', (event) => {
      if (!draggedEquationKey || draggedEquationKey === orderKey) return;
      event.preventDefault(); event.stopPropagation();
      const rect = row.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      row.classList.remove('drag-target-before','drag-target-after');
      if (saveEquationDragOrder(rows, visibleRows, draggedEquationKey, orderKey, before)) renderEquationIndex();
    });

    row.append(button, menu, actions); equationIndex.append(row);
  }
  applyDocumentMapFilter(el('map-filter-equations')); updateDocumentMapCurrentLocation();
}

async function ensureEquationIndexRendered() {
  if (!pdfDoc) { renderEquationIndex(); return; }
  if (!documentTextFeaturesAvailable()) {
    equationLabelIndex = null;
    equationIndex?.replaceChildren();
    if (equationIndexCount) equationIndexCount.textContent = '0';
    if (equationIndexEmpty) { equationIndexEmpty.classList.remove('is-hidden'); equationIndexEmpty.textContent = t('Document text unavailable. Run full-document OCR to enable Equations.', '文档文本不可用。运行全文 OCR 后才能启用公式索引。'); }
    return new Map();
  }
  if (equationLabelIndex) { renderEquationIndex(); return equationLabelIndex; }
  if (equationIndexEmpty) { equationIndexEmpty.classList.remove('is-hidden'); equationIndexEmpty.textContent = t('Building equation-label index…', '正在生成公式编号索引……'); }
  try {
    if (!equationIndexBuildPromise) equationIndexBuildPromise = buildEquationLabelIndex().finally(() => { equationIndexBuildPromise = null; });
    await equationIndexBuildPromise;
    return equationLabelIndex;
  } catch (error) { console.warn('Equation-label index build failed', error); if (equationIndexEmpty) equationIndexEmpty.textContent = t('The equation-label index could not be built.', '无法生成公式编号索引。'); }
}

async function findEquationLabelLocation(query, originPage = null, originRatio = null) {
  const label = normalizedEquationLabel(query);
  const index = await buildEquationLabelIndex();
  const candidates = index.get(label) || [];
  let best = null;
  for (const candidate of candidates) {
    // Never resolve an inline equation reference back to the exact glyphs
    // that were clicked. This is the key distinction between a reference
    // occurrence in prose and the actual equation tag.
    if (candidate.page === originPage && Number.isFinite(originRatio) && Number.isFinite(candidate.ratio)
        && Math.abs(candidate.ratio - originRatio) < 0.018) continue;
    const confidence = Number.isFinite(candidate.confidence) ? candidate.confidence : equationCandidateConfidence(candidate, label);
    if (confidence < 8) continue;
    const score = equationTargetScore(candidate.text, label, originPage, candidate.page, originRatio, candidate.ratio) + confidence * 0.2;
    if (!best || score > best.score) best = { ...candidate, score };
  }
  return best ? { page: best.page, ratio: best.ratio } : null;
}

async function pageTextLines(pageNum, sourceDoc = pdfDoc, cache = lineCache, flatCache = textCache) {
  if (cache.has(pageNum)) return cache.get(pageNum);
  if (sourceDoc === pdfDoc && sourceDocumentUsesOcr(pageNum)) {
    const record = documentOcrPages.get(Number(pageNum));
    const lines = (record?.lines || []).map((line) => ({
      ...line,
      ocrSource: true,
      parts: Array.isArray(line.parts) ? line.parts.map((part) => ({ ...part })) : [],
    }));
    cache.set(pageNum, lines);
    if (flatCache) flatCache.set(pageNum, String(record?.text || lines.map((line) => line.text).join(' ')).replace(/\s+/g, ' ').trim());
    return lines;
  }
  const page = await sourceDoc.getPage(pageNum);
  const content = await page.getTextContent();
  const view = Array.isArray(page.view) ? page.view : [0, 0, 1, 1];
  const yMin = Number(view[1]) || 0;
  const yMax = Number(view[3]) || 1;
  const pageHeight = Math.max(1, yMax - yMin);
  const rows = [];
  for (const item of content.items || []) {
    const text = String(item.str || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const x = Number(item.transform?.[4]) || 0;
    const width = Math.max(0, Number(item.width) || 0);
    const y = Number(item.transform?.[5]) || 0;
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2.2);
    if (!row) { row = { y, items: [] }; rows.push(row); }
    row.items.push({ x, width, text });
  }
  rows.sort((a, b) => b.y - a.y);
  const pageWidth = Math.max(1, (Number(view[2]) || 1) - (Number(view[0]) || 0));
  const lines = rows.map((row) => {
    const items = row.items.sort((a, b) => a.x - b.x);
    const xMin = Math.min(...items.map((item) => item.x));
    const xMax = Math.max(...items.map((item) => item.x + (item.width || 0)));
    const parts = [];
    let text = '';
    for (const item of items) {
      if (text) text += ' ';
      const start = text.length;
      text += item.text;
      parts.push({
        start,
        end: text.length,
        xStartRatio: Math.min(1, Math.max(0, (item.x - (Number(view[0]) || 0)) / pageWidth)),
        xEndRatio: Math.min(1, Math.max(0, (item.x + (item.width || 0) - (Number(view[0]) || 0)) / pageWidth))
      });
    }
    return {
      text: text.replace(/\s+/g, ' ').trim(),
      parts,
      ratio: Math.min(1, Math.max(0, (yMax - row.y) / pageHeight)),
      xStartRatio: Math.min(1, Math.max(0, (xMin - (Number(view[0]) || 0)) / pageWidth)),
      xEndRatio: Math.min(1, Math.max(0, (xMax - (Number(view[0]) || 0)) / pageWidth))
    };
  }).filter((line) => line.text);
  cache.set(pageNum, lines);
  if (flatCache && !flatCache.has(pageNum)) flatCache.set(pageNum, lines.map((line) => line.text).join(' ').replace(/\s+/g, ' ').trim());
  return lines;
}


function bibliographyHeadingText(value) {
  return /^(?:references(?:\s+and\s+notes)?|notes\s+and\s+references|bibliography|literature\s+cited)\s*[.:]?$/i.test(String(value || '').replace(/\s+/g, ' ').trim());
}

function bibliographyLineFragment(line, parts, columnIndex = null) {
  if (!Array.isArray(parts) || !parts.length) return null;
  const ordered = [...parts].sort((a, b) => Number(a.start || 0) - Number(b.start || 0));
  const start = Math.min(...ordered.map((part) => Number(part.start || 0)));
  const end = Math.max(...ordered.map((part) => Number(part.end || 0)));
  const source = String(line?.text || '');
  const raw = source.slice(start, end).replace(/\s+/g, ' ').trim();
  if (!raw) return null;
  const leading = source.slice(start, end).search(/\S/);
  const adjustedStart = start + Math.max(0, leading);
  const fragmentParts = ordered.map((part) => ({
    ...part,
    start: Math.max(0, Number(part.start || 0) - adjustedStart),
    end: Math.max(0, Number(part.end || 0) - adjustedStart),
  }));
  return {
    ...line,
    text: raw,
    parts: fragmentParts,
    xStartRatio: Math.min(...ordered.map((part) => Number(part.xStartRatio || 0))),
    xEndRatio: Math.max(...ordered.map((part) => Number(part.xEndRatio || 0))),
    columnIndex,
  };
}

function bibliographyColumnAwareLines(rawLines, bibliographyAlreadyActive = false) {
  const lines = Array.isArray(rawLines) ? rawLines : [];
  if (!lines.length) return lines;

  const splitRows = [];
  const strongColumnSplitRatios = [];
  for (const line of lines) {
    const parts = Array.isArray(line.parts) ? [...line.parts].sort((a, b) => Number(a.xStartRatio || 0) - Number(b.xStartRatio || 0)) : [];
    let bestGap = null;
    for (let index = 0; index + 1 < parts.length; index += 1) {
      const left = parts[index];
      const right = parts[index + 1];
      const gap = Number(right.xStartRatio || 0) - Number(left.xEndRatio || 0);
      if (Number(left.xEndRatio || 0) > 0.56 || Number(right.xStartRatio || 0) < 0.44 || gap < 0.04) continue;
      if (!bestGap || gap > bestGap.gap) bestGap = { index, gap };
    }
    if (bestGap) {
      const left = bibliographyLineFragment(line, parts.slice(0, bestGap.index + 1), 0);
      const right = bibliographyLineFragment(line, parts.slice(bestGap.index + 1), 1);
      if (left && right) {
        splitRows.push(left, right);
        const ratio = Number(line.ratio || 0);
        // A real two-column row normally has substantial content anchored in
        // both outer halves. Old single-column text layers can contain large
        // internal gaps around formulas, page numbers, or journal metadata;
        // do not let those isolated gaps establish a column layout.
        if (Number(left.xStartRatio || 0) <= 0.18
            && Number(left.xEndRatio || 0) >= 0.28
            && Number(right.xStartRatio || 0) >= 0.46
            && Number(right.xEndRatio || 0) >= 0.70) strongColumnSplitRatios.push(ratio);
        continue;
      }
    }
    const columnIndex = Number(line.xEndRatio || 0) <= 0.56 ? 0 : (Number(line.xStartRatio || 0) >= 0.44 ? 1 : null);
    splitRows.push({ ...line, columnIndex });
  }

  const headingLines = splitRows.filter((line) => bibliographyHeadingText(line.text));
  const headingPresent = headingLines.length > 0;
  if (!bibliographyAlreadyActive && !headingPresent) return lines;

  const headingRatio = headingPresent ? Math.min(...headingLines.map((line) => Number(line.ratio || 0))) : 0;
  const relevant = (line) => bibliographyAlreadyActive || Number(line.ratio || 0) >= headingRatio - 0.02;
  const leftLines = splitRows.filter((line) => line.columnIndex === 0 && relevant(line));
  const rightLines = splitRows.filter((line) => line.columnIndex === 1 && relevant(line));
  const strongSplitCount = strongColumnSplitRatios.filter((ratio) => bibliographyAlreadyActive || ratio >= headingRatio - 0.02).length;
  const substantialColumnLine = (line) => {
    const span = Math.max(0, Number(line.xEndRatio || 0) - Number(line.xStartRatio || 0));
    return span >= 0.18 && String(line.text || '').trim().length >= 20;
  };
  const substantialLeftCount = leftLines.filter(substantialColumnLine).length;
  const substantialRightCount = rightLines.filter(substantialColumnLine).length;
  const headingOnLeft = headingLines.some((line) => line.columnIndex === 0);
  const headingOnRight = headingLines.some((line) => line.columnIndex === 1);
  const twoColumn = strongSplitCount >= 2
    || (substantialLeftCount >= 3 && substantialRightCount >= 3)
    || (headingOnRight && substantialRightCount >= 3 && (strongSplitCount >= 1 || substantialLeftCount >= 1))
    || (headingOnLeft && substantialLeftCount >= 3 && (strongSplitCount >= 1 || substantialRightCount >= 1));
  if (!twoColumn) {
    // Do not retain speculative row splits when the page as a whole did not
    // establish a bibliography column layout. A single-column reference line
    // can contain a large internal gap (especially in old OCR/text layers),
    // but splitting it changes reading order and can manufacture entries.
    const starts = lines.map((line) => Number(line.xStartRatio || 0)).filter(Number.isFinite).sort((a, b) => a - b);
    const base = starts.length ? starts[Math.min(starts.length - 1, Math.floor(starts.length * 0.12))] : 0;
    return lines.map((line) => ({ ...line, columnStartRatio: base }));
  }

  const columnStart = (columnLines) => {
    const starts = columnLines.map((line) => Number(line.xStartRatio || 0)).filter(Number.isFinite).sort((a, b) => a - b);
    return starts.length ? starts[Math.min(starts.length - 1, Math.floor(starts.length * 0.12))] : 0;
  };
  const leftStart = columnStart(leftLines);
  const rightStart = columnStart(rightLines);
  const annotate = (line) => ({
    ...line,
    columnStartRatio: line.columnIndex === 0 ? leftStart : (line.columnIndex === 1 ? rightStart : Number(line.xStartRatio || 0)),
  });
  const fullWidth = splitRows.filter((line) => line.columnIndex === null).map(annotate);
  const topFullWidth = fullWidth.filter((line) => Number(line.ratio || 0) < 0.18).sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0));
  const otherFullWidth = fullWidth.filter((line) => Number(line.ratio || 0) >= 0.18).sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0));
  return [
    ...topFullWidth,
    ...leftLines.map(annotate).sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0)),
    ...rightLines.map(annotate).sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0)),
    ...otherFullWidth,
  ];
}

function bibliographyPersonNameChunk(value) {
  const cleaned = String(value || '').replace(/^[,;:\s]+|[,;:.\s]+$/g, '').replace(/^(?:and|&)\s+/i, '').trim();
  if (!cleaned || /\b(?:Journal|Proceedings?|Conference|Transactions?|University|Univ\.?|Press|Springer|arXiv|Vol(?:ume)?|pages?|Math\.?|Appl\.?|Analysis|Annals?|Comm\.?|Communications?|Proc\.?|Trans\.?|Arch\.?|Invent\.?|Acta|Bull\.?)\b/i.test(cleaned)) return false;
  const tokens = cleaned.split(/\s+/).filter((token) => !/^(?:de|del|di|du|la|le|van|von|da|dos|bin)$/i.test(token));
  if (tokens.length < 2 || tokens.length > 6) return false;
  let nameTokens = 0;
  for (const token of tokens) {
    const bare = token.replace(/[()]/g, '');
    if (/^(?:[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я]\.?|[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я][\p{L}'’.-]+)$/u.test(bare)) nameTokens += 1;
    else return false;
  }
  return nameTokens >= 2;
}

function fullNameBibliographyLead(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value || /^(?:The|This|These|Those|We|Our|In|For|From|Figure|Table|Section|Appendix|Proof|Lemma|Theorem|Proposition|Corollary)\b/.test(value)) return false;
  // Wrapped publication metadata can superficially look like two capitalized
  // person-name tokens (for example “Math. J., ... 1976”). Such lines are
  // continuations, never starts of an unnumbered author-year reference.
  if (/^(?:J\.?|Math\.?|Ann\.?|Comm\.?|Commun\.?|Proc\.?|Proceedings?|Trans\.?|Arch\.?|Invent\.?|Acta|Bull\.?|Vol\.?|Volume|No\.?|pp?\.?|t\.)\b/i.test(value)) return false;
  const yearMatch = value.match(/\b(?:17|18|19|20)\d{2}\b/);
  let authorRegion = yearMatch ? value.slice(0, yearMatch.index) : value.slice(0, 220);
  authorRegion = authorRegion.replace(/[.\s]+$/g, '').replace(/\s+(?:et\s+al\.)$/i, '').trim();
  const chunks = authorRegion.split(/\s*,\s*|\s+(?:and|&)\s+/).map((chunk) => chunk.trim()).filter(Boolean);
  let count = 0;
  for (const chunk of chunks.slice(0, 8)) {
    if (!bibliographyPersonNameChunk(chunk)) break;
    count += 1;
  }
  return count >= 2 || (count >= 1 && Boolean(yearMatch));
}

function unnumberedBibliographyTextLooksStrong(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length < 35 || !fullNameBibliographyLead(value) || !/\b(?:17|18|19|20)\d{2}\b/.test(value)) return false;
  let score = 0;
  if (/\b(?:Journal|Proceedings?|Conference|Transactions?|Communications?|Annals?|Springer|Press|University|arXiv|CoRR|IEEE|ACM|SIAM|NeurIPS|ICML|ICLR|ACL|EMNLP|CVPR)\b/i.test(value)) score += 2;
  if (/\b(?:vol(?:ume)?\.?|pages?|pp?\.|\d+\s*\(\d+\)\s*:\s*\d+)\b/i.test(value)) score += 1;
  if ((value.match(/[.]/g) || []).length >= 2) score += 1;
  if (value.length >= 80) score += 1;
  return score >= 2;
}

function bibliographyLineStartsAtColumn(line) {
  const x = Number(line?.xStartRatio || 0);
  const base = Number(line?.columnStartRatio);
  if (!Number.isFinite(base)) return true;
  return x <= base + 0.018;
}

function bibliographyLineLooksLikeHeaderOrFooter(line, cleaned) {
  const value = String(cleaned || '').replace(/\s+/g, ' ').trim();
  const topHeaderLike = Number(line?.ratio || 0) < 0.10 && (
    /^\d{1,4}\s+[A-Z][A-Z0-9 .,:;'’"()\-]{4,}$/u.test(value)
    || /^[A-Z][A-Z0-9 .,:;'’"()\-]{4,}\s+\d{1,4}$/u.test(value)
  );
  return topHeaderLike
    || (Number(line?.ratio || 0) > 0.91 && value.length < 100)
    || /^\d{1,4}\s+[A-Z][A-Z .,'’'-]{2,}$/u.test(value)
    || /^(?:(?:I\s+)?manuscrit\s+reçu|received|revised|department\s+of|annales\s+de|license\s+or\s+copyright\s+restrictions)\b/i.test(value);
}

function normalizedBibliographyKey(value) {
  return String(value || '').replace(/^\s*\[|\]\s*$/g, '').replace(/\s+/g, '').trim().toLocaleLowerCase();
}

function bibliographyCitationKeys(raw, knownKeys = null) {
  const inner = String(raw || '').replace(/^\s*\[|\]\s*$/g, '').trim();
  if (!inner) return [];
  const keys = [];
  const accept = (value) => {
    const key = normalizedBibliographyKey(value);
    if (!key || (knownKeys && !knownKeys.has(key)) || keys.includes(key)) return;
    keys.push(key);
  };
  for (const part of inner.split(/[;,]/)) {
    const token = part.trim();
    const numericRange = token.match(/^(\d{1,3})\s*[-–—]\s*(\d{1,3})$/);
    if (numericRange) {
      const start = Number(numericRange[1]);
      const end = Number(numericRange[2]);
      if (Math.abs(end - start) <= 80) {
        const step = start <= end ? 1 : -1;
        for (let value = start; value !== end + step; value += step) accept(String(value));
      }
      continue;
    }
    // Do not guess the syntax of author-style bibliography keys. When the
    // bibliography is known, exact normalized key membership is authoritative.
    accept(token);
  }
  return keys;
}

function bibliographyMetadata(text) {
  const value = String(text || '');
  const doi = value.match(/\b10\.\d{4,9}\/[\-._;()/:A-Z0-9]+/i)?.[0]?.replace(/[.,;)]$/, '') || '';
  const arxiv = value.match(/\barXiv\s*:\s*([a-z.-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?/i)?.[1] || '';
  return { doi, arxiv };
}


function bibliographyReferenceBodyLooksStrong(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length < 12 || !/^[\p{L}]/u.test(value)) return false;
  let score = 0;
  if (/^[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я]/u.test(value)) score += 1;
  if (/^(?:(?:[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я][.\-–—·]{1,5}\s+){1,4})[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я][\p{L}'’.-]{1,40}\s*,/u.test(value)
      || /^[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я][\p{L}'’.-]{1,40},\s+(?:(?:[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я][.\-–—·]{0,5}\s*){1,4})/u.test(value)) score += 2;
  if (/\b(?:17|18|19|20)\d{2}\b/.test(value)) score += 2;
  if (/\b(?:Ann\.?|Math\.?|Journal|J\.?\s|Proc\.?|Proceedings?|Trans\.?|Communications?|Comm\.?|Springer|Press|Verlag|University|Acad(?:emy)?|Acta|Inventiones|Topology|Bull\.?)\b/i.test(value)) score += 2;
  if ((value.match(/,/g) || []).length >= 2) score += 1;
  if (value.length >= 42) score += 1;
  return score >= 3;
}

function malformedNumericBibliographyCandidate(text, line, page) {
  if (Number(line?.xStartRatio || 0) >= 0.22) return null;
  const match = String(text || '').match(/^(\S{2,8})\s+(.{8,})$/u);
  if (!match) return null;
  const token = match[1];
  const body = match[2].trim();
  if (!/^[\[{(]/u.test(token)) return null;
  if (/^\[\s*\d{1,3}\s*\][.)]?$/u.test(token)) return null;
  if (/^\[\s*[A-Za-z][A-Za-z0-9\s]{0,12}\s*\][.)]?$/u.test(token)) return null;
  if (!bibliographyReferenceBodyLooksStrong(body)) return null;

  const compact = Array.from(token).length <= 6;
  if (!compact) return null;
  const digitText = (token.match(/\d/g) || []).join('');
  const bracketedSingleGlyph = /^[\[{(]\s*[^\s\]})]{1}\s*[\]})][.)]?$/u.test(token);
  const digitBearing = digitText.length >= 1 && digitText.length <= 3;
  if (!digitBearing && !bracketedSingleGlyph) return null;

  return {
    token,
    digitText,
    bracketedSingleGlyph,
    body,
    page,
    ratio: Number(line?.ratio || 0),
    xStartRatio: Number(line?.xStartRatio || 0),
    used: false,
    continuations: []
  };
}

function bibliographyDocumentPosition(item) {
  return (Number(item?.page || 0) * 2) + Math.min(1, Math.max(0, Number(item?.ratio || 0)));
}

function recoverSingleGapBibliographyCandidates(entries, candidates) {
  const numericEntries = entries
    .map((entry) => ({ entry, value: Number(normalizedBibliographyKey(entry.number)) }))
    .filter((item) => Number.isInteger(item.value) && item.value >= 1 && item.value <= 999)
    .sort((a, b) => bibliographyDocumentPosition(a.entry) - bibliographyDocumentPosition(b.entry));
  if (numericEntries.length < 2 || !Array.isArray(candidates) || !candidates.length) return 0;

  let recoveredCount = 0;
  const existingKeys = new Set(entries.map((entry) => normalizedBibliographyKey(entry.number)));
  for (let index = 0; index + 1 < numericEntries.length; index += 1) {
    const left = numericEntries[index];
    const right = numericEntries[index + 1];
    if (right.value !== left.value + 2) continue;
    const missing = left.value + 1;
    if (existingKeys.has(String(missing))) continue;
    const leftPos = bibliographyDocumentPosition(left.entry);
    const rightPos = bibliographyDocumentPosition(right.entry);
    const compatible = candidates.filter((candidate) => {
      if (candidate.used) return false;
      const position = bibliographyDocumentPosition(candidate);
      if (!(position > leftPos && position < rightPos)) return false;
      if (candidate.digitText) return Number(candidate.digitText) === missing;
      return candidate.bracketedSingleGlyph;
    });
    if (compatible.length !== 1) continue;

    const candidate = compatible[0];
    const fullBody = [candidate.body, ...(candidate.continuations || [])].join(' ').replace(/\s+/g, ' ').trim();
    if (!bibliographyReferenceBodyLooksStrong(fullBody)) continue;
    const meta = bibliographyMetadata(fullBody);
    const recovered = {
      number: missing,
      label: `[${missing}]`,
      page: candidate.page,
      ratio: candidate.ratio,
      title: fullBody.slice(0, 640),
      citations: [],
      ...meta
    };
    const insertAt = entries.indexOf(right.entry);
    entries.splice(insertAt >= 0 ? insertAt : entries.length, 0, recovered);
    existingKeys.add(String(missing));
    candidate.used = true;
    recoveredCount += 1;
  }
  return recoveredCount;
}

async function buildStructureIndex({ force = false } = {}) {
  if (!pdfDoc || !documentTextFeaturesAvailable() || !structureIndex || structureIndexBuilding) return;
  if (force && pendingOutlineReselectKey) { pendingOutlineReselectKey = null; refreshSelectionUI(); }
  if (!force && structureIndexVersion === STRUCTURE_INDEX_VERSION) {
    renderStructureIndex(); renderBibliographyIndex();
    return;
  }

  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const sourceTextCache = textCache;
  const sourceLineCache = lineCache;
  const token = ++structureIndexBuildToken;
  structureIndexBuilding = true;
  buildStructureIndexButton.disabled = true;
  structureEmpty.classList.remove('is-hidden');
  structureEmpty.textContent = t('Building mathematical structure in the background…', '正在后台生成数学结构索引……');
  if (bibliographyEmpty) { bibliographyEmpty.classList.remove('is-hidden'); bibliographyEmpty.textContent = t('Detecting bibliography entries…', '正在检测参考文献条目……'); }

  const nextEntries = [];
  const nextBibliography = [];
  const bibliographyCitationGroups = [];
  const bibliographyRecoveryCandidates = [];
  let bibliographyMode = false;
  let pendingBibliographyKey = null;
  let syntheticBibliographyMode = null;
  let activeBibliographyEntry = null;
  let activeBibliographyRecoveryCandidate = null;
  let pendingUnnumberedBibliographyEntry = null;
  let activeProofEntry = null;
  try {
    // Structure stays bounded for performance, but old books and long technical
    // texts often place References far beyond page 800. Always include a tail
    // window so Bibliography can still be complete without scanning thousands
    // of middle pages.
    const primaryPageCount = Math.min(sourceDoc.numPages, 800);
    const pageSequence = Array.from({ length: primaryPageCount }, (_, index) => index + 1);
    if (sourceDoc.numPages > primaryPageCount) {
      const tailStart = Math.max(primaryPageCount + 1, sourceDoc.numPages - 119);
      for (let page = tailStart; page <= sourceDoc.numPages; page += 1) pageSequence.push(page);
    }
    for (const page of pageSequence) {
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== structureIndexBuildToken) return;
      const tailOnlyPage = page > primaryPageCount;
      const rawLines = await pageTextLines(page, sourceDoc, sourceLineCache, sourceTextCache);
      const lines = bibliographyColumnAwareLines(rawLines, bibliographyMode);
      for (const line of lines) {
        const cleaned = String(line.text || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) continue;
        if (bibliographyHeadingText(cleaned)) {
          // Contents pages in books often contain a standalone "Bibliography"
          // item near the front. Treat a heading as the real bibliography only
          // in the latter part of longer documents; repeated running headers on
          // subsequent bibliography pages keep the established numbering mode.
          const bibliographyHeadingEligible = sourceDoc.numPages <= 20 || page >= Math.max(2, Math.floor(sourceDoc.numPages * 0.35));
          if (bibliographyHeadingEligible) {
            if (!bibliographyMode) syntheticBibliographyMode = null;
            bibliographyMode = true; pendingBibliographyKey = null; pendingUnnumberedBibliographyEntry = null; activeBibliographyEntry = null; activeBibliographyRecoveryCandidate = null; activeProofEntry = null;
          }
          continue;
        }
        if (bibliographyMode && /^(?:glossary(?:\s+of\s+notation)?|index)\s*[.:]?$/i.test(cleaned)) {
          bibliographyMode = false; pendingBibliographyKey = null; pendingUnnumberedBibliographyEntry = null; activeBibliographyEntry = null; activeBibliographyRecoveryCandidate = null; continue;
        }

        if (!bibliographyMode && !tailOnlyPage) {
          const bracketRe = /\[[^\]]{1,60}\]/g;
          let bracketMatch;
          while ((bracketMatch = bracketRe.exec(cleaned))) {
            const raw = bracketMatch[0];
            bibliographyCitationGroups.push({
              page,
              ratio: line.ratio,
              raw,
              snippet: backlinkSnippet(cleaned, raw, bracketMatch.index),
              matchIndex: bracketMatch.index
            });
          }
        }

        if (!tailOnlyPage) {
          // Result headings must begin the extracted visual line. Do not promote
          // ordinary prose references such as "... by Proposition 13.6(a) ..."
          // into the Results index merely because they follow punctuation.
          const structureMatch = cleaned.match(/^((?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])(?:[.:)]|\s)[^.!?]{0,150})/i);
          const namedResultMatch = !structureMatch ? cleaned.match(/^((?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis)\s*\([^()]{2,80}\)\s*[.:]?)/) : null;
          if (structureMatch || namedResultMatch) {
            const title = (structureMatch?.[1] || namedResultMatch?.[1] || '').replace(/\s+/g, ' ').trim().replace(/\s+([.:,)])/g, '$1');
            const label = structureMatch ? (title.match(STRUCTURE_REFERENCE_RE)?.[0] || title.slice(0, 80)) : title.replace(/[.:]+$/, '').trim();
            if ((structureMatch && STRUCTURE_LABEL_RE.test(title)) || namedResultMatch) {
              const key = `${page}:${normalizedReferenceLabel(label)}`;
              const lowercaseSingleLetterProse = structureMatch && /^[a-z]/.test(cleaned) && /\s+[a-z]$/.test(label);
              if (!lowercaseSingleLetterProse && !nextEntries.some((entry) => entry.key === key)) {
                const entry = { key, label, page, ratio: line.ratio, title: title.slice(0, 180), proofReferences: [], usedByProofs: [] };
                nextEntries.push(entry); activeProofEntry = entry;
              }
            }
          }
  
          const proofMatch = cleaned.match(/^Proof(?:\s+of\s+((?:Theorem|Lemma|Proposition|Corollary)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])))?\b[.:]?/i);
          if (proofMatch) {
            let target = null;
            if (proofMatch[1]) {
              const wanted = normalizedReferenceLabel(proofMatch[1]);
              target = [...nextEntries].reverse().find((entry) => normalizedReferenceLabel(entry.label) === wanted) || null;
            }
            if (!target) target = [...nextEntries].reverse().find((entry) => page - entry.page <= 1 && /^(?:theorem|lemma|proposition|corollary|claim)\b/i.test(entry.label || '')) || null;
            if (target && !target.proofPage) {
              target.proofPage = page; target.proofRatio = line.ratio; target.proofTitle = proofMatch[1] ? `Proof of ${proofMatch[1]}` : 'Proof';
              activeProofEntry = target;
            }
          }
          if (activeProofEntry && activeProofEntry.proofPage) {
            const references = cleaned.match(STRUCTURE_REFERENCE_RE) || [];
            for (const reference of references) {
              const normalizedRef = normalizedReferenceLabel(reference);
              if (!normalizedRef || normalizedRef === normalizedReferenceLabel(activeProofEntry.label)) continue;
              if (!activeProofEntry.proofReferences.includes(reference)) activeProofEntry.proofReferences.push(reference);
            }
          }
  
          if (activeProofEntry && /(?:\bQ\.?\s*E\.?\s*D\.?\b|[□∎])/.test(cleaned)) {
            activeProofEntry.proofEndPage = page; activeProofEntry.proofEndRatio = line.ratio; activeProofEntry = null;
          }
        }

        if (bibliographyMode) {
          const addBibliographyEntry = (rawKey, body, bracketKey = true, entryPage = page, entryRatio = line.ratio) => {
            const number = bracketKey ? rawKey : Number(rawKey);
            const label = bracketKey ? `[${rawKey}]` : `[${number}]`;
            const normalizedKey = normalizedBibliographyKey(rawKey);
            if (!normalizedKey) return null;
            const existing = nextBibliography.find((entry) => normalizedBibliographyKey(entry.number) === normalizedKey);
            if (existing) return existing;
            const meta = bibliographyMetadata(body);
            const entry = { number, label, page: entryPage, ratio: entryRatio, title: body.slice(0, 640), citations: [], ...meta };
            nextBibliography.push(entry);
            return entry;
          };

          const appendBibliographyContinuation = (entry, fragment) => {
            if (!entry) return;
            const addition = String(fragment || '').replace(/\s+/g, ' ').trim();
            if (!addition || /^\d{1,4}$/.test(addition)) return;
            const combined = `${entry.title || ''} ${addition}`.replace(/\s+/g, ' ').trim().slice(0, 640);
            entry.title = combined;
            const meta = bibliographyMetadata(combined);
            if (!entry.doi && meta.doi) entry.doi = meta.doi;
            if (!entry.arxiv && meta.arxiv) entry.arxiv = meta.arxiv;
          };

          // Old scanned bibliographies commonly lose or swap one bracket glyph.
          // Repair only a line-leading 1–3 digit key, only inside Bibliography,
          // and only for OCR-derived lines. Native PDF text remains authoritative.
          let bibliographyLine = line.ocrSource
            ? cleaned.replace(/^[\[{(]\s*(\d{1,3})\s*[\]})][.)]?\s*/, '[$1] ')
            : cleaned;
          // Native text extraction in older scans can also confuse 1/l and the
          // closing bracket. Repair only the *next expected* numeric key, so a
          // malformed [l], [ll], [ 101 or [ 131 cannot invent a new sequence.
          const numericBibliographyNumbers = nextBibliography
            .map((entry) => Number(normalizedBibliographyKey(entry.number)))
            .filter((value) => Number.isInteger(value) && value >= 1 && value <= 999);
          const expectedBibliographyNumber = numericBibliographyNumbers.length ? Math.max(...numericBibliographyNumbers) + 1 : 1;
          if (expectedBibliographyNumber === 1) {
            bibliographyLine = line.ocrSource
              ? bibliographyLine.replace(/^[\[{(]\s*[lI]\s*[\]})][.)]?\s+/u, '[1] ')
              : bibliographyLine.replace(/^\[\s*[lI]\s*\]\s+/u, '[1] ');
          }
          if (expectedBibliographyNumber === 11) {
            bibliographyLine = line.ocrSource
              ? bibliographyLine.replace(/^[\[{(]\s*[lI]{2}\s*[\]})][.)]?\s+/u, '[11] ')
              : bibliographyLine.replace(/^\[\s*[lI]{2}\s*\]\s+/u, '[11] ');
          }
          bibliographyLine = bibliographyLine.replace(/^\[\s*(\d{1,3})1\s+(.+)$/u, (full, digits, body) => Number(digits) === expectedBibliographyNumber ? `[${digits}] ${body}` : full);
          let bib = bibliographyLine.match(/^\[\s*(\d{1,3})\s*\][.)]?\s+(.{3,})$/);
          let bracketKey = false;
          if (!bib) {
            bib = bibliographyLine.match(/^\[\s*([A-Za-z][A-Za-z0-9\s]{0,12})\s*\][.)]?\s+(.{3,})$/);
            if (bib) bib[1] = bib[1].trim();
            bracketKey = Boolean(bib);
          }
          if (!bib) bib = bibliographyLine.match(/^(\d{1,3})[.)]\s+([A-Z][^=]{8,})$/);
          // Once a numeric bibliography sequence is established, recover
          // old text layers whose author token is damaged or whose leading 5
          // was misread as 6 (for example visual 50 -> extracted 60). Recovery
          // is sequence-locked and left-margin-only, so numbered body prose
          // cannot start a reference merely because Bibliography mode is on.
          if (!bib && numericBibliographyNumbers.length >= 3 && Number(line.xStartRatio || 0) < 0.18) {
            const sequentialBare = bibliographyLine.match(/^(\d{1,3})-?\s+(.{8,})$/u);
            if (sequentialBare) {
              const rawNumber = Number(sequentialBare[1]);
              const tenDigitFiveToSixConfusion = expectedBibliographyNumber >= 50
                && expectedBibliographyNumber <= 59
                && rawNumber === expectedBibliographyNumber + 10;
              if (rawNumber === expectedBibliographyNumber
                  || (tenDigitFiveToSixConfusion && /^[A-ZÀ-ÖØ-Þ]/u.test(sequentialBare[2]))) {
                bib = [sequentialBare[0], String(expectedBibliographyNumber), sequentialBare[2]];
              }
            }
            if (!bib && expectedBibliographyNumber >= 10 && expectedBibliographyNumber <= 99) {
              const fuzzyLead = bibliographyLine.match(/^(\S{2,4})\s+([A-ZÀ-ÖØ-Þ].{7,})$/u);
              const expectedText = String(expectedBibliographyNumber);
              if (fuzzyLead) {
                const token = fuzzyLead[1];
                const tokenDigits = token.replace(/\D/g, '');
                const oneDigitCorruption = /\D/.test(token)
                  && token[0] === expectedText[0]
                  && tokenDigits === expectedText[0];
                if (oneDigitCorruption) bib = [fuzzyLead[0], expectedText, fuzzyLead[2]];
              }
            }
          }
          // Many older books print bare bibliography numbers in a left column
          // with no brackets or punctuation. Accept that shape only when the
          // body visibly begins like an author entry; this keeps ordinary page
          // numbers and numbered prose out of Bibliography.
          if (!bib) bib = bibliographyLine.match(/^(\d{1,3})-?\s+([A-ZÀ-ÖØ-Þ][\p{L}'’.-]{1,40},\s+.{6,})$/u);
          const malformedNumericCandidate = !bib ? malformedNumericBibliographyCandidate(bibliographyLine, line, page) : null;
          if (bib) {
            pendingBibliographyKey = null;
            pendingUnnumberedBibliographyEntry = null;
            activeBibliographyRecoveryCandidate = null;
            if (syntheticBibliographyMode === null) syntheticBibliographyMode = false;
            activeBibliographyEntry = addBibliographyEntry(bib[1], bib[2].trim(), bracketKey);
          } else {
            if (malformedNumericCandidate) {
              bibliographyRecoveryCandidates.push(malformedNumericCandidate);
              activeBibliographyRecoveryCandidate = malformedNumericCandidate;
              pendingBibliographyKey = null;
              activeBibliographyEntry = null;
              continue;
            }
            let keyOnly = bibliographyLine.match(/^\[\s*(\d{1,3}|[A-Za-z][A-Za-z0-9\s]{0,12})\s*\][.)]?$/);
            if (keyOnly) keyOnly[1] = keyOnly[1].trim();
            // Old bibliographies often use a horizontal rule to mean
            // "same author as above". The rule may be a vector rather than
            // text, leaving PDF.js with a short fragment such as "[11] ,"
            // while the title starts on the next extracted line. Treat only
            // the next expected numeric key, at the bibliography's left edge,
            // as a pending key; do not broaden ordinary bracket matching.
            const dittoNumericKey = bibliographyLine.match(/^\[\s*(\d{1,3})\s*\]\s*(?:[-–—_]{1,16}\s*)?[,;:.]?\s*$/u);
            if (!keyOnly && dittoNumericKey
                && Number(dittoNumericKey[1]) === expectedBibliographyNumber
                && Number(line.xStartRatio || 0) < 0.22) keyOnly = dittoNumericKey;
            const bareNumericKey = bibliographyLine.match(/^(\d{1,3})-?$/);
            if (!keyOnly && bareNumericKey && Number(bareNumericKey[1]) === expectedBibliographyNumber && Number(line.xStartRatio || 0) < 0.18) keyOnly = bareNumericKey;
            const surnameInitialAuthor = /^[A-ZÀ-ÖØ-Þ'’][\p{L}0-9"'’.\-\\{}:;]{1,48}(?:\s+(?:de|del|di|du|la|le|van|von))?,\s+(?:[A-Z0]\.?(?:\s*|$)){1,4}(?:,|\s|:).{6,}$/u.test(bibliographyLine);
            const surnameGivenAuthor = /^[A-ZÀ-ÖØ-Þ][\p{L}'’.-]{1,40},\s+[A-Z][\p{Ll}'’.-]{2,}(?:\s+(?:de|del|di|du|la|le|van|von))?(?:,|:).{6,}$/u.test(bibliographyLine);
            const initialFirstAuthor = /^(?:(?:[A-Z]\.\s*){1,4})[A-ZÀ-ÖØ-Þ][\p{L}'’.-]{1,40}(?:\s+(?:and|&)\s+(?:(?:[A-Z]\.\s*){1,4})?[A-ZÀ-ÖØ-Þ][\p{L}'’.-]{1,40})?\s*,\s+.{6,}$/u.test(bibliographyLine);
            const unnumberedBibCue = /(?:\b(?:17|18|19|20)\d{2}\b|\b(?:Journal|Communications?|Proceedings?|Springer|Press|Verlag|Inventiones|University\s+Press)\b|(?:\b(?:J|Math|Ann|Comm|Proc|Trans|Vol|No)\.))/i.test(bibliographyLine);
            const fullNameAuthorLead = fullNameBibliographyLead(bibliographyLine);
            const unnumberedAuthorLead = surnameInitialAuthor || initialFirstAuthor || (surnameGivenAuthor && unnumberedBibCue) || (fullNameAuthorLead && unnumberedBibliographyTextLooksStrong(bibliographyLine));
            const authorLineSpan = Math.max(0, Number(line.xEndRatio || 0) - Number(line.xStartRatio || 0));
            const strongUnnumberedAuthorLead = unnumberedAuthorLead && bibliographyLineStartsAtColumn(line) && (bibliographyLine.length >= 60 || authorLineSpan >= 0.45 || fullNameAuthorLead);
            const pendingFullNameLead = fullNameAuthorLead && bibliographyLineStartsAtColumn(line) && (syntheticBibliographyMode === true || syntheticBibliographyMode === null);
            const finalizePendingUnnumbered = () => {
              if (!pendingUnnumberedBibliographyEntry) return false;
              const full = pendingUnnumberedBibliographyEntry.fragments.join(' ').replace(/\s+/g, ' ').trim();
              if (!unnumberedBibliographyTextLooksStrong(full)) return false;
              if (syntheticBibliographyMode === null) syntheticBibliographyMode = true;
              activeBibliographyEntry = addBibliographyEntry(String(nextBibliography.length + 1), full, false, pendingUnnumberedBibliographyEntry.page, pendingUnnumberedBibliographyEntry.ratio);
              pendingUnnumberedBibliographyEntry = null;
              activeBibliographyRecoveryCandidate = null;
              pendingBibliographyKey = null;
              return Boolean(activeBibliographyEntry);
            };
            if (!keyOnly && pendingUnnumberedBibliographyEntry) {
              if (pendingFullNameLead && bibliographyLineStartsAtColumn(line)) {
                if (!finalizePendingUnnumbered()) pendingUnnumberedBibliographyEntry = null;
                pendingUnnumberedBibliographyEntry = { page, ratio: line.ratio, fragments: [bibliographyLine] };
                activeBibliographyEntry = null;
                if (unnumberedBibliographyTextLooksStrong(bibliographyLine)) finalizePendingUnnumbered();
                continue;
              }
              if (!bibliographyLineLooksLikeHeaderOrFooter(line, cleaned)) pendingUnnumberedBibliographyEntry.fragments.push(cleaned);
              if (finalizePendingUnnumbered()) continue;
              if (pendingUnnumberedBibliographyEntry.fragments.length >= 7) pendingUnnumberedBibliographyEntry = null;
              continue;
            }
            if (!keyOnly && pendingFullNameLead && !strongUnnumberedAuthorLead) {
              pendingUnnumberedBibliographyEntry = { page, ratio: line.ratio, fragments: [bibliographyLine] };
              activeBibliographyEntry = null;
              activeBibliographyRecoveryCandidate = null;
              pendingBibliographyKey = null;
              if (unnumberedBibliographyTextLooksStrong(bibliographyLine)) finalizePendingUnnumbered();
              continue;
            }
            if (keyOnly) {
              pendingUnnumberedBibliographyEntry = null;
              if (syntheticBibliographyMode === null) syntheticBibliographyMode = false;
              activeBibliographyRecoveryCandidate = null;
              pendingBibliographyKey = { rawKey: keyOnly[1], bracketKey: !/^\d+$/.test(keyOnly[1]), page, ratio: line.ratio };
              activeBibliographyEntry = null;
            } else if (activeBibliographyRecoveryCandidate && cleaned.length >= 3) {
              const footerLike = bibliographyLineLooksLikeHeaderOrFooter(line, cleaned);
              if (!footerLike) activeBibliographyRecoveryCandidate.continuations.push(cleaned);
            } else if ((syntheticBibliographyMode === true || syntheticBibliographyMode === null) && strongUnnumberedAuthorLead && (syntheticBibliographyMode === true || unnumberedBibCue)) {
              if (syntheticBibliographyMode === null) syntheticBibliographyMode = true;
              activeBibliographyRecoveryCandidate = null;
              pendingBibliographyKey = null;
              pendingUnnumberedBibliographyEntry = null;
              activeBibliographyEntry = addBibliographyEntry(String(nextBibliography.length + 1), bibliographyLine, false);
            } else if (pendingBibliographyKey && cleaned.length >= 3) {
              const pending = pendingBibliographyKey;
              pendingBibliographyKey = null;
              activeBibliographyRecoveryCandidate = null;
              activeBibliographyEntry = addBibliographyEntry(pending.rawKey, cleaned, pending.bracketKey, pending.page || page, pending.ratio ?? line.ratio);
            } else if (activeBibliographyEntry && cleaned.length >= 3 && !/^(?:references?|bibliography|literature\s+cited)\b/i.test(cleaned)) {
              // Preserve wrapped old-style references. Continuation lines often
              // contain the journal, volume, year or page range that makes the
              // entry useful, but v295 discarded everything after line one.
              const footerLike = bibliographyLineLooksLikeHeaderOrFooter(line, cleaned);
              if (!footerLike) appendBibliographyContinuation(activeBibliographyEntry, cleaned);
            }
          }
        }
      }
      if (page % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== structureIndexBuildToken) return;

    if (pendingUnnumberedBibliographyEntry) {
      const pendingText = pendingUnnumberedBibliographyEntry.fragments.join(' ').replace(/\s+/g, ' ').trim();
      if (unnumberedBibliographyTextLooksStrong(pendingText)) {
        if (syntheticBibliographyMode === null) syntheticBibliographyMode = true;
        const meta = bibliographyMetadata(pendingText);
        nextBibliography.push({ number: nextBibliography.length + 1, label: `[${nextBibliography.length + 1}]`, page: pendingUnnumberedBibliographyEntry.page, ratio: pendingUnnumberedBibliographyEntry.ratio, title: pendingText.slice(0, 640), citations: [], ...meta });
      }
      pendingUnnumberedBibliographyEntry = null;
    }

    // High-confidence exact parsing stays authoritative. A second pass may
    // promote a provisional malformed key only when two exact numeric neighbors
    // bound one unique missing number in document order. This recovers damaged
    // text-layer glyphs without broad OCR substitutions or duplicate entries.
    recoverSingleGapBibliographyCandidates(nextBibliography, bibliographyRecoveryCandidates);

    // Resolve body citation groups only after the bibliography keys are known.
    // The brackets group citations; they do not define the key syntax. This
    // supports author lists such as [Wg, W1] and unusual real bibliography keys
    // without broad bracket heuristics or false positives.
    const bibliographyByKey = new Map(nextBibliography.map((entry) => [normalizedBibliographyKey(entry.number), entry]));
    const knownBibliographyKeys = new Set(bibliographyByKey.keys());
    for (const citation of bibliographyCitationGroups) {
      for (const key of bibliographyCitationKeys(citation.raw, knownBibliographyKeys)) {
        const entry = bibliographyByKey.get(key);
        if (!entry) continue;
        entry.citations.push(citation);
        if (entry.citations.length > 500) entry.citations.length = 500;
      }
    }

    // Apply document-order sequence consistency after local detection. Exact
    // result labels are unique, and numeric result numbering must not move
    // backwards through the paper. This removes repeated prose-derived labels
    // without inventing missing mathematical results.
    const sequenceCleanEntries = normalizeSequentialStructureEntries(nextEntries);

    // Resolve proof dependencies into a directed graph and derive the reverse
    // relation from the same sequence-cleaned structure index.
    const structureByLabel = new Map(sequenceCleanEntries.map((entry) => [normalizedReferenceLabel(entry.label), entry]));
    for (const owner of sequenceCleanEntries) {
      const resolved = [];
      for (const reference of owner.proofReferences || []) {
        const target = structureByLabel.get(normalizedReferenceLabel(reference));
        if (!target || target === owner) continue;
        if (!resolved.some((item) => item.label === target.label)) resolved.push({ label: target.label, page: target.page, ratio: target.ratio });
        target.usedByProofs = target.usedByProofs || [];
        if (!target.usedByProofs.some((item) => item.label === owner.label)) target.usedByProofs.push({ label: owner.label, page: owner.proofPage || owner.page, ratio: owner.proofRatio || owner.ratio });
      }
      owner.proofUses = resolved.slice(0, 12);
    }

    // Corollary edges are intentionally conservative: only create them when
    // the corollary statement itself explicitly names an earlier structure.
    for (const entry of sequenceCleanEntries) {
      if (!/^corollary\b/i.test(entry.label || '')) continue;
      const refs = String(entry.title || '').match(STRUCTURE_REFERENCE_RE) || [];
      for (const ref of refs) {
        const parent = structureByLabel.get(normalizedReferenceLabel(ref));
        if (!parent || parent === entry) continue;
        parent.corollaries = parent.corollaries || [];
        if (!parent.corollaries.some((item) => item.label === entry.label)) parent.corollaries.push({ label: entry.label, page: entry.page, ratio: entry.ratio });
        entry.derivedFrom = entry.derivedFrom || [];
        if (!entry.derivedFrom.some((item) => item.label === parent.label)) entry.derivedFrom.push({ label: parent.label, page: parent.page, ratio: parent.ratio });
      }
    }

    structureEntries = sequenceCleanEntries.slice(0, 500);
    bibliographyEntries = nextBibliography.slice(0, 400);
    structureIndexVersion = STRUCTURE_INDEX_VERSION;
    renderStructureIndex(); renderBibliographyIndex(); rerenderReferenceLinks();
    persistDocumentState();
  } catch (error) {
    console.warn('Mathematical structure index build failed', error);
    if (pdfDoc === sourceDoc && currentFileKey === sourceKey && token === structureIndexBuildToken) {
      structureEmpty.classList.remove('is-hidden');
      structureEmpty.textContent = t('The mathematical structure index could not be built. Use Rebuild index to try again.', '无法生成数学结构索引。可使用“重新生成索引”再次尝试。');
    }
  } finally {
    if (token === structureIndexBuildToken) {
      structureIndexBuilding = false;
      buildStructureIndexButton.disabled = !pdfDoc;
    }
  }
}

function scheduleAutomaticStructureIndex() {
  if (!pdfDoc || !documentTextFeaturesAvailable() || structureIndexVersion === STRUCTURE_INDEX_VERSION || structureIndexBuilding) return;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const run = () => {
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || structureIndexVersion === STRUCTURE_INDEX_VERSION) return;
    buildStructureIndex();
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 700 });
  else setTimeout(run, 120);
}

function structureResultRelationLabel(item) {
  return normalizedReferenceLabel(item?.label || '');
}

function pruneStructureResultRelations(entry) {
  const label = structureResultRelationLabel(entry);
  if (!label) return;
  for (const item of structureEntries) {
    if (!item || item === entry) continue;
    for (const field of ['proofUses', 'usedByProofs', 'corollaries', 'derivedFrom']) {
      if (!Array.isArray(item[field])) continue;
      item[field] = item[field].filter((related) => structureResultRelationLabel(related) !== label);
    }
  }
}

function restoreStructureResultRelations(entry) {
  const restoredLabel = structureResultRelationLabel(entry);
  if (!restoredLabel) return;
  const byLabel = new Map(structureEntries.map((item) => [structureResultRelationLabel(item), item]).filter(([label]) => label));
  const addRelation = (owner, field, related) => {
    if (!owner || !related?.label) return;
    owner[field] = Array.isArray(owner[field]) ? owner[field] : [];
    const key = structureResultRelationLabel(related);
    if (!owner[field].some((item) => structureResultRelationLabel(item) === key)) owner[field].push(related);
  };
  for (const targetRef of entry.proofUses || []) {
    const target = byLabel.get(structureResultRelationLabel(targetRef));
    if (target) addRelation(target, 'usedByProofs', { label: entry.label, page: entry.proofPage || entry.page, ratio: Number(entry.proofRatio) || Number(entry.ratio) || 0 });
  }
  for (const ownerRef of entry.usedByProofs || []) {
    const owner = byLabel.get(structureResultRelationLabel(ownerRef));
    if (owner) addRelation(owner, 'proofUses', { label: entry.label, page: entry.page, ratio: Number(entry.ratio) || 0 });
  }
  for (const childRef of entry.corollaries || []) {
    const child = byLabel.get(structureResultRelationLabel(childRef));
    if (child) addRelation(child, 'derivedFrom', { label: entry.label, page: entry.page, ratio: Number(entry.ratio) || 0 });
  }
  for (const parentRef of entry.derivedFrom || []) {
    const parent = byLabel.get(structureResultRelationLabel(parentRef));
    if (parent) addRelation(parent, 'corollaries', { label: entry.label, page: entry.page, ratio: Number(entry.ratio) || 0 });
  }
}

function renderStructureIndex() {
  if (!structureIndex || !structureEmpty || !structureCount) return;
  structureIndex.replaceChildren();
  structureCount.textContent = String(structureEntries.length);
  structureEmpty.classList.toggle('is-hidden', structureEntries.length > 0);
  if (!structureEntries.length) {
    structureEmpty.textContent = structureIndexBuilding
      ? t('Building mathematical structure in the background…', '正在后台生成数学结构索引……')
      : t('The theorem, definition, and proof index is prepared automatically for this document.', '此文档的定理、定义与证明索引会自动生成。');
    return;
  }
  for (const entry of structureEntries) {
    const row = document.createElement('div'); row.className = 'structure-entry proof-graph-card'; row.dataset.page=String(entry.page);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'structure-item proof-graph-root'; button.dataset.page=String(entry.page);
    const strong = document.createElement('strong'); strong.textContent = entry.label || entry.title.replace(/([.:)].*)$/, '$1').slice(0, 80);
    const meta = document.createElement('span'); meta.textContent = t(`Page ${entry.page}`, `第 ${entry.page} 页`);
    button.append(strong, meta); button.title = entry.title;
    button.addEventListener('click', async () => {
      structureIndex.querySelectorAll('.structure-entry.has-edit-menu').forEach((node) => node.classList.remove('has-edit-menu'));
      setDocumentMapSelectedNode(button);
      const q = entry.label || entry.title;
      const target = { page: entry.page, ratio: Number(entry.ratio) || 0 };
      await goToMatchedLocation(target.page, target.ratio, q);
      updateBacklinksForTarget(q, target);
    });
    row.append(button);
    if (entry.proofPage) {
      const proof = document.createElement('button'); proof.type = 'button'; proof.className = 'structure-proof proof-graph-proof'; proof.dataset.page=String(entry.proofPage);
      proof.textContent = `${entry.proofTitle || t('Proof', '证明')} → ${t(`p. ${entry.proofPage}`, `第 ${entry.proofPage} 页`)}`;
      proof.title = entry.proofEndPage ? t(`Proof ends on page ${entry.proofEndPage}`, `证明结束于第 ${entry.proofEndPage} 页`) : '';
      proof.addEventListener('click', async () => { const q = entry.proofTitle || 'Proof'; const target = { page: entry.proofPage, ratio: Number(entry.proofRatio) || 0 }; await goToMatchedLocation(target.page, target.ratio, q); });
      row.append(proof);
    }
    const relations = [];
    if (Array.isArray(entry.proofUses) && entry.proofUses.length) relations.push({ prefix: t('Proof uses', '证明使用'), type:'uses', items: entry.proofUses });
    if (Array.isArray(entry.usedByProofs) && entry.usedByProofs.length) relations.push({ prefix: t('Used in proofs', '用于证明'), type:'used-in', items: entry.usedByProofs });
    if (Array.isArray(entry.corollaries) && entry.corollaries.length) relations.push({ prefix: t('Corollaries', '推论'), type:'corollary', items: entry.corollaries });
    if (Array.isArray(entry.derivedFrom) && entry.derivedFrom.length) relations.push({ prefix: t('Derived from', '源自'), type:'derived', items: entry.derivedFrom });
    if (relations.length) {
      const graphWrap=document.createElement('div'); graphWrap.className='proof-graph-relations';
      for (const relation of relations) {
        const graph = document.createElement('div'); graph.className = `structure-relations relation-${relation.type}`;
        const prefix = document.createElement('span'); prefix.className = 'structure-relations-label'; prefix.textContent = `${relation.prefix}:`; graph.append(prefix);
        for (const related of relation.items.slice(0, 8)) {
          const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'structure-relation-chip'; chip.textContent = related.label; chip.dataset.page=String(related.page);
          chip.addEventListener('click', async () => { await goToMatchedLocation(related.page, Number(related.ratio) || 0, related.label); updateBacklinksForTarget(related.label, { page: related.page, ratio: Number(related.ratio) || 0 }); });
          graph.append(chip);
        }
        graphWrap.append(graph);
      }
      row.append(graphWrap);
    }
    structureIndex.append(row);
  }
  applyDocumentMapFilter(el('map-filter-theorems')); updateDocumentMapCurrentLocation();
}

document.addEventListener('click', (event) => {
  if (event.target.closest?.('.result-edit-actions')) return;
  document.querySelectorAll('#structure-index .structure-entry.has-edit-menu').forEach((node) => node.classList.remove('has-edit-menu'));
});

function renderBibliographyIndex() {
  if (!bibliographyIndex || !bibliographyEmpty || !bibliographyCount) return;
  bibliographyIndex.replaceChildren(); bibliographyCount.textContent = String(bibliographyEntries.length);
  bibliographyEmpty.classList.toggle('is-hidden', bibliographyEntries.length > 0);
  if (!bibliographyEntries.length) {
    bibliographyEmpty.textContent = structureIndexBuilding ? t('Detecting bibliography entries…', '正在检测参考文献条目……') : t('No numbered bibliography entries detected.', '未检测到编号参考文献条目。');
    return;
  }
  for (const entry of bibliographyEntries) {
    const row = document.createElement('div'); row.className = 'bibliography-item bibliography-smart-item'; row.dataset.page=String(entry.page);
    const main = document.createElement('button'); main.type='button'; main.className='bibliography-jump bibliography-expand'; main.setAttribute('aria-expanded', bibliographyExpanded.has(entry.number)?'true':'false'); main.title=t('Click to show citations · Double-click to go','单击查看引用 · 双击跳转');
    const label = document.createElement('strong'); label.textContent = entry.label;
    const copy=document.createElement('span'); copy.className='bibliography-copy';
    const text = document.createElement('span'); text.className='bibliography-title'; text.textContent = entry.title;
    const stats=document.createElement('span'); stats.className='bibliography-stats'; stats.textContent=bibliographyCitationSummary(entry);
    copy.append(text,stats); main.append(label,copy);
    // Citation expansion is immediate. Update only this row instead of
    // re-rendering the whole bibliography so the same DOM node survives long
    // enough for the browser's native dblclick event. If a double-click follows,
    // restore the pre-click expansion state before navigating.
    let bibliographyFirstClickWasExpanded = null;
    const renderBibliographyCitations = () => {
      row.querySelector('.bibliography-citations')?.remove();
      const expanded = bibliographyExpanded.has(entry.number);
      main.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (!expanded) return;
      const cites=document.createElement('div'); cites.className='bibliography-citations';
      const citations=Array.isArray(entry.citations)?entry.citations:[];
      if (!citations.length) { const empty=document.createElement('div'); empty.className='bibliography-citations-empty'; empty.textContent=t('No in-text citations detected.','未检测到正文引用。'); cites.append(empty); }
      for (const [index,citation] of citations.entries()) {
        const button=document.createElement('button'); button.type='button'; button.className='bibliography-citation-item'; button.dataset.page=String(citation.page);
        const meta=document.createElement('strong'); meta.textContent=index===0?t(`First citation · p. ${citation.page}`,`首次引用 · 第 ${citation.page} 页`):t(`Citation ${index+1} · p. ${citation.page}`,`第 ${index+1} 处引用 · 第 ${citation.page} 页`);
        const snippet=document.createElement('span'); snippet.textContent=citation.snippet||citation.raw||''; button.append(meta,snippet);
        button.addEventListener('click',()=>goToMatchedLocation(citation.page,Number(citation.ratio)||0,citation.raw||entry.label)); cites.append(button);
      }
      row.append(cites);
    };
    main.addEventListener('click',(event)=>{
      if (event.detail > 1) return;
      bibliographyFirstClickWasExpanded = bibliographyExpanded.has(entry.number);
      if (bibliographyFirstClickWasExpanded) bibliographyExpanded.delete(entry.number); else bibliographyExpanded.add(entry.number);
      renderBibliographyCitations();
    });
    main.addEventListener('dblclick',async(event)=>{
      event.preventDefault();
      if (bibliographyFirstClickWasExpanded !== null) {
        if (bibliographyFirstClickWasExpanded) bibliographyExpanded.add(entry.number); else bibliographyExpanded.delete(entry.number);
        renderBibliographyCitations();
        bibliographyFirstClickWasExpanded = null;
      }
      const target={page:entry.page,ratio:Number(entry.ratio)||0};
      await goToMatchedLocation(target.page,target.ratio,entry.label);
      updateBacklinksForTarget(entry.label,target);
    });
    const actions=document.createElement('div'); actions.className='bibliography-actions';
    if (entry.doi || entry.arxiv) {
      const external = document.createElement('a'); external.className = 'bibliography-external'; external.target = '_blank'; external.rel = 'noopener noreferrer';
      if (entry.doi) { external.href = `https://doi.org/${entry.doi}`; external.textContent = 'DOI ↗'; }
      else { external.href = `https://arxiv.org/abs/${entry.arxiv}`; external.textContent = 'arXiv ↗'; }
      actions.append(external);
    }
    row.append(main);
    if (actions.childElementCount) row.append(actions);
    renderBibliographyCitations();
    bibliographyIndex.append(row);
  }
  applyDocumentMapFilter(el('map-filter-bibliography')); updateDocumentMapCurrentLocation();
}

