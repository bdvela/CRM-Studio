-- ═══════════════════════════════════════════════════════════════
-- HU-35: Add nullable business_id to all business-data tables
-- ADDITIVE: existing rows unaffected (NULL until HU-38 backfill)
-- Apply order: 2 of 5 (after HU-34, before HU-36)
-- NOT NULL constraint added in HU-37 (after backfill in HU-38)
-- ═══════════════════════════════════════════════════════════════
-- NOTE: roles and categories are global (system enums) — no business_id needed.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Add business_id (nullable) ──────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE appointment_services
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE staff_specialties
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE staff_services
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE staff_commission_overrides
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

-- ─── 2. Performance indices ──────────────────────────────────────────────────
-- Composite indices on the most queried combinations (business_id + common filter)

CREATE INDEX IF NOT EXISTS idx_clients_biz
  ON clients(business_id);

CREATE INDEX IF NOT EXISTS idx_staff_biz
  ON staff(business_id);

CREATE INDEX IF NOT EXISTS idx_appointments_biz_start
  ON appointments(business_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_biz_status
  ON appointments(business_id, status);

CREATE INDEX IF NOT EXISTS idx_appointment_services_biz
  ON appointment_services(business_id);

CREATE INDEX IF NOT EXISTS idx_services_biz
  ON services(business_id);

CREATE INDEX IF NOT EXISTS idx_payments_biz_date
  ON payments(business_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_biz_type
  ON payments(business_id, type);

CREATE INDEX IF NOT EXISTS idx_staff_specialties_biz
  ON staff_specialties(business_id);

CREATE INDEX IF NOT EXISTS idx_staff_services_biz
  ON staff_services(business_id);

CREATE INDEX IF NOT EXISTS idx_staff_commission_overrides_biz
  ON staff_commission_overrides(business_id);

COMMIT;
