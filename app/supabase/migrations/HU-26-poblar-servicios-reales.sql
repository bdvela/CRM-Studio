-- =============================================================================
-- SCRIPT: Poblar base de datos con servicios reales del salón
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASO 1: Verificar y crear la categoría "Adicionales" si no existe
-- -----------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, color, icon, active, sort_order, created_at, updated_at)
SELECT 
  'cat-adicionales' as id,
  'Adicionales' as name,
  'adicionales' as slug,
  'Servicios complementarios y retiros' as description,
  '#6B7280' as color,
  '➕' as icon,
  true as active,
  6 as sort_order,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'adicionales');

-- -----------------------------------------------------------------------------
-- PASO 2: Obtener IDs de categorías para usar en los servicios
-- -----------------------------------------------------------------------------
-- Sistema de uñas = cat-1 (o el que corresponda)
-- Pedicura = cat-2
-- Makeup = cat-3
-- Pestañas = cat-4
-- Cejas = cat-5
-- Adicionales = cat-adicionales (recién creado o existente)

-- -----------------------------------------------------------------------------
-- PASO 3: Actualizar servicios EXISTENTES con datos reales
-- -----------------------------------------------------------------------------

-- Rubber gel (precio variable: 45-60, 60 min)
UPDATE services 
SET 
  name = 'Rubber gel',
  duration_min = 60,
  price_type = 'variable',
  price = 0,
  price_from = 45,
  price_to = 60,
  description = 'Esmaltado semipermanente con base rubber para mayor duración y protección de la uña natural',
  updated_at = NOW()
WHERE name ILIKE '%rubber%' OR name ILIKE '%base%';

-- Acrílicas (precio variable: 75-120, 120 min)
UPDATE services 
SET 
  name = 'Acrílicas',
  duration_min = 120,
  price_type = 'variable',
  price = 0,
  price_from = 75,
  price_to = 120,
  description = 'Uñas acrílicas completas para extensiones o refuerzo, diseño básico incluido',
  updated_at = NOW()
WHERE name ILIKE '%acrili%' OR name ILIKE '%acrilico%';

-- Builder gel (precio variable: 60-80, 60 min)
UPDATE services 
SET 
  name = 'Builder gel',
  duration_min = 60,
  price_type = 'variable',
  price = 0,
  price_from = 60,
  price_to = 80,
  description = 'Construcción de uñas en gel natural para extensiones o reparaciones',
  updated_at = NOW()
WHERE name ILIKE '%builder%' OR name ILIKE '%soft gel%';

-- Retiro acrílicas (precio fijo: 30, 30 min) -> categoría Adicionales
UPDATE services 
SET 
  name = 'Retiro acrílicas',
  category_id = (SELECT id FROM categories WHERE slug = 'adicionales' LIMIT 1),
  duration_min = 30,
  price_type = 'fixed',
  price = 30,
  price_from = null,
  price_to = null,
  description = 'Retiro profesional y seguro de uñas acrílicas sin dañar la uña natural',
  updated_at = NOW()
WHERE name ILIKE '%retiro%' AND (name ILIKE '%acrili%' OR name ILIKE '%u%as%');

-- Retiro pedicura (precio fijo: 10, 10 min) -> categoría Adicionales
UPDATE services 
SET 
  name = 'Retiro pedicura',
  category_id = (SELECT id FROM categories WHERE slug = 'adicionales' LIMIT 1),
  duration_min = 10,
  price_type = 'fixed',
  price = 10,
  price_from = null,
  price_to = null,
  description = 'Retiro de esmalte semipermanente o gel en pies',
  updated_at = NOW()
WHERE name ILIKE '%retiro%' AND name ILIKE '%pedicur%';

-- -----------------------------------------------------------------------------
-- PASO 4: Insertar servicios NUEVOS (si no existen)
-- -----------------------------------------------------------------------------

-- ============================================
-- Categoría: Sistema de uñas
-- ============================================
-- (Ya están Rubber gel, Acrílicas, Builder gel - actualizados arriba)

