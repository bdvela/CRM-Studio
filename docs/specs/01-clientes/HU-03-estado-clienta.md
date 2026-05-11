# Especificación: HU-03 — Actualizar estado de clienta

## Historia de usuario
**Como** owner del salón, **quiero** cambiar el estado de una clienta según su actividad, **para** segmentar mi base de datos y aplicar estrategias diferentes.

## Descripción
El owner puede cambiar manualmente el estado de una clienta entre: Prospecto, Activa, Inactiva, VIP. La transición Prospecto → Activa ocurre automáticamente tras la primera cita completada. Una clienta se marca como inactiva si no tiene citas en 60+ días. El VIP se asigna manualmente.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre el registro de una clienta
2. Cambia el estado manualmente según corresponda
3. El estado se guarda automáticamente (Notion)

## Flujos automáticos
- **Prospecto → Activa**: Al completar la primera cita (manual o n8n)
- **Activa → Inactiva**: Fórmula calcula días sin visita > 60

## Reglas de negocio
- RB-01: Prospecto → Activa tras primera cita completada
- RB-02: Activa → Inactiva si 60+ días sin visita
- RB-03: VIP se asigna manualmente (no automático)
- RB-04: Inactiva → Activa si vuelve a agendar

## Criterios de aceptación
- [ ] Puedo cambiar manualmente el estado de una clienta
- [ ] Se activa automáticamente tras primera cita completada
- [ ] Se marca inactiva si 60+ días sin visita
- [ ] Puedo marcar manualmente como VIP

## Fuera de alcance
- Envío automático de mensajes de reactivación
- Segmentación automática por gasto acumulado
- Workflow de fidelización

---

# System Design Document: HU-03

## Base de datos: Clientes

### Fórmula: Días sin visita
```
if(prop("Última cita"), dateBetween(now(), prop("Última cita"), "days"), "Sin visitas")
```

### Automatización: Prospecto → Activa
| Método | Trigger | Acción |
|--------|---------|--------|
| Manual | Owner completa cita | Cambia estado en Clientes |
| n8n (futuro) | Cita cambia a Completada | Update en Clientes: Estado = Activa |

### Propiedad derivada: Estado de inactividad
| Propiedad | Tipo | Fórmula |
|-----------|------|---------|
| Días sin visita | Formula | `dateBetween(now(), prop("Última cita"), "days")` |
| Estado | Select | Manual o automatización n8n |

### Vistas para gestión de estado

| Vista | Tipo | Filtros |
|-------|------|---------|
| Por cambiar a inactiva | Table | Estado = Activa AND Días sin visita > 60 |
| Para activar | Table | Estado = Prospecto AND Nº citas > 0 |

### Dependencias
- HU-01 (DB Clientes)
- HU-09 (DB Citas — relación necesaria para rollup "Última visita")
- HU-11 (estado de cita completada)

### Limitaciones de Notion
- No hay automatización nativa de cambio de estado
- n8n puede hacer polling de citas completadas y actualizar Clientes
- Fórmula de días sin visita depende del rollup "Última cita"
