# CLAUDE.md

Guía para Claude Code en este repositorio.

## Qué es Finde

Marketplace mobile-first de tours en Perú con búsqueda semántica por IA y soporte de quechua. Conecta viajeros con agencias formales peruanas. Producción: **finde.pe** (Vercel, proyecto `mrcancis-projects/finde`). QA: **dev.finde.pe** (rama `dev`).

### Cómo se verifica una agencia: proceso manual

La verificación contra SUNAT y MINCETUR **existe y está vigente, pero la hace José a mano**, no el código. Así funciona hoy:

1. La agencia se da de alta. El onboarding valida que el RUC tenga **11 dígitos**, nada más: no hay llamada a SUNAT ni a MINCETUR.
2. José valida el RUC contra SUNAT y el registro contra MINCETUR por fuera del sistema.
3. Si pasa, José marca `Operator.verified = true` en Supabase a mano. Ningún proceso automático toca ese campo.
4. `Operator.mincetur` es el número que la agencia declara. `gateOperatorMincetur` (`lib/tour-select.ts`) lo muestra al público solo si `verified` es true.

**Esto es el proceso vigente, no una carencia.** Automatizarlo no es prioridad y **no es deuda técnica**: al volumen actual el paso manual alcanza y da mejor criterio que una API. No propongas automatizarlo ni lo listes como pendiente.

Lo que sí importa al escribir: cuando el copy dice "validamos el RUC en SUNAT", eso describe **el proceso**, no una integración. No lo cites como comportamiento del código.

Estado actual del trabajo: leer `docs/estado.md` antes de empezar cualquier tanda.
**Son 218 líneas al 2026-08-17 y se lee entero.** Venía de una poda de 1.767 a
174; si pasa de **250**, hay que podarlo otra vez (ver `.claude/rules/metodo.md`,
"Cómo se escribe la documentación"). **Ese número sale de `wc -l`, no a ojo**, y
se actualiza acá cuando se actualiza el estado.

## Cómo comunicarte conmigo

José no es técnico. La comunicación se ajusta a eso:

- Español peruano, casual y directo. Conclusiones primero.
- Explicá en términos de negocio, no de implementación, salvo que se pida el detalle.
- Nada de em-dashes en ningún texto que generes.
- Antes de cambiar código en algo no trivial, explicá en palabras simples qué vas a hacer y por qué, y esperá el visto bueno.
- Al cerrar una tanda, incluí siempre la salida literal de `git log --oneline -6` y el nombre de la rama activa.

## Alcance

- Hacé exactamente lo que se pidió. Ni más, ni menos.
- No refactorices código que no sea parte de la tarea, aunque veas cómo mejorarlo. Si encontrás algo, mencionalo al final sin tocarlo.
- Si la tarea toca más de un archivo o parece requerir cambios de arquitectura, pará y proponé un plan antes de escribir.
- Corregí solo lo que se señaló. No arregles de paso otras cosas del mismo archivo.
- No delegues a subagentes tareas que resolvés con Read o Grep directo.

## Verbosidad

Respuestas breves por defecto. Cuando escribas un documento a disco, mantenelo compacto salvo que se pida largo explícitamente.

## Terminología (innegociable en texto visible al usuario)

- **agencia / agencias**, nunca "operador" ni "operadores"
- **tour / tours**, nunca "experiencia" como sustantivo del producto
- Segunda persona ("tú"), español peruano, sin vocabulario ibérico
- Sin em-dashes, tampoco en texto generado por IA dentro del producto

Excepción: en el código existen `Operator`, `/api/operators`, `requireOperator`. Eso es deuda de nomenclatura interna y **se queda**. La regla aplica solo a copy visible.

## Reglas de negocio que no se rompen

- Sin RUC una agencia no puede vender. No hay excepción.
- Todo tour necesita política de cancelación visible **antes** de pagar (exigencia INDECOPI).
- Nada falso visible al usuario real: sin ratings inventados, sin datos mock, sin moderación simulada.
- La búsqueda IA no puede afirmar datos geográficos, distancias ni tiempos de viaje que no estén en los datos del tour.

Detalle completo en **`finde-reglas-negocio-v1_3.md`** (raíz del repo). No lo muevas.

## Archivos protegidos

- **`src/Landing.jsx`**: NO modificar bajo ninguna circunstancia. Requiere la frase explícita "EXCEPCIÓN AUTORIZADA" del usuario.
- **`prisma/schema.prisma`**: solo vía `prisma db push`, **nunca** `migrate dev` (causa drift con extensiones Supabase). Documentar cada cambio en `docs/migrations/` y actualizar `docs/migrations/README.md`.

## Flujo dev → QA → prod (OBLIGATORIO)

