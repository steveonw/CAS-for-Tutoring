
require("./engine.js");
const M = globalThis.MathLabEngine;
let examples=[
 ["(x^2+3)^4","diff"],
 ["x^3+2x^2-5","diff"],
 ["(x^2+1)*(x^3-2)","diff"],
 ["(x^2+1)/(x+1)","diff"],
 ["sin(x^2)","diff"],
 ["exp(3*x)","diff"],
 ["ln(x^2+1)","diff"],
 ["3*x^2+2*x","integrate"],
 ["sin(3*x+2)","integrate"],
 ["1/x","integrate"],
 ["2*x*(x^2+1)^3","integrate"],
 ["(2x+1)^3","integrate"]
];
for (const [expr,mode] of examples) {
 try{
  let r=M.solve(expr,mode);
  console.log(expr,mode,"=>",r.answer,"steps:",r.steps.length);
 }catch(e){console.log("ERROR",expr,e.message);}
}
