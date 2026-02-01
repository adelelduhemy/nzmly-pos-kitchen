-- Add image_url column to menu_categories for category images
ALTER TABLE public.menu_categories 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add items_count helper (optional - we'll calculate dynamically)