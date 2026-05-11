# Especificación: HU-14 — Registrar miembro del staff

## Historia de usuario
**Como** owner del salón, **quiero** registrar a cada miembro del staff con sus datos, rol, especialidades y comisión, **para** tener toda la información del equipo centralizada.

## Descripción
El owner puede registrar a cada persona del equipo con su nombre, teléfono, rol (Nail Artist, Lashista, Pedicurista, Maquillista, Otro), especialidades, porcentaje de comisión, horario de trabajo y foto. Puede marcar si está activo o inactivo.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la base de datos Staff/Artists
2. Crea un nuevo registro con: nombre, teléfono
3. Asigna un rol (Nail Artist, Lashista, Pedicurista, Maquillista, Otro)
4. Selecciona las especialidades (multi-select)
5. Ingresa el % de comisión
6. Ingresa el horario de trabajo (texto libre)
7. Opcionalmente sube una foto
8. El staff queda activo por defecto

## Flujos alternativos / casos borde
- **Persona con múltiples roles**: Se asigna un rol principal; las especialidades reflejan el alcance completo
- **Comisión variable**: Se registra el % base; ajustes se manejan en notas
- **Dar de baja**: Se marca como inactivo, no se elimina (mantiene historial de citas)

## Reglas de negocio
- RB-01: El nombre es obligatorio
- RB-02: El % de comisión es un número entre 0 y 100
- RB-03: Un staff inactivo mantiene su historial de citas
- RB-04: Las especialidades deben coincidir con las categorías de servicios
- RB-05: No se eliminan registros de staff, solo se desactivan

## Criterios de aceptación
- [ ] Puedo crear un miembro del staff con nombre y teléfono
- [ ] Puedo asignar un rol
- [ ] Puedo seleccionar especialidades (múltiples)
- [ ] Puedo registrar % de comisión
- [ ] Puedo registrar horario de trabajo
- [ ] Puedo subir foto
- [ ] Puedo marcar como activo/inactivo

## Fuera de alcance
- Gestión de horarios con disponibilidad por hora
- Cálculo automático de disponibilidad
- Gestión de vacaciones/días libres
- Múltiples comisiones por servicio

---

# System Design Document: HU-14

## Base de datos: Staff/Artists

### Propiedades

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Nombre | Title | Sí | Campo principal |
| Teléfono | Phone number | Sí | |
| Rol | Select | Sí | Ver opciones abajo |
| Especialidades | Multi-select | No | Mismas opciones que categorías de Servicios |
| Comisión (%) | Number | Sí | 0-100, formato número |
| Horario | Rich text | No | Texto libre: "Lun-Sáb 9:00-18:00" |
| Foto | Files & media | No | |
| Activo | Checkbox | Auto | Default: checked |
| Mis citas | Relation | Auto | Back-ref de Citas → Artista |

### Select options: Rol
| Option | Color |
|--------|-------|
| Nail Artist | Purple |
| Lashista | Pink |
| Pedicurista | Blue |
| Maquillista | Red |
| Otro | Gray |

### Multi-select options: Especialidades
| Option | Color |
|--------|-------|
| Sistema de uñas | Purple |
| Pedicura | Blue |
| Makeup | Pink |
| Pestañas | Orange |
| Cejas | Yellow |

### Vistas Notion

| Vista | Tipo | Filtros | Orden | Group By |
|-------|------|---------|-------|----------|
| Equipo activo | Table | Activo = checked | Nombre A-Z | — |
| Por rol | Board | Activo = checked | — | Rol |
| Todos | Table | Ninguno | Nombre A-Z | — |
| Inactivos | Table | Activo = unchecked | Nombre A-Z | — |

### Dependencias
- Ninguna (DB independiente)
- Citas usa esta DB como relación (HU-09)

### Limitaciones de Notion
- No hay validación de rango para comisión (%) — el owner debe ingresar 0-100
- El horario es texto libre; no se puede usar para validación de disponibilidad
