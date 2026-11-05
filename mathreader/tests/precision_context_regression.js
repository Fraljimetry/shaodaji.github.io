// MathReader v348: conservative Results/index and equation-label context guards.
// Run from repository root: node mathreader/tests/precision_context_regression.js
// The literal geometry below comes from real PDF page inspections. These
// source-level assertions are not production PDF.js or browser OCR acceptance.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'js', '41-equations-bibliography.js'), 'utf8');
const context = vm.createContext({document: {addEventListener() {}}, console});
vm.runInContext("let equationNumberingSide='right'; const EQUATION_TAG_SYMBOL_CLASS='*∗⋆★☆†‡※◇◆○●◦•△▲▽▼□■♢♦⊙⊗⊕⊖⊥∥';",context);
vm.runInContext(source, context, {timeout: 5000});
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };
const line = (text, ratio, xStartRatio = 0.12, xEndRatio = 0.66) => ({text, ratio, xStartRatio, xEndRatio});
const detect = (lines, i = 0) => context.detectedStructureResult(lines, i, 12);
const indexPage = (lines) => context.structureResultsIndexNavigationPage(lines);
const verticalTicks = (lines, i) => context.bareEquationInVerticalNumericTicks(lines, i);
const sameRow = (lines, i) => context.bareEquationHasSameRowHeadingContext(lines, i);

// Real printed writing textbook p.436 / folio 447. The subject-index headword
// "Definition" is not a mathematical result; verify the page classifier,
// not a filename-specific exclusion.
const subjectIndex = [line('SUBJECT INDEX', .043, .072, .22), line('447', .044, .867, .89),
  line('Dead metaphor, 274, 308 n', .079, .072, .36),
  line('Effects, as a method of paragraph', .080, .514, .86),
  line('Deadwood, 281', .098, .072, .245),
  line('Definition', .117, .072, .183),
  line('multiple, 128', .117, .54, .68),
  ...Array.from({length: 12}, (_, i) => line(`Topic, ${i+115}`, .14 + i*.027, .08, .30))];
check(indexPage(subjectIndex), 'dense SUBJECT INDEX header establishes navigation-only page');
check(source.includes('indexNavigationPage || tocResultRows.has(lineIndex)'), 'page-level index suppression is wired into the Results builder');
check(detect(subjectIndex, 5)?.label === 'Definition · p.12', 'original parser would misread lone Definition without the page guard');
check(!indexPage([line('Index', .05),line('Definition', .15)]), 'short page with Index heading is not suppressed');
check(!indexPage(Array.from({length: 20}, (_, i) => line(i === 2 ? 'Definition' : `Sentence ${i}`, .10+i*.025))), 'headword alone does not identify an index');
check(detect([line('Definition', .21),line('A complete metric space is ...',.24)], 0)?.label === 'Definition · p.12', 'genuine standalone unnumbered Definition still parsed');
check(detect([line('Definition. Let X be a Banach space.', .22)], 0)?.unnumberedResult === true, 'genuine unnumbered mathematical declaration remains');

// Real McGraw-Hill phrase-finder index p.211. A whole-page navigation guard
// prevents "remark I didn't..." from becoming a Roman-numbered Remark I.
const phraseFinder = [line('Phrase-Finder Index', .051, .09, .27),
  ...Array.from({length: 11}, (_, i) => line(`relay entry ${i}`, .10 + i*.032, .37, .64)),
  line('remark I didn’t (quite) catch that (last)', .555, .373, .63)];
check(indexPage(phraseFinder), 'dense Phrase-Finder Index is not mathematical Results content');
check(detect(phraseFinder, 12)?.label === 'Remark I', 'parser ambiguity is reproduced without index-page exclusion');
check(!indexPage([line('Theorem 2.1 Let u be harmonic', .23),...Array.from({length: 14},(_,i)=>line(`Let x${i} be ...`,.30+i*.025))]), 'dense mathematics without an Index header is unaffected');
check(detect([line('Remark I. Exceptional solutions exist', .19)], 0)?.label === 'Remark I', 'preexisting Roman-numbered grammar remains unchanged');

// Real 1989 Caffarelli--Gidas--Spruck p.3: THEOREM and "1.3. Let ..."
// are separate native text fragments on effectively the same baseline.
const splitCaff = [line('Let u be a solution of (1.1) with a non-removable isolated',.405,.317,.877),
  line('1.3. Let u ≥ 0 be a solution of (1.8) in B',.599,.265,.728),
  line('THEOREM',.600,.164,.296),
  line('with a non-removable isolated singularity.', .600,.76,.88)];
