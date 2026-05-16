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
| Auth | Supabase Auth (email/password, localStorage) |
| Toasts | Sonner 1.7 |
| PWA | @serwist/turbopack (service worker), IndexedDB (idb-keyval) |

---

## Rutas de la Aplicación

| Ruta | Página | Propósito |
|------|--------|-----------|
| `/login` | Login | Inicio de sesión email/password |
| `/` | Dashboard | KPIs, citas de hoy, pendientes, reporte mensual |
| `/citas` | Citas | Agenda: vista lista + calendario (mes/semana/día) |
| `/citas/[id]` | Detalle Cita | Perfil, schedule, stepper, servicios, comisiones, balance |
| `/clientes` | Clientes | Lista con filtros por estado y búsqueda |
| `/clientes/[id]` | Detalle Cliente | Historial, estadísticas, citas |
| `/pagos` | Pagos | Hub 4 tabs: Registrar, Pendientes, Resumen, Comisiones |
| `/servicios` | Servicios | Catálogo, categorías, staff por servicio |
| `/staff` | Staff | Artistas, roles, especialidades |
| `/staff/[id]` | Rendimiento | Stats por período, top servicios, historial |

---

## Arquitectura de Componentes

```
app/src/
├── app/                          # App Router pages (Server/Client pattern)
│   ├── layout.tsx                # Root layout (Providers, SerwistProvider)
│   ├── page.tsx                  # Dashboard (Server Component)
│   ├── page-client.tsx           # Dashboard (Client Component)
│   ├── loading.tsx               # Skeleton loading
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404
│   ├── sw.ts                     # Service Worker (Serwist)
│   ├── login/                    # Auth (bypasses AppLayout)
│   │   ├── page.tsx / page-client.tsx / layout.tsx
│   ├── citas/                    # Citas module
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   │   └── [id]/page.tsx / page-client.tsx
│   ├── clientes/                 # Clientes module
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   │   └── [id]/page.tsx / page-client.tsx
│   ├── pagos/                    # Pagos hub (4 tabs)
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   ├── servicios/                # Servicios module
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   ├── staff/                    # Staff module
│   │   ├── page.tsx / page-client.tsx / layout.tsx / loading.tsx
│   │   └── [id]/page.tsx / page-client.tsx
│   └── serwist/[path]/route.ts   # Serwist SW route handler
│
├── components/
│   ├── layout/
│   │   └── shell.tsx             # Sidebar, MobileNav, Header, sync indicator
│   ├── ui/                       # Primitives (18 files)
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── DatePicker.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── empty-state.tsx
│   │   ├── error-banner.tsx
│   │   ├── FlagPeru.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── stat-card.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── citas/                    # 18 files (refactorizados)
│   ├── clientes/                 # 10 files (refactorizados)
│   ├── servicios/                # 6 files (refactorizados)
│   ├── staff/                    # 11 files (refactorizados)
│   ├── pagos/                    # 7 files (refactorizados)
│   ├── dashboard/                # 13 files (refactorizados)
│   ├── confirm/                  # ConfirmDialog
│   └── providers.tsx             # AuthProvider + OnlineProvider + ConfirmProvider
│
├── context/
│   ├── auth-context.tsx          # Auth (session, signIn, signOut, auto-redirect)
│   ├── confirm-context.tsx       # Confirm dialog
│   └── online-context.tsx        # Online status detection + queue trigger
│
├── lib/
│   ├── constants.ts              # DEPOSIT_AMOUNT = 20
│   ├── db/
│   │   ├── queries.ts            # All Supabase queries + cache (TTL + stale-while-revalidate)
│   │   └── persistent-cache.ts   # IndexedDB persistence layer (idb-keyval)
│   ├── supabase/
│   │   └── client.ts             # Supabase client singleton (auth config)
│   ├── offline-queue.ts          # Offline mutation queue (IndexedDB + replay)
│   └── utils.ts                  # formatCurrency, formatDate, commissions, etc.
│
├── types/
│   └── database.ts               # All TypeScript types

└── public/
    ├── manifest.json              # PWA manifest (scope, lang, orientation)
    ├── icon-192.png               # PWA icon
    ├── icon-512.png               # PWA icon (maskable)
    ├── apple-touch-icon.png       # iOS home screen icon
    └── sw.js                      # Generated service worker
```

---

## Base de Datos (PostgreSQL)

