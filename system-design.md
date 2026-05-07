# System Design Document — CRM Salón de Belleza (Sistema Completo)

## 1. Arquitectura Global

### Bases de datos (5)
```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Clientes   │────▶│    Citas     │◀───▶│  Staff/Artists   │
│             │     │              │     │                  │
│ • Datos     │     │ • Agenda     │     │ • Datos          │
│ • Historial │     │ • Estado     │     │ • Especialidades │
│ • Estado    │     │ • Servicios  │     │ • Comisiones     │
└─────────────┘     └──────┬───────┘     └──────────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
             ┌──────▼──────┐  ┌───▼──────────┐
             │  Servicios  │  │ Pagos/Finanzas│
             │             │  │              │
             │ • Catálogo  │  │ • Ingresos   │
             │ • Precios   │  │ • Egresos    │
             │ • Categorías│  │ • Comprobante│
             └─────────────┘  └──────────────┘
```

### Relaciones

| Origen | Destino | Tipo | Propiedad origen | Propiedad destino (back-ref) |
|--------|---------|-----|------------------|------------------------------|
| Clientes | Citas | 1:N | Historial citas | Cliente |
| Citas | Servicios | N:M | Servicios | Citas con este servicio |
| Citas | Staff/Artists | N:1 | Artista | Mis citas |
| Citas | Pagos/Finanzas | 1:N | Pagos registrados | Cita |
| Clientes | Pagos/Finanzas | 1:N | Mis ingresos | Cliente |

---

## 2. Estructura del Workspace Notion

```
💆‍♀️ CRM Salón de Belleza (página principal / dashboard)
│
├── 📊 Dashboard (contenido embebido)
│   ├── Citas de hoy
│   ├── Próximos 7 días
│   ├── KPIs
│   ├── Pendientes de pago
│   └── Clientas por reactivar
│
├── 👩‍💼 Clientes (base de datos)
├── 💅 Servicios (base de datos)
├── 📅 Citas (base de datos)
├── 👩‍🎨 Staff/Artists (base de datos)
└── 💰 Pagos/Finanzas (base de datos)
```

---

## 3. Schema Completo de Bases de Datos

### 3.1 DB: Clientes

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Nombre | Title | Sí | |
| Teléfono | Phone number | Sí (negocio) | |
| Email | Email | No | |
| Instagram | URL | No | Link al perfil |
| Fecha primer contacto | Created time | Auto | Inmutable |
| Estado | Select | Sí | Prospecto / Activa / Inactiva / VIP |
| Notas | Rich text | No | Preferencias, contraindicaciones |
| Foto | Files & media | No | |
| Historial citas | Relation | Auto | → Citas (dual) |
| Nº citas | Rollup | Auto | Historial citas → Título → Count |
| Total gastado | Rollup | Auto | Historial citas → Precio total → Sum |
| Última visita | Rollup | Auto | Historial citas → Fecha y hora → Latest date |
| Servicios frecuentes | Rollup | Auto | Historial citas → Servicios → Show unique |
| Días sin visita | Formula | Auto | `if(prop("Última cita"), dateBetween(now(), prop("Última cita"), "days"), "Sin visitas")` |
| Mis ingresos | Relation | Auto | → Pagos/Finanzas (dual) |

#### Select options: Estado
| Option | Color |
|--------|-------|
| Prospecto | Yellow |
| Activa | Green |
| Inactiva | Gray |
| VIP | Purple |

#### Vistas
| Nombre | Tipo | Filtros | Orden | Group By |
|--------|------|---------|-------|----------|
| Todas las clientas | Table | — | Nombre A-Z | — |
| Prospectos | Table | Estado = Prospecto | Fecha primer contacto DESC | — |
| Activas | Table | Estado = Activa | Nombre A-Z | — |
| VIP | Table | Estado = VIP | Nombre A-Z | — |
| Por estado | Board | — | — | Estado |
| Por reactivar (60d) | Table | Estado = Activa AND Última visita > 60 días | Última visita ASC | — |
| Recientes | Table | — | Created time DESC | — |

---

### 3.2 DB: Servicios

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Servicio | Title | Sí | |
| Categoría | Select | Sí | Sistema de uñas / Pedicura / Makeup / Pestañas / Cejas |
| Duración | Number | Sí | Minutos |
| Precio | Number | Sí | |
| Descripción | Rich text | No | |
| Imagen referencia | Files & media | No | |
| Activo | Checkbox | Auto | Default: checked |
| Citas con este servicio | Relation | Auto | ← Citas (dual) |

