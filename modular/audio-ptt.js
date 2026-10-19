"use strict";
// Grabador PTT autónomo. Nunca puntúa ni interpreta voz.
// El estado de grabación depende del usuario, no del silencio.
function rtcHoldRecognizer(p,status,onWords,onFinish){
 rtcPTTGuard(p);
 let state="idle",recorder=null,stream=null,chunks=[],audioUrl=null,startedAt=0,endedAt=0,session=0,pointer=null,disposed=false;
 const controls=document.createElement("div");controls.id="rtcAudioControls";p.textContent="PTT · TOCA PARA HABLAR";
 const label=document.createElement("label");
 const toggle=document.createElement("input");toggle.type="checkbox";toggle.checked=true;toggle.id="rtcPTTToggle";
 label.append(toggle,document.createTextNode(" Modo recomendado: tocar una vez para grabar y otra para terminar (desmarca para mantener pulsado)"));
 const result=document.createElement("div");result.id="rtcAudioResult";controls.append(label,result);
 p.insertAdjacentElement("afterend",controls);
 function setState(next,msg){state=next;p.classList.toggle("live",next==="recording");p.setAttribute("aria-pressed",String(next==="recording"));p.textContent=next==="recording"?"● GRABANDO · TOCA PARA TERMINAR":next==="requesting"?"PERMISO DEL MICRÓFONO…":next==="stopping"?"FINALIZANDO…":"PTT · TOCA PARA HABLAR";if(msg)status.textContent=msg}
 function release(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
 function revoke(){if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}}
 function reset(msg){release();recorder=null;if(!disposed)setState("idle",msg)}
 function finish(){
  release();setState("idle","Grabación finalizada.");
  if(disposed||!p.isConnected)return;
  const type=recorder?.mimeType||chunks[0]?.type||"audio/webm";
  const blob=new Blob(chunks,{type});
  if(!blob.size){status.textContent="Grabación vacía; vuelve a intentarlo.";return}
  revoke();audioUrl=URL.createObjectURL(blob);result.replaceChildren();
  const audio=document.createElement("audio");audio.controls=true;audio.src=audioUrl;audio.style.width="100%";
  const note=document.createElement("p");note.textContent="Audio grabado. El reconocimiento local automático aún no está integrado. La evaluación del texto manual no verifica pronunciación ni recepción de radio.";
  const area=document.createElement("textarea");area.placeholder="Transcripción revisada de la comunicación";
  const btn=document.createElement("button");btn.className="btn primary";btn.textContent="Evaluar texto revisado";
  btn.addEventListener("click",()=>{const t=area.value.trim();if(!t){status.textContent="Primero revisa y escribe la comunicación.";return}onFinish(t,Math.max(0,(endedAt-startedAt)/1000))});
  result.append(audio,note,area,btn);
 }
 function stop(){
  if(state==="requesting"){session++;reset("Micrófono aún sin activar: no se ha grabado audio. Pulsa PTT de nuevo cuando concedas permiso.");return}
  if(state!=="recording")return;
  endedAt=performance.now();setState("stopping","Finalizando grabación…");
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
   startedAt=performance.now();endedAt=0;
   recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
   recorder.onerror=()=>{session++;if(recorder)recorder.onstop=null;reset("Fallo del grabador. Revisa el permiso del micrófono.");};
   recorder.onstop=()=>{if(token===session)finish();else release()};
   recorder.start();
   setState("recording","● GRABANDO · las pausas no detienen la transmisión");

  }catch(e){if(token===session)reset("No se pudo iniciar el micrófono: "+e.message);else if(obtained)obtained.getTracks().forEach(t=>t.stop())}
 }
 function dispose(){if(disposed)return;disposed=true;session++;if(recorder&&recorder.state!=="inactive"){recorder.onstop=null;try{recorder.stop()}catch{}}release();revoke();state="idle";p.classList.remove("live");p.setAttribute("aria-pressed","false");p.textContent="PTT · TOCA PARA HABLAR";observer.disconnect()}
 const observer=new MutationObserver(()=>{if(!p.isConnected)dispose()});
 observer.observe(document.body,{childList:true,subtree:true});
 // El modo principal usa CLICK: una pulsación inicia, otra detiene.
 // No depende de pointerdown/pointerup, evitando dobles activaciones en Android.
 p.addEventListener("click",e=>{
  e.preventDefault();
  if(disposed||!toggle.checked||state==="stopping")return;
  if(state==="idle")start();
  else if(state==="recording"||state==="requesting")stop();
 });
 // Modo opcional mantener pulsado: solo aquí se captura el puntero.
 p.addEventListener("pointerdown",e=>{
  if(disposed||toggle.checked||state==="stopping")return;
  if(e.pointerType==="mouse"&&e.button!==0)return;
  e.preventDefault();pointer=e.pointerId;
  try{p.setPointerCapture(pointer)}catch{}
  start();
 });
 p.addEventListener("pointerup",e=>{
  if(toggle.checked||pointer!==e.pointerId)return;
  e.preventDefault();pointer=null;stop();
 });
 p.addEventListener("pointercancel",e=>{
  if(toggle.checked||pointer!==e.pointerId)return;
  e.preventDefault();pointer=null;stop();
 });
 p.addEventListener("lostpointercapture",()=>{if(!toggle.checked&&pointer!==null){pointer=null;stop()}});
 p.addEventListener("contextmenu",e=>e.preventDefault());
 p.addEventListener("selectstart",e=>e.preventDefault());
 p.addEventListener("dragstart",e=>e.preventDefault());
 p.style.touchAction="manipulation";
 p.style.webkitTapHighlightColor="transparent";
 p.style.userSelect="none";
 p.style.webkitUserSelect="none";
 p.style.webkitTouchCallout="none";
 toggle.addEventListener("change",()=>{pointer=null;if(state==="requesting"||state==="recording")stop()});
 window.addEventListener("pagehide",dispose,{once:true});
 return {start,stop,dispose,getState:()=>state};
}
