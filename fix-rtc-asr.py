from pathlib import Path

for filename in ('index.html', 'rtc-v059.html'):
    p = Path(filename)
    s = p.read_text(encoding='utf-8')
    old = '''recognition.onresult=e=>{
    let finalText="",interimText="";
    for(let i=0;i<e.results.length;i++){
     const t=rtcChooseAlternative(e.results[i]).trim();
     if(e.results[i].isFinal)finalText+=(finalText?" ":"")+t;else interimText+=(interimText?" ":"")+t;
    }
    render((finalText+" "+interimText).trim());
   };'''
    new = '''let resultSlots=[];
   recognition.onresult=e=>{
    for(let i=e.resultIndex;i<e.results.length;i++){
     resultSlots[i]=rtcChooseAlternative(e.results[i]).trim();
    }
    render(resultSlots.filter(Boolean).join(" "));
   };'''
    if old not in s:
        raise SystemExit(f'{filename}: ASR block not found')
    s = s.replace(old, new, 1)
    s = s.replace('VERSIÓN 0.67 · 20 OCT 2026 · EC-RTC', 'VERSIÓN 0.69 · 20 OCT 2026 · EC-RTC')
    p.write_text(s, encoding='utf-8')
