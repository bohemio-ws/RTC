/* RTC Academy · núcleo único de fraseología, indicativo y síntesis de voz */
(function(){
"use strict";
const VERSION="0.68";
const BUILD_DATE="20 OCT 2026";
const CALLSIGN="EC-RTC";
const CALLSIGN_PHONETIC="Eco Charlie Romeo Tango Charlie";
const clean=t=>String(t||"").trim().replace(/\s+/g," ");
const norm=t=>clean(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.,;:!?-]/g," ").replace(/\s+/g," ").trim();
const digits={0:"cero",1:"uno",2:"dos",3:"tres",4:"cuatro",5:"cinco",6:"seis",7:"siete",8:"ocho",9:"nueve"};
function speakDigits(v){return String(v).split("").map(c=>digits[c]??c).join(", ")}
function aviationSpeech(text){
 let x=String(text||"");
 x=x.replace(/\b(?:EC[\s-]*RTC|E\s*C\s*R\s*T\s*C)\b/gi,CALLSIGN_PHONETIC);
 x=x.replace(/\bQNH\b/gi,"Q, N, H");
 x=x.replace(/\b(pista\s+)(\d{2})\b/gi,(_,p,v)=>p+speakDigits(v));
 x=x.replace(/\b(frecuencia\s+)(1\d{2})[.,](\d{1,3})\b/gi,(_,p,a,b)=>p+speakDigits(a)+", decimal, "+speakDigits(b.padEnd(3,"0")));
 return x;
}
function phraseIssues(text){
 const n=norm(text),issues=[];
 if(/\bafirmativo\b|\bafirmo\b/.test(n))issues.push("Usa «AFIRMA» en la versión española del entrenador.");
 if(/\broger\b/.test(n))issues.push("No uses «ROGER» en los ejercicios en español; emplea «AFIRMA», «RECIBIDO» o la colación que corresponda.");
 if(/\bnegativa\b/.test(n))issues.push("Usa «NEGATIVO».");
 return issues;
}
function callsignRecognized(text){
 const n=norm(text);
 return /\bec\s+rtc\b/.test(n)||/\be\s+c\s+r\s+t\s+c\b/.test(n)||/\b(?:eco|echo)\s+(?:charlie|charli|charly)\s+(?:romeo|romero)\s+tango\s+(?:charlie|charli|charly)\b/.test(n);
}
function speak(text,{rate=.84,onstart,onend,onerror}={}){
 if(!("speechSynthesis" in window))return false;
 speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(aviationSpeech(text));u.lang="es-ES";u.rate=rate;u.pitch=1;
 const voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.toLowerCase()==="es-es")||voices.find(v=>v.lang.toLowerCase().startsWith("es"));if(voice)u.voice=voice;
 if(onstart)u.onstart=onstart;if(onend)u.onend=onend;if(onerror)u.onerror=onerror;speechSynthesis.speak(u);return true;
}
window.RTCCore={VERSION,BUILD_DATE,CALLSIGN,CALLSIGN_PHONETIC,clean,norm,aviationSpeech,phraseIssues,callsignRecognized,speak};
})();