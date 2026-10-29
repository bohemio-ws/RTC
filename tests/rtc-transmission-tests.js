'use strict';
// Ejecuta el validador incluido en la página publicada, sin una copia alternativa.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../simulador.html'),'utf8');
const code=Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g),m=>m[1]).join('\n');
new vm.Script(code);
const start=code.indexOf('const RTCTransmission ='),end=code.indexOf('const fields=',start),sandbox={};
assert(start>=0&&end>start,'El validador debe estar incluido en simulador.html');
vm.createContext(sandbox);vm.runInContext(code.slice(start,end)+'\nglobalThis.E=RTCTransmission;',sandbox);
const E=sandbox.E;
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}}
const north={id:'N',name:'Aeródromo Norte',service:'AUTOINFO',exit:'W',rwy:'06/24'};
const south={id:'S',name:'Aeródromo Sur',service:'TORRE SIMULADA',exit:'E',rwy:'18/36'};
function context(extra={}){return {phase:'platform',field:north,runway:'06',allowShort:false,initialContact:true,need:['station','callsign','position','intent'],prompt:'Comunica posición e intención.',...extra};}
const assess=(text,extra={})=>E.assess(text,context(extra));
const initial=call=>'Aeródromo Norte tráfico, '+call+', en plataforma, para salida local.';
for(const call of ['EC-RTC','ec rtc','ECRTC','e c r t c','Eco Charlie Romeo Tango Charlie','Echo Charlie Romeo Tango Charlie','Eco Charly Romeo Tango Charlie'])
  test('contacto completo '+call,()=>assert(assess(initial(call)).accepted));
for(const call of ['Eco Tango Charlie','Echo Tango Charlie','E-TC','e t c']){
  test('abreviado se identifica '+call,()=>assert.equal(E.identity(call).registration,'EC-RTC'));
  test('abreviado inicial exige completo '+call,()=>assert.equal(assess(initial(call)).outcome,'IDENTIFY'));
  test('abreviado contextual '+call,()=>assert(assess(initial(call),{allowShort:true,initialContact:false}).accepted));
}
const invalid=['','Eco','Tango Charlie','Romeo Tango Charlie','Eco Charlie Romeo','EC-RT','EC-RTB','EC-RTCC','EC-RTCX','XEC-RTC','Eco Tango Bravo','Eco Bravo Tango Charlie','Eco Tango Charlie Bravo','Tango Eco Charlie','Eco ruido Tango Charlie','Eco Charlie ruido Romeo Tango Charlie','Eco Charlie Romeo Tango Bravo','EC-RTC Eco Tango Bravo','EC-RTB Eco Tango Charlie'];
for(const call of invalid)test('indicativo insuficiente/ambiguo '+JSON.stringify(call),()=>assert(!assess(initial(call),{allowShort:true}).accepted));
test('corrección de indicativo',()=>assert(assess(initial('Eco Charlie Romeo Tango Bravo, corrección Eco Charlie Romeo Tango Charlie')).accepted));
test('identificación no inventa dirección conocida',()=>{
 const r=assess(initial('Eco Tango Bravo'));assert.equal(r.outcome,'IDENTIFY');assert(r.reply.includes('Última estación'));assert(!r.reply.includes('EC-RTC'));
});
test('silencio pide repetición',()=>assert.equal(assess('').outcome,'REPEAT'));
test('etcétera no es un indicativo',()=>assert(!assess('Aeródromo Norte tráfico plataforma salida local etc.',{allowShort:true,initialContact:false}).accepted));
for(const text of ['hola','pista','torre plataforma salida','Aeródromo Norte tráfico, EC-RTC','Aeródromo Norte tráfico, EC-RTC, en plataforma','Aeródromo Norte tráfico, EC-RTC, en final, para salida local','Aeródromo Sur torre, EC-RTC, plataforma salida local','Aeródromo Norte torre, EC-RTC, plataforma salida local'])
 test('contenido insuficiente/otra fase '+text,()=>assert(!assess(text).accepted));
