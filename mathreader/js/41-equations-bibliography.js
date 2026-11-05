// MathReader · Equation indexing, Results/Structure indexing, and Bibliography rendering.
function normalizedReferenceLabel(value) {
  return String(value || '').normalize('NFKC')
    .replace(/(\d)\s*[.·]\s*(?=\d)/g, '$1.')
    .replace(/(\d)\s*[-–—]\s*(?=\d)/g, '$1.')
    .replace(/\s+/g, ' ')
    .replace(/\s*([()[\].,:])\s*/g, '$1')
    .trim().toLocaleLowerCase();
}

const STRUCTURE_STRONG_UNNUMBERED_TYPES = new Set(['theorem', 'lemma', 'proposition', 'corollary', 'definition', 'claim', 'conjecture']);

function normalizedStructureResultText(value) {
  return String(value || '').normalize('NFKC')
    .replace(/(\d)\s*[.·]\s*(?=\d)/g, '$1.')
    .replace(/(\d)\s*[-–—]\s*(?=\d)/g, '$1-')
    .replace(/(\d)\s*·\s*/g, '$1.')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalStructureResultType(value) {
  const text = String(value || '').toLocaleLowerCase();
  if (text === 'main result') return 'Main Result';
  return text ? `${text[0].toLocaleUpperCase()}${text.slice(1)}` : '';
}

function structureResultProseReferenceTail(value) {
  const tail = String(value || '').trim();
  if (!tail) return false;
  return /^(?:(?:above|below)\s+)?(?:shows?|showed|implies?|implied|follows?|followed|gives?|gave|states?|stated|yields?|yielded|guarantees?|guaranteed|provides?|provided|is|was|were|will|can|could|should|may|might|has|have|had|applies?|applied|extends?|extended|justifies?|justified|furnishes?|furnished|ensures?|ensured|says?|said|asserts?|asserted|proves?|proved|establishes?|established|allows?|allowed|requires?|required|means?|meant|contains?|contained)\b/i.test(tail);
}

// Number-first capitalized chapter/section headings can contain the word
// "DEFINITION" without announcing a mathematical Definition. Their title
// phrases are not Result statements, even when repeated as TOC entries.
// Require an all-uppercase, subsection-number-first noun phrase; preserve
// ordinary label-first "Definition 4-1 ..." declarations in the body.
function structureResultLooksLikeNumberedSectionTitle(value) {
  const text = String(value || '').trim();
  const match = text.match(/^\d{1,2}(?:[-–.]\d{1,2}){1,3}[.)]?\s+(?:DEFINITION|THEOREM|LEMMA|PROPOSITION|COROLLARY|REMARK|EXAMPLE)\s+(?:OF|AND|FOR|ON|IN|WITH)\s+(.{3,100})$/);
  return Boolean(match && /^[A-Z][A-Z\s'’&-]+$/.test(match[1].trim()));
}

// General TOC navigation classifier for Results (not a file- or label-specific
// exclusion).  Rows must resemble section/chapter titles with aligned page
// folios; a repeated sequence establishes the context.  The set is per-row,
// never the entire page, because short papers may contain real statements
// immediately beneath their contents listing.
function tocResultLineIndices(lines, page = 1, pageCount = 1) {
  const rows = Array.isArray(lines) ? lines : [];
  if (!rows.length) return new Set();
  const header = rows.some((line) => {
    if (Number(line?.ratio ?? 1) > 0.20) return false;
    return /^(?:(?:[ivxlcdm]+|\d+)\s+)?(?:table\s+of\s+)?contents\s*(?:(?:[ivxlcdm]+|\d+))?$/i.test(String(line?.text || '').trim());
  });
  const tocNumberedLead = /^(?:\d{1,2}(?:[.·\-–—_]\d{1,2}){0,4}[.)]?|[A-H][.)])\s+\S/i;
  const rowFolio = (line) => {
    const text = String(line?.text || '').replace(/\s+/g, ' ').trim();
    if (!tocNumberedLead.test(text) || text.length > 140) return false;
    if (!/\s(?:\d{1,4}|[ivxlcdm]{1,7})$/i.test(text)) return false;
    const parts = Array.isArray(line?.parts) ? line.parts : [];
    const folioPart = parts.length ? parts[parts.length - 1] : null;
    const end = Number(line?.xEndRatio);
    const folioX = Number(folioPart?.xStartRatio);
    const precedingEnd = Number(parts.length >= 2 ? parts[parts.length - 2]?.xEndRatio : NaN);
    // Native PDF text carries separate right-aligned page-number spans.
    if (folioPart && Number.isFinite(folioX) && Number.isFinite(precedingEnd)) {
      const tail = text.slice(Number(folioPart.start || 0), Number(folioPart.end || text.length)).trim();
      return /^(?:\d{1,4}|[ivxlcdm]{1,7})$/i.test(tail)
        && folioX >= 0.72 && folioX - precedingEnd >= 0.025
        && Number(line?.xStartRatio ?? 1) <= 0.35;
    }
    // An OCR record may lack span geometry. Use only when the page itself
    // has a verified multi-row TOC profile (verified below).
    return !parts.length && Number.isFinite(end) && end >= 0.70
      && Number(line?.xStartRatio ?? 1) <= 0.35;
  };
  const candidates = rows.map((line, index) => rowFolio(line) ? index : -1).filter((index) => index >= 0);
  const earlyPage = page <= Math.max(8, Math.ceil(Number(pageCount || 1) * 0.15));
  const hierarchicalRows = candidates.filter((index) => /^\d{1,2}(?:[.·\-–—_]\d{1,2})+[.)]?\s+\S/.test(String(rows[index].text || ''))).length;
  const titleRows = candidates.filter((index) => {
    const title = String(rows[index].text || '')
      .replace(/^(?:\d{1,2}(?:[.·\-–—_]\d{1,2}){0,4}[.)]?|[A-H][.)])\s+/, '')
      .replace(/\s+(?:\d{1,4}|[ivxlcdm]{1,7})$/i, '');
    return (title.match(/[A-Za-zÀ-ÖØ-öø-ÿ]{3,}/g) || []).length >= 2;
  }).length;
  // Continuation-page headers can be degraded or missing in OCR. Without an
  // explicit Contents header, require *repeated subsection* numbers and
  // substantive title text, not merely rows of numerical measurements.
  const established = (header && candidates.length >= 2 && titleRows >= 1)
    || (earlyPage && candidates.length >= 5 && hierarchicalRows >= 3 && titleRows >= 3
      && candidates.length >= rows.length * 0.13);
  return established ? new Set(candidates) : new Set();
}

// A visible back-of-book index header is page-level navigation, not a
// mathematical Result declaration. Require an explicit upper-page index title
// and a dense page of index rows; do not infer this from a lone headword such
// as "Definition" (which can be a genuine unnumbered mathematical Result).
function structureResultsIndexNavigationPage(lines) {
  const rows = Array.isArray(lines) ? lines : [];
  if (rows.length < 12) return false;
  return rows.some((line) => Number(line?.ratio ?? 1) <= 0.11
    && /^(?:(?:subject|name|author|phrase[-\s]?finder|general)\s+)?index\s*[.:]?$/i.test(String(line?.text || '').trim()));
}

function detectedStructureResult(lines, lineIndex, page) {
  const line = lines?.[lineIndex];
  const cleaned = normalizedStructureResultText(line?.text);
  if (!cleaned || structureResultLooksLikeNumberedSectionTitle(cleaned)) return null;

  // Classical papers use both “Lemma 2.3” and “2.3. LEMMA”. Require the
  // declaration to start the visual line so body references cannot qualify.
  let match = cleaned.match(/^(\d+(?:(?:\.\d+)+|(?:-\d+)+))[.)]?\s+(Theorem|Lemma|Proposition|Corollary|Definition|Main Result|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis)\b[.:]?\s*(.*)$/i);
  if (match) {
    const type = canonicalStructureResultType(match[2]);
    const number = match[1];
    const tail = String(match[3] || '').trim();
    return {
      label: `${type} ${number}`,
      title: `${type} ${number}${tail ? `. ${tail}` : ''}`.slice(0, 180),
      page,
      ratio: line.ratio,
    };
  }

  match = cleaned.match(/^(Theorem|Lemma|Proposition|Corollary|Definition|Main Result|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis)\s+([A-Z]?\d+(?:(?:\.\d+)+|(?:-\d+)+)?(?:['’])?|[A-Z])(?:[.:)]\s*|\s+|$)(.*)$/i);
  if (match) {
    const type = canonicalStructureResultType(match[1]);
    const number = match[2].replace('’', "'");
    // The declaration regex is case-insensitive for the result type, but a
    // single alphabetic label is case-sensitive notation.  Without this check
    // ordinary prose such as "the hypothesis y \in ..." is promoted to a
    // Result as "Hypothesis y".  Lowercase letter/prefixed labels are variable
    // references, not declaration labels; genuine old-style A / A1 labels remain.
    if (/^[A-Za-z]/.test(number) && number[0] !== number[0].toLocaleUpperCase()) return null;
    const tail = String(match[3] || '').trim();
    if (structureResultProseReferenceTail(tail)) return null;
    return {
      label: `${type} ${number}`,
      title: `${type} ${number}${tail ? `. ${tail}` : ''}`.slice(0, 180),
      page,
      ratio: line.ratio,
    };
  }

  match = cleaned.match(/^(Theorem|Lemma|Proposition|Corollary|Definition|Main Result|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis)\s*\([^()]{2,80}\)\s*[.:]?$/i);
  if (match) {
    // Old books often wrap a section heading across two visual lines, e.g.
    // “10-4 PROOF OF THE UNIFORMIZATION” / “THEOREM (PART I)”.  The
    // second line looks exactly like an unnumbered result unless the nearby
    // heading prefix is considered.  Reject only this explicit “proof of …”
    // continuation class; genuine standalone parenthetical result headings
    // remain eligible.
    const previous = lines?.[lineIndex - 1];
    const previousText = normalizedStructureResultText(previous?.text);
    const previousDistance = previous ? Math.abs((Number(previous.ratio) || 0) - (Number(line.ratio) || 0)) : Infinity;
    const splitProofHeading = previousDistance <= 0.075
      && /^(?:\d+(?:(?:\.\d+)+|(?:-\d+)+)\s+)?(?:A\s+)?PROOF\s+OF\s+(?:THE\s+)?/i.test(previousText);
    if (splitProofHeading) return null;
    const title = cleaned.replace(/[.:]+$/, '').trim();
    return { label: title.slice(0, 100), title: cleaned.slice(0, 180), page, ratio: line.ratio };
  }

  // A number is not mandatory for a genuine declaration. Classical papers
  // commonly use forms such as “Definition. A complete ...” or “Lemma. Let ...”.
  // Restrict this to strong result types so prose-style “Remark. ...” lines do
  // not become document-wide Results noise.
  match = cleaned.match(/^(Theorem|Lemma|Proposition|Corollary|Definition|Claim|Conjecture)\.\s+(.{2,})$/i);
  if (match && cleaned[0] === cleaned[0].toLocaleUpperCase()) {
    const type = canonicalStructureResultType(match[1]);
    return {
      label: `${type} · p.${page}`,
      displayLabel: type,
      title: cleaned.slice(0, 180),
      page,
      ratio: line.ratio,
      unnumberedResult: true,
    };
  }

  match = cleaned.match(/^(Theorem|Lemma|Proposition|Corollary|Definition|Main Result|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis)\.?$/i);
  if (!match || cleaned[0] !== cleaned[0].toLocaleUpperCase()) return null;
  const type = canonicalStructureResultType(match[1]);

  // Fragmented native layers can put "THEOREM" and "1.3. Let ..." into
  // separate, slightly out-of-order fragments on the *same baseline*. Require
  // the number AND statement text, tight y alignment and immediate horizontal
  // continuity. This does not promote lone folios, references, or distant
  // second-column text, and leaves the existing vertical split rule intact.
  const typeEnd = Number(line?.xEndRatio);
  const typeStart = Number(line?.xStartRatio);
  const typeRatio = Number(line?.ratio);
  if (Number.isFinite(typeEnd) && Number.isFinite(typeStart) && Number.isFinite(typeRatio)) {
    const sameRowNumber = (lines || []).filter((adjacent, index) => {
      if (index === lineIndex) return false;
      const start = Number(adjacent?.xStartRatio);
      const ratio = Number(adjacent?.ratio);
      if (!Number.isFinite(start) || !Number.isFinite(ratio)
        || Math.abs(ratio - typeRatio) > 0.006
        || start < typeStart + 0.035
        || start < typeEnd - 0.05
        || start > typeEnd + 0.12) return false;
      const numbered = normalizedStructureResultText(adjacent?.text).match(/^(\d+(?:\.\d+)*)(?:[.)])?\s+(.{5,})$/);
      return Boolean(numbered && !structureResultProseReferenceTail(numbered[2]));
    }).sort((a, b) => Math.abs(Number(a.xStartRatio) - typeEnd) - Math.abs(Number(b.xStartRatio) - typeEnd))[0];
    if (sameRowNumber) {
      const numbered = normalizedStructureResultText(sameRowNumber.text).match(/^(\d+(?:\.\d+)*)(?:[.)])?\s+(.{5,})$/);
      return {
        label: `${type} ${numbered[1]}`,
        title: `${type} ${numbered[1]}. ${numbered[2]}`.slice(0, 180),
        page,
        ratio: Math.min(typeRatio, Number(sameRowNumber.ratio)),
      };
    }
  }

  // Some old layouts put the result type and its number on adjacent visual
  // lines. Accept only a nearby number-leading line, never an arbitrary page
  // number or remote prose line.
  for (const offset of [1, -1]) {
    const adjacent = lines?.[lineIndex + offset];
    if (!adjacent) continue;
    const adjacentText = normalizedStructureResultText(adjacent.text);
    const numbered = adjacentText.match(/^(\d+(?:\.\d+)*)(?:[.)])?\s*(.*)$/);
    if (!numbered) continue;
    const number = numbered[1];
    const tail = String(numbered[2] || '').trim();
    const ratioDistance = Math.abs((Number(adjacent.ratio) || 0) - (Number(line.ratio) || 0));
    if (ratioDistance > 0.07) continue;
    // A bare integer adjacent to a heading is accepted only when there is
    // statement text on that same line. This excludes isolated running page
    // numbers while retaining Yau-style “THEOREM” / “2. Let ...”.
    if (!number.includes('.') && !tail) continue;
    if (tail && structureResultProseReferenceTail(tail)) continue;
    return {
      label: `${type} ${number}`,
      title: `${type} ${number}${tail ? `. ${tail}` : ''}`.slice(0, 180),
      page,
      ratio: Math.min(Number(line.ratio) || 0, Number(adjacent.ratio) || Number(line.ratio) || 0),
    };
  }

  // Keep genuinely unnumbered strong mathematical result headings. Loose
  // labels such as “Remark.” or “Example.” are too common in prose to index
  // safely without a number.
  if (!STRUCTURE_STRONG_UNNUMBERED_TYPES.has(String(match[1] || '').toLocaleLowerCase())) return null;
  return {
    label: `${type} · p.${page}`,
    displayLabel: type,
    title: type,
    page,
    ratio: line.ratio,
    unnumberedResult: true,
  };
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


function equationOcrPageConfidence(pageNum) {
  if (typeof documentOcrPages === 'undefined' || !(documentOcrPages instanceof Map)) return null;
  const record = documentOcrPages.get(Number(pageNum));
  if (!record) return null;
  const wordValues = (Array.isArray(record.words) ? record.words : [])
    .map((word) => Number(word?.confidence))
    .filter(Number.isFinite);
  if (wordValues.length) return wordValues.reduce((sum, value) => sum + value, 0) / wordValues.length;
  let weightedSum = 0;
  let weightedCount = 0;
  for (const line of Array.isArray(record.lines) ? record.lines : []) {
    const confidence = Number(line?.confidence);
    if (!Number.isFinite(confidence)) continue;
    const weight = Math.max(1, Array.isArray(line?.parts) ? line.parts.length : 1);
    weightedSum += confidence * weight;
    weightedCount += weight;
  }
  return weightedCount ? weightedSum / weightedCount : null;
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
      if (leftEnd < 0.38 || leftEnd > 0.58 || rightStart < 0.42 || rightStart > 0.64 || gap < 0.025) continue;
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
  const median = (values) => {
    const a = values.filter(Number.isFinite).sort((x, y) => x - y);
    return a.length ? a[Math.floor(a.length / 2)] : NaN;
  };

  // OCR engines often return a two-column raster page as already-separated
  // line records, so there is no merged same-y row from which to measure the
  // gutter.  Keep this fallback OCR-only: native PDF text continues to require
  // the stronger merged-row evidence above.  Repeated long prose anchors in
  // both outer columns establish the page profile; short formula/table rows
  // cannot do so by themselves.
  if (evidence.length < 4) {
    if (!lines.some((line) => Boolean(line?.ocrSource))) return lines;
    const prose = lines.filter((line) => String(line?.text || '').replace(/\s+/g, ' ').trim().length >= 28);
    const leftAnchors = prose.filter((line) => Number(line?.xStartRatio ?? 1) <= 0.22
      && Number(line?.xEndRatio ?? 1) >= 0.26
      && Number(line?.xEndRatio ?? 1) <= 0.53);
    const rightAnchors = prose.filter((line) => Number(line?.xStartRatio ?? 0) >= 0.47
      && Number(line?.xStartRatio ?? 0) <= 0.70
      && Number(line?.xEndRatio ?? 0) >= 0.70);
    if (leftAnchors.length < 4 || rightAnchors.length < 4) return lines;
    const separatedLeftStart = median(leftAnchors.map((line) => Number(line.xStartRatio)));
    const separatedLeftEnd = median(leftAnchors.map((line) => Number(line.xEndRatio)));
    const separatedRightStart = median(rightAnchors.map((line) => Number(line.xStartRatio)));
    const separatedRightEnd = median(rightAnchors.map((line) => Number(line.xEndRatio)));
    if (![separatedLeftStart, separatedLeftEnd, separatedRightStart, separatedRightEnd].every(Number.isFinite)) return lines;
    if (separatedRightStart - separatedLeftStart < 0.28 || separatedRightStart < 0.47 || separatedRightStart > 0.66) return lines;
    const boundary = Math.max(0.465, Math.min(0.515, separatedRightStart - 0.025));
    const profileLeftEnd = Math.max(boundary - 0.012, separatedLeftEnd);
    const profileRightEnd = Math.max(0.72, separatedRightEnd);
    return lines.map((line) => {
      const start = Number(line?.xStartRatio ?? NaN);
      const end = Number(line?.xEndRatio ?? NaN);
      if (!Number.isFinite(start) || !Number.isFinite(end)) return line;
      if (end <= boundary + 0.012) {
        return { ...line, equationTwoColumn: true, equationColumnIndex: 0, equationColumnStartRatio: separatedLeftStart, equationColumnEndRatio: profileLeftEnd };
      }
      if (start >= boundary - 0.012) {
        return { ...line, equationTwoColumn: true, equationColumnIndex: 1, equationColumnStartRatio: separatedRightStart, equationColumnEndRatio: profileRightEnd };
      }
      return line;
    });
  }

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

    // Once the page-level column profile is established, prefer that stable
    // right-column start over the instantaneous whitespace of a short formula.
    // In left-numbered two-column/2-up pages the first object in the right
    // column can itself be the equation tag, so the largest gap on that row may
    // occur *after* the tag and would otherwise attach it to the left column.
    const profileThreshold = rightStart - 0.025;
    const profileIndex = parts.findIndex((part, index) => index > 0 && Number(part.xStartRatio || 0) >= profileThreshold);
    if (profileIndex > 0) {
      const a = Number(parts[profileIndex - 1].xEndRatio || 0);
      const b = Number(parts[profileIndex].xStartRatio || 0);
      if (Number.isFinite(a) && Number.isFinite(b) && b > a + 0.02) {
        best = { index: profileIndex - 1, gap: b - a, midpointDistance: Math.abs(((a + b) / 2) - 0.5) };
      }
    }

    if (!best) {
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
    }
    if (!best) { out.push(line); continue; }
    const left = equationLineFragmentForColumns(line, parts.slice(0, best.index + 1), 0, leftStart, leftEnd);
    const right = equationLineFragmentForColumns(line, parts.slice(best.index + 1), 1, rightStart, rightEnd);
    if (left && right) out.push(left, right); else out.push(line);
  }
  return out;
}

