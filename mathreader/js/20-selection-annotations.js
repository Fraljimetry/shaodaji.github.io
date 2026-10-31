// MathReader v306 · Text selection, annotations, and manual structure/equation editing.
function nodeElement(node) {
  if (!node) return null;
  return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
}

function selectionLayerForNode(node) {
  return nodeElement(node)?.closest?.('.textLayer') || null;
}

const latexSymbolMap = new Map(Object.entries({
  'α':'\\alpha ','β':'\\beta ','γ':'\\gamma ','δ':'\\delta ','ε':'\\varepsilon ','ϵ':'\\epsilon ','ζ':'\\zeta ','η':'\\eta ','θ':'\\theta ','ϑ':'\\vartheta ','ι':'\\iota ','κ':'\\kappa ','λ':'\\lambda ','μ':'\\mu ','ν':'\\nu ','ξ':'\\xi ','π':'\\pi ','ϖ':'\\varpi ','ρ':'\\rho ','ϱ':'\\varrho ','σ':'\\sigma ','ς':'\\varsigma ','τ':'\\tau ','υ':'\\upsilon ','φ':'\\phi ','ϕ':'\\varphi ','χ':'\\chi ','ψ':'\\psi ','ω':'\\omega ',
  'Γ':'\\Gamma ','Δ':'\\Delta ','Θ':'\\Theta ','Λ':'\\Lambda ','Ξ':'\\Xi ','Π':'\\Pi ','Σ':'\\Sigma ','Υ':'\\Upsilon ','Φ':'\\Phi ','Ψ':'\\Psi ','Ω':'\\Omega ',
  'ℝ':'\\mathbb{R}','ℤ':'\\mathbb{Z}','ℕ':'\\mathbb{N}','ℚ':'\\mathbb{Q}','ℂ':'\\mathbb{C}','ℙ':'\\mathbb{P}',
  '∂':'\\partial ','∇':'\\nabla ','∞':'\\infty ','∫':'\\int ','∬':'\\iint ','∭':'\\iiint ','∮':'\\oint ','∑':'\\sum ','∏':'\\prod ','⋃':'\\bigcup ','⋂':'\\bigcap ','√':'\\sqrt{}',
  '≤':' \\le ','≥':' \\ge ','≠':' \\ne ','≈':' \\approx ','≅':' \\cong ','∼':' \\sim ','≡':' \\equiv ','∝':' \\propto ',
  '∈':' \\in ','∉':' \\notin ','∋':' \\ni ','⊂':' \\subset ','⊆':' \\subseteq ','⊊':' \\subsetneq ','⊃':' \\supset ','⊇':' \\supseteq ','∪':' \\cup ','∩':' \\cap ',
  '→':' \\to ','←':' \\leftarrow ','↔':' \\leftrightarrow ','⇒':' \\Rightarrow ','⇐':' \\Leftarrow ','⇔':' \\Leftrightarrow ','↦':' \\mapsto ',
  '±':' \\pm ','∓':' \\mp ','×':' \\times ','·':' \\cdot ','∘':' \\circ ','⊗':' \\otimes ','⊕':' \\oplus ','∧':' \\wedge ','∨':' \\vee ','¬':'\\neg ',
  '∀':'\\forall ','∃':'\\exists ','∅':'\\varnothing ','∥':'\\Vert ','‖':'\\Vert ','⟨':'\\langle ','⟩':'\\rangle ','⊥':'\\perp ','∠':'\\angle ','ℓ':'\\ell ','′':"'",'″':"''",'°':'^{\\circ}','…':'\\ldots ','⋯':'\\cdots ','⋮':'\\vdots '
}));

const superscriptMap = new Map(Object.entries({'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i'}));
const subscriptMap = new Map(Object.entries({'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-','₌':'=','₍':'(','₎':')','ₐ':'a','ₑ':'e','ₕ':'h','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p','ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x'}));