const finalCtx={phase:'final',need:['callsign','position','runway'],initialContact:false,allowShort:true,runwayRequired:true};
for(const value of ['06','cero seis','0 seis'])test('pista exacta '+value,()=>assert(assess('Eco Tango Charlie, en final, pista '+value,finalCtx).accepted));
for(const value of ['24','dos cuatro','6','seis','veinticuatro','','cero ruido seis','cero seis dos cuatro','06 y 24'])
 test('rechaza pista '+JSON.stringify(value),()=>assert(!assess('Eco Tango Charlie, en final, pista '+value,finalCtx).accepted));
test('otro número no satisface pista',()=>assert(!assess('Eco Tango Charlie, en final, pista 24 QNH 1006',finalCtx).accepted));
test('pistas contradictorias',()=>assert(!assess('Eco Tango Charlie, en final pista 06 y pista 24',finalCtx).accepted));
test('corrección de pista',()=>assert(assess('Eco Tango Charlie, en final pista 24, corrección pista cero seis',finalCtx).accepted));
test('fase base comunicada como final',()=>assert(!assess('Eco Tango Charlie, en final pista 06',{...finalCtx,phase:'base'}).accepted));
test('dos fases contradictorias',()=>assert(!assess('Eco Tango Charlie, en base y final pista 06',{...finalCtx,phase:'base'}).accepted));
test('posición negada',()=>assert(!assess('Eco Tango Charlie, no estoy en final pista 06',finalCtx).accepted));
test('destino de la intención no cambia posición',()=>assert(assess('Eco Tango Charlie, en base hacia final pista 06',{...finalCtx,phase:'base'}).accepted));
const hold={phase:'hold',field:south,runway:'18',allowShort:true,initialContact:false,readback:true,runwayRequired:true,need:['station','callsign','position','intent'],instruction:'Mantenga posición, pista 18.'};
test('colación de espera',()=>assert(assess('Mantengo posición pista uno ocho, Eco Tango Charlie',hold).accepted));
for(const text of ['Eco Tango Charlie recibido','Eco Tango Charlie, mantengo posición pista 18','Entrando en pista 18, Eco Tango Charlie','Mantengo posición pista 36, Eco Tango Charlie'])
 test('colación insuficiente '+text,()=>assert(!assess(text,hold).accepted));
