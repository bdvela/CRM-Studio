-- ═══════════════════════════════════════════════════════════════
-- HU-37: Tenant RLS cutover — the production cutover migration
-- Apply order: 5 of 5 (LAST — only after HU-38 backfill succeeds)
-- ═══════════════════════════════════════════════════════════════
-- PREREQUISITE: All rows must have business_id set (run HU-38 first).
-- ROLLBACK SQL (keep handy):
--   See end of this file for rollback instructions.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─── 0. Guard: abort if any row still missing business_id ────────────────────

DO $$
DECLARE v_orphans INT;
BEGIN
  SELECT COUNT(*) INTO v_orphans FROM (
    SELECT 1 FROM clients               WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM staff                 WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM appointments          WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM appointment_services  WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM services              WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM payments              WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM staff_specialties     WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM staff_services        WHERE business_id IS NULL UNION ALL
    SELECT 1 FROM staff_commission_overrides WHERE business_id IS NULL
  ) s;

  IF v_orphans > 0 THEN
    RAISE EXCEPTION
      'ABORT: % rows have NULL business_id. Run HU-38 backfill migration first.', v_orphans;
  END IF;
END$$;

-- ─── 1. Enforce NOT NULL on business_id ──────────────────────────────────────

ALTER TABLE clients                    ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE staff                      ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE appointments               ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE appointment_services       ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE services                   ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE payments                   ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE staff_specialties          ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE staff_services             ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE staff_commission_overrides ALTER COLUMN business_id SET NOT NULL;

-- ─── 2. Drop old global auth_* policies (HU-33) ──────────────────────────────

DO $$
DECLARE
  t    TEXT;
  op   TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','services','staff','appointments','appointment_services',
    'payments','staff_specialties','staff_services','staff_commission_overrides'
  ] LOOP
    FOREACH op IN ARRAY ARRAY['auth_select','auth_insert','auth_update','auth_delete'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', op, t);
    END LOOP;
  END LOOP;
END$$;

-- Also drop from roles/categories (keep them globally readable by authenticated users)
DROP POLICY IF EXISTS "auth_select" ON roles;
DROP POLICY IF EXISTS "auth_insert" ON roles;
DROP POLICY IF EXISTS "auth_update" ON roles;
DROP POLICY IF EXISTS "auth_delete" ON roles;
DROP POLICY IF EXISTS "auth_select" ON categories;
DROP POLICY IF EXISTS "auth_insert" ON categories;
DROP POLICY IF EXISTS "auth_update" ON categories;
DROP POLICY IF EXISTS "auth_delete" ON categories;

-- ─── 3. Tenant-isolated policies for all business-data tables ────────────────
-- Pattern:
--   SELECT: any member of the business
--   INSERT/UPDATE/DELETE: only owner or admin
-- Special case for appointments: staff can update appointments where they are the artist

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','services','staff','appointment_services',
    'payments','staff_specialties','staff_services','staff_commission_overrides'
  ] LOOP
    EXECUTE format($f$
      CREATE POLICY tenant_select ON %I FOR SELECT
        USING (is_member_of(business_id));

      CREATE POLICY tenant_insert ON %I FOR INSERT
        WITH CHECK (
          is_member_of(business_id)
          AND member_role_in(business_id) IN ('owner', 'admin')
        );

      CREATE POLICY tenant_update ON %I FOR UPDATE
        USING (
          is_member_of(business_id)
          AND member_role_in(business_id) IN ('owner', 'admin')
        )
        WITH CHECK (is_member_of(business_id));

      CREATE POLICY tenant_delete ON %I FOR DELETE
        USING (
          is_member_of(business_id)
          AND member_role_in(business_id) IN ('owner', 'admin')
        );
    $f$, t, t, t, t);
  END LOOP;
END$$;

-- appointments: separate policy so staff can update their own appointments
CREATE POLICY tenant_select ON appointments FOR SELECT
  USING (is_member_of(business_id));

CREATE POLICY tenant_insert ON appointments FOR INSERT
  WITH CHECK (
    is_member_of(business_id)
    AND member_role_in(business_id) IN ('owner', 'admin')
  );

-- owner/admin can update any appointment in their business
CREATE POLICY tenant_update_admin ON appointments FOR UPDATE
  USING (
    is_member_of(business_id)
    AND member_role_in(business_id) IN ('owner', 'admin')
  )
  WITH CHECK (is_member_of(business_id));

-- staff can update appointments they are assigned to as artist
CREATE POLICY tenant_update_staff_own ON appointments FOR UPDATE
  USING (
    is_member_of(business_id)
    AND member_role_in(business_id) = 'staff'
    AND artist_id IN (
      SELECT staff_id FROM business_members
      WHERE user_id = auth.uid() AND business_id = appointments.business_id
    )
  )
  WITH CHECK (is_member_of(business_id));

