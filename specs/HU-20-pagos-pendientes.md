# Especificación: HU-20 — Ver citas sin pago completo

## Historia de usuario
**Como** owner del salón, **quiero** ver las citas que solo tienen reserva pero aún no el pago final, **para** asegurarme de cobrar antes de que la clienta se vaya.

## Descripción
Se muestran las citas completadas que tienen reserva registrada pero no el pago final. Para press-on nails, se verifica que estén pagadas al 100% antes de entregar. No hay créditos: toda cita completada debe estar pagada al 100%.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la vista "Pendientes de pago"
2. Ve la lista de citas con solo reserva (sin pago final)
3. Ve el monto restante por cobrar (precio total - reserva)
4. Al recibir el pago, registra el pago final y la cita queda pagada

## Flujos alternativos / casos borde
- **Press-on nails**: Debe estar pagada 100% antes de entregar (Tipo pago = Pago completo)
- **Sin ninguna reserva**: La cita aparece como pendiente total

## Reglas de negocio
- RB-01: No hay créditos — toda cita completada debe estar pagada al 100%
- RB-02: Pendiente = Cita Completada sin registro de Pago final
- RB-03: Press-on nails: sin pago completo, no se entrega
- RB-04: Monto restante = Precio total de cita - suma de pagos registrados

## Criterios de aceptación
- [ ] Veo citas con solo reserva registrada
- [ ] Veo el monto restante por cobrar
- [ ] Para press-on, verifico pago 100% antes de entregar
- [ ] No hay créditos

## Fuera de alcance
- Cobro automático pendiente
- Alertas de vencimiento de pago

---

# System Design Document: HU-20

## Bases de datos: Citas + Pagos/Finanzas

### Lógica de detección de pendientes

Una cita tiene saldo pendiente si:
1. Estado = Completada
2. Tiene al menos un registro de pago con Tipo pago = Reserva
3. NO tiene registro de pago con Tipo pago = Pago final

O alternativa (sin revisar tipo de pago):
1. Estado = Completada
2. Suma de montos de pagos < Precio total de la cita

### Vista: Pendientes de pago

**Opción A** — Vista en DB Pagos:
| Vista | Tipo | Filtros |
|-------|------|---------|
| Reservas sin pago final | Table | Tipo pago = Reserva AND Cita.Estado = Completada |

**Opción B** — Vista en DB Citas:
| Vista | Tipo | Filtros |
|-------|------|---------|
| Completadas sin pago | Table | Estado = Completada AND (Pagos = vacío OR Pagos contiene solo Reserva) |

### Fórmula: Saldo pendiente (en Citas)

No se puede calcular directamente en Notion sin una propiedad fija de "Total pagado". 

**Solución**: Agregar propiedad en Citas:

| Propiedad | Tipo | Detalle |
|-----------|------|---------|
| Total pagado | Rollup | Pagos → Monto → Sum |
| Saldo pendiente | Formula | `prop("Precio total") - prop("Total pagado")` |

Esto requiere que el rollup de Pagos → Citas exista (back-ref de HU-17).

### Propiedad adicional en Citas

| Propiedad | Tipo | Relación | Función |
|-----------|------|----------|---------|
| Total pagado | Rollup | Pagos registrados → Monto | Sum |
| Saldo pendiente | Formula | — | `max(0, prop("Precio total") - prop("Total pagado"))` |
| Pagado completo | Checkbox/Formula | — | `prop("Saldo pendiente") <= 0` |

### Dependencias
- HU-09 (DB Citas)
- HU-17 (DB Pagos/Finanzas — relación back-ref necesaria)
