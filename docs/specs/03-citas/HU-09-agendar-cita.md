# Especificación: HU-09 — Agendar nueva cita

## Historia de usuario
**Como** owner del salón, **quiero** crear una cita seleccionando clienta, servicios, artista y horario, **para** organizar la agenda del salón.

## Descripción
El owner puede crear una cita vinculando una clienta (existente o nueva) con uno o más servicios, asignando un artista y un horario. Al seleccionar los servicios, se calculan automáticamente el precio total y la duración total. Si la clienta no existe, se crea al momento con nombre + teléfono mínimo; los datos restantes se completan durante la cita presencial.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la base de datos Citas
2. Crea un nuevo registro de cita
3. Selecciona o crea una clienta:
   - Si existe: la selecciona de la relación
   - Si no existe: crea una nueva (nombre + teléfono mínimo) que se registra automáticamente en DB Clientes
4. Selecciona uno o más servicios del catálogo activo
5. El precio total y duración total se calculan automáticamente (rollup)
6. Asigna un artista del staff activo
7. Establece fecha y hora de inicio
8. La cita se crea con estado "Programada"
9. Opcionalmente agrega notas

## Flujos alternativos / casos borde
- **Clienta no existe**: Se crea inline con datos mínimos. Se completa después en la cita presencial
- **Sin servicios seleccionados**: Permitido (cita de consulta o evaluación gratuita)
- **Artista no disponible**: El owner verifica visualmente la agenda antes de asignar
- **Múltiples servicios**: Se suman precios y duraciones
- **Servicio con precio variable**: El owner puede ajustar el precio manualmente en la cita

## Reglas de negocio
- RB-01: El precio de la cita se calcula al momento de crearla (suma de servicios)
- RB-02: El precio se congela; cambios futuros en servicios no afectan la cita
- RB-03: La duración total = suma de duraciones de servicios seleccionados
- RB-04: La cita se crea con estado "Programada" por defecto
- RB-05: Se requiere al menos: clienta + fecha/hora
- RB-06: La clienta puede crearse al momento con datos mínimos
- RB-07: Se pueden seleccionar múltiples servicios por cita

## Criterios de aceptación
- [ ] Puedo seleccionar una clienta existente al crear cita
- [ ] Puedo crear una nueva clienta al momento de agendar (nombre + teléfono)
- [ ] Puedo seleccionar uno o más servicios
- [ ] El precio total se calcula automáticamente
- [ ] La duración total se calcula automáticamente
- [ ] Puedo asignar un artista
- [ ] La cita se crea con estado "Programada"
- [ ] Puedo agregar notas

## Fuera de alcance
- Detección automática de solapamientos (HU-12)
- Envío automático de recordatorio a la clienta
- Selección de silla/espacio físico
- Recurrencia de citas

---

# System Design Document: HU-09

## Base de datos: Citas

### Propiedades

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Título | Title | Auto | Se genera como "{Clienta} — {Servicio principal}" |
| Cliente | Relation | Sí (negocio) | → Clientes |
| Servicios | Relation (multi) | No | → Servicios |
| Artista | Relation | No | → Staff/Artists |
| Fecha y hora | Date | Sí | Con hora incluida |
| Estado | Select | Auto | Default: Programada |
| Precio total | Rollup | Auto | Sum de Servicios → Precio |
| Duración total | Rollup | Auto | Sum de Servicios → Duración |
| Notas | Rich text | No | |

### Select options: Estado
| Option | Color | Default |
|--------|-------|---------|
| Programada | Blue | ✅ |
| En curso | Yellow | |
| Completada | Green | |
| Cancelada | Red | |
| No-show | Orange | |

### Relaciones requeridas

| Propiedad | DB destino | Tipo | Back-ref |
|-----------|-----------|------|----------|
| Cliente | Clientes | Relation | Historial citas |
| Servicios | Servicios | Relation (multi) | Citas con este servicio |
| Artista | Staff/Artists | Relation | Mis citas |

### Rollups en Citas

| Propiedad | Relación fuente | Propiedad remota | Función |
|-----------|-----------------|------------------|---------|
| Precio total | Servicios | Precio | Sum |
| Duración total | Servicios | Duración | Sum |

### Rollups en Clientes (dependientes de esta DB)

| Propiedad | Relación fuente | Propiedad remota | Función |
|-----------|-----------------|------------------|---------|
| Nº citas | Historial citas | Título | Count all |
| Total gastado | Historial citas | Precio total | Sum |
| Última visita | Historial citas | Fecha y hora | Latest date |

### Rollups en Staff/Artists (dependientes de esta DB)

| Propiedad | Relación fuente | Propiedad remota | Función |
|-----------|-----------------|------------------|---------|
| Total citas | Mis citas | Título | Count all |
| Facturación total | Mis citas | Precio total | Sum |
| Última cita | Mis citas | Fecha y hora | Latest date |

### Vistas Notion iniciales

| Vista | Tipo | Filtros | Orden | Group By |
|-------|------|---------|-------|----------|
| Todas las citas | Table | — | Fecha y hora ASC | — |
| Programadas | Table | Estado = Programada | Fecha y hora ASC | — |
| Calendario | Calendar | — | — | — |

### Dependencias
- HU-01 (DB Clientes)
- HU-06 (DB Servicios)
- HU-14 (DB Staff/Artists)

### Limitaciones de Notion
- El rollup de suma en relaciones multi-select funciona correctamente en Notion
- No hay validación de disponibilidad del artista
- El título se puede auto-generar con fórmula: `prop("Cliente") + " — " + slice(prop("Servicios"), 0, 30)`
