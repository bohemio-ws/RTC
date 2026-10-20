/* RTC Academy · núcleo PTT limpio
   Pulsar = transmitir. Soltar = detener. La evaluación espera al cierre real del reconocedor.
   Un fallo de ASR no se convierte automáticamente en fallo del alumno. */
(function(){
  "use strict";
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const clean=t=>String(t||"").replace(/\s+/g," ").trim();

  window.RTCPtt={
    bind(button,status,{onPartial,onFinal,onNoTranscript,onError}={}){
      if(!button||!status) return ()=>{};
      button.type="button";
      button.draggable=false;
      button.textContent="PTT";
      button.setAttribute("aria-pressed","false");

      let recognition=null;
      let active=false;
      let stopping=false;
      let pointerId=null;
      let startedAt=0;
      let slots=[];
      let lastText="";

      const render=()=>{
        lastText=clean(slots.filter(Boolean).join(" "));
        onPartial?.(lastText);
      };

      const reset=()=>{
        recognition=null;
        active=false;
        stopping=false;
        pointerId=null;
        button.classList.remove("live");
        button.setAttribute("aria-pressed","false");
      };

      const complete=()=>{
        const text=clean(lastText);
        const seconds=Math.max(.1,(performance.now()-startedAt)/1000);
        reset();
        if(text){
          status.textContent="✓ Transmisión recibida.";
          onFinal?.(text,seconds);
        }else{
          status.textContent="No se obtuvo transcripción. No se considera un error del alumno.";
          onNoTranscript?.(seconds);
        }
      };

      const start=()=>{
        if(active||stopping) return;
        if(!SR){
          status.textContent="Este navegador no ofrece reconocimiento de voz. Usa la entrada manual.";
          onError?.("unsupported");
          return;
        }
        active=true;
        startedAt=performance.now();
        slots=[];
        lastText="";
        button.classList.add("live");
        button.setAttribute("aria-pressed","true");
        status.textContent="● TRANSMITIENDO · suelta PTT al terminar";
        onPartial?.("");
        try{
          recognition=new SR();
          recognition.lang="es-ES";
          recognition.continuous=true;
          recognition.interimResults=true;
          recognition.maxAlternatives=5;
          recognition.onresult=e=>{
            for(let i=e.resultIndex;i<e.results.length;i++){
              const result=e.results[i];
              const best=typeof window.rtcChooseAlternative==="function"
                ? window.rtcChooseAlternative(result)
                : (result?.[0]?.transcript||"");
              slots[i]=clean(best);
            }
            render();
          };
          recognition.onerror=e=>{
            if(!["aborted","no-speech"].includes(e.error)){
              status.textContent="Reconocimiento de voz: "+e.error;
              onError?.(e.error);
            }
          };
          recognition.onend=()=>{
            if(active||stopping) complete();
          };
          recognition.start();
        }catch(err){
          reset();
          status.textContent="No se pudo iniciar el micrófono.";
          onError?.(err);
        }
      };

      const stop=()=>{
        if(!active||stopping) return;
        stopping=true;
        active=false;
        button.classList.remove("live");
        button.setAttribute("aria-pressed","false");
        status.textContent="Procesando transmisión…";
        try{recognition?.stop()}catch{complete()}
      };

      const down=e=>{
        e.preventDefault();
        if(e.pointerType==="mouse"&&e.button!==0) return;
        pointerId=e.pointerId;
        try{button.setPointerCapture(pointerId)}catch{}
        start();
      };
      const up=e=>{
        e.preventDefault();
        if(pointerId===null||e.pointerId===pointerId){pointerId=null;stop()}
      };
      const cancel=e=>{e.preventDefault();pointerId=null;stop()};
      const context=e=>e.preventDefault();

      button.addEventListener("pointerdown",down);
      button.addEventListener("pointerup",up);
      button.addEventListener("pointercancel",cancel);
      button.addEventListener("contextmenu",context);

      return ()=>{
        try{recognition?.abort()}catch{}
        button.removeEventListener("pointerdown",down);
        button.removeEventListener("pointerup",up);
        button.removeEventListener("pointercancel",cancel);
        button.removeEventListener("contextmenu",context);
        reset();
      };
    }
  };
})();