function vectorUnicodeStyleLatex(ch) {
  const special = {
    'ℱ':'\\mathcal{F}','ℰ':'\\mathcal{E}','ℋ':'\\mathcal{H}','ℐ':'\\mathcal{I}','ℒ':'\\mathcal{L}','ℳ':'\\mathcal{M}','ℛ':'\\mathcal{R}',
    '𝒩':'\\mathcal{N}','𝒳':'\\mathcal{X}','𝒫':'\\mathcal{P}','𝒬':'\\mathcal{Q}','𝒮':'\\mathcal{S}',
    'ℙ':'\\mathbb{P}','ℝ':'\\mathbb{R}','ℤ':'\\mathbb{Z}','ℕ':'\\mathbb{N}','ℚ':'\\mathbb{Q}','ℂ':'\\mathbb{C}'
  };
  if (special[ch]) return special[ch];
  const cp = ch.codePointAt(0);
  const compatibility = ch.normalize('NFKD');
  if (compatibility !== ch && latexSymbolMap.has(compatibility)) return compatibility;
  if (compatibility !== ch && /^[A-Za-z0-9α-ωΑ-Ωφϕϑϖϱς]+$/u.test(compatibility)) {
    // Mathematical alphanumeric Unicode (italic/bold/etc.) carries font style,
    // not a different mathematical symbol. Preserve calligraphic letters when
    // they are clearly encoded as script; otherwise return the base character.
    if ((cp >= 0x1D49C && cp <= 0x1D4CF) && /^[A-Za-z]$/.test(compatibility)) return `\\mathcal{${compatibility}}`;
    return compatibility;
  }
  return null;
}

function cleanPdfGlyphText(text) {
  return String(text || '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/⎛|⎜|⎝/g, '(')
    .replace(/⎞|⎟|⎠/g, ')')
    .replace(/⃒/g, '|')
    .replace(/⃦/g, '∥')
    .replace(/⋯|\.\.\./g, '…');
}

function pdfTextToLatex(source) {
  const text = cleanPdfGlyphText(String(source || '').normalize('NFC').replace(/\u00ad/g, '').replace(/\r\n?/g, '\n'));
  const chars = Array.from(text);
  let out = '';
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const accentCommands = { '̂':'\\widehat', '̃':'\\widetilde', '̄':'\\overline', '̇':'\\dot' };
    if (i + 1 < chars.length && accentCommands[chars[i + 1]]) {
      const base = pdfTextToLatex(ch);
      out += `${accentCommands[chars[i + 1]]}{${base}}`;
      i += 1;
      continue;
    }
    if (superscriptMap.has(ch)) {
      let group = '';
      while (i < chars.length && superscriptMap.has(chars[i])) { group += superscriptMap.get(chars[i]); i += 1; }
      i -= 1; out += `^{${group}}`; continue;
    }
    if (subscriptMap.has(ch)) {
      let group = '';
      while (i < chars.length && subscriptMap.has(chars[i])) { group += subscriptMap.get(chars[i]); i += 1; }
      i -= 1; out += `_{${group}}`; continue;
    }
    if (latexSymbolMap.has(ch)) { out += latexSymbolMap.get(ch); continue; }
    const styled = vectorUnicodeStyleLatex(ch);
    if (styled) {
      if (styled.length === 1 && latexSymbolMap.has(styled)) out += latexSymbolMap.get(styled);
      else if (/^[α-ωΑ-Ωφϕϑϖϱς]$/u.test(styled) && latexSymbolMap.has(styled)) out += latexSymbolMap.get(styled);
      else out += styled;
      continue;
    }
    if (ch === '−' || ch === '–') { out += '-'; continue; }
    if (ch === ' ') { out += ' '; continue; }
    if (ch === '̸') { out += '\\not '; continue; }
    if (ch === '%') { out += '\\%'; continue; }
    if (ch === '#') { out += '\\#'; continue; }
    if (ch === '&') { out += '\\&'; continue; }
    if (ch === '$') { out += '\\$'; continue; }
    out += ch;
  }
  return out
    .replace(/[ \t]+/g, ' ')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\\([A-Za-z]+) +(?=[,.;:!?)}\]])/g, '\\$1')
    .replace(/\\not\s*=/g, '\\ne ')
    .trim();
}

function refreshSelectionUI() {
  const has = Boolean(currentSelection?.text);
  if (has && selectionToolbarLabel) selectionToolbarLabel.textContent = t(`Page ${currentSelection.page}`, `第 ${currentSelection.page} 页`);
  const replacingStructure = Boolean(pendingOutlineReselectKey);
  const label = replacingStructure ? t('Replace', '替换') : t('Structure', '结构');
  if (floatingStructure) {
    floatingStructure.textContent = label;
    floatingStructure.dataset.en = replacingStructure ? 'Replace' : 'Structure';
    floatingStructure.dataset.zh = replacingStructure ? '替换' : '结构';
  }
}

function hideSelectionToolbar() {
  selectionToolbar.classList.add('is-hidden');
}

function positionSelectionToolbar(rect) {
  selectionToolbar.classList.remove('is-hidden');
  const margin = 8;
  const toolbarRect = selectionToolbar.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - toolbarRect.width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - toolbarRect.width - margin));
  let top = rect.top - toolbarRect.height - margin;
  if (top < 64) top = Math.min(window.innerHeight - toolbarRect.height - margin, rect.bottom + margin);
  selectionToolbar.style.left = `${Math.round(left)}px`;
  selectionToolbar.style.top = `${Math.round(top)}px`;
}


