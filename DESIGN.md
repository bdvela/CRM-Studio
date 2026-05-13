---
name: CRM Studio Design System
version: 1.0.0
status: active
lastUpdated: 2026-05-12
---

# Design System — Ara Zevallos Studio CRM

## Overview

CRM Studio de Belleza — Sistema de gestión integral para studio de belleza especializado en uñas, pestañas, cejas, pedicura y maquillaje. Diseñado mobile-first para iPhone, iPad y MacBook.

**Moneda**: Soles Peruanos (S/)
**Fundadora**: Araceli Zevallos (protegida, no eliminable)

### Design Principles

1. **Mobile-first**: Base styles para iPhone 17 Pro (393px), escala a iPad Air M4 11" (820px) y MacBook Air M5 13" (1440px)
2. **App nativa**: Comportamiento tipo app — sin zoom en iOS, bottom nav fija, modales bottom sheet en mobile
3. **Consistencia**: Mismos patrones en todos los módulos — cards clickeables, edición por modal, header con acción
4. **Accesibilidad**: Touch targets ≥ 44px, font-size ≥ 16px en inputs, contraste adecuado

---

## Colors

### Primary — Salon (Pink/Rose)

Sistema de colores principal. Usado para acciones primarias, navegación activa, estados seleccionados.

| Token | Hex | Usage |
|-------|-----|-------|
| `salon-50` | `#fdf2f8` | Navegación activa bg, hoy en calendario, hover suave |
| `salon-100` | `#fce7f3` | Bordes suaves, fondos de eventos |
| `salon-200` | `#fbcfe8` | Bordes de botón "Hoy" |
| `salon-300` | `#f9a8d4` | Bordes hover en cards, bordes de eventos |
| `salon-400` | `#f472b6` | Checkbox hover border |
| `salon-500` | `#ec4899` | Focus rings, checkbox checked, fechas seleccionadas |
| `salon-600` | `#db2777` | Botones primarios bg, nav activa |
| `salon-700` | `#be185d` | Botones primarios hover |
| `salon-800` | `#9d174d` | Botones primarios active/pressed |
| `salon-950` | `#500724` | Sombra más oscura |

### Secondary — Accent (Purple/Violet)

Usado para gradientes, acciones secundarias, acentos decorativos.

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-50` | `#faf5ff` | Fondos claros |
| `accent-100` | `#f3e8ff` | Rellenos claros |
| `accent-500` | `#a855f7` | Gradiente inicio (logo) |
| `accent-600` | `#9333ea` | Botones secundarios, gradiente fin (logo) |
| `accent-700` | `#7e22ce` | Hover en botones secundarios |
| `accent-800` | `#6b21a8` | Active/pressed en secundarios |
| `accent-950` | `#3b0764` | Sombra más oscura |

### Neutral — Zinc

| Token | Hex | Usage |
|-------|-----|-------|
| `zinc-50` | `#fafafa` | Fondo de página, inputs deshabilitados, hover |
| `zinc-100` | `#f4f4f5` | Tabs bg, headers modales, fondos scroll |
| `zinc-200` | `#e4e4e7` | Bordes de cards, skeletons, dividers |
| `zinc-300` | `#d4d4d8` | Bordes de inputs/selects |
| `zinc-400` | `#a1a1aa` | Text placeholder, iconos secundarios |
| `zinc-500` | `#71717a` | Texto medio, iconos |
| `zinc-600` | `#52525b` | Ghost buttons, nav items, labels |
| `zinc-700` | `#3f3f46` | Outline buttons, texto labels |
| `zinc-800` | `#27272a` | Texto semi-negrita |
| `zinc-900` | `#18181b` | Texto principal, títulos |

### Semantic — Status Colors

| Status | Background | Text | Usage |
|--------|-----------|------|-------|
| Success | `green-100` | `green-700` | Completada, estados positivos |
| Warning | `amber-100` | `amber-700` | En curso, advertencias |
| Danger | `red-100` | `red-600`/`red-700` | Cancelada, eliminar, errores |
| Info | `blue-100` | `blue-600`/`blue-700` | Programada, información |
| Purple | `purple-100` | `purple-700` | VIP, categorías especiales |
| Pink | `pink-100` | `pink-700` | Cejas, categorías pink |

### Calendar Appointment Colors

