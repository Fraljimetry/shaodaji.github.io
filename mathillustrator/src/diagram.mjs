/** Restricted, deterministic tikz-cd interchange. Never evaluates TeX. */
import {newDoc, append, PRESETS} from './model.mjs?cut=round147';
const CELL_X=3.5,CELL_Y=2.4;
function fail(msg){throw Error('tikz-cd: '+msg);}
function splitTopLevel(input,separator){
 const out=[];let buf='',depth=0,quote=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'&&(i===0||input[i-1]!=='\\'))quote=!quote;
  if(!quote){if(c==='{')depth++;if(c==='}')depth--;if(depth<0)fail('unbalanced braces.');}
  // An escaped \& is TeX label text, not a cell separator. Only an odd
  // number of immediately preceding backslashes escapes an ampersand.
  let escapedAmpersand=false;
  if(separator==='&'&&c==='&'){
   let slashes=0;for(let k=i-1;k>=0&&input[k]==='\\';k--)slashes++;
   escapedAmpersand=slashes%2===1;
  }
  if(!quote&&depth===0&&!escapedAmpersand&&input.startsWith(separator,i)){out.push(buf.trim());buf='';i+=separator.length-1;}else buf+=c;
 }
 if(depth!==0||quote)fail('unbalanced label or braces.');out.push(buf.trim());return out;
}
const TIKZ_HEADS={none:'no head',end:null,start:'leftarrow',both:'leftrightarrow','double-end':'two heads',hook:'hook',tail:'tail',harpoon:'harpoon'};
const TIKZ_LINES={solid:null,dashed:'dashed',dotted:'dotted',double:'equal',wavy:'squiggly'};
const HEAD_FROM_TIKZ=Object.fromEntries(Object.entries(TIKZ_HEADS).filter(([,v])=>v).map(([k,v])=>[v,k]));
const LINE_FROM_TIKZ=Object.fromEntries(Object.entries(TIKZ_LINES).filter(([,v])=>v).map(([k,v])=>[v,k]));
const DOUBLE_ARROW_TIKZ={none:'equal',end:'Rightarrow',start:'Leftarrow',both:'Leftrightarrow'};
const DOUBLE_ARROW_FROM_TIKZ={equal:'none',Rightarrow:'end',Leftarrow:'start',Leftrightarrow:'both'};
function morphismAppearance(edge){
 const old=edge.arrowStyle||'solid';
 const line=edge.morphismLine||({dashed:'dashed',dotted:'dotted','hook-dashed':'dashed'}[old]||'solid');
 const storedHeads=edge.morphismHeads||({hook:'hook','hook-dashed':'hook',twohead:'both',tail:'tail'}[old]||'end');
 return {heads:['double','wavy'].includes(line)&&!['none','end','start','both'].includes(storedHeads)?'none':storedHeads,line};
}
function parseArrow(raw){
 const args=splitTopLevel(raw,',');let direction=null,label='',swap=false,foundLabel=false,heads='end',line='solid',bend=0,sawHead=false,sawLine=false,sawBend=false;
 for(const part of args){const p=part.trim();if(/^[rlud]{1,24}$/.test(p)){if(direction)fail('multiple directions.');direction=p;}
  else{const match=p.match(/^"([\s\S]*)"(')?$/);if(match){
    if(foundLabel)fail('multiple labels on one arrow are unsupported.');
    if(match[1].length>1000)fail('arrow label exceeds 1000 characters.');
    label=match[1];swap=!!match[2];foundLabel=true;
   }else if(/^bend (?:left|right)(?:=\d+(?:\.\d+)?)?$/.test(p)){
    if(sawBend)fail('multiple bend options.');sawBend=true;
    const m=p.match(/^bend (left|right)(?:=(\d+(?:\.\d+)?))?$/);
    const degrees=m[2]===undefined?30:Number(m[2]);
    if(!(degrees>0&&degrees<=75))fail('bend angle must be in (0, 75] degrees.');
    // Canvas bend uses screen coordinates (y down); tikz-cd uses y up.
    bend=(m[1]==='right'?1:-1)*degrees/15;
   }else if(Object.hasOwn(DOUBLE_ARROW_FROM_TIKZ,p)){
    if(sawLine||sawHead)fail('duplicate double-arrow style.');
    line='double';heads=DOUBLE_ARROW_FROM_TIKZ[p];sawLine=true;
   }else if(p==='double'){
    if(sawLine)fail('multiple line-style options.');line='double';sawLine=true;
   }else if(Object.hasOwn(HEAD_FROM_TIKZ,p)){
    if(sawHead)fail('multiple arrowhead options.'); heads=HEAD_FROM_TIKZ[p];sawHead=true;
   }else if(Object.hasOwn(LINE_FROM_TIKZ,p)){
    if(sawLine)fail('multiple line-style options.');line=LINE_FROM_TIKZ[p];sawLine=true;
   }else if(p)fail('unsupported arrow option: '+p.slice(0,45));}}
 if(!direction)fail('arrow needs a direction.');
 const dx=[...direction].reduce((s,ch)=>s+(ch==='r'?1:ch==='l'?-1:0),0);
 const dy=[...direction].reduce((s,ch)=>s+(ch==='d'?1:ch==='u'?-1:0),0);
 if(dx===0&&dy===0)fail('zero-length arrow is not supported.');
 return {dx,dy,label,swap,heads,line,bend};
}
export function importTikzCd(source){
 if(typeof source!=='string'||source.length>100000)fail('input exceeds 100 KB limit.');
 const trimmed=source.trim();const match=trimmed.match(/^\\begin\{tikzcd\}\s*([\s\S]*?)\s*\\end\{tikzcd\}$/);
 if(!match)fail('expected a single \\begin{tikzcd} ... \\end{tikzcd} environment.');
 // Row breaks are exactly two backslashes. \\arrow and other commands remain single backslashes.
 const rows=splitTopLevel(match[1],'\\\\').map(row=>splitTopLevel(row,'&'));
 if(rows.length>40||rows.some(row=>row.length>40))fail('maximum supported grid is 40 by 40.');
 const parsed=[],arrows=[];
 for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++){
  let cell=rows[r][c],arrowMatch;
  const re=/\\arrow\[([^\]\[]*)\]/g;
  while((arrowMatch=re.exec(cell))!==null){arrows.push({r,c,...parseArrow(arrowMatch[1])});}
  cell=cell.replace(re,'').trim();
  if(/\\(?:arrow|ar)(?![a-zA-Z])/.test(cell)||cell.includes('\\begin')||cell.includes('\\end'))fail('unsupported command or arrow syntax.');
  if(cell.length>1000||[...cell].some((ch,i)=>{
   if(ch!=='&')return false;
   let slashes=0;for(let k=i-1;k>=0&&cell[k]==='\\';k--)slashes++;
   return slashes%2===0;
  }))fail('invalid node label.');
  if(cell)parsed.push({r,c,label:cell});
 }
 if(!parsed.length)fail('no labeled nodes.');
 const doc=newDoc();Object.assign(doc.settings,PRESETS['Commutative diagrams']);doc.meta.title='Imported commutative diagram';
 const lookup=new Map();for(const n of parsed){const obj=append(doc,{type:'node',xy:[n.c*CELL_X,-n.r*CELL_Y],text:n.label,fontSize:17,textMode:'latex'});lookup.set(`${n.r}:${n.c}`,obj.id);}
 for(const a of arrows){const from=lookup.get(`${a.r}:${a.c}`),to=lookup.get(`${a.r+a.dy}:${a.c+a.dx}`);if(!from||!to)fail('arrow points to an empty cell.');append(doc,{type:'morphism',refs:[from,to],text:a.label,bend:a.bend,swap:a.swap,textMode:'latex',morphismHeads:a.heads,morphismLine:a.line});}
 return doc;
}
/** Semantic only; mathematical content and directed incidences are retained, but styling is not. */
export function exportTikzCd(doc){
 const visible=doc.objects.filter(o=>!o.hidden);
 if(!visible.length||visible.some(o=>o.type!=='node'&&o.type!=='morphism'))fail('scene must contain only visible diagram nodes and morphisms.');
 const nodes=visible.filter(o=>o.type==='node'),edges=visible.filter(o=>o.type==='morphism');
 if(!nodes.length||nodes.length>1600)fail('diagram requires 1–1600 nodes.');
 if(nodes.some(o=>!o.text||/"|\r|\n/.test(o.text)))fail('nodes require nonempty labels without double quotes or line breaks.');
 for(const edge of edges){const {heads,line}=morphismAppearance(edge);
  if(!Object.hasOwn(TIKZ_HEADS,heads)||!Object.hasOwn(TIKZ_LINES,line))fail('unsupported morphism style.');
  if(!Number.isFinite(edge.bend||0)||Math.abs(edge.bend||0)>5)fail('bend outside supported range.');
 }
 if(edges.some(o=>/"|\r|\n/.test(o.text)))fail('quoted morphism labels are not representable.');
 const coordinateIndex=(values,reverse=false)=>{
  const sorted=[...values].sort((a,b)=>reverse?b-a:a-b),groups=[];
  for(const n of sorted){const current=groups.at(-1);if(current&&Math.abs(n-current[0])<0.12)current.push(n);else groups.push([n]);}
  if(groups.length>40)fail('maximum diagram grid size is 40 by 40.');
  return val=>{const i=groups.findIndex(group=>Math.abs(val-group[0])<0.12);if(i<0)fail('node positions are not grid-aligned.');return i;};
 };
 const colIndex=coordinateIndex(nodes.map(o=>o.xy[0])),rowIndex=coordinateIndex(nodes.map(o=>o.xy[1]),true);
 const cells=new Map(),nodePosition=new Map();let maxRow=0,maxCol=0;
 for(const node of nodes){const r=rowIndex(node.xy[1]),c=colIndex(node.xy[0]),key=`${r}:${c}`;if(cells.has(key))fail('more than one node occupies the same grid cell.');cells.set(key,node);nodePosition.set(node.id,{r,c});maxRow=Math.max(maxRow,r);maxCol=Math.max(maxCol,c);}
 if(maxRow*maxCol>1600)fail('diagram grid is too large.');
 const arrows=new Map();for(const edge of edges){const a=nodePosition.get(edge.refs[0]),b=nodePosition.get(edge.refs[1]);if(!a||!b)fail('morphism endpoint is hidden.');
  const direction='r'.repeat(Math.max(0,b.c-a.c))+'l'.repeat(Math.max(0,a.c-b.c))+'d'.repeat(Math.max(0,b.r-a.r))+'u'.repeat(Math.max(0,a.r-b.r));
  if(!direction||direction.length>24)fail('unsupported arrow direction.');
  const label=edge.text?`, "${edge.text}"${edge.swap?"'":''}`:'';
  const {heads,line}=morphismAppearance(edge);
  const headOption=line==='double'?null:TIKZ_HEADS[heads],lineOption=line==='double'?DOUBLE_ARROW_TIKZ[heads]:TIKZ_LINES[line];
  const bendOption=Math.abs(edge.bend||0)>1e-8?`bend ${edge.bend>0?'right':'left'}=${(Math.abs(edge.bend)*15).toFixed(8)}`:null;
  const styleOptions=(line==='double'?[lineOption,headOption,bendOption]:[headOption,lineOption,bendOption]).filter(Boolean).map(x=>`, ${x}`).join('');
  const key=`${a.r}:${a.c}`;arrows.set(key,[...(arrows.get(key)||[]),`\\arrow[${direction}${styleOptions}${label}]`]);
 }
 const lines=[];for(let r=0;r<=maxRow;r++){const cols=[];for(let c=0;c<=maxCol;c++){const key=`${r}:${c}`,node=cells.get(key);cols.push([node?.text||'',...(arrows.get(key)||[])].join(' ').trim());}lines.push('  '+cols.join(' & '));}
 const result=['\\begin{tikzcd}',lines.join(' ' + String.raw`\\` + '\n'),'\\end{tikzcd}'].join('\n');
 // No best-effort TeX interpretation: a source label containing unescaped &,
 // embedded \arrow commands or row breaks could otherwise invent/delete nodes.
 // Import exactly what we intend to export and compare the semantic graph.
 let recovered;
 try{recovered=importTikzCd(result);}catch(e){fail('export is not round-trip safe: '+e.message);}
 const recoveredNodes=new Map(),recoveredIds=new Map();
 for(const obj of recovered.objects){if(obj.type!=='node')continue;
  const r=Math.round(-obj.xy[1]/CELL_Y),c=Math.round(obj.xy[0]/CELL_X),key=`${r}:${c}`;
  recoveredNodes.set(key,obj.text);recoveredIds.set(obj.id,key);
 }
 if(recoveredNodes.size!==nodes.length)fail('node label is not round-trip safe.');
 for(const [key,node] of cells)if(recoveredNodes.get(key)!==node.text)fail('node label is not round-trip safe.');
 const keyFor=(edge,positions)=>{const {heads,line}=morphismAppearance(edge);return JSON.stringify([positions.get(edge.refs[0]),positions.get(edge.refs[1]),edge.text,!!edge.swap,heads,line,Math.round((edge.bend||0)*1e7)]);};
 const expectedIds=new Map([...nodePosition].map(([id,{r,c}])=>[id,`${r}:${c}`]));
 const expected=edges.map(edge=>keyFor(edge,expectedIds)).sort();
 const received=recovered.objects.filter(o=>o.type==='morphism').map(o=>keyFor(o,recoveredIds)).sort();
 if(expected.length!==received.length||expected.some((x,i)=>x!==received[i]))fail('arrow label or direction is not round-trip safe.');
 return result;
}
export function canExportTikzCd(doc){try{exportTikzCd(doc);return true;}catch{return false;}}
