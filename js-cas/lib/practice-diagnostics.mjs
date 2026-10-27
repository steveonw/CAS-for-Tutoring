/* Evidence-based, limited Calculus I misconception patterns.
 * We label a mistake ONLY when an actual candidate expression symbolically
 * matches a specific constructed wrong derivative AND differs from the
 * recorded final derivative at a point allowed by the original domain.
 * Never invent intermediate transformations.
 */
import {ComputeEngine} from '@cortex-js/compute-engine';
import {describeDerivativeDomain,describeCalculatorDomain} from './domain-guard.mjs';
const ce=new ComputeEngine();
const PROBES=[0.2,0.45,0.85,1,1.5,2,3,-0.5,-1.5,-2];
function parsed(tex){return ce.parse(tex);}
function tex(node){return ce.box(node,{canonical:false}).latex;}
function equivalent(candidate,expression){
  try{
    const other=typeof expression==='string'?parsed(expression):expression;
    return JSON.stringify(candidate.json)===JSON.stringify(other.json) ||
      candidate.isEqual(other)===true;
  }catch{return false;}
}
function evaluate(expr,x){
  try{
    const n=expr.subs({x:ce.number(x)}).N();
    const real=Number(n.re), imaginary=Number(n.im??0);
    return Number.isFinite(real)&&Number.isFinite(imaginary)&&
      Math.abs(imaginary)<1e-9*Math.max(1,Math.abs(real))?real:null;
  }catch{return null;}
}
function witnessedDifference(a,b,domain){
  for(const x of PROBES){
    if(domain.at(x)!=='allowed')continue;
    const one=evaluate(a,x),two=evaluate(b,x);
    if(one===null||two===null)continue;
    if(Math.abs(one-two)>1e-7*Math.max(1,Math.abs(one),Math.abs(two)))return x;
  }
  return null;
}
function differentiatedLatex(json){
  try{
    const trace=parsed(tex(json)).explain('D',{variable:'x'});
    return trace?.result?.latex??null;
  }catch{return null;}
}
function outerWithoutChain(ast){
  if(!Array.isArray(ast))return null;
  const type=ast[0],arg=ast[1];
  if(!arg)return null;
  const u=tex(arg);
  switch(type){
    case 'Sin':return '\\cos\\left('+u+'\\right)';
    case 'Cos':return '-\\sin\\left('+u+'\\right)';
    case 'Ln':return '\\frac{1}{'+u+'}';
    case 'Exp':return '\\exp\\left('+u+'\\right)';
    case 'Sqrt':return '\\frac{1}{2\\sqrt{'+u+'}}';
    case 'Power':{
      const n=ast[2];
      if(typeof n==='number'&&n!==0)return n+'\\left('+u+'\\right)^{'+(n-1)+'}';
      if(arg==='ExponentialE')return '\\exponentialE^{'+tex(ast[2])+'}';
      return null;
    }
    default:return null;
  }
}
function omittedConstant(ast,answerTex){
  if(!Array.isArray(ast))return null;
  if(!['Multiply','InvisibleOperator'].includes(ast[0]))return null;
  const coefficient=ast.slice(1).find(x=>typeof x==='number'&&x!==0&&x!==1);
  if(coefficient===undefined)return null;
  return '\\frac{'+answerTex+'}{'+coefficient+'}';
}
function forgottenAdditiveConstant(ast,answerTex){
  if(!Array.isArray(ast)||!['Add','Subtract'].includes(ast[0]))return null;
  const constant=ast.slice(1).find(x=>typeof x==='number'&&x!==0);
  return constant===undefined?null:'\\left('+answerTex+'\\right)+('+constant+')';
}
function quotientWrongPlus(ast){
  if(!Array.isArray(ast)||ast[0]!=='Divide')return null;
  const f=tex(ast[1]),g=tex(ast[2]);
  const fp=differentiatedLatex(ast[1]),gp=differentiatedLatex(ast[2]);
  if(!fp||!gp)return null;
  return '\\frac{\\left('+g+'\\right)\\left('+fp+'\\right)+\\left('+f+
    '\\right)\\left('+gp+'\\right)}{\\left('+g+'\\right)^2}';
}
const MISTAKES=[
 {code:'chain-inner-derivative',message:'Your line matches differentiating the outside only. The chain rule also multiplies by the derivative of the inside. Identify the inner function and differentiate it.',guess:(ast)=>outerWithoutChain(ast)},
 {code:'quotient-sign',message:'Your line matches adding the quotient-rule contributions, but the quotient rule uses u′v − uv′ over v². Recheck the subtraction.',guess:(ast)=>quotientWrongPlus(ast)},
 {code:'constant-multiple',message:'Your line drops the numerical coefficient. The constant-multiple rule keeps that factor while you differentiate the variable part.',guess:(ast,answer)=>omittedConstant(ast,answer)},
 {code:'constant-not-zero',message:'Your line appears to keep an added constant. The derivative of a numerical constant is zero.',guess:(ast,answer)=>forgottenAdditiveConstant(ast,answer)}
];
export function diagnoseCommonMistake(trace,studentLatex){
  if(!trace||!trace.originalLatex||!trace.resultLatex)return null;
  let student,actual,domain,ast;
  try{
    student=parsed(studentLatex);actual=parsed(trace.resultLatex);
    ast=ce.parse(trace.originalLatex,{canonical:false}).json;
    domain=trace.sourceExpression
      ? describeCalculatorDomain(trace.sourceExpression,{derivative:true})
      : describeDerivativeDomain(trace.originalLatex,{derivative:true});
  }catch{return null;}
  // Product rule: if the derivative has a sum of two or more contributions,
  // a single summand is a verifiable omitted-term pattern.
  if(trace.steps?.[0]?.family==='product' && Array.isArray(actual.json) &&
    actual.json[0]==='Add' && actual.json.length>=3){
    for(const term of actual.json.slice(1)){
      try{
        if(equivalent(student,ce.box(term)) &&
          witnessedDifference(student,actual,domain)!==null){
          return {status:'mistake',code:'product-missing-term',
            message:'Your line contains only one product-rule contribution. Differentiate each factor in turn: u′v + uv′. Do not drop the other term.'};
        }
      }catch{ /* A not-yet-recognized term is not a diagnosis. */ }
    }
  }
  for(const pattern of MISTAKES){
    try{
      const guessed=pattern.guess(ast,trace.resultLatex);
      if(guessed && equivalent(student,guessed) &&
        witnessedDifference(student,actual,domain)!==null){
        return {status:'mistake',code:pattern.code,message:pattern.message};
      }
    }catch{/* Unsupported structure must never become an invented diagnosis. */}
  }
  return null;
}
