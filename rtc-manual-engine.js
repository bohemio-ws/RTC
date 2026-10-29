/* RTC Academy · motor didáctico basado en Manual_radiofonia_1.pdf
   Objetivo: conversación, no avance automático. Integración progresiva con simulador.html.
*/
(function(global){
'use strict';
const PH={A:'alfa',B:'bravo',C:'charlie',D:'delta',E:'eco',F:'foxtrot',G:'golf',H:'hotel',I:'india',J:'juliett',K:'kilo',L:'lima',M:'mike',N:'november',O:'oscar',P:'papa',Q:'quebec',R:'romeo',S:'sierra',T:'tango',U:'uniform',V:'victor',W:'whiskey',X:'x ray',Y:'yankee',Z:'zulu'};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const has=(s,re)=>re.test(norm(s));
function fullCallsign(reg='EC-RTC'){return reg.replace(/[^A-Z0-9]/gi,'').toUpperCase().split('').map(c=>PH[c]||c).join(' ')}
function shortRegistration(reg='EC-RTC'){const s=reg.replace(/[^A-Z0-9]/gi,'').toUpperCase();return s.length>=3?s[0]+'-'+s.slice(-2):s}
function shortCallsign(reg='EC-RTC'){return shortRegistration(reg).replace(/[^A-Z0-9]/gi,'').split('').map(c=>PH[c]||c).join(' ')}
function callsignHeard(text,reg='EC-RTC',allowShort=false){const n=norm(text),f=norm(fullCallsign(reg)),sh=norm(shortCallsign(reg)),raw=norm(reg),shortRaw=norm(shortRegistration(reg));return n.includes(f)||n.includes(raw)||(allowShort&&(n.includes(sh)||n.includes(shortRaw)))}
const SLOT={station:/\b(torre|control|aproximacion|radar|rodadura|superficie|informacion|radio|recalada|trafico|afis)\b/,position:/\b(plataforma|rodaje|espera|pista|viento en cola|base|final|vertical|millas?|kilometros?|pies|norte|sur|este|oeste|punto|ascenso)\b/,intent:/\b(solicit|salid|despeg|aterr|incorpor|rodaj|abandon|notific|entr|continu|frustr|desvi|regres|dirig|proced|manten)\w*/,runway:/\b(pista|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|06|24|18|36|09|27|12|30)\b/,qnh:/\b(qnh|q n h|uno cero|presion)\b/,repeat:/\b(repita|repetir)\b/,correction:/\b(correccion)\b/,confirm:/\b(confirme|confirmo)\b/,mayday:/\b(mayday|may day)\b/,pan:/\b(pan pan|panpan)\b/,nature:/\b(motor|potencia|humo|fuego|combustible|averia|fallo|enfermedad|problema)\b/,heading:/\b(rumbo|norte|sur|este|oeste)\b/,altitude:/\b(pies|altura|altitud|nivel)\b/};
function slots(text,ctx={}){const n=norm(text),v={};Object.keys(SLOT).forEach(k=>v[k]=SLOT[k].test(n));v.callsign=callsignHeard(text,ctx.registration||'EC-RTC',!!ctx.shortAuthorized);v.signal=v.mayday||v.pan;return v}
function assess(text,ctx={}){
 const t=String(text||'').trim(),v=slots(t,ctx),need=ctx.need||[],missing=need.filter(k=>!v[k]);
 const understood=t.length>2, ratio=need.length?(need.length-missing.length)/need.length:1;
 let outcome='ACCEPT',reply='',advance=true,severity='ok';
 if(!understood){outcome='REPEAT';reply=(ctx.callsignAddress||'Última estación')+', REPITA.';advance=false;severity='warn'}
 else if(need.includes('callsign')&&!v.callsign){outcome='IDENTIFY';reply='Última estación llamando a '+(ctx.stationName||'la estación')+', ¿cuál es su indicativo?';advance=false;severity='warn'}
 else if(ctx.readbackError){outcome='NEGATIVE';reply='NEGATIVO. '+ctx.correctInstruction;advance=false;severity='critical'}
 else if(missing.length){outcome=ratio>=0.6?'CONFIRM':'REPEAT';reply=outcome==='CONFIRM'?'CONFIRME '+missing.map(label).join(', ')+'.':'REPITA.';advance=false;severity='warn'}
 else reply=ctx.acceptReply||((ctx.callsignAddress||shortCallsign(ctx.registration||'EC-RTC'))+', recibido.');
 return {outcome,reply,advance,severity,missing,ratio,slots:v,text:t};
}
function label(k){return ({station:'estación llamada',callsign:'indicativo',position:'posición',intent:'intención',runway:'pista',qnh:'QNH',signal:'prioridad',nature:'naturaleza',heading:'rumbo',altitude:'nivel o altitud'}[k]||k)}
const modules=[
 {id:'disciplina',pages:'21',title:'Disciplina y PTT',game:'Escucha el canal, evita pisar transmisiones y transmite solo al tener el turno.'},
 {id:'indicativos',pages:'21-24',title:'Indicativos y alfabeto',game:'Primer contacto con indicativo completo; abreviado solo después de que ATC lo use.'},
 {id:'numeros',pages:'25-27',title:'Números, pistas, QNH y frecuencias',game:'Valores variables para escuchar y repetir sin memorizar el ejercicio.'},
 {id:'contacto',pages:'27-28',title:'Establecimiento y fraseología',game:'Construye llamadas con estación llamada, estación que llama y mensaje.'},
 {id:'colacion',pages:'29-30',title:'Colaciones',game:'Detecta discrepancias críticas; NEGATIVO y nueva oportunidad sin avanzar.'},
 {id:'legibilidad',pages:'30-31',title:'Legibilidad y REPITA',game:'La estación puede no entender toda la transmisión o solo el indicativo.'},
 {id:'correcciones',pages:'31',title:'CORRECCIÓN y repeticiones',game:'Corrige errores propios y solicita únicamente el dato que no has recibido.'},
 {id:'emergencia',pages:'32-35',title:'MAYDAY',game:'Escenario dinámico: naturaleza, intención, posición, nivel y rumbo según sea posible.'},
 {id:'urgencia',pages:'35-36',title:'PAN PAN',game:'Distingue urgencia de peligro y prioriza la información útil.'},
 {id:'vfr',pages:'37',title:'Procedimientos VFR',game:'Entradas, salidas, posición, transpondedor y comunicaciones aplicables al vuelo.'},
 {id:'transponder',pages:'38-39',title:'Transpondedor',game:'Asocia códigos y modos con el escenario sin convertirlo en navegación real.'},
 {id:'acronimos',pages:'40-41',title:'Acrónimos',game:'Reto rápido de conceptos y códigos Q como repaso final.'}
];
global.RTCManualEngine={norm,fullCallsign,shortRegistration,shortCallsign,callsignHeard,slots,assess,modules};
})(window);
