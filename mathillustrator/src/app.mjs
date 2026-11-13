import {TOOLS,PRESETS,PRESET_MODULES,newDoc,clone,append,get,position,points,remove,affected,snapPoint,addPoint,createAnchored,createResolver,validateDoc,command,parseExpression,checkNewGeometry,guardAnchorMove,finite,preserveInheritedPointSizes} from './model.mjs';
import {smoothCurveSvg,smoothPath,closeFreehandStroke,worldBounds,pageRect,arrowCurve,regularPolygonVertices,arrowHeadPoints,clipInfiniteLine,formatCoordinate,fitSceneView,bboxOutsideViewport,circleOutsideViewport} from './geometry.mjs?repair=boot-20261113';
import {importTikzCd,exportTikzCd,canExportTikzCd} from './diagram.mjs';
import {sampleExplicitPlot,plotPath} from './plot.mjs';
import {mathReady,mathMetrics,renderLatexSvg,validateLatexInput} from './math_labels.mjs';
import {localizeUI,translated} from './i18n.mjs';
import {compareAndWrite,coordinateSave} from './storage.mjs';
import {tikzGeometryIssue,tikzPoint} from './export_fidelity.mjs';
import {nodeBox,layoutNodeLabel,edgeBetweenBoxes} from './diagram_layout.mjs';
import {boxRect,routeDiagramEdge,pathData,labelOnPolyline,labelOnQuadratic,labelDragOffset} from './diagram_routing.mjs';
import {optimizeGlobalArrowRoutes} from './diagram_global_routing.mjs';
import {createAnchorIndex,cycleSelection} from './anchor_index.mjs';
import {layoutPointLabels,createLabelLayoutCache} from './label_layout.mjs';
import {createPlotCache} from './plot_cache.mjs';
import {layoutMorphismLabels} from './morphism_label_layout.mjs';
import {PANEL_MIN, PANEL_MAX, CANVAS_MIN, COLLAPSED_RAIL, validPanelWidth, fitPanels} from './panel_sizes.mjs';
import {PROPERTY_DOCK_DEFAULT, PROPERTY_DOCK_MIN, normalizePropertiesLayout, fitFloatingProperties, fitDockPropertiesHeight} from './properties_layout.mjs';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const plotCache=createPlotCache();
const labelCache=createLabelLayoutCache();
const limitedPlotKeys=new Set();let plotLimitedInScene=false;
const glyph={select:'<path d="M5 3L5 22L10 16L14 23L17 21L13 14L21 13Z"/>',pan:'<path d="M12 2V22M2 12H22M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3"/>',point:'<circle cx="12" cy="12" r="3.3" fill="currentColor"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',segment:'<path d="M3 20L21 4"/><circle cx="3" cy="20" r="2" fill="currentColor"/><circle cx="21" cy="4" r="2" fill="currentColor"/>',arrow:'<path d="M3 20L21 4M13 4h8v8"/>',circle:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',rectangle:'<rect x="4" y="5" width="16" height="14"/>',polygon:'<path d="M3 18L9 4L21 10L18 21Z"/><circle cx="3" cy="18" r="1.6" fill="currentColor"/><circle cx="9" cy="4" r="1.6" fill="currentColor"/><circle cx="21" cy="10" r="1.6" fill="currentColor"/><circle cx="18" cy="21" r="1.6" fill="currentColor"/>',polyline:'<path d="M3 17L8 5L14 13L21 4"/><circle cx="3" cy="17" r="1.6" fill="currentColor"/><circle cx="8" cy="5" r="1.6" fill="currentColor"/><circle cx="14" cy="13" r="1.6" fill="currentColor"/><circle cx="21" cy="4" r="1.6" fill="currentColor"/>',freehand:'<path d="M2 20C8-6 12 30 22 3"/>',text:'<path d="M3 6V3h18v3M12 3v18M8 21h8"/>'};
glyph.line='<path d="M3.5 20.5L20.5 3.5M3.5 14.5V20.5H9.5M14.5 3.5H20.5V9.5"/>';glyph.ellipse='<ellipse cx="12" cy="12" rx="10" ry="6"/>';glyph.bezier='<path d="M4 19C5 6 19 6 20 19"/><circle cx="4" cy="19" r="2" fill="currentColor"/><circle cx="20" cy="19" r="2" fill="currentColor"/>';glyph.regularPolygon='<path d="M12 3L20.6 9.5L17.5 20H6.5L3.4 9.5Z"/><circle cx="12" cy="3" r="1.4" fill="currentColor"/><circle cx="20.6" cy="9.5" r="1.4" fill="currentColor"/><circle cx="17.5" cy="20" r="1.4" fill="currentColor"/><circle cx="6.5" cy="20" r="1.4" fill="currentColor"/><circle cx="3.4" cy="9.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/>';glyph.angle='<path d="M3.5 5L8.5 19H21M7 14.8Q10.6 13.8 12.6 19"/><circle cx="3.5" cy="5" r="1.5" fill="currentColor"/><circle cx="8.5" cy="19" r="1.6" fill="currentColor"/><circle cx="21" cy="19" r="1.5" fill="currentColor"/>';glyph.node='<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M8 12h8"/>';glyph.morphism='<rect x="1" y="8" width="5" height="8"/><rect x="18" y="8" width="5" height="8"/><path d="M6 12h12l-4-4m4 4-4 4"/>';
// A fixed, keyboard-operable palette only changes ordinary document colors.
// Custom hues remain available via native <input type=color> controls.
const COMMON_COLORS=[
 ['Ink','#111827'],['White','#ffffff'],['Gray','#94a3b8'],
 ['Red','#ef4444'],['Orange','#f97316'],['Yellow','#eab308'],
 ['Green','#22c55e'],['Teal','#14b8a6'],['Sky','#0ea5e9'],
 ['Blue','#3b82f6'],['Purple','#a855f7']
];
function syncColorSwatches(){
 for(const group of document.querySelectorAll('[data-color-swatches]')){
  const role=group.dataset.colorSwatches,property=group.dataset.colorProperty;
  const value=role==='default'?doc.settings[property]:get(doc,selected)?.style?.[property];
  if(typeof value!=='string')continue;
  for(const button of group.querySelectorAll('button[data-color]'))
   button.setAttribute('aria-pressed',String(button.dataset.color===value.toLowerCase()));
  // The property pane may keep keyboard focus after a transaction; update its
  // live picker without replacing the focused swatch or invalidating handlers.
  if(role==='object'){
   const picker=group.previousElementSibling?.querySelector('input[type=color]');
   if(picker&&picker!==document.activeElement)picker.value=value;
  }
 }
}
function appendColorSwatches(parent,{scope,property,apply}){
 const group=document.createElement('div');group.className='color-swatches';group.dataset.colorSwatches=scope;
 group.dataset.colorProperty=property;group.setAttribute('role','group');
 group.setAttribute('aria-label',property==='stroke'?'Stroke colors':'Fill colors');
 for(const [name,hex] of COMMON_COLORS){
  const button=document.createElement('button');button.type='button';button.className='color-swatch';
  button.dataset.color=hex;button.style.setProperty('--swatch',hex);
  button.setAttribute('aria-label',name);button.title=name+' ('+hex+')';
  button.setAttribute('aria-pressed','false');
  button.onclick=()=>{if(apply(hex)!==false)syncColorSwatches();};
  group.append(button);
 }
 parent.append(group);syncColorSwatches();return group;
}
const toolGroups={'basic-tools':[['select','Move'],['pan','Pan']], 'construction-tools':[['point','Point'],['segment','Segment'],['arrow','Vector'],['line','Infinite line'],['angle','Angle'],['circle','Circle'],['ellipse','Ellipse'],['rectangle','Rectangle'],['polygon','Polygon'],['regularPolygon','Regular polygon'],['polyline','Polyline'],['bezier','Bézier']], 'diagram-tools':[['node','Diagram node'],['morphism','Morphism']], 'illustration-tools':[['freehand','Free curve'],['text','Text']]};
// UI-only groups: object types, commands, and project JSON remain unchanged.
const geometryCategories=[
 {id:'points-lines',title:'Points & lines',tools:['point','segment','arrow','line','angle']},
 {id:'circles-conics',title:'Circles & conics',tools:['circle','ellipse']},
 {id:'polygons',title:'Polygons',tools:['rectangle','polygon','regularPolygon']},
 {id:'curves',title:'Curves',tools:['polyline','bezier']}
];
const touchContacts=new Set();let touchBlocked=false,pendingTouchTap=null;
let currentMorphismLabels=new Map();
let trash=[],doc=newDoc(),selected=null,tool='select',drag=null,draftStart=null,draftPoints=[],hover=null,view={cx:0,cy:0,scale:48},size={w:900,h:600},history=[],future=[],saveTimer=null,dirty=false,lastRender=0,frame=0,draftNode=null,lastStored=null,storageConflict=false,documentRevision=0,documentGeneration=0;
const STORAGE='mathillustrator-project-v1',SETTINGS='mathillustrator-ui-v1',TRASH='mathillustrator-trash-v1';
let uiPrefs={language:'en',font:'system',autoMove:true,sections:[],geometryGroups:[],collapsed:{}};
function notice(msg){const e=$('toast');e.textContent=msg;e.classList.add('visible');clearTimeout(notice.timer);notice.timer=setTimeout(()=>e.classList.remove('visible'),3400);}
function safeStorageSet(key,value){try{localStorage.setItem(key,value);return true;}catch(e){notice('Local save unavailable: '+e.message);return false;}}
function saveStatus(message,canRetry=false){
 const node=$('autosave-info');if(node)node.textContent=message;
 const retry=$('retry-autosave');if(retry)retry.hidden=!canRetry;
}
function setStorageConflict(state,reason='other'){
 storageConflict=state;
 const banner=$('conflict-banner');banner.hidden=!state;
 // A corrupted startup snapshot and a later cross-tab disagreement are
 // different incidents. Never retain the stale 'invalid' heading after recovery.
 banner.querySelector('strong').textContent=state&&reason==='corrupt'
  ?'The locally saved project is invalid.':'Another tab changed this project.';
 if(state){saveStatus(reason==='corrupt'?'Corrupt local project · autosave paused':'Autosave paused · other tab changed');
  if(reason!=='corrupt')notice('Other tab changed this project. Resolve conflict before autosaving.');}
}
function commitLatest(){
 if(storageConflict||!dirty)return false;
 try{
  // Construct the snapshot only inside the critical section. A queued save
  // must never apply a stale captured document after Undo, Open or Load other.
  const payload=JSON.stringify(doc),result=compareAndWrite(localStorage,STORAGE,lastStored,payload);
  if(!result.ok){setStorageConflict(true);return false;}
  lastStored=payload;dirty=false;
  saveStatus(navigator.locks?.request?'Saved locally':'Saved locally · cross-tab lock unavailable');return true;
 }catch(e){saveStatus('Not saved locally · download JSON',true);notice('Autosave unavailable: '+e.message+'. Use Save to download a backup.');return false;}
}
function persistNow(){
 if(storageConflict){saveStatus('Autosave paused · conflict');return false;}
 try{
  // Secure-context browsers coordinate writers across tabs. The callback
  // rechecks dirty/conflict and the latest storage revision under the lock.
  const result=coordinateSave(navigator.locks,STORAGE,commitLatest);
  if(result&&typeof result.catch==='function')return result.catch(e=>{saveStatus('Save coordination failed · download JSON',true);notice('Save coordination failed: '+e.message);return false;});
  return result;
 }catch(e){saveStatus('Save coordination failed · download JSON',true);notice('Save coordination failed: '+e.message);return false;}
}
function enqueueSave(){dirty=true;saveStatus('Local changes pending…');clearTimeout(saveTimer);saveTimer=setTimeout(persistNow,400);}
function recordUndo(before){
 history.push(before);let evicted=false;
 const bytes=()=>history.reduce((sum,s)=>sum+s.length*2,0);
 while(history.length>80||(history.length>1&&bytes()>30*1024*1024)){history.shift();evicted=true;}
 if(evicted)notice('Older undo states were evicted to limit memory use.');
 future=[];syncHistory();
}
function syncHistory(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function restore(s){doc=validateDoc(JSON.parse(s));documentRevision++;documentGeneration++;selected=null;clearDraft();enqueueSave();renderAll();}
function undo(){if(drag){cancelDrag();return;}if(!history.length)return;future.push(JSON.stringify(doc));restore(history.pop());syncHistory();}
function redo(){if(drag){cancelDrag();return;}if(!future.length)return;history.push(JSON.stringify(doc));restore(future.pop());syncHistory();}
let pendingPropertiesFrame=0;
function refreshAfterMutation(forceProperties=false){
 renderList();syncSettings();render();
 // Editing controls must not be replaced after the next animation frame while
 // focus remains inside the property pane: two rapid changes otherwise race
 // against detached onchange handlers and silently lose one of the edits.
 if(pendingPropertiesFrame)cancelAnimationFrame(pendingPropertiesFrame);
 pendingPropertiesFrame=requestAnimationFrame(()=>{
  pendingPropertiesFrame=0;
  if(forceProperties||!$('properties').contains(document.activeElement)){renderProperties();localizeUI($('properties'),uiPrefs.language);}
 });
}
function update(mutator,{refreshList=true,renderCanvas=true}={}){
 if(drag)cancelDrag(); // A document mutation must not leave an old gesture able to commit later.
 const old=JSON.stringify(doc),previousSelected=selected,beforeDoc=doc;
 // A rejected edit rolls back JSON but does not replace the *logical* project.
 // The still-focused controls must be able to resolve their live object by ID
 // until the deferred property-pane refresh. A genuinely new/imported project
 // instead increments documentGeneration, invalidating all old controls.
 try{mutator();validateDoc(doc);}catch(e){doc=JSON.parse(old);selected=previousSelected;notice(e.message);if(renderCanvas)refreshAfterMutation(true);else syncSettings();return false;}
 const replaced=doc!==beforeDoc;if(replaced){documentGeneration++;clearDraft();}
 if(JSON.stringify(doc)!==old){recordUndo(old);documentRevision++;enqueueSave();}
 if(refreshList)refreshAfterMutation(replaced||selected!==previousSelected);else{syncSettings();if(renderCanvas)render();}return true;
}
function el(tag,attrs={},content){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs)){if(v!==undefined&&v!==null)e.setAttribute(k,String(v));}if(content!==undefined)e.textContent=String(content);return e;}
function project(p){return [(p[0]-view.cx)*view.scale+size.w/2,(view.cy-p[1])*view.scale+size.h/2];}
function unproject(x,y){return [(x-size.w/2)/view.scale+view.cx,(size.h/2-y)/view.scale+view.cy];}
function xyEvent(e){const b=$('drawing').getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top];}
function screenPoints(o){const p=points(doc,o);return p.every(Boolean)?p.map(project):null;}
function desc(o,nameById=null){if(o.type==='point')return `(${o.xy.map(formatCoordinate).join(', ')})`;
 if(o.type==='midpoint')return `Midpoint(${o.refs?.map(id=>nameById?.get(id)||get(doc,id)?.name||'?').join(', ')})`;
 if(o.type==='function')return `y = ${o.expr}`;
 if(o.type==='regularPolygon')return `Regular polygon · ${o.sides} sides`;
 if(o.type==='text')return o.text;
 if(o.refs)return `${o.type}(${o.refs.map(id=>nameById?.get(id)||get(doc,id)?.name||'?').join(', ')})`;
 if(o.path)return `${o.path.length} path points`;
 return o.type;
}
function simple(a,b){return Math.round(a*100)/100===Math.round(b*100)/100;}
function drawBackground(svg,includeGrid=true,exporting=false){if(!(exporting&&doc.settings.exportTransparent))svg.append(el('rect',{x:0,y:0,width:size.w,height:size.h,fill:doc.settings.background||'#fff'}));
 const settings=doc.settings;if(settings.page!=='infinite'&&!exporting){
  const r=pageRect(size,settings.page);svg.append(el('rect',{x:r.x,y:r.y,width:r.width,height:r.height,fill:'none',stroke:'#94a3b8','stroke-width':1.5,'stroke-dasharray':'5 4',opacity:.8}));
 }
 if(!includeGrid)return;
 const minX=view.cx-size.w/(2*view.scale),maxX=view.cx+size.w/(2*view.scale),minY=view.cy-size.h/(2*view.scale),maxY=view.cy+size.h/(2*view.scale);
 let step=Number(settings.snapStep)||.5;while(step*view.scale<24)step*=2;while(step*view.scale>100)step/=2;
 if(settings.grid){const g=el('g',{'stroke':'#9daec1','stroke-width':.65,opacity:.28});for(let x=Math.ceil(minX/step)*step,n=0;x<=maxX&&n<150;x+=step,n++){const [sx]=project([x,0]);g.append(el('line',{x1:sx,y1:0,x2:sx,y2:size.h}));}for(let y=Math.ceil(minY/step)*step,n=0;y<=maxY&&n<150;y+=step,n++){const [,sy]=project([0,y]);g.append(el('line',{x1:0,y1:sy,x2:size.w,y2:sy}));}svg.append(g);}
 if(settings.showAxes){const [zx,zy]=project([0,0]),g=el('g',{stroke:'#738396','stroke-width':1});if(zx>=0&&zx<=size.w)g.append(el('line',{x1:zx,y1:0,x2:zx,y2:size.h}));if(zy>=0&&zy<=size.h)g.append(el('line',{x1:0,y1:zy,x2:size.w,y2:zy}));svg.append(g);}
}
function attr(o,selectHighlight=false){return {stroke:selectHighlight?'#7e66df':o.style?.stroke||'#3657ad','stroke-width':Math.max(.15,Number(o.style?.width)||2)+(selectHighlight?1:0),fill:o.style?.fill||'none',opacity:o.style?.opacity??1};}
/** Explicit author newlines are SVG text lines, not collapsed whitespace.
 * Keep single-line text as one text node for compatibility and DOM economy.
 * Only visual layout changes; JSON always retains the original author string.
 */
