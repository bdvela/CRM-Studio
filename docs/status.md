# CRM Studio — Estado del Proyecto

> Última actualización: 16 Mayo 2026

## Resumen

**28/28 HUs implementadas.** La fase actual es optimización transversal de todos los módulos siguiendo principios de diseño Emil Kowalski: performance, clean UI/UX, fluid animations, y polish visual.

---

## Estado por Módulo

### Dashboard (`/`)
| Aspecto | Estado |
|---------|--------|
| Métricas principales | ✅ Ingresos, gastos, ganancia neta, clientas activas (con tendencias) |
| Citas de hoy | ✅ Con indicador de capacidad y estado activo/inactivo |
| Sparkline | ✅ SVG de tendencia semanal de ingresos (sin librerías externas) |
| Ocupación staff | ✅ Barras de capacidad por artista programado |
| Actividad reciente | ✅ Timeline últimas 4 acciones |
| Cumpleaños próximos | ✅ Staff birthdays |
| Pagos pendientes | ✅ Citas completadas con saldo > 0 |
| Reactivación | ✅ Clientas inactivas por contactar |
| Reporte mensual | ✅ Métricas + top servicios + top artistas + ingresos por método + gastos por categoría |
| Auto-refresh | ✅ 60s con stale-while-revalidate, pausa al ocultar pestaña |
| Cache | ✅ 30s TTL + 90s stale window |
| Server/Client pre-fetch | ✅ `getDashboardMetrics` + `getMonthlyReport` en paralelo |

### Citas (`/citas`)
| Aspecto | Estado |
|---------|--------|
| Vista Lista | ✅ Agrupada por fecha |
| Vista Calendario | ✅ Mes, Semana, Día — coexisten con CSS toggle (sin re-mount) |
| Crear/Editar cita | ✅ Selección clienta, servicios (modal), artista por servicio, precio personalizado |
| Adelanto S/20 | ✅ Por defecto activado al crear cita |
| Pagos automáticos | ✅ Al crear (adelanto) y al completar (diferencia) |
| Solapamientos | ✅ Detección de conflictos horarios |
| Estados | ✅ programada → en_curso → completada, cancelada, no_show |
| Detalle de cita | ✅ Full-page con perfil, stepper, servicios, comisiones, balance, acciones |
| HU-26 Auto-status | ✅ `promoteClientOnCompletion()` al completar cita |
| CalendarInput | ✅ Portal-based react-day-picker (escape modal overflow) |
| Modales | ✅ Lazy-load con React.lazy + Suspense (3 chunks) |
| Lint | ✅ 0 errors |

### Clientes (`/clientes`)
| Aspecto | Estado |
|---------|--------|
| Lista | ✅ Filtro por estado, búsqueda, paginación, agrupado |
| Detalle | ✅ Perfil + stats + historial clickeable → cita detail |
| Crear/Editar | ✅ Modal unificado con detección de cambios |
| HU-27 Toggle VIP | ✅ Reemplaza Select de estado; toggle on = vip, off = prospecto/activa |
| Estados | ✅ prospecto (blue), activa (emerald), inactiva (zinc), vip (amber) |
| Auto-transiciones | ✅ prospecto/inactiva → activa al completar cita; activa/vip → inactiva >60d sin visita (pg_cron) |
| Modales | ✅ ClientFormModal + ClientDetailModal lazy-load |
| Avatar | ✅ Gradiente salon estándar en card, detail, combobox |
| Card feedback | ✅ `active:scale-[0.97]` |
| Lint | ✅ 0 errors |

### Servicios (`/servicios`)
| Aspecto | Estado |
|---------|--------|
| Lista | ✅ Agrupada por categoría, filtros búsqueda + categoría |
| Crear/Editar | ✅ Modal 2 tabs: Datos + Staff |
| Precio fijo/variable | ✅ Select tipo + input con prefijo S/ |
| Staff por servicio | ✅ Checkbox list con badge especialidad y "sugerido" |
| Modales | ✅ Lazy-load ServicioFormModal |
| Skeleton | ✅ Coincide con layout real (usa categorías reales) |
| Card feedback | ✅ `active:scale-[0.97]` |
| Lint | ✅ 0 errors |

