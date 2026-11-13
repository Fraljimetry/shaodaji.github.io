/** Cut25: bounded scene-aware refinement of opt-in diagram edges.
 * Unlike document-order routing, the author may move an earlier arrow away
 * from a later *fixed* arrow. This is a two-pass, local geometry heuristic,
 * NOT a global planar-graph optimizer. Existing routing modes are immutable.
 * All work is screen-space; the semantic graph and saved JSON are untouched.
 */
import {routeDiagramEdge,polylineVisualConflicts} from './diagram_routing.mjs';
export const MAX_SCENE_ARROWS=48;
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const goodBox=b=>!!b&&Number.isFinite(b.width)&&Number.isFinite(b.height)&&b.width>0&&b.height>0;
const goodRect=r=>!!r&&[r.left,r.right,r.top,r.bottom].every(Number.isFinite)&&r.left<=r.right&&r.top<=r.bottom;
const pointsGood=p=>Array.isArray(p)&&p.length>=2&&p.length<=32&&p.every(finitePoint);
const pathLength=p=>p.slice(1).reduce((s,q,i)=>s+Math.hypot(q[0]-p[i][0],q[1]-p[i][1]),0);
const isAuto=e=>e.mode==='scene-crossings';
const isValid=e=>finitePoint(e.a)&&finitePoint(e.b)&&goodBox(e.fromBox)&&goodBox(e.toBox)&&Array.isArray(e.obstacles)&&e.obstacles.every(goodRect);
/**
 * @param {Array<{id:string,a:number[],b:number[],fromBox:object,toBox:object,
 *  obstacles:object[],mode:string,crossingPath?:number[][]}>} entries
 * @param {Map<string,object>} routes previously computed for this render
 * @returns {Map<string,object>} A NEW map. No input object is mutated.
 */
export function optimizeGlobalArrowRoutes(entries,routes){
 const result=new Map(routes);
 if(!Array.isArray(entries)||!(routes instanceof Map)||!entries.some(isAuto))return result;
 // Undrawable historical overlaps are preserved in the semantic graph but
 // cannot intersect anything on the canvas. They must not poison the
 // capacity or consistency check for otherwise valid visible arrows.
 const drawable=entries.filter(e=>!['overlap','invalid'].includes(routes.get(e.id)?.status));
 const targets=drawable.filter(isAuto);
 const overCapacity=drawable.length>MAX_SCENE_ARROWS||drawable.some(e=>!isValid(e)||!pointsGood(routes.get(e.id)?.points));
 if(overCapacity){
  for(const e of targets){const prior=result.get(e.id);if(prior)result.set(e.id,{...prior,status:'capacity'});}
  return result;
 }
 const pathOf=e=>isAuto(e)?result.get(e.id)?.points:e.crossingPath||result.get(e.id)?.points;
 const otherPaths=id=>drawable.filter(e=>e.id!==id).map(pathOf);
 const score=(p,others)=>polylineVisualConflicts(p,others);
 // Two bounded relaxation passes, no recursive rerouting and no hidden fallback.
 // Only opt-in routes are changed; explicit direct/legacy arrows remain fixed.
 for(let pass=0;pass<2;pass++){
  let changed=false;
  for(const e of targets){
   const current=result.get(e.id);if(!current||!pointsGood(current.points)||['invalid','overlap'].includes(current.status))continue;
   const others=otherPaths(e.id);
   if(others.some(p=>!pointsGood(p))){result.set(e.id,{...current,status:'capacity'});continue;}
   const trial=routeDiagramEdge(e.a,e.b,e.fromBox,e.toBox,e.obstacles,'avoid-crossings',others);
   if(!pointsGood(trial.points)||['capacity','blocked','overlap','invalid'].includes(trial.status))continue;
   const before=score(current.points,others),after=score(trial.points,others);
   if(!Number.isFinite(before)||!Number.isFinite(after)){result.set(e.id,{...current,status:'capacity'});continue;}
   // Never trade fewer collisions for a longer route by more than the
   // crossing-aware function's own bounded-length restriction.
   if(after<before||(after===before&&pathLength(trial.points)+1e-6<pathLength(current.points))){
    if(JSON.stringify(trial.points)!==JSON.stringify(current.points))changed=true;
    result.set(e.id,trial);
   }
  }
  if(!changed)break;
 }
 // Re-check after *all* changes: otherwise a route could falsely advertise
 // "clear" after another edge changed during the same pass.
 for(const e of targets){
  const r=result.get(e.id);if(!r||['invalid','overlap','blocked','capacity'].includes(r.status))continue;
  const crossings=score(r.points,otherPaths(e.id));
  result.set(e.id,!Number.isFinite(crossings)?{...r,status:'capacity'}:
   crossings>0?{...r,status:'crossing',crossings}:{...r,status:r.points.length>2?'routed':'clear',crossings:0});
 }
 return result;
}
