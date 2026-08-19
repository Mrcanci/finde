# Plantillas de correo de Supabase, en español

> **LAS CUATRO YA ESTÁN PEGADAS Y GUARDADAS** en Authentication > Emails >
> Templates, desde el 2026-08-18. Este archivo deja de ser la entrega y pasa a
> ser **la fuente de verdad del HTML**: si alguna vez hay que volver a pegarlas,
> o cambiar una, se edita acá y se copia de acá.
>
> Escritas el 2026-08-18, después de que la prueba del SMTP propio destapara que
> venían en inglés ("You have been invited to create a user on...").
>
> Claude no tiene acceso a ese panel, así que pegar y probar lo hace José.

## Antes que nada: qué está probado y qué no

**Pegadas: las cuatro. Probadas en un cliente de correo: UNA.**

| Plantilla | ¿Se puede disparar hoy? | Estado |
|---|---|---|
| **Invite user** | Sí, desde Auth > Users | **Probada en Gmail el 2026-08-18. Se ve bien.** |
| **Confirm sign up** | No: `mailer_autoconfirm` está en `true` | Pegada, **sin probar** |
| **Magic Link** (código de 6 dígitos) | No: no hay flujo de OTP | Pegada, **sin probar** |
| **Reset password** | No: no hay flujo de recuperación | Pegada, **sin probar** |

**Las tres sin probar no lo están por descuido: hoy no se pueden mandar**, porque
no existe el flujo que las dispara.

> **Cada una se verifica EN EL MOMENTO en que se implemente su flujo, no antes.
> Estar pegada no es estar probada.**

**Y falta un eje entero en las cuatro: solo se probó Gmail.** Queda pendiente
**Outlook de Windows**, que usa el motor de Word y es el que rompe lo que en
todos los demás anda, y **Apple Mail**.

**Lo que sí se verificó al escribirlas**, contra la documentación y no de
memoria:

1. Que cada variable que aparece en las plantillas exista de verdad en la
   plantilla donde se usa (documentación de Supabase, ver la tabla de abajo).
2. Que el HTML no dependa de nada que los clientes de correo no soporten. Eso se
   revisa con `scripts/check-plantillas-correo.mjs`, que **falla** si encuentra
   `<style>`, clases CSS, `flex`, `grid`, `position`, `@font-face`, `@media`,
   enlaces a fuentes web, scripts o imágenes remotas.

**Nada de eso reemplaza abrir el correo.** El script lee el HTML; no sabe cómo lo
dibuja Outlook.

## Qué plantillas ofrece Supabase, y cuáles necesita Finde

Supabase tiene **seis plantillas de autenticación** y **siete de aviso de
seguridad**. Estas son las de autenticación:

| Plantilla | ¿La necesita Finde? | Por qué |
|---|---|---|
| **Confirm sign up** | **SÍ** | Es la que se enciende al reactivar "Confirm email". Hoy no se manda: `mailer_autoconfirm` está en `true` (verificado el 2026-08-18 contra `/auth/v1/settings`). |
| **Reset password** | **SÍ** | Está en la lista de desbloqueados. **Ojo: el flujo todavía no existe en el código**, nadie llama a `resetPasswordForEmail`. La plantilla queda escrita para cuando se implemente. |
| **Magic Link / OTP** | **SÍ, y es la que faltaba en la lista** | **Es la plantilla del código de 6 dígitos.** El código de 6 dígitos del modal no tiene plantilla propia: sale de esta, con `{{ .Token }}`. Si esta queda en inglés, el código llega en inglés. |
| **Invite user** | **SÍ** | Es la única que se está mandando HOY, y es la que llegó en inglés en la prueba. Se usa al invitar a alguien desde Auth > Users. |
| **Change email address** | No, todavía | La app no tiene cambio de correo: nadie llama a `updateUser({ email })`. Cuando exista, se escribe. |
| **Reauthentication** | No | No se usa. **Y ojo si algún día se escribe: es la única que NO acepta `{{ .ConfirmationURL }}`.** Solo tiene `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}` y `{{ .Data }}`. |

