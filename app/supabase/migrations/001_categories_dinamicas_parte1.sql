-- ═══════════════════════════════════════════════════════════
-- Migración: Categorías de servicios dinámicas
-- Ejecutar TODO ESTE BLOQUE en Supabase SQL Editor (una sola vez)
-- ═══════════════════════════════════════════════════════════

-- 1. Crear tabla categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '📋',
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- 2. Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_categories_updated ON categories;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Insertar categorías iniciales
INSERT INTO categories (name, slug, description, color, icon, sort_order) VALUES
  ('Sistema de uñas', 'sistema_unas', 'Uñas acrílicas, gel, press-on, manicure', '#8B5CF6', '💅', 1),
  ('Pedicura', 'pedicura', 'Pedicure spa, exfoliación, masajes', '#3B82F6', '🦶', 2),
  ('Makeup', 'makeup', 'Maquillaje social, artístico, eventos', '#EC4899', '💄', 3),
  ('Pestañas', 'pestanas', 'Extensiones clásicas, volumen, lifting', '#F97316', '👁️', 4),
  ('Cejas', 'cejas', 'Perfilado, laminado, microblading', '#EAB308', '✨', 5)
ON CONFLICT (slug) DO NOTHING;

-- 4. Tabla staff_specialties (N:M)
CREATE TABLE IF NOT EXISTS staff_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_spec_staff ON staff_specialties(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_spec_category ON staff_specialties(category_id);
