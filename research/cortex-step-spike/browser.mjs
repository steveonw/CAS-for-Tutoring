import { ComputeEngine } from "@cortex-js/compute-engine";
import { loadIntegrationRules } from "@cortex-js/compute-engine/integration-rules";
const ce = new ComputeEngine();
loadIntegrationRules(ce);
if(typeof window!=="undefined"){
  window.StepEngineResearch={
    explain:(tex,operation="D",variable="x")=>{
      const trace=ce.parse(tex).explain(operation,{variable});
      return {result:trace.result.latex,steps:trace.steps.map(s=>({latex:s.value.latex,description:s.description,id:s.id}))};
    }
  };
}
