"use strict";
// RTC Academy: adaptador Whisper 100 % local. Los binarios y el modelo deben
// distribuirse en /modular/vendor/ y /modular/models/ antes de activarlo.
// No hay fallback a Web Speech API, CDN ni peticiones remotas.
const rtcOfflineEngine={
 local:true,
 complete:true,
 _pipeline:null,
 _loading:null,
 async _load(){
  if(this._pipeline)return this._pipeline;
  if(this._loading)return this._loading;
  this._loading=(async()=>{
   const runtime="./vendor/transformers.min.js";
   const runtimeCheck=await fetch(runtime,{method:"HEAD",cache:"no-store"}).catch(()=>null);
   if(!runtimeCheck?.ok)throw Error("Falta el runtime local de Whisper: "+runtime);
   const {pipeline,env}=await import("./vendor/transformers.min.js");
   env.allowRemoteModels=false;
   env.allowLocalModels=true;
   env.localModelPath=new URL("./models/",document.baseURI).pathname;
   env.backends.onnx.wasm.wasmPaths="./vendor/";
   const recognizer=await pipeline("automatic-speech-recognition","Xenova/whisper-tiny",{dtype:"q8",device:"wasm"});
   this._pipeline=recognizer;
   return recognizer;
  })();
  try{return await this._loading}catch(e){this._loading=null;throw e}
 },
 async transcribe(blob){
  if(!(blob instanceof Blob)||!blob.size)throw Error("Audio vacío");
  const context=new (window.AudioContext||window.webkitAudioContext)();
  let decoded;
  try{
   const data=await blob.arrayBuffer();
   decoded=await context.decodeAudioData(data);
  }finally{await context.close()}
  const targetRate=16000,sourceRate=decoded.sampleRate;
  const mono=new Float32Array(decoded.length);
  for(let ch=0;ch<decoded.numberOfChannels;ch++){
   const channel=decoded.getChannelData(ch);
   for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/decoded.numberOfChannels;
  }
  // Interpolación lineal determinista a 16 kHz, sin servicios externos.
  if(!mono.length||!Number.isFinite(sourceRate)||sourceRate<=0)throw Error("Audio sin muestras válidas");
  const n=Math.max(1,Math.round(mono.length*targetRate/sourceRate));
  const samples=new Float32Array(n);
  for(let i=0;i<n;i++){
   const pos=i*sourceRate/targetRate,lo=Math.min(mono.length-1,Math.floor(pos));
   const hi=Math.min(mono.length-1,lo+1),a=pos-lo;
   samples[i]=mono[lo]*(1-a)+mono[hi]*a;
  }
  const recognizer=await this._load();
  const result=await recognizer(samples,{language:"spanish",task:"transcribe",return_timestamps:false});
  return {text:String(result?.text||"").trim(),complete:!!result?.text?.trim()};
 }
};
