/* Conservative REAL-domain guards for student work.
 * This is deliberately a PARTIAL structural scanner, not a general
 * real-domain solver. It reads non-canonical MathJSON so a cancellation
 * cannot silently erase a denominator or a logarithm restriction.
 */
import {ComputeEngine} from '@cortex-js/compute-engine';
const ce=new ComputeEngine();
const SAMPLE_POINTS=Object.freeze([-4,-3,-2,-1.5,-1,-0.5,0,0.2,0.45,0.85,1,1.2,1.8,2,2.5,3,4]);

function finite(value) {return typeof value==='number' && Number.isFinite(value);}
function numberOf(node) {
  if(finite(node)) return node;
  if(node && typeof node==='object' && 'num' in node) {
    const raw=String(node.num);
    if(raw.includes('/')) {
      const parts=raw.split('/').map(Number);
      return parts.length===2 && parts[1]!==0 ? parts[0]/parts[1] : NaN;
    }
    return Number(raw);
  }
  return NaN;
}
function numeric(node,x) {
  if(!Array.isArray(node)) {
    if(node==='x')return x;
    if(node==='Pi')return Math.PI;
    if(node==='ExponentialE'||node==='E')return Math.E;
    return numberOf(node);
  }
  const args=node.slice(1).map(n=>numeric(n,x));
  if(args.some(n=>!finite(n))) return NaN;
  switch(node[0]) {
    case 'Delimiter':return args[0];
    case 'Add':return args.reduce((a,b)=>a+b,0);
    case 'Subtract':return args[0]-args[1];
    case 'Negate':return -args[0];
    case 'Multiply':case 'InvisibleOperator':return args.reduce((a,b)=>a*b,1);
    case 'Divide':return args[1]!==0?args[0]/args[1]:NaN;
    case 'Power':return Math.pow(args[0],args[1]);
    case 'Sqrt':return args[0]>=0?Math.sqrt(args[0]):NaN;
    case 'Root':return Math.pow(args[0],1/args[1]);
    case 'Ln':return args[0]>0?Math.log(args[0]):NaN;
    case 'Log':return args[0]>0?Math.log10(args[0]):NaN;
    case 'Exp':return Math.exp(args[0]);
    case 'Abs':return Math.abs(args[0]);
    case 'Sin':return Math.sin(args[0]);
    case 'Cos':return Math.cos(args[0]);
    case 'Tan':return Math.tan(args[0]);
    case 'Sec':return 1/Math.cos(args[0]);
    case 'Csc':return 1/Math.sin(args[0]);
    case 'Cot':return 1/Math.tan(args[0]);
    case 'Arcsin':case 'ArcSin':return Math.asin(args[0]);
    case 'Arccos':case 'ArcCos':return Math.acos(args[0]);
    case 'Arctan':case 'ArcTan':return Math.atan(args[0]);
    default:return NaN;
  }
}
function linear(node) {
  if(node==='x')return [1,0];
  const value=numberOf(node);
  if(finite(value))return [0,value];
  if(!Array.isArray(node))return null;
  const a=node.slice(1).map(linear);
  if(a.some(v=>!v))return null;
  switch(node[0]){
    case 'Delimiter':return a[0];
    case 'Add':return a.reduce((p,v)=>[p[0]+v[0],p[1]+v[1]],[0,0]);
    case 'Subtract':return [a[0][0]-a[1][0],a[0][1]-a[1][1]];
    case 'Negate':return [-a[0][0],-a[0][1]];
    case 'Multiply':case 'InvisibleOperator':{
      let total=[0,1];
      for(const v of a) {
        if(total[0]!==0 && v[0]!==0)return null;
        total=[total[0]*v[1]+v[0]*total[1],total[1]*v[1]];
      }
      return total;
    }
    case 'Divide':return a[1][0]===0 && a[1][1]!==0
      ? [a[0][0]/a[1][1],a[0][1]/a[1][1]] : null;
    case 'Power':return a[1][0]===0 && a[1][1]===1 ? a[0] : null;
    default:return null;
  }
}
function label(node) {
  try{return ce.box(node,{canonical:false}).latex;} catch {return 'a subexpression';}
}
function parseRaw(latex) {
  if(typeof latex!=='string'||!latex.trim()||latex.length>900)
    throw new Error('Domain scanner expects bounded mathematical LaTeX.');
  const result=ce.parse(latex,{canonical:false});
  if(!result || result.isValid===false)throw new Error('Unable to inspect expression domain.');
  return result.json;
}
// A small, non-evaluating parser for validated calculator syntax. It keeps
// divisions and powers intact BEFORE Nerdamer's conversion/simplification.
// This catches the new hole in 2*x^2/x, even if its TeX simplifies to 2*x.
export function parseCalculatorRaw(source) {
  if(typeof source!=='string'||!source.trim()||source.length>180||
    !/^[A-Za-z0-9+\-*/^().,\s]+$/.test(source))
    throw new Error('Calculator notation cannot be inspected safely.');
  const tokens=source.match(/(?:[A-Za-z]+|\d+(?:\.\d+)?|\.\d+|[+\-*/^(),])/g)||[];
  if(tokens.join('')!==source.replace(/\s/g,''))throw new Error('Unsupported calculator token.');
  let index=0;
  const peek=()=>tokens[index];
  const take=()=>tokens[index++];
  function eat(t){if(peek()===t){index++;return true;}return false;}
  function expect(t){if(!eat(t))throw new Error('Expected '+t+' in calculator expression.');}
  function primary(){
    if(eat('(')){const value=add();expect(')');return value;}
    const token=take();
    if(token===undefined)throw new Error('Incomplete calculator expression.');
    if(/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(token))return Number(token);
    if(token==='x')return 'x';
    if(token==='pi')return 'Pi';
    if(token==='e'||token==='E')return 'ExponentialE';
    const names={sin:'Sin',cos:'Cos',tan:'Tan',sec:'Sec',
      csc:'Csc',cot:'Cot',asin:'Arcsin',acos:'Arccos',atan:'Arctan',
      log:'Ln',sqrt:'Sqrt',abs:'Abs',exp:'Exp'};
    if(!names[token])throw new Error('Unsupported function or name: '+token);
    expect('(');const argument=add();expect(')');
    return [names[token],argument];
  }
  function power(){
    const value=primary();
    return eat('^')?['Power',value,unary()]:value;
  }
  function unary(){
    if(eat('+'))return unary();
    if(eat('-'))return ['Negate',unary()];
    return power();
  }
  function mul(){
    let result=unary();
    while(peek()==='*'||peek()==='/') {
      const op=take(),rhs=unary();
      result=op==='*'?['Multiply',result,rhs]:['Divide',result,rhs];
    }
    return result;
  }
  function add(){
    let result=mul();
    while(peek()==='+'||peek()==='-') {
      const op=take(),rhs=mul();
      result=op==='+'?['Add',result,rhs]:['Subtract',result,rhs];
    }
    return result;
  }
  const result=add();
  if(index!==tokens.length)throw new Error('Unsupported or trailing calculator symbols.');
  return result;
}
function restrictionsFor(ast,{derivative=false}={}) {
  const conditions=[],seen=new Set();
  let complete=true;
  function add(kind,operand,description,review=false) {
    const id=kind+':'+JSON.stringify(operand);
    if(seen.has(id))return;
    seen.add(id);
    const formula=label(operand);
    conditions.push({kind,operand,formula,description,review});
  }
  function visit(node) {
    if(!Array.isArray(node)) {
      if(typeof node==='string' && !['x','Pi','ExponentialE','E','Nothing'].includes(node))
        complete=false;
      return;
    }
    const type=node[0],arg=node[1];
    switch(type) {
      case 'Divide':
        add('nonzero',node[2],'Denominator '+label(node[2])+' must be nonzero.');
        break;
      case 'Power':{
        const exponent0=numeric(node[2],0),exponent1=numeric(node[2],1);
        if(finite(exponent0)&&exponent0===exponent1&&exponent0<0)
          add('nonzero',arg,'Negative power requires '+label(arg)+' to be nonzero.');
        else if(node[2]==='x')
          add('positive',arg,'For this real logarithmic-differentiation method, base '+label(arg)+' must be positive.',true);
        break;
      }
      case 'Ln':
        add('positive',arg,'The natural-log argument '+label(arg)+' must be positive.');
        break;
      case 'Log':
        add('positive',arg,'The logarithm argument '+label(arg)+' must be positive.');
        break;
      case 'Sqrt':
        add('nonnegative',arg,'A real square root requires '+label(arg)+' to be nonnegative.');
        if(derivative)
          add('nonzero',arg,'At square-root zeros, differentiability requires a separate check.',true);
        break;
      case 'Abs':
        if(derivative)
          add('nonzero',arg,'At zeros of the absolute-value argument, differentiability may fail.',true);
        break;
      case 'Tan':case 'Sec':
        add('cos-nonzero',arg,'The cosine of the argument must not be zero.');
        break;
      case 'Cot':case 'Csc':
        add('sin-nonzero',arg,'The sine of the argument must not be zero.');
        break;
      case 'Arcsin':case 'ArcSin':case 'Arccos':case 'ArcCos':
        add('unit-interval',arg,'For a real inverse trig function, the argument must lie between -1 and 1.');
        if(derivative)
          add('strict-unit',arg,'Inverse trig derivative endpoints require separate review.',true);
        break;
      case 'Add':case 'Subtract':case 'Negate':case 'Multiply':
      case 'InvisibleOperator':case 'Delimiter':case 'D':case 'Sin':
      case 'Cos':case 'Exp':case 'Arctan':case 'ArcTan':
      case 'Root':case 'Power':case 'Ln':case 'Log':case 'Sqrt':
      case 'Abs':case 'Tan':case 'Sec':case 'Csc':case 'Cot':
      case 'Arcsin':case 'ArcSin':case 'Arccos':case 'ArcCos':
        break;
      default:complete=false;
    }
    // An unevaluated D is an unknown derivative expression; restrictions
    // found inside still apply, but they do not certify completeness.
    if(type==='D')complete=false;
    node.slice(1).forEach(visit);
  }
  visit(ast);
  return {conditions,complete};
}
function checkCondition(c,x){
  const val=numeric(c.operand,x);
  if(!finite(val))return 'unknown';
  const tol=1e-10*Math.max(1,Math.abs(val));
  let valid;
  switch(c.kind){
    case 'nonzero':valid=Math.abs(val)>tol;break;
    case 'positive':valid=val>tol;break;
    case 'nonnegative':valid=val>=-tol;break;
    case 'cos-nonzero':valid=Math.abs(Math.cos(val))>1e-9;break;
    case 'sin-nonzero':valid=Math.abs(Math.sin(val))>1e-9;break;
    case 'unit-interval':valid=val>=-1 && val<=1;break;
    case 'strict-unit':valid=val>-1 && val<1;break;
    default:return 'unknown';
  }
  if(valid)return 'allowed';
  return c.review?'unknown':'excluded';
}
function describeAstDomain(ast,options={}) {
  const found=restrictionsFor(ast,options);
  const conditions=found.conditions;
  return {
    status:'partial',complete:found.complete,
    notes:conditions.map(c=>c.description),
    restrictions:conditions.map(c=>({kind:c.kind,formula:c.formula,review:c.review})),
    // These guards check *recognized* restrictions only.
    at(x){
      if(!finite(x))return 'unknown';
      let unknown=!found.complete;
      for(const c of conditions){
        const status=checkCondition(c,x);
        if(status==='excluded')return 'excluded';
        if(status==='unknown')unknown=true;
      }
      return unknown?'unknown':'allowed';
    },
    boundaryCandidates(){
      const points=[];
      for(const c of conditions){
        const pair=linear(c.operand);
        if(pair && Math.abs(pair[0])>1e-12){
          const root=-pair[1]/pair[0];
          if(finite(root) && Math.abs(root)<1e5)points.push(root);
        }
      }
      return points;
    }
  };
}
export function describeDerivativeDomain(latex,options={}) {
  return describeAstDomain(parseRaw(latex),options);
}
export function describeCalculatorDomain(source,options={}) {
  return describeAstDomain(parseCalculatorRaw(source),options);
}
export function extraStudentDomainHole(originalLatex,expectedLatex,studentLatex,options={}) {
  try{
    const original=options.originalSource
      ? describeCalculatorDomain(options.originalSource,{derivative:true})
      : describeDerivativeDomain(originalLatex,{derivative:true});
    const expected=describeDerivativeDomain(expectedLatex);
    const student=options.studentSource
      ? describeCalculatorDomain(options.studentSource)
      : describeDerivativeDomain(studentLatex);
    const points=[...SAMPLE_POINTS,...student.boundaryCandidates()];
    for(const x of new Set(points)){
      if(original.at(x)==='allowed' && expected.at(x)==='allowed' &&
        student.at(x)==='excluded'){
        return {x,message:'Domain difference at x = '+x+
          ': your line is undefined there, while the original problem and the next recorded expression allow that input. Algebraic cancellation does not restore an excluded input.'};
      }
    }
  }catch { /* Unsupported structure: never invent a domain claim. */ }
  return null;
}
export function originalDomainNotes(latex,source) {
  try{
    const domain=source
      ? describeCalculatorDomain(source,{derivative:true})
      : describeDerivativeDomain(latex,{derivative:true});
    return domain.notes;
  }catch{
    return ['The real domain could not be inspected. Any derivative must still respect the original function domain.'];
  }
}
