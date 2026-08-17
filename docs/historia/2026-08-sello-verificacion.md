# El sello de verificación

> **Historia, no estado.** Es el registro de trabajo **ya cerrado y en `main`**.
> Se archivó acá el 2026-08-16 al podar `docs/estado.md`, que había llegado a
> 1.767 líneas y se leía entero al empezar cada sesión.
>
> **El estado actual del proyecto vive en `docs/estado.md`.** Este archivo se lee
> solo cuando hace falta reconstruir por qué algo se hizo como se hizo.

## El sello de verificación, CERRADO. Era el bloqueante de lanzamiento

> **RESUELTO el 2026-08-16 (`fix/sello-verificacion-falso`).** Aplicado con
> `scripts/limpiar-sello-verificacion.ts`, con backup previo de `Operator` y
> `Tour` en `backups/sello-antes-limpieza-20260816.sql` (14 y 49 filas
> verificadas dentro del dump, no solo su peso).
>
> **El resto de la sección queda como el diagnóstico que lo originó.**

### Cómo quedó el catálogo público

Verificado contra el API real de finde.pe, no solo contra la base:

| Dato | Antes | Después |
|---|---|---|
| Tours visibles | 49 | **42** |
| Agencias con el sello visibles | **9** | **1** |
| Tours que muestran el sello | 44 | **5** |
| Número MINCETUR expuesto al público | uno inventado y uno real | **solo `201-2025-DIRCETURCAJ`, el real** |

**Las 42 fichas visibles, por agencia:**

| Agencia | Tours | ¿Sello? |
|---|---|---|
| **MEGATOURS** | 5 | **SÍ, y es la única. Es real** |
| Perú Total Tours | 8 | no |
| Norte Salvaje | 6 | no |
| Lima Cultural Tours | 6 | no |
| Colca Adventures | 5 | no |
| Amazonía Viva, Pachamama Sagrada, Inka Trail Co, Andes Auténticos | 3 cada una | no |

**Lo que se hizo, por caso:**

1. **Ocho agencias del seed a `verified = false`.** Sus 37 tours siguen en el
   catálogo, ahora sin badge. Son agencias inventadas: no había nada que
   verificar.
2. **Los 5 tours de "Descubre el Perú" a `active = false`.** La agencia y la
   cuenta quedan **intactas y usables para presentaciones**. No se le bajó
   `verified` porque el sello es justamente lo que se muestra en las demos; lo
   que no podía era estar publicada. **Sigue con `verified = true` en la base y
   eso no expone nada**, porque `gateOperatorMincetur` solo entrega el MINCETUR
   en payloads públicos y ya no tiene ningún tour público.
3. **Los 2 tours de "Tour Prueba" a `active = false`.** No tenían sello, así que
   no eran parte del bloqueante del badge, pero sus descripciones dicen
   `asdasdasd` en el catálogo público y comunican "esto es una demo" con la misma
   fuerza. **No se borraron**: son los tours sobre los que se hizo todo el QA del
   motor de inventario y siguen usables desde el panel.

### EL CRITERIO NUNCA ES EL DOMINIO `@finde.pe`

**Es la trampa del caso y por poco se cae en ella.** La instrucción original decía
"el catálogo público sin tours de cuentas internas", y la forma obvia de
escribirlo es filtrar por `email LIKE '%@finde.pe'`.

**MEGATOURS usa `megatours@finde.pe`.** Comparte dominio con las cuentas
internas. Ese filtro **le habría borrado el sello a la única agencia que lo tiene
ganado y bajado sus 5 tours reales**: el mismo error que la tanda venía a
arreglar, cometido al arreglarlo.

**Por eso las cuentas se nombran una por una, con su email exacto**, y el script
tiene una verificación posterior que comprueba que MEGATOURS quedó con
`verified = true`, su RUC, su MINCETUR y sus 5 tours públicos. Está escrito en el
encabezado de `scripts/limpiar-sello-verificacion.ts` para que no se repita.

