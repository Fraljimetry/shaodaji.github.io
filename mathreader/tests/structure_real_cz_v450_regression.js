'use strict';
// Native span geometry and the untouched embedded outline were extracted from
// the provided 19-page Calderon-Zygmund PDF; not synthetic title locations.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'regression/fixtures/structure_real_cz_v450.json')));
const source=fs.readFileSync(path.join(root,'js/40-outline-structure.js'),'utf8');
const start=source.indexOf('function comparableStructureNavigationText(value) {');
const end=source.indexOf('\nfunction renderActiveOutline() {',start);
assert(start>=0&&end>start);
const context={console,pdfDoc:{numPages:19},currentFileKey:'cz-original',readerNavigationSerial:0,
  pageTextLines:async page=>fixture.rows[String(page)]||[],
  goToMatchedLocation:async(page,ratio)=>{context.location={page,ratio}},location:null};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
const match=vm.runInContext('uniqueStructureHeadingRatio',context);
const navigate=vm.runInContext('navigateToStructureEntry',context);
(async()=>{
  let certified=0,unresolved=[];
  for(const entry of fixture.bookmarks){
    if(entry.title.startsWith('11A —')) continue; // demonstrably misdirected to the table of contents; separately documented
    const ratio=match(fixture.rows[String(entry.page)],entry.title);
    if(ratio===null){unresolved.push(`${entry.page}: ${entry.title}`);continue;}
    assert(ratio>0.065,`heading incorrectly retained bookmark's page-top coordinate: ${entry.title}`);
    context.location=null;
    await navigate({...entry,ratio:36/792,positionKnown:true,userEdited:false});
    assert(context.location&&context.location.page===entry.page&&Math.abs(context.location.ratio-ratio)<.0001,`failed: ${entry.title}`);
    certified++;
  }
  assert(certified>=22,`Too few real PDF headings recovered: ${certified}; unresolved: ${unresolved.join(' | ')}`);
  assert.equal(match(fixture.rows['2'],'11A — Endpoint behaviour: p = 1 and p = infinity'),null,'must not target the contents page as heading');
  console.log(`Original-PDF Structure geometry: ${certified} bookmark headings located, ${unresolved.length} unresolved: ${unresolved.join(' | ')}`);
})().catch(error=>{console.error(error);process.exitCode=1});
