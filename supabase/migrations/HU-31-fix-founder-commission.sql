-- ═══════════════════════════════════════════════════════════════
-- HU-31: Fix — Founder commission goes 100% to Studio
-- ═══════════════════════════════════════════════════════════════
-- La founder (Dueña) ES el Studio. Su comisión como artista es 0,
-- el 100% del ingreso va al founder_share (Studio).
-- Antes estaba al revés: artist_commission = 100%, founder_share = 0.

BEGIN;

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
    -- Caso 1: Sin artista asignado → TODO para Studio (founder_share)
    WHEN st.id IS NULL THEN 0
    -- Caso 2: Artista es Founder/Dueña → 100% va al STUDIO (ella es el negocio)
    WHEN r.name = 'Dueña' OR r.name = 'Founder' THEN 0
    -- Caso 3: Hay override de monto fijo PARA LA FOUNDER
    WHEN sco.founder_fixed_amount IS NOT NULL THEN
      srv.price - LEAST(sco.founder_fixed_amount, srv.price)
    -- Caso 4: Porcentaje normal
    ELSE ROUND(srv.price * st.commission_pct / 100, 2)
  END AS artist_commission,
  CASE
    WHEN st.id IS NULL THEN srv.price
    WHEN r.name = 'Dueña' OR r.name = 'Founder' THEN srv.price
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
