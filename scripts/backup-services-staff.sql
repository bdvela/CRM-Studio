-- ============================================
-- BACKUP: Services, Staff, Categories, Roles
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- SERVICES (copy output as INSERTs)
-- ============================================
SELECT 
  'INSERT INTO services (id, name, category_id, duration_min, price, price_type, price_from, price_to, description, image_url, active, created_at, updated_at) VALUES ('''
  || id || ''', ''''
  || REPLACE(name, '''', '''''') || ''', '''
  || category_id || ''', '
  || duration_min || ', '
  || price || ', '''
  || price_type || ''', '
  || COALESCE(price_from::text, 'NULL') || ', '
  || COALESCE(price_to::text, 'NULL') || ', '
  || COALESCE(''' || REPLACE(COALESCE(description,''), '''', '''''') || '''', 'NULL') || ', '
  || COALESCE(''' || image_url || '''', 'NULL') || ', '
  || active || ', '''
  || created_at || ''', '''
  || updated_at || ''');' AS insert_statement
FROM services
ORDER BY name;

-- ============================================
-- STAFF (copy output as INSERTs)
-- ============================================
SELECT 
  'INSERT INTO staff (id, name, phone, email, role_id, commission_rate, specialties, birthday_date, active, created_at, updated_at) VALUES ('''
  || id || ''', '''
  || REPLACE(name, '''', '''''') || ''', '
  || COALESCE(''' || phone || '''', 'NULL') || ', '
  || COALESCE(''' || email || '''', 'NULL') || ', '''
  || role_id || ''', '
  || commission_rate || ', '
  || COALESCE(''' || specialties || '''', 'NULL') || ', '
  || COALESCE(''' || birthday_date || '''', 'NULL') || ', '
  || active || ', '''
  || created_at || ''', '''
  || updated_at || ''');' AS insert_statement
FROM staff
ORDER BY name;

-- ============================================
-- CATEGORIES (copy output as INSERTs)
-- ============================================
SELECT 
  'INSERT INTO categories (id, name, icon, color, sort_order, created_at, updated_at) VALUES ('''
  || id || ''', '''
  || REPLACE(name, '''', '''''') || ''', '''
  || COALESCE(icon, '') || ''', '''
  || COALESCE(color, '') || ''', '
  || COALESCE(sort_order::text, 'NULL') || ', '''
  || created_at || ''', '''
  || updated_at || ''');' AS insert_statement
FROM categories
ORDER BY sort_order;

-- ============================================
-- ROLES (copy output as INSERTs)
-- ============================================
SELECT 
  'INSERT INTO roles (id, name, description, color, active, created_at, updated_at) VALUES ('''
  || id || ''', '''
  || REPLACE(name, '''', '''''') || ''', '
  || COALESCE(''' || REPLACE(COALESCE(description,''), '''', '''''') || '''', 'NULL') || ', '''
  || COALESCE(color, '') || ''', '
  || active || ', '''
  || created_at || ''', '''
  || updated_at || ''');' AS insert_statement
FROM roles
ORDER BY name;

-- ============================================
-- STAFF_SERVICES (copy output as INSERTs)
-- ============================================
SELECT 
  'INSERT INTO staff_services (staff_id, service_id) VALUES ('''
  || staff_id || ''', ''' || service_id || ''');' AS insert_statement
FROM staff_services;

-- ============================================
-- STAFF_COMMISSION_OVERRIDES (copy output as INSERTs)
-- ============================================
SELECT 
  'INSERT INTO staff_commission_overrides (id, staff_id, service_id, commission_override) VALUES ('''
  || id || ''', '''
  || staff_id || ''', '''
  || service_id || ''', '
  || commission_override || ');' AS insert_statement
FROM staff_commission_overrides;