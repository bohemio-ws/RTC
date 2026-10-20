/* RTC Academy · núcleo común de fraseología y voz */
(function(){
"use strict";
const VERSION="0.68";
const CALLSIGN="EC-RTC";
const CALLSIGN_PHONETIC="Eco Charlie Romeo Tango Charlie";
const clean=t=>String(t||"").trim().replace(/\s+/g," ");
const norm=t=>clean(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.,;:!?-]/g," ").replace(/\s+/g," ").trim();
const digits={0:"cero",1:"uno",2:"dos",3:"tres",4:"cuatro",5:"cinco",6:"seis",7:"siete",8:"ocho",9:"nueve"};
function speakDigits(v){return String(v).split("").map(c=>digits[c]??c).join(", ")}
function aviationSpeech(text){
 let x=String(text||"");
 x=x.replace(/\bEC[\s-]*RTC\b/gi,CALLSIGN_PHONETIC);
 x=x.replace(/\bQNH\b/gi,"Q N H");
 x=x.replace(/\b(pista\s+)(\d{2})\b/gi,(_,p,v)=>p+speakDigits(v));
 x=x.replace(/\b(frecuencia\s+)(1\d{2})[.,](\d{1,3})\b/gi,(_,p,a,b)=>p+speakDigits(a)+", decimal, "+speakDigits(b.padEnd(3,"0")));
 return x;
}
function phraseIssues(text){
 const n=norm(text),issues=[];
 if(/\bafirmativo\b|\bafirmo\b/.test(n))issues.push("Usa «AFIRMA» en la versión española del entrenador.");
 if(/\broger\b/.test(n))issues.push("No uses «ROGER» en los ejercicios en español; emplea la respuesta o colación española que corresponda.");
 if(/\bnegativa\b/.test(n))issues.push("Usa «NEGATIVO».");
 return issues;
}
function callsignRecognized(text){
 const n=norm(text);
 return /\bec\s+rtc\b/.test(n)||/\be\s+c\s+r\s+t\s+c\b/.test(n)||/\b(?:eco|echo)\s+charlie\s+romeo\s+tango\s+charlie\b/.test(n);
}
function speak(text,{rate=.84}={}){
 if(!("speechSynthesis" in window))return false;
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(aviationSpeech(text));u.lang="es-ES";u.rate=rate;u.pitch=1;
 const voices=speechSynthesis.getVoices();const voice=voices.find(v=>v.lang.toLowerCase()==="es-es")||voices.find(v=>v.lang.toLowerCase().startsWith("es"));if(voice)u.voice=voice;speechSynthesis.speak(u);return true;
}
window.RTCCore={VERSION,CALLSIGN,CALLSIGN_PHONETIC,clean,norm,aviationSpeech,phraseIssues,callsignRecognized,speak};
})();