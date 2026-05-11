-- ═══════════════════════════════════════════════════════════════
-- Fix: Agregar políticas RLS para appointment_services
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- Habilitar RLS si no está habilitado
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Política para seleccionar (permitir a todos ver appointment_services)
-- Usamos true porque es una tabla de relación N:M que necesita ser accesible
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
