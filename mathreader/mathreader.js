// MathReader bootstrap.
//
// The application remains one logical ES module so lexical state, declaration
// hoisting, and initialization order stay identical to the pre-partition monolith. The
// source is split only for maintenance: parts are fetched in parallel, assembled
// in their original order, and imported once. No part executes independently.

const VERSION = '308';
const PARTS = [
  'js/00-core.js',
  'js/10-formula-ocr.js',
  'js/11-formula-vector.js',
  'js/20-selection-annotations.js',
  'js/30-rendering-navigation.js',
  'js/40-outline-structure.js',
  'js/41-equations-bibliography.js',
  'js/50-references-search.js',
  'js/60-notes-bookmarks-data.js',
  'js/70-command-ui-runtime.js',
];

async function fetchPart(path) {
  const url = new URL(`${path}?v=${VERSION}`, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load MathReader source part: ${path} (${response.status})`);
  return response.text();
}

async function startMathReader() {
  const sources = await Promise.all(PARTS.map(fetchPart));
  const runtimeSource = `${sources.join('\n')}\n//# sourceURL=mathreader-runtime-v${VERSION}.js\n`;
  const runtimeUrl = URL.createObjectURL(new Blob([runtimeSource], { type: 'text/javascript' }));
  try {
    await import(runtimeUrl);
    window.dispatchEvent(new CustomEvent('mathreader:ready'));
  } finally {
    URL.revokeObjectURL(runtimeUrl);
  }
}

startMathReader().catch((error) => {
  console.error('MathReader failed to start.', error);
  const banner = document.getElementById('error-banner');
  if (banner) {
    const zh = document.documentElement.dataset.lang === 'zh';
    banner.textContent = zh
      ? 'MathReader 启动失败。请刷新页面后重试。'
      : 'MathReader failed to start. Reload the page and try again.';
    banner.classList.remove('is-hidden');
  }
});