#### Select options: Categoría
| Option | Color |
|--------|-------|
| Sistema de uñas | Purple |
| Pedicura | Blue |
| Makeup | Pink |
| Pestañas | Orange |
| Cejas | Yellow |

#### Vistas
| Nombre | Tipo | Filtros | Orden | Group By |
|--------|------|---------|-------|----------|
| Catálogo activo | Table | Activo = checked | Categoría, Nombre | — |
| Por categoría | Board | Activo = checked | — | Categoría |
| Galería | Gallery | Activo = checked | — | Categoría |
| Todos | Table | — | Nombre A-Z | — |
| Inactivos | Table | Activo = unchecked | Nombre A-Z | — |

---

### 3.3 DB: Staff/Artists

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Nombre | Title | Sí | |
| Teléfono | Phone number | Sí | |
| Rol | Select | Sí | Nail Artist / Lashista / Pedicurista / Maquillista / Otro |
| Especialidades | Multi-select | No | Sistema de uñas / Pedicura / Makeup / Pestañas / Cejas |
| Comisión (%) | Number | Sí | 0–100 |
| Horario | Rich text | No | Texto libre |
| Foto | Files & media | No | |
| Activo | Checkbox | Auto | Default: checked |
| Mis citas | Relation | Auto | ← Citas (dual) |
| Total citas | Rollup | Auto | Mis citas → Título → Count |
| Facturación total | Rollup | Auto | Mis citas → Precio total → Sum |
| Última cita | Rollup | Auto | Mis citas → Fecha y hora → Latest date |
| Servicios realizados | Rollup | Auto | Mis citas → Servicios → Show unique |
| Comisión a pagar | Formula | Auto | `prop("Facturación total") * prop("Comisión (%)") / 100` |
| Último pago comisión | Date | No | Manual |

#### Select options: Rol
| Option | Color |
|--------|-------|
| Nail Artist | Purple |
| Lashista | Pink |
| Pedicurista | Blue |
| Maquillista | Red |
| Otro | Gray |

#### Multi-select options: Especialidades
| Option | Color |
|--------|-------|
| Sistema de uñas | Purple |
| Pedicura | Blue |
| Makeup | Pink |
| Pestañas | Orange |
| Cejas | Yellow |

#### Vistas
| Nombre | Tipo | Filtros | Orden | Group By |
|--------|------|---------|-------|----------|
| Equipo activo | Table | Activo = checked | Nombre A-Z | — |
| Por rol | Board | Activo = checked | — | Rol |
| Todos | Table | — | Nombre A-Z | — |
| Inactivos | Table | Activo = unchecked | Nombre A-Z | — |

---

### 3.4 DB: Citas

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Título | Title | Auto | Se genera manualmente: "{Clienta} — {Servicio}" |
| Cliente | Relation | Sí (negocio) | → Clientes (dual) |
| Servicios | Relation (multi) | No | → Servicios (dual) |
| Artista | Relation | No | → Staff/Artists (dual) |
| Fecha y hora | Date | Sí | Con hora |
| Estado | Select | Auto | Default: Programada |
| Duración total | Rollup | Auto | Servicios → Duración → Sum |
| Precio total | Rollup | Auto | Servicios → Precio → Sum |
| Notas | Rich text | No | Motivo de cancelación, etc. |
| Pagos registrados | Relation | Auto | → Pagos/Finanzas (dual) |
| Total pagado | Rollup | Auto | Pagos registrados → Monto → Sum |
| Saldo pendiente | Formula | Auto | `max(0, prop("Precio total") - prop("Total pagado"))` |
| Pagado completo | Formula | Auto | `prop("Saldo pendiente") <= 0` |
| Solapamiento detectado | Checkbox | Auto | Marcado por n8n |

#### Select options: Estado
| Option | Color |
|--------|-------|
| Programada | Blue |
| En curso | Yellow |
| Completada | Green |
| Cancelada | Red |
| No-show | Orange |

