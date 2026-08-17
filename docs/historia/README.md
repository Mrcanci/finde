# Historia

Registro de **trabajo cerrado y en `main`**. No es estado y no es diagnóstico.

| Carpeta | Qué es |
|---|---|
| `docs/estado.md` | **El presente.** Dónde quedó el trabajo, qué está abierto, qué no se puede romper. Se lee al empezar cada tanda |
| `docs/historia/` | **Lo que ya se hizo.** La investigación, la medición y el porqué de cada tanda cerrada. Se lee solo cuando hace falta reconstruir una decisión |
| `docs/audits/` | **Diagnósticos de un momento.** Fotos del estado de algo, con o sin ejecución posterior |
| `docs/decisiones.md` | **Por qué se decidió cada cosa.** Solo se agrega, nunca se borra |
| `.claude/rules/` | **Las barandas.** Se cargan solas al tocar los archivos que cubren |

## Por qué existe esta carpeta

`docs/estado.md` llegó a **1.767 líneas** el 2026-08-16, después de duplicarse en
dos días. Se lee entero al empezar cada sesión, así que estaba gastando contexto
que debería ir al trabajo.

Al medirlo, **las secciones que de verdad responden "dónde estoy y qué no puedo
romper" sumaban 74 líneas**. El resto era narrativa de trabajo ya cerrado.

**Nada se borró.** Lo que estaba cerrado se movió acá, lo que era regla se
promovió a `.claude/rules/`, y `docs/estado.md` volvió a ser un estado.

## Los archivos

| Archivo | Qué cubre |
|---|---|
| `2026-08-motor-inventario.md` | Los cinco pasos del motor de salidas y cupos, la sobreventa, el `P2028` del barrido |
| `2026-08-rendimiento-imagenes.md` | Las tandas 1B y 1C, y el procesamiento de fotos en el navegador. **11,8 MB sacados entre las tres** |
| `2026-08-router-y-urls.md` | La tanda 2: URLs por vista, deep link a la ficha, la pantalla de 404 |
| `2026-08-sello-verificacion.md` | El bloqueante de lanzamiento: nueve agencias con el sello sin tenerlo ganado |
| `2026-08-tipografia.md` | Las fases 0 a 5 del plan tipográfico y el cierre de las cuatro canillas de em-dashes |
| `2026-08-analitica-y-endpoints-ia.md` | Vercel Analytics, su costo medido, y los endpoints de IA que pasaron a exigir agencia |

## La regla que evita volver a esto

Está en `.claude/rules/metodo.md`: **al cerrar una tanda, el detalle va a
`docs/historia/` y a `docs/estado.md` va una fila.**

El motivo no es que el estado quede prolijo. Es mecánico: **lo único que se carga
solo son las reglas con alcance.** Todo lo demás hay que ir a buscarlo, y un
archivo que nadie termina de leer es información que existe pero no está
disponible.
