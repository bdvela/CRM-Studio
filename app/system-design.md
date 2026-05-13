# System Design — Ara Zevallos Studio CRM

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| Lenguaje | TypeScript 5.7 |
| UI | React 19, Tailwind CSS 4.3 |
| Icons | Lucide React 0.469 |
| Fechas | date-fns 4.1, react-day-picker 9.5 |
| BD | PostgreSQL (Supabase) |
| Cliente BD | @supabase/supabase-js 2.47 |
| Toasts | Sonner 1.7 |
| PWA | Manifest + Apple Web App meta |

---

## Rutas de la Aplicación

| Ruta | Página | Propósito |
|------|--------|-----------|
| `/` | Dashboard | KPIs, citas de hoy, pendientes, acciones rápidas |
| `/citas` | Citas | Agenda: vista lista + calendario (mes/semana) |
| `/clientes` | Clientes | Lista con filtros por estado y búsqueda |
| `/clientes/[id]` | Detalle Cliente | Historial, estadísticas, citas |
| `/pagos` | Pagos | Ingresos y egresos |
| `/reportes/comisiones` | Comisiones | Cálculo y reporte por artista |
| `/servicios` | Servicios | Catálogo, categorías, staff por servicio |
| `/staff` | Staff | Artistas, roles, especialidades |

---

## Arquitectura de Componentes

```
app/src/
├── app/                          # App Router pages (Server/Client pattern)
│   ├── layout.tsx                # Root layout (Sidebar + MobileNav)
│   ├── page.tsx                  # Dashboard (Server Component)
│   ├── page-client.tsx           # Dashboard (Client Component)
│   ├── loading.tsx                # Skeleton loading
│   ├── citas/
│   │   ├── page.tsx              # Server: fetch data
│   │   ├── page-client.tsx       # Client: interactivity
│   │   ├── layout.tsx
│   │   └── loading.tsx
│   ├── clientes/
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   │   └── [id]/page.tsx / page-client.tsx
│   ├── pagos/
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   ├── servicios/
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   ├── staff/
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   └── reportes/comisiones/
│       ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│
├── components/
│   ├── layout/
│   │   └── shell.tsx             # Sidebar, MobileNav, Header
│   ├── ui/                       # Primitives (button, input, modal, card, etc.)
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── DatePicker.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── FlagPeru.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── stat-card.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── citas/
│   │   ├── AppointmentCard.tsx       # Card individual en lista
│   │   ├── AppointmentDetail.tsx      # Panel detalle ticket-style
│   │   ├── AppointmentFormModal.tsx   # Modal crear/editar cita
│   │   ├── CalendarView.tsx          # Calendario (mes/semana) + detail popover
│   │   ├── CitasToolbar.tsx         # Toolbar de filtros y cambio de vista
│   │   ├── ClientCombobox.tsx        # Selector de clientas con búsqueda
│   │   ├── DetailPopover.tsx         # Popover de detalle en calendario
│   │   ├── ServiceConfigModal.tsx    # Configuración de artista/precio
│   │   ├── ServiceSelectorModal.tsx # Selector de servicios con filtros
│   │   ├── helpers.ts               # generateAppointmentTitle, toLocalISO
│   │   ├── hooks.ts                 # Custom hooks para lógica de citas
│   │   ├── reducers.ts              # Reducers para estado de datos y UI
│   │   └── types.ts                 # Tipos e interfaces
│   ├── confirm/confirm.tsx       # Confirm dialog (context-based)
│   └── providers.tsx             # ConfirmProvider wrapper
│
├── lib/
│   ├── db/
│   │   ├── queries.ts            # All Supabase queries + mock fallback + cache
│   │   └── mock-data.ts          # Mock data for development
│   ├── supabase/
│   │   └── client.ts             # Supabase client singleton
│   └── utils.ts                  # formatCurrency, formatDate, commissions, etc.

├── types/
│   └── database.ts               # All TypeScript types

└── context/
    └── confirm-context.tsx       # Confirm dialog context
```

---

## Base de Datos (PostgreSQL)

### ENUMs

```sql
client_status:     prospecto | activa | inactiva | vip
appointment_status: programada | en_curso | completada | cancelada | no_show
payment_type:      ingreso | egreso
payment_category:   servicio | insumo | alquiler | marketing | comisiones | otro
payment_method:    efectivo | tarjeta | transferencia | yape_plin
payment_kind:      reserva | pago_completo | pago_final
```

### Tablas

| Tabla | Propósito |
|-------|-----------|
| `clients` | Clientes del salón |
| `services` | Servicios con precio fijo/variable |
| `categories` | Categorías dinámicas (ícono, color, slug) |
| `staff` | Artistas, comisión %, rol |
| `roles` | Roles dinámicos (Nail Artist, Lashista, Dueña, etc.) |
| `staff_specialties` | Relación N:M staff → categorías |
| `staff_services` | Relación N:M staff → servicios (asignación explícita) |
| `appointments` | Citas agendadas |
| `appointment_services` | Relación N:M citas → servicios (con precios por servicio) |
| `staff_commission_overrides` | Override de comisión (monto fijo para founder) |
| `payments` | Ingresos y egresos |

### Vistas

| Vista | Cálculo |
|-------|---------|
| `appointment_balance` | total_paid, pending_balance, paid_in_full por cita |
| `client_stats` | total_appointments, total_spent, last_visit por clienta |
| `staff_stats` | total_appointments, total_revenue, last_appointment por artista |
| `commission_details` | Comisión por artista + founder_share por appointment_service |

