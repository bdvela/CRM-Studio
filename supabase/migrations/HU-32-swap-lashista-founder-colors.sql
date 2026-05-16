-- HU-32: Swap colors between Lashista and Dueña
-- Lashista: #EC4899 → #F59E0B (amber)
-- Dueña:    #F59E0B → #EC4899 (pink)

UPDATE roles SET color = '#F59E0B' WHERE name = 'Lashista';
UPDATE roles SET color = '#EC4899' WHERE name = 'Dueña';
