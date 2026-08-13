# CLAUDE.md

Guía para Claude Code en este repositorio.

## Qué es Finde

Marketplace mobile-first de tours en Perú con búsqueda semántica por IA y soporte de quechua. Conecta viajeros con agencias formales peruanas. Producción: **finde.pe** (Vercel, proyecto `mrcancis-projects/finde`). QA: **dev.finde.pe** (rama `dev`).

**Qué hace hoy el código respecto a la verificación de agencias** (importante, porque el copy promete más):

- El onboarding valida que el RUC tenga **11 dígitos**. Nada más. No hay llamada a SUNAT ni a MINCETUR.
- `Operator.verified` es un booleano que se setea a mano. Ningún proceso automático lo toca.
- `Operator.mincetur` es un número que la agencia declara. `gateOperatorMincetur` (`lib/tour-select.ts`) solo lo muestra al público si `verified` es true.
- `src/Landing.jsx` promete "validamos el RUC en SUNAT y el registro en MINCETUR". Eso es **promesa de producto, no comportamiento implementado**. No lo repitas como hecho técnico ni lo uses para justificar una decisión de código.

Estado actual del trabajo: leer `docs/estado.md` antes de empezar cualquier tanda.

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

### Advertencia sobre el QA en dev.finde.pe

**dev.finde.pe corre contra la base de datos de PRODUCCIÓN, y `RESEND_API_KEY` está cargada en los tres entornos (Development, Preview y Production).** Las dos cosas juntas significan que:

- Un QA que confirma o rechaza una salida en dev.finde.pe **manda correos reales** a las direcciones reales de los viajeros de esa salida. `sendDepartureDecisionEmails` no distingue entorno.
- Un QA que crea una reserva sobre el tour de una agencia real **le manda un correo real a esa agencia**.
- Nada de esto se puede deshacer.

Por eso: **el QA se hace solo con la cuenta demo (`demo@finde.pe`) y sobre tours de cuentas `@finde.pe`.** Nunca sobre tours ni reservas de agencias reales. Los datos que crees, borralos al terminar.

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

No hay suite de tests configurada. Cuando un doc dice "verificado con test", fue verificación manual.

Trampa conocida: `DATABASE_URL`, `DIRECT_URL`, `ANTHROPIC_API_KEY` y `VOYAGE_API_KEY` vienen del entorno **Development de Vercel** y pisan lo que haya en `.env.local`. Las tres de Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) no están en Development, así que esas sí salen de `.env.local` vía `dotenv-cli`. En `vercel dev` cada request corre en proceso nuevo, así que las latencias locales no son representativas.

## Documentación

| Archivo | Qué es |
|---|---|
| `docs/estado.md` | Dónde quedó el trabajo. **Leer al empezar cada tanda, actualizar en el mismo commit al cerrarla.** |
| `docs/decisiones.md` | Por qué se decidió cada cosa. Solo se agrega, nunca se borra. |
| `finde-reglas-negocio-v1_3.md` | Comisiones, cancelaciones, verificación, compliance. En la raíz. |
| `docs/migrations/` | Historial de cambios de schema con su razón. Índice en `docs/migrations/README.md`. |
| `docs/audits/` | Auditorías de estado y de incidentes. |
| `docs/roadmap-mvp.md` | Fases M1 a M6. |

### Reglas con alcance

Viven en `.claude/rules/`. Claude Code descubre esa carpeta de forma recursiva y **carga cada regla sola** cuando se toca un archivo que matchea los `paths` de su frontmatter. No hay que abrirlas a mano.

| Regla | Se carga al tocar |
|---|---|
| `.claude/rules/api-y-schema.md` | `api/**`, `lib/**`, `prisma/schema.prisma`, `vercel.json` |
| `.claude/rules/reservas.md` | `api/bookings.ts`, `api/operators/me/[resource].ts`, `lib/inventory.ts`, `lib/traveler-emails.ts` |
| `.claude/rules/frontend.md` | `src/**` |

**`.claude/rules/` se commitea.** `.gitignore` ignora `.claude/*` (la config local, como `settings.local.json`) pero tiene una negación explícita `!.claude/rules/` para que las reglas viajen con el repo y las herede todo el equipo. Si alguna vez volvés a ignorar `.claude/` entero, las reglas dejan de existir para los demás.

Al agregar una regla: crear el `.md` en `.claude/rules/` con el frontmatter `paths`, y sumar la fila a esta tabla. **Verificá que los `paths` matcheen archivos que existen de verdad**; un patrón que no matchea nada falla en silencio y la regla nunca se carga.
