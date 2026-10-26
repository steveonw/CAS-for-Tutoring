/* Real CortexJS recorded derivative steps with student-facing rule labels.
 * Keep the original rule IDs; corrections such as "constant multiple" must
 * be justified by the before/after expression AST, never guessed from text.
 */
import { ComputeEngine } from '@cortex-js/compute-engine';
const engine = new ComputeEngine();
const RULES = Object.freeze({
  'derivative.power-rule': {
    family:'power', label:'Power rule',
    hint:'A fixed exponent means bring down that exponent and decrease it by one. If the base is composite, also differentiate its inside.',
    textbook:'Calculus Made Easy — Chapters IV and IX'
  },
  'derivative.chain-rule': {
    family:'chain', label:'Chain rule',
    hint:'Find the outside and inside functions. Differentiate the outside, keep the inside unchanged, then multiply by its derivative.',
    textbook:'Calculus Made Easy — Chapter IX'
  },
  'derivative.sum-rule': {
    family:'sum', label:'Sum / difference rule',
    hint:'Differentiate each variable term separately. Constants have derivative zero.',
    textbook:'Calculus Made Easy — Chapter VI'
  },
  'derivative.product-rule': {
    family:'product', label:'Product rule',
    hint:'Both factors depend on x: (uv)′ = u′v + uv′.',
    textbook:'Calculus Made Easy — Chapter VI'
  },
  'derivative.quotient-rule': {
    family:'quotient', label:'Quotient rule',
    hint:'For u/v, differentiate numerator and denominator: (u′v−uv′)/v².',
    textbook:'Calculus Made Easy — Chapter VI'
  },
  'derivative.exponential-rule': {
    family:'exponential', label:'Exponential rule',
    hint:'For a constant base a, (a^u)′ = a^u ln(a)·u′. When a=e, ln(e)=1.',
    textbook:'Calculus Made Easy — exponential functions'
  },
  'derivative.general-power-rule': {
    family:'general-power', label:'Logarithmic differentiation',
    hint:'When both base and exponent depend on x, take logarithms first: (f^g)′ = f^g(g′ ln f + gf′/f), where defined.',
    textbook:'OpenStax Calculus Volume 1 — logarithmic differentiation'
  },
  'derivative.known-derivative': {
    family:'known', label:'Known elementary derivative',
    hint:'Recall the derivative of a standard function (trig, inverse trig, log, exp, root, or absolute value).',
    textbook:'Calculus Made Easy — elementary differentiation'
  },
  'derivative.simplify': {
    family:'simplify', label:'Algebraic simplification',
    hint:'Combine or rearrange terms while retaining the domain of the original function.',
    textbook:'Algebra review'
  }
});
const CONSTANT = Object.freeze({
  family:'constant', label:'Constant multiple rule',
  hint:'A numerical coefficient stays out front: (c f(x))′ = c f′(x).',
  textbook:'Calculus Made Easy — Chapter VI'
});
const CHOICES = Object.freeze([
  {value:'power',label:'Power rule'},
  {value:'chain',label:'Chain rule'},
  {value:'constant',label:'Constant multiple rule'},
  {value:'sum',label:'Sum / difference rule'},
  {value:'product',label:'Product rule'},
  {value:'quotient',label:'Quotient rule'},
  {value:'exponential',label:'Exponential rule'},
  {value:'general-power',label:'Logarithmic differentiation'},
  {value:'known',label:'Known elementary derivative'},
  {value:'simplify',label:'Algebraic simplification'},
  {value:'other',label:'Another rule'}
]);

