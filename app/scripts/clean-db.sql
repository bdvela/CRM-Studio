-- ⚠️ WARNING: This will DELETE ALL DATA from your production database.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/aldbomizedsoxyluvgog/sql

BEGIN;

TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE appointment_services CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE staff CASCADE;

COMMIT;
