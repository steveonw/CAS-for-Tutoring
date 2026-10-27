/* Compare expression tree shapes and domain-sensitive primitives in the pinned
 * CortexJS engine. The output is diagnostics, not a domain proof. */
import {ComputeEngine} from '@cortex-js/compute-engine';
import {createRequire} from 'node:module';
import {explainDerivative} from '../lib/step-engine.mjs';
const require=createRequire(import.meta.url), cas=require('../lib/cas-adapter.js');
const ce=new ComputeEngine();
for(const latex of [
 '\\frac{x^2-1}{x-1}', 'x+1','\\frac{1}{x-1}',
 '\\ln(x)','\\ln(x^2+1)','\\sqrt{x}',
 '\\frac{1}{2\\sqrt{x}}','|x|','\\operatorname{abs}(x)',
 '\\sin(x^2)','\\cos(x^2)',
 '\\frac{1}{x}','\\frac{x}{x^2}',
 'x^x','\\tan(x)',
 '\\frac{d}{dx}\\left(\\sin(x^2)\\right)'
]){
 try{
  const x=ce.parse(latex),raw=ce.parse(latex,{canonical:false});
  console.log("DOMAIN_AST",JSON.stringify({latex,canonical:x.json,raw:raw.json,canonLatex:x.latex,rawLatex:raw.latex,isValid:x.isValid,domain:x.domain?.json}));
 }catch(e){console.log("DOMAIN_ERROR",latex,e.message);}
}
for(const input of ["sin(x^2)","sin(3*x)","cos(x^2)","(x^2+3)^4","(x^2-1)/(x-1)","log(x)","sqrt(x)","abs(x)","1/(x-1)","x^2*e^x"]){
 try{
 const out=cas.calculate("differentiate",input);
 const t=explainDerivative(out.latexExpression,{checkLatex:out.latexAnswer});
 console.log("TRACE_AST",JSON.stringify({input,source:out.expression,latex:out.latexExpression,result:t.resultLatex,steps:t.steps.map(s=>({id:s.id,family:s.family,before:s.beforeLatex,after:s.latex}))}));
 }catch(e){console.log("TRACE_ERROR",input,e.message);}
}
