/** Conservative, context-aware completions shared by Algebra, 2D and 3D plot inputs.
 * Suggestions only insert text; authoritative application parsers validate on Enter.
 */
const FUNCTIONS = ['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','sqrt','cbrt','abs','exp','ln','log','log10','log2','min','max','pow','hypot','floor','ceil','round','trunc','sign','clamp','mod','rad','deg'];
const CONSTRUCTORS = ['Slider','Segment','Vector','Arrow','Line','Ray','Midpoint','PerpBisector','Circle','CircleThrough3','Ellipse','Rectangle','Parallelogram','Triangle','Quadrilateral','Polygon','Polyline','Bezier','Spline','ClosedSpline','Angle','AngleBisector','CircularArc','Hyperbola','Parallel','Perpendicular','Foot','Intersect','RegularPolygon','Rotate','Dilate','FixedLength','FixedAngle','Node','Morphism'];
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
export function completionCandidates(input,{kind='algebra',dimension='2d',mode='function',symbols=[],caret=String(input??'').length}={}){
 const text=String(input??'');
 const pos=Math.max(0,Math.min(text.length,Number.isInteger(caret)?caret:text.length));
 const prefix=text.slice(0,pos);
 const tail=prefix.match(/[A-Za-z][A-Za-z0-9_]*$/)?.[0]||'';
 const isAlgebra=kind==='algebra';
 const names=isAlgebra?[...symbols.slice(0,300),...CONSTRUCTORS,...FUNCTIONS,...CONSTANTS]:[...FUNCTIONS,...CONSTANTS];
 const options=[];
 if(tail.length>=1){
  for(const name of new Set(names)){
   if(name.toLowerCase().startsWith(tail.toLowerCase())){
    const isFunction=FUNCTIONS.includes(name)||CONSTRUCTORS.includes(name);
    // Avoid duplicating an existing call's opening parenthesis.
    const next=text.slice(pos).match(/^[A-Za-z0-9_]*/)?.[0]||'';
    const alreadyOpen=text[pos+next.length]==='(';
    options.push({label:isFunction?name+'(…)':name,insert:isFunction&&!alreadyOpen?name+'()':name,cursor:isFunction&&!alreadyOpen?-1:0,replace:tail.length,replaceAfter:next.length,kind:isFunction?'function':'symbol'});
   }
  }
  return options.slice(0,8);
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
 const close=key==='('?')':']';
 return {text:text.slice(0,start)+key+close+text.slice(end),cursor:start+1};
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
 Node:['x','y','label?'],Morphism:['node A','node B','label?'],
 Intersect:['line A','line B'],Foot:['point','line'],Parallel:['point','line'],Perpendicular:['point','line'],
 sin:['x'],cos:['x'],tan:['x'],asin:['x'],acos:['x'],atan:['x'],
 sinh:['x'],cosh:['x'],tanh:['x'],sqrt:['x'],cbrt:['x'],abs:['x'],exp:['x'],ln:['x'],log:['x'],log10:['x'],log2:['x'],
 floor:['x'],ceil:['x'],round:['x'],trunc:['x'],sign:['x'],rad:['degrees'],deg:['radians'],
 atan2:['y','x'],pow:['base','exponent'],min:['x','y','…'],max:['x','y','…'],
 clamp:['value','minimum','maximum'],mod:['value','divisor'],hypot:['x','y','…']
});
export function argumentContext(input,caret=String(input??'').length){
 const text=String(input??'');const stack=[];
 const pos=Math.max(0,Math.min(text.length,Number.isInteger(caret)?caret:text.length));
 for(let i=0;i<pos;i++){
  const ch=text[i];
  if(ch==='('){const name=text.slice(0,i).match(/([A-Za-z][A-Za-z0-9_]*)\s*$/)?.[1]||'';stack.push({name,index:0,at:i});}
  else if(ch===')'){if(stack.length)stack.pop();}
  else if(ch===','&&stack.length)stack[stack.length-1].index++;
 }
 const active=[...stack].reverse().find(x=>SIGNATURES[x.name]);
 return active?{name:active.name,index:active.index,args:SIGNATURES[active.name]}:null;
}
/** Only diagnose lexical errors that are certain at edit time; incomplete formulas
 * are intentionally allowed until the real parser validates submission.
 */
