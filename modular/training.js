"use strict";
const rtc9432Sections=[
{title:"Preparar una transmisión",chapter:"Doc 9432 · capítulo 2: técnicas de transmisión",situation:"Estás en plataforma y necesitas llamar por primera vez.",sequence:["Escucha la frecuencia para evitar pisar otra transmisión.","Identifica a quién llamas y tu indicativo.","Expón una solicitud breve y concreta; deja libre la frecuencia."],error:"Transmitir sin escuchar o hablar durante demasiado tiempo.",check:"¿Has identificado estación, aeronave y propósito de la llamada?"},
{title:"Comprender y colacionar",chapter:"Doc 9432 · capítulo 2: distintivos, comunicaciones y colaciones",situation:"Recibes una instrucción que contiene una pista y un punto de espera.",sequence:["Escucha hasta el final y retén los datos esenciales.","Repite los elementos que requieren colación, sin cambiarlos.","Si no comprendes un dato, solicita repetición antes de actuar."],error:"Confundir acuse de recibo con una colación de seguridad.",check:"¿Puedes repetir exactamente pista y restricción recibidas?"},
{title:"Rodaje y pista",chapter:"Doc 9432 · capítulo 4: movimiento en superficie",situation:"La dependencia te indica rodar hasta un punto de espera.",sequence:["Confirma el punto de espera y la ruta indicada.","No interpretes rodar como permiso para entrar o cruzar una pista.","Detente y solicita aclaración si la instrucción no es inequívoca."],error:"Entrar en pista basándose solo en una instrucción de rodaje.",check:"¿Tienes autorización explícita cuando es exigible para entrar o cruzar?"},
{title:"Circuito, aproximación y aterrizaje",chapter:"Doc 9432 · capítulo 4: procedimientos de aeródromo",situation:"Te incorporas al circuito y preparas la aproximación.",sequence:["Comprueba los procedimientos publicados y el servicio disponible.","Comunica posición e intención con indicativo y datos pertinentes.","Distingue la información de tráfico de una autorización ATC."],error:"Tratar la información AFIS o la autoinformación como autorización de control.",check:"¿Sabes si operas con torre, AFIS o autoinformación?"},
{title:"Socorro y urgencia",chapter:"Doc 9432 · comunicaciones de emergencia",situation:"Tienes una avería que compromete la seguridad del vuelo.",sequence:["Mantén el control de la aeronave y determina la gravedad.","Utiliza MAYDAY para socorro o PAN PAN para urgencia según corresponda.","Comunica identificación, situación, intención y datos esenciales que puedas proporcionar."],error:"Retrasar una comunicación urgente por buscar una frase perfecta.",check:"¿Distingues peligro grave e inminente de una situación de urgencia?"}
];
function rtc9432Guide(){app.innerHTML='<div class="row"><button class="btn" id="back">← Formación</button><span class="tag">OACI DOC 9432</span></div><section class="card"><h2>Del manual a la cabina · 5 situaciones</h2><p>Itinerario práctico inspirado en la organización del Manual de Radiotelefonía OACI Doc 9432 (4.ª edición, 2007). No reproduce ni sustituye el texto del manual.</p><p class="warn">El Doc 9432 es material de referencia internacional y esta edición no determina por sí sola los procedimientos vigentes en España. Contrasta siempre con SERA, AESA, AIP ENAIRE y procedimientos locales.</p><p><a href="https://files.ar.ivao.aero/Training/Manuales/ICAO/9432.pdf" target="_blank" rel="noopener">Consultar el manual proporcionado ↗</a></p></section>'+rtc9432Sections.map((x,i)=>'<details class="lesson"><summary>'+(i+1)+'. '+safe(x.title)+'</summary><p class="muted">'+safe(x.chapter)+'</p><p><b>Situación:</b> '+safe(x.situation)+'</p><h3>Secuencia de actuación</h3><ol>'+x.sequence.map(y=>'<li>'+safe(y)+'</li>').join('')+'</ol><p class="warn"><b>Error crítico a evitar:</b> '+safe(x.error)+'</p><p><b>Autocomprobación:</b> '+safe(x.check)+'</p></details>').join('')+'<section class="card"><button class="btn primary" id="practice">Practicar comunicaciones →</button><button class="btn" id="bank">Ir al banco de preguntas →</button></section>';$("#back").onclick=training;$("#practice").onclick=drillHome;$("#bank").onclick=bankHome}
function training(){app.innerHTML=`<div class="row"><button class="btn" id="back">← Inicio</button><span class="tag">FORMACIÓN RTC · 13 LECCIONES</span></div><section class="card"><h2>Aprende antes de transmitir</h2><p>Programa de estudio y práctica. Cada lección incluye objetivo, explicación y un ejercicio para realizar con el simulador.</p><p class="warn">Material didáctico en desarrollo: no sustituye formación autorizada ni AIP, VAC, NOTAM o normativa vigente.</p><p>Material complementario AESA UAS (aplicar solo contenido común): <a href="https://www.seguridadaerea.gob.es/sites/default/files/for-uas-p01-dt12_ed_02_curso_de_radiofonista_rtf_uas_aesa_cap_3.pdf" target="_blank" rel="noopener">Radiotelefonía y comunicaciones · capítulo 3 (2026)</a>. Fuentes de referencia: <a href="https://www.seguridadaerea.gob.es/sites/default/files/a_dla_urtc_01_guia_para_curso_radiofonista_rtc_de_ulm.pdf" target="_blank" rel="noopener">Guía AESA RTC ULM</a> · <a href="https://aip.enaire.es/" target="_blank" rel="noopener">AIP ENAIRE</a></p></section>`+lessons.map((l,i)=>`<details class="lesson"><summary>${i+1}. ${safe(l[0])}</summary><p><b>Aprenderás:</b> ${safe(l[1])}</p><p>${safe(l[2])}</p><div class="chapterText">${expandedLessons[i].map((p,j)=>`<p><b>${["Conceptos y explicación","Aplicación y ejemplos","Seguridad y errores frecuentes"][j]}:</b> ${safe(p)}</p>`).join("")}</div><p class="practice"><b>Práctica:</b> ${safe(l[3])}</p><button class="btn" data-speak="${i}">🔊 Escuchar explicación</button></details>`).join("")+`<section class="card"><button class="btn primary" id="practice">Ir a las prácticas →</button><button class="btn" id="quizOpen">🧠 AUTOEVALUACIÓN · 13 PREGUNTAS</button><button class="btn primary" id="bankOpen">📚 BANCO DE PREGUNTAS · REPASO Y EVALUACIÓN</button><button class="btn" id="icaoOpen">✈️ OACI DOC 9432 · 5 SITUACIONES DE CABINA</button></section>`;$("#back").onclick=menu;$("#practice").onclick=drillHome;$("#quizOpen").onclick=quizHome;$("#bankOpen").onclick=bankHome;$("#icaoOpen").onclick=rtc9432Guide;document.querySelectorAll("[data-speak]").forEach(b=>b.onclick=()=>{const l=lessons[+b.dataset.speak];say(l[0]+". "+l[2])})}

