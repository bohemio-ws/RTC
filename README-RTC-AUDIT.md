# RTC Academy · auditoría previa a producción

Esta rama es de pruebas. **No sustituye `main` hasta completar prueba física.**

## Automatizado

- Sintaxis JavaScript del motor y suite Node.
- Indicativo EC-RTC completo y abreviado solo tras autorización contextual.
- Rechazo de indicativos parciales y parecidos.
- Pista, QNH, rumbo, frecuencia y transpondedor con valores exactos.
- Cero inicial de rumbo y COMA en frecuencia.
- ATC con autoridad; AFIS y AUTOINFO sin autorización ATC.
- MAYDAY/PAN PAN detectables y separados.
- Entradas vacías, ruido, palabras sueltas y miles de combinaciones deterministas.
- 27 módulos con identificadores únicos y descripción.

## Prueba física obligatoria antes de fusionar

1. Abrir `simulador-manual.html` en Android/Chrome.
2. Autorizar micrófono.
3. Mantener PTT, hablar y soltar: confirmar que reconoce y responde.
4. Probar primer contacto completo y abreviación posterior.
5. Pronunciar deliberadamente una pista, QNH, rumbo, frecuencia y transpondedor incorrectos: debe responder NEGATIVO y no avanzar.
6. Repetirlos correctamente: debe avanzar.
7. Probar MAYDAY y PAN PAN; si ASR comprime repeticiones, debe advertir sin falso suspenso.
8. Denegar micrófono o usar navegador sin SpeechRecognition: la entrada escrita debe seguir disponible.
9. Completar el circuito hasta el Libro de comunicaciones.
10. Volver a Academia y comprobar que ningún botón deja pantalla muerta.

## Criterio de fusión

Fusionar PR #2 únicamente después de superar la prueba física anterior y revisar el comportamiento real del reconocimiento de voz en el dispositivo objetivo.
