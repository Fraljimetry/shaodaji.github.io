import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const html=readFileSync(new URL('../tutorial.html', import.meta.url),'utf8');
const toolsPath=new URL('../../tools.html', import.meta.url);
test('Round 183: tutorial offers nine bilingual chapter anchors',()=>{
 const ids=['start','workspace','geometry','syntax','plots2d','plots3d','settings','shortcuts','limits'];
 for(const id of ids){assert.match(html,new RegExp(`href="#${id}"`));assert.match(html,new RegExp(`id="${id}"`));}
 assert.match(html, /id="lang-switch"/);assert.match(html, /id="theme-switch"/);
 assert.match(html, /:root\[data-lang="zh"\] \.lang\.zh/);
});
test('Round 183: tutorial preserves function reference, shortcuts and left aligned tables',()=>{
 for(const x of ['sin cos tan','log10','conj','phi','Domain coloring','定义域着色','Use polar coordinates','V','H'])assert.ok(html.includes(x),x);
 assert.match(html,/th,td\{text-align:left/);
 assert.doesNotMatch(html,/[?&]example=|class="gallery"|Editable example projects|可编辑的示例项目/);
});
test('Round 183: remove redundant tools-page tutorial entry, retain app Help',()=>{
 // tools.html belongs to the hosting website, not this standalone app archive.
 // Check its integration when supplied, without making it a required fixture.
 if(existsSync(toolsPath)){
  const tools=readFileSync(toolsPath,'utf8');
  assert.doesNotMatch(tools, /href="mathillustrator\/tutorial\.html"/);
  assert.match(tools,/href="mathillustrator\/"/);
 }
 const editor=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(editor,/id="help"/);
});
