# HU-09: Crear clienta inline desde nueva cita

## Metadata
- **ID:** HU-09
- **Prioridad:** Alta
- **Epic:** Gestión de citas
- **Estimación:** 3-4 puntos

## User Story
**Como** recepcionista o dueña del salón
**Quiero** poder crear una nueva clienta directamente desde el modal de nueva cita
**Para** no perder el contexto ni tener que ir y volver entre pantallas

## Problema Actual
El campo "Clienta" en crear cita es un `<Select>` que solo muestra clientas existentes. Si la clienta es nueva, el flujo actual es:

1. Cerrar el modal de cita
2. Ir a la sección Clientes
3. Crear la clienta
4. Volver a Citas
5. Reabrir el modal de nueva cita
6. Re-seleccionar todos los servicios y datos

**Resultado:** 5 pasos extra, fricción alta, pérdida de contexto, experiencia frustrante.

## Solución Propuesta

Reemplazar el `<Select>` de clienta por un **combobox con búsqueda + creación inline**.

### Flujo Completo

```
1. Usuario abre "Nueva Cita"
2. En el campo "Clienta" empieza a escribir
   a) Si coincide con una existente → la selecciona → sigue normal
   b) Si no existe → aparece opción "＋ Crear nueva: [texto escrito]"
3. Click en "Crear nueva" → se abre mini-form inline en el mismo modal
4. Campos: nombre (prellenado), teléfono, email, Instagram
5. Click "Crear y continuar" → clienta creada en Supabase, se selecciona automáticamente
6. Usuario sigue completando la cita sin interrupción
```

## Estados de UI

### Estado 1: Búsqueda
```
┌─────────────────────────────────────────┐
│ Clienta                                 │
├─────────────────────────────────────────┤
│ 🔍 Buscar o nueva clienta...            │
├─────────────────────────────────────────┤
│ María García                            │
│ Ana López                               │
│ Lucía Torres                            │
│ ─────────────────────────────────────── │
│ ＋ Crear nueva: "María García"          │
└─────────────────────────────────────────┘
```

### Estado 2: Formulario inline
```
┌─────────────────────────────────────────┐
│ ══ Nueva clienta ═══════════════════════│
│                                         │
│  Nombre           María García          │
│  Teléfono (opt)   +51 ...               │
│  Email (opt)      email@ejemplo.com     │
│  Instagram (opt)  @usuario              │
│                                         │
│  [ Cancelar ]    [ Crear y continuar ]  │
└─────────────────────────────────────────┘
```

### Estado 3: Confirmación visual
```
┌─────────────────────────────────────────┐
│ Clienta                                 │
├─────────────────────────────────────────┤
│ ✓ María García (nueva)                  │
└─────────────────────────────────────────┘
```

## Reglas de Negocio

| # | Regla | Detalle |
|---|-------|---------|
| R1 | Nombre obligatorio | Viene prellenado del texto de búsqueda |
| R2 | Teléfono opcional | No bloquea la creación |
| R3 | Email opcional | No bloquea la creación |
| R4 | Instagram opcional | No bloquea la creación |
| R5 | Status por defecto | `prospecto` al crear desde cita |
| R6 | Duplicado por nombre | Si ya existe clienta con mismo nombre, mostrar advertencia con opción de seleccionarla |
| R7 | Selección automática | Tras crear, la nueva clienta queda seleccionada en el campo |
| R8 | Sin salir del modal | Todo ocurre dentro del mismo modal de cita |

## Componentes Nuevos

### `ClientCombobox`
Nuevo componente reemplaza el `<Select>` actual de clienta.

**Props:**
```typescript
interface ClientComboboxProps {
  value: string;              // client ID seleccionado
  onChange: (id: string) => void;
  onNewClientCreated: (client: Client) => void;
}
```

**Comportamiento:**
- Input con debounce de 300ms para filtrar
- Dropdown con resultados + opción "Crear nueva"
- Al seleccionar "Crear nueva" → muestra mini-form inline
- Al crear → llama `createClient()`, cierra form, selecciona la nueva clienta
- Si hay duplicado exacto por nombre → muestra toast con opción de seleccionar existente

**Dependencias:**
- `getClients()` — para la lista de clientas
- `createClient()` — para crear la nueva
- No requiere librerías nuevas (usa estado local)

## Cambios en Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/citas/ClientCombobox.tsx` | **Nuevo** componente principal |
| `src/app/citas/page.tsx` | Reemplazar `<Select>` por `<ClientCombobox>`, remover import de `getAllClientsForSelect` |

## Criterios de Aceptación

- [ ] El campo de clienta permite buscar por nombre, teléfono o Instagram
- [ ] Al escribir un nombre inexistente aparece la opción "Crear nueva"
- [ ] El mini-form muestra nombre prellenado + campos opcionales
- [ ] Al crear, la clienta se guarda en Supabase con status `prospecto`
- [ ] Tras crear, la nueva clienta queda seleccionada automáticamente
- [ ] Si existe duplicado por nombre, se advierte sin bloquear
- [ ] El flujo completo ocurre sin cerrar el modal de cita
- [ ] Funciona correctamente en mobile (pantalla de iPhone)
- [ ] Si hay error de red, se muestra mensaje sin perder el texto escrito

## Mock de Datos (Testing)

| Escenario | Input | Resultado esperado |
|-----------|-------|-------------------|
| Clienta existente | Escribe "María" | Muestra "María García" en dropdown |
| Clienta nueva | Escribe "Valentina Diaz" | Muestra "＋ Crear nueva: Valentina Diaz" |
| Duplicado | Escribe "Ana López" (ya existe) | Muestra existente + advertencia si intenta crear |
| Sin datos | Campo vacío | Muestra "Seleccionar clienta..." |
| Error de red | Fallo en createClient | Toast de error, form se mantiene con datos |