function textLines(value){return String(value).split(/\r\n?|\n/u);}
function appendTextLines(node,value,x,y,fontSize=18,{centered=false}={}){
 const lines=textLines(value);
 if(lines.length===1){node.textContent=value;return;}
 const height=fontSize*1.32,top=y-(centered?(lines.length-1)*height/2:0);
 for(let i=0;i<lines.length;i++)node.append(el('tspan',{x,y:top+i*height},lines[i]));
}
/** Conservative text bounds for safely culling labels far outside the canvas.
 * Approximate text metrics are intentionally widened: no near-edge label may
 * disappear just because the browser chooses a different font.
 */
function textOutside(x,y,text,fontSize){
 const lines=textLines(text),longest=Math.max(0,...lines.map(line=>[...line].length));
 const right=x+longest*fontSize*1.7+fontSize,top=y-fontSize*1.6;
 const bottom=y+fontSize*(lines.length-1)*1.4+fontSize;
 return bboxOutsideViewport([[x-fontSize,top],[right,bottom]],size.w,size.h,40);
}
function labelBox(o){
 if(o?.textMode==='latex'&&mathReady()){
  try{const m=mathMetrics(o.text,o.fontSize||17);return {width:Math.max(12,m.width+16),height:Math.max(18,m.height+12),lines:[o.text],lineHeight:m.height};}
  catch{ return {width:140,height:40,lines:[o.text],lineHeight:20}; }
 }
 return nodeBox(o.text,o.fontSize);
}
function latexDisplay(o,x,y,fontSize,{anchor='start',vertical='baseline',color=o.style.stroke,opacity=o.style.opacity,exporting=false}={}){
 if(o.textMode!=='latex')return null;
 try{return renderLatexSvg(o.text,x,y,fontSize,{anchor,vertical,color,opacity});}
 catch(error){if(exporting)throw Error('Cannot export LaTeX label "'+o.name+'": '+error.message);
  return el('text',{x,y,fill:'#b45309','font-size':12,'pointer-events':'none'},'⚠ TeX');}
}
function renderObject(svg,o,resolver,exporting=false,labelPositions=null,diagramBoxes=null,morphismLabels=null,morphismRoutes=null){
 if(o.hidden||o.style?.opacity===0)return;
 const isSel=selected===o.id&&!exporting,sty=attr(o,isSel),p=resolver.points(o);
 const coords=p.every(Boolean)?p.map(project):null;
 // Avoid building large, fully offscreen SVG subtrees. This is deliberately
 // conservative: control-point hulls bound Béziers, and labels/node boxes are
 // excluded because they have their own independent pixel dimensions.
 const cullMargin=Math.max(28,(Number(o.style.width)||2)*2+12);
 if(coords&&['segment','arrow','rectangle','ellipse','polygon','polyline','bezier','angle'].includes(o.type)
   &&bboxOutsideViewport(coords,size.w,size.h,cullMargin))return;
 if(o.type==='circle'&&coords?.length===2&&circleOutsideViewport(coords[0],
    Math.hypot(coords[1][0]-coords[0][0],coords[1][1]-coords[0][1]),size.w,size.h,cullMargin))return;
 const mk=(tag,a)=>el(tag,{...sty,...a});let item=null;
 if(o.type==='point'||o.type==='midpoint'){
  const pt=resolver.at(o.id);if(!pt)return;const [x,y]=project(pt);
  const radius=Number(o.style.pointSize??doc.settings.pointSize)||5;
  const displayedLabel=o.pointLabel||o.name;
  const reach=doc.settings.showLabels?Math.max(50,displayedLabel.length*14+18):0;
  // Offscreen point culling preserves visible labels that reach into the frame.
  if(x < -radius-reach || x > size.w+radius || y < -radius-22 || y > size.h+radius+22)return;
  item=el('circle',{cx:x,cy:y,r:radius,stroke:isSel?'#7e66df':o.style.stroke,fill:o.style.stroke,'stroke-width':1,opacity:sty.opacity});
  if(doc.settings.showLabels){const label=labelPositions?.get(o.id),lx=label?.x??x+8,ly=label?.y??y-9;
   if(o.pointLabelMode==='latex')svg.append(latexDisplay({ ...o,text:displayedLabel,textMode:'latex' },lx,ly,12,{anchor:label?.anchor||'start',exporting}));
   else svg.append(el('text',{'xml:space':'preserve',x:lx,y:ly,'text-anchor':label?.anchor||'start','font-size':12,'font-family':'Arial, sans-serif',fill:o.style.stroke,opacity:sty.opacity,'pointer-events':'none'},displayedLabel));}
 }else if(['segment','arrow','line'].includes(o.type)&&coords?.length===2){
  let [a,b]=coords;if(o.type==='line'){
   const clipped=clipInfiniteLine(a,b,size.w,size.h);
   if(!clipped)return;[a,b]=clipped;
  }
  if(o.type==='arrow'){
   const head=arrowHeadPoints(b,a,o.style.width);
   item=el('g');item.append(mk('path',{d:`M${a.join(' ')} L${b.join(' ')}`,fill:'none'}));
   if(head.length)item.append(el('polygon',{class:'arrowhead',points:head.map(q=>q.join(',')).join(' '),fill:o.style.stroke,opacity:sty.opacity,'pointer-events':'none'}));
  }else item=mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'});
 }else if(o.type==='circle'&&coords?.length===2){item=mk('circle',{cx:coords[0][0],cy:coords[0][1],r:Math.hypot(coords[1][0]-coords[0][0],coords[1][1]-coords[0][1]),fill:'none'});
 }else if(o.type==='ellipse'&&coords?.length===2){
  const a=coords[0],b=coords[1],rx=Math.abs(a[0]-b[0])/2,ry=Math.abs(a[1]-b[1])/2;
  // Render historical v1 flattened ellipses as their limiting line, not invisible SVG ellipses.
  item=rx<1e-7||ry<1e-7 ?mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'})
   :mk('ellipse',{cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2,rx,ry,'fill-opacity':.20});
 }else if(o.type==='rectangle'&&coords?.length===2){
  const a=coords[0],b=coords[1];item=mk('rect',{x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),width:Math.abs(a[0]-b[0]),height:Math.abs(a[1]-b[1]),'fill-opacity':.24});
 }else if(['polygon','polyline'].includes(o.type)&&coords?.length>=2){item=mk(o.type==='polygon'?'polygon':'polyline',{points:coords.map(q=>q.join(',')).join(' '),fill:o.type==='polygon'?sty.fill:'none','fill-opacity':.24});
 }else if(o.type==='regularPolygon'&&p.length===2&&p.every(Boolean)){const vertices=regularPolygonVertices(p[0],p[1],o.sides).map(project);if(bboxOutsideViewport(vertices,size.w,size.h,cullMargin))return;if(vertices.length)item=mk('polygon',{points:vertices.map(q=>q.join(',')).join(' '),'fill-opacity':.24});
 }else if(o.type==='bezier'&&coords?.length===4){item=mk('path',{d:`M${coords[0].join(' ')} C${coords[1].join(' ')},${coords[2].join(' ')},${coords[3].join(' ')}`,fill:'none'});
 }else if(o.type==='angle'&&coords?.length===3){const [a,b,c]=coords,r=26,theta1=Math.atan2(a[1]-b[1],a[0]-b[0]),theta2=Math.atan2(c[1]-b[1],c[0]-b[0]);let delta=(theta2-theta1+Math.PI*2)%(Math.PI*2);if(delta>Math.PI)delta-=2*Math.PI;const start=[b[0]+r*Math.cos(theta1),b[1]+r*Math.sin(theta1)],end=[b[0]+r*Math.cos(theta1+delta),b[1]+r*Math.sin(theta1+delta)];item=mk('path',{d:`M${start.join(' ')} A${r} ${r} 0 0 ${delta>0?1:0} ${end.join(' ')}`,fill:'none'});
 }else if(o.type==='freehand'&&o.path?.length>1){const pathCoords=o.path.map(project);if(bboxOutsideViewport(pathCoords,size.w,size.h,cullMargin))return;item=mk('path',{d:smoothCurveSvg(pathCoords,!!o.closed,o.joinStyle),fill:'none','stroke-linejoin':o.joinStyle==='corner'?'miter':'round','stroke-miterlimit':3,'stroke-linecap':'round'});
 }else if(o.type==='text'){const [x,y]=project(o.xy),fontSize=o.fontSize||18;if(textOutside(x,y,o.text,fontSize))return;
  if(o.textMode==='latex'){item=latexDisplay(o,x,y,fontSize,{exporting});if(!exporting)item.setAttribute('pointer-events','visiblePainted');}
  else{item=el('text',{'xml:space':'preserve',x,y,'font-size':fontSize,'font-family':o.fontFamily||'Arial, sans-serif',fill:o.style.stroke,opacity:sty.opacity});
   appendTextLines(item,o.text,x,y,fontSize);}
 }else if(o.type==='node'){
  const [x,y]=project(o.xy),{width,height,lines,lineHeight}=o.textMode==='latex'?labelBox(o):layoutNodeLabel(o.text,o.fontSize||17);
  if(bboxOutsideViewport([[x-width/2,y-height/2],[x+width/2,y+height/2]],size.w,size.h,cullMargin))return;
  item=el('g',{'data-id':o.id});
  if(o.nodeBorder)item.append(el('rect',{x:x-width/2,y:y-height/2,width,height,rx:7,stroke:sty.stroke,'stroke-width':sty['stroke-width'],fill:sty.fill,'fill-opacity':.18,opacity:sty.opacity}));
  else if(!exporting)item.append(el('rect',{x:x-width/2,y:y-height/2,width,height,fill:'transparent','pointer-events':'all','data-id':o.id,'aria-label':'Select diagram node'}));
  if(o.textMode==='latex')item.append(latexDisplay(o,x,y,o.fontSize||17,{anchor:'middle',vertical:'middle',exporting}));
  else{const label=el('text',{'xml:space':'preserve','text-anchor':'middle','font-size':o.fontSize||17,'font-family':o.fontFamily||'Georgia, serif',fill:sty.stroke,opacity:sty.opacity,'pointer-events':'none'});
   const startY=y-(lines.length-1)*lineHeight/2+(o.fontSize||17)*.32;
   lines.forEach((line,i)=>label.append(el('tspan',{x,y:startY+i*lineHeight},line||'\u00a0')));item.append(label);}
 }else if(o.type==='morphism'&&coords?.length===2){
  const fromNode=resolver.object(o.refs[0]),toNode=resolver.object(o.refs[1]);
  if(!fromNode||!toNode||fromNode.hidden||toNode.hidden||fromNode.style.opacity===0||toNode.style.opacity===0)return;
  const fromBox=labelBox(fromNode),toBox=labelBox(toNode);
  const auto=['avoid','avoid-crossings','scene-crossings'].includes(o.routing);
  const route=morphismRoutes?.get(o.id);
  if(!route)return; // Route was validated and frozen for this render in document order.
  if(!route.points.length)return; // Historical overlapping boxes retain semantic edge but have no drawable path.
  const a=route.points[0],b=route.points.at(-1),curve=auto?null:arrowCurve(a,b,o.bend||0);
  if(!auto&&!curve)return;
  const routed=route.status==='routed';
  const d=auto?pathData(route.points):`M${a[0].toFixed(2)} ${a[1].toFixed(2)} Q${curve.control[0].toFixed(2)} ${curve.control[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  const headFrom=auto?route.points.at(-2):curve.control;
  const head=arrowHeadPoints(b,headFrom,o.style.width),blocked=['blocked','crossing','capacity'].includes(route.status);
  item=el('g',{'data-id':o.id,'data-route-status':route.status});
  const path=mk('path',{d,fill:'none'});
  if(blocked){path.setAttribute('stroke','#b45309');path.setAttribute('stroke-dasharray','6 4');
   const reason=route.status==='capacity'?'Crossing inspection limit reached: the layout is not verified against other arrows.':
    route.status==='crossing'?'Some arrow crossings remain after the bounded candidate search.':
    'Automatic routing could not find a clear two-turn path around diagram nodes.';
   item.append(el('title',{},reason+' Dashed amber means unresolved.'));}
  if(['dashed','hook-dashed'].includes(o.arrowStyle))path.setAttribute('stroke-dasharray','7 5');
  if(o.arrowStyle==='dotted')path.setAttribute('stroke-dasharray','2 5');
  item.append(path);
  if(['hook','hook-dashed'].includes(o.arrowStyle)){const from=auto?route.points[1]:curve.control;const len=Math.hypot(from[0]-a[0],from[1]-a[1]);if(len>1){const ux=(from[0]-a[0])/len,uy=(from[1]-a[1])/len;item.append(mk('path',{d:`M${a[0]-uy*7} ${a[1]+ux*7} Q${a[0]-ux*6-uy*8} ${a[1]-uy*6+ux*8} ${a[0]-ux*6} ${a[1]-uy*6}`,fill:'none'}));}}
  if(o.arrowStyle==='tail'){const from=auto?route.points[1]:curve.control;const len=Math.hypot(from[0]-a[0],from[1]-a[1]);if(len>1){const ux=(from[0]-a[0])/len,uy=(from[1]-a[1])/len;item.append(mk('line',{x1:a[0]-uy*6,y1:a[1]+ux*6,x2:a[0]+uy*6,y2:a[1]-ux*6}));}}
  if(o.arrowStyle==='twohead'){const first=arrowHeadPoints(a,auto?route.points[1]:curve.control,o.style.width);if(first.length)item.append(el('polygon',{points:first.map(q=>q.join(',')).join(' '),fill:o.style.stroke,'pointer-events':'none'}));}
  if(head.length)item.append(el('polygon',{class:'arrowhead',points:head.map(q=>q.join(',')).join(' '),fill:blocked?'#b45309':o.style.stroke,opacity:sty.opacity,'pointer-events':'none'}));
  if(o.text){const t=o.labelT??.5,distance=o.labelDistance??17,dx=o.labelDx??0,dy=o.labelDy??0;
   const pos=auto?labelOnPolyline(route.points,t,distance,!!o.swap,dx,dy):labelOnQuadratic(a,curve.control,b,t,distance,!!o.swap,dx,dy);
   if(pos){const placed=morphismLabels?.get(o.id),[lx,ly]=placed?[placed.x,placed.y]:pos;
    if(placed?.status==='crowded'){item.setAttribute('data-label-collision','unresolved');
     item.append(el('title',{},'Label collision remains: no clear location among the supported candidates. Adjust the label manually.'));}
    if(o.textMode==='latex')item.append(latexDisplay(o,lx,ly,15,{anchor:'middle',color:placed?.status==='crowded'?'#b45309':o.style.stroke,exporting}));
    else{const label=el('text',{'xml:space':'preserve',x:lx,y:ly,'font-size':15,'font-family':o.fontFamily||'Georgia, serif','text-anchor':'middle',fill:placed?.status==='crowded'?'#b45309':o.style.stroke,'paint-order':'stroke','stroke':exporting&&doc.settings.exportTransparent?'none':doc.settings.background,'stroke-width':4,opacity:sty.opacity});
     appendTextLines(label,o.text,lx,ly,15,{centered:true});item.append(label);}
    // Editing-only handle: never exported and never part of the semantic graph.
    // The root SVG captures the pointer, so a redraw cannot orphan the gesture.
    if(isSel&&!o.locked&&tool==='select'){
     const handle=el('circle',{'data-label-handle':o.id,'data-id':o.id,cx:lx+12,cy:ly-14,r:7,
      fill:'#fff',stroke:'#6b51cd','stroke-width':2,'aria-label':'Drag arrow label','pointer-events':'all'});
     handle.append(el('title',{},'Drag to reposition arrow label; Undo restores its former position'));
     item.append(handle);
    }
   }
  }
 }else if(o.type==='function'){
  const key=JSON.stringify([o.expr,doc.settings.plotQuality,view.cx,view.cy,view.scale,size.w,size.h]);
  const path=plotCache.get(key,()=>{
   const f=parseExpression(o.expr),plot=sampleExplicitPlot(f,px=>unproject(px,0)[0],y=>project([0,y])[1],size.w,size.h,{quality:doc.settings.plotQuality});
   if(plot.limited){limitedPlotKeys.add(key);while(limitedPlotKeys.size>32)limitedPlotKeys.delete(limitedPlotKeys.values().next().value);}
   else limitedPlotKeys.delete(key);
   return plotPath(plot.segments);
  });
  if(limitedPlotKeys.has(key))plotLimitedInScene=true;
  item=mk('path',{d:path,fill:'none'});

 }
 if(!item)return;if(sty.opacity===0)item.setAttribute('pointer-events','none');item.dataset.id=o.id;item.classList.add('clickable');if(isSel)item.classList.add('selected-shape');svg.append(item);
 if(!exporting&&sty.opacity>0&&['segment','arrow','line','freehand','polyline','function','bezier','angle','morphism'].includes(o.type)){
  const path=item.tagName.toLowerCase()==='g'?item.querySelector('path'):item;
  if(path){const hit=path.cloneNode(false);hit.removeAttribute('marker-end');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width',Math.max(12,Number(o.style.width)+8));hit.setAttribute('opacity','1');hit.setAttribute('fill','none');hit.dataset.id=o.id;svg.append(hit);}
 }
 // Hit paths are appended above the semantic group for easier line selection.
 // Keep the label handle above those transparent paths so it remains draggable.
 if(isSel&&o.type==='morphism'){
  const handle=item.querySelector('[data-label-handle]');if(handle)svg.append(handle);
 }
}
function draw(svg,{exporting=false}={}){
 svg.setAttribute('viewBox',`0 0 ${size.w} ${size.h}`);svg.setAttribute('width',size.w);svg.setAttribute('height',size.h);
 drawBackground(svg,!exporting||doc.settings.exportGuides,exporting);
 const resolver=createResolver(doc);
 // Build obstacle rectangles once per drawing, and only when the author enables
 // obstacle-aware routing. Standard diagrams pay none of this extra work.
 let diagramBoxes=null;
 if(doc.objects.some(o=>o.type==='morphism'&&!o.hidden&&o.style?.opacity!==0&&['avoid','avoid-crossings','scene-crossings'].includes(o.routing))){
  diagramBoxes=new Map();for(const node of doc.objects){
   if(node.type!=='node'||node.hidden||node.style?.opacity===0)continue;
   const center=resolver.at(node.id);if(!center)continue;
   diagramBoxes.set(node.id,boxRect(project(center),labelBox(node)));
  }
 }
 // Cut24: calculate routes ONCE in stable document order. Crossing reduction
 // considers only earlier visible arrows; it never moves nodes or rewrites refs.
 // Reusing this map for rendering, label placement, and exported figures avoids
 // discrepancies between the UI and the serialized SVG/raster output.
 const morphismRoutes=new Map(),earlierArrowPaths=[],routeEntries=[];
 for(const o of doc.objects){
  if(o.type!=='morphism'||o.hidden||o.style?.opacity===0)continue;
  const from=resolver.object(o.refs[0]),to=resolver.object(o.refs[1]);
  if(!from||!to||from.hidden||to.hidden||from.style?.opacity===0||to.style?.opacity===0)continue;
  const p=resolver.points(o);if(!p.every(Boolean))continue;
  const a=project(p[0]),b=project(p[1]),fb=labelBox(from),tb=labelBox(to);
  const mode=o.routing||'direct';
  const obstacles=mode!=='direct'&&diagramBoxes?[...diagramBoxes].filter(([id])=>!o.refs.includes(id)).map(([,rect])=>rect):[];
  const route=routeDiagramEdge(a,b,fb,tb,obstacles,mode==='scene-crossings'?'avoid':mode,mode==='avoid-crossings'?earlierArrowPaths:[]);
  morphismRoutes.set(o.id,route);
  let crossingPath=route.points;
  if(route.points.length>1){
   // Direct curved arrows need a small bounded polyline approximation for
   // screen-space crossing tests; exact quadratic intersections are not claimed.
   if(mode==='direct'&&o.bend){const begin=route.points[0],end=route.points.at(-1),curve=arrowCurve(begin,end,o.bend);
    if(curve){const points=[];for(let i=0;i<=12;i++){const t=i/12,u=1-t;points.push([u*u*begin[0]+2*u*t*curve.control[0]+t*t*end[0],u*u*begin[1]+2*u*t*curve.control[1]+t*t*end[1]]);}earlierArrowPaths.push(points);crossingPath=points;}
    else earlierArrowPaths.push(route.points);
   }else earlierArrowPaths.push(route.points);
  }
  routeEntries.push({id:o.id,a,b,fromBox:fb,toBox:tb,obstacles,mode,crossingPath});
 }
 // Cut25 opt-in whole-scene refinement. It examines later arrows as well as
 // earlier ones, but never changes routes for objects in legacy modes.
 if(routeEntries.some(e=>e.mode==='scene-crossings')){
  const globallyRefined=optimizeGlobalArrowRoutes(routeEntries,morphismRoutes);
  for(const [id,route] of globallyRefined)morphismRoutes.set(id,route);
 }
 // Cut23: reserve manually positioned diagram labels and visible nodes before
 // best-effort placement of opted-in morphism labels. Use the same positions
 // for the editor and SVG/raster exports. This is presentation-only.
 let computedMorphismLabels=new Map();
 if(doc.objects.some(o=>o.type==='morphism'&&!o.hidden&&o.style?.opacity!==0&&o.text&&o.labelAvoid)){
  const nodeRects=[],nodeRectById=new Map(),entries=[];
  for(const o of doc.objects){if(o.type!=='node'||o.hidden||o.style?.opacity===0)continue;
   const pt=resolver.at(o.id);if(pt){const r=boxRect(project(pt),labelBox(o));nodeRects.push(r);nodeRectById.set(o.id,r);}
  }
  for(const o of doc.objects){if(o.type!=='morphism'||o.hidden||o.style?.opacity===0||!o.text)continue;
   const p=resolver.points(o);if(!p.every(Boolean))continue;
   const from=resolver.object(o.refs[0]),to=resolver.object(o.refs[1]);
   if(!from||!to||from.hidden||to.hidden||from.style.opacity===0||to.style.opacity===0)continue;
   const a=project(p[0]),b=project(p[1]),fb=labelBox(from),tb=labelBox(to);
   const auto=['avoid','avoid-crossings','scene-crossings'].includes(o.routing);
   const route=morphismRoutes.get(o.id);if(!route?.points.length)continue;
   const begin=route.points[0],finish=route.points.at(-1),curve=auto?null:arrowCurve(begin,finish,o.bend||0);
   if(!auto&&!curve)continue;
   const t=o.labelT??.5,distance=o.labelDistance??17,dx=o.labelDx??0,dy=o.labelDy??0;
   const pos=auto?labelOnPolyline(route.points,t,distance,!!o.swap,dx,dy):labelOnQuadratic(begin,curve.control,finish,t,distance,!!o.swap,dx,dy);
   if(pos)entries.push({id:o.id,text:o.text,x:pos[0],y:pos[1],auto:!!o.labelAvoid});
  }
  computedMorphismLabels=layoutMorphismLabels(entries,nodeRects,size.w,size.h);
 }
 // Optional screen-space point-label decluttering. Keep the exact same layout
 // in editor and SVG/raster export; never hide labels or change model text.
 let labels=null;
 if(doc.settings.showLabels&&doc.settings.labelPlacement==='avoid'){
  const build=()=>{
   const entries=[];
   for(const o of doc.objects){if(!['point','midpoint'].includes(o.type)||o.hidden||o.style?.opacity===0)continue;
    const p=resolver.at(o.id);if(!p)continue;const [x,y]=project(p);
    if(x < -100||x > size.w+100||y < -100||y > size.h+100)continue;
    entries.push({id:o.id,x,y,text:o.pointLabel||o.name});
   }
   return layoutPointLabels(entries,size.w,size.h);
  };
  // A drag edits anchor coordinates before documentRevision increments, so
  // bypass the cache while a point/node is being moved. All settled document
  // changes, undo/import, viewport changes and resize enter the cache key.
  const key=JSON.stringify([documentRevision,documentGeneration,view.cx,view.cy,view.scale,size.w,size.h,doc.settings.labelPlacement]);
  labels=drag?.kind==='point'?build():labelCache.get(key,build);
 }
 // Exports may run while an editing gesture is active. Never overwrite the
 // on-screen drag handle's automatic-placement state with export-only layout.
 if(!exporting)currentMorphismLabels=computedMorphismLabels;
 for(const o of doc.objects)renderObject(svg,o,resolver,exporting,labels,diagramBoxes,computedMorphismLabels,morphismRoutes);
 // Points are picked geometrically at pointerdown. No extra SVG circle per point:
 // avoids doubling the DOM and still selects points beneath later filled polygons.
 if(!exporting){const preview=draftPoints.length?draftPoints:(draftStart?[draftStart]:[]);
  if(preview.length&&hover){const pts=[...preview,hover].map(project);svg.append(el('polyline',{points:pts.map(p=>p.join(',')).join(' '),stroke:doc.settings.stroke,'stroke-width':1.5,'stroke-dasharray':'4 4',fill:'none','pointer-events':'none'}));}
  // Live feedback uses the same a-priori correction as the committed stroke.
  // Drafts are never added to the document or the export SVG.
  if(drag?.kind==='freehand'&&drag.path.length>1){
   const prepared=closeFreehandStroke(correctedPath(drag.path),doc.settings.freehandClose,view.scale);
   const pts=prepared.path.map(project);
   svg.append(el('path',{class:'draft-freehand',d:smoothCurveSvg(pts,prepared.closed,prepared.joinStyle),stroke:doc.settings.stroke,'stroke-width':doc.settings.width,opacity:doc.settings.opacity,fill:'none','stroke-linejoin':prepared.joinStyle==='corner'?'miter':'round','stroke-miterlimit':3,'stroke-linecap':'round','pointer-events':'none'}));
  }
 }
}
function render(){if(frame){cancelAnimationFrame(frame);frame=0;}const start=performance.now(),svg=$('drawing');svg.replaceChildren();plotLimitedInScene=false;draw(svg);lastRender=performance.now()-start;$('render-info').textContent=`${doc.objects.length} objects · ${Math.round(lastRender*10)/10} ms${plotLimitedInScene?' · PLOT LIMIT: zoom/adjust detail':''}`;}
function scheduleRender(){if(!frame)frame=requestAnimationFrame(render);}
function currentObject(o){return get(doc,o.id)===o;}
// The object list is a fixed-height window. Thousands of objects should not
// construct thousands of DOM rows on every selection or imported document.
const LIST_ROW_HEIGHT=45,LIST_OVERSCAN=10;
let listedObjects=[],objectMenuContext=null;
function closeObjectMenu({restoreFocus=false}={}){
 const context=objectMenuContext,menu=$('object-action-menu');if(!context)return;
 objectMenuContext=null;menu.hidden=true;menu.replaceChildren();
 if(context.trigger.isConnected)context.trigger.setAttribute('aria-expanded','false');
 if(restoreFocus){const row=[...$('objects').querySelectorAll('.object')].find(r=>r.dataset.id===context.id);
  (row?.querySelector('.object-menu-toggle')||$('object-search-toggle')).focus();}
}
function openObjectMenu(o,trigger){
 const menu=$('object-action-menu');if(objectMenuContext?.trigger===trigger){closeObjectMenu({restoreFocus:true});return;}
 closeObjectMenu();if(!currentObject(o))return;
 const generation=documentGeneration;
 objectMenuContext={id:o.id,object:o,trigger,generation};trigger.setAttribute('aria-expanded','true');
 menu.replaceChildren();menu.setAttribute('aria-label',`${translated('Object actions',uiPrefs.language)}: ${o.name}`);
 const actions=[['visibility',o.hidden?'Show':'Hide'],['lock',o.locked?'Unlock':'Lock'],['delete','Delete']];
 const blocked=[...affected(doc,o.id)].some(id=>get(doc,id)?.locked);
 for(const [action,label] of actions){const button=document.createElement('button');button.type='button';button.dataset.action=action;
  button.setAttribute('role','menuitem');button.textContent=translated(label,uiPrefs.language);
  if(action==='delete'&&blocked){button.disabled=true;button.title=translated('Unlock dependents before deleting.',uiPrefs.language);}
  button.onclick=()=>{
   const valid=objectMenuContext?.object===o&&objectMenuContext?.generation===documentGeneration&&currentObject(o)&&generation===documentGeneration;
   closeObjectMenu();if(!valid){notice('The object changed. Reopen its menu.');return;}
   if(action==='delete')deleteObject(o.id);
   else update(()=>{if(!currentObject(o)||generation!==documentGeneration)throw Error('Stale object control.');
    if(action==='visibility')o.hidden=!o.hidden;else o.locked=!o.locked;});
   const row=[...$('objects').querySelectorAll('.object')].find(r=>r.dataset.id===o.id);
   (row?.querySelector('.object-menu-toggle')||$('object-search-toggle')).focus();
  };
  menu.append(button);
 }
 menu.hidden=false;
 const r=trigger.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;
 menu.style.left=`${Math.max(6,Math.min(innerWidth-w-6,r.right-w))}px`;
 const preferredTop=r.bottom+3,above=r.top-h-3;
 menu.style.top=`${Math.max(6,Math.min(innerHeight-h-6,preferredTop+h<=innerHeight-6?preferredTop:above>=6?above:preferredTop))}px`;
 menu.querySelector('button:not(:disabled)')?.focus();
}

function renderList({resetScroll=false}={}){
 closeObjectMenu();
 const wrapper=$('objects');
 $('object-count').textContent=String(doc.objects.length);
 const filter=($('object-search')?.value||'').toLowerCase().trim(),showHidden=$('show-hidden').checked;
 // Build the name index once. Search descriptions with many live references must
 // not call an O(scene-size) lookup for every name in every row.
 const nameById=filter?new Map(doc.objects.map(o=>[o.id,o.name])):null;
 listedObjects=[...doc.objects].reverse().filter(o=>
  (showHidden||!o.hidden)&&(!filter||`${o.name} ${desc(o,nameById)}`.toLowerCase().includes(filter)));
 const previous=resetScroll?0:wrapper.scrollTop;
 renderListWindow();
 wrapper.scrollTop=previous;
 // Programmatic scroll position restoration may change the visible range.
 renderListWindow();
}
function renderListWindow(){
 const wrapper=$('objects'),count=listedObjects.length,scroll=Math.max(0,wrapper.scrollTop),height=Math.max(90,wrapper.clientHeight);
 const first=Math.min(count,Math.max(0,Math.floor(scroll/LIST_ROW_HEIGHT)-LIST_OVERSCAN));
 const last=Math.min(count,Math.ceil((scroll+height)/LIST_ROW_HEIGHT)+LIST_OVERSCAN);
 const fragment=document.createDocumentFragment();
 function spacer(px){const e=document.createElement('div');e.className='list-spacer';e.style.height=px+'px';e.setAttribute('aria-hidden','true');return e;}
 if(first)fragment.append(spacer(first*LIST_ROW_HEIGHT));
 for(let i=first;i<last;i++){
  const o=listedObjects[i],row=document.createElement('div');row.tabIndex=0;row.className='object'+(o.id===selected?' selected':'')+(o.hidden?' hidden':'');row.dataset.id=o.id;row.dataset.locked=o.locked?'true':'false';row.setAttribute('role','listitem');row.setAttribute('aria-posinset',String(i+1));row.setAttribute('aria-setsize',String(count));
  const glyph=document.createElement('span');glyph.className='glyph';glyph.textContent={point:'•',midpoint:'◉',segment:'╱',arrow:'➜',line:'⟷',circle:'◯',polygon:'⬡',regularPolygon:'⬟',rectangle:'□',polyline:'⌁',freehand:'∿',text:'T',function:'ƒ',ellipse:'⬭',bezier:'∽',angle:'∠',node:'▣',morphism:'↦'}[o.type]||'◇';row.append(glyph);
  const label=document.createElement('span');label.className='object-label';const strong=document.createElement('strong');strong.textContent=o.name;const small=document.createElement('small');small.textContent=desc(o);label.append(strong,small);row.append(label);
  const more=document.createElement('button');more.type='button';more.className='object-menu-toggle';more.textContent='⋯';more.title=translated('Object actions',uiPrefs.language);more.setAttribute('aria-label',`${translated('Object actions',uiPrefs.language)}: ${o.name}`);more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-controls','object-action-menu');more.setAttribute('aria-expanded','false');
  more.onclick=e=>{e.stopPropagation();openObjectMenu(o,more);};
  more.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();openObjectMenu(o,more);}};
  row.append(more);
  row.onclick=()=>{if(currentObject(o))select(o.id);};
  row.onkeydown=e=>{
   if(e.target!==row||!currentObject(o))return;
   if(e.key==='Enter'||e.key===' '){e.preventDefault();select(o.id);focusListIndex(i);}
   else if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?count-1:Math.min(count-1,Math.max(0,i+(e.key==='ArrowDown'?1:-1)));
    select(listedObjects[next].id);focusListIndex(next);
   }
  };fragment.append(row);
 }
 if(last<count)fragment.append(spacer((count-last)*LIST_ROW_HEIGHT));
 if(!count){const empty=document.createElement('p');empty.className='subtle empty-objects';empty.textContent=doc.objects.length?'No matching objects.':'No objects yet. Use commands or tools to draw.';fragment.append(empty);}
 wrapper.replaceChildren(fragment);
}

function focusListIndex(index){
 const wrapper=$('objects'),o=listedObjects[index];if(!o)return;
 const top=index*LIST_ROW_HEIGHT,bottom=top+LIST_ROW_HEIGHT;
 if(top<wrapper.scrollTop)wrapper.scrollTop=top;
 else if(bottom>wrapper.scrollTop+wrapper.clientHeight)wrapper.scrollTop=Math.max(0,bottom-wrapper.clientHeight);
 renderListWindow();
 const target=[...wrapper.querySelectorAll('.object')].find(row=>row.dataset.id===o.id);
 target?.focus();
}
function field(parent,label,value,type,onChange,opts={}){const wrap=document.createElement('label');wrap.className='field'+(type==='multiline'?' multiline-field':'');wrap.textContent=label;const input=document.createElement(type==='multiline'?'textarea':'input');if(type!=='multiline')input.type=type;else{input.rows=3;input.spellcheck=false;input.setAttribute('aria-label',label);}input.value=String(value??'');if(opts.step)input.step=opts.step;if(opts.min!==undefined)input.min=opts.min;if(opts.max!==undefined)input.max=opts.max;let accepted=input.value;input.onchange=()=>{if(type==='number'&&!input.value.trim()){notice('Numeric value is required.');input.value=accepted;return;}const next=input.value;if(onChange(type==='number'?Number(next):next)===false)input.value=accepted;else accepted=next;};wrap.append(input);parent.append(wrap);return input;}
function renderProperties(){
 const root=$('properties');root.replaceChildren();const o=get(doc,selected);
 if(!o){const p=document.createElement('p');p.className='subtle';p.textContent='Select an object to edit its style, labels, coordinates or dependencies.';root.append(p);return;}
 if(o.locked){const p=document.createElement('p');p.className='hint';p.textContent='Locked: unlock with the lock icon in the object list before editing.';root.append(p);return;}
 // IMPORTANT: never mutate a captured object. Failed validation, undo and imports
 // replace the document and make the old object reference stale. Resolve by ID in
 // every transaction, preventing false-success edits that silently do nothing.
 const editorGeneration=documentGeneration;
 const edit=fn=>update(()=>{const live=get(doc,o.id);
  if(editorGeneration!==documentGeneration||!live||live.type!==o.type||live.locked||selected!==o.id)throw Error('Object changed while editing. Please reselect it.');
  fn(live);
 });
 field(root,'Name',o.name,'text',v=>edit(live=>{const name=v.trim();if(!name||doc.objects.some(a=>a.id!==live.id&&a.name===name))throw Error('Object names must be unique and nonempty.');live.name=name;}));
 if(['point','midpoint'].includes(o.type)){
  const mode=document.createElement('label');mode.className='field';mode.textContent='Point label format';const modeSelect=document.createElement('select');
  for(const [value,label] of [['plain','Plain text'],['latex','LaTeX math']]){const option=document.createElement('option');option.value=value;option.textContent=label;modeSelect.append(option);}
  modeSelect.value=o.pointLabelMode||'plain';modeSelect.onchange=()=>edit(live=>{if(modeSelect.value==='latex')validateLatexInput(live.pointLabel||live.name);live.pointLabelMode=modeSelect.value;});mode.append(modeSelect);root.append(mode);
  field(root,'Displayed label',o.pointLabel||'','text',v=>edit(live=>{if(live.pointLabelMode==='latex')validateLatexInput(v||live.name);live.pointLabel=v;}));
 }
 if(['point','node','text'].includes(o.type)){
  const coords=document.createElement('div');coords.className='twocol';for(let i=0;i<2;i++){
   const l=document.createElement('label');l.textContent=i?'y':'x';const input=document.createElement('input');input.type='number';input.step='any';input.value=String(o.xy[i]);
   input.onchange=()=>{const ok=edit(live=>{if(!input.value.trim())throw Error('Coordinate is required.');const v=Number(input.value);if(!finite(v))throw Error('Invalid coordinate.');const before=clone(doc);live.xy[i]=v;guardAnchorMove(before,doc,live.id);});if(!ok)input.value=String(get(doc,o.id)?.xy?.[i]??o.xy[i]);};l.append(input);coords.append(l);
  }root.append(coords);
 }
 if(['text','node','morphism'].includes(o.type)){
  const mode=document.createElement('label');mode.className='field';mode.textContent='Label format';const modeSelect=document.createElement('select');
  for(const [value,label] of [['plain','Plain text'],['latex','LaTeX math']]){const option=document.createElement('option');option.value=value;option.textContent=label;modeSelect.append(option);}
  modeSelect.value=o.textMode||'plain';modeSelect.onchange=()=>edit(live=>{if(modeSelect.value==='latex')validateLatexInput(live.text);live.textMode=modeSelect.value;});mode.append(modeSelect);root.append(mode);
  field(root,o.type==='morphism'?'Arrow label':'Text / label',o.text,'multiline',v=>edit(live=>{if(live.textMode==='latex')validateLatexInput(v);live.text=v;}));const tip=document.createElement('p');tip.className='hint';tip.textContent='Enter inserts a line break. Click outside to apply; SVG preserves spaces and line breaks where supported.';tip.title=tip.textContent;tip.textContent='';tip.className='mini-help';tip.textContent='?';root.append(tip);}
 if(['text','node','morphism'].includes(o.type)&&o.textMode!=='latex'){
  const family=document.createElement('label');family.className='field';family.textContent='Font';const pick=document.createElement('select');
  for(const [value,label] of [['Georgia, serif','Serif'],['Arial, sans-serif','Sans-serif'],['Consolas, monospace','Monospace']]){const option=document.createElement('option');option.value=value;option.textContent=label;pick.append(option);}
  pick.value=o.fontFamily||(['text'].includes(o.type)?'Arial, sans-serif':'Georgia, serif');pick.onchange=()=>edit(live=>live.fontFamily=pick.value);family.append(pick);root.append(family);
 }
 if(['text','node'].includes(o.type))field(root,'Font size',o.fontSize||18,'number',v=>edit(live=>{if(!finite(v)||v<5||v>200)throw Error('Font size must be 5–200.');live.fontSize=v;}),{min:5,max:200,step:1});
 if(o.type==='node'){const border=document.createElement('label');border.className='check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!o.nodeBorder;cb.onchange=()=>edit(live=>live.nodeBorder=cb.checked);border.append(cb,document.createTextNode(' Node border'));root.append(border);}
 if(o.type==='morphism'){
  const arrowLabel=document.createElement('label');arrowLabel.className='field';arrowLabel.textContent='Arrow style';const arrowChoice=document.createElement('select');for(const [value,label] of [['solid','→ Solid'],['dashed','Dashed'],['dotted','Dotted'],['hook','Hooked'],['hook-dashed','Hooked dashed'],['twohead','Two heads'],['tail','Tail bar']]){const option=document.createElement('option');option.value=value;option.textContent=label;arrowChoice.append(option);}arrowChoice.value=o.arrowStyle||'solid';arrowChoice.onchange=()=>edit(live=>live.arrowStyle=arrowChoice.value);arrowLabel.append(arrowChoice);root.append(arrowLabel);
  const warning=document.createElement('p');warning.className='hint';warning.textContent='When node boxes overlap, the arrow may be suppressed. With Move selected, click the arrow label in the canvas to select it, then drag its purple handle to reposition the label. The shift is undoable.';warning.title=warning.textContent;warning.textContent='?';warning.className='mini-help';root.append(warning);
  field(root,'Curve / bend',o.bend||0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>5)throw Error('Bend range: −5 to 5.');live.bend=v;}),{min:-5,max:5,step:.1});
  const routeRow=document.createElement('label');routeRow.className='field routing-field';routeRow.textContent='Arrow routing';
  const routeSelect=document.createElement('select');routeSelect.id='morphism-routing';
  for(const [value,text] of [['direct','Direct / curved (legacy)'],['avoid','Avoid diagram nodes (two-turn)'],['avoid-crossings','Reduce earlier crossings'],['scene-crossings','Consider all visible arrows (max 48)']]){
   const option=document.createElement('option');option.value=value;option.textContent=text;routeSelect.append(option);
  }
  routeSelect.value=o.routing||'direct';routeSelect.onchange=()=>edit(live=>{live.routing=routeSelect.value;});
  routeRow.append(routeSelect);root.append(routeRow);
  const routeHint=document.createElement('p');routeHint.className='hint';routeHint.textContent='Avoid routes around visible diagram nodes. Reduce earlier crossings uses document order. Consider all arrows also revisits later visible edges (48-arrow cap, two bounded passes). All options are best-effort screen-space attempts; bend is ignored. Unsolved crossings or safety limits show dashed amber. No globally optimal or crossing-free guarantee.';routeHint.title=routeHint.textContent;routeHint.textContent='?';routeHint.className='mini-help';root.append(routeHint);
  const collisionRow=document.createElement('label');collisionRow.className='check';
  const collisionCheck=document.createElement('input');collisionCheck.type='checkbox';collisionCheck.id='morphism-label-avoid';
  collisionCheck.checked=!!o.labelAvoid;collisionCheck.onchange=()=>edit(live=>{live.labelAvoid=collisionCheck.checked;});
  collisionRow.append(collisionCheck,document.createTextNode(' Avoid collisions'));root.append(collisionRow);
  const collisionHint=document.createElement('p');collisionHint.className='hint';
  collisionHint.textContent='Optional screen-space placement: keeps the exact label and arrow references; may not resolve every collision. Dragging the label switches that arrow to manual positioning. Auto placement is not represented by TikZ.';collisionHint.title=collisionHint.textContent;collisionHint.textContent='?';collisionHint.className='mini-help';root.append(collisionHint);
  field(root,'Label position on arrow (0.05–0.95)',o.labelT??.5,'number',v=>edit(live=>{if(!finite(v)||v<.05||v>.95)throw Error('Label position must be 0.05–0.95.');live.labelT=v;}),{min:.05,max:.95,step:.05});
  field(root,'Label distance (px)',o.labelDistance??17,'number',v=>edit(live=>{if(!finite(v)||v<0||v>200)throw Error('Label distance must be 0–200 px.');live.labelDistance=v;}),{min:0,max:200,step:1});
  field(root,'Label shift X (px)',o.labelDx??0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>300)throw Error('Label shift must be between −300 and 300 px.');live.labelDx=v;}),{min:-300,max:300,step:1});
  field(root,'Label shift Y (px)',o.labelDy??0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>300)throw Error('Label shift must be between −300 and 300 px.');live.labelDy=v;}),{min:-300,max:300,step:1});
  const side=document.createElement('label');side.className='check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!o.swap;cb.onchange=()=>edit(live=>live.swap=cb.checked);side.append(cb,document.createTextNode(' Swap label side'));root.append(side);
 }
 if(o.type==='function'){const warn=document.createElement('span');warn.className='mini-help';warn.textContent='?';warn.title='Sampling may miss thin spikes, poles, or rapid oscillations. Adjust plot detail in the tools panel.';root.append(warn);}
 if(o.type==='function')field(root,'y(x) =',o.expr,'text',v=>edit(live=>{parseExpression(v);live.expr=v;}));
 if(o.type==='regularPolygon')field(root,'Number of sides',o.sides,'number',v=>edit(live=>{if(!Number.isInteger(v)||v<3||v>100)throw Error('Regular polygon sides must be 3–100.');live.sides=v;}),{step:1,min:3,max:100});
 if(o.refs){const hint=document.createElement('span');hint.className='mini-help';hint.textContent='?';hint.title='Live references: '+o.refs.map(id=>get(doc,id)?.name||'?').join(' → ')+'. Select anchors in the object list to move them.';root.append(hint);}
 if(o.type==='freehand'){const hint=document.createElement('p');hint.className='hint';hint.textContent=`${o.path.length} path vertices. Individual vertices are not yet editable.`;hint.title=hint.textContent;hint.textContent='?';hint.className='mini-help';root.append(hint);}
 // Compact appearance controls reuse the existing transaction handlers. Keep
 // fill absent for ineligible types and preserve the existing field order.
 const styleGrid=document.createElement('div');styleGrid.className='style-controls-grid';
 styleGrid.setAttribute('role','group');styleGrid.setAttribute('aria-label','Object appearance');
 function styleSlot(name){const slot=document.createElement('div');slot.className='style-slot style-'+name;styleGrid.append(slot);return slot;}
 const strokeSlot=styleSlot('stroke');
 field(strokeSlot,'Stroke',o.style.stroke,'color',v=>edit(live=>live.style.stroke=v));
 appendColorSwatches(strokeSlot,{scope:'object',property:'stroke',apply:v=>edit(live=>{live.style.stroke=v;})});
 if(['polygon','regularPolygon','ellipse','rectangle','node'].includes(o.type)){
  const fillSlot=styleSlot('fill');
  field(fillSlot,'Fill',o.style.fill,'color',v=>edit(live=>live.style.fill=v));
  appendColorSwatches(fillSlot,{scope:'object',property:'fill',apply:v=>edit(live=>{live.style.fill=v;})});
 }
 field(styleSlot('width'),'Line width',o.style.width,'number',v=>edit(live=>{if(!finite(v)||v<.1||v>100)throw Error('Width must be 0.1–100.');live.style.width=v;}),{step:.5,min:.1,max:100});
 field(styleSlot('opacity'),'Opacity',o.style.opacity,'number',v=>edit(live=>{if(!finite(v)||v<0||v>1)throw Error('Opacity must be in [0,1].');live.style.opacity=v;}),{step:.1,min:0,max:1});
 if(['point','midpoint'].includes(o.type))field(styleSlot('pointsize'),'Point radius',o.style.pointSize??doc.settings.pointSize,'number',v=>edit(live=>{if(!finite(v)||v<1||v>100)throw Error('Point radius must be 1–100.');live.style.pointSize=v;}),{step:1,min:1,max:100});
 root.append(styleGrid);
 const actions=document.createElement('div');actions.className='props-actions';
 const del=document.createElement('button');del.textContent='Delete + dependents';del.onclick=()=>{if(currentObject(o)&&selected===o.id)deleteSelected();};
 const up=document.createElement('button');up.textContent='Bring forward';up.onclick=()=>edit(live=>{const n=doc.objects.indexOf(live);if(n>=0&&n<doc.objects.length-1)doc.objects.splice(n,2,doc.objects[n+1],live);});
 const down=document.createElement('button');down.textContent='Send backward';down.onclick=()=>edit(live=>{const n=doc.objects.indexOf(live);if(n>0)doc.objects.splice(n-1,2,live,doc.objects[n-1]);});
 const focus=document.createElement('button');focus.textContent='Center view';focus.onclick=()=>{const live=get(doc,o.id);if(live!==o)return;const p=['point','midpoint','node'].includes(live.type)?position(doc,live.id):live.xy||position(doc,live.refs?.[0]);if(p){view.cx=p[0];view.cy=p[1];scheduleRender();}};
 actions.append(del,up,down,focus);root.append(actions);
}
function renderAll(){renderList();renderProperties();render();syncSettings();localizeUI(document.documentElement,uiPrefs.language);}
function select(id){selected=id;renderList();renderProperties();localizeUI($('properties'),uiPrefs.language);scheduleRender();}
function clearDraft(){draftStart=null;draftPoints=[];draftNode=null;hover=null;pendingTouchTap=null;}
const toolInstructions={select:'Drag objects to edit; Ctrl-click cycles overlapping objects.',pan:'Drag the canvas.',polygon:'Click vertices; Enter finishes.',polyline:'Click vertices; Enter finishes.',bezier:'Click four control points.',angle:'Click three points (vertex second).',freehand:'Drag to draw a free curve.',morphism:'Click source and target nodes.',regularPolygon:'Click center, then a vertex.',node:'Click the canvas to add a node.',ellipse:'Click opposite corners.',rectangle:'Click opposite corners.'};
function updateModeLabel(t){
 const label=toolGroups['basic-tools'].concat(toolGroups['construction-tools'],toolGroups['illustration-tools'],toolGroups['diagram-tools']).find(([id])=>id===t)?.[1]||t;
 const localized=translated(label,uiPrefs.language),help=toolInstructions[t]||'Click the canvas.';
 const mode=$('mode-label');mode.textContent=localized+'  ?';mode.title=help;mode.tabIndex=0;
 mode.setAttribute('aria-label',localized+': '+help);
 $('drawing').setAttribute('aria-label','Interactive mathematical drawing canvas · '+localized+': '+help);
}
function selectTool(t){
 if(!TOOLS.includes(t))return;
 if(drag)cancelDrag();tool=t;clearDraft();$('drawing').dataset.tool=t;
 document.querySelectorAll('[data-tool-choice]').forEach(b=>{const active=b.dataset.toolChoice===t;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false');});
 updateModeLabel(t);scheduleRender();
}
function populateTools(){
 const geometryTargets=new Map(),root=$('construction-tools');
 // Stable nested IDs permit preferences to survive a translated UI.
 for(const group of geometryCategories){
  const section=document.createElement('section');section.className='geometry-subgroup';
  section.dataset.geometryGroup=group.id;section.dataset.sectionId='geometry-'+group.id;
  const heading=document.createElement('h4');heading.textContent=group.title;heading.dataset.sectionTitle=group.title;
  const grid=document.createElement('div');grid.className='toolgrid';
  section.append(heading,grid);root.append(section);
  for(const id of group.tools)geometryTargets.set(id,grid);
 }
 for(const [id,group]of Object.entries(toolGroups))for(const [type,label]of group){
  const parent=id==='construction-tools'?geometryTargets.get(type):$(id);
  if(!parent)throw new Error('Missing Geometry category for '+type);
  const button=document.createElement('button');button.className='tool';button.dataset.toolChoice=type;
  button.title=label;button.setAttribute('aria-label',label);
  button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${glyph[type]}</svg><span>${label}</span>`;
  button.onclick=()=>selectTool(type);parent.append(button);
 }
 selectTool('select');
}
function syncSettings(){
 for(const [id,k]of [['naming-convention','namingConvention'],['freehand-close','freehandClose'],['correction','correction'],['plot-quality','plotQuality'],['polygon-sides','polygonSides'],['snap-step','snapStep'],['snap','snap'],['snap-anchors','snapAnchors'],['grid','grid'],['axes','showAxes'],['labels','showLabels'],['label-placement','labelPlacement'],['default-stroke','stroke'],['default-fill','fill'],['default-width','width'],['point-size','pointSize'],['default-opacity','opacity'],['page','page'],['export-region','exportRegion'],['export-guides','exportGuides'],['export-scale','exportScale'],['export-transparent','exportTransparent'],['background','background']]){
  const input=$(id);if(!input)continue;if(input.type==='checkbox')input.checked=!!doc.settings[k];else input.value=doc.settings[k];
 }
 $('export-region').querySelector('option[value="page"]').disabled=doc.settings.page==='infinite';
 // Legacy `settings.modules` is preserved in v1 project files, but no longer
 // hides a tool: section disclosure is independent, local interface state.
 // A drawing preset owns the common construction defaults too. Without these
 // checks the UI says "General" after the user has customized anchor snapping,
 // polygon sides or point-label visibility. Page/export/theme are independent.
 const matching=Object.entries(PRESETS).find(([name,preset])=>Object.entries(preset).every(([k,v])=>doc.settings[k]===v)
  &&Object.entries(PRESET_MODULES[name]).every(([k,v])=>doc.settings.modules[k]===v)
  &&doc.settings.snapAnchors===true&&doc.settings.polygonSides===6&&doc.settings.showLabels===true&&doc.settings.labelPlacement==='standard');
 syncColorSwatches();
 $('preset').value=matching?.[0]||'Custom';
}
function setupSettings(){
 for(const property of ['stroke','fill']){
  const picker=$(property==='stroke'?'default-stroke':'default-fill');
  const target=$('default-color-swatches-'+property);
  appendColorSwatches(target,{scope:'default',property,apply:hex=>update(()=>{doc.settings[property]=hex;})});
 }

 const preset=$('preset');for(const name of [...Object.keys(PRESETS),'Custom']){const option=document.createElement('option');option.value=name;option.textContent=name;if(name==='Custom')option.disabled=true;preset.append(option);}
 preset.value='General';preset.onchange=()=>{if(preset.value!=='Custom')update(()=>{if(doc.settings.pointSize!==PRESETS[preset.value].pointSize)preserveInheritedPointSizes(doc);Object.assign(doc.settings,clone(PRESETS[preset.value]));doc.settings.modules={...PRESET_MODULES[preset.value]};doc.settings.snapAnchors=true;doc.settings.polygonSides=6;doc.settings.showLabels=true;doc.settings.labelPlacement='standard';});};
 for(const [id,k]of [['naming-convention','namingConvention'],['freehand-close','freehandClose'],['correction','correction'],['plot-quality','plotQuality'],['polygon-sides','polygonSides'],['snap-step','snapStep'],['snap','snap'],['snap-anchors','snapAnchors'],['grid','grid'],['axes','showAxes'],['labels','showLabels'],['label-placement','labelPlacement'],['default-stroke','stroke'],['default-fill','fill'],['default-width','width'],['point-size','pointSize'],['default-opacity','opacity'],['page','page'],['export-region','exportRegion'],['export-guides','exportGuides'],['export-scale','exportScale'],['export-transparent','exportTransparent'],['background','background']]){
  $(id).onchange=()=>update(()=>{
   const input=$(id);if(input.type==='number'&&!input.value.trim())throw Error('Value is required.');
   const value=input.type==='checkbox'?input.checked:(input.type==='number'||k==='exportScale')?Number(input.value):input.value;
   if(input.type==='number'&&!finite(value))throw Error('Value must be finite.');
   if(k==='pointSize'&&value!==doc.settings.pointSize)preserveInheritedPointSizes(doc);
   doc.settings[k]=value;
   if(k==='page'&&value==='infinite')doc.settings.exportRegion='viewport';
  },['exportRegion','exportGuides','exportScale','exportTransparent'].includes(k)?{refreshList:false,renderCanvas:false}:{});
 }
 const theme=$('theme');try{theme.value=JSON.parse(localStorage.getItem(SETTINGS)||'{}').theme||'light';}catch{theme.value='light';}
 document.documentElement.dataset.theme=theme.value;theme.onchange=()=>{document.documentElement.dataset.theme=theme.value;safeStorageSet(SETTINGS,JSON.stringify({theme:theme.value}));};
}
// Build a spatial index only once per settled document and viewport. During
// pointer drag, source anchors may be temporarily mutable, but the index is not
// used until the gesture commits/cancels and its revision/generation changes.
let anchorCache=null,anchorCacheKey='';
function currentAnchorIndex(){
 const key=JSON.stringify([documentRevision,documentGeneration,doc.objects.length,view.cx,view.cy,view.scale,size.w,size.h]);
 if(!anchorCache||anchorCacheKey!==key){anchorCache=createAnchorIndex(doc,createResolver(doc),view,size);anchorCacheKey=key;}
 return anchorCache;
}
function hitTestPoint(sx,sy){return currentAnchorIndex().hit(sx,sy)?.id||null;}
/** Ctrl-click cycles all visible hit candidates. The geometric point index
 * supplies anchors even when a later filled polygon covers their SVG circles;
 * elementsFromPoint supplies overlapping non-point SVG hit targets.
 * No scene scan is performed per click.
 */
