import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutNodeLabel,nodeBox} from '../src/diagram_layout.mjs';

// A visual wrap is not permission to change the mathematical label. Its
// original text, including spacing, must survive across SVG tspan boundaries.
test('node display wraps without silently deleting mathematical whitespace',()=>{
 for (const text of [
  ' A    B '.repeat(17),
  'Long label with   repeated spaces near a wrap boundary '.repeat(7),
  '   leading spaces '+('a '.repeat(60))+' trailing   ',
  'x '.repeat(110)+'\n\n  y   z  '
 ]){
  const result=layoutNodeLabel(text,17);
  assert.ok(result.lines.length>1,text);
  assert.equal(result.lines.join('').replaceAll('\n',''),text.replaceAll('\n',''),text);
  assert.ok(result.width<=340);
  assert.ok(result.height>0);
 }
});

test('node layout remains deterministic after cache hits and different font sizes',()=>{
 const s='Geometry    and topology  '.repeat(19);
 const a=nodeBox(s,17),b=nodeBox(s,17),large=nodeBox(s,45);
 assert.deepEqual(a,b);
 assert.equal(a.lines.join(''),s);
 assert.equal(large.lines.join(''),s);
 assert.notEqual(a.height,large.height);
});
