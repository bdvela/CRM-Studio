# Especificación: HU-07 — Ver catálogo por categoría

## Historia de usuario
**Como** owner del salón, **quiero** ver los servicios organizados por categoría, **para** consultar rápidamente precios y duraciones disponibles.

## Descripción
El owner puede visualizar el catálogo de servicios agrupado por categoría en diferentes formatos (tablero, tabla, galería). Solo se muestran servicios activos por defecto, pero puede ver todos incluyendo inactivos.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la DB Servicios
2. Selecciona la vista deseada (por categoría, lista, galería)
3. Consulta precios y duraciones rápidamente

## Criterios de aceptación
- [ ] Puedo ver servicios agrupados por categoría
- [ ] Veo nombre, precio y duración de cada servicio
- [ ] Puedo filtrar servicios activos vs inactivos
- [ ] Puedo buscar servicios por nombre

## Fuera de alcance
- Catálogo público para compartir con clientas
- Catálogo con fotos profesionales

---

# System Design Document: HU-07

## Base de datos: Servicios

### Vistas (complemento de HU-06)

| Vista | Tipo | Filtros | Group By | Propiedades visibles |
|-------|------|---------|----------|---------------------|
| Por categoría | Board | Activo = checked | Categoría | Nombre, Precio, Duración |
| Lista completa | Table | Activo = checked | — | Servicio, Categoría, Precio, Duración |
| Galería | Gallery | Activo = checked | — | Imagen + Nombre + Precio |

### Dependencias
- HU-06 (DB Servicios)