| Color | Background | Border | Text |
|-------|-----------|--------|------|
| rose | `bg-rose-100` | `border-rose-300` | `text-rose-700` |
| violet | `bg-violet-100` | `border-violet-300` | `text-violet-700` |
| blue | `bg-blue-100` | `border-blue-300` | `text-blue-700` |
| emerald | `bg-emerald-100` | `border-emerald-300` | `text-emerald-700` |
| amber | `bg-amber-100` | `border-amber-300` | `text-amber-700` |
| cyan | `bg-cyan-100` | `border-cyan-300` | `text-cyan-700` |
| pink | `bg-pink-100` | `border-pink-300` | `text-pink-700` |
| teal | `bg-teal-100` | `border-teal-300` | `text-teal-700` |
| red | `bg-red-100` | `border-red-300` | `text-red-700` |
| orange | `bg-orange-100` | `border-orange-300` | `text-orange-700` |
| indigo | `bg-indigo-100` | `border-indigo-300` | `text-indigo-700` |
| default | `bg-salon-100` | `border-salon-300` | `text-salon-700` |
| cancelled | `bg-zinc-100` | `border-zinc-200` | `text-zinc-400` |

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif;
```

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Badge small, mobile nav labels, calendar event labels |
| `text-xs` | 12px | Labels secundarios, timestamps, error messages |
| `text-sm` | 14px | Nav items, botones (default), badges, card body |
| `text-base` | 16px | **Inputs, body text** — mínimo para iOS (sin zoom) |
| `text-lg` | 18px | Modal titles, header mobile |
| `text-xl` | 20px | Header titles tablet |
| `text-2xl` | 24px | Header titles desktop |
| `text-3xl` | 30px | Stat card values |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-medium` | 500 | Labels, nav, badges, botones |
| `font-semibold` | 600 | Card titles, modal titles, stat values |
| `font-bold` | 700 | Time displays, today number, stat numbers |

### iOS Anti-Zoom Rule

**CRITICAL**: All input fields, textareas, and selects MUST use `text-base` (16px) or `font-size: 16px !important` to prevent iOS auto-zoom. This is enforced globally in `globals.css`:

```css
input[type="text"], input[type="email"], input[type="password"],
input[type="number"], input[type="tel"], input[type="date"],
input[type="time"], input[type="datetime-local"],
textarea, select, button {
  font-size: 16px !important;
}
```

---

## Layout

### Breakpoints

| Breakpoint | Min Width | Dispositivo | Layout |
|-----------|-----------|-------------|--------|
| Base (default) | 0px | iPhone 17 Pro (393px) | Bottom nav, full-width cards, bottom sheet modals |
| `sm` | 640px | iPhone landscape / small tablet | Cards 2-column, modales centrados |
| `md` | 768px | iPad Air M4 11" (820px) | Tablet sidebar drawer, top menu button, no bottom nav |
| `lg` | 1024px | MacBook Air M5 13" (1440px) | Desktop sidebar visible, 3-4 column grids |

### Responsive Patterns

```
Mobile (default)     → Base styles
Tablet (md: 768px)   → Tablet sidebar, wider grids, inline forms
Desktop (lg: 1024px) → Desktop sidebar, wide layouts, 3-4 columns
```

### Sidebar (Desktop `lg:`)

- Width: `w-64` (expanded) / `w-20` (collapsed)
- Background: `bg-white`
- Border: `border-r border-zinc-200`
- Transition: `transition-all duration-300`
- Nav item: `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium`
- Active: `bg-salon-50 text-salon-700`
- Inactive: `text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900`

### Mobile Bottom Nav (`md:hidden`)

- Position: `fixed bottom-0 left-0 right-0`
- Background: `bg-white border-t border-zinc-200`
- Shadow: `shadow-[0_-2px_10px_rgba(0,0,0,0.05)]`
- Item: `flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-lg flex-1`
- Active: `text-salon-600 bg-salon-50`
- Label: `text-[10px] font-medium`

### Tablet Sidebar Drawer (`md:block lg:hidden`)

- Position: `fixed top-0 left-0 h-full w-64`
- Background: `bg-white border-r border-zinc-200 z-50`
- Transform: `translate-x-0` (open) / `-translate-x-full` (closed)
- Overlay: `bg-black/50`
- Menu button: `fixed top-3 left-3 z-30 p-2 rounded-lg bg-white border border-zinc-200 shadow-md`

### Header

- Sticky: `sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-100`
- Padding: `px-3 sm:px-6 md:px-8 py-3 sm:py-4`
- Title: `text-lg sm:text-xl md:text-2xl font-semibold text-zinc-900 truncate`

### Spacing

#### Page Layout

| Pattern | Mobile | Tablet+ |
|---------|--------|---------|
| Header padding | `px-3` | `sm:px-6 md:px-8` |
| Header vertical | `py-3` | `sm:py-4` |
| Content padding | `p-4` | `sm:p-6 md:p-8` |
| Bottom padding | `pb-24` | `md:pb-0` (offset bottom nav) |

