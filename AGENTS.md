# Contexto: CRM Studio de Belleza

## Índice
1. [Descripción del Negocio](#descripción-del-negocio)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Módulos Funcionales](#módulos-funcionales)
6. [Patrones UI/UX](#patrones-uiux)
7. [Variables de Entorno](#variables-de-entorno)
8. [Comandos](#comandos)
9. [Migraciones SQL](#migraciones-sql)
10. [Reglas de Desarrollo](#reglas-de-desarrollo)
11. [Decisiones Técnicas](#decisiones-técnicas)
12. [Especificaciones HU](#especificaciones-hu)
13. [Issues Conocidos](#issues-conocidos)
14. [Última Actualización](#última-actualización)

---

## Descripción del Negocio

### Tipo de Negocio
**Studio de Belleza** - Especializado en uñas, pestañas, cejas, pedicura y maquillaje.

### Founder Predeterminada
**Araceli Zevallos** - Es la dueña/fundadora del salón y está protegida en el sistema (no se puede eliminar).

### Moneda
**Soles Peruanos (S/)** - Todo el sistema usa soles peruanos como moneda predeterminada.

### Categorías de Servicios
| Categoría | Icono | Descripción |
|-----------|-------|-------------|
| `sistema_unas` | 💅 | Sistema de uñas, manicure |
| `pedicura` | 🦶 | Pedicura profesional |
| `makeup` | 💄 | Maquillaje profesional |
| `pestanas` | 👁️ | Extensiones de pestañas |
| `cejas` | ✨ | Diseño y tratamiento de cejas |

---

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 16.2.6 (App Router)
- **Lenguaje**: TypeScript 5.7.0
- **UI**: React 19.0.0
- **CSS**: Tailwind CSS 4.3.0
- **Componentes**: Componentes UI custom (no shadcn/ui)
- **Icons**: Lucide React 0.469.0
- **Date Handling**: date-fns 4.1.0
- **Date Picker**: react-day-picker 9.5.0
- **Toasts**: Sonner 1.7.0

### Backend/BD
- **Base de Datos**: PostgreSQL (Supabase)
- **Cliente**: @supabase/supabase-js 2.47.0

### Dev Server
- **Default Port**: 3000
- **Turbopack**: Usado por defecto en Next.js 16 (`npm run dev`)
- **Webpack**: Disponible via `npm run dev:webpack` si se necesita

---

## Arquitectura del Proyecto

### Estructura de Directorios
```
CRM Studio/
├── AGENTS.md                            # Este archivo — contexto del proyecto (AI)
├── app/                                 # Next.js App (PWA)
│   ├── src/
│   │   ├── app/                         # App Router pages (Server/Client pattern)
│   │   │   ├── page.tsx                 # Dashboard (Server)
│   │   │   ├── page-client.tsx          # Dashboard (Client)
│   │   │   ├── loading.tsx              # Skeleton loading
│   │   │   ├── citas/
│   │   │   │   ├── page.tsx             # Citas (Server)
│   │   │   │   ├── page-client.tsx      # Citas (Client)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── clientes/
│   │   │   │   ├── page.tsx             # Lista (Server)
│   │   │   │   ├── page-client.tsx      # Lista (Client)
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx         # Detalle (Server)
│   │   │   │   │   └── page-client.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── pagos/
│   │   │   │   ├── page.tsx             # Pagos (Server)
│   │   │   │   ├── page-client.tsx      # Pagos (Client)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── reportes/comisiones/
│   │   │   │   ├── page.tsx             # Comisiones (Server)
│   │   │   │   ├── page-client.tsx      # Comisiones (Client)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── servicios/
│   │   │   │   ├── page.tsx             # Servicios (Server)
│   │   │   │   ├── page-client.tsx      # Servicios (Client)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── loading.tsx
│   │   │   └── staff/
│   │   │       ├── page.tsx             # Staff (Server)
│   │   │       ├── page-client.tsx      # Staff (Client)
│   │   │       ├── layout.tsx
│   │   │       └── loading.tsx
│   │   ├── components/
│   │   │   ├── layout/shell.tsx         # Sidebar + MobileNav + Header
│   │   │   ├── ui/                      # Primitives (button, input, modal, etc.)
│   │   │   ├── dashboard/               # Componentes del Dashboard (refactorizados)
│   │   │   │   ├── DashboardStatCard.tsx
│   │   │   │   ├── DashboardSkeleton.tsx
│   │   │   │   ├── IncomeSparkline.tsx
│   │   │   │   ├── MonthlyReport.tsx
│   │   │   │   ├── PendingPaymentsWidget.tsx
│   │   │   │   ├── QuickActions.tsx
│   │   │   │   ├── ReactivationWidget.tsx
│   │   │   │   ├── RecentActivity.tsx
│   │   │   │   ├── StaffOccupancy.tsx
│   │   │   │   ├── TodayAppointments.tsx
│   │   │   │   ├── UpcomingBirthdays.tsx
│   │   │   │   ├── WelcomeBanner.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── useCountUp.ts
│   │   │   ├── citas/                    # Componentes de Citas (refactorizados)
│   │   │   │   ├── AppointmentCard.tsx
│   │   │   │   ├── AppointmentDetail.tsx
│   │   │   │   ├── AppointmentFormModal.tsx
│   │   │   │   ├── AppointmentTicket.tsx
│   │   │   │   ├── CalendarView.tsx       # Orquestador (~80 lns)
│   │   │   │   ├── MonthView.tsx          # Subvista mes (~80 lns)
│   │   │   │   ├── WeekView.tsx           # Subvista semana (~140 lns)
│   │   │   │   ├── DayView.tsx            # Subvista día (~120 lns)
│   │   │   │   ├── calendar-utils.ts      # Helpers color/hora
│   │   │   │   ├── CitasToolbar.tsx
│   │   │   │   ├── ClientCombobox.tsx
│   │   │   │   ├── DetailPopover.tsx
│   │   │   │   ├── ServiceConfigModal.tsx
│   │   │   │   ├── ServiceSelectorModal.tsx
│   │   │   │   ├── helpers.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   ├── reducers.ts
│   │   │   │   └── types.ts
│   │   │   ├── servicios/               # Componentes de Servicios (refactorizados)
│   │   │   │   ├── types.ts             # ServiceForm, props interfaces
│   │   │   │   ├── ServiceCard.tsx       # Card con badge staff, hover shadow
│   │   │   │   ├── ServiceFilters.tsx    # Búsqueda + filtro categoría (memo)
│   │   │   │   ├── ServiceListContent.tsx # Orquestador con skeleton/empty/fadeIn
│   │   │   │   ├── ServicioStaffTab.tsx  # Checkbox list staff + badge sugerido
│   │   │   │   └── ServicioFormModal.tsx # Modal 2 tabs (Datos + Staff)
│   │   │   ├── clientes/               # Componentes de Clientes (refactorizados)
│   │   │   │   ├── types.ts            # Tipos: ClientWithStats, discriminated unions
│   │   │   │   ├── constants.ts        # Status labels, border colors, form init
│   │   │   │   ├── ClientCard.tsx      # Card con avatar degradado, border status, stats (memo)
│   │   │   │   ├── ClientFilters.tsx   # Búsqueda + filtro estado (memo)
│   │   │   │   ├── ClientFormModal.tsx # Modal crear/editar reutilizable (cambio detectado)
│   │   │   │   ├── ClientDetailModal.tsx # Modal view-only con perfil, contacto, stats, últ. cita
│   │   │   │   ├── ClientListContent.tsx # Orquestador: skeleton con avatar, empty, grouped, paginación
│   │   │   │   ├── ClientDetailProfile.tsx # Cabecera detalle: avatar, nombre, contacto
│   │   │   │   ├── ClientDetailStats.tsx   # Grid 3 stats con iconos
│   │   │   │   └── ClientAppointmentHistory.tsx # Tabla historial con badges servicios
│   │   │   ├── confirm/                 # ConfirmDialog
│   │   │   └── providers.tsx            # ConfirmProvider
│   │   ├── lib/
│   │   │   ├── constants.ts             # DEPOSIT_AMOUNT = 20
│   │   │   ├── db/queries.ts            # Supabase queries + cache
│   │   │   ├── supabase/client.ts       # Supabase client
│   │   │   └── utils.ts                # formatCurrency, formatDate, comisiones, etc.
│   │   ├── types/database.ts            # TypeScript types
│   │   └── context/confirm-context.tsx
│   └── public/                          # PWA manifest
├── supabase/
│   ├── schema.sql                       # Esquema completo BD
│   └── migrations/                      # Migraciones SQL
├── scripts/                             # DB scripts (clean, seed, test, check)
├── docs/
│   ├── system-design.md                 # Arquitectura del sistema
│   ├── status.md                        # Estado del proyecto
│   ├── specs/                           # HUs organizadas por módulo
│   │   ├── 01-clientes/                # HU-01 a HU-05
│   │   ├── 02-servicios/                # HU-06 a HU-08, HU-25
│   │   ├── 03-citas/                   # HU-09 a HU-13
│   │   ├── 04-staff/                   # HU-14, HU-15, HU-23
│   │   ├── 05-pagos/                   # HU-16 a HU-20
│   │   ├── 06-dashboard/               # HU-21, HU-22
│   │   └── README.md                   # Índice de HUs
│   └── reference/                      # Documentos de referencia
└── AGENTS.md                            # Este archivo
```

### Rutas Principales
| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard (incluye reporte mensual, sparkline, ocupación staff, actividad reciente) |
| `/citas` | Panel de gestión de citas |
| `/citas/[id]` | Detalle de cita (full-page con schedule, servicios, comisiones, balance, acciones) |
| `/clientes` | Lista de clientas (con paginación) |
| `/clientes/[id]` | Detalle de clienta + historial |
| `/pagos` | Hub con 4 tabs: Registrar, Pendientes, Resumen, Comisiones |
| `/servicios` | Gestión de servicios y categorías |
| `/staff` | Gestión de artistas/staff |
| `/staff/[id]` | Rendimiento del artista |

---

## Base de Datos

### Tipos ENUM
```sql
-- Estado de Clienta
client_status: ['prospecto', 'activa', 'inactiva', 'vip']

-- Estado de Cita
appointment_status: ['programada', 'en_curso', 'completada', 'cancelada', 'no_show']

-- Categoría de Servicio
service_category: ['sistema_unas', 'pedicura', 'makeup', 'pestanas', 'cejas']

-- Tipo de Pago
payment_type: ['ingreso', 'egreso']

-- Categoría de Pago
payment_category: ['servicio', 'insumo', 'alquiler', 'marketing', 'comisiones', 'otro']

-- Método de Pago
payment_method: ['efectivo', 'tarjeta', 'transferencia', 'yape_plin']

-- Tipo de Pago (para citas)
payment_kind: ['reserva', 'pago_completo', 'pago_final']
```

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `roles` | Roles de staff (Nail Artist, Lashista, Dueña, etc.) |
| `clients` | Clientas del salón |
| `services` | Servicios ofrecidos |
| `staff` | Artistas/empleados |
| `appointments` | Citas agendadas |
| `appointment_services` | Relación N:M citas-servicios |
| `staff_services` | Relación N:M staff-servicios (opcional) |
| `staff_commission_overrides` | Excepciones de comisiones (monto fijo) |
| `payments` | Ingresos y egresos |
| `categories` | Categorías de servicios (dinámicas) |

### Vistas
| Vista | Descripción |
|-------|-------------|
| `appointment_balance` | Balance de pagos por cita (total_paid, pending_balance) |
| `client_stats` | Estadísticas por clienta |
| `staff_stats` | Estadísticas por artista |
| `commission_details` | Detalle de comisiones calculadas |

### Cache System (queries.ts)
- **TTL**: Valores por defecto 10-60s según query
- **Stale-while-revalidate**: Cache devuelve dato stale dentro de 3x TTL mientras refresca en background
- **Deduplication**: Queries duplicadas en vuelo comparten la misma Promise
- **Refresh callbacks**: `onCacheRefresh(key, cb)` para notificar cuando cambia el cache
- **Auto-clear**: `clearQueryCache(prefix?)` tras mutations

### Dashboard Queries
| Query | TTL | Descripción |
|-------|-----|-------------|
| `getDashboardMetrics()` | 30s | Métricas principales, citas hoy, tendencias, ocupación staff, actividad reciente |
| `getMonthlyReport(year, month)` | 30s | Reporte mensual: completadas, ingresos, gastos, top servicios/artistas |
| `getTopServices()` | 30s | Top servicios por count en rango |
| `getTopArtistsByRevenue()` | 30s | Top artistas por revenue en rango |
| `getInactiveClients()` | 30s | Clientes activas sin visitas >60 días |

### Triggers
- `update_updated_at()`: Actualiza automáticamente el campo `updated_at` en todas las tablas

---

## Módulos Funcionales

### 1. Dashboard (`/`) — Refactorizado
- **Componentes extraídos**: 13 componentes en `components/dashboard/` (antes todo inline en `page-client.tsx`)
- **Métricas principales**: Ingresos, gastos, ganancia neta, clientas activas (con tendencias vs semana anterior)
- **Citas de hoy**: Con indicador de capacidad visual y estado activo/inactivo
- **Sparkline SVG**: Mini gráfico de tendencia semanal de ingresos (sin librerías externas)
- **Ocupación del staff**: Barras de capacidad por artista programado hoy
- **Actividad reciente**: Timeline de últimas 4 acciones (citas creadas, pagos registrados)
- **Acciones rápidas**: Atajos a Nueva cita, Nueva clienta, Registrar pago
- **Cumpleaños**: Próximos cumpleaños del staff
- **Pagos pendientes**: Citas completadas con saldo > 0
- **Reactivación**: Clientas inactivas por contactar
- **Reporte mensual**: Visible por defecto, expandible con top servicios y top artistas
- **Auto-refresh**: Cada 60s con stale-while-revalidate, pausa al ocultar pestaña
- **Cache**: 30s TTL + 90s stale window con refresco en background
- **Server/Client pre-fetch**: `getDashboardMetrics` + `getMonthlyReport` se ejecutan en paralelo desde el Server Component

### 2. Citas (`/citas`)
#### Funcionalidades
- **Vista Lista**: Citas agrupadas por fecha
- **Vista Calendario**: Mes, Semana, Día
- **Crear Cita**:
  - Seleccionar clienta
  - Seleccionar servicios (modal con búsqueda y filtros)
  - Configurar artista por servicio
  - Configurar precio por servicio
  - Toggle para adelanto de S/10 (por defecto activado)
  - Detección de solapamientos
- **Editar Cita**:
  - Modificar datos
  - Cambiar servicios
- **Estados de Cita**:
  - `programada` → `en_curso` → `completada`
  - `cancelada` (cancelación manual)
  - `no_show` (marcar como no asistió)
- **Avance de Estados**: Botones para avanzar estado
- **Pagos Automáticos**:
  - Al crear cita con adelanto: Crea pago de S/10
  - Al completar cita: Crea pago por diferencia (pending_balance)

#### Detalle de Cita (`/citas/[id]`) — Nueva
- **Componentes**: 7 componentes en `components/citas/` + `page.tsx` + `page-client.tsx`
- **Vista full-page**: Profile con avatar clienta clickeable, badge estado, teléfono/Instagram, monto total
- **Schedule**: Fecha formateada, rango horario + duración, indicador en vivo (atrasada/en Xh/mañana)
- **Stepper**: Barra visual 3 pasos (Programada → En curso → Completada) con checkmarks
- **Servicios**: Lista con icono categoría, nombre, artista clickeable (navega a staff/[id]), precio
- **Comisiones**: Desglose artista + founder (solo si hay datos)
- **Balance**: Grid Total/Pagado/Saldo con badge adelanto S/20
- **Acciones**: Según estado (Iniciar/Completar/Editar/Cancelar/No Show)
- **Navegación**: Enlace a `clientes/[id]` desde avatar/nombre, enlace a `staff/[id]` desde artista, "Ver detalle completo" desde AppointmentTicket modal

#### Componente Clave: CalendarView
- Modos: Mes, Semana, Día, Hoy
- Drag & Drop para mover citas
- Línea de tiempo actual (roja)
- Colores por artista o color personalizado

### 3. Clientes (`/clientes`) — Refactorizado
- **Componentes extraídos**: 10 archivos en `components/clientes/` (antes todo inline en `page-client.tsx` y `[id]/page-client.tsx`)
- **Lista**: Filtro por estado (Todos/Prospecto/Activa/Inactiva/VIP), buscador (nombre/teléfono/instagram), vista "Todos" agrupada por estado, paginación "Ver más"
- **Detalle de Clienta**: Componentes separados para perfil, estadísticas e historial
- **Crear/Editar**: Modal unificado (`ClientFormModal`) con detección de cambios, teléfono con prefijo Perú
- **Estados**: `prospecto` (blue, nueva), `activa` (emerald, citas recientes), `inactiva` (zinc, sin visitas), `vip` (amber, especial)
- **Performance**: React.memo en ClientCard/ClientFilters, useMemo en filtered/grouped, useCallback en handlers
- **Accesibilidad**: ARIA labels en avatar y cards, aria-live en resultados, role/teclado en cards

### 4. Servicios (`/servicios`) — Refactorizado
- **Componentes extraídos**: 6 archivos en `components/servicios/` (antes todo inline en `page-client.tsx`)
- **Precio Fijo/Variable**: Select tipo + Input con `leftPrefix` para "S/" (unificado responsive)
- **Staff por servicio**: Checkbox list con badge de especialidad y "sugerido", auto-selección por categoría
- **Filtros**: Búsqueda + Select categoría, `React.memo`
- **Performance**: React.memo en ServiceCard/ServiceFilters, useMemo en filtered/grouped/filterOptions, useCallback en handlers
- **Accesibilidad**: ARIA labels en cards/search/delete, role=alert en errores y warnings, aria-hidden en iconos
- **UI/UX**: Skeleton anidado por grupos, empty state con CTA, fadeIn en cambio de filtros, sort alfabético

### 5. Staff (`/staff`) — Refactorizado
- **Componentes extraídos**: 11 archivos en `components/staff/` (page-client.tsx 1079→308 lns, [id]/page-client.tsx 430→179 lns)
- **Tipado fuerte**: interfaces `StaffWithDetails`, `StaffFormState`, `StaffPerformance`, `StaffTopService`, `StaffCardProps` — eliminación total de `any`
- **UI/UX**: Cards con avatar degradado rose→purple, `border-t-4` del color del role, Founder con anillo amber, fadeIn en grid, skeleton coincidente con cards reales, empty state con CTA "Registrar primer miembro"
- **Performance**: React.memo en StaffCard/StaffFilters, useMemo en filtered, useCallback en handlers del modal
- **Accesibilidad**: ARIA labels en avatar y cards, `role="button"`, `tabIndex`, `onKeyDown`, `aria-live` en resultados, `aria-label` en periodo filter, `role="progressbar"` en distribución
- **Responsividad**: `sm:grid-cols-2 lg:grid-cols-3` en lista, `grid-cols-2 lg:grid-cols-4` en stats, tabs modo scroll horizontal en móvil, detail con sidebar layout en desktop
- **Componentes**:
  - `StaffCard.tsx` — Card con border-t role-color, gradient avatar, role badge dinámico, especialidades, stats, commission%, founder ring
  - `StaffFilters.tsx` — Búsqueda por nombre/rol/teléfono (memo)
  - `StaffListContent.tsx` — Orquestador: skeleton, empty state, grid (memo)
  - `StaffFormModal.tsx` — Modal 3 tabs (Datos, Especialidades, Comisiones) con detección de cambios
  - `StaffComisionesTab.tsx` — Tab de comisiones con override por servicio, calculadora en vivo
  - `StaffDetailProfile.tsx` — Cabecera detalle: avatar, role badges, stats, botones Editar/Comisiones
  - `StaffDetailStats.tsx` — Grid 4 stats con iconos (citas, revenue, comisión, última cita)
  - `StaffDetailTopServices.tsx` — Lista top servicios rankeada
  - `StaffDetailDistribution.tsx` — Barra progreso distribución artista vs founder
  - `StaffDetailQuickInfo.tsx` — Resumen rápido (comisión, especialidades, rol, horario)
  - `StaffAppointmentHistory.tsx` — Tabla historial citas con badges de estado

### 6. Pagos (`/pagos`) — Refactorizado
- **Componentes extraídos**: 7 archivos en `components/pagos/` (page-client.tsx 409→87 lns)
- **Tipado fuerte**: `PaymentWithRelations`, interfaces dedicadas, eliminación total de `any`
- **Componentes**:
  - `PaymentCard.tsx` — Card con `border-l-4` (verde ingreso / rojo egreso), icono tipo, badges kind/method, Link2 vinculado, React.memo
  - `PaymentFilters.tsx` — Búsqueda + filtro Todos/Ingresos/Egresos, React.memo, role="radiogroup"
  - `PagosSummaryCards.tsx` — Grid 3 stat cards (ingresos, egresos, ganancia neta)
  - `PagosTabs.tsx` — Barra 4 tabs con ARIA role="tablist", React.memo
  - `PaymentFormModal.tsx` — Modal crear pago extraído, patrón botones consistente con border-t, disabled en submit inválido
  - `PaymentDetailModal.tsx` — Modal detalle con cliente vinculado + cita vinculada + servicios, tipado fuerte
- **Tabs mejorados**: `_tabs/pendientes-tab.tsx`, `resumen-tab.tsx`, `comisiones-tab.tsx` — tipados sin `any`, React.memo, aria-live, role="progressbar"

---

## Patrones UI/UX

### Consistencia
Todos los módulos siguen los mismos patrones:
- **Cards clickeables**: No hay botones editar/eliminar en las cards
- **Edición por Modal**: Toda edición es mediante modal
- **Botón Eliminar**: Dentro del modal de edición
- **Detección de Cambios**: Botón "Actualizar" deshabilitado sin modificaciones
- **Header**: Título opcional (evita duplicados)

### Responsividad
- **iPhone**: Móvil
- **iPad Air M4 11"**: Tablet
- **PC**: Desktop

### iOS
- **Sin zoom automático** en inputs
- **Font-size ≥ 16px** en todos los inputs
- **Comportamiento tipo app nativa**

### Moneda
- **Símbolo**: "S/" como texto (no ícono DollarSign)
- **Formato**: `S/ 99.99`

---

## Variables de Entorno

### Requeridas
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Ubicación
- Archivo: `app/.env.local`

---

## Comandos

```bash
# Desarrollo (Turbopack por defecto en Next.js 16)
npm run dev

# Desarrollo con Webpack (si Turbopack causa problemas)
npm run dev:webpack

# Build
npm run build

# Lint
npm run lint

# Start (producción)
npm run start
```

> **Nota**: En Next.js 16, `npm run dev` usa Turbopack por defecto. Si hay problemas, usa `npm run dev:webpack` para forzar Webpack. No usar `--no-turbopack` (flag no válido).

---

## Migraciones SQL

### Orden de Ejecución
1. `001_categories_dinamicas_parte1.sql`
2. `002_categories_dinamicas_parte2.sql`
3. `002_add_staff_birthday.sql`
4. `003_insert_default_founder.sql`
5. `HU-23-roles-dinamicos.sql`
6. `HU-24-comisiones-dinamicas.sql`
7. `HU-25-servicios-mejoras.sql`
8. `HU-27-fix-appointment-services.sql` (✅ Aplicada)
9. `HU-28-rls-appointment-services.sql` (✅ Aplicada)
10. `HU-29-rls-appointment-services-v2.sql` (versión mejorada con DROP IF EXISTS)

### Migraciones Pendientes
| Migración | Descripción |
|------------|-------------|
| **Ninguna actualmente** | Todas las migraciones principales aplicadas |

### Migraciones Aplicadas Recientemente
| Migración | Descripción |
|------------|-------------|
| `HU-26-poblar-servicios-reales.sql` | Poblar servicios con datos reales del estudio |
| `HU-27-fix-appointment-services.sql` | Agregar columna `service_price` a `appointment_services` |
| `HU-28-rls-appointment-services.sql` | Políticas RLS para `appointment_services` (SELECT/INSERT/UPDATE/DELETE) |
| `HU-29-rls-appointment-services-v2.sql` | Versión mejorada (DROP IF EXISTS para evitar conflictos) |

### Scripts Útiles
| Script | Ubicación | Descripción |
|--------|-----------|-------------|
| `clean-db.sql` | `scripts/` | Limpiar TODOS los datos de la BD |
| `clean-db.mjs` | `scripts/` | Limpiar BD via Supabase JS |
| `clean-appointments.sql` | `scripts/` | Limpiar solo citas |
| `clean-appointments-v2.sql` | `scripts/` | Limpiar citas + relaciones |
| `insert-citas-real.sql` | `scripts/` | Poblar citas con datos reales |
| `check-db-state.mjs` | `scripts/` | Verificar estado de la BD |
| `check-structure.mjs` | `scripts/` | Verificar estructura de tablas |
| `test-supabase.mjs` | `scripts/` | Test de conexión Supabase |
| `HU-26-poblar-servicios-reales.sql` | `supabase/migrations/` | Poblar servicios reales |

---

## Reglas de Desarrollo

### Patrones Obligatorios
- **Server/Client Components**: `page.tsx` (Server) para data fetching + metadata, `page-client.tsx` (Client) para interactividad
- **Moneda**: Usar "S/" como texto con posicionamiento absoluto, NUNCA ícono DollarSign
- **Inputs iOS**: Font-size ≥ 16px para evitar zoom automático
- **Cards**: Clickeables, sin botones editar/eliminar visibles
- **Modales**: Toda edición vía modal, botón eliminar dentro del modal
- **Detección de cambios**: Botón "Actualizar" deshabilitado si no hay cambios
- **Componentes custom**: NO usar shadcn/ui, los componentes UI son propios

### Prohibido
- ❌ Usar shadcn/ui (componentes son custom)
- ❌ Usar ícono DollarSign para moneda (usar texto "S/")
- ❌ Font-size < 16px en inputs (causa zoom en iOS)
- ❌ Botones editar/eliminar fuera de modales
- ❌ Eliminar a Araceli Zevallos (founder protegida)
- ❌ Usar flag `--no-turbopack` (no válido en Next.js 16)
- ❌ Crear `package.json` en el root del monorepo (causa loop infinito en Turbopack)

---

## Decisiones Técnicas Clave

### Patrón Server/Client Components
- **page.tsx** (Server): Fetch de datos con Supabase, metadata, pasa datos iniciales al Client
- **page-client.tsx** (Client): Interactividad, estado, usa datos iniciales del Server
- **layout.tsx**: Metadata de la ruta
- **loading.tsx**: Skeleton loading automático por Next.js
- Todas las páginas siguen este patrón consistentemente

### Patrón de Precio
- **No usar `leftPrefix`** de componentes
- **Usar posicionamiento absoluto** para "S/"
- **Consistente** en todo el sistema

### Selección de Artistas
- **Prioridad**: `staff_services` (explícito) > `staff_specialties` (por categoría)
- **Auto-selección**: Si solo hay 1 artista sugerido
- **Badge "✨"**: Para artistas sugeridos

### Adelanto (Depósito)
- **Monto**: S/20 (constante `DEPOSIT_AMOUNT` en `constants.ts`)
- **Por defecto activado**: S/20 de reserva al crear cita
- **Pago automático**: Al completar cita se crea pago por diferencia (pending_balance)

### Borde de Estado en Cards
- **`border-l-4`** en `AppointmentCard` con color según status:
  - `programada` → `border-l-salon-400`
  - `en_curso` → `border-l-amber-400`
  - `completada` → `border-l-emerald-400`
  - `cancelada` → `border-l-red-300`
  - `no_show` → `border-l-zinc-300`

### Stepper de Progreso
- En `AppointmentTicket`, barra visual: `① Programada → ② En curso → ③ Completada`
- Paso completado: verde con checkmark
- Paso actual: rosa (salon)
- Paso futuro: gris claro

### Transición entre Vistas
- Al cambiar Mes/Semana/Día en calendario: animación `fadeIn` 200ms
- `key={ui.view}` fuerza re-montaje con animación
- `prefers-reduced-motion: reduce` respeta preferencia del usuario (global en `globals.css`)

### Hover "Crear aquí" en Calendario
- En slots vacíos de WeekView/DayView, al hover aparece "+ Crear aquí"
- Patrón `group-hover:opacity-100` sobre `absolute inset-0`

### RLS (Row Level Security)
- **Estado**: ✅ Resuelto
- **Problema anterior**: Tabla `appointment_services` tenía RLS habilitado pero sin políticas → Error 401 Unauthorized
- **Solución aplicada**: Migraciones `HU-28` y `HU-29` con políticas para SELECT/INSERT/UPDATE/DELETE usando `USING (true)` (tabla de relación N:M que necesita ser accesible)

### Turbopack en Next.js 16
- **Estado**: ✅ Funcionando
- **Problema anterior**: Monorepo con dos `package-lock.json` causaba que Turbopack spawneara cientos de procesos
- **Solución aplicada**: Eliminar `package.json` y `package-lock.json` del root, solo mantener `/app/package.json`

---

## Especificaciones HU (Historias de Usuario)

### Ubicación
- Directorio: `docs/specs/`

### Todas las HUs Implementadas ✓

| HU | Descripción | Estado |
|-----|-------------|--------|
| HU-01 | Registrar clienta | ✅ |
| HU-02 | Buscar clientas | ✅ |
| HU-03 | Estado clienta | ✅ |
| HU-04 | Historial clienta | ✅ |
| HU-05 | Reactivar clientas | ✅ |
| HU-06 | Gestion servicios | ✅ |
| HU-07 | Catalogo categoria | ✅ |
| HU-08 | Actualizar precios | ✅ |
| HU-09 | Agendar cita | ✅ |
| HU-10 | Ver agenda | ✅ |
| HU-11 | Estado cita | ✅ |
| HU-12 | Solapamientos | ✅ |
| HU-13 | Resumen cita | ✅ |
| HU-14 | Registrar staff | ✅ |
| HU-15 | Rendimiento artista (`/staff/[id]`) | ✅ |
| HU-16 | Calcular comisiones | ✅ |
| HU-17 | Registrar pagos | ✅ |
| HU-18 | Registrar egresos | ✅ |
| HU-19 | Resumen financiero (tab en Pagos) | ✅ |
| HU-20 | Pagos pendientes (tab en Pagos) | ✅ |
| HU-21 | Dashboard | ✅ |
| HU-22 | Reporte mensual (sección en Dashboard) | ✅ |
| HU-23 | Roles dinamicos | ✅ |
| HU-24 | Comisiones dinamicas | ✅ |
| HU-25 | Panel servicios mejoras | ✅ |

### Próximas Sesiones (no son HU)
- Tests unitarios y E2E
- Autenticación/Login (Supabase Auth)

---

## Issues Conocidos

**✅ Ninguno actualmente - Issues anteriores resueltos:**

| Issue Anterior | Estado | Solución |
|----------------|--------|----------|
| RLS en `appointment_services` (Error 401) | ✅ Fixeado | Migración HU-28/HU-29 |
| Columna `service_price` faltante | ✅ Fixeado | Migración HU-27 |
| Servicios no cargan al editar cita | ✅ Fixeado | Solución de RLS |
| params síncronos en Next.js 15+ | ✅ Fixeado | Refactor a `await params` + validación UUID |
| Turbopack loop infinito (2 package-lock.json) | ✅ Fixeado | Eliminar package.json del root |
| `--no-turbopack` flag no válido | ✅ Fixeado | Cambiar a `next dev` (turbopack por defecto) o `--webpack` |
| Dashboard 564 líneas en un archivo | ✅ Fixeado | Extraído a 13 componentes en `components/dashboard/` |
| Tipado `any` en dashboard | ✅ Fixeado | Interfaces dedicadas en `components/dashboard/types.ts` |
| Sin tendencias vs semana anterior | ✅ Fixeado | Week-over-week en StatCards + sparkline SVG |
| Sin visualización de datos | ✅ Fixeado | Sparkline + barras de ocupación + capacidad visual |
| Sin auto-refresh | ✅ Fixeado | 60s auto-refresh con stale-while-revalidate |
| Monthly report no pre-fetcheado | ✅ Fixeado | `getMonthlyReport` desde Server Component |
| Componentes inline duplicados | ✅ Fixeado | `StatCard`, `TodayAppointments`, `UpcomingBirthdays` extraídos |
| CalendarView 672 líneas | ✅ Fixeado | Split en 4 archivos (MonthView, WeekView, DayView, calendar-utils) |
| Tipado `any` en citas | ✅ Fixeado | Tipos AppointmentWithDetails, CalendarAppointment, eliminación total de any |
| Sin DayView en toolbar | ✅ Fixeado | Agregado botón "Día" en toolbar del calendario |
| Accesibilidad en citas | ✅ Fixeado | ARIA roles, focus-visible, aria-labels, reduced-motion |
| Sin skeleton/empty states calendario | ✅ Fixeado | Skeleton loading + empty state con CTA |
| Sin React.memo en componentes citas | ✅ Fixeado | memo en Card, Form, Selector, Config, CalendarView |
| Columna hora desalineada en calendario | ✅ Fixeado | grid-cols-[56px_repeat(7,1fr)] fijo |
| Hardcodeo depósito | ✅ Fixeado | Usa constante DEPOSIT_AMOUNT = 20 |
| Servicios 939 líneas en page-client.tsx | ✅ Fixeado | Extraído a 6 componentes en `components/servicios/` |
| Precios con raw inputs | ✅ Fixeado | PriceSection usa `<Input leftPrefix>` en vez de raw `<input>` |
| Sin error state en load | ✅ Fixeado | Banner rojo con role="alert" cuando falla la carga |
| Sin sort en servicios | ✅ Fixeado | Sort alfabético con localeCompare |
| Clientas 588+268 líneas en page-client.tsx | ✅ Fixeado | Extraído a 10 componentes en `components/clientes/` (856→407 lns total) |
| Tipado `any` en clientes | ✅ Fixeado | Discriminated union en reducer, props tipadas, sin any |
| Dos modales edit separados con campos inconsistentes | ✅ Fixeado | ClientFormModal unificado con detección de cambios |
| Edit modal detail page sin campo status | ✅ Fixeado | ClientFormModal incluye todos los campos consistentemente |
| Sin avatar degradado ni border status | ✅ Fixeado | Avatar rose→purple gradient, border-l-4 por estado |
| Sin "Ver detalle completo" en modal de lista | ✅ Fixeado | Botón navega a `/clientes/[id]` |
| Instagram no clickeable (modal y perfil) | ✅ Fixeado | Convertido a `<a target="_blank">` |
| Empty state sin CTA | ✅ Fixeado | Botón "Registrar primera clienta" sin filtros activos |
| "Ver más" afecta todos los grupos | ✅ Fixeado | Vista agrupada muestra todos los items sin paginación |
| Sin error banner inline en fallo de carga | ✅ Fixeado | Banner `role="alert"` con botón descartar |
| Sin auto-refresh periódico | ✅ Fixeado | Intervalo 60s con cleanup |
| Skeleton muerto en ClientDetailModal | ✅ Fixeado | Eliminado junto con prop dead |
| `as any[]` en appointments (type leak) | ✅ Fixeado | Cambiado a `as Appointment[]` |
| "Editando" como título incompleto | ✅ Fixeado | Cambiado a `"Editando: {nombre}"` |

---

## Última Actualización
- **Fecha**: 14 Mayo 2026
- **Rama**: `main`
- **Cambios recientes**: Refactor completo del módulo Staff. Extraídos 12 componentes a `components/staff/` (page-client.tsx 1079→308 lns, [id]/page-client.tsx 430→179 lns). Tipado fuerte eliminando `any` mediante interfaces dedicadas (StaffWithDetails, StaffFormState, StaffPerformance, StaffTopService). Accesibilidad: ARIA labels en avatar y cards, aria-live en resultados, role/teclado en cards, role progressbar en distribución. Performance: React.memo en StaffCard/StaffFilters, useMemo en filtered, useCallback en handlers del modal. UI/UX: avatar degradado rose→purple, border-t-4 del color del role (role.color), Founder con anillo amber, skeleton coincidente con cards reales, empty state con CTA, stats con iconos, distribución con barra animada. Extraído StaffDetailQuickInfo del inline del detalle. Botón Editar en StaffDetailProfile. Validaciones: nombre, rol, teléfono 9 dígitos, comisión 0-100%, override min=0. Cumpleaños visible en detalle con icono Cake. Conteo de excepciones de comisión en detalle con icono Percent.