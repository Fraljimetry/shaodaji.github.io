import {toggleIds,windowSelection,commonValue,compatibleObjects} from './selection.mjs';
import {canvasShortcut,shortcutForTool} from './keyboard_shortcuts.mjs';
import {TOOLS,STRAIGHT_TYPES,PRESETS,PRESET_MODULES,newDoc,upgradeRecoveredLegacyPalette,clone,append,appendPolygonEdges,appendDerivedShapeEdges,resizeRegularPolygon,isObjectVisible,get,position,points,remove,affected,snapPoint,focalEllipse,circumcircle,intersectStraightLines,intersectLineCircle,intersectCircles,circleGeometry,addPoint,createAnchored,createResolver,validateDoc,command,parseExpression,checkNewGeometry,guardAnchorMove,shapeVerticesFromPoints,finite,preserveInheritedPointSizes} from './model.mjs?cut=round38';
import {clipRay,smoothCurveSvg,freehandCurveSvg,smoothPath,closeFreehandStroke,nearestFreehandAttachment,worldBounds,pageRect,arrowCurve,regularPolygonVertices,arrowHeadPoints,clipInfiniteLine,formatCoordinate,fitSceneView,bboxOutsideViewport,circleOutsideViewport} from './geometry.mjs?cut=round38';
import {importTikzCd,exportTikzCd,canExportTikzCd} from './diagram.mjs?cut=round28';
import {sampleExplicitPlot,plotPath} from './plot.mjs';
import {parseParametric,parseImplicit,parseVectorField,parseComplexExpression,renameCurveParameter,validatePlotRegion,sampleVectorField,sampleDomainColors,sampleParametricPlot,sampleImplicitPlot} from './plot_modes.mjs';
import {mathReady,mathMetrics,renderLatexSvg,validateLatexInput} from './math_labels.mjs';
import {localizeUI,translated} from './i18n.mjs?cut=round29';
import {compareAndWrite,coordinateSave} from './storage.mjs';
import {tikzGeometryIssue,tikzPoint} from './export_fidelity.mjs?cut=round38';
import {nodeBox,layoutNodeLabel,edgeBetweenBoxes,plainNodeInkBox,boxEdgeToward} from './diagram_layout.mjs';
import {boxRect,routeDiagramEdge,pathData,labelOnPolyline,labelOnQuadratic,labelDragOffset,hookTailGeometry} from './diagram_routing.mjs?cut=round34';
import {optimizeGlobalArrowRoutes} from './diagram_global_routing.mjs';
import {createAnchorIndex,cycleSelection} from './anchor_index.mjs';
import {layoutPointLabels,createLabelLayoutCache} from './label_layout.mjs';
import {createPlotCache} from './plot_cache.mjs';
import {layoutMorphismLabels,strokeObstacleRectangles} from './morphism_label_layout.mjs?cut=round30';
import {PANEL_MIN, PANEL_MAX, CANVAS_MIN, COLLAPSED_RAIL, validPanelWidth, fitPanels} from './panel_sizes.mjs';
import {PROPERTY_DOCK_DEFAULT, normalizePropertiesLayout, fitDockPropertiesHeight} from './properties_layout.mjs?cut=round28';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const plotCache=createPlotCache();
const labelCache=createLabelLayoutCache();
const limitedPlotKeys=new Set();let plotLimitedInScene=false;
const glyph={select:'<path d="M5 3L5 22L10 16L14 23L17 21L13 14L21 13Z"/>',pan:'<path d="M12 2V22M2 12H22M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3"/>',point:'<circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/>',segment:'<path d="M3 20L21 4"/><circle cx="3" cy="20" r="2" fill="currentColor"/><circle cx="21" cy="4" r="2" fill="currentColor"/>',arrow:'<path d="M3 20L21 4M13 4h8v8"/>',circle:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',rectangle:'<path d="M3 17L17 20L20 6L6 3Z"/><circle cx="3" cy="17" r="2" fill="currentColor"/><circle cx="17" cy="20" r="2" fill="currentColor"/><circle cx="20" cy="6" r="2" fill="currentColor"/>',polygon:'<path d="M6 3L18 3L22 12L18 21L6 21L2 12Z"/><circle cx="6" cy="3" r="1.5" fill="currentColor"/><circle cx="18" cy="3" r="1.5" fill="currentColor"/><circle cx="22" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="21" r="1.5" fill="currentColor"/><circle cx="6" cy="21" r="1.5" fill="currentColor"/><circle cx="2" cy="12" r="1.5" fill="currentColor"/>',polyline:'<path d="M3 17L8 5L14 13L21 4"/><circle cx="3" cy="17" r="1.6" fill="currentColor"/><circle cx="8" cy="5" r="1.6" fill="currentColor"/><circle cx="14" cy="13" r="1.6" fill="currentColor"/><circle cx="21" cy="4" r="1.6" fill="currentColor"/>',freehand:'<path d="M2 20C8-6 12 30 22 3"/>',text:'<path d="M3 6V3h18v3M12 3v18M8 21h8"/>'};
glyph.parallelogram='<path d="M3 18L16 18L21 6L8 6Z"/><circle cx="3" cy="18" r="2" fill="currentColor"/><circle cx="16" cy="18" r="2" fill="currentColor"/><circle cx="21" cy="6" r="2" fill="currentColor"/>';
glyph.line='<path d="M3.5 20.5L20.5 3.5M3.5 14.5V20.5H9.5M14.5 3.5H20.5V9.5"/><circle cx="7.5" cy="16.5" r="2" fill="currentColor" stroke="none"/><circle cx="16.5" cy="7.5" r="2" fill="currentColor" stroke="none"/>';glyph.ellipse='<ellipse cx="12" cy="12" rx="9" ry="8"/><circle cx="8" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>'; glyph.bezier='<path d="M4 19C5 6 19 6 20 19"/><circle cx="4" cy="19" r="2" fill="currentColor"/><circle cx="20" cy="19" r="2" fill="currentColor"/>';glyph.regularPolygon='<path d="M12 3L20.56 9.22L17.29 19.28L6.71 19.28L3.44 9.22Z"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="3" r="2" fill="currentColor" stroke="none"/>';glyph.angle='<path d="M3.5 5L8.5 19H21M7 14.8Q10.6 13.8 12.6 19"/><circle cx="3.5" cy="5" r="2" fill="currentColor"/><circle cx="8.5" cy="19" r="2" fill="currentColor"/><circle cx="21" cy="19" r="2" fill="currentColor"/>';glyph.node='<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M8 12h8"/>';glyph.morphism='<rect x="2" y="8.5" width="5" height="7"/><rect x="17" y="8.5" width="5" height="7"/><path d="M9 12H15M12 9l3 3-3 3"/>'; 
glyph.arrow='<path d="M3 20L21 4M13 4h8v8"/><circle cx="3" cy="20" r="2" fill="currentColor"/><circle cx="21" cy="4" r="2" fill="currentColor"/>';
glyph.bezier='<path d="M3 19C5 4 19 4 21 19"/><path d="M3 19L5 4M19 4L21 19" stroke-dasharray="2 2"/><circle cx="3" cy="19" r="2" fill="currentColor"/><circle cx="5" cy="4" r="2" fill="currentColor"/><circle cx="19" cy="4" r="2" fill="currentColor"/><circle cx="21" cy="19" r="2" fill="currentColor"/>';
glyph.midpoint='<path d="M3 19L21 5"/><circle cx="3" cy="19" r="2" fill="currentColor"/><circle cx="21" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>';
glyph.ray='<path d="M4 19L21 3m-7 0h7v7"/><circle cx="4" cy="19" r="2" fill="currentColor" stroke="none"/><circle cx="12.5" cy="11" r="2" fill="currentColor" stroke="none"/>'; 
glyph.perpBisector='<path d="M4 12H20M12 3V21"/><path d="M12 15H15V12"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="2" fill="currentColor" stroke="none"/>'; 
glyph.circleDiameter='<circle cx="12" cy="12" r="8"/><path d="M4 12H20"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="2" fill="currentColor" stroke="none"/>'; 
glyph.circleThrough3='<circle cx="12" cy="12" r="9"/><circle cx="12" cy="3" r="2" fill="currentColor"/><circle cx="21" cy="12" r="2" fill="currentColor"/><circle cx="3" cy="12" r="2" fill="currentColor"/>';
glyph.triangle='<path d="M12 3L21 20H3Z"/><circle cx="12" cy="3" r="2" fill="currentColor"/><circle cx="21" cy="20" r="2" fill="currentColor"/><circle cx="3" cy="20" r="2" fill="currentColor"/>';
glyph.spline='<path d="M3 19Q7 2 12 12T21 4"/><circle cx="3" cy="19" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="21" cy="4" r="2" fill="currentColor"/>';
glyph.closedSpline='<path d="M4 18C1 14 3 8 8 8C11 8 11 2 15 4C18 5 21 9 20 12C19 15 23 19 18 20C13 23 9 18 4 18Z"/><circle cx="4" cy="18" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="4" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="2" fill="currentColor" stroke="none"/>'; 
glyph.quadrilateral='<path d="M3 4L21 5L12 11L5 21Z"/><circle cx="3" cy="4" r="2" fill="currentColor"/><circle cx="21" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="11" r="2" fill="currentColor"/><circle cx="5" cy="21" r="2" fill="currentColor"/>';
// A fixed, keyboard-operable palette only changes ordinary document colors.
// Custom hues remain available via native <input type=color> controls.
const COMMON_COLORS=[
 ['Ink','#111827'],['White','#ffffff'],['Gray','#94a3b8'],
 ['Red','#ef4444'],['Orange','#f97316'],['Yellow','#eab308'],
 ['Green','#22c55e'],['Cyan','#48b6c8'],['Blue','#3b82f6'],
 ['Purple','#a855f7']
];
function syncColorSwatches(){
 for(const group of document.querySelectorAll('[data-color-swatches]')){
  const role=group.dataset.colorSwatches,property=group.dataset.colorProperty;
  const value=role==='default'?doc.settings[property]:role==='bulk'?commonValue(compatibleObjects(activeSelection(),property),property):get(doc,selected)?.style?.[property];
  if(typeof value!=='string')continue;
  for(const button of group.querySelectorAll('button[data-color]'))
   button.setAttribute('aria-pressed',String(button.dataset.color===value.toLowerCase()));
  // The property pane may keep keyboard focus after a transaction; update its
  // live picker without replacing the focused swatch or invalidating handlers.
  if(role==='object'||role==='bulk'){
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
glyph.parallelThrough='<path d="M2 7L22 7M2 18L22 18"/><circle cx="12" cy="18" r="2" fill="currentColor"/>';
glyph.perpendicularThrough='<path d="M2 18H22M12 2V22M12 15H15V18"/><circle cx="12" cy="7" r="2" fill="currentColor" stroke="none"/>';
glyph.circleCircleIntersection='<circle cx="8" cy="12" r="7"/><circle cx="16" cy="12" r="7"/><circle cx="12" cy="6.26" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="17.74" r="2" fill="currentColor" stroke="none"/>';
glyph.circleIntersection='<circle cx="12" cy="12" r="8"/><path d="M2 20L22 4"/><circle cx="5.753" cy="16.998" r="2" fill="currentColor" stroke="none"/><circle cx="18.247" cy="7.002" r="2" fill="currentColor" stroke="none"/>';
glyph.intersection='<path d="M3 3L21 21M21 3L3 21"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>';
const toolGroups={
 'basic-tools':[['select','Move'],['pan','Pan']],
 'construction-tools':[['point','Point'],['midpoint','Midpoint'],['segment','Segment'],['ray','Ray'],['arrow','Vector'],['line','Line'],['perpBisector','Perpendicular bisector'],['parallelThrough','Parallel through point'],['perpendicularThrough','Perpendicular through point'],['intersection','Intersection point'],['circleIntersection','Line–circle intersections'],['angle','Angle'],['circle','Circle'],['circleDiameter','Diameter circle'],['circleThrough3','3-point circle'],['circleCircleIntersection','Circle–circle intersections'],['ellipse','Ellipse'],['rectangle','Rectangle'],['parallelogram','Parallelogram'],['triangle','Triangle'],['quadrilateral','Quadrilateral'],['polygon','Polygon'],['regularPolygon','Regular polygon'],['polyline','Polyline'],['bezier','Bézier'],['spline','Spline'],['closedSpline','Closed spline'],['freehand','Free curve']],
 'diagram-tools':[['node','Diagram node'],['morphism','Morphism'],['text','Text']]
};
// An interface-only visibility preference: advanced tools remain functional in
// existing projects and are never lost from JSON, undo history or SVG export.
const ESSENTIAL_GEOMETRY=new Set(['point','segment','arrow','line','angle','circle','ellipse','rectangle','parallelogram','polygon','regularPolygon','polyline','bezier','spline','freehand']);
const geometryCategories=[
 {id:'points-lines',title:'Points & lines',tools:['point','midpoint','segment','ray','arrow','line','perpBisector','parallelThrough','perpendicularThrough','intersection','circleIntersection','angle']},
 {id:'circles-conics',title:'Circles & conics',tools:['circle','circleDiameter','circleThrough3','circleCircleIntersection','ellipse']},
 {id:'polygons',title:'Polygons',tools:['rectangle','parallelogram','triangle','quadrilateral','polygon','regularPolygon']},
 {id:'curves',title:'Curves',tools:['polyline','bezier','spline','closedSpline','freehand']}
];
const touchContacts=new Set();let touchBlocked=false,pendingTouchTap=null;
let currentMorphismLabels=new Map();
const selectedIds=new Set();
let gridSnapOverride=null; // transient tool-context preference, never written into project JSON
let draftReference=null,trash=[],doc=newDoc(),selected=null,tool='select',drag=null,draftStart=null,draftPoints=[],hover=null,view={cx:0,cy:0,scale:48},size={w:900,h:600},history=[],future=[],saveTimer=null,dirty=false,lastRender=0,frame=0,draftNode=null,lastStored=null,storageConflict=false,documentRevision=0,documentGeneration=0;
const STORAGE='mathillustrator-project-v1',SETTINGS='mathillustrator-ui-v1',TRASH='mathillustrator-trash-v1';
/** Existing editor choice wins; otherwise follow the site theme key when present. */
function initialSiteTheme(){
 try{const own=JSON.parse(localStorage.getItem(SETTINGS)||'{}').theme;if(['light','dark'].includes(own))return own;}catch{}
 for(const name of ['theme','site-theme','shaodaji-theme','shaodaji_theme']){
  try{const raw=localStorage.getItem(name);if(raw){const value=raw.replace(/^\"|\"$/g,'').toLowerCase();if(['dark','light'].includes(value))return value;}}catch{}
 }
 return 'dark'; // The site's default navy appearance; the user's explicit choice remains authoritative.
}
let uiPrefs={language:'en',font:'system',autoPan:true,sections:[],geometryGroups:[],collapsed:{},essentialGeometry:true};
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
function activeSelection(){
 // Reconcile stale ids after import, undo, deletion and project replacement.
 const ids=new Set(doc.objects.map(o=>o.id));
 for(const id of selectedIds)if(!ids.has(id))selectedIds.delete(id);
 if(selected&&ids.has(selected))selectedIds.add(selected);
 if(!selectedIds.has(selected))selected=[...selectedIds].at(-1)||null;
 return doc.objects.filter(o=>selectedIds.has(o.id));
}
function setSelection(ids,primary=null){
 const available=new Set(doc.objects.map(o=>o.id));
 selectedIds.clear();
 for(const id of ids)if(available.has(id))selectedIds.add(id);
 selected=primary&&selectedIds.has(primary)?primary:[...selectedIds].at(-1)||null;
 renderList();renderProperties();localizeUI($('properties'),uiPrefs.language);scheduleRender();
}
function selectToggle(id){
 if(!id)return;
 const next=toggleIds(selectedIds,id);
 setSelection(next,next.has(id)?id:(selected!==id?selected:null));
}
function recordUndo(before){
 history.push(before);let evicted=false;
 const bytes=()=>history.reduce((sum,s)=>sum+s.length*2,0);
 while(history.length>80||(history.length>1&&bytes()>30*1024*1024)){history.shift();evicted=true;}
 if(evicted)notice('Older undo states were evicted to limit memory use.');
 future=[];syncHistory();
}
function syncHistory(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function restore(s){doc=validateDoc(JSON.parse(s));documentRevision++;documentGeneration++;selected=null;activeSelection();clearDraft();enqueueSave();renderAll();}
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
 const old=JSON.stringify(doc),previousSelected=selected,previousIds=new Set(selectedIds),beforeDoc=doc;
 // A rejected edit rolls back JSON but does not replace the *logical* project.
 // The still-focused controls must be able to resolve their live object by ID
 // until the deferred property-pane refresh. A genuinely new/imported project
 // instead increments documentGeneration, invalidating all old controls.
 try{mutator();validateDoc(doc);}catch(e){doc=JSON.parse(old);selected=previousSelected;selectedIds.clear();for(const id of previousIds)selectedIds.add(id);notice(e.message);if(renderCanvas)refreshAfterMutation(true);else syncSettings();return false;}
 const replaced=doc!==beforeDoc;
 if(replaced){documentGeneration++;selectedIds.clear();selected=null;clearDraft();}
 else {
  for(const id of selectedIds)if(!get(doc,id))selectedIds.delete(id);
  if(selected!==previousSelected&&selected&&get(doc,selected)){
   selectedIds.clear();selectedIds.add(selected); // A newly made or explicitly switched primary object.
  }
  activeSelection();
 }
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
 if(o.type==='parametric')return `x(${o.parameter||'u'}) = ${o.xExpr}; y(${o.parameter||'v'}) = ${o.yExpr}, [${o.tMin}, ${o.tMax}]`;
 if(o.type==='vectorField')return `(${o.xExpr}, ${o.yExpr}), ${o.density} arrows across x`;
 if(o.type==='domainColoring')return `F(z) = ${o.expr}`;
 if(o.type==='implicit')return o.expr.includes('=')?o.expr:`${o.expr} = 0`;
 if(o.type==='circleThrough3')return 'circle through 3 points';
 if(o.type==='perpBisector')return 'perpendicular bisector';
 if(o.type==='parallelThrough')return 'parallel to '+(nameById?.get(o.refs?.[1])||'line');
 if(o.type==='perpendicularThrough')return 'perpendicular to '+(nameById?.get(o.refs?.[1])||'line');
 if(o.type==='circleCircleIntersection')return 'circle-circle intersection '+(o.branch===-1?'−':'+')+' of '+(o.refs||[]).map(id=>nameById?.get(id)||'?').join(' and ');
 if(o.type==='circleIntersection')return 'circle intersection '+(o.branch===-1?'−':'+')+' of '+(o.refs||[]).map(id=>nameById?.get(id)||'?').join(' and ');
 if(o.type==='intersection')return 'intersection of '+(o.refs||[]).map(id=>nameById?.get(id)||'?').join(' and ');
 if(o.type==='spline')return o.closed?'closed spline':'spline';
 if(o.type==='ray')return 'ray';
 if(o.type==='regularPolygon')return `Regular polygon · ${o.sides} sides`;
 if(o.type==='parallelogram')return 'parallelogram · 3 defining vertices';
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
function attr(o,selectHighlight=false){return {stroke:o.style?.stroke||'#000000','stroke-width':Math.max(.15,Number(o.style?.width)||2)+(selectHighlight?0.6:0),fill:o.style?.fill||'none',opacity:o.style?.opacity??1};}
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
/** The visible object, not its invisible selectable hit rectangle, determines
 * morphism endpoints. When a node has a border the border is the object;
 * otherwise the target is its mathematical/plain text glyphs. */
function arrowTargetBox(o){
 if(o.nodeBorder)return labelBox(o);
 if(o.textMode==='latex'&&mathReady()){
  try{const m=mathMetrics(o.text,o.fontSize||17);return {width:Math.max(4,m.width),height:Math.max(4,m.height)};}
  catch{return labelBox(o);}
 }
 return plainNodeInkBox(o.text,o.fontSize||17);
}
/** Iterate clip points with the quadratic control tangent, rather than
 * clipping a curved arrow to the irrelevant node-center line. All paths and
 * exports consume the same normalized endpoint pair. For bends=0 the exact
 * straight-routing result is retained. */
function curveEndpointRoute(from,to,fromBox,toBox,route,bend){
 if(!route?.points||route.points.length!==2||!bend)return route;
 let [start,end]=route.points;
 for(let i=0;i<4;i++){
  const curve=arrowCurve(start,end,bend);
  if(!curve)break;
  const s=boxEdgeToward(from,curve.control,fromBox,4),t=boxEdgeToward(to,curve.control,toBox,4);
  if(!s||!t||Math.hypot(s[0]-t[0],s[1]-t[1])<7)break;
  start=s;end=t;
 }
 return {...route,points:[start,end]};
}
function latexDisplay(o,x,y,fontSize,{anchor='start',vertical='baseline',color=o.style.stroke,opacity=o.style.opacity,exporting=false}={}){
 if(o.textMode!=='latex')return null;
 try{return renderLatexSvg(o.text,x,y,fontSize,{anchor,vertical,color,opacity});}
 catch(error){if(exporting)throw Error('Cannot export LaTeX label "'+o.name+'": '+error.message);
  return el('text',{x,y,fill:'#b45309','font-size':12,'pointer-events':'none'},'⚠ TeX');}
}
/** A single anchor rule shared by displayed-label layout, canvas and SVG export.
 * Do not use raw SVG bounding boxes: they depend on frame-specific DOM state. */
function geometryLabelAnchor(o,resolver){
 if(o.type==='function'){
  try{const y=parseExpression(o.expr)(view.cx);return Number.isFinite(y)?project([view.cx,y]):null;}catch{return null;}
 }
 if(o.type==='parametric'){try{return project(parseParametric(o.xExpr,o.yExpr,o.parameter)((o.tMin+o.tMax)/2));}catch{return null;}}
 if(o.type==='implicit')return null;
 if(['vectorField','domainColoring'].includes(o.type))return project([(o.region.xMin+o.region.xMax)/2,(o.region.yMin+o.region.yMax)/2]);
 if(o.type==='freehand')return o.path?.length?project(o.path[Math.floor(o.path.length/2)]):null;
 if(['parallelThrough','perpendicularThrough'].includes(o.type)){
  const line=resolver.line(o);return line?project(line.a):null;
 }
 const p=resolver.points(o);
 if(!p.length||!p.every(Boolean))return null;
 if(o.type==='ellipse'&&p.length===3)return project([(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2]);
 if(o.type==='circle'||o.type==='regularPolygon')return project(p[0]);
 if(['rectangle','parallelogram'].includes(o.type)){const vertices=shapeVerticesFromPoints(o.type,p);if(!vertices.length)return null;return project([vertices.reduce((v,q)=>v+q[0],0)/4,vertices.reduce((v,q)=>v+q[1],0)/4]);}
 return project([p.reduce((sum,pt)=>sum+pt[0],0)/p.length,p.reduce((sum,pt)=>sum+pt[1],0)/p.length]);
}
function renderObject(svg,o,resolver,exporting=false,labelPositions=null,diagramBoxes=null,morphismLabels=null,morphismRoutes=null){
 if(!isObjectVisible(doc,o,resolver.object))return;
 const isSel=(selectedIds.has(o.id)||selected===o.id)&&!exporting,sty=attr(o,isSel),p=resolver.points(o);
 const coords=p.every(Boolean)?p.map(project):null;
 // Avoid building large, fully offscreen SVG subtrees. This is deliberately
 // conservative: control-point hulls bound Béziers, and labels/node boxes are
 // excluded because they have their own independent pixel dimensions.
 const cullMargin=Math.max(28,(Number(o.style.width)||2)*2+12);
 if(coords&&['segment','arrow','polygon','polyline','bezier','angle'].includes(o.type)
   &&bboxOutsideViewport(coords,size.w,size.h,cullMargin))return;
 if(o.type==='circle'&&coords?.length===2&&circleOutsideViewport(coords[0],
    Math.hypot(coords[1][0]-coords[0][0],coords[1][1]-coords[0][1]),size.w,size.h,cullMargin))return;
 const mk=(tag,a)=>el(tag,{...sty,...a});let item=null;
 if(['point','midpoint','intersection','circleIntersection','circleCircleIntersection'].includes(o.type)){
  const pt=resolver.at(o.id);if(!pt)return;const [x,y]=project(pt);
  const radius=Number(o.style.pointSize??doc.settings.pointSize)||5;
  const displayedLabel=o.pointLabel||o.name;
  const reach=doc.settings.showLabels?Math.max(50,displayedLabel.length*14+18):0;
  // Offscreen point culling preserves visible labels that reach into the frame.
  if(x < -radius-reach || x > size.w+radius || y < -radius-22 || y > size.h+radius+22)return;
  item=el('circle',{cx:x,cy:y,r:radius,stroke:o.style.stroke,fill:o.style.stroke,'stroke-width':1,opacity:sty.opacity});
  if(doc.settings.showLabels){const label=labelPositions?.get(o.id),lx=label?.x??x+8,ly=label?.y??y-9;
   if(o.pointLabel&&o.pointLabelMode==='latex')svg.append(latexDisplay({ ...o,text:displayedLabel,textMode:'latex' },lx,ly,12,{anchor:label?.anchor||'start',exporting}));
   else svg.append(el('text',{'xml:space':'preserve',x:lx,y:ly,'text-anchor':label?.anchor||'start','font-size':12,'font-family':'Arial, sans-serif',fill:o.style.stroke,opacity:sty.opacity,'pointer-events':'none'},displayedLabel));}
 }else if(['segment','arrow','line','ray','perpBisector','parallelThrough','perpendicularThrough'].includes(o.type)){
  const line=resolver.line(o);if(!line)return;
  let a=project(line.a),b=project([line.a[0]+line.d[0]*line.length,line.a[1]+line.d[1]*line.length]);
  if(line.domain==='infinite'){
   const clipped=clipInfiniteLine(a,b,size.w,size.h);
   if(!clipped)return;[a,b]=clipped;
  }else if(line.domain==='ray'){
   const clipped=clipRay(a,b,size.w,size.h);
   if(!clipped)return;[a,b]=clipped;
  }
  if(o.type==='arrow'){
   const head=arrowHeadPoints(b,a,o.style.width);
   item=el('g');item.append(mk('path',{d:`M${a.join(' ')} L${b.join(' ')}`,fill:'none'}));
   if(head.length)item.append(el('polygon',{class:'arrowhead',points:head.map(q=>q.join(',')).join(' '),fill:o.style.stroke,opacity:sty.opacity,'pointer-events':'none'}));
  }else item=mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'});
 }else if(o.type==='circle'&&coords?.length===2){item=mk('circle',{cx:coords[0][0],cy:coords[0][1],r:Math.hypot(coords[1][0]-coords[0][0],coords[1][1]-coords[0][1]),fill:'none'});
  }else if(o.type==='circleThrough3'&&p.length===3&&p.every(Boolean)){
  const circ=circumcircle(p);if(!circ)return;
  const [cx,cy]=project(circ.center),radius=circ.radius*view.scale;
  if(circleOutsideViewport([cx,cy],radius,size.w,size.h,cullMargin))return;
  item=mk('circle',{cx,cy,r:radius,fill:'none'});
 }else if(o.type==='ellipse'&&p.length===3&&p.every(Boolean)){
  const f=focalEllipse(p);if(!f)return;
  const outerX=Math.hypot(f.rx*Math.cos(f.angle),f.ry*Math.sin(f.angle))*view.scale;
  const outerY=Math.hypot(f.rx*Math.sin(f.angle),f.ry*Math.cos(f.angle))*view.scale;
  const [cx,cy]=project([f.cx,f.cy]);
  if(bboxOutsideViewport([[cx-outerX,cy-outerY],[cx+outerX,cy+outerY]],size.w,size.h,cullMargin))return;
  item=mk('ellipse',{cx,cy,rx:f.rx*view.scale,ry:f.ry*view.scale,
   transform:`rotate(${-f.angle*180/Math.PI} ${cx} ${cy})`,'fill-opacity':.20});
 }else if(o.type==='ellipse'&&coords?.length===2){
  const a=coords[0],b=coords[1],rx=Math.abs(a[0]-b[0])/2,ry=Math.abs(a[1]-b[1])/2;
  // Render historical v1 flattened ellipses as their limiting line, not invisible SVG ellipses.
  item=rx<1e-7||ry<1e-7 ?mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'})
   :mk('ellipse',{cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2,rx,ry,'fill-opacity':.20});
 }else if(['rectangle','parallelogram'].includes(o.type)&&p.every(Boolean)){
  const vertices=shapeVerticesFromPoints(o.type,p).map(project);
  if(vertices.length&&bboxOutsideViewport(vertices,size.w,size.h,cullMargin))return;
  if(vertices.length)item=mk('polygon',{points:vertices.map(q=>q.join(',')).join(' '),'fill-opacity':.24});
 }else if(['polygon','polyline'].includes(o.type)&&coords?.length>=2){item=mk(o.type==='polygon'?'polygon':'polyline',{points:coords.map(q=>q.join(',')).join(' '),fill:o.type==='polygon'?sty.fill:'none','fill-opacity':.24});
 }else if(o.type==='regularPolygon'&&p.length===2&&p.every(Boolean)){const vertices=regularPolygonVertices(p[0],p[1],o.sides).map(project);if(bboxOutsideViewport(vertices,size.w,size.h,cullMargin))return;if(vertices.length)item=mk('polygon',{points:vertices.map(q=>q.join(',')).join(' '),'fill-opacity':.24});
 }else if(o.type==='spline'&&coords?.length>=3){item=mk('path',{d:smoothCurveSvg(coords,!!o.closed),fill:'none'});
 }else if(o.type==='bezier'&&coords?.length===4){item=mk('path',{d:`M${coords[0].join(' ')} C${coords[1].join(' ')},${coords[2].join(' ')},${coords[3].join(' ')}`,fill:'none'});
 }else if(o.type==='angle'&&coords?.length===3){const [a,b,c]=coords,r=26,theta1=Math.atan2(a[1]-b[1],a[0]-b[0]),theta2=Math.atan2(c[1]-b[1],c[0]-b[0]);let delta=(theta2-theta1+Math.PI*2)%(Math.PI*2);if(delta>Math.PI)delta-=2*Math.PI;const start=[b[0]+r*Math.cos(theta1),b[1]+r*Math.sin(theta1)],end=[b[0]+r*Math.cos(theta1+delta),b[1]+r*Math.sin(theta1+delta)];item=mk('path',{d:`M${start.join(' ')} A${r} ${r} 0 0 ${delta>0?1:0} ${end.join(' ')}`,fill:'none'});
 }else if(o.type==='freehand'&&o.path?.length>1){const pathCoords=o.path.map(project);if(bboxOutsideViewport(pathCoords,size.w,size.h,cullMargin))return;item=mk('path',{d:freehandCurveSvg(pathCoords,!!o.closed),fill:'none','stroke-linejoin':'round','stroke-miterlimit':3,'stroke-linecap':'round'});
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
  const fromBox=arrowTargetBox(fromNode),toBox=arrowTargetBox(toNode);
  const auto=['avoid','avoid-crossings','scene-crossings'].includes(o.routing);
  const route=morphismRoutes?.get(o.id);
  if(!route)return; // Route was validated and frozen for this render in document order.
  if(!route.points.length)return; // Historical overlapping boxes retain semantic edge but have no drawable path.
  const a=route.points[0],b=route.points.at(-1),curve=auto?null:arrowCurve(a,b,o.bend||0);
  if(!auto&&!curve)return;
  const routed=route.status==='routed';
  const hook=['hook','hook-dashed'].includes(o.arrowStyle)?hookTailGeometry(a,auto?route.points[1]:curve.control,!!o.swap):null;
  const pathStart=hook?.shaftStart||a;
  const d=auto?pathData(hook?[pathStart,...route.points.slice(1)]:route.points):`M${pathStart[0].toFixed(2)} ${pathStart[1].toFixed(2)} Q${curve.control[0].toFixed(2)} ${curve.control[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
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
  if(hook)item.append(mk('path',{class:'morphism-tail-hook',d:hook.d,fill:'none','stroke-linecap':'round'}));
  if(o.arrowStyle==='tail'){const from=auto?route.points[1]:curve.control;const len=Math.hypot(from[0]-a[0],from[1]-a[1]);if(len>1){const ux=(from[0]-a[0])/len,uy=(from[1]-a[1])/len;item.append(mk('line',{x1:a[0]-uy*6,y1:a[1]+ux*6,x2:a[0]+uy*6,y2:a[1]-ux*6}));}}
  if(o.arrowStyle==='twohead'){const first=arrowHeadPoints(a,auto?route.points[1]:curve.control,o.style.width);if(first.length)item.append(el('polygon',{points:first.map(q=>q.join(',')).join(' '),fill:o.style.stroke,'pointer-events':'none'}));}
  if(head.length)item.append(el('polygon',{class:'arrowhead',points:head.map(q=>q.join(',')).join(' '),fill:blocked?'#b45309':o.style.stroke,opacity:sty.opacity,'pointer-events':'none'}));
  if(o.text){const t=o.labelT??.5,distance=o.labelDistance??17,dx=o.labelDx??0,dy=o.labelDy??0;
   const pos=auto?labelOnPolyline(route.points,t,distance,!!o.swap,dx,dy):labelOnQuadratic(a,curve.control,b,t,distance,!!o.swap,dx,dy);
   if(pos){const placed=morphismLabels?.get(o.id),[lx,ly]=placed?[placed.x,placed.y]:pos;
    if(placed?.status==='crowded'){item.setAttribute('data-label-collision','unresolved');
     item.append(el('title',{},'Label collision remains: no clear location among the supported candidates. Adjust the label manually.'));}
    const label=o.textMode==='latex'?latexDisplay(o,lx,ly,15,{anchor:'middle',color:placed?.status==='crowded'?'#b45309':o.style.stroke,exporting})
      :el('text',{'xml:space':'preserve',x:lx,y:ly,'font-size':15,'font-family':o.fontFamily||'Georgia, serif','text-anchor':'middle',fill:placed?.status==='crowded'?'#b45309':o.style.stroke,'paint-order':'stroke','stroke':exporting&&doc.settings.exportTransparent?'none':doc.settings.background,'stroke-width':4,opacity:sty.opacity});
    if(o.textMode!=='latex')appendTextLines(label,o.text,lx,ly,15,{centered:true});
    label.classList.add('morphism-label');
    label.dataset.id=o.id; // Preserve object identity after hoisting labels above other SVG elements.
    item.append(label);
    if(!exporting&&!o.locked&&tool==='select'){
     // The drawn glyph can contain unpainted holes (e.g. \varphi). A transparent
     // hit box across its real text bounds makes the visible label draggable
     // directly, with no separate circle or exported editing artifact.
     const metrics=o.textMode==='latex'?mathMetrics(o.text,15):null;
     const w=Math.max(12,metrics?.width??Math.min(400,o.text.length*8.5));
     const h=Math.max(16,metrics?.height??18);
     const top=metrics?ly-metrics.ascent:ly-14;
     const hit=el('rect',{x:lx-w/2-4,y:top-4,width:w+8,height:h+8,
      fill:'transparent','pointer-events':'all','data-id':o.id,'data-label-handle':o.id,
      'aria-label':'Drag arrow label'});
     hit.style.cursor='move';item.append(hit);
    }
   }
  }
 }else if(['function','parametric','implicit'].includes(o.type)){
  const key=JSON.stringify([o.type,o.expr,o.xExpr,o.yExpr,o.tMin,o.tMax,doc.settings.plotQuality,doc.settings.plotBudget,doc.settings.implicitGrid,view.cx,view.cy,view.scale,size.w,size.h]);
  const path=plotCache.get(key,()=>{
   const options={quality:doc.settings.plotQuality,maxEvaluations:doc.settings.plotBudget??80000};
   const plot=o.type==='function'?sampleExplicitPlot(parseExpression(o.expr),px=>unproject(px,0)[0],y=>project([0,y])[1],size.w,size.h,options):
    o.type==='parametric'?sampleParametricPlot(parseParametric(o.xExpr,o.yExpr,o.parameter),o.tMin,o.tMax,project,options):
    sampleImplicitPlot(parseImplicit(o.expr),px=>unproject(px,0)[0],py=>unproject(0,py)[1],size.w,size.h,{...options,cellPx:doc.settings.implicitGrid??12});
   if(plot.limited){limitedPlotKeys.add(key);while(limitedPlotKeys.size>32)limitedPlotKeys.delete(limitedPlotKeys.values().next().value);}
   else limitedPlotKeys.delete(key);
   return plotPath(plot.segments);
  });
  if(limitedPlotKeys.has(key))plotLimitedInScene=true;
  item=mk('path',{d:path,fill:'none'});

 }else if(o.type==='vectorField'){
  const region=o.region,options={density:o.density,normalized:o.normalized,maxEvaluations:doc.settings.plotBudget};
  const result=sampleVectorField(parseVectorField(o.xExpr,o.yExpr),region,options);
  if(result.limited)plotLimitedInScene=true;
  const parts=[];
  for(const arrow of result.arrows){
   const a=project(arrow.start),b=project(arrow.end),len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(len<1||!Number.isFinite(len)||len>1e5)continue;
   const dx=(b[0]-a[0])/len,dy=(b[1]-a[1])/len,h=Math.min(9,Math.max(4,len*.28));
   parts.push(`M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}M${(b[0]-h*dx+h*.42*dy).toFixed(2)} ${(b[1]-h*dy-h*.42*dx).toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}L${(b[0]-h*dx-h*.42*dy).toFixed(2)} ${(b[1]-h*dy+h*.42*dx).toFixed(2)}`);
  }
  item=mk('path',{d:parts.join(''),fill:'none'});
 }else if(o.type==='domainColoring'){
  const region=o.region,key=JSON.stringify(['domainColoring',o.expr,region,o.resolution,o.colorMode,doc.settings.plotBudget]);
  const uri=plotCache.get(key,()=>{
   const result=sampleDomainColors(parseComplexExpression(o.expr),region,{resolution:o.resolution??128,mode:o.colorMode??'phase-modulus',maxEvaluations:doc.settings.plotBudget});
   if(result.limited){limitedPlotKeys.add(key);return '';}
   limitedPlotKeys.delete(key);
   const canvas=document.createElement('canvas');canvas.width=result.width;canvas.height=result.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:false});if(!ctx)throw Error('Browser canvas is unavailable for domain coloring.');
   const image=ctx.createImageData(result.width,result.height);image.data.set(result.rgba);ctx.putImageData(image,0,0);
   return canvas.toDataURL('image/png');
  });
  if(limitedPlotKeys.has(key))plotLimitedInScene=true;
  const a=project([region.xMin,region.yMax]),b=project([region.xMax,region.yMin]);
  item=el('image',{x:a[0],y:a[1],width:b[0]-a[0],height:b[1]-a[1],href:uri,opacity:o.style.opacity,preserveAspectRatio:'none'});
  // Domain coloring is raster content; do not apply the normal stroke/fill style.
 }
 if(!item)return;if(sty.opacity===0)item.setAttribute('pointer-events','none');item.dataset.id=o.id;item.classList.add('clickable');if(isSel)item.classList.add('selected-shape');svg.append(item);
 if(!exporting&&sty.opacity>0&&['segment','arrow','line','ray','perpBisector','parallelThrough','perpendicularThrough','freehand','polyline','spline','function','parametric','implicit','vectorField','bezier','angle','morphism'].includes(o.type)){
  const path=item.tagName.toLowerCase()==='g'?item.querySelector('path'):item;
  if(path){const hit=path.cloneNode(false);hit.removeAttribute('marker-end');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width',Math.max(12,Number(o.style.width)+8));hit.setAttribute('opacity','1');hit.setAttribute('fill','none');hit.dataset.id=o.id;svg.append(hit);}
 }
 // Optional geometric labels follow the referenced world anchors on every redraw.
 // SVG export uses the exact same path; project JSON stores only author text/mode.
 if(doc.settings.showLabels&&o.displayLabel&& !['point','midpoint','intersection','circleIntersection','circleCircleIntersection','node','morphism','text'].includes(o.type)){
  const anchor=geometryLabelAnchor(o,resolver);
  if(anchor&&anchor.every(Number.isFinite)&&anchor[0]>-250&&anchor[0]<size.w+250&&anchor[1]>-100&&anchor[1]<size.h+100){
   const placed=labelPositions?.get(o.id),[x,y]=placed?[placed.x,placed.y]:[anchor[0]+9,anchor[1]-10],mode=o.displayLabelMode||'plain';
   const label=mode==='latex'?latexDisplay({...o,text:o.displayLabel,textMode:'latex'},x,y,13,{anchor:placed?.anchor||'start',exporting})
    :el('text',{x,y,'text-anchor':placed?.anchor||'start','font-size':13,'font-family':'Arial, sans-serif',fill:o.style.stroke,opacity:sty.opacity,'pointer-events':'none'},o.displayLabel);
   if(label){label.setAttribute('pointer-events','none');label.setAttribute('class','geometry-display-label');svg.append(label);}
  }
 }
 // Label hit rectangles are raised after ALL objects have rendered, rather
 // than here: subsequent arrow/node strokes could otherwise obscure them.

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
   diagramBoxes.set(node.id,boxRect(project(center),arrowTargetBox(node)));
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
  const a=project(p[0]),b=project(p[1]),fb=arrowTargetBox(from),tb=arrowTargetBox(to);
  const mode=o.routing||'direct';
  const obstacles=mode!=='direct'&&diagramBoxes?[...diagramBoxes].filter(([id])=>!o.refs.includes(id)).map(([,rect])=>rect):[];
  const baseRoute=routeDiagramEdge(a,b,fb,tb,obstacles,mode==='scene-crossings'?'avoid':mode,mode==='avoid-crossings'?earlierArrowPaths:[]);
  const route=mode==='direct'?curveEndpointRoute(a,b,fb,tb,baseRoute,o.bend||0):baseRoute;
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
 if(doc.objects.some(o=>o.type==='morphism'&&!o.hidden&&o.style?.opacity!==0&&o.text&&o.labelAvoid!==false)){
  const nodeRects=[],nodeRectById=new Map(),entries=[];
  for(const o of doc.objects){if(o.type!=='node'||o.hidden||o.style?.opacity===0)continue;
   const pt=resolver.at(o.id);if(pt){const r=boxRect(project(pt),arrowTargetBox(o));nodeRects.push(r);nodeRectById.set(o.id,r);}
  }
  // All visible diagram arrows are physical obstacles for semantic labels.
  // Sample direct quadratic paths; routed polylines use their real waypoints.
  // Never reserve the full diagonal bounding box, which would falsely block
  // labels far away from a thin diagonal arrow.
  const obstacleBudget=3000;
  for(const edge of doc.objects){
   if(edge.type!=='morphism'||edge.hidden||edge.style?.opacity===0||nodeRects.length>=obstacleBudget)continue;
   const path=morphismRoutes.get(edge.id);
   if(!path?.points?.length)continue;
   let vertices=path.points;
   if(!['avoid','avoid-crossings','scene-crossings'].includes(edge.routing)){
    const a=vertices[0],b=vertices.at(-1),curve=arrowCurve(a,b,edge.bend||0);
    if(curve)vertices=Array.from({length:25},(_,i)=>{const t=i/24,q=1-t;return [q*q*a[0]+2*q*t*curve.control[0]+t*t*b[0],q*q*a[1]+2*q*t*curve.control[1]+t*t*b[1]];});
   }
   const boxes=strokeObstacleRectangles(vertices,Math.max(3,(edge.style?.width??2)/2+2),Math.min(128,obstacleBudget-nodeRects.length));
   nodeRects.push(...boxes);
  }
  // Text annotations are also visible diagram elements, not empty space.
  for(const annotation of doc.objects){
   if(annotation.type!=='text'||annotation.hidden||annotation.style?.opacity===0||nodeRects.length>=obstacleBudget)continue;
   const at=resolver.at(annotation.id);if(!at)continue;
   const [x,y]=project(at),b=labelBox(annotation);
   nodeRects.push({left:x-3,right:x+b.width+3,top:y-b.height-3,bottom:y+4});
  }
  for(const o of doc.objects){if(o.type!=='morphism'||o.hidden||o.style?.opacity===0||!o.text)continue;
   const p=resolver.points(o);if(!p.every(Boolean))continue;
   const from=resolver.object(o.refs[0]),to=resolver.object(o.refs[1]);
   if(!from||!to||from.hidden||to.hidden||from.style.opacity===0||to.style.opacity===0)continue;
   const a=project(p[0]),b=project(p[1]),fb=arrowTargetBox(from),tb=arrowTargetBox(to);
   const auto=['avoid','avoid-crossings','scene-crossings'].includes(o.routing);
   const route=morphismRoutes.get(o.id);if(!route?.points.length)continue;
   const begin=route.points[0],finish=route.points.at(-1),curve=auto?null:arrowCurve(begin,finish,o.bend||0);
   if(!auto&&!curve)continue;
   const t=o.labelT??.5,distance=o.labelDistance??17,dx=o.labelDx??0,dy=o.labelDy??0;
   const pos=auto?labelOnPolyline(route.points,t,distance,!!o.swap,dx,dy):labelOnQuadratic(begin,curve.control,finish,t,distance,!!o.swap,dx,dy);
   if(pos)entries.push({id:o.id,text:o.text,x:pos[0],y:pos[1],auto:o.labelAvoid!==false});
  }
  computedMorphismLabels=layoutMorphismLabels(entries,nodeRects,size.w,size.h);
 }
 // Optional screen-space point-label decluttering. Keep the exact same layout
 // in editor and SVG/raster export; never hide labels or change model text.
 let labels=null;
 if(doc.settings.showLabels&&doc.settings.labelPlacement==='avoid'){
  const build=()=>{
   const entries=[];
   for(const o of doc.objects){if(!['point','midpoint','intersection','circleIntersection','circleCircleIntersection'].includes(o.type)||o.hidden||o.style?.opacity===0)continue;
    const p=resolver.at(o.id);if(!p)continue;const [x,y]=project(p);
    if(x < -100||x > size.w+100||y < -100||y > size.h+100)continue;
    entries.push({id:o.id,x,y,text:o.pointLabel||o.name});
   }
   // Geometry display labels join the same collision budget as point labels;
   // new projects avoid text-to-text overlaps without changing author content.
   for(const o of doc.objects){
    if(o.hidden||o.style?.opacity===0||!o.displayLabel||['point','midpoint','intersection','circleIntersection','circleCircleIntersection','node','morphism','text'].includes(o.type))continue;
    const anchor=geometryLabelAnchor(o,resolver);
    if(!anchor||!anchor.every(Number.isFinite)||anchor[0]<-100||anchor[0]>size.w+100||anchor[1]<-100||anchor[1]>size.h+100)continue;
    entries.push({id:o.id,x:anchor[0],y:anchor[1],text:o.displayLabel});
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
 // Keep labels legible above subsequently painted diagram nodes and routes;
 // preserve the relative order of all authored labels. SVG export uses this
 // same painted order. Only the transparent handles are editor-only.
 for(const label of [...svg.querySelectorAll('.morphism-label')])svg.append(label);
 // Final hit targets are on top of every scene item, including other labels;
 // the actual LaTeX/plain glyphs are not obscured by any invisible stroke hit.
 if(!exporting&&tool==='select')for(const hit of [...svg.querySelectorAll('[data-label-handle]')])svg.append(hit);
 // Points are picked geometrically at pointerdown. No extra SVG circle per point:
 // avoids doubling the DOM and still selects points beneath later filled polygons.
 if(!exporting){const preview=draftPoints.length?draftPoints:(draftStart?[draftStart]:[]);
  if(preview.length&&hover){
   if(tool==='circleThrough3'&&draftPoints.length===2){
    const circ=circumcircle([...draftPoints,hover]);if(circ){const [cx,cy]=project(circ.center);svg.append(el('circle',{class:'draft-circle',cx,cy,r:circ.radius*view.scale,stroke:doc.settings.stroke,'stroke-width':1.5,'stroke-dasharray':'5 4',fill:'none','pointer-events':'none'}));}
   }else if(tool==='ellipse'&&draftPoints.length===2){
    const f=focalEllipse([...draftPoints,hover]);
    if(f){const [cx,cy]=project([f.cx,f.cy]);svg.append(el('ellipse',{class:'draft-ellipse',cx,cy,rx:f.rx*view.scale,ry:f.ry*view.scale,transform:`rotate(${-f.angle*180/Math.PI} ${cx} ${cy})`,stroke:doc.settings.stroke,'stroke-width':1.5,'stroke-dasharray':'5 4',fill:'none','pointer-events':'none'}));}
    for(const focus of draftPoints){const [x,y]=project(focus);svg.append(el('circle',{cx:x,cy:y,r:4,fill:doc.settings.stroke,'pointer-events':'none'}));}
   }else if(['rectangle','parallelogram'].includes(tool)&&draftPoints.length===2){
    const verts=shapeVerticesFromPoints(tool,[...draftPoints,hover]).map(project);
    if(verts.length)svg.append(el('polygon',{points:verts.map(q=>q.join(',')).join(' '),stroke:doc.settings.stroke,'stroke-width':1.5,'stroke-dasharray':'4 4',fill:'none','pointer-events':'none'}));
   }else{const pts=[...preview,hover].map(project);svg.append(el('polyline',{points:pts.map(p=>p.join(',')).join(' '),stroke:doc.settings.stroke,'stroke-width':1.5,'stroke-dasharray':'4 4',fill:'none','pointer-events':'none'}));}
  }
  // Live feedback uses the same a-priori correction as the committed stroke.
  // Drafts are never added to the document or the export SVG.
  if(drag?.kind==='marquee'){const m=drag;svg.append(el('rect',{class:'selection-marquee',x:Math.min(m.sx,m.ex),y:Math.min(m.sy,m.ey),width:Math.abs(m.ex-m.sx),height:Math.abs(m.ey-m.sy),'pointer-events':'none'}));}
  if(drag?.kind==='freehand'&&drag.path.length>1){
   const {prepared,begin,finish}=preparedFreehand(drag.path,drag.startAttachment);
   const pts=prepared.path.map(project);
   svg.append(el('path',{class:'draft-freehand',d:freehandCurveSvg(pts,prepared.closed),stroke:doc.settings.stroke,'stroke-width':doc.settings.width,opacity:doc.settings.opacity,fill:'none','stroke-linejoin':'round','stroke-miterlimit':3,'stroke-linecap':'round','pointer-events':'none'}));
   for(const target of [begin,finish])if(target){const [x,y]=project(target.world);svg.append(el('circle',{class:'freehand-snap-indicator',cx:x,cy:y,r:7,stroke:'#0d9488','stroke-width':2,fill:'none','pointer-events':'none'}));}
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
  (row?.querySelector('.object-menu-toggle')||$('object-search')).focus();}
}
function openObjectMenu(o,trigger){
 const menu=$('object-action-menu');if(objectMenuContext?.trigger===trigger){closeObjectMenu({restoreFocus:true});return;}
 closeObjectMenu();if(!currentObject(o))return;
 const generation=documentGeneration;
 objectMenuContext={id:o.id,object:o,trigger,generation};trigger.setAttribute('aria-expanded','true');
 menu.replaceChildren();menu.setAttribute('aria-label',`${translated('Object actions',uiPrefs.language)}: ${o.name}`);
 const actions=[['visibility',o.hidden?'Show':'Hide'],['lock',o.locked?'Unlock':'Lock'],['delete','Delete']];
 const paths={Hide:'<path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 5.2a10.9 10.9 0 0 1 2.1-.2c4.9 0 8.9 4.7 10 7a15 15 0 0 1-3.6 4.5M6 6.1C3.8 7.7 2.6 10 2 12c1.1 2.3 5.1 7 10 7 1.5 0 2.9-.4 4.1-1.1"/>',
  Show:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  Lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  Unlock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0"/>',
  Delete:'<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/>'};
 const blocked=[...affected(doc,o.id)].some(id=>get(doc,id)?.locked);
 for(const [action,label] of actions){const button=document.createElement('button');button.type='button';button.dataset.action=action;
  const blockedDelete=action==='delete'&&blocked;
  const description=translated(blockedDelete?'Unlock dependents before deleting.':label,uiPrefs.language);
  button.setAttribute('role','menuitem');button.title=description;button.setAttribute('aria-label',description);
  button.dataset.tooltip=description;
  button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[label]}</svg>`;
  if(blockedDelete)button.disabled=true;
  button.onclick=()=>{
   const valid=objectMenuContext?.object===o&&objectMenuContext?.generation===documentGeneration&&currentObject(o)&&generation===documentGeneration;
   closeObjectMenu();if(!valid){notice('The object changed. Reopen its menu.');return;}
   if(action==='delete')deleteObject(o.id);
   else update(()=>{if(!currentObject(o)||generation!==documentGeneration)throw Error('Stale object control.');
    if(action==='visibility')o.hidden=!o.hidden;else o.locked=!o.locked;});
   const row=[...$('objects').querySelectorAll('.object')].find(r=>r.dataset.id===o.id);
   (row?.querySelector('.object-menu-toggle')||$('object-search')).focus();
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
 const visibilityIndex=new Map(doc.objects.map(o=>[o.id,o]));
 listedObjects=[...doc.objects].reverse().filter(o=>
  (showHidden||isObjectVisible(doc,o,id=>visibilityIndex.get(id)))&&(!filter||`${o.name} ${desc(o,nameById)}`.toLowerCase().includes(filter)));
 const previous=resetScroll?0:wrapper.scrollTop;
 renderListWindow();
 wrapper.scrollTop=previous;
 // Programmatic scroll position restoration may change the visible range.
 renderListWindow();
}
function renderListWindow(){
 const wrapper=$('objects'),count=listedObjects.length,scroll=Math.max(0,wrapper.scrollTop),height=Math.max(90,wrapper.clientHeight);
 const visibilityIndex=new Map(doc.objects.map(o=>[o.id,o]));
 const first=Math.min(count,Math.max(0,Math.floor(scroll/LIST_ROW_HEIGHT)-LIST_OVERSCAN));
 const last=Math.min(count,Math.ceil((scroll+height)/LIST_ROW_HEIGHT)+LIST_OVERSCAN);
 const fragment=document.createDocumentFragment();
 function spacer(px){const e=document.createElement('div');e.className='list-spacer';e.style.height=px+'px';e.setAttribute('aria-hidden','true');return e;}
 if(first)fragment.append(spacer(first*LIST_ROW_HEIGHT));
 for(let i=first;i<last;i++){
  const o=listedObjects[i],row=document.createElement('div');row.tabIndex=0;row.className='object'+(selectedIds.has(o.id)||o.id===selected?' selected':'')+(!isObjectVisible(doc,o,id=>visibilityIndex.get(id))?' hidden':'');row.dataset.id=o.id;row.dataset.locked=o.locked?'true':'false';row.setAttribute('role','listitem');row.setAttribute('aria-posinset',String(i+1));row.setAttribute('aria-setsize',String(count));
  const glyph=document.createElement('span');glyph.className='glyph';glyph.textContent={point:'•',midpoint:'◉',segment:'╱',arrow:'➜',line:'⟷',circle:'◯',polygon:'⬡',regularPolygon:'⬟',rectangle:'□',parallelogram:'▱',polyline:'⌁',ray:'⇀',perpBisector:'⟂',parallelThrough:'∥',perpendicularThrough:'⟂',intersection:'×',circleThrough3:'◉',freehand:'∿',text:'T',function:'ƒ',parametric:'∿',implicit:'◌',vectorField:'↗',domainColoring:'◉',ellipse:'⬭',bezier:'∽',angle:'∠',node:'▣',morphism:'↦'}[o.type]||'◇';
 if(o.type==='polyline'){glyph.textContent='';glyph.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M2 19L9 3L15 18L22 4"/></svg>'); }
 if(o.type==='circleIntersection'){glyph.textContent='';glyph.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M2 20L22 4"/><circle cx="6" cy="17" r="1.7" fill="currentColor"/><circle cx="18" cy="7" r="1.7" fill="currentColor"/></svg>'); }
 row.append(glyph);
  const label=document.createElement('span');label.className='object-label';const strong=document.createElement('strong');strong.textContent=o.name;const small=document.createElement('small');small.textContent=desc(o);label.append(strong,small);row.append(label);
  const more=document.createElement('button');more.type='button';more.className='object-menu-toggle';more.textContent='⋯';more.title=translated('Object actions',uiPrefs.language);more.setAttribute('aria-label',`${translated('Object actions',uiPrefs.language)}: ${o.name}`);more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-controls','object-action-menu');more.setAttribute('aria-expanded','false');
  more.onclick=e=>{e.stopPropagation();openObjectMenu(o,more);};
  more.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();openObjectMenu(o,more);}};
  row.append(more);
  row.onclick=e=>{if(currentObject(o)){if(e.ctrlKey||e.metaKey||e.shiftKey)selectToggle(o.id);else select(o.id);}};
  row.onkeydown=e=>{
   if(e.target!==row||!currentObject(o))return;
   if(e.key==='Enter'||e.key===' '){e.preventDefault();if(e.ctrlKey||e.metaKey||e.shiftKey)selectToggle(o.id);else select(o.id);focusListIndex(i);}
   else if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?count-1:Math.min(count-1,Math.max(0,i+(e.key==='ArrowDown'?1:-1)));
    select(listedObjects[next].id);focusListIndex(next);
   }
  };fragment.append(row);
 }
 if(last<count)fragment.append(spacer((count-last)*LIST_ROW_HEIGHT));
 if(!count){const empty=document.createElement('p');empty.className='subtle empty-objects';empty.textContent=doc.objects.length?'No matches':'No objects';fragment.append(empty);}
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
function renderBulkProperties(root,objects){
 const editable=objects.filter(o=>!o.locked),locked=objects.length-editable.length;
 const header=document.createElement('div');header.className='bulk-heading';
 header.setAttribute('role','status');header.textContent=uiPrefs.language==='zh'?`已选 ${objects.length} 个${locked?` · 锁定 ${locked} 个`:''}`:`${objects.length} selected${locked?` · ${locked} locked`:''}`;
 root.append(header);
 if(!editable.length)return;
 const generation=documentGeneration,ids=objects.map(o=>o.id);
 const edit=(property,value,bounds=null)=>update(()=>{
  if(bounds&&(!finite(value)||value<bounds.min||value>bounds.max))throw Error(`${bounds.label}: ${bounds.min}–${bounds.max}.`);
  if(documentGeneration!==generation||ids.length!==activeSelection().length||ids.some(id=>!selectedIds.has(id)))throw Error('Selection changed while editing.');
  const indexed=new Map(doc.objects.map(o=>[o.id,o]));
  const targets=compatibleObjects(ids.map(id=>indexed.get(id)).filter(Boolean),property);
  if(!targets.length)throw Error('No editable objects for this style.');
  for(const obj of targets)obj.style[property]=value;
 });
 const grid=document.createElement('div');grid.className='style-controls-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Selected objects appearance');
 const slot=(name)=>{const e=document.createElement('div');e.className='style-slot style-'+name;grid.append(e);return e;};
 function addColor(property,label){
  if(!compatibleObjects(objects,property).length)return;
  const target=slot(property.toLowerCase()),value=commonValue(compatibleObjects(objects,property),property);
  const control=field(target,label,value||compatibleObjects(objects,property)[0].style[property],'color',v=>edit(property,v));
  if(value===null)control.closest('label').dataset.mixed='true';
  appendColorSwatches(target,{scope:'bulk',property,apply:v=>edit(property,v)});
 }
 function addNumber(property,label,min,max,step){
  if(!compatibleObjects(objects,property).length)return;
  const target=slot(property.toLowerCase()),value=commonValue(compatibleObjects(objects,property),property);
  const control=field(target,label,value===null?'':value,'number',v=>edit(property,v,{min,max,label}),{min,max,step});
  if(value===null){control.placeholder=translated('Mixed',uiPrefs.language);control.dataset.mixed='true';}
 }
 addColor('stroke','Stroke');addColor('fill','Fill');
 addNumber('width','Line width',.1,100,.5);addNumber('opacity','Opacity',0,1,.1);
 addNumber('pointSize','Point size',1,100,1);
 root.append(grid);
}
function renderProperties(){
 const root=$('properties');root.replaceChildren();const objects=activeSelection();
 if(objects.length>1){renderBulkProperties(root,objects);localizeUI(root,uiPrefs.language);return;}
 const o=objects[0]||get(doc,selected);
 if(!o)return;
 if(o.locked){const p=document.createElement('p');p.className='subtle';p.textContent='Locked';root.append(p);return;}
 // IMPORTANT: never mutate a captured object. Failed validation, undo and imports
 // replace the document and make the old object reference stale. Resolve by ID in
 // every transaction, preventing false-success edits that silently do nothing.
 const editorGeneration=documentGeneration;
 const edit=fn=>update(()=>{const live=get(doc,o.id);
  if(editorGeneration!==documentGeneration||!live||live.type!==o.type||live.locked||selected!==o.id)throw Error('Object changed while editing. Please reselect it.');
  fn(live);
 });
 const nameInput=field(root,'Name',o.name,'text',v=>edit(live=>{const name=v.trim();if(!name||doc.objects.some(a=>a.id!==live.id&&a.name===name))throw Error('Object names must be unique and nonempty.');live.name=name;}));
 if(['point','midpoint','intersection','circleIntersection','circleCircleIntersection'].includes(o.type)){
  const mode=document.createElement('label');mode.className='field';mode.textContent='Label format';const modeSelect=document.createElement('select');
  for(const [value,label] of [['plain','Plain text'],['latex','LaTeX math']]){const option=document.createElement('option');option.value=value;option.textContent=label;modeSelect.append(option);}
  modeSelect.value=o.pointLabelMode||'plain';modeSelect.onchange=()=>edit(live=>{if(modeSelect.value==='latex'&&live.pointLabel)validateLatexInput(live.pointLabel);live.pointLabelMode=modeSelect.value;});mode.append(modeSelect);root.append(mode);
  field(root,'Displayed label',o.pointLabel||'','text',v=>edit(live=>{if(live.pointLabelMode==='latex'&&v)validateLatexInput(v);live.pointLabel=v;}));
 }
 // Diagram nodes, morphisms and Text already use their editable 'text' property.
 // All other shapes now expose optional independent on-canvas labels, never names/IDs.
 if(!['point','midpoint','intersection','circleIntersection','circleCircleIntersection','node','morphism','text'].includes(o.type)){
  const mode=document.createElement('label');mode.className='field';mode.textContent='Label format';const select=document.createElement('select');
  for(const [value,label] of [['plain','Plain text'],['latex','LaTeX math']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
  select.value=o.displayLabelMode||'plain';select.onchange=()=>edit(live=>{if(select.value==='latex'&&live.displayLabel)validateLatexInput(live.displayLabel);live.displayLabelMode=select.value;});mode.append(select);root.append(mode);
  field(root,'Displayed label',o.displayLabel||'','text',v=>edit(live=>{if(live.displayLabelMode==='latex'&&v)validateLatexInput(v);live.displayLabel=v;}));
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
  field(root,o.type==='morphism'?'Arrow label':'Text / label',o.text,'multiline',v=>edit(live=>{if(live.textMode==='latex')validateLatexInput(v);live.text=v;}));}
 if(['text','node','morphism'].includes(o.type)&&o.textMode!=='latex'){
  const family=document.createElement('label');family.className='field';family.textContent='Font';const pick=document.createElement('select');
  for(const [value,label] of [['Georgia, serif','Serif'],['Arial, sans-serif','Sans-serif'],['Consolas, monospace','Monospace'],['Verdana, sans-serif','Verdana'],['Trebuchet MS, sans-serif','Trebuchet'],['Palatino Linotype, serif','Palatino'],['Times New Roman, serif','Times']]){const option=document.createElement('option');option.value=value;option.textContent=label;pick.append(option);}
  pick.value=o.fontFamily||(['text'].includes(o.type)?'Arial, sans-serif':'Georgia, serif');pick.onchange=()=>edit(live=>live.fontFamily=pick.value);family.append(pick);root.append(family);
 }
 if(['text','node'].includes(o.type))field(root,'Font size',o.fontSize||18,'number',v=>edit(live=>{if(!finite(v)||v<5||v>200)throw Error('Font size must be 5–200.');live.fontSize=v;}),{min:5,max:200,step:1});
 if(o.type==='node'){const border=document.createElement('label');border.className='check compact-property-check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!o.nodeBorder;cb.onchange=()=>edit(live=>live.nodeBorder=cb.checked);border.append(cb,document.createTextNode(' Node border'));root.append(border);}
 if(o.type==='morphism'){
  const arrowLabel=document.createElement('label');arrowLabel.className='field';arrowLabel.textContent='Arrow style';const arrowChoice=document.createElement('select');for(const [value,label] of [['solid','Solid'],['dashed','Dashed'],['dotted','Dotted'],['hook','Hooked'],['hook-dashed','Hook dashed'],['twohead','Two heads'],['tail','Tail bar']]){const option=document.createElement('option');option.value=value;option.textContent=label;arrowChoice.append(option);}arrowChoice.value=o.arrowStyle||'solid';arrowChoice.onchange=()=>edit(live=>live.arrowStyle=arrowChoice.value);arrowLabel.append(arrowChoice);root.append(arrowLabel);

  field(root,'Curve / bend',o.bend||0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>5)throw Error('Bend range: −5 to 5.');live.bend=v;}),{min:-5,max:5,step:.1});
  const routeRow=document.createElement('label');routeRow.className='field routing-field';routeRow.textContent='Arrow routing';
  const routeSelect=document.createElement('select');routeSelect.id='morphism-routing';
  for(const [value,text] of [['direct','Direct'],['avoid','Avoid nodes'],['avoid-crossings','Fewer crossings'],['scene-crossings','All arrows']]){
   const option=document.createElement('option');option.value=value;option.textContent=text;routeSelect.append(option);
  }
  routeSelect.value=o.routing||'direct';routeSelect.onchange=()=>edit(live=>{live.routing=routeSelect.value;});
  routeRow.append(routeSelect);root.append(routeRow);

  const arrowChecks=document.createElement('div');arrowChecks.className='morphism-arrow-checks';
  const collisionRow=document.createElement('label');collisionRow.className='check';
  const collisionCheck=document.createElement('input');collisionCheck.type='checkbox';collisionCheck.id='morphism-label-avoid';
  collisionCheck.checked=o.labelAvoid!==false;collisionCheck.onchange=()=>edit(live=>{live.labelAvoid=collisionCheck.checked;});
  collisionRow.append(collisionCheck,document.createTextNode(' Avoid collisions'));arrowChecks.append(collisionRow);
  const side=document.createElement('label');side.className='check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!o.swap;
  cb.onchange=()=>edit(live=>{live.swap=cb.checked;});side.append(cb,document.createTextNode(' Swap label side'));arrowChecks.append(side);
  root.append(arrowChecks);

  field(root,'Label position',o.labelT??.5,'number',v=>edit(live=>{if(!finite(v)||v<.05||v>.95)throw Error('Label position must be 0.05–0.95.');live.labelT=v;}),{min:.05,max:.95,step:.05});
  field(root,'Label distance (px)',o.labelDistance??17,'number',v=>edit(live=>{if(!finite(v)||v<0||v>200)throw Error('Label distance must be 0–200 px.');live.labelDistance=v;}),{min:0,max:200,step:1});
  field(root,'Label shift X (px)',o.labelDx??0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>300)throw Error('Label shift must be between −300 and 300 px.');live.labelDx=v;}),{min:-300,max:300,step:1});
  field(root,'Label shift Y (px)',o.labelDy??0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>300)throw Error('Label shift must be between −300 and 300 px.');live.labelDy=v;}),{min:-300,max:300,step:1});
 }
 if(o.type==='function')field(root,'y =',o.expr,'text',v=>edit(live=>{parseExpression(v);live.expr=v;}));
 if(o.type==='parametric'){
  const current=o.parameter||'u';
  const wrap=document.createElement('label');wrap.className='field';wrap.textContent=translated('Parameter symbol',uiPrefs.language);
  const sel=document.createElement('select');sel.setAttribute('aria-label','Parameter symbol');
  for(const symbol of ['t','u','v']){const option=document.createElement('option');option.value=symbol;option.textContent=symbol;sel.append(option);}
  sel.value=current;
  sel.onchange=()=>{const old=current,next=sel.value;const ok=edit(live=>{
   // Convert both expressions atomically, including legacy u=v references.
   const replace=expr=>live.parameter?renameCurveParameter(expr,old,next):renameCurveParameter(renameCurveParameter(expr,'u',next),'v',next);
   live.xExpr=replace(live.xExpr);live.yExpr=replace(live.yExpr);parseParametric(live.xExpr,live.yExpr,next);live.parameter=next;
  });if(!ok)sel.value=old;};wrap.append(sel);root.append(wrap);
  field(root,`x(${current}) =`,o.xExpr,'text',v=>edit(live=>{parseParametric(v,live.yExpr,live.parameter);live.xExpr=v;}));
  field(root,`y(${o.parameter||'v'}) =`,o.yExpr,'text',v=>edit(live=>{parseParametric(live.xExpr,v,live.parameter);live.yExpr=v;}));
  field(root,'Parameter start',o.tMin,'number',v=>edit(live=>{if(!finite(v)||v>=live.tMax||Math.abs(v)>1e6)throw Error('Start must precede end.');live.tMin=v;}),{step:0.1});
  field(root,'Parameter end',o.tMax,'number',v=>edit(live=>{if(!finite(v)||v<=live.tMin||Math.abs(v)>1e6)throw Error('End must follow start.');live.tMax=v;}),{step:0.1});
 }
 if(o.type==='implicit')field(root,'F(x, y)',o.expr,'text',v=>edit(live=>{parseImplicit(v);live.expr=v;}));
 if(o.type==='vectorField'){
  field(root,'X(x, y)',o.xExpr,'text',v=>edit(live=>{parseVectorField(v,live.yExpr);live.xExpr=v;}));
  field(root,'Y(x, y)',o.yExpr,'text',v=>edit(live=>{parseVectorField(live.xExpr,v);live.yExpr=v;}));
  field(root,'Arrow density',o.density,'number',v=>edit(live=>{if(!Number.isInteger(v)||v<3||v>40)throw Error('Arrow density must be 3–40.');live.density=v;}),{min:3,max:40,step:1});
  const check=document.createElement('label');check.className='check';const input=document.createElement('input');input.type='checkbox';input.checked=o.normalized;input.onchange=()=>edit(live=>{live.normalized=input.checked;});check.append(input,document.createTextNode(' '+translated('Normalize vector lengths',uiPrefs.language)));root.append(check);
 }
 if(o.type==='domainColoring'){
  field(root,'F(z)',o.expr,'text',v=>edit(live=>{parseComplexExpression(v);live.expr=v;}));
  const modes=document.createElement('label');modes.className='field';modes.textContent=translated('Color scheme',uiPrefs.language);
  const select=document.createElement('select');for(const [value,name] of [['phase-modulus','Phase + modulus'],['phase','Phase only'],['contours','Modulus bands']]){const opt=document.createElement('option');opt.value=value;opt.textContent=translated(name,uiPrefs.language);select.append(opt);}
  select.value=o.colorMode||'phase-modulus';select.onchange=()=>edit(live=>{live.colorMode=select.value;});modes.append(select);root.append(modes);
  field(root,'Coloring resolution',o.resolution??128,'number',v=>edit(live=>{if(!Number.isInteger(v)||v<32||v>256)throw Error('Resolution must be 32–256.');live.resolution=v;}),{min:32,max:256,step:16});
 }
 if(['vectorField','domainColoring'].includes(o.type)){
  const form=document.createElement('div');form.className='plot-region-editor';form.setAttribute('role','group');form.setAttribute('aria-label',translated('Drawing region',uiPrefs.language));
  const entries={};for(const [key,label] of [['xMin','X min'],['xMax','X max'],['yMin','Y min'],['yMax','Y max']]){
   entries[key]=field(form,translated(label,uiPrefs.language),o.region[key],'number',()=>true,{step:0.1});
   // Region changes remain a draft until explicitly redrawn.
   entries[key].onchange=()=>{};
  }
  const button=document.createElement('button');button.type='button';button.className='region-redraw';button.textContent=translated('Redraw region',uiPrefs.language);
  button.onclick=()=>edit(live=>{const region=Object.fromEntries(Object.entries(entries).map(([k,input])=>[k,Number(input.value)]));validatePlotRegion(region);live.region=region;});
  form.append(button);root.append(form);
 }
 if(o.type==='regularPolygon')field(root,'Number of sides',o.sides,'number',v=>edit(live=>{if(!Number.isInteger(v)||v<3||v>100)throw Error('Regular polygon sides must be 3–100.');resizeRegularPolygon(doc,live.id,v);}),{step:1,min:3,max:100});
 if(o.type==='segment'||o.type==='angle'){
  const p=createResolver(doc).points(o);let measured=null;
  if(p.every(Boolean)&&p.length===(o.type==='segment'?2:3)){
   if(o.type==='segment')measured=Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1]);
   else{const one=Math.atan2(p[0][1]-p[1][1],p[0][0]-p[1][0]),two=Math.atan2(p[2][1]-p[1][1],p[2][0]-p[1][0]);let sweep=(two-one+2*Math.PI)%(2*Math.PI);if(sweep>Math.PI)sweep-=2*Math.PI;measured=Math.abs(sweep*180/Math.PI);}
  }
  const label=o.type==='segment'?'Length (units)':'Angle (degrees)';
  const measure=document.createElement('label');measure.className='field';measure.textContent=translated(label,uiPrefs.language);
  const output=document.createElement('output');output.className='measurement-value';output.textContent=measured===null?'—':String(Number(measured.toPrecision(8)));output.setAttribute('aria-label',translated(label,uiPrefs.language));
  measure.append(output);root.append(measure);
 }
 // Compact appearance controls reuse the existing transaction handlers. Keep
 // fill absent for ineligible types and preserve the existing field order.
 const styleGrid=document.createElement('div');styleGrid.className='style-controls-grid';
 styleGrid.setAttribute('role','group');styleGrid.setAttribute('aria-label','Object appearance');
 function styleSlot(name){const slot=document.createElement('div');slot.className='style-slot style-'+name;styleGrid.append(slot);return slot;}
 const strokeSlot=styleSlot('stroke');
 field(strokeSlot,'Stroke',o.style.stroke,'color',v=>edit(live=>live.style.stroke=v));
 appendColorSwatches(strokeSlot,{scope:'object',property:'stroke',apply:v=>edit(live=>{live.style.stroke=v;})});
 if(['polygon','regularPolygon','ellipse','rectangle','parallelogram','node'].includes(o.type)){
  const fillSlot=styleSlot('fill');
  field(fillSlot,'Fill',o.style.fill,'color',v=>edit(live=>live.style.fill=v));
  appendColorSwatches(fillSlot,{scope:'object',property:'fill',apply:v=>edit(live=>{live.style.fill=v;})});
 }
 field(styleSlot('width'),'Line width',o.style.width,'number',v=>edit(live=>{if(!finite(v)||v<.1||v>100)throw Error('Width must be 0.1–100.');live.style.width=v;}),{step:.5,min:.1,max:100});
 field(styleSlot('opacity'),'Opacity',o.style.opacity,'number',v=>edit(live=>{if(!finite(v)||v<0||v>1)throw Error('Opacity must be in [0,1].');live.style.opacity=v;}),{step:.1,min:0,max:1});
 if(['point','midpoint','intersection','circleIntersection','circleCircleIntersection'].includes(o.type))field(styleSlot('pointsize'),'Point size',o.style.pointSize??doc.settings.pointSize,'number',v=>edit(live=>{if(!finite(v)||v<1||v>100)throw Error('Point size must be 1–100.');live.style.pointSize=v;}),{step:1,min:1,max:100});
 root.append(styleGrid);
 localizeUI(root,uiPrefs.language);
 const actions=document.createElement('div');actions.className='props-actions';
 const del=document.createElement('button');del.textContent='Delete + dependents';del.onclick=()=>{if(currentObject(o)&&selected===o.id)deleteSelected();};
 const up=document.createElement('button');up.textContent='Bring forward';up.onclick=()=>edit(live=>{const n=doc.objects.indexOf(live);if(n>=0&&n<doc.objects.length-1)doc.objects.splice(n,2,doc.objects[n+1],live);});
 const down=document.createElement('button');down.textContent='Send backward';down.onclick=()=>edit(live=>{const n=doc.objects.indexOf(live);if(n>0)doc.objects.splice(n-1,2,live,doc.objects[n-1]);});
 const focus=document.createElement('button');focus.textContent='Center view';focus.onclick=()=>{const live=get(doc,o.id);if(live!==o)return;const p=['point','midpoint','intersection','circleIntersection','circleCircleIntersection','node'].includes(live.type)?position(doc,live.id):live.xy||position(doc,live.refs?.[0]);if(p){view.cx=p[0];view.cy=p[1];scheduleRender();}};
 actions.append(del,focus,down,up);root.append(actions);localizeUI(root,uiPrefs.language);
}
function renderAll(){renderList();renderProperties();render();syncSettings();localizeUI(document.documentElement,uiPrefs.language);}
function select(id){setSelection(id?[id]:[],id);}
function clearDraft(){draftStart=null;draftPoints=[];draftNode=null;draftReference=null;hover=null;pendingTouchTap=null;}
const toolInstructions={parallelThrough:'Click a point, then a straight line, segment, or ray.',perpendicularThrough:'Click a point, then a straight line, segment, or ray.',intersection:'Click two crossing straight objects.',circleIntersection:'Click a straight object and a circle; both intersections are created when available.',midpoint:'Click two points; the midpoint follows both.',ray:'Click the start, then the direction point.',perpBisector:'Click two points; the bisector stays perpendicular as they move.',circleDiameter:'Click two opposite ends of a diameter.',circleThrough3:'Click three noncollinear points.',triangle:'Click three vertices.',quadrilateral:'Click four vertices.',spline:'Click at least three points; Enter finishes.',closedSpline:'Click at least three points; Enter closes smoothly.',select:'Drag objects to move; drag empty canvas to pan. Shift-drag empty canvas selects a rectangle.',pan:'Drag the canvas.',polygon:'Click vertices; Enter finishes.',polyline:'Click vertices; Enter finishes.',bezier:'Click four control points.',angle:'Click three points (vertex second).',freehand:'Drag to draw a free curve.',morphism:'Click source and target nodes.',regularPolygon:'Click center, then a vertex.',node:'Click the canvas to add a node.',ellipse:'Click the first focus, second focus, then a point on the ellipse.',rectangle:'Click an edge start, edge end, then a point indicating perpendicular height.',parallelogram:'Click three consecutive vertices.'};
function updateModeLabel(t){
 const label=toolGroups['basic-tools'].concat(toolGroups['construction-tools'],toolGroups['diagram-tools']).find(([id])=>id===t)?.[1]||t;
 const localized=translated(label,uiPrefs.language),help=toolInstructions[t]||'Click the canvas.';
 const mode=$('mode-label');mode.textContent=localized;mode.removeAttribute('title');mode.removeAttribute('tabindex');
 mode.setAttribute('aria-label',localized+': '+help);
 $('drawing').setAttribute('aria-label','Interactive mathematical drawing canvas · '+localized+': '+help);
}
function selectTool(t){
 if(!TOOLS.includes(t))return;
 if(drag)cancelDrag();tool=t;gridSnapOverride=['node','morphism'].includes(t);clearDraft();$('drawing').dataset.tool=t;
 if($('snap'))$('snap').checked=gridSnapOverride;
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
  button.title=label+(shortcutForTool[type]?' ('+shortcutForTool[type]+')':'');button.setAttribute('aria-label',label);
  if(shortcutForTool[type])button.setAttribute('aria-keyshortcuts',shortcutForTool[type]);
  // Keep SVG paths unchanged outside explicitly authorized glyphs. Extra viewBox
  // breathing room prevents stroke and control-dot clipping at tile edges.
  button.innerHTML=`<svg viewBox="-1.5 -1.5 27 27" aria-hidden="true">${glyph[type]}</svg><span>${label}</span>`;
  if(id==='construction-tools')button.dataset.advancedGeometry=String(!ESSENTIAL_GEOMETRY.has(type));
  button.onclick=()=>selectTool(type);parent.append(button);
 }
 selectTool('select');
}
function syncGeometryVisibility(){
 const only=uiPrefs.essentialGeometry!==false;
 const input=$('geometry-essential');if(input)input.checked=only;
 for(const button of document.querySelectorAll('[data-advanced-geometry]'))button.hidden=only&&button.dataset.advancedGeometry==='true';
 if(only&&document.querySelector(`[data-tool-choice="${tool}"]`)?.hidden)selectTool('select');
}
function syncSettings(){
 for(const [id,k]of [['naming-convention','namingConvention'],['snap-objects','snapObjects'],['freehand-close','freehandClose'],['correction','correction'],['plot-quality','plotQuality'],['plot-budget','plotBudget'],['implicit-grid','implicitGrid'],['polygon-sides','polygonSides'],['snap-step','snapStep'],['snap','snap'],['snap-anchors','snapAnchors'],['grid','grid'],['axes','showAxes'],['labels','showLabels'],['label-placement','labelPlacement'],['default-stroke','stroke'],['default-fill','fill'],['default-width','width'],['point-size','pointSize'],['default-opacity','opacity'],['page','page'],['export-region','exportRegion'],['export-guides','exportGuides'],['export-scale','exportScale'],['export-transparent','exportTransparent'],['background','background']]){
  const input=$(id);if(!input)continue;if(input.type==='checkbox')input.checked=!!doc.settings[k];else input.value=doc.settings[k];
 }
 $('snap').checked=gridSnapOverride??doc.settings.snap;
 $('export-region').querySelector('option[value="page"]').disabled=doc.settings.page==='infinite';
 // Legacy `settings.modules` is preserved in v1 project files, but no longer
 // hides a tool: section disclosure is independent, local interface state.
 // A drawing preset owns the common construction defaults too. Without these
 // checks the UI says "General" after the user has customized anchor snapping,
 // polygon sides or point-label visibility. Page/export/theme are independent.
 const matching=Object.entries(PRESETS).find(([name,preset])=>Object.entries(preset).every(([k,v])=>doc.settings[k]===v)
  &&Object.entries(PRESET_MODULES[name]).every(([k,v])=>doc.settings.modules[k]===v)
  &&doc.settings.snapAnchors===true&&doc.settings.snapObjects===true&&doc.settings.polygonSides===6&&doc.settings.showLabels===true&&doc.settings.labelPlacement==='avoid');
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
 preset.value='General';preset.onchange=()=>{if(preset.value!=='Custom')update(()=>{if(doc.settings.pointSize!==PRESETS[preset.value].pointSize)preserveInheritedPointSizes(doc);Object.assign(doc.settings,clone(PRESETS[preset.value]));doc.settings.modules={...PRESET_MODULES[preset.value]};doc.settings.snapAnchors=true;doc.settings.snapObjects=true;doc.settings.polygonSides=6;doc.settings.showLabels=true;doc.settings.labelPlacement='avoid';});};
 for(const [id,k]of [['naming-convention','namingConvention'],['snap-objects','snapObjects'],['freehand-close','freehandClose'],['correction','correction'],['plot-quality','plotQuality'],['plot-budget','plotBudget'],['implicit-grid','implicitGrid'],['polygon-sides','polygonSides'],['snap-step','snapStep'],['snap','snap'],['snap-anchors','snapAnchors'],['grid','grid'],['axes','showAxes'],['labels','showLabels'],['label-placement','labelPlacement'],['default-stroke','stroke'],['default-fill','fill'],['default-width','width'],['point-size','pointSize'],['default-opacity','opacity'],['page','page'],['export-region','exportRegion'],['export-guides','exportGuides'],['export-scale','exportScale'],['export-transparent','exportTransparent'],['background','background']]){
  $(id).onchange=()=>update(()=>{
   const input=$(id);if(input.type==='number'&&!input.value.trim())throw Error('Value is required.');
   const value=input.type==='checkbox'?input.checked:(input.type==='number'||['exportScale','plotBudget'].includes(k))?Number(input.value):input.value;
   if(input.type==='number'&&!finite(value))throw Error('Value must be finite.');
   if(k==='pointSize'&&value!==doc.settings.pointSize)preserveInheritedPointSizes(doc);
   doc.settings[k]=value;
   if(k==='snap')gridSnapOverride=null; // manual choice wins until a new tool is selected
   if(k==='page'&&value==='infinite')doc.settings.exportRegion='viewport';
  },['exportRegion','exportGuides','exportScale','exportTransparent'].includes(k)?{refreshList:false,renderCanvas:false}:{});
 }
 const theme=$('theme');theme.value=initialSiteTheme();
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
function nearestAnchor(pt,excluded=null){
 if(!doc.settings.snapAnchors)return null;
 const [sx,sy]=project(pt);return currentAnchorIndex().nearest(sx,sy,12,excluded);
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
function makeFocalEllipseRefs(pts){
 // Geometry and snapping must agree. Snapshot existing anchors first, and
 // fall back to the exact requested coordinates for a third point if snapping
 // it would collapse an otherwise valid ellipse onto the focal segment.
 const anchors=doc.settings.snapAnchors?currentAnchorIndex():null;
 const snapped=pts.map(pt=>{
  if(!anchors)return null;
  const [sx,sy]=project(pt),near=anchors.nearest(sx,sy,12);
  return near&&Math.hypot(sx-near.x,sy-near.y)<12?near.id:null;
 });
 const at=id=>get(doc,id)&&position(doc,id);
 let resolved=pts.map((pt,i)=>snapped[i]?(at(snapped[i])||pt):pt);
 // Do not merge two genuinely distinct foci simply because the second
 // click falls inside the existing-anchor snapping radius.
 if(Math.hypot(resolved[0][0]-resolved[1][0],resolved[0][1]-resolved[1][1])*view.scale<1&&
    Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1])*view.scale>=1){
  snapped[1]=null;resolved=pts.map((pt,i)=>snapped[i]?(at(snapped[i])||pt):pt);
 }
 if(!focalEllipse(resolved)&&focalEllipse(pts)){
  // Third-point snap takes priority for correction; never alter selected foci.
  snapped[2]=null;
 }
 return pts.map((pt,i)=>snapped[i]||addPoint(doc,pt).id);
}
function checkNewRefs(type,refs){
 // Reject new collapsed edges while leaving imported legacy v1 projects intact.
 const resolver=createResolver(doc),p=refs.map(id=>resolver.at(id));checkNewGeometry(type,p);
 if(['polygon','polyline','spline'].includes(type)){
  const pairs=type==='polygon'?[...refs,refs[0]]:refs;
  for(let i=1;i<pairs.length;i++)if(pairs[i]===pairs[i-1])throw Error('Construction has a repeated consecutive vertex.');
 }
}
function addTwoPoint(type,a,b){return update(()=>{checkNewGeometry(type,[a,b]);const refs=makeRefs([a,b]);checkNewRefs(type,refs);selected=append(doc,{type,refs}).id;});}
function finishDraft(){
 const mins={rectangle:3,parallelogram:3,polygon:3,polyline:2,spline:3,closedSpline:3,bezier:4,angle:3,circleThrough3:3,triangle:3,quadrilateral:4};if(!mins[tool]||draftPoints.length<mins[tool]){notice('Add more vertices before finishing.');return;}
 const pts=clone(draftPoints),type=tool,storedType=['triangle','quadrilateral'].includes(type)?'polygon':type==='closedSpline'?'spline':type;
 try{checkNewGeometry(storedType,pts);}catch(e){notice(e.message);if(['rectangle','parallelogram'].includes(type))draftPoints.pop();scheduleRender();return;}
 const ok=update(()=>{
  let refs=makeRefs(pts);
  // A previously existing point near the cursor may be exactly collinear
  // even though the raw third click is not. Prefer the actual click there.
  if(type==='circleThrough3'&&!circumcircle(refs.map(id=>position(doc,id)))&&circumcircle(pts)){
   // Replace the last snapped reference, then if needed the earlier snaps.
   for(let i=refs.length-1;i>=0&&!circumcircle(refs.map(id=>position(doc,id)));i--){
    const actual=position(doc,refs[i]);
    if(actual&&Math.hypot(actual[0]-pts[i][0],actual[1]-pts[i][1])>1e-9)refs[i]=addPoint(doc,pts[i]).id;
   }
  }
  // If the third click is near a point on the first-edge line, snapping
  // can make a valid slanted rectangle/parallelogram degenerate. Keep the
  // raw third click in that case instead of silently discarding the figure.
  if(['rectangle','parallelogram'].includes(type)){
   try{checkNewRefs(storedType,refs);}catch(error){
    if(refs[2]!==null){refs[2]=addPoint(doc,pts[2]).id;}
   }
  }
  checkNewRefs(storedType,refs);
  if(type==='closedSpline'&&refs[0]===refs.at(-1))throw Error('Closed spline cannot duplicate the first vertex.');
  selected=append(doc,{type:storedType,refs,...(type==='closedSpline'?{closed:true}:{})}).id;
  if(storedType==='polygon')appendPolygonEdges(doc,selected);
  if(['rectangle','parallelogram'].includes(storedType))appendDerivedShapeEdges(doc,selected);
 });
 if(ok){draftPoints=[];afterOneConstruction();scheduleRender();}
}
function correctedPath(path){return smoothPath(path,doc.settings.correction,view.scale);}
function freehandAttachment(world){
 return doc.settings.freehandClose==='near'&&doc.settings.snapObjects===true
  ?nearestFreehandAttachment(world,doc.objects,createResolver(doc),view.scale):null;
}
function preparedFreehand(path,startAttachment=null){
 const corrected=correctedPath(path);
 if(doc.settings.freehandClose==='near'&&corrected.length>=2){
  const begin=startAttachment||freehandAttachment(path[0]);
  const finish=freehandAttachment(path.at(-1));
  if(begin)corrected[0]=begin.world;
  if(finish)corrected[corrected.length-1]=finish.world;
  return {prepared:closeFreehandStroke(corrected,'near',view.scale),begin,finish};
 }
 return {prepared:closeFreehandStroke(corrected,doc.settings.freehandClose,view.scale),begin:null,finish:null};
}
/** Point-to-object attraction is opt-in per document and coordinate-only.
 * Filter the moving point AND all of its dependents: otherwise a moving point
 * can snap to geometry whose coordinates it is itself changing. */
