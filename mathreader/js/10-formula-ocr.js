// MathReader v306 · Formula OCR engine, LaTeX repair, and OCR diagnostics.
function ocrNow() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

function ocrMs(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)} ms` : '—';
}


function ocrApproxTokenCount(text) {
  const value = String(text || '');
  if (!value) return 0;
  // Diagnostic fallback only. Transformers.js image-to-text does not expose
  // generated token ids in this pipeline result, so keep this explicitly approximate.
  return Math.max(1, Math.round(value.length / 2.7));
}

function ocrRate(value, ms) {
  const n = Number(value);
  const tms = Number(ms);
  return Number.isFinite(n) && Number.isFinite(tms) && tms > 0 ? n / (tms / 1000) : null;
}

function ocrLikelyBottleneck(report) {
  const passes = Array.isArray(report?.passes) ? report.passes : [];
  const totalInference = passes.reduce((sum, pass) => sum + (Number(pass.inferenceMs) || 0), 0);
  const total = Number(report?.totalMs) || Number(report?.recognitionMs) || 0;
  const share = total > 0 ? totalInference / total : 0;
  if (share >= 0.95 && passes.length) {
    const slowest = passes.slice().sort((a, b) => (Number(b.inferenceMs) || 0) - (Number(a.inferenceMs) || 0))[0];
    const tokRate = Number(slowest?.approxTokensPerSecond);
    const charRate = Number(slowest?.charsPerSecond);
    if (Number.isFinite(tokRate)) return `${t('model inference dominates', '模型推理占主导')} (${(share * 100).toFixed(1)}%) · ${t('slowest pass', '最慢一轮')} ~${tokRate.toFixed(2)} ${t('estimated tok/s', '估算 token/秒')}`;
    if (Number.isFinite(charRate)) return `${t('model inference dominates', '模型推理占主导')} (${(share * 100).toFixed(1)}%) · ${t('slowest pass', '最慢一轮')} ~${charRate.toFixed(2)} ${t('chars/s', '字符/秒')}`;
    return `${t('model inference dominates', '模型推理占主导')} (${(share * 100).toFixed(1)}%)`;
  }
  if (Number(report?.engineWarmMs) < 2000 && totalInference > 10000) return t('inference is slow immediately after engine load', '引擎加载后立即推理较慢');
  return t('no single non-inference stage dominates', '没有单一非推理阶段占主导');
}

function renderOcrTimingDiagnostics() {
  if (!ocrTimingDiagnostics) return;
  const lines = [];
  if (lastOcrRunTiming) {
    const r = lastOcrRunTiming;
    lines.push(`${t('Last run', '最近一次')} · ${r.backend || '—'} · ${r.inferenceCount || 0} ${t('pass(es)', '次推理')}`);
    if (r.cropSize) lines.push(`  ${t('Crop size', '裁图尺寸')}: ${r.cropSize}${Number.isFinite(r.cropAspect) ? ` · ${t('aspect', '宽高比')} ${r.cropAspect.toFixed(2)}:1` : ''}`);
    if (Number.isFinite(r.outputChars)) lines.push(`  ${t('Final LaTeX', '最终 LaTeX')}: ${r.outputChars} ${t('chars', '字符')} · ~${r.outputApproxTokens || 0} ${t('tokens estimated', '估算 token')}`);
    if (r.backendDetail) lines.push(`  ${t('Backend', '后端')}: ${r.backendDetail}`);
    if (Number.isFinite(r.engineWarmMs)) lines.push(`  ${t('Engine warm time before run', '本次运行前引擎已就绪')}: ${ocrMs(r.engineWarmMs)}`);
    if (Number.isFinite(r.engineRunNumber)) lines.push(`  ${t('Inference run since load', '本次加载后的推理序号')}: #${r.engineRunNumber}`);
    lines.push(`  ${t('Page visibility', '页面可见性')}: ${r.visibilityState || '—'}`);
    if (Number.isFinite(r.hardwareConcurrency)) lines.push(`  ${t('Logical CPU threads', '逻辑 CPU 线程')}: ${r.hardwareConcurrency}`);
    if (Number.isFinite(r.deviceMemoryGb)) lines.push(`  ${t('Reported device memory', '报告的设备内存')}: ${r.deviceMemoryGb} GB`);
    if (Number.isFinite(r.cropMs)) lines.push(`  ${t('Crop', '裁图')}: ${ocrMs(r.cropMs)}`);
    if (Number.isFinite(r.analysisMs)) lines.push(`  ${t('Analysis', '分析')}: ${ocrMs(r.analysisMs)}`);
    if (Number.isFinite(r.firstPassPenalty)) lines.push(`  ${t('First-pass structural penalty', '首轮结构惩罚')}: ${Number(r.firstPassPenalty).toFixed(1)}`);
    if (r.retryReason) lines.push(`  ${t('Retry reason', '重试原因')}: ${r.retryReason}`);
    if (r.retryProfile) lines.push(`  ${t('Retry profile', '重试方案')}: ${r.retryProfile}`);
    if (r.retryFailed) lines.push(`  ${t('Retry outcome', '重试结果')}: ${t('failed quality gate', '未通过质量门槛')}`);
    if (r.candidateDecision) lines.push(`  ${t('Candidate choice', '候选选择')}: ${r.candidateDecision}`);
    if (Number.isFinite(r.fusionAgreement)) lines.push(`  ${t('OCR/vector structural agreement', 'OCR/矢量结构一致度')}: ${(r.fusionAgreement * 100).toFixed(1)}%`);
    if (r.fusionApplied) {
      lines.push(`  ${t('Vector leaf fusion', '矢量叶节点融合')}: ${r.fusionCorrections} ${t('correction(s)', '处修正')} · ${ocrMs(r.fusionMs)}`);
      if (Array.isArray(r.fusionChanges) && r.fusionChanges.length) lines.push(`    ${t('Changes', '修改')}: ${r.fusionChanges.join(' · ')}`);
    } else if (r.fusionReason) {
      lines.push(`  ${t('Vector leaf fusion', '矢量叶节点融合')}: ${t('not applied', '未应用')} · ${r.fusionReason}`);
    }
    (r.passes || []).forEach((pass, index) => {
      lines.push(`  ${t('Pass', '第')} ${index + 1}${t('', ' 次')} · ${pass.variant}/${pass.preprocess}${pass.careful ? ' · beam 2' : ' · beam 1'}`);
      if (Number.isFinite(pass.inputWidth) && Number.isFinite(pass.inputHeight)) lines.push(`    ${t('Model input', '模型输入')}: ${pass.inputWidth}×${pass.inputHeight}${Number.isFinite(pass.inputAspect) ? ` · ${t('aspect', '宽高比')} ${pass.inputAspect.toFixed(2)}:1` : ''}`);
      lines.push(`    ${t('Generation config', '生成配置')}: max_new_tokens=512 · num_beams=${pass.careful ? 2 : 1} · early_stopping=${pass.careful ? 'true' : 'false'}`);
      lines.push(`    ${t('Normalize crop', '裁图归一化')}: ${ocrMs(pass.normalizeMs)}`);
      lines.push(`    ${t('Preprocess', '预处理')}: ${ocrMs(pass.preprocessMs)}`);
      lines.push(`    ${t('Canvas → image', '画布 → 图像')}: ${ocrMs(pass.inputMs)}`);
      lines.push(`    ${t('Inference', '推理')}: ${ocrMs(pass.inferenceMs)}`);
      if (Number.isFinite(pass.rawChars)) lines.push(`    ${t('Raw output', '原始输出')}: ${pass.rawChars} ${t('chars', '字符')} · ~${pass.approxTokens || 0} ${t('tokens estimated', '估算 token')}`);
      if (Number.isFinite(pass.approxTokensPerSecond)) lines.push(`    ${t('Estimated throughput', '估算吞吐')}: ${pass.approxTokensPerSecond.toFixed(2)} tok/s · ${pass.charsPerSecond.toFixed(2)} chars/s`);
      lines.push(`    ${t('First-token latency', '首 token 延迟')}: ${t('not exposed by runtime', '运行时未提供')}`);
      lines.push(`    ${t('Generated token count', '实际生成 token 数')}: ${t('not exposed by runtime', '运行时未提供')}`);
      lines.push(`    ${t('Hit 512-token cap', '是否达到 512-token 上限')}: ${t('unknown (token ids not exposed)', '未知（运行时未提供 token id）')}`);
      if (Number.isFinite(pass.penalty)) lines.push(`    ${t('Structural penalty', '结构惩罚')}: ${pass.penalty.toFixed(1)}`);
      if (pass.hardReject) lines.push(`    ${t('Hard reject', '硬拒绝')}: ${t('yes', '是')}${pass.rejectReasons ? ` · ${pass.rejectReasons}` : ''}`);
      else lines.push(`    ${t('Hard reject', '硬拒绝')}: ${t('no', '否')}`);
      if (pass.runawaySequence) {
        if (pass.runawayKind === 'tensor/index') {
          lines.push(`    ${t('Tensor/index repetition', '张量/指标重复')}: ${t('allowed', '允许')} · “${String(pass.runawaySequence).slice(0, 180)}”${pass.runawayOccurrences ? ` ×${pass.runawayOccurrences}` : ''}`);
        } else {
          lines.push(`    ${t('Runaway sequence', '失控序列')}: ${pass.runawayKind || 'generic'} · “${String(pass.runawaySequence).slice(0, 180)}”${pass.runawayOccurrences ? ` ×${pass.runawayOccurrences}` : ''}`);
        }
      }
      if (Number.isFinite(pass.corruptionScore)) lines.push(`    ${t('Corruption score', '损坏评分')}: ${pass.corruptionScore.toFixed(1)} ${t('(lower is better)', '（越低越好）')}`);
      lines.push(`    ${t('LaTeX cleanup/check', 'LaTeX 清理/检查')}: ${ocrMs(pass.postprocessMs)}`);
      lines.push(`    ${t('Pass total', '本次合计')}: ${ocrMs(pass.totalMs)}`);
    });
    if (Number.isFinite(r.commitMs)) lines.push(`  ${t('UI commit', '界面更新')}: ${ocrMs(r.commitMs)}`);
    lines.push(`  ${t('Recognition total', '识别合计')}: ${ocrMs(r.recognitionMs)}`);
    const inferenceTotal = (r.passes || []).reduce((sum, pass) => sum + (Number(pass.inferenceMs) || 0), 0);
    if (Number.isFinite(r.totalMs) && r.totalMs > 0) lines.push(`  ${t('Inference share', '推理占比')}: ${(inferenceTotal / r.totalMs * 100).toFixed(1)}%`);
    lines.push(`  ${t('End-to-end', '端到端')}: ${ocrMs(r.totalMs)}`);
    lines.push(`  ${t('Likely bottleneck', '可能瓶颈')}: ${ocrLikelyBottleneck(r)}`);
  }
  if (lastOcrEngineTiming) {
    const e = lastOcrEngineTiming;
    if (lines.length) lines.push('');
    lines.push(`${t('Engine load', '引擎加载')} · ${e.backend || '—'}`);
    if (e.backendDetail) lines.push(`  ${t('Backend', '后端')}: ${e.backendDetail}`);
    lines.push(`  ${t('Runtime import', '运行时导入')}: ${ocrMs(e.importMs)}`);
    lines.push(`  ${t('Pipeline/model init', '模型初始化')}: ${ocrMs(e.pipelineMs)}`);
    lines.push(`  ${t('Load total', '加载合计')}: ${ocrMs(e.totalMs)}`);
  }
  if (!lines.length) lines.push(ocrTimingDiagnostics.dataset[root.dataset.lang === 'zh' ? 'zhEmpty' : 'enEmpty'] || t('No OCR run yet.', '尚无 OCR 运行记录。'));
  ocrTimingDiagnostics.textContent = lines.join('\n');
}

