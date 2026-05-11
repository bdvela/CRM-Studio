-- ⚠️ Ajusta timezone si no es 'America/Bogota' (-05).
-- Año asumido: 2026

BEGIN;

-- ─── 1. SERVICIOS ──────────────────────────────────────────────────────────
-- Si ya existen, usa ON CONFLICT o ignora duplicados.
INSERT INTO services (name, category, duration_min, price, description) VALUES
  ('Manos', 'sistema_unas', 60, 0, 'Manicura'),
  ('Pies', 'pedicura', 60, 0, 'Pedicura'),
  ('Manos y pies', 'pedicura', 120, 0, 'Manicura + pedicura'),
  ('Híbridas', 'sistema_unas', 90, 0, 'Uñas semipermanentes'),
  ('Acrílicas', 'sistema_unas', 120, 0, 'Uñas acrílicas'),
  ('Rubber', 'sistema_unas', 90, 0, 'Uñas con gel rubber'),
  ('Retoque', 'sistema_unas', 60, 0, 'Retoque de uñas'),
  ('Retiro', 'sistema_unas', 45, 0, 'Retiro de uñas'),
  ('Extensiones', 'sistema_unas', 120, 0, 'Extensiones de uñas'),
  ('Henna', 'cejas', 30, 0, 'Diseño con henna'),
  ('Maquillaje', 'makeup', 60, 0, 'Maquillaje profesional'),
  ('Peinado', 'makeup', 60, 0, 'Peinado profesional')
ON CONFLICT DO NOTHING;

-- ─── 2. CLIENTES ───────────────────────────────────────────────────────────
INSERT INTO clients (name, phone, instagram, notes) VALUES
  ('Angela Bravo', NULL, NULL, ''),
  ('Nuria', NULL, NULL, ''),
  ('Rocio', NULL, NULL, ''),
  ('Naty Astuquipan', NULL, NULL, ''),
  ('Jessy', NULL, NULL, ''),
  ('Claudia', NULL, NULL, ''),
  ('Eva', NULL, NULL, ''),
  ('Nicol', NULL, NULL, 'Mamá'),
  ('Fátima', NULL, NULL, ''),
  ('Danna', NULL, NULL, ''),
  ('Danu', NULL, NULL, ''),
  ('Mayra', NULL, NULL, ''),
  ('Brenda', NULL, NULL, ''),
  ('Keyla', NULL, NULL, ''),
  ('Nathy', NULL, NULL, ''),
  ('Paty', NULL, NULL, ''),
  ('Marcia', NULL, NULL, ''),
  ('Quianny', NULL, NULL, ''),
  ('Abi', NULL, NULL, ''),
  ('Kristel', NULL, NULL, ''),
  ('Jamis', NULL, NULL, ''),
  ('Kathy', NULL, NULL, ''),
  ('Jennifer', NULL, NULL, ''),
  ('Nicol Cornejo', NULL, NULL, ''),
  ('Paola Aguilar', NULL, NULL, 'Novia')
ON CONFLICT DO NOTHING;

-- ─── 3. CITAS ──────────────────────────────────────────────────────────────
-- artist_id = NULL (asignar manualmente desde el panel)
-- total_price y total_duration se calculan después al vincular servicios
-- end_time estimado a 2h por defecto (ajustar según necesidad)

INSERT INTO appointments (client_id, artist_id, title, start_time, end_time, status, total_price, total_duration_min, notes) VALUES

-- 6 mayo
((SELECT id FROM clients WHERE name = 'Angela Bravo'), NULL, 'Híbridas y henna',    '2026-05-06 10:00:00-05', '2026-05-06 12:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Nuria'),               NULL, 'Cita',             '2026-05-06 10:00:00-05', '2026-05-06 12:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Rocio'),              NULL, 'Rubber',           '2026-05-06 15:00:00-05', '2026-05-06 17:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Naty Astuquipan'),    NULL, 'Manos y pies Promo','2026-05-06 21:30:00-05', '2026-05-06 23:30:00-05', 'programada', 0, 120, ''),