### ENUMs

```sql
client_status:      prospecto | activa | inactiva | vip
appointment_status: programada | en_curso | completada | cancelada | no_show
payment_type:       ingreso | egreso
payment_category:   servicio | insumo | alquiler | marketing | comisiones | otro
payment_method:     efectivo | tarjeta | transferencia | yape_plin
payment_kind:       reserva | pago_completo | pago_final
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
   ├── Toggle adelanto S/20 (default ON)
   ├── Validar solapamientos con otros artistas
   └── → Crea cita + appointment_services (+ pago S/20 si toggle ON)

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
1. Sin artista asignado → 100% para Studio (founder_share)
2. Artista con rol Dueña/Founder → 0% comisión, 100% al Studio (ella es el negocio)
3. Con override (staff_commission_overrides) → artista recibe precio - fixed_amount
4. Sin override → artista recibe su commission_pct %, resto al Studio
```

### Pagos Automáticos

- Al crear cita con adelanto: crea pago de tipo `reserva` por S/20
- Al completar cita: crea pago de tipo `pago_final` por `pending_balance`
- Método de pago: configurable por el usuario

---

## Sistema de Auth

```
React Component
│
├── AuthProvider (context/auth-context.tsx)
│   ├── useEffect: escucha onAuthStateChange de Supabase
│   ├── getSession() inicial → setUser
│   ├── signIn(email, password) → supabase.auth.signInWithPassword
│   ├── signOut() → supabase.auth.signOut() + redirect /login
│   └── Auto-redirect: no user → /login, has user → /
│
├── Shell (components/layout/shell.tsx)
│   ├── loading → spinner fullscreen
│   ├── pathname === /login → render children sin layout
│   ├── !user → return null (redirect lo maneja AuthProvider)
│   └── user → render sidebar + logout button
│
└── RLS (supabase/migrations/HU-33-rls-auth.sql)
    ├── ENABLE ROW LEVEL SECURITY en 11 tablas
    └── Políticas: auth.role() = 'authenticated' en SELECT/INSERT/UPDATE/DELETE
```

---

## Vistas del Calendario

| Modo | Descripción |
|------|-------------|
| Lista | Citas agrupadas por fecha desde hoy |
| Mes | Chips de hora con color de cita, clickeables |
| Semana | 7 columnas, scroll horizontal, slots de 15 min |
| Día | Timeline detallado con hover "Crear aquí" |
| Hoy | Botón para saltar al día actual |

- Colores asignados por cita (no por artista)
- Citas pasadas/canceladas/no_show: gris + opacidad reducida
- Animación fadeIn al cambiar de vista (prefers-reduced-motion: reduce)

---

## PWA / Offline

### Service Worker (@serwist/turbopack)
- Precaching de todos los assets del build (JS, CSS, HTML)
- skipWaiting + clientsClaim (SW toma control inmediato)
- navigationPreload para respuestas rápidas
- runtimeCaching: strategy por defecto de Serwist

### Caché Persistente (IndexedDB via idb-keyval)
- `persistent-cache.ts` wrap de idb-keyval
- Hydratación en frío: al cargar la app, restaura caché desde IndexedDB
- Cada fetch exitoso persiste el resultado
- Degradación graceful si IndexedDB no está disponible (Safari privado)

### Cola de Mutaciones Offline
- `offline-queue.ts`: cola FIFO en IndexedDB
- Soporta insert/update/delete por tabla
- Replay automático al reconectar (max 3 intentos)
- Indicador en sidebar con contador + spinner de sincronización

### Online Detection
- `online-context.tsx`: escucha eventos online/offline
- Toast Sonner al perder/recuperar conexión
- Gatilla processQueue() al volver online

### Meta Tags
- manifest.json con scope, lang, orientation portrait
- appleWebApp: capable, statusBarStyle, title
- theme-color: #db2777
- apple-touch-icon 180×180
- viewport: user-scalable=false, maximum-scale=1

---

## Data Layer

### Patrón de Queries

- Cada query usa `cachedQuery(key, ttlMs, fetcher)` con:
  - **TTL**: 10-60s según query
  - **Stale-while-revalidate**: devuelve dato stale dentro de 3× TTL mientras refresca en background
  - **Deduplicación**: queries duplicadas en vuelo comparten la misma Promise
  - **Offline fallback**: si fetch falla y hay dato expirado en caché, lo devuelve
