# RTC Academy — plan de reconstrucción modular
Estado: rama de desarrollo `refactor/modular-rtc`. La versión publicada NO se modifica durante la reconstrucción.

## Principios obligatorios
1. Un solo motor PTT compartido por prácticas y simulación.
2. Captura de audio con MediaRecorder, independiente del silencio y del reconocimiento.
3. Transcripción como servicio separado, con estado "no disponible" si no existe motor compatible; nunca simular reconocimiento.
4. Evaluación sobre mensaje completo y confirmado, no sobre fragmentos intermedios.
5. Sin nota si la transcripción está incompleta, no confirmada o ausente.
6. Motor de escenarios separado: autoinformación sin respuesta, AFIS, ATC y avión-avión.
7. Fuentes AESA/SERA verificadas, distinguiendo UAS de ULM.
8. Ningún cambio a main sin pruebas automáticas y prueba funcional Android.

## Estructura prevista
- index.html: entrada y navegación
- src/app.js: aplicación y eventos
- src/audio/ptt.js: inicio/fin manual y permisos
- src/audio/recorder.js: grabación completa y reproducción
- src/audio/transcriber.js: interfaz de transcripción y fallos explícitos
- src/aviation/phraseology.js: interpretación y datos críticos
- src/aviation/scenarios.js: tráfico y respuestas
- src/training/lessons.js: contenido didáctico
- src/training/grading.js: rúbrica y puntuación
- src/ui/views.js: interfaz
- tests/: pruebas de PTT, pausas, reconocimiento, puntuación y escenarios

## Pruebas de aceptación antes de publicar
- Una pausa de 5 segundos NO termina la grabación.
- El PTT solo se detiene por orden explícita del usuario.
- No aparece selección de texto ni menú copiar sobre el PTT.
- La grabación íntegra se reproduce con sonido.
- Chrome y otro navegador Android: permisos, inicio, fin, reproducción.
- El sistema NO afirma haber transcrito cuando solo ha grabado.
- Una comunicación truncada no recibe 75 % ni otro aprobado.
- QNH 1017 se pronuncia uno cero uno siete.
- El silencio en autoinformación no se penaliza como ausencia de respuesta ATS.
- Las autorizaciones ATC no se presumen por silencio.

## Política de versiones
- Mantener `main` sin cambios durante reconstrucción.
- Cambios aislados en `refactor/modular-rtc`.
- Pruebas antes de integrar; registro de cambios y vuelta atrás posible.
- No anunciar versión estable hasta verificarla en dispositivos reales.

## Prioridad
1. PTT y grabación fiable.
2. Transcripción automática realmente integrada o limitación declarada.
3. Evaluación de datos críticos.
4. Migración de lecciones y prácticas.
5. Tráfico avión-avión y autoinformación.
6. Pruebas de regresión y publicación.
