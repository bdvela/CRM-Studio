-- ═══════════════════════════════════════════════════════════════
-- Fix: Políticas RLS para appointment_services (versión segura)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- 1. Primero eliminar TODAS las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Allow select for appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Allow insert for appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Allow update for appointment_services" ON appointment_services;
DROP POLICY IF EXISTS "Allow delete for appointment_services" ON appointment_services;

-- 2. Asegurarse de que RLS esté habilitado
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas frescas
-- Política para seleccionar (permitir a todos ver)
CREATE POLICY "Allow select for appointment_services" 
  ON appointment_services 
  FOR SELECT 
  USING (true);

-- Política para insertar (permitir a todos insertar)
CREATE POLICY "Allow insert for appointment_services" 
  ON appointment_services 
  FOR INSERT 
  WITH CHECK (true);

-- Política para actualizar (permitir a todos actualizar)
CREATE POLICY "Allow update for appointment_services" 
  ON appointment_services 
  FOR UPDATE 
  USING (true);

-- Política para eliminar (permitir a todos eliminar)
CREATE POLICY "Allow delete for appointment_services" 
  ON appointment_services 
  FOR DELETE 
  USING (true);

COMMIT;
