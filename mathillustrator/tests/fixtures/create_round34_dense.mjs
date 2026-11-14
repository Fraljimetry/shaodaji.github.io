// Reproducible stress fixture, deliberately not a new Geometry tool.
import {newDoc,append,addPoint,appendDerivedShapeEdges,appendPolygonEdges,validateDoc} from '../../src/model.mjs';
import {writeFileSync} from 'node:fs';
const d=newDoc();d.meta.title='Round34 dense diagram + dynamic geometry';
d.settings.grid=false;d.settings.showAxes=false;d.settings.showLabels=false;
const colors=['#000000','#3657ad','#16a34a','#ef4444','#cc8800'];
const nodes=[];
for(let row=0;row<4;row++)for(let col=0;col<5;col++){
 const text=['\\log x','\\sin x','A_{ij}','\\frac{n+1}{n}','\\alpha\\to\\beta'][col];
 const node=append(d,{type:'node',xy:[-8+col*4,5-row*3.1],text,fontSize:17,textMode:'latex',nodeBorder:(row+col)%3===0});
 node.style.stroke=colors[(row+col)%colors.length];nodes.push(node);
}
for(let i=0;i<nodes.length;i++)for(const step of [1,5,6]){
 const j=i+step;
 if(j>=nodes.length||step===1&&Math.floor(j/5)!==Math.floor(i/5)||step===6&&j%5===0)continue;
 const m=append(d,{type:'morphism',refs:[nodes[i].id,nodes[j].id],text: i%3===0?'\\phi':'',textMode:'latex',bend:(i%4===0?0.5:i%4===1?-.7:0),routing:i%6===0?'avoid':'direct',arrowStyle:i%4===0?'dotted':'solid',labelAvoid:true});
 m.style.stroke=colors[i%colors.length];
}
const pts=[];for(let i=0;i<18;i++)pts.push(addPoint(d,[-9+(i%9)*2.2,-8-Math.floor(i/9)*2.5],`G${i+1}`));
for(let i=0;i<3;i++){const r=append(d,{type:'regularPolygon',refs:[pts[2*i].id,pts[2*i+1].id],sides:5+i});appendDerivedShapeEdges(d,r.id);}
for(let i=0;i<3;i++){const r=append(d,{type:'rectangle',refs:[pts[i].id,pts[12+i].id]});appendDerivedShapeEdges(d,r.id);}
for(let i=0;i<3;i++)append(d,{type:'circle',refs:[pts[2*i].id,pts[2*i+1].id]});
for(let i=0;i<4;i++)append(d,{type:'segment',refs:[pts[i].id,pts[i+8].id]});
for(let i=0;i<3;i++)append(d,{type:'midpoint',refs:[pts[i].id,pts[i+9].id]});
const valid=validateDoc(d);
const path=new URL('./round34_dense_scene.json',import.meta.url);
writeFileSync(path,JSON.stringify(valid,null,2)+'\n');
console.log(valid.objects.length, 'objects',valid.objects.filter(x=>x.type==='morphism').length,'morphisms');