function logOcrTiming(report) {
  try { console.info('MathReader OCR timing', report); } catch (_) {}
  renderOcrTimingDiagnostics();
}

function setOcrStatus(message, working = false) {
  if (!ocrStatus) return;
  ocrStatus.textContent = message;
  ocrStatus.classList.toggle('is-working', working);
}

function setOcrProcessing(active) {
  if (!ocrProcessing) return;
  if (active) {
    // Formula extraction has one authoritative busy indicator: the right
    // workspace. Reopen it for every OCR invocation so returning to the tab,
    // a previously collapsed sidebar, or a collapsed section cannot hide the
    // next processing state.
    autoOpenRightSection('ocr-section');
    ocrProcessing.classList.remove('is-hidden');
    if (ocrProcessingText) ocrProcessingText.textContent = t('Processing…', '处理中…');
  } else {
    ocrProcessing.classList.add('is-hidden');
  }
}

async function yieldForOcrProgressPaint() {
  // WASM inference can occupy the main thread for long stretches. Give the
  // browser two animation frames before inference so the processing text and
  // panel state are actually painted instead of appearing frozen.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}


function latexLineSeparator() { return ' ' + String.fromCharCode(92, 92, 10); }

function normalizeOcrLatex(value) {
  let text = String(value || '').trim();
  if (!text) return '';
  text = text
    .replace(/<\/?s>/gi, '')
    .replace(/<pad>/gi, '')
    .replace(/```(?:latex|tex|math|markdown)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  // Texify may emit several explicit math blocks for a multi-line aligned
  // selection. Preserve all blocks in source order instead of discarding all
  // but the longest one (the old behavior that lost later lines).
  const matches = [];
  const patterns = [
    { re: /\\\[([\s\S]*?)\\\]/g, inner: 1 },
    { re: /\$\$([\s\S]*?)\$\$/g, inner: 1 },
    { re: /\\\(([\s\S]*?)\\\)/g, inner: 1 },
    { re: /(?<!\$)\$([^$\n]+?)\$(?!\$)/g, inner: 1 }
  ];
  for (const { re, inner } of patterns) {
    for (const m of text.matchAll(re)) matches.push({ index: m.index ?? 0, value: String(m[inner] || '').trim() });
  }
  matches.sort((a, b) => a.index - b.index);
  const blocks = matches.map((m) => m.value).filter(Boolean);
  if (blocks.length === 1) text = blocks[0];
  else if (blocks.length > 1) {
    let clean = blocks.filter((block, index) => index === 0 || block !== blocks[index - 1]);

    // Texify occasionally emits a good main formula surrounded by tiny stray
    // math blocks (for example a lone \blacksquare or an index fragment).
    // When there are at least three explicit blocks and one block clearly
    // dominates the others, keep that dominant block instead of fabricating
    // an aligned environment from unrelated fragments. Two-block output is
    // intentionally left untouched because it can be a genuine two-line
    // formula.
    if (clean.length >= 3) {
      const ranked = clean
        .map((block, index) => ({ block, index, length: block.replace(/\s+/g, '').length }))
        .sort((a, b) => b.length - a.length);
      const first = ranked[0];
      const second = ranked[1];
      const looksSubstantive = (block) => {
        const compact = String(block || '').replace(/\s+/g, '');
        if (!compact) return false;
        if (/[=<>_^]/.test(compact)) return true;
        if (/\\(?:frac|int|iint|iiint|oint|sum|prod|sqrt|left|right|nabla|partial|operatorname|mathbb|mathrm|mathbf|mathcal)\b/.test(compact)) return true;
        if (/\\(?:leq?|geq?|lesssim|gtrsim|sim|simeq|approx|equiv|neq?|to|rightarrow|leftarrow|leftrightarrow|longrightarrow|longleftarrow|longleftrightarrow|Rightarrow|Leftarrow|Leftrightarrow)\b/.test(compact)) return true;
        return compact.length > 10;
      };
      const remainderIsTinyNoise = ranked.slice(1).every((item) => item.length <= 10 && !looksSubstantive(item.block));
      if (first.length >= 72 && first.length >= Math.max(2.6 * second.length, second.length + 48) && remainderIsTinyNoise) {
        clean = [first.block];
      }
    }

    if (clean.length === 1) text = clean[0];
    else if (clean.some((block) => /\\begin\{(?:aligned|array|cases|matrix|pmatrix|bmatrix)\}/.test(block))) {
      text = clean.join(' \\\\ ');
    } else {
      text = `\\begin{aligned}\n${clean.map(markAlignmentRelation).join(latexLineSeparator())}\n\\end{aligned}`;
    }
  }

  if (text.startsWith('$$') && text.endsWith('$$') && text.length > 4) text = text.slice(2, -2).trim();
  if (text.startsWith('\\[') && text.endsWith('\\]') && text.length > 4) text = text.slice(2, -2).trim();
  if (text.startsWith('$') && text.endsWith('$') && !text.startsWith('$$') && text.length > 2) text = text.slice(1, -1).trim();
  return text;
}

function markAlignmentRelation(line) {
  return alignLineByPattern(line, 'relation');
}
function unwrapOcrFormattingEnvelope(value) {
  let text = String(value || '').trim();
  if (!text) return '';
  const envMatch = text.match(/^\\begin\{(aligned|split|gathered|gather|array)\}([\s\S]*?)\\end\{\1\}$/);
  if (!envMatch) return text;
  const env = envMatch[1];
  let inner = String(envMatch[2] || '').trim();
  if (env === 'array') {
    inner = inner.replace(/^\{[^}]*\}/, '').trim();
    // Texify commonly represents aligned equations as a three-column array:
    // lhs & relation & rhs, followed by empty & empty & continuation rows.
    // Preserve that semantic structure before the generic formatter removes
    // alignment markers.
    const arrayRows = splitOcrLatexRows(inner);
    inner = arrayRows.map(normalizeOcrArrayFormattingRow).join(latexLineSeparator());
  }
  return inner;
}

function splitTopLevelOcrAlignmentCells(value) {
  const text = String(value || '');
  const cells = [];
  let current = '';
  let braceDepth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      current += ch + text[i + 1];
      i += 1;
      continue;
    }
    if (ch === '{') braceDepth += 1;
    else if (ch === '}' && braceDepth > 0) braceDepth -= 1;
    if (ch === '&' && braceDepth === 0) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeOcrArrayFormattingRow(value) {
  const cells = splitTopLevelOcrAlignmentCells(value);
  if (cells.length !== 3) return String(value || '').trim();
  const [leftRaw, middleRaw, rightRaw] = cells;
  const left = stripRedundantOuterBraces(leftRaw);
  const middle = stripRedundantOuterBraces(middleRaw);
  const right = stripRedundantOuterBraces(rightRaw);
  const relation = /^(?:=|<=|>=|<|>|\\(?:leq|le|geq|ge|neq|ne|approx|sim|equiv|to|iff|lesssim|gtrsim|simeq|cong))$/.test(middle);
  if (relation && right) return `${left} &${middle} ${right}`.trim();
  if (!left && !middle && right) return `&\\qquad ${right}`;
  if (!left && middle && right) return `&${middle} ${right}`;
  return String(value || '').trim();
}

function splitOcrLatexRows(value) {
  const body = unwrapOcrFormattingEnvelope(value);
  if (!body) return [];
  let rows = [];
  let current = '';
  let braceDepth = 0;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === '{') braceDepth += 1;
    else if (ch === '}' && braceDepth > 0) braceDepth -= 1;
    if (ch === '\\' && body[i + 1] === '\\' && braceDepth === 0) {
      rows.push(current.trim());
      current = '';
      i += 1;
      continue;
    }
    current += ch;
  }
  if (current.trim()) rows.push(current.trim());
  return rows.filter(Boolean);
}

function hasBalancedOuterBraces(value) {
  const text = String(value || '').trim();
  if (text.length < 2 || text[0] !== '{' || text[text.length - 1] !== '}') return false;
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\\') { i += 1; continue; }
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') depth -= 1;
    if (depth === 0 && i < text.length - 1) return false;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function stripRedundantOuterBraces(value) {
  let text = String(value || '').trim();
  let guard = 0;
  while (guard < 4 && hasBalancedOuterBraces(text)) {
    text = text.slice(1, -1).trim();
    guard += 1;
  }
  return text;
}

function cleanOcrFormattingRow(value) {
  let row = String(value || '').trim();
  if (!row) return '';
  // Common Texify array artifact: an empty first cell followed by a doubly
  // braced mathematical cell, e.g. {{}}&{{=...}}.
  row = row.replace(/^\{\{\}\}\s*&\s*\{\{([\s\S]*)\}\}\s*$/, '&$1');
  row = row.replace(/^\{\}\s*&\s*\{([\s\S]*)\}\s*$/, '&$1');
  row = stripRedundantOuterBraces(row);
  // After unwrapping, repeat once because OCR often emits two brace layers.
  row = row.replace(/^\{\{\}\}\s*&\s*\{\{([\s\S]*)\}\}\s*$/, '&$1');
  row = stripRedundantOuterBraces(row);
  return row.replace(/\s+/g, ' ').trim();
}

function cleanOcrFormattingRows(rows) {
  const cleaned = [];
  let previousKey = '';
  for (const raw of Array.isArray(rows) ? rows : []) {
    const row = cleanOcrFormattingRow(raw);
    if (!row) continue;
    // Preserve alignment markers for later formatting, but ignore harmless
    // whitespace/bracing differences when detecting accidental duplicate rows.
    const key = row.replace(/&/g, '').replace(/\s+/g, '').trim();
    if (key && key === previousKey) continue;
    cleaned.push(row);
    previousKey = key;
  }
  return cleaned;
}

function cleanOcrFormattingArtifacts(value) {
  const rows = cleanOcrFormattingRows(splitOcrLatexRows(value));
  if (!rows.length) return String(value || '').trim();
  return rows.length === 1 ? rows[0] : rows.join(latexLineSeparator());
}

function normalizeOcrAlignmentLine(value) {
  return String(value || '').replace(/(^|[^\\])&/g, '$1').replace(/\s+/g, ' ').trim();
}

function alignLineByPattern(value, mode = 'relation') {
  const line = normalizeOcrAlignmentLine(value);
  if (!line) return '';
  const pattern = mode === 'equals'
    ? /(=)/
    : /(\\(?:Longleftrightarrow|Leftrightarrow|longleftrightarrow|leftrightarrow|Longrightarrow|Rightarrow|longrightarrow|rightarrow|longleftarrow|leftarrow|mapsto|lesssim|gtrsim|simeq|cong|neq|ne|leq|le|geq|ge|subseteq|supseteq|subset|supset|approx|sim|equiv|to|iff)(?![A-Za-z])|<=|>=|=|<|>)/;
  const match = line.match(pattern);
  if (!match || typeof match.index !== 'number') return line;
  return `${line.slice(0, match.index)}&${line.slice(match.index)}`.replace(/\s+&/g, ' &').trim();
}

function ocrSignedContinuationBody(value) {
  let line = normalizeOcrAlignmentLine(value)
    .replace(/^(?:\\(?:qquad|quad)\s*)+/, '')
    .trim();
  // OCR often carries delimiter-continuation helpers from a split formula,
  // e.g. `\left.+...` / `\right.-...`. These are visual delimiter
  // continuations, not the mathematical start of the row. Strip only the
  // invisible-dot form so the leading sign can be detected and indented.
  line = line.replace(/^\\(?:left|right)\.\s*/, '').trim();
  return /^(?:[+\-]|\\(?:pm|mp)(?![A-Za-z]))/.test(line) ? line : '';
}

function formatOcrRowsSemanticAlign(rows) {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  const formatted = cleaned.map((row) => {
    const aligned = alignLineByPattern(row, 'relation');
    if (aligned !== row) return aligned;
    const continuation = ocrSignedContinuationBody(row);
    if (continuation) return `&\\qquad ${continuation}`;
    return row;
  });
  return `\\begin{aligned}\n${formatted.join(latexLineSeparator())}\n\\end{aligned}`;
}

function formatOcrRowsAligned(rows, mode = 'relation') {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  return `\\begin{aligned}\n${cleaned.map((row) => alignLineByPattern(row, mode)).join(latexLineSeparator())}\n\\end{aligned}`;
}

function formatOcrRowsContinuation(rows) {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  const formatted = cleaned.map((row, index) => {
    const aligned = alignLineByPattern(row, 'relation');
    if (index === 0) return aligned !== row ? aligned : row;
    if (aligned !== row) return aligned;
    return `&\\quad ${row}`;
  });
  return `\\begin{aligned}\n${formatted.join(latexLineSeparator())}\n\\end{aligned}`;
}

function formatOcrRowsGathered(rows) {
  const cleaned = cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean);
  if (!cleaned.length) return '';
  if (cleaned.length === 1) return cleaned[0];
  return `\\begin{gathered}\n${cleaned.join(latexLineSeparator())}\n\\end{gathered}`;
}

function formatOcrRowsSingleLine(rows) {
  return cleanOcrFormattingRows(rows).map((row) => normalizeOcrAlignmentLine(row)).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function autoFormatOcrLatex(value) {
  const rows = cleanOcrFormattingRows(splitOcrLatexRows(value));
  if (!rows.length) return String(value || '').trim();
  if (rows.length === 1) return formatOcrRowsSingleLine(rows);
  const relationPattern = /(=|<=|>=|<|>|\\(?:Longleftrightarrow|Leftrightarrow|longleftrightarrow|leftrightarrow|Longrightarrow|Rightarrow|longrightarrow|rightarrow|longleftarrow|leftarrow|mapsto|lesssim|gtrsim|simeq|cong|neq|ne|leq|le|geq|ge|subseteq|supseteq|subset|supset|approx|sim|equiv|to|iff)(?![A-Za-z]))/;
  const relationRows = rows.filter((row) => relationPattern.test(normalizeOcrAlignmentLine(row))).length;
  const signedContinuations = rows.slice(1).filter((row) => Boolean(ocrSignedContinuationBody(row))).length;
  if (relationRows || signedContinuations) return formatOcrRowsSemanticAlign(rows);
  return formatOcrRowsGathered(rows);
}

function ensureCurrentOcrFormatState() {
  if (!currentOcrResult) return;
  if (typeof currentOcrResult.originalLatex !== 'string' || !currentOcrResult.originalLatex.trim()) currentOcrResult.originalLatex = String(currentOcrResult.latex || '').trim();
  if (!Array.isArray(currentOcrResult.formatUndoStack)) currentOcrResult.formatUndoStack = [];
}

function updateOcrFormattingControls() {
  const has = Boolean(currentOcrResult?.latex);
  if (ocrFormatMode) {
    ocrFormatMode.disabled = !has;
    ocrFormatMode.value = '';
  }
  if (ocrFormatUndo) {
    const undoCount = has && Array.isArray(currentOcrResult?.formatUndoStack) ? currentOcrResult.formatUndoStack.length : 0;
    ocrFormatUndo.disabled = !undoCount;
    ocrFormatUndo.classList.toggle('is-disabled', !undoCount);
  }
}

function syncCurrentOcrLatexValue(value, options = {}) {
  if (!currentOcrResult) return;
  currentOcrResult.latex = String(value || '').trim();
  const match = ocrHistory.find((item) => item.created === currentOcrResult.created);
  if (match) {
    match.latex = currentOcrResult.latex;
    if (typeof currentOcrResult.originalLatex === 'string') match.originalLatex = currentOcrResult.originalLatex;
    if (Array.isArray(currentOcrResult.formatUndoStack)) match.formatUndoStack = [...currentOcrResult.formatUndoStack];
  }
  if (ocrLatexPreview && ocrLatexPreview.value !== currentOcrResult.latex) ocrLatexPreview.value = currentOcrResult.latex;
  scheduleOcrRenderedPreview();
  updateOcrFormattingControls();
  if (options.status) setOcrStatus(options.status);
  persistDocumentState();
}


function latexBalancedGroupEnd(text, start) {
  if (text[start] !== '{') return -1;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '\\' && i + 1 < text.length) { i += 1; continue; }
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function mergeDuplicateLatexScripts(value, changes) {
  let text = String(value || '');
  // Repeated same-type scripts are illegal TeX: X_{a}_{b}, X^{a}^{b}.
  // Merge only adjacent balanced groups and keep their order.
  for (let guard = 0; guard < 20; guard += 1) {
    let changed = false;
    for (let i = 0; i < text.length - 3; i += 1) {
      const marker = text[i];
      if (marker !== '_' && marker !== '^') continue;
      if (text[i + 1] !== '{') continue;
      const firstEnd = latexBalancedGroupEnd(text, i + 1);
      if (firstEnd < 0) continue;
      let j = firstEnd + 1;
      while (j < text.length && /\s/.test(text[j])) j += 1;
      if (text[j] !== marker || text[j + 1] !== '{') continue;
      const secondEnd = latexBalancedGroupEnd(text, j + 1);
      if (secondEnd < 0) continue;
      const first = text.slice(i + 2, firstEnd).trim();
      const second = text.slice(j + 2, secondEnd).trim();
      const separator = first && second ? ' ' : '';
      text = text.slice(0, i) + `${marker}{${first}${separator}${second}}` + text.slice(secondEnd + 1);
      changes.push(marker === '_' ? 'merged duplicate subscripts' : 'merged duplicate superscripts');
      changed = true;
      break;
    }
    if (!changed) break;
  }
  return text;
}

function repairLatexEnvironments(value, changes) {
  let text = String(value || '');
  const environments = ['aligned', 'alignedat', 'split', 'gathered', 'array', 'matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix', 'cases'];
  for (const env of environments) {
    const beginRe = new RegExp(`\\\\begin\\{${env}\\}`, 'g');
    const endRe = new RegExp(`\\\\end\\{${env}\\}`, 'g');
    const begins = (text.match(beginRe) || []).length;
    const ends = (text.match(endRe) || []).length;
    if (begins > ends) {
      text += `\\end{${env}}`.repeat(begins - ends);
      changes.push(`closed ${env} environment`);
    } else if (ends > begins) {
      let excess = ends - begins;
      text = text.replace(endRe, (match) => {
        if (excess > 0) { excess -= 1; return ''; }
        return match;
      });
      changes.push(`removed orphan ${env} ending`);
    }
  }
  return text;
}

function repairLatexDelimiters(value, changes) {
  let text = String(value || '');
  const leftCount = (text.match(/\\left\b/g) || []).length;
  const rightCount = (text.match(/\\right\b/g) || []).length;
  if (leftCount !== rightCount) {
    // Size commands are optional. Removing only the unmatched sizing semantics
    // preserves the visible delimiters and is safer than inventing a mate.
    text = text.replace(/\\left\b\s*/g, '').replace(/\\right\b\s*/g, '');
    changes.push('removed unmatched \\left/\\right sizing');
  }
  return text;
}

function repairLatexInnerTags(value, changes) {
  let text = String(value || '');
  const environments = ['aligned', 'alignedat', 'gathered', 'split', 'array', 'cases', 'matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'];
  let repaired = false;
  for (const env of environments) {
    const environmentRe = new RegExp(`(\\\\begin\\{${env}\\}(?:\\{[^{}]*\\})?)([\\s\\S]*?)(\\\\end\\{${env}\\})`, 'g');
    text = text.replace(environmentRe, (whole, begin, body, end) => {
      const nextBody = body.replace(/\\tag\*?\s*\{([^{}]{1,48})\}/g, (tagWhole, tagValue) => {
        repaired = true;
        const compact = String(tagValue || '').trim().replace(/^\((.*)\)$/, '$1');
        return compact ? `\\qquad(${compact})` : '';
      });
      return `${begin}${nextBody}${end}`;
    });
  }
  if (repaired) changes.push('converted invalid inner \\tag to a visible equation label');
  return text;
}

function repairLatexAlignment(value, changes) {
  let text = String(value || '').trim();
  const hasRows = /\\\\/.test(text);
  const hasAmp = /(^|[^\\])&/.test(text);
  const inAlignment = /\\begin\{(?:aligned|alignedat|align|align\*|split|gathered|array|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|cases)\}/.test(text);
  if ((hasRows || hasAmp) && !inAlignment) {
    text = `\\begin{aligned}\n${text}\n\\end{aligned}`;
    changes.push('wrapped alignment markers in aligned');
  }
  return text;
}

function repairLatexScriptMarkers(value, changes) {
  let text = String(value || '');
  const before = text;
  // Empty or terminal script markers are non-compilable.
  text = text
    .replace(/([_^])\s*(?=[_^])/g, '$1{}')
    .replace(/([_^])\s*$/g, '$1{}');
  if (text !== before) changes.push('completed empty script argument');
  return text;
}

function repairLatexBraceBalance(value, changes) {
  const text = String(value || '');
  let depth = 0;
  let out = '';
  let droppedClose = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      out += ch + text[i + 1];
      i += 1;
      continue;
    }
    if (ch === '{') { depth += 1; out += ch; continue; }
    if (ch === '}') {
      if (depth > 0) { depth -= 1; out += ch; }
      else droppedClose += 1;
      continue;
    }
    out += ch;
  }
  if (droppedClose) changes.push(`removed ${droppedClose} unmatched closing brace${droppedClose === 1 ? '' : 's'}`);
  if (depth > 0) {
    out += '}'.repeat(depth);
    changes.push(`added ${depth} missing closing brace${depth === 1 ? '' : 's'}`);
  }
  return out;
}

function repairLatexBrokenCommands(value, changes) {
  let text = String(value || '');
  const before = text;
  // Common OCR aliases / malformed wrappers that can make MathJax fail.
  text = text
    .replace(/\\begin\{align\*?\}/g, '\\begin{aligned}')
    .replace(/\\end\{align\*?\}/g, '\\end{aligned}')
    .replace(/\\(?:dfrac|tfrac)\s*(?=[^{}\s])/g, '\\frac ')
    .replace(/\\operatorname\s+([A-Za-z]+)/g, '\\operatorname{$1}')
    .replace(/\\mathrm\s+([A-Za-z]+)/g, '\\mathrm{$1}')
    .replace(/\\text\s+([A-Za-z]+)/g, '\\text{$1}')
    .replace(/\\sqrt\s+([A-Za-z0-9])/g, '\\sqrt{$1}');
  if (text !== before) changes.push('normalized malformed command arguments');
  return text;
}

function repairLatexSpecialCharacters(value, changes) {
  let text = String(value || '');
  const before = text;
  // Raw # is illegal in ordinary math input; raw % comments out the rest.
  text = text.replace(/(^|[^\\])#/g, '$1\\#').replace(/(^|[^\\])%/g, '$1\\%');
  if (text !== before) changes.push('escaped raw TeX special characters');
  return text;
}

function repairLatexDisplayWrappers(value, changes) {
  let text = String(value || '').trim();
  const before = text;
  text = text
    .replace(/^\s*\\\[\s*/, '')
    .replace(/\s*\\\]\s*$/, '')
    .replace(/^\s*\$\$\s*/, '')
    .replace(/\s*\$\$\s*$/, '')
    .replace(/\\begin\{(?:equation|equation\*|displaymath)\}/g, '')
    .replace(/\\end\{(?:equation|equation\*|displaymath)\}/g, '')
    .trim();
  if (text !== before) changes.push('removed nested display wrapper');
  return text;
}

function repairTensorIndexCorruption(value, vectorLatex, changes) {
  let text = String(value || '');
  // Keep this conservative: only repair obvious OCR artifacts that are
  // mechanically invalid or strongly supported by the same formula's pattern.
  const before = text;

  // A hatted dotless j is a frequent glyph-level OCR hallucination for j.
  // Only normalize it when the same expression already uses indexed j symbols.
  if (/j_\{?\w/.test(text) && /\\hat\{\\jmath\}/.test(text)) {
    text = text.replace(/\\hat\{\\jmath\}/g, 'j');
    changes.push('normalized OCR \\hat{\\jmath} to j in an existing j-index family');
  }

  // If explicit Improve is requested and the stored PDF vector has exactly the
  // same token topology, allow the stricter v196 leaf reconciliation here too.
  if (vectorLatex) {
    const fusion = fuseTensorOcrWithVector(text, vectorLatex, true);
    if (fusion.applied) {
      text = fusion.latex;
      changes.push(...fusion.replacements.map((item) => `vector-supported ${item.from}→${item.to}`));
    }
  }

  return text === before ? value : text;
}

function improveOcrLatex(value, options = {}) {
  const changes = [];
  let text = String(value || '').trim();
  if (!text) return { latex: '', changes };

  text = repairLatexDisplayWrappers(text, changes);
  text = repairLatexBrokenCommands(text, changes);
  text = repairLatexSpecialCharacters(text, changes);
  text = repairLatexScriptMarkers(text, changes);
  text = repairLatexBraceBalance(text, changes);
  text = mergeDuplicateLatexScripts(text, changes);
  text = repairLatexDelimiters(text, changes);
  text = repairLatexInnerTags(text, changes);
  text = repairLatexAlignment(text, changes);
  text = repairLatexEnvironments(text, changes);
  text = repairTensorIndexCorruption(text, options.vectorLatex || '', changes);

  // Re-run the basic syntax stabilizer after targeted repairs.
  text = stabilizeOcrLatexSyntax(repairOcrLatex(text)).trim();

  // One last duplicate-script pass can become possible after brace repair.
  text = mergeDuplicateLatexScripts(text, changes);
  text = stabilizeOcrLatexSyntax(text).trim();

  return { latex: text, changes: [...new Set(changes)] };
}

function applyOcrFormat(mode) {
  if (!currentOcrResult || !ocrLatexPreview) return;
  ensureCurrentOcrFormatState();
  const source = String(ocrLatexPreview.value || currentOcrResult.latex || '').trim();
  if (!source && mode !== 'original') return;
  let next = source;
  const rows = cleanOcrFormattingRows(splitOcrLatexRows(source));
  let repairChanges = [];
  if (mode === 'original') next = String(currentOcrResult.originalLatex || source).trim();
  else if (mode === 'repair') {
    const repaired = improveOcrLatex(source, { vectorLatex: currentOcrResult.vectorAlternative || '' });
    next = repaired.latex;
    repairChanges = repaired.changes;
  }
  else if (mode === 'auto') next = autoFormatOcrLatex(source);
  else if (mode === 'align') next = formatOcrRowsSemanticAlign(rows.length ? rows : [source]);
  else if (mode === 'gathered') next = formatOcrRowsGathered(rows.length ? rows : [source]);
  else if (mode === 'single-line') next = formatOcrRowsSingleLine(rows.length ? rows : [source]);
  next = stabilizeOcrLatexSyntax(repairOcrLatex(next)).trim();
  if (!next || next === source) {
    updateOcrFormattingControls();
    if (mode === 'repair') setOcrStatus(t('No safe LaTeX repair was found.', '未发现可安全应用的 LaTeX 修复。'));
    return;
  }
  currentOcrResult.formatUndoStack.push(source);
  const status = mode === 'repair'
    ? `${t('Repaired LaTeX', '已修复 LaTeX')} · ${repairChanges.length || 1} ${t('change(s)', '处修改')}${repairChanges.length ? ` · ${repairChanges.slice(0, 3).join(' · ')}` : ''}`
    : t('Applied one-click LaTeX cleanup.', '已应用一键 LaTeX 整理。');
  syncCurrentOcrLatexValue(next, { status });
}

function undoOcrFormat() {
  if (!currentOcrResult || !Array.isArray(currentOcrResult.formatUndoStack) || !currentOcrResult.formatUndoStack.length) return;
  const previous = currentOcrResult.formatUndoStack.pop();
  syncCurrentOcrLatexValue(previous, { status: t('Reverted the last LaTeX formatting change.', '已撤销上一条 LaTeX 整理。') });
}

function ocrPreviewMathSource(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if ((text.startsWith('\\[') && text.endsWith('\\]')) || (text.startsWith('$$') && text.endsWith('$$'))) return text;
  return `\\[${text}\\]`;
}

function resetRenderedMathScroll(rootNode) {
  if (!rootNode) return;
  const reset = () => {
    rootNode.scrollLeft = 0;
    rootNode.scrollTop = 0;
    rootNode.querySelectorAll('mjx-container').forEach((node) => {
      node.scrollLeft = 0;
      node.scrollTop = 0;
    });
  };
  reset();
  requestAnimationFrame(() => {
    reset();
    requestAnimationFrame(reset);
  });
}

function scheduleOcrRenderedPreview() {
  clearTimeout(ocrRenderedPreviewTimer);
  ocrRenderedPreviewTimer = setTimeout(renderOcrRenderedPreview, 120);
}

async function renderOcrRenderedPreview() {
  if (!ocrRenderedPreview) return;
  const value = String(ocrLatexPreview?.value || currentOcrResult?.latex || '').trim();
  const token = ++ocrRenderedPreviewToken;
  ocrRenderedPreview.classList.toggle('is-hidden', !value);
  if (!value) {
    try { window.MathJax?.typesetClear?.([ocrRenderedPreview]); } catch (_) {}
    ocrRenderedPreview.replaceChildren();
    return;
  }
  try { window.MathJax?.typesetClear?.([ocrRenderedPreview]); } catch (_) {}
  ocrRenderedPreview.textContent = ocrPreviewMathSource(value);
  if (window.MathJax?.typesetPromise) {
    try {
      await window.MathJax.typesetPromise([ocrRenderedPreview]);
      if (token !== ocrRenderedPreviewToken) scheduleOcrRenderedPreview();
    } catch (error) {
      if (token !== ocrRenderedPreviewToken) return;
      console.warn('MathReader OCR LaTeX preview failed', error);
      ocrRenderedPreview.textContent = t('Preview unavailable for the current LaTeX. Edit the source and it will retry automatically.', '当前 LaTeX 无法渲染预览。编辑源码后将自动重试。');
      ocrRenderedPreview.classList.add('has-error');
      return;
    }
  }
  if (token === ocrRenderedPreviewToken) {
    ocrRenderedPreview.classList.remove('has-error');
    resetRenderedMathScroll(ocrRenderedPreview);
  }
}

function refreshOcrUI() {
  if (!ocrResult || !ocrHistoryList) return;
  const has = Boolean(currentOcrResult?.latex);
  if (has) ensureCurrentOcrFormatState();
  ocrResult.classList.toggle('is-hidden', !has);
  ocrPageChip.textContent = has ? String(currentOcrResult.page || '—') : '—';
  ocrLatexPreview.value = has ? currentOcrResult.latex : '';
  scheduleOcrRenderedPreview();
  updateOcrFormattingControls();
  if (ocrSourceBadge) {
    const source = has ? (currentOcrResult.source || 'image') : '';
    ocrSourceBadge.textContent = !has ? '—' : source === 'vector' ? t('PDF vector', 'PDF 矢量') : t('Image OCR', '图像 OCR');
    ocrSourceBadge.dataset.source = source;
  }
  if (ocrSourceSwitchButton) {
    const source = has ? (currentOcrResult.source || 'image') : '';
    // Keep manual comparison controls stable once a result exists. A missing or
    // poor alternative is reported when invoked; it must not make the button
    // disappear and shift the OCR action layout.
    ocrSourceSwitchButton.classList.toggle('is-hidden', !has);
    if (has && source === 'vector') {
      ocrSourceSwitchButton.textContent = t('Image OCR', '图像 OCR');
      ocrSourceSwitchButton.dataset.targetSource = 'image';
    } else if (has) {
      ocrSourceSwitchButton.textContent = t('PDF vector', 'PDF 矢量');
      ocrSourceSwitchButton.dataset.targetSource = 'vector';
    } else {
      ocrSourceSwitchButton.removeAttribute('data-target-source');
    }
  }
  if (has && currentOcrResult.preview) {
    ocrPreview.src = currentOcrResult.preview;
    ocrPreview.classList.remove('is-hidden');
  } else {
    ocrPreview.removeAttribute('src');
    ocrPreview.classList.add('is-hidden');
  }
  ocrHistoryList.replaceChildren();
  ocrHistoryCount.textContent = String(ocrHistory.length);
  ocrHistoryEmpty.classList.toggle('is-hidden', ocrHistory.length > 0);
  const visibleHistory = ocrHistory.slice(0, ocrHistoryExpanded ? 10 : 3);
  for (const item of visibleHistory) {
    if (!item?.latex) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ocr-history-item';
    button.title = t('Click to reopen · double-click to copy LaTeX', '单击重新打开 · 双击复制 LaTeX');
    const label = document.createElement('strong');
    label.textContent = t(`Page ${item.page || '?'}`, `第 ${item.page || '?'} 页`);
    const code = document.createElement('code');
    code.textContent = item.latex.replace(/\s+/g, ' ').trim();
    button.append(label, code);
    button.addEventListener('click', () => {
      currentOcrResult = item;
      refreshOcrUI();
      persistDocumentState();
    });
    button.addEventListener('dblclick', async (event) => {
      event.preventDefault();
      await copyPlainText(item.latex);
      button.classList.add('is-copied');
      setOcrStatus(t('LaTeX copied from recent extraction.', '已从最近公式提取中复制 LaTeX。'));
      setTimeout(() => button.classList.remove('is-copied'), 700);
    });
    ocrHistoryList.append(button);
  }
  if (ocrHistoryToggle) {
    const canToggle = ocrHistory.length > 3;
    ocrHistoryToggle.classList.toggle('is-hidden', !canToggle);
    ocrHistoryToggle.textContent = ocrHistoryExpanded ? t('Less', '收起') : t(`More (${Math.min(7, Math.max(0, ocrHistory.length - 3))})`, `更多 (${Math.min(7, Math.max(0, ocrHistory.length - 3))})`);
    ocrHistoryToggle.setAttribute('aria-expanded', ocrHistoryExpanded ? 'true' : 'false');
  }
}

function allOcrLayers() {
  return [...document.querySelectorAll('.ocr-select-layer')];
}

function resetOcrBoxes() {
  for (const layer of allOcrLayers()) {
    layer.classList.remove('is-selecting');
    const box = layer.querySelector('.ocr-selection-box');
    if (box) box.removeAttribute('style');
  }
}

function applyOcrModeToSurfaces() {
  primaryPageSurface?.classList.toggle('ocr-mode', ocrMode && readingFlow === 'single');
  referencePageSurface?.classList.toggle('ocr-mode', ocrMode && Boolean(pinnedPage));
  continuousStack?.querySelectorAll('.continuous-page-surface').forEach((surface) => surface.classList.toggle('ocr-mode', ocrMode && readingFlow === 'continuous'));
}

function mathOcrEngineReady() {
  return Boolean(mathOcrPipeline && mathOcrBackend && !mathOcrLoading);
}

function updateOcrInteractionAvailability() {
  const ready = mathOcrEngineReady();
  if (mathOcrButton) {
    mathOcrButton.disabled = !pdfDoc || !ready;
    mathOcrButton.setAttribute('aria-disabled', mathOcrButton.disabled ? 'true' : 'false');
  }
  if (!ready && ocrMode) {
    ocrMode = false;
    mathOcrButton?.classList.remove('is-active');
    mathOcrButton?.setAttribute('aria-pressed', 'false');
    applyOcrModeToSurfaces();
    resetOcrBoxes();
    ocrDrag = null;
  }
}

function setOcrMode(active) {
  if (active && !mathOcrEngineReady()) {
    ocrMode = false;
    updateOcrInteractionAvailability();
    setOcrStatus(mathOcrLoading
      ? t('OCR engine is initializing. Formula selection will activate when it is ready.', '公式 OCR 引擎正在初始化。引擎就绪后才会启用公式框选。')
      : t('OCR engine is not ready. Preloading it now…', '公式 OCR 引擎尚未就绪。正在预加载……'), true);
    if (!mathOcrLoading) scheduleMathOcrPreload();
    return;
  }
  ocrMode = Boolean(active && pdfDoc);
  mathOcrButton?.classList.toggle('is-active', ocrMode);
  mathOcrButton?.setAttribute('aria-pressed', ocrMode ? 'true' : 'false');
  applyOcrModeToSurfaces();
  resetOcrBoxes();
  ocrDrag = null;
  if (ocrMode) {
    hideSelectionToolbar();
    window.getSelection()?.removeAllRanges();
    // Reveal Formula OCR as soon as selection mode becomes active.
    // This happens before the drag and well before WASM inference can block
    // the main thread, so the user already sees where progress/results live.
    autoOpenRightSection('ocr-section');
    setOcrStatus(formulaExtractionMode === 'image' ? t('Drag around one formula. Image OCR is the default; press Esc to cancel.', '请框选一个公式。默认使用图像 OCR；按 Esc 取消。') : t('Drag around one formula. PDF vector extraction is selected; press Esc to cancel.', '请框选一个公式。当前选择 PDF 矢量提取；按 Esc 取消。')); 
    if (matchMedia('(max-width: 860px)').matches) shell.classList.add('mobile-right-open');
    else shell.classList.remove('right-collapsed');
  } else if (!mathOcrLoading) {
    setOcrStatus(mathOcrBackend ? t(`Image OCR default · ${mathOcrBackend.label} ready · PDF vector available for manual comparison`, `默认图像 OCR · ${mathOcrBackend.label} 已就绪 · PDF 矢量可手动对照`) : t('Ready. Image OCR is the default formula extractor.', '就绪。默认使用图像 OCR 提取公式。')); 
  }
}

function normalizedOcrEngineMode(value) {
  return ['official','webgpu','wasm'].includes(value) ? value : 'official';
}

function currentOcrPlan() {
  const mode = normalizedOcrEngineMode(mathOcrEngineMode);
  if (mode === 'webgpu') {
    // Optional GPU accelerator. If it cannot initialize, fall back automatically
    // to the model-card CPU path instead of failing OCR.
    return [
      { device: 'webgpu', dtype: 'q4f16', label: 'Texify · WebGPU q4f16', official: false },
      { device: null, dtype: null, label: 'Texify · CPU fallback', official: true }
    ];
  }
  if (mode === 'wasm') {
    return [{ device: 'wasm', dtype: 'q8', label: 'Texify · CPU/WASM q8', official: false }];
  }
  // Default to Texify's model-card CPU/browser path. On the tested
  // machine this has been fast and stable without WebGPU's latency variance.
  return [{ device: null, dtype: null, label: 'Texify · CPU', official: true }];
}

function updateOcrCapability(extra = '') {
  if (!ocrCapability) return;
  const gpu = Boolean(navigator.gpu);
  const engine = mathOcrBackend ? mathOcrBackend.label : t('not loaded', '尚未加载');
  const method = formulaExtractionMode === 'image' ? t('Image OCR default', '默认图像 OCR') : t('PDF vector default', '默认 PDF 矢量');
  const base = t(`${method} · ${TRANSFORMERS_RUNTIME} · GPU: ${gpu ? 'available' : 'unavailable'} · Active image engine: ${engine}`, `${method} · ${TRANSFORMERS_RUNTIME} · GPU：${gpu ? '可用' : '不可用'} · 当前图像引擎：${engine}`);
  ocrCapability.textContent = extra ? `${base} · ${extra}` : base;
}

async function disposeMathOcrPipeline() {
  const pipe = mathOcrPipeline;
  mathOcrPipeline = null;
  mathOcrBackend = null;
  mathOcrReadyAt = null;
  mathOcrInferenceRuns = 0;
  mathOcrModulePromise = null;
  updateOcrCapability();
  try { await pipe?.dispose?.(); } catch (_) {}
}

function friendlyOcrError(error, backend = null) {
  const raw = String(error?.message || error || '').trim();
  const lower = raw.toLowerCase();
  if (/out of memory|allocation|memory/.test(lower)) return t('The OCR model ran out of browser memory. Close other heavy tabs or switch OCR Engine to Compatibility · CPU.', '公式 OCR 模型的浏览器内存不足。请关闭其他占用较大的标签页，或将识别引擎切换到“兼容模式 · CPU”。');
  if (/webgpu|gpu|adapter|device lost/.test(lower)) return t('WebGPU could not initialize on this browser. Switch OCR Engine to Compatibility · CPU and retry.', '此浏览器无法初始化 WebGPU。请将识别引擎切换到“兼容模式 · CPU”后重试。');
  if (/could not locate file|model_file_not_found|404/.test(lower)) return t('The formula-image model repository is missing a file required by this runtime. MathReader uses Xenova/texify, which is packaged specifically for Transformers.js with merged decoder weights.', '公式图像模型仓库缺少当前运行时所需文件。MathReader 使用专为 Transformers.js 打包并提供 merged decoder 权重的 Xenova/texify。');
  if (/fetch|network|failed to load|404|403|cors/.test(lower)) return t('The OCR engine could not download its model files. Check access to Hugging Face/jsDelivr, then press Reload engine. MathReader uses the browser-compatible Texify formula model.', '公式 OCR 无法下载模型文件。请检查是否可以访问 Hugging Face/jsDelivr，然后点击“重新加载引擎”。MathReader 使用兼容浏览器的 Texify 公式识别模型。');
  if (/image_mean|image_std|number of channels|channels in the image|channel mismatch/.test(lower)) return t('The image-OCR preprocessor rejected the selected region. Reload the page; if this persists, report the exact message.', '图像 OCR 预处理拒绝了框选区域。请重新载入页面；若仍出现此问题，请报告完整错误信息。');
  if (/scale|dequant|onnx|session|can't create a session|cannot create.*session/.test(lower)) return t(`The ${backend?.label || 'ONNX'} engine failed to initialize under ${TRANSFORMERS_RUNTIME}. Recommended mode follows the model card's browser path; reload the engine or try WebGPU as a diagnostic alternative.`, `${backend?.label || 'ONNX'} 引擎在 ${TRANSFORMERS_RUNTIME} 下初始化失败。推荐模式遵循模型卡的浏览器路径；请重新加载引擎，或尝试 WebGPU 作为诊断性备选。`);
  return raw || t('Image OCR engine failed to initialize.', '图像 OCR 引擎初始化失败。');
}

function detailedOcrError(error, backend = null) {
  const friendly = friendlyOcrError(error, backend);
  const technical = String(error?.message || error || '').replace(/\s+/g, ' ').trim();
  if (!technical || technical === friendly) return friendly;
  return `${friendly} · ${t('Technical', '技术信息')}: ${technical.slice(0, 520)}`;
}


async function ensureMathOcrPipeline() {
  if (mathOcrPipeline) return mathOcrPipeline;
  const engineLoadStart = ocrNow();
  let runtimeImportMs = 0;
  mathOcrLoading = true;
  setOcrMode(false);
  updateOcrInteractionAvailability();
  setOcrStatus(t(`Loading the local formula-image fallback (Texify · ${TRANSFORMERS_RUNTIME})…`, `正在加载本地公式图像备用引擎（Texify · ${TRANSFORMERS_RUNTIME}）……`), true);
  try {
    if (!mathOcrModulePromise) {
      const importStart = ocrNow();
      mathOcrModulePromise = import(TRANSFORMERS_URL);
      const imported = await mathOcrModulePromise;
      runtimeImportMs = ocrNow() - importStart;
      var pipeline = imported.pipeline;
    } else {
      const imported = await mathOcrModulePromise;
      var pipeline = imported.pipeline;
    }
    const plan = currentOcrPlan();
    let lastError = null;
    for (let index = 0; index < plan.length; index += 1) {
      const backend = plan[index];
      try {
        // Initialization feedback is intentionally static.
        // Do not show estimated progress, percentages, file counts, filenames,
        // bars, rings, spinners, or other animation during engine startup.
        setOcrStatus(t(`Initializing OCR · ${backend.label}`, `正在初始化 OCR · ${backend.label}`), true);
        const progress_callback = () => {};
        const options = { progress_callback };
        if (!backend.official) {
          options.device = backend.device;
          options.dtype = backend.dtype;
        }
        const pipelineStart = ocrNow();
        const pipe = await pipeline('image-to-text', MATH_OCR_MODEL, options);
        const pipelineMs = ocrNow() - pipelineStart;
        mathOcrPipeline = pipe;
        mathOcrBackend = backend;
        mathOcrReadyAt = ocrNow();
        mathOcrInferenceRuns = 0;
        lastOcrEngineTiming = {
          backend: backend.label,
          backendDetail: `${backend.label}${backend.device ? ` · device=${backend.device}` : ''}${backend.dtype ? ` · dtype=${backend.dtype}` : ''}`,
          importMs: runtimeImportMs,
          pipelineMs,
          totalMs: ocrNow() - engineLoadStart
        };
        updateOcrCapability();
        setOcrStatus(t(`OCR ready · ${backend.label}`, `OCR 就绪 · ${backend.label}`));
        logOcrTiming({ type: 'engine-load', ...lastOcrEngineTiming });
        return pipe;
      } catch (error) {
        console.warn('MathReader OCR backend failed', backend, error);
        lastError = error;
        if (index + 1 < plan.length) {
          setOcrStatus(t(`${backend.label} failed. Trying ${plan[index + 1].label}…`, `${backend.label} 失败。正在尝试 ${plan[index + 1].label}……`), true);
        }
      }
    }
    throw lastError || new Error('Image OCR fallback unavailable');
  } catch (error) {
    mathOcrPipeline = null;
    mathOcrBackend = null;
    mathOcrModulePromise = null;
    updateOcrCapability(t('load failed', '加载失败'));
    throw error;
  } finally {
    mathOcrLoading = false;
    updateOcrInteractionAvailability();
  }
}


function scheduleMathOcrPreload() {
  const preload = async () => {
    // Never initialize the large Transformers/Texify stack on the welcome
    // screen.  Its module/model initialization can occupy the browser main
    // thread long enough to delay the first native file-picker click.  Formula
    // OCR is nonessential to opening a PDF, so warm it only after a document is
    // already visible; explicit Formula OCR use still loads it immediately.
    if (!pdfDoc || restoringSession || documentOcrInteractionLocked()) return;
    if (mathOcrPipeline || mathOcrLoading) return;
    try {
      await ensureMathOcrPipeline();
    } catch (error) {
      console.warn('MathReader OCR background preload failed', error);
      setOcrStatus(t('OCR will retry when you extract a formula.', '公式 OCR 将在你提取公式时重试。'));
    }
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => preload(), { timeout: 1800 });
  } else {
    setTimeout(preload, 600);
  }
}

function schedulePdfCorePreload() {
  const preload = () => {
    if (pdfjsLib || pdfModulePromise) return;
    ensurePdfJs().catch((error) => console.warn('MathReader PDF engine background preload failed', error));
  };
  // PDF.js is the small, essential first-open dependency.  Warm that instead of
  // the much heavier formula-OCR stack while the welcome screen is idle.
  if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 1200 });
  else setTimeout(preload, 250);
}