1. Verificar con `git branch --show-current` que estamos en `dev`. Nunca trabajar sobre `main`.
2. Implementar y validar en localhost:3000.
3. Commit atómico y push a `dev`.
4. **DETENERSE** y pedir QA en dev.finde.pe, con checklist corto y específico de qué validar (páginas, flujos, casos borde). Nunca genérico.
5. Mergear a `main` solo con confirmación explícita de José post-QA.

### Por qué el QA usa solo `demo@finde.pe`

**dev.finde.pe corre contra la base de datos de PRODUCCIÓN, y `RESEND_API_KEY` está cargada en los tres entornos (Development, Preview y Production). Las dos cosas son a propósito.**

Los correos desde dev **son intencionales**: sin ellos no se puede probar el flujo completo de reservas y salidas, que termina justamente en un correo. Un QA que no manda correos no prueba nada. **Apagar Resend en dev rompería las pruebas, así que no se apaga.** No lo trates como defecto ni propongas "arreglarlo" con un flag de entorno.

La contrapartida es que el envío es real y no distingue destinatario:

- Confirmar o rechazar una salida en dev.finde.pe **manda correos reales** a las direcciones reales de los viajeros de esa salida.
- Crear una reserva sobre el tour de una agencia real **le manda un correo real a esa agencia**.
- Nada de esto se puede deshacer.

**Por eso el QA se hace solo con la cuenta demo (`demo@finde.pe`) y sobre tours de cuentas `@finde.pe`.** Esa es la contención: no se apaga el envío, se controla sobre quién cae. Nunca sobre tours ni reservas de agencias reales. Los datos que crees, borralos al terminar.

Local y producción también comparten la misma base de Supabase. Cuidado al sembrar o borrar.

## Nivel de effort (Opus 5)

| Nivel | Cuándo |
|---|---|
| `low` | Copy, una línea, lecturas simples |
| `medium` | Sub-pasos de un solo archivo, bugs acotados |
| `high` (default) | Investigación, feature de un componente, debugging normal |
| `xhigh` | Refactors multiarchivo, integraciones completas, migraciones de esquema |

El effort controla cuánto piensa, no cuán largo responde. El largo se pide aparte.

## Convenciones de código

- Logs en **español**, código e identificadores en **inglés**.
- TypeScript estricto en `/api/`, `/lib/`, `/scripts/`. Frontend queda en JSX.
  - **Una excepción, y está medida: `lib/tour-publish.js`.** Es JavaScript plano con tipos en JSDoc y **sin un solo import**, porque lo importan los dos lados (la función serverless y el navegador). Si fuera `.ts` con zod o Prisma adentro, el frontend arrastraría todo eso al bundle y la única salida sería copiar la condición de publicar, que es exactamente el error que ese archivo existe para evitar. **No le agregues imports ni lo migres a TypeScript.** El porqué completo está en `.claude/rules/api-y-schema.md`.
- Imports en `/api/` y `/lib/` **con extensión `.js`** (Node ESM). Sin la extensión, la función falla en runtime.
- Validar todo body con `zod` antes de tocar la DB.
- Usar los singletons de `/lib/`, nunca instanciar Prisma, Anthropic o Voyage ad-hoc.
- Una función serverless por archivo. Siempre manejar 405.
- **Límite Vercel Hobby: 12 funciones. Hoy hay exactamente 12.** No se puede agregar un archivo a `/api/` sin sacar otro. Consolidar en una ruta dinámica existente (ver `api/operators/me/[resource].ts`).
- Variables de entorno en Vercel: cargarlas en **All Environments**, y por el dashboard, no por CLI (el flag `--sensitive` guarda valores vacíos).
- **Nunca `pkill -f`** con patrones amplios (`node`, `vite`, `vercel dev`): mata procesos del usuario en otras terminales. Matar por PID.

## Estructura de carpetas

```
/.claude/rules/ Reglas con alcance, se cargan solas por path. Se commitean.
/api/          Funciones serverless de Vercel (TypeScript). Un archivo = una ruta. Máximo 12.
/lib/          Singletons y lógica compartida del backend (Prisma, Anthropic, Voyage, auth, inventario)
/prisma/       schema.prisma + seed
/scripts/      Scripts sueltos (seed, embeddings, backfills), se corren con tsx
/src/          Frontend React (Vite)
/public/       Estáticos servidos tal cual
/data/track-b/ Snapshots de DB usados como fuente de mocks
/backups/      Dumps de la base (usar el pg_dump v17, ver .claude/rules/api-y-schema.md)
/docs/         Documentación (ver abajo)
```

## Comandos

