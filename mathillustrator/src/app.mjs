import {VERSION,TOOLS,PRESETS,newDoc,clone,append,get,position,points,remove,snapPoint,addPoint,createAnchored,validateDoc,command,parseExpression,finite} from './model.mjs';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const glyph={select:'<path d="M5 3L5 22L10 16L14 23L17 21L13 14L21 13Z"/>',pan:'<path d="M12 2V22M2 12H22M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3"/>',point:'<circle cx="12" cy="12" r="3"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',segment:'<path d="M3 20L21 4"/><circle cx="3" cy="20" r="2"/><circle cx="21" cy="4" r="2"/>',arrow:'<path d="M3 20L21 4M13 4h8v8"/>',circle:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1"/>',rectangle:'<rect x="4" y="5" width="16" height="14"/>',polygon:'<path d="M3 18L9 4L21 10L18 21Z"/>',polyline:'<path d="M3 17L8 5L14 13L21 4"/>',freehand:'<path d="M2 20C8-6 12 30 22 3"/>',text:'<path d="M3 6V3h18v3M12 3v18M8 21h8"/>'};
const toolGroups={'basic-tools':[['select','Move'],['pan','Pan'],['point','Point']], 'construction-tools':[['segment','Segment'],['arrow','Arrow'],['circle','Circle'],['rectangle','Rectangle'],['polygon','Polygon'],['polyline','Polyline']], 'illustration-tools':[['freehand','Free curve'],['text','Text']]};
let doc=newDoc(),selected=null,tool='select',drag=null,draftStart=null,draftPoints=[],hover=null,view={cx:0,cy:0,scale:48},size={w:900,h:600},history=[],future=[],saveTimer=null,dirty=false,lastRender=0,frame=0,presetName='General';
const STORAGE='mathillustrator-project-v1',SETTINGS='mathillustrator-ui-v1';
function notice(msg){const e=$('toast');e.textContent=msg;e.classList.add('visible');clearTimeout(notice.timer);notice.timer=setTimeout(()=>e.classList.remove('visible'),3400);}
function safeStorageSet(key,value){try{localStorage.setItem(key,value);return true;}catch(e){notice('Local save unavailable: '+e.message);return false;}}
function enqueueSave(){dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{const payload=JSON.stringify(doc);safeStorageSet(STORAGE,payload);dirty=false;}catch(e){notice('Project autosave failed. Use Save to download JSON.');}},350);}
function snapshot(){history.push(JSON.stringify(doc));if(history.length>80)history.shift();future=[];syncHistory();}
function syncHistory(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function restore(s){doc=validateDoc(JSON.parse(s));selected=null;draftStart=null;draftPoints=[];enqueueSave();renderAll();}
function undo(){if(!history.length)return;future.push(JSON.stringify(doc));restore(history.pop());syncHistory();}
function redo(){if(!future.length)return;history.push(JSON.stringify(doc));restore(future.pop());syncHistory();}
function update(mutator,{refreshList=true}={}){const old=JSON.stringify(doc);try{mutator();validateDoc(doc);}catch(e){doc=JSON.parse(old);notice(e.message);return false;}if(JSON.stringify(doc)!==old){history.push(old);if(history.length>80)history.shift();future=[];syncHistory();enqueueSave();}if(refreshList)renderAll();else render();return true;}
function el(tag,attrs={},content){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs)){if(v!==undefined&&v!==null)e.setAttribute(k,String(v));}if(content!==undefined)e.textContent=String(content);return e;}
function project(p){return [(p[0]-view.cx)*view.scale+size.w/2,(view.cy-p[1])*view.scale+size.h/2];}
function unproject(x,y){return [(x-size.w/2)/view.scale+view.cx,(size.h/2-y)/view.scale+view.cy];}
function xyEvent(e){const b=$('drawing').getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top];}
function screenPoints(o){const p=points(doc,o);return p.every(Boolean)?p.map(project):null;}
function desc(o){if(o.type==='point')return `(${o.xy.map(n=>Number(n.toFixed(3))).join(', ')})`;
 if(o.type==='midpoint')return `Midpoint(${o.refs?.map(id=>get(doc,id)?.name||'?').join(', ')})`;
 if(o.type==='function')return `y = ${o.expr}`;
 if(o.type==='text')return o.text;
 if(o.refs)return `${o.type}(${o.refs.map(id=>get(doc,id)?.name||'?').join(', ')})`;
 if(o.path)return `${o.path.length} path points`;
 return o.type;
}
function simple(a,b){return Math.round(a*100)/100===Math.round(b*100)/100;}
function drawBackground(svg,includeGrid=true){svg.append(el('rect',{x:0,y:0,width:size.w,height:size.h,fill:doc.settings.background||'#fff'}));
 const settings=doc.settings;if(settings.page!=='infinite'){
  const ratio=settings.page==='a4'?297/210:11/8.5;const pw=Math.min(size.w*.75,size.h*.75*ratio),ph=pw/ratio;svg.append(el('rect',{x:(size.w-pw)/2,y:(size.h-ph)/2,width:pw,height:ph,fill:'none',stroke:'#94a3b8','stroke-width':1.5,'stroke-dasharray':'5 4',opacity:.8}));
 }
 if(!includeGrid)return;
 const minX=view.cx-size.w/(2*view.scale),maxX=view.cx+size.w/(2*view.scale),minY=view.cy-size.h/(2*view.scale),maxY=view.cy+size.h/(2*view.scale);
 let step=Number(settings.snapStep)||.5;while(step*view.scale<24)step*=2;while(step*view.scale>100)step/=2;
 if(settings.grid){const g=el('g',{'stroke':'#9daec1','stroke-width':.65,opacity:.28});for(let x=Math.ceil(minX/step)*step,n=0;x<=maxX&&n<150;x+=step,n++){const [sx]=project([x,0]);g.append(el('line',{x1:sx,y1:0,x2:sx,y2:size.h}));}for(let y=Math.ceil(minY/step)*step,n=0;y<=maxY&&n<150;y+=step,n++){const [,sy]=project([0,y]);g.append(el('line',{x1:0,y1:sy,x2:size.w,y2:sy}));}svg.append(g);}
 if(settings.showAxes){const [zx,zy]=project([0,0]),g=el('g',{stroke:'#738396','stroke-width':1});if(zx>=0&&zx<=size.w)g.append(el('line',{x1:zx,y1:0,x2:zx,y2:size.h}));if(zy>=0&&zy<=size.h)g.append(el('line',{x1:0,y1:zy,x2:size.w,y2:zy}));svg.append(g);}
}
function attr(o,selectHighlight=false){return {stroke:selectHighlight?'#7e66df':o.style?.stroke||'#3657ad','stroke-width':Math.max(.15,Number(o.style?.width)||2)+(selectHighlight?1:0),fill:o.style?.fill||'none',opacity:o.style?.opacity??1};}
function renderObject(svg,o,exporting=false){if(o.hidden)return;const isSel=selected===o.id&&!exporting,sty=attr(o,isSel);let item=null,p=screenPoints(o);const mk=(tag,a)=>el(tag,{...sty,...a});
 if(o.type==='point'||o.type==='midpoint'){
  const at=position(doc,o.id);if(!at)return;const [x,y]=project(at);item=el('circle',{cx:x,cy:y,r:Number(doc.settings.pointSize)||5,stroke:isSel?'#7e66df':o.style.stroke,fill:o.style.stroke,'stroke-width':1,opacity:sty.opacity});
  const label=el('text',{x:x+8,y:y-9,'font-size':12,'font-family':'Arial, sans-serif','fill':o.style.stroke,'pointer-events':'none'},o.name);svg.append(label);
 }else if((o.type==='segment'||o.type==='arrow'||o.type==='line')&&p?.length===2){
  let [a,b]=p;if(o.type==='line'){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.01)return;const t=Math.max(size.w,size.h)*2/len;a=[a[0]-dx*t,a[1]-dy*t];b=[b[0]+dx*t,b[1]+dy*t];}
  item=mk('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],fill:'none','marker-end':o.type==='arrow'?'url(#arrowhead)':undefined});
 }else if(o.type==='circle'&&p?.length===2){const r=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);item=mk('circle',{cx:p[0][0],cy:p[0][1],r,fill:'none'});
 }else if((o.type==='polygon'||o.type==='polyline')&&p?.length>=2){item=mk(o.type==='polygon'?'polygon':'polyline',{points:p.map(q=>q.join(',')).join(' '),fill:o.type==='polygon'?sty.fill:'none','fill-opacity':.24});
 }else if(o.type==='rectangle'&&o.xy&&o.wh){const a=project(o.xy),b=project([o.xy[0]+o.wh[0],o.xy[1]+o.wh[1]]);item=mk('rect',{x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),width:Math.abs(b[0]-a[0]),height:Math.abs(b[1]-a[1]),'fill-opacity':.24});
 }else if(o.type==='freehand'&&o.path?.length>1){item=mk('polyline',{points:o.path.map(project).map(q=>q.join(',')).join(' '),fill:'none','stroke-linejoin':'round','stroke-linecap':'round'});
 }else if(o.type==='text'){const [x,y]=project(o.xy);item=el('text',{x,y,'font-size':o.fontSize||18,'font-family':'Arial, sans-serif',fill:o.style.stroke,opacity:sty.opacity},o.text);
 }else if(o.type==='function'){
  try{const f=parseExpression(o.expr),path=[];let active=false,prevY=null;for(let px=0;px<=size.w;px+=Math.max(2,Math.ceil(size.w/1800))){const x=unproject(px,0)[0],y=f(x),sy=project([x,y])[1];if(!Number.isFinite(sy)||Math.abs(sy)>100000||prevY!==null&&Math.abs(sy-prevY)>size.h*.8){active=false;prevY=Number.isFinite(sy)?sy:null;continue;}path.push(`${active?'L':'M'}${px.toFixed(2)} ${sy.toFixed(2)}`);active=true;prevY=sy;}
   item=mk('path',{d:path.join(' '),fill:'none'});
  }catch{return;}
 }
 if(!item)return;item.dataset.id=o.id;item.classList.add('clickable');if(isSel)item.classList.add('selected-shape');svg.append(item);
 // Larger transparent hit area for thin strokes; pass selection through via data-id.
 if(!exporting&&['segment','arrow','line','freehand','polyline','function'].includes(o.type)){const hit=item.cloneNode(false);hit.removeAttribute('marker-end');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width',Math.max(11,Number(o.style.width)+7));hit.setAttribute('opacity','1');hit.setAttribute('fill','none');hit.dataset.id=o.id;svg.append(hit);}
}
function draw(svg,{exporting=false}={}){svg.setAttribute('viewBox',`0 0 ${size.w} ${size.h}`);svg.setAttribute('width',size.w);svg.setAttribute('height',size.h);drawBackground(svg,true);
 const defs=el('defs'),arrow=el('marker',{id:'arrowhead',markerWidth:7,markerHeight:7,refX:6,refY:3,orient:'auto',markerUnits:'strokeWidth'});arrow.append(el('path',{d:'M0 0 L6 3 L0 6 Z',fill:doc.settings.stroke||'#3657ad'}));defs.append(arrow);svg.append(defs);
 for(const o of doc.objects)renderObject(svg,o,exporting);
 if(!exporting){const preview=draftPoints.length?draftPoints:(draftStart?[draftStart]:[]);if(preview.length&&hover){const p=[...preview,hover].map(project);svg.append(el('polyline',{points:p.map(q=>q.join(',')).join(' '),stroke:doc.settings.stroke,'stroke-width':1.5,'stroke-dasharray':'4 4',fill:'none','pointer-events':'none'}));}}
}
function render(){frame=0;const start=performance.now(),svg=$('drawing');svg.replaceChildren();draw(svg);lastRender=performance.now()-start;$('render-info').textContent=`${doc.objects.length} objects · ${Math.round(lastRender*10)/10} ms`;}
function scheduleRender(){if(!frame)frame=requestAnimationFrame(render);}
function renderList(){const wrapper=$('objects');wrapper.replaceChildren();$('object-count').textContent=String(doc.objects.length);
 for(const o of [...doc.objects].reverse()){
  if(o.hidden&&!$('show-hidden').checked)continue;const row=document.createElement('div');row.className='object'+(o.id===selected?' selected':'')+(o.hidden?' hidden':'');row.dataset.id=o.id;row.setAttribute('role','listitem');
  const glyph=document.createElement('span');glyph.className='glyph';glyph.textContent={point:'•',midpoint:'◉',segment:'╱',arrow:'➜',line:'⟷',circle:'◯',polygon:'⬡',polyline:'⌁',freehand:'∿',text:'T',function:'ƒ',rectangle:'□'}[o.type]||'◇';row.append(glyph);
  const label=document.createElement('span');label.className='object-label';const strong=document.createElement('strong');strong.textContent=o.name;const small=document.createElement('small');small.textContent=desc(o);label.append(strong,small);row.append(label);
  const eye=document.createElement('button');eye.textContent=o.hidden?'◌':'◉';eye.title=o.hidden?'Show':'Hide';eye.setAttribute('aria-label',eye.title);eye.onclick=e=>{e.stopPropagation();update(()=>o.hidden=!o.hidden);};row.append(eye);
  const lock=document.createElement('button');lock.textContent=o.locked?'🔒':'◇';lock.title=o.locked?'Unlock':'Lock';lock.setAttribute('aria-label',lock.title);lock.onclick=e=>{e.stopPropagation();update(()=>o.locked=!o.locked);};row.append(lock);
  row.onclick=()=>select(o.id);wrapper.append(row);
 }
 $('delete').disabled=!selected;
}
function field(parent,label,value,type,onChange,opts={}){const wrap=document.createElement('label');wrap.className='field';wrap.textContent=label;const input=document.createElement('input');input.type=type;input.value=String(value??'');if(opts.step)input.step=opts.step;if(opts.min!==undefined)input.min=opts.min;if(opts.max!==undefined)input.max=opts.max;input.onchange=()=>onChange(type==='number'?Number(input.value):input.value);wrap.append(input);parent.append(wrap);return input;}
function renderProperties(){const root=$('properties');root.replaceChildren();const h=document.createElement('h3');h.textContent='Properties';root.append(h);const o=get(doc,selected);
 if(!o){const p=document.createElement('p');p.className='subtle';p.textContent='Select an object to edit its style and geometry.';root.append(p);return;}
 field(root,'Name',o.name,'text',v=>update(()=>{if(!v.trim()||doc.objects.some(a=>a!==o&&a.name===v.trim()))throw Error('Object names must be unique and nonempty.');o.name=v.trim();}));
 if(o.type==='point'){const p=document.createElement('div');p.className='twocol';for(let i=0;i<2;i++){const l=document.createElement('label');l.textContent=i?'y':'x';const a=document.createElement('input');a.type='number';a.step='any';a.value=o.xy[i];a.onchange=()=>update(()=>{const v=Number(a.value);if(!finite(v))throw Error('Invalid coordinate.');o.xy[i]=v;});l.append(a);p.append(l);}root.append(p);}
 if(o.type==='text'){field(root,'Text',o.text,'text',v=>update(()=>{o.text=v;}));field(root,'Font size',o.fontSize||18,'number',v=>update(()=>{if(!finite(v)||v<5||v>200)throw Error('Font size out of range.');o.fontSize=v;}));}
 if(o.type==='function'){field(root,'y(x) =',o.expr,'text',v=>update(()=>{parseExpression(v);o.expr=v;}));}
 field(root,'Stroke',o.style.stroke,'color',v=>update(()=>o.style.stroke=v));
 if(['polygon'].includes(o.type))field(root,'Fill',o.style.fill,'color',v=>update(()=>o.style.fill=v));
 field(root,'Line width',o.style.width,'number',v=>update(()=>{if(!finite(v)||v<0.1||v>30)throw Error('Width out of range.');o.style.width=v;},{refreshList:false}),{step:.5,min:.1,max:30});
 field(root,'Opacity',o.style.opacity,'number',v=>update(()=>{if(!finite(v)||v<0||v>1)throw Error('Opacity must be in [0,1].');o.style.opacity=v;},{refreshList:false}),{step:.1,min:0,max:1});
 const actions=document.createElement('div');actions.className='props-actions';const del=document.createElement('button');del.textContent='Delete + dependents';del.onclick=deleteSelected;const up=document.createElement('button');up.textContent='Bring forward';up.onclick=()=>update(()=>{const n=doc.objects.indexOf(o);if(n<doc.objects.length-1)doc.objects.splice(n,2,doc.objects[n+1],o);});actions.append(del,up);root.append(actions);
}
function renderAll(){renderList();renderProperties();render();syncSettings();}
function select(id){selected=id;renderList();renderProperties();scheduleRender();}
function selectTool(t){if(!TOOLS.includes(t)&&t!=='rectangle')return;tool=t;draftStart=null;draftPoints=[];hover=null;$('drawing').dataset.tool=t;document.querySelectorAll('[data-tool-choice]').forEach(b=>{const a=b.dataset.toolChoice===t;b.classList.toggle('active',a);b.setAttribute('aria-pressed',a?'true':'false');});$('mode-label').textContent=({select:'Select · drag points to edit',pan:'Pan · drag the canvas',polygon:'Polygon · click vertices, Enter to finish',polyline:'Polyline · click vertices, Enter to finish',freehand:'Free curve · draw with pointer'}[t]||`${t[0].toUpperCase()+t.slice(1)} · click canvas`);scheduleRender();}
function populateTools(){for(const [root,group]of Object.entries(toolGroups)){for(const [id,label]of group){const b=document.createElement('button');b.className='tool';b.dataset.toolChoice=id;b.title=label;b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${glyph[id]}</svg><span>${label}</span>`;b.onclick=()=>selectTool(id);$(root).append(b);}}selectTool('select');}
function syncSettings(){for(const [id,k]of [['correction','correction'],['snap-step','snapStep'],['snap','snap'],['grid','grid'],['axes','showAxes'],['default-stroke','stroke'],['default-fill','fill'],['default-width','width'],['page','page'],['background','background']]){const input=$(id);if(!input)continue;if(input.type==='checkbox')input.checked=!!doc.settings[k];else input.value=doc.settings[k];}}
function setupSettings(){const preset=$('preset');for(const name of Object.keys(PRESETS)){const option=document.createElement('option');option.value=name;option.textContent=name;preset.append(option);}preset.value='General';preset.onchange=()=>update(()=>{Object.assign(doc.settings,clone(PRESETS[preset.value]));presetName=preset.value;});
 for(const [id,k]of [['correction','correction'],['snap-step','snapStep'],['snap','snap'],['grid','grid'],['axes','showAxes'],['default-stroke','stroke'],['default-fill','fill'],['default-width','width'],['page','page'],['background','background']])$(id).onchange=()=>update(()=>{const input=$(id);let value=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;if(input.type==='number'&&(!finite(value)||value<=0||value>1000))throw Error('Value is outside the supported range.');doc.settings[k]=value;});
 const theme=$('theme');try{theme.value=JSON.parse(localStorage.getItem(SETTINGS)||'{}').theme||'light';}catch{theme.value='light';}document.documentElement.dataset.theme=theme.value;theme.onchange=()=>{document.documentElement.dataset.theme=theme.value;safeStorageSet(SETTINGS,JSON.stringify({theme:theme.value}));};
}
function nearestAnchor(pt){const distance=10/view.scale;let best=null,score=distance;for(const o of doc.objects){if(o.hidden||o.locked||!['point','midpoint'].includes(o.type))continue;const p=position(doc,o.id);if(!p)continue;const d=Math.hypot(pt[0]-p[0],pt[1]-p[1]);if(d<score){score=d;best=o.id;}}return best;}
function makeRef(pt){return nearestAnchor(pt)||addPoint(doc,pt).id;}
function rectCreate(a,b){const pts=[[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]]];return createAnchored(doc,'polygon',pts);}
function addTwoPoint(type,a,b){update(()=>{const p=makeRef(a),q=makeRef(b);selected=append(doc,{type,refs:[p,q]}).id;});}
function finishDraft(){if(!['polygon','polyline'].includes(tool)||draftPoints.length<(tool==='polygon'?3:2)){notice('Add more vertices before finishing.');return;}const pts=clone(draftPoints),type=tool;draftPoints=[];update(()=>{const refs=pts.map(makeRef);selected=append(doc,{type,refs}).id;});}
function correctedPath(path){const mode=doc.settings.correction;if(mode==='off'||path.length<3)return path;const distance=mode==='gentle'?.004:mode==='medium'?.012:.028;
 const keep=[path[0]];for(let i=1;i<path.length-1;i++){const p=path[i];if(Math.hypot(p[0]-keep.at(-1)[0],p[1]-keep.at(-1)[1])>distance)keep.push(p);}keep.push(path.at(-1));
 let pts=keep;for(let n=0;n<(mode==='strong'?2:1);n++){if(pts.length>10000)break;const next=[pts[0]];for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];next.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]]);}next.push(pts.at(-1));pts=next;}return pts;}
function pointerDown(e){if(e.button!==0)return;const [sx,sy]=xyEvent(e),world=unproject(sx,sy),pt=snapPoint(world,doc.settings);$('drawing').focus();hover=pt;
 if(tool==='select'){
  const id=e.target.closest('[data-id]')?.dataset.id||null;select(id);
  const o=get(doc,id);if(o?.type==='point'&&!o.locked&&!o.hidden){drag={kind:'point',id,before:JSON.stringify(doc)};}else if(e.shiftKey||e.altKey){drag={kind:'pan',sx,sy,cx:view.cx,cy:view.cy};}
 }else if(tool==='pan'){drag={kind:'pan',sx,sy,cx:view.cx,cy:view.cy};}
 else if(tool==='point'){update(()=>{selected=addPoint(doc,pt).id;});}
 else if(['segment','arrow','circle','rectangle'].includes(tool)){if(!draftStart){draftStart=pt;scheduleRender();}else{const a=draftStart;draftStart=null;if(tool==='rectangle'){update(()=>{selected=rectCreate(a,pt).id;});}else addTwoPoint(tool,a,pt);}}
 else if(['polygon','polyline'].includes(tool)){if(draftPoints.length===0||Math.hypot(...draftPoints.at(-1).map((n,i)=>n-pt[i]))>1e-6)draftPoints.push(pt);scheduleRender();}
 else if(tool==='freehand'){drag={kind:'freehand',path:[world]};}
 else if(tool==='text'){const t=window.prompt('Text label (plain text):');if(t!==null&&t.trim())update(()=>{selected=append(doc,{type:'text',xy:pt,text:t.slice(0,2000),fontSize:18}).id;});}
 if(drag)try{$('drawing').setPointerCapture(e.pointerId);}catch{}
}
function pointerMove(e){const [sx,sy]=xyEvent(e),world=unproject(sx,sy);hover=snapPoint(world,doc.settings);$('coords').textContent=`x ${world[0].toFixed(2)} · y ${world[1].toFixed(2)}`;
 if(drag?.kind==='pan'){view.cx=drag.cx-(sx-drag.sx)/view.scale;view.cy=drag.cy+(sy-drag.sy)/view.scale;}
 else if(drag?.kind==='point'){const o=get(doc,drag.id);if(o)o.xy=hover;}
 else if(drag?.kind==='freehand'){const p=world,last=drag.path.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>1/view.scale)drag.path.push(p);}
 scheduleRender();}
function pointerUp(){if(drag?.kind==='point'){const before=drag.before;if(JSON.stringify(doc)!==before){history.push(before);if(history.length>80)history.shift();future=[];syncHistory();enqueueSave();renderList();renderProperties();}}
 if(drag?.kind==='freehand'){const path=correctedPath(drag.path);if(path.length>=2&&Math.hypot(path[0][0]-path.at(-1)[0],path[0][1]-path.at(-1)[1])>0.01){update(()=>{selected=append(doc,{type:'freehand',path}).id;});}}
 drag=null;scheduleRender();}
function onWheel(e){e.preventDefault();const [x,y]=xyEvent(e),before=unproject(x,y),factor=Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*.0013);view.scale=Math.max(5,Math.min(1000,view.scale*factor));const after=unproject(x,y);view.cx+=before[0]-after[0];view.cy+=before[1]-after[1];scheduleRender();}
function fit(){const pts=[];for(const o of doc.objects){if(o.type==='point')pts.push(o.xy);if(o.type==='midpoint'){const p=position(doc,o.id);if(p)pts.push(p);}if(o.type==='text')pts.push(o.xy);if(o.type==='freehand')pts.push(...o.path);}
 if(!pts.length){view={cx:0,cy:0,scale:48};render();return;}let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const p of pts){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}view.cx=(maxX+minX)/2;view.cy=(maxY+minY)/2;view.scale=Math.max(5,Math.min(1000,Math.min(size.w/Math.max(5,(maxX-minX)*1.5),size.h/Math.max(5,(maxY-minY)*1.5))));render();}
function deleteSelected(){if(!selected)return;const id=selected;update(()=>{const count=remove(doc,id);selected=null;notice(`Deleted ${count} object${count===1?'':'s'} including dependents.`);});}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);}
function svgString(){const svg=el('svg',{xmlns:NS,width:size.w,height:size.h,viewBox:`0 0 ${size.w} ${size.h}`});draw(svg,{exporting:true});return new XMLSerializer().serializeToString(svg);}
async function exportImage(type){const raw=svgString();if(type==='svg'){download(new Blob([raw],{type:'image/svg+xml;charset=utf-8'}),'mathillustrator.svg');return;}
 const src=URL.createObjectURL(new Blob([raw],{type:'image/svg+xml'}));try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Unable to rasterize SVG.'));img.src=src;});const can=document.createElement('canvas');can.width=Math.round(size.w*2);can.height=Math.round(size.h*2);const context=can.getContext('2d');if(!context)throw Error('Canvas 2D unavailable.');context.scale(2,2);context.drawImage(img,0,0,size.w,size.h);const mime={png:'image/png',jpeg:'image/jpeg',webp:'image/webp'}[type];const blob=await new Promise(resolve=>can.toBlob(resolve,mime,.94));if(!blob||blob.type!==mime)throw Error(type.toUpperCase()+' export is unsupported by this browser.');download(blob,'mathillustrator.'+(type==='jpeg'?'jpg':type));}finally{URL.revokeObjectURL(src);}}
function latexEscape(s){const map={'\\':'\\textbackslash{}','#':'\\#','$':'\\$','%':'\\%','&':'\\&','_':'\\_','{':'\\{','}':'\\}'};return [...String(s)].map(c=>map[c]||c).join('');}
function texPoint(p){return `(${p[0].toFixed(5)},${p[1].toFixed(5)})`;}
function canTikz(){return doc.objects.every(o=>['point','midpoint','segment','arrow','line','circle','polygon','polyline','freehand','text'].includes(o.type));}
function asTikz(){if(!canTikz())throw Error('TikZ export is disabled for function plots in this version.');const lines=['\\begin{tikzpicture}[x=1cm,y=1cm, line cap=round, line join=round]'];
 for(const o of doc.objects){if(o.hidden)continue;const rgb=o.style.stroke||'#000000',style=`draw={rgb,255:red,${parseInt(rgb.slice(1,3),16)};green,${parseInt(rgb.slice(3,5),16)};blue,${parseInt(rgb.slice(5,7),16)}}, line width=${o.style.width}pt, opacity=${o.style.opacity}`;const p=points(doc,o);
  if(o.type==='point'||o.type==='midpoint'){const xy=position(doc,o.id);if(!xy)continue;lines.push(`\\fill ${texPoint(xy)} circle (1.2pt);`);lines.push(`\\node[above right] at ${texPoint(xy)} {${latexEscape(o.name)}};`);}
  else if(['segment','arrow','line'].includes(o.type)&&p.length===2&&p.every(Boolean)){let [a,b]=p;if(o.type==='line'){const delta=[b[0]-a[0],b[1]-a[1]],len=Math.hypot(...delta);if(!len)continue;const k=100/len;a=[a[0]-delta[0]*k,a[1]-delta[1]*k];b=[b[0]+delta[0]*k,b[1]+delta[1]*k];}lines.push(`\\draw[${style}${o.type==='arrow'?',->':''}] ${texPoint(a)} -- ${texPoint(b)};`);}
  else if(o.type==='circle'&&p.length===2&&p.every(Boolean)){lines.push(`\\draw[${style}] ${texPoint(p[0])} circle (${Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1]).toFixed(5)}cm);`);}
  else if(['polygon','polyline'].includes(o.type)&&p.every(Boolean)){lines.push(`\\draw[${style}] ${p.map(texPoint).join(' -- ')}${o.type==='polygon'?' -- cycle':''};`);}
  else if(o.type==='freehand'&&o.path.length>1){lines.push(`\\draw[${style}] ${o.path.filter((_,i)=>i%Math.max(1,Math.ceil(o.path.length/400))===0||i===o.path.length-1).map(texPoint).join(' -- ')};`);}
  else if(o.type==='text')lines.push(`\\node[anchor=west] at ${texPoint(o.xy)} {${latexEscape(o.text)}};`);
 }
 lines.push('\\end{tikzpicture}');return lines.join('\n');}
function setupExport(){const opts=[['SVG','svg',true],['PNG','png',true],['JPEG','jpeg',true],['WebP','webp',true],['TikZ / PGF','tikz',canTikz()],['JSON project','json',true],['PDF','pdf',false],['Asymptote','asy',false],['tikz-cd','tikzcd',false],['GIF / video','animation',false]];
 const root=$('export-options');root.replaceChildren();for(const [name,type,supported]of opts){const b=document.createElement('button');b.textContent=name;b.disabled=!supported;b.title=supported?'Export current illustration':'Not implemented or not representable in current scene';b.onclick=async()=>{try{if(['svg','png','jpeg','webp'].includes(type))await exportImage(type);else if(type==='json')download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),'mathillustrator.json');else if(type==='tikz')download(new Blob([asTikz()],{type:'text/plain'}),'mathillustrator.tex');$('export-menu').hidden=true;}catch(e){notice(e.message);}};root.append(b);}}
function initialise(){populateTools();setupSettings();let old=null;try{old=localStorage.getItem(STORAGE);}catch(e){notice('Browser storage is restricted: use Save for project backup.');}if(old){try{doc=validateDoc(JSON.parse(old));}catch(e){notice('Saved project invalid: '+e.message+' (not overwritten until you edit).');}}
 const svg=$('drawing');svg.addEventListener('pointerdown',pointerDown);svg.addEventListener('pointermove',pointerMove);svg.addEventListener('pointerup',pointerUp);svg.addEventListener('pointercancel',pointerUp);svg.addEventListener('lostpointercapture',pointerUp);svg.addEventListener('wheel',onWheel,{passive:false});svg.addEventListener('dblclick',e=>{if(['polygon','polyline'].includes(tool)){e.preventDefault();finishDraft();}});
 window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected();}else if(e.key==='Escape'){draftStart=null;draftPoints=[];selectTool('select');}else if(e.key==='Enter'&&['polygon','polyline'].includes(tool)){finishDraft();}});
 $('undo').onclick=undo;$('redo').onclick=redo;$('delete').onclick=deleteSelected;
 $('command-form').onsubmit=e=>{e.preventDefault();const input=$('command');const value=input.value;const success=update(()=>{selected=command(doc,value).id;});if(success){input.value='';selectTool('select');}};
 $('new').onclick=()=>{if(!window.confirm('Start a new illustration? Save the current project first if needed.'))return;update(()=>{doc=newDoc();selected=null;view={cx:0,cy:0,scale:48};});};
 $('open').onclick=()=>$('open-file').click();$('open-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>12e6)throw Error('Project JSON exceeds 12 MB safety limit.');const imported=validateDoc(JSON.parse(await file.text()));update(()=>{doc=imported;selected=null;});notice('Project opened.');}catch(err){notice('Open failed: '+err.message);}finally{e.target.value='';}};
 $('save').onclick=()=>download(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),'mathillustrator.json');
 $('export-open').onclick=()=>{setupExport();$('export-menu').hidden=!$('export-menu').hidden;};$('export-close').onclick=()=>$('export-menu').hidden=true;
 $('help').onclick=()=>window.open('tutorial.html','_blank','noopener');$('show-hidden').onchange=renderList;
 $('zoom-out').onclick=()=>{view.scale=Math.max(5,view.scale/1.3);render();};$('zoom-in').onclick=()=>{view.scale=Math.min(1000,view.scale*1.3);render();};$('zoom-reset').onclick=()=>{view={cx:0,cy:0,scale:48};render();};$('fit').onclick=fit;
 $('left-collapse').onclick=()=>{document.body.classList.toggle('left-collapsed');$('left-collapse').textContent=document.body.classList.contains('left-collapsed')?'›':'‹';};
 $('right-collapse').onclick=()=>{document.body.classList.toggle('right-collapsed');$('right-collapse').textContent=document.body.classList.contains('right-collapsed')?'‹':'›';};
 const resize=new ResizeObserver(()=>{const b=svg.getBoundingClientRect();size={w:Math.max(1,Math.round(b.width)),h:Math.max(1,Math.round(b.height))};scheduleRender();});resize.observe(svg);renderAll();
}
initialise();
