# Especificación: HU-05 — Identificar clientas para reactivar

## Historia de usuario
**Como** owner del salón, **quiero** identificar clientas inactivas que no han venido en un tiempo, **para** enviarles mensajes de reactivación con ofertas.

## Descripción
El owner puede ver una lista filtrada de clientas que eran activas pero no han tenido citas en 60+ días. Para cada clienta se muestran datos de contacto (teléfono, email, Instagram) para poder contactarla directamente.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la vista "Por reactivar" en DB Clientes
2. Ve la lista de clientas activas sin visita en 60+ días
3. Revisa datos de contacto
4. Contacta por WhatsApp, email o Instagram con oferta de reactivación

## Reglas de negocio
- RB-01: Se consideran para reactivar: Estado = Activa AND Última visita > 60 días
- RB-02: También se pueden filtrar por 30 o 90 días
- RB-03: Se excluyen VIP de esta lista (otra estrategia para ellas)

## Criterios de aceptación
- [ ] Puedo ver clientas con 60+ días sin visita
- [ ] Veo teléfono, email e Instagram de cada una
- [ ] Puedo filtrar por 30/60/90 días
- [ ] Puedo filtrar clientas que eran frecuentes (Nº citas > N)

## Fuera de alcance
- Envío automático de mensajes de reactivación
- Creación de campañas de marketing
- Seguimiento de respuestas

---

# System Design Document: HU-05

## Base de datos: Clientes

### Vistas para reactivación

| Vista | Tipo | Filtros | Orden |
|-------|------|---------|-------|
| Por reactivar (60 días) | Table | Estado = Activa AND Última visita > hace 60 días | Última visita ASC |
| Por reactivar (30 días) | Table | Estado = Activa AND Última visita > hace 30 días | Última visita ASC |
| Por reactivar (90 días) | Table | Estado = Activa AND Última visita > hace 90 días | Última visita ASC |
| Frecuentes perdidas | Table | Estado = Activa AND Última visita > 60 días AND Nº citas >= 5 | Total gastado DESC |

### Fórmula: Días sin visita
```
if(prop("Última cita"), dateBetween(now(), prop("Última cita"), "days"), "Sin visitas")
```

### Propiedades visibles en vista de reactivación
| Columna | Visible |
|---------|---------|
| Nombre | ✅ |
| Teléfono | ✅ |
| Instagram | ✅ |
| Email | ✅ |
| Última visita | ✅ |
| Días sin visita | ✅ |
| Nº citas | ✅ |
| Total gastado | ✅ |

### Dependencias
- HU-01 (DB Clientes)
- HU-04 (rollup de Última visita)

### Limitaciones de Notion
- No hay envío de mensajes desde Notion
- n8n puede enviar WhatsApp/email usando los datos de contacto
