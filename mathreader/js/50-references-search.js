// MathReader v306 · Reference links, TOC mapping, backlinks, glossary, and search.
function textLayerAggregate(layer) {
  let text = ''; const parts = [];
  for (const span of layer.querySelectorAll('span')) {
    const node = [...span.childNodes].find((child) => child.nodeType === Node.TEXT_NODE);
    if (!node || !node.nodeValue) continue;
    const start = text.length; text += node.nodeValue; const end = text.length;
    parts.push({ node, start, end }); text += ' ';
  }
  return { text, parts };
}

function rangeForAggregateMatch(parts, start, end) {
  const first = parts.find((part) => start >= part.start && start < part.end);
  const last = [...parts].reverse().find((part) => end > part.start && end <= part.end + 1);
  if (!first || !last) return null;
  const range = document.createRange();
  try {
    range.setStart(first.node, Math.max(0, Math.min(first.node.length, start - first.start)));
    range.setEnd(last.node, Math.max(0, Math.min(last.node.length, Math.min(end, last.end) - last.start)));
    return range;
  } catch (_) { return null; }
}

function ensureReferenceLinkLayer(surface) {
  let layer = surface.querySelector(':scope > .reference-link-layer');
  if (!layer) { layer = document.createElement('div'); layer.className = 'reference-link-layer'; surface.append(layer); }
  layer.replaceChildren(); return layer;
}

async function equationTargetAtLocation(query, pageNum, ratio) {
  if (!isEquationLabelQuery(query) || !Number.isFinite(Number(ratio))) return null;
  const label = normalizedEquationLabel(query);
  const index = await buildEquationLabelIndex();
  const candidates = index.get(label) || [];
  let best = null;
  for (const candidate of candidates) {
    if (Number(candidate.page) !== Number(pageNum)) continue;
    const delta = Math.abs((Number(candidate.ratio) || 0) - Number(ratio));
    if (delta > 0.035) continue;
    const confidence = Number.isFinite(candidate.confidence) ? candidate.confidence : equationCandidateConfidence(candidate, label);
    if (confidence < 8) continue;
    if (!best || delta < best.delta) best = { page: candidate.page, ratio: Number(candidate.ratio) || 0, delta };
  }
  return best ? { page: best.page, ratio: best.ratio } : null;
}

function referenceLinkRectAlreadyCovered(overlay, left, top, width, height) {
  const right = left + width;
  const bottom = top + height;
  for (const node of overlay.querySelectorAll('.pdf-reference-link')) {
    const x = Number.parseFloat(node.style.left) || 0;
    const y = Number.parseFloat(node.style.top) || 0;
    const w = Number.parseFloat(node.style.width) || 0;
    const h = Number.parseFloat(node.style.height) || 0;
    const overlapW = Math.max(0, Math.min(right, x + w) - Math.max(left, x));
    const overlapH = Math.max(0, Math.min(bottom, y + h) - Math.max(top, y));
    const overlap = overlapW * overlapH;
    const smaller = Math.min(width * height, w * h);
    const sameLine = Math.abs((top + height / 2) - (y + h / 2)) <= Math.max(2, Math.min(height, h) * 0.35);
    if (sameLine && smaller > 0 && overlap / smaller >= 0.55) return true;
  }
  return false;
}

function appendReferenceLinkForRange(overlay, surface, range, query, pageNum) {
  if (!range) return;
  const surfaceRect = surface.getBoundingClientRect();
  for (const rect of range.getClientRects()) {
    if (rect.width < 2 || rect.height < 2) continue;
    const left = rect.left - surfaceRect.left;
    const top = rect.top - surfaceRect.top;
    if (referenceLinkRectAlreadyCovered(overlay, left, top, rect.width, rect.height)) continue;
    const link = document.createElement('button'); link.type = 'button'; link.className = 'pdf-reference-link';
    link.style.left = `${left}px`; link.style.top = `${top}px`; link.style.width = `${rect.width}px`; link.style.height = `${rect.height}px`;
    link.title = t(`Follow ${query}`, `跳转到 ${query}`); link.setAttribute('aria-label', link.title);
    const sourceRatio = surfaceRect.height > 0
      ? Math.min(1, Math.max(0, ((rect.top - surfaceRect.top) + rect.height / 2) / surfaceRect.height))
      : null;
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideReferencePreview();
      if ((pendingEquationReselectKey || pendingEquationAddKey) && isEquationLabelQuery(query)) {
        if (applyEquationLinkCorrection(query, pageNum, sourceRatio)) return;
      }
      // A right-margin equation tag is the destination itself, not a reference
      // that should resolve to another copy of the same label. Clicking it should
      // reveal backlinks for that equation without producing "No target found".
      const equationTarget = await equationTargetAtLocation(query, pageNum, sourceRatio);
      if (equationTarget) {
        await updateBacklinksForTarget(query, equationTarget);
        return;
      }
      await goToReferenceQuery(query, pageNum, sourceRatio);
    });
    attachReferencePreview(link, query, pageNum, sourceRatio);
    overlay.append(link);
  }
}

function groupedBibliographyMembers(raw) {
  const inner = String(raw || '').replace(/^\[|\]$/g, '');
  const members = [];
  const tokenRe = /\d{1,3}(?:\s*[-–—]\s*\d{1,3})?/g;
  let token;
  while ((token = tokenRe.exec(inner))) {
    const value = token[0];
    const rangeMatch = value.match(/^(\d{1,3})\s*[-–—]\s*(\d{1,3})$/);
    if (!rangeMatch) {
      const number = Number(value);
      if (number >= 1) members.push(number);
      continue;
    }
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    if (start < 1 || end < 1 || Math.abs(end - start) > 50) continue;
    const step = start <= end ? 1 : -1;
    for (let number = start; number !== end + step; number += step) members.push(number);
  }
  return [...new Set(members)].slice(0, 60);
}

function tocTitlePattern(title) {
  const clean = String(title || '').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 3) return null;
  const escape = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const numbered = clean.match(/^([A-Z]?\d+(?:\.\d+)*)(?:[.)])?\s+(.+)$/i);
  const source = numbered
    ? `${escape(numbered[1])}\\s*[.)]?\\s+${escape(numbered[2])}`
    : escape(clean);
  try { return new RegExp(source, 'ig'); } catch (_) { return null; }
}

function tocSectionNumber(title) {
  const clean = String(title || '').replace(/\s+/g, ' ').trim();
  return clean.match(/^(?:§\s*)?([A-Z]?\d+(?:\.\d+){1,4})(?:[.)])?(?:\s|$)/i)?.[1] || '';
}

