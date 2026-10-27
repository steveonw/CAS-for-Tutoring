/* v0.6 stage one: mathematical-part feedback, hinted disclosure, and
 * representative student-written derivative/partial-derivative checks.
 * These assertions are required; no TODO exceptions.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {explainDerivative,checkStudentStep,calculatorToLatex,getChainPlan,
  getProgressiveHints,diagnoseDerivativeParts} from '../lib/step-engine.mjs';
const require=createRequire(import.meta.url);
const cas=require('../lib/cas-adapter.js');
function lesson(problem) {
  const calc=cas.calculate('differentiate',problem);
  return explainDerivative(calc.latexExpression,{
    checkLatex:calc.latexAnswer,sourceExpression:calc.expression
  });
}
function grade(problem,answer,format='cas'){
  const trace=lesson(problem);
  const latex=format==='cas'?calculatorToLatex(answer):answer;
  return {trace,checked:checkStudentStep(trace,-1,latex,
    format==='cas'?{calculatorSource:answer}:{})};
}
test('chain plan identifies actual outer and inner components',()=>{
  const trace=lesson('(3*x^2+1)^5');
  const p=getChainPlan(trace);
  assert.equal(p?.rule,'chain');
  assert.match(p.innerLatex,/3/);
  assert.match(p.innerLatex,/x/);
  assert.ok(p.innerDerivativeLatex);
  assert.match(p.outerLatex,/5/);
  assert.equal(getProgressiveHints(trace,-1).length,3);
});
test('missing inside derivative: recognises correct outside, not generic wrong',()=>{
  const {checked}=grade('(3*x^2+1)^5','5*(3*x^2+1)^4');
  assert.equal(checked.status,'mistake',checked.message);
  assert.equal(checked.code,'chain-inner-derivative');
  assert.equal(checked.recognized[0].part,'outer');
  assert.equal(checked.problemPart.kind,'missing');
  assert.match(checked.message,/outside derivative is correct/i);
  assert.match(checked.message,/inside/i);
  assert.equal(checked.hints.length,3);
  assert.ok(!checked.hints[0].text.includes("30x"));
  assert.ok(!checked.hints[1].text.includes("30x"));
  assert.ok(checked.hints[2].latex);
});
test('incorrect inside factor: distinct diagnosis from a missing factor',()=>{
  const {checked}=grade('(3*x^2+1)^5','5*(3*x^2+1)^4*3*x');
  assert.equal(checked.status,'mistake',checked.message);
  assert.equal(checked.code,'chain-inner-incorrect');
  assert.equal(checked.problemPart.kind,'incorrect');
  assert.equal(checked.recognized[0].part,'outer');
  assert.ok(checked.problemPart.submittedFactorLatex);
  assert.ok(checked.evidence.x!==undefined);
  assert.ok(!/missing/i.test(checked.message));
});
test('genuinely correct student factorizations still earn credit',()=>{
  for(const input of ['5*(3*x^2+1)^4*6*x','30*x*(3*x^2+1)^4']){
    const {trace,checked}=grade('(3*x^2+1)^5',input);
    assert.ok(['matched','equivalent','advanced'].includes(checked.status),
      input+': '+JSON.stringify(checked));
    assert.equal(checked.advanceTo,trace.steps.length-1);
    assert.equal(checked.final,true);
  }
});
test('valid partially evaluated chain derivative is accepted from LaTeX',()=>{
  const raw='5(3x^2+1)^4\\frac{d}{dx}(3x^2+1)';
  const {checked}=grade('(3*x^2+1)^5',raw,'latex');
  assert.ok(['matched','equivalent','advanced'].includes(checked.status),
    JSON.stringify(checked));
  assert.ok(Number.isInteger(checked.advanceTo));
  assert.equal(checked.final,false);
});
test('real student partial with mathrm d operator is recognized',()=>{
  const raw='5(3x^2+1)^4\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(3x^2+1\\right)';
  const {checked}=grade('(3*x^2+1)^5',raw,'latex');
  assert.ok(['matched','equivalent','advanced'].includes(checked.status),
    JSON.stringify(checked));
});
test('sin, log, power and exponential omissions name actual inner expression',async t=>{
  const samples=[
    ['sin(x^2)','cos(x^2)'],
    ['log(x^2+1)','1/(x^2+1)'],
    ['(x^2+3)^4','4*(x^2+3)^3'],
    ['e^(3*x)','e^(3*x)'],
    ['cos(x^2)','-sin(x^2)'],
    ['sqrt(x^2+1)','1/(2*sqrt(x^2+1))']
  ];
  for(const [input,wrong] of samples)await t.test(input,()=>{
    const {checked}=grade(input,wrong);
    assert.equal(checked.status,'mistake',input+': '+JSON.stringify(checked));
    assert.equal(checked.code,'chain-inner-derivative',input);
    assert.ok(checked.problemPart.latex);
  });
});
test('not every wrong answer is labelled outer-correct',()=>{
  for(const wrong of ['2*x','x^2','7*(3*x^2+1)^4','7*(3*x^2+1)^4*2*x']){
    const {trace}=grade('(3*x^2+1)^5',wrong);
    const standalone=diagnoseDerivativeParts(trace,calculatorToLatex(wrong),{
      calculatorSource:wrong
    });
    assert.equal(standalone,null,'false outer diagnosis '+wrong);
  }
});
test('known domain holes are not excused by matching correct factors',()=>{
  const {checked}=grade('x^2','2*x^2/x');
  assert.equal(checked.status,'domain-mismatch');
  assert.equal(checked.x,0);
});
test('tiered hints for other rules remain available without inventing parts',()=>{
  const trace=lesson('x*sin(x)');
  const hints=getProgressiveHints(trace,-1);
  assert.equal(hints.length,3);
  assert.match(hints[2].text,/product|differentiat/i);
  assert.equal(getProgressiveHints(trace,trace.steps.length-1).length,0);
  assert.equal(getChainPlan(trace),null);
});
test('malicious TeX is never graded using the part analyzer',()=>{
  const {checked}=grade('(3*x^2+1)^5','\\href{https://bad.test}{x}','latex');
  assert.equal(checked.status,'invalid');
});
