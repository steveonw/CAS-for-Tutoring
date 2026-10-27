import test from 'node:test';
import {ComputeEngine} from '@cortex-js/compute-engine';
import {parseCalculatorRaw,calculatorToLatex} from '../lib/domain-guard.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const cas=require('../lib/cas-adapter.js');
const ce=new ComputeEngine();
test('inspect learning component trees',()=>{
 for(const input of ['(3*x^2+1)^5','sin(x^2)','e^(3*x)','log(x^2+1)','cos(x)^2','x*sin(x)','(x^2+1)/x']){
  const c=cas.calculate('differentiate',input);
  const tex=c.latexExpression;
  const raw=ce.parse(tex,{canonical:false});
  console.log('SOURCE_TREE',JSON.stringify({input,original:parseCalculatorRaw(input),tex,raw:raw.json,can:ce.parse(tex).json,answer:c.latexAnswer}));
 }
 for(const input of ['5*(3*x^2+1)^4','5*(3*x^2+1)^4*3*x','5*(3*x^2+1)^4*6*x','30*x*(3*x^2+1)^4','cos(x^2)','cos(x^2)*2*x','e^(3*x)','x*cos(x)','sin(x)']){
  const latex=calculatorToLatex(input),boxed=ce.parse(latex),raw=ce.parse(latex,{canonical:false});
  console.log('STUDENT_TREE',JSON.stringify({input,raw:parseCalculatorRaw(input),tex:latex,parsedRaw:raw.json,can:boxed.json,parsedLatex:boxed.latex}));
 }
 for(const latex of ['5(3x^2+1)^4\\frac{d}{dx}(3x^2+1)',
 '5(3x^2+1)^4\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(3x^2+1\\right)',
 '5(3x^2+1)^4D(3x^2+1)',
 '\\frac{d}{dx}(3x^2+1)',
 '\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(3x^2+1\\right)']) {
  const e=ce.parse(latex),raw=ce.parse(latex,{canonical:false});
  console.log('PARTIAL_PARSE',JSON.stringify({latex,parsed:e.json,latexOut:e.latex,raw:raw.json,isValid:e.isValid}));
 }
});
