# Especificación: HU-10 — Ver agenda del día/semana

## Historia de usuario
**Como** owner del salón, **quiero** ver las citas del día o de la semana en vista calendario, **para** tener control de la agenda y evitar solapamientos.

## Descripción
El owner puede visualizar las citas en diferentes formatos (calendario, tabla, tablero) para tener una vista clara de la agenda. Cada cita muestra información clave: clienta, servicios, hora, artista. Se proveen vistas pre-configuradas para acceso rápido.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la base de datos Citas
2. Selecciona la vista deseada (calendario, tabla, tablero)
3. Ve las citas del día/semana con información resumen
4. Puede hacer clic en una cita para ver detalles o editar

## Flujos alternativos / casos borde
- **Día sin citas**: Calendario muestra día vacío
- **Muchas citas en un día**: Se muestran apiladas en el calendario
- **Citas canceladas**: Aparecen en gris/tachadas en el calendario

## Reglas de negocio
- RB-01: La vista calendario usa "Fecha y hora" como propiedad de fecha
- RB-02: Las citas canceladas y no-show se pueden filtrar visualmente
- RB-03: Se puede filtrar por artista en cualquier vista

## Criterios de aceptación
- [ ] Veo citas en vista calendario
- [ ] Cada cita muestra clienta, hora y artista
- [ ] Puedo filtrar por artista
- [ ] Veo citas canceladas/no-show diferenciadas visualmente
- [ ] Puedo abrir detalles de una cita desde el calendario

## Fuera de alcance
- Vista de timeline/Gantt
- Impresión de agenda
- Sincronización con Google Calendar

---

# System Design Document: HU-10

## Base de datos: Citas

### Vistas Notion configuradas

| Vista | Tipo | Filtros | Orden | Group By | Propiedad fecha |
|-------|------|---------|-------|----------|-----------------|
| Calendario diario | Calendar | Fecha y hora = Today | — | — | Fecha y hora |
| Calendario semanal | Calendar | Fecha y hora = This week | — | — | Fecha y hora |
| Calendario mensual | Calendar | — | — | — | Fecha y hora |
| Tablero por estado | Board | — | Fecha y hora ASC | Estado | — |
| Por artista | Table | — | Fecha y hora ASC | Artista | — |
| Citas de hoy | Table | Fecha y hora = Today | Fecha y hora ASC | — | — |
| Próximas 7 días | Table | Fecha y hora = Next 7 days | Fecha y hora ASC | — | — |
| No-shows | Table | Estado = No-show | Fecha y hora DESC | — | — |
| Canceladas | Table | Estado = Cancelada | Fecha y hora DESC | — | — |

### Propiedades visibles en vistas Table
| Columna | Ancho | Visible |
|---------|-------|---------|
| Título | Auto | ✅ |
| Cliente | 200px | ✅ |
| Servicios | 250px | ✅ |
| Fecha y hora | 180px | ✅ |
| Artista | 180px | ✅ |
| Estado | 130px | ✅ |
| Precio total | 120px | ✅ |

### Dependencias
- HU-09 (DB Citas creada con relaciones)

### Limitaciones de Notion
- La API no permite crear vistas personalizadas; se documentan para creación manual
- El calendario nativo de Notion no soporta vista semanal (solo mensual)
- Workaround: usar filtro "This week" en vista Calendar para simular semanal
