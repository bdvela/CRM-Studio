-- ═══════════════════════════════════════════════════════════════
-- Script: Limpiar citas y todas sus relaciones
-- Úsalo para probar desde cero sin afectar datos maestros
-- ═══════════════════════════════════════════════════════════════
-- 
-- ORDEN DE BORRADO (por dependencias de Foreign Keys):
-- 1. payments (tienen FK a appointments)
-- 2. appointment_services (tienen FK a appointments)
-- 3. appointments (tabla principal)
-- 
-- TABLAS QUE NO SE BORRAN (datos maestros):
-- - clients
-- - staff
-- - services
-- - roles
-- - categories
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ============================================================================
-- PASO 1: Borrar pagos relacionados con citas
-- ============================================================================
-- Nota: payments tiene FK a appointments con ON DELETE SET NULL
-- Si solo usamos TRUNCATE CASCADE en appointments, los payments quedarán
-- con appointment_id = NULL pero no se borrarán.

-- Opción A: Borrar SOLO pagos ligados a citas (recomendado para testing)
DELETE FROM payments 
WHERE appointment_id IS NOT NULL;

-- Opción B: Borrar TODOS los pagos (descomenta si quieres limpiar también ingresos/egresos manuales)
-- TRUNCATE TABLE payments CASCADE;

-- ============================================================================
-- PASO 2: Borrar servicios de citas
-- ============================================================================
-- Nota: appointment_services tiene FK a appointments con ON DELETE CASCADE
-- Si borramos appointments primero, esta tabla se limpia automáticamente.
-- Pero lo hacemos explícitamente para mayor claridad.

TRUNCATE TABLE appointment_services CASCADE;

-- ============================================================================
-- PASO 3: Borrar citas
-- ============================================================================
-- TRUNCATE CASCADE borrará cualquier dependencia con ON DELETE CASCADE

TRUNCATE TABLE appointments CASCADE;

-- ============================================================================
-- PASO 4: Reiniciar secuencias (opcional, pero útil para IDs limpios)
-- ============================================================================
-- Nota: En Supabase/PostgreSQL con UUID, no hay secuencias de auto-incremento
-- porque usamos gen_random_uuid(). Pero si en algún momento usas SERIAL o IDENTITY:

-- ALTER SEQUENCE IF EXISTS appointments_id_seq RESTART;
-- ALTER SEQUENCE IF EXISTS appointment_services_id_seq RESTART;
-- ALTER SEQUENCE IF EXISTS payments_id_seq RESTART;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- RESUMEN DE LO QUE SE BORRÓ:
-- ═══════════════════════════════════════════════════════════════
-- ✅ payments donde appointment_id IS NOT NULL (pagos de citas)
-- ✅ appointment_services (relación N:M)
-- ✅ appointments (todas las citas)
--
-- ❌ NO se borró:
-- ❌ clients (clientas)
-- ❌ staff (artistas)
-- ❌ services (catálogo de servicios)
-- ❌ roles (roles de staff)
-- ❌ categories (categorías de servicios)
-- ❌ payments sin appointment_id (ingresos/egresos manuales)
-- ═══════════════════════════════════════════════════════════════