export function expressionDiagnostics(input){
 const text=String(input??'');const stack=[];
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='('||ch==='[')stack.push(ch);
  if(ch===')'||ch===']'){
   const last=stack.pop();if(last!==(ch===')'?'(': '['))return {severity:'error',message:'Mismatched closing bracket',position:i};
  }
 }
 if(stack.length)return {severity:'hint',message:'Complete the closing bracket'};
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
 function close(){shell.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
 function show({force=false}={}){
  if(composing||input.disabled||input.hidden||!input.isConnected){close();assist.hidden=true;return;}
  const caret=input.selectionStart??input.value.length;
  const argument=argumentContext(input.value,caret);const diagnostic=expressionDiagnostics(input.value);
  assist.hidden=!(argument||diagnostic);
  if(diagnostic?.severity==='error'){assist.textContent=diagnostic.message;assist.dataset.severity='error';}
  else if(argument){assist.textContent=`${argument.name}(${argument.args.map((arg,i)=>i===Math.min(argument.index,argument.args.length-1)?'['+arg+']':arg).join(', ')})`;assist.dataset.severity='hint';}
  else if(diagnostic){assist.textContent=diagnostic.message;assist.dataset.severity=diagnostic.severity;}
  suggestions=completionCandidates(input.value,{...context(),caret});index=0;
  shell.replaceChildren();
  if(!suggestions.length){close();return;}
  suggestions.forEach((item,i)=>{
   const option=document.createElement('button');option.type='button';option.className='input-assist-option';option.setAttribute('role','option');option.id=`${shell.id}-${i}`;
   option.textContent=item.label;option.title=item.label;option.dataset.selected=String(i===index);
   option.addEventListener('pointerdown',e=>e.preventDefault());option.addEventListener('click',()=>accept(i));shell.append(option);
  });
  shell.style.left=`${input.offsetLeft}px`;shell.style.width=`${input.offsetWidth}px`;
  shell.hidden=false;input.setAttribute('aria-expanded','true');input.setAttribute('aria-activedescendant',`${shell.id}-${index}`);
 }
 function select(i){index=(i+suggestions.length)%suggestions.length;shell.querySelectorAll('button').forEach((el,n)=>el.dataset.selected=String(n===index));input.setAttribute('aria-activedescendant',`${shell.id}-${index}`);}
 function accept(i){const item=suggestions[i];if(!item)return;const applied=applyCompletion(input.value,input.selectionStart,input.selectionEnd,item);input.value=applied.text;input.setSelectionRange(applied.cursor,applied.cursor);input.dispatchEvent(new Event('input',{bubbles:true}));close();input.focus();}
 input.addEventListener('focus',show);
 input.addEventListener('input',show);
 input.addEventListener('click',()=>{if(document.activeElement===input)show();});
 input.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)&&document.activeElement===input)show();});
 input.addEventListener('keydown',e=>{
  if(composing||e.isComposing||e.key==='Process'||e.keyCode===229)return;
  if(e.key==='Escape'&&!shell.hidden){e.preventDefault();close();return;}
  if((e.ctrlKey||e.metaKey)&&e.code==='Space'){e.preventDefault();show({force:true});return;}
  if(!shell.hidden&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();select(index+(e.key==='ArrowDown'?1:-1));return;}
  if(!shell.hidden&&e.key==='Tab'&&!e.shiftKey){e.preventDefault();accept(index);return;}
  // Enter remains the form-submit key; suggestions never hijack submission.
  if((e.key==='('||e.key==='[')&&!e.ctrlKey&&!e.altKey&&!e.metaKey){const pair=autoPair(input.value,input.selectionStart,input.selectionEnd,e.key);if(pair){e.preventDefault();input.value=pair.text;input.setSelectionRange(pair.cursor,pair.cursor);input.dispatchEvent(new Event('input',{bubbles:true}));}}
  if((e.key===')'||e.key===']')&&input.selectionStart===input.selectionEnd&&input.value[input.selectionStart]===e.key){e.preventDefault();const next=input.selectionStart+1;input.setSelectionRange(next,next);show();}
  if(e.key==='Backspace'&&input.selectionStart===input.selectionEnd&&input.selectionStart>0){
   const at=input.selectionStart,s=input.value;
   if((s[at-1]==='('&&s[at]===')')||(s[at-1]==='['&&s[at]===']')){
    e.preventDefault();input.value=s.slice(0,at-1)+s.slice(at+1);input.setSelectionRange(at-1,at-1);input.dispatchEvent(new Event('input',{bubbles:true}));
   }
  }
 });
 input.addEventListener('blur',()=>{close();assist.hidden=true;});
 input.addEventListener('compositionstart',()=>{composing=true;close();assist.hidden=true;});
 input.addEventListener('compositionend',()=>{composing=false;show();});
 return {close,refresh:show};
}
