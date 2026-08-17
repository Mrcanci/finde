# Navegación abierta y modal de cuenta (tanda 3, 2026-08-17)

> Trabajo cerrado y en `main`. Acá va **lo que se midió**, no lo que se hizo: el
> qué está en `docs/estado.md` y el detalle de la implementación, en los commits
> `022f5fa`, `60d208c` y el merge `a2b8af8`.

La tanda movió el muro de cuenta de la puerta al checkout. Lo que sigue son
**tres mediciones que se hicieron para decidirla y que no vuelven a hacerse
solas**. Las tres respondieron preguntas que, sin esto escrito, obligan a repetir
el trabajo.

---

## 1. RLS está apagado, y `anon` no tiene ningún grant

**La pregunta que contesta:** "para abrir el catálogo sin sesión, ¿hay que tocar
las políticas RLS?"

**La respuesta es no, y no por poco: no hay nada que abrir.**

Medido con `psql` contra la base real el 2026-08-17:

```sql
select relname, relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r';
```

| Tabla | `relrowsecurity` |
|---|---|
| `Booking` | `f` |
| `Departure` | `f` |
| `FeaturedSearch` | `f` |
| `Operator` | `f` |
| `SearchLog` | `f` |
| `Tour` | `f` |
| `_prisma_migrations` | `f` |

Y las otras dos consultas, que son las que cierran el caso:

- `pg_policies` en los schemas `public` y `storage`: **0 filas.** No hay ninguna
  política, ni prendida ni apagada.
- `information_schema.role_table_grants` para `anon`, `authenticated`,
  `service_role` y `PUBLIC` sobre `public`: **0 filas.** Ninguno de esos roles
  tiene un solo permiso sobre ninguna tabla.

### La consecuencia, que es lo que importa

**PostgREST (`/rest/v1`) no puede leer nada, y no porque RLS lo bloquee sino
porque las tablas no están expuestas.** Sin grants no hay nada que filtrar.

Todo lo que lee la base pasa por **Prisma con el rol dueño**, que además salta
RLS por definición. O sea:

> **El gate de acceso a los datos es la capa de API, entera y únicamente.**
> `requireAuth` y `requireOperator` en `api/`. RLS no participa.

En el navegador, el cliente de Supabase se usa **solo** para auth y para subir
fotos a Storage (`AppDemo.jsx`, `supabase.storage`). Nunca para leer tablas.

**Por eso "revisar las políticas RLS" no es un pendiente ni deuda técnica.**
Sería trabajo sin efecto sobre datos de producción. Si algún día se decide
exponer PostgREST, esta medición es el punto de partida: habría que crear los
grants **y** las políticas, porque hoy no existe ni lo uno ni lo otro.

---

## 2. La configuración real de Supabase Auth

**La pregunta que contesta:** "¿con qué se hace el modal, contraseña, código de
6 dígitos o Google?"

No se dedujo del código: se leyó del proyecto real, el 2026-08-17.