let drillIdx=0,drillAttempts={},drillResults=[];
function drillHome(){app.innerHTML='<div class="row"><button class="btn" id="back">← Inicio</button><span class="tag">LABORATORIO DE FRASEOLOGÍA</span></div><section class="card"><h2>Prácticas guiadas</h2><p>Primero estudia la situación. Después habla por PTT o escribe. Compara tu transmisión con un ejemplo didáctico.</p><p class="warn">La comprobación es parcial: una coincidencia textual no acredita corrección normativa, fonética ni operacional.</p></section>'+drills.map((d,i)=>'<button class="btn" style="display:block;width:100%;text-align:left;margin:8px 0" data-drill="'+i+'">'+(i+1)+'. '+safe(d.title)+' <small>· '+(drillAttempts[i]||0)+' intentos</small></button>').join('');$("#back").onclick=menu;document.querySelectorAll("[data-drill]").forEach(b=>b.onclick=()=>drillShow(+b.dataset.drill))}
let rtcLastTiming=null;
function drillShow(i){rtcLastTiming=null;drillIdx=i;const d=drills[i];app.innerHTML='<div class="row"><button class="btn" id="back">← Prácticas</button><span class="tag">EJERCICIO '+(i+1)+'/'+drills.length+' · v0.59</span></div><section class="card"><h2>'+safe(d.title)+'</h2><p>'+safe(d.question)+'</p><div class="radio">Habla de forma clara. Si te equivocas, di «CORRECCIÓN» y transmite el dato correcto sin empezar de nuevo. No supongas autorizaciones.</div><button class="btn" id="hear">🔊 Escuchar situación</button><div class="line"><label for="rtcNoise">Condiciones de recepción (solo audio de escucha): </label><select id="rtcNoise"><option value="0">Limpia</option><option value="1">Ruido leve</option><option value="2">Ruido intenso (entrenamiento)</option></select></div></section><section class="card"><div class="k">TRANSMITE</div><button class="ptt" id="ptt">MANTENER<br>PTT</button><div id="status" class="muted">Toca PTT para iniciar y vuelve a tocar para terminar.</div><div class="radio" id="out">La grabación se reproducirá aquí.</div><textarea id="drillText" placeholder="O escribe aquí para practicar sin micrófono"></textarea><button class="btn primary" id="checkDrill">Evaluar mi comunicación</button><div id="feedback"></div></section>';$("#back").onclick=drillHome;$("#rtcNoise").value=String(rtcNoiseLevel);$("#rtcNoise").onchange=e=>{rtcNoiseLevel=Number(e.target.value);rtcStopNoise()};$("#hear").onclick=()=>rtcReceive(d.question);$("#checkDrill").onclick=()=>drillCheck($("#drillText").value||$("#out").textContent);bindDrillPTT()}