function equationCandidateAlignedToLocalColumnSide(item, side = equationNumberingSide) {
  if (!item?.equationTwoColumn) return false;
  const targetColumn = side === 'left' ? 1 : 0;
  if (item.equationColumnIndex !== targetColumn) return false;
  const start = Number(item?.candidateXStartRatio);
  const end = Number(item?.candidateXEndRatio);
  const columnStart = Number(item?.equationColumnStartRatio);
  const columnEnd = Number(item?.equationColumnEndRatio);
  if (![start, end, columnStart, columnEnd].every(Number.isFinite) || columnEnd <= columnStart) return false;
  const width = columnEnd - columnStart;
  const tolerance = Math.min(0.10, Math.max(0.055, width * 0.25));
  if (side === 'left') return end <= columnStart + tolerance || start <= columnStart + tolerance * 0.65;
  return start >= columnEnd - tolerance || end >= columnEnd - tolerance * 0.65;
}

function twoColumnEquationSupplementCandidates(lines, page, side = equationNumberingSide) {
  const pageOcrConfidence = equationOcrPageConfidence(page);
  const out = [];
  const targetColumn = side === 'left' ? 1 : 0;
  const referenceProse = /\b(?:equation|eq\.?|see|from|by|using|satisfies|implies|according\s+to|as\s+in|in\s+view\s+of|contradicts?|rewrit(?:e|ten)|follows?\s+from|inequality\s+(?:like|in)|as\s+required|cf\.?|recall|apply(?:ing)?|combin(?:e|ing)|substitut(?:e|ing)|insert|notice)\b/i;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line?.equationTwoColumn || line.equationColumnIndex !== targetColumn) continue;
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
        bareSource: Boolean(candidate.bare),
        explicitParenthesized: !candidate.bare,
        candidateAtLineStart: !String(line.text || '').slice(0, Math.max(0, Number(candidate.index) || 0)).trim(),
        candidateAtLineEnd: !String(line.text || '').slice(Math.max(0, Number(candidate.end) || 0)).trim(),
        standaloneTag: isStandaloneEquationTagLine(line, candidate.label),
        nearbyDisplayMath: hasNearbyDisplayMath(lines, lineIndex),
        mathSignals: equationLineMathSignalCount(line.text),
        ocrSource: Boolean(line.ocrSource),
        ocrLineConfidence: Number.isFinite(line.confidence) ? Number(line.confidence) : null,
        ocrPageConfidence: Number.isFinite(pageOcrConfidence) ? Number(pageOcrConfidence) : null,
        attachedFunctionCall: Boolean(candidate.attachedFunctionCall),
        enumeratedConditionList: equationEnumeratedConditionListContext(lines, lineIndex, candidate),
        equationTwoColumn: true,
        equationColumnIndex: targetColumn,
        equationColumnStartRatio: line.equationColumnStartRatio,
        equationColumnEndRatio: line.equationColumnEndRatio,
      };
      const tagAtLocalMargin = side === 'left' ? record.candidateAtLineStart : record.candidateAtLineEnd;
      if (record.attachedFunctionCall) continue;
      if (record.bareSource && (bareEquationInTabularRow(lines, lineIndex) || bareEquationHasMeasurementSuffix(line, candidate))) continue;
      if (!tagAtLocalMargin || !equationCandidateAlignedToLocalColumnSide(record, side)) continue;
      if (referenceProse.test(String(record.text || ''))) continue;
      if (record.bareSource) {
        const extremeTopBareMarker = record.standaloneTag
          && (Number(record.ratio) <= 0.040
            || (!record.nearbyDisplayMath && Number(record.ratio) <= 0.070 && bareEquationHasNearbyHeadingContext(lines, lineIndex)));
        if (extremeTopBareMarker) continue;
        const remainder = String(record.text || '').replace(/^\s*\d+(?:\.\d+)+\s*/, '').trim();
        const words = remainder.match(/\b[A-Za-z]{3,}\b/g) || [];
        const han = remainder.match(/\p{Script=Han}/gu) || [];
        const structuredProse = /^(?:\([ivxlcdm]+\)\s*)?(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|exercise|problem|suppose|let|if|give|prove|show|using|chapter|section)\b/i.test(remainder)
          || words.length >= 3 || han.length >= 4;
        if (structuredProse) continue;
      }
      // A short, one-line display can have just one extracted operator (for
      // example "y ~ M(...). (1)") and no neighboring math line. Its explicit
      // tag still belongs to the *local* column margin, not the physical PDF
      // edge. Require a visible operator, few prose words, and an end tag;
      // do not relax the general margin or inline-reference classifier.
      const shortLocalDisplay = !record.bareSource && record.candidateAtLineEnd
        && record.mathSignals >= 1
        && /[=±×∼≈<>≤≥∈∉∑∫√^_~|]/u.test(String(record.text || ''))
        && (String(record.text || '').match(/[A-Za-z]{3,}/g) || []).length <= 1;
      if (!record.standaloneTag && !record.nearbyDisplayMath && record.mathSignals < 2 && !shortLocalDisplay) continue;
      if ((String(record.text || '').match(/[A-Za-z]{3,}/g) || []).length >= 8 && record.mathSignals < 2) continue;
      record.shortLocalDisplay = shortLocalDisplay;
      record.confidence = Math.max(12, equationTargetScore(record.text, record.label, null, 0, null, Number(record.ratio)) + 7);
      out.push(record);
    }
  }
  return out;
}

function supplementTwoColumnEquations(index, rawPageLines) {
  // Two-column and 2-up mathematical pages can place equation numbers on the
  // local margin of each column/page. The mature detector already sees the
  // physical outer margin. Recover only the corresponding inner local margin:
  // right-numbered documents -> right edge of the left column; left-numbered
  // documents -> left edge of the right column.
  const side = equationNumberingSide === 'left' ? 'left' : 'right';
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
    all.push(...twoColumnEquationSupplementCandidates(split, page, side));
  }
  const unique = [];
  const seen = new Set();
  for (const item of all) {
    const key = `${item.page}:${item.label}`;
    if (seen.has(key) || index.has(item.label)) continue;
    seen.add(key);
    unique.push(item);
  }
  if (!unique.length) return pageProfiles;

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
  // Keep the repeated-candidate requirement for general two-column
  // supplementation. One visibly mathematical *integer* label may stand alone
  // at a local gutter: allow it only when a trusted consecutive integer
  // sequence already establishes exactly which number is missing. This
  // recovers the first equation of a two-column paper without promoting an
  // isolated prose citation or a table's parenthesized decimal.
  let promoted = compatible;
  if (compatible.length < 2) {
    const knownIntegers = new Set(trustedNumeric.filter((item) => !item.prefix).map((item) => item.last));
    const corroborated = compatible.filter((item) => {
      const n = item.numeric?.last;
      if (!item.shortLocalDisplay || item.numeric?.prefix || !Number.isInteger(n) || n < 1) return false;
      const nearSuccessors = [...knownIntegers].filter((value) => value > n && value <= n + 6);
      const supportedLeadingGap = knownIntegers.has(n + 1) && nearSuccessors.length >= 3
        && [...knownIntegers].every((value) => value > n);
      return (knownIntegers.has(n + 1) && knownIntegers.has(n + 2))
        || (knownIntegers.has(n - 1) && knownIntegers.has(n + 1))
        || supportedLeadingGap;
    });
    if (corroborated.length !== 1) return pageProfiles;
    promoted = corroborated;
  }
  for (const item of promoted) index.set(item.label, [item]);

  return pageProfiles;
}

function annotateEquationColumnsForOrder(index, pageProfiles) {
  if (!(pageProfiles instanceof Map) || !pageProfiles.size) return;
  // The supplementary tag already knows its *local* column. Do not overwrite
  // that fact just because the left-column gutter happens to lie within the
  // right-column start tolerance (e.g. the first (1) of a two-column paper).
  // For trusted native labels, classify by the physical token's own bounds,
  // rather than assigning every label on the page to the outer column.
  for (const candidates of index.values()) {
    for (const candidate of candidates || []) {
      const profile = pageProfiles.get(Number(candidate?.page));
      if (!profile) continue;
      if (candidate.equationTwoColumn && Number.isInteger(candidate.equationColumnIndex)) continue;
      const start = Number(candidate?.candidateXStartRatio ?? candidate?.xStartRatio);
      const end = Number(candidate?.candidateXEndRatio ?? candidate?.xEndRatio);
      if (![start, end, profile.leftEnd, profile.rightStart].every(Number.isFinite)) continue;
      const gap = profile.rightStart - profile.leftEnd;
      if (gap <= 0) continue;
      // A small tolerance accommodates fonts whose bounding boxes barely
      // overrun a column, but never use a broad tolerance that crosses the
      // gutter and moves a left-column label after right-column equations.
      let columnIndex = null;
      if (end <= profile.leftEnd + Math.min(0.012, gap * 0.35)) columnIndex = 0;
      else if (start >= profile.rightStart - Math.min(0.012, gap * 0.35)) columnIndex = 1;
      if (columnIndex === null) continue;
      candidate.equationTwoColumn = true;
      candidate.equationColumnIndex = columnIndex;
      candidate.equationColumnStartRatio = columnIndex === 0 ? profile.leftStart : profile.rightStart;
      candidate.equationColumnEndRatio = columnIndex === 0 ? profile.leftEnd : profile.rightEnd;
    }
  }
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

function equationCandidateAttachedToFunctionCall(source, index) {
  const prefix = String(source || '').slice(0, Math.max(0, Number(index) || 0));
  if (!prefix) return false;
  // A gapless parenthesis immediately following an identifier is function
  // application (g(1), f_1(2), Γ(3), h′(4)), not a margin equation tag.
  // PDF.js inserts a space between separate text items, so a genuine detached
  // equation number such as "... = 0 (1)" remains on the normal path.
  return /(?:[\p{L}\p{N}_\]}'’′]|\\[A-Za-z]+)$/u.test(prefix);
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
    out.push({
      label,
      index: match.index,
      end: match.index + match[0].length,
      attachedFunctionCall: Boolean(numeric && equationCandidateAttachedToFunctionCall(source, match.index)),
    });
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
    if (/^[A-Z]{4,}(?:\s+[A-Z]{3,})*[.:]?$/u.test(text) && asciiWords.length >= 1) return true;
    if (/^[A-Z]/.test(text) && asciiWords.length >= 2 && titleCaseWords.length >= 1) return true;
  }
  return false;
}

