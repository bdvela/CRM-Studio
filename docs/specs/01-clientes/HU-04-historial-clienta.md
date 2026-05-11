# Especificación: HU-04 — Ver historial completo de clienta

## Historia de usuario
**Como** owner del salón, **quiero** ver todas las citas, servicios consumidos y pagos de una clienta, **para** conocer su historial y ofrecerle un servicio personalizado.

## Descripción
Desde la ficha de una clienta se puede acceder a todo su historial: citas pasadas y futuras, servicios que ha consumido con más frecuencia, total gastado, y última visita. Los datos se calculan automáticamente mediante rollups de Notion.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre el registro de una clienta en la DB Clientes
2. En la página de la clienta ve un linked view de sus citas (filtrado por esa clienta)
3. Ve las propiedades calculadas: nº citas, total gastado, última visita, servicios frecuentes
4. Puede leer las notas de la clienta para conocer preferencias o contraindicaciones

## Flujos alternativos / casos borde
- **Clienta sin citas**: Los rollups muestran 0 / vacío. La linked view está vacía
- **Clienta nueva**: Solo se muestran datos básicos, historial se llena con el tiempo

## Reglas de negocio
- RB-01: El total gastado se calcula como la suma de los precios totales de todas las citas completadas
- RB-02: La última visita es la fecha de la cita más reciente con estado Completada
- RB-03: Los servicios frecuentes se derivan de los servicios en citas completadas
- RB-04: Las citas futuras también aparecen en el historial (estado Programada)

## Criterios de aceptación
- [ ] Desde la ficha de una clienta puedo ver todas sus citas
- [ ] Veo el total gastado por la clienta
- [ ] Veo la fecha de su última visita
- [ ] Veo sus servicios más frecuentes
- [ ] Puedo ver notas de la clienta

## Fuera de alcance
- Recomendaciones automáticas de servicios basadas en historial
- Gráficos de evolución de gasto
- Exportar historial a PDF

---

# System Design Document: HU-04

## Base de datos: Clientes

### Rollups automáticos

| Propiedad | Tipo | Relación fuente | Propiedad remota | Función |
|-----------|------|-----------------|------------------|---------|
| Nº citas | Rollup | Historial citas → Citas | Título | Count all |
| Total gastado | Rollup | Historial citas → Citas | Precio total | Sum |
| Última visita | Rollup | Historial citas → Citas | Fecha y hora | Latest date |
| Servicios frecuentes | Rollup | Historial citas → Citas | Servicios | Show unique |

### Linked view en página de Clienta
| Vista | Tipo | Filtro | Orden |
|-------|------|--------|-------|
| Citas de esta clienta | Table | Cliente = [Esta página] | Fecha y hora DESC |

### Propiedades de Clientes involucradas
| Propiedad | Tipo | Detalle |
|-----------|------|---------|
| Nombre | Title | |
| Notas | Rich text | Preferencias, contraindicaciones, alergias |
| Estado | Select | Prospecto / Activa / Inactiva / VIP |
| Nº citas | Rollup | Auto-calculado |
| Total gastado | Rollup | Auto-calculado |
| Última visita | Rollup | Auto-calculado |

### Relaciones requeridas
- Clientes ↔ Citas (bidireccional)
  - En Clientes: "Historial citas"
  - En Citas: back-ref automática

### Dependencias
- HU-01 (registro de clienta)
- HU-09 (creación de citas con relación a Clientes)
