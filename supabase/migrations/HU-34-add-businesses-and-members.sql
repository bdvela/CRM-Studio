-- ═══════════════════════════════════════════════════════════════
-- HU-34: Multi-tenant foundation — businesses, business_members, invitations
-- ADDITIVE: no existing tables are touched
-- Apply order: 1 of 5 (before HU-35)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─── Permission enum ─────────────────────────────────────────────────────────

CREATE TYPE member_role AS ENUM ('owner', 'admin', 'staff');

-- ─── businesses ──────────────────────────────────────────────────────────────

CREATE TABLE businesses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  short_name      TEXT,
  locale          TEXT        NOT NULL DEFAULT 'es-PE',
  currency        TEXT        NOT NULL DEFAULT 'PEN',
  currency_symbol TEXT        NOT NULL DEFAULT 'S/',
  phone_country   TEXT        NOT NULL DEFAULT '+51',
  theme_color     TEXT                 DEFAULT '#db2777',
  logo_emoji      TEXT                 DEFAULT '🌸',
  active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE businesses ADD CONSTRAINT slug_format
  CHECK (slug ~ '^[a-z0-9](?:[a-z0-9\-]{1,28}[a-z0-9])?$');

CREATE INDEX idx_businesses_slug   ON businesses(slug)   WHERE active = TRUE;
CREATE INDEX idx_businesses_active ON businesses(active)  WHERE active = TRUE;

CREATE TRIGGER trg_businesses_updated BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── business_members ────────────────────────────────────────────────────────

CREATE TABLE business_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID        NOT NULL REFERENCES businesses(id)   ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  -- staff_id links the auth user to a staff record (nullable: owner may sign up before creating their staff row)
  staff_id      UUID                 REFERENCES staff(id)        ON DELETE SET NULL,
  role          member_role NOT NULL,
  invited_by    UUID                 REFERENCES auth.users(id),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, user_id)
);

CREATE INDEX idx_members_user_id     ON business_members(user_id);
CREATE INDEX idx_members_business_id ON business_members(business_id);
CREATE INDEX idx_members_staff_id    ON business_members(staff_id) WHERE staff_id IS NOT NULL;

-- ─── invitations ─────────────────────────────────────────────────────────────

CREATE TABLE invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  role        member_role NOT NULL DEFAULT 'staff',
  staff_id    UUID                 REFERENCES staff(id) ON DELETE SET NULL,
  token       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  invited_by  UUID                 REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token      ON invitations(token)       WHERE accepted_at IS NULL;
CREATE INDEX idx_invitations_email      ON invitations(email);
CREATE INDEX idx_invitations_business   ON invitations(business_id);

-- ─── RLS helper functions (SECURITY DEFINER — run as owner, bypass per-row RLS) ──

-- Returns the business_id for the current user (first membership, ordered by join time).
-- Middleware should prefer reading business_id from the subdomain, not this function.
-- This is a fallback used in queries that don't have an explicit business_id.
CREATE OR REPLACE FUNCTION current_business_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id
  FROM   business_members
  WHERE  user_id = auth.uid()
  ORDER  BY joined_at
  LIMIT  1;
$$;

-- Returns TRUE if the current user belongs to business b.
CREATE OR REPLACE FUNCTION is_member_of(b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE  business_id = b
    AND    user_id     = auth.uid()
  );
$$;

-- Returns the member_role the current user has in business b (NULL if not a member).
CREATE OR REPLACE FUNCTION member_role_in(b UUID)
RETURNS member_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM   business_members
  WHERE  business_id = b
  AND    user_id     = auth.uid()
  LIMIT  1;
$$;

-- ─── Signup RPC: creates business + first staff row + owner membership atomically ──

CREATE OR REPLACE FUNCTION create_business_with_owner(
  p_slug            TEXT,
  p_name            TEXT,
  p_short_name      TEXT    DEFAULT NULL,
  p_locale          TEXT    DEFAULT 'es-PE',
  p_currency        TEXT    DEFAULT 'PEN',
  p_currency_symbol TEXT    DEFAULT 'S/',
  p_phone_country   TEXT    DEFAULT '+51'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      UUID := auth.uid();
  v_biz      UUID;
  v_role_id  UUID;
  v_staff_id UUID;
  reserved   TEXT[] := ARRAY['www','app','api','admin','auth','static','assets','mail','billing','support'];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_slug = ANY(reserved) THEN
    RAISE EXCEPTION 'slug "%" is reserved', p_slug;
  END IF;

  INSERT INTO businesses (slug, name, short_name, locale, currency, currency_symbol, phone_country)
  VALUES (p_slug, p_name, COALESCE(p_short_name, p_name), p_locale, p_currency, p_currency_symbol, p_phone_country)
  RETURNING id INTO v_biz;

  -- Pick the 'Dueña' role for the owner staff record; fall back to any role if not found
  SELECT id INTO v_role_id FROM roles WHERE name = 'Dueña' LIMIT 1;
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM roles WHERE active = TRUE ORDER BY name LIMIT 1;
  END IF;

  INSERT INTO staff (business_id, name, role_id, commission_pct, active)
  VALUES (v_biz, p_name, v_role_id, 100.00, TRUE)
  RETURNING id INTO v_staff_id;

  INSERT INTO business_members (business_id, user_id, staff_id, role)
  VALUES (v_biz, v_uid, v_staff_id, 'owner');

  RETURN v_biz;
END;
$$;

REVOKE ALL    ON FUNCTION create_business_with_owner FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION create_business_with_owner TO authenticated;

-- ─── Invitation accept RPC ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION accept_invitation(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv invitations;
BEGIN
  SELECT * INTO v_inv
  FROM   invitations
  WHERE  token       = p_token
  AND    accepted_at IS NULL
  AND    expires_at  > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired invitation token';
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'must be authenticated to accept invitation';
  END IF;

  INSERT INTO business_members (business_id, user_id, staff_id, role, invited_by)
  VALUES (v_inv.business_id, auth.uid(), v_inv.staff_id, v_inv.role, v_inv.invited_by)
  ON CONFLICT (business_id, user_id) DO NOTHING;

  UPDATE invitations SET accepted_at = NOW() WHERE id = v_inv.id;

  RETURN v_inv.business_id;
END;
$$;

REVOKE ALL    ON FUNCTION accept_invitation FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION accept_invitation TO authenticated;

-- ─── Public branding RPC (used on login page before auth) ───────────────────

CREATE OR REPLACE FUNCTION get_business_branding(p_slug TEXT)
RETURNS TABLE (
  name            TEXT,
  short_name      TEXT,
  logo_emoji      TEXT,
  theme_color     TEXT,
  currency_symbol TEXT,
  locale          TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.name, b.short_name, b.logo_emoji, b.theme_color, b.currency_symbol, b.locale
  FROM   businesses b
  WHERE  b.slug   = p_slug
  AND    b.active = TRUE
  LIMIT  1;
$$;

REVOKE ALL    ON FUNCTION get_business_branding FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_business_branding TO anon, authenticated;

COMMIT;