function bareEquationHasSameRowHeadingContext(lines, lineIndex) {
  const line = lines?.[lineIndex];
  if (!line) return false;
  const ratio = Number(line.ratio);
  const lineEnd = Number(line.xEndRatio);
  for (let index = 0; index < (lines || []).length; index += 1) {
    if (index === lineIndex) continue;
    const other = lines[index];
    const otherRatio = Number(other?.ratio);
    if (!Number.isFinite(ratio) || !Number.isFinite(otherRatio) || Math.abs(otherRatio - ratio) > 0.0045) continue;
    const otherStart = Number(other?.xStartRatio);
    if (Number.isFinite(lineEnd) && Number.isFinite(otherStart) && otherStart < lineEnd - 0.01) continue;
    const text = String(other?.text || '').trim();
    if (!text || equationLineMathSignalCount(text) >= 2 || /[.!?。！？]$/.test(text)) continue;
    const asciiWords = text.match(/\b[A-Za-z]{3,}\b/g) || [];
    const titleCaseWords = text.match(/\b[A-Z][A-Za-z]{2,}\b/g) || [];
    const hanChars = text.match(/\p{Script=Han}/gu) || [];
    if (hanChars.length >= 3) return true;
    // Fragmented CJK subsection headings may contain only two characters
    // (e.g. a compact topic name). Require close physical continuation on
    // the same baseline, never a separate display-math line.
    if (hanChars.length >= 2 && text.length <= 24
      && Number.isFinite(lineEnd) && Number.isFinite(otherStart)
      && otherStart - lineEnd <= 0.09) return true;
    if (/^[A-Z]{4,}(?:\s+[A-Z]{3,})*[.:]?$/u.test(text) && asciiWords.length >= 1) return true;
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

// Plot axes frequently expose decimal ticks as separate text lines, one per
// horizontal scan row. A same-row tabular guard cannot see this vertical run.
// Reject only a tightly spaced, monotonically ordered group of >=4 small
// decimals at the same horizontal coordinate; isolated old-paper bare dotted
// equation labels remain eligible for the existing margin/math checks.
function bareEquationInVerticalNumericTicks(lines, lineIndex) {
  const current = lines?.[lineIndex];
  const valueText = String(current?.text || '').trim();
  if (!/^0\.\d{1,3}$/.test(valueText)) return false;
  const center = (Number(current?.xStartRatio) + Number(current?.xEndRatio)) / 2;
  const ratio = Number(current?.ratio);
  if (!Number.isFinite(center) || !Number.isFinite(ratio)) return false;
  const ticks = (lines || []).filter((other) => {
    const text = String(other?.text || '').trim();
    const start = Number(other?.xStartRatio); const end = Number(other?.xEndRatio);
    const y = Number(other?.ratio);
    return /^0\.\d{1,3}$/.test(text)
      && Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(y)
      && Math.abs((start + end) / 2 - center) <= 0.012
      && Math.abs(y - ratio) <= 0.09;
  }).map((line) => ({ ratio: Number(line.ratio), value: Number(line.text) }))
    .sort((a, b) => a.ratio - b.ratio);
  for (let start = 0; start < ticks.length; start += 1) {
    const run = [ticks[start]];
    for (let next = start + 1; next < ticks.length; next += 1) {
      const delta = ticks[next].ratio - ticks[next - 1].ratio;
      if (delta < 0.0025 || delta > 0.025) break;
      run.push(ticks[next]);
      if (run.length >= 4
        && run.some((item) => Math.abs(item.ratio - ratio) < 0.00001)
        && (run.every((item, index) => index === 0 || item.value < run[index - 1].value)
          || run.every((item, index) => index === 0 || item.value > run[index - 1].value))) {
        // Equally spaced scale ticks, not arbitrary changing measurements in a
        // technical table. Require comparable numeric steps as well as y steps.
        const numericSteps = run.slice(1).map((item, i) => Math.abs(item.value - run[i].value));
        const smallestStep = Math.min(...numericSteps);
        if (smallestStep > 0.00001 && Math.max(...numericSteps) / smallestStep <= 1.25) return true;
      }
    }
  }
  return false;
}

function bareEquationHasMeasurementSuffix(line, candidate) {
  if (!candidate?.bare) return false;
  const source = String(line?.text || '').normalize('NFKC');
  const before = source.slice(0, Math.max(0, Number(candidate?.index) || 0)).trim();
  if (before) return false;
  const remainder = source.slice(Math.max(0, Number(candidate?.end) || 0)).trim();
  if (!remainder) return false;
  // Technical/performance tables often begin with a decimal measurement such as
  // "1.242 s / 22.8% faster" or "1.40 GiB/s".  A bare dotted token in this
  // position is a value, not a lost-parenthesis equation label.  Keep the unit
  // vocabulary deliberately narrow so old journal tags remain eligible.
  return /^(?:%|(?:ns|us|µs|ms|sec|secs|second|seconds|s|KB|MB|GB|KiB|MiB|GiB|B|Hz|kHz|MHz|GHz|fps)\b)/i.test(remainder);
}

function bareEquationInTabularRow(lines, lineIndex) {
  const line = lines[lineIndex];
  if (!line) return false;
  const compact = String(line.text || '').trim().replace(/\s+/g, ' ');
  // This guard is only for a bare numeric cell (optionally followed by a short
  // measurement unit). Parenthesized margin labels never enter this path.
  if (!/^[+-]?\d+(?:\.\d+)?(?:\s*(?:ms|s|sec|µs|us|ns|%|MB|GB|KB|MiB|GiB))?$/i.test(compact)) return false;
  const ratio = Number(line.ratio);
  const row = [];
  for (const other of lines || []) {
    const otherRatio = Number(other?.ratio);
    if (Number.isFinite(ratio) && Number.isFinite(otherRatio) && Math.abs(otherRatio - ratio) > 0.0045) continue;
    const text = String(other?.text || '').trim().replace(/\s+/g, ' ');
    const start = Number(other?.xStartRatio); const end = Number(other?.xEndRatio);
    if (!text || text.length > 40 || !Number.isFinite(start) || !Number.isFinite(end)) continue;
    row.push({ text, center: (start + end) / 2, math: equationLineMathSignalCount(text) });
  }
  if (row.length < 3 || row.some((cell) => cell.math >= 2)) return false;
  const spread = Math.max(...row.map((cell) => cell.center)) - Math.min(...row.map((cell) => cell.center));
  if (spread < 0.18) return false;
  const numericCells = row.filter((cell) => /^[+-]?\d+(?:\.\d+)?(?:\s*(?:ms|s|sec|µs|us|ns|%|MB|GB|KB|MiB|GiB))?$/i.test(cell.text)).length;
  const plainKeyCell = row.some((cell) => /^[A-Za-z][A-Za-z0-9_.+\-]*(?:\([^)]{0,24}\))?$/.test(cell.text));
  return numericCells >= 3 || (numericCells >= 2 && plainKeyCell);
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

function legacyBareEquationMathLead(item) {
  if (!item?.bareSource || !item?.candidateAtLineStart || !item?.numeric?.prefix) return false;
  if (item?.nearbyHeadingContext || item?.axisNumericCluster || item?.tabularNumericCell) return false;
  if (Number(item?.candidateXEndRatio) > 0.24) return false;
  const text = String(item?.text || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const remainder = text.replace(/^\s*\d{1,3}\s*(?:[.．]\s*\d{1,3}){1,4}\s*[.:)]?\s*/u, '');
  if (!remainder || /(?:\.\s*){3,}/.test(remainder)) return false;
  const lead = remainder.slice(0, 72);
  const mathematicalLead = /^(?:[A-Z]\s*(?:\(|\b)|spt\b|lim\b|sup\b|inf\b|det\b|tr\b|div\b|grad\b)/.test(lead);
  const visibleMath = /[=<>≤≥∈∉⊂⊃∩∪∑∫√^~{}()[\]|+]/u.test(lead);
  return mathematicalLead && visibleMath;
}

function inferEquationNumberingSide(records) {
  let leftScore = 0;
  let rightScore = 0;
  for (const item of records || []) {
    const start = Number(item.candidateXStartRatio);
    const end = Number(item.candidateXEndRatio);
    const contextStrong = Boolean(item.standaloneTag || item.nearbyDisplayMath || item.mathSignals >= 2 || legacyBareEquationMathLead(item));
    if (!contextStrong) continue;
    if (item.ocrSource && !item.standaloneTag && !item.candidateAtLineStart && !item.candidateAtLineEnd) continue;
    const weight = item.numeric && item.numeric.prefix ? 2 : 1.5;
    if ((Number.isFinite(end) && end <= 0.34) || (Number.isFinite(start) && start <= 0.28)) leftScore += weight;
    if ((Number.isFinite(start) && start >= 0.62) || (Number.isFinite(end) && end >= 0.74)) rightScore += weight;
  }
  if (leftScore >= 4 && leftScore > rightScore * 1.35) return 'left';
  return 'right';
}

function equationReferenceProseContext(text) {
  const source = String(text || '').normalize('NFKC');
  if (!source) return false;
  // A parenthesized number can sit exactly on the inferred numbering edge when
  // an old PDF's text layer wraps prose into a short visual line. Geometry is
  // therefore not sufficient by itself. Reject only explicit lexical contexts
  // that grammatically *refer to* an equation; genuine display tags normally
  // sit beside formula text rather than after "properties", "expansion", "of",
  // etc., or before a prose continuation such as "we have" / "this shows".
  const tag = String.raw`[（(]\s*\d{1,4}\s*(?:(?:[.．]\s*\d{1,4})+|(?:[-－]\s*\d{1,4})+)?\s*[)）]`;
  const before = new RegExp(String.raw`\b(?:equation|eq\.?|see|from|by|using|according\s+to|as\s+in|in\s+view\s+of|follows?\s+from|recall(?:ing)?|substitut(?:e|ing)|insert(?:ing)?|apply(?:ing)?|combin(?:e|ing)|properties?|assumptions?|hypotheses?|requirements?|expansion|formula|identity|estimate|relation|conditions?|case|version|form|of|into)\s*${tag}`, 'i');
  const after = new RegExp(String.raw`${tag}\s*(?:[.,;:]\s*)?(?:and|or|but|then|hence|therefore|thus|where|which|that|is|are|was|were|holds?|gives?|implies?|shows?|yields?|we|this|it)\b`, 'i');
  return before.test(source) || after.test(source);
}

function equationEnumeratedConditionListContext(lines, lineIndex, candidate) {
  const line = lines?.[lineIndex];
  if (!line || candidate?.bare) return false;
  const parsed = parsedEquationNumber(candidate?.label);
  if (!parsed || parsed.prefix) return false;
  const before = String(line.text || '').slice(0, Math.max(0, Number(candidate?.index) || 0)).trim();
  if (before) return false;
  const currentNumber = Number(parsed.last);
  const currentRatio = Number(line.ratio);
  const currentX = Number(line.xStartRatio);
  if (!Number.isInteger(currentNumber) || !Number.isFinite(currentRatio) || !Number.isFinite(currentX)) return false;

  const nearby = [];
  for (const sibling of lines || []) {
    const ratio = Number(sibling?.ratio);
    const x = Number(sibling?.xStartRatio);
    if (!Number.isFinite(ratio) || !Number.isFinite(x)) continue;
    if (Math.abs(ratio - currentRatio) > 0.13 || Math.abs(x - currentX) > 0.045) continue;
    const match = String(sibling?.text || '').match(/^\s*[（(]\s*(\d{1,2})\s*[)）]\s*(.*)$/u);
    if (!match) continue;
    const number = Number(match[1]);
    if (!Number.isInteger(number) || Math.abs(number - currentNumber) > 5) continue;
    const tail = String(match[2] || '').trim();
    const han = tail.match(/\p{Script=Han}/gu) || [];
    const words = tail.match(/\b[A-Za-z]{3,}\b/g) || [];
    nearby.push({
      number,
      proseLike: han.length >= 2 || words.length >= 3,
      punctuated: /[;；]\s*$/.test(tail),
    });
  }
  const unique = [...new Map(nearby.map((item) => [item.number, item])).values()].sort((a, b) => a.number - b.number);
  for (let start = 0; start < unique.length; start += 1) {
    let end = start;
    while (end + 1 < unique.length && unique[end + 1].number === unique[end].number + 1) end += 1;
    const run = unique.slice(start, end + 1);
    if (run.length >= 3 && run.some((item) => item.number === currentNumber)) {
      const proseCount = run.filter((item) => item.proseLike).length;
      const punctuatedCount = run.filter((item) => item.punctuated).length;
      if (proseCount >= 2 || (proseCount >= 1 && punctuatedCount >= 2)) return true;
    }
    start = end;
  }
  return false;
}

function equationCandidateConfidenceForSide(item, allowExplicitReferenceContext = false) {
  if (item?.attachedFunctionCall || item?.enumeratedConditionList) return -Infinity;
  const text = String(item?.text || '').trim();
  const label = normalizedEquationLabel(item?.label || '');
  if (!text || !label || isLikelyCalendarYearEquationLabel(label)) return -Infinity;
  const compact = text.replace(/\s+/g, '').normalize('NFKC');
  const isOnlyTag = compact === label || compact === label.slice(1, -1);
  const mathSignals = Number(item.mathSignals) || 0;
  const aligned = equationCandidateAlignedToNumberingSide(item);
  const legacyBareMathLead = legacyBareEquationMathLead(item);
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
  const explicitReferenceContext = Boolean(parsed && item?.explicitParenthesized && equationReferenceProseContext(text));
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
  const shortNumberedProseHeading = Boolean(
    integerTag
    && item?.explicitParenthesized
    && item?.candidateAtLineStart
    && !item?.candidateAtLineEnd
    && mathSignals === 0
    && !item?.nearbyDisplayMath
    && /^\s*[A-Za-z]{4,}(?:\s+[A-Za-z]{2,})?\s*[.:]?\s*$/.test(leadingIntegerRemainder)
  );
  const punctuatedStandaloneIntegerList = Boolean(
    integerTag
    && item?.explicitParenthesized
    && item?.candidateAtLineStart
    && !item?.candidateAtLineEnd
    && mathSignals === 0
    && !item?.nearbyDisplayMath
    && /^\s*[.:;]\s*$/.test(leadingIntegerRemainder)
  );
  if (shortNumberedProseHeading || punctuatedStandaloneIntegerList) return -Infinity;
  // A parenthesized token embedded inside formula text is not the printed margin tag.
  // Old PDF text layers can expose exponent fragments such as \(3-2) or symbolic
  // operators such as (*) at the physical margin; require non-standalone tags to
  // occupy the inferred textual numbering edge before they can become targets.
  if (item?.explicitParenthesized && !item?.standaloneTag && !onNumberingEdge) return -Infinity;
  if (explicitReferenceContext && !isOnlyTag && !allowExplicitReferenceContext) return -Infinity;
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
  if (item?.bareSource && item?.standaloneTag && !strongMarginGeometry && !item?.nearbyDisplayMath) return -Infinity;
  // A visible parenthesized tag already placed on the inferred equation-number
  // margin is strong target evidence by itself. Older/scanned PDF text layers
  // often lose the formula operators, so requiring extracted math glyphs here
  // made the Equation index disagree with MathReader's clickable label layer.
  if (mathSignals === 0 && !(isOnlyTag && aligned) && !explicitMarginTag && !(legacyBareMathLead && aligned)) return -Infinity;
  if (proseHeavy && !(isOnlyTag && aligned) && !explicitMarginTag) return -Infinity;
  if (referenceProse && !isOnlyTag && mathSignals < 2) return -Infinity;
  if (bibliographyLike && mathSignals < 2) return -Infinity;
  if (bareStructuredProse && !legacyBareMathLead) return -Infinity;
  if (bareHeadingLike && mathSignals < 2 && !legacyBareMathLead) return -Infinity;
  let confidence = equationTargetScore(text, label, null, 0, null, Number(item.ratio));
  if (mathSignals >= 2) confidence += 5;
  else if (mathSignals === 1) confidence += 2;
  if (aligned) confidence += 7;
  if (isOnlyTag && aligned) confidence += 5;
  if (explicitMarginTag) confidence += 6;
  if (legacyBareMathLead && aligned) confidence += 4;
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
    const confirmedLocalIntegerFamily = candidates.some((item) => Boolean(item?.confirmedLocalIntegerFamily));
    numericEntries.push({ label, parsed, ocrSourced, confirmedLocalIntegerFamily });
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
    for (const { label, parsed, ocrSourced, confirmedLocalIntegerFamily } of numericEntries) {
      if (!parsed.prefix && ocrSourced && !confirmedLocalIntegerFamily) index.delete(label);
    }
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
  for (const { label, parsed, confirmedLocalIntegerFamily } of numericEntries) {
    if (!parsed.prefix && !confirmedLocalIntegerFamily) index.delete(label);
  }
  return index;
}

function suppressSparseAmbiguousOcrEquationFamilies(index) {
  // Reapply OCR reliability at the final index boundary because later
  // supplementation/recovery passes can otherwise resurrect a candidate that
  // the primary classifier rejected on a low-quality page. Clean handwritten
  // pages can also receive deceptively strong page confidence while
  // hallucinating one or two parenthesized numbers. Prefer an empty index to a
  // precise-looking false target when there is no document-level numbering
  // family behind such ambiguous OCR evidence.
  for (const [label, records] of [...index.entries()]) {
    if (!parsedEquationNumber(label)) continue;
    const kept = (records || []).filter((record) => {
      // Apply this geometry safeguard to both OCR and native hidden-text
      // candidates. Late two-column recovery can otherwise resurrect a bare
      // section/page marker that the primary classifier already rejected.
      if (record?.bareSource && record?.standaloneTag && Number(record?.ratio) <= 0.040) return false;
      if (!record?.ocrSource || record?.nativeGapCorroborated) return true;
      const pageConfidence = Number(record.ocrPageConfidence);
      // Keep the v316 page-quality contract authoritative even after
      // two-column supplementation and sequence recovery.
      if (Number.isFinite(pageConfidence) && pageConfidence < 50) return false;
      // A bare dotted/hyphen token at the extreme top edge with no nearby
      // display math is a running page/section marker, not an equation target.
      if (record.bareSource && record.standaloneTag && Number(record.ratio) <= 0.035 && !record.nearbyDisplayMath) return false;
      return true;
    });
    if (kept.length) index.set(label, kept);
    else index.delete(label);
  }

  // Determine numbering-family support only after the final reliability pass;
  // candidates that were just rejected must not make a surviving hallucination
  // look like part of a real document-wide sequence.
  const ocrNumericLabels = new Set();
  for (const [label, records] of index) {
    if (!parsedEquationNumber(label)) continue;
    if ((records || []).some((record) => record?.ocrSource)) ocrNumericLabels.add(label);
  }
  if (ocrNumericLabels.size >= 3) return;

  for (const [label, records] of [...index.entries()]) {
    if (!parsedEquationNumber(label)) continue;
    const kept = (records || []).filter((record) => {
      if (!record?.ocrSource || record?.nativeGapCorroborated) return true;
      const pageConfidence = Number(record.ocrPageConfidence);
      // Mid-confidence OCR is usable, but one or two non-standalone numeric
      // labels are too weak to establish an equation-numbering system.
      if (!record.standaloneTag && Number.isFinite(pageConfidence) && pageConfidence < 65) return false;
      // A full-page scan can OCR a mathematical exponent as "(2)" on an
      // interior display line. If the entire OCR document has fewer than three
      // distinct numeric labels, a non-standalone integer tag needs the outer
      // equation margin or an independently established local-column family.
      // Nearby mathematical symbols alone are not enough: they are exactly
      // what makes a formula exponent look like a numbered display.
      const pureInteger = Boolean(parsedEquationNumber(label) && !parsedEquationNumber(label).prefix);
      const strongOuterEdge = equationNumberingSide === 'left'
        ? Number(record.candidateXEndRatio) <= 0.19
        : Number(record.candidateXStartRatio) >= 0.82;
      if (pureInteger && !record.standaloneTag && !record.confirmedLocalIntegerFamily
          && !record.equationTwoColumn && !strongOuterEdge) return false;
      // Even an isolated parenthesized token can look convincing on clean
      // handwriting. Without a numbering family, retain it only when the
      // existing equation-confidence model supplies strong independent support.
      if (record.standaloneTag && Number(record.confidence) < 30) return false;
      return true;
    });
    if (kept.length) index.set(label, kept);
    else index.delete(label);
  }
}
function suppressSparseAmbiguousNativeBareEquationFamilies(index) {
  // A scan-backed/hidden text layer can expose ordinary decimal values as
  // standalone tokens.  Do not let one or two unsupported interior decimals
  // establish an Equation numbering system merely because they happen to look
  // like dotted labels.  Preserve real small documents when the tag is on the
  // strong outer numbering margin, has nearby display math, or has any
  // explicit/strong equation evidence.
  const numeric = [];
  let strongEvidence = 0;
  for (const [label, records] of index.entries()) {
    if (!parsedEquationNumber(label)) continue;
    numeric.push({ label, records: records || [] });
    if ((records || []).some((record) => (
      record?.ocrSource
      || record?.explicitParenthesized
      || record?.nearbyDisplayMath
      || (Number(record?.mathSignals) || 0) >= 2
      || !record?.bareSource
      || !record?.standaloneTag
    ))) strongEvidence += 1;
  }
  if (!numeric.length || numeric.length > 2 || strongEvidence > 0) return index;
  for (const { label, records } of numeric) {
    const allUnsupportedInteriorBare = records.length > 0 && records.every((record) => {
      if (record?.ocrSource || !record?.bareSource || !record?.standaloneTag || record?.nearbyDisplayMath || (Number(record?.mathSignals) || 0) > 0) return false;
      const strongOuterMargin = equationNumberingSide === 'left'
        ? Number(record?.candidateXEndRatio) <= 0.16
        : Number(record?.candidateXStartRatio) >= 0.87;
      return !strongOuterMargin;
    });
    if (allUnsupportedInteriorBare) index.delete(label);
  }
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



function equationNativeImageGapPlan(index, pageCount, referenceEvidence = []) {
  const byPrefix = new Map();
  for (const [label, candidates] of index.entries()) {
    const parsed = parsedEquationNumber(label);
    if (!parsed || !Number.isInteger(parsed.last) || parsed.last < 1) continue;
    const candidate = chooseCanonicalEquationCandidate(candidates);
    if (!candidate || candidate.ocrSource) continue;
    const familyKey = parsed.prefix ? `prefix:${parsed.prefix}` : 'integer';
    const list = byPrefix.get(familyKey) || [];
    list.push({ label, parsed, candidate });
    byPrefix.set(familyKey, list);
  }

  const expectedByPage = new Map();
  const baselinePriorityPages = new Set();
  const addExpected = (pageNum, label, baselinePriority = false) => {
    const page = Number(pageNum);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) return;
    const labels = expectedByPage.get(page) || new Set();
    labels.add(label);
    expectedByPage.set(page, labels);
    if (baselinePriority) baselinePriorityPages.add(page);
  };
  const expectedLabel = (parsed, last) => parsed.prefix
    ? `(${parsed.prefix}${parsed.separator || '.'}${last})`
    : `(${last})`;

  for (const entries0 of byPrefix.values()) {
    if (entries0.length < 4) continue;
    const byLast = new Map();
    const entries = [...entries0].sort((a, b) => equationDocumentPosition(a.candidate) - equationDocumentPosition(b.candidate));
    for (const entry of entries) if (!byLast.has(entry.parsed.last)) byLast.set(entry.parsed.last, entry);
    const family = [...byLast.values()].sort((a, b) => equationDocumentPosition(a.candidate) - equationDocumentPosition(b.candidate));
    if (family.length < 4) continue;

    const first = family[0];
    const integerFamily = !first.parsed.prefix;
    if (integerFamily) {
      const numbers = family.map((entry) => entry.parsed.last);
      const span = Math.max(...numbers) - Math.min(...numbers) + 1;
      const establishedIntegerFamily = family.length >= 8 && Math.min(...numbers) <= 2 && Math.max(...numbers) >= 8 && span <= family.length + 3;
      if (!establishedIntegerFamily) continue;
      for (let i = 0; i + 1 < family.length; i += 1) {
        const left = family[i];
        const right = family[i + 1];
        if (right.parsed.last - left.parsed.last !== 2) continue;
        const pageDelta = Number(right.candidate.page) - Number(left.candidate.page);
        if (pageDelta < 0 || pageDelta > 1) continue;
        const missingLabel = expectedLabel(left.parsed, left.parsed.last + 1);
        addExpected(right.candidate.page, missingLabel);
        if (pageDelta === 0) addExpected(left.candidate.page, missingLabel);
      }
      continue;
    }

    if ((first.parsed.last >= 3 && first.parsed.last <= 4) || (first.parsed.last === 2 && family.length >= 5)) {
      // A mature family beginning at .3/.4 is strong evidence that the first
      // one to three printed labels may have disappeared from the hidden text
      // layer. Consult only the first anchor page and its immediate predecessor;
      // image OCR must still read the exact missing label before it is added.
      for (let missing = 1; missing < first.parsed.last; missing += 1) {
        const label = expectedLabel(first.parsed, missing);
        addExpected(first.candidate.page, label, true);
        addExpected(Number(first.candidate.page) - 1, label, true);
      }
    }

    for (let i = 0; i + 1 < family.length; i += 1) {
      const left = family[i];
      const right = family[i + 1];
      const gap = right.parsed.last - left.parsed.last;
      const leftPage = Number(left.candidate.page);
      const rightPage = Number(right.candidate.page);
      const pageDelta = rightPage - leftPage;
      const ordinaryGap = gap >= 2 && gap <= 4 && pageDelta >= 0 && pageDelta <= 2;
      const establishedLongGap = gap >= 5 && gap <= 12 && family.length >= 10 && pageDelta >= 0 && pageDelta <= 5;
      if (!ordinaryGap && !establishedLongGap) continue;
      // Same-page holes stay the primary path. Established scan-backed families
      // may lose a longer run from the hidden text layer; image OCR still has
      // to read every exact label on the equation-number margin before adding it.
      if (pageDelta > 0 && family.length < 4) continue;
      for (let missing = left.parsed.last + 1; missing < right.parsed.last; missing += 1) {
        const label = expectedLabel(left.parsed, missing);
        for (let candidatePage = leftPage; candidatePage <= rightPage; candidatePage += 1) {
          addExpected(candidatePage, label, pageDelta === 0);
        }
      }
    }
  }

  // Freeze the legacy/native v326 posterior plan before adding any recovery
  // hints derived from rejected prose references. This keeps the established
  // 24-page OCR budget intact; reference recovery may only add a small,
  // separately bounded supplement and can never crowd out an existing page.
  const byEvidence = (a, b) => (expectedByPage.get(b)?.size || 0) - (expectedByPage.get(a)?.size || 0) || a - b;
  const basePriorityPages = [...expectedByPage.keys()].filter((page) => baselinePriorityPages.has(page)).sort(byEvidence);
  const baseSupplementalPages = [...expectedByPage.keys()].filter((page) => !baselinePriorityPages.has(page)).sort(byEvidence);
  const basePages = [...basePriorityPages, ...baseSupplementalPages].slice(0, 24);

  // A text layer can preserve only an inline prose reference to a printed
  // equation while dropping the real margin tag. Keep such references out of
  // the Equation index, but use the earliest one as a bounded *query* for image
  // OCR. Exact OCR of the missing label is still required before publication.
  // Normally require an established native family or two distinct rejected
  // references. A single reference is also enough when it is a candidate that
  // v326 would itself have indexed; exact image OCR still has to confirm the
  // printed tag. Never do this for bare integer numbering, where prose
  // enumerations are much more ambiguous.
  const referenceRecoveryPages = new Set();
  const referencePageScores = new Map();
  const addReferenceExpected = (pageNum, label, distance) => {
    const page = Number(pageNum);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) return;
    addExpected(page, label);
    referenceRecoveryPages.add(page);
    // Prefer pages supported by several rejected labels, then the pages nearest
    // to the prose reference. The exact label still has to be read by OCR.
    const score = Math.max(1, 3 - Number(distance || 0));
    referencePageScores.set(page, (referencePageScores.get(page) || 0) + score);
  };
  const referenceFamilies = new Map();
  for (const record of referenceEvidence || []) {
    const parsed = record?.numeric || parsedEquationNumber(record?.label);
    if (!parsed?.prefix || !Number.isInteger(parsed.last)) continue;
    const key = `prefix:${parsed.prefix}`;
    const byLabel = referenceFamilies.get(key) || new Map();
    const existing = byLabel.get(record.label);
    if (!existing || equationDocumentPosition(record) < equationDocumentPosition(existing)) byLabel.set(record.label, record);
    referenceFamilies.set(key, byLabel);
  }
  for (const [familyKey, byLabel] of referenceFamilies) {
    const nativeCount = new Set((byPrefix.get(familyKey) || []).map((entry) => entry.label)).size;
    const strongRejectedReference = [...byLabel.values()].some((record) => Boolean(record.referenceRecoveryStrong));
    if (nativeCount < 2 && byLabel.size < 2 && !strongRejectedReference) continue;
    for (const [label, record] of byLabel) {
      if (index.has(label)) continue;
      const referencePage = Number(record.page);
      if (!Number.isInteger(referencePage)) continue;
      // In old journal scans the printed tag is normally on the same page as
      // its first surviving prose reference or on one of the two preceding
      // pages. Wider windows add cost without useful localization evidence.
      for (let distance = 0; distance <= 2; distance += 1) {
        addReferenceExpected(referencePage - distance, label, distance);
      }
    }
  }

  // Preserve every page selected by the v326/native gap plan. A document with
  // strong rejected-reference evidence may add at most twelve tightly localized
  // pages (three pages per reference cluster in the common case), so the
  // posterior image pass remains bounded and previous recovery coverage is not
  // displaced.
  const basePageSet = new Set(basePages);
  const referencePages = [...referenceRecoveryPages]
    .filter((page) => !basePageSet.has(page))
    .sort((a, b) => (referencePageScores.get(b) || 0) - (referencePageScores.get(a) || 0) || a - b)
    .slice(0, 12);
  const pages = [...new Set([...basePages, ...referencePages])].sort((a, b) => a - b);
  const allowedPages = new Set(pages);
  for (const page of [...expectedByPage.keys()]) if (!allowedPages.has(page)) expectedByPage.delete(page);
  return { pages, expectedByPage };
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
  const fraction = Math.min(0.48, Math.max(0.12, Number(marginFraction) || 0.38));
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

// The equation pipeline is progressive: native text completes first, then optional
// selected-page image OCR. These diagnostics describe work performed, NOT 100%
// content-detection accuracy or full-page OCR coverage.
function equationDetectionNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}
function resetEquationDetectionProgress() {
  equationDetectionGeneration += 1;
  equationDetectionProgress = { phase: 'idle' };
  equationDetectionLastPaint = 0;
  updateEquationDetectionStatus(true);
}
function updateEquationDetectionProgress(update, generation = equationDetectionGeneration, force = false) {
  if (generation !== equationDetectionGeneration) return false;
  equationDetectionProgress = { ...equationDetectionProgress, ...update };
  updateEquationDetectionStatus(force);
  return true;
}
function formatEquationDetectionTime(ms) {
  return `${(Math.max(0, Number(ms) || 0) / 1000).toFixed(2)}s`;
}
function equationDetectionSummary(state) {
  const phase = state?.phase || 'idle';
  if (phase === 'idle') return ['', ''];
  // Keep the narrow sidebar a single line. Detailed counts, coverage, and
  // timings remain available on hover rather than widening the contents pane.
  if (phase === 'saved') return [t('Saved · not rescanned', '已保存 · 未重扫'), t('Saved index · not rescanned', '已保存索引 · 尚未重新扫描')];
  if (phase === 'unavailable') return [t('No text · full OCR needed', '无文本 · 需全文 OCR'), t('Text unavailable · full-document OCR required', '文本不可用 · 需要全文 OCR')];
  if (phase === 'failed') return [t('Index failed · see console', '索引失败 · 查看控制台'), t('Equation indexing failed · see console', '公式索引失败 · 请查看控制台')];
  const native = state.nativeTotal > 0
    ? t(`Text ${state.nativeDone || 0}/${state.nativeTotal}`, `文本 ${state.nativeDone || 0}/${state.nativeTotal}`)
    : t('Text scan', '文本扫描');
  const labels = Number.isInteger(state.labels) ? t(`${state.labels} labels`, `${state.labels} 编号`) : '';
  const scanned = Number(state.ocrTotal || 0);
  const ocr = scanned ? t(`image OCR ${state.ocrDone || 0}/${scanned} planned pages`, `图像 OCR ${state.ocrDone || 0}/${scanned} 计划页`) : '';
  const retry = Number(state.retryTotal || 0)
    ? t(`gap retries ${state.retryDone || 0}/${state.retryTotal}`, `缺口重试 ${state.retryDone || 0}/${state.retryTotal}`) : '';
  const gain = scanned ? t(`+${state.recovered || 0} recovered`, `补回 ${state.recovered || 0} 个`) : '';
  const failed = Number(state.failedPages || 0);
  const selected = scanned > 0 && scanned < Number(state.documentPages || 0);
  const head = phase === 'native' ? t('Reading text', '读取文本')
    : phase === 'planning' ? t('Checking for image assistance', '检查图像辅助')
    : phase === 'ocr' ? t('Reading equation margins', '读取公式边缘')
    : phase === 'validating' ? t('Validating recovered labels', '验证补回编号')
    : phase === 'partial' ? t('Finished with OCR issues', '已结束，部分 OCR 失败')
    : t('Automatic check finished', '自动检查已结束');
  const parts = [head, native, ocr, retry, labels, gain];
  if (failed) parts.push(t(`${failed} failed pages`, `${failed} 页失败`));
  if (selected) parts.push(t('selected coverage only', '仅覆盖选定页面'));

  // Prioritize the stage, incomplete/failed coverage, and recovered labels
  // before less urgent counts, so narrow panes truncate the least critical end.
  const shortHead = phase === 'native' ? native
    : phase === 'planning' ? t('OCR plan', 'OCR 计划')
    : phase === 'ocr' ? t(`OCR ${state.ocrDone || 0}/${scanned}`, `OCR ${state.ocrDone || 0}/${scanned}`)
    : phase === 'validating' ? t('Checking', '校验中')
    : phase === 'partial' ? t('OCR partial', 'OCR 部分失败')
    : t('Auto done', '自动检查结束');
  const shortParts = [shortHead];
  if (failed) shortParts.push(t(`${failed} failed`, `${failed} 页失败`));
  if (scanned && phase !== 'ocr') shortParts.push(t(`OCR ${state.ocrDone || 0}/${scanned}`, `OCR ${state.ocrDone || 0}/${scanned}`));
  if (!scanned && phase !== 'native' && state.nativeTotal > 0) shortParts.push(native);
  if (selected) shortParts.push(t('selected', '选页'));
  if (scanned && Number(state.recovered || 0)) shortParts.push(t(`+${state.recovered} recovered`, `补 ${state.recovered}`));
  if (phase === 'ocr' && Number(state.retryTotal || 0)) shortParts.push(t(`retry ${state.retryDone || 0}/${state.retryTotal}`, `重试 ${state.retryDone || 0}/${state.retryTotal}`));
  // The adjacent equation-count badge already shows total labels; do not duplicate it here.

  const detailed = [
    t('Measured local timings (approximate):', '本地测量耗时（近似）：'),
    t(`text ${formatEquationDetectionTime(state.nativeMs)}`, `文本 ${formatEquationDetectionTime(state.nativeMs)}`),
    t(`PDF rendering ${formatEquationDetectionTime(state.renderMs)}`, `PDF 渲染 ${formatEquationDetectionTime(state.renderMs)}`),
    t(`OCR recognition ${formatEquationDetectionTime(state.recognizeMs)}`, `OCR 识别 ${formatEquationDetectionTime(state.recognizeMs)}`),
    t(`OCR worker setup ${formatEquationDetectionTime(state.ocrSetupMs)}`, `OCR 初始化 ${formatEquationDetectionTime(state.ocrSetupMs)}`),
    t(`gap retries ${formatEquationDetectionTime(state.retryMs)}`, `缺口重试 ${formatEquationDetectionTime(state.retryMs)}`),
    t(`UI updates ${formatEquationDetectionTime(state.uiMs)}`, `界面更新 ${formatEquationDetectionTime(state.uiMs)}`),
    t(`index validation ${formatEquationDetectionTime(state.validationMs)}`, `索引校验 ${formatEquationDetectionTime(state.validationMs)}`),
    t(`elapsed ${formatEquationDetectionTime(state.elapsedMs)}`, `总历时 ${formatEquationDetectionTime(state.elapsedMs)}`),
  ];
  return [shortParts.join(' · '), `${parts.filter(Boolean).join(' · ')}\n${detailed.join(' · ')}`];
}
function updateEquationDetectionStatus(force = false) {
  if (!equationDetectionStatus) return;
  const state = equationDetectionProgress;
  const now = equationDetectionNowMs();
  if (!force && now - equationDetectionLastPaint < 400) return;
  equationDetectionLastPaint = now;
  const [message, tooltip] = equationDetectionSummary(state);
  if (equationDetectionStatus.textContent !== message) equationDetectionStatus.textContent = message;
  equationDetectionStatus.title = tooltip;
  equationDetectionStatus.dataset.phase = ['native','planning','ocr','validating'].includes(state.phase)
    ? 'running' : ['failed','partial'].includes(state.phase) ? 'warning' : 'done';
}
function logEquationDetectionTiming(state, sourceKey) {
  // No telemetry or remote calls. One compact console record per finished run.
  console.info('MathReader equation indexing (local timing)', {
    document: String(sourceKey || '').slice(0, 100),
    nativePages: state.nativeDone || 0,
    plannedImagePages: state.ocrTotal || 0,
    processedImagePages: state.ocrDone || 0,
    retries: state.retryDone || 0,
    failedPages: state.failedPages || 0,
    recoveredLabels: state.recovered || 0,
    elapsedMs: Math.round(state.elapsedMs || 0),
    nativeMs: Math.round(state.nativeMs || 0),
    pdfRenderMs: Math.round(state.renderMs || 0),
    ocrRecognitionMs: Math.round(state.recognizeMs || 0),
    ocrSetupMs: Math.round(state.ocrSetupMs || 0),
    numericRetryMs: Math.round(state.retryMs || 0),
    uiUpdateMs: Math.round(state.uiMs || 0),
    validationMs: Math.round(state.validationMs || 0),
  });
}

async function equationMarginOcrLines(sourceDoc, pageNum, side, worker, { marginFraction = 0.28, onTiming = null } = {}) {
  const started = equationDetectionNowMs();
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

  // Equation labels live at the outer edge. A narrow crop is both faster and
  // less likely to OCR inline prose references as candidate labels.
  const cropWidth = Math.max(1, Math.ceil(fullCanvas.width * marginFraction));
  const cropX = side === 'right' ? Math.max(0, fullCanvas.width - cropWidth) : 0;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropWidth;
  cropCanvas.height = fullCanvas.height;
  const cropContext = cropCanvas.getContext('2d', { alpha: false });
  cropContext.fillStyle = '#fff';
  cropContext.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
  cropContext.drawImage(fullCanvas, cropX, 0, cropWidth, fullCanvas.height, 0, 0, cropWidth, fullCanvas.height);

  const rendered = equationDetectionNowMs();
  let result;
  try {
    result = await worker.recognize(cropCanvas, {}, { hocr: true });
  } finally {
    if (typeof onTiming === 'function') {
      try { onTiming({ renderMs: rendered - started, recognizeMs: equationDetectionNowMs() - rendered }); } catch (_) {}
    }
    fullCanvas.width = 1;
    fullCanvas.height = 1;
    cropCanvas.width = 1;
    cropCanvas.height = 1;
  }
  const record = pageRecordFromHocr(result?.data?.hocr || '', result?.data?.text || '', cropWidth, Math.max(1, Math.ceil(viewport.height)), pageNum);
  return (record.lines || []).map((line) => remapEquationMarginOcrLine(line, side, marginFraction));
}

function equationExpectedNumericOcrRecord(line, page, expectedLabel) {
  const numeric = parsedEquationNumber(expectedLabel);
  if (!numeric || !Number.isInteger(numeric.last)) return null;
  const core = numeric.prefix
    ? `${numeric.prefix}${numeric.separator || '.'}${numeric.last}`
    : String(numeric.last);
  const normalizedText = String(line?.text || '')
    .normalize('NFKC')
    .replace(/[．·•]/g, '.')
    .replace(/\s+/g, '');
  if (!normalizedText.includes(core)) return null;
  // The retry OCR is deliberately numeric-only. Require the whole OCR line to
  // reduce to the expected digits, so a nearby page number or second label
  // cannot corroborate the query accidentally. Parentheses may be lost by OCR.
  const observedDigits = normalizedText.replace(/\D/g, '');
  const expectedDigits = core.replace(/\D/g, '');
  if (!expectedDigits || observedDigits !== expectedDigits) return null;
  if (normalizedText.includes('.') !== core.includes('.')) return null;
  const sideAligned = equationNumberingSide === 'left'
    ? Number(line?.xEndRatio || 0) <= 0.22
    : Number(line?.xStartRatio || 0) >= 0.78;
  if (!sideAligned) return null;
  return {
    label: expectedLabel,
    page,
    ratio: Number(line?.ratio || 0),
    text: String(line?.text || ''),
    xStartRatio: Number(line?.xStartRatio || 0),
    xEndRatio: Number(line?.xEndRatio || 0),
    candidateXStartRatio: Number(line?.xStartRatio || 0),
    candidateXEndRatio: Number(line?.xEndRatio || 0),
    numeric,
    bareSource: false,
    sequenceOnly: false,
    explicitParenthesized: /[()]/.test(normalizedText),
    candidateAtLineStart: true,
    candidateAtLineEnd: true,
    standaloneTag: true,
    nearbyDisplayMath: false,
    nearbyHeadingContext: false,
    axisNumericCluster: false,
    mathSignals: 0,
    ocrSource: true,
    supplementalEquationOcr: true,
    numericGapCorroborated: true,
    confidence: 24,
  };
}

function equationSupplementalNumericRetryQueries(records, pageCount) {
  const byPrefix = new Map();
  for (const record of records || []) {
    const parsed = record?.numeric || parsedEquationNumber(record?.label);
    if (!parsed?.prefix || !Number.isInteger(parsed.last)) continue;
    const list = byPrefix.get(parsed.prefix) || [];
    list.push({ record, parsed });
    byPrefix.set(parsed.prefix, list);
  }
  const expectedByPage = new Map();
  const addExpected = (pageNum, label) => {
    const page = Number(pageNum);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) return;
    const labels = expectedByPage.get(page) || new Set();
    labels.add(label);
    expectedByPage.set(page, labels);
  };
  for (const entries0 of byPrefix.values()) {
    const byLabel = new Map();
    for (const item of entries0) {
      const existing = byLabel.get(item.record.label);
      if (!existing || equationDocumentPosition(item.record) < equationDocumentPosition(existing.record)) {
        byLabel.set(item.record.label, item);
      }
    }
    const entries = [...byLabel.values()].sort((a, b) => equationDocumentPosition(a.record) - equationDocumentPosition(b.record));
    if (entries.length < 3) continue;
    for (let i = 0; i + 1 < entries.length; i += 1) {
      const left = entries[i];
      const right = entries[i + 1];
      const gap = right.parsed.last - left.parsed.last;
      const leftPage = Number(left.record.page);
      const rightPage = Number(right.record.page);
      if (gap < 2 || gap > 4 || rightPage < leftPage || rightPage - leftPage > 2) continue;
      for (let missing = left.parsed.last + 1; missing < right.parsed.last; missing += 1) {
        const label = `(${left.parsed.prefix}${left.parsed.separator || '.'}${missing})`;
        for (let page = leftPage; page <= rightPage; page += 1) addExpected(page, label);
      }
    }
  }
  return expectedByPage;
}

function equationSupplementalRecord(line, page, lineIndex, lines, candidate) {
  const numeric = parsedEquationNumber(candidate.label);
  if (!numeric || !Number.isInteger(numeric.last)) return null;
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
    attachedFunctionCall: Boolean(candidate.attachedFunctionCall),
    enumeratedConditionList: equationEnumeratedConditionListContext(lines, lineIndex, candidate),
  };
  if (record.attachedFunctionCall) return null;
  // A crop can start with an inline prose reference and make it look margin-
  // aligned. Keep it only when OCR saw the label as a standalone tag.
  if (!standaloneTag && equationReferenceProseContext(record.text)) return null;
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
  const integerRecords = [];
  for (const record of records || []) {
    const parsed = record?.numeric || parsedEquationNumber(record?.label);
    if (!parsed) continue;
    if (!parsed.prefix) {
      if (record.standaloneTag && equationCandidateAlignedToNumberingSide(record)) integerRecords.push(record);
      continue;
    }
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
    // Full-margin OCR on old scans may itself miss a few faint tags. Require a
    // dense monotone family, but allow a proportional number of OCR holes so a
    // long genuine family (for example 2.1--2.60) is not discarded wholesale.
    const allowedHoles = Math.max(3, Math.ceil(monotone.length * 0.22));
    if (span > monotone.length + allowedHoles) continue;
    accepted.push(...monotone.map((item) => item.candidate));
  }

  // Some papers temporarily use local integer tags inside a numbered section.
  // Promote only consecutive standalone margin tags seen close together in
  // document order. This recovers genuine pairs such as Simon's (1), (2),
  // while sparse OCR noise from years, bibliography keys, or page furniture
  // cannot form an accepted run.
  const integerCanonical = [...new Map(integerRecords.map((record) => [record.label, record])).values()]
    .map((record) => ({ record, parsed: record.numeric || parsedEquationNumber(record.label) }))
    .filter((item) => item.parsed && Number.isInteger(item.parsed.last))
    .sort((a, b) => equationDocumentPosition(a.record) - equationDocumentPosition(b.record));
  let run = [];
  const flushIntegerRun = () => {
    if (run.length >= 2) {
      for (const item of run) item.record.confirmedLocalIntegerFamily = true;
      accepted.push(...run.map((item) => item.record));
    }
    run = [];
  };
  for (const item of integerCanonical) {
    const previous = run[run.length - 1];
    const pageGap = previous ? Number(item.record.page || 0) - Number(previous.record.page || 0) : 0;
    if (!previous || (item.parsed.last === previous.parsed.last + 1 && pageGap >= 0 && pageGap <= 2)) run.push(item);
    else { flushIntegerRun(); run.push(item); }
  }
  flushIntegerRun();
  return accepted;
}

