/* Conservative real-domain and evidenced misconception regressions.
 * Examples are drawn from representative Calculus I rules. These tests
 * deliberately do not assert that the scanner solves every domain.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {ComputeEngine} from '@cortex-js/compute-engine';
import {explainDerivative,checkStudentStep} from '../lib/step-engine.mjs';
import {parseCalculatorRaw,describeDerivativeDomain,describeCalculatorDomain,
  extraStudentDomainHole,originalDomainNotes} from '../lib/domain-guard.mjs';
const require=createRequire(import.meta.url);
const cas=require('../lib/cas-adapter.js');
function lesson(input){
  const r=cas.calculate('differentiate',input);
  return explainDerivative(r.latexExpression,{checkLatex:r.latexAnswer,
    sourceExpression:r.expression});
}
function grade(input,student,position=-1){
  const trace=lesson(input);
  return checkStudentStep(trace,position,cas.inputToLatex(student,'cas'),
    {calculatorSource:student});
}
test('raw calculator parser retains a division that the CAS might cancel',()=>{
  const ast=parseCalculatorRaw('2*x^2/x');
  assert.equal(ast[0],'Divide');
  assert.equal(ast[2],'x');
  assert.deepEqual(parseCalculatorRaw('x^(-2)'),['Power','x',['Negate',2]]);
  assert.throws(()=>parseCalculatorRaw('x;alert(1)'),/safely|Unsupported/);
});
test('source-domain scanner keeps known exclusions and flags uncertain endpoints',()=>{
  const quotient=describeCalculatorDomain('(x^2-1)/(x-1)',{derivative:true});
  assert.equal(quotient.at(1),'excluded');
  assert.equal(quotient.at(2),'allowed');
  assert.ok(quotient.notes.some(x=>/denominator/i.test(x)));
  const log=describeCalculatorDomain('log(x)',{derivative:true});
  assert.equal(log.at(-1),'excluded');
  assert.equal(log.at(0),'excluded');
  assert.equal(log.at(2),'allowed');
  assert.equal(describeCalculatorDomain('log(x^2+1)').at(-2),'allowed');
  const root=describeCalculatorDomain('sqrt(x)',{derivative:true});
  assert.equal(root.at(-1),'excluded');
  assert.equal(root.at(0),'unknown');
  const absolute=describeCalculatorDomain('abs(x)',{derivative:true});
  assert.equal(absolute.at(0),'unknown');
  assert.ok(originalDomainNotes('x','x/x').some(x=>/nonzero/i.test(x)));
});
test('typed algebraically cancelled fractions cannot silently add a domain hole',()=>{
  const result=grade('x^2','2*x^2/x');
  assert.equal(result.status,'domain-mismatch');
  assert.equal(result.x,0);
  assert.match(result.message,/undefined|domain/i);
  const latex=extraStudentDomainHole('x^2','2x','\\frac{2x^2}{x}');
  assert.equal(latex?.x,0);
});
test('original exclusions remain excluded even if a derivative can be extended',()=>{
  const original=describeCalculatorDomain('(x^2-1)/(x-1)',{derivative:true});
  assert.equal(original.at(1),'excluded');
  const input=lesson('(x^2-1)/(x-1)');
  assert.ok(input.domainNotes.some(x=>/denominator/i.test(x)));
  assert.equal(extraStudentDomainHole('\\frac{1}{x-1}','\\frac{-1}{(x-1)^2}',
    '\\frac{-(x-1)}{(x-1)^3}',{originalSource:'1/(x-1)'}),null);
});
test('chain-rule omissions get specific feedback only when evidenced',()=>{
  const examples=[
    ['sin(x^2)','cos(x^2)'],
    ['sin(3*x)','cos(3*x)'],
    ['cos(x^2)','-sin(x^2)'],
    ['(x^2+3)^4','4*(x^2+3)^3'],
    ['log(x^2+1)','1/(x^2+1)'],
    ['sqrt(x^2+1)','1/(2*sqrt(x^2+1))']
  ];
  for(const [problem,student] of examples){
    const result=grade(problem,student);
    assert.equal(result.status,'mistake',problem+': '+result.message);
    assert.equal(result.code,'chain-inner-derivative',problem);
  }
  assert.notEqual(grade('sin(x)','cos(x)').status,'mistake');
});
test('product rule recognizes a single remaining contribution',()=>{
  const r=grade('x*sin(x)','sin(x)');
  assert.equal(r.status,'mistake',r.message);
  assert.equal(r.code,'product-missing-term');
});
test('quotient rule identifies adding instead of subtracting',()=>{
  const trace=lesson('(x^2+1)/x');
  const ce=new ComputeEngine(),raw=ce.parse(trace.originalLatex,{canonical:false}).json;
  const f=ce.box(raw[1],{canonical:false}).latex,g=ce.box(raw[2],{canonical:false}).latex;
  const fp=ce.parse(f).explain('D',{variable:'x'})?.result?.latex,
    gp=ce.parse(g).explain('D',{variable:'x'})?.result?.latex;
  const guessed='\\\\frac{\\\\left('+g+'\\\\right)\\\\left('+fp+'\\\\right)+\\\\left('+f+'\\\\right)\\\\left('+gp+'\\\\right)}{\\\\left('+g+'\\\\right)^2}';
  const student=cas.inputToLatex('(2*x*x+(x^2+1))/x^2','cas');
  const a=ce.parse(guessed),b=ce.parse(student);
  console.log('QUOTIENT_DEBUG',JSON.stringify({raw,f,g,fp,gp,guessed,student,ga:a.json,sa:b.json,isEqual:a.isEqual(b),simpA:a.simplify().json,simpB:b.simplify().json}));
  const r=grade('(x^2+1)/x','(2*x*x+(x^2+1))/x^2');
  assert.equal(r.status,'mistake',r.message);
  assert.equal(r.code,'quotient-sign');
});
test('constant rules recognize dropped coefficients and undifferentiated constants',()=>{
  const first=grade('3*x^2','2*x');
  assert.equal(first.status,'mistake',first.message);
  assert.equal(first.code,'constant-multiple');
  const second=grade('3*x^2-5*x+7','6*x-5+7');
  assert.equal(second.status,'mistake',second.message);
  assert.equal(second.code,'constant-not-zero');
});
test('feedback for unsupported wrong work remains noncommittal',()=>{
  const result=grade('sin(x^2)','x+100');
  assert.ok(['counterexample','unverified'].includes(result.status),
    result.message);
  assert.notEqual(result.status,'mistake');
});
test('correct first transformations still pass, and valid domain is not overclaimed',()=>{
  for(const input of ['sin(x^2)','(x^2+3)^4','x*sin(x)','log(x)','sqrt(x)']){
    const trace=lesson(input);
    assert.equal(checkStudentStep(trace,-1,trace.steps[0].latex).status,'matched',input);
    assert.ok(trace.domainScope.startsWith('partial'));
  }
});
