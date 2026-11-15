import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../tutorial.html', import.meta.url),'utf8');
test('tutorial example gallery removed in both languages',()=>{
  assert.doesNotMatch(html, /[?&]example=|class="gallery"|Editable example projects|可编辑的示例项目/);
  assert.match(html, /id="en-guide"[\s\S]*?<h2>Getting started<\/h2>/);
  assert.match(html, /id="zh-guide"[\s\S]*?<h2>开始使用<\/h2>/);
});
test('tutorial function tables retain left alignment',()=>{assert.match(html, /\.guide table th\{text-align:left\}/);});