#### Vistas
| Nombre | Tipo | Filtros | Orden | Group By |
|--------|------|---------|-------|----------|
| Todas las citas | Table | — | Fecha y hora ASC | — |
| Calendario | Calendar | — | — | — |
| Calendario diario | Calendar | Fecha y hora = Today | — | — |
| Calendario semanal | Calendar | Fecha y hora = This week | — | — |
| Tablero por estado | Board | — | Fecha y hora ASC | Estado |
| Por artista | Table | — | Fecha y hora ASC | Artista |
| Citas de hoy | Table | Fecha y hora = Today | Fecha y hora ASC | — |
| Próximas 7 días | Table | Fecha y hora = Next 7 days | Fecha y hora ASC | — |
| En curso | Table | Estado = En curso | Fecha y hora ASC | — |
| No-shows | Table | Estado = No-show | Fecha y hora DESC | — |
| Canceladas | Table | Estado = Cancelada | Fecha y hora DESC | — |
| Pendientes de pago | Table | Estado = Completada AND Saldo pendiente > 0 | Fecha y hora DESC | — |
| Completadas este mes | Table | Estado = Completada AND Fecha = This month | Fecha y hora DESC | — |

---

### 3.5 DB: Pagos/Finanzas

| Propiedad | Tipo | Requerido | Detalle |
|-----------|------|-----------|---------|
| Concepto | Title | Sí | |
| Fecha | Date | Sí | Default: hoy |
| Monto | Number | Sí | |
| Tipo | Select | Sí | Ingreso / Egreso |
| Categoría | Select | Sí | Servicio / Insumo / Alquiler / Marketing / Comisiones / Otro |
| Tipo pago | Select | Sí (ingresos) | Reserva / Pago completo / Pago final |
| Método pago | Select | No | Efectivo / Tarjeta / Transferencia / Yape/Plin |
| Cita | Relation | No | → Citas (dual) |
| Cliente | Relation | No | → Clientes (dual) |
| Comprobante | Files & media | No | Foto/captura |
| Pagado | Checkbox | Auto | Default: checked |

#### Select options: Tipo
| Option | Color |
|--------|-------|
| Ingreso | Green |
| Egreso | Red |

#### Select options: Categoría
| Option | Color |
|--------|-------|
| Servicio | Purple |
| Insumo | Blue |
| Alquiler | Orange |
| Marketing | Pink |
| Comisiones | Yellow |
| Otro | Gray |

#### Select options: Tipo pago
| Option | Color | Uso |
|--------|-------|-----|
| Reserva | Blue | Al agendar (S/10 mínimo) |
| Pago completo | Green | Press-on nails (100%) |
| Pago final | Purple | Saldo restante |

#### Select options: Método pago
| Option | Color |
|--------|-------|
| Efectivo | Green |
| Tarjeta | Blue |
| Transferencia | Gray |
| Yape/Plin | Purple |

#### Vistas
| Nombre | Tipo | Filtros | Orden | Group By |
|--------|------|---------|-------|----------|
| Todos los pagos | Table | — | Fecha DESC | — |
| Ingresos este mes | Table | Tipo = Ingreso AND Fecha = This month | Fecha DESC | Tipo |
| Egresos este mes | Table | Tipo = Egreso AND Fecha = This month | Fecha DESC | — |
| Ingresos por método | Board | Tipo = Ingreso AND Fecha = This month | — | Método pago |
| Egresos por categoría | Board | Tipo = Egreso AND Fecha = This month | — | Categoría |
| Reservas pendientes | Table | Tipo pago = Reserva AND Cita.Estado = Completada | Fecha ASC | — |
| Comisiones pagadas | Table | Categoría = Comisiones | Fecha DESC | — |
| Semanal | Table | Fecha = This week | Fecha DESC | Tipo |

---

## 4. Mapa de Fórmulas y Rollups

### Fórmulas

| DB | Propiedad | Fórmula |
|----|-----------|---------|
| Clientes | Días sin visita | `if(prop("Última cita"), dateBetween(now(), prop("Última cita"), "days"), "Sin visitas")` |
| Staff/Artists | Comisión a pagar | `prop("Facturación total") * prop("Comisión (%)") / 100` |
| Citas | Saldo pendiente | `max(0, prop("Precio total") - prop("Total pagado"))` |
| Citas | Pagado completo | `prop("Saldo pendiente") <= 0` |

### Rollups

