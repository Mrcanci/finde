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

**`docs/estado.md` pasa las 900 líneas.** Llega un punto en que nadie lo lee
entero y **la información deja de estar disponible aunque exista**.

Conviene revisar si hay que **partirlo o podarlo**. Es el mismo problema que
resuelven las reglas con alcance: no se lee todo siempre, se carga lo que
corresponde al archivo que se está tocando.

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
