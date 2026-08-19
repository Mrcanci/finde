# Recuperar contraseña: diagnóstico y plan

> **2026-08-18. Investigación, sin código escrito.** Reportado antes de tocar
> nada, como se pidió. Lo que sigue está medido contra el código y contra las
> dependencias instaladas, no de memoria.

## El agujero

**Hoy no existe el flujo.** Si una agencia olvida su contraseña no tiene ningún
camino: hay que resolverlo a mano desde el panel de Supabase. Con MEGATOURS se
puede. Con diez agencias operando, no.

**Lo que ya está listo y no hay que hacer:** el SMTP propio (resuelto el
2026-08-18) y la plantilla de Reset password, pegada y en español.

## 1. Qué expone `AuthContext` hoy, y qué falta

`src/contexts/AuthContext.jsx` expone: `user`, `session`, `loading`, `operator`,
`isOperator`, `operatorResolved`, `refreshOperator`, `signInWithPassword`,
`signUpWithPassword` y `signOut`.

**Faltan dos, y las dos son de una línea**, con la misma forma que las que ya
están:

- `resetPasswordForEmail(email, { redirectTo })`, que manda el correo.
- `updateUser({ password })`, que guarda la contraseña nueva.

Verificado contra `@supabase/auth-js` de la versión instalada
(`@supabase/supabase-js` **2.104.1**): `resetPasswordForEmail` acepta
`options.redirectTo`.

## 2. EL HALLAZGO QUE CAMBIA EL PLAN: el enlace de recuperación ES un inicio de sesión

**Esto es lo que hay que resolver bien, y no estaba en la lista de preguntas.**

Cuando el usuario abre el enlace del correo, Supabase **le crea una sesión** y
`supabase-js` dispara un evento **`PASSWORD_RECOVERY`** (verificado en
`GoTrueClient.js` de la versión instalada: emite `PASSWORD_RECOVERY` en vez de
`SIGNED_IN` cuando el tipo del token es `recovery`).

**Y hoy `AuthContext` trata todos los eventos igual.** Su `onAuthStateChange`
hace lo mismo para cualquier evento: setea `session` y `user`, y resuelve el
operador. O sea que, sin tocar nada:

> El usuario hace clic en "recuperar contraseña", abre el correo, vuelve a la
> app **ya logueado**, en la pantalla de inicio, y **nadie le pide una
> contraseña nueva**. La contraseña vieja sigue siendo la única que hay, y él
> cree que la cambió.

**Consecuencia para el diseño:** la pantalla de contraseña nueva **no se protege
con "no hay sesión"**, porque sí la hay. Se protege con "acabamos de ver un
evento `PASSWORD_RECOVERY`". Eso hay que guardarlo en el contexto.

## 3. Dónde va el enlace "¿Olvidaste tu contraseña?"

**En los dos lugares, y es un solo cambio.** `LoginView` y `AccountModal` no
tienen cada uno su formulario: los dos renderizan **`AuthForm`**, que es el mismo
componente extraído. Poner el enlace adentro de `AuthForm` lo pone en las dos
pantallas a la vez, que es exactamente la razón por la que también se extrajo
`TermsLine`.

**Pero el destino del enlace NO puede ser una ruta.** En `LoginView` navegar está
bien; **en el modal, navegar es romperlo**: el modal existe para que el viajero
no se vaya del checkout, y mandarlo a otra pantalla desarma su único motivo de
existir.

**Forma propuesta: un tercer modo de `AuthForm`.** Hoy tiene `mode` con dos
valores (`signin` y `signup`) que maneja el padre. Se agrega `recuperar`, que
reemplaza el campo de contraseña por el aviso de "te mandamos el correo". Sin
navegación, sin ruta, y funciona igual en las dos pantallas.

## 4. La pantalla de contraseña nueva: ruta, llegada y vencimiento

### Ruta: no existe, y hay que crearla en DOS lugares

**Hoy no hay ninguna ruta que reciba ese retorno.** La tabla `ROUTES` de
`src/lib/routes.js` tiene trece entradas y ninguna sirve; `fromPath` manda
cualquier cosa que no matchee a **`not-found`**. O sea que el enlace del correo
hoy aterriza en la pantalla de "no encontrado".

Agregar una vista son **dos lugares** (`.claude/rules/frontend.md`): la tabla
`ROUTES` y el switch de `AppDemo.jsx`. Propuesta: `{ view: "reset-password",
segs: ["nueva-contrasena"] }`, más sumarla a `GUEST_VIEWS` para que `go()` no la
mande al modal de cuenta.

### Cómo llega el usuario: no hay que parsear nada a mano

`src/lib/supabase.js` crea el cliente con **`detectSessionInUrl: true`**, y el
`flowType` no está declarado, así que toma el default de la versión instalada,
que es **`implicit`** (verificado en `GoTrueClient.js`). En ese modo el retorno
trae los tokens **en el hash de la URL** y el cliente los consume solo.

**No hay que leer el token ni llamar a `exchangeCodeForSession`.** Alcanza con
escuchar el evento.

