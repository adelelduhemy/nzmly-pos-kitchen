-- Add infrastructure columns for robust order handling
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS idempotency_key UUID,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS location_id UUID; -- Prepared for future multi-location support

-- Add unique constraint on order_number to prevent duplicates
-- NOTE: If duplicates exist, this will fail. Manual cleanup required first.
ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);

-- Add unique constraint on idempotency_key
ALTER TABLE public.orders 
ADD CONSTRAINT orders_idempotency_key_key UNIQUE (idempotency_key);

-- Add check constraint for status to ensure validity
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'paid', 'void'));
