# HU-11: Mejora selección de servicios en citas (Chips + Detalles)

## Problema identificado
La selección actual de servicios usando checkboxes + expansión inline es confusa para el usuario:
- Demasiados elementos visuales al mismo tiempo
- La expansión de cada servicio hace que el formulario crezca mucho
- No es inmediato entender qué servicios están seleccionados
- La interfaz se siente "pesada"

## Solución: Chips + Detalles
Usar un patrón de selección más simple y visual:

### Flujo de usuario
1. **Paso 1 - Seleccionar servicios rápidamente**: Botones tipo "chip" agrupados por categorías. Un click = seleccionar/deseleccionar.
2. **Paso 2 - Configurar detalles**: Los servicios SELECCIONADOS aparecen en una sección inferior, cada uno como tarjeta expandible con artista y precio.

---

## Componentes principales

### 1. Chips de servicios (agrupados por categoría)
```
💅 Sistema de uñas
[ Rubber gel ] [ Acrílicas ] [ Builder gel ] [ Soft gel ]

🦶 Pedicura
[ Pedicura gel ] [ Pedicura Rubber ]
```

#### Comportamiento:
- **Click**: Toggle selección
- **Estado seleccionado**: Fondo `bg-salon-100`, texto `text-salon-700`, borde `border-salon-300`, checkmark `✓` al inicio
- **Estado no seleccionado**: Fondo `bg-gray-50`, texto `text-gray-700`, borde `border-gray-200`
- **Precio en chip**: Mostrar precio abreviado (ej: "S/45" o "S/45-60" para variable)

#### Estilos de chips:
```tsx
// No seleccionado
<button className="px-3 py-1.5 rounded-xl text-sm border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
  Rubber gel · S/45
</button>

// Seleccionado
<button className="px-3 py-1.5 rounded-xl text-sm border border-salon-300 bg-salon-100 text-salon-700 hover:bg-salon-200 transition-colors">
  ✓ Rubber gel · S/45
</button>
```

---

### 2. Sección "Servicios seleccionados"
Aparece **solo si hay al menos 1 servicio seleccionado**.

#### Estado colapsado (default):
```
═══════════════════════════════════════════════════════════
📋 Servicios seleccionados (2)

💅 Rubber gel                    [⚙️ Configurar] [❌]
🦶 Pedicura gel                   [⚙️ Configurar] [❌]

─────────────────────────────────────────────────────────────
⏱️ 120 min   💰 S/ 95.00
```

#### Estado expandido (un servicio):
```
═══════════════════════════════════════════════════════════
📋 Servicios seleccionados (2)

┌─────────────────────────────────────────────────────────┐
│ 💅 Rubber gel                                    [▼]   │
│                                                         │
│ Artista:  [ Valentina Ríos ▼]                         │
│           ─────────────────────────────                │
│           (Sugerida para este servicio)                │
│           (1 de 2 artistas sugeridos)                  │
│                                                         │
│ Precio:   [S/ 45.00  ]  ← editable para TODOS        │
│           ─────────────────────────────                │
│           (Precio sugerido: S/45.00 - S/60.00)       │
│                                                         │
│ Duración: 60 min  ← read-only                         │
│                                                         │
│                                       [❌ Quitar]      │
└─────────────────────────────────────────────────────────┘

🦶 Pedicura gel                               [▶ Expand] [❌]

─────────────────────────────────────────────────────────────
⏱️ 120 min   💰 S/ 95.00  ← actualiza en tiempo real
```

---

## Comportamiento detallado

### Auto-selección de artista
Al seleccionar un servicio:

1. **Obtener artistas sugeridos**:
   - Primero: `staff_services` (asignaciones explícitas al servicio)
   - Fallback: `staff_specialties` (especialidades por categoría)

2. **Auto-seleccionar si hay exactamente 1**:
   - Si `sugeridos.length === 1` → auto-seleccionar ese artista
   - Si `sugeridos.length === 0` → mostrar TODOS los artistas activos, sin auto-selección
   - Si `sugeridos.length > 1` → mostrar solo los sugeridos, sin auto-selección

