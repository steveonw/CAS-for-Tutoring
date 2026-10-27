/* Student practice checks are strictly scoped:
 * an exact recorded step or engine-confirmed equivalence is feedback,
 * not a domain-aware proof of arbitrary student mathematics.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {explainDerivative,checkNextRule,checkStudentStep,ruleChoices} from '../lib/step-engine.mjs';
import {CORPUS} from './derivative-corpus.mjs';
const require=createRequire(import.meta.url);
const cas=require('../lib/cas-adapter.js');

test('Step 0 can quiz the first recorded rule, not the second',()=>{
  const trace=explainDerivative('(x^2+3)^4');
  assert.equal(checkNextRule(trace,-1,'power'),true);
  assert.equal(checkNextRule(trace,-1,'sum'),false);
  assert.equal(checkNextRule(trace,0,'sum'),true);
  assert.equal(checkNextRule(trace,trace.steps.length-1,'power'),false);
  assert.ok(ruleChoices.some(x=>x.value==='chain'));
});
test('the exact recorded expression is recognized at Step 0 and later',()=>{
  const trace=explainDerivative('(x^2+3)^4');
  assert.equal(checkStudentStep(trace,-1,trace.steps[0].latex).status,'matched');
  assert.equal(checkStudentStep(trace,0,trace.steps[1].latex).status,'matched');
  assert.equal(checkStudentStep(trace,trace.steps.length-2,trace.steps.at(-1).latex).status,'matched');
  assert.equal(checkStudentStep(trace,trace.steps.length-1,'x').status,'complete');
});
test('a correct final derivative earns credit instead of an incorrect skipped label',()=>{
  const trace=explainDerivative('(x^2+3)^4');
  const result=checkStudentStep(trace,-1,trace.resultLatex);
  assert.equal(result.status,'advanced');
  assert.equal(result.advanceTo,trace.steps.length-1);
  assert.equal(result.final,true);
  assert.match(result.message,/correct derivative/i);
});
test('unsafe, unsupported or empty student math cannot be accepted',()=>{
  const trace=explainDerivative('sin(x^2)');
  for(const bad of ['', '\\href{https://malicious.example}{x}',
    '\\newcommand{\\bad}{x}', '\\log(x)',
    '<script>alert(1)</script>','x;alert(1)']){
    assert.equal(checkStudentStep(trace,-1,bad).status,'invalid',bad);
  }
});
test('a provably distinct expression yields a counterexample, never a pass',()=>{
  const trace=explainDerivative('(x^2+3)^4');
  const result=checkStudentStep(trace,trace.steps.length-2,'0');
  assert.equal(result.status,'counterexample');
  assert.ok(typeof result.x==='number');
});
test('feedback never claims matching samples imply proof or valid domains',()=>{
  const trace=explainDerivative('x^2+3');
  const result=checkStudentStep(trace,-1,'x');
  assert.notEqual(result.status,'matched');
  assert.notEqual(result.status,'equivalent');
});
test('CAS calculator-to-LaTeX practice notation respects validation',()=>{
  assert.match(cas.inputToLatex('2*x*cos(x^2)','cas'),/cos/);
  assert.match(cas.inputToLatex('log(x)','cas'),/\\ln/);
  assert.throws(()=>cas.inputToLatex('x;alert(1)','cas'),/mathematical notation/i);
});
test('26 corpus transformations are accepted in their own original order',()=>{
  for(const input of CORPUS){
    const calc=cas.calculate('differentiate',input);
    const trace=explainDerivative(calc.latexExpression,{checkLatex:calc.latexAnswer});
    assert.notEqual(trace.verification.status,'conflict',input);
    assert.equal(checkStudentStep(trace,-1,trace.steps[0].latex).status,'matched',input);
  }
});

test('a student-typed calculator expression can match a genuine final trace step',()=>{
  const trace=explainDerivative('x^2');
  const latex=cas.inputToLatex('2*x','cas');
  const checked=checkStudentStep(trace,trace.steps.length-2,latex);
  assert.ok(['matched','equivalent'].includes(checked.status),checked.message);
});
