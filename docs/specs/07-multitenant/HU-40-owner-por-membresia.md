# Especificación: HU-40 — Identificación de Owner por Membresía

## Historia de usuario
Como plataforma multi-tenant, necesito que la lógica de "quién es el dueño del negocio" esté basada en el rol de membresía y no en el nombre del rol de staff ('Dueña' / 'Founder') para que funcione correctamente para cualquier negocio, independientemente de cómo nombren sus roles.

## Descripción
Actualmente el sistema identifica al "dueño" comparando strings: `r.name === 'Dueña' || r.name === 'Founder'`. Esto rompe en multi-tenancy: otro negocio puede llamar a su dueña "Jefa", "CEO" o "Propietaria". La nueva lógica usa `business_members.role = 'owner'` como fuente de verdad. La vista SQL `commission_details` ya fue actualizada (HU-36). Esta HU cubre los cambios en el frontend TypeScript.

## Actores
- **Sistema**: la lógica de negocio que identifica al owner
- **Owner / Admin / Staff**: usuarios afectados por los permisos derivados de esta identificación

## Precondiciones
- `business_members.role` existe y tiene valores: `owner | admin | staff`
- La tabla `staff` tiene filas vinculadas a `business_members` vía `staff_id`
- La view `commission_details` ya incluye columna `artist_is_owner` (HU-36)

## Archivos a modificar

### 1. `src/components/staff/types.ts`
- Eliminar función `isOwnerRoleName(roleName: string): boolean`
- Agregar campo `is_owner: boolean` a la interfaz `StaffWithDetails` (joineado desde `business_members`)

### 2. `src/lib/db/queries.ts` — `getStaff` y `getStaffById`
- Agregar join `business_members!staff_id(role)` al select
- Mapear: `is_owner: bm?.role === 'owner'`

### 3. `src/app/staff/page-client.tsx`
- Reemplazar `isOwnerRoleName(member.role?.name)` con `member.is_owner`
- Reemplazar `isOwnerMember(member)` con `member.is_owner`
- La protección de eliminación usa `member.is_owner`

### 4. `src/components/staff/StaffDetailModal.tsx`
- Botón "Eliminar" oculto cuando `member.is_owner === true`

### 5. `src/components/staff/StaffFormModal.tsx`
- El filtro que excluye el rol `'Dueña'` del selector de roles debe eliminarse — en multi-tenancy cualquier rol puede asignarse
- La protección ahora viene de `is_owner` en `business_members`, no del nombre del rol

### 6. `src/app/pagos/_tabs/comisiones-tab.tsx`
- `isFounderRow` reemplazado por `r.artist_is_owner` (nueva columna de `commission_details`)
- La lógica de display (mostrar `total_service_revenue` vs `total_founder_share`) usa el nuevo campo

### 7. Componente de comisiones en citas
- Cualquier referencia a `'Dueña'` o `'Founder'` en comparación de strings → `artist_is_owner`

## Flujo principal — lógica de ownership

**Antes (roto en multi-tenant):**
```
isOwner = staff.role.name === 'Dueña' || staff.role.name === 'Founder'
```

**Después (correcto):**
```
isOwner = business_members.role === 'owner' WHERE staff_id = staff.id
```

El staff puede tener cualquier rol de título (Dueña, Jefa, CEO, Propietaria) — lo que importa es su membresía.

## Reglas de negocio

- Un negocio tiene exactamente 1 `owner` en `business_members` (constraint en DB)
- El owner no puede ser eliminado como miembro del negocio
- El owner no puede ser eliminado como registro de staff
- El rol de título del staff (Dueña, Nail Artist, etc.) es solo estético — no determina permisos
- La comisión del owner sigue siendo 0% de artist_commission y 100% de founder_share (lógica en view `commission_details` via `artist_is_owner`)

## Criterios de aceptación

- [ ] `isOwnerRoleName()` eliminado del codebase (0 referencias)
- [ ] `getStaff()` y `getStaffById()` retornan `is_owner: boolean` en cada registro
- [ ] Botón eliminar oculto para cualquier staff con `is_owner = true`, sin importar nombre del rol
- [ ] Filtro de rol `'Dueña'` eliminado del formulario de staff — todos los roles son asignables
- [ ] `comisiones-tab.tsx` usa `r.artist_is_owner` sin comparar strings de nombre
- [ ] En un negocio donde el dueño se llama "Jefa", la comisión funciona igual que con "Dueña"
- [ ] `0` referencias a `'Dueña'` o `'Founder'` en lógica de comparación TypeScript (solo pueden aparecer como datos de ejemplo o en seeds)
- [ ] TypeScript compile sin errores (`npx tsc --noEmit`)

## Fuera de alcance
- Permitir transferir el rol de owner a otro miembro (post-MVP)
- Múltiples owners por negocio (el modelo es exactamente 1 owner)