async function prepareMathOcrInput(canvas) {
  if (!mathOcrModulePromise) mathOcrModulePromise = import(TRANSFORMERS_URL);
  const { RawImage } = await mathOcrModulePromise;
  if (!RawImage?.fromCanvas) throw new Error('Formula image utilities are unavailable.');
  const image = RawImage.fromCanvas(canvas).rgb();
  if (image.channels !== 3) image.convert(3);
  return image;
}

function formulaInkBounds(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) return null;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  // Ignore near-white antialiasing/noise while retaining light mathematical strokes.
  const threshold = 242;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX >= minX && maxY >= minY ? { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } : null;
}

function normalizeFormulaCropForOcr(crop, variant = 'tight') {
  const normalizedCrop = normalizeFormulaPolarity(crop);
  const bounds = formulaInkBounds(normalizedCrop) || { left: 0, top: 0, width: normalizedCrop.width, height: normalizedCrop.height };
  const padRatio = variant === 'relaxed' ? 0.115 : 0.055;
  const sourcePad = Math.max(5, Math.round(Math.max(bounds.width, bounds.height) * padRatio));
  const sx = Math.max(0, bounds.left - sourcePad);
  const sy = Math.max(0, bounds.top - sourcePad);
  const sw = Math.min(normalizedCrop.width - sx, bounds.width + sourcePad * 2);
  const sh = Math.min(normalizedCrop.height - sy, bounds.height + sourcePad * 2);
  // Texify's processor accepts variable-size formula images. Preserve the
  // formula aspect ratio, remove irrelevant whitespace, and upscale small
  // selections so fine scripts/radicals do not disappear before encoding.
  const longSide = Math.max(1, sw, sh);
  const minLongSide = variant === 'relaxed' ? 760 : 900;
  const maxLongSide = 1440;
  const scale = Math.min(maxLongSide / longSide, Math.max(1, minLongSide / longSide));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const out = document.createElement('canvas');
  out.width = dw;
  out.height = dh;
  const ctx = out.getContext('2d', { alpha: false });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, dw, dh);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(normalizedCrop, sx, sy, sw, sh, 0, 0, dw, dh);
  return out;
}