#### Component Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `space-y-1` | 4px | Nav items |
| `space-y-1.5` | 6px | Form field spacing |
| `gap-1` | 4px | Tabs, tags, mobile nav |
| `gap-1.5` | 6px | Icon-to-label in nav |
| `gap-2` | 8px | Calendar date picker grids |
| `gap-3` | 12px | Card content, list items |
| `gap-4` | 16px | Card padding, sidebar |

#### Input/Select Padding

| Element | Value |
|---------|-------|
| Input/Select padding | `px-4 py-2.5` |
| Button medium | `px-4 py-2` |
| Button large | `px-6 py-3` |
| Card header/content | `px-5 py-4` |

---

## Elevation & Depth

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Cards (default), selected tab |
| `shadow-md` | Card hover, calendar event hover |
| `shadow-xl` | Select dropdown, modal |
| `shadow-2xl` | Confirm dialog |
| `shadow-[0_-2px_10px_rgba(0,0,0,0.05)]` | Mobile bottom nav |

### Overlays & Backdrops

| Pattern | Usage |
|---------|-------|
| `bg-black/40` | Modal backdrop |
| `bg-black/50` | Tablet sidebar backdrop, confirm dialog backdrop |
| `bg-white/80 backdrop-blur-xl` | Sticky header |
| `bg-gradient-to-br from-salon-500 to-accent-600` | Logo background, stat card gradients |

### Z-Index System

| Value | Usage |
|-------|-------|
| `z-10` | Calendar current-time indicator |
| `z-30` | Sticky header, tablet menu button |
| `z-40` | Mobile bottom nav |
| `z-50` | Modal, confirm dialog, tablet sidebar, select dropdown |

### Focus States

| Element | Ring | Border |
|---------|------|--------|
| Input/Textarea | `focus:ring-2 focus:ring-salon-500` | `focus:border-transparent` |
| Input with prefix | `focus-within:ring-2 focus-within:ring-salon-500` | `focus-within:border-transparent` |
| Select (open) | `ring-2 ring-salon-500` | `border-transparent` |
| Error state | `focus:ring-red-500` | `border-red-500` |

### Transitions

| Pattern | Usage |
|---------|-------|
| `transition-colors` | Botones, nav items, links, close buttons |
| `transition-all` | Cards, sidebar, calendar cells |
| `transition-transform duration-300` | Mobile sidebar slide |
| `animate-spin` | Button loading spinner |
| `animate-pulse` | Skeleton loading |
| `animate-in fade-in-0 zoom-in-95` | Select dropdown open |
| `animate-in fade-in zoom-in-95 duration-200` | Confirm dialog entrance |

---

## Shapes

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-[4px]` | 4px | Calendar event items |
| `rounded-lg` | 8px | Nav items, calendar day cells, time slots, checkboxes |
| `rounded-xl` | 12px | **Primary radius** — Botones, inputs, selects, textareas, modales mobile header |
| `rounded-2xl` | 16px | Cards, modales desktop, stat cards, confirm dialogs, calendar containers |
| `rounded-t-3xl` | 24px | Modal bottom sheet (top corners en mobile) |
| `rounded-full` | 9999px | Badges, avatars, close buttons, today circle |

---

## Components

### Button

**Variants:**

| Variant | Classes |
|---------|---------|
| `primary` | `bg-salon-600 text-white hover:bg-salon-700 active:bg-salon-800` |
| `secondary` | `bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800` |
| `outline` | `border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100` |
| `ghost` | `text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200` |
| `danger` | `bg-red-600 text-white hover:bg-red-700 active:bg-red-800` |

**Sizes:**

| Size | Padding | Text | Icon |
|------|---------|------|------|
| `sm` | `px-3 py-1.5` | `text-sm` | `size-4` |
| `md` | `px-4 py-2` | `text-sm` | `size-5` |
| `lg` | `px-6 py-3` | `text-base` | `size-6` |

**Common:** `inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap`

### Input

- Container: `space-y-1.5`
- Label: `block text-sm font-medium text-zinc-700`
- Input: `w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-base`
- Focus: `focus:outline-none focus:ring-2 focus:ring-salon-500 focus:border-transparent`
- Disabled: `disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed`
- Error: `border-red-500 focus:ring-red-500`

**Moneda (S/)**: Usar posicionamiento absoluto con `pl-12`, NO usar `leftPrefix` del componente Input.

### Select (Custom Dropdown)

- Trigger: `w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base text-left`
- Focus/Open: `ring-2 ring-salon-500 border-transparent`
- Dropdown: `absolute left-0 right-0 z-50 max-h-70 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-xl`
- Selected: `bg-salon-50 text-salon-700`
- Animation: `animate-in fade-in-0 zoom-in-95`

### Modal

- Overlay: `fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4`
- Backdrop: `bg-black/40`
- Content: `w-full sm:max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-2xl`
- Max height: `max-h-[85vh] sm:max-h-[90vh]`
- Header: `sticky top-0 bg-white border-b border-zinc-100 px-4 sm:px-6 py-4`
- Body: `p-4 sm:p-6`
- Close button: Touch target ≥ 44px — usar `p-3` (no `p-2`)

### Card

- Base: `rounded-2xl border border-zinc-200 bg-white shadow-sm`
- Clickable: Agregar `cursor-pointer hover:border-salon-300 hover:shadow-md transition-all`
- Header: `px-5 py-4 border-b border-zinc-100`
- Content: `px-5 py-4`

### Badge

| Variant | Classes |
|---------|---------|
| `default` | `bg-zinc-100 text-zinc-700` |
| `success` | `bg-green-100 text-green-700` |
| `warning` | `bg-amber-100 text-amber-700` |
| `danger` | `bg-red-100 text-red-700` |
| `info` | `bg-blue-100 text-blue-700` |
| `purple` | `bg-purple-100 text-purple-700` |
| `pink` | `bg-pink-100 text-pink-700` |

**Common:** `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

