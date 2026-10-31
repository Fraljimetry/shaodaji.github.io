// MathReader v306 · PDF-vector formula extraction, image preprocessing, fusion, and recognition.
function median(values) {
  const nums = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return 0;
  const middle = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[middle] : (nums[middle - 1] + nums[middle]) / 2;
}

function vectorTextLayerForOcrLayer(layer) {
  const kind = layer?.dataset?.kind || 'primary';
  if (kind === 'reference') return referenceTextLayer;
  if (kind === 'continuous') return layer.closest('.continuous-page-surface')?.querySelector('.textLayer') || null;
  return primaryTextLayer;
}

function latexifyVectorText(text) {
  let out = pdfTextToLatex(text);
  const operators = ['Area','Vol','div','grad','curl','det','tr','rank','Ric','Scal','Hess','supp','dist','diam','Ricci'];
  for (const name of operators) {
    const pattern = new RegExp(`(^|[^A-Za-z\\\\])${name}(?=\\s*\\(|\\s*\\{|\\s*[A-Z_a-z\\\\])`, 'g');
    out = out.replace(pattern, (_, prefix) => `${prefix}\\operatorname{${name}}`);
  }
  return out
    .replace(/\s+([,.;:)\]])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\\(?:cap|cup)\s+/, '')
    .trim();
}

function vectorOperatorName(text) {
  const value = String(text || '').trim();
  return ['sup','inf','lim','limsup','liminf','max','min'].includes(value) ? value : null;
}

function vectorLimitOperatorInfo(token) {
  const raw = String(token?.text || '').trim();
  const named = vectorOperatorName(raw);
  if (named) return { latex: `\\${named}`, raw, lower: true, upper: true };
  const map = {
    '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
    '∑': '\\sum', '∏': '\\prod', '⋃': '\\bigcup', '⋂': '\\bigcap',
    '∪': '\\cup', '∩': '\\cap'
  };
  if (!map[raw]) return null;
  return { latex: map[raw], raw, lower: true, upper: true };
}

function vectorRows(tokens, tolerance) {
  const rows = [];
  for (const token of [...tokens].sort((a, b) => (a.centerY - b.centerY) || (a.left - b.left))) {
    let row = rows.find((candidate) => Math.abs(candidate.centerY - token.centerY) <= tolerance);
    if (!row) {
      row = { tokens: [], centerY: token.centerY };
      rows.push(row);
    }
    row.tokens.push(token);
    row.centerY = median(row.tokens.map((item) => item.centerY));
  }
  for (const row of rows) {
    row.tokens.sort((a, b) => a.left - b.left);
    row.left = Math.min(...row.tokens.map((item) => item.left));
    row.right = Math.max(...row.tokens.map((item) => item.right));
    row.top = Math.min(...row.tokens.map((item) => item.top));
    row.bottom = Math.max(...row.tokens.map((item) => item.bottom));
    row.width = row.right - row.left;
    row.height = row.bottom - row.top;
    row.centerX = (row.left + row.right) / 2;
  }
  return rows.sort((a, b) => a.centerY - b.centerY);
}

function vectorRowSegments(row, baseHeight) {
  const groups = [];
  let group = [];
  let previous = null;
  const flush = () => {
    if (!group.length) return;
    const segment = {
      tokens: group,
      left: Math.min(...group.map((item) => item.left)),
      right: Math.max(...group.map((item) => item.right)),
      top: Math.min(...group.map((item) => item.top)),
      bottom: Math.max(...group.map((item) => item.bottom))
    };
    segment.width = segment.right - segment.left;
    segment.centerX = (segment.left + segment.right) / 2;
    segment.centerY = median(group.map((item) => item.centerY));
    groups.push(segment);
    group = [];
  };
  for (const token of row.tokens) {
    const gap = previous ? token.left - previous.right : 0;
    if (previous && gap > Math.max(baseHeight * 0.72, previous.height * 0.9)) flush();
    group.push(token);
    previous = token;
  }
  flush();
  return groups;
}

function vectorTokenFromRect(text, r, layerRect) {
  return {
    text: cleanPdfGlyphText(text),
    left: r.left - layerRect.left,
    right: r.right - layerRect.left,
    top: r.top - layerRect.top,
    bottom: r.bottom - layerRect.top,
    width: r.width,
    height: r.height,
    centerX: (r.left + r.right) / 2 - layerRect.left,
    centerY: (r.top + r.bottom) / 2 - layerRect.top
  };
}

function vectorGlyphTokensFromTextLayer(textLayer, layerRect, selected) {
  const glyphs = [];
  for (const span of textLayer.querySelectorAll('span')) {
    let emittedForSpan = 0;
    for (const node of span.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue) continue;
      const value = node.nodeValue;
      // DOM Range offsets are UTF-16 code-unit offsets, while mathematical
      // alphanumeric symbols (e.g. 𝑢, 𝛼, 𝐾) are supplementary-plane Unicode
      // code points represented by surrogate pairs. Iterate by code point but
      // advance Range offsets by ch.length so a glyph is never split into two
      // invalid surrogate halves (which previously surfaced as U+FFFD / �).
      let utf16Offset = 0;
      for (const ch of value) {
        const startOffset = utf16Offset;
        utf16Offset += ch.length;
        if (!ch || ch === '\u00ad' || /[\uFE00-\uFE0F]/u.test(ch) || /\s/u.test(ch)) continue;
        let r = null;
        try {
          const range = document.createRange();
          range.setStart(node, startOffset);
          range.setEnd(node, utf16Offset);
          r = range.getBoundingClientRect();
          range.detach?.();
        } catch (_) { r = null; }
        if (!r || !r.width || !r.height) continue;
        const box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        if (rectIntersectionRatio(box, selected) < 0.08) continue;
        glyphs.push(vectorTokenFromRect(ch, r, layerRect));
        emittedForSpan += 1;
      }
    }
    if (emittedForSpan) continue;
    const value = String(span.textContent || '').replace(/\u00ad/g, '').trim();
    if (!value) continue;
    const r = span.getBoundingClientRect();
    const box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    if (rectIntersectionRatio(box, selected) < 0.12) continue;
    glyphs.push(vectorTokenFromRect(value, r, layerRect));
  }
  return glyphs;
}

function dominantVectorHeight(tokens) {
  const heights = tokens.map((token) => token.height).filter((height) => Number.isFinite(height) && height > 0).sort((a, b) => a - b);
  if (!heights.length) return 0;
  const clusters = [];
  for (const height of heights) {
    let cluster = clusters.find((candidate) => Math.abs(candidate.center - height) <= Math.max(1.2, candidate.center * 0.16));
    if (!cluster) {
      cluster = { values: [], center: height };
      clusters.push(cluster);
    }
    cluster.values.push(height);
    cluster.center = median(cluster.values);
  }
  clusters.sort((a, b) => (b.values.length - a.values.length) || (b.center - a.center));
  return clusters[0]?.center || median(heights);
}

function mergeVectorGlyphWords(tokens, baseHeight) {
  if (!tokens.length) return [];
  tokens = tokens.map((token) => ({ ...token, text: cleanPdfGlyphText(token.text) }));
  const rows = vectorRows(tokens, Math.max(1.5, baseHeight * 0.22));
  const merged = [];
  const canMergeChar = (text) => /^[A-Za-z0-9]$/.test(text);
  for (const row of rows) {
    let group = [];
    const flush = () => {
      if (!group.length) return;
      if (group.length === 1) merged.push(group[0]);
      else {
        const text = group.map((token) => token.text).join('');
        merged.push({
          text,
          left: group[0].left,
          right: group[group.length - 1].right,
          top: Math.min(...group.map((token) => token.top)),
          bottom: Math.max(...group.map((token) => token.bottom)),
          width: group[group.length - 1].right - group[0].left,
          height: median(group.map((token) => token.height)),
          centerX: (group[0].left + group[group.length - 1].right) / 2,
          centerY: median(group.map((token) => token.centerY)),
          glyphs: group
        });
      }
      group = [];
    };
    for (const token of row.tokens) {
      if (!canMergeChar(token.text)) { flush(); merged.push(token); continue; }
      if (!group.length) { group.push(token); continue; }
      const previous = group[group.length - 1];
      const gap = token.left - previous.right;
      const similarHeight = Math.abs(token.height - previous.height) <= Math.max(1.2, baseHeight * 0.18);
      const sameKind = /^[A-Za-z]$/.test(previous.text) === /^[A-Za-z]$/.test(token.text);
      if (similarHeight && sameKind && gap <= Math.max(1.5, baseHeight * 0.16)) group.push(token);
      else { flush(); group.push(token); }
    }
    flush();
  }
  return merged;
}

function vectorSegmentWithScripts(segment, pool, baseHeight, excluded = new Set()) {
  const result = [...segment.tokens];
  for (const token of pool) {
    if (result.includes(token) || excluded.has(token) || token.height >= baseHeight * 0.84) continue;
    if (token.left < segment.left - baseHeight * 0.18 || token.left > segment.right + baseHeight * 0.95) continue;
    if (token.centerY < segment.top - baseHeight * 0.62 || token.centerY > segment.bottom + baseHeight * 0.62) continue;
    const nearBase = segment.tokens.some((base) => token.left >= base.left - baseHeight * 0.10 && token.left <= base.right + baseHeight * 1.0);
    if (nearBase) result.push(token);
  }
  return [...new Set(result)];
}

function vectorTokenLatex(token) {
  if (token.syntheticLatex) return token.syntheticLatex;
  const raw = cleanPdfGlyphText(String(token.text || '')).trim();
  const operator = vectorOperatorName(raw);
  if (operator) return `\\${operator}`;
  const namedOperators = new Set(['Area','Vol','div','grad','curl','det','tr','rank','Ric','Ricci','Scal','Hess','supp','dist','diam','Rot','Res','Cov','Pf','Log','arg']);
  if (namedOperators.has(raw)) return `\\operatorname{${raw}}`;
  const standardFunctions = new Set(['sin','cos','tan','cot','sec','csc','sinh','cosh','tanh','log','ln','exp']);
  if (standardFunctions.has(raw)) return `\\${raw}`;
  if (raw === 'd') return '\\,\\mathrm{d}';
  if (/^d[A-Za-z]$/.test(raw)) return `\\,\\mathrm{d}${raw.slice(1)}`;
  return latexifyVectorText(raw);
}