**Las siete de aviso de seguridad** (Password changed, Email address changed,
Phone number changed, Sign-in method linked, Sign-in method removed,
Verification method added, Verification method removed) **no hacen falta hoy** y
además tienen otro juego de variables, mucho más chico: ni siquiera aceptan
`{{ .ConfirmationURL }}`. Se ven si se encienden esos avisos.

### Las variables, verificadas contra la documentación

Las cuatro plantillas de acá aceptan las mismas: `{{ .ConfirmationURL }}`,
`{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`,
`{{ .Data }}` y `{{ .Email }}`.

**No hay variable de nombre de usuario.** Por eso ningún correo dice "Hola,
José": no existe la variable para hacerlo. Donde hace falta identificar la
cuenta se usa `{{ .Email }}`, que sí existe.

## Por qué el HTML se ve tan viejo

Son correos, no páginas. Lo verificado en caniemail.com el 2026-08-18:

| Cosa | Soporte | Qué se hizo |
|---|---|---|
| **Fuentes web** (`@font-face`, Google Fonts) | **No las soportan ni Gmail ni Yahoo**, y Outlook solo en parte | **No se cargan fuentes.** Plus Jakarta Sans se pide por si está instalada, y atrás va la pila de respaldo |
| `system-ui` | 94% estimado, **pero Outlook de Windows 2007 a 2019 no lo soporta** | Va `system-ui` y **detrás Arial**, que es el que de verdad va a usar Outlook |
| Elemento `<style>` | 78%, con Gmail limitándolo al `<head>` y Outlook con bugs de orden | **No se usa.** Todo el CSS va en línea, atributo por atributo |
| `display:flex` | 83%, con partes sin soporte y notas de "no funciona con cuentas que no son de Google" | **No se usa.** El layout es con tablas |
| `border-radius` | 83% | Se usa igual: donde no anda, las esquinas salen cuadradas y el correo se lee igual |

**Regla práctica: tablas para el layout, estilos en línea, cero clases.** No es
nostalgia, es que el 20% que no soporta lo moderno incluye a Outlook de Windows.

## El logo: tres opciones y lo que cuesta cada una

El logotipo de Finde es tipográfico: la palabra `finde` en DM Serif Display más
un punto en terracota. **DM Serif Display no carga en correo**, igual que Plus
Jakarta Sans.

| Opción | Qué cuesta | Veredicto |
|---|---|---|
| **A. Texto con pila de respaldo** (lo que está aplicado) | Se pierde la serif: la palabra sale en la sans del sistema. **El punto terracota se conserva**, porque es color, no fuente | **Recomendada.** Cero mantenimiento, se ve siempre, y como la marca es una palabra en minúscula más un punto, sobrevive bien al cambio de fuente |
| **B. Imagen alojada** (PNG a 2x en un bucket público) | El logo se ve exacto **cuando el cliente carga imágenes**. Muchos las bloquean hasta que el lector las habilita, así que hay que dejar `alt` que se lea solo y un encabezado que funcione sin la imagen. Suma un archivo que hay que hospedar, versionar y no romper. SVG no sirve: casi ningún cliente lo soporta | Sirve si algún día la marca importa más que la simpleza. Hoy no paga |
| **C. Solo el nombre en sans, sin el punto** | Lo mismo que A pero perdiendo el único rasgo de marca que sí sobrevive | No |

**Está aplicada la A.** Si algún día se quiere la B, lo único que cambia es el
bloque del encabezado.

---

# Las plantillas

Para cada una: el **asunto** va en el campo de arriba del panel, y el **HTML** en
el cuadro de abajo, reemplazando todo lo que haya.

## 1. Confirm sign up

**Dónde:** Authentication > Emails > Templates > **Confirm signup**

**Asunto:**

```
Confirma tu correo para entrar a Finde
```

**HTML:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirma tu correo</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F0EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0EA;">
<tr>
<td align="center" style="padding:32px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:14px;">

<tr>
<td align="left" style="padding:28px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:26px; font-weight:700; color:#1B3A2D; line-height:1.2;">
finde<span style="color:#C7613A;">.</span>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:21px; font-weight:700; color:#2C2C2A; line-height:1.3;">
Confirma tu correo
</td>
</tr>

