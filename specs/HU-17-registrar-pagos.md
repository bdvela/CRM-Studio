# Especificación: HU-17 — Registrar pagos de cita

## Historia de usuario
**Como** owner del salón, **quiero** registrar la reserva y el pago final de una cita, **para** llevar el control de lo cobrado.

## Descripción
Las citas se reservan con un monto mínimo (S/10) y se cancelan al finalizar el servicio. Para ventas de press-on nails, se paga 100% anticipado. Cada registro de pago se vincula a la cita y a la clienta, con método de pago, fecha y comprobante opcional. No se da crédito: toda cita completada debe estar pagada al 100%.

## Actores
- Owner/Manager del salón

## Flujo principal — Cita normal
1. Al agendar la cita, se registra la reserva (S/10) como pago
2. Al completar la cita, se registra el pago del saldo restante
3. El pago se vincula a la cita y a la clienta
4. Se registra método de pago y fecha

## Flujo principal — Press-on nails (venta)
1. Se registra el pago completo (100%) anticipado
2. El pago se vincula al registro de venta/cita
3. Se registra método de pago y fecha

## Flujos alternativos / casos borde
- **Pago con Yape/Plin**: Se registra como método de pago con opción de subir captura
- **Múltiples métodos de pago**: Se crean dos registros de pago (ej: S/10 efectivo + S/30 tarjeta)
- **Press-on sin cita**: Puede registrarse solo como ingreso sin cita relacionada

## Reglas de negocio
- RB-01: Reserva mínima: S/10
- RB-02: Press-on nails: pago 100% anticipado
- RB-03: No hay crédito: cita completada = pagada 100%
- RB-04: Cada pago se vincula a una cita y clienta
- RB-05: Se puede subir comprobante (foto/captura)
- RB-06: Métodos de pago: Efectivo, Tarjeta, Transferencia, Yape/Plin
- RB-07: Tipos de pago: Reserva, Pago completo (press-on), Pago final

## Criterios de aceptación
- [ ] Puedo registrar una reserva al agendar
- [ ] Puedo registrar el pago final al completar la cita
- [ ] Para press-on, puedo registrar pago 100% anticipado
- [ ] Cada pago se vincula a la cita y clienta
- [ ] Puedo subir comprobante de pago
- [ ] Puedo ver si una cita tiene saldo pendiente

## Fuera de alcance
- Cálculo automático del saldo restante
- Integración con pasarela de pago
- Recibos/facturas automáticas
- Control de caja diaria

---

# System Design Document: HU-17

## Base de datos: Pagos/Finanzas

### Propiedades

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Concepto | Title | Sí | Ej: "Reserva — María García" o "Pago final — María García" |
| Fecha | Date | Sí | Default: hoy |
| Monto | Number | Sí | Formato número |
| Tipo | Select | Sí | Ingreso / Egreso |
| Categoría | Select | Sí | Servicio / Insumo / Alquiler / Marketing / Comisiones / Otro |
| Tipo pago | Select | Sí | Reserva / Pago completo / Pago final |
| Método pago | Select | No | Efectivo / Tarjeta / Transferencia / Yape/Plin |
| Cita | Relation | No | → Citas |
| Cliente | Relation | No | → Clientes |
| Comprobante | Files & media | No | Foto/captura |
| Pagado | Checkbox | Auto | Default: checked (para ingresos) |

### Select options: Tipo
| Option | Color |
|--------|-------|
| Ingreso | Green |
| Egreso | Red |

### Select options: Categoría
| Option | Color |
|--------|-------|
| Servicio | Purple |
| Insumo | Blue |
| Alquiler | Orange |
| Marketing | Pink |
| Comisiones | Yellow |
| Otro | Gray |

### Select options: Tipo pago
| Option | Color | Uso |
|--------|-------|-----|
| Reserva | Blue | Al agendar (S/10 mínimo) |
| Pago completo | Green | Press-on nails (100% anticipado) |
| Pago final | Purple | Saldo restante al completar cita |

### Select options: Método pago
| Option | Color |
|--------|-------|
| Efectivo | Green |
| Tarjeta | Blue |
| Transferencia | Gray |
| Yape/Plin | Purple |

### Vistas Notion

| Vista | Tipo | Filtros | Orden |
|-------|------|---------|-------|
| Ingresos este mes | Table | Tipo = Ingreso AND Fecha = This month | Fecha DESC |
| Reservas pendientes | Table | Tipo pago = Reserva | Fecha ASC |
| Pagos por método | Board | Tipo = Ingreso | — |
| Todos los pagos | Table | — | Fecha DESC |

### Relaciones requeridas

| Propiedad | DB destino | Tipo | Back-ref |
|-----------|-----------|------|----------|
| Cita | Citas | Relation | Pagos registrados |
| Cliente | Clientes | Relation | Mis ingresos |

### Flujo de pago típico
```
Agendar → Registro "Reserva" (S/10)
    ↓
Cita en curso
    ↓
Completada → Registro "Pago final" (Total cita - Reserva)
    ↓
Cita pagada 100%
```

### Dependencias
- HU-09 (DB Citas)
- HU-11 (estado de cita)
- HU-01 (DB Clientes)

### Limitaciones de Notion
- No hay cálculo automático de saldo restante (requiere fórmula o manual)
- Se pueden crear múltiples registros de pago por cita
- El comprobante es adjunto manual (no integración con cámara)
