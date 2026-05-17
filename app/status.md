# Estado del Proyecto: CRM Studio de Belleza

> Fecha: 16 Mayo 2026
> Rama: `main`
> Estado: Proyecto consolidado. Todas las HU implementadas. Auth + PWA completados.

---

## Índice
1. [Resumen General](#resumen-general)
2. [Rutas](#rutas)
3. [Completados ✓](#completados-)
4. [En Progreso 🔄](#en-progreso-)
5. [Pendientes ⏳](#pendientes-)
6. [Changelog Reciente](#changelog-reciente)
7. [Próximos Pasos](#próximos-pasos)

---

## Resumen General

### Estado del Proyecto
**~98% completado — Auth + PWA implementados. Faltan Tests.**

### Stack
- **Framework**: Next.js 16.2.6 (App Router)
- **Lenguaje**: TypeScript 5.7.0
- **UI**: React 19.0.0
- **CSS**: Tailwind CSS 4.3.0
- **BD**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (email/password, localStorage)
- **PWA**: Serwist service worker + IndexedDB offline + manifest

### Sidebar (6 items planos)
```
📊 Dashboard
📅 Citas
🎨 Servicios
👥 Clientas
👤 Staff
💰 Pagos
```

### Rutas del Sistema
| Ruta | Módulo | Componentes clave |
|------|--------|-------------------|
| `/login` | Auth | Login page con email/password |
| `/` | Dashboard | Banner, stats, citas de hoy, cumpleaños, pendientes, reporte mensual expandible |
| `/citas` | Citas | Vista lista + calendario, crear/editar cita, detail ticket, solapamientos |
| `/clientes` | Clientas | Lista con filtros + búsqueda, cards agrupadas por estado, paginación |
| `/clientes/[id]` | Detalle clienta | Stats, historial de citas, editar/eliminar |
| `/servicios` | Servicios | CRUD, categorías, staff por servicio, precios fijo/variable |
| `/staff` | Staff | CRUD, roles dinámicos, especialidades, comisiones, founder protegida |
| `/staff/[id]` | Rendimiento artista | Stats por período, top servicios, historial, distribución comisión |
| `/pagos` | Pagos (4 tabs) | Registrar, Pendientes, Resumen, Comisiones |

---

## Completados ✓

### HUs Implementadas
| HU | Descripción | Estado |
|-----|-------------|--------|
| HU-01 a HU-14 | Módulos core (clientes, servicios, citas, staff, pagos, dashboard) | ✅ |
| HU-15 | Rendimiento artista (`/staff/[id]`) | ✅ |
| HU-16 a HU-18 | Comisiones, pagos, egresos | ✅ |
| HU-19 | Resumen financiero (tab en Pagos) | ✅ |
| HU-20 | Pagos pendientes (tab en Pagos) | ✅ |
| HU-21 | Dashboard | ✅ |
| HU-22 | Reporte mensual (sección expandible en Dashboard) | ✅ |
| HU-23 | Roles dinámicos | ✅ |
| HU-24 | Comisiones dinámicas | ✅ |
| HU-25 | Panel servicios mejoras | ✅ |

### Consolidación de Módulos
- [x] Pagos unifica 4 tabs: Registrar, Pendientes, Resumen, Comisiones
- [x] Dashboard incluye Reporte Mensual expandible (colapsado por defecto)
- [x] Sidebar reducido de 10 a 6 items planos
- [x] Rutas eliminadas: `/pagos/pendientes`, `/reportes/comisiones`, `/reportes/financiero`, `/reportes/mensual`

### Cross-cutting Fixes
- [x] `<Toaster />` de Sonner agregado al root layout (toasts ahora visibles)
- [x] `DEPOSIT_AMOUNT` centralizado en `lib/constants.ts` (reemplazado S/20 hardcodeado en 4 archivos)
- [x] `toSorted()` reemplazado por `[...arr].sort()` (compatibilidad Safari < 15.4)
- [x] Dashboard sin datos hardcodeados (`+12%` eliminado, "Hola de nuevo, Ara" → "Panel de control")
- [x] `EmptyState` componente compartido en `components/ui/empty-state.tsx`
- [x] `ErrorBanner` componente en `components/ui/error-banner.tsx`
- [x] Modal con focus trap (tab no se escapa, foco vuelve al cerrar)
- [x] `AppointmentDetail` + `DetailPopover` unificados en `AppointmentTicket.tsx` (~200 líneas duplicadas eliminadas)
- [x] Error propagation: `cachedQuery` almacena errores en `lastErrors`, Dashboard muestra `ErrorBanner` con retry
- [x] Paginación en clientes (15 por grupo + botón "Ver más")
- [x] Ruta `/clientes/[id]` creada (antes daba 404 desde Pagos)
- [x] `Appointment`, `CommissionDetail` exportados de `types/database.ts`
- [x] `PAYMENT_CATEGORY_LABELS` agregado a types

### Nuevas Queries
| Query | Módulo |
|-------|--------|
| `getPendingPayments()` | HU-20 Pagos Pendientes |
| `getStaffPerformance()`, `getStaffTopServices()`, `getStaffAppointments()` | HU-15 Staff/Id |
| `getFinancialSummary()`, `getIncomeByMethod()`, `getExpensesByCategory()` | HU-19 Resumen |
| `getMonthlyReport()`, `getTopServices()`, `getTopArtistsByRevenue()`, `getNewClients()`, `getInactiveClients()` | HU-22 Reporte |
| `getStaffById()` | Staff detail |
| `getLastError()`, `clearError()` | Error handling |

---

## En Progreso 🔄

| Item | Descripción |
|------|-------------|
| Ninguno | Todas las funcionalidades core y HUs implementadas. |

---

## Pendientes ⏳

### Próximas sesiones
| Sesión | Descripción | Prioridad |
|--------|-------------|-----------|
| Tests + CI/CD | Vitest, Testing Library, Playwright, GitHub Actions | Alta |
| Perfil de usuario | Configuración de cuenta, foto | Baja |

---

## Changelog Reciente

### [16 Mayo 2026 — Supabase SSR Auth Fix]

#### Bug Fix: Data no aparecía en prod hasta 60s
- **Root cause**: Server Components usaban Supabase anon client sin cookie de auth → RLS retornaba vacío → `initialMetrics` llegaba truthy-pero-vacío → cliente skipeaba refetch → esperaba el auto-refresh de 60s
- **Fix**: `@supabase/ssr` instalado, server client con cookies, proxy.ts para refresh de sesión
- `src/lib/supabase/server.ts` — `createClient()` con `cookies()` de Next.js
- `src/proxy.ts` — Proxy (Next.js 16: renombrado de middleware → proxy, export `proxy` function)
- `queries.ts` — Todas las funciones exportadas aceptan `client?: SupabaseClient`; server path bypasea cache
- Todos los `page.tsx` actualizados para usar server client con auth real
- **Resultado**: Data renderiza correctamente desde primera carga, sin espera

### [16 Mayo 2026 — Auth + PWA + React Doctor]

#### Autenticación (HU-33)
- **Auth System**: Supabase Auth con email/password, sesión persistida en localStorage
- **Login page**: Diseño con gradiente, iconos, toggle show/hide password, iOS-safe 16px inputs
- **AuthProvider**: Session listener con auto-redirect (`/login` ↔ `/`), signIn/signOut
- **Shell guard**: Spinner mientras carga, null si no hay sesión, botón "Cerrar sesión" en sidebar
- **RLS**: Migración HU-33 — RLS en todas las tablas, solo authenticated users
- **MobileNav**: Oculto en `/login` para evitar navbar duplicado

#### PWA (4 Fases)
- **Fase 1 — Instalable**: Service Worker (@serwist/turbopack), iconos 192/512/180 generados, manifest con scope/lang/orientation, theme-color #db2777, splash screen iOS
- **Fase 2 — Resiliencia**: OnlineProvider con toasts Sonner (conexión/perdida), error.tsx con retry, not-found.tsx 404, cachedQuery fallback offline a datos expirados
- **Fase 3 — Caché Persistente**: IndexedDB via idb-keyval, hidratación en frío al cargar, persistencia post-fetch, degradación graceful Safari privado
- **Fase 4 — Mutaciones Offline**: Cola FIFO en IndexedDB (insert/update/delete), replay automático al reconectar, max 3 intentos, indicador en sidebar con contador

#### React Doctor + Bug Fixes
- **React Doctor**: 78 → 93/100 (166→61 issues). 100+ issues resueltos en 8 fases: Tailwind design, JS moderno, state cascade, rerender, hydration, a11y, dead code
- **7 archivos eliminados**, 603 líneas menos de código muerto
- **Bug fixes**: toggle centrado, router.push, yape_plin default, UTC date bug, skeleton flicker
- **16 lint warnings** resueltos → 0 errors, 0 warnings

### [13 Mayo 2026 — Refactor Servicios]

#### Refactor Servicios
- **Componentes extraídos**: 6 archivos en `components/servicios/` (page-client.tsx 939→423 lns)
- **Tipado fuerte**: 0 `any`, interfaces dedicadas (`ServiceForm`, `FormAction`, props por componente)
- **Accesibilidad**: ARIA labels en cards/search/delete, `role="alert"` en errores, `aria-hidden` en iconos decorativos
- **Performance**: `React.memo` en ServiceCard/ServiceFilters, `useMemo`/`useCallback` en computaciones y handlers
- **UI/UX**: Skeleton anidado por grupos de categoría, empty state con CTA, fadeIn al cambiar filtros, sort alfabético, error state con banner rojo
- **Code reuse**: PriceSection unificada con `<Input leftPrefix>` en vez de raw `<input>` + posicionamiento absoluto
- **Estabilidad**: `getStaffForCategory` como función pura, `resetForm`/`isFormValid` memorizados, 0 ESLint warnings del módulo
- **Card component**: Ahora acepta `aria-label` para accesibilidad

### [13 Mayo 2026 — HU-15, HU-19, HU-20, HU-22 + Consolidación + Cross-cutting]

#### HUs Implementadas
- **HU-15**: Página `/staff/[id]` con rendimiento por período, top servicios, historial
- **HU-19**: Resumen financiero con breakdown por método de pago y categoría de egreso
- **HU-20**: Pagos pendientes con urgencia (critical/warning/normal)
- **HU-22**: Reporte mensual con top servicios, top artistas, nuevas clientas y por reactivar

#### Consolidación
- Sidebar simplificado: 6 items planos (Dashboard, Citas, Servicios, Clientas, Staff, Pagos)
- Pagos convertido en hub con 4 tabs (Registrar, Pendientes, Resumen, Comisiones)
- Dashboard integra Reporte Mensual como sección expandible (colapsado por defecto)
- Rutas eliminadas: `/pagos/pendientes`, `/reportes/comisiones`, `/reportes/financiero`, `/reportes/mensual`

#### Cross-cutting
- `<Toaster />` agregado al layout — toasts ahora funcionan
- `DEPOSIT_AMOUNT` en `constants.ts` — S/20 ya no está hardcodeado
- `toSorted()` → `[...arr].sort()` — compatible con Safari
- Dashboard sin datos falsos (ya no muestra "+12%" ni "Hola de nuevo, Ara")
- `EmptyState` y `ErrorBanner` componentes creados
- Modal con focus trap completo
- AppointmentDetail + DetailPopover fusionados en AppointmentTicket
- Error propagation: queries ahora registran errores, Dashboard los muestra con retry
- Paginación en clientes (15 por grupo)
- Ruta `/clientes/[id]` creada (antes daba 404)

---

## Próximos Pasos

### Próxima Sesión
1. Tests unitarios (Vitest + Testing Library)
2. Tests E2E (Playwright)
3. CI/CD pipeline (GitHub Actions)

---

## Notas Importantes

### Ambiente
- **URL Supabase**: `https://aldbomizedsoxyluvgog.supabase.co`
- **Founder**: Araceli Zevallos (protegida)
- **Puerto**: 3000 (`npm run dev`)
- **Moneda**: Soles Peruanos (S/)

### Estructura de Páginas
```
app/[route]/
├── page.tsx          # Server Component (data fetching + metadata)
├── page-client.tsx   # Client Component (interactividad)
├── layout.tsx        # Layout con metadata
└── loading.tsx        # Skeleton loading
```

### Consultas (queries.ts)
Principales funciones exportadas:
- **Clientes**: `getClients`, `getClientById`, `createClient`, `updateClient`, `deleteClient`
- **Servicios**: `getCategories`, `getServices`, `createService`, `updateService`, `deleteService`, `updateStaffServices`, `getStaffForService`
- **Staff**: `getStaff`, `getStaffById`, `createStaff`, `updateStaff`, `deleteStaff`, `updateStaffSpecialties`, `getRoles`
- **Citas**: `getAppointments`, `createAppointment`, `updateAppointment`, `checkOverlap`
- **Pagos**: `getPayments`, `createPayment`, `getPendingPayments`
- **Dashboard**: `getDashboardMetrics`
- **Financiero**: `getFinancialSummary`, `getIncomeByMethod`, `getExpensesByCategory`
- **Comisiones**: `getCommissionOverrides`, `upsertCommissionOverride`, `deleteCommissionOverride`, `getCommissionReport`, `getStaffPerformance`, `getStaffTopServices`, `getStaffAppointments`
- **Reportes**: `getMonthlyReport`, `getTopServices`, `getTopArtistsByRevenue`, `getNewClients`, `getInactiveClients`
- **Utils**: `getLastError`, `clearError`

### Componentes UI
```
components/ui/
├── badge.tsx, button.tsx, card.tsx, checkbox.tsx
├── DatePicker.tsx, DateTimePicker.tsx
├── empty-state.tsx, error-banner.tsx
├── FlagPeru.tsx, input.tsx, modal.tsx
├── select.tsx, skeleton.tsx, stat-card.tsx
├── tabs.tsx, textarea.tsx
```

### Archivos Clave
| Archivo | Descripción |
|---------|-------------|
| `AGENTS.md` | Contexto completo del proyecto (AI) |
| `supabase/schema.sql` | Esquema completo BD |
| `supabase/migrations/` | Migraciones SQL |
| `docs/specs/` | Especificaciones HU |
| `scripts/` | Scripts de BD (clean, seed, test) |
| `lib/constants.ts` | Constantes del proyecto (DEPOSIT_AMOUNT) |
| `context/auth-context.tsx` | Auth Provider (session listener, signIn/signOut) |
| `context/online-context.tsx` | Online detection (toasts conexión) |
| `lib/offline-queue.ts` | Cola de mutaciones offline (IndexedDB) |
| `lib/db/persistent-cache.ts` | Caché persistente (IndexedDB via idb-keyval) |
| `public/sw.js` | Service Worker (generado por Serwist) |
| `public/manifest.json` | PWA manifest |
| `public/icon-*.png` | Iconos PWA |

### Repo
- **GitHub**: https://github.com/bdvela/CRM-Studio.git
