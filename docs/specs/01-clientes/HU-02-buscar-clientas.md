# Especificación: HU-02 — Ver y buscar clientas

## Historia de usuario
**Como** owner del salón, **quiero** buscar y filtrar clientas por nombre, teléfono o estado, **para** encontrar rápidamente la información que necesito.

## Descripción
El owner puede buscar clientas usando el campo de búsqueda nativo de Notion y crear vistas filtradas por estado (Prospecto, Activa, Inactiva, VIP). La búsqueda funciona por nombre, teléfono e Instagram. Se proveen vistas preconfiguradas para acceso rápido a segmentos de clientas.

## Actores
- Owner/Manager del salón

## Flujo principal
1. El owner accede a la base de datos Clientes
2. Usa la barra de búsqueda para encontrar una clienta por nombre, teléfono o Instagram
3. Opcionalmente cambia de vista para filtrar por estado
4. Ve la lista de clientas con nombre, teléfono y estado

## Flujos alternativos / casos borde
- **Búsqueda sin resultados**: Se muestra lista vacía. El owner puede verificar si la clienta fue ingresada con otro nombre
- **Múltiples coincidencias**: Se muestran todas las coincidencias

## Reglas de negocio
- RB-01: La búsqueda usa los campos Nombre, Teléfono e Instagram
- RB-02: Las vistas por estado se pre-configuran al crear la DB
- RB-03: Orden por defecto: nombre alfabético A-Z

## Criterios de aceptación
- [ ] Puedo buscar clientas por nombre, teléfono o Instagram
- [ ] Puedo filtrar por estado usando vistas predefinidas
- [ ] Veo nombre, teléfono y estado en la lista
- [ ] Puedo ordenar por fecha de primer contacto o nombre

## Fuera de alcance
- Búsqueda fuzzy o aproximada
- Búsqueda por notas o campos personalizados

---

# System Design Document: HU-02

## Base de datos: Clientes (vista)

### Vistas Notion configuradas

| Vista | Tipo | Filtros | Orden | Group By |
|-------|------|---------|-------|----------|
| Todas las clientas | Table | Ninguno | Nombre A-Z | — |
| Prospectos | Table | Estado = Prospecto | Fecha primer contacto DESC | — |
| Activas | Table | Estado = Activa | Nombre A-Z | — |
| Inactivas | Table | Estado = Inactiva | Última visita DESC | — |
| VIP | Table | Estado = VIP | Nombre A-Z | — |
| Por estado | Board | — | — | Estado |

### Propiedades visibles en vista Table
| Columna | Ancho | Visible |
|---------|-------|---------|
| Nombre | Auto | ✅ |
| Teléfono | 150px | ✅ |
| Estado | 120px | ✅ |
| Instagram | 150px | ✅ |
| Fecha primer contacto | 150px | ✅ |

### Limitaciones de Notion
- La búsqueda nativa de Notion busca en todas las propiedades de texto
- No hay búsqueda avanzada con regex
- Las vistas se crean manualmente (la API no permite crear vistas personalizadas)