function stackedSelection(e,sx,sy){
 const indexHits=currentAnchorIndex().hits(sx,sy),svg=$('drawing');
 const domHits=document.elementsFromPoint(e.clientX,e.clientY).map(node=>{
  const element=node.closest?.('[data-id]');return element&&svg.contains(element)?element.dataset.id:null;
 }).filter(Boolean);
 const candidates=[...new Set([...indexHits,...domHits])].filter(id=>{
  const object=get(doc,id);return object&&!object.hidden&&object.style?.opacity!==0;
 });
 return cycleSelection(candidates,selected);
}
function nearestAnchor(pt){
 if(!doc.settings.snapAnchors)return null;
 const [sx,sy]=project(pt);return currentAnchorIndex().nearest(sx,sy,12);
}
/** Resolve all existing anchors *before* adding any new vertex in one gesture.
 * Otherwise the first newly inserted anchor can capture the second vertex,
 * collapsing a valid short segment/circle into a self-reference. */
function makeRefs(pts){
 // One resolver and a snapshot of candidates; never allow newly added points
 // inside this gesture to influence any other vertex's snap decision.
 // Screen-space lookup uses the *settled* pre-gesture anchor index: none
 // of the points inserted below can accidentally capture a later vertex.
 // A strict 12px threshold retains legacy edge-of-snap behavior.
 const anchors=doc.settings.snapAnchors?currentAnchorIndex():null;
 const existing=pts.map(pt=>{
  if(!anchors)return null;
  const [sx,sy]=project(pt),near=anchors.nearest(sx,sy,12);
  return near&&Math.hypot(sx-near.x,sy-near.y)<12?near.id:null;
 });
 return pts.map((pt,i)=>existing[i]||addPoint(doc,pt).id);
}
function checkNewRefs(type,refs){
 // Reject new collapsed edges while leaving imported legacy v1 projects intact.
 const resolver=createResolver(doc),p=refs.map(id=>resolver.at(id));checkNewGeometry(type,p);
 if(['polygon','polyline'].includes(type)){
  const pairs=type==='polygon'?[...refs,refs[0]]:refs;
  for(let i=1;i<pairs.length;i++)if(pairs[i]===pairs[i-1])throw Error('Construction has a repeated consecutive vertex.');
 }
}
function addTwoPoint(type,a,b){update(()=>{checkNewGeometry(type,[a,b]);const refs=makeRefs([a,b]);checkNewRefs(type,refs);selected=append(doc,{type,refs}).id;});}
function finishDraft(){
 const mins={polygon:3,polyline:2,bezier:4,angle:3};if(!mins[tool]||draftPoints.length<mins[tool]){notice('Add more vertices before finishing.');return;}
 const pts=clone(draftPoints),type=tool;
 try{checkNewGeometry(type,pts);}catch(e){notice(e.message);return;}
 const ok=update(()=>{const refs=makeRefs(pts);checkNewRefs(type,refs);selected=append(doc,{type,refs}).id;});
 if(ok){draftPoints=[];scheduleRender();}
}
function correctedPath(path){return smoothPath(path,doc.settings.correction,view.scale);}
function constructionPoint(world){const anchor=nearestAnchor(world);return anchor?anchor.world:snapPoint(world,doc.settings);}
function pointerDown(e){
 if(!$('tikzcd-dialog').hidden||!$('export-menu').hidden)return;
 // Touch drawing must wait for release; otherwise the first finger of a pinch
 // silently inserts a point/vertex before the second pointer arrives.
 if(e.pointerType==='touch'){
  touchContacts.add(e.pointerId);
  if(touchContacts.size>1||!e.isPrimary){
   touchBlocked=true;pendingTouchTap=null;
   if(drag)cancelDrag();
   if(draftStart||draftPoints.length||draftNode){clearDraft();scheduleRender();}
   return;
  }
  if(touchBlocked)return;
 }
 if(e.button!==0||!e.isPrimary||drag)return;const [sx,sy]=xyEvent(e),world=unproject(sx,sy),pt=['select','pan'].includes(tool)?world:constructionPoint(world);
 $('drawing').focus();hover=pt;
 if(e.pointerType==='touch'&&!['select','pan','freehand'].includes(tool)){
  pendingTouchTap={pointerId:e.pointerId,sx,sy,moved:false};
  try{$('drawing').setPointerCapture(e.pointerId);}catch{}
  return;
 }
 if(tool==='select'){
  // A selected morphism's label handle has priority over point and path hits.
  // This must be checked before the generic overlapping-object selection logic.
  const labelId=e.target.closest('[data-label-handle]')?.getAttribute('data-label-handle');
  const labelObject=labelId&&get(doc,labelId);
  if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&labelObject?.type==='morphism'&&selected===labelId&&!labelObject.locked&&labelObject.text){
   const automatic=labelObject.labelAvoid?currentMorphismLabels.get(labelId):null;
   drag={kind:'label',pointerId:e.pointerId,id:labelId,before:JSON.stringify(doc),
    sx,sy,offsetX:(labelObject.labelDx??0)+(automatic?.dx??0),
    offsetY:(labelObject.labelDy??0)+(automatic?.dy??0),wasAuto:!!labelObject.labelAvoid};
   try{$('drawing').setPointerCapture(e.pointerId);}catch{}
   return;
  }
  const id=hitTestPoint(sx,sy)||e.target.closest('[data-id]')?.dataset.id||null;
  if(e.shiftKey||e.altKey){drag={kind:'pan',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy};}
  else if(e.ctrlKey||e.metaKey){select(stackedSelection(e,sx,sy));}
  else{select(id);const o=get(doc,id);if(o&&!o.hidden&&!o.locked&&['point','node','text'].includes(o.type))drag={kind:'point',pointerId:e.pointerId,id,before:JSON.stringify(doc),sx,sy,moved:false};}
 }else if(tool==='pan'){drag={kind:'pan',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy};}
 else if(tool==='freehand'){drag={kind:'freehand',pointerId:e.pointerId,path:[world]};}
 else performConstructionTap(e,pt);
 if(drag)try{$('drawing').setPointerCapture(e.pointerId);}catch{}
}
function performConstructionTap(e,pt){
 if(tool==='point'){const ok=update(()=>selected=addPoint(doc,pt).id);if(ok&&uiPrefs.autoMove)selectTool('select');}
 else if(['segment','arrow','line','circle','ellipse','rectangle','regularPolygon'].includes(tool)){
  if(!draftStart){draftStart=pt;scheduleRender();}else{const a=draftStart;draftStart=null;if(tool==='regularPolygon')update(()=>{if(Math.hypot(a[0]-pt[0],a[1]-pt[1])<1e-9)throw Error('Choose a different vertex from the center.');const refs=makeRefs([a,pt]);checkNewRefs('regularPolygon',refs);selected=append(doc,{type:'regularPolygon',refs,sides:doc.settings.polygonSides}).id;});else addTwoPoint(tool,a,pt);}
 }else if(['polygon','polyline','bezier','angle'].includes(tool)){
  if(draftPoints.length===0||Math.hypot(pt[0]-draftPoints.at(-1)[0],pt[1]-draftPoints.at(-1)[1])>1e-8)draftPoints.push(pt);
  if((tool==='bezier'&&draftPoints.length===4)||(tool==='angle'&&draftPoints.length===3))finishDraft();else scheduleRender();
 }else if(tool==='freehand'){drag={kind:'freehand',pointerId:e.pointerId,path:[world]};}
 else if(tool==='text'||tool==='node'){
  const label=window.prompt(tool==='node'?'Diagram node label (TeX source or text):':'Text label (plain text):');
  if(label!==null&&label.trim()){const limit=tool==='node'?1000:2000;if(label.length>limit)notice(`Label exceeds ${limit} characters. Nothing was added.`);else update(()=>{if(tool==='node')validateLatexInput(label);selected=append(doc,{type:tool,xy:pt,text:label,textMode:tool==='node'?'latex':'plain',fontSize:tool==='node'?17:18}).id;});}
 }else if(tool==='morphism'){
  const id=e.target.closest('[data-id]')?.dataset.id,node=get(doc,id);
  if(node?.type!=='node'){notice('Choose a diagram node.');return;}
  if(!draftNode){draftNode=id;draftStart=node.xy;scheduleRender();}
  else{const start=draftNode;draftNode=null;draftStart=null;if(start!==id){const label=window.prompt('Arrow label (TeX source or text):','');if(label!==null){if(label.length>1000)notice('Morphism label exceeds 1000 characters. Nothing was added.');else update(()=>{if(label.trim())validateLatexInput(label);selected=append(doc,{type:'morphism',refs:[start,id],text:label,textMode:label.trim()?'latex':'plain',bend:0,swap:false}).id;});}}}
 }
}
function pointerMove(e){
 if(e.pointerType==='touch') {
  if(touchBlocked)return;
  if(pendingTouchTap?.pointerId===e.pointerId){
   const [tx,ty]=xyEvent(e);if(Math.hypot(tx-pendingTouchTap.sx,ty-pendingTouchTap.sy)>10)pendingTouchTap.moved=true;
   return;
  }
 }
 // Secondary touch/stylus devices must not replace the active pointer's hover
 // coordinates or alter construction previews while another pointer is captured.
 if(e.isPrimary===false||(drag&&drag.pointerId!==e.pointerId))return;
 const [sx,sy]=xyEvent(e),world=unproject(sx,sy);
 hover=(drag||tool==='select'||tool==='pan')?world:constructionPoint(world);$('coords').textContent=`x ${formatCoordinate(world[0])} · y ${formatCoordinate(world[1])}`;
 if(drag?.kind==='pan'){view.cx=drag.cx-(sx-drag.sx)/view.scale;view.cy=drag.cy+(sy-drag.sy)/view.scale;}
 else if(drag?.kind==='point'){
  if(Math.hypot(sx-drag.sx,sy-drag.sy)>3)drag.moved=true;
  if(drag.moved){const o=get(doc,drag.id);if(o)o.xy=snapPoint(world,doc.settings);}
 }
 else if(drag?.kind==='label'){
  const offset=labelDragOffset(drag.offsetX,drag.offsetY,[drag.sx,drag.sy],[sx,sy]);
  const o=get(doc,drag.id);
  if(offset&&o?.type==='morphism'&&Math.hypot(sx-drag.sx,sy-drag.sy)>=2){
   [o.labelDx,o.labelDy]=offset;if(drag.wasAuto)o.labelAvoid=false;
  }
 }
 else if(drag?.kind==='freehand'){
  const last=drag.path.at(-1);
  if(drag.path.length<9900&&Math.hypot(world[0]-last[0],world[1]-last[1])>0.8/view.scale)drag.path.push(world);
 }
 if(drag||draftStart||draftPoints.length)scheduleRender();
}
function cancelDrag(){
 const abandoned=drag;
 if(['point','label'].includes(abandoned?.kind)){doc=JSON.parse(abandoned.before);documentGeneration++;}
 if(abandoned?.kind==='pan'){view.cx=abandoned.cx;view.cy=abandoned.cy;}
 drag=null;
 if(abandoned){try{if($('drawing').hasPointerCapture(abandoned.pointerId))$('drawing').releasePointerCapture(abandoned.pointerId);}catch{}}
 renderAll();
}
function pointerUp(e){
 if(e?.pointerType==='touch'){
  const tap=pendingTouchTap?.pointerId===e.pointerId?pendingTouchTap:null;
  if(tap)pendingTouchTap=null;
  touchContacts.delete(e.pointerId);
  const blocked=touchBlocked;
  if(!touchContacts.size)touchBlocked=false;
  if(tap){
   try{if($('drawing').hasPointerCapture(e.pointerId))$('drawing').releasePointerCapture(e.pointerId);}catch{}
   if(e.type==='pointerup'&&!blocked&&!tap.moved){
    const [x,y]=xyEvent(e),world=unproject(x,y);
    if(x>=0&&x<=size.w&&y>=0&&y<=size.h&&Math.hypot(x-tap.sx,y-tap.sy)<=10&&world.every(finite)){hover=world;performConstructionTap(e,constructionPoint(world));scheduleRender();}
   }
   return;
  }
  if(blocked)return;
 }
 if(!drag||e?.pointerId!==undefined&&e.pointerId!==drag.pointerId)return;
 if(e?.type==='pointercancel'||e?.type==='lostpointercapture'){cancelDrag();return;}
 const completed=drag;drag=null;
 // Browser pointerup is authoritative: the last position is not guaranteed to
 // have been preceded by a pointermove (pen hardware, coalesced pointer events).
 const [endX,endY]=xyEvent(e),released=unproject(endX,endY);
 if(completed.kind==='pan'&&released.every(finite)){
  // The final pointer-up position may not have had a preceding pointermove.
  view.cx=completed.cx-(endX-completed.sx)/view.scale;
  view.cy=completed.cy+(endY-completed.sy)/view.scale;
 }
 if(completed.kind==='label'){
  const before=completed.before,o=get(doc,completed.id);
  const offset=labelDragOffset(completed.offsetX,completed.offsetY,[completed.sx,completed.sy],[endX,endY]);
  if(o?.type==='morphism'&&offset&&Math.hypot(endX-completed.sx,endY-completed.sy)>=2){
   [o.labelDx,o.labelDy]=offset;if(completed.wasAuto)o.labelAvoid=false;
  }
  try{validateDoc(doc);}catch(err){doc=JSON.parse(before);documentGeneration++;notice('Label move rejected: '+err.message);renderAll();return;}
  if(JSON.stringify(doc)!==before){recordUndo(before);documentRevision++;enqueueSave();}
  renderList();renderProperties();
 }
 if(completed.kind==='point'){
  const moved=get(doc,completed.id);
  if(moved&&released.every(finite)&&(completed.moved||Math.hypot(endX-completed.sx,endY-completed.sy)>3))moved.xy=snapPoint(released,doc.settings);
  const before=completed.before;
  try{validateDoc(doc);guardAnchorMove(JSON.parse(before),doc,completed.id);}catch(err){doc=JSON.parse(before);documentGeneration++;notice('Move rejected: '+err.message);renderAll();return;}
  if(JSON.stringify(doc)!==before){recordUndo(before);documentRevision++;enqueueSave();}
  renderList();renderProperties();
 }
 if(completed.kind==='freehand'){
  if(released.every(finite)){
   const last=completed.path.at(-1);
   if(Math.hypot(last[0]-released[0],last[1]-released[1])>1e-10)completed.path.push(released);
  }
  const prepared=closeFreehandStroke(correctedPath(completed.path),doc.settings.freehandClose,view.scale);
  const {path,closed,joinStyle}=prepared;
  if(path.length>=2){const start=path[0];const meaningful=closed||path.some(p=>Math.hypot(p[0]-start[0],p[1]-start[1])*view.scale>2);if(meaningful)update(()=>selected=append(doc,{type:'freehand',path,closed,...(joinStyle?{joinStyle}:{})}).id);}
 }
 scheduleRender();
}
function onWheel(e){if(!$('tikzcd-dialog').hidden||!$('export-menu').hidden)return;e.preventDefault();if(drag)cancelDrag();const [x,y]=xyEvent(e),before=unproject(x,y),wheelPixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?Math.max(1,size.h):1),factor=Math.exp(-Math.max(-200,Math.min(200,wheelPixels))*.0013);view.scale=Math.max(5,Math.min(1000,view.scale*factor));const after=unproject(x,y);view.cx+=before[0]-after[0];view.cy+=before[1]-after[1];scheduleRender();}
function fit(){
 if(drag)cancelDrag();
 const result=fitSceneView(doc,createResolver(doc),size);
 view={cx:result.cx,cy:result.cy,scale:result.scale};
 if(result.clipped)notice('Some fixed-size labels are wider than this viewport. Enlarge the canvas or reduce font size.');
 render();
}
function deleteObject(id){
 if(!get(doc,id))return;
 const targets=affected(doc,id);
 if([...targets].some(key=>get(doc,key)?.locked)){notice('Unlock dependents before deleting.');return;}
 const removed=clone(doc.objects.filter(o=>targets.has(o.id)));
 const ok=update(()=>{remove(doc,id);if(selected&&targets.has(selected))selected=null;});
 if(ok&&removed.length){trash.unshift({at:Date.now(),objects:removed});trash=trash.slice(0,20);persistTrash();notice(`Deleted ${removed.length} objects. Restore them under Recently Deleted.`);}
}
function deleteSelected(){if(selected)deleteObject(selected);}
function persistTrash(){
 try{localStorage.setItem(TRASH,JSON.stringify(trash));}catch(e){notice('Recently Deleted could not be saved. Export a JSON backup.');}
 renderTrash();
}
function renderTrash(){
 const root=$('trash-items');if(!root)return;
 root.replaceChildren();$('trash-count').textContent=String(trash.length);
 for(const [index,entry] of trash.entries()){
  const row=document.createElement('div');row.className='trash-row';
  const title=document.createElement('span');title.textContent=`${entry.objects.length} object(s) · ${new Date(entry.at).toLocaleString()}`;
  const button=document.createElement('button');button.textContent='Restore';
  button.onclick=()=>{
   if(storageConflict){notice('Resolve the other-tab conflict before restoring.');return;}
   const source=trash[index];if(!source)return;
   if(source.objects.some(o=>get(doc,o.id)||doc.objects.some(existing=>existing.name===o.name))){notice('Restore blocked: an object ID or name is already used.');return;}
   // The deletion snapshot retains dependencies. Validate the entire candidate before removing trash.
   const ok=update(()=>{
    doc.objects.push(...clone(source.objects));
    const maximum=Math.max(...source.objects.map(o=>Number(o.id.slice(1))));
    if(!Number.isSafeInteger(maximum))throw Error('Invalid restored identifier.');
    doc.nextId=Math.max(doc.nextId,maximum+1);
   });
   if(ok){trash.splice(index,1);persistTrash();}
  };
  row.append(title,button);root.append(row);
 }
}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);}
function svgString(){
 const svg=el('svg',{xmlns:NS,width:size.w,height:size.h,viewBox:`0 0 ${size.w} ${size.h}`});plotLimitedInScene=false;draw(svg,{exporting:true});
 if(plotLimitedInScene)throw Error('Plot evaluation budget exceeded. Image export is disabled for this incomplete view; narrow the viewport, lower plot detail, or simplify the expression.');
 if(doc.settings.exportRegion==='page'&&doc.settings.page!=='infinite'){
  const r=pageRect(size,doc.settings.page);svg.setAttribute('viewBox',`${r.x} ${r.y} ${r.width} ${r.height}`);
  svg.setAttribute('width',r.width);svg.setAttribute('height',r.height);
 }
 return {text:new XMLSerializer().serializeToString(svg),width:Number(svg.getAttribute('width')),height:Number(svg.getAttribute('height'))};
}
/** Export only the scene the user requested, never a stale render from before an edit.
 * The signature covers document edits, view changes and resize. A delayed SVG
 * decode or toBlob must not emit an unrelated image after a later user action.
 */
