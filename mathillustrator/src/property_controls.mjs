import {MAX_OBJECT_NAME_LENGTH,xmlTextSafe} from './object_naming.mjs?cut=round303';
import {parseCurveExpression as r50ParseExpr} from './plot_modes.mjs?cut=round327';
import {compileRegionCondition} from './region_condition.mjs?cut=round327';
import {parse3DRangeExpression} from './plot3d.mjs?cut=round334';
import {localizeUI,translated} from './i18n.mjs?cut=round335';

export function rangeHint(opts={}){
 if(opts.hint)return opts.hint;
 const {min,max}=opts;
 if(min!==undefined&&max!==undefined)return `Range: ${min}–${max}`;
 if(min!==undefined)return `Minimum: ${min}`;
 if(max!==undefined)return `Maximum: ${max}`;
 return '';
}
// Numeric editors share the sandboxed plotting expression grammar; no eval.
// Persist only evaluated numbers so old JSON projects remain compatible.
export function numericExpression(raw,{min=-Infinity,max=Infinity,integer=false}={}){
 if(!String(raw).trim())throw Error('Numeric value is required.');
 const value=r50ParseExpr(String(raw),[])({});
 if(!Number.isFinite(value))throw Error('Numeric value must be finite.');
 if(value<min||value>max)throw Error(`Value must be within ${min}–${max}.`);
 if(integer&&!Number.isInteger(value))throw Error('A whole number is required.');
 return value;
}

