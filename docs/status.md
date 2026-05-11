# Estado del Proyecto: CRM Studio de Belleza

> Fecha: 11 Mayo 2026
> Rama: `main`
> Último Commit: (sesión activa — pulido panel de Citas)
> Nota: Panel de Citas completamente pulido. Bugs críticos resueltos. UX/UI profundo aplicado.

---

## Índice
1. [Resumen General](#resumen-general)
2. [Completados ✓](#completados-)
3. [En Progreso 🔄](#en-progreso-)
4. [Pendientes ⏳](#pendientes-)
5. [Bloqueantes 🚫](#bloqueantes-)
6. [Changelog Reciente](#changelog-reciente)
7. [Próximos Pasos](#próximos-pasos)

---

## Resumen General

### Estado del Proyecto
**70% completado — Panel de Citas estable y pulido**

### Stack
- **Framework**: Next.js 16.2.6
- **Lenguaje**: TypeScript 5.7.0
- **UI**: React 19.0.0
- **CSS**: Tailwind CSS 4.3.0
- **BD**: PostgreSQL (Supabase)

---

## Completados ✓

### Módulos Principales

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Dashboard | ✅ | Panel principal con métricas |
| Citas | ✅ | Gestión completa + UX pulido |
| Clientes | ✅ | Gestión de clientas con estados |
| Servicios | ✅ | Gestión de servicios y categorías |
| Staff | ✅ | Gestión de artistas y roles |
| Pagos | ✅ | Ingresos y egresos |
| Comisiones | ✅ | Cálculo y reporte de comisiones |

### Funcionalidades Específicas

#### Citas — Core
- [x] Vista Lista (agrupada por fecha, desde hoy)
- [x] Vista Calendario (Mes, Semana)
- [x] Crear cita con selección de servicios
- [x] Editar cita (carga precios por servicio correctamente)
- [x] Cancelar cita (con modal de confirmación)
- [x] Marcar como No Show (con confirmación)
- [x] Avance de estados programada → en_curso → completada (con confirmación en completar)
- [x] Detección de solapamientos
- [x] Toggle adelanto S/10 (default activado)
- [x] Pago automático al completar (crea pago por saldo pendiente)
- [x] `service_price` guardado y cargado por cita en BD
- [x] Validación: clienta obligatoria al crear/editar

#### Citas — UX/UI (sesión actual)
- [x] Cards de lista: clienta prominente, artista en color salon, badges de servicios
- [x] Detail ticket-style: header coloreado por estado, dividers punteados, precio en header
- [x] Detalle unificado lista ↔ calendario (mismo componente visual)
- [x] Botones de acción contextuales por estado (Cancelar/NoShow solo en `programada`)
- [x] Editar: estilo secundario cuando cita activa, gris cuando completada/cancelada
- [x] Status dropdown eliminado del modal (solo via detail)
- [x] Colores de cita en calendario (por color asignado, no por artista)
- [x] Citas canceladas/no_show/pasadas: chip gris + opacity en calendario
- [x] Mes: chips de hora con color por cita (clickeables → abre detail)
- [x] Semana: info progresiva por altura (hora → cliente → artista)
- [x] Semana: scroll horizontal en mobile
- [x] Toolbar calendario: botón Hoy, responsive mobile
- [x] CalendarView: callbacks onAdvanceStatus + onMarkAsNoShow desde page.tsx

#### DateTimePicker (reescrito)
- [x] Auto-advance fecha → hora tras seleccionar día
- [x] Hora se cierra automáticamente al seleccionar slot
- [x] Slots de 15 min (antes 30)
- [x] Scroll automático al slot seleccionado
- [x] Hoy resaltado con ring (estilo Apple), click → salta a hoy
- [x] Hora deshabilitada hasta seleccionar fecha

#### Clientes
- [x] Filtro por estado (Todos/Prospecto/Activa/Inactiva/VIP)
- [x] Buscador
- [x] Detalle de clienta + historial
- [x] Cards clickeables / edición por modal

#### Servicios
- [x] Precio fijo/variable
- [x] Categorías dinámicas
- [x] Pestaña Staff (asignar artistas)
- [x] Artistas sugeridos con auto-selección

#### Staff
- [x] Roles dinámicos
- [x] Especialidades por categoría
- [x] Comisión por porcentaje
- [x] Founder protegida

#### Comisiones
- [x] Cálculo automático
- [x] Overrides (monto fijo para founder)
- [x] Reporte con filtros

### UI/UX Global
- [x] Cards clickeables (sin botones editar/eliminar en cards)
- [x] Edición por modal / botón eliminar dentro del modal
- [x] Detección de cambios (botón Actualizar deshabilitado sin modificaciones)
- [x] Responsividad iPhone / iPad / PC
- [x] iOS sin zoom automático (font-size ≥ 16px en inputs)
- [x] Moneda S/ como texto (no ícono DollarSign)
- [x] Buttons: `whitespace-nowrap` global — texto nunca en 2 líneas

### Code Quality (sesión actual)
- [x] `service_price` guardado en `appointment_services` al crear/editar
- [x] `service_price` cargado desde BD en select de `getAppointments`
- [x] Precios por servicio cargados al abrir edit (no se pierden)
- [x] Bug timezone `openNewForDate` corregido (`toLocalISO`)
- [x] Debug logs eliminados de `createAppointment` + `updateAppointment` (~60 líneas)
- [x] `isAppointmentPastOrCompleted` movido a `utils.ts` (sin duplicados)
- [x] `SERVICE_EMOJIS` / `getServiceEmoji` eliminados (ahora usa `category.icon`)
- [x] Estados muertos eliminados: `expandedService`, `useRouter`, `PriceType`
- [x] `getApptColor` simplificado: solo color de cita, sin lógica de artista
- [x] `ARTIST_COLORS` eliminado de CalendarView

### Migraciones Aplicadas
| Migración | Estado |
|----------|--------|
| 001_categories_dinamicas_parte1 | ✅ |
| 002_categories_dinamicas_parte2 | ✅ |
| 002_add_staff_birthday | ✅ |
| 003_insert_default_founder | ✅ |
| HU-23-roles-dinamicos | ✅ |
| HU-24-comisiones-dinamicas | ✅ |
| HU-25-servicios-mejoras | ✅ |
| HU-26-poblar-servicios-reales | ✅ |
| HU-27-fix-appointment-services | ✅ |
| HU-28-rls-appointment-services | ✅ |
| HU-29-rls-appointment-services-v2 | ✅ |

---

## En Progreso 🔄

| Item | Descripción |
|------|-------------|
| Ninguno | Panel Citas estable. Listo para HUs pendientes. |

---

## Pendientes ⏳

### HUs no implementadas

| HU | Descripción | Prioridad |
|-----|-------------|-----------|
| HU-19 | Resumen financiero | Alta |
| HU-20 | Pagos pendientes | Alta |
| HU-15 | Rendimiento artista (página staff/[id]) | Media |
| HU-22 | Reporte mensual | Media |

### Mejoras técnicas
- [ ] Autenticación/Login
- [ ] Tests
- [ ] CI/CD
- [ ] Documentación de API / guía de deploy

---

## Bloqueantes 🚫

**✅ Ninguno — todos los bloqueantes anteriores resueltos.**

| Bloqueante | Solución |
|------------|----------|
| RLS `appointment_services` (Error 401) | Migración HU-28/HU-29 |
| Columna `service_price` faltante | Migración HU-27 |
| Emojis no aparecían en calendario | `category.icon` en lugar de enum key |
| Timezone bug en click de calendario | `toLocalISO()` en `openNewForDate` |

---

## Changelog Reciente

### [Sesión 11 Mayo 2026 — Pulido completo panel de Citas]

#### Bugs críticos resueltos
- `service_price` nunca se guardaba ni cargaba → corregido en queries + form
- Precios al editar cita se reseteaban a 0 → ahora carga desde `appointment_services`
- Timezone bug: click en calendario a las 3pm mostraba 8pm → `toLocalISO`
- Emojis de servicios siempre mostraban 📋 → cambiado a `category.icon`
- `appointment_services` select no incluía `service_price` → añadido al query

#### UX/UI — Panel de Citas
- Cards en lista: clienta como protagonista, artista en color salon
- Detail ticket-style con header coloreado por estado
- Detail unificado lista ↔ calendario
- Status dropdown eliminado del modal
- Botones contextuales: Cancelar/NoShow solo en `programada`
- Confirm modal al completar cita (muestra saldo pendiente a cobrar)

#### UX/UI — Calendario
- Mes: chips de hora clickeables con color de la cita
- Semana: info progresiva (hora / cliente / artista según altura)
- Citas muertas/pasadas: chip gris + opacity
- Colores por cita (no por artista) — ARTIST_COLORS eliminado
- Toolbar responsive mobile + botón Hoy
- Semana scrollable horizontalmente en mobile
- Popover calendario = mismo ticket que lista (con Iniciar/Completar/Cancelar/NoShow)

#### DateTimePicker
- Reescrito completo: auto-advance, 15min slots, scroll a selección, Hoy shortcut

#### Code cleanup
- ~60 líneas debug logs eliminados
- Funciones duplicadas consolidadas en utils.ts
- Estados e imports muertos eliminados

---

## Próximos Pasos

### Inmediatos
1. Commit de todo el trabajo de esta sesión
2. Prueba end-to-end del flujo completo de citas

### Mediano Plazo (HUs)
1. HU-19 — Resumen financiero
2. HU-20 — Pagos pendientes
3. HU-15 — Rendimiento artista (staff/[id])
4. HU-22 — Reporte mensual

---

## Notas Importantes

### Ambiente
- **URL Supabase**: `https://aldbomizedsoxyluvgog.supabase.co`
- **Founder**: Araceli Zevallos (protegida)
- **Puerto**: 3000 (`npm run dev` / `npm run dev:turbo`)
- **Moneda**: Soles Peruanos (S/)

### Archivos Clave
| Archivo | Descripción |
|---------|-------------|
| `claude.md` / `CLAUDE.md` | Contexto completo del proyecto |
| `supabase/schema.sql` | Esquema completo BD |
| `supabase/migrations/` | Migraciones SQL |
| `specs/` | Especificaciones HU |

### Repo
- **GitHub**: https://github.com/bdvela/CRM-Studio.git