let exportAbortToken=0;
function exportSignature(){return JSON.stringify([documentRevision,documentGeneration,view.cx,view.cy,view.scale,size.w,size.h,exportAbortToken]);}
function assertExportFresh(signature){
 if(exportSignature()!==signature)throw Error('Image export canceled: the illustration, viewport or export dialog changed during rendering. Export again.');
}
function awaitExportStage(register,label,timeoutMs=15000){
 return new Promise((resolve,reject)=>{
  let done=false;
  const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);if(error)reject(error);else resolve(value);};
  const timer=setTimeout(()=>finish(Error(label+' timed out. No file was downloaded.')),timeoutMs);
  try{register(v=>finish(null,v),err=>finish(err instanceof Error?err:Error(String(err))));}catch(e){finish(e);}
 });
}
async function exportImage(type){
 const signature=exportSignature(),result=svgString(),background=doc.settings.background,factor=doc.settings.exportScale;
 if(type==='svg'){download(new Blob([result.text],{type:'image/svg+xml;charset=utf-8'}),'mathillustrator.svg');return;}
 if(type==='jpeg'&&doc.settings.exportTransparent)throw Error('JPEG cannot represent transparency. Turn off transparent export or choose PNG/WebP/SVG.');
 const width=Math.max(1,Math.round(result.width*factor)),height=Math.max(1,Math.round(result.height*factor));
 if(width>16384||height>16384||width*height>36e6)throw Error('Raster output exceeds the 36-megapixel / 16384-pixel limit. Lower export resolution or resize the viewport.');
 const src=URL.createObjectURL(new Blob([result.text],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const img=new Image();
  await awaitExportStage((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('SVG rasterization failed.'));img.src=src;},'SVG rasterization');
  assertExportFresh(signature);
  const can=document.createElement('canvas');can.width=width;can.height=height;
  const ctx=can.getContext('2d');if(!ctx)throw Error('Canvas 2D unavailable.');
  // Match exact rounded output dimensions, including fractional A4/Letter crop
  // lengths; multiplying by `factor` can leave an unintended edge pixel.
  ctx.setTransform(width/result.width,0,0,height/result.height,0,0);
  if(!doc.settings.exportTransparent){ctx.fillStyle=background;ctx.fillRect(0,0,result.width,result.height);}
  ctx.drawImage(img,0,0,result.width,result.height);
  const mime={png:'image/png',jpeg:'image/jpeg',webp:'image/webp'}[type];
  const blob=await awaitExportStage((resolve,reject)=>can.toBlob(v=>v?resolve(v):reject(Error(type.toUpperCase()+' encoding failed.')),mime,.94),'Raster encoding');
  assertExportFresh(signature);
  if(blob.type!==mime)throw Error(type.toUpperCase()+' export is unsupported by this browser.');
  download(blob,'mathillustrator.'+(type==='jpeg'?'jpg':type));
 }finally{URL.revokeObjectURL(src);}
}
function latexEscape(s){const map={'\\':'\\textbackslash{}','#':'\\#','$':'\\$','%':'\\%','&':'\\&','_':'\\_','{':'\\{','}':'\\}'};map['^']='\\textasciicircum{}';map['~']='\\textasciitilde{}';return [...String(s)].map(c=>map[c]||c).join('');}
const texPoint=tikzPoint;
function canTikz(){
 // Screen-space collision-avoidance offsets cannot be represented by the
 // restricted world-space TikZ point-label exporter. Never silently revert.
 if(doc.settings.showLabels&&doc.settings.labelPlacement==='avoid'&&doc.objects.some(o=>!o.hidden&&o.style?.opacity!==0&&['point','midpoint'].includes(o.type)))return false;
 if(tikzGeometryIssue(doc))return false;
 // Plain-text TikZ targets pdfLaTeX: reject unsupported Unicode/control labels
 // rather than enabling an export which cannot be compiled reliably.
 // TeX collapses leading/trailing and repeated spaces even when SVG preserves them.
 const safeText=s=>typeof s==='string'&&/^[\x20-\x7e]*$/.test(s)&&!/(^ | $| {2,})/.test(s);
 return doc.objects.every(o=>o.hidden||o.style?.opacity===0||(
  (!['point','midpoint'].includes(o.type)||!doc.settings.showLabels||(o.pointLabelMode!=='latex'&&safeText(o.pointLabel||o.name)))&&
  (!['text','node','morphism'].includes(o.type)||(o.textMode!=='latex'&&safeText(o.text)))&&
  (o.type!=='node'||layoutNodeLabel(o.text,o.fontSize||17).lines.length===1)&&(o.type!=='morphism'||(o.arrowStyle===undefined||o.arrowStyle==='solid')&&(o.routing??'direct')==='direct'&&(o.labelT??.5)===.5&&(o.labelDistance??17)===17&&(o.labelDx??0)===0&&(o.labelDy??0)===0&&(!o.labelAvoid||!o.text))&&['point','midpoint','segment','arrow','line','circle','ellipse','rectangle','polygon','polyline','bezier','angle','regularPolygon','freehand','text','node','morphism'].includes(o.type)&&(o.type!=='freehand'||false)&&(o.type!=='morphism'||o.hidden||o.refs.every(id=>get(doc,id)?.type==='node'&&!get(doc,id)?.hidden&&get(doc,id)?.style?.opacity!==0))));}
