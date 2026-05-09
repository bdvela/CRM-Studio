-- ═══════════════════════════════════════════════════════════════
-- HU-25: Mejoras al Panel de Servicios
-- - Precio fijo o variable (desde/hasta)
-- - Relación explícita staff-servicios (opcional)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- 1. Agregar campos para precio variable a la tabla services
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_from NUMERIC(10,2);
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_to NUMERIC(10,2);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_services_price_type ON services(price_type);

-- 3. Tabla de relación explícita staff-servicios (N:M)
--    Esta tabla permite definir OPCIONALMENTE qué staff puede hacer cada servicio.
--    Si no hay registros para un servicio, se usa la relación por categoría (staff_specialties).
--    Prioridad: staff_services > staff_specialties
CREATE TABLE IF NOT EXISTS staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, service_id)
);

-- 4. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_staff_services_staff ON staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service ON staff_services(service_id);

-- 5. Trigger updated_at para la nueva tabla
DROP TRIGGER IF EXISTS trg_staff_services_updated ON staff_services;
CREATE TRIGGER trg_staff_services_updated BEFORE UPDATE ON staff_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
