# Auditoría de identidad visual, PENDIENTE

> **Diagnóstico pendiente de ejecución.** Salió de `docs/estado.md` el 2026-08-16
> al podarlo: es un diagnóstico de un momento, que es lo que va en `docs/audits/`,
> no estado ni historia.
>
> **Nada de esto está decidido ni empezado.** `docs/estado.md` conserva el
> resumen y el puntero.

> **Esto es una auditoría PENDIENTE, no un plan de ejecución.** Queda registrada
> para abordarla más adelante. Nada de lo que sigue está decidido ni empezado.

## Qué la origina

José, el **2026-08-16**, mirando el home: los títulos de sección le parecen
**"hechos por IA"**. Al conversarlo quedó claro que **no es sobre esos títulos**:
es sobre **todo el producto**.

## Por qué no la cubre la auditoría anterior

La de agosto midió **mecánica**: contraste WCAG, tamaños de fuente, interlineado,
áreas táctiles, jerarquía. Todo verificable con números, y por eso se pudo
ejecutar en fases con mediciones antes y después.

**Esta es de criterio de diseño:** si el producto se ve como algo hecho por
alguien con intención, o como una plantilla. **No se mide, se juzga.** Son dos
preguntas distintas y la segunda no se responde con las herramientas de la
primera.

## Por qué importa para el negocio, y no es vanidad

**Finde vende confianza.** Un viajero que pone S/300 en una plataforma que no
conoce necesita creer que **hay gente real detrás**. Y una agencia que entra al
panel decide ahí si vale la pena subir sus tours.

**Una interfaz que se lee como plantilla generada debilita las dos cosas antes de
la primera palabra.**

## Qué tendría que cubrir, sin resolverlo ahora

**1. La elección tipográfica.** **DM Serif Display más Plus Jakarta Sans es la
combinación por defecto del estilo asociado a IA de 2023-2024** (plantillas de
Framer, Webflow, landings generadas).

- Alternativas a evaluar: **Fraunces**, **Newsreader**, **Bricolage Grotesque**.
- **Ojo con Instrument Serif:** está reemplazando a DM Serif como **la nueva
  fuente por defecto de IA**. Cambiar a ella sería mudarse al mismo problema un
  año más tarde.
- **Y hay una opción que no cambia de fuente: usar el serif MENOS y con más
  intención.** Hoy está en el logo, el hero, **cada** título de sección, los
  títulos de página y los del panel.

**2. La paleta.** Verde bosque, terracota, crema y dorado es coherente y andina.
Lo que hay que revisar es **si se usa con intención o por inercia**, y si el
**dorado** (hoy casi solo en las estrellas) **tiene trabajo real que hacer**.

**3. Las cards de tour.** Hay **dos diseños para el mismo objeto**: `.tc` del
carrusel y `.gc` de la grilla, con escalas, radios y paddings distintos. **Airbnb
usa una sola card en todos los contextos.**

**4. La ficha de tour.** El diagnóstico ya está hecho de la primera conversación:

- El **título va sobre la foto**, y Airbnb no lo hace.
- **Falta el bloque "Qué harás"** con itinerario.
- **La agencia verificada está subdimensionada**, siendo el diferenciador del
  producto.
- **Falta el mapa** del punto de encuentro.

**5. El panel de agencia.** **Nunca se auditó visualmente.** Es la pantalla que
decide si una agencia confía en la plataforma.

**6. Los estados vacíos, de carga y de error.** Nunca se revisaron **como
conjunto**.

**7. Iconografía, ilustración y microinteracciones.** Hoy **no hay criterio
declarado** sobre ninguna de las tres.

## Cómo NO hacerla

**Leyendo CSS y midiendo números. Eso ya se hizo y no responde esta pregunta.**

Hay que **mirar pantallas completas, en contexto**, y compararlas contra
referentes reales (**Airbnb Experiences, Civitatis, GetYourGuide**) preguntando
**qué comunica cada una, no qué mide**.

## Cuándo

**El punto 1 tiene fecha: la elección tipográfica se decide ANTES de la Fase 6.**
Esa fase asigna tamaños e interlineados por token, y **cada tipografía tiene su
propia altura de x**. Cambiar la fuente después **obliga a recalcular la escala
entera**.

**El resto no bloquea el lanzamiento**, pero conviene resolverlo **antes de que el
prerender congele el diseño en HTML indexable** (tanda 5 del camino al
lanzamiento).

## Y esto pesa MÁS que todo lo anterior: tres cosas de CONTENIDO

**Comunican "esto no es real" con más fuerza que cualquier decisión de diseño, y
no se arreglan diseñando.**

1. **Los 49 tours dicen "Nuevo".** Es **honesto** (los ratings falsos se sacaron a
   propósito, ver la regla de nada falso visible), pero **visualmente comunica
   catálogo vacío**. Un marketplace real tiene mezcla. **Hay que decidir qué
   mostrar mientras no haya reseñas reales.**
2. **Varias fotos tienen la marca de agua de MEGATOURS quemada en la esquina.** La
   foto pertenece a la agencia y **lo dice encima del producto**. Es **tema de
   onboarding, no de UI**.
3. **Una card sale con cuadro blanco sin foto** ("prueba manual"). Ya está en la
   checklist de limpieza.
