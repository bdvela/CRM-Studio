-- ═══════════════════════════════════════════════════════════════
-- Fix: Agregar service_price a appointment_services
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- 1. Agregar columna service_price a appointment_services
ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS service_price NUMERIC(10, 2);

-- 2. Actualizar valores existentes (usar el precio del servicio si service_price es null)
UPDATE appointment_services asv
SET service_price = s.price
FROM services s
WHERE asv.service_id = s.id AND asv.service_price IS NULL;

COMMIT;