function normalizeVectorDelimiters(latex) {
  let barOpen = true;
  let out = '';
  for (let i = 0; i < latex.length; i += 1) {
    const ch = latex[i];
    if (ch !== '|') { out += ch; continue; }
    out += barOpen ? '\\lvert ' : '\\rvert ';
    barOpen = !barOpen;
  }
  return out
    .replace(/\\parallel\s+/g, '\\Vert ')
    .replace(/\\lvert\s+/g, '\\lvert ')
    .replace(/\\rvert\s+/g, '\\rvert ')
    .replace(/\s+(?=[,.;:)\]])/g, '')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s+(?=[_^]\{)/g, '')
    .replace(/}\s+\(/g, '}(')
    .replace(/\s*\\(subsetneq|subseteq|supseteq|notin|approx|cong|equiv|mapsto|subset|supset|cap|cup|le|ge|ne|sim|ni|in|to)(?![A-Za-z])\s*/g, ' \\$1 ')
    .replace(/\\cdot\s+\\cdot\s+\\cdot/g, '\\cdots')
    .replace(/\\sim\s*=|\\sim\s*\\equiv/g, '\\cong')
    .replace(/\\not\s*=/g, '\\ne')
    .replace(/^\\(?:cap|cup)\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseVectorInline(tokens, baseHeight, overrides = new Map()) {
  if (!tokens.length) return '';
  const usable = [...tokens].sort((a, b) => (a.left - b.left) || (a.centerY - b.centerY));
  const localMaxHeight = Math.max(...usable.map((token) => token.syntheticLatex ? baseHeight : token.height));
  const localLargeHeights = usable
    .filter((token) => token.syntheticLatex || token.height >= localMaxHeight * 0.82)
    .map((token) => token.syntheticLatex ? baseHeight : token.height);
  const referenceHeight = median(localLargeHeights) || baseHeight || localMaxHeight;
  const large = usable.filter((token) => token.syntheticLatex || token.height >= referenceHeight * 0.80);
  const localCenter = median((large.length ? large : usable).map((token) => token.centerY));

  const bases = usable.filter((token) => {
    if (token.syntheticLatex) return true;
    const verticalOffset = Math.abs(token.centerY - localCenter);
    if (token.height < referenceHeight * 0.82 && verticalOffset >= referenceHeight * 0.09) return false;
    if (verticalOffset <= referenceHeight * 0.20) return true;
    return token.height >= referenceHeight * 0.88 && verticalOffset <= referenceHeight * 0.42;
  });
  const scripts = usable.filter((token) => !bases.includes(token));
  const attachments = new Map();
  // TeX often emits an entire exponent/subscript phrase as a raised/lowered
  // run (for example e^{-is\rho\cdot\omega}), not as one tiny glyph. Group
  // those script glyphs geometrically first, then attach the whole run to the
  // closest base immediately to its left.
  const scriptRows = vectorRows(scripts, Math.max(1.2, referenceHeight * 0.20));
  const scriptSegments = scriptRows.flatMap((row) => vectorRowSegments(row, referenceHeight * 0.82));
  for (const segment of scriptSegments) {
    const candidates = bases.filter((base) => {
      if (base.syntheticLatex) return false;
      const startNearBase = segment.left >= base.left - referenceHeight * 0.12 && segment.left <= base.right + referenceHeight * 0.95;
      const vertical = Math.abs(segment.centerY - base.centerY) >= referenceHeight * 0.09;
      return startNearBase && vertical;
    }).sort((a, b) => {
      const aRightPenalty = a.right <= segment.left + referenceHeight * 0.20 ? 0 : referenceHeight * 0.9;
      const bRightPenalty = b.right <= segment.left + referenceHeight * 0.20 ? 0 : referenceHeight * 0.9;
      const da = Math.abs(segment.left - a.right) + Math.abs(segment.centerY - a.centerY) * 0.18 + aRightPenalty;
      const db = Math.abs(segment.left - b.right) + Math.abs(segment.centerY - b.centerY) * 0.18 + bRightPenalty;
      return da - db;
    });
    const target = candidates[0];
    if (!target) continue;
    const kind = segment.centerY < target.centerY ? 'super' : 'sub';
    if (!attachments.has(target)) attachments.set(target, { sub: [], super: [] });
    attachments.get(target)[kind].push(...segment.tokens);
  }

  const orderedBases = bases.sort((a, b) => a.left - b.left);
  const renderBase = (base) => {
    let value = overrides.get(base) || vectorTokenLatex(base);
    const attached = attachments.get(base);
    if (attached?.sub?.length) value += `_{${parseVectorInline(attached.sub, referenceHeight * 0.78)}}`;
    if (attached?.super?.length) value += `^{${parseVectorInline(attached.super, referenceHeight * 0.78)}}`;
    return value;
  };

  let latex = '';
  let previousRight = null;
  for (let index = 0; index < orderedBases.length; index += 1) {
    const base = orderedBases[index];
    const raw = String(base.text || '').trim();
    let value = renderBase(base);
    if (!value) continue;

    if (raw === '√' || value === '\\sqrt{}') {
      const radicand = [];
      let lastRight = base.right;
      let cursor = index + 1;
      for (; cursor < orderedBases.length; cursor += 1) {
        const next = orderedBases[cursor];
        const nextRaw = String(next.text || '').trim();
        const gap = next.left - lastRight;
        if (/^(?:=|≤|≥|<|>|≈|≠|,|;)$/.test(nextRaw)) break;
        if (gap > referenceHeight * 0.82 && radicand.length) break;
        radicand.push(next);
        lastRight = next.right;
      }
      if (radicand.length) {
        const first = radicand[0];
        const last = radicand[radicand.length - 1];
        const radicandTokens = usable.filter((token) => token !== base
          && token.left >= first.left - referenceHeight * 0.12
          && token.right <= last.right + referenceHeight * 0.42
          && token.centerY >= localCenter - referenceHeight * 0.88
          && token.centerY <= localCenter + referenceHeight * 0.88);
        value = `\\sqrt{${parseVectorInline(radicandTokens, referenceHeight, overrides)}}`;
        index = cursor - 1;
      }
    }

    if (previousRight !== null) {
      const gap = base.left - previousRight;
      const valueStartsLetter = /^[A-Za-z]/.test(value);
      const wordLike = valueStartsLetter && /[A-Za-z]$/.test(latex);
      const controlWordBoundary = valueStartsLetter && /\\[A-Za-z]+$/.test(latex);
      if (controlWordBoundary || gap > referenceHeight * 0.48 || (wordLike && gap > referenceHeight * 0.16)) latex += ' ';
    }
    latex += value;
    previousRight = Math.max(previousRight ?? base.right, base.right);
  }
  return normalizeVectorDelimiters(latex);
}

function vectorFindLimitSegment(rows, op, direction, baseHeight, usedSegments = new Set()) {
  let best = null;
  for (const row of rows) {
    const delta = row.centerY - op.centerY;
    if (direction === 'lower' && (delta <= baseHeight * 0.10 || delta > baseHeight * 2.6)) continue;
    if (direction === 'upper' && (delta >= -baseHeight * 0.10 || delta < -baseHeight * 2.6)) continue;
    for (const segment of vectorRowSegments(row, baseHeight)) {
      if (usedSegments.has(segment) || segment.tokens.includes(op)) continue;
      const horizontalNear = segment.left <= op.right + baseHeight * 2.0 && segment.right >= op.left - baseHeight * 0.65;
      if (!horizontalNear) continue;
      const centerDistance = Math.abs(segment.centerX - op.centerX);
      if (centerDistance > Math.max(baseHeight * 1.75, segment.width * 0.55)) continue;
      const verticalDistance = Math.abs(delta);
      const score = verticalDistance + centerDistance * 0.28 + Math.max(0, segment.width - baseHeight * 6) * 0.15;
      if (!best || score < best.score) best = { segment, score };
    }
  }
  return best?.segment || null;
}

function vectorRelationRow(row) {
  const joined = row.tokens.map((token) => token.text).join('');
  return /[=<>≤≥≈≅≠]/.test(joined);
}

function vectorAlignedLine(latex, first = false) {
  const value = String(latex || '').trim();
  if (!value) return '';
  const leading = value.match(/^(=|\\le|\\ge|\\approx|\\cong|\\ne)(.*)$/);
  if (leading) return `&${leading[1]} ${leading[2].trim()}`;
  const match = value.match(/^(.*?)(=|\\le|\\ge|\\approx|\\cong|\\ne)(.*)$/);
  if (!match) return first ? value : `&${value}`;
  return `${match[1].trim()} &${match[2]} ${match[3].trim()}`;
}

function vectorAccentCommand(text) {
  const raw = String(text || '').trim();
  if (['ˆ','̂','^'].includes(raw)) return '\\widehat';
  if (['˜','̃','~'].includes(raw)) return '\\widetilde';
  if (['¯','‾','̄'].includes(raw)) return '\\overline';
  if (['˙','̇'].includes(raw)) return '\\dot';
  return null;
}

function vectorBuildAccentTokens(tokens, mainRow, baseHeight, consumed) {
  const synthetic = [];
  const accents = tokens.filter((token) => !consumed.has(token)
    && vectorAccentCommand(token.text)
    && Math.abs(token.centerY - mainRow.centerY) <= baseHeight * 1.05);
  for (const accent of accents) {
    const command = vectorAccentCommand(accent.text);
    const pad = accent.width <= baseHeight * 0.8 ? baseHeight * 0.10 : baseHeight * 0.18;
    let targets = tokens.filter((token) => token !== accent
      && !vectorAccentCommand(token.text)
      && !consumed.has(token)
      && token.centerX >= accent.left - pad
      && token.centerX <= accent.right + pad
      && Math.abs(token.centerY - mainRow.centerY) <= baseHeight * 0.72);
    if (!targets.length) continue;
    if (accent.width <= baseHeight * 0.8 && targets.length > 1) {
      targets = [targets.reduce((best, token) => Math.abs(token.centerX - accent.centerX) < Math.abs(best.centerX - accent.centerX) ? token : best, targets[0])];
    }
    targets.sort((a, b) => a.left - b.left);
    const latex = parseVectorInline(targets, baseHeight);
    if (!latex) continue;
    targets.forEach((token) => consumed.add(token));
    consumed.add(accent);
    synthetic.push({
      syntheticLatex: `${command}{${latex}}`,
      text: `${accent.text}${targets.map((token) => token.text).join('')}`,
      left: Math.min(...targets.map((token) => token.left)),
      right: Math.max(...targets.map((token) => token.right)),
      top: Math.min(accent.top, ...targets.map((token) => token.top)),
      bottom: Math.max(...targets.map((token) => token.bottom)),
      width: Math.max(...targets.map((token) => token.right)) - Math.min(...targets.map((token) => token.left)),
      height: baseHeight,
      centerX: (Math.min(...targets.map((token) => token.left)) + Math.max(...targets.map((token) => token.right))) / 2,
      centerY: mainRow.centerY
    });
  }
  return synthetic;
}

function extractVectorFormulaFromTokens(tokens, allowMultiline = true, baseHeightHint = 0) {
  if (!tokens?.length) return null;
  const baseHeight = baseHeightHint || dominantVectorHeight(tokens) || median(tokens.map((token) => token.height));
  if (!baseHeight) return null;
  const baseRows = vectorRows(tokens.filter((token) => token.height >= baseHeight * 0.68), Math.max(1.8, baseHeight * 0.28));

  if (allowMultiline) {
    const relationRows = baseRows.filter((row) => vectorRelationRow(row) && median(row.tokens.map((token) => token.height)) >= baseHeight * 0.82).sort((a, b) => a.centerY - b.centerY);
    const distinct = relationRows.filter((row, index) => index === 0 || Math.abs(row.centerY - relationRows[index - 1].centerY) > baseHeight * 0.62);
    if (distinct.length >= 2) {
      const parsed = [];
      for (let index = 0; index < distinct.length; index += 1) {
        const row = distinct[index];
        const topBoundary = index === 0 ? -Infinity : (distinct[index - 1].centerY + row.centerY) / 2;
        const bottomBoundary = index === distinct.length - 1 ? Infinity : (row.centerY + distinct[index + 1].centerY) / 2;
        const slice = tokens.filter((token) => token.centerY > topBoundary && token.centerY <= bottomBoundary);
        const result = extractVectorFormulaFromTokens(slice, false, baseHeight);
        if (result?.latex) parsed.push(result);
      }
      if (parsed.length >= 2) {
        const lines = parsed.map((item, index) => vectorAlignedLine(item.latex, index === 0));
        return {
          latex: `\\begin{aligned} ${lines.join(' \\\\ ')} \\end{aligned}`,
          text: parsed.map((item) => item.text).join(' / '),
          tokenCount: tokens.length,
          multiline: true
        };
      }
    }
  }

  const baseCandidates = tokens.filter((token) => token.height >= baseHeight * 0.68);
  const largeRows = vectorRows(baseCandidates, Math.max(1.8, baseHeight * 0.30));
  const rowScore = (row) => {
    const joined = row.tokens.map((token) => token.text).join(' ');
    const relationBoost = /[=<>≤≥≈≅≠]/.test(joined) ? baseHeight * 6 : 0;
    const operatorBoost = row.tokens.some((token) => vectorLimitOperatorInfo(token)) ? baseHeight * 3.5 : 0;
    const sizeBoost = median(row.tokens.map((token) => token.height)) * row.tokens.length * 0.25;
    return row.width + row.tokens.length * baseHeight * 0.18 + relationBoost + operatorBoost + sizeBoost;
  };
  const mainRow = largeRows.sort((a, b) => rowScore(b) - rowScore(a))[0];
  if (!mainRow) return null;
  const mainCenter = mainRow.centerY;
  const consumed = new Set();
  const overrides = new Map();
  const syntheticAccents = vectorBuildAccentTokens(tokens, mainRow, baseHeight, consumed);

  const allRows = vectorRows(tokens.filter((token) => !mainRow.tokens.includes(token) && !consumed.has(token)), Math.max(1.8, baseHeight * 0.30));
  const usedLimitSegments = new Set();
  const syntheticOperators = [];
  const operatorTokens = tokens.filter((token) => vectorLimitOperatorInfo(token)
    && Math.abs(token.centerY - mainCenter) <= baseHeight * 1.55);
  for (const op of operatorTokens) {
    const info = vectorLimitOperatorInfo(op);
    const lowerSegment = vectorFindLimitSegment(allRows, op, 'lower', baseHeight, usedLimitSegments);
    const upperSegment = vectorFindLimitSegment(allRows, op, 'upper', baseHeight, usedLimitSegments);
    let lowerLatex = '';
    let upperLatex = '';
    if (lowerSegment) {
      usedLimitSegments.add(lowerSegment);
      const lowerTokens = vectorSegmentWithScripts(lowerSegment, tokens, baseHeight, consumed);
      lowerTokens.forEach((token) => consumed.add(token));
      lowerLatex = parseVectorInline(lowerTokens, baseHeight * 0.78);
    }
    if (upperSegment) {
      usedLimitSegments.add(upperSegment);
      const upperTokens = vectorSegmentWithScripts(upperSegment, tokens, baseHeight, consumed);
      upperTokens.forEach((token) => consumed.add(token));
      upperLatex = parseVectorInline(upperTokens, baseHeight * 0.78);
    }
    if (['∫','∬','∭','∮'].includes(info.raw)) {
      const compactLower = lowerLatex.replace(/\s+/g, '');
      if (/^Rn$/.test(compactLower) || /^R\^\{?n\}?$/.test(compactLower)) lowerLatex = '\\mathbb{R}^{n}';
      else if (compactLower === 'R') lowerLatex = '\\mathbb{R}';
    }
    let command = info.latex;
    if ((info.raw === '∪' || info.raw === '∩') && (lowerLatex || upperLatex)) command = info.raw === '∪' ? '\\bigcup' : '\\bigcap';
    if (lowerLatex) command += `_{${lowerLatex}}`;
    if (upperLatex) command += `^{${upperLatex}}`;
    if (mainRow.tokens.includes(op)) {
      if (lowerLatex || upperLatex || vectorOperatorName(info.raw) || ['∫','∬','∭','∮','∑','∏','⋃','⋂'].includes(info.raw)) overrides.set(op, command);
    } else {
      consumed.add(op);
      syntheticOperators.push({
        syntheticLatex: command,
        text: op.text,
        left: op.left,
        right: op.right,
        top: mainCenter - baseHeight / 2,
        bottom: mainCenter + baseHeight / 2,
        width: op.width,
        height: baseHeight,
        centerX: op.centerX,
        centerY: mainCenter
      });
    }
  }

  const reservedMainScripts = tokens.filter((token) => {
    if (mainRow.tokens.includes(token) || consumed.has(token) || token.height >= baseHeight * 0.84) return false;
    return mainRow.tokens.some((base) => token.left >= base.left - baseHeight * 0.10 && token.left <= base.right + baseHeight * 1.0 && Math.abs(token.centerY - base.centerY) <= baseHeight * 1.20);
  });

  const residualRows = vectorRows(tokens.filter((token) => !mainRow.tokens.includes(token) && !consumed.has(token) && !reservedMainScripts.includes(token)), Math.max(1.8, baseHeight * 0.28));
  const upper = [];
  const lower = [];
  for (const row of residualRows) {
    for (const segment of vectorRowSegments(row, baseHeight)) {
      if (segment.centerY < mainCenter - baseHeight * 0.16) upper.push(segment);
      else if (segment.centerY > mainCenter + baseHeight * 0.16) lower.push(segment);
    }
  }
  const usedLower = new Set();
  const syntheticFractions = [];
  for (const numerator of upper) {
    let best = null;
    for (const denominator of lower) {
      if (usedLower.has(denominator)) continue;
      const overlap = Math.max(0, Math.min(numerator.right, denominator.right) - Math.max(numerator.left, denominator.left));
      const minWidth = Math.max(1, Math.min(numerator.width, denominator.width));
      const centerDistance = Math.abs(numerator.centerX - denominator.centerX);
      const aligned = overlap / minWidth >= 0.22 || centerDistance <= Math.max(baseHeight * 0.68, Math.max(numerator.width, denominator.width) * 0.30);
      if (!aligned) continue;
      const verticalDistance = denominator.centerY - numerator.centerY;
      if (verticalDistance <= baseHeight * 0.32 || verticalDistance > baseHeight * 2.45) continue;
      const score = centerDistance + Math.abs(numerator.width - denominator.width) * 0.15 + verticalDistance * 0.08;
      if (!best || score < best.score) best = { denominator, score };
    }
    if (!best) continue;
    usedLower.add(best.denominator);
    const numeratorTokens = vectorSegmentWithScripts(numerator, tokens, baseHeight, consumed);
    const denominatorTokens = vectorSegmentWithScripts(best.denominator, tokens, baseHeight, consumed);
    numeratorTokens.forEach((token) => consumed.add(token));
    denominatorTokens.forEach((token) => consumed.add(token));
    const topLatex = parseVectorInline(numeratorTokens, baseHeight * 0.84);
    const bottomLatex = parseVectorInline(denominatorTokens, baseHeight * 0.84);
    if (!topLatex || !bottomLatex) continue;
    syntheticFractions.push({
      syntheticLatex: `\\frac{${topLatex}}{${bottomLatex}}`,
      text: `${numerator.tokens.map((token) => token.text).join('')}/${best.denominator.tokens.map((token) => token.text).join('')}`,
      left: Math.min(numerator.left, best.denominator.left),
      right: Math.max(numerator.right, best.denominator.right),
      top: numerator.top,
      bottom: best.denominator.bottom,
      width: Math.max(numerator.right, best.denominator.right) - Math.min(numerator.left, best.denominator.left),
      height: baseHeight,
      centerX: (numerator.centerX + best.denominator.centerX) / 2,
      centerY: mainCenter
    });
  }

  const mainTokens = [...mainRow.tokens.filter((token) => !consumed.has(token)), ...syntheticOperators, ...syntheticAccents, ...syntheticFractions];
  const remainingScripts = tokens.filter((token) => !mainRow.tokens.includes(token) && !consumed.has(token));
  let latex = parseVectorInline([...mainTokens, ...remainingScripts], baseHeight, overrides).replace(/\s+/g, ' ').trim();
  latex = latex
    .replace(/\\operatorname\{Ricci\}/g, '\\operatorname{Ric}')
    .replace(/\\operatorname\{Ric\}\s*([_^]\{)/g, '\\operatorname{Ric}$1')
    .replace(/^\\(?:cap|cup)\s+/, '')
    .replace(/\\cdot\s*\\cdot\s*\\cdot/g, '\\cdots')
    .replace(/\\bigcup\s+/g, '\\bigcup ')
    .replace(/\\bigcap\s+/g, '\\bigcap ')
    .replace(/\\(cong|sim)(?=[A-Z])/g, '\\$1 ')
    .replace(/(^|[\s,;)\]}])d(?=[xyztsruvw](?:\b|[),.;]))/g, '$1\\,\\mathrm{d}')
    .replace(/(^|[\s,;)\]}])d(?=\\(?:xi|rho|sigma|mu|nu|omega|theta|phi)\b)/g, '$1\\,\\mathrm{d}');
  const plain = tokens.sort((a, b) => (a.top - b.top) || (a.left - b.left)).map((token) => token.text).join(' ').replace(/\s+/g, ' ').trim();
  if (!latex || !plain) return null;
  const mathSignal = /[=<>≤≥∫∑√∂∇∩∪⋃⋂∞_^]|\\(?:le|ge|cap|cup|bigcup|bigcap|partial|nabla|sqrt|frac|sup|inf|lim|sum|prod|int|iint|iiint|oint|operatorname|lvert|rvert)/.test(latex);
  const compactEnough = tokens.length <= 160 && plain.length <= 520;
  if (!mathSignal && !compactEnough) return null;
  return { latex, text: plain, tokenCount: tokens.length };
}

