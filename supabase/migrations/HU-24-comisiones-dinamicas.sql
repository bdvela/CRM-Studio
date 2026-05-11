-- ═══════════════════════════════════════════════════════════════
-- HU-24: Sistema de Comisiones Dinámicas
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- 1. Agregar artist_id a appointment_services (cada servicio puede tener su propia artista)
ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES staff(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appt_svc_artist ON appointment_services(artist_id);

-- 2. Tabla de excepciones: monto fijo PARA LA FOUNDER por artista + servicio
--    RN-002: Si existe override, founder_share = fixed_amount, artista = precio - fixed_amount
CREATE TABLE IF NOT EXISTS staff_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  founder_fixed_amount NUMERIC(10, 2) NOT NULL CHECK (founder_fixed_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_sco_staff ON staff_commission_overrides(staff_id);
CREATE INDEX IF NOT EXISTS idx_sco_service ON staff_commission_overrides(service_id);

-- 3. Trigger updated_at para la nueva tabla
DROP TRIGGER IF EXISTS trg_sco_updated ON staff_commission_overrides;
CREATE TRIGGER trg_sco_updated BEFORE UPDATE ON staff_commission_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Vista de detalle de comisiones (precalculada)
--    Lógica:
--    - Founder como artista → artist_commission = precio, founder_share = 0
--    - Con override → founder_share = MIN(fixed_amount, precio), artista = precio - founder_share
--    - Sin override → artist_commission = precio * pct / 100, founder = precio - artist_commission
--    - Sin artista → artist_commission = 0, founder_share = precio
CREATE OR REPLACE VIEW commission_details AS
SELECT
  asv.id AS appointment_service_id,
  asv.appointment_id,
  asv.service_id,
  asv.artist_id,
  srv.price AS service_price,
  srv.name AS service_name,
  st.name AS artist_name,
  st.commission_pct AS artist_commission_pct,
  sco.founder_fixed_amount AS override_founder_fixed_amount,
  r.name AS artist_role_name,
  CASE
    -- Caso 1: Sin artista asignado → TODO para Founder
    WHEN st.id IS NULL THEN 0
    -- Caso 2: Artista es Founder/Dueña → ELLA recibe 100%
    WHEN r.name = 'Dueña' OR r.name = 'Founder' THEN srv.price
    -- Caso 3: Hay override de monto fijo PARA LA FOUNDER
    WHEN sco.founder_fixed_amount IS NOT NULL THEN
      srv.price - LEAST(sco.founder_fixed_amount, srv.price)
    -- Caso 4: Porcentaje normal
    ELSE ROUND(srv.price * st.commission_pct / 100, 2)
  END AS artist_commission,
  CASE
    WHEN st.id IS NULL THEN srv.price
    WHEN r.name = 'Dueña' OR r.name = 'Founder' THEN 0
    WHEN sco.founder_fixed_amount IS NOT NULL THEN
      LEAST(sco.founder_fixed_amount, srv.price)
    ELSE srv.price - ROUND(srv.price * st.commission_pct / 100, 2)
  END AS founder_share
FROM appointment_services asv
JOIN services srv ON srv.id = asv.service_id
LEFT JOIN staff st ON st.id = asv.artist_id
LEFT JOIN roles r ON r.id = st.role_id
LEFT JOIN staff_commission_overrides sco ON sco.staff_id = asv.artist_id AND sco.service_id = asv.service_id;

COMMIT;
