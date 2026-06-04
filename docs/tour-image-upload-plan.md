# Plan: upload real de imágenes de tours (Supabase Storage)

> **Estado:** plan aprobado, pendiente de implementar.
> **Decisión clave:** Flujo A (signed upload URL emitida por el backend).
> **Para José:** lo único que tienes que hacer tú está en **"Paso 3.0 — Configuración en Supabase"**. El resto es trabajo de código.

---

## Resumen (en una frase)

Hoy, cuando un operador elige una foto en el formulario de "Crear/Editar tour", el archivo **se descarta**: el front lo convierte a un texto largo (base64) que el backend ignora. El objetivo de este plan es que esa foto **se suba de verdad a Supabase Storage** y que su URL pública quede guardada en el tour, para que se vea en el catálogo.

La buena noticia: el resto del sistema (`form.photo` → guardar el tour → mostrar la imagen) **ya está construido para recibir una URL de imagen**. Solo falta el paso del medio: subir el archivo y obtener esa URL.

---

## Decisión de arquitectura: Flujo A (y por qué)

Había dos formas de subir la foto:

- **Flujo A — el navegador sube directo a Supabase Storage.** El backend solo entrega un "permiso temporal de subida" (una *signed upload URL*) después de confirmar que quien sube es un operador con sesión válida. El archivo **nunca pasa por nuestro servidor**.
- **Flujo B — el archivo pasa por nuestro servidor** (una función de Vercel) y desde ahí se sube a Storage.

**Elegimos el Flujo A.** La razón es concreta y técnica:

- Las funciones de Vercel (nuestro backend) tienen un **límite de ~4.5 MB** por petición.
- El formulario ya anuncia "máx 5 MB". Y cuando un archivo viaja en formato base64, **crece ~33%** (un JPG de 5 MB se convierte en ~6.7 MB).
- Con el Flujo B, una foto de 5 MB **superaría el límite y la subida fallaría** justo en el caso que el formulario dice que es válido.
- El **Flujo A evita ese problema por diseño**, porque el archivo va directo del navegador a Storage sin pasar por la función de Vercel. Además es más rápido (un salto menos) y mantenemos el control de seguridad: el permiso de subida solo lo emite el backend tras verificar que es un operador (`requireOperator`).

---

## Paso 3.0 — Configuración en Supabase (lo hace José en el dashboard)

> **Esto es lo único manual.** No requiere programar. Hazlo en el panel de Supabase del proyecto. Claude **no** configura esto.

Entra a tu proyecto en **app.supabase.com** → menú lateral **Storage**.

1. **Crear el bucket.**
   - Clic en **"New bucket"**.
   - Nombre exacto: **`tour-images`** (en minúsculas, con guion).

2. **Hacerlo PÚBLICO.**
   - Al crear el bucket (o en su configuración), activa la opción **"Public bucket"**.
   - *Por qué:* las fotos de los tours se muestran en el catálogo a **cualquier visitante, sin necesidad de iniciar sesión**. Un bucket público entrega URLs estables y rápidas (vía CDN) sin tener que "firmar" cada lectura. Es lo correcto para contenido público como fotos de catálogo.

3. **NO crear una policy de subida (INSERT) pública.**
   - Deja las políticas de **escritura cerradas** (no agregues una regla que permita subir a "cualquiera").
   - *Por qué:* en nuestro flujo, las subidas entran **solo a través del permiso temporal que emite el backend** con la llave de servicio (*service role*), y esa llave **se salta las políticas** (tiene permiso total). Si dejamos la escritura cerrada al público, **nadie puede subir salvo quien obtuvo un permiso de nuestro backend** — que solo se lo damos a operadores con sesión. Ese es el modo más seguro.
   - La **lectura pública** sí queda habilitada automáticamente al marcar el bucket como público (paso 2).

4. **Configurar el límite de tamaño del bucket: 5 MB.**
   - En la configuración del bucket, **"File size limit"** → ponlo en **5 MB**.
   - *Por qué:* es la barrera real. Aunque algo se cuele en el navegador, Storage rechazará cualquier archivo más grande.

5. **Configurar los tipos de archivo permitidos (MIME types): solo JPG y PNG.**
   - En **"Allowed MIME types"** del bucket, agrega exactamente:
     - `image/jpeg`
     - `image/png`
   - *Por qué:* alinea con lo que el formulario promete ("JPG o PNG") y bloquea cualquier otro tipo de archivo a nivel de Storage.

### ✅ Validación del Paso 3.0 (hazla tú, confirma que quedó bien)

1. En el dashboard, dentro del bucket `tour-images`, sube **a mano** una imagen de prueba (un JPG o PNG cualquiera).
2. Haz clic en el archivo → copia su **URL pública** ("Get public URL" / "Copy URL").
3. Pega esa URL en una pestaña nueva del navegador.
4. **Debe cargar y mostrarse la imagen.** Si se ve, el bucket público quedó bien configurado y podemos seguir con la implementación.

