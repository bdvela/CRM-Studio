-- ═══════════════════════════════════════════════════════════
-- Migración: Categorías de servicios dinámicas - PARTE 2
-- Ejecutar DESPUÉS de la Parte 1
-- ═══════════════════════════════════════════════════════════

-- 5. Agregar category_id en services
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE RESTRICT;

-- 6. Migrar datos services: enum → FK
UPDATE services SET category_id = (SELECT id FROM categories WHERE slug = 'sistema_unas') WHERE category::text = 'sistema_unas';
UPDATE services SET category_id = (SELECT id FROM categories WHERE slug = 'pedicura') WHERE category::text = 'pedicura';
UPDATE services SET category_id = (SELECT id FROM categories WHERE slug = 'makeup') WHERE category::text = 'makeup';
UPDATE services SET category_id = (SELECT id FROM categories WHERE slug = 'pestanas') WHERE category::text = 'pestanas';
UPDATE services SET category_id = (SELECT id FROM categories WHERE slug = 'cejas') WHERE category::text = 'cejas';
UPDATE services SET category_id = (SELECT id FROM categories LIMIT 1) WHERE category_id IS NULL;

-- 7. Migrar specialties del staff
INSERT INTO staff_specialties (staff_id, category_id)
SELECT s.id, c.id FROM staff s
JOIN categories c ON c.slug = ANY(s.specialties::text[])
ON CONFLICT DO NOTHING;

-- 8. Hacer category_id NOT NULL
ALTER TABLE services ALTER COLUMN category_id SET NOT NULL;

-- 9. Limpiar: eliminar enum y columnas antiguas
DROP TRIGGER IF EXISTS trg_services_updated ON services;
DROP TRIGGER IF EXISTS trg_staff_updated ON staff;

ALTER TABLE services DROP COLUMN IF EXISTS category;
ALTER TABLE staff DROP COLUMN IF EXISTS specialties;
DROP TYPE IF EXISTS service_category CASCADE;

-- 10. Re-crear triggers
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11. Índices
DROP INDEX IF EXISTS idx_services_category;
CREATE INDEX idx_services_category ON services(category_id);