function normalizedSelectionRects(range, layer) {
  if (!range || !layer) return [];
  const layerRect = layer.getBoundingClientRect();
  if (!layerRect.width || !layerRect.height) return [];
  const out = [];
  for (const rect of Array.from(range.getClientRects())) {
    const left = Math.max(rect.left, layerRect.left);
    const top = Math.max(rect.top, layerRect.top);
    const right = Math.min(rect.right, layerRect.right);
    const bottom = Math.min(rect.bottom, layerRect.bottom);
    if (right - left < 1 || bottom - top < 1) continue;
    out.push({
      x: (left - layerRect.left) / layerRect.width,
      y: (top - layerRect.top) / layerRect.height,
      w: (right - left) / layerRect.width,
      h: (bottom - top) / layerRect.height
    });
  }
  return out.slice(0, 80);
}

function normalizeAnnotations(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item && Number(item.page) >= 1 && ['highlight','margin'].includes(item.type)).map((item, index) => ({
    id: item.id || `ann-${Number(item.created) || Date.now()}-${index}`,
    type: item.type,
    page: Number(item.page),
    text: typeof item.text === 'string' ? item.text : '',
    latex: typeof item.latex === 'string' ? item.latex : '',
    note: typeof item.note === 'string' ? item.note : '',
    rects: Array.isArray(item.rects) ? item.rects.map((r) => ({ x:Number(r.x)||0, y:Number(r.y)||0, w:Number(r.w)||0, h:Number(r.h)||0 })).filter((r) => r.w > 0 && r.h > 0).slice(0,80) : [],
    ratio: Math.min(1, Math.max(0, Number(item.ratio) || Number(item.rects?.[0]?.y) || 0)),
    created: Number(item.created) || Date.now()
  })).filter((item) => item.rects.length || Number.isFinite(item.ratio));
}

function annotationLayerForSurface(surface, kind = 'primary') {
  if (!surface) return null;
  if (surface === primaryPageSurface) return primaryAnnotationLayer;
  if (surface === referencePageSurface) return referenceAnnotationLayer;
  return surface.querySelector('.annotation-layer');
}

function renderAnnotationsForPage(page, surface, kind = 'primary') {
  const layer = annotationLayerForSurface(surface, kind);
  if (!layer) return;
  layer.replaceChildren();
  layer.dataset.page = String(page);
  for (const item of annotations.filter((ann) => Number(ann.page) === Number(page))) {
    if (item.type === 'highlight') {
      for (const r of item.rects) {
        const mark = document.createElement('div');
        mark.className = 'annotation-highlight';
        mark.style.left = `${r.x * 100}%`; mark.style.top = `${r.y * 100}%`;
        mark.style.width = `${r.w * 100}%`; mark.style.height = `${r.h * 100}%`;
        mark.title = item.note || item.text;
        layer.append(mark);
      }
    } else if (item.type === 'margin') {
      const marker = document.createElement('button');
      marker.type = 'button'; marker.className = 'annotation-margin-marker';
      marker.style.top = `${Math.min(.97, Math.max(0, item.ratio)) * 100}%`;
      marker.title = item.note || item.text || t('Margin note', '页边注');
      marker.setAttribute('aria-label', t(`Margin note on page ${item.page}`, `第 ${item.page} 页页边注`));
      marker.addEventListener('click', () => { openRightSectionShortcut('annotations-section'); });
      layer.append(marker);
    }
  }
}

function rerenderVisibleAnnotations() {
  if (!pdfDoc) return;
  if (readingFlow === 'continuous') {
    for (const [page, record] of continuousPageNodes) if (record.rendered) renderAnnotationsForPage(page, record.surface, 'continuous');
  } else renderAnnotationsForPage(currentPage, primaryPageSurface, 'primary');
  if (pinnedPage) renderAnnotationsForPage(pinnedPage, referencePageSurface, 'reference');
}

function addSelectionAnnotation(type) {
  if (!pdfDoc || !currentSelection?.text || !currentSelection.rects?.length || !['highlight','margin'].includes(type)) return;
  const item = {
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    type, page: Number(currentSelection.page), text: currentSelection.text, latex: currentSelection.latex || '', note: '',
    rects: currentSelection.rects.map((r) => ({...r})), ratio: Number(currentSelection.ratio) || Number(currentSelection.rects[0]?.y) || 0,
    created: Date.now()
  };
  annotations.push(item);
  persistDocumentState(); renderAnnotationList(); rerenderVisibleAnnotations();
  if (type === 'margin') autoOpenRightSection('annotations-section');
}

