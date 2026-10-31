// MathReader v306 · Outline inference, legacy heading recovery, and Structure rendering.
function flattenOutline(items, depth = 0, output = []) {
  for (const item of items || []) {
    output.push({ item, depth: Math.min(depth, 3) });
    if (item.items?.length) flattenOutline(item.items, depth + 1, output);
  }
  return output;
}

function updateOutlineSource() {
  if (!outlineSource) return;
  outlineSource.classList.toggle('is-hidden', outlineMode === 'none');
  if (outlineMode === 'embedded') {
    outlineSource.textContent = t('Embedded PDF outline', 'PDF 嵌入式目录');
  } else if (outlineMode === 'inferred') {
    outlineSource.textContent = t('Detected outline · inferred from page typography and numbering', '自动检测目录 · 根据页面字号与编号推断');
  } else {
    outlineSource.textContent = '';
  }
}

function normalizedHeadingText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function weightedMedianFont(samples) {
  const values = samples
    .filter((sample) => Number.isFinite(sample.size) && sample.size > 3 && sample.size < 80 && sample.weight > 0)
    .sort((a, b) => a.size - b.size);
  if (!values.length) return 10;
  const total = values.reduce((sum, sample) => sum + sample.weight, 0);
  let acc = 0;
  for (const sample of values) {
    acc += sample.weight;
    if (acc >= total / 2) return sample.size;
  }
  return values[values.length - 1].size;
}

function headingNumberDepth(text) {
  const match = text.match(/^\s*(?:§\s*)?((?:\d+(?:\.\d+){0,4}|[A-H](?:\.\d+){1,4}|[A-H][.)]))(?:[.)])?\s+\S/);
  if (!match) return null;
  return Math.min(3, match[1].replace(/[.)]$/, '').split('.').length - 1);
}

function isKnownHeading(text) {
  return /^(?:abstract|introduction|background|preliminaries|notation|setup|main results?|results?|discussion|conclusions?|references|bibliography|acknowledg(?:e)?ments?|purpose|foreword|afterword|preface|appendix(?:\s+[A-Z0-9]+)?|contents)$/i.test(text.trim());
}

function isMathEnvironmentLabel(text) {
  return /^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|proof)\b/i.test(text.trim());
}


function isLikelyFormulaHeading(text) {
  const value = String(text || '').trim();
  if (!value || isKnownHeading(value)) return false;
  // Strong equation/operator signals are far more likely to be display math
  // than document structure.
  if (/[=≤≥≠≈∫∑∏√∂∇⋃⋂∞±×·^_]|(?:\b(?:lim|sup|inf)\b.*[→∞])/u.test(value)) return true;
  const remainder = value
    .replace(/^\s*(?:§\s*)?\d+(?:\.\d+){0,4}[.)]?\s*/, '')
    .replace(/^\s*[A-Z][.)]\s*/, '')
    .trim();
  const asciiWords = remainder.match(/[A-Za-z]{3,}/g) || [];
  const hanChars = remainder.match(/\p{Script=Han}/gu) || [];
  const tokens = remainder.split(/\s+/).filter(Boolean);
  const shortVariableTokens = tokens.filter((token) => /^[\p{L}\p{N}πρσφθμνξωαβγδκηλ]+$/u.test(token) && [...token].length <= 2).length;
  const symbolCount = (remainder.match(/[+\-*\/(){}[\],:;|]/g) || []).length;
  const digitCount = (remainder.match(/\d/g) || []).length;
  const letterCount = (remainder.match(/\p{L}/gu) || []).length;
  if (headingNumberDepth(value) !== null && asciiWords.length === 0 && hanChars.length < 2) return true;
  if (tokens.length >= 1 && shortVariableTokens / tokens.length >= 0.6 && asciiWords.length < 2 && hanChars.length < 2) return true;
  if (symbolCount >= 2 && asciiWords.length < 2 && hanChars.length < 2) return true;
  if (digitCount > 0 && digitCount >= Math.max(2, letterCount) && asciiWords.length < 2) return true;
  return false;
}
function headingDepthFromStyle(line, bodySize) {
  const numbered = headingNumberDepth(line.text);
  if (numbered !== null) return numbered;
  if (/^appendix\b/i.test(line.text)) return 0;
  const ratio = line.size / Math.max(1, bodySize);
  if (ratio >= 1.55) return 0;
  if (ratio >= 1.30) return 1;
  return 2;
}

function isMarginEquationLabelLineForStructure(line) {
  const text = String(line?.text || '').trim().normalize('NFKC');
  // Equation numbers in older journals are often bare left-margin tokens such
  // as "1.2", "1 . 14" or "3 . 4", rather than parenthesized right tags.
  // Treat only an essentially standalone numeric token as an equation label;
  // real section headings have title text after the number.
  const numericOnly = /^(?:\(\s*)?\d+\s*(?:\.\s*\d+\s*)+(?:\))?$/.test(text)
    || /^\(\s*\d+\s*\)$/.test(text);
  if (!numericOnly) return false;
  const start = Number(line?.xStartRatio);
  const end = Number(line?.xEndRatio);
  const nearLeft = (Number.isFinite(start) && start <= 0.24) || (Number.isFinite(end) && end <= 0.38);
  const nearRight = (Number.isFinite(start) && start >= 0.60) || (Number.isFinite(end) && end >= 0.74);
  return nearLeft || nearRight;
}