check(detect(splitCaff, 2)?.label === 'Theorem 1.3', 'same-baseline number and statement attach to split THEOREM');
const splitReverse = [splitCaff[0],splitCaff[2],splitCaff[1],splitCaff[3]];
check(detect(splitReverse, 1)?.label === 'Theorem 1.3', 'split theorem recognition is independent of extraction fragment order');
const splitInterleaved = [line('THEOREM',.600,.164,.296),line('with a non-',.600,.76,.88),line('other column fragment',.601,.86,.97),line('1.3. Let u ≥ 0 be a solution',.599,.265,.728)];
check(detect(splitInterleaved,0)?.label === 'Theorem 1.3', 'same-row theorem-number fragments can be interleaved in extraction order');
check(detect([line('THEOREM', .29,.14,.25),line('1.3. Let u be harmonic', .32,.28,.6)],0)?.label === 'Theorem 1.3', 'existing vertically adjacent number/text detection survives');
check(detect([line('THEOREM',.20,.14,.25),line('3',.20,.27,.30)],0)?.label === 'Theorem · p.12', 'bare folio does not create a split theorem number');
check(detect([line('THEOREM',.20,.14,.25),line('ordinary prose',.20,.35,.53),line('another prose line',.20,.55,.72),line('1.3. Let u be harmonic',.20,.76,.92)],0)?.label === 'Theorem · p.12', 'far-away next-column text does not attach');
check(detect([line('THEOREM',.20,.14,.25),line('1.3. Let u be harmonic',.24,.28,.60)],0)?.label === 'Theorem 1.3', 'old nearby vertically split results remain');
check(detect([line('THEOREM',.20,.14,.25),line('1.3. Let u be harmonic',.32,.28,.60)],0)?.label === 'Theorem · p.12', 'distant vertical fragment does not attach');
check(detect([line('Lemma 2.2 Every smooth solution ...', .20)],0)?.label === 'Lemma 2.2', 'ordinary numbered Lemma unaffected');

// Real AI/ML chart p.6: multiple small y-axis tick labels, separated rows.
const ticks = [line('0.04',.400,.528,.539),line('0.03',.408,.528,.539),
 line('0.02',.416,.528,.539),line('0.01',.424,.528,.539)];
check(verticalTicks(ticks,0), 'real vertical chart ticks 0.04..0.01 recognized as numeric axis run');
check(verticalTicks(ticks,2), 'middle chart tick also rejected');
check(!verticalTicks([ticks[0],ticks[1],ticks[2]],0), 'three decimal tags are not enough to suppress equations');
check(!verticalTicks([line('1.1',.4,.528,.54),line('1.2',.408,.528,.54),line('1.3',.416,.528,.54),line('1.4',.424,.528,.54)],0), 'numbered equation family is not treated as small chart ticks');
check(!verticalTicks(ticks.map((t,i)=>({...t,ratio: .10+i*.085})),0), 'widely spaced display labels remain eligible');
check(!verticalTicks(ticks.map((t,i)=>({...t,xStartRatio: .52+i*.07,xEndRatio:.53+i*.07})),0), 'different columns do not form a vertical axis');
check(!verticalTicks([line('0.04',.4,.528,.539),line('0.07',.408,.528,.539),line('0.02',.416,.528,.539),line('0.01',.424,.528,.539)],0), 'nonmonotone decimal prose does not form a chart axis');
check(!verticalTicks([line('0.118',.4,.528,.539),line('0.129',.408,.528,.539),line('0.132',.416,.528,.539),line('0.346',.424,.528,.539)],0), 'irregular decimal measurements are not mistaken for uniform axis ticks');

// Real Chinese technical manuscript p.12: 7.3 and 图表 are separate, nearly
// same-row native fragments with a short (two-Han-character) heading.
const section = [line('图表',.151,.163,.203),line('7.3',.152,.114,.143),line('• 图的最终印刷宽度决定字体大小',.182,.128,.88)];
check(sameRow(section,1), 'fragmented two-character CJK section heading rejected');
check(!sameRow([line('图表',.19,.163,.203),section[1]],1), 'different baseline is not a section continuation');
check(!sameRow([line('图表',.151,.60,.66),section[1]],1), 'distant same-row caption is not a section continuation');
check(!sameRow([line('∫f(x)dx = 1',.151,.163,.4),section[1]],1), 'real mathematical display is not a section heading');
check(!sameRow([line('a',.151,.163,.17),section[1]],1), 'single-character glyph is not sufficient heading evidence');

console.log(`OK: ${checks} MathReader v348 precision class assertions`);