async function appendAnnotationToPageNote(item) {
  if (!item || !pdfDoc) return;
  const page = Math.min(Math.max(1, Number(item.page) || currentPage || 1), pdfDoc.numPages);
  const position = `${Math.round((Number(item.ratio) || 0) * 100)}%`;
  const quoted = String(item.text || item.latex || '').split('\n').map((line) => `> ${line}`).join('\n');
  const meta = t(`Page ${page} · position ${position}`, `第 ${page} 页 · 位置 ${position}`);
  const block = `${meta}\n${quoted}${item.note?.trim() ? `\n\n${item.note.trim()}` : ''}`;
  const existing = notes[String(page)] || '';
  notes[String(page)] = `${existing}${existing.trim() ? '\n\n' : ''}${block}`;
  refreshVisiblePageNote(page);
  persistDocumentState();
  autoOpenRightSection('note-section');
}

function renderAnnotationList() {
  if (!annotationList || !annotationEmpty || !annotationCount) return;
  annotationList.replaceChildren();
  annotationCount.textContent = String(annotations.length);
  annotationEmpty.classList.toggle('is-hidden', annotations.length > 0);
  const ordered = [...annotations].sort((a,b) => a.page - b.page || a.ratio - b.ratio || a.created - b.created);
  for (const item of ordered) {
    const row = document.createElement('div'); row.className = 'annotation-item'; row.dataset.annotationId = item.id;
    const head = document.createElement('div'); head.className = 'annotation-item-head';
    const kind = document.createElement('span'); kind.className = 'annotation-kind'; kind.textContent = item.type === 'highlight' ? t('Highlight','高亮') : t('Margin note','页边注');
    const page = document.createElement('span'); page.className = 'annotation-page'; page.textContent = t(`Page ${item.page}`, `第 ${item.page} 页`);
    head.append(kind,page);
    const quote = document.createElement('p'); quote.className = 'annotation-quote'; quote.textContent = item.text || item.latex || '';
    row.append(head, quote);
    if (item.type === 'margin') {
      const input = document.createElement('textarea'); input.className = 'annotation-note-input'; input.placeholder = t('Write a margin note…','写页边注……'); input.value = item.note || '';
      input.addEventListener('input', () => { item.note = input.value; clearTimeout(annotationSaveTimer); annotationSaveTimer = setTimeout(() => { persistDocumentState(); rerenderVisibleAnnotations(); }, 250); });
      row.append(input);
    }
    const actions = document.createElement('div'); actions.className = 'annotation-actions';
    const jump = document.createElement('button'); jump.type='button'; jump.textContent=t('Jump','跳转'); jump.addEventListener('click',()=>goToMatchedLocation(item.page,item.ratio,item.text || item.latex || ''));
    const promote = document.createElement('button'); promote.type='button'; promote.textContent=t('Add to page note','加入页注'); promote.addEventListener('click',()=>appendAnnotationToPageNote(item));
    const remove = document.createElement('button'); remove.type='button'; remove.textContent=t('Delete','删除'); remove.addEventListener('click',()=>{ pushUndo('annotation', item.type === 'highlight' ? t('Highlight','高亮') : t('Margin note','页边注'), item); annotations=annotations.filter((ann)=>ann.id!==item.id); persistDocumentState(); renderAnnotationList(); rerenderVisibleAnnotations(); });
    actions.append(jump,promote,remove); row.append(actions); annotationList.append(row);
  }
  renderDocumentMapAnnotations();
  renderDocumentMetadata();
}

function capturePdfSelection() {
  clearTimeout(selectionTimer);
  selectionTimer = setTimeout(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { hideSelectionToolbar(); return; }
    const range = sel.getRangeAt(0);
    const startLayer = selectionLayerForNode(range.startContainer);
    const endLayer = selectionLayerForNode(range.endContainer);
    if (!startLayer || startLayer !== endLayer) { hideSelectionToolbar(); return; }
    const text = sel.toString().replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim();
    if (!text) { hideSelectionToolbar(); return; }
    const page = Number(startLayer.dataset.page || 0);
    if (!page) { hideSelectionToolbar(); return; }
    const rects = normalizedSelectionRects(range, startLayer);
    currentSelection = { text, latex: pdfTextToLatex(text), page, kind: startLayer.dataset.kind || (startLayer === referenceTextLayer ? 'reference' : 'primary'), rects, ratio: Number(rects[0]?.y) || 0 };
    refreshSelectionUI();
    // Text selection must remain local to the PDF. Update Selection state and
    // the floating toolbar, but do not automatically reveal/navigate to the
    // right-side Selection section; opening it is an explicit user action.
    persistDocumentState();
    const rect = range.getBoundingClientRect();
    if (rect.width || rect.height) positionSelectionToolbar(rect);
  }, 20);
}