### Staff (`/staff`)
| Aspecto | Estado |
|---------|--------|
| Lista | ✅ Cards con avatar role-gradient, especialidades, commission% |
| Detalle | ✅ Perfil + stats + top services + distribución + historial clickeable |
| Crear/Editar | ✅ Modal 3 tabs: Datos, Especialidades, Comisiones |
| Eliminar | ✅ Desde detail modal (no desde edit form) |
| Detail modal | ✅ Enriched: 30d revenue trend, birthday highlight, commission exceptions |
| Founder | ✅ Araceli Zevallos protegida, badge Studio (no Founder) |
| Card grid | ✅ `h-full flex flex-col` + `mt-auto` para altura uniforme |
| Staff detail page | ✅ `/staff/[id]` con rendimiento completo |
| Modales | ✅ Lazy-load StaffFormModal |
| Lint | ✅ 0 errors |

### Pagos (`/pagos`)
| Aspecto | Estado |
|---------|--------|
| Tabs | ✅ 2 tabs: Registrar + Comisiones (simplificado de 4) |
| Registrar pago | ✅ Modal con tipo (ingreso/egreso), concepto, monto, fecha vía CalendarInput |
| Comisiones | ✅ Reporte por artista con stat cards, filtro búsqueda + rango fechas + rangos rápidos + validación Desde ≤ Hasta |
| Pendientes | ❌ Eliminado (manejado por auto-create al completar cita) |
| Resumen | ❌ Eliminado (info movida al Dashboard: MonthlyReport) |
| Payment cards | ✅ `border-l-4` verde/rojo, badges kind/method |
| CalendarInput | ✅ Portal-based (reemplaza native `<input type="date">`) |
| Comisiones layout | ✅ 2-row: search full-width + fechas/rangos en row flex-wrap |
| Modales | ✅ PaymentFormModal + PaymentDetailModal lazy-load |
| Lint | ✅ 0 errors |

---

## Decisiones de Diseño

### Avatares
- **Clientes**: Gradiente salon estándar `from-salon-500/90 via-salon-400/50 to-salon-500`, texto blanco, shadow
- **Staff**: Gradiente por color de rol `linear-gradient(135deg, ${roleColor}dd, ${roleColor}88, ${roleColor})`, texto blanco, shadow
- **Founder/Studio**: Gradiente ámbar `from-amber-400/90 via-amber-300/50 to-amber-500`

### Eliminar
- Botón eliminar **solo en detail modal**, no en edit form
- Estilo: `border-red-200 text-red-600`, junto a Editar (`border-salon-200`)

### Modal Transitions
- Abrir edit modal **sin cerrar** el detail modal (detail se cierra vía dispatch del parent)
- Cerrar edit modal → vuelve al detail modal
- `openDetail` abre instantáneamente con datos de la card, fetch completo en background

### Pagos Simplificado
- De 4 tabs → 2 tabs (Registrar + Comisiones)
- Pendientes: redundante (pagos se crean automáticamente al completar cita)
- Resumen: redundante (info está en Dashboard MonthlyReport)

### Calendario
- Portal-based popover vía `createPortal` + `position: fixed`
- Escapa del `overflow-y-auto` de los modales
- react-day-picker v9.14.0 con tema salon (`--rdp-accent-color: #db2777`)
- Mobile (<640px): popover centrado en viewport
- Desktop: posicionado contextualmente con detección de bordes

### Animaciones
- Custom easing: `cubic-bezier(0.23, 1, 0.32, 1)`
- Nunca `transition-all`
- `active:scale-[0.97]` en cards y botones
- `@media (hover: hover)` guard en hovers
- `prefers-reduced-motion: reduce` respetado globalmente
- Stagger utilities: `stagger-1` a `stagger-8` (50ms increments)