function extractVectorFormulaFromLayer(ocrLayer, selectionRect) {
  const textLayer = vectorTextLayerForOcrLayer(ocrLayer);
  if (!textLayer || textLayer.dataset.documentOcr === 'true') return null;
  const layerRect = ocrLayer.getBoundingClientRect();
  const selected = {
    left: layerRect.left + selectionRect.left,
    top: layerRect.top + selectionRect.top,
    right: layerRect.left + selectionRect.left + selectionRect.width,
    bottom: layerRect.top + selectionRect.top + selectionRect.height
  };
  let tokens = vectorGlyphTokensFromTextLayer(textLayer, layerRect, selected);
  if (!tokens.length) return null;
  // If PDF.js itself reports an unmapped replacement glyph, vector extraction
  // no longer has enough symbolic information to be trustworthy. Do not turn
  // U+FFFD into plausible-looking LaTeX; let the image fallback handle it.
  if (tokens.some((token) => String(token.text || '').includes('\uFFFD'))) return null;
  const glyphBaseHeight = dominantVectorHeight(tokens) || median(tokens.map((token) => token.height));
  tokens = mergeVectorGlyphWords(tokens, glyphBaseHeight || 12);
  return extractVectorFormulaFromTokens(tokens, true, glyphBaseHeight || 0);
}

