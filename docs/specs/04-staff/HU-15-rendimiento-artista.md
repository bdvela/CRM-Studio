# Especificación: HU-15 — Ver rendimiento por artista

## Historia de usuario
**Como** owner del salón, **quiero** ver cuántas citas ha atendido cada artista y cuánto ha generado, **para** evaluar su rendimiento y calcular comisiones.

## Descripción
Desde la ficha de un artista se pueden ver sus métricas: total de citas completadas, facturación total generada, servicios más realizados y última cita. Los datos se calculan automáticamente mediante rollups.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner abre el registro de un artista en DB Staff/Artists
2. Ve las propiedades calculadas: total citas, facturación, última cita
3. Puede ver un linked view con todas las citas de ese artista

## Criterios de aceptación
- [ ] Veo total de citas completadas por artista
- [ ] Veo facturación total generada
- [ ] Veo servicios que más realiza
- [ ] Puedo filtrar por período (semana/mes)

## Fuera de alcance
- Ranking comparativo entre artistas
- Evaluación de satisfacción de clientas

---

# System Design Document: HU-15

## Base de datos: Staff/Artists

### Rollups automáticos

| Propiedad | Relación fuente | Propiedad remota | Función |
|-----------|-----------------|------------------|---------|
| Total citas | Mis citas | Título | Count all |
| Citas este mes | Mis citas | Título | Count (filter manual en vista) |
| Facturación total | Mis citas | Precio total | Sum |
| Facturación este mes | Mis citas | Precio total | Sum (filter manual en vista) |
| Última cita | Mis citas | Fecha y hora | Latest date |
| Servicios realizados | Mis citas | Servicios | Show unique |

### Vistas en página del artista

| Sección | DB | Filtro | Tipo |
|---------|----|--------|------|
| Citas de este artista | Citas | Artista = [Esta página] | Table |
| Citas del mes | Citas | Artista = [Esta página] AND Fecha = This month | Table |

### Dependencias
- HU-14 (DB Staff/Artists)
- HU-09 (DB Citas — relación necesaria)
