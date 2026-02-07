-- Fix RLS policies for inventory_transactions table
-- Allow authenticated users to insert and view inventory transactions

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert inventory transactions" ON public.inventory_transactions;

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all transactions
CREATE POLICY "Allow authenticated users to view inventory transactions"
ON public.inventory_transactions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert inventory transactions"
ON public.inventory_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);
