import test from 'node:test';
import assert from 'node:assert/strict';
import {PANEL_MIN,PANEL_MAX,CANVAS_MIN,COLLAPSED_RAIL,validPanelWidth,fitPanels} from '../src/panel_sizes.mjs';

test('persisted widths reject malformed values rather than trusting implicit coercions',()=>{
 for(const input of [NaN,Infinity,-Infinity,null,undefined,0,-200,189,621,100000,'300',{},[],true])
  assert.equal(validPanelWidth(input),null);
 assert.equal(validPanelWidth(190),190);
 assert.equal(validPanelWidth(620),620);
 assert.equal(validPanelWidth(302.7),303);
});
test('desktop fitting retains canvas minimum under extreme widths and narrow windows',()=>{
 for(const total of [701,720,800,950,951,1100,1440,1920]){
  for(const left of [190,240,310,620])for(const right of [190,305,620]){
   for(const lCollapsed of [false,true])for(const rCollapsed of [false,true]){
    const v=fitPanels(total,left,right,lCollapsed,rCollapsed);
    assert.ok(v.left+v.right+CANVAS_MIN<=total,JSON.stringify({total,left,right,lCollapsed,rCollapsed,v}));
    assert.equal(lCollapsed?v.left===COLLAPSED_RAIL:v.left>=PANEL_MIN,true);
    assert.equal(rCollapsed?v.right===COLLAPSED_RAIL:v.right>=PANEL_MIN,true);
    if(!lCollapsed)assert.ok(v.left<=PANEL_MAX);
    if(!rCollapsed)assert.ok(v.right<=PANEL_MAX);
   }
  }
 }
});
test('fitting does not mutate preferred values and restores them when viewport expands',()=>{
 const w={left:540,right:580};
 const narrow=fitPanels(760,w.left,w.right);
 assert.ok(narrow.left<540&&narrow.right<580);
 const wide=fitPanels(1700,w.left,w.right);
 assert.equal(wide.left,w.left);
 assert.equal(wide.right,w.right);
 assert.deepEqual(w,{left:540,right:580});
});
test('active side has priority over the other displayed width while dragging',()=>{
 const l=fitPanels(800,570,210,false,false,'left');
 const r=fitPanels(800,210,570,false,false,'right');
 assert.equal(l.left,800-CANVAS_MIN-210);
 assert.equal(l.right,210);
 assert.equal(r.right,800-CANVAS_MIN-210);
 assert.equal(r.left,210);
});
test('collapsed rails do not steal custom widths or cause overflow',()=>{
 const leftHidden=fitPanels(701,620,620,true,false);
 const rightHidden=fitPanels(701,620,620,false,true);
 assert.equal(leftHidden.left,COLLAPSED_RAIL);
 assert.equal(rightHidden.right,COLLAPSED_RAIL);
 assert.ok(leftHidden.right>=PANEL_MIN&&rightHidden.left>=PANEL_MIN);
});