function cropSelectedFormula(sourceCanvas, layer, rect) {
  const layerRect = layer.getBoundingClientRect();
  const canvasRect = sourceCanvas.getBoundingClientRect();
  if (!layerRect.width || !layerRect.height || !canvasRect.width || !canvasRect.height) return null;
  const pad = 7;
  const left = Math.max(0, rect.left - pad);
  const top = Math.max(0, rect.top - pad);
  const right = Math.min(layerRect.width, rect.left + rect.width + pad);
  const bottom = Math.min(layerRect.height, rect.top + rect.height + pad);
  const scaleX = sourceCanvas.width / canvasRect.width;
  const scaleY = sourceCanvas.height / canvasRect.height;
  const sx = Math.max(0, Math.round(left * scaleX));
  const sy = Math.max(0, Math.round(top * scaleY));
  const sw = Math.min(sourceCanvas.width - sx, Math.max(1, Math.round((right - left) * scaleX)));
  const sh = Math.min(sourceCanvas.height - sy, Math.max(1, Math.round((bottom - top) * scaleY)));
  const crop = document.createElement('canvas');
  crop.width = sw;
  crop.height = sh;
  const ctx = crop.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, sw, sh);
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return crop;
}


function formulaBackgroundIsDark(canvas) {
  const ctx = canvas?.getContext?.('2d', { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) return false;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const samples = [];
  const stepX = Math.max(1, Math.floor(width / 24));
  const stepY = Math.max(1, Math.floor(height / 12));
  const pushLum = (x, y) => {
    const i = (y * width + x) * 4;
    samples.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
  };
  for (let x = 0; x < width; x += stepX) { pushLum(x, 0); pushLum(x, height - 1); }
  for (let y = 0; y < height; y += stepY) { pushLum(0, y); pushLum(width - 1, y); }
  return median(samples) < 128;
}

function normalizeFormulaPolarity(canvas) {
  if (!canvas || !formulaBackgroundIsDark(canvas)) return canvas;
  const out = document.createElement('canvas');
  out.width = Math.max(1, canvas.width);
  out.height = Math.max(1, canvas.height);
  const src = canvas.getContext('2d', { willReadFrequently: true });
  const dst = out.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!src || !dst) return canvas;
  const image = src.getImageData(0, 0, out.width, out.height);
  const border = [];
  const stepX = Math.max(1, Math.floor(out.width / 24));
  const stepY = Math.max(1, Math.floor(out.height / 12));
  const lumAt = (x, y) => {
    const i = (y * out.width + x) * 4;
    return 0.2126 * image.data[i] + 0.7152 * image.data[i + 1] + 0.0722 * image.data[i + 2];
  };
  for (let x = 0; x < out.width; x += stepX) { border.push(lumAt(x, 0), lumAt(x, out.height - 1)); }
  for (let y = 0; y < out.height; y += stepY) { border.push(lumAt(0, y), lumAt(out.width - 1, y)); }
  const background = Math.max(0, Math.min(180, median(border)));
  const span = Math.max(48, 255 - background);
  for (let i = 0; i < image.data.length; i += 4) {
    const lum = 0.2126 * image.data[i] + 0.7152 * image.data[i + 1] + 0.0722 * image.data[i + 2];
    const signal = Math.max(0, Math.min(1, (lum - background) / span));
    const value = Math.round(255 * (1 - Math.pow(signal, 0.78)));
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  dst.putImageData(image, 0, 0);
  return out;
}

function formulaInkProfiles(canvas) {
  const normalized = normalizeFormulaPolarity(canvas);
  const ctx = normalized?.getContext?.('2d', { willReadFrequently: true });
  if (!ctx || !normalized.width || !normalized.height) return null;
  const { data, width, height } = ctx.getImageData(0, 0, normalized.width, normalized.height);
  const rowInk = new Array(height).fill(0);
  const colInk = new Array(width).fill(0);
  const rowLongestRun = new Array(height).fill(0);
  for (let y = 0; y < height; y += 1) {
    let run = 0;
    let longest = 0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum < 225) {
        rowInk[y] += 1;
        colInk[x] += 1;
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
    rowLongestRun[y] = longest;
  }
  return { canvas: normalized, width, height, rowInk, colInk, rowLongestRun };
}

function formulaHasDominantFractionRule(canvas) {
  const profile = formulaInkProfiles(canvas);
  if (!profile) return false;
  const { width, height, rowInk, rowLongestRun } = profile;
  const strongRuleRows = rowLongestRun
    .map((run, y) => ({ run, y }))
    .filter((item) => item.run >= width * 0.48);
  if (!strongRuleRows.length) return false;
  const ruleY = strongRuleRows[Math.floor(strongRuleRows.length / 2)].y;
  const aboveInk = rowInk.slice(0, Math.max(0, ruleY - 2)).reduce((a, b) => a + b, 0);
  const belowInk = rowInk.slice(Math.min(height, ruleY + 3)).reduce((a, b) => a + b, 0);
  return aboveInk > width * 0.35 && belowInk > width * 0.18;
}

function formulaRowBands(canvas) {
  const profile = formulaInkProfiles(canvas);
  if (!profile || profile.width / Math.max(1, profile.height) < 1.15) return [];
  const { width, height, rowInk, colInk, rowLongestRun } = profile;
  // One dominant long fraction bar with substantial ink both above and below
  // is a single structured quotient, not a multi-row aligned environment.
  // Keeping it intact is critical for Yamabe/Rayleigh quotients.
  if (formulaHasDominantFractionRule(canvas)) return [];

  // Several long, thin horizontal rules at distinct heights are a strong sign
  // of a structured fraction/continued fraction. Treating those rules as row
  // separators caused the fallback OCR to split one formula into nonsense
  // fragments and wrap them in `aligned`. Keep such crops intact.
  const longRuleThreshold = width * 0.28;
  let longRuleGroups = 0;
  let inLongRule = false;
  for (let y = 0; y < height; y += 1) {
    const isLongRule = rowLongestRun[y] >= longRuleThreshold;
    if (isLongRule && !inLongRule) longRuleGroups += 1;
    inLongRule = isLongRule;
  }
  if (longRuleGroups >= 2) return [];

  // Tall braces/matrix delimiters are a strong sign that row-by-row OCR would
  // destroy a single structured object, so keep those crops intact.
  if (colInk.some((count) => count > height * 0.52)) return [];
  const threshold = Math.max(3, Math.round(width * 0.008));
  const raw = [];
  let start = null;
  for (let y = 0; y < height; y += 1) {
    if (rowInk[y] >= threshold && start === null) start = y;
    if ((rowInk[y] < threshold || y === height - 1) && start !== null) {
      const end = rowInk[y] < threshold ? y - 1 : y;
      if (end - start + 1 >= 5) raw.push({ top: start, bottom: end });
      start = null;
    }
  }
  if (raw.length < 2 || raw.length > 6) return [];
  const merged = [];
  for (const band of raw) {
    const prev = merged.at(-1);
    if (prev && band.top - prev.bottom <= Math.max(5, Math.round(height * 0.018))) prev.bottom = band.bottom;
    else merged.push({ ...band });
  }
  if (merged.length < 2 || merged.length > 5) return [];
  // A very wide one-line tensor identity with large \sum/\int limits often
  // appears as three horizontal bands: upper limits, the main baseline, and
  // lower limits. Do not mistake those script bands for separate equation rows.
  const aspect = width / Math.max(1, height);
  if (aspect >= 6.0 && merged.length === 3) {
    const heights = merged.map((band) => band.bottom - band.top + 1);
    const middleDominates = heights[1] >= Math.max(18, heights[0] * 1.8, heights[2] * 1.8);
    if (middleDominates) return [];
  }
  return merged.map((band) => ({ top: Math.max(0, band.top - 5), bottom: Math.min(height - 1, band.bottom + 5) }));
}

function cropCanvasRows(canvas, band) {
  const out = document.createElement('canvas');
  const height = Math.max(1, band.bottom - band.top + 1);
  out.width = canvas.width;
  out.height = height;
  const ctx = out.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, band.top, canvas.width, height, 0, 0, out.width, out.height);
  return out;
}

