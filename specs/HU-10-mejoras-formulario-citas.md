# HU-10: Mejoras en formulario de citas

## Problemas identificados

1. **Formulario inline de clienta no sigue el estilo de la app**
   - Usa inputs nativos sin labels (diferente a `<Input label="...">`)
   - Usa colores `bg-salon-50` y `border-salon-200` cuando el resto de la app usa `bg-gray-50`
   - Botones nativos sin el componente `<Button>`

2. **Selección de servicios confusa**
   - Lista plana sin agrupación por categorías
   - No hay sugerencia automática de artista
   - No se puede modificar precio en servicios de precio fijo

3. **Precio no modificable**
   - Solo se puede modificar precio en servicios variables
   - Caso de uso: dar descuento a amigas/familiares

---

## Objetivos

1. Alinear `ClientCombobox` con el estilo de la app
2. Hacer la selección de servicios más intuitiva con agrupación por categorías
3. Agregar sugerencia automática de artista (como en el formulario de servicios)
4. Permitir modificación de precio en TODOS los servicios (fijo y variable)

---

## HU-10.1: ClientCombobox alineado al estilo de la app

### Descripción
El formulario inline para crear una clienta nueva desde el modal de citas debe usar los mismos componentes y estilos que el resto de la app.

### Cambios necesarios

1. **Usar componente `<Input>` con labels** en lugar de inputs nativos
2. **Usar componente `<Button>`** en lugar de botones nativos
3. **Usar colores consistentes**:
   - Fondo: `bg-gray-50` en lugar de `bg-salon-50`
   - Borde: `border-gray-200` en lugar de `border-salon-200`
4. **Layout de botones igual al resto**: `[Cancelar] [Crear y continuar]`

### Mockup

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Clienta                                                              [X] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Nueva clienta                                                   [Cerrar]│
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Nombre *                                         [Ana López     ] │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Teléfono (opcional)                            [987 654 321  ] │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────┐  ┌──────────────────────────┐           │
│  │ Email (opcional)                      │ │ Instagram (opcional)              │           │
│  │ [ana@email.com          ] │ │ @analopez                │           │
│  └──────────────────────────┘  └──────────────────────────┘           │
│                                                                          │
│  [Cancelar]                                    [Crear y continuar ✔]  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Reglas de negocio
- Nombre es obligatorio
- Teléfono, Email, Instagram son opcionales
- Status por defecto: `prospecto` (igual que en el resto de la app)
- Al crear, auto-seleccionar la clienta recién creada

---

## HU-10.2: Selección de servicios agrupados por categorías

### Descripción
Los servicios deben mostrarse agrupados por categorías (igual que en la vista "Todos" del panel de Servicios), para facilitar la navegación.

### Cambios necesarios

1. **Agrupar servicios por categoría** en el formulario de citas
2. **Mostrar badge o nombre de categoría** como encabezado de cada grupo
3. **Mantener checkbox + selección múltiple**

### Mockup

```
Servicios
┌──────────────────────────────────────────────────────────────────────────┐
│ 💅 Sistema de uñas                                             (3)      │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ ☑ Rubber gel                    S/45.00 - S/60.00    60 min       │ │
│ │ ☐ Acrílicas                    S/75.00 - S/120.00   120 min      │ │
│ │ ☐ Builder gel                  S/60.00 - S/80.00    60 min       │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ 🦶 Pedicura                                                   (2)      │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ ☐ Pedicura en gel              S/40.00              60 min        │ │
│ │ ☐ Pedicura Rubber             S/50.00              90 min        │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## HU-10.3: Sugerencia automática de artista

### Descripción
Cuando se selecciona un servicio, debe sugerirse automáticamente un artista (igual que en el formulario de edición de servicios), con opción de cambiarlo.

### Lógica de sugerencia

Igual que en Servicios:
1. **Primero buscar en `staff_services`**: si el servicio tiene asignaciones explícitas, sugerir esos artistas
2. **Fallback por categoría**: si no hay asignaciones explícitas, sugerir artistas con la categoría del servicio en sus `staff_specialties`

### Comportamiento

- Al seleccionar un servicio:
  - Si hay 1 artista sugerido: seleccionarlo automáticamente
  - Si hay >1 artista sugerido: no seleccionar ninguno, pero mostrar solo los sugeridos en el select
  - Si no hay artistas sugeridos: mostrar todos los artistas activos
- El artista se puede cambiar en cualquier momento

### Mockup (servicio seleccionado)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ☑ Rubber gel                    S/45.00 - S/60.00    60 min       ↓   │
│                                                                          │
│   Artista: [Valentina Ríos ▼]                                         │
│   Precio:  S/ [45.00  ]  (editable)                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Badge de "sugerido"

Igual que en Servicios: mostrar algún indicador visual de que el artista es sugerido para ese servicio.

---

## HU-10.4: Precio modificable en todos los servicios

### Descripción
Permitir modificar el precio manualmente en TODOS los servicios, tanto de precio fijo como variable.

### Casos de uso
- Dar descuento a amigas/familiares
- Aplicar promoción del día
- Ajustar precio por servicios adicionales no contemplados

### Comportamiento

1. **Precio fijo**:
   - Mostrar input con el valor por defecto del servicio
   - Usuario puede modificarlo a cualquier valor mayor o igual a 0
   
2. **Precio variable**:
   - Mostrar input con valor por defecto = `price_from` (o el mínimo del rango)
   - Placeholder: "Desde S/XX.00"
   - Usuario puede modificarlo

### Mockup

```
Precio fijo:
┌─────────────────────────────────────────┐
│ Precio:  S/ [80.00  ]  ← editable     │
└─────────────────────────────────────────┘

Precio variable:
┌─────────────────────────────────────────┐
│ Precio:  S/ [45.00  ]  ← editable     │
│          (Desde S/45.00 - S/60.00)   │
└─────────────────────────────────────────┘
```

### Reglas de negocio
- El precio modificado se usa para:
  - Calcular `total_price` de la cita
  - Calcular comisiones (artista y founder)
- No hay límite inferior (puede ser S/0.00)
- El valor por defecto siempre es el precio original del servicio

---

## Resumen de HUs

| HU | Descripción | Prioridad |
|----|-------------|-----------|
| HU-10.1 | ClientCombobox alineado al estilo | Alta |
| HU-10.2 | Servicios agrupados por categorías | Alta |
| HU-10.3 | Sugerencia automática de artista | Alta |
| HU-10.4 | Precio modificable en todos los servicios | Media |

---

## Archivos a modificar

1. `app/src/components/citas/ClientCombobox.tsx` - HU-10.1
2. `app/src/app/citas/page.tsx` - HU-10.2, HU-10.3, HU-10.4

---

## Preguntas pendientes

1. ¿Debe haber un límite mínimo para el precio modificable? (ej: no puede ser menor a X valor)
2. ¿Debe guardarse el precio original y el precio modificado por separado en la BD? (para reportes de descuentos)
3. ¿Quién puede modificar precios? ¿Solo Founder? ¿Todos los artistas?

**Nota:** Por ahora implementaremos sin restricciones (cualquier usuario puede modificar, sin límite mínimo, se guarda solo el precio final). Las restricciones de permisos se pueden agregar luego.
