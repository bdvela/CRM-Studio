# HU-11: Filtros avanzados de citas

## Metadata
- **ID:** HU-11
- **Prioridad:** Alta
- **Epic:** Gestión de citas
- **Estimación:** 5-6 puntos

## User Story
**Como** recepcionista o dueña del salón
**Quiero** filtrar las citas por artista, estado, servicio y rango de fechas
**Para** encontrar rápidamente la información que necesito y poder revisar la agenda con precisión

## Problema Actual
Los filtros actuales son solo temporales: "Todas", "Hoy", "Semana". No se puede:
- Ver solo las citas de un artista específico
- Filtrar por estado (solo programadas, solo canceladas, etc.)
- Buscar en un rango de fechas personalizado
- Combinar múltiples criterios

**Resultado:** Difícil de encontrar citas específicas, imposible de generar reportes útiles por artista o período.

## Solución Propuesta

Agregar una barra de filtros combinables que se aplica en tiempo real sobre la vista actual (lista o calendario).

### Filtros

| Filtro | Tipo | Comportamiento |
|--------|------|---------------|
| Artista | Dropdown | Todos / [nombre artista 1] / [nombre artista 2] / ... |
| Estado | Pills | Todas → Programadas → Completadas → Canceladas → No-show |
| Fechas | Range | Desde / Hasta con date pickers |
| Cliente | Search | Input con búsqueda por nombre |

### Diseño

```
┌──────────────────────────────────────────────────────────────────┐
│ [👤 Todos ▾]  [● Todas ▸]  [📅 Desde ▾]  [📅 Hasta ▾]  [✕ Reset] │
│                                                                  │
│ 12 citas                                                         │
└──────────────────────────────────────────────────────────────────┘
```

### Flujo de Interacción

```
1. Usuario abre Citas (cualquier vista)
2. Filtros aparecen como una barra horizontal
3. Al activar cualquier filtro → se aplica inmediatamente
4. Badge muestra contador de resultados
5. Si hay filtros activos → aparece botón "Reset"
6. Click en Reset → limpia todo, vuelve a estado por defecto
7. Los filtros persisten al cambiar entre lista y calendario
```

## Estados de UI

### Estado por defecto (sin filtros)
```
┌────────────────────────────────────────────────────────────┐
│ 👤 Todos     ● Todas     Desde ▾   Hasta ▾   [Cliente...] │
│ 45 citas                                                    │
└────────────────────────────────────────────────────────────┘
```

### Estado con filtros activos
```
┌────────────────────────────────────────────────────────────┐
│ 👤 María ✓   ● Programadas ✓  Desde: 01/05  Hasta: 15/05  │
│ ✕ Limpiar filtros                                          │
│ 8 citas                                                     │
└────────────────────────────────────────────────────────────┘
```

### Estado móvil
```
┌────────────────────────┐
│ [🔽 Filtros (2 activos)]│
├────────────────────────┤
│ 👤 María               │
│ ● Programadas          │
│ Desde: 01/05           │
│ Hasta: 15/05           │
│ [Cliente...]           │
│ [ Limpiar ]            │
└────────────────────────┘
```

## Reglas de Negocio

| # | Regla | Detalle |
|---|-------|---------|
| R1 | Filtros combinables | Todos los filtros se aplican con AND lógico |
| R2 | Por defecto | Artista: todos, Estado: todas, Fechas: sin límite, Cliente: vacío |
| R3 | Aplicación inmediata | Sin botón "Aplicar", se aplica al cambiar cualquier filtro |
| R4 | Contador | Siempre muestra "N citas" que coinciden con los filtros activos |
| F1 | Botón Reset | Solo visible cuando hay al menos 1 filtro activo |
| F2 | Persistencia | Los filtros se mantienen al cambiar entre vista lista y calendario |
| F3 | No persisten entre sesiones | Se resetean al recargar la página |
| F4 | Filtro artista | Solo muestra staff activo |
| F5 | Filtro fechas | "Desde" no puede ser posterior a "Hasta" |
| F6 | Sin resultados | Mostrar mensaje amigable "No hay citas con estos filtros" |

