/** Conservative, context-aware completions shared by Algebra, 2D and 3D plot inputs.
 * Suggestions only insert text; authoritative application parsers validate on Enter.
 */
// Keep the assistant's vocabulary aligned with the actual algebra and plot parsers.
const ALGEBRA_FUNCTIONS = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','asinh','acosh','atanh','sqrt','cbrt','abs','exp','ln','log','log10','log2','min','max','pow','hypot','floor','ceil','round','trunc','sign','clamp','mod','rad','deg'];
const PLOT_REAL_FUNCTIONS = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','asinh','acosh','atanh','sec','csc','cot','sqrt','cbrt','abs','exp','expm1','log1p','ln','log','log10','log2','min','max','pow','hypot','floor','ceil','round','trunc','sign','clamp','mod'];
const PLOT_COMPLEX_FUNCTIONS = ['sin','cos','tan','asin','acos','atan','sinh','cosh','tanh','asinh','acosh','atanh','sec','csc','cot','sqrt','cbrt','abs','exp','expm1','log1p','ln','log','log10','log2','sign','pow','conj','arg','re','im','norm'];
const COMPLEX_MODES = new Set(['domainColoring','domain3d']);
const MODE_VARIABLES = Object.freeze({function:['x'],parametric:['t'],implicit:['x','y'],vectorField:['x','y'],domainColoring:['z','i'],surface3d:['x','y'],parametric3d:['u','v'],implicit3d:['x','y','z'],vector3d:['x','y','z'],domain3d:['z','i']});
const CONSTRUCTORS = ['Slider','Segment','Vector','Arrow','Line','Ray','Midpoint','PerpBisector','Circle','CircleThrough3','Ellipse','Rectangle','Parallelogram','Triangle','Quadrilateral','Polygon','Polyline','Bezier','Spline','ClosedSpline','Angle','AngleBisector','CircularArc','Hyperbola','Parallel','Perpendicular','Foot','Intersect','RegularPolygon','Rotate','Dilate','FixedLength','FixedAngle','Point','Text','Node','Morphism','CircleDiameter','PointOnObject','TangentCircle','Parabola','GeneralIntersection','Locus','TriangleCenter','CircleIntersection','CircleCircleIntersection','Reflect','Translate','Invert','Transform'];
const CONSTANTS = ['pi','e','phi'];
const PLOT_TEMPLATES = Object.freeze({
 '2d:function':['sin(x)','cos(x)','x^2','sqrt(abs(x))'],
 '2d:parametric':['cos(t)','sin(t)','2*cos(t)','2*sin(t)'],
 '2d:implicit':['x^2+y^2=1','sin(x)*cos(y)=0'],
 '2d:vectorField':['-y','x','sin(x)','cos(y)'],
 '2d:domainColoring':['z^2+1','exp(z)'],
 '3d:surface3d':['sin(x)*cos(y)','x^2+y^2'],
 '3d:parametric3d':['cos(u)*sin(v)','sin(u)*sin(v)','cos(v)'],
 '3d:implicit3d':['x^2+y^2+z^2=4','cos(x)+cos(y)+cos(z)=1'],
 '3d:vector3d':['-y','x','z'],
 '3d:domain3d':['z^2+1','exp(z)'],
});
const ALGBRA_EXAMPLES=['a = Slider(0, 10, 0.1, 2)','A = (0, 0)','B = (a*cos(pi/3), a*sin(pi/3))','s = Segment(A, B)','c = Circle(A, B)'];
/** Build suggestions from the token at the caret, not from the end of the field.
 * This matters when editing a formula in place or typing before a closing parenthesis.
 */