function looksMultilineLatex(value) {
  return /\\begin\{(?:aligned|array|cases|matrix|pmatrix|bmatrix)\}|\\\\/.test(String(value || ''));
}
function latexVisualRowCount(value) {
  const text = String(value || '');
  const rowBreaks = (text.match(/\\\\/g) || []).length;
  if (/\\begin\{(?:aligned|array|cases|matrix|pmatrix|bmatrix)\}/.test(text)) return Math.max(1, rowBreaks + 1);
  return rowBreaks ? rowBreaks + 1 : 1;
}

function latexHasAlignmentRelation(value) {
  return /(?:&\s*)?(?:=|\\leq?\b|\\geq?\b|\\approx\b|\\sim\b|\\equiv\b|\\to\b|\\Rightarrow\b)/.test(String(value || ''));
}

function latexHasLargeMathOperator(value) {
  return /\\(?:int|iint|iiint|oint|sum|prod|lim|sup|inf|bigcup|bigcap)\b/.test(String(value || ''));
}

function alignedRowsAssessment(lines) {
  const clean = (Array.isArray(lines) ? lines : []).map((line) => String(line || '').trim()).filter(Boolean);
  const reasons = [];
  if (clean.length < 2) reasons.push('too-few-rows');
  const relationCount = clean.filter(latexHasAlignmentRelation).length;
  if (clean.length >= 2 && relationCount < Math.max(2, clean.length - 1)) reasons.push('weak-shared-alignment');
  for (let i = 0; i < clean.length; i += 1) {
    const compact = clean[i].replace(/\s+/g, '');
    // A very short, relation-free fragment between equation rows is usually a
    // decoder artifact (for example `J\\mathbb{R}^{n}` detached from an
    // integral). Reject the rowwise candidate rather than silently deleting
    // mathematics or presenting a fabricated aligned block.
    if (clean.length >= 3 && compact.length <= 22 && !latexHasAlignmentRelation(clean[i]) && !latexHasLargeMathOperator(clean[i])) {
      reasons.push(`orphan-row-${i + 1}`);
    }
  }
  return { ok: reasons.length === 0, reasons, relationCount };
}

function alignedCandidateScore(item, expectedRows = 0) {
  if (!item?.latex) return 10000;
  const assessmentPenalty = (item.assessment?.reasons?.length || 0) * 50;
  const structural = Number(item.penalty || 0);
  const rows = latexVisualRowCount(item.latex);
  let score = structural + assessmentPenalty;
  if (expectedRows >= 2) score += Math.abs(rows - expectedRows) * 10;
  if (/\\begin\{aligned\}/.test(item.latex)) score -= 4;
  const relationCount = (String(item.latex).match(/&\s*(?:=|\\leq?|\\geq?|\\approx|\\sim|\\equiv|\\to|\\Rightarrow)/g) || []).length;
  if (expectedRows >= 2) score -= Math.min(expectedRows, relationCount) * 2;
  return score;
}

function preprocessFormulaCanvas(sourceCanvas, mode = 'normal') {
  if (!sourceCanvas || mode === 'normal') return sourceCanvas;
  const out = document.createElement('canvas');
  out.width = Math.max(1, sourceCanvas.width || 1);
  out.height = Math.max(1, sourceCanvas.height || 1);
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const dstCtx = out.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!srcCtx || !dstCtx) return sourceCanvas;
  dstCtx.fillStyle = '#fff';
  dstCtx.fillRect(0, 0, out.width, out.height);
  const imageData = srcCtx.getImageData(0, 0, out.width, out.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    let value = lum;
    if (mode === 'contrast') {
      if (lum <= 190) value = 0;
      else if (lum >= 248) value = 255;
      else value = Math.max(0, Math.min(255, Math.round(((lum - 190) / 58) * 255)));
    } else if (mode === 'boost') {
      value = lum < 228 ? 0 : 255;
    }
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  dstCtx.putImageData(imageData, 0, 0);
  return out;
}

function latexMathSignature(value) {
  const text = String(value || '');
  const count = (pattern) => (text.match(pattern) || []).length;
  return {
    superscripts: count(/\^/g),
    subscripts: count(/_/g),
    fractions: count(/\\(?:c?frac)\b/g),
    radicals: count(/\\sqrt\b/g),
    integrals: count(/\\(?:int|iint|iiint|oint)\b/g),
    sums: count(/\\(?:sum|prod|bigcup|bigcap)\b/g),
    relations: count(/(?:=|\\leq?\b|\\geq?\b|\\approx\b|\\sim\b|\\equiv\b|\\to\b|\\Rightarrow\b)/g)
  };
}

function latexSignatureDistance(a, b) {
  const left = latexMathSignature(a);
  const right = latexMathSignature(b);
  return Math.abs(left.superscripts - right.superscripts)
    + Math.abs(left.subscripts - right.subscripts)
    + Math.abs(left.fractions - right.fractions) * 2
    + Math.abs(left.radicals - right.radicals) * 2
    + Math.abs(left.integrals - right.integrals) * 3
    + Math.abs(left.sums - right.sums) * 3
    + Math.abs(left.relations - right.relations) * 2;
}

function analyzeFormulaSelection(crop, vectorCandidate = null) {
  const bands = formulaRowBands(crop);
  const aspect = crop?.width && crop?.height ? crop.width / Math.max(1, crop.height) : 1;
  const vectorLatex = String(vectorCandidate?.latex || '');
  const vectorSignature = latexMathSignature(vectorLatex);
  const scriptLoad = vectorSignature.superscripts + vectorSignature.subscripts;
  const operatorLoad = vectorSignature.integrals + vectorSignature.sums + vectorSignature.fractions + vectorSignature.radicals;
  const tensorLike = scriptLoad >= 4 || (aspect >= 4.8 && bands.length <= 1) || (scriptLoad >= 2 && operatorLoad >= 1);
  const fractionLike = formulaHasDominantFractionRule(crop);
  return {
    bands,
    aspect,
    tensorLike,
    fractionLike,
    expectedRows: bands.length >= 2 ? bands.length : 0,
    scriptLoad,
    operatorLoad
  };
}

function imageOcrCandidateScore(candidate, context = {}) {
  if (!candidate?.latex) return 10000;
  let score = alignedCandidateScore(candidate, context.expectedRows || 0);
  const signature = latexMathSignature(candidate.latex);
  if (context.tensorLike) {
    if (signature.superscripts + signature.subscripts < Math.max(2, context.scriptLoad || 0)) score += 12;
  }
  if (context.fractionLike) {
    if (signature.fractions < 1) score += 14;
    else score -= 2;
  }
  if (context.vectorLatex) score += Math.min(24, latexSignatureDistance(candidate.latex, context.vectorLatex) * 1.4);
  if (candidate.preprocess === 'contrast') score -= 0.6;
  if (candidate.variant === 'aligned-rows') score -= 1.2;
  if (candidate.variant === 'wide-tiles') score -= 1.5;
  return score;
}

function vectorCandidateScore(vectorCandidate, context = {}) {
  if (!vectorCandidate?.latex) return 10000;
  const latex = stabilizeOcrLatexSyntax(repairOcrLatex(vectorCandidate.latex));
  const pseudo = {
    latex,
    penalty: latexStructuralPenalty(latex),
    assessment: assessImageOcrResult(latex, latex)
  };
  let score = alignedCandidateScore(pseudo, context.expectedRows || 0);
  if ((vectorCandidate.tokenCount || 0) > 120) score += Math.min(10, ((vectorCandidate.tokenCount || 0) - 120) * 0.08);
  if (context.imageLatex) score += Math.min(18, latexSignatureDistance(latex, context.imageLatex));
  if (context.tensorLike) {
    const signature = latexMathSignature(latex);
    if (signature.superscripts + signature.subscripts >= Math.max(3, context.scriptLoad || 0)) score -= 4;
  }
  return score;
}