async function copyPlainText(text, button = null) {
  const value = String(text || '');
  if (!value) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else throw new Error('clipboard unavailable');
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = value; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
  }
  if (button) {
    const old = button.textContent;
    button.textContent = t('Copied', '已复制');
    setTimeout(() => { button.textContent = old; }, 900);
  }
}

function outlineEntryFromSelection(selection) {
  const text = String(selection?.text || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return {
    title: text.slice(0, 180),
    matchText: text.slice(0, 1200),
    page: Number(selection.page),
    ratio: Number(selection.ratio) || 0,
    depth: 0,
    userEdited: true
  };
}

function outlineEntryKey(entry) {
  return [
    Number(entry?.page) || 0,
    Math.round((Number(entry?.ratio) || 0) * 10000),
    String(entry?.title || '').trim().toLocaleLowerCase()
  ].join(':');
}

function equationLabelFromSelectionText(value) {
  const raw = String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!raw || raw.length > 32) return null;
  const normalized = normalizeEquationTagCommands(raw);
  const match = normalized.match(/^\(\s*([^()]+?)\s*\)$/);
  if (!match) return null;
  const rawInner = String(match[1] || '');
  const numericInner = compactNumericEquationTagInner(rawInner);
  if (isPlausibleNumericEquationTagInner(numericInner)) {
    const label = normalizedEquationLabel(`(${numericInner})`);
    return isLikelyCalendarYearEquationLabel(label) ? null : label;
  }
  const symbolicInner = rawInner.replace(/\s+/g, '');
  if (isSymbolicEquationTagInner(symbolicInner)) return normalizedEquationLabel(`(${symbolicInner})`);
  return null;
}

function equationEditForSourceLabel(label) {
  const key = normalizedEquationLabel(label);
  return equationEdits.find((item) => normalizedEquationLabel(item.sourceLabel) === key) || null;
}

function equationSourceLabelForDisplayed(label) {
  const key = normalizedEquationLabel(label);
  const reselect = equationEdits.find((item) => item.action === 'reselect' && normalizedEquationLabel(item.label || item.sourceLabel) === key);
  return reselect ? reselect.sourceLabel : label;
}

function applyEquationEdits(index) {
  const out = new Map(index || []);
  for (const edit of equationEdits) {
    if (edit.action === 'add') continue;
    const source = normalizedEquationLabel(edit.sourceLabel);
    out.delete(source);
    if (edit.action !== 'reselect') continue;
    const target = normalizedEquationLabel(edit.label || edit.sourceLabel);
    out.set(target, [{
      page: Number(edit.page) || 1, ratio: Math.min(1, Math.max(0, Number(edit.ratio) || 0)),
      text: String(edit.text || target), xStartRatio: Number(edit.xStartRatio) || 0, xEndRatio: Number(edit.xEndRatio) || 0,
      confidence: 100, manualReselect: true,
    }]);
  }
  for (const edit of equationEdits) {
    if (edit.action !== 'add') continue;
    const target = normalizedEquationLabel(edit.label || '');
    if (!target || target === '()') continue;
    out.set(target, [{
      page: Number(edit.page) || 1, ratio: Math.min(1, Math.max(0, Number(edit.ratio) || 0)),
      text: String(edit.text || target), confidence: 100, manualAdd: true, manualEditId: String(edit.id || ''),
      afterRef: String(edit.afterRef || ''), beforeRef: String(edit.beforeRef || ''), placement: edit.placement === 'above' ? 'above' : 'below',
    }]);
  }
  return out;
}

function equationEditTargetFromPending(ref) {
  if (!ref) return null;
  if (String(ref).startsWith('edit:')) return equationEdits.find((item) => item.action === 'add' && String(item.id) === String(ref).slice(5)) || null;
  return null;
}

function equationOrderKeyFromRef(ref) {
  const value = String(ref || '');
  if (!value) return '';
  if (value.startsWith('edit:')) return value;
  const displayed = value.replace(/^label:/, '');
  const source = equationSourceLabelForDisplayed(displayed);
  return `label:${normalizedEquationLabel(source || displayed)}`;
}

function insertEquationManualOrderAfter(sourceRef, newEditId) {
  const sourceKey = equationOrderKeyFromRef(sourceRef);
  const newKey = `edit:${String(newEditId || '')}`;
  if (!sourceKey || newKey === 'edit:') return false;
  const order = [];
  const seen = new Set();
  for (const rawKey of equationManualOrder || []) {
    const key = String(rawKey || '');
    if (!key || key === newKey || seen.has(key)) continue;
    seen.add(key);
    order.push(key);
  }
  const sourceIndex = order.indexOf(sourceKey);
  if (sourceIndex < 0) return false;
  order.splice(sourceIndex + 1, 0, newKey);
  equationManualOrder = order;
  return true;
}