export function completionCandidates(input,{kind='algebra',dimension='2d',mode='function',symbols=[],caret=String(input??'').length,force=false}={}){
 const text=String(input??'');
 const pos=Math.max(0,Math.min(text.length,Number.isInteger(caret)?caret:text.length));
 const prefix=text.slice(0,pos);
 // A named node label is string data, never a numeric expression.
 if(delimiterScan(text,pos).quote)return [];
 const tail=prefix.match(/[A-Za-z][A-Za-z0-9_]*$/)?.[0]||'';
 const isAlgebra=kind==='algebra';
 const functions=isAlgebra?ALGEBRA_FUNCTIONS:COMPLEX_MODES.has(mode)?PLOT_COMPLEX_FUNCTIONS:PLOT_REAL_FUNCTIONS;
 const names=isAlgebra?[...symbols.slice(0,300),...CONSTRUCTORS,...functions,...CONSTANTS]:[...symbols.slice(0,300),...functions,...CONSTANTS,...(MODE_VARIABLES[mode]||[])];
 const options=[];
 if(tail.length>=1){
  for(const name of new Set(names)){
   if(name.toLowerCase().startsWith(tail.toLowerCase())){
    const isFunction=functions.includes(name)||(isAlgebra&&CONSTRUCTORS.includes(name));
    // Avoid duplicating an existing call's opening parenthesis.
    const next=text.slice(pos).match(/^[A-Za-z0-9_]*/)?.[0]||'';
    const alreadyOpen=text[pos+next.length]==='(';
    options.push({label:isFunction?name+'(…)':name,insert:isFunction&&!alreadyOpen?name+'()':name,cursor:isFunction&&!alreadyOpen?-1:0,replace:tail.length,replaceAfter:next.length,kind:isFunction?'function':'symbol'});
   }
  }
  return options.slice(0,8);
 }
 if(text.trim() && force){
  // Explicit Ctrl+Space after operators may request a new call with no token.
  return functions.slice(0,8).map(name=>({label:name+'(…)',insert:name+'()',cursor:-1,replace:0,replaceAfter:0,kind:'function'}));
 }
 if(text.trim())return [];
 const samples=isAlgebra?ALGBRA_EXAMPLES:PLOT_TEMPLATES[`${dimension}:${mode}`]||[];
 return samples.map(s=>({label:s,insert:s,replace:0,cursor:0,kind:'example'}));
}
export function applyCompletion(text,start,end,candidate){
 const original=String(text);
 const at=Math.max(0,Math.min(original.length,start));
 const from=Math.max(0,at-(candidate.replace||0));
 const to=Math.max(at,Math.min(original.length,end+(candidate.replaceAfter||0)));
 const result=original.slice(0,from)+candidate.insert+original.slice(to);
 return {text:result,cursor:from+candidate.insert.length+(candidate.cursor||0)};
}
export function autoPair(text,start,end,key){
 if(key!=='('&&key!=='[')return null;
 if(start!==end)return null;
 // Parentheses and brackets in quoted labels are literal text. The same
 // lexical scanner already protects completion suggestions in this context.
 if(delimiterScan(text,start).quote)return null;
 const close=key==='('?')':']';
 return {text:text.slice(0,start)+key+close+text.slice(end),cursor:start+1};
}

/** Only consume an existing closing bracket when it is expression syntax.
 * A bracket inside a quoted label belongs to its literal text.
 */
export function skipClosingBracket(text,caret,key){
 if(key!==')'&&key!==']')return false;
 if(!Number.isInteger(caret)||caret<0||caret>text.length||text[caret]!==key)return false;
 return !delimiterScan(text,caret).quote;
}
/** Delete a generated adjacent delimiter pair, never literal label text. */
export function deleteBracketPair(text,caret){
 if(!Number.isInteger(caret)||caret<=0||caret>=text.length||delimiterScan(text,caret).quote)return null;
 const a=text[caret-1],b=text[caret];
 if(!((a==='('&&b===')')||(a==='['&&b===']')))return null;
 return {text:text.slice(0,caret-1)+text.slice(caret+1),cursor:caret-1};
}