-- ============================================
-- Categoría: Pedicura
-- ============================================

-- Pedicura en gel
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Pedicura en gel' as name,
  (SELECT id FROM categories WHERE slug = 'pedicura' LIMIT 1) as category_id,
  60 as duration_min,
  'fixed' as price_type,
  40 as price,
  null as price_from,
  null as price_to,
  'Pedicura completa con esmaltado semipermanente de larga duración' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%pedicura%gel%' OR name ILIKE '%pedicur%en gel%');

-- Pedicura Rubber
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Pedicura Rubber' as name,
  (SELECT id FROM categories WHERE slug = 'pedicura' LIMIT 1) as category_id,
  90 as duration_min,
  'fixed' as price_type,
  50 as price,
  null as price_from,
  null as price_to,
  'Pedicura premium con base rubber para máxima duración y protección' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%pedicura%rubber%');

-- ============================================
-- Categoría: Makeup
-- ============================================

-- Makeup social
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Makeup social' as name,
  (SELECT id FROM categories WHERE slug = 'makeup' LIMIT 1) as category_id,
  60 as duration_min,
  'fixed' as price_type,
  100 as price,
  null as price_from,
  null as price_to,
  'Maquillaje profesional para eventos sociales, fiestas y reuniones' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%makeup%social%' OR name ILIKE '%maquillaje%social%');

-- Sesión de fotos
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Sesión de fotos' as name,
  (SELECT id FROM categories WHERE slug = 'makeup' LIMIT 1) as category_id,
  80 as duration_min,
  'fixed' as price_type,
  120 as price,
  null as price_from,
  null as price_to,
  'Maquillaje especializado para sesiones fotográficas con acabado HD y larga duración' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%sesi_n%foto%' OR name ILIKE '%photo%session%');

-- Novia
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Novia' as name,
  (SELECT id FROM categories WHERE slug = 'makeup' LIMIT 1) as category_id,
  90 as duration_min,
  'fixed' as price_type,
  250 as price,
  null as price_from,
  null as price_to,
  'Maquillaje de novia profesional para el día de tu boda, resistente a lágrimas y larga duración' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Novia' OR (name ILIKE '%novia%' AND name NOT ILIKE '%prueba%'));

-- Novia más prueba
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Novia más prueba' as name,
  (SELECT id FROM categories WHERE slug = 'makeup' LIMIT 1) as category_id,
  180 as duration_min,
  'fixed' as price_type,
  500 as price,
  null as price_from,
  null as price_to,
  'Maquillaje de novia + prueba previa en días distintos para asegurar el resultado perfecto' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%novia%prueba%' OR name ILIKE '%prueba%novia%');

-- ============================================
-- Categoría: Pestañas
-- ============================================

-- Lifting
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Lifting' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  60 as duration_min,
  'fixed' as price_type,
  80 as price,
  null as price_from,
  null as price_to,
  'Lifting de pestañas naturales para rizar y alargar con efecto duradero' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Lifting' OR name ILIKE '%lifting%pesta_a%');

-- Extensiones clásicas
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Extensiones clásicas' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  120 as duration_min,
  'fixed' as price_type,
  80 as price,
  null as price_from,
  null as price_to,
  'Extensiones pelo a pelo para un acabado natural y elegante' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%cl_sica%' OR name ILIKE '%clasica%');

-- Extensiones híbridas
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Extensiones híbridas' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  120 as duration_min,
  'fixed' as price_type,
  100 as price,
  null as price_from,
  null as price_to,
  'Combinación de clásicas y volumen para mayor densidad y textura' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%h_brida%' OR name ILIKE '%hibrida%');

-- Extensiones 2D
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Extensiones 2D' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  120 as duration_min,
  'fixed' as price_type,
  120 as price,
  null as price_from,
  null as price_to,
  'Volumen ruso 2D: 2 hilos por pestaña natural para mayor densidad' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%2D%');

-- Extensiones 3D
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Extensiones 3D' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  120 as duration_min,
  'fixed' as price_type,
  130 as price,
  null as price_from,
  null as price_to,
  'Volumen ruso 3D: 3 hilos por pestaña natural, volumen medio' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%3D%');