function asTikz(){
 if(!canTikz())throw Error('TikZ export is unavailable for a visible unsupported object or label. Use SVG or JSON instead.');
 const lines=['\\begin{tikzpicture}[x=1cm,y=1cm,line cap=round,line join=round]'],resolver=createResolver(doc);
 const rgb=color=>`{rgb,255:red,${parseInt(color.slice(1,3),16)};green,${parseInt(color.slice(3,5),16)};blue,${parseInt(color.slice(5,7),16)}}`;
 for(const o of doc.objects){if(o.hidden||o.style?.opacity===0)continue;
  const style=`draw=${rgb(o.style.stroke)},line width=${(o.style.width*.75).toFixed(4)}pt,opacity=${o.style.opacity}`;
  const p=resolver.points(o);if(o.type==='point'||o.type==='midpoint'){
   const xy=resolver.at(o.id);if(!xy)continue;lines.push(`\\fill[fill=${rgb(o.style.stroke)},opacity=${o.style.opacity}] ${texPoint(xy)} circle (${((o.style.pointSize??doc.settings.pointSize)*.75).toFixed(3)}pt);`);
   if(doc.settings.showLabels)lines.push(`\\node[above right,opacity=${o.style.opacity}] at ${texPoint(xy)} {${latexEscape(o.pointLabel||o.name)}};`);
  }else if(['segment','arrow','line'].includes(o.type)&&p.length===2&&p.every(Boolean)){
   let [a,b]=p;if(o.type==='line'){const d=[b[0]-a[0],b[1]-a[1]],len=Math.hypot(...d);if(!len)continue;const k=100/len;a=[a[0]-d[0]*k,a[1]-d[1]*k];b=[b[0]+d[0]*k,b[1]+d[1]*k];}
   lines.push(`\\draw[${style}${o.type==='arrow'?',->':''}] ${texPoint(a)} -- ${texPoint(b)};`);
  }else if(o.type==='circle'&&p.length===2&&p.every(Boolean)){
   lines.push(`\\draw[${style}] ${texPoint(p[0])} circle (${Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1]).toFixed(5)}cm);`);
  }else if(o.type==='ellipse'&&p.length===2&&p.every(Boolean)){
   const cx=(p[0][0]+p[1][0])/2,cy=(p[0][1]+p[1][1])/2,rx=Math.abs(p[1][0]-p[0][0])/2,ry=Math.abs(p[1][1]-p[0][1])/2;
   if(rx<1e-9||ry<1e-9)lines.push(`\\draw[${style}] ${texPoint(p[0])} -- ${texPoint(p[1])};`);
   else lines.push(`\\draw[${style},fill=${rgb(o.style.fill)},fill opacity=${(.2*o.style.opacity).toFixed(3)}] ${texPoint([cx,cy])} ellipse (${rx.toFixed(5)}cm and ${ry.toFixed(5)}cm);`);
  }else if(o.type==='rectangle'&&p.length===2&&p.every(Boolean)){
   lines.push(`\\draw[${style},fill=${rgb(o.style.fill)},fill opacity=${(.24*o.style.opacity).toFixed(3)}] ${texPoint(p[0])} rectangle ${texPoint(p[1])};`);
  }else if(['polygon','polyline'].includes(o.type)&&p.every(Boolean)){
   lines.push(`\\draw[${style}${o.type==='polygon'?`,fill=${rgb(o.style.fill)},fill opacity=${(.24*o.style.opacity).toFixed(3)}`:''}] ${p.map(texPoint).join(' -- ')}${o.type==='polygon'?' -- cycle':''};`);
  }else if(o.type==='regularPolygon'&&p.length===2&&p.every(Boolean)){
   const vertices=regularPolygonVertices(p[0],p[1],o.sides);if(vertices.length)lines.push(`\\draw[${style},fill=${rgb(o.style.fill)},fill opacity=${(.24*o.style.opacity).toFixed(3)}] ${vertices.map(texPoint).join(' -- ')} -- cycle;`);
  }else if(o.type==='bezier'&&p.length===4&&p.every(Boolean)){
   lines.push(`\\draw[${style}] ${texPoint(p[0])} .. controls ${texPoint(p[1])} and ${texPoint(p[2])} .. ${texPoint(p[3])};`);
  }else if(o.type==='angle'&&p.length===3&&p.every(Boolean)){
   // TikZ pic angle annotation: 3-point geometry is preserved but physical screen radius is approximated.
   const [a,b,c]=p,r=26/48,one=Math.atan2(a[1]-b[1],a[0]-b[0]),two=Math.atan2(c[1]-b[1],c[0]-b[0]);let d=(two-one+Math.PI*2)%(Math.PI*2);if(d>Math.PI)d-=2*Math.PI;
   lines.push(`\\draw[${style}] ${texPoint([b[0]+r*Math.cos(one),b[1]+r*Math.sin(one)])} arc (${(one*180/Math.PI).toFixed(5)}:${((one+d)*180/Math.PI).toFixed(5)}:${r}cm);`);
  }else if(o.type==='freehand'&&o.path.length>1){
   const chosen=o.path;
   lines.push(`\\draw[${style}] ${chosen.map(texPoint).join(' -- ')};`);
  }else if(o.type==='text')lines.push(`\\node[anchor=west,text=${rgb(o.style.stroke)},opacity=${o.style.opacity}] at ${texPoint(o.xy)} {${latexEscape(o.text)}};`);
  else if(o.type==='node')lines.push(`\\node[${o.nodeBorder?`draw=${rgb(o.style.stroke)},rounded corners,`:''}inner sep=5pt,opacity=${o.style.opacity}] (mi${o.id}) at ${texPoint(o.xy)} {${latexEscape(o.text)}};`);
  else if(o.type==='morphism')continue;
 }
 for(const o of doc.objects){if(o.hidden||o.style?.opacity===0||o.type!=='morphism')continue;
  const a=resolver.object(o.refs[0]),b=resolver.object(o.refs[1]);if(!a||!b||a.hidden||b.hidden||a.style?.opacity===0||b.style?.opacity===0)continue;
  const style=`draw=${rgb(o.style.stroke)},line width=${(o.style.width*.75).toFixed(4)}pt,opacity=${o.style.opacity}`;
  const label=o.text?` node[${o.swap?'below':'above'}] {${latexEscape(o.text)}}`:'';
  lines.push(`\\draw[${style},->] (mi${a.id}) to${o.bend?`[bend ${o.bend>=0?'left':'right'}=${Math.min(80,Math.abs(o.bend)*35).toFixed(1)}]`:''}${label} (mi${b.id});`);
 }
 lines.push('\\end{tikzpicture}');return lines.join('\n');
}
function rasterSupported(type){
 try{
  const c=document.createElement('canvas');
  return !!c.toBlob&&c.toDataURL('image/'+type,.8).startsWith('data:image/'+type);
 }catch{return false;}
}
let exportBusy=false;
function setupExport(){
 const opts=[['SVG','svg',!plotLimitedInScene],['PNG','png',!plotLimitedInScene&&rasterSupported('png')],['JPEG','jpeg',!plotLimitedInScene&&!doc.settings.exportTransparent&&rasterSupported('jpeg')],['WebP','webp',!plotLimitedInScene&&rasterSupported('webp')],['TikZ / PGF','tikz',canTikz()],['tikz-cd (semantic)','tikzcd',canExportTikzCd(doc)],['JSON project','json',true],['PDF','pdf',false],['Asymptote','asy',false],['GIF / video','animation',false]];
 const root=$('export-options');root.replaceChildren();for(const [name,type,supported]of opts){
  const b=document.createElement('button');b.textContent=name;b.disabled=!supported||exportBusy;b.title=supported?'Export current illustration':type==='jpeg'&&doc.settings.exportTransparent?'JPEG cannot preserve transparency; choose PNG, WebP or SVG.':'Not implemented or not representable in current scene';
  b.onclick=async()=>{if(exportBusy)return;exportBusy=true;for(const other of root.querySelectorAll('button'))other.disabled=true;try{
    if(['svg','png','jpeg','webp'].includes(type))await exportImage(type);
    else if(type==='json')download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),'mathillustrator.json');
    else if(type==='tikz')download(new Blob([asTikz()],{type:'text/plain'}),'mathillustrator.tex');
    else if(type==='tikzcd')download(new Blob([exportTikzCd(doc)],{type:'text/plain'}),'mathillustrator-tikzcd.tex');
    $('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();
   }catch(e){notice(e.message);}finally{exportBusy=false;if(!$('export-menu').hidden)setupExport();}};root.append(b);
 }
}
/** Keep keyboard focus inside an open overlay, including Shift+Tab from its
 * first control. Background keyboard commands are separately suppressed.
 * Export options can be disabled dynamically while a raster encode is active.
 */