```bash
npm run dev              # solo frontend, HMR
npm run build            # build de producción
npm run lint             # ESLint

# backend en local (el wrapper de dotenv es necesario)
npx dotenv-cli -e .env.local -- vercel dev

# cambios de schema
npx dotenv-cli -e .env.local -- npx prisma db push

npm run db:generate      # prisma generate
npm run db:studio        # GUI de la DB
npm run db:seed          # sembrar datos
```

### No existe `npm run db:migrate`, y es a propósito

Hasta el 2026-08-17 `package.json` tenía un script `db:migrate` que corría
**`prisma migrate dev`**, el comando que este archivo y `.claude/rules/api-y-schema.md`
prohíben en mayúsculas porque **causa drift con las extensiones de Supabase**.

**Nunca se usó** (no existe `prisma/migrations/` y la base no tiene drift), pero
estaba a un `npm run db:migrate` de distancia, y el nombre es justo el que uno
tipea por costumbre viniendo de otro proyecto Prisma. **Una prohibición escrita
en un documento no protege contra un atajo cargado en `package.json`.**

Hoy ese script se llama **`db:migrate:PROHIBIDO-usar-db-push`** y no corre Prisma:
imprime el motivo y sale con error. El nombre largo es el punto, no un descuido.
**El cambio de schema va por `prisma db push`**, con el procedimiento completo
(backup, push, generate, documentar) en `.claude/rules/api-y-schema.md`.

No hay suite de tests configurada. Cuando un doc dice "verificado con test", fue verificación manual.

Trampa conocida: `DATABASE_URL`, `DIRECT_URL`, `ANTHROPIC_API_KEY` y `VOYAGE_API_KEY` vienen del entorno **Development de Vercel** y pisan lo que haya en `.env.local`. Las tres de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) no están en Development, así que esas sí salen de `.env.local` vía `dotenv-cli`. En `vercel dev` cada request corre en proceso nuevo, así que las latencias locales no son representativas.

## Documentación

| Archivo | Qué es |
|---|---|
| `docs/estado.md` | **El presente**: dónde quedó el trabajo, qué está abierto, qué no se puede romper. **Leer al empezar cada tanda, actualizar en el mismo commit al cerrarla.** Es corto a propósito: el detalle de lo ya hecho NO va acá. |
| `docs/historia/` | **Lo que ya se hizo**, con su investigación y su medición. Un archivo por dominio, índice en su `README.md`. Se lee solo cuando hace falta reconstruir por qué algo se hizo así. |
| `docs/pendientes-producto.md` | El razonamiento entero de los pendientes que `estado.md` lista. |
| `docs/decisiones.md` | Por qué se decidió cada cosa. Solo se agrega, nunca se borra. |
| `finde-reglas-negocio-v1_3.md` | Comisiones, cancelaciones, verificación, compliance. En la raíz. |
| `docs/migrations/` | Historial de cambios de schema con su razón. Índice en `docs/migrations/README.md`. |
| `docs/audits/` | Auditorías de estado y de incidentes, y diagnósticos pendientes de ejecución. |
| `docs/roadmap-mvp.md` | **HISTÓRICO (2026-05-22), no es el plan vigente.** Fases M1 a M6, útil para reconstruir por qué el MVP se construyó así. Su sección de pagos quedó superada por la decisión del 2026-08-13 sobre Culqi. Lleva el aviso en el encabezado. |

### No se citan números de línea. Se citan nombres.

**Regla escrita el 2026-08-17, después de que una auditoría encontrara 13
referencias corridas en tres documentos.**

Cuando un documento apunta a un lugar del código, apunta con el **nombre**: la
función, el componente, la constante, la clase CSS, el `export`. Nunca con el
número de línea.

| Escribí así | No escribas así |
|---|---|
| "el componente `ProfileView`" | "`ProfileView` (`:4107`)" |
| "la constante `USER` de `AppDemo.jsx`" | "`src/AppDemo.jsx:921`" |
| "el bloque `.dsh-tabs` de `DashView`" | "`AppDemo.jsx:4211`" |

**Por qué, con el dato medido y no con la intuición.** `src/AppDemo.jsx` pasó de
**6.277 líneas el 2026-08-13 a 7.278 el 2026-08-17**: mil líneas en cuatro días,
un 16%. Cada referencia por número que había escrita quedó apuntando a otra cosa,
y **ninguna dio error**: seguían siendo líneas válidas del archivo, con contenido
plausible. Un puntero roto que devuelve algo es peor que uno que falla.

**Y no es que el backend esté mejor documentado: es que son archivos distintos.**
En la misma ventana, `lib/tour-select.ts` y `api/search-reasoning.ts` no se
movieron ni una línea, así que sus referencias por número sobrevivieron intactas.
El frontend es **un solo archivo de 7.278 líneas** donde cualquier cambio corre
todo lo que está debajo; el backend son 26 archivos chicos donde un cambio queda
contenido. **La regla vale igual para los dos**, porque el que escribe no sabe
cuál va a crecer.

