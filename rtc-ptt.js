/* RTC Academy · PTT real: audio primero, transcripción auxiliar */
(function(){
"use strict";
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const clean=t=>String(t||"").replace(/\s+/g," ").trim();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function rms(a){let s=0;for(let i=0;i<a.length;i++)s+=a[i]*a[i];return a.length?Math.sqrt(s/a.length):0}
window.RTCPtt={bind(btn,status,{onPartial,onFinal,onError}={}){
 if(!btn||!status)return()=>{};
 btn.type="button";btn.draggable=false;btn.innerHTML="MANTENER<br>PTT";btn.setAttribute("aria-pressed","false");
 let active=false,stopping=false,pointerId=null,startAt=0,rec=null,stream=null,media=null,audioCtx=null,source=null,analyser=null,raf=null;
 let chunks=[],slots=[],last="",levels=[],asrError="",recognitionEnded=true,mediaEnded=true,finalized=false;
 const ui=live=>{btn.classList.toggle("live",live);btn.setAttribute("aria-pressed",live?"true":"false")};
 const stopTracks=()=>{try{stream?.getTracks().forEach(t=>t.stop())}catch{}stream=null};
 const stopMeter=()=>{if(raf)cancelAnimationFrame(raf);raf=null;try{source?.disconnect()}catch{}try{analyser?.disconnect()}catch{}source=null;analyser=null;if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null}};
 const cleanup=()=>{stopMeter();stopTracks();rec=null;media=null;active=false;stopping=false;pointerId=null;ui(false)};
 const meter=()=>{if(!analyser)return;const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);levels.push(rms(a));raf=requestAnimationFrame(meter)};
 const acoustic=seconds=>{const threshold=.018,voiced=levels.filter(v=>v>threshold),mean=voiced.length?voiced.reduce((a,b)=>a+b,0)/voiced.length:0,peak=levels.length?Math.max(...levels):0,silenceRatio=levels.length?1-voiced.length/levels.length:1;let pauses=0,inSilence=false;for(const v of levels){if(v<=threshold&&!inSilence){inSilence=true;pauses++}else if(v>threshold)inSilence=false}return{seconds,meanLevel:mean,peakLevel:peak,silenceRatio,pauseSegments:pauses,samples:levels.length}};
 async function finish(){if(finalized)return;finalized=true;const seconds=Math.max(.1,(performance.now()-startAt)/1000),text=clean(last),mime=media?.mimeType||"audio/webm",audio=chunks.length?new Blob(chunks,{type:mime}):null,metrics=acoustic(seconds);cleanup();status.textContent=audio?(text?"✓ Audio recibido · transcripción auxiliar disponible.":"✓ Audio recibido · sin transcripción. El intento puede seguir siendo válido."):"No se obtuvo audio. Repite la transmisión.";onFinal?.({text,audio,metrics,asrAvailable:!!SR,asrError})}
 async function settle(){for(let i=0;i<20&&(!recognitionEnded||!mediaEnded);i++)await wait(50);await finish()}
 async function start(){
  if(active||stopping)return;active=true;finalized=false;startAt=performance.now();chunks=[];slots=[];last="";levels=[];asrError="";recognitionEnded=!SR;mediaEnded=true;ui(true);status.textContent="● TRANSMITIENDO · suelta PTT al terminar";onPartial?.("");
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});if(!active){stopTracks();return}
   const AC=window.AudioContext||window.webkitAudioContext;if(AC){audioCtx=new AC();source=audioCtx.createMediaStreamSource(stream);analyser=audioCtx.createAnalyser();analyser.fftSize=1024;source.connect(analyser);meter()}
   if(window.MediaRecorder){media=new MediaRecorder(stream);mediaEnded=false;media.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};media.onstop=()=>{mediaEnded=true};media.start()}
   if(SR){try{rec=new SR();rec.lang="es-ES";rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=5;recognitionEnded=false;rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];slots[i]=clean(typeof window.rtcChooseAlternative==="function"?window.rtcChooseAlternative(r):(r?.[0]?.transcript||""))}last=clean(slots.filter(Boolean).join(" "));onPartial?.(last)};rec.onerror=e=>{asrError=e.error||"asr";if(!["aborted","no-speech"].includes(asrError))onError?.(asrError)};rec.onend=()=>{recognitionEnded=true};rec.start()}catch(e){recognitionEnded=true;asrError=String(e);onError?.(e)}}
  }catch(e){cleanup();status.textContent="No se pudo abrir el micrófono. Revisa el permiso del navegador.";onError?.(e)}
 }
 function stop(){if(!active||stopping)return;stopping=true;active=false;ui(false);status.textContent="Procesando audio…";try{rec?.stop()}catch{recognitionEnded=true}try{if(media&&media.state!=="inactive")media.stop();else mediaEnded=true}catch{mediaEnded=true}settle()}
 const down=e=>{e.preventDefault();if(e.pointerType==="mouse"&&e.button!==0)return;pointerId=e.pointerId;try{btn.setPointerCapture(pointerId)}catch{}start()};
 const up=e=>{e.preventDefault();if(pointerId===null||e.pointerId===pointerId){pointerId=null;stop()}};const cancel=e=>{e.preventDefault();pointerId=null;stop()};const block=e=>e.preventDefault();
 btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointercancel",cancel);btn.addEventListener("contextmenu",block);btn.addEventListener("dragstart",block);btn.addEventListener("selectstart",block);
 return()=>{try{rec?.abort()}catch{}try{if(media&&media.state!=="inactive")media.stop()}catch{}cleanup();btn.removeEventListener("pointerdown",down);btn.removeEventListener("pointerup",up);btn.removeEventListener("pointercancel",cancel);btn.removeEventListener("contextmenu",block);btn.removeEventListener("dragstart",block);btn.removeEventListener("selectstart",block)};
}};
})();