function tokenizeLatexForVectorFusion(value) {
  return String(value || '').match(/\\[A-Za-z]+|[A-Za-z]+|\d+|\\.|[{}_^]|[^\s]/g) || [];
}

function vectorFusionLeafKind(token) {
  const value = String(token || '');
  if (/^[A-Za-z]$/.test(value)) return 'latin';
  if (/^\d+$/.test(value)) return 'number';
  if (/^\\(?:alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|ell)$/.test(value)) return 'greek';
  return '';
}

function markLatexScriptLeaves(tokens) {
  const marked = new Array(tokens.length).fill(false);
  const stack = [];
  let pendingScript = false;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '^' || token === '_') {
      pendingScript = true;
      continue;
    }
    if (token === '{') {
      stack.push(pendingScript || (stack.length && stack[stack.length - 1]));
      pendingScript = false;
      continue;
    }
    if (token === '}') {
      stack.pop();
      pendingScript = false;
      continue;
    }
    if (pendingScript) {
      marked[i] = Boolean(vectorFusionLeafKind(token));
      pendingScript = false;
    } else if (stack.length && stack[stack.length - 1] && vectorFusionLeafKind(token)) {
      marked[i] = true;
    }
  }
  return marked;
}

function alignLatexForVectorFusion(ocrTokens, vectorTokens) {
  const n = ocrTokens.length;
  const m = vectorTokens.length;
  if (!n || !m || n > 900 || m > 900) return null;

  const dp = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const move = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
  for (let i = 1; i <= n; i += 1) { dp[i][0] = i * 1.15; move[i][0] = 2; }
  for (let j = 1; j <= m; j += 1) { dp[0][j] = j * 1.15; move[0][j] = 3; }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const a = ocrTokens[i - 1];
      const b = vectorTokens[j - 1];
      const ka = vectorFusionLeafKind(a);
      const kb = vectorFusionLeafKind(b);
      let subst = 0;
      if (a === b) subst = 0;
      else if (ka && kb && ka === kb) subst = 0.35;
      else if (ka && kb) subst = 0.75;
      else subst = 2.4;

      const diag = dp[i - 1][j - 1] + subst;
      const del = dp[i - 1][j] + 1.15;
      const ins = dp[i][j - 1] + 1.15;
      if (diag <= del && diag <= ins) { dp[i][j] = diag; move[i][j] = 1; }
      else if (del <= ins) { dp[i][j] = del; move[i][j] = 2; }
      else { dp[i][j] = ins; move[i][j] = 3; }
    }
  }

  const pairs = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const mv = move[i][j];
    if (i > 0 && j > 0 && mv === 1) {
      pairs.push({ oi: i - 1, vi: j - 1 });
      i -= 1; j -= 1;
    } else if (i > 0 && (mv === 2 || j === 0)) {
      pairs.push({ oi: i - 1, vi: -1 });
      i -= 1;
    } else {
      pairs.push({ oi: -1, vi: j - 1 });
      j -= 1;
    }
  }
  pairs.reverse();
  return { pairs, cost: dp[n][m] };
}

function latexFusionTopology(tokens, scriptLeaves) {
  return tokens.map((token, index) => scriptLeaves[index] ? '<leaf>' : token).join(' ');
}