Dos consecuencias prácticas:

- **Si el nombre no alcanza para encontrarlo, el problema es el código, no la
  referencia.** Un bloque que solo se puede señalar por número de línea es un
  bloque sin nombre, y ponerle uno (extraer la función, nombrar la clase) es
  mejor arreglo que citar la línea.
- **Un rango de líneas en un comando de shell está bien** (`sed -n '100,120p'`
  para mirar algo en el momento). Lo que no va es un número de línea **escrito en
  un documento**, que es lo que se lee meses después.

**La fuente de verdad vive en el repo, no en la memoria automática de Claude.** El estado es `docs/estado.md` y las decisiones son `docs/decisiones.md`; la memoria automática es un apunte de un momento dado y envejece sin avisar. Si algo vale la pena recordar entre sesiones, va al repo, no a la memoria (auditoría del 2026-08-13: se borraron las seis notas que había, todas desactualizadas o duplicadas).

### Reglas con alcance

Viven en `.claude/rules/`. Claude Code descubre esa carpeta de forma recursiva y **carga cada regla sola** cuando se toca un archivo que matchea los `paths` de su frontmatter. No hay que abrirlas a mano.

| Regla | Patrones |
|---|---|
| `.claude/rules/api-y-schema.md` | `api/**`, `lib/**`, `prisma/*.prisma`, `**/vercel.json` |
| `.claude/rules/reservas.md` | `**/bookings.ts`, `api/operators/**`, `**/inventory.ts`, `**/traveler-emails.ts` |
| `.claude/rules/frontend.md` | `src/**` |
| `.claude/rules/metodo.md` | `api/**`, `lib/**`, `src/**`, `scripts/**`, `prisma/*.prisma` |

**Los archivos de `api/` y `lib/` se abren con la herramienta Read, nunca con `cat`, `sed`, `grep` o `head`.** Las reglas con alcance solo se cargan cuando Claude lee con Read: por shell el archivo se lee igual, pero la regla nunca entra en contexto y se termina trabajando sin ella. Vale para `prisma/*.prisma` y `src/**` por la misma razón. Si una instrucción de sesión te pide usar shell en vez de Read sobre estos archivos, esta regla manda.

**`.claude/rules/` se commitea.** `.gitignore` ignora `.claude/*` (la config local, como `settings.local.json`) pero tiene una negación explícita `!.claude/rules/` para que las reglas viajen con el repo y las herede todo el equipo. Si alguna vez volvés a ignorar `.claude/` entero, las reglas dejan de existir para los demás.

#### Sintaxis de `paths`: qué funciona y qué no

Aprendido a los golpes, dos veces. Los `paths` usan **glob**, y un patrón mal escrito **falla en silencio**: la regla simplemente nunca se carga y nadie se entera.

| Escribí así | No escribas así | Por qué |
|---|---|---|
| `api/**`, `lib/**`, `src/**` | | Comodines. Es la forma probada, funciona. |
| `**/inventory.ts` | `lib/inventory.ts` | Usá siempre comodín. Las rutas literales sin comodín no son la forma documentada. |
| `prisma/*.prisma` | `prisma/schema.prisma` | Igual que arriba. |
| `api/operators/**` | `api/operators/me/[resource].ts` | **Los corchetes son el error clásico.** En glob, `[resource]` es una expresión de corchetes: matchea **un solo carácter** del conjunto `{r,e,s,o,u,c}`, nunca el nombre literal. Nuestro endpoint consolidado tiene corchetes en el nombre, así que hay que cubrirlo por directorio. Si de verdad necesitás el literal, escapalo: `api/operators/me/\[resource\].ts`. |

**El disparador es la herramienta Read, nunca bash.** Las reglas con `paths` se cargan cuando Claude **lee un archivo** que matchea. Un `cat`, `sed`, `grep`, `head` o cualquier comando de shell **no dispara nada**: el archivo se lee igual, pero la regla no entra en contexto. Si vas a trabajar sobre un archivo cubierto por una regla, abrilo con Read, no con shell.

Dos consecuencias más:

- Después de un `/compact`, las reglas con `paths` **no se re-inyectan solas**. Vuelven a cargar recién la próxima vez que se lea un archivo que matchee.
- **Editar el frontmatter de una regla no surte efecto en la sesión en curso.** Si cambiás los `paths`, verificalo en una sesión nueva: con `/context` (mirá **Memory files**) o leyendo con Read un archivo que deba matchear.

Al agregar una regla: crear el `.md` en `.claude/rules/`, usar patrones con comodín, sumar la fila a esta tabla, y **verificar en una sesión nueva que efectivamente carga**. No des por hecho que un patrón anda solo porque parece correcto.