| DB | Propiedad | Relación | Propiedad remota | Función |
|----|-----------|----------|------------------|---------|
| Clientes | Nº citas | Historial citas | Título | Count all |
| Clientes | Total gastado | Historial citas | Precio total | Sum |
| Clientes | Última visita | Historial citas | Fecha y hora | Latest date |
| Clientes | Servicios frecuentes | Historial citas | Servicios | Show unique |
| Staff/Artists | Total citas | Mis citas | Título | Count all |
| Staff/Artists | Facturación total | Mis citas | Precio total | Sum |
| Staff/Artists | Última cita | Mis citas | Fecha y hora | Latest date |
| Staff/Artists | Servicios realizados | Mis citas | Servicios | Show unique |
| Citas | Duración total | Servicios | Duración | Sum |
| Citas | Precio total | Servicios | Precio | Sum |
| Citas | Total pagado | Pagos registrados | Monto | Sum |

### Orden de creación (por dependencias de rollups)

```
1. Clientes        (sin dependencias)
2. Servicios       (sin dependencias)
3. Staff/Artists   (sin dependencias)
4. Citas           (depende de 1, 2, 3)
5. Pagos/Finanzas  (depende de 4, 1)
6. Rollups en Clientes  (depende de 4)
7. Rollups en Staff/Artists (depende de 4)
8. Rollups en Citas (depende de 5)
```

---

## 5. Dashboard — Estructura Completa

```
💆‍♀️ CRM Salón de Belleza
│
├── Callout: bienvenida del sistema
├── Divider
│
├── 📊 Hoy
│   └── Linked view de Citas (Table)
│       └── Filtro: Fecha y hora = Today, Estado = Programada OR En curso
│
├── 📅 Próximos 7 días
│   └── Linked view de Citas (Calendar)
│       └── Filtro: Fecha y hora = Next 7 days
│
├── 📈 KPIs
│   ├── Linked view: Clientas activas (count footer)
│   │   └── Filtro: Estado = Activa
│   ├── Linked view: Ingresos este mes (sum footer)
│   │   └── Filtro: Tipo = Ingreso, Fecha = This month, Pagado = checked
│   └── Linked view: Citas completadas este mes (count footer)
│       └── Filtro: Estado = Completada, Fecha = This month
│
├── ⚠️ Pendientes de pago
│   └── Linked view de Citas (Table)
│       └── Filtro: Estado = Completada, Saldo pendiente > 0
│
├── 🔄 Clientas por reactivar
│   └── Linked view de Clientes (Table)
│       └── Filtro: Estado = Activa, Última visita > 60 días atrás
│
├── Divider
│
├── 🔗 Navegación rápida (links a cada DB)
│
└── Divider
    └── 🔧 IDs de bases de datos (para referencia/n8n)
```

---

## 6. Automatizaciones n8n

### Workflow 1: Prospecto → Activa
| Paso | Acción |
|------|--------|
| Trigger | Cita actualizada en Notion, Estado cambia a "Completada" |
| 1 | Obtener Cliente relacionado con la cita |
| 2 | Verificar si Cliente tiene Estado = "Prospecto" |
| 3 | Si sí → Actualizar Cliente: Estado = "Activa" |
| 4 | Si no → No hacer nada |

### Workflow 2: Detección de solapamientos
| Paso | Acción |
|------|--------|
| Trigger | Cita creada o actualizada en Notion |
| 1 | Obtener: artista, fecha_inicio, duración_total de la cita nueva |
| 2 | Calcular: fecha_fin = fecha_inicio + duración_total |
| 3 | Buscar citas del mismo artista donde Estado != Cancelada AND Estado != No-show |
| 4 | Detectar cruces de rango de horario |
| 5a | Si hay conflicto → Enviar alerta (Telegram/WhatsApp) + marcar cita |
| 5b | Si no hay → No hacer nada |

### Workflow 3: Alerta de clientas por reactivar
| Paso | Acción |
|------|--------|
| Trigger | Programado: cada lunes a las 9:00 AM |
| 1 | Buscar Clientes donde Estado = Activa AND Última visita > 60 días |
| 2 | Para cada una: enviar recordatorio al owner con datos de contacto |