<tr>
<td align="left" style="padding:12px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:15px; font-weight:400; color:#5A5A57; line-height:1.6;">
Creaste una cuenta en Finde con <strong style="color:#2C2C2A;">{{ .Email }}</strong>. Haz clic en el botón para confirmarla y seguir con tu reserva.
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td bgcolor="#1B3A2D" style="background-color:#1B3A2D; border-radius:12px;">
<a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block; padding:14px 28px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">Confirmar mi correo</a>
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:13px; font-weight:400; color:#737370; line-height:1.6;">
Si el botón no te funciona, copia y pega esta dirección en tu navegador:<br>
<a href="{{ .ConfirmationURL }}" target="_blank" style="color:#C7613A; text-decoration:underline; word-break:break-all;">{{ .ConfirmationURL }}</a>
</td>
</tr>

<tr>
<td align="left" style="padding:20px 32px 28px 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:13px; font-weight:400; color:#737370; line-height:1.6;">
Si no creaste ninguna cuenta, puedes ignorar este correo.
</td>
</tr>

</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
<tr>
<td align="center" style="padding:20px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:12px; font-weight:400; color:#959591; line-height:1.6;">
Finde. Tours de agencias peruanas formales.<br>finde.pe
</td>
</tr>
</table>

</td>
</tr>
</table>
</body>
</html>
```

## 2. Magic Link / OTP, que es el código de 6 dígitos

**Dónde:** Authentication > Emails > Templates > **Magic Link**

**Asunto:**

```
Tu código para entrar a Finde
```

**Ojo con esta:** está escrita para **código**, no para enlace mágico. Muestra
`{{ .Token }}` y **a propósito no incluye `{{ .ConfirmationURL }}`**, para que no
haya dos formas de entrar compitiendo en el mismo correo. Si algún día se quiere
el enlace en vez del código, se cambia el bloque del código por un botón como el
de la plantilla 1.

**HTML:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tu código para entrar</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F0EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0EA;">
<tr>
<td align="center" style="padding:32px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:14px;">

<tr>
<td align="left" style="padding:28px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:26px; font-weight:700; color:#1B3A2D; line-height:1.2;">
finde<span style="color:#C7613A;">.</span>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:21px; font-weight:700; color:#2C2C2A; line-height:1.3;">
Tu código para entrar
</td>
</tr>

<tr>
<td align="left" style="padding:12px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:15px; font-weight:400; color:#5A5A57; line-height:1.6;">
Escribe este código en Finde para entrar a tu cuenta. Vence en unos minutos.
</td>
</tr>

<tr>
<td align="center" style="padding:24px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td align="center" bgcolor="#F5F0EA" style="background-color:#F5F0EA; border-radius:12px; padding:20px 12px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:30px; font-weight:700; color:#1B3A2D; letter-spacing:8px;">
{{ .Token }}
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 28px 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:13px; font-weight:400; color:#737370; line-height:1.6;">
Si no pediste este código, ignora este correo. Nadie puede entrar a tu cuenta sin él.
</td>
</tr>

</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
<tr>
<td align="center" style="padding:20px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:12px; font-weight:400; color:#959591; line-height:1.6;">
Finde. Tours de agencias peruanas formales.<br>finde.pe
</td>
</tr>
</table>

</td>
</tr>
</table>
</body>
</html>
```

## 3. Reset password

**Dónde:** Authentication > Emails > Templates > **Reset Password**

**Asunto:**

```
Cambia tu contraseña de Finde
```

**HTML:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cambia tu contraseña</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F0EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0EA;">
<tr>
<td align="center" style="padding:32px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:14px;">

<tr>
<td align="left" style="padding:28px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:26px; font-weight:700; color:#1B3A2D; line-height:1.2;">
finde<span style="color:#C7613A;">.</span>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:21px; font-weight:700; color:#2C2C2A; line-height:1.3;">
Cambia tu contraseña
</td>
</tr>

