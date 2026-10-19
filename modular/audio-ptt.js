"use strict";
// Grabador PTT autónomo. Nunca puntúa ni interpreta voz.
// El estado de grabación depende del usuario, no del silencio.
function rtcHoldRecognizer(p,status,onWords,onFinish){
 rtcPTTGuard(p);
 let state="idle",recorder=null,stream=null,chunks=[],audioUrl=null,startedAt=0,session=0,pointer=null,disposed=false;
 const controls=document.createElement("div");controls.id="rtcAudioControls";
 const label=document.createElement("label");
 const toggle=document.createElement("input");toggle.type="checkbox";toggle.checked=true;toggle.id="rtcPTTToggle";
 label.append(toggle,document.createTextNode(" Modo alterno: tocar para iniciar y tocar para finalizar"));
 const result=document.createElement("div");result.id="rtcAudioResult";controls.append(label,result);
 p.insertAdjacentElement("afterend",controls);
 function setState(next,msg){state=next;p.classList.toggle("live",next==="recording");p.setAttribute("aria-pressed",String(next==="recording"));if(msg)status.textContent=msg}
 function release(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
 function revoke(){if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}}
 function reset(msg){release();recorder=null;if(!disposed)setState("idle",msg)}
 function finish(){
  release();setState("idle","Grabación finalizada.");
  if(disposed||!p.isConnected)return;
  const type=recorder?.mimeType||"audio/webm";
  const blob=new Blob(chunks,{type});
  if(!blob.size){status.textContent="Grabación vacía; vuelve a intentarlo.";return}
  revoke();audioUrl=URL.createObjectURL(blob);result.replaceChildren();
  const audio=document.createElement("audio");audio.controls=true;audio.src=audioUrl;audio.style.width="100%";
  const note=document.createElement("p");note.textContent="Audio completo. El reconocimiento local automático está pendiente de integración. Puedes escuchar y transcribir manualmente; no se asignará nota al audio sin transcripción.";
  const area=document.createElement("textarea");area.placeholder="Transcripción revisada de la comunicación";
  const btn=document.createElement("button");btn.className="btn primary";btn.textContent="Evaluar texto revisado";
  btn.addEventListener("click",()=>{const t=area.value.trim();if(!t){status.textContent="Primero revisa y escribe la comunicación.";return}onFinish(t,(performance.now()-startedAt)/1000)});
  result.append(audio,note,area,btn);
 }
 function stop(){
  if(state==="requesting"){session++;reset("Grabación cancelada antes de iniciar.");return}
  if(state!=="recording")return;
  setState("stopping","Finalizando grabación…");
  try{if(recorder&&recorder.state!=="inactive")recorder.stop();else reset("No se pudo completar la grabación.")}
  catch(e){reset("Error al detener la grabación: "+e.message)}
 }
 async function start(){
  if(state!=="idle"||disposed)return;
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){status.textContent="Este navegador no ofrece grabación compatible. Usa el ejercicio de texto.";return}
  const token=++session;chunks=[];result.replaceChildren();onWords("");setState("requesting","Solicitando permiso del micrófono…");
  let obtained;
  try{
   obtained=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
   if(token!==session||state!=="requesting"||disposed||!p.isConnected){obtained.getTracks().forEach(t=>t.stop());return}
   stream=obtained;
   const supported=typeof MediaRecorder.isTypeSupported==="function"&&MediaRecorder.isTypeSupported("audio/webm;codecs=opus");
   recorder=new MediaRecorder(stream,supported?{mimeType:"audio/webm;codecs=opus"}:{});
   startedAt=performance.now();
   recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
   recorder.onerror=()=>reset("Fallo del grabador. Revisa el permiso del micrófono.");
   recorder.onstop=()=>{if(token===session)finish();else release()};
   recorder.start();
   setState("recording","● GRABANDO · las pausas no detienen la transmisión");
  }catch(e){if(token===session)reset("No se pudo iniciar el micrófono: "+e.message);else if(obtained)obtained.getTracks().forEach(t=>t.stop())}
 }
 function dispose(){if(disposed)return;disposed=true;session++;if(recorder&&recorder.state!=="inactive"){recorder.onstop=null;try{recorder.stop()}catch{}}release();revoke();state="idle";observer.disconnect()}
 const observer=new MutationObserver(()=>{if(!p.isConnected)dispose()});
 observer.observe(document.body,{childList:true,subtree:true});
 p.addEventListener("pointerdown",e=>{e.preventDefault();if(e.pointerType==="mouse"&&e.button!==0)return;
  if(toggle.checked){if(state==="idle")start();else if(state==="recording"||state==="requesting")stop()}
  else{pointer=e.pointerId;try{p.setPointerCapture(pointer)}catch{}start()}
 });
 p.addEventListener("pointerup",e=>{e.preventDefault();if(!toggle.checked&&pointer===e.pointerId){pointer=null;stop()}});
 p.addEventListener("pointercancel",e=>{e.preventDefault();if(!toggle.checked&&pointer===e.pointerId){pointer=null;stop()}});
 window.addEventListener("pagehide",dispose,{once:true});
 return {start,stop,dispose,getState:()=>state};
}