### Workflow 4: Resumen financiero diario
| Paso | Acción |
|------|--------|
| Trigger | Programado: cada día a las 8:00 PM |
| 1 | Sumar ingresos del día (Tipo = Ingreso, Fecha = Today) |
| 2 | Sumar egresos del día (Tipo = Egreso, Fecha = Today) |
| 3 | Enviar resumen al owner |

---

## 7. Plan de Implementación (Script Python)

### Fase 1: Base de datos independientes (sin relaciones)
1. Crear página Dashboard
2. Crear DB Clientes
3. Crear DB Servicios
4. Crear DB Staff/Artists

### Fase 2: DBs con relaciones
5. Crear DB Citas (relations a Clientes, Servicios, Staff)
6. Crear DB Pagos/Finanzas (relations a Citas, Clientes)

### Fase 3: Rollups y fórmulas
7. Actualizar Clientes con rollups (desde Citas)
8. Actualizar Staff/Artists con rollups y fórmula (desde Citas)
9. Actualizar Citas con rollups (desde Servicios, Pagos) y fórmulas

### Fase 4: Dashboard
10. Poblar Dashboard con callouts, linked views y navegación

### Fase 5: Vistas
11. Crear vistas iniciales en cada DB (vía API si es posible, sino documentar para creación manual)

---

## 8. Estructura del Script Python

```
notion_crm/
├── notion_salon_crm.py          # Script principal
├── requirements.txt             # notion-client, python-dotenv
├── .env                         # NOTION_TOKEN, NOTION_PARENT_PAGE_ID
│
├── helpers/
│   ├── __init__.py
│   ├── notion_api.py            # create_page, create_db, update_db, append_blocks
│   ├── properties.py            # sel(), multisel(), relation_dual(), rollup(), formula()
│   └── blocks.py                # h1(), h2(), para(), callout(), bullet(), toggle(), divider()
│
├── databases/
│   ├── __init__.py
│   ├── clientes.py              # create_clientes(), add_rollups()
│   ├── servicios.py             # create_servicios()
│   ├── staff.py                 # create_staff()
│   ├── citas.py                 # create_citas(), add_rollups()
│   └── pagos.py                 # create_pagos()
│
├── dashboard/
│   └── __init__.py
│   └── dashboard.py             # create_dashboard_shell(), populate_dashboard()
│
└── main.py                      # orquestador
```

### Flujo de ejecución
```
main()
  → create_dashboard_shell()
  → create_clientes()
  → create_servicios()
  → create_staff()
  → create_citas(clientes_id, servicios_id, staff_id)
  → create_pagos(citas_id, clientes_id)
  → add_rollups_clientes(clientes_id)
  → add_rollups_staff(staff_id)
  → add_rollups_citas(citas_id)
  → populate_dashboard(dashboard_id, all_ids)
```

---

## 9. Limitaciones de Notion y Workarounds

| Limitación | Workaround |
|-----------|-----------|
| No hay constraint de unicidad | Buscar manualmente antes de crear |
| No hay vistas automáticas en API | Documentar vistas para creación manual |
| Rollup de precio en Citas es dinámico | Agregar propiedad "Precio cita (fijo)" en Citas |
| No hay KPI cards nativos | Linked views con count/sum en footer |
| No hay automatización nativa | n8n con polling/webhooks |
| No hay validación de solapamientos | n8n Workflow 2 |
| No hay transiciones automáticas de estado | n8n Workflow 1 o cambio manual |
| Calendar view solo mensual | Filtrar "This week" para simular semanal |
| No hay cálculo condicional de sum | Linked views con filtros separados |

---

## 10. Resumen de Decisiones de Diseño

| Decisión | Racional |
|----------|----------|
| 5 DBs (no 9) | Scope del CRM de uñas; sin inventario/proveedores |
| Staff/Artists (no Nail Artists) | Soporta Lashistas, Pedicuristas, Maquillistas |
| Pagos separados de Citas | Flexibilidad para múltiples pagos por cita |
| Reserva S/10 + pago final | Modelo de negocio real del salón |
| Press-on = pago 100% anticipado | Es venta, no servicio |
| Sin créditos | Política de negocio: todo pagado al completar |
| n8n para automatización | Open source, self-hosted, conecta con WhatsApp/Telegram |
| Precio fijo en cita | Evita que cambios en servicios afecten citas existentes |
| Vistas manuales post-creación | API de Notion no permite crear vistas personalizadas |