async function supplementEquationIndexFromPageImages(sourceDoc, sourceKey, index, referenceEvidence = [], onProgress = null) {
  if (!sourceDoc?.numPages || documentTextMode !== 'native' || documentOcrActive || documentOcrBusy) return false;

  const pageCount = Math.max(0, Number(sourceDoc.numPages) || 0);
  const gapPlan = equationNativeImageGapPlan(index, pageCount, referenceEvidence);

  // Class-level old-scan rule: when the native PDF is actually image-backed,
  // its hidden text layer is only a hint. On journal-paper sized documents we
  // inventory the whole equation-number margin in the background. This is what
  // closes systematic Yau/Simon/Pisier-style omissions where every second or
  // several consecutive printed labels can be absent from the text layer.
  const imageBacked = await equationDocumentLooksImageBacked(sourceDoc, index);
  let comprehensivePages = [];
  if (imageBacked) {
    if (pageCount <= 120) comprehensivePages = Array.from({ length: pageCount }, (_, i) => i + 1);
    else comprehensivePages = equationSupplementalOcrPagePlan(sourceDoc, index).slice(0, 72);
  }

  const comprehensivePageSet = new Set(comprehensivePages);
  // Exact expected-gap pages are safe to render even for vector/text-backed PDFs:
  // the expected label is only a query and OCR must still read that exact margin
  // label before publication. This closes old reprint/text-layer omissions without
  // enabling broad OCR on ordinary born-digital documents.
  const priorityPages = [...new Set(gapPlan.pages)].sort((a, b) => a - b);
  const priorityPageSet = new Set(priorityPages);
  const pages = [...priorityPages, ...comprehensivePages.filter((page) => !priorityPageSet.has(page))];
  if (!pages.length) return false;
  if (typeof onProgress === 'function') onProgress({ phase: 'ocr', ocrTotal: pages.length, ocrDone: 0, documentPages: pageCount });
  let donePages = 0;
  let failedPages = 0;
  let worker = null;
  let createWorker = null;
  let workerInitFailed = false;
  const ensureWorker = async () => {
    if (worker) return worker;
    if (workerInitFailed) return null;
    const module = await loadDocumentOcrModule();
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return null;
    createWorker = createWorker || documentOcrCreateWorker(module);
    if (typeof createWorker !== 'function') { workerInitFailed = true; return null; }
    const setupStarted = equationDetectionNowMs();
    try {
      worker = await createWorker('eng', 1, { logger: () => {} });
    } catch (error) {
      workerInitFailed = true;
      throw error;
    }
    if (typeof onProgress === 'function') onProgress({ setupMs: equationDetectionNowMs() - setupStarted });
    if (typeof worker.setParameters === 'function') {
      try {
        await worker.setParameters({
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          tessedit_pageseg_mode: '11',
        });
      } catch (_) {}
    }
    return worker;
  };

  const cachedLinesForPage = async (pageNum) => {
    const cacheKey = `${String(sourceKey || '')}|${equationNumberingSide}|${pageNum}`;
    const cached = equationSupplementalOcrCache.get(cacheKey);
    if (Array.isArray(cached)) return cached;
    if (cached && typeof cached.then === 'function') return cached;
    const activeWorker = await ensureWorker();
    if (!activeWorker) throw new Error('Equation OCR worker unavailable');
    const pending = equationMarginOcrLines(sourceDoc, pageNum, equationNumberingSide, activeWorker, { onTiming: (measurement) => {
      if (typeof onProgress === 'function') onProgress({ timing: measurement });
    } })
      .then((lines) => {
        if (pdfDoc === sourceDoc && currentFileKey === sourceKey) equationSupplementalOcrCache.set(cacheKey, lines);
        return lines;
      })
      .catch((error) => {
        equationSupplementalOcrCache.delete(cacheKey);
        throw error;
      });
    equationSupplementalOcrCache.set(cacheKey, pending);
    return pending;
  };

  const comprehensiveRecords = [];
  let added = false;
  try {
    for (const pageNum of pages) {
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return added;
      let lines;
      try {
        lines = await cachedLinesForPage(pageNum);
      } catch (error) {
        console.warn(`MathReader equation image-assistance skipped page ${pageNum}.`, error);
        failedPages += 1;
        donePages += 1;
        if (typeof onProgress === 'function') onProgress({ phase: 'ocr', ocrDone: donePages, failedPages });
        continue;
      }
      const expectedOnPage = gapPlan.expectedByPage.get(pageNum) || new Set();
      let pageAdded = false;
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        for (const candidate of equationLabelCandidatesInLine(line.text)) {
          const record = equationSupplementalRecord(line, pageNum, lineIndex, lines, candidate);
          if (!record) continue;
          if (comprehensivePageSet.has(pageNum)) comprehensiveRecords.push(record);
          if (expectedOnPage.has(record.label) && !index.has(record.label)) {
            index.set(record.label, [{
              ...record,
              nativeGapCorroborated: true,
              confidence: Math.max(20, Number(record.confidence) || 0),
            }]);
            added = true;
            pageAdded = true;
          }
        }
      }
      donePages += 1;
      if (typeof onProgress === 'function') onProgress({ phase: 'ocr', ocrDone: donePages, failedPages, changed: pageAdded });
      await nextFrame();
    }

    // A faint printed tag can survive the normal margin inventory yet be lost
    // by general-purpose OCR (old scans often lose one parenthesis or one tiny
    // digit). Retry only unresolved, already-evidenced gaps with a narrower
    // numeric-only crop. The expected label is a query, never an assertion: its
    // exact digit/dot core must still be read as a standalone margin line.
    const numericRetryExpectedByPage = new Map();
    const addNumericRetryExpected = (pageNum, label) => {
      if (index.has(label)) return;
      const page = Number(pageNum);
      if (!Number.isInteger(page) || page < 1 || page > pageCount) return;
      const labels = numericRetryExpectedByPage.get(page) || new Set();
      labels.add(label);
      numericRetryExpectedByPage.set(page, labels);
    };
    for (const [pageNum, labels] of gapPlan.expectedByPage.entries()) {
      for (const label of labels) addNumericRetryExpected(pageNum, label);
    }
    for (const [pageNum, labels] of equationSupplementalNumericRetryQueries(comprehensiveRecords, pageCount).entries()) {
      for (const label of labels) addNumericRetryExpected(pageNum, label);
    }

    if (typeof onProgress === 'function') onProgress({ retryTotal: numericRetryExpectedByPage.size, retryDone: 0 });
    if (numericRetryExpectedByPage.size) {
      const activeWorker = await ensureWorker();
      if (activeWorker) {
        try {
          if (typeof activeWorker.setParameters === 'function') {
            await activeWorker.setParameters({
              preserve_interword_spaces: '1',
              user_defined_dpi: '300',
              tessedit_pageseg_mode: '6',
              tessedit_char_whitelist: '0123456789.()-',
            });
          }
          let retryDone = 0;
          const retryStarted = equationDetectionNowMs();
          for (const [pageNum, expectedLabels] of [...numericRetryExpectedByPage.entries()].sort((a, b) => a[0] - b[0])) {
            if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return added;
            let retryLines = [];
            try {
              retryLines = await equationMarginOcrLines(sourceDoc, pageNum, equationNumberingSide, activeWorker, {
                marginFraction: 0.18, onTiming: (measurement) => {
                  if (typeof onProgress === 'function') onProgress({ timing: measurement });
                },
              });
            } catch (error) {
              console.warn(`MathReader equation numeric-gap OCR skipped page ${pageNum}.`, error);
              failedPages += 1;
              retryDone += 1;
              if (typeof onProgress === 'function') onProgress({ retryDone, failedPages });
              continue;
            }
            let pageAdded = false;
            for (const expectedLabel of expectedLabels) {
              if (index.has(expectedLabel)) continue;
              for (const line of retryLines) {
                const record = equationExpectedNumericOcrRecord(line, pageNum, expectedLabel);
                if (!record) continue;
                index.set(expectedLabel, [{ ...record, nativeGapCorroborated: true }]);
                comprehensiveRecords.push(record);
                added = true;
                pageAdded = true;
                break;
              }
            }
            retryDone += 1;
            if (typeof onProgress === 'function') onProgress({ retryDone, failedPages, changed: pageAdded });
            await nextFrame();
          }
          if (typeof onProgress === 'function') onProgress({ retryMs: equationDetectionNowMs() - retryStarted });
        } finally {
          if (typeof activeWorker.setParameters === 'function') {
            try {
              await activeWorker.setParameters({
                preserve_interword_spaces: '1',
                user_defined_dpi: '300',
                tessedit_pageseg_mode: '11',
                tessedit_char_whitelist: '',
              });
            } catch (_) {}
          }
        }
      }
    }

    // The comprehensive pass is still evidence-driven: only dense, monotone
    // OCR families are promoted, and every promoted label was actually read on
    // the page margin. Sequence arithmetic never invents a label.
    if (comprehensiveRecords.length) {
      for (const record of denseSupplementalEquationFamilies(comprehensiveRecords)) {
        if (index.has(record.label)) continue;
        index.set(record.label, [{ ...record, confidence: Math.max(18, Number(record.confidence) || 0) }]);
        added = true;
      }
      if (added && typeof onProgress === 'function') onProgress({ changed: true });
    }
    return added;
  } finally {
    try { await worker?.terminate?.(); } catch (_) {}
  }
}