async function findSectionNumberLocation(number, originPage = null) {
  if (!pdfDoc || !number) return null;
  const escaped = String(number).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingRe = new RegExp(`^(?:§\\s*)?${escaped}(?:[.)])?\\s+\\S`, 'i');
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    if (page === originPage) continue;
    const lines = await pageTextLines(page);
    for (const line of lines) {
      if (headingRe.test(String(line.text || '').trim())) return { page, ratio: Number(line.ratio) || 0 };
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return null;
}

async function resolveTocSectionNumber(number, targets, originPage = null) {
  const direct = (targets || []).find((target) => tocSectionNumber(target.title) === number && Number(target.page) !== Number(originPage));
  if (direct) return { page: direct.page, ratio: Number(direct.ratio) || 0 };
  const inferred = inferredOutline.find((entry) => tocSectionNumber(entry?.title) === number && Number(entry?.page) !== Number(originPage));
  if (inferred) return { page: inferred.page, ratio: Number(inferred.ratio) || 0 };
  return findSectionNumberLocation(number, originPage);
}

async function findTocTitleLocation(title, originPage = null) {
  if (!pdfDoc || !title) return null;
  const wanted = tocComparableTitle(title);
  if (!wanted) return null;
  let best = null;
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    if (Number(page) === Number(originPage)) continue;
    const lines = await pageTextLines(page);
    for (const line of lines) {
      const text = String(line.text || '').trim();
      if (!text || text.length > 240) continue;
      const score = tocTitleSimilarity(text, title);
      if (score < 0.86) continue;
      // Prefer heading-like lines over prose mentions of the same words.
      const number = tocSectionNumber(title);
      const exactNumber = number && tocSectionNumber(text) === number;
      const headingBonus = exactNumber ? 0.12 : (text.length <= String(title).length + 24 ? 0.04 : 0);
      const finalScore = score + headingBonus;
      if (!best || finalScore > best.score) best = { page, ratio: Number(line.ratio) || 0, score: finalScore };
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return best ? { page: best.page, ratio: best.ratio } : null;
}

async function resolveTocContentDestination(target, originPage) {
  if (!target) return null;
  const targetPage = Number(target.page) || 0;
  if (targetPage && targetPage !== Number(originPage)) {
    return { page: targetPage, ratio: Number(target.ratio) || 0 };
  }
  const number = tocSectionNumber(target.title);
  if (number) {
    const byNumber = await resolveTocSectionNumber(number, [], originPage);
    if (byNumber) return byNumber;
  }
  return findTocTitleLocation(target.title, originPage);
}


function tocLineCore(value) {
  let clean = String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  // Drop the visual dot leader and printed page number commonly found in TOCs.
  clean = clean.replace(/\s*(?:\.{2,}|…+|·{3,})\s*\d{1,4}\s*$/u, '').trim();
  // Some text layers lose the dot leader but retain the terminal page number.
  if (/^(?:§\s*)?[A-Z]?\d+(?:\.\d+){0,4}[.)]?\s+\S/i.test(clean) && /\s\d{1,4}$/.test(clean)) {
    clean = clean.replace(/\s+\d{1,4}\s*$/, '').trim();
  }
  return clean;
}

function tocComparableTitle(value) {
  return normalizeSearchValue(tocLineCore(value), false)
    .replace(/^(?:§\s*)?[a-z]?\d+(?:\.\d+){0,4}[.)]?\s*/i, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tocTitleSimilarity(a, b) {
  const aa = tocComparableTitle(a);
  const bb = tocComparableTitle(b);
  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if ((aa.includes(bb) || bb.includes(aa)) && Math.min(aa.length, bb.length) >= 8) {
    return Math.min(0.97, Math.min(aa.length, bb.length) / Math.max(aa.length, bb.length) + 0.12);
  }
  const aTokens = new Set(aa.split(/\s+/).filter((token) => token.length > 1));
  const bTokens = new Set(bb.split(/\s+/).filter((token) => token.length > 1));
  let overlap = 0;
  for (const token of aTokens) if (bTokens.has(token)) overlap += 1;
  const union = new Set([...aTokens, ...bTokens]).size || 1;
  const jaccard = overlap / union;
  const maxLen = Math.max(aa.length, bb.length, 1);
  const maxDistance = Math.ceil(maxLen * 0.35);
  const distance = levenshteinDistance(aa, bb, maxDistance);
  const edit = distance > maxDistance ? 0 : Math.max(0, 1 - distance / maxLen);
  return Math.max(jaccard, edit * 0.9 + jaccard * 0.1);
}

function tocStructureMatchScore(lineText, targetTitle) {
  const line = tocLineCore(lineText);
  const lineNumber = tocSectionNumber(line);
  const targetNumber = tocSectionNumber(targetTitle);
  if (lineNumber && targetNumber && lineNumber !== targetNumber) return 0;
  const titleScore = tocTitleSimilarity(line, targetTitle);
  if (lineNumber && targetNumber && lineNumber === targetNumber) {
    // Exact section numbering is authoritative; title similarity distinguishes
    // a real TOC entry from incidental mentions of the same section number.
    return Math.max(0.82, 0.78 + titleScore * 0.22);
  }
  return titleScore;
}

async function compareTocPageWithStructure(pageNum, targets) {
  const lines = await pageTextLines(pageNum);
  const matches = [];
  const usedTargets = new Set();
  for (const line of lines) {
    const core = tocLineCore(line.text);
    if (!core || core.length < 3) continue;
    let best = null;
    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i];
      if (!target || Number(target.page) === Number(pageNum) || usedTargets.has(i)) continue;
      const score = tocStructureMatchScore(core, target.title);
      const hasExactNumber = Boolean(tocSectionNumber(core) && tocSectionNumber(core) === tocSectionNumber(target.title));
      const threshold = hasExactNumber ? 0.80 : 0.84;
      if (score < threshold) continue;
      if (!best || score > best.score) best = { line, target, targetIndex: i, score, hasExactNumber };
    }
    if (best) {
      matches.push(best);
      usedTargets.add(best.targetIndex);
    }
  }
  // Three distinct structural matches are enough to classify a page as a TOC.
  // Requiring distinct nodes prevents a body page from qualifying because one
  // heading is repeated in prose.
  const average = matches.length ? matches.reduce((sum, item) => sum + item.score, 0) / matches.length : 0;
  return { matches, isToc: matches.length >= 3 && average >= 0.82, average };
}

function tocLinePattern(lineText) {
  const core = tocLineCore(lineText);
  if (!core) return null;
  const escape = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokens = core.split(/\s+/).filter(Boolean).slice(0, 24);
  if (!tokens.length) return null;
  const source = tokens.map(escape).join('\\s+');
  try { return new RegExp(source, 'ig'); } catch (_) { return null; }
}

const HEADING_ALIAS_STOPWORDS = new Set(['a','an','the','of','and','or','in','on','for','to','with','by','from','as','at']);