- Mutaciones (create/update/delete) llaman `clearQueryCache()` para invalidar

### Cache Flow

```
Request → cachedQuery(key)
  ├── Hit fresh (< TTL) → return inmediato
  ├── Hit stale (< 3× TTL) → return + refreshInBackground
  ├── Hit expired → try fetch
  │     ├── Success → update cache + persist IndexedDB → return
  │     └── Fail → return expired data (offline fallback)
  └── Miss → try fetch
        ├── Success → cache + persist → return
        └── Fail → throw error
```

---

## UI/UX Patrones

- Cards clickeables (sin botones editar/eliminar en cards)
- Edición vía modal con detección de cambios
- Botón eliminar dentro del modal
- Moneda: `S/` como texto (no ícono), posicionamiento absoluto en inputs
- Botones con `whitespace-nowrap` global
- Skeleton loading en todas las páginas
- Colores de estado: salon (programada), ámbar (en_curso), verde (completada), rojo (cancelada), zinc (no_show)
- safe-area-inset-bottom para iOS notches
- font-size: 16px en inputs (previene zoom automático iOS)
- prefers-reduced-motion: reduce (animación condicional)

---

## Migraciones SQL

Las migraciones están en `supabase/migrations/` y se aplican en orden:

1. `001_categories_dinamicas_parte1.sql`
2. `002_categories_dinamicas_parte2.sql`
3. `002_add_staff_birthday.sql`
4. `003_insert_default_founder.sql`
5. `HU-23-roles-dinamicos.sql` ✅
6. `HU-24-comisiones-dinamicas.sql` ✅
7. `HU-25-servicios-mejoras.sql` ✅
8. `HU-26-poblar-servicios-reales.sql` ✅
9. `HU-27-fix-appointment-services.sql` ✅
10. `HU-28-rls-appointment-services.sql` ✅
11. `HU-29-rls-appointment-services-v2.sql` ✅
12. `HU-30-client-status-functions.sql` ✅
13. `HU-31-fix-founder-commission.sql` ✅
14. `HU-32-swap-lashista-founder-colors.sql` ✅
15. `HU-33-rls-auth.sql` ✅

---

## Estructura del Proyecto (Archivos Clave)

```
/CRM Studio/
├── app/                                  # Next.js app
│   ├── src/
│   │   ├── app/                          # Pages + SW + Serwist route
│   │   ├── components/
│   │   │   ├── layout/shell.tsx          # Sidebar + MobileNav + Header
│   │   │   ├── ui/                       # 16 primitives
│   │   │   ├── citas/                    # 18 files
│   │   │   ├── clientes/                 # 10 files
│   │   │   ├── servicios/                # 6 files
│   │   │   ├── staff/                    # 11 files
│   │   │   ├── pagos/                    # 7 files
│   │   │   ├── dashboard/                # 13 files
│   │   │   ├── confirm/                  # ConfirmDialog
│   │   │   └── providers.tsx             # Auth + Online + Confirm
│   │   ├── context/
│   │   │   ├── auth-context.tsx          # Auth system
│   │   │   ├── confirm-context.tsx       # Confirm dialog
│   │   │   └── online-context.tsx        # Online detection
│   │   ├── lib/
│   │   │   ├── constants.ts              # DEPOSIT_AMOUNT = 20
│   │   │   ├── db/queries.ts             # Supabase queries + cache
│   │   │   ├── db/persistent-cache.ts    # IndexedDB cache
│   │   │   ├── offline-queue.ts          # Offline mutation queue
│   │   │   ├── supabase/client.ts        # Supabase client
│   │   │   └── utils.ts                  # Utilities
│   │   ├── types/database.ts             # TypeScript types
│   │   └── public/
│   │       ├── manifest.json             # PWA manifest
│   │       ├── icon-*.png                # PWA icons
│   │       └── apple-touch-icon.png      # iOS icon
│   ├── supabase/
│   │   ├── schema.sql                    # Full schema
│   │   └── migrations/                   # 15 SQL migrations
│   ├── scripts/                          # DB scripts + icon generation
│   ├── docs/
│   │   ├── system-design.md              # This file
│   │   ├── status.md                     # Project status
│   │   └── specs/                        # HUs organizadas por módulo
│   └── AGENTS.md                         # Contexto del proyecto (AI)
```
