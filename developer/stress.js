
require("./engine.js");
const M=globalThis.MathLabEngine;
let derivativeExprs=[
"x^2","x^3+3x-5","(x^2+3)^4","sin(x^2)","cos(3x)","tan(x)",
"exp(2x+1)","ln(x^2+1)","sqrt(x^2+4)","abs(x)","(x^2+1)/(x+1)",
"(x+1)(x-1)","x^3/2","x^x","2^x","1/(x^2+1)","x^-2",
"sin(x)*cos(x)","-x^2","x^2+x^2", "(x^2+1)^(-2)", "sqrt(x)"
];
let integrals=["x","3*x^2+2*x","1/x","1/(3x+1)","cos(2x)","sin(3x+2)",
"exp(-2x)","x^4","2x*(x^2+1)^3","(2x+1)^3","ln(x)","x^-3","sqrt(x)"];
let passed=0,failed=0;
function test(src, mode){
 try{
   let r=M.solve(src,mode);
   for(const q of [-2.1,-1.5,-0.7,0.4,0.9,1.3,2.2]){
      let f=M.evalAt(mode==="diff"?r.node:r.result,q);
      let g=M.evalAt(mode==="diff"?r.result:r.node,q);
      const h=0.00002;
      let up=M.evalAt(mode==="diff"?r.node:r.result,q+h);
      let down=M.evalAt(mode==="diff"?r.node:r.result,q-h);
      if(![f,g,up,down].every(Number.isFinite) || Math.max(Math.abs(f),Math.abs(g))>1e8) continue;
      let approx=(up-down)/(2*h);
      if(Math.abs(approx-g)>0.003*Math.max(1,Math.abs(g))){
        failed++; console.log("FAIL",mode,src,"at x",q,"math",g,"numeric",approx,"answer",r.answer);return;
      }
   }
   passed++;
 }catch(e){
   failed++;console.log("ERROR",mode,src,e.message);
 }
}
derivativeExprs.forEach(x=>test(x,"diff"));
integrals.forEach(x=>test(x,"integrate"));
for(const src of ["cos(x)","ln(x^2+1)","(x^2+3)^4","2x^2+4x-1","x/(x+1)"]){
 let p=M.parse(src),text=M.text(p),q=M.parse(text);
 for(const x of [0.4,1.3,-1.8]){
   let a=M.evalAt(p,x),b=M.evalAt(q,x);
   if(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)>1e-9) {failed++;console.log("ROUNDTRIP FAIL",src,text,x,a,b);}
 }
}
console.log("TEST TOTAL",passed,"passed",failed,"failed");
if(failed)process.exitCode=1;
