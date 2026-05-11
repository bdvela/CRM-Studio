# Especificación: HU-08 — Actualizar precios y duración

## Historia de usuario
**Como** owner del salón, **quiero** modificar el precio o duración de un servicio, **para** mantener mi catálogo actualizado sin afectar citas ya agendadas.

## Descripción
El owner puede editar el precio y duración de cualquier servicio. Los cambios solo afectan a citas nuevas; las citas ya creadas mantienen el precio que tenían al momento de crearse (el rollup en la cita apunta al precio actual del servicio, pero se congela conceptualmente al no editar la cita).

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre un servicio existente
2. Edita el precio y/o duración
3. Los cambios se guardan automáticamente
4. Las citas nuevas usan el nuevo precio; las existentes mantienen el anterior

## Flujos alternativos / casos borde
- **Precio de cita ya creada**: El rollup en Citas refleja el precio actual del servicio. Si el owner no quiere que cambie, debe editar manualmente el precio en la cita.
- **Motivo del cambio**: Se puede registrar en las notas del servicio

## Reglas de negocio
- RB-01: El owner puede editar precio y duración libremente
- RB-02: Las citas existentes mantienen su precio si no se editan
- RB-03: Se puede documentar el motivo del cambio en notas del servicio

## Criterios de aceptación
- [ ] Puedo editar precio y duración de cualquier servicio
- [ ] Los cambios no afectan citas ya agendadas automáticamente
- [ ] Puedo agregar nota con motivo del cambio

## Fuera de alcance
- Historial de cambios de precio (versionado)
- Notificación a clientas de cambios de precio

---

# System Design Document: HU-08

## Base de datos: Servicios

### Consideración: Rollup vs precio congelado

**Problema**: El rollup en Citas (Precio total = Sum de Servicios → Precio) es dinámico. Si cambio el precio del servicio, la cita existente también cambia.

**Soluciones**:

| Opción | Implementación | Complejidad |
|--------|---------------|-------------|
| A. Precio manual en cita | Propiedad Number "Precio cita" en Citas. Se llena al crear y no cambia | Media |
| B. Congelar con n8n | Al crear cita, n8n copia el precio a una propiedad fija en Citas | Media (requiere n8n) |
| C. Aceptar rollup dinámico | Owner edita manualmente la cita si no quiere que cambie | Baja (manual) |

**Recomendación**: Opción A — agregar propiedad "Precio cita" en DB Citas como Number. Al crear la cita, se ingresa manualmente o se pre-llena con el rollup y luego se desconecta.

### Propiedad adicional en Citas

| Propiedad | Tipo | Detalle |
|-----------|------|---------|
| Precio cita (fijo) | Number | Se llena al crear la cita; no cambia si el servicio cambia |
| Notas servicio | Rich text | En DB Servicios, para registrar motivo de cambio de precio |

### Dependencias
- HU-06 (DB Servicios)
- HU-09 (DB Citas)
