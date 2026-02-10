-- Add missing columns to restaurant_settings for Settings page
ALTER TABLE public.restaurant_settings
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS branch_code TEXT;