---

## Lógica de Negocio

### Flujo de Citas

```
1. Crear cita
   ├── Seleccionar clienta (obligatorio)
   ├── Seleccionar servicios (1+)
   ├── Asignar artista por servicio (opcional, auto-sugiere)
   ├── Configurar precio por servicio
   ├── Toggle adelanto S/10 (default ON)
   ├── Validar solapamientos con otros artistas
   └── → Crea cita + appointment_services (+ pago S/10 si toggle ON)

2. Avanzar estado
   programada → en_curso → completada
   programada → cancelada
   programada → no_show

3. Al completar
   ├── Calcula pending_balance (total_price - total_paid)
   └── Crea pago automático por saldo pendiente
```

### Selección de Artistas (prioridad)

```
1. staff_services (asignación explícita al servicio)
2. staff_specialties (por categoría del servicio)
3. Todos los artistas activos
```

### Cálculo de Comisiones

```
1. Sin artista asignado → 100% para founder
2. Artista con rol Dueña/Founder → 100% para artista
3. Con override (staff_commission_overrides) → founder recibe monto fijo
4. Sin override → artista recibe su commission_pct %
```

### Pagos Automáticos

- Al crear cita con adelanto: crea pago de tipo `reserva` por S/10
- Al completar cita: crea pago de tipo `pago_final` por `pending_balance`
- Método de pago: configurable por el usuario

---

## Vistas del Calendario

| Modo | Descripción |
|------|-------------|
| Lista | Citas agrupadas por fecha desde hoy |
| Mes | Chips de hora con color de cita, clickeables |
| Semana | Info progresiva por altura (hora → cliente → artista) |
| Hoy | Botón para saltar al día actual |

- Colores asignados por cita (no por artista)
- Citas pasadas/canceladas/no_show: gris + opacidad reducida
- Scroll horizontal en mobile (semana)
- Slots de 15 minutos

---

## PWA / Mobile

- `manifest.json` con íconos y splash screen
- `appleWebApp` meta tags (capable, statusBarStyle)
- Viewport: `user-scalable: false` (evita zoom en iOS)
- Font-size ≥ 16px en inputs (iOS auto-zoom prevention)
- MobileNav fijo abajo con 5 iconos principales
- Sidebar colapsable en desktop

---

## Data Layer

### Mock System

- `USE_MOCK` flag basado en env vars
- Mock data completa en `mock-data.ts`
- Fallback automático si no hay Supabase configurado

### Patrón de Queries

- Cada función tiene mock + real implementation
- Mock usa `delay(300ms)` para simular latencia
- Real usa `supabase.from(...)` con joins via `select(*, relation:table(*))`

---

## UI/UX Patrones

- Cards clickeables (sin botones editar/eliminar en cards)
- Edición vía modal con detección de cambios
- Botón eliminar dentro del modal
- Moneda: `S/` como texto (no ícono), posicionamiento absoluto en inputs
- Botones con `whitespace-nowrap` global
- Skeleton loading en todas las páginas
- Colores de estado: azul (programada), ámbar (en_curso), verde (completada), rojo (cancelada), naranja (no_show)

---

## Migraciones SQL

Las migraciones están en `supabase/migrations/` y se aplican en orden:

1. `001_categories_dinamicas_parte1.sql`
2. `002_categories_dinamicas_parte2.sql`
3. `002_add_staff_birthday.sql`
4. `003_insert_default_founder.sql`
5. `HU-23-roles-dinamicos.sql`
6. `HU-24-comisiones-dinamicas.sql`
7. `HU-25-servicios-mejoras.sql`
8. `HU-26-poblar-servicios-reales.sql`
9. `HU-27-fix-appointment-services.sql`
10. `HU-28-rls-appointment-services.sql`
11. `HU-29-rls-appointment-services-v2.sql`

---

## Estructura del Proyecto (Archivos Clave)

```
/CRM Studio/
├── app/                                  # Next.js app
│   ├── src/
│   │   ├── app/                          # Pages (Server/Client pattern)
│   │   ├── components/                   # React components
│   │   │   ├── layout/                   # shell.tsx (Sidebar + MobileNav)
│   │   │   ├── ui/                       # Primitives (14 files)
│   │   │   ├── citas/                    # 12 files (refactorizados)
│   │   │   ├── confirm/                  # ConfirmDialog
│   │   │   └── providers.tsx              # ConfirmProvider
│   │   ├── lib/db/queries.ts             # Supabase queries + mock + cache
│   │   ├── lib/db/mock-data.ts           # Mock data
│   │   ├── lib/utils.ts                  # Utilities
│   │   ├── lib/supabase/client.ts        # Supabase client
│   │   ├── types/database.ts             # TypeScript types
│   │   └── context/confirm-context.tsx    # Confirm dialog context
│   └── public/manifest.json              # PWA manifest
├── supabase/
│   ├── schema.sql                         # Full schema
│   └── migrations/                        # 11 SQL migrations
├── scripts/                               # DB scripts (clean, seed, test, check)
├── docs/
│   ├── system-design.md                   # This file
│   ├── status.md                           # Project status
│   ├── specs/                             # HUs organizadas por módulo
│   └── reference/                         # Documentos de referencia
├── AGENTS.md                              # Contexto del proyecto (AI)
└── status.md                              # Project status
```
