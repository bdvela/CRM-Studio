-- ═══════════════════════════════════════════════════════════════
-- HU-36: Tenant-aware commission_details view
-- Replaces role-name matching ('Dueña' / 'Founder') with
-- business_members.role = 'owner' for per-tenant owner identification.
-- Adds artist_is_owner boolean column consumed by frontend.
-- Apply order: 3 of 5 (after HU-35, before HU-38)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- DROP first: CREATE OR REPLACE can't add columns mid-view (shifts column positions)
DROP VIEW IF EXISTS commission_details;

CREATE VIEW commission_details AS
SELECT
  asv.id                              AS appointment_service_id,
  asv.appointment_id,
  asv.service_id,
  asv.artist_id,
  asv.business_id,
  srv.price                           AS service_price,
  srv.name                            AS service_name,
  st.name                             AS artist_name,
  st.commission_pct                   AS artist_commission_pct,
  sco.founder_fixed_amount            AS override_founder_fixed_amount,
  r.name                              AS artist_role_name,
  -- NEW: owner identified by membership role, not role name string
  COALESCE(bm.role = 'owner', FALSE)  AS artist_is_owner,
  CASE
    -- Case 1: No artist assigned → all revenue goes to business (founder_share)
    WHEN st.id IS NULL                              THEN 0
    -- Case 2: Artist is the business owner → 100% goes to business
    WHEN COALESCE(bm.role = 'owner', FALSE)         THEN 0
    -- Case 3: Fixed-amount override for founder share
    WHEN sco.founder_fixed_amount IS NOT NULL       THEN
      srv.price - LEAST(sco.founder_fixed_amount, srv.price)
    -- Case 4: Standard percentage commission
    ELSE ROUND(srv.price * st.commission_pct / 100, 2)
  END AS artist_commission,
  CASE
    WHEN st.id IS NULL                              THEN srv.price
    WHEN COALESCE(bm.role = 'owner', FALSE)         THEN srv.price
    WHEN sco.founder_fixed_amount IS NOT NULL       THEN
      LEAST(sco.founder_fixed_amount, srv.price)
    ELSE srv.price - ROUND(srv.price * st.commission_pct / 100, 2)
  END AS founder_share
FROM appointment_services asv
JOIN  services srv ON srv.id = asv.service_id
LEFT JOIN staff st  ON st.id  = asv.artist_id
LEFT JOIN roles r   ON r.id   = st.role_id
LEFT JOIN staff_commission_overrides sco
       ON sco.staff_id   = asv.artist_id
      AND sco.service_id = asv.service_id
-- JOIN business_members to determine owner status per tenant
LEFT JOIN business_members bm
       ON bm.staff_id   = st.id
      AND bm.business_id = asv.business_id;

COMMIT;