function trapDialogTab(e,overlay){
 if(e.key!=='Tab')return;
 const eligible=[...overlay.querySelectorAll('button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')].filter(node=>node.getClientRects().length);
 if(!eligible.length){e.preventDefault();overlay.focus();return;}
 const first=eligible[0],last=eligible.at(-1),active=document.activeElement;
 if(e.shiftKey&&(active===first||!overlay.contains(active))){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&(active===last||!overlay.contains(active))){e.preventDefault();first.focus();}
}
function savePrefs(){try{localStorage.setItem('mathillustrator-layout-v1',JSON.stringify(uiPrefs));}catch{notice('Layout preferences could not be saved.');}}
function setupInterface(){
 try{const prefs=JSON.parse(localStorage.getItem('mathillustrator-layout-v1')||'{}');if(prefs&&typeof prefs==='object')uiPrefs={...uiPrefs,...prefs};}catch{}
 const fontMap={system:'system-ui, sans-serif',serif:'Georgia, serif',sans:'Arial, sans-serif',mono:'Consolas, monospace'};
 $('ui-font').value=fontMap[uiPrefs.font]?uiPrefs.font:'system';document.documentElement.style.setProperty('--ui-font',fontMap[$('ui-font').value]);
 $('ui-font').onchange=()=>{uiPrefs.font=$('ui-font').value;document.documentElement.style.setProperty('--ui-font',fontMap[uiPrefs.font]);savePrefs();};
 $('auto-move').checked=uiPrefs.autoMove!==false;$('auto-move').onchange=()=>{uiPrefs.autoMove=$('auto-move').checked;savePrefs();};
 function applyLanguage(){closeObjectMenu();document.documentElement.lang=uiPrefs.language==='zh'?'zh':'en';localizeUI(document.documentElement,uiPrefs.language);updateModeLabel(tool);}
 $('ui-language').value=uiPrefs.language==='zh'?'zh':'en';
 $('ui-language').onchange=()=>{uiPrefs.language=$('ui-language').value;savePrefs();applyLanguage();renderList();};applyLanguage();
 const properties=$('properties'),toggle=$('properties-toggle');toggle.onclick=()=>{const collapsed=!properties.hidden;properties.hidden=collapsed;toggle.textContent=collapsed?'+':'−';toggle.setAttribute('aria-expanded',String(!collapsed));};
 // Only interface preferences change on disclosure/reorder: no undo entry, no
 // project mutation, no imported `settings.modules` rewrite, no lost selection.
 const palette=$('panel-sections'),settingsContent=$('settings-sections');
 const toolSections=[...palette.children].filter(e=>e.classList.contains('toolgroup'));
 const settingSections=[...settingsContent.children].filter(e=>e.classList.contains('controls'));
 const geometrySections=[...$('construction-tools').children].filter(e=>e.classList.contains('geometry-subgroup'));
 const settingsGroup=palette.querySelector(':scope > .settings-collection');
 const allSections=[...toolSections,...settingSections,...geometrySections,settingsGroup];
 for(const [i,e] of allSections.entries()){
  e.dataset.sectionId=e.dataset.sectionId||e.id||e.querySelector(':scope > h3')?.textContent.trim().toLowerCase().replace(/[^a-z]+/g,'-').replace(/^-+|-+$/g,'')||String(i);
 }
 const validIds=new Set(allSections.map(e=>e.dataset.sectionId));
 if(!uiPrefs.collapsed||typeof uiPrefs.collapsed!=='object'||Array.isArray(uiPrefs.collapsed))uiPrefs.collapsed={};
 // Old and malformed order entries cannot move settings out of the group.
 if(Array.isArray(uiPrefs.sections)){
  // Round 12 included a trailing dash in Plotting's generated preference key.
  const preferred=uiPrefs.sections.slice(0,100).map(id=>id==='plotting-'?'plotting':id);
  for(const siblings of [toolSections,settingSections]){
   const parent=siblings[0]?.parentElement;if(!parent)continue;
   const ordered=[];
   for(const id of preferred){const section=siblings.find(e=>e.dataset.sectionId===id);if(section&&!ordered.includes(section))ordered.push(section);}
   // New groups were not present in older preferences; append them after the
   // user's explicitly ordered groups rather than placing them first.
   for(const section of siblings)if(!ordered.includes(section))ordered.push(section);
   for(const section of ordered)parent.append(section);
  }
 }
 // Geometry subgroups have their own order, never intermingled with settings or tools.
 if(Array.isArray(uiPrefs.geometryGroups)){
  const preferred=uiPrefs.geometryGroups.slice(0,40),ordered=[];
  for(const id of preferred){const section=geometrySections.find(e=>e.dataset.geometryGroup===id);if(section&&!ordered.includes(section))ordered.push(section);}
  for(const section of geometrySections)if(!ordered.includes(section))ordered.push(section);
  for(const section of ordered)$('construction-tools').append(section);
 }
 palette.append(settingsGroup);
 function saveOrder(){uiPrefs.sections=[...palette.children,...settingsContent.children].filter(e=>validIds.has(e.dataset.sectionId)&&e!==settingsGroup).map(e=>e.dataset.sectionId);uiPrefs.geometryGroups=[...$('construction-tools').children].filter(e=>e.classList.contains('geometry-subgroup')).map(e=>e.dataset.geometryGroup);savePrefs();}
 let dragged=null;
 function moveSection(e,shift){
  const parent=e.parentElement,kind=e.classList.contains('toolgroup')?'toolgroup':e.classList.contains('geometry-subgroup')?'geometry-subgroup':'controls';
  const siblings=[...parent.children].filter(node=>node!==settingsGroup&&node.classList.contains(kind));
  const index=siblings.indexOf(e),other=siblings[index+shift];if(!other)return;
  parent.insertBefore(e,shift<0?other:other.nextSibling);
  if(parent===palette)palette.append(settingsGroup);
  saveOrder();
 }
 function addDisclosure(section,reorderable){
  const id=section.dataset.sectionId,heading=section.querySelector(':scope > h3, :scope > h4');
  const name=heading.dataset.sectionTitle||heading.firstChild?.textContent.trim()||heading.textContent.trim();
  let body=section.querySelector(':scope > .settings-sections');
  if(!body){body=document.createElement('div');body.className='section-body';while(heading.nextSibling)body.append(heading.nextSibling);section.append(body);}
  body.id=body.id||`section-body-${id}`;
  heading.classList.add('section-heading');
  const tooltip=heading.querySelector('.mini-help');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='section-toggle';
  toggle.setAttribute('aria-controls',body.id);
  const arrow=document.createElement('span');arrow.className='section-chevron';arrow.setAttribute('aria-hidden','true');
  const title=document.createElement('span');title.textContent=name;toggle.append(arrow,title);
  heading.replaceChildren(toggle);
  if(tooltip)heading.append(tooltip);
  function updateDisclosure(){
   const collapsed=uiPrefs.collapsed[id]===true;
   body.hidden=collapsed;arrow.textContent=collapsed?'▸':'▾';toggle.setAttribute('aria-expanded',String(!collapsed));
   const prefix=translated(collapsed?'Expand section':'Collapse section',uiPrefs.language);
   toggle.setAttribute('aria-label',`${prefix}: ${translated(name,uiPrefs.language)}`);
   toggle.title=toggle.getAttribute('aria-label');
   if(id==='settings')$('settings-open').setAttribute('aria-expanded',String(!collapsed));
  }
  toggle.onclick=()=>{uiPrefs.collapsed[id]=!(uiPrefs.collapsed[id]===true);updateDisclosure();savePrefs();};
  section.refreshDisclosure=updateDisclosure;
  updateDisclosure();
  if(!reorderable)return;
  const grip=document.createElement('button');grip.type='button';grip.className='section-drag-handle';grip.draggable=true;grip.textContent='⠿';
  heading.append(grip);
  function updateGrip(){grip.title=translated('Drag to reorder; Alt+Up/Down',uiPrefs.language);grip.setAttribute('aria-label',`${translated('Reorder section',uiPrefs.language)}: ${translated(name,uiPrefs.language)}`);}
  section.refreshGrip=updateGrip;updateGrip();
  grip.addEventListener('dragstart',event=>{
   dragged=section;section.classList.add('moving');event.dataTransfer.effectAllowed='move';
   event.dataTransfer.setData('text/plain',id);event.stopPropagation();
  });
  grip.addEventListener('dragend',()=>{section.classList.remove('moving');dragged=null;});
  grip.addEventListener('keydown',event=>{
   if(!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();moveSection(section,event.key==='ArrowUp'?-1:1);grip.focus();
  });
  section.addEventListener('dragover',event=>{
   if(!dragged||dragged===section||dragged.parentElement!==section.parentElement)return;
   event.preventDefault();event.dataTransfer.dropEffect='move';
  });
  section.addEventListener('drop',event=>{
   if(!dragged||dragged===section||dragged.parentElement!==section.parentElement)return;
   event.preventDefault();event.stopPropagation();const position=event.clientY<section.getBoundingClientRect().top+section.offsetHeight/2;
   section.parentElement.insertBefore(dragged,position?section:section.nextSibling);
   if(dragged.parentElement===palette)palette.append(settingsGroup);saveOrder();
  });
 }
 for(const section of allSections)addDisclosure(section,section!==settingsGroup);
 // Header cog is now a shortcut to the unified Settings sidebar, not a
 // competing floating dialog. Open the right drawer first on small screens.
 $('settings-open').onclick=()=>{
  if(matchMedia('(max-width:700px)').matches){
   if(!document.body.classList.contains('mobile-right-open'))$('right-collapse').click();
  }else if(document.body.classList.contains('right-collapsed'))$('right-collapse').click();
  for(const id of ['settings','interface'])if(uiPrefs.collapsed[id]===true){
   const section=allSections.find(e=>e.dataset.sectionId===id);
   section?.querySelector(':scope > h3 > .section-toggle')?.click();
  }
  $('ui-font').scrollIntoView({block:'nearest'});$('ui-font').focus();
 };
 // Language is switched after buttons are generated; update mutable labels
 // explicitly rather than relying on cached DOM localization attributes.
 const previousLanguage=applyLanguage;
 $('ui-language').onchange=()=>{uiPrefs.language=$('ui-language').value;savePrefs();previousLanguage();for(const section of allSections){section.refreshDisclosure();section.refreshGrip?.();}renderList();};
}
/** Resizing affects local UI preferences only; it never edits the scene. */
function setupPanelResizing(mobile){
 const workspace=document.querySelector('.workspace');
 const handles={left:$('left-resizer'),right:$('right-resizer')};
 let active=null,displayed=null;
 const collapsed=side=>document.body.classList.contains(`${side}-collapsed`);
 const defaults=()=>matchMedia('(max-width:950px)').matches?{left:240,right:235}:{left:310,right:305};
 function desired(){
  const saved=uiPrefs.sidebarWidths;
  return {
   left:validPanelWidth(saved?.left)??defaults().left,
   right:validPanelWidth(saved?.right)??defaults().right
  };
 }
 function applyWidths(preferred=desired(),priority=null){
  if(mobile.matches)return;
  displayed=fitPanels(workspace.getBoundingClientRect().width,preferred.left,preferred.right,collapsed('left'),collapsed('right'),priority);
  workspace.style.setProperty('--mi-left-width',`${displayed.left}px`);
  workspace.style.setProperty('--mi-right-width',`${displayed.right}px`);
  for(const side of ['left','right']){
   const handle=handles[side];
   handle.setAttribute('aria-valuemin',String(PANEL_MIN));
   handle.setAttribute('aria-valuemax',String(displayed[`${side}Max`]));
   handle.setAttribute('aria-valuenow',String(displayed[side]));
   handle.setAttribute('aria-valuetext',`${displayed[side]} ${translated('pixels',uiPrefs.language)}`);
  }
 }
 function saveApplied(side,previous){
  // Do not replace an unseen, collapsed sidebar's preferred width with 52px.
  uiPrefs.sidebarWidths={
   left:collapsed('left')?previous.left:displayed.left,
   right:collapsed('right')?previous.right:displayed.right
  };
  savePrefs();
 }
 function stop(commit=false){
  if(!active)return;
  const {side,id,before}=active;
  active=null;document.body.classList.remove('panels-resizing');
  if(commit)saveApplied(side,before);
  else applyWidths(before);
  const h=handles[side];
  if(h.hasPointerCapture?.(id))h.releasePointerCapture(id);
 }
 function setWidth(side,value,starting=desired()){
  const proposed={...starting,[side]:Math.max(PANEL_MIN,Math.min(PANEL_MAX,Math.round(value)))};
  applyWidths(proposed,side);
 }
 for(const side of ['left','right']){
  const handle=handles[side];
  handle.addEventListener('pointerdown',event=>{
   if(mobile.matches||collapsed(side)||!event.isPrimary||event.button!==0||active)return;
   event.preventDefault();event.stopPropagation();
   const before=desired();
   applyWidths();
   const opposite=side==='left'?'right':'left';
   const working={...before,[opposite]:displayed[opposite],[side]:displayed[side]};
   const rect=workspace.getBoundingClientRect();
   const boundary=side==='left'?rect.left+displayed.left:rect.right-displayed.right;
   active={side,id:event.pointerId,before,working,grabOffset:event.clientX-boundary};
   handle.setPointerCapture(event.pointerId);
   document.body.classList.add('panels-resizing');
  });
  handle.addEventListener('pointermove',event=>{
   if(!active||active.side!==side||event.pointerId!==active.id)return;
   const rect=workspace.getBoundingClientRect();
   const boundary=event.clientX-active.grabOffset;
   const width=side==='left'?boundary-rect.left:rect.right-boundary;
   setWidth(side,width,active.working);
  });
  handle.addEventListener('pointerup',event=>{
   if(active?.side===side&&active.id===event.pointerId){event.preventDefault();stop(true);}
  });
  handle.addEventListener('pointercancel',event=>{if(active?.id===event.pointerId)stop();});
  handle.addEventListener('lostpointercapture',event=>{if(active?.id===event.pointerId)stop();});
  handle.addEventListener('keydown',event=>{
   if(mobile.matches||collapsed(side)||active)return;
   const key=event.key;
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(key))return;
   event.preventDefault();event.stopPropagation();
   applyWidths();
   const starting=desired(),other=side==='left'?'right':'left';
   starting[other]=displayed[other];
   const max=displayed[`${side}Max`];
   const step=event.shiftKey?24:8;
   const target=key==='Home'?PANEL_MIN:key==='End'?max:displayed[side]+(key==='ArrowRight'?1:-1)*(side==='left'?step:-step);
   setWidth(side,target,starting);
   saveApplied(side,desired());
  });
  handle.addEventListener('dblclick',event=>{
   if(mobile.matches||collapsed(side)||active)return;
   event.preventDefault();
   applyWidths();
   const starting=desired();
   starting[side==='left'?'right':'left']=displayed[side==='left'?'right':'left'];
   setWidth(side,defaults()[side],starting);
   saveApplied(side,desired());
  });
 }
 window.addEventListener('keydown',event=>{
  if(active&&event.key==='Escape'){
   event.preventDefault();event.stopImmediatePropagation();stop();
  }
 },true);
 window.addEventListener('blur',()=>stop());
 $('ui-language').addEventListener('change',()=>applyWidths());
 window.addEventListener('resize',()=>{
  if(active)stop();
  applyWidths();
 });
 mobile.addEventListener('change',()=>{
  if(active)stop();
  applyWidths();
 });
 return applyWidths;
}


