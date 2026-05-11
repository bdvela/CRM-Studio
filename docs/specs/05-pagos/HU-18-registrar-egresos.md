# Especificación: HU-18 — Registrar egresos

## Historia de usuario
**Como** owner del salón, **quiero** registrar gastos del negocio (insumos, alquiler, etc.), **para** tener control total de las finanzas.

## Descripción
El owner puede registrar egresos con concepto, fecha, monto, categoría y método de pago. Puede vincular el egreso a una cita si aplica (ej: comisión de artista). No hay comprobante obligatorio pero se puede adjuntar foto.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a DB Pagos/Finanzas
2. Crea un nuevo registro con Tipo = Egreso
3. Ingresa: concepto, fecha, monto, categoría, método de pago
4. Opcionalmente vincula a una cita (ej: comisión)
5. Opcionalmente sube comprobante

## Criterios de aceptación
- [ ] Puedo registrar un egreso con concepto, fecha, monto y categoría
- [ ] Categorías: Insumos, Alquiler, Servicios, Marketing, Comisiones, Otro
- [ ] Puedo vincular el egreso a una cita
- [ ] Puedo subir foto del comprobante

## Fuera de alcance
- Recurrencia automática de egresos (alquiler mensual)
- Presupuesto vs gasto real
- Aprobación de gastos

---

# System Design Document: HU-18

## Base de datos: Pagos/Finanzas

### Propiedades (compartidas con HU-17)

| Propiedad | Tipo | Detalle para Egresos |
|-----------|------|---------------------|
| Concepto | Title | Ej: "Compra de esmaltes", "Alquiler marzo", "Comisión — Ana" |
| Fecha | Date | Default: hoy |
| Monto | Number | Formato número |
| Tipo | Select | **Egreso** |
| Categoría | Select | Insumos / Alquiler / Servicios / Marketing / Comisiones / Otro |
| Método pago | Select | Efectivo / Tarjeta / Transferencia / Yape/Plin |
| Cita | Relation | → Citas (opcional, para comisiones) |
| Comprobante | Files & media | Foto del ticket/recibo |

### Vistas para Egresos

| Vista | Tipo | Filtros | Orden |
|-------|------|---------|-------|
| Egresos este mes | Table | Tipo = Egreso AND Fecha = This month | Fecha DESC |
| Egresos por categoría | Board | Tipo = Egreso | — |
| Comisiones pagadas | Table | Tipo = Egreso AND Categoría = Comisiones | Fecha DESC |
| Todos los egresos | Table | Tipo = Egreso | Fecha DESC |

### Dependencias
- HU-17 (DB Pagos/Finanzas — misma DB, solo Tipo = Egreso)
