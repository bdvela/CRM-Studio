# Contexto: CRM Studio de Belleza

## Índice
1. [Descripción del Negocio](#descripción-del-negocio)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Módulos Funcionales](#módulos-funcionales)
6. [Patrones UI/UX](#patrones-uiux)
7. [Variables de Entorno](#variables-de-entorno)
8. [Migraciones SQL](#migraciones-sql)
9. [Datos Mock](#datos-mock)

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
- **Turbo Mode**: Disponible (`npm run dev:turbo`)

---

## Arquitectura del Proyecto

### Estructura de Directorios
```
CRM Studio/
├── app/                              # Next.js App (PWA)
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── citas/page.tsx         # Panel de Citas
│   │   │   ├── clientes/page.tsx      # Lista de Clientes
│   │   │   ├── clientes/[id]/page.tsx # Detalle de Cliente
│   │   │   ├── pagos/page.tsx         # Panel de Pagos
│   │   │   ├── reportes/comisiones/   # Reporte de Comisiones
│   │   │   ├── servicios/page.tsx     # Panel de Servicios
│   │   │   └── staff/page.tsx         # Panel de Staff
│   │   ├── components/
│   │   │   ├── layout/shell.tsx       # Sidebar + MobileNav + Header
│   │   │   ├── ui/                    # Button, Input, Modal, etc.
│   │   │   ├── citas/                 # CalendarView, ClientCombobox
│   │   │   ├── confirm/               # ConfirmDialog
│   │   │   └── providers.tsx          # ConfirmProvider
│   │   ├── lib/
│   │   │   ├── db/queries.ts          # Supabase queries + mock
│   │   │   ├── db/mock-data.ts        # Mock data
│   │   │   ├── supabase/client.ts     # Supabase client
│   │   │   └── utils.ts              # formatCurrency, comisiones, etc.
│   │   ├── types/database.ts          # TypeScript types
│   │   └── context/confirm-context.tsx
│   └── public/                        # PWA manifest
├── supabase/
│   ├── schema.sql                     # Esquema completo BD
│   └── migrations/                    # 11 migraciones SQL
├── scripts/                           # DB scripts (clean, insert data)
├── docs/
│   ├── system-design.md               # Arquitectura del sistema
│   ├── status.md                      # Estado del proyecto
│   ├── specs/                         # HUs organizadas por módulo
│   │   ├── 01-clientes/               # HU-01 a HU-05
│   │   ├── 02-servicios/              # HU-06 a HU-08, HU-25
│   │   ├── 03-citas/                  # HU-09 a HU-13
│   │   ├── 04-staff/                  # HU-14, HU-15, HU-23
│   │   ├── 05-pagos/                  # HU-16 a HU-20
│   │   ├── 06-dashboard/              # HU-21, HU-22
│   │   └── README.md                  # Índice de HUs
│   └── reference/                     # Documentos de referencia
└── claude.md                          # Contexto del proyecto (AI)
```

### Rutas Principales
| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard principal (Home) |
| `/citas` | Panel de gestión de citas |
| `/clientes` | Lista de clientas |
| `/clientes/[id]` | Detalle de clienta + historial |
| `/pagos` | Gestión de ingresos/egresos |
| `/reportes/comisiones` | Reporte de comisiones |
| `/servicios` | Gestión de servicios y categorías |
| `/staff` | Gestión de artistas/staff |

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

### Triggers
- `update_updated_at()`: Actualiza automáticamente el campo `updated_at` en todas las tablas

---

## Módulos Funcionales

### 1. Dashboard (`/`)
- Métricas principales del día/mes
- Citas de hoy
- Ingresos/egresos del mes
- Clientas activas

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

#### Componente Clave: CalendarView
- Modos: Mes, Semana, Día, Hoy
- Drag & Drop para mover citas
- Línea de tiempo actual (roja)
- Colores por artista o color personalizado

### 3. Clientes (`/clientes`)
#### Funcionalidades
- **Lista**:
  - Filtro por estado (Todos/Prospecto/Activa/Inactiva/VIP)
  - Filtro por artista
  - Buscador
  - Vista "Todos" agrupada por estado
- **Detalle de Clienta**:
  - Datos personales
  - Historial de citas
  - Estadísticas (total_spent, total_appointments)
- **Estados**:
  - `prospecto`: Clienta nueva, sin citas completadas
  - `activa`: Clienta con citas recientes
  - `inactiva`: Clienta sin citas en mucho tiempo
  - `vip`: Clienta especial

#### Patrón UI
- Cards clickeables (no botones editar/eliminar)
- Edición por modal
- Botón eliminar DENTRO del modal

### 4. Servicios (`/servicios`)
#### Funcionalidades
- **Precio Fijo/Variable**:
  - Fijo: Precio único
  - Variable: Rango (desde/hasta)
- **Pestañas**:
  - Lista de servicios
  - Categorías (CRUD dinámico)
  - Staff (asignar artistas a servicios)
- **Filtro por Categoría**: Select con "Todos" + categorías
- **Artistas Sugeridos**:
  - Prioridad: `staff_services` > `staff_specialties` (por categoría)
  - Auto-selección si solo hay 1 artista sugerido
  - Badge "✨" para artistas sugeridos

#### Patrón UI Precio
- **"S/" como texto superpuesto** con posicionamiento absoluto
- Border: `border-gray-200`
- Padding: `pl-12`
- Font-size: `text-base` (≥ 16px para iOS)

### 5. Staff (`/staff`)
#### Funcionalidades
- **Roles Dinámicos**:
  - Nail Artist, Lashista, Pedicurista, Maquillista, Dueña
  - Cada rol con color personalizado
- **Especialidades**: Por categoría de servicio
- **Comisión**: Porcentaje de comisión
- **Founder Protegida**: Araceli Zevallos no se puede eliminar

#### Patrón UI
- Avatar: `bg-accent-100 text-accent-600`
- Cards clickeables

### 6. Pagos (`/pagos`)
#### Funcionalidades
- **Ingresos**: Ventas de servicios
- **Egresos**: Insumos, alquiler, marketing, comisiones
- Métodos de pago: Efectivo, Tarjeta, Transferencia, Yape/Plin
- Tipos: Reserva, Pago completo, Pago final

### 7. Reportes - Comisiones (`/reportes/comisiones`)
#### Funcionalidades
- Cálculo automático de comisiones
- Lógica:
  - Founder como artista → 100% para artista, 0 para founder
  - Con override → Founder recibe monto fijo
  - Sin override → Porcentaje normal
- Filtro por rango de fechas
- Filtro por artista

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
| `HU-26-poblar-servicios-reales.sql` | `supabase/migrations/` | Poblar servicios reales |

---

## Datos Mock

### Ubicación
- Archivo: `app/src/lib/db/mock-data.ts`

### Bandera de Mock
```typescript
const USE_MOCK = false; // Cambiar a true para usar datos mock
```

### Datos Incluidos
- Staff: Valentina Ríos, Camila Vega, Araceli Zevallos (Founder)
- Clientes: María García, Ana López, Sofía Rodríguez, Carolina Mendoza
- Servicios: Acrílico completo, Esmaltado semi, Pedicura spa, etc.
- Citas: Ejemplos con diferentes estados
- Pagos: Ejemplos de ingresos y egresos

---

## Decisiones Técnicas Clave

### Patrón de Precio
- **No usar `leftPrefix`** de componentes
- **Usar posicionamiento absoluto** para "S/"
- **Consistente** en todo el sistema

### Selección de Artistas
- **Prioridad**: `staff_services` (explícito) > `staff_specialties` (por categoría)
- **Auto-selección**: Si solo hay 1 artista sugerido
- **Badge "✨"**: Para artistas sugeridos

### Toggle de Adelanto
- **Por defecto activado**: S/10 de reserva
- **Pago automático**: Al completar cita se crea pago por diferencia

### RLS (Row Level Security)
- **Estado**: ✅ Resuelto
- **Problema anterior**: Tabla `appointment_services` tenía RLS habilitado pero sin políticas → Error 401 Unauthorized
- **Solución aplicada**: Migraciones `HU-28` y `HU-29` con políticas para SELECT/INSERT/UPDATE/DELETE usando `USING (true)` (tabla de relación N:M que necesita ser accesible)

---

## Especificaciones HU (Historias de Usuario)

### Ubicación
- Directorio: `docs/specs/`

### Implementadas ✓
| HU | Descripción |
|-----|-------------|
| HU-01 | Registrar clienta |
| HU-02 | Buscar clientas |
| HU-03 | Estado clienta |
| HU-04 | Historial clienta |
| HU-05 | Reactivar clientas |
| HU-06 | Gestion servicios |
| HU-07 | Catalogo categoria |
| HU-08 | Actualizar precios |
| HU-09 | Agendar cita |
| HU-10 | Ver agenda |
| HU-11 | Estado cita |
| HU-12 | Solapamientos |
| HU-13 | Resumen cita |
| HU-14 | Registrar staff |
| HU-16 | Calcular comisiones |
| HU-17 | Registrar pagos |
| HU-18 | Registrar egresos |
| HU-21 | Dashboard |
| HU-23 | Roles dinamicos |
| HU-24 | Comisiones dinamicas |
| HU-25 | Panel servicios mejoras |

### Pendientes ⏳
| HU | Descripción |
|-----|-------------|
| HU-15 | Rendimiento artista (página staff/[id]) |
| HU-19 | Resumen financiero |
| HU-20 | Pagos pendientes |
| HU-22 | Reporte mensual |

---

## Issues Conocidos

**✅ Ninguno actualmente - Issues anteriores resueltos:**

| Issue Anterior | Estado | Solución |
|----------------|--------|----------|
| RLS en `appointment_services` (Error 401) | ✅ Fixeado | Migración HU-28/HU-29 |
| Columna `service_price` faltante | ✅ Fixeado | Migración HU-27 |
| Servicios no cargan al editar cita | ✅ Fixeado | Solución de RLS |

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev
npm run dev:turbo    # Con Turbo mode

# Build
npm run build

# Lint
npm run lint

# Start (producción)
npm run start
```

---

## Última Actualización
- **Fecha**: 11 Mayo 2026
- **Commit**: `a1c3cbd6`
- **Rama**: `main`
- **Cambios recientes**: Fix RLS + service_price en `appointment_services`
