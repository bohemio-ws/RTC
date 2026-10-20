/* RTC Academy · PTT de radio: mantener para transmitir, soltar para finalizar */
(function(){
"use strict";
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const clean=t=>String(t||"").replace(/\s+/g," ").trim();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function rms(buffer){let s=0;for(let i=0;i<buffer.length;i++)s+=buffer[i]*buffer[i];return Math.sqrt(s/buffer.length)}
window.RTCPtt={
 bind(btn,status,{onPartial,onFinal,onError}={}){
  if(!btn||!status)return()=>{};
  btn.type="button";btn.draggable=false;btn.setAttribute("aria-pressed","false");
  let active=false,stopping=false,pointerId=null,startAt=0,rec=null,stream=null,media=null,audioCtx=null,source=null,analyser=null,meterTimer=null;
  let chunks=[],slots=[],last="",levels=[],recognitionEnded=true,mediaEnded=true;
  const uiLive=live=>{btn.classList.toggle("live",live);btn.setAttribute("aria-pressed",live?"true":"false")};
  const stopTracks=()=>{try{stream?.getTracks().forEach(t=>t.stop())}catch{}stream=null};
  const stopMeter=()=>{if(meterTimer)cancelAnimationFrame(meterTimer);meterTimer=null;try{source?.disconnect()}catch{}try{analyser?.disconnect()}catch{}source=null;analyser=null;if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null}};
  const cleanup=()=>{stopMeter();stopTracks();rec=null;media=null;active=false;stopping=false;pointerId=null;uiLive(false)};
  const meter=()=>{if(!analyser)return;const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);levels.push(rms(a));meterTimer=requestAnimationFrame(meter)};
  const metrics=seconds=>{const voiced=levels.filter(v=>v>.018);const mean=voiced.length?voiced.reduce((a,b)=>a+b,0)/voiced.length:0;const silenceRatio=levels.length?1-voiced.length/levels.length:1;return{seconds,meanLevel:mean,silenceRatio,samples:levels.length}};
  async function finish(){
   const seconds=Math.max(.1,(performance.now()-startAt)/1000),text=clean(last),audio=chunks.length?new Blob(chunks,{type:media?.mimeType||"audio/webm"}):null,data=metrics(seconds);
   cleanup();
   status.textContent=audio?(text?"✓ Transmisión grabada y transcrita.":"✓ Transmisión grabada. La transcripción no es obligatoria para validar el audio."):"No se obtuvo audio. Repite la transmisión.";
   onFinal?.({text,audio,metrics:data,asrAvailable:!!SR});
  }
  async function settle(){for(let i=0;i<12&&(!recognitionEnded||!mediaEnded);i++)await wait(50);finish()}
  async function start(){
   if(active||stopping)return;
   active=true;startAt=performance.now();chunks=[];slots=[];last="";levels=[];recognitionEnded=!SR;mediaEnded=false;uiLive(true);status.textContent="● TRANSMITIENDO · mantén PTT pulsado";onPartial?.("");
   try{
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    if(!active){stopTracks();return}
    const AC=window.AudioContext||window.webkitAudioContext;if(AC){audioCtx=new AC();source=audioCtx.createMediaStreamSource(stream);analyser=audioCtx.createAnalyser();analyser.fftSize=1024;source.connect(analyser);meter()}
    media=new MediaRecorder(stream);media.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};media.onstop=()=>{mediaEnded=true};media.start();
    if(SR){try{rec=new SR();rec.lang="es-ES";rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=5;rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];slots[i]=clean(typeof window.rtcChooseAlternative==="function"?window.rtcChooseAlternative(r):(r?.[0]?.transcript||""))}last=clean(slots.filter(Boolean).join(" "));onPartial?.(last)};rec.onerror=e=>{if(!["aborted","no-speech"].includes(e.error))onError?.(e.error)};rec.onend=()=>{recognitionEnded=true};recognitionEnded=false;rec.start()}catch(e){recognitionEnded=true;onError?.(e)}}
   }catch(e){cleanup();status.textContent="No se pudo abrir el micrófono. Revisa el permiso del navegador.";onError?.(e)}
  }
  function stop(){if(!active||stopping)return;stopping=true;active=false;uiLive(false);status.textContent="Procesando transmisión…";try{rec?.stop()}catch{recognitionEnded=true}try{if(media&&media.state!=="inactive")media.stop();else mediaEnded=true}catch{mediaEnded=true}settle()}
  const down=e=>{e.preventDefault();if(e.pointerType==="mouse"&&e.button!==0)return;pointerId=e.pointerId;try{btn.setPointerCapture(pointerId)}catch{}start()};
  const up=e=>{e.preventDefault();if(pointerId===null||e.pointerId===pointerId){pointerId=null;stop()}};
  const cancel=e=>{e.preventDefault();pointerId=null;stop()};
  const block=e=>e.preventDefault();
  btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointercancel",cancel);btn.addEventListener("contextmenu",block);btn.addEventListener("dragstart",block);btn.addEventListener("selectstart",block);
  return()=>{try{rec?.abort()}catch{}try{if(media&&media.state!=="inactive")media.stop()}catch{}cleanup();btn.removeEventListener("pointerdown",down);btn.removeEventListener("pointerup",up);btn.removeEventListener("pointercancel",cancel);btn.removeEventListener("contextmenu",block);btn.removeEventListener("dragstart",block);btn.removeEventListener("selectstart",block)};
 }
};
})();