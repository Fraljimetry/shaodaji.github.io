/** Scale-equivariant predicates for finite 2D construction geometry.
 * This is a world-space numerical contract, never a pixel hit tolerance.
 * Magnitudes are computed from local differences, not world-origin coordinates.
 */
export const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export function distinctPoints(a,b){
 if(!finitePoint(a)||!finitePoint(b))return false;
 const dx=b[0]-a[0],dy=b[1]-a[1];
 return Number.isFinite(dx)&&Number.isFinite(dy)&&(dx!==0||dy!==0);
}
export function independentEdges(a,b,c){
 if(![a,b,c].every(finitePoint))return false;
 const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
 if(![ux,uy,vx,vy].every(Number.isFinite))return false;
 const cross=ux*vy-uy*vx;
 const error=32*Number.EPSILON*(Math.abs(ux*vy)+Math.abs(uy*vx));
 return Number.isFinite(cross)&&Math.abs(cross)>error;
}
export function perpendicularHeightNonzero(a,b,c){
 if(![a,b,c].every(finitePoint))return false;
 const ux=b[0]-a[0],uy=b[1]-a[1],vx=c[0]-b[0],vy=c[1]-b[1];
 const len=Math.hypot(ux,uy);
 if(!(len>0)||!Number.isFinite(len))return false;
 const h=(-uy/len)*vx+(ux/len)*vy;
 // Compare normalized height against cancellation in its two summands.
 const err=32*Number.EPSILON*(Math.abs((-uy/len)*vx)+Math.abs((ux/len)*vy));
 return Number.isFinite(h)&&Math.abs(h)>err;
}
