-- Seed data for testing the POS system
-- This script is idempotent - safe to run multiple times

-- Clear existing seed data first
DELETE FROM recipes WHERE menu_item_id IN (
  SELECT id FROM menu_items WHERE name_en IN ('Chicken Shawarma', 'Falafel Plate', 'Hummus')
);

DELETE FROM menu_items WHERE name_en IN (
  'Hummus', 'Falafel Plate', 'Fattoush Salad', 'Chicken Shawarma', 'Mixed Grill', 'Chicken Kabsa'
);

DELETE FROM menu_categories WHERE name_en IN (
  'Appetizers', 'Main Course', 'Desserts', 'Drinks'
);

DELETE FROM inventory_items WHERE name_en IN (
  'Chicken', 'Tomato', 'Lettuce', 'Tahini', 'Chickpeas', 'Vegetable Oil', 
  'Pita Bread', 'Onion', 'Garlic', 'Lemon', 'Parsley', 'Rice'
);

-- Insert Inventory Items
WITH warehouse AS (
  SELECT id FROM warehouses WHERE type = 'raw_materials' LIMIT 1
)
INSERT INTO inventory_items (warehouse_id, name_en, name_ar, unit, current_stock, minimum_stock, cost_per_unit)
SELECT 
  warehouse.id,
  name_en,
  name_ar,
  unit,
  current_stock,
  minimum_stock,
  cost_per_unit
FROM warehouse,
(VALUES
  ('Chicken', 'دجاج', 'kg', 50.0, 10.0, 25.00),
  ('Tomato', 'طماطم', 'kg', 30.0, 5.0, 5.00),
  ('Lettuce', 'خس', 'kg', 20.0, 3.0, 8.00),
  ('Tahini', 'طحينة', 'l', 15.0, 2.0, 35.00),
  ('Chickpeas', 'حمص', 'kg', 40.0, 10.0, 12.00),
  ('Vegetable Oil', 'زيت نباتي', 'l', 25.0, 5.0, 18.00),
  ('Pita Bread', 'خبز عربي', 'pcs', 200.0, 50.0, 1.50),
  ('Onion', 'بصل', 'kg', 35.0, 8.0, 4.00),
  ('Garlic', 'ثوم', 'kg', 10.0, 2.0, 15.00),
  ('Lemon', 'ليمون', 'kg', 15.0, 3.0, 10.00),
  ('Parsley', 'بقدونس', 'kg', 8.0, 2.0, 12.00),
  ('Rice', 'أرز', 'kg', 60.0, 15.0, 8.00)
) AS v(name_en, name_ar, unit, current_stock, minimum_stock, cost_per_unit);

-- Insert Menu Categories
INSERT INTO menu_categories (name_en, name_ar, display_order, is_active)
VALUES 
  ('Appetizers', 'مقبلات', 1, true),
  ('Main Course', 'الأطباق الرئيسية', 2, true),
  ('Desserts', 'حلويات', 3, true),
  ('Drinks', 'مشروبات', 4, true);

-- Insert Menu Items
INSERT INTO menu_items (category, name_en, name_ar, description_en, description_ar, price, is_available)
VALUES
  ('Appetizers', 'Hummus', 'حمص', 'Classic chickpea dip', 'غموس الحمص الكلاسيكي', 15.00, true),
  ('Appetizers', 'Falafel Plate', 'طبق فلافل', 'Crispy chickpea fritters', 'فطائر الحمص المقرمشة', 20.00, true),
  ('Appetizers', 'Fattoush Salad', 'سلطة فتوش', 'Fresh mixed salad', 'سلطة مشكلة طازجة', 18.00, true),
  ('Main Course', 'Chicken Shawarma', 'شاورما دجاج', 'Marinated chicken wrap', 'لفافة دجاج متبل', 35.00, true),
  ('Main Course', 'Mixed Grill', 'مشاوي مشكلة', 'Assorted grilled meats', 'لحوم مشوية متنوعة', 65.00, true),
  ('Main Course', 'Chicken Kabsa', 'كبسة دجاج', 'Spiced rice with chicken', 'أرز بالبهارات مع دجاج', 45.00, true);

-- Insert Recipes
-- Chicken Shawarma
INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit)
SELECT 
  (SELECT id FROM menu_items WHERE name_en = 'Chicken Shawarma' LIMIT 1),
  (SELECT id FROM inventory_items WHERE name_en = item_name LIMIT 1),
  quantity,
  unit
FROM (VALUES
  ('Chicken', 0.25, 'kg'),
  ('Pita Bread', 2.0, 'pcs'),
  ('Tomato', 0.05, 'kg'),
  ('Lettuce', 0.03, 'kg'),
  ('Tahini', 0.05, 'l')
) AS v(item_name, quantity, unit);

-- Falafel Plate
INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit)
SELECT 
  (SELECT id FROM menu_items WHERE name_en = 'Falafel Plate' LIMIT 1),
  (SELECT id FROM inventory_items WHERE name_en = item_name LIMIT 1),
  quantity,
  unit
FROM (VALUES
  ('Chickpeas', 0.15, 'kg'),
  ('Vegetable Oil', 0.1, 'l'),
  ('Pita Bread', 2.0, 'pcs'),
  ('Tahini', 0.05, 'l')
) AS v(item_name, quantity, unit);

-- Hummus
INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit)
SELECT 
  (SELECT id FROM menu_items WHERE name_en = 'Hummus' LIMIT 1),
  (SELECT id FROM inventory_items WHERE name_en = item_name LIMIT 1),
  quantity,
  unit
FROM (VALUES
  ('Chickpeas', 0.2, 'kg'),
  ('Tahini', 0.05, 'l'),
  ('Vegetable Oil', 0.03, 'l')
) AS v(item_name, quantity, unit);