function headingAliasForTitle(title) {
  const clean = tocLineCore(title).replace(/^(?:§\s*)?[A-Z]?\d+(?:\.\d+){0,4}[.)]?\s*/i, '').trim();
  if (!clean) return '';
  if (/^[A-Z][A-Z0-9]{1,7}$/.test(clean)) return clean;
  const words = (clean.match(/[A-Za-z][A-Za-z'-]*/g) || []).filter((word) => !HEADING_ALIAS_STOPWORDS.has(word.toLowerCase()));
  if (words.length < 2 || words.length > 7) return '';
  const alias = words.map((word) => word[0].toUpperCase()).join('');
  return /^[A-Z]{2,7}$/.test(alias) ? alias : '';
}

function unambiguousHeadingAliases(targets) {
  const buckets = new Map();
  for (const target of targets || []) {
    const alias = headingAliasForTitle(target?.title);
    if (!alias) continue;
    const list = buckets.get(alias) || [];
    list.push(target);
    buckets.set(alias, list);
  }
  const result = new Map();
  for (const [alias, list] of buckets) {
    const unique = list.filter((item, index, arr) => arr.findIndex((other) => Number(other.page) === Number(item.page) && String(other.title) === String(item.title)) === index);
    if (unique.length === 1) result.set(alias, unique[0]);
  }
  return result;
}

function appendHeadingAliasLinks(mapped, overlay, surface, pageNum, targets) {
  const aliases = unambiguousHeadingAliases(targets);
  for (const [alias, target] of aliases) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    let match;
    while ((match = re.exec(mapped.text))) {
      if (Number(target.page) === Number(pageNum) && normalizeSearchValue(target.title, false) === normalizeSearchValue(alias, false)) continue;
      const range = rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
      appendReferenceLinkForRange(overlay, surface, range, alias, pageNum);
    }
  }
}

async function getTocOutlineTargets() {
  if (!pdfDoc) return [];
  if (Array.isArray(tocOutlineTargets)) return tocOutlineTargets;
  const targets = [];
  const seen = new Set();
  const addTarget = (title, page, ratio) => {
    const clean = String(title || '').replace(/\s+/g, ' ').trim();
    if (!clean || !Number(page)) return;
    const number = tocSectionNumber(clean);
    const key = number ? `n:${number}` : `t:${normalizeSearchValue(clean, false)}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ title: clean, page: Number(page), ratio: Number(ratio) || 0 });
  };
  try {
    const outline = await pdfDoc.getOutline();
    const flat = flattenOutline(outline);
    for (const { item } of flat) {
      const title = String(item?.title || '').replace(/\s+/g, ' ').trim();
      if (!title) continue;
      const location = await resolveOutlineDestination(item.dest);
      if (location) addTarget(title, location.page, location.ratio);
    }
  } catch (_) {}
  // Merge any detected structure instead of letting a partial embedded outline
  // suppress valid subsection targets.
  for (const entry of inferredOutline || []) addTarget(entry?.title, entry?.page, entry?.ratio);
  if (targets.length) tocOutlineTargets = targets;
  return targets;
}

async function decorateTocLinks(mapped, overlay, surface, pageNum, serial) {
  if (!mapped?.text || !pdfDoc) return;
  const targets = await getTocOutlineTargets();
  if (!targets.length || overlay.dataset.tocSerial !== String(serial) || !overlay.isConnected) return;

  const comparison = await compareTocPageWithStructure(pageNum, targets);
  if (overlay.dataset.tocSerial !== String(serial) || !overlay.isConnected) return;
  const head = mapped.text.slice(0, 700).replace(/\s+/g, ' ');
  const hasTocHeading = /(?:table\s+of\s+contents|\bcontents\b|目录)/i.test(head);
  if (!hasTocHeading && !comparison.isToc) return;

  const seen = new Set();
  let linked = 0;
  const surfaceRect = surface.getBoundingClientRect();

  const addLinkForRange = (range, target, label) => {
    if (!range) return false;
    let added = false;
    for (const rect of range.getClientRects()) {
      if (rect.width < 6 || rect.height < 2) continue;
      const key = `${Math.round(rect.left)}:${Math.round(rect.top)}:${Math.round(rect.width)}:${target.page}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'pdf-reference-link pdf-toc-link';
      link.style.left = `${rect.left - surfaceRect.left}px`;
      link.style.top = `${rect.top - surfaceRect.top}px`;
      link.style.width = `${rect.width}px`;
      link.style.height = `${rect.height}px`;
      link.title = t(`Go to ${label || target.title}`, `跳转到 ${label || target.title}`);
      link.setAttribute('aria-label', link.title);
      attachReferencePreview(link, target.title || label || '', pageNum, null);
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        hideReferencePreview();
        const destination = await resolveTocContentDestination(target, pageNum);
        if (!destination) return;
        await goToMatchedLocation(destination.page, Number(destination.ratio) || 0, target.title || label || '');
      });
      overlay.append(link);
      added = true;
    }
    return added;
  };

  // Primary path: compare each visual TOC line against the already-detected
  // document structure. This makes TOC recognition a structure-alignment
  // problem rather than another independent heading parser.
  for (const match of comparison.matches) {
    const patterns = [tocLinePattern(match.line.text), tocTitlePattern(match.target.title)].filter(Boolean);
    let added = false;
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let found;
      while ((found = pattern.exec(mapped.text))) {
        const range = rangeForAggregateMatch(mapped.parts, found.index, found.index + found[0].length);
        if (addLinkForRange(range, match.target, match.line.text)) { added = true; break; }
      }
      if (added) break;
    }
    // PDF.js may split the title beyond recoverable text matching. In that
    // case, the section number remains a stable visual anchor for the line.
    if (!added) {
      const number = tocSectionNumber(match.line.text) || tocSectionNumber(match.target.title);
      if (number) {
        const escaped = number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const numberRe = new RegExp(`\\b${escaped}\\b`, 'g');
        let found;
        while ((found = numberRe.exec(mapped.text))) {
          const range = rangeForAggregateMatch(mapped.parts, found.index, found.index + found[0].length);
          if (!range) continue;
          const rect = [...range.getClientRects()].find((candidate) => (candidate.left - surfaceRect.left) < surfaceRect.width * 0.42);
          if (!rect) continue;
          if (addLinkForRange(range, match.target, match.line.text)) { added = true; break; }
        }
      }
    }
    if (added) linked += 1;
  }

  // Secondary exact-title pass fills entries that were not part of the fuzzy
  // structure comparison but still match an authoritative outline node.
  for (const target of targets) {
    const pattern = tocTitlePattern(target.title);
    if (!pattern) continue;
    let found;
    while ((found = pattern.exec(mapped.text))) {
      const range = rangeForAggregateMatch(mapped.parts, found.index, found.index + found[0].length);
      if (addLinkForRange(range, target, target.title)) { linked += 1; break; }
    }
  }

  // Last-resort section-number links remain useful when PDF text segmentation
  // destroys the title entirely. Destination resolution still consults the
  // merged structure before searching the document.
  const numberedSeen = new Set();
  const subsectionRe = /\b([A-Z]?\d+(?:\.\d+){1,4})\b/gi;
  let numberMatch;
  while ((numberMatch = subsectionRe.exec(mapped.text))) {
    const number = numberMatch[1];
    if (numberedSeen.has(number)) continue;
    const range = rangeForAggregateMatch(mapped.parts, numberMatch.index, numberMatch.index + numberMatch[0].length);
    if (!range) continue;
    const rect = [...range.getClientRects()].find((candidate) => candidate.width >= 6 && candidate.height >= 2 && (candidate.left - surfaceRect.left) < surfaceRect.width * 0.42);
    if (!rect) continue;
    numberedSeen.add(number);
    const target = await resolveTocSectionNumber(number, targets, pageNum);
    if (!target) continue;
    const synthetic = { title: number, page: target.page, ratio: target.ratio };
    if (addLinkForRange(range, synthetic, number)) linked += 1;
  }

  if (linked) overlay.dataset.tocLinked = String(linked);
  overlay.dataset.tocStructureMatches = String(comparison.matches.length);
}

function decorateReferenceLinks(textLayer, surface, pageNum) {
  if (!textLayer || !surface) return;
  const overlay = ensureReferenceLinkLayer(surface);
  const mapped = textLayerAggregate(textLayer); if (!mapped.text) return;
  const tocSerial = ++tocDecorationSerial;
  overlay.dataset.tocSerial = String(tocSerial);

  // Grouped citations such as [1, 7] or [1-3, 8] need one target per
  // bibliography member. Prefer the number's own glyph range when it is
  // explicitly present; generated range members share the group's range.
  GROUPED_BIBLIOGRAPHY_RE.lastIndex = 0;
  let grouped;
  while ((grouped = GROUPED_BIBLIOGRAPHY_RE.exec(mapped.text))) {
    const raw = grouped[0];
    const explicitNumbers = [];
    const numberRe = /\d{1,3}/g;
    let numberMatch;
    while ((numberMatch = numberRe.exec(raw))) {
      explicitNumbers.push({ number: Number(numberMatch[0]), start: grouped.index + numberMatch.index, end: grouped.index + numberMatch.index + numberMatch[0].length });
    }
    const members = groupedBibliographyMembers(raw);
    const explicitSet = new Set(explicitNumbers.map((item) => item.number));
    for (const item of explicitNumbers) {
      const range = rangeForAggregateMatch(mapped.parts, item.start, item.end);
      appendReferenceLinkForRange(overlay, surface, range, `[${item.number}]`, pageNum);
    }
    const generated = members.filter((number) => !explicitSet.has(number));
    if (generated.length) {
      const groupRange = rangeForAggregateMatch(mapped.parts, grouped.index, grouped.index + raw.length);
      for (const number of generated) appendReferenceLinkForRange(overlay, surface, groupRange, `[${number}]`, pageNum);
    }
  }

  // Author-style and mixed bibliography groups such as [Wg, W1] are
  // linked token-by-token, but only when a token exists in the detected
  // bibliography. The brackets themselves are not treated as a key.
  if (bibliographyEntries.length) {
    const knownBib = new Map(bibliographyEntries.map((entry) => [normalizedBibliographyKey(entry.number), entry]));
    const bracketGroupRe = /\[[^\]\n]{1,80}\]/g;
    let bracketGroup;
    while ((bracketGroup = bracketGroupRe.exec(mapped.text))) {
      const raw = bracketGroup[0];
      const inner = raw.slice(1, -1);
      const tokenRe = /[^,;]+/g;
      let tokenMatch;
      while ((tokenMatch = tokenRe.exec(inner))) {
        const tokenRaw = tokenMatch[0];
        const leading = tokenRaw.match(/^\s*/)?.[0].length || 0;
        const trailing = tokenRaw.match(/\s*$/)?.[0].length || 0;
        const token = tokenRaw.slice(leading, Math.max(leading, tokenRaw.length - trailing));
        if (!token || /[-–—]/.test(token) && /^\d/.test(token)) continue;
        const key = normalizedBibliographyKey(token);
        const bib = knownBib.get(key);
        if (!bib) continue;
        const start = bracketGroup.index + 1 + tokenMatch.index + leading;
        const end = start + token.length;
        const range = rangeForAggregateMatch(mapped.parts, start, end);
        appendReferenceLinkForRange(overlay, surface, range, bib.label || `[${token}]`, pageNum);
      }
    }
  }

  CLICKABLE_REFERENCE_RE.lastIndex = 0;
  let match;
  while ((match = CLICKABLE_REFERENCE_RE.exec(mapped.text))) {
    const query = match[0].replace(/\s+/g, ' ').trim();
    if (/^\(/.test(query) && isLikelyCalendarYearEquationLabel(query)) continue;
    const range = rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
    appendReferenceLinkForRange(overlay, surface, range, query, pageNum);
  }
  getTocOutlineTargets().then((targets) => appendHeadingAliasLinks(mapped, overlay, surface, pageNum, targets)).catch(() => {});
  decorateTocLinks(mapped, overlay, surface, pageNum, tocSerial).catch((error) => console.warn('MathReader TOC links unavailable for page', pageNum, error));
}