function fuseTensorOcrWithVector(ocrLatex, vectorLatex, tensorLike) {
  const original = String(ocrLatex || '');
  const vector = stabilizeOcrLatexSyntax(repairOcrLatex(vectorLatex || ''));
  const result = {
    latex: original,
    applied: false,
    replacements: [],
    structuralAgreement: 0,
    reason: '',
  };
  if (!tensorLike) { result.reason = 'not tensor-heavy'; return result; }
  if (!original || !vector) { result.reason = 'missing candidate'; return result; }

  const ocrTokens = tokenizeLatexForVectorFusion(original);
  const vectorTokens = tokenizeLatexForVectorFusion(vector);
  if (!ocrTokens.length || ocrTokens.length !== vectorTokens.length) {
    result.reason = 'token topology differs';
    return result;
  }

  const ocrLeaves = markLatexScriptLeaves(ocrTokens);
  const vectorLeaves = markLatexScriptLeaves(vectorTokens);
  if (ocrLeaves.some((value, index) => value !== vectorLeaves[index])) {
    result.reason = 'script topology differs';
    return result;
  }

  const ocrTopology = latexFusionTopology(ocrTokens, ocrLeaves);
  const vectorTopology = latexFusionTopology(vectorTokens, vectorLeaves);
  if (ocrTopology !== vectorTopology) {
    result.reason = 'structure is not identical';
    return result;
  }
  result.structuralAgreement = 1;

  const replacements = [];
  for (let i = 0; i < ocrTokens.length; i += 1) {
    if (!ocrLeaves[i]) continue;
    const from = ocrTokens[i];
    const to = vectorTokens[i];
    if (from === to) continue;
    const fromKind = vectorFusionLeafKind(from);
    const toKind = vectorFusionLeafKind(to);
    if (!fromKind || !toKind || fromKind !== toKind) {
      result.reason = 'leaf class disagreement';
      return result;
    }

    // Require identical immediate script punctuation around the differing leaf.
    const left1 = ocrTokens[i - 1] || '';
    const left2 = ocrTokens[i - 2] || '';
    const right1 = ocrTokens[i + 1] || '';
    const right2 = ocrTokens[i + 2] || '';
    if (left1 !== vectorTokens[i - 1] || left2 !== vectorTokens[i - 2] ||
        right1 !== vectorTokens[i + 1] || right2 !== vectorTokens[i + 2]) {
      result.reason = 'local context differs';
      return result;
    }
    replacements.push({ oi: i, from, to });
  }

  if (!replacements.length) {
    result.reason = 'no differing script leaves';
    return result;
  }

  // Intentionally accept only a very small correction set. If the PDF
  // vector candidate disagrees with OCR broadly, keep OCR authoritative.
  if (replacements.length > 4) {
    result.reason = `too many leaf disagreements (${replacements.length})`;
    return result;
  }

  // Rebuild only because topology is exactly identical token-for-token.
  const fusedTokens = [...ocrTokens];
  for (const replacement of replacements) fusedTokens[replacement.oi] = replacement.to;
  const fused = stabilizeOcrLatexSyntax(repairOcrLatex(
    fusedTokens.join(' ')
      .replace(/\s+([{}_^,.;:])/g, '$1')
      .replace(/([{}_^])\s+/g, '$1')
      .replace(/\\([A-Za-z]+)\s+\{/g, '\\$1{')
      .replace(/\s+/g, ' ')
      .trim()
  ));

  result.latex = fused;
  result.applied = fused !== original;
  result.replacements = replacements;
  result.reason = result.applied ? 'identical topology; script leaves reconciled' : 'no effective change';
  return result;
}


async function runImageFormulaRecognition(crop, options = {}) {
  const recognitionStart = ocrNow();
  const pipe = await ensureMathOcrPipeline();
  const engineWarmMs = Number.isFinite(Number(mathOcrReadyAt)) ? Math.max(0, ocrNow() - Number(mathOcrReadyAt)) : null;
  mathOcrInferenceRuns += 1;
  const engineRunNumber = mathOcrInferenceRuns;
  const runtimeEnvironment = {
    visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
    hardwareConcurrency: Number.isFinite(Number(navigator?.hardwareConcurrency)) ? Number(navigator.hardwareConcurrency) : null,
    deviceMemoryGb: Number.isFinite(Number(navigator?.deviceMemory)) ? Number(navigator.deviceMemory) : null
  };
  mathOcrLoading = true;
  const passTimings = [];
  let profile;
  const analysisStart = ocrNow();
  try {
    profile = analyzeFormulaSelection(crop, options.vectorCandidate || null);
  } catch (error) {
    console.warn('MathReader OCR layout analysis failed; using safe single-pass defaults.', error);
    profile = {
      bands: [],
      aspect: crop?.width && crop?.height ? crop.width / Math.max(1, crop.height) : 1,
      tensorLike: false,
      fractionLike: false,
      expectedRows: 0,
      scriptLoad: 0,
      operatorLoad: 0
    };
  }
  const analysisMs = ocrNow() - analysisStart;

  async function onePass(sourceCanvas, variant = 'tight', preprocess = 'normal', careful = false) {
    const passStart = ocrNow();
    const timing = { variant, preprocess, careful };
    let stageStart = ocrNow();
    const prepared = normalizeFormulaCropForOcr(sourceCanvas, variant);
    timing.normalizeMs = ocrNow() - stageStart;
    stageStart = ocrNow();
    const processed = preprocessFormulaCanvas(prepared, preprocess);
    timing.preprocessMs = ocrNow() - stageStart;
    stageStart = ocrNow();
    const inputImage = await prepareMathOcrInput(processed);
    timing.inputMs = ocrNow() - stageStart;
    // Stable decoder budget: preserve the v153-era 512-token cap for every
    // formula. Longer caps increased latency without reliably fixing truncation.
    const generation = {
      max_new_tokens: 512,
      num_beams: careful ? 2 : 1,
      early_stopping: Boolean(careful),
      do_sample: false,
      repetition_penalty: 1.04
    };
    stageStart = ocrNow();
    const output = await pipe(inputImage, generation);
    timing.inferenceMs = ocrNow() - stageStart;
    stageStart = ocrNow();
    const raw = Array.isArray(output) ? output[0]?.generated_text : output?.generated_text;
    const rawLatex = normalizeOcrLatex(raw);
    const latex = stabilizeOcrLatexSyntax(repairOcrLatex(rawLatex));
    const penalty = latexStructuralPenalty(rawLatex);
    const assessment = assessImageOcrResult(raw, latex);
    timing.inputWidth = Number(processed?.width || prepared?.width || sourceCanvas?.width || 0);
    timing.inputHeight = Number(processed?.height || prepared?.height || sourceCanvas?.height || 0);
    timing.inputAspect = timing.inputHeight ? timing.inputWidth / timing.inputHeight : null;
    timing.rawChars = String(raw || '').length;
    timing.approxTokens = ocrApproxTokenCount(raw);
    timing.approxTokensPerSecond = ocrRate(timing.approxTokens, timing.inferenceMs);
    timing.charsPerSecond = ocrRate(timing.rawChars, timing.inferenceMs);
    timing.penalty = Number(penalty) || 0;
    timing.hardReject = Boolean(assessment?.hardReject);
    timing.rejectReasons = Array.isArray(assessment?.reasons) ? assessment.reasons.filter(Boolean).join('; ') : '';
    timing.runawaySequence = assessment?.corruption?.repeatedSequence?.sequence || assessment?.corruption?.repeatedFragment?.sequence || assessment?.corruption?.commandLoop?.sequence || '';
    timing.runawayKind = assessment?.corruption?.repeatedSequence?.tensorIndexLike ? 'tensor/index' : (timing.runawaySequence ? 'generic' : '');
    timing.runawayOccurrences = Number(assessment?.corruption?.repeatedSequence?.occurrences || assessment?.corruption?.repeatedFragment?.occurrences || assessment?.corruption?.commandLoop?.occurrences || 0) || 0;
    timing.corruptionScore = imageOcrCorruptionScore({ latex, penalty, assessment });
    timing.postprocessMs = ocrNow() - stageStart;
    timing.totalMs = ocrNow() - passStart;
    passTimings.push(timing);
    return { raw, rawLatex, latex, penalty, assessment, variant, preprocess };
  }

  setOcrStatus(mathOcrBackend?.device === 'wasm'
    ? t('Processing formula · WASM q8…', '正在处理公式 · WASM q8……')
    : t('Recognizing formula locally with Texify…', '正在使用 Texify 本地识别公式……'), true);
  const result = await onePass(crop, 'tight', 'normal', false);

  if (!result.latex) {
    throw new Error(t('The image model returned no LaTeX for this region.', '图像模型没有为该区域返回 LaTeX。'));
  }

  // Keep image OCR single-pass; apply only a post-inference,
  // conservative tensor/vector reconciliation; it never triggers another model call.
  const fusionStart = ocrNow();
  const fusion = fuseTensorOcrWithVector(result.latex, options.vectorCandidate?.latex || '', Boolean(profile.tensorLike));
  let finalResult = fusion.applied
    ? {
        ...result,
        latex: fusion.latex,
        penalty: latexStructuralPenalty(fusion.latex),
        assessment: assessImageOcrResult(fusion.latex, fusion.latex),
        imageOriginalLatex: result.latex,
        vectorFusion: fusion
      }
    : { ...result, vectorFusion: fusion };
  const fusionMs = ocrNow() - fusionStart;

  if (finalResult.assessment?.hardReject) {
    finalResult = {
      ...finalResult,
      assessment: {
        ...finalResult.assessment,
        ok: true,
        retainedForReview: true,
        warnings: [
          t('OCR result needs review', 'OCR 结果需要检查'),
          ...(finalResult.assessment.warnings || []),
          ...(finalResult.assessment.reasons || [])
        ]
      }
    };
  }

  return {
    ...finalResult,
    profile,
    inferenceCount: 1,
    timing: {
      analysisMs,
      firstPassPenalty: result.penalty,
      retryReason: '',
      retryProfile: '',
      retryFailed: false,
      candidateDecision: fusion.applied
        ? `${t('single-pass OCR + vector leaf fusion', '单次 OCR + 矢量叶节点融合')} · ${fusion.replacements.length} ${t('correction(s)', '处修正')}`
        : t('single-pass result retained', '保留单次识别结果'),
      fusionApplied: Boolean(fusion.applied),
      fusionCorrections: fusion.replacements?.length || 0,
      fusionChanges: (fusion.replacements || []).map((item) => `${item.from}→${item.to}`),
      fusionAgreement: fusion.structuralAgreement,
      fusionReason: fusion.reason || '',
      fusionMs,
      passes: passTimings,
      recognitionMs: ocrNow() - recognitionStart,
      engineWarmMs,
      engineRunNumber,
      ...runtimeEnvironment
    }
  };

}

function commitFormulaResult(item, statusMessage = '') {
  currentOcrResult = item;
  ocrHistory = [item, ...ocrHistory.filter((entry) => !(entry.page === item.page && entry.latex === item.latex && entry.source === item.source))].slice(0, 10);
  refreshOcrUI();
  persistDocumentState();
  if (statusMessage) setOcrStatus(statusMessage);
}

async function recognizeMathCrop(crop, page, kind, ocrLayer = null, selectionRect = null, diagnosticsMeta = {}) {
  if (!crop || !page) return;
  const endToEndStart = Number.isFinite(Number(diagnosticsMeta.startedAt)) ? Number(diagnosticsMeta.startedAt) : ocrNow();
  setOcrMode(false);
  const preview = crop.toDataURL('image/png');
  const vector = ocrLayer && selectionRect ? extractVectorFormulaFromLayer(ocrLayer, selectionRect) : null;
  const selectionRatio = selectionRect && ocrLayer
    ? Math.min(1, Math.max(0, (Number(selectionRect.top || 0) + Number(selectionRect.height || 0) / 2) / Math.max(1, Number(ocrLayer.offsetHeight || ocrLayer.getBoundingClientRect?.().height || 1))))
    : null;

  if (formulaExtractionMode === 'vector' && vector?.latex) {
    commitFormulaResult(
      { page, kind, ratio: selectionRatio, latex: stabilizeOcrLatexSyntax(repairOcrLatex(vector.latex)), preview, created: Date.now(), quality: 'vector', source: 'vector', extractedText: vector.text },
      t('Formula extracted from embedded PDF text and glyph geometry.', '已依据 PDF 原生文本与字形几何提取公式。')
    );
    return;
  }

  mathOcrLoading = true;
  let recognitionFailed = false;
  setOcrProcessing(true);
  setOcrStatus(mathOcrBackend?.device === 'wasm'
    ? t('Processing formula · WASM q8…', '正在处理公式 · WASM q8……')
    : t('Processing formula…', '正在处理公式……'), true);
  await yieldForOcrProgressPaint();
  try {
    const result = await runImageFormulaRecognition(crop, { vectorCandidate: vector });
    const item = {
      page,
      kind,
      ratio: selectionRatio,
      latex: result.latex,
      preview,
      created: Date.now(),
      quality: result.penalty === 0 && !(result.assessment?.warnings?.length) ? 'clean' : 'review',
      source: 'image',
      imageOriginalLatex: result.imageOriginalLatex || null,
      vectorFusionApplied: Boolean(result.vectorFusion?.applied),
      vectorFusionCorrections: result.vectorFusion?.replacements || [],
      vectorAlternative: vector?.latex || null,
      vectorAlternativeText: vector?.text || null
    };
    const commitStart = ocrNow();
    commitFormulaResult(item, result.assessment?.retainedForReview
      ? t('Image OCR returned uncertain LaTeX · kept for review instead of replacing it with PDF vector.', '图像 OCR 返回不确定的 LaTeX · 已保留供核对，不再自动替换为 PDF 矢量结果。')
      : (result.penalty === 0 && !(result.assessment?.warnings?.length)
        ? t('Local image OCR complete · structure check passed.', '本地图像 OCR 完成 · 结构检查通过。')
        : t('Local image OCR complete · review the editable LaTeX before reuse.', '本地图像 OCR 完成 · 复用前请核对可编辑 LaTeX。')));
    const commitMs = ocrNow() - commitStart;
    lastOcrRunTiming = {
      backend: mathOcrBackend?.label || '—',
      inferenceCount: result.inferenceCount || result.timing?.passes?.length || 1,
      cropSize: `${crop.width || 0}×${crop.height || 0}`,
      outputChars: String(result.latex || '').length,
      outputApproxTokens: ocrApproxTokenCount(result.latex),
      cropAspect: crop?.height ? (Number(crop.width || 0) / Number(crop.height || 1)) : null,
      backendDetail: `${mathOcrBackend?.label || '—'}${mathOcrBackend?.device ? ` · device=${mathOcrBackend.device}` : ''}${mathOcrBackend?.dtype ? ` · dtype=${mathOcrBackend.dtype}` : ''}`,
      cropMs: Number.isFinite(Number(diagnosticsMeta.cropMs)) ? Number(diagnosticsMeta.cropMs) : null,
      analysisMs: result.timing?.analysisMs,
      firstPassPenalty: result.timing?.firstPassPenalty,
      retryReason: result.timing?.retryReason || '',
      retryProfile: result.timing?.retryProfile || '',
      fusionApplied: Boolean(result.timing?.fusionApplied),
      fusionCorrections: Number(result.timing?.fusionCorrections || 0),
      fusionChanges: Array.isArray(result.timing?.fusionChanges) ? result.timing.fusionChanges : [],
      fusionAgreement: Number.isFinite(Number(result.timing?.fusionAgreement)) ? Number(result.timing.fusionAgreement) : null,
      fusionReason: result.timing?.fusionReason || '',
      fusionMs: result.timing?.fusionMs,
      engineWarmMs: result.timing?.engineWarmMs,
      engineRunNumber: result.timing?.engineRunNumber,
      visibilityState: result.timing?.visibilityState || 'unknown',
      hardwareConcurrency: result.timing?.hardwareConcurrency,
      deviceMemoryGb: result.timing?.deviceMemoryGb,
      passes: result.timing?.passes || [],
      commitMs,
      recognitionMs: result.timing?.recognitionMs,
      totalMs: ocrNow() - endToEndStart
    };
    logOcrTiming({ type: 'recognition', ...lastOcrRunTiming });
  } catch (error) {
    recognitionFailed = true;
    console.error(error);
    // Do not silently replace Image OCR with PDF vector. Vector reconstruction
    // can be badly corrupted by PDF font encodings even for simple formulas.
    // Keep it available only through the explicit "Try PDF Vector" action.
    const detail = detailedOcrError(error, mathOcrBackend);
    setOcrStatus(vector?.latex
      ? `${detail} · ${t('PDF vector is available manually.', '可手动尝试 PDF 矢量结果。')}`
      : detail);
    showError(detail);
  } finally {
    mathOcrLoading = false;
    setOcrProcessing(false);
    if (recognitionFailed) {
      await disposeMathOcrPipeline();
      updateOcrInteractionAvailability();
      scheduleMathOcrPreload();
    } else {
      updateOcrInteractionAvailability();
    }
  }
}


async function canvasFromDataUrl(dataUrl) {
  if (!dataUrl) return null;
  const image = new Image();
  image.decoding = 'async';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, image.naturalWidth || image.width || 1);
  canvas.height = Math.max(1, image.naturalHeight || image.height || 1);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  return canvas;
}

