-- ═══════════════════════════════════════════════════════════
-- HU-23: Migración a roles dinámicos
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- 1. Crear tabla roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(active) WHERE active = TRUE;

-- 2. Seed roles iniciales
INSERT INTO roles (name, description, color) VALUES
  ('Nail Artist', 'Sistema de uñas, manicure, pedicure', '#8B5CF6'),
  ('Lashista', 'Extensiones de pestañas', '#EC4899'),
  ('Pedicurista', 'Pedicure profesional', '#3B82F6'),
  ('Maquillista', 'Maquillaje profesional', '#EF4444'),
  ('Dueña', 'Owner/CEO del salón', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- 3. Trigger updated_at para roles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roles_updated ON roles;
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Agregar columna role_id FK en staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- 5. Migrar datos del enum al nuevo FK
-- Mapeo: nail_artist → Nail Artist, lashista → Lashista, pedicurista → Pedicurista, maquillista → Maquillista, otro → Nail Artist (default)
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'Nail Artist') WHERE role = 'nail_artist';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'Lashista') WHERE role = 'lashista';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'Pedicurista') WHERE role = 'pedicurista';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'Maquillista') WHERE role = 'maquillista';
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'Nail Artist') WHERE role = 'otro' AND role_id IS NULL;

-- 6. Staff sin rol conocido → Nail Artist por defecto
UPDATE staff SET role_id = (SELECT id FROM roles WHERE name = 'Nail Artist' LIMIT 1) WHERE role_id IS NULL;

-- 7. Hacer role_id NOT NULL
ALTER TABLE staff ALTER COLUMN role_id SET NOT NULL;

-- 8. Eliminar columna role y enum type
DROP TRIGGER IF EXISTS trg_staff_updated ON staff;
ALTER TABLE staff DROP COLUMN IF EXISTS role;
DROP TYPE IF EXISTS staff_role CASCADE;

-- 9. Re-crear trigger updated_at para staff
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 10. Actualizar índices
DROP INDEX IF EXISTS idx_staff_role;
CREATE INDEX idx_staff_role ON staff(role_id);

COMMIT;