CREATE POLICY tenant_delete ON appointments FOR DELETE
  USING (
    is_member_of(business_id)
    AND member_role_in(business_id) IN ('owner', 'admin')
  );

-- ─── 4. Global tables: roles + categories remain accessible to all members ───
-- Any authenticated user in the system can READ them (they're system enums).
-- Only owner/admin can modify. Since they have no business_id, we use simpler auth checks.

CREATE POLICY auth_select ON roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY auth_insert ON roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY auth_update ON roles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY auth_delete ON roles FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY auth_select ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY auth_insert ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY auth_update ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY auth_delete ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- ─── 5. Enable RLS + policies on new tenant tables ───────────────────────────

ALTER TABLE businesses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations      ENABLE ROW LEVEL SECURITY;

-- businesses: members can read; owner/admin can update; INSERT via create_business_with_owner RPC
CREATE POLICY biz_select ON businesses FOR SELECT
  USING (is_member_of(id));

CREATE POLICY biz_update ON businesses FOR UPDATE
  USING (member_role_in(id) IN ('owner', 'admin'))
  WITH CHECK (member_role_in(id) IN ('owner', 'admin'));

-- business_members: all members can read; only owner can manage
CREATE POLICY bm_select ON business_members FOR SELECT
  USING (is_member_of(business_id));

CREATE POLICY bm_insert ON business_members FOR INSERT
  WITH CHECK (member_role_in(business_id) = 'owner');

CREATE POLICY bm_update ON business_members FOR UPDATE
  USING (member_role_in(business_id) = 'owner')
  WITH CHECK (member_role_in(business_id) = 'owner');

CREATE POLICY bm_delete ON business_members FOR DELETE
  USING (member_role_in(business_id) = 'owner');

-- invitations: owner/admin can manage; anyone with a valid token can read (via accept_invitation RPC)
CREATE POLICY inv_select ON invitations FOR SELECT
  USING (is_member_of(business_id));

CREATE POLICY inv_insert ON invitations FOR INSERT
  WITH CHECK (member_role_in(business_id) IN ('owner', 'admin'));

CREATE POLICY inv_update ON invitations FOR UPDATE
  USING (member_role_in(business_id) IN ('owner', 'admin'))
  WITH CHECK (member_role_in(business_id) IN ('owner', 'admin'));

CREATE POLICY inv_delete ON invitations FOR DELETE
  USING (member_role_in(business_id) IN ('owner', 'admin'));

-- ─── 6. Update pg_cron eval_client_inactivity to be tenant-scoped ────────────

CREATE OR REPLACE FUNCTION eval_client_inactivity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_threshold_date DATE;
  v_count          INT;
BEGIN
  v_threshold_date := CURRENT_DATE - INTERVAL '60 days';

  WITH stale_clients AS (
    SELECT c.id
    FROM   clients c
    JOIN   client_stats cs ON cs.id = c.id
    WHERE  c.status IN ('activa', 'vip')
    AND    c.business_id IS NOT NULL
    AND    (
      (cs.last_visit IS NOT NULL AND cs.last_visit < v_threshold_date)
      OR cs.last_visit IS NULL
    )
  )
  UPDATE clients
  SET    status     = 'inactiva',
         updated_at = NOW()
  WHERE  id IN (SELECT id FROM stale_clients);

  GET DIAGNOSTICS v_count = ROW_COUNT;
END;
$$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK INSTRUCTIONS (if something goes wrong)
-- Run these to restore the HU-33 auth_* policies:
-- ═══════════════════════════════════════════════════════════════
--
-- DO $$
-- DECLARE t TEXT;
-- BEGIN
--   FOREACH t IN ARRAY ARRAY['clients','services','staff','appointments',
--     'appointment_services','payments','staff_specialties','staff_services',
--     'staff_commission_overrides'] LOOP
--     FOREACH op IN ARRAY ARRAY['tenant_select','tenant_insert','tenant_update',
--       'tenant_delete','tenant_update_admin','tenant_update_staff_own'] LOOP
--       EXECUTE format('DROP POLICY IF EXISTS %I ON %I', op, t);
--     END LOOP;
--     EXECUTE format($f$
--       CREATE POLICY "auth_select" ON %I FOR SELECT USING (auth.role() = 'authenticated');
--       CREATE POLICY "auth_insert" ON %I FOR INSERT WITH CHECK (auth.role() = 'authenticated');
--       CREATE POLICY "auth_update" ON %I FOR UPDATE USING (auth.role() = 'authenticated');
--       CREATE POLICY "auth_delete" ON %I FOR DELETE USING (auth.role() = 'authenticated');
--     $f$, t, t, t, t);
--   END LOOP;
-- END$$;
--
-- Also re-add NOT NULL removal if needed:
--   ALTER TABLE clients ALTER COLUMN business_id DROP NOT NULL;
--   (repeat for all 9 tables)