async function recognizeImageFallbackCrop(crop, page, kind, preview = null, vectorAlternative = null, vectorAlternativeText = null, ratio = null, diagnosticsMeta = {}) {
  if (!crop || !page) return;
  const endToEndStart = Number.isFinite(Number(diagnosticsMeta.startedAt)) ? Number(diagnosticsMeta.startedAt) : ocrNow();
  mathOcrLoading = true;
  let recognitionFailed = false;
  const imagePreview = preview || crop.toDataURL('image/png');
  setOcrProcessing(true);
  try {
    const result = await runImageFormulaRecognition(crop);
    const item = {
      page,
      kind,
      ratio: Number.isFinite(Number(ratio)) ? Math.min(1, Math.max(0, Number(ratio))) : null,
      latex: result.latex,
      preview: imagePreview,
      created: Date.now(),
      quality: result.penalty === 0 ? 'clean' : 'review',
      source: 'image',
      vectorAlternative,
      vectorAlternativeText
    };
    const commitStart = ocrNow();
    commitFormulaResult(item, result.penalty === 0
      ? t('Image OCR comparison complete.', '图像 OCR 对照完成。')
      : t('Image OCR comparison complete · review the editable LaTeX.', '图像 OCR 对照完成 · 请核对可编辑 LaTeX。'));
    const commitMs = ocrNow() - commitStart;
    lastOcrRunTiming = {
      backend: mathOcrBackend?.label || '—',
      inferenceCount: result.inferenceCount || result.timing?.passes?.length || 1,
      cropSize: `${crop.width || 0}×${crop.height || 0}`,
      outputChars: String(result.latex || '').length,
      outputApproxTokens: ocrApproxTokenCount(result.latex),
      cropAspect: crop?.height ? (Number(crop.width || 0) / Number(crop.height || 1)) : null,
      backendDetail: `${mathOcrBackend?.label || '—'}${mathOcrBackend?.device ? ` · device=${mathOcrBackend.device}` : ''}${mathOcrBackend?.dtype ? ` · dtype=${mathOcrBackend.dtype}` : ''}`,
      cropMs: Number.isFinite(Number(diagnosticsMeta.cropMs)) ? Number(diagnosticsMeta.cropMs) : null,
      analysisMs: result.timing?.analysisMs,
      firstPassPenalty: result.timing?.firstPassPenalty,
      retryReason: result.timing?.retryReason || '',
      retryProfile: result.timing?.retryProfile || '',
      fusionApplied: Boolean(result.timing?.fusionApplied),
      fusionCorrections: Number(result.timing?.fusionCorrections || 0),
      fusionChanges: Array.isArray(result.timing?.fusionChanges) ? result.timing.fusionChanges : [],
      fusionAgreement: Number.isFinite(Number(result.timing?.fusionAgreement)) ? Number(result.timing.fusionAgreement) : null,
      fusionReason: result.timing?.fusionReason || '',
      fusionMs: result.timing?.fusionMs,
      engineWarmMs: result.timing?.engineWarmMs,
      engineRunNumber: result.timing?.engineRunNumber,
      visibilityState: result.timing?.visibilityState || 'unknown',
      hardwareConcurrency: result.timing?.hardwareConcurrency,
      deviceMemoryGb: result.timing?.deviceMemoryGb,
      passes: result.timing?.passes || [],
      commitMs,
      recognitionMs: result.timing?.recognitionMs,
      totalMs: ocrNow() - endToEndStart
    };
    logOcrTiming({ type: 'recognition', comparison: true, ...lastOcrRunTiming });
  } catch (error) {
    recognitionFailed = true;
    console.error(error);
    const detail = detailedOcrError(error, mathOcrBackend);
    setOcrStatus(detail);
    showError(detail);
  } finally {
    mathOcrLoading = false;
    setOcrProcessing(false);
    if (recognitionFailed) {
      await disposeMathOcrPipeline();
      updateOcrInteractionAvailability();
      scheduleMathOcrPreload();
    } else {
      updateOcrInteractionAvailability();
    }
  }
}

async function tryImageOcrForCurrentResult() {
  if (!currentOcrResult?.preview || mathOcrLoading) return;
  try {
    const prepStart = ocrNow();
    const crop = await canvasFromDataUrl(currentOcrResult.preview);
    const cropMs = ocrNow() - prepStart;
    await recognizeImageFallbackCrop(
      crop,
      Number(currentOcrResult.page) || currentPage,
      currentOcrResult.kind || 'primary',
      currentOcrResult.preview,
      currentOcrResult.vectorAlternative || null,
      currentOcrResult.vectorAlternativeText || null,
      currentOcrResult.ratio,
      { startedAt: prepStart, cropMs }
    );
  } catch (error) {
    console.error(error);
    showError(t('The selected formula image could not be prepared for image OCR.', '无法为图像 OCR 准备当前框选公式。'));
  }
}

function addOcrToPageNote() {
  if (!pdfDoc || !currentOcrResult?.latex) return;
  // Save to the OCR result's own page. Do not move the reader just because a
  // note was added from a result that originated on another page.
  const targetPage = Math.min(Math.max(1, Number(currentOcrResult.page) || Number(currentPage) || 1), pdfDoc.numPages);
  const block = `${t('Math OCR', '公式 OCR')} · ${t(`Page ${targetPage}`, `第 ${targetPage} 页`)}\n\\[\n${currentOcrResult.latex}\n\\]`;
  const existing = notes[String(targetPage)] || '';
  notes[String(targetPage)] = `${existing}${existing.trim() ? '\n\n' : ''}${block}`;
  refreshVisiblePageNote(targetPage);
  persistDocumentState();
  autoOpenRightSection('note-section');
  setOcrStatus(t(`Added to page ${targetPage} note.`, `已添加到第 ${targetPage} 页注。`));
}

function clearOcrResultState() {
  if (currentOcrResult) pushUndo('ocr-result', t('Formula OCR result', '公式 OCR 结果'), currentOcrResult);
  currentOcrResult = null;
  refreshOcrUI();
  persistDocumentState();
}

function ocrPoint(event, layer) {
  const rect = layer.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
  };
}

function updateOcrSelectionBox(layer, start, current) {
  const box = layer.querySelector('.ocr-selection-box');
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
  return { left, top, width, height };
}

function bindOcrLayer(layer) {
  if (!layer || layer.dataset.boundOcr === '1') return;
  layer.dataset.boundOcr = '1';
  layer.addEventListener('pointerdown', (event) => {
    if (!ocrMode || mathOcrLoading) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    autoOpenRightSection('ocr-section');
    setOcrStatus(t('Selecting formula…', '正在框选公式……'));
    const start = ocrPoint(event, layer);
    ocrDrag = { layer, start, rect: { left: start.x, top: start.y, width: 0, height: 0 }, pointerId: event.pointerId };
    layer.classList.add('is-selecting');
    try { layer.setPointerCapture(event.pointerId); } catch (_) {}
  });
  layer.addEventListener('pointermove', (event) => {
    if (!ocrDrag || ocrDrag.layer !== layer || event.pointerId !== ocrDrag.pointerId) return;
    event.preventDefault();
    ocrDrag.rect = updateOcrSelectionBox(layer, ocrDrag.start, ocrPoint(event, layer));
  });
  const finish = (event, cancelled = false) => {
    if (!ocrDrag || ocrDrag.layer !== layer || event.pointerId !== ocrDrag.pointerId) return;
    event.preventDefault();
    const drag = ocrDrag;
    ocrDrag = null;
    try { layer.releasePointerCapture(event.pointerId); } catch (_) {}
    layer.classList.remove('is-selecting');
    if (cancelled || drag.rect.width < 12 || drag.rect.height < 8) {
      resetOcrBoxes();
      setOcrStatus(t('Selection cancelled. Drag a larger rectangle around a formula.', '已取消框选。请在公式周围拖出更大的矩形框。'));
      return;
    }
    const kind = layer.dataset.kind || 'primary';
    const page = Number(layer.dataset.page || (kind === 'reference' ? pinnedPage : currentPage));
    const sourceCanvas = kind === 'reference' ? referenceCanvas : kind === 'continuous' ? layer.closest('.continuous-page-surface')?.querySelector('canvas') : canvas;
    const startedAt = ocrNow();
    const crop = cropSelectedFormula(sourceCanvas, layer, drag.rect);
    const cropMs = ocrNow() - startedAt;
    resetOcrBoxes();
    recognizeMathCrop(crop, page, kind, layer, drag.rect, { startedAt, cropMs });
  };
  layer.addEventListener('pointerup', (event) => finish(event, false));
  layer.addEventListener('pointercancel', (event) => finish(event, true));
}

