-- ═══════════════════════════════════════════════════════════════
-- HU-33: Row Level Security for all tables
-- Restricts all data access to authenticated users only
-- Must be applied after user is created in Supabase Auth
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Drop old public policies on appointment_services ──────
DROP POLICY IF EXISTS "Allow select for appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Allow insert for appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Allow update for appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Allow delete for appointment_services" ON appointment_services;

-- ─── 2. Enable RLS on all tables (idempotent) ─────────────────
ALTER TABLE roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE services              ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_specialties     ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_commission_overrides ENABLE ROW LEVEL SECURITY;

-- ─── 3. Authenticated-only policies for every table ───────────
-- Each table gets 4 policies: SELECT, INSERT, UPDATE, DELETE
-- Only authenticated users can access any data

-- roles
CREATE POLICY "auth_select" ON roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON roles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON roles FOR DELETE USING (auth.role() = 'authenticated');

-- clients
CREATE POLICY "auth_select" ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON clients FOR DELETE USING (auth.role() = 'authenticated');

-- services
CREATE POLICY "auth_select" ON services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON services FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON services FOR DELETE USING (auth.role() = 'authenticated');

-- staff
CREATE POLICY "auth_select" ON staff FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON staff FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON staff FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON staff FOR DELETE USING (auth.role() = 'authenticated');

-- appointments
CREATE POLICY "auth_select" ON appointments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON appointments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON appointments FOR DELETE USING (auth.role() = 'authenticated');

-- appointment_services
CREATE POLICY "auth_select" ON appointment_services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON appointment_services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON appointment_services FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON appointment_services FOR DELETE USING (auth.role() = 'authenticated');

-- payments
CREATE POLICY "auth_select" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON payments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON payments FOR DELETE USING (auth.role() = 'authenticated');

-- categories
CREATE POLICY "auth_select" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- staff_specialties
CREATE POLICY "auth_select" ON staff_specialties FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON staff_specialties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON staff_specialties FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON staff_specialties FOR DELETE USING (auth.role() = 'authenticated');

-- staff_services
CREATE POLICY "auth_select" ON staff_services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON staff_services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON staff_services FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON staff_services FOR DELETE USING (auth.role() = 'authenticated');

-- staff_commission_overrides
CREATE POLICY "auth_select" ON staff_commission_overrides FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert" ON staff_commission_overrides FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON staff_commission_overrides FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON staff_commission_overrides FOR DELETE USING (auth.role() = 'authenticated');

COMMIT;