function objectPointAttachment(world,excluded=null){
 if(doc.settings.snapObjects!==true)return null;
 const candidates=excluded?doc.objects.filter(o=>!excluded.has(o.id)):doc.objects;
 return nearestFreehandAttachment(world,candidates,createResolver(doc),view.scale,10);
}
function effectiveSnapSettings(){return gridSnapOverride===null?doc.settings:{...doc.settings,snap:gridSnapOverride};}
function constructionPoint(world,excludeId=null){
 // Cache the dependency exclusion for a continuous drag. A point cannot attach
 // to itself or to a moving segment/ellipse that refers to that same point.
 const excluded=excludeId?(drag?.id===excludeId&&drag.excluded?drag.excluded:affected(doc,excludeId)):null;
 const anchor=nearestAnchor(world,excluded);
 if(anchor)return anchor.world;
 const attached=objectPointAttachment(world,excluded);
 return attached?attached.world:snapPoint(world,effectiveSnapSettings());
}
function constructionVertex(world){
 const anchor=nearestAnchor(world);if(anchor)return anchor.world;
 const attached=objectPointAttachment(world);
 return attached?attached.world:snapPoint(world,effectiveSnapSettings());
}
function afterOneConstruction(){if(uiPrefs.autoPan!==false)selectTool('pan');}
function pointerDown(e){
 if(!$('tikzcd-dialog').hidden||!$('export-menu').hidden)return;
 // Touch drawing must wait for release; otherwise the first finger of a pinch
 // silently inserts a point/vertex before the second pointer arrives.
 if(e.pointerType==='touch'){
  touchContacts.add(e.pointerId);
  if(touchContacts.size>1||!e.isPrimary){
   touchBlocked=true;pendingTouchTap=null;
   if(drag)cancelDrag();
   if(draftStart||draftPoints.length||draftNode||draftReference){clearDraft();scheduleRender();}
   return;
  }
  if(touchBlocked)return;
 }
 if(e.button!==0||!e.isPrimary||drag)return;const [sx,sy]=xyEvent(e),world=unproject(sx,sy),pt=['select','pan'].includes(tool)?world:tool==='point'?constructionPoint(world):constructionVertex(world);
 $('drawing').focus();hover=pt;
 if(e.pointerType==='touch'&&!['select','pan','freehand'].includes(tool)){
  pendingTouchTap={pointerId:e.pointerId,sx,sy,moved:false,hitId:e.target.closest?.('[data-id]')?.dataset.id||null};
  try{$('drawing').setPointerCapture(e.pointerId);}catch{}
  return;
 }
 if(tool==='select'){
  // A selected morphism's label handle has priority over point and path hits.
  // This must be checked before the generic overlapping-object selection logic.
  const labelId=e.target.closest('[data-label-handle]')?.getAttribute('data-label-handle');
  const labelObject=labelId&&get(doc,labelId);
  if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&labelObject?.type==='morphism'&&!labelObject.locked&&labelObject.text){
   if(selected!==labelId)select(labelId);
   const automatic=labelObject.labelAvoid!==false?currentMorphismLabels.get(labelId):null;
   drag={kind:'label',pointerId:e.pointerId,id:labelId,before:JSON.stringify(doc),
    sx,sy,offsetX:(labelObject.labelDx??0)+(automatic?.dx??0),
    offsetY:(labelObject.labelDy??0)+(automatic?.dy??0),wasAuto:labelObject.labelAvoid!==false};
   try{$('drawing').setPointerCapture(e.pointerId);}catch{}
   return;
  }
  const id=hitTestPoint(sx,sy)||e.target.closest('[data-id]')?.dataset.id||null;
  if(e.altKey){drag={kind:'pan',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy};}
  else if(id&&(e.ctrlKey||e.metaKey||e.shiftKey)){
   // Preserve overlapping-object cycling with Ctrl; Shift targets the topmost hit.
   selectToggle((e.ctrlKey||e.metaKey)?stackedSelection(e,sx,sy)||id:id);
  }else if(!id){
   drag=(e.shiftKey||e.ctrlKey||e.metaKey)&&e.pointerType!=='touch'
    ?{kind:'marquee',pointerId:e.pointerId,sx,sy,ex:sx,ey:sy,additive:true}
    :{kind:'pan',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy,emptyMove:true};
  }else{select(id);const o=get(doc,id);if(o&&!o.hidden&&!o.locked&&['point','node','text'].includes(o.type))drag={kind:'point',pointerId:e.pointerId,id,before:JSON.stringify(doc),sx,sy,moved:false,excluded:affected(doc,id)};}
 }else if(tool==='pan'){
  const id=uiPrefs.autoPan!==false?(hitTestPoint(sx,sy)||e.target.closest('[data-id]')?.dataset.id||null):null;
  const obj=id&&get(doc,id);
  if(obj&&!obj.hidden&&!obj.locked)drag={kind:'pan-object-pending',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy,id};
  else drag={kind:'pan',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy};
 }
 else if(tool==='freehand'){drag={kind:'freehand',pointerId:e.pointerId,path:[world],startAttachment:freehandAttachment(world)};}
 else performConstructionTap(e,pt);
 if(drag)try{$('drawing').setPointerCapture(e.pointerId);}catch{}
}
function performConstructionTap(e,pt){
 if(tool==='point'){const ok=update(()=>selected=addPoint(doc,pt).id);if(ok)afterOneConstruction();}
 else if(['parallelThrough','perpendicularThrough','intersection','circleIntersection','circleCircleIntersection'].includes(tool)){
  const [sx,sy]=xyEvent(e);
  // A nearby anchor takes priority for the first point; straight objects
  // are selected from the SVG hit-path, not by their label or object order.
  const hit=e.constructionHitId||e.target.closest?.('[data-id]')?.dataset.id||null;
  const clicked=get(doc,hit),line=clicked&&createResolver(doc).line(clicked);
  if(tool==='circleCircleIntersection'){
   const candidate=clicked&&['circle','circleThrough3'].includes(clicked.type)?clicked:null;
   if(!candidate){notice('Choose an existing circle.');return;}
   if(!draftReference){draftReference=candidate.id;scheduleRender();return;}
   const first=get(doc,draftReference);
   if(!first||first.id===candidate.id){notice('Choose a different circle.');return;}
   const ok=update(()=>{
    const resolver=createResolver(doc);
    const roots=intersectCircles(circleGeometry(first,id=>resolver.at(id)),circleGeometry(candidate,id=>resolver.at(id)));
    if(!roots.minus&&!roots.plus)throw Error('These circles do not intersect at a unique point or pair.');
    for(const branch of roots.tangent?[-1]:[-1,1])if((branch===-1?roots.minus:roots.plus))
     selected=append(doc,{type:'circleCircleIntersection',refs:[first.id,candidate.id],branch}).id;
   });
   if(ok){clearDraft();afterOneConstruction();}scheduleRender();return;
  }
  if(tool==='circleIntersection'){
   const candidate=clicked&&(STRAIGHT_TYPES.has(clicked.type)||['circle','circleThrough3'].includes(clicked.type))?clicked:null;
   if(!candidate){notice('Choose a straight object or circle.');return;}
   if(!draftReference){draftReference=candidate.id;scheduleRender();return;}
   const first=get(doc,draftReference);
   if(!first||first.id===candidate.id){notice('Choose a different source object.');return;}
   const lineObject=STRAIGHT_TYPES.has(first.type)?first:STRAIGHT_TYPES.has(candidate.type)?candidate:null;
   const circleObject=['circle','circleThrough3'].includes(first.type)?first:['circle','circleThrough3'].includes(candidate.type)?candidate:null;
   if(!lineObject||!circleObject){notice('Choose one straight object and one circle.');return;}
   const ok=update(()=>{
    const resolver=createResolver(doc);
    const roots=intersectLineCircle(resolver.line(lineObject),circleGeometry(circleObject,id=>resolver.at(id)));
    if(!roots.minus&&!roots.plus)throw Error('These objects have no intersection in their selected domains.');
    const branches=roots.tangent?[roots.minus?-1:1]:[-1,1].filter(branch=>branch===-1?roots.minus:roots.plus);
    for(const branch of branches)selected=append(doc,{type:'circleIntersection',refs:[lineObject.id,circleObject.id],branch}).id;
   });
   if(ok){clearDraft();afterOneConstruction();}scheduleRender();return;
  }
  if(tool==='intersection'){
   if(!line){notice('Choose a straight line, ray or segment.');return;}
   if(!draftReference){draftReference=clicked.id;scheduleRender();return;}
   if(draftReference===clicked.id){notice('Choose a different straight object.');return;}
   const first=draftReference;
   const ok=update(()=>{
    const r=createResolver(doc),a=r.line(first),b=r.line(clicked.id);
    if(!a||!b||!intersectStraightLines(a,b))throw Error('No unique intersection: lines may be parallel or segments/rays may not cross.');
    selected=append(doc,{type:'intersection',refs:[first,clicked.id]}).id;
   });
   if(ok){clearDraft();afterOneConstruction();}scheduleRender();return;
  }
  if(!draftReference){
   const id=hitTestPoint(sx,sy),anchor=id&&get(doc,id);
   // If there is no existing point, the first tap defines a new free point,
   // but it is inserted only on successful completion in one undo step.
   draftReference=anchor&&['point','midpoint','intersection','circleIntersection','circleCircleIntersection'].includes(anchor.type)?id:'new';
   draftStart=draftReference==='new'?pt:position(doc,draftReference);
   scheduleRender();return;
  }
  if(!line){notice('Choose an existing straight line, segment or ray.');return;}
  const id=draftReference,at=draftStart;
  const ok=update(()=>{
   const pointId=id==='new'?addPoint(doc,at).id:id;
   const resolver=createResolver(doc);
   if(!resolver.at(pointId)||!resolver.line(clicked.id))throw Error('Source point or line is invalid.');
   selected=append(doc,{type:tool,refs:[pointId,clicked.id]}).id;
  });
  if(ok){clearDraft();afterOneConstruction();}scheduleRender();return;
 }
 else if(tool==='ellipse'){
  const [sx,sy]=xyEvent(e),raw=unproject(sx,sy);
  // A 12px point snap can otherwise collapse a nearby second focus or pull
  // the third click onto the line between foci. Use the actual tap only when
  // it makes a mathematically valid construction and is not a duplicate tap.
  let vertex=pt;
  if(draftPoints.length===1&&Math.hypot(vertex[0]-draftPoints[0][0],vertex[1]-draftPoints[0][1])<1e-9&&Math.hypot(raw[0]-draftPoints[0][0],raw[1]-draftPoints[0][1])*view.scale>=3)vertex=raw;
  if(draftPoints.length===2&&!focalEllipse([...draftPoints,vertex])&&focalEllipse([...draftPoints,raw]))vertex=raw;
  if(draftPoints.length===1&&Math.hypot(vertex[0]-draftPoints[0][0],vertex[1]-draftPoints[0][1])*view.scale<1){notice('Choose a second focus away from the first.');return;}
  draftPoints.push(vertex);
  if(draftPoints.length===3){const pts=clone(draftPoints);const ok=update(()=>{checkNewGeometry('ellipse',pts);const refs=makeFocalEllipseRefs(pts);checkNewRefs('ellipse',refs);selected=append(doc,{type:'ellipse',refs}).id;});if(ok){draftPoints=[];afterOneConstruction();}else draftPoints.pop();}
  scheduleRender();
 }else if(['segment','arrow','line','ray','perpBisector','midpoint','circle','circleDiameter','regularPolygon'].includes(tool)){
  if(!draftStart){draftStart=pt;scheduleRender();}else{const a=draftStart;draftStart=null;if(tool==='circleDiameter')update(()=>{
    checkNewGeometry('circle',[a,pt]);const refs=makeRefs([a,pt]);checkNewRefs('circle',refs);
    const center=append(doc,{type:'midpoint',refs}).id;
    selected=append(doc,{type:'circle',refs:[center,refs[0]]}).id;
   })&&afterOneConstruction();else if(tool==='regularPolygon')update(()=>{if(Math.hypot(a[0]-pt[0],a[1]-pt[1])<1e-9)throw Error('Choose a different vertex from the center.');const refs=makeRefs([a,pt]);checkNewRefs('regularPolygon',refs);selected=append(doc,{type:'regularPolygon',refs,sides:doc.settings.polygonSides}).id;appendDerivedShapeEdges(doc,selected);})&&afterOneConstruction();else if(addTwoPoint(tool,a,pt))afterOneConstruction();}
 }else if(['rectangle','parallelogram','polygon','polyline','bezier','angle','triangle','quadrilateral','circleThrough3','spline','closedSpline'].includes(tool)){
  if(draftPoints.length===0||Math.hypot(pt[0]-draftPoints.at(-1)[0],pt[1]-draftPoints.at(-1)[1])>1e-8)draftPoints.push(pt);
  if((['rectangle','parallelogram'].includes(tool)&&draftPoints.length===3)||(tool==='bezier'&&draftPoints.length===4)||(tool==='angle'&&draftPoints.length===3)||(tool==='circleThrough3'&&draftPoints.length===3)||(tool==='triangle'&&draftPoints.length===3)||(tool==='quadrilateral'&&draftPoints.length===4))finishDraft();else scheduleRender();
 }else if(tool==='freehand'){drag={kind:'freehand',pointerId:e.pointerId,path:[world],startAttachment:freehandAttachment(world)};}
 else if(tool==='text'||tool==='node'){
  const label=window.prompt(tool==='node'?'Diagram label (LaTeX):':'Text (LaTeX):');
  if(label!==null&&label.trim()){const limit=tool==='node'?1000:2000;if(label.length>limit)notice(`Label exceeds ${limit} characters. Nothing was added.`);else if(update(()=>{
   let text=label,textMode='latex';
   if(tool==='text'){
    const wrapped=label.trim().match(/^\$([^$]+)\$$/s)||label.trim().match(/^\\\(([\s\S]+)\\\)$/);
    if(wrapped){text=wrapped[1];textMode='latex';}
    else if(/^\\[a-zA-Z]+/.test(label.trim()))textMode='latex';
   }
   if(textMode==='latex')validateLatexInput(text);
   selected=append(doc,{type:tool,xy:pt,text,textMode,fontSize:tool==='node'?17:18}).id;
  }))afterOneConstruction();}
 }else if(tool==='morphism'){
  const id=e.target.closest('[data-id]')?.dataset.id,node=get(doc,id);
  if(node?.type!=='node'){notice('Choose a diagram node.');return;}
  if(!draftNode){draftNode=id;draftStart=node.xy;scheduleRender();}
  else{const start=draftNode;draftNode=null;draftStart=null;if(start!==id){const label=window.prompt('Morphism label (LaTeX):','');if(label!==null){if(label.length>1000)notice('Morphism label exceeds 1000 characters. Nothing was added.');else update(()=>{if(label.trim())validateLatexInput(label);selected=append(doc,{type:'morphism',refs:[start,id],text:label,textMode:'latex',bend:0,swap:false}).id;})&&afterOneConstruction();}}}
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
 hover=(drag||tool==='select'||tool==='pan')?world:tool==='point'?constructionPoint(world):constructionVertex(world);$('coords').textContent=`x ${formatCoordinate(world[0])} · y ${formatCoordinate(world[1])}`;
 if(drag?.kind==='pan-object-pending'&&Math.hypot(sx-drag.sx,sy-drag.sy)>4){
  const pending=drag,obj=get(doc,pending.id);
  drag=null;selectTool('select');select(pending.id);
  if(obj&&['point','node','text'].includes(obj.type))drag={kind:'point',pointerId:e.pointerId,id:pending.id,before:JSON.stringify(doc),sx:pending.sx,sy:pending.sy,moved:true,excluded:affected(doc,pending.id)};
  else drag={kind:'selected-object',pointerId:e.pointerId,id:pending.id};
 }
 if(drag?.kind==='marquee'){drag.ex=sx;drag.ey=sy;}
 if(drag?.kind==='pan'){view.cx=drag.cx-(sx-drag.sx)/view.scale;view.cy=drag.cy+(sy-drag.sy)/view.scale;}
 else if(drag?.kind==='point'){
  if(Math.hypot(sx-drag.sx,sy-drag.sy)>3)drag.moved=true;
  if(drag.moved){const o=get(doc,drag.id);if(o)o.xy=o.type==='point'?constructionPoint(world,drag.id):snapPoint(world,effectiveSnapSettings());}
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
    if(x>=0&&x<=size.w&&y>=0&&y<=size.h&&Math.hypot(x-tap.sx,y-tap.sy)<=10&&world.every(finite)){hover=world;performConstructionTap({clientX:e.clientX,clientY:e.clientY,target:e.target,constructionHitId:tap.hitId},tool==='point'?constructionPoint(world):constructionVertex(world));scheduleRender();}
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
 if(completed.kind==='pan'&&completed.emptyMove&&Math.hypot(endX-completed.sx,endY-completed.sy)<=4)select(null);
 if(completed.kind==='pan'&&released.every(finite)){
  // The final pointer-up position may not have had a preceding pointermove.
  view.cx=completed.cx-(endX-completed.sx)/view.scale;
  view.cy=completed.cy+(endY-completed.sy)/view.scale;
 }
 if(completed.kind==='marquee'){
  const canvas=$('drawing').getBoundingClientRect(),rects=new Map();
  for(const node of $('drawing').querySelectorAll('[data-id].clickable')){
   const id=node.dataset.id,o=get(doc,id);
   if(!o||o.hidden||o.style?.opacity===0)continue;
   const b=node.getBoundingClientRect();if(!b.width&&!b.height)continue;
   const local={left:b.left-canvas.left,top:b.top-canvas.top,right:b.right-canvas.left,bottom:b.bottom-canvas.top};
   const old=rects.get(id);
   rects.set(id,old?{left:Math.min(old.left,local.left),top:Math.min(old.top,local.top),right:Math.max(old.right,local.right),bottom:Math.max(old.bottom,local.bottom)}:local);
  }
  const found=windowSelection(rects,[completed.sx,completed.sy],[endX,endY]);
  if(found.length||Math.hypot(endX-completed.sx,endY-completed.sy)>4){
   const next=completed.additive?new Set([...selectedIds,...found]):new Set(found);
   setSelection(next,found.at(-1)||selected);
  }else if(!completed.additive)select(null);
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
  if(moved&&released.every(finite)&&(completed.moved||Math.hypot(endX-completed.sx,endY-completed.sy)>3))moved.xy=moved.type==='point'?constructionPoint(released,completed.id):snapPoint(released,effectiveSnapSettings());
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
  const {prepared}=preparedFreehand(completed.path,completed.startAttachment);
  const {path,closed,joinStyle}=prepared;
  if(path.length>=2){const start=path[0];const meaningful=closed||path.some(p=>Math.hypot(p[0]-start[0],p[1]-start[1])*view.scale>2);if(meaningful&&update(()=>selected=append(doc,{type:'freehand',path,closed,...(joinStyle?{joinStyle}:{})}).id))afterOneConstruction();}
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
  const title=document.createElement('span');title.className='trash-names';
  const names=entry.objects.map(o=>typeof o.name==='string'&&o.name.trim()?o.name.trim():o.id).filter(Boolean);
  title.textContent=`${names.join(', ')||entry.objects.length+' object(s)'} · ${new Date(entry.at).toLocaleString()}`;
  title.title=names.join(', ');
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
 if(doc.objects.some(o=>!o.hidden&&o.style?.opacity!==0&&['parallelThrough','perpendicularThrough','intersection','circleIntersection','circleCircleIntersection'].includes(o.type)))return false;
 if(doc.settings.showLabels&&doc.settings.labelPlacement==='avoid'&&doc.objects.some(o=>!o.hidden&&o.style?.opacity!==0&&['point','midpoint'].includes(o.type)))return false;
 if(tikzGeometryIssue(doc))return false;
 // Plain-text TikZ targets pdfLaTeX: reject unsupported Unicode/control labels
 // rather than enabling an export which cannot be compiled reliably.
 // TeX collapses leading/trailing and repeated spaces even when SVG preserves them.
 const safeText=s=>typeof s==='string'&&/^[\x20-\x7e]*$/.test(s)&&!/(^ | $| {2,})/.test(s);
 return doc.objects.every(o=>o.hidden||o.style?.opacity===0||(
  (!o.displayLabel||!doc.settings.showLabels)&&(!['point','midpoint','intersection','circleIntersection','circleCircleIntersection'].includes(o.type)||!doc.settings.showLabels||(!(o.pointLabel&&o.pointLabelMode==='latex')&&safeText(o.pointLabel||o.name)))&&
  (!['text','node','morphism'].includes(o.type)||(o.textMode!=='latex'&&safeText(o.text)))&&
  (o.type!=='node'||layoutNodeLabel(o.text,o.fontSize||17).lines.length===1)&&(o.type!=='morphism'||(o.arrowStyle===undefined||o.arrowStyle==='solid')&&(o.routing??'direct')==='direct'&&(o.labelT??.5)===.5&&(o.labelDistance??17)===17&&(o.labelDx??0)===0&&(o.labelDy??0)===0&&(!o.labelAvoid||!o.text))&&['point','midpoint','segment','arrow','line','circle','ellipse','rectangle','parallelogram','polygon','polyline','bezier','angle','regularPolygon','freehand','text','node','morphism'].includes(o.type)&&(o.type!=='freehand'||false)&&(o.type!=='morphism'||o.hidden||o.refs.every(id=>get(doc,id)?.type==='node'&&!get(doc,id)?.hidden&&get(doc,id)?.style?.opacity!==0))));}
function asTikz(){
 if(!canTikz())throw Error('TikZ export is unavailable for a visible unsupported object or label. Use SVG or JSON instead.');
 const lines=['\\begin{tikzpicture}[x=1cm,y=1cm,line cap=round,line join=round]'],resolver=createResolver(doc);
 const rgb=color=>`{rgb,255:red,${parseInt(color.slice(1,3),16)};green,${parseInt(color.slice(3,5),16)};blue,${parseInt(color.slice(5,7),16)}}`;
 for(const o of doc.objects){if(o.hidden||o.style?.opacity===0)continue;
  const style=`draw=${rgb(o.style.stroke)},line width=${(o.style.width*.75).toFixed(4)}pt,opacity=${o.style.opacity}`;
  const p=resolver.points(o);if(['point','midpoint','intersection','circleIntersection','circleCircleIntersection'].includes(o.type)){
   const xy=resolver.at(o.id);if(!xy)continue;lines.push(`\\fill[fill=${rgb(o.style.stroke)},opacity=${o.style.opacity}] ${texPoint(xy)} circle (${((o.style.pointSize??doc.settings.pointSize)*.75).toFixed(3)}pt);`);
   if(doc.settings.showLabels)lines.push(`\\node[above right,opacity=${o.style.opacity}] at ${texPoint(xy)} {${latexEscape(o.pointLabel||o.name)}};`);
  }else if(['segment','arrow','line'].includes(o.type)&&p.length===2&&p.every(Boolean)){
   let [a,b]=p;if(o.type==='line'){const d=[b[0]-a[0],b[1]-a[1]],len=Math.hypot(...d);if(!len)continue;const k=100/len;a=[a[0]-d[0]*k,a[1]-d[1]*k];b=[b[0]+d[0]*k,b[1]+d[1]*k];}
   lines.push(`\\draw[${style}${o.type==='arrow'?',->':''}] ${texPoint(a)} -- ${texPoint(b)};`);
  }else if(o.type==='circle'&&p.length===2&&p.every(Boolean)){
   lines.push(`\\draw[${style}] ${texPoint(p[0])} circle (${Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1]).toFixed(5)}cm);`);
   }else if(o.type==='ellipse'&&p.length===3&&p.every(Boolean)){
   const f=focalEllipse(p);if(!f)continue;
   const angle=(f.angle*180/Math.PI).toFixed(5);
   lines.push(`\\begin{scope}[shift={${texPoint([f.cx,f.cy])}},rotate=${angle}]`);
   lines.push(`\\draw[${style},fill=${rgb(o.style.fill)},fill opacity=${(.2*o.style.opacity).toFixed(3)}] (0,0) ellipse (${f.rx.toFixed(5)}cm and ${f.ry.toFixed(5)}cm);`);
   lines.push('\\end{scope}');
  }else if(o.type==='ellipse'&&p.length===2&&p.every(Boolean)){
   const cx=(p[0][0]+p[1][0])/2,cy=(p[0][1]+p[1][1])/2,rx=Math.abs(p[1][0]-p[0][0])/2,ry=Math.abs(p[1][1]-p[0][1])/2;
   if(rx<1e-9||ry<1e-9)lines.push(`\\draw[${style}] ${texPoint(p[0])} -- ${texPoint(p[1])};`);
   else lines.push(`\\draw[${style},fill=${rgb(o.style.fill)},fill opacity=${(.2*o.style.opacity).toFixed(3)}] ${texPoint([cx,cy])} ellipse (${rx.toFixed(5)}cm and ${ry.toFixed(5)}cm);`);
  }else if(['rectangle','parallelogram'].includes(o.type)&&p.every(Boolean)){
   const vertices=shapeVerticesFromPoints(o.type,p);if(vertices.length)lines.push(`\\draw[${style},fill=${rgb(o.style.fill)},fill opacity=${(.24*o.style.opacity).toFixed(3)}] ${vertices.map(texPoint).join(' -- ')} -- cycle;`);
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
 const fontMap={system:'system-ui, sans-serif',serif:'Georgia, serif',sans:'Arial, sans-serif',mono:'Consolas, monospace',verdana:'Verdana, sans-serif',trebuchet:'Trebuchet MS, sans-serif',palatino:'Palatino Linotype, serif',times:'Times New Roman, serif'};
 $('ui-font').value=fontMap[uiPrefs.font]?uiPrefs.font:'system';document.documentElement.style.setProperty('--ui-font',fontMap[$('ui-font').value]);
 $('ui-font').onchange=()=>{uiPrefs.font=$('ui-font').value;document.documentElement.style.setProperty('--ui-font',fontMap[uiPrefs.font]);savePrefs();};
 $('auto-pan').checked=uiPrefs.autoPan!==false;$('auto-pan').onchange=()=>{uiPrefs.autoPan=$('auto-pan').checked;savePrefs();};
 function applyLanguage(){closeObjectMenu();document.documentElement.lang=uiPrefs.language==='zh'?'zh':'en';localizeUI(document.documentElement,uiPrefs.language);updateModeLabel(tool);}
 $('ui-language').value=uiPrefs.language==='zh'?'zh':'en';
 const languageSwitch=$('ui-language');
 languageSwitch.title='Click once to switch English / 中文';
 languageSwitch.addEventListener('pointerdown',event=>{if(event.button===0){event.preventDefault();}});
 languageSwitch.addEventListener('click',event=>{if(event.detail!==0){languageSwitch.value=languageSwitch.value==='zh'?'en':'zh';languageSwitch.dispatchEvent(new Event('change',{bubbles:true}));}});
 languageSwitch.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();languageSwitch.value=languageSwitch.value==='zh'?'en':'zh';languageSwitch.dispatchEvent(new Event('change',{bubbles:true}));}});
 $('ui-language').onchange=()=>{uiPrefs.language=$('ui-language').value;savePrefs();applyLanguage();renderList();};applyLanguage();
 if(typeof uiPrefs.essentialGeometry!=='boolean')uiPrefs.essentialGeometry=true;
 $('geometry-essential').checked=uiPrefs.essentialGeometry;
 $('geometry-essential').onchange=()=>{uiPrefs.essentialGeometry=$('geometry-essential').checked;syncGeometryVisibility();savePrefs();};
 syncGeometryVisibility();
 // The docked Properties disclosure is exclusively owned by setupPropertiesLayout.
 // A second click handler here used to toggle the pane back open immediately.
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
 let dragged=null,dropTarget=null;
 function clearDropTarget(){if(!dropTarget)return;dropTarget.classList.remove('section-drop-target','section-drop-before','section-drop-after');dropTarget=null;}
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
  const toggle=document.createElement('button');toggle.type='button';toggle.className='section-toggle';
  toggle.setAttribute('aria-controls',body.id);
  const arrow=document.createElement('span');arrow.className='section-chevron';arrow.setAttribute('aria-hidden','true');
  const title=document.createElement('span');title.textContent=name;toggle.append(arrow,title);
  heading.replaceChildren(toggle);
  function updateDisclosure(){
   const collapsed=uiPrefs.collapsed[id]===true;
   body.hidden=collapsed;arrow.textContent=collapsed?'▸':'▾';toggle.setAttribute('aria-expanded',String(!collapsed));
   const prefix=translated(collapsed?'Expand section':'Collapse section',uiPrefs.language);
   toggle.setAttribute('aria-label',`${prefix}: ${translated(name,uiPrefs.language)}`);
   toggle.title=toggle.getAttribute('aria-label');
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
   clearDropTarget();dragged=section;section.classList.add('moving');event.dataTransfer.effectAllowed='move';
   event.dataTransfer.setData('text/plain',id);event.stopPropagation();
  });
  grip.addEventListener('dragend',()=>{section.classList.remove('moving');dragged=null;clearDropTarget();});
  grip.addEventListener('keydown',event=>{
   if(!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();moveSection(section,event.key==='ArrowUp'?-1:1);grip.focus();
  });
  section.addEventListener('dragover',event=>{
   if(!dragged||dragged===section||dragged.parentElement!==section.parentElement)return;
   event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='move';
   const before=event.clientY<section.getBoundingClientRect().top+section.offsetHeight/2;
   if(dropTarget!==section)clearDropTarget();
   dropTarget=section;section.classList.add('section-drop-target');
   section.classList.toggle('section-drop-before',before);section.classList.toggle('section-drop-after',!before);
  });
  section.addEventListener('drop',event=>{
   if(!dragged||dragged===section||dragged.parentElement!==section.parentElement)return;
   event.preventDefault();event.stopPropagation();const before=event.clientY<section.getBoundingClientRect().top+section.offsetHeight/2;
   clearDropTarget();
   section.parentElement.insertBefore(dragged,before?section:section.nextSibling);
   if(dragged.parentElement===palette)palette.append(settingsGroup);saveOrder();
  });
 }
 document.addEventListener('dragover',event=>{if(dragged&&!event.target.closest?.('.toolgroup,.controls,.geometry-subgroup'))clearDropTarget();});
 document.addEventListener('drop',clearDropTarget);
 for(const section of allSections)addDisclosure(section,section!==settingsGroup);
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
 const collapsed=side=>document.body.classList.contains(`${side}-collapsed`)||document.body.classList.contains(`${side==='left'?'objects':'tools'}-floating`);
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


/** Round 22: permanently docked inspector; sizing is browser-only and undo-free. */
function setupPropertiesLayout(mobile){
 const pane=$('properties-dock'),left=document.querySelector('.leftpanel'),panel=$('properties');
 const toggle=$('properties-toggle'),split=$('properties-splitter');
 let preferred=normalizePropertiesLayout(uiPrefs.propertiesPanel),gesture=null;
 $('properties-undock').hidden=true;
 function limits(){
  const fixed=[...left.children].filter(e=>e!==pane&&e.id!=='objects'&&!e.classList.contains('panel-resizer')).reduce((a,e)=>a+e.getBoundingClientRect().height,0);
  return fitDockPropertiesHeight(preferred.dockHeight,left.clientHeight,fixed);
 }
 function apply(){
  if(pane.parentElement!==left)left.append(pane);
  document.body.classList.remove('properties-floating','properties-moving','properties-resizing');
  panel.hidden=preferred.collapsed;toggle.disabled=false;toggle.textContent=panel.hidden?'+':'−';
  toggle.setAttribute('aria-expanded',String(!panel.hidden));
  toggle.setAttribute('aria-label',translated(panel.hidden?'Expand Properties':'Collapse Properties',uiPrefs.language));
  toggle.title=toggle.getAttribute('aria-label');
  pane.classList.toggle('is-folded',panel.hidden);
  for(const property of ['left','top','width','height'])pane.style.removeProperty(property);
  const h=limits();pane.style.setProperty('--mi-properties-height',`${h.height}px`);
  split.setAttribute('aria-valuemin',String(h.min));split.setAttribute('aria-valuemax',String(h.max));
  split.setAttribute('aria-valuenow',String(h.height));
  split.setAttribute('aria-valuetext',`${h.height} ${translated('pixels',uiPrefs.language)}`);
  split.setAttribute('aria-label',translated('Resize Properties height',uiPrefs.language));
  split.tabIndex=!mobile.matches&&!panel.hidden&&!document.body.classList.contains('left-collapsed')?0:-1;
 }
 function commit(next){preferred=normalizePropertiesLayout(next);uiPrefs.propertiesPanel={...preferred};savePrefs();apply();}
 function cancel(){if(!gesture)return;const {id}=gesture;gesture=null;document.body.classList.remove('properties-resizing');if(split.hasPointerCapture?.(id))split.releasePointerCapture(id);apply();}
 split.addEventListener('pointerdown',e=>{
  if(mobile.matches||gesture||panel.hidden||document.body.classList.contains('left-collapsed')||e.button!==0||!e.isPrimary)return;
  e.preventDefault();gesture={id:e.pointerId,y:e.clientY,height:limits().height,preview:null};
  split.setPointerCapture(e.pointerId);document.body.classList.add('properties-resizing');
 });
 split.addEventListener('pointermove',e=>{
  if(!gesture||e.pointerId!==gesture.id)return;
  const h=limits(),height=Math.max(h.min,Math.min(h.max,Math.round(gesture.height+gesture.y-e.clientY)));
  gesture.preview=height;pane.style.setProperty('--mi-properties-height',`${height}px`);
  split.setAttribute('aria-valuenow',String(height));
 });
 split.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const height=gesture.preview;cancel();if(height!==null)commit({...preferred,dockHeight:height});});
 for(const eventName of ['pointercancel','lostpointercapture'])split.addEventListener(eventName,e=>{if(gesture?.id===e.pointerId)cancel();});
 split.addEventListener('keydown',e=>{
  if(mobile.matches||gesture||panel.hidden||!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();const h=limits(),step=e.shiftKey?24:8;
  const height=e.key==='Home'?h.min:e.key==='End'?h.max:h.height+(e.key==='ArrowUp'?step:-step);
  commit({...preferred,dockHeight:Math.max(h.min,Math.min(h.max,height))});
 });
 split.addEventListener('dblclick',e=>{if(!mobile.matches&&!panel.hidden){e.preventDefault();commit({...preferred,dockHeight:PROPERTY_DOCK_DEFAULT});}});
 toggle.addEventListener('click',()=>commit({...preferred,collapsed:!panel.hidden}));
 window.addEventListener('keydown',e=>{if(gesture&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}},true);
 window.addEventListener('blur',cancel);window.addEventListener('resize',()=>{cancel();apply();});
 mobile.addEventListener('change',()=>{cancel();apply();});
 $('ui-language').addEventListener('change',apply);
 $('left-collapse').addEventListener('click',()=>queueMicrotask(apply));
 apply();return {apply};
}
/** Objects and Tools stay docked; only the established sidebars/drawers resize/collapse. */
function setupDockablePanels(mobile,propertiesLayout){
 const workspace=document.querySelector('.workspace');
 for(const side of ['left','right']){
  const button=$(side==='left'?'objects-undock':'tools-undock');button.hidden=true;
 }
 function apply(){
  document.body.classList.remove('objects-floating','tools-floating','floating-panel-moving','floating-panel-resizing');
  const left=document.querySelector('.leftpanel'),right=document.querySelector('.rightpanel');
  for(const pane of [left,right]){
   if(pane.parentElement!==workspace){if(pane===left)workspace.prepend(pane);else workspace.append(pane);}
   pane.classList.remove('floating-panel','floating-objects','floating-tools');
   for(const name of ['left','top','width','height','z-index'])pane.style.removeProperty(name);
  }
  if(mobile.matches)workspace.style.removeProperty('grid-template-columns');
  else workspace.style.gridTemplateColumns=`${document.body.classList.contains('left-collapsed')?'52px':'var(--mi-left-width,310px)'} minmax(240px,1fr) ${document.body.classList.contains('right-collapsed')?'52px':'var(--mi-right-width,305px)'}`;
  propertiesLayout.apply();
 }
 window.addEventListener('resize',apply);mobile.addEventListener('change',apply);
 apply();return {apply};
}

function initialise(){
 populateTools();setupSettings();setupInterface();$('objects').addEventListener('scroll',()=>{closeObjectMenu();renderListWindow();},{passive:true});
 const search=$('object-search');
 // Search stays visible. The magnifying glass is deliberately decorative.
 search.addEventListener('keydown',e=>{if(e.key==='Escape'&&search.value){e.stopPropagation();search.value='';renderList({resetScroll:true});}});
 document.addEventListener('pointerdown',e=>{if(objectMenuContext&&!$('object-action-menu').contains(e.target)&&!objectMenuContext.trigger.contains(e.target))closeObjectMenu();},true);
 document.addEventListener('focusin',e=>{if(objectMenuContext&&!$('object-action-menu').contains(e.target)&&!objectMenuContext.trigger.contains(e.target))closeObjectMenu();});
 window.addEventListener('resize',()=>closeObjectMenu());
 $('object-action-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeObjectMenu({restoreFocus:true});}
  else if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const entries=[...$('object-action-menu').querySelectorAll('button:not(:disabled)')];
   const index=entries.indexOf(document.activeElement);if(entries.length)entries[e.key==='Home'?0:e.key==='End'?entries.length-1:(index+entries.length+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1))%entries.length].focus();}});
 let old=null;
 try{old=localStorage.getItem(STORAGE);lastStored=old;saveStatus(old?'Recovered local project':'Local backup ready');}catch(e){saveStatus('Not saved locally · download JSON');notice('Browser storage is restricted: use Save to download JSON.');}
 if(old){try{doc=upgradeRecoveredLegacyPalette(validateDoc(JSON.parse(old)));}catch(e){setStorageConflict(true,'corrupt');notice('Recovered empty editor. Corrupt saved data is preserved until you explicitly choose Keep this tab.');}}
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
  if(draftStart||draftPoints.length||draftNode||draftReference){clearDraft();scheduleRender();}
 },{capture:true});
 const endOutside=e=>{if(e.pointerType==='touch'&&touchContacts.has(e.pointerId))pointerUp(e);};
 window.addEventListener('pointerup',endOutside);
 window.addEventListener('pointercancel',endOutside);

 svg.addEventListener('contextmenu',e=>e.preventDefault());
 svg.addEventListener('wheel',onWheel,{passive:false});svg.addEventListener('dblclick',e=>{
  if(['polygon','polyline','spline','closedSpline'].includes(tool)){e.preventDefault();finishDraft();}
  else if(['select','pan'].includes(tool)){e.preventDefault();select(null);}
 });
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
  else if(e.key==='Escape'){if(drag)cancelDrag();clearDraft();select(null);selectTool('select');}
  else if(e.key==='Enter'&&['polygon','polyline','spline','closedSpline'].includes(tool)){finishDraft();}
  else{const next=canvasShortcut(e,document.activeElement,$('drawing'));if(next){e.preventDefault();selectTool(next);}}
 });
 $('undo').onclick=undo;$('redo').onclick=redo;
 $('retry-autosave').onclick=()=>{if(storageConflict){saveStatus('Autosave paused · resolve conflict first');return;}
  if(!dirty){saveStatus('No unsaved local changes');return;}clearTimeout(saveTimer);persistNow();};
 $('object-search').oninput=()=>renderList({resetScroll:true});
 const plotInput=$('command'),plotY=$('command-y'),plotMode=$('plot-mode'),symbol=$('parameter-symbol');
 function syncPlotMode(){
  const mode=plotMode.value,two=['parametric','vectorField'].includes(mode);
  plotY.hidden=!two;symbol.hidden=mode!=='parametric';
  plotInput.setAttribute('aria-label',mode==='parametric'?`Parametric x(${symbol.value})`:mode==='vectorField'?'Vector X(x, y)':mode==='domainColoring'?'Complex F(z)':mode==='implicit'?'Implicit equation':'Function or construction command');
  plotInput.placeholder=mode==='parametric'?`cos(${symbol.value})`:mode==='vectorField'?'-y':mode==='domainColoring'?'z^2+1':mode==='implicit'?'x^2+y^2=1':'sin(x)';
  plotY.placeholder=mode==='parametric'?`sin(${symbol.value})`:mode==='vectorField'?'x':'';
 }
 plotMode.addEventListener('change',()=>{plotInput.value='';plotY.value='';syncPlotMode();plotInput.focus();});
 symbol.addEventListener('change',()=>{for(const input of [plotInput,plotY])input.value=['t','u','v'].reduce((v,ch)=>renameCurveParameter(v,ch,symbol.value),input.value);syncPlotMode();});syncPlotMode();
 $('command-form').onsubmit=e=>{e.preventDefault();const mode=plotMode.value,value=plotInput.value.trim(),y=plotY.value.trim();
  const success=update(()=>{
   let curve;
   if(mode==='parametric'){parseParametric(value,y,symbol.value);curve=append(doc,{type:'parametric',xExpr:value,yExpr:y,parameter:symbol.value,tMin:0,tMax:2*Math.PI});}
   else if(mode==='implicit'){parseImplicit(value);curve=append(doc,{type:'implicit',expr:value});}
   else if(mode==='vectorField'||mode==='domainColoring'){
    if(mode==='vectorField')parseVectorField(value,y);else parseComplexExpression(value);
    // The first region is a snapshot of the visible canvas, not a moving viewport.
    const a=unproject(0,size.h),b=unproject(size.w,0);
    const region={xMin:a[0],xMax:b[0],yMin:a[1],yMax:b[1]};validatePlotRegion(region);
    curve=mode==='vectorField'?append(doc,{type:mode,xExpr:value,yExpr:y,region,density:12,normalized:false}):append(doc,{type:mode,expr:value,region,resolution:128,colorMode:'phase-modulus'});
   }else{
    const construction=/^(?:[A-Za-z][A-Za-z0-9_]*\s*=\s*\(|[A-Za-z][A-Za-z0-9_]*\s*\(x\)\s*=|(?:Segment|Arrow|Line|Circle|Ellipse|Rectangle|Parallelogram|Polygon|Polyline|Bezier|Angle|Midpoint|Parallel|Perpendicular|Intersect|RegularPolygon|Morphism)\s*\()/i;
    if(construction.test(value))curve=command(doc,value);
    else {const expr=value.replace(/^y\s*=\s*/i,'');parseExpression(expr);curve=append(doc,{type:'function',expr});}
   }
   selected=curve.id;
  });
  if(success){plotInput.value='';plotY.value='';selectTool('select');}
 };
 $('new').onclick=()=>{if(!window.confirm('Start a new illustration? Download the current project first if needed.'))return;update(()=>{doc=newDoc();selected=null;view={cx:0,cy:0,scale:48};});};
 $('open').onclick=()=>$('open-file').click();$('open-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>12e6)throw Error('Project JSON exceeds 12 MB safety limit.');const readingRevision=documentRevision,readingGeneration=documentGeneration;const imported=validateDoc(JSON.parse(await file.text()));if(readingRevision!==documentRevision||readingGeneration!==documentGeneration)throw Error('The current project changed while reading this file. Import canceled to protect newer edits.');if(!window.confirm('Replace the current illustration with this JSON project?'))return;update(()=>{doc=imported;selected=null;});notice('Project opened.');}catch(err){notice('Open failed: '+err.message);}finally{e.target.value='';}};
 $('save').onclick=()=>download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),'mathillustrator.json');
 $('export-open').onclick=()=>{if(drag)cancelDrag();setupExport();$('export-menu').hidden=!$('export-menu').hidden;$('export-backdrop').hidden=$('export-menu').hidden;if($('export-menu').hidden)exportAbortToken++;else $('export-close').focus();};$('export-close').onclick=()=>{exportAbortToken++;$('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();};
 $('export-backdrop').onclick=()=>{exportAbortToken++;$('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();};
 $('help').onclick=()=>window.open('tutorial.html','_blank','noopener');$('show-hidden').onchange=()=>renderList({resetScroll:true});
 $('tikzcd-open').onclick=()=>{if(drag)cancelDrag();$('tikzcd-dialog').hidden=false;$('tikzcd-input').focus();};
 $('tikzcd-close').onclick=()=>{$('tikzcd-dialog').hidden=true;$('tikzcd-open').focus();};
 $('tikzcd-apply').onclick=()=>{try{const d=validateDoc(importTikzCd($('tikzcd-input').value));if(!window.confirm('Replace the current illustration with the imported diagram?'))return;const ok=update(()=>{doc=d;selected=null;});if(ok){$('tikzcd-dialog').hidden=true;$('tikzcd-open').focus();notice('Imported a semantic tikz-cd diagram.');}}catch(e){notice('Import failed: '+e.message);}};
 $('conflict-load').onclick=()=>{if(!window.confirm('Replace this tab with the newer local project? Download your current version first if needed.'))return;try{const latest=localStorage.getItem(STORAGE);if(!latest)throw Error('No saved project found.');if(drag)cancelDrag();doc=validateDoc(JSON.parse(latest));documentRevision++;documentGeneration++;clearDraft();clearTimeout(saveTimer);dirty=false;lastStored=latest;setStorageConflict(false);saveStatus('Loaded newer local project');history=[];future=[];selected=null;selectedIds.clear();syncHistory();renderAll();}catch(e){notice('Cannot load other tab: '+e.message);}};
 $('conflict-overwrite').onclick=()=>{if(!window.confirm('Overwrite the other tab’s local project with this tab’s version? This may discard its changes.'))return;try{lastStored=localStorage.getItem(STORAGE);setStorageConflict(false);enqueueSave();}catch(e){notice(e.message);}};
 window.addEventListener('blur',()=>{pendingTouchTap=null;touchContacts.clear();touchBlocked=false;if(drag)cancelDrag();if(draftStart||draftPoints.length||draftNode||draftReference){clearDraft();scheduleRender();}});
 document.addEventListener('visibilitychange',()=>{
  // A gesture in progress has not committed an undoable transaction. Do not
  // allow autosave or tab switching to preserve its temporary coordinates.
  if(document.visibilityState==='hidden'){pendingTouchTap=null;touchContacts.clear();touchBlocked=false;if(drag)cancelDrag();if(draftStart||draftPoints.length||draftNode||draftReference){clearDraft();scheduleRender();}if(dirty&&!storageConflict)persistNow();}
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
 const dockPanels=setupDockablePanels(mobile,propertyLayout,refreshPanelWidths);
 function syncPanelButtons(){
  $('left-collapse').textContent=mobile.matches?(document.body.classList.contains('mobile-left-open')?'×':'›'):(document.body.classList.contains('left-collapsed')?'›':'‹');
  $('right-collapse').textContent=mobile.matches?(document.body.classList.contains('mobile-right-open')?'×':'‹'):(document.body.classList.contains('right-collapsed')?'‹':'›');
  $('left-collapse').setAttribute('aria-expanded',String(mobile.matches?document.body.classList.contains('mobile-left-open'):!document.body.classList.contains('left-collapsed')));
  $('right-collapse').setAttribute('aria-expanded',String(mobile.matches?document.body.classList.contains('mobile-right-open'):!document.body.classList.contains('right-collapsed')));
  refreshPanelWidths();dockPanels.apply();
 }
 $('left-collapse').onclick=()=>{if(mobile.matches){document.body.classList.toggle('mobile-left-open');document.body.classList.remove('mobile-right-open');}else document.body.classList.toggle('left-collapsed');syncPanelButtons();};
 $('right-collapse').onclick=()=>{if(mobile.matches){document.body.classList.toggle('mobile-right-open');document.body.classList.remove('mobile-left-open');}else document.body.classList.toggle('right-collapsed');syncPanelButtons();};
 mobile.addEventListener('change',()=>{document.body.classList.remove('mobile-left-open','mobile-right-open');syncPanelButtons();});syncPanelButtons();

 const resize=new ResizeObserver(()=>{const b=svg.getBoundingClientRect();size={w:Math.max(1,Math.round(b.width)),h:Math.max(1,Math.round(b.height))};scheduleRender();});resize.observe(svg);
 // Toolbar height varies with font metrics, window width and localized labels.
 // Avoid hard-coded mobile drawer offsets that overlap the toolbar after wrapping.
 const bar=document.querySelector('.appbar'),barResize=new ResizeObserver(()=>{document.documentElement.style.setProperty('--appbar-height',`${bar.getBoundingClientRect().height}px`);dockPanels.apply();});barResize.observe(bar);
 document.documentElement.style.setProperty('--appbar-height',`${bar.getBoundingClientRect().height}px`);renderAll();
}
initialise();