function rtcPTTGuard(p){
 p.setAttribute("type","button");p.setAttribute("draggable","false");p.textContent="PTT";p.style.webkitUserSelect="none";p.style.webkitUserSelect="none";p.style.userSelect="none";p.style.webkitTouchCallout="none";p.style.touchAction="none";
 ["contextmenu","selectstart","dragstart"].forEach(n=>p.addEventListener(n,e=>e.preventDefault(),{capture:true}));
}
function bindDrillPTT(){
 const p=$("#ptt"),status=$("#status"),out=$("#out"),field=$("#drillText");
 rtcHoldRecognizer(p,status,t=>{out.textContent=rtcAviationTranscript(t)||"Escuchando…";field.value=t},(t,seconds)=>{rtcLastTiming={seconds,at:Date.now()};field.value=t;out.textContent=rtcAviationTranscript(t)||"No se reconocieron palabras"});
}
function numberIssues(i,n){
 const rules={
 1:{required:[["QNH 1017",/\b(1017|mil diecisiete|uno cero uno siete)\b/],["Altitud 2500",/\b(2500|dos mil quinientos|dos cinco cero cero)\b/]],forbidden:[["QNH 1013",/\b(1013|mil trece|uno cero uno tres)\b/],["Altitud 3500",/\b(3500|tres mil quinientos|tres cinco cero cero)\b/]]},
 2:{required:[["Pista 24",/\b(24|dos cuatro)\b/]],forbidden:[["Pista 06",/\b(06|cero seis)\b/],["Pista 36",/\b(36|tres seis)\b/]]},
 3:{required:[["Pista 06",/\b(06|cero seis)\b/]],forbidden:[["Pista 24",/\b(24|dos cuatro)\b/]]}
 };const r=rules[i];if(!r)return[];const errors=[];for(const [label,re] of r.required)if(!re.test(n))errors.push("Falta valor exacto: "+label);for(const [label,re] of r.forbidden)if(re.test(n))errors.push("Valor contradictorio detectado: "+label);return errors
}
function rtcContextCheck(name,text,words){
 const n=norm(text);
 if(name==="Indicativo")return recognizedCallsign(text);
 if(words.some(w=>n.includes(norm(w))))return true;
 if(name==="Estación y tráfico"||name==="Tráfico")return /\b(trafico|traficos)\b/.test(n)||/\b(?:aerodromo|era del|era de|aero del)\s+(?:norte|sur|este|oeste)\b/.test(n);
 if(name==="Intención")return /\b(salir|salgo|salida|despegar|despegue)\b/.test(n)&&/\b(local|vuelo|inmediata|inmediato)\b/.test(n);
 if(name==="Posición")return /\b(en|desde)\s+(?:la\s+)?plataforma\b/.test(n);
 return false;
}
function rtcCadenceFeedback(text){
 if(!rtcLastTiming||Date.now()-rtcLastTiming.at>120000)return '<p class="muted">Ritmo: sin medición de voz. El texto escrito no permite evaluar velocidad.</p>';
 const secs=rtcLastTiming.seconds,words=norm(text).split(" ").filter(Boolean).length;
 if(secs<1||words<2)return '<p class="muted">Ritmo: muestra demasiado breve para estimar.</p>';
 const wpm=Math.round(words*60/secs);
 let advice=wpm>160?"Posiblemente demasiado rápido: separa los grupos importantes y vuelve a transmitir.":wpm<75?"Posiblemente demasiado lento: procura una emisión continua y clara.":"Ritmo aproximado dentro de una banda orientativa; verifica que las pausas faciliten comprender los datos.";
 return '<p><b>Ritmo estimado: '+wpm+' palabras/min</b> ('+secs.toFixed(1)+' s de PTT). '+advice+'</p><p class="muted">Estimación basada en texto reconocido y duración del PTT, no análisis acústico. No evalúa volumen, tono ni pausas internas. No es una norma oficial ni afecta a la nota.</p>';
}
function rtcCorrectionInfo(text){
 const raw=String(text||""),parts=raw.split(/\bcorrecci[oó]n\b/i);
 if(parts.length<2)return {used:false,valid:true,effective:raw,message:""};
 const before=parts.slice(0,-1).join(" "),after=parts[parts.length-1].trim();
 if(!after)return {used:true,valid:false,effective:raw,message:"Has dicho CORRECCIÓN, pero falta indicar el dato correcto."};
 const a=norm(before),b=norm(after);
 const lastRunway=/\bpista\s+(?:\d{1,2}|(?:cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)(?:\s+(?:cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve))?)\b/g;
 const old=[...a.matchAll(lastRunway)],newRunway=[...b.matchAll(lastRunway)];
 // Solo se sustituye el último dato de pista si se ha expresado inequívocamente.
 if(old.length&&newRunway.length){
  const idx=old[old.length-1].index,match=old[old.length-1][0];
  const effective=a.slice(0,idx)+a.slice(idx+match.length)+" "+b;
  return {used:true,valid:true,effective,message:"CORRECCIÓN detectada: se considera la última pista comunicada. Verifica que el dato corregido sea el correcto."};
 }
 return {used:true,valid:true,effective:raw,message:"CORRECCIÓN detectada. Comprueba que el dato sustituido queda inequívoco; el motor no descarta automáticamente otros valores."};
}
function rtcPhraseIssues(t){
 const n=norm(t),issues=[];
 // Las variantes de afirmación se verifican contra la biblioteca normativa central; no penalizar sin referencia confirmada.
 if(/\broger\b/.test(n))issues.push("En este entrenador de fraseología española: evita «ROGER»; usa «RECIBIDO» para acusar recibo o «AFIRMO» para una respuesta afirmativa, según corresponda.");
 if(/\bnegativa\b/.test(n))issues.push("Para responder negativamente, utiliza «NEGATIVO».");
 return issues;
}
function drillCheck(text){
 const d=drills[drillIdx],interpreted=rtcEmergencyPhonetics(text),correction=rtcCorrectionInfo(interpreted),n=norm(correction.effective);
 if(!n||n==="la transcripcion aparecera aqui"||n==="escuchando"){ $("#feedback").innerHTML='<section class="card feedback"><h3>Sin comunicación reconocida</h3><p>El micrófono no ha entregado texto evaluable. No corresponde poner un 0 % ni registrar un intento.</p><p>Repite manteniendo pulsado PTT mientras hablas, o escribe tu mensaje en el cuadro de texto.</p></section>';return}
 const results=d.checks.map(([name,words])=>({name,ok:rtcContextCheck(name,correction.effective,words)})),hits=results.filter(x=>x.ok).length,coverage=Math.round(hits/results.length*100),issues=numberIssues(drillIdx,n),critical=issues.length>0,wrongPriority=(drillIdx===5&&/\bmayday\b/.test(n))||(drillIdx===6&&/\bpan pan\b/.test(n)&&!/\bmayday\b/.test(n));
 if(wrongPriority)issues.push("Prioridad incorrecta para la gravedad simulada.");
 issues.push(...rtcPhraseIssues(text));if(!correction.valid)issues.push(correction.message);
 const minimum=norm(text).split(/\s+/).filter(Boolean).length<5; if(minimum)issues.push("Comunicación demasiado breve para evaluar con fiabilidad: no se asigna una nota válida."); const score=minimum?0:(issues.length||wrongPriority?Math.min(coverage,49):coverage);
 if(!minimum){drillAttempts[drillIdx]=(drillAttempts[drillIdx]||0)+1;drillResults.push({drill:drillIdx,score,text,issues})}
 const note=issues.length?"No avances todavía: revisa los valores o la prioridad.":coverage===100?"Elementos detectados; no es una certificación de fraseología o aptitud RTC.":"Faltan elementos que conviene practicar antes de avanzar.";
 $("#feedback").innerHTML='<section class="card feedback"><h3>Cobertura detectada: '+coverage+' %</h3><p><b>Resultado didáctico: '+(minimum?"NO EVALUABLE":score+" %")+'</b></p>'+results.map(x=>'<div class="line '+(x.ok?"good":"warn")+'">'+(x.ok?"✓ ":"○ ")+safe(x.name)+'</div>').join("")+issues.map(x=>'<div class="line bad">⚠ '+safe(x)+'</div>').join("")+(correction.used?'<p><b>'+safe(correction.message)+'</b></p>':'')+'<p>'+safe(note)+'</p>'+rtcCadenceFeedback(text)+'<div class="radio"><b>Modelo didáctico:</b><p>'+safe(d.model)+'</p></div><div class="choice"><button class="btn" id="listenModel">🔊 Escuchar modelo</button><button class="btn" id="retryDrill">Repetir</button><button class="btn primary" id="nextDrill">Siguiente →</button></div></section>';
 $("#listenModel").onclick=()=>say(d.model);$("#retryDrill").onclick=()=>drillShow(drillIdx);$("#nextDrill").onclick=()=>drillShow((drillIdx+1)%drills.length)
}