-- Extensiones 4D
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Extensiones 4D' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  120 as duration_min,
  'fixed' as price_type,
  140 as price,
  null as price_from,
  null as price_to,
  'Volumen ruso 4D: 4 hilos por pestaña natural, alto volumen' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%4D%');

-- Efecto rímel
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Efecto rímel' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  120 as duration_min,
  'fixed' as price_type,
  150 as price,
  null as price_from,
  null as price_to,
  'Efecto de rímel con extensiones, acabado natural, definido y con volumen' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%r_mel%' OR name ILIKE '%rimel%');

-- Efecto wispy
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Efecto wispy' as name,
  (SELECT id FROM categories WHERE slug = 'pestanas' LIMIT 1) as category_id,
  120 as duration_min,
  'fixed' as price_type,
  180 as price,
  null as price_from,
  null as price_to,
  'Estilo wispy: aspecto natural y despojado con picos, textura y movimiento' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%wispy%');

-- ============================================
-- Categoría: Cejas
-- ============================================

-- Laminado de cejas
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Laminado de cejas' as name,
  (SELECT id FROM categories WHERE slug = 'cejas' LIMIT 1) as category_id,
  60 as duration_min,
  'fixed' as price_type,
  60 as price,
  null as price_from,
  null as price_to,
  'Laminado de cejas para peinar y fijar los vellos en tu forma ideal, efecto duradero' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%laminado%ceja%');

-- Depilación de cejas
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Depilación de cejas' as name,
  (SELECT id FROM categories WHERE slug = 'cejas' LIMIT 1) as category_id,
  20 as duration_min,
  'fixed' as price_type,
  25 as price,
  null as price_from,
  null as price_to,
  'Perfilado y depilación de cejas para definir y enmarcar tu mirada' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Depilación de cejas' OR (name ILIKE '%depilaci_n%' AND name ILIKE '%ceja%' AND name NOT ILIKE '%bozo%'));

-- Depilación de cejas y bozo
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Depilación de cejas y bozo' as name,
  (SELECT id FROM categories WHERE slug = 'cejas' LIMIT 1) as category_id,
  30 as duration_min,
  'fixed' as price_type,
  35 as price,
  null as price_from,
  null as price_to,
  'Perfilado de cejas + depilación de bozo para un acabado impecable y definido' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name ILIKE '%cejas%bozo%' OR name ILIKE '%bozo%cejas%');

-- Depilación de rostro
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Depilación de rostro' as name,
  (SELECT id FROM categories WHERE slug = 'cejas' LIMIT 1) as category_id,
  40 as duration_min,
  'fixed' as price_type,
  50 as price,
  null as price_from,
  null as price_to,
  'Depilación completa de rostro: frente, patillas, bozo, mentón y mejillas' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Depilación de rostro' OR name ILIKE '%depilaci_n%rostro%');

-- Henna
INSERT INTO services (id, name, category_id, duration_min, price_type, price, price_from, price_to, description, active, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  'Henna' as name,
  (SELECT id FROM categories WHERE slug = 'cejas' LIMIT 1) as category_id,
  30 as duration_min,
  'fixed' as price_type,
  45 as price,
  null as price_from,
  null as price_to,
  'Tinte de cejas con henna natural para mayor definición y duración' as description,
  true as active,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Henna' OR name ILIKE '%henna%ceja%');

-- -----------------------------------------------------------------------------
-- PASO 5: Consulta de verificación
-- -----------------------------------------------------------------------------
SELECT 
  c.name as categoria,
  s.name as servicio,
  s.price_type,
  CASE 
    WHEN s.price_type = 'fixed' THEN 'S/' || s.price::text
    ELSE 'S/' || COALESCE(s.price_from::text, '-') || ' - S/' || COALESCE(s.price_to::text, '-')
  END as precio,
  s.duration_min || ' min' as duracion,
  s.active
FROM services s
JOIN categories c ON s.category_id = c.id
ORDER BY c.sort_order, s.name;
