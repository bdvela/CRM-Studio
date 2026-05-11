# Especificación: HU-06 — Crear y gestionar servicios

## Historia de usuario
**Como** owner del salón, **quiero** crear servicios con su categoría, precio y duración, **para** tener mi catálogo actualizado al momento de agendar citas.

## Descripción
El owner puede crear, editar y desactivar servicios del catálogo. Cada servicio tiene una categoría (Sistema de uñas, Pedicura, Makeup, Pestañas, Cejas), un precio, una duración estimada en minutos, una descripción y opcionalmente una imagen de referencia. Los servicios inactivos no aparecen al agendar pero se mantienen en historial de citas pasadas.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la base de datos Servicios
2. Crea un nuevo servicio con: nombre, categoría, precio, duración
3. Opcionalmente agrega descripción e imagen de referencia
4. Marca el servicio como activo (default: checked)
5. El servicio queda disponible para agendar en Citas

## Flujos alternativos / casos borde
- **Servicio duplicado**: Verificar manualmente antes de crear
- **Cambio de precio en servicio existente**: No afecta citas ya agendadas (el precio se congela al crear la cita)
- **Desactivar servicio**: No se elimina, se marca como inactivo. Las citas pasadas mantienen la referencia

## Reglas de negocio
- RB-01: El nombre del servicio es obligatorio
- RB-02: La categoría es obligatoria
- RB-03: Un servicio inactivo no debería aparecer como opción al agendar nuevas citas
- RB-04: Los cambios de precio NO afectan citas ya creadas
- RB-05: No se eliminan servicios, solo se desactivan

## Criterios de aceptación
- [ ] Puedo crear un servicio con nombre, categoría, precio y duración
- [ ] Puedo agregar descripción e imagen de referencia
- [ ] Puedo marcar servicios como activos/inactivos
- [ ] Los servicios activos están disponibles al agendar citas
- [ ] Puedo editar precio y duración sin afectar citas existentes

## Fuera de alcance
- Paquetes/bundles de servicios
- Precios diferenciados por artista
- Control de stock de materiales por servicio

---

# System Design Document: HU-06

## Base de datos: Servicios

### Propiedades

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Servicio | Title | Sí | Campo principal |
| Categoría | Select | Sí | Ver opciones abajo |
| Duración | Number | Sí | En minutos, formato número |
| Precio | Number | Sí | Formato número |
| Descripción | Rich text | No | |
| Imagen referencia | Files & media | No | |
| Activo | Checkbox | Auto | Default: checked |

### Select options: Categoría
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
| Catálogo activo | Table | Activo = checked | Categoría, luego Nombre | — |
| Por categoría | Board | Activo = checked | — | Categoría |
| Galería | Gallery | Activo = checked | — | Categoría |
| Todos (incluye inactivos) | Table | Ninguno | Nombre A-Z | — |
| Inactivos | Table | Activo = unchecked | Nombre A-Z | — |

### Propiedades visibles en vista Table
| Columna | Ancho | Visible |
|---------|-------|---------|
| Servicio | Auto | ✅ |
| Categoría | 180px | ✅ |
| Precio | 100px | ✅ |
| Duración | 100px | ✅ |
| Activo | 80px | ✅ |

### Dependencias
- Ninguna (DB independiente)

### Limitaciones de Notion
- Al filtrar Citas por servicios, la relación muestra TODOS los servicios (activos e inactivos)
- No hay forma nativa de ocultar servicios inactivos en el selector de relaciones
- Workaround: usar vista de tabla con filtro "Activo = checked" al seleccionar
