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
 const u=Math.max(Math.abs(ux),Math.abs(uy)),v=Math.max(Math.abs(vx),Math.abs(vy));
 if(!(u>0&&v>0))return false;
 // Normalize each edge independently before multiplying: the determinant
 // otherwise underflows for valid microscopic parallelograms.
 const product1=(ux/u)*(vy/v),product2=(uy/u)*(vx/v);
 const cross=product1-product2;
 const error=32*Number.EPSILON*(Math.abs(product1)+Math.abs(product2));
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

/** Shared focal ellipse parameters for model and sampled geometry. */
export function focalEllipseParameters(p){
 if(!Array.isArray(p)||p.length!==3||!p.every(finitePoint))return null;
 const [f1,f2,q]=p,dx=f2[0]-f1[0],dy=f2[1]-f1[1];
 const c=Math.hypot(dx,dy)/2,a=(Math.hypot(q[0]-f1[0],q[1]-f1[1])+Math.hypot(q[0]-f2[0],q[1]-f2[1]))/2;
 if(!Number.isFinite(a)||!Number.isFinite(c)||!(a>c&&a-c>64*Number.EPSILON*a))return null;
 // Divide before multiplying to keep the radicand dimensionless.
 const b=c===0?a:a*Math.sqrt(((a-c)/a)*(1+c/a));
 const cx=(f1[0]+f2[0])/2,cy=(f1[1]+f2[1])/2;
 if(!Number.isFinite(b)||b<=0||![cx,cy].every(Number.isFinite))return null;
 return {cx,cy,rx:a,ry:b,angle:Math.atan2(dy,dx)};
}
