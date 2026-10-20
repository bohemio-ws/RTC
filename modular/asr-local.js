"use strict";
// Contrato del reconocimiento LOCAL: no utiliza servicios remotos ni Web Speech API.
// Se exige un motor instalado explícitamente; nunca se inventa una transcripción.
const rtcLocalASR={
 async transcribe(blob,engine){
  if(!(blob instanceof Blob)||blob.size===0)return {status:"NO_EVALUABLE",reason:"Audio vacío"};
  if(!engine||typeof engine.transcribe!=="function"||engine.local!==true)
   return {status:"NO_EVALUABLE",reason:"Motor de reconocimiento local no instalado"};
  try{
   const result=await engine.transcribe(blob);
   if(!result||typeof result.text!=="string"||!result.text.trim())
    return {status:"NO_EVALUABLE",reason:"No se reconoció una transmisión completa"};
   if(result.complete!==true)
    return {status:"NO_EVALUABLE",reason:"Reconocimiento parcial o incierto"};
   return {status:"OK",text:result.text.trim()};
  }catch(e){return {status:"NO_EVALUABLE",reason:"Error del reconocimiento local"}}
 }
};
