'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = fs.readFileSync(path.join(__dirname, '../js/00-core.js'), 'utf8');
const start = core.indexOf('let manualPageIndexOcrStatusTimer = null;');
const end = core.indexOf('\nasync function runMeticulousPageIndexOcr', start);
assert.ok(start >= 0 && end > start, 'status function exists');
let nextId = 0;
const pending = new Map();
const classes = new Set(['is-hidden']);
const status = { textContent: '', classList: {
  add: (name) => classes.add(name), remove: (name) => classes.delete(name)
} };
const timers = { setTimeout: (callback, ms) => {const id = ++nextId; pending.set(id, {callback: () => {pending.delete(id); callback();}, ms}); return id;},
  clearTimeout: (id) => pending.delete(id) };
const context = vm.createContext({...timers, status});
vm.runInContext(core.slice(start, end).replace('let manualPageIndexOcrStatusTimer = null;', 'let manualPageIndexOcrStatusTimer = null; let manualPageIndexOcrStatus = status;'), context);
const message = (text, ms) => vm.runInContext(`manualPageIndexOcrMessage(${JSON.stringify(text)}, ${ms})`, context);
message('OCR in progress');
assert.equal(classes.has('is-hidden'), false);
assert.equal(pending.size, 0, 'progress message is persistent');
message('Contents updated', 3500);
assert.equal(status.textContent, 'Contents updated');
assert.equal([...pending.values()][0].ms, 3500);
const staleCallback = [...pending.values()][0].callback;
message('OCR in progress');
assert.equal(pending.size, 0, 'new progress cancels previous dismissal');
// Canceled timeout must not be executed by browser, so test only active timers.
message('Contents updated', 3500);
[...pending.values()][0].callback();
assert.equal(classes.has('is-hidden'), true, 'success dismisses');
message('OCR failed', 6500);
assert.equal(classes.has('is-hidden'), false);
assert.equal([...pending.values()][0].ms, 6500);
[...pending.values()][0].callback();
assert.equal(classes.has('is-hidden'), true, 'error dismisses');
console.log('OK: page OCR status auto-dismiss and timer replacement');
