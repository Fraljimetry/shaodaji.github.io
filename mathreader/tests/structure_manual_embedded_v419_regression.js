// MathReader v419: manual Structure entries coexist with embedded PDF bookmarks.
// Run: node mathreader/tests/structure_manual_embedded_v419_regression.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = (name) => fs.readFileSync(path.join(__dirname,'../js',name),'utf8');
const select = read('20-selection-annotations.js');
const outline = read('40-outline-structure.js');
const refs = read('50-references-search.js');
const notes = read('60-notes-bookmarks-data.js');
const core = read('00-core.js');
function slice(src,start,end) {
  const i=src.indexOf(start), j=src.indexOf(end,i+start.length);
  assert(i>=0 && j>i,`source bounds: ${start}`);
  return src.slice(i,j);
}
function element(tag='div') {
  const classes=new Set();
  return {tag,dataset:{},children:[],classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)},toggle(x,on){if(on===undefined? !classes.has(x):on)classes.add(x);else classes.delete(x)}},
    replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)},
    addEventListener(type,fn){this.events??={};this.events[type]=fn},
    click(){return this.events?.click?.({preventDefault(){},stopPropagation(){}})},
    setAttribute(name,value){this[name]=value},querySelectorAll(){return []},
    querySelector(){return null},closest(){return null},
  };
}
let checks=0;
const list=element('list');
const errors=[],undo=[];
const ctx=vm.createContext({console,document:{createElement:element,addEventListener(){}},
  pdfDoc:{numPages:12},currentSelection:{text:'A manually chosen paragraph',page:4,ratio:.46},
  inferredOutline:[], inferredOutlineDetectionDone:false, embeddedOutlineEdits:[],
  embeddedOutlineEntries:[{sourceKey:'a',title:'Chapter 1',page:1,ratio:0,depth:0}, {sourceKey:'b',title:'Chapter 2',page:7,ratio:0,depth:0}],
  outlineList:list,outlineMode:'embedded',outlineSource:element('source'),outlineCount:element('count'),outlineEmpty:element('empty'),
  pendingOutlineReselectKey:null,pendingEquationReselectKey:null,pendingEquationAddKey:null,
  MAX_INFERRED_OUTLINE_ENTRIES:1200,t:(en)=>en,
  showError:s=>errors.push(s),persistDocumentState(){this?.n;ctx.saves++},saves:0,
  rerenderReferenceLinksAfterStructureEdit(){ctx.links++},links:0,refreshSelectionUI(){},
  applyDocumentMapFilter(){},el(){return element()},updateDocumentMapCurrentLocation(){},setDocumentMapSelectedNode(){},
  goToMatchedLocation(){},positionOutlineEditActions(){},requestAnimationFrame(fn){fn()},
  pushUndo(type,label,payload){undo.push({type,label,payload})},tocOutlineTargets:null,
});
vm.runInContext([
  slice(select,'function outlineEntryFromSelection(', '\nfunction equationLabelFromSelectionText('),
  slice(outline,'function updateOutlineSource(', '\nfunction normalizedHeadingText('),
  slice(outline,'function embeddedOutlineSourceKey(', '\ndocument.addEventListener(\'click\''),
  slice(select,'function addOrReplaceSelectionStructureItem() {','\n\nfunction addSelectionToPageNote()'),
].join('\n'),ctx,{timeout:10000});
const run=(script)=>vm.runInContext(script,ctx,{timeout:10000});
const verify=(truth,message)=>{assert.ok(truth,message);checks++};
const labels=()=>list.children.map(row=>row.children[0].textContent);
const rowOf=(name)=>list.children.find(row=>row.children[0].textContent===name);
const action=(name,label)=>rowOf(name)?.children[2]?.children.find(child=>child.textContent===label);
// Baseline v418 behavior: this throws an error and does not render the manual row.
run('renderEmbeddedOutline(embeddedOutlineEntries)');
run('addOrReplaceSelectionStructureItem()');
verify(errors.length===0,'manual Structure Add must not reject embedded outlines');
verify(labels().join('|')==='Chapter 1|A manually chosen paragraph|Chapter 2','manual row interleaves with embedded bookmarks in document order');
verify(ctx.outlineMode==='embedded','embedded structure mode is preserved');
verify(ctx.inferredOutline.length===1 && ctx.inferredOutline[0].userEdited===true,'manual entry persisted in inferredOutline user-edits representation');
verify(ctx.outlineCount.textContent==='3','combined row count');
verify(action('A manually chosen paragraph','→')!==undefined,'manually added row has indentation control');
action('A manually chosen paragraph','→').click();
verify(ctx.inferredOutline[0].depth===1 && rowOf('A manually chosen paragraph').dataset.depth==='1','indentation updates without leaving embedded mode');
action('A manually chosen paragraph','Reselect').click();
verify(Boolean(ctx.pendingOutlineReselectKey) && !ctx.pendingOutlineReselectKey.startsWith('embedded:'),'manual reselect binds to manual entry');
ctx.currentSelection={text:'Replacement prose sentence',page:5,ratio:.2};
run('addOrReplaceSelectionStructureItem()');
verify(ctx.inferredOutline.length===1 && ctx.inferredOutline[0].title==='Replacement prose sentence','manual reselect replaces rather than duplicates');
verify(ctx.inferredOutline[0].depth===1,'manual reselect preserves indentation');
verify(labels().join('|')==='Chapter 1|Replacement prose sentence|Chapter 2','replacement stays interleaved and navigable');
// Embedded bookmark reselect still works and does not overwrite the user row.
ctx.pendingOutlineReselectKey='embedded:a';
ctx.currentSelection={text:'Edited chapter bookmark',page:2,ratio:.1};
run('addOrReplaceSelectionStructureItem()');
verify(labels()[0]==='Edited chapter bookmark' && ctx.inferredOutline.length===1,'embedded reselect still works alongside manual entry');
verify(ctx.embeddedOutlineEdits.length===1 && ctx.embeddedOutlineEdits[0].action==='reselect','embedded bookmarks remain separate edited metadata');
action('Replacement prose sentence','Remove').click();
verify(ctx.inferredOutline.length===0 && labels().length===2,'manual Remove leaves embedded bookmarks intact');
verify(undo.length===1 && undo[0].type==='structure-outline' && undo[0].payload.userEdited,'manual Remove retains undo payload');
verify(ctx.saves>=4,'changes persisted');
// Source-level safeguards for restoration, OCR augmentation and exports.
verify(refs.includes('mergeDetectedAndManualOutline('),'background typography detection preserves user-edited entries');
verify(core.includes('entry?.userEdited === true'),'detector version changes preserve user-edited Structure entries');
verify(notes.includes('renderActiveOutline()'),'undo restoration uses current outline display mode');
verify(notes.includes("entry?.userEdited === true"),'reading-only backup retains manual Structure entries');
console.log(`OK: ${checks} manually edited embedded-outline regression assertions`);
