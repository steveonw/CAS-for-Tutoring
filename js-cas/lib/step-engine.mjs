/* Real CortexJS recorded derivative steps with student-facing rule labels.
 * Keep the original rule IDs; corrections such as "constant multiple" must
 * be justified by the before/after expression AST, never guessed from text.
 */
import { ComputeEngine } from '@cortex-js/compute-engine';
import {describeDerivativeDomain,describeCalculatorDomain,extraStudentDomainHole,originalDomainNotes,parseCalculatorRaw,calculatorToLatex} from './domain-guard.mjs';
import {diagnoseCommonMistake} from './practice-diagnostics.mjs';
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
    sourceExpression:typeof options.sourceExpression==='string' && options.sourceExpression.length<=180 ? options.sourceExpression : null,
    domainNotes:originalDomainNotes(original,options.sourceExpression),
    domainScope:'partial — known restrictions only, not a full mathematical domain proof',
    initialLatex:trace.initial.latex,
    resultLatex:trace.result.latex,
    steps, agreement:checked.agreement, verification:checked.verification,
    provenance:'CortexJS Compute Engine explain(D) — recorded symbolic transformations'
  };
}
function variableOccurs(node) {
  if(node==='x')return true;
  return Array.isArray(node) && node.slice(1).some(variableOccurs);
}
function compositeOutside(node) {
  if(!Array.isArray(node))return false;
  const type=node[0],base=node[1],exponent=node[2];
  if(type==='Power'){
    // (f(x))^n and a^(g(x)) are composite when the inner expression is
    // not just x. A plain x^5 does not earn a separate chain choice.
    return (variableOccurs(base) && base!=='x') ||
      (!variableOccurs(base) && variableOccurs(exponent) && exponent!=='x');
  }
  if(['Sin','Cos','Tan','Sec','Csc','Cot','Ln','Sqrt','Exp',
    'Arcsin','Arccos','Arctan'].includes(type)) {
    return variableOccurs(base) && base!=='x';
  }
  return false;
}
export function assessNextRule(trace,viewedIndex,selectedFamily) {
  if(!trace || !Array.isArray(trace.steps) || !Number.isInteger(viewedIndex))
    return {correct:false,message:'No recorded rule to check.'};
  const next=trace.steps[viewedIndex+1];
  if(!next)return {correct:false,message:'The recorded steps are complete.'};
  if(selectedFamily===next.family)return {
    correct:true,alternative:false,
    message:'Correct — the next recorded rule is '+next.rule+'.'
  };
  // The engine chooses one legal decomposition; Calc I students can
  // correctly call a composite power or exponential a chain-rule problem.
  if(viewedIndex===-1 && selectedFamily==='chain') {
    let ast;
    try {ast=trace.sourceExpression
      ? parseCalculatorRaw(trace.sourceExpression)
      : engine.parse(trace.originalLatex,{canonical:false}).json;}catch{return {
      correct:false,message:'Not this recorded rule. Try a hint.'
    };}
    if(compositeOutside(ast) && ['power','exponential','known','chain'].includes(next.family)){
      return {
        correct:true,alternative:true,
        message:'Correct — this is a chain-rule composition. The engine records '+
          next.rule+' first, then differentiates the inside. Both descriptions are valid.'
      };
    }
  }
  return {correct:false,message:'Not quite. Think about the outside structure, or ask for a hint.'};
}
export function checkNextRule(trace,viewedIndex,selectedFamily){
  return assessNextRule(trace,viewedIndex,selectedFamily).correct;
}
// Interactive student practice is intentionally conservative. Exact parsed
// matches are accepted as the expected recorded step. Verified symbolic
// equivalence is reported separately; numeric samples can DISPROVE identity
// but never establish it or certify domain restrictions.
const STUDENT_TEX_COMMANDS=new Set([
  'frac','dfrac','tfrac','sqrt','sin','cos','tan','sec','csc','cot',
  'arcsin','arccos','arctan','sinh','cosh','tanh','ln','exp',
  'pi','cdot','times','left','right','exponentialE'
]);
function validateStudentLatex(input) {
  const source=normalizeText(input,360);
  if(!/^[A-Za-z0-9+\-*/^().,=\s\\{}\[\]]+$/.test(source))
    throw new Error('Use mathematical LaTeX only; no custom commands or HTML.');
  const commands=[...source.matchAll(/\\([A-Za-z]+)/g)].map(m=>m[1]);
  if(commands.some(name=>!STUDENT_TEX_COMMANDS.has(name)) ||
    source.replace(/\\[A-Za-z]+/g,'').includes('\\'))
    throw new Error('Only elementary math LaTeX commands are supported (use \\ln, not \\log).');
  return source;
}
function parsedOrError(latex) {
  const expression=engine.parse(latex);
  if(!expression || expression.isValid===false)
    throw new Error('This line could not be parsed as a valid mathematical expression.');
  return expression;
}
function structuralMatch(a,b) {
  return JSON.stringify(a.json)===JSON.stringify(b.json);
}
function sampledCounterexample(a,b,originalLatex,sourceExpression) {
  const checks=[0.2,0.45,0.7,0.85,1.2,1.8,2.5,-0.75,-1.5,-2,0,1,3];
  let domain;
  try{domain=sourceExpression
    ? describeCalculatorDomain(sourceExpression,{derivative:true})
    : describeDerivativeDomain(originalLatex,{derivative:true});}
  catch{return null;}
  let samplesChecked=0;
  for(const x of checks){
    if(domain.at(x)!=='allowed')continue;
    const aValue=finiteReal(a,x),bValue=finiteReal(b,x);
    if(aValue===null || bValue===null) continue;
    samplesChecked++;
    if(Math.abs(aValue-bValue)>1e-7*Math.max(1,Math.abs(aValue),Math.abs(bValue)))
      return {x,got:aValue,expected:bValue,samplesChecked};
  }
  return null;
}
// A student is free to take a valid shortcut; the engine's intermediate
// unevaluated d/dx states are TEACHING aids, not mandatory answer syntax.
// Accept an actually recorded later state or final derivative, without
// claiming that symbolic equality proves domain or the student's method.
function sameKnownMath(proposed,expected,trace) {
  try{
    if(structuralMatch(proposed,expected))return true;
    const proved=proposed.isEqual(expected)===true ||
      JSON.stringify(proposed.simplify().json)===JSON.stringify(expected.simplify().json);
    if(!proved)return false;
    return !sampledCounterexample(proposed,expected,
      trace.originalLatex,trace.sourceExpression);
  }catch{return false;}
}
function advancedResult(trace,viewedIndex,targetIndex,isExact) {
  const jump=targetIndex-viewedIndex;
  const final=targetIndex===trace.steps.length-1;
  const unproved=isExact ? '' :
    ' Symbolic equivalence is supported by the engine, but domain and method restrictions still matter.';
  return {
    status:jump===1?(isExact?'matched':'equivalent'):'advanced',
    advanceTo:targetIndex,skippedCount:Math.max(0,jump-1),
    final,
    message:final && jump>1
      ? 'Correct derivative — you completed '+jump+' recorded steps at once. You can review the intermediate rules if useful.'+unproved
      :jump>1
        ? 'Correct — your expression reaches recorded step '+(targetIndex+1)+
          ', advancing '+jump+' steps. You can review the skipped explanations.'+unproved
        :(isExact?'Correct — your line matches the next recorded transformation.':
          'Correct — your line is equivalent to the next recorded state under the engine assumptions.')+unproved
  };
}
export function checkStudentStep(trace, viewedIndex, latex, options={}) {
  if(!trace || !Array.isArray(trace.steps) || !Number.isInteger(viewedIndex) ||
    viewedIndex < -1 || viewedIndex>=trace.steps.length)
    return {status:'invalid',message:'No active recorded step to check.'};
  const steps=trace.steps, next=steps[viewedIndex+1];
  if(!next)return {status:'complete',message:'You reached the end of the recorded steps.'};
  if(trace.verification?.status==='conflict')
    return {status:'unverified',message:'The symbolic engines disagree; this answer cannot be graded safely.'};
  if(typeof latex!=='string' || !latex.trim())
    return {status:'invalid',message:'Enter a mathematical expression first.'};

  // Only source-generated TeX gets the exact-matching exception for macros
  // not allowed in free-form student input, e.g. an unevaluated d/dx.
  const sourceMatch=steps.findIndex((step,i)=>i>viewedIndex && step.latex===latex.trim());
  if(sourceMatch>=0){
    const hole=extraStudentDomainHole(trace.originalLatex,steps[sourceMatch].latex,latex,{
      originalSource:trace.sourceExpression,studentSource:options.calculatorSource
    });
    if(hole)return {status:'domain-mismatch',x:hole.x,message:hole.message};
    return advancedResult(trace,viewedIndex,sourceMatch,true);
  }
  let proposed;
  try {
    proposed=parsedOrError(validateStudentLatex(latex));
  }catch(error){return {status:'invalid',message:error.message};}

  // Favor mathematically justified later states and the complete answer;
  // the machine trace may contain unevaluated D() expressions that a
  // student cannot reasonably enter using calculator notation.
  for(let i=viewedIndex+1;i<steps.length;i++){
    let candidate;
    try{candidate=parsedOrError(steps[i].latex);}catch{continue;}
    if(!sameKnownMath(proposed,candidate,trace))continue;
    const hole=extraStudentDomainHole(trace.originalLatex,steps[i].latex,latex,{
      originalSource:trace.sourceExpression,studentSource:options.calculatorSource
    });
    if(hole)return {status:'domain-mismatch',x:hole.x,message:hole.message};
    return advancedResult(trace,viewedIndex,i,structuralMatch(proposed,candidate));
  }
  // The final CAS derivative is also a mathematically valid shortcut,
  // regardless of how many unevaluated engine stages it bypasses.
  try {
    const final=parsedOrError(trace.resultLatex);
    if(sameKnownMath(proposed,final,trace)){
      const hole=extraStudentDomainHole(trace.originalLatex,trace.resultLatex,latex,{
        originalSource:trace.sourceExpression,studentSource:options.calculatorSource
      });
      if(hole)return {status:'domain-mismatch',x:hole.x,message:hole.message};
      return advancedResult(trace,viewedIndex,steps.length-1,
        structuralMatch(proposed,final));
    }
  }catch{/* Unsupported: report uncertainty instead of inventing success. */}

  // If no correct later state matched, check known mistake patterns with
  // an actual counterexample, then the immediate expected step.
  const mistake=diagnoseCommonMistake(trace,latex);
  if(mistake)return mistake;
  let required;
  try{required=parsedOrError(next.latex);}
  catch{return {status:'unverified',message:'The intermediate rule requires notation this checker cannot interpret. Ask for a hint or reveal it.'};}
  const hole=extraStudentDomainHole(trace.originalLatex,next.latex,latex,{
    originalSource:trace.sourceExpression,studentSource:options.calculatorSource
  });
  if(hole)return {status:'domain-mismatch',x:hole.x,message:hole.message};
  const example=sampledCounterexample(proposed,required,trace.originalLatex,trace.sourceExpression);
  if(example)return {status:'counterexample',x:example.x,
    message:'The expressions differ at x = '+example.x+'. Review the '+next.rule+' and check each term.'};
  return {status:'unverified',message:'I could not verify this line against the recorded rule or the final derivative. That does not mean your reasoning is necessarily wrong; try a hint or reveal the step.'};
}
export {calculatorToLatex};
export const ruleChoices=CHOICES;
if(typeof window!=='undefined'){
  window.MathDreamweaverSteps=Object.freeze({
    explainDerivative,checkNextRule,assessNextRule,checkStudentStep,calculatorToLatex,ruleChoices
  });
}
