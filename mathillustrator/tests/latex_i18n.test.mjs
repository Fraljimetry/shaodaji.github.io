import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc} from '../src/model.mjs';
import {importTikzCd,exportTikzCd} from '../src/diagram.mjs';
import {checkLatexSource,mathCacheStats} from '../src/math_labels.mjs';
import {translated,supportedLanguages} from '../src/i18n.mjs';

test('new mathematical mode is additive and does not silently migrate legacy text',()=>{
 const doc=newDoc(),legacy=append(doc,{type:'node',xy:[0,0],text:'Existing label with spaces'});
 const latex=append(doc,{type:'node',xy:[3,0],text:'\\frac{A_1}{B_2}',textMode:'latex'});
 const arrow=append(doc,{type:'morphism',refs:[legacy.id,latex.id],text:'f\\circ g',textMode:'latex'});
 assert.deepEqual(validateDoc(doc),doc);
 assert.equal(legacy.textMode,'latex');
 const importedLegacy=structuredClone(doc);delete importedLegacy.objects[0].textMode;
 assert.equal(validateDoc(importedLegacy).objects[0].textMode,undefined,'old JSON without textMode is still plain and is not migrated');
 assert.equal(arrow.textMode,'latex');
 latex.textMode='mathjax';assert.throws(()=>validateDoc(doc),/label mode/);
 latex.textMode='latex';arrow.fontFamily='../../path';assert.throws(()=>validateDoc(doc),/label font/);
});
test('TeX source validation explicitly rejects untrusted extensions and controls',()=>{
 for(const source of ['\\href{javascript:alert(1)}{X}','\\require{../bad}','\\includegraphics{url}','\\newcommand{\\foo}{bar}','A\u0001'])assert.throws(()=>checkLatexSource(source));
 for(const source of ['x_{i}^{2}+\\frac{a}{b}','\\begin{matrix}a&b\\\\c&d\\end{matrix}','\\alpha\\to\\beta'])assert.equal(checkLatexSource(source),source);
 assert.equal(mathCacheStats().entries,0);
});
test('imported tikz-cd receives semantic math labels without changing source on export',()=>{
 const source='\\begin{tikzcd}\n\\alpha \\arrow[r, "f\\circ g"] & \\beta\n\\end{tikzcd}';
 const doc=importTikzCd(source);
 assert.equal(doc.objects.filter(o=>o.type==='node').every(o=>o.textMode==='latex'),true);
 assert.equal(doc.objects.find(o=>o.type==='morphism').textMode,'latex');
 assert.match(exportTikzCd(doc),/f\\circ g/);
 assert.equal(validateDoc(doc).objects[0].text,'\\alpha');
});
test('Chinese UI dictionary is reversible; maths and user text stay untouched',()=>{
 assert.deepEqual(supportedLanguages,['en','zh']);
 assert.equal(translated('Arrow label','zh'),'箭头标签');
 assert.equal(translated('Arrow label','en'),'Arrow label');
 assert.equal(translated('\\frac{a}{b}','zh'),'\\frac{a}{b}');
});
