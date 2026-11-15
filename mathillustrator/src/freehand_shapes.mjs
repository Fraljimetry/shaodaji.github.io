/** User-drawn shape cleanup. Input and output are world-space points; never infer
 * exact geometric constraints from a drawn stroke. Keep the original gesture to
 * allow lossless switching between Free / Ellipse / Polygon in Properties. */
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
function openStroke(raw){
 const pts=raw.filter(finitePoint);if(pts.length<2)return [];
 const first=pts[0],last=pts.at(-1);
 return distance(first,last)<1e-9?pts.slice(0,-1):pts;
}
function simplify(points,tolerance){
 if(points.length<=2)return points.slice();
 let best=0,index=-1;const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
 for(let i=1;i<points.length-1;i++){
  const p=points[i],t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0;
  const d=distance(p,[a[0]+t*dx,a[1]+t*dy]);if(d>best){best=d;index=i;}
 }
 if(best<=tolerance)return [a,b];
 return [...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)];
}
function polygonVertices(raw){
 const pts=openStroke(raw);if(pts.length<3)return [];
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const diameter=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
 if(!(diameter>1e-8))return [];
 // A closed Ramer-Douglas-Peucker pass. Rotate the sequence to a stable
 // extreme point so the opening gesture does not force an artificial corner.
 const center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];
 const pivot=pts.reduce((best,p,i)=>distance(p,center)>distance(pts[best],center)?i:best,0);
 const rotated=[...pts.slice(pivot),...pts.slice(0,pivot)];
 let vertices=simplify([...rotated,rotated[0]],diameter*.038).slice(0,-1);
 // Suppress adjacent redundant corners while retaining curved gestures as
 // polygons with bounded vertex count; never create a degenerate shape.
 vertices=vertices.filter((p,i)=>i===0||distance(p,vertices[i-1])>diameter*.025);
 if(vertices.length>24){const stride=Math.ceil(vertices.length/24);vertices=vertices.filter((_,i)=>i%stride===0);}
 return vertices.length>=3?vertices:[];
}
export function shapeFromStroke(raw,shape='free',regular=true){
 if(!Array.isArray(raw)||raw.length<2||!raw.every(finitePoint))return null;
 if(shape==='free')return {path:raw.map(p=>p.slice()),closed:false};
 const xs=raw.map(p=>p[0]),ys=raw.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 let rx=(maxX-minX)/2,ry=(maxY-minY)/2;
 if(!(rx>1e-8&&ry>1e-8))return null;
 const cx=(maxX+minX)/2,cy=(maxY+minY)/2;
 if(shape==='ellipse'){
  if(regular){const radius=(rx+ry)/2;rx=radius;ry=radius;}
  const path=Array.from({length:65},(_,i)=>[cx+rx*Math.cos(i*Math.PI/32),cy+ry*Math.sin(i*Math.PI/32)]);
  path[path.length-1]=path[0].slice();
  return {path,closed:true,shape:'ellipse'};
 }
 if(shape!=='polygon')return null;
 let path=polygonVertices(raw);if(path.length<3)return null;
 if(regular){
  const n=path.length;
  if(n>24)return null;
  const angle=Math.atan2(path[0][1]-cy,path[0][0]-cx);
  const signedArea=path.reduce((sum,p,i)=>sum+p[0]*path[(i+1)%n][1]-path[(i+1)%n][0]*p[1],0);
  const sign=Math.sign(signedArea)||1;
  const radius=Math.max(1e-8,Math.sqrt(rx*rx+ry*ry));
  path=Array.from({length:n},(_,i)=>[cx+radius*Math.cos(angle+sign*2*Math.PI*i/n),cy+radius*Math.sin(angle+sign*2*Math.PI*i/n)]);
 }
 return {path:[...path,path[0]],closed:true,shape:'polygon'};
}
