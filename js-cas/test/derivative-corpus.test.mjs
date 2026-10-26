/* Expanded regression suite supplied by a collaborator and reviewed/adapted.
 * Test corpus contains 26 common derivatives. Known product bugs are marked
 * Known-bug checks are required to pass; no TODO exclusions remain.
 * Numeric comparisons detect counterexamples; agreement at samples is
 * not a mathematical proof of global equivalence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { ComputeEngine } from '@cortex-js/compute-engine';
import { explainDerivative, ruleChoices } from '../lib/step-engine.mjs';
import { CORPUS, POINTS } from './derivative-corpus.mjs';

const require = createRequire(import.meta.url);
const cas = require('../lib/cas-adapter.js');
const nerdamer = require('nerdamer');
const ce = new ComputeEngine();

function run(input) {
  const result = cas.calculate('differentiate', input);
  const trace = explainDerivative(result.latexExpression, {checkLatex:result.latexAnswer});
  return {result,trace};
}
function nerdamerAt(expression,x) {
  return Number(nerdamer(expression).evaluate({x}).text('decimals'));
}
function cortexAt(latex,x) {
  return ce.parse(latex).subs({x:ce.number(x)}).N().re;
}
function close(a,b) {
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a-b) <= 1e-9*Math.max(1,Math.abs(a),Math.abs(b));
}

test('every corpus problem produces a recorded trace', async (t)=>{
  for(const input of CORPUS) {
    await t.test(input,()=>{
      const {trace}=run(input);
      assert.ok(trace.steps.length>=1,'no steps for '+input);
      for(const s of trace.steps) {
        assert.ok(s.latex && s.reason && s.hint,
          'step missing latex/reason/hint for '+input);
      }
    });
  }
});
test('step trace final answer matches the CAS answer numerically', async (t)=>{
  for(const input of CORPUS) {
    await t.test(input,()=>{
      const {result,trace}=run(input);
      for(const x of POINTS) {
        const a=cortexAt(trace.resultLatex,x);
        const b=nerdamerAt(result.answer,x);
        assert.ok(close(a,b),
          'x='+x+' steps give '+a+' but CAS gives '+b+' for '+input);
      }
    });
  }
});
test('every step maps to a named rule (not generic)',()=>{
    const unnamed=[];
    for(const input of CORPUS) {
      for(const s of run(input).trace.steps) {
        if(s.family==='other')unnamed.push(input+': '+s.id);
      }
    }
    assert.deepEqual(unnamed,[]);
  });
test('chain rule is its own family and quiz choice',()=>{
    const {trace}=run('sin(x^2)');
    assert.equal(trace.steps[0].id,'derivative.chain-rule');
    assert.equal(trace.steps[0].family,'chain');
    assert.ok(ruleChoices.some(c=>c.value==='chain'));
  });
test('constant multiples are not called the product rule',()=>{
    const {trace}=run('3*x^2-5*x+7');
    assert.deepEqual(trace.steps.filter(s=>s.family==='product').map(s=>s.latex),[]);
  });
test('no adjacent step leaves expression text unchanged',()=>{
    const noops=[];
    for(const input of CORPUS) {
      const steps=run(input).trace.steps;
      for(let i=1;i<steps.length;i++) {
        if(steps[i].latex===steps[i-1].latex)
          noops.push(input+': step '+(i+1)+' ('+steps[i].id+')');
      }
    }
    assert.deepEqual(noops,[]);
  });
test('MathJax config includes each exponentialE macro emitted',()=>{
    const config=readFileSync(new URL('../offline/mathjax-config.js',import.meta.url),'utf8');
    const used=new Set();
    for(const input of CORPUS) {
      for(const s of run(input).trace.steps) {
        for(const m of s.latex.matchAll(/\\exponentialE\b/g))used.add(m[0].slice(1));
      }
    }
    for(const macro of used)
      assert.match(config,new RegExp(macro),'missing MathJax macro '+macro);
  });

test('natural logs are unambiguous in the actual Nerdamer-to-CortexJS pipeline',()=>{
  for(const input of ['log(x)','log(x^2+1)','x^x','2^x']){
    const {result,trace}=run(input);
    assert.ok(!result.latexExpression.includes('\\mathrm{log}'),
      'ambiguous input TeX: '+input);
    assert.ok(!result.latexAnswer.includes('\\mathrm{log}'),
      'ambiguous answer TeX: '+input);
    assert.notEqual(trace.verification.status,'conflict',input+' disagrees');
    assert.ok(trace.verification.samplesChecked>=3,input+' has insufficient checks');
  }
});
test('sampling detects a counterexample to base-10 and natural-log equivalence',()=>{
  // Deliberately use the raw, incorrect base-10 serialization as an attack
  // regression: detected disagreement must block teaching.
  const bad=explainDerivative('\\mathrm{log}(x)',{checkLatex:'\\frac{1}{x}'});
  assert.equal(bad.verification.status,'conflict');
  assert.ok(bad.verification.mismatches.some(m=>m.x>0 &&
    Math.abs(m.traceValue-m.casValue)>0.01));
});
test('true two-variable product versus numerical constant multiple',()=>{
  const actual=run('x^2*e^x').trace;
  assert.equal(actual.steps[0].family,'product');
  assert.ok(actual.steps.some(s=>s.family==='exponential'));
  const constant=run('3*x^2-5*x+7').trace;
  assert.ok(constant.steps.some(s=>s.family==='constant'));
  assert.ok(constant.steps.every(s=>s.family!=='product'));
});
