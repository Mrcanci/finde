---
paths:
  - 'api/**'
  - 'lib/**'
  - 'src/**'
  - 'scripts/**'
  - 'prisma/*.prisma'
---

# Método de trabajo

**Esto no es una teoría de cómo trabajar. Son patrones que se observaron
funcionando en la sesión del 13 al 16 de agosto de 2026**, con sus casos reales.
Va también **lo que costaron**, no solo lo que dieron: una lista que solo cuenta
los aciertos no sirve para decidir cuándo aplicarlos.

---

## Lo que funcionó

### 1. Medir antes de asumir

**Las cinco cosas más valiosas de la sesión no estaban planificadas y aparecieron
midiendo.** Ninguna salía de leer el código.

| Hallazgo | Apareció mientras |
|---|---|
| **6,1 MB que se descargaban en `/demo`** y nadie veía | se medía el costo de instalar analítica |
| **La sobreventa** al cambiar de modo de venta | se investigaba por qué fallaba una reserva |
| **El ícono del reloj invisible en modo oscuro** | se borraba un bloque de CSS |
| **Los em-dashes dentro de los propios prompts de IA** | se buscaba de dónde salían los de la base |
| **El `P2028` del barrido de solicitudes** | se ejecutaba el backfill |

El patrón se repite: **la medición encuentra lo que la lectura no sabe que tiene
que buscar.** Cuatro de los cinco aparecieron haciendo otra cosa.

### 2. La lectura estática SIEMPRE sobreestima

**Ocurrió cinco veces en la misma sesión**, y siempre en la misma dirección:

| Lo que decía la lectura | Lo que era al medir |
|---|---|
| 39 reglas | **23** |
| 35 selectores | **11** |
| 96 selectores | **91** |
| 22 reglas con centrado propio | **36** (acá subestimó) |
| 764 elementos | **96 accionables** |

**Siempre por contar sin mirar qué tipo de elemento era.** Un selector que existe
no es un selector que aplica; un elemento en el DOM no es un elemento accionable.

**La lectura estática sirve para decidir si vale la pena abrir una vista. Nunca
para reemplazar la medición.** Si un número va a viajar a un documento, sale de
un comando, no de contar la lista (ver la regla 5 de `frontend.md`).

### 3. Verificar antes de aplicar atrapó SEIS errores de dirección

**Todos venían del chat de arquitectura y ninguno llegó a producción:**

1. El mecanismo del interlineado.
2. La causa del desalineado del badge.
3. La variable del foco.
4. La dependencia de P2 con el paso 5.
5. El límite de 10 segundos de Vercel (era otro).
6. Un QA que probó una rama sin mergear. **Pasó dos veces, ver abajo.**

**La regla que lo hizo posible fue una sola: "reportá el diagnóstico antes de
arreglar".** Sin ese paso, los seis se habrían implementado y descubierto después,
que es cuando cuestan un rollback en vez de un mensaje.

#### UNA TANDA NO ESTÁ LISTA PARA QA HASTA QUE ESTÁ EN `dev`

**`dev.finde.pe` sirve `dev`, no las ramas sueltas.** Pedir el OK para el QA con
la rama solo pusheada **garantiza que lo que se pruebe sea el estado anterior**.

**Ocurrió DOS veces en la misma sesión, con dos días de diferencia:**

| Tanda | Qué pasó | Cómo se detectó |
|---|---|---|
| **1B**, la landing en `/demo` | El QA de José probó `dev` **sin el fix** y salió "todo bien" | **Porque nada había cambiado.** Un QA que pasa sin que exista el cambio no prueba nada |
| **Procesamiento de fotos** | Igual: la rama pusheada, `dev` sin ella | **José recibió el mensaje viejo de 5 MB**, que era justo lo que la tanda eliminaba |

**El primer caso es el peligroso, y por eso va primero: salió verde.** Un QA que
falla se investiga; uno que pasa sobre el estado anterior se cierra y se mergea a
producción. El segundo caso se detectó solo porque el síntoma era visible.

