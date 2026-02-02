-- Add payment_status column to orders table
ALTER TABLE public.orders
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- Add check constraint for valid payment statuses
ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('unpaid', 'paid'));

-- Update existing orders to have payment_status
-- Set to 'paid' if status is 'paid', otherwise 'unpaid'
UPDATE public.orders
SET payment_status = CASE 
  WHEN status = 'paid' THEN 'paid'
  ELSE 'unpaid'
END;

-- Create index for payment_status for better query performance
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);

-- Update status to remove 'paid' from workflow statuses
-- Change any 'paid' status to 'served' in the workflow
UPDATE public.orders
SET status = 'served'
WHERE status = 'paid';
