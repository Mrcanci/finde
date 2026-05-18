# Track B — Contenido editorial aprobado

Generado: 2026-05-17
Rama destino: `feature/tours-db-i18n`

## Archivos en esta carpeta

### 1. `tours-db-editorial-content.json`

Campos editoriales nuevos para los **30 tours que ya existen en DB**.
Estos tours NO se vuelven a crear — solo se actualizan los campos nuevos.

Cada entrada tiene:
- `id` (cuid del tour ya en DB)
- `title` (informativo, no se actualiza)
- Los 10 campos nuevos: `aiSummary`, `altTour`, `tags`, `badge`,
  `cancellation`, `meetingPoint`, `altitude`, `days`, `excludedDates`,
  `addedDates`.

**Uso en Fase 2 (seed):** Claude Code debe iterar este array y hacer
`prisma.tour.update({ where: { id }, data: { ...campos nuevos } })`
para cada uno.

### 2. `tours-to-migrate-from-hardcoded.json`

Los **10 tours hardcoded del array TOURS de AppDemo.jsx** que sobreviven
después de eliminar los 4 duplicados (Lima Gastronómico, Valle Sagrado,
Choquequirao, Colca 2D — esos ya existen en DB).

Cada entrada tiene TODOS los campos del Tour completo (schema actual +
campos nuevos), porque estos tours hay que CREARLOS en DB.

**Uso en Fase 2 (seed):** Claude Code debe iterar este array y hacer
`prisma.tour.create({ data: { ... } })` para cada uno. Antes de crear,
resolver `operatorName` → buscar el `Operator` por nombre y usar su `id`
para `operatorId`.

**Importante:** el campo `imageUrl` está marcado como
`EXTRAER_DE_ARRAY_TOURS_HARDCODED`. Claude Code debe leer el array
`const TOURS = [...]` de `src/AppDemo.jsx` y extraer la URL real de
cada tour por su `originalHardcodedId` antes de crear el registro en DB.

## Resumen de decisiones aprobadas en chat (referencia)

| Decisión | Resultado |
|---|---|
| A.1 Campos a agregar al schema | Todos (aiSummary, altTour, tags, badge, cancellation, meetingPoint, days, excludedDates, addedDates, altitude) |
| A.2 Enum de categorías | Mapear hardcoded al enum existente (NO ampliar) |
| A.3 Filtro mystic en UI | Sí, agregar |
| B.1 Cómo llenar campos nuevos | Híbrido: yo (Claude en chat) genero, José aprueba |
| B.2 Refactor TripsView/NOTIFS | Mock con tours random del state |
| B-1 Cancellation | Aprobado: 10 Flexible, 11 Moderada, 9 Estricta |
| B-2 altTour | Aprobado 5 alts (Costa Verde→Máncora descartado) |
| B-3 Resto editorial | Aprobado tal cual |
| B-4 Los 10 hardcoded a migrar | Aprobado tal cual, Pastoruri→Norte Salvaje |

## Mapeo de categorías (hardcoded → enum DB)

```
trekking → adventure
beach    → nature
culture  → cultural
nature   → nature (sin cambio)
adventure → adventure (sin cambio)
gastronomy → gastronomy (sin cambio)
```

## Operadores reasignados (resumen)

Tours hardcoded NO crean operadores nuevos. Reasignación:

| Tour | Operador asignado |
|---|---|
| H-1 Pastoruri | Norte Salvaje |
| H-2 Ballestas + Paracas | Perú Total Tours |
| H-3 Huacachina buggies | Perú Total Tours |
| H-4 Ballenas Los Órganos | Norte Salvaje |
| H-5 Paracas quad bikes | Perú Total Tours |
| H-6 Rajuntay | Perú Total Tours |
| H-7 Playa La Mina | Perú Total Tours |
| H-8 Castillo Chancay | Lima Cultural Tours |
| H-9 Lima de Noche | Lima Cultural Tours |
| H-10 Lunahuaná | Perú Total Tours |