3. **Badge de sugerencia**:
   - Mostrar "(Sugerida para este servicio)" si el artista seleccionado está en la lista de sugeridos
   - Mostrar "(X de Y artistas sugeridos)" si hay múltiples sugeridos

### Precio editable para TODOS los servicios
| Tipo de precio | Valor por defecto | Comportamiento |
|----------------|-------------------|----------------|
| **Fijo** | `service.price` | Input editable con valor por defecto |
| **Variable** | `service.price_from` (o 0 si null) | Input editable, mostrar "(S/XX - S/YY)" como ayuda |

### Resumen en tiempo real
- **Duración total**: Suma de `duration_min` de servicios seleccionados
- **Precio total**: Suma de `customPrices[svcId]` (o valor por defecto si no hay custom)
- Ambos se actualizan **inmediatamente** al:
  - Seleccionar/deseleccionar un servicio
  - Cambiar el precio de un servicio

---

## Mockups ASCII completos

### Mockup 1: Estado inicial
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔧 Nueva Cita                                                        [X] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Clienta                                                                  │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ [🔍] Buscar o nueva clienta...                                │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ Fecha y hora                                                             │
│ ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│ │ [📅] 25/01/2027         ▼ │  │ [🕐] 10:00               ▼ │    │
│ └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                          │
│ Servicios                                                                │
│ ─────────────────────────────────────────────────────────────────────  │
│ 💅 Sistema de uñas                                                      │
│   [ Rubber gel · S/45-60 ] [ Acrílicas · S/75-120 ]                  │
│   [ Builder gel · S/60-80 ] [ Soft gel · S/70 ]                       │
│                                                                          │
│ 🦶 Pedicura                                                              │
│   [ Pedicura gel · S/40 ] [ Pedicura Rubber · S/50 ]                  │
│                                                                          │
│ 💄 Makeup                                                                │
│   [ Maquillaje social · S/120 ] [ Maquillaje novia · S/200 ]         │
│                                                                          │
│ 👁️ Pestañas                                                              │
│   [ Clásicas · S/100 ] [ Volumen · S/140 ] [ Híbrido · S/120 ]      │
│                                                                          │
│ ✨ Cejas                                                                 │
│   [ Diseño · S/35 ] [ Laminado · S/80 ]                                │
│                                                                          │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│ [Cancelar]                                              [Crear cita ▶] │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mockup 2: Con 2 servicios seleccionados (colapsados)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔧 Nueva Cita                                                        [X] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Clienta                                                                  │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ 👤  Valentina Ríos                                          [X] │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ Fecha y hora                                                             │
│ ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│ │ [📅] 25/01/2027         ▼ │  │ [🕐] 10:00               ▼ │    │
│ └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                          │
│ Servicios                                                                │
│ ─────────────────────────────────────────────────────────────────────  │
│ 💅 Sistema de uñas                                                      │
│   [✓ Rubber gel · S/45-60] [ Acrílicas · S/75-120 ]                  │
│   [ Builder gel · S/60-80 ] [ Soft gel · S/70 ]                       │
│                                                                          │
│ 🦶 Pedicura                                                              │
│   [✓ Pedicura gel · S/40] [ Pedicura Rubber · S/50 ]                  │
│                                                                          │
│ 💄 Makeup                                                                │
│   [ Maquillaje social · S/120 ] [ Maquillaje novia · S/200 ]         │
│                                                                          │
│ ═══════════════════════════════════════════════════════════════════  │
│ 📋 Servicios seleccionados (2)                                          │
│                                                                          │
│   💅 Rubber gel                    [⚙️ Configurar] [❌]              │
│   🦶 Pedicura gel                   [⚙️ Configurar] [❌]              │
│                                                                          │
│ ─────────────────────────────────────────────────────────────────────  │
│ ⏱️ 120 min   💰 S/ 85.00                                              │
│                                                                          │
│ [Cancelar]                                              [Crear cita ▶] │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mockup 3: Con detalles expandidos
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔧 Nueva Cita                                                        [X] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Clienta                                                                  │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ 👤  Valentina Ríos                                          [X] │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ Fecha y hora                                                             │
│ ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│ │ [📅] 25/01/2027         ▼ │  │ [🕐] 10:00               ▼ │    │
│ └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                          │
│ Servicios                                                                │
│ ─────────────────────────────────────────────────────────────────────  │
│ 💅 Sistema de uñas                                                      │
│   [✓ Rubber gel · S/45-60] [ Acrílicas · S/75-120 ]                  │
│                                                                          │
│ 🦶 Pedicura                                                              │
│   [✓ Pedicura gel · S/40] [ Pedicura Rubber · S/50 ]                  │
│                                                                          │
│ ═══════════════════════════════════════════════════════════════════  │
│ 📋 Servicios seleccionados (2)                                          │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 💅 Rubber gel                                                [▼]  │ │
│ │                                                                     │ │
│ │ Artista:                                                           │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ Valentina Ríos                                            ▼ │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │           (Sugerida para este servicio)                           │ │
│ │                                                                     │ │
│ │ Precio:                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ S/ [45.00  ]                                               │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │           (Precio sugerido: S/45.00 - S/60.00)                  │ │
│ │                                                                     │ │
│ │ Duración:  60 min                                                  │ │
│ │                                                                     │ │
│ │                                                  [❌ Quitar]       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 🦶 Pedicura gel                                               [▼]  │ │
│ │                                                                     │ │
│ │ Artista:                                                           │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ Valeria Mendoza                                           ▼ │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │                                                                     │ │
│ │ Precio:                                                            │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ S/ [30.00  ]  ← le puse descuento a amiga               │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │           (Precio fijo: S/40.00)                                  │ │
│ │                                                                     │ │
│ │ Duración:  60 min                                                  │ │
│ │                                                                     │ │
│ │                                                  [❌ Quitar]       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ─────────────────────────────────────────────────────────────────────  │
│ ⏱️ 120 min   💰 S/ 75.00  ← actualizado (45 + 30 = 75)            │
│                                                                          │
│ [Cancelar]                                              [Crear cita ▶] │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Responsividad