function latexStructuralPenalty(value) {
  const text = String(value || '');
  if (!text.trim()) return 10000;
  let depth = 0;
  let unmatchedClose = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\\' && text[i + 1]) { i += 1; continue; }
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') { if (depth > 0) depth -= 1; else unmatchedClose += 1; }
  }
  let penalty = (depth + unmatchedClose) * 12;
  penalty += (text.match(/\}{3,}/g) || []).length * 15;
  penalty += (text.match(/(\\mathrm\{div\}\s*){2,}/g) || []).length * 18;
  penalty += (text.match(/(\\(?:frac|sqrt|mathrm|text)\b[^\n]{0,28})\1/g) || []).length * 10;
  if (/\\sqrt\{[^\n]{0,80}\\frac\{1\}\{1\}/.test(text)) penalty += 8;
  if (/\\cdot\s*\)/.test(text)) penalty += 8;
  return penalty;
}

function repairOcrLatex(value) {
  let text = normalizeOcrLatex(value);
  if (!text) return '';
  // Drop only closing braces that are provably unmatched at top level. This
  // repairs degeneration such as `\\mathrm{div}}}}` without guessing content.
  let depth = 0;
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) { out += ch + text[i + 1]; i += 1; continue; }
    if (ch === '{') { depth += 1; out += ch; continue; }
    if (ch === '}') { if (depth > 0) { depth -= 1; out += ch; } continue; }
    out += ch;
  }
  if (depth > 0) out += '}'.repeat(depth);
  out = out.replace(/(\\mathrm\{div\})(?:\s*\1)+/g, '$1');

  // Tensor multi-index repair: Texify can close a subscript too early around
  // an ellipsis, e.g. `y_{i_{1}}...i_{k}` although the image shows one
  // multi-index `y_{i_{1}\ldots i_{k}}`. Keep this intentionally narrow:
  // require the same index letter on both sides of the ellipsis.
  out = out
    .replace(/([A-Za-z]|\\[A-Za-z]+)_\{([A-Za-z])_\{([^{}]+)\}\}\s*(?:\.{3}|\\(?:ldots|cdots)(?![A-Za-z]))\s*\2_\{([^{}]+)\}/g, '$1_{$2_{$3}\\ldots $2_{$4}}')
    .replace(/([A-Za-z]|\\[A-Za-z]+)_\{([A-Za-z])_([^{}\s]+)\}\s*(?:\.{3}|\\(?:ldots|cdots)(?![A-Za-z]))\s*\2_([^{}\s]+)/g, '$1_{$2_$3\\ldots $2_$4}');

  // Remove only mechanically duplicated arrow commands. This does not infer
  // mathematical content; it fixes decoder artifacts such as `\mapsto \to`.
  out = out
    .replace(/\\mapsto\s*(?:\\to|\\rightarrow)\b/g, '\\mapsto')
    .replace(/(?:\\to|\\rightarrow)\s*\\mapsto\b/g, '\\mapsto');
  return out.replace(/[ \t]+/g, ' ').trim();
}