```bash
curl -s "$VITE_SUPABASE_URL/auth/v1/settings" -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

| Campo | Valor | Qué significa para el producto |
|---|---|---|
| `mailer_autoconfirm` | **`true`** | **"Confirm email" está APAGADO.** El alta devuelve sesión al instante, y eso es lo que deja que el modal funcione con contraseña sin sacar al viajero de la pantalla |
| `external.email` | `true` | El código de 6 dígitos por correo **es posible** |
| `external.phone` | `false` | Por SMS **no**. El `sms_provider` dice `twilio` pero el canal está apagado |
| `external.google` | **`false`** | **Google OAuth no está habilitado.** No es "falta el botón": hay que prenderlo en el dashboard y dar de alta credenciales en Google Cloud, más las URLs de retorno de finde.pe, dev.finde.pe y localhost |
| `anonymous_users` | `false` | La sesión anónima de Supabase no está disponible como alternativa al modo invitado |
| `passkeys_enabled` | `false` | |
| `disable_signup` | `false` | Cualquiera puede crear cuenta |

### Lo que decidió con esto

**El modal va con correo y contraseña.** Los otros dos caminos comparten un
problema que la contraseña no tiene:

- **Google OAuth y el enlace mágico desmontan la SPA.** El redirect se lleva la
  pestaña, y todo el estado del checkout vive en `useState` de `BookingView`:
  fecha, cupos, paso y los cuatro campos de datos. Se verificó que **no hay ni un
  uso de `sessionStorage` en todo `src/`**, y que `localStorage` solo guarda
  `finde_notif_seen` y la sesión de supabase-js. O sea que hoy no existe ninguna
  red que atrape ese estado.
- **El código de 6 dígitos sí se queda en la página** (`verifyOtp` no navega), así
  que es la alternativa natural. Lo que lo bloquea no es técnico: es que **Custom
  SMTP está apagado** y los correos de auth salen por el remitente por defecto de
  Supabase, con tope bajo por hora. Ver el pendiente de lanzamiento en
  `docs/pendientes-producto.md`.

**Y el orden que sale de `mailer_autoconfirm`:** el día que se reactive "Confirm
email", el alta deja de devolver sesión. El modal ya lo maneja y muestra "revisa
tu correo" en vez de avanzar el checkout hacia un 401, pero **el checkout se
corta igual**. Por eso el SMTP propio va primero.

---

## 3. "Aquí" contra "acá": el conteo crudo apunta al revés

**La pregunta que contesta:** "¿qué usa el producto, y con qué hay que
unificar?"

Esta medición vale menos por el número que por el **método**, porque el camino
obvio da el resultado contrario al correcto.

### El grep crudo dice una cosa

```bash
grep -o 'acá' src/**/*.jsx | wc -l   # 58
grep -o 'aquí' src/**/*.jsx | wc -l  # 22
```

**58 contra 22.** Leído así, el producto usa "acá" y habría que unificar con eso.

### Y es exactamente al revés

**Los comentarios del repo están escritos en un registro informal que usa "acá"
todo el tiempo, y son la enorme mayoría de esas 58.** Separando comentarios de
copy visible (bloques `/* */` y `{/* */}`, más `//` hasta fin de línea, y
excluyendo `Landing.jsx` que es archivo protegido):

| | En copy visible |
|---|---|
| **acá** | **2** |
| **aquí** | **6** |

Y los dos "acá" eran **los que se acababan de escribir en esta misma tanda**. O
sea que antes de la tanda el producto usaba **"aquí" seis veces y "acá" cero**.

Las seis preexistentes, para que se vea que son copy de verdad y no ruido: el
voucher ("Toda la información que necesitas está aquí abajo"), dos avisos de
"Próximamente", el estado vacío de reservas del panel, la nota del email en el
perfil de agencia, y el área de arrastrar fotos.

### La lección

> **Un conteo sobre un archivo de código no es un conteo de copy.** Si el número
> va a decidir algo sobre el texto que ve el usuario, hay que sacar los
> comentarios antes de contar, o se unifica hacia el lado equivocado.

Es la misma familia que la regla 5 de `.claude/rules/frontend.md` ("los titulares
numéricos también se cuentan con script") y que el patrón de medir el punto
exacto y no los bordes: acá el borde es "cuántas veces aparece la palabra en el
archivo" y el punto exacto es "cuántas veces la lee un usuario".

El script queda acá escrito, que es lo que pide la regla 5, para que el próximo
recuento no dependa de reconstruirlo:

```python
import io, re, glob
def sin_comentarios(src):
    src = re.sub(r'\{?/\*.*?\*/\}?', '', src, flags=re.S)          # bloques y {/* */}
    return "\n".join(re.split(r'(?<!:)//', l)[0] for l in src.split("\n"))  # // sin romper URLs

archivos = [a for a in sorted(glob.glob("src/**/*.jsx", recursive=True)
                            + glob.glob("src/**/*.js", recursive=True))
            if "Landing.jsx" not in a]                              # archivo protegido
for palabra in ("acá", "aquí"):
    n = sum(len(re.findall(palabra, sin_comentarios(io.open(a, encoding="utf-8").read())))
            for a in archivos)
    print(palabra, n)
```

---

## Lo que esta tanda dejó como regla, no como registro

Dos cosas se aplicaron acá y valen para cualquier tanda futura, así que están
donde se cargan solas:

- **La guarda va en el embudo, no en cada botón.** La navegación se controla en
  `go()`, que es el único punto por donde pasa todo. Escribirla en la barra
  inferior habría dejado abierto el pie de página, que también manda a "Mis
  reservas" y a notificaciones. Es la misma lección que
  `.claude/rules/api-y-schema.md` ya tenía escrita para el backend.
- **El vocabulario del viajero no es el de la agencia.** "Salida" es como la
  agencia ve una fecha en su panel; el viajero hizo una **reserva**. Mismo
  criterio que "confirmación automática" en vez de `CUPO_FIJO`, en
  `.claude/rules/reservas.md`.
