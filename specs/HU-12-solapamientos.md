# Especificación: HU-12 — Detectar solapamientos de agenda

## Historia de usuario
**Como** owner del salón, **quiero** que el sistema me alerte si hay un solapamiento de horarios, **para** evitar agendar dos citas al mismo tiempo con la misma artista.

## Descripción
Al crear o editar una cita, se detecta si el artista asignado ya tiene otra cita en el mismo rango de horario. Si hay conflicto, se muestra una alerta. La detección se implementa con automatización n8n.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner crea/edita una cita con artista, fecha/hora y duración
2. n8n detecta si el artista tiene otra cita en ese rango
3. Si hay conflicto, se envía una alerta al owner
4. El owner puede forzar la cita o cambiar el horario

## Flujos alternativos / casos borde
- **Sin solapamiento**: No se envía alerta
- **Forzar cita**: El owner confirma y se agrega nota "solapamiento aceptado"
- **Múltiples solapamientos**: Se muestran todos los conflictos

## Reglas de negocio
- RB-01: Solapamiento = misma artista + rangos de hora que se cruzan
- RB-02: Rango de cita = Fecha/Hora inicio hasta Fecha/Hora inicio + Duración total
- RB-03: Las citas Canceladas y No-show no generan conflicto
- RB-04: El owner puede forzar una cita con solapamiento

## Criterios de aceptación
- [ ] Se detecta solapamiento al crear/editar cita
- [ ] Recibo alerta si hay conflicto
- [ ] Se muestra qué cita genera el conflicto
- [ ] Puedo forzar la cita aún así

## Fuera de alcance
- Bloqueo automático (no permite crear cita con solapamiento)
- Sugerencia automática de horarios disponibles
- Detección de solapamiento en tiempo real (solo por polling n8n)

---

# System Design Document: HU-12

## Workflow n8n: Detección de solapamientos

### Trigger
- **Evento**: Nueva cita creada o cita editada en Notion DB Citas
- **Webhook**: Notion page created/updated

### Lógica del workflow
```
1. Obtener cita nueva: artista, fecha_inicio, duración_total
2. Calcular fecha_fin = fecha_inicio + duración_total
3. Buscar en DB Citas: todas las citas del mismo artista donde:
   - Estado != Cancelada AND Estado != No-show
   - Fecha != cita actual
   - Rangos se cruzan: (inicio_nuevo < inicio_existente + duración_existente) AND (inicio_nuevo + duración_nuevo > inicio_existente)
4. Si hay coincidencias → enviar alerta
5. Si no hay → no hacer nada
```

### Alerta
| Canal | Formato |
|-------|---------|
| Telegram/WhatsApp | "⚠️ Solapamiento: [Artista] tiene cita con [Clienta X] a las [hora] y otra con [Clienta Y] a las [hora]" |
| Notion | Agregar nota en la cita: "⚠️ Solapamiento detectado con [otra cita]" |

### Propiedad en Citas

| Propiedad | Tipo | Detalle |
|-----------|------|---------|
| Solapamiento detectado | Checkbox | Marcado por n8n si hay conflicto |
| Nota solapamiento | Rich text | Detalles del conflicto |

### Dependencias
- HU-09 (DB Citas)
- HU-14 (DB Staff/Artists)
- n8n configurado y conectado a Notion API

### Limitaciones de Notion
- No hay validación nativa de solapamientos
- Notion API no permite triggers en tiempo real (polling cada X minutos)
- n8n requiere webhook o polling programado