test('NEGATIVO repite instrucción correcta',()=>{
 const r=assess('Mantengo posición pista 36, Eco Tango Charlie',hold);assert.equal(r.outcome,'NEGATIVE');assert(r.reply.includes('Mantenga posición, pista 18.'));
});
test('piloto solicita repetición',()=>{
 const r=assess('Eco Tango Charlie, repita pista',hold);assert(!r.accepted);assert(r.informational);assert.equal(r.reply,hold.instruction);
});
test('autoinformación no autoriza',()=>assert(!assess(initial('EC-RTC')+' Autorizado para salida.').accepted));
test('AFIS no autoriza',()=>assert(!assess('Aeródromo Sur información EC-RTC plataforma salida local autorizado',{field:{...south,service:'AFIS SIMULADO'}}).accepted));
const exit={phase:'exit',allowShort:true,initialContact:false,need:['callsign','position','intent']};
test('punto Whisky correcto',()=>assert(assess('Eco Tango Charlie, abandonando por punto Whisky',exit).accepted));
test('punto Eco incorrecto',()=>assert(!assess('Eco Tango Charlie, abandonando por punto Eco',exit).accepted));
const enroute={phase:'enroute',allowShort:true,initialContact:false,need:['callsign','position','intent'],destination:south};
test('destino correcto',()=>assert(assess('EC-RTC en ruta a Aeródromo Sur',enroute).accepted));
test('destino incorrecto',()=>assert(!assess('EC-RTC en ruta a Aeródromo Oeste',enroute).accepted));
test('destinos contradictorios',()=>assert(!assess('EC-RTC en ruta a Aeródromo Oeste y a Aeródromo Sur',enroute).accepted));
test('estación correcta sólo en el destino no valida destinatario',()=>assert(!assess('Aeródromo Sur tráfico EC-RTC en plataforma para salida local a Aeródromo Norte').accepted));
test('estación después del indicativo no establece contacto',()=>assert(!assess('EC-RTC Aeródromo Norte tráfico en plataforma para salida local').accepted));
const emergency={phase:'emergency',initialContact:false,allowShort:true,need:['signal','callsign','nature','position','intent'],signal:'PAN PAN'};
test('urgencia contextual',()=>assert(assess('PAN PAN PAN PAN PAN PAN Eco Tango Charlie pérdida de potencia dos millas al norte solicito regreso',emergency).accepted));
test('panpan transcrito unido',()=>assert(assess('PANPAN Eco Tango Charlie pérdida de potencia dos millas al norte solicito regreso',emergency).accepted));
test('otra prioridad',()=>assert(!assess('MAYDAY Eco Tango Charlie pérdida de potencia dos millas al norte solicito regreso',emergency).accepted));
test('MAYDAY en su escenario',()=>assert(assess('MAYDAY MAYDAY MAYDAY Eco Tango Charlie parada de motor dos millas al oeste aterrizaje forzoso',{...emergency,signal:'MAYDAY'}).accepted));
const models={platform:'Aeródromo Norte tráfico EC-RTC en plataforma para salida local',taxi:'EC-RTC rodando al punto de espera pista 06',hold:'Aeródromo Norte tráfico EC-RTC punto de espera pista 06 listo para salida',lineup:'EC-RTC entrando y alineando pista 06',departure:'EC-RTC despegando pista 06',upwind:'EC-RTC en ascenso inicial',crosswind:'EC-RTC viento cruzado pista 06',downwind:'EC-RTC viento en cola pista 06',base:'EC-RTC en base pista 06',final:'EC-RTC en final pista 06',landing:'EC-RTC aterrizando pista 06',parking:'EC-RTC en plataforma estacionado',exit:'EC-RTC abandonando por punto Whisky',enroute:'EC-RTC en ruta a Aeródromo Sur',arrival:'Aeródromo Norte tráfico EC-RTC dos millas al norte solicito incorporación',emergency:'PAN PAN EC-RTC pérdida de potencia dos millas al norte solicito regreso',divert:'EC-RTC en ruta desviando a alternativo',approach:'EC-RTC aproximación de emergencia para aterrizaje pista 06'};
const phaseNeeds={platform:['station','callsign','position','intent'],taxi:['callsign','intent'],hold:['station','callsign','position','intent'],lineup:['callsign','intent','runway'],departure:['callsign','intent','runway'],upwind:['callsign','position','intent'],crosswind:['callsign','position'],downwind:['callsign','position','intent'],base:['callsign','position'],final:['callsign','position','runway'],landing:['callsign','intent'],parking:['callsign','position'],exit:['callsign','position','intent'],enroute:['callsign','position','intent'],arrival:['station','callsign','position','intent'],emergency:['signal','callsign','nature','position','intent'],divert:['callsign','position','intent'],approach:['callsign','position','intent']};
for(const [phase,text]of Object.entries(models))test('fase alcanzable '+phase,()=>{
 const r=assess(text,{phase,need:phaseNeeds[phase],initialContact:phase==='platform',allowShort:phase!=='platform',runwayRequired:['taxi','hold','lineup','departure','crosswind','downwind','base','final','landing','approach'].includes(phase),signal:'PAN PAN'});
 assert(r.accepted,JSON.stringify(r));
});
for(const [phase,text]of Object.entries({taxi:'Ruedo al punto de espera pista 18, EC-RTC',hold:'Mantengo posición pista 18, EC-RTC',lineup:'Entro y alineo pista 18, EC-RTC',departure:'Autorizado a despegar pista 18, EC-RTC',landing:'Autorizado a aterrizar pista 18, EC-RTC'}))
 test('colación alcanzable '+phase,()=>assert(assess(text,{...hold,phase,need:phaseNeeds[phase]}).accepted));
test('escenario desconocido se bloquea',()=>assert(!assess('EC-RTC',{phase:'desconocida'}).accepted));
console.log('RTC TRANSMISSION TESTS: '+(passed+failed)+' total, '+passed+' PASS, '+failed+' FAIL');
process.exitCode=failed?1:0;
