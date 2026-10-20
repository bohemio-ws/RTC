from pathlib import Path

for filename in ('index.html', 'rtc-v059.html'):
    p = Path(filename)
    s = p.read_text(encoding='utf-8')
    old = 'for(let i=0;i<e.results.length;i++)'
    if old not in s:
        raise SystemExit(f'{filename}: recognition loop not found')
    s = s.replace(old, 'for(let i=e.resultIndex;i<e.results.length;i++)', 1)
    s = s.replace('VERSIÓN 0.67 · 20 OCT 2026 · EC-RTC', 'VERSIÓN 0.69 · 20 OCT 2026 · EC-RTC')
    p.write_text(s, encoding='utf-8')