### Mobile (iPhone)
- Chips: **envolver** (flex-wrap) en múltiples líneas
- Sección "Servicios seleccionados": **full width**, expandir/colapsar con tap
- Select de artista: **full width**
- Input de precio: **full width** con "S/" como prefijo

### Tablet (iPad Air M4)
- Chips: **fila por categoría** (pueden entrar más por fila)
- Sección "Servicios seleccionados": **full width**
- Opcional: 2 columnas para artista + precio

### Desktop
- Chips: **fila por categoría** (todos en una línea si caben)
- Sección "Servicios seleccionados": **full width**
- Opcional: artista y precio en la misma línea

---

## Cambios en el código

### Archivos a modificar
1. `app/src/app/citas/page.tsx` - Reemplazar sección de selección de servicios

### Nuevas variables de estado
```tsx
const [expandedService, setExpandedService] = useState<string | null>(null);
```

### Funciones a actualizar
1. `getAvailableArtistsForService` - ya existe, reutilizar
2. `calculateTotalPrice` - ya actualizada para usar customPrices siempre

### Componentes nuevos (inline)
1. **ServiceChip** - Botón de chip por servicio
2. **SelectedServiceCard** - Tarjeta expandible para servicio seleccionado

---

## Reglas de negocio a preservar
1. Overlap detection: verificar conflictos de horario para TODOS los artistas
2. Change detection: detectar modificaciones al editar
3. Custom prices: se guardan en `appointment_services.service_price`
4. Título auto-generado: de los nombres de servicios seleccionados

---

## Preguntas resueltas por esta spec
1. **¿Cómo simplificar sin limitar?** → Chips rápidos + detalles solo cuando se necesitan
2. **¿Cómo mostrar sugerencias?** → Badge "(Sugerida para este servicio)"
3. **¿Cómo editar precio en fijo?** → Input siempre editable, con ayuda del valor sugerido
4. **¿Cómo mantener limpia la UI?** → Solo servicios seleccionados se expanden

---

## Prioridad
Alta - esta es la mejora principal de UX para el formulario de citas