> Cuando confirmes que el paso 3.0 funciona, avísame y arrancamos con el paso 3.1 (código del backend).

---

## Sub-pasos de implementación (trabajo de código, después del 3.0)

> Estos los hace Claude. Se listan aquí para que tengas el mapa completo.

| Paso | Qué se hace | Archivo(s) que toca | Cómo se valida |
|------|-------------|---------------------|----------------|
| **3.0** *(José, ya descrito arriba)* | Crear bucket `tour-images` público, sin INSERT público, límite 5 MB + MIME JPG/PNG | Dashboard de Supabase (no es código) | Subir un archivo a mano, abrir su URL pública en el navegador → carga la imagen |
| **3.1** | Endpoint que emite la **signed upload URL** tras `requireOperator`; decide la ruta del archivo (`{operatorId}/{uuid}.{ext}`) y valida el tipo declarado | nuevo endpoint (ej. `api/uploads/tour-image.ts`) | Con sesión de operador → responde con el permiso de subida; sin sesión → 401; usuario que no es operador → 403 |
| **3.2** | En el formulario: validar tamaño/tipo, pedir el permiso al backend, **subir el archivo directo a Storage**, obtener la URL pública y ponerla en `form.photo` (reemplaza el base64 actual). Mostrar "subiendo…" y errores | `src/AppDemo.jsx` (componente de foto) + posible helper en `src/lib/` | Subir un JPG real desde la UI → el preview muestra la imagen desde su URL pública; un archivo >5 MB o un PDF se rechazan con mensaje |
| **3.3** | Confirmar que al guardar el tour se envía esa URL. El mapeo del formulario ya incluye la foto si es una URL `http(s)` — esto es **solo verificación**, no reescritura | `src/AppDemo.jsx` (verificar) | Crear un tour con foto → la imagen queda guardada; recargar el catálogo la muestra |
| **3.4** | Verificar que **editar** un tour sin cambiar la foto **no borra** la imagen existente (el backend ya maneja esa lógica), y que subir una nueva sí la reemplaza | verificación de `lib/tour-input.ts` + endpoint de edición | Editar sin tocar foto → imagen intacta; editar subiendo otra → imagen reemplazada |
| **3.5** *(opcional, deuda)* | Decidir qué hacer con fotos "huérfanas" (cuando se reemplaza una imagen, la anterior queda en Storage). Para el MVP puede quedar como deuda anotada | `docs/` (decisión) | N/A — decisión de producto |

**Orden de dependencias:** primero **3.0 (José)** → luego 3.1 (backend) → 3.2 (frontend) → 3.3 y 3.4 (verificación de lo que ya existe).

---

## Validación de archivos: 3 capas

La foto se valida en tres lugares, cada uno con un propósito distinto:

1. **Frontend (experiencia de usuario).** Antes de subir, el navegador revisa que el archivo pese ≤ 5 MB y sea JPG o PNG. Si no, muestra un error al instante. *Esto evita subidas inútiles, pero un usuario malicioso podría saltárselo.*
2. **Backend (identidad).** Cuando se pide el permiso de subida, el backend verifica que quien lo pide **es un operador con sesión válida** (`requireOperator`). *Esto controla quién puede subir, no el contenido del archivo.*
3. **Bucket de Supabase (cumplimiento real).** El límite de 5 MB y los tipos JPG/PNG configurados en el paso 3.0 son la **barrera que no se puede saltar** desde el navegador. *Esta es la validación autoritativa.*

> Como en el Flujo A el archivo **no pasa por nuestro servidor**, el límite de tamaño y tipo del **bucket** es la defensa real. Por eso el paso 3.0 es importante.

---

## SDK / paquetes

- **No falta instalar nada.** El paquete `@supabase/supabase-js` ya está en el proyecto e incluye Storage.
- Métodos que se usarán (Flujo A):
  - **Backend** (con service role): `createSignedUploadUrl(path)` → genera el permiso temporal de subida.
  - **Navegador**: `uploadToSignedUrl(path, token, file)` → sube el archivo usando ese permiso.
  - **URL pública**: `getPublicUrl(path)` → la URL estable que se guarda en el tour y se muestra en el catálogo.

---

## Mejoras futuras (anotadas, no en este alcance)

- **Galería multi-foto.** Hoy el tour guarda **una sola** imagen (`imageUrl`). Soportar varias fotos por tour es un cambio mayor: hay que modificar el modelo de datos (un arreglo de imágenes o una tabla aparte), agregar/ajustar endpoints, construir una galería en el formulario del operador y un carrusel en el catálogo. Es un **mini-proyecto propio**, posterior a tener funcionando el upload de **una** foto. No entra en este plan.
- **PDFs.** Decidido **NO** soportar subida de PDFs. El formulario estructurado (campos de título, descripción, precio, etc.) es superior a adjuntar un PDF: produce datos limpios, buscables y mostrables en la app. Un PDF sería contenido opaco que no podemos indexar ni mostrar bien.