### Moneda
- Símbolo "S/" como texto (nunca ícono DollarSign)
- Formato: `S/ 99.99`

---

## HUs Implementadas

| HU | Descripción | Módulo |
|----|-------------|--------|
| HU-01 | Registrar clienta | Clientes |
| HU-02 | Buscar clientas | Clientes |
| HU-03 | Estado de clienta | Clientes |
| HU-04 | Historial de clienta | Clientes |
| HU-05 | Reactivar clientas | Clientes |
| HU-06 | Crear y gestionar servicios | Servicios |
| HU-07 | Catálogo por categoría | Servicios |
| HU-08 | Actualizar precios | Servicios |
| HU-09 | Agendar cita | Citas |
| HU-10 | Ver agenda día/semana | Citas |
| HU-11 | Actualizar estado de cita | Citas |
| HU-12 | Detectar solapamientos | Citas |
| HU-13 | Resumen de cita | Citas |
| HU-14 | Registrar nail artist | Staff |
| HU-15 | Rendimiento por artista | Staff |
| HU-16 | Calcular comisiones | Pagos |
| HU-17 | Registrar pago de cita | Pagos |
| HU-18 | Registrar egresos | Pagos |
| HU-19 | Resumen financiero | Pagos |
| HU-20 | Pagos pendientes | Pagos |
| HU-21 | Dashboard principal | Dashboard |
| HU-22 | Reporte mensual | Dashboard |
| HU-23 | Roles dinámicos | Staff |
| HU-24 | Comisiones dinámicas | Pagos |
| HU-25 | Panel servicios — mejoras | Servicios |
| HU-26 | Transición automática de estados de clienta | Clientes |
| HU-27 | Toggle VIP sin selector de estado | Clientes |
| HU-28 | Comisiones — filtro por rango de fechas | Pagos |

**Total: 28/28 ✅** (todas las HUs del alcance original)

---

## Issues Resueltos

| Issue | Solución |
|-------|----------|
| RLS en `appointment_services` (Error 401) | Migración HU-28/HU-29 con políticas SELECT/INSERT/UPDATE/DELETE |
| Columna `service_price` faltante | Migración HU-27 |
| Servicios no cargan al editar cita | Solución RLS |
| params síncronos en Next.js 15+ | Refactor `await params` + validación UUID |
| Turbopack loop infinito | Eliminar package.json del root |
| Filtros Lista contaminaban Calendario | Separar estado de filtros + filtrado client-side |
| CalendarView se re-montaba al cambiar vista | CSS toggle, 3 views coexisten |
| Modales en bundle inicial | Lazy-load con React.lazy + Suspense |
| Intervalo reloj corría con tab oculta | `visibilitychange` pausa/reanuda |
| Skeleton no coincidía con layout real | Rediseño de skeletons en todos los módulos |
| 15 lint errors (`react-hooks/immutability`) | Renombrar 5 ref params en hooks.ts |
| Duplicate key warnings | Índice agregado a keys de servicios |
| CalendarInput button height mismatch | `py-3` → `py-2.5 sm:py-3` (alineado con search input) |

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Lenguaje | TypeScript 5.7.0 |
| UI | React 19.0.0, Tailwind CSS 4.3.0 |
| Iconos | Lucide React 0.469.0 |
| Fechas | date-fns 4.1.0, react-day-picker 9.14.0 |
| BD | PostgreSQL (Supabase) |
| Cliente BD | @supabase/supabase-js 2.47.0 |
| Toasts | Sonner 1.7.0 |

## Lint

- **Errors**: 0
- **Warnings**: 0

---

## Próximos Pasos

1. Tests unitarios y E2E
2. Autenticación/Login (Supabase Auth)
3. PWA — mejorar offline support con service worker

## React Doctor

- **Score**: 78/100 (166 issues)
- **Estado**: Fixing in progress
