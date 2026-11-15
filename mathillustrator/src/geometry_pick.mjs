/** Pure, deterministic semantic ordering for overlapping 2D SVG geometry.
 * Geometry dimension/precision wins over SVG z-order; tools supply eligibility.
 * Point hits are already distance-sorted by the anchor spatial index.
 */
export function geometryPickRank(object,pointLike=false){
 if(pointLike)return 0;
 if(!object)return 99;
 const type=object.type;
 if(['point','pointOnObject','midpoint','intersectionPoint','node','text'].includes(type))return 0;
 if(['segment','polyline','spline','closedSpline','freehand','circularArc','arc','vector','arrow','morphism'].includes(type))return 1;
 if(['line','ray','function','parametric','implicit','parallelThrough','perpendicularThrough','perpendicularFoot','perpBisector','locus','vectorField'].includes(type))return 2;
 if(['circle','circleThrough3','circleDiameter','ellipse','parabola','hyperbola','tangentCircle'].includes(type))return 3;
 if(['triangle','polygon','regularPolygon','rectangle','parallelogram','quadrilateral','angle'].includes(type))return 4;
 return 3;
}
/** Candidate order: eligible anchors before strokes, then lower-dimensional strokes.
 * Each anchor keeps its geometric distance order; SVG order breaks equal-rank ties.
 * No document scan: callers provide spatial-index and live rendered SVG hits.
 */
export function rankGeometryHits({anchors=[],elements=[],getObject,accept=()=>true,visible=()=>true}){
 const seen=new Set(),records=[];
 function add(id,isAnchor,index){
  if(!id||seen.has(id))return;
  seen.add(id);
  const object=getObject(id);
  if(!object||!visible(object)||!accept(object))return;
  records.push({id,rank:geometryPickRank(object,isAnchor),index,isAnchor});
 }
 anchors.forEach((id,index)=>add(id,true,index));
 elements.forEach((id,index)=>add(id,false,index));
 return records.sort((a,b)=>a.rank-b.rank||(a.isAnchor===b.isAnchor?a.index-b.index:a.isAnchor?-1:1)).map(item=>item.id);
}