### Tabs

- Container: `flex gap-1 p-1 bg-zinc-100 rounded-xl overflow-x-auto`
- Active tab: `bg-white text-zinc-900 shadow-sm`
- Inactive tab: `text-zinc-500 hover:text-zinc-700`
- Tab common: `flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-1 justify-center`

### StatCard

- Container: `rounded-2xl p-5 text-white bg-gradient-to-br`
- Variants: `from-salon-500 to-salon-600`, `from-accent-500 to-accent-600`, `from-green-500 to-green-600`, `from-blue-500 to-blue-600`
- Value: `text-3xl font-bold tracking-tight`
- Label: `text-sm opacity-80 mt-1`

### Checkbox

- Container: `size-5 rounded-lg border-2 transition-all duration-200`
- Checked: `bg-salon-500 border-salon-500`
- Unchecked: `bg-white border-zinc-300 hover:border-salon-400`
- Check icon: `size-3.5 text-white`

### ConfirmDialog

- Size: `w-full max-w-sm mx-4`
- Icon: `size-12 rounded-2xl` con colores por variante
- Buttons: `flex-1 px-4 py-2.5 text-sm font-medium rounded-xl`
- Variants: `danger` (red), `warning` (amber), `info` (salon)

### Icon Sizing (Lucide)

| Size | Pixel | Usage |
|------|-------|-------|
| `size-3` | 12px | Small inline (date picker clear) |
| `size-3.5` | 14px | Checkmarks, small chevrons |
| `size-4` | 16px | Default (select chevron, nav icons) |
| `size-5` | 20px | Medium (close modal, sidebar nav) |
| `size-6` | 24px | Large (confirm dialog) |
| `size-9` | 36px | Logo avatar (mobile sidebar) |
| `size-10` | 40px | Logo avatar (desktop sidebar) |

---

## Do's and Don'ts

### Do's

✅ Use mobile-first responsive design — base styles for iPhone, scale up with `sm:`, `md:`, `lg:`
✅ Use `text-base` (16px) on ALL inputs to prevent iOS auto-zoom
✅ Use absolute positioning for "S/" currency prefix, not `leftPrefix` prop
✅ Use cards clickeables for all list items — click opens modal for edit
✅ Use `rounded-xl` as primary border radius for inputs/buttons, `rounded-2xl` for cards/modals
✅ Use `bg-salon-*` for primary brand colors, `bg-accent-*` for secondary
✅ Use Server/Client Component pattern: `page.tsx` (Server) + `page-client.tsx` (Client)
✅ Use change detection: disable "Actualizar" button when no changes detected
✅ Use `salon-500` for focus rings on all interactive elements
✅ Use touch targets ≥ 44px for all interactive elements on mobile

### Don'ts

❌ **NO usar shadcn/ui** — Todos los componentes son custom
❌ **NO usar ícono DollarSign** para moneda — Usar texto "S/" con posicionamiento absoluto
❌ **NO font-size < 16px en inputs** — Causa zoom automático en iOS
❌ **NO botones editar/eliminar visibles en cards** — Edición solo por modal
❌ **NO eliminar a Araceli Zevallos** — Founder protegida
❌ **NO flag `--no-turbopack`** — No válido en Next.js 16, usar `next dev` o `--webpack`
❌ **NO `package.json` en root** — Causa loop infinito en Turbopack
❌ **NO usar breakpoints sobre `md` para layout changes que afectan iPad** — iPad (820px) usa `md:` no `sm:`
❌ **NO usar `min-w-[560px]` sin responsive** — Causa horizontal scroll en iPad
❌ **NO usar `text-sm` en campos de búsqueda** — iOS zoom issue