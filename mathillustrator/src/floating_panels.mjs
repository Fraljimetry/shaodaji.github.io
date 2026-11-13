/** R45: validated, UI-only geometry for detachable Objects and Tools panels. */
export const FLOAT_PANEL_MIN_W=260;
export const FLOAT_PANEL_MIN_H=220;
export const FLOAT_PANEL_MAX_W=720;
export const FLOAT_PANEL_MAX_H=840;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const valid=(n,f,min,max)=>Number.isFinite(n)&&typeof n==='number'&&n>=min&&n<=max?Math.round(n):f;
export function normalizeFloatingPanel(raw,side='left'){
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const x=side==='right'?670:80;
 const own=key=>Object.hasOwn(o,key)?o[key]:undefined;
 return {mode:own('mode')==='floating'?'floating':'docked',
  x:valid(own('x'),x,0,10000),y:valid(own('y'),125,0,10000),
  width:valid(own('width'),340,FLOAT_PANEL_MIN_W,FLOAT_PANEL_MAX_W),
  height:valid(own('height'),580,FLOAT_PANEL_MIN_H,FLOAT_PANEL_MAX_H)};
}
/** Display clamp is deliberately independent of saved ideal geometry. */
export function fitFloatingPanel(raw,viewportWidth,viewportHeight,toolbarHeight=58,side='left'){
 const o=normalizeFloatingPanel(raw,side);
 const vw=Math.max(80,Math.floor(viewportWidth)),vh=Math.max(64,Math.floor(viewportHeight));
 const top=clamp(Math.ceil(toolbarHeight)+5,0,Math.max(0,vh-40));
 const width=Math.min(o.width,Math.max(50,vw-16));
 const height=Math.min(o.height,Math.max(24,vh-top-8));
 return {x:clamp(o.x,8,Math.max(8,vw-width-8)),y:clamp(o.y,top,Math.max(top,vh-height-8)),width,height};
}
