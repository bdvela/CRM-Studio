# Especificación: HU-01 — Registrar nueva clienta

## Historia de usuario
**Como** owner del salón, **quiero** registrar una nueva clienta con sus datos de contacto y redes sociales, **para** tener su información disponible al agendar citas.

## Descripción
El owner del salón puede crear un registro de clienta en la base de datos de Clientes. Los datos mínimos requeridos son nombre y teléfono. El resto de campos (email, Instagram, foto, notas) son opcionales y pueden completarse posteriormente durante la cita presencial. La fecha de primer contacto se registra automáticamente y el estado inicial por defecto es "Prospecto".

## Actores
- Owner/Manager del salón (único usuario del CRM)

## Flujo principal
1. El owner accede a la base de datos Clientes
2. Crea un nuevo registro (Add new)
3. Ingresa nombre y teléfono (mínimo requerido)
4. Opcionalmente ingresa: email, Instagram, notas
5. La fecha de primer contacto se auto-registra (hoy)
6. El estado se establece como "Prospecto" por defecto
7. Guarda el registro

## Flujos alternativos / casos borde
- **Datos incompletos**: Se permite guardar solo con nombre + teléfono. El resto se completa en la cita presencial
- **Clienta duplicada**: El owner busca antes de crear para evitar duplicados por teléfono o Instagram
- **Foto de referencia**: Se puede subir en cualquier momento, no bloquea el registro

## Reglas de negocio
- RB-01: El nombre es obligatorio
- RB-02: El teléfono es el segundo dato más importante (permitir contacto)
- RB-03: La fecha de primer contacto es automática (Created time de Notion)
- RB-04: El estado inicial siempre es "Prospecto"
- RB-05: No hay validación de duplicados automática (Notion no soporta unique constraints)
- RB-06: Los campos opcionales se completan en la cita presencial

## Criterios de aceptación
- [ ] Puedo crear una clienta solo con nombre y teléfono
- [ ] La fecha de primer contacto se registra automáticamente
- [ ] El estado inicial es "Prospecto" por defecto
- [ ] Puedo agregar email, Instagram, notas y foto de forma opcional
- [ ] El registro aparece en la lista de Clientes inmediatamente

## Fuera de alcance
- Validación automática de duplicados
- Sincronización con agenda de contactos del teléfono
- Envío automático de mensaje de bienvenida
- Importación masiva de clientas desde CSV

---

# System Design Document: HU-01

## Base de datos: Clientes

### Propiedades

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Nombre | Title | Sí | Campo principal |
| Teléfono | Phone number | Sí (negocio) | Formato internacional opcional |
| Email | Email | No | |
| Instagram | URL | No | Link directo al perfil |
| Fecha primer contacto | Created time | Auto | Timestamp automático de Notion |
| Estado | Select | Auto | Options: Prospecto (default), Activa, Inactiva, VIP |
| Notas | Rich text | No | |
| Foto | Files & media | No | Una sola imagen de referencia |

### Select options: Estado
| Option | Color | Default |
|--------|-------|---------|
| Prospecto | Yellow | ✅ |
| Activa | Green | |
| Inactiva | Gray | |
| VIP | Purple | |

### Vistas Notion

| Vista | Tipo | Filtros | Orden |
|-------|------|---------|-------|
| Todas las clientas | Table | Ninguno | Nombre A-Z |
| Prospectos | Table | Estado = Prospecto | Fecha primer contacto DESC |
| Recientes | Table | Ninguno | Created time DESC |

### Automatización (n8n — futura)
- Al crear clienta → enviar mensaje de bienvenida por WhatsApp (fuera de alcance v1)

### Dependencias
- Ninguna (primera HU del sistema)

### Limitaciones de Notion
- No hay constraint de unicidad: el owner debe verificar duplicados manualmente buscando por teléfono antes de crear
- Created time es inmutable y automático (no se puede setear manualmente)