**La regla operativa:**

> **El cierre de una tanda que necesita QA en `dev.finde.pe` incluye el merge a
> `dev` y la verificación de que `origin/dev` lo contiene. No alcanza con pushear
> la rama.**

**Y se verifica con `git branch -r --contains`, no con el log:**

```bash
git fetch origin
git branch -r --contains <rama>   # tiene que listar origin/dev
```

**Por qué no con el log:** `git log origin/dev` muestra los commits que uno
espera ver y es fácil leer ahí lo que se quiere leer, sobre todo si la rama y
`dev` comparten historia reciente. `--contains` responde la pregunta exacta que
importa, que no es "qué hay en dev" sino **"¿está mi trabajo en dev?"**.

**Corolario, del mismo error visto desde el otro lado:** un "QA OK" del usuario
**solo cubre lo que estaba en `dev` cuando lo hizo**. Si en el medio se mergeó
algo más, ese QA no lo alcanza y hay que rehacerlo.

### 4. El QA humano encuentra lo que la medición no

**José encontró usando la app**, no leyendo código ni mirando métricas:

- El badge desalineado.
- La reserva que fallaba aunque el calendario mostrara cupos.
- La etiqueta "Último cupo" cortada.
- El aviso de solicitudes que llegaba tres pantallas tarde.

**Ninguno era visible en el código ni en una métrica.** Los dos últimos ni
siquiera son defectos técnicos: son defectos de producto que solo aparecen
recorriendo el flujo con intención de usarlo.

**Consecuencia práctica:** el QA no es un trámite al final de la tanda, es el
único instrumento que cubre esa clase de problema. Por eso las tandas cierran
pidiendo un checklist corto y específico (páginas, flujos, casos borde) y nunca
uno genérico.

### 5. Medir el punto exacto, no los bordes

**Tres bugs distintos con la misma forma**: el API devolvía el dato, el consumidor
lo leía, y **se perdía en el medio**.

Ya está escrito en tres reglas de la casa, y no por casualidad:

- La extracción de CSS por regla y no por línea (`frontend.md`).
- El techo de transacciones medido y no deducido (`api-y-schema.md`).
- Las listas blancas que descartan en silencio (`frontend.md`, `mapTourFromApi`).

**Comprobar las dos puntas de una cadena no alcanza.** Hay que leer el valor
computado en el punto exacto donde se usa.

---

## Lo que costó, y hay que decirlo

### 1. Fuimos lentos

**Tres días para cinco fases de tipografía.** Parte del rigor se aplicó a cosas
que no lo necesitaban.

### 2. El plan se desbordó

Empezó como **"revisar las fuentes"** y terminó tocando **el motor de inventario,
la performance y la estrategia de lanzamiento**. Cada hallazgo abría dos más.

**Está bien cuando lo que aparece es grave.** La sobreventa y los 6,1 MB
justificaban desviarse. **Lo que hay que saber es cuándo anotar y seguir en vez de
perseguir**, y dejar el hallazgo escrito con su evidencia para la tanda que
corresponda.

### 3. La documentación creció más que la capacidad de leerla

**`docs/estado.md` llegó a 1.767 líneas y se duplicó en dos días.** Se podó el
2026-08-16 hasta 174. Al medirlo antes de tocarlo, **las secciones que de verdad
responden "dónde estoy y qué no puedo romper" sumaban 74 líneas sobre 1.767**: el
resto era narrativa de trabajo ya cerrado.

De ahí salieron las dos reglas de abajo.

---

## Cómo se escribe la documentación, para no volver a podarla

### Al cerrar una tanda, el detalle va a `docs/historia/` y al estado va UNA FILA

**El motivo no es que el estado quede prolijo. Es mecánico:**

