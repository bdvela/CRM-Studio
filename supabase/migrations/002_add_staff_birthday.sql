-- Migración: Agregar campo birthday_date a la tabla staff
-- Fecha: 2025

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS birthday_date DATE;

CREATE INDEX idx_staff_birthday ON staff(birthday_date);