function rerenderReferenceLinks() {
  if (primaryTextLayer && primaryPageSurface && currentPage) decorateReferenceLinks(primaryTextLayer, primaryPageSurface, currentPage);
  if (referenceTextLayer && referencePageSurface && pinnedPage) decorateReferenceLinks(referenceTextLayer, referencePageSurface, pinnedPage);
  for (const [page, record] of continuousPageNodes) if (record?.rendered) decorateReferenceLinks(record.textLayer, record.surface, page);
}

function rerenderReferenceLinksAfterStructureEdit() {
  // Structure edits are local metadata changes. Rebuilding reference overlays for
  // every rendered page makes edits scale with document length in continuous
  // reading mode. Refresh only the currently relevant page surfaces; other pages
  // pick up the revised Structure lazily when they render again.
  if (primaryTextLayer && primaryPageSurface && currentPage) decorateReferenceLinks(primaryTextLayer, primaryPageSurface, currentPage);
  if (referenceTextLayer && referencePageSurface && pinnedPage) decorateReferenceLinks(referenceTextLayer, referencePageSurface, pinnedPage);
  const currentRecord = continuousPageNodes.get(currentPage);
  if (currentRecord?.rendered) decorateReferenceLinks(currentRecord.textLayer, currentRecord.surface, currentPage);
}

async function findReferenceTextLocation(query, originPage = null) {
  const wanted = normalizeSearchValue(query, false);
  let best = null;
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    const lines = await pageTextLines(page);
    for (const line of lines) {
      if (!normalizeSearchValue(line.text, false).includes(wanted)) continue;
      let score = page === originPage ? -2 : 0;
      score += Math.max(0, 3 - line.text.length / 100);
      if (!best || score > best.score) best = { page, ratio: line.ratio, score };
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return best;
}


function backlinkSnippet(text, query, explicitIndex = null) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';
  const q = String(query || '').replace(/\s+/g, ' ').trim();
  const lower = value.toLocaleLowerCase();
  let idx = Number.isFinite(Number(explicitIndex)) ? Number(explicitIndex) : (q ? lower.indexOf(q.toLocaleLowerCase()) : -1);
  if (idx < 0) idx = 0;
  const qEnd = Math.min(value.length, idx + Math.max(1, q.length));
  const leftSlice = value.slice(Math.max(0, idx - 240), idx);
  const leftBoundary = Math.max(leftSlice.lastIndexOf('. '), leftSlice.lastIndexOf('? '), leftSlice.lastIndexOf('! '), leftSlice.lastIndexOf('; '));
  const start = leftBoundary >= 0 ? Math.max(0, idx - 240 + leftBoundary + 2) : Math.max(0, idx - 105);
  const rightSlice = value.slice(qEnd, Math.min(value.length, qEnd + 280));
  const boundaries = ['. ', '? ', '! ', '; '].map((token) => rightSlice.indexOf(token)).filter((v) => v >= 0);
  const rightBoundary = boundaries.length ? Math.min(...boundaries) + 1 : -1;
  const finish = rightBoundary >= 0 ? Math.min(value.length, qEnd + rightBoundary) : Math.min(value.length, start + 250);
  const snippet = value.slice(start, finish).trim();
  return `${start > 0 ? '…' : ''}${snippet}${finish < value.length ? '…' : ''}`;
}

function proofContextForLocation(page, ratio) {
  const p = Number(page);
  const r = Number(ratio) || 0;
  for (const entry of structureEntries || []) {
    if (!entry?.proofPage) continue;
    const startPage = Number(entry.proofPage);
    const endPage = Number(entry.proofEndPage || entry.proofPage);
    if (p < startPage || p > endPage) continue;
    if (p === startPage && r + 0.01 < (Number(entry.proofRatio) || 0)) continue;
    if (p === endPage && entry.proofEndRatio != null && r - 0.01 > Number(entry.proofEndRatio)) continue;
    return entry.label || entry.title || '';
  }
  return '';
}

function renderBacklinks() {
  if (!backlinksList || !backlinksEmpty || !backlinksCount || !backlinksContext) return;
  backlinksList.replaceChildren();
  const visible=backlinkEntries;
  backlinksCount.textContent = String(backlinkEntries.length);
  backlinksContext.textContent = backlinkContext?.label ? t(`References to ${backlinkContext.label}`, `引用 ${backlinkContext.label} 的位置`) : '';
  backlinksEmpty.classList.toggle('is-hidden', visible.length > 0);
  backlinksEmpty.textContent=t('Follow a reference to see backlinks.','跟随引用后可在这里查看反向引用。');
  for (const entry of visible.slice(0, 120)) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'backlink-item';
    const meta = document.createElement('span'); meta.className = 'backlink-meta';
    const proofOwner = entry.proofOwner || proofContextForLocation(entry.page, entry.ratio);
    meta.textContent = proofOwner ? t(`Page ${entry.page} · proof of ${proofOwner}`, `第 ${entry.page} 页 · ${proofOwner} 的证明`) : t(`Page ${entry.page}`, `第 ${entry.page} 页`);
    const snippet = document.createElement('span'); snippet.className = 'backlink-snippet'; snippet.textContent = entry.snippet || entry.text || '';
    button.append(meta, snippet);
    button.addEventListener('click', () => {
      if (entry.searchMatch && entry.matchText) goToSearchMatch(entry.searchMatch, entry.matchText);
      else goToMatchedLocation(entry.page, Number(entry.ratio) || 0, entry.matchText || backlinkContext?.label || '');
    });
    backlinksList.append(button);
  }
}

async function collectBacklinks(query, target) {
  if (!pdfDoc || !documentTextFeaturesAvailable() || !query || !target) return [];
  const results = [];
  const seen = new Set();
  const add = (page, ratio, text, matchText = query, extra = {}) => {
    if (Number(page) === Number(target.page) && Math.abs((Number(ratio)||0) - (Number(target.ratio)||0)) < 0.025) return;
    const occurrenceKey = Number.isFinite(Number(extra.matchIndex)) ? `:${Number(extra.matchIndex)}` : '';
    const key = `${page}:${Math.round((Number(ratio)||0)*10000)}:${String(text).slice(0,80)}${occurrenceKey}`;
    if (seen.has(key)) return; seen.add(key);
    const owner=proofContextForLocation(page, ratio);
    results.push({ page, ratio:Number(ratio)||0, text, snippet:extra.snippet || backlinkSnippet(text, matchText || query, extra.matchIndex), matchText, proofOwner: owner, kind: extra.kind || (owner ? 'proof' : 'prose'), ...extra });
  };
  const normalized = normalizedReferenceLabel(query);
  const eq = isEquationLabelQuery(query) ? normalizedEquationLabel(query) : null;
  const bibKey = /^\[[^\]]+\]$/.test(String(query || '').trim()) ? normalizedBibliographyKey(query) : '';
  const structureLike = /^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|conjecture|question|assumption|hypothesis)\b/i.test(query);
  const acronym = /^[A-Z][A-Z0-9]{1,7}$/.test(String(query).trim()) ? String(query).trim() : null;
  const structureTarget = structureEntries.find((entry) => Number(entry.page) === Number(target.page) && Math.abs((Number(entry.ratio)||0) - (Number(target.ratio)||0)) < 0.04) || null;
  const structureAlias = structureTarget ? headingAliasForTitle(structureTarget.title || structureTarget.label || '') : '';
  const structureLabel = structureTarget?.label || '';
  // Bibliography citations already have an authoritative occurrence list built
  // while scanning body text before the References/Bibliography section. Reuse
  // it here instead of rescanning every page, which could mistakenly count the
  // bibliography definition itself as a backlink to its own entry.
  if (bibKey) {
    const bib = bibliographyEntries.find((entry) => normalizedBibliographyKey(entry.number) === bibKey);
    for (const citation of bib?.citations || []) {
      add(citation.page, citation.ratio, citation.raw || query, citation.raw || query, {
        matchIndex: citation.matchIndex,
        snippet: citation.snippet,
        kind: 'bibliography'
      });
    }
    return results.sort((a,b)=>a.page-b.page || a.ratio-b.ratio || (Number(a.matchIndex)||0)-(Number(b.matchIndex)||0));
  }

  for (let page=1; page<=pdfDoc.numPages; page+=1) {
    const lines = await pageTextLines(page);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const text = String(line.text || '');
      const contextText = lines.slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 2)).map((item) => item.text).join(' ').replace(/\s+/g, ' ').trim();
      if (eq) {
        for (const c of equationLabelCandidatesInLine(text)) if (c.label === eq) {
          const contextIndex = Math.max(0, contextText.indexOf(text)) + c.index;
          add(page, line.ratio, text, eq, { matchIndex: c.index, snippet: backlinkSnippet(contextText, eq, contextIndex), kind: 'equation' });
        }
        continue;
      }
      if (structureLike || structureTarget) {
        const normalizedText = normalizedReferenceLabel(text);
        const literalHit = structureLike && normalizedText.includes(normalized);
        const labelHit = structureLabel && normalizedText.includes(normalizedReferenceLabel(structureLabel));
        const aliasHit = structureAlias && new RegExp(`(?:^|\\W)${structureAlias}(?:$|\\W)`).test(text);
        if (literalHit || labelHit || aliasHit) {
          const hitText = literalHit ? query : (aliasHit ? structureAlias : structureLabel || query);
          add(page, line.ratio, text, hitText, { snippet: backlinkSnippet(contextText, hitText) });
        }
        continue;
      }
      if (acronym && new RegExp(`(?:^|\\W)${acronym}(?:$|\\W)`).test(text)) add(page, line.ratio, text, acronym, { snippet: backlinkSnippet(contextText, acronym) });
    }
    if (page % 20 === 0) await new Promise((resolve)=>setTimeout(resolve,0));
  }
  return results.sort((a,b)=>a.page-b.page || a.ratio-b.ratio || (Number(a.matchIndex)||0)-(Number(b.matchIndex)||0));
}