// DOM controls depend on injected UI services, never on application document state.
export function createPropertyControls({document,language,notice,appendColorSwatches}){
function field(parent,label,value,type,onChange,opts={}){
 const wrap=document.createElement('label');wrap.className='field'+(type==='multiline'?' multiline-field':'');
 // Formula editors have their own inline layout; names and arbitrary text keep their existing layout.
 if(type==='text'&&parent.classList.contains('properties')&&(/^(?:Expression|.* expression|Transformation amount)$/i.test(label)||/^(?:f\(x\)|F\(x, y\)|F\(z\)|[rxy]\(t\)|[XY]\(x, y\)|f\(x, y\)|[xyz]\(u, v\)|F\(x, y, z\)|[XYZ]\(x, y, z\))$/.test(label)))wrap.classList.add('formula-expression-field');
 wrap.textContent=label;wrap.dataset.propertyLabel=label;
 const input=document.createElement(type==='multiline'?'textarea':'input');
 if(type!=='multiline')input.type=type==='number'?'text':type;else{input.rows=3;input.spellcheck=false;input.setAttribute('aria-label',label);}
 input.value=String(value??'');if(type==='number'){input.inputMode='decimal';input.dataset.numericExpression='true';}if(opts.step)input.step=opts.step;
 if(opts.min!==undefined)input.min=opts.min;
 if(opts.max!==undefined)input.max=opts.max;
 const hint=rangeHint(opts);if(hint){wrap.title=translated(hint,language());input.title=translated(hint,language());}
 let accepted=input.value;
 input.addEventListener('properties-synced',event=>{accepted=event.detail.value;});
 input.onchange=()=>{
  if(type==='number'&&!input.value.trim()){notice('Numeric value is required.');input.value=accepted;return;}
  const next=input.value;
  // A blur after an already committed change must not rebuild Properties or
  // detach the list-row/button receiving that same pointer gesture.
  if(next===accepted)return;
  let parsed=next;
  try{if(type==='number')parsed=numericExpression(next,{min:opts.min??-Infinity,max:opts.max??Infinity,integer:opts.step===1});}
  catch(error){notice(error.message);input.value=accepted;return;}
  if(onChange(parsed)===false)input.value=accepted;
  else{accepted=type==='number'?String(parsed):next;input.value=accepted;}
 };
 wrap.append(input);parent.append(wrap);return input;
}
// Bound editors accept the same strict arithmetic grammar as plot formulas.
// A centered region is defined by one positive half-width and never stored as
// an additional mutable setting: imported/exported files keep numeric bounds.
function installCenteredRegionEditor(container,inputs,commit,parseBound,conditionValue,conditionCommit,dimension){
 const row=document.createElement('div');row.className='region-extras';
 const label=document.createElement('label');label.className='field';label.dataset.propertyLabel='Centered half-range';label.textContent='Centered half-range';
 const radius=document.createElement('input');radius.type='text';radius.placeholder='4pi';radius.setAttribute('aria-label','Centered half-range');radius.title='Enter a positive half-range to set ±R along every axis.';
 const conditionLabel=document.createElement('label');conditionLabel.className='field';conditionLabel.dataset.propertyLabel='Region inequality';conditionLabel.textContent='Region inequality';
 const region=document.createElement('input');region.type='text';region.value=conditionValue||'';region.placeholder=dimension===3?'x^2+y^2+z^2<16':'x^2+y^2<16';
 region.setAttribute('aria-label','Region inequality');region.title='Strict condition, e.g. x^2+y^2<4. Press Enter to apply; empty means unrestricted.';
 function useRadius(){
  let value;try{value=parseBound(radius.value);}catch(err){notice(err.message);return;}
  if(!(value>0)){notice('Centered half-range must be positive.');return;}
  for(const axis of new Set(Object.keys(inputs).map(k=>k[0]))){inputs[axis+'Min'].value=String(-value);inputs[axis+'Max'].value=String(value);}
  commit();
 }
 radius.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();event.stopPropagation();useRadius();}});
 region.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();event.stopPropagation();
  try{compileRegionCondition(region.value,dimension);}catch(err){notice(err.message);return;}
  conditionCommit(region.value);
 }});
 label.append(radius);conditionLabel.append(region);row.append(label,conditionLabel);container.append(row);
}
function installPlotRegionKeys(container,inputs,commit,{parseBound=parse3DRangeExpression,conditionValue="",conditionCommit=()=>{},dimension=3}={}){
 const axes=[...new Set(Object.keys(inputs).map(k=>k[0]))];
 for(const input of Object.values(inputs)){
  const caption=input.closest('label');
  caption.title=translated('Double-click this label to fill symmetric ranges for all axes; Enter to redraw.',language());
  caption.addEventListener('dblclick',event=>{
   if(input.disabled||event.target!==caption)return;
   const raw=input.value.trim();let numeric;
   try{numeric=raw?parseBound(raw):NaN;}catch{numeric=NaN;}
   if(!Number.isFinite(numeric)){notice('Enter a finite bound first.');return;}
   const radius=Math.abs(numeric);
   if(!radius){notice('Symmetric range must have nonzero width.');return;}
   for(const axis of axes){inputs[axis+'Min'].value=String(-radius);inputs[axis+'Max'].value=String(radius);}
  });
  input.addEventListener('keydown',event=>{
   if(event.key!=='Enter'||event.isComposing)return;
   event.preventDefault();event.stopPropagation();commit();
  });
 }
 installCenteredRegionEditor(container,inputs,commit,parseBound,conditionValue,conditionCommit,dimension);
}
// Shared Properties controls; callers supply only scene-specific storage and limits.
function propertyChoice(root,label,choices,value,change,disabled=false){
 const row=document.createElement('label');row.className='field';row.dataset.propertyLabel=label;row.textContent=label;
 const select=document.createElement('select');select.setAttribute('aria-label',label);
 for(const [key,name] of choices){const option=document.createElement('option');option.value=key;option.textContent=name;select.append(option);}
 select.value=value;select.disabled=disabled;select.onchange=()=>{if(change(select.value)===false)select.value=value;};row.append(select);root.append(row);return select;
}
function propertyCheck(root,label,value,change){
 const row=document.createElement('label');row.className='check';row.dataset.propertyLabel=label;const input=document.createElement('input');input.type='checkbox';input.checked=!!value;input.setAttribute('aria-label',label);input.onchange=()=>{if(change(input.checked)===false)input.checked=!!value;};row.append(input,document.createTextNode(' '+label));root.append(row);return input;
}
function propertyName(root,object,objects,edit){
 return field(root,'Name',object.name,'text',v=>edit(live=>{const name=v.trim();if(!name||name.length>MAX_OBJECT_NAME_LENGTH||!xmlTextSafe(name)||objects().some(a=>a.id!==live.id&&a.name===name))throw Error('Object names must be unique and nonempty.');live.name=name;}));
}
function lockedProperties(root,object,dependent=false){
 field(root,'Name',object.name,'text',()=>false).disabled=true;const note=document.createElement('p');note.className='subtle';note.textContent=dependent?'Locked (including dependencies)':'Locked';root.append(note);localizeUI(root,language());
}
function vectorOptions(root,object,edit,max){
 const pair=document.createElement('div');pair.className='property-check-number-pair';root.append(pair);
 propertyCheck(pair,'Normalize lengths',object.normalized,v=>edit(live=>{live.normalized=v;}));
 field(pair,'Density',object.density,'number',v=>edit(live=>{live.density=v;}),{min:3,max,step:1});
}
function boundsFields(container,keys,bounds){
 const inputs={};for(const key of keys){const label=key.replace(/Min$/,' min').replace(/Max$/,' max');const input=field(container,label,bounds[key],'text',()=>true,{hint:'Finite arithmetic expression; min must be less than max.'});input.onchange=()=>{};input.inputMode='text';input.dataset.acceptedBound=String(bounds[key]);inputs[key]=input;}return inputs;
}
function commitBounds(inputs,parseBound,commit){
 try{const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,parseBound(input.value)]));for(const key of Object.keys(values).filter(k=>k.endsWith('Min')))if(!(values[key]<values[key.replace(/Min$/,'Max')]))throw Error('Finite arithmetic expression; min must be less than max.');if(commit(values)===false){for(const input of Object.values(inputs))input.value=input.dataset.acceptedBound;return;}for(const [key,input] of Object.entries(inputs)){input.value=String(values[key]);input.dataset.acceptedBound=input.value;}}
 catch(error){notice(error.message);for(const input of Object.values(inputs))input.value=input.dataset.acceptedBound;}
}
function parameterRanges(root,keys,object,parseBound,edit){
 const grid=document.createElement('div');grid.className='parametric-range-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Parameter ranges');root.append(grid);
 const inputs=boundsFields(grid,keys,object);const commit=()=>commitBounds(inputs,parseBound,values=>edit(live=>Object.assign(live,values)));
 for(const input of Object.values(inputs))input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();event.stopPropagation();commit();}});
}
function drawingRegion(root,bounds,{dimension,parseBound,commit,conditionValue,conditionCommit,disabled=false}){
 const block=document.createElement('div');block.className='plot-region-editor';block.setAttribute('role','group');block.setAttribute('aria-label','Drawing region');
 const keys=(dimension===3?['x','y','z']:['x','y']).flatMap(axis=>[axis+'Min',axis+'Max']);const inputs=boundsFields(block,keys,bounds);
 installPlotRegionKeys(block,inputs,()=>commitBounds(inputs,parseBound,commit),{dimension,parseBound,conditionValue,conditionCommit});
 if(disabled)for(const input of block.querySelectorAll('input'))input.disabled=true;root.append(block);
}
function colorControls(slot,{label,value,scope,property,disabled,apply}){
 const picker=field(slot,label,value,'color',apply);picker.disabled=disabled;
 const swatches=appendColorSwatches(slot,{scope,property,caption:label+' colors',apply});for(const button of swatches.querySelectorAll('button'))button.disabled=disabled;
 return {picker,swatches};
}
function opacityControl(slot,value,apply){return field(slot,'Opacity',value,'number',apply,{min:0,max:1,step:.05});}
function widthControl(slot,value,apply,max){return field(slot,'Width',value,'number',apply,{min:.1,max,step:.5});}
 return {field, propertyChoice, propertyCheck, propertyName, lockedProperties, vectorOptions, parameterRanges, drawingRegion, colorControls, opacityControl, widthControl};
}
