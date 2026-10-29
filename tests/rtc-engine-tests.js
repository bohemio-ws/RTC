global.window=global;require('../rtc-manual-engine.js');
const E=global.RTCManualEngine;let pass=0,fail=0;const errors=[];
function t(name,fn){try{if(!fn())throw Error('false');pass++}catch(e){fail++;errors.push(name+': '+e.message)}}
function A(text,need=[],short=false,extra={}){return E.assess(text,{registration:'EC-RTC',shortAuthorized:short,stationName:'Torre',callsignAddress:short?'Echo Tango Charlie':'Echo Charlie Romeo Tango Charlie',need,...extra})}
// Indicativos y abreviación
t('full callsign',()=>A('Torre Echo Charlie Romeo Tango Charlie',['station','callsign']).advance);
t('ASR Eco tolerated',()=>A('Torre Eco Charlie Romeo Tango Charlie',['station','callsign']).advance);
t('short blocked initial',()=>!A('Torre Echo Tango Charlie',['station','callsign']).advance);
t('short allowed',()=>A('Echo Tango Charlie recibido',['callsign'],true).advance);
t('partial blocked',()=>!A('Torre Echo Charlie Romeo',['station','callsign']).advance);
t('wrong similar blocked',()=>!A('Torre Echo Charlie Romeo Tango Bravo',['station','callsign']).advance);
// Estructura
t('position intent',()=>A('Echo Tango Charlie plataforma solicito rodaje',['callsign','position','intent'],true).advance);
t('missing intent',()=>!A('Echo Tango Charlie plataforma',['callsign','position','intent'],true).advance);
t('missing position',()=>!A('Echo Tango Charlie solicito salida',['callsign','position','intent'],true).advance);
t('identify response',()=>A('Torre plataforma solicito rodaje',['station','callsign','position','intent']).outcome==='IDENTIFY');
// Valores críticos
t('runway 30',()=>A('Echo Tango Charlie pista tres cero',['callsign','runway'],true,{expected:{runway:'30'}}).advance);
t('runway wrong',()=>A('Echo Tango Charlie pista uno dos',['callsign','runway'],true,{expected:{runway:'30'}}).outcome==='NEGATIVE');
t('qnh 1017',()=>A('Echo Tango Charlie QNH uno cero uno siete',['callsign','qnh'],true,{expected:{qnh:'1017'}}).advance);
t('qnh wrong',()=>!A('Echo Tango Charlie QNH uno cero uno cinco',['callsign','qnh'],true,{expected:{qnh:'1017'}}).advance);
t('heading 090',()=>A('Echo Tango Charlie rumbo cero nueve cero',['callsign','heading'],true,{expected:{heading:'090'}}).advance);
t('heading 90 blocked',()=>!A('Echo Tango Charlie rumbo nueve cero',['callsign','heading'],true,{expected:{heading:'090'}}).advance);
t('frequency 121.5',()=>A('Echo Tango Charlie frecuencia uno dos uno coma cinco',['callsign','frequency'],true,{expected:{frequency:'121.5'}}).advance);
t('frequency no comma blocked',()=>!A('Echo Tango Charlie frecuencia uno dos uno cinco',['callsign','frequency'],true,{expected:{frequency:'121.5'}}).advance);
t('squawk 7700',()=>A('Echo Tango Charlie transpondedor siete siete cero cero',['callsign','squawk'],true,{expected:{squawk:'7700'}}).advance);
t('squawk 7600 wrong',()=>!A('Echo Tango Charlie transpondedor siete seis cero cero',['callsign','squawk'],true,{expected:{squawk:'7700'}}).advance);
t('unrelated number cannot satisfy runway',()=>!A('Echo Tango Charlie pista uno dos QNH uno cero tres cero',['callsign','runway'],true,{expected:{runway:'30'}}).advance);
// Prioridades y servicios
t('mayday detected',()=>E.slots('mayday mayday mayday control Echo Tango Charlie fallo motor final',{registration:'EC-RTC',shortAuthorized:true}).mayday);
t('pan detected',()=>E.slots('pan pan pan pan pan pan control Echo Tango Charlie problema motor',{registration:'EC-RTC',shortAuthorized:true}).pan);
t('ATC authority',()=>E.serviceCanAuthorize('ATC'));
t('AFIS no authority',()=>!E.serviceCanAuthorize('AFIS'));
t('AUTOINFO no authority',()=>!E.serviceCanAuthorize('AUTOINFO'));
t('AFIS role',()=>E.serviceProfile('AFIS').role==='información');
// Normalización
t('Echo canonical',()=>E.norm('Eco Charlie')==='echo charlie');
t('accent',()=>E.norm('APROXIMACIÓN')==='aproximacion');
t('may day',()=>E.norm('May day')==='mayday');
t('frequency words',()=>E.frequencyWords('118.15')==='uno uno ocho coma uno cinco');
// Entradas basura y falsos positivos
const noise=['hola','prueba','coche carretera','buenas tardes','uno dos','motor','pista','torre','echo','charlie','qnh','rumbo','7700','121 coma 5','pan','mayday'];
for(let i=0;i<3000;i++){const x=noise[i%noise.length]+' '+noise[(i*7+3)%noise.length];t('critical fuzz '+i,()=>!A(x,['station','callsign','position','intent']).advance)}
for(let i=0;i<1000;i++)t('minimal '+i,()=>!A(i%2?'x':'',[]).advance);
// Variaciones deterministas de valores erróneos
for(let i=1;i<=36;i++){const v=String(i).padStart(2,'0');if(v!=='30')t('wrong runway '+v,()=>!A('Echo Tango Charlie pista '+E.digitWords(v),['callsign','runway'],true,{expected:{runway:'30'}}).advance)}
for(let i=0;i<360;i+=10){const v=String(i).padStart(3,'0');if(v!=='090')t('wrong heading '+v,()=>!A('Echo Tango Charlie rumbo '+E.digitWords(v),['callsign','heading'],true,{expected:{heading:'090'}}).advance)}
console.log(`RTC ENGINE STRESS TESTS\nTOTAL ${pass+fail} PASS ${pass} FAIL ${fail}`);if(errors.length)console.error(errors.slice(0,50).join('\n'));process.exitCode=fail?1:0;