/** R45: independent docked-height split and floating Properties inspector.
 * Layout lives only in local UI preferences, never in project JSON/history. */
function setupPropertiesLayout(mobile){
 const pane=$('properties-dock'),left=document.querySelector('.leftpanel'),head=$('properties-head');
 const toggle=$('properties-toggle'),dockButton=$('properties-undock'),split=$('properties-splitter'),corner=$('properties-corner');
 let preferred=normalizePropertiesLayout(uiPrefs.propertiesPanel),active=null;
 $('properties').hidden=preferred.collapsed;toggle.textContent=preferred.collapsed?'+':'−';
 const desktop=()=>!mobile.matches;
 const copy=o=>({...o});
 const barHeight=()=>document.querySelector('.appbar').getBoundingClientRect().height;
 function maxDock(){
  const fixed=[...left.children].filter(el=>el!==pane&&el.id!=='objects'&&!el.classList.contains('panel-resizer')).reduce((total,el)=>total+el.getBoundingClientRect().height,0);
  return fitDockPropertiesHeight(preferred.dockHeight,left.clientHeight,fixed);
 }
 function floatingGeometry(from=preferred){
  return fitFloatingProperties(from,window.innerWidth,window.innerHeight,barHeight());
 }
 function updateAria(){
  const language=uiPrefs.language;
  const h=maxDock();
  split.setAttribute('aria-valuemin',String(h.min));
  split.setAttribute('aria-valuemax',String(h.max));
  split.setAttribute('aria-valuenow',String(Math.min(h.height,Math.round(pane.getBoundingClientRect().height)||h.height)));
  split.setAttribute('aria-valuetext',`${Math.round(pane.getBoundingClientRect().height)} ${translated('pixels',language)}`);
  split.setAttribute('aria-label',translated('Resize Properties height',language));
  corner.setAttribute('aria-label',translated('Resize floating Properties panel',language));
  head.setAttribute('aria-label',translated('Move Properties panel',language));
  const floating=preferred.mode==='floating';
  dockButton.textContent=translated(floating?'Dock':'Float',language);
  dockButton.title=translated(floating?'Dock Properties panel':'Float Properties panel',language);
  dockButton.setAttribute('aria-label',dockButton.title);
  toggle.title=translated($('properties').hidden?'Expand Properties':'Collapse Properties',language);
  toggle.setAttribute('aria-label',toggle.title);
  toggle.setAttribute('aria-expanded',String(!$('properties').hidden));
  corner.setAttribute('aria-valuetext',`${Math.round(pane.getBoundingClientRect().width)} × ${Math.round(pane.getBoundingClientRect().height)} ${translated('pixels',language)}`);
 }
 function apply(next=preferred){
  const floating=desktop()&&next.mode==='floating';
  document.body.classList.toggle('properties-floating',floating);
  // Reparent only for actual floating mode. The left sidebar is a z-indexed
  // stacking context and could otherwise hide the inspector behind Tools.
  const parent=floating?document.body:left;
  if(pane.parentElement!==parent)parent.append(pane);
  pane.classList.toggle('is-folded',$('properties').hidden);
  head.tabIndex=floating?0:-1;corner.tabIndex=floating&&!$('properties').hidden?0:-1;
  if(floating){
   const g=floatingGeometry(next);
   pane.style.left=`${g.x}px`;pane.style.top=`${g.y}px`;
   pane.style.width=`${g.width}px`;pane.style.height=`${g.height}px`;
   pane.style.removeProperty('--mi-properties-height');
   split.tabIndex=-1;
  }else{
   pane.style.removeProperty('left');pane.style.removeProperty('top');pane.style.removeProperty('width');pane.style.removeProperty('height');
   pane.style.setProperty('--mi-properties-height',`${maxDock().height}px`);
   split.tabIndex=desktop()&&!$('properties').hidden&&!document.body.classList.contains('left-collapsed')?0:-1;
  }
  // Mobile uses the native drawer and cannot expose a floating canvas overlay.
  if(mobile.matches){split.tabIndex=-1;corner.tabIndex=-1;head.tabIndex=-1;}
  updateAria();
 }
 function commit(next){
  preferred=normalizePropertiesLayout(next);
  uiPrefs.propertiesPanel=copy(preferred);savePrefs();apply();
 }
 function stop(save=false){
  if(!active)return;
  const {id,handle,preview}=active;
  active=null;document.body.classList.remove('properties-moving','properties-resizing');
  if(save&&preview)commit(preview);else apply();
  if(handle.hasPointerCapture?.(id))handle.releasePointerCapture(id);
 }
 function gesture(handle,kind,event){
  if(!desktop()||active||!event.isPrimary||event.button!==0)return;
  if(kind==='move'&&(preferred.mode!=='floating'||event.target.closest('button,input,select,textarea,a')))return;
  if(kind==='resize'&&(preferred.mode!=='floating'||$('properties').hidden))return;
  if(kind==='split'&&(preferred.mode!=='docked'||$('properties').hidden||document.body.classList.contains('left-collapsed')))return;
  event.preventDefault();event.stopPropagation();
  const rect=pane.getBoundingClientRect();
  active={kind,handle,id:event.pointerId,x:event.clientX,y:event.clientY,rect,
   before:copy(preferred),preview:null};
  handle.setPointerCapture(event.pointerId);
  document.body.classList.add(kind==='move'?'properties-moving':'properties-resizing');
 }
 function track(event){
  if(!active||event.pointerId!==active.id)return;
  const g=active,dx=event.clientX-g.x,dy=event.clientY-g.y;
  let next={...g.before};
  if(g.kind==='move'){
   next.x=g.rect.left+dx;next.y=g.rect.top+dy;
   // Clamp previews to the viewport without rewriting historical saved size.
   const bounded=fitFloatingProperties(next,window.innerWidth,window.innerHeight,barHeight());
   next.x=bounded.x;next.y=bounded.y;
  }else if(g.kind==='resize'){
   next.width=Math.max(260,Math.min(600,Math.round(g.rect.width+dx)));
   next.height=Math.max(180,Math.min(720,Math.round(g.rect.height+dy)));
  }else if(g.kind==='split'){
   const h=maxDock();next.dockHeight=Math.max(h.min,Math.min(h.max,Math.round(g.rect.height-dy)));
  }
  g.preview=next;
  // A dragged docked pane must not save until pointerup.
  applyPreview(next);
 }
 function applyPreview(next){
  if(active?.kind==='split'){
   pane.style.setProperty('--mi-properties-height',`${next.dockHeight}px`);
   updateAria();
  }else if(active){
   const rect=fitFloatingProperties(next,window.innerWidth,window.innerHeight,barHeight());
   for(const [key,value] of Object.entries({left:rect.x,top:rect.y,width:rect.width,height:rect.height}))pane.style[key]=`${value}px`;
   updateAria();
  }
 }
 for(const [handle,kind] of [[head,'move'],[corner,'resize'],[split,'split']]){
  handle.addEventListener('pointerdown',event=>gesture(handle,kind,event));
  handle.addEventListener('pointermove',track);
  handle.addEventListener('pointerup',event=>{if(active?.handle===handle&&active.id===event.pointerId){event.preventDefault();stop(true);}});
  handle.addEventListener('pointercancel',event=>{if(active?.id===event.pointerId)stop();});
  handle.addEventListener('lostpointercapture',event=>{if(active?.id===event.pointerId)stop();});
 }
 split.addEventListener('keydown',event=>{
  if(!desktop()||active||preferred.mode!=='docked'||$('properties').hidden)return;
  if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  const h=maxDock(),step=event.shiftKey?24:8;
  const target=event.key==='Home'?h.min:event.key==='End'?h.max:h.height+(event.key==='ArrowUp'?step:-step);
  commit({...preferred,dockHeight:Math.max(h.min,Math.min(h.max,target))});
 });
 split.addEventListener('dblclick',event=>{if(desktop()&&preferred.mode==='docked'&&!$('properties').hidden){event.preventDefault();commit({...preferred,dockHeight:PROPERTY_DOCK_DEFAULT});}});
 head.addEventListener('keydown',event=>{
  if(!desktop()||preferred.mode!=='floating'||active||!event.altKey)return;
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  const step=event.shiftKey?24:8,g=floatingGeometry();
  const candidate={...preferred,x:event.key==='Home'?360:g.x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),
   y:event.key==='Home'?Math.max(110,barHeight()+5):g.y+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)};
  const fitted=fitFloatingProperties(candidate,window.innerWidth,window.innerHeight,barHeight());
  commit({...candidate,x:fitted.x,y:fitted.y});
 });
 corner.addEventListener('keydown',event=>{
  if(!desktop()||preferred.mode!=='floating'||$('properties').hidden||active)return;
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  const step=event.shiftKey?24:8,g=floatingGeometry();
  const candidate={...preferred,width:event.key==='Home'?330:g.width+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),
   height:event.key==='Home'?420:g.height+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)};
  commit({...candidate,width:Math.max(260,Math.min(600,candidate.width)),height:Math.max(180,Math.min(720,candidate.height))});
 });
 dockButton.addEventListener('click',()=>{
  if(active)stop();
  const mode=preferred.mode==='floating'?'docked':'floating';
  commit({...preferred,mode});
  dockButton.focus({preventScroll:true});
 });
 toggle.addEventListener('click',()=>{commit({...preferred,collapsed:$('properties').hidden});});
 window.addEventListener('keydown',event=>{if(active&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();stop();}},true);
 window.addEventListener('blur',()=>stop());
 window.addEventListener('resize',()=>{if(active)stop();apply();});
 mobile.addEventListener('change',()=>{if(active)stop();apply();});
 $('ui-language').addEventListener('change',()=>apply());
 $('left-collapse').addEventListener('click',()=>queueMicrotask(()=>apply()));
 apply();
 return {apply};
}

