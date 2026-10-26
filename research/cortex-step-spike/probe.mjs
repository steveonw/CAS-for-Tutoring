import { ComputeEngine } from "@cortex-js/compute-engine";
import { loadIntegrationRules } from "@cortex-js/compute-engine/integration-rules";
import fs from "node:fs";
const ce = new ComputeEngine();
const tests = [
  { id:"algebra-cancellation",expr:"\\frac{x^2-1}{x-1}",operation:"simplify" },
  { id:"solve-linear",expr:"2x+1=5",operation:"solve",variable:"x" },
  { id:"chain-rule",expr:"(x^2+3)^4",operation:"D",variable:"x" },
  { id:"product-rule",expr:"x\\sin x",operation:"D",variable:"x" },
  { id:"quotient-rule",expr:"\\frac{x^2+1}{x}",operation:"D",variable:"x" },
  { id:"basic-integral",expr:"\\int x^2\\,dx",operation:"Integrate",variable:"x" },
  { id:"rubi-integral",expr:"\\int x\\sqrt{1+x}\\,dx",operation:"Integrate",variable:"x" }
];
let loaded = false;
let failed = 0;
const report = [];
for (const test of tests) {
  const row = { name:test.id,operation:test.operation,input:test.expr };
  try {
    if (test.operation === "Integrate" && !loaded) { loadIntegrationRules(ce); loaded=true; }
    const expr = ce.parse(test.expr);
    const trace = expr.explain(test.operation, {variable:test.variable||"x"});
    row.initial = trace.initial.latex;
    row.result = trace.result.latex;
    row.steps = trace.steps.map(step=>({id:step.id,description:step.description,latex:step.value.latex}));
    row.ok = row.steps.length>0 && typeof row.result ==="string";
    if (!row.ok) failed++;
    console.log("CASE",test.id,"OK",row.ok,"STEPS",row.steps.length,"RESULT",row.result);
    row.steps.slice(0,10).forEach((s,i)=>console.log(i+1,s.id,s.description,s.latex));
  } catch(e) {
    row.ok=false;row.error=String(e);failed++;
    console.log("CASE",test.id,"ERROR",row.error);
  }
  report.push(row);
}
fs.mkdirSync("reports",{recursive:true});
fs.writeFileSync("reports/probe.json",JSON.stringify({version:"0.159.0",tests:report},null,2)+"\n");
if(failed){console.log("FAILURES",failed);process.exitCode=1;}
else console.log("ALL TESTS PASSED",tests.length);
