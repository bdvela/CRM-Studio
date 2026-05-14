# Estado del Proyecto: CRM Studio de Belleza

> Fecha: 13 Mayo 2026
> Rama: `main`
> Estado: Proyecto consolidado. Todas las HU implementadas. Sidebar simplificado a 6 items.

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
**~90% completado — Todas las HUs implementadas. Faltan Tests + Auth.**

### Stack
- **Framework**: Next.js 16.2.6 (App Router)
- **Lenguaje**: TypeScript 5.7.0
- **UI**: React 19.0.0
- **CSS**: Tailwind CSS 4.3.0
- **BD**: PostgreSQL (Supabase)

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
| Autenticación/Login | Supabase Auth, login page, middleware, rutas protegidas | Alta |

---

## Changelog Reciente

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

### Siguiente Sesión
1. Autenticación/Login (Supabase Auth)
2. Middleware de protección de rutas
3. Perfil de usuario

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

### Repo
- **GitHub**: https://github.com/bdvela/CRM-Studio.git
