/** DOM-independent Properties panel geometry; no document or scene data. */
export const PROPERTY_DOCK_MIN=140;
export const PROPERTY_DOCK_DEFAULT=230;
export const PROPERTY_FLOAT_MIN_W=260;
export const PROPERTY_FLOAT_MIN_H=180;
export const PROPERTY_FLOAT_MAX_W=600;
export const PROPERTY_FLOAT_MAX_H=720;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const safe=(v,fallback,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max?Math.round(v):fallback;
/** Persist only explicitly supported modes/numeric geometry: invalid input is inert. */
export function normalizePropertiesLayout(raw){
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {
  mode:'docked',
  collapsed:o.collapsed===true,
  dockHeight:safe(o.dockHeight,PROPERTY_DOCK_DEFAULT,PROPERTY_DOCK_MIN,1000),
  x:safe(o.x,320,0,10000),y:safe(o.y,100,0,10000),
  width:safe(o.width,300,PROPERTY_FLOAT_MIN_W,PROPERTY_FLOAT_MAX_W),
  height:safe(o.height,320,PROPERTY_FLOAT_MIN_H,PROPERTY_FLOAT_MAX_H)
 };
}
/** Fit without overwriting preferred position or dimensions on viewport shrink. */
export function fitFloatingProperties(preferred, viewportWidth, viewportHeight, toolbarHeight=58){
 const p=normalizePropertiesLayout(preferred);
 const vw=Math.max(300,Math.floor(viewportWidth)),vh=Math.max(200,Math.floor(viewportHeight));
 const top=Math.max(0,Math.min(vh-100,Math.ceil(toolbarHeight)+5));
 const maxW=Math.max(100,Math.min(PROPERTY_FLOAT_MAX_W,vw-16));
 const maxH=Math.max(70,Math.min(PROPERTY_FLOAT_MAX_H,vh-top-8));
 const width=Math.min(maxW,p.width),height=Math.min(maxH,p.height);
 return {x:clamp(p.x,8,Math.max(8,vw-width-8)),y:clamp(p.y,top,Math.max(top,vh-height-8)),width,height};
}
export function fitDockPropertiesHeight(preferredHeight, panelHeight, fixedHeight){
 const max=Math.max(38,Math.round(panelHeight-fixedHeight-70));
 const min=Math.min(PROPERTY_DOCK_MIN,max);
 return {height:clamp(preferredHeight,min,max),min,max};
}
