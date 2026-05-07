# Especificación: HU-11 — Actualizar estado de cita

## Historia de usuario
**Como** owner del salón, **quiero** actualizar el estado de una cita según lo que ocurra, **para** llevar un registro preciso del día.

## Descripción
El owner cambia el estado de una cita a medida que avanza el día: Programada → En curso → Completada. También puede marcar como Cancelada o No-show. Al completar la cita, se habilita el flujo de registro de pago.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre la cita en la DB Citas o desde el calendario
2. Cambia el estado según corresponda:
   - **En curso**: cuando la clienta llega y comienza el servicio
   - **Completada**: cuando finaliza el servicio
   - **Cancelada**: cuando la clienta cancela (agregar motivo en notas)
   - **No-show**: cuando la clienta no llegó
3. Al marcar como Completada, se habilita el flujo de registro de pago (HU-17)

## Flujos alternativos / casos borde
- **Cancelar con motivo**: Se agrega el motivo en el campo Notas
- **Reprogramar**: Si cancela pero quiere re-agendar, se crea nueva cita
- **No-show**: La cita queda en ese estado; se puede crear nueva cita si reagenda

## Reglas de negocio
- RB-01: El flujo normal es: Programada → En curso → Completada
- RB-02: Cancelada y No-show son estados finales (no se espera cambio posterior)
- RB-03: Al completar la cita, se debe registrar al menos la reserva de S/10 como mínimo
- RB-04: Se puede agregar motivo de cancelación en Notas
- RB-05: Una cita completada sin pago completo aparece en pendientes (HU-20)

## Criterios de aceptación
- [ ] Puedo cambiar estado a cualquier valor disponible
- [ ] Puedo agregar motivo al cancelar (en notas)
- [ ] Puedo marcar No-show
- [ ] Al completar, puedo registrar el pago
- [ ] Las citas completadas sin pago aparecen como pendientes

## Fuera de alcance
- Transición automática de estados por tiempo
- Notificación automática a la clienta al cambiar estado
- Re-agendar automático desde estado No-show

---

# System Design Document: HU-11

## Base de datos: Citas

### Propiedad: Estado (Select)

| Option | Color | Uso | Estado final |
|--------|-------|-----|--------------|
| Programada | Blue | Cita agendada | No |
| En curso | Yellow | Servicio en proceso | No |
| Completada | Green | Servicio finalizado | Sí |
| Cancelada | Red | Clienta canceló | Sí |
| No-show | Orange | Clienta no llegó | Sí |

### Flujo de estados
```
Programada ──→ En curso ──→ Completada
    │
    ├──→ Cancelada (motivo en Notas)
    │
    └──→ No-show
```

### Lógica relacionada con Pagos (HU-17)
| Estado cita | Estado pago esperado |
|-------------|---------------------|
| Programada | Reserva registrada (S/10) |
| En curso | Reserva registrada |
| Completada | Pago completo (reserva + saldo) |
| Cancelada | Pago no aplica (reserva puede ser devuelta o no según política) |
| No-show | Pago no aplica (reserva puede perderse según política) |

### Vistas para gestión de estados

| Vista | Tipo | Filtros |
|-------|------|---------|
| En curso | Table | Estado = En curso |
| Completadas hoy | Table | Estado = Completada AND Fecha y hora = Today |
| Canceladas este mes | Table | Estado = Cancelada AND Fecha y hora = This month |
| No-shows este mes | Table | Estado = No-show AND Fecha y hora = This month |

### Dependencias
- HU-09 (DB Citas)
- HU-17 (registro de pagos — dependiente)
