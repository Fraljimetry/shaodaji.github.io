// MathReader v352. No external dependency needed for structural checks.
// If mathjax-full is installed, compile EVERY output using MathJax's TeX parser.
// The corpus is curated and synthetic: this is not Texify image-inference accuracy.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'js/10-formula-ocr.js'), 'utf8');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'regression/formula_syntax_v352.json'), 'utf8'));
const needed = ['normalizeOcrLatex', 'repairOcrLatex', 'repairLatexInnerTags', 'repairLatexSpecialCharacters', 'repairOcrMisplacedAlignmentTabs', 'stabilizeOcrLatexSyntax'];
const pieces = needed.map(name => {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} exists in actual runtime`);
  const end = src.indexOf('\nfunction ', start + 1);
  return src.slice(start, end < 0 ? src.length : end);
});
const ctx = vm.createContext({});
vm.runInContext(pieces.join('\n'), ctx);
const normalize = latex => vm.runInContext(`stabilizeOcrLatexSyntax(repairOcrLatex(${JSON.stringify(latex)}))`, ctx);
let checks = 0, compiled = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
let compiler = null;
try {
  const {mathjax} = require('mathjax-full/js/mathjax.js');
  const {TeX} = require('mathjax-full/js/input/tex.js');
  const {SVG} = require('mathjax-full/js/output/svg.js');
  const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
  const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
  const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages.js');
  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const tex = new TeX({packages: AllPackages});
  const doc = mathjax.document('', {InputJax: tex, OutputJax: new SVG({fontCache:'none'})});
  compiler = source => {
    // MathJax may return a rendered error node without rejecting a promise.
    const html = adaptor.outerHTML(doc.convert(source, {display: true}));
    return !/(?:mjx-merror|<merror|data-mjx-error)/.test(html);
  };
} catch (error) {
  if (error?.code !== 'MODULE_NOT_FOUND') throw error;
  console.warn('UNVERIFIED: mathjax-full unavailable; only built-in structural checks ran');
}
function mustCompile(latex, label) {
  check(Boolean(latex), `${label}: nonempty`);
  check(!/(^|[^\\])&/.test(latex.replace(/\\begin\{(?:aligned|alignedat|array|cases|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|split)\}/g, '')), `${label}: no naked top-level tabs (contextual cases checked below)`);
  if (compiler) { check(compiler(latex), `${label}: MathJax compilation\n${latex}`); compiled++; }
}
// Reference structures spanning elementary to current technical literature.
check(fixture.cases.length >= 120, 'broad 120+ reference formula corpus');
for (const {id, latex} of fixture.cases) {
  const output = normalize(latex);
  check(output.length > 0, `${id}: produced output`);
  check(!output.includes('\uFFFD'), `${id}: no replacement codepoint`);
  if (compiler) { check(compiler(output), `${id}: real MathJax compile: ${output}`); compiled++; }
  // Syntax cleanup should be stable under repeated calls, not mutate user math.
  check(normalize(output) === output, `${id}: idempotent postprocessing`);
}
const literal = String.raw;
const user = literal`\begin{aligned}
\int_{|z|\,&=\,r}\frac{e^{-i\theta}\,+\,\bar{z}}{e^{-i\theta}\,-\,\bar{z}}\,\frac{e^{i\theta^{\prime}}}{(e^{i\theta^{\prime}}\,-\,z)^{2}}\,dz\,=\,\int_{|z|\,=\,r}\frac{(z\,+\,r^{2}e^{i\theta})e^{i\theta^{\prime}}}{(z\,-\,r^{2}e^{i\theta})(e^{i\theta^{\prime}}\,-\,z)^{2}}\,dz \\
&=\,2\pi i\,\frac{2r^{2}e^{i(\theta+\theta^{\prime})}}{(e^{i\theta^{\prime}}\,-\,r^{2}e^{i\theta})^{2}}\end{aligned}`;
const fixed = normalize(user);
check(!fixed.includes('\\,&='), 'user regression: inside-subscript tab removed');
check(fixed.includes('\\int_{|z|\\,=\\,r}'), 'user regression: true subscript equation preserved');
check(fixed.includes('\\\\\n&='), 'user regression: legitimate next-row alignment retained');
check(fixed.includes('e^{i(\\theta+\\theta^{\\prime})}'), 'user regression: no mathematical content discarded');
if (compiler) { check(compiler(fixed), 'user-reported exact problem compiles'); compiled++; }
// Full verbatim user-reported output, including the mathematically suspect
// trailing "-2". Syntax repair MUST NOT guess whether that was an exponent.
const fullUser = literal`\begin{aligned}
\int_{|z|\,&=\,r}\frac{e^{-i\theta}\,+\,\bar{z}}{e^{-i\theta}\,-\,\bar{z}}\,\frac{e^{i\theta^{\prime}}}{(e^{i\theta^{\prime}}\,-\,z)^{2}}\,dz\,=\,\int_{|z|\,=\,r}\frac{(z\,+\,r^{2}e^{i\theta})e^{i\theta^{\prime}}}{(z\,-\,r^{2}e^{i\theta})(e^{i\theta^{\prime}}\,-\,z)^{2}}\,dz \\
&=\,2\pi i\,\frac{2r^{2}e^{i(\theta+\theta^{\prime})}}{(e^{i\theta^{\prime}}\,-\,r^{2}e^{i\theta})^{2}}\,=\,4\pi ir^{2}(e^{i(\theta^{\prime}-\theta)/2}\,-\,r^{2}e^{i(\theta-\theta^{\prime})/2})-2,
\end{aligned}`;
const fullFixed = normalize(fullUser);
check(!fullFixed.includes('\\,&='), 'verbatim output: bad & removed');
check(fullFixed.endsWith('-2,\n\\end{aligned}'), 'verbatim output: ambiguous -2 is preserved for manual verification');
if (compiler) {check(compiler(fullFixed), 'verbatim user output renders without MathJax syntax error');compiled++;}
// Precise exceptions: valid nested environments, literal escaped ampersands,
// and textual ampersands must not be stripped.
const good = [
  [literal`\begin{aligned}a&=b\\c&=d\end{aligned}`, literal`\begin{aligned}a&=b\\c&=d\end{aligned}`],
  [literal`\begin{cases}x&i=1\\y&i=2\end{cases}`, literal`\begin{cases}x&i=1\\y&i=2\end{cases}`],
  [literal`\begin{pmatrix}a&b\\c&d\end{pmatrix}`, literal`\begin{pmatrix}a&b\\c&d\end{pmatrix}`],
  [literal`\begin{array}{cc}1&2\\3&4\end{array}`, literal`\begin{array}{cc}1&2\\3&4\end{array}`],
  [literal`\frac{\begin{matrix}1&2\\3&4\end{matrix}}{x^2}`, literal`\frac{\begin{matrix}1&2\\3&4\end{matrix}}{x^2}`],
  [literal`\begin{alignedat}{2}a&=b&\quad c&=d\\e&=f&g&=h\end{alignedat}`, literal`\begin{alignedat}{2}a&=b&\quad c&=d\\e&=f&g&=h\end{alignedat}`],
  [literal`A\&B`, literal`A\&B`],
  [literal`\text{R&D}`, literal`\text{R\&D}`],
  [literal`\operatorname{A&B}`, literal`\operatorname{A\&B}`],
  [literal`\mathrm{R&D}`, literal`\mathrm{R\&D}`],
  [literal`\begin{aligned}\text{R&D}&=1\\x&=2\end{aligned}`, literal`\begin{aligned}\text{R\&D}&=1\\x&=2\end{aligned}`]
];
for (const [original, expected] of good) {
  const output = normalize(original);
  check(output === expected, `valid alignment / text must remain: ${original} => ${output}`);
  if (compiler) {check(compiler(output), `valid alignment compiles: ${output}`);compiled++;}
}
// Mechanically malformed but recoverable output; do not infer missing math.
for (const [raw, expected] of [
  [literal`a&=b`, literal`a=b`],
  [literal`\begin{aligned}x_{i&=j}&=1\\ &=2\end{aligned}`, literal`\begin{aligned}x_{i=j}&=1\\ &=2\end{aligned}`],
  [literal`\begin{aligned}\frac{a&=b}{c}&=d\end{aligned}`, literal`\begin{aligned}\frac{a=b}{c}&=d\end{aligned}`],
  [literal`\begin{aligned}x&=1\tag{2}\\y&=3\end{aligned}`, literal`\begin{aligned}x&=1\qquad(2)\\y&=3\end{aligned}`],
  [literal`\text{rate 25%}`, literal`\text{rate 25\%}`],
  [literal`\text{hash #1}`, literal`\text{hash \#1}`],
  [literal`\begin{aligned}x&=y\\z&=w`, literal`\begin{aligned}x&=y\\z&=w\end{aligned}`]
]) {
  const output = normalize(raw);
  check(output === expected, `repair exactly: ${raw} => ${output}`);
  if (compiler) {check(compiler(output), `repaired source compiles: ${output}`);compiled++;}
}
// Broad systematic index/subscript stress, including preserved valid alignment
// tabs in the same formula. 72 additional inputs, not source PDF transcriptions.
const bases=['x','y','z','u','v','f','g','h','a','b','c','r','t','q','p','n','m','k'];
for (const x of bases) {
  const examples = [
    literal`\begin{aligned}${x}_{i&=j}&=\frac{1}{n}\\&=0\end{aligned}`,
    literal`\begin{cases}${x}_{i&=j}&i>0\\0&i\le0\end{cases}`,
    literal`\frac{${x}_{i&=j}}{\begin{pmatrix}a&b\\c&d\end{pmatrix}}`,
    literal`\begin{aligned}\int_{|${x}|\,&=\,r}\frac{d${x}}{1+${x}^2}&=\pi\\&=2\arctan r\end{aligned}`,
  ];
  for(const raw of examples){
    const output = normalize(raw);
    check(!output.includes('i&=j') && !output.includes('\\,&='), `stray nested tab removed: ${raw}`);
    check(output.includes('&') || output.includes('\\&'), `true table tabs retained: ${raw}`);
    check(normalize(output) === output, 'second pass unchanged');
    if(compiler){check(compiler(output),`systematic math compile: ${output}`);compiled++;}
  }
}
// MathJax parser signals errors via merror nodes rather than necessarily throwing.
check(src.includes("querySelector?.('mjx-merror, merror, .mjx-merror')"), 'preview recognizes MathJax rendered syntax errors');
check(src.includes('showOcrUnrenderablePreview();'), 'preview replaces rendered MathJax errors with a warning');
console.log(`OK: ${checks} formula LaTeX checks${compiler ? `; ${compiled} MathJax compilations` : '; MathJax compilation UNVERIFIED (package absent)'}`);
