-- Seed data for restaurant_tables
-- Insert initial tables based on mock data structure

INSERT INTO restaurant_tables (table_number, section, capacity, status) VALUES
-- Indoor tables
('T1', 'indoor', 2, 'available'),
('T2', 'indoor', 4, 'available'),
('T3', 'indoor', 4, 'available'),
('T4', 'indoor', 6, 'available'),
('T5', 'indoor', 2, 'available'),
('T6', 'indoor', 4, 'available'),
-- Outdoor tables
('T7', 'outdoor', 8, 'available'),
('T8', 'outdoor', 4, 'available'),
('T9', 'outdoor', 6, 'available'),
('T10', 'outdoor', 4, 'available'),
('T11', 'outdoor', 2, 'available'),
('T12', 'outdoor', 4, 'available');