## Componentes Nuevos

### `AppointmentFilters`

Componente reutilizable que maneja toda la lógica de filtros.

**Props:**
```typescript
interface AppointmentFiltersProps {
  staff: any[];              // Para el dropdown de artistas
  activeFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  resultCount: number;
}

interface FilterState {
  artistId: string | null;       // null = todos
  status: string | null;         // null = todos
  dateFrom: string | null;       // ISO date
  dateTo: string | null;         // ISO date
  clientSearch: string;          // texto de búsqueda
}
```

**Comportamiento:**
- Dropdown de artistas: lista de staff activo + opción "Todos"
- Pills de estado: toggle cíclico (Todas → Programadas → Completadas → Canceladas → No-show → Todas)
- Date pickers: inputs nativos de tipo date
- Búsqueda cliente: input con debounce de 300ms
- Badge `(N)` al lado del label cuando hay filtro activo
- Botón Reset visible solo si `hasActiveFilters`
- En móvil: panel colapsable con botón "Filtros (N activos)"

## Cambios en Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/citas/AppointmentFilters.tsx` | **Nuevo** componente de filtros |
| `src/app/citas/page.tsx` | Integrar `AppointmentFilters`, pasar filtros a `getAppointments` |
| `src/lib/db/queries.ts` | `getAppointments` acepta filtros `artistId`, `status`, `clientSearch` |

## Integración con `getAppointments`

```typescript
// filters se construyen desde AppointmentFilters
const filter = {
  ...listFilter,           // dateFrom/dateTo de Hoy/Semana
  artistId: activeFilters.artistId,
  status: activeFilters.status,
  clientSearch: activeFilters.clientSearch,
};

const appts = await getAppointments(filter);
```

En `queries.ts`, se agregan condiciones al query de Supabase:
```typescript
if (filters?.artistId) q = q.eq('artist_id', filters.artistId);
if (filters?.status) q = q.eq('status', filters.status);
// clientSearch se aplica post-query (ilike en nombre)
if (filters?.clientSearch) {
  data = data.filter(a =>
    a.client?.name?.toLowerCase().includes(filters.clientSearch.toLowerCase())
  );
}
```

## Criterios de Aceptación

- [ ] Dropdown de artista filtra por staff seleccionado
- [ ] Pills de estado ciclan entre todos los estados posibles
- [ ] Rango de fechas filtra correctamente (desde y hasta)
- [ ] Búsqueda por nombre de cliente filtra en tiempo real (debounce 300ms)
- [ ] Filtros son combinables (AND lógico)
- [ ] Contador de resultados siempre visible y correcto
- [ ] Botón "Limpiar" aparece solo cuando hay filtros activos
- [ ] Al limpiar, vuelve al estado por defecto
- [ ] Filtros persisten al cambiar entre vista lista y calendario
- [ ] En móvil, filtros están en panel colapsable
- [ ] Sin resultados: mensaje amigable "No hay citas con estos filtros"
- [ ] Solo muestra staff activo en el dropdown de artistas

## Escenarios de Prueba

| Escenario | Filtros activos | Resultado esperado |
|-----------|----------------|-------------------|
| Filtrar por artista | María | Solo citas de María |
| Filtrar por estado | Programadas | Solo citas programadas |
| Filtrar por fecha | 01/05 - 15/05 | Citas dentro del rango |
| Búsqueda cliente | "Ana" | Citas de clientes con "Ana" en el nombre |
| Combinado | María + Programadas | Citas de María que están programadas |
| Combinado 3 filtros | María + 01/05-15/05 + Programadas | Todas las condiciones |
| Reset | Todos activos → Reset | Vuelve a "Todas las citas" |
| Sin resultados | Filtros que no coinciden | Mensaje "No hay citas con estos filtros" |
| Cambio de vista | Filtros activos → Cambiar a Calendario | Filtros se mantienen |
| Mobile | Filtros activos → Colapsar/Expandir | Estado se conserva |