### Las reservas existentes no se rompieron

Verificado en el código antes de aplicar: **ningún camino de lectura de reservas
filtra por `active`**. "Mis reservas" del viajero, el panel de la agencia y la
decisión de salidas siguen funcionando; lo que `active = false` corta es la ficha
pública (404) y crear reservas nuevas (409), que es el objetivo.

**Y ninguna reserva real quedó afectada:** las 13 de la cuenta demo y las 20 de
"Tour Prueba" son todas de cuentas internas (`test@finde.pe`, `demo@finde.pe`,
`hola@finde.pe`). **Solicitudes vigentes que quedaran bloqueadas: cero.**

---

### El diagnóstico original (2026-08-15)

**Esto no es deuda de datos ni un ítem de checklist. Es el badge de verificación
de Finde afirmando algo falso, y sobre ese badge descansa toda la propuesta de
valor del producto.** Subió de categoría el 2026-08-15, al abrirse el frente de
navegación abierta.

**El switch no se hace con esto sin resolver.**

### Qué es, exactamente

| Caso | Cuántas | Qué tienen | Por qué es falso |
|---|---|---|---|
| Agencias del seed | **8** | `verified: true`, **sin RUC y sin MINCETUR** | Un sello sin ningún respaldo detrás |
| "Descubre el Perú" (`demo@finde.pe`) | **1** | `verified: true`, RUC `20601234567`, MINCETUR `REG12345` | **Datos inventados con formato válido**, que pasan por reales |

Las 8 del seed, todas sin `userId`: Amazonía Viva, Andes Auténticos, Colca
Adventures, Inka Trail Co, Lima Cultural Tours, Norte Salvaje, Pachamama Sagrada
y Perú Total Tours.

**El segundo caso es el más grave de los dos.** Las 8 no tienen datos: el problema
ahí es un sello vacío. "Descubre el Perú" tiene datos que **parecen reales**, y sus
5 tours salen al catálogo público con el sello al lado de un RUC inventado. Un
viajero que quiera comprobar la agencia va a buscar ese RUC en SUNAT y no va a
encontrar nada, que es exactamente el escenario que la regla existe para evitar.

### Por qué sube de categoría ahora

**Hoy lo ve quien encuentra el demo.** Después de las tandas de navegación abierta
y URLs lo va a ver **Google**, y con el tiempo **una agencia real** que compare su
propio proceso de verificación contra el de estas nueve, o **MINCETUR**.

Y hay un agravante de secuencia: el prerender de meta tags (tanda 5) **congela el
contenido en HTML estático indexable**. Un sello falso publicado así no se
deshace apagándolo en la base: queda en el índice de Google hasta el próximo
crawl. Es la clase de error que se arregla en minutos antes de publicar y en
semanas después.

Choca de frente con dos reglas de la casa, no con una:

- "Nada falso visible al usuario real: sin ratings inventados, sin datos mock, sin
  moderación simulada."
- La verificación manual contra SUNAT y MINCETUR **es el proceso vigente** y es lo
  que se afirma en el copy. Nueve agencias con el sello sin haber pasado por él
  vacían esa afirmación.

### Salidas posibles

Cualquiera de las tres cierra el bloqueante, y se elige caso por caso:

1. **Cargar RUC y MINCETUR reales** y verificarlos a mano, como se hace con las
   agencias de verdad.
2. **Bajar `verified` a `false`.** El tour sigue en el catálogo, sin sello. Es la
   salida más barata y la que menos rompe.
3. **Sacar los tours del catálogo público** (`active: false`).

Para "Descubre el Perú" hay una decisión extra que tomar: es **la cuenta de
presentaciones**, así que hay que resolver cómo sigue sirviendo para demos sin
quedar publicada como agencia verificada.

**Nada de esto se toca sin decisión explícita de José**, porque son escrituras en
la base de producción sobre datos que el catálogo público está mostrando ahora
mismo.