async function buildEquationLabelIndex() {
  if (!pdfDoc || !documentTextFeaturesAvailable()) return new Map();
  if (equationLabelIndex) return equationLabelIndex;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  const generation = equationDetectionGeneration;
  const started = equationDetectionNowMs();
  updateEquationDetectionProgress({
    phase: 'native', nativeDone: 0, nativeTotal: sourceDoc.numPages,
    documentPages: sourceDoc.numPages, ocrTotal: 0, ocrDone: 0,
    retryTotal: 0, retryDone: 0, labels: 0, recovered: 0,
    failedPages: 0, renderMs: 0, recognizeMs: 0, validationMs: 0, ocrSetupMs: 0, retryMs: 0, uiMs: 0,
    nativeMs: 0, elapsedMs: 0,
  }, generation, true);
  const index = new Map();
  const candidatePool = new Map();
  const rawCandidates = [];
  const referenceOcrEvidence = [];
  const rawPageLines = new Map();
  const dottedSectionHeadingEvidence = [];
  const equationPages = Array.from({ length: sourceDoc.numPages }, (_, index) => index + 1);
  for await (const { item: page, value: lines } of orderedPrefetch(
    equationPages,
    (pageNum) => pageTextLines(pageNum, sourceDoc),
    3
  )) {
    rawPageLines.set(page, lines);
    updateEquationDetectionProgress({ nativeDone: page }, generation);
    const pageOcrConfidence = equationOcrPageConfidence(page);
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
          sameRowHeadingContext: Boolean(candidate.bare) && bareEquationHasSameRowHeadingContext(lines, lineIndex),
          axisNumericCluster: Boolean(candidate.bare) && (bareEquationInHorizontalNumericCluster(lines, lineIndex)
            || bareEquationInVerticalNumericTicks(lines, lineIndex)),
          tabularNumericCell: Boolean(candidate.bare) && bareEquationInTabularRow(lines, lineIndex),
          measurementValue: Boolean(candidate.bare) && bareEquationHasMeasurementSuffix(line, candidate),
          mathSignals: equationLineMathSignalCount(line.text),
          ocrSource: Boolean(line.ocrSource),
          ocrLineConfidence: Number.isFinite(line.confidence) ? Number(line.confidence) : null,
          ocrPageConfidence: Number.isFinite(pageOcrConfidence) ? Number(pageOcrConfidence) : null,
          ocrTopRunningHeader,
          attachedFunctionCall: Boolean(candidate.attachedFunctionCall),
          enumeratedConditionList: equationEnumeratedConditionListContext(lines, lineIndex, candidate),
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
    const weakOcrPageCandidate = Boolean(
      record.ocrSource
      && Number.isFinite(record.ocrPageConfidence)
      && record.ocrPageConfidence < 50
    );
    const extremeTopBareMarker = Boolean(
      record.bareSource
      && record.standaloneTag
      && !record.nearbyDisplayMath
      && (
        Number(record.ratio) <= 0.040
        || (Number(record.ratio) <= 0.070 && record.nearbyHeadingContext)
      )
    );
    const referenceContextRejectedCandidate = Boolean(record.explicitParenthesized && equationReferenceProseContext(record.text));
    // Only schedule posterior image recovery when this exact prose candidate
    // would have survived the mature v326 classifier without the new lexical
    // reference guard. This keeps harmless citations from expanding the OCR
    // plan while preserving recovery for the class-level false targets fixed
    // here.
    const preReferenceGuardConfidence = referenceContextRejectedCandidate
      ? equationCandidateConfidenceForSide(record, true)
      : -Infinity;
    if (referenceContextRejectedCandidate && record.numeric?.prefix && preReferenceGuardConfidence >= 8) referenceOcrEvidence.push({ ...record, referenceRecoveryStrong: true });
    const bareSectionHeadingCandidate = Boolean(
      record.bareSource
      && (Number(record.mathSignals) || 0) === 0
      && (record.sameRowHeadingContext || (record.nearbyHeadingContext && !record.nearbyDisplayMath))
    );
    let hardRejectedCandidate = Boolean(record.axisNumericCluster || record.tabularNumericCell || record.measurementValue || record.ocrTopRunningHeader || extremeTopBareMarker || weakOcrPageCandidate || referenceContextRejectedCandidate || bareSectionHeadingCandidate);
    if (hardRejectedCandidate) confidence = -Infinity;
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
      if (sectionLikeBare) {
        confidence = -Infinity;
        hardRejectedCandidate = true;
      }
    }
    let reliable = confidence >= 8;
    if (!hardRejectedCandidate && !reliable && record.standaloneTag && record.nearbyDisplayMath && equationCandidateAlignedToNumberingSide(record)) {
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
      !referenceContextRejectedCandidate
      && !record.attachedFunctionCall
      && !record.ocrTopRunningHeader
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

  const nativeExtractionEnd = equationDetectionNowMs();
  updateEquationDetectionProgress({ phase: 'validating', nativeDone: sourceDoc.numPages, nativeMs: nativeExtractionEnd - started }, generation, true);
  const columnProfiles = supplementTwoColumnEquations(index, rawPageLines);
  reconcileEquationNumberingFamilies(index);
  recoverSequentialEquationGaps(index, candidatePool);
  reconcileEquationNumberingFamilies(index);
  reconcileOcrEquationSequenceOrder(index);
  suppressSparseAmbiguousOcrEquationFamilies(index);
  suppressSparseAmbiguousNativeBareEquationFamilies(index);
  // Gap recovery can promote a local-column candidate *after* the initial
  // supplement pass. Reapply only display-column metadata, never detections.
  annotateEquationColumnsForOrder(index, columnProfiles);
  if (generation !== equationDetectionGeneration || pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return new Map();
  const nativeEnd = equationDetectionNowMs();
  updateEquationDetectionProgress({ nativeMs: nativeExtractionEnd - started, validationMs: nativeEnd - nativeExtractionEnd, phase: 'planning' }, generation, true);
  let nativeCount = 0;

  const publishAutomaticIndex = () => {
    if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return false;
    equationAutomaticLabelIndex = canonicalizeEquationIndex(index);
    equationLabelIndex = applyEquationEdits(equationAutomaticLabelIndex);
    updateEquationDetectionProgress({ labels: equationAutomaticLabelIndex.size, recovered: Math.max(0, equationAutomaticLabelIndex.size - nativeCount) }, generation);
    const previousKnownEquationCount = equationIndexKnownCount;
    const uiStarted = equationDetectionNowMs();
    renderEquationIndex();
    updateEquationDetectionProgress({ uiMs: (equationDetectionProgress.uiMs || 0) + equationDetectionNowMs() - uiStarted }, generation);
    if (equationIndexKnownCount !== previousKnownEquationCount) persistDocumentState();
    return true;
  };

  // Publish the native-text result immediately. Posterior image OCR is an
  // enhancement, not a prerequisite for a usable Equation index, and may take
  // several seconds on scan-backed papers.
  publishAutomaticIndex();
  nativeCount = equationAutomaticLabelIndex?.size || 0;
  updateEquationDetectionProgress({ labels: nativeCount, recovered: 0 }, generation, true);

  if (!equationImageAssistPromise) {
    const assistIndex = index;
    const assistPool = candidatePool;
    const onAssistProgress = (event = {}) => {
      if (generation !== equationDetectionGeneration || pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return;
      const { timing, changed, setupMs, ...values } = event;
      if (setupMs != null) values.ocrSetupMs = (equationDetectionProgress.ocrSetupMs || 0) + setupMs;
      if (timing) {
        values.renderMs = (equationDetectionProgress.renderMs || 0) + (timing.renderMs || 0);
        values.recognizeMs = (equationDetectionProgress.recognizeMs || 0) + (timing.recognizeMs || 0);
      }
      updateEquationDetectionProgress(values, generation, Boolean(changed));
      if (changed) publishAutomaticIndex();
    };
    equationImageAssistPromise = (async () => {
      const added = await supplementEquationIndexFromPageImages(sourceDoc, sourceKey, assistIndex, referenceOcrEvidence, onAssistProgress);
      if (generation !== equationDetectionGeneration || pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return;
      if (added) {
        updateEquationDetectionProgress({ phase: 'validating' }, generation, true);
        const validatedAt = equationDetectionNowMs();
        reconcileEquationNumberingFamilies(assistIndex);
        recoverSequentialEquationGaps(assistIndex, assistPool);
        reconcileEquationNumberingFamilies(assistIndex);
        reconcileOcrEquationSequenceOrder(assistIndex);
        suppressSparseAmbiguousOcrEquationFamilies(assistIndex);
        suppressSparseAmbiguousNativeBareEquationFamilies(assistIndex);
        annotateEquationColumnsForOrder(assistIndex, columnProfiles);
        updateEquationDetectionProgress({ validationMs: (equationDetectionProgress.validationMs || 0) + equationDetectionNowMs() - validatedAt }, generation);
        publishAutomaticIndex();
      }
      const current = equationDetectionProgress;
      const finish = { phase: (current.failedPages || 0) ? 'partial' : 'complete', elapsedMs: equationDetectionNowMs() - started };
      updateEquationDetectionProgress(finish, generation, true);
      logEquationDetectionTiming(equationDetectionProgress, sourceKey);
    })().catch((error) => {
      console.warn('MathReader posterior equation OCR was unavailable.', error);
      if (generation === equationDetectionGeneration && pdfDoc === sourceDoc && currentFileKey === sourceKey) {
        updateEquationDetectionProgress({ phase: 'partial', elapsedMs: equationDetectionNowMs() - started, error: String(error?.message || error) }, generation, true);
        logEquationDetectionTiming(equationDetectionProgress, sourceKey);
      }
    }).finally(() => {
      if (generation === equationDetectionGeneration && pdfDoc === sourceDoc && currentFileKey === sourceKey) equationImageAssistPromise = null;
    });
  }
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
  if (equationDetectionProgress.phase === 'idle' && equationLabelIndex) updateEquationDetectionProgress({ phase: 'saved' }, equationDetectionGeneration, true);
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
      pendingEquationReselectKey = null; pendingEquationAddKey = null;
      persistDocumentState();
      refreshEquationIndexAfterManualEdit().catch(() => {});
      refreshSelectionUI();
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
    // Imported reading-data may already contain a portable equation map. Do not
    // destroy it merely because the scanned PDF is open without OCR text.
    if (portableContentDetectionActive && equationLabelIndex) {
      renderEquationIndex();
      return equationLabelIndex;
    }
    equationLabelIndex = null;
    equationImageAssistPromise = null;
    equationAutomaticLabelIndex = null;
    equationSupplementalOcrCache = new Map();
    resetEquationDetectionProgress();
    updateEquationDetectionProgress({ phase: 'unavailable' }, equationDetectionGeneration, true);
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
  } catch (error) {
    console.warn('Equation-label index build failed', error);
    updateEquationDetectionProgress({ phase: 'failed' }, equationDetectionGeneration, true);
    if (equationIndexEmpty) equationIndexEmpty.textContent = t('The equation-label index could not be built.', '无法生成公式编号索引。');
  }
}

async function findEquationLabelLocation(query, originPage = null, originRatio = null) {
  const label = normalizedEquationLabel(query);
  const index = (await ensureEquationIndexRendered()) || new Map();
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
  const { page, content } = await nativePageTextData(sourceDoc, pageNum);
  const view = Array.isArray(page.view) ? page.view : [0, 0, 1, 1];
  const yMin = Number(view[1]) || 0;
  const yMax = Number(view[3]) || 1;
  const pageHeight = Math.max(1, yMax - yMin);
  const rows = [];
  const rowBuckets = new Map();
  for (const item of content.items || []) {
    const text = String(item.str || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const x = Number(item.transform?.[4]) || 0;
    const width = Math.max(0, Number(item.width) || 0);
    const y = Number(item.transform?.[5]) || 0;
    // Same first-match semantics as rows.find(), but only inspect y-nearby
    // rows. Dense PDF text pages otherwise make line construction quadratic.
    let row = findFirstRowInYBuckets(rowBuckets, y, 2.2, 2.2);
    if (!row) {
      row = { y, items: [], _rowOrder: rows.length };
      rows.push(row);
      addRowToYBuckets(rowBuckets, row, 2.2);
    }
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
  return /^(?:references(?:\s+and\s+notes)?|notes\s+and\s+references|bibliography|literature\s+cited|参考文献|參考文獻|参考资料|參考資料|参考书目|參考書目)\s*[.:：]?$/iu.test(String(value || '').replace(/\s+/g, ' ').trim());
}

function bibliographyEntryLooksCompleteForPostscript(entry) {
  const text = String(entry?.title || '').replace(/\s+/g, ' ').trim();
  if (!text) return false;
  return /\b(?:17|18|19|20)\d{2}\b/.test(text)
    && (/(?:\d{1,4}\s*[-–—]\s*\d{1,4}|\b(?:MR|Zbl)\s*\d+|\b(?:doi|arXiv)\b)/i.test(text) || /[.)]\s*$/.test(text));
}

function bibliographyPostscriptContactLine(line, text, activeEntry, entryCount) {
  if (!activeEntry || entryCount < 3 || !bibliographyEntryLooksCompleteForPostscript(activeEntry)) return false;
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.length > 120) return false;
  if (/^E-?mail\s+address\b/i.test(cleaned)) return true;
  if (/^(?:School|Department|Faculty)\s+of\b/i.test(cleaned)) return true;
  if (/^(?:Institute|Instituto|Institut|Équipe|Equipe|EQU\s*IPE)\b/i.test(cleaned)) return true;
  if (/^(?:University\s+of\b|[A-Z][A-Za-zÀ-ÖØ-öø-ÿ.'’&\- ]{2,60}\s+University\b)/u.test(cleaned)) return true;
  const ratio = Number(line?.ratio || 0);
  const xStart = Number(line?.xStartRatio || 0);
  const authorSignature = /^(?:[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ.'’\-]+\s+){1,3}[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ.'’\-]+$/u.test(cleaned);
  return authorSignature && ratio >= 0.55 && xStart >= 0.45;
}

function repeatedBibliographyAuthorPrefix(entries) {
  const rows = Array.isArray(entries) ? entries : [];
  for (let index = rows.length - 1; index >= Math.max(0, rows.length - 6); index -= 1) {
    const title = String(rows[index]?.title || '').replace(/\s+/g, ' ').trim();
    const match = title.match(/^([^,]{2,80}),\s+/);
    if (!match) continue;
    const author = match[1].trim();
    const initialStyle = author.includes('.')
      && /^[A-Za-zÀ-ÖØ-öø-ÿ.'’&\- ]+$/u.test(author)
      && !/\b(?:of|the|in|on|for|with|sets|points)\b/i.test(author);
    const fullNameStyle = /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’.-]{2,}\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’.-]{2,}$/u.test(author);
    if (initialStyle || fullNameStyle) return author;
  }
  return '';
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
  // A single-column bibliography with hanging keys can superficially resemble
  // two columns: short "[16]" rows sit at the left margin while their bodies
  // begin farther right. Do not reorder such pages unless there is comparable
  // key evidence in the right half. Reordering separates a key from its body.
  const leftHangingKeys = splitRows.filter((line) => Number(line.xStartRatio || 0) < 0.36 && /^\[\s*(?:\d{1,3}|[A-Za-z][A-Za-z0-9 ]{0,8})\s*\][.)]?$/.test(String(line.text || '').trim())).length;
  const rightHangingKeys = splitRows.filter((line) => Number(line.xStartRatio || 0) > 0.52 && /^\[\s*(?:\d{1,3}|[A-Za-z][A-Za-z0-9 ]{0,8})\s*\][.)]?$/.test(String(line.text || '').trim())).length;
  const hangingBodies = lines.filter((line) => Number(line.xStartRatio || 0) >= 0.18 && Number(line.xStartRatio || 0) <= 0.36 && Number(line.xEndRatio || 0) >= 0.62 && String(line.text || '').trim().length >= 24).length;
  const sameLineKeyLead = (line) => /^\[\s*(?:\d{1,3}|[A-Za-z][A-Za-z0-9 ]{0,8})\s*\][.)]?\s+\S/.test(String(line.text || '').trim());
  const leftSameLineKeyLeads = lines.filter((line) => Number(line.xStartRatio || 0) < 0.36 && Number(line.xEndRatio || 0) <= 0.48 && sameLineKeyLead(line)).length;
  const wideSameLineKeyLeads = lines.filter((line) => Number(line.xStartRatio || 0) < 0.36 && Number(line.xEndRatio || 0) >= 0.62 && sameLineKeyLead(line)).length;
  const rightSameLineKeyLeads = lines.filter((line) => Number(line.xStartRatio || 0) > 0.52 && sameLineKeyLead(line)).length;
  const singleColumnHangingBibliography = (leftHangingKeys >= 3 && rightHangingKeys === 0 && hangingBodies >= 3)
    || (leftSameLineKeyLeads >= 3 && rightSameLineKeyLeads === 0)
    // Full-width numbered references are also single-column evidence.  Italic
    // title/journal spans can create large internal PDF-text gaps that resemble
    // a column gutter even though each entry visibly crosses the page centre.
    || (wideSameLineKeyLeads >= 3 && rightSameLineKeyLeads === 0);
  const twoColumn = !singleColumnHangingBibliography && (
    strongSplitCount >= 2
    || (substantialLeftCount >= 3 && substantialRightCount >= 3)
    || (headingOnRight && substantialRightCount >= 3 && (strongSplitCount >= 1 || substantialLeftCount >= 1))
    || (headingOnLeft && substantialLeftCount >= 3 && (strongSplitCount >= 1 || substantialRightCount >= 1))
  );
  if (!twoColumn) {
    // Do not retain speculative row splits when the page as a whole did not
    // establish a bibliography column layout. A single-column reference line
    // can contain a large internal gap (especially in old OCR/text layers),
    // but splitting it changes reading order and can manufacture entries.
    const starts = lines.map((line) => Number(line.xStartRatio || 0)).filter(Number.isFinite).sort((a, b) => a - b);
    const base = starts.length ? starts[Math.min(starts.length - 1, Math.floor(starts.length * 0.12))] : 0;
    const annotated = lines.map((line) => ({ ...line, columnStartRatio: base }));
    if (singleColumnHangingBibliography) {
      // PDF text layers sometimes emit a hanging key after its same-baseline
      // body fragment. Preserve visual reading order so `[17]` is seen before
      // the continuation that belongs to reference 17 rather than appended to
      // reference 16.
      annotated.sort((a, b) => {
        const ar = Number(a.ratio || 0); const br = Number(b.ratio || 0);
        if (Math.abs(ar - br) <= 0.0040) return Number(a.xStartRatio || 0) - Number(b.xStartRatio || 0);
        return ar - br;
      });
    }
    return annotated;
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
  // When an explicit References/Bibliography heading occurs part-way down a
  // page, it is a hard reading-order boundary.  A single-column reference list
  // can otherwise look two-column because keys and bodies occupy opposite
  // halves, causing pre-heading prose to be moved after live bibliography
  // entries and appended to them.  Preserve all pre-heading lines verbatim and
  // apply column ordering only at/after the heading.
  const headingBoundary = headingPresent ? headingRatio - 0.02 : -Infinity;
  const preHeading = headingPresent
    ? lines.filter((line) => Number(line.ratio || 0) < headingBoundary).map((line) => ({ ...line, columnStartRatio: Number(line.xStartRatio || 0) }))
    : [];
  const orderedSplitRows = headingPresent
    ? splitRows.filter((line) => Number(line.ratio || 0) >= headingBoundary)
    : splitRows;
  const fullWidth = orderedSplitRows.filter((line) => line.columnIndex === null).map(annotate);
  const headingFullWidth = headingPresent
    ? fullWidth.filter((line) => bibliographyHeadingText(line.text) || Number(line.ratio || 0) <= headingRatio + 0.015)
    : [];
  const topFullWidth = headingPresent
    ? []
    : fullWidth.filter((line) => Number(line.ratio || 0) < 0.18).sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0));
  const headingFullWidthSet = new Set(headingFullWidth);
  const otherFullWidth = fullWidth
    .filter((line) => !headingFullWidthSet.has(line) && (headingPresent || Number(line.ratio || 0) >= 0.18))
    .sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0));
  const visualColumnSort = (a, b) => {
    const ar = Number(a.ratio || 0); const br = Number(b.ratio || 0);
    if (Math.abs(ar - br) <= 0.0040) return Number(a.xStartRatio || 0) - Number(b.xStartRatio || 0);
    return ar - br;
  };
  return [
    ...preHeading,
    ...headingFullWidth.sort((a, b) => Number(a.ratio || 0) - Number(b.ratio || 0)),
    ...topFullWidth,
    ...leftLines.map(annotate).sort(visualColumnSort),
    ...rightLines.map(annotate).sort(visualColumnSort),
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
  const journalAbbreviationContinuation = /^J\.\s+(?:Math|Amer|Appl|Stat|Comput|Phys|Differential|Funct|Algebra|Geom|Approx|Complex|Number|Fluid|Mech|ACM|IEEE)\b/i.test(value);
  if (journalAbbreviationContinuation
      || /^(?:Math\.?|Ann\.?|Comm\.?|Commun\.?|Proc\.?|Proceedings?|Trans\.?|Arch\.?|Invent\.?|Acta|Bull\.?|Vol\.?|Volume|No\.?|pp?\.?|t\.)\b/i.test(value)) return false;
  const yearMatch = value.match(/\b(?:17|18|19|20)\d{2}\b/);
  let authorRegion = yearMatch ? value.slice(0, yearMatch.index) : value.slice(0, 220);
  authorRegion = authorRegion.replace(/[.\s]+$/g, '').replace(/\s+(?:et\s+al\.)$/i, '').trim();
  const chunks = authorRegion.split(/\s*,\s*|\s+(?:and|&)\s+/).map((chunk) => chunk.trim()).filter(Boolean);
  let count = 0;
  for (const chunk of chunks.slice(0, 8)) {
    if (!bibliographyPersonNameChunk(chunk)) break;
    count += 1;
  }
  if (count >= 2 || (count >= 1 && Boolean(yearMatch))) return true;

  // Older AI/CS proceedings and many technical bibliographies use an
  // unnumbered single-author form such as
  //   "J. Stephen Judd. Learning in networks is hard. ... 1987."
  // or "Nimrod Megiddo. On The Complexity ... 1986.".  The period after
  // the author is a sentence boundary, not part of a comma/and-separated
  // author list, so the generic multi-author parser above otherwise consumes
  // the title and rejects the lead.  Accept only a *leading* person-name
  // prefix ending at a sentence break; final promotion still requires the
  // existing strong publication/year evidence in
  // unnumberedBibliographyTextLooksStrong().  Trying successive sentence
  // breaks also handles initials like "J. Stephen Judd." without treating
  // the first initial as the whole author.
  for (const match of authorRegion.matchAll(/\.\s+(?=[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я])/gu)) {
    let prefix = authorRegion.slice(0, match.index).trim();
    if (prefix.length > 140) break;
    prefix = prefix.replace(/,\s*(?:editors?|eds?\.?|compilers?)$/i, '').trim();
    if (bibliographyPersonNameChunk(prefix)) return true;
    const prefixChunks = prefix.split(/\s*,\s*|\s+(?:and|&)\s+/).map((chunk) => chunk.trim()).filter(Boolean);
    if (prefixChunks.length >= 2 && prefixChunks.length <= 8 && prefixChunks.every(bibliographyPersonNameChunk)) return true;
  }
  return false;
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

function bibliographyHeadingHasNearbyEntryEvidence(lines, headingIndex) {
  const list = Array.isArray(lines) ? lines : [];
  const heading = list[headingIndex] || null;
  const headingRatio = Number(heading?.ratio || 0);
  for (let index = headingIndex + 1; index < Math.min(list.length, headingIndex + 8); index += 1) {
    const line = list[index];
    const ratio = Number(line?.ratio || 0);
    if (Number.isFinite(headingRatio) && Number.isFinite(ratio) && ratio - headingRatio > 0.18) break;
    const value = String(line?.text || '').replace(/\s+/g, ' ').trim();
    if (!value || /^\d{1,4}$/.test(value)) continue;
    // A real references heading normally has an actual key or a strong
    // unnumbered author/year entry immediately below it.  Contents pages, by
    // contrast, are followed by page numbers or the next outline item.
    if (/^[\[{(]\s*(?:\d{1,3}|[A-Za-z][A-Za-z0-9.\-]{0,12})\s*[\]})]/.test(value)) return true;
    if (unnumberedBibliographyTextLooksStrong(value)) return true;
  }
  return false;
}

function bibliographyLineStartsAtColumn(line) {
  const x = Number(line?.xStartRatio || 0);
  const base = Number(line?.columnStartRatio);
  if (!Number.isFinite(base)) return true;
  return x <= base + 0.018;
}

function bibliographyLineLooksLikeHeaderOrFooter(line, cleaned) {
  const value = String(cleaned || '').replace(/\s+/g, ' ').trim();
  const ratio = Number(line?.ratio || 0);
  const xStart = Number(line?.xStartRatio || 0);
  const topHeaderLike = ratio < 0.10 && (
    /^\d{1,4}\s+[A-Z][A-Z0-9 .,:;'’"()\-]{4,}$/u.test(value)
    || /^[A-Z][A-Z0-9 .,:;'’"()\-]{4,}\s+\d{1,4}$/u.test(value)
  );
  // Journals/books often split running headers into separate page-number and
  // centered author/title lines.  Do not append that header to the previous
  // bibliography entry. Keep the geometry narrow so left-aligned real author
  // lines at the top of a references page remain valid content.
  const topCenteredRunningHeader = ratio < 0.125
    && xStart > 0.28
    && value.length >= 4 && value.length <= 80
    && (/^[A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я][A-ZÀ-ÖØ-ÞΑ-ΩЁА-Я0-9 .,&'’\-:]+$/u.test(value)
      || /^(?:[A-Z]\.?\s*){1,4}[A-ZÀ-ÖØ-Þ][\p{L}'’.-]{2,40}(?:\s*(?:&|and)\s*(?:[A-Z]\.?\s*){0,4}[A-ZÀ-ÖØ-Þ][\p{L}'’.-]{2,40})?$/u.test(value));
  return topHeaderLike
    || topCenteredRunningHeader
    || (ratio > 0.91 && value.length < 100)
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

function damagedOcrBibliographyKeyDigits(raw) {
  // Only confusable glyphs that resemble digits in short *numbered* keys.
  // Never apply to author-keyed references or ordinary prose.
  const digits = String(raw || '').replace(/[lI|]/g, '1').replace(/[Oo]/g, '0').replace(/[Ss]/g, '5');
  return /^\d{1,3}$/.test(digits) ? digits : '';
}

function repairOcrExpectedBibliographyKey(text, line, expected) {
  // Scanned journal references can lose the closing bracket entirely, replace
  // it with comma punctuation, or render [11] as {ll}, [l1, etc. Anchor the
  // repair to the *next already-established* numeric key, the OCR-only left
  // margin, and a strong bibliographic body so body citations do not qualify.
  if (!line?.ocrSource || expected < 2 || expected > 999 || Number(line.xStartRatio || 0) >= 0.20) return text;
  // A damaged *opening* bracket is a separate old-scan class: "2] A. Borel".
  // Require the surviving closing delimiter plus the same sequence/body gates.
  const match = String(text || '').match(/^[\[{(]\s*([0-9lI|OoSs]{1,3})\s*(?:[\]})])?\s*[,;:.]?\s+(.{12,})$/u)
    || String(text || '').match(/^([0-9lI|OoSs]{1,3})\s*[\]})]\s+(.{12,})$/u);
  if (!match) return text;
  if (damagedOcrBibliographyKeyDigits(match[1]) !== String(expected) || !bibliographyReferenceBodyLooksStrong(match[2])) return text;
  return `[${expected}] ${match[2]}`;
}

function repairOcrExpectedBibliographyKeyOnly(text, line, expected, establishedCount) {
  // PSM-11 and some PDF OCR layers place the damaged numeric marker on its
  // own line and the bibliography body on the next line. Preserve a pending
  // numeric key only if a real numbered series is already established; the
  // existing pending-key handler then attaches the following text rather than
  // appending it to the preceding reference.
  if (!line?.ocrSource || establishedCount < 3 || expected < 2 || expected > 999
      || Number(line.xStartRatio || 0) >= 0.20) return text;
  const match = String(text || '').match(/^[\[{(]\s*([0-9lI|OoSs]{1,3})\s*(?:[\]})])?\s*[,;:.]?$/u);
  if (!match || damagedOcrBibliographyKeyDigits(match[1]) !== String(expected)) return text;
  return `[${expected}]`;
}

function malformedNumericBibliographyCandidate(text, line, page) {
  if (Number(line?.xStartRatio || 0) >= 0.22) return null;
  // A scan may fuse the opening bracket and the first two narrow digits into
  // a short shape such as "tl) , Title ..." for the printed "[11] , Title ...".
  // Never accept this as a key directly: retain it only as *possible* evidence
  // for one missing number bounded by two exact adjacent bibliography keys.
  // The comma after the closing mark is characteristic of old ditto-author
  // bibliography lines, and the body must independently look bibliographic.
  const closedDitto = line?.ocrSource && Number(line.xStartRatio || 0) < 0.18
    ? String(text || '').match(/^([1lI|t]{2,3})\)\s*[,;:]\s+(.{20,})$/u)
    : null;
  if (closedDitto) {
    const digitText = closedDitto[1].replace(/[lI|t]/g, '1');
    const body = closedDitto[2].trim();
    if (/^\d{2,3}$/.test(digitText) && bibliographyReferenceBodyLooksStrong(body)) {
      return {
        token: closedDitto[1] + ')', digitText, bracketedSingleGlyph: false,
        body, page, ratio: Number(line.ratio || 0),
        xStartRatio: Number(line.xStartRatio || 0),
        ocrSource: Boolean(line.ocrSource),
        used: false, continuations: [], closedOcrDitto: true
      };
    }
  }
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
    ocrSource: Boolean(line?.ocrSource),
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

  // Old scans can render the first numbered bibliography marker [1] as
  // {i}, (l), [I], etc.  This is not safe to guess at the start of a section:
  // require a mature exact [2], [3], [4] sequence, a *single* OCR-only
  // bracketed-digit-confusable candidate immediately before [2], the same
  // bibliography page/left margin, and independently bibliographic text.
  // Author-key [B] and unpaired snippets must remain untouched.
  if (numericEntries.length >= 3
      && numericEntries[0].value === 2
      && numericEntries[1].value === 3
      && numericEntries[2].value === 4
      && !existingKeys.has('1')) {
    const first = numericEntries[0].entry;
    const compatible = candidates.filter((candidate) => {
      if (candidate.used || !candidate.ocrSource || !candidate.bracketedSingleGlyph
          || candidate.digitText || Number(candidate.xStartRatio) >= 0.18
          || Number(candidate.page) !== Number(first.page)) return false;
      if (!/^[\[{(]\s*[iIl|]\s*[\]})][.)]?$/u.test(String(candidate.token || ''))) return false;
      const distance = Number(first.ratio) - Number(candidate.ratio);
      if (!(distance > 0 && distance <= 0.22)) return false;
      const fullBody = [candidate.body, ...(candidate.continuations || [])].join(' ').replace(/\s+/g, ' ').trim();
      return bibliographyReferenceBodyLooksStrong(fullBody);
    });
    if (compatible.length === 1) {
      const candidate = compatible[0];
      const fullBody = [candidate.body, ...(candidate.continuations || [])].join(' ').replace(/\s+/g, ' ').trim();
      const recovered = {
        number: 1, label: '[1]', page: candidate.page, ratio: candidate.ratio,
        title: fullBody.slice(0, 640), citations: [], ...bibliographyMetadata(fullBody)
      };
      const insertAt = entries.indexOf(first);
      entries.splice(insertAt >= 0 ? insertAt : 0, 0, recovered);
      existingKeys.add('1');
      candidate.used = true;
      recoveredCount += 1;
    }
  }

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

function pruneIsolatedNumericEntriesFromAuthorKeyBibliography(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const numeric = list.filter((entry) => /^\d{1,3}$/.test(normalizedBibliographyKey(entry?.number)));
  const authorKeyed = list.filter((entry) => {
    const key = normalizedBibliographyKey(entry?.number);
    return key && !/^\d{1,3}$/.test(key);
  });
  // A mature author-key bibliography does not acquire one stray numeric key
  // from a continuation line. Preserve mixed schemes when a numeric family is
  // actually present, and preserve any isolated numeric key that is cited in
  // the body. SPS-style phantom [11] entries have neither form of support.
  if (authorKeyed.length < 5 || numeric.length === 0 || numeric.length >= 3) return list;
  const rejected = new Set(
    numeric
      .filter((entry) => !Array.isArray(entry?.citations) || entry.citations.length === 0)
      .map((entry) => entry)
  );
  return rejected.size ? list.filter((entry) => !rejected.has(entry)) : list;
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
  const bibliographyLastPosition = new WeakMap();
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
    for await (const { item: page, value: rawLines } of orderedPrefetch(
      pageSequence,
      (pageNum) => pageTextLines(pageNum, sourceDoc, sourceLineCache, sourceTextCache),
      3
    )) {
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey || token !== structureIndexBuildToken) return;
      const tailOnlyPage = page > primaryPageCount;
      const lines = bibliographyColumnAwareLines(rawLines, bibliographyMode);
      const tocResultRows = tailOnlyPage ? new Set() : tocResultLineIndices(lines, page, sourceDoc.numPages);
      const indexNavigationPage = !tailOnlyPage && structureResultsIndexNavigationPage(lines);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        const cleaned = String(line.text || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) continue;
        if (bibliographyHeadingText(cleaned)) {
          // Contents pages in books often contain a standalone "Bibliography"
          // item near the front. Treat a heading as the real bibliography only
          // in the latter part of longer documents; repeated running headers on
          // subsequent bibliography pages keep the established numbering mode.
          const bibliographyHeadingEligible = page >= Math.max(2, Math.floor(sourceDoc.numPages * 0.35))
            || bibliographyHeadingHasNearbyEntryEvidence(lines, lineIndex)
            || (page === 1 && Number(line.ratio || 0) >= 0.78);
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
          // Result headings must begin the extracted visual line. Classical
          // papers also use spaced numbering ("Lemma 2 . 3"), number-first
          // forms ("1.1. LEMMA"), and a standalone type line next to its
          // number. Normalize only these declaration shapes; prose references
          // such as "Proposition 2.1 shows ..." stay out of Results.
          const detectedResult = indexNavigationPage || tocResultRows.has(lineIndex)
            ? null : detectedStructureResult(lines, lineIndex, page);
          if (detectedResult) {
            const key = `${page}:${normalizedReferenceLabel(detectedResult.label)}`;
            if (!nextEntries.some((entry) => entry.key === key)) {
              const entry = { key, ...detectedResult, proofReferences: [], usedByProofs: [] };
              nextEntries.push(entry); activeProofEntry = entry;
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
            bibliographyLastPosition.set(entry, { page: entryPage, ratio: entryRatio });
            return entry;
          };

          const appendBibliographyContinuation = (entry, fragment) => {
            if (!entry) return;
            const addition = String(fragment || '').replace(/\s+/g, ' ').trim();
            if (!addition || /^\d{1,4}$/.test(addition)) return;
            const combined = `${entry.title || ''} ${addition}`.replace(/\s+/g, ' ').trim().slice(0, 640);
            entry.title = combined;
            bibliographyLastPosition.set(entry, { page, ratio: Number(line.ratio || 0) });
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
          if (bibliographyPostscriptContactLine(line, bibliographyLine, activeBibliographyEntry, nextBibliography.length)) {
            bibliographyMode = false;
            pendingBibliographyKey = null;
            pendingUnnumberedBibliographyEntry = null;
            activeBibliographyEntry = null;
            activeBibliographyRecoveryCandidate = null;
            continue;
          }
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
              ? bibliographyLine.replace(/^[\[{(]\s*[1lI]{2}\s*[\]})][.)]?\s+/u, '[11] ')
              : bibliographyLine.replace(/^\[\s*[1lI]{2}\s*\]\s+/u, '[11] ');
          }
          // In some old mathematical text layers the printed digit 8 is
          // decoded as Greek delta. Accept that single glyph only when the
          // established numeric bibliography sequence is specifically waiting
          // for 8; never globally reinterpret delta as a digit.
          if (expectedBibliographyNumber === 8 && Number(line.xStartRatio || 0) < 0.22) {
            bibliographyLine = bibliographyLine.replace(/^\[\s*δ\s*\][.)]?$/u, '[8]');
          }
          bibliographyLine = bibliographyLine.replace(/^\[\s*(\d{1,3})1\s+(.+)$/u, (full, digits, body) => Number(digits) === expectedBibliographyNumber ? `[${digits}] ${body}` : full);
          bibliographyLine = repairOcrExpectedBibliographyKey(bibliographyLine, line, expectedBibliographyNumber);
          bibliographyLine = repairOcrExpectedBibliographyKeyOnly(bibliographyLine, line, expectedBibliographyNumber, numericBibliographyNumbers.length);
          let bib = bibliographyLine.match(/^\[\s*(\d{1,3})\s*\][.)]?\s+(.{3,})$/);
          let bracketKey = false;
          if (!bib) {
            bib = bibliographyLine.match(/^\[\s*([A-Za-z][A-Za-z0-9\s]{0,12})\s*\][.)]?\s+(.{3,})$/);
            if (bib) bib[1] = bib[1].trim();
            bracketKey = Boolean(bib);
          }
          // Broken old text layers can omit the closing bracket while keeping
          // a short author key and the author name on the same visual line,
          // e.g. "[Gr GROSS L.". This shape is accepted only at the
          // bibliography's left edge and only with an uppercase author lead.
          if (!bib && Number(line.xStartRatio || 0) < 0.22) {
            const fragmentedAuthorWithBody = bibliographyLine.match(/^\[\s*([A-Za-z][A-Za-z0-9]{0,5})\s+([A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ .,'’\-]{2,})$/u);
            if (fragmentedAuthorWithBody) {
              bib = [fragmentedAuthorWithBody[0], fragmentedAuthorWithBody[1], fragmentedAuthorWithBody[2].trim()];
              bracketKey = true;
            }
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
            // A closing bracket may be extracted as its own tiny line. Treat a
            // short incomplete left-margin author key as pending; the isolated
            // "]" line is ignored and the following title attaches normally.
            if (!keyOnly && Number(line.xStartRatio || 0) < 0.22) {
              const fragmentedAuthorKey = bibliographyLine.match(/^\[\s*([A-Za-z][A-Za-z0-9\s]{0,8})\s*$/u);
              if (fragmentedAuthorKey) {
                const compactKey = fragmentedAuthorKey[1].replace(/\s+/g, '');
                if (compactKey && compactKey.length <= 8) keyOnly = [fragmentedAuthorKey[0], compactKey];
              }
            }
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
            if (!keyOnly && bareNumericKey && Number(line.xStartRatio || 0) < 0.18) {
              const rawBareNumber = Number(bareNumericKey[1]);
              const keyOnlyFiveToSixConfusion = expectedBibliographyNumber >= 50
                && expectedBibliographyNumber <= 59
                && rawBareNumber === expectedBibliographyNumber + 10;
              if (rawBareNumber === expectedBibliographyNumber || keyOnlyFiveToSixConfusion) {
                keyOnly = [bareNumericKey[0], String(expectedBibliographyNumber)];
              }
            }
            if (!keyOnly && expectedBibliographyNumber >= 10 && expectedBibliographyNumber <= 99 && Number(line.xStartRatio || 0) < 0.18) {
              const fuzzyKeyOnly = bibliographyLine.match(/^(\S{2,4})$/u);
              if (fuzzyKeyOnly) {
                const expectedText = String(expectedBibliographyNumber);
                const token = fuzzyKeyOnly[1];
                const tokenDigits = token.replace(/\D/g, '');
                const oneDigitCorruption = /\D/.test(token)
                  && token[0] === expectedText[0]
                  && tokenDigits === expectedText[0];
                if (oneDigitCorruption) keyOnly = [fuzzyKeyOnly[0], expectedText];
              }
            }
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
            // A key-only line owns the next substantial line.  Old text layers
            // often emit `[B1]` and `BAKRY D.` as separate fragments on the
            // same visual baseline; do not let the author-name heuristics turn
            // that author into an unnumbered entry and discard the pending key.
            if (!keyOnly && pendingBibliographyKey && cleaned.length >= 3) {
              const pending = pendingBibliographyKey;
              pendingBibliographyKey = null;
              activeBibliographyRecoveryCandidate = null;
              let pendingBody = cleaned;
              if (/^\s*[,;:]/.test(pendingBody)) {
                const repeatedAuthor = repeatedBibliographyAuthorPrefix(nextBibliography);
                if (repeatedAuthor) pendingBody = `${repeatedAuthor}${pendingBody}`;
              }
              activeBibliographyEntry = addBibliographyEntry(pending.rawKey, pendingBody, pending.bracketKey, pending.page || page, pending.ratio ?? line.ratio);
              continue;
            }
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
            } else if (activeBibliographyEntry && cleaned.length >= 3 && !/^(?:references?|bibliography|literature\s+cited)\b/i.test(cleaned)) {
              // Preserve wrapped old-style references. Continuation lines often
              // contain the journal, volume, year or page range that makes the
              // entry useful, but v295 discarded everything after line one.
              const footerLike = bibliographyLineLooksLikeHeaderOrFooter(line, cleaned);
              const lastPosition = bibliographyLastPosition.get(activeBibliographyEntry);
              const detachedSamePageBlock = Boolean(lastPosition
                && Number(lastPosition.page) === page
                && Number(line.ratio || 0) - Number(lastPosition.ratio || 0) > 0.18);
              if (!footerLike && !detachedSamePageBlock) appendBibliographyContinuation(activeBibliographyEntry, cleaned);
              else if (detachedSamePageBlock) activeBibliographyEntry = null;
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

    const cleanedBibliography = pruneIsolatedNumericEntriesFromAuthorKeyBibliography(nextBibliography);

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
    bibliographyEntries = cleanedBibliography.slice(0, 400);
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
    const strong = document.createElement('strong'); strong.textContent = entry.displayLabel || entry.label || entry.title.replace(/([.:)].*)$/, '$1').slice(0, 80);
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


// v356 — Confirmed cross-paper links. Never infer a PDF or theorem from a title.
function bibliographyLinkKey(entry) {
  const label = String(entry?.label || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
  const title = String(entry?.title || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
  const page = Number(entry?.page);
  if (!label || !Number.isInteger(page) || page < 1) return '';
  // Page disambiguates same-label references. Missing OCR titles can still be
  // linked manually, without guessing which paper the reference names.
  return `${label.slice(0,90)}|p${page}|${title.slice(0,300)}`;
}

function normalizeConfirmedBibliographyLinks(raw) {
  if (raw?.version !== 1 || !Array.isArray(raw.links)) return new Map();
  const output = new Map();
  for (const item of raw.links.slice(0,400)) {
    if (!item || typeof item.key !== 'string' || typeof item.targetId !== 'string') continue;
    if (!item.key || item.key.length > 425 || !item.targetId || item.targetId.length > 256) continue;
    output.set(item.key, item.targetId);
  }
  return output;
}

function bibliographyLinkStorageKey(sourceId) {
  return `crossdoc-links:v1:${sourceId}`;
}

async function loadConfirmedBibliographyLinks(sourceId) {
  confirmedBibliographyLinks = new Map();
  if (!sourceId) return;
  try {
    const raw = await dbMetaGet(bibliographyLinkStorageKey(sourceId));
    if (currentFileKey === sourceId) confirmedBibliographyLinks = normalizeConfirmedBibliographyLinks(raw);
  } catch (error) {
    console.warn('MathReader could not load confirmed bibliography links.', error);
  }
}

function bibliographyLinkTarget(entry) {
  const id = confirmedBibliographyLinks.get(bibliographyLinkKey(entry));
  if (!id || id === currentFileKey) return null;
  return localLibrary.find((item) => item.id === id && item.localAvailable) || null;
}

async function updateConfirmedBibliographyLink(entry, targetId = null) {
  const key = bibliographyLinkKey(entry);
  const source = currentFileKey;
  if (!key || !source || !pdfDoc || confirmedBibliographyWriteInFlight || crossDocumentBusy) return false;
  // Claim the write lock before any async cache validation. In particular,
  // two clicks must not persist snapshots built from the same old link map.
  confirmedBibliographyWriteInFlight = true;
  try {
    const next = new Map(confirmedBibliographyLinks);
    if (targetId) {
      const record = localLibrary.find((item) => item.id === targetId && item.localAvailable && item.id !== source);
      if (!record || !(await dbGet('files', targetId))?.blob) {
        showError(t('The selected PDF is no longer cached locally.', '选中的 PDF 已不在本地缓存中。'));
        return false;
      }
      // The reader can switch PDFs while IndexedDB resolves. Do not write a
      // confirmed association in a document that is no longer active.
      if (currentFileKey !== source) return false;
      next.set(key, targetId);
    } else next.delete(key);
    if (currentFileKey !== source) return false;
    if (next.size > 400) { showError(t('Too many confirmed links for this document.', '当前文档已达到关联数量上限。')); return false; }
    try {
      await dbMetaSet(bibliographyLinkStorageKey(source), { version: 1, links: [...next].map(([k, id]) => ({ key: k, targetId: id })) });
      // Once IndexedDB commits a source-scoped link, it cannot truthfully be
      // reported as cancelled. If the user switched PDFs during the awaited
      // write, leave the active document's link map/UI untouched. Reopening
      // the original source reads its now-committed link record normally.
      if (currentFileKey !== source) return true;
      confirmedBibliographyLinks = next;
      renderBibliographyIndex();
      return true;
    } catch (error) {
      console.warn(error);
      showError(t('Could not save the local PDF link.', '无法保存本地 PDF 关联。'));
      return false;
    }
  } finally {
    confirmedBibliographyWriteInFlight = false;
  }
}

function updateCrossDocumentReturnButton() {
  if (!crossDocumentReturnButton) return;
  let item = crossDocumentReturnStack.at(-1);
  // An unrelated manual PDF open ends the transient return journey. Keeping
  // its old stack would resurrect a misleading Return button if that target
  // were opened again later. Switches performed by P1 itself hold the lock.
  if (!crossDocumentBusy && item && item.targetId !== currentFileKey) {
    crossDocumentReturnStack = [];
    item = null;
  }
  const valid = Boolean(pdfDoc && item && item.targetId === currentFileKey);
  crossDocumentReturnButton.classList.toggle('is-hidden', !valid);
  crossDocumentReturnButton.disabled = !valid || crossDocumentBusy;
  if (valid) {
    crossDocumentReturnButton.title = t(`Return to ${item.sourceName}`, `返回 ${item.sourceName}`);
    crossDocumentReturnButton.setAttribute('aria-label', crossDocumentReturnButton.title);
  }
}

async function openConfirmedBibliographyTarget(entry) {
  if (crossDocumentBusy || !pdfDoc || !currentFileKey) return false;
  const target = bibliographyLinkTarget(entry);
  if (!target) {
    showError(t('Linked PDF is not available in the local library. Relink it.', '关联的 PDF 不在本地文库中，请重新关联。'));
    return false;
  }
  const sourceId = currentFileKey;
  const sourceName = currentFileName || t('Source paper', '原文');
  const captured = snapshotDisplayAnchor();
  const anchor = captured || { page: currentPage, ratio: Math.max(0, Math.min(1, primaryCanvasWrap.scrollTop / Math.max(1, primaryPageSurface?.offsetHeight || 1))) };
  // Claim the lock *before* the first await. Two rapid clicks must never
  // both get through asynchronous IndexedDB availability checks.
  crossDocumentBusy = true;
  updateCrossDocumentReturnButton();
  try {
    // A return path is only guaranteed when the source is cached locally.
    if (!cacheEnabledForCurrent || !(await dbGet('files', sourceId))?.blob) {
      showError(t('Cache this source PDF before opening a linked paper.', '请先将原文存入本地缓存，再打开关联论文。'));
      return false;
    }
    await flushCurrentDocumentSession();
    const opened = await openCachedDocument(target.id);
    if (!opened || currentFileKey !== target.id) {
      // If the linked PDF fails, try to restore the previously open source.
      if (currentFileKey !== sourceId) await openCachedDocument(sourceId);
      return false;
    }
    crossDocumentReturnStack.push({ sourceId, sourceName, targetId: target.id,
      page: Math.max(1, Number(anchor.page) || 1), ratio: Math.max(0, Math.min(1, Number(anchor.ratio) || 0)) });
    if (crossDocumentReturnStack.length > 16) crossDocumentReturnStack.shift();
    showNotice(t('Linked PDF opened. Use Return to paper to go back.', '已打开关联 PDF，可点击“返回原文”。'));
    return true;
  } catch (error) {
    console.warn('Cross-document navigation failed', error);
    if (currentFileKey !== sourceId) await openCachedDocument(sourceId);
    showError(t('Could not open linked PDF.', '无法打开关联的 PDF。'));
    return false;
  } finally {
    crossDocumentBusy = false;
    updateCrossDocumentReturnButton();
  }
}

async function returnToCrossDocumentSource() {
  if (crossDocumentBusy || !pdfDoc) return false;
  const item = crossDocumentReturnStack.at(-1);
  if (!item || item.targetId !== currentFileKey) return false;
  crossDocumentBusy = true;
  try {
    await flushCurrentDocumentSession();
    const opened = await openCachedDocument(item.sourceId);
    if (!opened || currentFileKey !== item.sourceId) {
      if (currentFileKey !== item.targetId) await openCachedDocument(item.targetId);
      return false;
    }
    const previousHistorySuppression = suppressReadingHistory;
    suppressReadingHistory = true;
    try { await goToLocation(item.page, item.ratio, { contextLead: false }); }
    finally { suppressReadingHistory = previousHistorySuppression; }
    // Only consume this return path after both the source PDF and its exact
    // anchor have been restored. A failed page navigation must stay retryable.
    crossDocumentReturnStack.pop();
    showNavigationLandingCue(item.page, item.ratio);
    return true;
  } catch (error) {
    console.warn('Return to source paper failed', error);
    if (currentFileKey !== item.targetId) await openCachedDocument(item.targetId);
    showError(t('Could not restore the source paper.', '无法返回原文。'));
    return false;
  } finally {
    crossDocumentBusy = false;
    updateCrossDocumentReturnButton();
  }
}

function renderBibliographyLocalLink(entry, row, actions) {
  const key = bibliographyLinkKey(entry);
  if (!key) return;
  const linkedId = confirmedBibliographyLinks.get(key);
  const linked = bibliographyLinkTarget(entry);
  const available = localLibrary.filter((r) => r.localAvailable && r.id !== currentFileKey);
  const action = (name, title, handler) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'bibliography-local-button';
    button.textContent = name; button.title = title;
    button.addEventListener('click', handler);
    actions.append(button);
    return button;
  };
  if (linked) {
    action(t('Open PDF', '打开 PDF'), linked.name || linked.id, () => void openConfirmedBibliographyTarget(entry));
    action(t('Unlink', '解除关联'), t('Remove this confirmed link', '解除当前已确认关联'), () => void updateConfirmedBibliographyLink(entry));
  } else {
    const button = action(linkedId ? t('Relink PDF', '重新关联') : t('Link PDF', '关联 PDF'),
      t('Choose a PDF already stored in your local library', '选择本地文库中的 PDF'), () => {
        const old = row.querySelector('.bibliography-link-picker');
        if (old) { old.remove(); return; }
        if (!available.length) {
          showNotice(t('Open and cache another PDF before linking it.', '请先打开并缓存另一份 PDF。'));
          return;
        }
        const picker = document.createElement('div'); picker.className = 'bibliography-link-picker';
        const select = document.createElement('select');
        select.setAttribute('aria-label', t('Choose linked local PDF', '选择关联的本地 PDF'));
        const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = t('Select a local PDF…', '选择本地 PDF…');
        select.append(placeholder);
        for (const candidate of available) {
          const option = document.createElement('option'); option.value = candidate.id; option.textContent = candidate.name || candidate.id;
          select.append(option);
        }
        const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'bibliography-local-button';
        confirm.textContent = t('Link', '关联'); confirm.disabled = true;
        select.addEventListener('change', () => { confirm.disabled = !select.value; });
        confirm.addEventListener('click', async () => {
          confirm.disabled = true;
          if (!(await updateConfirmedBibliographyLink(entry, select.value))) confirm.disabled = !select.value;
        });
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'bibliography-local-button'; cancel.textContent = t('Cancel', '取消');
        cancel.addEventListener('click', () => picker.remove());
        picker.append(select, confirm, cancel); row.append(picker); select.focus();
      });
    button.disabled = false;
  }
}

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
    renderBibliographyLocalLink(entry, row, actions);
    if (actions.childElementCount) row.append(actions);
    renderBibliographyCitations();
    bibliographyIndex.append(row);
  }
  applyDocumentMapFilter(el('map-filter-bibliography')); updateDocumentMapCurrentLocation();
}

