"use strict";
function safe(t){return String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function norm(t){return String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.,;:!?-]/g," ").replace(/\s+/g," ").trim()}
const RTC_PHRASEOLOGY=Object.freeze({acknowledge:"RECIBIDO",negative:"NEGATIVO",affirmative:"AFIRMO",correction:"CORRECCIÓN",repeat:"REPITA",wait:"ESPERE"});
function rtcPhraseologyIssues(text){
 const n=norm(text),issues=[];
 if(/\broger\b/.test(n))issues.push("En fraseología española utiliza «"+RTC_PHRASEOLOGY.acknowledge+"» para acusar recibo; no «ROGER».");
 if(/\bnegativa\b/.test(n))issues.push("Para responder negativamente, utiliza «"+RTC_PHRASEOLOGY.negative+"».");
 return issues;
}
const ICAO_PHONETIC={alfa:"A",alpha:"A",bravo:"B",charlie:"C",delta:"D",eco:"E",echo:"E",foxtrot:"F",golf:"G",hotel:"H",india:"I",juliett:"J",juliet:"J",kilo:"K",lima:"L",mike:"M",november:"N",oscar:"O",papa:"P",quebec:"Q",romeo:"R",sierra:"S",tango:"T",uniform:"U",victor:"V",whiskey:"W",whisky:"W",xray:"X",yankee:"Y",zulu:"Z"};
function phoneticLetters(text){return norm(text).split(" ").map(w=>ICAO_PHONETIC[w]||null)}
function callsignFromSpeech(text){
 const w=norm(text).split(" ").filter(Boolean);
 const alias={eco:"E",echo:"E",e:"E",charlie:"C",charli:"C",charly:"C",chali:"C",c:"C",romeo:"R",romero:"R",romeu:"R",r:"R",tango:"T",tangoo:"T",t:"T"};
 for(let i=0;i<w.length;i++){
  if(w[i]==="ec"&&w[i+1]==="rtc")return "EC-RTC";
  if(w.slice(i,i+5).join(" ")==="e c r t c")return "EC-RTC";
  if(w.slice(i,i+5).map(x=>alias[x]||ICAO_PHONETIC[x]||"").join("")==="ECRTC")return "EC-RTC";
  // El dictado puede unir las dos últimas palabras, pero se exige E-C-R previo.
  if(["eco","echo"].includes(w[i])&&["charlie","charli","charly"].includes(w[i+1])&&["romeo","romero"].includes(w[i+2])&&["tangocharlie","tangocharli","tangochalie","derrocharlie"].includes(w[i+3]))return "EC-RTC";
 }
 return "";
}
function recognizedCallsign(text){return callsignFromSpeech(text)==="EC-RTC"}
function rtcEmergencyPhonetics(raw){
 let t=String(raw||"");
 t=t.replace(/\b(?:pam|pan)(?:[\s,.-]+(?:pam|pan))+\b/gi,m=>m.replace(/\bpam\b/gi,"PAN").replace(/\bpan\b/gi,"PAN"));
 t=t.replace(/\b(?:mayden|mayday|meidei|meidey|meyday|meydei|may dei|mei dei|may de|may de y)\b/gi,"MAYDAY");
 return t;
}
function rtcAviationTranscript(raw){
 let t=rtcEmergencyPhonetics(raw).trim();if(!t)return "";
 const n=norm(t);
 const cs=callsignFromSpeech(t);
 if(cs){
  t=t.replace(/\b(?:eco|echo)\s+(?:charlie|charli|charly)\s+(?:romeo|romero|romeu)\s+(?:tango\s+(?:charlie|charli|charly)|tangocharlie|tangocharli|tangochalie|derrocharlie)\b/i,"EC-RTC");
  t=t.replace(/\bEC[\s-]*RTC\b/i,"EC-RTC");
 }
 // Solo se normalizan fórmulas no críticas con suficiente contexto.
 t=t.replace(/\b(?:era del|era de|aero del)\s+(norte|sur|este|oeste)\s+tr[aá]fico\b/gi,(_,dir)=>"Aeródromo "+dir+" tráfico");
 t=t.replace(/\b(?:romero)\b/gi,(word,offset,whole)=>/\b(?:eco|echo|charlie|charli|charly)\s*$/i.test(whole.slice(Math.max(0,offset-35),offset))?"Romeo":word);
 return t;
}
function rtcChooseAlternative(result){
 if(!result||!result.length)return "";
 let best=String(result[0].transcript||""),score=-Infinity;
 for(let i=0;i<result.length;i++){
  const candidate=String(result[i].transcript||"");
  const words=norm(candidate).split(" ");
  const context=(recognizedCallsign(candidate)?4:0)+(/\b(pam|pan|mayden|mayday|meidei|meyday)\b/.test(norm(candidate))?2:0)+(/\b(trafico|plataforma|pista|rodaje|mayday)\b/.test(norm(candidate))?1:0);
  const rank=context+(Number(result[i].confidence)||0)*.5-i*.08;
  if(rank>score){score=rank;best=candidate}
 }
 return best;
}
function phoneticDisplay(text){const words=String(text).split(/(\s+)/);return words.map(w=>ICAO_PHONETIC[norm(w)]||w).join("")}
function rtcSpeakDigits(value){const d={"0":"cero","1":"uno","2":"dos","3":"tres","4":"cuatro","5":"cinco","6":"seis","7":"siete","8":"ocho","9":"nueve"};return String(value).split("").map(c=>d[c]||c).join(", ")}
function speechForAviation(t){
 let x=String(t);
 x=x.replace(/\bEC[\s-]*RTC\b/gi,"Eco, Charlie, Romeo, Tango, Charlie");
 x=x.replace(/\bQNH[\s:=-]*(\d{4})\b/gi,(_,v)=>"Q N H, "+rtcSpeakDigits(v));
 x=x.replace(/\bQNH\b/gi,"Q N H");
 x=x.replace(/\b(pista\s+)(\d{2})\b/gi,(_,prefix,v)=>prefix+rtcSpeakDigits(v));
 x=x.replace(/\b(frecuencia\s+)(1\d{2})[.,](\d{1,3})\b/gi,(_,prefix,a,b)=>prefix+rtcSpeakDigits(a)+", decimal, "+rtcSpeakDigits(b.padEnd(3,"0")));
 return x
}
function say(t){if(!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(speechForAviation(t));u.lang="es-ES";u.rate=.84;u.pitch=1;const vs=speechSynthesis.getVoices(),v=vs.find(x=>x.lang.toLowerCase()==="es-es")||vs.find(x=>x.lang.startsWith("es"));if(v)u.voice=v;speechSynthesis.speak(u)}

let rtcNoiseLevel=0,rtcNoiseContext=null,rtcNoiseSource=null;
function rtcStopNoise(){try{rtcNoiseSource?.stop()}catch{}rtcNoiseSource=null}
function rtcStartNoise(){
 rtcStopNoise();if(!rtcNoiseLevel)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  rtcNoiseContext=rtcNoiseContext||new AC();rtcNoiseContext.resume();
  const duration=2,rate=rtcNoiseContext.sampleRate,b=rtcNoiseContext.createBuffer(1,rate*duration,rate),data=b.getChannelData(0);
  let previous=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;previous=(previous+white*.035)/1.035;data[i]=previous*2.2}
  const src=rtcNoiseContext.createBufferSource(),filter=rtcNoiseContext.createBiquadFilter(),gain=rtcNoiseContext.createGain();
  src.buffer=b;src.loop=true;filter.type="bandpass";filter.frequency.value=1450;filter.Q.value=.32;gain.gain.value=rtcNoiseLevel===1?.035:.20;
  src.connect(filter);filter.connect(gain);gain.connect(rtcNoiseContext.destination);src.start();rtcNoiseSource=src;
 }catch(e){rtcStopNoise()}
}
function rtcReceive(t){
 if(!("speechSynthesis"in window))return;
 speechSynthesis.cancel();rtcStopNoise();
 const u=new SpeechSynthesisUtterance(speechForAviation(t));u.lang="es-ES";u.rate=.84;
 const voices=speechSynthesis.getVoices(),v=voices.find(x=>x.lang.toLowerCase()==="es-es")||voices.find(x=>x.lang.startsWith("es"));if(v)u.voice=v;
 u.onstart=()=>rtcStartNoise();u.onend=rtcStopNoise;u.onerror=rtcStopNoise;
 speechSynthesis.speak(u);
}