async function updateBacklinksForTarget(query, target) {
  backlinkContext = { label:String(query || '').replace(/\s+/g,' ').trim(), page:target.page, ratio:Number(target.ratio)||0 };
  backlinkEntries = [];
  renderBacklinks();
  try { backlinkEntries = await collectBacklinks(query, target); } catch (error) { console.warn('Backlink indexing unavailable', error); backlinkEntries = []; }
  renderBacklinks();
  autoOpenRightSection('backlinks-section');
}

async function resolveReferenceTarget(query, originPage = null, originRatio = null) {
  const normalized = normalizedReferenceLabel(query);
  if (isEquationLabelQuery(query)) {
    const equationTarget = await findEquationLabelLocation(query, originPage, originRatio);
    if (equationTarget) return equationTarget;
    return null;
  }
  if (/^\[[^\]]+\]$/.test(String(query || '').trim())) {
    const key = normalizedBibliographyKey(query);
    const bib = bibliographyEntries.find((entry) => normalizedBibliographyKey(entry.number) === key);
    if (bib) return { page: bib.page, ratio: bib.ratio };
  }
  if (/^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|conjecture|question|assumption|hypothesis)\b/i.test(query)) {
    const entry = structureEntries.find((item) => normalizedReferenceLabel(item.label) === normalized);
    if (entry) return { page: entry.page, ratio: entry.ratio };
  }
  if (/^section\b/i.test(query)) {
    const number = query.match(/[A-Z]?\d+(?:\.\d+)*/i)?.[0] || '';
    const outline = inferredOutline.find((entry) => new RegExp(`^(?:§\\s*)?${number.replace(/\./g, '\\.')}(?:[.)\\s]|$)`, 'i').test(entry.title || ''));
    if (outline) return { page: outline.page, ratio: Number(outline.ratio) || 0 };
  }
  if (/^[A-Z][A-Z0-9]{1,7}$/.test(String(query || '').trim())) {
    const targets = await getTocOutlineTargets();
    const aliasTarget = unambiguousHeadingAliases(targets).get(String(query).trim());
    if (aliasTarget && Number(aliasTarget.page) !== Number(originPage)) return { page: aliasTarget.page, ratio: Number(aliasTarget.ratio) || 0, matchText: aliasTarget.title };
  }
  return findReferenceTextLocation(query, originPage);
}

async function goToReferenceQuery(query, originPage = currentPage, originRatio = null) {
  if (!pdfDoc || !query) return;
  const target = await resolveReferenceTarget(query, originPage, originRatio);
  if (!target) { showError(t(`No target found for ${query}.`, `未找到 ${query} 的目标位置。`)); return; }
  await goToMatchedLocation(target.page, Number(target.ratio) || 0, target.matchText || query);
  updateBacklinksForTarget(target.matchText || query, target);
}

async function resolveOutlineDestination(rawDest) {
  if (!pdfDoc) return null;
  let dest = rawDest;
  if (typeof dest === 'string') dest = await pdfDoc.getDestination(dest);
  if (!Array.isArray(dest) || !dest[0]) return null;
  const pageIndex = await pdfDoc.getPageIndex(dest[0]);
  const pageNum = pageIndex + 1;
  let ratio = 0;
  const mode = dest[1]?.name || '';
  let top = null;
  if (mode === 'XYZ') top = Number(dest[3]);
  else if (mode === 'FitH' || mode === 'FitBH') top = Number(dest[2]);
  else if (mode === 'FitR') top = Number(dest[5]);
  if (Number.isFinite(top)) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const view = Array.isArray(page.view) ? page.view : [0, 0, 1, 1];
      const yMin = Number(view[1]) || 0;
      const yMax = Number(view[3]) || 1;
      ratio = Math.min(1, Math.max(0, (yMax - top) / Math.max(1, yMax - yMin)));
    } catch (_) {}
  }
  return { page: pageNum, ratio };
}


function scheduleDetectedOutlineAugmentation() {
  if (!pdfDoc || inferredOutlineDetectionDone || inferredOutlineBuildPromise) return;
  const sourceDoc = pdfDoc;
  const sourceKey = currentFileKey;
  inferredOutlineBuildPromise = (async () => {
    try {
      const detected = await detectOutlineFromTypography();
      if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return;
      inferredOutline = Array.isArray(detected) ? detected : [];
      inferredOutlineDetectionDone = true;
      tocOutlineTargets = null;
      persistDocumentState();
      // TOC pages may already be rendered. Refresh overlays now that the
      // detected structure can fill gaps in the embedded PDF outline.
      rerenderReferenceLinks();
    } catch (error) {
      if (pdfDoc === sourceDoc && currentFileKey === sourceKey) {
        inferredOutlineDetectionDone = true;
        console.warn('Detected outline augmentation unavailable', error);
      }
    } finally {
      inferredOutlineBuildPromise = null;
    }
  })();
}

async function renderOutline() {
  outlineList.replaceChildren();
  outlineMode = 'none';
  updateOutlineSource();
  if (!pdfDoc) return;
  if (!documentTextFeaturesAvailable()) {
    outlineCount.textContent = '0';
    outlineEmpty.classList.remove('is-hidden');
    outlineEmpty.textContent = t('Document text unavailable. Run full-document OCR to enable Contents.', '文档文本不可用。运行全文 OCR 后才能启用目录。');
    return;
  }
  try {
    const outline = await pdfDoc.getOutline();
    const flat = flattenOutline(outline);
    if (flat.length) {
      const resolved = await Promise.all(flat.map(async ({ item, depth }, index) => {
        const location = await resolveOutlineDestination(item.dest).catch(() => null);
        if (!location) return null;
        return {
          sourceKey: `${index}:${depth}:${String(item.title || '').trim()}`,
          title: item.title || t('Untitled', '未命名'),
          matchText: item.title || '',
          page: Number(location.page) || 1,
          ratio: Number(location.ratio) || 0,
          depth: Number(depth) || 0,
          userEdited: false,
        };
      }));
      embeddedOutlineEntries = resolved.filter(Boolean);
      renderEmbeddedOutline(embeddedOutlineEntries);
      scheduleDetectedOutlineAugmentation();
      return;
    }

    outlineEmpty.classList.remove('is-hidden');
    outlineEmpty.textContent = t('No embedded outline. Detecting document structure…', '没有嵌入式目录，正在自动检测文档结构……');
    if (!inferredOutline.length) {
      inferredOutline = await detectOutlineFromTypography();
      inferredOutlineDetectionDone = true;
      tocOutlineTargets = null;
      persistDocumentState();
    } else {
      inferredOutlineDetectionDone = true;
    }
    renderInferredOutline(inferredOutline);
  } catch (error) {
    outlineMode = 'none';
    updateOutlineSource();
    outlineEmpty.classList.remove('is-hidden');
    outlineEmpty.textContent = t('The document outline could not be read or detected.', '无法读取或自动检测文档目录。');
    console.error(error);
  }
}

