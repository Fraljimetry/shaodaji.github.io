const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'tutorial.html'),'utf8'),css=fs.readFileSync(path.join(root,'tutorial.css'),'utf8');
let n=0;function check(v,msg){assert.ok(v,msg);n++}
check((html.match(/class="shortcut-group"/g)||[]).length===3,'three functional groups');
check((html.match(/class="shortcut-row"/g)||[]).length===17,'all seventeen shortcuts retained');
check(!html.includes('shortcut-grid'),'obsolete grid removed');
check(css.includes('.shortcut-groups{display:grid'),'group grid configured');
check((html.match(/class="shortcut-column"/g)||[]).length===2,'two complete balanced columns');
const cols=html.split('class="shortcut-column"');
check(cols[1].includes('lang en">Document') && cols[1].includes('lang en">Reading & notes') && cols[2].includes('lang en">Workspace'),'reading and notes follows document in left column, workspace occupies right column');
check(css.includes('max-width:700px'),'shortcut table width is constrained');
check(css.includes('.shortcut-groups{grid-template-columns:1fr;gap:20px}'),'small viewport has one column');
check(!css.includes('border-bottom:1px solid var(--border);padding:9px 0'),'full row dividers removed');
check(html.includes('<kbd>Ctrl/Cmd</kbd> <span class="shortcut-sep">+</span> <kbd>K</kbd>'),'key chord grouped');
check(html.includes('<kbd>Shift</kbd> <span class="shortcut-sep">+</span> <kbd>F10</kbd>'),'reference shortcut kept');
check(html.includes('lang en">Document') && html.includes('lang zh">文档'),'groups bilingual');
check(!html.includes('The <strong>?</strong> button opens this guide'),'duplicate help explanation removed');
check(!html.includes('Shortcut reference'),'redundant heading removed');
console.log(`OK: ${n} grouped shortcuts UI checks`);
