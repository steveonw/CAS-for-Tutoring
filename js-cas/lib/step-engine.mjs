/* CortexJS-powered, real step-by-step derivative trace.
 * Each step comes from Compute Engine's explain() API, not from guessed
 * mathematical prose. Only differentiation is enabled in this milestone.
 */
import { ComputeEngine } from '@cortex-js/compute-engine';

const engine = new ComputeEngine();
const RULES = Object.freeze({
  'derivative.power-rule': {
    family: 'power', label: 'Power and chain rule',
    hint: 'Find an exponent. If its base is an expression, remember its inside derivative.',
    textbook: 'Calculus Made Easy — Chapters IV and IX'
  },
  'derivative.sum-rule': {
    family: 'sum', label: 'Sum / difference rule',
    hint: 'Look for addition or subtraction: you can differentiate each term separately.',
    textbook: 'Calculus Made Easy — Chapter VI'
  },
  'derivative.product-rule': {
    family: 'product', label: 'Product rule',
    hint: 'For a product of two varying expressions, differentiate one factor at a time.',
    textbook: 'Calculus Made Easy — Chapter VI'
  },
  'derivative.quotient-rule': {
    family: 'quotient', label: 'Quotient rule',
    hint: 'The numerator and denominator both depend on x. Use the quotient rule.',
    textbook: 'Calculus Made Easy — Chapter VI'
  },
  'derivative.known-derivative': {
    family: 'known', label: 'Known elementary derivative',
    hint: 'Recall the derivative of a familiar function such as sin(x), cos(x), or exp(x).',
    textbook: 'Calculus Made Easy — introductory differentiation rules'
  },
  'derivative.simplify': {
    family: 'simplify', label: 'Simplify the expression',
    hint: 'Combine like terms, cancel factors when allowed, or multiply constants.',
    textbook: 'Algebra review'
  }
});
const CHOICES = Object.freeze([
  {value:'power',label:'Power / chain rule'},
  {value:'sum',label:'Sum / difference rule'},
  {value:'product',label:'Product rule'},
  {value:'quotient',label:'Quotient rule'},
  {value:'known',label:'Known elementary derivative'},
  {value:'simplify',label:'Simplification'},
  {value:'other',label:'Another rule'}
]);

function normalizeText(value, maxLength = 900) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error('A nonempty, reasonably sized LaTeX expression is required.');
  }
  // Do not allow arbitrary HTML, URLs or TeX extensions through this interface.
  if (/[<>]/.test(value) || /\\(?:href|html|includegraphics|style|class)\b/i.test(value)) {
    throw new Error('Unsupported markup or TeX extension.');
  }
  return value.trim();
}
export function explainDerivative(latex, options = {}) {
  const original = normalizeText(latex);
  const expression = engine.parse(original);
  const trace = expression.explain('D', {variable:'x'});
  if (!trace || !Array.isArray(trace.steps) || trace.steps.length === 0 ||
      !trace.result || typeof trace.result.latex !== 'string') {
    throw new Error('No recorded derivative steps are available for this expression.');
  }
  const steps = trace.steps.map((step, index) => {
    if (!step || !step.value || typeof step.value.latex !== 'string') {
      throw new Error('A transformation is missing a valid mathematical state.');
    }
    const id = String(step.id || 'other');
    const info = RULES[id] || {
      family:'other', label:'Symbolic transformation',
      hint:'Look at what changes from the preceding expression.',
      textbook:'Consult the applicable Calculus I rule'
    };
    return {
      index,
      id,
      family: info.family,
      rule: info.label,
      reason: String(step.description || 'The symbolic engine applied this transformation.'),
      hint: info.hint,
      textbook: info.textbook,
      latex: step.value.latex
    };
  });
  let agreement = null;
  if (options.checkLatex) {
    const other = engine.parse(normalizeText(options.checkLatex));
    const value = trace.result.isEqual(other);
    agreement = value === true ? true : (value === false ? false : null);
  }
  return {
    originalLatex: original,
    initialLatex: trace.initial && typeof trace.initial.latex === 'string'
      ? trace.initial.latex : '\\frac{d}{dx}\\left(' + original + '\\right)',
    resultLatex: trace.result.latex,
    steps,
    agreement,
    provenance: 'CortexJS Compute Engine explain(D) — recorded symbolic transformations'
  };
}
export function checkNextRule(trace, viewedIndex, selectedFamily) {
  if (!trace || !Array.isArray(trace.steps)) return false;
  const next = trace.steps[viewedIndex + 1];
  return !!next && next.family === selectedFamily;
}
export const ruleChoices = CHOICES;
if (typeof window !== 'undefined') {
  window.MathDreamweaverSteps = Object.freeze({
    explainDerivative, checkNextRule, ruleChoices
  });
}