async function pageText(pageNum, sourceDoc = pdfDoc, cache = textCache) {
  if (cache.has(pageNum)) return cache.get(pageNum);
  if (sourceDoc === pdfDoc && sourceDocumentUsesOcr(pageNum)) {
    const text = String(documentOcrPages.get(Number(pageNum))?.text || '').replace(/\s+/g, ' ').trim();
    cache.set(pageNum, text);
    return text;
  }
  if (sourceDoc === pdfDoc && lineCache.has(pageNum)) {
    const text = lineCache.get(pageNum).map((line) => line.text).join(' ').replace(/\s+/g, ' ').trim();
    cache.set(pageNum, text); return text;
  }
  const page = await sourceDoc.getPage(pageNum);
  const content = await page.getTextContent();
  const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
  cache.set(pageNum, text);
  return text;
}

function normalizeSearchValue(value, matchCase = false) {
  let text = String(value || '').normalize('NFKC')
    .replace(/\u00ad/g, '')
    .replace(/[ﬀﬁﬂﬃﬄ]/g, (ch) => ({ 'ﬀ':'ff','ﬁ':'fi','ﬂ':'fl','ﬃ':'ffi','ﬄ':'ffl' }[ch] || ch))
    .replace(/-\s*\n\s*(?=\p{L})/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return matchCase ? text : text.toLocaleLowerCase();
}

function searchTextMatch(text, query) {
  const matchCase = Boolean(searchMatchCase?.checked);
  const wholeWord = Boolean(searchWholeWord?.checked);
  const haystack = normalizeSearchValue(text, matchCase);
  const needle = normalizeSearchValue(query, matchCase);
  if (!needle) return { matched: false, index: -1 };
  let index = haystack.indexOf(needle);
  if (index < 0) return { matched: false, index: -1 };
  if (wholeWord && /^[\p{L}\p{N}_]+$/u.test(needle)) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})(?=$|[^\\p{L}\\p{N}_])`, matchCase ? 'u' : 'iu');
    const m = normalizeSearchValue(text, true).match(re);
    if (!m) return { matched: false, index: -1 };
  }
  const direct = matchCase ? text.indexOf(query) : text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  return { matched: true, index: direct >= 0 ? direct : Math.max(0, text.toLocaleLowerCase().indexOf(query.split(/\s+/)[0].toLocaleLowerCase())) };
}

function highlightedSnippet(text, query, index = -1) {
  const safeIndex = index >= 0 ? index : 0;
  const start = Math.max(0, safeIndex - 65);
  const hitLength = Math.max(1, query.length);
  const end = Math.min(text.length, safeIndex + hitLength + 95);
  const before = text.slice(start, safeIndex);
  const hit = text.slice(safeIndex, Math.min(text.length, safeIndex + hitLength));
  const after = text.slice(Math.min(text.length, safeIndex + hitLength), end);
  const frag = document.createDocumentFragment();
  if (start > 0) frag.append('…');
  frag.append(before);
  if (hit) { const mark = document.createElement('span'); mark.className = 'search-hit'; mark.textContent = hit; frag.append(mark); }
  frag.append(after);
  if (end < text.length) frag.append('…');
  return frag;
}


function exactSearchMatches(text, query) {
  const matchCase = Boolean(searchMatchCase?.checked);
  const wholeWord = Boolean(searchWholeWord?.checked);
  const source = normalizeSearchValue(text, matchCase);
  const needle = normalizeSearchValue(query, matchCase);
  if (!needle) return [];
  const out = [];
  let from = 0;
  while (from <= source.length) {
    const index = source.indexOf(needle, from);
    if (index < 0) break;
    let ok = true;
    if (wholeWord) {
      const before = index > 0 ? source[index - 1] : '';
      const after = index + needle.length < source.length ? source[index + needle.length] : '';
      const isWord = (ch) => /[\p{L}\p{N}_]/u.test(ch || '');
      ok = !isWord(before) && !isWord(after);
    }
    if (ok) out.push({ index, score: 1 });
    from = index + Math.max(1, needle.length);
  }
  return out;
}

function levenshteinDistance(a, b, maxDistance = Infinity) {
  const aa = String(a || ''), bb = String(b || '');
  if (Math.abs(aa.length - bb.length) > maxDistance) return maxDistance + 1;
  let prev = Array.from({ length: bb.length + 1 }, (_, i) => i);
  for (let i = 1; i <= aa.length; i += 1) {
    const curr = [i];
    let rowMin = curr[0];
    for (let j = 1; j <= bb.length; j += 1) {
      const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr[j] = v; rowMin = Math.min(rowMin, v);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    prev = curr;
  }
  return prev[bb.length];
}

function fuzzySearchMatches(text, query) {
  const matchCase = Boolean(searchMatchCase?.checked);
  const normalizedText = normalizeSearchValue(text, matchCase);
  const normalizedQuery = normalizeSearchValue(query, matchCase).trim();
  if (!normalizedQuery) return [];
  const direct = exactSearchMatches(text, query);
  if (direct.length) return direct;
  const qWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const words = [];
  const re = /[\p{L}\p{N}_]+/gu;
  let m;
  while ((m = re.exec(normalizedText))) words.push({ word: m[0], index: m.index });
  if (!qWords.length || !words.length) return [];
  const maxEditsFor = (w) => w.length <= 4 ? 1 : w.length <= 8 ? 2 : 3;
  const out = [];
  const span = qWords.length;
  for (let i = 0; i < words.length; i += 1) {
    if (i + span > words.length) break;
    let total = 0, possible = 0, ok = true;
    for (let j = 0; j < span; j += 1) {
      const q = qWords[j], w = words[i + j].word;
      const maxD = maxEditsFor(q);
      const d = levenshteinDistance(q, w, maxD);
      if (d > maxD) { ok = false; break; }
      total += d; possible += Math.max(q.length, w.length, 1);
    }
    if (!ok) continue;
    const score = Math.max(0, 1 - total / possible);
    if (score >= 0.72) out.push({ index: words[i].index, score });
  }
  return out.slice(0, 80);
}

async function runFindAllOccurrences(query) {
  const q = String(query || '').replace(/\s+/g, ' ').trim();
  if (!pdfDoc || !q) return;
  openLeftPanelShortcut('search-panel', searchInput);
  searchInput.value = q;
  if (searchFuzzy) searchFuzzy.checked = false;
  persistDocumentState();
  await searchPdf(q);
}

function normalizeSymbolGlossary(items) {
  const seen = new Set();
  const out = [];
  for (const [index, item] of (Array.isArray(items) ? items : []).entries()) {
    if (!item) continue;
    const symbol = String(item.symbol || '').replace(/\s+/g, ' ').trim();
    if (!symbol) continue;
    const key = normalizeSearchValue(symbol, false);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: item.id || `sym-${Number(item.created) || Date.now()}-${index}`,
      symbol,
      meaning: String(item.meaning || '').trim(),
      created: Number(item.created) || Date.now(),
      firstPage: Number(item.firstPage) >= 1 ? Number(item.firstPage) : null,
      firstRatio: Number.isFinite(Number(item.firstRatio)) ? Math.min(1, Math.max(0, Number(item.firstRatio))) : null
    });
  }
  return out;
}

async function locateFirstOccurrence(symbol) {
  if (!pdfDoc || !symbol) return null;
  const needle = normalizeSearchValue(symbol, false);
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    try {
      const text = await pageText(page);
      const hay = normalizeSearchValue(text, false);
      const index = hay.indexOf(needle);
      if (index >= 0) return { page, ratio: Math.min(1, Math.max(0, index / Math.max(1, hay.length))) };
    } catch (_) {}
  }
  return null;
}


function currentReadingAnchorForContext() {
  if (!pdfDoc) return { page: 1, ratio: 0 };
  if (readingFlow === 'continuous') return captureContinuousAnchor() || continuousSavedAnchor || { page: currentPage, ratio: 0 };
  const height = Math.max(1, primaryPageSurface?.offsetHeight || 1);
  const ratio = Math.max(0, Math.min(1, (primaryCanvasWrap?.scrollTop || 0) / height));
  return { page: currentPage, ratio };
}

function proofEntryAtAnchor(anchor = currentReadingAnchorForContext()) {
  const page = Number(anchor?.page) || currentPage;
  const ratio = Number(anchor?.ratio) || 0;
  const entries = structureEntries || [];
  const candidates = entries.filter((entry, index) => {
    if (!entry.proofPage) return false;
    const next = entries.slice(index + 1).find((item) => Number(item.page) >= Number(entry.proofPage));
    const explicitEndPage = Number(entry.proofEndPage) || 0;
    const inferredEndPage = next ? Number(next.page) : Number(entry.proofPage);
    const endPage = explicitEndPage || inferredEndPage;
    if (page < Number(entry.proofPage) || page > endPage) return false;
    if (page === Number(entry.proofPage) && Number.isFinite(Number(entry.proofRatio)) && ratio + 0.03 < Number(entry.proofRatio)) return false;
    if (explicitEndPage && page === explicitEndPage && Number.isFinite(Number(entry.proofEndRatio)) && ratio - 0.03 > Number(entry.proofEndRatio)) return false;
    if (!explicitEndPage && next && page === Number(next.page) && Number.isFinite(Number(next.ratio)) && ratio >= Number(next.ratio) - 0.02) return false;
    return true;
  });
  return candidates.sort((a,b) => (Number(b.proofPage)||0) - (Number(a.proofPage)||0))[0] || null;
}

function renderSymbolGlossary() {
  if (!symbolGlossaryList || !symbolGlossaryEmpty || !symbolGlossaryCount) return;
  symbolGlossary = normalizeSymbolGlossary(symbolGlossary);
  symbolGlossaryCount.textContent = String(symbolGlossary.length);
  symbolGlossaryList.replaceChildren();
  symbolGlossaryEmpty.classList.toggle('is-hidden', symbolGlossary.length > 0);
  for (const item of symbolGlossary) {
    const card = document.createElement('div'); card.className = 'symbol-glossary-item';
    const head = document.createElement('div'); head.className = 'symbol-glossary-head';
    const symbol = document.createElement('strong'); symbol.textContent = item.symbol;
    const meaning = document.createElement('span'); meaning.textContent = item.meaning || t('No meaning yet', '尚未填写含义');
    head.append(symbol, meaning);
    const actions = document.createElement('div'); actions.className = 'symbol-glossary-actions';
    const all = document.createElement('button'); all.type = 'button'; all.className = 'text-button'; all.textContent = t('Find all', '查找全部');
    all.addEventListener('click', () => runFindAllOccurrences(item.symbol));
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'text-button'; edit.textContent = t('Edit', '编辑');
    edit.addEventListener('click', () => {
      const next = window.prompt(t(`Meaning of ${item.symbol}`, `${item.symbol} 的含义`), item.meaning || '');
      if (next === null) return;
      item.meaning = String(next).trim(); persistDocumentState(); renderSymbolGlossary();
    });
    const del = document.createElement('button'); del.type = 'button'; del.className = 'text-button'; del.textContent = t('Delete', '删除');
    del.addEventListener('click', () => { pushUndo('glossary', item.symbol, item); symbolGlossary = symbolGlossary.filter((x) => x.id !== item.id); persistDocumentState(); renderSymbolGlossary(); });
    actions.append(all, edit, del);
    card.append(head, actions);
    symbolGlossaryList.append(card);
  }
}

async function addGlossaryEntry(symbolValue = null, meaningValue = null) {
  if (!pdfDoc) return;
  const symbol = String(symbolValue ?? glossarySymbolInput?.value ?? '').replace(/\s+/g, ' ').trim();
  const meaning = String(meaningValue ?? glossaryMeaningInput?.value ?? '').trim();
  if (!symbol) { glossarySymbolInput?.focus(); return; }
  const key = normalizeSearchValue(symbol, false);
  let item = symbolGlossary.find((entry) => normalizeSearchValue(entry.symbol, false) === key);
  if (item) {
    if (meaning) item.meaning = meaning;
  } else {
    item = { id: `sym-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, symbol, meaning, created: Date.now(), firstPage: null, firstRatio: null };
    symbolGlossary.push(item);
  }
  if (glossarySymbolInput) glossarySymbolInput.value = '';
  if (glossaryMeaningInput) glossaryMeaningInput.value = '';
  persistDocumentState(); renderSymbolGlossary(); autoOpenRightSection('symbol-glossary-section');
}