function applyEquationLinkCorrection(query, page, ratio) {
  const label = equationLabelFromSelectionText(query);
  if (!label) return false;
  if (pendingEquationReselectKey) {
    const existingAdd = equationEditTargetFromPending(pendingEquationReselectKey);
    if (existingAdd) { existingAdd.label = label; existingAdd.page = Number(page) || 1; existingAdd.ratio = Number(ratio) || 0; existingAdd.text = query; }
    else {
      const sourceLabel = equationSourceLabelForDisplayed(String(pendingEquationReselectKey).replace(/^label:/,''));
      equationEdits = equationEdits.filter((item) => !(item.action !== 'add' && normalizedEquationLabel(item.sourceLabel) === normalizedEquationLabel(sourceLabel)));
      equationEdits.push({ action:'reselect', sourceLabel, label, page:Number(page)||1, ratio:Number(ratio)||0, text:query });
    }
    pendingEquationReselectKey = null;
  } else if (pendingEquationAddKey) {
    const sourceLabel = pendingEquationDisplayedLabel(pendingEquationAddKey);
    if (sourceLabel && normalizedEquationLabel(label) === normalizedEquationLabel(sourceLabel)) {
      showError(t('Choose a different equation for Add.', '添加时请选择另一个公式。'));
      return true;
    }
    const id = `eqadd-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const anchorRef = String(pendingEquationAddKey);
    const placement = 'below';
    equationEdits.push({
      action:'add', id, sourceLabel:anchorRef,
      afterRef:anchorRef, placement, label, page:Number(page)||1, ratio:Number(ratio)||0, text:query
    });
    insertEquationManualOrderAfter(anchorRef, id);
    pendingEquationAddKey = null;
    } else return false;
  equationLabelIndex = null; equationNumberingSide = 'right'; equationIndexBuildPromise = null; equationIndexKnownCount = null;
  persistDocumentState(); refreshSelectionUI(); ensureEquationIndexRendered();
  return true;
}

function pendingEquationDisplayedLabel(ref) {
  if (!ref) return null;
  const existingAdd = equationEditTargetFromPending(ref);
  if (existingAdd) return normalizedEquationLabel(existingAdd.label || '');
  const source = String(ref).replace(/^label:/, '');
  const sourceLabel = equationSourceLabelForDisplayed(source);
  const currentEdit = equationEdits.find((item) => item.action === 'reselect' && normalizedEquationLabel(item.sourceLabel) === normalizedEquationLabel(sourceLabel));
  return normalizedEquationLabel(currentEdit?.label || sourceLabel || source);
}

function equationLabelsInTextLine(text) {
  const out = [];
  const seen = new Set();
  for (const candidate of equationLabelCandidatesInLine(text)) {
    const label = normalizedEquationLabel(candidate.label);
    if (!seen.has(label)) { seen.add(label); out.push({ ...candidate, label }); }
  }
  const value = normalizeEquationTagCommands(String(text || '').normalize('NFKC'));
  for (const match of value.matchAll(/\([^()]{1,32}\)/g)) {
    const label = equationLabelFromSelectionText(match[0]);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, index: match.index || 0, end: (match.index || 0) + match[0].length });
  }
  return out;
}

async function equationLabelNearPagePoint(pageNum, ratio, excludeLabel = null) {
  const page = Math.max(1, Number(pageNum) || 1);
  const targetRatio = Math.min(1, Math.max(0, Number(ratio) || 0));
  const excluded = excludeLabel ? normalizedEquationLabel(excludeLabel) : null;
  const lines = await pageTextLines(page);
  let best = null;
  for (const line of lines) {
    const distance = Math.abs((Number(line.ratio) || 0) - targetRatio);
    if (distance > 0.065) continue;
    const candidates = equationLabelsInTextLine(line.text);
    if (!candidates.length) continue;
    const textLength = Math.max(1, String(line.text || '').length);
    const lineStart = Number(line.xStartRatio) || 0;
    const lineEnd = Number(line.xEndRatio) || lineStart;
    const span = Math.max(0, lineEnd - lineStart);
    for (const candidate of candidates) {
      if (excluded && normalizedEquationLabel(candidate.label) === excluded) continue;
      const start = lineStart + span * Math.min(1, Math.max(0, Number(candidate.index || 0) / textLength));
      const end = lineStart + span * Math.min(1, Math.max(0, Number(candidate.end || candidate.index || 0) / textLength));
      const marginBonus = equationNumberingSide === 'left'
        ? (start <= 0.24 ? 0.018 : 0)
        : (end >= 0.72 ? 0.018 : 0);
      const score = distance - marginBonus;
      if (!best || score < best.score) best = { label:candidate.label, text:String(line.text || candidate.label), ratio:Number(line.ratio)||targetRatio, score };
    }
  }
  return best;
}

async function applyEquationPointCorrection(pageNum, ratio) {
  if (!pendingEquationReselectKey && !pendingEquationAddKey) return false;
  const page = Math.max(1, Number(pageNum) || 1);
  const anchorRatio = Math.min(1, Math.max(0, Number(ratio) || 0));
  const addSourceLabel = pendingEquationAddKey ? pendingEquationDisplayedLabel(pendingEquationAddKey) : null;
  const nearby = await equationLabelNearPagePoint(page, anchorRatio, addSourceLabel);

  if (pendingEquationReselectKey) {
    const existingAdd = equationEditTargetFromPending(pendingEquationReselectKey);
    const fallbackLabel = pendingEquationDisplayedLabel(pendingEquationReselectKey);
    const label = nearby?.label || fallbackLabel;
    if (!label) return false;
    if (existingAdd) {
      existingAdd.label = label;
      existingAdd.page = page;
      existingAdd.ratio = anchorRatio;
      existingAdd.text = nearby?.text || label;
    } else {
      const sourceLabel = equationSourceLabelForDisplayed(String(pendingEquationReselectKey).replace(/^label:/,''));
      equationEdits = equationEdits.filter((item) => !(item.action !== 'add' && normalizedEquationLabel(item.sourceLabel) === normalizedEquationLabel(sourceLabel)));
      equationEdits.push({ action:'reselect', sourceLabel, label, page, ratio:anchorRatio, text:nearby?.text || label });
    }
    pendingEquationReselectKey = null;
  } else if (pendingEquationAddKey) {
    let addedLabel = nearby?.label || null;
    if (!addedLabel) {
      const typed = window.prompt(t(
        'Equation label for this point (for example (12.45), (7), (*), or (†)):',
        '请输入该位置的公式编号（例如 (12.45)、(7)、(*) 或 (†)）：'
      ), '');
      if (typed == null || !String(typed).trim()) return true;
      addedLabel = equationLabelFromSelectionText(typed);
      if (!addedLabel) {
        showError(t('Enter only a short equation label such as (12.45), (7), (*), or (†).', '只能输入简短的公式编号，例如 (12.45)、(7)、(*) 或 (†)。'));
        return true;
      }
    }
    if (addSourceLabel && normalizedEquationLabel(addedLabel) === normalizedEquationLabel(addSourceLabel)) {
      showError(t('Add must use a different equation label from the source equation.', '新增公式的编号必须与当前公式不同。'));
      return true;
    }
    const id = `eqadd-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const anchorRef = String(pendingEquationAddKey);
    const placement = 'below';
    equationEdits.push({
      action:'add', id, sourceLabel:anchorRef,
      afterRef:anchorRef, placement, label:addedLabel, page, ratio:anchorRatio, text:nearby?.text || addedLabel
    });
    insertEquationManualOrderAfter(anchorRef, id);
    pendingEquationAddKey = null;
    }

  equationLabelIndex = null;
  equationNumberingSide = 'right';
  equationIndexBuildPromise = null;
  equationIndexKnownCount = null;
  persistDocumentState();
  refreshSelectionUI();
  ensureEquationIndexRendered();
  return true;
}