/** Lexically inspect the active call, ignoring commas in nested expressions.
 * This is editing assistance, not a replacement for the authoritative parser.
 */
const SIGNATURES=Object.freeze({
 Slider:['minimum','maximum','step?','value?','speed?','mode?'],
 Segment:['point A','point B'],Vector:['point A','point B'],Arrow:['point A','point B'],
 Line:['point A','point B'],Ray:['point A','point B'],Midpoint:['point A','point B'],
 Circle:['center','point on circle'],
 CircleThrough3:['point A','point B','point C'],Ellipse:['focus A','focus B','point on ellipse'],
 Rectangle:['point A','point B','point C'],Parallelogram:['point A','point B','point C'],
 Triangle:['point A','point B','point C'],Quadrilateral:['point A','point B','point C','point D'],Polygon:['point A','point B','point C','…'],
 Polyline:['point A','point B','…'],Bezier:['control A','control B','control C','control D'],
 Spline:['point A','point B','point C','…'],ClosedSpline:['point A','point B','point C','…'],
 Angle:['point A','vertex','point C'],AngleBisector:['point A','vertex','point C'],
 CircularArc:['point A','point B','point C'],Hyperbola:['focus A','focus B','point on hyperbola'],
 PerpBisector:['point A','point B'],
 RegularPolygon:['center','vertex','side count'],
 Rotate:['point','center','angle (radians)'],Dilate:['point','center','factor'],
 FixedLength:['point A','point B','length'],FixedAngle:['point A','point B','angle (radians)'],
 Point:['x','y'],Text:['x','y','quoted text'],Node:['x','y','label?'],Morphism:['node A','node B','quoted label'],
 CircleDiameter:['endpoint A','endpoint B'],PointOnObject:['geometry','parameter?'],TangentCircle:['point','circle','branch?'],
 Parabola:['focus','directrix'],GeneralIntersection:['curve A','curve B','rootIndex?'],Locus:['dependent point','constrained driver'],
 TriangleCenter:['point A','point B','point C','centerKind?'],CircleIntersection:['line','circle','branch?'],
 CircleCircleIntersection:['circle A','circle B','branch?'],Reflect:['source','mirror line'],
 Translate:['source','point A','point B'],Invert:['source','circle'],Transform:['source','reference','transform?','amount?'],
 Intersect:['line A','line B'],Foot:['point','line'],Parallel:['point','line'],Perpendicular:['point','line'],
 sin:['x'],cos:['x'],tan:['x'],asin:['x'],acos:['x'],atan:['x'],asinh:['x'],acosh:['x'],atanh:['x'],sec:['x'],csc:['x'],cot:['x'],conj:['z'],arg:['z'],re:['z'],im:['z'],norm:['z'],expm1:['x'],log1p:['x'],
 sinh:['x'],cosh:['x'],tanh:['x'],sqrt:['x'],cbrt:['x'],abs:['x'],exp:['x'],ln:['x'],log:['x'],log10:['x'],log2:['x'],
 floor:['x'],ceil:['x'],round:['x'],trunc:['x'],sign:['x'],rad:['degrees'],deg:['radians'],
 atan2:['y','x'],pow:['base','exponent'],min:['x','y','…'],max:['x','y','…'],
 clamp:['value','minimum','maximum'],mod:['value','divisor'],hypot:['x','y','…']
});
/** Scan delimiters and quoted labels without interpreting or evaluating expressions. */
function delimiterScan(input,caret){
 const text=String(input??'');const stack=[];let quote='',escaped=false,error=-1;
 const pos=Math.max(0,Math.min(text.length,Number.isInteger(caret)?caret:text.length));
 for(let i=0;i<pos;i++){
  const ch=text[i];
  if(quote){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===quote)quote='';continue;}
  if(ch==='"'||ch==="'"){quote=ch;continue;}
  if(ch==='('||ch==='['){
   const name=ch==='('?text.slice(0,i).match(/([A-Za-z][A-Za-z0-9_]*)\s*$/)?.[1]||'':'';
   stack.push({ch,name,index:0});
  }else if(ch===')'||ch===']'){
   if(!stack.length||stack[stack.length-1].ch!==(ch===')'?'(': '[')){error=i;break;}
   stack.pop();
  }else if(ch===','&&stack.length&&stack[stack.length-1].ch==='(')stack[stack.length-1].index++;
 }
 return {stack,error,quote};
}
export function argumentContext(input,caret=String(input??'').length){
 const {stack,error,quote}=delimiterScan(input,caret);
 if(error!==-1||quote)return null;
 const active=[...stack].reverse().find(x=>x.ch==='('&&Object.hasOwn(SIGNATURES,x.name));
 return active?{name:active.name,index:active.index,args:SIGNATURES[active.name]}:null;
}
/** Only diagnose lexical errors that are certain at edit time; incomplete formulas
 * are intentionally allowed until the real parser validates submission.
 */
