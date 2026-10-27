/* v0.6: evidence-backed derivative component analysis, independent of the
 * particular sequence of CortexJS explain(D) steps.
 * A diagnosis is emitted ONLY after recognizing a supported original
 * composition, confirming its chain derivative, and witnessing that the
 * student's submitted expression differs from the correct derivative on
 * the original recognized real domain.
 *
 * For an incorrect inner factor, inspect the unsimplified AST and match
 * the outer factors structurally. Do NOT divide by the outer derivative:
 * cancellation can erase zeros and invent domain equivalence.
 */
import {ComputeEngine} from '@cortex-js/compute-engine';
import {parseCalculatorRaw,describeCalculatorDomain,describeDerivativeDomain} from './domain-guard.mjs';

const ce=new ComputeEngine();
const PROBES=[-3,-2,-1.5,-0.75,0.2,0.45,0.85,1,1.5,2,3];
function tex(node){return ce.box(node,{canonical:false}).latex;}
function checkedParse(s){
  const expr=ce.parse(s);
  if(!expr||expr.isValid===false)return null;
  return expr;
}
function eq(a,b){
  if(!a||!b || a.isValid===false || b.isValid===false)return false;
  try {
    return JSON.stringify(a.json)===JSON.stringify(b.json) ||
      a.isEqual(b)===true ||
      JSON.stringify(a.simplify().json)===JSON.stringify(b.simplify().json);
  }catch{return false;}
}
function box(node){try{return checkedParse(tex(node));}catch{return null;}}
function real(expr,x){
  try{
    const val=expr.subs({x:ce.number(x)}).N();
    const re=Number(val.re),im=Number(val.im??0);
    return Number.isFinite(re)&&Number.isFinite(im) &&
      Math.abs(im)<1e-9*Math.max(1,Math.abs(re))?re:null;
  }catch{return null;}
}
function originalDomain(trace){
  return trace.sourceExpression
    ? describeCalculatorDomain(trace.sourceExpression,{derivative:true})
    : describeDerivativeDomain(trace.originalLatex,{derivative:true});
}
function counterexample(student,correct,domain){
  for(const x of PROBES){
    if(domain.at(x)!=='allowed')continue;
    const a=real(student,x),b=real(correct,x);
    if(a===null||b===null)continue;
    if(Math.abs(a-b)>1e-7*Math.max(1,Math.abs(a),Math.abs(b)))return x;
  }
  return null;
}
function varies(node){
  return node==='x'||Array.isArray(node)&&node.slice(1).some(varies);
}
function sourceTree(trace){
  return trace.sourceExpression?parseCalculatorRaw(trace.sourceExpression):
    ce.parse(trace.originalLatex,{canonical:false}).json;
}
// A conservative supported subset. Broader arbitrary f^g and singular
// composition cases fall through to the existing non-committal checker.
function chainStructure(tree){
  if(!Array.isArray(tree))return null;
  const kind=tree[0],first=tree[1],second=tree[2];
  const inside=kind==='Power' && ['ExponentialE','E','e'].includes(first)
    ? second:first;
  if(!inside || !varies(inside) || inside==='x')return null;
  let outerParts;
  switch(kind){
    case 'Power':{
      if(['ExponentialE','E','e'].includes(first)) {
        outerParts=[['Power','ExponentialE',inside]];
      }else{
        if(typeof second!=='number'||!Number.isFinite(second)||second===0)
          return null;
        outerParts=[second,['Power',inside,second-1]];
      }
      break;
    }
    case 'Sin':outerParts=[['Cos',inside]];break;
    case 'Cos':outerParts=[-1,['Sin',inside]];break;
    case 'Ln':outerParts=[['Divide',1,inside]];break;
    case 'Exp':outerParts=[['Exp',inside]];break;
    case 'Sqrt':outerParts=[['Divide',1,['Multiply',2,['Sqrt',inside]]]];break;
    default:return null;
  }
  return {inside,outerParts,kind};
}
function factors(raw,result=[]){
  if(Array.isArray(raw)&&['Multiply','InvisibleOperator'].includes(raw[0])){
    raw.slice(1).forEach(f=>factors(f,result));
  }else if(Array.isArray(raw)&&raw[0]==='Delimiter'){
    factors(raw[1],result);
  }else if(Array.isArray(raw)&&raw[0]==='Negate'){
    result.push(-1);factors(raw[1],result);
  }else result.push(raw);
  return result;
}
function studentTree(latex,options){
  try{return options.calculatorSource
    ? parseCalculatorRaw(options.calculatorSource)
    : ce.parse(latex,{canonical:false}).json;
  }catch{return null;}
}
function matchOuterFactors(originalParts,allStudentFactors){
  const left=allStudentFactors.slice();
  for(const expected of originalParts){
    const e=box(expected);
    const idx=left.findIndex(f=>eq(box(f),e));
    if(idx<0)return null;
    left.splice(idx,1);
  }
  return left;
}
function multiplyFactors(items){
  if(items.length===0)return checkedParse('1');
  return checkedParse(items.map(item=>'\\left('+tex(item)+'\\right)').join('\\cdot'));
}
function safeHints(plan,reason){
  const inside=plan.innerLatex;
  const clue=reason==='incorrect'
    ? 'You have the outside derivative. Check the factor from the inside.'
    : reason==='missing'
      ? 'The outside derivative is correct. What is still needed from the inside?'
      : 'Separate the outside operation from the inside expression.';
  return [
    {level:1,title:'Small clue',text:clue},
    {level:2,title:'Targeted question',
      text:'Let u = '+inside+'. What is du/dx? Try differentiating the inside before revealing the worked line.',
      latex:'u='+inside},
    {level:3,title:'Worked explanation',
      text:'For u = '+inside+', the inner derivative is u′ = '+plan.innerDerivativeLatex+
        '. Multiply it by the outside derivative to complete the chain rule.',
      latex:'\\frac{d}{dx}f(x)='+plan.expectedLatex}
  ];
}
export function getChainPlan(trace){
  if(!trace||typeof trace.originalLatex!=='string'||typeof trace.resultLatex!=='string')
    return null;
  let tree;
  try{tree=sourceTree(trace);}catch{return null;}
  const structure=chainStructure(tree);
  if(!structure)return null;
  try{
    const innerLatex=tex(structure.inside);
    const inner=checkedParse(innerLatex);
    const derivative=inner?.explain('D',{variable:'x'})?.result;
    if(!derivative || !derivative.latex)return null;
    const outerLatex=structure.outerParts.map(p=>'\\left('+tex(p)+'\\right)').join('\\cdot');
    const outer=checkedParse(outerLatex);
    const expectedLatex=outerLatex+'\\cdot\\left('+derivative.latex+'\\right)';
    const expected=checkedParse(expectedLatex);
    const result=checkedParse(trace.resultLatex);
    // Never describe mathematical parts when CortexJS cannot establish
    // that the decomposition is the actual derivative.
    if(!eq(expected,result) || !outer)return null;
    return {
      rule:'chain',outerLatex,innerLatex,
      innerDerivativeLatex:derivative.latex,expectedLatex,
      outerParts:structure.outerParts,innerTree:structure.inside
    };
  }catch{return null;}
}
export function getProgressiveHints(trace,viewedIndex=-1){
  if(!trace?.steps?.length || viewedIndex>=trace.steps.length-1)return [];
  if(viewedIndex===-1){
    const plan=getChainPlan(trace);
    if(plan)return safeHints(plan,'general');
  }
  const step=trace.steps[viewedIndex+1];
  return [
    {level:1,title:'Small clue',text:'Look at the structure of the expression and identify the next applicable rule.'},
    {level:2,title:'Targeted question',text:step.hint},
    {level:3,title:'Worked explanation',text:step.reason,latex:step.latex}
  ];
}
export function diagnoseDerivativeParts(trace,studentLatex,options={}) {
  const plan=getChainPlan(trace);
  if(!plan)return null;
  const student=checkedParse(studentLatex),correct=checkedParse(trace.resultLatex);
  if(!student||!correct)return null;
  let domain;
  try{domain=originalDomain(trace);}catch{return null;}
  const witness=counterexample(student,correct,domain);
  // Do not use this diagnostic when the candidate is correct, or when
  // the original domain cannot provide a meaningful counterexample.
  if(witness===null)return null;
  const outer=checkedParse(plan.outerLatex);
  if(!outer)return null;
  let reason,remainingLatex;
  if(eq(student,outer)) {
    reason='missing';
    remainingLatex=null;
  }else{
    const raw=studentTree(studentLatex,options);
    if(!raw)return null;
    const leftover=matchOuterFactors(plan.outerParts,factors(raw));
    if(!leftover)return null;
    const innerAttempt=multiplyFactors(leftover);
    const actualInner=checkedParse(plan.innerDerivativeLatex);
    if(!innerAttempt || !actualInner || eq(innerAttempt,actualInner))return null;
    reason=eq(innerAttempt,checkedParse('1'))?'missing':'incorrect';
    remainingLatex=reason==='incorrect' ? innerAttempt.latex : null;
  }
  const message=reason==='missing'
    ? 'Your outside derivative is correct. The inside is u = '+plan.innerLatex+
      '; its derivative must also be multiplied by the outside derivative.'
    : 'Your outside derivative is correct, but the factor for the inside u = '+
      plan.innerLatex+' needs correction. Differentiate u before multiplying.';
  const hints=safeHints(plan,reason);
  return {
    status:'mistake',
    code:reason==='missing'?'chain-inner-derivative':'chain-inner-incorrect',
    message,rule:'chain',
    recognized:[{part:'outer',latex:plan.outerLatex,evidence:'symbolic factors'}],
    problemPart:{part:'inner',kind:reason,latex:plan.innerLatex,
      submittedFactorLatex:remainingLatex},
    hints,evidence:{method:'structural factor match and real-domain counterexample',
      x:witness},partialScope:true
  };
}