function stabilizeOcrLatexSyntax(value) {
  let text = String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (!text) return '';

  // normalizeOcrLatex already removes ordinary display wrappers. Guard
  // against partial wrappers that a decoder can leave behind after truncation.
  text = text
    .replace(/^\s*\\\[\s*/, '')
    .replace(/\s*\\\]\s*$/, '')
    .replace(/^\s*\$\$\s*/, '')
    .replace(/\s*\$\$\s*$/, '')
    .replace(/\\begin\{(?:equation|equation\*|displaymath)\}/g, '')
    .replace(/\\end\{(?:equation|equation\*|displaymath)\}/g, '')
    .replace(/\\begin\{align\*?\}/g, '\\begin{aligned}')
    .replace(/\\end\{align\*?\}/g, '\\end{aligned}')
    .trim();

  // A lone sizing command is a common decoder truncation and causes MathJax
  // failures. If the counts disagree, remove only the sizing commands; the
  // actual delimiters remain visible and mathematically readable.
  text = text.replace(/\\(?:left|right)\b\s*$/g, '');
  const leftCount = (text.match(/\\left\b/g) || []).length;
  const rightCount = (text.match(/\\right\b/g) || []).length;
  if (leftCount !== rightCount) text = text.replace(/\\(?:left|right)\b\s*/g, '');

  // Keep only well-nested math environments. Orphan/mismatched \end tokens
  // are discarded, and unclosed environments are closed at the end. This is
  // syntax stabilization only; it does not invent mathematical symbols.
  const safeEnvs = new Set(['aligned','alignedat','array','cases','matrix','pmatrix','bmatrix','Bmatrix','vmatrix','Vmatrix','gathered','split']);
  const stack = [];
  text = text.replace(/\\(begin|end)\{([A-Za-z*]+)\}/g, (full, kind, env) => {
    if (!safeEnvs.has(env)) return full;
    if (kind === 'begin') {
      stack.push(env);
      return full;
    }
    if (stack.at(-1) === env) {
      stack.pop();
      return full;
    }
    return '';
  });
  while (stack.length) text += `\\end{${stack.pop()}}`;

  // repairOcrLatex balances ordinary braces. Re-run a lightweight balance in
  // case environment cleanup exposed a truncated group.
  let depth = 0;
  let balanced = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      balanced += ch + text[i + 1];
      i += 1;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      balanced += ch;
    } else if (ch === '}') {
      if (depth > 0) {
        depth -= 1;
        balanced += ch;
      }
    } else {
      balanced += ch;
    }
  }
  if (depth > 0) balanced += '}'.repeat(depth);

  // A decoder can terminate immediately after a script marker. Make that
  // syntactically harmless while keeping the uncertainty visible in source.
  balanced = balanced
    .replace(/([_^])\s*(?=[_^])/g, '$1{}')
    .replace(/([_^])\s*$/, '$1{}');
  return balanced.replace(/[ \t]+/g, ' ').trim();
}