function addSelectionToGlossary() {
  const selected = String(currentSelection?.latex || currentSelection?.text || '').replace(/\s+/g, ' ').trim();
  if (!selected) return;
  if (glossarySymbolInput) glossarySymbolInput.value = selected;
  autoOpenRightSection('symbol-glossary-section');
}


function selectedReferenceQuery() {
  const text = String(currentSelection?.text || '').replace(/\s+/g, ' ').trim();
  const direct = text.match(/\b(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis|Section)\s+[A-Z]?\d+(?:\.\d+)*\b/i)
    || text.match(/\(\s*\d+(?:\.\d+)*\s*\)/);
  if (direct) return direct[0];
  const bracket = text.match(/\[[^\]\n]{1,80}\]/);
  if (!bracket) return '';
  const known = new Set(bibliographyEntries.map((entry) => normalizedBibliographyKey(entry.number)));
  const keys = bibliographyCitationKeys(bracket[0], known);
  if (keys.length !== 1) return '';
  const entry = bibliographyEntries.find((item) => normalizedBibliographyKey(item.number) === keys[0]);
  return entry?.label || '';
}

async function goToSelectedReference() {
  if (!pdfDoc) return;
  const query = selectedReferenceQuery();
  if (!query) { showError(t('Select a reference such as “Theorem 2.4”, “Section 3”, “(4.7)”, or “[17]”.', '请选择类似“Theorem 2.4”、“Section 3”、“(4.7)”或“[17]”的引用。')); return; }
  await goToReferenceQuery(query, currentSelection?.page || currentPage);
}


function semanticMatchRangeInLayer(layer, surface, query, targetRatio = null) {
  if (!layer || !surface || !query) return null;
  const mapped = textLayerAggregate(layer);
  if (!mapped.text) return null;
  const pieces = String(query || '').trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return null;
  const escaped = pieces.map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  let pattern;
  try { pattern = new RegExp(escaped.join('\\s+'), 'giu'); } catch (_) { return null; }
  const surfaceRect = surface.getBoundingClientRect();
  const candidates = [];
  let match;
  while ((match = pattern.exec(mapped.text))) {
    const range = rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
    if (!range) continue;
    const rects = [...range.getClientRects()].filter((rect) => rect.width >= 1 && rect.height >= 1);
    if (!rects.length) continue;
    const first = rects[0];
    const centerY = first.top - surfaceRect.top + first.height / 2;
    const ratio = surfaceRect.height > 0 ? Math.min(1, Math.max(0, centerY / surfaceRect.height)) : 0;
    candidates.push({ range, ratio });
    if (!match[0].length) pattern.lastIndex += 1;
  }
  if (!candidates.length) return null;
  if (!Number.isFinite(Number(targetRatio))) return candidates[0].range;
  const wanted = Math.min(1, Math.max(0, Number(targetRatio)));
  candidates.sort((a, b) => Math.abs(a.ratio - wanted) - Math.abs(b.ratio - wanted));
  return candidates[0].range;
}

function nearestTextRangeAtRatio(layer, surface, targetRatio) {
  if (!layer || !surface || !Number.isFinite(Number(targetRatio))) return null;
  const surfaceRect = surface.getBoundingClientRect();
  if (surfaceRect.height <= 0) return null;
  const wanted = Math.min(1, Math.max(0, Number(targetRatio)));
  let best = null;
  for (const node of layer.querySelectorAll('span')) {
    const text = String(node.textContent || '').trim();
    if (!text) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const nodeRatio = Math.min(1, Math.max(0, ((rect.top - surfaceRect.top) + rect.height / 2) / surfaceRect.height));
    const delta = Math.abs(nodeRatio - wanted);
    if (!best || delta < best.delta) best = { node, delta };
  }
  if (!best?.node) return null;
  try {
    const range = document.createRange();
    range.selectNodeContents(best.node);
    return range;
  } catch (_) { return null; }
}

