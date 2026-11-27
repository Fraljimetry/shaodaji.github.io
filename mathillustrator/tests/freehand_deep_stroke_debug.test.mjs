import test from 'node:test';
import assert from 'node:assert/strict';
import {shapeFromStroke} from '../src/freehand_shapes.mjs';

test('valid 20,000-point zigzag converts to bounded polygon without stack overflow',()=>{
 const raw=Array.from({length:20000},(_,i)=>[i/1000,i%2]);
 const actual=shapeFromStroke(raw,'polygon',false);
 assert.ok(actual?.closed);
 assert.ok(actual.path.length>=4&&actual.path.length<=25);
 assert.deepEqual(actual.path.at(0),actual.path.at(-1));
 assert.ok(actual.path.every(p=>p.every(Number.isFinite)));
});
