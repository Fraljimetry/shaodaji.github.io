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
test('Tutorial navigation includes every published chapter and quick-path target in both languages',()=>{
 const sectionIds=[...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
 const nav=html.match(/<nav aria-label="Guide chapters" class="nav">([\s\S]*?)<\/nav>/)?.[1];
 assert.ok(nav,'Guide navigation must exist');
 const navIds=[...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(new Set(navIds),new Set(sectionIds),'Every chapter must have a navigation link');
 assert.equal(navIds.length,new Set(navIds).size,'No duplicate chapter links');
 assert.equal((nav.match(/class="nav-group-title"/g)||[]).length,4);
 for(const link of nav.matchAll(/<a href="#[^"]+">([\s\S]*?)<\/a>/g)){
  assert.match(link[1],/class="lang en"/);
  assert.match(link[1],/class="lang zh"/);
 }
 const quick=html.match(/<div class="quick-paths"[^>]*>([\s\S]*?)<\/div>/)?.[1];
 assert.ok(quick,'Task-oriented quick paths must exist');
 const quickIds=[...quick.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 assert.equal(quickIds.length,4);
 for(const id of quickIds)assert.ok(sectionIds.includes(id),`Broken quick path ${id}`);
 assert.doesNotMatch(html,/User guide · Round \d+|使用指南 · 第 \d+ 轮/);
});
test('Public tutorial uses current user guidance rather than release-history language',()=>{
 const guide=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
 assert.ok(guide,'Public tutorial main content exists');
 const visible=guide.replace(/<[^>]*>/g,' ').replace(/&[^;]+;/g,' ');
 for(const pattern of [/\bround\s*\d+\b/i,/\bpreviously saved legacy\b/i,/\b(?:now|recently) (?:refines?|preserves?|uses?|supports?|fixes?)\b/i,/\b(?:regression|release notes|changelog)\b/i,/不再有添加按钮|不再显示副标题|不再需要“对象”类型下拉框|程序现在会|修复部分由近零采样引起的裂缝/]){
  assert.doesNotMatch(visible,pattern,`Release-history wording found: ${pattern}`);
 }
});
