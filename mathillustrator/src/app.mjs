import {compileRegionCondition,inRegion} from './region_condition.mjs?cut=round130';
import {parseCurveExpression as r50ParseExpr} from './plot_modes.mjs?cut=round69';
import {r50Shape,r50SourceShape,projectToCurve,polylineCrossings,generalCrossings,circleTangents,TRANSFORM_MODES} from './geometry_round50.mjs?cut=round147';
import {toggleIds,windowSelection,commonValue,compatibleObjects} from './selection.mjs?cut=round69';
import {measureGeometry} from './geometry_measurements.mjs?cut=round76';
import {reorderVisible,shiftVisible} from './object_order.mjs?cut=round54';
import {canvasShortcut,shortcutForTool} from './keyboard_shortcuts.mjs?cut=round54';
import {TOOLS,POINT_LIKE,STRAIGHT_TYPES,pointRole,geometricPoint,geometricLine,geometricCircle,PRESETS,PRESET_MODULES,newDoc,upgradeRecoveredLegacyPalette,clone,append,appendPolygonEdges,appendDerivedShapeEdges,resizeRegularPolygon,isObjectVisible,get,position,points,remove,affected,snapPoint,focalEllipse,circumcircle,intersectStraightLines,intersectLineCircle,intersectCircles,circleGeometry,addPoint,createAnchored,createResolver,validateDoc,command,parseExpression,checkNewGeometry,guardAnchorMove,shapeVerticesFromPoints,finite,preserveInheritedPointSizes} from './model.mjs?cut=round147';
import {shapeFromStroke} from './freehand_shapes.mjs?cut=round146';
import {clipRay,smoothCurveSvg,freehandCurveSvg,smoothPath,closeFreehandStroke,nearestFreehandAttachment,worldBounds,pageRect,arrowCurve,regularPolygonVertices,arrowHeadPoints,clipInfiniteLine,formatCoordinate,fitSceneView,bboxOutsideViewport,circleOutsideViewport} from './geometry.mjs?cut=round147';
import {importTikzCd,exportTikzCd,canExportTikzCd} from './diagram.mjs?cut=round63';
import {sampleExplicitPlot,plotPath} from './plot.mjs?cut=round54';
import {newScene3D,add3DPlot,parse3D,validate3D,project3DScene,create3DProjectionTask,enforce3DVisibility,PLOT3D_MODES,parse3DRangeExpression,rampColor} from './plot3d.mjs?cut=round130';
import {parseParametric,parseImplicit,parseVectorField,parseComplexExpression,renameCurveParameter,validatePlotRegion,sampleVectorField,sampleDomainColors,MAX_DOMAIN_RESOLUTION,MAX_DOMAIN_PIXELS,sampleParametricPlot,sampleImplicitPlot} from './plot_modes.mjs?cut=round69';
import {mathReady,mathMetrics,renderLatexSvg,validateLatexInput} from './math_labels.mjs?cut=round54';
import {localizeUI,translated} from './i18n.mjs?cut=round54';
import {compareAndWrite,coordinateSave} from './storage.mjs?cut=round54';
import {tikzGeometryIssue,tikzPoint} from './export_fidelity.mjs?cut=round58';
import {nodeBox,layoutNodeLabel,edgeBetweenBoxes,plainNodeInkBox,boxEdgeToward} from './diagram_layout.mjs?cut=round54';
import {boxRect,routeDiagramEdge,pathData,smoothRoutePath,labelOnPolyline,labelOnQuadratic,labelDragOffset,hookTailGeometry} from './diagram_routing.mjs?cut=round63';
import {optimizeGlobalArrowRoutes} from './diagram_global_routing.mjs?cut=round54';
import {createAnchorIndex,cycleSelection} from './anchor_index.mjs?cut=round71';
import {layoutPointLabels,createLabelLayoutCache} from './label_layout.mjs?cut=round54';
import {createPlotCache} from './plot_cache.mjs?cut=round54';
import {layoutMorphismLabels,strokeObstacleRectangles} from './morphism_label_layout.mjs?cut=round54';
import {PANEL_MIN, PANEL_MAX, CANVAS_MIN, COLLAPSED_RAIL, validPanelWidth, fitPanels} from './panel_sizes.mjs?cut=round54';
import {PROPERTY_DOCK_DEFAULT, normalizePropertiesLayout, fitDockPropertiesHeight} from './properties_layout.mjs?cut=round54';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
// Large raster PNGs must remain cacheable: otherwise every redraw recomputes millions of samples.
const plotCache=createPlotCache({maxCharacters:12_000_000});
const labelCache=createLabelLayoutCache();
const limitedPlotKeys=new Set();let plotLimitedInScene=false;
const glyph={select:'<path d="M5 3L5 22L10 16L14 23L17 21L13 14L21 13Z"/>',pan:'<path d="M12 2V22M2 12H22M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3"/>',point:'<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>',segment:'<path d="M4 20L20 4"/><circle cx="4" cy="20" r="2" fill="currentColor"/><circle cx="20" cy="4" r="2" fill="currentColor"/>',arrow:'<path d="M3 20L21 4M13 4h8v8"/>',circle:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',rectangle:'<path d="M4 6H20V18H4Z"/><circle cx="4" cy="6" r="2" fill="currentColor"/><circle cx="20" cy="6" r="2" fill="currentColor"/><circle cx="20" cy="18" r="2" fill="currentColor"/><circle cx="4" cy="18" r="2" fill="currentColor"/>',polygon:'<path d="M6 3L18 3L22 12L18 21L6 21L2 12Z"/><circle cx="6" cy="3" r="2" fill="currentColor"/><circle cx="18" cy="3" r="2" fill="currentColor"/><circle cx="22" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="21" r="2" fill="currentColor"/><circle cx="6" cy="21" r="2" fill="currentColor"/><circle cx="2" cy="12" r="2" fill="currentColor"/>',polyline:'<path d="M3 17L8 5L14 13L21 4"/><circle cx="3" cy="17" r="2" fill="currentColor"/><circle cx="8" cy="5" r="2" fill="currentColor"/><circle cx="14" cy="13" r="2" fill="currentColor"/><circle cx="21" cy="4" r="2" fill="currentColor"/>',freehand:'<path d="M2 20C8-6 12 30 22 3"/>',text:'<path d="M3 6V3h18v3M12 3v18M8 21h8"/>'};
glyph.parallelogram='<path d="M3 18L16 18L21 6L8 6Z"/><circle cx="3" cy="18" r="2" fill="currentColor"/><circle cx="16" cy="18" r="2" fill="currentColor"/><circle cx="21" cy="6" r="2" fill="currentColor"/><circle cx="8" cy="6" r="2" fill="currentColor"/>';
glyph.line='<path d="M2 22L22 2"/><circle cx="7" cy="17" r="2" fill="currentColor" stroke="none"/><circle cx="17" cy="7" r="2" fill="currentColor" stroke="none"/>';glyph.ellipse='<ellipse cx="12" cy="12" rx="9" ry="7.2"/><circle cx="6.6" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="17.4" cy="12" r="2" fill="currentColor" stroke="none"/>'; glyph.bezier='<path d="M4 19C5 6 19 6 20 19"/><circle cx="4" cy="19" r="2" fill="currentColor"/><circle cx="20" cy="19" r="2" fill="currentColor"/>';glyph.regularPolygon='<path d="M12 1.5L21.99 8.76L18.18 20.49L5.82 20.49L2.01 8.76Z"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>';glyph.angle='<path d="M3.5 5L8.5 19H21M7 14.8Q10.6 13.8 12.6 19"/><circle cx="3.5" cy="5" r="2" fill="currentColor"/><circle cx="8.5" cy="19" r="2" fill="currentColor"/><circle cx="21" cy="19" r="2" fill="currentColor"/>';glyph.node='<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M8 12h8"/>';glyph.morphism='<rect x="2" y="8.5" width="5" height="7"/><rect x="17" y="8.5" width="5" height="7"/><path d="M9 12H15M12 9l3 3-3 3"/>'; 
glyph.arrow='<path d="M4 20L20 4M12 4H20V12"/><circle cx="4" cy="20" r="2" fill="currentColor"/><circle cx="20" cy="4" r="2" fill="currentColor"/>';
glyph.bezier='<path d="M3 19C5 4 19 4 21 19"/><circle cx="3" cy="19" r="2" fill="currentColor"/><circle cx="5" cy="4" r="2" fill="currentColor"/><circle cx="19" cy="4" r="2" fill="currentColor"/><circle cx="21" cy="19" r="2" fill="currentColor"/>';
glyph.midpoint='<path d="M4 20L20 4"/><circle cx="4" cy="20" r="2" fill="currentColor"/><circle cx="20" cy="4" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>';
glyph.ray='<path d="M4 20L22 2"/><circle cx="4" cy="20" r="2" fill="currentColor" stroke="none"/><circle cx="12.5" cy="11.5" r="2" fill="currentColor" stroke="none"/>' 
glyph.perpBisector='<path d="M4 12H20M12 3V21"/><path d="M12 15H15V12"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="2" fill="currentColor" stroke="none"/>'; 
glyph.circleDiameter='<circle cx="12" cy="12" r="8"/><path d="M4 12H20"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="2" fill="currentColor" stroke="none"/>'; 
glyph.circleThrough3='<circle cx="12" cy="12" r="8"/><circle cx="12" cy="4" r="2" fill="currentColor"/><circle cx="20" cy="12" r="2" fill="currentColor"/><circle cx="4" cy="12" r="2" fill="currentColor"/>';
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
  const value=role==='plot3d'?doc.scene3d?.plots.find(plot=>plot.id===selected3d)?.color:role==='default'?doc.settings[property]:role==='bulk'?commonValue(compatibleObjects(activeSelection(),property),property):get(doc,selected)?.style?.[property];
  if(typeof value!=='string')continue;
  for(const button of group.querySelectorAll('button[data-color]'))
   button.setAttribute('aria-pressed',String(button.dataset.color===value.toLowerCase()));
  // The property pane may keep keyboard focus after a transaction; update its
  // live picker without replacing the focused swatch or invalidating handlers.
  if(role==='object'||role==='bulk'||role==='plot3d'){
   const picker=group.previousElementSibling?.querySelector('input[type=color]');
   if(picker&&picker!==document.activeElement)picker.value=value;
  }
 }
}
function appendColorSwatches(parent,{scope,property,apply}){
 const group=document.createElement('div');group.className='color-swatches';group.dataset.colorSwatches=scope;
 group.dataset.colorProperty=property;group.setAttribute('role','group');
 group.setAttribute('aria-label',scope==='plot3d'?'Surface colors':property==='stroke'?'Stroke colors':'Fill colors');
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
glyph.parallelThrough='<path d="M2 7L22 7M2 18L22 18"/><circle cx="12" cy="7" r="2" fill="currentColor" stroke="none"/>';
glyph.perpendicularThrough='<path d="M2 18H22M12 2V22M12 15H15V18"/><circle cx="12" cy="7" r="2" fill="currentColor" stroke="none"/>';
glyph.circleCircleIntersection='<circle cx="8" cy="12" r="7"/><circle cx="16" cy="12" r="7"/><circle cx="12" cy="6.26" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="17.74" r="2" fill="currentColor" stroke="none"/>';
glyph.circleIntersection='<circle cx="12" cy="12" r="8"/><path d="M2 12H22"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="12" r="2" fill="currentColor" stroke="none"/>';
// Three construction clicks = exactly three identical 2px filled markers.
// The dashed-looking diagonal is the internal bisector of the right angle.
glyph.angleBisector='<path d="M6 5V19H20M6 19L17 8"/><circle cx="6" cy="5" r="2" fill="currentColor"/><circle cx="6" cy="19" r="2" fill="currentColor"/><circle cx="20" cy="19" r="2" fill="currentColor"/>';
// Two construction clicks: source point and existing straight object. The computed foot is not a control click.
glyph.perpendicularFoot='<path d="M3 19H21M10 3V19M10 15H14V19"/><circle cx="10" cy="3" r="2" fill="currentColor"/>';
glyph.intersection='<path d="M3 3L21 21M21 3L3 21"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>';
// Round 51: redraw only the Round 50+ construction glyphs. Uniform 2px
// filled dots indicate defining points when they clarify the construction;
// transformed images use crosses. Icons prioritize mathematically faithful
// placement over a rigid marker-per-click convention.
const r50Glyph=(path,markers)=>path+markers.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2" fill="currentColor" stroke="none"/>`).join('');
Object.assign(glyph,{
 pointOnObject:r50Glyph('<path d="M2 18Q10 2 22 8"/>',[[13.04,6.72]]),
 tangentCircle:'<circle cx="15" cy="13" r="6"/><path d="M15 3L10.2 9.4M15 3L19.8 9.4"/><circle cx="15" cy="3" r="2" fill="currentColor" stroke="none"/><circle cx="10.2" cy="9.4" r="2" fill="currentColor" stroke="none"/><circle cx="19.8" cy="9.4" r="2" fill="currentColor" stroke="none"/>',
 circularArc:r50Glyph('<path d="M4 16A8 8 0 0 1 20 16"/>',[[4,16],[12,8],[20,16]]),
 parabola:'<path d="M3 11.2Q12 18.4 21 11.2M2 20H22"/><circle cx="12" cy="8" r="2" fill="currentColor" stroke="none"/>',
 hyperbola:'<path d="M7.2 6.6C9.1 8.8 10.2 10.3 10.6 12C10.2 13.7 9.1 15.2 7.2 17.4M16.8 6.6C14.9 8.8 13.8 10.3 13.4 12C13.8 13.7 14.9 15.2 16.8 17.4"/><circle cx="5" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="8.3" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="15.7" cy="12" r="2" fill="currentColor" stroke="none"/>',
 generalIntersection:'<path d="M2 17Q12 5 22 17M3 5Q12 17 21 5"/><circle cx="12" cy="11" r="2" fill="currentColor" stroke="none"/>',
 reflection:'<path d="M12 2V22M3 12H21M16.8 10.2l3.6 3.6M20.4 10.2l-3.6 3.6"/><circle cx="7" cy="12" r="2" fill="currentColor" stroke="none"/>',
 rotation:'<path d="M6 6A8 8 0 0 1 20 14"/><path d="M4.2 4.2l3.6 3.6M7.8 4.2L4.2 7.8"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="14" r="2" fill="currentColor" stroke="none"/>',
 translation:'<path d="M6 7H12M4 17H10M8.2 15.2l3.6 3.6M11.8 15.2l-3.6 3.6"/><circle cx="6" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="17" r="2" fill="currentColor" stroke="none"/>',
 dilation:'<path d="M4 12H20M18.2 10.2l3.6 3.6M21.8 10.2l-3.6 3.6"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="12" r="2" fill="currentColor" stroke="none"/>',
 locus:'<path d="M2 18C7 3 10 20 14 10S19 8 22 5" stroke-dasharray="2 2"/><circle cx="14" cy="10" r="2" fill="currentColor" stroke="none"/>',
 fixedLength:r50Glyph('<path d="M4 20L20 4M9 12L12 15M12 9L15 12"/>',[[4,20],[20,4]]),
 fixedAngle:'<path d="M3.5 5L8.5 19H21M7.15 15.23A4 4 0 0 1 12.5 19M6.35 12.97A6.4 6.4 0 0 1 14.9 19"/><circle cx="3.5" cy="5" r="2" fill="currentColor" stroke="none"/><circle cx="8.5" cy="19" r="2" fill="currentColor" stroke="none"/><circle cx="21" cy="19" r="2" fill="currentColor" stroke="none"/>',
 triangleCenter:r50Glyph('<path d="M12 3L21 20H3Z M12 3V20 M3 20L16.5 11.5 M21 20L7.5 11.5"/><circle cx="12" cy="14.33" r="2" fill="none"/>',[[12,3],[21,20],[3,20]]),
 circleInversion:'<circle cx="12" cy="12" r="8.5"/><path d="M12 12H15.2M19.2 10.2l3.6 3.6M22.8 10.2l-3.6 3.6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="15.2" cy="12" r="2" fill="currentColor" stroke="none"/>'
});
// Round 51I: one point marker scale throughout both panels. The explicit
// geometry below uses true tangency, disjoint foci, and analytic inversion.
const GLYPH_POINT_RADIUS=2.8;
const glyphDot=(x,y)=>`<circle cx="${x}" cy="${y}" r="${GLYPH_POINT_RADIUS}" fill="currentColor" stroke="none"/>`;
const glyphDots=(positions)=>positions.map(([x,y])=>glyphDot(x,y)).join('');
const glyphCrossSectionCircle=(cx,cy,r)=>`<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const angleBase='<path d="M3.5 5L8.5 19H21"/>';
glyph.angle=angleBase+'<path d="M7 14.8Q10.6 13.8 12.6 19"/>'+glyphDots([[3.5,5],[8.5,19],[21,19]]);
glyph.fixedAngle=angleBase+'<path d="M7.15 15.23A4 4 0 0 1 12.5 19M6.35 12.97A6.4 6.4 0 0 1 14.9 19"/>'+glyphDots([[3.5,5],[8.5,19],[21,19]]);
// Same source construction shown by a more distant, oblique external point.
// Match the Circle glyph scale: the tangent target circle uses radius 8.
const tangentCenter=[15,14], tangentRadius=8, tangentSource=[2.8,3.2];
const tangentVector=[tangentSource[0]-tangentCenter[0],tangentSource[1]-tangentCenter[1]];
const tangentD2=tangentVector[0]**2+tangentVector[1]**2;
const tangentA=tangentRadius**2/tangentD2;
const tangentB=tangentRadius*Math.sqrt(tangentD2-tangentRadius**2)/tangentD2;
const tangentFoot=(sign)=>[tangentCenter[0]+tangentA*tangentVector[0]-sign*tangentB*tangentVector[1],tangentCenter[1]+tangentA*tangentVector[1]+sign*tangentB*tangentVector[0]];
const tangentFeet=[tangentFoot(-1),tangentFoot(1)];
glyph.tangentCircle=glyphCrossSectionCircle(...tangentCenter,tangentRadius)+tangentFeet.map(p=>`<path d="M${tangentSource.join(' ')}L${p.join(' ')}"/>`).join('')+glyphDots([tangentSource,...tangentFeet]);
// The vertices are unmarked; each focus is detached from both branches.
glyph.hyperbola='<path d="M2 4Q14 12 2 20M22 4Q10 12 22 20"/>'+glyphDots([[3.3,12],[20.7,12]]);
// No hollow image point or cross: every transformation uses filled points.
glyph.translation='<path d="M2 6H16.5M8.5 18H23"/>'+glyphDots([[2,6],[16.5,6],[8.5,18],[23,18]]);
glyph.reflection='<path d="M12 2V22M4 12H20"/>'+glyphDots([[5,12],[19,12]]);
// The rotation sweep is centered visually in the 24-unit icon rather than
// occupying one corner; the origin remains distinct from the two orbit points.
glyph.rotation='<path d="M2.4 15A10.8 10.8 0 0 1 21.6 15"/>'+glyphDots([[12,19.92],[2.4,15],[21.6,15]]);
glyph.dilation='<path d="M4 12H21"/>'+glyphDots([[4,12],[11,12],[21,12]]);
// Circle inversion: east-facing placement keeps the two points well separated
// while restoring the user-preferred direction and preserving reciprocal distances.
// C=(8,9), R=8, P'=(21.2,9), P=C+(R²/|P'-C|²)(P'-C).
// The inversion center is neither drawn nor connected to either point.
const inversionGlyphCenter=[8,9], inversionGlyphFar=[21.2,9];
const inversionGlyphScale=8**2/((inversionGlyphFar[0]-inversionGlyphCenter[0])**2+(inversionGlyphFar[1]-inversionGlyphCenter[1])**2);
const inversionGlyphNear=inversionGlyphCenter.map((v,i)=>v+inversionGlyphScale*(inversionGlyphFar[i]-v));
glyph.circleInversion=glyphCrossSectionCircle(...inversionGlyphCenter,8)+`<path d="M${inversionGlyphNear.join(' ')}L${inversionGlyphFar.join(' ')}"/>`+glyphDots([inversionGlyphNear,inversionGlyphFar]);
// Replace each *filled* glyph circle radius including older shared glyphs;
// geometric outlines with no fill remain unchanged.
for(const type of Object.keys(glyph))glyph[type]=glyph[type].replace(/<circle\b[^>]*\bfill="currentColor"[^>]*\/>/g,tag=>{
 // A filled point must never inherit SVG's outline stroke: the extra stroke
 // made 2.8-unit points look larger than neighbouring 2.8-unit points.
 const scaled=tag.replace(/\br="[^"]+"/,`r="${GLYPH_POINT_RADIUS}"`);
 return /\bstroke="[^"]+"/.test(scaled)?scaled.replace(/\bstroke="[^"]+"/,'stroke="none"'):scaled.replace(/\/>$/,' stroke="none"/>');
});
const toolGroups={
 'basic-tools':[['select','Move'],['pan','Pan']],
 'construction-tools':[['point','Point'],['midpoint','Midpoint'],['pointOnObject','Point on object'],['angle','Angle'],['fixedLength','Fixed length'],['fixedAngle','Fixed angle'],['segment','Segment'],['ray','Ray'],['arrow','Vector'],['line','Line'],['perpBisector','Perpendicular bisector'],['parallelThrough','Parallel through point'],['perpendicularThrough','Perpendicular through point'],['perpendicularFoot','Perpendicular foot'],['angleBisector','Angle bisector'],['circle','Circle'],['circleDiameter','Diameter circle'],['circleThrough3','3-point circle'],['circularArc','Circular arc'],['ellipse','Ellipse'],['tangentCircle','Tangents to circle'],['parabola','Parabola'],['hyperbola','Hyperbola'],['triangle','Triangle'],['rectangle','Rectangle'],['parallelogram','Parallelogram'],['polygon','Polygon'],['regularPolygon','Regular polygon'],['triangleCenter','Triangle centers'],['circleIntersection','Line–circle intersections'],['generalIntersection','General intersection'],['translation','Translation'],['reflection','Reflection'],['rotation','Rotation'],['dilation','Dilation'],['circleInversion','Circle inversion'],['polyline','Polyline'],['bezier','Bézier'],['spline','Spline'],['closedSpline','Closed spline'],['freehand','Free curve'],['locus','Locus / trace']],
 'transform-tools':[],
 'diagram-tools':[['node','Diagram node'],['morphism','Morphism'],['text','Text']]
};
// An interface-only visibility preference: advanced tools remain functional in
// existing projects and are never lost from JSON, undo history or SVG export.
const ESSENTIAL_GEOMETRY=new Set(['point','segment','arrow','line','angle','circle','ellipse','rectangle','parallelogram','polygon','regularPolygon','polyline','bezier','spline','freehand']);
const geometryCategories=[
 {id:'basic-points',title:'Points & measurements',tools:['point','midpoint','pointOnObject','angle','fixedLength','fixedAngle']},
 {id:'lines-constructions',title:'Lines & constructions',tools:['segment','ray','arrow','line','perpBisector','parallelThrough','perpendicularThrough','perpendicularFoot','angleBisector']},
 {id:'circles-conics',title:'Circles & conics',tools:['circle','circleDiameter','circleThrough3','circularArc','ellipse','tangentCircle','parabola','hyperbola']},
 {id:'polygons-centers',title:'Polygons & centers',tools:['triangle','rectangle','parallelogram','polygon','regularPolygon','triangleCenter']},
 {id:'intersections',title:'Intersections',tools:['circleIntersection','generalIntersection']},
 {id:'transformations',title:'Transformations',tools:['translation','reflection','rotation','dilation','circleInversion']},
 {id:'curves',title:'Curves & loci',tools:['polyline','bezier','spline','closedSpline','freehand','locus']}
];
const touchContacts=new Set();let touchBlocked=false,pendingTouchTap=null,lastMoveCanvasTap=null;
let currentMorphismLabels=new Map();
const selectedIds=new Set();
const constructionEmphasis=new Set(); // transient reference highlighting, never persisted
let gridSnapOverride=null; // transient tool-context preference, never written into project JSON
let draftMeasure=null,draftReference=null,trash=[],doc=newDoc(),selected=null,tool='select',drag=null,draftStart=null,draftPoints=[],hover=null,view={cx:0,cy:0,scale:48},size={w:900,h:600},history=[],future=[],saveTimer=null,dirty=false,lastRender=0,frame=0,draftNode=null,lastStored=null,storageConflict=false,documentRevision=0,documentGeneration=0;
const STORAGE='mathillustrator-project-v1',SETTINGS='mathillustrator-ui-v1',TRASH='mathillustrator-trash-v1';
/** Existing editor choice wins; otherwise follow the site theme key when present. */
function initialSiteTheme(){
 try{const own=JSON.parse(localStorage.getItem(SETTINGS)||'{}').theme;if(['light','dark'].includes(own))return own;}catch{}
 for(const name of ['theme','site-theme','shaodaji-theme','shaodaji_theme']){
  try{const raw=localStorage.getItem(name);if(raw){const value=raw.replace(/^\"|\"$/g,'').toLowerCase();if(['dark','light'].includes(value))return value;}}catch{}
 }
 return 'dark'; // The site's default navy appearance; the user's explicit choice remains authoritative.
}
let selected3d=null, cameraDrag=null;
const in3D=()=>doc.settings.plot3dEnabled===true;
let uiPrefs={language:'en',font:'system',autoPan:true,autoDiagramLabels:true,showTooltips:true,fast3DOrbit:true,sections:[],geometryGroups:[],collapsed:{}};
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
 constructionEmphasis.clear();
 const available=new Set(doc.objects.map(o=>o.id));
 selectedIds.clear();
 for(const id of ids)if(available.has(id))selectedIds.add(id);
 selected=primary&&selectedIds.has(primary)?primary:[...selectedIds].at(-1)||null;
 syncDiagramSnapFocus(true);
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
function restore(s){constructionEmphasis.clear();lastMoveCanvasTap=null;doc=validateDoc(JSON.parse(s));if(doc.scene3d)enforce3DVisibility(doc.scene3d);documentRevision++;documentGeneration++;selected=null;activeSelection();clearDraft();enqueueSave();renderAll();}
function undo(){if(drag){cancelDrag();return;}if(!history.length)return;future.push(JSON.stringify(doc));restore(history.pop());syncHistory();}
function redo(){if(drag){cancelDrag();return;}if(!future.length)return;history.push(JSON.stringify(doc));restore(future.pop());syncHistory();}
let pendingPropertiesFrame=0;
function refreshAfterMutation(forceProperties=false){
 syncDiagramSnapFocus(true);renderList();syncSettings();render();
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
 try{mutator();if(in3D()&&doc.scene3d)enforce3DVisibility(doc.scene3d,selected3d);validateDoc(doc);}catch(e){doc=JSON.parse(old);selected=previousSelected;selectedIds.clear();for(const id of previousIds)selectedIds.add(id);notice(e.message);if(renderCanvas)refreshAfterMutation(true);else syncSettings();return false;}
 const replaced=doc!==beforeDoc;
 if(replaced){lastMoveCanvasTap=null;documentGeneration++;selectedIds.clear();selected=null;clearDraft();}
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
function desc(o,nameById=null){
 // Hover/search may show dependencies, but never invent '?' for unavailable names.
 const referenceNames=()=>Array.isArray(o.refs)?o.refs.map(id=>nameById?.get(id)||get(doc,id)?.name).filter(Boolean):[];
 const namedRefs=()=>{const names=referenceNames();return names.length===o.refs?.length?names.join(' and '):'';};
 if(o.type==='point')return `(${o.xy.map(formatCoordinate).join(', ')})`;
 if(o.type==='midpoint')return `Midpoint${namedRefs()?' of '+namedRefs():''}`;
 if(o.type==='function')return `y = ${o.expr}`;
 if(o.type==='parametric'&&o.polar)return `r(t) = ${o.rExpr}, [${o.tMin}, ${o.tMax}], radius [${o.rMin}, ${o.rMax}]`;
 if(o.type==='parametric')return `x(${o.parameter||'u'}) = ${o.xExpr}; y(${o.parameter||'v'}) = ${o.yExpr}, [${o.tMin}, ${o.tMax}]`;
 if(o.type==='vectorField')return `(${o.xExpr}, ${o.yExpr}), ${o.density} arrows across x`;
 if(o.type==='domainColoring')return `F(z) = ${o.expr}`;
 if(o.type==='implicit')return o.expr.includes('=')?o.expr:`${o.expr} = 0`;
 if(o.type==='circleThrough3')return 'circle through 3 points';
 if(o.type==='perpBisector')return 'perpendicular bisector';
 if(o.type==='parallelThrough')return 'Parallel line'+(referenceNames()[1]?' through '+referenceNames()[0]+', relative to '+referenceNames()[1]:'');
 if(o.type==='perpendicularThrough')return 'Perpendicular line'+(referenceNames()[1]?' to '+referenceNames()[1]:'');
 if(o.type==='perpendicularFoot')return 'Perpendicular foot'+(namedRefs()?' of '+namedRefs():'');
 if(o.type==='circleCircleIntersection')return 'Circle–circle intersection'+(namedRefs()?' of '+namedRefs():'');
 if(o.type==='circleIntersection')return 'Line–circle intersection'+(namedRefs()?' of '+namedRefs():'');
 if(o.type==='intersection')return 'Intersection'+(namedRefs()?' of '+namedRefs():'');
 if(o.type==='spline')return o.closed?'closed spline':'spline';
 if(o.type==='ray')return 'ray';
 if(o.type==='regularPolygon')return `Regular polygon · ${o.sides} sides`;
 if(o.type==='parallelogram')return 'parallelogram · 3 defining vertices';
 if(o.type==='text')return o.text;
 if(o.refs)return `${o.type}${namedRefs()?' ('+referenceNames().join(', ')+')':''}`;
 if(o.path)return `${o.path.length} path points`;
 return o.type;
}
function simple(a,b){return Math.round(a*100)/100===Math.round(b*100)/100;}
function drawBackground(svg,includeGrid=true,exporting=false,guidesOnly=false){if(!guidesOnly&&!(exporting&&doc.settings.exportTransparent))svg.append(el('rect',{x:0,y:0,width:size.w,height:size.h,fill:doc.settings.background||'#fff'}));
 const settings=doc.settings;if(!guidesOnly&&settings.page!=='infinite'&&!exporting){
  const r=pageRect(size,settings.page);svg.append(el('rect',{x:r.x,y:r.y,width:r.width,height:r.height,fill:'none',stroke:'#94a3b8','stroke-width':1.5,'stroke-dasharray':'5 4',opacity:.8}));
 }
 if(!includeGrid)return;
 const minX=view.cx-size.w/(2*view.scale),maxX=view.cx+size.w/(2*view.scale),minY=view.cy-size.h/(2*view.scale),maxY=view.cy+size.h/(2*view.scale);
 let step=Number(settings.snapStep)||.5;while(step*view.scale<24)step*=2;while(step*view.scale>100)step/=2;
 if(settings.grid){const g=el('g',{'stroke':'#9daec1','stroke-width':.65,opacity:.28,'pointer-events':'none'});for(let x=Math.ceil(minX/step)*step,n=0;x<=maxX&&n<150;x+=step,n++){const [sx]=project([x,0]);g.append(el('line',{x1:sx,y1:0,x2:sx,y2:size.h}));}for(let y=Math.ceil(minY/step)*step,n=0;y<=maxY&&n<150;y+=step,n++){const [,sy]=project([0,y]);g.append(el('line',{x1:0,y1:sy,x2:size.w,y2:sy}));}svg.append(g);}
 if(settings.showAxes){const [zx,zy]=project([0,0]),g=el('g',{stroke:'#738396','stroke-width':1,'pointer-events':'none'});if(zx>=0&&zx<=size.w)g.append(el('line',{x1:zx,y1:0,x2:zx,y2:size.h}));if(zy>=0&&zy<=size.h)g.append(el('line',{x1:0,y1:zy,x2:size.w,y2:zy}));svg.append(g);}
 // Construction axes are virtual, immutable objects: reuse the visible guides
 // rather than introducing draggable, serialized, or duplicate lines.
 // Do not place any hit overlay in exports or over normal editable objects.
 if(settings.showAxes&&!exporting){const [zx,zy]=project([0,0]);const hits=el('g',{stroke:'transparent','stroke-width':12,'pointer-events':'none'});
  if(zy>=0&&zy<=size.h)hits.append(el('line',{x1:0,y1:zy,x2:size.w,y2:zy,'data-axis':'axis-x','pointer-events':'stroke'}));
  if(zx>=0&&zx<=size.w)hits.append(el('line',{x1:zx,y1:0,x2:zx,y2:size.h,'data-axis':'axis-y','pointer-events':'stroke'}));svg.append(hits);
 }
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
 // A transformed copy's label belongs to its *image*, not to the midpoint of
 // the source and its transformation reference (which may be a circle/line).
 if(o.type==='transformCopy'){
  const image=r50Shape(o,resolver,96).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
  return image.length?project(image[Math.floor((image.length-1)/2)]):null;
 }
 if(o.type==='function'){
  try{const y=parseExpression(o.expr)(view.cx);return Number.isFinite(y)?project([view.cx,y]):null;}catch{return null;}
 }
 if(o.type==='parametric'){try{return project(parseParametric(o.xExpr,o.yExpr,o.parameter)((o.tMin+o.tMax)/2));}catch{return null;}}
 if(o.type==='implicit')return null;
 if(['vectorField','domainColoring'].includes(o.type))return project([(o.region.xMin+o.region.xMax)/2,(o.region.yMin+o.region.yMax)/2]);
 if(o.type==='freehand')return o.path?.length?project(o.path[Math.floor(o.path.length/2)]):null;
 if(['parallelThrough','perpendicularThrough','tangentCircle','fixedLength'].includes(o.type)){
  const line=resolver.line(o);return line?project(line.a):null;
 }
 const p=resolver.points(o);
 if(!p.length||!p.every(Boolean))return null;
 if(o.type==='ellipse'&&p.length===3)return project([(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2]);
 if(o.type==='circle'||o.type==='regularPolygon')return project(p[0]);
 if(['rectangle','parallelogram'].includes(o.type)){const vertices=shapeVerticesFromPoints(o.type,p);if(!vertices.length)return null;return project([vertices.reduce((v,q)=>v+q[0],0)/4,vertices.reduce((v,q)=>v+q[1],0)/4]);}
 return project([p.reduce((sum,pt)=>sum+pt[0],0)/p.length,p.reduce((sum,pt)=>sum+pt[1],0)/p.length]);
}
function r50PointPosition(o,resolver){
 if(!o)return null;
 if(o.type==='transformCopy'){
  if(!geometricPoint(o,resolver))return null;
  return r50Shape(o,resolver,2)[0]||null;
 }
 return resolver.at(o.id);
}
function r50Locus(o){
 const target=get(doc,o.refs?.[0]),driver=get(doc,o.refs?.[1]);
 if(!target||driver?.type!=='pointOnObject'||doc.objects.length>250)return [];
 const count=128,points=[];
 // Pure document snapshots: never rewrite a live object during sampling.
 // Cached by document revision to avoid redundant sampling during viewport pan.
 const key=`${documentRevision}/${o.id}`;
 if(!r50Locus.cache)r50Locus.cache=new Map();
 if(drag?.kind!=='point'&&r50Locus.cache.has(key))return r50Locus.cache.get(key);
 const driverCopy={...driver};
 const temp={...doc,objects:doc.objects.map(item=>item.id===driver.id?driverCopy:item)};
 for(let i=0;i<=count;i++){
  driverCopy.parameter=i/count;
  const p=r50PointPosition(target,createResolver(temp));
  points.push(p&&p.every(Number.isFinite)?p:null);
 }
 // Gaps are significant: never join across a singular/undefined parameter.
 if(r50Locus.cache.size>16)r50Locus.cache.clear();if(drag?.kind!=='point')r50Locus.cache.set(key,points);
 return points;
}

// Round 58: independent line pattern and arrow-tip conventions; existing freehand
// arrows deliberately keep their filled, non-LaTeX appearance.
const LINE_CHOICES=[['solid','Solid'],['dashed','Dashed'],['dotted','Dotted'],['double','Double'],['wavy','Wavy']];
const HEAD_CHOICES=[['none','None'],['end','End'],['start','Start'],['both','Both'],['double-end','Double end'],['hook','Hook'],['tail','Tail'],['harpoon','Harpoon']];
const FREE_CURVE_HEAD_CHOICES=HEAD_CHOICES.slice(0,4);
const HEADLESS_LINE_STYLES=new Set(['double','wavy']);
const SHAPE_CHOICES=[['free','Free'],['ellipse','Ellipse'],['polygon','Polygon']];
const SHAPE_LINE_CHOICES=LINE_CHOICES.slice(0,3);
let freehandShapeMode='free',freehandRegular=true,freehandLine='solid',freehandHeads='none';
const visibleArrowheads=(line,heads)=>HEADLESS_LINE_STYLES.has(line)?'none':heads;
function inheritedMorphismAppearance(o){
 const old=o.arrowStyle||'solid';
 return {line:o.morphismLine||({'dashed':'dashed','dotted':'dotted','hook-dashed':'dashed'}[old]||'solid'),
  heads:o.morphismHeads||({'hook':'hook','hook-dashed':'hook','twohead':'both','tail':'tail'}[old]||'end')};
}
function styleDecoratedPath(parent,path,line,mk){
 if(line==='dashed')path.setAttribute('stroke-dasharray','7 5');
 if(line==='dotted')path.setAttribute('stroke-dasharray','2 5');
 if(!['double','wavy'].includes(line))return;
 const length=path.getTotalLength();if(!(length>1))return;
 // Take normals from the rendered SVG, not from unsmoothed control chords.
 const steps=Math.max(4,Math.min(600,Math.ceil(length/2.5)));
 const sample=(t,offset=0)=>{const at=Math.max(0,Math.min(length,t)),pt=path.getPointAtLength(at);
  const prev=path.getPointAtLength(Math.max(0,at-0.6)),next=path.getPointAtLength(Math.min(length,at+0.6));
  const dx=next.x-prev.x,dy=next.y-prev.y,n=Math.hypot(dx,dy)||1;
  return [pt.x-dy/n*offset,pt.y+dx/n*offset];};
 const trace=(fn)=>{let d='';for(let i=0;i<=steps;i++){const v=sample(i*length/steps,fn(i*length/steps));d+=(i?'L':'M')+v[0].toFixed(2)+' '+v[1].toFixed(2)+' ';}return d;};
 path.setAttribute('stroke','none');
 if(line==='double')for(const side of [-1,1])parent.append(mk('path',{d:trace(()=>side*2.1),fill:'none','stroke-width':Math.max(.8,Number(path.getAttribute('stroke-width'))||1)}));
 else parent.append(mk('path',{d:trace(t=>2.8*Math.sin(t*Math.PI/8)),fill:'none'}));
}
function decoratedHeads(group,path,mode,stroke,width,latex=false,lineStyle='solid',swapSide=false){
 if(mode==='none')return;
 const len=path.getTotalLength();if(!(len>0.5))return;
 const pointAt=t=>{const v=path.getPointAtLength(Math.max(0,Math.min(len,t)));return [v.x,v.y]};
 const head=(atStart,shift=0,kind='normal')=>{
  const endpoint=atStart?pointAt(shift):pointAt(len-shift),inward=atStart?pointAt(shift+Math.min(12,len*.45)):pointAt(len-shift-Math.min(12,len*.45));
  // Freehand stroke caps project beyond the SVG endpoint. Put the sharp tip
  // just past that cap; keep mathematical morphism tips at their endpoints.
  const vx=endpoint[0]-inward[0],vy=endpoint[1]-inward[1],vlen=Math.hypot(vx,vy);
  const advance=!latex&&vlen>1e-5?Math.min(2.5,Math.max(.55,width/2+.35)):0;
  const tip=vlen>1e-5?[endpoint[0]+vx/vlen*advance,endpoint[1]+vy/vlen*advance]:endpoint;
  const dx=tip[0]-inward[0],dy=tip[1]-inward[1],norm=Math.hypot(dx,dy);if(norm<1e-5)return;
  const ux=dx/norm,uy=dy/norm,px=-uy,py=ux,size=Math.min(8,Math.max(5,4.8+width*.6));
  if(latex){const branches=kind==='harpoon'?[swapSide?-1:1]:[-1,1];
   for(const sign of branches){const bx=tip[0]-size*ux+sign*size*.45*px,by=tip[1]-size*uy+sign*size*.45*py;
    group.append(el('path',{d:`M${bx} ${by}L${tip[0]} ${tip[1]}`,stroke,'stroke-width':Math.max(.9,width),'stroke-linecap':'round',fill:'none','pointer-events':'none',class:'latex-morphism-tip'}));}
  }else{const headWidth=!latex&&lineStyle==='double'?Math.max(width,3.5):width;
   const pts=arrowHeadPoints(tip,inward,headWidth);if(pts.length)group.append(el('polygon',{class:'arrowhead freehand-arrowhead',points:pts.map(v=>v.join(',')).join(' '),fill:stroke,'pointer-events':'none'}));}
 };
 if(mode==='start'||mode==='both')head(true);
 if(['end','both','double-end','hook','tail','harpoon'].includes(mode))head(false,0,mode==='harpoon'?'harpoon':'normal');
 if(mode==='double-end')head(false,7);
 if(mode==='tail'){
  const a=pointAt(0),b=pointAt(Math.min(9,len*.4)),dx=b[0]-a[0],dy=b[1]-a[1],r=Math.hypot(dx,dy)||1,px=-dy/r,py=dx/r;
  group.append(el('line',{x1:a[0]-px*6,y1:a[1]-py*6,x2:a[0]+px*6,y2:a[1]+py*6,stroke,'stroke-width':Math.max(.9,width),fill:'none','pointer-events':'none'}));
 }
}

function renderObject(svg,o,resolver,exporting=false,labelPositions=null,diagramBoxes=null,morphismLabels=null,morphismRoutes=null){
 if(!isObjectVisible(doc,o,resolver.object))return;
 const pointObject=geometricPoint(o,resolver);
 const isSel=(selectedIds.has(o.id)||selected===o.id||constructionEmphasis.has(o.id)||draftReference===o.id)&&!exporting,sty=attr(o,isSel),p=resolver.points(o);
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
 if(pointObject){
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
 }else if(o.type==='transformCopy'&&geometricLine(o,resolver)){
  // Affine images of straight objects are exact geometric lines, not short
  // sampled strokes that visually stop while their analytic line continues.
  const line=resolver.line(o);
  let a=project(line.a),b=project([line.a[0]+line.d[0]*line.length,line.a[1]+line.d[1]*line.length]);
  if(line.domain==='infinite'){
   const clipped=clipInfiniteLine(a,b,size.w,size.h);if(!clipped)return;[a,b]=clipped;
  }else if(line.domain==='ray'){
   const clipped=clipRay(a,b,size.w,size.h);if(!clipped)return;[a,b]=clipped;
  }
  let source=o;
  while(source?.type==='transformCopy')source=resolver.object(source.refs?.[0]);
  if(source?.type==='arrow'){
   const head=arrowHeadPoints(b,a,o.style.width);
   item=el('g');item.append(mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'}));
   if(head.length)item.append(el('polygon',{class:'arrowhead',points:head.map(q=>q.join(',')).join(' '),fill:o.style.stroke,opacity:sty.opacity,'pointer-events':'none'}));
  }else item=mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'});
 }else if(o.type==='transformCopy'&&geometricCircle(o,resolver)){
  // A similarity image of a circle remains exactly circular, even at high zoom.
  const c=resolver.circle(o),[cx,cy]=project(c.center),radius=c.radius*view.scale;
  if(circleOutsideViewport([cx,cy],radius,size.w,size.h,cullMargin))return;
  item=mk('circle',{cx,cy,r:radius,fill:'none'});
 }else if(['circularArc','parabola','hyperbola','transformCopy','fixedAngle','locus'].includes(o.type)){
  const path=o.type==='locus'?r50Locus(o):r50Shape(o,resolver,Math.min(160,Math.max(80,Math.ceil(size.w/7))));
  if(path.length===1&&Array.isArray(path[0])){const [x,y]=project(path[0]);item=mk('circle',{cx:x,cy:y,r:4,fill:o.style.stroke});}
  else if(path.length>1){
   const pieces=[];let current=[];
   for(const point of path){
    const xy=point?.length===2?project(point):null;
    if(xy?.every(Number.isFinite))current.push(xy);
    else {if(current.length>1)pieces.push(current);current=[];}
   }
   if(current.length>1)pieces.push(current);
   if(pieces.length){
    if(pieces.length===1)item=mk('polyline',{points:pieces[0].map(pt=>pt.join(',')).join(' '),fill:'none'});
    else {item=mk('g',{});for(const part of pieces)item.append(el('polyline',{points:part.map(pt=>pt.join(',')).join(' '),fill:'none'}));}
   }
  }
 }else if(['segment','arrow','line','ray','perpBisector','angleBisector','parallelThrough','perpendicularThrough','tangentCircle','fixedLength'].includes(o.type)){
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
  }else if(o.type==='tangentCircle'){
   item=el('g');item.append(mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'}));
   const feet=circleTangents(resolver.at(o.refs[0]),resolver.circle(o.refs[1]));
   const foot=feet[feet.length===1?0:o.branch===1?1:0];
   if(foot){const [x,y]=project(foot);item.append(el('circle',{cx:x,cy:y,r:Math.max(3,Number(o.style.pointSize??doc.settings.pointSize)||5),fill:o.style.stroke,opacity:sty.opacity,'pointer-events':'none'}));}
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
   transform:`rotate(${-f.angle*180/Math.PI} ${cx} ${cy})`,'fill-opacity':.20,fill:o.ellipseFilled===false?'none':sty.fill});
 }else if(o.type==='ellipse'&&coords?.length===2){
  const a=coords[0],b=coords[1],rx=Math.abs(a[0]-b[0])/2,ry=Math.abs(a[1]-b[1])/2;
  // Render historical v1 flattened ellipses as their limiting line, not invisible SVG ellipses.
  item=rx<1e-7||ry<1e-7 ?mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none'})
   :mk('ellipse',{cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2,rx,ry,'fill-opacity':.20,fill:o.ellipseFilled===false?'none':sty.fill});
 }else if(['rectangle','parallelogram'].includes(o.type)&&p.every(Boolean)){
  const vertices=shapeVerticesFromPoints(o.type,p).map(project);
  if(vertices.length&&bboxOutsideViewport(vertices,size.w,size.h,cullMargin))return;
  if(vertices.length)item=mk('polygon',{points:vertices.map(q=>q.join(',')).join(' '),'fill-opacity':.24});
 }else if(['polygon','polyline'].includes(o.type)&&coords?.length>=2){item=mk(o.type==='polygon'?'polygon':'polyline',{points:coords.map(q=>q.join(',')).join(' '),fill:o.type==='polygon'?sty.fill:'none','fill-opacity':.24});
 }else if(o.type==='regularPolygon'&&p.length===2&&p.every(Boolean)){const vertices=regularPolygonVertices(p[0],p[1],o.sides).map(project);if(bboxOutsideViewport(vertices,size.w,size.h,cullMargin))return;if(vertices.length)item=mk('polygon',{points:vertices.map(q=>q.join(',')).join(' '),'fill-opacity':.24});
 }else if(o.type==='spline'&&coords?.length>=3){item=mk('path',{d:smoothCurveSvg(coords,!!o.closed),fill:'none'});
 }else if(o.type==='bezier'&&coords?.length===4){item=mk('path',{d:`M${coords[0].join(' ')} C${coords[1].join(' ')},${coords[2].join(' ')},${coords[3].join(' ')}`,fill:'none'});
 }else if(o.type==='angle'&&coords?.length===3){const [a,b,c]=coords,r=26,theta1=Math.atan2(a[1]-b[1],a[0]-b[0]),theta2=Math.atan2(c[1]-b[1],c[0]-b[0]);let delta=(theta2-theta1+Math.PI*2)%(Math.PI*2);if(delta>Math.PI)delta-=2*Math.PI;const start=[b[0]+r*Math.cos(theta1),b[1]+r*Math.sin(theta1)],end=[b[0]+r*Math.cos(theta1+delta),b[1]+r*Math.sin(theta1+delta)];item=mk('path',{d:`M${start.join(' ')} A${r} ${r} 0 0 ${delta>0?1:0} ${end.join(' ')}`,fill:'none'});
 }else if(o.type==='freehand'&&o.path?.length>1){
  const pathCoords=o.path.map(project);if(bboxOutsideViewport(pathCoords,size.w,size.h,cullMargin))return;
  const path=mk('path',{d:o.curveShape&&o.curveShape!=='free'?`M${pathCoords.map(p=>p.join(' ')).join(' L')} Z`:freehandCurveSvg(pathCoords,!!o.closed),fill:'none','stroke-linejoin':'round','stroke-miterlimit':3,'stroke-linecap':'round'});
  const shapeMode=o.curveShape||'free',pattern=shapeMode==='free'?(o.curveLine||'solid'):SHAPE_LINE_CHOICES.some(([v])=>v===o.curveLine)?o.curveLine:'solid',heads=shapeMode==='free'?(o.curveHeads||(o.curveArrows||'none')):'none';
  if(pattern==='solid'&&heads==='none'){item=path;}
  else{item=el('g');item.append(path);styleDecoratedPath(item,path,pattern,mk);
   decoratedHeads(item,path,visibleArrowheads(pattern,heads),o.style.stroke,o.style.width,false,pattern);}
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
  const auto=false; // Round 56: legacy routing codes are rendered as Direct.
  const route=morphismRoutes?.get(o.id);
  if(!route)return; // Route was validated and frozen for this render in document order.
  if(!route.points.length)return; // Historical overlapping boxes retain semantic edge but have no drawable path.
  const a=route.points[0],b=route.points.at(-1),curve=auto?null:arrowCurve(a,b,o.bend||0);
  if(!auto&&!curve)return;
  const routed=route.status==='routed';
  const appearance=inheritedMorphismAppearance(o);
  const pathStart=a;
  const hook=visibleArrowheads(appearance.line,appearance.heads)==='hook'?hookTailGeometry(a,b,!!o.swap):null;
  const start=hook?.shaftStart||a;
  const d=`M${start[0].toFixed(2)} ${start[1].toFixed(2)} Q${curve.control[0].toFixed(2)} ${curve.control[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  item=el('g',{'data-id':o.id,'data-route-status':route.status});
  const path=mk('path',{d,fill:'none'});item.append(path);
  styleDecoratedPath(item,path,appearance.line,mk);
  decoratedHeads(item,path,visibleArrowheads(appearance.line,appearance.heads),o.style.stroke,o.style.width,true,appearance.line,!!o.swap);
  if(hook)item.append(el('path',{d:hook.d,stroke:o.style.stroke,'stroke-width':o.style.width,fill:'none','stroke-linecap':'round','pointer-events':'none',class:'latex-morphism-hook'}));
  if(o.text){const t=o.labelT??.5,distance=o.labelDistance??17,dx=o.labelDx??0,dy=o.labelDy??0;
   const pos=auto?labelOnPolyline(route.points,t,distance,!!o.swap,dx,dy):labelOnQuadratic(a,curve.control,b,t,distance,!!o.swap,dx,dy);
   if(pos){const placed=morphismLabels?.get(o.id),[lx,ly]=placed?[placed.x,placed.y]:pos;
    if(placed?.status==='crowded'){item.setAttribute('data-label-collision','unresolved');
     item.append(el('title',{},'Label collision remains: no clear location among the supported candidates. Adjust the label manually.'));}
    const label=o.textMode==='latex'?latexDisplay(o,lx,ly,15,{anchor:'middle',color:o.style.stroke,exporting})
      :el('text',{'xml:space':'preserve',x:lx,y:ly,'font-size':15,'font-family':o.fontFamily||'Georgia, serif','text-anchor':'middle',fill:o.style.stroke,'paint-order':'stroke','stroke':exporting&&doc.settings.exportTransparent?'none':doc.settings.background,'stroke-width':4,opacity:sty.opacity});
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
  const key=JSON.stringify([o.type,o.expr,o.xExpr,o.yExpr,o.parameter,o.tMin,o.tMax,o.polar,o.rExpr,o.rMin,o.rMax,doc.settings.plotQuality,doc.settings.plotBudget,doc.settings.implicitGrid,view.cx,view.cy,view.scale,size.w,size.h]);
  const path=plotCache.get(key,()=>{
   const options={quality:doc.settings.plotQuality,maxEvaluations:doc.settings.plotBudget??80000};
   const plot=o.type==='function'?sampleExplicitPlot(parseExpression(o.expr),px=>unproject(px,0)[0],y=>project([0,y])[1],size.w,size.h,options):
    o.type==='parametric'?sampleParametricPlot(o.polar?polarParametric(o):parseParametric(o.xExpr,o.yExpr,o.parameter),o.tMin,o.tMax,project,options):
    sampleImplicitPlot(parseImplicit(o.expr),px=>unproject(px,0)[0],py=>unproject(0,py)[1],size.w,size.h,{...options,cellPx:doc.settings.implicitGrid??12});
   if(plot.limited){limitedPlotKeys.add(key);while(limitedPlotKeys.size>32)limitedPlotKeys.delete(limitedPlotKeys.values().next().value);}
   else limitedPlotKeys.delete(key);
   return plotPath(plot.segments);
  });
  if(limitedPlotKeys.has(key))plotLimitedInScene=true;
  item=mk('path',{d:path,fill:'none'});

 }else if(o.type==='vectorField'){
  const region=o.region,condition=compileRegionCondition(o.regionCondition,2),options={density:o.density,normalized:o.normalized,maxEvaluations:doc.settings.plotBudget};
  const result=sampleVectorField(parseVectorField(o.xExpr,o.yExpr),region,options);
  if(result.limited)plotLimitedInScene=true;
  const parts=[],colored=o.colorRange===true;
  const magnitudes=colored?result.arrows.map(arrow=>arrow.magnitude):[];
  const low=magnitudes.length?Math.min(...magnitudes):0,high=magnitudes.length?Math.max(...magnitudes):1;
  if(colored)item=mk('g',{fill:'none'});
  for(const arrow of result.arrows){
   if(!inRegion(condition,...arrow.start)||!inRegion(condition,...arrow.end))continue;
   const a=project(arrow.start),b=project(arrow.end),len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(len<1||!Number.isFinite(len)||len>1e5)continue;
   const dx=(b[0]-a[0])/len,dy=(b[1]-a[1])/len,h=Math.min(9,Math.max(4,len*.28));
   const d=`M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}M${(b[0]-h*dx+h*.42*dy).toFixed(2)} ${(b[1]-h*dy-h*.42*dx).toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}L${(b[0]-h*dx-h*.42*dy).toFixed(2)} ${(b[1]-h*dy+h*.42*dx).toFixed(2)}`;
   if(colored)item.append(el('path',{d,stroke:rampColor(arrow.magnitude,low,high),'stroke-width':sty['stroke-width'],fill:'none'}));
   else parts.push(d);
  }
  if(!colored)item=mk('path',{d:parts.join(''),fill:'none'});
 }else if(o.type==='domainColoring'){
  const region=o.region,condition=compileRegionCondition(o.regionCondition,2),key=JSON.stringify(['domainColoring',o.expr,region,o.resolution,o.colorMode,o.regionCondition||'',MAX_DOMAIN_PIXELS]);
  const uri=plotCache.get(key,()=>{
   const result=sampleDomainColors(parseComplexExpression(o.expr),region,{resolution:o.resolution??768,mode:o.colorMode??'phase-modulus',maxEvaluations:MAX_DOMAIN_PIXELS});
   if(result.limited){limitedPlotKeys.add(key);return '';}
   limitedPlotKeys.delete(key);
   const canvas=document.createElement('canvas');canvas.width=result.width;canvas.height=result.height;
   const ctx=canvas.getContext('2d',{willReadFrequently:false});if(!ctx)throw Error('Browser canvas is unavailable for domain coloring.');
   const image=ctx.createImageData(result.width,result.height);image.data.set(result.rgba);
   if(condition)for(let j=0;j<result.height;j++)for(let i=0;i<result.width;i++){
    const x=region.xMin+(i+.5)*(region.xMax-region.xMin)/result.width,y=region.yMax-(j+.5)*(region.yMax-region.yMin)/result.height;
    if(!inRegion(condition,x,y))image.data[(j*result.width+i)*4+3]=0;
   }
   ctx.putImageData(image,0,0);
   return canvas.toDataURL('image/png');
  });
  if(limitedPlotKeys.has(key))plotLimitedInScene=true;
  const a=project([region.xMin,region.yMax]),b=project([region.xMax,region.yMin]);
  item=el('image',{x:a[0],y:a[1],width:b[0]-a[0],height:b[1]-a[1],href:uri,opacity:o.style.opacity,preserveAspectRatio:'none'});
  // Domain coloring is raster content; do not apply the normal stroke/fill style.
 }
 if(!item)return;if(sty.opacity===0)item.setAttribute('pointer-events','none');item.dataset.id=o.id;item.classList.add('clickable');if(isSel)item.classList.add('selected-shape');svg.append(item);
 if(!exporting&&sty.opacity>0&&(['segment','arrow','line','ray','perpBisector','angleBisector','parallelThrough','perpendicularThrough','freehand','polyline','spline','function','parametric','implicit','vectorField','bezier','angle','morphism'].includes(o.type)||o.type==='transformCopy'&&geometricLine(o,resolver))){
  const paths=o.type==='vectorField'&&o.colorRange===true?[...item.querySelectorAll('path')]:[item.tagName.toLowerCase()==='g'?item.querySelector('path'):item];
  for(const path of paths){if(!path)continue;const hit=path.cloneNode(false);hit.removeAttribute('marker-end');hit.removeAttribute('class');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width',Math.max(12,Number(o.style.width)+8));hit.setAttribute('opacity','1');hit.setAttribute('fill','none');hit.dataset.id=o.id;svg.append(hit);}
 }
 // Optional geometric labels follow the referenced world anchors on every redraw.
 // SVG export uses the exact same path; project JSON stores only author text/mode.
 if(doc.settings.showLabels&&o.displayLabel&&!pointRole(o,id=>resolver.object(id))&&!['node','morphism','text'].includes(o.type)){
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
function draw3DBase(svg,result,{exporting=false}={}){
 if(!(exporting&&doc.settings.exportTransparent))svg.append(el('rect',{x:0,y:0,width:size.w,height:size.h,fill:doc.settings.background}));
 for(const [a,b] of result.gridLines||[])svg.append(el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#a9b3be','stroke-width':.7,opacity:.5,'pointer-events':'none'}));
 for(const [a,b] of result.cube)svg.append(el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#97a2af','stroke-width':1,'stroke-dasharray':'4 4','pointer-events':'none'}));
 for(const axis of result.axesLines||[])svg.append(el('line',{x1:axis.from[0],y1:axis.from[1],x2:axis.to[0],y2:axis.to[1],stroke:axis.color,'stroke-width':1.8,'pointer-events':'none'}));
}
function face3DFill(face){
 const rgb=[1,3,5].map(i=>parseInt(face.color.slice(i,i+2),16));
 // Domain phase colors retain their identity while receiving subtle depth shading.
 return face.rangeColor?`rgb(${rgb.map(v=>Math.round(v*(.38+.62*face.shade))).join(',')})`:
  face.domainColoring?`rgb(${rgb.map(v=>Math.round(v*(.74+.26*face.shade))).join(',')})`:
  `rgb(${rgb.map(v=>Math.round(v+(255-v)*(.1+.56*face.shade))).join(',')})`;
}
function face3DElement(face){
 const points=face.points.map(p=>p.slice(0,2).map(v=>v.toFixed(2)).join(',')).join(' ');
 return el('polygon',{points,fill:face3DFill(face),opacity:face.opacity,stroke:'none','pointer-events':'none'});
}
function line3DElements(field){
 const [a,b]=[field.start,field.end],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
 if(len<.5)return [];
 const shaft=el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:field.color,'stroke-width':field.width??1.5,opacity:field.opacity,'pointer-events':'none'});
 const head=6*Math.max(.7,Math.min(2,Math.sqrt((field.width??1.5)/1.5))),ux=dx/len,uy=dy/len,points=[[b[0],b[1]],[b[0]-head*ux+head*.4*uy,b[1]-head*uy-head*.4*ux],[b[0]-head*ux-head*.4*uy,b[1]-head*uy+head*.4*ux]];
 return [shaft,el('polygon',{points:points.map(p=>p.join(',')).join(' '),fill:field.color,opacity:field.opacity,'pointer-events':'none'})];
}
function append3DPrimitive(target,primitive){
 if(primitive.kind==='face')target.append(face3DElement(primitive.value));
 else for(const child of line3DElements(primitive.value))target.append(child);
}
function draw3DScene(svg,{exporting=false}={}){
 const result=project3DScene(doc.scene3d,size.w,size.h);
 draw3DBase(svg,result,{exporting});
 for(const primitive of result.primitives)append3DPrimitive(svg,primitive);
 plotLimitedInScene=result.limited;
 return result;
}
function draw(svg,{exporting=false}={}){
 if(in3D()){svg.setAttribute('viewBox',`0 0 ${size.w} ${size.h}`);svg.setAttribute('width',size.w);svg.setAttribute('height',size.h);draw3DScene(svg,{exporting});return;}
 svg.setAttribute('viewBox',`0 0 ${size.w} ${size.h}`);svg.setAttribute('width',size.w);svg.setAttribute('height',size.h);
 // Complex-plane rasters are a backdrop: grid/axes and all foreground objects must remain legible.
 drawBackground(svg,false,exporting);
 const resolver=createResolver(doc);
 // Build obstacle rectangles once per drawing, and only when the author enables
 // obstacle-aware routing. Standard diagrams pay none of this extra work.
 let diagramBoxes=null;
 if(false){ // No obstacle routing in Round 56; retained only for legacy source compatibility.
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
  const mode='direct'; // Even imported legacy modes draw directly; stored values are untouched.
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
 if(false){ // Global rerouting is disabled.
  const globallyRefined=optimizeGlobalArrowRoutes(routeEntries,morphismRoutes);
  for(const [id,route] of globallyRefined)morphismRoutes.set(id,route);
 }
 // Cut23: reserve manually positioned diagram labels and visible nodes before
 // best-effort placement of opted-in morphism labels. Use the same positions
 // for the editor and SVG/raster exports. This is presentation-only.
 let computedMorphismLabels=new Map();
 if(uiPrefs.autoDiagramLabels!==false&&doc.objects.some(o=>o.type==='morphism'&&!o.hidden&&o.style?.opacity!==0&&o.text&&o.labelAvoid!==false)){
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
   if(true){ // All arrows use the direct quadratic geometry.
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
   const auto=false; // Round 56: legacy routing codes are rendered as Direct.
   const route=morphismRoutes.get(o.id);if(!route?.points.length)continue;
   const begin=route.points[0],finish=route.points.at(-1),curve=auto?null:arrowCurve(begin,finish,o.bend||0);
   if(!auto&&!curve)continue;
   const t=o.labelT??.5,distance=o.labelDistance??17,dx=o.labelDx??0,dy=o.labelDy??0;
   const place=at=>auto?labelOnPolyline(route.points,t,at,!!o.swap,dx,dy):labelOnQuadratic(begin,curve.control,finish,t,at,!!o.swap,dx,dy);
   const pos=place(distance),far=place(distance+1);
   if(pos){const sideNormal=far?[far[0]-pos[0],far[1]-pos[1]]:null;
    entries.push({id:o.id,text:o.text,x:pos[0],y:pos[1],sideNormal,auto:o.labelAvoid!==false&&uiPrefs.autoDiagramLabels!==false});}
  }
  computedMorphismLabels=layoutMorphismLabels(entries,nodeRects,size.w,size.h);
 }
 // Optional screen-space point-label decluttering. Keep the exact same layout
 // in editor and SVG/raster export; never hide labels or change model text.
 let labels=null;
 if(doc.settings.showLabels&&doc.settings.labelPlacement==='avoid'){
  const build=()=>{
   const entries=[];
   for(const o of doc.objects){if(!geometricPoint(o,resolver)||o.hidden||o.style?.opacity===0)continue;
    const p=resolver.at(o.id);if(!p)continue;const [x,y]=project(p);
    if(x < -100||x > size.w+100||y < -100||y > size.h+100)continue;
    entries.push({id:o.id,x,y,text:o.pointLabel||o.name});
   }
   // Geometry display labels join the same collision budget as point labels;
   // new projects avoid text-to-text overlaps without changing author content.
   for(const o of doc.objects){
    if(o.hidden||o.style?.opacity===0||!o.displayLabel||(pointRole(o,id=>resolver.object(id))||['node','morphism','text'].includes(o.type)))continue;
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
 for(const o of doc.objects)if(o.type==='domainColoring')renderObject(svg,o,resolver,exporting,labels,diagramBoxes,computedMorphismLabels,morphismRoutes);
 drawBackground(svg,!exporting||doc.settings.exportGuides,exporting,true);
 for(const o of doc.objects)if(o.type!=='domainColoring')renderObject(svg,o,resolver,exporting,labels,diagramBoxes,computedMorphismLabels,morphismRoutes);
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
   const mode=freehandShapeMode;
   const {prepared,begin,finish}=mode==='free'?preparedFreehand(drag.path,drag.startAttachment):{prepared:shapeFromStroke(drag.path,mode,freehandRegular)||{path:drag.path,closed:false},begin:null,finish:null};
   const pts=prepared.path.map(project);
   svg.append(el('path',{class:'draft-freehand',d:mode==='free'?freehandCurveSvg(pts,prepared.closed):`M${pts.map(p=>p.join(' ')).join(' L')} Z`,stroke:doc.settings.stroke,'stroke-width':doc.settings.width,opacity:doc.settings.opacity,fill:'none','stroke-linejoin':'round','stroke-miterlimit':3,'stroke-linecap':'round','pointer-events':'none'}));
   for(const target of [begin,finish])if(target){const [x,y]=project(target.world);svg.append(el('circle',{class:'freehand-snap-indicator',cx:x,cy:y,r:7,stroke:'#0d9488','stroke-width':2,fill:'none','pointer-events':'none'}));}
  }
 }
}
// Dense implicit surfaces contain hundreds of thousands of triangles. Rendering
// each triangle as an SVG DOM element can take seconds and retains huge DOMs.
// Preserve the exact projected/ordered mesh for vector export; only the editor
// display is rasterized at device resolution when the primitive count is large.
const DENSE_3D_RASTER_THRESHOLD=50000;
function dense3DCanvas(result){
 if(result.primitives.length<DENSE_3D_RASTER_THRESHOLD)return null;
 const canvas=document.createElement('canvas');
 // Device pixels improve edge quality, but bound allocation on large displays.
 const scale=Math.max(1,Math.min(2,window.devicePixelRatio||1,Math.sqrt(6500000/(size.w*size.h))));
 canvas.width=Math.max(1,Math.round(size.w*scale));
 canvas.height=Math.max(1,Math.round(size.h*scale));
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)return null;
 ctx.scale(canvas.width/size.w,canvas.height/size.h);
 return {canvas,ctx};
}
function paint3DCanvasPrimitive(ctx,primitive){
 if(primitive.kind==='face'){
  const f=primitive.value,p=f.points;
  ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);ctx.lineTo(p[1][0],p[1][1]);ctx.lineTo(p[2][0],p[2][1]);ctx.closePath();
  ctx.fillStyle=face3DFill(f);ctx.globalAlpha=f.opacity;ctx.fill();
 }else{
  const f=primitive.value,a=f.start,b=f.end,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
  if(len<.5)return;
  ctx.globalAlpha=f.opacity;ctx.strokeStyle=f.color;ctx.fillStyle=f.color;ctx.lineWidth=f.width??1.5;
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
  const head=6*Math.max(.7,Math.min(2,Math.sqrt((f.width??1.5)/1.5))),ux=dx/len,uy=dy/len;
  ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.lineTo(b[0]-head*ux+head*.4*uy,b[1]-head*uy-head*.4*ux);
  ctx.lineTo(b[0]-head*ux-head*.4*uy,b[1]-head*uy+head*.4*ux);ctx.closePath();ctx.fill();
 }
}
let sceneRenderEpoch=0,sceneRenderFrame=0,sceneRenderTask=null,sceneRenderPending=false,orbitRenderQueued=false;
function cancelSceneRender(){
 sceneRenderPending=false;
 ++sceneRenderEpoch;
 if(sceneRenderFrame){cancelAnimationFrame(sceneRenderFrame);sceneRenderFrame=0;}
 if(sceneRenderTask){sceneRenderTask.cancel();sceneRenderTask=null;}
}
function render(){
 if(frame){cancelAnimationFrame(frame);frame=0;}
 cancelSceneRender();
 const start=performance.now(),svg=$('drawing');plotLimitedInScene=false;
 if(!in3D()){
  svg.replaceChildren();draw(svg);lastRender=performance.now()-start;
  $('render-info').textContent=`${doc.objects.length} objects · ${Math.round(lastRender*10)/10} ms${plotLimitedInScene?' · PLOT LIMIT: zoom/adjust detail':''}`;
  return;
 }
 // Keep the previous complete scene visible while building the next frame.
 // A camera move, a new document, or a mode switch invalidates every pending
 // sample and DOM batch. Exports always use the independent synchronous path.
 const epoch=sceneRenderEpoch;
 const snapshot=JSON.parse(JSON.stringify(doc.scene3d)),interactive=!!cameraDrag&&uiPrefs.fast3DOrbit!==false;
 sceneRenderTask=create3DProjectionTask(snapshot,size.w,size.h,{interactive});
 sceneRenderPending=true;
 $('render-info').textContent=`${snapshot.plots.length} 3D plots · rendering…`;
 const paintResult=result=>{
  if(epoch!==sceneRenderEpoch)return;
  sceneRenderTask=null;
  svg.setAttribute('viewBox',`0 0 ${size.w} ${size.h}`);svg.setAttribute('width',size.w);svg.setAttribute('height',size.h);
  // Stage an entire frame off-DOM. Painting chunks directly into the visible
  // SVG caused black/white flicker and dramatic apparent lighting changes
  // (front faces appeared only after hundreds of earlier, farther faces).
  const staged=el('g');draw3DBase(staged,result);
  plotLimitedInScene=result.limited;
  const raster=dense3DCanvas(result);
  let next=0;
  const paint=()=>{
   sceneRenderFrame=0;if(epoch!==sceneRenderEpoch)return;
   const fragment=raster?null:document.createDocumentFragment();
   // Bound each UI slice; rasterization avoids thousands of SVG nodes while
   // keeping the same face shading, opacity and painter order as vector export.
   const deadline=performance.now()+7;
   const end=Math.min(result.primitives.length,next+(raster?2500:250));
   for(;next<end;next++){
    if(raster)paint3DCanvasPrimitive(raster.ctx,result.primitives[next]);
    else append3DPrimitive(fragment,result.primitives[next]);
    if((next&63)===63&&performance.now()>=deadline){next++;break;}
   }
   if(fragment)staged.append(fragment);
   if(next<result.primitives.length)sceneRenderFrame=requestAnimationFrame(paint);
   else{
    if(raster){
     // Atomic image installation. Keep the previous SVG intact until encode
     // succeeds; canvas allocation failure uses the existing vector route.
     raster.ctx.globalAlpha=1;
     staged.append(el('image',{x:0,y:0,width:size.w,height:size.h,href:raster.canvas.toDataURL('image/png'),preserveAspectRatio:'none','pointer-events':'none','data-3d-raster':'true'}));
     raster.canvas.width=0;raster.canvas.height=0;
    }
    // One atomic replacement: no half-lit or partly missing 3D scene.
    svg.replaceChildren(staged);sceneRenderPending=false;
    if(!$('export-menu').hidden)setupExport();lastRender=performance.now()-start;
    $('render-info').textContent=`${snapshot.plots.length} 3D plots · ${Math.round(lastRender)} ms${interactive?' · drag preview':''}${plotLimitedInScene?' · PLOT LIMIT: reduce detail/plots':''}`;
    if(cameraDrag&&orbitRenderQueued){orbitRenderQueued=false;scheduleRender();}
   }
  };
  paint();
 };
 const compute=()=>{
  sceneRenderFrame=0;if(epoch!==sceneRenderEpoch)return;
  try{const state=sceneRenderTask.step(7);
   if(state.done)paintResult(state.result);
   else sceneRenderFrame=requestAnimationFrame(compute);
  }catch(e){
   // Do not destroy the last complete scene when a new mesh fails; the user
   // must still be able to orbit, edit or remove the offending expression.
   sceneRenderTask?.cancel();sceneRenderTask=null;sceneRenderPending=false;
   $('render-info').textContent='3D rendering failed · previous view preserved';
   notice('3D rendering failed: '+e.message);
  }
 };
 compute();
}
function scheduleRender(){
 // Do not repeatedly discard expensive implicit-surface work while orbiting.
 // Finish a small, complete preview, then take the most recent camera pose.
 if(in3D()&&cameraDrag&&sceneRenderPending){orbitRenderQueued=true;return;}
 if(!frame)frame=requestAnimationFrame(render);
}
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

// The existing 2D menu icon paths are reused here; no legacy tool icon is changed.
const PLOT3D_ACTION_PATHS={
 Hide:'<path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7"/><path d="M9.9 5.2a10.9 10.9 0 0 1 2.1-.2c4.9 0 8.9 4.7 10 7a15 15 0 0 1-3.6 4.5M6 6.1C3.8 7.7 2.6 10 2 12c1.1 2.3 5.1 7 10 7 1.5 0 2.9-.4 4.1-1.1"/>',
 Show:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 Lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 Unlock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0"/>',
 Delete:'<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/>'
};
let activeObjectDrag=null;
function addObjectOrderGrip(row,id,dimension){
 const grip=document.createElement('button');grip.type='button';grip.className='object-order-grip';grip.draggable=true;
 grip.textContent='⠿';grip.title=translated('Drag to reorder; Alt+Up/Down',uiPrefs.language);
 grip.setAttribute('aria-label',`${translated('Drag to reorder; Alt+Up/Down',uiPrefs.language)}: ${dimension==='3d'?'3D ':''}${id}`);
 grip.onclick=event=>event.stopPropagation();
 grip.addEventListener('dragstart',event=>{
  activeObjectDrag={id,dimension};event.dataTransfer?.setData('text/plain',id);
  if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
  row.classList.add('object-dragging');
 });
 grip.addEventListener('dragend',()=>{
  activeObjectDrag=null;document.querySelectorAll('.object-drop-target,.object-dragging').forEach(node=>node.classList.remove('object-drop-target','object-dragging'));
 });
 grip.onkeydown=event=>{
  if(!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  const up=event.key==='ArrowUp',items=dimension==='3d'?doc.scene3d.plots:doc.objects;
  if(!items.some(o=>o.id===id))return;
  const changed=update(()=>shiftVisible(dimension==='3d'?doc.scene3d.plots:doc.objects,id,up));
  if(changed)requestAnimationFrame(()=>{
   const selector=dimension==='3d'?`#objects-3d .object[data-plot3d="${id}"] .object-order-grip`:`#objects .object[data-id="${id}"] .object-order-grip`;
   document.querySelector(selector)?.focus({preventScroll:true});
  });
 };
 row.addEventListener('dragover',event=>{
  if(!activeObjectDrag||activeObjectDrag.dimension!==dimension||activeObjectDrag.id===id)return;
  event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';row.classList.add('object-drop-target');
 });
 row.addEventListener('dragleave',event=>{if(!row.contains(event.relatedTarget))row.classList.remove('object-drop-target');});
 row.addEventListener('drop',event=>{
  row.classList.remove('object-drop-target');
  const dragging=activeObjectDrag;activeObjectDrag=null;
  if(!dragging||dragging.dimension!==dimension||dragging.id===id)return;
  event.preventDefault();event.stopPropagation();
  const bounds=row.getBoundingClientRect(),before=event.clientY<bounds.top+bounds.height/2;
  update(()=>reorderVisible(dimension==='3d'?doc.scene3d.plots:doc.objects,dragging.id,id,before));
 });
 return grip;
}
function render3DList(){
 const root=$('objects-3d');root.hidden=false;root.replaceChildren();$('object-count').textContent=String(doc.scene3d?.plots.length||0);
 $('objects').hidden=true;const filter=($('object-search').value||'').trim().toLowerCase(),showHidden=$('show-hidden').checked;
 if(!doc.scene3d)return;
 for(const plot of [...doc.scene3d.plots].reverse()){
  if(!showHidden&&plot.hidden)continue;
  if(filter&&!`${plot.name} ${plot.kind} ${plot.a}`.toLowerCase().includes(filter))continue;
  const row=document.createElement('div');row.className='object';row.dataset.plot3d=String(plot.id);row.dataset.locked=plot.locked?'true':'false';
  if(plot.hidden)row.classList.add('hidden');if(selected3d===plot.id)row.classList.add('selected');
  const info=document.createElement('div');info.className='object-label';const name=document.createElement('strong');name.textContent=plot.name;name.title=plot.name;const summary=document.createElement('small');summary.textContent=compactSubtitle(plot.a);summary.title=plot.a;info.append(name);if(summary.textContent.trim())info.append(summary);
  row.onclick=()=>{selected3d=plot.id;render3DList();renderProperties();};
  function action(label,callback,disabled=false){
   const button=document.createElement('button');button.type='button';button.className='plot3d-action';button.title=translated(label,uiPrefs.language);button.setAttribute('aria-label',translated(label,uiPrefs.language));button.disabled=disabled;
   button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PLOT3D_ACTION_PATHS[label]}</svg><span class="sr-only">${label}</span>`;
   button.onclick=e=>{e.stopPropagation();callback();};row.append(button);
  }
  const objectIcon=document.createElement('span');objectIcon.className='glyph';
  objectIcon.innerHTML=plotGlyphSvg(plot.kind);
  row.prepend(addObjectOrderGrip(row,plot.id,'3d'),objectIcon);
  row.append(info);
  action(plot.hidden?'Show':'Hide',()=>update(()=>{const live=doc.scene3d.plots.find(p=>p.id===plot.id);if(!live)throw Error('3D plot changed.');live.hidden=!live.hidden;if(!live.hidden)enforce3DVisibility(doc.scene3d,live.id);}));
  action(plot.locked?'Unlock':'Lock',()=>update(()=>{const live=doc.scene3d.plots.find(p=>p.id===plot.id);if(!live)throw Error('3D plot changed.');live.locked=!live.locked;}));
  action('Delete',()=>{
   const live=doc.scene3d.plots.find(p=>p.id===plot.id);
   if(!live||live.locked){notice('Unlock the 3D plot before deleting.');return;}
   const removed=clone(live);
   const success=update(()=>{
    const current=doc.scene3d.plots.find(p=>p.id===plot.id);
    if(!current||current.locked)throw Error('Unlock the 3D plot before deleting.');
    doc.scene3d.plots=doc.scene3d.plots.filter(p=>p.id!==plot.id);
    if(selected3d===plot.id)selected3d=null;
   });
   if(success){trash.unshift({at:Date.now(),objects:[],plots3d:[removed]});trash=trash.slice(0,20);persistTrash();notice('3D plot moved to Recently Deleted.');}
  },plot.locked===true);
  root.append(row);
 }
}
function renderList({resetScroll=false}={}){
 if(in3D()){render3DList();return;}
 $('objects').hidden=false;$('objects-3d').hidden=true;
 closeObjectMenu();
 const wrapper=$('objects');
 $('object-count').textContent=String(doc.objects.length);
 const filter=($('object-search')?.value||'').toLowerCase().trim(),showHidden=$('show-hidden').checked;
 // Build the name index once. Search descriptions with many live references must
 // not call an O(scene-size) lookup for every name in every row.
 const nameById=new Map(doc.objects.map(o=>[o.id,o.name]));
 const visibilityIndex=new Map(doc.objects.map(o=>[o.id,o]));
 listedObjects=[...doc.objects].reverse().filter(o=>
  (showHidden||isObjectVisible(doc,o,id=>visibilityIndex.get(id)))&&(!filter||`${o.name} ${desc(o,nameById)}`.toLowerCase().includes(filter)));
 const previous=resetScroll?0:wrapper.scrollTop;
 renderListWindow();
 wrapper.scrollTop=previous;
 // Programmatic scroll position restoration may change the visible range.
 renderListWindow();
}
/** Compact one-line summaries retain complete source text on hover. */
function compactSubtitle(value){
 const full=String(value??'').replace(/\s+/g,' ').trim();
 return full.length>34?full.slice(0,31)+'…':full;
}
function shortObjectSubtitle(o){
 // A second line is useful only for user content, equations or numeric values.
 // Repeating the object's type ("Vector field", "Parametric curve", etc.)
 // adds noise without describing this particular object.
 if(o.type==='point')return Array.isArray(o.xy)?o.xy.map(formatCoordinate).join(', '):'';
 if(['text','node','morphism'].includes(o.type))return compactSubtitle(o.text||'');
 if(['function','implicit','domainColoring'].includes(o.type))return compactSubtitle(o.expr||'');
 if(o.type==='parametric')return compactSubtitle(o.polar?`r(t) = ${o.rExpr||''}`:`x(t) = ${o.xExpr||''}; y(t) = ${o.yExpr||''}`);
 if(o.type==='vectorField')return compactSubtitle([o.xExpr,o.yExpr].filter(Boolean).join(', '));
 if(o.type==='regularPolygon')return Number.isInteger(o.sides)?`${o.sides} sides`:'';
 return '';
}

// Use one authoritative SVG for Geometry/Diagram tools and their Objects-list
// rows. Plotting modes have a separate set of five semantic SVG glyphs.
// Five shared 2D/3D plot pictograms; not used by Geometry tools.
// Axes for y=f(x), a closed 8-shaped parameter trace, two implicit level
// components, a circulating vector field, and colored phase sectors.
const PLOTTING_GLYPHS=Object.freeze({
 function:'<path d="M3 19H22M5 22V2" stroke-width="1.3"/><path d="M4 16C7 18 8 6 12 7S16 17 21 5"/>',
 parametric:'<path d="M13.15 11.51C13.15 11.47 13.15 11.33 13.14 11.23C13.12 11.14 13.10 11.04 13.06 10.95C13.02 10.85 12.97 10.75 12.91 10.66C12.84 10.57 12.77 10.48 12.68 10.40C12.60 10.32 12.50 10.25 12.39 10.18C12.28 10.12 12.17 10.06 12.04 10.02C11.92 9.98 11.78 9.94 11.64 9.93C11.50 9.91 11.36 9.91 11.21 9.92C11.06 9.93 10.91 9.96 10.76 10.00C10.62 10.05 10.46 10.11 10.32 10.19C10.18 10.26 10.04 10.36 9.91 10.47C9.78 10.58 9.65 10.70 9.54 10.84C9.44 10.98 9.33 11.14 9.25 11.30C9.17 11.47 9.10 11.64 9.05 11.83C9.00 12.02 8.96 12.21 8.95 12.41C8.93 12.61 8.94 12.82 8.97 13.03C8.99 13.23 9.04 13.44 9.11 13.65C9.18 13.85 9.27 14.05 9.38 14.25C9.50 14.44 9.63 14.63 9.78 14.80C9.94 14.97 10.11 15.13 10.30 15.28C10.49 15.42 10.70 15.55 10.92 15.66C11.15 15.76 11.38 15.85 11.63 15.92C11.87 15.98 12.13 16.02 12.39 16.04C12.65 16.05 12.93 16.04 13.19 16.01C13.46 15.97 13.73 15.90 13.99 15.81C14.25 15.72 14.51 15.60 14.76 15.46C15.00 15.32 15.24 15.14 15.46 14.95C15.68 14.76 15.88 14.54 16.06 14.30C16.24 14.06 16.41 13.80 16.54 13.52C16.68 13.24 16.79 12.95 16.87 12.64C16.95 12.34 17.00 12.02 17.02 11.70C17.05 11.37 17.04 11.04 16.99 10.71C16.95 10.39 16.87 10.05 16.77 9.73C16.66 9.41 16.52 9.09 16.35 8.79C16.17 8.49 15.97 8.20 15.74 7.93C15.51 7.67 15.24 7.42 14.96 7.19C14.67 6.97 14.36 6.77 14.03 6.60C13.70 6.44 13.35 6.30 12.99 6.19C12.62 6.09 12.24 6.02 11.86 5.99C11.48 5.96 11.08 5.96 10.69 6.01C10.30 6.05 9.91 6.14 9.52 6.26C9.14 6.38 8.76 6.54 8.41 6.73C8.05 6.93 7.70 7.16 7.38 7.43C7.06 7.69 6.76 8.00 6.49 8.32C6.23 8.65 5.98 9.01 5.78 9.39C5.58 9.77 5.41 10.18 5.28 10.60C5.15 11.02 5.06 11.46 5.01 11.91C4.97 12.35 4.96 12.81 5.00 13.26C5.04 13.71 5.13 14.17 5.26 14.61C5.39 15.06 5.56 15.50 5.78 15.92C5.99 16.33 6.25 16.74 6.55 17.11C6.84 17.49 7.18 17.84 7.55 18.16C7.92 18.47 8.33 18.76 8.75 19.00C9.18 19.25 9.65 19.45 10.12 19.61C10.59 19.77 11.10 19.89 11.60 19.95C12.10 20.02 12.62 20.04 13.14 20.00C13.65 19.97 14.18 19.89 14.68 19.76C15.19 19.62 15.70 19.44 16.17 19.21C16.65 18.98 17.12 18.70 17.55 18.37C17.98 18.05 18.39 17.68 18.76 17.27C19.13 16.87 19.46 16.42 19.75 15.94C20.04 15.47 20.28 14.96 20.48 14.43C20.67 13.90 20.82 13.34 20.91 12.78C20.99 12.22 21.03 11.63 21.01 11.06C20.99 10.48 20.92 9.89 20.78 9.32C20.65 8.75 20.46 8.18 20.22 7.64C19.98 7.10 19.68 6.57 19.33 6.08C18.99 5.58 18.35 4.92 18.15 4.69"/>',
 implicit:'<path d="M3.13 12.00L3.29 10.34L3.45 9.68L3.61 9.20L3.77 8.81L3.93 8.49L4.09 8.21L4.25 7.97L4.41 7.76L4.57 7.57L4.73 7.41L4.89 7.26L5.05 7.13L5.21 7.02L5.37 6.92L5.53 6.83L5.69 6.75L5.85 6.69L6.01 6.63L6.17 6.59L6.33 6.56L6.49 6.53L6.65 6.51L6.81 6.50L6.97 6.50L7.13 6.51L7.29 6.52L7.45 6.54L7.61 6.57L7.77 6.60L7.94 6.64L8.10 6.69L8.26 6.74L8.42 6.80L8.58 6.86L8.74 6.93L8.90 7.01L9.06 7.09L9.22 7.18L9.38 7.27L9.54 7.37L9.70 7.48L9.86 7.59L10.02 7.71L10.18 7.83L10.34 7.96L10.50 8.10L10.66 8.24L10.82 8.39L10.98 8.55L11.14 8.71L11.30 8.89L11.46 9.08L11.62 9.27L11.78 9.48L11.94 9.71L12.10 9.96L12.26 10.25L12.42 10.58L12.58 11.00L12.74 12.00L12.74 12.00L12.58 13.00L12.42 13.42L12.26 13.75L12.10 14.04L11.94 14.29L11.78 14.52L11.62 14.73L11.46 14.92L11.30 15.11L11.14 15.29L10.98 15.45L10.82 15.61L10.66 15.76L10.50 15.90L10.34 16.04L10.18 16.17L10.02 16.29L9.86 16.41L9.70 16.52L9.54 16.63L9.38 16.73L9.22 16.82L9.06 16.91L8.90 16.99L8.74 17.07L8.58 17.14L8.42 17.20L8.26 17.26L8.10 17.31L7.94 17.36L7.77 17.40L7.61 17.43L7.45 17.46L7.29 17.48L7.13 17.49L6.97 17.50L6.81 17.50L6.65 17.49L6.49 17.47L6.33 17.44L6.17 17.41L6.01 17.37L5.85 17.31L5.69 17.25L5.53 17.17L5.37 17.08L5.21 16.98L5.05 16.87L4.89 16.74L4.73 16.59L4.57 16.43L4.41 16.24L4.25 16.03L4.09 15.79L3.93 15.51L3.77 15.19L3.61 14.80L3.45 14.32L3.29 13.66L3.13 12.00ZM17.86 12.00L17.95 11.08L18.04 10.68L18.13 10.37L18.21 10.09L18.30 9.85L18.39 9.61L18.48 9.40L18.57 9.19L18.65 8.98L18.74 8.79L18.83 8.60L18.92 8.41L19.01 8.23L19.09 8.05L19.18 7.87L19.27 7.69L19.36 7.52L19.45 7.34L19.53 7.17L19.62 7.00L19.71 6.83L19.80 6.66L19.89 6.49L19.98 6.33L20.06 6.16L20.15 5.99L20.24 5.83L20.33 5.66L20.42 5.49L20.50 5.33L20.59 5.16L20.68 5.00L20.77 4.83L20.86 4.66L20.94 4.50L21.03 4.33L21.12 4.17L21.21 4.00L21.30 3.83L21.38 3.67L21.47 3.50L21.56 3.33L21.65 3.16L21.74 3.00L21.82 2.83L21.91 2.66L22.00 2.49 M17.86 12.00L17.95 12.92L18.04 13.32L18.13 13.63L18.21 13.91L18.30 14.15L18.39 14.39L18.48 14.60L18.57 14.81L18.65 15.02L18.74 15.21L18.83 15.40L18.92 15.59L19.01 15.77L19.09 15.95L19.18 16.13L19.27 16.31L19.36 16.48L19.45 16.66L19.53 16.83L19.62 17.00L19.71 17.17L19.80 17.34L19.89 17.51L19.98 17.67L20.06 17.84L20.15 18.01L20.24 18.17L20.33 18.34L20.42 18.51L20.50 18.67L20.59 18.84L20.68 19.00L20.77 19.17L20.86 19.34L20.94 19.50L21.03 19.67L21.12 19.83L21.21 20.00L21.30 20.17L21.38 20.33L21.47 20.50L21.56 20.67L21.65 20.84L21.74 21.00L21.82 21.17L21.91 21.34L22.00 21.51"/>',
 vectorField:'<path d="M17 5H9M11.5 2.5L9 5L11.5 7.5M19 9V16M16.5 13.5L19 16L21.5 13.5M7 19H15M12.5 16.5L15 19L12.5 21.5M5 16V9M2.5 11.5L5 9L7.5 11.5"/>',
 domainColoring:'<path d="M12 12L12 3A9 9 0 0 1 19.79 7.5Z" fill="#b38be3" stroke="none"/><path d="M12 12L19.79 7.5A9 9 0 0 1 19.79 16.5Z" fill="#638ecd" stroke="none"/><path d="M12 12L19.79 16.5A9 9 0 0 1 12 21Z" fill="#5db8ad" stroke="none"/><path d="M12 12L12 21A9 9 0 0 1 4.21 16.5Z" fill="#e0bf69" stroke="none"/><path d="M12 12L4.21 16.5A9 9 0 0 1 4.21 7.5Z" fill="#df8f83" stroke="none"/><path d="M12 12L4.21 7.5A9 9 0 0 1 12 3Z" fill="#be91be" stroke="none"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="var(--surface)" stroke="none"/>'
});
const PLOT3D_GLYPH_SOURCE=Object.freeze({surface3d:'function',parametric3d:'parametric',implicit3d:'implicit',vector3d:'vectorField',domain3d:'domainColoring'});
function plotGlyphSvg(type){
 const source=PLOT3D_GLYPH_SOURCE[type]||type;
 if(!Object.hasOwn(PLOTTING_GLYPHS,source))throw Error('No plotting glyph for mode: '+type);
 return `<svg viewBox="-1.5 -1.5 27 27" aria-hidden="true">${PLOTTING_GLYPHS[source]}</svg>`;
}
const TRANSFORM_GLYPH_TOOL=Object.freeze({reflect:'reflection',rotate:'rotation',translate:'translation',dilate:'dilation',invert:'circleInversion'});
function objectGlyphTool(o){
 if(o.type==='transformCopy')return TRANSFORM_GLYPH_TOOL[o.transform]||null;
 if(o.type==='spline'&&o.closed===true)return 'closedSpline';
 return Object.hasOwn(glyph,o.type)?o.type:null;
}
function toolGlyphSvg(type){
 if(!Object.hasOwn(glyph,type))throw Error('No SVG icon for tool: '+type);
 return `<svg viewBox="-1.5 -1.5 27 27" aria-hidden="true">${glyph[type]}</svg>`;
}
function navigateToObject(id){
 if(!id||!get(doc,id))return;
 if($('object-search').value&&!listedObjects.some(o=>o.id===id)){
  $('object-search').value='';renderList({resetScroll:false});
 }
 if(document.body.classList.contains('left-collapsed')){$('left-collapse').click();}
 if(document.body.classList.contains('mobile-left-open')===false&&window.matchMedia('(max-width:700px)').matches){$('left-collapse').click();}
 const index=listedObjects.findIndex(o=>o.id===id);
 if(index!==-1)focusListIndex(index);
}
function renderListWindow(){
 if(in3D())return;
 const wrapper=$('objects'),count=listedObjects.length,scroll=Math.max(0,wrapper.scrollTop),height=Math.max(90,wrapper.clientHeight);
 const visibilityIndex=new Map(doc.objects.map(o=>[o.id,o]));
 const first=Math.min(count,Math.max(0,Math.floor(scroll/LIST_ROW_HEIGHT)-LIST_OVERSCAN));
 const last=Math.min(count,Math.ceil((scroll+height)/LIST_ROW_HEIGHT)+LIST_OVERSCAN);
 const fragment=document.createDocumentFragment();
 function spacer(px){const e=document.createElement('div');e.className='list-spacer';e.style.height=px+'px';e.setAttribute('aria-hidden','true');return e;}
 if(first)fragment.append(spacer(first*LIST_ROW_HEIGHT));
 for(let i=first;i<last;i++){
  const o=listedObjects[i],row=document.createElement('div');row.tabIndex=0;row.className='object'+(selectedIds.has(o.id)||o.id===selected?' selected':'')+(!isObjectVisible(doc,o,id=>visibilityIndex.get(id))?' hidden':'');row.dataset.id=o.id;row.dataset.locked=o.locked?'true':'false';row.setAttribute('role','listitem');row.setAttribute('aria-posinset',String(i+1));row.setAttribute('aria-setsize',String(count));
  const objectIcon=document.createElement('span');objectIcon.className='glyph';
  const toolGlyph=objectGlyphTool(o);
  if(toolGlyph)objectIcon.innerHTML=toolGlyphSvg(toolGlyph);
  else if(Object.hasOwn(PLOTTING_GLYPHS,o.type))objectIcon.innerHTML=plotGlyphSvg(o.type);
  else throw Error('Missing matching Objects-list icon for '+o.type);
  row.append(addObjectOrderGrip(row,o.id,'2d'),objectIcon);
  const label=document.createElement('span');label.className='object-label';const strong=document.createElement('strong');strong.textContent=o.name;strong.title=o.name;const small=document.createElement('small');const fullDescription=desc(o);small.textContent=shortObjectSubtitle(o);small.title=fullDescription;label.append(strong);if(small.textContent.trim())label.append(small);row.append(label);
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
function rangeHint(opts={}){
 if(opts.hint)return opts.hint;
 const {min,max}=opts;
 if(min!==undefined&&max!==undefined)return `Range: ${min}–${max}`;
 if(min!==undefined)return `Minimum: ${min}`;
 if(max!==undefined)return `Maximum: ${max}`;
 return '';
}
function field(parent,label,value,type,onChange,opts={}){
 const wrap=document.createElement('label');wrap.className='field'+(type==='multiline'?' multiline-field':'');wrap.textContent=label;
 const input=document.createElement(type==='multiline'?'textarea':'input');
 if(type!=='multiline')input.type=type;else{input.rows=3;input.spellcheck=false;input.setAttribute('aria-label',label);}
 input.value=String(value??'');if(opts.step)input.step=opts.step;
 if(opts.min!==undefined)input.min=opts.min;
 if(opts.max!==undefined)input.max=opts.max;
 const hint=rangeHint(opts);if(hint){wrap.title=translated(hint,uiPrefs.language);input.title=translated(hint,uiPrefs.language);}
 let accepted=input.value;
 input.onchange=()=>{
  if(type==='number'&&!input.value.trim()){notice('Numeric value is required.');input.value=accepted;return;}
  const next=input.value;
  // A blur after an already committed change must not rebuild Properties or
  // detach the list-row/button receiving that same pointer gesture.
  if(next===accepted)return;
  if(onChange(type==='number'?Number(next):next)===false)input.value=accepted;
  else accepted=next;
 };
 wrap.append(input);parent.append(wrap);return input;
}
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
  const targets=compatibleObjects(ids.map(id=>indexed.get(id)).filter(Boolean),property,id=>indexed.get(id));
  if(!targets.length)throw Error('No editable objects for this style.');
  for(const obj of targets)obj.style[property]=value;
 });
 const grid=document.createElement('div');grid.className='style-controls-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Selected objects appearance');
 const slot=(name)=>{const e=document.createElement('div');e.className='style-slot style-'+name;grid.append(e);return e;};
 function addColor(property,label){
  if(!compatibleObjects(objects,property,id=>get(doc,id)).length)return;
  const target=slot(property.toLowerCase()),value=commonValue(compatibleObjects(objects,property,id=>get(doc,id)),property);
  const control=field(target,label,value||compatibleObjects(objects,property,id=>get(doc,id))[0].style[property],'color',v=>edit(property,v));
  if(value===null)control.closest('label').dataset.mixed='true';
  appendColorSwatches(target,{scope:'bulk',property,apply:v=>edit(property,v)});
 }
 function addNumber(property,label,min,max,step){
  if(!compatibleObjects(objects,property,id=>get(doc,id)).length)return;
  const target=slot(property.toLowerCase()),value=commonValue(compatibleObjects(objects,property,id=>get(doc,id)),property);
  const control=field(target,label,value===null?'':value,'number',v=>edit(property,v,{min,max,label}),{min,max,step});
  if(value===null){control.placeholder=translated('Mixed',uiPrefs.language);control.dataset.mixed='true';}
 }
 addColor('stroke','Stroke');addColor('fill','Fill');
 addNumber('opacity','Opacity',0,1,.1);addNumber('width','Line width',.1,100,.5);
 addNumber('pointSize','Size',1,100,1);
 if(!grid.querySelector('.style-fill'))grid.classList.add('stroke-only-grid');
 root.append(grid);
}
// Plot bounds are a single atomic edit: Enter commits all axes, while a double
// click on any axis caption prepares symmetric bounds without persisting drafts.
// Keep the 2D historical ±1e6 range; the 3D engine intentionally has ±1e4.
function parse2DRegionBound(source){
 const value=r50ParseExpr(String(source),[])({});
 if(!Number.isFinite(value)||Math.abs(value)>1e6)throw Error('2D region value must be finite and within ±1,000,000.');
 return value;
}
// Bound editors accept the same strict arithmetic grammar as plot formulas.
// A centered region is defined by one positive half-width and never stored as
// an additional mutable setting: imported/exported files keep numeric bounds.
function installCenteredRegionEditor(container,inputs,commit,parseBound,conditionValue,conditionCommit,dimension){
 const row=document.createElement('div');row.className='region-extras';
 const label=document.createElement('label');label.className='field';label.textContent='Centered half-range';
 const radius=document.createElement('input');radius.type='text';radius.placeholder='4pi';radius.setAttribute('aria-label','Centered half-range');radius.title='Enter a positive half-range to set ±R along every axis.';
 const conditionLabel=document.createElement('label');conditionLabel.className='field';conditionLabel.textContent='Region inequality';
 const region=document.createElement('input');region.type='text';region.value=conditionValue||'';region.placeholder=dimension===3?'x^2+y^2+z^2<16':'x^2+y^2<16';
 region.setAttribute('aria-label','Region inequality');region.title='Strict condition, e.g. x^2+y^2<4. Press Enter to apply; empty means unrestricted.';
 function useRadius(){
  let value;try{value=parseBound(radius.value);}catch(err){notice(err.message);return;}
  if(!(value>0)){notice('Centered half-range must be positive.');return;}
  for(const axis of new Set(Object.keys(inputs).map(k=>k[0]))){inputs[axis+'Min'].value=String(-value);inputs[axis+'Max'].value=String(value);}
  commit();
 }
 radius.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();event.stopPropagation();useRadius();}});
 region.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();event.stopPropagation();
  try{compileRegionCondition(region.value,dimension);}catch(err){notice(err.message);return;}
  conditionCommit(region.value);
 }});
 label.append(radius);conditionLabel.append(region);row.append(label,conditionLabel);container.append(row);
}
function installPlotRegionKeys(container,inputs,commit,{parseBound=parse3DRangeExpression,conditionValue="",conditionCommit=()=>{},dimension=3}={}){
 const axes=[...new Set(Object.keys(inputs).map(k=>k[0]))];
 for(const [key,input] of Object.entries(inputs)){
  const caption=input.closest('label');
  caption.title=translated('Double-click this label to fill symmetric ranges for all axes; Enter to redraw.',uiPrefs.language);
  caption.addEventListener('dblclick',event=>{
   if(event.target!==caption)return;
   const raw=input.value.trim();let numeric;
   try{numeric=raw?parseBound(raw):NaN;}catch{numeric=NaN;}
   if(!Number.isFinite(numeric)){notice('Enter a finite bound first.');return;}
   const radius=Math.abs(numeric);
   if(!radius){notice('Symmetric range must have nonzero width.');return;}
   for(const axis of axes){inputs[axis+'Min'].value=String(-radius);inputs[axis+'Max'].value=String(radius);}
  });
  input.addEventListener('keydown',event=>{
   if(event.key!=='Enter'||event.isComposing)return;
   event.preventDefault();event.stopPropagation();commit();
  });
 }
 installCenteredRegionEditor(container,inputs,commit,parseBound,conditionValue,conditionCommit,dimension);
}
function renderProperties3D(root){
 root.classList.add('properties-3d');
 const selectedPlot=doc.scene3d?.plots.find(p=>p.id===selected3d);if(!selectedPlot)return;
 if(selectedPlot.locked){const note=document.createElement('p');note.className='subtle';note.textContent=translated('Locked',uiPrefs.language);root.append(note);return;}
 const edit=fn=>update(()=>{const live=doc.scene3d.plots.find(p=>p.id===selectedPlot.id);if(!live||selected3d!==selectedPlot.id||live.locked)throw Error('3D plot changed or locked while editing.');fn(live);});
 field(root,'Name',selectedPlot.name,'text',v=>edit(p=>{if(!v.trim()||v.length>100)throw Error('Invalid plot name.');p.name=v.trim();}));
 const componentLabels=selectedPlot.kind==='domain3d'?['F(z)']:selectedPlot.kind==='surface3d'?['f(x, y)']:selectedPlot.kind==='parametric3d'?['X(u, v)','Y(u, v)','Z(u, v)']:selectedPlot.kind==='implicit3d'?['F(x, y, z)']:['X(x, y, z)','Y(x, y, z)','Z(x, y, z)'];
 for(const [i,label] of componentLabels.entries()){const key=['a','b','c'][i];field(root,label,selectedPlot[key],'text',value=>edit(p=>{p[key]=value;parse3D(p);}));}
 const fields=selectedPlot.kind==='parametric3d'?['uMin','uMax','vMin','vMax']:[];
 if(fields.length){const rangeGrid=document.createElement('div');rangeGrid.className='parametric-range-grid';rangeGrid.setAttribute('role','group');rangeGrid.setAttribute('aria-label','Surface parameter ranges');root.append(rangeGrid);
  for(const key of fields)field(rangeGrid,key.replace(/Min$/,' min').replace(/Max$/,' max'),selectedPlot[key],'text',value=>edit(p=>{p[key]=parse3DRangeExpression(value);}),{hint:'Finite expression; min must be less than max.'});}
 const block=document.createElement('div');block.className='plot-region-editor';const subtitle=document.createElement('h4');subtitle.textContent='3D drawing region';block.append(subtitle);
 const values={};for(const key of ['xMin','xMax','yMin','yMax','zMin','zMax']){
  const label=key.replace(/Min$/,' min').replace(/Max$/,' max');values[key]=field(block,label,selectedPlot.bounds[key],'text',()=>true,{hint:'Finite expression; min must be less than max.'});values[key].onchange=()=>{};values[key].setAttribute('inputmode','text');
 }
 installPlotRegionKeys(block,values,()=>edit(p=>{p.bounds=Object.fromEntries(Object.entries(values).map(([k,node])=>[k,parse3DRangeExpression(node.value)]));}),{parseBound:parse3DRangeExpression,conditionValue:selectedPlot.regionCondition,conditionCommit:value=>edit(p=>{p.regionCondition=value;}),dimension:3});
 root.append(block);
 if(selectedPlot.kind==='domain3d'){
  const height=document.createElement('label');height.className='field';height.textContent='Height represents';const heightSelect=document.createElement('select');
  for(const [key,label] of [['modulus','Modulus |F(z)|'],['argument','Argument arg F(z)']]){const opt=document.createElement('option');opt.value=key;opt.textContent=label;heightSelect.append(opt);}
  heightSelect.value=selectedPlot.heightMode;heightSelect.onchange=()=>edit(p=>{const was=p.heightMode,next=heightSelect.value;p.heightMode=next;
   if(was==='modulus'&&next==='argument'&&p.bounds.zMin===0){p.bounds.zMin=-Math.PI;p.bounds.zMax=Math.PI;}
   else if(was==='argument'&&next==='modulus'&&Math.abs(p.bounds.zMin+Math.PI)<1e-9&&Math.abs(p.bounds.zMax-Math.PI)<1e-9){
    const f=parseComplexExpression(p.a);let max=0;for(let j=0;j<=6;j++)for(let i=0;i<=6;i++){
     const x=p.bounds.xMin+(p.bounds.xMax-p.bounds.xMin)*i/6,y=p.bounds.yMin+(p.bounds.yMax-p.bounds.yMin)*j/6;
     try{const h=Math.hypot(...f(x,y));if(Number.isFinite(h)&&h<=1e4)max=Math.max(max,h);}catch{}
    }p.bounds.zMin=0;p.bounds.zMax=Math.max(4,Math.min(1e4,Math.ceil(max*1.05)));
   }
  });height.append(heightSelect);root.append(height);
  const colors=document.createElement('label');colors.className='field';colors.textContent='Color scheme';const select=document.createElement('select');
  for(const [key,label] of [['phase-modulus','Phase + modulus'],['phase','Phase only'],['contours','Modulus bands'],['solid','Single color']]){const opt=document.createElement('option');opt.value=key;opt.textContent=label;select.append(opt);}
  select.value=selectedPlot.colorMode;select.onchange=()=>{if(edit(p=>{p.colorMode=select.value;})!==false)renderProperties();};colors.append(select);root.append(colors);
 }
 if(selectedPlot.kind==='vector3d'){
  const pair=document.createElement('div');pair.className='property-check-number-pair';root.append(pair);
  const label=document.createElement('label');label.className='check';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=selectedPlot.normalized;checkbox.onchange=()=>edit(p=>{p.normalized=checkbox.checked;});label.append(checkbox,document.createTextNode(' Normalize lengths'));pair.append(label);
  field(pair,'Density',selectedPlot.density,'number',v=>edit(p=>{p.density=v;}),{min:3,max:12,step:1});
 }
 const colors=document.createElement('div');colors.className='plot-color-grid';root.append(colors);
 const colorSlot=document.createElement('div');colorSlot.className='plot-color-slot';colors.append(colorSlot);
 const solidAllowed=selectedPlot.kind!=='domain3d'||selectedPlot.colorMode==='solid';
 const solidPicker=field(colorSlot,selectedPlot.kind==='vector3d'?'Vector color':'Surface color',selectedPlot.color,'color',v=>edit(p=>{p.color=v;}));
 solidPicker.disabled=selectedPlot.colorRange===true||!solidAllowed;
 const swatches=appendColorSwatches(colorSlot,{scope:'plot3d',property:'color',apply:v=>edit(p=>{if(p.colorRange||p.kind==='domain3d'&&p.colorMode!=='solid')throw Error('Select Single color and disable Multi-color first.');p.color=v;})});
 for(const button of swatches.querySelectorAll('button'))button.disabled=solidPicker.disabled;
 const right=document.createElement('div');right.className='plot-color-options';colors.append(right);
 const rangeLabel=document.createElement('label');rangeLabel.className='check';const range=document.createElement('input');range.type='checkbox';range.checked=selectedPlot.colorRange===true;
 range.onchange=()=>{if(edit(p=>{p.colorRange=range.checked;})===false){range.checked=!range.checked;return;}solidPicker.disabled=range.checked||!solidAllowed;for(const button of swatches.querySelectorAll('button'))button.disabled=solidPicker.disabled;};rangeLabel.append(range,document.createTextNode(' '+(selectedPlot.kind==='vector3d'?'Color range':'Multi-color')));right.append(rangeLabel);
 field(right,'Opacity',selectedPlot.opacity,'number',v=>edit(p=>{p.opacity=v;}),{min:.05,max:1,step:.05});
 if(selectedPlot.kind==='vector3d')field(right,'Width',selectedPlot.lineWidth??1.5,'number',v=>edit(p=>{p.lineWidth=v;}),{min:.1,max:12,step:.5});
 localizeUI(root,uiPrefs.language);
}
function renderNewFreehandControls(root){
 const header=document.createElement('h3');header.textContent='Free curve';root.append(header);
 const grid=document.createElement('div');grid.className='freehand-shape-grid';root.append(grid);
 const choice=(title,value,options,change)=>{
  const l=document.createElement('label');l.className='field';l.textContent=title;
  const s=document.createElement('select');s.setAttribute('aria-label',title);
  for(const [key,caption]of options){const opt=document.createElement('option');opt.value=key;opt.textContent=translated(caption,uiPrefs.language);s.append(opt);}
  s.value=value;s.onchange=()=>{change(s.value);renderProperties();};l.append(s);grid.append(l);
 };
 choice('Shape',freehandShapeMode,SHAPE_CHOICES,v=>freehandShapeMode=v);
 const l=document.createElement('label');l.className='check freehand-regular-check';
 const cb=document.createElement('input');cb.type='checkbox';cb.checked=freehandRegular;cb.onchange=()=>freehandRegular=cb.checked;
 l.append(cb,document.createTextNode(' Regular'));grid.append(l);
 const shaped=freehandShapeMode!=='free';
 choice('Line style',shaped&&!SHAPE_LINE_CHOICES.some(([v])=>v===freehandLine)?'solid':freehandLine,shaped?SHAPE_LINE_CHOICES:LINE_CHOICES,v=>freehandLine=v);
 choice('Arrowheads',shaped?'none':visibleArrowheads(freehandLine,freehandHeads),FREE_CURVE_HEAD_CHOICES,v=>freehandHeads=v);
 const arrow=grid.querySelector('select[aria-label="Arrowheads"]');arrow.disabled=shaped||HEADLESS_LINE_STYLES.has(freehandLine);
}
function renderProperties(){
 if(in3D()){const root=$('properties');root.replaceChildren();renderProperties3D(root);return;}

 const root=$('properties');root.classList.remove('properties-3d');root.replaceChildren();const objects=activeSelection();
 if(objects.length>1){renderBulkProperties(root,objects);localizeUI(root,uiPrefs.language);return;}
 const o=objects[0]||get(doc,selected);
 if(!o){if(tool==='freehand'){renderNewFreehandControls(root);localizeUI(root,uiPrefs.language);}return;}
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
 if(pointRole(o,id=>get(doc,id))){
  const mode=document.createElement('label');mode.className='field';mode.textContent='Label format';const modeSelect=document.createElement('select');
  for(const [value,label] of [['plain','Plain text'],['latex','LaTeX math']]){const option=document.createElement('option');option.value=value;option.textContent=label;modeSelect.append(option);}
  modeSelect.value=o.pointLabelMode||'plain';modeSelect.onchange=()=>edit(live=>{if(modeSelect.value==='latex'&&live.pointLabel)validateLatexInput(live.pointLabel);live.pointLabelMode=modeSelect.value;});mode.append(modeSelect);root.append(mode);
  field(root,'Displayed label',o.pointLabel||'','text',v=>edit(live=>{if(live.pointLabelMode==='latex'&&v)validateLatexInput(v);live.pointLabel=v;})).closest('label').classList.add('short-label-field');
 }
 // Diagram nodes, morphisms and Text already use their editable 'text' property.
 // All other shapes now expose optional independent on-canvas labels, never names/IDs.
 if(!pointRole(o,id=>get(doc,id))&&!['node','morphism','text'].includes(o.type)){
  const mode=document.createElement('label');mode.className='field';mode.textContent='Label format';const select=document.createElement('select');
  for(const [value,label] of [['plain','Plain text'],['latex','LaTeX math']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
  select.value=o.displayLabelMode||'plain';select.onchange=()=>edit(live=>{if(select.value==='latex'&&live.displayLabel)validateLatexInput(live.displayLabel);live.displayLabelMode=select.value;});mode.append(select);root.append(mode);
  field(root,'Displayed label',o.displayLabel||'','text',v=>edit(live=>{if(live.displayLabelMode==='latex'&&v)validateLatexInput(v);live.displayLabel=v;})).closest('label').classList.add('short-label-field');
 }
 if(o.type==='triangleCenter'){
  const label=document.createElement('label');label.className='field';label.textContent='Center';const pick=document.createElement('select');
  for(const kind of ['centroid','circumcenter','incenter','orthocenter','excenterA','excenterB','excenterC']){const opt=document.createElement('option');opt.value=kind;opt.textContent=kind.startsWith('excenter')?'Excenter '+kind.at(-1):kind[0].toUpperCase()+kind.slice(1);pick.append(opt);}
  pick.value=o.centerKind;pick.onchange=()=>edit(live=>{live.centerKind=pick.value;});label.append(pick);root.append(label);
 }
 if(['point','node','text'].includes(o.type)){
  const coords=document.createElement('div');coords.className='twocol';for(let i=0;i<2;i++){
   const l=document.createElement('label');l.textContent=i?'y':'x';const input=document.createElement('input');input.type='number';input.step='any';input.value=String(o.xy[i]);
   input.onchange=()=>{if(input.value.trim()&&finite(Number(input.value))&&Object.is(Number(input.value),get(doc,o.id)?.xy?.[i]))return;const ok=edit(live=>{if(!input.value.trim())throw Error('Coordinate is required.');const v=Number(input.value);if(!finite(v))throw Error('Invalid coordinate.');const before=clone(doc);live.xy[i]=v;guardAnchorMove(before,doc,live.id);});if(!ok)input.value=String(get(doc,o.id)?.xy?.[i]??o.xy[i]);};l.append(input);coords.append(l);
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
 if(o.type==='freehand'){
  const shape=o.curveShape||'free';
  const grid=document.createElement('div');grid.className='freehand-shape-grid';root.append(grid);
  const buildChoice=(title,value,options,apply)=>{
   const label=document.createElement('label');label.className='field';label.append(document.createTextNode(title));
   const select=document.createElement('select');select.setAttribute('aria-label',title);
   for(const [key,caption]of options){const option=document.createElement('option');option.value=key;option.textContent=translated(caption,uiPrefs.language);select.append(option);}
   select.value=value;select.onchange=()=>apply(select.value);label.append(select);grid.append(label);return select;
  };
  const shapeSelect=buildChoice('Shape',shape,SHAPE_CHOICES,next=>{freehandShapeMode=next;
   const current=get(doc,o.id),raw=current?.rawPath||current?.path;
   const prepared=next==='free'&&current?.rawPath?{path:current.rawPath,closed:false}:shapeFromStroke(raw,next,current?.curveRegular!==false);
   if(!prepared){shapeSelect.value=current?.curveShape||'free';notice('Draw a larger closed stroke for this shape.');return;}
   if(edit(live=>{live.curveShape=next;live.path=prepared.path;live.closed=prepared.closed;
    if(next!=='free')live.rawPath=raw.map(p=>p.slice());else delete live.joinStyle;
   })!==false)renderProperties();
  });
  const regularLabel=document.createElement('label');regularLabel.className='check freehand-regular-check';
  const regularCheckbox=document.createElement('input');regularCheckbox.type='checkbox';regularCheckbox.checked=o.curveRegular!==false;
  regularCheckbox.onchange=()=>{freehandRegular=regularCheckbox.checked;
   const current=get(doc,o.id),raw=current?.rawPath||current?.path;
   const prepared=current?.curveShape&&current.curveShape!=='free'?shapeFromStroke(raw,current.curveShape,regularCheckbox.checked):null;
   if(edit(live=>{live.curveRegular=regularCheckbox.checked;if(prepared){live.path=prepared.path;live.closed=true;}})===false)regularCheckbox.checked=!regularCheckbox.checked;
  };
  regularLabel.append(regularCheckbox,document.createTextNode(' Regular'));grid.append(regularLabel);
  const isShape=shape!=='free',line=o.curveLine||'solid';
  const lineSelect=buildChoice('Line style',isShape&&!SHAPE_LINE_CHOICES.some(([v])=>v===line)?'solid':line,isShape?SHAPE_LINE_CHOICES:LINE_CHOICES,next=>{freehandLine=next;
   if(edit(live=>{live.curveLine=next;})!==false)renderProperties();
  });
  const heads=o.curveHeads||o.curveArrows||'none';
  const headSelect=buildChoice('Arrowheads',isShape?'none':visibleArrowheads(line,FREE_CURVE_HEAD_CHOICES.some(([v])=>v===heads)?heads:'none'),FREE_CURVE_HEAD_CHOICES,next=>{freehandHeads=next;edit(live=>{live.curveHeads=next;});});
  headSelect.disabled=isShape||HEADLESS_LINE_STYLES.has(line);
  headSelect.title=isShape?'Arrows are unavailable for ellipses and polygons.':HEADLESS_LINE_STYLES.has(line)?'Double and Wavy lines have no arrowheads.':'';
 }
 if(o.type==='morphism'){
  const appearance=inheritedMorphismAppearance(o);
  const morphStyleGrid=document.createElement('div');morphStyleGrid.className='compact-properties-grid';root.append(morphStyleGrid);
  const morphChoice=(title,value,options,key)=>{const label=document.createElement('label');label.className='field';label.textContent=title;const choice=document.createElement('select');choice.setAttribute('aria-label',title);
   for(const [id,caption] of options){const option=document.createElement('option');option.value=id;option.textContent=caption;choice.append(option);}
   choice.value=value;choice.onchange=()=>{const next=choice.value;if(edit(live=>{live[key]=next;})===false)return;
    if(key==='morphismLine'){const heads=root.querySelector('select[aria-label="Arrowheads"]');if(heads){const headless=HEADLESS_LINE_STYLES.has(next);heads.disabled=headless;const current=get(doc,o.id);heads.value=visibleArrowheads(next,current?inheritedMorphismAppearance(current).heads:'end');heads.title=headless?'Double and Wavy lines have no arrowheads.':'';}}
   };label.append(choice);morphStyleGrid.append(label);};
  morphChoice('Line style',appearance.line,LINE_CHOICES,'morphismLine');
  morphChoice('Arrowheads',visibleArrowheads(appearance.line,appearance.heads),HEAD_CHOICES,'morphismHeads');
  if(HEADLESS_LINE_STYLES.has(appearance.line)){const select=root.querySelector('select[aria-label="Arrowheads"]');select.disabled=true;select.title='Double and Wavy lines have no arrowheads.';}

  const pair=document.createElement('div');pair.className='property-check-number-pair';root.append(pair);
  const side=document.createElement('label');side.className='check compact-property-check';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!o.swap;
  cb.onchange=()=>edit(live=>{live.swap=cb.checked;});side.append(cb,document.createTextNode(' Swap side'));pair.append(side);
  field(pair,'Bend',o.bend||0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>5)throw Error('Bend range: −5 to 5.');live.bend=v;}),{min:-5,max:5,step:.1});

  const numericGrid=document.createElement('div');numericGrid.className='compact-numeric-grid diagram-numeric-grid';numericGrid.setAttribute('role','group');numericGrid.setAttribute('aria-label','Arrow label positioning');root.append(numericGrid);
  field(numericGrid,'Label position',o.labelT??.5,'number',v=>edit(live=>{if(!finite(v)||v<.05||v>.95)throw Error('Label position must be 0.05–0.95.');live.labelT=v;}),{min:.05,max:.95,step:.05});
  field(numericGrid,'Label distance (px)',o.labelDistance??17,'number',v=>edit(live=>{if(!finite(v)||v<0||v>200)throw Error('Label distance must be 0–200 px.');live.labelDistance=v;}),{min:0,max:200,step:1});
  field(numericGrid,'Label shift X (px)',o.labelDx??0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>300)throw Error('Label shift must be between −300 and 300 px.');live.labelDx=v;}),{min:-300,max:300,step:1});
  field(numericGrid,'Label shift Y (px)',o.labelDy??0,'number',v=>edit(live=>{if(!finite(v)||Math.abs(v)>300)throw Error('Label shift must be between −300 and 300 px.');live.labelDy=v;}),{min:-300,max:300,step:1});
 }
 if(o.type==='function')field(root,'f(x)',o.expr,'text',v=>edit(live=>{parseExpression(v);live.expr=v;}));
 if(o.type==='parametric'){
  // Legacy documents may use u, v or the historical split u/v scheme.
  // Present t consistently, converting both expressions only when edited.
  const toT=(expr,axis,parameter)=>parameter?renameCurveParameter(expr,parameter,'t'):renameCurveParameter(expr,axis==='x'?'u':'v','t');
  const xText=toT(o.xExpr,'x',o.parameter),yText=toT(o.yExpr,'y',o.parameter);
  const change=(axis,value)=>edit(live=>{
   const x=axis==='x'?value:toT(live.xExpr,'x',live.parameter);
   const y=axis==='y'?value:toT(live.yExpr,'y',live.parameter);
   parseParametric(x,y,'t');live.xExpr=x;live.yExpr=y;live.parameter='t';
  });
  const polarLabel=document.createElement('label');polarLabel.className='check compact-property-check';
  const polarToggle=document.createElement('input');polarToggle.type='checkbox';polarToggle.checked=o.polar===true;
  polarToggle.setAttribute('aria-label',translated('Use polar coordinates',uiPrefs.language));
  polarToggle.onchange=()=>{if(edit(live=>{live.polar=polarToggle.checked;if(live.polar){live.rExpr??='1';live.rMin??=0;live.rMax??=100;}})!==false)renderProperties();};
  polarLabel.append(polarToggle,document.createTextNode(' '+translated('Use polar coordinates',uiPrefs.language)));root.append(polarLabel);
  if(o.polar){
   field(root,'r(t)',o.rExpr??'1','text',v=>edit(live=>{r50ParseExpr(v,['t']);live.rExpr=v;}));
   const radial=document.createElement('div');radial.className='parametric-range-grid';root.append(radial);
   field(radial,'r min',o.rMin??0,'number',v=>edit(live=>{if(!finite(v)||v>=live.rMax||Math.abs(v)>1e6)throw Error('Invalid polar radius minimum.');live.rMin=v;}),{step:.1});
   field(radial,'r max',o.rMax??100,'number',v=>edit(live=>{if(!finite(v)||v<=live.rMin||Math.abs(v)>1e6)throw Error('Invalid polar radius maximum.');live.rMax=v;}),{step:.1});
  }else{
  field(root,'x(t)',xText,'text',v=>change('x',v));
  field(root,'y(t)',yText,'text',v=>change('y',v));
  }
  const range=document.createElement('div');range.className='parametric-range-grid';root.append(range);
  field(range,'t min',o.tMin,'number',v=>edit(live=>{if(!finite(v)||v>=live.tMax||Math.abs(v)>1e6)throw Error('Start must precede end.');live.tMin=v;}),{step:0.1});
  field(range,'t max',o.tMax,'number',v=>edit(live=>{if(!finite(v)||v<=live.tMin||Math.abs(v)>1e6)throw Error('End must follow start.');live.tMax=v;}),{step:0.1});
 }
 if(o.type==='implicit')field(root,'F(x, y)',o.expr,'text',v=>edit(live=>{parseImplicit(v);live.expr=v;}));
 if(o.type==='vectorField'){
  field(root,'X(x, y)',o.xExpr,'text',v=>edit(live=>{parseVectorField(v,live.yExpr);live.xExpr=v;}));
  field(root,'Y(x, y)',o.yExpr,'text',v=>edit(live=>{parseVectorField(live.xExpr,v);live.yExpr=v;}));
  const pair=document.createElement('div');pair.className='property-check-number-pair';root.append(pair);
  const check=document.createElement('label');check.className='check';const input=document.createElement('input');input.type='checkbox';input.checked=o.normalized;input.onchange=()=>edit(live=>{live.normalized=input.checked;});check.append(input,document.createTextNode(' Normalize lengths'));pair.append(check);
  field(pair,'Density',o.density,'number',v=>edit(live=>{if(!Number.isInteger(v)||v<3||v>40)throw Error('Arrow density must be 3–40.');live.density=v;}),{min:3,max:40,step:1});
 }
 if(o.type==='domainColoring'){
  field(root,'F(z)',o.expr,'text',v=>edit(live=>{parseComplexExpression(v);live.expr=v;}));
  const modes=document.createElement('label');modes.className='field';modes.textContent=translated('Color scheme',uiPrefs.language);
  const select=document.createElement('select');for(const [value,name] of [['phase-modulus','Phase + modulus'],['phase','Phase only'],['contours','Modulus bands']]){const opt=document.createElement('option');opt.value=value;opt.textContent=translated(name,uiPrefs.language);select.append(opt);}
  select.value=o.colorMode||'phase-modulus';select.onchange=()=>edit(live=>{live.colorMode=select.value;});modes.append(select);root.append(modes);
  field(root,'Coloring resolution',o.resolution??768,'number',v=>edit(live=>{if(!Number.isInteger(v)||v<32||v>MAX_DOMAIN_RESOLUTION)throw Error('Resolution must be 32–1536.');live.resolution=v;}),{min:32,max:MAX_DOMAIN_RESOLUTION,step:64});
 }
 if(['vectorField','domainColoring'].includes(o.type)){
  const form=document.createElement('div');form.className='plot-region-editor';form.setAttribute('role','group');form.setAttribute('aria-label',translated('Drawing region',uiPrefs.language));
  const entries={};for(const [key,label] of [['xMin','x min'],['xMax','x max'],['yMin','y min'],['yMax','y max']]){
   entries[key]=field(form,translated(label,uiPrefs.language),o.region[key],'text',()=>true,{hint:'Finite arithmetic expression; min must be less than max.'});
   entries[key].onchange=()=>{};
  }
  installPlotRegionKeys(form,entries,()=>edit(live=>{const region=Object.fromEntries(Object.entries(entries).map(([k,input])=>[k,parse2DRegionBound(input.value)]));validatePlotRegion(region);live.region=region;}),{parseBound:parse2DRegionBound,conditionValue:o.regionCondition,conditionCommit:value=>edit(live=>{live.regionCondition=value;}),dimension:2});
  root.append(form);
 }
 if(o.type==='regularPolygon')field(root,'Number of sides',o.sides,'number',v=>edit(live=>{if(!Number.isInteger(v)||v<3||v>100)throw Error('Regular polygon sides must be 3–100.');resizeRegularPolygon(doc,live.id,v);}),{step:1,min:3,max:100});
 const measurement=measureGeometry(o,createResolver(doc));
 if(measurement){
  const label=measurement.kind==='length'?'Length (units)':measurement.kind==='angle'?'Angle (degrees)':'Area (units²)';
  const measure=document.createElement('label');measure.className='field measurement-field';measure.textContent=translated(label,uiPrefs.language);
  // Use the same textbox width as other Properties fields, but not an editable input.
  const output=document.createElement('input');output.type='text';output.readOnly=true;
  output.className='measurement-value';output.value=measurement.value===null?'—':String(Number(measurement.value.toPrecision(8)));
  output.setAttribute('aria-label',translated(label,uiPrefs.language));output.setAttribute('aria-readonly','true');
  measure.append(output);root.append(measure);
 }
 // Compact appearance controls reuse the existing transaction handlers. Keep
 // fill absent for ineligible types and preserve the existing field order.
 const styleGrid=document.createElement('div');styleGrid.className='style-controls-grid';
 styleGrid.setAttribute('role','group');styleGrid.setAttribute('aria-label','Object appearance');
 function styleSlot(name){const slot=document.createElement('div');slot.className='style-slot style-'+name;styleGrid.append(slot);return slot;}
 if(o.type==='vectorField')styleGrid.classList.add('vector-style-grid');
 const strokeSlot=styleSlot('stroke');
 const picker=field(strokeSlot,o.type==='vectorField'?'Vector color':'Stroke',o.style.stroke,'color',v=>edit(live=>live.style.stroke=v));
 picker.disabled=o.type==='vectorField'&&o.colorRange===true;
 const swatches=appendColorSwatches(strokeSlot,{scope:'object',property:'stroke',apply:v=>edit(live=>{if(live.type==='vectorField'&&live.colorRange)throw Error('Disable Color range to select a single color.');live.style.stroke=v;})});
 if(o.type==='vectorField'){
  for(const button of swatches.querySelectorAll('button'))button.disabled=o.colorRange===true;
  const mode=styleSlot('color-range'),label=document.createElement('label');label.className='check';
  const check=document.createElement('input');check.type='checkbox';check.checked=o.colorRange===true;
  check.onchange=()=>{if(edit(live=>{live.colorRange=check.checked;})===false){check.checked=!check.checked;return;}picker.disabled=check.checked;for(const button of swatches.querySelectorAll('button'))button.disabled=check.checked;};label.append(check,' '+translated('Color range',uiPrefs.language));mode.append(label);
 }
 if(['polygon','regularPolygon','ellipse','rectangle','parallelogram','node'].includes(o.type)){
  const fillSlot=styleSlot('fill');
  field(fillSlot,'Fill',o.style.fill,'color',v=>edit(live=>{live.style.fill=v;if(live.type==='ellipse')live.ellipseFilled=true;}));
  appendColorSwatches(fillSlot,{scope:'object',property:'fill',apply:v=>edit(live=>{live.style.fill=v;if(live.type==='ellipse')live.ellipseFilled=true;})});
 }
 if(!styleGrid.querySelector('.style-fill'))styleGrid.classList.add('stroke-only-grid');
 field(styleSlot('opacity'),'Opacity',o.style.opacity,'number',v=>edit(live=>{if(!finite(v)||v<0||v>1)throw Error('Opacity must be in [0,1].');live.style.opacity=v;}),{step:.1,min:0,max:1});
 field(styleSlot('width'),styleGrid.classList.contains('stroke-only-grid')?'Width':'Line width',o.style.width,'number',v=>edit(live=>{if(!finite(v)||v<.1||v>100)throw Error('Width must be 0.1–100.');live.style.width=v;}),{step:.5,min:.1,max:100});
 if(pointRole(o,id=>get(doc,id)))field(styleSlot('pointsize'),'Size',o.style.pointSize??doc.settings.pointSize,'number',v=>edit(live=>{if(!finite(v)||v<1||v>100)throw Error('Point size must be 1–100.');live.style.pointSize=v;}),{step:1,min:1,max:100});
 root.append(styleGrid);
 localizeUI(root,uiPrefs.language);
 const actions=document.createElement('div');actions.className='props-actions';
 const del=document.createElement('button');del.textContent='Delete + dependents';del.onclick=()=>{if(currentObject(o)&&selected===o.id)deleteSelected();};
 const up=document.createElement('button');up.textContent='Bring forward';up.onclick=()=>edit(live=>{const n=doc.objects.indexOf(live);if(n>=0&&n<doc.objects.length-1)doc.objects.splice(n,2,doc.objects[n+1],live);});
 const down=document.createElement('button');down.textContent='Send backward';down.onclick=()=>edit(live=>{const n=doc.objects.indexOf(live);if(n>0)doc.objects.splice(n-1,2,live,doc.objects[n-1]);});
 const focus=document.createElement('button');focus.textContent='Center view';focus.onclick=()=>{const live=get(doc,o.id);if(live!==o)return;const p=pointRole(live,id=>get(doc,id))||live.type==='node'?position(doc,live.id):live.xy||position(doc,live.refs?.[0]);if(p){view.cx=p[0];view.cy=p[1];scheduleRender();}};
 actions.append(del,focus,down,up);root.append(actions);localizeUI(root,uiPrefs.language);
}
function renderAll(){renderList();renderProperties();render();syncSettings();localizeUI(document.documentElement,uiPrefs.language);}
function select(id){setSelection(id?[id]:[],id);}
function clearDraft(){draftMeasure=null;draftStart=null;draftPoints=[];draftNode=null;draftReference=null;hover=null;pendingTouchTap=null;}
const toolInstructions={
 pointOnObject:'Click an existing line, circle or curve; then click the desired constrained position.',
 tangentCircle:'Click an external point, then a circle. Both tangents are constructed.',
 circularArc:'Click start, a point on the arc, and end.',
 parabola:'Click focus point, then a directrix line.',hyperbola:'Click two foci, then a point on the hyperbola.',
 generalIntersection:'Click two different curves to construct their crossings.',
 reflection:'Click a geometric object, then a mirror line.',
 circleInversion:'Choose an object, then an inversion circle. The circle center has no image.',
 rotation:'Click a geometric object, then a center; enter the rotation angle (degrees).',
 translation:'Click an object, then a translation start and end point.',
 dilation:'Click a geometric object, then a center; enter a scale factor.',
 locus:'Click a dependent point, then a point constrained to an object.',
 fixedLength:'Click the start point; enter a length, then choose its direction. Drag the endpoint to rotate.',
 fixedAngle:'Choose a reference ray point and vertex, then enter an angle; drag the point on the resulting ray.',
 triangleCenter:'Click three noncollinear triangle vertices; center kind can be changed in Properties.',perpendicularFoot:'Click a source point, then a straight line, ray or segment; the foot remains dynamically attached.',angleBisector:'Click three points; the second point is the vertex of the angle.',parallelThrough:'Click a point, then a straight line, segment, or ray.',perpendicularThrough:'Click a point, then a straight line, segment, or ray.',intersection:'Click two crossing straight objects.',circleIntersection:'Click two straight objects, two circles, or one of each; all finite intersections are created.',midpoint:'Click two points; the midpoint follows both.',ray:'Click the start, then the direction point.',perpBisector:'Click two points; the bisector stays perpendicular as they move.',circleDiameter:'Click two opposite ends of a diameter.',circleThrough3:'Click three noncollinear points.',triangle:'Click three vertices.',quadrilateral:'Click four vertices.',spline:'Click at least three points; Enter finishes.',closedSpline:'Click at least three points; click the starting point to close smoothly.',select:'Drag objects to move; drag empty canvas to pan. Shift-drag empty canvas selects a rectangle.',pan:'Drag the canvas.',polygon:'Click vertices; click the starting point to close.',polyline:'Click vertices; Enter finishes.',bezier:'Click four control points.',angle:'Click three points (vertex second).',freehand:'Drag to draw a free curve.',morphism:'Click source and target nodes.',regularPolygon:'Click center, then a vertex.',node:'Click the canvas to add a node.',ellipse:'Click the first focus, second focus, then a point on the ellipse.',rectangle:'Click an edge start, edge end, then a point indicating perpendicular height.',parallelogram:'Click three consecutive vertices.'};
function updateModeLabel(t){
 const label=toolGroups['basic-tools'].concat(toolGroups['construction-tools'],toolGroups['diagram-tools']).find(([id])=>id===t)?.[1]||t;
 const localized=translated(label,uiPrefs.language),help=toolInstructions[t]||'Click the canvas.';
 const mode=$('mode-label');mode.textContent=localized;mode.removeAttribute('title');mode.removeAttribute('tabindex');
 mode.setAttribute('aria-label',localized+': '+help);
 $('drawing').setAttribute('aria-label','Interactive mathematical drawing canvas · '+localized+': '+help);
}
// Grid snapping for diagram work is a temporary interaction mode, not a
// document setting. A focused selected node/arrow also activates it in Move.
// Do not treat selection of other geometric objects as diagram focus.
function diagramSnapFocus(){
 return !in3D()&&(['node','morphism','text'].includes(tool)||
  (tool==='select'&&[...selectedIds].some(id=>['node','morphism'].includes(get(doc,id)?.type))));
}
function syncDiagramSnapFocus(announce=false){
 const next=diagramSnapFocus()?true:null,previous=gridSnapOverride;
 gridSnapOverride=next;
 const input=$('snap');if(input){input.checked=next??doc.settings.snap;input.disabled=next===true;}
 if(announce&&previous!==next){
  notice(next===true?'Grid snapping temporarily enabled for diagram editing.':'Grid snapping restored to your saved setting.');
 }
}
function selectTool(t){
 if(in3D())return;
 if(!TOOLS.includes(t))return;
 if(drag)cancelDrag();lastMoveCanvasTap=null;tool=t;clearDraft();$('drawing').dataset.tool=t;
 syncDiagramSnapFocus(true);
 document.querySelectorAll('[data-tool-choice]').forEach(b=>{const active=b.dataset.toolChoice===t;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false');});
 // A drawing tool needs its creation options, not the previously selected object's editor.
 // Keep the freehand preset across tool switches, but reveal it when entering this tool.
 if(t==='freehand'&&selectedIds.size){select(null);}
 updateModeLabel(t);renderProperties();scheduleRender();
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
  const parent=['construction-tools','transform-tools'].includes(id)?geometryTargets.get(type):$(id);
  if(!parent)throw new Error('Missing Geometry category for '+type);
  const button=document.createElement('button');button.className='tool';button.dataset.toolChoice=type;
  button.title=label+(shortcutForTool[type]?' ('+shortcutForTool[type]+')':'');button.setAttribute('aria-label',label);
  if(shortcutForTool[type])button.setAttribute('aria-keyshortcuts',shortcutForTool[type]);
  // Keep SVG paths unchanged outside explicitly authorized glyphs. Extra viewBox
  // breathing room prevents stroke and control-dot clipping at tile edges.
  button.innerHTML=`${toolGlyphSvg(type)}<span>${label}</span>`;
  if(['construction-tools','transform-tools'].includes(id))button.dataset.advancedGeometry=String(!ESSENTIAL_GEOMETRY.has(type));
  button.onclick=()=>selectTool(type);parent.append(button);
 }
 selectTool('select');
}
function syncGeometryVisibility(){
 // Round 44: every Geometry tool is permanently available; no essential subset.
 for(const button of document.querySelectorAll('[data-advanced-geometry]'))button.hidden=false;
}
function syncTooltips(){
 for(const button of document.querySelectorAll('[data-tool-choice]')){
  if(button.hasAttribute('title'))button.dataset.fullTooltip=button.getAttribute('title');
  if(uiPrefs.showTooltips===false)button.removeAttribute('title');
  else if(button.dataset.fullTooltip)button.title=button.dataset.fullTooltip;
 }
}
function polarParametric(o){
 const r=r50ParseExpr(o.rExpr,['t']);
 return t=>{const radius=r({t});return Number.isFinite(radius)&&radius>=o.rMin&&radius<=o.rMax
  ?[radius*Math.cos(t),radius*Math.sin(t)]:[NaN,NaN];};
}
function syncPlotModeControl(){
 const plotInput=$('command'),plotY=$('command-y'),plotZ=$('command-z'),mode=$('plot-mode').value,symbol=$('parameter-symbol'),three=in3D();
 const preview=$('plot-mode-preview');
 if(preview){preview.hidden=false;preview.innerHTML=plotGlyphSvg(mode);preview.title=$('plot-mode').selectedOptions[0]?.textContent||mode;}
 const multiple=['parametric','vectorField','parametric3d','vector3d'].includes(mode);
 plotY.hidden=!multiple;plotZ.hidden=!three||!['parametric3d','vector3d'].includes(mode);
 symbol.value='t';symbol.hidden=true;
 const placeholders={function:'sin(x)',parametric:`cos(${symbol.value})`,implicit:'x^2+y^2=1',vectorField:'-y',domainColoring:'z^2+1',domain3d:'z^2+1',surface3d:'sin(x)*cos(y)',parametric3d:'cos(u)*sin(v)',implicit3d:'x^2+y^2+z^2=4',vector3d:'-y'};
 plotInput.placeholder=placeholders[mode]||'Expression';plotY.placeholder=mode==='parametric'?`sin(${symbol.value})`:mode==='vectorField'?'x':mode==='parametric3d'?'sin(u)*sin(v)':'x';
 plotZ.placeholder=mode==='parametric3d'?'cos(v)':'z';
 plotInput.setAttribute('aria-label',mode==='vectorField'?'X(x, y) =':['domainColoring','domain3d'].includes(mode)?'F(z) =':mode==='parametric'?`x(${symbol.value}) =`:three?'3D first component':'Function or construction command');
 plotY.setAttribute('aria-label',mode==='vectorField'?'Y(x, y) =':mode==='parametric'?`y(${symbol.value}) =`:three?'3D second component':'Second component');
}
function sync3DInterface(){
 const enabled=in3D();document.documentElement.classList.toggle('three-d',enabled);$('scene3d-enable').checked=enabled;
 $('objects').hidden=enabled;$('objects-3d').hidden=!enabled;
 $('scene3d-background').value=doc.settings.background;
 $('scene3d-export-scale').value=String(doc.settings.exportScale);
 $('scene3d-theme').value=$('theme').value;
 $('scene3d-export-transparent').checked=!!doc.settings.exportTransparent;
 const options=doc.scene3d?.options;
 if(options)for(const [id,key] of [['scene3d-projection','projection'],['scene3d-detail','detail'],['scene3d-yaw','yaw'],['scene3d-pitch','pitch'],['scene3d-opacity','opacity'],['scene3d-cube','cube'],['scene3d-lighting','lighting'],['scene3d-grid','grid'],['scene3d-axes','axes']]){
  const input=$(id);if(input.type==='checkbox')input.checked=options[key];else input.value=['yaw','pitch'].includes(key)&&Number.isFinite(options[key])?String(Number(options[key].toFixed(2))):options[key];
 }
 const select=$('plot-mode'),prior=select.value,desired=enabled?
  [['surface3d','Function'],['parametric3d','Parametric surface'],['implicit3d','Implicit surface'],['vector3d','Vector field'],['domain3d','Domain coloring']]:
  [['function','Function'],['parametric','Parametric'],['implicit','Implicit'],['vectorField','Vector field'],['domainColoring','Domain coloring']];
 if(select.options.length!==desired.length||[...select.options].some((e,i)=>e.value!==desired[i][0])){
  select.replaceChildren();for(const [value,label] of desired){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
  select.value=desired.some(([key])=>key===prior)?prior:desired[0][0];
  select.dispatchEvent(new Event('input'));
 }
 localizeUI(select,uiPrefs.language);
 syncPlotModeControl();
 $('mode-label').textContent=enabled?'3D':'Select · drag points to edit';
}
function syncSettings(){
 for(const [id,k]of [['naming-convention','namingConvention'],['snap-objects','snapObjects'],['freehand-close','freehandClose'],['correction','correction'],['plot-quality','plotQuality'],['plot-budget','plotBudget'],['implicit-grid','implicitGrid'],['polygon-sides','polygonSides'],['snap-step','snapStep'],['snap','snap'],['snap-anchors','snapAnchors'],['grid','grid'],['axes','showAxes'],['labels','showLabels'],['label-placement','labelPlacement'],['default-stroke','stroke'],['default-fill','fill'],['default-width','width'],['point-size','pointSize'],['default-opacity','opacity'],['page','page'],['export-region','exportRegion'],['export-guides','exportGuides'],['export-scale','exportScale'],['export-transparent','exportTransparent'],['background','background']]){
  const input=$(id);if(!input)continue;if(input.type==='checkbox')input.checked=!!doc.settings[k];else input.value=doc.settings[k];
 }
 sync3DInterface();
 syncDiagramSnapFocus();
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
  if(!$(id))continue;$(id).onchange=()=>update(()=>{
   const input=$(id);if(input.type==='number'&&!input.value.trim())throw Error('Value is required.');
   const value=input.type==='checkbox'?input.checked:(input.type==='number'||['exportScale','plotBudget'].includes(k))?Number(input.value):input.value;
   if(input.type==='number'&&!finite(value))throw Error('Value must be finite.');
   if(k==='pointSize'&&value!==doc.settings.pointSize)preserveInheritedPointSizes(doc);
   doc.settings[k]=value;
   if(k==='page'&&value==='infinite')doc.settings.exportRegion='viewport';
  },['exportRegion','exportGuides','exportScale','exportTransparent'].includes(k)?{refreshList:false,renderCanvas:false}:{});
 }
 for(const [id,key] of [['scene3d-projection','projection'],['scene3d-detail','detail'],['scene3d-yaw','yaw'],['scene3d-pitch','pitch'],['scene3d-opacity','opacity'],['scene3d-cube','cube'],['scene3d-lighting','lighting'],['scene3d-grid','grid'],['scene3d-axes','axes']]){
  $(id).onchange=()=>{
   if(!in3D()||!doc.scene3d)return;
   const node=$(id),value=node.type==='checkbox'?node.checked:node.type==='number'?Number(node.value):node.value;
   // A committed numeric field fires change again when a later button is
   // pressed (blur). Rebuilding the 3D list on that pointerdown detached the
   // target Lock/Delete button before pointerup and silently lost the click.
   if(Object.is(doc.scene3d.options[key],value))return;
   update(()=>{doc.scene3d.options[key]=value;});
  };
 }
 $('scene3d-background').onchange=()=>update(()=>{doc.settings.background=$('scene3d-background').value;});
 $('scene3d-export-scale').onchange=()=>update(()=>{doc.settings.exportScale=Number($('scene3d-export-scale').value);},{refreshList:false,renderCanvas:false});
 $('scene3d-export-transparent').onchange=()=>update(()=>{doc.settings.exportTransparent=$('scene3d-export-transparent').checked;},{refreshList:false,renderCanvas:false});
 $('scene3d-theme').onchange=()=>{$('theme').value=$('scene3d-theme').value;$('theme').onchange();};
 $('scene3d-enable').onchange=()=>{const state=$('scene3d-enable').checked;const success=update(()=>{if(state&&!doc.scene3d)doc.scene3d=newScene3D();doc.settings.plot3dEnabled=state;selected3d=null;});if(success)sync3DInterface();};
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
 const mins={rectangle:3,parallelogram:3,polygon:3,polyline:2,spline:3,closedSpline:3,bezier:4,angle:3,angleBisector:3,circularArc:3,hyperbola:3,triangleCenter:3,circleThrough3:3,triangle:3,quadrilateral:4};if(!mins[tool]||draftPoints.length<mins[tool]){notice('Add more vertices before finishing.');return;}
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
  if(['circularArc','hyperbola','triangleCenter'].includes(type)){
   if(!circumcircle(pts)&&['circularArc','triangleCenter'].includes(type))throw Error('Choose noncollinear points.');
   if(type==='hyperbola')checkNewGeometry(type,refs.map(id=>position(doc,id)));
  }else checkNewRefs(storedType,refs);
  if(type==='closedSpline'&&refs[0]===refs.at(-1))throw Error('Closed spline cannot duplicate the first vertex.');
  selected=append(doc,{type:storedType,refs,...(type==='triangleCenter'?{centerKind:'centroid'}:{}),...(type==='closedSpline'?{closed:true}:{})}).id;
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
 if(in3D()){if(e.button!==0||cameraDrag)return;const [x,y]=xyEvent(e);cameraDrag={pointerId:e.pointerId,x,y,yaw:doc.scene3d.options.yaw,pitch:doc.scene3d.options.pitch};orbitRenderQueued=false;if(sceneRenderPending)cancelSceneRender();try{$('drawing').setPointerCapture(e.pointerId);}catch{}return;}

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
  // A canvas repaint can retarget browser dblclick to the SVG root.
  // Match consecutive real pointer-down hits on the same object instead.
  // A selected morphism's label handle has priority over point and path hits.
  // This must be checked before the generic overlapping-object selection logic.
  const labelId=e.target.closest('[data-label-handle]')?.getAttribute('data-label-handle');
  const actualHit=labelId||hitTestPoint(sx,sy)||e.target.closest('[data-id]')?.dataset.id||null;
  const now=performance.now(),previous=lastMoveCanvasTap;
  const plainClick=!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey;
  const doubleHit=plainClick&&actualHit&&previous?.id===actualHit&&
    now-previous.at<500&&Math.hypot(sx-previous.x,sy-previous.y)<=9;
  lastMoveCanvasTap=plainClick&&actualHit?{id:actualHit,at:now,x:sx,y:sy}:null;
  if(doubleHit){
   lastMoveCanvasTap=null;
   // Defer point navigation until release: a fast select-then-drag shares
   // the same second pointerdown as a double-click. Do not swallow that drag.
   const point=get(doc,actualHit);
   if(point&&!point.hidden&&!point.locked&&['point','node','text','pointOnObject'].includes(point.type)){
    select(actualHit);
    drag={kind:'point',pointerId:e.pointerId,id:actualHit,before:JSON.stringify(doc),
     sx,sy,moved:false,excluded:affected(doc,actualHit),doubleNavigate:true};
    try{$('drawing').setPointerCapture(e.pointerId);}catch{}
    e.preventDefault();return;
   }
   // Other objects have no point-drag gesture; navigate immediately.
   select(actualHit);navigateToObject(actualHit);e.preventDefault();return;
  }
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
  const id=actualHit;
  if(e.altKey){drag={kind:'pan',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy};}
  else if(id&&(e.ctrlKey||e.metaKey||e.shiftKey)){
   // Preserve overlapping-object cycling with Ctrl; Shift targets the topmost hit.
   selectToggle((e.ctrlKey||e.metaKey)?stackedSelection(e,sx,sy)||id:id);
  }else if(!id){
   drag=(e.shiftKey||e.ctrlKey||e.metaKey)&&e.pointerType!=='touch'
    ?{kind:'marquee',pointerId:e.pointerId,sx,sy,ex:sx,ey:sy,additive:true}
    :{kind:'pan',pointerId:e.pointerId,sx,sy,cx:view.cx,cy:view.cy,emptyMove:true};
  }else{
   select(id);
   const o=get(doc,id);if(o&&!o.hidden&&!o.locked&&['point','node','text','pointOnObject'].includes(o.type))drag={kind:'point',pointerId:e.pointerId,id,before:JSON.stringify(doc),sx,sy,moved:false,excluded:affected(doc,id)};
  }
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
function r50Number(message,defaultValue,convert=1){
 const text=window.prompt(message,String(defaultValue));if(text===null)return null;
 let value;try{value=r50ParseExpr(text,[])({})*convert;}catch(error){notice(error.message);return null;}
 if(!finite(value)){notice('Enter a finite parameter.');return null;}return value;
}
/** Canvas can repaint during hover before pointerdown; the event target may
 * be the background even while a visible curve is under the pointer. Resolve
 * from the live SVG hit stack as a fallback. Never match unrelated UI nodes. */
function constructionHit(e,accept=()=>true){
 const svg=$('drawing'),seen=new Set();
 const ids=[e.constructionHitId,e.target.closest?.('[data-id]')?.dataset.id];
 // Prefer actual document objects; only fall back to immutable guides if the
 // pointer lies on the displayed x or y axis. At the origin a second click
 // naturally chooses the *other* axis for an axis-axis intersection.
 const axisHits=[];
 if(doc.settings.showAxes&&!in3D()){
  const [sx,sy]=xyEvent(e),[zx,zy]=project([0,0]);
  if(Math.abs(sy-zy)<=7)axisHits.push('axis-x');
  if(Math.abs(sx-zx)<=7)axisHits.push('axis-y');
  if(draftReference&&axisHits.includes(draftReference)&&axisHits.length===2)axisHits.reverse();
 }
 for(const node of document.elementsFromPoint(e.clientX,e.clientY)){
  const target=node.closest?.('[data-id]');
  if(target&&svg.contains(target))ids.push(target.dataset.id);
 }
 for(const id of [...ids,...axisHits]){
  if(!id||seen.has(id))continue;
  seen.add(id);
  const o=get(doc,id);if(o&&accept(o))return id;
 }
 return null;
}
function r50ObjectTap(e,pt){
 const hit=constructionHit(e);
 const obj=get(doc,hit),resolver=createResolver(doc),pointHit=(()=>{
  const [sx,sy]=xyEvent(e),id=hitTestPoint(sx,sy),candidate=get(doc,id);
  if(geometricPoint(candidate,resolver))return candidate;
  if(geometricPoint(obj,resolver))return obj;
  // A stale screen-space anchor index or an SVG overlay must not make a
  // visibly drawn point unpickable. Re-resolve real visible point anchors at
  // the pointer and use the same screen tolerance as normal anchor picking.
  // Only scan on a miss; common clicks retain the indexed fast path.
  let best=null,bestDistance=Infinity;
  for(const point of doc.objects){
   if(point.hidden||point.style?.opacity===0||!geometricPoint(point,resolver))continue;
   const xy=r50PointPosition(point,resolver);if(!xy)continue;const screen=project(xy),d=Math.hypot(screen[0]-sx,screen[1]-sy);
   const radius=Math.max(9,Number(point.style?.pointSize??doc.settings.pointSize)+3);
   if(d<=radius&&d<bestDistance){best=point;bestDistance=d;}
  }
  return best;
 })();
 const mode=tool;
 if(mode==='pointOnObject'){
  if(!draftReference){if(!obj||r50SourceShape(obj,createResolver(doc),70).length<2){notice('Choose a valid existing geometric object.');return;}draftReference=obj.id;scheduleRender();return;}
  const source=get(doc,draftReference),resolver=createResolver(doc);if(!source){clearDraft();return;}
  const path=r50SourceShape(source,resolver,120),line=resolver.line(source);
  const snapped=projectToCurve(pt,path,geometricCircle(source,resolver)||source.type==='ellipse');
  if(!snapped){notice('Choose a point on the selected object.');return;}
  // Unbounded lines need a world-distance, not projection on a 15/30-unit
  // drawing sample. Persist this separately so legacy parameter stays valid.
  const distance=line&&line.domain!=='segment'?
   Math.max(line.domain==='ray'?0:-1e9,Math.min(1e9,(pt[0]-line.a[0])*line.d[0]+(pt[1]-line.a[1])*line.d[1])):null;
  if(update(()=>{selected=append(doc,{type:'pointOnObject',refs:[source.id],parameter:Math.max(0,Math.min(1,snapped.parameter)),...(distance!==null?{distance}:{})}).id;})){clearDraft();afterOneConstruction();}scheduleRender();return;
 }
 if(['tangentCircle','parabola','reflection','rotation','translation','dilation','circleInversion','locus','generalIntersection'].includes(mode)){
  if(!draftReference){
   const needsPoint=['tangentCircle','parabola','locus'].includes(mode);
   // Honor the actual SVG object under the pointer before a nearby point
   // detected by the broader snap radius. On a circle through P, a click on
   // the visible arc must not silently choose P as the transformation source.
   const source=needsPoint?pointHit:obj||pointHit;
   if(!source||needsPoint&&!geometricPoint(source,resolver)){
    notice(needsPoint?'Click the center of an existing point marker (not the curve or a preview).':'Choose an existing geometric object.');return;
   }
   draftReference=source.id;draftPoints=[];scheduleRender();return;
  }
  const first=get(doc,draftReference);if(!first){clearDraft();return;}
  if(mode==='translation'){
   if(!geometricPoint(pointHit,resolver)){notice('Choose an existing translation point.');return;}
   if(!draftPoints.length){draftPoints.push(pointHit.id);scheduleRender();return;}
   if(update(()=>{selected=append(doc,{type:'transformCopy',refs:[first.id,draftPoints[0],pointHit.id],transform:'translate',amount:0}).id;})){clearDraft();afterOneConstruction();}return;
  }
  const referencePredicate=['tangentCircle','circleInversion'].includes(mode)
   ?o=>geometricCircle(o,resolver)
   :['parabola','reflection'].includes(mode)?o=>geometricLine(o,resolver)
   :mode==='locus'?o=>o.type==='pointOnObject'
   :mode==='generalIntersection'?o=>o.id!==first.id&&r50SourceShape(o,resolver,80).length>=1
   :o=>geometricPoint(o,resolver);
  const ref=['rotation','dilation'].includes(mode)?pointHit||get(doc,constructionHit(e,referencePredicate))
   :get(doc,constructionHit(e,referencePredicate));
  if(!ref||ref.id===first.id){notice('Choose a different supporting object.');return;}
  if(mode==='tangentCircle'){
   if(!geometricCircle(ref,resolver)){notice('Choose a circle.');return;}
   const r=createResolver(doc);const feet=circleTangents(r.at(first.id),r.circle(ref));
   if(!feet.length){notice('The point must lie on or outside the circle.');return;}
   if(update(()=>{for(const branch of feet.length===1?[-1]:[-1,1])selected=append(doc,{type:'tangentCircle',refs:[first.id,ref.id],branch}).id;})){constructionEmphasis.clear();constructionEmphasis.add(first.id);constructionEmphasis.add(ref.id);clearDraft();afterOneConstruction();}return;
  }
  if(mode==='parabola'){
   if(!geometricLine(ref,resolver)){notice('Choose a valid directrix line.');return;}
   if(update(()=>{selected=append(doc,{type:'parabola',refs:[first.id,ref.id]}).id;})){clearDraft();afterOneConstruction();}return;
  }
  if(mode==='locus'){
   if(ref.type!=='pointOnObject'||!affected(doc,ref.id).has(first.id)){notice('Choose a constrained driver that controls the target point.');return;}
   if(update(()=>{selected=append(doc,{type:'locus',refs:[first.id,ref.id]}).id;})){clearDraft();afterOneConstruction();}return;
  }
  if(mode==='generalIntersection'){
   const r=createResolver(doc);let roots;
   try{roots=generalCrossings(first,ref,r,160);}catch(error){notice(error.message);return;}
   if(!roots.length){notice('No sampled crossing was found. Try another pair of curves.');return;}
   if(update(()=>{for(let i=0;i<roots.length;i++)selected=append(doc,{type:'generalIntersection',refs:[first.id,ref.id],rootIndex:i}).id;})){constructionEmphasis.clear();constructionEmphasis.add(first.id);constructionEmphasis.add(ref.id);clearDraft();afterOneConstruction();}return;
  }
  if(mode==='circleInversion'){
   if(!geometricCircle(ref,resolver)){notice('Choose an inversion circle.');return;}
   const proposed={type:'transformCopy',refs:[first.id,ref.id],transform:'invert',amount:0};
   if(!r50Shape(proposed,createResolver(doc),96).some(p=>p&&p.every(Number.isFinite))){notice('This inversion has no finite geometry (the circle center has no image).');return;}
   if(update(()=>{selected=append(doc,proposed).id;})){clearDraft();afterOneConstruction();}return;
  }
  const transform={reflection:'reflect',rotation:'rotate',dilation:'dilate'}[mode];
  if(transform==='reflect'&&!geometricLine(ref,resolver)){notice('Choose a mirror line.');return;}
  if(transform!=='reflect'&&!geometricPoint(ref,resolver)){notice('Choose a center point.');return;}
  const amount=transform==='rotate'?r50Number('Rotation angle in degrees',90,Math.PI/180):transform==='dilate'?r50Number('Dilation factor',2):0;
  if(amount===null||transform==='dilate'&&Math.abs(amount)<1e-9)return;
  if(update(()=>{selected=append(doc,{type:'transformCopy',refs:[first.id,ref.id],transform,amount}).id;})){clearDraft();afterOneConstruction();}return;
 }
}
function performConstructionTap(e,pt){
 if(['pointOnObject','tangentCircle','parabola','generalIntersection','reflection','rotation','translation','dilation','circleInversion','locus'].includes(tool)){r50ObjectTap(e,pt);return;}
 if(tool==='point'){const ok=update(()=>selected=addPoint(doc,pt).id);if(ok)afterOneConstruction();}
 else if(['parallelThrough','perpendicularThrough','perpendicularFoot','intersection','circleIntersection','circleCircleIntersection'].includes(tool)){
  const [sx,sy]=xyEvent(e);
  // A nearby anchor takes priority for the first point; straight objects
  // are selected from the SVG hit-path, not by their label or object order.
  const resolver=createResolver(doc);
  const hit=constructionHit(e,tool==='circleCircleIntersection'?o=>geometricCircle(o,resolver)
   :tool==='circleIntersection'?o=>geometricLine(o,resolver)||geometricCircle(o,resolver)
   :tool==='intersection'||draftReference?o=>geometricLine(o,resolver):()=>true);
  const clicked=get(doc,hit),line=clicked&&resolver.line(clicked);
  if(tool==='circleCircleIntersection'){
   const candidate=clicked&&geometricCircle(clicked,resolver)?clicked:null;
   if(!candidate){notice('Choose an existing circle.');return;}
   if(!draftReference){draftReference=candidate.id;scheduleRender();return;}
   const first=get(doc,draftReference);
   if(!first||first.id===candidate.id){notice('Choose a different circle.');return;}
   const ok=update(()=>{
    const resolver=createResolver(doc);
    const roots=intersectCircles(resolver.circle(first),resolver.circle(candidate));
    if(!roots.minus&&!roots.plus)throw Error('These circles do not intersect at a unique point or pair.');
    for(const branch of roots.tangent?[-1]:[-1,1])if((branch===-1?roots.minus:roots.plus))
     selected=append(doc,{type:'circleCircleIntersection',refs:[first.id,candidate.id],branch}).id;
   });
   if(ok){clearDraft();afterOneConstruction();}scheduleRender();return;
  }
  if(tool==='circleIntersection'){
   const candidate=clicked&&(geometricLine(clicked,resolver)||geometricCircle(clicked,resolver))?clicked:null;
   if(!candidate){notice('Choose a straight object or circle.');return;}
   if(!draftReference){draftReference=candidate.id;scheduleRender();return;}
   const first=get(doc,draftReference);
   if(!first||first.id===candidate.id){notice('Choose a different source object.');return;}
   const lineObject=geometricLine(first,resolver)?first:geometricLine(candidate,resolver)?candidate:null;
   const circleObject=geometricCircle(first,resolver)?first:geometricCircle(candidate,resolver)?candidate:null;
   const bothLines=geometricLine(first,resolver)&&geometricLine(candidate,resolver);
   const bothCircles=geometricCircle(first,resolver)&&geometricCircle(candidate,resolver);
   const ok=update(()=>{
    const r=createResolver(doc);
    if(bothLines){
     if(!intersectStraightLines(r.line(first),r.line(candidate)))throw Error('These straight objects do not cross on their selected domains.');
     selected=append(doc,{type:'intersection',refs:[first.id,candidate.id]}).id;
    }else if(bothCircles){
     const roots=intersectCircles(r.circle(first),r.circle(candidate));
     if(!roots.minus&&!roots.plus)throw Error('These circles do not have a unique crossing.');
     for(const branch of roots.tangent?[-1]:[-1,1])if(branch===-1?roots.minus:roots.plus)
      selected=append(doc,{type:'circleCircleIntersection',refs:[first.id,candidate.id],branch}).id;
    }else if(lineObject&&circleObject){
     const roots=intersectLineCircle(r.line(lineObject),r.circle(circleObject));
     if(!roots.minus&&!roots.plus)throw Error('These objects have no intersection in their selected domains.');
     const branches=roots.tangent?[roots.minus?-1:1]:[-1,1].filter(branch=>branch===-1?roots.minus:roots.plus);
     for(const branch of branches)selected=append(doc,{type:'circleIntersection',refs:[lineObject.id,circleObject.id],branch}).id;
    }else throw Error('Choose two straight objects or circles.');
   });
   if(ok){constructionEmphasis.clear();constructionEmphasis.add(first.id);constructionEmphasis.add(candidate.id);clearDraft();afterOneConstruction();}scheduleRender();return;
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
   draftReference=geometricPoint(anchor,createResolver(doc))?id:'new';
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
  if(draftPoints.length===3){const pts=clone(draftPoints);const ok=update(()=>{checkNewGeometry('ellipse',pts);const refs=makeFocalEllipseRefs(pts);checkNewRefs('ellipse',refs);selected=append(doc,{type:'ellipse',refs,ellipseFilled:false}).id;});if(ok){draftPoints=[];afterOneConstruction();}else draftPoints.pop();}
  scheduleRender();
 }else if(['segment','arrow','line','ray','perpBisector','midpoint','circle','circleDiameter','regularPolygon','fixedLength','fixedAngle'].includes(tool)){
  if(!draftStart){
   if(tool==='fixedLength'){
    const length=r50Number('Fixed length',3);
    if(length===null)return;
    if(length<=1e-8||length>1e6){notice('Length must be positive and at most 1000000.');return;}
    draftMeasure=length;
   }
   draftStart=pt;scheduleRender();
  }else{const a=draftStart;draftStart=null;if(['fixedLength','fixedAngle'].includes(tool)){
   const value=tool==='fixedLength'?draftMeasure:r50Number('Angle in degrees',60,Math.PI/180);
   draftMeasure=null;
   if(value===null||value===undefined)return;
   if(Math.hypot(a[0]-pt[0],a[1]-pt[1])<1e-8){notice('Choose a different point to define the direction.');return;}
   if(update(()=>{
    if(tool==='fixedLength'){
     const start=makeRefs([a])[0];
     // Private guide: dragging the displayed endpoint turns the segment
     // without unexpectedly moving an existing shared construction point.
     const guide=append(doc,{type:'point',xy:pt,hidden:true,locked:true}).id;
     const line=append(doc,{type:'fixedLength',refs:[start,guide],length:value});
     selected=append(doc,{type:'pointOnObject',refs:[line.id],parameter:1}).id;
    }else{
     const refs=makeRefs([a,pt]),angle=append(doc,{type:'fixedAngle',refs,angle:value});
     const radius=Math.hypot(a[0]-pt[0],a[1]-pt[1]);
     selected=append(doc,{type:'pointOnObject',refs:[angle.id],parameter:Math.min(1,Math.max(.02,radius/30)),constraintMode:'angleRay',distance:radius}).id;
    }
   }))afterOneConstruction();
  }else if(tool==='circleDiameter')update(()=>{
    checkNewGeometry('circle',[a,pt]);const refs=makeRefs([a,pt]);checkNewRefs('circle',refs);
    const center=append(doc,{type:'midpoint',refs}).id;
    selected=append(doc,{type:'circle',refs:[center,refs[0]]}).id;
   })&&afterOneConstruction();else if(tool==='regularPolygon'){const sidesText=window.prompt('Number of polygon sides (3–100):',String(doc.settings.polygonSides||6));if(sidesText===null)return;const sides=Number(sidesText);if(!Number.isInteger(sides)||sides<3||sides>100){notice('Regular polygon sides must be 3–100.');return;}update(()=>{if(Math.hypot(a[0]-pt[0],a[1]-pt[1])<1e-9)throw Error('Choose a different vertex from the center.');const refs=makeRefs([a,pt]);checkNewRefs('regularPolygon',refs);selected=append(doc,{type:'regularPolygon',refs,sides}).id;appendDerivedShapeEdges(doc,selected);})&&afterOneConstruction();}else if(addTwoPoint(tool,a,pt))afterOneConstruction();}
 }else if(['rectangle','parallelogram','polygon','polyline','bezier','angle','angleBisector','triangleCenter','circularArc','hyperbola','triangle','quadrilateral','circleThrough3','spline','closedSpline'].includes(tool)){
  if(['polygon','closedSpline'].includes(tool)&&draftPoints.length>=3&&Math.hypot(...[pt[0]-draftPoints[0][0],pt[1]-draftPoints[0][1]])*view.scale<=12){finishDraft();return;}
  if(draftPoints.length===0||Math.hypot(pt[0]-draftPoints.at(-1)[0],pt[1]-draftPoints.at(-1)[1])>1e-8)draftPoints.push(pt);
  if((['rectangle','parallelogram'].includes(tool)&&draftPoints.length===3)||(tool==='bezier'&&draftPoints.length===4)||(['angle','angleBisector','circularArc','hyperbola','triangleCenter'].includes(tool)&&draftPoints.length===3)||(tool==='circleThrough3'&&draftPoints.length===3)||(tool==='triangle'&&draftPoints.length===3)||(tool==='quadrilateral'&&draftPoints.length===4))finishDraft();else scheduleRender();
 }else if(tool==='freehand'){drag={kind:'freehand',pointerId:e.pointerId,path:[world],startAttachment:freehandAttachment(world)};}
 else if(tool==='text'||tool==='node'){
  const label=window.prompt(tool==='node'?'Diagram label (LaTeX):':'Text (LaTeX):');
  if(label!==null&&label.trim()){const limit=tool==='node'?1000:2000;if(label.length>limit)notice(`Label exceeds ${limit} characters. Nothing was added.`);else if(update(()=>{
   let text=label;const textMode='latex';
   if(tool==='text'){
    const wrapped=label.trim().match(/^\$([^$]+)\$$/s)||label.trim().match(/^\\\(([\s\S]+)\\\)$/);
    if(wrapped)text=wrapped[1];
   }
   if(textMode==='latex')validateLatexInput(text);
   selected=append(doc,{type:tool,xy:pt,text,textMode,fontSize:tool==='node'?17:18}).id;
  }))afterOneConstruction();}
 }else if(tool==='morphism'){
  const id=e.target.closest('[data-id]')?.dataset.id,node=get(doc,id);
  if(node?.type!=='node'){notice('Choose a diagram node.');return;}
  if(!draftNode){draftNode=id;draftStart=node.xy;scheduleRender();}
  else{const start=draftNode;draftNode=null;draftStart=null;if(start!==id){const label=window.prompt('Morphism label (LaTeX):','');if(label!==null){if(label.length>1000)notice('Morphism label exceeds 1000 characters. Nothing was added.');else update(()=>{if(label.trim())validateLatexInput(label);selected=append(doc,{type:'morphism',refs:[start,id],text:label,textMode:'latex',bend:0,swap:false,routing:'direct',labelDistance:10,style:{stroke:doc.settings.stroke,fill:doc.settings.fill,width:1,opacity:doc.settings.opacity}}).id;})&&afterOneConstruction();}}}
 }
}
function r50MoveConstrained(o,world){
 if(!o||o.type!=='pointOnObject')return;
 const source=get(doc,o.refs?.[0]);if(!source)return;
 if(source.type==='fixedLength'&&o.parameter===1){
  const guide=get(doc,source.refs?.[1]),anchor=position(doc,source.refs?.[0]);
  if(guide?.type==='point'&&guide.hidden&&anchor&&Math.hypot(world[0]-anchor[0],world[1]-anchor[1])>1e-6){guide.xy=[...world];return;}
 }
 if(source.type==='fixedAngle'&&o.constraintMode==='angleRay'){
  const r=createResolver(doc),[guide,vertex]=r.points(source);
  if(!guide||!vertex)return;
  const d=[guide[0]-vertex[0],guide[1]-vertex[1]],length=Math.hypot(...d);
  if(length<1e-9)return;
  const a=Math.atan2(d[1],d[0])+source.angle;
  const dist=(world[0]-vertex[0])*Math.cos(a)+(world[1]-vertex[1])*Math.sin(a);
  if(Number.isFinite(dist)&&Math.abs(dist)<1e9)o.distance=Math.max(0,dist);return;
 }
 const resolver=createResolver(doc),line=resolver.line(source);
 if(line&&line.domain!=='segment'){
  const distance=(world[0]-line.a[0])*line.d[0]+(world[1]-line.a[1])*line.d[1];
  if(Number.isFinite(distance)&&Math.abs(distance)<1e9)o.distance=line.domain==='ray'?Math.max(0,distance):distance;
  return;
 }
 const projected=projectToCurve(world,r50SourceShape(source,resolver,120),['circle','circleThrough3','ellipse'].includes(source.type));
 if(projected)o.parameter=projected.parameter;
}
function pointerMove(e){
 if(in3D()){if(cameraDrag?.pointerId===e.pointerId){const [x,y]=xyEvent(e);const o=doc.scene3d.options;o.yaw=Math.max(-180,Math.min(180,cameraDrag.yaw-(x-cameraDrag.x)*.32));o.pitch=Math.max(-89,Math.min(89,cameraDrag.pitch+(y-cameraDrag.y)*.28));scheduleRender();}return;}

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
 hover=(drag||tool==='select'||tool==='pan')?world:tool==='point'?constructionPoint(world):constructionVertex(world);$('coords').textContent=`x ${(Math.abs(world[0])<.005?0:world[0]).toFixed(2)} · y ${(Math.abs(world[1])<.005?0:world[1]).toFixed(2)}`;
 if(lastMoveCanvasTap&&drag&&Math.hypot(sx-drag.sx,sy-drag.sy)>9)lastMoveCanvasTap=null;
 if(drag?.kind==='pan-object-pending'&&Math.hypot(sx-drag.sx,sy-drag.sy)>4){
  const pending=drag,obj=get(doc,pending.id);
  drag=null;selectTool('select');select(pending.id);
  if(obj&&['point','node','text','pointOnObject'].includes(obj.type))drag={kind:'point',pointerId:e.pointerId,id:pending.id,before:JSON.stringify(doc),sx:pending.sx,sy:pending.sy,moved:true,excluded:affected(doc,pending.id)};
  else drag={kind:'selected-object',pointerId:e.pointerId,id:pending.id};
 }
 if(drag?.kind==='marquee'){drag.ex=sx;drag.ey=sy;}
 if(drag?.kind==='pan'){view.cx=drag.cx-(sx-drag.sx)/view.scale;view.cy=drag.cy+(sy-drag.sy)/view.scale;}
 else if(drag?.kind==='point'){
  if(Math.hypot(sx-drag.sx,sy-drag.sy)>3)drag.moved=true;
  if(drag.moved){const o=get(doc,drag.id);if(o){if(o.type==='pointOnObject')r50MoveConstrained(o,world);else o.xy=o.type==='point'?constructionPoint(world,drag.id):snapPoint(world,effectiveSnapSettings());}}
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
 if(in3D()){if(cameraDrag?.pointerId===e.pointerId){const before=cameraDrag;cameraDrag=null;orbitRenderQueued=false;try{if($('drawing').hasPointerCapture(e.pointerId))$('drawing').releasePointerCapture(e.pointerId);}catch{}const o=doc.scene3d.options,nextYaw=o.yaw,nextPitch=o.pitch;o.yaw=before.yaw;o.pitch=before.pitch;if(e.type==='pointerup')update(()=>{o.yaw=nextYaw;o.pitch=nextPitch;});else scheduleRender();}return;}

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
 if(lastMoveCanvasTap&&['point','label','pan','marquee'].includes(completed.kind)&&Math.hypot(xyEvent(e)[0]-completed.sx,xyEvent(e)[1]-completed.sy)>9)lastMoveCanvasTap=null;
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
  if(completed.doubleNavigate&&!completed.moved&&Math.hypot(endX-completed.sx,endY-completed.sy)<=3)navigateToObject(completed.id);
  const moved=get(doc,completed.id);
  if(moved&&released.every(finite)&&(completed.moved||Math.hypot(endX-completed.sx,endY-completed.sy)>3)){if(moved.type==='pointOnObject')r50MoveConstrained(moved,released);else moved.xy=moved.type==='point'?constructionPoint(released,completed.id):snapPoint(released,effectiveSnapSettings());}
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
  const mode=freehandShapeMode,prepared=mode==='free'?preparedFreehand(completed.path,completed.startAttachment).prepared:shapeFromStroke(completed.path,mode,freehandRegular);
  if(prepared){const {path,closed,joinStyle}=prepared;
   if(path.length>=2){const start=path[0];const meaningful=closed||path.some(p=>Math.hypot(p[0]-start[0],p[1]-start[1])*view.scale>2);
    if(meaningful&&update(()=>selected=append(doc,{type:'freehand',path,closed,curveShape:mode,curveRegular:freehandRegular,curveLine:mode==='free'||SHAPE_LINE_CHOICES.some(([v])=>v===freehandLine)?freehandLine:'solid',curveHeads:mode==='free'?freehandHeads:'none',...(mode!=='free'?{rawPath:completed.path}:{}),...(joinStyle?{joinStyle}:{})}).id)){afterOneConstruction();if(tool==='freehand')select(null);}}}
 }
 scheduleRender();
}
function onWheel(e){if(in3D()){e.preventDefault();const zoom=doc.scene3d.options.zoom,delta=Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*.0013);update(()=>{doc.scene3d.options.zoom=Math.max(.25,Math.min(5,zoom*delta));},{refreshList:false});return;}
if(!$('tikzcd-dialog').hidden||!$('export-menu').hidden)return;e.preventDefault();if(drag)cancelDrag();const [x,y]=xyEvent(e),before=unproject(x,y),wheelPixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?Math.max(1,size.h):1),factor=Math.exp(-Math.max(-200,Math.min(200,wheelPixels))*.0013);view.scale=Math.max(1e-12,Math.min(1000,view.scale*factor));const after=unproject(x,y);view.cx+=before[0]-after[0];view.cy+=before[1]-after[1];scheduleRender();}
function fit(){if(in3D()){update(()=>{doc.scene3d.options.zoom=1;});return;}

 if(drag)cancelDrag();
 const result=fitSceneView(doc,createResolver(doc),size);
 view={cx:result.cx,cy:result.cy,scale:result.scale};
 if(result.clipped)notice('Some fixed-size labels cannot fit this viewport. Enlarge the canvas or reduce font size.');
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
  const plots3d=Array.isArray(entry.plots3d)?entry.plots3d:[];
  const names=[...entry.objects,...plots3d].map(o=>typeof o.name==='string'&&o.name.trim()?o.name.trim():o.id).filter(Boolean);
  title.textContent=`${plots3d.length?'3D · ':''}${names.join(', ')||entry.objects.length+' object(s)'} · ${new Date(entry.at).toLocaleString()}`;
  title.title=names.join(', ');
  const button=document.createElement('button');button.textContent='Restore';
  button.onclick=()=>{
   if(storageConflict){notice('Resolve the other-tab conflict before restoring.');return;}
   const source=trash[index];if(!source)return;
   const restored3d=Array.isArray(source.plots3d)?source.plots3d:[];
   if(source.objects.some(o=>get(doc,o.id)||doc.objects.some(existing=>existing.name===o.name))
      ||restored3d.some(o=>doc.scene3d?.plots.some(p=>p.id===o.id||p.name===o.name))){
    notice('Restore blocked: an object ID or name is already used.');return;
   }
   // Both 2D and 3D deletion snapshots must restore transactionally; a
   // rejected schema or full 3D plot list leaves Recently Deleted untouched.
   const ok=update(()=>{
    if(source.objects.length){
     doc.objects.push(...clone(source.objects));
     const maximum=Math.max(...source.objects.map(o=>Number(o.id.slice(1))));
     if(!Number.isSafeInteger(maximum))throw Error('Invalid restored identifier.');
     doc.nextId=Math.max(doc.nextId,maximum+1);
    }
    if(restored3d.length){
     if(!doc.scene3d)doc.scene3d=newScene3D();
     doc.scene3d.plots.push(...clone(restored3d));
     doc.scene3d.nextId=Math.max(doc.scene3d.nextId,...restored3d.map(p=>p.id+1));
     enforce3DVisibility(doc.scene3d,restored3d.at(-1).id);
    }
   });
   if(ok){trash.splice(index,1);persistTrash();}
  };
  row.append(title,button);root.append(row);
 }
}
// Local wall-clock timestamp, created only when an actual download starts.
// Consistent across Save and every supported Export format.
function datedExportName(extension,kind=''){
 const now=new Date(),pad=n=>String(n).padStart(2,'0');
 const suffix=`${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
 return `mathillustrator${kind?'-'+kind:''}_${suffix}.${extension}`;
}
function datedProjectName(){return datedExportName('json');}
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
 if(type==='svg'){download(new Blob([result.text],{type:'image/svg+xml;charset=utf-8'}),datedExportName('svg'));return;}
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
  download(blob,datedExportName(type==='jpeg'?'jpg':type));
 }finally{URL.revokeObjectURL(src);}
}
function latexEscape(s){const map={'\\':'\\textbackslash{}','#':'\\#','$':'\\$','%':'\\%','&':'\\&','_':'\\_','{':'\\{','}':'\\}'};map['^']='\\textasciicircum{}';map['~']='\\textasciitilde{}';return [...String(s)].map(c=>map[c]||c).join('');}
const texPoint=tikzPoint;
function canTikz(){
 // Screen-space collision-avoidance offsets cannot be represented by the
 // restricted world-space TikZ point-label exporter. Never silently revert.
 if(doc.objects.some(o=>!o.hidden&&o.style?.opacity!==0&&['parallelThrough','perpendicularThrough','perpendicularFoot','intersection','circleIntersection','circleCircleIntersection'].includes(o.type)))return false;
 if(doc.settings.showLabels&&doc.settings.labelPlacement==='avoid'&&doc.objects.some(o=>!o.hidden&&o.style?.opacity!==0&&['point','midpoint'].includes(o.type)))return false;
 if(tikzGeometryIssue(doc))return false;
 // Plain-text TikZ targets pdfLaTeX: reject unsupported Unicode/control labels
 // rather than enabling an export which cannot be compiled reliably.
 // TeX collapses leading/trailing and repeated spaces even when SVG preserves them.
 const safeText=s=>typeof s==='string'&&/^[\x20-\x7e]*$/.test(s)&&!/(^ | $| {2,})/.test(s);
 return doc.objects.every(o=>o.hidden||o.style?.opacity===0||(
  (!o.displayLabel||!doc.settings.showLabels)&&(!['point','midpoint','intersection','circleIntersection','circleCircleIntersection','perpendicularFoot','pointOnObject','generalIntersection','triangleCenter'].includes(o.type)||!doc.settings.showLabels||(!(o.pointLabel&&o.pointLabelMode==='latex')&&safeText(o.pointLabel||o.name)))&&
  (!['text','node','morphism'].includes(o.type)||(o.textMode!=='latex'&&safeText(o.text)))&&
  (o.type!=='node'||layoutNodeLabel(o.text,o.fontSize||17).lines.length===1)&&(o.type!=='morphism'||(o.arrowStyle===undefined||o.arrowStyle==='solid')&&(o.routing??'direct')==='direct'&&(o.labelT??.5)===.5&&(o.labelDistance??17)===17&&(o.labelDx??0)===0&&(o.labelDy??0)===0&&(!o.labelAvoid||!o.text))&&['point','midpoint','segment','arrow','line','circle','ellipse','rectangle','parallelogram','polygon','polyline','bezier','angle','regularPolygon','freehand','text','node','morphism'].includes(o.type)&&(o.type!=='freehand'||false)&&(o.type!=='morphism'||o.hidden||o.refs.every(id=>get(doc,id)?.type==='node'&&!get(doc,id)?.hidden&&get(doc,id)?.style?.opacity!==0))));}
function asTikz(){
 if(!canTikz())throw Error('TikZ export is unavailable for a visible unsupported object or label. Use SVG or JSON instead.');
 const lines=['\\begin{tikzpicture}[x=1cm,y=1cm,line cap=round,line join=round]'],resolver=createResolver(doc);
 const rgb=color=>`{rgb,255:red,${parseInt(color.slice(1,3),16)};green,${parseInt(color.slice(3,5),16)};blue,${parseInt(color.slice(5,7),16)}}`;
 for(const o of doc.objects){if(o.hidden||o.style?.opacity===0)continue;
  const style=`draw=${rgb(o.style.stroke)},line width=${(o.style.width*.75).toFixed(4)}pt,opacity=${o.style.opacity}`;
  const p=resolver.points(o);if(['point','midpoint','intersection','circleIntersection','circleCircleIntersection','perpendicularFoot','pointOnObject','generalIntersection','triangleCenter'].includes(o.type)){
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
   lines.push(`\\draw[${style},${o.ellipseFilled===false?'fill=none':`fill=${rgb(o.style.fill)},fill opacity=${(.2*o.style.opacity).toFixed(3)}`}] (0,0) ellipse (${f.rx.toFixed(5)}cm and ${f.ry.toFixed(5)}cm);`);
   lines.push('\\end{scope}');
  }else if(o.type==='ellipse'&&p.length===2&&p.every(Boolean)){
   const cx=(p[0][0]+p[1][0])/2,cy=(p[0][1]+p[1][1])/2,rx=Math.abs(p[1][0]-p[0][0])/2,ry=Math.abs(p[1][1]-p[0][1])/2;
   if(rx<1e-9||ry<1e-9)lines.push(`\\draw[${style}] ${texPoint(p[0])} -- ${texPoint(p[1])};`);
   else lines.push(`\\draw[${style},${o.ellipseFilled===false?'fill=none':`fill=${rgb(o.style.fill)},fill opacity=${(.2*o.style.opacity).toFixed(3)}`}] ${texPoint([cx,cy])} ellipse (${rx.toFixed(5)}cm and ${ry.toFixed(5)}cm);`);
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
   const pattern={dashed:',dashed',dotted:',dotted'}[o.curveLine]||'';
   const arrows=o.curveShape&&o.curveShape!=='free'?'':{end:',->',both:',<->'}[o.curveHeads||o.curveArrows]||'';
   lines.push(`\\draw[${style}${pattern}${arrows}] ${chosen.map(texPoint).join(' -- ')}${o.closed?' -- cycle':''};`);
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
 const ready=!plotLimitedInScene&&!sceneRenderPending;
 const opts=[['SVG','svg',ready],['PNG','png',ready&&rasterSupported('png')],['JPEG','jpeg',ready&&!doc.settings.exportTransparent&&rasterSupported('jpeg')],['WebP','webp',ready&&rasterSupported('webp')],['TikZ / PGF','tikz',!in3D()&&canTikz()],['tikz-cd (semantic)','tikzcd',!in3D()&&canExportTikzCd(doc)],['JSON project','json',true],['PDF','pdf',false],['Asymptote','asy',false],['GIF / video','animation',false]];
 const root=$('export-options');root.replaceChildren();for(const [name,type,supported]of opts){
  const b=document.createElement('button');b.textContent=name;b.disabled=!supported||exportBusy;b.title=supported?'Export current illustration':sceneRenderPending&&['svg','png','jpeg','webp'].includes(type)?'Wait for 3D rendering to finish':type==='jpeg'&&doc.settings.exportTransparent?'JPEG cannot preserve transparency; choose PNG, WebP or SVG.':'Not implemented or not representable in current scene';
  b.onclick=async()=>{if(exportBusy)return;exportBusy=true;for(const other of root.querySelectorAll('button'))other.disabled=true;try{
    if(['svg','png','jpeg','webp'].includes(type))await exportImage(type);
    else if(type==='json')download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),datedProjectName());
    else if(type==='tikz')download(new Blob([asTikz()],{type:'text/plain'}),datedExportName('tex'));
    else if(type==='tikzcd')download(new Blob([exportTikzCd(doc)],{type:'text/plain'}),datedExportName('tex','tikzcd'));
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
 // Retire preferences whose controls no longer exist; do not persist stale toggles.
 for(const key of ['showCoordinates','reduceMotion','essentialGeometry'])delete uiPrefs[key];
 const fontMap={system:'system-ui, sans-serif',serif:'Georgia, serif',sans:'Arial, sans-serif',mono:'Consolas, monospace',verdana:'Verdana, sans-serif',trebuchet:'Trebuchet MS, sans-serif',palatino:'Palatino Linotype, serif',times:'Times New Roman, serif'};
 $('ui-font').value=fontMap[uiPrefs.font]?uiPrefs.font:'system';document.documentElement.style.setProperty('--ui-font',fontMap[$('ui-font').value]);
 $('ui-font').onchange=()=>{uiPrefs.font=$('ui-font').value;document.documentElement.style.setProperty('--ui-font',fontMap[uiPrefs.font]);savePrefs();};
 $('auto-pan').checked=uiPrefs.autoPan!==false;$('auto-pan').onchange=()=>{uiPrefs.autoPan=$('auto-pan').checked;savePrefs();};
 for(const [id,key] of [['auto-diagram-labels','autoDiagramLabels'],['tooltips','showTooltips'],['fast-3d-orbit','fast3DOrbit']]){
  const input=$(id);input.checked=uiPrefs[key]!==false;input.onchange=()=>{uiPrefs[key]=input.checked;savePrefs();if(key==='autoDiagramLabels'||key==='fast3DOrbit')scheduleRender();else syncTooltips();};
 }
 syncTooltips();
 function applyLanguage(){closeObjectMenu();document.documentElement.lang=uiPrefs.language==='zh'?'zh':'en';localizeUI(document.documentElement,uiPrefs.language);updateModeLabel(tool);}
 $('ui-language').value=uiPrefs.language==='zh'?'zh':'en';
 const languageSwitch=$('ui-language');
 languageSwitch.title='Click once to switch English / 中文';
 languageSwitch.addEventListener('pointerdown',event=>{if(event.button===0){event.preventDefault();}});
 languageSwitch.addEventListener('click',event=>{if(event.detail!==0){languageSwitch.value=languageSwitch.value==='zh'?'en':'zh';languageSwitch.dispatchEvent(new Event('change',{bubbles:true}));}});
 languageSwitch.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();languageSwitch.value=languageSwitch.value==='zh'?'en':'zh';languageSwitch.dispatchEvent(new Event('change',{bubbles:true}));}});
 $('ui-language').onchange=()=>{uiPrefs.language=$('ui-language').value;savePrefs();applyLanguage();renderList();};applyLanguage();
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
  // Both 2D and 3D object lists are flexible content, never fixed chrome.
  // Counting the visible 3D list here makes the upper bound follow the drag,
  // collapsing Properties to 38 px whenever the user drags its divider up.
  const fixed=[...left.children].filter(e=>e!==pane&&!['objects','objects-3d'].includes(e.id)&&!e.classList.contains('panel-resizer')&&getComputedStyle(e).display!=='none').reduce((a,e)=>a+e.getBoundingClientRect().height,0);
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
 populateTools();setupSettings();setupInterface();
 for(const input of document.querySelectorAll('label.field input[type="number"]')){
  const label=input.closest('label.field');if(!label||label.title)continue;
  const hint=rangeHint({min:input.hasAttribute('min')?input.min:undefined,max:input.hasAttribute('max')?input.max:undefined});
  if(hint){label.title=hint;input.title=hint;}
 }
$('objects').addEventListener('scroll',()=>{closeObjectMenu();renderListWindow();},{passive:true});
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
 if(old){try{doc=upgradeRecoveredLegacyPalette(validateDoc(JSON.parse(old)));if(doc.scene3d)enforce3DVisibility(doc.scene3d);}catch(e){setStorageConflict(true,'corrupt');notice('Recovered empty editor. Corrupt saved data is preserved until you explicitly choose Keep this tab.');}}
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
  if(in3D())return; // 3D camera interactions must never clear 2D selection.
  if(['polyline','spline'].includes(tool)){e.preventDefault();finishDraft();}
  else if(tool==='select'){e.preventDefault();if(!e.target.closest?.('[data-id]'))select(null);/* Object navigation uses the second verified pointer hit. */}
  else if(tool==='pan'){e.preventDefault();select(null);}
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
  else if(e.key==='Enter'&&['polyline','spline'].includes(tool)){finishDraft();}
  else{const next=canvasShortcut(e,document.activeElement,$('drawing'));if(next){e.preventDefault();selectTool(next);}}
 });
 $('undo').onclick=undo;$('redo').onclick=redo;
 $('retry-autosave').onclick=()=>{if(storageConflict){saveStatus('Autosave paused · resolve conflict first');return;}
  if(!dirty){saveStatus('No unsaved local changes');return;}clearTimeout(saveTimer);persistNow();};
 $('object-search').oninput=()=>renderList({resetScroll:true});
 const plotInput=$('command'),plotY=$('command-y'),plotMode=$('plot-mode'),symbol=$('parameter-symbol');
 function syncPlotMode(){syncPlotModeControl();}
 plotMode.addEventListener('change',()=>{plotInput.value='';plotY.value='';syncPlotMode();plotInput.focus();});
 syncPlotMode();
 $('command-form').onsubmit=e=>{e.preventDefault();const mode=plotMode.value,value=plotInput.value.trim(),y=plotY.value.trim();
  let raisedDomainBudget=false;
  const success=update(()=>{
   let curve;
   if(in3D()){const c=$('command-z').value.trim();if(!doc.scene3d)doc.scene3d=newScene3D();const plot=add3DPlot(doc.scene3d,mode,[value,y,c]);selected3d=plot.id;}
   else if(mode==='parametric'){parseParametric(value,y,'t');curve=append(doc,{type:'parametric',xExpr:value,yExpr:y,parameter:'t',tMin:0,tMax:2*Math.PI});}
   else if(mode==='implicit'){parseImplicit(value);curve=append(doc,{type:'implicit',expr:value});}
   else if(mode==='vectorField'||mode==='domainColoring'){
    if(mode==='vectorField')parseVectorField(value,y);else parseComplexExpression(value);
    // The first region is a snapshot of the visible canvas, not a moving viewport.
    const a=unproject(0,size.h),b=unproject(size.w,0);
    const region={xMin:a[0],xMax:b[0],yMin:a[1],yMax:b[1]};validatePlotRegion(region);
    if(mode==='domainColoring'&&doc.settings.plotBudget<1000000){doc.settings.plotBudget=1000000;raisedDomainBudget=true;}
    const aspect=(region.yMax-region.yMin)/(region.xMax-region.xMin);
    const resolution=mode==='domainColoring'?Math.min(768,Math.max(32,Math.floor(Math.sqrt(900000/aspect)/16)*16)):0;
    curve=mode==='vectorField'?append(doc,{type:mode,xExpr:value,yExpr:y,region,density:12,normalized:false}):append(doc,{type:mode,expr:value,region,resolution,colorMode:'phase-modulus'});
   }else{
    const construction=/^(?:[A-Za-z][A-Za-z0-9_]*\s*=\s*\(|[A-Za-z][A-Za-z0-9_]*\s*\(x\)\s*=|(?:Segment|Arrow|Line|Circle|Ellipse|Rectangle|Parallelogram|Polygon|Polyline|Bezier|Angle|AngleBisector|Midpoint|Parallel|Perpendicular|Intersect|RegularPolygon|Morphism)\s*\()/i;
    if(construction.test(value))curve=command(doc,value);
    else {const expr=value.replace(/^y\s*=\s*/i,'');parseExpression(expr);curve=append(doc,{type:'function',expr});}
   }
   if(!in3D())selected=curve.id;
  });
  if(success){plotInput.value='';plotY.value='';$('command-z').value='';if(!in3D())selectTool('select');if(raisedDomainBudget)notice('High-resolution domain coloring raised Plot budget to 1,000,000 evaluations. Adjust it in Plotting settings.');}
 };
 $('new').onclick=()=>{if(!window.confirm('Start a new illustration? Download the current project first if needed.'))return;update(()=>{doc=newDoc();selected=null;view={cx:0,cy:0,scale:48};});};
 $('open').onclick=()=>$('open-file').click();$('open-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>12e6)throw Error('Project JSON exceeds 12 MB safety limit.');const readingRevision=documentRevision,readingGeneration=documentGeneration;const imported=validateDoc(JSON.parse(await file.text()));if(imported.scene3d)enforce3DVisibility(imported.scene3d);if(readingRevision!==documentRevision||readingGeneration!==documentGeneration)throw Error('The current project changed while reading this file. Import canceled to protect newer edits.');if(!window.confirm('Replace the current illustration with this JSON project?'))return;update(()=>{doc=imported;selected=null;});notice('Project opened.');}catch(err){notice('Open failed: '+err.message);}finally{e.target.value='';}};
 $('save').onclick=()=>download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),datedProjectName());
 $('export-open').onclick=()=>{if(drag)cancelDrag();setupExport();$('export-menu').hidden=!$('export-menu').hidden;$('export-backdrop').hidden=$('export-menu').hidden;if($('export-menu').hidden)exportAbortToken++;else $('export-close').focus();};$('export-close').onclick=()=>{exportAbortToken++;$('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();};
 $('export-backdrop').onclick=()=>{exportAbortToken++;$('export-menu').hidden=true;$('export-backdrop').hidden=true;$('export-open').focus();};
 $('help').onclick=()=>window.open('tutorial.html','_blank','noopener');$('show-hidden').onchange=()=>renderList({resetScroll:true});
 $('tikzcd-open').onclick=()=>{if(drag)cancelDrag();$('tikzcd-dialog').hidden=false;$('tikzcd-input').focus();};
 $('tikzcd-close').onclick=()=>{$('tikzcd-dialog').hidden=true;$('tikzcd-open').focus();};
 $('tikzcd-apply').onclick=()=>{try{const d=validateDoc(importTikzCd($('tikzcd-input').value));if(!window.confirm('Replace the current illustration with the imported diagram?'))return;const ok=update(()=>{doc=d;selected=null;});if(ok){$('tikzcd-dialog').hidden=true;$('tikzcd-open').focus();notice('Imported a semantic tikz-cd diagram.');}}catch(e){notice('Import failed: '+e.message);}};
 $('conflict-load').onclick=()=>{if(!window.confirm('Replace this tab with the newer local project? Download your current version first if needed.'))return;try{const latest=localStorage.getItem(STORAGE);if(!latest)throw Error('No saved project found.');if(drag)cancelDrag();doc=validateDoc(JSON.parse(latest));if(doc.scene3d)enforce3DVisibility(doc.scene3d);documentRevision++;documentGeneration++;clearDraft();clearTimeout(saveTimer);dirty=false;lastStored=latest;setStorageConflict(false);saveStatus('Loaded newer local project');history=[];future=[];selected=null;selectedIds.clear();syncHistory();renderAll();}catch(e){notice('Cannot load other tab: '+e.message);}};
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
 $('zoom-out').onclick=()=>{if(in3D())update(()=>{doc.scene3d.options.zoom=Math.max(.25,doc.scene3d.options.zoom/1.3);});else{if(drag)cancelDrag();view.scale=Math.max(1e-12,view.scale/1.3);render();}};$('zoom-in').onclick=()=>{if(in3D())update(()=>{doc.scene3d.options.zoom=Math.min(5,doc.scene3d.options.zoom*1.3);});else{if(drag)cancelDrag();view.scale=Math.min(1000,view.scale*1.3);render();}};$('zoom-reset').onclick=()=>{if(in3D())update(()=>{doc.scene3d.options.zoom=1;doc.scene3d.options.yaw=-38;doc.scene3d.options.pitch=26;});else{if(drag)cancelDrag();view={cx:0,cy:0,scale:48};render();}};$('fit').onclick=fit;
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
 // Mobile drawers cover the opposite toggle at narrow widths. A tap outside
 // dismisses the drawer without falling through into a point/drag operation.
 // Capture before canvas handlers, but never consume interactions inside a drawer.
 document.addEventListener('pointerdown',event=>{
  if(!mobile.matches)return;
  const left=document.body.classList.contains('mobile-left-open');
  const right=document.body.classList.contains('mobile-right-open');
  if(!left&&!right)return;
  const drawer=left?document.querySelector('.leftpanel'):document.querySelector('.rightpanel');
  if(drawer?.contains(event.target))return;
  document.body.classList.remove('mobile-left-open','mobile-right-open');
  syncPanelButtons();event.preventDefault();event.stopImmediatePropagation();
 },true);
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!mobile.matches||!document.body.classList.contains('mobile-left-open')&&!document.body.classList.contains('mobile-right-open'))return;
  document.body.classList.remove('mobile-left-open','mobile-right-open');syncPanelButtons();
  event.preventDefault();event.stopImmediatePropagation();
 },true);
 mobile.addEventListener('change',()=>{document.body.classList.remove('mobile-left-open','mobile-right-open');syncPanelButtons();});syncPanelButtons();

 const resize=new ResizeObserver(()=>{const b=svg.getBoundingClientRect();size={w:Math.max(1,Math.round(b.width)),h:Math.max(1,Math.round(b.height))};scheduleRender();});resize.observe(svg);
 // Toolbar height varies with font metrics, window width and localized labels.
 // Avoid hard-coded mobile drawer offsets that overlap the toolbar after wrapping.
 const bar=document.querySelector('.appbar'),barResize=new ResizeObserver(()=>{document.documentElement.style.setProperty('--appbar-height',`${bar.getBoundingClientRect().height}px`);dockPanels.apply();});barResize.observe(bar);
 document.documentElement.style.setProperty('--appbar-height',`${bar.getBoundingClientRect().height}px`);renderAll();
}
initialise();