function findRepeatedLatexSequence(latexValue) {
  const latex = String(latexValue || '').trim();
  const compact = latex.replace(/\s+/g, ' ');
  const tokens = compact.match(/\\[A-Za-z]+|[A-Za-z]+|\d+|[^\s]/g) || [];
  let best = null;

  for (const width of [6, 8, 10, 12]) {
    if (tokens.length < Math.max(140, width * 4)) continue;
    const positions = new Map();
    for (let i = 0; i <= tokens.length - width; i += 1) {
      const key = tokens.slice(i, i + width).join(' ');
      const list = positions.get(key) || [];
      list.push(i);
      positions.set(key, list);
    }
    for (const [key, list] of positions.entries()) {
      if (list.length < 3) continue;
      const chosen = [];
      for (const at of list) {
        if (!chosen.length || at - chosen[chosen.length - 1] >= width) chosen.push(at);
      }
      if (chosen.length < 3) continue;
      const locallyRepeated = chosen.some((at, idx) => idx > 0 && at - chosen[idx - 1] <= width * 12);
      if (!locallyRepeated) continue;
      const sequenceTokens = key.split(' ');
      const tensorSignals = sequenceTokens.filter((token) =>
        token === '_' || token === '^' || token === '{' || token === '}' ||
        /^(?:i|j|k|l|m|n|a|b|p|q|r|s)$/.test(token) ||
        /^\\(?:ell|Gamma|delta|nabla|partial)$/.test(token)
      ).length;
      const tensorIndexLike = tensorSignals >= Math.max(2, Math.floor(width / 3));
      const candidate = { width, sequence: key, occurrences: chosen.length, tensorIndexLike };
      if (!best || candidate.occurrences > best.occurrences || (candidate.occurrences === best.occurrences && candidate.width > best.width)) best = candidate;
    }
  }
  return best;
}

