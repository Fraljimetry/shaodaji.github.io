import {readFileSync} from "node:fs";
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

test('canonical exact translation table has unique keys and preserves common plot terminology',()=>{
 const source=readFileSync(new URL('../src/i18n.mjs',import.meta.url),'utf8');
 const table=source.match(/const zh=Object\.freeze\((\{[\s\S]*?\n\})\);/)?.[1];
 assert.ok(table,'one canonical literal translation table');
 const keys=[...table.matchAll(/^\s*("(?:[^"\\]|\\.)*")\s*:/gm)].map(m=>JSON.parse(m[1]));
 assert.equal(keys.length,new Set(keys).size,'duplicate dictionary keys');
 assert.equal(keys.length,Object.keys(JSON.parse(table)).length);
 assert.doesNotMatch(source,/Object\.assign\(zh\b|\bzhExtra\b/);
 for(const [label,expected] of Object.entries({'Density':'密度','Normalize lengths':'归一化长度','Resolution':'分辨率','Centered half-range':'中心对称半宽','Region inequality':'区域不等式','Color scheme':'着色方案','Height represents':'高度表示'})){
  assert.equal(translated(label,'zh'),expected,label);
  assert.equal(translated(label,'en'),label);
 }
});

test('unknown translation keys remain literal, including inherited object keys',()=>{
 for(const key of ['constructor','__proto__','toString','hasOwnProperty','valueOf']){
  assert.equal(translated(key,'zh'),key);
  assert.equal(translated(`Open failed: ${key}`,'zh'),`打开失败：${key}`);
 }
});
