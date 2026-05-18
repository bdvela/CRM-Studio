-- ═══════════════════════════════════════════════════════════════
-- HU-38: Migrate existing Ara Zevallos data → first tenant
-- Apply order: 4 of 5 (after HU-36, BEFORE HU-37 RLS cutover)
-- ═══════════════════════════════════════════════════════════════
-- CRITICAL: Before running, confirm Ara's auth.users email:
--   SELECT id, email FROM auth.users;
-- If email differs from placeholder below, update the WHERE clause.
-- If Ara's user is not found, the business_members INSERT is skipped
-- with a NOTICE — run the fallback INSERT manually after the migration.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
  v_biz      UUID;
  v_ara_staff UUID;
  v_ara_user  UUID;
  v_orphans   INT;
BEGIN

  -- ─── 1. Create Ara's business ─────────────────────────────────────────────

  INSERT INTO businesses (slug, name, short_name, locale, currency, currency_symbol, phone_country, theme_color, logo_emoji)
  VALUES ('ara', 'Ara Zevallos Studio', 'AZ Studio', 'es-PE', 'PEN', 'S/', '+51', '#db2777', '🌸')
  ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_biz;

  IF v_biz IS NULL THEN
    SELECT id INTO v_biz FROM businesses WHERE slug = 'ara';
  END IF;

  RAISE NOTICE 'Business id: %', v_biz;

  -- ─── 2. Backfill business_id on all existing rows ─────────────────────────

  UPDATE clients                    SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE staff                      SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE appointments               SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE appointment_services       SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE services                   SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE payments                   SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE staff_specialties          SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE staff_services             SET business_id = v_biz WHERE business_id IS NULL;
  UPDATE staff_commission_overrides SET business_id = v_biz WHERE business_id IS NULL;

  -- ─── 3. Sanity check — no orphan rows ────────────────────────────────────

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
    RAISE EXCEPTION 'Backfill incomplete: % rows still have NULL business_id', v_orphans;
  END IF;

  RAISE NOTICE 'All rows backfilled successfully';

  -- ─── 4. Link Ara's staff record + auth user as owner ─────────────────────
  -- Find Ara's staff row by name (from 003_insert_default_founder.sql seed)
  SELECT id INTO v_ara_staff FROM staff WHERE name = 'Araceli Zevallos' LIMIT 1;

  IF v_ara_staff IS NULL THEN
    RAISE NOTICE 'Staff record for Araceli Zevallos not found. Create business_members manually.';
  END IF;

  -- ── IMPORTANT: Replace this email with Ara's real login email ──────────────
  -- Run: SELECT id, email FROM auth.users;  to find the correct email.
  SELECT id INTO v_ara_user FROM auth.users WHERE email = 'araceli@arazevallos.com' LIMIT 1;

  -- Fallback: if exact email not found, try partial match
  IF v_ara_user IS NULL THEN
    SELECT id INTO v_ara_user FROM auth.users LIMIT 1;
    IF v_ara_user IS NOT NULL THEN
      RAISE NOTICE 'Exact email not found. Linking first auth user (id: %) as owner. Verify this is correct.', v_ara_user;
    END IF;
  END IF;

  IF v_ara_user IS NOT NULL THEN
    INSERT INTO business_members (business_id, user_id, staff_id, role)
    VALUES (v_biz, v_ara_user, v_ara_staff, 'owner')
    ON CONFLICT (business_id, user_id) DO NOTHING;
    RAISE NOTICE 'Owner membership created for user %', v_ara_user;
  ELSE
    RAISE NOTICE '────────────────────────────────────────────────────────────';
    RAISE NOTICE 'WARNING: No auth user found. Run this manually after migration:';
    RAISE NOTICE 'INSERT INTO business_members (business_id, user_id, staff_id, role)';
    RAISE NOTICE 'VALUES (''%'', ''<ARA_USER_ID>'', ''%'', ''owner'');', v_biz, v_ara_staff;
    RAISE NOTICE '────────────────────────────────────────────────────────────';
  END IF;

END$$;

COMMIT;

-- ─── Post-migration verification query ───────────────────────────────────────
-- Run after applying to confirm everything is correct:
--
-- SELECT
--   (SELECT COUNT(*) FROM businesses)             AS businesses,
--   (SELECT COUNT(*) FROM business_members)       AS members,
--   (SELECT COUNT(*) FROM clients WHERE business_id IS NOT NULL) AS clients_with_biz,
--   (SELECT COUNT(*) FROM staff   WHERE business_id IS NOT NULL) AS staff_with_biz,
--   (SELECT COUNT(*) FROM appointments WHERE business_id IS NOT NULL) AS appts_with_biz,
--   (SELECT COUNT(*) FROM payments WHERE business_id IS NOT NULL) AS payments_with_biz;
