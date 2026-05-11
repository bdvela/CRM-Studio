# Especificación: HU-23 — Roles dinámicos para staff

## Historia de usuario
**Como** owner del salón,
**quiero** definir y gestionar roles del staff desde la app sin tocar código,
**para** poder agregar roles como "Dueña" o "CEO" y que reflejen la estructura real de mi equipo.

## Descripción
Actualmente el rol del staff es un enum hardcodeado en la base de datos (`staff_role`). Esto obliga a modificar el esquema SQL cada vez que se necesita un nuevo rol. Se reemplaza el enum por una tabla `roles` que el usuario puede gestionar desde la UI: crear, editar nombre, descripción y color; activar/desactivar roles; y asignarlos al staff. Se migra los datos existentes manteniendo la coherencia.

## Actores
- Owner del salón

## Flujo principal
1. El owner accede a la sección "Staff" → pestaña "Roles"
2. Ve la lista de roles existentes (Nail Artist, Lashista, Pedicurista, Maquillista, Otro)
3. Crea un nuevo rol ingresando: nombre, descripción (opcional), color
4. El rol queda activo por defecto
5. Al registrar/editar staff, el selector de rol muestra los roles disponibles de la tabla

## Flujos alternativos / casos borde
- **Editar nombre de rol**: Se actualiza en todos los staff que lo usan (no se pierden citas ni historial)
- **Desactivar rol con staff asignado**: Se permite desactivar pero se muestra advertencia; el staff mantiene el rol hasta que se reasigne
- **Eliminar rol sin staff**: Se puede eliminar si ningún staff lo tiene asignado
- **Roles por defecto**: Al crear la app, se seedean roles iniciales para que la experiencia no sea vacía

## Reglas de negocio
- RB-01: El nombre del rol es obligatorio y debe ser único
- RB-02: No se pueden eliminar roles que tengan staff asignado
- RB-03: Un rol desactivado no aparece en el selector al crear/editar staff
- RB-04: El staff mantiene su rol aunque esté desactivado (hasta que se reasigne)
- RB-05: El color es opcional; si no se define, se usa un color por defecto

## Criterios de aceptación
- [ ] Puedo crear un rol con nombre, descripción y color
- [ ] Puedo editar nombre, descripción y color de un rol existente
- [ ] Puedo desactivar un rol
- [ ] No puedo eliminar un rol que tenga staff asignado
- [ ] Al registrar staff, veo solo los roles activos en el selector
- [ ] Los roles seedeados iniciales existen: Nail Artist, Lashista, Pedicurista, Maquillista, Dueña
- [ ] Las citas existentes no se rompen tras la migración
- [ ] El campo `staff.role` muestra el nombre del rol (no un UUID)

## Dependencias
- HU-14 (Registrar staff) — se modifica para usar FK en vez de enum
- Tabla `staff` — se altera la columna `role`

## Fuera de alcance
- Permisos/autorizaciones por rol (no hay sistema de auth aún)
- Jerarquía de roles (subordinación)
- Múltiples roles por miembro de staff

---

# System Design Document: HU-23

## Base de datos: Cambios

### Nueva tabla: `roles`

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roles_active ON roles(active) WHERE active = TRUE;

-- Seed data
INSERT INTO roles (name, description, color) VALUES
  ('Nail Artist', 'Sistema de uñas, manicure, pedicure', '#8B5CF6'),
  ('Lashista', 'Extensiones de pestañas', '#EC4899'),
  ('Pedicurista', 'Pedicure profesional', '#3B82F6'),
  ('Maquillista', 'Maquillaje profesional', '#EF4444'),
  ('Dueña', 'Owner/CEO del salón', '#F59E0B');
```

### Alter table: `staff.role`

```sql
-- 1. Agregar columna FK
ALTER TABLE staff ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- 2. Migrar datos del enum al nuevo FK
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'nail_artist')   WHERE role = 'nail_artist';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'lashista')      WHERE role = 'lashista';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'pedicurista')   WHERE role = 'pedicurista';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'maquillista')   WHERE role = 'maquillista';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'otro')          WHERE role = 'otro';

-- 3. Marcar role_id NOT NULL tras migración
ALTER TABLE staff ALTER COLUMN role_id SET NOT NULL;

-- 4. Eliminar enum column y type
DROP TRIGGER IF EXISTS trg_staff_updated ON staff;
ALTER TABLE staff DROP COLUMN role;
DROP TYPE IF EXISTS staff_role CASCADE;

-- 5. Re-crear trigger updated_at
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Actualizar índice
DROP INDEX IF EXISTS idx_staff_role;
CREATE INDEX idx_staff_role ON staff(role_id);
```

### Trigger updated_at para roles

```sql
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Schema resultante (staff)

| Columna | Tipo | Detalle |
|---------|------|---------|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| phone | TEXT | |
| role_id | UUID | FK → roles.id, NOT NULL |
| specialties | service_category[] | |
| commission_pct | NUMERIC(5,2) | Default 0 |
| schedule | TEXT | |
| photo_url | TEXT | |
| active | BOOLEAN | Default TRUE |
| last_commission_paid | DATE | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## Frontend: Cambios necesarios

### `src/types/database.ts`
- Reemplazar `role: staff_role` → `role: { id, name, color }` o `role_id` con join
- Agregar interfaz `Role`

### `src/app/staff/page.tsx`
- Agregar pestaña/tab "Roles" junto a la tabla de staff
- CRUD de roles: crear, editar nombre/color, toggle active
- Validación: nombre único, no eliminar si tiene staff

### `src/components/ui/select.tsx` o nuevo componente
- Selector de roles en el form de staff debe hacer query a tabla `roles` (no enum)
- Mostrar color del rol como badge

### `src/lib/db/queries.ts`
- Agregar `getRoles()`, `createRole()`, `updateRole()`, `toggleRole()`
- Modificar `createStaff()` y `updateStaff()` para usar `role_id`
- Modificar `getStaff()` para hacer JOIN con `roles` y obtener `role.name`

### Vistas existentes
- El badge de rol en tarjetas de staff usa ahora `role.name` y `role.color`
- El filtro por rol en la vista de staff usa `role_id`

## Migration order
1. Crear tabla `roles` + seed data
2. Agregar `role_id` FK en `staff`
3. Migrar datos del enum
4. Hacer `role_id` NOT NULL
5. Eliminar columna `role` y enum type
6. Actualizar índices y triggers
7. Actualizar TypeScript types
8. Actualizar queries
9. Actualizar UI (staff page, select, badges)
