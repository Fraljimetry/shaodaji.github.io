/** Single-key canvas tool shortcuts. Do not fire inside editable fields,
 * dialogs, menus, browser commands or arbitrary focused controls. */
export const TOOL_SHORTCUTS=Object.freeze({v:'select',h:'pan',p:'point',s:'segment',l:'line',a:'arrow',c:'circle',r:'rectangle',f:'freehand',n:'node',m:'morphism',t:'text'});
export const shortcutForTool=Object.freeze(Object.fromEntries(Object.entries(TOOL_SHORTCUTS).map(([key,tool])=>[tool,key.toUpperCase()])));
export function canvasShortcut(event,active,canvas,hidden=false){
 if(hidden||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.isComposing||event.keyCode===229||event.repeat)return null;
 if(!active||!(active===globalThis.document?.body||active===canvas||active.classList?.contains('object')||active.classList?.contains('tool')))return null;
 return TOOL_SHORTCUTS[event.key?.toLowerCase()]||null;
}