### El enlace vencido: es el caso que hay que cubrir sí o sí

Si el enlace venció o ya se usó, **no hay sesión**, y el retorno trae un error en
el hash (algo con la forma `#error=...&error_code=otp_expired`). Sin cubrirlo, el
usuario llega a una pantalla que le pide una contraseña nueva y que **va a
fallar recién al apretar guardar**, con un error opaco.

La pantalla tiene que leer ese error al montar y mostrar "el enlace venció, pide
otro", con el botón para pedirlo de nuevo.

> **La forma exacta del error es lo único de este documento que NO está
> verificado contra el código instalado.** Es lo primero que hay que comprobar al
> implementar: pedir un correo, esperar a que venza o usar el enlace dos veces, y
> mirar la URL de retorno. No se escribe el manejo del error adivinando el
> nombre del parámetro.

## 5. El `redirectTo`

Tiene que ser una **URL absoluta** y estar en la lista blanca de Supabase. Son
**tres**, las mismas que va a necesitar el día que se agregue Google:
`finde.pe`, `dev.finde.pe` y `localhost`. Si falta una, ese entorno queda roto y
los otros dos no avisan.

**Y tiene que respetar el prefijo `/demo`.** Se arma como
`` `${window.location.origin}${toPath("reset-password")}` ``, nunca escribiendo
`/demo` a mano: es la regla de `src/lib/routes.js`, y es lo que hace que el día
del switch siga siendo el cambio de una línea.

## 6. El caso del checkout, que es el que más importa

**Es el mismo problema del redirect de Google, en chico.**

`BookingView` guarda **todo** en `useState` sin persistencia: `step`, `guests`,
`date`, `name`, `phone`, `emailTipeado` y `docId`.

**Hoy eso no duele**, y por una razón concreta: `AccountModal` se renderiza como
hermano de las vistas en el árbol de `AppDemo`, así que abrirlo **no desmonta**
`BookingView` y no se pierde nada.

**La recuperación rompe eso**, porque el viajero sale al correo y vuelve con una
**carga completa de página**: `BookingView` se vuelve a montar vacío. Vuelve con
la contraseña cambiada y sin su fecha, sus cupos ni sus datos.

### Las dos salidas, con su costo

| | Qué cuesta | Qué deja |
|---|---|---|
| **A. Persistir el borrador** `{ tourId, date, guests, step }` en `localStorage` y restaurarlo al montar | Chico: un par de helpers y una restauración. **Hay precedente en el código**, las notificaciones vistas ya se guardan así, con la guarda `typeof localStorage === "undefined"` | Resuelve este caso **y la precondición del botón de Google**, que es el mismo problema más grande |
| **B. No ofrecer la recuperación desde el modal**, solo desde `LoginView` | Cero | Deja al viajero que está a mitad del checkout y no se acuerda de su contraseña **sin ninguna salida**. Su correo ya está tomado, así que tampoco puede crear otra cuenta |

**Recomendación: la A, en esta misma tanda.** Es chica, y es la diferencia entre
"funciona" y "funciona salvo en el caso que preguntaste". Además adelanta gratis
la precondición del backlog de Google.

**Dato para priorizar, por si se prefiere partirlo:** el agujero que abrió esta
tanda es de **agencias**, y las agencias entran por `LoginView`, no por el modal
del checkout. El caso del checkout es de viajero y es menos frecuente. Si se
decide dejarlo para después, **la B tiene que avisar antes de mandar el correo**
("vas a salir a tu correo y vas a perder la fecha y los datos que cargaste"), no
perder el borrador en silencio.

## 7. El plan, en pasos

1. **`AuthContext`**: agregar `resetPasswordForEmail` y `updateUser`, y **un flag
   de recuperación** que se prenda con el evento `PASSWORD_RECOVERY`. Es el paso
   que hace que todo lo demás sea posible.
2. **Ruta nueva**: `reset-password` en `ROUTES`, en el switch de `AppDemo` y en
   `GUEST_VIEWS`.
3. **`AuthForm`**: tercer modo `recuperar` con el enlace. Sale gratis en las dos
   pantallas.
4. **La vista nueva**: lee el error del hash si vino, o pide la contraseña nueva
   y llama a `updateUser`. Al terminar, manda a un lugar con sentido.
5. **Panel de Supabase (José)**: las tres URLs de retorno en la lista blanca.
   **Sin esto no funciona nada**, y es lo único que Claude no puede hacer.
6. **Recomendado, mismo tanda**: el borrador del checkout.

## 8. Cuidado con el QA de esto

**Probar la recuperación manda correos de verdad**, porque el SMTP propio está
encendido en los tres entornos. Vale la regla de `CLAUDE.md`: **el QA va solo con
`demo@finde.pe`**, nunca pidiendo recuperación para el correo de una agencia
real, porque le llegaría un correo que no pidió.

**Y ojo con el presupuesto**: son 100 correos por día compartidos con los
transaccionales. Un QA de recuperación con veinte intentos se come un quinto del
día.
