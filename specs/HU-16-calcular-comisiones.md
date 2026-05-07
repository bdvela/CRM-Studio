# Especificación: HU-16 — Calcular comisiones

## Historia de usuario
**Como** owner del salón, **quiero** calcular automáticamente la comisión de cada artista, **para** saber cuánto pagarles al final de cada período.

## Descripción
La comisión se calcula como: facturación total del artista × % comisión. Se puede filtrar por semana o mes. El owner puede ver el desglose por cita y marcar la comisión como pagada.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre la ficha de un artista
2. Ve la comisión calculada: Facturación total × % comisión
3. Ve el desglose por cita (linked view)
4. Marca la comisión como pagada (nota o campo)

## Flujos alternativos / casos borde
- **Comisión con base variable**: Se usa el % base; ajustes se anotan en notas
- **Artista sin citas**: Comisión = 0

## Reglas de negocio
- RB-01: Comisión = Facturación total × (Comisión % / 100)
- RB-02: La facturación total incluye solo citas completadas
- RB-03: Se puede calcular por semana o mes (usando filtros en vistas)
- RB-04: Se puede marcar como pagada en notas

## Criterios de aceptación
- [ ] La comisión se calcula automáticamente
- [ ] Puedo ver el desglose por cita
- [ ] Puedo marcar comisiones como pagadas
- [ ] Puedo filtrar por período

## Fuera de alcance
- Generación automática de recibo de comisión
- Pago automático integrado
- Múltiples comisiones por servicio

---

# System Design Document: HU-16

## Base de datos: Staff/Artists

### Fórmula: Comisión a pagar
```
prop("Facturación total") * prop("Comisión (%)") / 100
```

### Propiedad adicional

| Propiedad | Tipo | Detalle |
|-----------|------|---------|
| Comisión a pagar | Formula | `prop("Facturación total") * prop("Comisión (%)") / 100` |
| Comisión mes actual | Formula | Depende de filtro; no se puede nativamente sin DB auxiliar |
| Último pago comisión | Date | Se actualiza manualmente al pagar |

### Limitación: Comisión por período
Notion no permite rollups con filtro de fecha dinámico (ej: "este mes"). Workarounds:

| Opción | Implementación | Complejidad |
|--------|---------------|-------------|
| A. Vista filtrada | Linked view en ficha del artista: citas del mes | Baja |
| B. DB auxiliar "Períodos" | DB con registros Semana/Mes que relaciona artistas | Media |
| C. n8n | Calcula comisión semanal/mensual y la escribe en propiedad | Media |

**Recomendación**: Opción A para v1 (manual con vista filtrada). Opción C para automatización futura.

### Linked view en ficha del artista

| Sección | DB | Filtro |
|---------|----|--------|
| Citas completadas este mes | Citas | Artista = [Esta página] AND Estado = Completada AND Fecha = This month |

### Dependencias
- HU-14 (DB Staff/Artists)
- HU-15 (rollups de facturación)
- HU-09 (DB Citas)
- HU-17 (DB Pagos/Finanzas — si se registra el pago de comisión como egreso)
