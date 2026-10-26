/* Print the real intermediate mathematical trace for manual review.
 * npm run traces                       # every corpus problem
 * npm run traces -- "sin(x^2)" "x^x"   # selected examples
 */
import { createRequire } from 'node:module';
import { explainDerivative } from '../lib/step-engine.mjs';
import { CORPUS } from '../test/derivative-corpus.mjs';
const require = createRequire(import.meta.url);
const cas = require('../lib/cas-adapter.js');
const inputs = process.argv.slice(2).length ? process.argv.slice(2) : CORPUS;
for (const input of inputs) {
  try {
    const result = cas.calculate('differentiate', input);
    const trace = explainDerivative(result.latexExpression, {checkLatex:result.latexAnswer});
    console.log('\n### '+input);
    console.log('    sent to CortexJS: '+result.latexExpression);
    trace.steps.forEach((s,i)=>
      console.log('  '+(i+1)+'. ['+s.family+'] '+s.rule+' ('+s.id+')\n       '+s.latex));
    console.log('    steps end at:   '+trace.resultLatex);
    console.log('    Nerdamer says:  '+result.latexAnswer);
    console.log('    isEqual:        '+trace.agreement);
  } catch(e) {
    console.log('\n### '+input+'\n    ERROR: '+e.message);
  }
}