function initialise(){
 populateTools();setupSettings();setupInterface();$('objects').addEventListener('scroll',()=>{closeObjectMenu();renderListWindow();},{passive:true});
 const searchToggle=$('object-search-toggle'),search=$('object-search');
 function setSearchOpen(open){search.hidden=!open;searchToggle.setAttribute('aria-expanded',String(open));
  if(open)search.focus();else{if(search.value){search.value='';renderList({resetScroll:true});}searchToggle.focus();}}
 searchToggle.onclick=()=>setSearchOpen(search.hidden);
 search.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setSearchOpen(false);}});
 document.addEventListener('pointerdown',e=>{if(objectMenuContext&&!$('object-action-menu').contains(e.target)&&!objectMenuContext.trigger.contains(e.target))closeObjectMenu();},true);
 document.addEventListener('focusin',e=>{if(objectMenuContext&&!$('object-action-menu').contains(e.target)&&!objectMenuContext.trigger.contains(e.target))closeObjectMenu();});
 window.addEventListener('resize',()=>closeObjectMenu());
 $('object-action-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeObjectMenu({restoreFocus:true});}
  else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const entries=[...$('object-action-menu').querySelectorAll('button:not(:disabled)')];
   const index=entries.indexOf(document.activeElement);if(entries.length)entries[e.key==='Home'?0:e.key==='End'?entries.length-1:(index+entries.length+(e.key==='ArrowDown'?1:-1))%entries.length].focus();}});
 let old=null;
 try{old=localStorage.getItem(STORAGE);lastStored=old;saveStatus(old?'Recovered local project':'Local backup ready');}catch(e){saveStatus('Not saved locally · download JSON');notice('Browser storage is restricted: use Save to download JSON.');}
 if(old){try{doc=validateDoc(JSON.parse(old));}catch(e){setStorageConflict(true,'corrupt');notice('Recovered empty editor. Corrupt saved data is preserved until you explicitly choose Keep this tab.');}}
 try{const stored=JSON.parse(localStorage.getItem(TRASH)||'[]');if(Array.isArray(stored))trash=stored.filter(e=>e&&Array.isArray(e.objects)&&Number.isFinite(e.at)).slice(0,20);}catch{}renderTrash();
 const mathjax=window.MathJax;
 if(mathjax?.startup?.promise)mathjax.startup.promise.then(()=>{renderAll();}).catch(e=>notice('LaTeX renderer failed: '+e.message));
 const svg=$('drawing');svg.addEventListener('pointerdown',pointerDown);svg.addEventListener('pointermove',pointerMove);svg.addEventListener('pointerup',pointerUp);svg.addEventListener('pointercancel',pointerUp);svg.addEventListener('lostpointercapture',pointerUp);
 // A second contact on a side panel must also interrupt a canvas gesture.
 // Touch releases outside an uncaptured empty-area selection must not leave
 // a phantom active contact that blocks the next legitimate tap.
 document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||svg.contains(e.target)||!touchContacts.size)return;
  touchBlocked=true;pendingTouchTap=null;
  if(drag)cancelDrag();
  if(draftStart||draftPoints.length||draftNode){clearDraft();scheduleRender();}
 },{capture:true});
 const endOutside=e=>{if(e.pointerType==='touch'&&touchContacts.has(e.pointerId))pointerUp(e);};
 window.addEventListener('pointerup',endOutside);
 window.addEventListener('pointercancel',endOutside);

 svg.addEventListener('contextmenu',e=>e.preventDefault());
 svg.addEventListener('wheel',onWheel,{passive:false});svg.addEventListener('dblclick',e=>{if(['polygon','polyline'].includes(tool)){e.preventDefault();const [x,y]=xyEvent(e),p=constructionPoint(unproject(x,y));finishDraft();}});
 window.addEventListener('keydown',e=>{
  // Composition keys belong to the IME even inside the tikz-cd modal.
  // In particular Escape must not dismiss the importer mid-composition.
  if(e.isComposing||e.keyCode===229)return;
  if(objectMenuContext){if(e.key==='Escape'){e.preventDefault();closeObjectMenu({restoreFocus:true});}return;}
  // Overlay focus is a separate interaction context. Never delete drawing objects
  // or switch tools from a shortcut while an import/export overlay is active.
  if(!$('tikzcd-dialog').hidden){
   if(e.key==='Escape'){e.preventDefault();$('tikzcd-dialog').hidden=true;$('tikzcd-open').focus();}
   else trapDialogTab(e,$('tikzcd-dialog'));
   return;
  }
  if(!$('export-menu').hidden){
   if(e.key==='Escape'){e.preventDefault();exportAbortToken++;$('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();}
   else trapDialogTab(e,$('export-menu'));
   return;
  }
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;
  const mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}
  else if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}
  else if(e.key==='Delete'||e.key==='Backspace'){
   // Text fields were already excluded. Buttons, links and other controls
   // must also be excluded: Backspace on Zoom/Save must not erase geometry.
   const active=document.activeElement;
   const drawingContext=active===document.body||active===$('drawing')||!!active?.classList?.contains('object');
   if(drawingContext){e.preventDefault();deleteSelected();}
  }
  else if(e.key==='Escape'){cancelDrag();draftStart=null;draftPoints=[];draftNode=null;selectTool('select');}
  else if(e.key==='Enter'&&['polygon','polyline'].includes(tool)){finishDraft();}
 });
 $('undo').onclick=undo;$('redo').onclick=redo;
 $('retry-autosave').onclick=()=>{if(storageConflict){saveStatus('Autosave paused · resolve conflict first');return;}
  if(!dirty){saveStatus('No unsaved local changes');return;}clearTimeout(saveTimer);persistNow();};
 $('object-search').oninput=()=>renderList({resetScroll:true});
 $('command-form').onsubmit=e=>{e.preventDefault();const input=$('command'),value=input.value;const success=update(()=>selected=command(doc,value).id);if(success){input.value='';selectTool('select');}};
 $('new').onclick=()=>{if(!window.confirm('Start a new illustration? Download the current project first if needed.'))return;update(()=>{doc=newDoc();selected=null;view={cx:0,cy:0,scale:48};});};
 $('open').onclick=()=>$('open-file').click();$('open-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>12e6)throw Error('Project JSON exceeds 12 MB safety limit.');const readingRevision=documentRevision,readingGeneration=documentGeneration;const imported=validateDoc(JSON.parse(await file.text()));if(readingRevision!==documentRevision||readingGeneration!==documentGeneration)throw Error('The current project changed while reading this file. Import canceled to protect newer edits.');if(!window.confirm('Replace the current illustration with this JSON project?'))return;update(()=>{doc=imported;selected=null;});notice('Project opened.');}catch(err){notice('Open failed: '+err.message);}finally{e.target.value='';}};
 $('save').onclick=()=>download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),'mathillustrator.json');
 $('export-open').onclick=()=>{if(drag)cancelDrag();setupExport();$('export-menu').hidden=!$('export-menu').hidden;$('export-backdrop').hidden=$('export-menu').hidden;if($('export-menu').hidden)exportAbortToken++;else $('export-close').focus();};$('export-close').onclick=()=>{exportAbortToken++;$('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();};
 $('export-backdrop').onclick=()=>{exportAbortToken++;$('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();};
 $('help').onclick=()=>window.open('tutorial.html','_blank','noopener');$('show-hidden').onchange=()=>renderList({resetScroll:true});
 $('tikzcd-open').onclick=()=>{if(drag)cancelDrag();$('tikzcd-dialog').hidden=false;$('tikzcd-input').focus();};
 $('tikzcd-close').onclick=()=>{$('tikzcd-dialog').hidden=true;$('tikzcd-open').focus();};
 $('tikzcd-apply').onclick=()=>{try{const d=validateDoc(importTikzCd($('tikzcd-input').value));if(!window.confirm('Replace the current illustration with the imported diagram?'))return;const ok=update(()=>{doc=d;selected=null;});if(ok){$('tikzcd-dialog').hidden=true;$('tikzcd-open').focus();notice('Imported a semantic tikz-cd diagram.');}}catch(e){notice('Import failed: '+e.message);}};
 $('conflict-load').onclick=()=>{if(!window.confirm('Replace this tab with the newer local project? Download your current version first if needed.'))return;try{const latest=localStorage.getItem(STORAGE);if(!latest)throw Error('No saved project found.');if(drag)cancelDrag();doc=validateDoc(JSON.parse(latest));documentRevision++;documentGeneration++;clearDraft();clearTimeout(saveTimer);dirty=false;lastStored=latest;setStorageConflict(false);saveStatus('Loaded newer local project');history=[];future=[];selected=null;syncHistory();renderAll();}catch(e){notice('Cannot load other tab: '+e.message);}};
 $('conflict-overwrite').onclick=()=>{if(!window.confirm('Overwrite the other tab’s local project with this tab’s version? This may discard its changes.'))return;try{lastStored=localStorage.getItem(STORAGE);setStorageConflict(false);enqueueSave();}catch(e){notice(e.message);}};
 window.addEventListener('blur',()=>{pendingTouchTap=null;touchContacts.clear();touchBlocked=false;if(drag)cancelDrag();if(draftStart||draftPoints.length||draftNode){clearDraft();scheduleRender();}});
 document.addEventListener('visibilitychange',()=>{
  // A gesture in progress has not committed an undoable transaction. Do not
  // allow autosave or tab switching to preserve its temporary coordinates.
  if(document.visibilityState==='hidden'){pendingTouchTap=null;touchContacts.clear();touchBlocked=false;if(drag)cancelDrag();if(draftStart||draftPoints.length||draftNode){clearDraft();scheduleRender();}if(dirty&&!storageConflict)persistNow();}
 });
 // Browser teardown may not wait for an asynchronous lock; use the original
 // compare-and-write as a last-chance, explicitly non-atomic backup attempt.
 window.addEventListener('pagehide',()=>{if(dirty&&!storageConflict)commitLatest();});
 window.addEventListener('storage',e=>{
  // StorageEvents are queued asynchronously; their newValue may describe an
  // obsolete intermediate write. Read the latest storage value rather than
  // making a conflict decision from that stale event payload. Handle clear().
  if(e.key!==STORAGE&&e.key!==null)return;
  let latest;
  try{latest=localStorage.getItem(STORAGE);}catch(err){setStorageConflict(true);saveStatus('Cannot read latest local project · autosave paused');return;}
  if(latest===lastStored)return;
  if(latest===JSON.stringify(doc)){
   lastStored=latest;clearTimeout(saveTimer);dirty=false;setStorageConflict(false);saveStatus('Same project synchronized');
  }else setStorageConflict(true);
 });
 $('zoom-out').onclick=()=>{if(drag)cancelDrag();view.scale=Math.max(5,view.scale/1.3);render();};$('zoom-in').onclick=()=>{if(drag)cancelDrag();view.scale=Math.min(1000,view.scale*1.3);render();};$('zoom-reset').onclick=()=>{if(drag)cancelDrag();view={cx:0,cy:0,scale:48};render();};$('fit').onclick=fit;
 const mobile=window.matchMedia('(max-width:700px)');
 const refreshPanelWidths=setupPanelResizing(mobile);
 const propertyLayout=setupPropertiesLayout(mobile);
 function syncPanelButtons(){
  $('left-collapse').textContent=mobile.matches?(document.body.classList.contains('mobile-left-open')?'×':'›'):(document.body.classList.contains('left-collapsed')?'›':'‹');
  $('right-collapse').textContent=mobile.matches?(document.body.classList.contains('mobile-right-open')?'×':'‹'):(document.body.classList.contains('right-collapsed')?'‹':'›');
  $('left-collapse').setAttribute('aria-expanded',String(mobile.matches?document.body.classList.contains('mobile-left-open'):!document.body.classList.contains('left-collapsed')));
  $('right-collapse').setAttribute('aria-expanded',String(mobile.matches?document.body.classList.contains('mobile-right-open'):!document.body.classList.contains('right-collapsed')));
  refreshPanelWidths();
 }
 $('left-collapse').onclick=()=>{if(mobile.matches){document.body.classList.toggle('mobile-left-open');document.body.classList.remove('mobile-right-open');}else document.body.classList.toggle('left-collapsed');syncPanelButtons();};
 $('right-collapse').onclick=()=>{if(mobile.matches){document.body.classList.toggle('mobile-right-open');document.body.classList.remove('mobile-left-open');}else document.body.classList.toggle('right-collapsed');syncPanelButtons();};
 mobile.addEventListener('change',()=>{document.body.classList.remove('mobile-left-open','mobile-right-open');syncPanelButtons();});syncPanelButtons();

 const resize=new ResizeObserver(()=>{const b=svg.getBoundingClientRect();size={w:Math.max(1,Math.round(b.width)),h:Math.max(1,Math.round(b.height))};scheduleRender();});resize.observe(svg);
 // Toolbar height varies with font metrics, window width and localized labels.
 // Avoid hard-coded mobile drawer offsets that overlap the toolbar after wrapping.
 const bar=document.querySelector('.appbar'),barResize=new ResizeObserver(()=>{document.documentElement.style.setProperty('--appbar-height',`${bar.getBoundingClientRect().height}px`);propertyLayout.apply();});barResize.observe(bar);
 document.documentElement.style.setProperty('--appbar-height',`${bar.getBoundingClientRect().height}px`);renderAll();
}
initialise();