async function emphasizeSemanticDestination(page, ratio, query) {
  if (!pdfDoc || !query) return false;
  let layer = null;
  let surface = null;
  if (readingFlow === 'continuous') {
    const record = continuousPageNodes.get(Number(page));
    if (record) {
      if (!record.rendered) await renderContinuousPage(Number(page), continuousGeneration);
      layer = record.textLayer;
      surface = record.surface;
    }
  } else {
    layer = primaryTextLayer;
    surface = primaryPageSurface;
  }
  if (!layer || !surface) return false;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const range = semanticMatchRangeInLayer(layer, surface, query, ratio) || nearestTextRangeAtRatio(layer, surface, ratio);
  if (!range) return false;
  const rect = [...range.getClientRects()].find((item) => item.width >= 1 && item.height >= 1);
  if (!rect) return false;
  const wrapRect = primaryCanvasWrap.getBoundingClientRect();
  const desiredOffset = Math.min(280, Math.max(150, wrapRect.height * 0.34));
  const delta = rect.top - (wrapRect.top + desiredOffset);
  primaryCanvasWrap.scrollTop = Math.max(0, primaryCanvasWrap.scrollTop + delta);
  if (readingFlow === 'continuous') continuousSavedAnchor = captureContinuousAnchor() || continuousSavedAnchor;
  emphasizeSearchRange(surface, range);
  persistDocumentState();
  return true;
}

async function goToMatchedLocation(page, ratio = 0, query = '', options = {}) {
  await goToLocation(page, ratio, options);
  if (query) {
    const emphasized = await emphasizeSemanticDestination(page, ratio, query);
    if (!emphasized) showNavigationLandingCue(page, ratio);
  } else showNavigationLandingCue(page, ratio);
}

function searchMatchRangeInLayer(layer, query, ordinal = 0) {
  if (!layer || !query) return null;
  const mapped = textLayerAggregate(layer);
  if (!mapped.text) return null;
  const pieces = String(query || '').trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return null;
  const escaped = pieces.map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  let pattern;
  try { pattern = new RegExp(escaped.join('\\s+'), searchMatchCase?.checked ? 'gu' : 'giu'); } catch (_) { return null; }
  let match = null;
  let index = 0;
  while ((match = pattern.exec(mapped.text))) {
    if (index === Math.max(0, Number(ordinal) || 0)) {
      return rangeForAggregateMatch(mapped.parts, match.index, match.index + match[0].length);
    }
    index += 1;
    if (!match[0].length) pattern.lastIndex += 1;
  }
  return null;
}

function clearSearchMatchEmphasis() {
  document.querySelectorAll('.search-match-emphasis-layer').forEach((node) => node.remove());
}

function emphasizeSearchRange(surface, range) {
  if (!surface || !range) return null;
  clearSearchMatchEmphasis();
  const surfaceRect = surface.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'search-match-emphasis-layer';
  let firstRect = null;
  for (const rect of range.getClientRects()) {
    if (rect.width < 1 || rect.height < 1) continue;
    if (!firstRect) firstRect = rect;
    const mark = document.createElement('div');
    mark.className = 'search-match-emphasis';
    mark.style.left = `${rect.left - surfaceRect.left}px`;
    mark.style.top = `${rect.top - surfaceRect.top}px`;
    mark.style.width = `${rect.width}px`;
    mark.style.height = `${rect.height}px`;
    layer.append(mark);
  }
  if (!layer.childElementCount) return null;
  if (firstRect) {
    const cue = document.createElement('div');
    cue.className = 'target-landing-cue';
    cue.textContent = '→';
    cue.setAttribute('aria-hidden', 'true');
    cue.style.top = `${firstRect.top - surfaceRect.top + firstRect.height / 2}px`;
    layer.append(cue);
  }
  surface.append(layer);
  window.setTimeout(() => layer.classList.add('is-fading'), 1700);
  window.setTimeout(() => layer.remove(), 2600);
  return layer;
}

async function goToSearchMatch(match, query) {
  if (!pdfDoc || !match) return;
  // First get the correct page rendered without relying on the generic semantic
  // lead. The exact text-layer range below becomes the authoritative position.
  await goToLocation(match.page, Math.min(1, Math.max(0, match.index / Math.max(1, match.text.length))), { contextLead: false });
  let layer = null;
  let surface = null;
  if (readingFlow === 'continuous') {
    const record = continuousPageNodes.get(match.page);
    if (record) {
      if (!record.rendered) await renderContinuousPage(match.page, continuousGeneration);
      layer = record.textLayer;
      surface = record.surface;
    }
  } else {
    layer = primaryTextLayer;
    surface = primaryPageSurface;
  }
  if (!layer || !surface) return;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const range = searchMatchRangeInLayer(layer, query, match.ordinal || 0);
  if (!range) return;
  const rect = [...range.getClientRects()].find((item) => item.width >= 1 && item.height >= 1);
  if (!rect) return;
  const wrapRect = primaryCanvasWrap.getBoundingClientRect();
  // Keep the chosen occurrence at a predictable, comfortable position instead
  // of pinning it close to the top edge. Clamp for short reader windows.
  const desiredOffset = Math.min(280, Math.max(150, wrapRect.height * 0.34));
  const delta = rect.top - (wrapRect.top + desiredOffset);
  primaryCanvasWrap.scrollTop = Math.max(0, primaryCanvasWrap.scrollTop + delta);
  if (readingFlow === 'continuous') continuousSavedAnchor = captureContinuousAnchor() || continuousSavedAnchor;
  emphasizeSearchRange(surface, range);
  persistDocumentState();
}

async function searchPdf(query) {
  searchResults.replaceChildren();
  const q = query.trim();
  if (!pdfDoc || !q) { searchStatus.textContent = ''; return; }
  if (!documentTextFeaturesAvailable() && !searchEquations?.checked) {
    searchStatus.textContent = t('Document text unavailable. Run full-document OCR from Contents to enable Search.', '文档文本不可用。请在“目录”中运行全文 OCR 后再使用搜索。');
    return;
  }
  if (searchEquations?.checked) {
    const matches = equationSearchMatches(q);
    searchStatus.textContent = t(`${matches.length} saved/extracted equation${matches.length===1?'':'s'}`, `${matches.length} 个已保存/提取公式`);
    for (const match of matches.slice(0,200)) {
      const item=document.createElement('button'); item.type='button'; item.className='search-result search-result-equation';
      const label=document.createElement('strong'); label.textContent=t(`Page ${match.page} · ${match.source}`,`第 ${match.page} 页 · ${match.source}`);
      const code=document.createElement('code'); code.textContent=match.latex.length>280?`${match.latex.slice(0,280)}…`:match.latex; item.append(label,code);
      item.addEventListener('click', async () => {
        const ratio = Number.isFinite(Number(match.ratio)) ? Number(match.ratio) : 0;
        await goToLocation(match.page, ratio, { contextLead: false });
        if (Number.isFinite(Number(match.ratio))) {
          await positionTargetAtReadingLead(match.page, ratio);
          showEquationBookmarkCue(match.page, ratio);
        }
      }); searchResults.append(item);
    }
    return;
  }
  const fuzzy = Boolean(searchFuzzy?.checked);
  searchStatus.textContent = fuzzy ? t('Fuzzy searching…', '正在模糊搜索……') : t('Searching…', '正在搜索……');
  const matches = [];
  for (let page = 1; page <= pdfDoc.numPages; page += 1) {
    searchStatus.textContent = t(`Searching page ${page} of ${pdfDoc.numPages}…`, `正在搜索第 ${page} / ${pdfDoc.numPages} 页……`);
    try {
      const text = await pageText(page);
      const hits = fuzzy ? fuzzySearchMatches(text, q) : exactSearchMatches(text, q);
      for (const [ordinal, hit] of hits.entries()) matches.push({ page, text, index: hit.index, score: hit.score, ordinal });
    } catch (error) { console.error(error); }
    if (page % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  matches.sort((a,b) => fuzzy ? (b.score - a.score || a.page - b.page || a.index - b.index) : (a.page - b.page || a.index - b.index));
  searchStatus.textContent = t(`${matches.length} occurrence${matches.length === 1 ? '' : 's'}${fuzzy ? ' · fuzzy ranked' : ''}`, `${matches.length} 个出现位置${fuzzy ? ' · 按模糊匹配排序' : ''}`);
  for (const match of matches.slice(0, 200)) {
    const item = document.createElement('button');
    item.type = 'button'; item.className = 'search-result';
    const label = document.createElement('strong');
    label.textContent = fuzzy && match.score < 0.999 ? t(`Page ${match.page} · ${Math.round(match.score*100)}%`, `第 ${match.page} 页 · ${Math.round(match.score*100)}%`) : t(`Page ${match.page}`, `第 ${match.page} 页`);
    const snippet = document.createElement('p'); snippet.append(highlightedSnippet(match.text, q, match.index));
    item.append(label, snippet);
    item.addEventListener('click', () => goToSearchMatch(match, q));
    searchResults.append(item);
  }
}