function normalizeText(value, maxLength = 900) {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new Error('A nonempty, reasonably sized LaTeX expression is required.');
  }
  if (/[<>]/.test(value) || /\\(?:href|html|includegraphics|style|class)\b/i.test(value)) {
    throw new Error('Unsupported markup or TeX extension.');
  }
  return value.trim();
}
function derivativeTargets(node, output=[]) {
  if (!Array.isArray(node)) return output;
  if (node[0]==='D' && node.length>=3) output.push(node[1]);
  for (let i=1;i<node.length;i++) derivativeTargets(node[i],output);
  return output;
}
function numberFactor(node) {
  if (!Array.isArray(node) || node[0]!=='Multiply') return false;
  // CortexJS canonical JSON represents exact numeric coefficients as JS
  // numbers. A true product of two variable factors lacks such a factor.
  return node.slice(1).some(factor=>typeof factor==='number' && Number.isFinite(factor)) &&
    node.slice(1).some(factor=>typeof factor !== 'number');
}
function wasConstantMultiple(prev, next, stepId) {
  if (stepId!=='derivative.product-rule') return false;
  const before=derivativeTargets(prev);
  const after=new Set(derivativeTargets(next).map(t=>JSON.stringify(t)));
  const eliminated=before.filter(target=>!after.has(JSON.stringify(target)));
  // Only override CortexJS when a specific numerical-coefficient derivative
  // disappeared at this recorded transition. Other product rules stay intact.
  return eliminated.length===1 && numberFactor(eliminated[0]);
}
function finiteReal(expr,x) {
  try {
    const value=expr.subs({x:engine.number(x)}).N();
    const re=Number(value.re);
    const im=Number(value.im ?? 0);
    if (!Number.isFinite(re) || !Number.isFinite(im) ||
      Math.abs(im)>1e-9*Math.max(1,Math.abs(re))) return null;
    return re;
  } catch { return null; }
}
function compareResults(recorded, checkLatex) {
  if (!checkLatex) return {agreement:null, verification:{
    status:'not-checked', samplesChecked:0, mismatches:[]
  }};
  const other=engine.parse(normalizeText(checkLatex));
  const value=recorded.isEqual(other);
  const agreement=value===true?true:value===false?false:null;
  const samples=[0.2,0.45,0.7,0.85,1.2,1.8,2.5];
  let checked=0, mismatches=[];
  for(const x of samples) {
    const traceValue=finiteReal(recorded,x), casValue=finiteReal(other,x);
    if(traceValue===null || casValue===null)continue;
    checked++;
    if(Math.abs(traceValue-casValue)>1e-7*Math.max(1,Math.abs(traceValue),Math.abs(casValue))){
      mismatches.push({x,traceValue,casValue});
    }
  }
  // One reproducible, substantially different value disproves global
  // identity. Matching finite samples *never* proves identity.
  let status=mismatches.length || agreement===false ? 'conflict'
    : agreement===true ? 'symbolic'
    : checked>0 ? 'samples-consistent' : 'inconclusive';
  return {agreement, verification:{status, samplesChecked:checked, mismatches}};
}
export function explainDerivative(latex, options={}) {
  const original=normalizeText(latex);
  const expression=engine.parse(original);
  const trace=expression.explain('D',{variable:'x'});
  if(!trace || !Array.isArray(trace.steps) || !trace.steps.length ||
     !trace.result || typeof trace.result.latex!=='string'){
    throw new Error('No recorded derivative steps are available for this expression.');
  }
  const steps=[];
  let previousJson=trace.initial.json, previousLatex=trace.initial.latex;
  for(const step of trace.steps){
    if(!step?.value || typeof step.value.latex!=='string')
      throw new Error('A transformation is missing a mathematical state.');
    const nextJson=step.value.json;
    const constant=wasConstantMultiple(previousJson,nextJson,String(step.id));
    const rule=constant?CONSTANT:RULES[String(step.id)] || {
      family:'other',label:'Symbolic transformation',
      hint:'Look at the transformation in the preceding expression.',
      textbook:'Consult the relevant Calculus I rule'
    };
    const reason=constant
      ? 'Move the numerical coefficient outside the derivative: (c f(x))′ = c f′(x).'
      : String(step.description || 'The engine applied this transformation.');
    // A repeated expression is not a teachable operation. Never count it as
    // an additional step, but keep the underlying engine trace unchanged.
    if(step.value.latex!==previousLatex){
      steps.push({
        index:steps.length, id:String(step.id||'other'),
        family:rule.family, rule:rule.label, reason,
        engineReason:String(step.description || ''),
        hint:rule.hint, textbook:rule.textbook,
        latex:step.value.latex, beforeLatex:previousLatex
      });
    }
    previousJson=nextJson;
    previousLatex=step.value.latex;
  }
  if(!steps.length)throw new Error('No meaningful recorded transformations available.');
  const checked=compareResults(trace.result,options.checkLatex);
  return {
    originalLatex:original,
    initialLatex:trace.initial.latex,
    resultLatex:trace.result.latex,
    steps, agreement:checked.agreement, verification:checked.verification,
    provenance:'CortexJS Compute Engine explain(D) — recorded symbolic transformations'
  };
}
export function checkNextRule(trace,viewedIndex,selectedFamily){
  if(!trace || !Array.isArray(trace.steps))return false;
  const next=trace.steps[viewedIndex+1];
  return !!next && next.family===selectedFamily;
}
export const ruleChoices=CHOICES;
if(typeof window!=='undefined'){
  window.MathDreamweaverSteps=Object.freeze({explainDerivative,checkNextRule,ruleChoices});
}