<tr>
<td align="left" style="padding:12px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:15px; font-weight:400; color:#5A5A57; line-height:1.6;">
Pediste cambiar la contraseña de la cuenta <strong style="color:#2C2C2A;">{{ .Email }}</strong>. Haz clic en el botón y elige una nueva.
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td bgcolor="#1B3A2D" style="background-color:#1B3A2D; border-radius:12px;">
<a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block; padding:14px 28px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">Elegir contraseña nueva</a>
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:13px; font-weight:400; color:#737370; line-height:1.6;">
Si el botón no te funciona, copia y pega esta dirección en tu navegador:<br>
<a href="{{ .ConfirmationURL }}" target="_blank" style="color:#C7613A; text-decoration:underline; word-break:break-all;">{{ .ConfirmationURL }}</a>
</td>
</tr>

<tr>
<td align="left" style="padding:20px 32px 28px 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:13px; font-weight:400; color:#737370; line-height:1.6;">
Si no pediste esto, ignora este correo. Tu contraseña de ahora sigue funcionando.
</td>
</tr>

</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
<tr>
<td align="center" style="padding:20px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:12px; font-weight:400; color:#959591; line-height:1.6;">
Finde. Tours de agencias peruanas formales.<br>finde.pe
</td>
</tr>
</table>

</td>
</tr>
</table>
</body>
</html>
```

## 4. Invite user

**Dónde:** Authentication > Emails > Templates > **Invite user**

**Es la única que se está mandando hoy**, y la que llegó en inglés en la prueba
del SMTP.

**Asunto:**

```
Te invitamos a Finde
```

**HTML:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Te invitamos a Finde</title>
</head>
<body style="margin:0; padding:0; background-color:#F5F0EA;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0EA;">
<tr>
<td align="center" style="padding:32px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:14px;">

<tr>
<td align="left" style="padding:28px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:26px; font-weight:700; color:#1B3A2D; line-height:1.2;">
finde<span style="color:#C7613A;">.</span>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:21px; font-weight:700; color:#2C2C2A; line-height:1.3;">
Te invitamos a Finde
</td>
</tr>

<tr>
<td align="left" style="padding:12px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:15px; font-weight:400; color:#5A5A57; line-height:1.6;">
Te invitaron a crear una cuenta en Finde con <strong style="color:#2C2C2A;">{{ .Email }}</strong>. Finde es el buscador de tours de agencias peruanas formales. Haz clic en el botón para elegir tu contraseña y entrar.
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td bgcolor="#1B3A2D" style="background-color:#1B3A2D; border-radius:12px;">
<a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block; padding:14px 28px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">Crear mi cuenta</a>
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td align="left" style="padding:24px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:13px; font-weight:400; color:#737370; line-height:1.6;">
Si el botón no te funciona, copia y pega esta dirección en tu navegador:<br>
<a href="{{ .ConfirmationURL }}" target="_blank" style="color:#C7613A; text-decoration:underline; word-break:break-all;">{{ .ConfirmationURL }}</a>
</td>
</tr>

<tr>
<td align="left" style="padding:20px 32px 28px 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:13px; font-weight:400; color:#737370; line-height:1.6;">
Si no esperabas esta invitación, puedes ignorar este correo.
</td>
</tr>

</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
<tr>
<td align="center" style="padding:20px 32px 0 32px; font-family:'Plus Jakarta Sans', system-ui, Arial, sans-serif; font-size:12px; font-weight:400; color:#959591; line-height:1.6;">
Finde. Tours de agencias peruanas formales.<br>finde.pe
</td>
</tr>
</table>

</td>
</tr>
</table>
</body>
</html>
```

---

## Dos cosas al volver acá

1. **El asunto va en el campo de arriba, aparte del HTML.** Es fácil cambiar el
   cuerpo y olvidarse del asunto, que era la otra mitad que venía en inglés.
2. **Pegar la plantilla 1 no enciende la confirmación de correo.** Sigue apagada
   (`mailer_autoconfirm: true`), y encenderla es una decisión de producto aparte:
   corta el checkout con la fecha y los cupos ya elegidos. El razonamiento está
   en `docs/pendientes-producto.md`. **Ese es también el momento de abrir el
   correo de Confirm sign up y mirarlo**, que hoy no se puede.