function ocrLineSuitableForStructure(line) {
  const text = String(line?.text || '').trim();
  if (!text) return false;
  const confidence = Number(line?.confidence);
  if (Number.isFinite(confidence) && confidence < 58) return false;
  // OCR of displayed mathematics often produces short pseudo-words mixed with
  // operators/digits. Such lines are useful for Equation indexing but are poor
  // Structure candidates.
  const tokens = text.split(/\s+/).filter(Boolean);
  const alphaWords = tokens.filter((token) => /^[A-Za-z][A-Za-z'’.-]{2,}$/.test(token));
  const operatorCount = (text.match(/[=+<>∑∫√∞→←≤≥\\{}_^|]/g) || []).length;
  const digitCount = (text.match(/\d/g) || []).length;
  const letterCount = (text.match(/[A-Za-z]/g) || []).length;
  const hyphenTitleWords = text.match(/[A-Za-z]{2,}/g) || [];
  const hyphenSectionTitle = /^\d{1,2}-\d{1,2}[.)]?\s+[A-Z]/.test(text) && hyphenTitleWords.length >= 2;
  if (operatorCount >= 2 && alphaWords.length < 3 && !hyphenSectionTitle) return false;
  if (tokens.length >= 3 && alphaWords.length === 0 && digitCount >= Math.max(2, letterCount / 2)) return false;
  if (/^\(?\d+(?:\.\d+)+\)?\s+/.test(text) && alphaWords.length < 2) return false;
  return true;
}

async function detectOutlineFromTypography() {
  const pages = [];
  const fontSamples = [];
  const repeatMap = new Map();
  let nativeTextChars = 0;
  let nativeControlChars = 0;
  const maxPages = Math.min(pdfDoc.numPages, 600);

  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    let lines = [];
    if (sourceDocumentUsesOcr(pageNum)) {
      const record = documentOcrPages.get(pageNum);
      lines = (record?.lines || []).map((ocrLine) => {
        const text = normalizedHeadingText(ocrLine.text);
        const size = Math.max(1, (Number(ocrLine.heightRatio) || 0.018) * viewport.height);
        const y = viewport.height * (1 - (Number(ocrLine.ratio) || 0));
        const xStartRatio = Number(ocrLine.xStartRatio) || 0;
        const xEndRatio = Number(ocrLine.xEndRatio) || xStartRatio;
        const x = xStartRatio * viewport.width;
        fontSamples.push({ size, weight: Math.max(1, text.replace(/\s/g, '').length) });
        return { page: pageNum, y, x, items: [], size, pageHeight: viewport.height, text, confidence: ocrLine.confidence, xStartRatio, xEndRatio };
      }).filter((line) => line.text && ocrLineSuitableForStructure(line));
    } else {
      const content = await page.getTextContent();
      const items = [];
      for (const item of content.items || []) {
        const rawText = String(item.str || '');
        nativeTextChars += rawText.length;
        nativeControlChars += (rawText.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g) || []).length;
        const text = normalizedHeadingText(rawText);
        if (!text) continue;
        const tr = item.transform || [1, 0, 0, 1, 0, 0];
        const size = Math.max(1, Math.hypot(Number(tr[0]) || 0, Number(tr[1]) || 0) || Number(item.height) || 1);
        const x = Number(tr[4]) || 0;
        const y = Number(tr[5]) || 0;
        items.push({ text, size, x, y, width: Number(item.width) || 0, fontName: item.fontName || '' });
        fontSamples.push({ size, weight: Math.max(1, text.replace(/\s/g, '').length) });
      }
      items.sort((a, b) => Math.abs(b.y - a.y) > 1.5 ? b.y - a.y : a.x - b.x);
      for (const item of items) {
        let line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= Math.max(1.8, item.size * 0.22));
        if (!line) {
          line = { page: pageNum, y: item.y, x: item.x, items: [], size: item.size, pageHeight: viewport.height };
          lines.push(line);
        }
        line.items.push(item);
        line.size = Math.max(line.size, item.size);
        line.x = Math.min(line.x, item.x);
      }
      const horizontalLines = [];
      for (const sourceLine of lines) {
        sourceLine.items.sort((a, b) => a.x - b.x);
        let segment = null;
        let previousRight = null;
        const splitGap = Math.max(20, viewport.width * 0.055);
        for (const item of sourceLine.items) {
          const itemLeft = Number(item.x) || 0;
          const gap = previousRight === null ? 0 : itemLeft - previousRight;
          if (!segment || gap > splitGap) {
            segment = { page: pageNum, y: sourceLine.y, x: itemLeft, items: [], size: item.size, pageHeight: viewport.height };
            horizontalLines.push(segment);
          }
          segment.items.push(item);
          segment.size = Math.max(segment.size, item.size);
          segment.x = Math.min(segment.x, itemLeft);
          previousRight = Math.max(itemLeft, itemLeft + Math.max(0, Number(item.width) || 0));
        }
      }
      lines = horizontalLines;
      for (const line of lines) {
        line.items.sort((a, b) => a.x - b.x);
        line.text = normalizedHeadingText(line.items.map((item) => item.text).join(' '));
        const xMin = Math.min(...line.items.map((item) => Number(item.x) || 0));
        const xMax = Math.max(...line.items.map((item) => (Number(item.x) || 0) + Math.max(0, Number(item.width) || 0)));
        line.xStartRatio = Math.min(1, Math.max(0, xMin / Math.max(1, viewport.width)));
        line.xEndRatio = Math.min(1, Math.max(0, xMax / Math.max(1, viewport.width)));
      }

      // Older journal PDFs sometimes encode a centered section heading with a
      // smaller §N marker on a slightly different baseline from its title.
      // PDF text extraction then yields two lines (for example, “§ 2.” and
      // “TANGENT CYLINDERS AT …”), which prevents the repeated §N document
      // profile below from activating. Rejoin only a standalone short §N
      // marker with a nearby, right-adjacent all-caps title. This is deliberately
      // outline-local: page text, equation geometry, search, and OCR stay
      // untouched.
      const consumedSectionTitleLines = new Set();
      for (const markerLine of lines) {
        const markerText = String(markerLine.text || '').trim();
        if (!/^§\s*\d{1,2}(?:\s*\.\s*\d+)*\s*[.)]?\s*$/.test(markerText)) continue;
        const markerStart = Number(markerLine.xStartRatio);
        const markerEnd = Number(markerLine.xEndRatio);
        if (!Number.isFinite(markerStart) || !Number.isFinite(markerEnd) || markerStart > 0.48 || markerEnd - markerStart > 0.16) continue;
        const nearby = lines
          .filter((candidate) => candidate !== markerLine && !consumedSectionTitleLines.has(candidate))
          .map((candidate) => {
            const yGap = Math.abs(Number(candidate.y) - Number(markerLine.y));
            const xGap = Number(candidate.xStartRatio) - markerEnd;
            return { candidate, yGap, xGap };
          })
          .filter(({ candidate, yGap, xGap }) => {
            const title = String(candidate.text || '').trim();
            const titleWords = title.match(/[A-Za-z]{3,}/g) || [];
            const strongTitle = titleWords.length >= 2
              && titleWords.length <= 10
              && /^[A-Z0-9][A-Z0-9 &'’()\-–—]+[A-Z0-9.)]$/.test(title)
              && !/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title);
            return strongTitle
              && yGap <= Math.max(6, Number(markerLine.size) * 0.85, Number(candidate.size) * 0.70)
              && xGap >= -0.02
              && xGap <= 0.10;
          })
          .sort((a, b) => a.yGap - b.yGap || a.xGap - b.xGap);
        const titleLine = nearby[0]?.candidate;
        if (!titleLine) continue;
        markerLine.text = normalizedHeadingText(`${markerText} ${titleLine.text}`);
        markerLine.items.push(...titleLine.items);
        markerLine.items.sort((a, b) => a.x - b.x);
        markerLine.size = Math.max(Number(markerLine.size) || 0, Number(titleLine.size) || 0);
        markerLine.xStartRatio = Math.min(Number(markerLine.xStartRatio), Number(titleLine.xStartRatio));
        markerLine.xEndRatio = Math.max(Number(markerLine.xEndRatio), Number(titleLine.xEndRatio));
        consumedSectionTitleLines.add(titleLine);
      }
      if (consumedSectionTitleLines.size) lines = lines.filter((line) => !consumedSectionTitleLines.has(line));
    }
    for (const line of lines) {
      line.normalized = line.text.toLocaleLowerCase().replace(/\d+/g, '#').replace(/[^\p{L}#]+/gu, ' ').trim();
      if (line.normalized) {
        const key = line.normalized;
        const repeatRecord = repeatMap.get(key) || { pages: new Set(), top: 0, bottom: 0 };
        repeatRecord.pages.add(pageNum);
        if (line.y > viewport.height * 0.88) repeatRecord.top += 1;
        if (line.y < viewport.height * 0.10) repeatRecord.bottom += 1;
        repeatMap.set(key, repeatRecord);
      }
    }
    pages.push(lines);
  }

  // Some digitized books contain a nominal text layer whose custom-font
  // character map is badly broken: there may be hundreds of thousands of
  // characters, but a large fraction are C0/C1 control codes.  Such text is
  // not a trustworthy source for inferred Structure.  Prefer an empty
  // Structure over a long list of garbage headings; equation/OCR pipelines
  // remain independent.  The threshold is intentionally high so ordinary old
  // PDFs with a few damaged glyphs remain on the native-text path.
  if (nativeTextChars >= 1000 && nativeControlChars / nativeTextChars >= 0.18) return [];

  const bodySize = weightedMedianFont(fontSamples);
  // Infer one heading profile from repeated document-level evidence. This
  // prevents a fix for one old paper from weakening every other PDF.
  const allLines = pages.flat();
  const lineMetrics = (line) => {
    const value = String(line?.text || '').trim();
    const ratio = Number(line?.size) / Math.max(1, bodySize);
    const center = (Number(line?.xStartRatio) + Number(line?.xEndRatio)) / 2;
    const width = Number(line?.xEndRatio) - Number(line?.xStartRatio);
    const words = value.split(/\s+/).filter(Boolean);
    return { value, ratio, center, width, words };
  };

  const numberedBodyLooksLikeProse = (body) => {
    const value = normalizedHeadingText(body);
    if (!value) return false;
    const words = value.split(/\s+/).filter(Boolean);
    const proseLead = /^(?:let|assume|suppose|then|if|for|where|when|by|from|to|we|choose|since|using|applying|combining|conversely|inserting|substituting|differentiating|there)\b/i.test(value);
    const finiteVerb = /\b(?:is|are|was|were|has|have|had|does|do|did|can|could|will|would|shall|should|may|might|must|proved?|shows?|showed|gives?|gave|means?|contains?|concerns?|concerned|becomes?|follows?|implies?|satisfies?|holds?|likes?|came|reflects?)\b/i.test(value);
    const sentenceLead = /^(?:the|this|that|these|those|we|i|he|she|it|they|there|most|not|in|on|at|by|since|because|although)\b/i.test(value);
    const citationLike = /\[[^\]]{1,16}\]/.test(value);
    const clauseCue = /\b(?:and hence|and therefore|and thus|we have|we obtain)\b/i.test(value);
    return proseLead || clauseCue || (finiteVerb && (words.length >= 5 || sentenceLead || citationLike));
  };

  const qualifiedSectionMarkerLines = allLines.filter((line) => {
    const { value, ratio, center, width, words } = lineMetrics(line);
    const match = value.match(/^§\s*\d+(?:\s*\.\s*\d+)*\s*[.)]?\s+(.+)/i);
    const title = String(match?.[1] || '').trim();
    const titleWords = title.match(/[A-Za-z]{3,}/g) || [];
    // Older digitized journals often print genuine §N section headings at
    // body size and flush left. Requiring enlarged or centered typography made
    // one such heading disappear, which in turn disabled the document-level
    // §N profile and let ordinary prose/formula fragments pollute Structure.
    // A short multi-word all-caps title is itself strong section evidence; the
    // repeated §N grammar across the document remains the profile gate.
    const strongLegacyMarker = titleWords.length >= 2
      && /^[A-Z0-9][A-Z0-9 &'’()\-–—]+[A-Z0-9.)]$/.test(title);
    return Boolean(match)
      && /^[A-Z][A-Za-z]{2,}/.test(title)
      && titleWords.length >= 2
      && words.length <= 14
      && (strongLegacyMarker || !/[.!?]$/.test(value))
      && !/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title)
      && (strongLegacyMarker || ratio >= 1.10 || (Number.isFinite(center) && Math.abs(center - 0.5) <= 0.14 && width <= 0.70));
  });
  const sectionMarkerNumbers = new Set(qualifiedSectionMarkerLines.map((line) => String(line.text || '').match(/^§\s*(\d+(?:\s*\.\s*\d+)*)/)?.[1]).filter(Boolean));
  const explicitSectionMarkerMode = sectionMarkerNumbers.size >= 2;

  const strongModernNumberedLines = allLines.filter((line) => {
    const { value, ratio, words } = lineMetrics(line);
    if (words.length > 18 || ratio < 1.15) return false;
    if (headingNumberDepth(value) === null) return false;
    const match = value.match(/^\s*(?:§\s*)?(?:\d+(?:\.\d+){0,4}|[A-H](?:\.\d+){1,4}|[A-H][.)])(?:[.)])?\s+(.+)$/);
    const title = String(match?.[1] || '').trim();
    if (!match || !/^[A-Z][A-Za-z]{2,}/.test(title)) return false;
    if (/^(?:Let|Assume|Suppose|Then|If|For|Where|When|We|Choose|Since|Using|To)\b/i.test(title)) return false;
    if (isLikelyFormulaHeading(value) || isMathEnvironmentLabel(value)) return false;
    return (title.match(/[A-Za-z]{3,}/g) || []).length >= 1;
  });
  const modernHierarchyMode = !documentOcrActive && !explicitSectionMarkerMode && strongModernNumberedLines.length >= 5;

  const paragraphLeadLines = allLines.filter((line) => {
    const value = String(line?.text || '').trim();
    const match = value.match(/^(\d{1,2})[.)]\s+([^.!?]{2,90})[.]\s+(?=[A-Z][a-z])/);
    if (!match) return false;
    const title = match[2].trim();
    if (!/^[A-Z]/.test(title) || /[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title)) return false;
    return (title.match(/[A-Za-z]{3,}/g) || []).length >= 1;
  });
  const paragraphLeadNumbers = new Set(paragraphLeadLines.map((line) => String(line.text || '').match(/^(\d{1,2})/)?.[1]).filter(Boolean));
  const legacyParagraphMode = !explicitSectionMarkerMode && !modernHierarchyMode && paragraphLeadNumbers.size >= 3;

  const legacyCenteredLines = allLines.filter((line) => {
    const { value, ratio, center, width, words } = lineMetrics(line);
    const match = value.match(/^(\d{1,2})[.)]\s+(.+)$/);
    if (!match || words.length > 12 || ratio < 0.98) return false;
    const title = match[2].trim();
    if (!/^[A-Z]/.test(title)) return false;
    if (/^(?:Let|Assume|Suppose|Then|If|For|Where|When|We|Choose|Since|Using|To)\b/i.test(title)) return false;
    if (/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title)) return false;
    return Number.isFinite(center) && Math.abs(center - 0.5) <= 0.13 && width <= 0.72;
  });
  const legacyCenteredNumbers = new Set(legacyCenteredLines.map((line) => String(line.text || '').match(/^(\d{1,2})/)?.[1]).filter(Boolean));
  const legacyCenteredMode = !explicitSectionMarkerMode && !modernHierarchyMode && !legacyParagraphMode && legacyCenteredNumbers.size >= 3;

  // OCR bounding boxes in old journal scans are not reliable font metrics: a
  // genuine centered section heading can have the same (or even smaller) box
  // height as body text.  Promote only a repeated, high-confidence numbered
  // grammar at the document level.  This keeps OCR typography from becoming a
  // general prose detector.
  const ocrCenteredNumberedLines = documentOcrActive ? allLines.filter((line) => {
    const value = String(line?.text || '').trim();
    const match = value.match(/^(\d{1,2})[.,)]\s+(.+)$/);
    if (!match || Number(line?.confidence) < 72) return false;
    const title = String(match[2] || '').trim();
    const center = (Number(line?.xStartRatio) + Number(line?.xEndRatio)) / 2;
    const width = Number(line?.xEndRatio) - Number(line?.xStartRatio);
    const titleWords = title.match(/[A-Za-z]{3,}/g) || [];
    return /^[A-Z]/.test(title)
      && titleWords.length >= 1
      && titleWords.length <= 12
      && !numberedBodyLooksLikeProse(title)
      && !/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title)
      && Number.isFinite(center) && Math.abs(center - 0.5) <= 0.15
      && width <= 0.76;
  }) : [];
  const ocrCenteredNumbers = new Set(ocrCenteredNumberedLines.map((line) => String(line.text || '').match(/^(\d{1,2})/)?.[1]).filter(Boolean));
  const ocrCenteredNumberedMode = documentOcrActive && ocrCenteredNumbers.size >= 3;

  // Applied-math notes and modern papers often use ordinary left-aligned
  // numbered section headings. OCR preserves the numbering and words far more
  // reliably than it preserves relative font height. Infer this grammar only
  // from repeated, high-confidence, non-prose headings spanning multiple pages.
  // Once established, the profile suppresses random enlarged OCR fragments
  // such as short formula residues from becoming Structure entries.
  const ocrExplicitNumberedStrongLines = documentOcrActive ? allLines.filter((line) => {
    const value = String(line?.text || '').trim();
    const match = value.match(/^(\d{1,2})[.)]?\s+(.+)$/);
    if (!match || Number(line?.confidence) < 70) return false;
    const title = String(match[2] || '').trim();
    const titleWords = title.match(/[A-Za-z]{3,}/g) || [];
    const titleCaseWords = title.match(/\b[A-Z][A-Za-z]{2,}\b/g) || [];
    const titleCaseOverride = titleWords.length >= 2 && titleCaseWords.length >= Math.ceil(titleWords.length * 0.6);
    const shortTitleOverride = titleWords.length === 1 && titleCaseWords.length === 1 && title.split(/\s+/).length <= 5 && !numberedBodyLooksLikeProse(title);
    if (!/^[\"'‘’]?[A-Z]/.test(title) || (titleWords.length < 2 && !shortTitleOverride && !isKnownHeading(title.replace(/^[\"'‘’]/, ''))) || titleWords.length > 14) return false;
    if ((numberedBodyLooksLikeProse(title) && !titleCaseOverride) || isMathEnvironmentLabel(title)) return false;
    if (/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title)) return false;
    return true;
  }) : [];
  const ocrExplicitNumberedStrongNumbers = new Set(ocrExplicitNumberedStrongLines.map((line) => String(line.text || '').match(/^(\d{1,2})/)?.[1]).filter(Boolean));
  const ocrExplicitNumberedStrongPages = new Set(ocrExplicitNumberedStrongLines.map((line) => Number(line.page)).filter(Number.isFinite));
  const ocrExplicitNumberedMode = documentOcrActive && (
    (ocrExplicitNumberedStrongNumbers.size >= 4 && ocrExplicitNumberedStrongPages.size >= 2) ||
    (ocrExplicitNumberedStrongNumbers.size >= 3 && ocrExplicitNumberedStrongPages.size >= 3)
  );
  const ocrExplicitNumberedLines = ocrExplicitNumberedMode ? allLines.filter((line) => {
    const value = String(line?.text || '').trim();
    const match = value.match(/^(\d{1,2})[.)]?\s+(.+)$/);
    if (!match || Number(line?.confidence) < 66) return false;
    const title = String(match[2] || '').trim();
    const titleWords = title.match(/[A-Za-z]{3,}/g) || [];
    const titleCaseWords = title.match(/\b[A-Z][A-Za-z]{2,}\b/g) || [];
    const titleCaseOverride = titleWords.length >= 2 && titleCaseWords.length >= Math.ceil(titleWords.length * 0.6);
    const shortTitleOverride = titleWords.length === 1 && titleCaseWords.length === 1 && title.split(/\s+/).length <= 5 && !numberedBodyLooksLikeProse(title);
    if (!/^[\"'‘’]?[A-Z]/.test(title) || (titleWords.length < 1 && !shortTitleOverride) || titleWords.length > 14) return false;
    if ((numberedBodyLooksLikeProse(title) && !titleCaseOverride) || isMathEnvironmentLabel(title)) return false;
    if (/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title)) return false;
    return true;
  }) : [];

  // Several classic books/journals number sections with a hyphen (6-2, 6-3)
  // while equations use the parenthesized form (6-7).  OCR frequently preserves
  // the former even when font sizing is unreliable.  Require repeated section
  // grammar plus title words; equation-only lines cannot activate this profile.
  const ocrHyphenSectionLines = documentOcrActive ? allLines.filter((line) => {
    const value = String(line?.text || '').trim();
    const match = value.match(/^(\d{1,2})-(\d{1,2})[.)]?\s+(.+)$/);
    if (!match || Number(line?.confidence) < 62) return false;
    const title = String(match[3] || '').trim();
    const titleWords = title.match(/[A-Za-z]{2,}/g) || [];
    return titleWords.length >= 1
      && titleWords.length <= 12
      && !numberedBodyLooksLikeProse(title)
      && !/^[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title);
  }) : [];
  const ocrHyphenSectionMode = documentOcrActive && new Set(ocrHyphenSectionLines.map((line) => String(line.text || '').match(/^(\d{1,2}-\d{1,2})/)?.[1]).filter(Boolean)).size >= 2;
  // Classic books can use the same 1-2 / 1-3 section
  // grammar in a native text layer. When that grammar repeats strongly, use
  // it as the document profile instead of treating every slightly enlarged
  // prose/formula line as a possible heading.
  const nativeHyphenSectionLines = !documentOcrActive ? allLines.filter((line) => {
    const value = String(line?.text || '').trim();
    const match = value.match(/^(\d{1,2})-(\d{1,2})[.)]?\s+(.+)$/);
    if (!match) return false;
    const title = String(match[3] || '').trim();
    const titleWords = title.match(/[A-Za-z]{2,}/g) || [];
    const letters = title.replace(/[^A-Za-z]/g, '');
    const strongUppercaseTitle = letters.length >= 4 && letters === letters.toUpperCase();
    return strongUppercaseTitle
      && titleWords.length >= 1
      && titleWords.length <= 14
      && !numberedBodyLooksLikeProse(title)
      && !/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(title)
      && Number(line?.xStartRatio) < 0.30;
  }) : [];
  const nativeHyphenSectionMode = !documentOcrActive
    && new Set(nativeHyphenSectionLines.map((line) => String(line.text || '').match(/^(\d{1,2}-\d{1,2})/)?.[1]).filter(Boolean)).size >= 3;
  const ocrCenteredLineSet = new Set(ocrCenteredNumberedLines);
  const ocrHyphenLineSet = new Set(ocrHyphenSectionLines);
  const nativeHyphenLineSet = new Set(nativeHyphenSectionLines);
  const ocrExplicitNumberedLineSet = new Set(ocrExplicitNumberedLines);
  // Contents blocks are navigational summaries, not document-body headings.
  // Do not discard the entire page: older papers often put the real first
  // section immediately below the table of contents on page 1. Mark only the
  // actual TOC lines so the body heading remains eligible.
  const contentsLines = new Set();
  const shortTocEntry = (text) => {
    const value = String(text || '').trim();
    if (!value || value.length > 100) return false;
    if (/^(?:bibliography|references)$/i.test(value)) return true;
    if (/^appendix(?:\s+[A-Z0-9]+)?(?:[:.]|\s)\s*\S/i.test(value)) return true;
    if (!/^(?:\d+(?:\.\d+){0,4}|[A-H](?:\.\d+){1,4}|[A-H][.)])(?:[.)])?\s+\S/.test(value)) return false;
    const words = value.split(/\s+/).filter(Boolean);
    if (words.length > 12) return false;
    // A body section that immediately continues into prose is not a TOC row.
    if (/^[^.!?]{2,90}\.\s+[A-Z][a-z]/.test(value)) return false;
    return true;
  };
  for (const lines of pages) {
    const orderedLines = [...lines].sort((a, b) => Number(b.y) - Number(a.y));
    const contentsIndex = orderedLines.findIndex((line) => /^contents$/i.test(String(line.text || '').trim()));
    if (contentsIndex >= 0) {
      contentsLines.add(orderedLines[contentsIndex]);
      let tocRows = 0;
      const tocKeys = new Set();
      const tocRowKey = (value) => normalizedHeadingText(value)
        .replace(/(?:\.\s*){3,}.*$/, '')
        .replace(/\s+\d+\s*$/, '')
        .toLocaleLowerCase();
      for (let i = contentsIndex + 1; i < orderedLines.length; i += 1) {
        const line = orderedLines[i];
        if (shortTocEntry(line.text)) {
          const key = tocRowKey(line.text);
          // A short document may begin its real body on the same page as the
          // contents. Once a TOC title repeats without its trailing page
          // number, the duplicate is the body heading, not another TOC row.
          if (tocRows >= 2 && key && tocKeys.has(key)) break;
          contentsLines.add(line);
          if (key) tocKeys.add(key);
          tocRows += 1;
          continue;
        }
        if (tocRows >= 2) break;
      }
    }
    // Also cover traditional dotted-leader TOCs even when the word Contents
    // is absent or extracted poorly.
    const dottedRows = orderedLines.filter((line) => /^(?:\d+(?:\.\d+)*|[A-Z](?:\.\d+)*)\s+.*(?:\.\s*){3,}.*\d+\s*$/.test(line.text));
    if (dottedRows.length >= 4) for (const line of dottedRows) contentsLines.add(line);
  }
  const candidates = [];
  for (const lines of pages) {
    for (const line of lines) {
      const text = line.text;
      if (!text || text.length < 2) continue;
      if (contentsLines.has(line)) continue;
      if (explicitSectionMarkerMode) {
        const value = String(text || '').trim();
        const explicitSection = qualifiedSectionMarkerLines.includes(line);
        const conventional = /^(?:abstract|introduction|references|bibliography|appendix(?:\s+[A-Z0-9]+)?(?:[:.]|\s|$))/i.test(value);
        if (!explicitSection && !conventional) continue;
      }
      // On a title page, material above an Abstract heading is title/author
      // metadata rather than document structure.
      if (line.page === 1) {
        const abstractLine = lines.find((item) => /^abstract$/i.test(item.text));
        if (abstractLine && line.y > abstractLine.y + 1.5) continue;
        const firstBodyHeading = lines.find((item) => isKnownHeading(item.text) || headingNumberDepth(item.text) !== null);
        if (firstBodyHeading && line.y > firstBodyHeading.y + 1.5) continue;
      }
      // A section heading can share one extracted line with the first sentence
      // of its paragraph, e.g. "1. Introduction. Riemannian ...". Keep the
      // heading prefix while preserving the original line geometry as anchor.
      let headingText = text;
      if (documentOcrActive && /^(\d{1,2}),\s+[A-Z]/.test(headingText)) headingText = headingText.replace(/^(\d{1,2}),/, '$1.');
      if (documentOcrActive) headingText = headingText.replace(/^(\s*\d{1,2}(?:[.)])?\s+)[\"'‘’](?=[A-Z])/, '$1');
      let headingWasParagraphLead = false;
      // Paragraph-leading section recovery is primarily for OCR/scanned papers.
      // A narrow exception lets an already-established legacy centered profile
      // recover explicit hierarchical subsections such as 2.1; ordinary native
      // numbered prose remains excluded from this relaxation.
      if (legacyParagraphMode || documentOcrActive || (legacyCenteredMode && /^\s*\d+(?:\.\d+)+/.test(headingText))) {
        const numberedLead = headingText.match(/^(\s*(?:§\s*)?(?:\d+(?:\.\d+){0,4}|[A-H](?:\.\d+){1,4}|[A-H][.)])(?:[.)])?\s+)(.+)$/);
        if (numberedLead) {
          const body = numberedLead[2];
          const boundary = body.match(/^(.{2,90}?)\.\s+(?=[A-Z][a-z])/);
          if (boundary && !numberedBodyLooksLikeProse(boundary[1])) {
            headingText = normalizedHeadingText(`${numberedLead[1]}${boundary[1]}`);
            headingWasParagraphLead = true;
          }
        }
      }
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(headingText)) continue;
      if (headingText.length > 125) continue;
      const words = headingText.split(/\s+/).filter(Boolean);
      if (words.length > 18) continue;
      // Parenthesized numeric labels sitting in either page margin are display
      // equation tags, not document headings. This matters especially for older
      // papers whose equation numbers are consistently left-aligned.
      if (isMarginEquationLabelLineForStructure(line)) continue;
      const numberedDepth = headingNumberDepth(headingText);
      const known = isKnownHeading(headingText);
      const ratio = line.size / Math.max(1, bodySize);
      const lineCenter = (Number(line.xStartRatio) + Number(line.xEndRatio)) / 2;
      const lineWidth = Number(line.xEndRatio) - Number(line.xStartRatio);
      const centered = Number.isFinite(lineCenter) && Math.abs(lineCenter - 0.5) <= 0.12;
      const containerHeading = /^(?:chapter|lecture)\s+(?:\d+|[IVXLC]+)\s*$/i.test(headingText) && ratio >= 1.25;

      if (modernHierarchyMode || (!documentOcrActive && !nativeHyphenSectionMode && !legacyParagraphMode && !legacyCenteredMode && !explicitSectionMarkerMode)) {
        // Modern/default native-text profile: typography first.
        const acronymHeading = /^(?:[A-Z][A-Z0-9&/+\-]{1,9})(?:\s+[A-Z][A-Z0-9&/+\-]{1,9}){0,3}$/.test(headingText) && ratio >= 1.08;
        const styleHeading = ratio >= 1.18 && words.length <= 14 && !/[.;,]$/.test(headingText);
        if (numberedDepth !== null && ratio < 1.08 && !known) continue;
        if (!known && numberedDepth === null && !styleHeading && !acronymHeading && !containerHeading) continue;
        if (isMathEnvironmentLabel(headingText) && ratio < 1.35) continue;
      } else {
        // Legacy/OCR profiles admit only the repeated grammar selected above.
        const numberedTitleMatch = headingText.match(/^\s*(?:§\s*)?((?:\d+(?:\.\d+){0,4}|[A-H](?:\.\d+){1,4}|[A-H][.)]))(?:[.)])?\s+(.+)$/);
        const numberedTitleBody = String(numberedTitleMatch?.[2] || '').trim();
        const proseLead = numberedBodyLooksLikeProse(numberedTitleBody);
        const titleWords = numberedTitleBody.match(/[A-Za-z]{3,}/g) || [];
        const centeredNumbered = Boolean(numberedTitleMatch)
          && !proseLead
          && !/[.!?]\s+(?:Then|Thus|Hence|This|The|We|It|By|Since|For)\b/i.test(numberedTitleBody)
          && /^[A-Z]/.test(numberedTitleBody)
          && titleWords.length >= 1
          && !/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(numberedTitleBody)
          && centered
          && (lineWidth <= 0.74 || (lineWidth <= 0.82 && titleWords.length >= 3 && !/[@~]/.test(numberedTitleBody)));
        const explicitMarkerHeading = explicitSectionMarkerMode && qualifiedSectionMarkerLines.includes(line);
        const paragraphNumbered = headingWasParagraphLead && numberedDepth !== null && (legacyParagraphMode || (legacyCenteredMode && numberedDepth >= 1));
        const legacyCenteredNumbered = legacyCenteredMode && centeredNumbered;
        const ocrProfileNumbered = (ocrCenteredNumberedMode && ocrCenteredLineSet.has(line))
          || (ocrHyphenSectionMode && ocrHyphenLineSet.has(line))
          || (ocrExplicitNumberedMode && ocrExplicitNumberedLineSet.has(line));
        const ocrNumbered = documentOcrActive && (ocrProfileNumbered || (centeredNumbered && (ratio >= 1.04 || headingWasParagraphLead)));
        const nativeHyphenNumbered = nativeHyphenSectionMode && nativeHyphenLineSet.has(line);
        const acronymHeading = /^(?:[A-Z][A-Z0-9&/+\-]{1,9})(?:\s+[A-Z][A-Z0-9&/+\-]{1,9}){0,3}$/.test(headingText)
          && ratio >= 1.08 && centered && !ocrExplicitNumberedMode;
        const styleHeading = documentOcrActive && !ocrExplicitNumberedMode
          && ratio >= 1.42 && words.length <= 10 && centered && lineWidth <= 0.65
          && /^[A-Z][A-Za-z0-9 &'’()\-–—]+$/.test(headingText);
        if (!known && !explicitMarkerHeading && !paragraphNumbered && !legacyCenteredNumbered && !ocrNumbered && !nativeHyphenNumbered && !styleHeading && !acronymHeading && !containerHeading) continue;
        if (isMathEnvironmentLabel(headingText) && !(documentOcrActive && ocrHyphenSectionMode && ocrHyphenLineSet.has(line))) continue;
      }
      if (/^(?:©|copyright\b)/i.test(headingText)) continue;
      const metadataHeadingText = headingText.normalize('NFKC');
      if (/^(?:\d{4}\s+)?Mathematics Subject Classification\b/i.test(metadataHeadingText)) continue;
      if (/\barXiv:|\b(?:department|university|e-?mail|address:)\b/i.test(headingText)) continue;
      if (!known && numberedDepth === null) {
        const lexicalWords = headingText.match(/[A-Za-z]{2,}|\p{Script=Han}{2,}/gu) || [];
        if (!lexicalWords.length) continue;
      }
      // Standalone theorem/lemma/proof headings are indexed by Results/proof
      // relations, not by the document outline. Numbered section titles that
      // merely contain words like "PROOF OF THEOREM 2" have already passed
      // through the numbered-heading grammar above and do not start with a
      // math-environment label themselves.
      if (isLikelyFormulaHeading(headingText) && !(documentOcrActive && ocrHyphenSectionMode && ocrHyphenLineSet.has(line))) continue;
      if (/^[\d\s()[\]{}.,:+\-–—=<>≤≥∑∫∞]+$/.test(headingText)) continue;
      // Bibliography/reference fragments can be typographically prominent in
      // extracted PDFs and used to leak into the detected Contents list.
      // Reject only strong reference metadata signatures; ordinary headings
      // remain eligible.
      if (/https?:\/\/|\b(?:doi|arXiv|ISBN)\b|\b10\.\d{4,9}\//i.test(headingText)) continue;
      if (/^\d{4}\b.*\b(?:Springer(?:-Verlag)?|Press|Proceedings?|Journal|Communications?|Lecture Notes)\b/i.test(headingText)) continue;
      if (/^\d{4,}\s+[a-z]/.test(headingText) && words.length >= 5) continue;

      const repetition = repeatMap.get(line.normalized);
      const repeatedOn = repetition?.pages?.size || 0;
      const repeatedPages = [...(repetition?.pages || [])].sort((a, b) => a - b);
      let consecutiveRepeats = repeatedPages.length ? 1 : 0;
      let longestConsecutiveRepeats = consecutiveRepeats;
      for (let i = 1; i < repeatedPages.length; i += 1) {
        consecutiveRepeats = repeatedPages[i] === repeatedPages[i - 1] + 1 ? consecutiveRepeats + 1 : 1;
        longestConsecutiveRepeats = Math.max(longestConsecutiveRepeats, consecutiveRepeats);
      }
      const edgeRepeat = ((repetition?.top || 0) + (repetition?.bottom || 0)) >= repeatedOn * 0.7;
      const likelyRunningHeader = repeatedOn >= 3 && edgeRepeat && (
        repeatedOn >= Math.max(3, Math.ceil(maxPages * 0.25)) || longestConsecutiveRepeats >= 3
      );
      if (likelyRunningHeader) continue;

      candidates.push({
        title: headingText,
        page: line.page,
        depth: (documentOcrActive && ocrHyphenSectionMode && ocrHyphenLineSet.has(line))
          || (nativeHyphenSectionMode && nativeHyphenLineSet.has(line))
          ? 1
          : headingDepthFromStyle({ ...line, text: headingText }, bodySize),
        size: Number(line.size.toFixed(2)),
        y: line.y,
        xStartRatio: Number(line.xStartRatio),
        xEndRatio: Number(line.xEndRatio),
        ratio: Math.min(1, Math.max(0, (line.pageHeight - line.y) / Math.max(1, line.pageHeight)))
      });
    }
  }

  // Older journals often wrap a centered section heading onto a second
  // body-size line (for example, "... More General" / "Right-Hand Side").
  // Promote only a short centered line immediately below an already accepted
  // numbered heading; this is deliberately not a general style-heading rule.
  if (documentOcrActive || legacyCenteredMode) for (const candidate of [...candidates]) {
    if (headingNumberDepth(candidate.title) === null) continue;
    const lines = pages[candidate.page - 1] || [];
    const continuation = lines
      .filter((line) => {
        if (!line?.text || line.text === candidate.title) return false;
        const center = (Number(line.xStartRatio) + Number(line.xEndRatio)) / 2;
        const width = Number(line.xEndRatio) - Number(line.xStartRatio);
        const verticalGap = candidate.y - Number(line.y);
        const words = String(line.text).trim().split(/\s+/).filter(Boolean);
        return Number.isFinite(center)
          && Math.abs(center - 0.5) <= 0.10
          && width <= 0.42
          && verticalGap > 0
          && verticalGap <= Math.max(30, Number(candidate.size) * 2.2)
          && words.length >= 1
          && words.length <= 8
          && !/[=≤≥≠≈∫∑∏√∂∇∞^_]/u.test(line.text)
          && !/[.!?]$/.test(candidate.title);
      })
      .sort((a, b) => Number(b.y) - Number(a.y))[0];
    if (!continuation) continue;
    const continuationKey = `${candidate.page}:${continuation.text.toLocaleLowerCase()}`;
    if (!candidates.some((item) => `${item.page}:${item.title.toLocaleLowerCase()}` === continuationKey)) {
      candidates.push({
        title: continuation.text,
        page: candidate.page,
        depth: candidate.depth,
        size: Number(continuation.size.toFixed(2)),
        y: continuation.y,
        xStartRatio: Number(continuation.xStartRatio),
        xEndRatio: Number(continuation.xEndRatio),
        ratio: Math.min(1, Math.max(0, (continuation.pageHeight - continuation.y) / Math.max(1, continuation.pageHeight))),
        continuationOnly: true,
      });
    }
  }

  // Book/lecture headings are often set across several large-font lines, and
  // an intermediate title line may end in punctuation (for example a comma).
  // Once a Chapter/Lecture anchor is accepted, recover only adjacent
  // same-style lines directly below it. This keeps body prose out while avoiding
  // fragmented Structure rows for books and lecture notes.
  for (const anchor of [...candidates]) {
    if (!/^(?:chapter|lecture)\s+(?:\d+|[IVXLC]+)\b/i.test(String(anchor.title || '').trim())) continue;
    const pageLines = [...(pages[anchor.page - 1] || [])].filter((line) => Number(line.y) < Number(anchor.y)).sort((a, b) => Number(b.y) - Number(a.y));
    let tailY = Number(anchor.y);
    let tailSize = Number(anchor.size);
    for (const line of pageLines) {
      const gap = tailY - Number(line.y);
      if (gap <= 0) continue;
      if (gap > 86) break;
      const size = Number(line.size);
      if (!Number.isFinite(size) || size < Math.max(1, tailSize) * 0.92 || size > Math.max(1, tailSize) * 1.38) continue;
      const text = normalizedHeadingText(line.text);
      const words = text.split(/\s+/).filter(Boolean);
      if (!text || words.length > 16 || headingNumberDepth(text) !== null || isMathEnvironmentLabel(text) || isLikelyFormulaHeading(text)) break;
      const existing = candidates.find((item) => item.page === anchor.page && normalizedHeadingText(item.title).toLocaleLowerCase() === text.toLocaleLowerCase());
      if (existing) existing.continuationOnly = true;
      else candidates.push({
        title: text, page: anchor.page, depth: anchor.depth, size: Number(size.toFixed(2)), y: line.y,
        ratio: Math.min(1, Math.max(0, (line.pageHeight - line.y) / Math.max(1, line.pageHeight))), continuationOnly: true,
      });
      tailY = Number(line.y);
      tailSize = size;
    }
  }

  const ocrSplitPages = new Set();
  if (documentOcrActive) {
    const pageCandidates = new Map();
    for (const candidate of candidates) {
      const list = pageCandidates.get(candidate.page) || [];
      list.push(candidate);
      pageCandidates.set(candidate.page, list);
    }
    for (const [pageNum, list] of pageCandidates) {
      const hasLeft = list.some((item) => Number(item.xStartRatio) < 0.44);
      const hasRight = list.some((item) => Number(item.xStartRatio) >= 0.52);
      if (hasLeft && hasRight) ocrSplitPages.add(pageNum);
    }
  }
  const ordered = candidates.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (documentOcrActive && ocrSplitPages.has(a.page)) {
      const aColumn = Number(a.xStartRatio) >= 0.52 ? 1 : 0;
      const bColumn = Number(b.xStartRatio) >= 0.52 ? 1 : 0;
      if (aColumn !== bColumn) return aColumn - bColumn;
    }
    return b.y - a.y || (Number(a.xStartRatio) || 0) - (Number(b.xStartRatio) || 0);
  });
  const merged = [];
  for (const candidate of ordered) {
    const previous = merged[merged.length - 1];
    const previousContainer = previous && /^(?:chapter|lecture)\s+(?:\d+|[IVXLC]+)\b/i.test(previous.title);
    const tailY = Number(previous?._tailY ?? previous?.y);
    const tailSize = Number(previous?._tailSize ?? previous?.size);
    const verticalGap = tailY - Number(candidate.y);
    const numberedContinuation = previous && headingNumberDepth(previous.title) !== null
      && (Boolean(candidate.continuationOnly) || (Math.abs(tailSize - Number(candidate.size)) <= 0.85 && !isKnownHeading(candidate.title)));
    const containerContinuation = previousContainer
      && Number(candidate.size) >= Math.max(1, tailSize) * 0.95
      && Number(candidate.size) <= Math.max(1, tailSize) * 1.35;
    const continuation = previous
      && previous.page === candidate.page
      && headingNumberDepth(candidate.title) === null
      && verticalGap > 0
      && verticalGap <= (previousContainer ? 82 : Math.max(32, tailSize * 2.1))
      && !/[.!?]$/.test(previous.title)
      && (numberedContinuation || containerContinuation);
    if (continuation) {
      previous.title = normalizedHeadingText(`${previous.title.replace(/-$/, '')}${/-$/.test(previous.title) ? '' : ' '}${candidate.title}`);
      previous._tailY = candidate.y;
      previous._tailSize = candidate.size;
      continue;
    }
    merged.push({ ...candidate, _tailY: candidate.y, _tailSize: candidate.size });
  }

  const deduped = [];
  const seen = new Set();
  for (const candidate of merged) {
    const key = `${candidate.page}:${candidate.title.toLocaleLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
  }
  const contentsPages = new Set();
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    if ((pages[pageIndex] || []).some((line) => /^contents$/i.test(String(line?.text || '').trim()))) contentsPages.add(pageIndex + 1);
  }
  const cleaned = deduped.filter((candidate, index) => {
    if (!contentsPages.has(candidate.page)) return true;
    const key = normalizedHeadingText(candidate.title).toLocaleLowerCase();
    return !deduped.slice(index + 1).some((later) => later.page > candidate.page && normalizedHeadingText(later.title).toLocaleLowerCase() === key);
  });
  const seenTerminalHeadings = new Set();
  const finalCandidates = cleaned.filter((candidate) => {
    const terminal = /^(?:bibliography|references)$/i.test(String(candidate.title || '').trim());
    if (!terminal) return true;
    const key = String(candidate.title || '').trim().toLocaleLowerCase();
    if (seenTerminalHeadings.has(key)) return false;
    seenTerminalHeadings.add(key);
    return true;
  });
  return finalCandidates.slice(0, 240).map(({ _tailY, _tailSize, ...candidate }) => candidate);
}

function positionOutlineEditActions(trigger, actions) {
  if (!trigger || !actions) return;
  const rect = trigger.getBoundingClientRect();
  const sidebar = trigger.closest('.sidebar') || trigger.closest('.sidebar-left');
  const sidebarRect = sidebar?.getBoundingClientRect?.();
  const gap = 10;
  const margin = 8;
  const width = Math.max(1, actions.offsetWidth);
  const height = Math.max(1, actions.offsetHeight);

  // Native scrollbars live outside the element's client box and can win hit testing
  // even when a fixed element is visually painted above them. Keep the action
  // surface strictly inside the sidebar client box so it never overlaps the
  // scrollbar track or thumb.
  const safeLeft = sidebarRect ? sidebarRect.left + margin : margin;
  const safeRight = sidebar
    ? sidebarRect.left + Math.max(1, sidebar.clientWidth) - margin
    : window.innerWidth - margin;

  let left = rect.right + gap;
  if (left + width > safeRight) left = rect.left - gap - width;
  left = Math.max(safeLeft, Math.min(left, safeRight - width));

  const safeTop = sidebarRect ? sidebarRect.top + margin : margin;
  const safeBottom = sidebarRect ? sidebarRect.bottom - margin : window.innerHeight - margin;
  let top = rect.top + (rect.height - height) / 2;
  top = Math.max(safeTop, Math.min(top, safeBottom - height));

  actions.style.left = `${Math.round(left)}px`;
  actions.style.top = `${Math.round(top)}px`;
}

function embeddedOutlineSourceKey(entry) {
  return String(entry?.sourceKey || '').trim();
}

function applyEmbeddedOutlineEdits(entries) {
  const edits = new Map(embeddedOutlineEdits.map((item) => [String(item.sourceKey), item]));
  const out = [];
  for (const entry of entries || []) {
    const key = embeddedOutlineSourceKey(entry);
    const edit = edits.get(key);
    if (edit?.action === 'remove') continue;
    if (edit?.action === 'reselect') {
      out.push({
        ...entry,
        title: String(edit.title || entry.title),
        matchText: String(edit.matchText || edit.title || entry.title),
        page: Number(edit.page) || entry.page,
        ratio: Number(edit.ratio) || 0,
        userEdited: true,
      });
    } else out.push(entry);
  }
  return out;
}

function renderEmbeddedOutline(entries) {
  outlineList.replaceChildren();
  const visible = applyEmbeddedOutlineEdits(entries);
  outlineMode = 'embedded';
  updateOutlineSource();
  outlineCount.textContent = String(visible.length);
  outlineEmpty.classList.toggle('is-hidden', visible.length > 0);
  for (const entry of visible) {
    const row = document.createElement('div');
    row.className = 'outline-edit-row';
    row.dataset.mapFilterText = entry.title;
    row.dataset.depth = String(Math.min(3, Math.max(0, Number(entry.depth) || 0)));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outline-item';
    button.dataset.depth = row.dataset.depth;
    button.dataset.page = String(entry.page);
    button.textContent = entry.title || t('Untitled', '未命名');
    button.title = t(`PDF outline · page ${entry.page}`, `PDF 目录 · 第 ${entry.page} 页`);
    button.addEventListener('click', async () => {
      outlineList.querySelectorAll('.outline-edit-row.has-edit-menu').forEach((node) => node.classList.remove('has-edit-menu'));
      setDocumentMapSelectedNode(button);
      await goToMatchedLocation(entry.page, Number(entry.ratio) || 0, '');
    });

    const menu = document.createElement('button');
    menu.type = 'button';
    menu.className = 'outline-overflow-button';
    menu.textContent = '⋯';
    menu.title = t('Edit structure item', '编辑结构条目');
    menu.setAttribute('aria-label', menu.title);
    menu.setAttribute('aria-expanded', 'false');

    const actions = document.createElement('div');
    actions.className = 'outline-edit-actions';
    const reselect = document.createElement('button');
    reselect.type = 'button';
    reselect.className = 'outline-edit-button';
    reselect.textContent = t('Reselect', '重新选择');
    reselect.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      row.classList.remove('has-edit-menu');
      pendingOutlineReselectKey = `embedded:${entry.sourceKey}`;
      refreshSelectionUI();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'outline-edit-button';
    remove.textContent = t('Remove', '移除');
    remove.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      row.classList.remove('has-edit-menu');
      pushUndo('structure-embedded', entry.title || t('Structure item','结构条目'), {
        sourceKey: String(entry.sourceKey),
        title: String(entry.title || ''),
        page: Number(entry.page) || 1,
        ratio: Number(entry.ratio) || 0,
        depth: Math.min(3, Math.max(0, Number(entry.depth) || 0)),
        matchText: String(entry.matchText || entry.title || '')
      });
      embeddedOutlineEdits = embeddedOutlineEdits.filter((item) => String(item.sourceKey) !== String(entry.sourceKey));
      embeddedOutlineEdits.push({ action:'remove', sourceKey:String(entry.sourceKey) });
      if (pendingOutlineReselectKey === `embedded:${entry.sourceKey}`) pendingOutlineReselectKey = null;
      persistDocumentState();
      renderEmbeddedOutline(embeddedOutlineEntries);
      rerenderReferenceLinksAfterStructureEdit();
      refreshSelectionUI();
    });
    actions.append(reselect, remove);
    menu.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      const willOpen = !row.classList.contains('has-edit-menu');
      outlineList.querySelectorAll('.outline-edit-row.has-edit-menu').forEach((node) => {
        node.classList.remove('has-edit-menu');
        node.querySelector('.outline-overflow-button')?.setAttribute('aria-expanded', 'false');
      });
      row.classList.toggle('has-edit-menu', willOpen);
      menu.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) requestAnimationFrame(() => positionOutlineEditActions(menu, actions));
    });
    row.append(button, menu, actions);
    outlineList.append(row);
  }
  applyDocumentMapFilter(el('map-filter-structure')); updateDocumentMapCurrentLocation();
}

function renderInferredOutline(entries) {
  outlineList.replaceChildren();
  outlineCount.textContent = String(entries.length);
  outlineEmpty.classList.toggle('is-hidden', entries.length > 0);
  if (!entries.length) {
    outlineMode = 'none';
    updateOutlineSource();
    outlineEmpty.textContent = t('No reliable document headings were detected.', '未检测到足够可靠的文档标题。');
    return;
  }
  outlineMode = 'inferred';
  updateOutlineSource();
  for (const entry of entries) {
    const row = document.createElement('div');
    row.className = 'outline-edit-row';
    row.dataset.mapFilterText = entry.title;
    row.dataset.depth = String(Math.min(3, Math.max(0, Number(entry.depth) || 0)));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'outline-item';
    button.dataset.depth = row.dataset.depth;
    button.dataset.page = String(entry.page);
    button.textContent = entry.title;
    button.title = t(`Detected heading · page ${entry.page}`, `自动检测标题 · 第 ${entry.page} 页`);
    button.addEventListener('click', () => {
      outlineList.querySelectorAll('.outline-edit-row.has-edit-menu').forEach((node) => node.classList.remove('has-edit-menu'));
      setDocumentMapSelectedNode(button);
      goToMatchedLocation(entry.page, Number.isFinite(Number(entry.ratio)) ? Number(entry.ratio) : 0, '');
    });
    const menu = document.createElement('button');
    menu.type = 'button';
    menu.className = 'outline-overflow-button';
    menu.textContent = '⋯';
    menu.title = t('Edit structure item', '编辑结构条目');
    menu.setAttribute('aria-label', menu.title);
    menu.setAttribute('aria-expanded', 'false');
    menu.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const willOpen = !row.classList.contains('has-edit-menu');
      outlineList.querySelectorAll('.outline-edit-row.has-edit-menu').forEach((node) => {
        node.classList.remove('has-edit-menu');
        node.querySelector('.outline-overflow-button')?.setAttribute('aria-expanded', 'false');
      });
      row.classList.toggle('has-edit-menu', willOpen);
      menu.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) requestAnimationFrame(() => positionOutlineEditActions(menu, actions));
    });

    const actions = document.createElement('div');
    actions.className = 'outline-edit-actions';
    if (entry.userEdited) {
      const currentDepth = Math.min(3, Math.max(0, Number(entry.depth) || 0));
      if (currentDepth > 0) {
        const moveLeft = document.createElement('button');
        moveLeft.type = 'button';
        moveLeft.className = 'outline-edit-button';
        moveLeft.textContent = '←';
        moveLeft.title = t('Move left one level', '向左移一级');
        moveLeft.setAttribute('aria-label', moveLeft.title);
        moveLeft.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          entry.depth = currentDepth - 1;
          row.classList.remove('has-edit-menu');
          persistDocumentState();
          renderInferredOutline(inferredOutline);
        });
        actions.append(moveLeft);
      }
      if (currentDepth < 3) {
        const moveRight = document.createElement('button');
        moveRight.type = 'button';
        moveRight.className = 'outline-edit-button';
        moveRight.textContent = '→';
        moveRight.title = t('Move right one level', '向右移一级');
        moveRight.setAttribute('aria-label', moveRight.title);
        moveRight.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          entry.depth = currentDepth + 1;
          row.classList.remove('has-edit-menu');
          persistDocumentState();
          renderInferredOutline(inferredOutline);
        });
        actions.append(moveRight);
      }
    }
    const reselect = document.createElement('button');
    reselect.type = 'button';
    reselect.className = 'outline-edit-button';
    reselect.textContent = t('Reselect', '重新选择');
    reselect.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      row.classList.remove('has-edit-menu');
      pendingOutlineReselectKey = outlineEntryKey(entry);
      refreshSelectionUI();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'outline-edit-button';
    remove.textContent = t('Remove', '移除');
    remove.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      row.classList.remove('has-edit-menu');
      const key = outlineEntryKey(entry);
      if (pendingOutlineReselectKey === key) pendingOutlineReselectKey = null;
      pushUndo('structure-outline', entry.title || t('Structure item','结构条目'), entry);
      inferredOutline = inferredOutline.filter((item) => outlineEntryKey(item) !== key);
      tocOutlineTargets = null;
      persistDocumentState();
      renderInferredOutline(inferredOutline);
      rerenderReferenceLinksAfterStructureEdit();
      refreshSelectionUI();
    });
    actions.append(reselect, remove);
    row.append(button, menu, actions);
    outlineList.append(row);
  }
  applyDocumentMapFilter(el('map-filter-structure')); updateDocumentMapCurrentLocation();
}

document.addEventListener('click', (event) => {
  if (event.target.closest?.('.outline-edit-actions, .outline-overflow-button')) return;
  document.querySelectorAll('#outline-list .outline-edit-row.has-edit-menu, #equation-index .equation-edit-row.has-edit-menu').forEach((node) => {
    node.classList.remove('has-edit-menu');
    node.querySelector('.outline-overflow-button')?.setAttribute('aria-expanded', 'false');
  });
});

const STRUCTURE_LABEL_RE = /^(?:theorem|lemma|proposition|corollary|definition|remark|example|claim|conjecture|question|assumption|hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])(?:[.:)]|\s)/i;
const STRUCTURE_REFERENCE_RE = /\b(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis)\s+(?:[A-Z]?\d+(?:\.\d+)*|[A-Z])\b/gi;
const EQUATION_TAG_SYMBOL_CLASS = '*∗⋆★☆†‡※◇◆○●◦•△▲▽▼□■♢♦⊙⊗⊕⊖⊥∥';
const EQUATION_TAG_SYMBOL_PATTERN = `[${EQUATION_TAG_SYMBOL_CLASS.replace(/[\]\-^]/g, '\\$&')}]`;
const CLICKABLE_REFERENCE_RE = new RegExp(
  `\\b(?:Theorem|Lemma|Proposition|Corollary|Definition|Remark|Example|Claim|Conjecture|Question|Assumption|Hypothesis|Section)\\s+[A-Z]?\\d+(?:\\.\\d+)*\\b|` +
  `\\(\\s*(?:\\d+(?:(?:\\.\\d+)+|(?:-\\d+)+)?|${EQUATION_TAG_SYMBOL_PATTERN}(?:\\s*${EQUATION_TAG_SYMBOL_PATTERN}){0,7})\\s*\\)|` +
  `\\[\\s*\\d{1,3}\\s*\\]`,
  'gi',
);
const GROUPED_BIBLIOGRAPHY_RE = /\[\s*\d{1,3}(?:\s*(?:,|;|[-–—])\s*\d{1,3})+\s*\]/g;