function assessImageOcrResult(rawValue, latexValue) {
  const raw = String(rawValue || '').trim();
  const latex = String(latexValue || '').trim();
  const hardReasons = [];
  const warnings = [];
  const corruption = { commandLoop: null, repeatedFragment: null, repeatedSequence: null, runawayFraction: false };

  if (!latex) hardReasons.push(t('no LaTeX was produced', '没有生成 LaTeX'));
  if (/\\includegraphics\b/i.test(raw) || /\\includegraphics\b/i.test(latex)) hardReasons.push(t('document-layout placeholders were produced', '生成了文档版面占位符'));
  if (/\\(?:begin|end)\{(?:document|figure|table)\}/i.test(raw)) hardReasons.push(t('document markup was produced instead of a formula', '生成了文档标记而不是公式'));
  if (/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u.test(raw + latex)) hardReasons.push(t('private-use font glyphs leaked into the OCR output', 'OCR 输出中混入了私用区字体字形'));
  if (/\uFFFD/.test(raw + latex)) hardReasons.push(t('unrecoverable replacement glyphs were produced', '生成了无法恢复的替代字形'));

  const commandLoop = raw.match(/(\\[A-Za-z]+(?:\{[^{}]{0,30}\})?)(?:\s*\1){4,}/);
  if (commandLoop) {
    corruption.commandLoop = { sequence: commandLoop[1], occurrences: 5 };
    hardReasons.push(`${t('decoder runaway: repeated command', '解码器失控：重复命令')} “${commandLoop[1]}”`);
  }
  const compact = latex.replace(/\s+/g, ' ');
  const fragmentLoop = compact.match(/(.{18,90})(?:\s*\1){3,}/);
  if (fragmentLoop) {
    const fragment = String(fragmentLoop[1] || '').trim().slice(0, 120);
    corruption.repeatedFragment = { sequence: fragment, occurrences: 4 };
    hardReasons.push(`${t('decoder runaway: repeated fragment', '解码器失控：重复片段')} “${fragment}”`);
  }

  const fracCount = (latex.match(/\\(?:c?frac)\b/g) || []).length;
  let braceDepth = 0;
  let maxBraceDepth = 0;
  for (let i = 0; i < latex.length; i += 1) {
    if (latex[i] === '\\' && i + 1 < latex.length) { i += 1; continue; }
    if (latex[i] === '{') { braceDepth += 1; maxBraceDepth = Math.max(maxBraceDepth, braceDepth); }
    else if (latex[i] === '}' && braceDepth > 0) braceDepth -= 1;
  }
  if ((fracCount >= 20 && latex.length >= 700) || maxBraceDepth >= 30) {
    corruption.runawayFraction = true;
    hardReasons.push(t('decoder runaway: implausible fraction nesting', '解码器失控：异常分式嵌套'));
  }

  const repeatedSequence = findRepeatedLatexSequence(latex);
  if (repeatedSequence) {
    corruption.repeatedSequence = repeatedSequence;
    const sequence = repeatedSequence.sequence.slice(0, 160);
    if (repeatedSequence.tensorIndexLike) {
      // Tensor/index notation is naturally repetitive. Keep the evidence for
      // diagnostics, but it must not hard-reject the result or trigger a retry.
      warnings.push(`${t('repeated tensor/index notation detected (allowed)', '检测到重复张量/指标记号（允许）')} “${sequence}” ×${repeatedSequence.occurrences}`);
    } else {
      hardReasons.push(`${t('decoder runaway: repeated LaTeX token sequence', '解码器失控：重复 LaTeX token 序列')} “${sequence}” ×${repeatedSequence.occurrences}`);
    }
  }

  if (latex.length > 1800) warnings.push(t('the output is unusually long', '输出长度异常偏长'));
  if (braceDepth !== 0) warnings.push(t('brace balance needed repair or review', '花括号平衡需要检查'));
  const mathSignal = /\\[A-Za-z]+|[=<>_^{}]|[+\-*\/]|\d/.test(latex);
  const words = latex.match(/[A-Za-z]{3,}/g) || [];
  if (!mathSignal && words.length > 3) warnings.push(t('the output may contain prose rather than mathematics', '输出可能包含普通文本而非数学公式'));
  if (fracCount >= 12 || maxBraceDepth >= 18) warnings.push(t('complex nesting should be reviewed', '复杂嵌套结构建议人工核对'));

  return { ok: hardReasons.length === 0, hardReject: hardReasons.length > 0, reasons: hardReasons, warnings, corruption };
}

function imageOcrCorruptionScore(candidate) {
  if (!candidate?.latex) return 100000;
  const assessment = candidate.assessment || {};
  const corruption = assessment.corruption || {};
  let score = Number(candidate.penalty) || 0;
  if (assessment.hardReject) score += 100;
  score += (Array.isArray(assessment.reasons) ? assessment.reasons.length : 0) * 18;
  if (corruption.commandLoop) score += 70 + Math.min(40, Number(corruption.commandLoop.occurrences || 0) * 4);
  if (corruption.repeatedFragment) score += 65 + Math.min(40, Number(corruption.repeatedFragment.occurrences || 0) * 4);
  if (corruption.repeatedSequence && !corruption.repeatedSequence.tensorIndexLike) {
    score += 70;
    score += Math.min(50, Number(corruption.repeatedSequence.occurrences || 0) * 5);
  }
  if (corruption.runawayFraction) score += 90;
  score += Math.max(0, String(candidate.latex || '').length - 250) / 120;
  return score;
}

function rectIntersectionRatio(a, b) {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right <= left || bottom <= top) return 0;
  const intersection = (right - left) * (bottom - top);
  const area = Math.max(1, (a.right - a.left) * (a.bottom - a.top));
  return intersection / area;
}

