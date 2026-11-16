import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../tutorial.html', import.meta.url),'utf8');
test('tutorial gallery remains removed while the guide is reorganized',()=>{
 assert.doesNotMatch(html, /[?&]example=|class="gallery"|Editable example projects|可编辑的示例项目/);
 assert.match(html, /id="start"[\s\S]*?1\. Get started/);
 assert.match(html, /id="start"[\s\S]*?1\. 开始使用/);
});
test('tutorial function tables remain left aligned',()=>{
 assert.match(html, /th,td\{text-align:left/);
});
