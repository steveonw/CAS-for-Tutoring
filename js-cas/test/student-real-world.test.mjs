/* End-to-end student-like inputs: correct work should earn credit without
 * requiring machine-only half-differentiated D() expressions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {explainDerivative,checkStudentStep,assessNextRule,checkNextRule,calculatorToLatex}
  from '../lib/step-engine.mjs';
import {parseCalculatorRaw} from '../lib/domain-guard.mjs';
const require=createRequire(import.meta.url);
const cas=require('../lib/cas-adapter.js');

function lesson(problem){
  const c=cas.calculate('differentiate',problem);
  return explainDerivative(c.latexExpression,{checkLatex:c.latexAnswer,sourceExpression:c.expression});
}
function grade(problem,student){
  const trace=lesson(problem);
  return {trace,result:checkStudentStep(trace,-1,calculatorToLatex(student),
    {calculatorSource:student})};
}

test('student calculator notation is rendered without Nerdamer simplification',()=>{
  const entered=calculatorToLatex('4*(x^2+3)^3*2*x');
  assert.match(entered,/4/);
  assert.match(entered,/2/);
  assert.match(entered,/\\cdot/);
  assert.ok(entered.includes('^{3}'));
  assert.ok(!/8x/.test(entered),'should not collapse the multiplication');
  assert.deepEqual(parseCalculatorRaw('2*x^2/x')[0],'Divide');
  assert.match(calculatorToLatex('log(x^2+1)'),/\\ln/);
  assert.match(calculatorToLatex('e^(3*x)'),/\\exponentialE/);
  assert.throws(()=>calculatorToLatex('x;alert(1)'),/safely|unsupported/i);
});
test('six correct handwritten-style answers are credited at Step 0',async t=>{
  const samples=[
    ['(x^2+3)^4','4*(x^2+3)^3*2*x'],
    ['sin(x^2)','2*x*cos(x^2)'],
    ['x*sin(x)','sin(x)+x*cos(x)'],
    ['cos(x)^2','-2*cos(x)*sin(x)'],
    ['e^(3*x)','3*e^(3*x)'],
    ['log(x^2+1)','2*x/(x^2+1)']
  ];
  for(const [problem,entered] of samples){
    await t.test(problem,()=>{
      const {trace,result}=grade(problem,entered);
      assert.ok(['matched','equivalent','advanced'].includes(result.status),
        problem+': '+JSON.stringify(result));
      assert.equal(result.final,true,problem);
      assert.equal(result.advanceTo,trace.steps.length-1,problem);
      assert.ok(/Correct|equivalent/i.test(result.message),problem);
    });
  }
});
test('later recorded states may be reached directly',()=>{
  const trace=lesson('(x^2+3)^4');
  const direct=checkStudentStep(trace,-1,trace.steps[1].latex);
  assert.equal(direct.status,'advanced');
  assert.equal(direct.advanceTo,1);
  assert.equal(direct.skippedCount,1);
});
test('chain and power are both valid initial descriptions of composite powers',()=>{
  for(const problem of ['(x^2+3)^4','cos(x)^2','e^(3*x)']){
    const trace=lesson(problem);
    const candidate=assessNextRule(trace,-1,'chain');
    assert.equal(candidate.correct,true,problem+': '+candidate.message);
    assert.equal(checkNextRule(trace,-1,'chain'),true);
    assert.equal(candidate.alternative,trace.steps[0].family!=='chain');
  }
  const plain=lesson('x^5');
  assert.equal(checkNextRule(plain,-1,'chain'),false);
  const trig=lesson('sin(x^2)');
  assert.equal(checkNextRule(trig,-1,'power'),false);
  assert.equal(checkNextRule(trig,-1,'chain'),true);
});
test('new mistake patterns require evidence and do not mark valid work wrong',async t=>{
  const cases=[
    ['x*sin(x)','cos(x)','product-derivatives-multiplied'],
    ['(x^2+1)/x','((x^2+1)-2*x*x)/x^2','quotient-reversed'],
    ['x^5','5*x^5','power-exponent-unchanged'],
    ['5*x^5','25*x^5','power-exponent-unchanged'],
    ['e^(3*x)','e^(3*x)','chain-inner-derivative']
  ];
  for(const [problem,entered,code] of cases){
    await t.test(problem,()=>{
      const {result}=grade(problem,entered);
      assert.equal(result.status,'mistake',problem+': '+JSON.stringify(result));
      assert.equal(result.code,code,problem);
    });
  }
  assert.notEqual(grade('x*sin(x)','sin(x)+x*cos(x)').result.status,'mistake');
  assert.notEqual(grade('x^5','5*x^4').result.status,'mistake');
});
test('correct-looking cancellation with an introduced zero hole still fails',()=>{
  const {result}=grade('x^2','2*x^2/x');
  assert.equal(result.status,'domain-mismatch');
  assert.equal(result.x,0);
});