-- 7 mayo
((SELECT id FROM clients WHERE name = 'Jessy'),              NULL, 'Manos',            '2026-05-07 07:00:00-05', '2026-05-07 09:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Claudia'),            NULL, 'Cita',             '2026-05-07 09:00:00-05', '2026-05-07 11:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Eva'),                NULL, 'Cita',             '2026-05-07 11:00:00-05', '2026-05-07 13:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Nicol'),              NULL, 'Retoque mamá',     '2026-05-07 13:30:00-05', '2026-05-07 15:30:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Fátima'),             NULL, 'Cita',             '2026-05-07 15:00:00-05', '2026-05-07 17:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Danna'),              NULL, 'Rubber Promo',     '2026-05-07 18:00:00-05', '2026-05-07 20:00:00-05', 'programada', 0, 90,  ''),
((SELECT id FROM clients WHERE name = 'Danna'),              NULL, 'Rubber Promo',     '2026-05-07 19:30:00-05', '2026-05-07 21:30:00-05', 'programada', 0, 90,  ''),
((SELECT id FROM clients WHERE name = 'Jessy'),              NULL, 'Dos acrílicas',    '2026-05-07 21:00:00-05', '2026-05-07 23:00:00-05', 'programada', 0, 120, ''),

-- 8 mayo
((SELECT id FROM clients WHERE name = 'Danu'),               NULL, 'Manos y pies',     '2026-05-08 06:00:00-05', '2026-05-08 08:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Mayra'),              NULL, 'Cita',             '2026-05-08 09:00:00-05', '2026-05-08 11:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Brenda'),             NULL, 'Retiro + acrílicas','2026-05-08 11:00:00-05', '2026-05-08 13:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Keyla'),              NULL, 'Cita',             '2026-05-08 13:30:00-05', '2026-05-08 15:30:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Nathy'),              NULL, 'Retoque',          '2026-05-08 15:00:00-05', '2026-05-08 17:00:00-05', 'programada', 0, 60,  ''),
((SELECT id FROM clients WHERE name = 'Paty'),               NULL, 'Manos y pies',     '2026-05-08 17:00:00-05', '2026-05-08 19:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Naty Astuquipan'),    NULL, 'Cita',             '2026-05-08 19:00:00-05', '2026-05-08 21:00:00-05', 'programada', 0, 120, ''),

-- 9 mayo
((SELECT id FROM clients WHERE name = 'Marcia'),             NULL, '2 Rubber Promo',   '2026-05-09 09:00:00-05', '2026-05-09 11:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Quianny'),            NULL, 'Manos y pies',     '2026-05-09 11:15:00-05', '2026-05-09 13:15:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Fátima'),             NULL, 'Rubber mamá',      '2026-05-09 14:00:00-05', '2026-05-09 16:00:00-05', 'programada', 0, 90,  ''),
((SELECT id FROM clients WHERE name = 'Abi'),                NULL, 'Cita',             '2026-05-09 15:00:00-05', '2026-05-09 17:00:00-05', 'programada', 0, 120, ''),

-- 11 mayo
((SELECT id FROM clients WHERE name = 'Kristel'),            NULL, 'Cita',             '2026-05-11 08:30:00-05', '2026-05-11 10:30:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Jamis'),              NULL, 'Cita',             '2026-05-11 10:00:00-05', '2026-05-11 12:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Fátima'),             NULL, 'Extensiones',      '2026-05-11 15:00:00-05', '2026-05-11 17:00:00-05', 'programada', 0, 120, ''),
((SELECT id FROM clients WHERE name = 'Kathy'),              NULL, 'Pies',             '2026-05-11 16:00:00-05', '2026-05-11 18:00:00-05', 'programada', 0, 60,  ''),

-- 12 mayo
((SELECT id FROM clients WHERE name = 'Jennifer'),           NULL, 'Cita',             '2026-05-12 11:00:00-05', '2026-05-12 13:00:00-05', 'programada', 0, 120, ''),

-- 14 mayo
((SELECT id FROM clients WHERE name = 'Nicol Cornejo'),      NULL, 'Cita',             '2026-05-14 15:00:00-05', '2026-05-14 17:00:00-05', 'programada', 0, 120, ''),

-- 2 junio
((SELECT id FROM clients WHERE name = 'Claudia'),            NULL, 'Cita',             '2026-06-02 16:30:00-05', '2026-06-02 18:30:00-05', 'programada', 0, 120, ''),

-- 6 junio
((SELECT id FROM clients WHERE name = 'Paola Aguilar'),      NULL, 'Prueba de novia',  '2026-06-06 15:00:00-05', '2026-06-06 17:00:00-05', 'programada', 0, 120, 'Maquillaje y peinado'),

-- 25 julio
((SELECT id FROM clients WHERE name = 'Paola Aguilar'),      NULL, 'Boda',             '2026-07-25 06:00:00-05', '2026-07-25 12:00:00-05', 'programada', 0, 360, 'Makeup novia, novio y mamás')

ON CONFLICT DO NOTHING;

COMMIT;
