-- ═══════════════════════════════════════════════════════════════
-- HU-26: Transicion Automatica de Estados de Clienta
-- HU-30: Funcion cron de inactividad (>60 dias → inactiva)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- 1. Habilitar pg_cron (gestionado por Supabase; idempotente)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Funcion que barre clientas activa/vip y las degrada a inactiva
--    si su ultima cita completada fue hace mas de 60 dias.
--    Solo cuenta citas en estado 'completada' como actividad valida.
--    Las clientas 'prospecto' NUNCA se degradan automaticamente.
CREATE OR REPLACE FUNCTION eval_client_inactivity()
RETURNS void
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_threshold_date DATE;
  v_count INT;
BEGIN
  v_threshold_date := CURRENT_DATE - INTERVAL '60 days';

  WITH stale_clients AS (
    SELECT c.id
    FROM clients c
    JOIN client_stats cs ON cs.id = c.id
    WHERE c.status IN ('activa', 'vip')
      AND cs.last_visit IS NOT NULL
      AND cs.last_visit < v_threshold_date

    UNION ALL

    SELECT c.id
    FROM clients c
    LEFT JOIN client_stats cs ON cs.id = c.id
    WHERE c.status IN ('activa', 'vip')
      AND cs.last_visit IS NULL
  )
  UPDATE clients
  SET
    status = 'inactiva',
    updated_at = NOW()
  WHERE id IN (SELECT id FROM stale_clients);

  GET DIAGNOSTICS v_count = ROW_COUNT;
END;
$$;

-- 3. Programar ejecucion horaria via pg_cron
--    NOTA: pg_cron solo esta disponible en Supabase Pro/Team.
--    Si la extension no existe, se omite silenciosamente el schedule.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Desregistrar job anterior si existe (ignora error si no existe)
    BEGIN
      PERFORM cron.unschedule('eval-client-inactivity-every-hour');
    EXCEPTION WHEN OTHERS THEN
      -- job no existia, ignorar
    END;

    PERFORM cron.schedule(
      'eval-client-inactivity-every-hour',
      '0 * * * *',                     -- cada hora en punto
      'SELECT eval_client_inactivity()'
    );
  END IF;
END
$$;

COMMIT;
