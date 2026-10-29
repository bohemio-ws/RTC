'use strict';
// Pruebas de integración de la página real en Node. DOM y micrófono son dobles;
// no sustituyen una prueba visual ni el motor ASR de Chrome/Android.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../simulador.html'),'utf8');
const script=Array.from(source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g),m=>m[1]).join('\n');
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
function environment(){
 const ids=new Map(),all=new Set();
 class Element{
  constructor(tag='div',attrs={},parent=null){this.tagName=tag;this.attrs=attrs;this.parent=parent;this.children=[];this.events={};this.value=attrs.value||'';this.dataset={};this.isConnected=true;this._html='';this._text='';
   for(const [key,val]of Object.entries(attrs))if(key.startsWith('data-'))this.dataset[key.slice(5)]=val;
   const classes=new Set((attrs.class||'').split(' '));this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};
   if(attrs.id)ids.set(attrs.id,this);all.add(this);
  }
  remove(){this.isConnected=false;if(this.attrs.id&&ids.get(this.attrs.id)===this)ids.delete(this.attrs.id);for(const child of this.children)if(typeof child!=='string')child.remove();all.delete(this);}
  set innerHTML(html){
   for(const child of this.children)if(typeof child!=='string')child.remove();this.children=[];this._html=String(html);this._text='';
   const stack=[this],rx=/<\/?[^>]+>|[^<]+/g;let match;
   while((match=rx.exec(this._html))){const part=match[0];
    if(part.startsWith('</')){if(stack.length>1)stack.pop();continue;}
    if(part.startsWith('<')){
     const tag=/^<([\w-]+)/.exec(part)?.[1];if(!tag)continue;
     const attrs={};for(const m of part.matchAll(/([\w-]+)="([^"]*)"/g))attrs[m[1]]=decode(m[2]);
     const parent=stack.at(-1),el=new Element(tag,attrs,parent);parent.children.push(el);
     if(!/^(input|br|hr|img|meta|link|path|circle|rect)$/i.test(tag)&&!part.endsWith('/>'))stack.push(el);
    }else stack.at(-1).children.push(decode(part));
   }
   for(const el of all)if(el.tagName==='select'&&el.isConnected&&!el.value){const option=el.children.find(x=>typeof x!=='string'&&x.tagName==='option');if(option)el.value=option.attrs.value;}
  }
  get innerHTML(){return this._html;}
  set textContent(value){this.innerHTML='';this._text=String(value);}
  get textContent(){return this._text+this.children.map(x=>typeof x==='string'?x:x.textContent).join('');}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  setPointerCapture(){}
  dispatch(name){const event={preventDefault(){},pointerId:1};for(const fn of this.events[name]||[])fn(event);}
 }
 const app=new Element('main',{id:'app'});
 const document={querySelector:s=>s[0]==='#'?ids.get(s.slice(1))||null:null,querySelectorAll:s=>{
  const match=/^\[([^\]=]+)(?:="([^"]*)")?\]$/.exec(s);if(!match)return[];
  return [...all].filter(el=>el.isConnected&&Object.hasOwn(el.attrs,match[1])&&(match[2]===undefined||el.attrs[match[1]]===match[2]));
 }};
 const captures=[];
 class Recognition{
  constructor(){captures.push(this);}
  start(){this.onstart?.();}
  stop(){queueMicrotask(()=>this.onend?.());}
  abort(){this.aborted=true;queueMicrotask(()=>this.onend?.());}
  emit(parts){const results=parts.map(([transcript,isFinal])=>{const item=[{transcript}];item.isFinal=isFinal;return item;});this.onresult?.({resultIndex:0,results});}
 }
 const sandbox={document,SpeechRecognition:Recognition,navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},alert(message){throw Error(message);},console};
 sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(script,sandbox);
 const run=code=>vm.runInContext(code,sandbox),get=id=>document.querySelector('#'+id);
 const begin=(mode='short',from='N',to='S')=>{run('menu()');get('from').value=from;get('to').value=to;run('begin('+JSON.stringify(mode)+')');};
 const transmit=text=>run('evaluate('+JSON.stringify(text)+')');
 const read=()=>JSON.parse(run('JSON.stringify({step:st.step,leg:st.leg,waiting:st.waiting,count:st.scores.length,phase:phase(),ctx:radioContext()})'));
 return {run,get,begin,transmit,read,captures,sandbox,app};
}
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
let passed=0,failed=0;
async function test(name,fn){try{await fn();passed++;}catch(e){failed++;console.error('FAIL '+name+': '+e.stack);}}
const initial='Aeródromo Norte tráfico Eco Charlie Romeo Tango Charlie en plataforma para salida local';
(async()=>{
 await test('rechazo conserva fase y PTT',()=>{const e=environment();e.begin();e.transmit('Aeródromo Norte tráfico Eco Tango Bravo plataforma salida local');assert(!e.get('next'));assert(e.get('retryTransmission'));assert.equal(e.read().step,0);assert(e.read().waiting);assert(e.get('feedback').textContent.includes('Última estación'));});
 await test('sin transmisión no hay vía de salto',()=>{const e=environment();e.begin();e.run('evaluate("",true)');assert(!e.get('next'));assert(!e.get('skip'));assert.equal(e.read().step,0);});
 await test('aceptación requiere continuar explícitamente',()=>{const e=environment();e.begin();e.transmit(initial);assert(e.get('next'));assert.equal(e.read().step,0);assert(!e.read().waiting);});
 await test('doble clic sólo avanza una fase',()=>{const e=environment();e.begin();e.transmit(initial);const next=e.get('next').onclick;next();next();assert.equal(e.read().step,1);});
 await test('reintento breve después de pista incorrecta',()=>{const e=environment();e.begin();e.transmit(initial);e.get('next').onclick();e.transmit('Aeródromo Norte tráfico Eco Tango Charlie punto de espera pista 24 listo para salida');assert(!e.get('next'));e.transmit('Aeródromo Norte tráfico Eco Tango Charlie punto de espera pista 06 listo para salida');assert(e.get('next'));assert(e.get('feedback').textContent.includes('E-TC: Eco Tango Charlie'));});
 await test('repita de piloto mantiene espera de colación',()=>{const e=environment();e.begin('short','S','N');e.transmit('Aeródromo Sur torre EC-RTC plataforma para salida local');e.get('next').onclick();e.transmit('Eco Tango Charlie repita');assert(!e.get('next'));assert.equal(e.read().count,1);assert(e.get('feedback').textContent.includes('Mantenga posición, pista 18.'));e.transmit('Mantengo posición pista 18 Eco Tango Charlie');assert(e.get('next'));});
 await test('siete modelos guiados aceptados',()=>{const e=environment();for(let i=0;i<7;i++){e.run('drillShow('+i+');drillCheck(drills['+i+'].model)');assert(e.get('nextDrill'),'práctica '+i+' '+e.get('feedback').textContent);}});
 await test('prácticas bloquean matrícula parecida',()=>{const e=environment();e.run('drillShow(3);drillCheck("Aeródromo Norte tráfico Eco Tango Bravo viento en cola pista cero seis")');assert(!e.get('nextDrill'));});
 await test('prácticas bloquean otro escenario',()=>{const e=environment();e.run('drillShow(3);drillCheck("Aeródromo Norte tráfico EC-RTC viento en cola y final pista cero seis")');assert(!e.get('nextDrill'));});
 await test('siguiente guiado no acepta doble clic antiguo',()=>{const e=environment();e.run('drillShow(3);drillCheck(drills[3].model)');const next=e.get('nextDrill').onclick;next();next();assert.equal(e.run('drillIdx'),4);});
 await test('PTT ignora un resultado sólo provisional',async()=>{const e=environment();e.begin();const p=e.get('ptt');p.dispatch('pointerdown');await flush();e.captures[0].emit([[initial,false]]);p.dispatch('pointerup');await flush();assert.equal(e.read().count,0);assert(!e.get('next'));assert(e.get('status').textContent.includes('transcripción final'));});
 await test('PTT no acumula un indicativo incorrecto anterior',async()=>{const e=environment();e.begin();const p=e.get('ptt');p.dispatch('pointerdown');await flush();e.captures[0].emit([['Aeródromo Norte tráfico Eco Tango Bravo plataforma salida local',true]]);p.dispatch('pointerup');await flush();assert(!e.get('next'));p.dispatch('pointerdown');await flush();e.captures[1].emit([[initial,true]]);p.dispatch('pointerup');await flush();assert(e.get('next'));assert.equal(e.read().count,2);assert(!e.get('feedback').textContent.includes('Tango Bravo'));});
 await test('identidad provisional no completa un resultado final parcial',async()=>{const e=environment();e.begin();const p=e.get('ptt');p.dispatch('pointerdown');await flush();e.captures[0].emit([['Aeródromo Norte tráfico plataforma salida local',true],['Eco Charlie Romeo Tango Charlie',false]]);p.dispatch('pointerup');await flush();assert(!e.get('next'));assert.equal(e.read().count,1);});
 await test('resultados acumulativos ASR se reconstruyen sin duplicarse',async()=>{const e=environment();e.begin();const p=e.get('ptt');p.dispatch('pointerdown');await flush();const r=e.captures[0];r.emit([['Aeródromo Norte tráfico',true]]);r.emit([['Aeródromo Norte tráfico',true],['EC-RTC plataforma salida local',true]]);p.dispatch('pointerup');await flush();assert(e.get('next'));assert.equal(e.run('st.scores[0].text'),'Aeródromo Norte tráfico EC-RTC plataforma salida local');});
 await test('onend tardío no puntúa dos veces el intento rechazado',async()=>{const e=environment();e.begin();const p=e.get('ptt');p.dispatch('pointerdown');await flush();const r=e.captures[0];r.emit([['Aeródromo Norte tráfico Eco Tango Bravo plataforma salida local',true]]);p.dispatch('pointerup');await flush();r.onend();assert.equal(e.read().count,1);});
 await test('pointercancel conserva fase y puntuación',async()=>{const e=environment();e.begin();const p=e.get('ptt');p.dispatch('pointerdown');await flush();e.captures[0].emit([[initial,true]]);p.dispatch('pointercancel');await flush();assert.equal(e.read().count,0);assert(!e.get('next'));});
 await test('envío escrito cancela reconocimiento pendiente',async()=>{const e=environment();e.begin();e.get('ptt').dispatch('pointerdown');await flush();e.captures[0].emit([['mensaje anterior incorrecto',true]]);e.transmit(initial);await flush();e.captures[0].onend();assert.equal(e.read().count,1);assert(e.get('next'));});
 await test('permiso de micrófono denegado permite escribir',async()=>{const e=environment();e.begin();e.sandbox.navigator.mediaDevices.getUserMedia=async()=>{throw Error('Permiso denegado');};e.get('ptt').dispatch('pointerdown');await flush();assert(e.get('status').textContent.includes('Puedes escribir'));e.transmit(initial);assert(e.get('next'));});
 await test('permiso resuelto después de navegar no reabre micrófono',async()=>{const e=environment();e.begin();let resolve;e.sandbox.navigator.mediaDevices.getUserMedia=()=>new Promise(r=>{resolve=r;});e.get('ptt').dispatch('pointerdown');await flush();e.run('menu()');resolve({getTracks:()=>[{stop(){}}]});await flush();assert.equal(e.captures.length,0);});
 await test('aceptación escrita durante permiso pendiente no inicia captura',async()=>{const e=environment();e.begin();let resolve;e.sandbox.navigator.mediaDevices.getUserMedia=()=>new Promise(r=>{resolve=r;});e.get('ptt').dispatch('pointerdown');await flush();e.transmit(initial);resolve({getTracks:()=>[{stop(){}}]});await flush();assert.equal(e.captures.length,0);assert(e.get('next'));});
 const models=c=>{
  const call=c.allowShort?'Eco Tango Charlie':'Eco Charlie Romeo Tango Charlie',station=c.field.name+' '+(c.field.service.includes('TORRE')?'torre':c.field.service.includes('AFIS')?'información':'tráfico'),r=c.runway;
  if(c.readback){const rb={taxi:`Ruedo al punto de espera pista ${r}`,hold:`Mantengo posición pista ${r}`,lineup:`Entro y alineo pista ${r}`,departure:`Autorizado a despegar pista ${r}`,landing:`Autorizado a aterrizar pista ${r}`};return(c.initialContact?station+' ':'')+rb[c.phase]+', '+call;}
  return (c.initialContact&&!['platform','arrival','hold'].includes(c.phase)?station+' ':'')+{platform:`${station} ${call} en plataforma para salida local`,taxi:`${call} rodando al punto de espera pista ${r}`,hold:`${station} ${call} punto de espera pista ${r} listo para salida`,lineup:`${call} entrando y alineando pista ${r}`,departure:`${call} despegando pista ${r}`,upwind:`${call} en ascenso inicial`,crosswind:`${call} viento cruzado pista ${r}`,exit:`${call} abandonando por punto ${c.field.exit}`,enroute:`${call} en ruta a ${c.destination.name}`,arrival:`${station} ${call} dos millas al norte solicito incorporación`,downwind:`${call} viento en cola pista ${r}`,base:`${call} en base pista ${r}`,final:`${call} en final pista ${r}`,landing:`${call} aterrizando pista ${r}`,parking:`${call} en plataforma estacionado`,emergency:`PAN PAN ${call} pérdida de potencia dos millas al norte solicito regreso`,divert:`${call} en ruta desviando a alternativo`,approach:`${call} aproximación de emergencia para aterrizaje pista ${r}`}[c.phase];
 };
 for(const [mode,from,to]of [['short','N','S'],['long','N','S'],['circuit','S','N'],['emergency','N','S'],['exam','N','S'],['exam','E','O']])
  await test('recorrido completo '+mode+' '+from+'→'+to,()=>{const e=environment();e.begin(mode,from,to);let count=0;while(e.get('ptt')){const s=e.read();assert(count<30);if(mode==='exam'&&s.phase==='arrival'){assert.equal(s.ctx.field.id,s.leg===0?to:from);assert(!s.ctx.allowShort,'contacto nuevo requiere completo');}const text=models(s.ctx);e.transmit(text);assert(e.get('next'),JSON.stringify(s)+' '+text+' '+e.get('feedback').textContent);e.get('next').onclick();count++;}assert.equal(count,mode==='exam'?28:mode==='emergency'?5:mode==='short'?4:12);assert(e.app.textContent.includes('INFORME FINAL'));});
 console.log(`RTC FLOW TESTS: ${passed+failed} total, ${passed} PASS, ${failed} FAIL`);process.exitCode=failed?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
