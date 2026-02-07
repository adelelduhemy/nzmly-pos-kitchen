-- Migration: Add category_id to menu_items and migrate data
-- This fixes the issue where renaming a category breaks item links

-- Step 1: Add category_id column
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL;

-- Step 2: Make old category column nullable (no longer required)
ALTER TABLE public.menu_items 
ALTER COLUMN category DROP NOT NULL;

-- Step 3: Migrate existing data - match items to categories by name
UPDATE public.menu_items mi
SET category_id = mc.id
FROM public.menu_categories mc
WHERE mi.category = mc.name_en;

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);

-- Step 5: Add comment explaining the change
COMMENT ON COLUMN public.menu_items.category_id IS 'Foreign key to menu_categories. Use this instead of category (name) for reliable category links.';