function equationPointFromClick(event, surface, pageNum) {
  if (!surface) return null;
  const rect = surface.getBoundingClientRect();
  if (!rect.height) return null;
  return {
    page: Math.max(1, Number(pageNum) || 1),
    ratio: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  };
}

primaryPageSurface?.addEventListener('click', async (event) => {
  if (!pendingEquationReselectKey && !pendingEquationAddKey) return;
  if (event.target?.closest?.('button, a, .pdf-reference-link')) return;
  const point = equationPointFromClick(event, primaryPageSurface, currentPage);
  if (!point) return;
  event.preventDefault();
  event.stopPropagation();
  await applyEquationPointCorrection(point.page, point.ratio);
});

continuousStack?.addEventListener('click', async (event) => {
  if (!pendingEquationReselectKey && !pendingEquationAddKey) return;
  if (event.target?.closest?.('button, a, .pdf-reference-link')) return;
  const surface = event.target?.closest?.('.continuous-page-surface');
  if (!surface) return;
  const frame = surface.closest('.continuous-page-frame');
  const pageNum = Number(frame?.dataset?.page || surface.querySelector('.textLayer')?.dataset?.page || 0);
  const point = equationPointFromClick(event, surface, pageNum);
  if (!point) return;
  event.preventDefault();
  event.stopPropagation();
  await applyEquationPointCorrection(point.page, point.ratio);
});

