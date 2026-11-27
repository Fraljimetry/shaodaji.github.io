import test from 'node:test';
import assert from 'node:assert/strict';
import {createPropertyControls,numericExpression,rangeHint} from '../src/property_controls.mjs';

class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.listeners={};this.attributes={};this.classList={contains:()=>false,add:()=>{}};}
 append(...children){this.children.push(...children);}
 setAttribute(key,value){this.attributes[key]=value;}
 addEventListener(key,fn){this.listeners[key]=fn;}
}
function fixture(){
 const messages=[];
 const document={createElement:tag=>new Element(tag),createTextNode:text=>text};
 const controls=createPropertyControls({document,language:()=> 'en',notice:msg=>messages.push(msg),appendColorSwatches:()=>{throw Error('Unexpected color swatches');}});
 return {controls,root:new Element('div'),messages};
}
test('numeric property contract accepts arithmetic and rejects invalid limits',()=>{
 assert.equal(numericExpression('2*pi'),2*Math.PI);
 assert.throws(()=>numericExpression('1/0'),/finite/i);
 assert.throws(()=>numericExpression('2.5',{integer:true}),/whole number/);
 assert.throws(()=>numericExpression('9',{max:8}),/within/);
 assert.equal(rangeHint({min:0,max:1}),'Range: 0–1');
});
test('field commits numeric values and restores accepted values after rejection or synchronization',()=>{
 const {controls,root,messages}=fixture();const edits=[];
 const input=controls.field(root,'Density',5,'number',value=>{edits.push(value);return value!==7;},{min:3,max:12,step:1});
 input.value='2*3';input.onchange();assert.equal(input.value,'6');assert.deepEqual(edits,[6]);
 input.value='7';input.onchange();assert.equal(input.value,'6');
 input.value='13';input.onchange();assert.equal(input.value,'6');assert.equal(messages.length,1);
 input.listeners['properties-synced']({detail:{value:'8'}});input.value='';input.onchange();assert.equal(input.value,'8');
});
test('parameter range edits are atomic and invalid drafts restore all bounds',()=>{
 const {controls,root,messages}=fixture();const object={tMin:0,tMax:1};let commits=0;
 controls.parameterRanges(root,['tMin','tMax'],object,numericExpression,fn=>{commits++;fn(object);});
 const [min,max]=root.children[0].children.map(label=>label.children[0]);
 const enter={key:'Enter',isComposing:false,preventDefault(){},stopPropagation(){}};
 min.value='2';max.value='pi';min.listeners.keydown(enter);assert.equal(commits,1);assert.equal(object.tMax,Math.PI);
 min.value='4';max.value='3';max.listeners.keydown(enter);assert.equal(commits,1);assert.equal(min.value,'2');assert.equal(max.value,String(Math.PI));assert.equal(messages.length,1);
});
