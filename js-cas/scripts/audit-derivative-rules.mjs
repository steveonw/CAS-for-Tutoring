/* Inspect the engine's actual recorded IDs and source states.
 * Safe-to-remove diagnostics, no claims about mathematical equivalence.
 */
import { ComputeEngine } from '@cortex-js/compute-engine';
import { createRequire } from 'node:module';
import { CORPUS } from '../test/derivative-corpus.mjs';
const require=createRequire(import.meta.url);
const cas=require('../lib/cas-adapter.js'), ce=new ComputeEngine();
const tallies=new Map();
for(const input of CORPUS) {
 try {
  const r=cas.calculate('differentiate',input);
  const e=ce.parse(r.latexExpression);
  const trace=e.explain('D',{variable:'x'});
  console.log('INPUT',JSON.stringify({input,casInput:r.expression,latex:r.latexExpression,answer:r.answer,latexAnswer:r.latexAnswer,initial:trace.initial.latex,result:trace.result.latex}));
  for(const s of trace.steps){
    tallies.set(s.id,(tallies.get(s.id)||0)+1);
    console.log('RULE',JSON.stringify({id:s.id,description:s.description,value:s.value.latex}));
  }
  if(['3*x^2-5*x+7','x*sin(x)','(2*x+1)^3*(x-4)^2','sin(x^2)','log(x^2+1)'].includes(input)){
   console.log('DEEP',JSON.stringify({input,exprJson:e.json,stepRaw:trace.steps.map(s=>({keys:Object.keys(s),id:s.id,json:s.value.json,description:s.description,source:s.source?.latex}))}));
  }
 }catch(e){console.log('ERROR',input,String(e));}
}
console.log('RULE_TALLY',JSON.stringify(Array.from(tallies.entries()).sort((a,b)=>a[0].localeCompare(b[0]))));