function replaceEquationFromCurrentSelection() {
  if (!pendingEquationReselectKey || !currentSelection?.text) return false;
  const selectedLabel = equationLabelFromSelectionText(currentSelection.text);
  if (!selectedLabel) {
    showError(t('Select only a short equation label such as (12.45), (7), (*), or (†).', '只能选择简短的公式编号，例如 (12.45)、(7)、(*) 或 (†)。'));
    return true;
  }
  const sourceLabel = equationSourceLabelForDisplayed(pendingEquationReselectKey);
  equationEdits = equationEdits.filter((item) => normalizedEquationLabel(item.sourceLabel) !== normalizedEquationLabel(sourceLabel));
  const rect = Array.isArray(currentSelection.rects) ? currentSelection.rects[0] : null;
  equationEdits.push({
    action: 'reselect', sourceLabel, label: selectedLabel,
    page: Number(currentSelection.page), ratio: Number(currentSelection.ratio) || 0,
    text: currentSelection.text,
    xStartRatio: Number(rect?.x) || 0,
    xEndRatio: (Number(rect?.x) || 0) + (Number(rect?.w) || 0),
  });
  pendingEquationReselectKey = null;
  if (equationLabelIndex) equationLabelIndex = applyEquationEdits(equationLabelIndex);
  persistDocumentState();
  renderEquationIndex();
  refreshSelectionUI();
  return true;
}

function addOrReplaceSelectionStructureItem() {
  if (!pdfDoc || !currentSelection?.text) return;
  if (pendingEquationReselectKey || pendingEquationAddKey) return;
  const selected = outlineEntryFromSelection(currentSelection);
  if (!selected) return;
  if (outlineMode === 'embedded' && pendingOutlineReselectKey?.startsWith('embedded:')) {
    const sourceKey = pendingOutlineReselectKey.slice('embedded:'.length);
    embeddedOutlineEdits = embeddedOutlineEdits.filter((item) => String(item.sourceKey) !== String(sourceKey));
    embeddedOutlineEdits.push({
      action:'reselect', sourceKey, title:selected.title, matchText:selected.matchText,
      page:selected.page, ratio:selected.ratio,
    });
    pendingOutlineReselectKey = null;
    persistDocumentState();
    renderEmbeddedOutline(embeddedOutlineEntries);
    rerenderReferenceLinksAfterStructureEdit();
    refreshSelectionUI();
    return;
  }
  if (outlineMode === 'embedded') {
    showError(t('Use Reselect on an existing Structure item; embedded outlines do not support adding new items.', '请对现有结构条目使用“重新选择”；PDF 内嵌目录不支持新增条目。'));
    return;
  }
  if (pendingOutlineReselectKey) {
    const index = inferredOutline.findIndex((entry) => outlineEntryKey(entry) === pendingOutlineReselectKey);
    if (index < 0) {
      pendingOutlineReselectKey = null;
      refreshSelectionUI();
      showError(t('The Structure item being replaced no longer exists. Reselect it from Structure and try again.', '要替换的结构条目已不存在。请从结构列表重新选择后再试。'));
      return;
    }
    selected.depth = Number(inferredOutline[index]?.depth) || 0;
    inferredOutline[index] = selected;
    pendingOutlineReselectKey = null;
  } else {
    inferredOutline.push(selected);
  }
  inferredOutline.sort((a, b) => Number(a.page) - Number(b.page) || Number(a.ratio) - Number(b.ratio));
  inferredOutline = inferredOutline.slice(0, 240);
  inferredOutlineDetectionDone = true;
  tocOutlineTargets = null;
  persistDocumentState();
  renderInferredOutline(inferredOutline);
  rerenderReferenceLinksAfterStructureEdit();
  refreshSelectionUI();
}


function addSelectionToPageNote() {
  if (!pdfDoc || !currentSelection?.text) return;
  const page = currentSelection.page;
  const position = `${Math.round((Number(currentSelection.ratio) || 0) * 100)}%`;
  const quoted = currentSelection.text.split('\n').map((line) => `> ${line}`).join('\n');
  const meta = t(`Page ${page} · position ${position}`, `第 ${page} 页 · 位置 ${position}`);
  const existing = notes[String(page)] || '';
  notes[String(page)] = `${existing}${existing.trim() ? '\n\n' : ''}${meta}\n${quoted}`;
  refreshVisiblePageNote(page);
  persistDocumentState();
}

function sourceDocumentUsesOcr(pageNum) {
  return documentOcrActive && documentOcrPages.has(Number(pageNum));
}

