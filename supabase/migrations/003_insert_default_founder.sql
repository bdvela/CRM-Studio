-- Migración: Insertar Founder por defecto (Araceli Zevallos)
-- Fecha: 2025

-- Paso 1: Asegurar que el rol "Dueña" existe (con color distintivo)
INSERT INTO roles (name, description, color, active)
VALUES ('Dueña', 'Owner/CEO del salón', '#F59E0B', TRUE)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  color = EXCLUDED.color;

-- Paso 2: Obtener el ID del rol Dueña
DO $$
DECLARE
  owner_role_id UUID;
  existing_owner_id UUID;
  cat1_id UUID;
  cat2_id UUID;
  cat3_id UUID;
BEGIN
  -- Obtener ID del rol Dueña
  SELECT id INTO owner_role_id FROM roles WHERE name = 'Dueña' LIMIT 1;
  
  -- Verificar si ya existe un miembro con rol Dueña
  SELECT id INTO existing_owner_id FROM staff WHERE role_id = owner_role_id LIMIT 1;
  
  -- Si NO existe, insertar a Araceli
  IF existing_owner_id IS NULL THEN
    -- Insertar a Araceli
    INSERT INTO staff (name, phone, role_id, commission_pct, birthday_date, active, schedule)
    VALUES (
      'Araceli Zevallos',
      '+51 962 686 557',
      owner_role_id,
      100.00,
      '1990-11-09',
      TRUE,
      'Lun-Sáb 9:00-20:00'
    );
    
    -- Obtener el ID recién insertado
    SELECT id INTO existing_owner_id FROM staff WHERE name = 'Araceli Zevallos' LIMIT 1;
    
    -- Obtener IDs de categorías por nombre
    SELECT id INTO cat1_id FROM categories WHERE slug = 'sistema_unas' LIMIT 1;
    SELECT id INTO cat2_id FROM categories WHERE slug = 'pedicura' LIMIT 1;
    SELECT id INTO cat3_id FROM categories WHERE slug = 'makeup' LIMIT 1;
    
    -- Insertar especialidades (si existen las categorías)
    IF cat1_id IS NOT NULL THEN
      INSERT INTO staff_specialties (staff_id, category_id)
      VALUES (existing_owner_id, cat1_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF cat2_id IS NOT NULL THEN
      INSERT INTO staff_specialties (staff_id, category_id)
      VALUES (existing_owner_id, cat2_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF cat3_id IS NOT NULL THEN
      INSERT INTO staff_specialties (staff_id, category_id)
      VALUES (existing_owner_id, cat3_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
  END IF;
END $$;
