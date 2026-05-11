-- ═══════════════════════════════════════════════════════════════
-- Limpiar todas las citas de la base de datos
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- Borrar servicios asociados a citas
TRUNCATE TABLE appointment_services CASCADE;

-- Borrar todas las citas
TRUNCATE TABLE appointments CASCADE;

-- Reiniciar secuencias (si es necesario)
ALTER SEQUENCE IF EXISTS appointments_id_seq RESTART;
ALTER SEQUENCE IF EXISTS appointment_services_id_seq RESTART;

COMMIT;
