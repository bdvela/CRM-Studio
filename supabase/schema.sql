-- Create enum types
CREATE TYPE client_status AS ENUM ('prospecto', 'activa', 'inactiva', 'vip');
CREATE TYPE appointment_status AS ENUM ('programada', 'en_curso', 'completada', 'cancelada', 'no_show');
CREATE TYPE service_category AS ENUM ('sistema_unas', 'pedicura', 'makeup', 'pestanas', 'cejas');
CREATE TYPE payment_type AS ENUM ('ingreso', 'egreso');
CREATE TYPE payment_category AS ENUM ('servicio', 'insumo', 'alquiler', 'marketing', 'comisiones', 'otro');
CREATE TYPE payment_method AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'yape_plin');
CREATE TYPE payment_kind AS ENUM ('reserva', 'pago_completo', 'pago_final');

-- ─── ROLES ──────────────────────────────────────────────────────────────────
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roles_active ON roles(active) WHERE active = TRUE;

-- Seed roles
INSERT INTO roles (name, description, color) VALUES
  ('Nail Artist', 'Sistema de uñas, manicure, pedicure', '#8B5CF6'),
  ('Lashista', 'Extensiones de pestañas', '#EC4899'),
  ('Pedicurista', 'Pedicure profesional', '#3B82F6'),
  ('Maquillista', 'Maquillaje profesional', '#EF4444'),
  ('Dueña', 'Owner/CEO del salón', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- ─── CLIENTS ────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  status client_status DEFAULT 'prospecto',
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_created ON clients(created_at DESC);

-- ─── SERVICES ───────────────────────────────────────────────────────────────
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category service_category NOT NULL,
  duration_min INT NOT NULL DEFAULT 30,
  price NUMERIC(10, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(active) WHERE active = TRUE;

-- ─── STAFF / ARTISTS ────────────────────────────────────────────────────────
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL NOT NULL,
  specialties service_category[],
  commission_pct NUMERIC(5, 2) DEFAULT 0,
  schedule TEXT,
  photo_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  last_commission_paid DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_role ON staff(role_id);
CREATE INDEX idx_staff_active ON staff(active) WHERE active = TRUE;

-- ─── APPOINTMENTS ───────────────────────────────────────────────────────────
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  artist_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status appointment_status DEFAULT 'programada',
  total_price NUMERIC(10, 2) DEFAULT 0,
  total_duration_min INT DEFAULT 0,
  notes TEXT,
  overlap_detected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appt_client ON appointments(client_id);
CREATE INDEX idx_appt_artist ON appointments(artist_id);
CREATE INDEX idx_appt_start ON appointments(start_time);
CREATE INDEX idx_appt_status ON appointments(status);
CREATE INDEX idx_appt_today ON appointments(start_time) WHERE status IN ('programada', 'en_curso');

-- ─── APPOINTMENT SERVICES (N:M) ─────────────────────────────────────────────
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  UNIQUE (appointment_id, service_id)
);

CREATE INDEX idx_appt_svc_appt ON appointment_services(appointment_id);
CREATE INDEX idx_appt_svc_svc ON appointment_services(service_id);

-- ─── PAYMENTS ───────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC(10, 2) NOT NULL,
  type payment_type NOT NULL,
  category payment_category DEFAULT 'servicio',
  payment_kind payment_kind,
  payment_method payment_method,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  receipt_url TEXT,
  paid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pay_appointment ON payments(appointment_id);
CREATE INDEX idx_pay_client ON payments(client_id);
CREATE INDEX idx_pay_date ON payments(date);
CREATE INDEX idx_pay_type ON payments(type);
CREATE INDEX idx_pay_kind ON payments(payment_kind);

-- ─── AUTO-UPDATE updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appts_updated BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── VIEW: Appointment balance ──────────────────────────────────────────────
CREATE VIEW appointment_balance AS
SELECT
  a.id,
  a.total_price,
  COALESCE(SUM(p.amount), 0) AS total_paid,
  GREATEST(0, a.total_price - COALESCE(SUM(p.amount), 0)) AS pending_balance,
  (GREATEST(0, a.total_price - COALESCE(SUM(p.amount), 0)) <= 0) AS paid_in_full
FROM appointments a
LEFT JOIN payments p ON p.appointment_id = a.id AND p.type = 'ingreso'
GROUP BY a.id, a.total_price;

-- ─── VIEW: Client stats ─────────────────────────────────────────────────────
CREATE VIEW client_stats AS
SELECT
  c.id,
  COUNT(a.id) AS total_appointments,
  COALESCE(SUM(a.total_price) FILTER (WHERE a.status = 'completada'), 0) AS total_spent,
  MAX(a.start_time) AS last_visit
FROM clients c
LEFT JOIN appointments a ON a.client_id = c.id
GROUP BY c.id;

-- ─── VIEW: Staff stats ──────────────────────────────────────────────────────
CREATE VIEW staff_stats AS
SELECT
  s.id,
  COUNT(a.id) AS total_appointments,
  COALESCE(SUM(a.total_price) FILTER (WHERE a.status = 'completada'), 0) AS total_revenue,
  MAX(a.start_time) AS last_appointment
FROM staff s
LEFT JOIN appointments a ON a.artist_id = s.id
GROUP BY s.id;