> **Lo único que se carga solo son las reglas con alcance.** `docs/estado.md`,
> `docs/decisiones.md` y todo lo demás hay que ir a buscarlo, y **un archivo que
> nadie termina de leer es información que existe pero no está disponible**.

Por eso el destino de cada cosa se decide por **cómo se va a leer**, no por dónde
se escribió:

| Qué es | Dónde va | Cómo se lee |
|---|---|---|
| Una baranda que hay que respetar al tocar código | `.claude/rules/` | **Se carga sola** al abrir un archivo que matchea |
| El presente: dónde estoy, qué está abierto | `docs/estado.md` | Se lee entero al empezar cada tanda |
| Por qué se decidió algo | `docs/decisiones.md` | Se consulta al reabrir la decisión |
| La investigación y la medición de algo ya cerrado | `docs/historia/` | Solo cuando hace falta reconstruir el porqué |
| Un diagnóstico de un momento | `docs/audits/` | Cuando se ejecuta o se revisa |

**La prueba práctica antes de escribir un párrafo en `estado.md`: si alguien que
arranca mañana no lo necesita para decidir qué hacer, no va ahí.**

Y el corolario que más ahorra: **una lección transversal NO se queda en
`estado.md`, se promueve a `.claude/rules/`.** En la línea 1.200 de un documento
largo solo sirve si alguien lee el archivo entero, que es justo el problema. En la
regla correcta se carga sola.

### El texto se escribe donde el contenido PERTENECE, no donde está el cursor

**Lección propia, y la poda la destapó midiendo.** En `docs/estado.md` había
**150 líneas mal archivadas**: las secciones de la tanda 1C y de la tanda 2, que
son de imágenes y de rutas, estaban **anidadas dentro de "El motor de
inventario"**. Y 80 líneas del análisis de las imágenes estaban dentro de "En
curso".

**Cómo pasó:** cada edición se ancló al texto que tenía cerca en el momento de
escribir, no a la sección que le correspondía. Se buscaba un párrafo conocido, se
insertaba al lado, y quedaba bajo el encabezado equivocado.

**Es el mismo patrón que "medir el punto exacto, no los bordes", aplicado a la
documentación.** Ahí el error es comprobar las puntas de una cadena y no el punto
donde el dato se usa; acá es escribir donde el cursor está y no donde el contenido
pertenece. Las dos veces el problema es **tomar la referencia más cercana en vez
de la correcta**.

En la práctica, antes de insertar un bloque nuevo: **mirar bajo qué `##` va a
quedar**, no solo qué párrafo tiene arriba. Un `grep -n "^## "` sobre el archivo
cuesta un segundo y evita esto.

---

## El criterio para decidir cuánto rigor aplicar

**No todo merece medición previa.** Esta es la regla que se puede sacar de la
sesión:

**Medí ANTES cuando se cumple alguna de las tres:**

1. **El cambio toca algo que ya funciona en producción.**
2. **El costo de equivocarse es un rollback**, no un mensaje de error.
3. **El diagnóstico viene de leer y no de correr.** Ver el punto 2: la lectura
   estática siempre sobreestima.

**Si el cambio es aditivo, aislado y reversible: aplicá y medí después.**

Ejemplos de la propia sesión, para calibrar:

| Cambio | Criterio | Qué se hizo |
|---|---|---|
| Borrar el bloque `.app-demo` de `index.css` | Toca producción, el diagnóstico venía de leer | Volcado de `getComputedStyle` de **todos** los elementos, antes y después |
| Instalar `@vercel/analytics` | Aditivo, aislado, reversible | Se aplicó y se midió después. La medición igual valió: destapó los 6,1 MB |
| Cambiar la condición de estado de `takeSeats` | Toca producción y el costo es sobreventa | 10 requests paralelos contra 3 cupos, a mano, repetido |
| Redimensionar imágenes de `public/` | Reversible, no toca código | Se aplicó, se midió después y se mostró la comparación visual antes de commitear |
