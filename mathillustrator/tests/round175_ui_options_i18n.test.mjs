import test from 'node:test';
import assert from 'node:assert/strict';
import {translated} from '../src/i18n.mjs';

const groups={
  arrowheads:['Arrowheads','None','End','Start','Both','Double end','Hook','Tail','Harpoon'],
  lines:['Line style','Solid','Dashed','Dotted','Double','Wavy'],
  shapes:['Shape','Free','Ellipse','Polygon','Regular'],
  controls:['New project','Open a JSON project','Save editable project','Toggle objects panel','Toggle tools panel','Drawing tools and settings','Objects and properties','Add construction','Zoom in','Zoom out','Fit objects to canvas','Choose a plotting mode'],
};
for(const [name,items] of Object.entries(groups))test(`Round 175 ${name}: all visible labels localize reversibly`,()=>{
 for(const label of items){
  assert.notEqual(translated(label,'zh'),label,`missing zh translation for ${label}`);
  assert.equal(translated(label,'en'),label);
 }
});
