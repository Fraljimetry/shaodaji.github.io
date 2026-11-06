const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const core=read('js/00-core.js'), index=read('js/41-equations-bibliography.js'), search=read('js/50-references-search.js'), ui=read('js/70-command-ui-runtime.js');
let count=0;function check(ok,message){if(!ok)throw Error(message);count++;}
check(core.includes("addEventListener('contextmenu'") && core.includes("closest('.continuous-page-frame')"),'page-local context menu');
check(core.includes('manualPageOcrBusy || documentOcrBusy') && core.includes('sourceDoc === pdfDoc && sourceKey === currentFileKey'),'single operation and document guard');
check(core.includes('pageRecordFromHocr') && core.includes('manualIndexOcrPages.set(pageNum, mergedRecord)'),'recognized result commit');
check(core.indexOf('manualIndexOcrPages.set(pageNum, mergedRecord)')>core.indexOf("if (!Array.isArray(record?.lines)"),'reject empty OCR before commit');
check(core.includes('await dbMetaSet(key, {pageCount: sourceDoc.numPages'),'per-document persistence');
check(index.includes('manualIndexOcrPages.has(Number(pageNum))'),'Structure, Results, Bibliography, Equations read manual page evidence');
check(search.includes('manualIndexOcrPages.has(Number(pageNum))'),'page text used for indexes/search');
check(core.includes('await buildStructureIndex({force: true})') && core.includes('await ensureEquationIndexRendered()'),'Contents rebuilt');
check(core.includes('manualIndexOcrPages = new Map();') && core.includes('await loadManualIndexOcrPages()'),'page evidence isolated across documents');
check(ui.includes('installManualPageIndexOcrMenu();'),'menu installed');
console.log(`OK: ${count} page-specific OCR source assertions`);
