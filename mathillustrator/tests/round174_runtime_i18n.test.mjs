import test from 'node:test';
import assert from 'node:assert/strict';
import { translated } from '../src/i18n.mjs';

test('Round 174 construction and native dialog strings are translated',()=>{
 for(const text of [
  'Choose a center point.', 'Choose an existing circle.',
  'Double and Wavy lines support four basic arrowhead options.',
  'Start a new illustration? Download the current project first if needed.',
  'Number of polygon sides (3–100):',
  'The locally saved project is invalid.',
  'JPEG cannot preserve transparency; choose PNG, WebP or SVG.'
 ]){
  assert.notEqual(translated(text,'zh'),text,text);
  assert.equal(translated(text,'en'),text);
 }
});

test('Round 174 interpolated notifications preserve counts and English originals',()=>{
 assert.equal(translated('Label exceeds 2000 characters. Nothing was added.','zh'),'标签超过 2000 字符，未添加对象。');
 assert.equal(translated('Deleted 3 objects. Restore them under Recently Deleted.','zh'),'已删除 3 个对象，可在最近删除中恢复。');
 assert.equal(translated('Deleted 3 objects. Restore them under Recently Deleted.','en'),'Deleted 3 objects. Restore them under Recently Deleted.');
 assert.match(translated('Open failed: Project JSON exceeds 12 MB safety limit.','zh'),/^打开失败：/);
});