export function expressionDiagnostics(input){
 const {stack,error,quote}=delimiterScan(input,String(input??'').length);
 if(error!==-1)return {severity:'error',message:'Mismatched closing bracket',position:error};
 if(stack.length||quote)return {severity:'hint',message:quote?'Complete the closing quote':'Complete the closing bracket'};
 return null;
}

/** Each input gets its own accessible popup. It never submits an expression. */
export function attachInputAssistant(input,context){
 const shell=document.createElement('div');shell.className='input-assist-popup';shell.setAttribute('role','listbox');shell.hidden=true;
 shell.id=`${input.id || 'smart-input'}-suggestions`;input.setAttribute('aria-controls',shell.id);input.setAttribute('aria-expanded','false');input.setAttribute('aria-autocomplete','list');
 input.insertAdjacentElement('afterend',shell);
 const assist=document.createElement('div');assist.className='input-assist-status';assist.setAttribute('aria-live','polite');assist.hidden=true;
 shell.insertAdjacentElement('afterend',assist);
 let suggestions=[],index=0,composing=false;
 function place(){
  const fieldFont=getComputedStyle(input);
  shell.style.fontFamily=fieldFont.fontFamily;
  shell.style.fontSize=fieldFont.fontSize;
  shell.style.fontWeight=fieldFont.fontWeight;
  shell.style.lineHeight=fieldFont.lineHeight;
  shell.style.letterSpacing=fieldFont.letterSpacing;
  const parentWidth=input.parentElement.clientWidth;
  const width=Math.min(parentWidth,input.offsetWidth);
  const left=Math.max(0,Math.min(input.offsetLeft,parentWidth-width));
  shell.style.left=`${left}px`;shell.style.width=`${width}px`;
  assist.style.left=`${left}px`;assist.style.maxWidth=`${width}px`;
  if(!shell.hidden)assist.style.top=`${shell.offsetTop+shell.offsetHeight+4}px`;
 }
 function close(){shell.hidden=true;assist.style.top='';input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
 function show({force=false}={}){
  if(composing||input.disabled||input.hidden||!input.isConnected){close();assist.hidden=true;return;}
  const caret=input.selectionStart??input.value.length;
  const argument=argumentContext(input.value,caret);const diagnostic=expressionDiagnostics(input.value);
  assist.hidden=!(argument||diagnostic);
  if(diagnostic?.severity==='error'){assist.textContent=diagnostic.message;assist.dataset.severity='error';}
  else if(argument){assist.textContent=`${argument.name}(${argument.args.map((arg,i)=>i===Math.min(argument.index,argument.args.length-1)?'['+arg+']':arg).join(', ')})`;assist.dataset.severity='hint';}
  else if(diagnostic){assist.textContent=diagnostic.message;assist.dataset.severity=diagnostic.severity;}
  suggestions=completionCandidates(input.value,{...context(),caret,force});index=0;
  shell.replaceChildren();
  if(!suggestions.length){close();place();return;}
  suggestions.forEach((item,i)=>{
   const option=document.createElement('div');option.className='input-assist-option';option.setAttribute('role','option');option.id=`${shell.id}-${i}`;
   option.textContent=item.label;option.title=item.label;option.dataset.selected=String(i===index);
   option.addEventListener('pointerdown',e=>e.preventDefault());option.addEventListener('click',()=>accept(i));shell.append(option);
  });
  shell.hidden=false;
  place();
  input.setAttribute('aria-expanded','true');input.setAttribute('aria-activedescendant',`${shell.id}-${index}`);
 }
 function select(i){index=(i+suggestions.length)%suggestions.length;shell.querySelectorAll('[role=option]').forEach((el,n)=>el.dataset.selected=String(n===index));shell.children[index]?.scrollIntoView({block:'nearest'});input.setAttribute('aria-activedescendant',`${shell.id}-${index}`);}
 function accept(i){const item=suggestions[i];if(!item)return;const applied=applyCompletion(input.value,input.selectionStart,input.selectionEnd,item);input.value=applied.text;input.setSelectionRange(applied.cursor,applied.cursor);input.dispatchEvent(new Event('input',{bubbles:true}));close();input.focus();}
 // Do not cover nearby Objects rows merely by toggling Find/Algebra or
 // focusing an empty field. Examples remain available on typing and Ctrl+Space.
 input.addEventListener('focus',()=>{if(input.value.trim())show();});
 input.addEventListener('input',show);
 input.addEventListener('click',()=>{if(document.activeElement===input&&input.value.trim())show();});
 input.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)&&document.activeElement===input)show();});
 input.addEventListener('keydown',e=>{
  if(composing||e.isComposing||e.key==='Process'||e.keyCode===229)return;
  if(e.key==='Escape'&&!shell.hidden){e.preventDefault();close();return;}
  if((e.ctrlKey||e.metaKey)&&e.code==='Space'){e.preventDefault();show({force:true});return;}
  if(!shell.hidden&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();select(index+(e.key==='ArrowDown'?1:-1));return;}
  if(!shell.hidden&&e.key==='Tab'&&!e.shiftKey){e.preventDefault();accept(index);return;}
  // Enter belongs to the real expression form. Close overlays immediately,
  // including after a rejected expression, so rows below remain clickable.
  if(e.key==='Enter'){close();assist.hidden=true;return;}
  if((e.key==='('||e.key==='[')&&!e.ctrlKey&&!e.altKey&&!e.metaKey){const pair=autoPair(input.value,input.selectionStart,input.selectionEnd,e.key);if(pair){e.preventDefault();input.value=pair.text;input.setSelectionRange(pair.cursor,pair.cursor);input.dispatchEvent(new Event('input',{bubbles:true}));}}
  if(input.selectionStart===input.selectionEnd&&skipClosingBracket(input.value,input.selectionStart,e.key)){e.preventDefault();const next=input.selectionStart+1;input.setSelectionRange(next,next);show();}
  if(e.key==='Backspace'&&input.selectionStart===input.selectionEnd&&input.selectionStart>0){
   const at=input.selectionStart,s=input.value;
   const pair=deleteBracketPair(s,at);
   if(pair){
    e.preventDefault();input.value=pair.text;input.setSelectionRange(pair.cursor,pair.cursor);input.dispatchEvent(new Event('input',{bubbles:true}));
   }
  }
 });
 // The Objects splitter and responsive layout can change an open input width.
 // ResizeObserver realigns the menu/hint without reopening or shifting focus.
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{
  if(!shell.hidden||!assist.hidden)place();
 }).observe(input);
 input.addEventListener('blur',()=>{close();assist.hidden=true;});
 input.addEventListener('compositionstart',()=>{composing=true;close();assist.hidden=true;});
 input.addEventListener('compositionend',()=>{composing=false;show();});
 return {close,refresh:show};
}
